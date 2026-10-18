#!/usr/bin/env python3
"""Compile the authored world bible against the actual atlas; never mutate gameplay.
Python 3.10+, standard library only. Run at repository root or pass --root.
"""
from __future__ import annotations
import argparse, copy, hashlib, heapq, itertools, json, math, re, sys
from collections import defaultdict
from pathlib import Path

SPECIES = ('human', 'goblin', 'orc', 'serpentfolk', 'batracien', 'ape_folk')
ARMED = {'bandit_ambush','mining_interception','pasture_retaliation','kesh_raid','local_occupation','siege'}
FOOD = {'Igea':['grain','fish','meat'], 'Teremor':['grain','legumes','vegetables'], 'Sarak':['grain','dates','legumes'], 'Varan':['rice','tubers','fish'], 'Tagon':['rice','tubers','fish']}
KITS = {'Igea':'snow','Teremor':'temperate','Sarak':'arid','Varan':'marsh','Tagon':'jungle'}
ROLES = {'administrative_center':'centre administratif et marché', 'ocean_port':'port de commerce', 'metal_market':'marché du métal', 'textile_center':'centre textile', 'pastoral_relay':'relais pastoral', 'forest_depot':'dépôt forestier', 'food_market':'marché agricole', 'exchange_relay':'halte d’échange'}

def require(ok: bool, message: str) -> None:
    if not ok: raise ValueError(message)

def table(rows: list, columns: list[str]) -> list[dict]:
    require(all(len(r)==len(columns) for r in rows), 'Mauvaise largeur de table : '+','.join(columns))
    return [dict(zip(columns,r)) for r in rows]

def unique(rows: list[dict], key: str='id') -> dict:
    out={r[key]:r for r in rows}
    require(len(out)==len(rows), 'Identifiant dupliqué : '+key)
    return out

def allocate(total: int, weights: list[float]) -> list[int]:
    require(isinstance(total,int) and total>=0, 'Effectif invalide')
    require(bool(weights) and all(math.isfinite(x) and x>=0 for x in weights) and sum(weights)>0, 'Poids invalides')
    raw=[total*w/sum(weights) for w in weights]; result=[math.floor(x) for x in raw]
    for i in sorted(range(len(raw)),key=lambda i:(-(raw[i]-result[i]),i))[:total-sum(result)]: result[i]+=1
    require(sum(result)==total,'Conservation des effectifs')
    return result

def percentages(counts: list[int]) -> dict:
    if not sum(counts): return dict.fromkeys(SPECIES,0.0)
    return dict(zip(SPECIES,[x/100 for x in allocate(10000,counts)]))

def stable(text: str) -> int:
    return int.from_bytes(hashlib.sha256(text.encode()).digest()[:8],'big')

def event_chance(rule: dict, signals: dict, hours: float=1) -> float:
    require(math.isfinite(hours) and hours>=0,'Pas temporel invalide')
    if rule['transitionOnly'] or not all(signals.get(k) is True for k in rule['requires']): return 0.0
    return -math.expm1(-rule['lambdaPerEligibleDay']*hours/24)

