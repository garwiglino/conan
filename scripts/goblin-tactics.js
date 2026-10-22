// Transient squad coordinator: approach space, attack turns and single-file portals.
const GoblinTactics=(()=>{
 const games=new WeakMap(),length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),swing=e=>Number.isFinite(e.swingElapsed);
 const screen=v=>WorldProjection.point(v.x,v.y),angle=(a,p)=>{const q=screen({x:a.x-p.x,y:a.y-p.y});return Math.atan2(q.y,q.x);},delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
 // Radii are simulation distances: isometric foreshortening cannot shrink a flank.
 const ring=(p,a,r)=>{const v=WorldProjection.inverse(Math.cos(a),Math.sin(a)),d=Math.hypot(v.x,v.y);return {x:p.x+v.x/d*r,y:p.y+v.y/d*r};};
 function clear(g,a,b,r=6){const d=length(a,b),n=Math.ceil(d/4);for(let i=1;i<=n;i++)if(g.solid(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true;}
 function state(g){let s=games.get(g);if(!s||s.floor!==g.dungeon.floor||s.enemies!==g.enemies){s={floor:g.dungeon.floor,enemies:g.enemies,actors:new Map(),nextStrike:0,nextBark:0,lines:[],engagers:new Set(),portals:new Map()};games.set(g,s);}return s;}
 function reset(g){games.delete(g);}
 // Being hit changes intent, never the native hurt duration or the player's hit.
 function provoke(g,e){const m=state(g).actors.get(e);if(m){m.provokedUntil=g.time+1.2;m.wasSwing=false;}}

 function portalPlan(g,s,active,now){
  for(const e of active){const m=s.actors.get(e);m.portal=null;m.clearingPortal=null;}
  const ports=g.dungeonPortals?.()||[];s.ports=ports;const valid=new Set(ports.map(p=>p.id));for(const id of s.portals.keys())if(!valid.has(id))s.portals.delete(id);
  for(const port of ports){const axis=port.axis,tan=axis==='x'?'y':'x',requests=active.filter(e=>{const target=s.actors.get(e).last||g.player,a=e[axis]-port[axis],b=target[axis]-port[axis];if(a*b>0||length(e,port)>100)return false;const t=(port[axis]-e[axis])/(target[axis]-e[axis]||1);return Math.abs(e[tan]+(target[tan]-e[tan])*t-port[tan])<=port.half+5;}).sort((a,b)=>length(a,port)-length(b,port)||String(a.id).localeCompare(String(b.id)));
   for(const e of active){const side=Math.sign(g.player[axis]-port[axis]),progress=(e[axis]-port[axis])*side;if(progress>=0&&progress<64&&Math.abs(e[tan]-port[tan])<24)s.actors.get(e).clearingPortal={...port,side};}
   let claim=s.portals.get(port.id);if(claim){const e=claim.actor,progress=(e[axis]-port[axis])*claim.side;if(progress<(claim.progress??Infinity)-1){claim.progress=progress;claim.until=now+1.5;}if(!active.includes(e)||e.dead||progress < -24||s.actors.get(e).retreatUntil>now&&Math.abs(e[axis]-port[axis])>27||now>claim.until){if(now>claim.until)s.actors.get(e).doorRetry=now+.6;s.portals.delete(port.id);claim=null;}}
   if(!claim&&requests.length){const actor=requests.find(e=>(s.actors.get(e).doorRetry||0)<=now);if(actor){claim={actor,side:Math.sign(actor[axis]-port[axis])||1,until:now+2.4};s.portals.set(port.id,claim);}}
   let rank=0;for(const e of requests){const m=s.actors.get(e),owner=claim?.actor===e,side=Math.sign(e[axis]-port[axis])||claim?.side||1;m.portal={...port,owner,side,rank:owner?-1:rank++};}
  }
 }
 function portalFree(g,e,x,y,s){for(const p of s.ports||[]){const tan=p.axis==='x'?'y':'x',inside=(a,b)=>Math.abs(a-p[p.axis])<12&&Math.abs(b-p[tan])<14;if(!inside(p.axis==='x'?x:y,p.axis==='x'?y:x)||inside(e[p.axis],e[tan]))continue;if(g.enemies.some(a=>a!==e&&!a.dead&&inside(a[p.axis],a[tan])))return false;}return true;}
 // Reserve an actual walkable exit, including at a wall or in a room corner.
 // Angular gaps alone can point into masonry and leave every real exit occupied.
 function escapePlan(g,s,group,now){
  const p=g.player,steer=g.dungeonSteer,moving=steer&&Math.hypot(steer.x,steer.y)>.2,wanted=moving?angle({x:p.x+steer.x,y:p.y+steer.y},p):s.gap;
  const crowdKey=group.map(e=>e.id+':'+Math.round(e.x/8)+','+Math.round(e.y/8)).join('|'),blocked=!moving&&s.exit&&group.some(e=>{const x=e.x-p.x,y=e.y-p.y;return x*s.exit.x+y*s.exit.y>0&&x*s.exit.x+y*s.exit.y<48&&Math.abs(-x*s.exit.y+y*s.exit.x)<17;});
  if(now>=(s.nextEscape||0)||blocked&&crowdKey!==s.escapeCrowd||moving&&Math.abs(delta(wanted,s.escapeWanted??wanted))>.35){
   s.escapeCrowd=crowdKey;s.nextEscape=now+.18;s.escapeWanted=wanted;let best=null,score=Infinity;
   for(let i=0;i<24;i++){const a=wanted+i*Math.PI/12,q=ring(p,a,52);if(!clear(g,p,q,5))continue;
    const ux=(q.x-p.x)/52,uy=(q.y-p.y)/52,v=Math.abs(delta(a,wanted)),crowd=group.reduce((n,e)=>{const x=e.x-p.x,y=e.y-p.y;return n+(x*ux+y*uy>0&&x*ux+y*uy<52&&Math.abs(-x*uy+y*ux)<17?1:0);},0),value=v+crowd*(moving?.15:4);
    if(value<score){score=value;best=a;}}
   if(best!==null){s.gap=best;const q=ring(p,best,1);s.exit={x:q.x-p.x,y:q.y-p.y};}else s.exit=null;
  }
  for(const e of group){const m=s.actors.get(e);m.yield=false;if(!s.exit||m.portal||m.clearingPortal)continue;
   const v={x:e.x-p.x,y:e.y-p.y},along=v.x*s.exit.x+v.y*s.exit.y,side=v.x*-s.exit.y+v.y*s.exit.x;
   if(along<=0||along>48||Math.abs(side)>=17)continue;
   const choices=[];for(const sign of [Math.sign(side)||((m.slot||0)%2?1:-1),-(Math.sign(side)||((m.slot||0)%2?1:-1))]){
    const q={x:p.x+s.exit.x*Math.max(19,Math.min(34,along))-s.exit.y*sign*27,y:p.y+s.exit.y*Math.max(19,Math.min(34,along))+s.exit.x*sign*27};
    if(!g.solid(q.x,q.y,e.r||6)&&clear(g,e,q,e.r||6))choices.push(q);
   }
   if(choices.length){m.yield=true;m.yieldGoal=choices[0];if(!swing(e))s.engagers.delete(e);}
  }
 }
 function plan(g,dt){
  const s=state(g),p=g.player,now=g.time,live=g.enemies.filter(e=>!e.dead&&(!e.chief||g.dungeon.bossFight)&&(!e.bossGuard||g.dungeon.bossFight||g.dungeon.bossDead)),visible=live.filter(e=>length(e,p)<170&&g.lineClear(e,p));
  for(const e of live){let m=s.actors.get(e);if(!m){m={until:0,slot:null,route:[],repath:0,retreatUntil:0};s.actors.set(e,m);}
   const sees=visible.includes(e),witness=sees?null:visible.find(a=>length(a,e)<100&&g.lineClear(a,e));
   if(sees&&!swing(e)&&e.stun<=0&&m.until<=now&&!e.chief)e.cooldown=Math.min(e.cooldown||0,.12);
   if(sees||witness){if(m.until<=now&&now>=s.nextBark&&now>=(m.nextBark||0)){const lines=e.chief?['Tu ne sortiras pas !']:sees?['Un intrus !','Attrapez-le !','Il est là !','À moi !']:['Par ici !','On le tient !'],seed=String(e.id).split('').reduce((n,c)=>n+c.charCodeAt(0),0);s.lines=[{actor:e,text:lines[seed%lines.length],start:now,until:now+2.2}];s.nextBark=now+2.6;m.nextBark=now+10;}m.until=now+2.8;m.last={x:p.x,y:p.y};}
   m.sees=sees;if(m.wasSwing&&!swing(e)){m.retreatUntil=now+(e.chief?.35:.14);s.engagers.delete(e);}m.wasSwing=swing(e);
  }
  const active=live.filter(e=>{const m=s.actors.get(e);return m.until>now&&length(e,m.sees?p:m.last)<210;}),group=active.filter(e=>s.actors.get(e).sees);
  portalPlan(g,s,active,now);
  if(s.gap===undefined){const sum=group.reduce((v,e)=>({x:v.x+e.x-p.x,y:v.y+e.y-p.y}),{x:0,y:0});s.gap=angle({x:p.x-sum.x,y:p.y-sum.y},p);}
  const steer=g.dungeonSteer;if(steer&&Math.hypot(steer.x,steer.y)>.2){const wanted=angle({x:p.x+steer.x,y:p.y+steer.y},p);s.gap+=Math.max(-dt*.8,Math.min(dt*.8,delta(wanted,s.gap)));}
  const signature=group.map(e=>e.id).sort().join('|'),count=Math.min(8,group.length),span=Math.PI*5/3;
  if(s.formation!==signature){s.formation=signature;s.sectors=new Map();const free=Array.from({length:count},(_,i)=>i);for(const e of [...group].sort((a,b)=>length(a,p)-length(b,p))){let best=null,score=Infinity;for(const i of free){const q=ring(p,s.gap+Math.PI/6+(i+.5)*span/count,46),v=length(e,q)+(g.solid(q.x,q.y,e.r||6)?70:0);if(v<score){score=v;best=i;}}if(best!==null)free.splice(free.indexOf(best),1);s.sectors.set(e,best);}}
  escapePlan(g,s,group,now);
  for(const e of group){const m=s.actors.get(e);m.slot=s.sectors.get(e);m.angle=m.slot===null?angle(e,p):s.gap+Math.PI/6+(m.slot+.5)*span/count;m.local=length(e,p)<=29;m.threat=m.local||p.attack>0&&g.targetId===e.id&&length(e,p)<48;
   m.priority=m.local?100-length(e,p):m.provokedUntil>now?55:p.attack>0&&m.threat?45:0;
   m.ready=m.local||group.length<2||m.portal?.owner||Math.abs(delta(m.angle,angle(e,p)))<.6;}
  for(const e of [...s.engagers]){const m=s.actors.get(e);if(!group.includes(e)||e.stun>0||m.portal&&!m.portal.owner||m.retreatUntil>now||!swing(e)&&now>m.engageUntil){s.engagers.delete(e);if(m&&now>m.engageUntil&&!m.portal&&!m.clearingPortal)m.retreatUntil=now+.12;}}
  for(const e of group)if(swing(e))s.engagers.add(e);
  // Committed blows own capacity first, including after a local priority transfer.
  const committed=[...s.engagers].filter(swing);
  if(committed.length>=2)for(const e of [...s.engagers])if(!swing(e))s.engagers.delete(e);
  const candidates=group.filter(e=>e.stun<=0&&!swing(e)&&e.cooldown<=.08&&!s.actors.get(e).yield&&s.actors.get(e).retreatUntil<=now&&s.actors.get(e).ready&&(!s.actors.get(e).portal||s.actors.get(e).portal.owner)).sort((a,b)=>s.actors.get(b).priority-s.actors.get(a).priority||(s.actors.get(a).lastStrike??-10)-(s.actors.get(b).lastStrike??-10)||length(a,p)-length(b,p));
  for(const e of candidates){
   if(s.engagers.has(e))continue;
   // A locally engaged opponent can replace an approaching ally, never a swing.
   if(s.engagers.size>=2&&s.actors.get(e).priority>0){const yieldTo=[...s.engagers].filter(a=>!swing(a)&&s.actors.get(a).priority<s.actors.get(e).priority-8).sort((a,b)=>length(b,p)-length(a,p))[0];if(yieldTo)s.engagers.delete(yieldTo);}
   if(s.engagers.size<2){s.engagers.add(e);s.actors.get(e).engageUntil=now+1.6;}
  }
  for(const e of group){const m=s.actors.get(e);
   if(m.threat&&!s.engagers.has(e)&&!swing(e)&&e.stun<=0&&now>=(m.nextEvade||0)){
    const a=angle(e,p),turn=(m.slot??0)%2?1:-1;
    for(const side of [turn,-turn]){const q=ring(p,a+side*.48,Math.max(36,length(e,p)+10));if(clear(g,e,q,e.r||6)){m.evade=q;m.evadeUntil=now+.3;m.nextEvade=now+.65;break;}}
   }
  }
  return {s,active,group,pressing:new Set(s.engagers),now};
 }
 // Approach a position the authored impact can actually reach. Isometric body
 // collisions can stop a straight pursuit beside, rather than inside, its arc.
 function contactGoal(g,e,m){
  const p=g.player,combo=e.nextCombo||0,dir=g.direction(p.x-e.x,p.y-e.y),connects=q=>HearthreaverGoblins.hits({...e,x:q.x,y:q.y,swingDir:g.direction(p.x-q.x,p.y-q.y),goblinCombo:combo,swingAim:HearthreaverGoblins.aim(q,p,g.direction(p.x-q.x,p.y-q.y),combo)},p);
  const distance=length(e,p);
  if(distance>42){m.contact=null;return p;}
  // Keep ordinary pursuit direct. Orbit only when a body actually blocks
  // the last step and the authored contact cannot reach from this position.
  if(!m.contact&&!(m.alignUntil>g.time)){
   if(distance>24||!g.crowd?.(e,e.x+(p.x-e.x)/(distance||1),e.y+(p.y-e.y)/(distance||1)))return p;
   m.alignUntil=g.time+2;
  }
  if(connects(e)){m.contact=null;return length(e,p)<=(e.chief?32:21)?{x:e.x,y:e.y}:p;}
  const approach=q=>{const current=angle(e,p),error=delta(angle(q,p),current);return Math.abs(error)>.18?ring(p,current+Math.max(-.23,Math.min(.23,error)),Math.max(e.chief?30:22,length(e,p))):q;};
  if(m.contact&&m.contact.combo===combo&&m.contact.dir===dir&&length(e,m.contact)<45&&length(m.contact.player,p)<3&&!g.solid(m.contact.x,m.contact.y,e.r||6))return approach(m.contact);
  const a=angle(e,p),options=[];
  for(const turn of [0,.2,-.2,.4,-.4,.55,-.55,.7,-.7,1,-1,1.3,-1.3])for(const radius of [17,19,21]){
   const q=ring(p,a+turn,e.chief?radius+8:radius);
   if(g.direction(p.x-q.x,p.y-q.y)===dir&&!g.solid(q.x,q.y,e.r||6)&&connects(q)&&clear(g,e,q,e.r||6))options.push(q);
  }
  options.sort((a,b)=>length(e,a)-length(e,b));
  m.contact=options.length?{...options[0],combo,dir,player:{x:p.x,y:p.y}}:null;return m.contact?approach(m.contact):p;
 }
 function goal(g,e,plan){const m=plan.s.actors.get(e);if(!plan.active.includes(e))return null;
  if(m.portal&&!m.portal.owner){const q={x:m.portal.x,y:m.portal.y};q[m.portal.axis]+=m.portal.side*(50+m.portal.rank*24);return !g.solid(q.x,q.y,e.r||6)?q:{x:e.x,y:e.y};}
  if(!m.sees)return m.last;
  if(m.yield)return m.yieldGoal;
  if(m.evadeUntil>plan.now&&!plan.pressing.has(e)&&!m.portal&&!m.clearingPortal)return m.evade;
  if(m.clearingPortal){const port=m.clearingPortal,tan=port.axis==='x'?'y':'x';for(const offset of [24,-24,32,-32]){const q={x:port.x,y:port.y};q[port.axis]+=port.side*68;q[tan]+=offset;if(!g.solid(q.x,q.y,e.r||6))return q;}}

  if(plan.pressing.has(e)&&m.ready){if(length(e,g.player)>30&&plan.active.filter(a=>a!==e&&length(a,g.player)<30).length>=2)return ring(g.player,angle(e,g.player),37);return contactGoal(g,e,m);}
  if(m.portal?.owner){if(m.retreatUntil>plan.now){const q={x:m.portal.x,y:m.portal.y};q[m.portal.axis]+=m.portal.side*32;return q;}return g.player;}
  if(plan.group.length<2&&m.retreatUntil<=plan.now)return length(e,g.player)>20?g.player:{x:e.x,y:e.y};
  const radius=m.slot===null?70:m.retreatUntil>plan.now?33:46;
  for(const r of [radius,radius+10,radius-6])for(const offset of [0,.2,-.2,.4,-.4]){const q=ring(g.player,m.angle+offset,r);if(!g.solid(q.x,q.y,e.r||6)&&clear(g,g.player,q,e.r||6))return q;}
  // Back out along a clear local direction when a room wall blocks the sector.
  if(length(e,g.player)<35)for(const turn of [0,.5,-.5,1,-1]){const q=ring(g.player,angle(e,g.player)+turn,43);if(clear(g,e,q,e.r||6))return q;}
  return {x:e.x,y:e.y};
 }
 function canStrike(g,e,p){const m=p.s.actors.get(e);return m?.sees&&!m.yield&&!swing(e)&&p.pressing.has(e)&&m.ready&&(!m.portal||m.portal.owner)&&p.now>=p.s.nextStrike&&g.enemies.filter(a=>!a.dead&&a.stun<=0&&swing(a)).length<2;}
 function reserve(p,e){p.s.nextStrike=p.now+.16;if(e){const m=p.s.actors.get(e);m.lastStrike=p.now;m.wasSwing=true;}}
 function waypoint(g,e,target,m){
  const navigable=(a,b)=>{if(!clear(g,a,b,e.r||6))return false;if(!g.crowd||target===g.player)return true;const n=Math.ceil(length(a,b)/4);for(let i=1;i<=n;i++)if(g.crowd(e,a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n))return false;return true;};
  if(navigable(e,target)){m.route=[];return target;}

  if(!m.route.length&&g.time>=m.repath||g.time>=m.repath&&(!m.target||length(m.target,target)>12)){
   m.repath=g.time+.55;m.route=[];m.target={x:target.x,y:target.y};
   // Bounded A* follows the complete detour; collision probes include doors and crates.
   const step=8,key=(x,y)=>x+','+y,start={x:e.x,y:e.y,parent:null,cost:0},queue=[start],seen=new Set([key(0,0)]);let best=start,bestD=length(start,target);
   for(let n=0;queue.length&&n<240;n++){queue.sort((a,b)=>(a.cost+length(a,target))-(b.cost+length(b,target)));const a=queue.shift(),d=length(a,target);if(d<bestD){best=a;bestD=d;}if(d<12&&navigable(a,target)){best=a;break;}
    for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const x=a.x+dx,y=a.y+dy,k=key(Math.round((x-e.x)/step),Math.round((y-e.y)/step));if(seen.has(k))continue;seen.add(k);const b={x,y,parent:a,cost:a.cost+step};if(!navigable(a,b))continue;queue.push(b);}
   }
   for(let a=best;a.parent;a=a.parent)m.route.unshift({x:a.x,y:a.y});
  }
  while(m.route.length&&length(e,m.route[0])<1)m.route.shift();return m.route[0]||null;
 }
 function move(g,e,target,plan,dt){
  const m=plan.s.actors.get(e);if(!target||length(e,target)<(m.contact===target ? .4 : 3))return;
  // Follow the circumference to a far flank instead of cutting through the hero.
  if(m.sees&&!m.portal&&!m.clearingPortal&&plan.group.length>1&&!m.ready&&!m.yield&&!(m.evadeUntil>plan.now)&&length(e,g.player)<95){const current=angle(e,g.player),error=delta(m.angle,current),radius=Math.max(40,Math.min(58,length(e,g.player))),sign=Math.sign(error)||1;
   for(const turn of [sign,-sign]){const q=ring(g.player,current+turn*.30,radius);if(clear(g,e,q,e.r||6)){target=q;break;}}
  }
  if(!m.portal&&!m.clearingPortal&&!plan.pressing.has(e)&&!m.yield&&!(m.evadeUntil>plan.now)&&length(e,g.player)<30){const q=ring(g.player,angle(e,g.player),46);if(clear(g,e,q,e.r||6))target=q;}
  const q=waypoint(g,e,target,m);if(!q)return;
  let dx=q.x-e.x,dy=q.y-e.y,d=Math.hypot(dx,dy);if(d<.01)return;dx/=d;dy/=d;
  // Separate rigid bodies without changing their art or rotating a committed strike.
  for(const a of plan.active)if(a!==e){const n=length(a,e),r=(a.r||6)+(e.r||6)+9;if(n<r&&n>.01){dx+=(e.x-a.x)/n*(r-n)/r*1.6;dy+=(e.y-a.y)/n*(r-n)/r*1.6;}}
  const n=Math.hypot(dx,dy)||1,speed=e.chief?29:plan.pressing.has(e)||plan.group.length>1?42:32,amount=Math.min(speed*dt,d),ox=e.x,oy=e.y;
  let mx=dx/n*amount,my=dy/n*amount;
  // A cached path or separation force may graze a corner: slide safely and replan.
  if(g.solid(e.x+mx,e.y+my,e.r||6)){m.route=[];m.repath=g.time+.12;if(!g.solid(e.x+mx,e.y,e.r||6))my=0;else if(!g.solid(e.x,e.y+my,e.r||6))mx=0;else return;}
  // Waiting actors yield the inner space; only token holders may approach it.
  if(!plan.pressing.has(e)&&!m.yield&&!m.portal&&!m.clearingPortal&&length({x:e.x+mx,y:e.y+my},g.player)<32&&length({x:e.x+mx,y:e.y+my},g.player)<length(e,g.player))return;
  if(!portalFree(g,e,e.x+mx,e.y+my,plan.s))return;
  g.move(e,mx,my);const moved=Math.hypot(e.x-ox,e.y-oy);m.stuck=moved<.01?(m.stuck||0)+dt:0;if(m.stuck>.16){m.route=[];m.repath=g.time+.12;m.stuck=0;}e.moving=moved>.001;if(e.moving){e.dir=m.sees?g.direction(g.player.x-e.x,g.player.y-e.y):g.direction(e.x-ox,e.y-oy);e.anim=(e.anim||0)+moved/5.5;}
 }
 function combatMove(g,e,plan,dt){
  const m=plan.s.actors.get(e);if(!m?.sees)return;if(m.yield){const dir=e.dir;move(g,e,m.yieldGoal,plan,dt);e.dir=dir;return;}const frame=HearthreaverGoblins.look(e).frame,stamp=e.swingElapsed;
  if(m.swingStamp>stamp||m.swingStamp===undefined){m.advance=0;m.recover=0;}m.swingStamp=stamp;
  if(frame===0||frame===1&&e.wind>.16){const left=Math.max(0,2-(m.advance||0)),amount=Math.min(left,12*dt),[x,y]=g.facing(e.swingDir);const ox=e.x,oy=e.y;if(length(e,g.player)>12&&portalFree(g,e,e.x+x*amount,e.y+y*amount,plan.s))g.move(e,x*amount,y*amount);m.advance=(m.advance||0)+Math.hypot(e.x-ox,e.y-oy);}
  else if(frame===3||frame===4){const left=Math.max(0,5-(m.recover||0)),a=angle(e,g.player),turn=Math.sign(delta(m.angle,a))||((m.slot||0)%2?1:-1),q=ring(g.player,a+turn*.08,length(e,g.player)+6),d=length(e,q),amount=Math.min(left,16*dt,d);if(d>.01){const ox=e.x,oy=e.y;if(portalFree(g,e,e.x+(q.x-e.x)/d*amount,e.y+(q.y-e.y)/d*amount,plan.s))g.move(e,(q.x-e.x)/d*amount,(q.y-e.y)/d*amount);m.recover=(m.recover||0)+Math.hypot(e.x-ox,e.y-oy);}}
 }
 function speech(g){const s=games.get(g);return s&&s.floor===g.dungeon?.floor&&s.enemies===g.enemies?s.lines.filter(l=>!l.actor.dead&&g.time<l.until):[];}
 return {plan,goal,canStrike,reserve,move,combatMove,reset,provoke,speech};
})();
