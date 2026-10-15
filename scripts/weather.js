// One clock and one weather state drive colour, lamps, wildlife, rain and sound.
const DAY_LEN=480,CLOCK_START=8*60,WEATHER_WIN=240;
const SKY_KEYS=[[0,[78,92,156]],[5,[78,92,156]],[6,[128,112,166]],[7.2,[238,183,158]],
 [8.2,[255,225,194]],[9,[255,255,255]],[16,[255,255,255]],[17,[255,232,202]],
 [18,[248,207,164]],[19.5,[220,155,142]],[21,[142,119,166]],[23,[78,92,156]],[24,[78,92,156]]].map(([h,c])=>[h/24,c]);
function skySmooth(a,b,x){const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);}
function dayCycle(clock=CLOCK_START){
 const hour=((clock/60)%24+24)%24,phase=hour/24;
 const period=hour<5||hour>=23?'night':hour<9?'dawn':hour<16?'day':hour<18?'lateDay':'dusk';
 const night=period==='night'?1:period==='dawn'?1-skySmooth(5,9,hour):period==='day'?0:
  period==='lateDay'?.28*skySmooth(16,18,hour):.28+.72*skySmooth(18,23,hour);
 let a=SKY_KEYS[0],b=SKY_KEYS[1];for(let i=1;i<SKY_KEYS.length;i++)if(phase<=SKY_KEYS[i][0]){a=SKY_KEYS[i-1];b=SKY_KEYS[i];break;}
 const u=skySmooth(a[0],b[0],phase),tint=a[1].map((v,i)=>v+(b[1][i]-v)*u);
 return {hour,phase,period,night,tint};
}
function weatherFront(k){
 // The opening morning is dry. Subsequent fronts have no dependency on hour of day.
 const r=k===0?0:hash(k,7,2026),kind=r<.36?'clear':r<.55?'light':r<.79?'steady':r<.91?'shower':'storm';
 const rain={clear:0,light:.24,steady:.52,shower:.9,storm:.96}[kind];
 return {kind,rain,cloud:kind==='clear'?.12*hash(k,4,78):.3+rain*.7,
  wind:kind==='clear'?.12:.18+rain*.62,cell:.2+hash(k,9,116)*.35,short:hash(k,8,116)>.45};
}
function skyAt(clock=CLOCK_START){
 const cycle=dayCycle(clock),w=(clock-CLOCK_START)/WEATHER_WIN,k=Math.floor(w),u=w-k,a=weatherFront(k),b=weatherFront(k+1),blend=skySmooth(.76,1,u);
 // Showers can peak briefly. Steady rain stays sustained and need never produce thunder.
 const ar=a.rain*(a.kind==='shower'?.5+.5*(skySmooth(.08,.22,u)*(1-skySmooth(.52,.72,u))):1),br=b.rain*(b.kind==='shower'?.5:1);
 let rain=ar+(br-ar)*blend,cloud=a.cloud+(b.cloud-a.cloud)*blend,wind=a.wind+(b.wind-a.wind)*blend;
 const duration=a.short?.16:.32,cell=skySmooth(a.cell,a.cell+.035,u)*(1-skySmooth(a.cell+duration-.04,a.cell+duration,u));
 const storm=a.kind==='storm'?cell:0;
 const gust=.5+.5*Math.sin(clock*.021);wind=clamp(wind*(.8+.2*gust),0,1);
 const level=rain<.04?'dry':rain<.35?'light':rain<.7?'steady':'downpour';
 return {...cycle,rain:clamp(rain,0,1),cloud,wind,storm,level,front:k,kind:a.kind};
}
function weatherTint(sky,flash=0){
 const cold=[.61,.69,.8],wet=sky.cloud*.38+sky.rain*.32;
 return sky.tint.map((v,i)=>{const shaded=v*(1-wet*(1-cold[i]));return Math.round(shaded+([216,228,248][i]-shaded)*flash*(.46+.3*sky.night));});
}
class StormSystem{
 constructor(){this.time=0;this.serial=0;this.next=6;this.strike=null;this.pending=[];this.front=null;}
 clear(){this.strike=null;this.pending=[];this.next=this.time+6;}
 step(dt,sky,listener,active=true){
  this.time+=Math.max(0,dt);if(!active){this.clear();return [];}
  if(this.strike&&this.time-this.strike.at>1.1)this.strike=null;
  if(this.front!==sky.front){this.front=sky.front;this.next=Math.max(this.next,this.time+2+hash(sky.front,3,66)*5);}
  if(sky.storm>.4&&this.time>=this.next){
   const seed=++this.serial,near=hash(seed,sky.front,41)>.55,distance=near?.18+hash(seed,1,34)*.4:.65+hash(seed,2,35)*.35;
   const pan=(hash(seed,sky.front,62)*2-1)*.82,strength=.62+hash(seed,5,54)*.32;
   this.strike={at:this.time,pan,strength,x:listener.x+pan*200,y:listener.y-130,distance};
   this.pending.push({due:this.time+.32+distance*2.3,pan,strength,near});
   this.next=this.time+7+hash(seed,sky.front,73)*11;
  }
  const due=this.pending.filter(v=>v.due<=this.time);this.pending=this.pending.filter(v=>v.due>this.time);return due;
 }
 flash(reduced=false){if(!this.strike)return 0;const age=this.time-this.strike.at;
  // One broad pulse, no rapid strobe; the system accessibility preference softens it further.
  return this.strike.strength*skySmooth(0,.07,age)*(1-skySmooth(.12,.85,age))*(reduced?.16:1);
 }
}
