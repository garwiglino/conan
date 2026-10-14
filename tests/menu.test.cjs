const {test}=require('node:test'),fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),canvas=require('@napi-rs/canvas'),{RenderingAudioContext}=require('web-audio-engine');
const {html}=require('./game-harness.cjs');
test('main menu loads real saves, cancels overwrite, persists audio levels, and ends/resumes its session',async()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/\}\)\(\);\s*$/,'globalThis.testAPI={get state(){return state;},get game(){return game;},sound,titleScene,musicMode,begin,showTitle,pause,save,Sound,returnFromQuit,BITMAPS};})();');
 const dom=new JSDOM(html.replace(/<script>[\s\S]*?<\/script>/,''),{url:'https://hearthreaver.test/',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,map=new WeakMap();let raf,closes=0;
 const destroy=w.close.bind(w);w.close=()=>{closes++;};
 const proto=w.HTMLCanvasElement.prototype;
 for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(proto,key);Object.defineProperty(proto,key,{get:d.get,set(v){d.set.call(this,v);if(map.has(this))map.get(this).native[key]=v;},configurable:true});}
 proto.getContext=function(){if(!map.has(this)){const native=canvas.createCanvas(this.width||1,this.height||1),ctx=native.getContext('2d');const proxy=new Proxy(ctx,{get(target,k){if(k==='drawImage'||k==='createPattern')return (im,...args)=>target[k](map.get(im)?.native||im,...args);const v=target[k];return typeof v==='function'?v.bind(target):v;},set(t,k,v){t[k]=v;return true;}});map.set(this,{native,proxy});}return map.get(this).proxy;};
 proto.toDataURL=function(){this.getContext('2d');return map.get(this).native.toDataURL();};
 w.Image=canvas.Image;w.Path2D=canvas.Path2D;w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.requestAnimationFrame=cb=>{raf=cb;return 1;};
 w.AudioContext=class extends RenderingAudioContext{constructor(){super({sampleRate:8000});Object.defineProperty(this,'state',{value:'running'});}resume(){return Promise.resolve();}suspend(){return Promise.resolve();}decodeAudioData(b,ok){ok(this.createBuffer(1,1,8000));}};
 w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};
 const errors=[];w.addEventListener('error',e=>{errors.push(e.error?.stack||e.message);e.preventDefault();});
 const $=id=>w.document.getElementById(id),click=id=>$(id).click(),level=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('input',{bubbles:true}));};
 try{
  w.eval(script);const a=w.testAPI;await a.BITMAPS.promise;await a.titleScene.promise;assert.equal(a.state,'title');raf(100);
  assert.equal($('menuLoad').disabled,true);assert.equal($('titleAudio'),null);w.dispatchEvent(new w.Event('pagehide'));assert.equal(w.localStorage.getItem('conan-serpent-v1'),null);
  click('menuLoad');assert.equal(a.state,'title');
  click('menuOptions');raf(200);assert.equal(a.state,'options');assert.equal(a.sound.music.current.name,'title');
  level('musicVolume',37);level('sfxVolume',72);assert.equal(a.sound.musicVolume,.37);assert.equal(a.sound.sfxVolume,.72);
  click('musicToggle');assert.equal(a.sound.musicOn,false);click('sfxToggle');assert.equal(a.sound.sfxOn,false);
  const restored=new a.Sound();assert.equal(restored.musicVolume,.37);assert.equal(restored.sfxVolume,.72);assert.equal(restored.musicOn,false);assert.equal(restored.sfxOn,false);
  click('musicToggle');click('sfxToggle');raf(250);click('optionsBack');assert.equal(a.state,'title');
  click('menuNew');assert.equal(a.state,'playing');assert.ok(a.game.player.spawnFX>0);assert.equal(a.musicMode(),'ambient');raf(300);assert.equal(a.sound.music.current.name,'ambient');assert.ok(a.sound.music.retiring.some(s=>s.name==='title'));
  a.game.player.coins=42;a.pause();a.showTitle();assert.equal($('menuLoad').disabled,false);const original=a.game;
  click('menuNew');assert.equal(a.state,'confirm');assert.equal($('newGame').hidden,false);assert.equal($('newGame').textContent,'ANNULER');click('newGame');assert.equal(a.state,'title');assert.equal(a.game,original);
  click('menuLoad');assert.equal(a.state,'playing');assert.notEqual(a.game,original);assert.equal(a.game.player.coins,42);
  a.showTitle();click('menuQuit');assert.equal(a.state,'quit');assert.equal(closes,1);assert.equal(a.sound.music.current,null);click('returnFromQuit');assert.equal(a.state,'title');
  w.localStorage.setItem('conan-serpent-v1','{invalid');a.showTitle();assert.equal($('menuLoad').disabled,true);
  assert.deepEqual(errors,[]);
 }finally{destroy();}
});
