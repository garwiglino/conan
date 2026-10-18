# Batraciens — intégration jouable et palettes

Coordination : [ajouts de Codex / ChatGPT et raccord à la PR de Claude](CODEX-BATRACIENS-HANDOFF.md).

Les dessins civils approuvés sont conservés : bases mâles et femelles v2/v3
et animations de métier. La révision de combat v2 articule les six rôles armés
sur ces mêmes grilles et palettes. La révision de tenues v3 leur ajoute des
vêtements propres à leur fonction et répare le tronc sous le bras articulé. Les références historiques sont conservées
dans `data/batraciens/approved-art.json` ; celles du nouveau combat, avec
vérification des poses hors combat sans tenue, sont dans `combat-art-v2.json`.
La référence habillée est dans `outfits-art-v3.json`.

## Contrat graphique

- Case moteur **80 × 80**, pieds à **(40, 52)**, pixels natifs sans lissage.
- Case de travail **48 × 48**, pieds à **(24, 36)**, translation de +16 seulement.
- Directions moteur : **0 dos, 1 droite, 2 face, 3 gauche**.
- Palette mâle : `original`, `jade`, `turquoise_sombre`, `ocre_mousse`, `ardoise`.
- Palette femelle : `rose_mauve`, `lilas`, `prune_rose`, `corail_doux` ; la palette
  `original` reste consultable dans l'atelier.
- Les sept nuances de peau et ventre changent. Équipement, yeux, silhouettes,
  poses et ancrages restent identiques. Pas de couleur « race ennemie ».
- Le dessin de mort armé approuvé déborde la fenêtre native 48 × 48. **Son export
  80 × 80 reste intact** ; demander le format natif pour cette pose lève une
  erreur explicite plutôt que couper l'arme au sol.

`art/batraciens-preview.html` permet d'examiner les deux sexes, toutes les
palettes et activités civiles, et les six rôles armés mâles, avec pause et
contrôle image par image. Les caches sont bornés ; les acteurs hors écran ne
construisent pas de nouvelles images.

## Implantations

Le registre `data/batraciens/communities.json` ajoute **62 civils et 11 gardes**
aux 14 localités existantes listées ci-dessous. Ce sont des habitants jouables
additionnels, pas un remplacement des humains, des donneurs de quêtes ou des
palefreniers. Les 83 points de localité et leurs noms ne sont pas déplacés.

La répartition est une première implantation explicite, dérivée des milieux
humides, des ressources et de la navigation de la bible. Elle **n'altère pas
silencieusement ses tableaux démographiques à quatre espèces** : une future
révision de ces recensements doit nommer les batraciens séparément et recalculer
les totaux. Aucune faction, alliance ou guerre mondiale nouvelle n'est créée.

| Territoire | Localité (ID stable) | Métiers des deux résidents historiques | Garde |
|---|---|---|---|
| Varan | Port-des-Veilleurs (`town-10`) | filets / pêche selon accès à l’eau ; cordages | Escorte de bateliers |
| Varan | Bac-des-Roseaux (`town-73`) | riziculture ; vannerie | Garde de communauté |
| Varan | Tourbeclaire (`town-74`) | poterie ; cueillette | Sentinelle |
| Varan | Brume-aux-Saules (`town-75`) | vannerie ; préparations | Garde de communauté |
| Varan | Pont-des-Joncs (`town-76`) | filets / pêche selon accès à l’eau ; cueillette | Sentinelle |
| Varan | Refuge-des-Aulnes (`town-77`) | cueillette ; préparations | Chef de patrouille |
| Tagon | Anse-des-Palmes (`town-27`) | artisanat ; filets / pêche selon accès à l’eau | Escorte de bateliers |
| Tagon | Santalune (`town-40`) | registres ; cordages | Escorte de bateliers |
| Tagon | Bourg-des-Coquilles (`town-50`) | filets / pêche selon accès à l’eau ; poterie | Sentinelle |
| Tagon | Relais-des-Lianes (`town-55`) | cueillette ; vannerie | Éclaireur |
| Tagon | Rive-de-Corail (`town-61`) | artisanat ; préparations | — |
| Teremor | Clairfoyer (`town-1`) | registres ; filets / pêche selon accès à l’eau | Garde de communauté |
| Teremor | Val-des-Mousses (`town-25`) | filets / pêche selon accès à l’eau ; vannerie | — |
| Teremor | Bois-de-Lune (`town-38`) | vannerie ; poterie | — |

Le placement cherche un sol praticable, sans ennemi immédiat dans une marge de
220 pixels, sans danger territorial actif et sans obstruction d'un service,
d'une entrée ou d'un mécanisme. Un second contrôle intervient après la création
des chevaux, charrettes et autres accessoires du transport. Les travaux de terre
utilisent une vraie surface de terre en périphérie, pas la place pavée. La pêche
à la ligne n'est autorisée que face à une vraie case d'eau ; sinon le personnage
répare un filet. Si aucune position sûre n'existe, l'habitant est différé, jamais
posé de force dans une collision.

## Vie civile et sauvegardes

