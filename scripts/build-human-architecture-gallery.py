#!/usr/bin/env python3
"""Assemble la galerie et la couverture depuis le catalogue de concepts."""
import json
import html
from collections import Counter
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data/humains/architecture'
ART=ROOT/'art/humains/architecture'
REGIONAL={'Igea':['T09','T10','T11','T12'], 'Teremor':['T01','T02','T03','T04'],
          'Sarak':['T13','T14','T15','T16'], 'Varan':['T17','T18','T19','T20'],
          'Tagon':['T21','T22','T23','T24']}
ROLES={
 'administrative_center':['B05','B06','B08','B21','B24'],
 'food_market':['B01','B02','B05','B06','B08'],
 'metal_market':['B05','B06','B08','B09'],
 'forest_depot':['B06','B08','B12'],
 'textile_center':['B05','B08','B17','B18'],
 'pastoral_relay':['B02','B03','B04','B07','B08'],
 'exchange_relay':['B05','B06','B07','B08'],
 'ocean_port':['B05','B06','B08','B19'],
}
def dump(p,v): p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')

def build():
 c=json.loads((DATA/'concepts.json').read_text())
 settlements=json.loads((ROOT/'data/world/bible/generated/settlements.json').read_text())
 rows=[]
 for s in settlements:
  regional=REGIONAL[s['territory']]
  if s['regionName']=='Sylverive': regional=['T05','T06','T07','T08']
  resources=set(s['productionIntent']) | {s['focus']}
  district_resources=resources | set(s['hinterlandSpecialties'])
  district=[]
  if district_resources & {'iron_ore','copper_ore','tin_ore','lead_ore','silver_ore','gold'}: district.append('X01')
  if district_resources & {'building_stone','limestone'}: district.append('X02')
  if 'salt' in district_resources: district.append('X03')
  optional=[]
  for resource,items in {
   'cloth':['B17'], 'dyes':['B18'], 'rope':['B19'], 'oil':['B20'],
   'flour':['B13','B14'], 'fish':['B16'], 'provisions':['B15','B16'],
   'leather':['B11'], 'pottery':['B10'], 'glass':['B10'],
   'iron':['B09'], 'copper':['B09'], 'tin':['B09'], 'tools':['B09','B12'],
   'timber':['B12'], 'naval_timber':['T24'],
  }.items():
   if resource in resources: optional+=items
  port=s['waterfront']=='ocean_port'
  rows.append(dict(atlasId=s['atlasId'],name=s['name'],territory=s['territory'],
     region=s['regionName'],coordinates={'x':s['x'],'y':s['y']},
     humanResidents=s['speciesCounts']['human'],designRole=s['designRole'],
     runtimeKind=s['runtimeKind'],waterfront=s['waterfront'],
     regionalConcepts=regional,functionalConcepts=ROLES[s['designRole']],
     optionalProductionConcepts=sorted(set(optional)),
     conditionalDistrictConcepts=district,
     coastalConcepts=(['M28','M29','M30','M31','M32'] if port else []),
     conditionalNavalConcepts=(['X04','T24'] if port and 'boats' in resources else []),
     publicNeeds=['B22','B23','B24'],
     securityConcepts=['F01','F02','F03','F04','F05','F06','F07','F08'],
     securityStatus='options uniquement : enceinte/garnison selon mission, ressources et emplacement validés',
     placementStatus='not_placed_concept_coverage_only'))
 coverage=dict(schema=1,status='concept_function_coverage_not_settlement_plan',
   settlementCount=len(rows),territories=dict(Counter(s['territory'] for s in settlements)),
   maritimeAccessRule='waterfront=ocean_port dans la bible ; emplacement exact du quai à reprendre depuis le réseau et à vérifier sur terrain',
   conditions={
    'B13':'vent et dégagement validés', 'B14':'débit, rive et accès au cours d’eau réellement vérifiés',
    'X01':'gisement et concession validés hors place du marché', 'X02':'carrière exploitable vérifiée',
    'X03':'saline ou gisement de sel vérifié', 'X04':'accès navigable et activité de chantier validés',
    'M25-M27':'franchissement réel vérifié, aucun pont déduit du nom',
    'M33-M36':'captage, bassin et sens amont/aval vérifiés',
    'T09-hiver-T12-hiver':'enneigement météo/altitude/biome ; pas toute Igea en permanence'},
   unnamedHinterlandConcepts=['T01','T02','T09','T10','T13','T17','T18','T21','T22','B01','B02','B03','B04','B06','B12','X01','X02','X03'],
   reusableBuildingFunctions={
    'justice_local_hearing':'B21 : salle municipale ; porte et fenêtre sécurisées M17/M21 pour local de garde F01, sans bâtiment de prison imposé à chaque bourg',
    'concession_records':'B08/B21 : comptoir et archives, pas de nouvelle institution nationale',
    'licensed_adult_establishment':'T03/T05/B07 : enveloppe urbaine ou auberge, aucun signe de criminalité ou nudité automatique',
    'seigneurial_complex':'T04/F04/B21 combinables avec annexes, fortifications seulement si justifiées',
    'ritual_and_memory':'B23 : salle neutre ; symboles et croyances à définir localement',
    'civilian_refuge':'B24 : salle commune ; lits et soins en objets séparés'},
   settlements=rows)
 dump(DATA/'settlement-coverage.json',coverage)
 cards=[]
 for b in c['boards']:
  category={'building':'Bâtiments','module':'Modules','seasonal':'Hiver'}[b['kind']]
  cache='?v=2' if b['kind']=='module' else ''
  options=' '.join(x['id']+' '+x['label'] for x in b['items'])
  items=''.join('<li><b>'+html.escape(x['id'])+'</b> '+html.escape(x['label'])+'</li>' for x in b['items'])
  cards.append(f'''<article data-kind="{b['kind']}" data-search="{html.escape(b['title']+' '+options,quote=True)}">
<header><span>{category}</span><h2>{html.escape(b['title'])}</h2><a href="concepts/{b['id']}.png{cache}" target="_blank" rel="noopener">Ouvrir en grand ↗</a></header>
<a href="concepts/{b['id']}.png{cache}" target="_blank" rel="noopener" aria-label="Agrandir : {html.escape(b['title'],quote=True)}"><img src="concepts/{b['id']}.png{cache}" loading="lazy" width="1536" height="1024" alt="{html.escape(options,quote=True)}"></a><ul>{items}</ul></article>''')
 trs=''.join('<tr>'+''.join('<td>'+html.escape(str(x))+'</td>' for x in [s['name'],s['territory'],s['region'],s['designRole'],', '.join(s['regionalConcepts']+s['functionalConcepts'])])+ '</tr>' for s in rows)
 page='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hearthreaver — Architecture humaine</title><style>
