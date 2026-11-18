// Oberth marketplace: listing detail page (configurator, footprint, configurations table).
import { $, $$, esc, reduce, BY, label, add, mailto, initQuote, revealIn } from './quote.js';

const L = JSON.parse($('#ldData').textContent);
const AX = { cap: 'Capacity', speed: 'Speed', ff: 'Form factor', temp: 'Operating temp.', gen: 'Generation', type: 'Type', bus: 'Interface' };
const capV = c => { const m = /([\d.]+)\s*(MB|GB|TB)/.exec(c); return m ? +m[1] * ({ MB: 1 / 1024, GB: 1, TB: 1024 }[m[2]]) : 0; };

// physical outlines, mm
const SCALE = {
  sata25: { w: 100, h: 70, t: '2.5" drive · 100 × 70 mm', r: 3 },
  msata: { w: 51, h: 30, t: 'mSATA · 51 × 30 mm', pcb: 1 },
  m2280: { w: 80, h: 22, t: 'M.2 2280 · 80 × 22 mm', m2: 1 },
  m2242: { w: 42, h: 22, t: 'M.2 2242 · 42 × 22 mm', m2: 1 },
  udimm: { w: 133.35, h: 30, t: 'UDIMM · 133.35 × 30 mm', dimm: 1 },
  sodimm: { w: 69.6, h: 30, t: 'SO-DIMM · 69.6 × 30 mm', dimm: 1 },
  pe100: { w: 98, h: 45, t: 'PE100 · 98 × 45 mm', r: 7 },
  ps100: { w: 86.5, h: 58, t: 'PS100 · 86.5 × 58 mm', r: 6 },
  px100: { w: 60, h: 60, t: 'PX100 · 60 × 60 mm', r: 30 },
  sd: { w: 24, h: 32, t: 'SD · 32 × 24 mm', sd: 1 },
  microsd: { w: 11, h: 15, t: 'microSD · 15 × 11 mm', sd: 1 },
};

let sel = { ...L.default }, qty = 1;
const match = s => L.variants.filter(v => Object.entries(s).every(([k, x]) => v[k] === x));
const cur = () => match(sel)[0] || L.variants[0];
const values = ax => { const v = [...new Set(L.variants.map(x => x[ax]))]; return ax === 'cap' ? v.sort((a, b) => capV(a) - capV(b)) : v; };
const scaleKey = v => { let k = L.scale; if (L.scaleBy) for (const [a, m] of Object.entries(L.scaleBy)) if (m[v[a]]) k = m[v[a]]; return k; };

function outline(key) {
  const s = SCALE[key]; if (!s) return '';
  const k = 2.3, card = { w: 85.6, h: 53.98 };
  const pad = 26, w = s.w * k, h = s.h * k, cw = card.w * k, ch = card.h * k;
  const H = Math.max(h, ch) + pad * 2 + 16, W = w + cw + pad * 3 + 10;
  const x = pad + 10, y = pad + (H - pad * 2 - 16 - h);
  let shape;
  if (s.m2) shape = `<path d="M${x} ${y} h${w - 9} v${h * .3} h5 v${h * .16} h-5 v${h * .54} h${-(w - 9)} z"/><circle cx="${x + 6}" cy="${y + h / 2}" r="3"/>`;
  else if (s.dimm) shape = `<path d="M${x} ${y} h${w} v${h} h${-(w * .58)} v-5 h-6 v5 h${-(w * .42 - 6)} z"/>` + Array.from({ length: Math.floor(w / 7) }, (_, i) => `<line class="pin" x1="${x + 5 + i * 7}" y1="${y + h - 7}" x2="${x + 5 + i * 7}" y2="${y + h - 1}"/>`).join('');
  else if (s.sd) shape = `<path d="M${x} ${y + 7} l7 -7 h${w - 7} v${h} h${-w} z"/>`;
  else if (s.pcb) shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/><path class="pin" d="M${x + w - 8} ${y + 4} v${h - 8}"/>`;
  else shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(s.r || 3, h / 2) * k / 2.3}"/>`;
  const cx = x + w + pad + 10, cy = y + h - ch;
  const dim = `<g class="dim"><path d="M${x} ${y + h + 12} h${w}"/><path d="M${x} ${y + h + 7} v10 M${x + w} ${y + h + 7} v10"/><text x="${x + w / 2}" y="${y + h + 27}" text-anchor="middle">${s.w} mm</text>
    <path d="M${x - 12} ${y} v${h}"/><path d="M${x - 17} ${y} h10 M${x - 17} ${y + h} h10"/><text x="${x - 16}" y="${y + h / 2}" text-anchor="middle" transform="rotate(-90 ${x - 16} ${y + h / 2})" dy="-4">${s.h} mm</text></g>`;
  return `<svg viewBox="0 0 ${W} ${H + 14}" role="img" aria-label="${esc(s.t)}, beside a credit card for scale"><g class="fp-shape">${shape}</g>${dim}
    <g class="fp-card"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="7"/><text x="${cx + cw / 2}" y="${cy + ch / 2 + 4}" text-anchor="middle">Credit card</text></g></svg>`;
}

