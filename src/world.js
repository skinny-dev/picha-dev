import * as THREE from 'three';
import {
  woodTexture, laptopKeysTexture, laptopScreenTexture, bottleLabelTexture, createMonitorScreen, rng,
} from './textures.js';
import { projects } from './data.js';

const std = (color, rough = 0.6, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

const glow = (hex, mult = 1) => {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(mult), toneMapped: false });
  return m;
};

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

const shadowify = (obj) => obj.traverse((o) => {
  if (o.isMesh) {
    o.castShadow = true;
    o.receiveShadow = true;
  }
});

// ── 75% keyboard layout: [width in units, KeyboardEvent.code] ──
const L = (code, w = 1) => [w, code];
const KEY_ROWS = [
  [L('Escape'), ...Array.from({ length: 12 }, (_, i) => L('F' + (i + 1))), L('PrintScreen'), L('Delete'), L('Home')],
  [L('Backquote'), ...'1234567890'.split('').map((d) => L('Digit' + d)), L('Minus'), L('Equal'), L('Backspace', 2), L('PageUp')],
  [L('Tab', 1.5), ...'QWERTYUIOP'.split('').map((c) => L('Key' + c)), L('BracketLeft'), L('BracketRight'), L('Backslash', 1.5), L('PageDown')],
  [L('CapsLock', 1.75), ...'ASDFGHJKL'.split('').map((c) => L('Key' + c)), L('Semicolon'), L('Quote'), L('Enter', 2.25), L('End')],
  [L('ShiftLeft', 2.25), ...'ZXCVBNM'.split('').map((c) => L('Key' + c)), L('Comma'), L('Period'), L('Slash'), L('ShiftRight', 1.75), L('ArrowUp'), L(null)],
  [L('ControlLeft', 1.25), L('MetaLeft', 1.25), L('AltLeft', 1.25), L('Space', 6.25), L('AltRight'), L(null), L('ControlRight'), L('ArrowLeft'), L('ArrowDown'), L('ArrowRight')],
];

