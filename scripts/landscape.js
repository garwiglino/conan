// Native UIKit and the web manifest enforce landscape where supported.
// Browsers that decline orientation lock show a gate and suspend the game.
let landscapeBlocked=false,landscapeFocus=null;
async function lockLandscape(){try{await window.screen.orientation?.lock?.('landscape');}catch{}}
function syncLandscape(){
 const blocked=innerHeight>innerWidth;
 if(blocked===landscapeBlocked)return;
 landscapeBlocked=blocked;
 const gate=$('landscapeGate');gate.hidden=!blocked;document.querySelector('.page').inert=blocked;
 if(blocked){
  landscapeFocus=document.activeElement;keys.clear();resetTouch();
  if(state==='playing')pause();
  sound.tick(false,null);sound.rain(0);sound.ambience({active:false});
  gate.focus({preventScroll:true});
 }else{
  fitScreen();
  if(state==='paused')$('start').focus({preventScroll:true});
  else if(landscapeFocus?.isConnected)landscapeFocus.focus({preventScroll:true});
 }
}
addEventListener('resize',syncLandscape);
addEventListener('orientationchange',()=>setTimeout(syncLandscape,250));
window.visualViewport?.addEventListener('resize',syncLandscape);
