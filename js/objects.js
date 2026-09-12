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
