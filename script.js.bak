// Facteur de calibration global : à 100% sur le curseur, le dos bleu (realSize:100)
// doit correspondre à la taille RÉELLE de la carte. Ajuste cette valeur si besoin.
const SIZE_CALIBRATION = 1.66;

const phonePresets = [
  { id: 'auto', name: 'Détection automatique (recommandé)', height: null },
  { id: 'iphone11', name: 'iPhone 11', height: 40 },
  { id: 'se', name: 'iPhone SE / 6-8 (sans encoche)', height: 20 },
  { id: 'notch', name: 'iPhone X à 13 (encoche)', height: 44 },
  { id: 'dynamic', name: 'iPhone 14 Pro et + (Dynamic Island)', height: 54 },
  { id: 'android-notch', name: 'Android avec encoche / poinçon', height: 32 },
  { id: 'android-classic', name: 'Android barre de statut classique', height: 24 },
  { id: 'other', name: 'Autre / je ne sais pas', height: 40 }
];

const state = {
  objects: [
    { id: 'default_1', name: 'As de pique', src: 'As de pique.PNG', realSize: 97 },
    { id: 'default_2', name: 'Dos rouge', src: 'dos rouge.png', realSize: 111 },
    { id: 'default_3', name: 'Dos bleu', src: 'dos bleu.PNG', realSize: 100 },
    { id: 'default_4', name: 'Joker couleur', src: 'Joker (couleur).PNG', realSize: 120 },
    { id: 'default_5', name: 'Joker N&B', src: 'Joker (sans couleur).PNG', realSize: 124 },
    { id: 'default_6', name: '2 euros', src: '2 euros.PNG', realSize: 42 },
    { id: 'default_7', name: '5 de trèfle', src: '5 de trèfle.PNG', realSize: 104 },
    { id: 'default_8', name: '7 de carreau', src: '7 de carreau.PNG', realSize: 128 },
    { id: 'default_9', name: '7 de trèfle', src: '7 de trèfle.PNG', realSize: 105 },
    { id: 'default_10', name: '9 de carreau', src: '9 de carreau.PNG', realSize: 130 },
    { id: 'default_11', name: 'Paquet bleu', src: 'Paquet bleu.PNG', realSize: 158 },
  ],
  selectedObject: null,
  trigger: 'shake',
  wallpapers: [null, null, null],
  currentWallpaper: 0,
  phoneModel: 'auto',
  wallpaperFineTune: 0,
  objectVisible: false,
  sensorPermission: false,
  settings: {
    parallax: true, vibration: true, sound: false,
    wakelock: true, repeat: false, zoomLock: false
  }
};

let wakeLock = null;
let currentScale = 1;
let currentX = 0;
let currentY = 0;
let lastShake = 0;
let isDragging = false;
let lastGamma = 0;
let lastBeta = 0;
let baselineGamma = 0;
let baselineBeta = 0;
// Décalage manuel : quand on lâche la carte après un drag, ce décalage (par
// rapport au centre de l'écran) est ajouté à la cible du parallaxe, pour que
// la carte reste là où on l'a posée au lieu d'être retirée vers le centre.
let dragOffsetX = 0;
let dragOffsetY = 0;
const parallaxSmooth = { x: 0, y: 0 };
const DEBUG_MODE = new URLSearchParams(location.search).has('debug');

// ── INIT ──
window.onload = () => {
  loadFromStorage();
  renderObjects();
  populatePhoneSelect();
  const finetuneSlider = document.getElementById('wallpaper-finetune');
  if (finetuneSlider) {
    finetuneSlider.value = state.wallpaperFineTune;
    document.getElementById('finetune-val').textContent = state.wallpaperFineTune + 'px';
  }
  const size = localStorage.getItem('mp_size');
  if (size) {
    document.getElementById('size-slider').value = size;
    document.getElementById('size-val').textContent = size + '%';
  }
  const speed = localStorage.getItem('mp_speed');
  if (speed) {
    document.getElementById('speed-slider').value = speed;
    document.getElementById('speed-val').textContent = speed + 'ms';
  }
  const selectedId = localStorage.getItem('mp_selected');
  if (selectedId) {
    const found = state.objects.find(o => o.id.toString() === selectedId);
    if (found) selectObject(found);
  }
  const trigger = localStorage.getItem('mp_trigger');
  if (trigger) state.trigger = trigger;
  setupTriggerButtons();
};

