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
