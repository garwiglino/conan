// One introduction per page launch. The title music continues across the reveal.
class StudioIntro{
 constructor(root,menu,{wake,finished,reduced=false}){
  this.root=root;this.menu=menu;this.wake=wake;this.finished=finished;this.reduced=reduced;
  this.mark=root.querySelector('.studio-mark');this.elapsed=0;this.active=true;this.exitAt=null;this.releaseUntil=0;
  menu.inert=true;root.focus({preventScroll:true});wake();
  this.capture=e=>{
   if(!this.active&&performance.now()>this.releaseUntil)return;
   e.preventDefault();e.stopImmediatePropagation();
   if(['pointerdown','touchstart','click'].includes(e.type)||(e.type==='keydown'&&['Enter',' ','Escape'].includes(e.key))){this.wake();this.skip();}
  };
  this.events=['pointerdown','pointerup','touchstart','touchend','click','keydown','keyup'];
  for(const type of this.events)window.addEventListener(type,this.capture,{capture:true,passive:false});
  this.update(0);
 }
 skip(){if(this.active&&this.exitAt===null){this.exitAt=this.elapsed;this.exitOpacity=Number(this.mark.style.opacity)||0;this.exitVeil=Number(this.root.style.opacity)||0;}}
 update(dt){
  if(!this.active||document.hidden)return;
  this.elapsed+=dt;const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
  let logo,veil,done;
  if(this.exitAt!==null){
   const t=this.elapsed-this.exitAt;logo=this.exitOpacity*(1-smooth(t/.18));veil=this.exitVeil*(1-smooth((t-.22)/.5));done=t>=.72;
  }else{
   const t=this.elapsed/(this.reduced?.65:1);
   logo=smooth((t-.15)/.8)*(1-smooth((t-2.4)/.65));veil=1-smooth((t-3.2)/.75);done=t>=3.95;
  }
  this.mark.style.opacity=String(logo);this.root.style.opacity=String(veil);
  if(done){
   this.active=false;this.root.hidden=true;this.menu.inert=false;this.releaseUntil=performance.now()+400;
   this.finished();
   setTimeout(()=>{for(const type of this.events)window.removeEventListener(type,this.capture,true);},420);
  }
 }
}
