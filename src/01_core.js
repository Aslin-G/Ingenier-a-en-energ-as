// =====================================================================
//  LUMINA LOOP: EL CÓDIGO DE LOS ELEMENTOS
//  Núcleo: lienzo, utilidades, entrada (teclado, puntero, táctil, gamepad)
// =====================================================================

const W = 480, H = 270, TILE = 16;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// ---------- Paleta base (del documento de diseño) + tonos de apoyo ----------
const PAL = {
  sky: '#59C7FF', deep: '#163A73', teal: '#30E1C5', leaf: '#66D66A', lime: '#B6F35B',
  sun: '#FFD84A', orange: '#FF9D42', coral: '#FF6B6B', pink: '#FF7FCF', violet: '#9B76FF',
  cream: '#FFF3D7', wood: '#8B5A3C', ink: '#10162B',
  white: '#FFFFFF', night: '#1B2550', navy: '#22306B', dusk: '#3A2E6E', plum: '#5B3A8C',
  mint: '#9CF5D8', aqua: '#7FE7FF', ice: '#D6F6FF', gold: '#FFB62E', rust: '#C8612E',
  red: '#E8435A', magenta: '#D94BC2', lilac: '#C9B2FF', grass: '#3FA85A', forest: '#2A7A4B',
  moss: '#5E8C3A', sand: '#F2D59A', stone: '#8A8FB0', slate: '#565E8C', dark: '#0B1020',
  skin: '#F7C39A', skinS: '#DE9A76', shadow: '#0A0E1C'
};

// ---------- Utilidades matemáticas ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const choice = arr => arr[Math.floor(Math.random() * arr.length)];
const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
const approach = (v, t, s) => v < t ? Math.min(v + s, t) : Math.max(v - s, t);
const easeOut = t => 1 - (1 - t) * (1 - t);
const easeIn = t => t * t;
const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const inRect = (px, py, r) => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
const fmt = (v, d = 0) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function shuffle(arr, rng = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// ---------- Color ----------
const _rgbCache = {};
function hexRgb(hex) {
  if (_rgbCache[hex]) return _rgbCache[hex];
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return (_rgbCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}
const toHex = (r, g, b) => '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function rgba(hex, a) { const c = hexRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
const shade = (hex, t) => t >= 0 ? mix(hex, '#FFFFFF', t) : mix(hex, '#0A0E1C', -t);
function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex(255 * f(0), 255 * f(8), 255 * f(4));
}
function desaturate(hex, t) { const c = hexRgb(hex); const g = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; return toHex(lerp(c[0], g, t), lerp(c[1], g, t), lerp(c[2], g, t)); }

// ---------- Lienzos auxiliares ----------
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  c.g = g;
  return c;
}

// ---------- Estado global de tiempo ----------
const Time = { t: 0, frame: 0, dt: 1 / 60, real: 0 };

// ---------- Escalado de pantalla ----------
function resize() {
  const ww = window.innerWidth, wh = window.innerHeight;
  let s = Math.min(ww / W, wh / H);
  const pp = typeof G !== 'undefined' && G.save && G.save.settings && G.save.settings.pixelPerfect;
  if (pp && s >= 1) s = Math.floor(s);
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
}
window.addEventListener('resize', resize);

// =====================================================================
//  ENTRADA
// =====================================================================
const DEFAULT_BINDINGS = {
  left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
  jump: ['Space', 'KeyZ', 'KeyK'], interact: ['KeyE', 'KeyX', 'KeyJ'],
  ability: ['KeyQ', 'KeyL'], lens: ['KeyF'], blueprint: ['KeyB'], codex: ['KeyC'],
  hint: ['KeyH'], pause: ['Escape', 'KeyP'], run: ['ShiftLeft', 'ShiftRight'],
  confirm: ['Enter', 'NumpadEnter', 'Space'], back: ['Escape', 'Backspace'],
  del: ['Delete', 'Backspace'], tab: ['Tab'], swap: ['KeyR']
};

