// ── DRAG & DROP + PINCH ZOOM ──
function setupDragAndZoom() {
  const img = document.getElementById('object-img');
  let dragging = false;
  let dragStartX, dragStartY, imgStartX, imgStartY;
  let pinchStartDist = 0;
  let pinchStartScale = 1;

  function onDragEnd() {
    dragging = false;
    isDragging = false;
    // La carte reste où elle vient d'être lâchée : le tilt actuel devient le
    // nouveau neutre, et l'écart au centre de l'écran est mémorisé pour que
    // le parallaxe reparte de là au lieu de retirer la carte vers le centre.
    baselineGamma = lastGamma;
    baselineBeta = lastBeta;
    dragOffsetX = currentX - window.innerWidth / 2;
    dragOffsetY = currentY - window.innerHeight / 2;
    parallaxSmooth.x = 0;
    parallaxSmooth.y = 0;
    checkIfOutOfBounds();
  }

  // Touch
  img.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      dragging = true;
      isDragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      // On prend la position RÉELLE de l'image au moment du touch (pas currentX/Y qui peut être décalé par le parallaxe)
      const rect = img.getBoundingClientRect();
      imgStartX = rect.left + rect.width / 2;
      imgStartY = rect.top + rect.height / 2;
      currentX = imgStartX;
      currentY = imgStartY;
    } else if (e.touches.length === 2) {
      dragging = false;
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartScale = currentScale;
    }
    e.stopPropagation();
    e.preventDefault();
  }, { passive: false });

  img.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && dragging) {
      currentX = imgStartX + (e.touches[0].clientX - dragStartX);
      currentY = imgStartY + (e.touches[0].clientY - dragStartY);
      applyTransform();
    } else if (e.touches.length === 2 && !state.settings.zoomLock) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      // Le scale minimum est 0.1 (10% de la taille de base), maximum 4x la taille de base
      currentScale = Math.min(Math.max(pinchStartScale * (dist / pinchStartDist), 0.1), pinchStartScale * 4);
      applyTransform();
    }
    e.stopPropagation();
  }, { passive: true });

  img.addEventListener('touchend', () => {
    onDragEnd();
  });

  // Mouse (pour test PC)
  img.addEventListener('mousedown', e => {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    imgStartX = currentX;
    imgStartY = currentY;
    e.preventDefault();
    e.stopPropagation();
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    currentX = imgStartX + (e.clientX - dragStartX);
    currentY = imgStartY + (e.clientY - dragStartY);
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    onDragEnd();
  });
}

function applyTransform() {
  const img = document.getElementById('object-img');
  img.style.transition = 'none';
  img.style.left = currentX + 'px';
  img.style.top = currentY + 'px';
  img.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
}

// ── PARALLAXE ──
function getObjectHalfSize() {
  // Utilise getBoundingClientRect qui tient compte du transform CSS
  const img = document.getElementById('object-img');
  const rect = img.getBoundingClientRect();
  return { halfW: rect.width / 2, halfH: rect.height / 2 };
}

function isParallaxAllowed() {
  const { halfW, halfH } = getObjectHalfSize();
  return halfW < window.innerWidth / 2 && halfH < window.innerHeight / 2;
}

