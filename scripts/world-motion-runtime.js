/* Convert actor movement budgets to screen distance once, before collisions.
 * Logical coordinates, collision geometry, navigation and saved positions stay intact. */
(()=>{
'use strict';
const move=Game.prototype.move,movePlayer=Game.prototype.movePlayer,walkNpc=Game.prototype.walkNpc,converting=new WeakSet();
// Preflight steering (portals and avoidance) may already have converted its vector.
Game.prototype.moveLogical=function(actor,x,y){return move.call(this,actor,x,y);};
Game.prototype.move=function(actor,x,y){
 if(converting.has(actor))return move.call(this,actor,x,y);
 const v=WorldProjection.motion(x,y);return move.call(this,actor,v.x,v.y);
};
Game.prototype.movePlayer=function(actor,x,y){
 if(converting.has(actor))return movePlayer.call(this,actor,x,y);
 const v=WorldProjection.motion(x,y);converting.add(actor);
 try{return movePlayer.call(this,actor,v.x,v.y);}finally{converting.delete(actor);}
};
// Path walking already consumes a projected budget per segment. Some species
// replay that displacement through move() to add body collisions: do not convert twice.
Game.prototype.walkNpc=function(actor,target,dt){
 if(converting.has(actor))return walkNpc.call(this,actor,target,dt);
 converting.add(actor);try{return walkNpc.call(this,actor,target,dt);}finally{converting.delete(actor);}
};
})();
