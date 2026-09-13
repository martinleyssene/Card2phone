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

// Garde le toggle "Capteurs" (et le message d'avertissement) synchronisés
// avec l'état réel de la permission, quel que soit le chemin par lequel elle
// a été accordée (toggle Capteurs, toggle Parallaxe, ou choix du déclencheur "Shake").
function syncSensorsToggleUI() {
  const toggle = document.getElementById('toggle-sensors');
  const hint = document.getElementById('sensors-hint');
  if (toggle) toggle.classList.toggle('on', state.sensorPermission);
  if (hint) hint.style.display = state.sensorPermission ? 'none' : 'block';
}

function toggleSensors(el) {
  if (state.sensorPermission) {
    state.sensorPermission = false;
    saveToStorage();
    syncSensorsToggleUI();
    return;
  }
  requestSensorPermissions().then(() => {
    saveToStorage();
    syncSensorsToggleUI();
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
