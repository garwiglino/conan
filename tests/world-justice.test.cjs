const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json')),create=require('../scripts/world-justice.js');
const site='camp',other=A.nodes.find(n=>n.rest&&n.id!==site).id;
function setup(saved){const w={clock:480},j=create(A,w,saved);return {w,j};}
function crime(j,kind='murder',witnesses=['w1','w2'],victim='victim',at=480){return j.record({site,kind,witnesses,victim,at});}
test('an unseen crime is a fact, not an omniscient bounty or world-wide reputation',()=>{
 const {j}=setup(),c=crime(j);assert.equal(j.effect(site).wanted,false);assert.equal(j.effect(site,'w1').refuse,true);assert.equal(j.effect(other,'w1').refuse,true);assert.equal(j.effect(other,'w1').wanted,false);assert.equal(j.file(c.id,'invented',490),false);
});
test('a witness killed before reporting cannot testify; another living witness still can',()=>{
 const {j}=setup(),c=crime(j);j.witnessDied('w1');assert.equal(j.file(c.id,'w1',490),false);assert.equal(j.effect(site).wanted,false);assert.equal(j.file(c.id,'w2',500),true);assert.equal(j.effect(site,null,500).wanted,true);
});
test('killing everyone after statements were filed never deletes the established case',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);j.witnessDied('w1');j.witnessDied('w2');assert.equal(j.effect(site,null,490).wanted,true);assert.equal(c.witnesses.w1.filedAt,490);const copy=setup(j.serialize()).j;assert.equal(copy.effect(site,null,490).wanted,true);assert.equal(copy.state.cases[0].witnesses.w1.filedAt,490);
});
test('a victim dying in the first attack cannot report their own death',()=>{
 const {j}=setup(),c=crime(j,'murder',['victim']);j.witnessDied('victim');assert.equal(j.file(c.id,'victim',480),false);assert.equal(j.effect(site).wanted,false);
});
test('attacking a previous witness links a separate aggravated case but requires its own evidence',()=>{
 const {j}=setup(),first=crime(j),second=crime(j,'murder',[],'w1',490);j.witnessDied('w1');assert.equal(second.intimidation,true);assert.deepEqual(second.parents,[first.id]);assert.equal(j.effect(site).wanted,false);assert.ok(j.pending('w2',500).some(c=>c.id===first.id));
});
test('warrants, refusal and higher prices expire after a bounded quiet period, including after reload',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);assert.ok(j.effect(site,null,490).price>1);assert.equal(j.effect(site,null,490+4*1440).wanted,false);assert.equal(j.effect(site,null,490+7*1440).price,1);assert.equal(j.effect(site,'w2',490+7*1440).refuse,false);
 const copy=setup(j.serialize()).j;assert.equal(copy.effect(site,null,490+7*1440).wanted,false);assert.equal(copy.effect(site,null,490+7*1440).price,1);
});
test('statements submitted late cannot renew the same accusation forever',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);j.file(c.id,'w2',480+6*1440);assert.ok(c.penaltyUntil<=c.lastAt+7*1440);assert.equal(j.effect(site,null,480+8*1440).wanted,false);
});
test('an arrest charges once, is proportionate, ends local pursuit and preserves temporary distrust',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);const s=j.sentence(site,100,500);assert.ok(s.money>0&&s.money<=100);assert.ok(s.minutes>=240&&s.minutes<=1440);assert.equal(j.sentence(site,100,501),null);assert.equal(j.effect(site,null,s.releaseAt).wanted,false);assert.ok(j.effect(site,null,s.releaseAt).price>1);assert.equal(j.effect(site,null,s.releaseAt).refuse,false);
});
test('poverty creates neither negative money nor everlasting debt; repeated new crimes are not pardoned',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);assert.equal(j.sentence(site,0,500).money,0);assert.equal(j.effect(site,null,501).wanted,false);const next=crime(j,'assault',['w1'],'victim',510);assert.notEqual(next.id,c.id);j.file(next.id,'w1',515);assert.equal(j.effect(site,null,516).wanted,true);
});
test('continuous contacts upgrade one episode rather than charging one murder per animation frame',()=>{
 const {j}=setup(),a=crime(j,'assault',['w1']);const b=crime(j,'grave_injury',['w1'],'victim',481),c=crime(j,'murder',['w2'],'victim',482);assert.equal(a.id,b.id);assert.equal(b.id,c.id);assert.equal(j.state.cases.length,1);assert.equal(c.kind,'murder');assert.equal(c.attacks,3);
});
test('another jurisdiction neither arrests nor collects for an unrelated local crime',()=>{
 const {j}=setup(),c=crime(j);j.file(c.id,'w1',490);assert.equal(j.sentence(other,100,500),null);assert.equal(j.effect(other,null,500).price,1);
});
test('a late discoverer can report a massacre without acquiring the killer identity',()=>{
 const {j}=setup();for(let i=0;i<4;i++){crime(j,'murder',[],'dead-'+i,480+i);j.death({victim:'dead-'+i,site,x:10+i,y:10,at:480+i});}assert.equal(j.state.scenes.length,1);const s=j.state.scenes[0];
 assert.ok(j.discover(s.id,'late-traveller',['dead-0','dead-1','dead-2'],500));assert.ok(j.fileDiscovery(s.id,'late-traveller',510));assert.equal(s.reportedVictims.length,3);assert.equal(j.effect(site,null,510).wanted,false);assert.equal(j.effect(site,'late-traveller',510).refuse,false);assert.equal(j.pending('late-traveller',510).length,0);
 const copy=setup(j.serialize()).j;assert.equal(copy.state.scenes[0].reportedVictims.length,3);assert.equal(copy.effect(site,null,510).wanted,false);
});
test('a discoverer only knows bodies actually seen and cannot report invented victims',()=>{
 const {j}=setup();for(let i=0;i<3;i++)j.death({victim:'d'+i,site,x:10+i,y:10});const s=j.state.scenes[0];j.discover(s.id,'arrival',['d0','invented'],490);j.fileDiscovery(s.id,'arrival',500);assert.deepEqual(s.reportedVictims,['d0']);assert.equal(j.discover(s.id,'arrival',['d0'],501),false);j.discover(s.id,'arrival',['d1','d2'],502);assert.ok(j.fileDiscovery(s.id,'arrival',503));assert.equal(s.reportedVictims.length,3);
});
test('an unobserved later murder cannot retroactively upgrade a previously filed assault',()=>{
 const {j}=setup(),c=crime(j,'assault',['guard']);j.file(c.id,'guard',481);const until=c.wantedUntil;j.witnessDied('guard');crime(j,'murder',[],'victim',490);assert.equal(c.kind,'murder');assert.equal(c.knownKind,'assault');assert.equal(c.wantedUntil,until);
});
test('new observations in the same frame can upgrade a report without deleting the first testimony',()=>{
 const {j}=setup(),c=crime(j,'assault',['guard']);j.file(c.id,'guard',480);crime(j,'murder',['guard'],'victim',480);assert.ok(j.pending('guard',480).some(a=>a.id===c.id));assert.ok(j.file(c.id,'guard',480));assert.equal(c.knownKind,'murder');assert.equal(c.witnesses.guard.filedAt,480);
});
test('last-seen information is evidence dated in the past, not the player live position',()=>{
 const {j}=setup(),c=j.record({victim:'victim',site,kind:'murder',witnesses:['guard'],position:{x:10,y:20},at:480});j.file(c.id,'guard',500);assert.deepEqual(j.state.sightings.camp,{x:10,y:20,at:480,by:'guard'});
 const other=setup(j.serialize()).j;assert.equal(other.state.sightings.camp.x,10);assert.equal(other.effect(site,null,501).wanted,true);
});
test('only accepted repeated light contacts in the warning window qualify, including after reload',()=>{
 const {w,j}=setup();assert.equal(j.qualify('one','assault',480),false);assert.equal(setup(j.serialize()).j.qualify('two','assault',485),true);
 assert.equal(j.qualify('two','assault',486),false);assert.equal(j.qualify('one','grave_injury',500),true);assert.equal(j.qualify('one','murder',520),true);
});
test('fear uses the observed crime time, not proximity, a late report or the longer price penalty',()=>{
 const {j}=setup(),c=crime(j,'murder');j.file(c.id,'w1',490);assert.equal(j.effect(site,'w2',1199).refuse,true);assert.equal(j.effect(site,'w2',1200).refuse,false);
 j.file(c.id,'w2',1210);assert.equal(j.effect(site,null,1210).refuse,false);assert.ok(j.effect(site,null,1210).price>1);
});
