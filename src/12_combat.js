// =====================================================================
//  COMBATE: el LUMISABLE de Lía (Lumi concentra su luz en una hoja).
//  Combo de 3 tajos, tajo hacia arriba, rebote hacia abajo (pogo), pulso
//  cargado, parada de proyectiles, recarga de células, pausa de impacto,
//  botín y enemigos carismáticos que se «depuran» en lugar de destruirse.
// =====================================================================

// ---------- Tajos: duración, ventana activa, arco (grados; 0 = delante, − = arriba) y caja de golpe ----------
// box = [dx, dy, w, h] respecto al centro de Lía (cx) y su parte superior (y), mirando a la derecha
const SABER = {
  f1: { dur: 0.25, act: [0.02, 0.12], a0: -120, a1: 40, box: [0, -6, 25, 26], dmg: 1, kb: 120, len: 15 },
  f2: { dur: 0.25, act: [0.02, 0.12], a0: 50, a1: -105, box: [0, -6, 25, 26], dmg: 1, kb: 120, len: 15 },
  f3: { dur: 0.34, act: [0.04, 0.17], a0: -165, a1: 75, box: [-4, -9, 32, 32], dmg: 2, kb: 220, len: 19 },
  up: { dur: 0.27, act: [0.02, 0.14], a0: 15, a1: -195, box: [-14, -22, 28, 26], dmg: 1, kb: 80, len: 15 },
  down: { dur: 0.27, act: [0.01, 0.16], a0: 10, a1: 170, box: [-12, 14, 24, 24], dmg: 1, kb: 50, len: 15 },
  // poderes: torbellino (bucle de tajos alrededor) y embestida (pipeline correr → impulso → tajo)
  spin: { dur: 0.42, act: [0.02, 0.36], a0: -90, a1: 630, box: [-22, -12, 44, 40], dmg: 2, kb: 160, len: 16 },
  rush: { dur: 0.3, act: [0.0, 0.26], a0: -20, a1: 20, box: [-4, -4, 34, 26], dmg: 2, kb: 220, len: 18 },
  // BARRIDA (↓ + ataque en el suelo): se desliza agachada con el sable a ras de suelo
  slide: { dur: 0.42, act: [0.02, 0.34], a0: 12, a1: -4, box: [-2, 0, 30, 14], dmg: 1, kb: 170, len: 16 },
  // GANCHO (↑ + ataque en el suelo): salta hacia arriba con un arco de luz en forma de gancho
  hook: { dur: 0.38, act: [0.03, 0.28], a0: 60, a1: -215, box: [-8, -28, 30, 44], dmg: 2, kb: 120, len: 18 }
};
const CHARGE_TIME = 0.65, PASSIVE_ENERGY_CAP = 60;
// mejoras de la Forja del Lumisable (cada una es un concepto: ver 29_forge.js)
const forged = k => !!(G.save.forge && G.save.forge[k]);
// coste del pulso y de la recarga (la forja los abarata)
const pulseCost = () => forged('pulse') ? 20 : 30;
const healCost = () => forged('cells') ? 40 : 50;
const healTime = () => forged('cells') ? 0.7 : 0.9;

// color del sable: es la luz de Lumi (cambia con su emoción)
function saberColor(lv) {
  if (lv && lv.player && lv.player.overload) return Math.floor(Time.t * 10) % 2 ? '#FFFFFF' : PAL.coral;
  const c = lv && lv.lumi ? lv.lumi.color : PAL.sun; return typeof c === 'string' && c[0] === '#' && c.length === 7 ? c : PAL.sun;
}

// ---------- Pausa de impacto: congela el mundo unos milisegundos para que el golpe «pese» ----------
function hitstop(lv, t) { if (lv) lv.hitstop = Math.max(lv.hitstop || 0, t); }

