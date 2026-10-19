#!/usr/bin/env python3
"""Compile approved architecture concepts into native indexed JavaScript pixels.

Authoring only: Pillow/numpy/scipy. No concept image is loaded by the runtime.
Every source crop and source SHA is recorded so the transcription is reviewable.
"""
from pathlib import Path
import argparse, hashlib, html, json, re
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage, spatial

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = ['teremor', 'sylverive', 'igea', 'sarak', 'varan', 'tagon']
PREFIX = dict(zip(['TER','SYL','IGE','SAR','VAR','TAG'], FAMILIES))
# Native width, ground depth, rendered height. The original sheets are design
# targets; these explicit dimensions define the new native art, not screen zoom.
BUILDING_DIMENSIONS = {
 'T': [(64,56,64),(96,56,64),(64,48,88),(96,72,96),(64,56,88),(112,72,72),(112,80,88),(128,80,88),(112,64,72),(64,56,64),(64,56,72),(112,64,72),(80,72,56),(72,64,80),(128,96,72),(80,64,64),(72,64,80),(80,64,72),(112,80,72),(112,80,88),(72,64,72),(80,64,72),(112,80,88),(128,80,80)],
 'B': [(112,72,80),(112,72,72),(96,64,64),(80,56,56),(128,80,72),(96,64,80),(112,80,88),(80,64,64),(96,72,72),(80,64,72),(112,72,64),(112,80,72),(80,64,112),(96,80,88),(80,64,72),(64,56,72),(96,72,80),(112,80,72),(128,64,64),(96,72,72),(112,80,88),(96,72,80),(96,72,88),(128,80,80)],
 'F': [(80,64,80),(128,80,96),(96,72,80),(96,80,128),(64,64,128),(80,80,128),(112,48,96),(144,80,128),(112,48,80),(128,64,96),(144,80,128),(80,80,128)],
 'X': [(96,64,72),(80,64,64),(112,72,64),(144,96,88)],
 'H': [(64,48,56),(80,64,64),(64,56,88),(112,64,72),(56,48,88),(72,56,80),(80,64,88),(112,72,96),(64,56,64),(80,64,64),(80,64,88),(112,72,80),(64,56,56),(80,72,64),(72,64,80),(112,72,64),(64,56,72),(88,64,80),(80,64,72),(96,72,80),(64,56,64),(80,64,72),(112,64,80),(96,72,88)],
}
# Semantic module families. All source subviews remain independent drawings;
# a frontal stair's second drawing is a landing, never a rotated stair.
BASE_MODULES = [
 ('wall-timber',48,8,24),('wall-stone',48,8,24),('wall-adobe',48,8,24),('platform-raised',48,32,16),
 ('beam',48,8,8),('post',8,8,32),('gable',48,16,24),('ridge',48,8,8),
 ('stockade',48,8,32),('curtain',48,12,32),('end',32,12,32),('corner-outer',48,48,32),
 ('junction-t',48,48,32),('parapet',48,8,12),('deck',48,24,20),('stairs',24,48,20),
 ('door',20,8,28),('gate-leaves',40,8,32),('arch',40,8,32),('window-shutters',20,8,24),
 ('window-bars',20,8,24),('screen',32,8,24),('railing',48,8,12),('awning',48,24,20),
 ('bridge-wood',48,24,12),('bridge-stone',48,24,24),('abutment',32,24,24),('quay-wood',48,32,12),
 ('quay-stone',48,24,24),('jetty-end',48,24,12),('stairs',24,32,12),('ramp',32,32,12),
 ('cistern-wall',48,12,32),('gutter',48,16,24),('sluice-frame',32,12,32),('conduit',48,12,24),
 ('latrine',32,8,32),('drain',24,12,20),('chimney',16,16,24),('vent',16,16,24),
 ('roof-flat',48,32,16),('roof-thatch',48,32,16),('roof-fibre',48,32,16),('roof-shingle',48,32,16),
 ('roof-tile',48,32,16),('landing',48,24,20),('scaffold',48,24,32),('frame',48,24,40),
]
HIGH_SHAPES = ['curtain','end','corner-outer','corner-inner','junction-t','deck','stairs','parapet']
PORTALS = {'T03':[.28], 'H04':[.26,.74], 'H16':[.26,.74], 'H23':[.26,.74]}

