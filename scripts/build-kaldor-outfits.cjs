/* Kaldor's outfits and helmets: pixel-grid sources (art/kaldor-tenues,
 * art/kaldor-casques) animated by the human NPC rig and packed like the
 * civilian atlas (48px tiles, deduplicated, lossless PNG). Writes
 * data/kaldor-outfits/atlas.json and inspection sheets.
 * Outfits: body, foreground, bare (arms removed, for the sword-holding torso)
 * and mannequin. Helmets: the three planes of an NPC headgear module, nape
 * (behind the head), helmet (over the hair) and mask (erases the hair). */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createCanvas}=require('@napi-rs/canvas');
const rig=require('./kaldor-outfit-rig.cjs');
const root=path.resolve(__dirname,'..'),src=path.join(root,'art/kaldor-tenues'),helmSrc=path.join(root,'art/kaldor-casques');
const ORDER=['pagne-noue','brigandine-mercenaire','voiles-nomade','harnais-arene','pelisse-grand-froid','peau-ours','cuir-traqueur','cotte-mailles','robe-serpent','corsaire','kaftan-steppes'];
const HELMETS=['casque-nasal','casque-cornes','casque-fourre','casque-arene','heaume-ferme'];
const CLIPS=[...rig.COMMON,'dress','helm'];
const {CLOTH}=require(path.join(src,'habillage.cjs'));
// clip: helmets keep only what falls in the tile (the hair mask swept out of
// it by the death fall erases nothing there: the hair tiles are 48px too).
function pack(frames,{clip=false}={}){
 const seen=new Map(),unique=[],tiles=[];
 for(const im of frames){
  const tile=Buffer.alloc(48*48*4);
  for(let y=0;y<48;y++)im.copy(tile,y*48*4,((y+16)*80+16)*4,((y+16)*80+64)*4);
  if(!clip)for(let y=0;y<80;y++)for(let x=0;x<80;x++)if(im[(y*80+x)*4+3]&&(x<16||x>=64||y<16||y>=64))throw Error('pixel outside the 48px tile at '+x+','+y);
  const hash=crypto.createHash('sha256').update(tile).digest('hex');let id=seen.get(hash);
  if(id===undefined){id=unique.length;seen.set(hash,id);unique.push(tile);}tiles.push(id);
 }
 const cv=createCanvas(768,Math.max(1,Math.ceil(unique.length/16))*48),c=cv.getContext('2d');
 unique.forEach((t,i)=>{const im=c.createImageData(48,48);im.data.set(t);c.putImageData(im,i%16*48,Math.floor(i/16)*48);});
 return {tiles,unique:unique.length,png:cv.toBuffer('image/png').toString('base64')};
}
// Mannequin: the garment seen from the front without legs (shoulders on the
// crossbar, an ink line closing its hem) and the boots apart, set on the base.
function stand(layers){
 const top=rig.blank(),feet=rig.blank();
 for(const l of layers){const r=rig.role(l.name);if(r==='feet')rig.drawImage(feet,l.images[0]);else if(r!=='legs'&&r!=='head')rig.drawImage(top,l.images[0]);}
 const ink=rig.hex(rig.INK);
 for(let y=79;y>0;y--)for(let x=0;x<80;x++)if(!rig.get(top,x,y)[3]&&rig.get(top,x,y-1)[3]&&!rig.get(top,x,y-1).slice(0,3).every((v,i)=>v===ink[i]))rig.pixel(top,x,y,ink);
 return [top,feet];
}
const outfits={};
for(const id of ORDER){
 const file=path.join(src,id+'.cjs');if(!fs.existsSync(file))continue;
 const def=require(file);if(def.id!==id)throw Error('outfit id mismatch '+file);
 const r=rig.animate(rig.build(def),{clips:CLIPS,arms:def.arms});
 outfits[id]={id,label:def.label,warmth:def.warmth,description:def.description,place:def.place||null,
  arms:def.arms,cloth:def.cloth,torso:def.torso||'bare',headFirst:!!def.headFirst,frames:r.index,asset:pack(r.frames),foreground:pack(r.front),bare:pack(r.noArms),stand:pack(stand(rig.build(def)))};
}
// Helmet planes from the layer names, as in the NPC headgear modules.
const plane=name=>/^MASQUE/.test(name)?2:/COIFFE 20|Nuque/.test(name)?0:1;
const helmets={};
for(const id of HELMETS){
 const file=path.join(helmSrc,id+'.cjs');if(!fs.existsSync(file))continue;
 const def=require(file);if(def.id!==id)throw Error('helmet id mismatch '+file);
 const layers=rig.build(def);
 for(const l of layers)if(rig.role(l.name)!=='hat')throw Error(id+': helmet layer outside the hat role '+l.name);
 const planes=[0,1,2].map(p=>rig.animate(layers.filter(l=>plane(l.name)===p),{clips:CLIPS}));
 helmets[id]={id,label:def.label,warmth:def.warmth,closed:!!def.closed,description:def.description,place:def.place||null,
  frames:planes[0].index,count:planes[0].count,asset:pack(planes.flatMap(p=>p.frames),{clip:true})};
}
const clips={};for(const id of CLIPS){const c=rig.POSES.clips[id];clips[id]={durations:c.durations,loop:c.loop,...(c.stride?{stride:c.stride}:{})};}
const dress={swap:3,
 head:[1,2,3,4].map(d=>rig.POSES.clips.dress.poses.map(p=>rig.headOffset(p,d))),
 cloth:[1,2,3,4].map(d=>rig.POSES.clips.dress.poses.map((p,f)=>rig.clothPixels(CLOTH,d,f)))};
const helm={swap:1,head:[1,2,3,4].map(d=>rig.POSES.clips.helm.poses.map(p=>rig.headOffset(p,d)))};
const atlas={version:2,authoring:'Pixel grids + human NPC rig (node port)',frameSize:48,anchor:[24,36],directions:['face','droite','dos','gauche'],clips,dress,helm,outfits,helmets};
fs.mkdirSync(path.join(root,'data/kaldor-outfits'),{recursive:true});
fs.writeFileSync(path.join(root,'data/kaldor-outfits/atlas.json'),JSON.stringify(atlas));
const pngDir=path.join(root,'sprites/kaldor/tenues');fs.mkdirSync(pngDir,{recursive:true});
for(const o of Object.values(outfits)){for(const [k,sheet] of [['',o.asset],['-front',o.foreground],['-bare',o.bare],['-stand',o.stand]])fs.writeFileSync(path.join(pngDir,o.id+k+'.png'),Buffer.from(sheet.png,'base64'));}
const helmDir=path.join(root,'sprites/kaldor/casques');fs.mkdirSync(helmDir,{recursive:true});
for(const h of Object.values(helmets))fs.writeFileSync(path.join(helmDir,h.id+'.png'),Buffer.from(h.asset.png,'base64'));
console.log('Kaldor helmets:',Object.values(helmets).map(h=>h.id+' ('+h.asset.unique+' tiles'+(h.closed?', fermé':'')+')').join(', '));
console.log('Kaldor outfits:',Object.values(outfits).map(o=>o.id+' ('+o.asset.unique+' tiles, chaleur '+o.warmth+')').join(', '));
