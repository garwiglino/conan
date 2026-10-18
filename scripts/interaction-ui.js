// Codex / ChatGPT: stable conversation geometry and readable nearby nameplates.
function dialoguePanelGeometry({width,height,safe={l:0,r:0,t:0,b:0},hudBottom=44}){
 safe={l:0,r:0,t:0,b:0,...safe};
 const usable=Math.max(1,height-safe.t-safe.b),footerHeight=Math.min(172,Math.max(104,Math.floor(usable*.38)));
 const panelWidth=Math.max(1,Math.min(560,width-safe.l-safe.r-24)),top=Math.max(safe.t+8,hudBottom+8);
 const bottom=height-safe.b-8-footerHeight-10,panelHeight=Math.max(48,Math.min(124,bottom-top));
 return {left:safe.l+(width-safe.l-safe.r-panelWidth)/2,top,width:panelWidth,height:panelHeight,footerHeight};
}
Renderer.prototype.bubble=function(){
 const d=this.g.dialogue,el=document.getElementById('dialogue'),controls=document.getElementById('dialogueControls');
 if(!el?.style)return;
 if(!d||d.waitPanel){el.hidden=true;if(controls)controls.hidden=true;return;}
 const value=(d.choosing?d.menu.prompt:d.lines[d.index])||'',screen=document.getElementById('screen'),cv=document.getElementById('game'),r=cv.getBoundingClientRect(),sr=screen.getBoundingClientRect();
 if(!value||!r.width){el.hidden=true;return;}
 const probe=document.getElementById('safeProbe'),style=probe?getComputedStyle(probe):null,safe={l:parseFloat(style?.paddingLeft)||0,r:parseFloat(style?.paddingRight)||0,t:parseFloat(style?.paddingTop)||0,b:parseFloat(style?.paddingBottom)||0};
 const layout=dialoguePanelGeometry({width:sr.width,height:sr.height,safe,hudBottom:r.top-sr.top+this.top*r.width/this.W});
 el.hidden=false;el.classList.remove('docked');el.classList.remove('below');
 Object.assign(el.style,{left:Math.round(layout.left)+'px',top:Math.round(layout.top)+'px',width:Math.round(layout.width)+'px',height:Math.round(layout.height)+'px'});
 el.style.setProperty('--bubble-width',layout.width+'px');el.style.setProperty('--bubble-font',(13*textSettings.scale)+'px');el.style.setProperty('--bubble-name-font',(11*textSettings.scale)+'px');
 el.style.setProperty('--bubble-body-height',Math.max(24,layout.height-18)+'px');
 const body=el.querySelector('.dlg-body'),signature=d.speaker+'|'+d.index+'|'+value;
 if(el.dataset.line!==signature){el.dataset.line=signature;body.scrollTop=0;document.getElementById('speaker').textContent=d.speaker;}
 const shown=Math.floor(Math.min(d.shown??1e9,value.length)),a=document.getElementById('dialogueShown'),b=document.getElementById('dialogueRest');
 if(a.textContent!==value.slice(0,shown))a.textContent=value.slice(0,shown);if(b.textContent!==value.slice(shown))b.textContent=value.slice(shown);
 el.classList.toggle('scrollable',body.scrollHeight>body.clientHeight+1);
 if(controls){
  controls.hidden=false;controls.style.setProperty('--conversation-footer',layout.footerHeight+'px');
  const gameLeft=r.left-sr.left,gameRight=r.right-sr.left,gameBottom=r.bottom-sr.top,gutter=sr.width-safe.r-gameRight;
  const actionWidth=Math.min(136,Math.max(76,gutter-16)),actionCenter=gutter>=90?gameRight+gutter/2:sr.width-safe.r-actionWidth/2-12;
  controls.style.setProperty('--choices-left',(gameLeft+12)+'px');controls.style.setProperty('--choices-width',Math.max(1,r.width-24)+'px');
  controls.style.setProperty('--choices-bottom',(sr.height-gameBottom)+'px');
  controls.style.setProperty('--action-left',(actionCenter-actionWidth/2)+'px');controls.style.setProperty('--action-width',actionWidth+'px');
 }
 // Keep a fixed envelope for this speaker, anchored above the world sprite.
 const scale=r.width/this.W,w=d.who,ax=r.left-sr.left+((w?.x??this.cam.x+this.W/2)-this.cam.x)*scale;
 const feet=r.top-sr.top+(this.top+(w?.y??this.cam.y+60)-(w?.level?12:0)-this.cam.y)*scale;
 const width=Math.min(layout.width,300*textSettings.scale),height=Math.min(layout.height,92*textSettings.scale);
 const left=clamp(ax-width/2,r.left-sr.left+8,Math.max(r.left-sr.left+8,r.right-sr.left-width-8));
 const top=clamp(feet-(d.head||w?.head||32)*scale-height-12,layout.top,Math.max(layout.top,sr.height-layout.footerHeight-38-height));
 Object.assign(el.style,{left:Math.round(left)+'px',top:Math.round(top)+'px',width:width+'px',height:height+'px'});
 el.style.setProperty('--bubble-width',width+'px');el.style.setProperty('--bubble-body-height',(height-24)+'px');el.style.setProperty('--tail',clamp(ax-left,16,width-16)+'px');
 this.bubbleBounds={left,top,width,height};
};
function npcNameplateMetrics(ctx,label,cssScale=2,textScale=1){
 const scale=Math.max(.5,cssScale),font=10.5*textScale/scale;ctx.save();ctx.font=font+'px PixelUI, monospace';
 let copy=String(label||''),limit=112/scale;
 if(ctx.measureText(copy).width>limit){while(copy&&ctx.measureText(copy+'…').width>limit)copy=copy.slice(0,-1);copy+='…';}
 const width=ctx.measureText(copy).width+10/scale,height=(10.5*textScale+6)/scale;ctx.restore();return {copy,font,width,height,scale};
}
Renderer.prototype.npcNameplate=function(n){
 const g=this.g,p=g.player;if(!n.label||g.dialogue||g.dying||!p||Math.hypot(n.x-p.x,n.y-p.y)>88||g.npcPresent?.(n)===false)return;
 const key=g.time+'|'+p.x+'|'+p.y;
 if(this._nameplateKey!==key||this._nameplateGame!==g){
  this._nameplateKey=key;this._nameplateGame=g;this._nameplateRects=[];
  this._nearNameplate=(g.npcs||[]).filter(a=>Math.hypot(a.x-p.x,a.y-p.y)<=56&&a.id!=='fairy'&&(a.level||0)===(p.level||0)&&!a.civilian?.dead&&!a.batracien?.dead&&!a.guardState?.dead&&g.npcPresent?.(a)!==false).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y)||String(a.id).localeCompare(String(b.id)))[0];
 }
 const near=n===this._nearNameplate,mark=g.npcMark?.(n);if(!near&&!['offer','turnin'].includes(mark))return;
 const c=this.c,m=npcNameplateMetrics(c,n.label,this.cssScale||2,textSettings.scale),cam=this.cam||{x:0,y:0},x=clamp(n.x-m.width/2,cam.x+2,cam.x+this.W-m.width-2),y=n.y-(n.level?12:0)-(n.head||28)-m.height-4/m.scale;
 const rect={x,y,w:m.width,h:m.height};
 if(!near&&this._nameplateRects.some(a=>rect.x<a.x+a.w&&rect.x+rect.w>a.x&&rect.y<a.y+a.h&&rect.y+rect.h>a.y))return;
 this._nameplateRects.push(rect);c.save();c.fillStyle='#15110e';c.fillRect(x,y,m.width,m.height);c.strokeStyle=near?'#c9a15b':'#756044';c.lineWidth=1/m.scale;c.strokeRect(x,y,m.width,m.height);
 c.font=m.font+'px PixelUI, monospace';c.textBaseline='top';c.fillStyle=near?'#fff0c9':'#d7c8a7';c.fillText(m.copy,x+5/m.scale,y+3/m.scale);c.restore();
};
function focusDialogueChoice(index){
 const target=document.querySelector('#dialogueControls [data-choice-index="'+index+'"]');if(!target)return;
 target.focus({preventScroll:true});const list=document.getElementById('dlgList');
 if(list.contains(target)){const a=target.getBoundingClientRect(),b=list.getBoundingClientRect();if(a.top<b.top)list.scrollTop+=a.top-b.top;else if(a.bottom>b.bottom)list.scrollTop+=a.bottom-b.bottom;}
}
function installInteractionUI(){
 const screen=document.getElementById('screen'),band=document.getElementById('dlgChoices'),bye=document.getElementById('dlgBye'),next=document.getElementById('dlgNext');
 const controls=document.createElement('div');controls.id='dialogueControls';controls.hidden=true;controls.setAttribute('aria-label','Commandes de dialogue');screen.append(controls);controls.append(band,bye,next);
 const label=document.createElement('span');label.className='dialogue-next-label';next.append(label);
 const sync=syncDialogue;syncDialogue=function(){
  sync();const d=state==='playing'?game.dialogue:null;controls.hidden=!d||!!d.waitPanel;
  label.textContent=next.classList.contains('end')?'Terminer':'Suite';
  for(const button of controls.querySelectorAll('[data-choice-index]')){const selected=Number(button.dataset.choiceIndex)===choiceSel;button.classList.toggle('sel',selected);button.setAttribute('tabindex',selected?'0':'-1');}
 };
 const resume=run;run=function(){resume();syncDialogue();};
 const title=showTitle;showTitle=function(){title();syncDialogue();};
 // Escape activates the real farewell option; it never accepts a quest panel.
 addEventListener('keydown',e=>{if(state!=='playing'||!game.dialogue||e.code!=='Escape'||e.repeat)return;const d=game.dialogue;if(d.choosing){const i=d.menu.options.findIndex(o=>o.end);if(i>=0){e.preventDefault();e.stopImmediatePropagation();game.choose(i);}}},true);
 // One close action per menu; the fixed "Reprendre" rail also works on desktop.
 document.getElementById('menuClose').hidden=true;
}
