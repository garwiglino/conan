const {test,before}=require('node:test'),assert=require('node:assert/strict'),{RenderingAudioContext}=require('web-audio-engine'),{loadGame}=require('./game-harness.cjs');let a;before(async()=>{a=await loadGame();});
test('surface lookup follows bridges, upper floors, cold ground and dry tropical land',()=>{
 const game={clock:480,tile:()=>5},actor={x:1,y:1};assert.equal(a.footSurface(game,actor),'wood');game.tile=()=>3;assert.equal(a.footSurface(game,actor),'water');actor.level=1;assert.equal(a.footSurface(game,actor),'wood');actor.level=0;
 // Tropical ground shows bare earth on its dry patches; pick a cell centre on one.
 for(const b of [1,7,11]){const c=a.Atlas.cells.find(c=>c.land&&c.biome===b&&(b!==7||a.WorldTerrainArt.noise(Math.floor(c.x*16),Math.floor(c.y*16),86,450)>.68));Object.assign(actor,a.Atlas.toGame(c.x,c.y));game.tile=()=>0;assert.equal(a.footSurface(game,actor),b===1?'sand':b===7?'earth':'snow');}
 game.tile=()=>2;const c=a.Atlas.cells.find(c=>c.land&&c.biome===7);Object.assign(actor,a.Atlas.toGame(c.x,c.y));assert.equal(a.footSurface(game,actor),'stone');
});
test('NPC steps follow moved distance and proximity, never idle, flight, warps, pause or travel',()=>{
 const s=new a.Sound();s.enabled=true;const calls=[];s.footstep=(material,options)=>calls.push({material,...options});const p={x:200,y:200},n={id:'walker',x:245,y:200},fairy={id:'fairy',x:220,y:200},g={player:p,npcs:[n,fairy],enemies:[],time:0,clock:480,tile:()=>2,npcPresent:()=>true};
 const tick=(dx=0)=>{g.time+=.04;n.x+=dx;n.anim=(n.anim||0)+dx/5.5;fairy.x+=dx;s.updateFootsteps(g,true,.04);};tick();for(let i=0;i<20;i++)tick();assert.equal(calls.length,0);for(let i=0;i<12;i++)tick(1.5);assert.equal(calls.length,1);assert.equal(calls[0].material,'stone');assert.ok(calls[0].pan>0&&calls[0].gain<.65);
 n.x+=500;tick();assert.equal(calls.length,1);n.x=240;s.updateFootsteps(g,false,.04);tick();assert.equal(calls.length,1);g.journey={};for(let i=0;i<20;i++)tick(1.5);assert.equal(calls.length,1);g.journey=null;tick();assert.equal(calls.length,1);
});
test('all nine materials have three distinct bounded variants, SFX muting and a crowd voice cap',()=>{
 const c=new RenderingAudioContext({sampleRate:16000}),s=new a.Sound();s.ctx=c;s.enabled=true;s.master=c.createGain();s.master.connect(c.destination);const hashes=new Set();
 for(const material of Object.keys(a.FOOT_MATERIALS))for(let v=0;v<3;v++){const b=s.footBuffer(material,v),data=b.getChannelData(0);assert.equal(s.footBuffer(material,v),b);assert.ok(data.every(Number.isFinite));assert.ok(Math.max(...data.map(Math.abs))<=.111);hashes.add(require('crypto').createHash('sha256').update(Buffer.from(data.buffer)).digest('hex'));}assert.equal(hashes.size,27);
 s.sfxOn=false;s.footstep('stone');assert.equal(s.footVoices,undefined);s.sfxOn=true;for(let i=0;i<20;i++)s.footstep('stone');assert.equal(s.footVoices.length,8);c.processTo(.5);s.footstep('snow');assert.equal(s.footVoices.length,1);s.travelQuiet=true;s.footstep('snow');assert.equal(s.footVoices.length,1);
});
test('new audio defaults favor SFX and source calibration reduces loud samples without boosting quiet ones',()=>{
 const s=new a.Sound(),c=new RenderingAudioContext({sampleRate:16000}),b=c.createBuffer(1,1600,16000);assert.equal(s.musicVolume,.45);assert.equal(s.sfxVolume,1);b.getChannelData(0).fill(.8);assert.ok(s.sampleTrim(b)<.06);assert.equal(s.sampleTrim(b),s.sampleTrim(b));
});
test('snow-covered tents keep the same blocking footprint as bare tents',()=>{
 const g=new a.Game(),site=a.Atlas.byId['town-69'],p=a.Atlas.toGame(site.x,site.y),tent={kind:'tent',x:p.x,y:p.y};g.atlasProps=[tent];const points=[[-20,-20],[0,-10],[20,0],[40,0]],bare=points.map(([x,y])=>g.solid(p.x+x,p.y+y,5,0));tent.kind='snow_tent';assert.deepEqual(points.map(([x,y])=>g.solid(p.x+x,p.y+y,5,0)),bare);assert.equal(bare[1],true);
});

test('environment slider controls a separate bus and cannot alter music or action volume',()=>{
 const c=new RenderingAudioContext({sampleRate:16000}),s=new a.Sound();s.ctx=c;s.enabled=true;s.master=c.createGain();s.master.gain.value=.3;s.master.connect(c.destination);s.music=new a.Music(c,c.destination);const env=s.environmentOutput();let envTarget=.3,sfxTarget=.3;env.gain.setTargetAtTime=v=>{envTarget=v;};s.master.gain.setTargetAtTime=v=>{sfxTarget=v;};s.sfxOn=false;s.applyVolumes();c.processTo(1);assert.equal(envTarget,.3);assert.equal(sfxTarget,0);s.setEnvironmentVolume(.25);c.processTo(2);assert.equal(envTarget,.075);assert.equal(s.musicVolume,.45);assert.equal(s.sfxVolume,1);s.setEnvironmentVolume(0);c.processTo(3);assert.equal(envTarget,0);
});

test('interface mute suppresses UI cues without suppressing combat sounds',()=>{const c=new RenderingAudioContext({sampleRate:16000}),s=new a.Sound();s.ctx=c;s.enabled=true;s.master=c.createGain();let cues=0,tones=0;s.music={cue:()=>cues++};s.tone=()=>tones++;s.uiSoundsOn=false;s.fx('ui_select');s.fx('ui_confirm');assert.equal(cues,0);s.fx('sword');assert.equal(tones,1);s.uiSoundsOn=true;s.fx('ui_select');assert.equal(cues,1);});


test('every supported surface is reachable from the actual material resolver',()=>{
 const found=new Set(),g={clock:480,tile:()=>0},actor={level:0};
 for(const cell of a.Atlas.cells.filter(c=>c.land)){Object.assign(actor,a.Atlas.toGame(cell.x,cell.y));for(const t of [0,1,2,3,5]){g.tile=()=>t;found.add(a.footSurface(g,actor));}if(found.size===9)break;}
 assert.deepEqual([...found].sort(),Object.keys(a.FOOT_MATERIALS).sort());
});