def validate(source: dict) -> dict:
    require(source.get('schema')==2 and tuple(source['species'])==SPECIES,'Schéma/espèces incompatible')
    factions=unique([dict(zip(('id','name','kind','sovereign'),r)) for r in source['factions']])
    regions=unique(table(source['regions'],source['regionColumns']))
    resources=unique(table(source['resources'],source['resourceColumns']))
    relations=table(source['relations'],source['relationColumns'])
    rules=unique(table(source['eventRules'],source['eventColumns']))
    require(len(regions)==source['expectedRegions'],'Couverture des régions')
    require(len(source['territoryOrder'])==5 and len(set(source['territoryOrder']))==5,'Ordre des territoires')
    require(factions['sylverive']['sovereign']=='teremor','Sylverive doit conserver sa charte sous Teremor')
    require(all(f['sovereign'] is None or f['sovereign'] in factions for f in factions.values()),'Souverain inconnu')
    for r in regions.values():
        require(r['territory'] in source['territoryOrder'] and r['authority'] in factions,'Région/autorité inconnue')
        require(isinstance(r['designPopulation'],int) and r['designPopulation']>0 and 0<r['namedSettlementPct']<100,'Population régionale')
        for k in ('ruralSpeciesPct','townSpeciesPct'):
            require(len(r[k])==len(SPECIES) and all(isinstance(v,(int,float)) and math.isfinite(v) and v>=0 for v in r[k]) and sum(r[k])==100,'Pourcentages : '+str(r['id']))
        require(set(r['specialties'])<=resources.keys(),'Spécialité inconnue')
        require(set(r['disputes'])<=source['disputes'].keys(),'Contentieux régional inconnu')
    for r in resources.values():
        require(len(r['territoryLevel'])==5 and all(c in '012345' for c in r['territoryLevel']),'Potentiel invalide : '+r['id'])
        require(isinstance(r['storageDays'],int) and r['storageDays']>=0,'Conservation invalide')
        require(all(inputs and set(inputs)<=resources.keys() for inputs in r['inputAlternatives']),'Intrant inconnu : '+r['id'])
        require(r['kind']!='processed' or r['inputAlternatives'],'Produit sans chaîne : '+r['id'])
    visiting=set();done=set()
    def visit(rid):
        require(rid not in visiting,'Cycle de recette : '+rid)
        if rid in done:return
        visiting.add(rid)
        for branch in resources[rid]['inputAlternatives']:
            for dep in branch:visit(dep)
        visiting.remove(rid);done.add(rid)
    for rid in resources:visit(rid)
    expected={frozenset(p) for p in itertools.combinations(factions,2)}
    actual=[frozenset((r['a'],r['b'])) for r in relations]
    require(len(actual)==len(set(actual)) and set(actual)==expected,'Matrice diplomatique incomplète/dupliquée')
    for r in relations:
        require(set(r['trade'])<=resources.keys(),'Commerce de ressource inconnue')
        require(r['dispute']=='none' or r['dispute'] in source['disputes'],'Contentieux diplomatique inconnu')
        require(all(isinstance(r[k],str) and r[k] for k in ('state','aWants','bWants','escalation','offramp')),'Relation sans intérêts/issue')
    for d in source['disputes'].values():
        require(set(d['parties'])<=factions.keys() and d['requires'] and d['offramp'],'Contentieux incomplet')
    for rid,levels in source['regionalOverrides'].items():
        require(int(rid) in regions and set(levels)<=resources.keys(),'Dérogation régionale inconnue')
        require(all(isinstance(v,int) and 0<=v<=5 for v in levels.values()),'Dérogation hors plage')
    for r in rules.values():
        require(set(r['regions'])<=regions.keys() and r['requires'],'Événement sans région/cause')
        require(all(isinstance(v,(int,float)) and math.isfinite(v) and v>=0 for v in [r['lambdaPerEligibleDay'],r['cooldownDays'],r['durationHours']]),'Fréquence/durée invalide')
        require(isinstance(r['transitionOnly'],bool),'Transition invalide')
        require(not r['transitionOnly'] or r['lambdaPerEligibleDay']==0,'Transition ne doit pas être tirée au hasard')
        require(event_chance(r,{})==0,'Un incident sans signaux doit être impossible')
    require(len({n['id'] for n in source['networks']})==len(source['networks']),'Réseau dupliqué')
    for n in source['networks']:
        require(set(n['regions'])<=regions.keys() and set(n['actorsConcerned'])<=factions.keys(),'Réseau hors référentiel')
        require(set(n['goods'])<=resources.keys() and n['rule'] in rules,'Marchandise/règle de réseau inconnue')
    return dict(factions=factions,regions=regions,resources=resources,relations=relations,rules=rules)

def region_id(site):
    value=site.get('regionId',site.get('region'))
    if isinstance(value,dict):value=value.get('id')
    return int(value)

def coords(p):
    return (float(p['x']),float(p['y'])) if isinstance(p,dict) else (float(p[0]),float(p[1]))

def vertex(p):
    if isinstance(p,(list,tuple)) and len(p)>2 and p[2] is not None:return 'c:'+str(p[2])
    x,y=coords(p);return f'xy:{x:.3f}:{y:.3f}'

def point_inside(poly,x,y):
    inside=False;j=len(poly)-2
    for i in range(0,len(poly),2):
        ax,ay,bx,by=poly[i],poly[i+1],poly[j],poly[j+1]
        if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax:inside=not inside
        j=i
    return inside

class TerrainIndex:
    def __init__(self,atlas):
        # A compact layout divides every distance by its scale; buckets follow.
        self.buckets=defaultdict(list);self.size=64000/((atlas.get('layout') or {}).get('scale') or 1);size=self.size
        for c in atlas.get('cells',[]):
            if not isinstance(c,list) or len(c)<10 or not c[3]:continue
            poly=c[9]
            if not isinstance(poly,list) or len(poly)<6 or len(poly)%2:continue
            for gx in range(math.floor(min(poly[::2])/size),math.floor(max(poly[::2])/size)+1):
                for gy in range(math.floor(min(poly[1::2])/size),math.floor(max(poly[1::2])/size)+1):self.buckets[gx,gy].append(c)
    def region_at(self,x,y):
        for c in self.buckets.get((math.floor(x/self.size),math.floor(y/self.size)),[]):
            if point_inside(c[9],x,y):return int(c[6])
        return None

