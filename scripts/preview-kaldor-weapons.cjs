// Render the shipped compositor into a standalone, offline animation workshop.
'use strict';
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas,root}=require('../tests/game-harness.cjs');
const W=require('./kaldor-weapons.js');
(async()=>{
 const api=await loadGame(),A=api.HearthreaverKaldorCivilianArt;await A.preload();
 const states=[];
 for(let c=0;c<4;c++)for(const f of [1,2,3.5])states.push(['attack',f,c]);
 for(let f=0;f<4;f++)states.push(['idle',f,0]);
 for(let f=0;f<8;f++)states.push(['walk',f,0]);
 for(let f=0;f<48;f++)states.push(['sheathe_walk',f,0]);
 for(let f=0;f<8;f++)states.push(['sheathed_walk',f,0]);
 for(let f=0;f<40;f++)states.push(['draw_walk',f,0]);
 // During a combat-only review, reuse unchanged walking and storage drawings.
 const carryProfilesOnly=process.argv.includes('--pole-carry-profiles-only'),carryOnly=carryProfilesOnly||process.argv.includes('--pole-carry-only'),recoveryOnly=process.argv.includes('--front-recovery-only'),finishersOnly=process.argv.includes('--finishers-only'),facePoles=process.argv.includes('--pole-face-only'),poleAttacks=process.argv.includes('--pole-attacks-only'),reuse=carryOnly||recoveryOnly||finishersOnly||facePoles||poleAttacks||process.argv.includes('--attacks-only');let previous;
 if(reuse){const old=fs.readFileSync(path.join(root,'art/weapons-preview.html'),'utf8');
  const start=old.indexOf('sheets=')+7,end=old.indexOf(',states=',start),stop=old.indexOf(',$=',end);
  if(start<7||end<0||stop<0||JSON.stringify(JSON.parse(old.slice(end+8,stop)))!==JSON.stringify(states))throw Error('Workshop layout changed; render the full workshop');
  previous=JSON.parse(old.slice(start,end));
 }
 const entries=[],board=canvas.createCanvas(1320,Math.ceil(W.all.length/6)*208),b=board.getContext('2d');
 b.fillStyle='#181b1c';b.fillRect(0,0,board.width,board.height);b.imageSmoothingEnabled=false;
 for(let i=0;i<W.all.length;i++){
  const w=W.all[i];A.wield(w.id);const count=states.length*4,cv=canvas.createCanvas(1280,Math.ceil(count/16)*80),c=cv.getContext('2d');
  if(reuse){const old=previous.find(e=>e.id===w.id);if(!old)throw Error('Missing old weapon '+w.id);const im=await canvas.loadImage(Buffer.from(old.png,'base64'));c.drawImage(im,0,0);}
  for(let d=0;d<4;d++)for(let n=0;n<states.length;n++){
   if(carryOnly&&(!['spear','staff'].includes(w.family)||states[n][0]==='attack'))continue;
   if(carryProfilesOnly&&d!==1&&d!==3)continue;
   if(recoveryOnly&&(d!==2||states[n][0]!=='attack'||states[n][1]<4||states[n][2]===3))continue;
   if(finishersOnly&&(states[n][0]!=='attack'||states[n][2]!==3))continue;
   if(facePoles&&(d!==2||!['spear','staff','glaive'].includes(w.family)))continue;
   if(poleAttacks&&!['spear','staff','glaive'].includes(w.family))continue;
   if(reuse&&!facePoles&&!carryOnly&&states[n][0]!=='attack')continue;
   const [state,f,combo]=states[n],im=A.nativeFrame(d,state,f,combo,api.swordPose),k=d*states.length+n;
   if(im){c.clearRect(k%16*80,Math.floor(k/16)*80,80,80);c.drawImage(im,k%16*80,Math.floor(k/16)*80);}
  }
  entries.push({id:w.id,png:cv.toBuffer('image/png').toString('base64')});
  const x=i%6*220,y=Math.floor(i/6)*208;
  b.fillStyle='#252c2b';b.fillRect(x+4,y+4,212,200);
  b.drawImage(A.nativeFrame(1,'attack',2,0,api.swordPose),0,0,80,80,x+30,y+2,160,160);
  b.fillStyle='#efdbaf';b.font='12px sans-serif';b.fillText(w.label,x+12,y+164,198);
  b.fillStyle='#a9b8af';b.font='11px sans-serif';b.fillText(W.families[w.family]+' · '+w.territory,x+12,y+182,198);
  b.fillText('Force ×'+w.damage+' · Cadence '+Math.round(100*W.cadence(w.id))+' %',x+12,y+197,198);
  A.clear();await new Promise(resolve=>setImmediate(resolve));global.gc?.();console.log((i+1)+'/'+W.all.length+' · '+w.label);
 }
 const idleFrames=Array.from({length:Math.round(A.dressDuration('idle')*1000)},(_,i)=>A.frameAt('idle',i/1000));
 const data=JSON.stringify(require('../data/weapons/catalogue.json')),art=fs.readFileSync(path.join(root,'scripts/kaldor-weapons.js'),'utf8');
 const html=`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Arsenal de Kaldor</title>
<style>body{margin:0;background:#151b1b;color:#eee1bf;font:16px/1.5 system-ui}main{max-width:1100px;margin:auto;padding:24px}h1{margin:0}header p{color:#acb7a8}section{display:grid;grid-template-columns:minmax(250px,1fr) minmax(280px,1fr);gap:24px;padding:24px 0}canvas{width:100%;max-width:480px;image-rendering:pixelated;background:radial-gradient(#34403b,#1c2422)}button,select{font:inherit;min-height:44px;padding:8px 12px;color:#eee1bf;background:#29352f;border:1px solid #819378;border-radius:4px}select{width:100%}nav{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}#stats{color:#e8bb76}small{color:#acb7a8}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;padding:10px;border-bottom:1px solid #34403b}table button{font-size:14px;text-align:left}a{color:#e8bb76}@media(max-width:650px){section{grid-template-columns:1fr}canvas{max-width:320px}main{padding:16px}td,th{padding:6px;font-size:12px}}</style>
<main><header><h1>Arsenal de Kaldor</h1><p>${W.all.length} armes · 8 familles · 6 peuples · 5 territoires. Poses du compositeur réellement embarqué dans le jeu.</p></header>
<section><div><canvas id="stage" width="80" height="80" aria-label="Animation de Kaldor"></canvas><nav><button id="left">◀ Tourner</button><button id="right">Tourner ▶</button><button id="pause">Pause</button></nav><label>Animation <select id="motion"><option value="attack">Les quatre combos</option><option value="finisher" selected>Quatrième coup</option><option value="walk">Marche armée</option><option value="holster">Rangement en marche et dégainage</option></select></label><label>Vitesse de lecture <select id="speed"><option value="0.5">Ralenti ×0,5</option><option value="1" selected>Vitesse réelle</option><option value="1.5">Accéléré ×1,5</option></select></label><p id="phase"></p></div><div><label>Arme <select id="weapon"></select></label><h2 id="name"></h2><p id="origin"></p><p id="stats"></p><p id="description"></p><small>Cadence relative à l’épée de départ. Chaque arme possède sa frappe finale ; certaines pièces spéciales manifestent des effets magiques. Les râteliers et les armes portées par les combattants sont détaillés dans le catalogue du jeu.</small><p><a href="../index.html">Ouvrir le jeu</a> · <a href="weapons-preview.png">Planche des ${W.all.length} armes</a></p></div></section>
<div style="overflow:auto"><table><thead><tr><th>Arme</th><th>Origine</th><th>Force</th><th>Cadence</th><th>Allonge</th></tr></thead><tbody id="list"></tbody></table></div></main>
<script>globalThis.KALDOR_WEAPONS_DATA=${data};\n${art}\n</script>
<script>
const W=HearthreaverWeapons,idleFrames=${JSON.stringify(idleFrames)},sheets=${JSON.stringify(entries)},states=${JSON.stringify(states)},$=id=>document.getElementById(id),cv=$('stage'),ctx=cv.getContext('2d');let selected=W.START,dir=2,origin=performance.now(),paused=false,pausedAt=0,img=new Image();ctx.imageSmoothingEnabled=false;
function select(id){selected=id;const w=W.get(id);$('weapon').value=id;img.src='data:image/png;base64,'+sheets.find(s=>s.id===id).png;$('name').textContent=w.label;$('origin').textContent=w.culture+' · '+w.territory+' · '+w.rarity;$('stats').textContent=W.families[w.family]+' · '+w.hands+' main'+(w.hands===2?'s':'')+' · '+w.weightKg+' kg · Force ×'+w.damage+' · Cadence '+Math.round(100*W.cadence(w.id))+' % · Allonge '+w.length;$('description').textContent=w.description+' Quatrième coup : '+w.finisher.name+(w.finisher.magic?' · effets magiques.':'.');origin=performance.now();}
$('weapon').innerHTML=W.all.map(w=>'<option value="'+w.id+'">'+w.label+'</option>').join('');$('weapon').onchange=e=>select(e.target.value);$('left').onclick=()=>dir=(dir+3)%4;$('right').onclick=()=>dir=(dir+1)%4;$('motion').onchange=()=>origin=performance.now();$('speed').onchange=()=>origin=performance.now();$('pause').onclick=()=>{paused=!paused;if(paused)pausedAt=performance.now();else origin+=performance.now()-pausedAt;$('pause').textContent=paused?'Reprendre':'Pause';};
$('list').innerHTML=W.all.map(w=>'<tr><td><button data-id="'+w.id+'">'+w.label+'</button></td><td>'+w.culture+' · '+w.territory+'</td><td>×'+w.damage+'</td><td>'+Math.round(100*W.cadence(w.id))+' %</td><td>'+w.length+'</td></tr>').join('');for(const b of document.querySelectorAll('[data-id]'))b.onclick=()=>{select(b.dataset.id);scrollTo({top:0,behavior:'smooth'});};select(W.START);
function tick(now){const t=((paused?pausedAt:now)-origin)/1000*Number($('speed').value),look=W.preview(selected,t,$('motion').value,idleFrames[Math.floor(Math.max(0,t)*1000)%idleFrames.length]),frame=Math.round(look.frame*4)/4,n=states.findIndex(s=>s[0]===look.state&&s[1]===frame&&s[2]===(look.state==='idle'?0:look.combo)),k=dir*states.length+Math.max(0,n);$('phase').textContent=look.label;ctx.clearRect(0,0,80,80);if(img.complete&&img.naturalWidth)ctx.drawImage(img,k%16*80,Math.floor(k/16)*80,80,80,0,0,80,80);requestAnimationFrame(tick);}requestAnimationFrame(tick);
</script></html>`;
 fs.writeFileSync(path.join(root,'art/weapons-preview.html'),html);fs.writeFileSync(path.join(root,'art/weapons-preview.png'),board.toBuffer('image/png'));console.log('Rendered',W.all.length,'weapons and',states.length*4,'poses per weapon.');
})().catch(e=>{console.error(e);process.exitCode=1;});
