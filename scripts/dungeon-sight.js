// Exact logical-space sight tests. Rendered wall transparency never affects vision.
const DungeonSight=(()=>{
 function box(a,b,x0,y0,x1,y1){let lo=0,hi=1;for(const [p,d,min,max]of [[a.x,b.x-a.x,x0,x1],[a.y,b.y-a.y,y0,y1]]){if(Math.abs(d)<1e-10){if(p<min||p>max)return false;}else{const t=(min-p)/d,u=(max-p)/d;lo=Math.max(lo,Math.min(t,u));hi=Math.min(hi,Math.max(t,u));if(lo>hi)return false;}}return hi>1e-7&&lo<1-1e-7;}
 function visible(g,a,b){if(!g.sameLevel(a,b))return false;const F=FirstDungeon,e=F.current(g),s=F.state(g),floor=(x,y)=>e.plan[Math.floor(y/32)]?.[Math.floor(x/32)]&&e.plan[Math.floor(y/32)][Math.floor(x/32)]!=='#';
  if(!floor(a.x,a.y)||!floor(b.x,b.y))return false;
  // Traverse every grid boundary and check both sides of an exact corner.
  const dx=b.x-a.x,dy=b.y-a.y,ts=[0,1];for(const [v,d]of [[a.x,dx],[a.y,dy]])if(d){for(let k=Math.floor(Math.min(v,v+d)/32)+1;k*32<Math.max(v,v+d);k++)ts.push((k*32-v)/d);}ts.sort((x,y)=>x-y);
  for(let i=0;i<ts.length;i++){const t=ts[i],x=a.x+dx*t,y=a.y+dy*t;if(!floor(x,y))return false;if(i&& !floor(a.x+dx*(t+ts[i-1])/2,a.y+dy*(t+ts[i-1])/2))return false;
   if(i>0&&i<ts.length-1&&Math.abs(x/32-Math.round(x/32))<1e-8&&Math.abs(y/32-Math.round(y/32))<1e-8&&(!floor(x-.001,y+.001)||!floor(x+.001,y-.001)||!floor(x-.001,y-.001)||!floor(x+.001,y+.001)))return false;
  }
  for(const [key,n]of Object.entries(e.murs)){if(!F.blocks(g,key,n))continue;const q=F.edge(key);if(box(a,b,q.x-(q.o==='N'?16:3),q.y-(q.o==='O'?16:3),q.x+(q.o==='N'?16:3),q.y+(q.o==='O'?16:3)))return false;}
  for(const c of s.crates)if(box(a,b,c.x-9,c.y-9,c.x+9,c.y+9))return false;
  for(const [i,[n,x,y]]of e.objets.entries())if(!s.props?.[i]?.broken&&/^(pilier-rond|pilier-carre|table|marmite|trone|totem|caisses)$/.test(n)&&box(a,b,x*32-7,y*32-5,x*32+7,y*32+5))return false;
  return true;
 }
 const line=Game.prototype.lineClear;Game.prototype.lineClear=function(a,b){return this.dungeon?.active?visible(this,a,b):line.call(this,a,b);};
 return {visible,box};
})();
