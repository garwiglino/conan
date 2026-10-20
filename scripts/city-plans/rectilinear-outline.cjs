'use strict';
// Exact boundary of an orthogonal collection, without a rectangular bounding-box fill.
function outline(rects){
 const xs=[...new Set(rects.flatMap(r=>[r.x,r.x+r.w]))].sort((a,b)=>a-b),ys=[...new Set(rects.flatMap(r=>[r.y,r.y+r.h]))].sort((a,b)=>a-b),edges=new Map(),key=p=>p.join(',');
 const add=(a,b)=>{const reverse=key(b)+'>'+key(a);if(edges.has(reverse))edges.delete(reverse);else edges.set(key(a)+'>'+key(b),{a,b});};
 for(let y=1;y<ys.length;y++)for(let x=1;x<xs.length;x++)if(rects.some(r=>xs[x-1]>=r.x&&xs[x]<=r.x+r.w&&ys[y-1]>=r.y&&ys[y]<=r.y+r.h)){
  const a=[xs[x-1],ys[y-1]],b=[xs[x],ys[y-1]],c=[xs[x],ys[y]],d=[xs[x-1],ys[y]];add(a,b);add(b,c);add(c,d);add(d,a);
 }
 const outgoing=new Map();for(const e of edges.values()){const k=key(e.a);if(!outgoing.has(k))outgoing.set(k,[]);outgoing.get(k).push(e);}
 const rings=[];while(edges.size){const first=edges.values().next().value,ring=[];let e=first;
  do{ring.push(e.a);edges.delete(key(e.a)+'>'+key(e.b));if(key(e.b)===key(first.a))break;e=(outgoing.get(key(e.b))||[]).find(q=>edges.has(key(q.a)+'>'+key(q.b)));if(!e)throw Error('Open rectilinear boundary');}while(true);
  rings.push(ring.filter((p,i)=>{const a=ring[(i+ring.length-1)%ring.length],b=ring[(i+1)%ring.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);}));
 }return rings;
}
module.exports={outline};
