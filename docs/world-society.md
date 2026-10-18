# Vie locale, rencontres et paroles du monde

Implémentation : Codex / ChatGPT. Modules : `scripts/world-society.js` et
`scripts/world-dialogue.js`, embarqués par `scripts/embed-world.cjs` dans le jeu
web et sa copie iOS.

## Ce qui existait et ce qui est raccordé

La bible définit déjà mandats des patrouilles, brigandage local, neutralité des
civils, chemins commerciaux et circulation imparfaite des nouvelles. Le moteur
dispose des événements datés, de leur danger local, de gardes qui combattent,
des blessures/morts et de la fuite des civils. Les routines des batraciens avaient
déjà des déplacements et des conversations réservant deux participants.

Les ajouts rendent ces interactions communes aux PNJ présents : habitants humains,
batraciens, voyageurs et gardes. Ils ne créent pas une hostilité raciale. Le pack
visuel des hommes-singes reste distinct de leur future population en jeu.

## Conversations et vie locale

Deux personnages proches, visibles, sur le même étage et sans obstacle peuvent
s'arrêter, se regarder et échanger deux phrases. Ils se réservent mutuellement,
cessent de marcher et reprennent leur activité après environ sept secondes.
Une pause d'au moins 32 secondes évite de répéter constamment les échanges ; les
discussions automatiques ne démarrent pas dès le chargement. Les habitants peuvent
faire une courte visite autour de leur poste, en journée, sur un parcours praticable.
Les services fixes ne quittent pas leur poste pour cette promenade.

Les nouvelles connues sont apprises et partagées par les mécanismes existants.
Les informations privées des compagnons ne sont pas transmises aux passants.
Les sujets de conversation incluent marché, provisions, trajet, matériel et menace
de brigandage lorsqu'elle est connue. Ces petites conversations n'inventent pas de
transactions économiques dans les stocks.

Les bulles sont dessinées au-dessus du locuteur dans le monde, sans panneau modal,
son, notification ni choix imposé. Deux bulles au maximum, deux lignes par bulle ;
elles évitent le HUD, le joueur et les autres bulles. Un dialogue avec le joueur,
une blessure, une menace proche, une disparition ou un changement d'étage interrompt
l'échange. Les mécanismes de conversation des batraciens restent compatibles.

## Rencontres sur les routes

Des voyageurs et marchands ont des identités déterministes sur les vrais segments
terrestres du graphe. Ils suivent le chemin avec les collisions habituelles et
continuent au segment suivant, sans faire demi-tour aux limites de chargement.
Ils s'arrêtent aux extrémités de la route avant de repartir. Une fermeture ou un
incident imposant l'évacuation interrompt leur progression. Leur poste de repli
est leur dernière position sur le chemin, pas une ville lointaine.

Le chargement est local : huit voyageurs au maximum, évaluation toutes les deux
secondes, apparition entre 360 et 1 050 pixels du joueur et retrait au-delà de
1 500 pixels. Aucune apparition près d'un ennemi, sur l'eau, dans un obstacle ou
dans un passage dangereux. Identité, apparence, santé, mort et progression sur le
graphe sont sauvegardées ; les enregistrements invalides sont écartés. Les morts
ne sont pas recréés après rechargement. Les courriers et les six parcours existants
des batraciens continuent à fonctionner.

Les patrouilles restent issues des événements `patrol`. Sur un événement de route,
elles sont placées sur celle-ci, parcourent leur secteur et abandonnent leur ronde
pour intervenir contre une menace réelle. L'expiration du mandat ne les fait pas
disparaître au milieu d'un combat : elles terminent l'engagement puis s'éloignent.
Un incident de ville peut toujours utiliser ses positions locales existantes.

## Brigands et civils

La politique `EVENT_TYPES.bandits.civilianPrey` autorise les auteurs d'un incident
de brigandage actif à choisir une victime civile proche, sur le même étage et en
ligne de vue. Elle ne donne pas ce comportement indistinctement aux occupations,
aux sièges ou à toute une espèce. Les ennemis scénarisés conservent leurs règles.

Le choix de cible utilise le combat existant : approche, préparation, attaque,
projectile, vérification de portée, blessure et mort. Il n'y a ni dégâts aléatoires
hors écran ni mort abstraite. Le civil fuit à la perception de la menace et les
témoins d'une agression prennent aussi la fuite. Un personnage acculé reste visible
et vulnérable. Les gardes peuvent intervenir et les ennemis leur répondre ; le
joueur peut donc assister à une attaque, protéger le voyageur ou éviter le combat.

Ces rencontres consomment le danger et les incidents locaux existants. Elles
n'augmentent pas artificiellement le danger d'une région entière et ne font pas
apparaître des civils à côté d'un groupe hostile pour provoquer un spectacle.

## Nouvelles et conseils parlés

Les réponses montrent au plus trois nouvelles pertinentes connues du personnage.
Les menaces actuelles passent avant une ancienne annonce sans enjeu. Les lieux
restent nommés, mais les réponses ne récitent plus score `/5`, source administrative
ou numéro de jour. Le témoignage direct, la rumeur ancienne et l'absence de nouvelles
restent distingués. Le journal conserve ses identifiants, dates et détails exacts.

Les conseils routiers distinguent passage coupé, brigands, trajet exposé, patrouille,
ancienne rumeur et absence de signalement récent. Un habitant ne garantit jamais
qu'une route est sûre simplement parce qu'il n'a rien entendu. Une résolution ne
lui devient connue qu'avec le délai de propagation déjà géré par le monde.

## Limites et validation

La géopolitique causale complète décrite par la bible (effectifs financés, stocks,
ordres juridiques et contrats) reste un chantier distinct. Ces ajouts ne remplacent
pas les déclencheurs calendaires du moteur par une simulation économique complète.
Ils donnent des conséquences physiques aux événements existants.

Tests : `tests/world-society.test.cjs`, plus les suites danger, combat entre PNJ,
batraciens et propagation des nouvelles. Le contrôle navigateur
`scripts/check-world-society.cjs` vérifie des bulles réellement dessinées, les deux
locuteurs, l'interruption par le joueur et la marche d'un voyageur sur la carte.
Captures de revue dans `art/world-society/`.
