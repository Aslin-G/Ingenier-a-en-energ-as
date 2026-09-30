// =====================================================================
//  GRÁFICOS: primitivas pixel, sprites por matriz, partículas, luz, FX
// =====================================================================

// Crea un sprite desde filas de caracteres; cada carácter se busca en la paleta ('.' = transparente)
function spriteFromRows(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = makeCanvas(w, h), g = c.g;
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const ch = rows[y][x];
    if (ch === '.' || ch === ' ') continue;
    const col = pal[ch]; if (!col) continue;
    g.fillStyle = col; g.fillRect(x, y, 1, 1);
  }
  return c;
}
function flipCanvas(src) {
  const c = makeCanvas(src.width, src.height);
  c.g.translate(src.width, 0); c.g.scale(-1, 1); c.g.drawImage(src, 0, 0);
  return c;
}
function silhouette(src, color) {
  const c = makeCanvas(src.width, src.height);
  c.g.drawImage(src, 0, 0); c.g.globalCompositeOperation = 'source-in';
  c.g.fillStyle = color; c.g.fillRect(0, 0, c.width, c.height);
  return c;
}
function outlined(src, color) {
  const c = makeCanvas(src.width + 2, src.height + 2);
  const s = silhouette(src, color);
  for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) c.g.drawImage(s, dx, dy);
  c.g.drawImage(src, 1, 1);
  return c;
}
function recolorCanvas(src, fn) {
  const c = makeCanvas(src.width, src.height); c.g.drawImage(src, 0, 0);
  const d = c.g.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < d.data.length; i += 4) {
    if (d.data[i + 3] === 0) continue;
    const r = fn(d.data[i], d.data[i + 1], d.data[i + 2]);
    d.data[i] = r[0]; d.data[i + 1] = r[1]; d.data[i + 2] = r[2];
  }
  c.g.putImageData(d, 0, 0);
  return c;
}

// ---------- primitivas ----------
function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function px(g, x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function strokeRect(g, x, y, w, h, c) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  g.fillStyle = c; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
}
function pline(g, x0, y0, x1, y1, c, dash = 0, dashOff = 0) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, i = 0;
  g.fillStyle = c;
  for (let n = 0; n < 2000; n++) {
    if (!dash || Math.floor((i + dashOff) / dash) % 2 === 0) g.fillRect(x0, y0, 1, 1);
    i++;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function pcircle(g, cx, cy, r, c) {
  g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy);
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + r * 0.8)); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}
function pring(g, cx, cy, r, c) {
  g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); r = Math.round(r);
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) g.fillRect(cx + a, cy + b, 1, 1);
    y++; if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
}
function pellipse(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.5)))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}
// Tramado (dithering) ordenado 4x4 para degradados pixel
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function ditherRect(g, x, y, w, h, c, level) {
  g.fillStyle = c;
  const th = level * 16;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (BAYER[((y + j) & 3) * 4 + ((x + i) & 3)] < th) g.fillRect(x + i, y + j, 1, 1);
}
function vGradient(g, x, y, w, h, stops, dither = true) {
  // stops: [[t,color],...] con bandas y tramado entre bandas
  const bands = Math.max(2, Math.floor(h / 6));
  for (let b = 0; b < bands; b++) {
    const t = b / (bands - 1);
    let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const a = stops[i], bb = stops[i + 1];
    const lt = clamp((t - a[0]) / Math.max(0.0001, bb[0] - a[0]), 0, 1);
    const col = mix(a[1], bb[1], lt);
    const y0 = y + Math.floor(b * h / bands), y1 = y + Math.floor((b + 1) * h / bands);
    rect(g, x, y0, w, y1 - y0, col);
  }
  if (dither) {
    for (let b = 0; b < bands - 1; b++) {
      const t = (b + 1) / (bands - 1);
      let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      const a = stops[i], bb = stops[i + 1];
      const col = mix(a[1], bb[1], clamp((t - a[0]) / Math.max(0.0001, bb[0] - a[0]), 0, 1));
      const yb = y + Math.floor((b + 1) * h / bands);
      ditherRect(g, x, yb - 2, w, 2, col, 0.5);
    }
  }
}

