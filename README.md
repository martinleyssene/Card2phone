# Card2phone
- Description:
    App de magie. Apparition de cartes ou autres objets dans l'écran. Possibilité d'importer une image. Magie numérique. Inspirée des apps amazing magic coin et Card2phone. 
- Règles à suivre:
    Ne jamais réécrire entièrement le fichier, faire des résumés complets et détaillés de la situation à chaque avancée majeure. NE PAS ÉCRIRE DE NOUVEAU FICHIER À CHAQUE FOIS, L'ÉCRIRE DANS LE CHAT POUR QUE JE PUISSE LE COPIER/COLLER
Regarder le résumé MagicPhone_resume_projet_md pour plus d'infos.

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
