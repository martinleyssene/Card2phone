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
