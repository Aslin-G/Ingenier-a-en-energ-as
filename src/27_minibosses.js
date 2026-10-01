// =====================================================================
//  MINI JEFES: uno a mitad de cada isla
//  Al acercarse Lía, dos barreras de energía cierran la zona. Cada mini
//  jefe ejecuta un algoritmo corto del concepto de su isla (se lee con la
//  Lente: la línea actual va marcada), avisa sus ataques con «!» y tiene
//  un DESCANSO en el que recibe más daño. Al vencerlo se depura, se abren
//  las barreras y deja un núcleo de forja. No reaparece una vez vencido.
// =====================================================================

// patrones: charger (embiste hasta chocar), jumper (salta sobre Lía), shooter (dispara ráfagas), flyer (vuela y se lanza en picado)
const MINI = {
  puerto: {
    name: 'CANGREJO VOLTIO', kind: 'charger', hp: 16, w: 24, h: 16, col: '#FF6B4A', col2: '#B8334A',
    code: ['pinza()', 'embestir(→)', 'chispas(2)', 'descansar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, f = m.face, open = m.step === 0 && Math.floor(t * 8) % 2;
      // patas
      for (let i = 0; i < 3; i++) { const lx = x + 5 + i * 5, k = Math.round(Math.sin(t * 14 + i) * (m.moving ? 1 : 0)); pline(g, lx, y + 11, lx - 2, y + 15 + k, OUTLINE); pline(g, lx + 9, y + 11, lx + 11, y + 15 - k, OUTLINE); }
      // caparazón
      pellipse(g, x + 12, y + 9, 11, 6, OUTLINE); pellipse(g, x + 12, y + 9, 10, 5, m.white ? '#FFFFFF' : this.col); pellipse(g, x + 10, y + 7, 6, 2, '#FFA08A');
      for (const [sx, sy] of [[8, 10], [16, 10], [12, 12]]) px(g, x + sx, y + sy, this.col2);
      // pinzas (la de delante grande)
      const cx = f > 0 ? x + 22 : x - 4, cy = y + 6;
      pcircle(g, cx + 2, cy, 4, OUTLINE); pcircle(g, cx + 2, cy, 3, this.col); rect(g, cx + (f > 0 ? 3 : -1), cy - (open ? 3 : 1), 3, 1, OUTLINE);
      if (open) { px(g, cx + 2 + f * 3, cy - 2, PAL.sun); px(g, cx + 3 + f * 4, cy - 3, '#FFFFFF'); }
      const bx = f > 0 ? x - 1 : x + 21; pcircle(g, bx + 2, cy + 2, 2, OUTLINE); px(g, bx + 2, cy + 2, this.col);
      // ojos en tallos
      for (const ex of [9, 14]) { pline(g, x + ex, y + 4, x + ex, y + 1, OUTLINE); rect(g, x + ex - 1, y - 2, 3, 3, '#FFFFFF'); px(g, x + ex + (f > 0 ? 1 : -1) * 0, y - 1, OUTLINE); }
      if (m.stunned) for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.1; px(g, x + 12 + Math.cos(a) * 9, y - 4 + Math.sin(a) * 2, PAL.sun); }
    }
  },
  valle: {
    name: 'ESPANTAPÁJAROS BUG', kind: 'jumper', hp: 18, w: 18, h: 28, col: '#E8C060', col2: '#8A5A2A',
    code: ['saltar_hacia(Lía)', 'caer() → ondas(2)', 'esparcir_paja()', 'descansar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, f = m.face, w = m.white;
      // palo
      rect(g, x + 8, y + 18, 2, 10, OUTLINE); rect(g, x + 8, y + 18, 1, 10, '#A07A4A');
      // camisa a cuadros
      rect(g, x + 2, y + 10, 14, 10, OUTLINE); rect(g, x + 3, y + 11, 12, 8, w ? '#FFFFFF' : '#C8503A');
      for (let i = 0; i < 3; i++) { rect(g, x + 3 + i * 4, y + 11, 1, 8, '#8A2A2A'); rect(g, x + 3, y + 13 + i * 2, 12, 1, '#E87A5A'); }
      // brazos de paja abiertos
      const sw = Math.round(Math.sin(t * 6) * 1);
      rect(g, x - 3, y + 12 + sw, 6, 2, OUTLINE); rect(g, x + 15, y + 12 - sw, 6, 2, OUTLINE);
      for (let i = 0; i < 3; i++) { px(g, x - 4, y + 11 + i + sw, this.col); px(g, x + 21, y + 11 + i - sw, this.col); }
      // cabeza de saco con botones
      pcircle(g, x + 9, y + 6, 6, OUTLINE); pcircle(g, x + 9, y + 6, 5, w ? '#FFFFFF' : '#E8C890');
      rect(g, x + 6, y + 5, 2, 2, OUTLINE); rect(g, x + 11, y + 5, 2, 2, OUTLINE); px(g, x + 6, y + 5, m.stunned ? '#FFFFFF' : PAL.lime); px(g, x + 11, y + 5, m.stunned ? '#FFFFFF' : PAL.lime);
      for (let i = 0; i < 4; i++) px(g, x + 6 + i * 2, y + 9, OUTLINE);
      // sombrero de paja con bug
      rect(g, x + 1, y - 1, 16, 2, OUTLINE); rect(g, x + 2, y - 1, 14, 1, this.col); rect(g, x + 5, y - 5, 8, 4, OUTLINE); rect(g, x + 6, y - 4, 6, 3, this.col);
      px(g, x + 9 + Math.round(Math.sin(t * 3) * 2), y - 6, PAL.violet);
      if (m.stunned) for (let i = 0; i < 3; i++) { const a = t * 7 + i * 2.1; px(g, x + 9 + Math.cos(a) * 8, y - 8 + Math.sin(a) * 2, PAL.sun); }
    }
  },
  solaria: {
    name: 'GIRASOL SOBRECARGADO', kind: 'shooter', hp: 18, w: 20, h: 30, col: '#FFD84A', col2: '#C88A2A',
    code: ['SI Lía_cerca ENTONCES', '  rayo_solar()', 'SINO semillas(3)', 'descansar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, w = m.white, look = m.face;
      // tallo y hojas
      rect(g, x + 9, y + 14, 3, 16, OUTLINE); rect(g, x + 10, y + 14, 1, 16, '#3FA85A');
      pellipse(g, x + 6, y + 22, 4, 2, '#2A7A3A'); pellipse(g, x + 15, y + 19, 4, 2, '#2A7A3A');
      // pétalos que giran
      for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283 + t * (m.step === 1 ? 4 : 0.6); pcircle(g, x + 10 + Math.cos(a) * 8, y + 8 + Math.sin(a) * 8, 2, w ? '#FFFFFF' : i % 2 ? this.col : '#FFB020'); }
      // disco con cara
      pcircle(g, x + 10, y + 8, 6, OUTLINE); pcircle(g, x + 10, y + 8, 5, '#6A3A1A');
      for (let i = 0; i < 6; i++) px(g, x + 7 + (i % 3) * 3, y + 5 + Math.floor(i / 3) * 6, '#8A5A2A');
      const ex = x + 8 + look;
      if (m.stunned) { pline(g, ex - 1, y + 6, ex + 1, y + 8, '#FFFFFF'); pline(g, ex + 3, y + 6, ex + 5, y + 8, '#FFFFFF'); }
      else { rect(g, ex, y + 6, 2, 2, '#FFFFFF'); rect(g, ex + 3, y + 6, 2, 2, '#FFFFFF'); px(g, ex + (look > 0 ? 1 : 0), y + 7, OUTLINE); px(g, ex + 3 + (look > 0 ? 1 : 0), y + 7, OUTLINE); }
      rect(g, x + 8, y + 11, 5, 1, PAL.coral);
      if (m.step === 1) { g.globalAlpha = 0.4 + 0.3 * Math.sin(t * 20); pcircle(g, x + 10, y + 8, 12, PAL.sun); g.globalAlpha = 1; }
    }
  },
  aeris: {
    name: 'HALCÓN BUCLE', kind: 'flyer', hp: 18, w: 22, h: 16, col: '#7FE7FF', col2: '#2A7ACC',
    code: ['REPETIR 3 VECES:', '  rodear(Lía)', 'picado()', 'posarse()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, f = m.face, w = m.white, flap = Math.floor(t * (m.stunned ? 2 : 10)) % 2;
      // alas
      const wy = flap ? -4 : 2;
      for (const s of [-1, 1]) { const bx = x + 11 + s * 4; for (let k = 0; k < 7; k++) rect(g, bx + s * k, y + 6 + Math.round(wy * k / 6), 2, 3, k > 4 ? '#FFFFFF' : this.col); }
      // cuerpo
      pellipse(g, x + 11, y + 9, 7, 5, OUTLINE); pellipse(g, x + 11, y + 9, 6, 4, w ? '#FFFFFF' : this.col2); pellipse(g, x + 11, y + 11, 4, 2, '#E8F4FF');
      // cabeza y pico
      const hx = x + 11 + f * 6; pcircle(g, hx, y + 5, 4, OUTLINE); pcircle(g, hx, y + 5, 3, w ? '#FFFFFF' : this.col2);
      rect(g, hx + f * 3, y + 5, 3 * f > 0 ? 3 : 3, 2, PAL.sun); px(g, hx + f * 5, y + 6, '#C88A2A');
      rect(g, hx + f * 1 - 1, y + 3, 2, 2, '#FFFFFF'); px(g, hx + f * 1 - (f > 0 ? 0 : 1), y + 4, m.stunned ? PAL.sun : OUTLINE);
      // cola en espiral (el bucle)
      const tx = x + 11 - f * 9; for (let k = 0; k < 6; k++) { const a = k * 1.2 + t * 6; px(g, tx + Math.cos(a) * (2 + k * 0.4), y + 9 + Math.sin(a) * (1 + k * 0.3), k % 2 ? '#FFFFFF' : this.col); }
      if (m.loopN != null) drawText(g, '↻' + m.loopN, x + 11, y - 9, PAL.aqua, { align: 'center', outline: PAL.ink });
    }
  },
  hydria: {
    name: 'ANGUILA COMPUERTA', kind: 'charger', hp: 20, w: 28, h: 14, col: '#59C7FF', col2: '#163A73',
    code: ['chorro(altura=1)', 'deslizar(→)', 'chorro(altura=2)', 'descansar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, f = m.face, w = m.white;
      // cuerpo ondulante en segmentos
      for (let k = 0; k < 7; k++) { const sx = f > 0 ? x + 2 + k * 3.6 : x + 26 - k * 3.6, sy = y + 8 + Math.round(Math.sin(t * 9 - k * 0.8) * 2); pcircle(g, sx, sy, 4, OUTLINE); pcircle(g, sx, sy, 3, w ? '#FFFFFF' : k % 2 ? this.col : '#3A9AD8'); px(g, sx, sy - 2, '#BFF4FF'); }
      // cabeza-compuerta con válvula
      const hx = f > 0 ? x + 25 : x + 3; pcircle(g, hx, y + 7, 5, OUTLINE); pcircle(g, hx, y + 7, 4, w ? '#FFFFFF' : this.col2);
      pring(g, hx, y + 7, 2, PAL.sun); pline(g, hx - 2, y + 7, hx + 2, y + 7, PAL.sun);
      rect(g, hx + f * 2 - 1, y + 3, 2, 2, '#FFFFFF'); px(g, hx + f * 2 - (f > 0 ? 0 : 1), y + 4, m.stunned ? PAL.sun : OUTLINE);
      // aletas
      rect(g, x + 10, y + 2, 3, 2, this.col); rect(g, x + 16, y + 2, 3, 2, this.col);
      if (m.step === 0 || m.step === 2) for (let k = 0; k < 3; k++) px(g, hx + f * (6 + k * 2), y + 6 + (k % 2), '#BFF4FF');
    }
  },
  bioloop: {
    name: 'HONGO RECURSIVO', kind: 'shooter', hp: 20, w: 24, h: 24, col: '#B6F35B', col2: '#9A5ACC',
    code: ['PARA CADA espora EN lista:', '  lanzar(espora)', 'brotar(hijo)', 'descansar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, w = m.white, puff = m.step === 1 ? 1 : 0;
      // pie
      rect(g, x + 8, y + 12, 8, 12, OUTLINE); rect(g, x + 9, y + 12, 6, 11, w ? '#FFFFFF' : '#F0E6D0'); rect(g, x + 9, y + 18, 6, 1, '#D0C0A0');
      // sombrero con lunares que laten
      pellipse(g, x + 12, y + 9, 12 + puff, 8 + puff, OUTLINE); pellipse(g, x + 12, y + 9, 11 + puff, 7 + puff, w ? '#FFFFFF' : this.col2);
      rect(g, x + 1, y + 12, 22, 2, OUTLINE);
      for (const [sx, sy, r] of [[6, 7, 2], [13, 4, 2], [18, 8, 2], [10, 10, 1]]) { pcircle(g, x + sx, y + sy, r, this.col); px(g, x + sx - 1, y + sy - 1, '#FFFFFF'); }
      // cara
      if (m.stunned) { rect(g, x + 9, y + 15, 2, 1, OUTLINE); rect(g, x + 13, y + 15, 2, 1, OUTLINE); }
      else { rect(g, x + 9, y + 14, 2, 3, OUTLINE); rect(g, x + 13, y + 14, 2, 3, OUTLINE); px(g, x + 9, y + 14, '#FFFFFF'); px(g, x + 13, y + 14, '#FFFFFF'); }
      rect(g, x + 10, y + 19, 4, 1, PAL.coral);
      // esporas flotando
      for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; px(g, x + 12 + Math.cos(a) * 14, y + 2 + Math.sin(a * 1.3) * 4, this.col); }
    }
  },
  gea: {
    name: 'MAGMITA', kind: 'jumper', hp: 22, w: 22, h: 22, col: '#FF7B4A', col2: '#4A3030',
    code: ['estado ← CALENTANDO', 'saltar() → ERUPCIÓN', 'ondas_de_lava(2)', 'ENFRIANDO  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, w = m.white, hot = !m.stunned, glow = hot ? (Math.floor(t * 10) % 2 ? PAL.sun : this.col) : '#7C86C8';
      // roca redonda con grietas
      pcircle(g, x + 11, y + 12, 10, OUTLINE); pcircle(g, x + 11, y + 12, 9, w ? '#FFFFFF' : m.stunned ? '#5A5A6A' : this.col2);
      pcircle(g, x + 8, y + 9, 4, m.stunned ? '#6A6A7A' : '#6A4040');
      pline(g, x + 5, y + 8, x + 9, y + 14, glow); pline(g, x + 9, y + 14, x + 7, y + 19, glow); pline(g, x + 16, y + 6, x + 13, y + 13, glow); pline(g, x + 13, y + 13, x + 17, y + 18, glow);
      // ojos de lava
      rect(g, x + 7, y + 10, 3, 3, glow); rect(g, x + 13, y + 10, 3, 3, glow); px(g, x + 7, y + 10, '#FFFFFF'); px(g, x + 13, y + 10, '#FFFFFF');
      rect(g, x + 9, y + 15, 5, 1, OUTLINE);
      // humo / vapor
      if (Math.random() < 0.15 && !m.portrait) Particles.spawn({ x: m.x + rand(4, 18), y: m.y + 1, vy: -20, vx: rand(-5, 5), life: 0.7, type: 'fade', size: 2, color: m.stunned ? 'rgba(255,255,255,0.6)' : 'rgba(90,80,90,0.7)' });
    }
  },
  h2: {
    name: 'MEDUSA DE PRESIÓN', kind: 'flyer', hp: 22, w: 20, h: 22, col: '#9CF5D8', col2: '#2A9A8A',
    code: ['entrada: agua', 'comprimir() → burbujas(3)', 'picado()', 'despresurizar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, w = m.white, pulse = Math.round(Math.sin(t * 5));
      // tentáculos-tubo
      for (let i = 0; i < 4; i++) { const tx = x + 4 + i * 4; for (let k = 0; k < 8; k++) px(g, tx + Math.round(Math.sin(t * 6 + i + k * 0.6)), y + 12 + k, k % 3 === 0 ? PAL.sun : this.col2); }
      // campana translúcida con manómetro
      pellipse(g, x + 10, y + 8, 9, 7 + pulse, OUTLINE); pellipse(g, x + 10, y + 8, 8, 6 + pulse, w ? '#FFFFFF' : this.col);
      g.globalAlpha = 0.5; pellipse(g, x + 8, y + 5, 4, 2, '#FFFFFF'); g.globalAlpha = 1;
      pcircle(g, x + 10, y + 9, 3, OUTLINE); pcircle(g, x + 10, y + 9, 2, '#FFFFFF');
      const a = m.stunned ? 0.4 : -1.2 + Math.sin(t * 2) * 0.8; pline(g, x + 10, y + 9, x + 10 + Math.cos(a) * 2, y + 9 + Math.sin(a) * 2, PAL.coral);
      rect(g, x + 4, y + 6, 2, 2, OUTLINE); rect(g, x + 14, y + 6, 2, 2, OUTLINE);
    }
  },
  bateria: {
    name: 'RATA CORTOCIRCUITO', kind: 'charger', hp: 22, w: 22, h: 14, col: '#C9D2F0', col2: '#FF4FB8',
    code: ['buscar(Lía)', 'SI encontrada: correr()', 'chispa(3)', 'recargar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, f = m.face, w = m.white;
      // cola-cable con enchufe
      const tx = f > 0 ? x : x + 22; for (let k = 0; k < 8; k++) px(g, tx - f * k, y + 9 + Math.round(Math.sin(t * 8 + k * 0.7) * 2), OUTLINE);
      rect(g, tx - f * 9 - 1, y + 8, 3, 3, PAL.sun);
      // cuerpo-pila
      rect(g, x + 3, y + 4, 15, 9, OUTLINE); rect(g, x + 4, y + 5, 13, 7, w ? '#FFFFFF' : this.col);
      rect(g, x + 4, y + 5, Math.round(13 * (m.hp / m.maxHp)), 2, this.col2); rect(g, x + 4, y + 11, 13, 1, '#8A93B8');
      // cabeza con orejas
      const hx = f > 0 ? x + 17 : x - 1; pcircle(g, hx + 2, y + 7, 4, OUTLINE); pcircle(g, hx + 2, y + 7, 3, w ? '#FFFFFF' : '#A8B0D0');
      pcircle(g, hx, y + 3, 2, OUTLINE); px(g, hx, y + 3, PAL.pink); pcircle(g, hx + 4, y + 3, 2, OUTLINE); px(g, hx + 4, y + 3, PAL.pink);
      px(g, hx + 2 + f * 2, y + 6, m.stunned ? '#FFFFFF' : PAL.coral); px(g, hx + 2 + f * 4, y + 8, PAL.pink);
      // patas que corren
      const k = m.moving ? Math.floor(t * 18) % 2 : 0; rect(g, x + 5 + k, y + 13, 2, 1, OUTLINE); rect(g, x + 13 - k, y + 13, 2, 1, OUTLINE);
      if (!m.stunned && Math.random() < 0.3) px(g, x + rand(4, 18), y + rand(2, 6), '#FFFFFF');
    }
  },
  prisma: {
    name: 'CRISTAL ERRANTE', kind: 'flyer', hp: 24, w: 20, h: 24, col: '#C9B2FF', col2: '#7A5AC8',
    code: ['SEGÚN fuente:', '  sol → rayos(3)', '  viento → picado()', 'equilibrar()  ← ¡golpea!'],
    draw(m, g, x, y) {
      const t = m.t, w = m.white, c = w ? '#FFFFFF' : hsl(t * 70, 80, 75);
      // rombo facetado con contorno
      for (let k = 0; k <= 10; k++) { const ww = 10 - k; rect(g, x + 10 - ww, y + 11 - k, ww * 2 + 1, 1, k === 10 ? OUTLINE : c); rect(g, x + 10 - ww, y + 11 + k, ww * 2 + 1, 1, k === 10 ? OUTLINE : shade(this.col2, 0.1)); if (ww > 0) for (const sy of [11 - k, 11 + k]) { px(g, x + 10 - ww, y + sy, OUTLINE); px(g, x + 10 + ww, y + sy, OUTLINE); } }
      pline(g, x + 10, y + 2, x + 6, y + 11, '#FFFFFF'); rect(g, x + 4, y + 11, 13, 1, shade(c, 0.3));
      // ojo
      if (m.stunned) { pline(g, x + 8, y + 9, x + 12, y + 13, OUTLINE); pline(g, x + 8, y + 13, x + 12, y + 9, OUTLINE); }
      else { pcircle(g, x + 10, y + 11, 2, '#FFFFFF'); px(g, x + 10 + m.face, y + 11, OUTLINE); }
      // esquirlas orbitando
      for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.09; const sx = x + 10 + Math.cos(a) * 13, sy = y + 11 + Math.sin(a) * 9; rect(g, sx - 1, sy - 1, 3, 3, OUTLINE); px(g, sx, sy, c); }
    }
  }
};

