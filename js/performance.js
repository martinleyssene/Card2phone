// ── LANCEMENT ──
async function launch() {
  if (!state.selectedObject) { alert('Sélectionne un objet !'); return; }

  // Mémorise qu'on est en performance : si le téléphone s'éteint/se
  // recharge, on relance directement sur cette page au réveil.
  try { localStorage.setItem('mp_inPerformance', '1'); } catch(e) {}

  document.getElementById('selection-page').style.display = 'none';
  const perf = document.getElementById('performance-page');
  perf.style.display = 'block';

  // Fond d'écran
  const wpIndex = state.wallpapers.findIndex(w => w !== null);
  if (wpIndex !== -1) {
    document.getElementById('wallpaper').style.backgroundImage = `url(${state.wallpapers[wpIndex]})`;
    state.currentWallpaper = wpIndex;
  }
  applyWallpaperPosition();
  // Sur certains iPhone, env(safe-area-inset-top) n'est pas encore résolu au
  // tout premier rendu : on réapplique une fois de plus après un court délai.
  setTimeout(applyWallpaperPosition, 150);

  // Objet
  const size = document.getElementById('size-slider').value;
  const img = document.getElementById('object-img');
  img.src = state.selectedObject.src;
  const freshObj = state.objects.find(o => o.id === state.selectedObject.id);
  const realSize = freshObj?.realSize ?? state.selectedObject?.realSize;
  const baseWidth = realSize ? realSize : 60;
  // baseScale = le scale qui correspond à 100% du curseur pour cet objet
  // On stocke le scale de base dans currentScale pour que applyTransform l'utilise
  currentScale = (parseInt(size) / 100 * baseWidth * SIZE_CALIBRATION) / 100;
  img.style.width = '60vmin';
  img.style.maxHeight = 'none';
  img.style.transformOrigin = 'center center';

  // Position initiale centrée
  currentX = window.innerWidth / 2;
  currentY = window.innerHeight / 2;
  dragOffsetX = 0;
  dragOffsetY = 0;
  img.style.left = currentX + 'px';
  img.style.top = currentY + 'px';
  img.style.transform = `translate(-50%, -50%) scale(${currentScale})`;


  // Wake lock
  if (state.settings.wakelock && navigator.wakeLock) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
  }

  setupDragAndZoom();
  setupWallpaperSwipe();
  setupThreeFingerSwipe();

  if (state.sensorPermission) {
    setupPerformanceTriggers();
    if (state.settings.parallax) setupParallax();
  }

  document.addEventListener('visibilitychange', onVisibilityChange);

  if (DEBUG_MODE) {
    const dbg = document.getElementById('debug-overlay');
    dbg.style.display = 'block';
  }
}

function requestSensorPermissions() {
  const motionPermission = typeof DeviceMotionEvent?.requestPermission === 'function'
    ? DeviceMotionEvent.requestPermission()
    : Promise.resolve('granted');

  const orientationPermission = typeof DeviceOrientationEvent?.requestPermission === 'function'
    ? DeviceOrientationEvent.requestPermission()
    : Promise.resolve('granted');

  return Promise.all([motionPermission, orientationPermission]).then(([motion, orientation]) => {
    if (motion === 'granted' || orientation === 'granted') {
      state.sensorPermission = true;
      saveToStorage();
    }
    syncSensorsToggleUI();
  }).catch(() => {
    // La demande a échoué (souvent parce qu'elle est relancée sans geste
    // utilisateur, ou parce que la permission a été révoquée côté iOS) :
    // sans ce filet, le toggle restait affiché comme actif indéfiniment,
    // même quand les capteurs ne répondaient plus vraiment.
    state.sensorPermission = false;
    saveToStorage();
    syncSensorsToggleUI();
  });
}


// ── AFFICHAGE OBJET ──
function showObject() {
  if (state.objectVisible) return;
  state.objectVisible = true;
  // Calibration : l'inclinaison du téléphone à CET instant devient le nouveau
  // «centre» du parallaxe, quelle que soit la façon dont tu tiens le téléphone.
  baselineGamma = lastGamma;
  baselineBeta = lastBeta;
  dragOffsetX = 0;
  dragOffsetY = 0;
  parallaxSmooth.x = 0;
  parallaxSmooth.y = 0;
  const speed = document.getElementById('speed-slider').value;
  const display = document.getElementById('object-display');
  display.style.transition = `opacity ${speed}ms ease`;
  display.classList.add('visible');
  if (state.settings.vibration && navigator.vibrate) navigator.vibrate(50);
}

