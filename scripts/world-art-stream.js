/* Bounded streaming cache: keep old art visible until its replacement is ready. */
function worldArtWorkerSource(){
 const pacing='{'+Object.entries(WorldPacing).map(([key,value])=>typeof value==='function'?value.toString():JSON.stringify(key)+':'+JSON.stringify(value)).join(',')+'}';
 return '"use strict";const WorldPacing='+pacing+';const createWorldAtlas='+createWorldAtlas.toString()+';const createWorldTerrainArt='+createWorldTerrainArt.toString()+`;let art=null;
 onmessage=function(e){const m=e.data;if(m.kind==='init'){art=createWorldTerrainArt(createWorldAtlas(m.raw),m.ramps);postMessage({kind:'ready'});return;}if(!art||m.kind!=='render')return;const image=art.render(m.cx*512,m.cy*512,512,512,m.clock??480);postMessage({key:m.key,clock:m.clock??480,snowKey:m.snowKey,cx:m.cx,cy:m.cy,width:image.width,height:image.height,data:image.data},[image.data.buffer]);};`;}
function WorldArtStream(cache,makeCanvas,environment=globalThis,terrainArt=WorldTerrainArt,workerSource=worldArtWorkerSource){
 this.clock=480;this.cache=cache;this.pending=new Set();this.jobs=new Map();this.worker=null;this.failed=false;this.running=null;this.wanted=null;
 const now=()=>environment.performance?.now?.()??Date.now(),later=fn=>(environment.setTimeout||globalThis.setTimeout)(fn,0);
 this.setClock=clock=>{this.clock=clock;};
 this.current=(key,cx,cy)=>{const cv=cache.get(key);return cv&&!cv.preview&&cv.snowKey===Atlas.chunkSnowKey(cx,cy,this.clock);};
 const put=(job,image)=>{if(this.wanted&&!this.wanted.has(job.key)||job.snowKey!==Atlas.chunkSnowKey(job.cx,job.cy,this.clock)||image.clock!==undefined&&image.snowKey===undefined&&image.clock!==this.clock)return;
  const cv=makeCanvas();cv.width=image.width;cv.height=image.height;cv.snowKey=job.snowKey;const c=cv.getContext('2d'),im=c.createImageData(image.width,image.height);im.data.set(image.data);c.putImageData(im,0,0);cv.trackColors=terrainTrackColors(image.data,image.width,image.height);
  if(image.features)cv.features=image.features.map(f=>{const canvas=makeCanvas();canvas.width=f.width;canvas.height=f.height;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(f.width,f.height);pixels.data.set(f.data);ctx.putImageData(pixels,0,0);return {canvas,x:f.x,y:f.y,depth:f.depth};});
  cache.set(job.key,cv);while(cache.size>16)cache.delete(cache.keys().next().value);
 };
 const finish=()=>{if(this.running){this.pending.delete(this.running.key);this.jobs.delete(this.running.key);}this.running=null;};
 this.pumpFallback=()=>{
  this.scheduled=false;if(this.worker)return;const job=this.running;if(!job){pump();return;}
  if(this.wanted&&!this.wanted.has(job.key)||job.snowKey!==Atlas.chunkSnowKey(job.cx,job.cy,this.clock)){finish();pump();return;}
  job.steps||=terrainArt.renderSteps(job.cx*512,job.cy*512,512,512,job.clock);
  const start=now();let next;for(let i=0;i<4;i++){next=job.steps.next();if(next.done){put(job,next.value);finish();break;}if(now()-start>=4)break;}
  pump();
 };
 const pump=()=>{
  if(!this.running){const job=this.jobs.values().next().value;if(!job)return;job.clock=this.clock;job.snowKey=Atlas.chunkSnowKey(job.cx,job.cy,this.clock);this.running=job;if(this.worker){this.worker.postMessage(job);return;}}
  if(!this.worker&&!this.scheduled){this.scheduled=true;later(this.pumpFallback);}
 };
 this.focus=(cx,cy,visible=[])=>{const wanted=new Set(visible.map(p=>p[0]+','+p[1]));for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)wanted.add(x+','+y);this.wanted=wanted;
  for(const [key,job]of this.jobs)if(job!==this.running&&!wanted.has(key)){this.jobs.delete(key);this.pending.delete(key);}
  if(!this.worker&&this.running&&!wanted.has(this.running.key))finish();
 };
 this.request=(cx,cy)=>{const key=cx+','+cy;if(this.pending.size>=8||this.pending.has(key)||this.current(key,cx,cy))return;const job={kind:'render',key,clock:this.clock,cx,cy};this.pending.add(key);this.jobs.set(key,job);pump();};
 this.prefetch=(cx,cy)=>{const jobs=[];for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)jobs.push({x,y,d:Math.hypot(x-cx,y-cy)});jobs.sort((a,b)=>a.d-b.d);for(const j of jobs){if(this.pending.size>=8)break;this.request(j.x,j.y);}};
 if(typeof environment.Worker!=='function'||typeof environment.Blob!=='function'||!environment.URL?.createObjectURL)return;
 let url;const release=()=>{if(url){environment.URL.revokeObjectURL(url);url=null;}};
 try{url=environment.URL.createObjectURL(new environment.Blob([workerSource()],{type:'text/javascript'}));this.worker=new environment.Worker(url);this.worker.onmessage=e=>{const m=e.data;if(m.kind==='ready'){release();return;}const job=this.running;if(!job||job.key!==m.key||job.clock!==(m.clock??480))return;put(job,m);finish();pump();};
  this.worker.onerror=()=>{release();this.failed=true;this.worker?.terminate();this.worker=null;/* Resume the same requested pixels incrementally on the main thread. */pump();};this.worker.postMessage({kind:'init',raw:Atlas.raw,ramps:RAMP});
 }catch(e){release();this.failed=true;this.worker?.terminate();this.worker=null;}
}
