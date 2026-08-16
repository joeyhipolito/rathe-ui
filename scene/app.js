/* =========================================================================
   FLESH & BLOOD - The Road to Worlds
   An original procedural Three.js night walk. No assets, no build step.
   World: a valley road in Rathe. Planted greatswords, braziers, banners,
   a war-gate, a stair, an arena, a blood moon. Scroll drives the camera.
   ========================================================================= */
(function () {
'use strict';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (cur, to, rate, dt) => lerp(cur, to, 1 - Math.exp(-rate * dt));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* seeded rng ------------------------------------------------------------ */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const R = mulberry32(20261106); /* Paris, Nov 6 2026 */

/* value noise + fbm ------------------------------------------------------ */
function noise2D(seed) {
  const rr = mulberry32(seed), perm = new Uint8Array(512);
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  for (let i = 255; i > 0; i--) { const j = (rr() * (i + 1)) | 0; const t = base[i]; base[i] = base[j]; base[j] = t; }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const g = (h, x, y) => { switch (h & 3) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; default: return -x - y; } };
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  return function (x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = perm[perm[X] + Y], ab = perm[perm[X] + Y + 1];
    const ba = perm[perm[X + 1] + Y], bb = perm[perm[X + 1] + Y + 1];
    return lerp(lerp(g(aa, xf, yf), g(ba, xf - 1, yf), u),
                lerp(g(ab, xf, yf - 1), g(bb, xf - 1, yf - 1), u), v);
  };
}
const N1 = noise2D(7), N2 = noise2D(1319);
function fbm(n, x, y, oct, lac, gain) {
  let amp = .5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += amp * n(x * f, y * f); f *= lac; amp *= gain; }
  return s;
}

/* ============================================================ canvases */
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

function texStone(seed, dark) {
  const W = 256, H = 256, c = cvs(W, H), g = c.getContext('2d');
  const rr = mulberry32(seed);
  g.fillStyle = dark ? '#141017' : '#1b161d'; g.fillRect(0, 0, W, H);
  const im = g.getImageData(0, 0, W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const v = fbm(N1, x / 52 + seed, y / 52, 4, 2.1, .5) * .5 + .5;
    const grit = (rr() - .5) * 14;
    const t = clamp(v * 44 + grit, -20, 60);
    d[i] += t * .9; d[i + 1] += t * .75; d[i + 2] += t;
  }
  g.putImageData(im, 0, 0);
  /* mortar courses */
  g.strokeStyle = 'rgba(0,0,0,.38)'; g.lineWidth = 2;
  for (let y = 24; y < H; y += 42 + (rr() * 10 | 0)) {
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= W; x += 16) g.lineTo(x, y + (rr() - .5) * 3);
    g.stroke();
    let off = rr() * 60;
    for (let x = off; x < W; x += 54 + rr() * 26) {
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rr() - .5) * 4, y - 40); g.stroke();
    }
  }
  return c;
}

function texGround() {
  const W = 512, H = 512, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#0d0a10'; g.fillRect(0, 0, W, H);
  const im = g.getImageData(0, 0, W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const v = fbm(N2, x / 90, y / 90, 5, 2.2, .52) * .5 + .5;
    const s = fbm(N1, x / 18, y / 18, 2, 2, .5) * 8;
    d[i] = clamp(13 + v * 20 + s, 6, 46);
    d[i + 1] = clamp(10 + v * 15 + s * .8, 5, 38);
    d[i + 2] = clamp(16 + v * 21 + s, 7, 48);
  }
  g.putImageData(im, 0, 0);
  return c;
}

function texBanner(seed) {
  const W = 128, H = 256, c = cvs(W, H), g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#7d0e14'); grad.addColorStop(.55, '#64090f'); grad.addColorStop(1, '#43060b');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  /* weave */
  const rr = mulberry32(seed);
  g.globalAlpha = .1;
  for (let y = 0; y < H; y += 3) { g.fillStyle = rr() > .5 ? '#000' : '#a03'; g.fillRect(0, y, W, 1); }
  g.globalAlpha = 1;
  /* gold border */
  g.strokeStyle = '#c9963f'; g.lineWidth = 3; g.strokeRect(7, 7, W - 14, H - 34);
  /* sigil: a downward blade in a diamond */
  g.save(); g.translate(W / 2, H * .40);
  g.strokeStyle = '#dfb45e'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -42); g.lineTo(30, 0); g.lineTo(0, 42); g.lineTo(-30, 0); g.closePath(); g.stroke();
  g.fillStyle = '#dfb45e';
  g.beginPath(); g.moveTo(0, -30); g.lineTo(5, -14); g.lineTo(5, 16); g.lineTo(0, 30); g.lineTo(-5, 16); g.lineTo(-5, -14); g.closePath(); g.fill();
  g.fillRect(-14, -12, 28, 4);
  g.restore();
  /* ragged hem */
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 10) g.lineTo(x, H - 8 - Math.abs(fbm(N1, x / 22 + seed, 9, 2, 2, .5)) * 26);
  g.lineTo(W, H); g.closePath(); g.fill();
  g.globalCompositeOperation = 'source-over';
  return c;
}

