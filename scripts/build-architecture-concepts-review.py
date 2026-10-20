"""Build the PNG review gallery; never compile or modify game sprites."""
from pathlib import Path
import json,argparse,hashlib,html
from zipfile import ZipFile,ZIP_DEFLATED
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'art/architecture-concepts-34'
p=argparse.ArgumentParser();p.add_argument('--draft',action='store_true');args=p.parse_args()
m=json.loads((out/'manifest.json').read_text());available=[]
for b in m['boards']:
 generated=out/b['output'];reference=out/'references'/f'{b["number"]:02d}.png'
 assert hashlib.sha256(reference.read_bytes()).hexdigest()==b['sourceSha256']
 if not generated.exists():
  if args.draft:continue
  raise SystemExit(f'Missing concept PNG: {b["number"]}')
 im=Image.open(generated);im.verify()
 b['size']=list(Image.open(generated).size);b['sha256']=hashlib.sha256(generated.read_bytes()).hexdigest();b['status']='À valider'
 assert b['sha256']!=b['sourceSha256'], 'Redessin identique à la référence'
 record=json.loads((out/'generation'/f'{b["number"]:02d}.json').read_text());assert record['sha256']==b['sha256']
 if not args.draft:b.pop('sourcePath',None)
 b['original']=f'references/{b["number"]:02d}.png';available.append(b)
if not args.draft:
 assert len(available)==45
 ids=[e['id'] for b in available for e in b['entries']];assert len(ids)==234 and len(set(ids))==234
 expected=json.loads((root/'data/architecture/catalogue.json').read_text())['assets'];assert set(ids)==set(expected)
 assert len({b['sha256'] for b in available})==45
 m['spriteConversion']='not-started';m['requiresArtValidation']=True
 m['counts']={'sheets':45,'assets':234,'buildings':106,'winter':8,'modules':120}
 m['status']='45 concepts PNG redessinés — à valider, sans conversion JavaScript'
 (out/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
 for start in [0,15,30]:
  group=available[start:start+15];zpath=out/f'concepts-png-{start+1:02d}-{start+15:02d}.zip'
  with ZipFile(zpath,'w',ZIP_DEFLATED,compresslevel=6) as z:
   for b in group:z.write(out/b['output'],b['output'])
   z.writestr('inventaire.json',json.dumps({'status':'Concepts PNG à valider','boards':[{k:v for k,v in b.items() if k!='sourcePath'} for b in group]},ensure_ascii=False,indent=2))
   z.writestr('LIRE-MOI.txt','Hearthreaver — concepts PNG trois quarts.\nReprise des concepts originaux, sans conversion JavaScript.\nValidation artistique requise avant fabrication des nouveaux sprites.\nHumain de référence : cible native de 19 pixels. Les dimensions annotées restent des cibles de conception.\nAucun drapeau ni bannière.\n')
  assert zpath.stat().st_size<95*1024*1024
 public=[{k:b[k] for k in ['number','id','title','kind','family','source','sourceSha256','entries','output','original','size','sha256','status']} for b in available]
else:
 public=[{**b,'original':f'references/{b["number"]:02d}.png'} for b in available]
links='' if args.draft else ''.join(f'<a class="button" href="concepts-png-{start+1:02d}-{start+15:02d}.zip" download>PNG · planches {start+1}–{start+15}</a>' for start in [0,15,30])
s=(out/'gallery.template.html').read_text().replace('BOARD_DATA',json.dumps(public,ensure_ascii=False,separators=(',',':'))).replace('PACK_LINKS',links)
(out/'index.html').write_text(s)
print(json.dumps({'sheets':len(available),'entries':sum(len(b['entries']) for b in available),'draft':args.draft}))
