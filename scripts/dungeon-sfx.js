// Bruitages du donjon : portes, herses, leviers, dalles, caisse traînée, treuil, monte-charge, clés, tonneaux et
// caisses qui cassent, voix des gobelins et de Grise-Gueule. Ce sont des bruitages 8 bits comme tous les autres
// (familles « Donjon » et « Gobelins » de scripts/chip-sfx-scores.cjs, moteur scripts/chip-sfx.js) : le fer claque en
// mode court sans jamais sonner comme une cloche, le bois cogne, les créatures crient sur deux impulsions rugueuses.
//
// Branchement : sous terre, un guetteur compare l'état du donjon d'une image à l'autre (portes, herses, leviers, dalles,
// caisse, treuil, monte-charge, clés, gobelins). Chaque changement joue son bruitage sur le bus des bruitages (donc dans
// la réverbération de pierre), atténué avec la distance et placé selon sa position à l'écran.
Sound.prototype.dungeonPlay=function(name,{x,y,delay=0,vol=1}={}){
 if(!name||!this.enabled||!this.sfxOn||!this.ctx||!this.master)return null;
 const p=this.dwatch?.game?.player;let pan=0,near=1;
 if(p&&Number.isFinite(x)&&Number.isFinite(y)){near=Math.max(0,1-Math.hypot(x-p.x,y-p.y)/380)**1.3;const P=WorldProjection.point;pan=clamp((P(x,y).x-P(p.x,p.y).x)/240,-.85,.85);}
 if(near<.02)return null;
 return this.chip(name,{vol:vol*near,pan,delay});
};
// Traînée de la caisse : boucle dont le niveau et la hauteur suivent la vitesse.
Sound.prototype.dungeonScrape=function(level){const c=this.ctx;if(!c||!this.master)return;let L=this.dscrape;
 if(level>0&&!L){const buf=this.chipBuffer('crate_scrape');if(!buf)return;const src=c.createBufferSource(),g=c.createGain();src.buffer=buf;src.loop=true;g.gain.value=0;src.connect(g);g.connect(this.master);src.start();L=this.dscrape={src,g,quiet:0};}
 if(!L)return;const t=c.currentTime;L.g.gain.setTargetAtTime(level,t,.05);L.src.playbackRate.setTargetAtTime(.85+.3*level,t,.08);
 L.quiet=level>0?0:L.quiet+1;if(L.quiet>45){try{L.src.stop();}catch{}L.src.disconnect();L.g.disconnect();this.dscrape=null;}
};
Sound.prototype.dungeonSnapshot=function(g){const F=FirstDungeon,s=F.state(g),d=g.dungeon,e=F.current(g),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<10;
 const crate=g.dungeonGrip?s.crates.find(b=>b.id===g.dungeonGrip.id):null;
 return {game:g,floor:d.floor,open:new Set(s.open),levers:s.levers.length,keys:d.keys.length,lift:!!d.lift,fairy:!!d.fairy,bossFight:!!d.bossFight,bossDead:!!d.bossDead,grip:g.dungeonGrip?.id??null,
  plates:(e.mecanismes||[]).flatMap(m=>m.dalles||[]).filter(q=>s.crates.some(b=>near(b,F.at(q)))).map(q=>q.join(',')),crate:crate?{x:crate.x,y:crate.y}:null};
};
Sound.prototype.watchDungeon=function(g,active,dt){
 if(!(active&&g?.dungeon?.active&&!g.journey&&this.enabled&&this.sfxOn&&this.ctx&&this.master)){this.dungeonScrape(0);if(!g?.dungeon?.active)this.dwatch=null;return;}
 const F=FirstDungeon,D=F.design,e=F.current(g),p=g.player,was=this.dwatch,now=this.dwatch=this.dungeonSnapshot(g);
 const play=(name,pt=p,o={})=>this.dungeonPlay(name,{x:pt.x,y:pt.y,...o});
 // Gobelins : touchés, morts, élan d'attaque et cris d'alerte.
 this.dfoes??=new WeakMap();this.dlines??=new WeakSet();
 for(const f of g.enemies){if(f.kind!=='goblin')continue;const m=this.dfoes.get(f),swing=Number.isFinite(f.swingElapsed),who=f.chief?'chief':'gob';
  if(m&&was){if(f.dead&&!m.dead){play(who+'_die',f);play(who+'_fall',f,{delay:.42});}
   else if(!f.dead&&f.hp<m.hp&&g.time-(m.voice??-9)>.3){play(who+'_hurt',f);m.voice=g.time;}
   if(!f.dead&&swing&&!m.swing&&Math.random()<(f.chief?.8:.55))play(who+'_effort',f,{delay:f.chief?.5:.42});}
  this.dfoes.set(f,{hp:f.hp,dead:!!f.dead,swing,voice:m?.voice});}
 for(const line of GoblinTactics.speech(g))if(!this.dlines.has(line)){this.dlines.add(line);if(was)play(line.actor.chief?'chief_roar':'gob_bark',line.actor);}
 // Caisse saisie, lâchée, traînée.
 const moved=now.crate&&was?.crate&&was.grip===now.grip?Math.hypot(now.crate.x-was.crate.x,now.crate.y-was.crate.y):0;
 this.dungeonScrape(dt>0?clamp(moved/dt/24,0,1):0);
 if(!was||was.game!==g)return;
 if(was.floor!==now.floor){if(now.lift&&D.monte_charge.arrets.includes(was.floor)&&D.monte_charge.arrets.includes(now.floor)&&Math.hypot(p.x-(D.monte_charge.case[0]+.5)*32,p.y-(D.monte_charge.case[1]+.5)*32)<48)play('lift');return;}
 if(now.grip!==null&&was.grip===null)play('crate_grab',now.crate);
 if(now.grip===null&&was.grip!==null)play('crate_release',was.crate||p);
 const lever=now.levers>was.levers||now.fairy&&!was.fairy,plate=now.plates.length!==was.plates.length;
 if(lever)play('lever');if(now.fairy&&!was.fairy)play('cage_open',p,{delay:.45});
 for(const q of now.plates)if(!was.plates.includes(q))play('plate_down',F.at(q.split(',').map(Number)));
 for(const q of was.plates)if(!now.plates.includes(q))play('plate_up',F.at(q.split(',').map(Number)));
 if(now.keys>was.keys)play('key');
 if(now.lift&&!was.lift)play('winch');
 const delay=lever?.45:plate?.25:0;let cells=false;
 for(const k of now.open)if(!was.open.has(k)){const w=e.murs[k],pt=F.edge(k);
  if(w==='porte-cellule'){if(!cells)play('gate_cells',pt,{delay});cells=true;}else if(w==='herse')play('gate_rise',pt,{delay});else if(w==='porte-verrouillee')play('door_unlock',pt);else play('door_open',pt,{delay});}
 for(const k of was.open)if(!now.open.has(k)&&e.murs[k]==='herse')play('gate_drop',F.edge(k));
 const bossDoor=Object.keys(e.murs).find(k=>e.murs[k]==='porte');
 if(bossDoor&&now.bossFight&&!was.bossFight&&!now.bossDead)play('door_slam',F.edge(bossDoor));
 if(bossDoor&&now.bossDead&&!was.bossDead)play('door_open',F.edge(bossDoor),{delay:2.2});
};
const dungeonSfxFootsteps=Sound.prototype.updateFootsteps;
Sound.prototype.updateFootsteps=function(game,active,dt){dungeonSfxFootsteps.call(this,game,active,dt);this.watchDungeon(game,active,dt);};
// Les événements « dsfx » (porte verrouillée, sortie) viennent du jeu ; la porte du donjon a son propre son.
const dungeonSfxFx=Sound.prototype.fx;
Sound.prototype.fx=function(name,ev={}){if(name==='dsfx'){this.dungeonPlay(ev.name,ev);return;}if(name==='door'&&this.dwatch)return;return dungeonSfxFx.call(this,name,ev);};
