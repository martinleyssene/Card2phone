# Card2phone
- Description:
    App de magie. Apparition de cartes ou autres objets dans l'écran. Possibilité d'importer une image. Magie numérique. Inspirée des apps amazing magic coin et Card2phone. 
- Règles à suivre:
    Ne jamais réécrire entièrement un fichier de code (index.html/style.css/js/*) : uniquement des modifications ciblées. Faire des résumés complets et détaillés de la situation à chaque avancée majeure. NE PAS ÉCRIRE DE NOUVEAU FICHIER DE RÉSUMÉ À CHAQUE FOIS : écrire le résumé dans le chat pour copier/coller, sauf demande explicite de mise à jour du fichier lui-même.
Regarder le résumé MagicPhone_resume_projet.md pour plus d'infos (mis à jour 2026-10-18).

- Structure du projet (mise à jour 2026-09-12) :
    - `index.html` : structure de la page
    - `style.css` : tout le CSS
    - `js/` : le JS, découpé par fonctionnalité (scripts classiques, pas de modules ES6, car le HTML utilise des `onclick="..."` qui ont besoin de fonctions globales)
        - `state.js` : constantes, état global (`state`), variables globales, `window.onload`
        - `storage.js` : lecture/écriture dans `localStorage`
        - `objects.js` : gestion des objets (sélection, taille, import)
        - `wallpaper.js` : fonds d'écran et modèle de téléphone (barre de statut)
        - `settings.js` : réglages (toggles) et déclencheurs de performance
        - `performance.js` : lancement, affichage/masquage de l'objet, sortie
        - `interactions.js` : drag & drop, pinch zoom, parallaxe, swipes
    - `script.js.bak` : ancien fichier JS monolithique, gardé en backup (peut être supprimé une fois la nouvelle structure validée sur le téléphone)
    - `.github/workflows/deploy.yml` : déploiement automatique GitHub Actions (voir résumé pour le détail des branches)

- Déploiement (mis à jour 2026-10-18) :
    Deux branches, chacune déployée automatiquement sur sa propre URL via GitHub Actions (pas besoin de toucher aux réglages GitHub Pages au quotidien) :
    - `main` → `martinleyssene.github.io/Card2phone/` (stable)
    - `dev` → `martinleyssene.github.io/Card2phone/dev/` (test — mode debug activé automatiquement)