const Input = {
  keys: {}, pressedCodes: {}, releasedCodes: {}, bindings: JSON.parse(JSON.stringify(DEFAULT_BINDINGS)),
  virtual: {}, virtualPrev: {}, gp: {}, gpPrev: {},
  lastDevice: 'keyboard', anyKeyHit: false, captureNext: null,
  pointer: { x: -99, y: -99, down: false, pressed: false, released: false, id: null, type: 'mouse', moved: false, startX: 0, startY: 0, wheel: 0 },
  touches: new Map(),
  down(a) {
    const b = this.bindings[a] || [];
    for (const c of b) if (this.keys[c]) return true;
    return !!(this.virtual[a] || this.gp[a]);
  },
  hit(a) {
    const b = this.bindings[a] || [];
    for (const c of b) if (this.pressedCodes[c]) return true;
    return !!((this.virtual[a] && !this.virtualPrev[a]) || (this.gp[a] && !this.gpPrev[a]));
  },
  released(a) {
    const b = this.bindings[a] || [];
    for (const c of b) if (this.releasedCodes[c]) return true;
    return !!((!this.virtual[a] && this.virtualPrev[a]) || (!this.gp[a] && this.gpPrev[a]));
  },
  codeHit(code) { return !!this.pressedCodes[code]; },
  axisX() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0) + (this.gpAxisX || 0); },
  endStep() {
    this.pressedCodes = {}; this.releasedCodes = {};
    this.virtualPrev = Object.assign({}, this.virtual);
    this.gpPrev = Object.assign({}, this.gp);
    this.pointer.pressed = false; this.pointer.released = false; this.pointer.wheel = 0;
    this.anyKeyHit = false;
  },
  consume() { // evita que una misma pulsación active dos cosas
    this.pressedCodes = {}; this.pointer.pressed = false; this.pointer.released = false;
    this.virtualPrev = Object.assign({}, this.virtual); this.gpPrev = Object.assign({}, this.gp);
    this.anyKeyHit = false;
  },
  pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && Array.from(pads).find(x => x && x.connected);
    this.gp = {}; this.gpAxisX = 0;
    if (!p) return;
    const b = i => p.buttons[i] && p.buttons[i].pressed;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    if (Math.abs(ax) > 0.35) this.gpAxisX = 0; // se traduce a izquierda/derecha
    this.gp.left = b(14) || ax < -0.35; this.gp.right = b(15) || ax > 0.35;
    this.gp.up = b(12) || ay < -0.5; this.gp.down = b(13) || ay > 0.5;
    this.gp.jump = b(0); this.gp.confirm = b(0); this.gp.interact = b(2); this.gp.back = b(1);
    this.gp.ability = b(3); this.gp.lens = b(4); this.gp.hint = b(5); this.gp.pause = b(9);
    this.gp.codex = b(8); this.gp.run = b(7) || b(6); this.gp.swap = b(11); this.gp.blueprint = b(10);
    for (const k in this.gp) if (this.gp[k]) { this.lastDevice = 'gamepad'; break; }
  }
};

window.addEventListener('keydown', e => {
  const code = e.code || e.key;
  if (Input.captureNext) { const cb = Input.captureNext; Input.captureNext = null; cb(code); e.preventDefault(); return; }
  if (!Input.keys[code]) { Input.pressedCodes[code] = true; Input.anyKeyHit = true; }
  Input.keys[code] = true;
  Input.lastDevice = 'keyboard';
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Backspace'].includes(code)) e.preventDefault();
  if (typeof AudioSys !== 'undefined') AudioSys.unlock();
});
window.addEventListener('keyup', e => {
  const code = e.code || e.key;
  Input.keys[code] = false; Input.releasedCodes[code] = true;
});
window.addEventListener('blur', () => { Input.keys = {}; Input.virtual = {}; });

function toInternal(ev) {
  const r = cv.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
}
cv.addEventListener('pointerdown', e => {
  const p = toInternal(e);
  cv.focus();
  if (typeof AudioSys !== 'undefined') AudioSys.unlock();
  Input.touches.set(e.pointerId, { x: p.x, y: p.y, type: e.pointerType, start: Time.t });
  if (e.pointerType === 'touch') Input.lastDevice = 'touch'; else if (Input.lastDevice === 'touch') Input.lastDevice = 'mouse';
  const P = Input.pointer;
  if (P.id === null || !P.down) {
    P.id = e.pointerId; P.x = p.x; P.y = p.y; P.down = true; P.pressed = true; P.type = e.pointerType;
    P.startX = p.x; P.startY = p.y; P.moved = false;
  }
  try { cv.setPointerCapture(e.pointerId); } catch (_) { }
  e.preventDefault();
});
cv.addEventListener('pointermove', e => {
  const p = toInternal(e);
  if (Input.touches.has(e.pointerId)) { const t = Input.touches.get(e.pointerId); t.x = p.x; t.y = p.y; }
  const P = Input.pointer;
  if (P.id === e.pointerId || !P.down) {
    P.x = p.x; P.y = p.y;
    if (P.down && Math.hypot(p.x - P.startX, p.y - P.startY) > 3) P.moved = true;
    if (!P.down && e.pointerType === 'mouse') Input.lastDevice = Input.lastDevice === 'touch' ? 'mouse' : Input.lastDevice;
  }
});
function endPointer(e) {
  Input.touches.delete(e.pointerId);
  const P = Input.pointer;
  if (P.id === e.pointerId) {
    const p = toInternal(e);
    P.x = p.x; P.y = p.y; P.down = false; P.released = true; P.id = null;
  }
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('wheel', e => { Input.pointer.wheel += sign(e.deltaY); e.preventDefault(); }, { passive: false });
cv.addEventListener('contextmenu', e => e.preventDefault());

// ---------- Nombres legibles de teclas ----------
function keyName(code) {
  if (!code) return '?';
  const map = { Space: 'ESPACIO', Enter: 'ENTER', Escape: 'ESC', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: 'BORRAR', Tab: 'TAB', Delete: 'SUPR', ControlLeft: 'CTRL', AltLeft: 'ALT' };
  if (map[code]) return map[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  return code;
}
const bindName = a => {
  if (Input.lastDevice === 'gamepad') {
    return { jump: 'A', interact: 'X', ability: 'Y', lens: 'LB', hint: 'RB', pause: 'START', confirm: 'A', back: 'B', codex: 'SELECT' }[a] || a;
  }
  return keyName((Input.bindings[a] || [])[0]);
};
