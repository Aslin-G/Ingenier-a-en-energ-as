// =====================================================================
//  JEFES REGIONALES
//  Cada isla termina con un guardián corrompido por el apagón. Cada uno
//  EJECUTA UN ALGORITMO del concepto de su isla: con la Lente Debug se lee
//  su programa (línea actual resaltada) y se pueden predecir sus ataques.
//  A mitad de combate reescribe su código: un «parche» (pregunta rápida)
//  lo ralentiza. Al vencerlo se depura, se vuelve amistoso y deja un
//  fragmento de célula (3 fragmentos = +1 célula máxima).
// =====================================================================
const ARENA_FLOOR = 15 * TILE;           // parte superior del suelo de la arena
const ARENA_L = TILE, ARENA_R = 29 * TILE; // paredes interiores
const BOSSES = {};

class RegionBoss extends Entity {
  constructor(lv, x, y, cfg) {
    const D = BOSSES[cfg.key];
    super(lv, x, y, D.w, D.h);
    this.D = D; this.key = cfg.key; this.id = 'rboss'; lv.rboss = this;
    this.maxHp = this.hp = D.hp; this.shownHp = this.hp;
    this.home = { x, y: D.fly ? D.homeY : ARENA_FLOOR - D.h };
    this.patched = false; this.parts = [];
    this.resetState();
    this.state = 'wait'; this.hostile = false;
  }
  resetState() {
    this.x = this.home.x; this.y = this.home.y; this.vx = 0; this.vy = 0; this.face = -1;
    this.phase = 1; this.line = -1; this.gen = null; this.vars = {}; this.expr = 'n';
    this.flashT = 0; this.hurtCD = 0; this.stunned = false; this.tele = null; this.glitchT = 0;
    this.hp = this.maxHp; this.showBar = false;
    if (this.D.init) this.D.init(this);
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get p() { return this.lv.player; }
  begin() { this.state = 'fight'; this.hostile = true; this.showBar = true; this.gen = null; }
  // ritmo: la fase 2 acelera (menos si se aplicó el parche); la ayuda de combate ralentiza
  tempo() {
    let k = this.phase === 2 ? (this.patched === true ? 1.0 : this.patched === 'partial' ? 1.1 : 1.2) : 1;
    if (G.save.settings.assist) k *= 0.8;
    if (G.save.settings.noTimer) k *= 0.9;
    return k;
  }
  update(dt) {
    super.update(dt);
    this.flashT = Math.max(0, this.flashT - dt); this.hurtCD = Math.max(0, this.hurtCD - dt); this.glitchT = Math.max(0, this.glitchT - dt);
    this.shownHp = approach(this.shownHp, this.hp, dt * 6);
    if (this.D.idle) this.D.idle(this, dt);
    const lv = this.lv;
    if (this.state !== 'fight' || (Cut.active && !Cut.free) || lv.frozen) return;
    const sdt = dt * this.tempo();
    if (!this.gen) this.gen = this.D.ai(this);
    const r = this.gen.next(sdt);
    if (r.done) this.gen = null;
    if (this.D.tick) this.D.tick(this, sdt);
    // daño por contacto (no mientras está aturdido: es el momento de acercarse)
    if (!this.stunned) {
      const p = lv.player, boxes = this.D.hurtBoxes ? this.D.hurtBoxes(this) : [this.body()];
      for (const hb of boxes) if (hb && rectHit(p, hb)) { p.hurt(this); break; }
    }
  }
  body() { const m = this.D.inset || 3; return { x: this.x + m, y: this.y + m, w: this.w - m * 2, h: this.h - m }; }
  hitRect() { return this.D.hitRect ? this.D.hitRect(this) : this; }
  knockPlayer(p) { p.vx = (sign(p.cx - this.cx) || -this.face) * 170; p.vy = -170; }
  taunt(kind, force) {
    const L = this.D.lines && this.D.lines[kind]; if (!L) return;
    if (!force && Time.t < (this.tauntAt || 0)) return;
    this.tauntAt = Time.t + 3.2;
    Bark.say(this.D.barkTarget ? this.D.barkTarget(this) : this, choice(L), 2.2, PAL.ink);
  }
  // ---------- golpes ----------
  onHit(h) {
    if (this.state !== 'fight' || this.hurtCD > 0) return false;
    if (this.D.guard && this.D.guard(this, h)) return this.block(h);
    return this.damage(h);
  }
  block(h) {
    AudioSys.sfx('clang'); hitstop(this.lv, 0.04);
    Particles.burst(this.cx - (h.dir || 0) * this.w * 0.4, this.cy, 7, { colors: [PAL.white, PAL.sun], min: 30, max: 90, type: 'spark', lmax: 0.3 });
    if (this.D.armorHint && !this.armorHinted) { this.armorHinted = true; Bark.say('pix', this.D.armorHint, 4); }
    return 'block';
  }
  damage(h, extra = 0, part) {
    const dmg = (h.dmg || 1) + (h.crit ? 1 : 0) + extra;
    this.hp = Math.max(0, this.hp - dmg); this.flashT = 0.12; this.hurtCD = 0.08;
    if (part) part.flashT = 0.12;
    const px0 = part ? part.x + part.w / 2 : this.cx, py0 = part ? part.y + part.h / 2 : this.cy;
    Particles.burst(px0, py0, 10, { colors: [PAL.white, saberColor(this.lv), this.D.color], min: 40, max: 120, angle: (h.dir || 0) < 0 ? Math.PI : 0, spread: 1.2, type: 'spark', lmax: 0.35 });
    if (h.crit) { AudioSys.sfx('crit'); Particles.text(px0, py0 - 14, '¡CRÍTICO!', PAL.teal); } else AudioSys.sfx('hitE');
    hitstop(this.lv, 0.06);
    if (this.D.onHurt) this.D.onHurt(this, h);
    this.taunt('hurt');
    if (this.phase === 1 && this.hp <= this.maxHp / 2) { this.hp = Math.max(1, this.hp); this.phaseShift(); }
    else if (this.hp <= 0) this.defeat();
    return true;
  }
  clearSpawns() {
    for (const e of this.lv.entities) if (e.bossSpawn && !e.dead) { e.dead = true; if (e.x != null) Particles.burst(e.x + (e.w || 4) / 2, e.y + (e.h || 4) / 2, 4, { color: PAL.white, min: 10, max: 40, lmax: 0.3 }); }
  }
  phaseShift() {
    this.state = 'shift'; this.hostile = false; this.gen = null; this.stunned = false; this.tele = null;
    this.clearSpawns();
    if (this.D.onShift) this.D.onShift(this);
    const b = this; Cut.run(() => bossPhaseScene(b));
  }
  defeat() {
    this.state = 'dying'; this.hostile = false; this.gen = null; this.stunned = false; this.tele = null; this.showBar = false;
    this.clearSpawns(); this.dieT = 0;
    const b = this; Cut.run(() => bossDefeatScene(b));
  }
  // la jugadora cayó: el jefe vuelve a empezar (el parche ya aplicado se conserva)
  reset() {
    this.clearSpawns(); this.resetState(); this.state = 'wait'; this.hostile = false;
  }
  draw(g, cx, cy) {
    let x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (this.state === 'dying') {
      // fallo en cascada: el jefe parpadea, se desplaza a trozos y se deshace en bits
      this.dieT = (this.dieT || 0) + 1 / 60;
      x += randi(-2, 2); if (Math.random() < 0.4) return;
    }
    if (this.glitchT > 0) x += Math.random() < 0.5 ? randi(-3, 3) : 0;
    this.D.draw(this, g, x, y);
    if (this.glitchT > 0 && Math.random() < 0.5) rect(g, x, y + randi(0, this.h), this.w, 1, PAL.pink);
    if (this.stunned) for (let i = 0; i < 4; i++) { const a = this.t * 6 + i * 1.57; px(g, x + this.w / 2 + Math.cos(a) * 12, y - 4 + Math.sin(a) * 3, PAL.sun); }
    if (this.tele) {
      const bob = Math.round(Math.sin(this.t * 25));
      const tx = this.D.teleAt ? this.D.teleAt(this) : { x: this.cx, y: this.y };
      drawText(g, '!', Math.round(tx.x - cx), Math.round(tx.y - cy) - 12 + bob, this.tele.col || PAL.coral, { align: 'center', outline: PAL.ink, scale: 2 });
    }
  }
  light() { return { x: this.cx, y: this.cy, r: 80, c: this.D.color, a: 0.8 }; }
  lensInfo() { return null; }
}

// Partes golpeables de un jefe (cabezas, tentáculos, pilas del escudo)
class BossPart extends Entity {
  constructor(boss, idx, w, h) { super(boss.lv, boss.x, boss.y, w, h); this.boss = boss; this.idx = idx; this.hostile = false; this.flashT = 0; this.gone = false; }
  update(dt) { super.update(dt); this.flashT = Math.max(0, this.flashT - dt); this.hostile = this.boss.state === 'fight' && !this.gone; }
  onHit(h) { if (this.gone || this.boss.state !== 'fight' || this.boss.hurtCD > 0) return false; return this.boss.D.partHit(this.boss, this, h); }
  lensInfo() { return this.boss.D.partLens ? this.boss.D.partLens(this.boss, this) : null; }
}

// Peligros de jefe: rayos verticales, chorros horizontales y charcos de fuego (con aviso previo)
class BossHazard extends Entity {
  constructor(lv, r, o = {}) {
    super(lv, r.x, r.y, r.w, r.h); this.t = 0;
    this.o = o; this.warnT = o.warn == null ? 0.6 : o.warn; this.warnMax = this.warnT; this.actT = o.dur || 0.4; this.actMax = this.actT;
    this.kind = o.kind || 'column'; this.col = o.color || PAL.sun; this.bossSpawn = true; this.layer = 1;
  }
  update(dt) {
    super.update(dt);
    if (this.warnT > 0) { this.warnT -= dt; if (this.warnT <= 0) { AudioSys.sfx(this.o.sfx || (this.kind === 'fire' ? 'steam' : 'boom')); if (this.kind !== 'fire') FX.shake(2, 0.2); } return; }
    this.actT -= dt; if (this.actT <= 0) { this.dead = true; return; }
    const p = this.lv.player, m = this.kind === 'fire' ? 2 : 1;
    if (rectHit(p, { x: this.x + m, y: this.y + m, w: this.w - m * 2, h: this.h - m })) p.hurt(this);
    if (Math.random() < 0.5) Particles.spawn({ x: this.x + rand(0, this.w), y: this.y + rand(0, this.h), vx: rand(-20, 20), vy: rand(-40, 0), life: 0.3, type: 'fade', size: 2, color: this.col });
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), w = this.w, h = this.h;
    if (this.warnT > 0) {
      const blink = Math.floor(this.warnT * 12) % 2 === 0;
      g.globalAlpha = blink ? 0.75 : 0.35;
      if (this.kind === 'column') { pline(g, x, y, x, y + h, this.col, 3, Math.floor(this.t * 20)); pline(g, x + w - 1, y, x + w - 1, y + h, this.col, 3, Math.floor(this.t * 20)); }
      else if (this.kind === 'beam') { pline(g, x, y, x + w, y, this.col, 3, Math.floor(this.t * 20)); pline(g, x, y + h - 1, x + w, y + h - 1, this.col, 3, Math.floor(this.t * 20)); }
      else rect(g, x, y + h - 2, w, 2, this.col);
      g.globalAlpha = 1;
      return;
    }
    const k = this.actT / this.actMax;
    if (this.kind === 'column') {
      g.globalAlpha = 0.5; rect(g, x - 2, y, w + 4, h, this.col); g.globalAlpha = 1;
      rect(g, x, y, w, h, this.col); rect(g, x + Math.floor(w / 2) - 2, y, 4, h, '#FFFFFF');
      for (let yy = y; yy < y + h; yy += 6) px(g, x + randi(0, w - 1), yy, '#FFFFFF');
    } else if (this.kind === 'beam') {
      g.globalAlpha = 0.5; rect(g, x, y - 2, w, h + 4, this.col); g.globalAlpha = 1;
      rect(g, x, y, w, h, this.col); rect(g, x, y + Math.floor(h / 2) - 1, w, 2, '#FFFFFF');
      for (let xx = x; xx < x + w; xx += 5) px(g, xx + Math.floor(this.t * 90) % 5, y + randi(0, h - 1), '#FFFFFF');
    } else {
      // fuego: llamitas que suben
      for (let i = 0; i < w; i += 3) { const fh = 4 + Math.round(Math.abs(Math.sin(this.t * 12 + i)) * 6 * k); rect(g, x + i, y + h - fh, 3, fh, i % 2 ? '#FF6B4A' : PAL.sun); }
    }
  }
  light() { return this.warnT > 0 ? null : { x: this.x + this.w / 2, y: this.y + this.h / 2, r: 70, c: this.col }; }
}

// ---------- utilidades para los programas de los jefes (generadores: cada yield = un fotograma) ----------
function* bWait(b, t) { let e = 0; while (e < t) e += yield; }
function* bTele(b, t, col) { b.tele = { t, col }; AudioSys.sfx('warn'); let e = 0; while (e < t) e += yield; b.tele = null; }
function* bStun(b, t, text) {
  b.stunned = true; b.expr = 'dizzy'; AudioSys.sfx('stun');
  if (text) Particles.text(b.cx, b.y - 16, text, PAL.sun);
  let e = 0; while (e < t) e += yield;
  b.stunned = false; b.expr = 'n';
}
function* bMoveTo(b, x, y, speed) {
  for (; ;) {
    const dt = yield, dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy);
    if (d < 1.5) { b.x = x; b.y = y; return; }
    const s = Math.min(d, speed * dt); b.x += dx / d * s; b.y += dy / d * s;
    if (Math.abs(dx) > 2) b.face = sign(dx);
  }
}
function* bJumpTo(b, tx, peak, dur, o = {}) {
  const x0 = b.x, y0 = b.y, yEnd = ARENA_FLOOR - b.h;
  tx = clamp(tx, ARENA_L, ARENA_R - b.w); b.face = sign(tx - x0) || b.face; b.air = true;
  let e = 0;
  while (e < dur) { e += yield; const k = Math.min(1, e / dur); b.x = lerp(x0, tx, k); b.y = lerp(y0, yEnd, k) - Math.sin(k * Math.PI) * peak; }
  b.air = false; b.y = yEnd;
  AudioSys.sfx('land'); FX.shake(3, 0.3);
  Particles.burst(b.cx, ARENA_FLOOR, 14, { color: '#FFF3D7', min: 20, max: 80, angle: -Math.PI / 2, spread: 1.3, lmax: 0.5 });
  if (o.waves) { bWave(b, b.x + 4, -1, o.waveSpeed); bWave(b, b.x + b.w - 4, 1, o.waveSpeed); }
}
function bWave(b, x, dir, speed = 150) {
  return b.lv.addEntity(new Shot(b.lv, x, ARENA_FLOOR - 5, dir * speed, 0, { kind: 'wave', w: 14, h: 10, ground: true, reflect: false, owner: b, boss: true, color: b.D.waveColor || b.D.color, life: 4 }));
}
function bShot(b, x, y, vx, vy, o = {}) {
  return b.lv.addEntity(new Shot(b.lv, x, y, vx, vy, Object.assign({ owner: b, boss: true, color: b.D.color, trail: true }, o)));
}
function bAim(b, x, y, speed, spread = 0) {
  const p = b.lv.player, a = Math.atan2(p.y + 10 - y, p.cx - x) + spread;
  return [Math.cos(a) * speed, Math.sin(a) * speed];
}
// algo que cae desde arriba con aviso en el suelo
function bDrop(b, x, kind, o = {}) {
  return bShot(b, x, -10, 0, 0, Object.assign({ kind, grav: 430, warn: o.warn || 0.55, markY: ARENA_FLOOR, r: 4, life: 4, trail: false }, o));
}
// proyectil en parábola que cae cerca de un punto
function bLob(b, x, y, tx, o = {}) {
  const t = o.time || 1.0, g = o.grav || 420, vx = (tx - x) / t, vy = (ARENA_FLOOR - 6 - y - 0.5 * g * t * t) / t;
  return bShot(b, x, y, vx, vy, Object.assign({ grav: g, r: 4, life: 4 }, o));
}
function bHazard(b, r, o) { return b.lv.addEntity(new BossHazard(b.lv, r, Object.assign({ color: b.D.color }, o))); }
function bColumn(b, x, o = {}) { const w = o.w || 20; return bHazard(b, { x: x - w / 2, y: 0, w, h: ARENA_FLOOR }, Object.assign({ kind: 'column' }, o)); }
function bBeam(b, y, x0, x1, o = {}) { const h = o.h || 10; return bHazard(b, { x: x0, y: y - h / 2, w: x1 - x0, h }, Object.assign({ kind: 'beam', sfx: 'splash' }, o)); }
function bSummon(b, type, x, cfg = {}, max = 3) {
  const alive = b.lv.entities.filter(e => e.bossSpawn && e instanceof Enemy && !e.dead).length;
  if (alive >= max) return null;
  const e = makeEnemy(b.lv, x, ARENA_FLOOR - TILE, Object.assign({ type, gen: true }, cfg));
  e.bossSpawn = true; e.noticed = true; b.lv.addEntity(e);
  Particles.burst(e.x + e.w / 2, e.y + e.h / 2, 10, { colors: [b.D.color, PAL.white], min: 20, max: 60, type: 'bit' });
  return e;
}
// empuje de viento/succión sobre Lía
function bPush(b, dir, speed, dt) { const p = b.lv.player; if (!p.climbing) p.moveX(dir * speed * dt); }
// ojos grandes de jefe (expresivos)
function bossEyes(g, x, y, expr, s = 3, gap = 8, look = 0) {
  const K = '#1A1030', Wt = '#FFFFFF';
  for (const ex of [x, x + gap]) {
    if (expr === 'dizzy') { for (let i = 0; i < s; i++) { px(g, ex + i, y + i, K); px(g, ex + s - 1 - i, y + i, K); } continue; }
    if (expr === 'happy') { for (let i = 0; i < s; i++) px(g, ex + i, y + (i === 0 || i === s - 1 ? 1 : 0), K); continue; }
    if (expr === 'sad') { rect(g, ex, y + 1, s, s - 1, Wt); rect(g, ex + 1, y + 2, 1, s - 2, K); rect(g, ex, y, s, 1, K); continue; }
    rect(g, ex, y, s, s, Wt); rect(g, ex + clamp(1 + look, 0, s - 1), y + 1, 1, Math.max(1, s - 2), K);
    if (expr === 'wide') { rect(g, ex, y - 1, s, 1, Wt); }
  }
  if (expr === 'angry') { rect(g, x - 1, y - 2, 2, 1, K); rect(g, x + 1, y - 1, s - 1, 1, K); rect(g, x + gap + s - 1, y - 2, 2, 1, K); rect(g, x + gap, y - 1, s - 1, 1, K); }
}
// expresión de los diálogos → expresión del jefe
const BOSS_EXPR = { enojo: 'angry', feliz: 'happy', risa: 'happy', sorpresa: 'wide', triste: 'sad', pensando: 'n', decidida: 'angry', n: 'n' };
function bossPortrait(key, expr) {
  const D = BOSSES[key], c = makeCanvas(32, 32), g = c.g;
  rect(g, 0, 0, 32, 32, shade(D.color, -0.75));
  const e = BOSS_EXPR[expr] || 'n';
  const dummy = { t: 1, expr: e, friendly: expr === 'feliz' || expr === 'triste', face: -1, phase: 1, vars: {}, w: D.w, h: D.h, x: 0, y: 0, stunned: false, tele: null, portrait: true, parts: [], flashT: 0, D };
  if (D.initDummy) D.initDummy(dummy);
  const [fx, fy] = D.face || [D.w / 2, D.h / 3];
  D.draw(dummy, g, Math.round(16 - fx), Math.round(17 - fy));
  return c;
}

