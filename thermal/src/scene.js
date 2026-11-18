// Oberth thermal explorer: an axonometric (orthographic) 3D model of a hybrid
// liquid/air-cooled AI hall built from TONFY products. Units are procedural
// models; clicking one explodes it into labelled parts.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = t => 1 - Math.pow(1 - t, 3);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const SUPPLY = new THREE.Color(0x5aa9ff);
const RETURN = new THREE.Color(0xff7a59);

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */
function makeMaterialKit() {
  const kit = {
    body: new THREE.MeshStandardMaterial({ color: 0x363b45, roughness: .58, metalness: .25 }),
    bodyLight: new THREE.MeshStandardMaterial({ color: 0xd9dce1, roughness: .55, metalness: .15 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1e2128, roughness: .66, metalness: .2 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xb8bec8, roughness: .32, metalness: .85 }),
    coil: new THREE.MeshStandardMaterial({ color: 0x3f74c4, roughness: .45, metalness: .5 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xc58a5c, roughness: .35, metalness: .9 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x4f9dff, emissiveIntensity: .9, roughness: .3 }),
    blade: new THREE.MeshStandardMaterial({ color: 0x0f1013, roughness: .5, metalness: .4 }),
    supply: new THREE.MeshStandardMaterial({ color: 0x5aa9ff, emissive: 0x1d4f8f, emissiveIntensity: .6, roughness: .4 }),
    ret: new THREE.MeshStandardMaterial({ color: 0xff7a59, emissive: 0x8f2f1a, emissiveIntensity: .55, roughness: .4 }),
    liquid: new THREE.MeshStandardMaterial({ color: 0x58c4dc, emissive: 0x0d4a5a, emissiveIntensity: .5, roughness: .1, metalness: 0, transparent: true, opacity: .42, depthWrite: false }),
    led: new THREE.MeshBasicMaterial({ color: 0x7dd3fc }),
    line: new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .16 }),
  };
  for (const k in kit) kit[k].userData.baseOpacity = kit[k].opacity;
  return kit;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                    */
