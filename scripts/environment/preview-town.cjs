'use strict';
/* Pavages de ville de Teremor : planche des cinq pavages et quartier d'essai
 * (rues en rangs, ruelle en briques, place dallée, placette en éventail),
 * avec les vrais bâtiments et Kaldor à l'échelle.
 *   node scripts/environment/preview-town.cjs [dossier] */
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs'),path=require('node:path');
const {compose,hash}=require('./preview-scene.cjs');
const A=require('../../sprites/architecture/architecture-isometric.js');
const PAVINGS=[['pave','cobble','Pavés irréguliers'],['rangs','setts','Pavés en rangs'],['dalles','flags','Dallage de grès'],['briques','bricks','Briques en chevrons'],['eventail','fan','Pavés en éventail']];
// Pièces : chaque case de 2 m prend la forme désignée par ses voisines occupées.
function pieces(N,streets){const owner=new Map();for(const [set,cells]of streets)for(const c of cells)owner.set(c.join(','),set);
 return (ci,cj)=>{const set=owner.get(ci+','+cj);if(!set)return [];let mask=0;for(const [bit,di,dj]of [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]]){const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N/2||nj>=N/2||owner.has(ni+','+nj))mask|=bit;}return [{set,mask}];};}
const row=(cj,a,b)=>Array.from({length:b-a+1},(_,k)=>[a+k,cj]),col=(ci,a,b)=>Array.from({length:b-a+1},(_,k)=>[ci,a+k]);
function town(){
 const N=36,code=new Uint8Array(N*N),plaza=new Map();
 const streets=[['rangs',[...row(9,0,17),...col(6,0,8),...col(6,10,17)]],['briques',col(13,10,17)],['pave',row(14,0,5)],['chemin',row(3,7,17)]];
 for(const [,cells]of streets)for(const [ci,cj]of cells)for(const [di,dj]of [[0,0],[1,0],[0,1],[1,1]])code[(cj*2+dj)*N+ci*2+di]=9;
 const square=(i0,j0,i1,j1,mat)=>{for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){code[j*N+i]=2;plaza.set(i+','+j,mat);}};
 square(16,9,25,17,'flags');square(2,20,11,27,'fan');
 const houses=[['T05',2,8,'face'],['T03',6,10,'face'],['B07',28,10,'face'],['T01',16,22,'face'],['T09',29,22,'face'],['T11',16,28,'face'],['T07',2,30,'face']];
 for(const [id,hi,hj]of houses){const e=A.entry(id);for(let j=hj-1;j<=hj+e.depth/16;j++)for(let i=hi-1;i<=hi+e.width/16;i++)if(i>=0&&j>=0&&i<N&&j<N&&!code[j*N+i])code[j*N+i]=9;}
 // Quelques arbres en lisière, loin des rues et des maisons.
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(code[j*N+i])continue;const free=[[-1,0],[1,0],[0,-1],[0,1]].every(([a,b])=>!code[(j+b)*N+i+a]||code[(j+b)*N+i+a]===4);if(free&&(i>30&&j<8||i<4&&j<5||j>32&&i>20)&&hash(i,j,4)<.3)code[j*N+i]=4;}
 return {N,code,piece:pieces(N,streets),houses,paving:(i,j)=>plaza.get(i+','+j)};
}
function swatch(set,mat){const N=12,code=new Uint8Array(N*N),cells=row(4,0,5);for(let j=1;j<=6;j++)for(let i=2;i<=9;i++)code[j*N+i]=2;for(const [ci,cj]of cells)for(const [di,dj]of [[0,0],[1,0],[0,1],[1,1]])code[(cj*2+dj)*N+ci*2+di]=9;
 return {N,code,piece:pieces(N,[[set,cells]]),houses:[],paving:(i,j)=>code[j*N+i]===2?mat:undefined};}
async function sheet(dir){
 const {loadImage}=require('@napi-rs/canvas'),tiles=[];
 for(const [set,mat,label]of PAVINGS){const f=path.join(dir,'.swatch-'+set+'.png');compose(swatch(set,mat),f);tiles.push([await loadImage(f),label]);fs.unlinkSync(f);}
 const s=2,w=tiles[0][0].width,h=tiles[0][0].height,crop=[w*.12,h*.08,w*.76,h*.84],W=Math.round(crop[2]*s),H=Math.round(crop[3]*s),pad=16,cv=createCanvas(pad+tiles.length*(W+pad),H+pad*2+30),c=cv.getContext('2d');
 c.fillStyle='#141b1c';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
 tiles.forEach(([im,label],k)=>{const x=pad+k*(W+pad);c.drawImage(im,crop[0],crop[1],crop[2],crop[3],x,pad,W,H);c.fillStyle='#e8dcb8';c.font='bold 22px sans-serif';c.fillText(label,x+8,pad+H+24);});
 const out=path.join(dir,'pavages.png');fs.writeFileSync(out,cv.toBuffer('image/png'));return out;
}
if(require.main===module)(async()=>{const dir=process.argv[2]||'.';
 console.log(compose(town(),path.join(dir,'ville-pavee.png'),{heroes:[[20*16,18.8*16],[20*16,13*16],[7*16,24*16],[26.8*16,30*16]],crops:[['place',20*16,15*16],['eventail',8*16,23*16],['ruelle',25*16,25*16]]}));
 console.log(await sheet(dir));})();
module.exports={town,swatch,sheet,PAVINGS};
