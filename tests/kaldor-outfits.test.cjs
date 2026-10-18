const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),rig=require('../scripts/kaldor-outfit-rig.cjs');
const CIV=JSON.parse(fs.readFileSync(path.join(root,'data/civilians/atlas.json'),'utf8'));
const ATLAS=JSON.parse(fs.readFileSync(path.join(root,'data/kaldor-outfits/atlas.json'),'utf8'));
async function sheet(asset){const im=await loadImage(Buffer.from(asset.png,'base64')),c=require('@napi-rs/canvas').createCanvas(im.width,im.height).getContext('2d');c.drawImage(im,0,0);return {w:im.width,data:c.getImageData(0,0,im.width,im.height).data};}
function tile(s,asset,index){const i=asset.tiles[index],ox=i%16*48,oy=Math.floor(i/16)*48,out=Buffer.alloc(80*80*4);
 for(let y=0;y<48;y++)for(let x=0;x<48;x++){const a=((oy+y)*s.w+ox+x)*4,b=((16+y)*80+16+x)*4;for(let k=0;k<4;k++)out[b+k]=s.data[a+k];}return out;}
const opaque=(im,i)=>im[i+3]>0;

test('the start outfit is the NPC Pagne noué rebuilt by the node rig, pixel for pixel, minus the carry crate',async()=>{
 const e01=CIV.outfits['E01-masculin-terre'],s=await sheet(e01.asset);
 const def=require('../art/kaldor-tenues/pagne-noue.cjs'),layers=rig.build(def);
 const withCrate=rig.animate(layers,{tools:true}),hero=rig.animate(layers);
 let frames=0;
 for(const clip of rig.COMMON)for(let d=0;d<4;d++){
  const n=CIV.clips[clip].durations.length;assert.equal(withCrate.index[clip][d]-withCrate.index[clip][0],d*n);
  for(let f=0;f<n;f++){
   const shipped=tile(s,e01.asset,e01.frames[clip][d]+f),ours=withCrate.frames[withCrate.index[clip][d]+f];
   assert.ok(shipped.equals(ours),clip+' '+d+' '+f);frames++;
   const bare=hero.frames[hero.index[clip][d]+f];
   if(clip!=='carry')assert.ok(bare.equals(ours),'tools only change carry: '+clip);
  }
 }
 assert.equal(frames,268);
 // The crate is gone from the hero's carry clip (guard, use, draw and sheathe).
 const crate=rig.hex('79533a'),carry=hero.frames[hero.index.carry[0]];
 for(let i=0;i<carry.length;i+=4)assert.ok(!(carry[i]===crate[0]&&carry[i+1]===crate[1]&&carry[i+2]===crate[2]&&opaque(carry,i)));
});

const CLIPS=[...rig.COMMON,'dress','helm'];
test('the outfit atlas is rebuilt from its sources and keeps the shipped clip timings',()=>{
 for(const id of rig.COMMON)assert.deepEqual(ATLAS.clips[id],CIV.clips[id]);
 assert.equal(ATLAS.clips.dress.loop,false);assert.equal(ATLAS.clips.dress.durations.length,8);
 assert.equal(ATLAS.clips.helm.loop,false);assert.equal(ATLAS.clips.helm.durations.length,5);
 for(const id of ['dress','helm'])for(let d=0;d<4;d++)assert.equal(ATLAS[id].head[d].length,ATLAS.clips[id].durations.length);
 assert.equal(Object.keys(ATLAS.outfits).length,11);
 for(const o of Object.values(ATLAS.outfits)){
  const def=require('../art/kaldor-tenues/'+o.id+'.cjs');assert.equal(o.label,def.label);assert.ok(Number.isInteger(o.warmth)&&o.warmth>=0&&o.warmth<=3);
  for(const clip of CLIPS){assert.equal(o.frames[clip].length,4);
   for(const sheet of [o.asset,o.foreground,o.bare])assert.ok(o.frames[clip][3]+ATLAS.clips[clip].durations.length<=sheet.tiles.length);}
  for(const c of [...o.arms.sleeve,...o.arms.hand,...o.cloth])assert.match(c,/^[0-9a-f]{6}$/);
 }
 assert.ok(ATLAS.outfits['pagne-noue']);assert.equal(ATLAS.outfits['pagne-noue'].place,null);
});

