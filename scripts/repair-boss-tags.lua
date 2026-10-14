-- Set exported spell tag bounds after Aseprite has created every frame.
local out=app.params['out']
local f=io.open(out..'/sortileges.json','r')
local meta=json.decode(f:read('*a')) f:close()
local sprite=app.open(out..'/pretre-sortileges.aseprite')
local byName={} for _,c in ipairs(meta.clips) do byName[c.name]=c end
for _,tag in ipairs(sprite.tags) do
 local c=byName[tag.name]
 if c then tag.fromFrame=sprite.frames[c.from] tag.toFrame=sprite.frames[c.to] end
end
sprite:saveAs(out..'/pretre-sortileges.aseprite')
sprite:close()