// ---------- HUD del jefe: nombre, vida con daño reciente y (con la Lente) su programa ----------
function drawBossHUD(g, lv, b) {
  const D = b.D, w = 200, x = Math.round(W / 2 - w / 2), y = 3;
  rect(g, x - 3, y - 2, w + 6, 22, 'rgba(10,14,32,0.72)');
  drawText(g, D.name, W / 2, y, D.color, { align: 'center', shadow: PAL.ink });
  if (b.phase === 2) drawText(g, 'FASE 2', x + w, y, PAL.coral, { align: 'right', shadow: PAL.ink });
  rect(g, x, y + 11, w, 6, '#10162B');
  const fw = Math.round((w - 2) * b.hp / b.maxHp), sw = Math.round((w - 2) * b.shownHp / b.maxHp);
  rect(g, x + 1, y + 12, sw, 4, '#FFFFFF');
  rect(g, x + 1, y + 12, fw, 4, b.phase === 2 ? PAL.coral : D.color);
  rect(g, x + 1, y + 12, fw, 1, 'rgba(255,255,255,0.5)');
  rect(g, x + w / 2, y + 10, 1, 8, PAL.cream);
  if (hasAbility('lens') && lv.lensT < 0.05 && b.state === 'fight') drawText(g, bindName('lens') + ': ver su código', W / 2, y + 20, '#8C93B8', { align: 'center', shadow: PAL.ink });
  // programa del jefe con la línea actual resaltada
  b.codeRect = null;
  if (lv.lensT > 0.05 && D.code) {
    const lines = D.code(b), vars = D.vars ? D.vars(b) : [];
    const lw = Math.max(...lines.map(l => textW(l)), ...vars.map(v => textW(v))) + 20;
    const ph = (lines.length + vars.length) * 10 + (vars.length ? 18 : 14);
    // el panel se coloca en el lado contrario al jefe para no taparlo
    if (b.panelSide == null) b.panelSide = -1;
    if (b.cx < W * 0.42) b.panelSide = 1; else if (b.cx > W * 0.58) b.panelSide = -1;
    const px0 = b.panelSide < 0 ? 4 : W - lw - 4, py0 = 26;
    b.codeRect = { x: px0, y: py0, w: lw, h: ph };
    g.globalAlpha = lv.lensT;
    panel(g, px0, py0, lw, ph, { border: PAL.teal, bg: 'rgba(5,30,40,0.9)' });
    drawText(g, 'PROGRAMA', px0 + 5, py0 + 3, PAL.teal);
    lines.forEach((l, i) => {
      const cur = i === b.line;
      const ly = py0 + 14 + i * 10;
      if (cur) rect(g, px0 + 2, ly - 1, lw - 4, 10, 'rgba(255,216,74,0.2)');
      const arrow = l.indexOf('←');
      if (arrow >= 0) { drawText(g, (cur ? '▶' : ' ') + l.slice(0, arrow), px0 + 4, ly, cur ? PAL.sun : PAL.mint); drawText(g, l.slice(arrow), px0 + 4 + textW((cur ? '▶' : ' ') + l.slice(0, arrow)), ly, PAL.coral); }
      else drawText(g, (cur ? '▶' : ' ') + l, px0 + 4, ly, cur ? PAL.sun : PAL.mint);
    });
    vars.forEach((v, i) => drawText(g, v, px0 + 6, py0 + 18 + (lines.length + i) * 10, PAL.lilac));
    g.globalAlpha = 1;
  }
}

// ---------- Escenas: puerta del jefe, presentación, cambio de fase, derrota, reintento ----------
function* bossGate(lv, key) {
  const D = BOSSES[key];
  AudioSys.stopSong(); AudioSys.sfx('roar'); FX.shake(3, 0.8);
  lv.lumi.mood = 'fear'; lv.lumi.moodT = 3;
  yield C.wait(0.7);
  yield* talk(D.gate ? D.gate() : [['pix', '¡Espera! Algo enorme bloquea la salida...', 'sorpresa']]);
  Game.startLevel('jefe_' + key);
}
function* bossIntro(lv) {
  const b = lv.rboss; if (!b) return;
  lv.banner = 0; // la presentación ya muestra el nombre del jefe
  const D = b.D, beaten = flag('boss_' + b.key);
  if (beaten && !G.bossRematch) {
    b.state = 'friend'; b.friendly = true; b.expr = 'happy';
    const r = yield C.ask('pix', D.name + ' ya está depurado. ¿Una revancha de entrenamiento?', ['¡Sí, revancha!', 'Volver al mapa']);
    if (r !== 0) { Game.toMap(b.key); return; }
    G.bossRematch = b.key; b.friendly = false; b.state = 'wait'; b.expr = 'n';
  }
  AudioSys.playSong('boss');
  yield C.wait(0.5);
  AudioSys.sfx('roar'); FX.shake(2, 0.6); b.expr = 'angry'; b.glitchT = 0.6;
  yield C.title(D.name, D.title, 2.4, D.color);
  if (!flag('bossIntro_' + b.key) || G.autoDialog) { yield* talk(D.intro()); setFlag('bossIntro_' + b.key); }
  else yield* talk([[D.speaker, choice(D.lines.retry || D.lines.hitLia || ['¡Otra vez tú!']), 'enojo']]);
  if (!flag('bossHowTo')) { setFlag('bossHowTo'); yield C.say('pix', 'Truco: con la Lente (' + bindName('lens') + ') ves su PROGRAMA y la línea que está ejecutando. ¡Así sabrás qué hará después!', 'n'); }
  b.expr = 'n';
  if (!flag('saberIntro')) { setFlag('saberIntro'); yield* saberIntro(lv); }
  b.begin();
}
function* bossPhaseScene(b) {
  const D = b.D;
  AudioSys.sfx('roar'); FX.shake(3, 0.6); FX.flash(D.color, 0.35); b.glitchT = 1.2; b.expr = 'angry';
  yield C.wait(0.9);
  yield* talk(D.phase2());
  if (b.patched === false) {
    yield C.say('pix', '¡Aprovecha mientras se reinicia! Si arreglamos su nuevo código, irá más lento. ¡Rápido, el PARCHE!', 'decidida');
    const r = yield puzzle(Object.assign({ kind: 'quiz', label: 'PARCHE', music: 'boss', title: D.name, tags: D.tags, concepts: D.concepts, codex: D.codex }, D.patch));
    b.patched = r && r.success ? (r.fails ? 'partial' : true) : 'none';
    AudioSys.playSong('boss');
    if (b.patched === true) yield C.say('pix', '¡PARCHE APLICADO! Su nuevo programa corre más despacio.', 'feliz');
    else if (b.patched === 'partial') yield C.say('pix', 'Parche aplicado... a medias. Irá un poco más rápido. ¡Tú puedes!', 'n');
    else yield C.say('pix', 'Sin parche: su código va a toda velocidad. ¡Esquiva y espera su descanso!', 'sorpresa');
  }
  b.phase = 2; b.state = 'fight'; b.hostile = true; b.gen = null; b.line = -1; b.expr = 'n';
  if (D.onPhase2) D.onPhase2(b);
}
function* bossDefeatScene(b) {
  const D = b.D, lv = b.lv, key = b.key, rematch = G.bossRematch === key;
  AudioSys.stopSong(); AudioSys.sfx('bossDown'); FX.shake(4, 1.2); FX.flash('#FFFFFF', 0.6);
  for (let i = 0; i < 70; i++) Particles.spawn({ x: b.cx + rand(-b.w / 2, b.w / 2), y: b.cy + rand(-b.h / 2, b.h / 2), vx: rand(-120, 120), vy: rand(-170, 20), grav: 220, life: rand(0.6, 1.5), type: 'bit', color: choice([D.color, PAL.lime, PAL.white]) });
  yield C.wait(1.6);
  b.state = 'friend'; b.friendly = true; b.expr = 'happy'; b.glitchT = 0;
  if (D.onFriend) D.onFriend(b);
  AudioSys.sfx('restore'); FX.flash(PAL.sun, 0.4);
  lv.lumi.mood = 'happy'; lv.lumi.moodT = 5; lv.player.celebrateT = 1.4;
  yield C.wait(0.8);
  AudioSys.playSong(THEMES[key] ? THEMES[key].music : 'map');
  yield* talk(D.outro());
  if (rematch) {
    G.bossRematch = null; addXP(20, 'Revancha ganada');
  } else {
    setFlag('boss_' + key); unlockCodex('b_' + key); addMastery(D.concepts || [], 6);
    addXP(80, D.name + ' depurado');
    G.save.cellShards = (G.save.cellShards || 0) + 1;
    const s = G.save.cellShards;
    if (s % 3 === 0) { lv.player.refreshCells(); lv.player.cells = lv.player.maxCells; AudioSys.sfx('fanfare'); yield C.title('¡NUEVA CÉLULA DE LUZ!', '3 fragmentos de célula = +1 célula máxima', 3, PAL.sun); }
    else { AudioSys.sfx('chispa'); yield C.title('FRAGMENTO DE CÉLULA ' + (s % 3) + '/3', 'Con 3 fragmentos, Lía gana una célula más', 2.6, PAL.sun); }
    G.save.bossTries[key] = 0;
    const done = Object.keys(BOSSES).filter(k => flag('boss_' + k)).length;
    if (done >= Object.keys(BOSSES).length) achieve('bosses');
  }
  Save.write();
  yield C.wait(0.4);
  Game.toMap(key);
}
function* bossRetry(lv) {
  const b = lv.rboss; if (!b || b.state === 'friend') return;
  b.reset();
  const tries = G.save.bossTries[b.key] = (G.save.bossTries[b.key] || 0) + 1;
  Save.write();
  if (tries >= 2 && !G.save.settings.assist && !lv.assistAsked) {
    lv.assistAsked = true;
    const r = yield C.ask('pix', '¿Activamos la AYUDA DE COMBATE? Tendrás +2 células y el jefe irá más lento. (Se puede quitar en Ajustes.)', ['Sí, actívala', 'No, lo intento así']);
    if (r === 0) { G.save.settings.assist = true; Save.writeSettings(); lv.player.refreshCells(); lv.player.cells = lv.player.maxCells; Toast.show('Ayuda de combate activada', PAL.lime, 2.5); }
  } else yield C.say('pix', choice(['Otra vez. Ahora ya conoces su programa.', 'Respira. Mira su código con la Lente y busca su descanso.', 'Cada intento es una prueba: ¡depurar también es fallar y ajustar!']), 'decidida');
  b.begin();
}

// ---------- Construcción de las arenas ----------
function bossArena(key, D) {
  const b = new MapB(30, 17);
  b.fill(0, 0, 0, 16, '#').fill(29, 0, 29, 16, '#').fill(0, 15, 29, 16, '#');
  (D.plats || [[3, 7, 12], [22, 26, 12], [12, 17, 9]]).forEach(([x0, x1, y]) => b.plat(x0, x1, y));
  b.start(3, 14);
  b.e('R', D.bx || 21, 13, { key });
  (D.lamps || [2, 27]).forEach(x => b.e('L', x, 14));
  level('jefe_' + key, {
    theme: key, region: key, title: D.name, subtitle: D.title, music: 'boss', ambient: 'none', noFoes: true, arena: true, forceDark: D.dark != null ? D.dark : 0.12,
    quips: null,
    objective: lv => lv.rboss && (lv.rboss.state === 'fight' || lv.rboss.state === 'shift') ? 'Depura ' + D.short : '',
    hint: lv => D.hint,
    extraDraw: D.arenaDraw || null,
    onEnter: lv => bossIntro(lv)
  }, b);
}