test('helmets are NPC headgear modules: nape, helmet and hair mask planes for every clip',()=>{
 const helmets=Object.values(ATLAS.helmets);assert.equal(helmets.length,5);
 assert.ok(helmets.some(h=>h.closed)&&helmets.some(h=>!h.closed),'open and closed helmets');
 for(const h of helmets){
  const def=require('../art/kaldor-casques/'+h.id+'.cjs');assert.equal(h.label,def.label);assert.equal(h.closed,!!def.closed);
  assert.ok(Number.isInteger(h.warmth)&&h.warmth>=0&&h.warmth<=1);assert.ok(h.place&&h.description);
  assert.ok(def.layers.some(l=>/^MASQUE/.test(l.name)),h.id+' masks the hair');
  for(const l of def.layers)assert.equal(rig.role(l.name),'hat',l.name);
  assert.equal(h.asset.tiles.length,3*h.count);
  for(const clip of CLIPS){assert.equal(h.frames[clip].length,4);assert.ok(h.frames[clip][3]+ATLAS.clips[clip].durations.length<=h.count);
   for(let d=0;d<4;d++)assert.equal(h.frames[clip][d],ATLAS.outfits['pagne-noue'].frames[clip][d],'same frame index as the outfits');}
 }
});

// ---- In game: mannequins, taking, wearing, saving, drawing. ----
const vm=require('node:vm'),{html,canvas}=require('./game-harness.cjs');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
let game=null;
async function loadWardrobe(){
 if(game)return game;
 const context=vm.createContext({console,Image:canvas.Image,Uint8ClampedArray,Path2D:canvas.Path2D,setTimeout:()=>0,
  document:{createElement(tag){if(tag!=='canvas')throw Error(tag);return canvas.createCanvas(1,1);},getElementById(){return {hidden:true,clientHeight:224};}}});
 vm.runInContext(script.slice(0,script.indexOf('// app.js'))+';globalThis.api={Game,Atlas,KaldorWardrobe,KALDOR_OUTFITS,Art:HearthreaverKaldorCivilianArt,BITMAPS};})();',context);
 await context.api.BITMAPS.promise;assert.equal(await context.api.Art.preload(),true);
 return game=context.api;
}
// Game objects come from another realm: compare them as plain data.
const plain=v=>JSON.parse(JSON.stringify(v));
const swordPose=(()=>{const a=html.indexOf('const SWORD_POSES='),b=html.indexOf('function greatsword(',a);const box={};vm.runInNewContext(html.slice(a,b)+'\nthis.pose=swordPose;',box);return box.pose;})();
const FOUND=Object.values(ATLAS.outfits).filter(o=>o.place),HELMS=Object.values(ATLAS.helmets);
const rgb=(d,i)=>(d[i]<<16|d[i+1]<<8|d[i+2]).toString(16).padStart(6,'0');
const colours=(im,y0=0,y1=79)=>{const d=im.getContext('2d').getImageData(0,0,80,80).data,s=new Set();for(let i=y0*320;i<(y1+1)*320;i+=4)if(d[i+3])s.add(rgb(d,i));return s;};
// Pixels of the given colours in rows y0..y1 of an 80px frame.
const count=(im,set,y0,y1)=>{const d=im.getContext('2d').getImageData(0,0,80,80).data;let n=0;for(let i=y0*320;i<(y1+1)*320;i+=4)if(d[i+3]&&set.has(rgb(d,i)))n++;return n;};
const HAIR=new Set(['2e2029','523a34','927052']),SKIN=new Set(['f8b07a','c8743e']);

