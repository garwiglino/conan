'use strict';
/* Varan, marais : pavages des villages posés dans l'axe des rues (voir
 * matiere.cjs, pave). Caillebotis de planches sur la vase, chemins de
 * rondins, dalles moussues. Cadre « _v » : le même motif pour les rues
 * nord-sud. Planches et rondins sont posés en travers de la rue. */
const M=require('./matiere.cjs'),{PATTERNS}=require('./teremor-pavings.cjs'),{tone,dtone,hash,mod,clamp}=M;
const SIZE={boards:[192,96],logs:[192,96],flags:[128,64]};
// Caillebotis : planches de 6 unités en travers, aboutées tous les 48, fentes noires sur la vase.
function boards(u,v){const b=Math.floor(u/6),off=hash(mod(b,16),5)*48,seg=Math.floor((v+off)/48);return {key:'b'+mod(b,16)+':'+mod(seg,2),along:v+off-seg*48,across:u-b*6,size:[48,6]};}
// Rondins : troncs de 12 unités côte à côte, un bout tous les 96, écorce et nœuds.
function logs(u,v){const b=Math.floor(u/12),off=hash(mod(b,8),9)*96,seg=Math.floor((v+off)/96);return {key:'l'+mod(b,8)+':'+mod(seg,1),along:v+off-seg*96,across:u-b*12,size:[96,12]};}
const PATTERN={boards,logs,flags:PATTERNS.flags};
const SHADERS={
 boards:{joint:(x,y,c)=>c||hash(x,y,3)<.3?tone('marais',1):tone('vase',1),
  shader:({s,x,y,r,edge,deep})=>{const a=s.across,l=s.along;let t=(r<.3?3.2:r>.8?4.6:3.9)+(a<1?1.1:a>4.2?-1.1:0)+(M.snoise(x,y,2,Math.floor(r*99),192,96)-.5)*1.4;
   // Fil du bois en traits, clous aux deux bouts, mousse au bout des planches.
   if(hash(Math.floor(l/3),Math.floor(r*977),2)<.25&&Math.abs(a-2-r*2)<.6)t-=1;
   if((l>1.5&&l<2.6||l>44.5&&l<45.6)&&a>2&&a<3.2)return [tone('rouille',2),.75];
   if(l<3&&hash(x,y,9)<.3)return [tone('mousse',2),.72];
   return [dtone('planche',t,x,y),edge?.78:.72];}},
 logs:{joint:(x,y,c)=>c?tone('vase',0):tone('vase',hash(x,y,4)<.5?1:2),
  shader:({s,x,y,r,edge})=>{const a=s.across/12,l=s.along;
   // Bout du tronc : cernes clairs sur une rondelle.
   if(l<5){const d=Math.hypot(a-.5,(l-2.5)/5*1.2);return [tone('ecorcem',d<.18?7:d<.32?6:d<.42?7:5),.85];}
   const cyl=Math.cos((a-.32)*Math.PI*.95);let t=1.6+cyl*3.8+(M.snoise(x,y,1.5,Math.floor(r*99),192,96)-.5)*1.6;
   if(hash(Math.floor(l/2),Math.floor(r*97),5)<.12)t-=1.6;if(hash(Math.floor(l/9),Math.floor(r*91),6)<.06&&a>.3&&a<.7)return [tone('tourbe',2),.8];
   if(a<.3&&hash(Math.floor(l/5),Math.floor(r*93),7)<.18&&hash(x,y,7)<.6)return [tone('mousse',2+(cyl>.6?1:0)),.88];
   return [dtone('ecorcem',t,x,y),.8+cyl*.15];}},
 flags:{joint:(x,y,c)=>hash(x,y,8)<.55?tone('mousse',c?0:1):tone('vase',c?0:1),
  shader:({s,x,y,r,edge,deep})=>{let t=(r<.25?3.6:r>.85?5.8:4.7)+(edge?1.3:deep?-1.1:0)+(M.snoise(x,y,2,Math.floor(r*99),128,64)-.5)*1.6;
   if(hash(x,y,11)<.04)t-=1.5;
   // Mousse sur le haut des dalles, fêlure sur quelques-unes.
   if(edge&&r>.5&&hash(x,y,12)<.5)return [tone('mousse',3),.95];
   if(r<.2&&Math.abs(s.along-s.size[0]*.5+(s.across-s.size[1]*.5)*.9)<.5)return [tone('roc',2),.85];
   return [dtone('roc',t,x,y),edge?.95:.9];}}
};
const PAVINGS={boards:'caillebotis',logs:'rondins',flags:'dalles'};
function paving(kind,{axis='u'}={}){const [W,H]=SIZE[kind];return M.pave(W,H,PATTERN[kind],{axis,...SHADERS[kind]});}
module.exports={paving,PAVINGS,SIZE,PATTERN};
if(require.main===module){const {save}=require('./png.cjs');save((process.argv[2]||'.')+'/varan-pavages.png',Object.keys(PAVINGS).flatMap(k=>[paving(k),paving(k,{axis:'v'})]),{scale:2,cols:2,gap:4,bg:'#111',tile:[2,2]});console.log('ok');}