function caption(v) {
  if (L.shownAll) return `Pictured: ${L.shownNote}.`;
  const keys = Object.keys(L.shown || {});
  if (!keys.length) return `Pictured: ${L.title}${L.axes.length === 1 ? '. Every capacity uses this same design.' : '.'}`;
  const same = keys.every(k => v[k] === L.shown[k]);
  const pic = keys.map(k => L.shown[k]).join(' · ');
  return same ? `Pictured: this configuration (${pic}).` : `Pictured: the ${pic} model. Your selection uses the same design.`;
}

function countTo(el, to) {
  const from = +(el.dataset.v || 0); el.dataset.v = to;
  if (reduce || from === to) { el.textContent = to.toLocaleString(); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

let lastKey = null;
function render(fromUser) {
  const v = cur();
  $('#ldOpts').innerHTML = L.axes.map(ax => `<div class="hw-opt"><span class="mono">${AX[ax]}</span><div class="hw-chips" role="radiogroup" aria-label="${AX[ax]}">${values(ax).map(x => {
    const ok = match({ ...sel, [ax]: x }).length > 0;
    return `<button role="radio" aria-checked="${sel[ax] === x}" data-ax="${ax}" data-v="${esc(x)}" class="${ok ? '' : 'na'}"${ok ? '' : ` title="Not offered with the current selection; picking it adjusts the others"`}>${esc(x)}</button>`;
  }).join('')}</div></div>`).join('');
  $$('#ldOpts button').forEach(b => b.onclick = () => pick(b.dataset.ax, b.dataset.v));
  // meters
  const max = v.read > 600 ? 5000 : v.read > 200 ? 600 : 200;
  const met = $('#ldMeters');
  met.hidden = !(v.read || v.write);
  if (!met.hidden) {
    for (const k of ['read', 'write']) { const r = $(`.hw-m[data-k="${k}"]`, met); r.querySelector('i').style.width = `${Math.min(100, (v[k] || 0) / max * 100)}%`; countTo(r.querySelector('b'), v[k] || 0); }
    $('#ldMeterNote').textContent = `Sequential, up to, MB/s · scale ${max.toLocaleString()}`;
  }
  $('#ldSel').textContent = label(L, v);
  $('#ldCap').textContent = caption(v);
  $('#ldDirect').href = mailto(`1. ${L.title} · ${label(L, v)} × ${qty}`);
  // footprint
  const key = scaleKey(v), fp = $('#ldFp');
  if (SCALE[key]) {
    fp.hidden = false;
    if (key !== lastKey) { $('#ldFpS').innerHTML = outline(key); $('#ldFpT').textContent = SCALE[key].t; fp.classList.remove('drawn'); requestAnimationFrame(() => requestAnimationFrame(() => fp.classList.add('drawn'))); }
  }
  lastKey = key;
  // rows
  const idx = L.variants.indexOf(v);
  $$('#ldRows tr').forEach(tr => tr.classList.toggle('on', +tr.dataset.v === idx));
  if (fromUser) { const vis = $('#ldVis'); vis.classList.remove('swap'); void vis.offsetWidth; vis.classList.add('swap'); }
}

function pick(ax, x) {
  // keep as much of the current selection as possible when an option forces a change
  const cands = L.variants.filter(v => v[ax] === x);
  let best = cands[0], score = -1;
  for (const v of cands) { const sc = L.axes.reduce((n, a) => n + (v[a] === sel[a] ? 1 : 0), 0); if (sc > score) { best = v; score = sc; } }
  L.axes.forEach(a => (sel[a] = best[a]));
  render(true);
}

function init() {
  initQuote();
  render(false);
  $('#ldAdd').onclick = () => add(BY[L.slug] || L, cur(), qty, $('#ldImg'));
  const setQ = n => { qty = Math.max(1, n); $('#ldQty').value = qty; $('#ldDirect').href = mailto(`1. ${L.title} · ${label(L, cur())} × ${qty}`); };
  $('#ldMinus').onclick = () => setQ(qty - 1);
  $('#ldPlus').onclick = () => setQ(qty + 1);
  $('#ldQty').onchange = e => setQ(parseInt(e.target.value, 10) || 1);
  $$('#ldRows tr').forEach(tr => tr.addEventListener('click', e => {
    const v = L.variants[+tr.dataset.v];
    if (e.target.closest('.add-s')) { add(BY[L.slug] || L, v, 1, e.target); return; }
    L.axes.forEach(a => (sel[a] = v[a])); render(true);
    $('.ld-top').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }));
  // tilt the photo tile
  const vis = $('#ldVis');
  if (!reduce && matchMedia('(pointer:fine)').matches) {
    vis.addEventListener('pointermove', e => {
      const r = vis.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      vis.style.setProperty('--rx', `${(-y * 7).toFixed(2)}deg`); vis.style.setProperty('--ry', `${(x * 9).toFixed(2)}deg`);
      vis.style.setProperty('--gx', `${(x + .5) * 100}%`); vis.style.setProperty('--gy', `${(y + .5) * 100}%`);
    });
    vis.addEventListener('pointerleave', () => { vis.style.setProperty('--rx', '0deg'); vis.style.setProperty('--ry', '0deg'); });
  }
  revealIn();
}
init();
