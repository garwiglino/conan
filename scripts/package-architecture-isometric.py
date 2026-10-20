"""Package the independent pixel architecture workshop and native JS runtime."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root/'art/architecture-isometric-js'
required=['index.html','catalogue.json','apercu-batiments.png','apercu-construction.png','runtime/architecture-isometric.js','runtime/isometric-catalogue.js']
assert all((out/name).is_file() for name in required)
files=[p for p in out.rglob('*') if p.is_file() and p.suffix in ['.png','.json','.js','.html'] and p.name not in ['workshop.template.html','preview-wip.png']]
with zipfile.ZipFile(out/'architecture-isometric-js.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files:z.write(p,p.relative_to(out))
 z.write(root/'docs/architecture-isometrique-pixel-js.md','LIRE-MOI.md')
with zipfile.ZipFile(out/'architecture-isometric-js.zip') as z:
 assert z.testzip() is None
 print(f'Pack vérifié : {len(z.namelist())} fichiers, {round((out/"architecture-isometric-js.zip").stat().st_size/1048576,1)} Mio')