// ---------- Lía: sable, pulso, recarga ----------
Player.prototype.initCombat = function () {
  this.atk = null; this.atkCD = 0; this.combo = 0; this.comboT = 0; this.atkBuf = 0;
  this.chargeT = 0; this.chargeReady = false; this.healT = 0; this.pogoT = 0;
};
Player.prototype.saberPivot = function (kind) {
  const f = this.atk ? this.atk.face : this.face;
  if (kind === 'slide') return { x: this.cx + f * 4, y: this.y + 8 };
  if (kind === 'hook') return { x: this.cx + f * 3, y: this.y + 6 };
  if (kind === 'up') return { x: this.cx + f * 2, y: this.y + 7 };
  if (kind === 'down') return { x: this.cx + f * 2, y: this.y + 12 };
  return { x: this.cx + f * 3, y: this.y + 10 };
};
Player.prototype.atkBox = function () {
  const a = this.atk, b = a.def.box, ext = forged('reach') ? 5 : 0;
  // alcance ← alcance + 5 (forja): la caja crece hacia delante
  const w = b[2] + ext, x = a.face > 0 ? this.cx + b[0] : this.cx - b[0] - w;
  return { x, y: this.y + b[1], w, h: b[3] };
};
Player.prototype.startAttack = function (kind) {
  const def = SABER[kind];
  this.atk = { kind, def, t: 0, hits: new Set(), face: this.face, landed: false };
  this.atkCD = kind === 'f3' ? def.dur : def.dur * 0.62;
  this.comboT = def.dur + 0.3;
  if (kind === 'f3') this.comboT = 0;
  AudioSys.sfx('slash', kind === 'f3' ? 3 : kind === 'f2' ? 2 : 1);
  if (kind === 'f3' && this.onGround) this.vx += this.face * 70;
  this.lv.lumi.slashT = 0.3;
};
Player.prototype.updateCombat = function (dt, control) {
  const lv = this.lv;
  this.atkCD = Math.max(0, this.atkCD - dt); this.comboT = Math.max(0, this.comboT - dt); this.atkBuf = Math.max(0, this.atkBuf - dt);
  this.pogoT = Math.max(0, this.pogoT - dt);
  if (this.atk) {
    const a = this.atk;
    a.t += dt;
    if (a.t >= a.def.act[0] && a.t <= a.def.act[1]) this.resolveHits();
    if (a.t >= a.def.dur) this.atk = null;
  }
  if (!control || this.climbing) { this.chargeT = 0; this.chargeReady = false; this.healT = 0; if (this.climbing) this.atk = null; return; }
  const hit = Input.hit('attack');
  // el botón de ataque sirve para hablar/usar si hay algo cerca y ningún peligro
  const talkInstead = hit && lv.nearby && !lv.dangerNear();
  if (hit && !talkInstead) this.atkBuf = 0.14;
  if (this.atkBuf > 0 && this.atkCD <= 0 && (!this.atk || this.atk.t > this.atk.def.dur * 0.62)) {
    this.atkBuf = 0;
    const up = Input.down('up'), down = Input.down('down');
    let kind;
    if (down && !this.onGround && !this.inWater) kind = 'down';
    // BARRIDA: ↓ + ataque en el suelo
    else if (down && this.onGround && !this.inWater) kind = 'slide';
    // GANCHO: ↑ + ataque en el suelo (una vez por salto); en el aire, tajo hacia arriba
    else if (up && this.onGround && !this.inWater) kind = 'hook';
    else if (up && !this.inWater) kind = 'up';
    // TAJO TORBELLINO: en el aire con SALTO mantenido
    else if (hasPower('spin') && !this.onGround && !this.inWater && Input.down('jump')) kind = 'spin';
    // EMBESTIDA DE LUZ: corriendo por el suelo
    else if (hasPower('rush') && this.onGround && !this.inWater && Input.down('run') && Math.abs(this.vx) > 40) kind = 'rush';
    else { this.combo = this.comboT > 0 ? (this.combo % 3) + 1 : 1; kind = 'f' + this.combo; }
    this.startAttack(kind);
    if (kind === 'spin') { this.vy = Math.min(this.vy, -40); AudioSys.sfx('wind'); }
    if (kind === 'rush') { this.dashT = 0.24; this.dashDir = this.face; this.inv = Math.max(this.inv, 0.35); AudioSys.sfx('dash'); }
    if (kind === 'slide') { this.setCrouch(true); this.vx = this.face * 230; AudioSys.sfx('dash'); Particles.burst(this.cx - this.face * 4, this.y + this.h, 8, { color: '#FFF3D7', min: 20, max: 60, angle: Math.PI + (this.face > 0 ? 0.3 : -0.3), spread: 0.8, lmax: 0.35 }); }
    if (kind === 'hook') { this.setCrouch(false); this.vy = -PHYS.jumpV * 1.02; this.onGround = false; this.coyote = 0; this.vx = this.face * 70; AudioSys.sfx('jump'); }
    this.chargeT = 0; this.chargeReady = false; this.healT = 0;
  }
  // pulso cargado: mantener el ataque tras el tajo
  if (Input.down('attack') && !talkInstead && !this.inWater) {
    const before = this.chargeT;
    this.chargeT += dt;
    if (this.chargeT > 0.2) {
      if (Math.random() < 0.5) { const an = rand(0, 6.28), r = rand(10, 18); const pv = this.saberPivot('f1'); Particles.spawn({ x: pv.x + Math.cos(an) * r, y: pv.y + Math.sin(an) * r, vx: -Math.cos(an) * r * 3, vy: -Math.sin(an) * r * 3, life: 0.3, type: 'dot', color: saberColor(lv) }); }
      if (Math.floor(before * 10) !== Math.floor(this.chargeT * 10)) AudioSys.sfx('chargeUp', clamp(this.chargeT / CHARGE_TIME, 0, 1));
    }
    if (!this.chargeReady && this.chargeT >= CHARGE_TIME) {
      if (this.energy >= pulseCost()) { this.chargeReady = true; AudioSys.sfx('ok'); Particles.burst(this.cx, this.y + 10, 10, { color: saberColor(lv), min: 20, max: 50, type: 'star', lmax: 0.4 }); }
      else if (!this.noEnergyMsg) { this.noEnergyMsg = true; Particles.text(this.cx, this.y - 10, 'energía < ' + pulseCost(), PAL.coral); }
    }
  } else {
    if (this.chargeReady && this.energy >= pulseCost()) this.firePulse();
    this.chargeT = 0; this.chargeReady = false; this.noEnergyMsg = false;
  }
  // recarga de célula: quieta en el suelo, mantener ↓ (sin saltar)
  const canHeal = this.onGround && !this.inWater && Input.down('down') && !Input.down('jump') && Math.abs(this.vx) < 12 && !this.atk && this.cells < this.maxCells && this.energy >= healCost();
  if (canHeal) {
    this.healT += dt;
    if (Math.random() < 0.6) { const an = rand(0, 6.28); Particles.spawn({ x: this.cx + Math.cos(an) * 18, y: this.y + 10 + Math.sin(an) * 18, vx: -Math.cos(an) * 50, vy: -Math.sin(an) * 50, life: 0.35, type: 'dot', color: PAL.sun }); }
    if (this.healT >= healTime()) {
      this.healT = 0; this.cells++; this.energy -= healCost();
      AudioSys.sfx('heal'); Particles.burst(this.cx, this.y + 8, 16, { colors: [PAL.sun, PAL.white, PAL.orange], min: 20, max: 60, type: 'star' });
      Particles.text(this.cx, this.y - 8, '+1 célula', PAL.sun);
      lv.lumi.mood = 'happy'; lv.lumi.moodT = 1.5;
    }
  } else this.healT = 0;
  if (this.cells < this.maxCells && this.energy >= healCost() && !flag('healTip') && !Cut.active) {
    setFlag('healTip');
    Toast.show('Quieta, mantén ' + (Input.lastDevice === 'touch' ? '▼' : bindName('down')) + ': Lumi recarga una célula (' + healCost() + ' de energía)', PAL.sun, 4.5);
  }
};
// resuelve los golpes del tajo activo
Player.prototype.resolveHits = function () {
  const lv = this.lv, a = this.atk, d = a.def;
  const box = this.atkBox();
  let landed = false, blocked = false;
  for (const e of lv.entities) {
    if (e.dead || !e.onHit || a.hits.has(e)) continue;
    const r = e.hitRect ? e.hitRect() : e;
    if (!r || !rectHit(box, r)) continue;
    a.hits.add(e);
    // parada: golpear justo al principio del tajo contra un ataque que se puede detener
    // Filtro SI (forja): la ventana de parada es más amplia
    if (e.parryWindow && e.parryWindow() && a.t < (forged('parry') ? 0.2 : 0.13)) { e.onParry(this); parryFx(this, e); landed = true; continue; }
    const crit = lv.lensT > 0.5 && e.weakPoint !== false;
    // Tajo final (forja): el tercer tajo del combo pesa más
    const bonus = (a.kind === 'f3' && forged('finisher') ? 1 : 0) + (this.overload ? 1 : 0);
    const res = e.onHit({ dmg: d.dmg + bonus, dir: a.face, kind: a.kind, kb: d.kb, crit, t: a.t, src: 'saber' });
    if (res) { landed = true; if (res === 'block') blocked = true; }
  }
  // rebote sobre pinchos con el tajo hacia abajo
  if (a.kind === 'down' && !landed) {
    const x0 = Math.floor(box.x / TILE), x1 = Math.floor((box.x + box.w) / TILE), y0 = Math.floor((this.y + this.h) / TILE), y1 = Math.floor((box.y + box.h) / TILE);
    for (let ty = y0; ty <= y1 && !landed; ty++) for (let tx = x0; tx <= x1; tx++) { const t = lv.tile(tx, ty), dd = lv.dyn(t); if (t === '^' || (dd && dd.hazard && dd.hazard(lv))) { landed = true; Particles.burst(tx * TILE + 8, ty * TILE + 8, 6, { color: saberColor(lv), min: 20, max: 50 }); break; } }
  }
  if (!landed) return;
  if (!a.landed) {
    a.landed = true;
    if (!blocked) this.energy = Math.min(100, this.energy + (forged('energy') ? 12 : 8));
    if (a.kind === 'down') {
      // POGO: rebote hacia arriba
      this.vy = -PHYS.jumpV * 0.95; this.gliding = false; this.pogoT = 0.2; this.coyote = 0;
      AudioSys.sfx('jump');
    } else if (blocked) { this.vx = -a.face * 150; if (!this.onGround) this.vy = Math.min(this.vy, -60); }
    else if (this.onGround) this.vx -= a.face * 45;
    else if (a.kind === 'up') this.vy = Math.max(this.vy, 20);
  }
};
function parryFx(p, e) {
  const lv = p.lv;
  AudioSys.sfx('parry'); hitstop(lv, 0.12); FX.flash('#FFFFFF', 0.25); FX.shake(2, 0.15);
  p.inv = Math.max(p.inv, 0.4); p.energy = Math.min(100, p.energy + 12);
  const x = e.x + (e.w || 10) / 2, y = e.y;
  Particles.text(x, y - 8, '¡PARADA!', PAL.sun);
  Particles.burst(x, y + 6, 14, { colors: [PAL.white, saberColor(lv), PAL.sun], min: 40, max: 110, type: 'spark', lmax: 0.35 });
  G.save.stats.parries = (G.save.stats.parries || 0) + 1; achieve('parry');
}
Player.prototype.firePulse = function () {
  const lv = this.lv;
  this.energy -= pulseCost();
  const dir = this.face;
  lv.addEntity(new LumenWave(lv, dir > 0 ? this.x + this.w : this.x - 14, this.y - 1, dir, saberColor(lv)));
  // PULSO DOBLE: la misma función, llamada hacia atrás
  if (hasPower('twin')) lv.addEntity(new LumenWave(lv, dir > 0 ? this.x - 14 : this.x + this.w, this.y - 1, -dir, saberColor(lv)));
  AudioSys.sfx('pulse'); FX.shake(1, 0.12);
  this.vx -= dir * 60;
  this.atk = null; this.startAttack('f3'); this.atk.hits = new Set(lv.entities); // solo animación: el pulso hace el daño
};
// dibujo del sable, su estela y el sable cargando
Player.prototype.drawSaber = function (g, cx, cy) {
  const col = saberColor(this.lv), a = this.atk;
  if (a) {
    const d = a.def, k = clamp(a.t / (d.act[1] + 0.03), 0, 1), e = a.kind === 'spin' ? k : easeOut(k);
    const ang = d.a0 + (d.a1 - d.a0) * e;
    const pv = this.saberPivot(a.kind);
    const X = Math.round(pv.x - cx), Y = Math.round(pv.y - cy);
    const tail = d.act[1] + 0.03, fade = a.t > tail ? clamp(1 - (a.t - tail) / Math.max(0.01, d.dur - tail), 0, 1) : 1;
    // estela: sector desde el comienzo del arco hasta la hoja, más tenue cuanto más atrás
    const span = ang - d.a0, steps = Math.max(2, Math.ceil(Math.abs(span) / 4));
    const edge = shade(col, -0.45);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, aa = (d.a0 + span * t) * Math.PI / 180, c = Math.cos(aa) * a.face, s = Math.sin(aa);
      g.globalAlpha = (0.15 + 0.75 * t * t) * fade;
      for (let r = d.len - 6; r <= d.len + 2; r++) px(g, X + c * r, Y + s * r, r === d.len + 2 ? edge : r >= d.len ? '#FFFFFF' : col);
    }
    // gancho: media luna ancha y brillante que sube con Lía
    if (a.kind === 'hook') for (let i = 0; i <= steps; i++) {
      const t = i / steps, aa = (d.a0 + span * t) * Math.PI / 180, c = Math.cos(aa) * a.face, s = Math.sin(aa), wv = Math.sin(t * Math.PI);
      g.globalAlpha = (0.25 + 0.6 * t) * fade;
      for (let r = d.len + 3; r <= d.len + 3 + Math.round(wv * 4); r++) px(g, X + c * r, Y + s * r, r === d.len + 3 ? '#FFFFFF' : col);
    }
    // barrida: estela de polvo y luz a ras de suelo
    if (a.kind === 'slide' && Math.random() < 0.7) Particles.spawn({ x: this.cx - a.face * 6, y: this.y + this.h - 1, vx: -a.face * rand(20, 60), vy: rand(-30, -5), life: 0.35, type: 'fade', size: 2, color: Math.random() < 0.5 ? '#FFF3D7' : col });
    g.globalAlpha = fade;
    this.drawBlade(g, X, Y, ang * Math.PI / 180, a.face, d.len + (forged('reach') ? 3 : 0), col, 1);
    g.globalAlpha = 1;
  } else if (this.chargeT > 0.15) {
    // sable sostenido hacia atrás mientras carga
    const pv = this.saberPivot('f1'), X = Math.round(pv.x - cx), Y = Math.round(pv.y - cy);
    const pulse = this.chargeReady ? 0.6 + Math.sin(this.lv.time * 30) * 0.4 : clamp(this.chargeT / CHARGE_TIME, 0.3, 1);
    g.globalAlpha = pulse;
    this.drawBlade(g, X, Y, 150 * Math.PI / 180, this.face, 13, this.chargeReady ? PAL.white : col, 1);
    if (this.chargeReady) { g.globalAlpha = 0.35; pring(g, this.cx - cx, this.y + 10 - cy, 13 + Math.floor(this.lv.time * 20) % 3, col); }
    g.globalAlpha = 1;
  }
  if (this.healT > 0) {
    const k = this.healT / healTime();
    g.globalAlpha = 0.5; pring(g, this.cx - cx, this.y + 10 - cy, Math.round(20 - k * 12), PAL.sun); g.globalAlpha = 1;
  }
};
Player.prototype.drawBlade = function (g, X, Y, rad, face, len, col) {
  const c = Math.cos(rad) * face, s = Math.sin(rad);
  const nx = -s, ny = c; // perpendicular
  // contorno oscuro: la hoja se lee también sobre fondos claros
  const a0 = g.globalAlpha; g.globalAlpha = a0 * 0.7;
  for (let r = 2; r <= len + 1; r++) { px(g, X + c * r + nx * 2, Y + s * r + ny * 2, OUTLINE); px(g, X + c * r - nx * 2, Y + s * r - ny * 2, OUTLINE); }
  g.globalAlpha = a0;
  for (let r = 3; r <= len; r++) { px(g, X + c * r + nx, Y + s * r + ny, col); px(g, X + c * r - nx, Y + s * r - ny, col); }
  for (let r = 3; r <= len; r++) px(g, X + c * r, Y + s * r, '#FFFFFF');
  px(g, X + c * (len + 1), Y + s * (len + 1), col);
  rect(g, X - 1, Y - 1, 3, 3, '#3A4068'); px(g, X, Y, PAL.sun);
};

