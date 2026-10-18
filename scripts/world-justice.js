/* Codex / ChatGPT — local evidence and temporary justice, not a racial reputation.
 * This model accepts observed facts only. It never discovers the culprit by itself.
 * Times are world minutes. A filed statement is immutable even if its author dies.
 */
function createWorldJustice(A,W,saved){
 'use strict';
 saved||={};
 const finite=Number.isFinite,day=1440;
 const rules=Object.freeze({assault:{weight:1,wanted:day,penalty:2*day},grave_injury:{weight:3,wanted:2*day,penalty:4*day},murder:{weight:6,wanted:4*day,penalty:7*day}});
 const state={version:1,serial:1,cases:[],sentences:[],scenes:[],sightings:{}};
 if(saved?.version===1){
  state.serial=Number.isInteger(saved.serial)&&saved.serial>0?saved.serial:1;
  for(const c of Array.isArray(saved.cases)?saved.cases:[]){
   if(!c||typeof c.id!=='string'||!A.byId[c.site]||typeof c.jurisdiction!=='string'||typeof c.victim!=='string'||!rules[c.kind]||![c.at,c.lastAt].every(finite)||c.reportedAt!==null&&![c.reportedAt,c.wantedUntil,c.penaltyUntil].every(finite)||!c.witnesses||typeof c.witnesses!=='object')continue;
   const witnesses={};for(const [id,k]of Object.entries(c.witnesses))if(k&&finite(k.seenAt)&&(k.filedAt===null||finite(k.filedAt)))witnesses[id]={...k,seenAt:k.seenAt,filedAt:k.filedAt,seenCount:Math.max(1,k.seenCount||1),filedCount:Math.max(0,k.filedCount??(k.filedAt===null?0:1)),kind:rules[k.kind]?k.kind:c.kind,dead:!!k.dead};
   state.cases.push({...c,witnesses,knownKind:rules[c.knownKind]?c.knownKind:c.reportedAt!==null?c.kind:null,reportedAt:finite(c.reportedAt)?c.reportedAt:null,servedAt:finite(c.servedAt)?c.servedAt:null,attacks:Math.max(1,Math.floor(c.attacks)||1),intimidation:!!c.intimidation});
  }
  state.sentences=(Array.isArray(saved.sentences)?saved.sentences:[]).filter(s=>s&&typeof s.id==='string'&&A.byId[s.site]&&[s.at,s.releaseAt,s.money].every(finite)&&s.money>=0).map(s=>({...s}));
  for(const s of Array.isArray(saved.scenes)?saved.scenes:[]){if(!s||typeof s.id!=='string'||!A.byId[s.site]||![s.at,s.lastAt,s.x,s.y].every(finite)||!Array.isArray(s.victims))continue;
   const victims=s.victims.filter(v=>v&&typeof v.id==='string'&&[v.x,v.y,v.at].every(finite)).map(v=>({...v})),discoveries={};
   for(const [id,k]of Object.entries(s.discoveries||{}))if(k&&finite(k.at)&&Array.isArray(k.victims))discoveries[id]={...k,victims:k.victims.filter(id=>victims.some(v=>v.id===id))};
   state.scenes.push({...s,victims,discoveries,reportedVictims:(s.reportedVictims||[]).filter(id=>victims.some(v=>v.id===id))});
  }
  state.serial=Math.max(state.serial,...state.cases.map(c=>(Number(c.serial)||0)+1),...state.sentences.map(c=>(Number(c.serial)||0)+1),...state.scenes.map(c=>(Number(c.serial)||0)+1));
  for(const [id,k]of Object.entries(saved.sightings||{}))if(A.byId[id]&&k&&[k.x,k.y,k.at].every(finite))state.sightings[id]={...k};
 }
 function localSite(id){const s=W.simulation?.state.sites[id];return s?{id,jurisdiction:s.jurisdiction}:A.byId[id]?{id,jurisdiction:'local-'+id}:null;}
 function record({victim,site,kind='assault',witnesses=[],position=null,at=W.clock}){
  const s=localSite(site);if(!s||typeof victim!=='string'||!rules[kind]||!finite(at))return null;
  let c=state.cases.find(c=>c.victim===victim&&c.jurisdiction===s.jurisdiction&&c.servedAt===null&&at>=c.lastAt&&at-c.lastAt<=30);
  if(!c){const serial=state.serial++;c={id:'crime-'+serial,serial,victim,site,jurisdiction:s.jurisdiction,at,lastAt:at,kind,attacks:0,witnesses:{},reportedAt:null,servedAt:null,intimidation:false,parents:[]};state.cases.push(c);}
  c.attacks++;c.lastAt=at;if(rules[kind].weight>rules[c.kind].weight)c.kind=kind;
  // Attacking a known witness is a new observed act, not proof supplied by magic.
  for(const prior of state.cases)if(prior!==c&&prior.witnesses[victim]&&at-prior.lastAt<=7*day){c.intimidation=true;if(!c.parents.includes(prior.id))c.parents.push(prior.id);}
  for(const id of [...new Set(witnesses)])if(typeof id==='string'){
   const k=c.witnesses[id]||(c.witnesses[id]={seenAt:at,filedAt:null,seenCount:0,filedCount:0,kind,dead:false});if(k.dead)continue;k.seenCount++;k.seenAt=at;if(rules[kind].weight>rules[k.kind].weight)k.kind=kind;
   if(position&&[position.x,position.y].every(finite))k.position={x:position.x,y:position.y,at};
  }
  return c;
 }
 function file(caseId,witness,at=W.clock){
  const c=state.cases.find(c=>c.id===caseId),k=c?.witnesses[witness];if(!k||k.dead||k.filedCount>=k.seenCount||!finite(at)||at<k.seenAt||at-k.seenAt>7*day)return false;
  k.filedAt??=at;k.filedCount=k.seenCount;k.lastFiledAt=at;if(c.reportedAt===null)c.reportedAt=at;
  if(!c.knownKind||rules[k.kind].weight>rules[c.knownKind].weight)c.knownKind=k.kind;c.knownIntimidation=c.knownIntimidation||c.intimidation;
  // A statement submitted late in the week cannot extend a warrant forever.
  const limit=k.seenAt+7*day;c.wantedUntil=Math.max(c.wantedUntil||0,Math.min(limit,at+rules[c.knownKind].wanted));c.penaltyUntil=Math.max(c.penaltyUntil||0,Math.min(limit,at+rules[c.knownKind].penalty));
  if(k.position)sighting(c.site,k.position,witness,k.position.at,at);
  return true;
 }
 function witnessDied(id){for(const c of state.cases)if(c.witnesses[id])c.witnesses[id].dead=true;for(const s of state.scenes)if(s.discoveries[id])s.discoveries[id].dead=true;}
 function pending(id,at=W.clock){return state.cases.filter(c=>c.witnesses[id]&&!c.witnesses[id].dead&&c.witnesses[id].filedCount<c.witnesses[id].seenCount&&at-c.witnesses[id].seenAt<=7*day);}
 function effect(site,person=null,at=W.clock){
  const s=localSite(site);if(!s)return {wanted:false,score:0,price:1,refuse:false,until:0,cases:[]};
  const known=state.cases.filter(c=>c.jurisdiction===s.jurisdiction&&(c.reportedAt!==null&&c.reportedAt<=at||person&&c.witnesses[person]&&c.witnesses[person].seenAt<=at));
  let score=0,until=0;for(const c of known){const personal=person&&c.witnesses[person],kind=personal&&rules[personal.kind].weight>rules[c.knownKind||personal.kind].weight?personal.kind:c.knownKind||personal?.kind||c.kind,end=c.reportedAt===null?(personal?.seenAt??c.lastAt)+rules[kind].penalty:c.penaltyUntil;if(end<=at)continue;const span=rules[kind].penalty;score+=(rules[kind].weight+((c.reportedAt!==null?c.knownIntimidation:c.intimidation)?2:0))*Math.min(1,(end-at)/span);until=Math.max(until,end);}
  score=Math.min(12,score);return {wanted:known.some(c=>c.reportedAt!==null&&c.servedAt===null&&c.wantedUntil>at),score,price:1+Math.min(.75,score*.12),refuse:score>=.5,until,cases:known};
 }
 function sentence(site,money,at=W.clock){
  const s=localSite(site);if(!s||!finite(money)||money<0||!finite(at))return null;
  const cases=state.cases.filter(c=>c.jurisdiction===s.jurisdiction&&c.reportedAt!==null&&c.reportedAt<=at&&c.servedAt===null&&c.wantedUntil>at);if(!cases.length)return null;
  const weight=Math.min(12,cases.reduce((n,c)=>n+rules[c.knownKind||c.kind].weight+(c.knownIntimidation?2:0),0)),minutes=Math.min(1440,240+weight*120),rate=Math.min(.5,.12+weight*.04),fine=Math.min(Math.floor(money),Math.ceil(6+money*rate));
  const serial=state.serial++,snt={id:'sentence-'+serial,serial,site,at,releaseAt:at+minutes,minutes,money:fine,caseIds:cases.map(c=>c.id)};
  for(const c of cases){c.servedAt=at;c.sentence=snt.id;}state.sentences.push(snt);return snt;
 }
 function death({victim,site,x,y,level=0,at=W.clock}){
  if(typeof victim!=='string'||!localSite(site)||![x,y,at].every(finite)||state.scenes.some(s=>s.victims.some(v=>v.id===victim)))return null;
  let s=state.scenes.find(s=>s.site===site&&s.level===level&&at>=s.lastAt&&at-s.lastAt<=120&&Math.hypot(s.x-x,s.y-y)<=24);
  if(!s){const serial=state.serial++;s={id:'scene-'+serial,serial,site,jurisdiction:localSite(site).jurisdiction,x,y,level,at,lastAt:at,victims:[],discoveries:{},reportedVictims:[],reportedAt:null};state.scenes.push(s);}
  s.victims.push({id:victim,x,y,at});s.lastAt=at;return s;
 }
 function discover(sceneId,person,visible,at=W.clock){
  const s=state.scenes.find(s=>s.id===sceneId);if(!s||typeof person!=='string'||!finite(at)||at<s.at||!Array.isArray(visible))return false;
  const ids=visible.filter(id=>s.victims.some(v=>v.id===id&&v.at<=at));if(!ids.length)return false;
  const k=s.discoveries[person]||(s.discoveries[person]={at,victims:[],filedAt:null,filedCount:0,dead:false});if(k.dead)return false;
  let changed=false;for(const id of ids)if(!k.victims.includes(id)){k.victims.push(id);changed=true;}return changed;
 }
 function discoveries(person){return state.scenes.filter(s=>{const k=s.discoveries[person];return k&&!k.dead&&k.victims.length>(k.filedCount||0);});}
 function fileDiscovery(sceneId,person,at=W.clock){
  const s=state.scenes.find(s=>s.id===sceneId),k=s?.discoveries[person];if(!k||k.dead||!finite(at)||at<k.at||k.victims.length<=(k.filedCount||0))return false;
  k.filedAt=at;k.filedCount=k.victims.length;s.reportedAt??=at;s.reportedVictims=[...new Set([...s.reportedVictims,...k.victims])];return true;
 }
 function sighting(site,position,person,at=W.clock,knownAt=W.clock){if(!localSite(site)||!position||![position.x,position.y,at].every(finite)||!effect(site,null,Math.max(knownAt,at)).wanted)return false;const old=state.sightings[site];if(old&&old.at>at)return false;state.sightings[site]={x:position.x,y:position.y,at,by:person};return true;}
 return {state,rules,localSite,record,file,witnessDied,pending,effect,sentence,death,discover,discoveries,fileDiscovery,sighting,serialize:()=>JSON.parse(JSON.stringify(state))};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createWorldJustice;
