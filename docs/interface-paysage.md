# Interface paysage téléphone — Codex / ChatGPT

Cette révision conserve les illustrations, les cadres pixel art et la palette
bronze, obsidienne et parchemin. Elle remplace l'empilement des réglages et
informations par des rubriques, avec des actions toujours accessibles.

## Écrans

| Écran | Organisation |
| --- | --- |
| Accueil | Logo et navigation côte à côte en paysage court. |
| Options, accueil et pause | Cartes Lecture / Audio / Ambiance ; boutons de retour hors du défilement. |
| Journal | Sections actives et à rendre en colonnes ; quêtes accomplies repliables. |
| Inventaire | Rubriques Personnage / Tenue / Climat / Objets ; descriptions détaillées à déplier. |
| Tenue | Aperçu et rotations à gauche, collection à droite ; description et collection défilent indépendamment. |
| Aide | Rubriques repliables sans retirer les instructions. |
| Carte | Carte et sélection côte à côte ; actions de suivi fixes et aide repliable. |
| Compagnons | Liste et fiche côte à côte, nouvelles du monde à déplier. |
| Transport | Choix et résumé côte à côte ; départ, provisions et repos dans un pied fixe. |
| Guide du transport | Explications regroupées en rubriques repliables. |
| Voyage | Itinéraire et réserves à gauche, santé/faim du groupe à droite, halte accessible. |
| Dialogue | Choix et défilement dans la palette bronze ; bulle parchemin conservée. |
| Quêtes, récompenses, sommeil | Corps défilant si nécessaire, actions séparées. |
| Pause, mort, fin de partie | Même hiérarchie de lecture et commandes tactiles. |

Les variables de `scripts/landscape-ui.css` définissent les couleurs, le texte
principal (13 px), le secondaire (11 px), les titres (21 px) et les cibles
principales (44 px minimum). La préférence de lecture 85–125 % est conservée.
Les blocs de texte longs, les grandes collections et les contenus agrandis
peuvent défiler ; ils ne sont ni tronqués ni retirés pour gagner de la place.
Les marges tiennent compte des zones sûres de l'écran.

`landscape-ui.js` déplace les nœuds existants : les boutons, événements et
animations de tenue gardent leur identité. Les onglets d'inventaire sont
accessibles au clavier (flèches, Début, Fin). Les rubriques repliables emploient
les éléments natifs `details` et `summary`.

## Reconstruction et vérification

```sh
node scripts/embed-title.cjs
python3 scripts/package-ios.py
node --test tests/landscape-ui.test.cjs tests/menu.test.cjs tests/text-layout.test.cjs tests/journey-ui.test.cjs tests/kaldor-outfits.test.cjs tests/travel-select.test.cjs tests/body-heat.test.cjs
```

Le CSS partagé est inséré après les anciennes feuilles et le code avant
`app.js`. L'installation des interfaces monde/paysage n'est exécutée qu'une
fois, même après plusieurs reconstructions. La source `landscape.js` conserve
le comportement existant des voyages payés pendant les changements d'orientation.

L'audit facultatif `scripts/check-landscape-ui.cjs` utilise Playwright et un
Chromium installé (variable `UI_BROWSER_PATH` si nécessaire). Il vérifie les
limites de l'écran, les débordements horizontaux et les boutons masqués par
un autre élément, sur plusieurs tailles et préférences de texte. Les fonctions
de test et les zones sûres simulées sont injectées dans une copie HTTP du jeu,
jamais dans le jeu distribué. Les captures sont dans `art/ui-landscape/`.

La vérification navigateur porte sur Chromium ; elle ne remplace pas une
vérification sur un iPhone physique avec son WebView Safari.

## Résultats de validation

47 tests fonctionnels ciblés réussis (menus, texte, voyage, tenue, température,
quêtes et écran de titre). La reconstruction web/iOS est stable quand elle est
répétée ; le paquet iOS hors ligne est régénéré depuis ces fichiers.

L'audit navigateur parcourt 23 états par configuration :

| Affichage CSS | Texte | Zones sûres simulées |
| --- | --- | --- |
| 568 × 320 | 100 % | Non |
| 568 × 320 | 125 % | Non |
| 667 × 375 | 100 % | Non |
| 844 × 390 | 100 % | Non |
| 844 × 390 | 125 % | 44 px à gauche/droite, 21 px en bas |
| 932 × 430 | 125 % | 44 px à gauche/droite, 21 px en bas |

Les collections sont débloquées et un compagnon est recruté dans les données de
test pour exercer les listes longues. Ces préparations ne modifient pas une
nouvelle partie réelle. Les captures montrent ces données de vérification.

Résultat : **138 contrôles d'affichage réussis sur les six configurations,
aucune erreur JavaScript**. Une passe supplémentaire de 23 contrôles à
844 × 390 valide les derniers ajustements de lisibilité et régénère les captures.
