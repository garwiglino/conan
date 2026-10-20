'use strict';
// Authoring only: reserve a continuous two-metre path from each facade apron.
function build(plan,Atlas){
 const O=require('./orthogonal-network.cjs'),step=.5,radius=1,all=plan.buildings.flatMap(b=>[[b.foot.x,b.foot.y],[b.foot.x+b.foot.w,b.foot.y+b.foot.h]]).concat(plan.streets.flatMap(s=>s.points));
 const x0=Math.floor(Math.min(...all.map(p=>p[0]))-25),y0=Math.floor(Math.min(...all.map(p=>p[1]))-25),width=Math.ceil((Math.max(...all.map(p=>p[0]))+25-x0)/step)+1,height=Math.ceil((Math.max(...all.map(p=>p[1]))+25-y0)/step)+1,n=width*height,blocked=new Uint8Array(n),parent=new Uint8Array(n),distance=new Uint32Array(n),queue=new Int32Array(n);
 const index=(x,y)=>Math.round((y-y0)/step)*width+Math.round((x-x0)/step),point=i=>[x0+(i%width)*step,y0+Math.floor(i/width)*step];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if([3,8].includes(Atlas.terrain(Math.floor(plan.anchor.x+x0+x*step),Math.floor(plan.anchor.y+y0+y*step))))blocked[y*width+x]=1;
 for(const b of plan.buildings){const f=b.foot,ix0=Math.max(0,Math.ceil((f.x-radius-x0)/step)),ix1=Math.min(width-1,Math.floor((f.x+f.w+radius-x0)/step)),iy0=Math.max(0,Math.ceil((f.y-radius-y0)/step)),iy1=Math.min(height-1,Math.floor((f.y+f.h+radius-y0)/step));for(let y=iy0;y<=iy1;y++)blocked.fill(1,y*width+ix0,y*width+ix1+1);}
 let head=0,tail=0;
 for(const s of plan.streets)for(let i=1;i<s.points.length;i++){const a=s.points[i-1],b=s.points[i],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/step);for(let k=0;k<=count;k++){const t=k/count,j=index(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t);if(!blocked[j]&&!parent[j]){parent[j]=5;queue[tail++]=j;}}}
 while(head<tail){const i=queue[head++],x=i%width;for(const [j,back]of [[x>0?i-1:-1,2],[x<width-1?i+1:-1,1],[i>=width?i-width:-1,4],[i<n-width?i+width:-1,3]])if(j>=0&&!blocked[j]&&!parent[j]){parent[j]=back;distance[j]=distance[i]+1;queue[tail++]=j;}}
 const houseIndex=new Map();for(const b of plan.buildings){const f=b.foot;for(let y=Math.floor((f.y-radius)/16);y<=Math.floor((f.y+f.h+radius)/16);y++)for(let x=Math.floor((f.x-radius)/16);x<=Math.floor((f.x+f.w+radius)/16);x++){const key=x+','+y;if(!houseIndex.has(key))houseIndex.set(key,[]);houseIndex.get(key).push(b);}}
 const intersects=(a,b,f)=>{let lo=0,hi=1;for(const [p,d,min,max]of [[a[0],b[0]-a[0],f.x-radius+1e-7,f.x+f.w+radius-1e-7],[a[1],b[1]-a[1],f.y-radius+1e-7,f.y+f.h+radius-1e-7]]){if(!d){if(p<min||p>max)return false;}else{const u=(min-p)/d,v=(max-p)/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(lo>hi)return false;}}return lo<=hi;};
 const exactClear=(a,b)=>{const checked=new Set();for(let y=Math.floor(Math.min(a[1],b[1])/16);y<=Math.floor(Math.max(a[1],b[1])/16);y++)for(let x=Math.floor(Math.min(a[0],b[0])/16);x<=Math.floor(Math.max(a[0],b[0])/16);x++)for(const h of houseIndex.get(x+','+y)||[]){if(checked.has(h.uid))continue;checked.add(h.uid);if(intersects(a,b,h.foot))return false;}return true;};
 const join=(a,b)=>{for(const bend of [[a[0],b[1]],[b[0],a[1]]])if(exactClear(a,bend)&&exactClear(bend,b))return O.compact([a,bend,b]);return null;};
 const closestStreet=p=>{let best;for(const s of plan.streets)for(let i=1;i<s.points.length;i++){const q=Atlas.project(...p,s.points[i-1],s.points[i]);if(!best||q.d<best.d)best=q;}return[best.x,best.y];};
 const walkways=[],unreachable=[];
 for(const b of plan.buildings){const f=b.foot,p=b.portal,apron=[p.nx<0?f.x-1.5:p.nx>0?f.x+f.w+1.5:p.x,p.ny<0?f.y-1.5:p.ny>0?f.y+f.h+1.5:p.y];b.apron={x:apron[0],y:apron[1]};let at=index(...apron);
  const options=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const j=at+dy*width+dx;if(j>=0&&j<n&&parent[j]&&join(apron,point(j)))options.push(j);}options.sort((a,b)=>Math.hypot(...point(a).map((v,i)=>v-apron[i]))-Math.hypot(...point(b).map((v,i)=>v-apron[i])));
  if(!options.length){unreachable.push(b.uid);continue;}at=options[0];
  const raw=join(apron,point(at));let guard=0,lastDirection=p.nx?Math.sign(p.nx):p.ny?Math.sign(p.ny)*width:0;
  while(parent[at]!==5&&guard++<n){const x=at%width,choices=[x>0?-1:0,x<width-1?1:0,at>=width?-width:0,at<n-width?width:0].filter(d=>d&&parent[at+d]&&distance[at+d]+1===distance[at]);const delta=choices.includes(lastDirection)?lastDirection:choices.find(d=>d===[0,-1,1,-width,width][parent[at]])||choices[0];at+=delta;lastDirection=delta;raw.push(point(at));}
  const end=join(raw.at(-1),closestStreet(raw.at(-1)));if(!end){unreachable.push(b.uid);continue;}raw.push(...end.slice(1));
  const points=O.compact(raw);
  walkways.push({id:'walk-'+b.uid,building:b.uid,width:2,points,threshold:{width:Math.min(1,b.id==='B05'?1:.875),points:[[b.entrance.x,b.entrance.y],apron]}});
 }
 return{walkways,unreachable,step};
}
module.exports={build};
