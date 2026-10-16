const {test,before}=require('node:test'),assert=require('node:assert/strict'),{loadGame,canvas}=require('./game-harness.cjs');let a;before(async()=>a=await loadGame());
test('arrival and teleports snap camera before terrain collection, then track without easing',()=>{
 const g=new a.Game(),cv=canvas.createCanvas(640,400),r=new a.Renderer(cv,canvas.createCanvas(1,1),g);r.resize(320,200,{t:0,b:0,l:0,r:0},2);g.dialogue=null;
 r.focus={x:100,y:100};r.easeT=.45;g.journey={};r.frame();g.journey=null;Object.assign(g.player,a.Atlas.toGame(a.Atlas.byId['town-69'].x,a.Atlas.byId['town-69'].y));r.frame();assert.equal(r.focus.x,g.player.x);assert.equal(r.easeT,0);assert.ok(Math.abs(r.cam.x-(g.player.x-160))<=.25);
 for(let i=0;i<5;i++){g.time+=.016;g.player.x+=1.07;r.frame();assert.ok(Math.abs(r.cam.x-(g.player.x-160))<=.25);}
 assert.ok(r.atlasVisible.length<12);
});
test('large coordinate rasterization matches local sprite and tile pixels',()=>{
 const sprite=canvas.createCanvas(8,8),s=sprite.getContext('2d');s.fillStyle='#ad8743';s.fillRect(0,0,8,8);
 const render=offset=>{const cv=canvas.createCanvas(80,80),c=cv.getContext('2d');a.installLocalRaster(c);c.imageSmoothingEnabled=false;c.setTransform(2,0,0,2,-offset*2,-offset*2);c.drawImage(sprite,offset+9.25,offset+12.5);c.fillStyle='#416485';c.fillRect(offset+18.5,offset+19.25,7,4);return Buffer.from(c.getImageData(0,0,80,80).data);};assert.deepEqual(render(12000000),render(0));assert.deepEqual(render(-12000000),render(0));
});
test('biome filters are subtle, blended, and temperate stays neutral',()=>{
 assert.equal(a.biomeAtmosphere([{biome:6,weight:1}]),null);for(let b=0;b<13;b++){const color=a.biomeAtmosphere([{biome:b,weight:1}]);if(color)assert.ok(Number(color.split(',').at(-1).slice(0,-1))<=.065);}
 assert.equal(a.biomeAtmosphere([{biome:11,weight:.5},{biome:6,weight:.5}]),'rgba(84,137,202,0.0325)');
});