test('ten unique outfits and five helmets wait on mannequins and posts, clear and walkable, by their localities',async()=>{
 const {Game,Atlas,KaldorWardrobe}=await loadWardrobe();const g=new Game();
 assert.equal(FOUND.length,10);assert.ok(FOUND.some(o=>o.warmth>=2)&&FOUND.some(o=>o.warmth===0));
 assert.deepEqual(plain(g.wardrobe),{owned:['pagne-noue'],worn:'pagne-noue',helmets:[],helmet:null});
 const stands=g.atlasProps.filter(o=>o.kind==='kaldor_outfit'),posts=g.atlasProps.filter(o=>o.kind==='kaldor_helmet');
 assert.ok([...stands,...posts].every(o=>!o.taken));
 assert.deepEqual(plain(stands.map(o=>o.outfit).sort()),FOUND.map(o=>o.id).sort());
 assert.deepEqual(plain(posts.map(o=>o.helmet).sort()),HELMS.map(h=>h.id).sort());
 assert.equal(new Set(FOUND.map(o=>o.place.site)).size,10,'one outfit per locality');
 assert.equal(new Set(HELMS.map(h=>h.place.site)).size,5,'one helmet per locality');
 for(const s of [...stands,...posts]){const name=s.outfit||s.helmet;
  const site=Atlas.byId[s.site],c=Atlas.toGame(site.x,site.y);
  assert.ok(Math.hypot(s.x-c.x,s.y-c.y)<70,name+' stands by '+site.name);
  assert.ok(!g.solid(s.x,s.y,8,0)&&!g.solid(s.x,s.y-10,6,0),name+' stands on open ground');
  // Big transport props (horse on its platform, cart) are drawn over a near stand.
  for(const o of [...g.atlasProps,...g.world.props])if(o!==s)assert.ok(Math.hypot(o.x-s.x,o.y-s.y)>(/^transport_/.test(o.kind)?40:18),name+' clear of '+o.kind);
  for(const v of g.npcs)assert.ok(Math.hypot(v.x-s.x,v.y-s.y)>18,name+' clear of '+v.id);
  // Walkable: the open ground around the stand reaches well beyond it.
  const seen=new Set(['0,0']),queue=[[0,0]];let far=0;
  while(queue.length&&far<120){const [x,y]=queue.shift();far=Math.max(far,Math.hypot(x,y));
   for(const [a,b] of [[6,0],[-6,0],[0,6],[0,-6]]){const k=(x+a)+','+(y+b);if(seen.has(k)||Math.hypot(x+a,y+b)>130)continue;seen.add(k);
    if(!g.solid(s.x+x+a,s.y+y+b,5,0))queue.push([x+a,y+b]);}}
  assert.ok(far>=120,name+' can be walked to ('+Math.round(far)+'px of open ground)');
 }
 assert.equal(KaldorWardrobe.spot(ATLAS.outfits['pagne-noue']),null);
});