// ---------- Nivel: peligro cercano y utilidades ----------
Level.prototype.dangerNear = function (r = 110) {
  const p = this.player;
  for (const e of this.entities) if (e.hostile && !e.dead && Math.abs(e.x + (e.w || 0) / 2 - p.cx) < r && Math.abs(e.y + (e.h || 0) / 2 - p.y - 10) < 80) return true;
  return false;
};

// ---------- Dibujo con destello blanco al recibir un golpe ----------
const FlashBuf = { c: null };
function drawEntity(g, e, cx, cy) {
  if (!(e.flashT > 0)) { e.draw(g, cx, cy); return; }
  if (!FlashBuf.c) FlashBuf.c = makeCanvas(W, H);
  const fg = FlashBuf.c.g;
  fg.globalCompositeOperation = 'source-over'; fg.globalAlpha = 1; fg.clearRect(0, 0, W, H);
  e.draw(fg, cx, cy);
  fg.globalCompositeOperation = 'source-atop'; fg.globalAlpha = 0.85; fg.fillStyle = '#FFFFFF'; fg.fillRect(0, 0, W, H);
  fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over';
  g.drawImage(FlashBuf.c, 0, 0);
}
// vida, sorpresa «!» y aturdimiento sobre los enemigos
function drawFoeUI(g, e, cx, cy) {
  const x = Math.round(e.x + e.w / 2 - cx), y = Math.round(e.y - cy);
  if (e.excl > 0) { const bob = Math.round(Math.sin(e.excl * 20)); drawText(g, '!', x, y - 13 + bob, PAL.sun, { align: 'center', outline: PAL.ink }); }
  if (e.stunT > 0) for (let i = 0; i < 3; i++) { const a = e.t * 7 + i * 2.1; px(g, x + Math.cos(a) * 7, y - 3 + Math.sin(a) * 2, PAL.sun); }
  if (e.hpShowT > 0 && e.maxHp > 1 && !e.dead) {
    g.globalAlpha = clamp(e.hpShowT * 2, 0, 1);
    const n = e.maxHp, w = n * 4 - 1, x0 = x - Math.floor(w / 2);
    rect(g, x0 - 1, y - 6, w + 2, 4, PAL.ink);
    for (let i = 0; i < n; i++) rect(g, x0 + i * 4, y - 5, 3, 2, i < e.hp ? PAL.coral : '#3A4068');
    g.globalAlpha = 1;
  }
}

// ---------- Movimiento con gravedad y colisiones para enemigos y objetos ----------
function bodyMove(e, dt, grav = 800) {
  const lv = e.lv;
  e.vy = Math.min(e.vy + grav * dt, 320);
  const vx = e.vx + (e.physKnock ? (e.kbx || 0) : 0);
  e.hitWall = false;
  e.x += vx * dt;
  let hit = Player.prototype.tileRectSolid.call(e, e.x, e.y, e.w, e.h);
  if (hit) { if (vx > 0) e.x = hit.tx * TILE - e.w; else if (vx < 0) e.x = (hit.tx + 1) * TILE; e.hitWall = true; }
  if (e.x < 0) { e.x = 0; e.hitWall = true; } if (e.x + e.w > lv.pw) { e.x = lv.pw - e.w; e.hitWall = true; }
  const prevB = e.y + e.h;
  e.y += e.vy * dt; e.onGround = false;
  hit = Player.prototype.tileRectSolid.call(e, e.x, e.y, e.w, e.h);
  if (hit) { if (e.vy > 0) { e.y = hit.ty * TILE - e.h; e.onGround = true; } else e.y = (hit.ty + 1) * TILE; e.vy = 0; }
  else if (e.vy >= 0) {
    const ty = Math.floor((e.y + e.h - 0.01) / TILE);
    const x0 = Math.floor(e.x / TILE), x1 = Math.floor((e.x + e.w - 0.01) / TILE);
    for (let tx = x0; tx <= x1; tx++) if (lv.oneWayAt(tx, ty) && prevB <= ty * TILE + 1) { e.y = ty * TILE - e.h; e.vy = 0; e.onGround = true; break; }
  }
}
// ¿hay suelo delante? (para no caer por los bordes)
function groundAhead(e, dir) {
  const lv = e.lv, ax = dir > 0 ? e.x + e.w + 1 : e.x - 1, ty = Math.floor((e.y + e.h + 2) / TILE), tx = Math.floor(ax / TILE);
  return lv.solidAt(tx, ty) || lv.oneWayAt(tx, ty);
}
function wallAhead(e, dir) {
  const ax = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  return e.lv.solidAt(Math.floor(ax / TILE), Math.floor((e.y + e.h / 2) / TILE));
}

