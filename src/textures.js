import * as THREE from 'three';

// deterministic pseudo-random so the desk looks the same every load
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function canvasTexture(w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  t.userData = { canvas: c, ctx };
  return t;
}

export function woodTexture() {
  const r = rng(7);
  return canvasTexture(2048, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c99560');
    g.addColorStop(0.5, '#d2a06a');
    g.addColorStop(1, '#c48e58');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // long grain streaks
    for (let i = 0; i < 700; i++) {
      const y = r() * h;
      const len = 200 + r() * 1400;
      const x = r() * w;
      ctx.strokeStyle = `rgba(${90 + r() * 40},${55 + r() * 25},${25 + r() * 15},${0.04 + r() * 0.12})`;
      ctx.lineWidth = 0.6 + r() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 6, x + len * 0.6, y + (r() - 0.5) * 6, x + len, y + (r() - 0.5) * 4);
      ctx.stroke();
    }
    // a few knots / cathedral swirls
    for (let k = 0; k < 4; k++) {
      const cx = r() * w;
      const cy = r() * h;
      for (let n = 0; n < 9; n++) {
        ctx.strokeStyle = `rgba(110,68,30,${0.05 + 0.02 * (9 - n)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 60 + n * 22, 7 + n * 3.2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, { repeat: [1, 1] });
}

export function laptopKeysTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#121416';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#23272a';
    const rows = 5;
    const cols = 14;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillRect(18 + c * 34, 14 + r * 30, 30, 26);
      }
    }
    ctx.fillStyle = '#1b1e20';
    ctx.fillRect(180, 190, 150, 100); // trackpad
  });
}

export function laptopScreenTexture() {
  return canvasTexture(1024, 640, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#12071f');
    g.addColorStop(0.55, '#5b1f8f');
    g.addColorStop(1, '#e0428a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = `rgba(180,120,255,${0.06 + i * 0.02})`;
      ctx.lineWidth = 26 - i * 3;
      ctx.beginPath();
      ctx.moveTo(-40, h * 0.9 - i * 38);
      ctx.bezierCurveTo(w * 0.3, h * 0.3 - i * 20, w * 0.6, h * 1.1, w + 40, h * 0.2 + i * 30);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '600 28px ui-monospace, monospace';
    ctx.fillText('lab://picha', 48, 70);
  });
}

export function bottleLabelTexture() {
  return canvasTexture(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2a6fe0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, h * 0.55 + Math.sin(x / 26) * 10);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '700 44px sans-serif';
    ctx.fillText('aqua', 40, 62);
  });
}

// ── The monitor: animated showcase reel in the picha house style ──
export function createMonitorScreen(projects) {
  const W = 1280;
  const H = 720;
  const tex = canvasTexture(W, H, () => {});
  const ctx = tex.userData.ctx;
  let slide = 0;
  let slideStart = 0;
  const SLIDE_MS = 4200;

  const GREEN = '#44ff7a';

  function draw(now) {
    if (now - slideStart > SLIDE_MS) {
      slide = (slide + 1) % projects.length;
      slideStart = now;
    }
    const t = now / 1000;
    const k = Math.min(1, (now - slideStart) / 500); // slide-in progress
    const ease = 1 - Math.pow(1 - k, 3);

    // background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#04110a');
    bg.addColorStop(1, '#02060a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // topographic flow lines
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 26; i++) {
      const yBase = 120 + i * 24;
      ctx.strokeStyle = `rgba(68,255,122,${0.05 + (i % 5 === 0 ? 0.12 : 0.04)})`;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = yBase + Math.sin(x * 0.006 + t * 0.7 + i * 0.35) * 22 + Math.sin(x * 0.014 - t * 0.4 + i) * 9;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // top bar
    ctx.fillStyle = 'rgba(68,255,122,0.08)';
    ctx.fillRect(0, 0, W, 64);
    ctx.fillStyle = GREEN;
    ctx.font = '600 24px ui-monospace, Menlo, monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('~/picha/showcase', 36, 33);
    ctx.textAlign = 'right';
    ctx.fillText(`${String(slide + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`, W - 36, 33);
    ctx.textAlign = 'left';

    // slide
    const p = projects[slide];
    const dx = (1 - ease) * 80;
    ctx.globalAlpha = ease;
    ctx.fillStyle = 'rgba(68,255,122,0.9)';
    ctx.font = '600 26px ui-monospace, Menlo, monospace';
    ctx.fillText(`${p.tag}  ·  ${p.year}`, 80 + dx, 250);

    ctx.fillStyle = '#f3fff6';
    ctx.font = '800 112px "Space Grotesk", system-ui, sans-serif';
    ctx.fillText(p.title, 74 + dx, 360);

    ctx.fillStyle = 'rgba(230,255,238,0.7)';
    ctx.font = '400 30px system-ui, sans-serif';
    wrap(ctx, p.desc, 80 + dx, 440, 900, 42);
    ctx.globalAlpha = 1;

    // progress bar
    const prog = Math.min(1, (now - slideStart) / SLIDE_MS);
    ctx.fillStyle = 'rgba(68,255,122,0.18)';
    ctx.fillRect(80, 640, 1120, 4);
    ctx.fillStyle = GREEN;
    ctx.fillRect(80, 640, 1120 * prog, 4);

    // blinking cursor
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = GREEN;
      ctx.fillRect(80, 575, 18, 8);
    }

    // scanlines
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);

    tex.needsUpdate = true;
  }

  return { texture: tex, draw, get index() { return slide; } };
}

function wrap(ctx, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}