// =====================================================================
//  1 · PUERTO: CAPITÁN CORTOCIRCUITO (secuencias)
//  Una grúa del muelle con sombrero de capitán. Narra cada paso de su
//  secuencia: ancla, salto, cañón... y descanso (el momento de golpear).
// =====================================================================
function* puertoAnchor(b) {
  const a = bShot(b, b.cx + b.face * 12, ARENA_FLOOR - 7, b.face * 200, 0, { kind: 'anchor', r: 6, ground: true, boomerang: 0.95, reflect: false, unbreakable: true, pierce: true, life: 5, trail: false, color: '#C9D2F0' });
  AudioSys.sfx('dash');
  let e = 0; while (!a.dead && e < 3) e += yield;
  if (!a.dead) a.dead = true;
}
BOSSES.puerto = {
  key: 'puerto', name: 'CAPITÁN CORTOCIRCUITO', short: 'al Capitán Cortocircuito', title: 'Guardián del muelle · Secuencias', speaker: 'boss_puerto',
  color: '#FF9D42', waveColor: '#9FE8FF', w: 26, h: 30, hp: 20, bx: 22, face: [13, 12],
  tags: ['SECUENCIA'], concepts: ['sequence', 'debugging'], codex: 'secuencia',
  hint: 'Siempre la misma secuencia: salta el ancla, esquiva su salto, devuelve las chispas del cañón con el sable... y golpéalo mientras RECARGA.',
  lines: { hurt: ['¡Mi casco!', '¡Arr! ¡Eso no estaba en la secuencia!', '¡Motín! ¡MOTÍN!'], hitLia: ['¡Paso completado!'], retry: ['¡ARR! ¡La secuencia vuelve a empezar, grumete!'] },
  gate: () => [['pix', '¡Lía! La vieja grúa del muelle... ¡se está moviendo sola!', 'sorpresa'], ['lia', 'Y lleva un sombrero de capitán. Eso no puede ser bueno.', 'pensando']],
  intro: () => [
    ['boss_puerto', '¡ARR! ¡Alto ahí, grumete! Soy el CAPITÁN CORTOCIRCUITO, y este muelle sigue MI secuencia.', 'enojo'],
    ['pix', 'Es la grúa del puerto. El apagón le cruzó los cables.', 'sorpresa'],
    ['boss_puerto', 'Paso uno: lanzar el ancla. Paso dos: saltar. Paso tres: ¡fuego! Paso cuatro: ...recargar un poquito.', 'n'],
    ['lia', '¿Nos acaba de contar todo su plan?', 'pensando'],
    ['pix', 'Es una SECUENCIA: siempre el mismo orden. Si sabes el paso, sabes qué viene después.', 'risa']
  ],
  phase2: () => [['boss_puerto', '¡Basta! ¡Nueva secuencia: MÁS ANCLAS, MÁS CAÑÓN, MENOS DESCANSO!', 'enojo'], ['pix', '¡Reescribió su código!', 'sorpresa']],
  outro: () => [
    ['boss_puerto', 'Glup... mi secuencia tenía un paso de más: "hundir el muelle". Quítenlo, por favor.', 'triste'],
    ['lia', 'Hecho. Ahora solo tienes: amarrar, cargar, zarpar.', 'feliz'],
    ['boss_puerto', '¡ARR! ¡Capitán CIRCUITO a sus órdenes! Vigilaré el faro... en orden.', 'feliz'],
    ['pix', 'Otro bicho depurado. Y esta vez con sombrero.', 'risa']
  ],
  patch: {
    question: 'El Capitán quiere disparar con esta secuencia nueva. ¿Qué parche la arregla?',
    code: ['1  disparar()', '2  apuntar()', '3  cargar_cañón()'],
    options: [{ text: 'cargar_cañón, apuntar, disparar' }, { text: 'disparar, disparar, disparar', why: 'Repetir el disparo no arregla el orden: sigue disparando sin cargar.' }, { text: 'apuntar, disparar, cargar_cañón', why: 'Todavía dispara antes de cargar. En una secuencia, el orden importa.' }],
    answer: 0, explain: '¡Eso es! Primero cargar, luego apuntar y al final disparar. Con el orden corregido, su cañón pierde potencia.'
  },
  code: b => b.phase === 1
    ? ['REPETIR SIEMPRE:', '  lanzar_ancla()', '  saltar_al_otro_lado()', '  cañón(3)', '  recargar()   ← ¡golpea!']
    : ['REPETIR SIEMPRE:', '  lanzar_ancla() ×2', '  saltar_sobre(Lía)', '  cañón(' + (b.patched === true ? 3 : 5) + ')', '  recargar()   ← ¡golpea!'],
  vars: b => ['paso = ' + clamp(b.line, 1, 4) + ' de 4'],
  idle(b, dt) { b.recoil = Math.max(0, (b.recoil || 0) - dt); if (!b.friendly && b.state === 'fight' && Math.random() < 0.04) Particles.spawn({ x: b.x + rand(0, b.w), y: b.y + rand(4, 20), vx: rand(-30, 30), vy: rand(-40, -10), life: 0.3, type: 'spark', color: PAL.sun }); },
  *ai(b) {
    const p = b.lv.player;
    b.line = 1; b.face = sign(p.cx - b.cx) || -1; b.expr = 'angry';
    yield* bTele(b, 0.5);
    yield* puertoAnchor(b);
    if (b.phase === 2) { yield* bWait(b, 0.2); b.face = sign(p.cx - b.cx) || b.face; yield* puertoAnchor(b); }
    b.line = 2; b.expr = 'n';
    yield* bWait(b, 0.25);
    const tx = b.phase === 2 ? p.cx - b.w / 2 : (b.cx > W / 2 ? ARENA_L + 24 : ARENA_R - b.w - 24);
    yield* bTele(b, 0.3);
    yield* bJumpTo(b, tx, 95, 0.85, { waves: b.phase === 2, waveSpeed: 140 });
    b.line = 3; b.expr = 'angry';
    const n = b.phase === 2 && b.patched !== true ? 5 : 3;
    for (let i = 0; i < n; i++) {
      yield* bWait(b, 0.42);
      b.face = sign(p.cx - b.cx) || b.face;
      const ox = b.cx + b.face * 15, oy = b.y + 17, [vx, vy] = bAim(b, ox, oy, 115);
      bShot(b, ox, oy, vx, vy, { kind: 'spark', r: 3, color: PAL.orange, life: 4 }); AudioSys.sfx('shot'); b.recoil = 0.12;
    }
    yield* bWait(b, 0.3);
    b.line = 4; b.expr = 'n';
    b.taunt('rest', true);
    yield* bStun(b, b.phase === 2 ? 1.7 : 2.1, '¡recargando!');
  },
  draw(b, g, x, y) {
    const f = b.face, fr = b.friendly, t = b.t;
    const body = fr ? '#6FA0E0' : '#5A7AA8', bodyD = shade(body, -0.3);
    // piernas
    const lift = b.air ? 2 : 0;
    rect(g, x + 5, y + 24 - lift, 6, 6, OUTLINE); rect(g, x + 15, y + 24 - lift, 6, 6, OUTLINE);
    rect(g, x + 6, y + 24 - lift, 4, 5, '#3A4068'); rect(g, x + 16, y + 24 - lift, 4, 5, '#3A4068');
    // cuerpo-barril
    pellipse(g, x + 13, y + 18, 13, 9, OUTLINE); pellipse(g, x + 13, y + 18, 12, 8, body);
    rect(g, x + 2, y + 21, 22, 2, bodyD); rect(g, x + 5, y + 12, 6, 1, shade(body, 0.35));
    for (const [rx, ry] of [[4, 17], [22, 17], [8, 24], [18, 24]]) px(g, x + rx, y + ry, '#C9D2F0');
    if (!fr) { px(g, x + 6, y + 20, '#C8612E'); px(g, x + 19, y + 15, '#C8612E'); px(g, x + 20, y + 16, '#C8612E'); }
    // brazo-cañón (delante) y brazo del ancla (detrás)
    const cX = f > 0 ? x + 23 : x - 4;
    rect(g, cX, y + 15, 7, 6, OUTLINE); rect(g, cX + 1, y + 16, 5, 4, '#3A4068'); rect(g, f > 0 ? cX + 5 : cX, y + 16, 1, 4, '#22306B');
    if (b.recoil > 0) { pcircle(g, f > 0 ? cX + 8 : cX - 2, y + 18, 3, PAL.sun); px(g, f > 0 ? cX + 8 : cX - 2, y + 18, '#FFFFFF'); }
    const aX = f > 0 ? x - 3 : x + 24;
    rect(g, aX, y + 16, 5, 7, OUTLINE); rect(g, aX + 1, y + 17, 3, 5, body);
    // ojo-monóculo que sigue a Lía
    const look = b.lv ? clamp(Math.round((b.lv.player.cx - b.cx) / 50), -1, 1) : f;
    const ex = x + 13 + f * 2, ey = y + 13;
    pcircle(g, ex, ey, 5, OUTLINE); pcircle(g, ex, ey, 4, '#FFFFFF');
    if (b.expr === 'dizzy' || b.stunned) { pline(g, ex - 2, ey - 2, ex + 2, ey + 2, OUTLINE); pline(g, ex - 2, ey + 2, ex + 2, ey - 2, OUTLINE); }
    else if (b.expr === 'happy') { pline(g, ex - 3, ey + 1, ex, ey - 1, OUTLINE); pline(g, ex, ey - 1, ex + 3, ey + 1, OUTLINE); }
    else { pcircle(g, ex + look, ey, 2, fr ? PAL.teal : PAL.sun); px(g, ex + look, ey, OUTLINE); }
    if (b.expr === 'angry') rect(g, ex - 4, ey - 6, 8, 1, OUTLINE);
    // bigote de cables
    rect(g, x + 7, y + 19, 12, 2, fr ? PAL.sun : '#FF9D42'); px(g, x + 6, y + 18, '#FF9D42'); px(g, x + 19, y + 18, '#FF9D42');
    // sombrero de capitán con ancla
    rect(g, x + 1, y + 6, 24, 3, OUTLINE); rect(g, x + 2, y + 6, 22, 2, '#163A73');
    rect(g, x + 5, y - 1, 16, 8, OUTLINE); rect(g, x + 6, y, 14, 6, '#163A73'); rect(g, x + 6, y + 5, 14, 1, PAL.sun);
    rect(g, x + 12, y + 1, 1, 3, PAL.sun); rect(g, x + 11, y + 3, 3, 1, PAL.sun); px(g, x + 12, y + 1, '#FFFFFF');
    if (b.stunned && Math.random() < 0.3) Particles.spawn({ x: (b.x || 0) + 13, y: (b.y || 0), vy: -20, vx: rand(-8, 8), life: 0.6, type: 'fade', size: 2, color: 'rgba(255,255,255,0.7)' });
  }
};

// =====================================================================
//  2 · VALLE: GRAN BUGGLIN REY (depuración)
//  Un escarabajo enorme con corona glitch. Rueda hasta chocar (panza
//  arriba = vulnerable). En la fase 2 intercambia dos líneas de su código.
// =====================================================================
BOSSES.valle = {
  key: 'valle', name: 'GRAN BUGGLIN REY', short: 'al Gran Bugglin Rey', title: 'Soberano del desorden · Depuración', speaker: 'boss_valle',
  color: '#9B76FF', waveColor: '#B6F35B', w: 32, h: 20, hp: 22, bx: 21, face: [29, 10], inset: 2,
  tags: ['DEPURACIÓN', 'SECUENCIA'], concepts: ['debugging', 'sequence'], codex: 'depuracion',
  hint: 'Cuando rueda es un caparazón: salta por encima o súbete a una plataforma. Al chocar contra la pared queda PANZA ARRIBA: ¡golpéalo!',
  armorHint: '¡Mientras rueda es puro caparazón! Espera a que choque y quede panza arriba.',
  lines: { hurt: ['¡Lesa majestad!', '¡Mi corona!', '¡Guardias! ¡GUARDIAS!'], summon: ['¡Súbditos, a mí!', '¡Bugglins reales!'], retry: ['¡El rey nunca pierde! ...casi nunca.'] },
  gate: () => [['pix', '¡Algo retumba bajo el puente! ¿Un... escarabajo con corona?', 'sorpresa'], ['lia', 'El que desordenó a los robots de riego. Vamos a depurarlo.', 'decidida']],
  intro: () => [
    ['boss_valle', '¡ARRODILLAOS! Soy el GRAN BUGGLIN REY, soberano del desorden.', 'enojo'],
    ['boss_valle', 'Mi decreto real: regar ANTES de plantar. Cosechar ANTES de regar. ¡Todo al revés!', 'risa'],
    ['lia', 'Así que fuiste tú quien desordenó los robots.', 'enojo'],
    ['pix', 'Rueda siempre hasta la pared. Si choca, queda panza arriba: ¡ahí es vulnerable!', 'n']
  ],
  phase2: () => [['boss_valle', '¡Reordeno mis tareas... como a MÍ me dé la gana!', 'enojo'], ['pix', 'Mira su código con la Lente: ¡cambió dos líneas de sitio!', 'sorpresa']],
  outro: () => [
    ['boss_valle', 'Está bien, está bien... Ordenaré mis tareas. Primero: pedir perdón.', 'triste'],
    ['boss_valle', 'Perdón. Segundo: plantar. Tercero: regar. ¿Lo hago bien?', 'feliz'],
    ['lia', '¡Perfecto, Majestad!', 'risa'],
    ['pix', 'Un rey que acepta un parche. Eso sí es noticia.', 'feliz']
  ],
  patch: {
    question: 'El Rey intercambió dos líneas y ahora se tropieza: intenta aplastar antes de saltar. ¿Cómo se depura?',
    code: ['1  aplastar()', '2  saltar()', '3  caer()'],
    options: [{ text: 'Intercambiar las líneas 1 y 2: saltar, aplastar, caer' }, { text: 'Borrar la línea 3', why: 'Borrar pasos al azar no depura: el problema es el ORDEN de 1 y 2.' }, { text: 'Repetir la línea 1 dos veces', why: 'Repetir el paso equivocado solo repite el error.' }],
    answer: 0, explain: 'Depurar es encontrar QUÉ está fuera de lugar y corregir solo eso. Sin tropiezos, se cansa antes.'
  },
  code: b => b.phase === 1
    ? ['MIENTRAS corona > 0:', '  rodar(hacia Lía)', '  panza_arriba()  ← ¡golpea!', '  aplastar(Lía.x)', '  invocar(bugglins, 2)']
    : ['MIENTRAS corona > 0:', '  aplastar(Lía.x)', '  rodar(hacia Lía) ×2', '  panza_arriba()  ← ¡golpea!', '  invocar(bugglins, ' + (b.patched === true ? 2 : 3) + ')'],
  vars: b => ['corona = ' + b.hp + ' bits'],
  init(b) { b.spin = 0; b.rolling = false; b.flipped = false; },
  guard: (b, h) => b.rolling && h.src !== 'reflect',
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    const roll = function* (times) {
      for (let r = 0; r < times; r++) {
        b.line = P2 ? 2 : 1; b.face = sign(p.cx - b.cx) || b.face; b.expr = 'angry';
        yield* bTele(b, 0.6); b.rolling = true; AudioSys.sfx('dash');
        for (; ;) {
          const dt = yield; b.x += b.face * 175 * dt; b.spin += b.face * dt * 14;
          if (Math.random() < 0.5) Particles.spawn({ x: b.cx - b.face * 12, y: ARENA_FLOOR - 2, vx: -b.face * rand(20, 60), vy: -rand(10, 40), life: 0.4, type: 'fade', size: 2, color: '#FFF3D7' });
          if (b.x <= ARENA_L || b.x + b.w >= ARENA_R) { b.x = clamp(b.x, ARENA_L, ARENA_R - b.w); break; }
        }
        b.rolling = false; FX.shake(3, 0.3); AudioSys.sfx('bonk');
        Particles.burst(b.face > 0 ? ARENA_R : ARENA_L, ARENA_FLOOR - 12, 10, { color: '#C9B2FF', min: 30, max: 90 });
        if (r < times - 1) { b.face = -b.face; yield* bWait(b, 0.25); }
      }
      b.line = P2 ? 3 : 2; b.flipped = true; b.face = -b.face;
      yield* bStun(b, P2 ? 1.5 : 1.9, '¡panza arriba!');
      b.flipped = false;
    };
    const slam = function* () {
      b.line = P2 ? 1 : 3; b.expr = 'angry';
      yield* bTele(b, 0.55);
      yield* bJumpTo(b, p.cx - b.w / 2, 110, 0.9, { waves: true, waveSpeed: 130 });
    };
    if (!P2) { yield* roll(1); yield* slam(); }
    else { yield* slam(); yield* roll(2); }
    b.line = 4; b.expr = 'happy'; b.taunt('summon', true);
    yield* bTele(b, 0.45, PAL.violet);
    const n = P2 && b.patched !== true ? 3 : 2;
    for (let i = 0; i < n; i++) { bSummon(b, 'bugglin', clamp(b.cx + (i % 2 ? 1 : -1) * (24 + i * 10) - 8, ARENA_L + 8, ARENA_R - 24), { speed: 22 }, P2 ? 3 : 2); yield* bWait(b, 0.2); }
    yield* bWait(b, 0.8);
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t, f = b.face;
    const shell = fr ? '#FF6B6B' : '#9B76FF', shellD = fr ? '#B8334A' : '#5B3A8C', spot = fr ? '#1A1030' : '#B6F35B';
    const crown = (hx, hy) => {
      rect(g, hx - 1, hy - 1, 10, 5, OUTLINE); rect(g, hx, hy, 8, 3, PAL.sun);
      for (let k = 0; k < 3; k++) { rect(g, hx + k * 3, hy - 3, 2, 3, OUTLINE); px(g, hx + k * 3, hy - 2, PAL.sun); }
      if (!fr && Math.floor(t * 8) % 3 === 0) rect(g, hx + randi(0, 6), hy, 2, 1, shellD); // bits que faltan
      px(g, hx + 4, hy + 1, PAL.coral);
    };
    if (b.rolling) {
      const c0 = x + 16, c1 = y + 10;
      pcircle(g, c0, c1, 11, OUTLINE); pcircle(g, c0, c1, 10, shell);
      for (let k = 0; k < 4; k++) { const a = b.spin + k * 1.57; pcircle(g, c0 + Math.cos(a) * 6, c1 + Math.sin(a) * 6, 2, spot); }
      pline(g, c0 + Math.cos(b.spin) * 10, c1 + Math.sin(b.spin) * 10, c0 - Math.cos(b.spin) * 10, c1 - Math.sin(b.spin) * 10, shellD);
      return;
    }
    if (b.flipped) {
      pellipse(g, x + 16, y + 13, 15, 7, OUTLINE); pellipse(g, x + 16, y + 13, 14, 6, fr ? '#FFB0B0' : '#C9B2FF');
      for (let k = 0; k < 4; k++) rect(g, x + 7 + k * 5, y + 10, 1, 6, fr ? '#FF8A8A' : '#9B86D8');
      for (let i = 0; i < 6; i++) { const lx = x + 5 + i * 4, wig = Math.round(Math.sin(t * 22 + i) * 2); pline(g, lx, y + 8, lx + wig, y + 2, OUTLINE); }
      const hx = f > 0 ? x + 27 : x - 4;
      pcircle(g, hx + 4, y + 14, 5, OUTLINE); pcircle(g, hx + 4, y + 14, 4, shellD);
      bossEyes(g, hx + 1, y + 13, 'dizzy', 2, 4);
      crown(hx, y + 19);
      return;
    }
    // patas
    for (let i = 0; i < 3; i++) { const lx = x + 6 + i * 9, ph = b.air ? 0 : Math.round(Math.sin(t * 10 + i * 2) * 1.5); rect(g, lx + ph, y + 15, 2, 5, OUTLINE); rect(g, lx + 4 - ph, y + 15, 2, 5, OUTLINE); }
    // caparazón
    pellipse(g, x + 16, y + 10, 15, 8, OUTLINE); pellipse(g, x + 16, y + 10, 14, 7, shell);
    rect(g, x + 16, y + 3, 1, 13, shellD);
    for (const [sx, sy, r] of [[9, 8, 2], [23, 8, 2], [12, 13, 1], [21, 13, 1]]) pcircle(g, x + sx, y + sy, r, spot);
    rect(g, x + 7, y + 5, 5, 1, shade(shell, 0.4));
    // cabeza hacia donde mira
    const hx = f > 0 ? x + 26 : x - 4;
    pcircle(g, hx + 4, y + 11, 6, OUTLINE); pcircle(g, hx + 4, y + 11, 5, shellD);
    const mx = f > 0 ? hx + 9 : hx - 1; px(g, mx, y + 13, '#FFF3D7'); px(g, mx + f, y + 14, '#FFF3D7'); px(g, mx, y + 15, '#FFF3D7');
    bossEyes(g, hx + 1, y + 9, b.expr, 2, 4, f);
    crown(hx, y + 2);
  }
};