// ---------- Pulso Lumen (ataque cargado) ----------
class LumenWave extends Entity {
  constructor(lv, x, y, dir, col) {
    // RAYO SOLAR: más grande y el doble de daño
    const big = hasPower('sunbeam');
    super(lv, x, big ? y - 6 : y, 14, big ? 34 : 22); this.dir = dir; this.col = col; this.life = 0.8; this.hits = new Set(); this.layer = 1; this.t = 0;
    this.dmg = big ? 6 : 3; this.big = big; this.seek = hasPower('seeker'); this.vy = 0;
    if (this.seek) this.life = 1.1;
  }
  update(dt) {
    super.update(dt); this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.dir * 260 * dt;
    // RAYO BUSCADOR: se curva hacia el enemigo más cercano que tenga delante
    if (this.seek) {
      let best = null, bd = 240;
      for (const e of this.lv.entities) {
        if (e.dead || !e.hostile || !e.onHit || e instanceof Shot || this.hits.has(e)) continue;
        const ex = e.x + (e.w || 0) / 2, ey = e.y + (e.h || 0) / 2, dx = (ex - this.x - 7) * this.dir;
        if (dx < -10) continue;
        const d = Math.hypot(ex - this.x - 7, ey - this.y - this.h / 2); if (d < bd) { bd = d; best = { ex, ey }; }
      }
      if (best) this.vy = approach(this.vy, clamp(best.ey - this.y - this.h / 2, -1, 1) * 160, 520 * dt); else this.vy *= 0.9;
      this.y += this.vy * dt;
    }
    const lv = this.lv, fx = this.dir > 0 ? this.x + this.w : this.x;
    if (lv.solidAt(Math.floor(fx / TILE), Math.floor((this.y + this.h / 2) / TILE))) { Particles.burst(fx, this.y + 11, 12, { color: this.col, min: 30, max: 80, type: 'star' }); this.dead = true; return; }
    for (const e of lv.entities) {
      if (e === this || e.dead || !e.onHit || this.hits.has(e)) continue;
      const r = e.hitRect ? e.hitRect() : e; if (!r || !rectHit(this, r)) continue;
      this.hits.add(e);
      if (e instanceof Shot) { if (!e.friendly) e.pop(); continue; }
      e.onHit({ dmg: this.dmg, dir: this.dir, kind: 'pulse', kb: 170, crit: lv.lensT > 0.5, src: 'pulse' });
    }
    if (Math.random() < 0.8) Particles.spawn({ x: this.x + 7 - this.dir * 6, y: this.y + rand(2, 20), vx: -this.dir * 30, life: 0.3, type: 'fade', size: 2, color: this.col });
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), d = this.dir;
    const a = clamp(this.life / 0.3, 0, 1);
    g.globalAlpha = a;
    const n = this.h;
    if (this.big) { g.globalAlpha = a * 0.35; rect(g, x - 2, y, 18, n, PAL.sun); g.globalAlpha = a; }
    for (let i = 0; i < n; i++) {
      const bow = Math.round(Math.sin(i / (n - 1) * Math.PI) * (this.big ? 9 : 6));
      const bx = d > 0 ? x + 4 + bow : x + 9 - bow;
      rect(g, bx - d * 2, y + i, 2, 1, this.col); px(g, bx, y + i, '#FFFFFF'); px(g, bx + d, y + i, this.col);
    }
    g.globalAlpha = 1;
  }
  light() { return { x: this.x + 7, y: this.y + this.h / 2, r: this.big ? 80 : 55, c: this.big ? PAL.sun : this.col }; }
}

// ---------- Proyectiles (de enemigos y jefes; casi todos se pueden devolver con el sable) ----------
class Shot extends Entity {
  constructor(lv, x, y, vx, vy, o = {}) {
    const r = o.r || 3;
    super(lv, x - r, y - r, r * 2, r * 2);
    this.vx = vx; this.vy = vy; this.o = o; this.kind = o.kind || 'orb'; this.col = o.color || PAL.coral;
    this.grav = o.grav || 0; this.life = o.life || 5; this.reflectable = o.reflect !== false; this.friendly = false; this.hostile = true;
    this.dmg = o.dmg || 1; this.owner = o.owner || null; this.bossSpawn = !!o.boss; this.warn = o.warn || 0; this.layer = 1;
    if (o.w) { this.w = o.w; this.x = x - o.w / 2; }
    if (o.h) { this.h = o.h; this.y = y - o.h / 2; }
    this.baseY = this.y; this.weakPoint = false; this.t = 0; // el reloj empieza en 0 (bumerán, estelas)
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  update(dt) {
    super.update(dt);
    if (this.warn > 0) { this.warn -= dt; return; }
    this.life -= dt; if (this.life <= 0) { this.pop(true); return; }
    const lv = this.lv, o = this.o;
    // ancla: vuelve a su dueño como un bumerán
    if (o.boomerang && this.t > o.boomerang && this.owner && !this.friendly) {
      const tx = this.owner.x + this.owner.w / 2, ty = this.owner.y + this.owner.h * 0.6, d = dist(this.cx, this.cy, tx, ty);
      const sp = Math.max(160, Math.abs(this.vx));
      if (d < 12 || this.owner.dead) { this.dead = true; return; }
      this.vx = (tx - this.cx) / d * sp; this.vy = (ty - this.cy) / d * sp * (o.ground ? 0 : 1);
    }
    this.vy += this.grav * dt;
    this.x += this.vx * dt;
    if (o.wave) this.y = this.baseY + Math.sin(this.t * (o.waveF || 5)) * o.wave; else this.y += this.vy * dt;
    if (o.spin) this.rot = (this.rot || 0) + dt * o.spin;
    // choque con el escenario
    if (!o.ghost) {
      const solid = lv.solidAt(Math.floor(this.cx / TILE), Math.floor(this.cy / TILE));
      if (solid) {
        if (o.bounce && this.vy > 0 && (this.bounces || 0) < o.bounce) { this.bounces = (this.bounces || 0) + 1; this.y = Math.floor(this.cy / TILE) * TILE - this.h - 0.5; this.vy = -Math.abs(this.vy) * 0.72; }
        else if (o.boomerang) { this.t = Math.max(this.t, o.boomerang); this.x -= this.vx * dt; }
        else if (o.ground) { this.pop(); return; }
        else { if (o.onLand) o.onLand(this); this.pop(); return; }
      }
    }
    if (this.x < -40 || this.x > lv.pw + 40 || this.y > lv.ph + 40 || this.y < -200) { this.dead = true; return; }
    const p = lv.player;
    if (!this.friendly) {
      if (rectHit(p, this.hurtRect())) { p.hurt(this); if (!o.pierce) this.pop(); }
    } else {
      for (const e of lv.entities) {
        if (!e.hostile || e.dead || e === this || e instanceof Shot || !e.onHit) continue;
        const r = e.hitRect ? e.hitRect() : e; if (!r || !rectHit(this, r)) continue;
        e.onHit({ dmg: this.dmg + (this.perfect ? 2 : 1), dir: sign(this.vx) || 1, kind: 'reflect', kb: 90, src: 'reflect' });
        this.pop(); break;
      }
    }
    if (o.trail && Math.random() < 0.5) Particles.spawn({ x: this.cx, y: this.cy, vx: -this.vx * 0.1, vy: -this.vy * 0.1, life: 0.3, type: 'fade', size: 1, color: this.friendly ? saberColor(lv) : this.col });
  }
  hurtRect() { return { x: this.x + 1, y: this.y + 1, w: this.w - 2, h: this.h - 2 }; }
  // el sable toca el proyectil
  onHit(h) {
    if (this.friendly || this.warn > 0) return false;
    if (this.o.unbreakable) { AudioSys.sfx('clang'); Particles.burst(this.cx, this.cy, 5, { colors: [PAL.white, PAL.sun], min: 30, max: 70, type: 'spark', lmax: 0.25 }); return 'block'; }
    if (!this.reflectable || h.kind === 'pulse') { this.pop(); if (h.kind !== 'pulse') AudioSys.sfx('clang'); return true; }
    const lv = this.lv, perfect = h.t != null && h.t < 0.09;
    const sp = Math.max(170, Math.hypot(this.vx, this.vy) * 1.6);
    const tgt = this.owner && !this.owner.dead && this.owner.hostile ? this.owner : null;
    if (tgt) { const tx = tgt.x + tgt.w / 2, ty = tgt.y + tgt.h / 2, d = Math.max(1, dist(this.cx, this.cy, tx, ty)); this.vx = (tx - this.cx) / d * sp; this.vy = (ty - this.cy) / d * sp; }
    else { this.vx = h.dir * sp; this.vy = h.kind === 'up' ? -sp : h.kind === 'down' ? sp * 0.4 : -20; }
    this.friendly = true; this.hostile = false; this.grav = 0; this.perfect = perfect; this.life = 2.5;
    this.o = Object.assign({}, this.o, { wave: 0, boomerang: 0, ghost: true, trail: true });
    AudioSys.sfx(perfect ? 'parry' : 'clang');
    Particles.text(this.cx, this.cy - 8, perfect ? '¡PARADA PERFECTA!' : '¡DEVUELTO!', perfect ? PAL.sun : PAL.cream);
    hitstop(lv, perfect ? 0.1 : 0.05);
    lv.player.energy = Math.min(100, lv.player.energy + (perfect ? 15 : 6));
    if (perfect) { G.save.stats.parries = (G.save.stats.parries || 0) + 1; achieve('parry'); }
    return true;
  }
  pop(silent) { this.dead = true; if (!silent) Particles.burst(this.cx, this.cy, 6, { color: this.friendly ? saberColor(this.lv) : this.col, min: 20, max: 60, lmax: 0.4 }); }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), r = this.w / 2, X = x + r, Y = y + r;
    if (this.warn > 0) {
      // aviso en el suelo: dónde va a caer
      const my = this.o.markY != null ? this.o.markY : this.lv.ph - 32;
      if (Math.floor(this.warn * 10) % 2 === 0) { rect(g, X - 5, my - cy - 2, 11, 2, PAL.coral); drawText(g, '!', X, my - cy - 12, PAL.coral, { align: 'center', outline: PAL.ink }); }
      return;
    }
    const col = this.friendly ? saberColor(this.lv) : this.col;
    switch (this.kind) {
      case 'hail': pcircle(g, X, Y, r, '#E8F4FF'); px(g, X - 1, Y - 1, '#FFFFFF'); pring(g, X, Y, r, '#8AA6D0'); break;
      case 'rock': pcircle(g, X, Y, r, '#6A4A3A'); pcircle(g, X - 1, Y - 1, r - 2, '#9A7A5A'); break;
      case 'lava': pcircle(g, X, Y, r, '#FF6B4A'); pcircle(g, X, Y, r - 1, PAL.sun); px(g, X, Y, '#FFFFFF'); break;
      case 'leaf': { const f = Math.floor(this.t * 8) % 2; rect(g, X - 3, Y - 1 + f, 6, 2, '#66D66A'); rect(g, X - 2, Y - 2 + f, 3, 1, '#B6F35B'); break; }
      case 'seed': pellipse(g, X, Y, r, r - 1, '#C88A2A'); px(g, X - 1, Y - 1, '#FFD84A'); break;
      case 'can': rect(g, X - 2, Y - 3, 5, 7, '#C9D2F0'); rect(g, X - 2, Y - 1, 5, 2, PAL.coral); rect(g, X - 2, Y - 3, 5, 1, '#FFFFFF'); break;
      case 'bubble': pring(g, X, Y, r, col); px(g, X - 1, Y - 2, '#FFFFFF'); break;
      case 'drop': rect(g, X - 1, Y - 3, 2, 6, col); px(g, X - 1, Y - 3, '#FFFFFF'); break;
      case 'anchor': {
        // ancla con cadena hacia su dueño
        if (this.owner && !this.friendly) { const ox = Math.round(this.owner.x + this.owner.w / 2 - cx), oy = Math.round(this.owner.y + this.owner.h * 0.6 - cy); pline(g, ox, oy, X, Y, '#8A8FB0', 2, Math.floor(this.t * 10)); }
        rect(g, X - 1, Y - 6, 2, 10, '#C9D2F0'); rect(g, X - 4, Y + 2, 8, 2, '#C9D2F0'); px(g, X - 5, Y + 1, '#C9D2F0'); px(g, X + 4, Y + 1, '#C9D2F0'); pring(g, X, Y - 7, 2, '#C9D2F0'); break;
      }
      case 'wave': { const h = this.h; for (let i = 0; i < this.w; i++) { const hh = Math.round(h * (0.5 + 0.5 * Math.sin(i / this.w * Math.PI))); rect(g, x + i, y + h - hh, 1, hh, col); } rect(g, x, y + h - 1, this.w, 1, '#FFFFFF'); break; }
      case 'error': {
        // bloque de ERROR CRÍTICO: cubo rojo con una ✗ que parpadea con interferencias
        const s = Math.max(4, Math.round(r)), j = Math.floor(this.t * 16) % 4 === 0 ? 1 : 0;
        rect(g, X - s - 1 + j, Y - s - 1, s * 2 + 2, s * 2 + 2, '#2A0A1A');
        rect(g, X - s + j, Y - s, s * 2, s * 2, '#FF3B6B'); rect(g, X - s + j, Y - s, s * 2, 1, '#FF9DB5'); rect(g, X - s + j, Y + s - 1, s * 2, 1, '#B0204A');
        pline(g, X - 2 + j, Y - 2, X + 2 + j, Y + 2, '#FFFFFF'); pline(g, X - 2 + j, Y + 2, X + 2 + j, Y - 2, '#FFFFFF');
        if (j) rect(g, X - s - 3, Y + randi(-s, s - 1), s * 2 + 6, 1, '#7FE7FF');
        break;
      }
      case 'spark': px(g, X, Y, '#FFFFFF'); if (Math.floor(this.t * 20) % 2) { px(g, X - 2, Y, col); px(g, X + 2, Y, col); px(g, X, Y - 2, col); px(g, X, Y + 2, col); } pring(g, X, Y, r - 1, col); break;
      default: pcircle(g, X, Y, r, col); pcircle(g, X, Y, Math.max(0, r - 2), '#FFFFFF');
    }
  }
  light() { return this.warn > 0 ? null : { x: this.cx, y: this.cy, r: 22, c: this.friendly ? saberColor(this.lv) : this.col, a: 0.7 }; }
}