function setupParallax() {
  let animFrame = null;
  const MAX_TILT_X = 14; // degrés d'inclinaison gauche-droite (depuis ta position de départ) pour atteindre le bord
  const MAX_TILT_Y = 11; // degrés d'inclinaison avant-arrière (depuis ta position de départ) pour atteindre le bord

  function animate() {
    animFrame = requestAnimationFrame(animate);
    if (!state.objectVisible || isDragging) return;

    const { halfW, halfH } = getObjectHalfSize();
    const minX = halfW, maxX = window.innerWidth - halfW;
    const statusH = computeStatusBarHeight();
    const minY = halfH + statusH, maxY = window.innerHeight - halfH;

    let targetX, targetY;
    if (isParallaxAllowed() && state.settings.parallax) {
      // Le tilt à fond (norm = ±1) correspond exactement aux bords réels de l'objet,
      // en partant du décalage laissé par un éventuel drag manuel (dragOffsetX/Y)
      targetX = window.innerWidth / 2 + dragOffsetX + parallaxSmooth.x * ((maxX - minX) / 2);
      targetY = window.innerHeight / 2 + dragOffsetY + parallaxSmooth.y * ((maxY - minY) / 2);
    } else {
      targetX = window.innerWidth / 2 + dragOffsetX;
      targetY = window.innerHeight / 2 + dragOffsetY;
    }
    // Sécurité : jamais en dehors des bords réels de l'objet/écran
    targetX = Math.min(Math.max(targetX, minX), maxX);
    targetY = Math.min(Math.max(targetY, minY), maxY);

    // On glisse doucement vers la position cible (jamais de téléportation,
    // que ce soit pour le tilt ou pour un retour après un drag hors-cadre)
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;

    const img = document.getElementById('object-img');
    img.style.transition = 'none';
    img.style.left = currentX + 'px';
    img.style.top = currentY + 'px';
    img.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
  }

  window.addEventListener('deviceorientation', e => {
    const gammaRaw = e.gamma || 0;
    const betaRaw = e.beta || 0;
    lastGamma = gammaRaw;
    lastBeta = betaRaw;
    if (!state.objectVisible || isDragging) return;
    const normX = Math.min(Math.max((gammaRaw - baselineGamma) / MAX_TILT_X, -1), 1);
    const normY = Math.min(Math.max((betaRaw - baselineBeta) / MAX_TILT_Y, -1), 1);
    parallaxSmooth.x += (normX - parallaxSmooth.x) * 0.15;
    parallaxSmooth.y += (normY - parallaxSmooth.y) * 0.15;

    if (DEBUG_MODE) {
      const { halfW, halfH } = getObjectHalfSize();
      const minX = halfW, maxX = window.innerWidth - halfW;
      const minY = halfH, maxY = window.innerHeight - halfH;
      const dbg = document.getElementById('debug-overlay');
      if (dbg) dbg.textContent =
        `gamma: ${gammaRaw.toFixed(1)}  beta: ${betaRaw.toFixed(1)}\n` +
        `normX: ${normX.toFixed(2)}  normY: ${normY.toFixed(2)}\n` +
        `smoothNormX: ${parallaxSmooth.x.toFixed(2)}  smoothNormY: ${parallaxSmooth.y.toFixed(2)}\n` +
        `halfW: ${halfW.toFixed(0)}  halfH: ${halfH.toFixed(0)}\n` +
        `screen: ${window.innerWidth}x${window.innerHeight}\n` +
        `minX-maxX: ${minX.toFixed(0)}-${maxX.toFixed(0)}\n` +
        `minY-maxY: ${minY.toFixed(0)}-${maxY.toFixed(0)}\n` +
        `currentX: ${currentX.toFixed(0)}  currentY: ${currentY.toFixed(0)}\n` +
        `dragOffsetX: ${dragOffsetX.toFixed(0)}  dragOffsetY: ${dragOffsetY.toFixed(0)}\n` +
        `parallaxAllowed: ${isParallaxAllowed()}  toggle: ${state.settings.parallax}`;
    }
  });

  animFrame = requestAnimationFrame(animate);
}

// ── SWIPE FOND D'ÉCRAN (1 doigt) ──
function setupWallpaperSwipe() {
  const perf = document.getElementById('performance-page');
  let startX = 0, startY = 0, fingers = 0;

  perf.addEventListener('touchstart', e => {
    fingers = e.touches.length;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  perf.addEventListener('touchend', e => {
    if (fingers !== 1 || state.objectVisible) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      const wps = state.wallpapers.filter(w => w !== null);
      if (wps.length > 1) {
        state.currentWallpaper = (state.currentWallpaper + (dx < 0 ? 1 : -1) + wps.length) % wps.length;
        document.getElementById('wallpaper').style.backgroundImage = `url(${wps[state.currentWallpaper]})`;
      }
    }
    fingers = 0;
  }, { passive: true });
}

// ── SWIPE 3 DOIGTS VERS LE BAS ──
function setupThreeFingerSwipe() {
  const perf = document.getElementById('performance-page');
  let startY = 0, fingers = 0;

  perf.addEventListener('touchstart', e => {
    fingers = e.touches.length;
    if (fingers === 3) startY = e.touches[0].clientY;
  }, { passive: true });

  perf.addEventListener('touchend', e => {
    if (fingers === 3) {
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 80) exitPerformance();
    }
    fingers = 0;
  }, { passive: true });
}
