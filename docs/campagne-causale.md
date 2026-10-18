# Personnes, institutions et échanges de la campagne

Cette page décrit les huit corrections de fonctionnement raccordées après le retour des escortes isolées. Sources : `world-campaign-systems.js`, `world-campaign-runtime.js`, `world-simulation.js` et `body-heat.js`. Les règles s’appliquent au jeu web et au HTML embarqué iOS.

## Personnes et soins

Chaque garde disponible dispose d’une identité persistante, d’une santé, d’un état de décès et d’une affectation. Les convois et patrouilles réservent ces personnes ; leur retour ne crée pas des gardes neufs. Une nouvelle affectation conserve la santé du dossier. Les gardes des postes batraciens sont également rattachés à ces dossiers et restent affectés à leur poste.

Au poste, un garde blessé reçoit au plus un traitement toutes les six heures du calendrier. Chaque traitement consomme un lot de médicaments et une provision et restaure deux PV, jusqu’à huit. Sans ces biens, la blessure persiste et une commande de soins reste ouverte. Les gardes à moins de deux PV ne peuvent pas repartir. Un mort ne redevient jamais disponible par expiration ou rechargement.

La population économique reste une cohorte de campagne, distincte des effectifs de conception de la bible. Ses pertes sont identifiées : un même décès ne diminue les comptes qu’une fois. La population vivante, les besoins et les effectifs de travail sont réconciliés ; les personnes déjà réservées à une expédition ne sont pas retirées deux fois des travailleurs disponibles. Les gardes et travailleurs disponibles ne sont plus deux emplois simultanés de la même réserve initiale.

Les revenus publics sont des transferts depuis un fonds privé des ménages, plafonnés par l’argent réellement disponible et la population vivante. Les rémunérations débitent la trésorerie avant de rejoindre ce fonds. La migration répartit la trésorerie existante entre fonds public et privé ; elle ne crée pas de monnaie supplémentaire.

## Déplacements des patrouilles et bandes

Une patrouille financée part du poste, suit les arêtes terrestres jusqu’au passage à protéger, reste en mission puis retrace son chemin. Un passage fermé bloque aussi son retour. Les gardes proches marchent réellement ; hors écran, le même chemin, la même progression et le même roster sont utilisés. Le personnel ne se libère qu’au poste. Un combat en cours suspend la progression ; il ne permet pas une remise en effectif à distance.

Les bandes possèdent aussi une base, des membres persistants et un chemin. Les nouvelles embuscades commencent par un déplacement depuis la base ; l’incident public et sa nouvelle locale sont créés à l’arrivée au passage. La fin du temps de présence lève la menace au passage et déclenche un retrait vers cette base, sans faire disparaître les survivants au bord de la route. Le retour reste bloqué par une fermeture. Les anciens incidents sont rattachés à un chemin de retour statique, y compris quand une route est déjà coupée. Une bande sans liaison terrestre reste sur place plutôt que de traverser la mer ou de réapparaître chez elle.

Les occupations, sièges et autres menaces armées ne se terminent plus simplement parce que leur ancien délai est dépassé. Cela ne construit pas une diplomatie, des guerres autonomes ou un simulateur général de batailles hors écran.

## Chaleur et combustible

Le statut « au coin du feu » exige du combustible. Le relais brûle son stock de bois pour une période déterminée ; plusieurs membres ou appels au rendu ne consomment pas plusieurs fois la même période. Un feu déjà alimenté peut finir de brûler quand le stock vient d’être épuisé ; il ne se rallume pas gratuitement.

En bivouac, un lot de bois porté chauffe pendant quatre heures du calendrier. Le temps de repos consomme cette durée, y compris pendant une avance accélérée. Le bois se conserve dans la sauvegarde et s’achète auprès d’un transporteur proche : deux lots sont retirés du stock du poste, le prix affiché est retiré à Kaldor et versé au vendeur. Sans combustible, le couvert protège encore partiellement du vent, mais ne réchauffe pas à 18 °C. La chaleur d’Avar après réapparition reste une protection magique explicitement distincte.

