"""Read the preserved Aseprite layers; never infer anatomy from a flattened PNG."""
import json
import struct
import sys
import zlib
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_layers(data, wanted):
    if struct.unpack_from('<H', data, 4)[0] != 0xA5E0:
        raise ValueError('Not an Aseprite document')
    if struct.unpack_from('<H', data, 12)[0] != 32:
        raise ValueError('RGBA source required')
    layers, frames, pos = [], [], 128
    for frame in range(max(wanted) + 1):
        size, magic, count = struct.unpack_from('<IHH', data, pos)
        if magic != 0xF1FA:
            raise ValueError('Invalid frame')
        if count == 65535:
            count = struct.unpack_from('<I', data, pos + 12)[0]
        cels, p = {}, pos + 16
        for _ in range(count):
            length, kind = struct.unpack_from('<IH', data, p)
            o = p + 6
            if kind == 0x2004:
                flags = struct.unpack_from('<H', data, o)[0]
                n = struct.unpack_from('<H', data, o + 16)[0]
                layers.append({'name': data[o + 18:o + 18 + n].decode(), 'visible': bool(flags & 1)})
            elif kind == 0x2005:
                layer, x, y = struct.unpack_from('<Hhh', data, o)
                cel_type = struct.unpack_from('<H', data, o + 7)[0]
                if cel_type == 1:
                    source = struct.unpack_from('<H', data, o + 16)[0]
                    # Linked cel position belongs to this frame.
                    old = frames[source][layer]
                    cels[layer] = (x, y, old[2], old[3], old[4])
                elif cel_type in (0, 2):
                    w, h = struct.unpack_from('<HH', data, o + 16)
                    raw = data[o + 20:p + length]
                    raw = zlib.decompress(raw) if cel_type == 2 else raw
                    if len(raw) != w * h * 4:
                        raise ValueError('Invalid cel size')
                    cels[layer] = (x, y, w, h, raw)
                else:
                    raise ValueError('Unsupported cel type')
            p += length
        frames.append(cels)
        pos += size
    out = []
    for index, layer in enumerate(layers):
        views = []
        for f in wanted:
            cel = frames[f].get(index)
            pixels = []
            if cel:
                x, y, w, h, raw = cel
                for yy in range(h):
                    for xx in range(w):
                        i = (yy * w + xx) * 4
                        if raw[i + 3]:
                            if raw[i + 3] != 255:
                                raise ValueError('Native human art must have binary alpha')
                            pixels.append([x + xx, y + yy, raw[i:i + 3].hex()])
            views.append(pixels)
        if any(views):
            out.append({**layer, 'views': views})
    return out


def main():
    atlas = json.loads((ROOT / 'data/civilians/atlas.json').read_text())
    result = {'outfits': {}, 'modules': {}}
    with zipfile.ZipFile(ROOT / 'art/humains-civils-aseprite.zip') as archive:
        index = json.loads(archive.read('animation-index.json'))
        entries = {o['id']: o for o in index['outfits']}
        chosen = set()
        for outfit in atlas['outfits'].values():
            key = outfit['cut'] + '-' + outfit['sex']
            if key in chosen:
                continue
            chosen.add(key)
            entry = entries[outfit['id']]
            result['outfits'][key] = {
                'id': key, 'label': outfit['label'], 'sex': outfit['sex'],
                'biome': outfit['biome'], 'headFirst': outfit['headFirst'],
                'source': outfit['id'], 'hat': outfit['hat'],
                'layers': read_layers(archive.read('natifs/' + outfit['id'] + '.aseprite'), entry['frames']['idle'])
            }
        for mid, module in atlas['modules'].items():
            result['modules'][mid] = {
                'kind': module['kind'],
                'layers': read_layers(archive.read('modules-natifs/' + mid + '.aseprite'), atlas['moduleFrames']['idle'])
            }
    json.dump(result, sys.stdout, separators=(',', ':'))


if __name__ == '__main__':
    main()
