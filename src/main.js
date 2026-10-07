import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildWorld } from './world.js';
import { spots, eggs, home, intro } from './data.js';

const $ = (id) => document.getElementById(id);
const V = (a) => new THREE.Vector3(...a);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

// ── renderer / scene / camera ──
const canvas = $('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#050807');
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
camera.position.copy(V(intro.pos));

const controls = new OrbitControls(camera, canvas);
controls.target.copy(V(intro.look));
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.enablePan = false;
controls.minDistance = 1.2;
controls.maxDistance = 10;
controls.minPolarAngle = 0.25;
controls.maxPolarAngle = 1.5;
controls.minAzimuthAngle = -1.0;
controls.maxAzimuthAngle = 1.0;
controls.rotateSpeed = 0.6;
controls.enabled = false;

const world = buildWorld(scene);

// ── post: bloom gives the green its aura ──
const size = new THREE.Vector2();
renderer.getSize(size);
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.65, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── state ──
let mood = 0;        // 0 night … 1 day (current)
let moodTarget = 0;
let started = false;
let active = null;   // open spot id
let fly = null;
let panelShift = 0;  // 0..1 eased
let panelShiftTarget = 0;

// ── layout ──
function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h;
  // keep the whole desk visible on tall/narrow screens
  camera.fov = w / h < 1 ? 38 + (1 - w / h) * 62 : 38;
  camera.updateProjectionMatrix();
  applyShift();
}
function applyShift() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (panelShift < 0.001) { camera.clearViewOffset(); camera.updateProjectionMatrix(); return; }
  if (w <= 720) camera.setViewOffset(w, h, 0, panelShift * h * 0.24, w, h);
  else camera.setViewOffset(w, h, panelShift * Math.min(440, w * 0.92) * 0.5, 0, w, h);
}
window.addEventListener('resize', resize);
resize();

// ── camera flights ──
function flyTo(view, dur = 1.5) {
  fly = { t: 0, dur, p0: camera.position.clone(), t0: controls.target.clone(), p1: V(view.pos), t1: V(view.look) };
  controls.enabled = false;
}

