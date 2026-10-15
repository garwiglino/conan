// Title-only navigation. The existing in-game pause/death controls keep their roles.
function titleFocus(on){for(const element of $('screen').children)if(element!==$('overlay'))element.inert=on;}
function refreshTitleMenu(){
 try{const data=JSON.parse(localStorage.getItem(KEY)||'null');saved=data?.version===1&&!data.won&&data.player?data:null;}catch{saved=null;}
 $('menuLoad').disabled=!saved;if(['title','options','quit'].includes(state))titleFocus(true);return saved;
}
function titleNewGame(){
 if(refreshTitleMenu()){$('newGame').click();$('start').focus({preventScroll:true});return;}
 game=new Game();renderer.setGame(game);run();save();
}
function titleLoadGame(){
 if(!refreshTitleMenu())return;
 try{game=new Game(saved);renderer.setGame(game);run();}
 catch{$('menuStatus').textContent='Cette sauvegarde ne peut pas être chargée.';}
}
function syncTitleOptions(){
 for(const [id,on]of [['musicToggle',sound.musicOn],['sfxToggle',sound.sfxOn],['hapticsToggle',haptics.enabled]]){const b=$(id);b.setAttribute('aria-pressed',String(on));b.textContent=on?'Activés':'Désactivés';}
 $('musicToggle').textContent=sound.musicOn?'Activée':'Désactivée';$('hapticsToggle').textContent=haptics.enabled?'Activées':'Désactivées';$('hapticsHint').textContent=haptics.available?'Retours discrets pour les actions importantes.':'Vibrations indisponibles dans cette version de l’app ou ce navigateur.';
 for(const [id,value]of [['musicVolume',sound.musicVolume],['sfxVolume',sound.sfxVolume]]){const n=Math.round(value*100),el=$(id);if(document.activeElement!==el)el.value=n;$(id+'Value').value=n+' %';el.style.setProperty('--level',n+'%');}
}
function openTitleOptions(){stashOptions();state='options';$('overlay').classList.add('options-open');$('titleOptions').hidden=false;syncTitleOptions();$('musicToggle').focus({preventScroll:true});}
function closeTitleOptions(){if(state==='menu'){selectMenuTab(menuPrevious,true);return;}state='title';$('titleOptions').hidden=true;$('overlay').classList.remove('options-open');$('menuOptions').focus({preventScroll:true});}
function quitTitle(){
 state='quit';keys.clear();resetTouch();sound.music?.update(null);sound.silent?.pause();
 $('overlay').classList.add('quit-open');$('titleExit').hidden=false;$('returnFromQuit').focus({preventScroll:true});
 if(document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});
 setTimeout(()=>{if(state==='quit')sound.ctx?.suspend?.().catch(()=>{});},650);
 // Browsers can close script-opened windows. Installed iOS apps use the quiet fallback.
 if(!window.webkit?.messageHandlers)try{window.close();}catch{}
}
function returnFromQuit(){state='title';$('titleExit').hidden=true;$('overlay').classList.remove('quit-open');sound.unlock();$('menuNew').focus({preventScroll:true});}
function titleKeys(e){
 if(!['title','options','quit'].includes(state))return false;
 if(e.code==='Escape'&&!e.repeat){if(state==='options')closeTitleOptions();else if(state==='quit')returnFromQuit();e.preventDefault();return true;}
 if(e.code==='Tab'){
  const box=$(state==='options'?'titleOptions':state==='quit'?'titleExit':'mainMenu'),items=[...box.querySelectorAll('button:not([disabled]),input')];
  const at=items.indexOf(document.activeElement),next=(at+(e.shiftKey?-1:1)+items.length)%items.length;items[next]?.focus();e.preventDefault();
 }
 if(state==='title'&&e.code==='Enter'&&!e.repeat&&!e.target.closest?.('button,input')){e.preventDefault();titleNewGame();}
 return true;
}
$('menuNew').addEventListener('click',titleNewGame);
$('menuLoad').addEventListener('click',titleLoadGame);
$('menuOptions').addEventListener('click',openTitleOptions);
$('menuQuit').addEventListener('click',quitTitle);
$('optionsBack').addEventListener('click',closeTitleOptions);
$('returnFromQuit').addEventListener('click',returnFromQuit);
$('musicToggle').addEventListener('click',()=>{sound.toggleMusic();syncTitleOptions();syncSoundButton();});
$('sfxToggle').addEventListener('click',()=>{sound.toggleSfx();syncTitleOptions();syncSoundButton();if(sound.sfxOn)sound.fx('ui_select');});
$('hapticsToggle').addEventListener('click',()=>{haptics.setEnabled(!haptics.enabled);syncTitleOptions();if(haptics.enabled)haptics.pulse('ui');});
$('optionsHome').addEventListener('click',()=>{if(state!=='menu')return;save();closeMenu();showTitle();});
$('musicVolume').addEventListener('input',e=>{sound.setMusicVolume(+e.target.value/100);syncTitleOptions();});
$('sfxVolume').addEventListener('input',e=>{sound.setSfxVolume(+e.target.value/100);syncTitleOptions();});
$('sfxVolume').addEventListener('change',()=>sound.fx('ui_select'));
