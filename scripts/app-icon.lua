-- Hearthreaver app monogram. Original pixels, four editable Aseprite layers.
-- Run: aseprite -b --script-param out=art/title --script scripts/app-icon.lua
local out=app.params['out']
local N=128
local function color(h) return app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255) end
local function px(im,x,y,c) x=math.floor(x+.5) y=math.floor(y+.5) if x>=0 and y>=0 and x<N and y<N then im:drawPixel(x,y,type(c)=='string' and color(c) or c) end end
local function poly(im,p,c)
 for y=0,N-1 do local xs={}
  for i,a in ipairs(p) do local b=p[i%#p+1] if (a[2]<=y and b[2]>y) or (b[2]<=y and a[2]>y) then xs[#xs+1]=a[1]+(y-a[2])*(b[1]-a[1])/(b[2]-a[2]) end end
  table.sort(xs) for i=1,#xs-1,2 do for x=math.ceil(xs[i]),math.floor(xs[i+1]) do px(im,x,y,c) end end
 end
end
local function line(im,x,y,x2,y2,c,w)
 local steps=math.max(math.abs(x2-x),math.abs(y2-y))
 for i=0,steps do for dx=0,(w or 1)-1 do for dy=0,(w or 1)-1 do px(im,x+(x2-x)*i/math.max(steps,1)+dx,y+(y2-y)*i/math.max(steps,1)+dy,c) end end end
end
local function path(im,p,c,w) for i=2,#p do line(im,p[i-1][1],p[i-1][2],p[i][1],p[i][2],c,w) end end
local bg=Image(N,N,ColorMode.RGB) bg:clear(color('080f16'))
-- Opaque square canvas: the operating system supplies its own corner mask.
poly(bg,{{0,0},{128,0},{128,35},{0,99}},'101d26')
poly(bg,{{0,99},{128,35},{128,128},{0,128}},'0c161e')
poly(bg,{{9,30},{30,9},{97,9},{118,30},{118,97},{97,118},{30,118},{9,97}},'050b11')
poly(bg,{{11,31},{31,11},{96,11},{116,31},{116,96},{96,116},{31,116},{11,96}},'46342d')
poly(bg,{{13,32},{32,13},{95,13},{114,32},{114,95},{95,114},{32,114},{13,95}},'16222a')
poly(bg,{{14,33},{33,14},{94,14},{113,33},{113,59},{14,94}},'1d2a32')
path(bg,{{11,51},{11,31},{31,11},{51,11}},'9c754b')
path(bg,{{78,116},{96,116},{116,96},{116,77}},'594030')
path(bg,{{14,33},{33,14},{48,14}},'304048')
-- The sword runs between the initials: an exposed point and a compact hilt.
local sword=Image(N,N,ColorMode.RGB)
poly(sword,{{63,11},{69,26},{67,98},{60,98},{58,26}},'03080d')
poly(sword,{{63,13},{67,27},{65,98},{61,98},{60,27}},'7b8990')
poly(sword,{{63,16},{63,96},{61,96},{61,28}},'e8dec1')
poly(sword,{{64,20},{66,28},{64,96}},'a8b8b8')
line(sword,63,27,63,94,'fff1c7')
-- Tiny longitudinal red reflection ties steel to the crimson letters.
line(sword,65,43,65,82,'7b4043')
poly(sword,{{44,96},{48,92},{52,96},{76,96},{80,92},{84,96},{81,102},{75,100},{53,100},{47,102}},'080d14')
poly(sword,{{46,96},{48,94},{53,97},{75,97},{80,94},{82,96},{79,100},{74,99},{54,99},{49,100}},'b67b3c')
path(sword,{{47,96},{49,95},{53,97},{75,97},{79,95},{80,96}},'ffe4a0')
poly(sword,{{60,100},{67,100},{66,111},{68,114},{64,119},{59,115},{61,111}},'070d13')
for y=101,110 do for x=62,65 do px(sword,x,y,(x+y)%4==0 and 'ba7942' or '632b32') end end
poly(sword,{{63,111},{67,114},{64,117},{60,114}},'b67b3c')
path(sword,{{61,114},{63,112},{65,114}},'ffe4a0')
-- Blackletter H/R share the menu's glyph construction, with optical spacing.
local mask=Image(N,N,ColorMode.RGB)
local function glyph(x,y,shapes)
 for _,shape in ipairs(shapes) do local p={} for _,a in ipairs(shape) do p[#p+1]={x+a[1]*1.16,y+a[2]*1.16} end poly(mask,p,'ffffff') end
end
glyph(13,29,{
 {{3,5},{9,1},{14,5},{11,10},{11,45},{16,49},{7,53},{1,49},{5,44},{5,13},{1,10}},
 {{24,4},{30,0},{35,4},{32,9},{32,43},{36,47},{30,52},{24,49},{26,43},{26,10},{22,8}},
 {{9,25},{27,25},{27,31},{9,31}}
})
glyph(68,27,{
 {{3,5},{10,1},{15,5},{12,10},{12,44},{16,48},{8,53},{1,49},{6,43},{6,13},{1,10}},
 {{11,7},{23,3},{34,10},{36,16},{33,24},{25,30},{12,30},{12,24},{24,24},{29,19},{29,14},{22,9},{12,13}},
 {{18,27},{25,27},{28,38},{33,47},{38,47},{34,53},{28,52},{23,42}}
})
local shadow=Image(N,N,ColorMode.RGB) local metal=Image(N,N,ColorMode.RGB)
local function solid(x,y) return x>=0 and y>=0 and x<N and y<N and app.pixelColor.rgbaA(mask:getPixel(x,y))>0 end
for y=0,N-1 do for x=0,N-1 do if solid(x,y) then
 for dy=-2,4 do for dx=-2,3 do if math.abs(dx)+math.abs(dy)<=5 then px(shadow,x+dx,y+dy,dy>1 and '35212a' or '050a10') end end end
 local c=y<46 and '741d32' or y<53 and 'a52d3d' or y<58 and 'dd654f' or y<76 and 'a42e3c' or '6c2035'
 if not solid(x,y-1) or not solid(x-1,y) then c='ffe4a0'
 elseif not solid(x,y-2) or not solid(x-2,y) then c='c88d48'
 elseif not solid(x,y+1) or not solid(x+1,y) then c='6d352c'
 elseif not solid(x,y+2) or not solid(x+2,y) then c='ae703b' end
 px(metal,x,y,c)
end end end
-- Deliberate clusters, no texture noise across the tiny readable letter shapes.
local sprite=Sprite(N,N,ColorMode.RGB)
local images={bg,sword,shadow,metal}
local names={'01 Obsidienne et cadre','02 Epee centrale','03 Tranche du monogramme','04 Initiales H R — metal rouge et or'}
for i,im in ipairs(images) do local layer=i==1 and sprite.layers[1] or sprite:newLayer() layer.name=names[i] sprite:newCel(layer,1,im,Point(0,0)) end
sprite:saveAs(out..'/hearthreaver-icon.aseprite')
sprite:saveAs(out..'/crest.png')
for _,size in ipairs({180,192,512,1024}) do
 local copy=Sprite(sprite) app.activeSprite=copy
 -- Export with a real Aseprite background layer: PNG has no alpha channel.
 copy:flatten() app.activeLayer=copy.layers[1] app.command.BackgroundFromLayer()
 app.command.SpriteSize{width=size,height=size,method='nearest-neighbor'}
 copy:saveAs(out..'/icon-'..size..'.png') copy:close()
end
sprite:close()
