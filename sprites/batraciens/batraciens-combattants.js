(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./batraciens-complet.js'));else root.HearthreaverBatraciensCombattants=factory(root.HearthreaverBatraciens);})(typeof globalThis!=='undefined'?globalThis:this,function(API){'use strict';
 if(!API) throw new Error('HearthreaverBatraciens requis.');
 const VERSION='1.0.0';
 const ANCHOR=API.ANCHOR, NATIVE_ANCHOR=API.NATIVE_ANCHOR, DIR=API.DIR, DIRECTIONS=API.DIRECTIONS, SHEET_DIRECTIONS=API.SHEET_DIRECTIONS;
 const MALE=API.Male;
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
 const ROLE_GROUPS=freeze({
   village_guard:{label:'Garde de communauté',weapon:'spear',offhand:'shield',accent:'guard',banner:false},
   channel_sentinel:{label:'Sentinelle des voies d’eau',weapon:'spear',offhand:'shield',accent:'water',banner:false},
   boat_escort:{label:'Escorte de bateliers',weapon:'sword',offhand:'shield',accent:'escort',banner:false},
   scout:{label:'Éclaireur',weapon:'javelin',offhand:null,accent:'scout',bundle:true,banner:false},
   raider:{label:'Pillard de chenal',weapon:'club',offhand:null,accent:'raider',banner:false},
   captain:{label:'Chef de patrouille',weapon:'spear',offhand:'shield',accent:'captain',banner:true}
 });
 const CLIPS=freeze({
   idle:{label:'Repos armé',group:'commun',frames:8,durations:[1300,220,380,320,650,100,130,1200],loop:true,stride:null,duration:4300,terminal:false,base:'idle'},
   walk:{label:'Marche armée',group:'commun',frames:8,durations:[63,62,63,62,63,62,63,62],loop:true,stride:18,duration:500,terminal:false,base:'walk'},
   patrol:{label:'Patrouille',group:'commun',frames:8,durations:[63,62,63,62,63,62,63,62],loop:true,stride:18,duration:500,terminal:false,base:'walk'},
   alert:{label:'Alerte',group:'combat',frames:8,durations:[100,100,100,100,100,100,100,100],loop:false,stride:null,duration:800,terminal:true,base:'startle'},
   challenge:{label:'Sommer / menacer',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'talk'},
   guard:{label:'Garde haute',group:'combat',frames:8,durations:[140,140,140,140,140,140,140,140],loop:true,stride:null,duration:1120,terminal:false,base:'idle'},
   block:{label:'Parade / blocage',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'cower'},
   thrust:{label:'Estoc / coup de lance',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'fish_spear'},
   slash:{label:'Taille / frappe courte',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'harvest'},
   throw_javelin:{label:'Lancer de javelot',group:'combat',frames:8,durations:[90,90,90,90,90,90,90,90],loop:false,stride:null,duration:720,terminal:true,base:'fish_cast'},
   flee:{label:'Fuite armée',group:'combat',frames:8,durations:[80,80,80,80,80,80,80,80],loop:true,stride:18,duration:640,terminal:false,base:'flee'},
   hit:{label:'Réception d’un coup',group:'combat',frames:8,durations:[100,100,100,100,100,100,100,100],loop:false,stride:null,duration:800,terminal:true,base:'hit'},
   death:{label:'Mort',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:false,stride:null,duration:960,terminal:true,base:'death'},
   surrender:{label:'Se rendre',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'startle'},
   rally:{label:'Rallier / donner un ordre',group:'combat',frames:8,durations:[120,120,120,120,120,120,120,120],loop:true,stride:null,duration:960,terminal:false,base:'talk'}
 });
 const COLOR=freeze({
   outline:[16,14,32,255], wood0:[80,52,47,255], wood1:[117,75,55,255], wood2:[161,106,68,255],
   metal0:[94,104,110,255], metal1:[143,152,156,255], metal2:[207,213,214,255],
   leather0:[80,52,47,255], leather1:[117,75,55,255],
   shield0:[70,60,40,255], shield1:[115,99,66,255], shield2:[184,164,105,255],
   cloth0:[69,92,115,255], cloth1:[107,136,163,255], cloth2:[166,185,201,255],
   red0:[124,43,42,255], red1:[176,77,62,255], red2:[214,145,92,255],
   green0:[63,97,86,255], green1:[88,137,122,255], green2:[121,175,154,255],
   gold0:[181,119,44,255], gold1:[243,175,60,255], gold2:[255,212,94,255]
 });
 function finite(n,label){if(typeof n!=='number'||!Number.isFinite(n)) throw new TypeError(label+' doit être un nombre fini.');return n;}
 function integer(n,label){if(!Number.isInteger(n)) throw new TypeError(label+' doit être un entier.');return n;}
 function clipName(name){if(!Object.hasOwn(CLIPS,name)) throw new RangeError('Animation inconnue : '+name); return name;}
 function roleName(name){if(!Object.hasOwn(ROLE_GROUPS,name)) throw new RangeError('Rôle inconnu : '+name); return name;}
 function directionName(dir){return API.directionName(dir);}
 function paletteName(name){return API.paletteName('male',name||'original');}
 function frameAt(action='idle',seconds=0,distancePx){const clip=CLIPS[clipName(action)];finite(seconds,'seconds');const total=clip.duration;let ms; if(clip.stride!==null&&distancePx!==undefined){finite(distancePx,'distancePx'); ms=((distancePx%clip.stride+clip.stride)%clip.stride)/clip.stride*total;} else {ms=Math.max(0,seconds)*1000; ms=clip.loop?ms%total:Math.min(ms,total-0.001);} for(let i=0;i<clip.frames;i++){if(ms<clip.durations[i]) return i; ms-=clip.durations[i];} return clip.frames-1;}
 function empty(w=80,h=80){return {width:w,height:h,anchor:ANCHOR,data:new Uint8ClampedArray(w*h*4)};}
 function clone(image){return {width:image.width,height:image.height,anchor:image.anchor,data:new Uint8ClampedArray(image.data)};}
 function set(image,x,y,color){if(x<0||y<0||x>=image.width||y>=image.height) return; const c=Array.isArray(color)?color:COLOR[color]; if(!c) return; const i=(y*image.width+x)*4; image.data[i]=c[0]; image.data[i+1]=c[1]; image.data[i+2]=c[2]; image.data[i+3]=c[3];}
 function line(image,x0,y0,x1,y1,color){x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,err=dx+dy;for(;;){set(image,x0,y0,color); if(x0===x1&&y0===y1) break; const e2=2*err; if(e2>=dy){err+=dy;x0+=sx;} if(e2<=dx){err+=dx;y0+=sy;}}}
 function rect(image,x,y,w,h,color){for(let j=0;j<h;j++) for(let i=0;i<w;i++) set(image,x+i,y+j,color);}
 function ellipse(image,cx,cy,rx,ry,color,fill=true){for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++){const v=(x*x)/(rx*rx)+(y*y)/(ry*ry); if(fill? v<=1 : Math.abs(v-1)<0.35) set(image,cx+x,cy+y,color);}}
 function merge(dst,src){for(let i=0;i<dst.data.length;i+=4){const a=src.data[i+3]; if(!a) continue; dst.data[i]=src.data[i]; dst.data[i+1]=src.data[i+1]; dst.data[i+2]=src.data[i+2]; dst.data[i+3]=a; } return dst;}
 function composite(list){const out=empty(list[0].width,list[0].height); for(const im of list) merge(out,im); return out;}
 function formatImage(image,format){if(format==='engine'||!format) return image; if(format==='native'){for(let y=0;y<80;y++)for(let x=0;x<80;x++)if((x<16||y<16||x>=64||y>=64)&&image.data[(y*80+x)*4+3])throw new RangeError('Cette pose comporte du matériel au sol hors 48x48 ; utiliser engine 80x80, sans recadrage destructeur.');const out=empty(48,48); for(let y=0;y<48;y++) for(let x=0;x<48;x++){const sx=x+16,sy=y+16,si=(sy*80+sx)*4,di=(y*48+x)*4; out.data[di]=image.data[si]; out.data[di+1]=image.data[si+1]; out.data[di+2]=image.data[si+2]; out.data[di+3]=image.data[si+3];} out.anchor=NATIVE_ANCHOR; return out;} throw new RangeError('Format attendu : engine ou native');}
 function baseFrameData(action,view,frame,palette){const base=CLIPS[action].base; const baseClip=API.CLIPS[base]; const mapped=baseClip.frames===CLIPS[action].frames?frame:Math.max(0,Math.min(baseClip.frames-1,Math.round(frame*(baseClip.frames-1)/(CLIPS[action].frames-1)))); const r=API.renderLayers({sex:'male',action:base,dir:view,frame:mapped,palette}); return {image:composite([r.layers.body,r.layers.hands]),meta:r.metadata};}
 function fallbackHands(view){if(view==='face') return [[36,42],[44,45]]; if(view==='dos') return [[38,42],[42,45]]; if(view==='droite') return [[47,42],[43,46]]; return [[33,42],[37,46]];}
 function handsFor(meta,view){return meta&&Array.isArray(meta.hands)&&meta.hands.length===2?meta.hands:fallbackHands(view);}
 function shield(image,cx,cy,view,accent){const accentColor=accent==='water'?'cloth1':accent==='captain'?'red1':'shield2'; if(view==='face'||view==='dos'){ellipse(image,cx,cy,5,6,'shield0'); ellipse(image,cx,cy,4,5,'shield1'); rect(image,cx-1,cy-4,2,8,accentColor); rect(image,cx-3,cy-1,6,2,'metal2');} else {ellipse(image,cx,cy,4,6,'shield0'); ellipse(image,cx,cy,3,5,'shield1'); rect(image,cx-1,cy-4,1,8,accentColor); rect(image,cx-2,cy-1,4,2,'metal2');}}
 function spear(image,a,b,accent,banner){line(image,a[0],a[1],b[0],b[1],'wood2'); const dx=Math.sign(b[0]-a[0])||1,dy=Math.sign(b[1]-a[1])||-1; set(image,b[0],b[1],'metal2'); set(image,b[0]-dx,b[1]-dy,'metal1'); set(image,b[0]-dx,b[1],'metal0'); if(banner){rect(image,a[0]+(dx<0?-4:1),a[1]-6,3,5,'red1'); set(image,a[0]+(dx<0?-2:3),a[1]-2,'red2');}}
 function sword(image,a,b){line(image,a[0],a[1],b[0],b[1],'metal1'); line(image,b[0],b[1],b[0]+(b[0]>=a[0]?1:-1),b[1]-1,'metal2'); line(image,a[0]-1,a[1],a[0]+1,a[1],'gold1'); set(image,a[0],a[1]+1,'wood0');}
 function club(image,a,b){line(image,a[0],a[1],b[0],b[1],'wood1'); rect(image,b[0]-1,b[1]-1,3,3,'wood2'); set(image,b[0]+1,b[1]+1,'metal0');}
 function javelin(image,a,b){line(image,a[0],a[1],b[0],b[1],'wood2'); set(image,b[0],b[1],'metal2'); set(image,b[0]-Math.sign(b[0]-a[0]||1),b[1],'metal1');}
 function bundle(image,cx,cy,count=3){for(let i=0;i<count;i++) line(image,cx+i,cy+6,cx+4+i,cy-6,'wood2'); for(let i=0;i<count;i++) set(image,cx+4+i,cy-6,'metal2'); }
 function roleAccent(role){return ROLE_GROUPS[role].accent;}
 function guardHandPose(view,frame){const bob=[0,0,1,1,0,-1,-1,0][frame]; if(view==='face') return {main:[[44,44],[46,29+bob]],off:[35,44],shield:[31,42+bob]}; if(view==='dos') return {main:[[36,44],[34,28+bob]],off:[45,44],shield:[48,42+bob]}; if(view==='droite') return {main:[[44,45],[50,29+bob]],off:[41,44],shield:[38,42+bob]}; return {main:[[36,45],[30,29+bob]],off:[39,44],shield:[42,42+bob]};}
 function attackPose(view,frame,kind){const t=frame/7; if(kind==='thrust'){ if(view==='face') return {a:[44,43],b:[44,30-2*t],c:[36,44],shield:[32,42]}; if(view==='dos') return {a:[36,43],b:[36,28-2*t],c:[44,44],shield:[48,42]}; if(view==='droite') return {a:[44,43],b:[50+Math.round(t*5),38-Math.round(t*3)],c:[41,45],shield:[38,42]}; return {a:[36,43],b:[30-Math.round(t*5),38-Math.round(t*3)],c:[39,45],shield:[42,42]}; }
 if(kind==='slash'){ if(view==='face') return {a:[43,41],b:[49-Math.round(t*5),31+Math.round(t*8)],c:[35,44],shield:[31,42]}; if(view==='dos') return {a:[37,41],b:[31+Math.round(t*5),31+Math.round(t*8)],c:[45,44],shield:[49,42]}; if(view==='droite') return {a:[45,41],b:[52-Math.round(t*6),33+Math.round(t*10)],c:[41,44],shield:[38,42]}; return {a:[35,41],b:[28+Math.round(t*6),33+Math.round(t*10)],c:[39,44],shield:[42,42]}; }
 if(kind==='throw'){ if(view==='face') return {a:[45,39],b:[49-Math.round(t*8),28+Math.round(t*4)],bundle:[33,40]}; if(view==='dos') return {a:[35,39],b:[31+Math.round(t*8),28+Math.round(t*4)],bundle:[47,40]}; if(view==='droite') return {a:[45,39],b:[52-Math.round(t*3)+Math.round(t*10),30-Math.round(t*8)],bundle:[39,40]}; return {a:[35,39],b:[28+Math.round(t*3)-Math.round(t*10),30-Math.round(t*8)],bundle:[41,40]}; }
 return null; }
 function challengePose(view,frame){const t=frame/7; if(view==='face') return {point:[[44,42],[48,37-Math.round(t*2)]],off:[35,44],shield:[31,42]}; if(view==='dos') return {point:[[36,42],[32,37-Math.round(t*2)]],off:[45,44],shield:[48,42]}; if(view==='droite') return {point:[[44,42],[52,39]],off:[41,44],shield:[38,42]}; return {point:[[36,42],[28,39]],off:[39,44],shield:[42,42]}; }
 function renderRoleGear(role,action,view,frame,image,meta){const spec=ROLE_GROUPS[role], accent=roleAccent(role); const hands=handsFor(meta,view);
  // back bundle for scout
  if(spec.bundle && !['death','surrender'].includes(action)){ if(view==='dos') bundle(image,42,38,3); else if(view==='droite') bundle(image,45,39,3); else if(view==='gauche') bundle(image,31,39,3); }
  if(action==='death'){
    if(spec.weapon==='spear') spear(image,[48,54],[55,69],accent,spec.banner); else if(spec.weapon==='sword') sword(image,[47,55],[54,62]); else if(spec.weapon==='club') club(image,[47,56],[53,61]); else if(spec.weapon==='javelin') javelin(image,[48,55],[55,62]);
    if(spec.offhand==='shield') shield(image,31,58,view,accent); return;
  }
  if(action==='surrender') return;
  if(action==='block'){
    if(spec.offhand==='shield'){ const p=guardHandPose(view,frame); shield(image,p.shield[0],p.shield[1]-(view==='face'||view==='dos'?2:1),view,accent);} 
    if(spec.weapon==='spear'){ const p=guardHandPose(view,frame); spear(image,p.main[0], p.main[1], accent,spec.banner); }
    return;
  }
  if(action==='alert'||action==='guard'||action==='idle'||action==='walk'||action==='patrol'||action==='flee'||action==='hit'){
    const p=guardHandPose(view,frame); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.main[0],p.main[1],accent,spec.banner);
    else if(spec.weapon==='sword') sword(image,[view==='gauche'?37:43,46],[view==='gauche'?31:49,35]);
    else if(spec.weapon==='club') club(image,[view==='gauche'?37:43,46],[view==='gauche'?30:50,38]);
    else if(spec.weapon==='javelin'){ const q=view==='gauche'?-1:1; javelin(image,[view==='gauche'?37:43,45],[view==='gauche'?29:51,33]); }
    return;
  }
  if(action==='challenge'||action==='rally'){
    const p=challengePose(view,frame); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.point[0],p.point[1],accent,spec.banner);
    else if(spec.weapon==='sword') sword(image,p.point[0],p.point[1]);
    else if(spec.weapon==='club') club(image,p.point[0],p.point[1]);
    else if(spec.weapon==='javelin'){ javelin(image,p.point[0],p.point[1]); bundle(image,p.bundle?p.bundle[0]:33,p.bundle?p.bundle[1]:40,2); }
    return;
  }
  if(action==='thrust'){
    const p=attackPose(view,frame,'thrust'); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.a,p.b,accent,spec.banner); else if(spec.weapon==='sword') sword(image,p.a,p.b); else if(spec.weapon==='club') club(image,p.a,p.b); else javelin(image,p.a,p.b);
    return;
  }
  if(action==='slash'){
    const p=attackPose(view,frame,'slash'); if(spec.offhand==='shield') shield(image,p.shield[0],p.shield[1],view,accent);
    if(spec.weapon==='spear') spear(image,p.a,p.b,accent,spec.banner); else if(spec.weapon==='sword') sword(image,p.a,p.b); else if(spec.weapon==='club') club(image,p.a,p.b); else javelin(image,p.a,p.b);
    return;
  }
  if(action==='throw_javelin'){
    const p=attackPose(view,frame,'throw'); if(spec.bundle) bundle(image,p.bundle[0],p.bundle[1],2); if(frame<5) javelin(image,p.a,p.b); else if(frame===5) javelin(image,p.a,[p.b[0]+(view==='gauche'?-12:view==='droite'?12:0),p.b[1]-2]);
    return;
  }
 }
 function raster(options={}){const role=roleName(options.role||'village_guard'), action=clipName(options.action||'idle'), view=directionName(options.dir===undefined?DIR.SOUTH:options.dir), frame=integer(options.frame===undefined?0:options.frame,'frame'), palette=paletteName(options.palette||'original'), format=options.format||'engine';
  if(frame<0||frame>=CLIPS[action].frames) throw new RangeError('frame hors limite');
  const base=baseFrameData(action,view,frame,palette); const image=clone(base.image);
  // hide stars for hit? body+hands already no tools only.
  renderRoleGear(role,action,view,frame,image,base.meta);
  return {...formatImage(image,format), metadata:{role,action,direction:view,engineDirection:DIRECTIONS.indexOf(view),frame,palette,anchor:format==='native'?NATIVE_ANCHOR:ANCHOR}};
 }
 class Atlas{ constructor(options={}){this.role=roleName(options.role||'village_guard'); this.palette=paletteName(options.palette||'original'); this.canvasFactory=options.canvasFactory||defaultCanvasFactory; this.maxFrames=options.maxFrames===undefined?128:integer(options.maxFrames,'maxFrames'); if(this.maxFrames<1||this.maxFrames>256)throw new RangeError('maxFrames : 1..256'); this.cache=new Map();}
   get(action='idle',dir=DIR.SOUTH,frame=0){const key=[this.role,this.palette,action,dir,frame].join(':'); if(this.cache.has(key)){const v=this.cache.get(key); this.cache.delete(key); this.cache.set(key,v); return v;} const im=raster({role:this.role,palette:this.palette,action,dir,frame,format:'engine'}); const cv=this.canvasFactory(80,80), c=cv.getContext('2d'); const id=c.createImageData(80,80); id.data.set(im.data); c.putImageData(id,0,0); this.cache.set(key,cv); while(this.cache.size>this.maxFrames) this.cache.delete(this.cache.keys().next().value); return cv;}
   draw(ctx,actor,time=0,state={}){const action=clipName(state.action||'idle'); const frame=state.frame===undefined?frameAt(action,state.elapsed===undefined?time:state.elapsed,state.distance):state.frame; const im=this.get(action,actor.dir===undefined?DIR.SOUTH:actor.dir,frame); const z=actor.z||0, alpha=actor.alpha===undefined?1:actor.alpha; ctx.save(); try{ctx.imageSmoothingEnabled=false; ctx.globalAlpha*=alpha; ctx.drawImage(im,Math.round(actor.x)-ANCHOR.x,Math.round(actor.y-z)-ANCHOR.y);} finally{ctx.restore();} actor._img=im; return im;}
   clear(){this.cache.clear();}
 }
 function defaultCanvasFactory(w,h){let cv;if(typeof document!=='undefined')cv=document.createElement('canvas'); else if(typeof OffscreenCanvas!=='undefined')cv=new OffscreenCanvas(w,h); else throw new Error('Canvas indisponible'); cv.width=w; cv.height=h; return cv;}
 function buildSheet(options={}){const actions=options.actions||Object.keys(CLIPS), role=roleName(options.role||'village_guard'), palette=paletteName(options.palette||'original'), format=options.format||'engine', cell=format==='native'?48:80; const columns=Math.max(...actions.map(a=>CLIPS[clipName(a)].frames)), rows=actions.length*4; const out={width:columns*cell,height:rows*cell,data:new Uint8ClampedArray(columns*cell*rows*cell*4)}; for(let ai=0;ai<actions.length;ai++) for(let di=0;di<4;di++) for(let f=0;f<CLIPS[actions[ai]].frames;f++){const im=raster({role,palette,action:actions[ai],dir:SHEET_DIRECTIONS[di],frame:f,format}); for(let y=0;y<cell;y++) out.data.set(im.data.subarray(y*cell*4,(y+1)*cell*4), (((ai*4+di)*cell+y)*out.width+f*cell)*4);} return out;}
 function manifest(){return {id:'batraciens-combattants',version:VERSION,cell:[80,80],anchor:[40,52],nativeCell:[48,48],nativeAnchor:[24,36],directions:DIRECTIONS,sheetDirections:SHEET_DIRECTIONS,roles:ROLE_GROUPS,clips:CLIPS,palettes:API.COLOR_VARIANTS.male,scope:'Male armed roles only. Sprites and playback, no AI or combat rules.'};}
 return freeze({VERSION,DIR,ANCHOR,NATIVE_ANCHOR,DIRECTIONS,SHEET_DIRECTIONS,ROLES:ROLE_GROUPS,CLIPS,frameAt,raster,Atlas,buildSheet,manifest});
});