// =====================================================================
//  3 · SOLARIA: DON NUBARRÓN (condicionales SI / SINO)
//  Una nube diva con gafas de sol. SI Lía está debajo → rayo; SINO →
//  granizo (que se devuelve con el sable). Sin carga, baja a recargar.
// =====================================================================
BOSSES.solaria = {
  key: 'solaria', name: 'DON NUBARRÓN', short: 'a Don Nubarrón', title: 'La nube más dramática · Condiciones', speaker: 'boss_solaria',
  color: '#FFD84A', w: 44, h: 26, hp: 20, fly: true, homeY: 44, bx: 12, face: [22, 13], inset: 5,
  tags: ['SI / SINO', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'condicional',
  plats: [[3, 7, 12], [22, 26, 12], [12, 17, 9]],
  hint: 'SI estás debajo, rayo; SINO, granizo. Devuelve el granizo con el sable (vuelve hacia la nube) y golpéala cuando baje a recargar. Desde la plataforma alta también llegas.',
  lines: { hurt: ['¡Mi peinado!', '¡Nadie toca a una nube!', '¡Uy, eso fue un trueno interno!'], retry: ['¡Pronóstico: otra tormenta!'] },
  gate: () => [['pix', 'Lía... el cielo se está nublando. Solo encima de nosotras.', 'sorpresa'], ['lia', 'Una nube con gafas de sol. Claro. ¿Por qué no?', 'pensando']],
  intro: () => [
    ['boss_solaria', '¡Sol, sol, SOL! Todo el mundo ama al sol. ¿Y a mí? ¡Nadie me mira!', 'enojo'],
    ['boss_solaria', 'Soy DON NUBARRÓN. Y hoy... ¡pronóstico de rayos!', 'risa'],
    ['pix', 'Su programa es un SI / SINO: SI estás debajo, rayo. SINO, granizo.', 'n'],
    ['lia', 'Entonces no me quedo debajo... y el granizo se puede devolver.', 'decidida']
  ],
  phase2: () => [['boss_solaria', '¡Ya basta! ¡Dos condiciones! ¡Doble tormenta!', 'enojo'], ['pix', 'Ya no es SI / SINO: son dos SI separados... ¿y si no se cumple ninguno?', 'pensando']],
  outro: () => [
    ['boss_solaria', 'Snif... solo quería que alguien mirara al cielo cuando paso.', 'triste'],
    ['lia', 'Ahora te miramos. Y Suri necesita lluvia para sus flores.', 'feliz'],
    ['boss_solaria', '¿De verdad? ¡Una nube útil! ¡Lloveré con MUCHO estilo!', 'feliz']
  ],
  patch: {
    question: 'Don Nubarrón usa dos SI separados. Estás a 50 píxeles de la nube. ¿Qué hará este turno?',
    code: ['SI distancia < 34 ENTONCES rayo()', 'SI distancia > 70 ENTONCES granizo()'],
    options: [{ text: 'Lanzar un rayo', why: '50 no es menor que 34: la primera condición es FALSA.' }, { text: 'Lanzar granizo', why: '50 no es mayor que 70: la segunda condición también es FALSA.' }, { text: 'Las dos cosas', why: 'Para hacer las dos, ambas condiciones tendrían que ser VERDADERAS.' }, { text: 'Nada: ninguna condición se cumple' }],
    answer: 3, explain: '¡Exacto! Entre 34 y 70 píxeles ninguna condición es verdadera: ese es tu lugar seguro.'
  },
  code: b => b.phase === 1
    ? ['REPETIR:', '  SI Lía_debajo ENTONCES', '    rayo()', '  SINO', '    granizo(4)', '  carga ← carga − 1', '  SI carga = 0: bajar()  ← ¡golpea!']
    : ['REPETIR:', '  SI distancia < 34 ENTONCES', '    rayo()', '  SI distancia > 70 ENTONCES', '    granizo(' + (b.patched === true ? 4 : 6) + ')', '  carga ← carga − 1', '  SI carga = 0: bajar()  ← ¡golpea!'],
  vars: b => {
    const d = b.lv ? Math.round(Math.abs(b.lv.player.cx - b.cx)) : 0;
    return b.phase === 1 ? ['Lía_debajo = ' + (d < 34 ? 'VERDADERO' : 'FALSO'), 'carga = ' + (b.vars.carga != null ? b.vars.carga : 3)] : ['distancia = ' + d, 'carga = ' + (b.vars.carga != null ? b.vars.carga : 3)];
  },
  init(b) { b.vars.carga = 3; b.low = false; },
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    b.line = 0; b.expr = 'n';
    const tx = clamp(p.cx - b.w / 2 + (Math.random() < 0.5 ? -1 : 1) * rand(0, 50), ARENA_L + 8, ARENA_R - b.w - 8);
    yield* bMoveTo(b, tx, b.home.y, 95);
    yield* bWait(b, 0.25);
    const d = Math.abs(p.cx - b.cx), below = d < 34, far = d > 70;
    b.line = 1; yield* bWait(b, 0.3);
    const rayo = function* () { b.line = 2; b.expr = 'angry'; bColumn(b, b.cx, { w: 22, warn: 0.65, dur: 0.35, color: PAL.sun }); yield* bWait(b, 1.0); };
    const granizo = function* (n) {
      b.line = 4; b.expr = 'happy';
      for (let i = 0; i < n; i++) { bDrop(b, clamp(p.cx + rand(-70, 70), ARENA_L + 8, ARENA_R - 8), 'hail', { color: '#E8F4FF', warn: 0.6, r: 4 }); yield* bWait(b, 0.26); }
      yield* bWait(b, 0.5);
    };
    if (!P2) { if (below) yield* rayo(); else { b.line = 3; yield* bWait(b, 0.15); yield* granizo(4); } }
    else {
      if (below) yield* rayo();
      b.line = 3; yield* bWait(b, 0.2);
      if (far) yield* granizo(b.patched === true ? 4 : 6);
      if (!below && !far) { Particles.text(b.cx, b.y + b.h + 8, 'ninguna condición se cumple', PAL.lilac); yield* bWait(b, 0.7); }
    }
    b.line = 5; b.vars.carga--; yield* bWait(b, 0.2);
    if (b.vars.carga <= 0) {
      b.line = 6; b.expr = 'sad';
      yield* bMoveTo(b, clamp(b.x, ARENA_L + 8, ARENA_R - b.w - 8), ARENA_FLOOR - b.h - 12, 130);
      b.low = true;
      yield* bStun(b, P2 ? 2.0 : 2.4, '¡sin carga!');
      b.low = false; b.vars.carga = 3;
      yield* bMoveTo(b, b.x, b.home.y, 110);
    }
  },
  draw(b, g, x, y) {
    const fr = b.friendly, dim = b.low || b.stunned, t = b.t;
    const c1 = fr ? '#F4F6FF' : dim ? '#A0A0C0' : '#C4C4E0', c2 = fr ? '#C9D2F0' : dim ? '#70708E' : '#8A8AB0';
    y += b.portrait ? 0 : Math.round(Math.sin(t * 2) * 1.5);
    if (!b.portrait) for (let i = 0; i < 4; i++) { const dy = (t * 40 + i * 9) % 14; px(g, x + 9 + i * 9, y + 24 + dy, fr ? '#9FE8FF' : '#7C86C8'); }
    const blobs = [[10, 16, 9], [22, 11, 12], [34, 16, 9], [16, 19, 8], [28, 19, 8]];
    for (const [bx, by, r] of blobs) pcircle(g, x + bx, y + by, r + 1, OUTLINE);
    for (const [bx, by, r] of blobs) pcircle(g, x + bx, y + by, r, c2);
    for (const [bx, by, r] of blobs) pcircle(g, x + bx, y + by - 2, r - 2, c1);
    if (b.tele && !fr) { for (let k = 0; k < 3; k++) { const lx = x + 10 + k * 12; pline(g, lx, y + 8, lx + 3, y + 13, PAL.sun); pline(g, lx + 3, y + 13, lx, y + 18, PAL.sun); } }
    if (fr) { bossEyes(g, x + 15, y + 12, 'happy', 3, 11); rect(g, x + 19, y + 18, 6, 1, OUTLINE); px(g, x + 18, y + 17, OUTLINE); px(g, x + 25, y + 17, OUTLINE); rect(g, x + 12, y + 15, 2, 1, '#FFB0C8'); rect(g, x + 29, y + 15, 2, 1, '#FFB0C8'); return; }
    if (b.expr === 'dizzy' || b.stunned) {
      bossEyes(g, x + 15, y + 11, 'dizzy', 3, 11);
      rect(g, x + 13, y + 16, 7, 3, '#1A1030'); rect(g, x + 23, y + 17, 7, 3, '#1A1030'); // gafas caídas
    } else {
      rect(g, x + 13, y + 10, 7, 4, '#1A1030'); rect(g, x + 23, y + 11, 7, 4, '#1A1030'); rect(g, x + 20, y + 11, 3, 1, '#1A1030');
      px(g, x + 14, y + 11, '#FFFFFF'); px(g, x + 24, y + 12, '#FFFFFF');
      if (b.expr === 'angry') { rect(g, x + 13, y + 8, 5, 1, OUTLINE); rect(g, x + 25, y + 9, 5, 1, OUTLINE); }
    }
    // boca: enfurruñada o riendo
    if (b.expr === 'happy') { rect(g, x + 18, y + 18, 7, 2, OUTLINE); rect(g, x + 19, y + 19, 5, 1, '#FF6B6B'); }
    else { rect(g, x + 19, y + 19, 6, 1, OUTLINE); px(g, x + 18, y + 20, OUTLINE); px(g, x + 25, y + 20, OUTLINE); }
  }
};

// =====================================================================
//  4 · AERIS: TORNADO LOOPLING (bucles MIENTRAS)
//  Un tornado con un loopling mareado en el centro. Gira MIENTRAS viento > 0;
//  cada vuelta resta 1. Cuando la condición es falsa, el bucle termina.
// =====================================================================
BOSSES.aeris = {
  key: 'aeris', name: 'TORNADO LOOPLING', short: 'al Tornado Loopling', title: 'El bucle que no quería parar · Bucles', speaker: 'boss_aeris',
  color: '#7FE7FF', w: 28, h: 46, hp: 22, bx: 22, face: [14, 20], inset: 4,
  tags: ['BUCLES', 'EÓLICA'], concepts: ['loops', 'wind'], codex: 'mientras',
  hint: 'Súbete a las plataformas cuando barre el suelo, devuelve las hojas y espera: cuando viento llegue a 0, el bucle termina y su núcleo queda al descubierto.',
  armorHint: '¡Mientras gira dentro del bucle no le haces nada! Mira la variable viento: cuando llegue a 0, el bucle termina.',
  lines: { hurt: ['¡Uy, me mareé!', '¡Eso me sacó del bucle!', '¡Otra vuelta... no, espera!'], tired: ['Uf... mareado... ¿ya terminó el bucle?'], retry: ['¡Otra vuelta! ¡OTRA VUELTA!'] },
  gate: () => [['pix', '¡El viento se está arremolinando junto a la salida!', 'sorpresa'], ['lia', 'Un remolino... con ojos. Por supuesto.', 'pensando']],
  intro: () => [
    ['boss_aeris', '¡Otra vuelta! ¡Otra vuelta! ¡OTRA VUELTAAA!', 'risa'],
    ['boss_aeris', 'Soy TORNADO LOOPLING. ¿Salir del bucle? ¿Qué es "salir"?', 'n'],
    ['pix', 'Mira su variable viento: baja 1 en cada vuelta. Cuando llegue a 0, el MIENTRAS termina.', 'n'],
    ['lia', 'Y un tornado sin viento... es un loopling mareado.', 'decidida']
  ],
  phase2: () => [['boss_aeris', '¡Más viento! ¡MÁS VUELTAS! ¡Bucle eterno!', 'enojo'], ['pix', '¡Cambió cómo se actualiza viento! Eso huele a bucle infinito...', 'sorpresa']],
  outro: () => [
    ['boss_aeris', 'Wiii... ¡me detuve! ¡Qué raro se siente no girar!', 'feliz'],
    ['boss_aeris', '¿Puedo girar solo cuando haya viento de verdad? ¿Con una condición de salida?', 'feliz'],
    ['lia', 'Esa es la idea. Don Vento necesita ayuda con sus molinos.', 'feliz']
  ],
  patch: {
    question: 'Tornado Loopling reescribió su bucle. ¿Qué pasará?',
    code: ['viento ← 3', 'MIENTRAS viento > 0:', '    barrer()', '    viento ← viento + 1'],
    options: [{ text: 'Se detiene tras 3 vueltas', why: 'viento empieza en 3 y SUBE: 4, 5, 6... nunca llega a 0.' }, { text: 'Nunca se detiene: es un bucle infinito' }, { text: 'No gira ni una vez', why: '3 > 0 es VERDADERO: entra al bucle.' }],
    answer: 1, explain: '¡Bucle infinito! Nada dentro del bucle hace falsa la condición. Parche: viento ← viento − 1.'
  },
  code: b => ['viento ← ' + (b.phase === 2 && b.patched !== true ? 5 : 3), 'MIENTRAS viento > 0:', '  barrer()', '  soplar(hojas)', '  viento ← viento − 1', 'agotado()   ← ¡golpea!'],
  vars: b => { const v = b.vars.viento != null ? b.vars.viento : 3; return ['viento = ' + v, 'viento > 0 → ' + (v > 0 ? 'VERDADERO' : 'FALSO')]; },
  init(b) { b.spin = true; b.vars.viento = 3; },
  guard: (b, h) => b.spin && h.src !== 'reflect',
  hitRect: b => b.spin ? b : { x: b.cx - 9, y: ARENA_FLOOR - 18, w: 18, h: 18 },
  hurtBoxes: b => b.spin ? [b.body()] : [],
  *ai(b) {
    const p = b.lv.player;
    b.line = 0; b.vars.viento = b.phase === 2 && b.patched !== true ? 5 : 3; b.spin = true; b.expr = 'happy';
    yield* bWait(b, 0.4);
    while (b.vars.viento > 0) {
      b.line = 1; yield* bWait(b, 0.15);
      b.line = 2; b.face = b.cx > W / 2 ? -1 : 1;
      yield* bTele(b, 0.45);
      const tx = b.face > 0 ? ARENA_R - b.w - 4 : ARENA_L + 4;
      AudioSys.sfx('wind');
      for (; ;) {
        const dt = yield; b.x += b.face * 170 * dt;
        if (Math.random() < 0.6) Particles.spawn({ x: b.cx + rand(-14, 14), y: b.y + rand(0, b.h), vx: -b.face * 60, vy: rand(-30, 0), life: 0.4, type: 'leaf', color: choice(['#9CF5D8', '#FFFFFF']) });
        if ((b.face > 0 && b.x >= tx) || (b.face < 0 && b.x <= tx)) { b.x = tx; break; }
      }
      b.line = 3; b.face = -b.face;
      const dir = b.face; let e = 0, shot = 0;
      AudioSys.sfx('wind');
      while (e < 1.0) {
        const dt = yield; e += dt; bPush(b, dir, 55, dt);
        if (e > shot * 0.3 && shot < 3) { shot++; bShot(b, b.cx + dir * 16, b.y + 8 + shot * 9, dir * 110, 0, { kind: 'leaf', wave: 7, waveF: 6, r: 3, color: '#66D66A', life: 4 }); }
        if (Math.random() < 0.5) Particles.spawn({ x: b.cx + dir * rand(10, 200), y: rand(80, ARENA_FLOOR), vx: dir * 200, life: 0.5, type: 'fade', size: 1, color: 'rgba(255,255,255,0.8)' });
      }
      b.line = 4; b.vars.viento--; Particles.text(b.cx, b.y - 6, 'viento = ' + b.vars.viento, PAL.aqua);
      yield* bWait(b, 0.3);
    }
    b.line = 5; b.spin = false; AudioSys.sfx('powerdown'); b.taunt('tired', true);
    yield* bStun(b, b.phase === 2 ? 2.2 : 2.6, '¡bucle terminado!');
    b.spin = true;
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t, cx0 = x + 14;
    if (b.spin && !fr) {
      for (let i = 0; i < 11; i++) {
        const yy = y + 44 - i * 4, rw = Math.round(3 + i * 1.2), off = Math.round(Math.sin(t * 6 + i * 0.7) * 2);
        pellipse(g, cx0 + off, yy, rw + 1, 2, '#2A7ACC'); pellipse(g, cx0 + off, yy, rw, 1, i % 2 ? '#FFFFFF' : '#9FE8FF');
        px(g, cx0 + off + Math.cos(t * 12 + i) * rw, yy, '#59C7FF');
      }
      for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; rect(g, cx0 + Math.cos(a) * 12, y + 14 + k * 10 + Math.sin(a) * 3, 2, 1, '#66D66A'); }
    } else if (!fr) { pellipse(g, cx0, y + 44, 12, 2, '#9FE8FF'); pellipse(g, cx0, y + 44, 7, 1, '#FFFFFF'); }
    else { for (let i = 0; i < 5; i++) { const a = t * 3 + i * 1.25; px(g, cx0 + Math.cos(a) * 12, y + 26 + Math.sin(a) * 4, '#FFFFFF'); } }
    const coreY = b.spin && !fr ? y + 20 : fr ? y + 24 : y + 36;
    pcircle(g, cx0, coreY, 7, OUTLINE); pcircle(g, cx0, coreY, 6, fr ? '#59C7FF' : '#2A6AA8'); pring(g, cx0, coreY, 6, PAL.aqua);
    px(g, cx0 - 3, coreY - 4, '#FFFFFF');
    bossEyes(g, cx0 - 4, coreY - 2, b.expr, 2, 5);
    if (b.expr === 'happy' || fr) { rect(g, cx0 - 2, coreY + 3, 4, 1, OUTLINE); } else if (b.expr !== 'dizzy') px(g, cx0, coreY + 3, OUTLINE);
    else { px(g, cx0 - 1, coreY + 3, OUTLINE); px(g, cx0 + 1, coreY + 4, OUTLINE); }
  }
};

