const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
test('snow screen pixels and velocity never depend on camera position or player facing',()=>{
 const sky={snow:.9,wind:1,blizzard:.7,fog:0},g={time:36000,sky:()=>sky},draws=[];
 const c={save(){},restore(){},setTransform(...m){this.transform=m;},fillRect(...p){draws.push(p);}};
 const r={g,cam:{x:0,y:0},k:3,top:22};a.renderSnowFog(r,c,320,180);
 for(let i=0;i<240;i++){g.time+=1/60;sky.wind=i%80<40?0:1;for(const f of r.snowVisuals.flakes){f.x=160;f.y=60;}r.cam={x:1e7+Math.sin(i)*500,y:-1e7+Math.cos(i)*500};draws.length=0;a.renderSnowFog(r,c,320,180);assert.deepEqual(c.transform,[3,0,0,3,0,66]);for(const f of r.snowVisuals.flakes){assert.ok(f.x<160);assert.ok(f.y>60);}const first=draws.map(x=>x.join(','));r.cam={x:-500,y:900};draws.length=0;a.renderSnowFog(r,c,320,180);assert.deepEqual(draws.map(x=>x.join(',')),first);}
});
function fixture(){const cell=a.Atlas.cells.find(c=>c.biome===11),p=a.Atlas.toGame(cell.x,cell.y),g={time:0,clock:72*1440+480,player:{...p,anim:0},npcs:[],enemies:[],tile:()=>0,npcPresent:()=>true};const r={g,cam:{x:p.x-150,y:p.y-70},W:320,H:180,atlasGround:new Map()};return {g,r,p};}
test('snow receives bounded alternating prints without rain; resting, teleporting and spirits leave no trail',()=>{
 const {g,r,p}=fixture(),fx=new a.GroundTracks(g),escortTrail=[{x:1,y:2}];g.footprints=escortTrail;
 for(let i=0;i<100;i++){g.time+=.04;g.player.x+=1;g.player.anim+=.8;fx.step(r);}assert.ok(fx.marks.length>10);assert.equal(g.footprints,escortTrail);assert.ok(fx.marks.every(m=>m.material==='snow'&&m.life===20));assert.ok(new Set(fx.marks.map(m=>m.side)).size===2);
 const count=fx.marks.length;for(let i=0;i<20;i++){g.time+=.04;fx.step(r);}assert.equal(fx.marks.length,count);
 g.time+=.04;g.player.x+=50;g.player.anim+=3;fx.step(r);assert.equal(fx.marks.length,count);
 assert.equal(a.trackBody({id:'fairy',...p},g),false);assert.equal(a.trackBody({kind:'snake',...p},g),false);assert.equal(a.trackBody({kind:'skeleton',...p},g),true);
 g.player.x=p.x;for(let i=0;i<900;i++){g.time+=.04;g.player.x=p.x+i%100;g.player.anim+=3;fx.step(r);}assert.ok(fx.marks.length<=160);
});
test('wet soft ground receives shorter-lived tone-matched prints while dry ground and hard floors stay clear',()=>{
 const {g,r}=fixture(),cell=a.Atlas.cells.find(c=>c.biome===1),p=a.Atlas.toGame(cell.x,cell.y);Object.assign(g.player,p);let wet,dry;
 for(let t=480;t<1440*96&&(!wet||!dry);t+=120){g.clock=t;const surface=a.trackSurface(g,g.player);if(surface)wet=t;else dry=t;}
 assert.ok(wet&&dry);g.clock=wet;const surface=a.trackSurface(g,g.player);assert.equal(surface.life,8);assert.equal(surface.material,'sand');g.clock=dry;assert.equal(a.trackSurface(g,g.player),null);g.clock=wet;g.tile=()=>2;assert.equal(a.trackSurface(g,g.player),null);g.tile=()=>5;assert.equal(a.trackSurface(g,g.player),null);
 const colors=a.terrainTrackColors(new Uint8ClampedArray([180,150,90,255]),1,1),w=a.Atlas.toWorld(p.x,p.y);r.atlasGround.set(Math.floor(w.x/32)+','+Math.floor(w.y/32),{trackColors:colors});assert.equal(a.trackColor(r,p.x,p.y,'sand'),'rgb(86,72,43)');
});
test('ground marks remain fixed in world coordinates and fade smoothly',()=>{
 const {g,r}=fixture(),fx=new a.GroundTracks(g),calls=[],c={save(){},restore(){},fillRect(x,y,w,h){calls.push({x,y,w,h,a:this.globalAlpha});}};
 fx.marks.push({x:g.player.x,y:g.player.y,ux:1,uy:0,side:1,born:0,life:8,alpha:.5,material:'sand',color:'#765432'});
 g.time=1;fx.draw(r,c);const first=calls.splice(0);r.cam.x+=80;g.time=6;fx.draw(r,c);assert.deepEqual(calls.map(p=>[p.x,p.y]),first.map(p=>[p.x,p.y]));assert.ok(calls[0].a<first[0].a);calls.length=0;g.time=9;fx.draw(r,c);assert.equal(calls.length,0);
});
