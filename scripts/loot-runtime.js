// Coins, healing loot and chest feedback are shared by the world and interiors.
const LootPresentation=(()=>{
 const CHEST_LOOT=Object.freeze(['coin','coin','coin','coin','coin','heart','heart']),cache=new WeakMap();
 function chestFrame(ch){if(!ch?.open)return 0;const age=ch.openAge;if(!Number.isFinite(age)||age>=.33)return 4;return age<.06?0:age<.14?1:age<.23?2:3;}
 function chests(g){return g.dungeon?.active?Object.values(FirstDungeon.state(g).chestStates||{}):g.chests;}
 Game.prototype.openLootChest=function(ch){if(ch.open)return false;ch.open=true;ch.openAge=0;this.ejectLoot(ch,CHEST_LOOT);this.emit('chest');this.emit('save');return true;};
 Game.prototype.stepLoot=function(dt){
  const p=this.player;let collected=false;
  for(const ch of chests(this))if(ch.open&&Number.isFinite(ch.openAge))ch.openAge=Math.min(.33,ch.openAge+dt);
  for(const d of this.drops){
   if(d.air){
    const nx=d.x+d.vx*dt,ny=d.y+d.vy*dt;
    if(!this.solid(nx,ny,2,d.level||0)){d.x=nx;d.y=ny;}else{d.vx*=-.3;d.vy*=-.3;}
    d.z+=d.vz*dt;d.vz-=320*dt;
    if(d.z<=0){d.z=0;if(d.vz<-60){d.vz*=-.35;d.vx*=.5;d.vy*=.5;}else{d.air=false;d.vz=0;}}
   }
   d.delay=Math.max(0,(d.delay||0)-dt);
   if(!d.air&&d.delay<=0&&this.sameLevel(d,p)&&this.canTake(d)&&this.lineClear(p,d)){
    const dd=dist(d,p);if(dd<56||d.magnet){d.magnet=(d.magnet||0)+dt;const speed=70+Math.min(1,d.magnet*2.5)*230,k=Math.min(1,speed*dt/Math.max(1,dd));d.x+=(p.x-d.x)*k;d.y+=(p.y-2-d.y)*k;}
   }
  }
  for(const d of this.drops)if(this.sameLevel(d,p)&&!d.air&&!(d.delay>0)&&dist(d,p)<11&&!d.taken&&this.canTake(d)&&this.lineClear(p,d)){
   d.taken=true;collected=true;
   if(d.kind==='heart'||d.kind==='flask'){
    if(p.hp<p.maxHp){p.hp=Math.min(p.maxHp,p.hp+2);this.float('heart',1);}else{p.flasks=(p.flasks||0)+1;this.float('flask',1);}this.emit('flask');
   }else{p.coins+=3;this.float('coin',3);this.emit('loot');}
  }
  this.drops=this.drops.filter(d=>!d.taken);if(collected)this.emit('save');
 };
 const legacyChest=Renderer.prototype.chest;
 Renderer.prototype.chest=function(o){
  const f=chestFrame(o);if(f===0||f===4)return legacyChest.call(this,{...o,open:f===4});
  // Pixel-only intermediate lid poses for the existing world chest silhouette.
  let frames=cache.get(this.propCache);if(!frames){frames=[];cache.set(this.propCache,frames);}
  if(!frames[f]){const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
   c.drawImage(this.propCache.chest_open,0,46,64,18,0,46,64,18);
   const top=[0,44,42,40][f],height=[0,4,5,6][f];c.drawImage(this.propCache.chest,0,45,64,4,0,top,64,height);frames[f]=cv;
  }this.c.drawImage(frames[f],Math.round(o.x)-32,Math.round(o.y)-56);
 };
 function key(c,piece,time,x,y,seed=0,height=0){
  const scale=.5,w=Math.round(piece.w*scale),h=Math.round(piece.h*scale),bob=Math.round(Math.sin(time*3+seed)*.7),px=Math.round(x-piece.anchor[0]*scale),py=Math.round(y-piece.anchor[1]*scale-height+bob);
  c.save();c.imageSmoothingEnabled=false;c.drawImage(piece.frames[0],px,py,w,h);
  const phase=Math.floor((time*8+seed)%12);if(phase<4){const a=Math.round(x-3),b=Math.round(y-height-3+bob),r=phase===1||phase===2?2:1;c.fillStyle='#ffe0a0';c.fillRect(a-r,b,2*r+1,1);c.fillRect(a,b-r,1,2*r+1);c.fillStyle='#fff6d3';c.fillRect(a,b,1,1);}
  c.restore();
 }
 return {CHEST_LOOT,chestFrame,key};
})();