// ---------- Botín: orbes de energía y células ----------
class Pickup extends Entity {
  constructor(lv, x, y, kind) { super(lv, x - 3, y - 3, 7, 7); this.kind = kind; this.vx = rand(-40, 40); this.vy = -rand(100, 150); this.life = 10; this.layer = 1; this.t = 0; }
  update(dt) {
    super.update(dt); this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    const p = this.lv.player, d = dist(p.cx, p.y + 10, this.x + 3, this.y + 3);
    if (d < 48 && this.t > 0.35) { const sp = 190; this.x += (p.cx - this.x - 3) / d * sp * dt; this.y += (p.y + 10 - this.y - 3) / d * sp * dt; }
    else { this.vx *= 0.97; bodyMove(this, dt, 500); if (this.onGround) this.vx *= 0.8; }
    if (this.t > 0.2 && rectHit(p, this)) {
      this.dead = true;
      if (this.kind === 'cell' && p.cells < p.maxCells) { p.cells++; AudioSys.sfx('heal'); Particles.text(this.x, this.y - 6, '+1 célula', PAL.sun); }
      else { p.energy = Math.min(100, p.energy + (this.kind === 'cell' ? 40 : 20)); AudioSys.sfx('seed'); }
      Particles.burst(this.x + 3, this.y + 3, 6, { color: this.kind === 'cell' ? PAL.coral : PAL.teal, min: 10, max: 40 });
    }
  }
  draw(g, cx, cy) {
    if (this.life < 2 && Math.floor(this.life * 10) % 2) return;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy + Math.sin(this.t * 5));
    if (this.kind === 'cell') { g.globalAlpha = 0.3; pcircle(g, x + 3, y + 3, 5, PAL.coral); g.globalAlpha = 1; drawLumiShape(g, x, y, Spr.lumi[0], PAL.coral, '#B8334A', false); }
    else { g.globalAlpha = 0.3; pcircle(g, x + 3, y + 3, 4, PAL.teal); g.globalAlpha = 1; pcircle(g, x + 3, y + 3, 2, PAL.teal); px(g, x + 3, y + 3, '#FFFFFF'); }
  }
  light() { return { x: this.x + 3, y: this.y + 3, r: 18, c: this.kind === 'cell' ? PAL.coral : PAL.teal, a: 0.6 }; }
}
function dropLoot(e) {
  if (e.noLoot) return;
  const lv = e.lv, p = lv.player, r = Math.random(), x = e.x + e.w / 2, y = e.y + e.h / 2;
  if (p.cells < p.maxCells && r < 0.16) lv.addEntity(new Pickup(lv, x, y, 'cell'));
  else if (r < 0.8) { lv.addEntity(new Pickup(lv, x, y, 'orb')); if (Math.random() < 0.35) lv.addEntity(new Pickup(lv, x, y, 'orb')); }
}

// ---------- Personalidad: frases de cada tipo de enemigo ----------
const FOE_LINES = {
  bugglin: { see: ['¡Bzzt! ¿Orden? ¡Qué aburrido!', '¡Desordenaré tus pasos!'], hurt: ['¡Mis patitas!', '¡Eso no estaba en mi lista!'] },
  hopper: { see: ['¡Bip! ¡BIP BIP!', '¡Una humana! ¡A saltar!', '¡0101, al ataque!'], hurt: ['¡Ay, mi bit!', '¡Error de aterrizaje!'] },
  flyer: { see: ['Bzzz... ¡objetivo!', '¡Zum-zum, allá voy!', '¡Picado en 3, 2...!'], hurt: ['¡Mis alitas!', 'Bzz... ¡eso dolió!'] },
  charger: { see: ['¡MÁXIMA POTENCIA!', '¡Resistencia CERO!', '¡Fuera de mi circuito!'], hurt: ['¡Sobrecarga!', '¡Mis cuernos!'], stun: ['¿Quién puso esa pared?', 'Veo... chispitas...'] },
  turret: { see: ['Objetivo... ¿adquirido?', 'Apuntando. Más o menos.', 'Te tengo en la mira. Creo.'], hurt: ['¡Oye! ¡Estaba calibrando!', '¡Mi lente!'] },
  shadowif: { see: ['SI izquierda... ¡ENTONCES DERECHA!'], hurt: ['¡Condición... inestable!'] },
  drainer: { see: ['Mmm... energía fresquita...'], hurt: ['¡Suelta, suelta!'] },
  chaos: { see: ['¿Orden? ¡JA! ¡Caos!'], hurt: ['¡Índice fuera de rango!'] }
};
const FREED_LINES = ['¡Gracias!', '¡Depurado y feliz!', '¡Me siento 100% compilado!', '¡Por fin sin errores!', '¡Bip! ¡Qué alivio!'];
let foeBarkAt = 0;
function foeBark(e, kind) {
  const L = FOE_LINES[e.type]; if (!L || !L[kind] || Time.t < foeBarkAt || Cut.active) return;
  foeBarkAt = Time.t + 3.5;
  Bark.say(e, choice(L[kind]), 1.8);
}

