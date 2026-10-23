'use strict';
const {test,before}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{loadGame,combatGame}=require('./game-harness.cjs');
// The dungeon plays 8-bit families from the shared chip bank; they are rendered outside the vm sandbox, where math is fast.
const ChipSfx=new Function(fs.readFileSync(path.join(__dirname,'../scripts/chip-sfx.js'),'utf8').match(/^const ChipSfx=[\s\S]*?\n\}\)\(\);/m)[0]+';return ChipSfx;')();
const {families}=JSON.parse(fs.readFileSync(path.join(__dirname,'../audio/chip-sfx.json'),'utf8'));
const DUNGEON=Object.keys(families).filter(n=>['Donjon','Gobelins'].includes(families[n].group)).concat(['door_open','lever','crate_hit','crate_break','barrel_hit','barrel_break']);
const SR=32000,render=(name,k)=>{const v=families[name].variants[k],d=ChipSfx.render(v,SR);return d.map(x=>x*v.gain);};
let a;before(async()=>{a=await loadGame();});
function dungeon(){const g=combatGame(a);g.startFirstDungeon();g.player.spawnFX=0;for(const e of g.enemies)e.dead=true;return g;}
// A listener with no audio: the watcher's decisions are recorded instead of played.
function listen(g){const s=new a.Sound(),heard=[];Object.assign(s,{enabled:true,sfxOn:true,ctx:{currentTime:0},master:{}});s.dungeonPlay=name=>heard.push(name);s.chipBuffer=()=>null;
 const tick=()=>{s.watchDungeon(g,true,1/60);return heard.splice(0);};tick();return tick;}

test('every dungeon sound is an 8-bit family with variants where it repeats, audible, unclipped and fading out',()=>{
 for(const name of DUNGEON){const f=families[name];assert.ok(f&&f.level<-30&&f.level>-50,name);
  if(/^(gob|chief)_(hurt|effort)$|^gob_|_(hit|break)$|^plate_|^crate_(grab|release)$|^door_(open|unlock|locked)$|^key$|^lever$/.test(name))assert.ok(f.variants.length>=2,name+' has variants');
  for(let k=0;k<f.variants.length;k++){const d=render(name,k);let peak=0;for(const v of d){assert.ok(Number.isFinite(v),name);peak=Math.max(peak,Math.abs(v));}
   assert.ok(peak>.02&&peak*.3<.5,name+' peak '+peak);if(!f.loop)assert.ok(Math.abs(d[d.length-1])<.002,name+' fades out');}}
 assert.equal(families.crate_scrape.loop,1);
});

