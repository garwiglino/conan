// Partitions des musiques de Hearthreaver : une seule source pour le jeu et les MIDI.
// Chaque mesure est écrite sur une grille fixe (16 doubles croches, ou 12 croches de triolet
// pour les morceaux à trois temps balancés) ; le build refuse toute mesure qui ne tombe pas juste.
// Notation : « D5:4 » = ré 5 pendant 4 pas, « -:2 » = silence de 2 pas.
// Les basses, timbales, cordes, chœurs et contrechants sont dérivés des accords de chaque mesure.
// Couleur dark fantasy : modes mineurs, quintes à vide, cors, chœur grave, tambours de guerre et enclume,
// tous synthétisés par le séquenceur du jeu (ondes en paliers, triangle 4 bits, bruit LFSR).
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
// Degrés des motifs de basse et de timbales : R fondamentale, 3, 5, 7, 8 octave, -5 quinte en dessous.
function degree(deg, c, where) {
  const offset = {R: 0, '3': c.steps[1], '5': c.steps.includes(7) ? 7 : c.steps[2], '7': c.steps[3] ?? 10, '8': 12, '-5': -5}[deg];
  if (offset === undefined) throw new Error(where + ' : degré ' + deg);
  return offset;
}
const DRUM = {K: 36, S: 38, h: 42, o: 46, C: 49, r: 51, T: 45, M: 43, L: 41, B: 35, A: 80, G: 52};