// ---------- Pieles por isla (los enemigos toman los colores de su región) ----------
const FOE_SKIN = {
  festival: ['#FF7FCF', '#B8338A', '#FFD84A'], puerto: ['#FF6B6B', '#B8334A', '#FFD84A'], valle: ['#66D66A', '#2A7A4B', '#FFD84A'],
  solaria: ['#FFB62E', '#C8612E', '#FFF3D7'], aeris: ['#7FE7FF', '#2A7ACC', '#FFFFFF'], hydria: ['#59C7FF', '#163A73', '#9CF5D8'],
  bioloop: ['#B6F35B', '#5E8C3A', '#FF9D42'], gea: ['#FF7B4A', '#6A2A2A', '#FFD84A'], h2: ['#9CF5D8', '#2A7A8C', '#FFFFFF'],
  bateria: ['#FF4FB8', '#5B1A6E', '#30E1C5'], prisma: ['#C9B2FF', '#5B3A8C', '#FFD84A'], faro: ['#DCE2F5', '#565E8C', '#9B76FF']
};
const foeSkin = lv => FOE_SKIN[lv.themeKey] || FOE_SKIN.puerto;
// ojos expresivos comunes: n (normal), angry, wide, dizzy, happy
function foeEyes(g, x, y, expr, face, gap = 4) {
  const K = '#1A1030', Wt = '#FFFFFF', o = face > 0 ? 1 : 0;
  for (const ex of [x, x + gap]) {
    if (expr === 'dizzy') { px(g, ex, y, K); px(g, ex + 1, y + 1, K); px(g, ex + 1, y, K); px(g, ex, y + 1, K); continue; }
    if (expr === 'happy') { px(g, ex, y + 1, K); px(g, ex + 1, y, K); px(g, ex + 2, y + 1, K); continue; }
    rect(g, ex, y, 2, expr === 'wide' ? 3 : 2, Wt); px(g, ex + o, y + (expr === 'wide' ? 1 : 1), K);
  }
  if (expr === 'angry') { px(g, x - 1, y - 1, K); px(g, x, y - 1, K); px(g, x + gap + 1, y - 1, K); px(g, x + gap + 2, y - 1, K); }
}

// ---------- BIT SALTARÍN: salta hacia Lía tras agacharse (se ve venir) ----------
class Hopper extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 3, y + 7, 10, 9, cfg); this.hp = this.maxHp = 2; this.vx = 0; this.vy = 0; this.st = 'idle'; this.stT = rand(0.5, 1.5); this.physKnock = true; this.skin = foeSkin(lv); this.fixText = '¡salto depurado!'; this.freeKind = 'bot'; this.airT = 0; }
  update(dt) {
    super.update(dt);
    if (this.paused) return;
    const p = this.lv.player, dx = p.cx - (this.x + 5), dy = p.y + 10 - (this.y + 4);
    const sees = Math.abs(dx) < 120 && Math.abs(dy) < 60;
    this.stT -= dt;
    switch (this.st) {
      case 'idle':
        this.vx = approach(this.vx, 0, 500 * dt);
        if (sees) this.face = sign(dx) || this.face;
        if (this.stT <= 0 && this.onGround) {
          if (sees) { this.st = 'crouch'; this.stT = 0.38; this.notice(); }
          else { if (!groundAhead(this, this.face) || wallAhead(this, this.face)) this.face *= -1; this.vy = -120; this.vx = this.face * 35; this.st = 'air'; this.stT = rand(1.2, 2.4); }
        }
        break;
      case 'crouch': this.vx = 0; if (this.stT <= 0) { this.st = 'air'; this.vy = -245; this.vx = clamp(dx * 1.5, -118, 118); this.stT = rand(0.5, 0.9); } break;
      case 'air': if (this.onGround && this.airT > 0.08) { this.st = 'land'; this.landT = 0.16; this.vx = 0; Particles.burst(this.x + 5, this.y + 9, 3, { color: '#FFF3D7', min: 10, max: 25, angle: -Math.PI / 2, spread: 1.2, lmax: 0.3 }); } break;
      case 'land': this.landT -= dt; if (this.landT <= 0) { this.st = 'idle'; this.stT = Math.max(this.stT, 0.45); } break;
    }
    this.airT = this.onGround ? 0 : this.airT + dt;
    bodyMove(this, dt, 760);
    if (this.y > this.lv.ph + 30) { this.dead = true; return; }
    this.stompCheck();
  }
  draw(g, cx, cy) {
    const [A, B, C] = this.skin;
    const sq = this.st === 'crouch' ? 2 : this.st === 'land' ? 1 : 0, st = this.st === 'air' && this.vy < 0 ? 2 : 0;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), bw = 10 + sq - (st ? 1 : 0), bh = 9 - sq + st;
    const bx = x + 5 - Math.floor(bw / 2), by = y + 9 - bh;
    rect(g, bx - 1, by, bw + 2, bh, OUTLINE); rect(g, bx, by - 1, bw, bh + 1, OUTLINE);
    rect(g, bx, by, bw, bh - 1, A); rect(g, bx, by + bh - 3, bw, 2, B); rect(g, bx + 1, by + 1, 2, 1, shade(A, 0.4));
    // antena con chispa
    const ax = bx + Math.floor(bw / 2) + (this.face > 0 ? 1 : -1);
    rect(g, ax, by - 4, 1, 3, B); px(g, ax, by - 5, Math.floor(this.t * 8) % 2 ? C : '#FFFFFF');
    const expr = this.stunT > 0 ? 'dizzy' : this.st === 'crouch' ? 'angry' : this.st === 'air' && this.vy < 0 ? 'wide' : 'n';
    foeEyes(g, bx + (this.face > 0 ? bw - 7 : 1), by + 2, expr, this.face, 3);
    if (this.st !== 'air') { rect(g, bx + 1, by + bh - 1, 2, 1, B); rect(g, bx + bw - 3, by + bh - 1, 2, 1, B); }
  }
  lensInfo() { return ['BIT SALTARÍN', 'SI Lía cerca → agacharse, saltar', 'golpéalo o salta encima']; }
}

// ---------- ZUMBYTE: revolotea y se lanza en picado (tiembla antes) ----------
class Zumbyte extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 3, y + 4, 10, 8, cfg); this.hp = this.maxHp = 2; this.ox = this.x; this.oy = this.y; this.st = 'hover'; this.stT = rand(1, 2); this.skin = foeSkin(lv); this.fixText = '¡vuelo depurado!'; this.freeKind = 'bot'; this.dvx = 0; this.dvy = 0; }
  update(dt) {
    super.update(dt);
    if (this.paused) return;
    const lv = this.lv, p = lv.player, tx = p.cx - 5, ty = p.y + 6;
    this.stT -= dt;
    switch (this.st) {
      case 'hover': {
        this.x = lerp(this.x, this.ox + Math.sin(this.t * 0.9) * 22 + (this.kbx || 0) * 0.1, Math.min(1, dt * 2));
        this.y = lerp(this.y, this.oy + Math.sin(this.t * 1.9) * 6, Math.min(1, dt * 3));
        const dx = tx - this.x, dy = ty - this.y;
        if (Math.abs(dx) < 140) this.face = sign(dx) || this.face;
        if (this.stT <= 0 && Math.abs(dx) < 110 && dy > -10 && dy < 120) { this.st = 'aim'; this.stT = 0.5; this.notice(); AudioSys.sfx('warn'); }
        break;
      }
      case 'aim':
        if (this.stT <= 0) { const dx = tx - this.x, dy = ty - this.y, d = Math.max(1, Math.hypot(dx, dy)); this.dvx = dx / d * 175; this.dvy = dy / d * 175; this.st = 'dive'; this.stT = 0.9; this.face = sign(dx) || this.face; }
        break;
      case 'dive':
        this.x += this.dvx * dt; this.y += this.dvy * dt;
        if (lv.solidAt(Math.floor((this.x + 5) / TILE), Math.floor((this.y + 4) / TILE)) || this.stT <= 0) { this.x -= this.dvx * dt * 2; this.y -= this.dvy * dt * 2; this.st = 'dazed'; this.stT = 0.5; }
        break;
      case 'dazed': this.y -= 10 * dt; if (this.stT <= 0) this.st = 'back'; break;
      case 'back': {
        const dx = this.ox - this.x, dy = this.oy - this.y, d = Math.hypot(dx, dy);
        if (d < 3) { this.st = 'hover'; this.stT = rand(1.3, 2.2); }
        else { this.x += dx / d * 70 * dt; this.y += dy / d * 70 * dt; this.face = sign(dx) || this.face; }
        break;
      }
    }
    if (this.kbx && this.st !== 'hover') { this.x += this.kbx * dt * 0.6; }
    this.stompCheck();
  }
  draw(g, cx, cy) {
    const [A, B, C] = this.skin;
    const shake = this.st === 'aim' ? (Math.floor(this.t * 40) % 2 ? 1 : -1) : 0;
    const x = Math.round(this.x - cx) + shake, y = Math.round(this.y - cy + (this.st === 'hover' ? Math.sin(this.t * 12) * 0.6 : 0));
    const f = this.face;
    // alas
    const wf = Math.floor(this.t * 30) % 2;
    g.globalAlpha = 0.8; rect(g, x + 2, y - 3 + wf, 3, 3 - wf, '#E8F4FF'); rect(g, x + 5, y - 4 + wf, 3, 4 - wf, '#E8F4FF'); g.globalAlpha = 1;
    pellipse(g, x + 5, y + 4, 5, 4, OUTLINE);
    pellipse(g, x + 5, y + 4, 4, 3, A); rect(g, x + 3, y + 3, 1, 4, B); rect(g, x + 6, y + 3, 1, 4, B);
    // aguijón
    px(g, f > 0 ? x : x + 10, y + 5, C); px(g, f > 0 ? x - 1 : x + 11, y + 5, OUTLINE);
    const expr = this.stunT > 0 || this.st === 'dazed' ? 'dizzy' : this.st === 'aim' || this.st === 'dive' ? 'angry' : 'n';
    foeEyes(g, f > 0 ? x + 5 : x + 2, y + 2, expr, f, 3);
  }
  lensInfo() { return ['ZUMBYTE', 'SI Lía debajo → picado', 'esquívalo y golpéalo al volver']; }
}