// ── pins + index ──
const pinsEl = $('pins');
const indexEl = $('index');
const pins = {};
Object.entries(spots).forEach(([id, s], i) => {
  const b = document.createElement('button');
  b.className = 'pin off';
  b.innerHTML = `<i></i><span>${s.label}</span>`;
  b.setAttribute('aria-label', `Open ${s.label}`);
  b.addEventListener('click', () => openSpot(id));
  b.addEventListener('pointerenter', () => setHover(id));
  b.addEventListener('pointerleave', () => setHover(null));
  pinsEl.appendChild(b);
  pins[id] = b;

  const n = document.createElement('button');
  n.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b>${s.label}`;
  n.dataset.id = id;
  n.addEventListener('click', () => openSpot(id));
  indexEl.appendChild(n);
});

// ── panel ──
const panel = $('panel');
function openSpot(id) {
  const s = spots[id];
  if (!s || !started) return;
  active = id;
  $('p-kicker').textContent = s.kicker;
  $('p-title').textContent = s.title;
  $('p-body').innerHTML = s.body.map((t) => `<p>${esc(t)}</p>`).join('');
  $('p-items').innerHTML = s.items.map((it) => {
    const inner = `<div class="it-title">${esc(it.title)}</div>${it.meta ? `<div class="it-meta">${esc(it.meta)}</div>` : ''}${it.desc ? `<div class="it-desc">${esc(it.desc)}</div>` : ''}`;
    const safe = it.href && /^(https?:|mailto:|#)/.test(it.href);
    return `<li>${safe ? `<a href="${it.href}" target="_blank" rel="noopener">${inner}</a>` : `<div>${inner}</div>`}</li>`;
  }).join('');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  panelShiftTarget = 1;
  flyTo(s.view, 1.5);
  [...indexEl.children].forEach((c) => c.classList.toggle('on', c.dataset.id === id));
}
function closeSpot() {
  if (!active) return;
  active = null;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-open');
  panelShiftTarget = 0;
  flyTo(home, 1.4);
  [...indexEl.children].forEach((c) => c.classList.remove('on'));
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
$('close').addEventListener('click', closeSpot);
$('brand').addEventListener('click', (e) => { e.preventDefault(); closeSpot(); });

// ── toast ──
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── picking ──
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hover = null;
let down = null;
function pick(e) {
  ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(world.solids, false)[0];
  if (!hit) return null;
  let o = hit.object;
  while (o && !o.userData.hotspot) o = o.parent;
  return o ? o.userData.hotspot : null;
}
function setHover(id) {
  if (hover === id) return;
  hover = id;
  Object.entries(pins).forEach(([k, el]) => el.classList.toggle('hover', k === id));
  canvas.style.cursor = id ? 'pointer' : 'grab';
}
canvas.addEventListener('pointermove', (e) => {
  if (!started || e.buttons) return;
  setHover(pick(e));
});
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || !started) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6;
  down = null;
  if (moved) return;
  const id = pick(e);
  if (!id) { if (active) closeSpot(); return; }
  if (eggs[id]) { toast(eggs[id]); world.pressRandom(); return; }
  openSpot(id);
});

// ── keyboard: real keys light the virtual board ──
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSpot();
  if (started) world.pressKey(e.code);
});

// ── mood ──
const moodBtn = $('mood');
function setMoodUI() {
  moodBtn.textContent = moodTarget > 0.5 ? '☀ Lights on' : '☾ Lights off';
  document.body.classList.toggle('night', moodTarget < 0.5);
}
moodBtn.addEventListener('click', () => { moodTarget = moodTarget > 0.5 ? 0 : 1; setMoodUI(); });
setMoodUI();

// ── intro ──
const enterBtn = $('enter');
enterBtn.disabled = true;
function begin() {
  if (started) return;
  started = true;
  $('intro').classList.add('gone');
  moodTarget = 1;
  setMoodUI();
  flyTo(home, 3.2);
  ['hud', 'index', 'hint'].forEach((id) => $(id).classList.remove('hidden'));
  Object.values(pins).forEach((p) => p.classList.remove('off'));
  setTimeout(() => toast('Tip: type on your keyboard. The desk is listening.'), 3600);
}
enterBtn.addEventListener('click', begin);

// ── loop ──
const clock = new THREE.Clock();
const anchor = new THREE.Vector3();
function frame() {
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  const flyDt = Math.min(rawDt, 0.25);
  const time = performance.now();

  mood += (moodTarget - mood) * Math.min(1, flyDt * 2.4);
  world.mood(mood);
  bloom.strength = lerp(0.85, 0.28, mood);
  bloom.threshold = lerp(0.85, 1.05, mood);
  scene.background.set('#050807').lerp(new THREE.Color('#ecebe6'), mood);
  renderer.toneMappingExposure = lerp(1.0, 0.95, mood);

  if (fly) {
    fly.t += flyDt;
    const k = ease(Math.min(1, fly.t / fly.dur));
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    if (fly.t >= fly.dur) {
      fly = null;
      if (!active && started) controls.enabled = true;
    }
  }
  controls.update();

  panelShift += (panelShiftTarget - panelShift) * Math.min(1, flyDt * 5);
  if (Math.abs(panelShift - panelShiftTarget) < 0.0005) panelShift = panelShiftTarget;
  applyShift();

  // gentle idle drift while the intro is showing
  if (!started) {
    const a = time / 9000;
    camera.position.x = intro.pos[0] + Math.sin(a) * 0.6;
    camera.position.y = intro.pos[1] + Math.sin(a * 0.7) * 0.2;
  }

  world.tick(time, dt);

  // hover swell + pin tracking
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (const [id, { group, anchor: a }] of Object.entries(world.hot)) {
    const target = hover === id ? 1.035 : 1;
    group.scale.setScalar(lerp(group.scale.x, target, Math.min(1, dt * 10)));
    const pin = pins[id];
    if (!pin) continue;
    anchor.copy(a);
    group.localToWorld(anchor);
    anchor.project(camera);
    const x = (anchor.x * 0.5 + 0.5) * w - (camera.view?.enabled ? 0 : 0);
    const y = (-anchor.y * 0.5 + 0.5) * h;
    const visible = started && anchor.z < 1 && !active;
    pin.classList.toggle('off', !visible);
    pin.style.transform = `translate(${x - 7}px, ${y - 7}px)`;
  }

  composer.render();
  requestAnimationFrame(frame);
}

// wait for webfonts so the monitor text renders in the house type
const fontsReady = document.fonts
  ? Promise.race([
      Promise.all([document.fonts.load('800 40px "Space Grotesk"'), document.fonts.load('600 20px "JetBrains Mono"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ])
  : Promise.resolve();
fontsReady.catch(() => {}).then(() => {
  $('loading').textContent = '';
  enterBtn.disabled = false;
  enterBtn.focus({ preventScroll: true });
});
canvas.style.cursor = 'grab';
requestAnimationFrame(frame);

// debug handle for automated checks
window.__desk = { openSpot, closeSpot, camera, begin };
