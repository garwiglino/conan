/* First official level: Claude's four-floor fortress, isolated from atlas coordinates.
 * Logical units, weapons, damage, controls and death flow stay shared with the game. */
const FirstDungeon=(()=>{
'use strict';
const D=DUNGEON_DATA.design,A=DUNGEON_DATA.art,CELL=32,byId=Object.fromEntries(D.etages.map(e=>[e.id,e]));
const fields=['enemies','npcs','chests','steles','drops','atlasProps','checkpoint','weaponDrops'];
const at=p=>({x:p[0]*CELL,y:p[1]*CELL,level:0}),edge=k=>{const [i,j,o]=k.split(',');return {x:(+i+(o==='N'?.5:0))*CELL,y:(+j+(o==='O'?.5:0))*CELL,o};};
const near=(p,q,r=25)=>Math.hypot(p.x-q.x,p.y-q.y)<r;
const floor=(e,x,y)=>!!e.plan[Math.floor(y/CELL)]?.[Math.floor(x/CELL)]&&e.plan[Math.floor(y/CELL)][Math.floor(x/CELL)]!=='#';
const pass=/^(arche|porte-ouverte|porte-cellule-ouverte|herse-levee|escalier-montant|mur-breche)$/;
const Art={ready:false,pieces:{},floors:{},goblins:{}};
const load=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Dungeon art could not load'));im.src=src;});
Art.promise=Promise.all([
 ...Object.entries(A.pieces).map(async([id,p])=>{Art.pieces[id]={...p,frames:await Promise.all(p.frames.map(load))};}),
 ...Object.entries(A.floors).map(async([id,p])=>{Art.floors[id]={...p,ground:await load(p.ground)};}),
 ...Object.entries(A.goblins).map(async([id,p])=>{Art.goblins[id]=await Promise.all(p.map(load));})
]).then(()=>{Art.ready=true;}).catch(e=>{Art.error=e.message;});
QUESTS.unshift({id:'evasion',main:true,title:'La forteresse de Grise-Gueule',obj:'Quitter la forteresse',desc:'Niveau 1 · Échappe-toi des geôles, trouve les clés serpent, crâne et croc, affronte Grise-Gueule et trouve comment briser le sceau de la sortie.',goal:1,reward:{xp:100},count:g=>g.story?.dungeonEscaped?1:0});
function record(e){return {open:[],levers:[],chests:[],seen:[],crates:e.objets.map(([n,x,y],i)=>n==='caisse'?{id:i,x:x*CELL,y:y*CELL}:null).filter(Boolean),enemies:(e.gobelins||[]).map((p,i)=>({id:'dungeon-'+e.id+'-'+i,kind:'goblin',bossGuard:e.id==='trone'&&p[1]<9,skin:i%2?'pillard':'guerrier-kesh',...at(p),homeX:p[0]*CELL,homeY:p[1]*CELL,hp:3,maxHp:3,r:6,dir:2,anim:0,cooldown:1,wind:0,stun:0,flash:0,attack:0}))};}
function current(g){return byId[g.dungeon.floor];}
function state(g){return g.dungeon.floors[g.dungeon.floor];}
function open(g,k){return state(g).open.includes(k);}
function openEdge(g,k){const s=state(g);if(!s.open.includes(k))s.open.push(k);}
function keyChest(g,k){return current(g).objets.findIndex(([n,x,y])=>n==='coffre'&&Math.hypot(x*CELL-k.pos[0]*CELL,y*CELL-k.pos[1]*CELL)<4);}
function chestState(g,i){return state(g).chestStates?.[i]||{open:state(g).chests.includes(i)};}
function keyReady(g,k){const i=keyChest(g,k);return i<0||state(g).chests.includes(i)&&LootPresentation.chestFrame(chestState(g,i))>=2;}
Game.prototype.openDungeonChest=function(i){const e=current(this),s=state(this),o=e.objets[i];if(!o||s.chests.includes(i))return false;
 s.chestStates??={};const ch=s.chestStates[i]={x:o[1]*CELL,y:o[2]*CELL,level:0,open:false};s.chests.push(i);return this.openLootChest(ch);
};
function checkpoint(g){g.dungeon.checkpoint={floor:g.dungeon.floor,x:g.player.x,y:g.player.y};}
Game.prototype.startFirstDungeon=function(saved=null){
 if(this.dungeon?.active)return false;
 this.dungeonWorld=Object.fromEntries(fields.map(k=>[k,this[k]]));
 const boss={id:D.boss.id,kind:'goblin',skin:'grise-gueule',chief:true,...at(D.boss.pos),homeX:D.boss.pos[0]*CELL,homeY:D.boss.pos[1]*CELL,hp:18,maxHp:18,r:8,dir:2,anim:0,cooldown:1,wind:0,stun:0,flash:0,attack:0};
 const fresh={version:1,id:D.id,active:true,floor:D.depart.etage,keys:[],fairy:false,bossDead:false,lift:false,floors:Object.fromEntries(D.etages.map(e=>[e.id,record(e)])),position:at(D.depart.pos)};
 fresh.floors.trone.enemies.push(boss);
 this.dungeon=saved?.version===1&&saved.id===D.id&&byId[saved.floor]?JSON.parse(JSON.stringify(saved)):fresh;
 this.dungeon.floors??=fresh.floors;
 // Append reinforcements by stable id without reviving any saved casualty.
 for(const [id,base]of Object.entries(fresh.floors)){
  const stored=this.dungeon.floors[id]??=base,ids=new Set(stored.enemies.map(e=>e.id));
  for(const e of base.enemies)if(!ids.has(e.id))stored.enemies.push({...e,...((e.chief||e.bossGuard)&&this.dungeon.bossDead?{dead:true,hp:0}:{})});
 }
 this.dungeonRuntimeFloor=null;this.dungeon.active=true;this.dungeon.floors=this.dungeon.floors||fresh.floors;
 this.npcs=[];this.chests=[];this.steles=[];this.drops=[];this.atlasProps=[];this.weaponDrops=[];
 this.story.escaped=false;this.story.fairy=!!this.dungeon.fairy;this.story.dungeonEscaped=false;
 this.quests.known.add('evasion');this.quests.tracked.add('evasion');this.quests.known.delete('sceaux');this.quests.tracked.delete('sceaux');
 this.enterDungeonFloor(this.dungeon.floor,this.dungeon.position||at(D.depart.pos),false);
 if(!this.dungeon.checkpoint)checkpoint(this);
 if(!saved)this.emit('notice',{title:'Niveau 1 · Lieu inconnu',text:'Tu te réveilles dans une cellule. Le mur effondré ouvre un passage derrière la paillasse.'});
 return true;
};
Game.prototype.enterDungeonFloor=function(id,position,savePoint=true){
 if(!byId[id]||!this.dungeon?.active)return false;
 if(this.dungeonRuntimeFloor===this.dungeon.floor){state(this).drops=this.drops;state(this).weaponDrops=this.weaponDrops;}
 this.dungeonGrip=null;this.dungeon.floor=id;this.dungeonRuntimeFloor=id;this.enemies=state(this).enemies;
 this.drops=state(this).drops||[];this.weaponDrops=state(this).weaponDrops||[];
 for(const e of this.enemies){e.species='goblin';e.armed=true;e.armament=HearthreaverGoblins.character(e.skin).weapon;if(!Number.isFinite(e.swingElapsed)){e.wind=0;e.attack=0;}}
 Object.assign(this.player,{x:position.x,y:position.y,level:0,attack:0,dash:0,attackBuffer:0,onStairs:false});delete this.player.elevation;
 this.particles=[];this.floaters=[];this.debris=[];this.weaponShake=null;this.targetId=null;this.shots=[];this.hazards=[];this.blood=[];this.bloodFX=[];this.remains=[];
 this.checkpoint={x:position.x,y:position.y,level:0};if(savePoint)checkpoint(this);
 this.revealDungeon();this.emit('save');return true;
};
function blocks(g,k,n){if(open(g,k))return false;if(n==='porte'&&g.dungeon.floor==='trone')return !!g.dungeon.bossFight&&!g.dungeon.bossDead;return !pass.test(n)&&!/^levier/.test(n);}
function geometry(g,x,y,r,skipCrate=null){const e=current(g);
 for(const [dx,dy]of [[-r,-r],[r,-r],[-r,r],[r,r],[0,0]])if(!floor(e,x+dx,y+dy))return true;
 for(const [k,n]of Object.entries(e.murs)){const p=edge(k);if(blocks(g,k,n)){if(p.o==='N'?Math.abs(y-p.y)<r+3&&Math.abs(x-p.x)<CELL/2+r:Math.abs(x-p.x)<r+3&&Math.abs(y-p.y)<CELL/2+r)return true;}}
 for(const b of state(g).crates)if(b!==skipCrate&&Math.abs(x-b.x)<r+9&&Math.abs(y-b.y)<r+9)return true;
 // Furniture has a small physical footprint. Beds and rubble at the start remain traversable.
 const gone=state(g).broken||[];
 for(let i=0;i<e.objets.length;i++){const [n,a,b]=e.objets[i];if(/^(pilier-rond|pilier-carre|table|marmite|trone|totem|caisses)$/.test(n)&&!gone.includes(i)&&Math.abs(x-a*CELL)<r+7&&Math.abs(y-b*CELL)<r+5)return true;}
 return false;
}
const solid=Game.prototype.solid;Game.prototype.solid=function(x,y,r=5,level=0){return this.dungeon?.active?geometry(this,x,y,r):solid.call(this,x,y,r,level);};
const tile=Game.prototype.tile;Game.prototype.tile=function(x,y){if(!this.dungeon?.active)return tile.call(this,x,y);const c=current(this).plan[Math.floor(y/CELL)]?.[Math.floor(x/CELL)];return c&&c!=='#'?(c==='='?5:2):6;};
const movePlayer=Game.prototype.movePlayer;
Game.prototype.movePlayer=function(p,dx,dy){if(!this.dungeon?.active)return movePlayer.call(this,p,dx,dy);
 if(p===this.player&&this.dungeonGrip){this.moveDungeonCrate(p,dx,dy);return;}
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));for(let i=0;i<steps;i++)for(const [x,y]of [[dx/steps,0],[0,dy/steps]]){if(!x&&!y)continue;const nx=p.x+x,ny=p.y+y,b=state(this).crates.find(b=>Math.abs(nx-b.x)<14&&Math.abs(ny-b.y)<14);
  if(b){const bx=b.x+x,by=b.y+y;if(!geometry(this,bx,by,9,b)&&!this.enemies.some(e=>!e.dead&&near(e,{x:bx,y:by},15))){b.x=bx;b.y=by;}}
  if(!this.solid(nx,ny,p.r||5)&&!this.crowd(p,nx,ny)){p.x=nx;p.y=ny;}}
 this.updateDungeonPlates();
};
// Barrels and crate stacks give way to the blade like the world's breakables: two blows (one for the combo finisher),
// splinters, the same loot, broken state saved per floor. The single pushable crate stays whole for its plates.
const SMASH={tonneau:{kind:'barrel',r:9,sound:'barrel'},caisses:{kind:'crates',r:12,sound:'crate'}};
Game.prototype.hitDungeonProps=function(p,f){const e=current(this),s=state(this),gone=s.broken||(s.broken=[]);this.dungeonPropHp??=new Map();
 e.objets.forEach(([n,x,y],i)=>{const S=SMASH[n];if(!S||gone.includes(i))return;const o={x:x*CELL,y:y*CELL},key=e.id+':'+i;
  if(this.hits.has(key)||Math.abs(o.x-p.x)>48||Math.abs(o.y-p.y)>48||!bladeHits(p,{x:o.x,y:o.y+1,r:S.r},f))return;
  const d=Math.max(1,dist(p,o));if(!this.lineClear(p,{x:o.x+(p.x-o.x)/d*14,y:o.y+(p.y-o.y)/d*14}))return;
  this.hits.add(key);const B=BREAKABLE[S.kind],P=DEBRIS[B.mat],hp=(this.dungeonPropHp.get(key)??B.hp)-(p.combo===3?2:1);this.player.hitPause=Math.max(this.player.hitPause||0,.05);
  if(hp>0){this.dungeonPropHp.set(key,hp);for(const c of P.c.slice(0,2))this.burst(o.x,o.y-8,c,4);this.emit('dsfx',{name:S.sound+'_hit',...o});return;}
  this.dungeonPropHp.delete(key);gone.push(i);for(const c of P.c)this.burst(o.x,o.y-8,c,6);this.emit('dsfx',{name:S.sound+'_break',...o});
  const loot=B.loot();if(loot.length)this.ejectLoot({x:o.x,y:o.y-2,level:0},loot,.12);this.emit('save');});
};
// Player and crate move as one collision-checked pair; grabbing never snaps either.
Game.prototype.moveDungeonCrate=function(p,dx,dy){
 const grip=this.dungeonGrip,b=state(this).crates.find(b=>b.id===grip?.id);
 if(!b||grip.floor!==this.dungeon.floor||Math.hypot(p.x-b.x-grip.dx,p.y-b.y-grip.dy)>2){this.dungeonGrip=null;return;}
 const amount=grip.axis==='x'?dx:dy,n=Math.max(1,Math.ceil(Math.abs(amount)));
 for(let i=0;i<n;i++){
  const x=grip.axis==='x'?amount/n:0,y=grip.axis==='y'?amount/n:0,nx=p.x+x,ny=p.y+y,bx=b.x+x,by=b.y+y;
  if(geometry(this,nx,ny,p.r||5,b)||geometry(this,bx,by,9,b)||this.crowd(p,nx,ny)||this.enemies.some(e=>!e.dead&&near(e,{x:bx,y:by},15)))break;
  p.x=nx;p.y=ny;b.x=bx;b.y=by;
 }
 p.dir=this.direction(b.x-p.x,b.y-p.y);this.updateDungeonPlates();
};
Game.prototype.updateDungeonPlates=function(){if(!this.dungeon?.active)return;for(const m of current(this).mecanismes||[])if(m.dalles){const s=state(this),down=m.dalles.every(p=>s.crates.some(b=>near(b,at(p),10)));for(const k of m.ouvre){if(down)openEdge(this,k);else if(!near(this.player,edge(k),24)&&!this.enemies.some(e=>!e.dead&&near(e,edge(k),24)))s.open=s.open.filter(v=>v!==k);}}};
Game.prototype.revealDungeon=function(){const s=state(this),e=current(this),seen=new Set(s.seen),todo=[[Math.floor(this.player.x/CELL),Math.floor(this.player.y/CELL)]],walked=new Set();
 while(todo.length){const [i,j]=todo.pop(),k=i+','+j;if(walked.has(k)||!floor(e,(i+.5)*CELL,(j+.5)*CELL))continue;walked.add(k);seen.add(k);
  for(const [a,b,k]of [[i,j-1,i+','+j+',N'],[i,j+1,i+','+(j+1)+',N'],[i-1,j,i+','+j+',O'],[i+1,j,(i+1)+','+j+',O']])if(!e.murs[k]||!blocks(this,k,e.murs[k]))todo.push([a,b]);}
 s.seen=[...seen];this.dungeonSeen=seen;
};
Game.prototype.dungeonContext=function(){if(this.dungeonGrip)return {kind:'dungeon-crate',id:this.dungeonGrip.id,text:'E  LÂCHER LA CAISSE · AVANCER / RECULER'};const weapon=KaldorArmaments.weaponContext(this);if(weapon)return weapon;const e=current(this),s=state(this),p=this.player,options=[],add=(q,pos,text)=>{const point=at(pos);if(near(p,point,28)&&this.lineClear(p,point))options.push({...q,...point,text,d:dist(p,point)});},wall=(q,k,text)=>{const a=edge(k);for(const side of [1,-1]){const x=a.x+(a.o==='O'?side*10:0),y=a.y+(a.o==='N'?side*10:0);if(floor(e,x,y))add(q,[x/CELL,y/CELL],text);}};
 for(const b of s.crates){const d=Math.max(1,dist(p,b)),probe={x:b.x+(p.x-b.x)/d*12,y:b.y+(p.y-b.y)/d*12};if(near(p,b,28)&&this.lineClear(p,probe))options.push({kind:'dungeon-crate',id:b.id,text:'E  SAISIR LA CAISSE · POUSSER / TIRER',d});}
 for(const k of D.cles)if(k.etage===e.id&&!this.dungeon.keys.includes(k.id)&&keyReady(this,k))add({kind:'dungeon-key',id:k.id},k.pos,'E  PRENDRE : '+k.nom);
 for(const m of e.mecanismes||[]){for(const k of m.bords|| (m.bord?[m.bord]:[]))wall({kind:'dungeon-lever',id:m.id,bord:k},k,'E  ACTIONNER LE LEVIER');if(m.id==='treuil')add({kind:'dungeon-winch'},m.pos,'E  REMONTER LE MONTE-CHARGE');}
 for(const d of e.portes||[])if(d.condition==='fee')wall({kind:'dungeon-exit'},d.bord,this.dungeon.fairy?'E  BRISER LE SCEAU ET SORTIR':'LE SCEAU RESTE VERROUILLÉ');else if(d.cle&&!open(this,d.bord))wall({kind:'dungeon-door',door:d},d.bord,'E  OUVRIR : '+d.nom);
 for(const l of e.liens||[]){if(l.bord)wall({kind:'dungeon-stairs',link:l},l.bord,'E  MONTER');else add({kind:'dungeon-stairs',link:l},l['trémie'].map(v=>v+.5),'E  DESCENDRE');}
 if(D.monte_charge.arrets.includes(e.id))add({kind:'dungeon-lift'},D.monte_charge.case.map(v=>v+.5),this.dungeon.lift?'E  MONTE-CHARGE : CHOISIR UN ÉTAGE':'LE TREUIL EST AUX GALERIES');
 e.objets.forEach(([n,x,y],i)=>{if(/^(coffre|tresor)$/.test(n)&&!s.chests.includes(i)){const k=D.cles.find(k=>k.etage===e.id&&keyChest(this,k)===i);add({kind:'dungeon-chest',i,id:k?.id||String(i)},[x,y],'E  OUVRIR LE COFFRE');}});
 options.sort((a,b)=>a.d-b.d);return options[0]||null;
};
const context=Game.prototype.context;Game.prototype.context=function(){return this.dungeon?.active?this.dungeonContext():context.call(this);};
const interact=Game.prototype.interact;
Game.prototype.interact=function(){if(!this.dungeon?.active)return interact.call(this);if(this.dead||this.dying||this.player.attack>0||this.player.dash>0)return;
 const c=this.dungeonContext();if(!c)return;if(c.kind==='weapon'){this.takeNearbyWeapon(c.id);return;}const s=state(this),e=current(this),d=this.dungeon;
 if(c.kind==='dungeon-crate'){
  if(this.dungeonGrip)this.dungeonGrip=null;
  else{const b=s.crates.find(b=>b.id===c.id),p=this.player,dx=p.x-b.x,dy=p.y-b.y;this.dungeonGrip={id:b.id,floor:e.id,axis:Math.abs(dx)>Math.abs(dy)?'x':'y',dx,dy};p.dir=this.direction(-dx,-dy);}
  this.emit('save');return;
 }
 if(c.kind==='dungeon-key'){d.keys.push(c.id);this.emit('loot');this.emit('notice',{title:D.cles.find(k=>k.id===c.id).nom,text:'La clé est conservée dans ton inventaire.'});}
 if(c.kind==='dungeon-door'){if(d.keys.includes(c.door.cle)){openEdge(this,c.door.bord);this.emit('door',{open:true});}else{this.emit('message',{text:'Il te manque la '+D.cles.find(k=>k.id===c.door.cle).nom+'.'});this.emit('dsfx',{name:'door_locked',...edge(c.door.bord)});}}
 if(c.kind==='dungeon-lever'){const m=e.mecanismes.find(m=>m.id===c.id);if(c.id==='levier-cage'){if(!d.bossDead){this.emit('message',{text:'Grise-Gueule garde le levier. Terrasse-le d’abord.'});return;}if(!d.fairy){d.fairy=true;this.story.fairy=true;this.emit('notice',{title:'La cage est ouverte',text:'Rejoins la porte scellée de la grande salle.'});}}else{if(!s.levers.includes(c.bord))s.levers.push(c.bord);if(!(m.bords||[m.bord]).some(k=>!s.levers.includes(k)))for(const k of m.ouvre||[])openEdge(this,k);}this.emit('lever');}
 if(c.kind==='dungeon-winch'){d.lift=true;this.emit('notice',{title:'Monte-charge activé',text:'Le puits dessert les galeries, la caserne et les geôles.'});}
 if(c.kind==='dungeon-lift'){if(!d.lift){this.emit('message',{text:'Actionne d’abord le treuil des galeries.'});return;}const stops=D.monte_charge.arrets;this.talk('MONTE-CHARGE',['Choisis un étage.'],null,20,null,{prompt:'Quel étage ?',options:[...stops.filter(id=>id!==e.id).map(id=>({label:byId[id].nom,lines:[''],end:true,act:()=>this.enterDungeonFloor(id,at([4.5,10.5]))})),{label:'Rester ici',lines:[''],end:true}]});}
 if(c.kind==='dungeon-stairs'){const l=c.link,t=byId[l.vers];let pos;if(l.arrivee)pos=l.arrivee.map(v=>v+.5);else{const back=t.liens.find(q=>q.vers===e.id&&q.bord),p=edge(back.bord);pos=[(p.x+(p.o==='O'?12:0))/CELL,(p.y+(p.o==='N'?12:0))/CELL];}this.enterDungeonFloor(t.id,at(pos));}
 if(c.kind==='dungeon-chest')this.openDungeonChest(c.i);
 if(c.kind==='dungeon-exit'){if(!d.fairy){this.emit('message',{text:'Une rune violette ferme la porte. Son secret se trouve plus haut.'});return;}this.emit('dsfx',{name:'door_open'});this.leaveFirstDungeon();return;}
 this.revealDungeon();this.emit('save');
};
Game.prototype.leaveFirstDungeon=function(){if(!this.dungeon?.active||!this.dungeon.fairy||!this.dungeon.bossDead)return false;
 this.dungeonGrip=null;this.dungeon.active=false;Object.assign(this,this.dungeonWorld);delete this.dungeonWorld;
 this.story.escaped=this.story.fairy=this.story.dungeonEscaped=true;this.fairyActor.alpha=1;
 const p=Atlas.toGame(D.lieu.monde.x,D.lieu.monde.y);this.placeSafely(p.x,p.y);Object.assign(this.fairyActor,{x:this.player.x-20,y:this.player.y-12});Object.assign(this.escortActor,{x:START.x+36,y:START.y});
 this.checkpoint={x:this.player.x,y:this.player.y,level:0};this.worldCheckpoint={...this.checkpoint};this.pendingBossWin=false;this.won=false;this.bossActive=false;this.targetId=null;this.dialogue=null;this.shots=[];this.hazards=[];this.remains=[];this.blood=[];this.bloodFX=[];
 this.discover(['sceaux'],true);this.checkQuests();this.registerDungeonPlace();this.updateLocation(0);this.recordExploration();this.emit('notice',{title:'Niveau 1 terminé',text:'Tu as quitté la forteresse de Grise-Gueule · Sarak.'});this.emit('save');return true;
};
Game.prototype.registerDungeonPlace=function(){if(!this.story.dungeonEscaped)return;const id='dungeon-'+D.id;if(!this.mapPlaces.some(p=>p.id===id))this.mapPlaces.push({id,name:D.nom,category:'story',x:D.lieu.monde.x,y:D.lieu.monde.y,radius:8});this.visitedPlaces.add(id);};
const zone=Game.prototype.zone;Game.prototype.zone=function(){return this.dungeon?.active?'Lieu inconnu · '+current(this).nom:zone.call(this);};
const guidance=Game.prototype.questGuidance;Game.prototype.questGuidance=function(){return this.dungeon?.active?[]:guidance.call(this);};
const qState=Game.prototype.qState;Game.prototype.qState=function(q){if(this.dungeon?.active&&q.id!=='evasion')return 'locked';if(q.id==='evasion'&&!this.dungeon&&!this.story?.dungeonEscaped)return 'locked';return qState.call(this,q);};
const targets=Game.prototype.combatTargets;Game.prototype.combatTargets=function(){return this.dungeon?.active?this.enemies:targets.call(this);};
const bodies=Game.prototype.bodies;Game.prototype.bodies=function(o){return this.dungeon?.active?(o===this.player?this.enemies.filter(e=>!e.dead):[this.player,...this.enemies.filter(e=>e!==o&&!e.dead)]):bodies.call(this,o);};
const damageEnemy=Game.prototype.damageEnemy;
Game.prototype.damageEnemy=function(e,n){
 if(!this.dungeon?.active)return damageEnemy.call(this,e,n);if(e.dead)return;
 const before=e.hp,result=damageEnemy.call(this,e,n);if(e.hp>=before)return result;
 // Keep the shared power, riposte, hit sound, blood, target, loot and feedback.
 // The goblin rig only supplies its own reaction and the dungeon boss outcome.
 e.hurtElapsed=0;e.stun=Math.max(e.stun||0,HearthreaverGoblins.duration('hurt'));HearthreaverGoblins.cancel(e);
 if(e.dead){e.deathElapsed=0;this.gainXP(e.chief?40:8);if(e.chief){this.dungeon.bossDead=true;this.dungeon.bossFight=false;this.player.hp=this.player.maxHp;this.emit('notice',{title:'Grise-Gueule est vaincu',text:'Le levier au fond de la salle est maintenant accessible.'});}this.emit('save');}
 return result;
};
const defend=Game.prototype.defend;Game.prototype.defend=function(from){const parry=this.player.parry>0,result=defend.call(this,from);if(result&&parry&&this.dungeon?.active&&from?.kind==='goblin'){HearthreaverGoblins.cancel(from);from.hurtElapsed=0;}return result;};
const respawn=Game.prototype.respawn;Game.prototype.respawn=function(){if(!this.dungeon?.active)return respawn.call(this);const c=this.dungeon.checkpoint;this.dying=null;this.dead=false;this.dialogue=null;this.dungeon.bossFight=false;GoblinTactics.reset(this);for(const e of this.enemies){HearthreaverGoblins.cancel(e);e.stun=0;e.cooldown=1;}Object.assign(this.player,{hp:this.player.maxHp,inv:2,attackCD:0,hurt:0,guard:false,parry:0});this.enterDungeonFloor(c.floor,c,false);};
const sky=Game.prototype.sky;Game.prototype.sky=function(){if(!this.dungeon?.active)return sky.call(this);return {...sky.call(this),rain:0,snow:0,storm:0,wind:0,cloud:0,night:0,family:'cursed',temperature:16};};
const save=Game.prototype.serialize;Game.prototype.serialize=function(){if(!this.dungeon?.active){const s=save.call(this);if(this.dungeon)s.dungeon=this.dungeon;return s;}
 state(this).drops=this.drops;state(this).weaponDrops=this.weaponDrops;
 const local=Object.fromEntries(fields.map(k=>[k,this[k]])),p=this.player,point={x:p.x,y:p.y,level:p.level},active=this.dungeon.active;
 this.dungeon.position=this.dying&&!this.dying.over?{x:this.dungeon.checkpoint.x,y:this.dungeon.checkpoint.y}:point;
 try{Object.assign(this,this.dungeonWorld);Object.assign(p,{x:START.x,y:START.y,level:0});this.dungeon.active=false;const s=save.call(this);s.dungeon=JSON.parse(JSON.stringify({...this.dungeon,active,bossFight:this.dying&&!this.dying.over?false:this.dungeon.bossFight,floor:this.dying&&!this.dying.over?this.dungeon.checkpoint.floor:this.dungeon.floor}));return s;}finally{Object.assign(this,local);Object.assign(p,point);this.dungeon.active=active;}
};
const restore=Game.prototype.finishAtlasRestore;Game.prototype.finishAtlasRestore=function(saved){restore.call(this,saved);if(saved?.dungeon?.active)this.startFirstDungeon(saved.dungeon);else{if(saved?.dungeon)this.dungeon=saved.dungeon;this.registerDungeonPlace();if(this.story.dungeonEscaped&&saved?.atlas?.navigation==='dungeon-'+D.id)this.navigation=saved.atlas.navigation;}};
const update=Game.prototype.update;
Game.prototype.update=function(dt,controls={}){if(!this.dungeon?.active)return update.call(this,dt,controls);const result=KaldorArsenal.combatStep.call(this,dt,{...controls,...WorldProjection.input(controls.x||0,controls.y||0)},dungeonStep);if(this.dungeon?.active){this.stepWeaponDrops(clamp(Number(dt)||0,0,.04));state(this).drops=this.drops;state(this).weaponDrops=this.weaponDrops;}return result;};
function dungeonStep(dt,controls={}){dt=clamp(dt,0,.04);this.time+=dt;this.shake=Math.max(0,this.shake-dt);if(this.dead||this.dying)this.dungeonGrip=null;if(this.dialogue){this.typeDialogue(dt);return;}if(this.dying){this.stepDying(dt);return;}if(this.dead)return;
 if(this.dungeonGrip&&(this.player.hurt>0||controls.attackPressed||controls.attack||controls.dodge||controls.guard))this.dungeonGrip=null;
 this.elapsed+=dt;this.clock+=dt*1440/DAY_LEN;this.updateEffects(dt);const p=this.player,input={...controls};
 for(const k of ['attack','attackCD','dash','dashCD','inv','comboWindow','hurt','parry','parryCD','guardFlash','riposte','hitPause','attackBuffer'])p[k]=k==='attack'&&p.weapon?HearthreaverWeapons.advance(p[k],dt,p.weapon,p.combo):Math.max(0,(p[k]||0)-dt);
 p.lvlFX=Math.max(0,(p.lvlFX||0)-dt);p.spawnFX=Math.max(0,(p.spawnFX||0)-dt);if(p.spawnFX>SPAWN_T-.9){input.x=0;input.y=0;input.attack=false;input.attackPressed=false;input.dodge=false;input.guard=false;input.interact=false;}const guardEdge=input.guard&&!p.guardHeld;p.guardHeld=!!input.guard;p.guard=!!input.guard&&p.attack<=0&&p.dash<=0&&p.hurt<=0;if(!p.guard)p.parry=0;if(guardEdge&&p.guard&&p.parryCD<=0){p.parry=.18;p.parryCD=.42;}
 if(input.dodge)this.dodge(input.x,input.y);
 const attackEdge=!!input.attackPressed||input.attack&&!p.attackHeld;p.attackHeld=!!input.attack;
 if(attackEdge&&(p.attack>0||p.attackCD>0)&&p.dash<=0&&p.hurt<=0)KaldorArsenal.queueAttack(p,input.x,input.y);
 const buffered=p.attackBuffer>0,link=buffered&&p.combo<3&&p.comboWindow>0&&p.comboRecoilShown&&p.hitPause<=0&&HearthreaverWeapons.canChain(p.attack,p.weapon,p.combo);
 if((attackEdge||buffered)&&((p.attackCD<=0&&p.attack<=0)||link)&&p.dash<=0&&p.hurt<=0){if(link){p.attack=0;p.attackCD=0;}const x=buffered?p.bufferX:input.x,y=buffered?p.bufferY:input.y;if(x||y)this.aimAttack(x,y);else this.aimAttack(...this.facing(p.dir),true);this.faceTarget();if((x||y)&&!this.target())p.dir=this.direction(x,y);this.swingSword();}
 if(input.interact)this.interact();if(!this.dungeon.active)return;
 p.steer=!!(input.x||input.y);
 const ox=p.x,oy=p.y;if(this.dungeonGrip&&p.attack<=0&&p.hurt<=0){this.movePlayer(p,(input.x||0)*dt*24,(input.y||0)*dt*24);}else if(p.dash>0){this.movePlayer(p,p.dashX*120*dt,p.dashY*120*dt);if(Math.floor(this.time*40)%2===0)this.particles.push({x:p.x,y:p.y-2,vx:0,vy:0,life:.16,color:'#e8cc96'});}else if((input.x||input.y)&&(p.attack<=0||this.target())&&p.hurt<=0){if(p.attack<=0)p.dir=this.turnTo(p.dir,input.x,input.y);const speed=p.guard?29:p.attack>0?18:67;this.movePlayer(p,input.x*dt*speed,input.y*dt*speed);}
 p.moving=Math.hypot(p.x-ox,p.y-oy)>.001;p.anim=p.moving?(p.anim||0)+Math.hypot(p.x-ox,p.y-oy)/5.5:0;
 if(!this.dungeonGrip)this.faceTarget();p.impactTick=p.attack>0&&HearthreaverWeapons.sample(p.attack,p.weapon,p.combo)===2&&!p.impactDone;if(p.impactTick)p.impactDone=true;p.comboRecoilShown=p.attack>0&&HearthreaverWeapons.sample(p.attack,p.weapon,p.combo)===3.5;
 if(p.attack>0){if(p.impactTick&&!p.attackStep){p.attackStep=true;const [x,y]=this.facing(p.dir),step=HearthreaverWeapons.attackStep(p.weapon,p.combo);this.movePlayer(p,x*step,y*step);}const f=attackFrame(p.attack,p.combo,p.weapon);if(f===2||f===3){for(const e of this.enemies)if(!e.dead&&!this.hits.has(e.id)&&bladeHits(p,e,f)&&this.lineClear(p,e)){this.hits.add(e.id);this.damageEnemy(e,this.weaponDamage(p.combo===3?2:1));}this.hitDungeonProps(p,f);}}
 if(this.dungeon.floor==='trone'&&p.y<9*CELL&&!this.dungeon.bossDead)this.dungeon.bossFight=true;
 this.stepLoot(dt);
 const tactics=GoblinTactics.plan(this,dt);
 // The native enemy drawing and its single damaging event share one clock.
 for(const e of this.enemies){
  e.moving=false;const wasSwing=Number.isFinite(e.swingElapsed),impact=HearthreaverGoblins.advance(e,dt);if(e.dead)continue;
  for(const k of ['cooldown','stun','flash'])e[k]=Math.max(0,(e[k]||0)-dt);
  if(wasSwing&&!Number.isFinite(e.swingElapsed))e.cooldown=Math.max(e.cooldown,.06);
  if(e.stun>0)continue;const d=dist(e,p);if(e.chief&&!this.dungeon.bossFight||e.bossGuard&&!this.dungeon.bossFight&&!this.dungeon.bossDead)continue;
  if(impact){if(HearthreaverGoblins.hits(e,p)&&this.lineClear(e,p))this.damagePlayer(e.chief?2:1,e);e.cooldown=e.chief?1.25:.32;}
  if(Number.isFinite(e.swingElapsed)){GoblinTactics.combatMove(this,e,tactics,dt);continue;}
  const dir=this.direction(p.x-e.x,p.y-e.y),reachable=d<=(e.chief?32:21)&&HearthreaverGoblins.hits({...e,swingDir:dir,goblinCombo:e.nextCombo||0},p);
  if(reachable&&e.cooldown<=0&&this.lineClear(e,p)&&GoblinTactics.canStrike(this,e,tactics)){e.dir=dir;HearthreaverGoblins.start(e);GoblinTactics.reserve(tactics,e);this.emit('foe',{kind:'skeleton',act:'strike',vol:.4});}
  else if(!reachable||tactics.group.length>1)GoblinTactics.move(this,e,GoblinTactics.goal(this,e,tactics),tactics,dt);
 }
 this.dungeonRevealTimer=(this.dungeonRevealTimer||0)-dt;if(this.dungeonRevealTimer<=0){this.revealDungeon();this.dungeonRevealTimer=.15;}
 this.saveTimer+=dt;if(this.saveTimer>=5){this.saveTimer=0;this.emit('save');}
}
function inventoryHTML(g){if(!g.dungeon)return '';return '<div class="m-sec">Clés de la forteresse</div>'+D.cles.map(k=>'<div class="inv-row"><div class="grow">'+k.nom+'<small>'+ (g.dungeon.keys.includes(k.id)?'Obtenue · '+k.ouvre:'À trouver dans la forteresse')+'</small></div></div>').join('');}
return {design:D,art:Art,current,state,at,edge,geometry,inventoryHTML,keyChest,keyReady,chestState};
})();
