# Hommes-singes — programme de fabrication généré

Source : `ape-folk.json`. Les statuts ci-dessous conservent le plan initial de conception (quatre animations de base marquées `implemented`) ; ils ne recensent pas les ressources visuelles livrées depuis. Le module `sprites/hommes-singes/activites.js` couvre désormais les 55 activités et 16 fonctions : voir [les tenues et activités](../../hommes-singes-activites.md) et `data/hommes-singes/activities-manifest.json`. Les structures, routines et apparitions en jeu restent à intégrer. Les activités ne créent aucun stock automatiquement.

| Priorité | ID | Activité | État du plan initial | Accessoires | Poste | Repères de contact |
|---|---|---|---|---|---|---|
| P0 | `shelter` | Se replier, attendre puis revenir | to_create | — | shelter | safe_arrival, calm_before_return |
| P0 | `carry` | Porter une charge | to_create | crate, basket | safe_path | two_hand_grip, foot_contacts |
| P0 | `death` | Mort persistante | to_create | — | ground | no_duplicate_corpse |
| P0 | `drink` | Boire | to_create | gourd | house | consume_once |
| P0 | `eat` | Manger une portion | to_create | bowl | house | consume_once |
| P0 | `flee` | Course de fuite | implemented | — | escape_path | foot_contacts |
| P0 | `hit` | Blessure et interruption | to_create | — | ground | cancel_action |
| P0 | `idle` | Repos debout | implemented | — | ground | — |
| P0 | `put_down` | Poser et reprendre une charge | to_create | crate, basket | granary | release_once |
| P0 | `seated` | Repos assis | to_create | bench | meeting | — |
| P0 | `sit_down` | S’asseoir | to_create | bench | meeting | seat_contact |
| P0 | `stand_up` | Se relever | to_create | bench | meeting | release_seat |
| P0 | `startle` | Réagir à une alerte | to_create | — | ground | interrupt_work |
| P0 | `walk` | Marche | implemented | — | ground | foot_contacts |
| P0 | `talk` | Parler et écouter | implemented | — | meeting | — |
| P1 | `sleep` | Dormir au foyer ou à la halte | to_create | mat | house | bed_reserved |
| P1 | `greet` | Saluer ou remercier | to_create | — | meeting | — |
| P1 | `cook` | Cuire et préparer les repas | to_create | pot, ladle | house | stir_contact |
| P1 | `cut_fiber` | Récolter des fibres | to_create | knife, bundle | garden | cut_contact |
| P1 | `harvest_fruit` | Cueillir fruits et aromates | to_create | basket, hook | garden | reach_target, collect_once |
| P1 | `hew` | Débiter du bois au billot | to_create | axe, log | wood_yard | tool_contact |
| P1 | `hoe` | Biner et entretenir les jardins | to_create | hoe | garden | ground_contact |
| P1 | `joinery` | Assembler et réparer | to_create | mallet, pegs | wood_yard | tool_contact |
| P1 | `ledger` | Compter, écrire et peser | to_create | ledger, scale | market | mark_once |
| P1 | `load` | Charger, décharger et arrimer | to_create | crate, rope | quay | hand_over_once |
| P1 | `prune` | Élaguer et entretenir le verger | to_create | pruning_blade | garden | cut_contact |
| P1 | `resin` | Recueillir de la résine | to_create | scraper, pot | wood_yard | tap_contact |
| P1 | `rope` | Tordre des cordages | to_create | rope_rack | fiber_yard | twist_cycle |
| P1 | `saw` | Scier au chevalet | to_create | saw, sawhorse | wood_yard | tool_contact |
| P1 | `sow` | Planter et semer | to_create | seed_bag | garden | plant_once |
| P1 | `weave` | Tresser nattes et paniers | to_create | basket, fiber_bundle | fiber_yard | hand_crossing |
| P2 | `bandage` | Soigner un blessé | to_create | bandage | shelter | care_once |
| P2 | `armed_idle` | Repos armé et orientation | to_create | weapon | watch | — |
| P2 | `armed_walk` | Pas armés face à une cible | to_create | weapon | safe_path | foot_contacts, facing_independent |
| P2 | `axe_chop` | Frappe de hache ou massue | to_create | axe | ground | single_contact, active_smear |
| P2 | `blade_cut` | Taille et revers courts | to_create | blade | ground | single_contact, active_smear |
| P2 | `block` | Encaisser un coup au bouclier | to_create | shield | ground | blocked_once, no_blood |
| P2 | `guard_break` | Garde brisée et étourdissement | to_create | shield | ground | stun, cancel_attack |
| P2 | `guard_hold` | Tenir la garde en mouvement | to_create | shield | ground | frontal_only |
| P2 | `guard_raise` | Lever le bouclier | to_create | shield | watch | guard_ready |
| P2 | `spear_thrust` | Estoc de lance | to_create | spear | ground | single_contact, active_smear |
| P2 | `staff_sweep` | Balayage de bâton ou de hampe | to_create | staff | ground | single_contact, active_smear |
| P2 | `surrender` | Rendre les armes | to_create | weapon | ground | drop_once |
| P2 | `throw_stone` | Lancer d’une pierre ou d’un javelot | to_create | stone, javelin | ground | release_projectile, swept_collision |
| P2 | `warn` | Sommation et ralliement | to_create | weapon | watch | local_witness |
| P2 | `mourn` | Veillée et funérailles | to_create | — | meeting | existing_person_event |
| P2 | `negotiate` | Négocier et arbitrer | to_create | ledger | meeting | named_parties |
| P2 | `honey` | Récolter miel et cire | to_create | smoker, hive, jar | garden | collect_once |
| P2 | `medicinal` | Trier et préparer des remèdes | to_create | mortar, herbs | house | mix_contact |
| P2 | `net` | Réparer les filets ou pêcher | to_create | net, needle | quay | real_water_or_repair |
| P2 | `pottery` | Tourner et façonner une poterie | to_create | wheel, clay_lump | kiln | hand_contact |
| P2 | `repair_boat` | Calfater et réparer une coque | to_create | mallet, caulking_tool, resin_pot | quay | tool_contact |
| P2 | `row` | Ramer ou mener une petite embarcation | to_create | oar, boat | quay | water_contact |
| P2 | `stitch` | Coudre cuir et vêtements | to_create | needle, cloth | fiber_yard | needle_contact |
| P3 | `climb` | Monter par accès forestier aménagé | to_create | ladder, rope | forest_platform | real_navigation_edge, no_teleport |