def transport(atlas,sites,region_map):
    terrain=TerrainIndex(atlas);graph=defaultdict(list);vpos={};routes=[];by_site=defaultdict(list);binding={};aliases={}
    own_vertex={str(s['id']):s['vertex'] for s in atlas.get('sites',[]) if isinstance(s,dict) and s.get('vertex') is not None}
    for s in sites:
        for alias in [s['atlasId'],str(s.get('sourceId','')),s['atlasId'].removeprefix('bourg-').removeprefix('town-')]:
            if alias:aliases[alias]=s['atlasId']
    for r in atlas.get('routes',[]):
        pts=r.get('points',r.get('pts',[]))
        if len(pts)<2:continue
        rid=str(r['id']);kind=r.get('type',r.get('kind','unknown'));sea=kind in ('sea','searoutes','seaRoute')
        keys=[vertex(p) for p in pts]
        for k,p in zip(keys,pts):vpos[k]=coords(p)
        length=0.0
        for ka,kb in zip(keys,keys[1:]):
            d=math.dist(vpos[ka],vpos[kb]);length+=d
            if d>0:graph[ka].append((kb,d,sea,rid));graph[kb].append((ka,d,sea,rid))
        touching=set();rr=set()
        for field,k in [('fromSite',keys[0]),('toSite',keys[-1])]:
            sid=aliases.get(str(r.get(field,'')))
            if sid:
                touching.add(sid)
                s=next(s for s in sites if s['atlasId']==sid)
                if math.dist(vpos[k],(s['x'],s['y']))<=300:binding.setdefault(sid,k)
        for p in pts:
            x,y=coords(p);reg=terrain.region_at(x,y)
            if reg in region_map:rr.add(reg)
        routes.append({'atlasRouteId':rid,'name':r.get('name',rid),'mode':'boat' if sea else 'land','lengthM':round(length,1),'regions':sorted(rr),'siteIds':sorted(touching),'_keys':set(keys)})
    for s in sites:
        # Compact atlases give each settlement its own route vertex; older ones share the cell.
        key=own_vertex.get(s['atlasId'],s.get('cell'));exact='c:'+str(key)
        if key is not None and exact in graph:binding[s['atlasId']]=exact
        if s['atlasId'] not in binding and vpos:
            k=min(vpos,key=lambda k:math.dist(vpos[k],(s['x'],s['y'])))
            if math.dist(vpos[k],(s['x'],s['y']))<=300:binding[s['atlasId']]=k
        bound=binding.get(s['atlasId'])
        for r in routes:
            if bound in r['_keys'] or s['atlasId'] in r['siteIds']:
                by_site[s['atlasId']].append(r['atlasRouteId'])
                r['siteIds']=sorted(set(r['siteIds'])|{s['atlasId']})
                r['regions']=sorted(set(r['regions'])|{s['regionId']})
    for r in routes:del r['_keys']
    def distances(start):
        if start not in binding:return {}
        origin=binding[start];dist={origin:0.0};boats={origin:False};queue=[(0.0,origin)]
        while queue:
            d,u=heapq.heappop(queue)
            if d!=dist[u]:continue
            for v,c,sea,_ in graph[u]:
                nd=d+c
                if nd<dist.get(v,float('inf')):
                    dist[v]=nd;boats[v]=boats[u] or sea;heapq.heappush(queue,(nd,v))
        return {sid:{'distanceM':round(dist[v],1),'requiresBoat':boats[v]} for sid,v in binding.items() if v in dist and sid!=start}
    matrix={s['atlasId']:distances(s['atlasId']) for s in sites}
    return routes,by_site,matrix,binding,terrain

def urban_mix(region,site,seed):
    mix=list(region['townSpeciesPct']);shift=stable(f'{seed}:{site["atlasId"]}:mix')%5-2
    if mix[1]+shift>=0:mix[0]-=shift;mix[1]+=shift
    if site['waterfront']=='ocean_port':mix[0]-=1;mix[2]+=1
    require(min(mix)>=0 and sum(mix)==100,'Profil urbain invalide')
    return mix

def rural_clusters(region,counts):
    remaining=list(counts);clusters=[]
    for i,fraction,native_share in [(1,.65,.70),(2,.75,.80),(3,.95,.95),(4,.85,.75),(5,.85,.75)]:
        native=math.floor(counts[i]*fraction)
        if not native:continue
        other=min(remaining[0],round(native*(1-native_share)/native_share))
        values=[0]*len(SPECIES);values[0]=other;values[i]=native
        remaining[0]-=other;remaining[i]-=native
        clusters.append({'id':f'rural-{region["id"]}-{SPECIES[i]}','kind':'unplaced_habitat_distribution_not_new_city','coordinates':None,'counts':dict(zip(SPECIES,values)),'speciesPct':percentages(values),'placementRequirements':['safe_water','food_or_regular_supply','lawful_or_contested_land_right','shelter','verified_walkable_ground']+(['thermal_habitat'] if i==3 else ['wetland_water_access'] if i==4 else ['dry_walkable_ground','forest_or_garden_access','seasonal_clothing'] if i==5 else [])})
    require(all(x>=0 for x in remaining),'Population rurale négative')
    return {'mixedAndDispersedCounts':dict(zip(SPECIES,remaining)),'concentratedHabitatGroups':clusters}

