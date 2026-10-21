# Hearthreaver pour iOS (Xcode)

Une app iOS native en Swift qui contient **le jeu exact** : le fichier HTML du dossier `Game` utilise le même code que la version web. Le moteur, le rendu, les sons, la musique, les commandes tactiles et la sauvegarde sont les mêmes.

## Ce que l'app apporte en plus du site
- Un vrai plein écran : pas de barre d'état, barre d'accueil discrète, gestes système sur les bords qui demandent un second glissement.
- Un jeu verrouillé en paysage sur iPhone et iPad, dans les deux sens. Le titre et les boutons du menu restent à l'intérieur des marges de sécurité.
- Le jeu marche hors ligne : la dernière version reçue est gardée sur l'iPhone.
- Le jeu se met à jour tout seul (voir plus bas).
- La sauvegarde est copiée dans un fichier de l'app, en plus du stockage web.
- Des vibrations natives discrètes, désactivables dans Options, pour les validations, dégâts, parades réussies et récompenses.
- Le jeu enregistre la partie quand l'app passe en arrière-plan.
- Un voyage continue en arrière-plan ; une notification « Arrivé à destination » prévient de l'arrivée, et le jeu attend en pause.
- Si iOS libère la mémoire, le jeu se recharge tout seul.

## Installer sur ton iPhone
1. Sur un Mac, ouvre le [projet Xcode fourni](Hearthreaver.xcodeproj).
2. Sélectionne le projet, puis la cible **Hearthreaver**, puis l'onglet **Signing & Capabilities**. Dans **Team**, choisis ton compte Apple. Si on te le demande, ajoute-le dans *Xcode › Settings › Accounts*.
3. Pour une installation neuve, si l'identifiant est déjà pris, choisis un identifiant unique (par exemple `com.tonnom.hearthreaver`). Pour mettre à jour une installation existante, conserve son identifiant et son équipe de signature.
4. Branche l'iPhone, choisis-le en haut de la fenêtre, puis clique sur ▶︎ (Run).
5. Au premier lancement, sur l'iPhone :
   - active *Réglages › Confidentialité et sécurité › Mode développeur* ;
   - fais confiance au développeur dans *Réglages › Général › VPN et gestion de l'appareil*.

### Si Xcode dit qu'il manque `project.pbxproj`
Le message « cannot be opened because it is missing its project.pbxproj file » veut dire que la copie ouverte sur le Mac est incomplète : le fichier est bien dans le dépôt et dans l'archive. Repars d'une copie propre, hors du dossier Téléchargements, en collant cette ligne dans le Terminal :

```sh
mkdir -p ~/Developer && cd ~/Developer && curl -fL -o Hearthreaver-iOS.zip https://github.com/garwiglino/conan/raw/main/Hearthreaver-iOS.zip && unzip -oq Hearthreaver-iOS.zip && open Hearthreaver-iOS/Hearthreaver.xcodeproj
```

Elle télécharge l'archive à jour, l'extrait dans `~/Developer/Hearthreaver-iOS`, puis ouvre le projet. Sans Terminal : supprime l'ancien dossier `Hearthreaver-iOS`, télécharge à nouveau [l'archive](https://github.com/garwiglino/conan/raw/main/Hearthreaver-iOS.zip), double-clique dessus, attends la fin de l'extraction, puis ouvre `Hearthreaver.xcodeproj`. Si Xcode n'a pas le droit de lire le dossier Téléchargements (*Réglages Système › Confidentialité et sécurité › Fichiers et dossiers*), autorise-le ou garde le projet dans `~/Developer`.

Avec un compte Apple gratuit, l'app doit être réinstallée depuis Xcode tous les 7 jours. Avec le programme développeur payant, elle reste installée, et TestFlight ou l'App Store deviennent possibles.

## Mises à jour du jeu : automatiques
À chaque lancement, l'app vérifie le fichier `index.html` du dépôt GitHub configuré pour savoir si le jeu a changé. Son adresse historique reste stable afin que les apps déjà installées reçoivent les mises à jour.
- Si le jeu a changé, elle télécharge la nouvelle version, puis la lance. Pendant le téléchargement, « MISE À JOUR DU JEU… » s'affiche quelques secondes.
- Si rien n'a changé, ou s'il n'y a pas de réseau, elle lance directement la dernière version reçue.
- La sauvegarde est conservée.

Pour recevoir une mise à jour, ferme complètement l'app (glisse-la vers le haut dans le sélecteur d'apps), puis rouvre-la. GitHub peut conserver temporairement une réponse en cache ; la durée dépend aussi de la connexion et du téléchargement. Le jeu autonome dépasse maintenant 30 Mo.