:root{color-scheme:dark;font-family:system-ui,sans-serif;background:#14231e;color:#ece8d5}*{box-sizing:border-box}body{margin:0}main{max-width:1500px;margin:auto;padding:28px 20px}h1{font-size:clamp(28px,5vw,52px);margin:6px 0 16px}p{max-width:1000px;line-height:1.6;color:#c5d0c6}a{color:#70e6df}nav{display:flex;gap:8px;flex-wrap:wrap;position:sticky;top:0;background:#14231ef2;z-index:2;padding:14px 0}button,input{font:inherit;padding:11px 16px;background:#263d32;color:#ece8d5;border:1px solid #536d5e;border-radius:7px}button{cursor:pointer}button[aria-pressed=true]{background:#c8ab65;color:#14231e}input{flex:1;min-width:160px}article{margin:20px 0 34px;border:1px solid #405e4d;border-radius:12px;overflow:hidden;background:#1b3026}header{padding:18px;display:flex;gap:15px;align-items:center;flex-wrap:wrap}header span{color:#e5c574;font-size:13px;text-transform:uppercase;letter-spacing:.1em}h2{font-size:20px;margin:0;flex:1}img{display:block;width:100%;height:auto;image-rendering:pixelated}ul{padding:0 20px 18px;display:flex;flex-wrap:wrap;gap:10px 26px;list-style:none;margin:15px 0 0}li{font-size:14px;color:#c5d0c6}b{color:#e5c574}details{border:1px solid #405e4d;padding:16px;border-radius:8px;margin:24px 0}summary{cursor:pointer;font-weight:600}.table-scroll{overflow:auto}table{border-collapse:collapse;width:100%;font-size:13px}th,td{text-align:left;padding:10px;border-bottom:1px solid #405e4d;min-width:120px}.badge{color:#e5c574}footer{padding:24px 0;color:#bac8bf}[hidden]{display:none!important}@media(max-width:650px){main{padding:16px 10px}header{padding:12px}h2{font-size:17px}ul{padding:0 12px 14px;gap:8px}nav{gap:6px}button{padding:9px 12px}}
</style><main><div class="badge">HEARTHREAVER · CONCEPTS À TRANSCRIRE</div><h1>Architecture des implantations humaines</h1>
<p>22 planches + guide de raccord · 60 modèles de bâtiments · 48 pièces modulaires · 4 variantes d’hiver. Six familles visuelles : Teremor, Sylverive, Igea, Sarak, Varan et Tagon.</p>
<p><b>Bâtiments :</b> face, droite, dos, gauche. <b>Modules :</b> orientations horizontale est–ouest et verticale nord–sud dans la carte, dessus visible. <b>Escaliers :</b> de face uniquement. <b>Plateformes :</b> vues du dessus, avec barrières modulaires accolées aux bords. Sols et nature restent dans l’atlas. Humain natif de référence : 19 px ; les dimensions des planches sont des cibles de fabrication, pas des pixels runtime déjà validés.</p>
<figure style="margin:24px 0;border:1px solid #405e4d;border-radius:12px;overflow:hidden"><a href="principe-modules.png" target="_blank" rel="noopener"><img src="principe-modules.png" width="1536" height="1024" alt="Guide : mur horizontal, mur vertical vu du dessus, angle raccordé, plateformes vues du dessus, escalier de face et barrières accolées aux bords"></a><figcaption style="padding:14px">Référence de perspective : les directions sont celles de la carte. Les escaliers montent vers le haut de l’écran ; leur seconde case montre le raccord au palier. Les barrières s’assemblent séparément sur les bords des plateformes.</figcaption></figure>
<details><summary>Règles pour la future fabrication JavaScript</summary><p>Chaque vue devra reprendre un plan unique : mêmes portes, annexes, cheminées, emprise et hauteurs. Les vues PNG restent des propositions artistiques ; elles ne fournissent pas des masques ou coordonnées de sockets validés.</p><p>Décor arrière → personnages, objets et postes indépendants → décor avant. Toits, seuils, montants et garde-corps pourront être séparés. Les anneaux cyan et le personnage d’échelle sont des annotations à exclure du sprite final. Les meubles, machines, armes, animaux et transports restent des entités séparées. Les roues des moulins sont des sous-ensembles mécaniques détachables.</p><p>La neige d’Igea couvre les toitures exposées selon la saison, sans bloquer les accès. Les ports, ponts, mines, carrières et ouvrages d’eau nécessitent une vérification de leur accès réel. Les hameaux ne reçoivent pas tous des murs ou une garnison.</p></details>
<nav aria-label="Filtrer les planches"><button data-filter="all" aria-pressed="true">Tout</button><button data-filter="building" aria-pressed="false">Bâtiments</button><button data-filter="module" aria-pressed="false">Modules</button><button data-filter="seasonal" aria-pressed="false">Hiver</button><input type="search" aria-label="Rechercher une planche ou un bâtiment" placeholder="Maison, rempart, Sarak…"></nav><p id="count" aria-live="polite">22 planches</p>
'''+''.join(cards)+'''<details><summary>Couverture des 83 localités humaines du lore</summary><p>Correspondances de concepts, à adapter aux ressources locales. Ce tableau n’est pas un plan de ville et ne place aucun bâtiment en jeu.</p><div class="table-scroll"><table><thead><tr><th>Localité</th><th>Territoire</th><th>Région</th><th>Rôle de conception</th><th>Modèles proposés</th></tr></thead><tbody>'''+trs+'''</tbody></table></div></details><footer>Références : bible du monde, implantations et ressources actuelles du dépôt Conan ; postes humains approuvés. Concepts d’architecture proposés, sans modification des localités ou du jeu.</footer></main>
<script>let filter='all';const input=document.querySelector('input'),buttons=[...document.querySelectorAll('button')],cards=[...document.querySelectorAll('article')];const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();function apply(){const q=normalize(input.value);let n=0;for(const c of cards){c.hidden=!((filter==='all'||c.dataset.kind===filter)&&normalize(c.dataset.search).includes(q));if(!c.hidden)n++}document.querySelector('#count').textContent=n+' planche'+(n>1?'s':'');for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.filter===filter))}for(const b of buttons)b.onclick=()=>{filter=b.dataset.filter;apply()};input.oninput=apply;</script></html>'''
 (ART/'index.html').write_text(page)
 print(json.dumps({'localities':len(rows),'boards':len(c['boards']),'gallery':str(ART/'index.html')}))

if __name__=='__main__':build()
