'use strict';
// Hearthreaver Kaldor art integration: modify only hero pixels and idle frame
// selection. Keeps physical swordPose(), frame durations, AI, hitboxes unchanged.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sprites/kaldor/kaldor-art.js'),'utf8');
const begin='// BEGIN KALDOR JAVASCRIPT PIXEL ART',end='// END KALDOR JAVASCRIPT PIXEL ART';
const original="if(kind==='hero')oracleHero(c,dir,state,frame,combo);";
const updated="if(kind==='hero')HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose);";
const originalIdle="if(kind==='guardian'&&state==='idle')frame=guardianFrame(actor.dir,'idle',time);";
const updatedIdle=originalIdle+"if(kind==='hero'&&state==='idle')frame=HearthreaverKaldorArt.idleFrame(time);";
const output=path.join(root,'index.html');
let html=fs.readFileSync(output,'utf8');
if(!html.includes(original)&&!html.includes(updated))throw Error('Kaldor rendering call missing. Check game version.');
if(!html.includes(originalIdle)&&!html.includes(updatedIdle))throw Error('CharacterAtlas idle hook missing.');
if(html.includes(original))html=html.replace(original,updated);
if(!html.includes(updatedIdle))html=html.replace(originalIdle,updatedIdle);
const block=begin+'\n'+source+'\n'+end;
if(html.includes(begin)){
 const st=html.indexOf(begin),fin=html.indexOf(end,st);
 if(fin<st)throw Error('Corrupt Kaldor sprite section.');
 html=html.slice(0,st)+block+html.slice(fin+end.length);
}else {
 if(html.split('// art.js').length!==2)throw Error('Unique art block insertion marker missing');
 html=html.replace('// art.js',block+'\n// art.js');
}
// Preserve existing engine source. Old oracleHero is left as readable fallback,
// and is never called for the new player; no combat code is rewritten.
fs.writeFileSync(output,html,'utf8');
const ios=html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,'');
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),ios,'utf8');
const marker='/*__KALDOR_POSE_CODE__*/';
const poseStart=html.indexOf('const SWORD_POSES='),poseEnd=html.indexOf('function greatsword(',poseStart);
if(poseStart<0||poseEnd<poseStart)throw Error('Game sword pose definitions missing.');
const template=fs.readFileSync(path.join(root,'art/kaldor-preview-template.html'),'utf8');
if(template.split(marker).length!==2)throw Error('Preview template marker missing or duplicated.');
fs.writeFileSync(path.join(root,'art/kaldor-preview.html'),template.replace(marker,html.slice(poseStart,poseEnd)),'utf8');
console.log('Kaldor pixel-art v2 embedded; 80×80 / (40,52); original combat preserved.');
