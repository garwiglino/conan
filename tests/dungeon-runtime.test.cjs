'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,combatGame}=require('./game-harness.cjs');
const D=require('../data/donjons/forteresse-grise-gueule.json');
let a;before(async()=>{a=await loadGame();});
function game(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;return g;}
// Search physical, radius-aware positions. Follow the route through movePlayer,
// so a visually connected room with an impassable wall cannot pass this test.
function walk(g,goal,step=8){const p=g.player,from={x:p.x,y:p.y},todo=[[0,0]],parents=new Map([['0,0',null]]);let end;
 for(let n=0;n<todo.length;n++){const [i,j]=todo[n];p.x=from.x+i*step;p.y=from.y+j*step;if(goal(p)){end=[i,j];break;}
  for(const [di,dj]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=i+di,y=j+dj,k=x+','+y;if(parents.has(k)||g.solid(from.x+x*step,from.y+y*step,5))continue;parents.set(k,[i,j]);todo.push([x,y]);}}
 Object.assign(p,from);if(!end&&step===8)return walk(g,goal,2);assert.ok(end,'reachable destination on '+g.dungeon.floor+' from '+JSON.stringify(from));const steps=[];for(let q=end;parents.get(q.join(','));q=parents.get(q.join(',')))steps.push(q);for(const [i,j]of steps.reverse()){const x=from.x+i*step,y=from.y+j*step;g.movePlayer(p,x-p.x,y-p.y);assert.ok(Math.hypot(p.x-x,p.y-y)<.1,'walk blocked');}}
