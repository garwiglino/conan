const {test}=require('node:test');const assert=require('node:assert/strict');const A=require('../sprites/hommes-singes/activites');
test('all activity poses preserve canvas bounds and depth ordering in both silhouettes',()=>{
 let count=0;
 for(const sex of ['male','female'])for(const dir of ['face','dos','gauche','droite'])for(const [action,c]of Object.entries(A.CLIPS))for(let frame=0;frame<c.frames;frame++){
 const r=A.renderLayers({action,frame,dir,sex,role:'warden'});assert.equal(r.metadata.clippedPixels,0,`${action}/${dir}/${frame}`);
 assert.ok(r.order.indexOf('rearArms')<r.order.indexOf('body'));assert.ok(r.order.indexOf('rearEquipment')<r.order.indexOf('body'));
 for(const side of Object.keys(r.metadata.elbows)){const h=r.metadata.hands[side],e=r.metadata.elbows[side];assert.ok(Math.hypot(h[0]-e[0],h[1]-e[1])<=8,`${action}: forearm overextended`);}
 count++;
 }
 assert.ok(count>3000);
});
test('profile and rear view conceal the far arm behind the body',()=>{
 for(const dir of ['dos','gauche','droite']){const r=A.renderLayers({action:'armed_idle',role:'warden',dir});assert.ok(r.layers.rearArms.length>0);assert.ok(r.layers.rearEquipment.length>0);}
});
test('rhythms distinguish load, travel, fine work, heavy work and combat recovery',()=>{
 const c=A.CLIPS;assert.ok(c.armed_walk.duration>c.walk.duration);assert.ok(c.carry.duration>c.armed_walk.duration);assert.ok(c.flee.duration<c.walk.duration);
 assert.ok(c.axe_chop.duration>c.blade_cut.duration);assert.ok(c.mourn.duration>c.greet.duration);assert.ok(c.honey.duration>c.cut_fiber.duration);
 for(const id of Object.keys(c)){
 assert.equal(c[id].durations.length,c[id].frames);assert.ok(c[id].durations.every(t=>t>=30));
 assert.equal(A.frameAt(id,0),0);if(!c[id].loop)assert.equal(A.frameAt(id,999),c[id].frames-1);
 for(const m of c[id].markers){const t=c[id].durations.slice(0,m.frame).reduce((a,b)=>a+b,0)/1000;assert.equal(A.eventsBetween(id,t-.00001,t+.00001).filter(e=>e.id===m.id).length,1);}
 }
 for(const id of ['hoe','hew','joinery','repair_boat'])assert.ok(c[id].markers.every(m=>m.frame===3));
});
test('weapon smears follow the weapon depth, and combat returns to rest',()=>{
 for(const dir of ['face','dos','gauche','droite'])for(const action of ['spear_thrust','staff_sweep','axe_chop','blade_cut']){
 const strike=A.renderLayers({action,frame:5,dir,role:'warden'});assert.ok(strike.layers[dir==='dos'||dir==='gauche'?'rearSmear':'smear'].length>0);
 const end=A.renderLayers({action,frame:11,dir,role:'warden'}),rest=A.renderLayers({action:'armed_idle',frame:0,dir,role:'warden'});
 assert.deepEqual(end.metadata.hands,rest.metadata.hands);
 }
});
