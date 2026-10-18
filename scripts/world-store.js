/* The game save is authoritative. The readable JSON mirrors the same campaign,
   clock and revision; queued writes cannot overtake each other. */
class WorldJournalStore {
 constructor(env=globalThis){this.env=env;this.pending=null;this.writing=false;this.status='memory';this.lastKey='';this.error=null;}
 write(world,snapshot=null){const header=snapshot||world,key=header.campaign+':'+header.revision+':'+Math.floor(header.clock);if(key===this.lastKey)return;const data=snapshot||world.serialize();this.lastKey=key;const text=JSON.stringify(data);try{this.env.localStorage?.setItem('hearthreaver-world-events',text);this.status='local';}catch(e){this.error=String(e);this.status='memory';}this.pending=text;this.flush();}
 async flush(){if(this.writing||!this.pending)return;this.writing=true;try{const storage=this.env.navigator?.storage;if(!storage?.getDirectory)return;const root=await storage.getDirectory();while(this.pending){const text=this.pending;this.pending=null;const file=await root.getFileHandle('hearthreaver-world-events.json',{create:true}),stream=await file.createWritable();await stream.write(text);await stream.close();this.status='file';}}catch(e){this.error=String(e);}finally{this.writing=false;}}
 readFor(world){try{const raw=JSON.parse(this.env.localStorage?.getItem('hearthreaver-world-events')||'null');if(raw?.schema===world.schema&&raw.campaign===world.campaign&&raw.revision>world.revision&&raw.clock<=world.clock)return raw;}catch{}return null;}
 async readFileFor(world){try{const root=await this.env.navigator.storage.getDirectory(),file=await root.getFileHandle('hearthreaver-world-events.json'),data=JSON.parse(await(await file.getFile()).text());return data?.schema===world.schema&&data.campaign===world.campaign&&data.revision>world.revision&&data.clock<=world.clock?data:null;}catch{return null;}}
}
if(typeof module!=='undefined'&&module.exports)module.exports=WorldJournalStore;