function texCardBack(strip) {
  /* strip: '#e0301f' | '#e8c15a' | '#4f7fd9' */
  const W = 128, H = 180, c = cvs(W, H), g = c.getContext('2d');
  g.fillStyle = '#17121b'; g.fillRect(0, 0, W, H);
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, 'rgba(201,150,63,.16)'); grad.addColorStop(1, 'rgba(201,150,63,0)');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#c9963f'; g.lineWidth = 2; g.strokeRect(5, 5, W - 10, H - 10);
  g.strokeStyle = 'rgba(201,150,63,.4)'; g.lineWidth = 1; g.strokeRect(10, 10, W - 20, H - 20);
  /* pitch strip */
  g.fillStyle = strip; g.fillRect(10, 14, W - 20, 7);
  /* center sigil */
  g.save(); g.translate(W / 2, H / 2 + 8);
  g.strokeStyle = 'rgba(223,180,94,.85)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -34); g.lineTo(24, 0); g.lineTo(0, 34); g.lineTo(-24, 0); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(223,180,94,.85)';
  g.beginPath(); g.moveTo(0, -24); g.lineTo(4, -10) ; g.lineTo(4, 12); g.lineTo(0, 24); g.lineTo(-4, 12); g.lineTo(-4, -10); g.closePath(); g.fill();
  g.fillRect(-11, -9, 22, 3);
  g.restore();
  return c;
}

function texGlow(inner, outer) {
  const S = 128, c = cvs(S, S), g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, inner); gr.addColorStop(.42, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return c;
}

function texFlame() {
  const W = 64, H = 96, c = cvs(W, H), g = c.getContext('2d');
  function drop(cx, tipY, baseY, hw, colTop, colBot) {
    const gr = g.createLinearGradient(0, tipY, 0, baseY);
    gr.addColorStop(0, colTop); gr.addColorStop(1, colBot);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(cx, tipY);
    g.bezierCurveTo(cx + hw * .9, tipY + (baseY - tipY) * .45, cx + hw, baseY - hw * .9, cx, baseY);
    g.bezierCurveTo(cx - hw, baseY - hw * .9, cx - hw * .9, tipY + (baseY - tipY) * .45, cx, tipY);
    g.fill();
  }
  g.filter = 'blur(3px)';
  drop(W / 2, 6, 90, 19, 'rgba(255,120,30,0)', 'rgba(220,60,15,.5)');
  drop(W / 2, 16, 88, 14, 'rgba(255,170,60,.45)', 'rgba(255,120,40,.8)');
  g.filter = 'blur(1px)';
  drop(W / 2, 34, 84, 8, 'rgba(255,235,180,.85)', 'rgba(255,200,120,.9)');
  g.filter = 'none';
  return c;
}

function texMoon() {
  const S = 256, c = cvs(S, S), g = c.getContext('2d');
  const gr = g.createRadialGradient(S / 2, S / 2, S * .1, S / 2, S / 2, S / 2);
  gr.addColorStop(0, '#e8564a'); gr.addColorStop(.72, '#b3271f'); gr.addColorStop(.97, '#7c1512'); gr.addColorStop(1, 'rgba(124,21,18,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, 7); g.fill();
  /* maria */
  const im = g.getImageData(0, 0, S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    if (d[i + 3] === 0) continue;
    const v = fbm(N1, x / 46 + 40, y / 46, 4, 2.2, .5);
    const t = clamp(v * 46, -36, 26);
    d[i] = clamp(d[i] + t, 0, 255); d[i + 1] = clamp(d[i + 1] + t * .4, 0, 255); d[i + 2] = clamp(d[i + 2] + t * .4, 0, 255);
  }
  g.putImageData(im, 0, 0);
  return c;
}

function texSky() {
  const W = 16, H = 512, c = cvs(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#030207');
  gr.addColorStop(.45, '#070310');
  gr.addColorStop(.68, '#120610');
  gr.addColorStop(.80, '#260d0c');
  gr.addColorStop(.90, '#12060a');
  gr.addColorStop(1, '#050307');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  return c;
}

function texWindow() {
  const W = 32, H = 48, c = cvs(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#ffcf8a'); gr.addColorStop(1, '#ff9440');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(40,16,4,.9)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  return c;
}

/* ============================================================ renderer */
const canvas = document.getElementById('gl');
const vpW = () => window.innerWidth, vpH = () => window.innerHeight;
let renderer, scene, camera;

function tx(c, o) {
  const t = new THREE.CanvasTexture(c);
  o = o || {};
  if (o.rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.rep[0], o.rep[1]); }
  t.anisotropy = 4;
  return t;
}

function initGL() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(vpW(), vpH());
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07040a, 0.019);
  camera = new THREE.PerspectiveCamera(36, vpW() / vpH(), .3, 320);
}

/* ============================================================ materials */
let M = {};
function initMaterials() {
  M.stone = new THREE.MeshStandardMaterial({ map: tx(texStone(3), { rep: [2, 3] }), roughness: .93, metalness: .04, color: 0x6f6675 });
  M.stoneDark = new THREE.MeshStandardMaterial({ map: tx(texStone(11, true), { rep: [2, 2] }), roughness: .95, metalness: .03, color: 0x4f4854 });
  M.arena = new THREE.MeshStandardMaterial({ map: tx(texStone(5), { rep: [10, 1.6] }), roughness: .94, metalness: .03, color: 0x655c6e });
  M.steel = new THREE.MeshStandardMaterial({ color: 0x777d8a, roughness: .42, metalness: .85 });
  M.steelDark = new THREE.MeshStandardMaterial({ color: 0x4c4f58, roughness: .5, metalness: .8 });
  M.gold = new THREE.MeshStandardMaterial({ color: 0xc9963f, roughness: .35, metalness: .9 });
  M.wood = new THREE.MeshStandardMaterial({ color: 0x17100b, roughness: .9, metalness: 0 });
  M.roof = new THREE.MeshStandardMaterial({ color: 0x0c0806, roughness: 1, metalness: 0 });
  M.iron = new THREE.MeshStandardMaterial({ color: 0x1c181f, roughness: .8, metalness: .35 });
}

