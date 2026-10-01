// =====================================================================
//  SIMULADORES: experimentos con mandos, misiones visibles y gráfica en vivo
//  Cada simulador muestra SIEMPRE qué hay que hacer (lista de misiones con
//  ✓), qué cambia (cápsulas de variables y una gráfica) y por qué (una
//  explicación al cumplir cada misión). Se manejan con ← → (o arrastrando
//  el dedo / ratón sobre la barra) y ↑ ↓ para elegir el mando.
// =====================================================================
class SimScene extends PuzzleBase {
  constructor(def, done) {
    super({ title: def.title, tags: def.tags, concepts: def.concepts, codex: def.codex, intro: '', hints: def.hints, xp: def.xp || 35, main: def.main, music: def.music }, done);
    this.def = def; this.st = def.init(); this.mi = 0; this.hold = 0; this.sel = 0;
    this.hist = []; this.histT = 0; this.mT = 0; this.moved = 0; this.flash = 0;
    // las flechas mueven los mandos (no el foco de los botones)
    this.nav = false;
    this.startMission();
  }
  get mission() { return this.def.missions[this.mi]; }
  startMission() {
    const m = this.mission; this.hold = 0; this.mT = 0;
    if (!m) return;
    if (m.start) m.start(this.st, this);
    if (!this.okMsg) this.say('▶ MISIÓN ' + (this.mi + 1) + ': ' + m.text, PAL.sun);
  }
  completeMission() {
    const m = this.mission;
    AudioSys.sfx('ok'); this.flash = 1;
    this.mi++;
    if (this.mi >= this.def.missions.length) { this.okMsg = null; this.succeeded(this.def.final); return; }
    this.okMsg = '✓ ' + m.ok + '  ▶ ' + this.mission.text;
    this.say(this.okMsg, PAL.lime);
    this.startMission(); this.okMsg = null;
  }
  ctlRect(i) { return { x: 96, y: 174 + i * 17, w: 148, h: 6 }; }
  setCtl(c, v) {
    const old = c.get(this.st);
    v = clamp(c.step ? Math.round(v / c.step) * c.step : v, c.min, c.max);
    if (v !== old) { this.moved += Math.abs(v - old) / (c.max - c.min); c.set(this.st, v); }
  }
  tick(dt) {
    this.flash = Math.max(0, this.flash - dt * 1.5);
    if (this.result) return;
    const d = this.def, st = this.st, C = d.controls || [];
    if (C.length) {
      if (Input.hit('up')) this.sel = (this.sel + C.length - 1) % C.length;
      if (Input.hit('down')) this.sel = (this.sel + 1) % C.length;
      const c = C[this.sel], dir = (Input.down('right') ? 1 : 0) - (Input.down('left') ? 1 : 0);
      if (dir && !(c.enabled && !c.enabled(st))) this.setCtl(c, c.get(st) + dir * (c.speed || (c.max - c.min) / 2.5) * dt);
      const P = Input.pointer;
      if (P.down) C.forEach((c, i) => {
        if (c.enabled && !c.enabled(st)) return;
        const r = this.ctlRect(i);
        if (P.y >= r.y - 6 && P.y <= r.y + r.h + 6 && P.x >= r.x - 8 && P.x <= r.x + r.w + 8) { this.sel = i; this.setCtl(c, c.min + clamp((P.x - r.x) / r.w, 0, 1) * (c.max - c.min)); }
      });
    }
    d.step(st, dt, this);
    this.histT += dt;
    if (this.histT > 0.1) { this.histT = 0; this.hist.push(d.chart.get(st)); if (this.hist.length > 140) this.hist.shift(); }
    const m = this.mission; this.mT += dt;
    if (m) { if (m.check(st, this)) { this.hold += dt; if (this.hold >= (m.hold || 0)) this.completeMission(); } else this.hold = 0; }
  }
  draw(g) {
    const d = this.def, st = this.st;
    this.drawHeader(g, 'SIMULADOR');
    // ilustración
    panel(g, 4, 19, 300, 134, { border: '#2A3570', bg: '#0B1020', flat: true });
    g.save(); g.beginPath(); g.rect(6, 21, 296, 130); g.clip();
    d.view(g, 6, 21, 296, 130, st, this.t, this);
    g.restore();
    // mandos
    panel(g, 4, 156, 300, 68, { border: '#2A3570', flat: true });
    drawText(g, 'MANDOS', 10, 159, '#8C93B8');
    drawText(g, (d.controls || []).length > 1 ? '↑↓ elige · ← → ajusta · o arrastra' : '← → ajusta · o arrastra la barra', 298, 159, '#565E8C', { align: 'right' });
    (d.controls || []).forEach((c, i) => {
      const r = this.ctlRect(i), v = c.get(st), k = (v - c.min) / (c.max - c.min), on = !(c.enabled && !c.enabled(st)), sel = this.sel === i;
      drawText(g, fitText(c.label, 78), 12, r.y - 1, on ? (sel ? PAL.sun : PAL.cream) : '#565E8C');
      rect(g, r.x, r.y, r.w, r.h, '#1E2748'); rect(g, r.x, r.y, Math.round(r.w * k), r.h, on ? c.color || PAL.orange : '#3A4068');
      const kx = Math.round(r.x + r.w * k);
      rect(g, kx - 3, r.y - 4, 7, r.h + 8, on ? (sel ? PAL.white : PAL.cream) : '#565E8C'); strokeRect(g, kx - 3, r.y - 4, 7, r.h + 8, OUTLINE);
      drawText(g, (c.fmt ? c.fmt(v) : Math.round(v)) + (c.unit || ''), 298, r.y - 1, on ? PAL.white : '#565E8C', { align: 'right' });
      if (sel && on) drawText(g, '◀', r.x - 9, r.y - 1, PAL.sun);
    });
    // misiones
    panel(g, 308, 19, 168, 88, { border: this.flash > 0 ? mix('#2A3570', PAL.lime, this.flash) : '#2A3570', flat: true });
    drawText(g, 'MISIONES ' + Math.min(this.mi, d.missions.length) + '/' + d.missions.length, 314, 23, PAL.sun);
    let my = 34;
    d.missions.forEach((m, i) => {
      if (my > 100) return;
      const done = i < this.mi, cur = i === this.mi && !this.result;
      // la misión actual usa todas las líneas que quepan (las demás, una línea)
      const all = wrapPlain(m.text, 146), rest = d.missions.length - i - 1;
      const maxL = cur ? clamp(Math.floor((106 - my - rest * 12) / 9), 1, 6) : 1, lines = all.slice(0, maxL);
      drawText(g, done ? '✓' : cur ? '▶' : '○', 314, my, done ? PAL.lime : cur ? PAL.sun : '#565E8C');
      lines.forEach((ln, k) => drawText(g, k === lines.length - 1 && all.length > lines.length ? fitText(ln + '…', 146) : ln, 324, my + k * 9, done ? '#8CC88C' : cur ? PAL.cream : '#6A7090'));
      my += lines.length * 9 + 3;
    });
    if (this.mission && this.mission.hold && this.hold > 0) bar(g, 314, 101, 156, 3, this.hold, this.mission.hold, PAL.lime, '#1E2748');
    // gráfica
    const ch = d.chart, gx = 308, gy = 110, gw = 168, gh = 40;
    panel(g, gx, gy, gw, gh, { border: '#2A3570', bg: '#0B1020', flat: true });
    drawText(g, ch.label, gx + 5, gy + 3, ch.color);
    const top = gy + 13, bh = gh - 16;
    const tgt = typeof ch.target === 'function' ? ch.target(st, this) : ch.target;
    if (tgt != null) { const ty = Math.round(top + bh - clamp((tgt - (ch.min || 0)) / (ch.max - (ch.min || 0)), 0, 1) * bh); for (let x = gx + 4; x < gx + gw - 4; x += 4) rect(g, x, ty, 2, 1, PAL.lime); drawText(g, 'meta', gx + gw - 5, ty - 8, PAL.lime, { align: 'right' }); }
    // la gráfica avanza de izquierda a derecha y se desplaza al llenarse
    const lo = ch.min || 0, yv = v => top + bh - clamp((v - lo) / (ch.max - lo), 0, 1) * bh;
    for (let i = 1; i < this.hist.length; i++) {
      const x0 = gx + 4 + (i - 1) * (gw - 8) / 139, x1 = gx + 4 + i * (gw - 8) / 139;
      pline(g, x0, yv(this.hist[i - 1]), x1, yv(this.hist[i]), ch.color);
    }
    if (this.hist.length) { const lx = gx + 4 + (this.hist.length - 1) * (gw - 8) / 139; rect(g, lx - 1, yv(this.hist[this.hist.length - 1]) - 1, 3, 3, PAL.white); }
    // cápsulas (variables)
    panel(g, 308, 153, 168, 71, { border: '#2A3570', flat: true });
    drawText(g, 'VARIABLES', 314, 156, PAL.teal);
    d.vars.forEach((vv, i) => {
      const y = 166 + i * 14, v = vv.get(st);
      drawText(g, vv.name, 314, y, vv.color);
      drawText(g, (vv.fmt ? vv.fmt(v) : Math.round(v)) + ' ' + (vv.unit || ''), 470, y, PAL.white, { align: 'right' });
      rect(g, 314, y + 8, 156, 3, '#1E2748'); rect(g, 314, y + 8, Math.round(156 * clamp(v / vv.max, 0, 1)), 3, vv.color);
    });
    this.drawFooter(g, []);
  }
}

