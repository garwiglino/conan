/* CSS-pixel camera gestures. One shared anchor for fingers, wheel and buttons. */
function createWorldMapGestures({view,rect,worldWidth,worldHeight,maxZoom,minZoom=1,draw,select=()=>{},schedule=cb=>requestAnimationFrame(cb)}){
 const pointers=new Map();let gesture=null,tap=null,queued=false,lastSize=null;
 const limit=(n,a,b)=>Math.max(a,Math.min(b,n));
 function size(){const r=rect();return {w:r.width,h:r.height,left:r.left||0,top:r.top||0};}
 function transform(s=size()) {const v=view(),scale=Math.min(s.w/worldWidth,s.h/worldHeight)*.91*v.zoom;return {...s,scale,ox:s.w/2-worldWidth*scale/2+v.x,oy:s.h/2-worldHeight*scale/2+v.y};}
 function repaint(){if(queued)return;queued=true;schedule(()=>{queued=false;draw();});}
 function constrain(s=size()) {const v=view(),t=transform(s);if(!(t.scale>0))return;const x=Math.max(0,(worldWidth*t.scale-s.w)/2)+s.w*.25,y=Math.max(0,(worldHeight*t.scale-s.h)/2)+s.h*.25;v.x=limit(v.x,-x,x);v.y=limit(v.y,-y,y);}
 function centre(){const p=[...pointers.values()].slice(0,2);if(!p.length)return null;return p.length===1?{x:p[0].x,y:p[0].y,d:0}:{x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
 function rebase(){const p=centre(),t=transform();gesture=p&&t.scale>0?{...p,wx:(p.x-t.ox)/t.scale,wy:(p.y-t.oy)/t.scale,zoom:view().zoom}:null;}
 function position(x,y){const s=size();lastSize=s;return {x:x-s.left,y:y-s.top};}
 function down(id,x,y){const p=position(x,y);pointers.set(id,p);tap=pointers.size===1?{id,...p}:null;rebase();}
 function move(id,x,y){if(!pointers.has(id))return;const p=position(x,y);pointers.set(id,p);if(tap&&Math.hypot(p.x-tap.x,p.y-tap.y)>6)tap=null;
  const c=centre(),s=size(),v=view();if(!gesture||!c)return;const requested=gesture.zoom*(gesture.d>2&&pointers.size>1?c.d/gesture.d:1);v.zoom=limit(requested,minZoom,maxZoom);
  const scale=Math.min(s.w/worldWidth,s.h/worldHeight)*.91*v.zoom;v.x=c.x-s.w/2+(worldWidth/2-gesture.wx)*scale;v.y=c.y-s.h/2+(worldHeight/2-gesture.wy)*scale;const before={x:v.x,y:v.y,zoom:requested};constrain(s);if(before.zoom!==v.zoom||before.x!==v.x||before.y!==v.y||gesture.d<=2&&c.d>2)rebase();repaint();
 }
 function up(id,x,y,cancelled=false){if(!pointers.has(id))return;if(!cancelled)move(id,x,y);const chosen=!cancelled&&tap?.id===id&&pointers.size===1?position(x,y):null;pointers.delete(id);tap=null;rebase();if(chosen)select(chosen);}
 function cancel(){pointers.clear();gesture=tap=null;}
 function zoom(factor,point=null){if(!Number.isFinite(factor)||factor<=0)return;const s=size(),t=transform(s);if(!(t.scale>0))return;const p=point||{x:s.w/2,y:s.h/2},wx=(p.x-t.ox)/t.scale,wy=(p.y-t.oy)/t.scale,v=view();v.zoom=limit(v.zoom*factor,minZoom,maxZoom);const scale=Math.min(s.w/worldWidth,s.h/worldHeight)*.91*v.zoom;v.x=p.x-s.w/2+(worldWidth/2-wx)*scale;v.y=p.y-s.h/2+(worldHeight/2-wy)*scale;constrain(s);rebase();repaint();}
 function resize(){const next=size();if(!next.w||!next.h){cancel();return;}if(lastSize?.w&&lastSize.h){const old=transform(lastSize),v=view(),wx=(lastSize.w/2-old.ox)/old.scale,wy=(lastSize.h/2-old.oy)/old.scale,scale=Math.min(next.w/worldWidth,next.h/worldHeight)*.91*v.zoom;v.x=(worldWidth/2-wx)*scale;v.y=(worldHeight/2-wy)*scale;}
  lastSize=next;cancel();constrain(next);repaint();
 }
 function reset(){cancel();lastSize=size();constrain(lastSize);repaint();}
 return {down,move,up,cancel,zoom,resize,reset,transform,active:()=>pointers.size};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldMapGestures;
