'use strict';
// Compile Claude's authored Piskel kit; no runtime network or Node dependency.
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas');
const I=require('./environment/interieurs.cjs'),S=require('./environment/interieur-scene.cjs'),DJ=require('./environment/donjon.cjs'),G=require('./gobelins/gobelins.cjs');
const root=path.resolve(__dirname,'..');
function png(w,h,data){const c=createCanvas(w,h),x=c.getContext('2d'),im=x.createImageData(w,h);im.data.set(data);x.putImageData(im,0,0);return 'data:image/png;base64,'+c.toBuffer('image/png').toString('base64');}
(async()=>{
 await require('./gobelins/compile-animation.cjs').build();
 const D=DJ.load('forteresse-grise-gueule'),kit=await I.read(D.kit),art={pieces:{},floors:{},goblins:{}};
 for(const [id,p]of kit.pieces)art.pieces[id]={w:p.w,h:p.h,anchor:p.ancre,fps:p.fps||1,frames:p.images.map(f=>png(p.w,p.h,f.couleur))};
 for(const e of D.etages){const scene=DJ.scene(D,e),L=S.layout(scene),w=32*(L.NI+L.NJ)+48,h=16*(L.NI+L.NJ)+104,ox=32*L.NJ+24,oy=80,s=S.surface(kit,w,h,ox,oy);s.paint(L.cell);
  for(const [n,u,v]of scene.decors)s.place('decor/'+n,[u,v]);
  for(const it of L.items){const p=kit.pieces.get(it.piece);for(const layer of ['ombre','lueur'])if(p.opacites[layer])s.blit(it.piece,it.ref,{layer,alpha:p.opacites[layer],onlyFloor:true});}
  art.floors[e.id]={w,h,origin:[ox,oy],ground:png(w,h,s.data),items:L.items};
 }
 const sources=await G.sources(),data=G.data();for(const id of ['guerrier-kesh','pillard']){const p=data.personnages.find(p=>p.id===id);art.goblins[id]=G.render(sources,p,data).views.map(f=>png(48,48,f));}
 // Legacy static previews remain available; the live chief uses the rigid native rig.
 art.goblins['grise-gueule']=G.render(sources,{corps:'masculin',tenue:'harnais',teinte:'cendre'},data).views.map(f=>png(48,48,f));
 fs.mkdirSync(path.join(root,'data/donjons/compiled'),{recursive:true});fs.writeFileSync(path.join(root,'data/donjons/compiled/forteresse-grise-gueule.json'),JSON.stringify({design:D,art})+'\n');
 console.log('Compiled four dungeon floors, original kit animations and goblin views.');
})().catch(e=>{console.error(e);process.exitCode=1;});