/* ============================================================ ground */
const ROAD = { w: 3.2 }; /* half-width of the flattened causeway */
function groundHeight(x, z) {
  let h = fbm(N1, x / 26 + 9, z / 26, 4, 2.1, .5) * 5.2;
  h += Math.max(0, fbm(N2, x / 60, z / 60, 3, 2, .5)) * 7;
  /* valley walls rise away from the road */
  h += Math.pow(Math.abs(x) / 30, 2.1) * 26;
  /* flatten the causeway */
  const road = smooth(ROAD.w + 4.4, ROAD.w, Math.abs(x));
  h *= (1 - road * .96);
  /* the stair plateau: ground climbs from z=-16 to the arena floor */
  const rise = smooth(-14, -30, z) * 6.4;
  return h + rise;
}
function buildGround() {
  const g = new THREE.PlaneGeometry(240, 240, 130, 130);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    p.setY(i, groundHeight(x, z));
  }
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ map: tx(texGround(), { rep: [10, 10] }), roughness: .97, metalness: 0, color: 0x4a4352 });
  const mesh = new THREE.Mesh(g, m);
  mesh.position.y = -0.02;
  scene.add(mesh);

  /* flagstones on the causeway */
  const slab = new THREE.BoxGeometry(1, .09, 1);
  const slabMat = new THREE.MeshStandardMaterial({ map: M.stoneDark.map, roughness: .96, metalness: .02, color: 0x332e3a });
  const count = 90, im = new THREE.InstancedMesh(slab, slabMat, count);
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const z = 16 - i * .62 - R() * .3;
    const x = (R() - .5) * 3.6;
    d.position.set(x, groundHeight(x, z) + .02, z);
    d.rotation.y = (R() - .5) * .6;
    d.scale.set(.7 + R() * .9, 1, .5 + R() * .6);
    d.updateMatrix();
    im.setMatrixAt(i, d.matrix);
  }
  scene.add(im);
}

/* ============================================================ swords */
function swordGeo() {
  /* one greatsword: tapered blade + guard + grip + pommel, merged */
  const geos = [];
  const blade = new THREE.BoxGeometry(.34, 4.4, .07);
  const bp = blade.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const y = bp.getY(i);
    const t = (y + 2.2) / 4.4;                 /* 0 tip … 1 shoulder */
    bp.setX(i, bp.getX(i) * lerp(.1, 1, Math.min(1, t * 2.4)));
    bp.setZ(i, bp.getZ(i) * lerp(.3, 1, t));
  }
  blade.computeVertexNormals();
  geos.push(blade.translate(0, 2.2, 0));
  geos.push(new THREE.BoxGeometry(1.15, .14, .16).translate(0, 4.42, 0));
  geos.push(new THREE.CylinderGeometry(.06, .07, .78, 6).translate(0, 4.88, 0));
  geos.push(new THREE.SphereGeometry(.12, 8, 6).translate(0, 5.3, 0));
  let merged = geos[0];
  /* r149 has BufferGeometryUtils in examples only; merge by hand */
  merged = mergeGeos(geos);
  return merged;
}
function mergeGeos(list) {
  let total = 0, itotal = 0;
  list.forEach(g => { total += g.attributes.position.count; itotal += g.index ? g.index.count : 0; });
  const pos = new Float32Array(total * 3), norm = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  const idx = new Uint32Array(itotal);
  let vo = 0, io = 0;
  list.forEach(g => {
    pos.set(g.attributes.position.array, vo * 3);
    norm.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += g.attributes.position.count; io += gi.length;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
function buildSwords() {
  const g = swordGeo();
  const spots = [];
  for (let i = 0; i < 26; i++) {
    const side = i % 2 ? 1 : -1;
    const z = 14 - i * 2.3 - R() * 1.6;
    const x = side * (ROAD.w + 1.6 + R() * 7.5);
    if (z < -13 && z > -31 && Math.abs(x) < 9) continue; /* keep the stair clear */
    if (x < -4.5 && z > -5 && z < 8) continue;   /* keep the armory hall clear */
    spots.push([x, z]);
  }
  spots.forEach(([x, z]) => {
    const m = new THREE.Mesh(g, R() > .4 ? M.steelDark : M.steel);
    const s = .5 + R() * .85;
    m.scale.setScalar(s);
    m.position.set(x, groundHeight(x, z) - .25, z);
    m.rotation.set((R() - .5) * .5, R() * Math.PI, (R() - .5) * .55);
    scene.add(m);
  });
}

/* ============================================================ braziers */
const FLAMES = [];   /* {spr, light, seed, base} */
function buildBrazier(x, z, opts) {
  opts = opts || {};
  const y = opts.y !== undefined ? opts.y : groundHeight(x, z);
  const grp = new THREE.Group();
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.16, .24, 1.5, 7), M.iron);
  ped.position.y = .75; grp.add(ped);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.42, .2, .34, 9), M.iron);
  bowl.position.y = 1.62; grp.add(bowl);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tx(texFlame()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .95
  }));
  spr.scale.set(.56, 1.14, 1); spr.position.y = 2.2; grp.add(spr);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tx(texGlow('rgba(255,150,60,.4)', 'rgba(200,60,15,.12)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .55
  }));
  halo.scale.set(3.2, 3.2, 1); halo.position.y = 2.1; grp.add(halo);
  let light = null;
  if (opts.light) {
    light = new THREE.PointLight(0xff8a3a, 2.0, 15, 2);
    light.position.y = 2.3; grp.add(light);
  }
  grp.position.set(x, y, z);
  if (opts.scale) grp.scale.setScalar(opts.scale);
  scene.add(grp);
  FLAMES.push({ spr, halo, light, seed: R() * 100, base: opts.light ? 2.0 : 0 });
  return grp;
}

