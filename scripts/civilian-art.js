/* Authored in Aseprite; exact palette substitution and lossless tile packing only. */
const CIVILIAN_HAIR={noir:['1b1d2b','32384c','63728b'],brun:['2e2029','523a34','927052'],chatain:['442e32','785139','b88a5b'],roux:['4b2832','a45131','df984e'],blond:['64503b','bd975b','eed18a'],argente:['404451','828c99','c3ced1']};
const CIVILIAN_COMMON=['idle','walk','flee','startle','talk','sit_down','seated','stand_up','cower','hit','death','carry'];
function civilianHash(value){let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function civilianBiome(game,n){const p=Atlas.toWorld(n.x,n.y),b=Atlas.cellAt(p.x,p.y)?.biome;return [1,2,3].includes(b)?'aride':[9,10,11].includes(b)?'neige':[5,7].includes(b)?'jungle':b===12?'marais':'tempere';}
function civilianAppearance(game,n,provided){
 const seed=civilianHash(n.id),sex=provided?.sex||(n.id==='zahra'||n.id==='elyne'?'feminin':n.id.startsWith('relay-')||n.id.startsWith('courier-')?'masculin':seed%2?'feminin':'masculin');
 const biome=civilianBiome(game,n),outfits=Object.values(CIVILIAN_ART.outfits);
 let choices=outfits.filter(v=>v.sex===sex&&v.biome===biome&&!v.cut.startsWith('TR'));
 if(n.id==='elyne')choices=outfits.filter(v=>v.sex==='feminin'&&v.cut.startsWith('E'));
 if(n.id.startsWith('relay-')&&biome==='tempere'){
  const station=game.stations?.find(s=>s.actor===n),cut=station?.modes.includes('boat')?(seed%2?'TR03':'TR04'):station?.modes.includes('cart')&&seed%2?'TR02':'TR01';choices=outfits.filter(v=>v.cut===cut);
 }
 if(n.id.startsWith('courier-')&&biome==='tempere')choices=outfits.filter(v=>v.cut==='TR02');
 const requested=CIVILIAN_ART.outfits[provided?.outfit];
 const outfit=requested&&requested.sex===sex?requested:choices[seed%choices.length]||outfits.find(v=>v.sex===sex);
 const age=['adulte','mur','age'].includes(provided?.age)?provided.age:n.id==='veilleur'?'age':n.id==='elyne'?'adulte':seed%9===0?'age':seed%4===0?'mur':'adulte';
 const styles=outfit.cut.startsWith('E')?(sex==='feminin'?['07','08']:['06','14']):sex==='feminin'?['01','02','03','04','05']:['01','02','05','06','07','08','09','10','11','12','13','14'];
 const hair=styles.includes(provided?.hair)?provided.hair:styles[(seed>>>5)%styles.length];
 const color=age==='age'?'argente':Object.hasOwn(CIVILIAN_HAIR,provided?.color)?provided.color:Object.keys(CIVILIAN_HAIR)[(seed>>>9)%6];
 const allowedBeard=sex==='masculin';const validModule=(id,prefix)=>typeof id==='string'&&id.startsWith(prefix)&&CIVILIAN_ART.modules[id];
 const beard=allowedBeard&&(provided?.beard===null?null:validModule(provided?.beard,'B')?provided.beard:seed%3===0?'B0'+(1+(seed>>>12)%6):null);
 const moustache=allowedBeard&&(provided?.moustache===null?null:validModule(provided?.moustache,'M')?provided.moustache:seed%4===0?'M0'+(1+(seed>>>15)%5):null);
 return {sex,outfit:outfit.id,age,hair,color,beard:beard||null,moustache:moustache||null,hat:provided?.hat===null?null:outfit.hat||null};
}
function civilianFrame(clip,seconds,distance=0){const c=CIVILIAN_ART.clips[clip]||CIVILIAN_ART.clips.idle,total=c.durations.reduce((a,b)=>a+b,0);let ms=c.stride?((distance%c.stride+c.stride)%c.stride)/c.stride*total:Math.max(0,seconds)*1000;if(c.loop)ms%=total;else ms=Math.min(ms,total-1);for(let i=0;i<c.durations.length;i++){if(ms<c.durations[i])return i;ms-=c.durations[i];}return c.durations.length-1;}
class CivilianAtlas{
 constructor(){this.images=new Map();this.frames=new Map();}
 image(key,asset){let entry=this.images.get(key);if(entry){this.images.delete(key);this.images.set(key,entry);return entry;}const im=new Image();entry={image:im,ready:false};entry.promise=new Promise(resolve=>{im.onload=()=>{entry.ready=true;resolve(true);};im.onerror=()=>resolve(false);});im.src='data:image/png;base64,'+asset.png;this.images.set(key,entry);while(this.images.size>36)this.images.delete(this.images.keys().next().value);return entry;}
 async preload(a){const keys=[a.outfit,a.sex+'-'+a.age,a.sex+'-hair-'+a.hair,a.hat,a.beard,a.moustache].filter(Boolean);return Promise.all([...keys.map(k=>this.image(k,CIVILIAN_ART.outfits[k]?.asset||CIVILIAN_ART.modules[k]?.asset).promise),this.image(a.outfit+'-front',CIVILIAN_ART.outfits[a.outfit].foreground).promise]);}
 get(a,clip,dir,frame){
  const outfit=CIVILIAN_ART.outfits[a.outfit];if(!outfit)return null;if(!outfit.frames[clip]){clip='idle';frame=0;}
  const d=[2,1,0,3][dir??2],key=[a.outfit,a.age,a.hair,a.color,a.hat,a.beard,a.moustache,clip,d,frame].join(':');
  if(this.frames.has(key)){const v=this.frames.get(key);this.frames.delete(key);this.frames.set(key,v);return v;}
  const body=this.image(a.outfit,outfit.asset),foreground=this.image(a.outfit+'-front',outfit.foreground),moduleIds=[a.sex+'-'+a.age,a.sex+'-hair-'+a.hair,a.hat,a.beard,a.moustache].filter(Boolean),entries={};
  for(const id of moduleIds){const m=CIVILIAN_ART.modules[id];if(m)entries[id]=this.image(id,m.asset);}
  if(!body.ready||!foreground.ready||Object.values(entries).some(e=>!e.ready))return null;
  const cv=document.createElement('canvas');cv.width=cv.height=80;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  const stamp=(ctx,entry,asset,tile)=>{const i=asset.tiles[tile];ctx.drawImage(entry.image,(i%16)*48,Math.floor(i/16)*48,48,48,16,16,48,48);};
  const module=(id,plane=0,ctx=c)=>{const m=CIVILIAN_ART.modules[id];if(!m||!entries[id])return;const index=CIVILIAN_ART.moduleFrames[clip][d]+frame+plane*CIVILIAN_ART.moduleCount;stamp(ctx,entries[id],m.asset,index);};
  const hairId=a.sex+'-hair-'+a.hair;
  const hair=plane=>{
   const h=document.createElement('canvas');h.width=h.height=80;const hc=h.getContext('2d');module(hairId,plane,hc);
   if(a.hat){hc.globalCompositeOperation='destination-out';module(a.hat,2,hc);hc.globalCompositeOperation='source-over';}
   const source=CIVILIAN_HAIR.brun,target=CIVILIAN_HAIR[a.color]||source;
   if(a.color!=='brun'){const pixels=hc.getImageData(0,0,80,80),v=pixels.data,lookup=new Map(source.map((s,i)=>[parseInt(s,16),parseInt(target[i],16)]));for(let i=0;i<v.length;i+=4){if(!v[i+3])continue;const rgb=(v[i]<<16)|(v[i+1]<<8)|v[i+2],to=lookup.get(rgb);if(to!==undefined){v[i]=to>>16;v[i+1]=(to>>8)&255;v[i+2]=to&255;}}hc.putImageData(pixels,0,0);}c.drawImage(h,0,0);
  };
  hair(0);if(outfit.headFirst)module(a.sex+'-'+a.age);stamp(c,body,outfit.asset,outfit.frames[clip][d]+frame);hair(1);if(a.hat)module(a.hat,0);if(!outfit.headFirst)module(a.sex+'-'+a.age);stamp(c,foreground,outfit.foreground,outfit.frames[clip][d]+frame);
  for(const id of [a.beard,a.moustache])if(id){const h=document.createElement('canvas');h.width=h.height=80;const hc=h.getContext('2d');module(id,0,hc);const pixels=hc.getImageData(0,0,80,80),v=pixels.data,colors=CIVILIAN_HAIR[a.color];for(let i=0;i<v.length;i+=4){if(!v[i+3])continue;const rgb=((v[i]<<16)|(v[i+1]<<8)|v[i+2]).toString(16).padStart(6,'0'),slot=CIVILIAN_HAIR.brun.indexOf(rgb);if(slot>=0){const n=parseInt(colors[slot],16);v[i]=n>>16;v[i+1]=n>>8&255;v[i+2]=n&255;}}hc.putImageData(pixels,0,0);c.drawImage(h,0,0);}
  hair(2);if(a.hat)module(a.hat,1);
  this.frames.set(key,cv);while(this.frames.size>192)this.frames.delete(this.frames.keys().next().value);return cv;
 }
}
const CIVILIAN_BITMAPS=new CivilianAtlas();
const civilianOriginalDraw=Renderer.prototype.npcDraw;
Renderer.prototype.npcDraw=function(n){
 const a=n.civilian;if(!a)return civilianOriginalDraw.call(this,n);if((n.alpha??1)<=0||this.cam&&(n.x<this.cam.x-50||n.x>this.cam.x+this.W+50))return;
 const state=a.action||'idle',frame=civilianFrame(state,a.elapsed||0,a.distance||0),im=CIVILIAN_BITMAPS.get(a.appearance,state,n.dir??2,frame);
 if(!im)return civilianOriginalDraw.call(this,n);
 const c=this.c,g=this.g;c.save();c.globalAlpha=n.alpha??1;this.shadow(n.x,n.y,a.dead?17:12);c.drawImage(im,Math.round(n.x)-40,Math.round(n.y)-52);n._img=im;
 if(!a.dead){text(c,n.label,n.x-Math.round(textW(c,n.label)/2),n.y-32,'#dfc889');const m=g.npcPresent(n)&&g.npcMark(n);if(m)this.questMark(n.x,n.y-38-Math.max(0,(textSettings.scale-1)*8),m);}
 if(n.id==='elyne'&&g.story.recruited&&!g.story.delivered&&g.companion.hp<10){box(c,n.x-10,n.y-39,20,2,'#34252c');box(c,n.x-10,n.y-39,2*g.companion.hp,2,'#be807b');}c.restore();
};
