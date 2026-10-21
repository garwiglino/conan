'use strict';
// Export rigid native shapes, never redraw or stretch anatomy. Disconnected
// shapes already present in a limb layer can move independently; no connected
// shape is divided and their union is exactly the original Piskel layer.
const fs=require('node:fs'),path=require('node:path'),G=require('./gobelins.cjs');
function islands(frame){
 const seen=new Set(),out=[];
 for(let i=0;i<48*48;i++){if(!frame[i*4+3]||seen.has(i))continue;const todo=[i],pixels=[];seen.add(i);
  for(let k=0;k<todo.length;k++){const n=todo[k],x=n%48,y=Math.floor(n/48),o=n*4;pixels.push([x,y,'#'+Buffer.from(frame.subarray(o,o+3)).toString('hex')]);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy,j=Y*48+X;if(X<0||X>=48||Y<0||Y>=48||seen.has(j)||!frame[j*4+3])continue;seen.add(j);todo.push(j);}}
  out.push(pixels);
 }return out;
}
function part(name,pixels,view){
 const n=+(name.match(/^(?:ANATOMIE|HABIT) (\d+)/)?.[1]||0),x=pixels.reduce((a,p)=>a+p[0],0)/pixels.length;
 if(/^(07 |08 |CHEVEUX|BIJOUX|COIFFE|06 )/.test(name))return 'head';
 if(n===13||n===17)return 'arm'+(view===1?'L':view===3?'R':x<24?'L':'R');
 if(n===10||n===11&&/^ANATOMIE/.test(name))return 'leg'+(x<24?'L':'R');
 if(n===16)return 'pouch';if(n===19)return 'cape';return 'body';
}
async function compile(){
 const S=await G.sources(),D=G.data(),characters={},specs=[...D.personnages,{id:'grise-gueule',nom:'Grise-Gueule',corps:'masculin',tenue:'guerrier',coiffe:'casque-a-pointes',teinte:'cendre',arme:'cimeterre-dentele'}];
 for(const p of specs){const layers=G.assemble(S,{...p,arme:null},D);characters[p.id]={label:p.nom,armed:!!p.arme,weapon:p.id==='grise-gueule'?'marteau-borne':p.id==='pillard'?'dague-kesh':'coutelas-gobelin',views:[0,1,2,3].map(v=>layers.flatMap(l=>{
  const components=islands(l.frames[v]),mobile=/^(ANATOMIE (10|11|13)|HABIT (10|13|17))\b/.test(l.name),groups=mobile?components:[components.flat()];
  return groups.filter(a=>a.length).map(pixels=>({name:l.name,part:part(l.name,pixels,v),rank:G.rank(l.name),pixels}));
 }))};}
 return {version:1,size:80,anchor:[40,52],sourceSize:48,sourceAnchor:[24,36],views:['face','droite','dos','gauche'],characters};
}
async function build(){const data=await compile(),out=path.resolve(__dirname,'../../sprites/gobelins');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'native-layers.js'),"/* Generated from art/gobelins/*.piskel: intact native shapes. */\n(function(r,d){if(typeof module==='object'&&module.exports)module.exports=d;else r.HearthreaverGoblinLayers=d;})(globalThis,"+JSON.stringify(data)+');\n');console.log('Compiled native goblin layers: '+Object.keys(data.characters).length+' characters, four views.');return data;}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={islands,part,compile,build};
