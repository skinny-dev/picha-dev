// ─────────────────────────────────────────────────────────────
//  EDIT ME — all the copy on the site lives in this one file.
//  Each key in `spots` is an object on the desk. `view` is where
//  the camera flies to: pos = camera position, look = look-at.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: 'Picha',
  domain: 'picha.dev',
  tagline: 'Developer & maker. I build interfaces, tools and odd little worlds.',
};

// Projects cycle on the monitor and fill the "Work" panel.
export const projects = [
  { title: 'Project One', tag: 'WEB · 3D', year: '2026', desc: 'Short pitch for your flagship project. What it is, who it is for.', href: '#' },
  { title: 'Project Two', tag: 'TOOLING', year: '2025', desc: 'A developer tool you are proud of. One line on the problem it solves.', href: '#' },
  { title: 'Project Three', tag: 'APP', year: '2025', desc: 'A product build, end to end: design, code, launch.', href: '#' },
  { title: 'Project Four', tag: 'EXPERIMENT', year: '2024', desc: 'Something weird and fun that taught you a lot.', href: '#' },
];

export const home = { pos: [-0.7, 2.5, 4.5], look: [0.1, 0.4, 0.0] };
export const intro = { pos: [-5.5, 5.5, 9.5], look: [0, 0.6, 0] };

// pull every focus camera back from its target by this factor
const BACK = 1.4;
const back = (v) => ({ look: v.look, pos: v.pos.map((c, i) => v.look[i] + (c - v.look[i]) * BACK) });

const rawSpots = {
  monitor: {
    label: 'Work',
    kicker: '01 / Selected work',
    title: 'Things I have shipped.',
    body: ['The monitor cycles through my favourite builds. Here is the full list.'],
    items: projects.map((p) => ({ title: p.title, meta: `${p.tag} · ${p.year}`, desc: p.desc, href: p.href })),
    view: { pos: [0.25, 1.5, 2.6], look: [0.25, 1.2, -0.75] },
  },
  laptop: {
    label: 'Lab',
    kicker: '02 / Experiments',
    title: 'The lab laptop.',
    body: ['Prototypes, shaders and half-finished ideas live here. Not everything ships, everything teaches.'],
    items: [
      { title: 'Shader sketches', meta: 'GLSL · WebGL', desc: 'Small visual experiments.' },
      { title: 'Creative coding', meta: 'Canvas · Three.js', desc: 'Interactive toys and generative art.' },
      { title: 'Open source', meta: 'GitHub', desc: 'Tiny libraries and contributions.', href: 'https://github.com/skinny-dev' },
    ],
    view: { pos: [-1.6, 1.7, 1.7], look: [-2.85, 0.65, -0.35] },
  },
  keyboard: {
    label: 'Stack',
    kicker: '03 / Tools',
    title: 'What I type with.',
    body: ['Go on, press some keys. The board lights up with you.'],
    items: [
      { title: 'Languages', meta: 'TypeScript · JavaScript · Python', desc: '' },
      { title: 'Front end', meta: 'React · Three.js · Vite', desc: '' },
      { title: 'Back end', meta: 'Node · Postgres · APIs', desc: '' },
    ],
    view: { pos: [0.0, 1.5, 2.5], look: [0.0, 0.0, 0.55] },
  },
  mouse: {
    label: 'Process',
    kicker: '04 / How I work',
    title: 'Click. Iterate. Ship.',
    body: ['Small steps, fast feedback, polish at the end. I like building in public and testing on real people early.'],
    items: [
      { title: '1 · Explore', meta: '', desc: 'Sketch, prototype, break things.' },
      { title: '2 · Build', meta: '', desc: 'Clean code, tight loops.' },
      { title: '3 · Polish', meta: '', desc: 'Motion, details, performance.' },
    ],
    view: { pos: [1.7, 1.2, 1.9], look: [1.55, 0.0, 0.65] },
  },
  headphones: {
    label: 'Sound',
    kicker: '05 / Soundtrack',
    title: 'Headphones on.',
    body: ['Most of my best work happens with music loud and notifications off. Add your playlist link here.'],
    items: [{ title: 'My coding playlist', meta: 'Spotify', desc: 'Replace this link.', href: '#' }],
    view: { pos: [-0.9, 1.25, 2.2], look: [-1.25, 0.3, 0.8] },
  },
  gamepad: {
    label: 'Play',
    kicker: '06 / Off duty',
    title: 'Player two ready.',
    body: ['Games are where I learned half of what I know about UX, feedback loops and polish.'],
    items: [{ title: 'Currently playing', meta: 'Edit me', desc: '' }],
    view: { pos: [2.2, 1.2, 2.0], look: [2.5, 0.0, 0.6] },
  },
  daisies: {
    label: 'About',
    kicker: '07 / About',
    title: 'Hi, I am Picha.',
    body: [
      'Developer who likes the space where code meets design. I care about things that feel good to use.',
      'Replace this text with your own story: where you are based, what you are looking for, what you love.',
    ],
    items: [],
    view: { pos: [2.0, 1.5, 1.2], look: [2.55, 0.35, -0.95] },
  },
  sunglasses: {
    label: 'Contact',
    kicker: '08 / Say hello',
    title: 'Let us build something.',
    body: ['Open to freelance, collabs and interesting problems.'],
    items: [
      { title: 'Email', meta: 'hello@picha.dev', desc: 'Replace with your address.', href: 'mailto:hello@picha.dev' },
      { title: 'GitHub', meta: 'skinny-dev', desc: '', href: 'https://github.com/skinny-dev' },
    ],
    view: { pos: [2.4, 1.1, 1.3], look: [2.95, 0.15, -0.15] },
  },
};

export const spots = Object.fromEntries(
  Object.entries(rawSpots).map(([k, v]) => [k, { ...v, view: back(v.view) }]),
);

// Tiny easter eggs: no panel, just a toast.
export const eggs = {
  skull: 'Dead code never dies. It just gets commented out.',
  bottle: 'Hydration check: complete. Back to the keyboard.',
};
