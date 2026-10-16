# Animated human civilians

The art is authored with Aseprite Lua from the approved modular human files.
There are 48 outfit silhouettes and 144 palette variants: temperate, arid, snow,
jungle, marsh, universal rags, and the four male temperate transport professions.
The canonical user-retouched heads, noses, hair and clothing sources are preserved.

Shared actions, in front/right/back/left order: idle, walk, frightened flight,
startle, talk, sit down, seated idle, stand up, cower, hit, death, carry. There are
no civilian attack clips. Work clips are assigned by outfit: hoe, sow, craft,
pottery, weave, stir, net, groom, load, rope and ledger. Each work clip includes
preparation, useful action and recovery. Death holds its last frame.

Body variants and head/hair/facial-hair/headwear modules remain independent.
Hair uses three depth planes. Hat masks cut only temporary composite hair layers;
unequipping restores the original hair. The hat and its palette follow the outfit.
Elders always use silver hair and facial hair. Rags require the approved hirsute
styles. Female braids are not assigned to male bodies. Transport workers are male.

`world-danger.js` remains the authority for safety, placement and sheltering.
The animation integration observes its leaving/sheltered/returning states.
Residents are placed only on walkable settlement ground with the existing enemy
clearance and safety rules. Guards and the fairy use their existing systems.
Movement phase follows distance travelled rather than wall time, preventing
animation drift when a path is blocked. Danger and hits interrupt occupations.

Ordinary resident deaths persist and disable conversation, collision and hiring.
Main quest givers and transport operators retain at least one health point, to
avoid removing the only quest or route service. Party members retain the game's
existing down/healing rules and use the fall animation when down. Civilian damage
never grants XP or kills to the player. Appearance and resident deaths are saved
under `atlas.civilians`; old saves receive deterministic appearances.

The packed PNG atlas contains only exact copies of native pixels, deduplicated by
SHA-256. Palette substitution is exact; there is no antialiasing. Images are loaded
on demand and both decoded atlases and composed frames use bounded caches.

Build: run `scripts/build-civilian-art.cjs` with the animation atelier directory,
then `scripts/embed-world.cjs` and `scripts/package-ios.py`. The game HTML and iOS
game contain all pixels and timings for offline play.

`art/humains-civils-aseprite.zip` preserves the 216 editable native Aseprite
files, Lua animation sources, PNG exports and indexes. Extract the archive and
pass its directory to the atlas builder to repack the included exports.