function hideObject(direction) {
  if (!state.objectVisible) return;
  state.objectVisible = false;
  const img = document.getElementById('object-img');
  const display = document.getElementById('object-display');
  const speed = parseInt(document.getElementById('exit-speed-slider').value);

  let tx = 0, ty = 0;
  const dist = Math.max(window.innerWidth, window.innerHeight);
  // direction peut combiner un axe X et un axe Y (ex: {x:'right', y:'up'})
  // pour que la carte puisse sortir en diagonale, par un coin de l'écran,
  // au lieu d'être forcée à sortir bien alignée sur un seul bord.
  const dx = direction && direction.x;
  const dy = direction && direction.y;

  if (dx === 'right') tx = dist;
  else if (dx === 'left') tx = -dist;
  if (dy === 'down') ty = dist;
  else if (dy === 'up') ty = -dist;

  img.style.transition = `transform ${speed}ms ease-in`;
  img.style.transition = `transform ${speed}ms ease-in`;
  img.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${currentScale})`;

  const baseScale = currentScale; // garde le scale courant pour la réapparition
  setTimeout(() => {
    display.style.transition = 'none';
    display.style.opacity = '0';
    display.classList.remove('visible');
    img.style.transition = 'none';
    img.style.visibility = 'hidden';
    currentX = window.innerWidth / 2;
    currentY = window.innerHeight / 2;
    dragOffsetX = 0;
    dragOffsetY = 0;
    img.style.left = currentX + 'px';
    img.style.top = currentY + 'px';
    img.style.transform = `translate(-50%, -50%) scale(${baseScale})`;
    // currentScale reste inchangé pour que la prochaine apparition garde la même taille
    setTimeout(() => {
      img.style.visibility = 'visible';
      display.style.opacity = '';
      display.style.transition = '';
    }, 100);
  }, speed);
}

function checkIfOutOfBounds() {
  if (!state.objectVisible) return;
  const img = document.getElementById('object-img');
  const rect = img.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const visibleX = Math.min(rect.right, w) - Math.max(rect.left, 0);
  const visibleY = Math.min(rect.bottom, h) - Math.max(rect.top, 0);
  // Il faut qu'une part réglable de la carte soit sortie de l'écran (par
  // défaut ~80%, donc ~20% encore visible) pour déclencher la disparition.
  const VISIBLE_RATIO_THRESHOLD = 1 - ((state.settings.exitThreshold ?? 80) / 100);
  const visibleRatioX = rect.width > 0 ? visibleX / rect.width : 0;
  const visibleRatioY = rect.height > 0 ? visibleY / rect.height : 0;
  const outX = visibleRatioX < VISIBLE_RATIO_THRESHOLD;
  const outY = visibleRatioY < VISIBLE_RATIO_THRESHOLD;

  // Si les deux axes sont dépassés en même temps (carte tirée vers un coin),
  // on sort en diagonale plutôt que de forcer un alignement sur un seul bord.
  if (outX || outY) {
    hideObject({
      x: outX ? (currentX > w / 2 ? 'right' : 'left') : null,
      y: outY ? (currentY > h / 2 ? 'down' : 'up') : null
    });
  }
}

// ── DÉCLENCHEURS PERFORMANCE ──
function setupPerformanceTriggers() {
  if (state.trigger === 'shake') {
    window.addEventListener('devicemotion', onShake);
  } else if (state.trigger.startsWith('tap-')) {
    const zone = document.getElementById(state.trigger);
    if (zone) {
      zone.style.display = 'block';
      zone.addEventListener('pointerdown', showObject);
    }
  }
}

function onShake(e) {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;
  const total = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
  const now = Date.now();
  if (total > 35 && now - lastShake > 1500) {
    lastShake = now;
    showObject();
  }
}

// ── EXTINCTION ÉCRAN ──
async function onVisibilityChange() {
  if (document.hidden) {
    // Le téléphone s'éteint ou l'app passe en arrière-plan : on NE quitte
    // plus la performance, pour que l'app soit encore sur le faux fond
    // d'écran au réveil du téléphone. On horodate ce moment pour distinguer,
    // au prochain démarrage, un simple réveil d'écran (récent) d'une vraie
    // réouverture de l'app après fermeture (ancien/absent).
    try { localStorage.setItem('mp_lastActive', Date.now().toString()); } catch(e) {}
    return;
  }
  // Le système relâche automatiquement le wake lock à l'extinction ; on le
  // redemande au réveil si on est toujours sur la page de performance.
  if (state.settings.wakelock && navigator.wakeLock &&
      document.getElementById('performance-page').style.display === 'block') {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch(e) {}
  }
}

// ── SORTIE ──
function exitPerformance() {
  try { localStorage.removeItem('mp_inPerformance'); } catch(e) {}
  hideObject();
  document.getElementById('performance-page').style.display = 'none';
  document.getElementById('selection-page').style.display = 'flex';
  window.removeEventListener('devicemotion', onShake);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
  currentScale = 1;
  state.objectVisible = false;
}
