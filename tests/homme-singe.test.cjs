const {test}=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas'),A=require('../sprites/hommes-singes/homme-singe.js');
test('all native poses retain connected members, binary alpha and integer anchor space',()=>{
 for(const action of Object.keys(A.CLIPS))for(const dir of A.directions)for(let frame=0;frame<A.CLIPS[action].durations.length;frame++){
  const r=A.renderLayers(action,dir,frame),pixels=r.order.flatMap(n=>r.layers[n]),set=new Set();
  for(const [x,y,key]of pixels){assert.ok(Number.isInteger(x)&&Number.isInteger(y));assert.ok(x>=0&&x<48&&y>=0&&y<=36,`${action}/${dir}/${frame}: foot boundary ${y}`);assert.ok(A.PALETTE[key]);set.add(x+','+y);}
  const queue=[set.values().next().value];set.delete(queue[0]);for(let i=0;i<queue.length;i++){const [x,y]=queue[i].split(',').map(Number);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const k=[x+dx,y+dy].join(',');if(set.delete(k))queue.push(k);}}assert.equal(set.size,0,`${action}/${dir}/${frame}: detached pixels`);
  const cv=createCanvas(48,48);A.draw(cv.getContext('2d'),{action,dir,frame});const d=cv.getContext('2d').getImageData(0,0,48,48).data;for(let i=3;i<d.length;i+=4)assert.ok(d[i]===0||d[i]===255);
 }
});
test('walk cycles move both limbs, keep a planted foot and wrap exactly',()=>{
 for(const dir of A.directions){const hands=new Set(),legs=new Set();for(let f=0;f<8;f++){const r=A.renderLayers('walk',dir,f);hands.add(JSON.stringify(r.layers.rightArm));legs.add(JSON.stringify(r.layers.leftLeg));assert.equal(Math.max(...r.layers.leftLeg.concat(r.layers.rightLeg).map(p=>p[1])),36);}assert.ok(hands.size>=4);assert.ok(legs.size>=3);}
 for(const clip of Object.keys(A.CLIPS)){const period=A.CLIPS[clip].durations.reduce((a,b)=>a+b,0)/1000;assert.equal(A.frameAt(clip,0),A.frameAt(clip,period));}
});
test('native-to-engine translation preserves exactly the approved 16px offset',()=>{const native=createCanvas(48,48),engine=createCanvas(80,80);A.draw(native.getContext('2d'));A.draw(engine.getContext('2d'),{format:'engine'});assert.deepEqual(engine.getContext('2d').getImageData(16,16,48,48).data,native.getContext('2d').getImageData(0,0,48,48).data);});

test('the canonical idle preserves every indexed source pixel in all four independent views',()=>{
 for(const dir of A.directions){const expected=createCanvas(48,48),c=expected.getContext('2d'),rows=A.SOURCE_VIEWS[dir],offset=dir==='face'||dir==='dos'?14:16;rows.forEach((row,y)=>[...row].forEach((key,x)=>{if(key!=='.'){c.fillStyle=A.PALETTE[key];c.fillRect(x+offset,y+11,1,1);}}));const actual=createCanvas(48,48);A.draw(actual.getContext('2d'),{dir});assert.deepEqual(actual.getContext('2d').getImageData(0,0,48,48).data,c.getImageData(0,0,48,48).data);}
});
