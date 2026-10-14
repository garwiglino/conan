const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {loadGame,canvas,root}=require('./game-harness.cjs');
// Read cropped opaque cels, retaining small byte buffers for linked cels.
function verifySource(file,expected,width,height,check){
 const b=fs.readFileSync(file);assert.equal(b.readUInt16LE(4),0xa5e0);assert.equal(b.readUInt16LE(6),expected.length);assert.equal(b.readUInt16LE(12),32);
 let pos=128;const frames=[],tags=new Map(),paint=canvas.createCanvas(width,height),pc=paint.getContext('2d');
 for(let f=0;f<expected.length;f++){
  const size=b.readUInt32LE(pos),old=b.readUInt16LE(pos+6),chunks=old===65535?b.readUInt32LE(pos+12):old;
  assert.equal(b.readUInt16LE(pos+8),expected[f].ms);let p=pos+16;const cels=new Map();
  for(let k=0;k<chunks;k++){
   const len=b.readUInt32LE(p),type=b.readUInt16LE(p+4),o=p+6;
   if(type===0x2005){
    const layer=b.readUInt16LE(o),x=b.readInt16LE(o+2),y=b.readInt16LE(o+4),kind=b.readUInt16LE(o+7);assert.equal(b[o+6],255);
    if(kind===1)cels.set(layer,{...frames[b.readUInt16LE(o+16)].get(layer),x,y});
    else{assert.ok(kind===0||kind===2);const w=b.readUInt16LE(o+16),h=b.readUInt16LE(o+18),raw=b.subarray(o+20,p+len);cels.set(layer,{x,y,w,h,data:kind===2?zlib.inflateSync(raw):raw});}
   }
   if(type===0x2018){let q=o+10;for(let t=0;t<b.readUInt16LE(o);t++){const n=b.readUInt16LE(q+17);tags.set(b.toString('utf8',q+19,q+19+n),[b.readUInt16LE(q),b.readUInt16LE(q+2)]);q+=19+n;}}
   p+=len;
  }
  assert.equal(p,pos+size);frames.push(cels);
  const planes=[canvas.createCanvas(width,height),canvas.createCanvas(width,height)];
  for(const [layer,cel] of [...cels].sort((a,b)=>a[0]-b[0])){
   pc.clearRect(0,0,width,height);const im=pc.createImageData(cel.w,cel.h);im.data.set(cel.data);pc.putImageData(im,cel.x,cel.y);
   planes[width===160&&layer===2?1:0].getContext('2d').drawImage(paint,0,0);
  }
  check(expected[f],planes,f);pos+=size;
 }
 assert.equal(pos,b.length);return tags;
}
test('editable boss and spell sources reproduce every shipped layer, tag and duration',async()=>{
 const a=await loadGame(),dir=path.join(root,'sprites/personnages/pretre');
 for(const spell of [false,true]){
  const meta=JSON.parse(fs.readFileSync(path.join(dir,spell?'sortileges.json':'animations.json'))),size=spell?160:80;
  const expected=meta.clips.flatMap(c=>c.durationsMs.map((ms,i)=>({ms,c,i})));
  const crop=canvas.createCanvas(size,size),ctx=crop.getContext('2d');
  const tags=verifySource(path.join(dir,meta.source),expected,size,size,(e,planes,f)=>{
   for(let plane=0;plane<(spell?2:1);plane++){
    ctx.clearRect(0,0,size,size);
    const atlas=spell?(plane?a.BITMAPS.bossFront:a.BITMAPS.bossRear):a.BITMAPS['boss'+e.c.phase],row=spell?e.c.row:e.c.sheetRow;
    ctx.drawImage(atlas,e.i*size,row*size,size,size,0,0,size,size);
    assert.deepEqual(Buffer.from(ctx.getImageData(0,0,size,size).data),Buffer.from(planes[plane].getContext('2d').getImageData(0,0,size,size).data),(spell?'spell':'actor')+' source frame '+f+' plane '+plane);
   }
  });assert.equal(tags.size,meta.clips.length);for(const c of meta.clips)assert.deepEqual(tags.get(c.name),[c.from-1,c.to-1]);
 }
 const projectiles=Array.from({length:64},(_,i)=>({ms:80,i})),crop=canvas.createCanvas(32,32),ctx=crop.getContext('2d');
 const boltTags=verifySource(path.join(dir,'projectiles.aseprite'),projectiles,32,32,(e,planes)=>{
  ctx.clearRect(0,0,32,32);ctx.drawImage(a.BITMAPS.bossBolt,e.i%4*32,Math.floor(e.i/4)*32,32,32,0,0,32,32);
  assert.deepEqual(Buffer.from(ctx.getImageData(0,0,32,32).data),Buffer.from(planes[0].getContext('2d').getImageData(0,0,32,32).data));
 });
 assert.equal(boltTags.size,16);for(let phase=0;phase<2;phase++)for(let dir=0;dir<8;dir++){const i=(phase*8+dir)*4;assert.deepEqual(boltTags.get('jade_'+phase+'_'+dir),[i,i+3]);}
});