def labels_and_sheets(concepts):
    page=(concepts/'index.html').read_text()
    sheets=[]
    for article in re.findall(r'<article\b.*?</article>',page,re.S):
        kind=re.search(r'data-kind="([^"]+)"',article)[1]
        title=html.unescape(re.search(r'<h2>(.*?)</h2>',article)[1])
        source=re.search(r'<img src="([^"]+)"',article)[1].split('?')[0]
        entries=[(html.unescape(code),html.unescape(name)) for code,name in re.findall(r'<li><b>([^<]+)</b>\s*([^<]+)</li>',article)]
        if len(entries) not in [3,4,8]: raise ValueError((title,len(entries)))
        family=next((f for f in FAMILIES if title.lower().startswith(f)), 'shared')
        sheets.append(dict(kind=kind,title=title,source=source,entries=entries,family=family))
    return sheets

def masks(path):
    rgba=np.asarray(Image.open(path).convert('RGBA')).copy()
    a=rgba[:,:,:3].astype(np.int16);r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    # Background gradients have a consistent dark green chroma. Do not erase
    # green painted shutters, moss or leaves enclosed within the architecture.
    green=(g>r*1.10)&(g>b*1.07)&(r<100)&(g<112)&(b<100)
    cyan=(r<115)&(g>130)&(b>120)&(g>r*1.65)&(b>r*1.55)
    mask=~(green|cyan)
    # Rules are editorial separators, not stone courses or sprite pixels.
    for y in np.where(mask.sum(axis=1)>rgba.shape[1]*.82)[0]:
        row=a[y];median=np.median(row,axis=0)
        uniform=(np.max(np.abs(row-median),axis=1)<4).mean()
        if uniform>.78 and median.min()>65 and median.max()-median.min()<40:mask[y]=False
    return rgba,mask

def components(mask):
    labels,n=ndimage.label(mask,np.ones((3,3),dtype=np.uint8))
    boxes=[]
    for i,s in enumerate(ndimage.find_objects(labels),1):
        if s is None: continue
        ys,xs=s;w=xs.stop-xs.start;h=ys.stop-ys.start
        area=int((labels[s]==i).sum())
        if w>=8 and h>=8:boxes.append(dict(x=xs.start,y=ys.start,w=w,h=h,area=area,index=i))
    return labels,boxes

def building_boxes(mask,rows):
    work=mask.copy();work[:72]=False
    labels,boxes=components(work)
    large=[b for b in boxes if b['w']>70 and b['h']>55 and b['area']>1400 and b['x']+b['w']/2>205]
    if len(large)!=rows*4:
        raise ValueError(f'Expected {rows*4} building silhouettes, got {len(large)}: {large}')
    # Sort by row baseline rather than top: a windmill or chimney can extend
    # above the neighbouring view, but all four variants share their ground.
    large.sort(key=lambda b:b['y']+b['h'])
    result=[]
    for row in range(rows):
        group=sorted(large[row*4:row*4+4],key=lambda b:b['x']+b['w']/2)
        if any(group[i]['x']>=group[i+1]['x'] for i in range(3)):raise ValueError('overlapping view columns')
        result.append(group)
    return labels,result

