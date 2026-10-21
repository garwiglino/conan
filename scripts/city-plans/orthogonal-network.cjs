'use strict';
const EPS=1e-6,key=p=>p.map(v=>Math.round(v*1e6)).join(','),length=points=>points.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-points[i][0],p[1]-points[i][1]),0);
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function hits(a,b,c,d){
 const r=sub(b,a),s=sub(d,c),den=cross(r,s),ca=sub(c,a),rr=r[0]*r[0]+r[1]*r[1];if(rr<EPS)return[];
 if(Math.abs(den)>EPS){const t=cross(ca,s)/den,u=cross(ca,r)/den;return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?[[a[0]+t*r[0],a[1]+t*r[1]]]:[];}
 if(Math.abs(cross(ca,r))>EPS)return[];
 const on=p=>{const t=((p[0]-a[0])*r[0]+(p[1]-a[1])*r[1])/rr;return t>=-EPS&&t<=1+EPS;};
 return[c,d].filter(on).concat([a,b].filter(p=>{const ss=s[0]*s[0]+s[1]*s[1],t=ss?((p[0]-c[0])*s[0]+(p[1]-c[1])*s[1])/ss:2;return t>=-EPS&&t<=1+EPS;}));
}
function compact(points){const out=[];for(const p of points){if(out.length&&Math.hypot(p[0]-out.at(-1)[0],p[1]-out.at(-1)[1])<EPS)continue;while(out.length>1){const a=out.at(-2),b=out.at(-1);if(Math.abs(cross(sub(b,a),sub(p,b)))>EPS||(b[0]-a[0])*(p[0]-b[0])+(b[1]-a[1])*(p[1]-b[1])<0)break;out.pop();}out.push(p.slice());}return out;}
function graph(routes){
 const segments=[];for(const route of routes)for(let i=1;i<route.points.length;i++){const a=route.points[i-1],b=route.points[i];if(length([a,b])>EPS)segments.push({route:route.id,part:i-1,width:route.width,a,b,cuts:[a,b]});}
 for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){const a=segments[i],b=segments[j],points=hits(a.a,a.b,b.a,b.b);a.cuts.push(...points);b.cuts.push(...points);}
 const nodes=new Map(),edges=new Map(),parts=new Map();
 for(const s of segments){const dir=sub(s.b,s.a),den=dir[0]**2+dir[1]**2;s.cuts.sort((a,b)=>((a[0]-b[0])*dir[0]+(a[1]-b[1])*dir[1])/den);const cuts=[...new Map(s.cuts.map(p=>[key(p),p])).values()],list=[];for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],u=key(a),v=key(b);if(u===v)continue;for(const [id,p]of [[u,a],[v,b]])if(!nodes.has(id))nodes.set(id,{id,point:p.slice(),edges:[]});const id=[u,v].sort().join('/');let edge=edges.get(id);if(!edge){edge={id,u,v,referenceLengthM:length([a,b]),width:s.width,sources:[]};edges.set(id,edge);nodes.get(u).edges.push(id);nodes.get(v).edges.push(id);}edge.width=Math.max(edge.width,s.width);edge.sources.push(s.route);list.push({id,forward:edge.u===u});}parts.set(s.route+':'+s.part,list);}
 return{nodes,edges,parts};
}
function axisAligned(points){return points.slice(1).every((p,i)=>Math.abs(p[0]-points[i][0])<EPS||Math.abs(p[1]-points[i][1])<EPS);}
function build(routes,{valid=()=>true,sampleStep=3,offsets=[0,-8,8,-16,16,-32,32]}={}){
 const g=graph(routes),placed=[];
 const near=(p,a,b)=>{const d=sub(b,a),q=d[0]**2+d[1]**2,t=q?Math.max(0,Math.min(1,((p[0]-a[0])*d[0]+(p[1]-a[1])*d[1])/q)):0;return Math.hypot(p[0]-a[0]-t*d[0],p[1]-a[1]-t*d[1]);};
 for(const e of [...g.edges.values()].sort((a,b)=>b.width-a.width||b.referenceLengthM-a.referenceLengthM||a.id.localeCompare(b.id))){
  const a=g.nodes.get(e.u).point,b=g.nodes.get(e.v).point,p=a,q=b,candidates=[];
  const add=middle=>{const pts=compact([a,p,...middle,q,b]);if(axisAligned(pts))candidates.push(pts);};add([[p[0],q[1]]]);add([[q[0],p[1]]]);
  for(const d of offsets){const x=(p[0]+q[0])/2+d,y=(p[1]+q[1])/2+d;add([[x,p[1]],[x,q[1]]]);add([[p[0],y],[q[0],y]]);}
  let best,bestScore=Infinity;
  for(const points of candidates){let bad=false,score=length(points)+(points.length-2)*12;for(let i=1;i<points.length;i++)for(let j=i+2;j<points.length;j++)if(hits(points[i-1],points[i],points[j-1],points[j]).length)bad=true;for(let i=1;i<points.length;i++){const u=points[i-1],v=points[i],n=Math.max(1,Math.ceil(length([u,v])/sampleStep));for(let k=0;k<=n;k++){const t=k/n,z=[u[0]+(v[0]-u[0])*t,u[1]+(v[1]-u[1])*t];if(!valid(z,e.width,e)){bad=true;break;}score+=near(z,a,b)*.03;}if(bad)break;for(const old of placed){if(old.edge.u===e.u||old.edge.u===e.v||old.edge.v===e.u||old.edge.v===e.v)continue;for(let j=1;j<old.points.length;j++)score+=hits(u,v,old.points[j-1],old.points[j]).length*250;}}
   if(!bad&&score<bestScore){best=points;bestScore=score;}
  }
  if(!best)throw Error('No dry orthogonal route for edge '+e.id);e.points=best;e.physicalLengthM=length(best);placed.push({edge:e,points:best});
 }
 const converted=routes.map(route=>{const points=[];for(let i=1;i<route.points.length;i++)for(const part of g.parts.get(route.id+':'+(i-1))||[]){const e=g.edges.get(part.id),pts=part.forward?e.points:e.points.slice().reverse();points.push(...pts);}const result=compact(points);return{...route,points:result,orthogonal:true,referenceLengthM:length(route.points),physicalLengthM:length(result),distancePolicy:'reference_and_geometry_separate_no_speed_compensation'};});
 return{routes:converted,nodes:[...g.nodes.values()],edges:[...g.edges.values()],summary:{sourceRoutes:routes.length,convertedRoutes:converted.length,sourceNodes:g.nodes.size,sourceEdges:g.edges.size,referenceLengthM:routes.reduce((n,r)=>n+length(r.points),0),physicalLengthM:converted.reduce((n,r)=>n+r.physicalLengthM,0),allAxisAligned:converted.every(r=>axisAligned(r.points)),allEndpointsPreserved:converted.every((r,i)=>key(r.points[0])===key(routes[i].points[0])&&key(r.points.at(-1))===key(routes[i].points.at(-1))),metric:'original lengths retained as reference; physical detours reported explicitly'}};
}
function rect(a,b,width){if(!axisAligned([a,b]))throw Error('Non-cardinal road');return{x:Math.min(a[0],b[0])-width/2,y:Math.min(a[1],b[1])-width/2,w:Math.abs(b[0]-a[0])+width,h:Math.abs(b[1]-a[1])+width};}
module.exports={build,graph,hits,compact,length,axisAligned,key,rect};
