"""Offline review pack, with native source hierarchy and all exported terrain."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root = Path(__file__).resolve().parents[1]
out = root / 'art/terrain-isometric-js'
target = out / 'terrain-isometric-js.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as z:
    for p in sorted(out.rglob('*')):
        if p.is_file() and p != target and p.name != 'workshop.template.html':
            z.write(p, p.relative_to(out))
    for p in [*sorted((root / 'sprites/terrain').glob('*')), root / 'sprites/architecture/architecture-isometric.js', root / 'sprites/architecture/isometric-catalogue.js', root / 'scripts/export-terrain-isometric.cjs', root / 'scripts/check-terrain-isometric.cjs', root / 'tests/terrain-isometric.test.cjs']:
        z.write(p, 'sources/' + p.relative_to(root).as_posix())
    z.write(root / 'docs/terrain-isometrique.md', 'LIRE-MOI.md')
with ZipFile(target) as z:
    assert z.testzip() is None
    print(f'{len(z.namelist())} fichiers vérifiés, {target.stat().st_size / 1048576:.1f} Mio : {target}')
