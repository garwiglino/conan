/* The dungeon uses the same light mask and additive glow as outdoor torches.
 * All source coordinates stay logical until this single display projection. */
const DungeonLighting=(()=>{
 'use strict';
 const AMBIENT=Object.freeze([56,60,76]),F=FirstDungeon;
 function collect(renderer){
  const g=renderer.logicalGame||renderer.g._logical||renderer.g,e=F.current(g),state=F.state(g),floor=F.art.floors[e.id],seen=g.dungeonSeen||new Set(state.seen),L=[],G=[],sources=[];
  for(const item of floor?.items||[]){
   const spec=DUNGEON_DATA.art.lightSpecs?.[item.piece];if(!spec||item.cells&&!item.cells.some(([i,j])=>seen.has(i+','+j)))continue;
   const edge=item.edge?.join(',');if(item.piece.endsWith('/porte-scellee')&&(state.open.includes(edge)||g.dungeon.fairy))continue;
   if(item.piece==='cage-fee'&&g.dungeon.fairy)continue;
   const fire=/mur-torche$|^brasero$|^marmite$/.test(item.piece),window=item.piece.endsWith('/fenetre'),col=fire?[255,160,80]:window?[155,177,210]:[178,124,238];
   const x=item.ref[0]+spec.at[0],y=item.ref[1]+spec.at[1],z=spec.at[2],at=WorldProjection.point(x,y,z),pool=WorldProjection.point(x,y,z*.20),seed=x*.13+y*.27;
   const flicker=fire?1+.06*Math.sin(g.time*9+seed)+.035*Math.sin(g.time*9*1.63+seed*.7):1;
   const radius=spec.rayon*(window?.75:.66),amp=spec.force*(window?.46:.92)*flicker;
   L.push([pool.x,pool.y,radius,col,amp],[at.x,at.y,fire?15:11,fire?[255,196,120]:col,amp*.8]);
   G.push([at.x,at.y,fire?14:10,col,amp*.32]);sources.push({piece:item.piece,x,y,z,screen:at,radius,intensity:amp});
  }
  // A modest neutral fill keeps the player's hands and immediate footing readable.
  // It does not light a room as brightly as a torch.
  const p=g.player;if(!g.dead){const q=WorldProjection.point(p.x,p.y);L.push([q.x,q.y-7,48,[175,177,190],.55]);}
  if(g.dungeon.fairy){const q=WorldProjection.point(p.x-16,p.y-16,18);L.push([q.x,q.y,32,[167,149,231],.40]);G.push([q.x,q.y,8,[195,170,255],.30]);}
  return {L,G,sources};
 }
 function draw(renderer,c){
  const light=collect(renderer);renderer.dungeonLightSources=light.sources;renderer.mg={L:[],G:light.G};
  const dark=renderLightLayer(renderer,c,renderer.W,renderer.H-renderer.top,AMBIENT,light.L);renderer.glowFX(c,dark);
 }
 const lights=Renderer.prototype.lights;
 Renderer.prototype.lights=function(){return this.g.dungeon?.active?collect(this).L:lights.call(this);};
 return Object.freeze({AMBIENT,collect,draw});
})();
