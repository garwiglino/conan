'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'art/dungeon-scroll');fs.mkdirSync(out,{recursive:true});
 const source=fs.readFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),'utf8'),html=source.replace(/\}\)\(\);\s*<\/script>/,'globalThis.scrollCheck={renderer,P:WorldProjection,begin,studioIntro,BITMAPS,F:FirstDungeon,fitScreen,game:()=>game};})();</script>');assert.notEqual(html,source);
 const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(html);}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 const dpr=Number(process.env.CHECK_DPR)||3;const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),results=[],errors=[];
 const pixels=async png=>{const im=await loadImage(png),cv=createCanvas(im.width,im.height),c=cv.getContext('2d');c.drawImage(im,0,0);return {w:im.width,h:im.height,data:c.getImageData(0,0,im.width,im.height).data};};
 function compare(a,b,dx,dy){let changed=0,count=0;const margin=30;
  for(let y=margin;y<a.h-margin;y++)for(let x=margin;x<a.w-margin;x++){const bx=x+dx,by=y+dy;if(bx<0||by<0||bx>=b.w||by>=b.h)continue;const i=(y*a.w+x)*4,j=(by*b.w+bx)*4;count++;if(a.data[i]!==b.data[j]||a.data[i+1]!==b.data[j+1]||a.data[i+2]!==b.data[j+2])changed++;}
  return changed/count;
 }
 try{
  const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:dpr,isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>scrollCheck?.BITMAPS.ready&&scrollCheck.F.art.ready,null,{timeout:120000});
  await page.evaluate(()=>{const t=scrollCheck;t.studioIntro.skip();t.studioIntro.update(2);t.begin();const g=t.game();g.enterDungeonFloor('grande-salle',{x:368,y:208});g.update=()=>{};g.time=20;g.player.spawnFX=0;g.enemies=[];t.liveFrame=t.renderer.frame.bind(t.renderer);t.liveFrame();t.renderer.frame=()=>{};for(const n of document.getElementById('screen').children)if(n.id!=='game')n.style.setProperty('display','none','important');});
  for(const [width,height]of [[844,390],[568,320]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>{scrollCheck.fitScreen();scrollCheck.liveFrame();});await page.locator('#game').screenshot({path:path.join(out,`scene-${width}-dpr${dpr}.png`)});
   const info=await page.evaluate(()=>{const r=scrollCheck.renderer,cv=document.getElementById('game'),b=cv.getBoundingClientRect();return {W:r.W,H:r.H,K:r.k,css:{x:b.x,y:b.y,w:b.width,h:b.height},backing:{w:cv.width,h:cv.height},dpr:devicePixelRatio};});
   assert.ok(Math.abs(info.css.w*info.dpr-info.backing.w)<.01&&Math.abs(info.css.h*info.dpr-info.backing.h)<.01,'The phone must not rescale the backing bitmap');
   const samples=[];let previous=null,lastCam=null,maxChanged=0;
   for(const [index,[x,y]]of [[0,[0,0]],[1,[1,0]],[2,[2,0]],[3,[3,0]],[4,[4,1]],[5,[5,2]],[6,[6,3]],[7,[5,4]],[8,[4,5]]]){
    const cam=await page.evaluate(({x,y})=>{const t=scrollCheck,r=t.renderer,c=r.c,k=r.k,a=t.F.art.floors['grande-salle'];
     const base=t.P.point(368,208);
     // Same terrain image, draw transform and camera quantization as the live renderer.
     const camera=t.P.camera?t.P.camera(base.x+x,base.y+y,r.W,r.H,r.top,10,k):{x:Math.round(base.x+x)-Math.floor(r.W/2),y:Math.round(base.y+y)-Math.floor((r.H-r.top)/2)-10};
     c.setTransform(k,0,0,k,0,0);c.imageSmoothingEnabled=false;c.fillStyle='#050408';c.fillRect(0,0,r.W,r.H);c.translate(-camera.x,r.top-camera.y);c.drawImage(a.ground,-a.origin[0],-a.origin[1]);return camera;
    },{x,y});
    const png=await page.locator('#game').screenshot({animations:'disabled'}),frame=await pixels(png);
    if(index===0){const colors=new Set();for(let i=0;i<frame.data.length;i+=4*97)colors.add((frame.data[i]<<16)|(frame.data[i+1]<<8)|frame.data[i+2]);assert.ok(colors.size>=20,'The real terrain must be visible, not a blank bitmap');}
    if(previous){const scale=info.css.w/info.W*info.dpr,expectedX=Math.round((lastCam.x-cam.x)*scale),expectedY=Math.round((lastCam.y-cam.y)*scale);let best=1,bestShift;
     for(let dy=expectedY-1;dy<=expectedY+1;dy++)for(let dx=expectedX-1;dx<=expectedX+1;dx++){const changed=compare(previous,frame,dx,dy);if(changed<best){best=changed;bestShift=[dx,dy];}}
     assert.deepEqual(bestShift,[expectedX,expectedY],'The displayed terrain must follow the intended camera translation');maxChanged=Math.max(maxChanged,best);samples.push({index,changed:best,shift:bestShift});
    }
    if(index===0||index===6)fs.writeFileSync(path.join(out,`scroll-${width}-dpr${dpr}-${index}.png`),png);previous=frame;lastCam=cam;
   }
   results.push({...info,width,height,maxChanged,samples});
  }
  fs.writeFileSync(path.join(out,`verification-dpr${dpr}.json`),JSON.stringify({results,errors},null,2)+'\n');
  assert.deepEqual(errors,[]);for(const row of results)assert.equal(row.maxChanged,0,'Displayed dungeon terrain must translate without changing any pixel: '+JSON.stringify(row));
  console.log('Displayed dungeon terrain keeps exactly the same pixels through horizontal and diagonal camera movement at phone DPR '+dpr+'.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