// barrera de energía que cierra la zona del mini jefe
class MiniWall extends Entity {
  constructor(lv, x, y, h, col) { super(lv, x, y, 6, h); this.col = col; this.layer = 1; this.on = 0; }
  update(dt) { super.update(dt); this.on = Math.min(1, this.on + dt * 3); }
  solidRect() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), h = Math.round(this.h * this.on), t = this.t;
    g.globalAlpha = 0.35; rect(g, x - 2, y + this.h - h, this.w + 4, h, this.col); g.globalAlpha = 0.85;
    rect(g, x + 1, y + this.h - h, this.w - 2, h, this.col); g.globalAlpha = 1;
    for (let yy = 0; yy < h; yy += 3) px(g, x + 2 + Math.round(Math.sin(t * 9 + yy * 0.5) * 1.5), y + this.h - h + yy, '#FFFFFF');
    rect(g, x - 1, y + this.h - 2, this.w + 2, 2, '#3A4068');
  }
  light() { return { x: this.x + 3, y: this.y + this.h / 2, r: 40, c: this.col, a: 0.6 }; }
}

class MiniBoss extends Enemy {
  constructor(lv, x, y, region, arena) {
    const D = MINI[region];
    super(lv, x, y - D.h, D.w, D.h, { hp: Math.round(D.hp * (G.save.settings.assist ? 0.7 : 1)) });
    this.D = D; this.region = region; this.arena = arena; this.mini = true; this.name = D.name; this.type = 'mini_' + region;
    this.home = { x: this.x, y: this.y }; this.noKnock = true; this.heavy = true; this.noLoot = true;
    this.state = 'wait'; this.step = 0; this.timer = 0; this.vx = 0; this.vy = 0; this.face = -1; this.walls = [];
    this.respawnSeen = lv.respawns || 0; this.skin = [D.col, D.col2, PAL.sun];
    this.hostile = false; // dormido hasta que Lía entra en su zona
  }
  get stunned() { return this.state === 'rest'; }
  get white() { return this.flashT > 0; }
  get moving() { return this.state === 'charge' || this.state === 'walk'; }
  vulnBonus() { return this.stunned ? 1 : 0; }
  // la zona de combate: entre las dos barreras
  startFight() {
    const lv = this.lv, A = this.arena;
    this.state = 'intro'; this.timer = 0.9; this.hostile = true;
    for (const wx of [A.x0 - 6, A.x1]) { const w = new MiniWall(lv, wx, A.top, A.ground - A.top, this.D.col); this.walls.push(w); lv.addEntity(w); }
    lv.miniFight = this;
    AudioSys.sfx('roar'); FX.shake(2, 0.5);
    Toast.show('⚠ MINI JEFE: ' + this.D.name, this.D.col, 3);
    if (!flag('miniTip')) { setFlag('miniTip'); Bark.say('pix', '¡Un mini jefe! Con la Lente (' + bindName('lens') + ') ves su algoritmo. Golpéalo cuando DESCANSE.', 4.5); }
  }
  resetFight() {
    for (const w of this.walls) w.dead = true;
    this.walls = []; this.state = 'wait'; this.hostile = false; this.hp = this.maxHp; this.x = this.home.x; this.y = this.home.y; this.vx = this.vy = 0; this.hpShowT = 0;
    if (this.lv.miniFight === this) this.lv.miniFight = null;
    for (const e of this.lv.entities) if (e instanceof Shot && e.owner === this) e.dead = true;
  }
  update(dt) {
    super.update(dt);
    const lv = this.lv, p = lv.player, A = this.arena, D = this.D;
    if ((lv.respawns || 0) !== this.respawnSeen) { this.respawnSeen = lv.respawns || 0; this.resetFight(); return; }
    if (this.paused) return;
    if (this.state === 'wait') {
      if (p.cx > A.x0 + 10 && p.cx < A.x1 - 4 && Math.abs(p.y + p.h - A.ground) < 48) this.startFight();
      return;
    }
    this.face = this.state === 'charge' ? this.face : sign(p.cx - (this.x + this.w / 2)) || this.face;
    this.timer -= dt;
    const flyer = D.kind === 'flyer';
    // física simple: los voladores flotan, los demás caen
    if (!flyer || this.state === 'rest') {
      this.vy = Math.min(this.vy + 900 * dt, 360);
      this.y += this.vy * dt;
      if (this.y + this.h >= A.ground) { this.y = A.ground - this.h; if (this.vy > 200 && D.kind === 'jumper') this.landSlam(); this.vy = 0; this.air = false; }
    }
    const k = D.kind;
    switch (this.state) {
      case 'intro': if (this.timer <= 0) this.next(); break;
      case 'tele': if (this.timer <= 0) this.act(); break;
      case 'charge': {
        this.x += this.face * 175 * dt; this.step = 1;
        if (this.x <= A.x0 + 8 || this.x + this.w >= A.x1 - 2) {
          this.x = clamp(this.x, A.x0 + 8, A.x1 - 2 - this.w);
          FX.shake(3, 0.3); AudioSys.sfx('boom'); this.step = 2;
          for (let i = 0; i < (this.region === 'bateria' ? 3 : 2); i++) this.shoot(this.x + this.w / 2, this.y + 4, -this.face * (70 + i * 35), -170 - i * 30, { grav: 420, kind: this.region === 'hydria' ? 'drop' : 'spark' });
          this.wave(-this.face);
          this.rest(1.6);
        }
        break;
      }
      case 'jump': if (this.air) this.x += this.jumpVx * dt; if (!this.air && this.vy === 0 && this.timer <= 0) this.rest(1.5); break;
      case 'volley': if (this.timer <= 0) { this.fireVolley(); this.volleys--; if (this.volleys <= 0) this.rest(1.7); else this.timer = 0.75; } break;
      case 'walk': this.x = clamp(this.x + this.face * -30 * dt, A.x0 + 10, A.x1 - this.w - 4); if (this.timer <= 0) this.next(); break;
      case 'orbit': {
        // vuela en círculos sobre Lía (un bucle): cuenta las vueltas
        this.ang = (this.ang || 0) + dt * 3.2;
        const lap = Math.floor(this.ang / 6.283); if (lap !== this.lap) { this.lap = lap; this.loopN = Math.min(3, lap + 1); }
        const tx = clamp(p.cx + Math.cos(this.ang) * 50, A.x0 + 14, A.x1 - 14) - this.w / 2, ty = A.ground - 70 + Math.sin(this.ang * 2) * 12;
        this.x = lerp(this.x, tx, Math.min(1, dt * 4)); this.y = lerp(this.y, ty, Math.min(1, dt * 4));
        if (Math.random() < dt * 0.8) this.shoot(this.x + this.w / 2, this.y + this.h, 0, 60, { grav: 300, kind: this.region === 'h2' ? 'bubble' : 'spark' });
        if (this.ang > 6.283 * 3) { this.loopN = null; this.tele(0.6, 'dive'); }
        break;
      }
      case 'dive': {
        this.step = 2;
        const tx = this.diveX - this.w / 2; this.x = approach(this.x, tx, 220 * dt); this.y += 260 * dt;
        if (this.y + this.h >= A.ground) { this.y = A.ground - this.h; FX.shake(2, 0.25); AudioSys.sfx('bonk'); this.wave(-1); this.wave(1); this.rest(1.6); }
        break;
      }
      case 'rest': if (this.timer <= 0) { if (flyer) this.state = 'rise', this.timer = 0.6; else this.next(); } break;
      case 'rise': this.y = lerp(this.y, A.ground - 70, Math.min(1, dt * 3)); this.step = 0; if (this.timer <= 0) this.next(); break;
    }
    // contacto
    if (!this.stunned && this.state !== 'intro' && rectHit(p, { x: this.x + 2, y: this.y + 2, w: this.w - 4, h: this.h - 2 })) p.hurt(this);
    this.x = clamp(this.x, A.x0 + 6, A.x1 - this.w);
  }
  tele(t, then) { this.state = 'tele'; this.timer = t * (G.save.settings.assist ? 1.3 : 1); this.then = then; AudioSys.sfx('warn'); }
  // siguiente paso de su algoritmo
  next() {
    const k = this.D.kind, p = this.lv.player;
    this.step = 0;
    if (k === 'charger') this.tele(0.55, 'charge');
    else if (k === 'jumper') this.tele(0.5, 'jump');
    else if (k === 'shooter') this.tele(0.4, 'volley');
    else { this.state = 'orbit'; this.ang = 0; this.lap = -1; }
  }
  act() {
    const p = this.lv.player, A = this.arena;
    if (this.then === 'charge') { this.state = 'charge'; this.face = sign(p.cx - (this.x + this.w / 2)) || this.face; AudioSys.sfx('dash'); }
    else if (this.then === 'jump') {
      this.state = 'jump'; this.step = 1; this.air = true;
      const tx = clamp(p.cx - this.w / 2, A.x0 + 10, A.x1 - this.w - 4), T = 0.8;
      this.vy = -430; this.jumpVx = (tx - this.x) / T; this.timer = T;
      AudioSys.sfx('jump');
    } else if (this.then === 'volley') { this.state = 'volley'; this.volleys = 3; this.timer = 0; this.step = 1; }
    else if (this.then === 'dive') { this.state = 'dive'; this.diveX = p.cx; AudioSys.sfx('dash'); }
  }
  landSlam() { FX.shake(3, 0.3); AudioSys.sfx('land'); this.step = 2; this.wave(-1); this.wave(1); if (this.region === 'valle') for (let i = 0; i < 4; i++) this.shoot(this.x + this.w / 2, this.y, rand(-90, 90), rand(-220, -150), { grav: 500, kind: 'leaf' }); }
  fireVolley() {
    const p = this.lv.player, ox = this.x + this.w / 2, oy = this.y + 8, near = Math.abs(p.cx - ox) < 70;
    AudioSys.sfx('shot');
    if (this.region === 'solaria' && near) { this.step = 1; for (const vy of [-40, 0, 40]) this.shoot(ox, oy, this.face * 150, vy, { kind: 'spark', r: 3 }); return; }
    this.step = 2;
    if (this.region === 'bioloop') { for (let i = 0; i < 3; i++) { const t = 0.9, tx = p.cx + (i - 1) * 24, g = 420; this.shoot(ox, oy, (tx - ox) / t, (this.arena.ground - 6 - oy - 0.5 * g * t * t) / t, { grav: g, kind: 'seed', r: 3 }); } return; }
    const a = Math.atan2(p.y + 10 - oy, p.cx - ox);
    for (const s of [-0.18, 0, 0.18]) this.shoot(ox, oy, Math.cos(a + s) * 120, Math.sin(a + s) * 120, { kind: 'seed', r: 3 });
  }
  rest(t) { this.state = 'rest'; this.timer = t * (G.save.settings.assist ? 1.25 : 1); this.step = 3; this.vx = 0; AudioSys.sfx('stun'); }
  shoot(x, y, vx, vy, o = {}) { return this.lv.addEntity(new Shot(this.lv, x, y, vx, vy, Object.assign({ owner: this, color: this.D.col, life: 4, trail: true }, o))); }
  wave(dir) { this.lv.addEntity(new Shot(this.lv, this.x + this.w / 2 + dir * 6, this.arena.ground - 5, dir * 140, 0, { kind: 'wave', w: 12, h: 9, ground: true, reflect: false, owner: this, color: this.D.col, life: 3 })); }
  onHit(h) { if (this.state === 'wait' || this.state === 'intro') return false; const r = super.onHit(h); this.hpShowT = 0; return r; } // su vida va en la barra de arriba
  debug() {
    if (this.dead) return;
    const lv = this.lv;
    this.dead = true; this.hostile = false;
    for (const w of this.walls) w.dead = true;
    if (lv.miniFight === this) lv.miniFight = null;
    for (const e of lv.entities) if (e instanceof Shot && e.owner === this) e.dead = true;
    setFlag('mini_' + this.region);
    if (Object.keys(MINI).every(k => flag('mini_' + k))) achieve('minis');
    AudioSys.sfx('bossDown'); FX.flash('#FFFFFF', 0.35); FX.shake(3, 0.5);
    Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 40, { colors: [this.D.col, PAL.lime, PAL.white], min: 30, max: 140, type: 'bit', lmax: 1 });
    Particles.text(this.x + this.w / 2, this.y - 12, this.D.name + ' ¡depurado!', PAL.lime);
    G.save.forgeCores = (G.save.forgeCores || 0) + 1; addXP(30, 'Mini jefe depurado'); addMastery('debugging', 2);
    Toast.show('◆ +1 núcleo de forja · ' + this.D.name + ' depurado', PAL.orange, 4);
    for (let i = 0; i < 3; i++) lv.addEntity(new Pickup(lv, this.x + this.w / 2, this.y + this.h / 2, i === 0 && lv.player.cells < lv.player.maxCells ? 'cell' : 'orb'));
    lv.addEntity(new FreedCritter(lv, this.x + this.w / 2, this.y, 'bot', this.skin));
    Save.write();
  }
  draw(g, cx, cy) {
    if (this.state === 'wait' && !this.lv.onScreen(this, cx, cy)) return;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    // sombra en el suelo
    const A = this.arena; groundShadow(g, x + this.w / 2, A.ground - cy - 1, this.w * 0.8, 0.3);
    this.D.draw(this, g, x, y);
    if (this.state === 'tele') { const bob = Math.round(Math.sin(this.t * 25)); drawText(g, '!', x + this.w / 2, y - 14 + bob, PAL.coral, { align: 'center', outline: PAL.ink, scale: 2 }); }
    if (this.state === 'wait') { const bob = Math.round(Math.sin(this.t * 3) * 2); drawText(g, 'Zzz', x + this.w / 2 + 6, y - 10 + bob, '#8C93B8', { align: 'center' }); }
  }
  light() { return { x: this.x + this.w / 2, y: this.y + this.h / 2, r: 50, c: this.D.col, a: 0.6 }; }
  // con la Lente: su algoritmo, con la línea actual marcada
  lensInfo() { return [this.D.name].concat(this.D.code.map((l, i) => (i === this.step && this.state !== 'wait' ? '{y}▶ ' : '  ') + l + (i === this.step ? '{/}' : ''))); }
}