function use(g,kind,id){if(g.dungeonGrip)g.interact();walk(g,()=>{const c=g.context();return c?.kind===kind&&(!id||c.id===id||c.door?.id===id||c.link?.vers===id);});g.interact();}
function push(g,b,x,y){
 if(g.dungeonGrip&&g.dungeonGrip.id!==b.id)g.interact();
 for(const [tx,ty]of [[b.x,y],[x,y]]){const dx=Math.abs(tx-b.x)>1?Math.sign(tx-b.x):0,dy=Math.abs(ty-b.y)>1?Math.sign(ty-b.y):0;if(!dx&&!dy)continue;
  if(g.dungeonGrip){const offset={x:g.player.x-b.x,y:g.player.y-b.y},n=Math.ceil(Math.hypot(tx-b.x,ty-b.y));let clear=true;
   for(let i=1;i<=n;i++){const x=b.x+(tx-b.x)*i/n,y=b.y+(ty-b.y)*i/n;if(a.FirstDungeon.geometry(g,x,y,9,b)||a.FirstDungeon.geometry(g,x+offset.x,y+offset.y,5,b)){clear=false;break;}}
   if(!clear)g.interact();
  }
  if(!g.dungeonGrip){const target={x:b.x-dx*17,y:b.y-dy*17};walk(g,p=>Math.hypot(p.x-target.x,p.y-target.y)<6);
   if(dx)g.movePlayer(g.player,0,b.y-g.player.y);else g.movePlayer(g.player,b.x-g.player.x,0);
   g.interact();assert.ok(g.dungeonGrip,'explicit grip required to move a crate');
  }
  for(let n=0;n<600&&Math.hypot(b.x-tx,b.y-ty)>1;n++)g.movePlayer(g.player,dx,dy);
  assert.ok(Math.hypot(b.x-tx,b.y-ty)<=1,'crate drag reached '+[tx,ty]+' got '+[b.x,b.y]);
 }
}
function quiet(g){for(const e of g.enemies)e.dead=true;}
test('opening is isolated; save/load retains floor, keys, crate positions and health',()=>{
 const g=game();assert.equal(g.zone(),'Lieu inconnu · Les geôles');assert.equal(g.player.x,D.depart.pos[0]*32);assert.equal(g.npcs.length,0);assert.equal(g.story.fairy,false);assert.equal(g.sky().rain,0);assert.equal(g.solid(g.player.x,g.player.y),false);
 g.player.hp=6;g.dungeon.keys.push('serpent');g.dungeon.floors['grande-salle'].crates[0].x+=8;
 const saved=g.serialize(),l=combatGame(a);l.startFirstDungeon(saved.dungeon);assert.equal(l.player.x,g.player.x);
 const loaded=combatGame(a,saved);assert.equal(loaded.player.hp,6);assert.equal(loaded.dungeon.floor,'geoles');assert.equal(loaded.dungeon.keys[0],'serpent');assert.equal(loaded.player.y,g.player.y);assert.equal(loaded.dungeon.floors['grande-salle'].crates[0].x,g.dungeon.floors['grande-salle'].crates[0].x);
 assert.equal(g.quests.known.has('evasion'),true);assert.deepEqual(Array.from(g.trackedQuests(),q=>q.id),['evasion']);
});
test('the complete authored escape is physically reachable, including pressure crates and the lift return',()=>{
 const g=game();quiet(g);
 assert.equal(g.dungeon.keys.length,0);use(g,'dungeon-lever','levier-cellules');assert.equal(g.dungeon.floors.geoles.open.length,4);
 use(g,'dungeon-key','serpent');use(g,'dungeon-door','porte-serpent');use(g,'dungeon-stairs','grande-salle');assert.equal(g.dungeon.floor,'grande-salle');quiet(g);
 const boxes=g.dungeon.floors['grande-salle'].crates;
 // Reserve box exits through the single northern corridor.
 push(g,boxes[0],boxes[0].x,2.7*32);push(g,boxes[0],15.5*32,2.7*32);push(g,boxes[0],15.5*32,5.5*32);
 push(g,boxes[1],15.5*32,boxes[1].y);push(g,boxes[1],15.5*32,7.5*32);
 assert.ok(g.dungeon.floors['grande-salle'].open.includes('16,3,O'));
 use(g,'dungeon-stairs','galeries');quiet(g);
 use(g,'dungeon-lever','leviers-armurerie');assert.equal(g.dungeon.floors.galeries.open.includes('10,5,N'),false);
 // Target the other lever by its authored edge.
 walk(g,()=>{const c=g.context();return c?.kind==='dungeon-lever'&&c.bord==='2,6,O';});g.interact();assert.ok(g.dungeon.floors.galeries.open.includes('10,5,N'));
 use(g,'dungeon-chest','crane');for(let i=0;i<20;i++)g.update(.02,{});use(g,'dungeon-key','crane');use(g,'dungeon-door','porte-crane');use(g,'dungeon-winch');assert.equal(g.dungeon.lift,true);
 use(g,'dungeon-lift');assert.ok(g.dialogue);const option=g.dialogue.menu.options.find(o=>o.label==='La grande salle');assert.ok(option);option.act();g.dialogue=null;quiet(g);
 use(g,'dungeon-chest','croc');for(let i=0;i<20;i++)g.update(.02,{});use(g,'dungeon-key','croc');use(g,'dungeon-lever','levier-caserne');assert.ok(g.dungeon.floors['grande-salle'].open.includes('7,8,O'));
 use(g,'dungeon-lift');g.dialogue.menu.options.find(o=>o.label==='Les galeries').act();g.dialogue=null;quiet(g);
 use(g,'dungeon-door','porte-croc');use(g,'dungeon-stairs','trone');quiet(g);
 use(g,'dungeon-lever','levier-cage');assert.equal(g.dungeon.fairy,false,'chief must be defeated');
 const chief=g.enemies.find(e=>e.chief);chief.dead=false;g.damageEnemy(chief,chief.hp);assert.equal(g.dungeon.bossDead,true);use(g,'dungeon-lever','levier-cage');assert.equal(g.dungeon.fairy,true);
 use(g,'dungeon-stairs','galeries');quiet(g);use(g,'dungeon-lift');g.dialogue.menu.options.find(o=>o.label==='La grande salle').act();g.dialogue=null;quiet(g);
 use(g,'dungeon-exit');assert.equal(g.dungeon.active,false);assert.equal(g.story.dungeonEscaped,true);assert.ok(g.quests.done.has('evasion'));assert.ok(g.mapPlaces.some(p=>p.id==='dungeon-'+D.id));assert.ok(Math.hypot(a.Atlas.toWorld(g.player.x,g.player.y).x-D.lieu.monde.x,a.Atlas.toWorld(g.player.x,g.player.y).y-D.lieu.monde.y)<40);assert.equal(g.worldCheckpoint.x,g.player.x);
 const restored=combatGame(a,g.serialize());assert.equal(restored.dungeon.active,false);assert.equal(restored.player.x,g.player.x);assert.ok(restored.visitedPlaces.has('dungeon-'+D.id));
});
test('doors, simultaneous pressure, cage and exit enforce their prerequisites',()=>{
 const g=game();quiet(g);g.enterDungeonFloor('galeries',{x:4.5*32,y:9.5*32});use(g,'dungeon-door','porte-crane');assert.equal(g.dungeon.floors.galeries.open.includes('4,9,N'),false);
 assert.equal(g.leaveFirstDungeon(),false);g.dungeon.fairy=true;assert.equal(g.leaveFirstDungeon(),false);
 g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});const s=g.dungeon.floors['grande-salle'];Object.assign(s.crates[0],{x:15.5*32,y:5.5*32});g.updateDungeonPlates();assert.equal(s.open.includes('16,3,O'),false);Object.assign(s.crates[1],{x:15.5*32,y:7.5*32});g.updateDungeonPlates();assert.ok(s.open.includes('16,3,O'));s.crates[1].x-=24;g.updateDungeonPlates();assert.equal(s.open.includes('16,3,O'),false);
});
test('death and reload return to the last floor arrival, keeping puzzle progress',()=>{
 const g=game();g.enterDungeonFloor('galeries',{x:19.5*32,y:1.5*32});g.dungeon.keys.push('serpent');g.player.lives=2;g.player.inv=0;g.player.hp=1;g.damagePlayer(2,{x:g.player.x+10,y:g.player.y,level:0});assert.ok(g.dying);assert.equal(g.player.lives,1);
 const loaded=combatGame(a,g.serialize());assert.equal(loaded.dungeon.floor,'galeries');assert.equal(loaded.player.hp,10);g.respawn();assert.equal(g.player.hp,10);assert.equal(g.dungeon.floor,'galeries');assert.equal(g.player.lives,1);assert.ok(g.dungeon.keys.includes('serpent'));
});
test('legacy world saves keep their position and do not acquire the dungeon quest',()=>{
 const g=combatGame(a),saved=g.serialize(),loaded=combatGame(a,saved);assert.equal(loaded.dungeon,undefined);assert.equal(loaded.player.x,g.player.x);loaded.checkQuests();assert.equal(loaded.quests.known.has('evasion'),false);
});

