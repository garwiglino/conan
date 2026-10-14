-- Aseprite-authored traveling counterparts of the priest's jade serpent spell.
-- Usage: aseprite -b --script-param out=... --script-param art=... --script ...
local A=dofile(app.params['art'])
local out=app.params['out']
local source=Sprite(32,32,ColorMode.RGB)
source.layers[1].name='Serpents de jade / huit orientations'
local atlas=Image(128,512,ColorMode.RGB)
local n=0
for phase=0,1 do for dir=0,7 do
 local angle=dir*math.pi/4
 local vx,vy=math.cos(angle),math.sin(angle)
 for f=0,3 do
  n=n+1 if n>1 then source:newEmptyFrame() end
  source.frames[n].duration=.08
  local im=Image(32,32,ColorMode.RGB)
  local function dot(x,y,col,r)
   x=math.floor(x+.5) y=math.floor(y+.5)
   for dy=-r,r do for dx=-r,r do
    if math.abs(dx)+math.abs(dy)<=r and x+dx>=0 and y+dy>=0 and x+dx<32 and y+dy<32 then im:drawPixel(x+dx,y+dy,A.C[col]) end
   end end
  end
  for i=-13,4 do
   local bend=math.sin(i*.65+f*math.pi/2)*math.max(0,-i)/9
   dot(16+vx*i-vy*bend,16+vy*i+vx*bend,'t',i>=-2 and 3 or 2)
  end
  for i=-13,4 do
   local bend=math.sin(i*.65+f*math.pi/2)*math.max(0,-i)/9
   dot(16+vx*i-vy*bend,16+vy*i+vx*bend,phase==1 and 'E' or 'T',i>=-2 and 2 or 1)
  end
  for i=-6,4 do dot(16+vx*i,16+vy*i,'E',0) end
  dot(16+vx*3,16+vy*3,'H',1)
  dot(16-vy*2,16+vx*2,'G',0)
  source:newCel(source.layers[1],n,im,Point(0,0))
  atlas:drawImage(im,Point(f*32,(phase*8+dir)*32))
 end
end end
-- Create tags after the last frame, otherwise Aseprite extends the current tag.
for phase=0,1 do for dir=0,7 do
 local first=(phase*8+dir)*4+1
 source:newTag(first,first+3).name='jade_'..phase..'_'..dir
end end
source:saveAs(out..'/projectiles.aseprite')
atlas:saveAs(out..'/projectiles.png')
source:close()
