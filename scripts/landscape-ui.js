// Codex / ChatGPT: shared menu composition. Move existing nodes so their events,
// focus targets and wardrobe canvases retain their identity.
let inventorySection='Objets';
function composeMenuSections(body,page){
 body.dataset.page=body.querySelector('.ward')?'wardrobe':page;
 if(body.querySelector('.ward')||body.querySelector(':scope > .ui-section'))return;
 const fragment=document.createDocumentFragment();let section=null;
 for(const node of [...body.children]){
  if(node.classList.contains('m-sec')){
   const completed=page==='quests'&&node.textContent.trim()==='Accomplies',folded=completed||page==='help';
   section=document.createElement(folded?'details':'section');section.className='ui-section';section.dataset.section=node.textContent.trim();
   if(folded){const summary=document.createElement('summary');summary.textContent=node.textContent;section.append(summary);if(completed)section.classList.add('ui-completed');}
   else section.append(node);
   fragment.append(section);
  }else if(section)section.append(node);else fragment.append(node);
 }
 body.replaceChildren(fragment);
 if(page==='bag'){
  const sections=[...body.querySelectorAll(':scope > .ui-section')],nav=document.createElement('nav');nav.className='ui-inventory-nav';nav.setAttribute('aria-label','Rubriques de l’inventaire');nav.setAttribute('role','tablist');
  const activate=(value,focus=false)=>{inventorySection=value;for(const [i,s]of sections.entries()){const on=s.dataset.section===value;s.hidden=!on;const b=nav.children[i];b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();}body.scrollTop=0;};
  for(const [i,s]of sections.entries()){
   const b=document.createElement('button');b.type='button';b.className='q-track';b.id='inventoryTab'+i;b.textContent=s.dataset.section;b.setAttribute('role','tab');s.id='inventorySection'+i;s.setAttribute('role','tabpanel');s.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',s.id);b.onclick=()=>activate(s.dataset.section);nav.append(b);
  }
  nav.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const at=sections.findIndex(s=>s.dataset.section===inventorySection),n=e.key==='Home'?0:e.key==='End'?sections.length-1:(at+(e.key==='ArrowRight'?1:-1)+sections.length)%sections.length;e.preventDefault();activate(sections[n].dataset.section,true);};
  body.prepend(nav);activate(sections.some(s=>s.dataset.section===inventorySection)?inventorySection:sections[0]?.dataset.section);
  // Long item explanations stay available without hiding the action below them.
  for(const small of body.querySelectorAll('.inv-row:not(.body-heat) .grow > small'))if(small.textContent.length>60&&!small.querySelector('.xpbar')){
   if(small.closest('[data-section="Personnage"]'))continue;
   const detail=document.createElement('details'),summary=document.createElement('summary');detail.className='ui-item-info';summary.textContent='Détails';small.before(detail);detail.append(summary,small);
  }
 }
}
function installLandscapeUI(){
 const render=renderMenu;
 renderMenu=function(){
  render();if(menuTab!=='options')composeMenuSections($('menuBody'),menuTab);
  const target=menuTab==='options'?$('menuSettings'):$('menuBody');
  target.setAttribute('role','tabpanel');target.setAttribute('aria-labelledby',document.querySelector('.menu-tabs .on')?.id||'menuTitle');
 };
 installInteractionUI();
}
