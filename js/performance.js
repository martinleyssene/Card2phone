// ── LANCEMENT ──
async function launch() {
  if (!state.selectedObject) { alert('Sélectionne un objet !'); return; }

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
  const speed = parseInt(document.getElementById('speed-slider').value);

  let tx = 0, ty = 0;
  const dist = Math.max(window.innerWidth, window.innerHeight);

  if (direction === 'right') tx = dist;
  else if (direction === 'left') tx = -dist;
  else if (direction === 'down') ty = dist;
  else if (direction === 'up') ty = -dist;

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
  const halfW = rect.width / 2;
  const halfH = rect.height / 2;

  if (visibleX < halfW) {
    hideObject(currentX > w / 2 ? 'right' : 'left');
  } else if (visibleY < halfH) {
    hideObject(currentY > h / 2 ? 'down' : 'up');
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
function onVisibilityChange() {
  if (document.hidden) exitPerformance();
}

// ── SORTIE ──
function exitPerformance() {
  hideObject();
  document.getElementById('performance-page').style.display = 'none';
  document.getElementById('selection-page').style.display = 'flex';
  window.removeEventListener('devicemotion', onShake);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (wakeLock) { wakeLock.release(); wakeLock = null; }
  currentScale = 1;
  state.objectVisible = false;
}
