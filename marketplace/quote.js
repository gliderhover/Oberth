// Oberth marketplace: quote list shared by the listing grid and the detail pages.
import { LISTINGS } from './listings.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const BY = Object.fromEntries(LISTINGS.map(l => [l.slug, l]));
export const label = (l, v) => l.axes.map(a => v[a]).join(' · ');
export const defaultVariant = l => l.variants.find(v => Object.entries(l.default).every(([k, x]) => v[k] === x)) || l.variants[0];

const KEY = 'oberth.quote.v2';
let quote = [];
try { quote = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { quote = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(quote)); } catch { /* storage unavailable */ } };
const lineText = () => quote.map((q, i) => `${i + 1}. ${q.name} · ${q.label} × ${q.qty}`).join('\n');

export function mailto(lines, extra = '') {
  const body = `Hi Daniel,\n\nPlease quote the following:\n\n${lines}\n\n${extra}Please include unit price, MOQ and lead time.\n\nThanks`;
  const n = lines.split('\n').length;
  return `mailto:daniel@oberth.org?subject=${encodeURIComponent(`Hardware quote request (${n} line${n > 1 ? 's' : ''})`)}&body=${encodeURIComponent(body)}`;
}

let toastT;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.innerHTML = `<span>${msg}</span><button type="button">View list</button>`;
  t.querySelector('button').onclick = () => open(true);
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200);
}

function fly(from, src) {
  const fab = $('#qFab');
  fab.classList.add('show');
  fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
  if (reduce || !from) return;
  const a = from.getBoundingClientRect(), b = fab.getBoundingClientRect();
  const d = document.createElement('img');
  d.src = src; d.className = 'flyer'; d.alt = '';
  d.style.left = a.left + a.width / 2 - 30 + 'px'; d.style.top = a.top + a.height / 2 - 30 + 'px';
  document.body.appendChild(d);
  requestAnimationFrame(() => {
    d.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.25)`;
    d.style.opacity = '.15';
  });
  setTimeout(() => d.remove(), 800);
}

export function add(l, v, n = 1, from = null) {
  const lab = label(l, v), id = `${l.slug}|${lab}`;
  const hit = quote.find(q => q.id === id);
  if (hit) hit.qty += n; else quote.push({ id, slug: l.slug, url: l.url, name: l.title, label: lab, qty: n, img: l.src });
  save(); render(); fly(from, l.src);
  toast(`Added <b>${esc(l.title)}</b> · ${esc(lab)}${n > 1 ? ` × ${n}` : ''}`);
}

function render() {
  const n = quote.reduce((s, q) => s + q.qty, 0);
  $('#qCount').textContent = n;
  $('#qFab').classList.toggle('has', n > 0);
  if (n > 0) $('#qFab').classList.add('show');
  $('#qList').innerHTML = quote.length ? quote.map((q, i) => `<li>
      <a class="qi-img" href="${q.url}"><img src="${q.img}" alt=""></a>
      <div class="qi-t"><a href="${q.url}">${esc(q.name)}</a><em>${esc(q.label)}</em></div>
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button><input data-i="${i}" value="${q.qty}" inputmode="numeric" aria-label="Quantity"><button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>
      <button class="qi-x" data-x="${i}" aria-label="Remove ${esc(q.name)}">✕</button></li>`).join('')
    : `<li class="q-empty"><b>Your quote list is empty.</b><em>Add listings from the marketplace. We reply with unit price, MOQ and lead time.</em></li>`;
  $$('#qList [data-d]').forEach(b => b.onclick = () => { const q = quote[+b.dataset.i]; q.qty = Math.max(1, q.qty + +b.dataset.d); save(); render(); });
  $$('#qList input').forEach(inp => inp.onchange = () => { const q = quote[+inp.dataset.i]; q.qty = Math.max(1, parseInt(inp.value, 10) || 1); save(); render(); });
  $$('#qList [data-x]').forEach(b => b.onclick = () => { quote.splice(+b.dataset.x, 1); save(); render(); });
  updateSend();
}
function updateSend() {
  const s = $('#qSend'), co = $('#qCo').value.trim(), note = $('#qNote').value.trim();
  s.classList.toggle('dis', !quote.length);
  s.href = quote.length ? mailto(lineText(), `${co ? `Company: ${co}\n` : ''}${note ? `Notes: ${note}\n` : ''}${co || note ? '\n' : ''}`) : '#';
}

function open(o) {
  const dr = $('#qDrawer');
  dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', String(!o));
  $('#qFab').setAttribute('aria-expanded', String(o)); document.body.classList.toggle('q-open', o);
  if (o) setTimeout(() => $('#qClose').focus(), 60);
}

export function initQuote() {
  $('#qFab').onclick = () => open(!$('#qDrawer').classList.contains('open'));
  $('#qClose').onclick = () => open(false);
  $('#qScrim').onclick = () => open(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && $('#qDrawer').classList.contains('open')) open(false); });
  $('#qCo').oninput = $('#qNote').oninput = updateSend;
  $('#qSend').onclick = e => { if (!quote.length) e.preventDefault(); };
  $('#qClear').onclick = () => { quote = []; save(); render(); };
  $('#qCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(lineText()); $('#qCopy').textContent = 'Copied'; setTimeout(() => ($('#qCopy').textContent = 'Copy list'), 1400); } catch { /* clipboard blocked */ }
  };
  // quick-add buttons on listing cards
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    const l = BY[b.dataset.add]; if (!l) return;
    e.preventDefault();
    b.classList.remove('done'); void b.offsetWidth; b.classList.add('done');
    add(l, defaultVariant(l), 1, b.closest('.lc')?.querySelector('.lc-img img') || b);
  });
  render();
  setTimeout(() => $('#qFab').classList.add('show'), 900);
}

export function revealIn() {
  if (!('IntersectionObserver' in window)) { $$('.lc').forEach(c => c.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.lc').forEach(c => io.observe(c));
}
