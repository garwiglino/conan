-- Native Aseprite pixel components from the approved design.
local W,H=80,80
local HEX={O='24212b',K='263239',D='354953',M='486671',L='708b91',b='795445',g='a57550',G='c49a63',Y='e0bf83',H='f4deb0',t='285652',T='4a9b88',E='a6dfbb'}
local order={'O','K','D','M','L','b','g','G','Y','H','t','T','E'}
local C={} for k,h in pairs(HEX) do C[k]=app.pixelColor.rgba(tonumber(h:sub(1,2),16),tonumber(h:sub(3,4),16),tonumber(h:sub(5,6),16),255) end
local function px(im,x,y,k) x=math.floor(x+.5) y=math.floor(y+.5) if x>=0 and x<W and y>=0 and y<H then im:drawPixel(x,y,C[k]) end end
local function rect(im,x,y,w,h,k) for yy=y,y+h-1 do for xx=x,x+w-1 do px(im,xx,yy,k) end end end
local function line(im,x,y,xx,yy,k)
 x=math.floor(x+.5) y=math.floor(y+.5) xx=math.floor(xx+.5) yy=math.floor(yy+.5)
 local dx=math.abs(xx-x) local sx=x<xx and 1 or -1 local dy=-math.abs(yy-y) local sy=y<yy and 1 or -1 local er=dx+dy
 while true do px(im,x,y,k) if x==xx and y==yy then break end local e=er*2 if e>=dy then er=er+dy x=x+sx end if e<=dx then er=er+dx y=y+sy end end
