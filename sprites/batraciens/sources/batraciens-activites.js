/**
 * Hearthreaver — activités des batraciens, v3.
 * Pixel art procédural éditable, dérivé des GRILLES VALIDÉES v2 (pas des planches IA).
 * Le moteur ne dessine que des pixels entiers ; aucun bitmap tourné, redimensionné ou retourné.
 * Cadre 80×80, ancre (40,52) ; variante 48×48 par translation (-16,-16), sans mise à l'échelle.
 * © Fichiers créés pour ce projet. Aucun chargement d'image, bibliothèque ou service requis.
 */
(function(root,factory){
 'use strict';
 if(typeof module==='object' && module.exports)module.exports=factory(require('../base/batracien-v2.js'),require('../base/batracienne-v2.js'));
 else root.HearthreaverBatraciens=factory(root.HearthreaverBatracien,root.HearthreaverBatracienne);
})(typeof globalThis!=='undefined'?globalThis:this,function(MaleBase,FemaleBase){
 'use strict';
 if(!MaleBase||!FemaleBase)throw new Error('Charger les deux bases v2 avant le moteur d’activités.');
 const VERSION='3.0.0';
 const ANCHOR=Object.freeze({x:40,y:52}),NATIVE_ANCHOR=Object.freeze({x:24,y:36});
 const DIR=Object.freeze({NORTH:0,EAST:1,SOUTH:2,WEST:3});
 const DIRECTIONS=Object.freeze(['dos','droite','face','gauche']);
 const SHEET_DIRECTIONS=Object.freeze(['face','droite','dos','gauche']);
 function freeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.values(o).forEach(freeze);Object.freeze(o);}return o;}
 const CLIPS=freeze({
  "idle": {
    "label": "Repos",
    "group": "commun",
    "frames": 8,
    "durations": [
      1300,
      220,
      380,
      320,
      650,
      100,
      130,
      1200
    ],
    "loop": true,
    "stride": null,
    "duration": 4300,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "walk": {
    "label": "Marche",
    "group": "commun",
    "frames": 8,
    "durations": [
      63,
      62,
      63,
      62,
      63,
      62,
      63,
      62
    ],
    "loop": true,
    "stride": 18,
    "duration": 500,
    "rootMotion": "none",
    "groundLocked": false,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "talk": {
    "label": "Parler",
    "group": "social",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": []
  },
  "carry_idle": {
    "label": "Tenir une caisse à l’arrêt",
    "group": "manutention",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "carry": {
    "label": "Porter une caisse",
    "group": "manutention",
    "frames": 8,
    "durations": [
      100,
      100,
      100,
      100,
      100,
      100,
      100,
      100
    ],
    "loop": true,
    "stride": 18,
    "duration": 800,
    "rootMotion": "none",
    "groundLocked": false,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "load": {
    "label": "Soulever une caisse",
    "group": "manutention",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": false,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "grasp",
        "frame": 4,
        "atMs": 600
      },
      {
        "name": "carried",
        "frame": 7,
        "atMs": 1050
      }
    ]
  },
  "unload": {
    "label": "Déposer une caisse",
    "group": "manutention",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": false,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "release",
        "frame": 4,
        "atMs": 600
      },
      {
        "name": "placed",
        "frame": 7,
        "atMs": 1050
      }
    ]
  },
  "sit_down": {
    "label": "S’asseoir",
    "group": "social",
    "frames": 8,
    "durations": [
      110,
      100,
      100,
      100,
      120,
      120,
      140,
      160
    ],
    "loop": false,
    "stride": null,
    "duration": 950,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "seated",
        "frame": 7,
        "atMs": 790
      }
    ]
  },
  "seated": {
    "label": "Repos assis",
    "group": "social",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "stand_up": {
    "label": "Se relever",
    "group": "social",
    "frames": 8,
    "durations": [
      160,
      140,
      120,
      120,
      100,
      100,
      100,
      110
    ],
    "loop": false,
    "stride": null,
    "duration": 950,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "standing",
        "frame": 7,
        "atMs": 840
      }
    ]
  },
  "startle": {
    "label": "Sursaut",
    "group": "reaction",
    "frames": 6,
    "durations": [
      90,
      75,
      85,
      110,
      140,
      220
    ],
    "loop": false,
    "stride": null,
    "duration": 720,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 3
      },
      {
        "name": "recovery",
        "from": 4,
        "to": 5
      }
    ],
    "markers": []
  },
  "flee": {
    "label": "Fuir",
    "group": "reaction",
    "frames": 8,
    "durations": [
      45,
      45,
      45,
      45,
      45,
      45,
      45,
      45
    ],
    "loop": true,
    "stride": 22,
    "duration": 360,
    "rootMotion": "none",
    "groundLocked": false,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "cower_enter": {
    "label": "Se recroqueviller",
    "group": "reaction",
    "frames": 6,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": false,
    "stride": null,
    "duration": 900,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 3
      },
      {
        "name": "recovery",
        "from": 4,
        "to": 5
      }
    ],
    "markers": []
  },
  "cower_exit": {
    "label": "Sortir de l’abri des bras",
    "group": "reaction",
    "frames": 6,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": false,
    "stride": null,
    "duration": 900,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 3
      },
      {
        "name": "recovery",
        "from": 4,
        "to": 5
      }
    ],
    "markers": []
  },
  "cower": {
    "label": "Se protéger",
    "group": "reaction",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": []
  },
  "hit": {
    "label": "Coup reçu",
    "group": "reaction",
    "frames": 6,
    "durations": [
      55,
      70,
      80,
      100,
      130,
      200
    ],
    "loop": false,
    "stride": null,
    "duration": 635,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 3
      },
      {
        "name": "recovery",
        "from": 4,
        "to": 5
      }
    ],
    "markers": []
  },
  "death": {
    "label": "Chute / mort",
    "group": "reaction",
    "frames": 12,
    "durations": [
      100,
      100,
      110,
      110,
      110,
      120,
      120,
      140,
      140,
      160,
      190,
      300
    ],
    "loop": false,
    "stride": null,
    "duration": 1700,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 2
      },
      {
        "name": "action",
        "from": 3,
        "to": 8
      },
      {
        "name": "recovery",
        "from": 9,
        "to": 11
      }
    ],
    "markers": [
      {
        "name": "ground_contact",
        "frame": 9,
        "atMs": 1050
      }
    ]
  },
  "fish_cast": {
    "label": "Lancer la ligne",
    "group": "peche",
    "frames": 8,
    "durations": [
      150,
      110,
      100,
      80,
      100,
      120,
      160,
      230
    ],
    "loop": false,
    "stride": null,
    "duration": 1050,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "cast",
        "frame": 4,
        "atMs": 440
      }
    ]
  },
  "fish_wait": {
    "label": "Attendre une touche",
    "group": "peche",
    "frames": 8,
    "durations": [
      550,
      450,
      500,
      500,
      550,
      450,
      500,
      500
    ],
    "loop": true,
    "stride": null,
    "duration": 4000,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  },
  "fish_reel": {
    "label": "Ramener la prise",
    "group": "peche",
    "frames": 10,
    "durations": [
      200,
      140,
      140,
      120,
      140,
      170,
      180,
      170,
      170,
      270
    ],
    "loop": false,
    "stride": null,
    "duration": 1700,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": true,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 6
      },
      {
        "name": "recovery",
        "from": 7,
        "to": 9
      }
    ],
    "markers": [
      {
        "name": "retrieve",
        "frame": 5,
        "atMs": 740
      }
    ]
  },
  "fish_spear": {
    "label": "Pêcher au harpon",
    "group": "peche",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "fishing_attempt",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "net": {
    "label": "Réparer un filet",
    "group": "peche",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "knot",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "punt": {
    "label": "Pousser à la perche",
    "group": "navigation",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "pole_planted",
        "frame": 2,
        "atMs": 300
      },
      {
        "name": "pole_lifted",
        "frame": 6,
        "atMs": 900
      }
    ]
  },
  "rice": {
    "label": "Repiquer le riz",
    "group": "agriculture",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "plant",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "harvest": {
    "label": "Couper les roseaux / récolter",
    "group": "agriculture",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "cut",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "weave": {
    "label": "Tresser un panier",
    "group": "artisanat",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "weave_pass",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "rope": {
    "label": "Lover un cordage",
    "group": "navigation",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "coil",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "hoe": {
    "label": "Travailler la terre",
    "group": "agriculture",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "ground_contact",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "sow": {
    "label": "Semer",
    "group": "agriculture",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "scatter",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "gather": {
    "label": "Cueillir des plantes",
    "group": "agriculture",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "gather",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "craft": {
    "label": "Travailler à l’établi",
    "group": "artisanat",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "tool_contact",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "pottery": {
    "label": "Façonner une poterie",
    "group": "artisanat",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "shape",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "stir": {
    "label": "Remuer une préparation",
    "group": "artisanat",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "stir",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "ledger": {
    "label": "Consulter / écrire un registre",
    "group": "commerce",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "write",
        "frame": 5,
        "atMs": 750
      }
    ]
  },
  "eat": {
    "label": "Manger",
    "group": "quotidien",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "bite",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "drink": {
    "label": "Boire",
    "group": "quotidien",
    "frames": 8,
    "durations": [
      150,
      150,
      150,
      150,
      150,
      150,
      150,
      150
    ],
    "loop": true,
    "stride": null,
    "duration": 1200,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "preparation",
        "from": 0,
        "to": 1
      },
      {
        "name": "action",
        "from": 2,
        "to": 5
      },
      {
        "name": "recovery",
        "from": 6,
        "to": 7
      }
    ],
    "markers": [
      {
        "name": "sip",
        "frame": 4,
        "atMs": 600
      }
    ]
  },
  "sleep": {
    "label": "Dormir",
    "group": "quotidien",
    "frames": 8,
    "durations": [
      700,
      400,
      500,
      600,
      700,
      400,
      500,
      600
    ],
    "loop": true,
    "stride": null,
    "duration": 4400,
    "rootMotion": "none",
    "groundLocked": true,
    "terminal": false,
    "phases": [
      {
        "name": "loop",
        "from": 0,
        "to": 7
      }
    ],
    "markers": []
  }
});
 const COLOR_VARIANTS=freeze({
  "male": {
    "jade": {
      "label": "Jade",
      "palette": {
        "s": "#3f6156",
        "g": "#58897a",
        "l": "#79af9a",
        "h": "#9fd2ba",
        "d": "#afa36e",
        "b": "#d8ca8f",
        "c": "#eee4ae"
      }
    },
    "turquoise_sombre": {
      "label": "Turquoise sombre",
      "palette": {
        "s": "#31535a",
        "g": "#46717b",
        "l": "#628f9c",
        "h": "#87b2bf",
        "d": "#a2a07a",
        "b": "#cbc79e",
        "c": "#e4dec0"
      }
    },
    "ocre_mousse": {
      "label": "Ocre mousse",
      "palette": {
        "s": "#66623a",
        "g": "#8b854d",
        "l": "#afa965",
        "h": "#d0ca81",
        "d": "#baa06a",
        "b": "#dfc187",
        "c": "#f0db9e"
      }
    },
    "ardoise": {
      "label": "Ardoise",
      "palette": {
        "s": "#4d5555",
        "g": "#697272",
        "l": "#8b9593",
        "h": "#b1bab4",
        "d": "#ab9f84",
        "b": "#d0c4a8",
        "c": "#e7dfc8"
      }
    }
  },
  "female": {
    "rose_mauve": {
      "label": "Rose mauve",
      "palette": {
        "s": "#5f4a60",
        "g": "#816181",
        "l": "#a27aa2",
        "h": "#c599c4",
        "d": "#c39a9d",
        "b": "#dfb8be",
        "c": "#f3d8df"
      }
    },
    "lilas": {
      "label": "Lilas",
      "palette": {
        "s": "#58556e",
        "g": "#767396",
        "l": "#9a96bf",
        "h": "#c0bbe2",
        "d": "#c2b2c7",
        "b": "#ddd0e0",
        "c": "#efe6f0"
      }
    },
    "prune_rose": {
      "label": "Prune rosée",
      "palette": {
        "s": "#654252",
        "g": "#87576d",
        "l": "#ad7489",
        "h": "#d19ab0",
        "d": "#c79a99",
        "b": "#e1b7b6",
        "c": "#f2d7d3"
      }
    },
    "corail_doux": {
      "label": "Corail doux",
      "palette": {
        "s": "#71524f",
        "g": "#956865",
        "l": "#bd8783",
        "h": "#dcaba7",
        "d": "#cea399",
        "b": "#e5c1b8",
        "c": "#f5dfd7"
      }
    }
  }
});
 const BASES=Object.freeze({male:MaleBase,female:FemaleBase});
 const ALIASES=freeze({seated_idle:'seated',frightened_flight:'flee',repair_net:'net',punt_boat_or_push_pole:'punt',
  tend_or_transplant_rice:'rice',harvest_reeds_or_rice:'harvest',weave_reeds_or_basket:'weave',
  fish_spear_or_rod:'fish_cast',coil_rope_or_load_bundles:'rope',lift:'load',put_down:'unload'});
 const LAYERS=Object.freeze(['scene_back','tools_back','body','tools_front','hands','effects','scene_front']);
 const ACTOR_LAYERS=Object.freeze(['tools_back','body','tools_front','hands','effects']);
 // Les couleurs d’accessoires ne passent JAMAIS par le remplacement des palettes de peau.
 const TOOL_COLORS=freeze({O:'#100e20',wood0:'#50342f',wood1:'#754b37',wood2:'#a16a44',wood3:'#cf955f',
  metal0:'#354953',metal1:'#708b91',metal2:'#c3ced1',metal3:'#f0eedc',rope0:'#795445',rope1:'#b9a16b',rope2:'#e1c58a',
  leaf0:'#294c39',leaf1:'#526d3d',leaf2:'#96a469',leaf3:'#bac38b',water0:'#24453e',water1:'#46717b',water2:'#87b2bf',water3:'#e1eee1',
  clay0:'#754b37',clay1:'#b47759',clay2:'#d8a280',paper0:'#a18d66',paper1:'#dfc889',paper2:'#f3dfa4',
  fish0:'#354953',fish1:'#708b91',fish2:'#c3ced1',float0:'#a45131',float1:'#f3dfa4',food0:'#a16a44',food1:'#df984e'});
 function finite(v,label){if(typeof v!=='number'||!Number.isFinite(v))throw new TypeError(label+' doit être fini.');return v;}
 function integer(v,label){if(!Number.isInteger(v))throw new TypeError(label+' doit être un entier.');return v;}
 function sexName(sex='male'){if(sex==='male'||sex==='masculin'||sex==='batracien')return'male';if(sex==='female'||sex==='femelle'||sex==='feminin'||sex==='batracienne')return'female';throw new RangeError('Sexe : male ou female.');}
 function directionName(dir=2){return MaleBase.directionName(dir);}
 function canonical(action='idle'){const k=ALIASES[action]||action;if(!Object.hasOwn(CLIPS,k))throw new RangeError('Animation inconnue : '+action);return k;}
 function paletteName(sex,name){const n=name===undefined?(sex==='female'?'rose_mauve':'original'):name;if(n==='original'||n==='base'||n==='olive')return'original';if(!Object.hasOwn(COLOR_VARIANTS[sex],n))throw new RangeError('Palette inconnue pour '+sex+' : '+n);return n;}
 function paletteFor(sex,name){const s=sexName(sex),n=paletteName(s,name);return {...BASES[s].PALETTE,...(n==='original'?{}:COLOR_VARIANTS[s][n].palette)};}
 function checkFrame(action,frame){const c=CLIPS[canonical(action)];integer(frame,'frame');if(frame<0||frame>=c.frames)throw new RangeError('Image hors animation : '+action+'/'+frame);return frame;}
 function frameAt(action='idle',seconds=0,distance){const c=CLIPS[canonical(action)];finite(seconds,'seconds');let ms;
  if(c.stride!==null&&distance!==undefined){finite(distance,'distance');ms=((distance%c.stride+c.stride)%c.stride)/c.stride*c.duration;}
  else {ms=Math.max(0,seconds)*1000;ms=c.loop?ms%c.duration:Math.min(ms,c.duration-0.0001);}
  for(let i=0;i<c.frames;i++){if(ms<c.durations[i])return i;ms-=c.durations[i];}return c.frames-1;
 }
 function sample(action='idle',seconds=0,distance){const id=canonical(action),c=CLIPS[id],frame=frameAt(id,seconds,distance);return {action:id,frame,phase:c.phases.find(p=>frame>=p.from&&frame<=p.to)?.name||'action',finished:!c.loop&&seconds*1000>=c.duration};}
 // Renvoie les repères franchis, sans jamais donner de poisson, de dégâts ou de marchandises.
 function crossedMarkers(action,fromSeconds,toSeconds,max=64){const id=canonical(action),c=CLIPS[id];finite(fromSeconds,'from');finite(toSeconds,'to');integer(max,'max');if(max<1||max>256)throw new RangeError('max doit être 1..256');if(toSeconds<fromSeconds)throw new RangeError('Le temps ne peut pas reculer.');
  const out=[];if(!c.markers.length)return out;const a=Math.max(-1,fromSeconds*1000),b=Math.max(0,toSeconds*1000);
  const first=c.loop?Math.max(0,Math.floor(a/c.duration)):0,last=c.loop?Math.floor(b/c.duration):0;
  for(let cycle=first;cycle<=last;cycle++){for(const e of c.markers){const at=cycle*c.duration+e.atMs;if(at>a&&at<=b){if(out.length===max)return out;out.push({...e,cycle,atMs:at,visualOnly:true});}}if(out.length===max)break;}return out;
 }
 const hexCache=new Map();function color(hex){if(!hexCache.has(hex))hexCache.set(hex,[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255]);return hexCache.get(hex);}
 class Pixels{
  constructor(palette,w=80,h=80){this.palette=palette;this.width=w;this.height=h;this.data=new Uint8ClampedArray(w*h*4);}
  set(x,y,key){if(key==='.'||key===null)return;integer(x,'x');integer(y,'y');if(x<0||y<0||x>=this.width||y>=this.height)throw new RangeError('Pixel hors cadre '+x+','+y);const h=this.palette[key]||(typeof key==='string'&&/^#[0-9a-f]{6}$/i.test(key)?key:null);if(!h)throw new RangeError('Couleur non définie : '+key);this.data.set(color(h),(y*this.width+x)*4);}
  stamp(rows,x,y){rows.forEach((r,j)=>{for(let i=0;i<r.length;i++)this.set(x+i,y+j,r[i]);});}
  rect(x,y,w,h,key){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)this.set(xx,yy,key);}
  line(x,y,xx,yy,key){x=Math.round(x);y=Math.round(y);xx=Math.round(xx);yy=Math.round(yy);const dx=Math.abs(xx-x),sx=x<xx?1:-1,dy=-Math.abs(yy-y),sy=y<yy?1:-1;let err=dx+dy;
   for(;;){this.set(x,y,key);if(x===xx&&y===yy)break;const e=err*2;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}
  }
  rod(a,b,key='wood2',highlight='wood3'){for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]])this.line(a[0]+x,a[1]+y,b[0]+x,b[1]+y,'O');this.line(...a,...b,key);if(highlight)this.set(Math.round(a[0]),Math.round(a[1]),highlight);}
  poly(points,key,outline){const min=Math.floor(Math.min(...points.map(p=>p[1]))),max=Math.ceil(Math.max(...points.map(p=>p[1])));for(let y=min;y<=max;y++){
   const xs=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a[1]<=y&&b[1]>y)||(b[1]<=y&&a[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));}
   xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<=Math.floor(xs[i+1]);x++)this.set(x,y,key);
  }if(outline)for(let i=0;i<points.length;i++)this.line(...points[i],...points[(i+1)%points.length],outline);}
  ellipse(cx,cy,rx,ry,key){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++)if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)this.set(x,y,key);}
 }
 function composite(layers){const data=new Uint8ClampedArray(80*80*4);for(const im of layers){const a=im.data||im;for(let i=0;i<a.length;i+=4)if(a[i+3])data.set(a.subarray(i,i+4),i);}return {width:80,height:80,anchor:ANCHOR,data};}
 function formatImage(image,format){if(format==='engine')return {...image,anchor:ANCHOR};if(format!=='native')throw new RangeError('Format : engine ou native.');const data=new Uint8ClampedArray(48*48*4);
  for(let y=0;y<80;y++)for(let x=0;x<80;x++){const i=(y*80+x)*4;if(x>=16&&x<64&&y>=16&&y<64)data.set(image.data.subarray(i,i+4),((y-16)*48+x-16)*4);else if(image.data[i+3])throw new RangeError('Le format 48px couperait du dessin.');}
  return {width:48,height:48,anchor:NATIVE_ANCHOR,data};
 }
 function project(view,lateral,depth,height=0){switch(view){case'face':return[40+Math.round(lateral),52+Math.round(depth*.5)-Math.round(height)];case'dos':return[40-Math.round(lateral),52-Math.round(depth*.5)-Math.round(height)];case'droite':return[40+Math.round(depth),52+Math.round(lateral*.4)-Math.round(height)];case'gauche':return[40-Math.round(depth),52-Math.round(lateral*.4)-Math.round(height)];}}
 function plus(p,x=0,y=0){return [p[0]+Math.round(x),p[1]+Math.round(y)];}
 function mix(a,b,t){return [Math.round(a[0]+(b[0]-a[0])*t),Math.round(a[1]+(b[1]-a[1])*t)];}
 const CYCLE=[0,0.3,0.7,1,1,0.7,0.3,0],BREATH=[0,0,-1,-1,0,0,0,0];
 const RIGS={};
 function rigFor(sex,view){const key=sex+view;if(RIGS[key])return RIGS[key];const rows=BASES[sex].SOURCE_VIEWS[view],side=view==='droite'||view==='gauche',female=sex==='female';const rig={rows,side,head:[],body:[],feet:[],left:[],right:[],near:[]};
  rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const k=row[x];if(k==='.')continue;let part='body';if(y<(side?10:9))part='head';else if(y>=rows.length-3)part='feet';else if(!side&&y>=11&&y<=15){if(x<=(female?4:3))part='left';else if(x>=(female?14:15))part='right';}
   else if(side){if(view==='droite'&&((y===12&&x>=6&&x<=7)||(y>=13&&y<=(female?16:17)&&x>=5&&x<=(female?9:10))))part='near';
    if(view==='gauche'&&((y===12&&x>=8&&x<=9)||(y>=13&&y<=(female?16:17)&&x>=6&&x<=10)||(!female&&y>=14&&y<=16&&x===5)))part='near';}
   rig[part].push([x,y,k]);}});
  rig.x=40-Math.floor(rows[0].length/2);rig.y=52-rows.length+1;RIGS[key]=rig;return rig;
 }
 function stampPoints(b,pts,x,y,dx=0,dy=0,limit=80){for(const [xx,yy,k]of pts)if(y+yy+dy<limit)b.set(x+xx+dx,y+yy+dy,k);}
 function poseFor(action,frame,view){const c=CLIPS[action],f=Math.min(7,Math.round(frame*7/(c.frames-1))),t=CYCLE[f];const p={body:0,head:0,hx:0,bx:0,seated:0,closed:false,talk:false,frame:f,tool:null,hands:null,contact:null,prone:0,walking:false};
  const q=view==='gauche'?-1:view==='droite'?1:0;
  switch(action){
   case'talk':p.head=BREATH[f];p.talk=[1,2,4,6].includes(f);break;
   case'sit_down':p.seated=Math.round(frame/(c.frames-1)*3);p.body=p.head=p.seated;break;
   case'seated':p.seated=3;p.body=3;p.head=3+BREATH[f];break;
   case'stand_up':p.seated=3-Math.round(frame/(c.frames-1)*3);p.body=p.head=p.seated;break;
   case'cower_enter':case'cower_exit':{const phase=action==='cower_enter'?frame/(c.frames-1):1-frame/(c.frames-1);p.seated=Math.round(phase*2);p.body=p.seated;p.head=Math.round(phase*3);p.hx=q*Math.round(phase);p.closed=phase>.6;p.protect=phase;break;}
   case'cower':p.seated=2;p.body=2;p.head=3+(f===3||f===5?1:0);p.hx=q;p.closed=true;break;
   case'startle':p.head=[0,-1,-2,-1,0,0][frame];p.body=frame===2?-1:0;break;
   case'hit':p.bx=[0,-1,-2,-1,0,0][frame]*(q||1);p.hx=p.bx;p.body=[0,0,1,1,0,0][frame];p.head=p.body;p.closed=frame>=1&&frame<=3;break;
   case'death':if(frame<6){p.seated=[0,0,1,2,3,3][frame];p.body=p.seated;p.head=p.seated;p.hx=q*Math.min(frame,2);p.closed=frame>1;}else p.prone=frame-5;break;
   case'sleep':p.prone=6;p.closed=true;p.sleep=true;break;
   case'flee':p.walking=true;p.run=true;p.hx=q;break;
   case'carry':p.walking=true;break;
   case'carry_idle':p.head=BREATH[f];break;
   case'load':case'unload':{const j=action==='load'?f:7-f;p.seated=Math.round([0,1,2,3,3,2,1,0][j]);p.body=p.seated;p.head=p.seated;p.hx=q*(p.seated>1?1:0);break;}
   case'net':case'weave':case'pottery':p.seated=2;p.body=2;p.head=2+(f===3?1:0);break;
   case'rice':case'gather':p.body=Math.round(t*2);p.head=Math.round(t*3);p.hx=q*Math.round(t*2);break;
   case'harvest':case'hoe':case'fish_spear':p.body=Math.round(t);p.head=Math.round(t);p.hx=q*Math.round(t);break;
   case'punt':p.body=[0,0,1,1,1,1,0,0][f];p.head=p.body;p.hx=q*[0,0,1,1,0,-1,-1,0][f];break;
   case'craft':p.body=f===4?1:0;p.head=p.body;break;
   case'ledger':p.head=1;p.hx=q;break;
   case'fish_wait':p.head=BREATH[f];break;
   case'fish_cast':case'fish_reel':p.hx=q*(f===2||f===3?1:0);p.head=BREATH[f];break;
   case'rope':case'stir':case'sow':p.head=f===3?1:0;break;
   case'eat':case'drink':p.head=f===3||f===4?-1:0;break;
  }
  return p;
 }
 function restingHands(rig,sex,view,p){if(rig.side)return [project(view,-3,2,10),[rig.x+(view==='droite'?8:8)+p.bx,rig.y+15+p.body]];
  return [[rig.x+(sex==='female'?2:1),rig.y+14+p.body],[rig.x+(sex==='female'?16:17),rig.y+14+p.body]];
 }
 function workHands(view,height=9,depth=5,width=4){return [project(view,-width,depth,height),project(view,width,depth,height)];}
 function palm(b,xy){const [x,y]=xy;b.set(x,y-1,'O');b.set(x-1,y,'O');b.set(x,y,'c');b.set(x+1,y,'b');b.set(x,y+1,'b');b.set(x+1,y+1,'d');b.set(x+2,y,'O');b.set(x+1,y+2,'O');b.set(x-1,y+1,'O');}
 function drawArm(b,shoulder,hand,far=false,side=1){const elbow=[Math.round((shoulder[0]+hand[0])*.5)+side,Math.round((shoulder[1]+hand[1])*.5)+1];
  b.rod(shoulder,elbow,far?'s':'g',null);b.rod(elbow,hand,far?'g':'l',null);
  b.set(shoulder[0],shoulder[1],'g');b.set(elbow[0]-1,elbow[1],'l');palm(b,hand);return {shoulder,elbow,hand};
 }
 function head(b,rig,view,p){stampPoints(b,rig.head,rig.x,rig.y,p.hx,p.head);const x=rig.x+p.hx,y=rig.y+p.head;
  if(p.closed){const centers=view==='face'?[4,14]:view==='droite'?[9]:view==='gauche'?[5]:[];for(const cx of centers){for(let yy=2;yy<=5;yy++)for(let xx=cx-1;xx<=cx+1;xx++)b.set(x+xx,y+yy,yy===3?'s':'g');b.line(x+cx-1,y+3,x+cx+1,y+3,'O');}}
  if(p.talk){if(view==='face'){b.line(x+7,y+8,x+11,y+8,'K');b.set(x+9,y+8,'b');}else if(view==='droite')b.line(x+12,y+8,x+14,y+8,'K');else if(view==='gauche')b.line(x+1,y+8,x+3,y+8,'K');}
 }
 function drawProne(layers,rig,view,p){const b=layers.body,q=view==='gauche'?-1:1,settle=Math.min(3,p.prone),baseY=50;const arr=[[-11,0],[-12,-3],[-8,-6],[3,-5],[9,-3],[11,0]];
  b.poly(arr.map(([x,y])=>[40+x,baseY+y]),'v','O');b.rect(33,45,9,3,'w');b.line(33,45,39,45,'t');b.rect(40,47,7,3,'u');b.line(33,49,38,49,'g');b.line(45,49,49,49,'s');
  const hp={...p,head:10+(settle===1?-1:0)+(p.sleep?BREATH[p.frame]:0),hx:q*(view==='face'||view==='dos'?6:6),closed:true,talk:false};
  // La tête est déplacée entière ; aucune rotation du bitmap ou de la lumière.
  head(b,rig,view,hp);palm(b,[40-q*8,50]);b.line(30,52,35,52,'O');b.line(43,52,48,52,'O');
 }
 function drawBody(layers,sex,view,p){const rig=rigFor(sex,view),b=layers.body;const joints=[];
  if(p.prone){drawProne(layers,rig,view,p);return joints;}
  if(p.walking){const src=BASES[sex].raster('walk',view,p.frame,'engine'),rawPal=BASES[sex].PALETTE,dstPal=b.palette,map=new Map(Object.entries(rawPal).map(([k,h])=>[h.toLowerCase(),dstPal[k]]));
   for(let i=0;i<src.data.length;i+=4){if(src.data[i+3]){const h='#'+[src.data[i],src.data[i+1],src.data[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');b.data.set(color(map.get(h)||h),i);}}
   // Retirer les bras du cycle de marche n’est pas nécessaire : le tronc neutre
   // et le bras porteur les recouvrent dans la zone autorisée, les pieds restent exacts.
   for(let yy=rig.y-2;yy<rig.y+rig.rows.length-3;yy++)for(let xx=28;xx<53;xx++){const i=(yy*80+xx)*4;b.data.fill(0,i,i+4);}
   p.body=[0,1,1,0,0,1,1,0][p.frame];p.head=[0,0,1,0,0,0,1,0][p.frame];
  }else stampPoints(b,rig.feet,rig.x,rig.y);
  // Les hanches se rapprochent des genoux ; aucune mise à l’échelle du corps.
  if(rig.side)for(const [x,y]of rig.near)if(y>=13)b.set(rig.x+x+p.bx,rig.y+y+p.body,x<8?'w':'v');
  stampPoints(b,rig.body,rig.x,rig.y,p.bx,p.body,p.seated?51:80);
  const neckY=rig.y+(rig.side?9:8);b.rect(37+p.bx,neckY+Math.min(p.head,p.body),6,Math.abs(p.head-p.body)+2,view==='dos'?'g':'b');
  let hands=p.hands||restingHands(rig,sex,view,p);
  if(!rig.side)hands=[...hands].sort((a,c)=>a[0]-c[0]);
  const shoulderL=[rig.x+(sex==='female'?5:4)+p.bx,rig.y+11+p.body],shoulderR=[rig.x+(sex==='female'?13:14)+p.bx,rig.y+11+p.body];
  if(rig.side){const nearShoulder=[rig.x+8+p.bx,rig.y+12+p.body],farShoulder=project(view,-3,2,11-p.body);
   if(p.hands)joints.push(drawArm(b,farShoulder,hands[0],true,view==='droite'?1:-1));
   joints.push(drawArm(b,nearShoulder,hands[1],false,view==='droite'?-1:1));
  }else{joints.push(drawArm(b,shoulderL,hands[0],false,-1));joints.push(drawArm(b,shoulderR,hands[1],true,1));}
  head(b,rig,view,p);
  if(p.hands&&view!=='dos'){for(const h of (rig.side?[hands[1]]:hands))palm(layers.hands,h);}
  return joints;
 }
 function box(b,cx,cy,w=11,h=7){const x=cx-Math.floor(w/2),y=cy-Math.floor(h/2);b.rect(x,y,w,h,'O');b.rect(x+1,y+1,w-2,h-2,'wood1');b.line(x+1,y+1,x+w-2,y+1,'wood3');b.line(x+1,y+h-2,x+w-2,y+h-2,'wood0');for(let i=x+3;i<x+w-1;i+=3)b.line(i,y+2,i,y+h-3,'wood2');b.line(x+1,y+2,x+w-2,y+h-2,'wood2');}
 function basket(b,cx,cy,w=11,h=7){b.poly([[cx-Math.floor(w/2),cy-3],[cx+Math.floor(w/2),cy-3],[cx+Math.floor(w/2)-1,cy+3],[cx-Math.floor(w/2)+1,cy+3]],'rope0','O');
  for(let y=cy-2;y<=cy+2;y++){for(let x=cx-Math.floor(w/2)+1;x<cx+Math.floor(w/2);x++)b.set(x,y,(x+y)%3===0?'rope2':'rope1');}b.line(cx-4,cy-3,cx+4,cy-3,'rope2');}
 function coil(b,cx,cy){b.ellipse(cx,cy,5,3,'O');b.ellipse(cx,cy,4,2,'rope1');b.ellipse(cx,cy,2,1,'rope0');b.set(cx-3,cy-1,'rope2');b.set(cx+2,cy+2,'rope0');}
 function leaves(b,x,y,seed=false){b.line(x,y,x,y-5,seed?'rope1':'leaf1');b.line(x,y-2,x-3,y-4,seed?'rope2':'leaf2');b.line(x,y-2,x+2,y-6,seed?'rope2':'leaf2');b.set(x-1,y-5,seed?'rope2':'leaf3');}
 function fish(b,x,y){b.poly([[x-3,y],[x,y-2],[x+3,y-1],[x+3,y+1],[x,y+2]],'fish1','O');b.set(x+2,y-1,'fish2');b.set(x+2,y,'O');b.line(x-3,y,x-5,y-2,'fish1');b.line(x-3,y,x-5,y+2,'fish1');}
 function pot(b,cx,cy){b.ellipse(cx,cy,5,4,'O');b.ellipse(cx,cy-1,4,3,'clay1');b.line(cx-2,cy-3,cx+2,cy-3,'clay2');b.ellipse(cx,cy-4,3,1,'O');b.line(cx-2,cy-4,cx+2,cy-4,'clay0');b.set(cx-3,cy-1,'clay2');}
 function table(b,cx,cy,view){const side=view==='gauche'||view==='droite',w=side?13:19;const x=cx-Math.floor(w/2);b.rect(x,cy,w,3,'O');b.rect(x+1,cy,w-2,1,'wood3');b.rect(x+1,cy+1,w-2,1,'wood1');b.line(x+2,cy+3,x+2,cy+7,'wood0');b.line(x+w-3,cy+3,x+w-3,cy+7,'wood1');}
 function makeTools(layers,sex,action,view,p,frame,opts){const f=p.frame,t=CYCLE[f],back=view==='dos',tool=layers[back?'tools_back':'tools_front'],scene=layers.scene_back,fx=layers.effects;
  const q=view==='gauche'||view==='dos'?-1:1,side=view==='droite'||view==='gauche';
  const work=project(view,0,9,3),ground=project(view,0,10,0);let h=workHands(view,9,4,4);const addHands=(a,b)=>{p.hands=[a,b];};
  // Social : gestes lisibles sans accessoire ou pose démesurée.
  if(action==='flee'){const r=rigFor(sex,view),h=restingHands(r,sex,view,p),s=[-2,-1,0,1,2,1,0,-1][f];p.hands=side?[plus(h[0],q*-s,-1),plus(h[1],q*s,-1-Math.abs(s))]:[plus(h[0],-1,s),plus(h[1],1,-s)];return;}
  if(action==='talk'){const r=rigFor(sex,view),rest=restingHands(r,sex,view,p);p.hands=[rest[0],plus(rest[1],q*Math.round(t),-Math.round(t*3))];return;}
  if(['sit_down','seated','stand_up'].includes(action)){const amt=p.seated/3,rest=restingHands(rigFor(sex,view),sex,view,p),seated=workHands(view,4,4,5);addHands(mix(rest[0],seated[0],amt),mix(rest[1],seated[1],amt));return;}
  if(action==='cower'||action==='cower_enter'||action==='cower_exit'){const a=project(view,-5,4,13),b=project(view,5,4,13);if(action==='cower')addHands(a,b);else{const r=restingHands(rigFor(sex,view),sex,view,p);addHands(mix(r[0],a,p.protect),mix(r[1],b,p.protect));}return;}
  if(action==='startle'){const a=[0,2,4,3,1,0][frame],rest=restingHands(rigFor(sex,view),sex,view,p);addHands(plus(rest[0],-Math.round(a/2),-a),plus(rest[1],Math.round(a/2),-a));return;}
  if(action==='hit'||action==='death'||action==='sleep')return;
  if(action==='carry'||action==='carry_idle'||action==='load'||action==='unload'){
   const j=action==='load'?f:action==='unload'?7-f:7,frac=[0,0,0,0,.1,.45,.8,1][j];const target=project(view,0,5,7),start=project(view,0,6,2);const at=mix(start,target,frac);
   if(action==='carry')at[1]+=[0,1,1,0,0,1,1,0][f];const hh=side?[[at[0]-q*3,at[1]-2],[at[0]+q*3,at[1]+1]]:[[at[0]-5,at[1]],[at[0]+5,at[1]]];
   if(action==='carry'||action==='carry_idle'||j>=3)addHands(...hh);else{const rest=restingHands(rigFor(sex,view),sex,view,p);addHands(mix(rest[0],hh[0],j/3),mix(rest[1],hh[1],j/3));}
   box((action==='carry'||action==='carry_idle'||j>=4)?tool:layers[back?'scene_back':'scene_front'],...at,side?9:11,7);p.tool='crate';p.contact={point:at,held:action==='carry'||action==='carry_idle'||j>=4};return;
  }
  if(['fish_cast','fish_wait','fish_reel','fish_spear'].includes(action)){
   const grip=project(view,5,4,9),tableTips=[[6,-16],[2,-20],[5,-18],[12,-11],[17,-6],[17,-6],[17,-6],[17,-6]];
   let delta=tableTips[action==='fish_wait'?7:action==='fish_reel'?Math.max(0,7-f):f];
   if(action==='fish_spear')delta=[[3,-17],[4,-18],[7,-13],[12,-5],[16,4],[14,2],[7,-10],[3,-17]][f];
   let tip=plus(grip,q*delta[0],delta[1]);if(action==='fish_spear'){const target=project(view,8,18,0);if(f===4)tip=target;else if(f===3)tip=mix(grip,target,.65);else if(f===5)tip=mix(target,grip,.2);scene.ellipse(target[0],target[1],5,2,'water0');scene.line(target[0]-3,target[1]+1,target[0]+3,target[1]+1,'water1');if(f===4){fx.set(target[0]-2,target[1]-1,'water2');fx.set(target[0]+2,target[1]-2,'water2');}}const butt=plus(grip,-q*2,3),h2=mix(grip,tip,.22);
   addHands(project(view,-3,3,8),grip);tool.rod(butt,tip,'wood2','wood3');p.tool=action==='fish_spear'?'fishing_spear':'fishing_rod';p.contact={point:tip,held:true};
   if(action==='fish_spear'){const v=mix(grip,tip,.85);tool.poly([tip,plus(v,-1,-1),plus(v,1,1)],'metal2','metal0');}
   else {let float=project(view,8,20,0);float[0]=Math.max(18,Math.min(61,float[0]));if(action==='fish_cast')float=mix(plus(tip,0,7),float,Math.min(1,f/4));
    if(action==='fish_reel')float=mix(float,plus(tip,0,6),Math.min(1,frame/6));
    tool.line(...tip,Math.round((tip[0]+float[0])/2),Math.round((tip[1]+float[1])/2)+2,'metal1');tool.line(Math.round((tip[0]+float[0])/2),Math.round((tip[1]+float[1])/2)+2,...float,'metal2');
    if(action==='fish_reel'&&frame>=5&&opts.catch!==false)fish(tool,float[0],float[1]);else{tool.set(float[0],float[1]-1,'float1');tool.set(float[0],float[1],'float0');}
    const pond=project(view,7,17,0);scene.ellipse(pond[0],pond[1],side?6:8,2,'water0');scene.line(pond[0]-4,pond[1]+2,pond[0]+3,pond[1]+2,'water1');
    if(action==='fish_cast'&&f===4||action==='fish_reel'&&frame===5){fx.set(float[0]-2,float[1]-1,'water2');fx.set(float[0]+2,float[1]-2,'water2');}
   }return;
  }
  if(action==='punt'){
   const foot={face:[47,57],dos:[32,49],droite:[53,56],gauche:[27,56]}[view];
   const sway=[0,0,1,1,0,-1,-1,0][f];
   const upper={face:[38+sway,41],dos:[42+sway,39],droite:[44+sway,40],gauche:[36-sway,40]}[view];
   const lift=[5,2,0,0,0,0,3,5][f],bottom=plus(foot,0,-lift);
   const near=mix(upper,bottom,.28),far=upper,top=plus(upper,(upper[0]-bottom[0])*.65,(upper[1]-bottom[1])*.65);
   addHands(far,near);tool.rod(bottom,top);p.tool='pole';p.contact={point:bottom,planted:f>=2&&f<=5};
   const boat=layers.scene_back,rim=layers.scene_front;
   if(side){
    boat.poly([[19,51],[23,47],[57,47],[61,51],[56,58],[24,58]],'wood1','O');boat.line(23,49,57,49,'wood3');boat.line(24,50,56,50,'wood0');
    rim.poly([[19,52],[23,53],[57,53],[61,52],[56,58],[24,58]],'wood1','O');rim.line(23,54,56,54,'wood2');rim.line(26,56,54,56,'wood0');
   }else{
    boat.poly([[33,45],[47,45],[51,55],[47,60],[33,60],[29,55]],'wood1','O');boat.line(34,46,46,46,'wood3');boat.line(33,48,47,48,'wood0');
    rim.poly([[30,54],[34,55],[46,55],[50,54],[47,60],[33,60]],'wood1','O');rim.line(33,56,47,56,'wood3');rim.line(34,58,46,58,'wood0');
   }
   // Les éclaboussures de la perche sont dans le décor, jamais attachées au corps.
   if(f>=2&&f<=5){rim.set(bottom[0]-2,bottom[1]+1,'water2');rim.set(bottom[0]+2,bottom[1],'water3');}return;
  }
  if(action==='net'){
   const at=project(view,0,6,5);table(scene,at[0],at[1]+3,view);const lift=[0,1,2,1,2,1,0,0][f],w=side?9:15;const xx=at[0]-Math.floor(w/2),yy=at[1]-2-lift;
   tool.poly([[xx,yy],[xx+w,yy+1],[xx+w-1,yy+6],[xx+1,yy+5]],'metal0','rope0');
   for(let x=xx+1;x<xx+w;x+=3)tool.line(x,yy+1,x+1,yy+5,'rope1');for(let y=yy+2;y<=yy+5;y+=2)tool.line(xx+1,y,xx+w-1,y,'rope2');
   addHands([xx+2,yy+1],[xx+w-2,yy+3-(f%2)]);tool.line(xx+w-2,yy+3-(f%2),xx+w+1,yy+1,'metal2');p.tool='net_needle';return;
  }
  if(action==='rope'){
   const at=project(view,0,6,4);coil(tool,...at);const a=project(view,-3,4,10+[0,1,2,3,3,2,1,0][f]),b=project(view,4,4,8);
   tool.line(...a,at[0]-2,at[1],'rope2');tool.line(at[0]+2,at[1],...b,'rope1');addHands(a,b);p.tool='rope';return;
  }
  if(action==='rice'||action==='gather'){
   const target=project(view,3,7,1),a=project(view,-4,3,8),b=mix(project(view,4,4,8),target,t);addHands(a,b);
   leaves(tool,a[0],a[1]+1);for(let j=-1;j<=1;j++)leaves(scene,ground[0]+j*4,ground[1]+2);
   if(action==='rice'&&f>=4)leaves(scene,...target);else if(action==='gather'&&f>=4&&f<=6)leaves(tool,b[0],b[1]+1);
   p.tool=action==='rice'?'seedlings':'herb_bundle';p.contact={point:target,active:f===4};return;
  }
  if(action==='harvest'){
   const a=project(view,-4,5,7),b=project(view,4,5+[0,1,2,3,3,2,1,0][f],7);addHands(a,b);
   const cut=f>=3&&f<=5;tool.rod(b,plus(b,q*2,cut?1:-3));const tip=plus(b,q*3,cut?0:-5);tool.line(...tip,tip[0]+q*3,tip[1]+1,'metal2');tool.line(tip[0]+q*3,tip[1]+1,tip[0]+q*3,tip[1]+4,'metal1');tool.set(tip[0]+q*2,tip[1]+5,'metal0');
   if(f>=4&&f<=6){for(let i=-1;i<=1;i++)leaves(tool,a[0]+i*2,a[1]+2,true);}const reedGround=project(view,6,10,0);for(let i=-1;i<=1;i++)leaves(scene,reedGround[0]+i*3,reedGround[1]+2,true);
   p.tool='sickle';p.contact={point:ground,active:f===4};return;
  }
  if(action==='hoe'){
   const grip=project(view,0,3,10);let end=plus(grip,q*[2,3,5,8,10,9,5,2][f],[-12,-13,-10,-5,5,3,-7,-12][f]);if(f===4)end=ground;else if(f===3)end=mix(grip,ground,.65);else if(f===5)end=mix(grip,ground,.85);addHands(mix(grip,end,.23),grip);tool.rod(plus(grip,-q*2,3),end);tool.line(end[0]-3,end[1],end[0]+3,end[1],'metal0');tool.line(end[0]-3,end[1]-1,end[0]+3,end[1]-1,'metal2');
   scene.ellipse(ground[0],ground[1]+1,6,2,'wood0');if(f===4){fx.set(end[0]-2,end[1]+2,'wood2');fx.set(end[0]+3,end[1]+1,'wood1');}p.tool='hoe';p.contact={point:end,active:f===4};return;
  }
  if(action==='sow'){
   const at=project(view,-4,3,6),a=plus(at,0,-2),b=project(view,4+[0,0,1,2,3,2,0,0][f],5,9);basket(tool,...at,7);addHands(a,b);
   if(f>=3&&f<=5){for(let i=0;i<4;i++){const pt=project(view,2+i*2,8+i,3-(f-3));fx.set(pt[0],pt[1],'rope2');}}p.tool='seed_basket';return;
  }
  if(action==='weave'){
   const at=project(view,0,5,4);basket(tool,...at,side?9:11);addHands(plus(at,-3,-2+(f%2)),plus(at,3,-1-(f%2)));tool.line(at[0]-3,at[1]-2+(f%2),at[0]+4,at[1]-1-(f%2),'rope2');for(let j=0;j<3;j++)scene.line(ground[0]-5+j,ground[1],ground[0]-2+j,ground[1]+1,'rope0');p.tool='basket';return;
  }
  if(action==='craft'){
   const at=project(view,0,6,5);table(scene,at[0],at[1]+1,view);tool.rect(at[0]-2,at[1]-1,5,2,'wood2');const a=plus(at,-3,-1),b=plus(at,q*(side?1:4),-[3,5,6,5,4,4,3,3][f]);addHands(a,b);const end=f===4?plus(at,0,-1):f===3?plus(b,q,0):f===5?plus(b,q,1):plus(b,q*2,-4);tool.rod(b,end);tool.rect(end[0]-2,end[1]-1,5,3,'metal0');tool.line(end[0]-2,end[1]-1,end[0]+2,end[1]-1,'metal2');p.tool='hammer';p.contact={point:at,active:f===4};return;
  }
  if(action==='pottery'){
   const at=project(view,0,5,3);scene.ellipse(at[0],at[1]+2,8,2,'wood0');pot(tool,...at);addHands(plus(at,-4,-1+(f%2)),plus(at,4,-1-(f%2)));p.tool='pot';return;
  }
  if(action==='stir'){
   const at=project(view,0,8,3);pot(scene,...at);const end=plus(at,[0,1,2,1,0,-1,-2,-1][f],-2),grip=plus(end,side?-q*2:3,-8);tool.rod(end,grip,'wood1','wood2');addHands(project(view,back?4:-4,3,8),grip);p.tool='stirring_spoon';return;
  }
  if(action==='ledger'){
   const at=project(view,0,5,8);tool.rect(at[0]-6,at[1]-2,13,7,'O');tool.rect(at[0]-5,at[1]-1,5,5,'paper2');tool.rect(at[0]+1,at[1]-1,5,5,'paper1');tool.line(at[0],at[1]-1,at[0],at[1]+3,'wood0');tool.line(at[0]-4,at[1],at[0]-2,at[1],'wood1');tool.line(at[0]+2,at[1]+1,at[0]+4,at[1]+1,'wood1');
   const a=plus(at,-5,3),b=plus(at,4-(f%3),-1);tool.line(...b,b[0]+2,b[1]-3,'paper2');addHands(a,b);p.tool='ledger';return;
  }
  if(action==='eat'||action==='drink'){
   const r=rigFor(sex,view),mouth=[r.x+(view==='gauche'?3:view==='droite'?13:9),r.y+(r.side?8:8)+p.head],rest=project(view,3,3,7),at=mix(rest,plus(mouth,0,1),t);addHands(project(view,-4,3,7),at);
   if(action==='eat'){tool.ellipse(at[0]+q,at[1]-1,2,2,'food0');tool.set(at[0]+q,at[1]-2,'food1');}else{tool.rect(at[0]-1,at[1]-3,4,4,'wood1');tool.line(at[0]-1,at[1]-3,at[0]+2,at[1]-3,'rope2');tool.line(at[0]+3,at[1]-2,at[0]+3,at[1],'wood0');}p.tool=action==='eat'?'food':'cup';return;
  }
 }
 function recolorBase(image,sex,palette){const source=BASES[sex].PALETTE,target=paletteFor(sex,palette),look=new Map(Object.entries(source).map(([k,h])=>[parseInt(h.slice(1),16),color(target[k])]));const out=new Uint8ClampedArray(image.data.length);
  for(let i=0;i<out.length;i+=4)if(image.data[i+3])out.set(look.get((image.data[i]<<16)|(image.data[i+1]<<8)|image.data[i+2]),i);return {...image,data:out};
 }
 function renderLayers(options={}){
  const sex=sexName(options.sex),action=canonical(options.action),view=directionName(options.dir),frame=checkFrame(action,options.frame===undefined?0:options.frame),palette=paletteName(sex,options.palette);
  const bodyPal=paletteFor(sex,palette),layers=Object.fromEntries(LAYERS.map(k=>[k,new Pixels(k==='body'||k==='hands'?bodyPal:TOOL_COLORS)]));
  let p=poseFor(action,frame,view),joints=[];
  if(action==='idle'||action==='walk'){
   const baseAction=action;layers.body.data.set(recolorBase(BASES[sex].raster(baseAction,view,frame),sex,palette).data);
  }else{makeTools(layers,sex,action,view,p,frame,options);joints=drawBody(layers,sex,view,p);
   const neutral=(action==='sit_down'&&frame===0)||(action==='stand_up'&&frame===CLIPS[action].frames-1)||(['hit','startle'].includes(action)&&(frame===0||frame===CLIPS[action].frames-1))||(action==='death'&&frame===0)||(action==='cower_enter'&&frame===0)||(action==='cower_exit'&&frame===CLIPS[action].frames-1)||(action==='unload'&&frame===CLIPS[action].frames-1);
   if(neutral){layers.body.data.set(recolorBase(BASES[sex].raster('idle',view,0),sex,palette).data);layers.hands.data.fill(0);joints=[];}
  }
  const result=Object.fromEntries(LAYERS.map(k=>[k,{width:80,height:80,anchor:ANCHOR,data:layers[k].data}]));
  return {layers:result,metadata:{sex,palette,action,direction:view,engineDirection:DIRECTIONS.indexOf(view),frame,anchor:ANCHOR,
   tool:p.tool,hands:p.hands,joints,contact:p.contact,socketCoordinateSpace:'engine_80px',rootMotion:[0,0],sceneRequired:action==='punt'?'boat':null}};
 }
 function raster(options={}){const format=options.format||'engine',which=options.layer||(options.scene?'composite':'actor'),r=renderLayers(options);let image;
  if(which==='composite')image=composite(LAYERS.map(k=>r.layers[k]));else if(which==='actor')image=composite(ACTOR_LAYERS.map(k=>r.layers[k]));else if(Object.hasOwn(r.layers,which))image=r.layers[which];else throw new RangeError('Calque inconnu : '+which);
  return {...formatImage(image,format),metadata:r.metadata};
 }
 function canvasFactory(w,h){let cv;if(typeof document!=='undefined')cv=document.createElement('canvas');else if(typeof OffscreenCanvas!=='undefined')cv=new OffscreenCanvas(w,h);else throw new Error('Fournir canvasFactory sous Node ; raster() fonctionne sans Canvas.');cv.width=w;cv.height=h;return cv;}
 class Atlas{
  constructor(options={}){this.sex=sexName(options.sex);this._palette=paletteName(this.sex,options.palette);this.canvasFactory=options.canvasFactory||canvasFactory;this.maxFrames=options.maxFrames===undefined?128:integer(options.maxFrames,'maxFrames');if(this.maxFrames<1||this.maxFrames>256)throw new RangeError('maxFrames : 1..256');this.cache=new Map();}
  get palette(){return this._palette;}set palette(name){const n=paletteName(this.sex,name);if(n!==this._palette){this._palette=n;this.clear();}}
  get(action='idle',dir=2,frame=0,options={}){const id=canonical(action),view=directionName(dir);checkFrame(id,frame);const layer=options.layer||(options.scene?'composite':'actor');const key=[id,view,frame,layer,options.catch!==false].join(':');
   if(this.cache.has(key)){const v=this.cache.get(key);this.cache.delete(key);this.cache.set(key,v);return v;}
   const im=raster({...options,sex:this.sex,palette:this.palette,action:id,dir:view,frame,format:'engine'}),cv=this.canvasFactory(80,80);cv.width=cv.height=80;const c=cv.getContext('2d');if(!c)throw new Error('Canvas 2D indisponible.');const data=c.createImageData(80,80);data.data.set(im.data);c.putImageData(data,0,0);
   this.cache.set(key,cv);while(this.cache.size>this.maxFrames)this.cache.delete(this.cache.keys().next().value);return cv;
  }
  draw(ctx,actor,time=0,state={}){if(!ctx||typeof ctx.drawImage!=='function')throw new TypeError('Contexte Canvas 2D attendu.');if(!actor)throw new TypeError('Acteur attendu.');finite(actor.x,'x');finite(actor.y,'y');finite(time,'time');const z=actor.z===undefined?0:finite(actor.z,'z'),alpha=actor.alpha===undefined?1:Math.max(0,Math.min(1,finite(actor.alpha,'alpha')));
   if(alpha===0)return null;const id=canonical(state.action),frame=state.frame===undefined?frameAt(id,state.elapsed===undefined?time:state.elapsed,state.distance):checkFrame(id,state.frame);const im=this.get(id,actor.dir===undefined?2:actor.dir,frame,state);
   ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;ctx.drawImage(im,Math.round(actor.x)-40,Math.round(actor.y-z)-52);}finally{ctx.restore();}actor._img=im;return im;
  }
  preview(ctx,action,dir,frame,x,y,scale=1,options={}){integer(scale,'scale');finite(x,'x');finite(y,'y');if(scale<1||scale>32)throw new RangeError('scale : 1..32');const im=this.get(action,dir,frame,options);ctx.save();try{ctx.imageSmoothingEnabled=false;ctx.drawImage(im,Math.round(x)-40*scale,Math.round(y)-52*scale,80*scale,80*scale);}finally{ctx.restore();}}
  clear(){this.cache.clear();}
 }
 function buildSheet(options={}){const actions=options.actions||Object.keys(CLIPS),cell=options.format==='native'?48:80,columns=Math.max(...actions.map(a=>CLIPS[canonical(a)].frames)),rows=actions.length*4;
  if(!actions.length||rows*cell>4096)throw new RangeError('Choisir 1..12 activités par page (max. 4096px).');const result={width:columns*cell,height:rows*cell,data:new Uint8ClampedArray(columns*cell*rows*cell*4)};
  actions.forEach((a,i)=>SHEET_DIRECTIONS.forEach((d,j)=>{for(let f=0;f<CLIPS[canonical(a)].frames;f++){const im=raster({...options,action:a,dir:d,frame:f});for(let y=0;y<cell;y++)result.data.set(im.data.subarray(y*cell*4,(y+1)*cell*4),(((i*4+j)*cell+y)*result.width+f*cell)*4);}}));return result;
 }
 function manifest(){return {id:'batraciens-activities',version:VERSION,authoring:'JavaScript, indexed pixel grids and articulated integer poses',cell:[80,80],anchor:[40,52],nativeCell:[48,48],nativeAnchor:[24,36],nativeOffset:[16,16],directions:DIRECTIONS,sheetDirections:SHEET_DIRECTIONS,clips:CLIPS,aliases:ALIASES,palettes:COLOR_VARIANTS,layers:LAYERS,actorLayers:ACTOR_LAYERS,alpha:'binary',baseV2Preserved:['idle','walk'],rootMotion:'owned by game only',sourcePolicy:'v2 grids are canonical; generated illustrations are intent references only',scope:'Graphic assets and playback only; no NPC spawning, economy, combat AI or resource rewards.'};}
 const installations=new WeakMap();
 function installCharacterAtlas(target,options={}){const proto=typeof target==='function'?target.prototype:target;if(!proto||typeof proto.draw!=='function')throw new TypeError('CharacterAtlas attendu.');if(installations.has(proto))return installations.get(proto);const original=proto.draw,atlases=new Map();
  function wrapped(ctx,kind,actor,time=0){if(kind!=='batracien'&&kind!=='batracienne')return original.apply(this,arguments);const sex=kind==='batracienne'?'female':'male',state=options.stateFor?options.stateFor(actor,time,sex):(actor[kind]||actor.batracien||{action:'idle',elapsed:time}),pal=paletteName(sex,state.palette),key=sex+pal;
   if(!atlases.has(key))atlases.set(key,new Atlas({...options,sex,palette:pal}));return atlases.get(key).draw(ctx,actor,time,state);}
  proto.draw=wrapped;const handle={uninstall(){if(proto.draw!==wrapped)throw new Error('Retirer d’abord l’adaptateur ajouté ensuite.');proto.draw=original;for(const a of atlases.values())a.clear();installations.delete(proto);},atlases};installations.set(proto,handle);return handle;
 }
 function character(sex){const s=sexName(sex);class CharacterAtlas extends Atlas{constructor(options={}){super({...options,sex:s});}}
  return Object.freeze({version:VERSION,DIR,ANCHOR,NATIVE_ANCHOR,CLIPS,PALETTE:BASES[s].PALETTE,SOURCE_VIEWS:BASES[s].SOURCE_VIEWS,directionName,frameAt,Atlas:CharacterAtlas,
   raster(action='idle',dir=2,frame=0,format='engine',options={}){return raster({...options,sex:s,action,dir,frame,format});},
   buildSheet(format='engine',options={}){return buildSheet({...options,sex:s,format});},manifest,
   installCharacterAtlas});}
 const Male=character('male'),Female=character('female');
 return Object.freeze({VERSION,ANCHOR,NATIVE_ANCHOR,DIR,DIRECTIONS,SHEET_DIRECTIONS,CLIPS,ALIASES,COLOR_VARIANTS,TOOL_COLORS,LAYERS,ACTOR_LAYERS,sexName,directionName,canonical,paletteFor,paletteName,frameAt,sample,crossedMarkers,renderLayers,raster,Atlas,buildSheet,manifest,installCharacterAtlas,Male,Female});
});
