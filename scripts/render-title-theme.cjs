// Render the actual game synth and scheduler; MIDI/JSON remain the composition sources.
const fs=require('node:fs'),path=require('node:path');
const {RenderingAudioContext}=require('web-audio-engine'),{loadGame,root}=require('../tests/game-harness.cjs');
(async()=>{
 const a=await loadGame(),ctx=new RenderingAudioContext({sampleRate:44100,numberOfChannels:2}),music=new a.Music(ctx,ctx.destination),seconds=a.MUSIC_DATA.title.bars*240/a.MUSIC_DATA.title.bpm;
 for(let t=0;t<seconds+3;t+=.1){music.update(t<seconds+1?'title':null);ctx.processTo(Math.min(t+.1,seconds+3));}
 const data=ctx.exportAsAudioData();let peak=0;
 for(const channel of data.channelData)for(const sample of channel){if(!Number.isFinite(sample))throw new Error('Invalid sample');peak=Math.max(peak,Math.abs(sample));}
 if(peak>=1)throw new Error('Clipped render');
 const file=process.argv[2]||path.join(root,'test-output/hearthreaver-theme.wav');fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,Buffer.from(await ctx.encodeAudioData(data)));console.log(JSON.stringify({file,loopSeconds:seconds,peak}));
})().catch(e=>{console.error(e);process.exitCode=1;});