def compile_ape_folk(authored,result,data,matrix):
    a=copy.deepcopy(authored);sites={s['atlasId']:s for s in result['settlements']}
    require(a['id']=='ape_folk' and a['globalFaction'] is None and a['hostilityBySpecies'] is False,'Les hommes-singes ne sont pas une faction raciale')
    communities=unique(a['communities']);structures=unique(a['structures']);activities=unique(a['activities']);roles=unique(a['roles'])
    require({r['actor'] for r in a['relations']}==set(data['factions']) and len(a['relations'])==len(data['factions']),'Contacts politiques incomplets')
    require({r['species'] for r in a['speciesContacts']}==set(SPECIES)-{'ape_folk'},'Contacts entre espèces incomplets')
    for rel in a['relations']:
        require(set(rel['trade'])<=data['resources'].keys(),'Ressource de relation inconnue')
        require(rel['automaticWar'] is False and all(rel[k] for k in ('apeWants','otherWants','escalation','offramp')),'Relation sans intérêts ou conflit racial')
        require(rel['dispute']=='none' or rel['dispute'] in result['disputes'],'Contentieux de contact inconnu')
    for st in structures.values():
        require(set(st['materials'])<=data['resources'].keys(),'Matériaux de structure inconnus')
        require(len(st['footprintTiles'])==2 and all(isinstance(n,int) and n>0 for n in st['footprintTiles']) and st['tilePixels']==16,'Empreinte de structure invalide')
        require(st['status']=='to_author','Bâtiment non construit déclaré actif')
    for act in activities.values():
        require(set(act['resources'])<=data['resources'].keys(),'Ressource d’activité inconnue')
        require(act['workspace'] in structures or act['workspace'] in ('ground','safe_path','escape_path'),'Poste de travail inconnu')
        require(act['sexes']==['male','female'] and act['allTones'] is True and act['productionIsAutomatic'] is False,'Activité discriminatoire ou production fictive')
        require(act['status'] in ('implemented','to_create') and act['priority'] in (0,1,2,3),'Statut d’activité invalide')
    implemented={x['id'] for x in activities.values() if x['status']=='implemented'}
    require(implemented=={'idle','walk','flee','talk'}==set(a['art']['implementedClips']),'Animations déclarées prêtes sans source')
    for role in roles.values():
        require(set(role['activities'])<=activities.keys() and set(role['structures'])<=structures.keys(),'Métier avec activité/structure inconnue')
        require(role['sexes']==['male','female'] and role['allTones'],'Restriction de métier non justifiée')
    for c in communities.values():
        require(set(c['regions'])<=data['regions'].keys() and set(c['goods'])<=data['resources'].keys() and not c['sharedSpeciesCommand'],'Communauté hors référence ou commandement racial')
        require(c['siteIds'] and len(c['siteIds'])==len(set(c['siteIds'])),'Localités de communauté dupliquées')
        for sid in c['siteIds']:
            require(sid in sites,'Localité de communauté inconnue : '+sid)
            require(sites[sid]['regionId'] in c['regions'] and sites[sid]['speciesCounts']['ape_folk']>0,'Communauté sans habitants ou hors région : '+sid)
        c['namedSitesApeResidents']=sum(sites[sid]['speciesCounts']['ape_folk'] for sid in c['siteIds'])
        c['populationNote']='Named-site residents only, not a total for the rural community and not a quota of spawned actors.'
    seen=set()
    for st in a['settlements']:
        sid=st['siteId'];require(sid in sites and sid not in seen,'Implantation inconnue/dupliquée : '+sid);seen.add(sid)
        s=sites[sid];require(st['communityId'] in communities and sid in communities[st['communityId']]['siteIds'],'Rattachement local invalide')
        require(st['name']==s['name'] and st['regionId']==s['regionId'],'Nom/région modifié sans atlas')
        require(st['runtimeSiteId']=='town-'+sid,'Alias runtime de localité invalide')
        st.update(territory=s['territory'],designApeResidents=s['speciesCounts']['ape_folk'],designApePct=s['speciesPct']['ape_folk'],designBatracienPct=s['speciesPct']['batracien'],atlasRouteIds=s['atlasRouteIds'],coordinates={'x':s['x'],'y':s['y']},buildingsPlaced=False,runtimeActorsSpawned=False)
    require(seen=={sid for c in communities.values() for sid in c['siteIds']},'Implantations et communautés désaccordées')
    a['routeOptions']=[]
    for intent in a['routeIntents']:
        f,t=intent['fromSiteId'],intent['toSiteId'];require(f in seen and t in seen,'Itinéraire hors implantations')
        path=matrix[f].get(t)
        a['routeOptions'].append({**intent,**(path or {}),'graphStatus':'existing_path_requires_stock_contract_and_safety' if path else 'unavailable_no_route_invented'})
        if path and sites[f]['territory']!=sites[t]['territory'] and ('Tagon' in (sites[f]['territory'],sites[t]['territory']) or 'Varan' in (sites[f]['territory'],sites[t]['territory'])):
            require(path['requiresBoat'],'Un voyage vers une île ne peut devenir une marche')
    for binding in a['eventBindings']:
        require(binding['rule'] in data['rules'] and binding['communityId'] in communities,'Événement ou communauté inconnu')
        require(binding['dispute']=='none' or binding['dispute'] in result['disputes'],'Contentieux local inconnu')
        eligible=sorted(set(data['rules'][binding['rule']]['regions'])&set(communities[binding['communityId']]['regions']))
        require(eligible and binding['requires'] and binding['resolution'],'Événement hors région ou sans cause/issue')
        require(binding['runtimeEnabled'] is False and binding['createsNewEventType'] is False,'Activation de moteur non autorisée par données de conception')
        binding['eligibleRegionIds']=eligible
    a['demography']={'worldApeResidents':result['world']['speciesCounts']['ape_folk'],'worldApePct':result['world']['speciesPct']['ape_folk'],'territories':[{'territory':t['name'],'apeResidents':t['speciesCounts']['ape_folk'],'apePctOfTerritory':t['speciesPct']['ape_folk'],'shareOfAllApeResidents':round(100*t['speciesCounts']['ape_folk']/result['world']['speciesCounts']['ape_folk'],2)} for t in result['territories']]}
    return a

