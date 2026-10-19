/* A journey keeps the wall clock while the game is hidden: the absence is replayed on return. */
const JOURNEY_FRAME=.04,JOURNEY_READ=1.6,JOURNEY_REPLAY_STEP=.25,JOURNEY_REPLAY_STEPS=20000;
// Screen seconds stepJourney needs to reach `until` (the end by default): each phase lasts its share of
// screenSeconds and stays readable 1.6 s, except a phase cut short by an interruption.
Game.prototype.journeyScreenLeft=function(until=null){const j=this.journey;if(!j)return 0;const stages=j.plan.stages,rate=j.plan.minutes/j.plan.screenSeconds,stop=until?until.index:stages.length;
 let left=Math.max(0,j.mealPause||0),label=null,minutes=0,read=0;
 for(let i=j.index;i<stages.length;i++){const s=stages[i],from=i===j.index?j.progress:0;
  if(s.label!==label){if(label!==null)left+=Math.max(minutes/rate,JOURNEY_READ-read);label=s.label;minutes=0;read=i===j.index&&j.readLabel===label?j.readTime||0:0;}
  if(i===stop)return left+(minutes+Math.max(0,until.progress-from))/rate;minutes+=s.minutes-from;}
 return label===null?left:left+Math.max(minutes/rate,JOURNEY_READ-read);};
// Clone runtime records without reconstructing the map, art or all the NPCs.
// Preserve aliases (party/actors/stations) but give the forecast its own campaign,
// caches and mutable collections. UI callbacks are never invoked by the replay.
Game.prototype.createJourneyForecast=function(){
 const copy=Object.create(Game.prototype),memo=new Map([[this,copy]]);
 const world=new Atlas.WorldState(JSON.parse(JSON.stringify(this.worldState.serialize())));world.weatherAt=worldClimateAt;
 memo.set(this.worldState,world);memo.set(this.worldState.simulation.state,world.simulation.state);
 const clone=value=>{if(!value||typeof value!=='object')return value;if(memo.has(value))return memo.get(value);let out;
  if(value instanceof Map){out=new Map();memo.set(value,out);for(const [k,v]of value)out.set(clone(k),clone(v));}
  else if(value instanceof Set){out=new Set();memo.set(value,out);for(const v of value)out.add(clone(v));}
  else if(ArrayBuffer.isView(value)){out=value.slice();memo.set(value,out);}
  else{out=Array.isArray(value)?[]:Object.create(Object.getPrototypeOf(value));memo.set(value,out);for(const k of Object.keys(value))out[k]=clone(value[k]);}return out;};
 // Map tiles are immutable during a journey. Mutable props still get independent records.
 memo.set(this.world.tiles,this.world.tiles);
 for(const k of Object.keys(this))if(!['worldStore','danger','atlas','journeyForecast'].includes(k))copy[k]=clone(this[k]);
 copy.atlas=new Atlas.ChunkStore();copy.worldState=world;copy.worldStore={readFor:()=>null,write:()=>{}};copy.danger=new WorldDanger(copy);copy.events=[];copy.journeyReplay=true;
 delete copy.journey.away;delete copy.journey.arrival;delete copy.journey.outcome;
 return {copy,seconds:0,steps:0};
};
Game.prototype.journeyForecastResult=function(job){const event=job.copy.events.filter(e=>e.type==='notice').at(-1),reason=event?.title||'Voyage interrompu';return {seconds:job.seconds,arrived:!job.copy.journey&&reason==='Arrivée à destination',reason,place:event?.text||''};};
// Synchronous diagnostic API; suspend uses the cooperative version below.
Game.prototype.forecastJourney=function(){if(!this.journey)return null;const job=this.createJourneyForecast();while(job.copy.journey&&job.steps++<200000){job.copy.stepJourney(JOURNEY_FRAME);job.seconds+=JOURNEY_FRAME;}return this.journeyForecastResult(job);};
Game.prototype.leaveJourney=function(now=Date.now()){
 const j=this.journey;if(!j)return null;
 if(this.journeyResuming){const replay=this.journeyResuming;replay.interrupted=true;return {pending:true,ready:replay.ready.then(()=>{const out=this.leaveJourney(now);return out?.ready||out;})};}
 if(Number.isFinite(j.away)){if(j.outcome)return {at:j.arrival,...j.outcome};if(this.journeyForecast?.journey===j&&!this.journeyForecast.cancelled)return {pending:true,ready:this.journeyForecast.ready};const departed=j.away;delete j.away;return this.leaveJourney(departed);}
 j.away=now;
 const job=this.createJourneyForecast();job.journey=j;
 Object.defineProperty(this,'journeyForecast',{value:job,writable:true,configurable:true});
 job.ready=new Promise(resolve=>{const run=()=>{try{
  if(job.cancelled||this.journey!==j||!Number.isFinite(j.away)){delete job.copy;resolve(null);return;}
  const start=performance.now();do{job.copy.stepJourney(JOURNEY_FRAME);job.seconds+=JOURNEY_FRAME;job.steps++;}while(job.copy.journey&&job.steps<200000&&performance.now()-start<6);
  if(job.copy.journey&&job.steps<200000){setTimeout(run,0);return;}
  const f=this.journeyForecastResult(job);j.arrival=now+Math.ceil(f.seconds*1000);j.outcome={arrived:f.arrived,reason:f.reason,place:f.place};delete job.copy;resolve({at:j.arrival,...j.outcome});
 }catch{delete job.copy;resolve(null);}};setTimeout(run,0);});
 return {pending:true,ready:job.ready};
};
// Replays the absence in quarter-second steps, with one save at the end. Past the announced time, the trip always ends.
Game.prototype.resumeJourney=function(now=Date.now()){
 const j=this.journey;if(!j||!Number.isFinite(j.away))return false;if(this.journeyResuming)return this.journeyResuming.ready;
 if(this.journeyForecast?.journey===j)this.journeyForecast.cancelled=true;
 const job={journey:j,finish:Number.isFinite(j.arrival)&&now>=j.arrival,left:Math.max(0,(now-j.away)/1000),away:j.away,seconds:0,steps:0,events:[]};
 Object.defineProperty(this,'journeyResuming',{value:job,writable:true,configurable:true});this.journeyReplay=true;
 job.ready=new Promise(resolve=>{const run=()=>{
  const start=performance.now();
  while(!job.interrupted&&this.journey===j&&(job.finish||job.left>1e-9)&&job.steps<JOURNEY_REPLAY_STEPS){
   const dt=job.finish?JOURNEY_REPLAY_STEP:Math.min(JOURNEY_REPLAY_STEP,job.left),queued=this.events.length;
   // Keep the absence marker while catching up: live input and rendering cannot advance the trip too.
   backgroundStepJourney.call(this,dt);job.events.push(...this.events.splice(queued));job.left-=dt;job.seconds+=dt;job.steps++;
   if(this.journey===j)j.away=Math.min(now,job.away+job.seconds*1000);
   if(performance.now()-start>=6){setTimeout(run,0);return;}
  }
  this.journeyReplay=false;delete this.journeyResuming;if(!job.interrupted||this.journey!==j){delete j.away;delete j.arrival;delete j.outcome;}
  this.events.push(...job.events.filter(e=>e.type!=='save'));this.emit('save');resolve(true);
 };setTimeout(run,0);});return job.ready;
};
// While away, frames that still run must not advance the trip a second time.
const backgroundStepJourney=Game.prototype.stepJourney;
Game.prototype.stepJourney=function(dt){if(Number.isFinite(this.journey?.away))return;return backgroundStepJourney.call(this,dt);};
const backgroundStartJourney=Game.prototype.startJourney;
Game.prototype.startJourney=function(plan){const started=backgroundStartJourney.call(this,plan);if(started)this.emit('journeystart');return started;};