Les apparences sont déterministes par identifiant, puis conservées dans la
sauvegarde. Travail, repas, dialogue, repos assis, déplacement, blessure, repli et
retour utilisent les animations du pack. Les images de marche suivent la
distance parcourue, pas le temps écoulé contre un mur. La nuit et les pauses de
travail utilisent les poses de repos. Les outils et le mobilier ne produisent
**pas** automatiquement des marchandises ou des récompenses : les métiers sont
animés ; la simulation économique reste distincte.

`world-danger.js` reste l'autorité de sécurité. Un danger interrompt le métier,
déclenche la réaction puis le repli, le masquage dans un refuge et le retour quand
le moteur le permet. Les morts civiles persistent et ne rapportent ni expérience
ni compteur de victimes au joueur. Les civils batraciens peuvent être recrutés
selon les règles existantes ; leur identité et couleur survivent au chargement
et au voyage. Les gardes ne sont pas recrutables comme des civils.

La sous-clé `atlas.batraciens` (version 1) conserve palettes, identifiants, santé,
décès et état borné des combattants d'incident. Les sauvegardes antérieures sont
acceptées. Identifiants et valeurs reçus sont filtrés, les positions et palettes
invalides sont rejetées. Les quêtes, compagnons et services existants gardent
leurs identifiants historiques.

Changer seulement la couleur d'un acteur existant dans un scénario :

```js
game.setBatracienPalette('warden-batracien-town-73-0', 'jade');
game.setBatracienPalette('resident-batracien-town-73-1', 'lilas');
```

Cette méthode conserve position, santé, animation et métier, vérifie la palette
pour le sexe concerné et demande une sauvegarde via le mécanisme du jeu.

## Gardes et groupes hostiles

Les gardes de communauté, sentinelles, escortes, éclaireurs et chefs patrouillent
près de leur poste et défendent les habitants contre les ennemis du monde
présents. Les coups et projectiles peuvent les blesser ; leur mort n'est pas
remplacée par une nouvelle copie au prochain chargement. La garde frontale et
l'interruption sur blessure sont distinctes du simple repos armé.

Les pillards et certains éclaireurs remplacent uniquement des membres de
**groupes de brigands déjà générés** dans un habitat admissible. Certaines
patrouilles existantes emploient également des gardes batraciens. Le temple,
le boss, les squelettes, les manifestations maudites et les ennemis scénarisés
ne sont pas convertis. Aucun incident supplémentaire n'est tiré pour justifier
leur présence, et aucune espèce entière ne devient hostile.

Les rôles utilisent les attaques de leur équipement : estoc et balayage/plongeon
pour la lance, taille et revers pour l'épée, taille et frappe abattue pour la
massue, lancer et estoc rapproché pour l'éclaireur. Direction fixée au
départ du geste, contact unique, annulation par étourdissement/parade, cooldown
et vérification de portée, niveau et ligne de vue. Les javelots utilisent une
collision balayée avec obstacles et un nombre maximal de 12 projectiles actifs.
Les gardes ne donnent pas au joueur l'expérience de leurs propres victimes.

Les poses de sommation, ralliement et reddition restent disponibles dans le
lecteur graphique pour les scénarios ; elles ne sont pas présentées comme un
système de négociation ou de moral autonome déjà implémenté.

## Construction et contrôles

```sh
npm install
npm run build:batraciens
node --test --test-concurrency=2 tests/*.test.cjs
python3 scripts/test-world-bible.py
npm run package:ios
```

Le constructeur vérifie ses points d'insertion, réincorpore les sources dans
`index.html` et dans la copie iOS. Aucun téléchargement séparé de sprites n'est
requis. `scripts/embed-world.cjs` conserve cette intégration lors des prochains
builds du monde. Le bundle et les planches sont reproductibles à partir des
sources, et `data/batraciens/build-manifest.json` en indique les empreintes.

Les tests couvrent les pixels approuvés, les palettes, les corps de collision,
les placements réels et différés, la sauvegarde, les compagnons, le repli, les
règles d'hostilité, le contact unique, les murs, les décès et le rendu du moteur.
Ce sont des tests Node/Canvas et d'assemblage de la version iOS, **pas une session
sur un iPhone physique**.


## Vie locale, déplacements et réponse aux agressions

Le registre conserve les 28 résidents historiques et les 11 gardes, et ajoute
28 habitants circulants (deux par localité) et six voyageurs de liaison :
**73 batraciens au total, dont 62 civils**. Les civils sont 31 mâles et 31 femelles.
Les habitants supplémentaires gardent les métiers de la communauté : cordages
et filets dans les ports ; vannerie et poterie dans les autres implantations.
Les emplois décrivent des routines, pas une production économique automatique.
Un emplacement peut rester différé si les contraintes de sécurité l'exigent.

Les habitants circulants alternent travail, déplacements locaux, visite d'un
voisin, conversation et retour au poste. Les échanges sont réservés à une paire,
les interlocuteurs se font face et emploient l'animation de parole existante.
Deux courtes répliques ambiantes alternent sans ouvrir de dialogue modal.
Une blessure, une alerte, un recrutement, une disparition ou une conversation
avec le joueur libère la paire. Les conversations ne génèrent pas de rumeurs
inventées et n'exposent aucune information privée des compagnons.

