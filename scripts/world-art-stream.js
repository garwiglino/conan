/* Prefetch native terrain off the main thread. The exact same renderer is used
 * for the first visible sector and the worker, so completion never repaints a
 * different quality level. 32 images + at most 8 pending jobs, at any distance.
 */
function worldArtWorkerSource(){return '"use strict";const createWorldAtlas='+createWorldAtlas.toString()+';const createWorldTerrainArt='+createWorldTerrainArt.toString()+`;let art=null;
 onmessage=function(e){const m=e.data;if(m.kind==='init'){art=createWorldTerrainArt(createWorldAtlas(m.raw),m.ramps);postMessage({kind:'ready'});return;}if(!art||m.kind!=='render')return;const image=art.render(m.cx*512,m.cy*512,512,512,m.clock??480);postMessage({key:m.key,clock:m.clock??480,width:image.width,height:image.height,data:image.data},[image.data.buffer]);};`;}
function WorldArtStream(cache,makeCanvas,environment=globalThis){
 this.clock=480;this.setClock=clock=>{if(clock!==this.clock){this.clock=clock;cache.clear();this.pending.clear();}};this.cache=cache;this.pending=new Set();this.worker=null;this.failed=false;
 const put=(key,data,width,height)=>{if(this.cache.has(key))return;const cv=makeCanvas();cv.width=width;cv.height=height;const c=cv.getContext('2d'),im=c.createImageData(width,height);im.data.set(data);c.putImageData(im,0,0);this.cache.set(key,cv);while(this.cache.size>32)this.cache.delete(this.cache.keys().next().value);};
 if(typeof environment.Worker!=='function'||typeof environment.Blob!=='function'||!environment.URL?.createObjectURL)return;
 let url;
 const release=()=>{if(url){environment.URL.revokeObjectURL(url);url=null;}};
 try{url=environment.URL.createObjectURL(new environment.Blob([worldArtWorkerSource()],{type:'text/javascript'}));this.worker=new environment.Worker(url);this.worker.onmessage=e=>{const m=e.data;if(m.kind==='ready'){release();return;}if((m.clock??480)!==this.clock)return;this.pending.delete(m.key);put(m.key,m.data,m.width,m.height);};this.worker.onerror=()=>{release();this.failed=true;this.pending.clear();this.worker?.terminate();this.worker=null;};this.worker.postMessage({kind:'init',raw:Atlas.raw,ramps:RAMP});}
 catch(e){release();this.failed=true;this.worker?.terminate();this.worker=null;}
 this.prefetch=(cx,cy)=>{if(!this.worker)return;const jobs=[];for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const key=x+','+y;if(!cache.has(key)&&!this.pending.has(key))jobs.push({kind:'render',key,clock:this.clock,cx:x,cy:y,d:Math.hypot(x-cx,y-cy)});}jobs.sort((a,b)=>a.d-b.d);for(const job of jobs){if(this.pending.size>=8)break;this.pending.add(job.key);this.worker.postMessage(job);}};
}