/* ============================================================ banners */
const BANNERS = [];  /* {mesh, base(Float32Array), seed} */
function buildBanner(x, z, opts) {
  opts = opts || {};
  const y = opts.y !== undefined ? opts.y : groundHeight(x, z);
  const grp = new THREE.Group();
  const poleH = 4.6;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, poleH, 6), M.wood);
  pole.position.y = poleH / 2; grp.add(pole);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.28, .06, .06), M.wood);
  arm.position.set(.48, poleH - .18, 0); grp.add(arm);
  const cw = 1.06, ch = 2.5;
  const cg = new THREE.PlaneGeometry(cw, ch, 8, 16);
  cg.translate(.48, poleH - .32 - ch / 2, .04);
  const cm = new THREE.MeshStandardMaterial({
    map: tx(texBanner((R() * 999) | 0)), side: THREE.DoubleSide, roughness: .92, metalness: 0,
    transparent: true, alphaTest: .35
  });
  const cloth = new THREE.Mesh(cg, cm); grp.add(cloth);
  grp.position.set(x, y, z);
  grp.rotation.y = opts.ry !== undefined ? opts.ry : (R() - .5) * .6;
  if (opts.scale) grp.scale.setScalar(opts.scale);
  scene.add(grp);
  BANNERS.push({ mesh: cloth, base: cg.attributes.position.array.slice(), seed: R() * 100, top: poleH - .32 });
  return grp;
}
function updateBanners(t) {
  for (const B of BANNERS) {
    const p = B.mesh.geometry.attributes.position;
    const a = p.array, b = B.base;
    for (let i = 0; i < p.count; i++) {
      const y = b[i * 3 + 1];
      const hang = clamp((B.top - y) / 2.5, 0, 1);      /* 0 at rail, 1 at hem */
      const w = Math.sin(t * 1.7 + B.seed + y * 2.1 + b[i * 3] * 1.3) * .09
              + Math.sin(t * .9 + B.seed * 2 + y * 3.7) * .05;
      a[i * 3 + 2] = b[i * 3 + 2] + w * hang * 1.9;
      a[i * 3] = b[i * 3] + Math.sin(t * 1.2 + B.seed + y) * .02 * hang;
    }
    p.needsUpdate = true;
  }
}

/* ============================================================ war-gate */
function buildGate() {
  const grp = new THREE.Group();
  const gz = -8;
  const py = groundHeight(0, gz);
  const towerG = new THREE.BoxGeometry(2.6, 11.5, 2.6);
  [-1, 1].forEach(s => {
    const t = new THREE.Mesh(towerG, M.stone);
    t.position.set(s * 4.4, py + 5.75 - .3, gz);
    t.rotation.y = s * .06;
    grp.add(t);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(3.1, .5, 3.1), M.stoneDark);
    cap.position.set(s * 4.4, py + 11.4, gz);
    grp.add(cap);
    /* carved chevron on each tower face */
    const mark = new THREE.Mesh(new THREE.BoxGeometry(.55, .85, .08), new THREE.MeshStandardMaterial({ color: 0x3f331a, roughness: .8, metalness: .3 }));
    mark.position.set(s * 4.4, py + 6.4, gz + 1.31);
    mark.rotation.z = Math.PI / 4;
    grp.add(mark);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.6, 1.5, 3.0), M.stoneDark);
  lintel.position.set(0, py + 12.05, gz);
  grp.add(lintel);
  const crest = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, .5), M.gold);
  crest.position.set(0, py + 13.2, gz);
  crest.rotation.z = Math.PI / 4;
  grp.add(crest);
  scene.add(grp);
  /* braziers atop the towers + flanking the road */
  buildBrazier(-4.4, gz, { y: py + 11.6, scale: 1.15 });
  buildBrazier(4.4, gz, { y: py + 11.6, scale: 1.15 });
  buildBrazier(-2.9, gz + 2.4, { light: true });
  buildBrazier(2.9, gz + 2.4, { light: true });
  buildBanner(-5.9, gz + .6, { ry: .35 });
  buildBanner(5.9, gz + .6, { ry: -.35 });
}