// ---------- panel UI pixel ----------
function panel(g, x, y, w, h, o = {}) {
  const hc = G.save.settings.highContrast;
  const bg = o.bg || (hc ? '#05070F' : 'rgba(16,22,43,0.92)');
  const border = o.border || (hc ? PAL.white : '#3E4C8A');
  const hi = o.hi || (hc ? PAL.white : '#6A7BC4');
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  g.fillStyle = bg;
  g.fillRect(x + 1, y, w - 2, h); g.fillRect(x, y + 1, w, h - 2);
  g.fillStyle = border;
  g.fillRect(x + 2, y, w - 4, 1); g.fillRect(x + 2, y + h - 1, w - 4, 1);
  g.fillRect(x, y + 2, 1, h - 4); g.fillRect(x + w - 1, y + 2, 1, h - 4);
  g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + w - 2, y + 1, 1, 1); g.fillRect(x + 1, y + h - 2, 1, 1); g.fillRect(x + w - 2, y + h - 2, 1, 1);
  if (!o.flat) { g.fillStyle = hi; g.fillRect(x + 2, y + 1, w - 4, 1); }
  if (o.accent) { g.fillStyle = o.accent; g.fillRect(x + 3, y, Math.min(w - 6, o.accentW || 18), 2); }
}
function bar(g, x, y, w, h, v, max, col, bg = '#1E2748') {
  rect(g, x, y, w, h, bg);
  const fw = Math.round(clamp(v / max, 0, 1) * (w - 2));
  rect(g, x + 1, y + 1, fw, h - 2, col);
  if (fw > 2) rect(g, x + 1, y + 1, fw, 1, shade(col, 0.35));
}

// ---------- efectos de pantalla ----------
const FX = {
  shakeT: 0, shakeMag: 0, flashA: 0, flashC: '#FFFFFF', ox: 0, oy: 0, hitstop: 0,
  shake(mag = 3, t = 0.3) { if (G.save.settings.reduceShake) return; this.shakeMag = Math.max(this.shakeMag, mag); this.shakeT = Math.max(this.shakeT, t); },
  flash(c = '#FFFFFF', a = 0.8) { if (G.save.settings.reduceFlash) a = Math.min(a, 0.15); this.flashC = c; this.flashA = Math.max(this.flashA, a); },
  update(dt) {
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const m = this.shakeMag * clamp(this.shakeT / 0.3, 0, 1);
      this.ox = Math.round(rand(-m, m)); this.oy = Math.round(rand(-m, m));
      if (this.shakeT <= 0) { this.ox = this.oy = 0; this.shakeMag = 0; }
    }
    this.flashA = Math.max(0, this.flashA - dt * 2.2);
  },
  drawFlash(g) { if (this.flashA > 0.01) { g.globalAlpha = this.flashA; rect(g, 0, 0, W, H, this.flashC); g.globalAlpha = 1; } }
};

// ---------- partículas (con reciclaje de objetos) ----------
const Particles = {
  list: [], pool: [],
  spawn(o) {
    if (this.list.length > 700) return null;
    const p = this.pool.pop() || {};
    p.x = o.x; p.y = o.y; p.vx = o.vx || 0; p.vy = o.vy || 0; p.life = o.life || 1; p.max = p.life;
    p.color = o.color || PAL.sun; p.size = o.size || 1; p.type = o.type || 'dot'; p.grav = o.grav || 0;
    p.drag = o.drag == null ? 0.98 : o.drag; p.text = o.text || ''; p.screen = !!o.screen; p.glow = !!o.glow;
    p.wob = o.wob || 0; p.ph = Math.random() * 6.28; p.color2 = o.color2 || null; p.layer = o.layer || 0;
    this.list.push(p); return p;
  },
  burst(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rand(-(o.spread || 3.14), o.spread || 3.14) : rand(0, Math.PI * 2);
      const sp = rand(o.min || 20, o.max || 80);
      this.spawn(Object.assign({}, o, { x: x + rand(-(o.jx || 0), o.jx || 0), y: y + rand(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(o.lmin || 0.3, o.lmax || 0.8), color: Array.isArray(o.colors) ? choice(o.colors) : o.color }));
    }
  },
  text(x, y, text, color = PAL.sun, screen = false) { return this.spawn({ x, y, vy: -18, life: 1.1, type: 'text', text, color, drag: 0.95, screen }); },
  clear() { while (this.list.length) this.pool.push(this.list.pop()); },
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); this.pool.push(p); continue; }
      p.vy += p.grav * dt; p.vx *= p.drag; p.vy *= p.drag;
      p.x += (p.vx + (p.wob ? Math.sin(Time.t * 3 + p.ph) * p.wob : 0)) * dt; p.y += p.vy * dt;
    }
  },
  draw(g, cx, cy, screen = false, layer = 0) {
    for (const p of this.list) {
      if (p.screen !== screen || p.layer !== layer) continue;
      // posición en medios píxeles: el movimiento de chispas y hojas se ve más suave
      const hx = Math.round((p.x - (screen ? 0 : cx)) * 2) / 2, hy = Math.round((p.y - (screen ? 0 : cy)) * 2) / 2;
      const x = Math.round(hx), y = Math.round(hy);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const t = p.life / p.max;
      const col = p.color2 ? mix(p.color2, p.color, t) : p.color;
      switch (p.type) {
        case 'dot': g.fillStyle = col; g.fillRect(hx, hy, p.size, p.size); break;
        case 'fade': g.globalAlpha = t; g.fillStyle = col; g.fillRect(hx, hy, p.size, p.size); g.globalAlpha = 1; break;
        // destello fino: centro de un píxel y brazos de medio píxel
        case 'glint': g.globalAlpha = Math.min(1, t * 2); g.fillStyle = col; g.fillRect(hx, hy, 1, 1); g.fillRect(hx - 1, hy + 0.5, 3, 0.5); g.fillRect(hx + 0.5, hy - 1, 0.5, 3); g.globalAlpha = 1; break;
        case 'spark':
          rect(g, x, y, 1, 1, PAL.white);
          if (t > 0.4) { rect(g, x - 1, y, 1, 1, col); rect(g, x + 1, y, 1, 1, col); rect(g, x, y - 1, 1, 1, col); rect(g, x, y + 1, 1, 1, col); }
          break;
        case 'leaf': g.fillStyle = col; g.fillRect(hx, hy, 2, 1); if (Math.sin(Time.t * 6 + p.ph) > 0) { g.fillStyle = shade(col, 0.2); g.fillRect(hx + 1, hy - 1, 1, 1); } break;
        case 'bubble': pring(g, x, y, p.size, col); px(g, x - 1, y - 1, PAL.white); break;
        case 'ring': g.globalAlpha = t; pring(g, x, y, Math.round((1 - t) * p.size), col); g.globalAlpha = 1; break;
        case 'text': drawText(g, p.text, x, y, col, { align: 'center', outline: '#10162B' }); break;
        case 'bit': drawText(g, p.text || (p.ph > 3 ? '1' : '0'), x, y, col); break;
        case 'star': rect(g, x, y, 1, 1, col); if ((Time.frame >> 3) % 2) { rect(g, x - 1, y, 3, 1, col); rect(g, x, y - 1, 1, 3, col); } break;
        case 'rain': g.fillStyle = col; g.fillRect(hx, hy, 0.5, 4); break;
        case 'snow': g.fillStyle = col; g.fillRect(hx, hy, p.size, p.size); break;
      }
    }
  }
};

