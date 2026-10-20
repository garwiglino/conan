'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas}=require('@napi-rs/canvas'),A=require('../sprites/architecture/architecture-game'),Art=require('./architecture-render'),H=require('../sprites/architecture/human-reference');
Art.setCanvasFactory(createCanvas);
const id='T01',o={id,dir:'face',x:150,y:185,uid:'demo'},f=Art.frame(o),g=A.geometry(id,o),source=A.raster(id);let player,score=0;
for(let y=Math.floor(g.foot.y-38);y<g.foot.y+g.foot.h;y++)for(let x=Math.floor(g.foot.x);x<g.foot.x+g.foot.w;x++){
 if(A.collides([o],x,y,{radius:5}))continue;let count=0;
 for(let hy=0;hy<H.height;hy++)for(let hx=0;hx<H.width;hx++)if(H.pixels[hy*H.width+hx]){
  const px=Math.round(x-7+hx-o.x+f.anchor[0]),py=Math.round(y-H.height+hy-o.y+f.anchor[1]);if(px<0||py<0||px>=f.width||py>=f.height)continue;const i=py*f.width+px;if(f.upper[i]&&o.y+f.depths[i]>y)count++;
 }
 if(count>score){score=count;player={x,y,level:0};}
}
if(!player)throw Error('A walkable point behind the roof is required');
function drawHuman(c,p){for(let y=0;y<H.height;y++)for(let x=0;x<H.width;x++){const i=H.pixels[y*H.width+x];if(i){c.fillStyle=H.palette[i];c.fillRect(Math.round(p.x-7+x),Math.round(p.y-H.height+y),1,1);}}}
function scene(fade){const cv=createCanvas(310,225),c=cv.getContext('2d'),r={c,...(fade?{g:{player:{...player},time:0}}:{})};c.fillStyle='#172b23';c.fillRect(0,0,cv.width,cv.height);let objects=Art.objects(r,o);if(fade)for(let i=0;i<45;i++){r.g.time+=1/60;objects=Art.objects(r,o);}objects.push({y:player.y,fn:()=>drawHuman(c,player)});objects.sort((a,b)=>a.y-b.y).forEach(obj=>obj.fn());return cv;}
const out=createCanvas(1240,520),c=out.getContext('2d');c.fillStyle='#14241f';c.fillRect(0,0,out.width,out.height);c.fillStyle='#e4c99b';c.font='bold 24px sans-serif';c.fillText('HEARTHREAVER / PASSAGE DERRIÈRE LES BÂTIMENTS',24,34);c.font='16px sans-serif';c.fillStyle='#b4bda8';c.fillText('Même position libre au sol · collisions des fondations conservées · pixels natifs ×2',24,64);c.imageSmoothingEnabled=false;
for(let i=0;i<2;i++){c.fillStyle=i?'#e3bd80':'#a8b69b';c.font='bold 17px sans-serif';c.fillText(i?'APRÈS / maison entière à 32 %, comme la plateforme':'AVANT / joueur masqué',i*620+24,98);c.drawImage(scene(!!i),i*620,100,620,450);}
const dest=path.resolve(__dirname,'../art/architecture-isometric-js/passage-transparence.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest+'; '+score+' pixels du personnage protégés.');
