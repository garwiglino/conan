'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,combatGame}=require('./game-harness.cjs'),Projection=require('../scripts/world-projection.js');
let a;before(async()=>{a=await loadGame();});
function arena(){const g=combatGame(a);g.startFirstDungeon();g.enterDungeonFloor('grande-salle',{x:11.5*32,y:6.5*32});g.player.spawnFX=0;g.lineClear=()=>true;g.move=()=>{};for(const e of g.enemies)e.dead=true;return g;}
test('live goblin combos in every view damage once on the displayed contact and keep their facing through recovery',()=>{
 const g=arena(),G=a.HearthreaverGoblins,p=g.player,e=g.enemies[0];let events=[];g.damagePlayer=()=>events.push(G.look(e).frame);
 for(let dir=0;dir<4;dir++)for(let combo=0;combo<4;combo++){
  Object.assign(e,{x:11.5*32,y:6.5*32,dir,dead:false,stun:0,cooldown:99,skin:'guerrier-kesh',nextCombo:combo});G.start(e);
  const v=G.weaponPose(dir,G.pose('attack',dir,2,combo)),length=a.HearthreaverWeapons.get(G.character(e.skin).weapon).length*.85,q=Projection.inverse(v.h[0]+v.u[0]*length*.65,v.h[1]+v.u[1]*length*.65+9);
  Object.assign(p,{x:e.x+q.x,y:e.y+q.y,hurt:0,inv:0});events=[];let ticks=0;
  while(Number.isFinite(e.swingElapsed)&&ticks++<90){g.update(.04,{});assert.equal(e.dir,dir,'facing locked for delivery and recovery');}
  assert.deepEqual(events,[2],dir+':'+combo+' one visible impact');
 }
});
test('an interrupted wind-up and a target leaving before impact cannot receive delayed damage',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;let hits=0;g.damagePlayer=()=>hits++;
 Object.assign(e,{dead:false,hp:3,stun:0,dir:1,cooldown:99});G.start(e);g.damageEnemy(e,1);p.hitPause=0;for(let i=0;i<35;i++)g.update(.04,{});assert.equal(hits,0);assert.equal(e.swingElapsed,null);
 e.stun=0;G.start(e);p.x=e.x+160;p.y=e.y;for(let i=0;i<35;i++)g.update(.04,{});assert.equal(hits,0);
});
test('real enemy AI approaches short blade range, projects its view once, and returns to idle after its last-known-position search',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;
 Object.assign(e,{dead:false,x:p.x-18,y:p.y+18,dir:2,cooldown:0,stun:0});
 // Let the real logical move update this fixture; no world crowd is needed.
 g.move=(o,x,y)=>{o.x+=x;o.y+=y;};
 let moved=false,started=false;for(let i=0;i<100;i++){g.update(.04,{});moved||=e.moving;if(Number.isFinite(e.swingElapsed)){started=true;break;}}
 assert.ok(moved);assert.ok(started);assert.equal(e.swingDir,1,'logical north-east projects to screen right');
 G.cancel(e);e.cooldown=99;p.x=e.x+240;g.time+=3;g.update(.04,{});assert.equal(e.moving,false);assert.equal(G.look(e,g.time).state,'idle');
});

test('goblin attack facing projects logical target coordinates exactly once in all four views',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;g.move=(o,x,y)=>{o.x+=x;o.y+=y;};
 for(let dir=0;dir<4;dir++){const q=Projection.inverse(...[[0,-25],[25,0],[0,25],[-25,0]][dir]);Object.assign(e,{dead:false,x:p.x-q.x,y:p.y-q.y,dir:2,stun:0,cooldown:0,swingElapsed:null,nextCombo:0});let began=false;for(let i=0;i<120;i++){g.update(.04,{});if(Number.isFinite(e.swingElapsed)){began=true;break;}}assert.ok(began,'reached native blade range in view '+dir+' at '+JSON.stringify({x:e.x,y:e.y,px:p.x,py:p.y}));assert.equal(e.swingDir,dir,'logical aim projects once for view '+dir);G.cancel(e);}
});

