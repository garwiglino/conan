// Page d'écoute des musiques 8 bits : le séquenceur Music du jeu, copié tel quel depuis index.html,
// et les partitions de audio/music-scores.json. Usage : node scripts/build-music-atelier.cjs [fragment.html]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const pick = (re, what) => { const m = re.exec(html); if (!m) throw new Error('introuvable dans index.html : ' + what); return m[0]; };
const engine = [pick(/^const MUSIC_VOLUME=.*$/m, 'MUSIC_VOLUME'), pick(/^const MUSIC_AHEAD=.*$/m, 'MUSIC_AHEAD'),
  pick(/\/\/ music\.js — séquenceur chiptune[\s\S]*?(?=\n\/\/ jingles 8-bit)/, 'classe Music')].join('\n');
const silent = pick(/(?<=^const SILENT_WAV=)'[^']*'/m, 'SILENT_WAV');
const scores = fs.readFileSync(path.join(root, 'audio/music-scores.json'), 'utf8').trim();
const fragment = fs.readFileSync(path.join(root, 'art/musique/atelier.template.html'), 'utf8')
  .replace('/*__MUSIC_SCORES__*/{}', () => scores).replace("/*__SILENT_WAV__*/''", () => silent).replace('/*__MUSIC_ENGINE__*/', () => engine);
fs.writeFileSync(path.join(root, 'art/musique/atelier.html'), '<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + fragment + '</html>\n');
if (process.argv[2]) fs.writeFileSync(process.argv[2], fragment);
console.log('Atelier musical : ' + Object.keys(JSON.parse(scores)).length + ' morceaux, séquenceur du jeu inclus.');