// Alert for a hidden journey: the iOS app bridge first, then web notifications the player allowed.
class TravelAlerts{
 constructor(env=globalThis){this.env=env;this.timer=0;this.shown=null;}
 get native(){return this.env.webkit?.messageHandlers?.hearthreaverTravel||null;}
 // Home-screen web apps on iOS cannot build a Notification without a service worker.
 get web(){const N=this.env.Notification;return typeof N==='function'&&!this.env.navigator?.standalone?N:null;}
 prepare(){try{if(this.native)this.native.postMessage({action:'authorize'});else if(this.web?.permission==='default')Promise.resolve(this.web.requestPermission()).catch(()=>{});}catch{}}
 static text(outcome){const title=outcome.arrived?'Arrivé à destination':'Voyage interrompu',body=(outcome.arrived?outcome.place?'Kaldor est arrivé à '+outcome.place+'. ':'':outcome.reason+'. '+(outcome.place?'Kaldor attend à '+outcome.place+'. ':''))+'Le jeu est en pause.';return {title,body};}
 schedule(outcome){this.cancel();if(!Number.isFinite(outcome?.at))return false;const delay=Math.max(1,(outcome.at-Date.now())/1000),{title,body}=TravelAlerts.text(outcome);
  try{if(this.native){this.native.postMessage({action:'schedule',delay,title,body});return true;}const N=this.web;if(N?.permission!=='granted')return false;
   this.timer=this.env.setTimeout(()=>{this.timer=0;try{const shown=new N(title,{body,tag:'hearthreaver-arrival'});shown.onclick=()=>{this.env.focus?.();shown.close();};this.shown=shown;}catch{}},delay*1000);return true;}catch{return false;}}
 cancel(){if(this.timer)this.env.clearTimeout(this.timer);this.timer=0;try{this.shown?.close();}catch{}this.shown=null;try{this.native?.postMessage({action:'cancel'});}catch{}}
}
