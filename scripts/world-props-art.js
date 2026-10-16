/* Authored pixel silhouettes, shared 64 × 64 buffers, feet anchored at 32,56.
 * Foliage is painted in lit clusters, never independent random colour pixels.
 * Variants keep the same north-west light; no mirrored shadows.
 */
const WORLD_FOLIAGE={
 oak:['#172a25','#253d2d','#385232','#526d3d','#71894d','#96a469','#bac38b'],
 birch:['#253328','#3e4b2e','#5b6939','#7b8745','#9fa356','#bdbe77','#d8d49c'],
 pine:['#172c2a','#25423a','#365a44','#4f7253','#70916a','#95ac87','#bed0ac'],
 jungle:['#15352e','#245039','#396b43','#52874b','#73a25c','#a0bd79','#cccf9b'],
 cypress:['#24332d','#394b36','#52633e','#6d7b48','#8d975b','#adb377','#c9c893'],
 cursed:['#282331','#3b3046','#51435c','#6c5971','#867389','#a595aa','#c0b6c6']
};
const WORLD_STONE=['#252c33','#3e4851','#58636d','#74828a','#98a3a5','#bec5bf','#e0dfce'];
const WORLD_SNOW=['#4a6774','#66828d','#839fa7','#a3b9ba','#c2d0ca','#dce1d2','#f0eedc'];
function worldLeafCluster(b,cx,cy,rx,ry,P,seed){
 for(let y=Math.floor(cy-ry-2);y<=cy+ry+2;y++)for(let x=Math.floor(cx-rx-2);x<=cx+rx+2;x++){
  const dx=(x-cx)/rx,dy=(y-cy)/ry,angle=Math.atan2(dy,dx),edge=1+.07*Math.sin(angle*9+seed)+.035*Math.sin(angle*17),d=dx*dx+dy*dy;if(d>edge)continue;
  const light=-dx*.5-dy*.8,cluster=hash(Math.floor((x+seed%3)/3),Math.floor(y/3),seed),curl=(x+2*y+Math.floor(cluster*3))%5;
  let k=d>.84?(light>.12?3:1):light>.4?5:light>-.2?4:light>-.6?3:2;
  if(d<.83&&cluster>.72&&curl<2)k++;if(d<.8&&cluster<.18&&curl===3)k--;
  b.set(x,y,P[clamp(k,0,6)],P[0]);
 }
}
function worldTrunk(b,variant=0,P=RAMP.wood){
 b.shadow(35,57,18,4);const M=new Uint8Array(4096),lean=variant===1?3:-2;
 strokeMask(M,64,64,[[30,56],[32,42],[31+lean,23]],3,1.4);
 strokeMask(M,64,64,[[31,43],[22,32],[20,22]],2,1);
 strokeMask(M,64,64,[[32,38],[42,29],[44,20]],2,1);
 b.shadeMask(M,P,5,3,1,P[0]);b.line(30,48,28,56,P[5]);b.line(34,50,39,56,P[2]);b.line(32,38,32,51,P[2]);
}
for(let v=0;v<3;v++){
 PROPS['world_oak_'+v]=b=>{worldTrunk(b,v);const P=WORLD_FOLIAGE[v===2?'birch':'oak'];for(const [x,y,rx,ry]of [[19,32,11,9],[43,31,12,10],[32,36,14,10],[20,20,13,11],[42,18,12,10],[31,11,12,9]])worldLeafCluster(b,x+(v===1?2:0),y+(v===2?2:0),rx,ry,P,830+v+x);};
 PROPS['world_pine_'+v]=b=>{b.shadow(35,57,15,4);blockTier(b,30,33,38,4,14,RAMP.wood);const P=WORLD_FOLIAGE.pine;for(const [cy,rx,ry]of [[44,18,6],[35,15,6],[26,12,5],[18,9,4],[10,5,4]]){
   for(let y=cy-10;y<=cy+ry;y++)for(let x=32-rx-1;x<=32+rx+1;x++){const width=rx*clamp((y-cy+11)/(10+ry),.05,1),dx=x-32;if(Math.abs(dx)>width||y>cy+ry-Math.abs(dx)*.15)continue;let k=dx<0?4:2;if(y<cy-5)k++;if(modWorld(x+y,5)===0&&y>cy-2)k--;b.set(x,y,P[clamp(k,0,6)],P[0]);}
   if(v===1){for(let y=cy-6;y<cy+1;y++)for(let x=32-rx;x<32+rx;x++){const dx=Math.abs(x-31),lim=rx*(y-cy+8)/11;if(dx<lim&&modWorld(x*3+y,9)>1)b.set(x,y,WORLD_SNOW[x<32?5:4],P[1]);}}
  }b.set(31,2,v===1?WORLD_SNOW[6]:P[5]);};
 PROPS['world_boulder_'+v]=b=>{b.shadow(35,57,13,4);rockTier(b,31,54,11,4,9,882+v,WORLD_STONE);rockTier(b,41,57,5,2,3,887+v,WORLD_STONE);if(v===1){for(let y=40;y<49;y++)for(let x=20;x<42;x++)if(b.solid(x,y)&&!b.solid(x,y-2))b.set(x,y,WORLD_SNOW[x<32?5:4]);}else if(v===2){for(const [x,y]of [[24,45],[29,43],[33,44],[24,49]])for(let dy=0;dy<2;dy++)for(let dx=0;dx<4;dx++)if(b.solid(x+dx,y+dy))b.set(x+dx,y+dy,WORLD_FOLIAGE.oak[dy?2:4]);}};
}
function modWorld(v,n){return (v%n+n)%n;}
PROPS.world_cypress=b=>{worldTrunk(b,1);for(const [a,c]of [[21,51],[42,54],[24,56],[39,48]]){b.line(31,45,a,c,RAMP.wood[1]);b.line(30,45,a-1,c-1,RAMP.wood[4]);}const P=WORLD_FOLIAGE.cypress;for(const [x,y,rx,ry]of [[22,30,11,9],[42,25,12,9],[30,16,13,12],[31,7,7,6]])worldLeafCluster(b,x,y,rx,ry,P,900+x);for(const [x,y,h]of [[13,32,10],[22,34,13],[40,29,12],[48,28,8]]){b.line(x,y,x-1,y+h,P[2]);b.line(x+1,y,x,y+h-2,P[4]);}};
PROPS.world_jungle=b=>{worldTrunk(b,0);const P=WORLD_FOLIAGE.jungle;for(const [x,y,rx,ry]of [[18,32,12,9],[44,30,13,9],[33,22,17,10],[22,16,12,9],[40,12,13,9],[29,7,9,5]])worldLeafCluster(b,x,y,rx,ry,P,940+x);b.line(42,23,43,41,P[1]);b.line(41,23,42,40,P[4]);b.line(42,40,38,46,P[3]);};
PROPS.world_fern=b=>{b.shadow(33,56,10,2);const P=WORLD_FOLIAGE.jungle;for(let j=0;j<7;j++){const ang=(j-3)*.35,ex=32+Math.sin(ang)*13,ey=54-Math.cos(ang)*14;b.line(32,55,ex,ey,P[2]);for(let k=2;k<=7;k++){const t=k/8,x=32+(ex-32)*t,y=55+(ey-55)*t,w=4*(1-t)+1;b.line(x,y,x-w,y-2,P[4]);b.line(x,y,x+w,y-1,P[j<3?5:3]);}}};
PROPS.world_reeds=b=>{b.shadow(34,57,10,3);const P=WORLD_FOLIAGE.cypress;for(let j=0;j<8;j++){const x=24+j*2,h=10+Math.floor(hash(j,0,960)*16);b.line(x,55,x-2,55-h,P[2]);b.line(x-1,54,x-3,56-h,P[4]);b.line(x,52,x+3,45,P[3]);if(j%3===0){b.line(x-2,54-h,x-2,59-h,RAMP.wood[2]);b.line(x-3,54-h,x-3,58-h,RAMP.wood[4]);}}};
PROPS.world_flowers=b=>{b.shadow(33,56,7,2);for(const [x,y,s]of [[27,53,0],[35,50,1],[39,55,0]]){b.line(x,y,x,y-5,WORLD_FOLIAGE.oak[3]);b.set(x-1,y-1,WORLD_FOLIAGE.oak[5]);b.set(x-1,y-5,s?'#ad88a7':'#c9b986');b.set(x+1,y-5,s?'#ad88a7':'#c9b986');b.set(x,y-6,s?'#dac1cc':'#eee0b1');b.set(x,y-5,'#d3ac64');}};
PROPS.world_mushrooms=b=>{b.shadow(34,57,7,2);for(const [x,y,r]of [[29,55,3],[36,57,2]]){b.line(x,y,x,y-3,'#c1b598');for(let dx=-r;dx<=r;dx++){b.set(x+dx,y-4,dx<0?'#af8168':'#795a50');if(Math.abs(dx)<r)b.set(x+dx,y-5,'#c29d7d');}b.set(x-1,y-5,'#e3cba1');}};
PROPS.world_log=b=>{b.shadow(34,57,15,3);for(let y=48;y<=55;y++)for(let x=18;x<=44;x++){const k=y===48?5:y===49?4:y===55?1:2+((x+2*y)%7===0?1:0);b.set(x,y,RAMP.wood[k]);}for(let y=-3;y<=3;y++)for(let x=-2;x<=2;x++)if(x*x/4+y*y/9<=1)b.set(44+x,51+y,RAMP.wood[x===0&&Math.abs(y)<2?2:5]);b.line(25,48,21,42,RAMP.wood[2]);b.line(26,48,22,42,RAMP.wood[4]);for(let x=20;x<36;x++)if(x%5<3)b.set(x,48,WORLD_FOLIAGE.oak[4]);};
PROPS.world_dead_cursed=b=>{worldTrunk(b,1,WORLD_STONE);const M=new Uint8Array(4096);for(const pts of [[[22,32],[15,25],[14,14]],[[33,29],[32,14],[38,7]],[[41,28],[48,19],[47,10]]])strokeMask(M,64,64,pts,1.8,.6);b.shadeMask(M,WORLD_STONE,5,3,1,WORLD_STONE[0]);b.line(31,42,29,48,'#8b73a0');b.set(30,49,'#c2a5d2');for(const [x,y]of [[16,16],[43,22],[34,34]]){b.set(x,y,'#80a48b');b.set(x+1,y+1,'#b8d1a2');}};
PROPS.world_gravel=b=>{for(const [x,y,rx]of [[27,55,2],[35,57,3],[39,54,1.5]]){b.shadow(x+1,y+1,rx+1,1);rockTier(b,x,y,rx,1,1,970+x,WORLD_STONE,false);}};
PROPS.world_frostgrass=b=>{b.shadow(33,57,6,1.5);for(let j=0;j<6;j++){const x=27+j*2,y=55-(j%3);b.line(x,56,x-2,y-3,WORLD_FOLIAGE.cypress[3]);b.line(x,56,x+1,y-4,WORLD_SNOW[3]);b.set(x+1,y-4,WORLD_SNOW[5]);}};

// Dormant broadleaf silhouette: no summer leaves protruding through winter snow.
PROPS.world_oak_winter=b=>{worldTrunk(b,0,WORLD_STONE);for(const [x,y]of [[20,22],[23,31],[29,26],[41,29],[43,20],[30,42]]){b.line(x-2,y,x+2,y,WORLD_SNOW[4]);b.line(x-1,y-1,x+1,y-1,WORLD_SNOW[6]);}};

for(const base of ['tent','world_cart','barrel','world_sign','column','column_b','rock_c'])PROPS['snow_'+base]=b=>{PROPS[base](b);for(let x=0;x<64;x++){for(let y=0;y<45;y++){if(!b.solid(x,y))continue;b.set(x,y,WORLD_SNOW[5]);if(b.solid(x,y+1))b.set(x,y+1,WORLD_SNOW[4]);break;}}};
