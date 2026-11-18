// Oberth marketplace: filter, search and sort the listing grid.
import { $, $$, reduce, initQuote, revealIn } from './quote.js';

const grid = $('#mGrid');
const cards = $$('.lc', grid);
const sels = $$('.mf-bar select[data-f]');
const q = $('#mq'), sort = $('#mSort');
const CAPS = { s: [0, 256], m: [512, 1024], l: [2048, 1e9] };

function state() {
  const s = Object.fromEntries(sels.map(x => [x.dataset.f, x.value]));
  s.q = q.value.trim().toLowerCase(); s.sort = sort.value;
  return s;
}
function matches(c, s) {
  const d = c.dataset;
  if (s.cat && d.cat !== s.cat) return false;
  if (s.grade && d.grade !== s.grade) return false;
  if (s.iface && !d.ifaces.split('|').includes(s.iface)) return false;
  if (s.ff && !d.ffs.split('|').includes(s.ff)) return false;
  if (s.cap) { const [lo, hi] = CAPS[s.cap]; if (+d.cmax < lo || +d.cmin > hi) return false; }
  if (s.q && !s.q.split(/\s+/).every(w => d.q.includes(w))) return false;
  return true;
}
const sorters = {
  feat: (a, b) => a.dataset.i - b.dataset.i,
  name: (a, b) => a.dataset.name.localeCompare(b.dataset.name),
  cap: (a, b) => b.dataset.cmax - a.dataset.cmax || a.dataset.i - b.dataset.i,
  read: (a, b) => b.dataset.read - a.dataset.read || a.dataset.i - b.dataset.i,
};

// fade/shift the grid with FLIP so filtering and sorting read as motion, not a jump
function apply(push = true) {
  const s = state();
  const first = new Map(cards.map(c => [c, c.getBoundingClientRect()]));
  const vis = cards.filter(c => matches(c, s)).sort(sorters[s.sort]);
  cards.forEach(c => { c.hidden = !vis.includes(c); });
  vis.forEach(c => grid.appendChild(c));
  if (!reduce) vis.forEach(c => {
    const a = first.get(c), b = c.getBoundingClientRect();
    if (!a.width) { c.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' }); return; }
    const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) c.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
  });
  if (push) vis.forEach(c => c.classList.add('in'));
  $('#mCount').textContent = vis.length;
  const n = sels.filter(x => x.value).length + (s.q ? 1 : 0);
  $('#mActive').textContent = n ? ` · ${n} filter${n > 1 ? 's' : ''} on` : '';
  $('#mReset').hidden = !n;
  $('#mEmpty').hidden = vis.length > 0;
  sels.forEach(x => x.closest('.mf').classList.toggle('on', !!x.value));
  $$('.mk-hero .jump a').forEach(a => a.classList.toggle('on', a.dataset.cat === s.cat));
  if (push) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(s)) if (v && !(k === 'sort' && v === 'feat')) p.set(k, v);
    history.replaceState(null, '', `${location.pathname}${p.toString() ? '?' + p : ''}${location.hash}`);
  }
}

function reset() { sels.forEach(x => (x.value = '')); q.value = ''; sort.value = 'feat'; apply(); }

function fromURL() {
  const p = new URLSearchParams(location.search);
  sels.forEach(x => { const v = p.get(x.dataset.f); if (v && [...x.options].some(o => o.value === v)) x.value = v; });
  if (p.get('q')) q.value = p.get('q');
  if (p.get('sort') && sorters[p.get('sort')]) sort.value = p.get('sort');
}

function heroArt() {
  const hero = $('.mk-hero'), art = $('#mkArt');
  if (!hero || !art || reduce || !matchMedia('(pointer:fine)').matches) return;
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    art.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
    art.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
  });
}

function init() {
  initQuote();
  fromURL();
  sels.forEach(x => x.addEventListener('change', () => apply()));
  sort.addEventListener('change', () => apply());
  let t; q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 120); });
  $('#mReset').onclick = reset; $('#mEmptyReset').onclick = reset;
  $$('.mk-hero .jump a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const sel = sels.find(x => x.dataset.f === 'cat');
    sel.value = sel.value === a.dataset.cat ? '' : a.dataset.cat;
    apply();
    $('#listings').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  apply(false);
  revealIn();
  heroArt();
}
init();
