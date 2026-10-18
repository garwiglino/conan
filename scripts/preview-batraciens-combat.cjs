'use strict';
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=read('scripts/batraciens-runtime.js'),from=runtime.indexOf(' Game.prototype.tryBatracienBlock='),to=runtime.indexOf('\n const nativeGuardStrike',from);
if(from<0||to<0)throw new Error('Shared block function not found');
let html=read('art/batraciens-combat.template.html');
for(const [marker,source]of Object.entries({'/*__CIVIL_ART__*/':read('sprites/batraciens/batraciens-complet.js'),'/*__ARMED_ART__*/':read('sprites/batraciens/batraciens-combattants.js'),'/*__CONFIG__*/':read('data/batraciens/communities.json').trim(),'/*__BLOCK_FUNCTION__*/':runtime.slice(from,to)})){
 if(html.split(marker).length!==2)throw new Error('Invalid preview marker '+marker);html=html.replace(marker,()=>source);
}
if(Buffer.byteLength(html)>1000000)throw new Error('Inline preview exceeds 1MB');
fs.writeFileSync(path.join(root,'art/batraciens-combat-preview.html'),'<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hearthreaver · Combat des batraciens</title><style>body{margin:0;padding:16px;max-width:800px;margin:auto;background:light-dark(#f5f6f0,#17201d);color-scheme:light dark}</style>'+html+'</html>');
if(process.argv[2])fs.writeFileSync(process.argv[2],html);
console.log('Combat preview rebuilt from game art and shared shield logic.');