// =====================================================================
//  5 · HYDRIA: HIDRA DE COMPUERTAS (funciones y parámetros)
//  Tres cabezas (UNO, DOS y TRES) y una sola función: chorro(altura).
//  Cada llamada dispara a una altura. Al morder, la cabeza queda atascada.
// =====================================================================
const HYDRA_HOME = [[-26, 12], [-18, -34], [-4, -80]]; // posición de reposo de cada cabeza respecto al cuerpo
const HYDRA_JET = [230, 180, 132];                     // altura de cada chorro (1: suelo, 2: plataformas, 3: arriba)
const HYDRA_NAMES = ['UNO', 'DOS', 'TRES'];
const HYDRA_TALK = [['UNO: ¡Con permiso!', 'UNO: Disculpa la humedad.'], ['DOS: ¡Aparta!', 'DOS: ¡Mojada te quiero!'], ['TRES: Zzz... ¿me toca?', 'TRES: *bostezo acuático*']];
BOSSES.hydria = {
  key: 'hydria', name: 'HIDRA DE COMPUERTAS', short: 'a la Hidra de Compuertas', title: 'Tres cabezas, una función · Funciones', speaker: 'boss_hydria',
  color: '#59C7FF', w: 80, h: 46, hp: 20, bx: 24, face: [-10, -28], inset: 4,
  tags: ['FUNCIONES', 'HIDRO'], concepts: ['functions', 'hydro'], codex: 'funcion',
  plats: [[3, 7, 12], [11, 15, 12], [6, 10, 9]],
  hint: 'chorro(1) barre el suelo (salta o súbete), chorro(2) las plataformas bajas (quédate abajo) y chorro(3) lo alto. Cuando una cabeza muerde y se atasca, ¡golpéala!',
  armorHint: 'El cuerpo está blindado por las compuertas. ¡Golpea la cabeza que muerde y se queda atascada!',
  lines: { hurt: ['UNO: ¡Qué modales!', 'DOS: ¡AY! ¡Eso no se hace!', 'TRES: ¿Eh? ¿Qué? ¡Ay!'], retry: ['DOS: ¡Otra vez la de la espada!'] },
  gate: () => [['pix', '¡Las compuertas de la cascada se abren y se cierran solas!', 'sorpresa'], ['lia', 'Algo sale del embalse... ¿son tres cabezas?', 'sorpresa']],
  intro: () => [
    ['boss_hydria', 'UNO: Buenas tardes. DOS: ¡Fuera de aquí! TRES: Zzz...', 'n'],
    ['boss_hydria', 'Somos la HIDRA DE COMPUERTAS. Tres cabezas... y UNA sola función: chorro(altura).', 'enojo'],
    ['pix', '¡Una función con parámetro! Cada llamada dispara a una altura distinta: 1 abajo, 2 al medio, 3 arriba.', 'sorpresa'],
    ['pix', 'Mira el número de cada llamada y ponte donde el chorro no llegue. Y cuando muerda... ¡a la cabeza!', 'n']
  ],
  phase2: () => [['boss_hydria', 'DOS: ¡Llamadas en bucle! UNO: Qué descortés. TRES: ¿Ya es de noche?', 'enojo'], ['pix', '¡Ahora llama a la función muchas más veces!', 'sorpresa']],
  outro: () => [
    ['boss_hydria', 'UNO: Gracias por la lección. DOS: ...Vale. Gracias. TRES: Zzz... gracias.', 'feliz'],
    ['boss_hydria', 'Desde ahora abriremos las compuertas con una sola función bien escrita.', 'feliz'],
    ['pix', 'Tres cabezas y ninguna discusión. Eso sí es modularidad.', 'risa']
  ],
  patch: {
    question: 'La Hidra define chorro(altura) UNA vez y la llama tres veces. ¿Cuántas veces se ejecuta apuntar()?',
    code: ['FUNCIÓN chorro(altura):', '    apuntar(altura)', '    disparar()', 'chorro(1)', 'chorro(3)', 'chorro(2)'],
    options: [{ text: '1 vez: se escribe una sola vez', why: 'Definir no es ejecutar: el cuerpo corre cada vez que se LLAMA.' }, { text: '3 veces: una por cada llamada' }, { text: '6 veces: 1 + 3 + 2', why: 'Los números son parámetros (alturas), no repeticiones.' }],
    answer: 1, explain: 'Se define una vez y se ejecuta en cada llamada. ¡Por eso reutilizar funciones es tan potente!'
  },
  code: b => b.phase === 1
    ? ['FUNCIÓN chorro(altura):', '  apuntar(altura); disparar()', 'PRINCIPAL:', '  chorro(1)', '  chorro(3)', '  chorro(2)', '  morder()   ← ¡golpea la cabeza!']
    : ['FUNCIÓN chorro(altura):', '  apuntar(altura); disparar()', 'PRINCIPAL:', '  PARA h EN ' + (b.patched === true ? '[1, 3, 2]' : '[1, 3, 2, 3, 1]') + ':', '    chorro(h)', '  morder() ×2   ← ¡golpea la cabeza!'],
  vars: b => ['altura = ' + (b.vars.altura || '—')],
  initDummy(b) { b.parts = []; },
  init(b) {
    b.x = ARENA_R - b.w; b.home.x = b.x;
    if (!b.parts.length && b.lv) for (let i = 0; i < 3; i++) { const h = new BossPart(b, i, 16, 14); b.parts.push(h); b.lv.addEntity(h); }
    b.parts.forEach((h, i) => { h.hx = b.x + HYDRA_HOME[i][0]; h.hy = b.y + HYDRA_HOME[i][1]; h.x = h.hx; h.y = h.hy; h.stuck = 0; h.mode = 'idle'; });
  },
  idle(b, dt) {
    for (const h of b.parts) {
      h.stuck = Math.max(0, h.stuck - dt);
      if (h.mode === 'idle') { h.x = lerp(h.x, h.hx + Math.sin(b.t * 1.5 + h.idx * 2) * 4, Math.min(1, dt * 4)); h.y = lerp(h.y, h.hy + Math.sin(b.t * 2 + h.idx) * 3, Math.min(1, dt * 4)); }
    }
  },
  guard: () => true,
  hurtBoxes: b => [{ x: b.x + 10, y: b.y + 8, w: b.w - 10, h: b.h - 8 }].concat(b.parts.filter(h => h.stuck <= 0 && h.mode !== 'retract').map(h => ({ x: h.x + 2, y: h.y + 2, w: h.w - 4, h: h.h - 4 }))),
  partHit(b, part, h) {
    if (part.stuck > 0) return b.damage(h, 0, part);
    AudioSys.sfx('clang'); Particles.burst(part.x + 8, part.y + 7, 5, { colors: [PAL.white, PAL.sun], min: 30, max: 70, type: 'spark', lmax: 0.25 });
    return 'block';
  },
  partLens: (b, part) => HYDRA_NAMES[part.idx] + ' · altura ' + (part.idx + 1),
  barkTarget: b => b.parts[randi(0, 2)] || b,
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    const seq = !P2 ? [1, 3, 2] : (b.patched === true ? [1, 3, 2] : [1, 3, 2, 3, 1]);
    for (let i = 0; i < seq.length; i++) {
      const alt = seq[i], head = b.parts[alt - 1];
      b.vars.altura = alt; b.line = P2 ? 4 : 3 + i;
      if (Math.random() < 0.4) Bark.say(head, choice(HYDRA_TALK[alt - 1]), 1.4);
      // apuntar: la cabeza se coloca a la altura del parámetro
      head.mode = 'aim';
      const ty = HYDRA_JET[alt - 1] - 7, tx = head.hx - 6;
      let e = 0; while (e < 0.3) { const dt = yield; e += dt; head.x = lerp(head.x, tx, Math.min(1, dt * 10)); head.y = lerp(head.y, ty, Math.min(1, dt * 10)); }
      b.line = 1;
      bBeam(b, HYDRA_JET[alt - 1], ARENA_L, head.x + 2, { h: 10, warn: P2 ? 0.55 : 0.7, dur: 0.45, color: '#59C7FF' });
      yield* bWait(b, (P2 ? 0.55 : 0.7) + 0.45);
      head.mode = 'idle';
      yield* bWait(b, 0.2);
    }
    b.line = P2 ? 5 : 6;
    const bites = P2 ? 2 : 1;
    for (let k = 0; k < bites; k++) {
      const head = b.parts[randi(0, 2)];
      head.mode = 'rear'; b.tele = { t: 0.5, col: PAL.coral }; b.teleHead = head; AudioSys.sfx('warn');
      let e = 0; while (e < 0.55) { const dt = yield; e += dt; head.y = lerp(head.y, head.hy - 20, Math.min(1, dt * 6)); head.x = lerp(head.x, head.hx + 6, Math.min(1, dt * 6)); }
      b.tele = null;
      const tx = clamp(p.cx - 8, 150, 330), ty = ARENA_FLOOR - 14;
      head.mode = 'bite'; e = 0; const x0 = head.x, y0 = head.y;
      while (e < 0.18) { const dt = yield; e += dt; const k2 = Math.min(1, e / 0.18); head.x = lerp(x0, tx, k2); head.y = lerp(y0, ty, k2); }
      FX.shake(3, 0.25); AudioSys.sfx('bonk');
      Particles.burst(head.x + 8, ARENA_FLOOR, 10, { color: '#9FE8FF', min: 30, max: 80, angle: -Math.PI / 2, spread: 1.2 });
      head.stuck = P2 ? 1.3 : 1.6; head.mode = 'stuck';
      Bark.say(head, choice(['¡Me atasqué!', '¡Ay, el suelo!', '¡Socorro, cabezas!']), 1.3);
      e = 0; while (e < head.stuck + 0.05) e += yield;
      head.mode = 'retract'; e = 0;
      while (e < 0.45) { const dt = yield; e += dt; head.x = lerp(head.x, head.hx, Math.min(1, dt * 6)); head.y = lerp(head.y, head.hy, Math.min(1, dt * 6)); }
      head.mode = 'idle';
      yield* bWait(b, 0.3);
    }
  },
  teleAt: b => b.teleHead ? { x: b.teleHead.x + 8, y: b.teleHead.y } : { x: b.cx, y: b.y },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t;
    const pipe = fr ? '#9FE8FF' : '#59C7FF', pipeD = fr ? '#59C7FF' : '#163A73';
    // embalse y cuerpo de tuberías
    rect(g, x - 2, y + 30, b.w + 4, 16, OUTLINE); rect(g, x, y + 32, b.w, 14, '#1FA8C8');
    for (let i = 0; i < b.w; i += 4) px(g, x + i + Math.floor(t * 8) % 4, y + 33, '#9CF5F0');
    pellipse(g, x + 50, y + 26, 30, 14, OUTLINE); pellipse(g, x + 50, y + 26, 29, 13, pipe);
    for (let i = 0; i < 5; i++) rect(g, x + 26 + i * 11, y + 14, 2, 22, pipeD);
    pcircle(g, x + 64, y + 20, 5, OUTLINE); pring(g, x + 64, y + 20, 4, PAL.sun); pline(g, x + 60, y + 20, x + 68, y + 20, PAL.sun); pline(g, x + 64, y + 16, x + 64, y + 24, PAL.sun);
    // cuellos y cabezas
    const heads = b.parts && b.parts.length ? b.parts : HYDRA_HOME.map(([hx, hy], i) => ({ x: (b.x || 0) + hx, y: (b.y || 0) + hy, idx: i, stuck: 0, flashT: 0, mode: 'idle' }));
    heads.forEach((h, i) => {
      const hx = x + (h.x - (b.x || 0)), hy = y + (h.y - (b.y || 0));
      const ax = x + 30 + i * 12, ay = y + 18;
      for (let k = 0; k <= 8; k++) { const kk = k / 8, nx = lerp(ax, hx + 8, kk), ny = lerp(ay, hy + 8, kk) - Math.sin(kk * Math.PI) * 10; pcircle(g, nx, ny, 4, OUTLINE); pcircle(g, nx, ny, 3, k % 2 ? pipe : pipeD); }
    });
    heads.forEach((h, i) => {
      const hx = x + (h.x - (b.x || 0)), hy = y + (h.y - (b.y || 0));
      const white = h.flashT > 0;
      rect(g, hx - 1, hy - 1, 18, 16, OUTLINE); rect(g, hx, hy, 16, 14, white ? '#FFFFFF' : pipe); rect(g, hx, hy + 10, 16, 4, white ? '#FFFFFF' : pipeD);
      rect(g, hx - 3, hy + 5, 4, 5, OUTLINE); rect(g, hx - 2, hy + 6, 3, 3, '#C9D2F0'); // boquilla
      pring(g, hx + 11, hy - 2, 3, PAL.sun); // volante-corona
      const ex = h.stuck > 0 || b.expr === 'dizzy' ? 'dizzy' : fr ? 'happy' : i === 1 ? 'angry' : i === 2 ? 'sad' : b.expr;
      bossEyes(g, hx + 3, hy + 4, ex, 2, 5);
      drawText(g, String(i + 1), hx + 13, hy + 7, PAL.sun);
      if (h.stuck > 0) for (let k = 0; k < 3; k++) { const a = t * 7 + k * 2.1; px(g, hx + 8 + Math.cos(a) * 9, hy - 4 + Math.sin(a) * 2, PAL.sun); }
    });
  }
};

// =====================================================================
//  6 · BIOLOOP: COMPOSTOR GLOTÓN (listas y recorridos)
//  Un contenedor de compost hambriento. Recorre su lista-menú y escupe
//  cada cosa en orden; al final traga (boca abierta = vulnerable).
// =====================================================================
function compostSpit(b, kind) {
  const p = b.lv.player, f = b.face, mx = f > 0 ? b.x + b.w - 2 : b.x + 2, my = b.y + 9;
  switch (kind) {
    case 'hoja': bShot(b, mx, my, f * 70, 0, { kind: 'leaf', wave: 12, waveF: 3, r: 3, color: '#66D66A', life: 6 }); break;
    case 'piedra': bShot(b, mx, ARENA_FLOOR - 6, f * 130, 0, { kind: 'rock', r: 6, ground: true, reflect: false, life: 5, trail: false, color: '#9A7A5A' }); break;
    case 'semilla': bShot(b, mx, my, f * 105, -170, { kind: 'seed', grav: 420, bounce: 3, r: 3, color: '#C88A2A', life: 5 }); break;
    case 'lata': bLob(b, mx, my, p.cx, { kind: 'can', r: 4, color: '#C9D2F0', time: 0.9 }); break;
  }
  AudioSys.sfx('shot');
}
BOSSES.bioloop = {
  key: 'bioloop', name: 'COMPOSTOR GLOTÓN', short: 'al Compostor Glotón', title: 'Menú degustación · Listas', speaker: 'boss_bioloop',
  color: '#B6F35B', w: 36, h: 34, hp: 22, bx: 23, face: [18, 8], inset: 3,
  tags: ['LISTAS', 'BIOMASA'], concepts: ['arrays', 'biomass'], codex: 'lista',
  hint: 'Recorre su lista en orden: hoja (lenta), piedra (salta), semilla (rebota) y lata (¡devuélvesela!). Cuando abre la boca para tragar, es vulnerable.',
  armorHint: 'Su tapa es durísima. Golpéalo cuando abra la boca para tragar... ¡o devuélvele la lata!',
  lines: { hurt: ['¡Puaj! ¡Eso no es compost!', '¡Mi tapa!', '¡Indigestión!'], eat: ['¡A COMEEER!', '¡Ñam ñam ñam!'], retry: ['¡Segundo plato!'] },
  gate: () => [['pix', 'Huele... a compost. A MUCHO compost.', 'sorpresa'], ['lia', 'El contenedor de la Abuela Menta... ¡está caminando!', 'sorpresa']],
  intro: () => [
    ['boss_bioloop', '¡Mmm! ¡Residuos! ¡Menú degustación!', 'risa'],
    ['boss_bioloop', 'Soy el COMPOSTOR GLOTÓN. Me lo como TODO... y lo que no me gusta, ¡lo escupo!', 'enojo'],
    ['pix', 'Recorre su lista de comida elemento por elemento. Con la Lente verás qué índice toca.', 'n'],
    ['lia', 'La piedra se salta, la lata se devuelve... y cuando abra la boca, ¡a por él!', 'decidida']
  ],
  phase2: () => [['boss_bioloop', '¡Burp! ¡Menú NUEVO! ¡Más largo y al revés!', 'enojo'], ['pix', '¡Cambió su lista!', 'sorpresa']],
  outro: () => [
    ['boss_bioloop', 'Burp. Perdón. ¿Me enseñan a clasificar? Orgánico aquí, plástico allá...', 'triste'],
    ['lia', 'La Abuela Menta te va a adorar.', 'risa'],
    ['boss_bioloop', '¡Compost de calidad, en orden y sin latas! Prometido.', 'feliz']
  ],
  patch: {
    question: 'menú = [hoja, piedra, semilla, lata]. Los índices empiezan en 0. ¿Qué es menú[2]?',
    code: ['menú ← [hoja, piedra, semilla, lata]', 'escupir(menú[2])'],
    options: [{ text: 'piedra', why: 'piedra es menú[1]: la hoja es menú[0].' }, { text: 'semilla' }, { text: 'lata', why: 'lata es menú[3], el último.' }],
    answer: 1, explain: '¡Semilla! Contar desde 0 es la clave de las listas.'
  },
  menu: b => b.phase === 1 ? ['hoja', 'piedra', 'semilla', 'lata'] : b.patched === true ? ['lata', 'semilla', 'piedra', 'hoja'] : ['lata', 'semilla', 'piedra', 'hoja', 'lata', 'semilla'],
  code: b => ['menú ← [' + BOSSES.bioloop.menu(b).join(', ') + ']', 'PARA CADA cosa EN menú:', '  escupir(cosa)', 'tragar()   ← ¡boca abierta!'],
  vars: b => { const m = BOSSES.bioloop.menu(b), i = b.vars.i || 0; return ['i = ' + i + '  →  menú[' + i + '] = ' + m[Math.min(i, m.length - 1)]]; },
  init(b) { b.mouth = 0; b.open = false; b.vars.i = 0; },
  guard: (b, h) => !b.open && h.src !== 'reflect',
  *ai(b) {
    const p = b.lv.player, menu = BOSSES.bioloop.menu(b);
    b.line = 0; yield* bWait(b, 0.3);
    for (let i = 0; i < menu.length; i++) {
      b.vars.i = i; b.line = 1; yield* bWait(b, 0.12);
      b.line = 2; b.face = sign(p.cx - b.cx) || -1; b.mouth = 0.4;
      yield* bTele(b, 0.35, PAL.lime);
      compostSpit(b, menu[i]); b.mouth = 1;
      yield* bWait(b, 0.25); b.mouth = 0; yield* bWait(b, 0.45);
    }
    b.line = 3; b.expr = 'happy'; yield* bTele(b, 0.4);
    b.mouth = 1; b.open = true; AudioSys.sfx('wind'); b.taunt('eat', true);
    let e = 0;
    while (e < 1.3) {
      const dt = yield; e += dt; bPush(b, sign(b.cx - p.cx), 42, dt);
      if (Math.random() < 0.6) { const sx = b.cx + b.face * rand(40, 120); Particles.spawn({ x: sx, y: rand(b.y, ARENA_FLOOR), vx: (b.cx - sx) * 1.5, vy: 0, life: 0.5, type: 'leaf', color: choice(['#66D66A', '#B6F35B', '#C88A2A']) }); }
    }
    b.expr = 'wide';
    e = 0; while (e < (b.phase === 2 ? 1.6 : 2.0)) e += yield;
    b.open = false; b.mouth = 0; b.expr = 'n';
    yield* bWait(b, 0.3);
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t, f = b.face;
    const bin = fr ? '#66D66A' : '#3FA85A', binD = fr ? '#3FA85A' : '#2A6A3A';
    // patitas
    const st = Math.floor(t * 4) % 2;
    rect(g, x + 6, y + 30 - st, 5, 4 + st, OUTLINE); rect(g, x + 25, y + 30 - (1 - st), 5, 4 + (1 - st), OUTLINE);
    // cuerpo-contenedor
    rect(g, x + 1, y + 11, 34, 21, OUTLINE); rect(g, x + 2, y + 12, 32, 19, bin);
    for (let i = 0; i < 4; i++) rect(g, x + 6 + i * 7, y + 14, 2, 15, binD);
    rect(g, x + 13, y + 22, 10, 6, binD); rect(g, x + 15, y + 24, 1, 2, '#FFF3D7'); rect(g, x + 17, y + 23, 1, 3, '#FFF3D7'); rect(g, x + 19, y + 24, 1, 2, '#FFF3D7'); // símbolo de reciclaje
    // boca (interior) y tapa que se abre
    const open = Math.round((b.mouth || 0) * 9);
    if (open > 0) {
      rect(g, x + 2, y + 11 - open, 32, open + 1, '#1A1030');
      for (let i = 0; i < 6; i++) px(g, x + 5 + i * 5, y + 11 - open + 1, '#B6F35B');
      if (b.open) { g.globalAlpha = 0.4 + Math.sin(t * 20) * 0.2; rect(g, x + 6, y + 12 - open, 24, open - 1, PAL.sun); g.globalAlpha = 1; }
    }
    const ly = y + 4 - open;
    rect(g, x, ly, 36, 8, OUTLINE); rect(g, x + 1, ly + 1, 34, 6, binD); rect(g, x + 1, ly + 1, 34, 1, shade(bin, 0.3));
    // ojos en la tapa
    bossEyes(g, x + 10, ly + 2, fr ? 'happy' : b.expr, 3, 12, f);
    // hojas-pelo
    for (let i = 0; i < 4; i++) { const lx = x + 6 + i * 8, sw = Math.round(Math.sin(t * 3 + i) * 1.5); rect(g, lx + sw, ly - 4, 3, 4, i % 2 ? '#66D66A' : '#B6F35B'); px(g, lx + sw + 1, ly - 5, '#B6F35B'); }
    // moscas (solo mientras está enfadado)
    if (!fr && !b.portrait) for (let i = 0; i < 2; i++) { const a = t * 6 + i * 3; px(g, x + 18 + Math.cos(a) * 20, y + 2 + Math.sin(a * 1.3) * 6, OUTLINE); }
  }
};

