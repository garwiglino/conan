/* Native architecture bridge. Availability does not spawn buildings into towns. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('../sprites/architecture/architecture.js'),require('../sprites/architecture/localities.js'));
 else root.HearthreaverArchitectureWorld=factory(root.HearthreaverArchitecture,root.HearthreaverArchitectureLocalities);
})(globalThis,function(A,localities){
'use strict';
function locality(name){return localities.find(l=>l.name===name)||null;}
function available(name){const l=locality(name);if(!l)throw new RangeError('Localité inconnue : '+name);return {locality:l,buildings:l.models.map(A.entry),optionalModules:l.optionalFortificationKit.map(A.entry)};}
function restore(saved){
 const items=Array.isArray(saved)?saved:[];if(items.length>2048)throw new RangeError('Trop de pièces d’architecture sauvegardées');
 const ids=new Set();return items.map((o,i)=>{const clean=A.snapshot(o),uid=String(o.uid||'architecture-'+i);if(ids.has(uid))throw new Error('Identifiant architectural dupliqué');ids.add(uid);return {...clean,uid,...(o.site?{site:String(o.site)}:{})};});
}
function install(Game,Renderer){
 if(Game.prototype.__architectureInstalled)return;
 Object.defineProperty(Game.prototype,'__architectureInstalled',{value:true});
 const init=Game.prototype.initAtlas,serialize=Game.prototype.serialize,solid=Game.prototype.solid;
 Game.prototype.initAtlas=function(saved){const result=init.call(this,saved);this.architectureProps=restore(saved?.architecture);return result;};
 Game.prototype.serialize=function(){const saved=serialize.call(this);if(this.architectureProps?.length)saved.architecture=this.architectureProps.map(o=>({...A.snapshot(o),uid:o.uid,...(o.site?{site:o.site}:{})}));return saved;};
 Game.prototype.placeArchitecture=function(id,options={}){
  const d=A.entry(id),site=options.site?locality(options.site):null;
  if(options.site&&!site)throw new RangeError('Localité inconnue');
  if(site&&d.family!=='shared'&&d.family!==site.family)throw new Error('Cette famille architecturale ne correspond pas à '+site.name);
  this.architectureProps ||= [];let next=1;while(this.architectureProps.some(o=>o.uid==='architecture-'+next))next++;
  const clean=A.snapshot({...options,id}),uid=options.uid||'architecture-'+next;if(this.architectureProps.some(o=>o.uid===uid))throw new Error('Identifiant déjà placé');
  const placed={...clean,uid,...(site?{site:site.name}:{})};this.architectureProps.push(placed);return placed;
 };
 Game.prototype.removeArchitecture=function(uid){const i=(this.architectureProps||[]).findIndex(o=>o.uid===uid);if(i<0)return false;this.architectureProps.splice(i,1);return true;};
 Game.prototype.architectureSolid=function(x,y,r=4,z=0,height=19){return A.collides(this.architectureProps||[],x,y,{radius:r,z,height});};
 Game.prototype.architectureHeight=function(x,y){return A.standingHeight(this.architectureProps||[],x,y);};
 Game.prototype.solid=function(x,y,r=5,level=0){
  if(solid.call(this,x,y,r,level))return true;
  return this.architectureSolid(x,y,r,level===1?12:Math.max(0,Number(level)||0));
 };
 Renderer.prototype.architectureDrawObjects=function(){
  const objects=[],cam=this.cam||{x:0,y:0},W=this.W||320,H=this.H||224;
  for(const o of this.g.architectureProps||[]){const d=A.entry(o.id),f=d.frames[o.dir||d.views[0]],left=o.x-f.anchor[0],top=o.y-f.anchor[1]-(f.lift||0);if(left+f.size[0]<cam.x||left>cam.x+W||top+f.size[1]<cam.y||top>cam.y+H)continue;
   objects.push({level:0,y:o.y,fn:()=>A.drawStructure(this.c,o)});
  }return objects;
 };
}
return Object.freeze({install,available,locality,localities,restore});
});