/* ============================================================ stairs */
function buildStairs() {
  const grp = new THREE.Group();
  const steps = 22, z0 = -14, z1 = -30;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const z = lerp(z0, z1, t);
    const y = smooth(-14, -30, z) * 6.4;
    const s = new THREE.Mesh(new THREE.BoxGeometry(8.4 - t * 1.6, .34, (z0 - z1) / steps + .22), M.stoneDark);
    s.position.set(0, y + .1, z);
    grp.add(s);
  }
  scene.add(grp);
  /* banner avenue up the stair */
  for (let i = 0; i < 4; i++) {
    const z = -16 - i * 3.6;
    const y = smooth(-14, -30, z) * 6.4;
    buildBanner(-6.7, z, { y: y, ry: .3 });
    buildBanner(6.7, z, { y: y, ry: -.3 });
  }
  buildBrazier(-4.0, -29, { y: 6.35, light: true });
  buildBrazier(4.0, -29, { y: 6.35, light: true });
}

/* ============================================================ arena */
function buildArena() {
  const grp = new THREE.Group();
  const cz = -44, cy = 6.4;
  /* two tiers of wall with warm arched openings */
  const winTex = tx(texWindow());
  function tier(rad, h, y, openings) {
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.04, h, 40, 1, true), M.arena);
    wall.position.set(0, y + h / 2, cz);
    grp.add(wall);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.06, rad * 1.06, .5, 40, 1, true), M.stoneDark);
    cap.position.set(0, y + h + .25, cz);
    grp.add(cap);
    for (let i = 0; i < openings; i++) {
      const a = (i / openings) * Math.PI * 2 + .12;
      const wx = Math.sin(a) * (rad + .06), wz = Math.cos(a) * (rad + .06);
      if (wz < -2) continue; /* only the faces toward the camera */
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.85),
        new THREE.MeshBasicMaterial({ map: winTex, transparent: false, fog: true }));
      w.position.set(wx, y + h * .48, cz + wz);
      w.lookAt(wx * 2, y + h * .48, cz + wz * 2);
      grp.add(w);
    }
  }
  tier(15, 5.4, cy, 26);
  tier(12.4, 4.6, cy + 5.9, 20);
  /* firelight on the facade - the walls are otherwise unlit at night */
  const fl1 = new THREE.PointLight(0xff9a4a, 2.4, 28, 2); fl1.position.set(0, cy + 4.4, cz + 19.5); grp.add(fl1);
  const fl2 = new THREE.PointLight(0xff8a3a, 1.6, 22, 2); fl2.position.set(-9.5, cy + 3, cz + 15); grp.add(fl2);
  const fl3 = new THREE.PointLight(0xff8a3a, 1.6, 22, 2); fl3.position.set(9.5, cy + 3, cz + 15); grp.add(fl3);
  /* crown of banners */
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + .3;
    const wx = Math.sin(a) * 12.1, wz = Math.cos(a) * 12.1;
    if (wz < -3) continue;
    buildBanner(wx, cz + wz, { y: cy + 10.6, ry: a + Math.PI, scale: .95 });
  }
  /* interior glow rising above the rim */
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tx(texGlow('rgba(255,170,80,.5)', 'rgba(255,90,30,.14)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .9
  }));
  glow.scale.set(30, 16, 1); glow.position.set(0, cy + 13, cz);
  grp.add(glow);
  scene.add(grp);
  buildBrazier(-7, cz + 15.4, { y: cy, light: false, scale: 1.2 });
  buildBrazier(7, cz + 15.4, { y: cy, light: false, scale: 1.2 });
}

/* ============================================================ armory hall */
function buildArmoryHall() {
  const hx = -8.6, hz = .6, ry = .3;
  const hy = groundHeight(hx, hz);
  const grp = new THREE.Group();
  grp.position.set(hx, hy, hz); grp.rotation.y = ry;
  const base = new THREE.Mesh(new THREE.BoxGeometry(6.6, 3.4, 4.8), M.stone);
  base.position.y = 1.5; grp.add(base);
  [-1, 1].forEach(sn => {
    const r = new THREE.Mesh(new THREE.BoxGeometry(7.4, .16, 3.1), M.roof);
    r.position.set(0, 4.12, sn * 1.16);
    r.rotation.x = sn * -.62;
    grp.add(r);
  });
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(7.5, .18, .34), M.roof);
  ridge.position.y = 4.78; grp.add(ridge);
  /* warm windows + a door of light on the road face */
  const winTex = tx(texWindow());
  const mkWin = (ox, oy, w, h) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: winTex }));
    m.position.set(ox, oy, 2.42); grp.add(m);
  };
  mkWin(-2.0, 1.9, .7, .95);
  mkWin(2.0, 1.9, .7, .95);
  mkWin(.2, 1.35, 1.0, 2.3);
  /* hanging shield sign */
  const sign = new THREE.Mesh(new THREE.BoxGeometry(.62, .8, .07), M.gold);
  sign.position.set(2.8, 2.7, 2.55); grp.add(sign);
  const l = new THREE.PointLight(0xffb45e, 2.2, 12, 2);
  l.position.set(.4, 1.7, 3.6); grp.add(l);
  scene.add(grp);
  /* lantern + banner set back so they never cross the copy */
  buildBrazier(-5.4, 5.2, { light: false, scale: .8 });
  buildBanner(-4.8, 6.4, { ry: .5 });
}

