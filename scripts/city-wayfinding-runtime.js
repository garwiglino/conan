/* The transport vertex is the arrival relay, not the centre of the authored city.
 * Keep that geography, but give the player actual district destinations. */
(()=>{
 const id='town-1',targetID='district-town-1-halles';
 const init=Game.prototype.initAtlas;
 Game.prototype.initAtlas=function(...args){const out=init.apply(this,args),site=this.settlements.sites.get(id),node=Atlas.byId[id];if(!site?.layoutKind)return out;
  for(const district of site.districts){const fixture=site.fixtures.find(f=>f.district===district.id),building=site.buildings.find(b=>b.uid===fixture?.building);if(!building?.apron)continue;
   this.mapPlaces.push({id:'district-'+id+'-'+district.id,siteId:id,category:'places',kind:'district',district:district.id,name:site.name+' · '+district.name,x:node.x+building.apron.x,y:node.y+building.apron.y,radius:6});
  }
  return out;
 };
 const location=Game.prototype.updateLocation;
 Game.prototype.updateLocation=function(...args){const result=location.apply(this,args),site=this.settlements?.sites.get(id);if(!site?.layoutKind||this.player.level)return result;
  const node=Atlas.byId[id],world=Atlas.toWorld(this.player.x,this.player.y),x=(world.x-node.x)*16,y=(world.y-node.y)*16,district=site.districts.find(d=>d.areas.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h));
  if(!district)return result;
  if(result?.site===id)result.detail=district.id==='ancien-relais'?"Relais d'arrivée":district.name;
  if(district.id==='ancien-relais'&&!this.clairfoyerArrivalHinted&&!this.journey&&!this.dialogue){const centre=this.mapPlaces.find(p=>p.id===targetID);if(!centre)return result;
   this.clairfoyerArrivalHinted=true;this.discovered.add(id);
   if(!this.navigation||this.navigation===id)this.navigation=centre.id;
   const distance=Math.round(Math.hypot(centre.x-world.x,centre.y-world.y));
   const guide=this.navigation===centre.id?'Suis le fanion ou choisis un quartier sur la carte.':'Choisis les Halles sur la carte pour les suivre.';
   this.emit('notice',{title:'Centre de Clairfoyer',text:"Tu es au relais d'arrivée. Les Halles sont à "+distance+" m vers l'ouest. "+guide});
  }
  return result;
 };
})();
