// Dungeon squad decisions are transient: no stale paths or attack reservations in saves.
const GoblinTactics=(()=>{
 const games=new WeakMap(),length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const screen=v=>WorldProjection.point(v.x,v.y),angle=(a,p)=>{const q=screen({x:a.x-p.x,y:a.y-p.y});return Math.atan2(q.y,q.x);},delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b)),ring=(p,a,r)=>{const v=WorldProjection.inverse(Math.cos(a)*r,Math.sin(a)*r);return {x:p.x+v.x,y:p.y+v.y};};
 function clear(g,a,b,r=6){const d=length(a,b),n=Math.ceil(d/5);for(let i=1;i<=n;i++)if(g.solid(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;}
 function state(g){let s=games.get(g);if(!s||s.floor!==g.dungeon.floor||s.enemies!==g.enemies){s={floor:g.dungeon.floor,enemies:g.enemies,actors:new Map(),nextStrike:0,nextBark:0,lines:[]};games.set(g,s);}return s;}
 function reset(g){games.delete(g);}
 function plan(g,dt){
  const s=state(g),p=g.player,now=g.time,live=g.enemies.filter(e=>!e.dead&&(!e.chief||g.dungeon.bossFight)&&(!e.bossGuard||g.dungeon.bossFight||g.dungeon.bossDead));
  const visible=live.filter(e=>length(e,p)<170&&g.lineClear(e,p));
  for(const e of live){let m=s.actors.get(e);if(!m){m={until:0,slot:null,route:[],repath:0};s.actors.set(e,m);}
   // Alerts need an unoccluded nearby witness; nobody sees through a closed door.
   const sees=visible.includes(e),witness=visible.find(a=>length(a,e)<100&&g.lineClear(a,e));
   if(sees||witness){
    if(m.until<=now&&now>=s.nextBark&&now>=(m.nextBark||0)){
     const lines=e.chief?['Tu ne sortiras pas !']:sees?['Un intrus !','Attrapez-le !','Il est là !','À moi !']:['Par ici !','On le tient !'];
     const seed=String(e.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0);
     s.lines=[{actor:e,text:lines[seed%lines.length],start:now,until:now+2.2}];s.nextBark=now+2.6;m.nextBark=now+10;
    }
    m.until=now+2.8;m.last={x:p.x,y:p.y};}m.sees=sees;
  }
  const active=live.filter(e=>s.actors.get(e).until>now&&length(e,p)<210),group=active.filter(e=>s.actors.get(e).sees),used=new Set();
  // Evenly spaced sectors span the whole ring, rather than adjacent nearest slots.
  const signature=group.map(e=>e.id).sort().join('|');
  if(s.formation!==signature){s.formation=signature;s.sectors=new Map();const count=Math.min(8,group.length),free=Array.from({length:count},(_,i)=>i);
   for(const e of [...group].sort((a,b)=>length(a,p)-length(b,p))){let best=0,score=Infinity;for(const i of free){const a=i*Math.PI*2/count,q=ring(p,a,29),v=length(e,q)+(g.solid(q.x,q.y,e.r||6)?50:0);if(v<score){score=v;best=i;}}
    if(free.length){free.splice(free.indexOf(best),1);s.sectors.set(e,best);}else s.sectors.set(e,null);
   }
  }
  for(const e of group){const m=s.actors.get(e),slot=s.sectors.get(e);m.slot=slot;m.angle=slot===null?angle(e,p):slot*Math.PI*2/Math.min(8,group.length);m.ready=group.length<2||Math.abs(delta(m.angle,angle(e,p)))<.48;}
  const candidates=group.filter(e=>e.stun<=0&&!Number.isFinite(e.swingElapsed)&&e.cooldown<=.08&&s.actors.get(e).slot!==null).sort((a,b)=>(s.actors.get(a).lastStrike??-10)-(s.actors.get(b).lastStrike??-10)||length(a,p)-length(b,p));
  const pressing=new Set(candidates.slice(0,2));
  return {s,active,group,pressing,now};
 }
 function goal(g,e,plan){const m=plan.s.actors.get(e);if(!plan.active.includes(e))return null;
  if(!m.sees)return m.last;
  if(plan.group.length<2)return g.player;
  if(plan.pressing.has(e)&&m.ready)return g.player;
  const radius=m.slot===null?47:e.cooldown>.1?33:29;
  for(const r of [radius,24,38])for(const offset of [0,.16,-.16,.32,-.32]){const q=ring(g.player,m.angle+offset,r);if(!g.solid(q.x,q.y,e.r||6)&&clear(g,g.player,q,e.r||6))return q;}
  return {x:e.x,y:e.y};
 }
 function canStrike(g,e,p){return p.s.actors.get(e)?.sees&&(p.group.length<2||p.pressing.has(e)&&p.s.actors.get(e).ready)&&p.now>=p.s.nextStrike&&g.enemies.filter(a=>!a.dead&&a.stun<=0&&Number.isFinite(a.swingElapsed)).length<2;}
 function reserve(p,e){p.s.nextStrike=p.now+.18;if(e)p.s.actors.get(e).lastStrike=p.now;}
 function waypoint(g,e,target,m){
  if(clear(g,e,target,e.r||6)){m.route=[];return target;}
  if(!m.route.length||g.time>=m.repath&&(!m.target||length(m.target,target)>12)){
   m.repath=g.time+.55;m.route=[];m.target={x:target.x,y:target.y};
   // Bounded A* follows the complete detour; collision probes include doors and crates.
   const step=16,key=(x,y)=>x+','+y,start={x:e.x,y:e.y,parent:null,cost:0},queue=[start],seen=new Set([key(0,0)]);let best=start,bestD=length(start,target);
   for(let n=0;queue.length&&n<240;n++){queue.sort((a,b)=>(a.cost+length(a,target))-(b.cost+length(b,target)));const a=queue.shift(),d=length(a,target);if(d<bestD){best=a;bestD=d;}if(d<20&&clear(g,a,target,e.r||6)){best=a;break;}
    for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const x=a.x+dx,y=a.y+dy,k=key(Math.round((x-e.x)/step),Math.round((y-e.y)/step));if(seen.has(k))continue;seen.add(k);const b={x,y,parent:a,cost:a.cost+step};if(!clear(g,a,b,e.r||6))continue;queue.push(b);}
   }
   for(let a=best;a.parent;a=a.parent)m.route.unshift({x:a.x,y:a.y});
  }
  while(m.route.length&&length(e,m.route[0])<.1)m.route.shift();return m.route[0]||null;
 }
 function move(g,e,target,plan,dt){
  const m=plan.s.actors.get(e);if(!target||length(e,target)<3)return;
  // Follow the circumference to a far flank instead of cutting through the hero.
  if(m.sees&&plan.group.length>1&&!m.ready&&length(e,g.player)<95){const current=angle(e,g.player),error=delta(m.angle,current),radius=Math.max(25,Math.min(42,Math.hypot(...Object.values(screen({x:e.x-g.player.x,y:e.y-g.player.y}))))),sign=Math.sign(error)||1;
   for(const turn of [sign,-sign]){const q=ring(g.player,current+turn*.30,radius);if(clear(g,e,q,e.r||6)){target=q;break;}}
  }
  const q=waypoint(g,e,target,m);if(!q)return;
  let dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy);if(d<.01)return;dx/=d;dy/=d;
  // Separate rigid bodies without changing their art or rotating a committed strike.
  for(const a of plan.active)if(a!==e){const n=length(a,e),r=(a.r||6)+(e.r||6)+5;if(n<r&&n>.01){dx+=(e.x-a.x)/n*(r-n)/r*1.6;dy+=(e.y-a.y)/n*(r-n)/r*1.6;}}
  const n=Math.hypot(dx,dy)||1,speed=e.chief?29:plan.group.length>1?42:32,amount=Math.min(speed*dt,d),ox=e.x,oy=e.y;
  let mx=dx/n*amount,my=dy/n*amount;
  // A cached path or separation force may graze a corner: slide safely and replan.
  if(g.solid(e.x+mx,e.y+my,e.r||6)){m.repath=0;if(!g.solid(e.x+mx,e.y,e.r||6))my=0;else if(!g.solid(e.x,e.y+my,e.r||6))mx=0;else return;}
  g.move(e,mx,my);const moved=Math.hypot(e.x-ox,e.y-oy);e.moving=moved>.001;if(e.moving){e.dir=m.sees?g.direction(g.player.x-e.x,g.player.y-e.y):g.direction(e.x-ox,e.y-oy);e.anim=(e.anim||0)+moved/5.5;}
 }
 function combatMove(g,e,plan,dt){
  const m=plan.s.actors.get(e);if(!m?.sees)return;const frame=HearthreaverGoblins.look(e).frame,stamp=e.swingElapsed;
  if(m.swingStamp>stamp||m.swingStamp===undefined){m.advance=0;m.recover=0;}m.swingStamp=stamp;
  if(frame===0||frame===1&&e.wind>.16){const left=Math.max(0,2-(m.advance||0)),amount=Math.min(left,12*dt),[x,y]=g.facing(e.swingDir);const ox=e.x,oy=e.y;if(length(e,g.player)>12)g.move(e,x*amount,y*amount);m.advance=(m.advance||0)+Math.hypot(e.x-ox,e.y-oy);}
  else if(frame===3||frame===4){const left=Math.max(0,3-(m.recover||0)),a=angle(e,g.player),turn=Math.sign(delta(m.angle,a))||((m.slot||0)%2?1:-1),q=ring(g.player,a+turn*.1,Math.max(18,Math.hypot(...Object.values(screen({x:e.x-g.player.x,y:e.y-g.player.y}))))),d=length(e,q),amount=Math.min(left,16*dt,d);if(d>.01){const ox=e.x,oy=e.y;g.move(e,(q.x-e.x)/d*amount,(q.y-e.y)/d*amount);m.recover=(m.recover||0)+Math.hypot(e.x-ox,e.y-oy);}}
 }
 function speech(g){const s=games.get(g);return s&&s.floor===g.dungeon?.floor&&s.enemies===g.enemies?s.lines.filter(l=>!l.actor.dead&&g.time<l.until):[];}
 return {plan,goal,canStrike,reserve,move,combatMove,reset,speech};
})();
