const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createCanvas}=require('@napi-rs/canvas');
const context=vm.createContext({Renderer:function(){}});vm.runInContext(fs.readFileSync(path.join(__dirname,'../scripts/interaction-ui.js'),'utf8')+';globalThis.api={dialoguePanelGeometry,npcNameplateMetrics};',context);const api=context.api;
test('conversation geometry reserves a separate footer and stays fixed for every line and choice state',()=>{
 for(const [width,height,safe]of [[568,320,{}],[667,375,{}],[844,390,{l:44,r:44,b:21}],[932,430,{l:44,r:44,b:21}]]){
  const input={width,height,safe,hudBottom:44},a=api.dialoguePanelGeometry(input),b=api.dialoguePanelGeometry({...input,line:'Un texte très long',choosing:true});
  assert.deepEqual(a,b);assert.ok(a.left>=(safe.l||0));assert.ok(a.left+a.width<=width-(safe.r||0));assert.ok(a.top+a.height+10<=height-(safe.b||0)-8-a.footerHeight);assert.ok(a.height>=48);assert.ok(a.footerHeight>=104);
 }
});
test('NPC nameplates keep the same readable screen size across world zooms and fit long labels',()=>{
 const c=createCanvas(400,100).getContext('2d');
 for(const textScale of [.85,1,1.25])for(const cssScale of [1.2,2,3.5]){
  const m=api.npcNameplateMetrics(c,'SENTINELLE DU GRAND CANAL DES MARÉES',cssScale,textScale);
  assert.ok(Math.abs(m.font*cssScale-10.5*textScale)<.001);assert.ok(m.width*cssScale<=122.01);assert.ok(m.height*cssScale<=20);assert.ok(m.copy.endsWith('…'));
 }
});
