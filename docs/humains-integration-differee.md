# Ressources humaines prêtes pour une intégration ultérieure

Ce lot est livré dans le dépôt comme bibliothèque de sprites et atelier autonome. Son ajout ne branche pas les activités sur les PNJ du jeu principal. L’intégration à la simulation pourra être décidée séparément.

Les ressources comprennent les 59 tenues natives, les 55 coiffes et casques, les 152 clips, les pièces de vêtements combinables, les postes indépendants, les concepts retenus et l’adaptation hivernale d’Igea. Les grilles JavaScript sont directement utilisables ; il n’est pas nécessaire de reconstruire les dessins sources pour consulter ou utiliser la bibliothèque.

## Consulter après clonage

Depuis la racine du dépôt :

```sh
npm install
npm run preview:humans
python3 -m http.server 8080
```

Ouvrir `http://localhost:8080/art/humains/activites/atelier.html`. Cliquer le fichier HTML sur GitHub affiche son code : le serveur local permet de consulter l’atelier.

Une version autonome avec les concepts intégrés est générée dans `test-output/humains/atelier-autonome.html`. Elle peut être ouverte directement dans un navigateur. Ce dossier de sortie est ignoré par Git.

## Points d’entrée pour l’intégration future

| Besoin | Entrée |
|---|---|
| Personnage seul, vêtements et objets tenus | `sprites/humains/activites.js` |
| Assemblage des pièces du vêtement | `sprites/humains/modularite.js` |
| Catalogue de rôles, clips et restrictions | `sprites/humains/catalogue.js` |
| Postes vides, sockets, réservation et occultation | `sprites/decors/postes-humains.js` |
| Politique de saison et masques de neige | `sprites/decors/igea-hiver.js` |
| Composition de démonstration personnage + poste | `sprites/humains/scene.js` |

Le moteur devra choisir l’activité à partir de l’état réel du monde, réserver son socket, garder les pieds à cet emplacement et appliquer les événements du clip aux stocks ou aux objets concernés. La bibliothèque ne consomme pas de ressources et ne simule pas elle-même les métiers.

Les meubles et machines restent des entités du monde. Les armes, outils et matériaux manipulés restent sur le personnage. L’atlas naturel du jeu doit être fourni par son adaptateur ; les échantillons conservés servent à l’aperçu autonome. `season: 'igea_winter'` s’applique à l’enneigement observé, avec ses conditions d’accès, et non simplement à une tenue chaude.

Les détails de l’API sont dans [Activités humaines](humains-activites.md), [Vêtements modulaires](humains-modularite.md), [Postes JavaScript](humains-postes-javascript.md) et [Igea en hiver](humains-igea-hiver.md).

## Vérifications

```sh
npm run test:humans
npx playwright install chromium
npm run check:human-workshop
```

Le premier contrôle comprend 36 tests : tenue/animation, pièces natives, contacts, poses montées, neige et coiffes. Le contrôle navigateur utilise soit Chromium déjà installé, soit celui fourni par Playwright. Il vérifie l’atelier, les sélecteurs de pièces et de coiffes, les postes et la présentation mobile.

Les concepts et les planches de contrôle sont conservés dans `art/humains/activites/`. Les scripts `render-human-*.cjs` produisent les planches ; l’export GIF de `render-human-showcase.cjs` nécessite Python 3 et Pillow.
