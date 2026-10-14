-- Aseprite batch: append four stone-collapse animations to the existing source.
-- Run with --script-param source=... --script-param out=... --script this-file.
local source=app.params['source']
local out=app.params['out']
local s=app.open(source)
assert(s and (#s.frames==168 or #s.frames==200 or #s.frames==216),'Expected the guardian source')
-- Re-running against the current source replaces the four generated death tags.
if #s.frames>168 then
 for i=#s.tags,1,-1 do if s.tags[i].name:sub(1,6)=='death_' then s:deleteTag(s.tags[i]) end end
 for i=#s.frames,169,-1 do s:deleteFrame(s.frames[i]) end
 for i=#s.layers,1,-1 do if s.layers[i].name:find('Mort /',1,true) then s:deleteLayer(s.layers[i]) end end
end
local C={}
for k,h in pairs({O='24212b',D='4c3b41',d='795445',m='a57550',s='c49a63',S='e0bf83',H='f4deb0',t='285652',T='4a9b88',e='a6dfbb'}) do
 C[k]=app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255)
end
local function px(im,x,y,c)
 x=math.floor(x+.5) y=math.floor(y+.5)
 if x>=0 and x<80 and y>=0 and y<80 then im:drawPixel(x,y,c) end
end
local function line(im,x,y,xx,yy,c)
 local n=math.max(math.abs(xx-x),math.abs(yy-y))
 for i=0,n do local t=n==0 and 0 or i/n px(im,x+(xx-x)*t,y+(yy-y)*t,c) end
end
local function dust(im,x,y,r)
 for dy=-r,r do for dx=-r-1,r+1 do
  if math.abs(dx)+math.abs(dy)<r+2 then px(im,x+dx,y+dy,dy<0 and C.S or C.m) end
 end end
end
local dirs={2,1,0,3}
local names={[0]='nord',[1]='est',[2]='sud',[3]='ouest'}
local times={80,100,80,80,80,80,80,100,100,120,150,350}
local stamps={0,.08,.18,.26,.34,.42,.50,.58,.68,.78,.90,1.05}
local savedTags={}
for _,tag in ipairs(s.tags) do savedTags[#savedTags+1]={tag.name,tag.fromFrame.frameNumber,tag.toFrame.frameNumber} end
local bases={}
for n,dir in ipairs(dirs) do
 local im=Image(80,80,ColorMode.RGB) im:drawSprite(s,(n-1)*42+1,Point(0,0)) bases[dir]=im
end
-- New layers stay empty on the existing 168 poses.
local rubble=s:newLayer() rubble.name='07 Mort / blocs de pierre'
local debris=s:newLayer() debris.name='08 Mort / poussiere'
local all=Image(960,2560,ColorMode.RGB)
-- Re-render the original cels rather than converting pixels through a PNG palette.
local counts={8,6,6,6,4,6,6}
local original=1
for row=0,27 do
 for f=1,counts[row%7+1] do
  local im=Image(80,80,ColorMode.RGB) im:drawSprite(s,original,Point(0,0))
  all:drawImage(im,Point((f-1)*80,row*80)) original=original+1
 end
end
local newTags={}
for n,dir in ipairs(dirs) do
 local base=bases[dir]
 -- Anatomical stone pieces: split mask, shoulders, rib plates, fists, knees, feet.
 local seeds
 if dir==0 or dir==2 then
  seeds={{33,11},{43,11},{31,19},{43,20},{24,24},{56,24},{19,32},{58,33},{22,39},{57,40},
   {32,28},{43,28},{31,35},{44,35},{31,41},{46,41},{29,47},{48,47},{25,50},{52,50}}
 else
  seeds={{38,11},{45,15},{35,20},{45,24},{30,27},{47,29},{32,34},{46,37},{31,41},{48,42},
   {37,30},{40,37},{36,44},{44,47},{34,50},{49,50}}
  if dir==3 then for _,p in ipairs(seeds) do p[1]=80-p[1] end end
 end
 local pieces={}
 for i,p in ipairs(seeds) do pieces[i]={cx=p[1],cy=p[2],points={},id=i} end
 for y=0,79 do for x=0,79 do
  local col=base:getPixel(x,y)
  if app.pixelColor.rgbaA(col)>0 then
   local best,bd=1,1e9
   for i,p in ipairs(seeds) do local d=(x-p[1])^2+(y-p[2])^2 if d<bd then best=i bd=d end end
   local p=pieces[best]
   if col==C.T or col==C.e then col=C.t end
   p.points[#p.points+1]={x-p.cx,y-p.cy,col}
  end
 end end
 local from=#s.frames+1
 for f=1,12 do
  local frame=s:newEmptyFrame() frame.duration=times[f]/1000
  local im=Image(80,80,ColorMode.RGB) local fx=Image(80,80,ColorMode.RGB)
  if f==1 then
   im:drawImage(base,Point(0,0))
   for y=0,79 do for x=0,79 do local c=im:getPixel(x,y) if c==C.T or c==C.e then im:drawPixel(x,y,C.t) end end end
  else
   -- Sample gravity (360 px/s²), one inelastic bounce and ground friction.
   -- The head releases 40 ms after the joints; low stones hit before the mask.
   table.sort(pieces,function(a,b) return a.cy>b.cy end)
   for _,p in ipairs(pieces) do
    local tx=40+(p.cx-40)*1.18+((p.id%3)-1)*2
    local ty=49+((p.id%4)-1.5)*1.5
    if p.cy<23 then ty=46+(p.id%2)*2 end
    if p.cy>43 then tx=40+(p.cx-40)*1.1 ty=51 end
    local t=math.max(0,stamps[f]-.10-(p.cy<23 and .04 or 0))
    local gravity=360 local height=math.max(0,ty-p.cy)
    local land=math.sqrt(2*height/gravity)
    local vx=(tx-p.cx)/(land+.12)
    local x=p.cx+vx*(t<land and t or land+.12*(1-math.exp(-(t-land)/.12)))
    local y=p.cy+.5*gravity*t*t
    if t>=land then
     local bounce=math.sqrt(2*gravity*height)*.24
     local u=t-land
     y=u<2*bounce/gravity and ty-bounce*u+.5*gravity*u*u or ty
    end
    if f==12 then x=tx y=ty end
    local rot=t>=land and p.cy<43 and (p.id%3==0 and -1 or p.id%3==1 and 1 or 0) or 0
    local points={}
    for _,q in ipairs(p.points) do
     local dx,dy=q[1],q[2]
     if rot==1 then dx,dy=-dy,dx elseif rot==-1 then dx,dy=dy,-dx end
     points[#points+1]={math.floor(x+dx+.5),math.floor(y+dy+.5),q[3]}
    end
    -- One-pixel cut edges only after the joints separate.
    if f>=3 then for _,q in ipairs(points) do
     px(im,q[1]-1,q[2],C.D) px(im,q[1]+1,q[2],C.D) px(im,q[1],q[2]-1,C.D) px(im,q[1],q[2]+1,C.D)
    end end
    for _,q in ipairs(points) do px(im,q[1],q[2],q[3]) end
   end
  end
  if f<=3 then
   local q=dir==3 and -1 or 1
   line(im,40,25+(f-1),40-2*q,29+(f-1),C.D)
   line(im,40-2*q,29+(f-1),42,32+(f-1),C.O)
   line(im,42,32+(f-1),39,35+(f-1),C.D)
  end
  if f>=5 and f<=11 then
   local r=f<7 and 2 or f<9 and 3 or 1
   local reach=18+(f-5)*2
   dust(fx,40-reach,51,r) dust(fx,40+reach,51,r)
   for k=1,8 do local side=k%2==0 and 1 or -1
    local xx=40+side*(8+k*2+(f-5)*2)
    local yy=49-(k%3)*2-math.floor((f-5)/2)
    if f<=9 and xx>2 and xx<77 then px(fx,xx,yy,C.S) end
   end
  end
  s:newCel(rubble,frame,im,Point(0,0)) s:newCel(debris,frame,fx,Point(0,0))
  local flat=Image(80,80,ColorMode.RGB) flat:drawImage(im,Point(0,0)) flat:drawImage(fx,Point(0,0))
  all:drawImage(flat,Point((f-1)*80,(27+n)*80))
 end
 newTags[#newTags+1]={'death_'..names[dir],from,#s.frames}
end
-- Prevent Aseprite's automatic tag extension from changing the existing grab range.
for i,tag in ipairs(s.tags) do tag.fromFrame=s.frames[savedTags[i][2]] tag.toFrame=s.frames[savedTags[i][3]] end
for _,t in ipairs(newTags) do local tag=s:newTag(t[2],t[3]) tag.name=t[1] tag.color=Color{r=165,g=117,b=80} end
s:saveAs(out..'/gardien.aseprite')
all:saveAs(out..'/gardien.png')
local preview=Sprite(960,240,ColorMode.RGB)
for f=1,12 do
 if f>1 then preview:newEmptyFrame() end preview.frames[f].duration=times[f]/1000
 local im=Image(960,240,ColorMode.RGB)
 for n=1,4 do for y=0,79 do for x=0,79 do
  local col=all:getPixel((f-1)*80+x,(27+n)*80+y)
  if app.pixelColor.rgbaA(col)==0 then col=app.pixelColor.rgba(41,44,48,255) end
  for yy=0,2 do for xx=0,2 do im:drawPixel(((n-1)*80+x)*3+xx,y*3+yy,col) end end
 end end end
 preview:newCel(preview.layers[1],f,im,Point(0,0))
end
preview:saveAs(out..'/colosse-mort-4-directions.gif')
local contact=Image(960,320,ColorMode.RGB)
for y=0,319 do for x=0,959 do contact:drawPixel(x,y,all:getPixel(x,y+2240)) end end
contact:saveAs(out..'/death-contact.png')
local log=io.open(out..'/death-export.txt','w') log:write('216 frames, 32 tags, 4 death directions, 1400 ms, gravity 360 px/s2, restitution .24, no blood.\n') log:close()