test('taking an outfit from its mannequin, wearing it and saving round-trip; older saves start in the pagne',async()=>{
 const {Game,Art}=await loadWardrobe();const g=new Game(),events=[];
 const emit=g.emit.bind(g);g.emit=(kind,data)=>{events.push([kind,data]);return emit(kind,data);};
 const stand=g.atlasProps.find(o=>o.kind==='kaldor_outfit'&&o.outfit==='pelisse-grand-froid');
 Object.assign(g.player,{x:stand.x+40,y:stand.y+4});assert.notEqual(g.context()?.kind,'outfit','out of reach');
 Object.assign(g.player,{x:stand.x+10,y:stand.y+4});
 const c=g.context();assert.equal(c.kind,'outfit');assert.equal(c.text,'E  PRENDRE : PELISSE DU GRAND FROID');
 g.interact();
 assert.deepEqual(plain(g.wardrobe.owned),['pagne-noue','pelisse-grand-froid']);
 assert.equal(g.atlasProps.find(o=>o.outfit==='pelisse-grand-froid').taken,true,'the mannequin stays, bare');
 assert.notEqual(g.context()?.kind,'outfit','nothing left to take');
 assert.ok(events.some(([k,d])=>k==='notice'&&d.title==='Tenue trouvée'));assert.ok(events.some(([k])=>k==='save'));
 assert.equal(g.takeOutfit('pelisse-grand-froid'),false,'taken once');
 assert.equal(g.wardrobe.worn,'pagne-noue');assert.equal(g.outfitWarmth(),0);
 assert.equal(g.wearOutfit('voiles-nomade'),false,'not owned yet');
 assert.equal(g.wearOutfit('pelisse-grand-froid'),true);
 assert.equal(Art.outfit(),'pelisse-grand-froid');assert.equal(g.outfitWarmth(),3);assert.deepEqual(plain(g.player.dressing),{t0:g.time,clip:'dress'});
 // A helmet from its post: worn on top of the outfit, warmth adds up to 3 at most.
 const post=g.atlasProps.find(o=>o.kind==='kaldor_helmet'&&o.helmet==='casque-fourre');
 Object.assign(g.player,{x:post.x-10,y:post.y+4});
 const h=g.context();assert.equal(h.kind,'helmet');assert.equal(h.text,'E  PRENDRE : CASQUE FOURRÉ');
 g.interact();assert.deepEqual(plain(g.wardrobe.helmets),['casque-fourre']);
 assert.equal(g.atlasProps.find(o=>o.helmet==='casque-fourre').taken,true);assert.notEqual(g.context()?.kind,'helmet');
 assert.ok(events.some(([k,d])=>k==='notice'&&d.title==='Casque trouvé'));
 assert.equal(g.takeHelmet('casque-fourre'),false,'taken once');
 assert.equal(g.wearHelmet('casque-nasal'),false,'not owned yet');
 assert.equal(g.wearHelmet('casque-fourre'),true);assert.equal(g.wearHelmet('casque-fourre'),false,'already worn');
 assert.equal(Art.helmet(),'casque-fourre');assert.deepEqual(plain(g.player.dressing),{t0:g.time,clip:'helm'});
 assert.equal(g.outfitWarmth(),3,'capped at the great cold');
 assert.equal(g.wearOutfit('pagne-noue'),true);assert.equal(g.outfitWarmth(),1,'the helmet alone');
 assert.equal(Art.helmet(),'casque-fourre','changing outfits keeps the helmet');
 assert.equal(g.wearHelmet(null),true);assert.equal(Art.helmet(),null);assert.equal(g.outfitWarmth(),0);
 g.wearHelmet('casque-fourre');g.wearOutfit('pelisse-grand-froid');
 const saved=JSON.parse(JSON.stringify(g.serialize()));
 assert.deepEqual(plain(saved.wardrobe),{owned:['pagne-noue','pelisse-grand-froid'],worn:'pelisse-grand-froid',helmets:['casque-fourre'],helmet:'casque-fourre'});
 Art.wear('pagne-noue');Art.wearHelmet(null);
 const back=new Game(saved);
 assert.deepEqual(plain(back.wardrobe),saved.wardrobe);assert.equal(Art.outfit(),'pelisse-grand-froid');assert.equal(Art.helmet(),'casque-fourre');assert.equal(back.player.dressing,null);
 assert.deepEqual(plain(back.atlasProps.filter(o=>o.kind==='kaldor_outfit'&&o.taken).map(o=>o.outfit)),['pelisse-grand-froid']);
 assert.deepEqual(plain(back.atlasProps.filter(o=>o.kind==='kaldor_helmet'&&o.taken).map(o=>o.helmet)),['casque-fourre']);
 assert.equal(back.atlasProps.filter(o=>o.kind==='kaldor_outfit').length,10);assert.equal(back.atlasProps.filter(o=>o.kind==='kaldor_helmet').length,5);
 const old={...saved};delete old.wardrobe;
 assert.deepEqual(plain(new Game(old).wardrobe),{owned:['pagne-noue'],worn:'pagne-noue',helmets:[],helmet:null});assert.equal(Art.outfit(),'pagne-noue');assert.equal(Art.helmet(),null);
 assert.deepEqual(plain(new Game({...saved,wardrobe:{owned:['pagne-noue','pelisse-grand-froid'],worn:'pelisse-grand-froid'}}).wardrobe),
  {owned:['pagne-noue','pelisse-grand-froid'],worn:'pelisse-grand-froid',helmets:[],helmet:null},'a first wardrobe save has no helmets');
 assert.deepEqual(plain(new Game({...saved,wardrobe:{owned:['manteau-inconnu','voiles-nomade'],worn:'manteau-inconnu',helmets:['heaume-perdu','casque-cornes'],helmet:'heaume-perdu'}}).wardrobe),
  {owned:['pagne-noue','voiles-nomade'],worn:'pagne-noue',helmets:['casque-cornes'],helmet:null},'unknown pieces are dropped');
});

