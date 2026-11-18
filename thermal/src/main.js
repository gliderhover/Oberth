import { Explorer } from './scene.js';
import { PRODUCTS, FAMILIES, LOOPS, CLIMATE } from './data.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
const famName = Object.fromEntries(FAMILIES.map(f => [f.id, f.name]));
const MAIL = 'daniel@oberth.org';
const mailto = p => `mailto:${MAIL}?subject=${encodeURIComponent(`${p.name}: specs & pricing`)}&body=${encodeURIComponent(`Hi Daniel,\n\nI'd like specs and pricing for the TONFY ${p.name}.\n\nSite / project:\nCapacity needed (kW):\nTimeline:\n\nThanks`)}`;

/* ------------------------------------------------------------------ */
/* Explorer                                                            */
/* ------------------------------------------------------------------ */
const stage = $('#stage');
const overlay = $('#overlay');
const svg = $('#leaders');
const tip = $('#tip');
const panel = $('#panel');
let explorer = null;
let model = 0;

function statHTML(s) { return `<div class="st"><b>${esc(s.v)}${s.u ? `<small>${esc(s.u)}</small>` : ''}</b><span>${esc(s.l)}</span></div>`; }

function specRows(p, col) {
  return p.models.rows.map(([l, u, v]) => {
    const val = Array.isArray(v) ? v[col] : v;
    return `<tr><th>${esc(l)}${u ? ` <em>${esc(u)}</em>` : ''}</th><td>${esc(val)}</td></tr>`;
  }).join('');
}

function renderPanel(p) {
  model = 0;
  const loops = (p.loop || []).map(l => `<span class="lp lp-${l}">${esc(LOOPS[l].name)}</span>`).join('');
  panel.innerHTML = `
    <div class="pn-top">
      <span class="mono">${esc(famName[p.family])}</span>
      <button class="pn-x" id="pnClose" aria-label="Close and return to the full system">✕</button>
    </div>
    <div class="pn-scroll">
      <h3>${esc(p.name)}</h3>
      <p class="pn-tag">${esc(p.tag)}</p>
      <div class="pn-img"><img src="${p.img}" alt="${esc(p.name)} product photo" loading="lazy"></div>
      <p class="pn-sum">${esc(p.summary)}</p>
      ${loops ? `<div class="pn-loops"><span class="mono">Connected loops</span>${loops}</div>` : ''}
      <div class="pn-stats">${p.stats.map(statHTML).join('')}</div>
      <div class="pn-sec"><span class="mono">Exploded components</span>
        <ol class="pn-parts">${(p.parts || []).map((x, i) => `<li data-i="${i}"><button><b>${String(i + 1).padStart(2, '0')}</b><span><strong>${esc(x.n)}</strong><em>${esc(x.t)}</em></span></button></li>`).join('')}</ol>
      </div>
      <div class="pn-sec"><span class="mono">Specifications</span>
        ${p.models.cols.length > 1 ? `<div class="chips" role="tablist">${p.models.cols.map((c, i) => `<button role="tab" aria-selected="${i === 0}" data-c="${i}">${esc(c)}</button>`).join('')}</div>` : `<div class="chips one"><span>${esc(p.models.cols[0])}</span></div>`}
        <table class="spec"><tbody id="pnSpec">${specRows(p, 0)}</tbody></table>
      </div>
      <div class="pn-sec"><span class="mono">Features</span><ul class="feat">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
      <div class="pn-cta"><a class="btn btn-p" href="${mailto(p)}">Request specs &amp; pricing</a><a class="btn btn-g" href="../book/">Book a call</a></div>
    </div>`;
  $('#pnClose').onclick = () => explorer.deselect();
  $$('.chips button', panel).forEach(b => b.onclick = () => {
    model = +b.dataset.c;
    $$('.chips button', panel).forEach(x => x.setAttribute('aria-selected', x === b));
    $('#pnSpec').innerHTML = specRows(p, model);
  });
  $$('.pn-parts li', panel).forEach(li => {
    li.querySelector('button').onclick = () => explorer.focusPart(+li.dataset.i);
    li.onmouseenter = () => { explorer.hoverListPart = +li.dataset.i; };
    li.onmouseleave = () => { explorer.hoverListPart = -1; };
  });
}

