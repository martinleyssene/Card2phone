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
