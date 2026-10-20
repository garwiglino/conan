'use strict';
/* Désert de Sarak : vignette d'essai (dunes, piste, oasis, mesa en strates,
 * bourg aux places carrelées) avec les vrais bâtiments en pisé et Kaldor à
 * l'échelle, plus la planche des pavages du désert.
 *   node scripts/environment/preview-sarak.cjs [dossier] */
const {createCanvas,loadImage}=require('@napi-rs/canvas'),fs=require('node:fs'),path=require('node:path');
const {compose,hash}=require('./preview-scene.cjs'),A=require('../../sprites/architecture/architecture-isometric.js');
const DATA=require('../../sprites/environnement/sarak-data.js');
const row=(cj,a,b)=>Array.from({length:b-a+1},(_,k)=>[a+k,cj]),col=(ci,a,b)=>Array.from({length:b-a+1},(_,k)=>[ci,a+k]);
function pieces(N,streets){const owner=new Map();for(const [set,cells]of streets)for(const c of cells)owner.set(c.join(','),set);
 return (ci,cj)=>{const set=owner.get(ci+','+cj);if(!set)return [];let mask=0;for(const [bit,di,dj]of [[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]]){const ni=ci+di,nj=cj+dj;if(ni<0||nj<0||ni>=N/2||nj>=N/2||owner.has(ni+','+nj))mask|=bit;}return [{set,mask}];};}
function desert(){
 const N=40,code=new Uint8Array(N*N),plaza=new Map(),set=(i,j,c)=>{if(i>=0&&j>=0&&i<N&&j<N)code[j*N+i]=c;};
 // Mesa au nord-est, bord ondulé ; butte et rochers isolés au sud-ouest.
 for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(i>=27&&j<=8+Math.round(1.8*Math.sin(i/1.9)+Math.cos(i/1.2)))set(i,j,8);
  if(((i-5.5)/2.6)**2+((j-33)/2)**2<1+(hash(i,j,3)-.5)*.3)set(i,j,8);}
 // Oasis : lac turquoise.
 for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(((i+.5-12)/4.6)**2+((j+.5-9)/3.4)**2<1+(hash(i,j,7)-.5)*.25)set(i,j,3);
 const streets=[['chemin',[...row(11,0,8),...col(8,6,10),...row(6,9,10)]],['rangs',row(11,9,19)],['chemin',col(15,12,19)]];
 for(const [,cells]of streets)for(const [ci,cj]of cells)for(const [di,dj]of [[0,0],[1,0],[0,1],[1,1]])set(ci*2+di,cj*2+dj,9);
 const square=(i0,j0,i1,j1,mat)=>{for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){set(i,j,2);plaza.set(i+','+j,mat);}};
 square(22,24,30,31,'cabochon');square(13,27,18,32,'hex');square(31,16,37,21,'flags');
 const houses=[['T13',22,15,'face'],['T16',33,24,'face'],['T15',4,15,'face'],['T14',20,34,'face']];
 for(const [id,hi,hj]of houses){const e=A.entry(id);for(let j=hj-1;j<=hj+e.depth/16;j++)for(let i=hi-1;i<=hi+e.width/16;i++)if(i>=0&&j>=0&&i<N&&j<N&&!code[j*N+i])code[j*N+i]=9;}
 // Palmiers autour de l'oasis, rochers et arbres morts épars ailleurs.
 const nearWater=(i,j)=>{for(let b=-2;b<=2;b++)for(let a=-2;a<=2;a++)if(code[(j+b)*N+i+a]===3)return true;return false;};
 for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++){if(code[j*N+i])continue;const free=[[-1,0],[1,0],[0,-1],[0,1]].every(([a,b])=>!code[(j+b)*N+i+a]||code[(j+b)*N+i+a]===3||code[(j+b)*N+i+a]===4);if(!free)continue;
  if(nearWater(i,j)?hash(i,j,4)<.45:hash(i,j,4)<.035)code[j*N+i]=4;}
 return {N,code,piece:pieces(N,streets),houses,paving:(i,j)=>plaza.get(i+','+j),nearWater};
}
function render(dir){
 const M=desert(),N=M.N,big=(i,j)=>M.nearWater(i,j)?['palmier_a','palmier_b','palmier_a','buisson_a']:['rocher_a','rocher_b','rocher_rond','cheminee','eboulis','arbre_mort_a','arbre_mort_b','buisson_a','buisson_b'];
 return compose(M,path.join(dir,'desert.png'),{data:DATA,big,small:['touffe_a','touffe_b','touffe_a','cailloux','buisson_b'],
  heroes:[[10*16,23*16],[26*16,27.5*16],[17*16,14*16],[34*16,18.5*16]],crops:[['oasis',13*16,13*16],['bourg',25*16,25*16],['mesa',30*16,12*16],['piste',8*16,22*16]]});
}
// Planche des pavages : chaque matière sur une place et une rue, au milieu du sable.
async function sheet(dir){
 const LIST=[['pave','cobble','Pavés de grès'],['rangs','setts','Pavés en rangs'],['dalles','flags','Dalles de pisé'],['tomettes','hex','Tomettes'],['cabochons','cabochon','Carreaux à cabochons']],tiles=[];
 for(const [set,mat,label]of LIST){const n=12,code=new Uint8Array(n*n),cells=row(4,0,5);for(let j=1;j<=6;j++)for(let i=2;i<=9;i++)code[j*n+i]=2;for(const [ci,cj]of cells)for(const [di,dj]of [[0,0],[1,0],[0,1],[1,1]])code[(cj*2+dj)*n+ci*2+di]=9;
  const f=path.join(dir,'.sw-'+set+'.png');compose({N:n,code,piece:pieces(n,[[set,cells]]),houses:[],paving:(i,j)=>code[j*n+i]===2?mat:undefined},f,{data:DATA,big:['rocher_a'],small:['touffe_a','cailloux']});tiles.push([await loadImage(f),label]);fs.unlinkSync(f);}
 const s=2,w=tiles[0][0].width,h=tiles[0][0].height,crop=[w*.12,h*.08,w*.76,h*.84],W=Math.round(crop[2]*s),H=Math.round(crop[3]*s),pad=16,cv=createCanvas(pad+tiles.length*(W+pad),H+pad*2+30),c=cv.getContext('2d');
 c.fillStyle='#1c1416';c.fillRect(0,0,cv.width,cv.height);c.imageSmoothingEnabled=false;
 tiles.forEach(([im,label],k)=>{const x=pad+k*(W+pad);c.drawImage(im,crop[0],crop[1],crop[2],crop[3],x,pad,W,H);c.fillStyle='#f0dcb4';c.font='bold 22px sans-serif';c.fillText(label,x+8,pad+H+24);});
 const out=path.join(dir,'pavages-sarak.png');fs.writeFileSync(out,cv.toBuffer('image/png'));return out;
}
module.exports={desert,render,sheet};
if(require.main===module)(async()=>{const dir=process.argv[2]||'.';console.log(render(dir));console.log(await sheet(dir));})();
