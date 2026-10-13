# Conan pour iOS (Xcode)

Une app iOS native en Swift qui contient **le jeu exact** : le fichier `Conan/Game/index.html` est identique à la version web. Le moteur, le rendu, les sons, la musique, les commandes tactiles et la sauvegarde sont les mêmes.

## Ce que l'app apporte en plus du site
- Un vrai plein écran : pas de barre d'état, barre d'accueil discrète, gestes système sur les bords qui demandent un second glissement.
- Le jeu marche hors ligne : la dernière version reçue est gardée sur l'iPhone.
- Le jeu se met à jour tout seul (voir plus bas).
- La sauvegarde est copiée dans un fichier de l'app, en plus du stockage web.
- Le jeu enregistre la partie quand l'app passe en arrière-plan.
- Si iOS libère la mémoire, le jeu se recharge tout seul.

## Installer sur ton iPhone
1. Sur un Mac, ouvre `Conan.xcodeproj` avec Xcode.
2. Clique sur le projet **Conan**, puis la cible **Conan**, puis l'onglet **Signing & Capabilities**. Dans **Team**, choisis ton compte Apple. Si on te le demande, ajoute-le dans *Xcode › Settings › Accounts*.
3. Si Xcode dit que l'identifiant `com.garwiglino.conan` est déjà pris, change-le (par exemple `com.tonnom.conan`).
4. Branche l'iPhone, choisis-le en haut de la fenêtre, puis clique sur ▶︎ (Run).
5. Au premier lancement, sur l'iPhone :
   - active *Réglages › Confidentialité et sécurité › Mode développeur* ;
   - fais confiance au développeur dans *Réglages › Général › VPN et gestion de l'appareil*.

Avec un compte Apple gratuit, l'app doit être réinstallée depuis Xcode tous les 7 jours. Avec le programme développeur payant, elle reste installée, et TestFlight ou l'App Store deviennent possibles.

## Mises à jour du jeu : automatiques
À chaque lancement, l'app vérifie sur GitHub (`garwiglino/conan`, fichier `index.html`) si le jeu a changé.
- Si le jeu a changé, elle télécharge la nouvelle version, puis la lance. Pendant le téléchargement, « MISE À JOUR DU JEU… » s'affiche quelques secondes.
- Si rien n'a changé, ou s'il n'y a pas de réseau, elle lance directement la dernière version reçue.
- La sauvegarde est conservée.

Pour recevoir une mise à jour, ferme complètement l'app (glisse-la vers le haut dans le sélecteur d'apps), puis rouvre-la. Une mise à jour poussée sur GitHub est disponible au bout de 5 minutes au plus.

Xcode n'est nécessaire que pour réinstaller l'app (tous les 7 jours avec un compte gratuit), ou si la partie Swift change.