Depuis la version **1.5 (build 6)**, si le téléchargement dépasse les cinq secondes d’attente initiale, la partie locale démarre et le transfert continue pendant au plus 120 secondes. Lorsqu’une nouvelle copie valide est enregistrée, le bouton **MISE À JOUR PRÊTE · APPLIQUER** apparaît. Ce bouton enregistre la partie avant de charger la nouvelle copie ; aucune partie en cours n’est rechargée automatiquement. Revenir dans l’app vérifie aussi les mises à jour en silence, avec au moins une minute entre deux vérifications. Hors ligne, une copie incomplète ou une erreur HTTP ne remplace jamais le jeu installé.

**Pour une app déjà installée avec l’ancien mécanisme :** laisse-la ouverte et connectée pour que le téléchargement se termine, puis ferme-la complètement et rouvre-la. Le correctif du téléchargement et du bouton est du code Swift : pour l’obtenir, reconstruis et installe la version 1.5 par-dessus l’app, avec le même Bundle Identifier et la même Team, sans la désinstaller. Les modifications du monde et des personnages restent des mises à jour HTML automatiques.

Xcode n'est nécessaire que pour réinstaller l'app (tous les 7 jours avec un compte gratuit), ou si la partie Swift change.

Le nouveau menu et le nom Hearthreaver dans le jeu arrivent par cette mise à jour après publication. Le nom sous l'icône iOS et l'icône elle-même appartiennent à l'app native : reconstruis-la depuis les sources fournies pour les changer, en conservant le même identifiant pour retrouver ta sauvegarde.

Le projet, la cible, le schéma partagé et le produit s'appellent **Hearthreaver** (version 1.5, build 6). L'icône H/R rouge et or avec son épée est incluse dans `Hearthreaver/Assets.xcassets`. Ouvre le nouveau projet et sélectionne le schéma **Hearthreaver**. Conserve exactement le Bundle Identifier et la Team de ta précédente installation si tu les avais personnalisés ; installe cette version par-dessus, sans désinstaller l'app.

Le verrouillage natif en paysage nécessite lui aussi cette réinstallation depuis Xcode. Une ancienne installation reçoit immédiatement le menu adapté et la protection contre le jeu en portrait via la mise à jour web, mais ses orientations système restent celles de son ancien binaire.

Les vibrations natives sont nouvelles dans la version 1.3 (build 4). Réinstalle cette version depuis Xcode par-dessus l’app existante, avec le même Bundle Identifier et la même Team. Le menu, le suivi des quêtes et les sons MIDI arrivent par la mise à jour automatique ; le relais haptique Swift nécessite cette réinstallation. Le simulateur permet de vérifier la compilation et les menus, mais seul un iPhone compatible permet de sentir les vibrations.

Les notifications de voyage sont nouvelles dans la version 1.4 (build 5). Réinstalle cette version depuis Xcode par-dessus l'app existante, avec le même Bundle Identifier et la même Team. Au premier départ en voyage, iOS demande l'autorisation d'envoyer des notifications. Ensuite, quitter l'app pendant un voyage programme une notification locale à l'heure d'arrivée prévue : « Arrivé à destination », ou « Voyage interrompu » si le transport s'arrête avant (passage menacé ou fermé). Revenir dans l'app avant l'heure annule la notification et le voyage reprend là où il en est. Aucune capacité supplémentaire n'est à activer dans Xcode : les notifications locales n'utilisent pas le service Push. Le rattrapage du voyage et la pause à l'arrivée arrivent aussi par la mise à jour automatique, mais sans cette réinstallation l'ancienne app ne peut pas afficher la notification. Pour tester dans le simulateur, pars en voyage, reviens à l'écran d'accueil et attends la bannière.