test('normal attack, guard and dodge inputs work in the interior without freeing the temple',()=>{
 const g=game();g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});quiet(g);const e=g.enemies[0];Object.assign(e,{dead:false,x:g.player.x+12,y:g.player.y-12,hp:3,cooldown:99});g.player.dir=1;g.player.spawnFX=0;
 g.update(.04,{attackPressed:true});assert.ok(g.player.attack>0);for(let i=0;i<35;i++)g.update(.04,{});assert.ok(e.hp<3,'the actual sword input damages a goblin');assert.equal(g.story.templeFreed,false);
 g.player.attack=0;g.update(.04,{guard:true});assert.equal(g.player.guard,true);const hp=g.player.hp;g.damagePlayer(1,e);assert.equal(g.player.hp,hp,'facing guard blocks');g.update(.04,{dodge:true,x:1,y:0});assert.ok(g.player.dash>0);assert.ok(g.player.inv>0);
});
test('pulling rescues a crate placed against a wall and persists across a save',()=>{
 const g=game();g.enterDungeonFloor('grande-salle',{x:15.5*32,y:3.5*32});quiet(g);const b=g.dungeon.floors['grande-salle'].crates[1];Object.assign(b,{x:15.5*32,y:2.5*32});Object.assign(g.player,{x:b.x,y:b.y+18});const y=b.y;assert.equal(g.context().kind,'dungeon-crate');g.interact();assert.equal(b.y,y,'grabbing does not teleport');for(let i=0;i<20;i++)g.update(.02,{x:-1,y:.5});assert.ok(b.y>y+8);assert.equal(combatGame(a,g.serialize()).dungeon.floors['grande-salle'].crates[1].y,b.y);
});