def ape_activities_md(a):
    lines=['# Hommes-singes — programme de fabrication généré','','Source : `ape-folk.json`. Les statuts ci-dessous conservent le plan initial de conception (quatre animations de base marquées `implemented`) ; ils ne recensent pas les ressources visuelles livrées depuis. Le module `sprites/hommes-singes/activites.js` couvre désormais les 55 activités et 16 fonctions : voir [les tenues et activités](../../hommes-singes-activites.md) et `data/hommes-singes/activities-manifest.json`. Les structures, routines et apparitions en jeu restent à intégrer. Les activités ne créent aucun stock automatiquement.','','| Priorité | ID | Activité | État du plan initial | Accessoires | Poste | Repères de contact |','|---|---|---|---|---|---|---|']
    for x in sorted(a['activities'],key=lambda x:(x['priority'],x['family'],x['id'])):
        lines.append('| P'+str(x['priority'])+' | `'+x['id']+'` | '+md(x['label'])+' | '+x['status']+' | '+(', '.join(x['props']) or '—')+' | '+x['workspace']+' | '+(', '.join(x['markers']) or '—')+' |')
    lines+=['','## Tenues et fonctions','','Les tenues sont disponibles dans le module visuel ; les descriptions suivantes restent les consignes de conception.','','| Fonction | Activités | Structures | Description de tenue |','|---|---|---|---|']
    for r in a['roles']:lines.append('| '+md(r['label'])+' | '+', '.join(r['activities'])+' | '+', '.join(r['structures'])+' | '+md(r['outfitBrief'])+' |')
    lines+=['','## Implantations existantes, quartiers à construire','','| Localité | ID atlas / runtime | Communauté | Hommes-singes % | Batraciens % | Résidents hommes-singes de conception |','|---|---|---|---:|---:|---:|']
    for s in a['settlements']:lines.append('| '+md(s['name'])+' | '+s['siteId']+' / '+s['runtimeSiteId']+' | '+s['communityId']+' | '+str(s['designApePct'])+' | '+str(s['designBatracienPct'])+' | '+str(s['designApeResidents'])+' |')
    lines+=['','## Structures à fabriquer','','| Structure | Empreinte en tuiles de 16 px | Matériaux | Condition de placement |','|---|---|---|---|']
    for s in a['structures']:lines.append('| '+md(s['label'])+' | '+' × '.join(map(str,s['footprintTiles']))+' | '+', '.join(s['materials'])+' | '+md(s['placement'])+' |')
    return '\n'.join(lines)+'\n'

