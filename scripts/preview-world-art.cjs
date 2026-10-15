/* Reproducible, actual game renderings; no illustrative replacement artwork. */
const fs=require('node:fs'),path=require('node:path');
const {loadGame,canvas}=require('../tests/game-harness.cjs');
async function main(){
 const api=await loadGame(),{Game,Renderer,Atlas:A}=api,g=new Game(),cv=canvas.createCanvas(640,448),r=new Renderer(cv,canvas.createCanvas(1,1),g);
 r.resize(320,224,{l:0,r:0,t:0,b:0},2);g.clock=720;g.player.spawnFX=0;g.story.escaped=g.story.fairy=true;
 const dir=path.join(__dirname,'../test-output/world-art');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'original-desert-ground.png'),r.bg.toBuffer('image/png'));
 const roadSample=(biome,territory)=>{for(const road of A.roads.filter(r=>r.type!=='searoutes'))for(const s of road.segments)for(const t of [.35,.65]){const x=s.a[0]+(s.b[0]-s.a[0])*t,y=s.a[1]+(s.b[1]-s.a[1])*t,c=A.cellAt(x,y);if(c?.biome===biome&&(!territory||A.regions.get(c.region)?.territory===territory)&&!A.curseCells.has(c.id)&&!A.siteAt(x,y,50)&&c.height<58)return {x,y};}return A.cells.find(c=>c.land&&c.biome===biome&&(!territory||A.regions.get(c.region)?.territory===territory));};
 const border=(a,b)=>{for(const c of A.cells.filter(c=>c.land&&c.biome===a))for(let i=0;i<c.polygon.length;i+=2){const j=(i+2)%c.polygon.length,x=(c.polygon[i]+c.polygon[j])/2,y=(c.polygon[i+1]+c.polygon[j+1])/2,e=A.environment(x,y);if(e.mix.some(m=>m.biome===b)&&e.mix.some(m=>m.biome===a))return {x,y};}return roadSample(a);};
 const curse=A.cells.find(c=>A.curseCells.has(c.id));
 const scenes=[['desert','Sarak · atlas désert',roadSample(1)],['forest','Teremor · sous-bois',roadSample(6)],['snow','Igea · neige',roadSample(11)],['marsh','Varan · marais',roadSample(12,'Varan')],['tropical','Tagon · forêt tropicale',roadSample(7)],['cursed','Terres maudites',curse],['taiga','Igea · taïga',roadSample(9,'Igea')],['tundra','Igea · toundra',roadSample(10)],['humid','Varan · forêt humide',roadSample(8,'Varan')],['arid-transition','Transition · désert / prairie',border(1,4)],['snow-transition','Transition · taïga / neige',border(9,11)],['wet-transition','Transition · forêt / marais',border(8,12)]];
 let coast=null;for(const c of A.cells.filter(c=>c.land&&A.regions.get(c.region)?.territory==='Tagon')){for(let i=0;i<c.polygon.length;i+=2){const j=(i+2)%c.polygon.length,x=(c.polygon[i]+c.polygon[j])/2,y=(c.polygon[i+1]+c.polygon[j+1])/2,dx=c.polygon[j]-c.polygon[i],dy=c.polygon[j+1]-c.polygon[i+1],len=Math.hypot(dx,dy);for(const sign of [-1,1]){const p={x:x-dy/len*sign*3,y:y+dx/len*sign*3};if(A.cellAt(p.x,p.y)?.land&&A.coastDistance(p.x,p.y)<4){coast=p;break;}}if(coast)break;}if(coast)break;}
 if(coast)scenes.push(['beach','Tagon · plage et rivage',coast]);
 const crossing=A.crossings.find(p=>A.cellAt(p.x,p.y)?.biome===12)||A.crossings[0];scenes.push(['bridge','Passage de rivière · pont',crossing]);
 let mesa=null;for(const c of A.cells.filter(c=>c.land&&[1,2].includes(c.biome)&&c.height>30)){for(let y=-160;y<160&&!mesa;y+=2)for(let x=-160;x<160;x+=4)if(A.terrain(c.x+x,c.y+y)===8&&A.terrain(c.x+x,c.y+y+2)===0){mesa={x:c.x+x,y:c.y+y+2};break;}if(mesa)break;}if(mesa)scenes.push(['cliffs','Sarak · roche et relief',mesa]);
 const board=canvas.createCanvas(1920,Math.ceil(scenes.length/3)*496),bc=board.getContext('2d');bc.fillStyle='#1b2324';bc.fillRect(0,0,board.width,board.height);bc.font='22px sans-serif';
 for(let i=0;i<scenes.length;i++){const [id,label,p]=scenes[i];Object.assign(g.player,A.toGame(p.x,p.y));g.fairyActor.x=g.player.x-28;g.fairyActor.y=g.player.y-22;g.location=new A.LocationTracker();g.updateLocation(0);r.frame();fs.writeFileSync(path.join(dir,id+'.png'),cv.toBuffer('image/png'));const x=i%3*640,y=Math.floor(i/3)*496;bc.fillStyle='#dfd5b7';bc.fillText(label,x+12,y+30);bc.drawImage(await canvas.loadImage(cv.toBuffer('image/png')),x,y+48);console.log(id,Math.round(p.x),Math.round(p.y));}
 fs.writeFileSync(path.join(dir,'biomes.png'),board.toBuffer('image/png'));
 const props=Object.keys(api.PROPS).filter(k=>k.startsWith('world_')),sheet=canvas.createCanvas(640,Math.ceil(props.length/8)*160),sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;sc.fillStyle='#807b62';sc.fillRect(0,0,sheet.width,sheet.height);sc.font='10px sans-serif';
 props.forEach((k,i)=>{const x=i%8*80,y=Math.floor(i/8)*160;sc.drawImage(r.propCache[k],x-8,y+5,96,96);sc.fillStyle='#f0e9d1';sc.fillText(k.replace('world_',''),x+2,y+120);});fs.writeFileSync(path.join(dir,'props.png'),sheet.toBuffer('image/png'));
 Object.assign(g.player,A.toGame(A.prison.x+4.5,A.prison.y+10.5));Object.assign(g.fairyActor,A.toGame(A.prison.x+6.5,A.prison.y+8.5));g.clock=1320;g.updateLocation(2);r.frame();fs.writeFileSync(path.join(dir,'fairy.png'),cv.toBuffer('image/png'));
 console.log('Preview:',dir);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