## Tenues et fonctions

Les tenues sont disponibles dans le module visuel ; les descriptions suivantes restent les consignes de conception.

| Fonction | Activités | Structures | Description de tenue |
|---|---|---|---|
| Cultivateur et verger | hoe, sow, harvest_fruit, prune | garden, granary | toile légère, tablier court, panier ; chapeau optionnel |
| Fibres, paniers et cordages | cut_fiber, weave, rope | fiber_yard | tablier souple, manches dégagées ; pas de casque |
| Bois, résine et ruchers | resin, hew, saw, honey | wood_yard, garden | cuir de travail, ceinture d’outils ; couvre-chef selon tâche |
| Charpente et réparation navale | joinery, repair_boat | wood_yard, quay | tablier renforcé et outils à portée ; pas de bouclier permanent |
| Portage et chargement | carry, load, put_down | granary, quay | veste courte, sangle de portage et sandales adaptées |
| Marché et écritures | ledger, negotiate | market | étoffe propre, bourse, tablette ou registre |
| Poterie | pottery | kiln | tablier de toile sans manches flottantes près du four |
| Préparations et soins | medicinal, bandage | house, shelter | pochettes et étoffe propre ; aucune magie automatique |
| Cuisine et réserve | cook, eat | house, granary | tablier et couvre-chef de travail optionnel |
| Filets et navigation | net, row, load | quay | veste courte, corde et protection de pluie |
| Couture et entretien | stitch | fiber_yard | tablier, aiguille, cuir ou étoffe selon commande |
| Médiation et mémoire | talk, ledger, negotiate, mourn | meeting | tenue civile locale, signe de mandat discret et révocable |
| Garde de communauté | armed_idle, armed_walk, warn, guard_raise, guard_hold, block, guard_break, spear_thrust | watch | protection courte de cuir, lance et bouclier ; casque ouvert facultatif |
| Escorte de convoi | armed_walk, guard_hold, block, blade_cut, surrender | watch, quay | cuir et toile, lame courte et bouclier ; mandat limité au convoi |
| Éclaireur de chemins | armed_walk, warn, staff_sweep, throw_stone | watch | tenue légère, bâton, sac de pierres ou javelots ; pas de bouclier par défaut |
| Membre d’une bande identifiée | armed_walk, axe_chop, blade_cut, throw_stone, surrender | outlaw_camp | équipement accessible au groupe, pas d’uniforme racial du crime |

## Implantations existantes, quartiers à construire