def compile_world(atlas,source):
    data=validate(source);regs=data['regions'];resources=data['resources'];rules=data['rules']
    rawregs=unique(atlas['regions']);rawsites=atlas.get('sites',[])
    require(len(rawsites)==source['expectedSites'],'Nombre de localités différent : réviser explicitement expectedSites')
    require(set(rawregs)==set(regs),'Régions de l’atlas et de la bible différentes')
    ocean_ids={str(p['id']) for p in atlas.get('ports',[]) if isinstance(p,dict) and 'id' in p}
    sites=[];warnings=[]
    for raw in rawsites:
        s=copy.deepcopy(raw);sid=str(s['id']);reg=region_id(s)
        require(reg in regs,'Région de localité inconnue : '+sid)
        territory=s.get('territory',rawregs[reg].get('territory',rawregs[reg].get('continent')))
        require(territory==regs[reg]['territory'],'Territoire incohérent : '+sid)
        x,y=coords(s);require(math.isfinite(x) and math.isfinite(y) and 0<=x<=atlas['width'] and 0<=y<=atlas['height'],'Coordonnées invalides : '+sid)
        waterfront='ocean_port' if s.get('oceanPort') is True or sid in ocean_ids else 'inland_waterfront' if s.get('port') else 'inland'
        sites.append({'atlasId':sid,'sourceId':s.get('sourceId',s['id']),'name':s['name'],'x':x,'y':y,'cell':s.get('cell'),'regionId':reg,'regionName':rawregs[reg]['name'],'territory':territory,'waterfront':waterfront,'regionalCentre':bool(s.get('regionalCentre',s.get('capital',False))),'runtimeKind':s.get('kind','unspecified_in_atlas'),'atlasPopulationWeight':s.get('population',1),'sourceProperties':{k:s[k] for k in ('id','name','x','y','region','regionId','territory','kind','capital','regionalCentre','port','oceanPort') if k in s}})
    require(len({s['atlasId'] for s in sites})==len(sites),'Localité dupliquée')
    require(set(source.get('settlementOverrides',{}))<={s['atlasId'] for s in sites},'Dérogation de localité absente')
    sites.sort(key=lambda s:(s['regionId'],s['atlasId']))
    regional_resources={}
    for rid,reg in regs.items():
        ti=source['territoryOrder'].index(reg['territory']);levels={i:int(r['territoryLevel'][ti]) for i,r in resources.items()}
        for res in reg['specialties']:levels[res]=max(4,levels[res])
        levels.update(source['regionalOverrides'].get(str(rid),{}));regional_resources[rid]=levels
    aggregates=[]
    for rid,reg in regs.items():
        members=[s for s in sites if s['regionId']==rid];require(members,'Région sans localité')
        named=round(reg['designPopulation']*reg['namedSettlementPct']/100)
        weights=[s['atlasPopulationWeight'] if isinstance(s['atlasPopulationWeight'],(int,float)) and math.isfinite(s['atlasPopulationWeight']) and s['atlasPopulationWeight']>0 else 1 for s in members]
        allocations=allocate(named,weights);rural=reg['designPopulation']-named;rural_counts=allocate(rural,reg['ruralSpeciesPct']);all_counts=list(rural_counts)
        for s,pop in zip(members,allocations):
            override=source.get('settlementOverrides',{}).get(s['atlasId'],{})
            require(set(override)<={'speciesPct','focus','designRole','note'},'Dérogation interdite : '+s['atlasId'])
            mix=override.get('speciesPct',urban_mix(reg,s,atlas.get('seed',0)))
            require(len(mix)==len(SPECIES) and min(mix)>=0 and sum(mix)==100,'Pourcentages de dérogation')
            counts=allocate(pop,mix);all_counts=[a+b for a,b in zip(all_counts,counts)]
            levels=regional_resources[rid];focuses=[r for r in reg['specialties'] if levels[r]>0 and (r!='boats' or s['waterfront']=='ocean_port')]
            focus=override.get('focus',focuses[stable(s['atlasId']+':focus')%len(focuses)])
            require(focus in resources and levels[focus]>0,'Spécialité locale invalide')
            role='ocean_port' if s['waterfront']=='ocean_port' else 'administrative_center' if s['regionalCentre'] else 'metal_market' if resources[focus]['kind']=='mineral' else 'textile_center' if focus in ('cloth','flax','wool','cotton','fiber','dyes') else 'pastoral_relay' if focus in ('pack_animals','meat','leather') else 'forest_depot' if focus in ('timber','naval_timber','resin') else 'food_market' if focus in FOOD[s['territory']] else 'exchange_relay'
            role=override.get('designRole',role);require(role in ROLES,'Rôle inconnu')
            output=[focus]
            processing={'iron_ore':['iron','tools'],'copper_ore':['copper'],'tin_ore':['tin'],'grain':['flour','provisions'],'flax':['cloth'],'cotton':['cloth'],'fiber':['rope'],'hides':['leather']}.get(focus,[])
            output+= [v for v in processing if levels[v]>=2]
            if s['waterfront']=='ocean_port' and levels['boats']>=3:output+=['boats','rope']
            output=sorted(set(output));inputs=set()
            for res in output:
                alternatives=resources[res]['inputAlternatives']
                if alternatives:inputs.update(max(alternatives,key=lambda branch:sum(levels[d] for d in branch)))
            needs=sorted((set(FOOD[s['territory']])|{'water','firewood','salt','tools','cloth'}|inputs)-set(output))
            s.update(designRole=role,roleLabel=ROLES[role],focus=focus,designPopulation=pop,speciesCounts=dict(zip(SPECIES,counts)),speciesPct=percentages(counts),authoredSpeciesPct=dict(zip(SPECIES,mix)),authority=reg['authority'],sovereign=data['factions'][reg['authority']]['sovereign'],jurisdiction='local-'+s['atlasId'],productionIntent=output,productionStatus='planned_capacity_not_current_stock_or_verified_deposit',needs=needs,hinterlandSpecialties=reg['specialties'],disputes=reg['disputes'],patrolAuthority=reg['authority'],eventRuleIds=[e['id'] for e in rules.values() if rid in e['regions'] and (e['id']!='port_seizure' or s['waterfront']=='ocean_port')],criminalNetworks=[n['id'] for n in source['networks'] if rid in n['regions']],artKit=KITS[s['territory']],visitorPolicy='route_and_profession_based_not_resident_quota',placementRequirements=['preserve_atlas_coordinates','verify_water_access','verify_food_hinterland','verify_walkable_neighborhoods','provide_safe_civilian_refuge','separate_polluting_workshops'],note=override.get('note','Rôle de conception déterministe ; le bâti et les stocks du jeu ne sont pas modifiés.'))
        require(sum(all_counts)==reg['designPopulation'],'Conservation régionale')
        aggregates.append({'id':rid,'name':rawregs[rid]['name'],'territory':reg['territory'],'designPopulation':reg['designPopulation'],'namedPopulation':named,'ruralPopulation':rural,'speciesCounts':dict(zip(SPECIES,all_counts)),'speciesPct':percentages(all_counts),'ruralSpeciesCounts':dict(zip(SPECIES,rural_counts)),'ruralDistribution':rural_clusters(reg,rural_counts),'resourceLevels':regional_resources[rid],'authority':reg['authority'],'disputes':reg['disputes']})
    routes,links,matrix,binding,terrain=transport(atlas,sites,regs)
    for s in sites:
        sid=s['atlasId'];s['atlasRouteIds']=sorted(set(links[sid]));s['networkBindingStatus']='existing_graph_within_300m' if sid in binding else 'requires_access_review'
        if sid not in binding:warnings.append('Accès au graphe à vérifier : '+sid)
        landreg=terrain.region_at(s['x'],s['y'])
        s['terrainReview']='not_verified' if landreg is None else 'same_region_land' if landreg==s['regionId'] else 'atlas_region_boundary_review'
        if s['terrainReview']!='same_region_land':warnings.append('Sol/frontière à vérifier, sans déplacement : '+sid)
        suppliers={}
        for res in s['needs']:
            candidates=[]
            for partner in sites:
                pid=partner['atlasId'];path=matrix[sid].get(pid)
                if pid==sid or path is None or res not in partner['productionIntent']:continue
                candidates.append({'siteId':pid,**path,'status':'potential_supplier_requires_stock_and_contract'})
            suppliers[res]=sorted(candidates,key=lambda c:(c['distanceM'],c['siteId']))[:3]
        s['supplierOptions']=suppliers
        s['unassignedSupplyNeeds']=[res for res,options in suppliers.items() if not options]
        s['supplyFallback']='Local verified household/hinterland production or a manually authored contract; no invented shipment.'
    for r in routes:
        r['authorities']=sorted({regs[rid]['authority'] for rid in r['regions']})
        r['disputes']=sorted({d for rid in r['regions'] for d in regs[rid]['disputes']})
        r['eventRuleIds']=[e['id'] for e in rules.values() if set(r['regions'])&set(e['regions']) and (r['mode']!='boat' or e['id'] in ('caravan','patrol','port_seizure','weather_hazard'))]
        r['eligibilityNotice']='Potential context only; every required causal signal and mandate must still be supplied.'
    territories=[]
    for name in source['territoryOrder']:
        rs=[r for r in aggregates if r['territory']==name];counts=[sum(r['speciesCounts'][sp] for r in rs) for sp in SPECIES]
        territories.append({'name':name,'designPopulation':sum(counts),'speciesCounts':dict(zip(SPECIES,counts)),'speciesPct':percentages(counts),'regionIds':[r['id'] for r in rs]})
    world_counts=[sum(t['speciesCounts'][sp] for t in territories) for sp in SPECIES]
    relations=[]
    for r in data['relations']:
        relations.append({**r,'id':'--'.join(sorted((r['a'],r['b']))),'automaticMilitaryAssistance':False,'speciesHostility':False,'localMandateRequired':True})
    result={'settlements':sites,'regions':aggregates,'territories':territories,'world':{'designPopulation':sum(world_counts),'speciesCounts':dict(zip(SPECIES,world_counts)),'speciesPct':percentages(world_counts)},'resources':list(resources.values()),'relations':relations,'events':list(rules.values()),'networks':source['networks'],'disputes':source['disputes'],'routes':routes,'warnings':sorted(set(warnings))}
    if source.get('apeFolk'):result['apeFolk']=compile_ape_folk(source['apeFolk'],result,data,matrix)
    return result

