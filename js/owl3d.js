/* Dishyooom — 3D owl (മൂ) that flies to and perches in the section on screen.
   Loaded lazily by main.js (dynamic import) only when want3D() passes; main.js keeps the 2D owl
   as the fallback. The model's clips play in place, so all travel happens here, in viewport px.

   Perches are marked in index.html: data-perch="<x fraction along the top edge>",
   optional data-perch-y (stand at this height fraction instead of the top edge, e.g. on a fist in
   an image), data-perch-dy (px), data-perch-media (media query), data-perch-hover (hover in the air),
   data-perch-mood="approve" (WingWave + happy eyes on arrival).
   With no perch on screen he waits in the bottom-right corner, but not for long: he fidgets, now
   and then flies out to hover mid-screen for a moment (onIdle lets main.js give him a line), leans
   as the page scrolls and, on touch screens, looks where you tap. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MODEL_URL = new URL('../models/owl.glb', import.meta.url).href;

/* ---------- config -------------------------------------------------------- */
// how the owl behaves once perched in each section
const BEHAVIOUR = {
  hero:     { lids: { Angry: 0.35 }, extra: 'HeadTurn' },
  about:    { extra: 'HeadTurn' },
  services: { lids: { Angry: 0.15 }, extra: 'HeadTurn' },
  process:  { lids: { Open: 0.45 } },
  faq:      {},
  contact:  { lids: { Happy: 0.5 }, extra: 'WingWave' },
  footer:   { lids: { Closed: 1 }, speed: 0.4, asleep: true },
};
const MOODS = { approve: { lids: { Happy: 0.6 }, extra: 'WingWave' } };
const ASLEEP = { lids: { Closed: 1 }, speed: 0.4, asleep: true };
const ONE_SHOT = new Set(['Takeoff', 'Land', 'Hop', 'HeadTurn', 'WingWave']);
const TEXT_SEL = 'h1, h2, h3, p:not(.eyebrow), .btn, summary, .svc__desc';
const VIEW_H = 0.6;            // metres visible in the canvas (owl is 0.25 m tall → C = 2.4 H)
const OWL_M = 0.25;
// the owl's extent around its feet, in owl heights (spread wings included), and the gap it keeps
// from the viewport edges: it never flies or lands outside this box
const REACH_X = 0.8, REACH_UP = 1.25, EDGE = 6;   // measured: 0.78 / 1.23 at full wing spread

const owlHeight = () => (innerWidth <= 640 ? 80 : innerWidth <= 959 ? 100 : 120);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
const yieldToPage = () => new Promise((r) => setTimeout(r, 0));   // keep each setup step under 50 ms

