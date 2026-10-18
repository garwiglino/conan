// Hair mask of a helmet ('MASQUE' layer): rows [y0, y1, x0, x1] filled with
// the mask key 'M'. Everything it covers is erased from the three hair
// planes before Kaldor is drawn, as the NPC headgear masks do.
const X0=29;
module.exports=(...spans)=>{
 const rows=new Map();
 for(const [y0,y1,a,b] of spans)for(let y=y0;y<=y1;y++)rows.set(y,'.'.repeat(a-X0)+'M'.repeat(b-a+1));
 return '\n'+[...rows].sort((p,q)=>p[0]-q[0]).map(([y,r])=>y+' '+r).join('\n');
};