function build(song) {
  const steps = song.steps || 16, step = BAR / steps, tracks = {lead: [], harm: [], arp: [], saw: [], bass: [], timpani: [], drums: []};
  const add = (track, t, len, n, v, artic = .92) => tracks[track].push(Math.round(t), Math.max(12, Math.round(len * artic)), n, Math.max(1, Math.min(127, Math.round(v))));
  // Motif en degrés (basse, timbales) : « R:4 -:4 5:8 ».
  const degrees = (track, pattern, low, t0, chordAt, where, accent, rest, artic) => {
    let s = 0;
    for (const token of pattern.trim().split(/\s+/)) {
      const [deg, len] = token.split(':'), n = Number(len ?? 1), c = chordAt(s);
      if (deg !== '-') add(track, t0 + s * step, n * step, above(low, c.root) + degree(deg, c, where), s === 0 ? accent : rest, artic);
      s += n;
    }
    if (s !== steps) throw new Error(where + ' : ' + track + ' de ' + s + ' pas');
  };
  let bar = 0;
  for (const entry of song.order) {
    const [name, ...flags] = entry.split('+'), sec = song.sections[name];
    if (!sec) throw new Error(song.name + ' : section inconnue ' + name);
    const opts = new Set(flags), count = sec.chords.length;
    for (const key of ['lead', 'harm', 'arp']) if (Array.isArray(sec[key]) && sec[key].length !== count) throw new Error(song.name + '/' + name + ' : ' + key + ' ne compte pas ' + count + ' mesures');
    for (let i = 0; i < count; i++, bar++) {
      const t0 = bar * BAR, parts = sec.chords[i].split('|').map(chord), span = steps / parts.length;
      if (!Number.isInteger(span)) throw new Error(song.name + ' : accords mal répartis mesure ' + (bar + 1));
      const chordAt = s => parts[Math.min(parts.length - 1, Math.floor(s / span))], last = i === count - 1, where = song.name + ' mesure ' + (bar + 1);
      // Mélodie principale, accent léger sur les temps forts.
      const melody = sec.lead && !opts.has('nolead') ? parseBar(sec.lead[i], steps, where) : [];
      const octave = (opts.has('up') ? 12 : opts.has('down') ? -12 : 0) + (song.leadShift || 0);
      let s = 0;
      for (const [n, len] of melody) {
        if (n !== null) add('lead', t0 + s * step, len * step, n + octave, (song.leadVel || 84) + (s === 0 ? 8 : s % (steps / 4) === 0 ? 3 : 0), song.leadArtic || .92);
        s += len;
      }
      // Contrechant : écrit à la main, ou doublure de chaque note tenue (tierce ou sixte, quinte à vide, octave).
      if (Array.isArray(sec.harm)) {
        s = 0;
        for (const [n, len] of parseBar(sec.harm[i], steps, where + ' (contrechant)')) { if (n !== null) add('harm', t0 + s * step, len * step, n, song.harmVel || 70, .9); s += len; }
      } else if (sec.harm === 'auto' || opts.has('harm')) {
        s = 0;
        for (const [n, len] of melody) {
          if (n !== null && len >= (song.harmMin || 2)) {
            const lead = n + octave, c = chordAt(s), tones = c.steps.map(x => c.root + x), tone = h => tones.some(x => pc(x) === pc(h));
            let best = null;
            if (song.harmMode === 'octave') best = lead - 12;
            else if (song.harmMode === 'fifth') best = [lead - 7, lead - 5].find(tone) ?? lead - 12;
            else for (let h = lead - 9; h <= lead - 3; h++) if (tone(h)) best = h;
            if (best !== null) add('harm', t0 + s * step, len * step, best, song.harmVel || 66, .9);
          }
          s += len;
        }
      }
      // Basse : motif en degrés de l'accord.
      const bassPattern = (last && sec.bassEnd) || sec.bass || song.bass;
      if (bassPattern && !opts.has('nobass')) degrees('bass', bassPattern, song.bassLow ?? 43, t0, chordAt, where, 100, 88, song.bassArtic || .82);
      // Timbales : même notation que la basse, une octave de ré 2 à do♯ 3 par défaut.
      const timpPattern = sec.timp ?? song.timp;
      if (timpPattern && !opts.has('notimp')) degrees('timpani', timpPattern, song.timpLow ?? 38, t0, chordAt, where, song.timpVel || 104, (song.timpVel || 104) - 18, .9);
      // Arpège ou ostinato de cordes : indices dans les notes de l'accord, ou mesures écrites note à note.
      const arpPattern = (last && sec.arpEnd) || sec.arp;
      if (Array.isArray(arpPattern) && !opts.has('noarp')) {
        s = 0;
        for (const [n, len] of parseBar(arpPattern[i], steps, where + ' (cordes)')) { if (n !== null) add('arp', t0 + s * step, len * step, n, (song.arpVel || 58) + (s % (steps / 4) === 0 ? 10 : 0), song.arpArtic || .8); s += len; }
      } else if (arpPattern && !opts.has('noarp')) {
        s = 0;
        for (const token of arpPattern.trim().split(/\s+/)) {
          const [idx, len] = token.split(':'), n = Number(len ?? 1), c = chordAt(s);
          if (idx !== '-') {
            const tones = c.steps.filter(x => x < 12).map(x => above(song.arpLow ?? 62, c.root + x)).sort((a, b) => a - b), k = Number(idx);
            add('arp', t0 + s * step, n * step, tones[k % tones.length] + 12 * Math.floor(k / tones.length), (song.arpVel || 58) + (s % (steps / 4) === 0 ? 10 : 0), song.arpArtic || .6);
          }
          s += n;
        }
        if (s !== steps) throw new Error(where + ' : arpège de ' + s + ' pas');
      }
      // Chœur : tierce et quinte, quinte à vide, ou quinte et octave, tenues ou scandées (« x:4 -:4 »).
      if ((sec.pad ?? song.pad) && !opts.has('nopad')) {
        const voices = c => { const fifth = c.steps.includes(7) ? 7 : c.steps[2]; return song.padMode === 'open' ? [0, fifth, 12] : song.padMode === 'fifth' || c.steps.length < 3 ? [0, fifth] : [c.steps[1], fifth]; };
        const rhythm = sec.padRhythm ?? song.padRhythm;
        if (rhythm) {
          s = 0;
          for (const token of rhythm.trim().split(/\s+/)) {
            const [mark, len] = token.split(':'), n = Number(len ?? 1), c = chordAt(s);
            if (mark !== '-') for (const x of voices(c)) add('saw', t0 + s * step, n * step, above(song.padLow ?? 55, c.root) + x, (song.padVel || 56) + (s === 0 ? 8 : 0), .9);
            s += n;
          }
          if (s !== steps) throw new Error(where + ' : chœur de ' + s + ' pas');
        } else parts.forEach((c, k) => {
          for (const x of voices(c)) add('saw', t0 + k * span * step, span * step, above(song.padLow ?? 55, c.root) + x, song.padVel || 56, .97);
        });
      }
      // Batterie : couloirs de 16 (ou 12) cases, « x » normal, « X » accent, « g » note fantôme.
      // K grosse caisse, S caisse claire, h/o charleston, C cymbale, T/M/L toms, B tambour de guerre, A enclume, G gong.
      const kit = (last && sec.fill) || sec.drums;
      if (kit && !opts.has('nodrums')) {
        for (const [lane, row] of Object.entries(kit)) {
          const cells = row.replace(/\s/g, '');
          if (cells.length !== steps) throw new Error(where + ' : couloir ' + lane + ' de ' + cells.length + ' cases');
          if (!DRUM[lane]) throw new Error(where + ' : couloir inconnu ' + lane);
          [...cells].forEach((c, k) => { if (c !== '.') add('drums', t0 + k * step, step, DRUM[lane], c === 'X' ? 112 : c === 'g' ? 44 : 82, .9); });
        }
      }
    }
  }
  for (const k of Object.keys(tracks)) {
    const ev = tracks[k], rows = [];
    for (let i = 0; i < ev.length; i += 4) rows.push(ev.slice(i, i + 4));
    rows.sort((a, b) => a[0] - b[0] || a[2] - b[2]);
    tracks[k] = rows.flat();
    // La mélodie reste toujours présente : l'écho du séquenceur s'y branche.
    if (!tracks[k].length && k !== 'lead') delete tracks[k];
  }
  const bars = bar, timbres = {};
  // mix : correction en dB du niveau d'une piste, mesurée par rendu hors ligne contre l'équilibre du thème titre.
  for (const k of Object.keys(tracks)) {
    const t = {...BASE_TIMBRES[k], ...(song.timbres?.[k] || {})};
    if (song.mix?.[k]) t.g = +(t.g * 10 ** (song.mix[k] / 20)).toFixed(3);
    timbres[k] = t;
  }
  const programs = {lead: 60, harm: 60, arp: 48, saw: 52, bass: 38, timpani: 47, drums: 0, ...(song.programs || {})};
  return {title: song.title, bpm: song.bpm, tpb: TPB, bars, grid: steps, dur: bars * 240 / song.bpm, style: 'chip', gain: song.gain ?? 1,
    echo: song.echo ?? .75, echoGain: song.echoGain ?? .2, tracks, timbres,
    programs: Object.fromEntries(Object.keys(tracks).map(k => [k, programs[k]]))};
}

