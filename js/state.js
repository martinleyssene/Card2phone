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
