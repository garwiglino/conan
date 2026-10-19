"""Package optional three-quarter art without changing the running game."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json,re
root=Path(__file__).resolve().parents[1]
out=root/'art/architecture-34/architecture-34-complete.zip'
prefix='Hearthreaver-architecture-34/'
files=['sprites/architecture/'+n for n in ['architecture-data.js','architecture.js','architecture-34.js','human-reference.js','localities.js']]
files+=['data/architecture-34/catalogue.json','scripts/export-architecture-34.cjs','scripts/package-architecture-34.py','tests/architecture-34.test.cjs','docs/architecture-trois-quarts.md','art/architecture-34/direction-artistique.png']
with ZipFile(out,'w',ZIP_DEFLATED,compresslevel=9) as z:
 for name in files:z.write(root/name,prefix+name)
 for p in sorted((root/'art/architecture-34/export').rglob('*')):
  if p.is_file():z.write(p,prefix+p.relative_to(root).as_posix())
 for p in sorted((root/'art/architecture-34').glob('planche-*.png')):z.write(p,prefix+p.relative_to(root).as_posix())
 html=(root/'art/architecture-34/index.html').read_text()
 html=re.sub(r'<a class="button" href="architecture-34-complete.zip" download>.*?</a>','',html)
 html=html.replace('../architecture/atelier.html','https://hearthreaver-atelier-humains.sheensaw223.chatgpt.site/architecture/javascript/index.html')
 z.writestr(prefix+'art/architecture-34/index.html',html)
 z.writestr(prefix+'README.md',(root/'docs/architecture-trois-quarts.md').read_text())
 z.writestr(prefix+'package.json',json.dumps({'name':'hearthreaver-architecture-three-quarter','private':True,'scripts':{'test':'node --test tests/architecture-34.test.cjs'},'devDependencies':{'@napi-rs/canvas':'0.1.100'}},indent=2))
with ZipFile(out) as z:
 assert z.testzip() is None
 assert sum('/export/' in p and p.endswith('.json') for p in z.namelist())==234
print(f'{out}: {out.stat().st_size:,} bytes; 234 assets verified')
