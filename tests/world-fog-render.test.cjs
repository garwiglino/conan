const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');

test('unexplored terrain stays readable gray while walked terrain retains exact colors at both pixel densities',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../scripts/world-ui.js'),'utf8');
 for(const dpr of [1,2]){
  const game={explorationRows:new Map([[0,[[0,0]]]])};
  const context=vm.createContext({game,FOG_METRES:256,document:{createElement:()=>createCanvas(1,1)}});
  vm.runInContext(source,context);
  const canvas=createCanvas(512*dpr,256*dpr),c=canvas.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#a8b9b5';c.fillRect(0,0,512,256);
  c.fillStyle='#203940';c.fillRect(0,128,512,128);
  context.worldShadeUnexplored(c,canvas,{w:512,h:256,scale:1,ox:0,oy:0});
  const pixel=(x,y)=>[...c.getImageData(x*dpr,y*dpr,1,1).data];
  assert.deepEqual(pixel(50,50),[168,185,181,255]);
  assert.deepEqual(pixel(50,200),[32,57,64,255]);
  const land=pixel(400,50),sea=pixel(400,200);
  for(const p of [land,sea]){assert.ok(Math.max(...p.slice(0,3))-Math.min(...p.slice(0,3))<=1);assert.equal(p[3],255);}
  assert.ok(land[0]-sea[0]>60,'coastline must remain distinguishable under fog');
  // Restoring the explored colors must not leave a clip on later map markers.
  c.fillStyle='#ff0000';c.fillRect(400,50,1,1);assert.deepEqual(pixel(400,50),[255,0,0,255]);
 }
});