// ---------------------------------------------------------------------
//  SOLARIA · PANEL DE PRUEBAS (variables + energía solar)
//  Física: el panel recibe más radiación cuando su cara mira al sol.
//  Con el sol a una altura α, la mejor inclinación es 90° − α.
// ---------------------------------------------------------------------
// Radiación directa según la altura del sol: con el sol bajo, la luz atraviesa más
// atmósfera (masa de aire = 1 / sen(altura)) y llega menos (modelo de Meinel:
// 1353 × 0,7^(masa^0,678)). Más un poco de luz difusa del cielo.
const solarDNI = el => el <= 1 ? 0 : 1353 * Math.pow(0.7, Math.pow(1 / Math.sin(el * Math.PI / 180), 0.678));
const solarRad = st => {
  const inc = Math.max(0, Math.sin((st.tilt + st.sunEl) * Math.PI / 180));
  return Math.round((solarDNI(st.sunEl) * inc + 100 * Math.sin(st.sunEl * Math.PI / 180)) * (st.cloud ? 0.35 : 1));
};
const SIM_SOLAR = {
  title: 'Panel de pruebas', tags: ['VARIABLES', 'SOLAR'], concepts: ['variables', 'solar'], codex: 'variable', xp: 40,
  init: () => ({ tilt: 5, sunEl: 58, sunTarget: 58, bat: 20, rad: 0 }),
  controls: [{ id: 'tilt', label: 'inclinación', min: 0, max: 90, step: 1, unit: '°', speed: 40, color: PAL.orange, get: s => s.tilt, set: (s, v) => { s.tilt = v; } }],
  step(s, dt) {
    s.sunEl = approach(s.sunEl, s.sunTarget, dt * 18);
    s.rad = solarRad(s);
    // la batería se carga más rápido cuanta más radiación llega
    s.bat = Math.min(100, s.bat + Math.pow(s.rad / 1000, 2) * dt * 10);
  },
  vars: [
    { name: 'radiacion', get: s => s.rad, max: 1100, unit: 'W/m²', color: PAL.sun },
    { name: 'inclinacion', get: s => s.tilt, max: 90, unit: '°', color: PAL.orange },
    { name: 'altura_sol', get: s => s.sunEl, max: 90, unit: '°', color: PAL.aqua },
    { name: 'bateria', get: s => s.bat, max: 100, unit: '%', color: PAL.lime }
  ],
  chart: { label: 'radiacion (W/m²)', get: s => s.rad, min: 300, max: 1000, target: (s, sim) => sim.mi >= 2 ? 690 : 970, color: PAL.sun },
  missions: [
    { text: 'Mueve la palanca (← →) y mira cómo cambia la variable radiacion.', check: (s, sim) => sim.moved > 0.25, ok: 'radiacion cambia cuando cambia inclinacion.' },
    { text: 'Apunta el panel al sol: consigue radiacion ≥ 970 W/m².', check: s => s.rad >= 970, hold: 0.6, ok: 'De frente al sol la luz llega directa: máxima radiación.' },
    { text: 'Es la tarde: el sol bajó a 22°. Reorienta el panel: consigue radiacion ≥ 690 W/m².', start: s => { s.sunTarget = 22; }, check: s => Math.abs(s.sunEl - s.sunTarget) < 1 && s.rad >= 690, hold: 0.6, ok: 'Si altura_sol cambia, la mejor inclinación también cambia. Y con el sol bajo la luz cruza más aire: llega menos.' },
    { text: 'La ciudad gastó la batería (25 %). Cárgala hasta el 70 % con el panel bien orientado.', start: s => { s.bat = 25; }, check: s => s.bat >= 70, ok: 'bateria depende de radiacion: con más luz se carga mucho más rápido.' }
  ],
  final: 'Cada cápsula es una VARIABLE: un nombre que guarda un valor que cambia. radiacion depende de inclinacion y de altura_sol, y bateria depende de radiacion.',
  hints: ['El panel recibe más luz cuando su cara (la flecha punteada) apunta directo al sol.', 'Con el sol a 58°, prueba una inclinación cercana a 30°. Con el sol a 22°, cerca de 70°.', 'Regla: mejor inclinación ≈ 90° − altura del sol.'],
  view(g, x, y, w, h, s, t) {
    // cielo: azul con el sol alto, cálido cuando el sol baja (la luz cruza más atmósfera)
    const low = clamp((50 - s.sunEl) / 32, 0, 1), gy = y + h - 24;
    vGradient(g, x, y, w, h - 24, [[0, mix('#3FA8F0', '#3A5AA8', low)], [0.7, mix('#9FDCFF', '#FF9D6B', low)], [1, mix('#FFF3C8', '#FFD08A', low)]], false);
    // nubes que pasan despacio
    for (let i = 0; i < 3; i++) {
      const cx = x + ((i * 113 + t * (4 + i)) % (w + 60)) - 30, cy = y + 16 + i * 13;
      g.globalAlpha = 0.75; pellipse(g, cx, cy, 12, 3, '#FFFFFF'); pellipse(g, cx + 6, cy - 2, 7, 3, '#FFFFFF'); g.globalAlpha = 1;
    }
    // colinas lejanas (con bruma) y cercanas
    for (let xx = 0; xx < w; xx++) {
      const h1 = 14 + Math.sin(xx * 0.03 + 1) * 6 + Math.sin(xx * 0.011) * 5, h2 = 7 + Math.sin(xx * 0.05 + 3) * 4;
      rect(g, x + xx, gy - h1, 1, h1, mix(mix('#8AB8D8', '#B88AA8', low), '#FFFFFF', 0.25));
      rect(g, x + xx, gy - h2, 1, h2, mix('#5AAA5A', '#6A8A4A', low));
    }
    // suelo con hierba
    rect(g, x, gy, w, 24, '#3FA85A'); rect(g, x, gy, w, 2, '#66D66A');
    for (let i = 0; i < 40; i++) { const gx = x + (i * 37) % w, gh = 2 + (i % 3); rect(g, gx, gy - gh + 2, 1, gh, i % 4 ? '#2F8A4A' : '#8ADA6A'); }
    for (let i = 0; i < 7; i++) px(g, x + 12 + i * 41, gy + 6 + (i % 3) * 5, ['#FF7FCF', '#FFD84A', '#FFFFFF'][i % 3]);
    const px0 = x + w * 0.66, py0 = y + h - 44;
    const el = s.sunEl * Math.PI / 180, R = 86;
    const sx = px0 - Math.cos(el) * R, sy = py0 - Math.sin(el) * R;
    // arco del recorrido del sol
    for (let a = 8; a <= 80; a += 4) { const r = a * Math.PI / 180; px(g, px0 - Math.cos(r) * R, py0 - Math.sin(r) * R, 'rgba(255,255,255,0.5)'); }
    const sunC = mix('#FFE45A', '#FF9D42', low);
    g.globalAlpha = 0.18; pcircle(g, sx, sy, 22, sunC); g.globalAlpha = 0.3; pcircle(g, sx, sy, 15, sunC); g.globalAlpha = 1;
    pcircle(g, sx, sy, 10, sunC); pcircle(g, sx - 2, sy - 2, 5, '#FFF3A0');
    // casa con su batería y el cable desde el panel (la energía viaja por él)
    const hx = x + 22, hy = gy - 26;
    rect(g, hx, hy + 8, 34, 18, '#F0E0C8'); rect(g, hx, hy + 8, 34, 1, '#FFF3E0');
    for (let k = 0; k < 10; k++) rect(g, hx - 3 + k * 0.5, hy + 8 - k, 40 - k, 1, k % 3 ? '#C8503A' : '#E0684A');
    rect(g, hx + 5, hy + 13, 8, 7, s.bat > 30 ? '#FFD884' : '#3A4068'); rect(g, hx + 8.5, hy + 13, 1, 7, '#8B5A3C');
    rect(g, hx + 21, hy + 16, 7, 10, '#8B5A3C'); px(g, hx + 26, hy + 21, '#E8C070');
    rect(g, hx + 36, hy + 14, 7, 12, '#22306B'); rect(g, hx + 37, hy + 15 + Math.round(10 * (1 - s.bat / 100)), 5, Math.max(0, Math.round(10 * s.bat / 100)), s.bat > 60 ? PAL.lime : s.bat > 30 ? PAL.sun : PAL.coral);
    const cy0 = gy + 3;
    pline(g, px0, gy, px0, cy0, '#2A2A3A'); pline(g, hx + 40, cy0, px0, cy0, '#2A2A3A'); pline(g, hx + 40, cy0, hx + 40, hy + 26, '#2A2A3A');
    const nDots = Math.round(s.rad / 160);
    for (let i = 0; i < nDots; i++) { const k = ((t * s.rad / 300) + i / Math.max(1, nDots)) % 1; px(g, px0 - k * (px0 - hx - 40), cy0, PAL.sun); }
    // rayos hacia el panel (más intensos cuanta más radiación)
    const tr = s.tilt * Math.PI / 180, dx = Math.cos(tr), dy = -Math.sin(tr), nx = -Math.sin(tr), ny = -Math.cos(tr);
    g.globalAlpha = 0.25 + s.rad / 1600;
    for (let k = -2; k <= 2; k++) pline(g, sx, sy, px0 + dx * k * 9, py0 + dy * k * 9, sunC, 3, Math.floor(t * 12));
    g.globalAlpha = 1;
    // sombra del panel en el suelo (más larga cuanto más bajo está el sol)
    const shLen = clamp(26 * Math.cos(tr) + 26 * Math.sin(tr) / Math.tan(Math.max(0.2, el)), 6, 80);
    g.globalAlpha = 0.28; rect(g, px0 + 2, gy + 1, Math.round(shLen), 2, '#10301A'); g.globalAlpha = 1;
    // poste con bisagra y panel con marco y celdas
    rect(g, px0 - 1, py0, 3, gy - py0, '#8A8FB0'); rect(g, px0, py0, 1, gy - py0, '#C9D2F0');
    for (let k = -26; k <= 26; k++) {
      const edge = Math.abs(k) >= 25, cell = Math.abs(k) % 9 < 1;
      rect(g, px0 + dx * k - 1, py0 + dy * k - 1, 3, 3, edge ? '#C9D2F0' : cell ? '#9FE8FF' : '#2A4A9A');
      if (!edge && !cell) px(g, px0 + dx * k + nx, py0 + dy * k + ny, '#4A6ACB');
    }
    pcircle(g, px0, py0, 2, '#565E8C'); px(g, px0, py0, '#C9D2F0');
    // destello cuando mira al sol
    const dev = Math.round(Math.abs(90 - s.tilt - s.sunEl));
    if (dev <= 14 && Math.floor(t * 3) % 2) { hdGlint(g, px0 + dx * 10 + nx, py0 + dy * 10 + ny, '#FFFFFF', true); }
    // frente del panel (normal) y desvío respecto al sol
    for (let r = 4; r < 34; r += 3) px(g, px0 + nx * r, py0 + ny * r, PAL.white);
    drawText(g, 'frente', px0 + nx * 36 - 10, py0 + ny * 36 - 8, PAL.white, { outline: '#2A4A9A' });
    simLabel(g, 'desvío del sol: ' + dev + '°', x + 6, y + 5, dev <= 14 ? PAL.lime : PAL.sun);
    // batería grande (lo que guarda la casa)
    const bx = x + w - 34, by = y + h - 18;
    rect(g, bx, by, 26, 12, '#10162B'); rect(g, bx + 26, by + 3, 2, 6, '#10162B');
    rect(g, bx + 2, by + 2, Math.round(22 * s.bat / 100), 8, s.bat > 60 ? PAL.lime : s.bat > 30 ? PAL.sun : PAL.coral);
    simLabel(g, Math.round(s.bat) + '%', bx + 13, by - 10, PAL.white, 'center');
  }
};

// el panel de pruebas de Solaria usa el simulador (se mantiene el nombre para la historia)
class VariableLabScene extends SimScene { constructor(done) { super(SIM_SOLAR, done); } }

// catálogo de simuladores (para el mapa, el docente y las pruebas)
const SIMS = { SIM_SOLAR };
