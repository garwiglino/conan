"""Package the current native sources, icons and offline game together."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import plistlib
import re
import struct
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
project = root / 'ios/Hearthreaver.xcodeproj'
pbx = (project / 'project.pbxproj').read_text(encoding='utf-8')
info = plistlib.loads((root / 'ios/Hearthreaver/Info.plist').read_bytes())
assert info['CFBundleDisplayName'] == 'Hearthreaver'
assert info['CFBundleName'] == '$(PRODUCT_NAME)'
assert 'name = Hearthreaver;' in pbx and 'path = Hearthreaver.app;' in pbx
assert 'Conan' not in pbx
assert pbx.count('PRODUCT_BUNDLE_IDENTIFIER = com.garwiglino.conan;') == 2
assert pbx.count('INFOPLIST_FILE = Hearthreaver/Info.plist;') == 2
icon = (root / 'ios/Hearthreaver/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png').read_bytes()
assert icon[:8] == b'\x89PNG\r\n\x1a\n'
assert struct.unpack('>II', icon[16:24]) == (1024, 1024)
assert icon[25] == 2, 'Native app icon must be RGB without an alpha channel'
# Confirm every group-relative source/resource exists after the directory rename.
for name in re.findall(r'path = ([A-Za-z0-9_.]+); sourceTree = "<group>";', pbx):
    assert (root / 'ios/Hearthreaver' / name).exists(), name
scheme = ET.parse(project / 'xcshareddata/xcschemes/Hearthreaver.xcscheme')
for ref in scheme.iter('BuildableReference'):
    assert ref.attrib['BuildableName'] == 'Hearthreaver.app'
    assert ref.attrib['BlueprintName'] == 'Hearthreaver'
    assert ref.attrib['ReferencedContainer'] == 'container:Hearthreaver.xcodeproj'
    assert ref.attrib['BlueprintIdentifier'] + ' /* Hearthreaver */ = {' in pbx
target = root / 'Hearthreaver-iOS.zip'
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    for source in sorted((root / 'ios').rglob('*')):
        if source.is_file() and not any(part in {'xcuserdata', '.DS_Store'} for part in source.parts):
            archive.write(source, 'Hearthreaver-iOS/' + source.relative_to(root / 'ios').as_posix())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert 'Hearthreaver-iOS/Hearthreaver.xcodeproj/project.pbxproj' in archive.namelist()
    assert not any('/Conan' in name for name in archive.namelist())
    assert b'Hearthreaver' in archive.read('Hearthreaver-iOS/Hearthreaver/Info.plist')
    assert archive.read('Hearthreaver-iOS/Hearthreaver/Game/index.html') == (root / 'ios/Hearthreaver/Game/index.html').read_bytes()
print(f'{target.name}: {target.stat().st_size:,} bytes, current offline game verified.')