test('putting an outfit on raises the arms, pulls the new garment over the head, then shows it',async()=>{
 const {Art}=await loadWardrobe();
 Art.wear('pagne-noue');Art.wear('cuir-traqueur');
 const total=Art.dressDuration();assert.equal(total,ATLAS.clips.dress.durations.reduce((a,b)=>a+b,0)/1000);
 const actor={dressing:{t0:10}};
 assert.deepEqual(plain(Art.dressLook(actor,10.05)),{state:'dress',frame:0});
 const helmTotal=Art.dressDuration('helm');assert.equal(helmTotal,ATLAS.clips.helm.durations.reduce((a,b)=>a+b,0)/1000);
 assert.deepEqual(plain(Art.dressLook({dressing:{t0:0,clip:'helm'}},.05)),{state:'helm',frame:0});
 assert.equal(Art.dressLook({dressing:{t0:0,clip:'helm'}},helmTotal),null);
 assert.equal(Art.dressLook(actor,10+total/2).state,'dress');
 assert.equal(Art.dressLook(actor,10+total),null);assert.equal(actor.dressing,null,'over');
 for(const stop of [{moving:true},{attack:.2},{dash:.1},{hurt:.3},{guard:true},{melee:.1}]){
  const a={dressing:{t0:0},...stop};assert.equal(Art.dressLook(a,.1),null);assert.equal(a.dressing,null);
 }
 const next=ATLAS.outfits['cuir-traqueur'];
 for(let dir=0;dir<4;dir++){
  const frames=[0,1,2,3,4,5,6,7].map(f=>Art.nativeFrame(dir,'dress',f));
  frames.forEach((im,f)=>assert.ok(im,'dress '+dir+':'+f));
  // The old outfit until the garment is over the head, then the new one.
  const was=colours(Art.portrait('pagne-noue',dir)),now=colours(Art.portrait('cuir-traqueur',dir));
  const only=(a,b,im)=>[...a].filter(c=>!b.has(c)&&colours(im).has(c)).length;
  assert.ok(only(was,now,frames[0])>0&&only(now,was,frames[0])===0,'old pagne at first '+dir);
  assert.ok(only(now,was,frames[7])>0&&only(was,now,frames[7])===0,'new outfit at the end '+dir);
  // Over the head (frame 2): the new garment's cloth above the shoulders.
  const d=frames[2].getContext('2d').getImageData(0,0,80,80).data;let over=0;
  for(let y=20;y<40;y++)for(let x=20;x<60;x++){const i=(y*80+x)*4;if(d[i+3]&&next.cloth.includes(rgb(d,i)))over++;}
  assert.ok(over>=6,'garment over the head '+dir+' ('+over+')');
 }
 Art.wear('pagne-noue');
});

test('every outfit animates every state, view and blow, with its own sleeves and fists on the grip',async()=>{
 const {Art}=await loadWardrobe();const looks=new Set();
 for(const o of Object.values(ATLAS.outfits)){
  Art.wear(o.id);
  for(let dir=0;dir<4;dir++){
   for(const state of ['idle','sheathed_idle','walk','sheathed_walk','guard','use','melee','draw','sheathe','dash','hurt','sheathed_hurt'])
    for(const f of [0,2,5])assert.ok(Art.nativeFrame(dir,state,f),o.id+' '+state+' '+dir+':'+f);
   for(let combo=0;combo<4;combo++)for(let f=0;f<6;f++)assert.ok(Art.nativeFrame(dir,'attack',f,combo,swordPose),o.id+' attack '+dir+':'+combo+':'+f);
  }
  const blow=colours(Art.nativeFrame(2,'attack',3,0,swordPose));
  assert.ok(blow.has(o.arms.hand[0]),o.id+' fists on the grip');
  const idle=Art.nativeFrame(2,'sheathed_idle',0);looks.add([...colours(idle)].sort().join());
 }
 assert.equal(looks.size,Object.keys(ATLAS.outfits).length,'each outfit has its own look');
 Art.wear('pagne-noue');
});

test('a helmet hides the hair under its mask: open ones let the mane out below, closed ones cover the face',async()=>{
 const {Art}=await loadWardrobe();Art.wear('pagne-noue');
 for(const h of Object.values(ATLAS.helmets)){
  Art.wearHelmet(h.id);
  for(const dir of [2,1,0,3]){
   const im=Art.nativeFrame(dir,'sheathed_idle',0),bare=Art.portrait({outfit:'pagne-noue',helmet:null},dir);
   assert.ok(count(bare,HAIR,28,35)>20,'bare head has hair on top '+dir);
   assert.equal(count(im,HAIR,25,35),0,h.id+' hides the hair under it '+dir);
   // From the front a closed helm sits on the shoulders; the mane shows on the back.
   if(!h.closed||dir===0)assert.ok(count(im,HAIR,38,48)>0,h.id+' lets the long hair out below '+dir);
   // The bare face shows 44 skin pixels: a closed helmet leaves only its eye
   // and mouth openings, an open one most of the face.
   if(dir===2)assert.ok(h.closed?count(im,SKIN,31,43)<=12:count(im,SKIN,31,43)>=28,h.id+(h.closed?' covers':' shows')+' the face');
  }
 }
 Art.wearHelmet(null);
});

