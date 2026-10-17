'use strict';
// Rebuild approved sources; patch only explicit runtime integration points.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,['sprites/batraciens/build-code.cjs'],{cwd:root,stdio:'inherit'});
function edit(file,changes){const p=path.join(root,file);let s=fs.readFileSync(p,'utf8');for(const [from,to]of changes){if(s.includes(to))continue;if(s.split(from).length!==2)throw new Error('Batraciens: integration anchor changed in '+file+': '+from.slice(0,90));s=s.replace(from,()=>to);}fs.writeFileSync(p,s);}
edit('scripts/civilian-runtime.js',[
 ['for(const n of this.npcs){const c=this.ensureCivilian(n);if(!c)continue;const delta=', 'for(const n of this.npcs){if(n.batracien&&!n.batracien.role){this.stepBatracienCivilian(n,dt);continue;}const c=this.ensureCivilian(n);if(!c)continue;const delta=']
]);
edit('scripts/world-danger.js',[
 ['this.npcs.filter(n=>n.eventGuard&&active.has(n.eventId))','this.npcs.filter(n=>n.eventGuard&&!n.batracien&&active.has(n.eventId))']
]);
edit('index.html',[
 ["target(){const e=this.enemies.find(e=>e.id===this.targetId);", "target(){const e=this.combatTargets().find(e=>e.id===this.targetId);"],
 ["for(const e of this.enemies){if(e.dead||(e.kind==='boss'&&!this.bossActive))continue;const range=dist", "for(const e of this.combatTargets()){if(e.dead||!this.sameLevel(e,this.player)||(e.kind==='boss'&&!this.bossActive))continue;const range=dist"],
 ["for(const e of this.enemies){if(e.dead||this.hits.has(e.id)", "for(const e of this.combatTargets()){if(e.dead||this.hits.has(e.id)"],
 ["from.owner?this.enemies.find(e=>e.id===from.owner):from", "from.owner?this.combatTargets().find(e=>e.id===from.owner):from"],
 ["if(fatal){this.remains.push({level:e.level||0,x:e.x,y:e.y,kind:e.kind,heavy,dir:e.dir,t0:this.time});", "if(fatal&&!e.civilian&&!e.batracien){this.remains.push({level:e.level||0,x:e.x,y:e.y,kind:e.kind,heavy,dir:e.dir,t0:this.time});"],

 ['for(const e of this.enemies){if(e.dead)continue;if(!this.sameLevel(e,p)){e.wind=0;', 'for(const e of this.enemies){if(e.dead)continue;if(e.batracien){this.stepBatracienEnemy(e,dt);continue;}if(!this.sameLevel(e,p)){e.wind=0;'],
 ["for(const r of g.remains.filter(r=>!r.level)){if(r.kind==='boss')continue;", "for(const r of g.remains.filter(r=>!r.level)){if(r.kind==='batracien'||r.kind==='boss')continue;"],
 ["...g.remains.filter(r=>r.level||r.kind==='boss'||(r.kind==='guardian'", "...g.remains.filter(r=>r.level||r.kind==='batracien'||r.kind==='boss'||(r.kind==='guardian'"],
 ["fn:()=>{if(r.kind==='boss'){this.bossRemains(r);return;}","fn:()=>{if(r.kind==='batracien'){this.batracienRemains(r);return;}if(r.kind==='boss'){this.bossRemains(r);return;}"],
 ["for(const fx of g.bloodFX)if(g.sameLevel(fx,p))drawBloodFX(c,fx);","this.drawBatracienMissiles();for(const fx of g.bloodFX)if(g.sameLevel(fx,p))drawBloodFX(c,fx);"]
]);
cp.execFileSync(process.execPath,['scripts/embed-world.cjs'],{cwd:root,stdio:'inherit'});
cp.execFileSync(process.execPath,['scripts/embed-kaldor.cjs'],{cwd:root,stdio:'inherit'});
const sources=['sprites/batraciens/base/batracien-v2.js','sprites/batraciens/base/batracienne-v2.js','sprites/batraciens/sources/renderer.template.js','sprites/batraciens/sources/activities.cjs','sprites/batraciens/sources/palettes.json','sprites/batraciens/batraciens-complet.js','sprites/batraciens/batraciens-combattants.js','scripts/batraciens-runtime.js','scripts/batraciens-society.js','data/batraciens/communities.json'];
const hashes=Object.fromEntries(sources.map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex')]));
fs.writeFileSync(path.join(root,'data/batraciens/build-manifest.json'),JSON.stringify({version:1,cell:[80,80],anchor:[40,52],sources:hashes},null,2)+'\n');