def jtext(value):return json.dumps(value,ensure_ascii=False,indent=2,sort_keys=True)+'\n'
def md(value):return str(value).replace('|','/').replace('\n',' ')

def outputs(result,hashes):
    out={}
    for name in ('settlements','regions','territories','world','resources','relations','events','networks','disputes','routes'):
        out['data/world/bible/generated/'+name+'.json']=jtext(result[name])
    counts={'sites':len(result['settlements']),'regions':len(result['regions']),'resources':len(result['resources']),'relations':len(result['relations']),'eventRules':len(result['events']),'networks':len(result['networks']),'routes':len(result['routes'])}
    manifest={'schema':2,'status':'validated_design_not_runtime_activation','inputSHA256':hashes,'counts':counts,'warnings':result['warnings'],'preserved':['atlas_coordinates','atlas_names','atlas_ids','runtime_HTML','save_data'],'checks':['source_references','complete_pair_matrix','population_conservation','percentage_totals','resource_dependency_DAG','cause_required_for_events','deterministic_output']}
    if 'apeFolk' in result:
        a=result['apeFolk'];out['data/world/bible/generated/ape-folk.json']=jtext(a)
        counts.update(apeCommunities=len(a['communities']),apeActivities=len(a['activities']),apeRoles=len(a['roles']),apeStructures=len(a['structures']))
        out['docs/world-bible/generated/ape-activities.md']=ape_activities_md(a)
    out['data/world/bible/generated/manifest.json']=jtext(manifest)
    lines=['# Registre des localités — généré','', 'Source : atlas réel + bible. Les rôles, populations et productions sont de conception ; aucun bâtiment n’est déclaré déjà construit.','']
    for s in result['settlements']:
        mix=' ; '.join(f'{sp} {s["speciesPct"][sp]:.2f} % ({s["speciesCounts"][sp]})' for sp in SPECIES)
        lines += [f'## {md(s["name"])} — `{s["atlasId"]}`','',f'**Situation :** {s["territory"]}, {md(s["regionName"])} ; x={s["x"]:g} m, y={s["y"]:g} m. Coordonnées conservées.',f'**Rôle :** {s["roleLabel"]} ; spécialité `{s["focus"]}` ; statut d’eau `{s["waterfront"]}`.',f'**Pouvoir :** `{s["authority"]}` ; juridiction `{s["jurisdiction"]}` ; souverain {s["sovereign"] or "accords locaux, pas de souverain commun"}.',f'**Population de conception :** {s["designPopulation"]:,} résidents. {mix}.',f'**Production envisagée :** {", ".join(s["productionIntent"])}. District/atelier à vérifier, pas un stock créé.',f'**Besoins :** {", ".join(s["needs"])}.',f'**Arrière-pays :** {", ".join(s["hinterlandSpecialties"])}.',f'**Accès existants :** {", ".join(s["atlasRouteIds"]) or "à vérifier"} ; {s["networkBindingStatus"]} ; {s["terrainReview"]}.',f'**Patrouille compétente :** {s["patrolAuthority"]}, seulement avec mandat et moyens.',f'**Contentieux pertinents :** {", ".join(s["disputes"])} ; aucun n’est automatiquement une bataille.',f'**Incidents admissibles sous conditions :** {", ".join(s["eventRuleIds"])}.',f'**Réseaux à contextualiser :** {", ".join(s["criminalNetworks"]) or "aucun réseau prédéfini"}. Présence conditionnelle, pas complicité de la ville entière.',f'**Kit :** {s["artKit"]} ; profession, moyens et anatomie séparés. Refuges, eau, réserve alimentaire et accès praticable requis.', '**Fournisseurs potentiels sur graphe :**']
        for res,options in s['supplierOptions'].items():
            if options:lines.append('- '+res+' : '+', '.join(f'{o["siteId"]} ({o["distanceM"]/1000:.1f} km'+('; bateau' if o['requiresBoat'] else '; terre')+')' for o in options)+'. Stock et contrat à vérifier.')
        lines += [f'Besoins sans fournisseur spécialisé affecté : {", ".join(s["unassignedSupplyNeeds"]) or "aucun"}. Vérifier production domestique/arrière-pays ou ajouter un contrat ; ne pas créer une cargaison fictive.',s['note'],'']
    out['docs/world-bible/generated/settlements.md']='\n'.join(lines)+'\n'
    lines=['# Démographie pondérée — générée','','Toutes les valeurs sont des choix de conception. Résidents nommés + arrière-pays = population régionale. Les pourcentages affichés sont arrondis par plus forts restes à 0,01 point et totalisent 100 %.','','| Territoire / région | Population | Humains % | Gobelins % | Orques % | Hommes-serpents % | Batraciens % | Hommes-singes % |','|---|---:|---:|---:|---:|---:|---:|---:|']
    for r in result['territories']+result['regions']+[dict(result['world'],name='MONDE')]:lines.append('| '+md(r['name'])+' | '+str(r['designPopulation'])+' | '+' | '.join(f'{r["speciesPct"][sp]:.2f}' for sp in SPECIES)+' |')
    lines+=['','Les groupes ruraux concentrés sont détaillés dans `regions.json`. Ce sont des distributions à implanter, pas de nouvelles villes déjà placées. Les visiteurs ne sont pas comptés comme résidents.']
    out['docs/world-bible/generated/demography.md']='\n'.join(lines)+'\n'
    lines=['# Ressources × régions — généré','','Niveaux 0–5 : potentiel naturel / capacité artisanale, pas stock réel ni probabilité par case.','','| Ressource | '+' | '.join(md(r['name']) for r in result['regions'])+' |','|---|'+'---:|'*len(result['regions'])]
    for r in result['resources']:lines.append('| '+md(r['label'])+' | '+' | '.join(str(reg['resourceLevels'][r['id']]) for reg in result['regions'])+' |')
    out['docs/world-bible/generated/resources.md']='\n'.join(lines)+'\n'
    lines=['# Relations complètes — générées','','Aucune assistance militaire automatique. Chaque pacte doit avoir un mandat borné.','']
    for r in result['relations']:
        lines += [f'## {r["a"]} — {r["b"]}',f'État : `{r["state"]}`.',f'{r["a"]} demande : {r["aWants"]}.',f'{r["b"]} demande : {r["bWants"]}.',f'Échanges : {", ".join(r["trade"])}.',f'Contentieux : {r["dispute"]}. Escalade possible : {r["escalation"]}.',f'Issue : {r["offramp"]}.','']
    out['docs/world-bible/generated/relations.md']='\n'.join(lines)+'\n'
    return out,manifest

