const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../scripts/world-model.js')(require('../data/world/atlas.json'));
test('local navigation retains the established routes while querying each collision cell only once',()=>{
 // Digests captured from the shipped A* before optimization, including tie order.
 // The enclosed-start fixture also checks its goal once before expanding.
 const fixtures=[
  [1,'cae90cdd305eeda524a27041f081c3b46b9a19f8fd1061132525b52fafd32827',362],
  [2,'4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',5],
  [4,'dbd2b9e5279c5aa2d0e681cfc740ccbb272ca6b03c8903b6a5c3614e98dfe70b',514]
 ];
 for(const [seed,digest,count]of fixtures){const cells=new Set();let calls=0;const path=A.localPath({x:8,y:8},{x:440,y:312},(x,y)=>{calls++;const key=x+','+y;assert.ok(!cells.has(key));cells.add(key);return A.random(x/16|0,y/16|0,seed)>.26;});assert.equal(crypto.createHash('sha256').update(JSON.stringify(path)).digest('hex'),digest);assert.equal(calls,count);}
});
test('a target beyond the established local navigation boundary performs no futile collision searches',()=>{
 let calls=0;assert.deepEqual(A.localPath({x:8,y:8},{x:16*37+8,y:8},()=>{calls++;return true;}),[]);assert.equal(calls,0);
});
test('the world journal reuses the authoritative game snapshot and skips unchanged serialization',()=>{
 const Store=require('../scripts/world-store.js'),writes=[],store=new Store({localStorage:{setItem:(key,text)=>writes.push(JSON.parse(text))}});let copies=0;
 const world={campaign:'performance',revision:1,clock:480,serialize(){copies++;return {campaign:this.campaign,revision:this.revision,clock:this.clock,people:['wounded-guard']};}};
 store.write(world);store.write(world);assert.equal(copies,1);assert.equal(writes.length,1);world.clock=481;const snapshot=world.serialize();store.write(world,snapshot);assert.equal(copies,2);assert.deepEqual(writes[1],snapshot);world.revision++;store.write(world);assert.equal(copies,3);assert.equal(writes[2].revision,2);
});