end
local function poly(im,pts,k)
 local lo,hi=H,0 for _,p in ipairs(pts) do lo=math.min(lo,p[2]) hi=math.max(hi,p[2]) end
 for y=math.floor(lo),math.ceil(hi) do
  local xs={} for j,a in ipairs(pts) do local b=pts[j%#pts+1]
   if (a[2]<=y+.01 and b[2]>y+.01) or (b[2]<=y+.01 and a[2]>y+.01) then xs[#xs+1]=a[1]+(y+.01-a[2])*(b[1]-a[1])/(b[2]-a[2]) end
  end
  table.sort(xs) for j=1,#xs-1,2 do for x=math.ceil(xs[j]),math.floor(xs[j+1]) do px(im,x,y,k) end end
 end
 for j,p in ipairs(pts) do local q=pts[j%#pts+1] line(im,p[1],p[2],q[1],q[2],k) end
end
local function at(pts,x,y) local r={} for _,p in ipairs(pts) do r[#r+1]={x+p[1],y+p[2]} end return r end
local function shape(im,pts,base,planes)
 local mask=Image(W,H,ColorMode.RGB) poly(mask,pts,base) local fill=Image(mask)
 for _,p in ipairs(planes or {}) do poly(fill,p[2],p[1]) end
 for y=0,H-1 do for x=0,W-1 do
  if mask:getPixel(x,y)~=0 then im:drawPixel(x,y,fill:getPixel(x,y))
  elseif (x>0 and mask:getPixel(x-1,y)~=0) or (x<W-1 and mask:getPixel(x+1,y)~=0) or (y>0 and mask:getPixel(x,y-1)~=0) or (y<H-1 and mask:getPixel(x,y+1)~=0) then px(im,x,y,'O') end
 end end
end
local function stamp(im,rows,x,y) for j,r in ipairs(rows) do for i=1,#r do local k=r:sub(i,i) if C[k] then px(im,x+i-1,y+j-1,k) end end end end
local function arm(im,a,b,c,far,rage)
 local function limb(a,b,w)
  local dx,dy=b[1]-a[1],b[2]-a[2] local len=math.max(1,math.sqrt(dx*dx+dy*dy)) local nx,ny=-dy/len*w,dx/len*w
  shape(im,{{a[1]+nx,a[2]+ny},{b[1]+nx,b[2]+ny},{b[1]-nx,b[2]-ny},{a[1]-nx,a[2]-ny}},far and 'D' or 'M',{
   {'L',{{a[1]-2,a[2]-2},{b[1]-2,b[2]-1},{b[1],b[2]},{a[1],a[2]}}},
   {'K',{{a[1]+1,a[2]},{b[1]+1,b[2]},{b[1]+4,b[2]+2},{a[1]+4,a[2]+2}}}})
 end
 limb(a,b,2) limb(b,c,1.7)
 rect(im,c[1]-2,c[2]-2,4,2,'g') rect(im,c[1]-2,c[2]-2,3,1,'Y')
 rect(im,c[1]-1,c[2],3,3,rage and 'T' or 'G') px(im,c[1]-1,c[2],rage and 'E' or 'H') px(im,c[1]+2,c[2]+1,'O')
end
local function cobraStaff(im,x,y,dir,rage,lean)
 -- The bronze foot stays planted at y=52; its head has a very small sway.
 local tip=x+lean local shaftTop=y+4
 line(im,x,51,tip,shaftTop,'O') line(im,x+2,51,tip+2,shaftTop,'O')
 line(im,x+1,50,tip+1,shaftTop,'G') line(im,x,47,tip,shaftTop,'g')
 for yy=36,43,3 do px(im,x,yy,'Y') end
 local side=dir==1 or dir==3
 if side then
  local q=dir==3 and -1 or 1
  local pts={{-3,-1},{-3,-5},{-1,-8},{3,-8},{5,-6},{4,-4},{1,-4},{1,1},{-1,4}}
  for _,p in ipairs(pts) do p[1]=p[1]*q end
  shape(im,at(pts,tip,y),'G',{
   {'Y',at({{-4,-7},{0,-9},{4,-8},{1,-6},{-3,-3}},tip,y)},
   {'g',at({{2,-5},{5,-4},{4,2},{0,4},{0,-3}},tip,y)}})
  if q==1 then rect(im,tip+3,y-6,2,1,rage and 'H' or 'E') else rect(im,tip-2,y-6,2,1,rage and 'H' or 'E') end
 else
  shape(im,at({{-4,-1},{-5,-4},{-3,-8},{0,-9},{3,-8},{5,-4},{4,-1},{2,1},{1,5},{-1,5},{-2,1}},tip,y),'g',{
   {'Y',at({{-3,-7},{0,-8},{2,-7},{0,-4},{-1,3},{-2,0},{-4,-3}},tip,y)},
   {'G',at({{1,-7},{3,-6},{4,-3},{2,0},{1,4},{0,1}},tip,y)}})
  rect(im,tip-2,y-5,5,3,dir==0 and 'G' or 'K')
  if dir~=0 then px(im,tip-1,y-5,rage and 'H' or 'E') px(im,tip+2,y-5,rage and 'H' or 'E') px(im,tip,y-3,'G') end
  line(im,tip-3,y-2,tip-1,y,'g')
 end
end
local function feet(im,dir,rage)
 if dir%2==0 then
  stamp(im,{'..OOO....OOO..','.ObgGO..ObgGO.','ObgGYO..ObggGO','OOOOOO..OOOOOO'},33,49)
 else
  if dir==1 then stamp(im,{'OOO.......','ObgO.OOO..','ObgGOObgGO','OOOOOOOOOO'},35,49)
  else stamp(im,{'......OOO.','..OOO.ObgO','ObgGOObgGO','OOOOOOOOOO'},35,49) end
 end
end
local function robe(im,p,dir,rage)
 local b=p.body local sw=p.tail local side=dir%2==1
 if not side then
  local pts={{32,27+b},{47,27+b},{49,36},{50+sw,43},{53+sw,48},{47,50},{43,48},{37,50},{28+sw,48},{31,40}}
  shape(im,pts,'D',{
   {'M',{{33,29+b},{39,32+b},{37,42},{34,49},{29,47}}},
   {'L',{{33,32+b},{34,34},{33,43},{31,46},{32,39}}},
   {'K',{{43,29+b},{48,28+b},{48,37},{50+sw,44},{53+sw,48},{47,49},{43,46}}},
   {'M',{{40,35},{43,36},{44,46},{41,49},{38,48}}}})
  line(im,29+sw,47,34,48,'g') line(im,34,48,37,47,'G') line(im,44,47,48,49,'g') line(im,48,49,51+sw,47,'G')
  if dir==2 then
   shape(im,{{37,35},{43,35},{43,43},{46,48},{40,50},{36,48}},'g',{
    {'Y',{{37,36},{39,36},{38,45},{40,48},{38,48},{36,46}}},
    {'G',{{39,35},{42,35},{41,44},{43,48},{40,49},{38,46}}}})
   -- One coherent embroidered snake; quiet fabric elsewhere.
   line(im,40,38,41,40,'t') line(im,41,40,39,43,'t') line(im,39,43,41,46,'t') px(im,40,38,'E')
  else
   line(im,39,32+b,38+sw,42,'M') line(im,38+sw,42,41,47,'M')
   line(im,40,34+b,41,38,'g') line(im,41,38,39,41,'g') px(im,39,41,'G')
  end
  rect(im,34,34+b,13,3,'b') line(im,34,34+b,45,34+b,'Y')
  if dir==2 then stamp(im,{'.GGG.','GYtYG','.GTG.'},38,33+b) end
 else
  local q=dir==1 and 1 or -1
  -- Back drapery is longer; the front shows the leg instead of a mirrored cone.
  local back=40-q*8
  shape(im,{{36,27+b},{45,28+b},{47,39},{48+sw,48},{42,50},{32,48},{34,40}},'D',{
   {'M',{{35,29+b},{39,32},{37,42},{35,48},{32,47}}},
   {'L',{{35,30+b},{36,33},{35,40},{34,42},{34,36}}},
   {'K',{{43,29+b},{46,31},{46,39},{48+sw,48},{43,49},{41,43}}}})
  line(im,33,47,37,48,'G') line(im,43,48,47,47,'g')
  line(im,back,32+b,back+sw,44,'M')
  rect(im,35,34+b,11,2,'g') rect(im,35,34+b,7,1,'Y')
  local tx=dir==1 and 44 or 34
  line(im,tx,37,tx,46,'G') line(im,tx,46,tx+q*2,48,'G') px(im,tx,39,'t')
 end
end
local function mantle(im,p,dir,rage)
 local y=27+p.body local side=dir%2==1
 if side then
  shape(im,{{34,y},{36,y-3},{43,y-3},{47,y},{46,y+5},{41,y+8},{35,y+4}},'g',{
   {'Y',{{34,y},{36,y-3},{40,y-3},{40,y},{35,y+2}}},
   {'G',{{39,y},{44,y-1},{47,y},{45,y+3},{41,y+6},{38,y+4}}}})
  line(im,36,y+2,40,y+5,'t') line(im,40,y+5,44,y+2,'t') px(im,37,y+1,'H')
 else
  shape(im,{{28,y},{31,y-3},{48,y-3},{52,y},{49,y+5},{40,y+8},{30,y+5}},'g',{
   {'Y',{{28,y},{31,y-3},{40,y-3},{40,y},{33,y+3},{30,y+2}}},
   {'G',{{39,y-1},{48,y-2},{52,y},{48,y+4},{40,y+7},{34,y+4}}}})
  line(im,31,y+1,40,y+5,'t') line(im,40,y+5,49,y+1,'t')
  line(im,32,y+3,39,y+6,'Y') line(im,41,y+6,47,y+3,'G')
  if dir==2 then stamp(im,{'.G.','GTE','.t.'},39,y+4) else rect(im,39,y,2,5,'g') end
 end
end
local function head(im,p,dir,rage)
 local y=18+p.head local side=dir%2==1 local flare=rage and 3 or 0
 if not side then
  shape(im,at({{-3,-10},{3,-10},{8,-7},{11+flare,-3},{11+flare,1},{8,6},{5,10},{-5,10},{-8,6},{-11-flare,1},{-11-flare,-3},{-8,-7}},40,y),'D',{
   {'M',at({{-3,-10},{3,-10},{5,-7},{-4,-5},{-7,1},{-8,5},{-11,1},{-11,-3},{-7,-7}},40,y)},
   {'K',at({{5,-7},{11+flare,-3},{11+flare,1},{8,6},{5,10},{3,5}},40,y)}})
  -- Cobra ribs are sparse, paired bands around the mask, not a noisy texture.
  line(im,31-flare,y-4,34,y-7,'Y') line(im,34,y-7,37,y-8,'Y')
  line(im,43,y-8,47,y-6,'G') line(im,47,y-6,49+flare,y-3,'g')
  for k=0,2 do
   line(im,30-flare+k,y+k*3,33+k,y+k*3+1,'G')
   line(im,47-k,y+k*3+1,50+flare-k,y+k*3,'g')
  end
  if dir==2 then
   stamp(im,{'..gYYYYg..','.gYHHYYGg.','gYHHHYYGGg','gYGggggGGg','gYOtOOtOGg','gYGgYGgGGg','.YGGHGGGg.','.gYGYGGg..','..YGGYGg..','..gYGGg...','...gGg....','....g.....'},35,y-5)
   px(im,38,y-1,rage and 'E' or 't') px(im,41,y-1,rage and 'E' or 't')
   if rage then
    line(im,40,y-4,39,y-2,'O') line(im,39,y-2,40,y+1,'t')
    stamp(im,{'OtTTO','OTEYO','.TtT.','.EtE.','..t..'},37,y+2)
   end
  else
   shape(im,at({{-4,-5},{3,-5},{6,0},{5,8},{1,10},{-4,8},{-5,0}},40,y),'M',{
    {'L',at({{-4,-5},{0,-5},{-1,1},{-2,6},{-4,8},{-5,0}},40,y)},
    {'D',at({{1,-4},{3,-5},{6,0},{5,8},{1,10},{0,4}},40,y)}})
   line(im,40,y-2,40,y+7,rage and 'T' or 'g') line(im,38,y+5,40,y+7,'G') line(im,42,y+5,40,y+7,'G')
   if rage then px(im,40,y+3,'E') end
  end
  -- Uraeus: a small bent serpent crown, with a jewel at its forehead.
  stamp(im,{'..OOO..','.OGYO..','.OYGGO.','..GtGO.','..GtGO.','.GGYGG.'},37,y-13)
  px(im,40,y-9,rage and 'E' or 'T')
 else
  local q=dir==1 and 1 or -1
  local pts=dir==1 and {{34,y-9},{39,y-11},{44,y-8},{46,y-4},{46,y+6},{42,y+10},{35,y+8},{32-flare,y+2},{32-flare,y-3}}
   or {{46,y-9},{41,y-11},{36,y-8},{34,y-4},{34,y+6},{38,y+10},{45,y+8},{48+flare,y+2},{48+flare,y-3}}
  shape(im,pts,'D',{
   {'M',{{30,y-8},{42,y-11},{40,y-3},{36,y+7},{31,y+5}}},
   {'L',{{32,y-4},{35,y-7},{37,y-8},{35,y-2},{34,y+1}}},
   {'K',{{43,y-8},{49,y-8},{51,y+8},{43,y+10},{41,y+4}}}})
  if dir==1 then
   line(im,34,y-7,38,y-9,'Y') line(im,33,y-3,35,y-5,'G')
   line(im,33,y+1,36,y+1,'G') line(im,34,y+4,37,y+4,'g')
   stamp(im,{'ggg....','GYYg...','GHHYGg.','GYggYG.','GYOtOg.','gGYGg..','.gYYG..','.gYGG..','..gGg..','...g...'},41,y-5)
   stamp(im,{'OOO..','OGYO.','.GYGO','..GGO','..tG.'},40,y-13)
   px(im,44,y-1,rage and 'E' or 't')
  else
   line(im,39,y-10,44,y-8,'Y') line(im,45,y-7,47,y-4,'G')
   line(im,45,y,48,y,'g') line(im,44,y+3,47,y+3,'g')
   stamp(im,{'....ggg','...gYYG','.gGYHHG','.GYggYG','.gOtOYG','..gGYGg','..GYYg.','..GGYg.','..gGg..','...g...'},32,y-5)
   stamp(im,{'..OOO','.OYGg','OGYG.','OGG..','.Gt..'},36,y-13)
   px(im,35,y-1,rage and 'E' or 't')
  end
  if rage then
   local x=dir==1 and 44 or 34
   rect(im,x,y+2,2,3,'T') px(im,x,y+2,'E') px(im,x+1,y+5,'E')
  end
 end
end

return {C=C,HEX=HEX,order=order,px=px,rect=rect,line=line,poly=poly,shape=shape,stamp=stamp,arm=arm,feet=feet,robe=robe,mantle=mantle,head=head}
