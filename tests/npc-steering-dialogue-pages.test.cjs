const {test,before}=require('node:test'),assert=require('node:assert/strict');
const {loadGame}=require('./game-harness.cjs');let a;
before(async()=>{a=await loadGame();});
function walker(){const g=new a.Game();g.solid=()=>false;g.party=[];return g;}
test('NPCs follow arbitrary angles at normalized speed and adjust a target within its tile',()=>{
 const g=walker(),n={id:'steering',x:8,y:8},to={x:136,y:72};g.walkNpc(n,to,.25);
 assert.ok(Math.abs(n.y-8-(n.x-8)/2)<1e-8);assert.ok(Math.abs(Math.hypot(n.x-8,n.y-8)-8)<1e-8);
 to.y=79;for(let i=0;i<100;i++)g.walkNpc(n,to,.1);assert.ok(Math.hypot(n.x-to.x,n.y-to.y)<.01);
});
test('a long NPC step cannot tunnel through a newly closed wall',()=>{
 const g=walker(),n={id:'wall',x:8,y:8},to={x:136,y:72};g.walkNpc(n,to,.01);
 g.solid=(x,y,r)=>x+r>=45&&x-r<=49;g.walkNpc(n,to,8);assert.ok(n.x<45);assert.equal(n.path.length,0);
});
test('smoothed paths detour around corners without entering solid terrain',()=>{
 const g=walker(),n={id:'corner',x:8,y:8},to={x:120,y:80};
 g.solid=(x,y,r)=>x+r>40&&x-r<72&&y+r>-16&&y-r<64;
 for(let i=0;i<150;i++){g.walkNpc(n,to,.08);assert.equal(g.solid(n.x,n.y,4),false);}
 assert.ok(Math.hypot(n.x-to.x,n.y-to.y)<2);
});
function paginate(g,max){g.prepareDialoguePage(String(max),s=>s.length<=max);}
test('Next reveals the current page, then the rest of that reply, before the next reply or callback',()=>{
 const g=new a.Game();let ended=0;g.talk('Test',['Un deux trois quatre cinq six sept huit.','Fin.'],null,40,()=>ended++);paginate(g,15);
 let joined='';while(g.dialogue.index===0){const text=g.dialogueText();assert.ok(text.length<=15);joined+=text;
  g.advanceDialogue();assert.equal(g.dialogue.index,0);assert.equal(g.dialogueText(),text);
  g.advanceDialogue();paginate(g,15);
 }assert.equal(joined,'Un deux trois quatre cinq six sept huit.');assert.equal(ended,0);
 g.advanceDialogue();g.advanceDialogue();assert.equal(g.dialogue,null);assert.equal(ended,1);
});
test('long choice prompts gate choices until the remaining prompt pages have been shown',()=>{
 const g=new a.Game();let chosen=0;g.talk('Test',['Intro'],null,40,null,{prompt:'Un deux trois quatre cinq six sept.',options:[{label:'Oui',lines:['Merci'],end:true,act:()=>chosen++}]});
 g.dialogue.shown=1e9;g.advanceDialogue();paginate(g,12);g.choose(0);assert.equal(chosen,0);
 while(g.dialogueHasMore()){g.dialogue.shown=1e9;g.advanceDialogue();}
 g.choose(0);assert.equal(chosen,1);assert.equal(g.dialogueText(),'Merci');
});
test('resizing retains the current reply offset and oversized Unicode tokens make progress',()=>{
 const g=new a.Game();g.talk('Test',['Un deux trois quatre cinq six sept huit.'],null);paginate(g,12);g.dialogue.shown=1e9;g.advanceDialogue();const start=g.dialogue.page.start;
 paginate(g,20);assert.equal(g.dialogue.page.start,start);assert.equal(g.dialogueText(),g.dialogue.lines[0].slice(start,g.dialogue.page.end));
 g.talk('Test',['😀'.repeat(40)],null);paginate(g,9);assert.equal(g.dialogueText().length,8);assert.ok(!/[\uD800-\uDBFF]$/.test(g.dialogueText()));
});
test('an open route needs one planning sweep instead of probing every intermediate tile segment',()=>{
 const g=walker(),n={id:'open-sweep',x:8,y:8},to={x:568,y:568},sweep=g.npcSegmentFree;let calls=0;
 g.npcSegmentFree=function(...args){calls++;return sweep.apply(this,args);};g.walkNpc(n,to,.04);
 assert.ok(calls<=2);assert.equal(n.path.length,1);
});
test('a quest panel opens once after all reply pages, and declining starts a fresh reply',()=>{
 const g=new a.Game();g.talk('Test',['Intro'],null,40,null,{prompt:'Question',options:[{label:'Quête',lines:['Un deux trois quatre cinq six sept huit.'],panel:{id:'pagination-test',mode:'offer'}}]});
 g.dialogue.choosing=true;g.choose(0);paginate(g,12);g.events=[];
 while(g.dialogueHasMore()){g.dialogue.shown=1e9;g.advanceDialogue();assert.ok(!g.dialogue.waitPanel);}
 g.dialogue.shown=1e9;g.advanceDialogue();assert.ok(g.dialogue.waitPanel);g.advanceDialogue();
 assert.equal(g.events.filter(e=>e.type==='questpanel').length,1);g.panelDone(false);paginate(g,12);assert.equal(g.dialogue.page.start,0);assert.ok(!g.dialogue.waitPanel);
});
