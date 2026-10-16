// Fictional 96-day year: local climate, reproducible fronts, smooth biome boundaries.
const BIOME_CLIMATE=[
 {temp:15,range:5,wet:.34,fog:.18,family:'coast'},
 {temp:29,range:8,wet:.035,fog:.01,family:'desert'},
 {temp:9,range:15,wet:.08,fog:.025,family:'desert'},
 {temp:25,range:4,wet:.09,monsoon:.55,fog:.06,family:'steppe'},
 {temp:12,range:16,wet:.25,fog:.12,family:'steppe'},
 {temp:26,range:3,wet:.12,monsoon:.62,fog:.18,family:'tropical'},
 {temp:12,range:13,wet:.40,fog:.24,family:'forest'},
 {temp:27,range:2,wet:.62,monsoon:.19,fog:.25,family:'tropical'},
 {temp:11,range:8,wet:.56,fog:.32,family:'forest'},
 {temp:0,range:15,wet:.36,fog:.16,family:'boreal'},
 {temp:-8,range:11,wet:.22,fog:.12,family:'polar'},
 {temp:-22,range:7,wet:.16,fog:.07,family:'polar'},
 {temp:18,range:7,wet:.48,fog:.55,family:'wetland'}
];
function climateAt(clock,biome=6,height=20){
 const p=BIOME_CLIMATE[biome]||BIOME_CLIMATE[6],day=clock/1440,season=(day%96+96)%96/96;
 const summer=Math.sin(season*Math.PI*2),wetSeason=skySmooth(.0,.65,summer),cycle=dayCycle(clock);
 const temperature=p.temp+p.range*summer+2*Math.sin((cycle.hour-8)/24*Math.PI*2)-Math.max(0,height-65)*.18;
 const probability=clamp(p.wet+(p.monsoon||0)*wetSeason,.01,.9),k=Math.floor((clock-CLOCK_START)/WEATHER_WIN),u=(clock-CLOCK_START)/WEATHER_WIN-k;
 const front=n=>{const r=n===0?0:hash(n,biome+41,2081),wet=r>1-probability;
  const strength=wet?(.18+.78*hash(n,biome+19,805))*(p.monsoon&&wetSeason>.4?1.18:1):0;
  return {water:clamp(strength,0,1),wind:.12+hash(n,8,370)*.33+(strength>.7?.35:0),fog:hash(n,biome,711)<.48?p.fog:0};};
 const a=front(k),b=front(k+1),blend=skySmooth(.72,1,u),mix=key=>a[key]+(b[key]-a[key])*blend;
 const precipitation=mix('water'),snowFraction=1-skySmooth(-1,2,temperature),snow=precipitation*snowFraction,rain=precipitation*(1-snowFraction),wind=mix('wind');
 const blizzard=snow*skySmooth(.42,.8,wind),fog=clamp(mix('fog')*(.4+.6*cycle.night)+blizzard*.55,0,.7);
 // Thunder cells fade inside the front, never accompany snowfall.
 const cellStart=.08+hash(k,biome,90)*.4,storm=rain>.65&&temperature>8&&hash(k,biome,88)>.6?skySmooth(cellStart,cellStart+.06,u)*(1-skySmooth(cellStart+.18,cellStart+.30,u))*rain:0;
 return {...cycle,temperature,season,monsoon:wetSeason*(p.monsoon||0),rain,snow,blizzard,fog,wind,cloud:clamp(.12+precipitation*.8+fog*.25,0,1),storm,front:k,biome,family:p.family,level:snow>.02?'snow':rain<.04?'dry':rain<.35?'light':rain<.7?'steady':'downpour',kind:snow>.02?'snow':rain>.7?'shower':rain>.03?'steady':'clear'};
}
function worldClimateAt(clock,x,y){
 const env=Atlas.environment(x,y),cell=Atlas.cellAt(x,y),parts=env.mix.length?env.mix:[{biome:env.biome,weight:1}],out=climateAt(clock,env.biome,cell?.height||20);
 const samples=parts.map(p=>({...climateAt(clock,p.biome,cell?.height||20),weight:p.weight}));
 for(const key of ['rain','snow','blizzard','fog','wind','cloud','storm','temperature'])out[key]=samples.reduce((sum,p)=>sum+p[key]*p.weight,0);
 out.family=parts.some(p=>p.cursed&&p.weight>=.5)?'cursed':out.family;return out;
}
Game.prototype.sky=function(){
 const p=Atlas.toWorld(this.player.x,this.player.y),key=[this.clock,p.x,p.y].join(':');
 if(this._localSkyKey!==key){this._localSkyKey=key;this._sky=worldClimateAt(this.clock,p.x,p.y);}return this._sky;
};