test('a committed goblin attack takes full damage but continues; an early wind-up, parry and player finisher can interrupt',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;let hits=0;
 g.damagePlayer=()=>hits++;
 Object.assign(e,{dead:false,hp:50,maxHp:50,stun:0,dir:1,cooldown:99});p.combo=0;G.start(e);
 const contact=G.times('attack',false,0).slice(0,2).reduce((a,b)=>a+b,0);
 G.advance(e,contact-.10);const elapsed=e.swingElapsed,hp=e.hp;
 g.damageEnemy(e,1);assert.ok(e.hp<hp,'still takes full player damage');assert.equal(e.swingElapsed,elapsed,'late commitment is not erased');assert.equal(e.stun,0);
 const v=G.weaponPose(1,G.pose('attack',1,2,0)),len=a.HearthreaverWeapons.get(G.character(e.skin).weapon).length*.85,q=Projection.inverse(v.h[0]+v.u[0]*len*.65,v.h[1]+v.u[1]*len*.65+9);
 Object.assign(p,{x:e.x+q.x,y:e.y+q.y,hitPause:0});
 for(let i=0;i<35;i++)g.update(.02,{});assert.equal(hits,1,'the committed impact is actually delivered');
 e.stun=0;p.combo=0;G.start(e);g.damageEnemy(e,1);assert.equal(e.swingElapsed,null,'early preparation remains interruptible');
 e.stun=0;G.start(e);G.advance(e,contact-.10);p.combo=3;g.damageEnemy(e,1);assert.equal(e.swingElapsed,null,'player finisher still staggers a committed opponent');
 e.stun=0;p.combo=0;p.hitPause=0;G.start(e);G.advance(e,contact-.10);p.guard=true;p.parry=.18;p.dir=g.direction(e.x-p.x,e.y-p.y);g.defend(e);assert.equal(e.swingElapsed,null,'a real parry still stops commitment');
});

test('a lone goblin at actual contact delivers repeated attacks with no multi-second mandatory retreat',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;
 Object.assign(e,{dead:false,hp:99,maxHp:99,stun:0,cooldown:0,x:p.x-18,y:p.y+18,dir:1});
 delete g.move;p.inv=999;const starts=[],impacts=[];g.damagePlayer=()=>impacts.push(g.time);
 for(let i=0;i<400;i++){const was=Number.isFinite(e.swingElapsed);g.update(.02,{});if(!was&&Number.isFinite(e.swingElapsed))starts.push(g.time);}
 console.log('solo cadence',JSON.stringify({starts,impacts}));
 assert.ok(starts.length>=7,'at least seven attempts in eight seconds, with real body collisions');
 assert.ok(impacts.length>=5,'actual impacts, not only starting poses');
 for(let i=1;i<starts.length;i++)assert.ok(starts[i]-starts[i-1]<1.3,'no forced multi-second idle between blows');
});

test('real player combo pressure cannot erase every goblin counterattack',()=>{
 const g=arena(),G=a.HearthreaverGoblins,e=g.enemies[0],p=g.player;
 delete g.move;Object.assign(p,{hp:999,maxHp:999,inv:0,weapon:'aiguille-corail',attack:0,attackCD:0,comboWindow:0,hitPause:0,attackHeld:false});
 Object.assign(e,{dead:false,hp:999,maxHp:999,stun:0,cooldown:0,x:p.x-18,y:p.y+18,dir:1});g.targetId=e.id;
 let counters=0,attempts=0;const damage=g.damagePlayer;g.damagePlayer=function(...args){counters++;return damage.apply(this,args);};
 for(let i=0;i<600;i++){const was=Number.isFinite(e.swingElapsed);g.update(.02,{attackPressed:true,attack:true});if(!was&&Number.isFinite(e.swingElapsed))attempts++;}
 console.log('under player pressure',JSON.stringify({attempts,counters,enemyDamage:999-e.hp,hpLost:999-p.hp,playerSwings:g.swing}));
 assert.ok(e.hp<995,'the test actually lands player attacks');assert.ok(attempts>=8&&counters>=5,'the goblin frequently retaliates during real player combos');assert.ok(999-p.hp>=4,'real counters hurt and interrupt the attacking player');
});
