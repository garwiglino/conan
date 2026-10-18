#!/usr/bin/env python3
"""Regression tests: pure design compiler, without modifying gameplay or saves."""
import copy, importlib.util, itertools, json, math, random, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
FILE=Path(__file__).with_name('build-world-bible.py')
spec=importlib.util.spec_from_file_location('world_bible',FILE);b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)

def source_data():
    folder=ROOT/'data/world/bible'
    s=json.loads((folder/'source.json').read_text())
    for field in ('relationsFile','eventsFile'):
        for k,v in json.loads((folder/s[field]).read_text()).items():
            if k!='schema':s[k]=v
    return s

def fixture():
    counts=[1,5,1,13,9,10,12,5,7,5,3,3,4,5]
    territories=['Igea']*3+['Teremor']*4+['Sarak']*3+['Varan']*2+['Tagon']*2
    atlas={'width':1440000,'height':960000,'seed':123,'regions':[],'sites':[],'routes':[],'ports':[],'cells':[]}
    previous=None;counter=0
    for rid,(n,t) in enumerate(zip(counts,territories),1):
        atlas['regions'].append({'id':rid,'name':f'Region {rid}','territory':t})
        x0=rid*80000;poly=[x0,0,x0+79000,0,x0+79000,30000,x0,30000]
        atlas['cells'].append([rid,x0+30000,15000,1,35,6,rid,1,0,poly])
        for i in range(n):
            counter+=1;x=x0+1000+i*1000;y=10000;sid=f'bourg-{counter}'
            s={'id':sid,'name':f'Site {counter}','x':x,'y':y,'regionId':rid,'territory':t,'capital':i==0,'population':100+i,'port':321 if counter==1 else False}
            atlas['sites'].append(s)
            if counter==2:atlas['ports'].append({'id':sid})
            if previous:
                atlas['routes'].append({'id':counter,'name':f'Route {counter}','kind':'road','fromSite':previous['id'],'toSite':sid,'points':[[previous['x'],previous['y']],[x,y]]})
            previous=s
    return atlas

class Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source=source_data();cls.atlas=fixture()
        # Synthetic geography uses different site IDs and region membership.
        # Real-site overrides are covered separately against the actual atlas.
        cls.source['settlementOverrides']={}
        cls.result=b.compile_world(cls.atlas,cls.source)
    def test_reference_tables(self):
        d=b.validate(self.source);self.assertEqual((len(d['regions']),len(d['resources']),len(d['relations']),len(d['rules'])),(14,54,36,17))
    def test_named_coverage_and_identity(self):
        self.assertEqual(len(self.result['settlements']),83)
        old={str(s['id']):s for s in self.atlas['sites']}
        for s in self.result['settlements']:
            self.assertEqual((s['name'],s['x'],s['y']),(old[s['atlasId']]['name'],old[s['atlasId']]['x'],old[s['atlasId']]['y']))
    def test_population_conservation(self):
        total=0
        for reg in self.result['regions']:
            sites=[s for s in self.result['settlements'] if s['regionId']==reg['id']]
            self.assertEqual(sum(s['designPopulation'] for s in sites)+reg['ruralPopulation'],reg['designPopulation'])
            self.assertEqual(sum(reg['speciesCounts'].values()),reg['designPopulation'])
            d=reg['ruralDistribution'];counts=dict(d['mixedAndDispersedCounts'])
            for g in d['concentratedHabitatGroups']:
                for sp,n in g['counts'].items():counts[sp]+=n
            self.assertEqual(counts,reg['ruralSpeciesCounts']);total+=reg['designPopulation']
        self.assertEqual(total,self.result['world']['designPopulation']);self.assertEqual(total,5450000)
    def test_percentage_totals(self):
        for r in self.result['settlements']+self.result['regions']+self.result['territories']+[self.result['world']]:
            self.assertAlmostEqual(sum(r['speciesPct'].values()),100,places=8)
    def test_lake_is_not_ocean(self):
        s={x['atlasId']:x for x in self.result['settlements']}
        self.assertEqual(s['bourg-1']['waterfront'],'inland_waterfront');self.assertEqual(s['bourg-2']['waterfront'],'ocean_port')
    def test_missing_cause_disables_all_rules(self):
        for rule in self.result['events']:
            self.assertEqual(b.event_chance(rule,{}),0)
            flags=dict.fromkeys(rule['requires'],True)
            self.assertGreaterEqual(b.event_chance(rule,flags),0)
            flags[rule['requires'][0]]=False;self.assertEqual(b.event_chance(rule,flags),0)
    def test_transitions_are_not_random(self):
        for rule in self.result['events']:
            if rule['transitionOnly']:self.assertEqual(b.event_chance(rule,dict.fromkeys(rule['requires'],True),2400),0)
    def test_hazard_probability_composes(self):
        rule=next(r for r in self.result['events'] if r['id']=='bandit_ambush');flags=dict.fromkeys(rule['requires'],True)
        p1=b.event_chance(rule,flags,1);p24=b.event_chance(rule,flags,24)
        self.assertAlmostEqual(1-(1-p1)**24,p24,places=12)
    def test_incomplete_relations_rejected(self):
        s=copy.deepcopy(self.source);s['relations'].pop()
        with self.assertRaisesRegex(ValueError,'Matrice'):b.validate(s)
    def test_invalid_demography_rejected(self):
        s=copy.deepcopy(self.source);s['regions'][0][4][0]+=1
        with self.assertRaisesRegex(ValueError,'Pourcentages'):b.validate(s)
    def test_unknown_recipe_and_cycle_rejected(self):
        s=copy.deepcopy(self.source);next(r for r in s['resources'] if r[0]=='iron')[4]=[['missing_resource']]
        with self.assertRaises(ValueError):b.validate(s)
        s=copy.deepcopy(self.source);next(r for r in s['resources'] if r[0]=='iron')[4]=[['steel']]
        with self.assertRaisesRegex(ValueError,'Cycle'):b.validate(s)
    def test_allocations_conserve_integer_counts(self):
        rng=random.Random(13)
        for _ in range(100):
            total=rng.randrange(0,10000000);w=[rng.random() for _ in range(rng.randrange(1,60))];v=b.allocate(total,w)
            self.assertEqual(sum(v),total);self.assertTrue(all(isinstance(n,int) and n>=0 for n in v))
    def test_complete_pair_matrix_not_automatic_war(self):
        expected={frozenset(p) for p in itertools.combinations([f[0] for f in self.source['factions']],2)}
        self.assertEqual({frozenset((r['a'],r['b'])) for r in self.result['relations']},expected)
        self.assertTrue(all(not r['automaticMilitaryAssistance'] and not r['speciesHostility'] for r in self.result['relations']))
    def test_deterministic_and_no_input_mutation(self):
        a=copy.deepcopy(self.atlas);s=copy.deepcopy(self.source)
        second=b.compile_world(a,s)
        self.assertEqual(self.result,second);self.assertEqual(a,self.atlas);self.assertEqual(s,self.source)
    def test_unknown_settlement_override_rejected(self):
        s=copy.deepcopy(self.source);s['settlementOverrides']['unknown']={'focus':'grain'}
        with self.assertRaisesRegex(ValueError,'Dérogation'):b.compile_world(self.atlas,s)
    def test_resource_distribution_complete(self):
        for r in self.result['regions']:
            self.assertEqual(len(r['resourceLevels']),54);self.assertTrue(all(0<=n<=5 for n in r['resourceLevels'].values()))
    def test_transport_requires_real_graph(self):
        a=copy.deepcopy(self.atlas);a['routes']=[];r=b.compile_world(a,self.source)
        self.assertTrue(all(not any(s['supplierOptions'].values()) for s in r['settlements']))
        self.assertTrue(all(s['networkBindingStatus']=='requires_access_review' for s in r['settlements']))
class ApeIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.atlas,cls.source,cls.hashes=b.load(ROOT);cls.result=b.compile_world(cls.atlas,cls.source)
    def test_six_species_and_conserved_design_population(self):
        self.assertEqual(tuple(self.source['species']),b.SPECIES)
        baseline={r['id']:r for r in self.source['demographyRevision']['baselineRegions']}
        for row in self.source['regions']:
            old=baseline[row[0]];self.assertEqual(row[2],old['designPopulation'])
            for index,key in [(4,'ruralSpeciesPct'),(5,'townSpeciesPct')]:
                self.assertEqual(row[index][1:4],old[key][1:4])
                self.assertAlmostEqual(old[key][0]-row[index][0],sum(row[index][4:]))
        self.assertEqual(self.result['world']['designPopulation'],5450000)
        self.assertGreater(self.result['world']['speciesCounts']['ape_folk'],0)
        self.assertGreater(self.result['world']['speciesCounts']['batracien'],0)
    def test_existing_sites_and_no_runtime_spawning(self):
        sites={s['atlasId']:s for s in self.result['settlements']}
        for st in self.result['apeFolk']['settlements']:
            self.assertEqual(st['name'],sites[st['siteId']]['name']);self.assertGreater(st['designApeResidents'],0)
            self.assertFalse(st['runtimeActorsSpawned']);self.assertFalse(st['buildingsPlaced'])
        self.assertEqual(len(sites),83);self.assertFalse(self.result['warnings'])
    def test_primary_distribution_is_tagon_not_global_hostility(self):
        a=self.result['apeFolk'];self.assertIsNone(a['globalFaction']);self.assertFalse(a['hostilityBySpecies'])
        tagon=next(t for t in a['demography']['territories'] if t['territory']=='Tagon')
        self.assertGreater(tagon['shareOfAllApeResidents'],50)
        self.assertEqual(next(t for t in a['demography']['territories'] if t['territory']=='Igea')['apeResidents'],0)
    def test_activity_assets_are_not_claimed_as_finished(self):
        a=self.result['apeFolk'];self.assertEqual(len(a['activities']),55)
        self.assertEqual({x['id'] for x in a['activities'] if x['status']=='implemented'},{'idle','walk','flee','talk'})
        self.assertTrue(all(x['sexes']==['male','female'] and x['allTones'] for x in a['activities']))
        for role in a['roles']:self.assertTrue(role['outfitBrief'])
    def test_references_and_causes_reject_invalid_extensions(self):
        for change in ('site','resource','activity','actor','event'):
            s=copy.deepcopy(self.source);a=s['apeFolk']
            if change=='site':a['communities'][0]['siteIds'].append('missing-site')
            if change=='resource':a['structures'][0]['materials'].append('missing-resource')
            if change=='activity':a['roles'][0]['activities'].append('missing-activity')
            if change=='actor':a['relations'].pop()
            if change=='event':a['eventBindings'][0]['rule']='missing-rule'
            with self.subTest(change=change),self.assertRaises(ValueError):b.compile_world(self.atlas,s)
    def test_no_walk_across_sea_and_no_duplicate_event_types(self):
        a=self.result['apeFolk'];path=next(p for p in a['routeOptions'] if p['fromSiteId']=='5' and p['toSiteId']=='27')
        self.assertTrue(path['requiresBoat']);self.assertGreater(path['distanceM'],0)
        self.assertTrue(all(not e['runtimeEnabled'] and not e['createsNewEventType'] and e['eligibleRegionIds'] for e in a['eventBindings']))
    def test_compiler_remains_deterministic_with_extension(self):
        self.assertEqual(self.result,b.compile_world(self.atlas,self.source))
        self.assertIn('data/world/bible/ape-folk.json',self.hashes)

if __name__=='__main__':unittest.main(verbosity=2)