function setActivePart(i) {
  $$('.pn-parts li', panel).forEach(li => li.classList.toggle('on', +li.dataset.i === i));
  const li = $(`.pn-parts li[data-i="${i}"]`, panel);
  if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// callout label pool
const labels = [];
function label(i) {
  if (!labels[i]) {
    const d = document.createElement('button');
    d.className = 'callout';
    d.innerHTML = '<b></b><span></span>';
    d.onclick = e => { e.stopPropagation(); explorer.focusPart(+d.dataset.i); };
    overlay.appendChild(d);
    labels[i] = d;
  }
  return labels[i];
}
const tagEls = [];

function layoutCallouts() {
  const data = explorer.partAnchors();
  const p = explorer.selected && byId[explorer.selected.id];
  const show = data && p && data.ex > .35;
  let paths = '';
  const W = explorer.size.w, H = explorer.size.h;
  const panelW = panel.classList.contains('open') && W > 900 ? 440 : 0;
  const panelH = panel.classList.contains('open') && W <= 900 ? panel.offsetHeight + 14 : 0;
  if (show) {
    const left = [], right = [];
    for (const a of data.anchors) (a.x < data.center.x ? left : right).push(a);
    const place = (arr, side) => {
      arr.sort((a, b) => a.y - b.y);
      const gap = W < 600 ? 30 : 40;
      arr.forEach((a, k) => { a.ly = Math.max(a.y, k ? arr[k - 1].ly + gap : 70); });
      for (let k = arr.length - 1; k >= 0; k--) { const max = k < arr.length - 1 ? arr[k + 1].ly - gap : H - 40 - panelH; arr[k].ly = Math.min(arr[k].ly, max); }
      const xs = arr.map(a => a.x);
      const edge = side < 0 ? Math.min(...xs) - 70 : Math.max(...xs) + 70;
      arr.forEach(a => { a.lx = side < 0 ? Math.max(16, edge) : Math.min(W - panelW - 16, edge); a.side = side; });
    };
    place(left, -1); place(right, 1);
    const fade = Math.min(1, (data.ex - .35) / .4);
    for (const a of [...left, ...right]) {
      const el = label(a.i);
      const part = p.parts[a.i];
      if (!part) continue;
      el.dataset.i = a.i;
      el.querySelector('b').textContent = String(a.i + 1).padStart(2, '0');
      el.querySelector('span').textContent = part.n;
      el.style.opacity = fade;
      el.style.pointerEvents = fade > .5 ? 'auto' : 'none';
      el.classList.toggle('l', a.side < 0);
      el.classList.toggle('on', a.i === explorer.activePart || a.i === explorer.hoverPart || a.i === explorer.hoverListPart);
      el.style.transform = `translate(${a.side < 0 ? a.lx : a.lx}px, ${a.ly}px) translate(${a.side < 0 ? '-100%' : '0'}, -50%)`;
      const mid = a.side < 0 ? a.lx + 10 : a.lx - 10;
      const on = el.classList.contains('on');
      paths += `<path d="M${a.x.toFixed(1)},${a.y.toFixed(1)} L${(mid - a.side * 18).toFixed(1)},${a.ly.toFixed(1)} L${mid.toFixed(1)},${a.ly.toFixed(1)}" style="opacity:${fade * (on ? 1 : .55)}" class="${on ? 'on' : ''}"/><circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="${on ? 4.5 : 3}" style="opacity:${fade}" class="${on ? 'on' : ''}"/>`;
    }
    labels.forEach((el, i) => { if (el && !data.anchors.find(a => a.i === i)) el.style.opacity = 0; });
  } else {
    labels.forEach(el => { if (el) { el.style.opacity = 0; el.style.pointerEvents = 'none'; } });
  }
  svg.innerHTML = paths;

  // loop tags in overview
  const tags = explorer.tagAnchors();
  tags.forEach((t, i) => {
    if (!tagEls[i]) {
      const d = document.createElement('button');
      d.className = `ltag lt-${t.loop}`;
      d.innerHTML = `<i></i><span><b>${esc(t.text)}</b><em>${esc(t.sub)}</em></span>`;
      d.onclick = e => { e.stopPropagation(); setLoop(explorer.loopFilter === t.loop ? null : t.loop); };
      overlay.appendChild(d); tagEls[i] = d;
    }
    const d = tagEls[i];
    const vis = !explorer.selected && explorer.intro > .85 && (!explorer.loopFilter || explorer.loopFilter === t.loop);
    d.style.opacity = vis ? 1 : 0;
    d.style.pointerEvents = vis ? 'auto' : 'none';
    d.style.transform = `translate(${t.x.toFixed(1)}px, ${t.y.toFixed(1)}px) translate(-50%, -100%)`;
  });

  // tooltip
  if (explorer.hovered && explorer.pointerPx && !(explorer.selected && explorer.hovered === explorer.selected && explorer.hoverPart < 0)) {
    const h = explorer.hovered, hp = byId[h.id];
    let html = '';
    if (explorer.selected === h && explorer.hoverPart >= 0) html = `<b>${String(explorer.hoverPart + 1).padStart(2, '0')} · ${esc(hp.parts[explorer.hoverPart].n)}</b><span>${esc(hp.parts[explorer.hoverPart].t)}</span>`;
    else if (hp) html = `<b>${esc(hp.name)}</b><span>${esc(hp.tag)} · click to explode</span>`;
    tip.innerHTML = html;
    tip.style.opacity = html ? 1 : 0;
    tip.style.transform = `translate(${explorer.pointerPx.x + 16}px, ${explorer.pointerPx.y + 16}px)`;
  } else tip.style.opacity = 0;
}

function setLoop(l) {
  explorer.setLoop(l);
  $$('#loops button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.l || null) === (l || null) || (!l && !b.dataset.l)));
}

function initExplorer() {
  explorer = new Explorer(stage, {
    products: PRODUCTS,
    onSelect(u, p, fromUI) {
      stage.classList.toggle('selected', !!u);
      $$('#index button').forEach(b => b.setAttribute('aria-current', !!u && b.dataset.id === u.id));
      if (u) { renderPanel(p); panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); $('#exCtl').hidden = false; }
      else { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); $('#exCtl').hidden = true; }
      if (fromUI && u) stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    onHover() {},
    onPartFocus(i) { setActivePart(i); },
  });
  explorer.hoverListPart = -1;
  explorer.onFrame = layoutCallouts;

  // index
  const groups = [
    ['Outdoor plant', ['dry-cooler', 'chiller', 'piping']],
    ['Liquid cooling', ['cabinet-cdu', 'inrack-cdu', 'lc-rack', 'immersion-tank']],
    ['Air cooling', ['fan-wall', 'rdhx', 'inrow-cw']],
  ];
  $('#index').innerHTML = groups.map(([g, ids]) => `<div class="ig"><span class="mono">${g}</span>${ids.map(id => `<button data-id="${id}"><i></i>${esc(byId[id].name)}</button>`).join('')}</div>`).join('');
  $$('#index button').forEach(b => {
    b.onclick = () => explorer.selected?.id === b.dataset.id ? explorer.deselect() : explorer.select(b.dataset.id);
    b.onmouseenter = () => { const u = explorer.firstOf(b.dataset.id); explorer.hovered = u; };
    b.onmouseleave = () => { explorer.hovered = null; };
  });
  $('#idxToggle').onclick = () => {
    const open = $('#indexWrap').classList.toggle('open');
    $('#idxToggle').setAttribute('aria-expanded', open);
  };

  // loops
  $$('#loops button').forEach(b => b.onclick = () => setLoop(b.dataset.l || null));
  // controls
  $('#rotL').onclick = () => explorer.rotateBy(-Math.PI / 4);
  $('#rotR').onclick = () => explorer.rotateBy(Math.PI / 4);
  $('#zIn').onclick = () => explorer.zoomBy(1.3);
  $('#zOut').onclick = () => explorer.zoomBy(1 / 1.3);
  $('#reset').onclick = () => { setLoop(null); explorer.reset(); };
  const flowBtn = $('#flow');
  flowBtn.onclick = () => { const on = flowBtn.getAttribute('aria-pressed') !== 'true'; flowBtn.setAttribute('aria-pressed', on); explorer.setFlow(on); };
  $('#explode').oninput = e => { explorer.setExplode(+e.target.value); };
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && explorer.selected) explorer.deselect();
  });

  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { explorer.start(); io.disconnect(); } }, { threshold: .25 });
  io.observe(stage);
}

