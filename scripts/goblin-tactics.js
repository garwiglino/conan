// Dungeon squad decisions are transient: no stale paths or attack reservations in saves.
const GoblinTactics=(()=>{
 const games=new WeakMap(),length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function clear(g,a,b,r=6){const d=length(a,b),n=Math.ceil(d/5);for(let i=1;i<=n;i++)if(g.solid(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;}
 function state(g){let s=games.get(g);if(!s||s.floor!==g.dungeon.floor||s.enemies!==g.enemies){s={floor:g.dungeon.floor,enemies:g.enemies,actors:new Map(),nextStrike:0};games.set(g,s);}return s;}
 function reset(g){games.delete(g);}
 function plan(g,dt){
  const s=state(g),p=g.player,now=g.time,live=g.enemies.filter(e=>!e.dead&&(!e.chief||g.dungeon.bossFight));
  const visible=live.filter(e=>length(e,p)<150&&g.lineClear(e,p));
  for(const e of live){let m=s.actors.get(e);if(!m){m={until:0,slot:null,route:[],repath:0};s.actors.set(e,m);}
   // Alerts need an unoccluded nearby witness; nobody sees through a closed door.
   const sees=visible.includes(e),witness=visible.find(a=>length(a,e)<100&&g.lineClear(a,e));
   if(sees||witness){m.until=now+2.8;m.last={x:p.x,y:p.y};}m.sees=sees;
  }
  const active=live.filter(e=>s.actors.get(e).until>now&&length(e,p)<210),group=active.filter(e=>s.actors.get(e).sees),used=new Set();
  // Stable world-space sectors do not spin when the player changes facing.
  for(const e of group){const m=s.actors.get(e);if(m.slot!==null&&!used.has(m.slot))used.add(m.slot);else m.slot=null;}
  for(const e of group){const m=s.actors.get(e);if(m.slot===null){let best=Infinity;for(let i=0;i<8;i++)if(!used.has(i)){const q={x:p.x+Math.cos(i*Math.PI/4)*34,y:p.y+Math.sin(i*Math.PI/4)*34},score=length(e,q)+(g.solid(q.x,q.y,e.r||6)?80:0);if(score<best){best=score;m.slot=i;}}if(m.slot!==null)used.add(m.slot);}}
  const candidates=group.filter(e=>e.stun<=0&&!Number.isFinite(e.swingElapsed)&&e.cooldown<=.15).sort((a,b)=>length(a,p)-length(b,p)||String(a.id).localeCompare(String(b.id)));
  const pressing=new Set(candidates.slice(0,2));
  return {s,active,group,pressing,now};
 }
 function goal(g,e,plan){const m=plan.s.actors.get(e);if(!plan.active.includes(e))return null;
  if(!m.sees)return m.last;
  if(plan.group.length<2||plan.pressing.has(e))return g.player;
  const angle=(m.slot||0)*Math.PI/4,radius=e.cooldown>.2?38:30,q={x:g.player.x+Math.cos(angle)*radius,y:g.player.y+Math.sin(angle)*radius};
  // A narrow corridor wins over formation. Do not walk into a wall to fill a slot.
  return g.solid(q.x,q.y,e.r||6)?g.player:q;
 }
 function canStrike(g,e,p){return p.s.actors.get(e)?.sees&&p.now>=p.s.nextStrike&&g.enemies.filter(a=>!a.dead&&a.stun<=0&&Number.isFinite(a.swingElapsed)).length<2;}
 function reserve(p){p.s.nextStrike=p.now+.32;}
 function waypoint(g,e,target,m){
  if(clear(g,e,target,e.r||6)){m.route=[];return target;}
  if(g.time>=m.repath){
   m.repath=g.time+.55;m.route=[];
   // Bounded 16px breadth-first search; collision probes include doors and crates.
   const step=16,key=(x,y)=>x+','+y,start={x:e.x,y:e.y,parent:null},queue=[start],seen=new Set([key(0,0)]);let best=start,bestD=length(start,target);
   for(let n=0;n<queue.length&&n<240;n++){const a=queue[n],d=length(a,target);if(d<bestD){best=a;bestD=d;}if(d<20&&clear(g,a,target,e.r||6)){best=a;break;}
    for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const x=a.x+dx,y=a.y+dy,k=key(Math.round((x-e.x)/step),Math.round((y-e.y)/step));if(seen.has(k))continue;seen.add(k);const b={x,y,parent:a};if(!clear(g,a,b,e.r||6))continue;queue.push(b);}
   }
   for(let a=best;a.parent;a=a.parent)m.route.unshift({x:a.x,y:a.y});
  }
  while(m.route.length&&length(e,m.route[0])<4)m.route.shift();return m.route[0]||null;
 }
 function move(g,e,target,plan,dt){
  const m=plan.s.actors.get(e);if(!target||length(e,target)<3)return;const q=waypoint(g,e,target,m);if(!q)return;
  let dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy);if(d<.01)return;dx/=d;dy/=d;
  // Separate rigid bodies without changing their art or rotating a committed strike.
  for(const a of plan.active)if(a!==e){const n=length(a,e),r=(a.r||6)+(e.r||6)+5;if(n<r&&n>.01){dx+=(e.x-a.x)/n*(r-n)/r*1.6;dy+=(e.y-a.y)/n*(r-n)/r*1.6;}}
  const n=Math.hypot(dx,dy)||1,speed=e.chief?25:plan.group.length>1?31:26,amount=Math.min(speed*dt,d),ox=e.x,oy=e.y;
  g.move(e,dx/n*amount,dy/n*amount);const moved=Math.hypot(e.x-ox,e.y-oy);e.moving=moved>.001;if(e.moving){e.dir=g.direction(e.x-ox,e.y-oy);e.anim=(e.anim||0)+moved/5.5;}
 }
 return {plan,goal,canStrike,reserve,move,reset};
})();
