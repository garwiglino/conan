const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
function boot(reduced=false){
 const dom=new JSDOM('<div id="intro" tabindex="0"><div class="studio-mark"></div></div><div id="menu"><button>Jouer</button></div>',{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
 w.eval(fs.readFileSync(path.join(__dirname,'../scripts/startup.js'),'utf8')+';window.StudioIntro=StudioIntro;');
 let wakes=0,finishes=0,plays=0;const root=w.document.querySelector('#intro'),menu=w.document.querySelector('#menu');
 menu.querySelector('button').addEventListener('click',()=>plays++);
 const intro=new w.StudioIntro(root,menu,{reduced,wake(){wakes++;},finished(){finishes++;}});
 return {dom,w,root,menu,intro,get wakes(){return wakes;},get finishes(){return finishes;},get plays(){return plays;}};
}
test('studio fades in, out to black, then reveals the menu without restarting audio',()=>{
 const a=boot();try{
  assert.equal(a.wakes,1);assert.equal(a.menu.inert,true);assert.equal(a.root.style.opacity,'1');assert.equal(a.intro.mark.style.opacity,'0');
  a.intro.update(.55);assert.ok(Number(a.intro.mark.style.opacity)>.4&&Number(a.intro.mark.style.opacity)<.6);
  a.intro.update(.8);assert.equal(a.intro.mark.style.opacity,'1');
  a.intro.update(1.7);assert.ok(Number(a.intro.mark.style.opacity)<.001);assert.equal(a.root.style.opacity,'1');
  a.intro.update(.5);assert.ok(Number(a.root.style.opacity)<.6);assert.equal(a.menu.inert,true);
  a.intro.update(.5);assert.equal(a.root.hidden,true);assert.equal(a.menu.inert,false);assert.equal(a.finishes,1);assert.equal(a.wakes,1);
  a.intro.update(10);assert.equal(a.finishes,1);
 }finally{a.dom.window.close();}
});
test('taps at every intro phase and keyboard skip consume the gesture before the menu',()=>{
 for(const elapsed of [0,.5,2.6,3.5])for(const keyboard of [false,true]){
  const a=boot();try{
   a.intro.update(elapsed);
   const event=keyboard?new a.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}):new a.w.Event('pointerdown',{bubbles:true,cancelable:true});
   a.root.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(a.wakes,2);
   a.menu.querySelector('button').click();assert.equal(a.plays,0);a.intro.update(.8);
   a.menu.querySelector('button').click();assert.equal(a.plays,0);assert.equal(a.finishes,1);assert.equal(a.menu.inert,false);
  }finally{a.dom.window.close();}
 }
});
test('hidden pages pause the introduction and reduced motion shortens its duration',()=>{
 const a=boot(true);try{
  Object.defineProperty(a.w.document,'hidden',{value:true,configurable:true});a.intro.update(10);assert.equal(a.intro.elapsed,0);
  Object.defineProperty(a.w.document,'hidden',{value:false});a.intro.update(2.6);assert.equal(a.intro.active,false);
 }finally{a.dom.window.close();}
});
