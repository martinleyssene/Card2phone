# MagicPhone — Résumé de reprise du projet

Colle ce document dans une nouvelle conversation avec Claude si celle-ci bug.

## Le projet
PWA (`index.html`, fichier unique) qui simule un objet apparaissant "derrière" l'écran du téléphone, par-dessus le vrai fond d'écran de l'utilisateur, pour un tour de magie.

## Accès technique
- Fichier : `C:\Users\Martin\Desktop\Card2phone\index.html` (+ images des objets)
- Claude Desktop avec connecteur MCP filesystem activé sur ce dossier → lecture/écriture directe du vrai fichier, mais **pas d'exécution shell** → toujours rappeler à Martin de faire `git add . && git commit -m "..." && git push` après chaque changement
- Déploiement : GitHub Pages. Appareil de test réel : **iPhone 11**
- Règle : jamais de réécriture complète de fichier, seulement des modifications ciblées
- Lors des prochaines demandes de résumé, ne pas créer de nouveau fichier "résumé", écrire le résumé dans le chat pour qu'il soit copié/collé 

## Résolu récemment
- **Taille des objets** : `SIZE_CALIBRATION = 1.66` (facteur global) + `realSize` recalculé individuellement par objet (voir tableau dans le code, objet `state.objects`)
- **Placement du fond d'écran** : le fond ne bouge plus jamais (aligné pile sur la réalité) ; un bandeau noir séparé (`#status-mask`) cache la fausse barre de statut de la photo, avec sa propre hauteur réglable (presets par téléphone + détection auto `env(safe-area-inset-top)` + curseur de réglage fin)
- **Parallaxe** : les bords sont maintenant atteints correctement (mapping géométrique inclinaison→position réelle), plus de téléportation au relâchement d'un drag (glissement progressif), et la position "neutre" se calibre automatiquement sur l'angle du téléphone au moment où la carte apparaît (fini le bug d'angle neutre fixe à 45°)
- La carte est bloquée contre le bandeau noir du haut (ne passe plus dessous)
- Mode debug disponible : ajouter `?debug` à l'URL pour voir gamma/beta/positions en direct à l'écran

**À vérifier par Martin** : le comportement du parallaxe haut/bas après la dernière correction (calibration automatique de l'angle neutre) — pas encore testé/confirmé.

## Backlog restant

**Objets** : nommer/renommer les objets, retournement au tap, sélection secrète au verso, rotation à deux doigts, taille réelle auto à l'import

**Apparition / effets** : 3 modes (fantôme / progressif auto / progressif contrôlé par geste-gyroscope ou souffle-micro), animations d'entrée personnalisables (fondu/glissement/zoom/rotation), effet de brillance, ombre portée

**Interface** : transition fluide style iOS entre fonds d'écran (swipe actuel = changement brut), plusieurs déclencheurs simultanés

**Son & Haptique** : son personnalisable, retour haptique personnalisé (court/long/double)

**Performance** : mode "prêt", minuterie discrète, historique des tours

**Sécurité & Comptes** : compte admin + mot de passe, réglages verrouillés pour autres utilisateurs, mode démo

**Favoris & Routine** : système de favoris, mode routine (nommer/rechercher/partager)

**Organisation** : catégories d'objets

**Discrétion** : icône d'app personnalisable, fausse fermeture, catégories cachées selon profil

**Aide** : guide des fonctionnalités, moyen de contact

**Compatibilité** : test/adaptation Android, audit sécurité de l'import d'images

**Divers** : le bouton "Réinitialiser les paramètres" (debug) est encore présent, à retirer à terme
