// A fixed phone frame: safe-area changes protect controls inside/over the rails,
// never add a second set of gutters to the world viewport.
const PANEL=150;
function fitScreen(){
 if(innerHeight>innerWidth)return;
 const cv=$('game'),scr=$('screen'),sw=Math.max(1,scr.clientWidth||innerWidth),sh=Math.max(1,scr.clientHeight||innerHeight),cs=getComputedStyle($('safeProbe'));
 const ins={t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};
 const touch=document.body.classList.contains('mobile')||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
 const gl=touch?PANEL:0,gr=touch?PANEL:0,gt=0,gb=0;
 scr.classList.toggle('panels-x',touch);scr.classList.remove('panels-y');
 const gw=Math.max(1,sw-gl-gr),gh=sh,ratio=gw/gh;let H=200,W=Math.round(200*ratio);
 if(W<216){W=216;H=Math.min(1000,Math.round(216/ratio));}
 // Match the backing bitmap to the phone's physical viewport. A rounded render
 // multiplier followed by CSS stretching changes pixel widths during scrolling.
 const dpr=window.devicePixelRatio||1,pw=Math.max(1,Math.round(gw*dpr)),ph=Math.max(1,Math.round(gh*dpr)),K=pw/W,scale=K/dpr;
 H=ph/K;
 const safe={t:Math.ceil(ins.t/scale),r:Math.ceil(Math.max(0,ins.r-gr)/scale),b:Math.ceil(ins.b/scale),l:Math.ceil(Math.max(0,ins.l-gl)/scale)};
 if(cv.width!==pw)cv.width=pw;if(cv.height!==ph)cv.height=ph;
 // Keep the bitmap's origin on the same physical grid, including fractional DPR.
 Object.assign(cv.style,{left:Math.round(gl*dpr)/dpr+'px',top:Math.round(gt*dpr)/dpr+'px',width:pw/dpr+'px',height:ph/dpr+'px'});
 renderer.resize(W,H,safe,K,scale);
 for(const [k,v]of [['--gl',gl],['--gr',gr],['--gt',gt],['--gb',gb],['--hud',Math.round(renderer.top*scale)],['--pc',PANEL],['--control-left',ins.l],['--control-right',ins.r],['--control-bottom',ins.b]])scr.style.setProperty(k,v+'px');
 layoutStick();
}
function layoutStick(){const scr=$('screen'),z=$('stickZone');if(!z)return;z.style.top=Math.round(Math.max(64,scr.clientHeight*.25))+'px';}
fitScreen();addEventListener('resize',fitScreen);addEventListener('orientationchange',()=>setTimeout(fitScreen,250));document.addEventListener('fullscreenchange',fitScreen);document.addEventListener('webkitfullscreenchange',fitScreen);window.visualViewport?.addEventListener('resize',fitScreen);
