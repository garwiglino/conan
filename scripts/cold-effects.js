/* Small deterministic breath puffs. No global particles, sprite assets or timers. */
function coldBreathProfile(n){
 const species=String(n.race||n.species||n.kind||n.look||'').toLowerCase(),body=[n.race,n.species,n.kind,n.look].join(' ').toLowerCase();
 if(n.breathes===false||n.spirit||n.undead||n.coldBlooded||n.dead||n.hp<=0||n.id==='fairy'||/skeleton|undead|ghost|spirit|fairy|snake|reptile|golem|guardian|boss/.test(body))return null;
 if(species.startsWith('transport_horse'))return {mouth:[21,-30],dir:1,strength:1.1};
 if(n.warmBlooded||/^(human|elf|dwarf|orc|goblin|nomade|cultist|hero)$/.test(species))return {mouth:n.breathMouth||[0,n.look==='cultist'?-10:n.look==='hero'?-11:-14],strength:1};
 return null;
}
Renderer.prototype.coldBreath=function(n){
 const g=this.g,cam=this.cam||{x:0,y:0};if(g.journey||n.hidden||(n.alpha??1)<=0||n.x<cam.x-12||n.x>cam.x+(this.W||320)+12||n.y<cam.y-12||n.y>cam.y+(this.H||180)+40)return;
 const profile=coldBreathProfile(n);if(!profile)return;
 if(this.breathGame!==g){this.breathGame=g;this.breathActors=new WeakMap();}
 let s=this.breathActors.get(n);if(!s){let seed=17;for(const ch of String(n.id||n.kind||n.look))seed=(seed*31+ch.charCodeAt(0))>>>0;seed=(seed+(n.x*13+n.y*7|0))>>>0;s={seed,cycle:-1,born:-100};this.breathActors.set(n,s);}
 if(s.sample!==Math.floor(g.clock)||Math.abs((s.x??Infinity)-n.x)>8||Math.abs((s.y??Infinity)-n.y)>8){const w=Atlas.toWorld(n.x,n.y);s.temperature=worldClimateAt(g.clock,w.x,w.y).temperature;s.sample=Math.floor(g.clock);s.x=n.x;s.y=n.y;}
 const cold=clamp((5-s.temperature)/13,0,1);if(!cold){s.born=-100;return;}
 const period=3.2+(s.seed%110)/100,phase=g.time+(s.seed%251)/100,cycle=Math.floor(phase/period),dir=profile.dir??n.dir??2;
 if(cycle!==s.cycle){s.cycle=cycle;if(phase%period<.25&&dir!==0){s.born=g.time;s.dx=dir===1?1:dir===3?-1:0;s.dy=dir===2?.8:0;const bob=n.moving||n.anim>0?(n.look==='cultist'?[1,0,0,1,0,0][Math.floor(n.anim||0)%6]:(Math.floor(n.anim||0)%6)%3===1?1:0):0;s.ox=n.x+profile.mouth[0]+(profile.dir===undefined?s.dx*4:0);s.oy=n.y+profile.mouth[1]+bob;}}
 const age=g.time-s.born,life=.85+cold*.25;if(age<0||age>=life)return;const t=age/life,c=this.c;
 c.save();c.fillStyle='#d4dfdc';const opacity=.32*cold*profile.strength*(n.alpha??1)*Math.min(1,t*8)*(1-t)*(dir===0?.3:1);
 // Each group separates, rises, loses pixels and fades; the emitted origin stays in world space.
 for(let i=0;i<5;i++){if(t>.65&&i%2===0)continue;const spread=t*(1+i*.28),x=Math.round(s.ox+s.dx*(1+t*7)+(i%3-1)*spread),y=Math.round(s.oy+s.dy*t*5-t*t*5+(i%2?1:-1)*spread);c.globalAlpha=opacity*(i%2?.65:1);c.fillRect(x,y,i<2&&t<.55?2:1,1);}
 c.restore();
};
const coldNpcDraw=Renderer.prototype.npcDraw;
Renderer.prototype.npcDraw=function(n){coldNpcDraw.call(this,n);this.coldBreath(n);};
const coldProp=Renderer.prototype.prop;
Renderer.prototype.prop=function(n){coldProp.call(this,n);if(n.kind?.startsWith('transport_horse'))this.coldBreath(n);};
// Refresh existing visible site props in place: transport, inns and collisions survive.
Renderer.prototype.refreshColdSiteProps=function(clock){
 const g=this.g,cellKey=Math.floor(clock),position=Math.floor(this.cam.x/256)+','+Math.floor(this.cam.y/256);
 if(this.coldSiteGame===g&&this.coldSiteClock===cellKey&&this.coldSitePosition===position)return;
 if(this.coldSiteGame!==g){this.coldSites=new Map();this.coldSiteGame=g;}this.coldSiteClock=cellKey;this.coldSitePosition=position;
 const sites=new Set();for(const o of g.atlasProps){if(o.id&&o.site&&Math.abs(o.x-this.cam.x-this.W/2)<this.W/2+96&&Math.abs(o.y-this.cam.y-this.H/2)<this.H/2+96)sites.add(o.site);}
 for(const id of sites){const n=Atlas.byId[id],cell=Atlas.cellAt(n.x,n.y),key=Atlas.snowCover(cell?.biome,cell?.height,clock)>.3;if(this.coldSites.get(id)===key)continue;this.coldSites.set(id,key);const kinds=new Map(atlasSiteProps(n,clock).map(o=>[o.id,o.kind]));for(const o of g.atlasProps)if(o.site===id&&kinds.has(o.id)&&!o.kind.startsWith('transport_'))o.kind=kinds.get(o.id);}
};
