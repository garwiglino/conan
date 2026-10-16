// Fictional 96-day year: local climate, reproducible fronts, smooth biome boundaries.
const BIOME_CLIMATE=Atlas.climateProfiles;
function climateAt(clock,biome=6,height=20){
 const p=BIOME_CLIMATE[biome]||BIOME_CLIMATE[6],day=clock/1440,season=(day%96+96)%96/96;
 const summer=Math.sin(season*Math.PI*2),wetSeason=skySmooth(.0,.65,summer),cycle=dayCycle(clock);
 const temperature=Atlas.airTemperature(clock,biome,height);
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
