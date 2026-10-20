'use strict';
/* Kaldor v3: approved barbare animation + long hair / holstering. Only hero art
 * and shared blade length ratio are patched. AI, hit time, dash and combo
 * authored poses are not overwritten. Idempotent on repeated builds. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'sprites/kaldor/kaldor-art.js'),'utf8');
const humanBridge=fs.readFileSync(path.join(root,'scripts/kaldor-civilian-bridge.js'),'utf8');
const begin='// BEGIN KALDOR JAVASCRIPT PIXEL ART',end='// END KALDOR JAVASCRIPT PIXEL ART';
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function replaceOnce(a,b){if(html.includes(b))return;if(!html.includes(a))throw Error('Kaldor: expected unique integration anchor missing: '+a.slice(0,100));if(html.split(a).length!==2)throw Error('Kaldor: duplicate integration anchor '+a.slice(0,100));html=html.replace(a,b);}
replaceOnce("if(kind==='hero')oracleHero(c,dir,state,frame,combo);", "if(kind==='hero')HearthreaverKaldorArt.draw(c,dir,state,frame,combo,swordPose);");
const oldIdle="if(kind==='guardian'&&state==='idle')frame=guardianFrame(actor.dir,'idle',time);";
replaceOnce(oldIdle,oldIdle+"if(kind==='hero'&&state==='idle')frame=HearthreaverKaldorArt.idleFrame(time);");
const anchor="if(kind==='hero'&&state==='idle')frame=HearthreaverKaldorArt.idleFrame(time);";
if(!html.includes("if(kind==='hero'){const look=HearthreaverKaldorArt.weaponVisual(actor,time,state,frame);state=look.state;frame=look.frame;if(HearthreaverKaldorCivilianArt.ready()"))
 replaceOnce(anchor,anchor+"if(kind==='hero'){const look=HearthreaverKaldorArt.weaponVisual(actor,time,state,frame);state=look.state;frame=look.frame;}");
// Use the very same 48px modular head, outfit, arms and 8-frame walk as human NPCs.
// When their PNG atlases are still decoding, the existing JS sprite remains a
// transient fallback. Human frames bypass the legacy CharacterAtlas frame cache.
replaceOnce("get(kind,dir,state,frame,flash=false,combo=0){const image=BITMAPS.get(",
 "get(kind,dir,state,frame,flash=false,combo=0){if(kind==='hero'){const h=HearthreaverKaldorCivilianArt.nativeFrame(dir,state,frame,combo,swordPose,greatsword,flash);if(h)return h;}const image=BITMAPS.get(");
replaceOnce("if(kind==='hero'){const look=HearthreaverKaldorArt.weaponVisual(actor,time,state,frame);state=look.state;frame=look.frame;}",
 "if(kind==='hero'){const look=HearthreaverKaldorArt.weaponVisual(actor,time,state,frame);state=look.state;frame=look.frame;if(HearthreaverKaldorCivilianArt.ready()){const npcWalk=HearthreaverKaldorCivilianArt.gaitFrame(actor);frame=HearthreaverKaldorCivilianArt.remap(state,frame,npcWalk,time);}}");
// Putting an outfit on: the dressing pose replaces the hero's idle while it plays.
if(!html.includes("const dressed=HearthreaverKaldorCivilianArt.dressLook(actor,time)"))replaceOnce("frame=HearthreaverKaldorCivilianArt.remap(state,frame,npcWalk,time);}}const im=this.get(",
 "frame=HearthreaverKaldorCivilianArt.remap(state,frame,npcWalk,time);}}if(kind==='hero'){const dressed=HearthreaverKaldorCivilianArt.dressLook(actor,time);if(dressed){state=dressed.state;frame=dressed.frame;}}const im=this.get(");
// Wardrobe: the Tenue row right under the character, its screen bound after the drink button.
html=html.replace("Dégâts +'+pow+' % grâce à ton niveau.</small></div></div>'+KaldorWardrobe.inventoryHTML(g);","Dégâts +'+pow+' % grâce à ton niveau.</small></div></div>';"); // first wardrobe build
replaceOnce("Têtes ×'+(p.lives??LIVES)+'</small></div></div>'+'<div class=\"m-sec\">Objets</div>","Têtes ×'+(p.lives??LIVES)+'</small></div></div>'+KaldorWardrobe.inventoryHTML(g)+'<div class=\"m-sec\">Objets</div>");
replaceOnce("$('drink')?.addEventListener('click',()=>{if(g.drinkFlask()){handleEvents();renderMenu();}});","$('drink')?.addEventListener('click',()=>{if(g.drinkFlask()){handleEvents();renderMenu();}});KaldorWardrobe.bindInventory(body,g,()=>{handleEvents();renderMenu();});");
// Take action on a mannequin or helmet post.
html=html.replace("sleep:['moon','DORMIR'],outfit:['hand','PRENDRE']}","sleep:['moon','DORMIR']}"); // first wardrobe build
if(!html.includes("helmet:['hand','PRENDRE']"))replaceOnce("sleep:['moon','DORMIR']}","sleep:['moon','DORMIR'],outfit:['hand','PRENDRE'],helmet:['hand','PRENDRE']}");
// The Tenue screen closes with another tab or a reopened menu; Escape goes back to the inventory.
replaceOnce("menuTab=tab;if(tab==='quests')game.quests.fresh=false;","KaldorWardrobe.leave();menuTab=tab;if(tab==='quests')game.quests.fresh=false;");
replaceOnce("if(menuTab==='options'&&e.code==='Escape')selectMenuTab(menuPrevious,true);else closeMenu();","if(menuTab==='options'&&e.code==='Escape')selectMenuTab(menuPrevious,true);else if(menuTab==='bag'&&e.code==='Escape'&&KaldorWardrobe.leave())renderMenu();else closeMenu();");
// Slightly shorter sword from the ONE authoritative pose used by both hit sweep
// and v3 art. The authored four combo trajectories remain entirely unchanged.
replaceOnce('return [p[0],p[1],p[2]*1.1,p[3]*1.1];','return [p[0],p[1],p[2]*1.02,p[3]*1.02];');
const weaponData=fs.readFileSync(path.join(root,'data/weapons/catalogue.json'),'utf8').trim();
const nativeArms=fs.readFileSync(path.join(root,'data/weapons/native-arms.json'),'utf8').trim();
const weaponArt=fs.readFileSync(path.join(root,'scripts/kaldor-weapons.js'),'utf8');
const weaponRuntime=fs.readFileSync(path.join(root,'scripts/kaldor-weapons-runtime.js'),'utf8');
const armaments=fs.readFileSync(path.join(root,'scripts/kaldor-armaments.js'),'utf8');
const block=begin+'\nglobalThis.KALDOR_WEAPONS_DATA='+weaponData+';\nglobalThis.KALDOR_WEAPON_LIMBS='+nativeArms+';\n'+weaponArt+'\n'+source+'\n'+humanBridge+'\n'+end;
if(html.includes(begin)){
 const i=html.indexOf(begin),j=html.indexOf(end,i);
 if(j<0||html.indexOf(begin,i+begin.length)>=0)throw Error('Kaldor: corrupted or duplicated art section');
 html=html.slice(0,i)+block+html.slice(j+end.length);
}else{
 if(html.split('// art.js').length!==2)throw Error('Kaldor: art insertion marker missing');
 html=html.replace('// art.js',block+'\n// art.js');
}
// Outfit atlas and wardrobe runtime after the world (Game, Renderer, Atlas).
const outfitData=fs.readFileSync(path.join(root,'data/kaldor-outfits/atlas.json'),'utf8').trim();
const wardrobe=fs.readFileSync(path.join(root,'scripts/kaldor-outfits.js'),'utf8');
const wBegin='// BEGIN KALDOR WARDROBE',wEnd='// END KALDOR WARDROBE';
const wBlock=wBegin+'\nvar KALDOR_OUTFITS='+outfitData+';\n'+wardrobe+'\n'+weaponRuntime+'\n'+armaments+'\n'+wEnd;
if(html.includes(wBegin)){
 const i=html.indexOf(wBegin),j=html.indexOf(wEnd,i);
 if(j<0||html.indexOf(wBegin,i+wBegin.length)>=0)throw Error('Kaldor: corrupted or duplicated wardrobe section');
 html=html.slice(0,i)+wBlock+html.slice(j+wEnd.length);
}else{
 if(html.split('// app.js').length!==2)throw Error('Kaldor: app insertion marker missing');
 html=html.replace('// app.js',()=>wBlock+'\n// app.js');
}
// Explicit weapon ids keep independently loaded games and NPC attack timings isolated.
html=html.replaceAll('attackLength(p.combo)','attackLength(p.combo,p.weapon)')
 .replaceAll('attackFrame(p.attack,p.combo)','attackFrame(p.attack,p.combo,p.weapon)')
 .replaceAll("kind==='hero'?actor.combo:-1)","kind==='hero'?actor.combo:-1,kind==='hero'?actor.weapon:undefined)")
 .replaceAll("this.emit('sword',{combo:p.combo});","this.emit('sword',{combo:p.combo,weapon:p.weapon});");
for(const target of ['damageEnemy(e,','damageCivilian(n,','damageHumanGuard(n,','damageBatracienGuard(n,'])
 html=html.replaceAll('this.'+target+'p.combo===3?2:1','this.'+target+'this.weaponDamage(p.combo===3?2:1)');
html=html.replaceAll("HearthreaverKaldorCivilianArt.wield(actor.weapon||'exile');","HearthreaverKaldorCivilianArt.wield(actor.weapon||'exile',actor);");
replaceOnce("let state='idle',frame=0;if(kind==='guardian'", "if(kind==='hero')HearthreaverKaldorCivilianArt.wield(actor.weapon||'exile',actor);let state='idle',frame=0;if(kind==='guardian'");
html=html.replace("&&actor.weapon!=='exile'",'');
html=html.replaceAll("if(frame===2&&!p.attackStep)","if((frame===2||frame===3)&&!p.attackStep)");
// Every queued stroke acquires afresh; no-input attacks prioritize nearby foes.
replaceOnce("else if(!this.target())this.aimAttack(...this.facing(p.dir));", "else this.aimAttack(...this.facing(p.dir),true);");
replaceOnce("HearthreaverKaldorCivilianArt.wield(actor.weapon||'exile');", "HearthreaverKaldorCivilianArt.wield(actor.weapon||'exile',actor);");
// One damage event per swing, shared by monsters, people, guards and props.
// Only logical phase 2 displays contact; phase 3 is visual follow-through.
replaceOnce('this.swing++;p.attackStep=false;', 'this.swing++;p.attackStep=false;p.impactDone=false;p.impactTick=false;p.comboRecoilShown=false;');
replaceOnce("p[k]=Math.max(0,p[k]-((k==='attack'||k==='attackCD')&&p.hitPause>0?0:dt));",
 "p[k]=k==='attack'&&p.weapon?HearthreaverWeapons.advance(p[k],dt,p.weapon,p.combo):Math.max(0,p[k]-((k==='attack'||k==='attackCD')&&p.hitPause>0?0:dt));");
html=html.replaceAll('link=(buffered||input.attack)&&p.combo<3','link=buffered&&p.combo<3');
replaceOnce('const buffered=p.attackBuffer>0,link=buffered&&p.combo<3&&p.attackCD<.065&&p.attack<.065;',
 'const buffered=p.attackBuffer>0,link=buffered&&p.combo<3&&p.comboWindow>0&&p.comboRecoilShown&&p.hitPause<=0&&HearthreaverWeapons.canChain(p.attack,p.weapon,p.combo);');
// An input can be buffered early, but cannot erase the follow-through.
replaceOnce('(p.attackCD<=0||link)&&p.dash<=0', '((p.attackCD<=0&&p.attack<=0)||link)&&p.dash<=0');
// Fresh presses only. Keep at most the next stroke; holding never repeats.
replaceOnce('if(attackEdge&&p.attackCD>0&&p.attack<.23){p.attackBuffer=.26;p.bufferX=dx;p.bufferY=dy;}',
 'if(attackEdge&&(p.attack>0||p.attackCD>0)&&p.dash<=0&&p.hurt<=0)KaldorArsenal.queueAttack(p,dx,dy);');
replaceOnce('if((input.attack||buffered)&&((p.attackCD<=0&&p.attack<=0)||link)',
 'if((attackEdge||buffered)&&((p.attackCD<=0&&p.attack<=0)||link)');
const impactAnchor='if(p.attack>0){const frame=attackFrame(p.attack,p.combo,p.weapon);';
const impactEvent="p.impactTick=p.attack>0&&HearthreaverWeapons.sample(p.attack,p.weapon,p.combo)===2&&!p.impactDone;if(p.impactTick)p.impactDone=true;p.comboRecoilShown=p.attack>0&&HearthreaverWeapons.sample(p.attack,p.weapon,p.combo)===3.5;";
replaceOnce(impactAnchor,impactEvent+impactAnchor);
replaceOnce('if((frame===2||frame===3)&&!p.attackStep)', 'if(p.impactTick&&!p.attackStep)');
// Contact shake shares the existing reduced-motion preference and world-only
// translation. Keep the stronger native hurt shake instead of adding to it.
const contactCamera="const contactShake=KaldorArsenal.cameraShake(g.weaponShake,typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);if(Math.abs(contactShake)>Math.abs(shake))shake=contactShake;";
replaceOnce('c.fillStyle=PAL.ink;c.fillRect(0,0,W,H);c.save();c.beginPath();c.rect(0,T,W,VH);',contactCamera+'c.fillStyle=PAL.ink;c.fillRect(0,0,W,H);c.save();c.beginPath();c.rect(0,T,W,VH);');
// The ready beat uses the original breathing idle, not a frozen attack cell.
const oldSampling="if(kind==='hero'&&state==='attack'&&actor.weapon)frame=HearthreaverWeapons.sample(actor.attack,actor.weapon,actor.combo||0);";
const sampling="if(kind==='hero'&&state==='attack'&&actor.weapon){frame=HearthreaverWeapons.sample(actor.attack,actor.weapon,actor.combo||0);if(frame===5){state='idle';frame=HearthreaverKaldorCivilianArt.frameAt('idle',time);}}";
html=html.replaceAll(oldSampling,'').replaceAll(sampling,'');
replaceOnce("const im=this.get(kind,actor.dir,state,frame,actor.flash>0,",sampling+"const im=this.get(kind,actor.dir,state,frame,actor.flash>0,");
replaceOnce("helmet:['hand','PRENDRE']}","helmet:['hand','PRENDRE'],weapon:['hand','PRENDRE']}");
replaceOnce("t=COMBO_TIMES[c]||ATTACK_TIMES;this.play(","t=HearthreaverWeapons.times(ev.weapon,c,COMBO_TIMES);this.play(");
// Replace the obsolete fixed-sword label; the arsenal above is authoritative.
const oldSwordRow=`+'<div class="inv-row"><img alt="" src="'+ICONS.sword+'"><div class="grow">Épée à deux mains<small>Lourde lame de Sahrak. Dégâts +'+pow+' % grâce à ton niveau.</small></div></div>'`;
html=html.replace(oldSwordRow,'');
html=html.replaceAll('this.player.hitPause=this.player.combo===3?.075:.04','this.player.hitPause=HearthreaverWeapons.hitPause(this.player.weapon,this.player.combo)')
 .replaceAll('p.hitPause=p.combo===3?.075:.04','p.hitPause=HearthreaverWeapons.hitPause(p.weapon,p.combo)');
html=html.replaceAll('(p.combo===3?9:4)','HearthreaverWeapons.attackStep(p.weapon,p.combo)');
// A weapon discovery is an informative, non-modal card; its payload is plain text.
replaceOnce("if(ev.type==='notice'){queueNotice(ev.title,ev.text);continue;}", "if(ev.type==='weaponfound'){KaldorArmaments.showDiscovery(ev);continue;}if(ev.type==='notice'){queueNotice(ev.title,ev.text);continue;}");
replaceOnce("resetTouch();noticeQueue.length=0;", "resetTouch();KaldorArmaments.clearDiscovery();noticeQueue.length=0;");
const write=(rel,bytes)=>fs.writeFileSync(path.join(root,rel),bytes,'utf8');
write('index.html',html);
const ios=html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,'');
write('ios/Hearthreaver/Game/index.html',ios);
const poseStart=html.indexOf('const SWORD_POSES='),poseEnd=html.indexOf('function greatsword(',poseStart);
if(poseStart<0||poseEnd<0)throw Error('Kaldor: authored sword pose source missing');
const marker='/*__KALDOR_POSE_CODE__*/',template=fs.readFileSync(path.join(root,'art/kaldor-preview-template.html'),'utf8');
if(template.split(marker).length!==2)throw Error('Kaldor: preview marker not unique');
write('art/kaldor-preview.html',template.replace(marker,html.slice(poseStart,poseEnd)));
write('data/kaldor-manifest.json',JSON.stringify({version:5,authored:'Aseprite human NPC modules + JavaScript sword',npcCell:[48,48],cell:[80,80],anchor:[40,52],outfit:'pagne-noue',outfits:Object.keys(JSON.parse(outfitData).outfits),helmets:Object.keys(JSON.parse(outfitData).helmets||{}),head:'masculin-adulte',hair:'masculin-hair-14',walkFrames:8,bladeScale:1.02,holsterDelaySeconds:3.7,holsterDurationSeconds:.33,states:Object.keys(require('../sprites/kaldor/kaldor-art.js').states),fingerprints:{legacyArt:crypto.createHash('sha256').update(source).digest('hex'),humanBridge:crypto.createHash('sha256').update(humanBridge).digest('hex'),outfits:crypto.createHash('sha256').update(outfitData).digest('hex'),wardrobe:crypto.createHash('sha256').update(wardrobe).digest('hex'),weapons:crypto.createHash('sha256').update(weaponData+nativeArms+weaponArt+weaponRuntime+armaments).digest('hex')}},null,2)+'\n');
console.log('Kaldor v5 rebuilt, wardrobe of '+Object.keys(JSON.parse(outfitData).outfits).length+' outfits and '+Object.keys(JSON.parse(outfitData).helmets||{}).length+' helmets — actual modular NPC human head/hair/body/8-step gait + authoritative sword.');
