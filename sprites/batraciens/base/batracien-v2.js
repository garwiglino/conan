/**
 * Hearthreaver — Batracien bipède, dessin JavaScript natif.
 * Source : personnage de la planche validée dans cette conversation.
 * Contrat du fichier de référence (pas de nouvel audit du dépôt) : garwiglino/conan @ b598bc103c61112c4e81eac29e58f37653213de8.
 *
 * Animation v2 : tête et bras articulés, silhouettes et palettes sources conservées.
 * Aucun PNG embarqué, aucune image chargée : chaque caractère ci-dessous est UN pixel.
 * Couleurs fixes ; alpha binaire ; aucune rotation, interpolation, texture ou miroir.
 * Case moteur : 80 × 80 / ancre : (40,52).
 * Case de travail : 48 × 48 / ancre : (24,36), translation exacte de (+16,+16).
 * Le personnage visible mesure 19×20 px de face/dos et 16×21 px de profil au repos.
 * Les pieds occupent la ligne d'ancrage (y = 52), sans recentrage automatique.
 *
 * Module navigateur (HearthreaverBatracien) et CommonJS, sans dépendance.
 * À charger après le moteur pour utiliser installCharacterAtlas(), ou seul pour l'atelier.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HearthreaverBatracien = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** O/K : contours ; s/g/l/h : peau ; d/b/c : crème ; u/v/w/t/r : cuir ; a/e/y/i : œil. */
  const PALETTE = Object.freeze({
    "O": "#100e20",
    "K": "#30262a",
    "s": "#575c39",
    "g": "#80834c",
    "l": "#a1a365",
    "h": "#c4c57c",
    "d": "#b9a16b",
    "b": "#e1c58a",
    "c": "#f3dfa4",
    "u": "#50342f",
    "v": "#754b37",
    "w": "#a16a44",
    "t": "#bb8051",
    "r": "#cf955f",
    "a": "#b5772c",
    "e": "#f3af3c",
    "y": "#ffd45e",
    "i": "#fff0be"
});

  // Quatre dessins indépendants. Les profils ne sont pas des images retournées.
  const SOURCE_VIEWS = {
    "face": [
        "....OO......OOO....",
        "...OhlOO...OlgsO...",
        "..OiyvgsOOOggviyO..",
        "..OOOegggggggeOOO..",
        "..OyeagdgggggaeyO..",
        ".OussggsgggsgssuOO.",
        ".OlgggggggggggggsO.",
        ".OldggcccccccgglgO.",
        "..OccccccccccccbO..",
        "..OuwddccccchduuO..",
        "..OvwwvOOOOOvtwuOK.",
        ".OgOOuwwuuwwvKOKgO.",
        "OggOddOOwuOOOddOggO",
        "OslOdcccOwuOOOObbsO",
        "ObuOObcccOvOubvhsbO",
        ".OOOsOtddvOOwuuOOO.",
        "....ggsOKvuOOOO....",
        "...OtgguOOOsgggO...",
        "..ObvctwO.OgtcvbO..",
        "..OOOOOOO.OOOOOOO.."
    ],
    "droite": [
        "........OOO.....",
        ".......OlggO....",
        ".....OlgayyuO...",
        "....OlguyiOeO...",
        "...OlgguyOOeOgO.",
        "..OdgggsaeeaggsO",
        ".OggggggsuugghbO",
        ".OggggggggggcccO",
        ".OgggggdccccccO.",
        "..OsggccccccKO..",
        "..OwwtwwvObOO...",
        ".OvvtwwvvwvwO...",
        ".OOOwuOOOOOKO...",
        "OwwuOOsggOvO....",
        "OruvOvgghcOu....",
        "OuvvOuglbhOv....",
        ".OvuOsObbvdO....",
        "..OOOusOOsO.....",
        "....OsggOsOO....",
        "...OsgtccvbtO...",
        "...OOOOOOOOOO..."
    ],
    "dos": [
        "....OOO.....OOO....",
        "...OhgsO...OKdgO...",
        "..OlgggsOOOlhggsO..",
        "..OlgggggggglggsO..",
        "..OgggggdggggggsO..",
        ".OOdggggggggggggsO.",
        ".OdggggggggggggggO.",
        ".OggggggggggggggsO.",
        "..OgggsssssssggsO..",
        "..OuwtwwwwwwwwtuO..",
        "..OuvwttwwwwwwvuOO.",
        ".OgOuuuvwwwvuKvOgO.",
        "OggOOwwOOOOOtwuOggO",
        "OctKwOOwwwwwOOOOtcO",
        "OctOOwOuwcwuOvOOtcO",
        ".OOOsOOvuwuvOOsOOO.",
        "....gsOvvvvvOsg....",
        "...OOgsOOOOOsgOO...",
        "..OdchtgO.OgtrctO..",
        "..OOOOOOO.OOOOOOO.."
    ],
    "gauche": [
        ".....OOO........",
        "....OllgO.......",
        "...OayyugOO.....",
        "...OyiOeuggO....",
        ".OlOyOOeuggsO...",
        "OlggaeeasggggO..",
        "ObhgguugggggssO.",
        "OcccgggggggggsO.",
        ".OccccccbggggsO.",
        "..OKccccccggsO..",
        "...OObOvtttwvO..",
        "...OwvtwttwwuuO.",
        "...OKvOOOOOuOOO.",
        "....OwOggsOOuwwO",
        "....vOcbgsvOvurO",
        "....tObbbtuOvvuO",
        "....OutvcOsOuuO.",
        ".....OuOOsuOOO..",
        "....OOuOggsO....",
        "...OdcvccrgsO...",
        "...OOOOOOOOOO..."
    ]
};

  for (const rows of Object.values(SOURCE_VIEWS)) Object.freeze(rows);
  Object.freeze(SOURCE_VIEWS);

  const DIR = Object.freeze({ NORTH: 0, EAST: 1, SOUTH: 2, WEST: 3 });
  const ENGINE_DIRECTIONS = Object.freeze(['dos', 'droite', 'face', 'gauche']);
  const SHEET_DIRECTIONS = Object.freeze(['face', 'droite', 'dos', 'gauche']);
  const ANCHOR = Object.freeze({ x: 40, y: 52 });
  const NATIVE_ANCHOR = Object.freeze({ x: 24, y: 36 });
  const CLIPS = Object.freeze({
    idle: Object.freeze({ frames: 8, durations: Object.freeze([1300, 220, 380, 320, 650, 100, 130, 1200]), loop: true, stride: null }),
    walk: Object.freeze({ frames: 8, durations: Object.freeze([63, 62, 63, 62, 63, 62, 63, 62]), loop: true, stride: 18 })
  });
  const RGBA = Object.fromEntries(Object.entries(PALETTE).map(([k, hex]) =>
    [k, Object.freeze([parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16), 255])]
  ));
  Object.freeze(RGBA);

  function finite(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(label + ' doit être un nombre fini.');
    return value;
  }
  function directionName(dir = DIR.SOUTH) {
    if (Number.isInteger(dir) && dir >= 0 && dir <= 3) return ENGINE_DIRECTIONS[dir];
    if (typeof dir === 'string' && Object.hasOwn(SOURCE_VIEWS, dir)) return dir;
    throw new RangeError('Direction attendue : 0..3, face, droite, dos ou gauche.');
  }
  function clipInfo(action) {
    if (!Object.hasOwn(CLIPS, action)) throw new RangeError('Animation non dessinée : ' + String(action));
    return CLIPS[action];
  }
  function frameIndex(action, frame) {
    const clip = clipInfo(action);
    if (!Number.isInteger(frame) || frame < 0 || frame >= clip.frames) {
      throw new RangeError('Image hors animation : ' + action + '/' + String(frame));
    }
    return frame;
  }
  /** En jeu, la marche suit la distance réellement parcourue, pas le temps passé contre un mur. */
  function frameAt(action, seconds = 0, distancePx) {
    const clip = clipInfo(action);
    finite(seconds, 'seconds');
    const duration = clip.durations.reduce((a,b) => a+b, 0);
    let ms;
    if (clip.stride !== null && distancePx !== undefined) {
      finite(distancePx, 'distancePx');
      ms = ((distancePx % clip.stride + clip.stride) % clip.stride) / clip.stride * duration;
    } else {
      ms = Math.max(0, seconds) * 1000;
      ms = clip.loop ? ms % duration : Math.min(ms, duration - 0.001);
    }
    for (let frame = 0; frame < clip.frames; frame++) {
      if (ms < clip.durations[frame]) return frame;
      ms -= clip.durations[frame];
    }
    return clip.frames - 1;
  }

  class PixelBuffer {
    constructor(width, height) {
      this.width = width; this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
    set(x, y, key) {
      if (key === '.') return;
      if (!Number.isInteger(x) || !Number.isInteger(y)) throw new TypeError('Coordonnée de pixel non entière.');
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) throw new RangeError('Le dessin dépasse son cadre.');
      const color = RGBA[key];
      if (!color) throw new RangeError('Couleur inconnue : ' + key);
      this.data.set(color, (y * this.width + x) * 4);
    }
    stamp(rows, x, y) {
      rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) this.set(x+i, y+j, row[i]); });
    }
  }

  /**
   * Articulation sur la grille native : tête, tronc, bras et appuis indépendants.
   * Les SOURCES sont INCHANGÉES. Les déplacements sont des pixels entiers.
   * Le col et le sac restent sur le tronc ; raccord de cou dessiné derrière la tête.
   * Pas de rotation de bitmap, de miroir, de flou, ni d'échelle flottante.
   */
  const IDLE_PATCHES = {
    face: {
      breath: [[5,13,'cc'], [6,14,'cc'], [6,15,'bd']],
      blink: [[3,2,'lgs'], [14,2,'gs'], [3,3,'OOO'], [13,3,'OOO'], [3,4,'gss'], [13,4,'sgg']]
    },
    droite: {
      breath: [[8,8,'cc'], [7,9,'cc']],
      blink: [[8,2,'lggs'], [8,3,'OOOO'], [8,4,'ggss'], [8,5,'ggsg']]
    },
    dos: { breath: [[7,12,'tw'], [8,14,'b']], blink: [] },
    gauche: {
      breath: [[4,8,'cc'], [6,9,'cc']],
      blink: [[4,2,'llgs'], [4,3,'OOOO'], [4,4,'gggs'], [4,5,'ggsg']]
    }
  };
  const SEX = 'male';
  function deepFreeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(deepFreeze); Object.freeze(value);
    }
    return value;
  }
  const POSES = deepFreeze({
    idle: [
      {body:0,head:0,arms:0,blink:false,breath:false},
      {body:0,head:-1,arms:0,blink:false,breath:true},
      {body:0,head:-1,arms:-1,blink:false,breath:true},
      {body:0,head:-1,arms:0,blink:false,breath:true},
      {body:0,head:0,arms:0,blink:false,breath:false},
      {body:0,head:0,arms:0,blink:true,breath:false},
      {body:0,head:0,arms:0,blink:false,breath:false},
      {body:0,head:0,arms:0,blink:false,breath:false}
    ],
    // Contact, amorti, passage, remontée ; puis l'autre appui.
    walk: [
      {body:0,head:0,swing:-2,nearX: 2,farX:-2,nearY: 0,farY:-1},
      {body:1,head:0,swing:-1,nearX: 1,farX:-1,nearY: 0,farY:-1},
      {body:1,head:1,swing: 0,nearX:-1,farX: 1,nearY: 0,farY:-2},
      {body:0,head:0,swing: 1,nearX:-2,farX: 2,nearY: 0,farY:-1},
      {body:0,head:0,swing: 2,nearX:-2,farX: 2,nearY:-1,farY: 0},
      {body:1,head:0,swing: 1,nearX:-1,farX: 1,nearY:-1,farY: 0},
      {body:1,head:1,swing: 0,nearX: 1,farX:-1,nearY:-2,farY: 0},
      {body:0,head:0,swing:-1,nearX: 2,farX:-2,nearY:-1,farY: 0}
    ]
  });
  const SIDE_FEET = deepFreeze({
    droite:{far:['..OsO..','OsgtbO.','OOOOOO.'],near:['..OgO..','.OgbccO','.OOOOOO']},
    gauche:{far:['..OsO..','.ObtgsO','.OOOOOO'],near:['..OgO..','OccbgO.','OOOOOO.']}
  });

  // Les bras sont détourés géométriquement, pas par couleur (le cuir et la peau
  // partagent parfois des teintes). On conserve donc les motifs et la besace.
  function partAt(view,x,y) {
    const side=view==='droite'||view==='gauche';
    if(y<(side?10:9))return 'head';
    if(y>=SOURCE_VIEWS[view].length-3)return 'feet';
    if(!side && y>=11 && y<=15) {
      if(x <= (SEX==='femelle'?4:3))return 'left';
      if(x >= (SEX==='femelle'?14:15))return 'right';
    }
    if(side) {
      if(view==='droite') {
        if(y===12&&x>=6&&x<=7)return 'near';
        if(y>=13&&y<=(SEX==='femelle'?16:17)&&x>=5&&x<=(SEX==='femelle'?9:10))return 'near';
      } else {
        if(y===12&&x>=8&&x<=9)return 'near';
        if(y>=13&&y<=(SEX==='femelle'?16:17)&&x>=6&&x<=10)return 'near';
        if(SEX==='male'&&y>=14&&y<=16&&x===5)return 'near';
      }
    }
    return 'body';
  }
  const RIGS = {};
  for(const [view,rows] of Object.entries(SOURCE_VIEWS)) {
    const rig={head:[],body:[],feet:[],left:[],right:[],near:[]};
    rows.forEach((row,y)=>Array.from(row).forEach((key,x)=>{
      if(key!=='.')rig[partAt(view,x,y)].push([x,y,key]);
    }));
    RIGS[view]=rig;
  }
  deepFreeze(RIGS);
  function stampPart(buffer,pixels,x,y,dx=0,dy=0) {
    for(const [px,py,key] of pixels)buffer.set(x+px+dx,y+py+dy,key);
  }
  function line(buffer,ax,ay,bx,by,key) {
    const dx=Math.abs(bx-ax),sx=ax<bx?1:-1,dy=-Math.abs(by-ay),sy=ay<by?1:-1;
    let err=dx+dy;
    for(;;){buffer.set(ax,ay,key);if(ax===bx&&ay===by)break;
      const e=2*err;if(e>=dy){err+=dy;ax+=sx;}if(e<=dx){err+=dx;ay+=sy;}}
  }
  function leg(buffer,ax,ay,bx,by,far) {
    for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])line(buffer,ax+dx,ay+dy,bx+dx,by+dy,'O');
    line(buffer,ax,ay,bx,by,far?'s':'g');
  }
  // Epaule fixe ; coude et poignet suivent des translations quantifiées.
  // Les rares lignes supplémentaires sont reliées sans inventer de couleurs.
  function arm(buffer,pixels,x,y,handX,handY) {
    if(!pixels.length)return;
    if(handX===0&&handY===0){stampPart(buffer,pixels,x,y);return;}
    const minY=Math.min(...pixels.map(p=>p[1])),maxY=Math.max(...pixels.map(p=>p[1]));
    const rows=new Map();for(const p of pixels){if(!rows.has(p[1]))rows.set(p[1],[]);rows.get(p[1]).push(p);}
    let previous=null;
    for(let py=minY;py<=maxY;py++) {
      const row=rows.get(py)||[],t=Math.min(1,(py-minY)/Math.max(1,maxY-minY-2));
      const dx=Math.round(handX*t),dy=Math.round(handY*t),yy=py+dy;
      if(previous && yy>previous.yy+1) {
        for(let fill=previous.yy+1;fill<yy;fill++) {
          const f=(fill-previous.yy)/(yy-previous.yy);
          const between=Math.round(previous.dx+(dx-previous.dx)*f);
          for(const [px,_sy,key] of previous.row)buffer.set(x+px+between,y+fill,key);
        }
      }
      for(const [px,_sy,key] of row)buffer.set(x+px+dx,y+yy,key);
      previous={yy,dx,row};
    }
  }
  function neck(buffer,view,x,y,bodyY,headY) {
    const side=view==='droite'||view==='gauche',bottom=side?9:8;
    const left=side?(view==='droite'?6:5):6;
    const right=side?(view==='droite'?10:9):12;
    for(let yy=bottom+headY;yy<=bottom+1+bodyY;yy++) {
      for(let xx=left;xx<=right;xx++) {
        const color=(xx===left||xx===right)?'O':view==='dos'?(xx<9?'g':'s'):(xx===right-1?'b':'c');
        buffer.set(x+xx,y+yy,color);
      }
    }
  }
  function profileUnderpaint(buffer,view,rig,x,y) {
    // Remplit exclusivement les zones du tronc autrefois masquées par le bras.
    // Ces pixels sont cachés à nouveau par le bras dans la pose neutre.
    for(const [px,py] of rig.near) {
      if(py<13)continue;
      const min=view==='droite'?5:6,max=view==='droite'?10:10;
      if(px<min||px>max)continue;
      const edge=(view==='droite'?px===max:px===min);
      buffer.set(x+px,y+py,edge?'u':px<=7?'w':'v');
    }
  }
  function feet(buffer,view,rig,x,y,pose,walking) {
    if(!walking){stampPart(buffer,rig.feet,x,y);return;}
    const side=view==='droite'||view==='gauche',top=SOURCE_VIEWS[view].length-3;
    if(side) {
      const sign=view==='droite'?1:-1;
      const farX=(view==='droite'?4:5)+sign*pose.farX;
      const nearX=(view==='droite'?6:3)+sign*pose.nearX;
      leg(buffer,x+(view==='droite'?6:9),y+top-1+pose.body,x+farX+3,y+top+pose.farY,true);
      buffer.stamp(SIDE_FEET[view].far,x+farX,y+top+pose.farY);
      leg(buffer,x+(view==='droite'?9:6),y+top-1+pose.body,x+nearX+3,y+top+pose.nearY,false);
      buffer.stamp(SIDE_FEET[view].near,x+nearX,y+top+pose.nearY);
    } else {
      // Un appui au sol ; l'autre pied se lève au passage. Pas de translation
      // horizontale globale ni de recentrage à partir de la bounding box.
      for(const [px,py,key] of rig.feet){
        const dy=px<9?pose.nearY:pose.farY;
        const dx=0;
        buffer.set(x+px+dx,y+py+dy,key);
      }
    }
  }
  function animate(buffer,view,action,frame,x,y) {
    const rig=RIGS[view],pose=POSES[action][frame],walk=action==='walk';
    const side=view==='droite'||view==='gauche';
    // Assure la stricte identité de la pose de référence et sa lisibilité au repos.
    if(!walk && !pose.head && !pose.arms && !pose.blink && !pose.breath) {
      buffer.stamp(SOURCE_VIEWS[view],x,y);return;
    }
    feet(buffer,view,rig,x,y,pose,walk);
    // De profil, le bras lointain reste occulté par le tronc et la besace,
    // conformément au dessin de référence : pas de fragment ajouté en bordure.
    neck(buffer,view,x,y,pose.body,pose.head);
    if(side)profileUnderpaint(buffer,view,rig,x,y+pose.body);
    stampPart(buffer,rig.body,x,y,0,pose.body);
    if(side) {
      const q=view==='droite'?1:-1;
      arm(buffer,rig.near,x,y+pose.body,walk?pose.swing*q:0,walk?(Math.abs(pose.swing)===2?-1:0):pose.arms);
    } else {
      const s=walk?Math.round(pose.swing/2):0;
      const projected=view==='face'?s:-s;
      arm(buffer,rig.left,x,y+pose.body,walk?projected:0,walk?projected:pose.arms);
      arm(buffer,rig.right,x,y+pose.body,walk?projected:0,walk?-projected:pose.arms);
    }
    stampPart(buffer,rig.head,x,y,0,pose.head);
    if(!walk && pose.breath) {
      for(const [dx,dy,keys] of IDLE_PATCHES[view].breath) {
        buffer.stamp([keys],x+dx,y+dy+(dy<(side?10:9)?pose.head:pose.body));
      }
    }
    if(!walk && pose.blink) {
      for(const [dx,dy,keys] of IDLE_PATCHES[view].blink)buffer.stamp([keys],x+dx,y+dy+pose.head);
    }
  }

  /** Retourne un tampon RGBA indépendant ; formats engine 80px et native 48px. */
  function raster(action = 'idle', dir = DIR.SOUTH, frame = 0, format = 'engine') {
    const view=directionName(dir);frameIndex(action,frame);
    if(format!=='engine'&&format!=='native')throw new RangeError('Format attendu : engine ou native.');
    const size=format==='engine'?80:48,anchor=format==='engine'?ANCHOR:NATIVE_ANCHOR;
    const rows=SOURCE_VIEWS[view],x=anchor.x-Math.floor(rows[0].length/2),y=anchor.y-rows.length+1;
    const buffer=new PixelBuffer(size,size);animate(buffer,view,action,frame,x,y);
    return {width:size,height:size,anchor,data:buffer.data};
  }

  function defaultCanvasFactory(width, height) {
    let cv;
    if (typeof document !== 'undefined') cv = document.createElement('canvas');
    else if (typeof OffscreenCanvas !== 'undefined') cv = new OffscreenCanvas(width, height);
    else throw new Error('Fournir canvasFactory sous Node, ou utiliser raster() pour obtenir les pixels sans Canvas.');
    cv.width = width; cv.height = height; return cv;
  }

  class Atlas {
    constructor(options = {}) {
      this.canvasFactory = options.canvasFactory || defaultCanvasFactory;
      this.maxFrames = options.maxFrames === undefined ? 64 : options.maxFrames;
      if (!Number.isInteger(this.maxFrames) || this.maxFrames < 1 || this.maxFrames > 256) throw new RangeError('maxFrames : entier de 1 à 256.');
      this.cache = new Map();
    }
    get(action = 'idle', dir = DIR.SOUTH, frame = 0) {
      const view = directionName(dir); frameIndex(action,frame);
      const key = action + ':' + view + ':' + frame;
      if (this.cache.has(key)) {
        const value = this.cache.get(key); this.cache.delete(key); this.cache.set(key,value); return value;
      }
      const pixels = raster(action,view,frame), cv = this.canvasFactory(80,80);
      cv.width = cv.height = 80;
      const c = cv.getContext('2d');
      if (!c) throw new Error('Canvas 2D indisponible.');
      const image = c.createImageData(80,80); image.data.set(pixels.data); c.putImageData(image,0,0);
      this.cache.set(key,cv);
      while (this.cache.size > this.maxFrames) this.cache.delete(this.cache.keys().next().value);
      return cv;
    }
    /**
     * Dessine sur le contexte monde déjà transformé par le Renderer.
     * L'acteur fournit x, y, dir, alpha (facultatif), z (facultatif).
     * state : { action, elapsed, distance, frame }. frame est un index explicite facultatif.
     * Aucune ombre intégrée : utiliser l'ombre du Renderer, une seule fois.
     */
    draw(ctx, actor, time = 0, state = {}) {
      if (!ctx || typeof ctx.drawImage !== 'function') throw new TypeError('Contexte Canvas 2D attendu.');
      if (!actor) throw new TypeError('Acteur attendu.');
      finite(actor.x,'actor.x'); finite(actor.y,'actor.y'); finite(time,'time');
      const z = actor.z === undefined ? 0 : finite(actor.z,'actor.z');
      const alpha = actor.alpha === undefined ? 1 : Math.max(0,Math.min(1,finite(actor.alpha,'actor.alpha')));
      if (alpha === 0) return null;
      const action = state.action || 'idle';
      const frame = state.frame === undefined ? frameAt(action, state.elapsed === undefined ? time : state.elapsed, state.distance) : frameIndex(action,state.frame);
      const image = this.get(action, actor.dir === undefined ? DIR.SOUTH : actor.dir, frame);
      ctx.save();
      try {
        ctx.imageSmoothingEnabled = false; ctx.globalAlpha *= alpha;
        ctx.drawImage(image, Math.round(actor.x)-ANCHOR.x, Math.round(actor.y-z)-ANCHOR.y);
      } finally { ctx.restore(); }
      actor._img = image;
      return image;
    }
    /** Aperçu uniquement : agrandissement entier, sans changer les dimensions du dessin. */
    preview(ctx, action, dir, frame, footX, footY, scale = 1) {
      if (!Number.isInteger(scale) || scale < 1) throw new RangeError('Agrandissement entier positif attendu.');
      finite(footX,'footX'); finite(footY,'footY');
      const image = this.get(action,dir,frame);
      ctx.save();
      try {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image,Math.round(footX)-ANCHOR.x*scale,Math.round(footY)-ANCHOR.y*scale,80*scale,80*scale);
      } finally { ctx.restore(); }
    }
    clear() { this.cache.clear(); }
  }

  /** Même organisation que les planches du dépôt : action/direction par ligne, pose par colonne. */
  function buildSheet(format = 'engine') {
    if (format !== 'engine' && format !== 'native') throw new RangeError('Format inconnu.');
    const cell = format === 'engine' ? 80 : 48, columns = 8, rows = 8;
    const result = { width:columns*cell, height:rows*cell, data:new Uint8ClampedArray(columns*cell*rows*cell*4) };
    Object.keys(CLIPS).forEach((action, a) => SHEET_DIRECTIONS.forEach((dir,d) => {
      for (let frame=0;frame<CLIPS[action].frames;frame++) {
        const image=raster(action,dir,frame,format), x=frame*cell, y=(a*4+d)*cell;
        for (let j=0;j<cell;j++) result.data.set(image.data.subarray(j*cell*4,(j+1)*cell*4),((y+j)*result.width+x)*4);
      }
    }));
    return result;
  }
  function manifest() {
    const clips=[];
    Object.entries(CLIPS).forEach(([action,clip],a) => SHEET_DIRECTIONS.forEach((dir,d) => clips.push({
      action, direction:dir, engineDirection:ENGINE_DIRECTIONS.indexOf(dir), row:a*4+d,
      frames:clip.frames, durations:[...clip.durations], loop:clip.loop, strideWorldPixels:clip.stride,
      rectangles:Array.from({length:clip.frames},(_,f)=>[f*80,(a*4+d)*80,80,80])
    })));
    return {
      id:'batracien', version:2, authoring:'JavaScript — explicit pixel grids',
      reference:'Approved frog/toad adventurer sheet from this conversation; native-grid reconstruction, not a pixel-identical reduction of its uneven enlarged blocks.',
      auditedRepository:'garwiglino/conan', auditedCommit:'b598bc103c61112c4e81eac29e58f37653213de8',
      cell:[80,80], anchor:[40,52], nativeCell:[48,48], nativeAnchor:[24,36], nativeOffset:[16,16],
      sheet:{file:'batracien.png',size:[640,640],columns:8,rows:8},
      staticSheet:{file:'batracien-quatre-vues.png',size:[320,80],directions:[...SHEET_DIRECTIONS]},
      idleVisibleSize:{face:[19,20],droite:[16,21],dos:[19,20],gauche:[16,21]},
      alpha:'binary 0/255', lighting:'screen upper-left; four independently authored directions',
      palette:{...PALETTE}, clips, animationRevision:'Articulated v2: independent head, attached arms, trunk and legs; 8 idle and 8 walk frames.',
      timing:{walkMs:500,strideWorldPixels:18,idleMs:4300},
      sourceDesignPreserved:true, neutralPoseExact:true,
      scope:'Graphic asset only: idle and walk. No attack, death, AI, statistics, collisions or spawn added.'
    };
  }

  const installations = new WeakMap();
  /**
   * Adaptateur optionnel, réversible : CharacterAtlas.draw(ctx, kind, actor, time).
   * Appeler après la définition de CharacterAtlas ; ne touche qu'au kind "batracien".
   * L'installation n'ajoute aucun acteur au monde et ne modifie aucune collision.
   */
  function installCharacterAtlas(target, options = {}) {
    const proto = typeof target === 'function' ? target.prototype : target;
    if (!proto || typeof proto.draw !== 'function') throw new TypeError('CharacterAtlas ou son instance est attendu.');
    if (installations.has(proto)) return installations.get(proto);
    const original = proto.draw, atlas = options.atlas || new Atlas(options);
    const stateFor = options.stateFor || ((actor,time) => actor.batracien || {action:'idle',elapsed:time});
    function wrapped(ctx,kind,actor,time=0) {
      if (kind !== 'batracien') return original.apply(this,arguments);
      return atlas.draw(ctx,actor,time,stateFor(actor,time));
    }
    proto.draw = wrapped;
    const handle = { atlas, uninstall() {
      if (proto.draw !== wrapped) throw new Error('Un autre adaptateur a été installé depuis ; désinstallation automatique refusée.');
      proto.draw = original; installations.delete(proto); atlas.clear();
    }};
    installations.set(proto,handle); return handle;
  }

  // Les fautes dans une grille sont détectées au chargement, avant la création d'un Canvas.
  for (const [view,rows] of Object.entries(SOURCE_VIEWS)) {
    const width=rows[0].length;
    for (const row of rows) {
      if (row.length !== width) throw new Error('Grille non rectangulaire : ' + view);
      for (const key of row) if (key !== '.' && !Object.hasOwn(PALETTE,key)) throw new Error('Palette manquante : '+key);
    }
  }
  return Object.freeze({ version:2, DIR, ANCHOR, NATIVE_ANCHOR, CLIPS, PALETTE, SOURCE_VIEWS,
    POSES, RIGS, directionName, frameAt, raster, Atlas, buildSheet, manifest, installCharacterAtlas });
});
