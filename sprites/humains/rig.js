/* Integer pixel rig. Native parts remain immutable; all posing is temporary. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./sources-natives.js'):root.HearthreaverHumanSources,typeof module==='object'&&module.exports?require('./catalogue.js'):root.HearthreaverHumanCatalogue);if(typeof module==='object'&&module.exports)module.exports=api;else root.HearthreaverHumanRig=api;})(globalThis,function(S,C){
'use strict';
const round=Math.round,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,INK='100c14';
class Pixels{
 constructor(){this.map=new Map();this.clipped=0;}
 set(x,y,c){x=round(x);y=round(y);if(x<0||x>=80||y<0||y>=80){this.clipped++;return;}if(c)this.map.set(y*80+x,[x,y,c.replace('#','')]);}
 rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)this.set(x+i,y+j,c);}
 line(x,y,X,Y,c,width=1){const n=Math.max(Math.abs(round(X)-round(x)),Math.abs(round(Y)-round(y)),1);for(let i=0;i<=n;i++)this.rect(round(lerp(x,X,i/n))-Math.floor(width/2),round(lerp(y,Y,i/n))-Math.floor(width/2),width,width,c);}
 ellipse(x,y,rx,ry,c){for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++)if(i*i/(rx*rx)+j*j/(ry*ry)<=1)this.set(x+i,y+j,c);}
 outline(color=INK){const points=[...this.map.values()];for(const [x,y] of points)for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]])if(!this.map.has((y+dy)*80+x+dx)&&x+dx>=0&&x+dx<80&&y+dy>=0&&y+dy<80)this.map.set((y+dy)*80+x+dx,[x+dx,y+dy,color]);}
 stamp(points,transform=(x,y)=>[x,y],color=c=>c){for(const [x,y,c]of points)this.set(...transform(x,y),color(c,x,y));}
 values(){return [...this.map.values()];}
}
const decoded=new WeakMap();
function decode(grid){if(!grid)return [];if(decoded.has(grid))return decoded.get(grid);const out=[];grid.rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')out.push([x+grid.x,y+grid.y,grid.palette[S.alphabet.indexOf(c)]]);}));decoded.set(grid,out);return out;}
const directions=['face','droite','dos','gauche'];
function direction(v){if(typeof v==='number'){if(v<0||v>3||!Number.isInteger(v))throw RangeError('Direction moteur 0..3');return ['dos','droite','face','gauche'][v];}if(!directions.includes(v))throw RangeError('Vue inconnue : '+v);return v;}
function project(dir,l,d,h){if(dir==='face')return [40+round(l),52+round(d*.38-h)];if(dir==='dos')return [39-round(l),52+round(-d*.38-h)];if(dir==='droite')return [40+round(d),52+round(l*.15-h)];return [39-round(d),52+round(-l*.15-h)];}
function category(name){if(/^07 Crane|^08 Visage|^VISAGE/.test(name))return 'head';if(/Manches|Mains|mains|bras|Bras|Gants|Manica/.test(name))return 'arms';if(/HABIT 10|Pieds nus/.test(name))return 'feet';if(/HABIT 11|Jambes/.test(name))return 'legs';return 'body';}
function frameAt(id,seconds=0,distance){const c=C.CLIPS[id];if(!c)throw RangeError('Activité inconnue : '+id);if(!Number.isFinite(seconds)||distance!==undefined&&!Number.isFinite(distance))throw RangeError('Temps/distance non fini');let ms=distance!==undefined&&c.stride?((distance%c.stride+c.stride)%c.stride)/c.stride*c.duration*1000:Math.max(0,seconds)*1000;ms=c.loop?ms%(c.duration*1000):Math.min(ms,c.duration*1000-.000001);for(let f=0;f<c.frames;f++){if(ms<c.durations[f])return f;ms-=c.durations[f];}return c.frames-1;}
function eventsBetween(id,before,after){const c=C.CLIPS[id];if(!c||!Number.isFinite(before)||!Number.isFinite(after)||after<before)throw RangeError('Intervalle invalide');const first=c.loop?Math.max(0,Math.floor(before/c.duration)):0,last=c.loop?Math.max(0,Math.floor(after/c.duration)):0;if(last-first>128)throw RangeError('Découper le rattrapage temporel');const out=[];for(let k=first;k<=last;k++)for(const m of c.markers||[]){const time=k*c.duration+c.durations.slice(0,m.frame).reduce((a,b)=>a+b,0)/1000;if(time>before&&time<=after)out.push({...m,time,cycle:k});}return out;}
const step=[2,1,0,-1,-2,-1,0,1],lift=[0,1,1,0,0,-1,-1,0],bob=[0,-1,0,1,0,-1,0,1];
const effort=[0,.3,.8,1,.75,.45,.15,0],swing=[0,1,2,1,0,-1,-2,-1];
function pose(id,f){
 const c=C.CLIPS[id],q=c.recipe,w=swing[f%8],p=effort[f%8],t=f/Math.max(1,c.frames-1),s={right:[-5,1,5],left:[5,1,5],lean:0,sit:0,bob:0,step:0,lift:0,angle:0,head:0,raised:false};
 const hands=(r,l)=>{s.right=r;s.left=l;};
 if(q==='idle'){s.bob=f===1||f===2?1:0;s.native=true;return s;}
 if(['walk','flee','armed_walk','carry','lead','board','disembark'].includes(q)){s.step=step[f%8]*(q==='flee'?1.5:1);s.lift=lift[f%8];s.bob=bob[f%8];if(['walk','flee','board','disembark','lead'].includes(q))hands([-5,-s.step,5],[5,s.step,5]);}
 if(['talk','negotiate','greet','salute','order','warn','inspect','arrest','listen','pray','mourn'].includes(q)){
  s.head=q==='listen'?Number(f%3===1):q==='mourn'?2:0;
  if(q==='talk'||q==='negotiate')hands([-5,2+w,8+p*2],[5,1,5]);
  if(q==='greet'||q==='salute')hands([-6,1,9+Math.sin(t*Math.PI)*6],[5,1,5]);
  if(q==='order'||q==='warn'||q==='arrest')hands([-5,3+p*4,9],[5,1,6]);
  if(q==='inspect')hands([-3,4,9],[3,4,8]);
  if(q==='pray'||q==='mourn'){hands([-1,3,11],[1,3,11]);s.head=2;s.sit=q==='mourn'?2:0;}
 }
 if(['sit_down','seated','stand_up'].includes(q)){s.seated=q==='sit_down'?t:q==='stand_up'?1-t:1;s.sit=0;hands([-5,3,6],[5,3,6]);}
 if(q==='eat'){hands([-2,2,8+p*6],[2,3,8]);s.head=p>0.7?1:0;}
 if(q==='drink'){hands([-3,1,8+p*7],[5,1,5]);s.head=p>.7?-1:0;}
 if(q==='cower'||q==='wounded'){s.sit=2;s.head=1;hands([-5,1,13],[5,1,13]);}
 if(q==='startle'){hands([-6,0,10+f],[6,0,10+f]);s.bob=f===1?-1:0;}
 if(q==='hit'||q==='armed_hit'){s.lean=[-1,-2,-1,-1,0][f];s.bob=f===1?1:0;hands([-6,-1,7],[6,-1,7]);}
 if(['death','armed_death','lie_down','sleep','wake'].includes(q)){const phase=q==='sleep'?1:q==='wake'?1-t:t;s.angle=q==='death'||q==='armed_death'?[0,0,0,15,38,68,90,90][f]:round(phase*90);s.sit=s.angle===0?Math.min(f,3):1;s.head=q==='sleep'?Number(f%2):0;hands([-5,0,5],[5,0,5]);}
 if(q==='surrender'){hands([-6,0,7+Math.min(t*2,1)*9],[6,0,7+Math.min(t*2,1)*9]);s.head=1;}
 const work={
  clear_snow:()=>{const h=[5,3,2,5,10,12,8,5][f];hands([-3,4+(f<3?f:2),h],[3,3+(f<3?f:2),h+3]);s.sit=[0,1,2,2,1,0,0,0][f];s.lean=f>=3&&f<=5?-1:0;},
  deice_trough:()=>{hands([-4,4,[10,12,13,6,6,8,10,10][f]],[4,3,6]);s.lean=f===3?1:0;},
  stoke_fire:()=>{hands([-3,2+[0,1,2,3,4,4,2,0][f],[7,7,6,5,4,4,6,7][f]],[3,2+[0,1,2,3,4,4,2,0][f],[7,7,6,5,4,4,6,7][f]]);s.sit=f>=2&&f<=5?1:0;},
  warm_hands:()=>{hands([-2,4,9+(f%3===1?1:0)],[2,4,9+(f%3===2?1:0)]);s.head=f%4===1?1:0;},
  hoe:()=>{hands([-4,4+p*4,12-p*7],[2,3+p*3,9-p*3]);s.lean=p;s.sit=p;},
  sow:()=>hands([-4,4+p*3,7-p*4],[4,3,6]),
  harvest:()=>hands([-5+w*2,5+p*4,5],[3,4,5]),
  uproot:()=>{hands([-3,5,3+p*3],[3,5,3+p*3]);s.sit=2+p;},
  bundle:()=>{hands([-3+w,4,5],[3-w,4,5]);s.sit=2;},
  irrigate:()=>{hands([-3,4+w,9-p*4],[3,5+w,6]);s.lean=w/2;},
  harvest_fruit:()=>{hands([-4,4,10+p*7],[4,4,5]);s.head=-1;},
  prune:()=>hands([-5+w,5,13+p*3],[4,3,8]),
  cut_fiber:()=>{hands([-5+w,5,4],[3,5,5]);s.sit=2;},
  feed:()=>hands([-4,3+p*5,6],[4,3,7]),
  herd:()=>hands([-5,3,8+p],[4,1,5]),
  milk:()=>{hands([-3,5,4+f%2],[3,5,4+(f+1)%2]);s.sit=4;},
  shear:()=>{hands([-3+w,5,6],[3,5,5]);s.sit=2;},
  skin:()=>{hands([-4+w*2,5,6],[3,5,5]);s.sit=1;},
  net:()=>hands([-4-w,4,8],[4+w,4,8]),
  cast_net:()=>hands([-4-t*2,2+Math.sin(t*Math.PI)*6,10+Math.sin(t*Math.PI)*4],[4+t*2,2+Math.sin(t*Math.PI)*6,10+Math.sin(t*Math.PI)*4]),
  haul_net:()=>{hands([-4,7-p*5,5+p*4],[4,7-p*5,5+p*4]);s.lean=-p;},
  fell:()=>{hands([-3,1+p*7,14-p*7],[1,1+p*5,12-p*5]);s.lean=p;},
  hew:()=>{hands([-2,2+p*5,15-p*10],[1,1+p*4,13-p*7]);s.sit=p;},
  saw:()=>{hands([-4,3+w*1.4,6],[3,4+w*1.4,6]);s.lean=w/2;},
  resin:()=>hands([-4,5,10+w],[4,4,6]),
  pitch:()=>hands([-3+w,5,7],[4,2,5]),
  charcoal_load:()=>hands([-3,3+p*5,5+p*2],[3,3+p*5,5+p*2]),
  charcoal_rake:()=>hands([-3,3+w*2,8],[3,4+w*2,5]),
  mine:()=>{hands([-2,1+p*7,15-p*8],[2,1+p*5,12-p*5]);s.lean=p;},
  shovel:()=>{hands([-3,3+w,6+p*5],[3,5+w,3+p*5]);s.sit=1-p;},
  sort:()=>hands([-4+w*1.5,4,6],[4,4,6]),
  pan_gold:()=>{hands([-3+w,5,5],[3+w,5,5]);s.sit=3;},
  quarry:()=>{hands([-2,1+p*6,14-p*7],[2,1+p*5,12-p*5]);s.lean=p;},
  stonecut:()=>hands([-4,4,6+p*5],[3,5,5]),
  rake_salt:()=>hands([-3,4+w*2,8],[3,5+w*2,5]),
  sieve:()=>hands([-3+w,4,7],[3+w,4,7]),
  bellows:()=>{hands([-3,4,5+p*4],[3,4,5+p*4]);s.lean=p;},
  forge:()=>hands([-4,4,6+(1-p)*7],[4,5,6]),
  smelt:()=>hands([-3,3+p*3,9-p],[3,3+p*3,9-p]),
  quench:()=>hands([-3,4,10-p*6],[3,4,9-p*6]),
  joinery:()=>hands([-4,4,6+(1-p)*5],[3,5,5]),
  pottery:()=>{hands([-2,4,5+f%2],[2,4,5+(f+1)%2]);s.sit=3;},
  knead:()=>hands([-3,4,7-p*2],[3,4,7-p*2]),
  kiln_load:()=>hands([-3,3+p*5,7],[3,3+p*5,7]),
  glass_blow:()=>hands([-3,4,13],[3,7,12]),
  glass_roll:()=>hands([-3,4+w,7],[3,7+w,7]),
  spin:()=>hands([-3,3,7+w],[3,3,12]),
  loom:()=>hands([-3-w,4,7],[3+w,4,8]),
  stitch:()=>{hands([-2+w,3,9+f%2],[2,3,8]);s.head=1;},
  weave:()=>{hands([-3+w,4,6],[3-w,4,6]);s.sit=2;},
  tan:()=>hands([-3,4+w,8],[3,5+w,7]),
  stretch_hide:()=>hands([-4-p,4,10],[4+p,4,10]),
  stir:()=>hands([-3+w,5,7],[4,2,5]),
  dye_dip:()=>hands([-3,4,11-p*6],[3,4,11-p*6]),
  wring:()=>hands([-3+w,4,8+f%2],[3-w,4,8+(f+1)%2]),
  hang:()=>hands([-4,4,9+p*7],[4,4,9+p*7]),
  twist_rope:()=>hands([-4-w,4,8],[4+w,4,8]),
  rope:()=>hands([-3,4+w,8],[3,4-w,7]),
  draw_water:()=>{hands([-2,4,7+w*2],[2,4,7-w*2]);s.lean=w/3;},
  pour:()=>hands([-3,4,9+p*3],[3,4,8]),
  mill_feed:()=>hands([-3,3+p*3,6+p*3],[3,3+p*3,6+p*3]),
  mill_collect:()=>{hands([-3,4,5],[3,4,5]);s.sit=2;},
  press_oil:()=>{hands([-3,4,11-p*5],[3,4,11-p*5]);s.lean=p;},
  chop_food:()=>hands([-3,4,6+(1-p)*3],[3,4,5]),
  cook:()=>hands([-3+w,5,7],[4,2,5]),
  salt_food:()=>hands([-3,4,8],[3,4,5]),
  pack_food:()=>hands([-3+w,4,6],[3-w,4,6]),
  smoke_hive:()=>hands([-4,4,8+p],[4,4,6]),
  honey:()=>hands([-3,4,9],[3,4,7]),
  wax:()=>hands([-3+w,4,7],[3+w,4,7]),
  medicinal:()=>hands([-3+w,4,7],[3,4,6]),
  mortar:()=>hands([-1,4,6+(1-p)*4],[3,4,5]),
  bandage:()=>{hands([-2+w,5,5],[2-w,5,5]);s.sit=3;},
  masonry:()=>hands([-4,5,7+w],[3,4,5]),
  repair_boat:()=>{hands([-4,5,6+(1-p)*4],[3,5,5]);s.sit=1;},
  coat_pitch:()=>hands([-4,5,8+w],[3,4,5]),
  lash:()=>hands([-3,4+w,6],[3,4-w,6]),
  groom:()=>hands([-4,5,8+w],[4,2,5]),
  drive:()=>hands([-3,5,7+w/2],[3,5,7-w/2]),
  row:()=>{hands([-3,4+w*2,8],[3,5+w*2,8]);s.lean=-w/2;},
  pole:()=>hands([-3,3+w*2,12],[3,4+w*2,7]),
  helm:()=>hands([-3,5+w,8],[3,5+w,8]),
  ledger:()=>hands([-2+w/2,4,8],[3,4,7]),
  weigh:()=>hands([-3,4,7+p*3],[3,4,6]),
  count:()=>hands([-3+w,4,6],[3,4,6]),
  handover:()=>hands([-3,2+p*5,7],[4,1,5]),
  message:()=>hands([-3,2+p*5,9],[4,1,5])
 };
 if(work[q]){work[q]();s.custom=true;}
 if(q==='carry'||q==='load'||q==='put_down'){const h=q==='load'?4+t*4:q==='put_down'?8-t*5:8;hands([-3,4,h],[3,4,h]);s.sit=q==='load'?(1-t)*3:q==='put_down'?t*3:0;s.custom=true;}
 if(['mount','ride','ride_trot','dismount','mounted_cut','mounted_thrust'].includes(q)){s.mounted=q==='mount'?t:q==='dismount'?1-t:1;s.sit=0;s.rootY=1+round(2*(1-s.mounted));s.rootX=-round(9*(1-s.mounted));s.bob=q==='ride_trot'?bob[f%8]:0;hands([-3,4,8],[3,4,8]);s.custom=true;}
 if(q==='dress'||q==='hat_on'){const u=Math.sin(t*Math.PI);hands([-5,0,6+u*12],[5,0,6+u*12]);s.custom=true;}
 if(q==='armed_idle'||q==='armed_walk'||q==='weapon_guard'){hands([-5,3,9],[5,3,8]);if(q!=='armed_walk')s.bob=f===1||f===2?1:0;s.custom=true;}
 if(['guard_raise','guard_hold','block','guard_break'].includes(q)){const u=q==='guard_raise'?t:1;hands([-5,2,8],[3,5,7+u*5]);s.lean=q==='block'?-2*(1-t):q==='guard_break'?-t:0;s.sit=q==='guard_break'?t*2:0;if(q==='guard_hold')s.bob=f===1||f===2?1:0;s.custom=true;}
 if(q==='draw'||q==='sheathe'){const u=q==='draw'?1-t:t;hands([-5+u*3,1,8+u*6],[5,2,7]);s.custom=true;}
 if(q==='disarm'){hands([-4,3,8-t*5],[4,3,8-t*5]);s.sit=t*2;s.custom=true;}
 if(C.ATTACKS.has(id)||q==='crossbow_reload'){
  const charge=[0,.6,1,1,.8,.5,.2,0][f%8],strike=f===3||f===4;
  if(q==='spear_thrust'||q==='mounted_thrust')hands([-4,strike?9:1-charge*2,9],[3,strike?5:1,8]);
  if(['blade_cut','blade_reverse','mounted_cut','staff_sweep'].includes(q)){const sign=q==='blade_reverse'?-1:1;hands([-4+sign*(f<3?-charge*3:strike?4:charge*2),strike?7:2,9+(f<3?charge*4:0)],[4,2,7]);}
  if(q==='axe_chop')hands([-2,strike?7:0, strike?6:10+charge*6],[2,strike?4:0,strike?7:9+charge*5]);
  if(q==='bow_shot')hands([-4,7,12],[2,strike?2:2-charge*3,12]);
  if(q==='crossbow_shot')hands([-4,6,10],[2,4,10]);
  if(q==='crossbow_reload'){hands([-3,4,6],[3,4,6+charge*3]);s.sit=charge;}
  if(q==='javelin_throw')hands([-5,f<3?-charge*4:strike?8:3,11+charge*4],[5,1,7]);
  if(!q.startsWith('mounted'))s.lean=strike?1:-charge/2;s.custom=true;
  if(C.ATTACKS.has(id)&&f>=5){const hit=pose(id,4),rest=pose('armed_idle',0),u=(f-4)/3;for(const hand of ['right','left'])s[hand]=hit[hand].map((v,i)=>lerp(v,rest[hand][i],u));s.lean=lerp(hit.lean,rest.lean,u);}
 }
 return s;
}
const liveryColors={royal:['b9a27a','786950','494439'],household:['ac7865','765145','4a3734'],militia:['9b9871','68694e','444833'],city:['86a0b2','587587','394d60'],contract:['b19b77','80694e','514536'],valley:['a08a70','6e5d4b','443d37'],passage:['96a4ad','647b89','40545e'],urban:['cfb77d','9e8051','6e563a'],rider:['b99a6a','8d704b','604b37'],trail:['d7c38d','a18d5f','705e42'],port:['87a29a','52786f','34554d'],local:['8b9c74','5e7453','3e513b'],crew:['9a9fb4','616d8b','414760'],watchers:['70b0a9','44837f','2f595b']};
function outfitFor(role,sex,climate,override){if(override){const o=S.outfits[override];if(!o||o.sex!==sex)throw RangeError('Corps incompatible');return o;}if(role.body&&sex==='masculin')return S.outfits[role.body];const prefix=C.CLIMATES[climate].prefix,cut=String(role.cut);if(cut.startsWith('TR'))return S.outfits[(climate==='tempere'?cut:prefix+'0'+({TR01:1,TR02:3,TR03:3,TR04:3}[cut]))+'-masculin'];return S.outfits[prefix+'0'+cut+'-'+sex];}
function nativeColors(o){const colors=[];for(const l of o.layers)if(/HABIT 12/.test(l.name))for(const g of l.views)if(g)for(const color of g.palette)if(!['100c14','100e20'].includes(color)&&!colors.includes(color))colors.push(color);return colors.sort((a,b)=>parseInt(b,16)-parseInt(a,16));}
const materialCache=new WeakMap();
function materials(o){if(materialCache.has(o))return materialCache.get(o);const colors=nativeColors(o),out={cloth:colors};materialCache.set(o,out);return out;}
function bodyTransform(s,dir,kind){return (x,y)=>{const side=dir==='droite'||dir==='gauche',sign=dir==='gauche'?-1:1;let X=x,Y=y;const by=s.bob+round(s.sit*.65);
 if(kind==='head'){X+=side?round(s.lean)*sign:0;Y+=by+s.head;}
 else if(kind==='feet'||kind==='legs'){const f=clamp((y-48)/3,0,1),leg=x<40?1:-1;if(side){X+=round(s.step*f*sign);Y-=round(Math.max(0,s.lift)*f);}else Y-=round(Math.max(0,s.lift*leg)*f);if(s.sit){X+=side?round(s.sit*.55*f)*sign:round(s.sit*.25*f)*leg;Y+=round(by*Math.max(0,(49-y)/4));}}
 else{const f=clamp((50-y)/5,0,1);X+=side?round(s.lean*sign*f):0;Y+=round(by*f);if(kind==='arms'){const f=clamp((y-44)/4,0,1);X+=side?round(-s.step*.5*sign*f):0;Y-=!side?round(Math.max(0,-s.step*(x<40?1:-1))*.3*f):0;}}
 if(s.reachShift&&!['feet','legs'].includes(kind)){const f=kind==='head'?1:clamp((50-y)/5,0,1);X+=round(s.reachShift[0]*f);Y+=round(s.reachShift[1]*f);}
 return [round(X)+(s.rootX||0),round(Y)+(s.rootY||0)];};}
function recolorHair(color,target){const i=C.HAIR.brun.indexOf(color);return i<0?color:C.HAIR[target][i];}
function headgear(id,dir,s,role){
 const out={rear:new Pixels(),front:new Pixels(),mask:new Pixels()},d=directions.indexOf(dir),transform=bodyTransform(s,dir,'head');
 const native=S.helmets[id]||S.modules[id];
 if(native){for(const l of native.layers){const plane=/MASQUE/.test(l.name)?'mask':/COIFFE 20|Nuque/.test(l.name)?'rear':'front';out[plane].stamp(decode(l.views[d]),transform);}return out;}
 if(!id)return out;
 const back=dir==='dos',side=dir==='droite'||dir==='gauche',F=out.front,R=out.rear,M=out.mask;
 const at=(x,y)=>transform(dir==='gauche'?79-x:x,y),rect=(b,x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)b.set(...at(x+i,y+j),c);},line=(b,x,y,X,Y,c)=>{const a=at(x,y),z=at(X,Y);b.line(...a,...z,c);};
 const cloth=C.CLIMATES[role.climate||'tempere'].cloth;
 const cap=(a,b,c)=>{rect(F,35,31,9,2,INK);rect(F,33,33,13,4,INK);rect(F,34,33,11,3,b);rect(F,36,32,7,1,a);rect(F,34,36,11,1,c);rect(M,32,26,15,12,'ffffff');};
 if(id==='straw'){cap('ead091','bba566','8a7545');rect(F,30,36,20,2,INK);rect(F,31,36,18,1,'d7bb78');rect(F,35,34,10,1,'a08452');}
 else if(id==='kerchief'||id==='desert_wrap'){cap('e4d4ad','b5a47c','7d7258');rect(R,43,36,4,8,'a49575');rect(R,44,43,2,3,INK);if(id==='desert_wrap'){rect(R,32,37,3,9,'b5a47c');if(!back)rect(F,34,40,12,2,'cfbd95');}}
 else if(id==='linen_cap'){cap('e7ddbd','c5b99a','95896e');rect(F,34,37,12,1,'eee3c5');}
 else if(id==='work_cap'||id==='felt'){cap('baa17f','8d795f','5f5143');if(id==='felt')rect(F,33,36,13,2,'695b4e');}
 else if(id==='leather_cap'){cap('b38b59','826044','4f3d31');line(F,39,32,39,36,'c0a279');rect(R,33,36,2,5,'66503d');rect(R,44,36,2,5,'66503d');}
 else if(id==='hood'||id==='rain'){cap(cloth[0],cloth[1],cloth[2]);rect(R,31,34,3,10,INK);rect(R,32,35,2,10,cloth[1]);rect(R,45,34,3,10,INK);rect(R,45,35,2,10,cloth[2]);rect(R,33,43,12,2,cloth[2]);if(id==='rain'){rect(F,30,36,19,2,INK);rect(F,31,36,17,1,cloth[0]);}}
 else if(id==='beekeeper'){cap('e7d7a7','b6a67d','8c7b5c');rect(F,31,36,18,2,INK);rect(F,32,36,16,1,'d8c694');for(let y=38;y<46;y++)for(let x=32;x<48;x++)if((x+y)%3===0)F.set(...at(x,y),'aaa78a');line(F,32,38,32,45,'d4c9a5');line(F,47,38,47,45,'d4c9a5');line(F,32,45,47,45,'b6aa88');}
 else if(id==='open_cap'||id==='desert_helmet'){cap('dce3de','8e9c9e','53616b');rect(F,33,36,13,2,'6d777a');rect(F,36,32,1,4,'c6d3d0');}
 else if(id==='sailor'){cap('a8b8b9','72898d','475e68');rect(F,33,36,13,2,'d0c29a');}
 else if(id==='ritual'){rect(F,32,35,15,2,INK);rect(F,33,35,13,1,'c5a34e');if(!back){rect(F,39,36,2,3,'5a9c7a');F.set(...at(39,36),'c9e6a3');}}
 else throw RangeError('Coiffe inconnue : '+id);
 return out;
}
return Object.freeze({S,C,Pixels,round,clamp,lerp,INK,decode,directions,direction,project,category,frameAt,eventsBetween,pose,outfitFor,materials,bodyTransform,recolorHair,headgear,liveryColors});
});
