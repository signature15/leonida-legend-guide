// Leonida Legend — offline trophy tracker for the 55 GTA VI trophies.
// State lives in localStorage under "llprog" as one progress object:
//   { version, earned: [trophy ids], hideEarned, spoilers }
// Export writes that object to a JSON file; Import reads the same shape back
// (a bare array of ids from an older export is also accepted).

const KEY = 'llprog';
const PHASES = [
  ['story', 'Story'],
  ['strangers', 'Strangers'],
  ['robberies', 'Robberies'],
  ['grinds', 'Grinds'],
  ['100', '100%'],
];

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const phasesEl = $('phases');
const searchEl = $('search');
const categoryEl = $('category');
const gradeEl = $('grade');
const hideEarnedEl = $('hide-earned');
const spoilersEl = $('spoilers');

let state = loadState();
let trophies = [];

function loadState() {
  const fresh = { version: 1, earned: [], hideEarned: false, spoilers: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return { ...fresh, earned: ids(saved) };
    if (saved && typeof saved === 'object') {
      return {
        ...fresh,
        ...saved,
        earned: ids(saved.earned),
        hideEarned: Boolean(saved.hideEarned),
        spoilers: Boolean(saved.spoilers),
      };
    }
  } catch {
    // corrupt or unavailable storage: start clean
  }
  return fresh;
}

// keep only valid numeric trophy ids
function ids(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map(Number).filter((n) => Number.isInteger(n)))];
}

function saveState() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // private mode or quota: tracking still works for this session
  }
}

function isEarned(t) {
  return state.earned.includes(t.id);
}

// ---------- rendering ----------

function render() {
  const earnedSet = new Set(state.earned);
  const total = trophies.length;
  const earnedCount = state.earned.filter((id) => trophies.some((t) => t.id === id)).length;

  // header percentage + bar
  const pct = total ? Math.round((earnedCount / total) * 100) : 0;
  $('percent').textContent = pct;
  $('progress-label').textContent = `${earnedCount} of ${total} earned`;
  $('bar-fill').style.width = pct + '%';
  document.querySelector('.bar').setAttribute('aria-valuenow', pct);

  // grade counters
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    $(`count-${g}`).textContent = `${trophies.filter((t) => t.grade === g && earnedSet.has(t.id)).length}/${trophies.filter((t) => t.grade === g).length}`;
  }

  renderPhases(earnedSet);
  renderRows(earnedSet);
}

function renderPhases(earnedSet) {
  phasesEl.replaceChildren();
  for (const [key, label] of PHASES) {
    const group = trophies.filter((t) => t.category === key);
    const done = group.filter((t) => earnedSet.has(t.id)).length;
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phase' + (categoryEl.value === key ? ' active' : '');
    btn.title = `Show ${label.toLowerCase()} trophies`;

    const name = document.createElement('span');
    name.className = 'phase-name';
    name.textContent = label;
    const count = document.createElement('span');
    count.className = 'phase-count' + (done === group.length ? ' done' : '');
    count.textContent = `${done} / ${group.length}`;
    const bar = document.createElement('span');
    bar.className = 'phase-bar';
    const fill = document.createElement('span');
    fill.className = 'phase-bar-fill';
    fill.style.width = group.length ? `${(done / group.length) * 100}%` : '0';
    bar.append(fill);
    btn.append(name, count, bar);
    btn.addEventListener('click', () => {
      categoryEl.value = key;
      render();
    });
    li.append(btn);
    phasesEl.append(li);
  }
}

function renderRows(earnedSet) {
  rowsEl.replaceChildren();
  const query = searchEl.value.trim().toLowerCase();
  let shown = 0;

  for (const t of trophies) {
    const earned = earnedSet.has(t.id);
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) continue;
    if (categoryEl.value !== 'all' && t.category !== categoryEl.value) continue;
    if (state.hideEarned && earned) continue;
    if (query && !matches(t, query)) continue;
    rowsEl.append(row(t, earned));
    shown++;
  }
  $('empty').hidden = shown > 0;
}

function matches(t, query) {
  return [t.name, t.description, t.guide, t.category].some((s) => s.toLowerCase().includes(query));
}

function row(t, earned) {
  const tr = document.createElement('tr');
  tr.dataset.id = t.id;
  if (earned) tr.classList.add('earned');
  // story trophies blur while Spoilers is on and the trophy is still unearned
  if (state.spoilers && !earned && t.hidden) tr.classList.add('spoilered');

  const checkTd = document.createElement('td');
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'row-check';
  check.checked = earned;
  check.setAttribute('aria-label', `Mark ${t.name} as earned`);
  check.addEventListener('change', () => {
    state.earned = check.checked
      ? [...new Set([...state.earned, t.id])]
      : state.earned.filter((id) => id !== t.id);
    saveState();
    render();
  });
  checkTd.append(check);

  const gradeTd = document.createElement('td');
  const med = document.createElement('span');
  med.className = `medallion ${t.grade}`;
  med.textContent = t.grade[0].toUpperCase();
  gradeTd.append(med);

  const bodyTd = document.createElement('td');
  const name = document.createElement('span');
  name.className = 't-name spoilerable';
  name.textContent = t.name;

  bodyTd.append(name);

  if (t.missable) bodyTd.append(tag('missable', 'Missable'));
  bodyTd.append(tag(`cat-${t.category}`, categoryName(t.category)));

  const desc = document.createElement('p');
  desc.className = 't-desc spoilerable';
  desc.textContent = t.description;

  const guide = document.createElement('p');
  guide.className = 't-guide spoilerable';
  guide.textContent = t.guide;

  const sources = document.createElement('p');
  sources.className = 't-sources';
  sources.textContent = `Sources: ${t.sources.join(' · ')}`;

  bodyTd.append(desc, guide, sources);
  tr.append(checkTd, gradeTd, bodyTd);
  return tr;
}

function tag(cls, label) {
  const span = document.createElement('span');
  span.className = `tag ${cls}`;
  span.textContent = label;
  return span;
}

function categoryName(key) {
  return PHASES.find(([k]) => k === key)?.[1] ?? key;
}

// ---------- controls ----------

searchEl.addEventListener('input', render);
categoryEl.addEventListener('change', render);
gradeEl.addEventListener('change', render);
hideEarnedEl.addEventListener('change', () => {
  state.hideEarned = hideEarnedEl.checked;
  saveState();
  render();
});
spoilersEl.addEventListener('change', () => {
  state.spoilers = spoilersEl.checked;
  saveState();
  render();
});

$('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies from this tracker?')) return;
  state.earned = [];
  saveState();
  render();
});

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-legend-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (Array.isArray(data)) state.earned = ids(data);
    else if (data && Array.isArray(data.earned)) state.earned = ids(data.earned);
    else throw new Error('no earned list found');
    saveState();
    syncToggles();
    render();
  } catch {
    alert('That file does not look like a Leonida Legend progress export.');
  }
});

function syncToggles() {
  hideEarnedEl.checked = state.hideEarned;
  spoilersEl.checked = state.spoilers;
}

// ---------- boot ----------

try {
  trophies = (await (await fetch('data/trophies.json')).json()).trophies;
} catch {
  $('empty').hidden = false;
  $('empty').textContent = 'Could not load data/trophies.json — open this page through a local server.';
}
if (trophies.length) {
  syncToggles();
  render();
}