// Voix communes, celles du thème titre assombries : cor en tête (dents de scie filtrées), cors graves
// en doublure, cordes basses en dents de scie, chœur à formants, triangle 4 bits en basse,
// timbales et batterie en bruit LFSR. Chaque morceau peut remplacer une voix (cloches, anche, cordes).
const BASE_TIMBRES = {
  lead: {kind: 'brass', g: .24, pan: -.04, a: .04, rel: .18, filter: 2000},
  harm: {kind: 'brass', g: .22, pan: .24, a: .06, rel: .2, filter: 1300},
  arp: {w: 'saw', g: .08, pan: -.34, a: .008, tau: .14, sus: .45, rel: .06, filter: 1700},
  saw: {kind: 'choir', g: .4, pan: 0, a: .3, rel: .5},
  bass: {w: 'tri', g: .12, pan: 0, a: .004, flat: true, rel: .03},
  timpani: {kind: 'timpani', g: .3, pan: -.1, a: .003, rel: .2},
  drums: {g: .24, pan: .06}
};
const HARP = {w: 'p50', g: .07, pan: -.3, a: .002, tau: .25, sus: .15, rel: .3, filter: 1400};
// Ambiance : chœur qui enfle et retombe sur chaque mesure, basse en bourdon, cors lointains et feutrés.
const AMBIENT = {
  lead: {kind: 'brass', g: .2, a: .3, rel: .8, filter: 1200},
  harm: {kind: 'brass', g: .12, a: .8, rel: 1.2, filter: 800},
  saw: {kind: 'choir', g: .4, a: 1.6, rel: 1.8},
  bass: {w: 'tri', g: .075, a: .6, flat: true, rel: 1},
  timpani: {kind: 'timpani', g: .2},
  drums: {g: .16}
};
const ambient = over => Object.fromEntries([...new Set([...Object.keys(AMBIENT), ...Object.keys(over)])].map(k => [k, {...AMBIENT[k], ...over[k]}]));

