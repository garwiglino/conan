'use strict';
const fs=require('node:fs'),path=require('node:path');const root=__dirname;
const spec=require('./sources/activities.cjs'),pal=JSON.parse(fs.readFileSync(path.join(root,'sources/palettes.json')));
const template=fs.readFileSync(path.join(root,'sources/renderer.template.js'),'utf8');
const source=template.replace('/*__CLIPS__*/',JSON.stringify(spec,null,2)).replace('/*__PALETTES__*/',JSON.stringify(pal,null,2));
fs.writeFileSync(path.join(root,'sources/batraciens-activites.js'),source);
function capture(file){return '(function(){const module={exports:{}};const exports=module.exports;\n'+fs.readFileSync(path.join(root,file),'utf8')+'\nreturn module.exports;})()';}
const bundle='/* Hearthreaver batraciens v3 — fichier autonome, zéro dépendance. */\n(function(root){\n\'use strict\';\nconst M='+capture('base/batracien-v2.js')+';\nconst F='+capture('base/batracienne-v2.js')+';\nconst API=(function(){const module={exports:{}};const require=(id)=>id.includes("batracienne")?F:M;\n'+source+'\nreturn module.exports;})();\nif(typeof module===\'object\'&&module.exports)module.exports=API;else{root.HearthreaverBatraciens=API;root.HearthreaverBatracien=API.Male;root.HearthreaverBatracienne=API.Female;}\n})(typeof globalThis!==\'undefined\'?globalThis:this);\n';
fs.writeFileSync(path.join(root,'batraciens-complet.js'),bundle);
for(const [stem,name]of [['batracien','Male'],['batracienne','Female']])fs.writeFileSync(path.join(root,stem+'.js'),`/* Charger batraciens-complet.js avant ce petit adaptateur dans un navigateur. */\n(function(root){'use strict';if(typeof module==='object'&&module.exports)module.exports=require('./batraciens-complet.js').${name};else{if(!root.HearthreaverBatraciens)throw new Error('Charger batraciens-complet.js.');root.Hearthreaver${name==='Male'?'Batracien':'Batracienne'}=root.HearthreaverBatraciens.${name};}})(globalThis);\n`);
console.log('Sources et bundle construits : '+Object.keys(spec).length+' activités.');