/* ---------- entry ----------------------------------------------------------- */
export async function createOwl3D({ owl, onFail, onIdle }) {
  const nav = document.getElementById('nav');
  const body = owl.querySelector('.owl__body');
  const bubble = owl.querySelector('.owl__bubble');

  /* --- stage ---------------------------------------------------------------- */
  let H = owlHeight(), C = Math.round(H * 2.4);
  const lowMem = (navigator.deviceMemory || 8) <= 4;
  let dprCap = lowMem ? 1.5 : 2;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  renderer.setSize(C, C, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.3;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  await yieldToPage();

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  await yieldToPage();
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(0.6, 1.2, 0.9);
  const rim = new THREE.DirectionalLight(0x9fe0da, 1.0); rim.position.set(-0.8, 0.6, -0.8);
  scene.add(key, rim, new THREE.HemisphereLight(0xffffff, 0x8a7f85, 0.5));

  const FOV = 18, TILT = THREE.MathUtils.degToRad(8);
  const dist = VIEW_H / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 10);
  const look = new THREE.Vector3(0, 0.125, 0);
  camera.position.set(0, look.y + Math.sin(TILT) * dist, Math.cos(TILT) * dist);
  camera.lookAt(look);
  camera.updateMatrixWorld();
  // where the feet (world origin) land in the canvas, as a fraction of C
  const feetNdc = new THREE.Vector3(0, 0, 0).project(camera);
  const FX = (feetNdc.x + 1) / 2, FY = (1 - feetNdc.y) / 2;

  /* --- model ---------------------------------------------------------------- */
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(MODEL_URL);
  const model = gltf.scene;
  const morphMeshes = [], eyes = [];
  let head = null;
  model.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      const m = o.material;
      // sheen is invisible at ~120 px; standard material is cheaper. Keep clearcoat on the eyes.
      if (m && m.isMeshPhysicalMaterial && !(m.clearcoat > 0)) {
        o.material = new THREE.MeshStandardMaterial({
          name: m.name, color: m.color, roughness: m.roughness, metalness: m.metalness, side: m.side,
        });
        m.dispose();
      }
      if (o.morphTargetDictionary) morphMeshes.push(o);
    }
    if (o.isBone && o.name === 'head') head = o;
    if (o.isBone && (o.name === 'eye.L' || o.name === 'eye.R')) eyes.push(o);
  });
  // feet-pivot (yaw) → body-centre pivot (pitch/roll) → model
  const yawG = new THREE.Group(), tiltG = new THREE.Group();
  tiltG.position.y = 0.11; model.position.y = -0.11;
  tiltG.add(model); yawG.add(tiltG); scene.add(yawG);
  model.updateMatrixWorld(true);
  const headRestInv = new THREE.Quaternion();
  if (head) head.getWorldQuaternion(headRestInv).invert();

  const mixer = new THREE.AnimationMixer(model);
  const actions = {};
  for (const clip of gltf.animations) {
    const a = mixer.clipAction(clip);
    if (ONE_SHOT.has(clip.name) || clip.name === 'Blink') { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = clip.name !== 'Blink'; }
    actions[clip.name] = a;
  }
  let base = null;                       // the clip currently driving the body
  function play(name, { fade = 0.25, speed = 1 } = {}) {
    const next = actions[name];
    if (!next) return;
    next.timeScale = speed;
    if (next === base) { if (ONE_SHOT.has(name)) next.reset().play(); return; }
    next.reset().setEffectiveWeight(1).play();
    if (base) base.crossFadeTo(next, fade, false);
    base = next;
  }
  const clipName = () => base?.getClip().name;

  await renderer.compileAsync(scene, camera);

  /* --- DOM: move #owl into a full-page layer -------------------------------- */
  const home = { parent: owl.parentNode, next: owl.nextSibling };
  const startRect = body.getBoundingClientRect();
  const startVisible = !owl.classList.contains('is-hidden') && startRect.width > 0;
  const layer = document.createElement('div');
  layer.className = 'owl3d-layer';
  document.documentElement.classList.add('has-owl3d');
  document.body.appendChild(layer);
  layer.appendChild(owl);
  owl.prepend(canvas);
  owl.classList.add('is-3d', 'is-fixed');
  owl.removeAttribute('data-pose');
  function applySize() {
    owl.style.setProperty('--c', `${C}px`);
    owl.style.setProperty('--h', `${H}px`);
    owl.style.setProperty('--fx', `${(FX * C).toFixed(1)}px`);
    owl.style.setProperty('--fy', `${(FY * C).toFixed(1)}px`);
  }
  applySize();

  /* --- perches ---------------------------------------------------------------- */
  let perches = [];
  function scanPerches() {
    perches = [...document.querySelectorAll('[data-perch]')].map((el) => {
      const sec = el.closest('[data-owl]');
      const media = el.dataset.perchMedia;
      return {
        el, section: sec ? sec.dataset.owl : null, sectionEl: sec,
        fx: parseFloat(el.dataset.perch) || 0.5, dy: parseFloat(el.dataset.perchDy) || 0,
        fy: el.dataset.perchY !== undefined ? parseFloat(el.dataset.perchY) : null,
        hover: el.hasAttribute('data-perch-hover'), mood: el.dataset.perchMood,
        mq: media ? matchMedia(media) : null, w: 0, h: 0, th: 0, fixed: false,
        reveal: el.closest('.reveal'),
      };
    });
    refreshPerches();
  }
  function refreshPerches() {
    for (const p of perches) {
      p.w = p.el.offsetWidth; p.h = p.el.offsetHeight;
      const t = getComputedStyle(p.el).transform;
      p.th = t && t !== 'none' ? Math.atan2(new DOMMatrixReadOnly(t).b, new DOMMatrixReadOnly(t).a) : 0;
      p.fixed = p.hover || isPinnedOrSticky(p.el);
    }
  }
  function isPinnedOrSticky(el) {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const pos = getComputedStyle(e).position;
      if (pos === 'sticky' || pos === 'fixed') return true;
      if (e.parentElement?.classList.contains('pin-spacer')) return true; // ScrollTrigger pin: position: fixed while active
    }
    return false;
  }
  const CORNER = { corner: true, section: null, fixed: true, hover: false, th: 0 };
  // a short flight out of the corner: hover at a viewport point for a moment, then go back
  const PATROL = { pt: { x: 0, y: 0 }, section: null, fixed: true, hover: true, th: 0 };
  const _a = { x: 0, y: 0, slope: 0 };
  function anchor(p, out = _a) {          // perch point in viewport px
    if (p.pt) { out.x = p.pt.x; out.y = p.pt.y; out.slope = 0; return out; }
    if (p.corner) {
      const gutter = clamp(innerWidth * 0.04, 16, 48);
      out.x = innerWidth - Math.max(gutter + 0.45 * H, REACH_X * H + EDGE); out.y = innerHeight - EDGE; out.slope = 0; return out;
    }
    const r = p.el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const lx = (p.fx - 0.5) * p.w, ly = (p.fy !== null ? (p.fy - 0.5) * p.h : -p.h / 2) + p.dy - (p.hover ? 0.35 * H : 0);
    const c = Math.cos(p.th), s = Math.sin(p.th);
    out.x = cx + lx * c - ly * s; out.y = cy + lx * s + ly * c; out.slope = p.th;
    // a .reveal still sliding in: aim for where it will end up
    if (p.reveal) { const t = getComputedStyle(p.reveal).transform; if (t && t !== 'none') out.y -= new DOMMatrixReadOnly(t).f; }
    return out;
  }
  const textCache = new Map();
  function textRects(sectionEl) {
    let list = textCache.get(sectionEl);
    if (!list) { list = [...sectionEl.querySelectorAll(TEXT_SEL)]; textCache.set(sectionEl, list); }
    const rects = [];
    const range = document.createRange();
    for (const el of list) {
      if (el.classList.contains('btn')) { rects.push(el.getBoundingClientRect()); continue; }
      range.selectNodeContents(el);
      for (const r of range.getClientRects()) rects.push(r);
    }
    return rects;
  }
  function coversText(p, a) {
    const L = a.x - 0.4 * H, R = a.x + 0.4 * H, T = a.y - 1.1 * H, B = a.y - 2;
    const area = (R - L) * (B - T);
    for (const r of textRects(p.sectionEl)) {
      const w = Math.min(R, r.right) - Math.max(L, r.left), h = Math.min(B, r.bottom) - Math.max(T, r.top);
      if (w > 0 && h > 0 && (w * h) / area > 0.25) return true;
    }
    return false;
  }
  const navBottom = () => (nav ? nav.getBoundingClientRect().bottom : 0);
  // can the owl stand here right now? (on screen, clear of the nav, not covering text)
  function candidateOk(p, b) {
    if (!p.el || (p.mq && !p.mq.matches) || !p.el.getClientRects().length) return false;
    anchor(p, b);
    if (b.y - REACH_UP * H < navBottom() + 8 || b.y > innerHeight - 24 || b.x - REACH_X * H < EDGE || b.x + REACH_X * H > innerWidth - EDGE) return false;
    return p.hover || !coversText(p, b);
  }
  function pickPerch(section) {
    const vh = innerHeight;
    let best = null, bestScore = -Infinity;
    const b = { x: 0, y: 0, slope: 0 };
    for (const p of perches) {
      if (p.section !== section || !candidateOk(p, b)) continue;
      const score = -Math.abs(b.y - 0.55 * vh) - 0.35 * Math.hypot(b.x - pos.x, b.y - pos.y) + (p === perch ? 150 : 0);
      if (score > bestScore) { best = p; bestScore = score; }
    }
    return best || CORNER;
  }
  function inBand(y) { return y - H > navBottom() - 12 && y < innerHeight - 4; }

  /* --- state ----------------------------------------------------------------- */
  const pos = { x: 0, y: 0 }, vel = { x: 0, y: 0 }, dock = { x: 0, y: 0 };
  let state = 'perch', stateT = 0, perch = CORNER, docked = false;
  let goalSection = null, perchSection = null, holdT = 0, checkT = 0, repickT = 0, airT = 0;
  let pending = null;                      // { section, resolve } from goTo()
  let visible = startVisible, menuHidden = false, sleeping = false, pokeT = 0;
  let extraT = -1, idleT = 8 + Math.random() * 6, blinkT = 2;
  let yaw = 0, pitch = 0, roll = 0, lastVx = 0;
  const lids = { Open: 0, Closed: 0, Happy: 0, Angry: 0, Sad: 0 };
  let lastScroll = scrollY, scrollVel = 0, fastT = 0;
  let cornerT = 0, patrolT = 0, patrols = 0, patrolSection = null, stillT = 0;

  // start exactly where the 2D owl's feet were, standing on the corner spot
  if (startVisible) { pos.x = startRect.left + startRect.width / 2; pos.y = startRect.bottom; }
  else anchor(CORNER, pos);
  perch = CORNER; perchSection = null;
  play('Idle', { fade: 0 });
  owl.classList.toggle('is-hidden', !startVisible);

  const D = () => Math.hypot(innerWidth, innerHeight);
  const MAXV = () => 0.62 * D(), MAXA = () => 2.4 * MAXV(), ARRIVE = () => 0.26 * MAXV();

  function behaviour() {
    if (sleeping) return ASLEEP;
    const b = BEHAVIOUR[perchSection] || {};
    const m = perch.mood && MOODS[perch.mood];
    return m ? { ...b, ...m, lids: { ...(b.lids || {}), ...m.lids } } : b;
  }
  function settle() {                      // set the clip for a landed / hovering owl
    const b = behaviour();
    play(perch.hover ? 'Hover' : 'Idle', { speed: b.speed || 1 });
    extraT = b.extra && !b.asleep ? 0.5 : -1;
  }
  function resolvePending(ok) {
    if (!pending || (ok && pending.section !== perchSection)) return;
    const p = pending; pending = null; p.resolve(ok);
  }
  function setDocked(on) {
    docked = on;
    owl.classList.toggle('is-fixed', !on);
    if (on) { dock.x = pos.x + scrollX; dock.y = pos.y + scrollY; }
  }

  function takeoff() {
    const vw = innerWidth, vh = innerHeight, m = 0.35 * C;
    if (docked) { pos.x = dock.x - scrollX; pos.y = dock.y - scrollY; }
    else if (owl.classList.contains('is-corner')) pos.y = owl.getBoundingClientRect().top + FY * C;
    const off = pos.x < -m || pos.x > vw + m || pos.y < -m || pos.y > vh + m;
    setDocked(false);
    owl.classList.remove('is-perched', 'has-bubble');
    bubble.classList.remove('is-on');      // the last line belongs to the old spot
    airT = 0;
    if (off) {                             // scrolled far away: enter at the nearest edge, already flying
      contain(pos);
      const t = anchor(perch, { x: 0, y: 0 });
      const dx = t.x - pos.x, dy = t.y - pos.y, d = Math.hypot(dx, dy) || 1;
      vel.x = (dx / d) * MAXV() * 0.6; vel.y = (dy / d) * MAXV() * 0.6;
      go('fly'); play('Fly', { fade: 0.15 });
    } else if (state === 'hover') {
      vel.x = vel.y = 0; go('fly'); play('Fly');
    } else {
      vel.x = 0; vel.y = 0; go('takeoff'); play('Takeoff', { fade: 0.15 });
    }
  }
  function go(s) { state = s; stateT = 0; }
  function patrol() {                      // returns false when there is no clear spot to hover at
    const vw = innerWidth, vh = innerHeight;
    const top = Math.max(navBottom() + REACH_UP * H + 24, 0.4 * vh), bottom = Math.max(top, 0.72 * vh);
    const sectionEl = document.querySelector(`[data-owl="${goalSection}"]`);
    const pt = { x: 0, y: 0 };
    for (let i = 0; i < 8; i++) {           // a few random tries for a spot that hides no text
      pt.x = clamp(vw * (0.3 + Math.random() * 0.35), REACH_X * H + EDGE, vw - REACH_X * H - EDGE);
      pt.y = top + Math.random() * (bottom - top);
      if (sectionEl && coversText({ sectionEl }, pt)) continue;
      PATROL.pt.x = pt.x; PATROL.pt.y = pt.y; PATROL.section = goalSection;
      perch = PATROL; perchSection = goalSection; patrolT = 3.2;
      takeoff();
      return true;
    }
    return false;
  }

  function retarget(force) {
    const next = goalSection ? pickPerch(goalSection) : CORNER;
    if (!force && next === perch && (state === 'perch' || state === 'hover')) {
      if (perchSection !== goalSection) { perchSection = goalSection; settle(); resolvePending(true); }
      return;
    }
    perch = next; perchSection = goalSection;
    if (state === 'perch' || state === 'hover') takeoff();
  }

  /* --- flight ---------------------------------------------------------------- */
  const T = { x: 0, y: 0, slope: 0 }, G = { x: 0, y: 0 };
  // pull a feet position into the on-screen box; with v, also drop any velocity heading out of it
  function contain(p, v) {
    const x0 = REACH_X * H + EDGE, x1 = Math.max(x0, innerWidth - REACH_X * H - EDGE);
    const y0 = REACH_UP * H + EDGE, y1 = Math.max(y0, innerHeight - EDGE);
    if (p.x < x0) { p.x = x0; if (v && v.x < 0) v.x = 0; } else if (p.x > x1) { p.x = x1; if (v && v.x > 0) v.x = 0; }
    if (p.y < y0) { p.y = y0; if (v && v.y < 0) v.y = 0; } else if (p.y > y1) { p.y = y1; if (v && v.y > 0) v.y = 0; }
    return p;
  }
  function seek(tx, ty, dt, w = 1, arrive = false) {
    const dx = tx - pos.x, dy = ty - pos.y, d = Math.hypot(dx, dy) || 1e-6;
    const maxv = MAXV(), s = arrive && d < ARRIVE() ? (maxv * d) / ARRIVE() : maxv;
    let ax = (dx / d) * s - vel.x, ay = (dy / d) * s - vel.y;
    const al = Math.hypot(ax, ay), amax = MAXA() * dt;
    if (al > amax) { ax *= amax / al; ay *= amax / al; }
    vel.x += ax * w; vel.y += ay * w;
    const vl = Math.hypot(vel.x, vel.y);
    if (vl > maxv) { vel.x *= maxv / vl; vel.y *= maxv / vl; }
    pos.x += vel.x * dt; pos.y += vel.y * dt;
    return d;
  }
  let clipHold = 0, flapT = 0;
  function pickFlightClip(dt) {
    clipHold -= dt;
    const v = Math.hypot(vel.x, vel.y), maxv = MAXV();
    let want = 'Fly';
    if (vel.y > 0.6 * v && v > 0.7 * maxv) want = 'Dive';
    else if (vel.y > 0.3 * v && v > 0.35 * maxv) want = 'Glide';
    if (want === 'Fly') { flapT += dt; if (flapT > 1.2 && v > 0.6 * maxv) { want = 'Glide'; if (flapT > 2.2) flapT = 0; } }
    else flapT = 0;
    if (want !== clipName() && clipHold <= 0) { play(want); clipHold = 0.5; }
  }
  let land0 = { x: 0, y: 0 }, landV = { x: 0, y: 0 };
  const LAND_T = 0.9;                      // Land clip touches down at frame 27

  function step(dt) {
    const vw = innerWidth, vh = innerHeight, maxv = MAXV();
    stateT += dt;
    // scroll speed (px/s), smoothed
    const sv = (scrollY - lastScroll) / Math.max(dt, 1e-3); lastScroll = scrollY;
    scrollVel = damp(scrollVel, sv, 10, dt);
    const scrollFast = Math.abs(scrollVel) > 1.2 * vh;
    fastT = scrollFast ? 0 : fastT + dt;

    if (state === 'perch' || state === 'hover') {
      if (docked) { pos.x = dock.x - scrollX; pos.y = dock.y - scrollY; }
      else if (state === 'hover') { anchor(perch, T); pos.x = damp(pos.x, T.x, 6, dt); pos.y = damp(pos.y, T.y + Math.sin(stateT * 3) * 4, 6, dt); }
      else anchor(perch, pos);
      if (goalSection !== perchSection) {
        holdT += dt;
        if (holdT > 0.25) { holdT = 0; retarget(); }
      } else {
        holdT = 0;
        checkT += dt;
        if (!perch.corner && !inBand(pos.y)) retarget();
        else if (perch.corner && checkT > 1.5) { checkT = 0; retarget(); }   // a real perch may have appeared
        else if (docked && checkT > 1) {                                       // layout drift
          checkT = 0;
          const a = anchor(perch, { x: 0, y: 0 });
          const d = Math.hypot(a.x - pos.x, a.y - pos.y);
          if (d > 3) { if (d < 0.9 * H) { pos.x = a.x; pos.y = a.y; setDocked(true); play('Hop'); } else retarget(true); }
        }
      }
      // perched behaviour: arrival extra, occasional head turn, blink
      if (extraT >= 0 && (extraT -= dt) < 0) { const b = behaviour(); if (b.extra) play(b.extra); }
      const inCorner = perch.corner && state === 'perch';
      if (!sleeping && state === 'perch' && (idleT -= dt) < 0) {
        // in the corner he fidgets more often, and not always with a head turn
        idleT = inCorner ? 4 + Math.random() * 3 : 8 + Math.random() * 6;
        if (clipName() === 'Idle' && !behaviour().asleep) play(inCorner ? ['HeadTurn', 'Hop', 'HeadTurn', 'WingWave'][(Math.random() * 4) | 0] : 'HeadTurn');
      }
      // scrolling again after a still moment: a small startled hop
      const moving = Math.abs(scrollVel) > 0.3 * vh;
      if (moving && inCorner && stillT > 2 && clipName() === 'Idle' && !sleeping) play('Hop');
      stillT = moving ? 0 : stillT + dt;
      // stuck in the corner (no perch on screen): every so often fly out and hover mid-screen
      if (patrolSection !== goalSection) { patrolSection = goalSection; patrols = 0; }
      cornerT = inCorner && !sleeping && fastT > 1 && goalSection && goalSection !== 'footer' ? cornerT + dt : 0;
      if (cornerT > (patrols ? 11 : 6) && patrols < 3) { cornerT = 0; if (patrol()) patrols++; else play('WingWave'); }
      if (perch === PATROL && state === 'hover' && (patrolT -= dt) < 0) { perch = pickPerch(goalSection); takeoff(); }
      return;
    }

    // airborne
    airT += dt;
    let goal = perch;
    if (scrollFast && airT > 0.3) goal = null;          // escort while the page flies past
    if (goal) anchor(goal, T);
    else { T.x = vw - 0.9 * H; T.y = 0.42 * vh + H * 0.5; }
    if (goal && (repickT += dt) > 0.3) {               // a better or still-valid perch?
      repickT = 0;
      // keep the chosen perch while it stays usable; only the corner fallback keeps looking
      if (perch !== PATROL && fastT > 0.25 && (perch.corner || airT > 4 || !candidateOk(perch, { x: 0, y: 0 }))) {
        const next = pickPerch(goalSection);
        if (next !== perch) { perch = next; anchor(perch, T); }
      }
    }
    const dirX = Math.sign(T.x - pos.x) || 1;
    G.x = T.x - dirX * 110 * (H / 120); G.y = T.y - 120 * (H / 120);   // approach gate: above and behind,
    const { x: gx, y: gy } = contain(G);                                 // but never off screen

    if (state === 'takeoff') {
      if (stateT < 0.25) { /* crouch */ }
      else {
        if (vel.x === 0 && vel.y === 0) { vel.x = dirX * 0.16 * maxv; vel.y = -0.5 * maxv; }
        vel.y += 0.8 * maxv * dt;
        seek(gx, gy, dt, smoothstep(0.5, 1.2, stateT));
      }
      if (stateT >= 1.2) { go('fly'); play('Fly'); }
    } else if (state === 'fly') {
      seek(goal ? gx : T.x, goal ? gy : T.y, dt, 1, !!goal);   // ease into the approach gate, no overshoot
      pickFlightClip(dt);
      if (goal && (Math.hypot(gx - pos.x, gy - pos.y) < ARRIVE() * 0.6 || Math.hypot(T.x - pos.x, T.y - pos.y) < ARRIVE())) {
        go('approach'); play(T.y < pos.y - 20 ? 'Hover' : 'Descend');
      }
    } else if (state === 'approach') {
      if (!goal) { go('fly'); play('Glide'); }
      else {
        // critically damped spring onto the perch: brakes hard but never overshoots
        const k = 42, c = 2 * Math.sqrt(k);
        vel.x += (k * (T.x - pos.x) - c * vel.x) * dt;
        vel.y += (k * (T.y - pos.y) - c * vel.y) * dt;
        pos.x += vel.x * dt; pos.y += vel.y * dt;
        const d = Math.hypot(T.x - pos.x, T.y - pos.y), v = Math.hypot(vel.x, vel.y);
        if (d < 60 * (H / 120) + 0.15 * v && !scrollFast) {
          if (perch.hover) {
            go('hover'); vel.x = vel.y = 0; settle(); owl.classList.remove('is-perched'); resolvePending(true);
            if (perch === PATROL) onIdle?.();
          }
          else { go('land'); land0 = { x: pos.x, y: pos.y }; landV = { x: vel.x, y: vel.y }; play('Land', { fade: 0.2 }); }
        } else if (d > ARRIVE() * 2.5) { go('fly'); play('Fly'); }
      }
    } else if (state === 'land') {
      const u = Math.min(stateT / LAND_T, 1);
      if (!goal || (u < 0.6 && Math.hypot(T.x - pos.x, T.y - pos.y) > 1.5 * H)) { go('fly'); play('Fly'); return; }
      // cubic Hermite from the approach point/velocity to the perch, ending at rest
      const lv = Math.hypot(landV.x, landV.y), k = Math.min(1, (400 * (H / 120)) / (lv || 1)) * LAND_T;
      const u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2;
      const nx = h00 * land0.x + h10 * landV.x * k + h01 * T.x, ny = h00 * land0.y + h10 * landV.y * k + h01 * T.y;
      vel.x = (nx - pos.x) / Math.max(dt, 1e-3); vel.y = (ny - pos.y) / Math.max(dt, 1e-3);
      pos.x = nx; pos.y = ny;
      if (u >= 1) {
        pos.x = T.x; pos.y = T.y; vel.x = vel.y = 0;
        go('perch'); setDocked(!perch.fixed);   // Land keeps folding the wings; settle() when it finishes
        owl.classList.add('is-perched');
        extraT = -1; checkT = 0; idleT = 8 + Math.random() * 6;
      }
    }
  }
  mixer.addEventListener('finished', (e) => {
    const n = e.action.getClip().name;
    if (n === 'Blink') return;
    if (n === 'Land' && state === 'perch') { settle(); setTimeout(() => resolvePending(true), 120); return; }
    if ((n === 'HeadTurn' || n === 'WingWave' || n === 'Hop') && (state === 'perch' || state === 'hover')) {
      play(state === 'hover' ? 'Hover' : 'Idle', { speed: behaviour().speed || 1 });
    }
  });

  /* --- pose, expression, eyes ---------------------------------------------------- */
  const pointer = { x: -1, y: -1, on: false };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const onPointer = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true; };
  if (finePointer) addEventListener('pointermove', onPointer, { passive: true });
  // touch screens have no hover: he looks toward each tap for a couple of seconds instead
  let tapLookT = 0;
  const onTap = (e) => { if (e.pointerType === 'mouse') return; onPointer(e); tapLookT = 2.2; };
  if (!finePointer) addEventListener('pointerdown', onTap, { passive: true });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), lookPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.45);
  const lookTarget = new THREE.Vector3(0, 0.17, 1), smoothTarget = lookTarget.clone();
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _p = new THREE.Vector3(), _d = new THREE.Vector3(), _f = new THREE.Vector3(), _dq = new THREE.Quaternion();
  const MAX_EYE = 0.45;
  function aimEyes(left, top) {
    if (!head || !eyes.length) return;
    const watching = (finePointer ? pointer.on : tapLookT > 0) && (state === 'perch' || state === 'hover') && !behaviour().asleep;
    if (watching) {
      ndc.set(((pointer.x - left) / C) * 2 - 1, -(((pointer.y - top) / C) * 2 - 1));
      ray.setFromCamera(ndc, camera);
      ray.ray.intersectPlane(lookPlane, lookTarget);
    } else lookTarget.set(0, 0.17, 1);
    smoothTarget.lerp(lookTarget, 0.15);
    head.getWorldQuaternion(_q);
    _f.set(0, 0, 1).applyQuaternion(headRestInv).applyQuaternion(_q).normalize();
    for (const eye of eyes) {
      eye.getWorldPosition(_p);
      _d.copy(smoothTarget).sub(_p).normalize();
      const ang = _f.angleTo(_d);
      if (ang > MAX_EYE) _d.lerp(_f, 1 - MAX_EYE / ang).normalize();
      _dq.setFromUnitVectors(_f, _d);
      eye.getWorldQuaternion(_q2);
      const world = _dq.multiply(_q2);
      eye.parent.getWorldQuaternion(_q2);
      eye.quaternion.copy(_q2.invert().multiply(world));
    }
  }
  function updatePose(dt) {
    const vw = innerWidth;
    const airborne = state !== 'perch' && state !== 'hover';
    let yawT;
    if (airborne && state !== 'takeoff') {
      if (Math.abs(vel.x) > 40) lastVx = vel.x;
      yawT = Math.sign(lastVx || 1) * THREE.MathUtils.degToRad(70) * smoothstep(20, 220, Math.abs(vel.x) + 120);
    } else {
      yawT = clamp((vw / 2 - pos.x) / (vw / 2), -1, 1) * THREE.MathUtils.degToRad(20);
      if (tapLookT > 0) { tapLookT -= dt; yawT = clamp((pointer.x - pos.x) / (2 * H), -1, 1) * THREE.MathUtils.degToRad(40); }
    }
    yaw = damp(yaw, yawT, 8, dt);
    const pitchT = airborne ? clamp(0.35 * Math.atan2(vel.y, Math.abs(vel.x) + 1), -0.3, 0.3) : 0;
    pitch = damp(pitch, pitchT, 6, dt);
    const lean = perch.corner ? clamp((scrollVel / innerHeight) * 0.06, -0.14, 0.14) : 0;   // holds on as the page scrolls
    const rollT = airborne ? clamp(-vel.x / MAXV() * 0.12, -0.2, 0.2) : (state === 'perch' ? -0.6 * perch.th + lean : 0);
    roll = damp(roll, rollT, 6, dt);
    yawG.rotation.y = yaw; tiltG.rotation.x = pitch; tiltG.rotation.z = roll;
  }
  function updateLids(dt) {
    const b = airborne() ? {} : behaviour();
    const target = { ...(b.lids || {}) };
    if (pokeT > 0) { pokeT -= dt; target.Angry = Math.max(target.Angry || 0, 0.5); }
    for (const n in lids) lids[n] = damp(lids[n], target[n] || 0, 6, dt);
  }
  const airborne = () => state !== 'perch' && state !== 'hover';
  function applyLids() {
    for (const m of morphMeshes) {
      const dict = m.morphTargetDictionary, inf = m.morphTargetInfluences;
      for (const n in lids) { const i = dict[n]; if (i !== undefined) inf[i] = Math.min(1, inf[i] + lids[n]); }
      const ci = dict.Closed;           // a blink / closed lid wins over the other shapes
      if (ci !== undefined) { const keep = 1 - inf[ci]; for (const n in dict) if (dict[n] !== ci) inf[dict[n]] *= keep; }
    }
  }

  /* --- frame loop ------------------------------------------------------------------ */
  let raf = 0, last = 0, acc = 0, bubbleSide = '', running = false;
  const slow = []; let slowT = 0, degraded = false;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const rawDt = last ? (now - last) / 1000 : 1 / 60; last = now;
    const dt = Math.min(rawDt, 0.05);
    try {
      step(dt);
      if (airborne()) contain(pos, vel);
      // perched/hovering: 30 fps is plenty
      acc += dt;
      const throttle = (state === 'perch' || state === 'hover') && clipName() !== 'Land';
      if (throttle && acc < 1 / 31) { place(); return; }
      const mdt = acc; acc = 0;
      watchdog(rawDt, throttle);
      for (const m of morphMeshes) m.morphTargetInfluences.fill(0);
      mixer.update(mdt);
      if (clipName() !== 'Idle' && !behaviour().asleep && (blinkT -= mdt) <= 0) { actions.Blink?.reset().play(); blinkT = 2.5 + Math.random() * 3; }
      updateLids(mdt); applyLids(); updatePose(mdt);
      yawG.updateMatrixWorld(true);
      place();
      const left = (docked ? dock.x - scrollX : pos.x) - FX * C, top = (docked ? dock.y - scrollY : pos.y) - FY * C;
      aimEyes(left, top);
      renderer.render(scene, camera);
    } catch (err) { fail(err); }
  }
  function place() {
    // resting in the corner the owl is anchored with bottom: 0, not innerHeight: on phones the URL bar
    // collapses on the first scroll and innerHeight lags behind, which left him hanging in mid-air
    // (set inline, not in style.css: phones cache the stylesheet for a year)
    const corner = !docked && state === 'perch' && perch.corner;
    if (corner !== owl.classList.contains('is-corner')) {
      owl.classList.toggle('is-corner', corner);
      owl.style.top = corner ? 'auto' : '';
      owl.style.bottom = corner ? '0px' : '';
    }
    const x = (docked ? dock.x : pos.x) - FX * C;
    const y = corner ? pos.y - innerHeight + C - FY * C : (docked ? dock.y : pos.y) - FY * C;
    owl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    const side = pos.x < innerWidth * 0.5 ? 'right' : 'left';
    if (side !== bubbleSide) { bubbleSide = side; owl.classList.toggle('bubble-right', side === 'right'); }
    owl.classList.toggle('bubble-low', pos.y - 1.6 * H < navBottom());
    if (owl.dataset.state !== state) owl.dataset.state = state;
    const sec = String(perchSection), goal = String(goalSection);
    if (owl.dataset.section !== sec) owl.dataset.section = sec;
    if (owl.dataset.goal !== goal) owl.dataset.goal = goal;
  }
  function watchdog(rawDt, throttle) {
    if (throttle || document.hidden) return;
    slow.push(rawDt); if (slow.length > 90) slow.shift();
    if (slow.length < 60) return;
    const med = [...slow].sort((a, b) => a - b)[slow.length >> 1];
    slowT = med > 0.034 ? slowT + rawDt : 0;
    if (slowT > 3) {
      slowT = 0; slow.length = 0;
      if (!degraded) { degraded = true; dprCap = 1; renderer.setPixelRatio(1); renderer.setSize(C, C, false); }
      else { try { sessionStorage.setItem('dy-owl-2d', '1'); } catch { /* private mode */ } fail(new Error('too slow')); }
    }
  }
  function start() { if (!running && visible && !menuHidden && !document.hidden) { running = true; last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  const onResize = () => {
    const h = owlHeight();
    if (h !== H) { H = h; C = Math.round(H * 2.4); renderer.setSize(C, C, false); applySize(); }
    refreshPerches(); textCache.clear();
    if (state === 'perch' && docked) checkT = 1;   // re-check drift next frame
  };
  addEventListener('resize', onResize);
  window.ScrollTrigger?.addEventListener?.('refresh', refreshPerches);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail(new Error('webgl context lost')); });

  let dead = false;
  function fail(err) {
    if (dead) return;
    console.warn('[owl3d] falling back to 2D:', err && err.message);
    destroy();
    onFail?.(err);
  }
  function hide() {                         // fade out where it is; it never flies off screen
    visible = false;
    if (docked) { pos.x = dock.x - scrollX; pos.y = dock.y - scrollY; }
    owl.classList.add('is-hidden');
    perch = CORNER; perchSection = null; go('perch'); setDocked(false);
    stop();
  }
  function destroy() {
    if (dead) return;
    dead = true; stop();
    resolvePending(false);
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onPointer);
    removeEventListener('pointerdown', onTap);
    document.removeEventListener('visibilitychange', onVis);
    window.ScrollTrigger?.removeEventListener?.('refresh', refreshPerches);
    owl.classList.remove('is-3d', 'is-fixed', 'is-perched', 'is-corner', 'bubble-right', 'bubble-low');
    ['transform', 'top', 'bottom'].forEach((k) => owl.style.removeProperty(k));
    ['state', 'section', 'goal'].forEach((k) => delete owl.dataset[k]);
    ['--c', '--h', '--fx', '--fy'].forEach((v) => owl.style.removeProperty(v));
    canvas.remove();
    home.parent.insertBefore(owl, home.next && home.next.parentNode === home.parent ? home.next : null);
    layer.remove();
    document.documentElement.classList.remove('has-owl3d');
    renderer.dispose();
    renderer.forceContextLoss();
  }

  /* --- go ------------------------------------------------------------------------------ */
  scanPerches();
  owl.classList.add('is-perched');
  start();

  return {
    kind: '3d',
    goTo(section) {
      resolvePending(false);
      goalSection = section;
      return new Promise((resolve) => {
        pending = { section, resolve };
        if (!visible) return;                      // resolves once shown and landed
        if (state === 'perch' || state === 'hover') {
          if (perchSection === section) { resolvePending(true); return; }
          holdT = perchSection === null ? 1 : 0;    // first trip: no hesitation
        } else {                                    // already flying: head for the new section now
          perch = pickPerch(section); perchSection = section;
        }
      });
    },
    react(what) {
      if (what === 'poke') { pokeT = 1.5; if (state === 'perch') play('Hop'); }
      else if (what === 'sleep') { sleeping = true; if (state === 'perch' || state === 'hover') settle(); }
      else if (what === 'wake') { sleeping = false; if (state === 'perch' || state === 'hover') settle(); }
      else if (what === 'cta' && state === 'perch') play('Hop');
    },
    setVisible(show, { instant = false } = {}) {
      const apply = () => {
        owl.classList.toggle('is-hidden', !visible || menuHidden);
        visible && !menuHidden ? start() : stop();
      };
      if (instant) { menuHidden = !show; apply(); return; }   // e.g. the mobile menu covers the page
      if (show) {
        menuHidden = false;
        if (!visible) {                            // reappear where it faded out (on screen) and fly to the section
          visible = true;
          perch = goalSection ? pickPerch(goalSection) : CORNER; perchSection = goalSection;
          takeoff();
        }
        apply();
      } else if (visible) {
        resolvePending(false);
        hide();
      }
    },
    destroy,
  };
}
