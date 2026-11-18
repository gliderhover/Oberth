// Oberth marketplace: CS Storage hardware catalog.
// Data from the CS Storage (畅行存储) SSD quotation and product manual v3.0.
// Each family lists concrete variants; option chips are derived from them.

const FLASH = 'Hynix · Micron · SanDisk · Toshiba';
const caps = (list, read, write, extra = {}) => list.map((cap, i) => ({ cap, read: read?.[i], write: write?.[i], ...extra }));

export const CATS = [
  { id: 'ssd', name: 'Consumer SSD', note: 'Quoted line · 25 SKUs' },
  { id: 'mem', name: 'Memory', note: 'DDR3 · DDR4 · DDR5' },
  { id: 'ind', name: 'Industrial', note: 'Wide-temperature SSD & DRAM' },
  { id: 'flash', name: 'Portable & flash', note: 'PSSD · USB · cards' },
];

export const FAMILIES = [
  // ---------------- Consumer SSD (quotation) ----------------
  {
    id: 'sata25', cat: 'ssd', name: '2.5" SATA SSD', tag: 'SATA III · 2.5"', img: 'sata25', scale: 'sata25', ref: [1, 6],
    desc: 'The universal upgrade drive for desktops, laptops, POS and thin clients.',
    axes: ['cap'],
    variants: caps(['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'], [220, 550, 530, 530, 550, 550], [220, 420, 500, 500, 530, 530]),
    specs: { Interface: '2.5" SATA III (6 Gb/s)', Dimensions: '100 × 70 × 7 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  {
    id: 'msata', cat: 'ssd', name: 'mSATA SSD', tag: 'mSATA · mini PCIe', img: 'msata', scale: 'msata', ref: [7, 10],
    desc: 'Compact SATA module for embedded boards, mini PCs and legacy notebooks.',
    axes: ['cap'],
    variants: caps(['256GB', '512GB', '1TB', '2TB'], [550, 550, 550, 550], [480, 480, 480, 480]),
    specs: { Interface: 'mSATA (mini PCIe)', Dimensions: '51 × 30 × 4.8 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  {
    id: 'm2-2280-sata', cat: 'ssd', name: 'M.2 2280 SATA SSD', tag: 'SATA · M.2 2280 (NGFF)', img: 'm2-2280-sata', scale: 'm2280', ref: [11, 14],
    desc: 'Full-length M.2 on the SATA bus, for systems without NVMe support.',
    axes: ['cap'],
    variants: caps(['256GB', '512GB', '1TB', '2TB'], [550, 550, 550, 540], [500, 500, 500, 500]),
    specs: { Interface: 'M.2 2280 SATA (NGFF)', Dimensions: '80 × 22 × 2.4 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  {
    id: 'm2-2242-sata', cat: 'ssd', name: 'M.2 2242 SATA SSD', tag: 'SATA · M.2 2242 (NGFF)', img: 'm2-2242-sata', scale: 'm2242', ref: [15, 18],
    desc: 'Short M.2 for tablets, ultrabooks, industrial boards and handhelds.',
    axes: ['cap'],
    variants: caps(['256GB', '512GB', '1TB', '2TB'], [560, 560, 560, 560], [470, 480, 490, 490]),
    specs: { Interface: 'M.2 2242 SATA (NGFF)', Dimensions: '42 × 22 × 2.4 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  {
    id: 'nvme-gen3', cat: 'ssd', name: 'PCIe Gen3 ×4 NVMe SSD', tag: 'NVMe · M.2 2280', img: 'nvme-gen3', scale: 'm2280', ref: [19, 22],
    desc: 'Mainstream NVMe for boot drives, workstations and edge servers.',
    axes: ['cap'],
    variants: caps(['128GB', '256GB', '512GB', '1TB'], [2600, 2600, 2900, 2900], [2000, 2000, 2500, 2600]),
    specs: { Interface: 'PCIe Gen3 ×4, NVMe', Dimensions: '80 × 22 × 2.4 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  {
    id: 'nvme-gen4', cat: 'ssd', name: 'PCIe Gen4 ×4 NVMe SSD', tag: 'NVMe · M.2 2280', img: 'nvme-gen4', scale: 'm2280', ref: [23, 25],
    desc: 'The fastest drive in the line: 5,000 MB/s reads for data loading and scratch.',
    axes: ['cap'],
    variants: caps(['512GB', '1TB', '2TB'], [5000, 5000, 5000], [4500, 4600, 4600]),
    specs: { Interface: 'PCIe Gen4 ×4, NVMe', Dimensions: '80 × 22 × 2.4 mm', Flash: FLASH, 'Operating temp.': '0–70 °C' },
  },
  // ---------------- Memory ----------------
  ...[
    ['ddr5', 'DDR5', '288-pin', '262-pin', [['4800 MHz', 'CL40', ['8GB', '16GB', '32GB']], ['5600 MHz', 'CL46', ['8GB', '16GB', '32GB']]], '1.1 V'],
    ['ddr4', 'DDR4', '288-pin', '260-pin', [['2666 MHz', 'CL19', ['4GB', '8GB', '16GB']], ['3200 MHz', 'CL22', ['8GB', '16GB', '32GB']]], '1.2 V'],
    ['ddr3', 'DDR3', '240-pin', '204-pin', [['1333 MHz', 'CL9', ['2GB', '4GB', '8GB']], ['1600 MHz', 'CL11', ['4GB', '8GB', '16GB']]], '1.35 V / 1.5 V'],
  ].flatMap(([k, gen, upin, spin, speeds, volt]) => [
    {
      id: `${k}-udimm`, cat: 'mem', name: `${gen} UDIMM`, tag: `Desktop · ${upin}`, img: `${k}-udimm`, scale: 'udimm',
      desc: `${gen} unbuffered DIMM for desktops, workstations and industrial PCs.`,
      axes: ['speed', 'cap'],
      variants: speeds.flatMap(([speed, cl, cs]) => cs.map(cap => ({ speed, cl, cap }))),
      specs: { Platform: 'Desktop PC', Pins: upin, Voltage: volt, 'Operating temp.': '0–85 °C', Dimensions: '133.35 × 30 × 3.9 mm' },
      vspecs: ['cl'],
    },
    {
      id: `${k}-sodimm`, cat: 'mem', name: `${gen} SO-DIMM`, tag: `Laptop · ${spin}`, img: `${k}-sodimm`, scale: 'sodimm',
      desc: `${gen} small-outline module for notebooks, NUCs and embedded systems.`,
      axes: ['speed', 'cap'],
      variants: speeds.flatMap(([speed, cl, cs]) => cs.map(cap => ({ speed, cl, cap }))),
      specs: { Platform: 'Laptop / notebook', Pins: spin, Voltage: volt, 'Operating temp.': '0–85 °C', Dimensions: '69.6 × 30 × 3.9 mm' },
      vspecs: ['cl'],
    },
  ]),
  // ---------------- Industrial ----------------
  {
    id: 'ind-sata', cat: 'ind', name: 'Industrial SATA SSD', tag: 'SATA III · wide temperature', img: 'm2-2242-sata', scale: 'sata25',
    desc: 'Wide-temperature SATA drives for outdoor, automotive and factory equipment.',
    axes: ['ff', 'temp', 'cap'],
    variants: ['2.5"', 'mSATA', 'M.2 2280', 'M.2 2242'].flatMap(ff => ['−40 to 85 °C', '−20 to 85 °C'].flatMap(temp => ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(cap => ({ ff, temp, cap })))),
    imgBy: { ff: { '2.5"': 'sata25', mSATA: 'msata', 'M.2 2280': 'm2-2280-sata', 'M.2 2242': 'm2-2242-sata' } },
    scaleBy: { ff: { '2.5"': 'sata25', mSATA: 'msata', 'M.2 2280': 'm2280', 'M.2 2242': 'm2242' } },
    specs: { Interface: 'SATA 3.0', 'Storage temp.': '−40 to 85 °C', Testing: 'Multi-stage temperature screening', Customization: 'Firmware, labels and BOM locking' },
  },
  {
    id: 'ind-nvme', cat: 'ind', name: 'Industrial NVMe SSD', tag: 'PCIe 3.0 ×4 · wide temperature', img: 'nvme-gen3', scale: 'm2280',
    desc: 'NVMe performance in M.2 for edge AI boxes, robotics and vehicle computers.',
    axes: ['ff', 'temp', 'cap'],
    variants: ['M.2 2280', 'M.2 2242'].flatMap(ff => ['−40 to 85 °C', '−20 to 85 °C'].flatMap(temp => ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'].map(cap => ({ ff, temp, cap })))),
    imgBy: { ff: { 'M.2 2280': 'nvme-gen3', 'M.2 2242': 'm2-2242-sata' } },
    scaleBy: { ff: { 'M.2 2280': 'm2280', 'M.2 2242': 'm2242' } },
    specs: { Interface: 'PCIe 3.0 ×4, NVMe', 'Storage temp.': '−40 to 85 °C', Testing: 'Multi-stage temperature screening', Customization: 'Firmware, labels and BOM locking' },
  },
  {
    id: 'ind-ddr', cat: 'ind', name: 'Industrial DDR3 / DDR4', tag: 'SO-DIMM & U-DIMM · wide temperature', img: 'ddr4-sodimm', scale: 'sodimm',
    desc: 'Memory screened for −40 °C starts and 85 °C enclosures, in both module sizes.',
    axes: ['gen', 'ff', 'temp', 'cap'],
    variants: [
      ...['SO-DIMM', 'U-DIMM'].flatMap(ff => ['−40 to 85 °C', '−20 to 85 °C'].flatMap(temp => ['2GB', '4GB', '8GB'].map(cap => ({ gen: 'DDR3', ff, temp, cap, speed: '1333 / 1600 MHz' })))),
      ...['SO-DIMM', 'U-DIMM'].flatMap(ff => ['−40 to 85 °C', '−20 to 85 °C'].flatMap(temp => ['4GB', '8GB', '16GB', '32GB'].map(cap => ({ gen: 'DDR4', ff, temp, cap, speed: '2400 / 2666 / 3200 MHz' })))),
    ],
    imgBy: { gen: { DDR3: 'ddr3-sodimm', DDR4: 'ddr4-sodimm' }, ff: { 'U-DIMM': null } },
    scaleBy: { ff: { 'SO-DIMM': 'sodimm', 'U-DIMM': 'udimm' } },
    vspecs: ['speed'],
    specs: { Applications: 'Industrial PCs, robotics, vehicles, GPS, medical, drones', Testing: 'Multi-stage temperature screening', Customization: 'SPD, labels and BOM locking' },
  },
  // ---------------- Portable & flash ----------------
  {
    id: 'pssd', cat: 'flash', name: 'Portable SSD', tag: 'USB-C 3.1', img: 'pssd-pe100', scale: 'pe100',
    desc: 'Pocket drives with USB-C for backup, media and field data transfer.',
    axes: ['model', 'cap'],
    variants: [['PE100', '10 Gbps', '98 × 45 × 14 mm'], ['PS100', '5 Gbps', '86.5 × 58 × 9 mm'], ['PX100', '5 / 20 Gbps', '60 × 60 × 8 mm']]
      .flatMap(([model, link, dims]) => ['256GB', '512GB', '1TB', '2TB', '4TB'].map(cap => ({ model, link, dims, cap }))),
    imgBy: { model: { PE100: 'pssd-pe100', PS100: 'pssd-ps100', PX100: 'pssd-px100' } },
    scaleBy: { model: { PE100: 'pe100', PS100: 'ps100', PX100: 'px100' } },
    vspecs: ['link', 'dims'],
    specs: { Interface: 'USB Type-C 3.1' },
  },
  {
    id: 'usb', cat: 'flash', name: 'USB flash drive', tag: 'USB 2.0 · 3.0 · 3.1', img: 'usb-x110', scale: 'usb',
    desc: 'Metal and swivel USB drives, including a dual Type-A / Type-C model.',
    axes: ['model', 'cap'],
    variants: [
      ...['32GB', '64GB', '128GB', '256GB'].map(cap => ({ model: 'X100', cap, bus: 'USB 3.1', plug: 'Type-A', read: 130, write: 60 })),
      ...['32GB', '64GB', '128GB', '256GB'].map(cap => ({ model: 'X110', cap, bus: 'USB 3.1', plug: 'Type-A + Type-C', read: 130, write: 60 })),
      ...['32GB', '64GB', '128GB', '256GB'].map(cap => ({ model: 'S100', cap, bus: 'USB 3.0', plug: 'Type-A', read: 130, write: 60 })),
      ...['8GB', '16GB', '32GB', '64GB', '128GB'].map(cap => ({ model: 'B100', cap, bus: 'USB 2.0', plug: 'Type-A', read: 23, write: 15 })),
      ...['8GB', '16GB', '32GB', '64GB', '128GB', '256GB'].map(cap => ({ model: 'X120', cap, bus: 'USB 2.0', plug: 'Type-A', read: 23, write: 15 })),
    ],
    imgBy: { model: { X100: 'usb-x100', X110: 'usb-x110', S100: 'usb-s100', B100: 'usb-b100', X120: 'usb-x120' } },
    vspecs: ['bus', 'plug'],
    specs: { Note: 'B100 and X120 also come in 128 MB to 4 GB sizes on request' },
  },
  {
    id: 'cards', cat: 'flash', name: 'microSD & SD cards', tag: 'UHS-I · SD 3.0 · SD 2.0', img: 'card-tf', scale: 'microsd',
    desc: 'Cards for cameras, dashcams, drones and IoT devices.',
    axes: ['type', 'cap'],
    variants: [
      ...['128GB', '256GB', '512GB'].map(cap => ({ type: 'microSD high-speed', cap, std: 'SD 3.0 (UHS-I)', read: 180, write: 150, dims: '15 × 11 × 1.0 mm' })),
      ...['16GB', '32GB', '64GB', '128GB', '256GB'].map(cap => ({ type: 'microSD 3.0', cap, std: 'SD 3.0', read: 95, write: 75, dims: '15 × 11 × 1.0 mm' })),
      ...['16GB', '32GB', '64GB', '128GB'].map(cap => ({ type: 'microSD 2.0', cap, std: 'SD 2.0', read: 23, write: 10, dims: '15 × 11 × 1.0 mm' })),
      ...['16GB', '32GB', '64GB', '128GB', '256GB'].map(cap => ({ type: 'SD 3.0', cap, std: 'SD 3.0', read: 95, write: 75, dims: '32 × 24 × 2.1 mm' })),
      ...['16GB', '32GB', '64GB', '128GB'].map(cap => ({ type: 'SD 2.0', cap, std: 'SD 2.0', read: 23, write: 10, dims: '32 × 24 × 2.1 mm' })),
    ],
    imgBy: { type: { 'microSD high-speed': 'card-tf', 'microSD 3.0': 'card-tf', 'microSD 2.0': 'card-tf', 'SD 3.0': 'card-sd', 'SD 2.0': 'card-sd' } },
    scaleBy: { type: { 'microSD high-speed': 'microsd', 'microSD 3.0': 'microsd', 'microSD 2.0': 'microsd', 'SD 3.0': 'sd', 'SD 2.0': 'sd' } },
    vspecs: ['std', 'dims'],
    specs: { 'Speed test': 'CrystalDiskMark, up to' },
  },
];

const AXIS = { cap: 'Capacity', speed: 'Speed', ff: 'Form factor', temp: 'Operating temp.', gen: 'Generation', model: 'Model', type: 'Type' };
const VSPEC = { cl: 'Timing', speed: 'Speed', link: 'Transfer rate', dims: 'Dimensions', bus: 'Interface', plug: 'Connector', std: 'Standard' };

// physical outlines in mm for the to-scale strip
const SCALE = {
  sata25: { w: 100, h: 70, label: '2.5"', sub: '100 × 70' },
  msata: { w: 51, h: 30, label: 'mSATA', sub: '51 × 30' },
  m2280: { w: 80, h: 22, label: 'M.2 2280', sub: '80 × 22', m2: true },
  m2242: { w: 42, h: 22, label: 'M.2 2242', sub: '42 × 22', m2: true },
  udimm: { w: 133.35, h: 30, label: 'UDIMM', sub: '133 × 30', dimm: true },
  sodimm: { w: 69.6, h: 30, label: 'SO-DIMM', sub: '70 × 30', dimm: true },
  pe100: { w: 98, h: 45, label: 'PE100', sub: '98 × 45', round: 6 },
  ps100: { w: 86.5, h: 58, label: 'PS100', sub: '87 × 58', round: 5 },
  px100: { w: 60, h: 60, label: 'PX100', sub: '60 × 60', round: 30 },
  sd: { w: 24, h: 32, label: 'SD', sub: '32 × 24', sd: true },
  microsd: { w: 11, h: 15, label: 'microSD', sub: '15 × 11', sd: true },
};
const SCALE_FAM = { sata25: 'sata25', msata: 'msata', m2280: 'nvme-gen4', m2242: 'm2-2242-sata', udimm: 'ddr5-udimm', sodimm: 'ddr5-sodimm', pe100: 'pssd', ps100: 'pssd', px100: 'pssd', sd: 'cards', microsd: 'cards' };

/* ------------------------------------------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const capVal = c => { const m = /([\d.]+)\s*(MB|GB|TB)/.exec(c); return m ? +m[1] * ({ MB: 1 / 1024, GB: 1, TB: 1024 }[m[2]]) : 0; };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FAM = Object.fromEntries(FAMILIES.map(f => [f.id, f]));
const KEY = 'oberth.quote.v1';

let cat = 'ssd', fam = FAMILIES[0], sel = {}, qty = 1;

function axisValues(f, ax) {
  const vals = [...new Set(f.variants.map(v => v[ax]))];
  return ax === 'cap' ? vals.sort((a, b) => capVal(a) - capVal(b)) : vals;
}
function matching(f, s) { return f.variants.filter(v => Object.entries(s).every(([k, x]) => v[k] === x)); }
function current() { return matching(fam, sel)[0] || fam.variants[0]; }
function pickImg(f, v) {
  let img = f.img;
  if (f.imgBy) for (const [k, map] of Object.entries(f.imgBy)) { if (map[v[k]] !== undefined && map[v[k]] !== null) img = map[v[k]]; }
  if (f.id === 'ind-ddr' && v.ff === 'U-DIMM') img = v.gen === 'DDR3' ? 'ddr3-udimm' : 'ddr4-udimm';
  return `/marketplace/img/${img}.jpg`;
}
function pickScale(f, v) {
  let s = f.scale;
  if (f.scaleBy) for (const [k, map] of Object.entries(f.scaleBy)) if (map[v[k]]) s = map[v[k]];
  return s;
}
function variantLabel(f, v) { return f.axes.map(a => v[a]).join(' · '); }

/* ---------------- tabs + families ---------------- */
function renderTabs() {
  const t = $('#hwTabs');
  t.innerHTML = CATS.map(c => `<button role="tab" data-c="${c.id}" aria-selected="${c.id === cat}"><b>${c.name}</b><em>${c.note}</em></button>`).join('') + '<i class="hw-ink" aria-hidden="true"></i>';
  $$('button', t).forEach(b => b.onclick = () => { cat = b.dataset.c; renderTabs(); renderFams(); setFam(FAMILIES.find(f => f.cat === cat)); });
  requestAnimationFrame(moveInk);
}
function moveInk() {
  const t = $('#hwTabs'), b = $('button[aria-selected=true]', t), ink = $('.hw-ink', t);
  if (!b || !ink) return;
  ink.style.width = b.offsetWidth + 'px'; ink.style.transform = `translateX(${b.offsetLeft}px)`;
}
function renderFams() {
  const list = FAMILIES.filter(f => f.cat === cat);
  $('#hwFams').innerHTML = list.map(f => `<button data-f="${f.id}" aria-pressed="${f === fam}"><img src="/marketplace/img/${f.img}.jpg" alt="" loading="lazy"><span><b>${esc(f.name)}</b><em>${esc(f.tag)}</em></span></button>`).join('');
  $$('#hwFams button').forEach(b => b.onclick = () => setFam(FAM[b.dataset.f]));
}

function setFam(f, keepSel) {
  fam = f;
  if (!keepSel) { const v = f.variants[Math.min(f.variants.length - 1, Math.floor(f.variants.length / 2))]; sel = {}; f.axes.forEach(a => sel[a] = v[a]); }
  qty = 1;
  $$('#hwFams button').forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f.id));
  renderStage(true);
  highlightScale();
  highlightPerf();
}

/* ---------------- stage ---------------- */
function renderStage(swap) {
  const v = current();
  const img = $('#hwImg');
  const src = pickImg(fam, v);
  if (!img.src.endsWith(src)) {
    const stage = $('#hwVis');
    stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap');
    setTimeout(() => { img.style.maxWidth = img.style.maxHeight = ''; img.src = src; img.alt = `${fam.name} product photo`; }, reduce ? 0 : 160);
  }
  $('#hwCat').textContent = CATS.find(c => c.id === fam.cat).name;
  $('#hwName').textContent = fam.name;
  $('#hwTag').textContent = fam.tag;
  $('#hwDesc').textContent = fam.desc;
  const sc = SCALE[pickScale(fam, v)];
  $('#hwDim').textContent = sc ? `${sc.label} · ${sc.sub} mm` : fam.tag;
  // option chips
  $('#hwOpts').innerHTML = fam.axes.map(ax => {
    const vals = axisValues(fam, ax);
    return `<div class="hw-opt"><span class="mono">${AXIS[ax]}</span><div class="hw-chips" role="radiogroup" aria-label="${AXIS[ax]}">${vals.map(x => {
      const trial = { ...sel, [ax]: x };
      const ok = matching(fam, trial).length > 0;
      return `<button role="radio" aria-checked="${sel[ax] === x}" data-ax="${ax}" data-v="${esc(x)}" class="${ok ? '' : 'na'}">${esc(x)}</button>`;
    }).join('')}</div></div>`;
  }).join('');
  $$('#hwOpts button').forEach(b => b.onclick = () => {
    const ax = b.dataset.ax, x = b.dataset.v;
    sel[ax] = x;
    if (!matching(fam, sel).length) {
      // keep the clicked value, relax later axes
      const i = fam.axes.indexOf(ax);
      for (const a of fam.axes.slice(i + 1)) { const cand = matching(fam, Object.fromEntries(Object.entries(sel).filter(([k]) => k !== a)))[0]; if (cand) sel[a] = cand[a]; }
      if (!matching(fam, sel).length) { const c = fam.variants.find(vv => vv[ax] === x); fam.axes.forEach(a => sel[a] = c[a]); }
    }
    renderStage(); highlightScale();
  });
  // meters
  const max = fam.cat === 'flash' ? 200 : 5000;
  const met = $('#hwMeters');
  if (v.read || v.write) {
    met.hidden = false;
    for (const [k, val] of [['read', v.read], ['write', v.write]]) {
      const row = $(`.hw-m[data-k="${k}"]`, met);
      row.querySelector('i').style.width = `${Math.min(100, (val || 0) / max * 100)}%`;
      countTo(row.querySelector('b'), val || 0);
    }
    $('#hwMeterNote').textContent = fam.cat === 'flash' ? 'Up to, MB/s · scale 200' : 'Sequential, up to, MB/s · scale 5,000';
  } else met.hidden = true;
  // specs
  const rows = [];
  for (const k of fam.vspecs || []) if (v[k]) rows.push([VSPEC[k], v[k]]);
  for (const [k, x] of Object.entries(fam.specs)) rows.push([k, x]);
  $('#hwSpecs').innerHTML = rows.map(([k, x], i) => `<div style="--d:${i * 40}ms"><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('');
  $('#hwSpecs').classList.remove('in'); void $('#hwSpecs').offsetWidth; $('#hwSpecs').classList.add('in');
  $('#hwQty').value = qty;
  $('#hwSel').textContent = variantLabel(fam, v);
  const ref = fam.ref ? `Quotation items ${fam.ref[0]}–${fam.ref[1]}` : 'Catalog item';
  $('#hwRef').textContent = ref;
}

function countTo(el, to) {
  const from = +(el.dataset.v || 0); el.dataset.v = to;
  if (reduce || from === to) { el.textContent = to.toLocaleString(); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------------- to-scale strip ---------------- */
function renderScale() {
  const rows = [['sata25', 'msata', 'm2280', 'm2242', 'sd', 'microsd'], ['udimm', 'sodimm', 'pe100', 'px100']];
  const k = 1.7, gap = 24, lab = 42; let y0 = 8, W = 0; const parts = [];
  for (const row of rows) {
    const rh = Math.max(...row.map(r => SCALE[r].h)) * k, base = y0 + rh;
    let x = 10;
    for (const key of row) {
      const s = SCALE[key], w = s.w * k, h = s.h * k, y = base - h;
      let shape;
      if (s.m2) shape = `<path d="M${x} ${y} h${w - 10} v${h * .3} h5 v${h * .16} h-5 v${h * .54} h${-(w - 10)} z"/><circle cx="${x + 5}" cy="${y + h / 2}" r="2.6"/>`;
      else if (s.dimm) shape = `<path d="M${x} ${y} h${w} v${h} h${-(w * .58)} v-4 h-5 v4 h${-(w * .42 - 5)} z"/>${Array.from({ length: Math.floor(w / 8) }, (_, i) => `<line x1="${x + 5 + i * 8}" y1="${base - 5}" x2="${x + 5 + i * 8}" y2="${base - 1}"/>`).join('')}`;
      else if (s.sd) shape = `<path d="M${x} ${y + 5} l5 -5 h${w - 5} v${h} h${-w} z"/>`;
      else shape = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(s.round || 3, h / 2)}"/>`;
      parts.push(`<g class="sc" data-s="${key}" tabindex="0" role="button" aria-label="${s.label}, ${s.sub} mm"><g class="sc-shape">${shape}</g><text x="${x + w / 2}" y="${base + 17}" text-anchor="middle">${s.label}</text><text class="sub" x="${x + w / 2}" y="${base + 30}" text-anchor="middle">${s.sub} mm</text></g>`);
      x += Math.max(w, 64) + gap;
    }
    W = Math.max(W, x); y0 = base + lab;
  }
  $('#hwScale').innerHTML = `<svg viewBox="0 0 ${W - gap + 10} ${y0}">${parts.join('')}</svg>`;
  $$('#hwScale .sc').forEach(g => {
    const go = () => { const f = FAM[SCALE_FAM[g.dataset.s]]; if (!f) return; cat = f.cat; renderTabs(); renderFams();
      const want = { px100: 'PX100', ps100: 'PS100', pe100: 'PE100' }[g.dataset.s], wantT = { sd: 'SD 3.0', microsd: 'microSD high-speed' }[g.dataset.s];
      if (want || wantT) { const v = f.variants.find(v => v.model === want || v.type === wantT); sel = {}; f.axes.forEach(a => sel[a] = v[a]); setFam(f, true); } else setFam(f); };
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  highlightScale();
}
function highlightScale() {
  const s = pickScale(fam, current());
  $$('#hwScale .sc').forEach(g => g.classList.toggle('on', g.dataset.s === s));
}

/* ---------------- performance chart ---------------- */
let perfMode = 'read';
function renderPerf() {
  const fams = FAMILIES.filter(f => f.cat === 'ssd');
  const max = 5000;
  $('#hwPerf').innerHTML = fams.map(f => {
    const best = Math.max(...f.variants.map(v => v[perfMode] || 0));
    return `<button class="pf" data-f="${f.id}"><span class="pf-n">${esc(f.name.replace(' SSD', ''))}</span><span class="pf-t"><i style="--w:${(best / max * 100).toFixed(1)}%"></i></span><b>${best.toLocaleString()}</b></button>`;
  }).join('');
  $$('#hwPerf .pf').forEach(b => b.onclick = () => { cat = 'ssd'; renderTabs(); renderFams(); setFam(FAM[b.dataset.f]); $('#hwStageTop').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  highlightPerf();
  const box = $('#hwPerf');
  if (box.classList.contains('drawn')) { box.classList.remove('drawn'); requestAnimationFrame(() => requestAnimationFrame(() => box.classList.add('drawn'))); }
}
function highlightPerf() { $$('#hwPerf .pf').forEach(b => b.classList.toggle('on', b.dataset.f === fam.id)); }

/* ---------------- catalog table ---------------- */
function allRows() {
  const out = [];
  for (const f of FAMILIES) for (const v of f.variants) {
    const speed = v.read ? `${v.read.toLocaleString()} / ${v.write.toLocaleString()}` : (v.link || v.speed || '');
    out.push({ f, v, cat: f.cat, name: f.name, opt: f.axes.filter(a => a !== 'cap').map(a => v[a]).join(' · '), cap: v.cap, capV: capVal(v.cap), speed, speedV: v.read || 0, iface: f.specs.Interface || f.tag });
  }
  return out;
}
const ROWS = allRows();
let tf = { q: '', cat: '', sort: 'cat', dir: 1 };
function renderTable() {
  const q = tf.q.toLowerCase();
  let rows = ROWS.filter(r => (!tf.cat || r.cat === tf.cat) && (!q || `${r.name} ${r.opt} ${r.cap} ${r.iface}`.toLowerCase().includes(q)));
  const key = { cat: r => CATS.findIndex(c => c.id === r.cat) * 1e6 + FAMILIES.indexOf(r.f) * 1e3 + r.capV / 10, name: r => r.name, cap: r => r.capV, speed: r => r.speedV }[tf.sort];
  rows = rows.slice().sort((a, b) => { const x = key(a), y = key(b); return (x > y ? 1 : x < y ? -1 : 0) * tf.dir; });
  $('#hwCount').textContent = `${rows.length} item${rows.length === 1 ? '' : 's'}`;
  $('#hwRows').innerHTML = rows.map((r, i) => `<tr style="--d:${Math.min(i, 20) * 18}ms">
    <td><span class="cat-dot c-${r.cat}"></span>${esc(CATS.find(c => c.id === r.cat).name)}</td>
    <td><button class="tl" data-f="${r.f.id}" data-i="${r.f.variants.indexOf(r.v)}">${esc(r.name)}</button>${r.opt ? `<em>${esc(r.opt)}</em>` : ''}</td>
    <td>${esc(r.cap)}</td><td class="num">${esc(r.speed)}</td>
    <td><button class="add-s" data-f="${r.f.id}" data-i="${r.f.variants.indexOf(r.v)}" aria-label="Add ${esc(r.name)} ${esc(r.cap)} to quote">+ Add</button></td></tr>`).join('') || `<tr><td colspan="5" class="empty">No matches. Try a different search.</td></tr>`;
  $$('#hwRows .tl').forEach(b => b.onclick = () => { const f = FAM[b.dataset.f], v = f.variants[+b.dataset.i]; cat = f.cat; renderTabs(); renderFams(); sel = {}; f.axes.forEach(a => sel[a] = v[a]); setFam(f, true); $('#hwStageTop').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $$('#hwRows .add-s').forEach(b => b.onclick = e => { const f = FAM[b.dataset.f], v = f.variants[+b.dataset.i]; addToQuote(f, v, 1, b); });
  $$('#hwTable th[data-s]').forEach(th => th.setAttribute('aria-sort', th.dataset.s === tf.sort ? (tf.dir > 0 ? 'ascending' : 'descending') : 'none'));
}
function initTable() {
  $('#hwFilter').innerHTML = `<button aria-pressed="true" data-c="">All</button>` + CATS.map(c => `<button aria-pressed="false" data-c="${c.id}">${c.name}</button>`).join('');
  $$('#hwFilter button').forEach(b => b.onclick = () => { tf.cat = b.dataset.c; $$('#hwFilter button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderTable(); });
  $('#hwSearch').addEventListener('input', e => { tf.q = e.target.value; renderTable(); });
  $$('#hwTable th[data-s]').forEach(th => th.querySelector('button').onclick = () => { const s = th.dataset.s; tf.dir = tf.sort === s ? -tf.dir : 1; tf.sort = s; renderTable(); });
  renderTable();
}

/* ---------------- quote list ---------------- */
let quote = [];
try { quote = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { quote = []; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(quote)); } catch { /* private mode */ } };
function addToQuote(f, v, n, from) {
  const label = variantLabel(f, v);
  const id = `${f.id}|${label}`;
  const hit = quote.find(q => q.id === id);
  if (hit) hit.qty += n; else quote.push({ id, fam: f.id, name: f.name, label, qty: n, img: pickImg(f, v) });
  save(); renderQuote(); fly(from, pickImg(f, v));
}
function fly(from, src) {
  const fab = $('#qFab');
  fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump');
  if (reduce || !from) return;
  const a = from.getBoundingClientRect(), b = fab.getBoundingClientRect();
  const d = document.createElement('img');
  d.src = src; d.className = 'flyer';
  d.style.left = a.left + a.width / 2 - 30 + 'px'; d.style.top = a.top + a.height / 2 - 30 + 'px';
  document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.25)`; d.style.opacity = '.2'; });
  setTimeout(() => d.remove(), 800);
}
function renderQuote() {
  const n = quote.reduce((s, q) => s + q.qty, 0);
  $('#qCount').textContent = n;
  $('#qFab').classList.toggle('has', n > 0);
  $('#qList').innerHTML = quote.length ? quote.map((q, i) => `<li>
      <div class="qi-img"><img src="${q.img}" alt=""></div>
      <div class="qi-t"><b>${esc(q.name)}</b><em>${esc(q.label)}</em></div>
      <div class="qty"><button data-i="${i}" data-d="-1" aria-label="Decrease">−</button><input data-i="${i}" value="${q.qty}" inputmode="numeric" aria-label="Quantity"><button data-i="${i}" data-d="1" aria-label="Increase">+</button></div>
      <button class="qi-x" data-x="${i}" aria-label="Remove">✕</button></li>`).join('')
    : `<li class="q-empty"><b>Your quote list is empty.</b><em>Add parts from the catalog; we reply with pricing, MOQ and lead times.</em></li>`;
  $$('#qList [data-d]').forEach(b => b.onclick = () => { const q = quote[+b.dataset.i]; q.qty = Math.max(1, q.qty + +b.dataset.d); save(); renderQuote(); });
  $$('#qList input').forEach(inp => inp.onchange = () => { const q = quote[+inp.dataset.i]; q.qty = Math.max(1, parseInt(inp.value, 10) || 1); save(); renderQuote(); });
  $$('#qList [data-x]').forEach(b => b.onclick = () => { quote.splice(+b.dataset.x, 1); save(); renderQuote(); });
  $('#qSend').classList.toggle('dis', !quote.length);
  $('#qSend').href = quote.length ? mailto() : '#';
}
function mailto() {
  const co = $('#qCo').value.trim(), note = $('#qNote').value.trim();
  const lines = quote.map((q, i) => `${i + 1}. ${q.name} · ${q.label} × ${q.qty}`).join('\n');
  const body = `Hi Daniel,\n\nPlease quote the following CS Storage parts:\n\n${lines}\n\n${co ? `Company: ${co}\n` : ''}${note ? `Notes: ${note}\n` : ''}\nPlease include unit price, MOQ and lead time.\n\nThanks`;
  return `mailto:daniel@oberth.org?subject=${encodeURIComponent(`Hardware quote request (${quote.length} line${quote.length > 1 ? 's' : ''})`)}&body=${encodeURIComponent(body)}`;
}
function initQuote() {
  const dr = $('#qDrawer'), fab = $('#qFab');
  const open = o => { dr.classList.toggle('open', o); dr.setAttribute('aria-hidden', !o); fab.setAttribute('aria-expanded', o); document.body.classList.toggle('q-open', o); if (o) setTimeout(() => $('#qClose').focus(), 50); };
  fab.onclick = () => open(!dr.classList.contains('open'));
  $('#qClose').onclick = () => open(false);
  $('#qScrim').onclick = () => open(false);
  addEventListener('keydown', e => { if (e.key === 'Escape' && dr.classList.contains('open')) open(false); });
  $('#qCo').oninput = $('#qNote').oninput = () => { if (quote.length) $('#qSend').href = mailto(); };
  $('#qSend').onclick = e => { if (!quote.length) e.preventDefault(); };
  $('#qClear').onclick = () => { quote = []; save(); renderQuote(); };
  $('#qCopy').onclick = async () => {
    const txt = quote.map((q, i) => `${i + 1}. ${q.name} · ${q.label} × ${q.qty}`).join('\n');
    try { await navigator.clipboard.writeText(txt); $('#qCopy').textContent = 'Copied'; setTimeout(() => ($('#qCopy').textContent = 'Copy list'), 1400); } catch { /* ignore */ }
  };
  renderQuote();
  // stage add
  $('#hwAdd').onclick = () => addToQuote(fam, current(), qty, $('#hwImg'));
  $('#hwMinus').onclick = () => { qty = Math.max(1, qty - 1); $('#hwQty').value = qty; };
  $('#hwPlus').onclick = () => { qty += 1; $('#hwQty').value = qty; };
  $('#hwQty').onchange = e => { qty = Math.max(1, parseInt(e.target.value, 10) || 1); e.target.value = qty; };
  // show the floating button only around the catalog
  const io = new IntersectionObserver(es => es.forEach(e => fab.classList.toggle('show', e.isIntersecting || quote.length > 0)), { rootMargin: '0px 0px -30% 0px' });
  io.observe($('#hardware'));
}

/* ---------------- tilt on the product tile ---------------- */
function initTilt() {
  const vis = $('#hwVis');
  if (reduce || !matchMedia('(pointer:fine)').matches) return;
  vis.addEventListener('pointermove', e => {
    const r = vis.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    vis.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`); vis.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
    vis.style.setProperty('--gx', `${(x + .5) * 100}%`); vis.style.setProperty('--gy', `${(y + .5) * 100}%`);
  });
  vis.addEventListener('pointerleave', () => { vis.style.setProperty('--rx', '0deg'); vis.style.setProperty('--ry', '0deg'); });
}

function init() {
  if (!$('#hardware')) return;
  // small source photos: cap the upscale so they stay sharp
  $('#hwImg').addEventListener('load', e => { const im = e.target; if (im.naturalWidth < 520) { im.style.maxWidth = im.naturalWidth * 1.35 + 'px'; im.style.maxHeight = im.naturalHeight * 1.35 + 'px'; } });
  renderTabs(); renderFams(); setFam(fam); renderScale(); renderPerf(); initTable(); initQuote(); initTilt();
  $$('#hwPerfMode button').forEach(b => b.onclick = () => { perfMode = b.dataset.m; $$('#hwPerfMode button').forEach(x => x.setAttribute('aria-pressed', x === b)); renderPerf(); });
  addEventListener('resize', moveInk);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); } }), { threshold: .3 });
  $$('#hwScale, #hwPerf').forEach(el => io.observe(el));
  // deep link: #hardware-ssd etc.
  const m = /^#hw-([a-z0-9-]+)$/.exec(location.hash);
  if (m && FAM[m[1]]) { cat = FAM[m[1]].cat; renderTabs(); renderFams(); setFam(FAM[m[1]]); }
}
init();