// ---------- TORO-OHM: embiste en línea recta; ¡PARADA! o que choque contra un muro ----------
class ToroOhm extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x, y + 4, 16, 12, cfg); this.hp = this.maxHp = 4; this.heavy = true; this.vx = 0; this.vy = 0; this.st = 'walk'; this.stT = 0; this.physKnock = true; this.skin = foeSkin(lv); this.fixText = '¡embestida depurada!'; this.freeKind = 'bot'; }
  update(dt) {
    super.update(dt);
    if (this.paused) return;
    const p = this.lv.player, dx = p.cx - (this.x + 8), dy = (p.y + p.h) - (this.y + this.h);
    this.stT -= dt;
    switch (this.st) {
      case 'walk':
        this.vx = this.face * 24;
        if (this.onGround && (!groundAhead(this, this.face) || wallAhead(this, this.face))) this.face *= -1;
        if (Math.abs(dy) < 22 && Math.abs(dx) < 135) {
          if (dx * this.face > 0) { this.st = 'tele'; this.stT = 0.6; this.vx = 0; this.notice(); AudioSys.sfx('warn'); }
          else if (Math.abs(dx) < 60) { this.turnT = (this.turnT || 0) + dt; if (this.turnT > 0.5) { this.face *= -1; this.turnT = 0; } }
        }
        break;
      case 'tele':
        this.vx = 0;
        if (Math.random() < 0.4) Particles.spawn({ x: this.x + (this.face > 0 ? 2 : 14), y: this.y + 11, vx: -this.face * rand(10, 30), vy: -rand(5, 20), life: 0.4, type: 'fade', size: 2, color: '#FFF3D7' });
        if (this.stT <= 0) { this.st = 'charge'; this.stT = 1.5; AudioSys.sfx('dash'); }
        break;
      case 'charge':
        this.vx = this.face * 155;
        if (Math.random() < 0.6) Particles.spawn({ x: this.x + 8, y: this.y + 10, vx: -this.face * 40, life: 0.3, type: 'fade', size: 2, color: this.skin[2] });
        if (this.hitWall) { this.stun(1.4); FX.shake(2, 0.2); AudioSys.sfx('bonk'); foeBark(this, 'stun'); }
        else if (!groundAhead(this, this.face) || this.stT <= 0) { this.st = 'skid'; this.stT = 0.35; }
        break;
      case 'skid': this.vx = approach(this.vx, 0, 600 * dt); if (this.stT <= 0) this.st = 'walk'; break;
      case 'stun': this.vx = 0; if (this.stT <= 0) { this.st = 'walk'; this.stunT = 0; } break;
    }
    bodyMove(this, dt, 800);
    if (this.y > this.lv.ph + 30) { this.dead = true; return; }
    this.stompCheck();
  }
  stun(t) { this.st = 'stun'; this.stT = t; this.stunT = t; this.vx = 0; }
  parryWindow() { return this.st === 'charge'; }
  onParry(p) { this.stun(1.8); this.kbx = -this.face * 120; this.hpShowT = 2; Particles.text(this.x + 8, this.y - 14, '¡aturdido!', PAL.sun); }
  guard(h) { return this.st === 'charge' && h.src === 'saber' && h.dir === -this.face; }
  vulnBonus() { return this.st === 'stun' ? 1 : 0; }
  bounce(p) { p.vx = this.face * (this.st === 'charge' ? 210 : 140); p.vy = -150; }
  knockPlayer(p) { if (this.st === 'charge') { p.vx = this.face * 210; p.vy = -160; } }
  draw(g, cx, cy) {
    const [A, B, C] = this.skin, f = this.face;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const bob = this.st === 'walk' ? Math.floor(this.t * 6) % 2 : this.st === 'tele' ? Math.floor(this.t * 20) % 2 : 0;
    // patas
    const leg = this.st === 'charge' ? Math.floor(this.t * 20) % 2 : Math.floor(this.t * 6) % 2;
    rect(g, x + 2 + leg, y + 10, 3, 3, B); rect(g, x + 11 - leg, y + 10, 3, 3, B);
    // cuerpo-transformador
    rect(g, x - 1, y + 1 - bob, 18, 11, OUTLINE);
    rect(g, x, y + 2 - bob, 16, 9, A); rect(g, x, y + 8 - bob, 16, 3, B);
    for (let i = 0; i < 3; i++) rect(g, x + 4 + i * 3, y + 3 - bob, 1, 4, B); // bobinas
    // cuernos-enchufe
    const hx = f > 0 ? x + 13 : x - 2;
    rect(g, hx, y - 2 - bob, 1, 4, '#C9D2F0'); rect(g, hx + 3, y - 2 - bob, 1, 4, '#C9D2F0');
    // cara
    const expr = this.st === 'stun' ? 'dizzy' : this.st === 'tele' || this.st === 'charge' ? 'angry' : 'n';
    foeEyes(g, f > 0 ? x + 9 : x + 2, y + 4 - bob, expr, f, 3);
    if (this.st === 'tele' || this.st === 'charge') { px(g, f > 0 ? x + 16 : x - 1, y + 6 - bob, C); }
    if (this.st === 'tele' && Math.floor(this.t * 10) % 2) { px(g, x + 8, y - 3, '#FFFFFF'); px(g, x + 6, y - 4, '#FFFFFF'); }
  }
  lensInfo() { return ['TORO-OHM', 'SI te ve → cargar hasta chocar', '{y}¡PARADA!{/}: ataca justo al llegar']; }
}