// =====================================================================
//  7 · GEA: MAGMATÓN (máquinas de estados)
//  Un gólem de roca y lava que solo cambia de estado por transiciones
//  válidas. Vulnerable únicamente en ENFRIANDO. Golpearlo mientras se
//  calienta provoca FAULT: ¡transición inválida!
// =====================================================================
const MAGMA_COL = { REPOSO: '#8A3A2A', CALENTANDO: '#FF9D42', 'ERUPCIÓN': '#FFD84A', ENFRIANDO: '#7C86C8', FAULT: '#FF4A4A', 'DIAGNÓSTICO': '#9B76FF' };
BOSSES.gea = {
  key: 'gea', name: 'MAGMATÓN', short: 'a Magmatón', title: 'La tierra caliente · Estados', speaker: 'boss_gea',
  color: '#FF7B4A', waveColor: '#FFD84A', w: 32, h: 38, hp: 24, bx: 22, face: [16, 7], inset: 3, dark: 0.2,
  tags: ['ESTADOS', 'GEOTERMIA'], concepts: ['states', 'geothermal'], codex: 'estados',
  hint: 'Solo es vulnerable en ENFRIANDO. Si lo golpeas mientras CALIENTA, entra en FAULT y la erupción es peor. Salta las ondas y evita las rocas de lava.',
  armorHint: 'Su roca está al rojo: solo se puede golpear en el estado ENFRIANDO. ¡Mira su estado con la Lente!',
  lines: { hurt: ['¡AUCH... DE... ROCA!', '¡AÚN... NO... ME... TOCA!'], retry: ['CALENTANDO... OTRA... VEZ.'] },
  gate: () => [['pix', 'El suelo está ardiendo... y se mueve.', 'sorpresa'], ['lia', 'Es el calor de la geotérmica. Alguien lo ha dejado sin control.', 'decidida']],
  intro: () => [
    ['boss_gea', 'YO... SOY... LA... TIERRA... CALIENTE.', 'n'],
    ['boss_gea', 'MAGMATÓN. CUATRO ESTADOS. NINGUNA PRISA.', 'enojo'],
    ['pix', '¡Es una máquina de estados! REPOSO, CALENTANDO, ERUPCIÓN, ENFRIANDO. Solo es vulnerable al ENFRIARSE.', 'sorpresa'],
    ['pix', 'Y ojo: si lo golpeas mientras se CALIENTA, entra en FAULT. Transición inválida... y explosiva.', 'n']
  ],
  phase2: () => [['boss_gea', '¡AÑADO... UN... ATAJO!', 'enojo'], ['pix', '¡Metió una transición peligrosa en su máquina de estados!', 'sorpresa']],
  outro: () => [
    ['boss_gea', 'Me... enfrío... Gracias... Necesitaba... una pausa.', 'feliz'],
    ['boss_gea', 'Seré... una fuente termal... para Roca... y los mineros.', 'feliz'],
    ['lia', 'Calor útil, en el estado correcto. ¡Perfecto!', 'feliz']
  ],
  patch: {
    question: 'Magmatón añadió la transición FAULT → ERUPCIÓN. ¿Es segura?',
    code: ['FAULT → ERUPCIÓN      (nueva)', 'FAULT → DIAGNÓSTICO → REPOSO'],
    options: [{ text: 'Sí: así descarga el calor', why: 'Tras un fallo, arrancar directo es peligroso: primero hay que diagnosticar.' }, { text: 'No: desde FAULT se va a DIAGNÓSTICO' }, { text: 'Solo si hace frío', why: 'La seguridad no depende del clima: la transición es inválida siempre.' }],
    answer: 1, explain: 'Transición segura: FAULT → DIAGNÓSTICO. Con el parche, si lo golpeas mientras se calienta, se detiene a diagnosticar.'
  },
  code: b => {
    const L = ['estado = ' + (b.st || 'REPOSO'), 'REPOSO → CALENTANDO', 'CALENTANDO → ERUPCIÓN', 'ERUPCIÓN → ENFRIANDO', 'ENFRIANDO → REPOSO  ← ¡golpea!'];
    if (b.phase === 2) L.push('FAULT → ' + (b.patched === true ? 'DIAGNÓSTICO' : 'ERUPCIÓN'));
    return L;
  },
  vars: b => ['temperatura = ' + Math.round(b.vars.temp || 300) + ' °C'],
  init(b) { b.st = 'REPOSO'; b.vars.temp = 300; b.fault = false; b.diag = false; },
  tick(b, dt) {
    const target = { REPOSO: 300, CALENTANDO: 800, 'ERUPCIÓN': 950, ENFRIANDO: 150, FAULT: 1100, 'DIAGNÓSTICO': 250 }[b.st] || 300;
    b.vars.temp = approach(b.vars.temp, target, dt * 500);
  },
  guard(b, h) {
    if (b.st === 'ENFRIANDO' || b.st === 'DIAGNÓSTICO') return false;
    if (b.st === 'CALENTANDO' && h.src === 'saber' && !b.fault && !b.diag) {
      if (b.phase === 2 && b.patched === true) { b.diag = true; Particles.text(b.cx, b.y - 12, 'FAULT → DIAGNÓSTICO', PAL.lime); }
      else { b.fault = true; Particles.text(b.cx, b.y - 12, 'FAULT: ¡transición inválida!', PAL.coral); Bark.say('pix', '¡No lo golpees mientras se calienta! Espera a ENFRIANDO.', 3); }
    }
    return true;
  },
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    b.st = 'REPOSO'; b.line = 1; b.expr = 'n'; b.fault = false; b.diag = false;
    let e = 0;
    while (e < 1.3) { const dt = yield; e += dt; b.face = sign(p.cx - b.cx) || b.face; const nx = b.x + b.face * 34 * dt; if (nx > ARENA_L + 2 && nx + b.w < ARENA_R - 2 && Math.abs(p.cx - b.cx) > 20) b.x = nx; }
    b.st = 'CALENTANDO'; b.line = 2; b.expr = 'angry'; AudioSys.sfx('charge');
    e = 0; const heat = P2 ? 0.75 : 0.95;
    while (e < heat && !b.fault && !b.diag) e += yield;
    if (b.diag) { b.st = 'DIAGNÓSTICO'; b.line = 5; yield* bStun(b, 1.5, 'diagnosticando...'); return; }
    b.st = b.fault ? 'FAULT' : 'ERUPCIÓN'; b.line = b.fault ? 5 : 3;
    FX.shake(4, 0.4); AudioSys.sfx('boom');
    bWave(b, b.x + 4, -1, 160); bWave(b, b.x + b.w - 4, 1, 160);
    const n = (P2 ? 5 : 4) + (b.fault ? 3 : 0);
    for (let i = 0; i < n; i++) {
      bLob(b, b.cx, b.y + 4, clamp(p.cx + rand(-80, 80), ARENA_L + 12, ARENA_R - 12), {
        kind: 'lava', r: 4, color: '#FF7B4A', reflect: false, time: rand(0.8, 1.2),
        onLand: s => bHazard(b, { x: s.cx - 10, y: ARENA_FLOOR - 12, w: 20, h: 12 }, { kind: 'fire', warn: 0, dur: 1.2, color: '#FF7B4A' })
      });
      yield* bWait(b, 0.18);
    }
    if ((P2 && b.patched !== true) || b.fault) { yield* bWait(b, 0.45); FX.shake(3, 0.3); AudioSys.sfx('boom'); bWave(b, b.x + 4, -1, 190); bWave(b, b.x + b.w - 4, 1, 190); }
    yield* bWait(b, 0.5);
    b.st = 'ENFRIANDO'; b.line = 4; b.expr = 'n';
    yield* bStun(b, P2 ? 2.1 : 2.5, '¡enfriando!');
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t, st = b.st || 'REPOSO';
    let glow = fr ? '#FFB060' : MAGMA_COL[st] || '#8A3A2A';
    if (!fr && (st === 'CALENTANDO' || st === 'FAULT') && Math.floor(t * 12) % 2) glow = '#FFFFFF';
    const rock = fr ? '#7A5A4A' : st === 'ENFRIANDO' ? '#5A5A6A' : '#4A3030', rockL = shade(rock, 0.25);
    // piernas
    rect(g, x + 5, y + 30, 8, 8, OUTLINE); rect(g, x + 19, y + 30, 8, 8, OUTLINE); rect(g, x + 6, y + 30, 6, 7, rock); rect(g, x + 20, y + 30, 6, 7, rock);
    // torso
    rect(g, x + 2, y + 10, 28, 22, OUTLINE); rect(g, x + 3, y + 11, 26, 20, rock); rect(g, x + 3, y + 11, 26, 2, rockL);
    // grietas de lava
    pline(g, x + 8, y + 12, x + 12, y + 20, glow); pline(g, x + 12, y + 20, x + 9, y + 28, glow); pline(g, x + 22, y + 13, x + 19, y + 22, glow); pline(g, x + 19, y + 22, x + 24, y + 29, glow);
    // pantalla de estado en el pecho
    rect(g, x + 12, y + 22, 8, 6, OUTLINE); rect(g, x + 13, y + 23, 6, 4, glow);
    // puños
    const pf = st === 'ERUPCIÓN' ? -3 : 0;
    rect(g, x - 4, y + 16 + pf, 8, 9, OUTLINE); rect(g, x - 3, y + 17 + pf, 6, 7, rock); px(g, x - 1, y + 19 + pf, glow);
    rect(g, x + 28, y + 16 + pf, 8, 9, OUTLINE); rect(g, x + 29, y + 17 + pf, 6, 7, rock); px(g, x + 31, y + 19 + pf, glow);
    // cabeza
    rect(g, x + 8, y, 16, 12, OUTLINE); rect(g, x + 9, y + 1, 14, 10, rock); rect(g, x + 9, y + 1, 14, 1, rockL);
    const ex = fr ? 'happy' : b.expr;
    if (ex === 'happy' || ex === 'dizzy') bossEyes(g, x + 11, y + 4, ex, 3, 7);
    else { rect(g, x + 11, y + 4, 3, 3, glow); rect(g, x + 18, y + 4, 3, 3, glow); if (ex === 'angry') { rect(g, x + 10, y + 3, 4, 1, OUTLINE); rect(g, x + 18, y + 3, 4, 1, OUTLINE); } }
    rect(g, x + 13, y + 9, 6, 1, OUTLINE);
    if (fr) { px(g, x + 12, y - 1, '#66D66A'); px(g, x + 13, y - 2, '#66D66A'); px(g, x + 19, y - 1, PAL.pink); } // musgo y una flor
    if (!b.portrait && (st === 'ENFRIANDO' || fr) && Math.random() < 0.25) Particles.spawn({ x: (b.x || 0) + rand(4, 28), y: (b.y || 0) + 8, vy: -25, vx: rand(-6, 6), life: 0.8, type: 'fade', size: 2, color: 'rgba(255,255,255,0.6)' });
  }
};