test('every helmet follows every state, view and blow, and is lifted on with the helm clip',async()=>{
 const {Art}=await loadWardrobe();Art.wear('brigandine-mercenaire');
 const looks=new Set();
 for(const h of Object.values(ATLAS.helmets)){
  Art.wearHelmet(h.id);
  for(let dir=0;dir<4;dir++){
   for(const state of ['idle','sheathed_idle','walk','sheathed_walk','guard','use','draw','dash','hurt'])for(const f of [0,3])assert.ok(Art.nativeFrame(dir,state,f),h.id+' '+state+' '+dir+':'+f);
   for(let combo=0;combo<4;combo++)for(const f of [1,3])assert.ok(Art.nativeFrame(dir,'attack',f,combo,swordPose),h.id+' attack '+dir+':'+combo+':'+f);
   for(let f=0;f<5;f++)assert.ok(Art.nativeFrame(dir,'helm',f),h.id+' helm '+dir+':'+f);
  }
  looks.add([...colours(Art.nativeFrame(2,'sheathed_idle',0),20,44)].sort().join());
  // The old head until both hands hold the new helmet at it.
  Art.wearHelmet(null);Art.wearHelmet(h.id);
  const own=[...colours(Art.portrait({outfit:'brigandine-mercenaire',helmet:h.id}),20,44)].filter(c=>!colours(Art.portrait({outfit:'brigandine-mercenaire',helmet:null}),20,44).has(c));
  assert.ok(own.length>0);
  assert.equal(own.filter(c=>colours(Art.nativeFrame(2,'helm',0),20,44).has(c)).length,0,h.id+' not on yet');
  assert.ok(own.every(c=>colours(Art.nativeFrame(2,'helm',4),20,44).has(c)),h.id+' on at the end');
 }
 assert.equal(looks.size,Object.keys(ATLAS.helmets).length,'each helmet has its own look');
 // The attack keeps the helmet on the leaning head: no hair above it.
 Art.wearHelmet('heaume-ferme');
 for(let combo=0;combo<4;combo++)for(const f of [1,2,3,4])assert.equal(count(Art.nativeFrame(2,'attack',f,combo,swordPose),HAIR,24,35),0,'attack '+combo+':'+f);
 Art.wearHelmet(null);Art.wear('pagne-noue');
});

test('the Tenue screen lists what Kaldor owns, the pieces left to find, and switches outfit and helmet',async()=>{
 const {Game,KaldorWardrobe}=await loadWardrobe();const g=new Game();
 g.wardrobe.owned.push('corsaire');g.wardrobe.helmets.push('casque-cornes');
 const row=KaldorWardrobe.inventoryHTML(g);
 assert.doesNotMatch(row,/data-ward-open/);assert.match(row,/Tenues 2\/11/);assert.match(row,/Casques 1\/5/);assert.match(row,/data-wear="corsaire"/);
 assert.equal(KaldorWardrobe.leave(),false,'not open');
 assert.equal(g.wearHelmet('casque-cornes'),true);assert.equal(g.wearOutfit('corsaire'),true);
 assert.match(KaldorWardrobe.inventoryHTML(g),/data-wear="corsaire" aria-pressed="true"/);assert.match(KaldorWardrobe.inventoryHTML(g),/data-helm="casque-cornes" aria-pressed="true"/);
});
test('outfit tiles show Kaldor bareheaded in each outfit, within the 24px icon',async()=>{
 const {Art}=await loadWardrobe();const looks=new Set(),worn=Art.outfit();
 for(const o of Object.values(ATLAS.outfits)){
  const im=Art.figure(o.id),d=im.getContext('2d').getImageData(0,0,80,80).data;let x0=80,x1=-1,y0=80,y1=-1;
  for(let i=0;i<d.length;i+=4)if(d[i+3]){const x=(i>>2)%80,y=(i>>2)/80|0;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  assert.ok(x1-x0<24&&y1-y0<24,o.id+' fits');assert.ok(count(im,HAIR,0,79)>20,o.id+' mane');
  assert.ok(colours(im).has(o.cloth[0])||colours(im).has(o.arms.sleeve[0]),o.id+' its cloth');
  looks.add(Buffer.from(d).toString('base64'));
 }
 assert.equal(looks.size,Object.keys(ATLAS.outfits).length);assert.equal(Art.outfit(),worn,'the worn outfit is untouched');
});
