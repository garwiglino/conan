const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),art=path.join(root,'art/title');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const png=file=>'data:image/png;base64,'+fs.readFileSync(path.join(art,file)).toString('base64');
const meta=json(path.join(art,'title-art.json')),theme=json(path.join(root,'audio/hearthreaver-theme.json'));
const data={...meta,layers:meta.layers.map(l=>({...l,png:png(l.file)})),logoPNG:png('hearthreaver-logo.png'),flamePNG:png(meta.flame.file)};
const runtime=fs.readFileSync(path.join(root,'scripts/title-runtime.js'),'utf8');
const landscape='// BEGIN LANDSCAPE UI\n'+fs.readFileSync(path.join(root,'scripts/landscape.js'),'utf8')+'\n// END LANDSCAPE UI';
const block='// BEGIN HEARTHREAVER TITLE\nconst TITLE_ART='+JSON.stringify(data)+';\nconst TITLE_THEME='+JSON.stringify(theme)+';\n'+runtime+'\n// END HEARTHREAVER TITLE';
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const studio=fs.readFileSync(path.join(root,'art/studio/crest-interactive.svg'),'utf8').replace(/<\?xml[^>]*>\s*/,'');
const introMarkup='<!-- BEGIN STUDIO INTRO --><div id="studioIntro" role="button" tabindex="0" aria-label="Crest Interactive. Toucher pour passer l’introduction."><div class="studio-mark" aria-hidden="true">'+studio+'</div></div><!-- END STUDIO INTRO -->';
html=html.includes('<!-- BEGIN STUDIO INTRO -->')?html.replace(/<!-- BEGIN STUDIO INTRO -->[\s\S]*?<!-- END STUDIO INTRO -->/,()=>introMarkup):html.replace('<body>',()=>'<body>\n'+introMarkup);
const introCSS='/* BEGIN STUDIO INTRO */\n'+fs.readFileSync(path.join(root,'scripts/startup.css'),'utf8')+'\n/* END STUDIO INTRO */';
html=html.includes('/* BEGIN STUDIO INTRO */')?html.replace(/\/\* BEGIN STUDIO INTRO \*\/[\s\S]*?\/\* END STUDIO INTRO \*\//,()=>introCSS):html.replace('</style>',()=>introCSS+'\n</style>');
const introCode='// BEGIN STUDIO INTRO\n'+fs.readFileSync(path.join(root,'scripts/startup.js'),'utf8')+'\n// END STUDIO INTRO';
html=html.includes('// BEGIN STUDIO INTRO')?html.replace(/\/\/ BEGIN STUDIO INTRO[\s\S]*?\/\/ END STUDIO INTRO/,()=>introCode):html.replace('// app.js',()=>introCode+'\n// app.js');
if(html.includes('// BEGIN LANDSCAPE UI'))html=html.replace(/\/\/ BEGIN LANDSCAPE UI[\s\S]*?\/\/ END LANDSCAPE UI/,()=>landscape);
else html=html.replace('const PANEL=150;',()=>landscape+'\nconst PANEL=150;');
if(!html.includes('id="landscapeGate"'))html=html.replace('<body>','<body>\n<section id="landscapeGate" role="dialog" aria-modal="true" aria-labelledby="landscapeHeading" tabindex="-1" hidden><span class="landscape-device" aria-hidden="true"></span><h2 id="landscapeHeading">Tourne ton appareil</h2><p>Hearthreaver se joue en paysage.</p></section>');
if(html.includes('// BEGIN HEARTHREAVER TITLE'))html=html.replace(/\/\/ BEGIN HEARTHREAVER TITLE\r?\n[\s\S]*?\/\/ END HEARTHREAVER TITLE/,()=>block);
else html=html.replace('// END BOSS ASSETS','// END BOSS ASSETS\n'+block);
const css=fs.readFileSync(path.join(root,'scripts/title.css'),'utf8').replace(/__TITLE_BUTTON_(\w+)__/g,(_,state)=>png('button-'+state.toLowerCase()+'.png')),style='/* BEGIN HEARTHREAVER TITLE */\n'+css+'\n/* END HEARTHREAVER TITLE */';
if(html.includes('/* BEGIN HEARTHREAVER TITLE */'))html=html.replace(/\/\* BEGIN HEARTHREAVER TITLE \*\/[\s\S]*?\/\* END HEARTHREAVER TITLE \*\//,()=>style);
else html=html.replace('</style>',style+'\n</style>');
if(!html.includes('MUSIC_DATA.title=TITLE_THEME;'))html=html.replace(/(^const MUSIC_DATA=[^\n]*\n)/m,'$1MUSIC_DATA.title=TITLE_THEME;\n');
html=html.replace(/(<img id="titleBrand"[^>]*src=")[^"]*(")/,(_,a,b)=>a+data.logoPNG+b);
html=html.replace(/(<img id="titleBrand"[^>]*width=")\d+(" height=")\d+("[^>]*>)/,(_,a,b,c)=>a+meta.logo[0]+b+meta.logo[1]+c);
if(!html.includes('id="titleBrandWrap"'))html=html.replace(/<img id="titleBrand"[^>]*>/,im=>'<div id="titleBrandWrap">'+im+'<canvas id="titleFlame" width="'+meta.logo[0]+'" height="'+meta.logo[1]+'" aria-hidden="true"></canvas></div>');
html=html.replace("new TitleScene($('titleScene'))","new TitleScene($('titleScene'),$('titleFlame'))");
html=html.replace(/(<canvas id="titleFlame" width=")\d+(" height=")\d+/,(_,a,b)=>a+meta.logo[0]+b+meta.logo[1]);
const menuCode='// BEGIN TITLE MENU UI\n'+fs.readFileSync(path.join(root,'scripts/title-menu.js'),'utf8')+'\n// END TITLE MENU UI';
html=html.replace(/\/\/ BEGIN TITLE MENU UI[\s\S]*?\/\/ END TITLE MENU UI/,()=>menuCode);
for(const [tag,file]of [['WEATHER MODEL','weather.js'],['WEATHER RENDER','weather-render.js'],['WEATHER AUDIO','weather-audio.js'],['SNOW RENDER','snow-render.js']]){
 const code='// BEGIN '+tag+'\n'+fs.readFileSync(path.join(root,'scripts',file),'utf8')+'\n// END '+tag,re=new RegExp('// BEGIN '+tag+'[\\s\\S]*?// END '+tag);
 html=re.test(html)?html.replace(re,()=>code):html.replace('// app.js',()=>code+'\n// app.js');
}
const biomeScores='// BEGIN BIOME MIDI\nconst BIOME_SCORES='+JSON.stringify(json(path.join(root,'audio/biome-scores.json')))+';\n// END BIOME MIDI';
html=html.includes('// BEGIN BIOME MIDI')?html.replace(/\/\/ BEGIN BIOME MIDI[\s\S]*?\/\/ END BIOME MIDI/,()=>biomeScores):html.replace('// app.js',()=>biomeScores+'\n// app.js');
// Musiques 8 bits (biomes, voyage, combat, boss, défaite) : scripts/chiptune-songs.cjs → audio/music-scores.json.
const musicScores='// BEGIN CHIPTUNE MUSIC\nconst MUSIC_SCORES='+JSON.stringify(json(path.join(root,'audio/music-scores.json')))+';\nObject.assign(MUSIC_DATA,MUSIC_SCORES);\n// END CHIPTUNE MUSIC';
html=html.includes('// BEGIN CHIPTUNE MUSIC')?html.replace(/\/\/ BEGIN CHIPTUNE MUSIC[\s\S]*?\/\/ END CHIPTUNE MUSIC/,()=>musicScores):html.replace('// END BIOME MIDI',()=>'// END BIOME MIDI\n'+musicScores);
// Donjons : musique, alerte et ambiance de cave (scripts/dungeon-audio.js), juste après les partitions.
const dungeonAudio='// BEGIN DUNGEON AUDIO\n'+fs.readFileSync(path.join(root,'scripts/dungeon-audio.js'),'utf8')+'\n// END DUNGEON AUDIO';
html=html.includes('// BEGIN DUNGEON AUDIO')?html.replace(/\/\/ BEGIN DUNGEON AUDIO[\s\S]*?\/\/ END DUNGEON AUDIO/,()=>dungeonAudio):html.replace('// END CHIPTUNE MUSIC',()=>'// END CHIPTUNE MUSIC\n'+dungeonAudio);
const weatherScores='// BEGIN WEATHER MIDI\nconst WEATHER_SCORES='+JSON.stringify(json(path.join(root,'audio/weather-scores.json')))+';\n// END WEATHER MIDI';
html=html.includes('// BEGIN WEATHER MIDI')?html.replace(/\/\/ BEGIN WEATHER MIDI[\s\S]*?\/\/ END WEATHER MIDI/,()=>weatherScores):html.replace('// app.js',()=>weatherScores+'\n// app.js');
const textCode='// BEGIN TEXT LAYOUT\n'+fs.readFileSync(path.join(root,'scripts/text-layout.js'),'utf8')+'\n// END TEXT LAYOUT';
html=html.includes('// BEGIN TEXT LAYOUT')?html.replace(/\/\/ BEGIN TEXT LAYOUT[\s\S]*?\/\/ END TEXT LAYOUT/,()=>textCode):html.replace('// app.js',()=>textCode+'\n// app.js');
const textCSS='/* BEGIN READABILITY */\n'+fs.readFileSync(path.join(root,'scripts/readability.css'),'utf8')+'\n/* END READABILITY */';
html=html.includes('/* BEGIN READABILITY */')?html.replace(/\/\* BEGIN READABILITY \*\/[\s\S]*?\/\* END READABILITY \*\//,()=>textCSS):html.replace('</style>',()=>textCSS+'\n</style>');
const [nav,panels]=fs.readFileSync(path.join(root,'scripts/title-menu.html'),'utf8').split('<!-- PANELS -->');
for(const [label,content]of [['NAV',nav],['PANELS',panels]]){
 const block='<!-- BEGIN TITLE '+label+' -->'+content+'<!-- END TITLE '+label+' -->',re=new RegExp('<!-- BEGIN TITLE '+label+' -->[\\s\\S]*?<!-- END TITLE '+label+' -->');
 if(re.test(html))html=html.replace(re,()=>block);
 else if(label==='NAV')html=html.replace(/(<h2 id="overlayTitle">[\s\S]*?<\/h2>)/,(_,heading)=>heading+block);
 else html=html.replace('<div class="overlay-content">',block+'<div class="overlay-content">');
}
fs.writeFileSync(path.join(root,'index.html'),html);
fs.writeFileSync(path.join(root,'ios/Hearthreaver/Game/index.html'),html.replace(/<meta name="apple-mobile-web-app-title"[^>]*><link rel="apple-touch-icon"[^>]*><link rel="manifest"[^>]*>/,''));
for(const size of [180,192,512])fs.copyFileSync(path.join(art,'icon-'+size+'.png'),path.join(root,'icon-'+size+'.png'));
fs.copyFileSync(path.join(art,'icon-1024.png'),path.join(root,'ios/Hearthreaver/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'));
console.log('Embedded the Aseprite title, parallax layers, '+Object.keys(theme.tracks).length+'-track score and iOS fallback.');

// Keep the independently editable world modules synchronized in both builds.
if(fs.existsSync(path.join(root,'scripts/embed-world.cjs')))require('./embed-world.cjs');