export function buildWorld(scene) {
  const hot = {};
  const solids = []; // raycast targets
  const addHot = (id, group, anchor) => {
    group.userData.hotspot = id;
    hot[id] = { group, anchor: new THREE.Vector3(...anchor) };
    shadowify(group);
    scene.add(group);
  };
  const deco = (obj) => { shadowify(obj); scene.add(obj); return obj; };

  const handles = { hot, tick: () => {}, pressKey: () => {}, mood: () => {} };

  // ── room ──
  const wallMat = std('#ecebe6', 0.95);
  const wall = mesh(new THREE.PlaneGeometry(40, 16), wallMat, 0, 3, -1.62);
  wall.receiveShadow = true;
  scene.add(wall);
  const floor = mesh(new THREE.PlaneGeometry(40, 20), std('#b9b3a8', 0.9), 0, -2.7, 8);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ── desk ──
  const wood = woodTexture();
  const deskMat = std('#ffffff', 0.55, 0, { map: wood });
  const top = mesh(new THREE.BoxGeometry(7.8, 0.14, 3.2), deskMat, 0, -0.07, 0);
  const legMat = std('#26282b', 0.5, 0.5);
  const legL = mesh(new THREE.BoxGeometry(0.12, 2.6, 3.0), legMat, -3.6, -1.4, 0);
  const legR = legL.clone();
  legR.position.x = 3.6;
  deco(top); deco(legL); deco(legR);

  // ── monitor ──
  const monitor = new THREE.Group();
  monitor.position.set(0.2, 0, -0.75);
  const bezelMat = std('#0b0c0d', 0.35, 0.6);
  monitor.add(mesh(new THREE.BoxGeometry(2.5, 1.45, 0.07), bezelMat, 0, 1.28, 0));
  const screenReel = createMonitorScreen(projects);
  const screenMat = new THREE.MeshBasicMaterial({ map: screenReel.texture, toneMapped: false });
  monitor.add(mesh(new THREE.PlaneGeometry(2.38, 1.34), screenMat, 0, 1.28, 0.037));
  monitor.add(mesh(new THREE.BoxGeometry(0.14, 0.62, 0.06), bezelMat, 0, 0.31, -0.07));
  for (const s of [-1, 1]) {
    const leg = mesh(new THREE.BoxGeometry(0.09, 0.035, 0.85), bezelMat, s * 0.34, 0.0175, 0.05);
    leg.rotation.y = s * 0.55;
    monitor.add(leg);
  }
  addHot('monitor', monitor, [0, 2.15, 0]);

  // ── laptop (left) ──
  const laptop = new THREE.Group();
  laptop.position.set(-2.85, 0, -0.35);
  laptop.rotation.y = 0.55;
  const lapMat = std('#15171a', 0.4, 0.6);
  laptop.add(mesh(new THREE.BoxGeometry(1.55, 0.045, 1.05), lapMat, 0, 0.0225, 0));
  const keysPlane = mesh(new THREE.PlaneGeometry(1.4, 0.875), new THREE.MeshStandardMaterial({ map: laptopKeysTexture(), roughness: 0.6 }), 0, 0.0455, 0.06);
  keysPlane.rotation.x = -Math.PI / 2;
  laptop.add(keysPlane);
  const lid = new THREE.Group();
  lid.position.set(0, 0.045, -0.5);
  lid.rotation.x = -0.22;
  lid.add(mesh(new THREE.BoxGeometry(1.55, 0.98, 0.03), lapMat, 0, 0.49, 0));
  lid.add(mesh(new THREE.PlaneGeometry(1.46, 0.9), new THREE.MeshBasicMaterial({ map: laptopScreenTexture(), toneMapped: false }), 0, 0.49, 0.0165));
  laptop.add(lid);
  addHot('laptop', laptop, [0, 1.35, 0]);

  // ── mouse pad ──
  const pad = mesh(new THREE.BoxGeometry(3.7, 0.02, 1.35), std('#0e0f10', 0.97), 0.35, 0.01, 0.62);
  deco(pad);

  // ── keyboard ──
  const kb = new THREE.Group();
  kb.position.set(0.0, 0.02, 0.62);
  kb.rotation.x = 0.07;
  kb.add(mesh(new THREE.BoxGeometry(1.74, 0.05, 0.74), std('#101214', 0.4, 0.5), 0, 0.025, 0));
  const underglow = mesh(new THREE.PlaneGeometry(1.7, 0.7), glow('#20d060', 0.32), 0, 0.0515, 0);
  underglow.rotation.x = -Math.PI / 2;
  kb.add(underglow);

  const U = 0.1;
  const keyDefs = [];
  KEY_ROWS.forEach((row, r) => {
    let x = -0.8;
    row.forEach(([w, code]) => {
      keyDefs.push({ x: x + (w * U) / 2, z: -0.25 + r * U, w, code, row: r });
      x += w * U;
    });
  });
  const N = keyDefs.length;
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std('#ffffff', 0.45, 0.1), N);
  const dots = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), N);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const col = new THREE.Color();
  const r1 = rng(3);
  const keyIndex = new Map();
  keyDefs.forEach((k, i) => {
    const w = k.w * U - 0.012;
    m4.compose(new THREE.Vector3(k.x, 0.07, k.z), q, new THREE.Vector3(w, 0.04, U - 0.012));
    caps.setMatrixAt(i, m4);
    caps.setColorAt(i, col.set('#1a1d1f').offsetHSL(0, 0, r1() * 0.02));
    const dw = k.code === 'Space' ? 0.55 : 0.028;
    m4.compose(new THREE.Vector3(k.x, 0.0915, k.z), q, new THREE.Vector3(dw, 0.004, k.code === 'Space' ? 0.012 : 0.028));
    dots.setMatrixAt(i, m4);
    dots.setColorAt(i, col.set('#44ff7a'));
    if (k.code) keyIndex.set(k.code, i);
  });
  kb.add(caps, dots);
  addHot('keyboard', kb, [0, 0.4, 0]);

  const flash = new Float32Array(N);
  const GREEN = new THREE.Color('#44ff7a');
  const WHITE = new THREE.Color('#d8ffe4');
  handles.pressKey = (code) => {
    const i = keyIndex.get(code);
    if (i !== undefined) flash[i] = 1;
    else flash[Math.floor(Math.random() * N)] = 1;
  };
  handles.pressRandom = () => { flash[Math.floor(Math.random() * N)] = 1; };

  // ── mouse ──
  const mouse = new THREE.Group();
  mouse.position.set(1.55, 0.02, 0.62);
  mouse.rotation.y = -0.12;
  const body = mesh(new THREE.SphereGeometry(0.5, 32, 20), std('#0f1113', 0.35, 0.3), 0, 0.045, 0);
  body.scale.set(0.14, 0.075, 0.22);
  mouse.add(body);
  const logo = mesh(new THREE.CircleGeometry(0.026, 20), glow('#44ff7a', 2), 0, 0.0885, 0.04);
  logo.rotation.x = -Math.PI / 2;
  mouse.add(logo);
  mouse.add(mesh(new THREE.BoxGeometry(0.014, 0.012, 0.05), glow('#44ff7a', 1.6), 0, 0.085, -0.05));
  const strip = mesh(new THREE.BoxGeometry(0.002, 0.01, 0.2), glow('#44ff7a', 1.6), 0.069, 0.04, 0);
  mouse.add(strip);
  addHot('mouse', mouse, [0, 0.3, 0]);

  // ── headphones ──
  const hp = new THREE.Group();
  hp.position.set(-1.25, 0.02, 0.8);
  hp.rotation.y = 0.5;
  const hpMat = std('#0d0e10', 0.55, 0.2);
  const band = mesh(new THREE.TorusGeometry(0.42, 0.035, 14, 40, Math.PI), hpMat, 0, 0.3, 0);
  hp.add(band);
  const pads = std('#151618', 0.9);
  for (const s of [-1, 1]) {
    const cup = mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.14, 32), hpMat, s * 0.44, 0.27, 0);
    cup.rotation.z = Math.PI / 2;
    hp.add(cup);
    const cush = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.09, 32), pads, s * 0.37, 0.27, 0);
    cush.rotation.z = Math.PI / 2;
    hp.add(cush);
    const ring = mesh(new THREE.TorusGeometry(0.2, 0.008, 8, 40), glow('#44ff7a', 1.4), s * 0.516, 0.27, 0);
    ring.rotation.y = Math.PI / 2;
    hp.add(ring);
  }
  hp.rotation.x = -0.08;
  addHot('headphones', hp, [0, 1.0, 0]);

  // green headphone cable
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.62, 0.12, 1.0), new THREE.Vector3(-1.78, 0.02, 1.2), new THREE.Vector3(-1.55, 0.016, 1.38),
      new THREE.Vector3(-1.95, 0.016, 1.46), new THREE.Vector3(-2.15, 0.016, 1.3), new THREE.Vector3(-2.3, 0.016, 1.5),
      new THREE.Vector3(-2.35, -0.3, 1.62), new THREE.Vector3(-2.35, -1.2, 1.62),
    ]), 80, 0.014, 8),
    glow('#44ff7a', 1.2),
  );
  scene.add(cable);
  // white keyboard cable + dark mouse cable
  const cable2 = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.05, 0.3), new THREE.Vector3(0.2, 0.02, -0.1), new THREE.Vector3(-0.2, 0.015, -0.6),
      new THREE.Vector3(-0.3, 0.015, -1.2), new THREE.Vector3(-0.3, -0.5, -1.58),
    ]), 50, 0.012, 8),
    std('#f1f1ec', 0.7),
  );
  const cable3 = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.55, 0.04, 0.45), new THREE.Vector3(1.4, 0.015, 0.05), new THREE.Vector3(1.2, 0.015, -0.8),
      new THREE.Vector3(1.0, -0.5, -1.58),
    ]), 40, 0.01, 8),
    std('#111', 0.7),
  );
  deco(cable2); deco(cable3);

  // ── water bottle ──
  const bottle = new THREE.Group();
  bottle.position.set(-2.35, 0.0, 0.95);
  const prof = [[0, 0], [0.15, 0], [0.165, 0.05], [0.165, 0.62], [0.13, 0.82], [0.075, 0.92], [0.07, 0.96], [0, 0.96]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  bottle.add(mesh(new THREE.LatheGeometry(prof, 32), new THREE.MeshPhysicalMaterial({
    color: '#b5dcff', roughness: 0.08, transparent: true, opacity: 0.38, clearcoat: 1,
  }), 0, 0, 0));
  bottle.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 28), new THREE.MeshStandardMaterial({ color: '#8fc4ff', transparent: true, opacity: 0.28, roughness: 0.1 }), 0, 0.33, 0));
  const label = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 32, 1, true), new THREE.MeshStandardMaterial({ map: bottleLabelTexture(), side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.4, 0);
  bottle.add(label);
  bottle.add(mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.08, 24), std('#2f6fd6', 0.4), 0, 1.0, 0));
  addHot('bottle', bottle, [0, 1.25, 0]);

  // ── gamepad ──
  const pad2 = new THREE.Group();
  pad2.position.set(2.55, 0.02, 0.62);
  pad2.rotation.y = -0.4;
  const padMat = std('#16181a', 0.45, 0.2);
  const pb = mesh(new THREE.SphereGeometry(0.5, 28, 16), padMat, 0, 0.085, 0);
  pb.scale.set(0.74, 0.18, 0.34);
  pad2.add(pb);
  for (const s of [-1, 1]) {
    const grip = mesh(new THREE.SphereGeometry(0.5, 24, 14), padMat, s * 0.3, 0.075, 0.1);
    grip.scale.set(0.2, 0.15, 0.36);
    grip.rotation.y = s * 0.3;
    pad2.add(grip);
  }
  const stickMat = std('#08090a', 0.4, 0.4);
  pad2.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 16), stickMat, -0.16, 0.17, -0.02));
  pad2.add(mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.05, 16), stickMat, 0.1, 0.17, 0.08));
  const red = std('#d8352a', 0.35);
  [[0.22, -0.07], [0.3, -0.01], [0.22, 0.05], [0.14, -0.01]].forEach(([x, z]) => {
    pad2.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.03, 14), red, x, 0.175, z));
  });
  pad2.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), stickMat, -0.2, 0.175, 0.1));
  pad2.add(mesh(new THREE.BoxGeometry(0.03, 0.02, 0.1), stickMat, -0.2, 0.175, 0.1));
  addHot('gamepad', pad2, [0, 0.5, 0]);

  // ── sunglasses ──
  const sg = new THREE.Group();
  sg.position.set(2.95, 0.02, -0.15);
  sg.rotation.y = -0.9;
  const frame = std('#f5f5f0', 0.35);
  const lensMat = new THREE.MeshStandardMaterial({ color: '#0a0d0c', roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  for (const s of [-1, 1]) {
    const rim = mesh(new THREE.TorusGeometry(0.17, 0.022, 10, 36), frame, s * 0.21, 0.19, 0);
    rim.scale.set(1.15, 1, 1);
    sg.add(rim);
    const lens = mesh(new THREE.CircleGeometry(0.17, 28), lensMat, s * 0.21, 0.19, 0);
    lens.scale.set(1.15, 1, 1);
    sg.add(lens);
    sg.add(mesh(new THREE.BoxGeometry(0.018, 0.018, 0.55), frame, s * 0.43, 0.26, 0.27));
  }
  sg.add(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.02), frame, 0, 0.27, 0));
  addHot('sunglasses', sg, [0, 0.6, 0]);

  // ── daisies ──
  const dz = new THREE.Group();
  dz.position.set(2.55, 0, -0.95);
  const vase = [[0, 0], [0.1, 0], [0.12, 0.04], [0.1, 0.3], [0.07, 0.34], [0.075, 0.38]].map(([x, y]) => new THREE.Vector2(x, y));
  dz.add(mesh(new THREE.LatheGeometry(vase, 24), new THREE.MeshPhysicalMaterial({ color: '#cde8e0', roughness: 0.1, transparent: true, opacity: 0.5 }), 0, 0, 0));
  const stemMat = std('#3f7a3c', 0.7);
  const petalMat = std('#fbfbf6', 0.6);
  const heartMat = std('#f2c230', 0.6);
  const r2 = rng(11);
  [[-0.1, 0.78, 0.04], [0.08, 0.92, -0.04], [0.14, 0.7, 0.08], [-0.02, 1.02, -0.02]].forEach(([x, y, z]) => {
    const from = new THREE.Vector3(0, 0.3, 0);
    const to = new THREE.Vector3(x, y, z);
    const dir = to.clone().sub(from);
    const stem = mesh(new THREE.CylinderGeometry(0.007, 0.007, dir.length(), 6), stemMat);
    stem.position.copy(from).addScaledVector(dir, 0.5);
    stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    dz.add(stem);
    const flower = new THREE.Group();
    flower.position.set(x, y, z);
    flower.scale.setScalar(1.9);
    flower.rotation.set(-0.5 + r2() * 0.3, r2() * 6, 0.3 * (r2() - 0.5));
    flower.add(mesh(new THREE.SphereGeometry(0.03, 12, 8), heartMat));
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const petal = mesh(new THREE.SphereGeometry(0.5, 8, 6), petalMat, Math.cos(a) * 0.065, 0, Math.sin(a) * 0.065);
      petal.scale.set(0.09, 0.012, 0.03);
      petal.rotation.y = -a;
      flower.add(petal);
    }
    dz.add(flower);
  });
  addHot('daisies', dz, [0, 1.25, 0]);

  // ── skull (easter egg) ──
  const skull = new THREE.Group();
  skull.position.set(1.35, 0, -0.4);
  skull.rotation.y = -0.4;
  const bone = std('#dcd5c4', 0.7);
  const head = mesh(new THREE.SphereGeometry(0.1, 20, 14), bone, 0, 0.15, 0);
  head.scale.set(1, 0.95, 1.05);
  skull.add(head);
  skull.add(mesh(new THREE.BoxGeometry(0.11, 0.05, 0.09), bone, 0, 0.055, 0.025));
  for (const s of [-1, 1]) skull.add(mesh(new THREE.SphereGeometry(0.028, 10, 8), std('#050505', 0.9), s * 0.04, 0.155, 0.085));
  skull.add(mesh(new THREE.SphereGeometry(0.01, 8, 6), glow('#44ff7a', 1.6), -0.04, 0.155, 0.108));
  skull.add(mesh(new THREE.SphereGeometry(0.01, 8, 6), glow('#44ff7a', 1.6), 0.04, 0.155, 0.108));
  addHot('skull', skull, [0, 0.35, 0]);

  // ── decor: antenna, notebook, pen, usb, sticky notes ──
  deco(mesh(new THREE.CylinderGeometry(0.011, 0.011, 1.7, 8), std('#f4f4f0', 0.4), 3.2, 0.85, -1.2));
  deco(mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), std('#d8d8d2', 0.6), 3.2, 0.02, -1.2));
  const nb = mesh(new THREE.BoxGeometry(0.85, 0.035, 0.6), std('#2b312e', 0.8), -0.75, 0.0175, 1.32);
  nb.rotation.y = 0.12;
  deco(nb);
  const pen = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 10), glow('#44ff7a', 0.9), -0.5, 0.045, 1.3);
  pen.rotation.set(Math.PI / 2, 0, 1.2);
  deco(pen);
  deco(mesh(new THREE.BoxGeometry(0.18, 0.04, 0.36), std('#1b1d20', 0.4, 0.5), 3.15, 0.02, 0.9));
  deco(mesh(new THREE.BoxGeometry(0.2, 0.025, 0.07), std('#111', 0.5), 2.95, 0.0125, 1.2));
  const stickyColors = ['#ffe97a', '#9dffc0', '#fff2a8'];
  stickyColors.forEach((c, i) => {
    const note = mesh(new THREE.PlaneGeometry(0.38, 0.38), std(c, 0.9), -1.6 + i * 0.55, 1.9 - (i % 2) * 0.35, -1.6);
    note.rotation.z = (i - 1) * 0.08;
    note.receiveShadow = true;
    scene.add(note);
  });

  // ── pickable meshes ──
  Object.values(hot).forEach(({ group }) => group.traverse((o) => { if (o.isMesh) solids.push(o); }));
  handles.solids = solids;

  // ── lights ──
  const hemi = new THREE.HemisphereLight('#ffffff', '#caa07a', 1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 1);
  sun.position.set(-5, 7, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 5, bottom: -5, near: 1, far: 22 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const aura = new THREE.PointLight('#44ff7a', 1, 5, 2);
  aura.position.set(0.1, 0.55, 0.7);
  scene.add(aura);
  const screenLight = new THREE.PointLight('#9fffd0', 1, 7, 2);
  screenLight.position.set(0.2, 1.3, 0.3);
  scene.add(screenLight);

  // mood: 0 = night, 1 = day
  const dayWall = new THREE.Color('#ecebe6');
  const nightWall = new THREE.Color('#2a3330');
  handles.mood = (m) => {
    hemi.intensity = 0.1 + m * 1.7;
    sun.intensity = m * 3.0;
    aura.intensity = 3.2 - m * 1.4;
    screenLight.intensity = 5 - m * 4.2;
    wallMat.color.copy(nightWall).lerp(dayWall, m);
    screenMat.color.setScalar(1.05 - m * 0.1);
  };

  // ── per-frame ──
  const tmp = new THREE.Color();
  handles.tick = (time, dt) => {
    screenReel.draw(time);
    // idle aurora wave across the keys + press flashes
    for (let i = 0; i < N; i++) {
      const k = keyDefs[i];
      const wave = 0.5 + 0.5 * Math.sin(time / 650 - k.x * 2.2 + k.z * 3.5);
      flash[i] = Math.max(0, flash[i] - dt * 2.2);
      tmp.copy(GREEN).multiplyScalar(0.55 + wave * 1.1);
      tmp.lerp(WHITE.clone().multiplyScalar(2.6), flash[i]);
      dots.setColorAt(i, tmp);
    }
    dots.instanceColor.needsUpdate = true;
  };
  handles.screenReel = screenReel;
  return handles;
}
