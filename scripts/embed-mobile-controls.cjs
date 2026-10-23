'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),read=n=>fs.readFileSync(path.join(root,n),'utf8');
let html=read('index.html');
function section(label,source,start,end){const begin='// BEGIN '+label,finish='// END '+label,block=begin+'\n'+source+'\n'+finish+'\n';if(html.includes(begin)){const a=html.indexOf(begin),b=html.indexOf(finish,a);if(b<0)throw Error('Missing '+finish);html=html.slice(0,a)+block+html.slice(b+finish.length).replace(/^\n/,'');}else{const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<0)throw Error('Missing mobile integration anchor '+label);html=html.slice(0,a)+block+html.slice(b);}}
// The old tracker-dependent function must not override the shared layout helper.
const oldStick=html.includes('// BEGIN PHONE VIEWPORT')?-1:html.indexOf('function layoutStick(){const scr=');if(oldStick>=0){const end=html.indexOf('function rewardText',oldStick);if(end<0)throw Error('Missing tracker layout end');html=html.slice(0,oldStick)+html.slice(end);}
section('PHONE VIEWPORT',read('scripts/mobile-viewport.js'),'const PANEL=150;','const titleScene=');
section('PHONE TOUCH INPUT',read('scripts/mobile-controls.js'),'const touchKeys=new Map();',"$('dialogueNext').addEventListener");
const begin='/* BEGIN PHONE CONTROLS */',end='/* END PHONE CONTROLS */',css=begin+'\n'+read('scripts/mobile-controls.css')+'\n'+end+'\n';
if(html.includes(begin)){const a=html.indexOf(begin),b=html.indexOf(end,a);html=html.slice(0,a)+css+html.slice(b+end.length).replace(/^\n/,'');}else html=html.replace('</style>',()=>css+'</style>');
fs.writeFileSync(path.join(root,'index.html'),html);fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
console.log('Embedded stable phone viewport, anchored controls and forgiving touch input.');