// =====================================================================
//  8 · BAHÍA H2: KRAKEN DE FUGAS (pipelines)
//  Cuatro tentáculos-tubería, uno por etapa: agua → electrólisis → tanque
//  → pila. Solo se hace daño golpeándolos en el orden del pipeline.
// =====================================================================
const KRAKEN_STAGES = ['AGUA', 'ELECTRÓLISIS', 'TANQUE', 'PILA'];
const KRAKEN_COLS = ['#59C7FF', PAL.sun, '#C9D2F0', PAL.lime];
BOSSES.h2 = {
  key: 'h2', name: 'KRAKEN DE FUGAS', short: 'al Kraken de Fugas', title: 'Tuberías con opinión · Pipelines', speaker: 'boss_h2',
  color: '#9CF5D8', w: 70, h: 62, hp: 20, bx: 25, face: [36, 22], inset: 6,
  tags: ['PIPELINES', 'HIDRÓGENO'], concepts: ['sequence', 'hydrogen'], codex: 'pipeline',
  plats: [[3, 7, 12], [10, 14, 9]],
  hint: 'Golpea los tentáculos plantados en el orden del pipeline: AGUA → ELECTRÓLISIS → TANQUE → PILA. Con el pipeline completo, su núcleo queda expuesto. Devuelve las burbujas.',
  armorHint: 'Su cabeza está protegida por la presión. ¡Completa el pipeline golpeando los tentáculos en orden!',
  lines: { hurt: ['¡FSSSH! ¡Una fuga!', '¡Mis válvulas!', '¡Glu glu, eso dolió!'], wrong: ['¡Esa etapa va DESPUÉS!', '¡Ja! ¡Orden equivocado!'], retry: ['¡Presión restablecida!'] },
  gate: () => [['pix', '¡Las tuberías de la bahía están silbando! ¡Hay fugas por todas partes!', 'sorpresa'], ['lia', 'Algo las está retorciendo desde el agua...', 'decidida']],
  intro: () => [
    ['boss_h2', '¡FSSSHHH! ¡Presión máxima! ¡Tuberías por todas partes!', 'risa'],
    ['boss_h2', 'Soy el KRAKEN DE FUGAS. Mis tentáculos son MI arte: cada uno, una etapa.', 'enojo'],
    ['pix', '¡Es un pipeline! Golpea sus tentáculos en el orden de las etapas: agua, electrólisis, tanque, pila.', 'n'],
    ['lia', 'Si el orden es correcto, la presión se libera... y su núcleo queda al descubierto.', 'decidida']
  ],
  phase2: () => [['boss_h2', '¡Barajo mis etapas! ¡A ver si sabes el orden de memoria!', 'enojo'], ['pix', '¡Ahora aparecen desordenados! Tú golpéalos en orden de pipeline.', 'sorpresa']],
  outro: () => [
    ['boss_h2', 'Glu glu... sin fugas se respira mejor.', 'feliz'],
    ['boss_h2', 'Me quedaré revisando tuberías. Una etapa detrás de otra.', 'feliz'],
    ['pix', 'Un kraken fontanero. El Capitán H2O va a flipar.', 'risa']
  ],
  patch: {
    question: 'El Kraken mezcló su pipeline. ¿Cuál es el orden correcto del hidrógeno verde?',
    code: ['entrada: agua + electricidad renovable', 'salida: electricidad cuando haga falta'],
    options: [{ text: 'agua → electrólisis → tanque → pila' }, { text: 'agua → tanque → electrólisis → pila', why: 'No puedes guardar hidrógeno que aún no has producido: primero electrólisis.' }, { text: 'pila → tanque → electrólisis → agua', why: 'Ese es el camino al revés: la pila de combustible va al final.' }],
    answer: 0, explain: 'Cada etapa usa la salida de la anterior: eso es un pipeline. Con el parche, la Lente numera sus tentáculos.'
  },
  code: b => b.phase === 1
    ? ['etapas ← [agua, electrólisis, tanque, pila]', 'PARA CADA e EN etapas:', '  golpear(tentáculo[e])', 'burbujas(4)', 'presión_liberada()  ← ¡golpea!']
    : ['orden ← barajar(etapas)', 'PARA CADA e EN orden:', '  golpear(tentáculo[e])', 'burbujas(4)', 'presión_liberada()  ← ¡golpea!'],
  vars: b => ['siguiente = ' + (KRAKEN_STAGES[b.vars.next || 0] || '✓ completo')],
  initDummy(b) { b.parts = []; },
  init(b) {
    b.x = ARENA_R - b.w; b.y = ARENA_FLOOR - b.h; b.home.x = b.x; b.home.y = b.y;
    if (!b.parts.length && b.lv) for (let i = 0; i < 4; i++) { const tn = new BossPart(b, i, 16, 60); b.parts.push(tn); b.lv.addEntity(tn); }
    b.parts.forEach((tn, i) => { tn.mode = 'idle'; tn.tx = 0; tn.done = false; tn.x = b.x + 8 + i * 12; tn.y = -80; tn.tipY = 0; });
    b.vars.next = 0;
  },
  idle(b, dt) {
    for (const tn of b.parts) {
      if (tn.mode === 'slam') { tn.y = approach(tn.y, ARENA_FLOOR - tn.h, dt * 700); if (tn.y >= ARENA_FLOOR - tn.h) { tn.mode = 'planted'; FX.shake(3, 0.2); AudioSys.sfx('bonk'); Particles.burst(tn.x + 8, ARENA_FLOOR, 10, { color: '#9FE8FF', min: 30, max: 90, angle: -Math.PI / 2, spread: 1.2 }); } }
      else if (tn.mode === 'up' || tn.mode === 'idle') tn.y = approach(tn.y, -80, dt * 300);
      tn.hostile = b.state === 'fight' && tn.mode === 'planted';
    }
  },
  guard: (b, h) => !b.stunned && h.src !== 'reflect',
  hitRect: b => ({ x: b.x + 6, y: b.y + 14, w: 44, h: 44 }),
  hurtBoxes: b => [{ x: b.x + 14, y: b.y + 10, w: b.w - 14, h: b.h - 10 }].concat(b.parts.filter(t => t.mode === 'slam').map(t => ({ x: t.x + 2, y: t.y, w: 12, h: t.h }))),
  partHit(b, tn, h) {
    if (tn.mode !== 'planted' || tn.done) { AudioSys.sfx('clang'); return 'block'; }
    if (tn.idx === b.vars.next) {
      tn.done = true; b.vars.next++;
      Particles.text(tn.x + 8, tn.y - 8, '✓ ' + KRAKEN_STAGES[tn.idx], PAL.lime);
      const r = b.damage(h, 0, tn);
      if (b.vars.next >= 4 && b.state === 'fight') { Particles.text(b.cx, b.y - 10, '¡PIPELINE COMPLETO!', PAL.sun); AudioSys.sfx('win'); }
      return r;
    }
    AudioSys.sfx('clang'); Particles.text(tn.x + 8, tn.y - 8, '¡fuga! va ' + KRAKEN_STAGES[b.vars.next], PAL.coral);
    Particles.burst(tn.x + 8, tn.y + 20, 8, { color: '#9FE8FF', min: 30, max: 80 });
    b.taunt('wrong');
    return 'block';
  },
  partLens: (b, tn) => tn.mode === 'planted' ? ((b.phase === 1 || b.patched === true) ? (tn.idx + 1) + '. ' : '') + KRAKEN_STAGES[tn.idx] + (tn.done ? ' ✓' : '') : null,
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    const order = P2 ? shuffle([0, 1, 2, 3]) : [0, 1, 2, 3];
    const cols = shuffle([64, 136, 208, 280]);
    b.vars.next = 0; b.parts.forEach(t => { t.done = false; t.mode = 'up'; });
    b.line = 0; yield* bWait(b, 0.3);
    b.line = 1;
    for (let k = 0; k < 4; k++) {
      const tn = b.parts[order[k]];
      b.line = 2;
      tn.tx = P2 ? cols[k] : clamp(p.cx - 8, 40, 330);
      tn.x = tn.tx; tn.mode = 'warn'; tn.warnT = P2 ? 0.55 : 0.65;
      AudioSys.sfx('warn');
      yield* bWait(b, tn.warnT);
      tn.mode = 'slam';
      if (!P2) { let e = 0; while (e < 1.7 && !tn.done) e += yield; yield* bWait(b, tn.done ? 0.2 : 0); tn.mode = 'up'; yield* bWait(b, 0.3); }
      else yield* bWait(b, 0.4);
    }
    if (P2) { let e = 0; while (e < (b.patched === true ? 4.0 : 3.2) && b.vars.next < 4) e += yield; b.parts.forEach(t => t.mode = 'up'); }
    if (b.vars.next >= 4) { b.line = 4; b.expr = 'dizzy'; yield* bStun(b, 2.6, '¡presión liberada!'); b.expr = 'n'; return; }
    b.line = 3; b.expr = 'happy';
    for (let i = 0; i < 4; i++) { const [vx, vy] = bAim(b, b.x + 10, b.y + 20, 70, rand(-0.3, 0.3)); bShot(b, b.x + 10, b.y + 20, vx, vy, { kind: 'bubble', r: 4, color: '#9FE8FF', life: 5 }); AudioSys.sfx('splash'); yield* bWait(b, 0.3); }
    b.expr = 'n'; yield* bWait(b, 0.8);
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t;
    const body = fr ? '#B6A0FF' : '#7C5AC8', bodyD = shade(body, -0.35);
    // agua a los pies
    rect(g, x - 6, y + b.h - 10, b.w + 8, 10, '#1F6AB8'); for (let i = 0; i < b.w + 8; i += 3) px(g, x - 6 + i, y + b.h - 10 + Math.round(Math.sin(t * 3 + i * 0.4)), '#7FE7FF');
    // tentáculos (tuberías que se arquean desde la cabeza)
    const tents = b.parts && b.parts.length ? b.parts : [];
    tents.forEach((tn, i) => {
      if (tn.mode === 'idle' || (tn.mode === 'up' && tn.y <= -70)) return;
      const tx0 = x + (tn.x - b.x) + 8;
      if (tn.mode === 'warn') { const blink = Math.floor(t * 12) % 2; rect(g, tx0 - 8, ARENA_FLOOR - (b.y || 0) + y - 2, 16, 2, blink ? KRAKEN_COLS[i] : PAL.coral); drawText(g, '!', tx0, ARENA_FLOOR - (b.y || 0) + y - 14, PAL.coral, { align: 'center', outline: PAL.ink }); return; }
      const tipY = y + (tn.y - b.y), botY = tipY + tn.h, ax = x + 12, ay = y + 14;
      for (let k = 0; k <= 12; k++) { const kk = k / 12, nx = lerp(ax, tx0, kk), ny = lerp(ay, tipY, kk) - Math.sin(kk * Math.PI) * 60; pcircle(g, nx, ny, 3, k % 2 ? body : bodyD); }
      const white = tn.flashT > 0;
      rect(g, tx0 - 7, tipY, 14, tn.h, OUTLINE); rect(g, tx0 - 6, tipY, 12, tn.h - 1, white ? '#FFFFFF' : tn.done ? '#3A8A5A' : body);
      for (let yy = tipY + 6; yy < botY - 4; yy += 10) { rect(g, tx0 - 7, yy, 14, 2, bodyD); px(g, tx0 - 3, yy + 4, shade(body, 0.4)); }
      rect(g, tx0 - 5, botY - 8, 10, 6, KRAKEN_COLS[i]);
      drawText(g, KRAKEN_STAGES[i].slice(0, 3), tx0, tipY + 6, KRAKEN_COLS[i], { align: 'center', outline: PAL.ink });
    });
    // cabeza con manómetros por ojos
    pellipse(g, x + 36, y + 30, 30, 26, OUTLINE); pellipse(g, x + 36, y + 30, 29, 25, body);
    pellipse(g, x + 36, y + 20, 22, 12, shade(body, 0.15));
    for (const ox of [26, 46]) {
      pcircle(g, x + ox, y + 26, 7, OUTLINE); pcircle(g, x + ox, y + 26, 6, '#FFFFFF');
      if (b.expr === 'dizzy' || b.stunned) { pline(g, x + ox - 3, y + 23, x + ox + 3, y + 29, OUTLINE); pline(g, x + ox - 3, y + 29, x + ox + 3, y + 23, OUTLINE); }
      else { const a = fr ? -1.2 : b.expr === 'angry' ? 0.6 : Math.sin(t * 2) * 1.2 - 1.57; pline(g, x + ox, y + 26, x + ox + Math.cos(a) * 5, y + 26 + Math.sin(a) * 5, PAL.coral); px(g, x + ox, y + 26, OUTLINE); }
    }
    if (fr || b.expr === 'happy') { rect(g, x + 30, y + 38, 12, 2, OUTLINE); px(g, x + 29, y + 37, OUTLINE); px(g, x + 42, y + 37, OUTLINE); }
    else { pellipse(g, x + 36, y + 39, 5, 3, OUTLINE); pellipse(g, x + 36, y + 39, 3, 2, '#1A1030'); }
    // válvula que silba
    rect(g, x + 33, y + 2, 6, 4, OUTLINE); rect(g, x + 34, y + 3, 4, 2, '#C9D2F0');
    if (!fr && !b.portrait && Math.random() < 0.3) Particles.spawn({ x: (b.x || 0) + 36, y: (b.y || 0) + 2, vx: rand(-10, 10), vy: -40, life: 0.5, type: 'fade', size: 2, color: 'rgba(255,255,255,0.7)' });
    if (b.stunned) { g.globalAlpha = 0.4 + Math.sin(t * 14) * 0.2; pcircle(g, x + 36, y + 30, 12, PAL.sun); g.globalAlpha = 1; }
  }
};

// =====================================================================
//  9 · CIUDAD BATERÍA: DRENADORA SUPREMA (búsqueda y ordenamiento)
//  Una reina-medusa protegida por pilas numeradas. Solo se rompen de
//  MENOR a MAYOR: hay que buscar el mínimo cada vez.
// =====================================================================
BOSSES.bateria = {
  key: 'bateria', name: 'DRENADORA SUPREMA', short: 'a la Drenadora Suprema', title: 'Reina de las pilas · Búsqueda y orden', speaker: 'boss_bateria',
  color: '#FF4FB8', w: 30, h: 28, hp: 20, fly: true, homeY: 100, bx: 14, face: [15, 12], inset: 4,
  tags: ['BÚSQUEDA', 'ORDENAMIENTO', 'ALMACENAMIENTO'], concepts: ['search', 'sorting', 'storage'], codex: 'busqueda',
  hint: 'Su escudo son pilas numeradas: rómpelas de MENOR a MAYOR (busca siempre el mínimo). Sin escudo baja y es vulnerable. No te quedes cerca: drena energía.',
  armorHint: 'Su escudo de pilas la protege. ¡Rompe las pilas de MENOR a MAYOR!',
  lines: { hurt: ['¡Mi corona de pilas!', '¡Qué falta de voltaje!', '¡Descarga no autorizada!'], wrong: ['¡Ese no es el mínimo, querida!', '¡Desordenado! ¡Se regenera!'], drain: ['¡Mmm, energía fresquita!', '¡Toda la carga es MÍA!'], retry: ['¡Recargada y fabulosa!'] },
  gate: () => [['pix', 'Las luces de neón parpadean... ¡alguien está chupando la energía de la ciudad!', 'sorpresa'], ['lia', 'Una reina... de pilas. Vamos.', 'decidida']],
  intro: () => [
    ['boss_bateria', '¡Toda la energía es MÍA, querida! Soy la DRENADORA SUPREMA.', 'risa'],
    ['boss_bateria', 'Mis pilas me protegen. Están PERFECTAMENTE desordenadas.', 'enojo'],
    ['pix', 'Su escudo tiene números. Rómpelos de MENOR a MAYOR: busca siempre el mínimo.', 'n'],
    ['lia', 'Si rompo una fuera de orden, se regenera. Primero buscar, luego golpear.', 'decidida']
  ],
  phase2: () => [['boss_bateria', '¡Cinco pilas! ¡Y girando más rápido! ¿A que ya no encuentras el mínimo?', 'enojo'], ['pix', '¡Más elementos! Pero el método es el mismo: compara y elige el menor.', 'decidida']],
  outro: () => [
    ['boss_bateria', '¿Compartir la carga? ...Suena... equilibrado.', 'triste'],
    ['boss_bateria', 'Está bien. Guardaré energía de día y la repartiré de noche. Con prioridades.', 'feliz'],
    ['pix', 'Una reina que ordena su corona. De menor a mayor.', 'risa']
  ],
  patch: {
    question: 'Para encontrar el mínimo de [8, 2, 6, 4] mirando uno por uno, ¿cuántas comparaciones hacen falta?',
    code: ['mínimo ← lista[0]', 'PARA CADA x EN el resto:', '    SI x < mínimo: mínimo ← x'],
    options: [{ text: '1', why: 'Con una sola comparación solo sabes cuál de dos es menor.' }, { text: '3: comparo el mínimo con cada uno de los demás' }, { text: '4', why: 'El primero no se compara consigo mismo: n − 1 = 3.' }],
    answer: 1, explain: 'Con n elementos bastan n − 1 comparaciones: búsqueda lineal del mínimo. Con el parche, la Lente marca el mínimo.'
  },
  code: b => ['escudo ← [' + (b.vars.nums || []).join(', ') + ']', 'MIENTRAS escudo ≠ [ ]:', '  drenar(Lía)', '  SI pila ≠ mínimo: regenerar()', 'bajar_escudo()   ← ¡golpea!'],
  vars: b => { const left = b.parts.filter(c => !c.gone).map(c => c.num); const showMin = b.phase === 1 || b.patched === true; return ['mínimo = ' + (left.length ? (showMin ? Math.min(...left) : '?  (búscalo tú)') : '—'), 'rotas = [' + (b.vars.broken || []).join(', ') + ']']; },
  initDummy(b) { b.parts = []; },
  init(b) { b.orbA = 0; b.shieldUp = false; b.vars.broken = []; b.parts.forEach(c => { c.gone = true; }); b.pathT = 0; },
  raiseShield(b) {
    const n = b.phase === 2 ? 5 : 4;
    while (b.parts.length < n && b.lv) { const c = new BossPart(b, b.parts.length, 12, 14); b.parts.push(c); b.lv.addEntity(c); }
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n);
    b.parts.forEach((c, i) => { c.gone = i >= n; c.num = nums[i]; });
    b.vars.nums = nums.slice(); b.vars.broken = []; b.shieldUp = true;
    AudioSys.sfx('charge');
  },
  idle(b, dt) {
    b.orbA += dt * (b.phase === 2 ? 1.6 : 1.1);
    const act = b.parts.filter(c => !c.gone), n = b.parts.length;
    b.parts.forEach((c, i) => { const a = b.orbA + i / n * Math.PI * 2; c.x = b.cx + Math.cos(a) * 34 - 6; c.y = b.cy + Math.sin(a) * 30 - 7; });
    void act;
  },
  guard: (b, h) => b.shieldUp && !b.stunned,
  partHit(b, c, h) {
    if (c.gone || !b.shieldUp) return false;
    const left = b.parts.filter(q => !q.gone), min = Math.min(...left.map(q => q.num));
    if (c.num === min) {
      c.gone = true; b.vars.broken.push(c.num); c.flashT = 0.1;
      AudioSys.sfx('ok'); Particles.text(c.x + 6, c.y - 6, '✓ ' + c.num, PAL.lime);
      Particles.burst(c.x + 6, c.y + 7, 12, { colors: [PAL.lime, PAL.white, PAL.pink], min: 30, max: 90, type: 'spark' });
      hitstop(b.lv, 0.05);
      if (left.length === 1) { b.shieldUp = false; Particles.text(b.cx, b.y - 14, '¡ESCUDO ORDENADO!', PAL.sun); AudioSys.sfx('win'); }
      return true;
    }
    AudioSys.sfx('error'); Particles.text(c.x + 6, c.y - 6, c.num + ' no es el mínimo', PAL.coral);
    const back = b.parts.find(q => q.gone && b.vars.broken.includes(q.num) && q.idx < (b.phase === 2 ? 5 : 4));
    if (back) { back.gone = false; b.vars.broken = b.vars.broken.filter(n => n !== back.num); Particles.text(back.x + 6, back.y - 14, 'regenerada', PAL.pink); }
    b.taunt('wrong', true);
    return 'block';
  },
  partLens: (b, c) => { if (c.gone || !b.shieldUp) return null; const left = b.parts.filter(q => !q.gone), min = Math.min(...left.map(q => q.num)); return (b.phase === 1 || b.patched === true) && c.num === min ? '{g}mínimo{/}' : null; },
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    if (!b.shieldUp) BOSSES.bateria.raiseShield(b);
    b.line = 0; yield* bWait(b, 0.3);
    let shotT = 0, drainT = 0, sumT = 0;
    while (b.shieldUp) {
      const dt = yield; b.line = 1;
      b.pathT += dt;
      const tx = W / 2 - b.w / 2 + Math.sin(b.pathT * 0.55) * 150, ty = b.home.y + Math.sin(b.pathT * 1.1) * 16;
      b.x = lerp(b.x, tx, Math.min(1, dt * 2)); b.y = lerp(b.y, ty, Math.min(1, dt * 2)); b.face = sign(p.cx - b.cx) || b.face;
      shotT += dt; drainT += dt; sumT += dt;
      if (shotT > (P2 ? 2.0 : 2.4)) { shotT = 0; b.line = 2; for (let k = -1; k <= 1; k++) { const [vx, vy] = bAim(b, b.cx, b.cy + 8, 95, k * 0.25); bShot(b, b.cx, b.cy + 8, vx, vy, { kind: 'spark', r: 3, color: PAL.pink, life: 4 }); } AudioSys.sfx('shot'); }
      if (drainT > 3.2 && dist(p.cx, p.y + 10, b.cx, b.cy) < 120) {
        drainT = 0; b.line = 2; b.drainFx = 0.4; const take = Math.min(p.energy, 25); p.energy -= take;
        if (take > 0) { Particles.text(p.cx, p.y - 10, '−' + Math.round(take) + ' energía', PAL.pink); AudioSys.sfx('powerdown'); b.taunt('drain'); }
      }
      if (sumT > 7 && b.lv.entities.filter(e => e.bossSpawn && e instanceof Enemy && !e.dead).length < 2) { sumT = 0; bSummon(b, 'drainer', clamp(b.cx - 5, ARENA_L + 20, ARENA_R - 30), { priority: randi(2, 6) }); }
    }
    b.line = 4; b.expr = 'dizzy';
    yield* bMoveTo(b, clamp(b.x, ARENA_L + 20, ARENA_R - b.w - 20), ARENA_FLOOR - b.h - 18, 150);
    yield* bStun(b, P2 ? 2.6 : 3.0, '¡sin escudo!');
    b.expr = 'n';
    BOSSES.bateria.raiseShield(b);
    yield* bMoveTo(b, b.x, b.home.y, 120);
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t;
    const dome = fr ? '#FF9FD8' : '#FF4FB8', domeD = fr ? '#D06AB0' : '#B8338A';
    // tentáculos-cable
    for (let i = 0; i < 5; i++) { const lx = x + 5 + i * 5; for (let k = 0; k < 10; k++) px(g, lx + Math.round(Math.sin(t * 4 + i + k * 0.5) * 1.5), y + 20 + k, k % 3 === 0 ? PAL.sun : domeD); }
    // cúpula
    pellipse(g, x + 15, y + 14, 14, 10, OUTLINE); pellipse(g, x + 15, y + 14, 13, 9, dome); pellipse(g, x + 12, y + 10, 6, 3, shade(dome, 0.35));
    rect(g, x + 3, y + 19, 24, 3, domeD);
    // corona de pilas
    for (let i = 0; i < 3; i++) { rect(g, x + 7 + i * 6, y + 1, 4, 6, OUTLINE); rect(g, x + 8 + i * 6, y + 2, 2, 4, i === 1 ? PAL.sun : PAL.teal); px(g, x + 8 + i * 6, y, OUTLINE); }
    // ojos con pestañas
    const ex = fr ? 'happy' : b.expr;
    bossEyes(g, x + 9, y + 12, ex, 3, 9);
    if (ex !== 'dizzy' && ex !== 'happy') { px(g, x + 8, y + 11, OUTLINE); px(g, x + 21, y + 11, OUTLINE); }
    rect(g, x + 13, y + 17, 4, 1, OUTLINE);
    // pilas del escudo
    for (const c of (b.parts || [])) {
      if (c.gone) continue;
      const cx0 = x + (c.x - b.x), cy0 = y + (c.y - b.y);
      rect(g, cx0 - 1, cy0 - 1, 14, 16, OUTLINE); rect(g, cx0, cy0, 12, 14, c.flashT > 0 ? '#FFFFFF' : '#2A2F6A'); rect(g, cx0 + 4, cy0 - 3, 4, 2, '#C9D2F0');
      rect(g, cx0 + 1, cy0 + 1, 10, 2, PAL.pink);
      drawText(g, String(c.num), cx0 + 6, cy0 + 4, PAL.white, { align: 'center' });
    }
    if (b.drainFx > 0 && b.lv) { b.drainFx -= 1 / 60; const p = b.lv.player; g.globalAlpha = 0.6; pline(g, x + 15, y + 22, x + (p.cx - b.x), y + (p.y + 10 - b.y), PAL.pink, 2, Math.floor(t * 30)); g.globalAlpha = 1; }
  }
};