/* ------------------------------------------------------------------ */
const geoCache = new Map();
function boxGeo(w, h, d) {
  const k = `b${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.BoxGeometry(w, h, d));
  return geoCache.get(k);
}
function edgesFor(geo) {
  const k = geo.uuid;
  if (!geoCache.has(k)) geoCache.set(k, new THREE.EdgesGeometry(geo, 28));
  return geoCache.get(k);
}
// box with its bottom at y0
function box(kit, mat, w, h, d, x = 0, y0 = 0, z = 0, edges = true) {
  const m = new THREE.Mesh(boxGeo(w, h, d), mat);
  m.position.set(x, y0 + h / 2, z);
  if (edges) m.add(new THREE.LineSegments(edgesFor(m.geometry), kit.line));
  return m;
}
function cyl(kit, mat, r, h, x, y, z, axis = 'y', seg = 24, edges = false) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  if (edges) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 40), kit.line));
  return m;
}
// fan: housing ring + hub + blades, facing +z by default
function fan(kit, r, x, y, z, facing = 'z') {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * .08, 8, 32), kit.steel);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r * .98, 32), kit.blade);
  disc.position.z = -.005;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * .22, r * .22, r * .18, 16), kit.dark);
  hub.rotation.x = Math.PI / 2;
  const rotor = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(boxGeo(r * .78, r * .2, .01), kit.dark);
    b.position.x = r * .45;
    const p = new THREE.Group();
    p.rotation.z = (i / 5) * Math.PI * 2;
    b.rotation.x = .5;
    p.add(b);
    rotor.add(p);
  }
  rotor.userData.spin = true;
  g.add(disc, ring, hub, rotor);
  g.position.set(x, y, z);
  if (facing === 'y') g.rotation.x = -Math.PI / 2;
  if (facing === '-z') g.rotation.y = Math.PI;
  if (facing === 'x') g.rotation.y = Math.PI / 2;
  if (facing === '-x') g.rotation.y = -Math.PI / 2;
  return g;
}
// finned coil panel: slab + fin lines
function coilPanel(kit, w, h, d) {
  const g = new THREE.Group();
  const slab = new THREE.Mesh(boxGeo(w, h, d), kit.coil);
  g.add(slab);
  slab.add(new THREE.LineSegments(edgesFor(slab.geometry), kit.line));
  const n = Math.max(6, Math.round(w / .07));
  const pts = [];
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + (i / n) * w;
    pts.push(x, -h / 2, d / 2 + .002, x, h / 2, d / 2 + .002);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, kit.line));
  return g;
}

/* ------------------------------------------------------------------ */
/* Unit factories. Each returns { group, parts:[{obj, ex}], ports }.   */
/* Local origin: floor centre of the unit; front faces +z.            */
/* ------------------------------------------------------------------ */
function part(obj, ex) { return { obj, ex }; }

const FACTORIES = {
  'cabinet-cdu'(kit) {
    const W = .6, H = 2.0, D = 1.2, g = new THREE.Group(), parts = [];
    const shell = new THREE.Group();
    shell.add(box(kit, kit.body, W, H, D, 0, 0, 0));
    // door seams + vent slots
    shell.add(box(kit, kit.dark, W * .9, .02, .005, 0, 1.1, D / 2 + .003, false));
    for (let i = 0; i < 7; i++) shell.add(box(kit, kit.dark, W * .6, .012, .004, 0, .2 + i * .05, D / 2 + .003, false));
    parts.push(part(shell, V(0, 0, -1.7)));
    const hmi = new THREE.Group();
    hmi.add(box(kit, kit.dark, .26, .18, .02, 0, 1.42, D / 2 + .01));
    hmi.add(box(kit, kit.screen, .22, .14, .005, 0, 1.44, D / 2 + .022, false));
    parts.push(part(hmi, V(0, .55, 1.25)));
    const plc = new THREE.Group();
    plc.add(box(kit, kit.bodyLight, .42, .3, .14, 0, 1.6, -.3));
    for (let i = 0; i < 6; i++) plc.add(box(kit, kit.dark, .05, .12, .02, -.15 + i * .06, 1.68, -.22, false));
    parts.push(part(plc, V(-.95, 1.25, .55)));
    const hx = new THREE.Group();
    for (let i = 0; i < 9; i++) hx.add(box(kit, i % 2 ? kit.steel : kit.bodyLight, .32, .62, .022, 0, .78, -.1 + i * .028, i === 0 || i === 8));
    hx.add(box(kit, kit.steel, .36, .05, .3, 0, 1.4, .01));
    hx.add(box(kit, kit.steel, .36, .05, .3, 0, .73, .01));
    parts.push(part(hx, V(-1.25, .15, .8)));
    const pumps = new THREE.Group();
    for (const zz of [-.18, .22]) {
      pumps.add(cyl(kit, kit.coil, .085, .26, .02, .3, zz, 'x', 20, true));
      pumps.add(cyl(kit, kit.steel, .1, .08, -.17, .3, zz, 'x', 20, true));
      pumps.add(box(kit, kit.dark, .3, .06, .18, 0, .14, zz));
    }
    parts.push(part(pumps, V(1.2, 0, .8)));
    const filter = new THREE.Group();
    filter.add(cyl(kit, kit.steel, .07, .42, .18, 1.0, .3, 'y', 20, true));
    filter.add(cyl(kit, kit.dark, .08, .05, .18, 1.23, .3, 'y', 20));
    parts.push(part(filter, V(1.1, 1.05, .45)));
    const ports = new THREE.Group();
    ports.add(cyl(kit, kit.steel, .045, .6, -.16, 1.8, -.35, 'y', 16, true));
    ports.add(cyl(kit, kit.steel, .045, .6, .16, 1.8, -.35, 'y', 16, true));
    ports.add(cyl(kit, kit.supply, .05, .05, -.16, 2.02, -.35));
    ports.add(cyl(kit, kit.ret, .05, .05, .16, 2.02, -.35));
    ports.add(cyl(kit, kit.steel, .04, .6, -.16, 1.8, .05, 'y', 16, true));
    ports.add(cyl(kit, kit.steel, .04, .6, .16, 1.8, .05, 'y', 16, true));
    parts.push(part(ports, V(0, 1.55, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(W, H, D) };
  },

  'inrack-cdu'(kit) {
    // a host rack (context) with the 4U CDU at the bottom
    const g = new THREE.Group(), parts = [], context = [];
    const rack = rackFrame(kit, .6, 2.2, 1.2, true);
    context.push(rack); g.add(rack);
    const y0 = .12, W = .445, H = .175, D = .9, z0 = .1;
    const lid = box(kit, kit.body, W, .02, D, 0, y0 + H - .02, z0);
    parts.push(part(lid, V(0, .55, 0)));
    const hmi = new THREE.Group();
    hmi.add(box(kit, kit.dark, W, H, .02, 0, y0, z0 + D / 2));
    hmi.add(box(kit, kit.screen, .16, .09, .004, -.08, y0 + .045, z0 + D / 2 + .012, false));
    parts.push(part(hmi, V(0, .05, .75)));
    const pumps = new THREE.Group();
    pumps.add(cyl(kit, kit.coil, .045, .18, -.12, y0 + .07, z0 + .12, 'z', 16, true));
    pumps.add(cyl(kit, kit.coil, .045, .18, -.12, y0 + .07, z0 - .12, 'z', 16, true));
    parts.push(part(pumps, V(-.65, .12, .25)));
    const hx = new THREE.Group();
    for (let i = 0; i < 7; i++) hx.add(box(kit, i % 2 ? kit.steel : kit.bodyLight, .16, .13, .018, .1, y0 + .02, z0 - .06 + i * .022, i === 0 || i === 6));
    parts.push(part(hx, V(.65, .15, .2)));
    const plc = box(kit, kit.bodyLight, .18, .08, .22, .1, y0 + .02, z0 + .3);
    parts.push(part(plc, V(.55, .3, .65)));
    const qc = new THREE.Group();
    for (const [x, m] of [[-.15, kit.supply], [-.05, kit.ret], [.05, kit.supply], [.15, kit.ret]]) {
      qc.add(cyl(kit, kit.steel, .018, .1, x, y0 + .08, z0 - D / 2 - .05, 'z', 12, true));
      qc.add(cyl(kit, m, .022, .02, x, y0 + .08, z0 - D / 2 - .1, 'z', 12));
    }
    parts.push(part(qc, V(0, .1, -.7)));
    const body = box(kit, kit.body, W, H - .02, D, 0, y0, z0);
    context.push(body); g.add(body);
    for (const p of parts) g.add(p.obj);
    // servers above the CDU
    const srv = serverStack(kit, 10, y0 + H + .05, .48, true);
    context.push(srv); g.add(srv);
    return { group: g, parts, context, size: V(.6, 2.2, 1.2) };
  },

  'lc-rack'(kit) {
    const g = new THREE.Group(), parts = [];
    const frame = rackFrame(kit, .6, 2.2, 1.2, false);
    parts.push(part(frame, V(0, 0, 0)));
    const servers = serverStack(kit, 9, .18, 0, true);
    servers.children.forEach((c, i) => (c.userData.ex = V(0, i * .1, 0)));
    parts.push(part(servers, V(0, .15, 1.35)));
    const mS = new THREE.Group(), mR = new THREE.Group();
    mS.add(box(kit, kit.steel, .05, 1.85, .05, -.2, .15, -.56));
    mR.add(box(kit, kit.steel, .05, 1.85, .05, .2, .15, -.56));
    for (let i = 0; i < 9; i++) {
      mS.add(cyl(kit, kit.supply, .016, .04, -.2, .3 + i * .2, -.53, 'z', 10));
      mR.add(cyl(kit, kit.ret, .016, .04, .2, .3 + i * .2, -.53, 'z', 10));
    }
    mS.add(cyl(kit, kit.supply, .03, .06, -.2, 2.03, -.56));
    mR.add(cyl(kit, kit.ret, .03, .06, .2, 2.03, -.56));
    parts.push(part(mS, V(-.55, .1, -.85)));
    parts.push(part(mR, V(.55, .1, -.85)));
    const hoses = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      for (const [x, m] of [[-.2, kit.supply], [.2, kit.ret]]) {
        const y = .3 + i * .2;
        const c = new THREE.CatmullRomCurve3([V(x, y, -.5), V(x * .8, y, -.42), V(x * .5, y - .02, -.34)]);
        hoses.add(new THREE.Mesh(new THREE.TubeGeometry(c, 6, .012, 6), m));
      }
    }
    parts.push(part(hoses, V(0, .1, -.45)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(.6, 2.2, 1.2) };
  },

  'immersion-tank'(kit) {
    const L = 1.8, H = 1.2, D = .8, g = new THREE.Group(), parts = [];
    const lid = new THREE.Group();
    lid.add(box(kit, kit.body, L, .06, D, 0, H, 0));
    lid.add(box(kit, kit.dark, L * .9, .012, .04, 0, H + .06, D / 2 - .06, false));
    parts.push(part(lid, V(0, 1.9, -.2)));
    const sleds = new THREE.Group();
    const n = 12;
    for (let i = 0; i < n; i++) {
      const s = new THREE.Group();
      s.add(box(kit, kit.dark, .045, .78, .62, 0, .3, 0));
      s.add(box(kit, kit.copper, .05, .14, .2, 0, .62, -.1, false));
      s.add(box(kit, kit.steel, .05, .06, .66, 0, 1.06, 0, false));
      s.position.x = -L / 2 + .2 + i * ((L - .4) / (n - 1));
      s.userData.ex = V((i - (n - 1) / 2) * .05, 0, 0);
      sleds.add(s);
    }
    parts.push(part(sleds, V(0, 1.05, 0)));
    const liquid = new THREE.Mesh(boxGeo(L - .08, .88, D - .08), kit.liquid);
    liquid.position.set(0, .06 + .44, 0);
    parts.push(part(liquid, V(0, 0, 1.35)));
    const body = new THREE.Group();
    // open-top tank: floor + 4 walls
    body.add(box(kit, kit.body, L, .06, D, 0, 0, 0));
    body.add(box(kit, kit.body, L, H - .06, .04, 0, .06, -D / 2 + .02));
    body.add(box(kit, kit.body, L, H - .06, .04, 0, .06, D / 2 - .02));
    body.add(box(kit, kit.body, .04, H - .06, D, -L / 2 + .02, .06, 0));
    body.add(box(kit, kit.body, .04, H - .06, D, L / 2 - .02, .06, 0));
    for (const x of [-.75, .75]) for (const z of [-.3, .3]) body.add(cyl(kit, kit.dark, .03, .06, x, -.03, z));
    parts.push(part(body, V(0, 0, 0)));
    const ports = new THREE.Group();
    ports.add(cyl(kit, kit.steel, .04, .3, L / 2 + .15, .35, -.2, 'x', 14, true));
    ports.add(cyl(kit, kit.steel, .04, .3, L / 2 + .15, .8, .2, 'x', 14, true));
    ports.add(cyl(kit, kit.supply, .05, .04, L / 2 + .3, .35, -.2, 'x', 14));
    ports.add(cyl(kit, kit.ret, .05, .04, L / 2 + .3, .8, .2, 'x', 14));
    parts.push(part(ports, V(.9, 0, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(L, H, D) };
  },

  'piping'(kit) {
    // prefabricated header skid, runs along local x
    const L = 9.6, g = new THREE.Group(), parts = [];
    const hS = new THREE.Group(), hR = new THREE.Group();
    hS.add(cyl(kit, kit.steel, .1, L, 0, .9, -.22, 'x', 24, true));
    hR.add(cyl(kit, kit.steel, .1, L, 0, .9, .22, 'x', 24, true));
    for (const [grp, m, z] of [[hS, kit.supply, -.22], [hR, kit.ret, .22]]) {
      for (let i = 0; i < 8; i++) grp.add(cyl(kit, m, .102, .05, -L / 2 + .4 + i * (L - .8) / 7, .9, z, 'x', 24));
    }
    parts.push(part(hS, V(0, .55, -.8)));
    parts.push(part(hR, V(0, .55, .8)));
    const tees = new THREE.Group();
    for (const x0 of [-4.56, -.18, .89]) {
      for (const [x, z] of [[x0, -.22], [x0 + .32, .22]]) {
        tees.add(cyl(kit, kit.steel, .06, .5, x, 1.2, z, 'y', 16, true));
        tees.add(box(kit, kit.dark, .18, .1, .1, x, 1.28, z));
        tees.add(cyl(kit, kit.coil, .03, .14, x, 1.38, z + .09, 'z', 12));
      }
    }
    parts.push(part(tees, V(0, 1.25, 0)));
    const spools = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const x = -L / 2 + 1 + i * ((L - 2) / 4);
      spools.add(box(kit, kit.dark, .08, .9, .7, x, 0, 0));
      spools.add(box(kit, kit.dark, .16, .05, .9, x, .76, 0));
    }
    parts.push(part(spools, V(0, -.0, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(L, 1.4, 1) };
  },

  'dry-cooler'(kit) {
    const L = 4.3, W = 2.3, H = 2.7, g = new THREE.Group(), parts = [];
    const fans = new THREE.Group();
    for (let i = 0; i < 4; i++) for (const z of [-.55, .55]) {
      const f = fan(kit, .42, -L / 2 + .55 + i * ((L - 1.1) / 3), H - .02, z, 'y');
      f.add(cyl(kit, kit.body, .47, .14, 0, 0, -.07, 'z', 32, true));
      fans.add(f);
    }
    fans.add(box(kit, kit.body, L, .06, W, 0, H - .14, 0));
    parts.push(part(fans, V(0, 1.7, 0)));
    const coils = new THREE.Group();
    for (const s of [-1, 1]) {
      const c = coilPanel(kit, L - .3, 2.05, .09);
      c.rotation.x = s * .38;
      c.position.set(0, .42 + 1.02, s * (W / 2 - .62));
      c.userData.ex = V(0, 0, s * .75);
      coils.add(c);
    }
    parts.push(part(coils, V(0, .35, 0)));
    const headers = new THREE.Group();
    headers.add(cyl(kit, kit.steel, .07, 2.0, L / 2 + .12, 1.45, -.5, 'y', 18, true));
    headers.add(cyl(kit, kit.steel, .07, 2.0, L / 2 + .12, 1.45, .5, 'y', 18, true));
    headers.add(cyl(kit, kit.ret, .08, .06, L / 2 + .12, .42, -.5));
    headers.add(cyl(kit, kit.supply, .08, .06, L / 2 + .12, .42, .5));
    parts.push(part(headers, V(1.3, 0, 0)));
    const spray = new THREE.Group();
    for (const s of [-1, 1]) {
      spray.add(cyl(kit, kit.steel, .02, L - .4, 0, 2.25, s * (W / 2 - .05), 'x', 10));
      for (let i = 0; i < 10; i++) spray.add(cyl(kit, kit.led, .012, .05, -L / 2 + .4 + i * .39, 2.21, s * (W / 2 - .05)));
    }
    parts.push(part(spray, V(0, .55, 1.25)));
    const frame = new THREE.Group();
    frame.add(box(kit, kit.bodyLight, L, .12, .14, 0, 0, -W / 2 + .07));
    frame.add(box(kit, kit.bodyLight, L, .12, .14, 0, 0, W / 2 - .07));
    for (const x of [-L / 2 + .05, L / 2 - .05]) {
      frame.add(box(kit, kit.bodyLight, .1, H - .14, .12, x, 0, -W / 2 + .06));
      frame.add(box(kit, kit.bodyLight, .1, H - .14, .12, x, 0, W / 2 - .06));
      const tri = box(kit, kit.bodyLight, .06, .06, W, x, .42, 0);
      frame.add(tri);
    }
    for (const x of [-L / 2 + .05, L / 2 - .05]) frame.add(box(kit, kit.bodyLight, .08, .06, W, x, H - .2, 0));
    parts.push(part(frame, V(0, 0, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(L, H, W) };
  },

  'chiller'(kit) {
    const L = 3.0, W = 2.5, H = 2.6, g = new THREE.Group(), parts = [];
    const fans = new THREE.Group();
    for (let i = 0; i < 3; i++) for (const z of [-.6, .6]) {
      const f = fan(kit, .4, -.55 + i * .9 - .35, H - .02, z, 'y');
      f.add(cyl(kit, kit.body, .45, .14, 0, 0, -.07, 'z', 32, true));
      fans.add(f);
    }
    fans.add(box(kit, kit.bodyLight, L - .5, .06, W, -.25, H - .14, 0));
    parts.push(part(fans, V(0, 1.6, 0)));
    const coils = new THREE.Group();
    for (const s of [-1, 1]) {
      const c = coilPanel(kit, L - .7, 1.05, .08);
      c.rotation.x = s * .32;
      c.position.set(-.25, 1.45 + .5, s * (W / 2 - .3));
      c.userData.ex = V(0, 0, s * .7);
      coils.add(c);
    }
    parts.push(part(coils, V(0, .9, 0)));
    const comp = new THREE.Group();
    comp.add(box(kit, kit.bodyLight, L - .5, .08, W - .2, -.25, .12, 0));
    for (const z of [-.5, .5]) {
      comp.add(cyl(kit, kit.coil, .24, .9, -.45, .55, z, 'x', 24, true));
      comp.add(cyl(kit, kit.steel, .14, .5, .25, .55, z, 'x', 20, true));
    }
    parts.push(part(comp, V(0, -.0, 1.9)));
    const pumps = new THREE.Group();
    for (const z of [-.45, .45]) {
      pumps.add(cyl(kit, kit.coil, .12, .32, -L / 2 + .3, .45, z, 'x', 18, true));
      pumps.add(cyl(kit, kit.steel, .15, .1, -L / 2 + .5, .45, z, 'x', 18, true));
    }
    pumps.add(cyl(kit, kit.supply, .08, .1, -L / 2 - .05, .45, -.45, 'x'));
    pumps.add(cyl(kit, kit.ret, .08, .1, -L / 2 - .05, .45, .45, 'x'));
    parts.push(part(pumps, V(-1.5, 0, .3)));
    const ctrl = new THREE.Group();
    ctrl.add(box(kit, kit.bodyLight, .5, H - .2, W - .1, L / 2 - .25, .08, 0));
    ctrl.add(box(kit, kit.screen, .005, .18, .26, L / 2 + .004, 1.45, .3, false));
    ctrl.add(box(kit, kit.dark, .006, .02, W - .3, L / 2 + .004, 1.2, 0, false));
    parts.push(part(ctrl, V(1.5, 0, 0)));
    const frame = new THREE.Group();
    frame.add(box(kit, kit.bodyLight, L, .1, W, 0, 0, 0));
    for (const x of [-L / 2 + .05, L / 2 - .55]) for (const z of [-W / 2 + .05, W / 2 - .05]) frame.add(box(kit, kit.bodyLight, .08, H - .2, .08, x, .1, z));
    g.add(frame);
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, context: [frame], size: V(L, H, W) };
  },

  'fan-wall'(kit) {
    const W = 1.2, H = 2.2, D = .35, g = new THREE.Group(), parts = [];
    const fans = new THREE.Group();
    for (let r = 0; r < 5; r++) for (const x of [-.29, .29]) fans.add(fan(kit, .2, x, .32 + r * .42, D / 2 + .01));
    parts.push(part(fans, V(0, .1, 1.0)));
    const cab = new THREE.Group();
    cab.add(box(kit, kit.dark, W, .08, D, 0, 0, 0));
    cab.add(box(kit, kit.dark, W, .08, D, 0, H - .08, 0));
    cab.add(box(kit, kit.dark, .06, H, D, -W / 2 + .03, 0, 0));
    cab.add(box(kit, kit.dark, .06, H, D, W / 2 - .03, 0, 0));
    cab.add(box(kit, kit.screen, .1, .06, .005, 0, 1.25, D / 2 + .004, false));
    const coil = coilPanel(kit, W - .14, H - .2, .12);
    coil.position.set(0, H / 2, -.02);
    parts.push(part(coil, V(0, 0, -.75)));
    const filt = new THREE.Group();
    const fm = box(kit, kit.bodyLight, W - .14, H - .2, .03, 0, .1, -D / 2 + .02);
    filt.add(fm);
    parts.push(part(filt, V(0, 0, -1.35)));
    parts.push(part(cab, V(0, 0, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(W, H, D) };
  },

  'rdhx'(kit) {
    const W = .6, H = 2.0, D = .28, g = new THREE.Group(), parts = [];
    const fans = new THREE.Group();
    for (let i = 0; i < 4; i++) fans.add(fan(kit, .2, 0, .35 + i * .46, D / 2 + .01));
    parts.push(part(fans, V(0, 0, .9)));
    const coil = coilPanel(kit, W - .1, H - .12, .1);
    coil.position.set(0, H / 2, -.05);
    parts.push(part(coil, V(0, 0, -.55)));
    const frame = new THREE.Group();
    frame.add(box(kit, kit.dark, W, .06, D, 0, 0, 0));
    frame.add(box(kit, kit.dark, W, .06, D, 0, H - .06, 0));
    frame.add(box(kit, kit.dark, .05, H, D, -W / 2 + .025, 0, 0));
    frame.add(box(kit, kit.dark, .05, H, D, W / 2 - .025, 0, 0));
    frame.add(box(kit, kit.steel, .02, .5, .03, W / 2 - .06, .85, D / 2 + .02, false));
    parts.push(part(frame, V(0, 0, 0)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(W, H, D) };
  },

  'inrow-cw'(kit) {
    const W = .3, H = 2.0, D = 1.2, g = new THREE.Group(), parts = [];
    const cab = box(kit, kit.dark, W, H, D, 0, 0, 0);
    parts.push(part(cab, V(0, 0, -1.6)));
    const fans = new THREE.Group();
    for (let i = 0; i < 3; i++) fans.add(fan(kit, .12, 0, .45 + i * .3, D / 2 + .01));
    parts.push(part(fans, V(0, -.1, 1.0)));
    const coil = coilPanel(kit, W - .06, 1.4, .1);
    coil.rotation.y = 0;
    coil.position.set(0, 1.0, -.3);
    const cv = new THREE.Group();
    cv.add(coil);
    cv.add(cyl(kit, kit.coil, .03, .12, 0, 1.85, -.3, 'y', 12, true));
    parts.push(part(cv, V(0, .3, .1)));
    const hmi = new THREE.Group();
    hmi.add(box(kit, kit.screen, .14, .1, .005, 0, 1.6, D / 2 + .004, false));
    parts.push(part(hmi, V(0, .45, 1.1)));
    for (const p of parts) g.add(p.obj);
    return { group: g, parts, size: V(W, H, D) };
  },
};

function rackFrame(kit, W, H, D, ghost) {
  const g = new THREE.Group();
  const m = ghost ? kit.dark : kit.body;
  const t = .04;
  for (const x of [-W / 2 + t / 2, W / 2 - t / 2]) for (const z of [-D / 2 + t / 2, D / 2 - t / 2]) g.add(box(kit, m, t, H, t, x, 0, z));
  for (const y of [0, H - t]) {
    g.add(box(kit, m, W, t, t, 0, y, -D / 2 + t / 2));
    g.add(box(kit, m, W, t, t, 0, y, D / 2 - t / 2));
    g.add(box(kit, m, t, t, D, -W / 2 + t / 2, y, 0));
    g.add(box(kit, m, t, t, D, W / 2 - t / 2, y, 0));
  }
  // side panels
  for (const x of [-W / 2 + .005, W / 2 - .005]) g.add(box(kit, kit.dark, .01, H - .08, D - .08, x, .04, 0, false));
  g.add(box(kit, kit.dark, W - .08, .01, D - .08, 0, H - .03, 0, false));
  return g;
}
function serverStack(kit, n, y0, gap, coldPlates) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const s = new THREE.Group();
    s.add(box(kit, kit.dark, .48, .085, .95, 0, 0, .05));
    s.add(box(kit, kit.led, .03, .01, .003, -.19, .04, .53, false));
    s.add(box(kit, kit.led, .03, .01, .003, -.14, .04, .53, false));
    if (coldPlates) {
      s.add(box(kit, kit.copper, .12, .012, .14, -.09, .085, .05, false));
      s.add(box(kit, kit.copper, .12, .012, .14, .09, .085, .05, false));
    }
    s.position.y = y0 + i * (.2) + gap * 0;
    g.add(s);
  }
  return g;
}

/* ------------------------------------------------------------------ */
/* Flow pipes                                                          */
/* ------------------------------------------------------------------ */
const flowVert = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`;
const flowFrag = `uniform vec3 uColor; uniform float uTime; uniform float uLen; uniform float uSpeed; uniform float uOpacity; uniform float uProgress; uniform float uFlow;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  if (vUv.x > uProgress) discard;
  float s = fract((vUv.x*uLen)/0.7 - uTime*uSpeed);
  float dash = smoothstep(0.0,0.12,s)*(1.0-smoothstep(0.32,0.5,s));
  float rim = pow(1.0-abs(dot(vN,vV)),1.6);
  vec3 base = uColor*0.42 + uColor*rim*0.5;
  vec3 col = mix(base, uColor*1.55 + 0.15, dash*uFlow);
  gl_FragColor = vec4(col, uOpacity);
}`;

function roundedPath(pts, r = .28) {
  const path = new THREE.CurvePath();
  let prev = pts[0].clone();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    if (!c) { path.add(new THREE.LineCurve3(prev, b.clone())); break; }
    const d1 = b.clone().sub(a), d2 = c.clone().sub(b);
    const rr = Math.min(r, d1.length() / 2, d2.length() / 2);
    const p1 = b.clone().sub(d1.normalize().multiplyScalar(rr));
    const p2 = b.clone().add(d2.normalize().multiplyScalar(rr));
    path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  return path;
}

/* ------------------------------------------------------------------ */
/* Explorer                                                            */
/* ------------------------------------------------------------------ */
export class Explorer {
  constructor(el, { products, onSelect, onHover, onPartFocus }) {
    this.el = el;
    this.products = Object.fromEntries(products.map(p => [p.id, p]));
    this.onSelect = onSelect; this.onHover = onHover; this.onPartFocus = onPartFocus;
    this.units = []; this.pipes = []; this.tags = [];
    this.flow = true; this.explodeAmt = .85; this.loopFilter = null;
    this.selected = null; this.hovered = null; this.hoverPart = -1; this.activePart = -1;
    this.t0 = performance.now() / 1000; this.last = this.t0; this.intro = 0; this.started = false;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canvas = el.querySelector('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.scene = new THREE.Scene();
    this.viewSize = 24;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -200, 400);
    this.home = { target: V(-3.6, .8, -3.6), zoom: 1, dir: V(.62, .86, 1).normalize() };
    this.camera.position.copy(this.home.target).addScaledVector(this.home.dir, 80);
    this.camera.zoom = this.home.zoom;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(this.home.target);
    this.controls.enableDamping = true; this.controls.dampingFactor = .08;
    this.controls.rotateSpeed = .55; this.controls.panSpeed = .8;
    this.controls.minPolarAngle = .45; this.controls.maxPolarAngle = 1.32;
    this.controls.minZoom = .5; this.controls.maxZoom = 14;
    this.controls.screenSpacePanning = true;
    this.controls.zoomToCursor = true;
    this.controls.update();
    // only zoom with wheel once the user has engaged the canvas, so the page still scrolls
    this.armed = false;
    canvas.addEventListener('wheel', e => { if (!this.armed && !e.ctrlKey) e.stopImmediatePropagation(); }, { capture: true });
    canvas.addEventListener('pointerdown', () => { this.armed = true; el.classList.add('armed'); });
    el.addEventListener('pointerleave', () => { this.armed = false; el.classList.remove('armed'); });

    this.buildLights(); this.buildSite(); this.buildUnits(); this.buildPipes();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-9, -9);
    this.bindPointer(canvas);
    this.resize();
    this.fitHome(true);
    new ResizeObserver(() => { this.resize(); this.fitHome(!this.selected && !this.tween); }).observe(el);
    this.renderer.setAnimationLoop(() => this.tick());
  }

  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xdfe7ff, 0x0b0b10, 1.15));
    const d = new THREE.DirectionalLight(0xffffff, 2.1); d.position.set(10, 18, 8); this.scene.add(d);
    const r = new THREE.DirectionalLight(0x8fb4ff, .7); r.position.set(-12, 6, -10); this.scene.add(r);
  }

  buildSite() {
    const site = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .13 });
    const grid = new THREE.GridHelper(60, 60, 0xffffff, 0xffffff);
    grid.material.transparent = true; grid.material.opacity = .035; grid.position.y = -.01;
    site.add(grid);
    // hall slab
    const hall = { x0: -10, x1: 2.6, z0: -5, z1: 5 };
    this.hall = hall;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(hall.x1 - hall.x0, .12, hall.z1 - hall.z0), new THREE.MeshStandardMaterial({ color: 0x101116, roughness: .9 }));
    slab.position.set((hall.x0 + hall.x1) / 2, -.06, (hall.z0 + hall.z1) / 2);
    slab.add(new THREE.LineSegments(new THREE.EdgesGeometry(slab.geometry), lineMat));
    site.add(slab);
    // raised-floor tiles
    const pts = [];
    for (let x = hall.x0 + .6; x < hall.x1; x += .6) pts.push(x, .002, hall.z0, x, .002, hall.z1);
    for (let z = hall.z0 + .6; z < hall.z1; z += .6) pts.push(hall.x0, .002, z, hall.x1, .002, z);
    const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    site.add(new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .045 })));
    // ghost walls (back + left) and wall outline
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: .025, side: THREE.DoubleSide, depthWrite: false });
    const wh = 3.8;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(hall.x1 - hall.x0, wh), wallMat);
    back.position.set((hall.x0 + hall.x1) / 2, wh / 2, hall.z0); site.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(hall.z1 - hall.z0, wh), wallMat);
    left.rotation.y = Math.PI / 2; left.position.set(hall.x0, wh / 2, (hall.z0 + hall.z1) / 2); site.add(left);
    const ol = [hall.x0, 0, hall.z1, hall.x0, wh, hall.z1, hall.x0, wh, hall.z1, hall.x0, wh, hall.z0, hall.x0, wh, hall.z0, hall.x1, wh, hall.z0, hall.x1, wh, hall.z0, hall.x1, 0, hall.z0, hall.x0, 0, hall.z0, hall.x0, wh, hall.z0];
    const og = new THREE.BufferGeometry(); og.setAttribute('position', new THREE.Float32BufferAttribute(ol, 3));
    site.add(new THREE.LineSegments(og, lineMat));
    // yard pad
    const yard = new THREE.Mesh(new THREE.BoxGeometry(15.2, .06, 5.4), new THREE.MeshStandardMaterial({ color: 0x0d0e12, roughness: 1 }));
    yard.position.set(-3.0, -.03, -10.4);
    yard.add(new THREE.LineSegments(new THREE.EdgesGeometry(yard.geometry), lineMat));
    site.add(yard);
    this.scene.add(site);
    this.site = site;
  }

  addUnit(id, pos, rotY = 0, opts = {}) {
    const kit = makeMaterialKit();
    const built = FACTORIES[id](kit);
    const root = new THREE.Group();
    root.position.copy(pos); root.rotation.y = rotY;
    root.add(built.group);
    this.scene.add(root);
    for (const p of built.parts) {
      p.base = p.obj.position.clone();
      p.obj.traverse(o => { if (o.userData.ex) o.userData.base = o.position.clone(); });
    }
    // hit proxy
    const bb = new THREE.Box3().setFromObject(built.group);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    const s = bb.getSize(V()), c = bb.getCenter(V());
    hit.scale.copy(s.addScalar(.05)); hit.position.copy(c);
    built.group.add(hit);
    const mats = Object.values(kit);
    const ctxMats = [];
    for (const c of built.context || []) c.traverse(o => {
      if (o.material) { o.material = o.material.clone(); o.material.userData.baseOpacity = o.material.opacity; ctxMats.push(o.material); }
    });
    const u = { id, root, kit, mats, ctxMats, ...built, hit, label: opts.label, ex: 0, exTarget: 0, fade: 1, fadeTarget: 1, intro: 0, introDelay: opts.delay || 0, loops: this.products[id]?.loop || [] };
    hit.userData.unit = u;
    this.units.push(u);
    return u;
  }

  buildUnits() {
    const A = -2.6, B = 2.5;
    // Row A: liquid cooling
    this.cduA = this.addUnit('cabinet-cdu', V(-8.4, 0, A), 0, { delay: .1 });
    this.lcRacks = [];
    for (let i = 0; i < 6; i++) this.lcRacks.push(this.addUnit('lc-rack', V(-7.75 + i * .62, 0, A), 0, { delay: .15 + i * .04 }));
    this.inrack = this.addUnit('inrack-cdu', V(-7.75 + 6 * .62, 0, A), 0, { delay: .4 });
    this.cduB = this.addUnit('cabinet-cdu', V(-2.95, 0, A), 0, { delay: .45 });
    this.tanks = [this.addUnit('immersion-tank', V(-1.55, 0, A + .1), 0, { delay: .5 }), this.addUnit('immersion-tank', V(.75, 0, A + .1), 0, { delay: .55 })];
    // Row B: air cooling, racks with rear-door HX and in-row CW units
    this.rdhx = []; this.inrows = []; this.airRacks = [];
    let x = -8.1;
    const pattern = ['R', 'R', 'I', 'R', 'R', 'I', 'R', 'R', 'I', 'R', 'R', 'I', 'R', 'R'];
    pattern.forEach((t, i) => {
      if (t === 'R') {
        const cx = x + .3;
        this.airRacks.push(this.addContextRack(V(cx, 0, B)));
        this.rdhx.push(this.addUnit('rdhx', V(cx, 0, B + .6 + .14), 0, { delay: .6 + i * .02 }));
        x += .6;
      } else {
        this.inrows.push(this.addUnit('inrow-cw', V(x + .15, 0, B), Math.PI, { delay: .6 + i * .02 }));
        x += .3;
      }
    });
    // fan walls on the left wall, blowing into the aisle
    this.fanWalls = [this.addUnit('fan-wall', V(-9.78, 0, -.7), Math.PI / 2, { delay: .7 }), this.addUnit('fan-wall', V(-9.78, 0, .7), Math.PI / 2, { delay: .72 })];
    // outdoor plant + prefabricated header skid
    this.dry = [this.addUnit('dry-cooler', V(-7.6, 0, -10.4), 0, { delay: 0 }), this.addUnit('dry-cooler', V(-2.7, 0, -10.4), 0, { delay: .05 })];
    this.chiller = this.addUnit('chiller', V(2.6, 0, -10.4), 0, { delay: .08 });
    this.skid = this.addUnit('piping', V(-4.0, 0, -6.5), 0, { delay: .1 });
  }

  addContextRack(pos) {
    const kit = makeMaterialKit();
    const g = new THREE.Group();
    g.add(rackFrame(kit, .6, 2.2, 1.2, false));
    const srv = serverStack(kit, 9, .18, 0, false);
    g.add(srv);
    g.position.copy(pos); g.rotation.y = Math.PI;
    this.scene.add(g);
    const u = { id: null, root: g, kit, mats: Object.values(kit), parts: [], fade: 1, fadeTarget: 1, intro: 0, introDelay: .6, loops: ['cw'] };
    this.units.push(u);
    return u;
  }

  pipe(loop, kind, pts, r, owners) {
    const path = roundedPath(pts, .26);
    const len = path.getLength();
    const geo = new THREE.TubeGeometry(path, Math.max(16, Math.round(len * 9)), r, 10, false);
    const mat = new THREE.ShaderMaterial({
      vertexShader: flowVert, fragmentShader: flowFrag, transparent: true,
      uniforms: { uColor: { value: (kind === 's' ? SUPPLY : RETURN).clone() }, uTime: { value: 0 }, uLen: { value: len }, uSpeed: { value: .9 }, uOpacity: { value: 1 }, uProgress: { value: 0 }, uFlow: { value: 1 } },
    });
    const m = new THREE.Mesh(geo, mat);
    this.scene.add(m);
    const p = { loop, kind, mesh: m, mat, len, owners: owners || [], fade: 1, fadeTarget: 1 };
    this.pipes.push(p);
    return p;
  }
  tag(text, sub, pos, loop) { this.tags.push({ text, sub, pos, loop }); }

  buildPipes() {
    // Points are listed in flow direction: supply from source to load, return from load to source.
    const A = -2.6, B = 2.5, sk = this.skid, skS = -6.72, skR = -6.28, hy = .9;
    const S = (loop, pts, r, owners) => this.pipe(loop, 's', pts, r, owners);
    const R = (loop, pts, r, owners) => this.pipe(loop, 'r', pts, r, owners);

    // ---- Facility water: dry coolers <-> prefabricated headers
    for (const d of this.dry) {
      const x = d.root.position.x + 2.27;
      S('facility', [V(x, .42, -9.9), V(x + .5, .42, -9.9), V(x + .5, .42, -8.3), V(x + .5, hy, -8.3), V(x + .5, hy, skS - .1)], .085, [d, sk]);
      R('facility', [V(x + .85, hy, skR), V(x + .85, 1.4, skR), V(x + .85, 1.4, -10.9), V(x + .85, .42, -10.9), V(x + .05, .42, -10.9)], .085, [d, sk]);
    }
    // ---- Facility water: headers -> CDU A, CDU B (overhead, over the back wall)
    for (const [u, x] of [[this.cduA, -8.56], [this.cduB, -3.11]]) {
      const z = A - .35;
      S('facility', [V(x, hy + .3, skS), V(x, 3.25, skS), V(x, 3.25, z), V(x, 2.05, z)], .07, [u, sk]);
      R('facility', [V(x + .32, 2.05, z), V(x + .32, 3.45, z), V(x + .32, 3.45, skR), V(x + .32, hy + .3, skR)], .07, [u, sk]);
    }
    // ---- Facility water: headers -> in-rack CDU
    const ix = this.inrack.root.position.x - .15;
    S('facility', [V(ix, hy + .3, skS), V(ix, 3.05, skS), V(ix, 3.05, A - .45), V(ix, 2.22, A - .45)], .045, [this.inrack, sk]);
    R('facility', [V(ix + .32, 2.22, A - .45), V(ix + .32, 3.3, A - .45), V(ix + .32, 3.3, skR), V(ix + .32, hy + .3, skR)], .045, [this.inrack, sk]);

    // ---- Technology cooling (secondary): CDU A -> manifolds of each liquid-cooled rack
    const tz = A - .56, last = this.lcRacks[this.lcRacks.length - 1].root.position.x;
    S('tcs', [V(-8.56, 2.05, A + .05), V(-8.56, 2.45, A + .05), V(-7.95, 2.45, A + .05), V(-7.95, 2.45, tz - .12), V(last + .05, 2.45, tz - .12)], .05, [this.cduA, ...this.lcRacks]);
    R('tcs', [V(last + .35, 2.62, tz + .12), V(-7.85, 2.62, tz + .12), V(-7.85, 2.62, A + .05), V(-8.24, 2.62, A + .05), V(-8.24, 2.05, A + .05)], .05, [this.cduA, ...this.lcRacks]);
    for (const r of this.lcRacks) {
      const rx = r.root.position.x;
      S('tcs', [V(rx - .2, 2.45, tz - .12), V(rx - .2, 2.45, tz), V(rx - .2, 2.06, tz)], .026, [r, this.cduA]);
      R('tcs', [V(rx + .2, 2.06, tz), V(rx + .2, 2.62, tz), V(rx + .2, 2.62, tz + .12)], .026, [r, this.cduA]);
    }

    // ---- Immersion: CDU B -> tanks (ports on each tank's +x end)
    const iz = A + .05;
    const [t0, t1] = this.tanks.map(t => t.root.position.x + 1.2);
    S('immersion', [V(-3.11, 2.05, iz), V(-3.11, 2.6, iz), V(t1, 2.6, iz)], .055, [this.cduB, ...this.tanks]);
    R('immersion', [V(t1, 2.82, iz + .3), V(-2.79, 2.82, iz + .3), V(-2.79, 2.82, iz), V(-2.79, 2.05, iz)], .055, [this.cduB, ...this.tanks]);
    for (const [px, t] of [[t0, this.tanks[0]], [t1, this.tanks[1]]]) {
      S('immersion', [V(px, 2.6, iz), V(px, .35, iz), V(px, .35, A - .1), V(px - .1, .35, A - .1)], .04, [t, this.cduB]);
      R('immersion', [V(px - .1, .8, A + .3), V(px, .8, A + .3), V(px, 2.82, A + .3), V(px, 2.82, iz + .3)], .04, [t, this.cduB]);
    }

    // ---- Chilled water: integrated chiller -> fan walls, in-row units, rear doors
    const cx = this.chiller.root.position.x - 1.55, mY = 3.45, rY = 3.69, rowZ = B + .2;
    const cw = [this.chiller, ...this.fanWalls, ...this.inrows, ...this.rdhx];
    S('cw', [V(cx, .45, -10.85), V(.7, .45, -10.85), V(.7, .45, -7.6), V(.7, mY, -7.6), V(.7, mY, 0), V(-9.2, mY, 0)], .085, cw);
    R('cw', [V(-9.2, rY, .3), V(.95, rY, .3), V(.95, rY, -7.3), V(.95, .45, -7.3), V(.95, .45, -9.95), V(cx, .45, -9.95)], .085, cw);
    for (const f of this.fanWalls) {
      const fz = f.root.position.z;
      S('cw', [V(-9.2, mY, 0), V(-9.85, mY, 0), V(-9.85, mY, fz - .2), V(-9.85, 2.2, fz - .2)], .045, [f, this.chiller]);
      R('cw', [V(-9.7, 2.2, fz + .3), V(-9.7, rY, fz + .3), V(-9.7, rY, .3), V(-9.2, rY, .3)], .045, [f, this.chiller]);
    }
    const rowU = [...this.inrows, ...this.rdhx, this.chiller];
    S('cw', [V(.7, mY, 0), V(.7, mY, rowZ), V(-8.0, mY, rowZ)], .06, rowU);
    R('cw', [V(-8.0, rY, rowZ + .25), V(.95, rY, rowZ + .25), V(.95, rY, .3)], .06, rowU);
    for (const u of this.inrows) {
      const ux = u.root.position.x;
      S('cw', [V(ux - .06, mY, rowZ), V(ux - .06, 2.0, rowZ)], .024, [u, this.chiller]);
      R('cw', [V(ux + .06, 2.0, rowZ + .25), V(ux + .06, rY, rowZ + .25)], .024, [u, this.chiller]);
    }
    for (const u of this.rdhx) {
      const ux = u.root.position.x, uz = u.root.position.z;
      S('cw', [V(ux - .18, mY, rowZ), V(ux - .18, mY, uz - .04), V(ux - .18, 2.0, uz - .04)], .02, [u, this.chiller]);
      R('cw', [V(ux + .18, 2.0, uz + .06), V(ux + .18, rY, uz + .06), V(ux + .18, rY, rowZ + .25)], .02, [u, this.chiller]);
    }

    // connection tags
    this.tag('Facility water', '35–36 °C supply to CDUs', V(-4.4, 1.5, -8.6), 'facility');
    this.tag('Technology cooling', '40 °C to cold plates', V(-6.4, 2.75, A - .5), 'tcs');
    this.tag('Immersion coolant', '40 °C in · 50 °C out', V(-.4, 3.0, A + .2), 'immersion');
    this.tag('Chilled water', '7–20 °C to the air side', V(-4.6, 3.9, B + .3), 'cw');
  }

  /* ---------------- interaction ---------------- */
  bindPointer(canvas) {
    let down = null;
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.pointerPx = { x: e.clientX - r.left, y: e.clientY - r.top };
      this.needsPick = true;
    });
    canvas.addEventListener('pointerleave', () => { this.pointer.set(-9, -9); this.needsPick = true; });
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      this.pick();
      if (this.selected && this.hoverPart >= 0) { this.focusPart(this.hoverPart); return; }
      if (this.hovered && this.hovered !== this.selected) this.select(this.hovered);
      else if (!this.hovered && this.selected) this.deselect();
    });
  }
  pick() {
    this.needsPick = false;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    let hov = null, hp = -1;
    if (this.selected) {
      const meshes = [];
      this.selected.parts.forEach((p, i) => p.obj.traverse(o => { if (o.isMesh) { o.userData.pi = i; meshes.push(o); } }));
      const hit = this.raycaster.intersectObjects(meshes, false)[0];
      if (hit) { hp = hit.object.userData.pi; hov = this.selected; }
    }
    if (!hov) {
      const hits = this.raycaster.intersectObjects(this.units.filter(u => u.hit && u.fade > .3).map(u => u.hit), false);
      hov = hits[0]?.object.userData.unit || null;
    }
    if (hov !== this.hovered) { this.hovered = hov; this.onHover?.(hov, this.products[hov?.id]); }
    this.hoverPart = hp;
    this.el.style.cursor = hov ? 'pointer' : '';
  }

  firstOf(id) { return this.units.find(u => u.id === id); }

  select(u, fromUI) {
    if (typeof u === 'string') u = this.firstOf(u);
    if (!u) return;
    if (this.selected && this.selected !== u) this.selected.exTarget = 0;
    this.selected = u; this.activePart = -1;
    u.exTarget = 1;
    this.applyFade();
    this.frameUnit(u);
    this.onSelect?.(u, this.products[u.id], fromUI);
  }
  deselect() {
    if (this.selected) this.selected.exTarget = 0;
    this.selected = null; this.activePart = -1;
    this.applyFade();
    this.tweenTo(this.home.target, this.home.zoom);
    this.onSelect?.(null, null);
  }
  focusPart(i) { this.activePart = i; this.onPartFocus?.(i); }

  setLoop(loop) { this.loopFilter = loop; this.applyFade(); }
  setFlow(on) { this.flow = on; }
  setExplode(v) { this.explodeAmt = v; }

  applyFade() {
    const sel = this.selected, lf = this.loopFilter;
    for (const u of this.units) {
      let f = 1;
      if (sel) f = u === sel ? 1 : .06;
      else if (lf) f = u.loops.includes(lf) ? 1 : .12;
      u.fadeTarget = f;
    }
    for (const p of this.pipes) {
      let f = 1;
      if (sel) f = p.owners.includes(sel) ? .28 : .035;
      else if (lf) f = p.loop === lf ? 1 : .06;
      p.fadeTarget = f;
    }
  }

  frameUnit(u) {
    const bb = new THREE.Box3();
    u.root.updateMatrixWorld(true);
    // estimate exploded bounds
    const center = new THREE.Box3().setFromObject(u.hit).getCenter(V());
    bb.expandByPoint(center);
    for (const p of u.parts) {
      const pb = new THREE.Box3().setFromObject(p.obj);
      const off = p.ex.clone().multiplyScalar(this.explodeAmt).applyQuaternion(u.root.quaternion);
      pb.min.add(off); pb.max.add(off);
      bb.union(pb);
    }
    const size = bb.getSize(V()).length();
    const c = bb.getCenter(V());
    const rect = this.el.getBoundingClientRect();
    const panelW = rect.width > 900 ? 420 : 0;
    const usable = Math.max(.35, (rect.width - panelW) / rect.width);
    const aspect = rect.width / rect.height;
    const zoom = clamp(this.viewSize / (size * 1.02) * Math.min(1, aspect * usable * .95) * (panelW ? 1 : .62), .8, 12);
    // shift target so the unit sits in the area left of the panel
    const right = V().setFromMatrixColumn(this.camera.matrixWorld, 0);
    const worldW = (this.viewSize * aspect) / zoom;
    const shift = (panelW / rect.width) * worldW * .5;
    c.addScaledVector(right, shift);
    if (!panelW) {
      // mobile: panel is a bottom sheet, so lift the unit into the top half
      const up = V().setFromMatrixColumn(this.camera.matrixWorld, 1);
      c.addScaledVector(up, -(this.viewSize * 1.25 / zoom) * .24);
    }
    this.tweenTo(c, zoom);
  }
  tweenTo(target, zoom) {
    this.tween = { t: 0, dur: this.reduce ? .01 : 1.0, t0: this.controls.target.clone(), t1: target.clone(), z0: this.camera.zoom, z1: zoom };
  }
  rotateBy(rad) {
    const off = this.camera.position.clone().sub(this.controls.target);
    off.applyAxisAngle(V(0, 1, 0), rad);
    this.rot = { t: 0, from: this.camera.position.clone().sub(this.controls.target), to: off };
  }
  zoomBy(f) { this.tween = { t: 0, dur: .35, t0: this.controls.target.clone(), t1: this.controls.target.clone(), z0: this.camera.zoom, z1: clamp(this.camera.zoom * f, .5, 14) }; }
  // fit the whole site into view along the home direction
  fitHome(apply) {
    if (!this.size) return;
    const dir = this.home.dir;
    const right = V(0, 1, 0).cross(dir).normalize(), up = dir.clone().cross(right).normalize();
    const pts = [];
    const bb = new THREE.Box3(V(-10.2, 0, -12.6), V(4.3, 4.0, 5.2));
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) pts.push(V(x, y, z));
    let minR = 1e9, maxR = -1e9, minU = 1e9, maxU = -1e9;
    for (const p of pts) { const r = p.dot(right), u = p.dot(up); minR = Math.min(minR, r); maxR = Math.max(maxR, r); minU = Math.min(minU, u); maxU = Math.max(maxU, u); }
    const a = this.size.w / this.size.h, vs = this.viewSize * (a < 1 ? 1.25 : 1);
    const zoom = Math.min((vs * a) / ((maxR - minR) * 1.08), vs / ((maxU - minU) * 1.16));
    const c = bb.getCenter(V());
    const cr = (minR + maxR) / 2, cu = (minU + maxU) / 2;
    const target = c.clone().add(right.clone().multiplyScalar(cr - c.dot(right))).add(up.clone().multiplyScalar(cu - c.dot(up) - .4 / zoom));
    this.home.target = target; this.home.zoom = zoom;
    if (apply) {
      this.controls.target.copy(target);
      this.camera.position.copy(target).addScaledVector(dir, 80);
      this.camera.zoom = zoom; this.camera.updateProjectionMatrix();
    }
  }
  reset() { if (this.selected) this.deselect(); else this.tweenTo(this.home.target, this.home.zoom); const off = this.home.dir.clone().multiplyScalar(80); this.rot = { t: 0, from: this.camera.position.clone().sub(this.controls.target), to: off }; }

  start() { this.started = true; }

  resize() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.renderer.setSize(r.width, r.height, false);
    const a = r.width / r.height;
    const vs = this.viewSize * (a < 1 ? 1.25 : 1);
    this.camera.left = -vs * a / 2; this.camera.right = vs * a / 2; this.camera.top = vs / 2; this.camera.bottom = -vs / 2;
    this.camera.updateProjectionMatrix();
    this.size = { w: r.width, h: r.height };
  }

  project(v) {
    const p = v.clone().project(this.camera);
    return { x: (p.x + 1) / 2 * this.size.w, y: (1 - p.y) / 2 * this.size.h, z: p.z };
  }

  // screen anchors for callouts of the selected unit
  partAnchors() {
    const u = this.selected; if (!u) return null;
    const out = [];
    u.parts.forEach((p, i) => {
      const bb = new THREE.Box3().setFromObject(p.obj);
      if (bb.isEmpty()) return;
      const c = bb.getCenter(V());
      out.push({ i, ...this.project(c) });
    });
    const uc = new THREE.Box3().setFromObject(u.hit).getCenter(V());
    return { anchors: out, center: this.project(uc), ex: u.ex };
  }
  tagAnchors() {
    return this.tags.map(t => ({ ...t, ...this.project(t.pos) }));
  }

  tick() {
    const now = performance.now() / 1000, raw = Math.min(now - this.last, .25);
    this.last = now;
    const dt = Math.min(raw, .05), time = now - this.t0;
    if (this.started) this.intro = Math.min(1, this.intro + raw / (this.reduce ? .01 : 2.2));

    if (this.tween) {
      const tw = this.tween; tw.t = Math.min(1, tw.t + raw / tw.dur);
      const k = ease(tw.t);
      const nt = tw.t0.clone().lerp(tw.t1, k);
      const delta = nt.clone().sub(this.controls.target);
      this.controls.target.copy(nt); this.camera.position.add(delta);
      this.camera.zoom = tw.z0 + (tw.z1 - tw.z0) * k; this.camera.updateProjectionMatrix();
      if (tw.t >= 1) this.tween = null;
    }
    if (this.rot) {
      const r = this.rot; r.t = Math.min(1, r.t + raw / .8);
      const k = ease(r.t);
      const a = Math.atan2(r.from.x, r.from.z), b = Math.atan2(r.to.x, r.to.z);
      let d = b - a; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      const len = r.from.length() + (r.to.length() - r.from.length()) * k;
      const y = r.from.y + (r.to.y - r.from.y) * k;
      const ang = a + d * k;
      const hz = Math.sqrt(Math.max(0, len * len - y * y));
      this.camera.position.set(this.controls.target.x + Math.sin(ang) * hz, this.controls.target.y + y, this.controls.target.z + Math.cos(ang) * hz);
      if (r.t >= 1) this.rot = null;
    }
    this.controls.update();

    for (const u of this.units) {
      // intro rise
      const ti = clamp((this.intro * 1.6 - u.introDelay) / .6, 0, 1);
      const ki = easeOut(ti);
      u.root.position.y = (1 - ki) * -1.2;
      u.root.visible = ti > 0;
      // fade
      u.fade += (u.fadeTarget - u.fade) * Math.min(1, raw * 7);
      const f = u.fade * ki;
      for (const m of u.mats) {
        const base = m.userData.baseOpacity ?? 1;
        const o = m.isLineBasicMaterial ? Math.min(1, base * f * (u === this.selected ? 2.4 : 1)) : base * f;
        const tr = o < .999 || m === u.kit.liquid;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = o;
        m.depthWrite = m === u.kit.liquid ? false : o > .5;
      }
      // explode
      if (u.parts.length) {
        u.ex += ((u.exTarget * this.explodeAmt) - u.ex) * Math.min(1, raw * 4.2);
        const n = u.parts.length;
        u.parts.forEach((p, i) => {
          const stag = clamp(u.ex * 1.25 - (i / n) * .25, 0, 1);
          const k = easeOut(stag);
          p.obj.position.copy(p.base).addScaledVector(p.ex, k);
          p.obj.traverse(o => { if (o.userData.ex && o.userData.base) o.position.copy(o.userData.base).addScaledVector(o.userData.ex, k); });
        });
        for (const m of u.ctxMats) {
          const o = (m.userData.baseOpacity ?? 1) * f * (1 - .85 * clamp(u.ex, 0, 1));
          if (!m.transparent) { m.transparent = true; m.needsUpdate = true; }
          m.opacity = o; m.depthWrite = o > .5;
        }
      }
      // highlight (selected / hovered)
      if (u.id) {
        const tgt = u === this.selected ? 1 : u === this.hovered && !this.selected ? .6 : 0;
        u.hl = (u.hl || 0) + (tgt - (u.hl || 0)) * Math.min(1, raw * 8);
        const k = u.hl;
        u.kit.body.emissive.setRGB(.05 * k, .06 * k, .08 * k);
        u.kit.dark.emissive.setRGB(.045 * k, .05 * k, .07 * k);
        u.kit.bodyLight.emissive.setRGB(.03 * k, .03 * k, .04 * k);
      }
      // spin fans
      if (!this.reduce && u.fade > .2) u.root.traverse(o => { if (o.userData.spin) o.rotation.z += dt * (this.flow ? 9 : 1.5); });
    }
    for (const p of this.pipes) {
      p.fade += (p.fadeTarget - p.fade) * Math.min(1, raw * 7);
      p.mat.uniforms.uOpacity.value = p.fade;
      p.mat.uniforms.uTime.value = this.flow && !this.reduce ? time : p.mat.uniforms.uTime.value;
      p.mat.uniforms.uProgress.value = clamp(this.intro * 1.35 - .35, 0, 1) * 1.001;
      p.mat.uniforms.uFlow.value += ((this.flow ? 1 : .25) - p.mat.uniforms.uFlow.value) * dt * 4;
      p.mesh.visible = p.fade > .01;
    }
    if (this.needsPick) this.pick();
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
  }
}