// Longest time a narrow spectral line (300 Hz to 8 kHz) stays 15 dB above its neighbourhood: a bell rings on, a clank doesn't.
function ringing(d,sr){const N=2048,hop=512,lo=Math.floor(300/sr*N),hi=Math.floor(8000/sr*N),spec=[];let top=-1e9;
 for(let f=0;f+N<=d.length;f+=hop){const re=new Float64Array(N),im=new Float64Array(N);for(let i=0;i<N;i++)re[i]=d[f+i]*(.5-.5*Math.cos(2*Math.PI*i/N));
  for(let i=1,j=0;i<N;i++){let b=N>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
  for(let len=2;len<=N;len<<=1){const a=-2*Math.PI/len;for(let i=0;i<N;i+=len)for(let j=0;j<len/2;j++){const cr=Math.cos(a*j),ci=Math.sin(a*j),p=i+j,q=p+len/2,vr=re[q]*cr-im[q]*ci,vi=re[q]*ci+im[q]*cr;re[q]=re[p]-vr;im[q]=im[p]-vi;re[p]+=vr;im[p]+=vi;}}
  const m=new Float64Array(hi+32);for(let k=lo-32;k<hi+32;k++){m[k]=20*Math.log10(Math.hypot(re[k],im[k])+1e-9);top=Math.max(top,m[k]);}spec.push(m);}
 let run=new Map(),best=0;
 for(const m of spec){const now=new Map();for(let k=lo;k<hi;k++){if(!(m[k]>m[k-1]&&m[k]>=m[k+1])||m[k]<top-45)continue;
  const near=[];for(let j=k-30;j<=k+30;j++)if(Math.abs(j-k)>2)near.push(m[j]);near.sort((a,b)=>a-b);if(m[k]-near[near.length>>1]<15)continue;
  const n=Math.max(run.get(k-1)||0,run.get(k)||0,run.get(k+1)||0)+1;now.set(k,n);best=Math.max(best,n);}run=now;}
 return best*hop/sr;}

test('iron clanks and rattles instead of ringing like a bell, wood knocks',()=>{
 // Voices are tonal by nature, and so is the squeaking hinge of an opening door.
 for(const name of DUNGEON){if(/^(gob|chief)_(hurt|die|bark|effort|roar)$|^door_open$/.test(name))continue;
  for(let k=0;k<families[name].variants.length;k++){const t=ringing(render(name,k),SR);assert.ok(t<.42,name+' rings '+t.toFixed(2)+' s');}}
});

test('each dungeon mechanism plays its own sound once, from the change of state',()=>{
 const g=dungeon(),F=a.FirstDungeon,s=F.state(g),tick=listen(g);assert.deepEqual(tick(),[]);
 s.levers.push('20,1,N');s.open.push('7,3,N','9,3,N','13,3,N','15,3,N');assert.deepEqual(tick(),['lever','gate_cells']);
 g.dungeon.keys.push('serpent');assert.deepEqual(tick(),['key']);
 s.open.push('5,1,O');assert.deepEqual(tick(),['door_unlock']);assert.deepEqual(tick(),[]);
 g.enterDungeonFloor('grande-salle',{x:15.5*32,y:9.5*32});tick();const G=F.state(g),[c1,c2]=G.crates,p=g.player;
 g.dungeonGrip={id:c1.id,floor:'grande-salle',axis:'x',dx:p.x-c1.x,dy:p.y-c1.y};assert.deepEqual(tick(),['crate_grab']);
 Object.assign(c1,F.at([15.5,5.5]));Object.assign(c2,F.at([15.5,7.5]));g.updateDungeonPlates();assert.deepEqual(tick().sort(),['gate_rise','plate_down','plate_down']);
 g.dungeonGrip=null;c1.x+=40;g.updateDungeonPlates();assert.deepEqual(tick().sort(),['crate_release','gate_drop','plate_up']);
 g.dungeon.lift=true;assert.deepEqual(tick(),['winch']);
 g.enterDungeonFloor('geoles',F.at([4.5,10.5]));assert.deepEqual(tick(),['lift']);
 g.enterDungeonFloor('trone',{x:11.5*32,y:12*32});tick();g.dungeon.bossFight=true;assert.deepEqual(tick(),['door_slam']);
 g.dungeon.bossDead=true;g.dungeon.bossFight=false;assert.deepEqual(tick(),['door_open']);
});

test('goblins cry when hit, die with a body fall, and Grise-Gueule has his own voice',()=>{
 const g=dungeon(),p=g.player,e=g.enemies.find(e=>!e.chief);Object.assign(e,{dead:false,hp:3,x:p.x+14,y:p.y,cooldown:99});const tick=listen(g);
 g.damageEnemy(e,1);assert.deepEqual(tick(),['gob_hurt']);g.damageEnemy(e,9);assert.deepEqual(tick(),['gob_die','gob_fall']);
 g.enterDungeonFloor('trone',{x:11.5*32,y:12*32});const chief=g.enemies.find(e=>e.chief);Object.assign(chief,{x:g.player.x+20,y:g.player.y});tick();
 g.damageEnemy(chief,1);assert.deepEqual(tick(),['chief_hurt']);
});
