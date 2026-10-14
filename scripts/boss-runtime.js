// Source embedded verbatim by embed-boss.cjs. All times come from Aseprite.
function bossClip(phase,dir,state){return BOSS_ART.clips[[state==='transform'?0:phase,dir,state].join(':')];}
function bossFrame(clip,seconds){
 let ms=Math.max(0,seconds*1000);if(clip.loop)ms%=clip.totalMs;
 for(let i=0;i<clip.durationsMs.length;i++){if(ms+1e-7<clip.durationsMs[i])return i;ms-=clip.durationsMs[i];}
 return clip.durationsMs.length-1;
}
function bossPlay(e,state){
 e.motion=state;e.motionTime=0;e.motionDir=e.dir;e.motionPhase=state==='transform'?0:(e.rage?1:0);
 e.castId=(e.castId||0)+1;e.impactDone=false;e.wind=0;e.attack=0;e.block=0;
 const c=bossClip(e.motionPhase,e.dir,state);
 e.modeTime=c.totalMs/1000;e.mode=state==='guard'?'block':state==='charge_wind'?'wind':state;
 if(c.impactMs!==undefined){e.mode='wind';e.wind=e.windup=c.impactMs/1000;}
 if(state==='charge_wind')e.wind=e.windup=c.totalMs/1000;
 if(state==='guard')e.block=e.modeTime=1.3;
 if(state==='charge'){e.modeTime=.48;e.chargeHit=false;e.chargeDistance=0;}
}
function bossVisual(e,time){
 let state=e.motion||'idle',seconds=e.motionTime||0,phase=e.motionPhase??(e.rage?1:0),dir=e.motionDir??e.dir;
 if(time-(e.appearAt??-9)<.85){state='appear';seconds=time-e.appearAt;phase=e.rage?1:0;dir=e.dir;}
 else if(e.stun>0){state='stun';seconds=e.bossClock||0;phase=e.rage?1:0;}
 else if(!e.motion){state=e.moving?'walk':'idle';dir=e.dir;phase=e.rage?1:0;seconds=e.moving?(e.walkDistance||0)/16*bossClip(phase,dir,'walk').totalMs/1000:e.bossClock||0;
  if(e.hurt>0){state='hurt';seconds=Math.max(0,.18-e.hurt);}}
 else if(state==='charge')seconds=(e.chargeDistance||0)/32*.24;
 const clip=bossClip(phase,dir,state);return {state,phase,dir,clip,frame:bossFrame(clip,seconds)};
}
function bossMove(g,e,dt,vx,vy){
 const x=e.x,y=e.y;g.move(e,vx*dt,vy*dt);e.x=clamp(e.x,331,469);e.y=clamp(e.y,60,181);
 const distance=Math.hypot(e.x-x,e.y-y);e.moving=distance>.001;e.walkDistance=(e.walkDistance||0)+distance;
 e.chargeDistance=(e.chargeDistance||0)+distance;
}
function bossIdle(e,delay=.6){e.motion=null;e.mode='move';e.modeTime=delay;e.wind=0;e.attack=0;e.block=0;e.moving=false;}
function bossImpact(g,e){
 const state=e.motion,p=g.player,clip=bossClip(e.motionPhase,e.motionDir,state);
 g.emit('bosscue',{cue:(state==='followup'?'slash':state)+'_hit'});
 if(state==='slash'||state==='followup'){
  const [vx,vy]=g.facing(e.motionDir),dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
  if(d<43&&(dx*vx+dy*vy)/Math.max(1,d)>-.15&&g.lineClear(e,p))g.damagePlayer(2,e);
 }else if(state==='fan'){
  const hand=clip.palm[bossFrame(clip,clip.impactMs/1000)],x=e.x+hand[0]-40,y=e.y+hand[1]-52+18;
  const a=Math.atan2(e.aimY-y,e.aimX-x),speed=e.rage?90:76;
  for(let i=-1;i<=1;i++)g.shots.push({x,y,z:18,level:e.level||0,age:0,trail:[],vx:Math.cos(a+i*.32)*speed,vy:Math.sin(a+i*.32)*speed,life:4,owner:e.id,damage:2,jade:true,phase:e.rage?1:0});
 }else if(state==='nova'||state==='eruption'){
  const [vx,vy]=g.facing(e.motionDir);
  for(let i=0;i<(state==='nova'?1:3);i++){
   const d=24+i*14,l=[-5,5,0][i];
   g.hazards.push({x:e.x+(state==='nova'?0:vx*d-vy*l),y:e.y+(state==='nova'?0:vy*d*.85+vx*l*.65),
    level:e.level||0,r:0,life:1,owner:e.id,unblockable:true,hit:false,spell:state,index:i,castId:e.castId});
  }
 }
}
function stepBoss(g,e,dt){
 e.bossClock=(e.bossClock||0)+dt;e.moving=false;
 if(g.time-(e.appearAt??-9)<.85)return;
 if(e.stun>0){if(e.motion!=='stun')bossPlay(e,'stun');e.motionTime+=dt;return;}
 if(e.motion==='stun'){bossPlay(e,'recover');return;}
 if(!e.rage&&e.hp<=e.maxHp/2){g.bossTransform(e);return;}
 if(e.motion){
  const state=e.motion,c=bossClip(e.motionPhase,e.motionDir,state);e.dir=e.motionDir;e.motionTime+=dt;e.modeTime=Math.max(0,e.modeTime-dt);
  if(state==='charge'){
   bossMove(g,e,dt,e.chargeX*(e.rage?200:180),e.chargeY*(e.rage?200:180));
   if(!e.chargeHit&&dist(e,g.player)<23&&g.lineClear(e,g.player)){e.chargeHit=true;g.damagePlayer(2,e);}
   if(e.stun>0)return;if(e.modeTime<=0)bossPlay(e,'recover');return;
  }
  if(state==='guard'){e.block=e.modeTime;if(e.modeTime<=0)bossIdle(e,.55);return;}
  if(c.impactMs!==undefined){
   e.wind=Math.max(0,c.impactMs/1000-e.motionTime);e.attack=e.motionTime>=c.impactMs/1000&&e.motionTime<(c.impactMs+c.activeMs)/1000?.04:0;
   if(!e.impactDone&&e.motionTime+1e-7>=c.impactMs/1000){e.impactDone=true;bossImpact(g,e);if(e.stun>0)return;}
   if(e.wind<=0)e.mode='recover';
  }else if(state==='charge_wind')e.wind=e.modeTime;
  if(e.motionTime+1e-7>=c.totalMs/1000){
   if(state==='charge_wind'){g.emit('bosscue',{cue:'charge_hit'});bossPlay(e,'charge');}
   else if(state==='slash'&&e.rage){bossPlay(e,'followup');g.emit('bosscue',{cue:'slash_wind'});}
   else{if(state!=='transform')e.phase++;bossIdle(e,e.rage?.5:.7);}
  }
  return;
 }
 e.dir=g.direction(g.player.x-e.x,g.player.y-e.y);e.modeTime=Math.max(0,(e.modeTime??.6)-dt);
 const d=dist(e,g.player),a=Math.atan2(g.player.y-e.y,g.player.x-e.x);
 if(e.modeTime>0){const speed=d<40?-27:d>95?32:0;bossMove(g,e,dt,Math.cos(a)*speed-Math.sin(a)*19,Math.sin(a)*speed+Math.cos(a)*19);return;}
 if(e.phase%3===2&&!e.didBlock){e.didBlock=true;bossPlay(e,'guard');g.emit('bosscue',{cue:'block'});return;}e.didBlock=false;
 e.pattern=e.rage&&e.phase%3===1&&d<82?'eruption':d<44?(e.phase%2?'nova':'slash'):d<100?'charge':'fan';
 e.aimX=g.player.x;e.aimY=g.player.y;e.chargeX=Math.cos(a);e.chargeY=Math.sin(a);
 bossPlay(e,e.pattern==='charge'?'charge_wind':e.pattern);g.emit('bosscue',{cue:e.pattern+'_wind'});
}
function stepBossHazard(g,h){
 const e=g.enemies.find(e=>e.id===h.owner);
 if(!e||e.dead||e.stun>0||e.castId!==h.castId||e.motion!==h.spell){h.life=0;return;}
 const f=bossVisual(e,g.time).frame-h.index;
 if(f>=9){h.life=0;return;}h.active=f>=5;
 h.r=h.spell==='nova'?[25,39,51,59][f-5]:[13,15,17,19][f-5];
 if(!h.active)return;
 const dy=(g.player.y-h.y)/(h.spell==='nova'?.34:.32);
 if(!h.hit&&g.sameLevel(h,g.player)&&Math.hypot(g.player.x-h.x,dy)<h.r&&g.lineClear(h,g.player)){h.hit=true;g.damagePlayer(2,h);}
}
function drawBossFX(c,e,time,front){
 if(!BITMAPS.ready||e.dead||e.stun>0)return;
 const v=bossVisual(e,time),fx=BOSS_ART.effects[[v.phase,v.dir,v.state].join(':')];if(!fx)return;
 // Actual moving projectiles take over at release; no stationary duplicate bolts.
 if(v.state==='fan'&&e.motionTime>=v.clip.impactMs/1000)return;
 c.drawImage(front?BITMAPS.bossFront:BITMAPS.bossRear,v.frame*160,fx.row*160,160,160,Math.round(e.x*SUBPX)/SUBPX-80,Math.round(e.y*SUBPX)/SUBPX-96,160,160);
}
function drawBossBolt(c,s){
 const dir=(Math.round(Math.atan2(s.vy,s.vx)/(Math.PI/4))+8)%8,f=Math.floor((s.age||0)/.08)%4;
 c.drawImage(BITMAPS.bossBolt,f*32,((s.phase||0)*8+dir)*32,32,32,Math.round(s.x)-16,Math.round(s.y-(s.z??6))-16,32,32);
}