/* ------------------------------------------------------------------ */
/* Portfolio grid + modal                                              */
/* ------------------------------------------------------------------ */
function initPortfolio() {
  const tabs = $('#famTabs'), grid = $('#grid');
  tabs.innerHTML = `<button aria-pressed="true" data-f="">All <sup>${PRODUCTS.length}</sup></button>` + FAMILIES.map(f => `<button aria-pressed="false" data-f="${f.id}">${esc(f.name)} <sup>${PRODUCTS.filter(p => p.family === f.id).length}</sup></button>`).join('');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card reveal" data-f="${p.family}">
      <button class="card-hit" data-open="${p.id}" aria-label="Open ${esc(p.name)} specifications"></button>
      <div class="card-img"><img src="${p.img}" alt="" loading="lazy"></div>
      <div class="card-body">
        <span class="mono">${esc(famName[p.family])}</span>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.tag)}</p>
        <div class="card-stats">${p.stats.slice(0, 2).map(statHTML).join('')}</div>
        <div class="card-act">
          <span class="lnk">Specs <svg aria-hidden="true"><use href="#arrow"/></svg></span>
          ${p.scene ? `<button class="lnk3d" data-3d="${p.id}">View in 3D</button>` : ''}
        </div>
      </div>
    </article>`).join('');
  $$('button', tabs).forEach(b => b.onclick = () => {
    $$('button', tabs).forEach(x => x.setAttribute('aria-pressed', x === b));
    const f = b.dataset.f;
    $$('.card', grid).forEach(c => { const on = !f || c.dataset.f === f; c.hidden = !on; if (on) { c.classList.remove('in'); requestAnimationFrame(() => c.classList.add('in')); } });
    $('#famBlurb').textContent = f ? FAMILIES.find(x => x.id === f).blurb : 'Every unit from the brochure, with full specification tables.';
  });
  grid.addEventListener('click', e => {
    const b3 = e.target.closest('[data-3d]');
    if (b3) { e.stopPropagation(); explorer.select(b3.dataset['3d'], true); return; }
    const o = e.target.closest('[data-open]');
    if (o) openModal(byId[o.dataset.open]);
  });
}

const dlg = $('#modal');
function openModal(p) {
  const t = p.models;
  $('#mBody').innerHTML = `
    <div class="m-head">
      <div class="m-img"><img src="${p.img}" alt="${esc(p.name)} product photo"></div>
      <div>
        <span class="mono">${esc(famName[p.family])} · ${esc(p.tag)}</span>
        <h3 id="mTitle">${esc(p.name)}</h3>
        <p>${esc(p.summary)}</p>
        <div class="pn-stats">${p.stats.map(statHTML).join('')}</div>
      </div>
    </div>
    <div class="m-grid">
      <div class="m-tbl"><span class="mono">Specifications · ${t.cols.length} model${t.cols.length > 1 ? 's' : ''}</span>
        <div class="tscroll"><table class="spec wide"><thead><tr><th></th>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
        ${t.rows.map(([l, u, v]) => `<tr><th>${esc(l)}${u ? ` <em>${esc(u)}</em>` : ''}</th>${Array.isArray(v) ? v.map(x => `<td>${esc(x)}</td>`).join('') : `<td colspan="${t.cols.length}">${esc(v)}</td>`}</tr>`).join('')}
        </tbody></table></div>
      </div>
      <div><span class="mono">Features</span><ul class="feat">${p.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
        <div class="pn-cta"><a class="btn btn-p" href="${mailto(p)}">Request specs &amp; pricing</a>${p.scene ? `<button class="btn btn-g" data-m3d="${p.id}">Explode in 3D</button>` : ''}</div>
      </div>
    </div>`;
  const b = $('[data-m3d]', dlg);
  if (b) b.onclick = () => { dlg.close(); explorer.select(b.dataset.m3d, true); };
  dlg.showModal();
}
$('#mClose').onclick = () => dlg.close();
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ------------------------------------------------------------------ */
/* Climate chart                                                       */
/* ------------------------------------------------------------------ */
function initClimate() {
  const max = 8760;
  $('#climate-bars').innerHTML = CLIMATE.map(([c, h, pc]) => `
    <div class="cb" tabindex="0">
      <span class="cb-n">${c}</span>
      <div class="cb-t"><i style="--w:${(h / max * 100).toFixed(1)}%"></i></div>
      <span class="cb-v"><b>${pc}%</b><em>${h.toLocaleString()} h</em></span>
    </div>`).join('');
}

/* ------------------------------------------------------------------ */
/* Page chrome                                                         */
/* ------------------------------------------------------------------ */
function initChrome() {
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const menu = $('#menuBtn');
  const nl = $('#navlinks');
  menu?.addEventListener('click', () => { const o = nl.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
  $$('#navlinks a').forEach(a => a.addEventListener('click', () => nl.classList.remove('open')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  // counters
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, dec = +(el.dataset.dec || 0), t0 = performance.now();
    const step = t => { const k = Math.min(1, (t - t0) / 1400), v = to * (1 - Math.pow(1 - k, 3)); el.textContent = v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));
}

initExplorer();
initPortfolio();
initClimate();
initChrome();
$$('.reveal').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); });
