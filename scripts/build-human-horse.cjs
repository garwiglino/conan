/* Faithful pixel-grid transcription of the approved horse concept. The
 * reference is sampled cell by cell and reduced to a fixed material palette;
 * the shipped sprite is a synchronous JavaScript grid, never a scaled PNG. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const palette={O:'100c14',D:'30252b',d:'503a3b',m:'72504b',s:'6b3929',b:'95502d',B:'b96937',L:'d68c4c',l:'e6ab65',t:'795735',T:'aa814b',h:'d5b276'};
const specs={face:[59,56,150,201,24,32],droite:[292,51,258,205,40,32],dos:[644,56,149,201,24,32],gauche:[899,51,253,205,40,32]};
const rgb=h=>[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
const colors=Object.entries(palette).map(([k,h])=>[k,rgb(h)]);
(async()=>{
 const image=await loadImage(path.join(root,'art/humains/activites/concepts/cheval-chibi.png')),cv=createCanvas(image.width,image.height),ctx=cv.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,image.width,image.height).data,views={};
 for(const [dir,[x,y,w,h,W,H]]of Object.entries(specs)){
  const rows=[];
  for(let j=0;j<H;j++){let row='';for(let i=0;i<W;i++){
   const votes={},samples=[];let count=0,total=0;
   for(let yy=Math.floor(y+j*h/H);yy<y+(j+1)*h/H;yy++)for(let xx=Math.floor(x+i*w/W);xx<x+(i+1)*w/W;xx++){
    const p=(yy*image.width+xx)*4,r=data[p],g=data[p+1],b=data[p+2];total++;
    if(!(r>g+3||Math.max(r,g,b)<30))continue;count++;
    let key=null,dist=Infinity;for(const [k,c]of colors){const d=(r-c[0])**2+(g-c[1])**2+(b-c[2])**2;if(d<dist){dist=d;key=k;}}
    votes[key]=(votes[key]||0)+1;samples.push([r,g,b]);
   }
   row+=count/total<.37?'.':Object.keys(votes).sort((a,b)=>votes[b]-votes[a])[0];
  }rows.push(row);}
  // Keep the actual horse; the reference also has a tiny size inset nearby.
  const cells=rows.map(r=>[...r]),seen=new Set(),components=[];
  if(W>25)for(let j=Math.floor(H*.88);j<H;j++)for(let i=Math.floor(W*.85);i<W;i++)cells[j][i]='.';
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const id=j*W+i;if(cells[j][i]==='.'||seen.has(id))continue;const queue=[[i,j]],part=[];seen.add(id);while(queue.length){const [a,b]=queue.pop();part.push([a,b]);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=a+dx,Y=b+dy,key=Y*W+X;if(X<0||Y<0||X>=W||Y>=H||seen.has(key)||cells[Y][X]==='.')continue;seen.add(key);queue.push([X,Y]);}}components.push(part);}
  components.sort((a,b)=>b.length-a.length);for(const part of components.slice(1))for(const [x,y]of part)cells[y][x]='.';
  views[dir]=cells.map(r=>r.join(''));
 }
 const output={palette,views,source:'art/humains/activites/concepts/cheval-chibi.png',nativeFoot:[40,74],note:'Approved concept, fixed-palette integer grid; 40x32 profile, 24x32 front/back; views independently sampled.'};
 fs.writeFileSync(path.join(root,'sprites/humains/cheval.js'),'/* Rebuild with node scripts/build-human-horse.cjs. */\n(function(r,d){if(typeof module===\'object\'&&module.exports)module.exports=d;else r.HearthreaverHumanHorse=d;})(globalThis,'+JSON.stringify(output)+');\n');
 const sheet=createCanvas(960,300),c=sheet.getContext('2d');c.fillStyle='#252a28';c.fillRect(0,0,960,300);c.imageSmoothingEnabled=false;
 Object.entries(views).forEach(([dir,rows],i)=>{const scale=7,x=Math.round(i*240+(240-rows[0].length*scale)/2),y=40;rows.forEach((row,j)=>[...row].forEach((ch,k)=>{if(ch!=='.'){c.fillStyle='#'+palette[ch];c.fillRect(x+k*scale,y+j*scale,scale,scale);}}));c.fillStyle='#e8d6ac';c.font='18px monospace';c.fillText(dir,i*240+80,268);});
 const preview=path.join(root,'test-output/humains/horse-transcription.png');fs.mkdirSync(path.dirname(preview),{recursive:true});fs.writeFileSync(preview,sheet.toBuffer('image/png'));console.log('Horse reference transcribed:',Object.keys(views).join(', '));
})();
