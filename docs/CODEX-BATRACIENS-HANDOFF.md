# Transmission à Claude — batraciens, 18 octobre 2026

**Auteur de ces ajouts : Codex / ChatGPT (OpenAI), à la demande de Lino.**
Cette note identifie le travail de Codex pour la coordination avec Claude.
Elle n'attribue pas à Codex les grilles batraciennes, la bible du monde ni la
PR de combat des PNJ préexistantes.

## Ajouts réalisés par Codex dans cette session

- Combat armé : anticipation, frappe rapide, retour, smears binaires et quatre vues.
  Répertoires d'estoc, balayage, plongeon, taille, revers, frappe abattue,
  lancer et estoc court. Les contacts viennent des métadonnées de clip.
- Défense : `tryBatracienBlock`, commune aux gardes et brigands, angle frontal,
  montée/expiration de garde, deux blocages et rupture par le quatrième coup lourd.
- Composition des bandes existantes : massue, javelot et combattant au bouclier,
  sans créer une faction raciale hostile.
- Réparation du trou du profil : la découpe du bras retirait aussi le tronc
  caché. Le volume sous le bras est reconstruit avant vêtements et équipement,
  et reste opaque même lorsque bouclier et tenue sont masqués.
- Six tenues de fonction : cuir tressé/lin, toile cirée renforcée, gilet/écharpe,
  mantelet, cuir rapiécé/corde, cuir clouté/bronze/garance. La peau reste indépendante.
- Lecteur interactif avec contrôle image par image, masquage d'équipement,
  comparaison des six tenues et essais du bouclier.

## Sources à conserver lors de l'intégration

- `sprites/batraciens/batraciens-combattants.js` : dessins, poses, tenues, métadonnées.
- `scripts/batraciens-runtime.js` : dégâts, défense, contacts, missiles et raccords PNJ.
- `scripts/build-batraciens.cjs` : accepte le système de patrouille principal ou celui de la PR nº 4.
- `scripts/preview-batraciens-combat.cjs` et `art/batraciens-combat.template.html` : lecteur reproductible.
- `tests/batraciens-combat.test.cjs`, `tests/batraciens-pr4-integration.test.cjs` et révision du test graphique existant.
- `data/batraciens/combat-art-v2.json`, `outfits-art-v3.json` : nouvelles références graphiques.
- `docs/batraciens-belligerants.md` : audit du lore et distinction entre groupes actifs et scénarios à écrire.

`index.html`, `ios/Hearthreaver/Game/index.html`, le lecteur autonome et le manifeste
sont générés. Réassembler depuis les sources après résolution des conflits ; ne
pas choisir un HTML embarqué ancien au détriment des nouvelles sources.

## Raccord à la PR de Claude nº 4

PR : https://github.com/garwiglino/conan/pull/4
Révision examinée et utilisée pour la validation composée :
`19719504673d4d0d5a7e5d7d5da78ca7fda7d07e` (`claude/combats-wo67x6`).

Le travail de Claude dans `npc-combat.js` et les corrections de fuite ne sont pas
remplacés. Une copie locale de validation réunit cette PR et les ajouts de Codex.
Aucune fusion de PR ni publication GitHub n'a été effectuée par cette validation.

Points d'intégration traités par Codex :

1. `strike` et les javelots hostiles passent par `damageHumanGuard` pour les
   patrouilles humaines ; `isHumanGuard` reste optionnel sur la branche principale.
2. Les brigands batraciens peuvent cibler les gardes humains ; leur décès est vérifié.
3. Les nouvelles attaques utilisent `Armed.isAttack` dans les verrous de mouvement,
   au lieu de listes limitées aux trois anciennes attaques.
4. La pose de mort d'un garde batracien prime sur son dernier étourdissement.
5. Les modes de fuite et `npcMoveLocked` de la PR sont conservés dans l'adaptateur.
6. Les javelots alliés utilisent `guardStrike`, donc les règles de riposte des
   monstres de la PR ; les kills des gardes ne donnent pas d'XP au joueur.
7. Le constructeur ne réintroduit pas l'ancienne boucle des patrouilles si la PR
   l'a remplacée par `npc-combat.js`.

## Validation à reproduire

Sur la branche principale préparée :

```sh
node scripts/build-batraciens.cjs
node scripts/preview-batraciens-combat.cjs
node --test --test-concurrency=2 tests/batraciens*.test.cjs
```

Sur une composition avec la PR nº 4, exécuter aussi :

```sh
node --test --test-concurrency=2 tests/npc-combat.test.cjs tests/batraciens-combat.test.cjs tests/batraciens-pr4-integration.test.cjs
```