Les six liaisons piétonnes sont Port-des-Veilleurs–Tourbeclaire,
Bac-des-Roseaux–Tourbeclaire, Santalune–Anse-des-Palmes,
Relais-des-Lianes–Rive-de-Corail, Clairfoyer–Bois-de-Lune et
Val-des-Mousses–Bois-de-Lune. Elles suivent exclusivement le graphe routier
existant, dans les deux sens. Aucune ligne droite inter-ville ne remplace une
route, et aucun trajet maritime n'est converti en marche sur l'eau.
Les voyageurs attendent aux passages fermés ou menacés et se reposent la nuit.
Le parcours visible utilise les collisions et la marche native. Hors du champ,
l'avancement est borné, échantillonné sur la route et arrêté avant d'entrer dans
la zone visible. Les positions et la progression routière validées survivent
au chargement ; les partenaires temporaires de conversation ne sont pas sauvés.

### Agression et garde locale

Un coup porté par Kaldor à un garde le rend hostile. L'agression d'un civil,
humain ou batracien, alerte les gardes vivants qui la voient à proximité,
y compris si le premier coup est mortel. Le contrôle utilise la distance
(220 pixels), l'étage et la ligne de vue. Un coup donné par un monstre ne met
pas Kaldor en cause. Il n'existe pas d'alerte instantanée à toutes les villes.
La colère est enregistrée par garde, pour 180 minutes du calendrier du monde
après la dernière agression constatée. Elle ne disparaît pas au rechargement.
La poursuite reste locale (380 pixels autour du poste) et ne suit pas les
coordonnées cachées du joueur à travers les murs. Un transport ou un lit ne
permet pas d'annuler le combat alors qu'un garde hostile est encore proche.

Un garde hostile rejoint l'ensemble commun des cibles de combat : verrouillage,
orientation, collision de lame, parade du joueur et rendu ennemi (repère,
barre de vie, flash). Il conserve son identité de PNJ et n'est ni cloné dans la
liste des ennemis ni dessiné ou frappé deux fois. Les dégâts du joueur utilisent
la fonction native des ennemis : puissance, riposte, pause d'impact, recul,
récompense d'un adversaire armé et mort persistante. Les dégâts infligés par
les gardes ne donnent toujours pas d'expérience à Kaldor. Les javelots d'un
garde en colère ciblent l'agresseur, sans blesser ses propres civils.

### Blessures et sang

Les civils humains et batraciens, les gardes et les pillards utilisent maintenant
le système de sang existant : gerbe directionnelle `bloodFX`, impacts et taches
au sol, mêmes limites de durée et de nombre. Les morts animées des PNJ restent
uniques : pas de second cadavre générique superposé. Les coups réellement
bloqués ne saignent pas. Les personnages essentiels restent protégés de la mort,
les civils ordinaires ne donnent ni expérience ni compteur de victimes.
Les gardiens de pierre continuent de produire de la pierre, pas du sang.

Sources : `scripts/batraciens-society.js`, `scripts/batraciens-runtime.js` et
`data/batraciens/communities.json`. Les grilles et palettes des packs approuvés
n'ont pas été modifiées. Les tests supplémentaires sont dans
`tests/batraciens-society.test.cjs`.

## Révision de combat v2 — 18 octobre 2026

Les dessins civils restent inchangés. Le combat armé a maintenant un moteur de
poses et de smears sur la grille native ; les anciennes empreintes de combat v1
restent archivées et la nouvelle référence se trouve dans `combat-art-v2.json`.
Voir [belligérants, répertoires, boucliers et limites d'intégration](batraciens-belligerants.md)
et [le lecteur interactif](../art/batraciens-combat-preview.html).
Les paragraphes précédents décrivant un seul coup par équipement et des
empreintes armées toutes inchangées sont remplacés, pour le combat, par cette
révision. Les implantations civiles et les affiliations politiques restent
celles décrites plus haut.

## Tenues armées v3 et raccord du bouclier

La découpe du bras de profil supprimait aussi le tronc qu'il cachait. Le moteur
reconstruit maintenant ce volume avant de dessiner les vêtements, les bras et
le bouclier. Le corps reste fermé même avec `equipment:false` et `outfit:false`.
Le lecteur permet de masquer armes et bouclier pour examiner ce raccord.

Les six tenues emploient les ressources de Varan/Tagon : cuir tressé et lin pour
les gardes ; toile cirée renforcée pour les sentinelles ; gilet de cuir et
écharpe de lin pour les épéistes ; mantelet court pour les éclaireurs ; cuir
rapiécé et corde pour les pillards ; cuir clouté, bronze limité et étoffe garance
pour les chefs. Le ventre, le museau et les yeux restent lisibles. Pas de casque
fermé ni d'armure massive imposée aux habitants des milieux humides.
Les vêtements suivent le tronc dans les poses de repos, la marche et le combat.
Leur matière ne change pas avec la pigmentation de la peau. Ces tenues indiquent
un métier/équipement, pas une appartenance criminelle universelle.