/* ============================================================ moon + sky */
let MOON;
function buildSky() {
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 240),
    new THREE.MeshBasicMaterial({ map: tx(texSky()), fog: false, depthWrite: false })
  );
  sky.position.set(0, 52, -168);
  scene.add(sky);

  MOON = new THREE.Group();
  const disc = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tx(texMoon()), transparent: true, fog: false, depthWrite: false
  }));
  disc.scale.set(26, 26, 1);
  MOON.add(disc);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tx(texGlow('rgba(224,48,31,.34)', 'rgba(140,20,16,.12)')), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false
  }));
  halo.scale.set(72, 72, 1);
  MOON.add(halo);
  MOON.position.set(0, 48, -160);
  scene.add(MOON);

  /* stars */
  const n = 420, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, r = 90 + R() * 160;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = 18 + R() * 120;
    pos[i * 3 + 2] = -40 - R() * 140;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xcfd6e4, size: .5, sizeAttenuation: true, transparent: true, opacity: .75, fog: false, depthWrite: false
  }));
  scene.add(stars);
}

/* ============================================================ particles */
let EMBERS, ASH, MIST = [];
function buildParticles() {
  /* embers: drift up along the whole road */
  const ne = 300, ep = new Float32Array(ne * 3), es = new Float32Array(ne);
  const eSeed = [];
  for (let i = 0; i < ne; i++) {
    ep[i * 3] = (R() - .5) * 30;
    ep[i * 3 + 1] = R() * 11;
    ep[i * 3 + 2] = 18 - R() * 70;
    es[i] = .1 + R() * .3;
    eSeed.push(R() * 100);
  }
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
  EMBERS = new THREE.Points(eg, new THREE.PointsMaterial({
    map: tx(texGlow('rgba(255,190,90,1)', 'rgba(255,90,20,.5)')),
    color: 0xffa050, size: .34, sizeAttenuation: true, transparent: true, opacity: .85,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  EMBERS.userData = { seed: eSeed, spd: es };
  scene.add(EMBERS);

  /* ash: falls slowly, bone-grey */
  const na = 200, ap = new Float32Array(na * 3), aSeed = [];
  for (let i = 0; i < na; i++) {
    ap[i * 3] = (R() - .5) * 36;
    ap[i * 3 + 1] = R() * 14;
    ap[i * 3 + 2] = 18 - R() * 74;
    aSeed.push(R() * 100);
  }
  const ag = new THREE.BufferGeometry();
  ag.setAttribute('position', new THREE.BufferAttribute(ap, 3));
  ASH = new THREE.Points(ag, new THREE.PointsMaterial({
    map: tx(texGlow('rgba(210,200,190,.9)', 'rgba(120,110,105,.25)')),
    color: 0x9a8f85, size: .16, sizeAttenuation: true, transparent: true, opacity: .45, depthWrite: false
  }));
  ASH.userData = { seed: aSeed };
  scene.add(ASH);

  /* ground mist */
  const mistTex = tx(texGlow('rgba(120,110,140,.16)', 'rgba(70,60,90,.06)'));
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mistTex, transparent: true, opacity: .5, depthWrite: false
    }));
    const z = 14 - i * 7 - R() * 4, x = (R() - .5) * 14;
    s.position.set(x, groundHeight(x, z) + .7, z);
    s.scale.set(16 + R() * 12, 4.5 + R() * 2, 1);
    s.userData = { seed: R() * 100, x0: x };
    MIST.push(s); scene.add(s);
  }
}
function updateParticles(t, dt) {
  const ep = EMBERS.geometry.attributes.position, eu = EMBERS.userData;
  for (let i = 0; i < ep.count; i++) {
    let y = ep.getY(i) + eu.spd[i] * dt * 2.4;
    let x = ep.getX(i) + Math.sin(t * .8 + eu.seed[i]) * dt * .5;
    if (y > 12) { y = 0; x = (R() - .5) * 30; }
    ep.setY(i, y); ep.setX(i, x);
  }
  ep.needsUpdate = true;
  const ap = ASH.geometry.attributes.position, au = ASH.userData;
  for (let i = 0; i < ap.count; i++) {
    let y = ap.getY(i) - dt * (.5 + (au.seed[i] % 1) * .5);
    let x = ap.getX(i) + Math.sin(t * .5 + au.seed[i]) * dt * .9;
    if (y < 0) { y = 14; x = (R() - .5) * 36; }
    ap.setY(i, y); ap.setX(i, x);
  }
  ap.needsUpdate = true;
  for (const s of MIST) {
    s.position.x = s.userData.x0 + Math.sin(t * .12 + s.userData.seed) * 3.2;
  }
}
function updateFlames(t) {
  for (const F of FLAMES) {
    const f = 1 + Math.sin(t * 11 + F.seed) * .10 + Math.sin(t * 23 + F.seed * 2) * .06;
    F.spr.scale.set(.56 * f, 1.14 * (2 - f) * .96, 1);
    F.halo.material.opacity = .42 + Math.sin(t * 9 + F.seed) * .1;
    if (F.light) F.light.intensity = F.base * (0.86 + Math.sin(t * 13 + F.seed) * .18);
  }
}

