// ── SERVICE WORKER : mode hors ligne de MagicPhone ──
// Ce fichier tourne en arrière-plan. Il garde une copie de tous les fichiers de
// l'app dans le téléphone et les ressort quand il n'y a pas de réseau.

// Le nom du cache contient l'adresse (scope) de l'app : la version stable (/)
// et la version test (/dev/) ont ainsi chacune leur propre cache et ne se
// marchent pas dessus.
const CACHE_PREFIX = 'magicphone::' + self.registration.scope + '::';
const CACHE_NAME = CACHE_PREFIX + 'v1';

// Délai max d'attente du réseau avant de se rabattre sur la copie locale
// (évite qu'un wifi capricieux bloque l'app en pleine performance).
const NETWORK_TIMEOUT_MS = 3000;

// Fichiers de l'app à télécharger dès la première visite.
// Si tu ajoutes une carte/image par défaut dans le dépôt, ajoute-la ici aussi
// (de toute façon, tout fichier chargé une fois en ligne est mis en cache).
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'js/state.js',
  'js/storage.js',
  'js/objects.js',
  'js/wallpaper.js',
  'js/settings.js',
  'js/performance.js',
  'js/interactions.js',
  'js/offline.js',
  'As de pique.PNG',
  'dos rouge.png',
  'dos bleu.PNG',
  'Joker (couleur).PNG',
  'Joker (sans couleur).PNG',
  '2 euros.PNG',
  '5 de trèfle.PNG',
  '7 de carreau.PNG',
  '7 de trèfle.PNG',
  '9 de carreau.PNG',
  'Paquet bleu.PNG'
];

// Télécharge (ou re-télécharge) tous les fichiers de la liste.
// cache:'reload' force à ignorer le cache du navigateur pour avoir la dernière version.
async function downloadAssets() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
}

self.addEventListener('install', event => {
  event.waitUntil(downloadAssets().then(() => self.skipWaiting()));
});

// Au changement de version, supprime les anciens caches de CETTE app seulement.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord (toujours la dernière version en ligne), copie locale en secours.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    const fresh = await fetch(request, { cache: 'no-cache', signal: controller.signal });
    clearTimeout(timer);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    // ignoreSearch : "index.html?debug" retrouve la copie de "index.html"
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const page = await cache.match('index.html', { ignoreSearch: true });
      if (page) return page;
    }
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

// Le bouton « Préparer » de l'app demande ici un nouveau téléchargement complet
// et attend la réponse « ok » ou « error ».
self.addEventListener('message', event => {
  if (event.data !== 'REFRESH' || !event.ports[0]) return;
  const reply = event.ports[0];
  event.waitUntil(
    downloadAssets().then(
      () => reply.postMessage('ok'),
      () => reply.postMessage('error')
    )
  );
});