def module_boxes(mask):
    h,w=mask.shape
    portrait=h>w
    # Find whole silhouettes before assigning cells. Fixed rectangular crops
    # would cut the wide L/T pieces or capture a neighbouring strip.
    labs,comps=components(mask)
    candidates=[b for b in comps if b['area']>180 and (b['h']>=28 or b['w']>=55) and b['w']<w*.37 and b['y']+b['h']/2>h*.12 and b['y']+b['h']/2<h*(.765 if portrait else .78)]
    centres=np.array([.17,.345,.535,.695])*h if portrait else np.array([.19,.365,.535,.70])*h
    for iteration in range(12):
        groups=[[] for _ in range(4)]
        for b in candidates:
            cy=b['y']+b['h']/2;groups[int(np.argmin(abs(centres-cy)))].append(b)
        for i,group in enumerate(groups):
            if group:centres[i]=sum((b['y']+b['h']/2)*b['area'] for b in group)/sum(b['area'] for b in group)
    xbands=[(.10,.34),(.34,.535),(.595,.84),(.82,.995)] if portrait else [(.075,.33),(.33,.50),(.51,.79),(.79,.995)]
    result=[]
    for ri,group in enumerate(groups):
        row=[]
        for xa,xb in xbands:
            opts=[b for b in group if xa*w<b['x']+b['w']/2<xb*w]
            if not opts:raise ValueError(f'Missing complete module in row {ri} x {xa,xb}; centres {centres}')
            b=max(opts,key=lambda z:z['area']);row.append(b)
        result.append(row)
    return result

def dimensions(code):
    base=code.removesuffix('-hiver')
    if re.fullmatch('[TBFXH]\\d\\d',base): return BUILDING_DIMENSIONS[base[0]][int(base[1:])-1]
    prefix,number=base.split('-');idx=int(number[1:])-1
    # Civilian variants retain their own architectural footprint and wealth.
    return [(64,48,48),(88,64,64),(112,80,88)][idx]

def module_definition(code):
    if code.startswith('M'):
        n=int(code[1:])
        if n<=48:
            shape,w,d,height=BASE_MODULES[n-1]
            walk=height if shape in ['stairs','deck','landing','platform-raised','bridge-wood','bridge-stone','quay-wood','quay-stone','jetty-end','ramp'] else 0
            return dict(shape=shape,width=w,depth=d,totalHeight=height,walkHeight=walk,parapetHeight=12,wallThickness=8 if n<=8 else 12)
        tier=(n-49)//8;shape=HIGH_SHAPES[(n-49)%8];total=[40,48,64][tier];parapet=[10,10,12][tier]
        run=int(np.ceil((total-parapet+12)/16)*16)
        return dict(shape=shape,width=48 if shape!='stairs' else 24,depth=48 if shape in ['corner-outer','corner-inner','junction-t'] else 24 if shape=='deck' else run if shape=='stairs' else 12,totalHeight=total,walkHeight=total-parapet,parapetHeight=parapet,wallThickness=12,material='wood' if tier==0 else 'stone')
    shape=HIGH_SHAPES[int(code.split('-H')[1])-1]
    return dict(shape=shape,width=48 if shape!='stairs' else 24,depth=48 if shape in ['corner-outer','corner-inner','junction-t'] else 64 if shape=='stairs' else 24 if shape=='deck' else 16,totalHeight=64,walkHeight=52,parapetHeight=12,wallThickness=16,material='wood' if code.startswith('VAR-') else 'adobe' if code.startswith('SAR-') else 'stone')

def frame_size(definition,view):
    if definition['kind']!='module':
        return (definition['width'] if view in ['face','dos'] else definition['depth'],definition['height'])
    d=definition;s=d['shape'];w=d['width'];depth=d['depth'];h=d['totalHeight'];t=d['wallThickness']
    if s.startswith('corner'):return (48,48)
    if s=='junction-t':return (48,h) if view=='ew' else (48,48)
    if s in ['deck','landing','platform-raised','bridge-wood','quay-wood','jetty-end','ramp','roof-flat','roof-thatch','roof-fibre','roof-shingle','roof-tile','awning']:
        return (w,depth) if view=='ew' else (depth,w)
    if s=='stairs':return (24,depth+d['walkHeight']+(16 if view=='palier' else 0))
    if s=='post':return (8,32)
    if s in ['chimney','vent']:return (16,24)
    if s=='gable':return (48,24) if view=='ew' else (16,24)
    if s=='end':return (32,h) if view=='ew' else (t,32)
    if s=='parapet':return (48,d['parapetHeight']) if view=='ew' else (t,48)
    if s in ['door','gate-leaves','arch','window-shutters','window-bars','screen','latrine','drain']:
        return (w,h) if view=='ew' else (t,max(16,w))
    return (w,h) if view=='ew' else (t,w)