// barra de vida del mini jefe en el HUD
function drawMiniHUD(g, lv) {
  const m = lv.miniFight; if (!m || m.dead) return;
  const w = 170, x = Math.round(W / 2 - w / 2), y = 4;
  rect(g, x - 3, y - 2, w + 6, 20, 'rgba(10,14,32,0.72)');
  drawText(g, 'MINI JEFE', x, y, '#8C93B8', { shadow: PAL.ink });
  drawText(g, m.D.name, x + w, y, m.D.col, { align: 'right', shadow: PAL.ink });
  rect(g, x, y + 11, w, 5, '#10162B');
  rect(g, x + 1, y + 12, Math.round((w - 2) * Math.max(0, m.hp) / m.maxHp), 3, m.stunned ? PAL.sun : m.D.col);
  if (m.stunned) drawText(g, '¡DESCANSA: golpéalo!', W / 2, y + 19, PAL.sun, { align: 'center', outline: PAL.ink });
}

// busca un tramo llano y ancho hacia el 58 % de la isla para la pelea
function placeMiniBoss(lv) {
  const def = lv.def, region = lv.key;
  if (def.noHud || def.region !== region || !MINI[region] || flag('mini_' + region)) return;
  const solid = (x, y) => lv.tile(x, y) === '#', free = (x, y) => lv.tile(x, y) === '.';
  const sp = lv.spawn, avoid = [];
  for (const e of lv.entities) if (e instanceof NPC || e instanceof Exit || e instanceof Checkpoint || e instanceof CodeLock || (e.cfg && e.cfg.look === 'simkiosk')) avoid.push((e.x + e.w / 2) / TILE);
  // primero una zona amplia (14 casillas) hacia la mitad; si la isla no tiene, una más estrecha (10)
  let best = null;
  const want = lv.w * 0.58;
  for (const [len, lo, hi] of [[14, 0.3, 0.85], [11, 0.2, 0.9], [10, 0.15, 0.92]]) {
    let bd = 1e9;
    for (let y = 4; y < lv.h - 1; y++) {
      let run = 0;
      for (let x = 2; x < lv.w - 2; x++) {
        let ok = solid(x, y + 1);
        for (let dy = 0; dy < 4 && ok; dy++) if (!free(x, y - dy)) ok = false;
        run = ok ? run + 1 : 0;
        if (run < len) continue;
        const x0 = x - len + 1, mid = x0 + len / 2;
        if (mid < lv.w * lo || mid > lv.w * hi) continue;
        if (avoid.some(a => a > x0 - 2 && a < x + 2)) continue;
        if (Math.abs(mid - sp.x / TILE) < 16) continue;
        const d = Math.abs(mid - want);
        if (d < bd) { bd = d; best = { x0, x1: x, y }; }
      }
    }
    if (best) break;
  }
  if (!best) return;
  const ground = (best.y + 1) * TILE;
  const arena = { x0: best.x0 * TILE, x1: (best.x1 + 1) * TILE, ground, top: ground - 10 * TILE }; // barreras altas: ni con doble salto
  const D = MINI[region];
  const mb = new MiniBoss(lv, (best.x0 + best.x1) / 2 * TILE + 8 - D.w / 2, ground, region, arena);
  lv.addEntity(mb); lv.miniBoss = mb;
}