| Localité | ID atlas / runtime | Communauté | Hommes-singes % | Batraciens % | Résidents hommes-singes de conception |
|---|---|---|---:|---:|---:|
| Coralbourg | 3 / town-3 | ape-palmeraie | 22.0 | 6.0 | 1103 |
| Anse-des-Palmes | 27 / town-27 | ape-palmeraie | 12.0 | 9.99 | 602 |
| Santalune | 40 / town-40 | ape-palmeraie | 24.99 | 12.01 | 1253 |
| Relais-des-Lianes | 55 / town-55 | ape-palmeraie | 37.99 | 8.0 | 1905 |
| Rive-de-Corail | 61 / town-61 | ape-palmeraie | 18.01 | 9.99 | 903 |
| Palmehaute | 62 / town-62 | ape-palmeraie | 44.0 | 6.0 | 2206 |
| Bourg-des-Coquilles | 50 / town-50 | ape-coralune | 14.0 | 10.0 | 3584 |
| Havre-des-Épices | 51 / town-51 | ape-coralune | 8.0 | 4.0 | 2048 |
| Port-des-Veilleurs | 10 / town-10 | ape-rosebrume | 6.0 | 18.0 | 638 |
| Bac-des-Roseaux | 73 / town-73 | ape-rosebrume | 3.0 | 22.0 | 276 |
| Tourbeclaire | 74 / town-74 | ape-rosebrume | 4.0 | 22.0 | 368 |
| Brume-aux-Saules | 75 / town-75 | ape-rosebrume | 12.0 | 28.0 | 1276 |
| Pont-des-Joncs | 76 / town-76 | ape-rosebrume | 3.0 | 20.0 | 276 |
| Refuge-des-Aulnes | 77 / town-77 | ape-rosebrume | 18.0 | 22.0 | 1914 |
| Fort-des-Ronces | 19 / town-19 | ape-boisclair | 6.0 | 1.0 | 638 |
| Val-des-Mousses | 25 / town-25 | ape-boisclair | 8.0 | 8.0 | 850 |
| Col-des-Cèdres | 32 / town-32 | ape-boisclair | 6.0 | 1.0 | 638 |
| Bois-de-Lune | 38 / town-38 | ape-boisclair | 2.0 | 4.0 | 267 |
| Ormerive | 46 / town-46 | ape-boisclair | 3.0 | 1.0 | 319 |
| Aulneport | 2 / town-2 | ape-quais | 2.0 | 1.0 | 267 |
| Port-Sarak | 5 / town-5 | ape-quais | 2.0 | 0.0 | 322 |
| Branchebasse | 42 / town-42 | ape-quais | 5.0 | 1.0 | 319 |

## Structures à fabriquer

| Structure | Empreinte en tuiles de 16 px | Matériaux | Condition de placement |
|---|---|---|---|
| Maison de cour | 4 × 4 | timber, fiber, clay, rope | sol drainé, accès au puits, entrée praticable, foyer séparé du stockage |
| Jardin-verger | 6 × 5 | tools, water | terre fertile non pavée, réserve de graines, irrigation vérifiée |
| Grenier ventilé sur soubassement | 4 × 3 | timber, rope, pottery | abrité des crues et de la pluie, réserve indépendante des exports |
| Cour de fibres et cordages | 5 × 4 | fiber, timber, tools | longue aire de torsion libre, abri de séchage |
| Atelier du bois | 6 × 4 | timber, tools, iron | billot, chevalet et zone dangereuse hors passage |
| Poterie et four | 4 × 4 | clay, firewood, water | atelier à nuisance distinct de l’habitat et accès au combustible |
| Petit quai partagé | 6 × 3 | timber, rope, tools | vraie rive navigable et raccord au graphe, aucune barque à terre |
| Auvent de marché | 4 × 3 | timber, cloth, rope | route existante, contrôle des balances et circulation civile |
| Cour commune et bancs | 5 × 4 | timber, building_stone | sol libre, point de refuge proche, accueil de voisins d’autres espèces |
| Poste de veille | 3 × 3 | timber, tools, arms | mandat, stock de vivres, chemin de relève et champ de vue réel |
| Refuge fermé et couvert | 4 × 4 | timber, clay, cloth | point de repli atteignable sans traverser le danger ; pas de téléportation |
| Plateforme forestière facultative | 3 × 3 | timber, rope | solide support et étage/collision/accès réel requis avant utilisation |
| Bivouac d’une bande identifiée | 4 × 3 | timber, cloth, rope | hors des refuges civils et à distance de sécurité ; seulement si incident et bande existants |
