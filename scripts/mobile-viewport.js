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
 const scale=gw/W,safe={t:Math.ceil(ins.t/scale),r:Math.ceil(Math.max(0,ins.r-gr)/scale),b:Math.ceil(ins.b/scale),l:Math.ceil(Math.max(0,ins.l-gl)/scale)};
 const K=Math.max(1,Math.min(4,Math.round(scale*(window.devicePixelRatio||1))));
 if(cv.width!==W*K)cv.width=W*K;if(cv.height!==H*K)cv.height=H*K;
 renderer.resize(W,H,safe,K,scale);
 for(const [k,v]of [['--gl',gl],['--gr',gr],['--gt',gt],['--gb',gb],['--hud',Math.round(renderer.top*scale)],['--pc',PANEL],['--control-left',ins.l],['--control-right',ins.r],['--control-bottom',ins.b]])scr.style.setProperty(k,v+'px');
 layoutStick();
}
function layoutStick(){const scr=$('screen'),z=$('stickZone');if(!z)return;z.style.top=Math.round(Math.max(64,scr.clientHeight*.25))+'px';}
fitScreen();addEventListener('resize',fitScreen);addEventListener('orientationchange',()=>setTimeout(fitScreen,250));document.addEventListener('fullscreenchange',fitScreen);document.addEventListener('webkitfullscreenchange',fitScreen);window.visualViewport?.addEventListener('resize',fitScreen);