// ── STORAGE ──
function loadFromStorage() {
  try {
    const objs = localStorage.getItem('mp_objects');
    if (objs) {
      const imported = JSON.parse(objs);
      const importedOnly = imported.filter(o => !o.id.toString().startsWith('default_'));
      state.objects = [...state.objects, ...importedOnly];
    }
    const wps = localStorage.getItem('mp_wallpapers');
    if (wps) state.wallpapers = JSON.parse(wps);
    const settings = localStorage.getItem('mp_settings');
    if (settings) state.settings = { ...state.settings, ...JSON.parse(settings) };
    const trigger = localStorage.getItem('mp_trigger');
    if (trigger) state.trigger = trigger;
    const sensorPerm = localStorage.getItem('mp_sensor_permission');
    if (sensorPerm === 'granted') state.sensorPermission = true;
    const phone = localStorage.getItem('mp_phone');
    if (phone) state.phoneModel = phone;
    const finetune = localStorage.getItem('mp_finetune');
    if (finetune !== null) state.wallpaperFineTune = parseInt(finetune);
  } catch(e) {}
  updateWallpaperNames();
}

function saveToStorage() {
  try {
    const importedOnly = state.objects.filter(o => !o.id.toString().startsWith('default_'));
    localStorage.setItem('mp_objects', JSON.stringify(importedOnly));
    localStorage.setItem('mp_wallpapers', JSON.stringify(state.wallpapers));
    localStorage.setItem('mp_settings', JSON.stringify(state.settings));
    localStorage.setItem('mp_trigger', state.trigger);
    localStorage.setItem('mp_sensor_permission', state.sensorPermission ? 'granted' : 'denied');
    localStorage.setItem('mp_phone', state.phoneModel);
    localStorage.setItem('mp_finetune', state.wallpaperFineTune);
    localStorage.setItem('mp_selected', state.selectedObject ? state.selectedObject.id : null);
    localStorage.setItem('mp_size', document.getElementById('size-slider').value);
    localStorage.setItem('mp_speed', document.getElementById('speed-slider').value);
  } catch(e) {}
}

// ── OBJETS ──
function renderObjects() {
  const grid = document.getElementById('objects-grid');
  grid.innerHTML = '';
  state.objects.forEach(obj => {
    const div = document.createElement('div');
    div.className = 'object-item' + (state.selectedObject?.id === obj.id ? ' selected' : '');
    div.onclick = () => selectObject(obj);
    div.innerHTML = `<img src="${obj.src}" alt="${obj.name}">`;
    grid.appendChild(div);
  });
  const addBtn = document.createElement('div');
  addBtn.className = 'object-item add-btn';
  addBtn.onclick = importObject;
  addBtn.textContent = '+';
  grid.appendChild(addBtn);
}

function selectObject(obj) {
  const freshObj = state.objects.find(o => o.id === obj.id);
  state.selectedObject = freshObj || obj;
  renderObjects();
  saveToStorage();
}


function updateSize() {
  const val = document.getElementById('size-slider').value;
  document.getElementById('size-val').textContent = val + '%';
  saveToStorage();
}

function openSizePreview() {
  if (!state.selectedObject) { alert('Sélectionne un objet d\'abord !'); return; }
  const page = document.getElementById('size-preview-page');
  const img = document.getElementById('size-preview-img');
  const slider = document.getElementById('size-slider-preview');
  const val = document.getElementById('size-slider').value;
  img.src = state.selectedObject.src;
  const freshObj = state.objects.find(o => o.id === state.selectedObject.id);
  const realSize = freshObj ? freshObj.realSize : state.selectedObject.realSize;
  state.selectedObject.realSize = realSize;
  const baseWidth = realSize ? realSize : 60;
  const scale = val / 100;
  img.style.width = '60vmin';
  img.style.transform = `scale(${(scale * baseWidth * SIZE_CALIBRATION) / 100})`;
  img.style.transformOrigin = 'center center';
  slider.value = val;
  document.getElementById('size-val-preview').textContent = val + '%';
  document.getElementById('size-input-preview').value = val;
  const resetBtn = document.getElementById('reset-size-btn');
  resetBtn.style.opacity = realSize ? '1' : '0.3';
  resetBtn.style.pointerEvents = realSize ? 'all' : 'none';
  page.style.display = 'flex';
}

function closeSizePreview() {
  document.getElementById('size-preview-page').style.display = 'none';
}

function updateSizeFromPreview(val) {
  const freshObj = state.objects.find(o => o.id === state.selectedObject?.id);
  const realSize = freshObj?.realSize ?? state.selectedObject?.realSize;
  const baseWidth = realSize ? realSize : 60;
  const scale = val / 100;
  const img = document.getElementById('size-preview-img');
  img.style.width = '60vmin';
  img.style.transform = `scale(${(scale * baseWidth * SIZE_CALIBRATION) / 100})`;
  img.style.transformOrigin = 'center center';
  document.getElementById('size-val-preview').textContent = val + '%';
  document.getElementById('size-input-preview').value = val;
  document.getElementById('size-slider').value = val;
  document.getElementById('size-val').textContent = val + '%';
  saveToStorage();
}

