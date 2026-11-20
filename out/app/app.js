const KEY = 'gta6-trophy-checklist';
const rows = document.getElementById('rows');
const roadmap = document.getElementById('roadmap');
const grade = document.getElementById('grade');
const status = document.getElementById('status');
const search = document.getElementById('search');
const emptyState = document.getElementById('empty-state');
const toast = document.getElementById('toast');
const phases = [
  { marker: 'I', title: 'Story line', description: 'Lay the foundation', start: 0, end: 14 },
  { marker: 'II', title: 'Side roads', description: 'Make the state yours', start: 14, end: 32 },
  { marker: 'III', title: 'Heat and hustle', description: 'Take care of business', start: 32, end: 41 },
  { marker: 'IV', title: 'State lines', description: 'Close every last loop', start: 41, end: 55 },
];

const doc = await (await fetch('data/trophies.json')).json();
const trophyByName = new Map(doc.trophies.map((trophy) => [trophy.name, trophy]));
let earned = readSavedProgress();
let toastTimer;

function readSavedProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(saved) ? saved.filter((name) => trophyByName.has(name)) : []);
  } catch {
    return new Set();
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function getProgress() {
  return Math.round((earned.size / doc.trophies.length) * 100);
}

function createCheckControl(trophy) {
  const label = document.createElement('label');
  label.className = 'check-wrap';
  label.title = earned.has(trophy.name) ? `Mark ${trophy.name} open` : `Mark ${trophy.name} earned`;

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = earned.has(trophy.name);
  input.setAttribute('aria-label', `${earned.has(trophy.name) ? 'Mark' : 'Mark'} ${trophy.name} as ${earned.has(trophy.name) ? 'open' : 'earned'}`);
  input.addEventListener('change', () => {
    if (input.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    save();
    render();
    showToast(input.checked ? `${trophy.name} marked earned` : `${trophy.name} moved back to open`);
  });

  const mark = document.createElement('span');
  mark.className = 'check-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '<svg viewBox="0 0 16 16"><path d="m3.5 8.4 3 3 6-6"/></svg>';
  label.append(input, mark);
  return label;
}

function createGradeBadge(trophy) {
  const badge = document.createElement('span');
  badge.className = `grade-badge ${trophy.grade}`;
  badge.textContent = trophy.grade;
  return badge;
}

function createRoadmapRow(trophy) {
  const row = document.createElement('div');
  row.className = `trophy-row${earned.has(trophy.name) ? ' is-earned' : ''}`;
  row.append(createCheckControl(trophy));

  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = trophy.name;

  const description = document.createElement('div');
  description.className = 'trophy-description';
  description.textContent = trophy.description;

  const guide = document.createElement('div');
  guide.className = 'guide-text';
  guide.textContent = trophy.guide;

  row.append(name, description, guide, createGradeBadge(trophy));
  return row;
}

function createLedgerRow(trophy) {
  const row = document.createElement('tr');
  const statusCell = document.createElement('td');
  statusCell.append(createCheckControl(trophy));

  const trophyCell = document.createElement('td');
  const name = document.createElement('div');
  name.textContent = trophy.name;
  const description = document.createElement('small');
  description.textContent = trophy.description;
  trophyCell.append(name, description);

  const gradeCell = document.createElement('td');
  gradeCell.append(createGradeBadge(trophy));
  const guideCell = document.createElement('td');
  guideCell.textContent = trophy.guide;

  row.append(statusCell, trophyCell, gradeCell, guideCell);
  return row;
}

function renderRoadmap() {
  roadmap.replaceChildren();
  for (const phase of phases) {
    const phaseTrophies = doc.trophies.slice(phase.start, phase.end);
    const complete = phaseTrophies.filter((trophy) => earned.has(trophy.name)).length;
    const isComplete = complete === phaseTrophies.length;
    const isCurrent = !isComplete && phases.slice(0, phases.indexOf(phase)).every((previous) => doc.trophies.slice(previous.start, previous.end).every((trophy) => earned.has(trophy.name)));

    const article = document.createElement('article');
    article.className = `phase${isCurrent ? ' is-current' : ''}${isComplete ? ' is-complete' : ''}`;

    const marker = document.createElement('span');
    marker.className = 'phase-marker';
    marker.textContent = isComplete ? '✓' : phase.marker;
    marker.setAttribute('aria-hidden', 'true');

    const content = document.createElement('div');
    content.className = 'phase-content';
    const heading = document.createElement('div');
    heading.className = 'phase-heading';
    const title = document.createElement('h3');
    title.textContent = phase.title;
    const meta = document.createElement('p');
    meta.textContent = `${complete} / ${phaseTrophies.length} complete · ${phase.description}`;
    heading.append(title, meta);

    const list = document.createElement('div');
    list.className = 'phase-list';
    phaseTrophies.forEach((trophy) => list.append(createRoadmapRow(trophy)));
    content.append(heading, list);
    article.append(marker, content);
    roadmap.append(article);
  }
}

function renderLedger() {
  const query = search.value.trim().toLowerCase();
  const selectedGrade = grade.value;
  const selectedStatus = status.value;
  const filtered = doc.trophies.filter((trophy) => {
    const matchesGrade = selectedGrade === 'all' || trophy.grade === selectedGrade;
    const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'earned' ? earned.has(trophy.name) : !earned.has(trophy.name));
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    return matchesGrade && matchesStatus && (!query || haystack.includes(query));
  });

  rows.replaceChildren();
  filtered.forEach((trophy) => rows.append(createLedgerRow(trophy)));
  emptyState.hidden = filtered.length > 0;
  document.getElementById('ledger-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'trophy' : 'trophies'}`;
}

function renderProgress() {
  const percent = getProgress();
  const count = earned.size;
  const next = doc.trophies.find((trophy) => !earned.has(trophy.name));
  document.getElementById('sidebar-count').textContent = `${count} / ${doc.trophies.length}`;
  document.getElementById('sidebar-percent').textContent = `${percent}%`;
  document.getElementById('sidebar-bar').style.width = `${percent}%`;
  document.getElementById('route-bar').style.width = `${percent}%`;
  document.getElementById('route-marker').style.left = `${Math.max(0, Math.min(100, percent))}%`;
  document.getElementById('route-complete').textContent = count;
  document.getElementById('route-next-label').textContent = next ? `Next stop: ${next.name}` : 'Route complete';
  document.getElementById('sidebar-next').textContent = next ? `Next up: ${next.name}` : 'Every road is yours.';
}

function render() {
  renderProgress();
  renderRoadmap();
  renderLedger();
}

function setView(view) {
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    const active = panel.dataset.viewPanel === view;
    panel.hidden = !active;
    panel.classList.toggle('is-visible', active);
  });
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link.dataset.view === view));
  if (view === 'ledger') document.getElementById('search').focus({ preventScroll: true });
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
}

document.querySelectorAll('[data-view], [data-view-target]').forEach((control) => {
  control.addEventListener('click', () => setView(control.dataset.view ?? control.dataset.viewTarget));
});

grade.addEventListener('change', renderLedger);
status.addEventListener('change', renderLedger);
search.addEventListener('input', renderLedger);

document.getElementById('export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify([...earned], null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(url);
  showToast('Run exported to a JSON file');
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error('Progress must be an array');
    earned = new Set(imported.filter((name) => trophyByName.has(name)));
    save();
    render();
    showToast(`${earned.size} trophies imported`);
  } catch {
    showToast('That file could not be imported');
  }
  event.target.value = '';
});

render();
