/* Territorial alerts are evidence, not species-wide reputation. */
function createTerritorialJustice(A,W,J,B={}){
 const finite=Number.isFinite,profiles=new Map((B.settlements||[]).map(s=>['town-'+s.atlasId,s])),regions=new Map((B.regions||[]).map(r=>[r.id,r]));
 const labels=Object.fromEntries((B.factions||[]).map(f=>[f[0],f[1]]));
 const zones=new Map(),bySite=new Map();
 for(const n of A.nodes.filter(n=>n.rest)){
  const account=W.simulation?.state.sites[n.id],p=profiles.get(n.town||n.id),r={...A.regions.get(n.region),...regions.get(n.region)},authority=account?.authority||p?.authority||r?.authority||'local';
  const id=n.region+':'+authority,z=zones.get(id)||{id,region:n.region,name:r?.name||'Terres libres',territory:r?.territory||r?.continent||'',authority,authorityName:labels[authority]||authority,sites:[]};
  if(!z.sites.includes(account?.id||n.id))z.sites.push(account?.id||n.id);zones.set(id,z);bySite.set(n.id,z);
 }
 const saved=J.state.territorial,Jstate=J.state;Jstate.territorial={version:1,receipts:{}};const state=Jstate.territorial;
 if(saved?.version===1)for(const [site,book]of Object.entries(saved.receipts||{}))if(A.byId[site]){
  const clean={};for(const [id,k]of Object.entries(book||{}))if(Jstate.cases.some(c=>c.id===id)&&k&&J.rules[k.kind]&&[k.at,k.wantedUntil,k.penaltyUntil].every(finite)&&k.at>=0)clean[id]={...k,victimInfo:identity(k.victimInfo)};
  state.receipts[site]=clean;
 }
 let revision=0;const cache=new Map();
 function touch(){revision++;cache.clear();}
 function zone(site){return bySite.get(site)||null;}
 function identity(value={}){
  const str=(s,f='')=>typeof s==='string'?s.slice(0,120):f;
  return {id:str(value?.id),name:str(value?.name),species:str(value?.species,'unknown'),role:value?.role==='guard'?'guard':'civilian',affiliation:str(value?.affiliation),network:str(value?.network),loyalty:value?.loyalty==='player'?'player':'independent'};
 }
 function victimInfo(c){return identity(c.knownVictimInfo||c.victimInfo);}
 function receiptSite(site){return W.simulation?.state.sites[site]?.id||site;}
 function knowledge(c,site,at){
  site=receiptSite(site);const local=J.localSite(site);if(!c.distributed&&c.jurisdiction===local?.jurisdiction)return c.reportedAt!==null&&c.reportedAt<=at?c:null;
  const k=state.receipts[site]?.[c.id];if(!k||k.at>at||zone(site)?.id!==zone(c.site)?.id)return null;
  return {...c,knownKind:k.kind,knownIntimidation:!!k.intimidation,knownVictimInfo:k.victimInfo,reportedAt:k.at,wantedUntil:k.wantedUntil,penaltyUntil:k.penaltyUntil};
 }
 function active(c,at){return c&&J.outstanding(c)&&c.reportedAt!==null&&c.reportedAt<=at&&c.wantedUntil>at;}
 function weight(c){const info=victimInfo(c),kind=c.knownKind||c.kind;return J.rules[kind].weight+(info.role==='guard'?(kind==='murder'?4:kind==='grave_injury'?2:1):0)+(c.knownIntimidation?2:0);}
 function alert(site,at=W.clock){
  const z=zone(site);if(!z)return {level:0,heat:0,zone:null,label:'Libre',cases:[],guardsKilled:0,victims:0,until:0};
  // Exact world time is part of the key: expiry and level drops cannot be stale.
  const key=z.id+'|'+at+'|'+revision;if(cache.has(key))return cache.get(key);
  const known=[];for(const c of Jstate.cases){let view=null;
   for(const id of z.sites){const k=knowledge(c,id,at);if(active(k,at)&&(!view||weight(k)>weight(view)))view=k;}
   if(view)known.push(view);
  }
  let heat=0,until=0;for(const c of known){const span=J.rules[c.knownKind||c.kind].wanted;heat+=Math.ceil(weight(c)*Math.min(1,(c.wantedUntil-at)/(span*.75)));until=Math.max(until,c.wantedUntil);}
  const level=heat>=18?5:heat>=10?4:heat>=6?3:heat>=3?2:heat>0?1:0,labels=['Libre','Signalé','Recherché','Traqué','Chasse à l’homme','Alerte majeure'];
  const out={level,heat,zone:z,label:labels[level],cases:known,guardsKilled:known.filter(c=>c.knownKind==='murder'&&victimInfo(c).role==='guard').length,victims:known.filter(c=>c.knownKind==='murder').length,until};
  if(cache.size>64)cache.clear();cache.set(key,out);return out;
 }
 function response(site,at=W.clock){const a=alert(site,at),level=a.level;return {...a,guardsPerSquad:2,responseSquads:level>=5?3:level>=3?2:level?1:0,roadSquads:Math.max(0,level-1),cooldown:[60,60,45,30,20,15][level],searchMinutes:30+level*10};}
 function canReport(c,who,contact=null){
  const i=identity(who),victim=identity(c.victimInfo);
  if(i.loyalty==='player')return {allowed:false,reason:'Compagnon ou allié personnel'};
  if(i.network&&i.affiliation!==victim.affiliation&&i.id!==c.victim)return {allowed:false,reason:'Réseau clandestin non coopérant'};
  const relation=(B.relations||[]).find(r=>r.a===i.affiliation&&r.b===victim.affiliation||r.b===i.affiliation&&r.a===victim.affiliation);
  if(['war','open_war','hostile'].includes(relation?.state)&&i.affiliation!==victim.affiliation)return {allowed:false,reason:'Autorités adverses en conflit déclaré'};
  if(contact&&zone(contact)?.id!==zone(c.site)?.id)return {allowed:false,reason:'Absence de mandat dans cette zone'};
  return {allowed:true,reason:i.affiliation===victim.affiliation?'Protection de la communauté':'Protection locale des personnes, quelle que soit l’espèce'};
 }
 function manifest(site,at=W.clock){return Jstate.cases.map(c=>knowledge(c,site,at)).filter(c=>active(c,at)).map(c=>({id:c.id,kind:c.knownKind||c.kind,at:c.reportedAt,wantedUntil:c.wantedUntil,penaltyUntil:c.penaltyUntil,intimidation:!!c.knownIntimidation,victimInfo:victimInfo(c)}));}
 function needsNews(site,news,at=W.clock){return news.some(k=>{const c=Jstate.cases.find(c=>c.id===k.id),v=c&&knowledge(c,site,at);return !v||J.rules[k.kind].weight>J.rules[v.knownKind||v.kind].weight||k.wantedUntil>v.wantedUntil||k.intimidation&&!v.knownIntimidation;});}
 function receive(site,news,at=W.clock){
  site=receiptSite(site);if(!zone(site)||!Array.isArray(news)||!finite(at))return false;let changed=false;
  for(const k of news){const c=Jstate.cases.find(c=>c.id===k.id);if(!c||zone(c.site)?.id!==zone(site).id||!J.rules[k.kind]||![k.at,k.wantedUntil,k.penaltyUntil].every(finite)||at<k.at||k.wantedUntil<=at)continue;
   const old=state.receipts[site]?.[c.id];if(old&&J.rules[old.kind].weight>=J.rules[k.kind].weight&&old.wantedUntil>=k.wantedUntil&&(!k.intimidation||old.intimidation))continue;
   const stronger=old&&J.rules[old.kind].weight>J.rules[k.kind].weight?old:k;
   (state.receipts[site]||={})[c.id]={...k,at,kind:stronger.kind,wantedUntil:Math.max(old?.wantedUntil||0,k.wantedUntil),penaltyUntil:Math.max(old?.penaltyUntil||0,k.penaltyUntil),intimidation:!!(old?.intimidation||k.intimidation),victimInfo:identity(stronger.victimInfo)};changed=true;
  }if(changed)touch();return changed;
 }
 // Preserve already-filed local evidence when opening a pre-territorial save.
 for(const c of Jstate.cases)if(!c.distributed&&c.reportedAt!==null){receive(c.site,[{id:c.id,kind:c.knownKind||c.kind,at:c.reportedAt,wantedUntil:c.wantedUntil,penaltyUntil:c.penaltyUntil,intimidation:!!c.knownIntimidation,victimInfo:victimInfo(c)}],c.reportedAt);c.distributed=true;}
 const record=J.record,file=J.file,sentence=J.sentence;
 J.record=function(args){const c=record(args);if(c&&args.victimInfo)c.victimInfo=identity(args.victimInfo);touch();return c;};
 J.file=function(id,witness,at=W.clock,contact=null){
  const c=Jstate.cases.find(c=>c.id===id),k=c?.witnesses[witness];contact||=c?.site;
  if(!c||zone(contact)?.id!==zone(c.site)?.id||k?.identity&&!canReport(c,k.identity,contact).allowed)return false;
  const ok=file(id,witness,at);if(ok){c.knownVictimInfo=identity(c.victimInfo);c.distributed=true;
   const limit=k.seenAt+7*1440;receive(contact,[{id:c.id,kind:k.kind,at,wantedUntil:Math.min(limit,at+J.rules[k.kind].wanted),penaltyUntil:Math.min(limit,at+J.rules[k.kind].penalty),intimidation:!!c.intimidation,victimInfo:c.knownVictimInfo}],at);
   if(k.position)J.sighting(contact,k.position,witness,k.position.at,at);touch();
  }return ok;
 };
 J.sentence=function(...args){const out=sentence(...args);if(out)touch();return out;};
 return {zone,knowledge,alert,response,manifest,needsNews,receive,canReport,identity,zones:()=>[...zones.values()],touch,weight};
}
if(typeof module!=='undefined'&&module.exports)module.exports=createTerritorialJustice;