## Outils et production

Les outils disponibles modulent désormais le rendement de l’agriculture, de l’élevage, de l’exploitation des ressources naturelles et des minerais. Les pénuries laissent un rendement manuel réduit, particulièrement faible pour les minerais. Les stocks d’outils continuent de subir leur usure ; les recettes de fabrication débitent leurs intrants réels. L’eau domestique n’exige pas les mêmes outils qu’une exploitation minière et conserve sa règle propre.

## Péages, prises et financement des bandes

Une bande arrivée à son passage peut réclamer un péage. Un convoi utilise son budget de route s’il le peut, à proximité comme hors écran ; sinon Kaldor peut choisir de payer depuis le dialogue d’une escorte proche. Le transfert est unique pour ce passage et enregistré : le budget du payeur diminue, la caisse portée par la bande augmente. Les combattants respectent le passage payé ; attaquer la bande rompt cet accord temporaire. Un péage ne protège pas contre d’autres monstres ou incidents.

Une cargaison abandonnée ne peut pas être pillée abstraitement tant qu’une escorte vivante la défend encore à proximité. Lorsque la bande prend des biens, la quantité est débitée du chargement et entre dans son inventaire, dans la limite de ce que ses membres emportent. Le dépôt de la base n’est crédité qu’après son retour effectif. L’argent porté suit le même principe.

Dans une base disposant d’un réseau criminel, une revente locale peut transférer des biens volés vers un stock déficitaire, contre des fonds privés existants. La bande peut ensuite payer ses provisions et médicaments au marché local. Les dépenses débitent sa caisse et les marchandises du vendeur ; un traitement ne rend pas de vie sans médicament et nourriture. Ce circuit est modélisé dans les comptes ; il n’ajoute pas un nouveau personnage de receleur animé.

## Déclaration, règlement et récupération

Le paiement d’une commande reste réservé jusqu’à sa livraison ou au règlement d’une perte déclarée. Une livraison partielle paie la part effectivement livrée et rend le solde à l’acheteur. Une perte totale confirmée rembourse le montant réservé à l’acheteur ; le vendeur supporte la perte des biens, sous réserve de leur récupération. Cette règle commerciale est explicite, sans assurance créant de nouvelles pièces.

Les escortes survivantes peuvent rapporter la perte au poste après leur retour. Si personne ne revient, le contrat n’est pas remboursé par omniscience : Kaldor peut examiner le chariot abandonné, puis faire sa déposition au poste d’origine. Chaque chargement possède un signalement distinct ; une récupération ne résout pas le dossier d’un autre disparu.

Une perte connue peut donner lieu à une équipe de récupération. Le poste doit disposer de deux travailleurs, deux gardes, quatre provisions, un outil et quatre pièces, ainsi que d’un itinéraire praticable. L’équipe rejoint réellement le chargement, attend si une menace le tient encore, prend uniquement les biens restants puis les rapporte. Le stock du poste n’augmente qu’au retour. Le chariot quitte alors le lieu de l’abandon et accompagne le retour.

Les biens et espèces ne sont ni dupliqués ni récupérés une seconde fois. Si les porteurs de l’équipe sont tués avec les marchandises, celles-ci sont de nouveau laissées à leur position actuelle. Les survivants restent réservés jusqu’au retour ; les morts ne sont pas remplacés.

## Vérification

Les tests `world-eight-systems.test.cjs` et `world-campaign-runtime.test.cjs` couvrent les règles économiques et leur raccordement au vrai `Game`. Les suites existantes de convois, démographie, justice, soins, voyages et climat restent applicables. La recette Chromium des convois vérifie également le départ d’une équipe de récupération après un signalement réel.

Recette du 18 octobre 2026 : 426 tests JavaScript, 24 tests de bible et 120 contrôles d’interface paysage réussis ; recettes Chromium des convois et habitants sans erreur JavaScript. Intégration HTML idempotente et archive iOS vérifiée.
