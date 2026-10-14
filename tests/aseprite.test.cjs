const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {loadGame,canvas,root}=require('./game-harness.cjs');
test('the editable Aseprite source recomposes to all 216 shipped frames with exact tags and durations',async()=>{
 const api=await loadGame(),dir=path.join(root,'sprites/personnages');
 const meta=JSON.parse(fs.readFileSync(path.join(dir,'gardien-animations.json')));
 const b=fs.readFileSync(path.join(dir,'gardien.aseprite'));
 assert.equal(b.readUInt16LE(4),0xa5e0);assert.equal(b.readUInt16LE(6),216);assert.equal(b.readUInt16LE(12),32);
 const expected=meta.clips.flatMap(c=>c.durationsMs.map((ms,i)=>({ms,c,i}))),frames=[],tags=new Map();let pos=128;
 for(let f=0;f<216;f++){
  const size=b.readUInt32LE(pos),old=b.readUInt16LE(pos+6),chunks=old===65535?b.readUInt32LE(pos+12):old;
  assert.equal(b.readUInt16LE(pos+4),0xf1fa);assert.equal(b.readUInt16LE(pos+8),expected[f].ms);
  let p=pos+16;const cels=new Map();
  for(let k=0;k<chunks;k++){
   const len=b.readUInt32LE(p),type=b.readUInt16LE(p+4),o=p+6;
   if(type===0x2005){
    const layer=b.readUInt16LE(o),x=b.readInt16LE(o+2),y=b.readInt16LE(o+4),kind=b.readUInt16LE(o+7);
    const cel=canvas.createCanvas(80,80),c=cel.getContext('2d');
    if(kind===1)c.drawImage(frames[b.readUInt16LE(o+16)].get(layer),0,0);
    else{assert.ok(kind===0||kind===2);const w=b.readUInt16LE(o+16),h=b.readUInt16LE(o+18);
     const raw=b.subarray(o+20,p+len),data=kind===2?zlib.inflateSync(raw):raw,im=c.createImageData(w,h);im.data.set(data);c.putImageData(im,x,y);}
    cels.set(layer,cel);
   }
   if(type===0x2018){let q=o+10;for(let t=0;t<b.readUInt16LE(o);t++){
    const count=b.readUInt16LE(q+17),name=b.toString('utf8',q+19,q+19+count);tags.set(name,[b.readUInt16LE(q),b.readUInt16LE(q+2)]);q+=19+count;
   }}
   p+=len;
  }
  assert.equal(p,pos+size);frames.push(cels);
  const composite=canvas.createCanvas(80,80),c=composite.getContext('2d');
  for(const [,cel] of [...cels].sort((a,b)=>a[0]-b[0]))c.drawImage(cel,0,0);
  const e=expected[f],im=api.BITMAPS.get('guardian',e.c.direction,e.c.state,e.i);
  assert.deepEqual(Buffer.from(c.getImageData(0,0,80,80).data),Buffer.from(im.getContext('2d').getImageData(0,0,80,80).data),'frame '+f);
  pos+=size;
 }
 assert.equal(pos,b.length);assert.equal(tags.size,32);
 for(const c of meta.clips)assert.deepEqual(tags.get(c.name),[c.asepriteFrom-1,c.asepriteTo-1]);
});
