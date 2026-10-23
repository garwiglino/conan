// Page d'écoute des musiques et des bruitages : le séquenceur Music du jeu, ses voix, la cave des donjons et la puce des
// bruitages 8 bits, copiés tels quels depuis index.html, avec audio/music-scores.json et audio/chip-sfx.json. Usage : node scripts/build-music-atelier.cjs [fragment.html]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pick = (re, what) => { const m = re.exec(html); if (!m) throw new Error('introuvable dans index.html : ' + what); return m[0]; };
const engine = [pick(/^const MUSIC_VOLUME=.*$/m, 'MUSIC_VOLUME'), pick(/^const MUSIC_AHEAD=.*$/m, 'MUSIC_AHEAD'),
  pick(/^function titleVoice\(m,song,tr,t,dur,note,vel\)\{[\s\S]*?\n\}(?=\n)/m, 'voix cuivres, chœur, timbales et cloches'),
  pick(/\/\/ music\.js — séquenceur chiptune[\s\S]*?(?=\n\/\/ jingles 8-bit)/, 'classe Music'),
  pick(/^const SFX_VOLUME=.*$/m, 'SFX_VOLUME'), pick(/^const AMB_VOLUME=[^;]*;/m, 'AMB_VOLUME'),
  pick(/^const DungeonCave=[\s\S]*?\n\}\)\(\);/m, 'cave des donjons'), pick(/^const CAVE_LEVEL=.*$/m, 'CAVE_ROOM'),
  pick(/^const ChipSfx=[\s\S]*?\n\}\)\(\);/m, 'puce des bruitages 8 bits')].join('\n');
const floors = JSON.stringify(require(path.join(root, 'data/donjons/forteresse-grise-gueule.json')).etages.map(e => [e.id, e.nom]));
const silent = pick(/(?<=^const SILENT_WAV=)'[^']*'/m, 'SILENT_WAV');
const scores = fs.readFileSync(path.join(root, 'audio/music-scores.json'), 'utf8').trim();
const chip = JSON.stringify(require(path.join(root, 'audio/chip-sfx.json')));
const fragment = fs.readFileSync(path.join(root, 'art/musique/atelier.template.html'), 'utf8')
  .replace('/*__MUSIC_SCORES__*/{}', () => scores).replace('/*__CAVE_FLOORS__*/[]', () => floors).replace("/*__SILENT_WAV__*/''", () => silent).replace('/*__CHIP_SFX__*/{families:{}}', () => chip).replace('/*__MUSIC_ENGINE__*/', () => engine);
fs.writeFileSync(path.join(root, 'art/musique/atelier.html'), '<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + fragment + '</html>\n');
if (process.argv[2]) fs.writeFileSync(process.argv[2], fragment);
console.log('Atelier musical : ' + Object.keys(JSON.parse(scores)).length + ' morceaux et ' + Object.keys(JSON.parse(chip).families).length + ' bruitages 8 bits, moteurs du jeu inclus.');