// ---------- iluminación: oscuridad con fuentes de luz (a resolución de juego: degradados finos) ----------
// haz giratorio de un faro: cuña de luz con degradado (se acorta cuando apunta hacia la cámara)
function drawLightBeam(g, x, y, a, len, spread, color, alpha) {
  const dx = Math.cos(a), L = len * (0.3 + 0.7 * Math.abs(dx));
  const ex = x + dx * L, ey = y + Math.sin(a) * L * 0.18, w = Math.max(3, L * spread);
  const grd = g.createLinearGradient(x, y, ex, ey);
  grd.addColorStop(0, rgba(color, alpha)); grd.addColorStop(0.6, rgba(color, alpha * 0.45)); grd.addColorStop(1, rgba(color, 0));
  g.fillStyle = grd;
  g.beginPath(); g.moveTo(x, y - 1.5); g.lineTo(ex, ey - w / 2); g.lineTo(ex, ey + w / 2); g.lineTo(x, y + 1.5); g.closePath(); g.fill();
}
const Light = {
  cv: null, lights: [],
  init() { this.cv = makeCanvas(W, H); },
  begin() { this.lights.length = 0; },
  add(x, y, r, a = 1, color = null) { this.lights.push({ x, y, r, a, color }); },
  render(g, darkness, tint = '#0B1030') {
    if (darkness <= 0.01) { this.drawGlows(g); return; }
    const L = this.cv, lg = L.g;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, L.width, L.height);
    lg.fillStyle = tint; lg.globalAlpha = darkness; lg.fillRect(0, 0, L.width, L.height); lg.globalAlpha = 1;
    lg.globalCompositeOperation = 'destination-out';
    for (const l of this.lights) {
      const x = l.x, y = l.y, r = l.r;
      const grd = lg.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, `rgba(0,0,0,${l.a})`); grd.addColorStop(0.55, `rgba(0,0,0,${l.a * 0.7})`); grd.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = grd; lg.beginPath(); lg.arc(x, y, r, 0, Math.PI * 2); lg.fill();
    }
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(L, 0, 0, W, H);
    this.drawGlows(g);
  },
  drawGlows(g) {
    g.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      if (!l.color) continue;
      const grd = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.6);
      grd.addColorStop(0, rgba(l.color, 0.22 * l.a)); grd.addColorStop(1, rgba(l.color, 0));
      g.fillStyle = grd; g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }
};

