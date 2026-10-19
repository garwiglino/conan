// Pagination belongs to the dialogue state: all input paths consume the current
// reply completely before an option, a quest panel or the end callback can run.
Game.prototype.dialoguePageState=function(){
 const d=this.dialogue;if(!d)return null;
 const value=String((d.choosing?d.menu.prompt:d.lines[d.index])||'');
 if(!d.page||d.page.value!==value||d.page.index!==d.index||d.page.choosing!==d.choosing)
  d.page={value,index:d.index,choosing:d.choosing,start:0,end:value.length,key:null};
 return d.page;
};
Game.prototype.prepareDialoguePage=function(key,fits){
 const p=this.dialoguePageState();if(!p||p.key===key)return;
 const d=this.dialogue,oldShown=d.shown??1e9;p.key=key;p.fits=fits;
 const rest=p.value.slice(p.start),ends=[];
 for(const match of rest.matchAll(/\s+/g))ends.push(match.index+match[0].length);
 if(ends.at(-1)!==rest.length)ends.push(rest.length);
 let lo=0,hi=ends.length;
 while(lo<hi){const mid=(lo+hi)>>1;if(fits(rest.slice(0,ends[mid])))lo=mid+1;else hi=mid;}
 let length=lo?ends[lo-1]:0;
 if(!length&&rest){
  // An oversized single token still has to be readable. CSS wraps it; split
  // between Unicode code points only if it cannot fit even on an empty page.
  const chars=Array.from(rest);lo=1;hi=chars.length;
  while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(fits(chars.slice(0,mid).join('')))lo=mid;else hi=mid-1;}
  length=chars.slice(0,lo).join('').length;
 }
 p.end=p.start+length;d.shown=Math.min(oldShown,length);
};
Game.prototype.dialogueHasMore=function(){const p=this.dialoguePageState();return !!p&&p.end<p.value.length;};
Game.prototype.dialogueText=function(){const p=this.dialoguePageState();return p?p.value.slice(p.start,p.end):'';};
{
 const advance=Game.prototype.advanceDialogue,choose=Game.prototype.choose;
 Game.prototype.advanceDialogue=function(){
  const d=this.dialogue;if(!d||d.waitPanel)return;
  const p=this.dialoguePageState(),length=p.end-p.start;
  if((d.shown??1e9)<length){d.shown=length;this.emit('dialogue');return;}
  if(p.end<p.value.length){const key=p.key,fit=p.fits;p.start=p.end;p.end=p.value.length;p.key=null;d.shown=0;if(fit)this.prepareDialoguePage(key,fit);this.emit('dialogue');return;}
  if(d.choosing)return;
  advance.call(this);
 };
 Game.prototype.choose=function(i){if(this.dialogueHasMore())return;if(this.dialogue?.choosing)delete this.dialogue.page;return choose.call(this,i);};
}