Les tests de raccord PR sont explicitement ignorés lorsque `npc-combat.js` n'est
pas installé ; ils doivent être réellement exécutés sur la composition, et non
comptés comme des succès sur la branche principale. Ils couvrent dégâts/mort du
garde humain par javelot, contacts uniques des nouveaux coups, verrouillage,
bouclier adverse, riposte PNJ sans XP, murs, étages et parade du projectile.

Cette validation est automatisée sous Node/Canvas. Ce n'est pas une session de
jeu sur un iPhone physique. Les PR nº 5 et nº 6 (tenues et température de Kaldor)
ne sont pas fusionnées ni validées dans cette composition de combat.

Résultat observé le 18 octobre 2026 : **15 tests sur l'ensemble PR nº 4 + combat
et tenues, puis 4 tests de raccord mêlée/javelots : 19 réussis, 0 échec**.
Les vérifications graphiques de cette révision passent également : tronc opaque
sans bouclier, six tenues distinctes, palettes et assemblage web/iOS identique.

## Correctif Codex — repos armés et profils

Les repos et marches armés ont maintenant les mêmes articulations que le combat,
avec une arme sortie réellement fixée à la main dans les quatre vues. Les gros
éléments venaient de la besace civile d'origine, d'un faisceau de javelots trop
visible et d'anciennes positions d'armes indépendantes des mains. La besace est
retirée des poses articulées armées et le carquois est compact. Le bouclier au
repos est abaissé, le bras proche/lointain et l'ordre des calques changent selon
le profil. L'épée reste visible y compris de dos. Respiration, clignement et
appuis de marche sont repris des bases ; aucun timing de dégât n'est changé.
La référence graphique correspondante est `data/batraciens/armed-rest-art-v4.json`.

## Ajouts Codex — coiffes, déplacement face à la cible et enchaînements

Coiffes fixes par rôle, indépendantes de la pigmentation : bandeau du garde,
calotte ouverte de sentinelle/épéiste, capuchon court d'éclaireur, tête nue du
pillard, casque ouvert à courte crête du chef. Elles suivent tête, respiration,
marche, réactions, combat et chute ; yeux et museau restent exposés.

`combatMove` déplace les pieds sans déduire l'orientation de la direction de
marche : l'acteur avance, recule ou se décale en regardant sa cible. Collisions,
étages, ligne de vue, vitesse et limites de poursuite restent vérifiés. La garde
mobile emploie `guard_walk`, avec les mêmes limites de bouclier ; la direction
reste verrouillée pendant un coup. Une cible cachée n'est pas suivie à travers
les obstacles. Le joueur n'est pas automatiquement la cible des gardes neutres.

Les attaques peuvent former des séries bornées de deux coups (trois pour le
chef), avec une courte ouverture entre les coups. La poursuite dépend du rôle,
de la portée et d'un choix déterministe par acteur/série ; d'autres séries font
une vraie pause. Le javelot n'enchaîne pas de tirs accélérés. Une parade, un
étourdissement, une cible perdue, un autre étage ou un obstacle coupe la série.

La sélection de peau par identifiant et sa sauvegarde restent celles du moteur.
Les coiffes, tenues et changements d'animation ne la modifient ni ne la réattribuent
au hasard à chaque image. `headgear-tactics-art-v5.json` conserve la nouvelle
référence graphique. Le raccord combat est à nouveau exercé avec la PR nº 4.

Validation de cette révision : 60 tests batraciens réussis, puis 5 vérifications
ciblées sur les dernières poses/coiffes ; 11 tests supplémentaires réussis sur
la composition avec la PR nº 4 (PNJ et armes de lancer). Aucun échec. L'aperçu
exerce aussi le choix de peau et la lecture des nouvelles coiffes/garde mobile.

## Consolidation du 18 octobre 2026 — Codex / ChatGPT

La composition finale inclut tous les ajouts Codex ci-dessus, la PR 4 de Claude
(combats PNJ), la PR 5 (tenues/casques de Kaldor) et la PR 6 (température).
Les mentions précédentes de PR 5/6 non fusionnées décrivent les étapes antérieures.
Le choix utilisateur conserve les effets thermiques complets : froid mortel et
faim accrue par chaleur. L'ancien workflow kaldor-v3 reste uniquement dans sa
branche d'origine, sans réintroduction sur main.

Les anciennes branches voyage, menu, quêtes et lisibilité ont été comparées
aux versions déjà intégrées sur main ; leurs historiques sont raccordés en
conservant les fichiers actuels, plus récents. Aucune branche n'est supprimée.

Validation de la version combinée : 298 tests JavaScript réussis, aucun échec
ni test ignoré ; 17 tests Python de la bible du monde réussis. Le paquet iOS
a été reconstruit avec le jeu hors ligne combiné. Aucun essai sur iPhone physique.
