// Partitions 8 bits de Hearthreaver : une seule source pour le jeu et les MIDI.
// Chaque mesure est écrite sur une grille fixe (16 doubles croches, ou 12 croches de triolet
// pour les morceaux à trois temps balancés) ; le build refuse toute mesure qui ne tombe pas juste.
// Notation : « D5:4 » = ré 5 pendant 4 pas, « -:2 » = silence de 2 pas.
// Les basses, arpèges, nappes et contrechants sont dérivés des accords de chaque mesure.
const TPB = 480, BAR = TPB * 4;

const PITCH = {C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11};
function midiNote(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) throw new Error('note illisible : ' + name);
  return 12 * (Number(m[3]) + 1) + PITCH[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
const QUALITY = {'': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], dim7: [0, 3, 6, 9], sus4: [0, 5, 7], '5': [0, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14]};
function chord(symbol) {
  const m = /^([A-G])(#|b)?(.*)$/.exec(symbol);
  if (!m || !QUALITY[m[3]]) throw new Error('accord illisible : ' + symbol);
  return {symbol, root: PITCH[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0), steps: QUALITY[m[3]]};
}

// Une mesure de mélodie : liste de [note|null, pas]. La somme doit valoir exactement la mesure.
function parseBar(text, steps, where) {
  const out = []; let total = 0;
  for (const token of text.trim().split(/\s+/)) {
    const [name, len] = token.split(':'), n = Number(len ?? 1);
    if (!Number.isInteger(n) || n < 1) throw new Error(where + ' : durée invalide ' + token);
    out.push([name === '-' ? null : midiNote(name), n]); total += n;
  }
  if (total !== steps) throw new Error(where + ' : ' + total + ' pas au lieu de ' + steps + ' (« ' + text + ' »)');
  return out;
}
const pc = n => ((n % 12) + 12) % 12;
// Note de l'accord la plus proche au-dessus d'un plancher.
function above(floor, pitchClass) { let n = floor + pc(pitchClass - floor); return n; }

function build(song) {
  const steps = song.steps || 16, step = BAR / steps, tracks = {lead: [], harm: [], arp: [], saw: [], bass: [], drums: []};
  const add = (track, t, len, n, v, artic = .92) => tracks[track].push(Math.round(t), Math.max(12, Math.round(len * artic)), n, Math.max(1, Math.min(127, Math.round(v))));
  let bar = 0;
  for (const entry of song.order) {
    const [name, ...flags] = entry.split('+'), sec = song.sections[name];
    if (!sec) throw new Error(song.name + ' : section inconnue ' + name);
    const opts = new Set(flags), count = sec.chords.length;
    for (const key of ['lead', 'harm']) if (Array.isArray(sec[key]) && sec[key].length !== count) throw new Error(song.name + '/' + name + ' : ' + key + ' ne compte pas ' + count + ' mesures');
    for (let i = 0; i < count; i++, bar++) {
      const t0 = bar * BAR, parts = sec.chords[i].split('|').map(chord), span = steps / parts.length;
      if (!Number.isInteger(span)) throw new Error(song.name + ' : accords mal répartis mesure ' + (bar + 1));
      const chordAt = s => parts[Math.min(parts.length - 1, Math.floor(s / span))], last = i === count - 1, where = song.name + ' mesure ' + (bar + 1);
      // Mélodie principale, accent léger sur les temps forts.
      const melody = sec.lead && !opts.has('nolead') ? parseBar(sec.lead[i], steps, where) : [];
      const octave = opts.has('up') ? 12 : opts.has('down') ? -12 : 0;
      let s = 0;
      for (const [n, len] of melody) {
        if (n !== null) add('lead', t0 + s * step, len * step, n + octave, (song.leadVel || 84) + (s === 0 ? 8 : s % (steps / 4) === 0 ? 3 : 0), song.leadArtic || .92);
        s += len;
      }
      // Contrechant : écrit à la main, ou tierce/sixte de l'accord sous chaque note tenue.
      if (Array.isArray(sec.harm)) {
        s = 0;
        for (const [n, len] of parseBar(sec.harm[i], steps, where + ' (contrechant)')) { if (n !== null) add('harm', t0 + s * step, len * step, n, song.harmVel || 70, .9); s += len; }
      } else if (sec.harm === 'auto' || opts.has('harm')) {
        s = 0;
        for (const [n, len] of melody) {
          if (n !== null && len >= (song.harmMin || 2)) {
            const lead = n + octave, tones = chordAt(s).steps.map(x => chordAt(s).root + x);
            let best = null;
            for (let h = lead - 9; h <= lead - 3; h++) if (tones.some(x => pc(x) === pc(h))) best = h;
            if (best !== null) add('harm', t0 + s * step, len * step, best, song.harmVel || 66, .9);
          }
          s += len;
        }
      }
      // Basse : motif en degrés de l'accord (R fondamentale, 3, 5, 7, 8 octave).
      const bassPattern = (last && sec.bassEnd) || sec.bass || song.bass;
      if (bassPattern && !opts.has('nobass')) {
        s = 0;
        for (const token of bassPattern.trim().split(/\s+/)) {
          const [deg, len] = token.split(':'), n = Number(len ?? 1), c = chordAt(s), root = above(song.bassLow ?? 43, c.root);
          if (deg !== '-') {
            const offset = {R: 0, '3': c.steps[1], '5': c.steps.includes(7) ? 7 : c.steps[2], '7': c.steps[3] ?? 10, '8': 12, '-5': -5}[deg];
            if (offset === undefined) throw new Error(where + ' : degré de basse ' + deg);
            add('bass', t0 + s * step, n * step, root + offset, s === 0 ? 100 : 88, song.bassArtic || .82);
          }
          s += n;
        }
        if (s !== steps) throw new Error(where + ' : basse de ' + s + ' pas');
      }
      // Arpège : indices dans les notes de l'accord, à partir d'un plancher.
      const arpPattern = (last && sec.arpEnd) || sec.arp;
      if (arpPattern && !opts.has('noarp')) {
        s = 0;
        for (const token of arpPattern.trim().split(/\s+/)) {
          const [idx, len] = token.split(':'), n = Number(len ?? 1), c = chordAt(s);
          if (idx !== '-') {
            const tones = c.steps.filter(x => x < 12).map(x => above(song.arpLow ?? 62, c.root + x)).sort((a, b) => a - b), k = Number(idx);
            add('arp', t0 + s * step, n * step, tones[k % tones.length] + 12 * Math.floor(k / tones.length), (song.arpVel || 58) + (s % (steps / 4) === 0 ? 10 : 0), .6);
          }
          s += n;
        }
        if (s !== steps) throw new Error(where + ' : arpège de ' + s + ' pas');
      }
      // Nappe : tierce et quinte (ou quinte seule) tenues sur chaque accord.
      if ((sec.pad ?? song.pad) && !opts.has('nopad')) {
        parts.forEach((c, k) => {
          const keep = song.padMode === 'fifth' || c.steps.length < 3 ? [0, 7] : [c.steps[1], c.steps.includes(7) ? 7 : c.steps[2]];
          for (const x of keep) add('saw', t0 + k * span * step, span * step, above(song.padLow ?? 55, c.root + x), song.padVel || 56, .97);
        });
      }
      // Batterie : couloirs de 16 (ou 12) cases, « x » normal, « X » accent, « g » note fantôme.
      const kit = (last && sec.fill) || sec.drums;
      if (kit && !opts.has('nodrums')) {
        for (const [lane, row] of Object.entries(kit)) {
          const cells = row.replace(/\s/g, '');
          if (cells.length !== steps) throw new Error(where + ' : couloir ' + lane + ' de ' + cells.length + ' cases');
          const note = {K: 36, S: 38, h: 42, o: 46, C: 49, r: 51, T: 45, M: 43, L: 41}[lane];
          [...cells].forEach((c, k) => { if (c !== '.') add('drums', t0 + k * step, step, note, c === 'X' ? 112 : c === 'g' ? 44 : 82, .9); });
        }
      }
    }
  }
  for (const k of Object.keys(tracks)) {
    const ev = tracks[k], rows = [];
    for (let i = 0; i < ev.length; i += 4) rows.push(ev.slice(i, i + 4));
    rows.sort((a, b) => a[0] - b[0] || a[2] - b[2]);
    tracks[k] = rows.flat();
  }
  const bars = bar, timbres = {};
  for (const k of Object.keys(tracks)) timbres[k] = {...BASE_TIMBRES[k], ...(song.timbres?.[k] || {})};
  return {title: song.title, bpm: song.bpm, tpb: TPB, bars, grid: steps, dur: bars * 240 / song.bpm, style: 'chip', gain: song.gain ?? 1,
    echo: song.echo ?? .75, echoGain: song.echoGain ?? .2, tracks, timbres,
    programs: {lead: 80, harm: 81, arp: 80, saw: 81, bass: 38, drums: 0, ...(song.programs || {})}};
}

// Timbres façon NES : pulse 25 % en tête, pulse 50 % en second, pulse 12,5 % pour les arpèges,
// dents de scie en paliers pour la nappe, triangle 4 bits en basse, bruit LFSR en batterie.
const BASE_TIMBRES = {
  lead: {w: 'p25', g: .21, pan: 0, a: .004, tau: .3, sus: .62, rel: .05, vib: 12},
  harm: {w: 'p50', g: .16, pan: .32, a: .006, tau: .28, sus: .55, rel: .05, vib: 6},
  arp: {w: 'p125', g: .15, pan: -.3, a: .002, tau: .08, sus: .35, rel: .03},
  saw: {w: 'saw', g: .07, pan: -.12, a: .08, tau: .9, sus: .8, rel: .1},
  bass: {w: 'tri', g: .45, pan: 0, a: .002, flat: true, rel: .012},
  drums: {g: .2, pan: .12}
};

// gain : niveau calibré par rendu hors ligne (médiane sur 400 ms) : exploration vers -58 dB,
// voyage -57 dB, combat et boss -52 dB, défaite -51 dB, au volume musique par défaut de 45 %.
const SONGS = [
 {name: 'biome_forest', title: 'Sous les chênes', mood: 'Forêts tempérées : ré dorien, marche tranquille.', bpm: 100, gain: .18,
  bass: 'R:2 5:2 8:2 5:2 R:2 5:2 8:2 5:2', pad: true, echo: .75,
  sections: {
   A: {chords: ['Dm', 'C', 'G', 'Dm', 'Dm', 'C', 'Bb', 'A'],
    lead: ['D5:2 A4:2 D5:2 E5:2 F5:4 E5:2 D5:2', 'E5:2 C5:2 G4:4 C5:2 D5:2 E5:4', 'D5:4 B4:2 G4:2 A4:2 B4:2 D5:2 G5:2', 'F5:6 E5:2 D5:8',
     'D5:2 A4:2 D5:2 E5:2 F5:2 G5:2 A5:4', 'G5:2 E5:2 C5:2 E5:2 G5:4 F5:2 E5:2', 'F5:4 D5:2 Bb4:2 C5:2 D5:2 F5:2 D5:2', 'E5:6 C#5:2 A4:8'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {K: 'x.......x.......', S: '............g...', h: '..g...g...g...g.'},
    fill: {K: 'x.......x.......', S: '........g.g.x.xx', h: '..g...g.........'}},
   A2: {chords: ['Dm', 'C', 'G', 'Dm', 'Dm', 'C', 'A', 'Dm'], harm: 'auto',
    lead: ['D5:2 A4:2 D5:2 E5:2 F5:4 E5:2 D5:2', 'E5:2 C5:2 G4:4 C5:2 D5:2 E5:4', 'D5:4 B4:2 G4:2 A4:2 B4:2 D5:2 G5:2', 'A5:4 G5:2 F5:2 E5:4 D5:4',
     'D5:2 A4:2 D5:2 E5:2 F5:2 G5:2 A5:4', 'G5:2 E5:2 C5:2 E5:2 G5:4 F5:2 E5:2', 'E5:4 C#5:2 E5:2 A5:4 G5:2 E5:2', 'F5:4 E5:2 C#5:2 D5:8'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {K: 'x.......x.......', S: '....g.......x...', h: '..g...g...g...g.'},
    fill: {K: 'x.......x.x.....', S: '....g.......xxxx', C: '................'}},
   B: {chords: ['Bb', 'F', 'C', 'Dm', 'Bb', 'F', 'Gm', 'A'], harm: 'auto',
    lead: ['F5:6 D5:2 Bb4:4 C5:2 D5:2', 'C5:6 A4:2 F4:4 G4:2 A4:2', 'G4:4 C5:4 E5:4 G5:4', 'F5:8 A5:4 F5:4',
     'D6:6 C6:2 Bb5:4 F5:4', 'A5:6 G5:2 F5:4 C5:4', 'Bb5:4 A5:2 G5:2 D5:4 G5:4', 'A5:8 E5:4 C#5:4'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {K: 'x.....x.x.......', S: '....x.......x...', h: 'x.g.x.g.x.g.x.g.'},
    fill: {K: 'x.....x.x.......', S: '....x.......xxxx', h: 'x.g.x.g.x.......'}},
   C: {chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'C', 'A'],
    harm: ['A4:8 F4:8', 'D5:8 Bb4:8', 'C5:8 E5:8', 'C#5:16', 'F5:8 E5:4 D5:4', 'D5:8 F5:8', 'E5:8 G5:8', 'E5:8 C#5:4 E5:4'],
    arp: '0 1 2 3 2 1 0 1 2 3 2 1 0 1 2 1',
    drums: {K: 'x.......x.......', h: '..g...g...g...g.'},
    fill: {K: 'x.......x.......', S: '............g.g.', h: '..g...g...g.....'}}
  },
  order: ['A', 'A2', 'B', 'C']},

 {name: 'biome_coast', title: 'Écume et sel', mood: 'Côtes : fa majeur balancé en trois, chant de marins.', bpm: 84, gain: .24, steps: 12,
  bass: 'R:2 -:1 5:2 -:1 R:2 -:1 5:2 -:1', pad: true, echo: 1, echoGain: .16, harmMin: 3,
  timbres: {lead: {w: 'p50', g: .2, vib: 10}, harm: {w: 'p25', g: .13}},
  sections: {
   A: {chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C7', 'Bb|C', 'F'],
    lead: ['C5:3 F5:2 G5:1 A5:3 F5:3', 'G5:3 E5:2 F5:1 G5:3 C5:3', 'A5:3 F5:2 E5:1 D5:3 F5:3', 'F5:2 E5:1 D5:3 Bb4:6',
     'C5:3 F5:2 G5:1 A5:3 C6:3', 'Bb5:3 G5:2 A5:1 Bb5:3 G5:3', 'F5:3 D5:3 E5:3 G5:3', 'F5:9 -:3'],
    arp: '0 1 2 1 2 1 0 1 2 1 2 1',
    drums: {K: 'x.....x.....', S: '...g.....g..', h: '..g..g..g..g'},
    fill: {K: 'x.....x.....', S: '...g.....xxx'}},
   B: {chords: ['Dm', 'Am', 'Bb', 'F', 'Dm', 'Am', 'Gm', 'C7'], harm: 'auto',
    lead: ['A5:5 G5:1 F5:3 D5:3', 'E5:5 D5:1 C5:3 A4:3', 'D5:3 F5:3 Bb5:5 A5:1', 'A5:6 C6:3 A5:3',
     'D6:5 C6:1 A5:3 F5:3', 'E5:5 F5:1 E5:3 C5:3', 'D5:3 G5:3 Bb5:3 G5:3', 'C6:3 Bb5:3 G5:3 E5:3'],
    arp: '0 1 2 3 2 1 0 1 2 3 2 1',
    drums: {K: 'x.....x.....', S: '...x.....x..', h: 'g.gg.gg.gg.g'},
    fill: {K: 'x.....x.x...', S: '...x.....xxx', h: 'g.gg.g......'}}
  },
  order: ['A', 'A+harm', 'B']},

 {name: 'biome_desert', title: 'Sables de Sarak', mood: 'Déserts : mi phrygien majeur sur bourdon, rythme maqsoum.', bpm: 92, gain: .19,
  bass: 'R:2 -:4 R:2 5:4 R:2 -:2', echo: .75, echoGain: .22,
  timbres: {lead: {w: 'p125', g: .22, vib: 18, tau: .4, sus: .7}, harm: {w: 'p25', g: .13}, saw: {g: .065, a: .3}},
  pad: true, padLow: 52, padMode: 'fifth',
  sections: {
   A: {chords: ['E', 'E', 'F', 'E', 'Am', 'Dm', 'F', 'E'],
    lead: ['E5:4 F5:2 G#5:2 A5:4 G#5:2 F5:2', 'E5:6 F5:1 E5:1 D5:4 E5:4', 'A5:4 G#5:2 F5:2 A5:4 C6:4', 'B5:6 A5:2 G#5:4 E5:4',
     'A5:4 C6:2 B5:2 A5:4 E5:4', 'F5:4 A5:2 G#5:2 F5:4 D5:4', 'C6:4 B5:2 A5:2 G#5:4 F5:4', 'E5:12 -:4'],
    drums: {L: 'x.....x.x.......', T: '..x.......x.x...', h: '.g.g.g.g.g.g.g.g'},
    fill: {L: 'x.....x.x.......', T: '..x.......x.xxxx', h: '.g.g.g.g.g......'}},
   B: {chords: ['Am', 'Am', 'Dm', 'E', 'F', 'E', 'F', 'E'],
    lead: ['A4:2 C5:2 E5:4 D5:2 C5:2 B4:2 A4:2', 'C5:2 B4:2 A4:2 G#4:2 A4:8', 'D5:2 F5:2 A5:4 G#5:2 F5:2 E5:2 D5:2', 'E5:2 F5:2 E5:2 D5:2 E5:8',
     'A5:2 C6:2 B5:2 A5:2 G#5:4 A5:4', 'B5:2 A5:2 G#5:2 F5:2 E5:8', 'F5:2 E5:2 F5:2 G#5:2 A5:4 C6:4', 'B5:4 G#5:4 E5:8'],
    arp: '0 2 1 2 0 2 1 2 0 2 1 2 0 2 1 2',
    drums: {L: 'x.....x.x.......', T: '..x.......x.x...', K: 'x.......x.......', h: 'gggggggggggggggg'},
    fill: {L: 'x.....x.x.......', T: '..x.......xxxxxx', K: 'x.......x.......', C: '................'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'biome_steppe', title: 'Le vent des steppes', mood: 'Steppes et prairies : la mineur au galop.', bpm: 126, gain: .17,
  bass: 'R:2 R:1 R:1 R:2 R:1 R:1 5:2 5:1 5:1 5:2 5:1 5:1', echo: .75, echoGain: .18,
  timbres: {lead: {w: 'p25', g: .22, tau: .45, sus: .72}},
  sections: {
   A: {chords: ['Am', 'G', 'Am', 'Em', 'Am', 'G', 'F', 'E'],
    lead: ['A4:4 C5:4 E5:6 D5:2', 'D5:4 B4:4 G4:8', 'A4:4 C5:4 E5:4 A5:4', 'G5:6 F#5:2 E5:8',
     'A5:4 G5:2 E5:2 C5:4 E5:4', 'D5:6 E5:2 D5:4 B4:4', 'C5:4 A4:4 F4:4 A4:4', 'B4:8 G#4:8'],
    drums: {K: 'x.....x.x.......', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.'},
    fill: {K: 'x.....x.x.......', S: '....x.......x...', T: '........x.x.....', M: '...........x.x..', L: '..............xx'}},
   B: {chords: ['C', 'G', 'Am', 'Em', 'F', 'C', 'D', 'E'], arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    lead: ['E5:4 G5:4 C6:8', 'B5:4 A5:2 G5:2 D5:8', 'C6:4 B5:2 A5:2 E5:4 A5:4', 'G5:8 B5:8',
     'A5:4 C6:4 A5:4 F5:4', 'G5:4 E5:4 C5:4 E5:4', 'F#5:4 A5:4 D6:4 C6:4', 'B5:8 G#5:4 E5:4'],
    drums: {K: 'x.....x.x.....x.', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', C: 'x...............'},
    fill: {K: 'x.....x.x.......', S: '....x.......xxxx', h: 'x.x.x.x.x.......'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'biome_tropical', title: 'Sous la canopée', mood: 'Forêts tropicales : do majeur sautillant, clave 3-3-2.', bpm: 112, gain: .27,
  bass: 'R:3 R:3 5:2 R:3 R:3 5:2', echo: .5, echoGain: .16,
  timbres: {lead: {w: 'p50', g: .2, tau: .18, sus: .4, vib: 6}, harm: {w: 'p25', g: .13, tau: .18, sus: .4}, arp: {w: 'p125', g: .16, tau: .05, sus: .2}, drums: {g: .14}},
  sections: {
   A: {chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G'],
    lead: ['E5:3 G5:3 A5:2 G5:2 E5:2 C5:4', 'A5:3 G5:3 E5:2 C5:4 A4:4', 'C5:3 D5:3 F5:2 A5:4 G5:4', 'G5:6 D5:2 B4:8',
     'E5:3 G5:3 A5:2 C6:4 A5:4', 'G5:3 E5:3 C5:2 E5:4 A5:4', 'F5:3 E5:3 D5:2 A4:4 C5:4', 'B4:3 D5:3 G5:2 -:8'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {K: 'x.....x.x.......', T: '...x..x....x..x.', r: '..x...x...x...x.', h: 'gg.gg.gg.gg.gg.g'},
    fill: {K: 'x.....x.x.......', T: '...x..x.....xxxx', h: 'gg.gg.gg.gg.....'}},
   B: {chords: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
    lead: ['A5:2 A5:1 G5:1 F5:2 C5:2 A4:4 C5:4', 'B4:2 B4:1 C5:1 D5:2 G5:2 B5:4 A5:4', 'G5:2 G5:1 A5:1 G5:2 E5:2 B4:8', 'C5:2 C5:1 D5:1 E5:2 A5:2 G5:4 E5:4',
     'F5:3 A5:3 C6:2 A5:4 F5:4', 'D6:3 B5:3 G5:2 A5:4 B5:4', 'C6:6 G5:2 E5:4 G5:4', 'C6:8 -:8'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {K: 'x.....x.x.....x.', T: '...x..x....x..x.', S: '....g.......x...', h: 'gg.gg.gg.gg.gg.g'},
    fill: {K: 'x.....x.x.......', T: '...x..x.....xxxx', S: '....g...........'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'biome_wetland', title: 'Les eaux mortes', mood: 'Marais : sol mineur trouble, basse qui rampe.', bpm: 84, gain: .23,
  bass: 'R:3 R:1 -:2 R:2 5:4 8:2 5:2', echo: .75, echoGain: .28, pad: true,
  timbres: {lead: {w: 'p50', g: .19, vib: 16, tau: .5, sus: .7}, arp: {w: 'p125', g: .13}},
  sections: {
   A: {chords: ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Gm', 'Cm', 'D'],
    lead: ['D5:6 Bb4:2 G4:8', 'A4:2 Bb4:2 C5:2 D5:2 Bb4:8', 'G5:6 F5:2 Eb5:8', 'F#5:6 E5:2 D5:8',
     'D5:6 Bb4:2 G4:4 D5:4', 'Bb4:2 C5:2 D5:2 F5:2 G5:8', 'Eb5:6 D5:2 C5:4 G4:4', 'A4:8 F#4:8'],
    arp: '0:2 -:2 2:2 -:2 1:2 -:2 2:2 -:2',
    drums: {K: 'x.........x.....', o: '........g.......', h: '..g...g...g...g.'}},
   B: {chords: ['Eb', 'Bb', 'Cm', 'Gm', 'Eb', 'Bb', 'Cm', 'D7'],
    lead: ['Bb5:8 G5:4 Eb5:4', 'F5:8 D5:4 Bb4:4', 'C5:4 Eb5:4 G5:6 F5:2', 'G5:8 D5:8',
     'Eb5:4 G5:4 Bb5:6 Ab5:2', 'F5:6 D5:2 Bb4:8', 'Eb5:4 D5:4 C5:4 Bb4:4', 'A4:6 C5:2 F#4:8'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {K: 'x.........x.....', o: '........x.......', h: '..g...g...g...g.'},
    fill: {K: 'x.........x.....', o: '........x.......', L: '............x.xx'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'biome_boreal', title: 'Taïga', mood: 'Taïga et toundra : si mineur, appels de cor dans le froid.', bpm: 88, gain: .21,
  bass: 'R:6 R:2 5:8', echo: .75, echoGain: .24, pad: true,
  timbres: {lead: {w: 'p50', g: .2, tau: .5, sus: .75, vib: 10}, harm: {w: 'p25', g: .13}},
  sections: {
   A: {chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
    lead: ['F#4:4 B4:4 D5:6 C#5:2', 'B4:4 G4:4 D5:8', 'A4:4 D5:4 F#5:6 E5:2', 'E5:8 C#5:8',
     'F#5:4 E5:2 D5:2 B4:4 D5:4', 'G5:6 F#5:2 D5:8', 'E5:4 G5:4 B5:6 A5:2', 'A#5:8 F#5:8'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {L: 'x.......x.......', h: '....g.......g...'},
    fill: {L: 'x.......x.......', M: '............x.x.', S: '............gggg'}},
   B: {chords: ['G', 'D', 'A', 'Bm', 'G', 'D', 'Em', 'F#'],
    lead: ['B5:6 A5:2 G5:4 D5:4', 'F#5:6 E5:2 D5:4 A4:4', 'C#5:4 E5:4 A5:8', 'B5:6 A5:2 F#5:8',
     'D6:6 B5:2 G5:8', 'A5:6 F#5:2 D5:8', 'G5:4 F#5:2 E5:2 B4:4 E5:4', 'C#5:8 A#4:8'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {L: 'x.......x.......', S: '....g.......x...', h: '..g...g...g...g.'},
    fill: {L: 'x.......x.......', S: '....g.......xxxx', C: '................'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'biome_polar', title: 'Glace éternelle', mood: 'Glaces : fa dièse mineur, arpèges de cristal et grands silences.', bpm: 72, gain: .28,
  bass: 'R:12 5:4', echo: .75, echoGain: .32, pad: true, arpLow: 66,
  timbres: {lead: {w: 'tri', g: .3, tau: .8, sus: .8, vib: 8}, harm: {w: 'p50', g: .09}, arp: {w: 'p125', g: .11, tau: .1}},
  sections: {
   A: {chords: ['F#m', 'A', 'F#m', 'E', 'F#m', 'Dmaj7', 'Bm', 'C#'],
    lead: ['C#5:8 A4:4 B4:4', 'C#5:12 -:4', 'A5:6 G#5:2 F#5:8', 'E5:6 F#5:2 G#5:8',
     'C#6:8 B5:4 A5:4', 'F#5:8 A5:4 C#6:4', 'D6:6 C#6:2 B5:8', 'G#5:8 F5:8'],
    arp: '0 1 2 3 2 1 0 1 2 3 2 1 0 1 2 1'},
   C: {chords: ['F#m', 'Dmaj7', 'Bm', 'C#', 'F#m', 'Dmaj7', 'Bm', 'C#'],
    harm: ['A4:16', 'F#4:16', 'D5:16', 'F5:16', 'C#5:16', 'A4:16', 'B4:8 D5:8', 'C#5:8 G#4:8'],
    arp: '0:2 2:2 1:2 3:2 0:2 2:2 1:2 3:2'}
  },
  order: ['A', 'A+harm', 'C', 'A+harm']},

 {name: 'biome_cursed', title: 'Terres maudites', mood: 'Terres maudites : do mineur, triton et cœur qui bat.', bpm: 76, gain: .19,
  bass: 'R:8 5:8', echo: .75, echoGain: .3, pad: true,
  timbres: {lead: {w: 'p125', g: .2, vib: 22, tau: .6, sus: .7}, saw: {g: .075, a: .4}},
  sections: {
   A: {chords: ['Cm', 'Ab', 'Fm', 'G7', 'Cm', 'Db', 'Bdim7', 'G'],
    lead: ['G4:4 C5:4 Eb5:6 D5:2', 'C5:6 Bb4:2 Ab4:8', 'F5:6 Eb5:2 C5:4 Ab4:4', 'B4:8 D5:4 F5:4',
     'Eb5:4 G5:4 F#5:6 G5:2', 'F5:6 Eb5:2 Db5:8', 'D5:4 F5:4 Ab5:6 G5:2', 'G5:12 -:4'],
    arp: '0:2 -:2 1:2 -:2 2:2 -:2 1:2 -:2',
    drums: {K: 'X.x.............', L: '................'},
    fill: {K: 'X.x.............', L: '........x...x.x.'}},
   B: {chords: ['Ab', 'G', 'Fm', 'G', 'Ab', 'Db', 'Bdim7', 'G'],
    lead: ['-:8 Eb5:4 C5:4', 'D5:12 -:4', '-:8 Ab5:4 F5:4', 'B4:12 -:4',
     'C6:8 Bb5:4 Ab5:4', 'F5:8 Db5:8', 'Ab5:6 F5:2 D5:4 B4:4', 'G4:16'],
    harm: ['C5:8 -:8', 'B4:8 G4:8', 'F4:8 -:8', 'D4:8 F4:8', 'Eb5:8 C5:8', 'Ab4:8 F4:8', 'F4:8 D4:8', 'B3:8 D4:8'],
    drums: {K: 'X.x.....X.x.....', h: '....g.......g...'},
    fill: {K: 'X.x.....X.x.....', L: '............xxxx'}}
  },
  order: ['A', 'B', 'A+harm', 'B']},

 {name: 'biome_travel', title: 'Sur la route', mood: 'Voyages à cheval, en charrette ou en bateau : ré majeur, pas de marche.', bpm: 120, gain: .2,
  bass: 'R:2 5:2 R:2 5:2 R:2 5:2 8:2 5:2', echo: .75, echoGain: .18,
  sections: {
   A: {chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G|A', 'D'],
    lead: ['D5:2 F#5:2 A5:4 F#5:2 A5:2 D6:4', 'C#6:4 B5:2 A5:2 E5:4 A5:4', 'B5:2 A5:2 F#5:4 D5:4 F#5:4', 'G5:6 F#5:2 G5:4 B5:4',
     'A5:4 F#5:2 D5:2 A4:4 D5:4', 'E5:2 F#5:2 G5:2 A5:2 C#5:4 E5:4', 'B5:4 G5:4 A5:4 C#6:4', 'D6:8 A5:4 F#5:4'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2',
    drums: {K: 'x.......x.......', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.'},
    fill: {K: 'x.......x.......', S: '....x.......x.xx', h: 'x.x.x.x.x.x.....'}},
   B: {chords: ['G', 'D', 'Em', 'A', 'G', 'D', 'Em|A', 'D'],
    lead: ['B4:2 D5:2 G5:4 B5:4 G5:4', 'A5:2 F#5:2 D5:4 F#5:4 A5:4', 'G5:2 E5:2 B4:4 E5:4 G5:4', 'A5:8 C#6:4 A5:4',
     'D6:4 B5:2 G5:2 B5:4 D6:4', 'A5:4 F#5:2 D5:2 F#5:4 A5:4', 'E5:4 G5:4 C#5:4 E5:4', 'D5:12 -:4'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {K: 'x.......x.x.....', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.'},
    fill: {K: 'x.......x.......', S: '....x...x.x.xxxx', C: '................'}}
  },
  order: ['A', 'A+harm', 'B', 'B+harm']},

 {name: 'combat', title: 'Le choc des colosses', mood: 'Combat contre les colosses : mi mineur, basse en octaves qui pousse.', bpm: 150, gain: .32,
  bass: 'R:2 8:2 R:2 8:2 R:2 8:2 R:2 8:2', echo: .75, echoGain: .14, pad: true, padMode: 'fifth',
  timbres: {saw: {g: .06, a: .02}},
  sections: {
   A: {chords: ['Em', 'C', 'D', 'B7', 'Em', 'C', 'Am', 'B'],
    lead: ['E5:3 E5:1 G5:2 B5:2 G5:2 A5:2 B5:4', 'C6:3 B5:1 G5:2 E5:2 G5:2 E5:2 C5:4', 'D5:3 D5:1 F#5:2 A5:2 F#5:2 G5:2 A5:4', 'B5:6 A5:2 F#5:2 D#5:2 B4:4',
     'E5:3 E5:1 G5:2 B5:2 G5:2 A5:2 B5:4', 'E6:3 D6:1 C6:2 G5:2 E5:2 G5:2 C6:4', 'A5:3 G5:1 E5:2 C5:2 A4:2 C5:2 E5:4', 'D#5:4 F#5:4 B5:8'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {K: 'x.....x.x.....x.', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.'},
    fill: {K: 'x.....x.x.......', S: '....x.......xxxx', h: 'x.x.x.x.x.......'}},
   B: {chords: ['C', 'D', 'Em', 'Em', 'C', 'D', 'B', 'B7'],
    lead: ['G5:8 E5:4 G5:4', 'A5:8 F#5:4 A5:4', 'B5:12 A5:2 G5:2', 'B5:4 G5:4 E5:4 B4:4',
     'C6:8 G5:4 C6:4', 'D6:8 C6:4 A5:4', 'B5:4 A5:4 F#5:4 D#5:4', 'B5:2 B4:2 B5:2 B4:2 D#5:2 F#5:2 A5:2 B5:2'],
    arp: '0 1 2 3 0 1 2 3 0 1 2 3 0 1 2 3',
    drums: {K: 'x.x...x.x.x...x.', S: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', C: 'x...............'},
    fill: {K: 'x.x...x.x.......', S: '....x...x.x.xxxx', T: '..............x.'}}
  },
  order: ['A', 'A+harm', 'B', 'B+harm']},

 {name: 'boss', title: 'Le Prêtre du Serpent', mood: 'Combat contre le Prêtre du Serpent : ré mineur, sixte napolitaine, doubles croches.', bpm: 168, gain: .3,
  bass: 'R:1 R:1 8:2 R:1 R:1 8:2 R:1 R:1 8:2 R:1 R:1 8:2', echo: .75, echoGain: .12, pad: true, padMode: 'fifth',
  timbres: {lead: {w: 'p25', g: .24, vib: 14}, saw: {g: .06, a: .02}},
  sections: {
   A: {chords: ['Dm', 'Dm', 'Bb', 'C7', 'Dm', 'Dm', 'Eb', 'A'],
    lead: ['D5:2 D5:2 F5:2 D5:2 A5:2 D5:2 G#5:2 A5:2', 'F5:2 E5:2 D5:2 C#5:2 D5:8', 'D5:2 D5:2 F5:2 D5:2 Bb5:2 A5:2 G5:2 F5:2', 'E5:4 G5:4 C6:4 Bb5:4',
     'A5:2 A5:2 C6:2 A5:2 D6:4 C6:2 A5:2', 'F5:2 G5:2 A5:2 F5:2 D5:8', 'G5:4 Bb5:4 Eb6:4 D6:2 Bb5:2', 'C#6:4 A5:4 E5:4 C#5:4'],
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 1',
    drums: {K: 'x.x...x.x.x...x.', S: '....x.......x...', h: 'xgxgxgxgxgxgxgxg'},
    fill: {K: 'x.x...x.x.......', S: '....x.......xxxx', C: '................'}},
   B: {chords: ['Gm', 'A', 'Dm', 'Bb', 'Gm', 'A', 'Bb', 'A7'],
    lead: ['Bb5:6 A5:2 G5:4 D5:4', 'C#6:6 B5:2 A5:4 E5:4', 'D6:6 C6:2 A5:4 F5:4', 'F5:4 G5:4 A5:4 Bb5:4',
     'D6:4 Bb5:4 G5:4 Bb5:4', 'C#6:4 E6:4 A5:8', 'D6:2 C6:2 Bb5:2 A5:2 G5:2 F5:2 E5:2 D5:2', 'C#5:4 E5:4 A5:4 C#6:4'],
    arp: '0 1 2 3 0 1 2 3 0 1 2 3 0 1 2 3',
    drums: {K: 'x.x...x.x.x...x.', S: '....x.......x...', h: 'xgxgxgxgxgxgxgxg', C: 'x...............'},
    fill: {K: 'x.x...x.x.......', S: '....x...x.x.xxxx', T: '..............x.'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'gameover', title: 'Défaite', mood: 'Écran de défaite : la mineur, lent et dépouillé.', bpm: 72, gain: .48,
  bass: 'R:8 5:8', echo: .75, echoGain: .26, pad: true,
  timbres: {lead: {w: 'p50', g: .2, tau: .6, sus: .75, vib: 10}},
  sections: {
   A: {chords: ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm|E', 'Am'],
    lead: ['E5:8 C5:4 A4:4', 'F5:8 C5:4 A4:4', 'D5:6 E5:2 F5:4 A5:4', 'G#5:8 E5:8',
     'A5:6 G5:2 E5:4 C5:4', 'C5:6 D5:2 C5:4 A4:4', 'F5:4 D5:4 B4:4 G#4:4', 'A4:12 -:4'],
    arp: '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2'}
  },
  order: ['A', 'A+harm'],
  intro: {bpm: 72, chords: ['Am', 'E'], lead: ['E5:4 D5:4 C5:4 B4:4', 'A4:16']}}
];

function buildAll() {
  const out = {};
  for (const song of SONGS) {
    const score = build(song);
    score.mood = song.mood;
    if (song.intro) {
      const intro = build({name: song.name + '-intro', bpm: song.intro.bpm, gain: song.gain, bass: 'R:16', pad: true, timbres: song.timbres,
        sections: {I: {chords: song.intro.chords, lead: song.intro.lead}}, order: ['I'], echo: song.echo, echoGain: song.echoGain});
      delete intro.programs; delete intro.title;
      score.intro = intro;
    }
    out[song.name] = score;
  }
  return out;
}

module.exports = {SONGS, buildAll, build, midiNote, chord, BASE_TIMBRES, TPB};
