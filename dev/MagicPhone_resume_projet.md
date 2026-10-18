# MagicPhone — Résumé de reprise du projet
*(mis à jour le 2026-10-18)*

Colle ce document dans une nouvelle conversation avec Claude si celle-ci bug.

## Le projet
PWA qui simule un objet (carte, pièce...) apparaissant "derrière" l'écran du téléphone, par-dessus le vrai fond d'écran de l'utilisateur, pour un tour de magie.

## Accès technique
- Dossier : `C:\Users\Martin\Desktop\Card2phone\` — voir README.md pour la structure des fichiers
- Claude Desktop avec connecteur MCP filesystem activé sur ce dossier → lecture/écriture directe des vrais fichiers, mais **pas d'exécution shell** → toujours rappeler à Martin de faire `git add .` / `git commit -m "..."` / `git push` (une commande à la fois, `&&` ne marche pas en PowerShell) après chaque changement
- Appareil de test réel : **iPhone 11**
- Règle : jamais de réécriture complète d'un fichier de code — uniquement des modifications ciblées
- Pour les demandes de résumé : l'écrire dans le chat pour copier/coller, sauf si Martin demande explicitement de mettre à jour ce fichier

## Déploiement (branche stable + branche test)
- Deux branches Git : `main` (stable) et `dev` (test), au lieu de dupliquer les fichiers de l'app
- `.github/workflows/deploy.yml` déploie automatiquement chaque branche sur sa propre URL à chaque push, sans jamais avoir à retoucher les réglages GitHub Pages :
    - `main` → `martinleyssene.github.io/Card2phone/` (stable)
    - `dev` → `martinleyssene.github.io/Card2phone/dev/` (test, mode `?debug` activé automatiquement)
- Réglage GitHub Pages à laisser en place une fois pour toutes : Settings → Pages → Branch = `gh-pages` / `(root)`
- Pour promouvoir dev en stable : `git checkout main`, `git merge dev`, `git push origin main`
- Pour repartir propre sur dev après un essai raté : `git checkout dev`, `git reset --hard main`

## Résolu récemment (depuis la dernière grosse session)
- **Parallaxe** :
    - Zone de déplacement sur tout l'écran quelle que soit la taille de l'objet ; vitesse modulée par la taille de l'objet (plus petit = plus lent), accélération naturelle avec l'inclinaison via le lerp exponentiel
    - Seuil de sortie réglable (curseur 50–95 %, défaut 80 %) et vitesse de sortie séparée avec page de test dédiée
    - Sortie en diagonale (par les coins) possible
    - À-coups aux changements de direction corrigés (double lissage de la cible, sans ressort/oscillation)
    - Bug corrigé : le drag manuel ne recalibre plus l'angle "neutre" du téléphone au relâchement (ça faussait le parallaxe si le téléphone était penché au moment de lâcher la carte) — le neutre n'est calibré qu'une seule fois, à l'apparition de l'objet
    - Bug corrigé : le décalage de position laissé par un drag manuel (`dragOffsetX/Y`) ne reste plus un biais permanent — il s'estompe progressivement, ce qui évite qu'un bord de l'écran devienne inatteignable après un drag suivi d'un zoom
- **Sécurité** : faille XSS stockée corrigée dans `objects.js` (`renderObjects()` construisait du HTML par concaténation du nom de fichier importé ; utilise maintenant `img.alt` via le DOM, qui échappe automatiquement)
- **Interface** :
    - "Modèle de téléphone" et "Réglage fin position" regroupés en haut du bloc "Réglages", avec un texte de diagnostic en direct ("Bandeau appliqué : Xpx")
    - Toggle "Capteurs" qui se resynchronise correctement avec la permission réellement accordée (ne restait plus affiché "actif" à tort)
    - Reprise automatique sur le faux fond d'écran après extinction/rallumage de l'écran (drapeau `mp_inPerformance`)
- **Détection modèle de téléphone** : fonctionne techniquement (`env(safe-area-inset-top)`) mais renvoie une valeur différente (48px) de celle calibrée manuellement pour l'iPhone 11 (40px) — pas un bug, juste deux définitions différentes de la hauteur de barre de statut. Recommandation : garder "iPhone 11" sélectionné manuellement plutôt que "Auto" sur cet appareil.

## À vérifier / tester par Martin
- Les derniers correctifs du parallaxe (angle neutre + décalage qui s'estompe) : confirmés corrigés par Martin le 2026-10-13, considérer comme résolu sauf nouveau souci signalé

## Backlog

**Vitesse & parallaxe** : la vitesse devrait dépendre davantage de l'intensité de l'inclinaison (plus incliné = plus vite) — actuellement peu perceptible sur les petits objets, à retravailler

**Objets** : nommer/renommer les objets, retournement au tap, sélection secrète du verso, rotation à deux doigts, taille réelle auto à l'import

**Apparition / effets** : 3 modes (fantôme / progressif auto / progressif contrôlé par geste-gyroscope ou souffle-micro), animations d'entrée personnalisables (fondu/glissement/zoom/rotation), effet de brillance, ombre portée

**Interface** : transition fluide style iOS entre fonds d'écran (swipe actuel = changement brut), plusieurs déclencheurs simultanés, bouton "utiliser ma dernière capture d'écran" pour le fond d'écran (pas d'API pour auto-détecter une capture d'écran côté web, donc au mieux : sélecteur Photos pré-trié + instructions claires)

**Son & Haptique** : son personnalisable, retour haptique personnalisé (court/long/double)

**Performance** : mode "prêt", minuterie discrète, historique des tours

**Sécurité & Comptes** : compte admin + mot de passe, réglages verrouillés pour autres utilisateurs, mode démo

**Favoris & Routine** : système de favoris, mode routine (nommer/rechercher/partager)

**Organisation** : catégories d'objets

**Discrétion** : icône d'app personnalisable, fausse fermeture, catégories cachées selon profil

**Aide** : guide des fonctionnalités, moyen de contact

**Compatibilité** : test/adaptation Android

**Divers** : le bouton "Réinitialiser les paramètres" (debug) est encore présent, probablement retiré à terme de la version non admin, mais ne pas supprimer le code, il sera peut-être réintégré, potentiellement sous la forme d'un bouton de rechargement de la page ; `script.js.bak` (ancien monolithe) toujours conservé en backup
