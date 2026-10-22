const touchKeys=new Map();
const stick={x:0,y:0},joystick=$('joystick'),knob=$('joystickKnob'),zone=$('stickZone');let stickId=null,origin=null;
function canTouchPlay(){return state==='playing'&&!game.dialogue&&!landscapeBlocked;}
function stickStart(x,y){
 const home=joystick.getBoundingClientRect(),sr=$('screen').getBoundingClientRect(),half=joystick.offsetWidth/2,cx=home.x+home.width/2,cy=home.y+home.height/2;
 // Near the visible base, preserve immediate directional control. Further away,
 // create a floating base under the finger instead of rejecting the gesture.
 const near=Math.hypot(x-cx,y-cy)<=half+24;
 origin=near?{x:cx,y:cy}:{x:Math.max(sr.left+half,Math.min(sr.left+sr.width*.48-half,x)),y:Math.max(sr.top+half,Math.min(sr.bottom-half,y))};
 joystick.classList.add('active');positionStick();stickMove(x,y);
}
function positionStick(){if(!origin)return;const sr=$('screen').getBoundingClientRect(),half=joystick.offsetWidth/2;joystick.style.left=(origin.x-sr.left-half)+'px';joystick.style.top=(origin.y-sr.top-half)+'px';joystick.style.bottom='auto';}
function stickMove(x,y){
 if(!origin)return;const radius=joystick.offsetWidth*.24;let dx=x-origin.x,dy=y-origin.y,dd=Math.hypot(dx,dy);
 if(dd>radius){const k=(dd-radius)/dd,sr=$('screen').getBoundingClientRect(),half=joystick.offsetWidth/2;
  origin.x=Math.min(sr.left+sr.width*.48-half,Math.max(sr.left+half,origin.x+dx*k));origin.y=Math.min(sr.bottom-half,Math.max(sr.top+half,origin.y+dy*k));positionStick();dx=x-origin.x;dy=y-origin.y;dd=Math.hypot(dx,dy);
 }
 const len=Math.min(radius,dd),nx=dd?dx/dd:0,ny=dd?dy/dd:0,mag=dd>radius*.16?1:0;
 stick.x=nx*mag;stick.y=ny*mag;knob.style.transform='translate('+Math.round(nx*len)+'px,'+Math.round(ny*len)+'px)';
}
function releaseStick(){stickId=null;origin=null;stick.x=stick.y=0;knob.style.transform='translate(0px,0px)';joystick.classList.remove('active');joystick.style.left=joystick.style.top=joystick.style.bottom='';}
function pressTouchAction(id,key){if(!canTouchPlay())return;touchKeys.set(id,key);if(key==='attack')pending.attack=true;if(key==='dodge')pending.dodge=true;if(key==='interact')pending.interact=true;syncHeld();}
function touchSurfaceStart(id,x,y,target){
 if(!canTouchPlay()||touchKeys.has(id)||id===stickId)return false;
 if(target?.closest?.('button,a,input,select,textarea,summary,[role="dialog"],.menu,.world-panel,.world-journey,.tracker,.notice-stack,#overlay,#dialogueControls,#dialogue,#landscapeGate'))return false;
 // A small, non-overlapping catchment around the actual action buttons catches
 // thumb misses without firing through menus or stealing another button's touch.
 let key=null,best=Infinity;for(const b of document.querySelectorAll('.action-pad [data-key]')){
  if(b.disabled||!b.getClientRects().length)continue;const r=b.getBoundingClientRect(),margin=b.dataset.key==='attack'?12:6,dx=Math.max(r.left-x,0,x-r.right),dy=Math.max(r.top-y,0,y-r.bottom),d=Math.hypot(dx,dy);
  if(d<=margin&&d<best){best=d;key=b.dataset.key;}
 }
 if(key){pressTouchAction(id,key);return true;}
 const r=zone.getBoundingClientRect();if(stickId===null&&x>=r.left&&x<r.right&&y>=r.top&&y<=r.bottom){stickId=id;stickStart(x,y);return true;}return false;
}
$('screen').addEventListener('touchstart',e=>{let used=false;for(const t of e.changedTouches)used=touchSurfaceStart('t'+t.identifier,t.clientX,t.clientY,t.target||e.target)||used;if(used)e.preventDefault();},{passive:false});
window.addEventListener('touchmove',e=>{if(stickId===null)return;for(const t of e.changedTouches)if('t'+t.identifier===stickId)stickMove(t.clientX,t.clientY);},{passive:true});
$('screen').addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;if(touchSurfaceStart('p'+e.pointerId,e.clientX,e.clientY,e.target))e.preventDefault();});
window.addEventListener('pointermove',e=>{if('p'+e.pointerId===stickId)stickMove(e.clientX,e.clientY);});
window.addEventListener('pointerup',e=>{if('p'+e.pointerId===stickId)releaseStick();if(e.pointerType!=='touch'){touchKeys.delete('p'+e.pointerId);syncHeld();}});
window.addEventListener('pointercancel',e=>{if('p'+e.pointerId===stickId)releaseStick();touchKeys.delete('p'+e.pointerId);syncHeld();});
function touchPrune(e){const live=new Set([...e.touches].map(t=>'t'+t.identifier));if(stickId&&stickId[0]==='t'&&!live.has(stickId))releaseStick();for(const id of [...touchKeys.keys()])if(String(id)[0]==='t'&&!live.has(id))touchKeys.delete(id);syncHeld();}
window.addEventListener('touchend',touchPrune,{passive:true});window.addEventListener('touchcancel',touchPrune,{passive:true});
function syncHeld(){document.querySelectorAll('[data-key]').forEach(b=>b.classList.toggle('held',touchHas(b.dataset.key)));}
function resetTouch(){releaseStick();touchKeys.clear();pending.attack=pending.dodge=pending.interact=false;document.querySelectorAll('[data-key]').forEach(b=>b.classList.remove('held'));}
function touchHas(key){return [...touchKeys.values()].includes(key);}
document.querySelectorAll('[data-key]').forEach(button=>{const key=button.dataset.key;button.addEventListener('touchstart',e=>{e.preventDefault();for(const t of e.changedTouches)pressTouchAction('t'+t.identifier,key);},{passive:false});button.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();pressTouchAction('p'+e.pointerId,key);});button.addEventListener('contextmenu',e=>e.preventDefault());});
window.addEventListener('blur',resetTouch);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetTouch();});
