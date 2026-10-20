// Construit les 13 musiques 8 bits du jeu depuis scripts/chiptune-songs.cjs :
// audio/music-scores.json (joué par le séquenceur du jeu) et un MIDI type 1 par morceau.
// Les deux sorties viennent des mêmes événements ; les tests vérifient qu'elles concordent.
const fs = require('fs'), path = require('path'), {buildAll, TPB} = require('./chiptune-songs.cjs');
const dir = path.join(__dirname, '../audio');

function midi(file, name, s) {
  const vlq = n => { const b = [n & 127]; while (n >>= 7) b.unshift((n & 127) | 128); return Buffer.from(b); };
  const chunk = (id, b) => { const l = Buffer.alloc(4); l.writeUInt32BE(b.length); return Buffer.concat([Buffer.from(id), l, b]); };
  const meta = (type, text) => Buffer.concat([Buffer.from([255, type]), vlq(Buffer.byteLength(text)), Buffer.from(text)]);
  const end = s.bars * 4 * TPB;
  const track = ev => {
    ev.sort((a, b) => a.t - b.t || a.o - b.o);
    let prev = 0; const out = [];
    for (const e of ev) { out.push(vlq(e.t - prev), e.b); prev = e.t; }
    out.push(vlq(end - prev), Buffer.from([255, 47, 0]));
    return chunk('MTrk', Buffer.concat(out));
  };
  const tempo = Math.round(60000000 / s.bpm);
  const tracks = [track([{t: 0, o: 0, b: meta(3, name)}, {t: 0, o: 1, b: Buffer.from([255, 81, 3, tempo >> 16, tempo >> 8 & 255, tempo & 255])}])];
  let channel = 0;
  for (const [part, notes] of Object.entries(s.tracks)) {
    const ch = part === 'drums' ? 9 : channel++, t = s.timbres[part], program = (s.programs || {})[part] ?? 80;
    const ev = [{t: 0, o: 0, b: meta(3, part)}, {t: 0, o: 1, b: Buffer.from([192 | ch, program])},
      {t: 0, o: 1, b: Buffer.from([176 | ch, 10, Math.round(64 + (t.pan || 0) * 63)])},
      {t: 0, o: 1, b: Buffer.from([176 | ch, 7, Math.min(115, Math.round(90 * Math.sqrt(t.g / .24)))])}];
    for (let j = 0; j < notes.length; j += 4) {
      const [at, d, n, v] = notes.slice(j, j + 4);
      ev.push({t: at, o: 3, b: Buffer.from([144 | ch, n, v])}, {t: at + d, o: 2, b: Buffer.from([128 | ch, n, 0])});
    }
    tracks.push(track(ev));
  }
  const h = Buffer.alloc(6); h.writeUInt16BE(1); h.writeUInt16BE(tracks.length, 2); h.writeUInt16BE(TPB, 4);
  fs.writeFileSync(path.join(dir, file), Buffer.concat([chunk('MThd', h), ...tracks]));
}

const scores = buildAll();
for (const [name, score] of Object.entries(scores)) {
  midi(name + '.mid', name, score);
  if (score.intro) midi(name + '-intro.mid', name + '-intro', {...score.intro, programs: score.programs});
}
fs.writeFileSync(path.join(dir, 'music-scores.json'), JSON.stringify(scores) + '\n');
console.log('Built ' + Object.keys(scores).length + ' chiptune scores on a strict grid, with matching type-1 MIDI files.');
