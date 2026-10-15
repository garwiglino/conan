// One saved, bounded text size for DOM and canvas UI. World graphics keep their scale.
class TextSettings {
 constructor(storage=globalThis.localStorage){this.storage=storage;let value=100;try{const saved=storage?.getItem('hearthreaver-text-size');if(saved!==null&&saved!==undefined)value=Number(saved);}catch{}this.percent=this.normalize(value);}
 normalize(value){return Number.isFinite(value)?Math.max(85,Math.min(125,Math.round(value/5)*5)):100;}
 get scale(){return this.percent/100;}
 get trackerHeight(){return Math.max(50,Math.ceil(50*this.scale));}
 set(value,persist=true){this.percent=this.normalize(value);if(persist)try{this.storage?.setItem('hearthreaver-text-size',String(this.percent));}catch{}return this.percent;}
}
const textSettings=new TextSettings();
function installTextScaling(){
 // CSSOM expands font shorthands and preserves media rules and !important priorities.
 // Each absolute font size is scaled once; inherited sizes follow naturally.
 const visit=rules=>{for(const rule of rules){if(rule.cssRules)visit(rule.cssRules);const style=rule.style;if(!style)continue;
  for(const property of ['font-size','line-height']){const value=style.getPropertyValue(property);if(!/^(?:\d*\.?\d+px|clamp\(.+\))$/.test(value)||parseFloat(value)===0)continue;style.setProperty(property,'calc(('+value+') * var(--text-scale,1))',style.getPropertyPriority(property));}
 }};
 for(const sheet of document.styleSheets)visit(sheet.cssRules);
 applyTextVariables();
}
function applyTextVariables(){const root=document.documentElement.style;root.setProperty('--text-scale',textSettings.scale);root.setProperty('--tracker-height',textSettings.trackerHeight+'px');root.setProperty('--tracker-step',(textSettings.trackerHeight+6)+'px');}
function syncTextSettings(){const input=$('textSize');if(!input)return;input.value=textSettings.percent;$('textSizeValue').value=textSettings.percent+' %';input.setAttribute('aria-valuetext',textSettings.percent+' pour cent');input.style.setProperty('--level',((textSettings.percent-85)/40*100)+'%');}
function setTextSize(value,persist=true){textSettings.set(value,persist);applyTextVariables();syncTextSettings();fitScreen();renderTracker();layoutStick();requestAnimationFrame(syncChoiceScroll);}
function canvasLines(ctx,value,maxWidth){const out=[];let line='';for(const word of String(value).split(/\s+/)){const next=line?line+' '+word:word;if(ctx.measureText(next).width<=maxWidth){line=next;continue;}if(line)out.push(line);line='';for(const char of word){if(line&&ctx.measureText(line+char).width>maxWidth){out.push(line);line='';}line+=char;}}if(line)out.push(line);return out;}