/* ============================================================ cards */
const CARDS = [];
function buildCards() {
  const strips = ['#e0301f', '#e0301f', '#e8c15a', '#e8c15a', '#4f7fd9', '#4f7fd9'];
  const texs = strips.map(s => tx(texCardBack(s)));
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(.62, .87),
      new THREE.MeshStandardMaterial({ map: texs[i % 6], side: THREE.DoubleSide, roughness: .6, metalness: .05 })
    );
    const a0 = R() * Math.PI * 2;
    m.userData = {
      a: a0, rad: 2.6 + R() * 2.2, y0: 2.4 + R() * 2.2,
      cz: 2 - R() * 6, spd: (.06 + R() * .08) * (R() > .5 ? 1 : -1),
      seed: R() * 100, tilt: (R() - .5) * .9
    };
    scene.add(m);
    CARDS.push(m);
  }
}
function updateCards(t, dt) {
  for (const c of CARDS) {
    const u = c.userData;
    u.a += u.spd * dt;
    c.position.set(
      Math.cos(u.a) * u.rad,
      u.y0 + Math.sin(t * .5 + u.seed) * .45,
      u.cz + Math.sin(u.a) * u.rad * .4
    );
    c.rotation.set(u.tilt + Math.sin(t * .4 + u.seed) * .2, u.a + Math.PI / 2, Math.sin(t * .3 + u.seed) * .15);
  }
}

/* ============================================================ lights */
function buildLights() {
  const hemi = new THREE.HemisphereLight(0x1f1c2c, 0x090610, .5);
  scene.add(hemi);
  const moonL = new THREE.DirectionalLight(0xa03b32, .55);
  moonL.position.set(0, 40, -120);
  scene.add(moonL);
  const cool = new THREE.DirectionalLight(0x2c3960, .3);
  cool.position.set(30, 50, 60);
  scene.add(cool);
}

/* ============================================================ camera rig */
const CAM = [
  { p: [  0.0, 2.7, 16.0 ], t: [ 0.0, 6.2, -24.0 ], fov: 37 },  /* 0 hero - the road, gate, moon */
  { p: [ -4.9, 2.3, 10.2 ], t: [ 3.2, 4.6,  -7.0 ], fov: 45 },  /* 1 game - cards over the road  */
  { p: [  4.8, 2.5,  9.8 ], t: [ -8.8, 3.6,  0.4 ], fov: 40 },  /* 2 armory - the lit hall       */
  { p: [ -2.3, 3.9, -8.8 ], t: [ 2.2, 8.8, -30.0 ], fov: 46 }, /* 3 ascent - stairs and banners */
  { p: [  0.0, 7.8, -12.0 ], t: [ 0.0, 11.5, -42.0 ], fov: 46 }, /* 4 arena - the walls, lit      */
  { p: [  0.0, 22.5, -16.0 ], t: [ 0.0, 50.0, -120 ], fov: 46 } /* 5 legacy - the blood moon     */
];
const RIG = { prog: 0, smooth: 0, mx: 0, my: 0, tmx: 0, tmy: 0, intro: REDUCE ? 1 : 0 };
let curveP, curveT;
function buildRig() {
  curveP = new THREE.CatmullRomCurve3(CAM.map(c => new THREE.Vector3(...c.p)), false, 'catmullrom', .4);
  curveT = new THREE.CatmullRomCurve3(CAM.map(c => new THREE.Vector3(...c.t)), false, 'catmullrom', .4);
}
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3();
function aspectFix() { return clamp((1.6 - vpW() / vpH()) / 1.05, 0, 1); }
function applyCamera() {
  const Nn = CAM.length - 1;
  const u = clamp(RIG.smooth / Nn, 0, 1);
  curveP.getPoint(u, _p); curveT.getPoint(u, _t);
  const i = clamp(Math.floor(RIG.smooth), 0, Nn - 1), f = clamp(RIG.smooth - i, 0, 1);
  let fov = lerp(CAM[i].fov, CAM[i + 1].fov, f);
  /* tall frames: step back along the view axis and widen a touch */
  const nf = aspectFix();
  if (nf > 0) {
    _d.subVectors(_p, _t).normalize();
    _p.addScaledVector(_d, nf * 7.4);
    _p.y += nf * 1.2;
    fov *= 1 + nf * .34;
  }
  /* opening dolly */
  const io = 1 - RIG.intro;
  _p.z += io * 6.4; _p.y += io * .7; fov += io * 9;
  /* hand-held drift */
  const par = 1 - smooth(0, 1.4, RIG.smooth) * .5;
  _p.x += RIG.mx * .6 * par; _p.y += RIG.my * .32 * par;
  _t.x -= RIG.mx * .22 * par; _t.y -= RIG.my * .12 * par;
  camera.position.copy(_p);
  camera.lookAt(_t);
  if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
}

/* ============================================================ scroll */
const SECS = [].slice.call(document.querySelectorAll('[data-cam]'));
let anchors = [], maxScroll = 1, activeSec = 0;
function measure() {
  maxScroll = Math.max(1, document.documentElement.scrollHeight - vpH());
  anchors = SECS.map((el, i) => {
    if (i === 0) return 0;
    if (i === SECS.length - 1) return Math.min(maxScroll, el.offsetTop - vpH() * .12);
    return clamp(el.offsetTop + el.offsetHeight * .5 - vpH() * .55, 0, maxScroll);
  });
  for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 1);
}
function progressFor(y) {
  if (y <= anchors[0]) return 0;
  for (let i = 0; i < anchors.length - 1; i++)
    if (y <= anchors[i + 1]) return i + (y - anchors[i]) / (anchors[i + 1] - anchors[i]);
  return anchors.length - 1;
}

