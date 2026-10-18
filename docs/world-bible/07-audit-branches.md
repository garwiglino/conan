# 07 — Audit des branches et choix de continuité

Audit Codex / ChatGPT du 18 octobre 2026, avant l’ajout de cette extension. Les 16 branches distantes accessibles ont été inventoriées ; 45 versions distinctes de fichiers rédigés et de référentiels de bible ont été indexées, sans recompter les copies identiques. Les fichiers générés ont été comparés par empreinte et rattachés à leur source. Aucun texte de ces branches ne définit alors les hommes-singes.

| Branche distante | Commit examiné |
|---|---|
| `origin/claude/combats-wo67x6` | `19719504673d4d0d5a7e5d7d5da78ca7fda7d07e` |
| `origin/claude/monde-hearthreaver-u5vlhh` | `c0328a83a0f8e5b87ec2c418cd262cfc2102aa85` |
| `origin/claude/project-thread-247o81` | `ee591ad5a862579c43c269bbe668e2224ff2d507` |
| `origin/claude/voyage-arriere-plan-kq5ovn` | `175e8e1b282f65bbe0d31c8fc934c2a33425fe05` |
| `origin/codex/dialogue-ergonomics` | `88a4d5779ab35b46474f55512ae8ad52db40cfd9` |
| `origin/codex/hearthreaver-menu-feedback` | `ad27b704920716867998b5d97705f25dd1ce8a9d` |
| `origin/codex/hearthreaver-quest-delivery` | `a904f61c7a8e888b9b1e76c04ba0a9aa63374c69` |
| `origin/codex/hearthreaver-readability` | `8d13a8485bca584e380c50f2cb4c0bd6e3d9814c` |
| `origin/codex/landscape-ui` | `dc0b28c4083835e93b98442bc27494b6ea982584` |
| `origin/codex/world-bubbles-player-sheet` | `acedadb95109db377058e30bbe4da433fd5fe525` |
| `origin/integration/batraciens-palettes` | `be69fad19df68ab636dee18c7abefe054987c98d` |
| `origin/integration/batraciens-social` | `3e4c888b6c36631fff7f56d73293a76d21cb388e` |
| `origin/integration/kaldor-art-v2` | `2156bb4211ee7072f691fe29efef99a7a66bca83` |
| `origin/integration/kaldor-longhair-holster` | `ce518ea6bdc05a0d161b51a8b029d72480f270f8` |
| `origin/integration/kaldor-v3` | `65c37d450a6f11132d90ea11e01acd474bb3ffd8` |
| `origin/main` | `d212ef9549f410aaafee80de3f6dd14bc3e6f3ac` |

## Arbitrages retenus

- La bible politique récente est identique dans les treize branches qui la contiennent : neuf acteurs de coordination, pas de guerre mondiale, chartes de Sylverive sous Teremor, Darg/Kesh distincts de leurs espèces.
- Le monde compact de la branche principale prévaut sur les anciens exports : 72 × 48 km, 83 localités, 14 régions, chemins et ports existants. Les fichiers anciens à 1 440 × 960 km et les anciens 36 embarcadères ne sont pas réintroduits. Le graphe courant compilé possède 133 routes.
- Les différences du guide du monde portent surtout sur le resserrement de carte, la reprise des voyages en arrière-plan et les effets thermiques ; ces implémentations conservées ne sont pas modifiées par la bible.
- Les anciennes branches de menu/quêtes n’apportent aucune espèce ou puissance politique supplémentaire. Leurs anciennes interfaces ne sont pas fusionnées pour cette extension.
- Les ajouts batraciens de main font autorité pour leurs acteurs, sécurité et combat. Leur ancien commentaire de configuration sur le recensement à quatre espèces décrit la première livraison jouable ; le référentiel démographique courant est désormais la source v2 à six espèces.
- Les 36 relations politiques et les neuf acteurs restent conservés. Les hommes-singes reçoivent des cadres de contact locaux, pas une diplomatie nationale ajoutée artificiellement.
- Les ressources restent les 54 biens déjà référencés. Jardins, bois, fibres et quais répondent à des besoins matériels et à des droits existants.
- La seule extension d’admissibilité d’un incident est le conflit de travail dans les forêts de Boisclair/Aulneval et de Palmeraie. Aucun type runtime ni tirage hostile supplémentaire n’est activé.

## Traçabilité

`data/world/bible/branch-audit.json` conserve pour chaque branche son commit, les chemins examinés et les SHA des blobs distincts. Les ajouts hommes-singes et la révision démographique sont nouveaux, explicitement identifiés ; ils ne sont pas présentés comme un lore retrouvé dans une branche ancienne. Les évolutions après ces commits devront être comparées lors d’un prochain audit.