def load(root):
    paths=['data/world/atlas.json','data/world/bible/source.json'];source=json.loads((root/paths[1]).read_text())
    for field in ('relationsFile','eventsFile','peopleFile'):
        filename=source[field];require(Path(filename).name==filename,'Chemin de référence non local')
        path='data/world/bible/'+filename;paths.append(path);extra=json.loads((root/path).read_text())
        for k,v in extra.items():
            if k!='schema':require(k not in source,'Champ dupliqué : '+k);source[k]=v
    atlas=json.loads((root/paths[0]).read_text())
    hashes={p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in paths}
    hashes['scripts/build-world-bible.py']=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    return atlas,source,hashes

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parent.parent);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    try:
        atlas,source,hashes=load(args.root);result=compile_world(atlas,source);generated,manifest=outputs(result,hashes)
        for path,content in generated.items():
            target=args.root/path
            if args.check:require(target.exists() and target.read_text()==content,'Fichier dérivé absent/périmé : '+path)
            else:target.parent.mkdir(parents=True,exist_ok=True);target.write_text(content,encoding='utf-8')
        print(json.dumps({'ok':True,**manifest['counts'],'warnings':len(manifest['warnings']),'mode':'check' if args.check else 'build','designPopulation':result['world']['designPopulation']},ensure_ascii=False))
        for warning in manifest['warnings'][:12]:print('REVIEW: '+warning)
        return 0
    except (ValueError,KeyError,TypeError,OSError) as error:
        print('World bible validation failed: '+str(error),file=sys.stderr);return 1
if __name__=='__main__':sys.exit(main())
