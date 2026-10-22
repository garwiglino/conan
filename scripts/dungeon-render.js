/* Uses the PR's native pixels and diagonal depth order; actors share its 2:1 grid. */
(()=>{
'use strict';
const F=FirstDungeon,D=F.design,frame=Renderer.prototype.frame;
function drawGoblinSpeech(r,g){
 const c=r.c,used=[];r.goblinSpeechRects=used;if(g.dead||g.dying||g.dialogue)return;
 c.save();c.setTransform(r.k||1,0,0,r.k||1,0,0);
 for(const speech of GoblinTactics.speech(g)){
  const n=speech.actor;if(!g.dungeonSeen?.has(Math.floor(n.x/32)+','+Math.floor(n.y/32)))continue;
  const q=WorldProjection.point(n.x,n.y),x=q.x-r.cam.x,y=r.top+q.y-r.cam.y-40,w=textW(c,speech.text)+12,h=17;
  if(x<0||x>r.W||y-h<r.top+4||y>r.H-8)continue;
  const left=Math.round(clamp(x-w/2,4,r.W-w-4)),top=Math.round(y-h);
  box(c,left-1,top-1,w+2,h+2,'#30291f');box(c,left,top,w,h,'#e8d7b2');box(c,Math.round(x)-1,top+h,3,3,'#30291f');text(c,speech.text,left+6,top+5,'#30291f');used.push({x:left,y:top,w,h,text:speech.text,actor:n.id});
 }c.restore();
}
Renderer.prototype.frame=function(){if(!this.g.dungeon?.active)return frame.call(this);
 const g=this.g,c=this.c,p=g.player,K=this.k||1,W=this.W,H=this.H,T=this.top,e=F.current(g),s=F.state(g),art=F.art,P=WorldProjection.point;
 c.setTransform(K,0,0,K,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#050408';c.fillRect(0,0,W,H);
 const hero=P(p.x,p.y),now=performance.now()/1000;this.dungeonOcclusionDt=Math.min(.05,Math.max(0,now-(this.dungeonOcclusionTime??now-1/60)));this.dungeonOcclusionTime=now;this.dungeonOcclusion=[];this.cam={x:Math.round(hero.x-W/2),y:Math.round(hero.y-(H-T)/2-10)};
 if(!art.ready){text(c,art.error?'Erreur de chargement du donjon':'Chargement du donjon…',12,T+30,'#eee0c8');return;}
 const a=art.floors[e.id],seen=g.dungeonSeen||new Set(s.seen),items=[],brightness=this.dungeonBrightness||(this.dungeonBrightness=new Map()),visible=(i,j)=>seen.has(i+','+j);
 c.save();c.beginPath();c.rect(0,T,W,H-T);c.clip();const shake=KaldorArsenal.cameraShake(g.weaponShake,typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);c.translate(-this.cam.x+shake,T-this.cam.y);c.drawImage(a.ground,-a.origin[0],-a.origin[1]);
 // Room reveal is gradual, without revealing the contents behind closed doors.
 for(let j=0;j<e.plan.length;j++)for(let i=0;i<e.plan[j].length;i++){if(e.plan[j][i]==='#')continue;const k=e.id+'/'+i+','+j,target=visible(i,j)?1:.14,old=brightness.get(k)??target,b=old+(target-old)*.14;brightness.set(k,b);const q=P(i*32,j*32);c.fillStyle='rgba(0,0,0,'+(1-b*.8)+')';c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+32,q.y+16);c.lineTo(q.x,q.y+32);c.lineTo(q.x-32,q.y+16);c.fill();}
 const blit=(name,x,y,alpha=1)=>{const z=art.pieces[name];if(!z)return;const i=/-brise$/.test(name)?e.objets.findIndex(([n,a,b])=>n===name.replace('-brise','')&&a*32===x&&b*32===y):-1,im=z.frames[i>=0?LootPresentation.breakFrame(s.props[i]):Math.floor(g.time*z.fps)%z.frames.length],q=P(x,y);c.save();c.globalAlpha*=alpha;c.drawImage(im,Math.round(q.x-z.anchor[0]),Math.round(q.y-z.anchor[1]));c.restore();};
 for(const it of a.items){let name=it.piece,ref=it.ref,light=!it.cells||it.cells.some(([i,j])=>visible(i,j));
  if(it.edge){const border=it.edge.join(','),orient=name.split('/')[0];if(s.open.includes(border))name=orient+'/'+({'porte-verrouillee':'porte-ouverte','porte-cellule':'porte-cellule-ouverte','herse':'herse-levee'}[e.murs[border]]||'porte-ouverte');if(s.levers.includes(border)||border===D.fee.levier&&g.dungeon.fairy)name=orient+'/levier-bas';if(name===orient+'/porte'&&g.dungeon.floor==='trone'&&!g.dungeon.bossFight)name=orient+'/porte-ouverte';}
  if(name==='cle'&&D.cles.some(k=>k.etage===e.id&&g.dungeon.keys.includes(k.id)&&Math.hypot(k.pos[0]*32-ref[0],k.pos[1]*32-ref[1])<3))continue;
  if(name==='caisse'){const i=e.objets.findIndex(([n,x,y])=>n==='caisse'&&x*32===ref[0]&&y*32===ref[1]),b=s.crates.find(b=>b.id===i);if(b){ref=[b.x,b.y];light=visible(Math.floor(b.x/32),Math.floor(b.y/32));}}
  if(name==='coffre'){
   const i=e.objets.findIndex(([n,x,y])=>n==='coffre'&&x*32===ref[0]&&y*32===ref[1]),oldKey=D.cles.some(k=>k.etage===e.id&&g.dungeon.keys.includes(k.id)&&F.keyChest(g,k)===i),phase=LootPresentation.chestFrame(oldKey?{open:true}:F.chestState(g,i));
   name=phase===4?'coffre-vide':phase?'coffre-ouverture-'+phase:'coffre';
  }
  if(['tonneau','caisses'].includes(name)){const i=e.objets.findIndex(([n,x,y])=>n===name&&x*32===ref[0]&&y*32===ref[1]);if(s.props?.[i]?.broken)name+='-brise';}
  if(name==='tresor'&&s.chests.some(i=>e.objets[i][1]*32===ref[0]&&e.objets[i][2]*32===ref[1]))continue;
  if(name==='cage-fee'&&g.dungeon.fairy)name='cage';
  if(name==='monte-charge')continue;
  if(name==='dalle-pression'&&s.crates.some(b=>Math.hypot(b.x-ref[0],b.y-ref[1])<10))name='dalle-pression-enfoncee';
  if(!light&&!it.edge)continue;
  const depth=name==='caisse'?{...it,ref,occlusionKey:it.piece+'/'+it.ref.join(','),key:Math.floor(ref[0]/32)+Math.floor(ref[1]/32),sub:ref[0]+ref[1]}:it;
  items.push({ground:name.startsWith('dalle-pression'),key:depth.key,sub:depth.sub,draw:()=>{if(name==='cle'){const q=P(...ref);LootPresentation.key(c,art.pieces.cle,g.time,q.x,q.y,ref[0]);return;}if(/^(tonneau|caisses)$/.test(name)){const q=P(...ref);this.shadow(q.x,q.y,name==='tonneau'?12:18);}const z=art.pieces[name],im=z?.frames[Math.floor(g.time*z.fps)%z.frames.length],alpha=z?DungeonOcclusion.alpha(this,{...depth,ref},z,im,p):1;blit(name,...ref,alpha);}});
 }
 for(const k of D.cles)if(k.etage===e.id&&!g.dungeon.keys.includes(k.id)&&F.keyChest(g,k)>=0&&F.keyReady(g,k)){
  const x=k.pos[0]*32,y=k.pos[1]*32;items.push({key:Math.floor(x/32)+Math.floor(y/32),sub:x+y+1,draw:()=>{const q=P(x,y);LootPresentation.key(c,art.pieces.cle,g.time,q.x,q.y,x,12);}});
 }
 if(D.monte_charge.arrets.includes(e.id)&&(g.dungeon.lift||e.id==='geoles')){const [i,j]=D.monte_charge.case;items.push({key:i+j,sub:(i+j+1)*32,draw:()=>blit('monte-charge',(i+.5)*32,(j+.5)*32)});}
 if(this.projectionViewGame!==g){this.projectionViewGame=g;this.projectionView=WorldProjection.display(g);}
 const view=this.projectionView;this.logicalGame=g;this.projectionActive=true;this.g=view.game;
 try{
  for(const b of view.game.blood)drawBloodStain(c,b);
  KaldorArmaments.drawDrops(this);
  for(const d of view.game.drops){const z=d.z||0,bob=d.air||d.magnet?0:Math.sin(g.time*5+d.x*.1)*2;if(d.kind==='heart'||d.kind==='flask')this.flask(d.x,d.y-z+bob);else this.coinDrop(d.x,d.y-8-z+bob);}
  items.push({key:Math.floor(p.x/32)+Math.floor(p.y/32),sub:p.x+p.y,draw:()=>this.hero(view.wrap(p))});
  for(const n of g.enemies){if(!visible(Math.floor(n.x/32),Math.floor(n.y/32)))continue;items.push({key:Math.floor(n.x/32)+Math.floor(n.y/32),sub:n.x+n.y,draw:()=>{
   const q=P(n.x,n.y);c.save();
   this.shadow(q.x,q.y,n.chief?18:14);
   if(!n.dead&&g.targetId===n.id)this.targetRing(q.x,q.y,n.chief?15:12);
   HearthreaverGoblins.draw(c,{...n,x:q.x,y:q.y,armed:n.armamentDropped?false:n.armed},g.time);
   if(HearthreaverGoblins.telegraph(n)){const x=Math.round(q.x),y=Math.round(q.y)-38;pixels(c,['000','010','010','000','010'],x-1,y,{'0':'#211820','1':'#f2c078'});}
   if(!n.dead&&g.targetId===n.id)pixels(c,['0...0','00.00','.000.','..0..'],Math.round(q.x)-2,Math.round(q.y)-35,{'0':'#f5d680'});
   if(!n.dead&&n.hp<n.maxHp){c.fillStyle='#271b24';c.fillRect(q.x-11,q.y-31,22,3);c.fillStyle='#c0644b';c.fillRect(q.x-11,q.y-31,22*n.hp/n.maxHp,2);}
   c.restore();}});}
  items.sort((a,b)=>Number(!!b.ground)-Number(!!a.ground)||a.key-b.key||a.sub-b.sub);for(const it of items)it.draw();
  for(const fx of view.game.bloodFX)drawBloodFX(c,fx);
  for(const v of view.game.particles)box(c,v.x,v.y-(v.z||0),v.size||2,v.size||2,v.color);
  if(g.dungeon.fairy)this.npcDraw(view.wrap({...g.fairyActor,x:p.x-16,y:p.y-16,alpha:1}));
  DungeonLighting.draw(this,c);this.drawFloaters();
  c.restore();this.bubble();
 }finally{this.g=g;this.projectionActive=false;this.logicalGame=null;}
 drawGoblinSpeech(this,g);this.hud();KaldorArmaments.renderDiscovery(this);c.save();
 const boss=g.enemies.find(n=>n.chief);if(g.dungeon.bossFight&&boss&&!boss.dead&&!g.dialogue){const y=T+36;this.uiBox(W/2-78,y,156,24);text(c,'GRISE-GUEULE',W/2-35,y+4,'#e5bf67');c.fillStyle='#38242a';c.fillRect(W/2-70,y+16,140,3);c.fillStyle='#bf4a3a';c.fillRect(W/2-70,y+16,140*boss.hp/boss.maxHp,3);}
 c.restore();
};
})();