// gain : niveau calibré par rendu hors ligne (médiane sur 400 ms), au volume musique par défaut de 45 % :
// ambiances d'exploration vers -55 dB et voyage -54 dB, sous le thème titre (-48,8 dB) ;
// combat et boss -43,3 dB, défaite -41 dB.
const SONGS = [
 // Exploration et voyage : des ambiances, pas des thèmes. Bourdon de basse, chœur qui respire d'une mesure
 // à l'autre, quelques gouttes de harpe ou de cloche, un tambour lointain, parfois un appel de deux notes.
 // Les thèmes mélodiques sont réservés au combat, au boss et à la défaite.
 {name: 'biome_forest', title: 'Sous les chênes noirs', mood: 'Forêts : ré éolien, chœur qui respire, gouttes de lyre et tambour lointain.', bpm: 52, gain: .45,
  bass: 'R:16', bassLow: 38, pad: true, padMode: 'fifth', padLow: 50, arpLow: 57, echo: 1, echoGain: .2,
  timbres: ambient({arp: HARP}), programs: {arp: 46},
  sections: {
   A: {chords: ['Dm', 'Dm', 'Bb', 'Bb', 'Dm', 'Dm', 'C', 'C'], arp: '-:6 2:2 -:4 1:4',
    lead: ['-:16', '-:16', '-:16', '-:16', '-:8 A3:4 D4:4', '-:16', '-:16', '-:16'],
    drums: {L: 'g...............'}},
   B: {chords: ['Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'Bb', 'A', 'A'], arp: '-:4 0:2 -:6 2:4',
    harm: ['G2:16', '-:16', 'D3:16', '-:16', 'Bb2:16', '-:16', 'A2:16', '-:16'],
    drums: {L: 'g...............'},
    fill: {L: 'g.......g.......'}}
  },
  order: ['A', 'B']},

 {name: 'biome_coast', title: 'Brumes de la côte', mood: 'Côtes : do mineur, houle du chœur, harpe qui roule et ressac sourd.', bpm: 46, gain: .45,
  bass: 'R:16', bassLow: 36, pad: true, padMode: 'fifth', padLow: 48, arpLow: 55, echo: 1, echoGain: .2,
  timbres: ambient({arp: HARP}), programs: {arp: 46},
  sections: {
   A: {chords: ['Cm', 'Cm', 'Ab', 'Ab', 'Bb', 'Bb', 'Cm', 'Cm'], arp: '-:8 0:2 1:2 2:4',
    drums: {B: 'g...............'}},
   B: {chords: ['Fm', 'Fm', 'Cm', 'Cm', 'Ab', 'Ab', 'G', 'G'], arp: '-:8 0:2 1:2 2:4',
    harm: ['C3:16', '-:16', 'C3:16', '-:16', 'Ab2:16', '-:16', 'G2:16', '-:16'],
    drums: {B: 'g...............'},
    fill: {B: 'g.......g.......'}}
  },
  order: ['A', 'B']},

 {name: 'biome_desert', title: 'Sables de Sarak', mood: 'Déserts : bourdon de mi phrygien majeur, chœur en quintes, anche lointaine et darbouka feutrée.', bpm: 50, gain: .46,
  bass: 'R:16', bassLow: 40, pad: true, padMode: 'fifth', padLow: 52, arpLow: 64, echo: 1, echoGain: .22,
  timbres: ambient({lead: {w: 'p25', g: .1, pan: -.04, a: .05, tau: .5, sus: .7, rel: .3, vib: 22, filter: 2000}, arp: {...HARP, filter: 1500}}),
  programs: {lead: 111, arp: 105},
  sections: {
   A: {chords: ['E', 'E', 'F', 'E', 'E', 'E', 'Dm', 'E'], arp: '-:8 0:2 -:6',
    lead: ['-:16', '-:16', '-:16', '-:8 F4:2 E4:6', '-:16', '-:16', '-:16', '-:16'],
    drums: {T: 'g.........g.....'}},
   B: {chords: ['Am', 'Am', 'E', 'E', 'F', 'F', 'E', 'E'], arp: '-:4 0:2 -:10',
    lead: ['-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:8 G#4:2 A4:2 G#4:4', '-:16'],
    drums: {T: 'g.........g.....', L: 'g...............'}}
  },
  order: ['A', 'B']},

 {name: 'biome_steppe', title: 'Le vent des steppes', mood: 'Steppes : la éolien, chœur en quintes ouvertes comme un vent, cordes graves et appel de cor.', bpm: 54, gain: .37,
  bass: 'R:16', bassLow: 40, pad: true, padMode: 'open', padLow: 50, arpLow: 45, echo: 1, echoGain: .2,
  timbres: ambient({arp: {w: 'saw', g: .05, pan: -.3, a: .8, tau: 2, sus: .9, rel: 1.2, filter: 900}}),
  sections: {
   A: {chords: ['Am', 'Am', 'Am', 'Am', 'F', 'F', 'G', 'G'], arp: '0:16',
    lead: ['-:16', '-:16', '-:16', '-:8 E4:4 A4:4', '-:16', '-:16', '-:16', '-:16'],
    drums: {B: 'g...............'}},
   B: {chords: ['Dm', 'Dm', 'Am', 'Am', 'F', 'F', 'E', 'E'], arp: '0:16',
    lead: ['-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:8 B3:4 E4:4'],
    drums: {B: 'g...............'},
    fill: {B: 'g.......g.......'}}
  },
  order: ['A', 'B']},

 {name: 'biome_tropical', title: 'Les jungles de Kush', mood: 'Jungles : bourdon de fa dièse phrygien, tambours feutrés en 3-3-2 et gouttes de marimba.', bpm: 60, gain: .48,
  bass: 'R:16', bassLow: 42, pad: true, padMode: 'fifth', padLow: 49, arpLow: 61, echo: 1, echoGain: .18,
  timbres: ambient({arp: {...HARP, tau: .07, sus: .05, rel: .08, filter: 1600}}), programs: {arp: 12},
  sections: {
   A: {chords: ['F#m', 'F#m', 'G', 'F#m', 'F#m', 'F#m', 'E', 'F#m'], arp: '-:6 0:2 -:2 2:2 -:4',
    drums: {T: 'g..g..g.........', B: 'g...............'}},
   B: {chords: ['Bm', 'Bm', 'F#m', 'F#m', 'G', 'G', 'F#m', 'F#m'], arp: '-:2 1:2 -:8 0:2 -:2',
    drums: {T: 'g..g..g.........', L: '........g.....g.'}}
  },
  order: ['A', 'B']},

 {name: 'biome_wetland', title: 'Les eaux mortes', mood: 'Marais : sol mineur, chœur trouble, basse qui descend et gouttes d\'eau.', bpm: 44, gain: .5,
  bass: 'R:16', bassLow: 43, pad: true, padMode: 'fifth', padLow: 50, arpLow: 67, echo: 1, echoGain: .26,
  timbres: ambient({arp: {w: 'p125', g: .04, pan: -.3, a: .002, tau: .1, sus: .1, rel: .25, filter: 3000}}), programs: {arp: 46},
  sections: {
   A: {chords: ['Gm', 'Gm', 'Eb', 'Eb', 'Cm', 'Cm', 'D', 'D'], arp: '-:10 2:2 -:4',
    fill: {L: 'g...............'}},
   B: {chords: ['Gm', 'Gm', 'F', 'F', 'Eb', 'Eb', 'D', 'D'], arp: '-:4 1:2 -:10',
    fill: {L: 'g.......g.......'}}
  },
  order: ['A', 'B']},

 {name: 'biome_boreal', title: 'Les terres du Nord', mood: 'Taïga et toundra : si mineur, quintes ouvertes, cors lointains et timbale comme un orage.', bpm: 50, gain: .39,
  bass: 'R:16', bassLow: 40, pad: true, padMode: 'open', padLow: 47, timpVel: 64, echo: 1, echoGain: .2,
  timbres: ambient({}),
  sections: {
   A: {chords: ['Bm', 'Bm', 'G', 'G', 'Bm', 'Bm', 'A', 'A'],
    lead: ['-:16', '-:16', '-:16', '-:8 F#3:4 B3:4', '-:16', '-:16', '-:16', '-:16'],
    harm: ['-:16', '-:16', '-:16', '-:16', 'B2:16', '-:16', 'A2:16', '-:16']},
   B: {chords: ['Em', 'Em', 'Bm', 'Bm', 'G', 'G', 'F#', 'F#'], timp: 'R:16',
    lead: ['-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:8 C#4:4 F#3:4'],
    fill: {B: 'g...............'}}
  },
  order: ['A', 'B']},

 {name: 'biome_polar', title: 'Glace éternelle', mood: 'Glaces : do dièse mineur, chœur comme un vent, une cloche de glace de loin en loin.', bpm: 44, gain: .44,
  bass: 'R:16', bassLow: 37, pad: true, padMode: 'fifth', padLow: 56, arpLow: 73, echo: 1, echoGain: .3,
  timbres: ambient({lead: {kind: 'bell', g: .2, pan: .1}, arp: {w: 'p125', g: .025, pan: -.3, a: .002, tau: .08, sus: .1, rel: .3}}),
  programs: {lead: 14, arp: 9},
  sections: {
   A: {chords: ['C#m', 'C#m', 'A', 'A', 'F#m', 'F#m', 'G#', 'G#'], arp: '-:12 2:4',
    lead: ['G#5:16', '-:16', 'E5:16', '-:16', 'C#5:16', '-:16', 'D#5:16', '-:16']},
   B: {chords: ['C#m', 'C#m', 'B', 'B', 'A', 'A', 'G#', 'G#'], arp: '-:4 1:4 -:8',
    lead: ['-:16', 'E5:16', '-:16', 'D#5:16', '-:16', 'C#5:16', '-:16', 'C6:16']}
  },
  order: ['A', 'B']},

 {name: 'biome_cursed', title: 'Terres maudites', mood: 'Terres maudites : do mineur, cœur qui bat, glas lointain et soupir qui tremble.', bpm: 48, gain: .48,
  bass: 'R:16', bassLow: 36, pad: true, padMode: 'fifth', padLow: 48, echo: 1, echoGain: .26,
  timbres: ambient({lead: {w: 'p125', g: .1, pan: -.04, a: .3, tau: .8, sus: .8, rel: .6, vib: 24, filter: 2200}, arp: {kind: 'bell', g: .1, pan: -.2}}),
  programs: {lead: 82, arp: 14},
  sections: {
   A: {chords: ['Cm', 'Cm', 'Db', 'Cm', 'Cm', 'Cm', 'Bdim7', 'G'],
    arp: ['C3:16', '-:16', 'C3:16', '-:16', 'C3:16', '-:16', 'B2:16', '-:16'],
    lead: ['-:16', '-:16', '-:16', '-:4 G4:6 Ab4:6', '-:16', '-:16', '-:16', '-:16'],
    drums: {K: 'g.g.............'}},
   B: {chords: ['Ab', 'Ab', 'Fm', 'Fm', 'Db', 'Db', 'G', 'G'],
    arp: ['C3:16', '-:16', 'C3:16', '-:16', 'Db3:16', '-:16', 'B2:16', '-:16'],
    lead: ['-:16', '-:16', '-:16', '-:16', '-:16', '-:16', '-:4 D4:6 Eb4:6', '-:16'],
    drums: {K: 'g.g.............'}}
  },
  order: ['A', 'B']},

 {name: 'biome_travel', title: 'Sur la route', mood: 'Voyages : ré dorien, pas régulier de la basse, tambour sourd, chœur et cordes en fond.', bpm: 60, gain: .42,
  bass: 'R:4 R:4 R:4 R:4', bassLow: 38, bassArtic: .6, pad: true, padMode: 'open', padLow: 50, arpLow: 50, echo: 1, echoGain: .18,
  timbres: ambient({bass: {a: .08, rel: .3}, arp: {w: 'saw', g: .04, pan: -.3, a: .3, tau: 1.2, sus: .8, rel: .6, filter: 1000}}),
  sections: {
   A: {chords: ['Dm', 'Dm', 'C', 'C', 'Bb', 'Bb', 'C', 'C'], arp: '0:8 1:8',
    drums: {B: 'g.......g.......'}},
   B: {chords: ['Dm', 'Dm', 'G', 'G', 'Bb', 'Bb', 'A', 'A'], arp: '0:8 2:8',
    drums: {B: 'g.......g.......'},
    fill: {B: 'g.......g...g...'}}
  },
  order: ['A', 'B']},

 {name: 'combat', title: 'Le choc des colosses', mood: 'Combat contre les colosses : mi phrygien, ostinato de cordes, cuivres, chœur scandé et tambours de guerre.', bpm: 138, gain: .73,
  bass: 'R:2 8:2 R:2 8:2 R:2 8:2 R:2 8:2', bassLow: 40, pad: true, padMode: 'fifth', padLow: 52, harmMode: 'fifth', arpLow: 45, echo: .75, echoGain: .12,
  timbres: {saw: {a: .08, rel: .25}},
  sections: {
   A: {chords: ['Em', 'F', 'Em', 'Dm', 'Em', 'F', 'G', 'F'], timp: 'R:8 5:8',
    lead: ['E4:6 B3:2 E4:4 G4:4', 'F4:6 C4:2 F4:4 A4:4', 'B4:6 A4:2 G4:4 E4:4', 'F4:6 E4:2 D4:8',
     'E4:6 B3:2 E4:4 G4:4', 'A4:6 G4:2 F4:4 C5:4', 'D5:6 B4:2 G4:4 D5:4', 'C5:4 A4:4 F4:8'],
    arp: ['E3:2 E3:2 E3:2 F3:2 E3:2 E3:2 G3:2 F3:2', 'F3:2 F3:2 F3:2 G3:2 F3:2 F3:2 A3:2 G3:2', 'E3:2 E3:2 E3:2 F3:2 E3:2 E3:2 G3:2 F3:2', 'D3:2 D3:2 D3:2 E3:2 D3:2 D3:2 F3:2 E3:2',
     'E3:2 E3:2 E3:2 F3:2 E3:2 E3:2 G3:2 F3:2', 'F3:2 F3:2 F3:2 G3:2 F3:2 F3:2 A3:2 G3:2', 'G3:2 G3:2 G3:2 A3:2 G3:2 G3:2 B3:2 A3:2', 'F3:2 F3:2 F3:2 G3:2 F3:2 F3:2 A3:2 G3:2'],
    drums: {K: 'x.....x.x.....x.', S: '....x.......x...', B: 'x...............'},
    fill: {K: 'x.....x.x.......', S: '....x.......xxxx', L: '........x.x.....'}},
   B: {chords: ['Am', 'G', 'F', 'Em', 'Am', 'G', 'F', 'E'], timp: 'R:2 R:2 -:4 R:2 R:2 -:4', padRhythm: 'x:4 x:4 x:4 x:4',
    lead: ['A4:4 C5:4 E5:8', 'D5:4 B4:4 G4:8', 'C5:4 A4:4 F4:4 A4:4', 'B4:8 G4:4 E4:4',
     'E5:6 D5:2 C5:4 A4:4', 'D5:6 C5:2 B4:4 G4:4', 'A4:4 C5:4 F5:6 E5:2', 'E5:4 B4:4 G#4:8'],
    arp: '0:2 0:2 1:2 0:2 2:2 0:2 1:2 0:2',
    drums: {K: 'x.x...x.x.x...x.', S: '....x.......x...', B: 'x.......x.......', A: '............x...'},
    fill: {K: 'x.x...x.x.......', S: '....x...x.x.xxxx', C: 'x...............'}}
  },
  order: ['A', 'A+harm', 'B', 'B+harm']},

 {name: 'boss', title: 'Le Prêtre du Serpent', mood: 'Combat contre le Prêtre du Serpent : do phrygien, motif qui ondule, chœur de culte, timbales et gong.', bpm: 150, gain: .71,
  bass: 'R:1 R:1 8:2 R:1 R:1 8:2 R:1 R:1 8:2 R:1 R:1 8:2', bassLow: 36, pad: true, padMode: 'fifth', padLow: 48, harmMode: 'fifth', arpLow: 55, echo: .75, echoGain: .12,
  timbres: {saw: {a: .08, rel: .25}},
  sections: {
   A: {chords: ['Cm', 'Db', 'Cm', 'Bb', 'Cm', 'Db', 'Ab', 'G7'], timp: 'R:4 -:4 R:4 -:4',
    lead: ['C4:4 Db4:2 C4:2 B3:4 C4:4', 'Ab4:6 G4:2 F4:4 Db4:4', 'Eb4:4 F4:2 Eb4:2 D4:4 Eb4:2 G4:2', 'F4:6 D4:2 Bb3:8',
     'G4:4 Ab4:2 G4:2 F#4:4 G4:4', 'Db5:6 C5:2 Ab4:4 F4:4', 'Eb5:6 C5:2 Ab4:4 Eb4:4', 'B3:4 D4:4 F4:4 Ab4:4'],
    arp: ['C4:2 C4:2 Db4:2 C4:2 B3:2 C4:2 Eb4:2 Db4:2', 'Db4:2 Db4:2 Eb4:2 Db4:2 C4:2 Db4:2 F4:2 Eb4:2', 'C4:2 C4:2 Db4:2 C4:2 B3:2 C4:2 Eb4:2 Db4:2', 'Bb3:2 Bb3:2 C4:2 Bb3:2 A3:2 Bb3:2 D4:2 C4:2',
     'C4:2 C4:2 Db4:2 C4:2 B3:2 C4:2 Eb4:2 Db4:2', 'Db4:2 Db4:2 Eb4:2 Db4:2 C4:2 Db4:2 F4:2 Eb4:2', 'Ab3:2 Ab3:2 Bb3:2 Ab3:2 G3:2 Ab3:2 C4:2 Bb3:2', 'G3:2 G3:2 Ab3:2 G3:2 F#3:2 G3:2 B3:2 Ab3:2'],
    drums: {K: 'x.....x.x.....x.', S: '....x.......x...', B: 'x.......x.......'},
    fill: {K: 'x.....x.x.......', T: '........x.x.....', M: '.........x.x....', L: '............xxxx'}},
   B: {chords: ['Fm', 'Cm', 'Db', 'G', 'Fm', 'Cm', 'Db', 'G7'], timp: 'R:2 R:2 R:4 R:2 R:2 R:4', padRhythm: 'x:2 -:2 x:2 -:2 x:4 x:4',
    lead: ['F4:3 F4:1 Ab4:4 C5:8', 'Eb5:6 D5:2 C5:8', 'Db5:4 C5:2 Ab4:2 F4:8', 'G4:3 G4:1 B4:4 D5:8',
     'F5:6 Eb5:2 C5:4 Ab4:4', 'G4:4 C5:4 Eb5:8', 'F5:4 Eb5:2 Db5:2 Ab4:8', 'B4:4 D5:4 F5:4 Ab5:4'],
    arp: '0:2 0:2 1:2 0:2 2:2 0:2 1:2 0:2',
    drums: {K: 'x.x...x.x.x...x.', S: '....x.......x...', B: 'x.......x.......', A: '.......x.......x'},
    fill: {K: 'x.x...x.x.......', S: '....x...x.x.xxxx', G: 'x...............'}}
  },
  order: ['A', 'B', 'A+harm', 'B+harm']},

 {name: 'gameover', title: 'Défaite', mood: 'Écran de défaite : la mineur, lent, cor grave, chœur funèbre et timbale à chaque mesure.', bpm: 60, gain: 1.2,
  bass: 'R:8 5:8', bassLow: 40, pad: true, padLow: 50, timp: 'R:16', echo: 1.5, echoGain: .22,
  sections: {
   A: {chords: ['Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm|E', 'Am'],
    lead: ['E4:8 C4:4 A3:4', 'F4:8 C4:4 A3:4', 'D4:6 E4:2 F4:4 A4:4', 'G#4:8 E4:8',
     'A4:6 G4:2 E4:4 C4:4', 'C4:6 D4:2 C4:4 A3:4', 'F4:4 D4:4 B3:4 G#3:4', 'A3:12 -:4'],
    fill: {G: 'x...............'}}
  },
  order: ['A', 'A+harm'],
  intro: {bpm: 60, chords: ['Am', 'E'], lead: ['E4:4 D4:4 C4:4 B3:4', 'A3:16'], drums: {G: 'x...............'}}}
];

function buildAll() {
  const out = {};
  for (const song of SONGS) {
    const score = build(song);
    score.mood = song.mood;
    if (song.intro) {
      const intro = build({...song, name: song.name + '-intro', bpm: song.intro.bpm, bass: 'R:16',
        sections: {I: {chords: song.intro.chords, lead: song.intro.lead, drums: song.intro.drums}}, order: ['I']});
      delete intro.programs; delete intro.title;
      score.intro = intro;
    }
    out[song.name] = score;
  }
  return out;
}

module.exports = {SONGS, buildAll, build, midiNote, chord, BASE_TIMBRES, TPB};