/* ============================================================ page ui */
const $ = s => document.querySelector(s);
const $$ = s => [].slice.call(document.querySelectorAll(s));
const nav = $('#nav'), preEl = $('#pre'), preFill = $('#pre-fill');

function splitWords() {
  $$('.word-reveal').forEach(el => {
    const walk = node => {
      [].slice.call(node.childNodes).forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
            const mask = document.createElement('span'); mask.className = 'word-mask';
            const w = document.createElement('span'); w.className = 'word'; w.textContent = tok;
            mask.appendChild(w); frag.appendChild(mask);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && !ch.classList.contains('word-mask')) walk(ch);
      });
    };
    walk(el);
    $$('.word', el).forEach((w, i) => w.style.setProperty('--word-delay', (i * 55) + 'ms'));
  });
}
function wireReveals() {
  splitWords();
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('rv-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .05 });
  $$('[data-rv]').forEach(el => io.observe(el));
}

function fitWordmark() {
  const el = $('#wordmark');
  if (!el) return;
  const line = el.querySelector('.wm-line');
  el.style.fontSize = '100px';
  const w = line.scrollWidth;
  const avail = el.clientWidth;
  el.style.fontSize = (100 * avail / w * .995) + 'px';
}

function wireNav() {
  const menuBtn = $('#menu-btn');
  menuBtn.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
    $('#mobile-menu').setAttribute('aria-hidden', !open);
  });
  $$('#mobile-menu a').forEach((a, i) => {
    a.style.transitionDelay = (i * 50) + 'ms';
    a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = $(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'start' });
    });
  });
}
function updateRail() {
  $$('#rail a').forEach(a => a.classList.toggle('on', +a.dataset.rail === activeSec));
}

/* ============================================================ cursor */
function wireCursor() {
  if (!matchMedia('(pointer:fine)').matches || REDUCE) return;
  document.body.classList.add('cursor-on');
  const cur = $('#cursor');
  let cx = -100, cy = -100, txx = -100, tyy = -100;
  addEventListener('pointermove', e => {
    txx = e.clientX; tyy = e.clientY;
    RIG.tmx = (e.clientX / vpW() - .5) * 2;
    RIG.tmy = (e.clientY / vpH() - .5) * -2;
  }, { passive: true });
  document.addEventListener('pointerover', e => {
    cur.classList.toggle('link', !!(e.target.closest && e.target.closest('a,button')));
  });
  (function loop() {
    cx = lerp(cx, txx, .22); cy = lerp(cy, tyy, .22);
    cur.style.transform = 'translate(' + cx + 'px,' + cy + 'px)' + (cur.classList.contains('link') ? ' scale(1.6)' : '');
    requestAnimationFrame(loop);
  })();
}

/* ============================================================ grain */
function makeGrain() {
  const S = 160, c = cvs(S, S), g = c.getContext('2d');
  const im = g.createImageData(S, S), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 26;
  }
  g.putImageData(im, 0, 0);
  $('#grain').style.backgroundImage = 'url(' + c.toDataURL() + ')';
}

/* ============================================================ boot */
function build() {
  initGL(); initMaterials();
  buildLights(); buildSky(); buildGround(); buildSwords();
  buildGate(); buildStairs(); buildArena(); buildArmoryHall();
  buildParticles(); buildCards();
  /* road-side braziers between hero and gate */
  buildBrazier(-4.4, 15.2, { light: false });
  buildBrazier(2.9, 13.8, { light: true });
  buildBanner(5.5, 14.2, { ry: -.4 });
  buildRig();
}

let last = 0, raf = 0, T = 0;
function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000 || .016);
  last = now; T += dt;
  RIG.prog = progressFor(scrollY);
  RIG.smooth = REDUCE ? RIG.prog : damp(RIG.smooth, RIG.prog, 5, dt);
  RIG.mx = damp(RIG.mx, RIG.tmx, 2.6, dt);
  RIG.my = damp(RIG.my, RIG.tmy, 2.6, dt);
  RIG.intro = damp(RIG.intro, 1, 1.4, dt);
  const sec = Math.round(clamp(RIG.prog, 0, SECS.length - 1));
  if (sec !== activeSec) { activeSec = sec; updateRail(); }
  if (!REDUCE) {
    updateParticles(T, dt);
    updateFlames(T);
    updateBanners(T);
    updateCards(T, dt);
  }
  applyCamera();
  renderer.render(scene, camera);
}

function onResize() {
  renderer.setSize(vpW(), vpH());
  camera.aspect = vpW() / vpH();
  camera.updateProjectionMatrix();
  fitWordmark();
  measure();
}

function boot() {
  makeGrain();
  preFill.style.transform = 'scaleX(.3)';
  build();
  preFill.style.transform = 'scaleX(.7)';
  wireReveals(); wireNav(); wireCursor();
  fitWordmark(); measure();
  addEventListener('resize', onResize);
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 40);
  }, { passive: true });
  nav.classList.toggle('scrolled', scrollY > 40);
  /* first frame, then release the preloader */
  last = performance.now();
  raf = requestAnimationFrame(frame);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    preFill.style.transform = 'scaleX(1)';
    setTimeout(() => preEl.classList.add('done'), 240);
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { last = performance.now(); raf = requestAnimationFrame(frame); }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

})();
