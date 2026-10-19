"""Package the complete standalone native architecture library and exports."""
from pathlib import Path
import json, re
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parents[1]
catalogue=json.loads((root/'data/architecture/catalogue.json').read_text())
assert catalogue['counts']['buildings']==106
assert catalogue['counts']['modules']==120
assert catalogue['counts']['views']==696
exports=root/'art/architecture/export'
assert len([p for p in exports.iterdir() if p.is_dir()])==234
output=root/'art/architecture/architecture-complete.zip'
prefix='Hearthreaver-architecture/'
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=9) as archive:
    for folder in ['sprites/architecture','data/architecture','art/architecture/export']:
        for p in sorted((root/folder).rglob('*')):
            if p.is_file():archive.write(p,prefix+p.relative_to(root).as_posix())
    for f in ['scripts/architecture-world.js','scripts/build-architecture.py','scripts/build-architecture-human.cjs','scripts/export-architecture.cjs','scripts/embed-architecture.cjs','tests/architecture.test.cjs','art/architecture/atelier.template.html']:
        archive.write(root/f,prefix+f)
    archive.write(root/'docs/architecture-javascript.md',prefix+'README.md')
    # A locally opened copy already contains the pack. Do not show a broken
    # recursive download link inside the standalone archive.
    html=(root/'art/architecture/atelier.html').read_text()
    html=re.sub(r'<a href="[^"]+" id="download-pack" download>.*?</a>','',html)
    archive.writestr(prefix+'art/architecture/atelier.html',html)
    archive.writestr(prefix+'package.json',json.dumps({'name':'hearthreaver-native-architecture','private':True,'scripts':{'test':'node --test tests/architecture.test.cjs'},'devDependencies':{'@napi-rs/canvas':'0.1.100'}},indent=2))
with ZipFile(output) as archive:
    assert archive.testzip() is None
    names=archive.namelist()
    assert sum(name.endswith('.json') and '/export/' in name and '/assemblages' not in name for name in names)==234
    assert prefix+'sprites/architecture/architecture-data.js' in names
print(f'{output}: {output.stat().st_size:,} bytes; 234 spritesheets, 696 native views, layers, JavaScript and metadata verified.')
