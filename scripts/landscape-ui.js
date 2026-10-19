// Codex / ChatGPT: shared menu composition. Move existing nodes so their events,
// focus targets and wardrobe canvases retain their identity.
let inventorySection='Objets';
function composeMenuSections(body,page){
 body.dataset.page=page;
 if(body.querySelector(':scope > .ui-section'))return;
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
  body.classList.add('player-overview');
  for(const section of body.querySelectorAll(':scope > .ui-section')){
   section.dataset.kind=({Personnage:'character',Tenue:'outfit',Armes:'weapons',Objets:'items',Climat:'climate'})[section.dataset.section]||'other';
  }
  const character=body.querySelector('[data-kind="character"]'),coins=[...body.querySelectorAll('[data-kind="items"] .inv-row')].find(n=>n.textContent.includes('Pièces d’or'));
  if(character){
   const p=game.player,L=game.lvl(),portrait=body.querySelector('.ward-big');
   character.replaceChildren();const stats=document.createElement('div');stats.className='player-stats';
   stats.innerHTML='<strong>Kaldor · Niv. '+L.level+'</strong><span>♥ '+p.hp+'/'+p.maxHp+' · Têtes '+(p.lives??LIVES)+' · Or '+p.coins+'</span><small>XP '+L.into+' / '+(L.need||'MAX')+'</small>';
   if(portrait)character.append(portrait);character.append(stats);if(coins)coins.remove();
  }
  for(const row of body.querySelectorAll('[data-kind="items"] .inv-row'))row.classList.add('inventory-slot');
  const back=body.querySelector('[data-ward-back]');if(back)back.hidden=true;
  const left=document.createElement('div');left.className='player-possession';
  for(const kind of ['character','items','climate','other'])for(const section of [...body.querySelectorAll(':scope > .ui-section')])if(section.dataset.kind===kind)left.append(section);
  body.prepend(left);
  // Long item explanations stay available without hiding the action below them.
  for(const small of body.querySelectorAll('[data-kind="items"] .inv-row .grow > small'))if(small.textContent.length>0&&!small.querySelector('.xpbar')){
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
