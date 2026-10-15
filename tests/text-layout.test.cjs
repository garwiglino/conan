const {test}=require('node:test'),assert=require('node:assert/strict');
const {loadGame,canvas}=require('./game-harness.cjs');

test('text preferences clamp, survive reload, and tolerate unavailable storage',async()=>{
 const {TextSettings}=await loadGame();const values=new Map(),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
 const settings=new TextSettings(storage);assert.equal(settings.percent,100);
 assert.equal(settings.set(900),125);assert.equal(new TextSettings(storage).percent,125);
 assert.equal(settings.set(-100),85);assert.equal(new TextSettings(storage).percent,85);
 assert.equal(settings.set(113),115);assert.equal(settings.set(NaN),100);
 values.set('hearthreaver-text-size','broken');assert.equal(new TextSettings(storage).percent,100);
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.equal(new TextSettings(blocked).set(120),120);
});

test('canvas text measurement and drawing share the global scale, with bounded line wrapping',async()=>{
 const {textSettings,text,textW,canvasLines,Renderer}=await loadGame(),ctx=canvas.createCanvas(400,120).getContext('2d');
 const widths=[];for(const percent of [85,100,125]){
  textSettings.set(percent,false);const measured=textW(ctx,'LES ANCIENNES RUINES');widths.push(measured);
  assert.equal(text(ctx,'LES ANCIENNES RUINES',0,0),measured);
  ctx.font=8*textSettings.scale+'px monospace';
  const message='UNE LONGUE PHRASE AVEC UNMOTSANSAUCUNESPACEPOURTESTERLESRETOURS';
  const lines=canvasLines(ctx,message,80);assert.ok(lines.length>2);
  assert.ok(lines.every(line=>ctx.measureText(line).width<=80));
  assert.equal(lines.join('').replace(/ /g,''),message.replace(/ /g,''));
  const renderer={c:ctx};Renderer.prototype.resize.call(renderer,220,160,{l:0,r:0,t:0,b:0});
  assert.equal(renderer.hudRows,1);assert.equal(renderer.top,22);
  assert.ok(textSettings.trackerHeight>=2*14*textSettings.scale+15);
 }
 assert.ok(widths[0]<widths[1]&&widths[1]<widths[2]);assert.ok(Math.abs(widths[2]/widths[0]-125/85)<.03);
});
