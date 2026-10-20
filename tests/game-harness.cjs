const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const canvas = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

async function loadGame(Image = canvas.Image, {timers = false} = {}) {
  new vm.Script(script); // Check the whole shipped script, including UI boot code.
  const context = vm.createContext({
    console, Image, Uint8ClampedArray, Path2D: canvas.Path2D,
    setTimeout: timers ? setTimeout : () => 0, performance,
    document: {
      createElement(tag) {if (tag !== 'canvas') throw new Error(tag); return canvas.createCanvas(1, 1);},
      getElementById() {return {hidden: true, clientHeight: 224};}
    }
  });
  vm.runInContext(script.slice(0, script.indexOf('// app.js')) +
    'globalThis.api={HearthreaverSettlementArchitecture,HearthreaverIsometricStations,HearthreaverCityPixels,TravelAlerts,CIVILIAN_ART,CIVILIAN_BITMAPS,civilianFrame,civilianAppearance,civilianBiome,civilianHash,WorldDanger,GroundTracks,trackBody,trackSurface,trackColor,terrainTrackColors,coldBreathProfile,biomeAtmosphere,installLocalRaster,footSurface,FOOT_MATERIALS,SFX_DATA,climateAt,worldClimateAt,BIOME_CLIMATE,BIOME_SCORES,SnowVisuals,renderSnowFog,WorldArtStream,worldArtWorkerSource,WorldTerrainArt,PROPS,RAMP,Atlas,WorldJournalStore,Game,Renderer,CharacterAtlas,BITMAPS,CO_ART,CO_MOVES,guardianFrame,guardianClip,BOSS_ART,bossClip,bossFrame,bossVisual,bossPlay,bossIdle,stepBossHazard,drawBossFX,drawBossBolt,enemy,Music,MusicDirector,Sound,Haptics,dayCycle,skyAt,weatherFront,weatherTint,StormSystem,RainVisuals,renderRainGround,WEATHER_SCORES,WEATHER_TIMBRES,TextSettings,textSettings,text,textW,canvasLines,UI_CUES,MUSIC_DATA,CUE_DATA,TitleScene,TITLE_ART,HearthreaverKaldorCivilianArt,HearthreaverWeapons,KaldorArsenal,KaldorArmaments,Batraciens,NpcCombat,enemy,swordPose,attackFrame,attackLength,bladeHits};})();', context);
  await context.api.BITMAPS.promise;
  return context.api;
}
// Combat arenas discard village NPCs; workstation path searches do not belong
// in their setup. The normal world constructor remains unchanged elsewhere.
function combatGame(api) {
  const proto = api.Game.prototype, setup = proto.ensureHumanWorkstations;
  try {
    proto.ensureHumanWorkstations = function() {};
    return new api.Game();
  } finally { proto.ensureHumanWorkstations = setup; }
}
module.exports = {loadGame, combatGame, canvas, root, html};