def render_crop(rgba,mask,box,size,labels=None):
    x,y,w,h=(box[k] for k in ['x','y','w','h'])
    crop=rgba[y:y+h,x:x+w].copy();alpha=(labels[y:y+h,x:x+w]==box['index']) if labels is not None else mask[y:y+h,x:x+w].copy()
    # Remove tiny disconnected editorial marks (cyan has already been removed).
    labs,comps=components(alpha)
    keep={b['index'] for b in comps if b['area']>=12}
    alpha=np.isin(labs,list(keep));crop[:,:,3]=alpha*255
    im=Image.fromarray(crop).convert('RGBa').resize(size,Image.Resampling.LANCZOS).convert('RGBA')
    out=np.asarray(im).copy();out[:,:,3]=(out[:,:,3]>=128)*255;out[out[:,:,3]==0,:3]=0
    # Single-pixel islands are sampling artefacts, never deliberate annotations.
    labels,n=ndimage.label(out[:,:,3]>0,np.ones((3,3)))
    counts=np.bincount(labels.ravel());bad=np.flatnonzero((counts<2)&(np.arange(len(counts))>0));out[np.isin(labels,bad)]=0
    return out

def rle(values):
    a=values.ravel();switch=np.r_[True,a[1:]!=a[:-1],True];edges=np.flatnonzero(switch)
    # One Unicode scalar stores a 7-bit palette index and a 9-bit run length.
    # Surrogates are skipped; long transparent runs split losslessly at 511.
    tokens=[]
    for i in range(len(edges)-1):
        colour=int(a[edges[i]]);length=int(edges[i+1]-edges[i])
        while length:
            take=min(511,length);value=(take<<7)|colour
            tokens.append(chr(value if value<0xd800 else value+0x800));length-=take
    return ''.join(tokens)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--concept-root',type=Path,default=ROOT.parent/'sites/hearthreaver-atelier-humains/dist/architecture');args=parser.parse_args()
    concepts=args.concept_root;sheets=labels_and_sheets(concepts)
    assets={};raw={};sources={};errors=[]
    for si,sheet in enumerate(sheets):
        source=concepts/sheet['source'];rgba,mask=masks(source)
        sources[sheet['source']]=dict(sha256=hashlib.sha256(source.read_bytes()).hexdigest(),size=[rgba.shape[1],rgba.shape[0]])
        try:
            if sheet['kind']!='module':labs,boxes=building_boxes(mask,len(sheet['entries']))
            else:boxes=module_boxes(mask);labs=components(mask)[0]
            for row,(code,label) in enumerate(sheet['entries']):
                ismodule=sheet['kind']=='module';family=sheet['family'];d=dict(id=code,label=label,family=family,kind='module' if ismodule else 'building',source=sheet['source'],sheet=sheet['title'],season='winter' if code.endswith('-hiver') else 'base')
                if ismodule:
                    d.update(module_definition(code));views=['face','palier'] if d['shape']=='stairs' else ['ew','ns'];rowindex=row//2;col=(row%2)*2;parts=boxes[rowindex][col:col+2]
                    d['height']=d['totalHeight'];d['high']=('-H' in code or code.startswith('M') and int(code[1:])>=49)
                else:
                    d['width'],d['depth'],d['height']=dimensions(code);views=['face','droite','dos','gauche'];parts=boxes[row]
                    d['entrances']=PORTALS.get(code.removesuffix('-hiver'),[.5]);d['doorClearance']=32 if code.startswith('F') and int(code[1:]) in [7,8,9,10,11] else 22
                    d['openHall']=code.removesuffix('-hiver') in ['T19','T24','B04','B05','B09','B12','X04']
                    if code=='B13':d['mechanism']=dict(type='sails',views=['face','dos'],center=[40,40],radius=36)
                    if code=='B14':d['mechanism']=dict(type='waterwheel',views=['droite'],center=[40,62],radius=23)
                d['views']=views;d['frames']={}
                for view,box in zip(views,parts):
                    size=frame_size(d,view);pixels=render_crop(rgba,mask,box,size,labs)
                    # Reviewed native cleanup: the source caption touches the
                    # left eave in this one approved sheet. Its remaining glyph
                    # fragment must not become part of a building sprite.
                    if code=='VAR-C03' and view=='face':pixels[30:33,:12,:]=0
                    if not pixels[:,:,3].any():raise ValueError(f'{code}/{view}: empty drawing')
                    key=code+'/'+view;raw[key]=pixels;d['frames'][view]=dict(size=list(size),crop=[int(box[k]) for k in ['x','y','w','h']],anchor=[size[0]//2,size[1]])
                    if code=='VAR-C03' and view=='face':d['frames'][view]['nativeCleanup']='Connected caption fragment removed at left eave: x0..11, y30..32'
                assets[code]=d
            print(f'{si+1:02d}/{len(sheets)} {sheet["title"]}: {len(sheet["entries"])} assets',flush=True)
        except Exception as e:errors.append((sheet['source'],str(e)))
    if errors:
        print(json.dumps(errors,ensure_ascii=False,indent=2));raise SystemExit('Source segmentation needs review; no partial asset pack written')
    # Canonical joining surfaces are built from each kit's own approved overhead
    # material strip. The three branches of a T and the two branches of an L
    # share exactly the same native thickness; no perspective, stretched tips or
    # fourth branch copied accidentally from an editorial reference plate.
    kits=[[f'M{n:02d}' for n in range(start,start+8)] for start in [49,57,65]]
    kits += [[f'{prefix}-H{n:02d}' for n in range(1,9)] for prefix in PREFIX]
    for kit in kits:
        straight=raw[kit[0]+'/ns'];thickness=straight.shape[1]
        horizontal=np.rot90(straight).copy();solid=straight[straight[:,:,3]>0,:3]
        fallback=np.median(solid,axis=0).astype('uint8')
        for id in [kit[2],kit[3],kit[4]]:
            for view in ['ew','ns']:
                if assets[id]['shape']=='junction-t' and view=='ew':continue
                im=np.zeros((48,48,4),dtype='uint8');im[48-thickness:,:,:]=horizontal
                x=(48-thickness)//2 if assets[id]['shape']=='junction-t' else 0 if view=='ew' else 48-thickness
                im[:,x:x+thickness,:]=straight
                shape=np.zeros((48,48),dtype=bool);shape[48-thickness:,:]=True;shape[:,x:x+thickness]=True
                holes=shape&(im[:,:,3]==0);im[holes]=[*fallback,255]
                original=raw[id+'/'+view].copy()
                # Retain the authored inner/outer corner masonry inside the
                # canonical interface. Only the joining edge bands are shared.
                if assets[id]['shape'].startswith('corner'):
                    upper=original[:24,:,3]>0
                    left=upper[:,:24].sum()>upper[:,24:].sum()
                    if left!=(view=='ew'):original=original[:,::-1].copy()
                interior=shape&(original[:,:,3]>0);interior[:2,:]=False;interior[-2:,:]=False;interior[:,:2]=False;interior[:,-2:]=False
                im[interior]=original[interior]
                raw[id+'/'+view]=im;assets[id]['frames'][view]['composedFrom']=kit[0]+'/ns'
    # Per-view render lift is separate from the ground footprint. Overhead wall
    # strips and decks live at the wall walk height. A staircase includes both
    # its map run and its rise in its projected pixel height.
    for d in assets.values():
        for view,frame in d['frames'].items():
            lift=0
            if d['kind']=='module':
                if d['shape'] in ['deck','landing','parapet'] or d.get('high') and (view=='ns' or d['shape'].startswith('corner')):lift=d['walkHeight']
            frame['lift']=lift
    locality_rows=re.findall(r'<tr><td>([^<]+)</td><td>([^<]+)</td><td>([^<]+)</td><td>([^<]+)</td><td>([^<]+)</td></tr>',(concepts/'index.html').read_text())
    settlements=[]
    for name,territory,region,role,models in locality_rows:
        family='sylverive' if html.unescape(region)=='Sylverive' else html.unescape(territory).lower()
        prefix=next(p for p,f in PREFIX.items() if f==family)
        valid=[m.strip() for m in models.split(',') if m.strip() in assets]
        valid+= [f'{prefix}-C{n:02d}' for n in range(1,4)]
        settlements.append(dict(name=html.unescape(name),territory=html.unescape(territory),region=html.unescape(region),family=family,role=role,models=list(dict.fromkeys(valid)),optionalFortificationKit=[f'{prefix}-H{n:02d}' for n in range(1,9)]))
    if len(settlements)!=83:raise ValueError(f'83 named human settlements required, found {len(settlements)}')
    (ROOT/'data/architecture/localites.json').write_text(json.dumps(settlements,ensure_ascii=False,indent=2))
    (ROOT/'sprites/architecture/localities.js').write_text('(function(r,f){if(typeof module===\'object\'&&module.exports)module.exports=f();else r.HearthreaverArchitectureLocalities=f();})(globalThis,function(){return '+json.dumps(settlements,ensure_ascii=False,separators=(',',':'))+';});\n')
    # One shared 96-colour material palette stabilizes stone, wood, plaster,
    # terracotta, slate and snow across every drawing. Index zero is transparent.
    samples=np.concatenate([im[:,:,:3][im[:,:,3]>0][::3] for im in raw.values()])
    samples=samples[::max(1,len(samples)//300000)]
    palette_image=Image.fromarray(samples.reshape(1,-1,3)).quantize(colors=95,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    colors=np.asarray(palette_image.getpalette(),dtype=np.uint8).reshape(-1,3)[:95]
    palette=['#00000000']+['#%02x%02x%02x'%tuple(c) for c in colors]
    colour_tree=spatial.cKDTree(colors)
    pixels={};contact=[]
    for key,im in raw.items():
        q=(colour_tree.query(im[:,:,:3].reshape(-1,3),workers=1)[1].reshape(im.shape[:2])+1).astype('uint8');q[im[:,:,3]==0]=0
        pixels[key]=rle(q);contact.append((key,q))
    pack=dict(version=1,runEncoding='unicode-scalar: length<<7 | palette-index; surrogate gap skipped',authoring='Native indexed pixel transcription; no runtime PNG',scale=dict(human=19,tile=16,door=22),families=FAMILIES,palette=palette,assets=assets,pixels=pixels,sources=sources)
    js='/* Hearthreaver architecture: authored native pixels, 2026-10-19. */\n(function(r,f){if(typeof module===\'object\'&&module.exports)module.exports=f();else r.HearthreaverArchitectureData=f();})(globalThis,function(){return '+json.dumps(pack,ensure_ascii=False,separators=(',',':'))+';});\n'
    out=ROOT/'sprites/architecture';out.mkdir(parents=True,exist_ok=True);(out/'architecture-data.js').write_text(js)
    manifest={k:v for k,v in pack.items() if k not in ['pixels','palette']};manifest['counts']=dict(buildings=sum(d['kind']=='building' and d['season']=='base' for d in assets.values()),winter=sum(d['season']=='winter' for d in assets.values()),modules=sum(d['kind']=='module' for d in assets.values()),views=len(pixels),nativePixels=sum(im.shape[0]*im.shape[1] for im in raw.values()))
    (ROOT/'data/architecture/catalogue.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
    # Authoring contact sheets; these are inspection artifacts, not runtime input.
    for part in range((len(contact)+63)//64):
        selected=contact[part*64:(part+1)*64];cv=Image.new('RGB',(1440,1440),'#17231e');draw=ImageDraw.Draw(cv)
        for i,(key,q) in enumerate(selected):
            h,w=q.shape;rgba=np.zeros((h,w,4),dtype=np.uint8)
            for c,color in enumerate(colors,1):rgba[q==c]=[*color,255]
            im=Image.fromarray(rgba);scale=1;im=im.resize((w*scale,h*scale),Image.Resampling.NEAREST)
            x=(i%8)*180+(180-im.width)//2;y=(i//8)*180+150-im.height;cv.paste(im,(x,y),im);draw.text(((i%8)*180+6,(i//8)*180+154),key,fill='#e5c574')
        cv.save(ROOT/f'art/architecture/native-{part+1:02d}.png')
    print(json.dumps(manifest['counts']),flush=True)

if __name__=='__main__':main()
