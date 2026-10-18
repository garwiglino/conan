/* Bounded streaming cache: keep old art visible until its replacement is ready. */
function worldArtWorkerSource(){
 const pacing='{'+Object.entries(WorldPacing).map(([key,value])=>typeof value==='function'?value.toString():JSON.stringify(key)+':'+JSON.stringify(value)).join(',')+'}';
 return '"use strict";const WorldPacing='+pacing+';const createWorldAtlas='+createWorldAtlas.toString()+';const createWorldTerrainArt='+createWorldTerrainArt.toString()+`;let art=null;
 onmessage=function(e){const m=e.data;if(m.kind==='init'){art=createWorldTerrainArt(createWorldAtlas(m.raw),m.ramps);postMessage({kind:'ready'});return;}if(!art||m.kind!=='render')return;const image=art.render(m.cx*512,m.cy*512,512,512,m.clock??480);postMessage({key:m.key,clock:m.clock??480,snowKey:m.snowKey,cx:m.cx,cy:m.cy,width:image.width,height:image.height,data:image.data},[image.data.buffer]);};`;}
function WorldArtStream(cache,makeCanvas,environment=globalThis){
 this.clock=480;this.cache=cache;this.pending=new Set();this.jobs=new Map();this.worker=null;this.failed=false;
 this.setClock=clock=>{this.clock=clock;};
 this.current=(key,cx,cy)=>{const cv=cache.get(key);return cv&&cv.snowKey===Atlas.chunkSnowKey(cx,cy,this.clock);};
 const put=(key,data,width,height,snowKey)=>{const cv=makeCanvas();cv.width=width;cv.height=height;cv.snowKey=snowKey;const c=cv.getContext('2d'),im=c.createImageData(width,height);im.data.set(data);c.putImageData(im,0,0);cv.trackColors=terrainTrackColors(data,width,height);cache.set(key,cv);while(cache.size>32)cache.delete(cache.keys().next().value);};
 if(typeof environment.Worker!=='function'||typeof environment.Blob!=='function'||!environment.URL?.createObjectURL)return;
 let url;const release=()=>{if(url){environment.URL.revokeObjectURL(url);url=null;}};
 try{url=environment.URL.createObjectURL(new environment.Blob([worldArtWorkerSource()],{type:'text/javascript'}));this.worker=new environment.Worker(url);this.worker.onmessage=e=>{const m=e.data;if(m.kind==='ready'){release();return;}
 const job=this.jobs.get(m.key);if(job&&job.clock===(m.clock??480)){this.pending.delete(m.key);this.jobs.delete(m.key);}
 const valid=m.snowKey!==undefined?m.snowKey===Atlas.chunkSnowKey(m.cx,m.cy,this.clock):(m.clock??480)===this.clock;
 if(!valid)return;put(m.key,m.data,m.width,m.height,m.snowKey);
 };this.worker.onerror=()=>{release();this.failed=true;this.pending.clear();this.jobs.clear();this.worker?.terminate();this.worker=null;};this.worker.postMessage({kind:'init',raw:Atlas.raw,ramps:RAMP});}
 catch(e){release();this.failed=true;this.worker?.terminate();this.worker=null;}
 this.request=(cx,cy)=>{const key=cx+','+cy;if(!this.worker||this.pending.size>=8||this.pending.has(key)||this.current(key,cx,cy))return;const job={kind:'render',key,clock:this.clock,snowKey:Atlas.chunkSnowKey(cx,cy,this.clock),cx,cy};this.pending.add(key);this.jobs.set(key,job);this.worker.postMessage(job);};
 this.prefetch=(cx,cy)=>{if(!this.worker)return;const jobs=[];for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)jobs.push({x,y,d:Math.hypot(x-cx,y-cy)});jobs.sort((a,b)=>a.d-b.d);for(const j of jobs){if(this.pending.size>=8)break;this.request(j.x,j.y);}};
}
