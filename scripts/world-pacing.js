/* Codex / ChatGPT: one clock for visible walking, planning and distant agents. */
const WorldPacing=Object.freeze({
 dayRealSeconds:3600,pixelsPerMetre:16,playerWalk:67,civilianWalk:32,
 metresPerMinute(pixelsPerSecond){return pixelsPerSecond/this.pixelsPerMetre*this.dayRealSeconds/1440;},
 realSeconds(minutes){return minutes*this.dayRealSeconds/1440;}
});
if(typeof module!=='undefined'&&module.exports)module.exports=WorldPacing;