// ---------- TORRETÍN: apunta, se ilumina y dispara (el disparo se puede devolver) ----------
class Torretin extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 2, y + 4, 12, 12, cfg); this.hp = this.maxHp = 3; this.noKnock = true; this.st = 'scan'; this.stT = rand(0.8, 1.6); this.aim = cfg.face === 1 ? 0 : Math.PI; this.skin = foeSkin(lv); this.fixText = '¡puntería depurada!'; this.freeKind = 'bot'; }
  update(dt) {
    super.update(dt);
    if (this.paused) return;
    const p = this.lv.player, mx = this.x + 6, my = this.y + 4;
    const dx = p.cx - mx, dy = p.y + 10 - my, d = Math.hypot(dx, dy);
    const inRange = d < 170 && dy > -90;
    if (inRange) { let target = Math.atan2(Math.min(dy, 30), dx); let diff = ((target - this.aim + Math.PI * 3) % (Math.PI * 2)) - Math.PI; this.aim += clamp(diff, -3 * dt, 3 * dt); }
    this.face = Math.cos(this.aim) >= 0 ? 1 : -1;
    this.stT -= dt;
    if (this.st === 'scan' && this.stT <= 0 && inRange) { this.st = 'charge'; this.stT = 0.55; this.notice(); }
    else if (this.st === 'charge' && this.stT <= 0) {
      const sp = 95, ox = mx + Math.cos(this.aim) * 7, oy = my + Math.sin(this.aim) * 7;
      this.lv.addEntity(new Shot(this.lv, ox, oy, Math.cos(this.aim) * sp, Math.sin(this.aim) * sp, { color: this.skin[2] === '#FFFFFF' ? PAL.coral : this.skin[2], owner: this, r: 3, trail: true, life: 3.5 }));
      AudioSys.sfx('shot'); this.st = 'scan'; this.stT = rand(1.4, 1.9); this.recoil = 0.15;
    }
    this.recoil = Math.max(0, (this.recoil || 0) - dt);
    this.stompCheck();
  }
  vulnBonus() { return 0; }
  draw(g, cx, cy) {
    const [A, B, C] = this.skin;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    // base
    rect(g, x - 1, y + 7, 14, 6, OUTLINE); rect(g, x, y + 8, 12, 4, B); rect(g, x + 1, y + 8, 10, 1, shade(B, 0.3));
    // cúpula
    pcircle(g, x + 6, y + 6, 6, OUTLINE); pcircle(g, x + 6, y + 6, 5, A); rect(g, x + 1, y + 7, 10, 1, B);
    // cañón
    const r0 = 4, r1 = 9 - (this.recoil > 0 ? 2 : 0), c = Math.cos(this.aim), s = Math.sin(this.aim);
    for (let r = r0; r <= r1; r++) { px(g, x + 6 + c * r, y + 5 + s * r, OUTLINE); px(g, x + 6 + c * r, y + 4 + s * r, B); }
    // ojo-lente
    const glow = this.st === 'charge' ? (Math.floor(this.t * 20) % 2 ? '#FFFFFF' : C) : C;
    rect(g, x + 4 + Math.round(c * 1.5), y + 3 + Math.round(s), 3, 3, OUTLINE); rect(g, x + 5 + Math.round(c * 1.5), y + 4 + Math.round(s), 1, 1, glow);
    // ceja gruñona
    rect(g, x + 3 + Math.round(c * 1.5), y + 2 + Math.round(s), 3, 1, OUTLINE);
    if (this.st === 'charge') { g.globalAlpha = 0.4; pcircle(g, x + 6 + c * 9, y + 4 + s * 9, 3, glow); g.globalAlpha = 1; }
  }
  light() { return this.st === 'charge' ? { x: this.x + 6, y: this.y + 4, r: 26, c: this.skin[2], a: 0.8 } : null; }
  lensInfo() { return ['TORRETÍN', 'REPETIR: apuntar, cargar, disparar', 'devuelve el disparo con el sable']; }
}

// ---------- Enemigos en cada isla: se reparten solos por el mapa ----------
// (sin tapar NPCs, terminales, salidas ni puntos de control; siempre con suelo firme)
const FOE_TYPES_BY_REGION = [
  ['hopper', 'flyer', 'hopper'], ['hopper', 'flyer', 'charger'], ['hopper', 'turret', 'flyer'], ['flyer', 'hopper', 'turret'],
  ['hopper', 'charger', 'turret', 'flyer'], ['hopper', 'charger', 'flyer', 'turret'], ['charger', 'turret', 'hopper', 'flyer'],
  ['flyer', 'turret', 'charger', 'hopper'], ['charger', 'turret', 'flyer', 'hopper'], ['charger', 'turret', 'flyer', 'hopper'], ['flyer', 'turret']
];
function populateFoes(lv) {
  const def = lv.def;
  if (def.noFoes || def.noHud || def.region !== lv.key) return;
  const ri = regionIdx(def.region); if (ri < 0) return;
  const types = FOE_TYPES_BY_REGION[ri] || ['hopper'];
  const rng = mulberry32(hashStr(lv.key + ':foes'));
  const want = clamp(Math.round(lv.w * lv.h / 400), 5, 9);
  const avoid = [];
  for (const e of lv.entities) {
    const isTerm = e instanceof Terminal && !(e instanceof Prop);
    if (e instanceof NPC || isTerm || e instanceof Exit || e instanceof Checkpoint || e instanceof Plate || e instanceof Mover || e instanceof Vent || e instanceof PackItem) avoid.push({ x: (e.x + e.w / 2) / TILE, y: (e.y + e.h) / TILE, r: 4 });
    else if (e instanceof Enemy) avoid.push({ x: (e.x + e.w / 2) / TILE, y: (e.y + e.h) / TILE, r: 8 });
  }
  const sp = lv.spawn; avoid.push({ x: sp.x / TILE, y: sp.y / TILE, r: 14 });
  for (const k in (def.spawns || {})) { const s = def.spawns[k]; avoid.push({ x: s[0], y: s[1], r: 8 }); }
  const free = (x, y) => lv.tile(x, y) === '.';
  const floor = (x, y) => { const t = lv.tile(x, y); return t === '#' || t === '='; };
  const walk = (x, y) => free(x, y) && free(x, y - 1) && floor(x, y + 1);
  const cands = [];
  for (let y = 2; y < lv.h - 1; y++) for (let x = 3; x < lv.w - 3; x++) {
    if (!walk(x, y)) continue;
    let run = 1; while (run < 5 && walk(x + run, y)) run++;
    let left = 0; while (left < 5 && walk(x - left - 1, y)) left++;
    if (run + left < 4) continue;
    if (avoid.some(a => Math.abs(a.x - x) < a.r && Math.abs(a.y - y - 1) < 4)) continue;
    cands.push({ x, y, span: run + left, air: free(x, y - 2) && free(x, y - 3) && free(x, y - 4) });
  }
  const order = shuffle(cands, rng), placed = [];
  for (const c of order) {
    if (placed.length >= want) break;
    if (placed.some(q => Math.abs(q.x - c.x) < 10 && Math.abs(q.y - c.y) < 6)) continue;
    let type = types[(placed.length + Math.floor(rng() * types.length)) % types.length];
    if (type === 'charger' && c.span < 8) type = 'hopper';
    if (type === 'flyer' && !c.air) type = 'hopper';
    placed.push(c);
    const ty = type === 'flyer' ? c.y - 3 : c.y;
    const e = makeEnemy(lv, c.x * TILE, ty * TILE, { type, gen: true, face: rng() < 0.5 ? 1 : -1 });
    if (e.face != null) e.face = rng() < 0.5 ? 1 : -1;
    lv.addEntity(e);
  }
  // si el mapa tiene poco suelo libre (islas con agua o muchas plataformas), completar con voladores
  if (placed.length < want && types.includes('flyer')) {
    const air = [];
    for (let y = 3; y < lv.h - 4; y++) for (let x = 4; x < lv.w - 4; x++) {
      let ok = true;
      for (let dy = -1; dy <= 1 && ok; dy++) for (let dx = -1; dx <= 1; dx++) if (!free(x + dx, y + dy)) { ok = false; break; }
      if (!ok) continue;
      let gy = 0; for (let d = 2; d <= 6; d++) if (floor(x, y + d) || lv.tile(x, y + d) === '~') { gy = d; break; }
      if (!gy || avoid.some(a => Math.abs(a.x - x) < a.r + 1 && Math.abs(a.y - y) < 6)) continue;
      air.push({ x, y });
    }
    for (const c of shuffle(air, rng)) {
      if (placed.length >= want) break;
      if (placed.some(q => Math.abs(q.x - c.x) < 10 && Math.abs(q.y - c.y) < 7)) continue;
      placed.push(c);
      lv.addEntity(makeEnemy(lv, c.x * TILE, c.y * TILE, { type: 'flyer', gen: true, face: rng() < 0.5 ? 1 : -1 }));
    }
  }
}

// recalcula las células máximas (fragmentos de jefes y ayuda de combate)
Player.prototype.refreshCells = function () {
  const m = 3 + Math.floor((G.save.cellShards || 0) / 3) + (G.save.settings.assist ? 2 : 0) + (hasPower('cell') ? 1 : 0);
  if (m > this.maxCells) this.cells += m - this.maxCells;
  this.maxCells = m; this.cells = clamp(this.cells, 1, m);
};

// ---------- Presentación del LUMISABLE (la primera vez que aparece un enemigo) ----------
function* saberIntro(lv) {
  const p = lv.player;
  yield* talk([
    ['pix', '¡Cuidado, Lía! Un bicho de código. Desde el apagón hay por todas partes.', 'sorpresa'],
    ['lumi', '✦ ✦ !', 'n'],
    ['lia', '¿Lumi? ...¡Concentra tu luz en una hoja! ¡Un LUMISABLE!', 'decidida']
  ]);
  AudioSys.sfx('aurora'); FX.flash(PAL.sun, 0.35);
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; Particles.spawn({ x: p.cx + Math.cos(a) * 20, y: p.y + 10 + Math.sin(a) * 20, vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 60, life: 0.35, type: 'star', color: PAL.sun }); }
  p.startAttack('f3'); p.atk.hits = new Set(lv.entities);
  yield C.wait(0.5);
  yield* talk([
    ['pix', bindName('attack') + ' ataca: tres seguidos hacen un combo. Con ↑ golpeas hacia arriba. En el aire, ↓ + ' + bindName('attack') + ' rebota sobre enemigos y pinchos.', 'feliz'],
    ['pix', 'Y ojo: no los destruyes, los DEPURAS. Vuelven a ser criaturas felices.', 'n'],
    ['lia', 'Depurar a espadazos. Vega estaría... ¿orgullosa?', 'risa']
  ]);
  unlockCodex('e_lumisable');
}
