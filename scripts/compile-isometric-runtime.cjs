'use strict';
// Precompute native JS pixels so phones don't rasterise 696 meshes on startup.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),root=path.resolve(__dirname,'..'),target=path.join(root,'sprites/architecture/isometric-pixels.js');
const sources=['sprites/architecture/isometric-catalogue.js','sprites/architecture/architecture-isometric.js'],hash=crypto.createHash('sha256');for(const name of sources)hash.update(fs.readFileSync(path.join(root,name)));const sourceHash=hash.digest('hex');
if(fs.existsSync(target)&&fs.readFileSync(target,'utf8').includes('"sourceHash":"'+sourceHash+'"')){console.log('Isometric runtime pixels are current.');process.exit(0);}
const I=require('../sprites/architecture/architecture-isometric.js'),frames={};
function encode(a){let s='';for(let i=0;i<a.length;){const value=a[i];let j=i+1;while(j<a.length&&a[j]===value&&j-i<4095)j++;let code=(j-i)*128+value;if(code>=0xd800)code+=0x800;s+=String.fromCodePoint(code);i=j;}return s;}
for(const d of I.list())for(const dir of d.views){const p=I.raster(d.id,{dir}),depths=Uint8Array.from(p.groundDepth,(v,i)=>p.indices[i]?Math.floor(v/8)+1:0);frames[d.id+'/'+dir]={width:p.width,height:p.height,anchor:p.anchor,indices:encode(p.indices),layers:encode(p.layers),depths:encode(depths)};}
const data={version:1,sourceHash,frames};fs.writeFileSync(target,'/* Compiled native JavaScript pixels; regenerate with compile-isometric-runtime.cjs. */\n(function(r,f){if(typeof module==="object"&&module.exports)module.exports=f();else r.HearthreaverIsometricPixels=f();})(globalThis,()=>('+JSON.stringify(data)+'));\n');console.log('Compiled '+Object.keys(frames).length+' views, '+Math.round(fs.statSync(target).size/1024)+' KiB.');
