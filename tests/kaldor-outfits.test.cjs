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

test('the outfit atlas is rebuilt from its sources and keeps the shipped clip timings',()=>{
 for(const id of rig.COMMON)assert.deepEqual(ATLAS.clips[id],CIV.clips[id]);
 assert.equal(ATLAS.clips.dress.loop,false);assert.equal(ATLAS.clips.dress.durations.length,8);
 for(const o of Object.values(ATLAS.outfits)){
  const def=require('../art/kaldor-tenues/'+o.id+'.cjs');assert.equal(o.label,def.label);assert.ok(Number.isInteger(o.warmth)&&o.warmth>=0&&o.warmth<=3);
  for(const clip of [...rig.COMMON,'dress']){assert.equal(o.frames[clip].length,4);
   for(const sheet of [o.asset,o.foreground,o.bare])assert.ok(o.frames[clip][3]+ATLAS.clips[clip].durations.length<=sheet.tiles.length);}
  for(const c of [...o.arms.sleeve,...o.arms.hand,...o.cloth])assert.match(c,/^[0-9a-f]{6}$/);
 }
 assert.ok(ATLAS.outfits['pagne-noue']);assert.equal(ATLAS.outfits['pagne-noue'].place,null);
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
const FOUND=Object.values(ATLAS.outfits).filter(o=>o.place);
const rgb=(d,i)=>(d[i]<<16|d[i+1]<<8|d[i+2]).toString(16).padStart(6,'0');
const colours=im=>{const d=im.getContext('2d').getImageData(0,0,80,80).data,s=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])s.add(rgb(d,i));return s;};

test('six unique outfits wait on mannequins, clear and walkable, each by its own locality',async()=>{
 const {Game,Atlas,KaldorWardrobe}=await loadWardrobe();const g=new Game();
 assert.equal(FOUND.length,6);assert.ok(FOUND.some(o=>o.warmth>=2)&&FOUND.some(o=>o.warmth===0));
 assert.deepEqual(plain(g.wardrobe),{owned:['pagne-noue'],worn:'pagne-noue'});
 const stands=g.atlasProps.filter(o=>o.kind==='kaldor_outfit');assert.ok(stands.every(o=>!o.taken));
 assert.deepEqual(plain(stands.map(o=>o.outfit).sort()),FOUND.map(o=>o.id).sort());
 assert.equal(new Set(FOUND.map(o=>o.place.site)).size,6,'one outfit per locality');
 for(const s of stands){
  const site=Atlas.byId[s.site],c=Atlas.toGame(site.x,site.y);
  assert.ok(Math.hypot(s.x-c.x,s.y-c.y)<70,s.outfit+' stands by '+site.name);
  assert.ok(!g.solid(s.x,s.y,8,0)&&!g.solid(s.x,s.y-10,6,0),s.outfit+' stands on open ground');
  for(const o of [...g.atlasProps,...g.world.props])if(o!==s)assert.ok(Math.hypot(o.x-s.x,o.y-s.y)>18,s.outfit+' clear of '+o.kind);
  // Walkable: the open ground around the stand reaches well beyond it.
  const seen=new Set(['0,0']),queue=[[0,0]];let far=0;
  while(queue.length&&far<120){const [x,y]=queue.shift();far=Math.max(far,Math.hypot(x,y));
   for(const [a,b] of [[6,0],[-6,0],[0,6],[0,-6]]){const k=(x+a)+','+(y+b);if(seen.has(k)||Math.hypot(x+a,y+b)>130)continue;seen.add(k);
    if(!g.solid(s.x+x+a,s.y+y+b,5,0))queue.push([x+a,y+b]);}}
  assert.ok(far>=120,s.outfit+' can be walked to ('+Math.round(far)+'px of open ground)');
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
 assert.equal(Art.outfit(),'pelisse-grand-froid');assert.equal(g.outfitWarmth(),3);assert.deepEqual(plain(g.player.dressing),{t0:g.time});
 const saved=JSON.parse(JSON.stringify(g.serialize()));
 assert.deepEqual(plain(saved.wardrobe),{owned:['pagne-noue','pelisse-grand-froid'],worn:'pelisse-grand-froid'});
 Art.wear('pagne-noue');
 const back=new Game(saved);
 assert.deepEqual(plain(back.wardrobe),saved.wardrobe);assert.equal(Art.outfit(),'pelisse-grand-froid');assert.equal(back.player.dressing,null);
 assert.deepEqual(plain(back.atlasProps.filter(o=>o.kind==='kaldor_outfit'&&o.taken).map(o=>o.outfit)),['pelisse-grand-froid']);
 assert.equal(back.atlasProps.filter(o=>o.kind==='kaldor_outfit').length,6);
 const old={...saved};delete old.wardrobe;
 assert.deepEqual(plain(new Game(old).wardrobe),{owned:['pagne-noue'],worn:'pagne-noue'});assert.equal(Art.outfit(),'pagne-noue');
 assert.deepEqual(plain(new Game({...saved,wardrobe:{owned:['manteau-inconnu','voiles-nomade'],worn:'manteau-inconnu'}}).wardrobe),
  {owned:['pagne-noue','voiles-nomade'],worn:'pagne-noue'},'unknown outfits are dropped');
});

test('putting an outfit on raises the arms, pulls the new garment over the head, then shows it',async()=>{
 const {Art}=await loadWardrobe();
 Art.wear('pagne-noue');Art.wear('cuir-traqueur');
 const total=Art.dressDuration();assert.equal(total,ATLAS.clips.dress.durations.reduce((a,b)=>a+b,0)/1000);
 const actor={dressing:{t0:10}};
 assert.deepEqual(plain(Art.dressLook(actor,10.05)),{state:'dress',frame:0});
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
