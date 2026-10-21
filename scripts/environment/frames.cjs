'use strict';
/* Grilles indexées -> cadres RGBA des fichiers Piskel (premier jet). */
const P=require('./palette.cjs');
const RGB=P.hexes.map(h=>h.length===9?null:[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
// Grille indexée -> RGBA, recadrée dans un cadre (w, h) au décalage (dx, dy).
function rgba(g,w=g.w,h=g.h,dx=0,dy=0){const out=new Uint8Array(w*h*4);for(let y=0;y<g.h;y++)for(let x=0;x<g.w;x++){const c=RGB[g.px[y*g.w+x]];if(!c)continue;const i=((y+dy)*w+x+dx)*4;out.set(c,i);out[i+3]=255;}return out;}
function heights(g){const out=new Uint8Array(g.w*g.h*4);for(let i=0;i<g.w*g.h;i++){const v=Math.round(Math.max(0,Math.min(1,g.ht[i]))*255);out.set([v,v,v,255],i*4);}return out;}
// Cadres communs à une famille de sprites : même ancre, marges transparentes.
function frame(list){const ax=Math.max(...list.map(s=>s.ax)),ay=Math.max(...list.map(s=>s.ay)),w=ax+Math.max(...list.map(s=>s.w-s.ax)),h=ay+Math.max(...list.map(s=>s.h-s.ay));return {w,h,ax,ay,place:s=>[ax-s.ax,ay-s.ay]};}
// Palette GIMP (Piskel : Palettes > Import), limitée à certaines rampes si demandé.
function gpl(name,ramps){const list=P.list.map((c,i)=>({...c,rgb:RGB[i+1]})).filter(c=>!ramps||ramps.includes(c.ramp));
 return 'GIMP Palette\nName: '+name+'\nColumns: 8\n#\n'+list.map(c=>c.rgb.map(v=>String(v).padStart(3)).join(' ')+'\t'+c.name).join('\n')+'\n';}
module.exports={RGB,rgba,heights,frame,gpl};
