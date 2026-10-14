const {test,before}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {loadGame,canvas,root,html}=require('./game-harness.cjs');
let api;before(async()=>{api=await loadGame();});
const pixels=c=>Buffer.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data);
test('title panorama scrolls, wraps without gaps and freezes with reduced motion',async()=>{
 const c=canvas.createCanvas(640,360),scene=new api.TitleScene(c);await scene.promise;assert.equal(scene.ready,true);
 scene.draw(0);const first=pixels(c);scene.draw(17);assert.notDeepEqual(pixels(c),first);
 scene.draw(20,true);const still=pixels(c);scene.draw(999,true);assert.deepEqual(pixels(c),still);
 for(const time of [0,191.99,192,319.99,320,1599.99,1600]){scene.draw(time);const p=pixels(c);for(let i=3;i<p.length;i+=4)assert.equal(p[i],255);}
 assert.deepEqual(Array.from(api.TITLE_ART.logo),[490,146]);assert.equal(api.TITLE_ART.lettering,'HearthreaveR');
});
test('the twelve editable Aseprite flame cels exactly match the animated title atlas',async()=>{
 const dir=path.join(root,'art/title'),b=fs.readFileSync(path.join(dir,'hearthreaver-logo.aseprite'));
 assert.equal(b.readUInt16LE(4),0xa5e0);assert.equal(b.readUInt16LE(6),12);
 const atlas=await canvas.loadImage(path.join(dir,'title-flame.png')),logo=await canvas.loadImage(path.join(dir,'hearthreaver-logo.png'));
 const expected=canvas.createCanvas(490,146),source=canvas.createCanvas(490,146),base=canvas.createCanvas(490,146),paint=canvas.createCanvas(490,146),frames=[];
 let pos=128;const hashes=new Set();
 for(let f=0;f<12;f++){
  const size=b.readUInt32LE(pos),count=b.readUInt16LE(pos+6);assert.equal(b.readUInt16LE(pos+8),120);let p=pos+16,cels=new Map();
  for(let k=0;k<count;k++){
   const len=b.readUInt32LE(p),type=b.readUInt16LE(p+4),o=p+6;
   if(type===0x2005){const layer=b.readUInt16LE(o),x=b.readInt16LE(o+2),y=b.readInt16LE(o+4),kind=b.readUInt16LE(o+7);
    if(kind===1)cels.set(layer,{...frames[b.readUInt16LE(o+16)].get(layer),x,y});
    else {const w=b.readUInt16LE(o+16),h=b.readUInt16LE(o+18),raw=b.subarray(o+20,p+len);cels.set(layer,{x,y,w,h,data:kind===2?zlib.inflateSync(raw):raw});}
   }p+=len;
  }
  frames.push(cels);base.getContext('2d').clearRect(0,0,490,146);source.getContext('2d').clearRect(0,0,490,146);
  for(const [layer,cel]of [...cels].sort((a,b)=>a[0]-b[0])){const pc=paint.getContext('2d');pc.clearRect(0,0,490,146);const im=pc.createImageData(cel.w,cel.h);im.data.set(cel.data);pc.putImageData(im,cel.x,cel.y);(layer===3?source:base).getContext('2d').drawImage(paint,0,0);}
  const ec=expected.getContext('2d');ec.clearRect(0,0,490,146);ec.drawImage(atlas,f*490,0,490,146,0,0,490,146);assert.deepEqual(pixels(source),pixels(expected));
  ec.clearRect(0,0,490,146);ec.drawImage(logo,0,0);assert.deepEqual(pixels(base),pixels(expected));
  hashes.add(require('node:crypto').createHash('sha256').update(pixels(source)).digest('hex'));pos+=size;
 }
 assert.equal(hashes.size,12);assert.equal(pos,b.length);
});
test('title type-1 MIDI contains twelve independent tracks identical to the in-game loop, without stuck notes',()=>{
 const b=fs.readFileSync(path.join(root,'audio/hearthreaver-theme.mid')),score=api.MUSIC_DATA.title;
 assert.equal(b.readUInt16BE(8),1);assert.equal(b.readUInt16BE(10),13);assert.equal(b.readUInt16BE(12),480);
 let offset=14,markers=0;const names=[];
 for(let tr=0;tr<13;tr++){
  const end=offset+8+b.readUInt32BE(offset+4);let p=offset+8,tick=0,name='',notes=[],active=new Map();
  const vlq=()=>{let n=0,c;do{c=b[p++];n=(n<<7)|(c&127);}while(c&128);return n;};
  while(p<end){tick+=vlq();const status=b[p++];if(status===255){const type=b[p++],len=vlq();if(type===3)name=b.toString('utf8',p,p+len);if(type===6)markers++;p+=len;continue;}
   if((status&240)===192){p++;continue;}const n=b[p++],v=b[p++];if((status&240)===176)continue;
   if((status&240)===144&&v){assert.ok(!active.has(n),'overlapping key '+name+':'+n);active.set(n,[tick,n,v]);}
   else {const on=active.get(n);assert.ok(on);notes.push([on[0],tick-on[0],n,on[2]]);active.delete(n);}
  }
  assert.equal(tick,48*4*480);assert.equal(active.size,0);
  if(tr){names.push(name);notes.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);assert.deepEqual(notes.flat(),Array.from(score.tracks[name]));}offset=end;
 }
 assert.equal(markers,7);assert.equal(names.length,12);assert.equal(offset,b.length);
});
test('brand and hero are updated while legacy storage and iOS updater identifiers stay compatible',()=>{
 const code=html.replace(/data:[^"'\s]+/g,'').replace(/conan-(serpent-v1|sound|music|sfx|trk)/g,'legacy');
 assert.ok(!/\bconan\b|cimm[eé]ri|stygie|\bcrom\b/i.test(code));assert.ok(code.includes('Kaldor « the Flamebearer »'));
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'))).short_name,'Hearthreaver');
 const ios=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8');assert.equal(ios.slice(ios.indexOf('<script>')),html.slice(html.indexOf('<script>')));
 assert.ok(ios.includes('conan-serpent-v1'));assert.ok(fs.readFileSync(path.join(root,'ios/Hearthreaver/Info.plist'),'utf8').includes('<string>Hearthreaver</string>'));
});
