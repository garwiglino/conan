/* Simulation coordinates never change. This view is used only while drawing. */
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.WorldProjection=f();})(globalThis,function(){
'use strict';
const point=(x,y,z=0)=>({x:x-y,y:(x+y)/2-z}),inverse=(x,y,z=0)=>({x:y+z+x/2,y:y+z-x/2});
function rect(r){const p=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(v=>inverse(...v)),xs=p.map(p=>p.x),ys=p.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function input(x=0,y=0){const p=inverse(x,y),l=Math.hypot(p.x,p.y),size=Math.min(1,Math.hypot(x,y));return l?{x:p.x/l*size,y:p.y/l*size}:{x:0,y:0};}
// A movement budget is measured on screen, before collision response.
function distance(x,y){const q=point(x,y);return Math.hypot(q.x,q.y);}
function motion(x,y){const length=Math.hypot(x,y),projected=distance(x,y),scale=projected?length/projected:0;return {x:x*scale,y:y*scale};}
// Snap the camera to final backing pixels, not a canvas that CSS will stretch.
const snap=(value,k=1)=>Math.round(value*k)/k;
function camera(x,y,w,h,top=0,offset=14,k=1){return {
 x:snap(x,k)-Math.round(w*k/2)/k,
 y:snap(y,k)-Math.round((h-top)*k/2+offset*k)/k
};}
function display(game){
 const views=new WeakMap(),originals=new WeakMap();
 const raw=o=>originals.get(o)||o;
 function wrap(o){
  if(!o||typeof o!=='object'||ArrayBuffer.isView(o)||o instanceof Map||o instanceof Set||o instanceof Date)return o;
  // Canvas/image resources and simulation service instances are not position records.
  const proto=Object.getPrototypeOf(o),plain=!proto||proto===Object.prototype||proto.constructor?.name==='Object';
  if(!Array.isArray(o)&&!plain&&o!==game)return o;
  if(views.has(o))return views.get(o);
  const methods=new Map(),proxy=new Proxy(o,{
   get(t,k){
    if(k==='_logical')return t;
    if((k==='x'||k==='y')&&Number.isFinite(t.x)&&Number.isFinite(t.y))return point(t.x,t.y)[k];
    if((k==='vx'||k==='vy')&&Number.isFinite(t.vx)&&Number.isFinite(t.vy)){const p=point(t.vx,t.vy);return k==='vx'?p.x:p.y;}
    const v=Reflect.get(t,k);
    if(typeof v==='function'&&!Array.isArray(t)){
     if(!methods.has(k))methods.set(k,(...args)=>{args=args.map(raw);if(t===game&&['tile','solid','tentAt'].includes(k)){const p=inverse(args[0],args[1]);args[0]=p.x;args[1]=p.y;}if(t===game&&k==='facing')return [[0,-1],[1,0],[0,1],[-1,0]][args[0]];return wrap(v.apply(t,args));});return methods.get(k);
    }
    if(['atlas','worldState','settlements','humanWorkstations','humanFixtureIndex','location','weather'].includes(k))return v;
    return wrap(v);
   },
   set(t,k,v){
    // Renderer caches such as _img are shared. Position writes during rendering
    // are rejected: a visual effect cannot move a simulation actor.
    if(k==='x'||k==='y')throw Error('Cannot move a simulation entity from its projected view');
    if(t===game&&k==='justiceView')v=rect(v);
    return Reflect.set(t,k,Array.isArray(v)?v.map(raw):raw(v));
   }
  });views.set(o,proxy);originals.set(proxy,o);return proxy;
 }
 return {game:wrap(game),wrap,raw};
}
return Object.freeze({point,inverse,rect,input,distance,motion,snap,camera,display});
});
