/* Goblin animation rig: original pixel shapes translate intact. Only catalogue
 * weapons turn; shoulders, head, sleeves and legs never scale or rotate. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports,api=factory(node?require('./native-layers.js'):root.HearthreaverGoblinLayers,node?require('../../scripts/kaldor-weapons.js'):root.HearthreaverWeapons);
 if(node)module.exports=api;root.HearthreaverGoblins=api;
})(globalThis,function(DATA,W){
 'use strict';
 const SIZE=80,ANCHOR=[40,52],VIEW=[2,1,0,3],FWD=[[0,-1],[1,0],[0,1],[-1,0]];
 const CLIPS=Object.freeze({
  idle:{times:[.30,.24,.30,.32],loop:true},walk:{times:[.105,.08,.105,.105,.08,.105],loop:true},run:{times:[.075,.06,.075,.075,.06,.075],loop:true},
  alert:{times:[.10,.15,.22,.18],loop:false},guard:{times:[.12,.24,.24,.24],loop:true},parry:{times:[.055,.07,.13,.18],loop:false},
  attack:{times:[.085,.465,.045,.065,.16,.13],loop:false},hurt:{times:[.065,.085,.13,.16],loop:false},stagger:{times:[.07,.12,.20,.20],loop:false},
  death:{times:[.075,.12,.18,.24,.32],loop:false},interact:{times:[.14,.10,.22,.18],loop:false},talk:{times:[.22,.16,.24,.18],loop:true},
  carry:{times:[.13,.10,.13,.13,.10,.13],loop:true},work:{times:[.20,.24,.055,.10,.22,.18],loop:true},
  sit:{times:[.16,.20,.30,.40],loop:false},sleep:{times:[.48,.48,.48,.48],loop:true},cower:{times:[.13,.18,.23,.25],loop:false},celebrate:{times:[.14,.14,.20,.24],loop:true}
 });
 const LABELS={idle:'Repos',walk:'Marche',run:'Course',alert:'Alerte',guard:'Garde',parry:'Parade',attack:'Attaque',hurt:'Touché',stagger:'Déséquilibre',death:'Mort',interact:'Interaction',talk:'Parole',carry:'Portage',work:'Travail',sit:'Assis',sleep:'Sommeil',cower:'Protection',celebrate:'Joie'};
 const character=id=>DATA.characters[id]||DATA.characters.gobelin;
 function times(state,chief=false,combo=0){
  const row=(CLIPS[state]||CLIPS.idle).times.slice();
  if(state==='attack'){row[1]=chief?.765:.465;const factor=combo===1?1.06:combo===2?.90:combo===3?1.14:1;for(const i of [0,1,3,4,5])row[i]*=factor;if(chief){row[4]*=1.35;row[5]*=1.25;}}
  return row;
 }
 const duration=(state,chief=false,combo=0)=>times(state,chief,combo).reduce((a,b)=>a+b,0);
 function frame(state,time=0,chief=false,combo=0){const row=times(state,chief,combo),total=row.reduce((a,b)=>a+b,0);let t=Math.max(0,time);if(CLIPS[state]?.loop)t%=total;for(let i=0;i<row.length;i++){if(t<row[i]-1e-8)return i;t-=row[i];}return row.length-1;}
 function pose(state,dir=2,index=0,combo=0){
  const [fx,fy]=FWD[dir]||FWD[2],a=Math.atan2(fy,fx),p={body:[0,0],head:[0,0],armL:[0,0],armR:[0,0],legL:[0,0],legR:[0,0],pouch:[0,0],cape:[0,0],angle:-Math.PI/2,smear:0,phase:index};
  const armedSide=dir===0||dir===3?'R':'L',main='arm'+armedSide,off='arm'+(armedSide==='L'?'R':'L'),side=dir===3?-1:1;
  if(state==='idle'){p.body[1]=index===1?-1:0;p.head[1]=index===2?-1:p.body[1];p.armL[1]=p.armR[1]=p.body[1];}
  if(['walk','run','carry'].includes(state)){
   const k=index%6,stride=[-1,0,1,1,0,-1][k],up=[0,-1,0,0,-1,0][k],profile=dir%2===1,amp=state==='run'?2:1;
   p.body=[profile?side:0,up];p.head=[0,k===2||k===5?-1:up];
   p.legL=[profile?stride*amp:0,k<3?Math.min(0,-stride):0];p.legR=[profile?-stride*amp:0,k>=3?Math.min(0,stride):0];
   p.armL=[profile?-stride:stride,up];p.armR=[profile?stride:-stride,up];p.pouch=[-Math.sign(stride),up];p.cape=[-Math.sign(stride),0];
   if(state==='carry')p.armL=p.armR=[0,-2];
  }
  if(state==='attack'||state==='work'){
   const k=Math.min(5,index),reverse=(combo===1?-1:1)*(dir===2?-1:1),thrust=combo===2;p.turn=reverse;
   const load=thrust?a:a-reverse*(dir===2&&combo===1?1.75:combo===3?2.5:2.15),idle=-Math.PI/2,lead=dir===2?-1.85:idle+Math.atan2(Math.sin(load-idle),Math.cos(load-idle))*.20;
   p.angle=k===0?lead:k===5?idle:thrust?a:[lead,load,a,a+reverse*.75,a+reverse*1.95,idle][k];
   p.body=[Math.round(fx*[-1,-1,1,2,2,0][k]),Math.round(fy*[0,0,0,1,1,0][k])];
   p.head=[p.body[0]-(k>=2&&k<=4?fx:0),p.body[1]];
   const dx=[0,-1,3,2,1,0][k],dy=[0,-1,1,1,0,0][k];
   p[main]=[Math.round(p.body[0]+fx*dx),Math.round(p.body[1]+fy*dy)];
   p[off]=[p.body[0],p.body[1]+(k===1?-1:0)];p.smear=k===2?1:k===3?.30:0;
   if(k===5)p.head=[0,0];p.pouch=[k===3?-fx:0,p.body[1]];p.cape=[-fx,p.body[1]];
  }
  if(['guard','parry','alert'].includes(state)){const lift=state==='alert'?[0,-1,-2,-2][index]:state==='parry'?[-2,-3,-2,-1][index]:[-2,-2,-1,-2][index];p.body=[state==='alert'&&index===0?0:-fx,state==='guard'&&index===1?-1:0];p.head=[0,p.body[1]];p[main]=[fx,lift+p.body[1]];p[off]=[-fx,Math.min(0,lift+1)];p.angle=[-1,-2.35,-2.15,-.79][dir]+(state==='parry'?[0,-.15,.10,0][index]:0);}
  if(['hurt','stagger'].includes(state)){const pull=[2,2,1,0][index]||0;p.body=[-fx*pull,0];p.head=[-fx*(pull+(pull?1:0)),0];p.armL=[-fx*pull,pull?1:0];p.armR=[-fx*pull,pull?1:0];p.angle=-Math.PI/2-.3*pull;}
  if(state==='death'){const k=Math.min(4,index),drift=[-1,-2,0,3,4][k];p.body=[drift,[0,1,2,3,4][k]];p.head=[drift+[0,0,1,2,2][k],[0,1,3,6,9][k]];p.armL=[drift,Math.min(3,k)];p.armR=[drift,Math.min(3,k)];p.angle=[-1.5,-1.8,-.9,.1,.15][k];}
  if(['sit','sleep','cower'].includes(state)){const settled=state==='sleep'?3:Math.min(3,index);p.body=[0,settled];p.head=[0,settled+(state==='sleep'?2:0)];p.armL=[1,settled-1];p.armR=[-1,settled-1];p.angle=.2;if(state==='sleep'&&index===1)p.head[1]--;if(state==='cower'){p.armL=[1,-Math.min(3,index)];p.armR=[-1,-Math.min(3,index)];p.angle=-2.15;}}
  if(['talk','interact','celebrate'].includes(state)){const n=[0,-1,-2,0][index]||0;p[main]=[1,n];p.head=[0,index===1?-1:0];if(state==='celebrate')p[off]=[-1,n];}
  if(!['walk','run','carry','attack','work'].includes(state)){p.pouch=[...p.body];p.cape=[...p.body];}
  return p;
 }
 const GRIP=[[31,31],[20,31],[16,31],[27,31]];
 function weaponPose(dir,p){const side=dir===0||dir===3?'R':'L',d=p['arm'+side],h=GRIP[dir].map((n,k)=>n-([24,36][k])+d[k]);return {h,u:[Math.cos(p.angle),Math.sin(p.angle)]};}
 function start(actor){const combo=actor.nextCombo||0;actor.goblinCombo=combo%4;actor.nextCombo=(combo+1)%4;actor.swingElapsed=0;actor.swingImpact=false;actor.swingDir=actor.dir;actor.wind=times('attack',actor.chief,actor.goblinCombo).slice(0,2).reduce((a,b)=>a+b,0);actor.attack=0;}
 function cancel(actor){actor.swingElapsed=null;actor.swingImpact=true;actor.wind=0;actor.attack=0;}
 function advance(actor,dt){
  if(actor.dead){if(Number.isFinite(actor.deathElapsed))actor.deathElapsed=Math.min(duration('death'),actor.deathElapsed+dt);return false;}
  if(Number.isFinite(actor.hurtElapsed))actor.hurtElapsed+=dt;
  if(!Number.isFinite(actor.swingElapsed))return false;
  const row=times('attack',actor.chief,actor.goblinCombo),contact=row[0]+row[1],end=duration('attack',actor.chief,actor.goblinCombo),before=actor.swingElapsed;
  actor.swingElapsed=Math.min(end,actor.swingElapsed+dt);actor.wind=Math.max(0,contact-actor.swingElapsed);actor.attack=actor.swingElapsed>=contact?end-actor.swingElapsed:0;
  const hit=!actor.swingImpact&&before<contact+row[2]&&actor.swingElapsed>=contact;if(hit)actor.swingImpact=true;
  if(actor.swingElapsed>=end){actor.swingElapsed=null;actor.wind=0;actor.attack=0;}return hit;
 }
 function look(actor,time=0){
  const dir=Number.isFinite(actor.swingElapsed)?actor.swingDir:actor.dir;
  if(actor.dead)return {state:'death',dir:actor.dir,frame:frame('death',actor.deathElapsed??duration('death')),combo:0};
  if(actor.stun>0)return {state:'hurt',dir:actor.dir,frame:frame('hurt',actor.hurtElapsed||0),combo:0};
  if(Number.isFinite(actor.swingElapsed))return {state:'attack',dir,frame:frame('attack',actor.swingElapsed,actor.chief,actor.goblinCombo),combo:actor.goblinCombo||0};
  if(CLIPS[actor.goblinState])return {state:actor.goblinState,dir:actor.dir,frame:frame(actor.goblinState,actor.stateElapsed||0),combo:actor.goblinCombo||0};
  const state=actor.moving?'walk':actor.guard?'guard':'idle';return {state,dir:actor.dir,frame:frame(state,actor.moving?(actor.anim||0)*.20:time),combo:0};
 }
 function hits(actor,target){
  const dir=actor.swingDir??actor.dir,p=pose('attack',dir,2,actor.goblinCombo||0),v=weaponPose(dir,p),id=actor.weapon||character(actor.skin).weapon,scale=actor.chief?1:.85,length=W.get(id).length*scale;
  const dx=target.x-actor.x,dy=target.y-actor.y,x=dx-dy,y=(dx+dy)/2-9,r=(target.r||5)+5;
  // The impact smear covers the final delivery of a cut, not its recovery.
  for(let k=0;k<=16;k++){const reverse=p.turn,a=p.angle-(actor.goblinCombo===2?0:reverse*.80*(1-k/16)),u=[Math.cos(a),Math.sin(a)],vx=u[0]*length,vy=u[1]*length,t=Math.max(0,Math.min(1,((x-v.h[0])*vx+(y-v.h[1])*vy)/(length*length)));
   if(Math.hypot(x-v.h[0]-vx*t,y-v.h[1]-vy*t)<=r)return true;
  }return false;
 }
 function raster(id,state='idle',dir=2,index=0,combo=0,options={}){
  const ch=character(id),parts=ch.views[VIEW[dir]??0],p=pose(state,dir,index,combo),data=new Uint8ClampedArray(SIZE*SIZE*4),rgb=new Map();
  const set=(x,y,c)=>{x=Math.round(x)+40;y=Math.round(y)+52;if(x<0||x>=SIZE||y<0||y>=SIZE)return;let color=rgb.get(c);if(!color){color=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)).concat(255);rgb.set(c,color);}data.set(color,(y*SIZE+x)*4);};
  const line=(x,y,X,Y,c)=>{const n=Math.max(1,Math.ceil(Math.hypot(X-x,Y-y)*2));for(let i=0;i<=n;i++)set(x+(X-x)*i/n,y+(Y-y)*i/n,c);};
  const b={set,line},weapon=options.weapon||ch.weapon,armed=options.armed??ch.armed,v=weaponPose(dir,p),rear=dir===0||p.angle< -Math.PI*.85||p.angle>Math.PI*.85;
  function blade(){if(!armed)return;W.paint(b,weapon,...v.h,...v.u,id==='grise-gueule'?1:.85);}
  function trail(){if(!armed||!p.smear)return;const len=W.get(weapon).length*(id==='grise-gueule'?1:.85),sgn=p.turn,count=p.smear===1?22:9,col=p.smear===1?'#d9c3a0':'#6e6554';
   if(combo===2){for(let k=2;k<=8;k+=2)set(v.h[0]+v.u[0]*(len-k),v.h[1]+v.u[1]*(len-k),col);return;}
   for(let n=0;n<count;n++){const a=p.angle-sgn*(.80*(1-n/count)),r=len-(n%3===0?2:0);if(p.smear<1&&n%2)continue;set(v.h[0]+Math.cos(a)*r,v.h[1]+Math.sin(a)*r,col);if(p.smear===1&&n%3===0)set(v.h[0]+Math.cos(a)*(r-1),v.h[1]+Math.sin(a)*(r-1),col);}}
  if(rear){trail();blade();}
  for(const l of parts){const offset=p[l.part]||p.body;for(const [x,y,c]of l.pixels)set(x-24+offset[0],y-36+offset[1],c);}
  if(!rear){trail();blade();}return {width:SIZE,height:SIZE,data,pose:p};
 }
 const cache=new Map();
 function draw(ctx,actor,time=0){const l=look(actor,time),id=actor.skin||'gobelin',options={weapon:actor.weapon,armed:actor.armed??character(id).armed},key=[id,l.state,l.dir,l.frame,l.combo,options.weapon,options.armed].join('/');let cv=cache.get(key);
  if(!cv){cv=ctx.canvas.ownerDocument?.createElement('canvas')||(typeof document!=='undefined'?document.createElement('canvas'):null);if(!cv)throw Error('Goblin drawing requires a canvas factory');cv.width=cv.height=SIZE;const c=cv.getContext('2d'),r=raster(id,l.state,l.dir,l.frame,l.combo,options),im=c.createImageData(SIZE,SIZE);im.data.set(r.data);c.putImageData(im,0,0);if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,cv);}
  const x=Math.round(actor.x)-40,y=Math.round(actor.y)-52;ctx.drawImage(cv,x,y);if(actor.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=.45;ctx.drawImage(cv,x,y);ctx.restore();}return l;
 }
 return Object.freeze({DATA,SIZE,ANCHOR,CLIPS,LABELS,character,times,duration,frame,pose,weaponPose,start,cancel,advance,look,hits,raster,draw});
});
