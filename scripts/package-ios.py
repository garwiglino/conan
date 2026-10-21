"""Package the current native sources, icons and offline game together."""
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED
import plistlib
import re
import struct
import subprocess
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]
# Always package the current editable world and native architecture sources.
subprocess.run(['node', str(root / 'scripts/embed-world.cjs')], cwd=root, check=True)
project = root / 'ios/Hearthreaver.xcodeproj'
pbx = (project / 'project.pbxproj').read_text(encoding='utf-8')
info = plistlib.loads((root / 'ios/Hearthreaver/Info.plist').read_bytes())
assert info['CFBundleDisplayName'] == 'Hearthreaver'
assert info['CFBundleName'] == '$(PRODUCT_NAME)'
for key in ['UISupportedInterfaceOrientations', 'UISupportedInterfaceOrientations~ipad']:
    assert set(info[key]) == {'UIInterfaceOrientationLandscapeRight'}
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
# Folder entries and fixed permissions, whatever the packager's umask, so that every unzip tool
# (Archive Utility on macOS included) rebuilds the .xcodeproj package with its project.pbxproj.
def entry(source, name):
    info = ZipInfo.from_file(source, name)
    if source.is_dir():
        info.external_attr, info.CRC, info.compress_size = (0o40755 << 16) | 0x10, 0, 0
    else:
        info.external_attr = 0o100644 << 16
    return info
with ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=9) as archive:
    archive.mkdir(entry(root / 'ios', 'Hearthreaver-iOS'))
    for source in sorted((root / 'ios').rglob('*')):
        if any(part in {'xcuserdata', '.DS_Store'} for part in source.parts):
            continue
        name = 'Hearthreaver-iOS/' + source.relative_to(root / 'ios').as_posix()
        if source.is_dir():
            archive.mkdir(entry(source, name))
        elif source.is_file():
            archive.writestr(entry(source, name), source.read_bytes(), ZIP_DEFLATED, 9)
with ZipFile(target) as archive:
    assert archive.testzip() is None
    names = archive.namelist()
    assert 'Hearthreaver-iOS/Hearthreaver.xcodeproj/project.pbxproj' in names
    for index, name in enumerate(names):
        parent = name.rstrip('/').rpartition('/')[0]
        assert not parent or names.index(parent + '/') < index, 'Missing folder entry before ' + name
    for info in archive.infolist():
        assert info.external_attr >> 16 == (0o40755 if info.is_dir() else 0o100644), info.filename
    assert not any('/Conan' in name for name in archive.namelist())
    assert b'Hearthreaver' in archive.read('Hearthreaver-iOS/Hearthreaver/Info.plist')
    assert archive.read('Hearthreaver-iOS/Hearthreaver/Game/index.html') == (root / 'ios/Hearthreaver/Game/index.html').read_bytes()
print(f'{target.name}: {target.stat().st_size:,} bytes, current offline game verified.')