// ---------- transición en diamantes (pixel) ----------
const Trans = {
  t: 0, dir: 0, cb: null, color: PAL.ink, dur: 0.4,
  go(cb, color = PAL.ink, dur = 0.4) { if (this.dir !== 0) { return; } this.dir = 1; this.t = 0; this.cb = cb; this.color = color; this.dur = dur; },
  get busy() { return this.dir !== 0; },
  update(dt) {
    if (this.dir === 1) {
      this.t += dt / this.dur;
      if (this.t >= 1) { this.t = 1; const cb = this.cb; this.cb = null; if (cb) cb(); this.dir = -1; this.hold = 0.05; }
    } else if (this.dir === -1) {
      if (this.hold > 0) { this.hold -= dt; return; }
      this.t -= dt / this.dur;
      if (this.t <= 0) { this.t = 0; this.dir = 0; }
    }
  },
  draw(g) {
    if (this.t <= 0) return;
    const S = 20;
    g.fillStyle = this.color;
    for (let y = -1; y < H / S + 1; y++) for (let x = -1; x < W / S + 1; x++) {
      const k = (x + y) / (W / S + H / S);
      const local = clamp(this.t * 2 - k, 0, 1);
      const r = Math.round(local * S * 0.75);
      if (r <= 0) continue;
      const cx = x * S + S / 2 + (y % 2 ? S / 2 : 0), cy = y * S + S / 2;
      for (let dy = -r; dy <= r; dy++) { const w = r - Math.abs(dy); g.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
    }
  }
};

// ---------- notificaciones ----------
// ---------------------------------------------------------------------
//  Reparto del espacio en pantalla para textos flotantes (globos, Lente,
//  avisos): cada etiqueta busca el hueco libre más cercano a su sitio ideal.
// ---------------------------------------------------------------------
const Labels = {
  rects: [],
  reset() { this.rects = []; },
  reserve(x, y, w, h) { this.rects.push({ x, y, w, h }); },
  hit(r) { return this.rects.some(o => r.x < o.x + o.w + 2 && r.x + r.w + 2 > o.x && r.y < o.y + o.h + 2 && r.y + r.h + 2 > o.y); },
  place(x, y, w, h, o = {}) {
    const minY = o.minY != null ? o.minY : 22, maxY = Math.max(minY, (o.maxY != null ? o.maxY : H - 22) - h);
    const fx = v => Math.round(clamp(v, 2, W - w - 2)), fy = v => Math.round(clamp(v, minY, maxY));
    const steps = [[0, 0]];
    for (let d = 4; d <= 72; d += 4) steps.push([0, -d], [0, d], [-d * 1.5, -d / 2], [d * 1.5, -d / 2]);
    for (const [dx, dy] of steps) {
      const r = { x: fx(x + dx), y: fy(y + dy), w, h };
      if (!this.hit(r)) { this.rects.push(r); return r; }
    }
    const r = { x: fx(x), y: fy(y), w, h }; this.rects.push(r); return r;
  }
};

const Toast = {
  list: [],
  show(text, color = PAL.sun, dur = 2.2) { this.list.push({ text, color, t: dur, max: dur }); if (this.list.length > 4) this.list.shift(); },
  update(dt) { for (const t of this.list) t.t -= dt; this.list = this.list.filter(t => t.t > 0); },
  // zonas que ocupan los avisos (para que los globos no se monten encima)
  // los avisos empiezan bajo el HUD; más abajo si hay barra de jefe o placas del mapa
  top() {
    const s = typeof Scenes !== 'undefined' ? Scenes.top() : null;
    if (s && s.toastTop) return s.toastTop;
    const lv = typeof G !== 'undefined' && G.run ? G.run.level : null;
    const inLevel = s && s.lv === lv;
    // mientras se ve el cartel con el nombre de la isla, los avisos van debajo de él
    if (inLevel && lv && lv.banner > 0 && lv.def.title && !lv.def.noHud) return 78;
    return inLevel && lv.rboss && lv.rboss.showBar ? 30 : 20;
  },
  reserveAreas() { let y = this.top(); for (const t of this.list) { const w = textW(t.text) + 12; Labels.reserve(W - w - 6, Math.round(t.y != null ? t.y : y), w, 15); y += 18; } },
  draw(g) {
    let y = this.top();
    for (const t of this.list) {
      const w = textW(t.text) + 12;
      // cada aviso se desliza hacia su fila (sin saltos cuando cambia la zona libre)
      t.y = t.y == null ? y : approach(t.y, y, 3);
      const slide = t.t > t.max - 0.2 ? (t.t - (t.max - 0.2)) / 0.2 : t.t < 0.25 ? 1 - t.t / 0.25 : 0;
      const x = W - w - 6 + Math.round(slide * (w + 10));
      panel(g, x, Math.round(t.y), w, 15, { border: t.color, accent: t.color });
      drawText(g, t.text, x + 6, Math.round(t.y) + 5, t.color);
      y += 18;
    }
  }
};