// =====================================================================
//  10 · MICRORED PRISMA: SOBRECARGA (integración)
//  Un núcleo prismático desbordado que cambia de modo: sol, viento,
//  agua y magma (ataques de las islas anteriores). Luego se equilibra.
// =====================================================================
const PRISMA_MODE_COL = { solar: PAL.sun, viento: '#7FE7FF', agua: '#59C7FF', magma: '#FF7B4A', eq: '#C9B2FF' };
function* prismaMode(b, m, wait) {
  const p = b.lv.player;
  switch (m) {
    case 'solar': for (let k = 0; k < 3; k++) bColumn(b, clamp(p.cx + (k - 1) * 56, ARENA_L + 12, ARENA_R - 12), { w: 18, warn: 0.55 + k * 0.2, dur: 0.3, color: PAL.sun }); break;
    case 'agua': { const hs = shuffle([230, 180, 132]).slice(0, 2); hs.forEach((hy, k) => bBeam(b, hy, ARENA_L, ARENA_R, { h: 10, warn: 0.7 + k * 0.35, dur: 0.4, color: '#59C7FF' })); break; }
    case 'magma': for (let k = 0; k < 4; k++) bLob(b, b.cx, b.cy, clamp(p.cx + rand(-80, 80), ARENA_L + 12, ARENA_R - 12), { kind: 'lava', r: 4, color: '#FF7B4A', reflect: false, time: rand(0.8, 1.2), onLand: s => bHazard(b, { x: s.cx - 9, y: ARENA_FLOOR - 12, w: 18, h: 12 }, { kind: 'fire', warn: 0, dur: 1.0, color: '#FF7B4A' }) }); break;
    case 'viento': {
      const dir = sign(p.cx - b.cx) || 1; AudioSys.sfx('wind');
      let e = 0, n = 0;
      while (e < 1.1) { const dt = yield; e += dt; bPush(b, dir, 50, dt); if (e > n * 0.28 && n < 4) { n++; bShot(b, b.cx, b.cy + (n - 2) * 8, dir * 110, 0, { kind: 'leaf', wave: 8, waveF: 5, r: 3, color: '#66D66A', life: 4 }); } }
      return;
    }
  }
  if (wait) yield* bWait(b, wait);
}
BOSSES.prisma = {
  key: 'prisma', name: 'SOBRECARGA', short: 'a Sobrecarga', title: 'Demasiada energía · Integración', speaker: 'boss_prisma',
  color: '#C9B2FF', w: 32, h: 32, hp: 26, fly: true, homeY: 56, bx: 14, face: [16, 16], inset: 5,
  tags: ['INTEGRACIÓN', 'MICRORED'], concepts: ['microgrid', 'optimization'], codex: 'microred',
  hint: 'Cada modo es un ataque de otra isla: columnas de sol, viento con hojas, chorros de agua y rocas de magma. Cuando baja a EQUILIBRARSE, ¡golpéala!',
  armorHint: 'Está desbordada de energía: espera a que se EQUILIBRE (baja cerca del suelo) para golpear. Las hojas devueltas sí la alcanzan.',
  lines: { hurt: ['¡AY! ¡Eso me descargó un poco!', '¡Menos energía... qué alivio... y qué dolor!'], retry: ['¡OTRA VEZ TODO A LA VEZ!'] },
  gate: () => [['teo', 'Lía... los medidores de la microred están disparados. ¡Algo concentra toda la energía!', 'sorpresa'], ['lia', 'Voy a ver. Si no vuelvo en cinco minutos... espérame seis.', 'decidida']],
  intro: () => [
    ['boss_prisma', '¡DEMASIADA ENERGÍA! ¡NO SÉ DÓNDE PONERLA!', 'sorpresa'],
    ['boss_prisma', 'Soy SOBRECARGA. Sol, viento, agua, magma... ¡TODO A LA VEZ!', 'enojo'],
    ['pix', 'Cambia de modo según su lista. Cada modo es un ataque que ya conoces de otra isla.', 'n'],
    ['lia', 'Integración: reconocer cada parte... y esperar a que se equilibre para actuar.', 'decidida']
  ],
  phase2: () => [['boss_prisma', '¡DOS MODOS A LA VEZ! ¡NO PUEDO PARAR!', 'sorpresa'], ['pix', '¡Se está desbordando! ¡Hay que ayudarla a equilibrarse!', 'decidida']],
  outro: () => [
    ['boss_prisma', '...Ahh. Repartida. Equilibrada. Gracias, Lía.', 'feliz'],
    ['boss_prisma', 'Cada fuente en su momento. Ninguna sola. Todas juntas.', 'feliz'],
    ['pix', 'Ese es el lema de la Microred Prisma. Y ahora también el suyo.', 'feliz']
  ],
  patch: {
    question: 'Son las 21:00: no hay sol y la red tiene déficit. ¿Qué conviene usar primero?',
    code: ['radiacion = 0', 'bateria = 80%', 'demanda > produccion'],
    options: [{ text: 'La batería cargada durante el día' }, { text: 'Más paneles solares', why: 'De noche los paneles no producen: radiación = 0.' }, { text: 'Apagar todo el archipiélago', why: 'Eso es lo que haría Perfect Zero: cero consumo, cero vida.' }],
    answer: 0, explain: 'Integrar es combinar fuentes: lo que sobró de día (batería) cubre la noche.'
  },
  code: b => b.phase === 1
    ? ['PARA CADA modo EN [solar, viento, agua, magma]:', '  SEGÚN modo:', '    solar  → rayos(3)', '    viento → soplar()', '    agua   → chorros(2)', '    magma  → rocas(4)', 'equilibrar()   ← ¡golpea!']
    : ['PARA CADA par EN [(solar, agua), (viento, magma)]:', '  SEGÚN par:', '    solar  → rayos(3)', '    viento → soplar()', '    agua   → chorros(2)', '    magma  → rocas(4)', 'equilibrar()   ← ¡golpea!'],
  vars: b => ['modo = ' + (b.mode === 'eq' ? 'equilibrio' : (b.mode || '—') + (b.mode2 ? ' + ' + b.mode2 : ''))],
  init(b) { b.mode = null; b.mode2 = null; b.rot = 0; },
  idle(b, dt) { b.rot += dt * (b.friendly ? 0.6 : b.stunned ? 0.3 : 2.2); },
  guard: (b, h) => !b.stunned && h.src !== 'reflect',
  *ai(b) {
    const p = b.lv.player, P2 = b.phase === 2;
    const modes = ['solar', 'viento', 'agua', 'magma'];
    const sets = !P2 ? modes.map(m => [m]) : [['solar', 'agua'], ['viento', 'magma']];
    b.line = 0;
    for (const set of sets) {
      b.mode = set[0]; b.mode2 = set[1] || null; b.line = 1;
      yield* bMoveTo(b, clamp(p.cx - b.w / 2 + rand(-60, 60), ARENA_L + 20, ARENA_R - b.w - 20), b.home.y, 130);
      yield* bTele(b, 0.45, PRISMA_MODE_COL[b.mode]);
      for (let k = 0; k < set.length; k++) { b.line = 2 + modes.indexOf(set[k]); yield* prismaMode(b, set[k], k === set.length - 1 ? 1.1 : 0.1); }
    }
    b.line = 6; b.mode = 'eq'; b.mode2 = null; b.expr = 'dizzy';
    yield* bMoveTo(b, clamp(b.x, ARENA_L + 20, ARENA_R - b.w - 20), ARENA_FLOOR - b.h - 16, 140);
    yield* bStun(b, P2 ? 2.1 : 2.5, '¡equilibrando!');
    b.expr = 'n';
    yield* bMoveTo(b, b.x, b.home.y, 120);
  },
  draw(b, g, x, y) {
    const fr = b.friendly, t = b.t, c0 = x + 16, c1 = y + 16;
    const col = fr ? hsl(t * 60, 80, 72) : PRISMA_MODE_COL[b.mode] || '#C9B2FF';
    // esquirlas girando
    for (let i = 0; i < 6; i++) {
      const a = (b.rot || 0) + i * Math.PI / 3, r = 15, sx = c0 + Math.cos(a) * r, sy = c1 + Math.sin(a) * r * 0.8;
      const sc = fr ? hsl(i * 60 + t * 40, 85, 70) : i % 2 ? col : '#FFFFFF';
      pline(g, sx, sy - 3, sx + 2, sy, sc); pline(g, sx + 2, sy, sx, sy + 3, sc); pline(g, sx, sy + 3, sx - 2, sy, sc); pline(g, sx - 2, sy, sx, sy - 3, sc);
    }
    // núcleo (rombo)
    for (let k = 0; k <= 11; k++) { const w = 11 - k; rect(g, c0 - w, c1 - k, w * 2 + 1, 1, k === 11 ? OUTLINE : col); rect(g, c0 - w, c1 + k, w * 2 + 1, 1, k === 11 ? OUTLINE : shade(col, -0.25)); }
    rect(g, c0 - 9, c1 - 1, 18, 1, shade(col, 0.4));
    // cara ansiosa
    const ex = fr ? 'happy' : b.expr === 'n' ? 'wide' : b.expr;
    bossEyes(g, c0 - 5, c1 - 3, ex, 2, 8);
    if (fr) { rect(g, c0 - 2, c1 + 4, 5, 1, OUTLINE); }
    else if (b.expr !== 'dizzy') { for (let k = 0; k < 6; k++) px(g, c0 - 3 + k, c1 + 4 + (k % 2), OUTLINE); }
    else { px(g, c0, c1 + 4, OUTLINE); }
    // chispas de sobrecarga
    if (!fr && !b.portrait && !b.stunned) for (let k = 0; k < 2; k++) { const a = rand(0, 6.28), r0 = 12, r1 = 20; pline(g, c0 + Math.cos(a) * r0, c1 + Math.sin(a) * r0, c0 + Math.cos(a + 0.3) * r1, c1 + Math.sin(a + 0.3) * r1, '#FFFFFF'); }
  }
};

// ---------- Voces, Bestiario y arenas ----------
for (const k in BOSSES) {
  const D = BOSSES[k];
  SPEAKERS['boss_' + k] = { name: D.name, color: D.color, voice: { puerto: 140, valle: 180, solaria: 300, aeris: 700, hydria: 240, bioloop: 160, gea: 90, h2: 200, bateria: 520, prisma: 800 }[k] || 200 };
  D.lines.retry = D.lines.retry || ['¡Otra vez tú!'];
  CODEX['b_' + k] = {
    cat: 'bestiario', title: D.name, short: D.title, portrait: 'boss_' + k,
    sectionsFn: () => [['Su programa', D.code({ phase: 1, patched: false, vars: { nums: [7, 3, 9, 5] }, st: 'REPOSO', parts: [], line: -1 })], ['Cómo depurarlo', D.hint], ['Después', flag('boss_' + k) ? 'Depurado: ahora ayuda a su isla. Puedes volver a enfrentarlo como entrenamiento desde la salida de su arena en el modo docente.' : 'Te espera en la salida de su isla.']]
  };
  bossArena(k, D);
}
Object.assign(CODEX, {
  e_lumisable: {
    cat: 'bestiario', title: 'Lumisable', short: 'Lumi concentra su luz en una hoja. No destruye: depura.', icon: 'star',
    sections: [['Ataque', 'Tres tajos seguidos hacen un combo. Con ↑ golpeas hacia arriba. En el aire, ↓ + ataque rebota (pogo) sobre enemigos, proyectiles y pinchos.'], ['Pulso', 'Mantén el ataque y suéltalo: una onda de luz que atraviesa enemigos (30 de energía).'], ['Parada', 'Golpea un proyectil justo cuando llega: vuelve hacia quien lo lanzó. Si lo haces al instante, ¡parada perfecta! Algunas embestidas también se paran.'], ['Recarga', 'Quieta, mantén ↓: con 50 de energía Lumi recupera una célula. La energía se gana golpeando y con orbes.'], ['Lente', 'Con la Lente Debug activa, cada golpe es CRÍTICO (+1 de daño) y ves el programa de los jefes.']]
  },
  e_bugglin: { cat: 'bestiario', title: 'Bugglin', short: 'Escarabajo glitch que intercambia el orden de las cosas.', icon: 'bug', sections: [['Algoritmo', ['REPETIR:', '  caminar()', '  SI pared O borde: girar()']], ['Cómo depurarlo', 'Salta encima o dos tajos.']] },
  e_hopper: { cat: 'bestiario', title: 'Bit Saltarín', short: 'Una bolita eléctrica con antena. Muy entusiasta.', icon: 'bug', sections: [['Algoritmo', ['SI Lía cerca:', '  agacharse()', '  saltar_hacia(Lía)']], ['Cómo depurarlo', 'Cuando se agacha, va a saltar: apártate y golpéalo al aterrizar.'], ['Frase', '"¡Bip! ¡BIP BIP!"']] },
  e_flyer: { cat: 'bestiario', title: 'Zumbyte', short: 'Abejita digital que ataca en picado.', icon: 'bug', sections: [['Algoritmo', ['MIENTRAS vuela:', '  SI Lía debajo:', '    temblar(); picado()']], ['Cómo depurarlo', 'Tiembla antes del picado: esquívalo y golpéalo mientras vuelve.'], ['Frase', '"Bzzz... ¡objetivo!"']] },
  e_charger: { cat: 'bestiario', title: 'Toro-Ohm', short: 'Un transformador con cuernos-enchufe y mucho genio.', icon: 'bolt', sections: [['Algoritmo', ['SI te ve:', '  resoplar()', '  cargar() HASTA chocar']], ['Cómo depurarlo', 'Golpéalo justo cuando llega (¡PARADA!) o deja que choque contra una pared: queda aturdido.'], ['Frase', '"¡MÁXIMA POTENCIA!"']] },
  e_turret: { cat: 'bestiario', title: 'Torretín', short: 'Torreta gruñona con muy poca puntería (según ella, mucha).', icon: 'eye', sections: [['Algoritmo', ['REPETIR:', '  apuntar(Lía)', '  cargar()', '  disparar()']], ['Cómo depurarlo', 'Devuelve su disparo con el sable: ¡se lo come ella!'], ['Frase', '"Objetivo... ¿adquirido?"']] },
  e_drainer: { cat: 'bestiario', title: 'Drainer', short: 'Medusa que absorbe energía.', icon: 'bug', sections: [['Algoritmo', ['MIENTRAS toca a Lía:', '  energia ← energia − 60/s']], ['Cómo depurarlo', 'Dos tajos o PRIORITY DASH.']] },
  e_chaos: { cat: 'bestiario', title: 'Chaos Packet', short: 'Cubo saltarín que desordena listas.', icon: 'bug', sections: [['Algoritmo', ['REPETIR: rebotar()', 'SI toca a Lía: barajar(mochila)']], ['Cómo depurarlo', 'Un tajo basta.']] },
  e_shadowif: { cat: 'bestiario', title: 'Shadow If', short: 'Rombo que invierte las condiciones.', icon: 'bug', sections: [['Algoritmo', ['SI Lía cerca:', '  invertir(izquierda, derecha)']], ['Cómo depurarlo', 'IF SHIELD lo bloquea; dos tajos lo depuran.']] },
  e_loopling: { cat: 'bestiario', title: 'Loopling', short: 'Un bucle sin salida con forma de ovillo.', icon: 'bug', sections: [['Algoritmo', ['MIENTRAS VERDADERO:', '  girar()']], ['Cómo depurarlo', 'No sirve golpearlo: activa la Lente y toca su nodo SALIDA.']] },
  e_overflow: { cat: 'bestiario', title: 'Overflow', short: 'Burbuja que crece hasta desbordarse.', icon: 'bug', sections: [['Algoritmo', ['tamaño ← tamaño + 1', 'SI tamaño > máximo: estallar()']], ['Cómo depurarlo', 'Grande: cada tajo libera capacidad (o úsalo de trampolín). Pequeño: se depura.']] }
});
