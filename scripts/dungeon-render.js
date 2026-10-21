/* Uses the PR's native pixels and diagonal depth order; actors share its 2:1 grid. */
(()=>{
'use strict';
const F=FirstDungeon,D=F.design,frame=Renderer.prototype.frame;
Renderer.prototype.frame=function(){if(!this.g.dungeon?.active)return frame.call(this);
 const g=this.g,c=this.c,p=g.player,K=this.k||1,W=this.W,H=this.H,T=this.top,e=F.current(g),s=F.state(g),art=F.art,P=WorldProjection.point;
 c.setTransform(K,0,0,K,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#050408';c.fillRect(0,0,W,H);
 const hero=P(p.x,p.y);this.cam={x:Math.round(hero.x-W/2),y:Math.round(hero.y-(H-T)/2-10)};
 if(!art.ready){text(c,art.error?'Erreur de chargement du donjon':'Chargement du donjon…',12,T+30,'#eee0c8');return;}
 const a=art.floors[e.id],seen=g.dungeonSeen||new Set(s.seen),items=[],brightness=this.dungeonBrightness||(this.dungeonBrightness=new Map()),visible=(i,j)=>seen.has(i+','+j);
 c.save();c.beginPath();c.rect(0,T,W,H-T);c.clip();const shake=KaldorArsenal.cameraShake(g.weaponShake,typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);c.translate(-this.cam.x+shake,T-this.cam.y);c.drawImage(a.ground,-a.origin[0],-a.origin[1]);
 // Room reveal is gradual, without revealing the contents behind closed doors.
 for(let j=0;j<e.plan.length;j++)for(let i=0;i<e.plan[j].length;i++){if(e.plan[j][i]==='#')continue;const k=e.id+'/'+i+','+j,target=visible(i,j)?1:.14,old=brightness.get(k)??target,b=old+(target-old)*.14;brightness.set(k,b);const q=P(i*32,j*32);c.fillStyle='rgba(0,0,0,'+(1-b*.8)+')';c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+32,q.y+16);c.lineTo(q.x,q.y+32);c.lineTo(q.x-32,q.y+16);c.fill();}
 const blit=(name,x,y,alpha=1)=>{const z=art.pieces[name];if(!z)return;const im=z.frames[Math.floor(g.time*z.fps)%z.frames.length],q=P(x,y);c.save();c.globalAlpha*=alpha;c.drawImage(im,Math.round(q.x-z.anchor[0]),Math.round(q.y-z.anchor[1]));c.restore();};
 for(const it of a.items){let name=it.piece,ref=it.ref,light=!it.cells||it.cells.some(([i,j])=>visible(i,j));
  if(it.edge){const border=it.edge.join(','),orient=name.split('/')[0];if(s.open.includes(border))name=orient+'/'+({'porte-verrouillee':'porte-ouverte','porte-cellule':'porte-cellule-ouverte','herse':'herse-levee'}[e.murs[border]]||'porte-ouverte');if(s.levers.includes(border)||border===D.fee.levier&&g.dungeon.fairy)name=orient+'/levier-bas';if(name===orient+'/porte'&&g.dungeon.floor==='trone'&&!g.dungeon.bossFight)name=orient+'/porte-ouverte';}
  if(name==='cle'&&D.cles.some(k=>k.etage===e.id&&g.dungeon.keys.includes(k.id)&&Math.hypot(k.pos[0]*32-ref[0],k.pos[1]*32-ref[1])<3))continue;
  if(name==='caisse'){const i=e.objets.findIndex(([n,x,y])=>n==='caisse'&&x*32===ref[0]&&y*32===ref[1]),b=s.crates.find(b=>b.id===i);if(b)ref=[b.x,b.y];}
  if(name==='coffre'&&(s.chests.some(i=>e.objets[i][1]*32===ref[0]&&e.objets[i][2]*32===ref[1])||D.cles.some(k=>k.etage===e.id&&g.dungeon.keys.includes(k.id)&&Math.hypot(k.pos[0]*32-ref[0],k.pos[1]*32-ref[1])<3)))name='coffre-ouvert';
  if(name==='cage-fee'&&g.dungeon.fairy)name='cage';
  if(name==='monte-charge')continue;
  if(name==='dalle-pression'&&s.crates.some(b=>Math.hypot(b.x-ref[0],b.y-ref[1])<10))name='dalle-pression-enfoncee';
  if(!light&&!it.edge)continue;
  items.push({key:it.key,sub:it.sub,draw:()=>{const alpha=light?1:.14,q=P(...ref);c.save();if(it.edge&&q.y>hero.y&&Math.abs(q.x-hero.x)<48&&q.y-hero.y<46)c.globalAlpha=.35;blit(name,...ref,alpha);c.restore();}});
 }
 if(D.monte_charge.arrets.includes(e.id)&&(g.dungeon.lift||e.id==='geoles')){const [i,j]=D.monte_charge.case;items.push({key:i+j,sub:(i+j+1)*32,draw:()=>blit('monte-charge',(i+.5)*32,(j+.5)*32)});}
 if(this.projectionViewGame!==g){this.projectionViewGame=g;this.projectionView=WorldProjection.display(g);}
 const view=this.projectionView;this.logicalGame=g;this.projectionActive=true;this.g=view.game;
 try{
  for(const b of view.game.blood)drawBloodStain(c,b);
  items.push({key:Math.floor(p.x/32)+Math.floor(p.y/32),sub:p.x+p.y,draw:()=>this.hero(view.wrap(p))});
  for(const n of g.enemies){if(!visible(Math.floor(n.x/32),Math.floor(n.y/32)))continue;items.push({key:Math.floor(n.x/32)+Math.floor(n.y/32),sub:n.x+n.y,draw:()=>{
   const q=P(n.x,n.y),v=[2,1,0,3][n.dir]??0,im=art.goblins[n.skin][v],bob=n.anim&&!n.dead?Math.round(Math.sin(n.anim*2)):0;c.save();
   if(n.wind>0){c.strokeStyle=n.chief?'#eb8357':'#d4ae6f';c.lineWidth=1;c.beginPath();c.ellipse(q.x,q.y, n.chief?32:22,n.chief?16:11,0,0,7);c.stroke();}
   if(n.dead){c.globalAlpha=.45;c.translate(q.x,q.y);c.rotate(Math.PI/2);c.drawImage(im,-24,-36,48,48);}else{if(n.flash>0)c.globalAlpha=.55;const h=n.chief?68:48;c.drawImage(im,Math.round(q.x-24),Math.round(q.y-(n.chief?51:36)+bob),48,h);
    if(n.chief){const reach=n.attack>0?23:13;c.fillStyle='#504030';c.fillRect(q.x+9,q.y-26,3,25);c.fillStyle='#9a8460';c.fillRect(q.x+6,q.y-26-reach/2,10,12);}
    if(n.hp<n.maxHp){c.fillStyle='#271b24';c.fillRect(q.x-11,q.y-(n.chief?44:26),22,3);c.fillStyle='#c0644b';c.fillRect(q.x-11,q.y-(n.chief?44:26),22*n.hp/n.maxHp,2);}}
   c.restore();}});}
  items.sort((a,b)=>a.key-b.key||a.sub-b.sub);for(const it of items)it.draw();
  for(const fx of view.game.bloodFX)drawBloodFX(c,fx);
  for(const v of view.game.particles)box(c,v.x,v.y-(v.z||0),v.size||2,v.size||2,v.color);
  this.drawFloaters();
  if(g.dungeon.fairy)this.npcDraw(view.wrap({...g.fairyActor,x:p.x-16,y:p.y-16,alpha:1}));
  c.restore();this.bubble();
 }finally{this.g=g;this.projectionActive=false;this.logicalGame=null;}
 this.hud();c.save();
 const boss=g.enemies.find(n=>n.chief);if(g.dungeon.bossFight&&boss&&!boss.dead&&!g.dialogue){const y=T+36;this.uiBox(W/2-78,y,156,24);text(c,'GRISE-GUEULE',W/2-35,y+4,'#e5bf67');c.fillStyle='#38242a';c.fillRect(W/2-70,y+16,140,3);c.fillStyle='#bf4a3a';c.fillRect(W/2-70,y+16,140*boss.hp/boss.maxHp,3);}
 c.restore();
};
})();
