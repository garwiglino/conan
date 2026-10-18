# Batraciens — belligérants et révision du combat

## Ce que le lore établit

Sources : `docs/world-bible/01-geopolitique.md`, `04-danger-et-evenements.md`,
`05-societes-et-criminalite.md`, `data/world/bible/generated/networks.json` et
`data/batraciens/communities.json`.

Les batraciens sont des habitants de Varan, Tagon et de certains lieux humides de
Teremor. Ils ne forment pas un État ou une alliance militaire raciale. La bible v2 distingue désormais les batraciens dans le recensement à six espèces ; ces chiffres de conception ne représentent pas des effectifs militaires ni une diplomatie raciale. Les neuf acteurs diplomatiques
existants ne comprennent aucune « faction batracienne » souveraine.

Les réseaux criminels de la bible ne définissent pas une espèce exclusive.
Les affiliations ci-dessous sont des possibilités compatibles avec le lore,
pas une attribution rétroactive de tous ces réseaux aux batraciens.

| Groupe / fonction | Situation avant révision | Besoin et statut après révision |
|---|---|---|
| Bandes locales rançonnant routes et accès humides | Incidents `bandits`, batraciens à massue ou javelot | Composition enrichie : massue, javelot, troisième homme au bouclier avec épée ou lance. Même incident et mêmes limites de population. |
| Gardes de communautés, sentinelles et chefs locaux | Six profils graphiques déjà présents, dont escorte et éclaireur | Défense locale existante ; chaque profil utilise maintenant un répertoire de coups et la défense au bouclier partagée. |
| Escorte mercenaire d'un transporteur | Profil `boat_escort` disponible ; gardes locaux présents | Matériel suffisant. Un recrutement contractuel et un mandat économique autonome restent à écrire ; aucune faction nouvelle nécessaire. |
| Recel et saisies dans les ports de Varan/Tagon (`maritime_receivers`) | Réseau défini dans la bible, sans groupe batracien nommé | Il manque surtout commanditaire, personnes, cargaison et ordre précis. Le profil épée/bouclier ou lance/bouclier peut servir ; pas d'agression universelle contre les marins. |
| Collectes interdites de bois, résine et plantes (`illicit_collectors`) | Réseau défini, acteurs non exclusifs | Des batraciens sont plausibles dans les districts humides. Il faut un site exploité, un droit contesté et une résistance violente avérée avant d'en faire un combat. |
| Courtiers de captifs (`captive_brokers`) | Réseau de conception présent, pas une bande batracienne identifiée | Un antagoniste local est possible, mais demande des responsables nommés, des victimes et une enquête. Aucune apparition automatique ajoutée. |
| Contestation armée de péages, de quais ou d'usages de l'eau | Contentieux Varan–Tagon et accès locaux décrits | Une garde peut devenir belligérante sous un ordre limité. Il manque le raccord entre mandat, personnes visées et événement ; un différend seul ne rend pas les habitants ennemis. |

**Conclusion de conception :** il manquait un brigand au bouclier dans les
rencontres existantes, et des identités/mandats locaux pour plusieurs conflits
de la bible. Il ne manque pas une armée raciale ni un nouveau peuple ennemi.
Les scènes de recel, de contrebande et de captivité restent des travaux de scénario,
pas des fonctionnalités déclarées actives par cette révision graphique.

## Composition des bandes existantes

En habitat admissible, les trois emplacements de l'incident `bandits` utilisent
respectivement `raider`, `scout` et un équipement `boat_escort` ou `captain`, choisi
par identifiant stable de l'incident. Ces deux derniers identifiants désignent
ici un profil d'équipement ; le brigand ne reçoit pas une fonction officielle
d'escorte ou de chef de la ville. Pas d'incident supplémentaire, de renommage de
lieu, de couleur « ennemie », ni d'hostilité des civils par association.
Les morts, la santé, le rôle incident et l'avancement du répertoire sont sauvés.
Les limites de biome, de sécurité et d'effectifs du moteur restent applicables.

## Répertoire de combat v2

| Profil | Coups | Défense |
|---|---|---|
| Garde de communauté | Estoc, balayage de hampe | Bouclier |
| Sentinelle | Estoc, frappe plongeante | Bouclier |
| Escorte / profil d'épéiste | Taille croisée, revers court | Bouclier |
| Éclaireur | Lancer à distance, estoc court sous 28 pixels | Pas de bouclier |
| Pillard | Taille à la massue, frappe abattue | Pas de bouclier |
| Chef / profil de lancier entraîné | Estoc, balayage, frappe plongeante | Bouclier |

Les catégories de mêlée alternent leurs coups aux attaques successives ; elles
ne copient pas la chaîne de quatre coups ni la vitesse du joueur. La tête, le
tronc, les pieds et les bras restent articulés sur la grille native. Chaque
prise est liée au poignet. La préparation occupe cinq poses, la frappe deux poses
rapides, puis cinq poses de retour. Les smears suivent le trajet de l'arme,
uniquement pendant les images actives ; leur alpha reste 0 ou 255.
Les quatre vues et les palettes approuvées restent la base du dessin.
Les animations civiles et les poses armées hors combat conservent leurs pixels v1.

Les métadonnées de clip (`contact`, `duration`, `activeFrames`) font autorité pour
le lecteur et le moteur. Un coup a un seul contact, direction verrouillée,
contrôles de portée, ligne de vue et étage. Le javelot quitte la main au contact
de lancer ; l'estoc court n'engendre aucun projectile. La parade du joueur
interrompt immédiatement l'attaque ; le smear ne crée aucun dégât supplémentaire.

## Bouclier partagé

- Garde levée en 100 ms, tenue au plus 720 ms, puis ouverture avant le prochain coup.
- Angle frontal selon le produit scalaire du moteur (> 0,25).
- Deux coups bloqués au maximum dans une même garde ; récupération d'impact 340 ms.
- Le quatrième coup lourd du joueur brise la garde et étourdit 850 ms.
- Un coup reçu dans le dos, un coup imblocable ou une garde encore en montée
  n'est pas absorbé. Étage et ligne de vue restent contrôlés.
- Un blocage ne fait pas saigner et n'ajoute pas une invulnérabilité générale.
- Même fonction `tryBatracienBlock` pour PNJ gardes et brigands ennemis,
  y compris les coups qu'ils se donnent ; aucune expérience n'est attribuée
  au joueur pour une victime de garde.

## Aperçu et validation

`art/batraciens-combat-preview.html` est un lecteur autonome des sources actuelles :
catégorie, coup, vue, vitesse, smear, pause, défilement et tests de bouclier.
Le banc de bouclier incorpore la fonction de défense du moteur ; il ne simule
pas le monde, la recherche de chemin ou l'IA complète.

```sh
node scripts/build-batraciens.cjs
node scripts/preview-batraciens-combat.cjs
node --test --test-concurrency=2 tests/batraciens*.test.cjs
```

`data/batraciens/approved-art.json` garde les références v1.
`data/batraciens/combat-art-v2.json` isole la nouvelle référence de combat et
les empreintes des animations hors combat v1 conservées.
