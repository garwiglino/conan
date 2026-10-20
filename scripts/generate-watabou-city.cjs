'use strict';
// Authoring tool only. Watabou GPL source stays in the external checkout/cache.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process'),crypto=require('node:crypto');
const PIN='7fbc87a9398cc508af24de93f79cf2ad027f352b',root=path.resolve(__dirname,'..');
const args=process.argv.slice(2),size=+(args[0]||40),seed=+(args[1]||10629),out=path.resolve(args[2]||path.join(root,'data/architecture/city-plans/sources/clairfoyer-watabou.json'));
if(!Number.isSafeInteger(size)||size<6||size>100||!Number.isSafeInteger(seed)||seed<1)throw Error('size 6..100, seed positive integer');
const source=process.env.WATABOU_SOURCE;if(!source)throw Error('Set WATABOU_SOURCE to a checkout of https://github.com/watabou/TownGeneratorOS at '+PIN);
const revision=cp.execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();if(revision!==PIN)throw Error('Unexpected Watabou revision '+revision);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'hearthreaver-watabou-export-'));
try{
 fs.cpSync(path.join(source,'Source'),path.join(temp,'Source'),{recursive:true});
 const model=path.join(temp,'Source/com/watabou/towngenerator/building/Model.hx'),original=fs.readFileSync(model,'utf8');
 const modified=original.replace('new( nPatches=-1, seed=-1 )','new( nPatches=-1, seed=-1, plaza:Null<Bool>=null, citadel:Null<Bool>=null, walls:Null<Bool>=null )').replace('plazaNeeded\t\t= Random.bool();','plazaNeeded\t\t= plaza == null ? Random.bool() : plaza;').replace('citadelNeeded\t= Random.bool();','citadelNeeded\t= citadel == null ? Random.bool() : citadel;').replace('wallsNeeded\t\t= Random.bool();','wallsNeeded\t\t= walls == null ? Random.bool() : walls;');
 if(modified===original||!modified.includes('walls == null'))throw Error('Constructor patch no longer applies');fs.writeFileSync(model,modified);
 for(const [relative,a,b] of [['geom/Polygon.hx','var v1 = last();','var v1 = this[this.length - 1];'],['towngenerator/wards/Ward.hx','var density = [','var density:Array<Float> = [']]){const file=path.join(temp,'Source/com/watabou',relative);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(a,b));}
 fs.mkdirSync(path.dirname(out),{recursive:true});cp.execFileSync(process.env.HAXE||'haxe',['-cp',path.join(temp,'Source'),'-cp',path.join(__dirname,'city-plans/watabou-export'),'--run','Main',String(size),String(seed),out],{stdio:'inherit',timeout:60000});
 const data=JSON.parse(fs.readFileSync(out,'utf8'));data.provenance={tool:'Watabou Medieval Fantasy City Generator — public source edition',url:'https://watabou.itch.io/medieval-fantasy-city-generator',repository:'https://github.com/watabou/TownGeneratorOS',revision,sourceLicense:'GPL-3.0',mode:'headless_official_source_not_current_itch_site',modelSha256:crypto.createHash('sha256').update(original).digest('hex'),adaptation:'Only explicit plaza/citadel/walls constructor flags; headless Point/Rectangle compatibility. Two Haxe 4 typing fixes (explicit last element and Float array); generation algorithm unchanged.',limitations:['older public version','no waterbodies','no current site options UI','no political or demographic authority']};fs.writeFileSync(out,JSON.stringify(data)+'\n');
 console.log(`${data.patches.filter(p=>p.withinCity).length} city wards; ${data.patches.filter(p=>p.withinCity).reduce((n,p)=>n+p.buildings.length,0)} source buildings; ${out}`);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
