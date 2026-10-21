// ── MODE HORS LIGNE ──
// Enregistre le service worker (sw.js) et affiche l'état dans les Réglages.
// Automatique au lancement + bouton « Préparer » pour forcer et vérifier.

function setOfflineStatus(text, ok) {
  const el = document.getElementById('offline-status');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? '#4caf50' : '#e0a020';
}

// Vrai si une copie de l'app existe dans le cache de CETTE version (stable ou /dev/).
async function isOfflineReady() {
  if (!('caches' in window)) return false;
  const prefix = 'magicphone::' + new URL('./', location.href).href + '::';
  const keys = await caches.keys();
  for (const key of keys) {
    if (!key.startsWith(prefix)) continue;
    const cache = await caches.open(key);
    if (await cache.match('index.html', { ignoreSearch: true })) return true;
  }
  return false;
}

// Demande au service worker de re-télécharger tous les fichiers (réponse ok/error).
function refreshOfflineCache(worker) {
  return new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => reject(new Error('timeout')), 30000);
    channel.port1.onmessage = (e) => {
      clearTimeout(timer);
      e.data === 'ok' ? resolve() : reject(new Error('refresh failed'));
    };
    worker.postMessage('REFRESH', [channel.port2]);
  });
}

// forceRefresh = false : lancement automatique (silencieux)
// forceRefresh = true  : clic sur le bouton (re-télécharge tout)
async function setupOffline(forceRefresh) {
  if (!('serviceWorker' in navigator)) {
    setOfflineStatus('Non supporté par ce navigateur', false);
    return;
  }
  try {
    setOfflineStatus('Téléchargement en cours…', false);
    const reg = await navigator.serviceWorker.register('sw.js');
    await navigator.serviceWorker.ready;
    if (forceRefresh) {
      reg.update();
      const worker = reg.active || navigator.serviceWorker.controller;
      if (worker) await refreshOfflineCache(worker);
    }
    // Demande au navigateur de ne pas effacer les données de l'app (objets importés, etc.)
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
    if (await isOfflineReady()) {
      setOfflineStatus('✓ Prêt hors ligne', true);
    } else {
      setOfflineStatus('Pas encore prêt : reste en ligne puis réessaie', false);
    }
  } catch (e) {
    setOfflineStatus('Erreur : connecte-toi à internet puis réessaie', false);
  }
}

function prepareOffline() {
  setupOffline(true);
}

// addEventListener (et non window.onload =) pour ne pas écraser le window.onload de state.js
window.addEventListener('load', () => setupOffline(false));
