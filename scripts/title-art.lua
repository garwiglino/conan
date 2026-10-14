-- HearthreaveR: original blackletter, sword and arid landscape, drawn in Aseprite.
-- All exported pixels are opaque palette colors or transparent. No raster fonts.
local out=app.params['out']
local function rgba(hex) return app.pixelColor.rgba(tonumber(hex:sub(1,2),16),tonumber(hex:sub(3,4),16),tonumber(hex:sub(5,6),16),255) end
local function round(n) return math.floor(n+.5) end
local function px(im,x,y,c) x=round(x) y=round(y) if x>=0 and y>=0 and x<im.width and y<im.height then im:drawPixel(x,y,type(c)=='string' and rgba(c) or c) end end
local function rect(im,x,y,w,h,c) for yy=y,y+h-1 do for xx=x,x+w-1 do px(im,xx,yy,c) end end end
local function poly(im,p,c)
 local low,high=im.height,0 for _,q in ipairs(p) do low=math.min(low,q[2]) high=math.max(high,q[2]) end
 for y=math.ceil(low),math.floor(high) do
  local xs={} for j,a in ipairs(p) do local b=p[j%#p+1] if (a[2]<=y+.01 and b[2]>y+.01) or (b[2]<=y+.01 and a[2]>y+.01) then xs[#xs+1]=a[1]+(y+.01-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end
  table.sort(xs) for j=1,#xs-1,2 do for x=math.ceil(xs[j]),math.floor(xs[j+1]) do px(im,x,y,c) end end
 end
end
local function line(im,x,y,xx,yy,c,w)
 x=round(x) y=round(y) xx=round(xx) yy=round(yy) local dx=math.abs(xx-x) local sx=x<xx and 1 or -1 local dy=-math.abs(yy-y) local sy=y<yy and 1 or -1 local err=dx+dy
 while true do rect(im,x,y,w or 1,w or 1,c) if x==xx and y==yy then break end local e=2*err if e>=dy then err=err+dy x=x+sx end if e<=dx then err=err+dx y=y+sy end end
end
local function path(im,p,c,w) for i=2,#p do line(im,p[i-1][1],p[i-1][2],p[i][1],p[i][2],c,w) end end
local function ellipse(im,cx,cy,rx,ry,c,pattern) for y=math.floor(cy-ry),math.ceil(cy+ry) do for x=math.floor(cx-rx),math.ceil(cx+rx) do if ((x-cx)/rx)^2+((y-cy)/ry)^2<=1 and (not pattern or (x+y)%pattern==0) then px(im,x,y,c) end end end end
local function hash(x,y,s) return ((x*73+y*151+s*199)%997)/997 end
local function saveSource(name,images,names,w,h)
 local s=Sprite(w,h,ColorMode.RGB)
 for i,im in ipairs(images) do local l=i==1 and s.layers[1] or s:newLayer() l.name=names[i] s:newCel(l,1,im,Point(0,0)) end
 s:saveAs(out..'/'..name..'.aseprite') s:close()
end
local W,H=960,360
local sky=Image(W,H,ColorMode.RGB)
local ramp={'081218','0c1b23','14242d','25303a','39363f','51434a','71534f','8b6357','a77b61'}
for y=0,H-1 do for x=0,W-1 do
 local v=math.min(8,y/25) local n=math.floor(v)
 -- Quiet bands; only the last four rows of each transition use a sparse checker.
 if n<8 and y%25>=21 and (x+y)%2==0 then n=n+1 end
 px(sky,x,y,ramp[n+1])
end end
-- A restrained sun, with an interrupted rim in suspended desert dust.
ellipse(sky,451,137,48,48,'51434a',2) ellipse(sky,451,137,40,40,'71534f')
ellipse(sky,451,137,31,31,'a77b61') ellipse(sky,451,137,26,26,'c59a72')
for y=123,161,9 do rect(sky,405,y,90,2,y<140 and '71534f' or '8b6357') end
for i=0,36 do local x=(i*193+21)%W local y=(i*41+13)%91 if i%3~=0 then px(sky,x,y,'59636a') end end
sky:saveAs(out..'/sky.png')
local layers={sky} local names={'01 Ciel et soleil poussiereux'}
-- Hand-set ridge profiles; the start/end heights join exactly in the panorama.
local profiles={
 {{0,216},{32,205},{66,211},{99,192},{122,192},{149,174},{166,144},{188,165},{217,178},{241,197},{270,204},{302,191},{324,169},{340,168},{358,135},{374,154},{392,147},{420,179},{454,190},{480,216},{520,198},{552,202},{578,180},{599,179},{627,161},{647,182},{681,193},{711,176},{735,161},{753,128},{774,153},{804,173},{829,167},{848,188},{875,204},{911,211},{940,204},{960,216}},
 {{0,266},{37,254},{56,244},{74,230},{84,190},{100,189},{107,180},{124,181},{136,213},{157,220},{169,234},{198,249},{236,241},{264,218},{283,202},{295,177},{314,176},{321,163},{331,164},{339,195},{356,208},{374,236},{401,242},{429,258},{462,249},{491,254},{518,241},{542,220},{555,220},{567,203},{593,202},{603,220},{630,228},{650,248},{676,262},{704,244},{733,210},{740,173},{757,171},{766,156},{780,157},{791,192},{809,203},{836,241},{867,249},{893,254},{917,257},{940,269},{960,266}},
 {{0,309},{20,291},{45,284},{68,277},{95,279},{120,297},{144,310},{166,305},{183,295},{211,299},{249,316},{286,321},{324,311},{356,303},{379,310},{411,324},{440,327},{473,312},{500,310},{535,321},{557,306},{580,291},{610,285},{639,299},{668,315},{691,310},{710,299},{741,307},{775,320},{799,308},{825,283},{850,276},{877,288},{909,305},{936,313},{960,309}}
}
local palettes={{'51434a','66504f','745b54','8b6b5b'},{'342b31','493535','63443a','7e5541'},{'171c23','25252c','383035','594037'}}
for k,profile in ipairs(profiles) do
 local im=Image(W,H,ColorMode.RGB) local p={} for _,q in ipairs(profile) do p[#p+1]=q end p[#p+1]={W,H} p[#p+1]={0,H}
 poly(im,p,palettes[k][1])
 -- Sandstone planes face the sun at upper right. Broken strata follow each face.
 for i=2,#profile-1 do local a,b,c=profile[i-1],profile[i],profile[i+1]
  if b[2]<a[2] and b[2]<=c[2] then
   local base=math.min(H-1,b[2]+(k==1 and 92 or 118))
   local fold={{b[1],b[2]},{b[1]-3,b[2]+18},{b[1]+2,b[2]+34},{b[1]-7,b[2]+61},{b[1]-14,base}}
   poly(im,{{b[1],b[2]},{c[1],c[2]},{c[1]+28,base},{b[1]-14,base},{b[1]-7,b[2]+61},{b[1]+2,b[2]+34},{b[1]-3,b[2]+18}},palettes[k][2])
   poly(im,{{b[1]+1,b[2]+1},{c[1],c[2]},{b[1]+14,b[2]+56},{b[1]+2,b[2]+34}},palettes[k][3])
   path(im,{{b[1],b[2]},{c[1],c[2]}},palettes[k][4])
   path(im,fold,palettes[k][3])
   -- Wide clustered shelves; no uniform pixel noise over the rock masses.
   for j=1,(k==1 and 4 or 10) do
    local y=b[2]+7+j*(k==1 and 17 or 9) local width=math.min(45,c[1]-b[1]+j*2)
    local x=b[1]+2-math.floor(j/3)*2
    path(im,{{x,y},{x+math.floor(width*.35),y+1},{x+math.floor(width*.7),y+3},{x+width,y+3}},palettes[k][j%3==0 and 3 or 1])
    if k>=2 and j%2==0 then
     line(im,x+4,y-1,x+math.floor(width*.6),y+1,palettes[k][3])
     line(im,x+math.floor(width*.7),y+4,x+width+4,y+4,palettes[k][1])
    end
   end
   if k>=2 then
    path(im,{{b[1]+8,b[2]+12},{b[1]+6,b[2]+29},{b[1]+10,b[2]+34},{b[1]+8,b[2]+44}},palettes[k][1])
    path(im,{{c[1]-5,c[2]+17},{c[1]-10,c[2]+30},{c[1]-8,c[2]+44}},palettes[k][1])
    for j=0,11 do local rx=b[1]-20+j*5 local ry=base-8+(j*7)%17
     poly(im,{{rx,ry},{rx+3,ry-3-j%3},{rx+8,ry+2}},palettes[k][2]) line(im,rx+3,ry-3-j%3,rx+6,ry,palettes[k][3])
    end
   end
  end
 end
 -- Clip every rock detail to the original silhouette, avoiding floating strata.
 local mask=Image(W,H,ColorMode.RGB) poly(mask,p,'ffffff')
 for y=0,H-1 do for x=0,W-1 do if app.pixelColor.rgbaA(mask:getPixel(x,y))==0 then im:drawPixel(x,y,0) end end end
 im:saveAs(out..'/ridge-'..k..'.png') layers[#layers+1]=im names[#names+1]='0'..(k+1)..' Relief '..k
end
local mist=Image(W,H,ColorMode.RGB)
for i=0,30 do local x=(i*137)%W local y=228+(i*19)%83 local len=25+(i*17)%90 for j=0,len do if (j+i)%5~=0 then px(mist,(x+j)%W,y+(j%17==0 and 1 or 0),'71534f') end end end
mist:saveAs(out..'/dust.png') layers[#layers+1]=mist names[#names+1]='05 Voiles de poussiere'
local near=Image(W,H,ColorMode.RGB)
poly(near,{{0,333},{33,319},{51,308},{71,305},{96,325},{126,336},{159,334},{180,349},{218,344},{262,352},{302,351},{351,358},{414,354},{464,345},{503,349},{549,340},{587,335},{614,344},{647,334},{677,320},{698,317},{723,332},{763,341},{803,348},{851,341},{887,327},{914,317},{931,321},{960,333},{960,360},{0,360}},'0a1218')
for i=0,24 do local x=(i*137)%W local y=345+i%4*3 line(near,x,y,x+7,y-1,'25252c') end
near:saveAs(out..'/foreground.png') layers[#layers+1]=near names[#names+1]='06 Roches au premier plan'
saveSource('hearthreaver-landscape',layers,names,W,H)
-- The title mask is explicitly constructed letter by letter, at native resolution.
local LW,LH=490,146 local lettering=Image(LW,LH,ColorMode.RGB) local white=rgba('ffffff')
local function glyph(ch)
 local im=Image(40,58,ColorMode.RGB)
 local function p(q) poly(im,q,white) end local function l(q,w) path(im,q,white,w or 4) end
 if ch=='H' then
  p({{3,5},{9,1},{14,5},{11,10},{11,45},{16,49},{7,53},{1,49},{5,44},{5,13},{1,10}})
  p({{24,4},{30,0},{35,4},{32,9},{32,43},{36,47},{30,52},{24,49},{26,43},{26,10},{22,8}})
  p({{9,25},{27,25},{27,31},{9,31}}) return im,36
 elseif ch=='R' then
  p({{3,5},{10,1},{15,5},{12,10},{12,44},{16,48},{8,53},{1,49},{6,43},{6,13},{1,10}})
  l({{12,7},{23,4},{32,11},{32,19},{24,27},{13,27}},5)
  p({{18,26},{24,26},{27,36},{33,47},{38,47},{34,53},{28,52},{23,42}})
  return im,39
 elseif ch=='h' then
  p({{2,8},{9,3},{13,6},{10,11},{10,26},{16,21},{22,24},{22,44},{26,47},{20,52},{16,48},{17,43},{17,29},{14,26},{10,30},{10,44},{13,47},{7,52},{1,48},{5,43},{5,13}}) return im,26
 elseif ch=='t' then
  p({{8,10},{15,5},{15,21},{21,21},{18,26},{15,26},{15,43},{20,46},{23,43},{24,46},{18,52},{10,48},{10,27},{4,27},{6,22},{10,22}}) return im,24
 elseif ch=='r' then
  p({{1,26},{7,21},{12,25},{11,28},{17,21},{23,25},{19,31},{14,28},{11,32},{11,44},{15,47},{9,52},{2,48},{6,43},{6,30}}) return im,23
 elseif ch=='v' then
  p({{1,25},{7,21},{12,25},{9,29},{15,44},{19,38},{19,28},{16,25},{21,21},{26,26},{23,30},{23,39},{14,52},{10,48},{4,30}}) return im,27
 elseif ch=='e' then
  p({{4,28},{13,21},{23,27},{23,31},{10,39},{10,44},{16,47},{23,42},{24,45},{16,52},{5,47},{4,43}})
  poly(im,{{10,28},{14,26},{18,29},{10,34}},0) return im,25
 elseif ch=='a' then
  p({{6,23},{14,21},{22,26},{22,43},{26,46},{20,52},{16,48},{11,52},{3,47},{3,38},{16,31},{16,28},{12,25},{6,29},{2,27}})
  poly(im,{{9,39},{16,35},{16,44},{12,47},{9,44}},0) return im,26
 end
end
local function stamp(ch,x,y,scale)
 local im,w=glyph(ch)
 for yy=0,math.floor(58*scale)-1 do for xx=0,math.floor(w*scale)-1 do
  if app.pixelColor.rgbaA(im:getPixel(math.floor(xx/scale),math.floor(yy/scale)))>0 then px(lettering,x+xx,y+yy,white) px(lettering,x+xx+1,y+yy,white) end
 end end
 return math.floor(w*scale)
end
-- The user's sketch: the first H and last R descend below the lowercase baseline.
stamp('H',4,27,1.65)
local word='earthreave' local xx=65
for i=1,#word do xx=xx+stamp(word:sub(i,i),xx,8,1.4)-1 end
stamp('R',xx-2,20,1.7)
-- Crimson forged metal, thick gold bevel and a dark extruded cut edge.
local ink=Image(LW,LH,ColorMode.RGB) local gold=Image(LW,LH,ColorMode.RGB)
local function solid(x,y) return x>=0 and y>=0 and x<LW and y<LH and app.pixelColor.rgbaA(lettering:getPixel(x,y))>0 end
for y=0,LH-1 do for x=0,LW-1 do if solid(x,y) then
 for dy=-2,5 do for dx=-2,4 do if math.abs(dx)+math.abs(dy)<7 then px(ink,x+dx,y+dy,dy>2 and '442521' or '100e15') end end end
 local bottom=(x<64 or x>xx) and 114 or 82 local v=y/bottom
 local col=v<.35 and '6c182b' or v<.5 and 'b52d39' or v<.57 and 'e6624b' or v<.78 and 'a32832' or '6f1728'
 if not solid(x,y-1) or not solid(x-1,y) then col='ffe4a0'
 elseif not solid(x,y-2) or not solid(x-2,y) then col='c88d48'
 elseif not solid(x+1,y) or not solid(x,y+1) then col='7b3b27'
 elseif not solid(x+2,y) or not solid(x,y+2) then col='b77835' end
 px(gold,x,y,col)
end end end
-- Sword and desert seal: a single weapon underlines the name.
local weapon=Image(LW,LH,ColorMode.RGB)
poly(weapon,{{8,121},{448,121},{488,126},{448,132},{8,132}},'100e15')
poly(weapon,{{88,123},{445,123},{482,126},{445,130},{88,130}},'936f52')
line(weapon,89,123,445,123,'ffe4a0') line(weapon,89,126,481,126,'cf9855') line(weapon,89,129,445,129,'5f3a34')
line(weapon,115,125,438,125,'b74430')
for i=0,8 do rect(weapon,26+i*5,123,4,7,i%2==0 and 'c88d48' or '6c182b') end
poly(weapon,{{15,123},{21,117},{27,123},{27,130},{21,136},{15,130}},'c88d48') rect(weapon,19,122,3,8,'ffe4a0')
poly(weapon,{{71,112},{76,107},{82,115},{88,126},{82,137},{76,142},{71,138},{77,132},{79,126},{76,119}},'c88d48')
path(weapon,{{72,112},{76,109},{81,116},{85,126},{80,135},{76,139}},'ffe4a0')
local composed=Image(LW,LH,ColorMode.RGB) composed:drawImage(weapon,Point(0,0)) composed:drawImage(ink,Point(0,0)) composed:drawImage(gold,Point(0,0))
composed:saveAs(out..'/hearthreaver-logo.png')
-- Flame reflections are authored as twelve pixel frames clipped to the metal.
local anim=Sprite(LW,LH,ColorMode.RGB) anim.layers[1].name='01 Epee'
local li=anim:newLayer() li.name='02 Contour forge' local lg=anim:newLayer() lg.name='03 Metal rouge et or' local lf=anim:newLayer() lf.name='04 Reflets de flammes'
local strip=Image(LW*12,LH,ColorMode.RGB)
for f=0,11 do
 if f>0 then anim:newEmptyFrame() end anim.frames[f+1].duration=.12
 local shine=Image(LW,LH,ColorMode.RGB)
 for y=42,118 do for x=0,LW-1 do if solid(x,y) then
  local bottom=(x<64 or x>xx) and 114 or 82
  local wave=math.sin(x*.055-f*math.pi/6)*3+math.sin(x*.12+f*math.pi/6)*2
  local d=bottom-y+wave
  if d<15 and d>0 and (not solid(x,y+2) or not solid(x+1,y+1)) then px(shine,x,y,d<7 and 'ffe4a0' or 'ed9a49')
  elseif d<12 and d>0 and solid(x-2,y) and solid(x+2,y) then px(shine,x,y,d<5 and 'd97537' or 'bc3e2e') end
 end end end
 -- Reflected warm glints also travel along the blade, without flashing the whole title.
 for j=0,6 do local x=105+((j*61+f*6)%325) line(shine,x,127,x+8,127,'e7ab5b') end
 anim:newCel(anim.layers[1],f+1,weapon,Point(0,0)) anim:newCel(li,f+1,ink,Point(0,0)) anim:newCel(lg,f+1,gold,Point(0,0)) anim:newCel(lf,f+1,shine,Point(0,0))
 strip:drawImage(shine,Point(f*LW,0))
end
local tag=anim:newTag(1,12) tag.name='Reflets de flammes — boucle' anim:saveAs(out..'/hearthreaver-logo.aseprite') anim:close()
strip:saveAs(out..'/title-flame.png')
-- The app monogram is drawn in its own editable Aseprite source.
dofile(out..'/../../scripts/app-icon.lua')
-- Four hand-pixelled nine-slice button states, matching the crimson/gold title.
local menu=Sprite(72,24,ColorMode.RGB) menu.layers[1].name='01 Metal rouge et or'
for i,state in ipairs({'idle','hover','pressed','disabled'}) do
 local im=Image(72,24,ColorMode.RGB)
 local off=state=='disabled' local down=state=='pressed' local hot=state=='hover'
 local edge=off and '64574c' or 'c88d48' local light=off and '8c7b66' or down and '9b603b' or 'ffe4a0'
 local face=off and '25232a' or down and '351923' or hot and '6c2331' or '461f2b'
 poly(im,{{0,5},{5,0},{66,0},{71,5},{71,18},{66,23},{5,23},{0,18}},'100e15')
 poly(im,{{1,5},{5,1},{66,1},{70,5},{70,18},{66,22},{5,22},{1,18}},edge)
 poly(im,{{3,6},{6,3},{65,3},{68,6},{68,17},{65,20},{6,20},{3,17}},'1d141d')
 poly(im,{{5,7},{7,5},{64,5},{66,7},{66,16},{64,18},{7,18},{5,16}},face)
 line(im,6,1,65,1,light) line(im,1,6,1,17,light)
 line(im,7,21,65,21,off and '3f3735' or '713728')
 line(im,8,5,63,5,off and '302c30' or hot and '9b3b3e' or '6c2b34')
 for _,x in ipairs({7,64}) do poly(im,{{x,9},{x+2,12},{x,15},{x-2,12}},edge) px(im,x,11,light) end
 im:saveAs(out..'/button-'..state..'.png')
 if i>1 then menu:newEmptyFrame() end menu:newCel(menu.layers[1],i,im,Point(0,0)) local tag=menu:newTag(i,i) tag.name=state
end
menu:saveAs(out..'/hearthreaver-menu.aseprite') menu:close()
local meta=io.open(out..'/title-art.json','w')
meta:write('{"version":3,"logo":[490,146],"flame":{"file":"title-flame.png","frames":12,"frameMs":120},"scene":[640,360],"panoramaWidth":960,"layers":[{"file":"sky.png","speed":0},{"file":"ridge-1.png","speed":0.6},{"file":"ridge-2.png","speed":1.5},{"file":"dust.png","speed":3.2},{"file":"ridge-3.png","speed":3},{"file":"foreground.png","speed":5}],"source":"Aseprite / scripts/title-art.lua","lettering":"HearthreaveR"}') meta:close()
