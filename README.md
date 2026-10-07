# picha.dev — the desk

An interactive 3D showcase built from a real desk: oak top, glowing green keyboard, headphones, gamepad, daisies and all.
Everything is generated in code with [three.js](https://threejs.org) — no model or texture files to download.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (deploy anywhere)
```

## What you can do

- Drag to orbit, click any glowing pin or object to fly the camera there and open its panel.
- Type on your real keyboard — the virtual one lights up key by key.
- Toggle **Lights on / off** (day room ⇄ neon night).
- Click the skull or the water bottle for easter eggs.

## Make it yours

All copy, projects and camera angles live in **`src/data.js`** (the monitor reel and "Work" panel are driven by `projects`).
Desk geometry is in `src/world.js`, canvas textures (wood, monitor reel) in `src/textures.js`, styling in `src/style.css`.
