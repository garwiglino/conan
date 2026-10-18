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
// Forecast with the same journey state machine as actual replay. A separate
// Game owns every mutable record: advice, weather, discoveries, care orders and
// phase boundaries must not diverge between prediction and arrival.
Game.prototype.forecastJourney=function(){
 const journey=this.journey;if(!journey)return null;
 const copy=new Game(JSON.parse(JSON.stringify(this.serialize())));
 copy.worldStore={readFor:()=>null,write:()=>{}};copy.clock=this.clock;copy.time=this.time;copy.elapsed=this.elapsed;copy.atlasLastClock=this.atlasLastClock;
 copy.journey=JSON.parse(JSON.stringify(journey));delete copy.journey.away;delete copy.journey.arrival;delete copy.journey.outcome;copy.journeyReplay=true;copy.events=[];
 let seconds=0;for(let i=0;copy.journey&&i<200000;i++){copy.stepJourney(JOURNEY_FRAME);seconds+=JOURNEY_FRAME;}
 const result=copy.events.filter(e=>e.type==='notice').at(-1),reason=result?.title||'Voyage interrompu';
 return {seconds,arrived:!copy.journey&&reason==='Arrivée à destination',reason,place:result?.text||''};
};
// Marks the first departure from the screen and returns what will happen, with its time (ms since epoch).
Game.prototype.leaveJourney=function(now=Date.now()){const j=this.journey;if(!j)return null;if(!Number.isFinite(j.away)||!Number.isFinite(j.arrival)||!j.outcome){const f=this.forecastJourney();j.away=now;j.arrival=now+Math.ceil(f.seconds*1000);j.outcome={arrived:f.arrived,reason:f.reason,place:f.place};}
 return {at:j.arrival,...j.outcome};};
// Replays the absence in quarter-second steps, with one save at the end. Past the announced time, the trip always ends.
Game.prototype.resumeJourney=function(now=Date.now()){const j=this.journey;if(!j||!Number.isFinite(j.away))return false;const finish=Number.isFinite(j.arrival)&&now>=j.arrival,queued=this.events.length;let left=Math.max(0,(now-j.away)/1000);delete j.away;delete j.arrival;delete j.outcome;
 this.journeyReplay=true;try{for(let i=0;this.journey===j&&(finish||left>1e-9)&&i<JOURNEY_REPLAY_STEPS;i++){const dt=finish?JOURNEY_REPLAY_STEP:Math.min(JOURNEY_REPLAY_STEP,left);this.stepJourney(dt);left-=dt;}}finally{this.journeyReplay=false;}
 const replayed=this.events.splice(queued);this.events.push(...replayed.filter(e=>e.type!=='save'));this.emit('save');return true;};
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
