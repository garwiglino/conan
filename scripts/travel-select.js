// In-game selectors keep the existing select values as the journey API.
const travelSelects=new Map();
let travelSelectOpen=null;
function travelDestinationOptions(nodes){
 const groups=new Map();
 for(const n of nodes){const continent=Atlas.regions.get(n.region)?.continent||n.territory||'Autres terres';if(!groups.has(continent))groups.set(continent,[]);groups.get(continent).push(n);}
 return [...groups].sort(([a],[b])=>a.localeCompare(b,'fr')).map(([name,places])=>'<optgroup label="'+atlasEscape(name)+'">'+places.sort((a,b)=>a.name.localeCompare(b.name,'fr')||a.id.localeCompare(b.id)).map(n=>'<option value="'+atlasEscape(n.id)+'">'+atlasEscape(n.name)+'</option>').join('')+'</optgroup>').join('');
}
function closeTravelSelect(focus=false){
 if(!travelSelectOpen)return;const ui=travelSelectOpen;ui.list.hidden=true;ui.button.setAttribute('aria-expanded','false');travelSelectOpen=null;if(focus)ui.button.focus();
}
function syncTravelSelect(id){
 const ui=travelSelects.get(id);if(!ui)return;
 const option=ui.select.selectedOptions[0],group=option?.parentElement;
 ui.button.textContent=(option?.textContent||'Aucune destination')+' ▾';
 ui.button.setAttribute('aria-label',ui.label+' : '+(option?.textContent||'Aucune destination')+(group?.tagName==='OPTGROUP'?' — '+group.label:''));
 ui.button.disabled=ui.select.disabled||!ui.select.options.length;
}
function focusTravelOption(ui,target){
 if(!target)return;target.focus({preventScroll:true});
 const item=target.getBoundingClientRect(),list=ui.list.getBoundingClientRect();
 if(item.top<list.top)ui.list.scrollTop+=item.top-list.top;
 else if(item.bottom>list.bottom)ui.list.scrollTop+=item.bottom-list.bottom;
}
function openTravelSelect(ui){
 if(ui.button.disabled)return;if(travelSelectOpen===ui){closeTravelSelect(true);return;}closeTravelSelect();
 ui.list.replaceChildren();
 for(const child of ui.select.children){
  const grouped=child.tagName==='OPTGROUP',parent=grouped?document.createElement('div'):ui.list;
  if(grouped){parent.setAttribute('role','group');parent.setAttribute('aria-label',child.label);const heading=document.createElement('div');heading.className='travel-select-heading';heading.textContent=child.label;heading.setAttribute('aria-hidden','true');parent.append(heading);ui.list.append(parent);}
  for(const option of grouped?child.children:[child]){
   const button=document.createElement('button');button.type='button';button.className='travel-select-option';button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.tabIndex=-1;button.textContent=option.textContent;button.disabled=option.disabled||grouped&&child.disabled;button.dataset.value=option.value;
   button.onclick=e=>{e.preventDefault();ui.select.value=option.value;closeTravelSelect(true);ui.select.dispatchEvent(new Event('change',{bubbles:true}));syncTravelSelect(ui.select.id);};parent.append(button);
  }
 }
 ui.list.hidden=false;ui.button.setAttribute('aria-expanded','true');travelSelectOpen=ui;
 const target=ui.list.querySelector('[aria-selected="true"]:not(:disabled)')||ui.list.querySelector('button:not(:disabled)');focusTravelOption(ui,target);
}
function travelSelectKeydown(e){
 const ui=travelSelectOpen||[...travelSelects.values()].find(n=>n.button===document.activeElement);if(!ui)return false;
 if(!travelSelectOpen){if(!['ArrowDown','ArrowUp','Enter',' '].includes(e.key))return false;e.preventDefault();e.stopImmediatePropagation();openTravelSelect(ui);return true;}
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeTravelSelect(true);return true;}
 if(e.key==='Tab'){closeTravelSelect(true);return false;}
 if(['Enter',' '].includes(e.key)){const option=document.activeElement;if(ui.list.contains(option)&&option.matches('button:not(:disabled)')){e.preventDefault();e.stopImmediatePropagation();option.click();return true;}}
 const options=[...ui.list.querySelectorAll('button:not(:disabled)')],current=options.indexOf(document.activeElement);let next=-1;
 if(e.key==='ArrowDown')next=(current+1)%options.length;
 if(e.key==='ArrowUp')next=(current-1+options.length)%options.length;
 if(e.key==='Home')next=0;if(e.key==='End')next=options.length-1;
 if(next<0)return false;e.preventDefault();e.stopImmediatePropagation();focusTravelOption(ui,options[next]);return true;
}
function installTravelSelects(){
 for(const [id,label]of [['transportDestination','Destination'],['transportMode','Transport'],['transportPreference','Itinéraire']]){
  const select=$(id),wrap=document.createElement('div'),button=document.createElement('button'),list=document.createElement('div');
  wrap.className='travel-select';button.type='button';button.className='travel-select-trigger';button.id=id+'Trigger';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',id+'List');
  list.id=id+'List';list.className='travel-select-list';list.setAttribute('role','listbox');list.setAttribute('aria-label',label);list.hidden=true;
  select.hidden=true;select.tabIndex=-1;select.after(wrap);wrap.append(button,list);
  const ui={select,wrap,button,list,label};travelSelects.set(id,ui);button.onclick=e=>{e.preventDefault();openTravelSelect(ui);};select.addEventListener('change',()=>syncTravelSelect(id));syncTravelSelect(id);
 }
 document.addEventListener('pointerdown',e=>{if(travelSelectOpen&&!travelSelectOpen.wrap.contains(e.target))closeTravelSelect();});
}
