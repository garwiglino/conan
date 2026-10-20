'use strict';
// Reuse the shipped current Kaldor, never a dummy character in terrain previews.
(async()=>{
 const fs=require('node:fs'),path=require('node:path'),{loadGame,canvas}=require('../tests/game-harness.cjs'),api=await loadGame(),g=new api.Game(),cv=canvas.createCanvas(80,80),r=new api.Renderer(cv,canvas.createCanvas(1,1),g);
 Object.assign(g.player,{x:40,y:52,spawnFX:0,moving:false,dir:2});r.hero(g.player);
 const im=r.c.getImageData(0,0,80,80),pixels=[];
 for(let y=0;y<80;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;if(im.data[i+3])pixels.push([x,y,...im.data.slice(i,i+4)]);}
 const data={width:80,height:80,anchor:[40,52],source:'Renderer.hero / current Kaldor, normal outfit and equipped starting weapon',pixels};
 fs.writeFileSync(path.join(__dirname,'../sprites/terrain/player-reference.js'),"(function(r,d){if(typeof module==='object'&&module.exports)module.exports=d;else r.HearthreaverTerrainPlayer=d;})(globalThis,"+JSON.stringify(data)+');\n');
 console.log('Current Kaldor sprite captured for terrain previews: '+pixels.length+' native pixels.');
})().catch(e=>{console.error(e);process.exitCode=1;});