function resetSize() {
  if (!state.selectedObject) return;
  const defaultObj = state.objects.find(o => o.id === state.selectedObject.id);
  const realSize = defaultObj?.realSize;
  if (!realSize) return;
  const slider = document.getElementById('size-slider-preview');
  slider.value = 100;
  updateSizeFromPreview(100);
}

function updateSizeFromInput(val) {
  val = Math.min(Math.max(parseInt(val) || 10, 10), 250);
  document.getElementById('size-slider-preview').value = val;
  updateSizeFromPreview(val);
}

function importObject() {
  document.getElementById('import-input').click();
}

function handleImport(input) {
  const files = Array.from(input.files);
  if (!files.length) return;
  files.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const obj = { id: Date.now() + i, name: file.name, src: e.target.result };
      state.objects.push(obj);
      if (i === files.length - 1) {
        selectObject(obj);
        saveToStorage();
        renderObjects();
      }
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
}

// ── FONDS D'ÉCRAN ──
function loadWallpaper(index, input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.wallpapers[index - 1] = e.target.result;
    saveToStorage();
    updateWallpaperNames();
  };
  reader.readAsDataURL(file);
}

function updateWallpaperNames() {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`wp${i}-name`);
    if (el) el.textContent = state.wallpapers[i-1] ? '✓ Défini' : 'Non défini';
  }
}

function populatePhoneSelect() {
  const sel = document.getElementById('phone-model-select');
  if (!sel) return;
  sel.innerHTML = phonePresets.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  sel.value = state.phoneModel;
}

function onPhoneModelChange() {
  state.phoneModel = document.getElementById('phone-model-select').value;
  saveToStorage();
  applyWallpaperPosition();
}

function onFineTuneChange(val) {
  state.wallpaperFineTune = parseInt(val);
  document.getElementById('finetune-val').textContent = val + 'px';
  saveToStorage();
  applyWallpaperPosition();
}

function detectSafeAreaTop() {
  // Lit la vraie valeur env(safe-area-inset-top) du téléphone (fonctionne sur
  // la plupart des iPhone en PWA installée ; peut renvoyer 0 sur certains
  // Android ou hors PWA, d'où le repli sur un preset).
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;height:0;padding-top:env(safe-area-inset-top, 0px);pointer-events:none;visibility:hidden;';
  document.body.appendChild(probe);
  const val = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  document.body.removeChild(probe);
  return val;
}

function computeStatusBarHeight() {
  const preset = phonePresets.find(p => p.id === state.phoneModel) || phonePresets[0];
  let base;
  if (preset.height === null) {
    const detected = detectSafeAreaTop();
    base = detected > 0 ? detected : 44; // repli si la détection échoue
  } else {
    base = preset.height;
  }
  return Math.max(0, base + (state.wallpaperFineTune || 0));
}

function applyWallpaperPosition() {
  // Le fond d'écran lui-même ne bouge JAMAIS (toujours aligné pile comme la
  // réalité). On pose à la place un bandeau noir en haut, de la hauteur de la
  // vraie barre de statut, pour cacher celle -- fausse -- de la photo.
  const mask = document.getElementById('status-mask');
  if (mask) mask.style.height = computeStatusBarHeight() + 'px';
}

// ── TOGGLES ──
function toggleSetting(el) {
  el.classList.toggle('on');
  const key = el.id.replace('toggle-', '');
  state.settings[key] = el.classList.contains('on');
  if ((key === 'parallax') && state.settings[key] && !state.sensorPermission) {
    requestSensorPermissions();
  }
  saveToStorage();
}

function toggleSensors(el) {
  if (el.classList.contains('on')) {
    el.classList.remove('on');
    state.sensorPermission = false;
    saveToStorage();
    return;
  }
  requestSensorPermissions().then(() => {
    if (state.sensorPermission) {
      el.classList.add('on');
      saveToStorage();
    }
  });
}

// ── DÉCLENCHEURS ──
function setupTriggerButtons() {
  document.querySelectorAll('.trigger-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.trigger === state.trigger);
    btn.onclick = () => {
      document.querySelectorAll('.trigger-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.trigger = btn.dataset.trigger;
      if (state.trigger === 'shake' && !state.sensorPermission) {
        requestSensorPermissions();
      }
      saveToStorage();
    };
  });
}

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