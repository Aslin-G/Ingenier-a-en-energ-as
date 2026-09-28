// =====================================================================
//  ENTIDADES DEL MUNDO
// =====================================================================
class Entity {
  constructor(lv, x, y, w = 16, h = 16) { this.lv = lv; this.x = x; this.y = y; this.w = w; this.h = h; this.t = Math.random() * 10; this.dead = false; }
  update(dt) { this.t += dt; }
}

// ---------- Punto de control (farola) ----------
class Checkpoint extends Entity {
  constructor(lv, x, y, idx) { super(lv, x, y - 16, 16, 32); this.idx = idx; this.active = false; }
  update(dt) {
    super.update(dt);
    if (!this.active && rectHit(this.lv.player, this)) {
      this.lv.checkpoints.forEach(c => c.active = false);
      this.active = true;
      G.save.checkpoint = { level: this.lv.key, idx: this.idx };
      G.save.scene = this.lv.key;
      this.lv.player.cells = this.lv.player.maxCells;
      AudioSys.sfx('checkpoint'); Save.write();
      Particles.burst(this.x + 8, this.y + 4, 16, { colors: [PAL.sun, PAL.teal, PAL.pink], min: 20, max: 60, type: 'star' });
      Toast.show('Punto de control · progreso guardado', PAL.teal, 1.8);
    }
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    rect(g, x + 7, y + 6, 2, 26, '#3A4068'); rect(g, x + 5, y + 30, 6, 2, '#3A4068');
    rect(g, x + 3, y, 10, 7, '#22306B'); rect(g, x + 4, y + 1, 8, 5, this.active ? PAL.sun : '#3A4068');
    if (this.active) { rect(g, x + 5, y + 2, 2, 2, '#FFFFFF'); }
    rect(g, x + 2, y - 1, 12, 1, '#565E8C');
  }
  light() { return this.active ? { x: this.x + 8, y: this.y + 3, r: 60, c: PAL.sun } : null; }
}

// ---------- Coleccionables ----------
class Chispa extends Entity {
  constructor(lv, x, y, cfg) { super(lv, x, y, 8, 8); this.cfg = cfg; this.id = cfg.id; this.hidden = !!cfg.hidden; if (G.save.collectibles.chispas[cfg.id]) this.dead = true; }
  update(dt) {
    super.update(dt);
    if (this.hidden && this.lv.lensT < 0.5) return;
    if (rectHit(this.lv.player, this)) {
      this.dead = true;
      G.save.collectibles.chispas[this.cfg.id] = true;
      AudioSys.sfx('chispa'); addXP(15);
      if (this.hidden) { G.save.stats.lensFinds++; if (G.save.stats.lensFinds >= 12) achieve('debugger'); }
      Particles.burst(this.x + 4, this.y + 4, 20, { colors: [PAL.pink, PAL.teal, PAL.white], min: 20, max: 70, type: 'star' });
      const total = Object.keys(CHISPAS).length, got = Object.keys(G.save.collectibles.chispas).length;
      if (got >= total) achieve('collector');
      Scenes.push(new ChispaScene(this.cfg.id));
    }
  }
  draw(g, cx, cy) {
    if (this.hidden && this.lv.lensT < 0.05) return;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy + Math.sin(this.t * 3) * 2);
    if (this.hidden) g.globalAlpha = this.lv.lensT;
    g.globalAlpha *= 0.3; pcircle(g, x + 4, y + 4, 7, PAL.pink); g.globalAlpha = this.hidden ? this.lv.lensT : 1;
    icon(g, 'spark', x, y);
    g.globalAlpha = 1;
  }
  light() { return this.hidden && this.lv.lensT < 0.5 ? null : { x: this.x + 4, y: this.y + 4, r: 30, c: PAL.pink }; }
  lensInfo() { return this.hidden ? '{p}chispa oculta{/}' : null; }
}
class Seed extends Entity {
  constructor(lv, x, y, uid) { super(lv, x, y, 7, 7); this.uid = uid; if (G.save.collectibles.seedIds[uid]) this.dead = true; }
  update(dt) {
    super.update(dt);
    if (rectHit(this.lv.player, this)) {
      this.dead = true; G.save.collectibles.seedIds[this.uid] = true; G.save.collectibles.seeds++;
      AudioSys.sfx('seed'); Particles.burst(this.x + 3, this.y + 3, 6, { color: PAL.lime, min: 10, max: 40 });
      if (G.save.collectibles.seeds % 10 === 0) { addXP(10, '10 semillas luminosas'); }
    }
  }
  draw(g, cx, cy) { icon(g, 'seed', Math.round(this.x - cx), Math.round(this.y - cy + Math.sin(this.t * 4) * 1.5)); }
}

// ---------- Farola decorativa (se enciende con la energía de su zona) ----------
class Lamp extends Entity {
  constructor(lv, x, y) { super(lv, x, y - 16, 16, 32); this.layer = -1; }
  on() { return this.lv.zonePowered(this.x); }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), on = this.on();
    rect(g, x + 7, y + 8, 2, 24, '#3A3058'); rect(g, x + 5, y + 30, 6, 2, '#3A3058');
    rect(g, x + 4, y + 2, 8, 7, '#22306B'); rect(g, x + 5, y + 3, 6, 5, on ? (Math.random() < 0.02 ? PAL.orange : PAL.sun) : '#3A4068');
    rect(g, x + 3, y + 1, 10, 1, '#565E8C'); rect(g, x + 6, y, 4, 1, '#565E8C');
  }
  light() { return this.on() ? { x: this.x + 8, y: this.y + 5, r: 70, c: PAL.sun } : null; }
}

// ---------- Criaturas ambientales (vida del mundo) ----------
class Critter extends Entity {
  constructor(lv, x, y) {
    super(lv, x, y + 10, 6, 6);
    const th = lv.themeKey;
    this.kind = { festival: 'cat', puerto: 'crab', valle: 'bunny', solaria: 'bird', aeris: 'bird', hydria: 'frog', bioloop: 'frog', gea: 'bat', h2: 'crab', bateria: 'cat', prisma: 'bunny', faro: 'bird' }[th] || 'bird';
    this.ox = x; this.oy = this.y; this.dir = Math.random() < 0.5 ? 1 : -1; this.hop = 0; this.flee = 0;
    this.mode = 'idle'; this.modeT = rand(0.5, 2.5); this.fly = 0; this.alpha = 1;
  }
  // comportamiento sencillo pero natural: pausa → paseo corto → pausa; huye si Lía se acerca
  update(dt) {
    super.update(dt);
    const p = this.lv.player, k = this.kind;
    const d = Math.abs(p.cx - this.x) + Math.abs(p.y + 10 - this.y) * 0.5;
    const flier = k === 'bird' || k === 'bat';
    if (d < 38 && this.mode !== 'flee' && this.mode !== 'away') { this.mode = 'flee'; this.modeT = flier ? 1.6 : 1.1; this.dir = p.cx < this.x ? 1 : -1; }
    this.modeT -= dt;
    if (k === 'bat' && this.mode !== 'flee' && this.mode !== 'away') {
      // murciélago: revolotea cerca de su sitio, sin pisar el suelo
      this.x = this.ox + Math.sin(this.t * 0.9) * 22; this.y = this.oy - 26 + Math.sin(this.t * 2.3) * 6; this.dir = Math.cos(this.t * 0.9) > 0 ? 1 : -1; this.hop = 0;
      return;
    }
    switch (this.mode) {
      case 'idle': this.hop = 0; if (this.modeT <= 0) { this.mode = 'walk'; this.modeT = rand(0.5, 1.4); if (Math.random() < 0.45) this.dir *= -1; } break;
      case 'walk': {
        const sp = { cat: 14, crab: 12, bunny: 18, bird: 9, frog: 20 }[k] || 10;
        const hopper = k === 'bunny' || k === 'frog' || k === 'bird';
        this.x += this.dir * sp * dt * (hopper ? (Math.sin(this.t * 10) > 0 ? 1.6 : 0.2) : 1);
        this.hop = hopper ? Math.max(0, Math.sin(this.t * 10)) * (k === 'bird' ? 1.5 : 3) : 0;
        if (Math.abs(this.x - this.ox) > 50) this.dir = this.x > this.ox ? -1 : 1;
        if (this.modeT <= 0) { this.mode = 'idle'; this.modeT = rand(1, 3); }
        break;
      }
      case 'flee':
        if (flier) { this.fly += dt; this.x += this.dir * 55 * dt; this.y -= (30 + this.fly * 60) * dt; this.alpha = clamp(1 - this.fly / 1.6, 0, 1); }
        else { this.x += this.dir * 55 * dt; this.hop = Math.abs(Math.sin(this.t * 12)) * 4; }
        if (this.modeT <= 0) { if (flier) { this.mode = 'away'; this.modeT = rand(3, 5); } else { this.mode = 'idle'; this.modeT = rand(1, 2.5); } }
        break;
      case 'away':
        // vuelve más tarde, posándose de nuevo en su sitio
        if (this.modeT <= 0 && Math.abs(p.cx - this.ox) > 70) { this.mode = 'idle'; this.modeT = rand(1, 3); this.x = this.ox; this.y = this.oy; this.fly = 0; this.alpha = 1; }
        break;
    }
    if (this.mode !== 'flee' && this.mode !== 'away') this.x = clamp(this.x, this.ox - 60, this.ox + 60);
  }
  draw(g, cx, cy) {
    if (this.mode === 'away' || this.alpha <= 0) return;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy - this.hop);
    const flying = this.kind === 'bat' || this.mode === 'flee' && this.kind === 'bird';
    const f = Math.floor(this.t * (flying ? 10 : 3)) % 2;
    g.globalAlpha = this.alpha;
    switch (this.kind) {
      case 'cat': rect(g, x, y + 2, 6, 3, '#FF9D42'); rect(g, x + (this.dir > 0 ? 4 : -1), y, 3, 3, '#FF9D42'); px(g, x + (this.dir > 0 ? 4 : -1), y - 1, '#FF9D42'); px(g, x + (this.dir > 0 ? 6 : 1), y - 1, '#FF9D42'); rect(g, x + (this.dir > 0 ? -2 : 6), y + 1 - f, 2, 1, '#FF9D42'); rect(g, x, y + 5, 1, 1, '#C8612E'); rect(g, x + 5, y + 5, 1, 1, '#C8612E'); break;
      case 'crab': rect(g, x, y + 2, 6, 3, '#FF6B6B'); px(g, x - 1, y + 1 - f, '#FF6B6B'); px(g, x + 6, y + 1 - f, '#FF6B6B'); px(g, x + 1, y + 1, '#FFFFFF'); px(g, x + 4, y + 1, '#FFFFFF'); rect(g, x, y + 5, 1, 1, '#C8412E'); rect(g, x + 5, y + 5, 1, 1, '#C8412E'); break;
      case 'bunny': rect(g, x, y + 2, 5, 4, '#FFFFFF'); rect(g, x + (this.dir > 0 ? 3 : 0), y - 2, 1, 4, '#FFFFFF'); px(g, x + (this.dir > 0 ? 4 : 0), y + 3, '#1A1030'); px(g, x + (this.dir > 0 ? -1 : 5), y + 4, '#FFB8C8'); break;
      case 'bird': rect(g, x, y + 2, 5, 3, '#59C7FF'); px(g, x + (this.dir > 0 ? 5 : -1), y + 3, PAL.sun); px(g, x + (this.dir > 0 ? 3 : 1), y + 2, '#1A1030'); if (this.mode === 'flee') { rect(g, x + 1, y + 1 - f * 2, 3, 1, '#9FE8FF'); } else if (this.mode === 'idle' && Math.floor(this.t * 1.5) % 3 === 0) px(g, x + (this.dir > 0 ? 5 : -1), y + 4, PAL.sun); break;
      case 'frog': rect(g, x, y + 2, 6, 4, '#66D66A'); px(g, x + 1, y + 1, '#FFFFFF'); px(g, x + 4, y + 1, '#FFFFFF'); px(g, x + 1, y + 1, '#1A1030'); rect(g, x + 2, y + 4, 2, 1, '#3FA85A'); break;
      case 'bat': rect(g, x + 2, y + 1, 3, 3, '#5B3A8C'); rect(g, x - 1, y + 1 + f, 3, 1, '#5B3A8C'); rect(g, x + 5, y + 1 + f, 3, 1, '#5B3A8C'); px(g, x + 3, y + 2, PAL.pink); break;
    }
    g.globalAlpha = 1;
  }
}

// ---------- NPC ----------
class NPC extends Entity {
  constructor(lv, x, y, cfg) {
    super(lv, x + 3, y - 12, 12, 28);
    this.cfg = cfg; this.id = cfg.id; this.cast = cfg.cast || cfg.id; this.face = cfg.face || -1; this.anim = 'idle'; this.walkTarget = null; this.speed = 50;
    this.ox = this.x; this.visibleFlag = cfg.needs; this.hideFlag = cfg.hideIf;
  }
  get present() { return (!this.visibleFlag || flag(this.visibleFlag)) && (!this.hideFlag || !flag(this.hideFlag)) && !this.gone; }
  canInteract() { return this.present && !!this.cfg.talk && !this.walkTarget; }
  interactRect() { return { x: this.x - 12, y: this.y, w: this.w + 24, h: this.h }; }
  interact() {
    const lv = this.lv, p = lv.player;
    this.face = p.cx < this.x ? -1 : 1; p.face = -this.face;
    const t = this.cfg.talk;
    Cut.run(() => typeof t === 'function' ? t(lv, this) : talk(t));
  }
  walkTo(x, speed = 50) { this.walkTarget = x; this.speed = speed; }
  update(dt) {
    super.update(dt);
    if (!this.present) return;
    if (this.walkTarget != null) {
      const d = this.walkTarget - this.x;
      if (Math.abs(d) < 1.5) { this.x = this.walkTarget; this.walkTarget = null; this.anim = 'idle'; }
      else { this.face = sign(d); this.x += sign(d) * Math.min(Math.abs(d), this.speed * dt); this.anim = 'walk'; }
    } else if (this.cfg.wander && !Cut.active) {
      this.wT = (this.wT || 0) - dt;
      if (this.wT <= 0) { this.wT = rand(2, 5); if (Math.random() < 0.5) { this.walkTo(this.ox + rand(-this.cfg.wander, this.cfg.wander), 20); } }
    } else if (!Cut.active && Math.abs(this.lv.player.cx - this.x) < 60 && !this.cfg.fixedFace) { const dd = this.lv.player.cx - (this.x + this.w / 2); if (Math.abs(dd) > 6) this.face = dd < 0 ? -1 : 1; }
    const talking = Dlg.box && Dlg.box.who === this.cast && Dlg.box.shown < Dlg.box.total;
    if (this.walkTarget == null) this.anim = this.cheer ? 'cheer' : talking ? 'talk' : 'idle';
    if (this.cfg.barks && !Cut.active && Math.random() < 0.002 && Math.abs(this.lv.player.cx - this.x) < 120) Bark.say(this, choice(this.cfg.barks), 3);
  }
  draw(g, cx, cy) {
    if (!this.present) return;
    let set;
    if (this.cast === 'beta') set = { idle: Spr.beta, talk: Spr.beta, walk: Spr.beta, cheer: Spr.beta };
    else set = Spr.cast[this.cast];
    if (!set) return;
    const A = set[this.anim] || set.idle;
    let f;
    if ((this.anim === 'idle' || !set[this.anim]) && A.length >= 4) {
      // respiración y parpadeo con desfase propio: los NPCs no se mueven al unísono
      if (this.phase == null) this.phase = (hashStr(this.cast + this.x) % 1000) / 100;
      const t = this.t + this.phase;
      f = ((t % 3.4) < 0.14 ? 2 : 0) + ((t % 2.8) > 1.5 ? 1 : 0);
    } else f = Math.floor(this.t * (this.anim === 'walk' ? 8 : this.anim === 'talk' ? 6 : 3)) % A.length;
    const fr = this.face > 0 ? A[f].r : A[f].l;
    g.drawImage(fr, Math.round(this.x + this.w / 2 - fr.width / 2 - cx), Math.round(this.y + this.h - fr.height + 1 - cy));
    if (this.cast === 'beta') {
      const soc = this.cfg.soc ? this.cfg.soc() : 50;
      const bx = Math.round(this.x + this.w / 2 - 8 - cx), by = Math.round(this.y + this.h - 23 - cy);
      const col = soc > 60 ? PAL.lime : soc > 25 ? PAL.sun : PAL.coral;
      rect(g, bx + 6, by + 12 + (4 - Math.ceil(soc / 25)), 6, Math.ceil(soc / 25), col);
    }
    if (this.cfg.quest && questState(this.cfg.quest) === 'none' && (!this.cfg.questNeeds || flag(this.cfg.questNeeds))) {
      const bob = Math.floor(this.t * 3) % 2;
      drawText(g, '!', Math.round(this.x + this.w / 2 - cx), Math.round(this.y - 14 - cy - bob), PAL.sun, { outline: PAL.ink });
    }
  }
  lensInfo() { return this.cfg.lens ? (typeof this.cfg.lens === 'function' ? this.cfg.lens(this.lv) : this.cfg.lens) : null; }
}

// ---------- Terminales, carteles, máquinas interactivas ----------
function makeTerminal(lv, x, y, cfg) { return new Terminal(lv, x, y, cfg); }
class Terminal extends Entity {
  constructor(lv, x, y, cfg) {
    const size = PROP_SIZES[cfg.look || 'console'] || [16, 16];
    super(lv, x + 8 - size[0] / 2 + (cfg.ox || 0), y + 16 - size[1] + (cfg.oy || 0), size[0], size[1]);
    this.cfg = cfg; this.id = cfg.id; this.look = cfg.look || 'console'; this.layer = -1;
  }
  get present() { return (!this.cfg.needs || flag(this.cfg.needs)) && (!this.cfg.hideIf || !flag(this.cfg.hideIf)); }
  canInteract() { return this.present && !!(this.cfg.run || this.cfg.text) && (!this.cfg.enabled || this.cfg.enabled(this.lv)); }
  interactRect() { return { x: this.x - 6, y: this.y - 8, w: this.w + 12, h: this.h + 16 }; }
  interact() {
    const lv = this.lv;
    if (this.cfg.run) Cut.run(() => this.cfg.run(lv, this));
    else if (this.cfg.text) Cut.run(() => talk(this.cfg.text));
  }
  update(dt) { super.update(dt); if (this.cfg.update) this.cfg.update(this, dt); }
  done() { return this.cfg.doneFlag && flag(this.cfg.doneFlag); }
  draw(g, cx, cy) {
    if (!this.present) return;
    const fn = PROP_DRAW[this.look] || PROP_DRAW.console;
    fn(g, Math.round(this.x - cx), Math.round(this.y - cy), this, this.lv);
    if (!this.done() && this.cfg.run && (this.cfg.important !== false) && (!this.cfg.enabled || this.cfg.enabled(this.lv))) {
      const bob = Math.floor(this.t * 3) % 2;
      drawText(g, '?', Math.round(this.x + this.w / 2 - cx), Math.round(this.y - 10 - cy - bob), PAL.teal, { outline: PAL.ink, align: 'center' });
    }
  }
  light() { const l = PROP_LIGHT[this.look]; return l ? l(this, this.lv) : (this.present ? { x: this.x + this.w / 2, y: this.y + 4, r: 34, c: this.done() ? PAL.lime : PAL.teal, a: 0.7 } : null); }
  lensInfo() { return this.cfg.lens ? (typeof this.cfg.lens === 'function' ? this.cfg.lens(this.lv, this) : this.cfg.lens) : null; }
  onAbility(ab, p) { if (this.cfg.onAbility) this.cfg.onAbility(this.lv, this, ab, p); else Bark.say('pix', 'Esa habilidad no hace nada aquí.'); }
  solidRect() { return this.cfg.solid ? { x: this.x, y: this.y + (this.cfg.solidTop || 0), w: this.w, h: this.h - (this.cfg.solidTop || 0), oneWay: this.cfg.solid === 'top' } : null; }
}
// Prop decorativo (misma infraestructura que Terminal, sin interacción por defecto)
class Prop extends Terminal {
  constructor(lv, x, y, cfg) { super(lv, x, y, Object.assign({ important: false }, cfg)); this.layer = cfg.front ? 1 : -1; }
  canInteract() { return this.present && !!(this.cfg.run || this.cfg.text); }
}

// ---------- Plataforma móvil ----------
class Mover extends Entity {
  constructor(lv, x, y, cfg) {
    super(lv, x, y, (cfg.len || 3) * TILE, 6);
    this.cfg = cfg; this.ox = x; this.oy = y; this.dx = 0; this.dy = 0; this.id = cfg.id;
    this.range = (cfg.range || 4) * TILE; this.axis = cfg.axis || 'x'; this.speed = cfg.speed || 0.6; this.phase = cfg.phase || 0;
  }
  active() { return !this.cfg.flag || flag(this.cfg.flag) || (this.cfg.active && this.cfg.active(this.lv)); }
  update(dt) {
    if (this.active()) this.t += dt * this.speed;
    const k = (Math.sin(this.t + this.phase) * 0.5 + 0.5) * this.range;
    const nx = this.axis === 'x' ? this.ox + k : this.ox, ny = this.axis === 'y' ? this.oy - k : this.oy;
    this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
    const p = this.lv.player;
    if (p.onPlat === this && this.dy) p.y = this.y - p.h;
  }
  solidRect() { return { x: this.x, y: this.y, w: this.w, h: 6, oneWay: true }; }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), on = this.active();
    const style = this.cfg.style || this.lv.theme.plat;
    for (let i = 0; i < this.w; i += 16) paintPlatform(g, x + i, y, style, this.lv.theme);
    rect(g, x + this.w / 2 - 3, y + 5, 6, 3, on ? PAL.teal : '#3A4068');
    if (on && Math.random() < 0.3) Particles.spawn({ x: this.x + this.w / 2, y: this.y + 8, vy: 20, life: 0.4, type: 'dot', color: PAL.teal });
  }
  lensInfo() { return this.cfg.lens || null; }
}

// ---------- Placa de presión (Step Spark) ----------
class Plate extends Entity {
  constructor(lv, x, y, cfg) { super(lv, x + 2, y + 12, 12, 4); this.cfg = cfg; this.id = cfg.id; this.pressed = false; this.wasPressed = false; }
  update(dt) {
    super.update(dt);
    const lv = this.lv;
    this.pressed = rectHit(lv.player, { x: this.x, y: this.y - 2, w: this.w, h: 6 }) || !!(lv.ghost && !lv.ghost.done && rectHit(lv.ghost, { x: this.x, y: this.y - 2, w: this.w, h: 6 }));
    for (const e of lv.entities) if (e.pressesPlates && rectHit(e, { x: this.x, y: this.y - 2, w: this.w, h: 6 })) this.pressed = true;
    if (this.pressed !== this.wasPressed) { AudioSys.sfx(this.pressed ? 'place' : 'remove'); if (this.cfg.flag) setFlag(this.cfg.flag, this.pressed); if (this.pressed && this.cfg.onPress) this.cfg.onPress(lv); }
    this.wasPressed = this.pressed;
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    rect(g, x - 1, y + 2, 14, 2, '#3A4068');
    rect(g, x, y + (this.pressed ? 2 : 0), 12, this.pressed ? 1 : 3, this.pressed ? PAL.lime : PAL.sun);
  }
  light() { return this.pressed ? { x: this.x + 6, y: this.y, r: 30, c: PAL.lime } : null; }
  lensInfo() { return 'placa = ' + (this.pressed ? '{g}VERDADERO{/}' : '{r}FALSO{/}'); }
}

// ---------- Salida ----------
class Exit extends Entity {
  constructor(lv, x, y, cfg) { super(lv, x, y - 16, 16, 32); this.cfg = cfg; if (cfg.id) this.id = cfg.id; }
  canInteract() { return !this.cfg.auto; }
  interact() {
    const lv = this.lv;
    if (this.cfg.cond && !this.cfg.cond(lv)) { Cut.run(() => this.cfg.blocked ? this.cfg.blocked(lv) : talk([['pix', 'Todavía no podemos irnos. Algo sigue sin energía aquí.']])); return; }
    if (this.cfg.run) { Cut.run(() => this.cfg.run(lv)); return; }
    Game.toMap();
  }
  update(dt) { super.update(dt); if (this.cfg.auto && rectHit(this.lv.player, this) && !Cut.active) this.interact(); }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const ok = !this.cfg.cond || this.cfg.cond(this.lv);
    rect(g, x + 1, y + 4, 14, 28, '#22306B'); rect(g, x + 3, y + 6, 10, 26, ok ? '#30A8C8' : '#3A4068');
    for (let i = 0; i < 3; i++) { const yy = y + 30 - ((this.t * 20 + i * 9) % 24); if (ok) rect(g, x + 5 + i * 2, yy, 1, 3, '#FFFFFF'); }
    rect(g, x, y + 2, 16, 3, PAL.sun);
    drawText(g, this.cfg.label || 'MAPA', x + 8, y - 8, ok ? PAL.sun : '#8C93B8', { align: 'center', outline: PAL.ink });
  }
  light() { return { x: this.x + 8, y: this.y + 16, r: 40, c: PAL.teal, a: 0.6 }; }
}

// ---------- Respiradero de vapor (geotermia / State Shift) ----------
class Vent extends Entity {
  constructor(lv, x, y, cfg) { super(lv, x, y + 8, 16, 8); this.cfg = cfg; this.id = cfg.id; this.state = cfg.state || 'OFF'; this.stT = 0; }
  static get FLOW() { return { OFF: 'STARTING', STARTING: 'RUNNING', RUNNING: 'COOLING', COOLING: 'OFF', FAULT: 'DIAGNOSTIC', DIAGNOSTIC: 'OFF' }; }
  update(dt) {
    super.update(dt); this.stT += dt;
    if (this.state === 'STARTING' && this.stT > 1.2) this.setState('RUNNING');
    if (this.state === 'RUNNING' && this.cfg.overheat && this.stT > this.cfg.overheat) this.setState('FAULT');
    if (this.state === 'RUNNING' && Math.random() < 0.6) Particles.spawn({ x: this.x + rand(3, 13), y: this.y, vy: rand(-120, -80), vx: rand(-8, 8), life: 0.9, type: 'fade', size: 3, color: 'rgba(255,255,255,0.6)', drag: 0.99 });
    if (this.state === 'FAULT' && Math.random() < 0.2) Particles.spawn({ x: this.x + 8, y: this.y, vy: -30, life: 0.5, type: 'spark', color: PAL.coral });
  }
  setState(s) { this.state = s; this.stT = 0; AudioSys.sfx(s === 'RUNNING' ? 'steam' : s === 'FAULT' ? 'error' : 'click'); }
  windRect() { return this.state === 'RUNNING' ? { x: this.x + 2, y: this.y - (this.cfg.height || 6) * TILE, w: 12, h: (this.cfg.height || 6) * TILE } : null; }
  onAbility(ab) {
    if (ab !== 'shift' && ab !== 'link') { Bark.say('pix', 'Este respiradero cambia de estado con STATE SHIFT.'); return; }
    if (this.state === 'FAULT') { this.setState('DIAGNOSTIC'); Bark.say('pix', 'FAULT → DIAGNÓSTICO. Nunca directo a RUNNING.'); setTimeout(() => { if (this.state === 'DIAGNOSTIC') this.setState('OFF'); }, 1500); return; }
    const next = Vent.FLOW[this.state];
    if (this.state === 'STARTING') { Bark.say('pix', 'Está ARRANCANDO. Hay que esperar a que termine la transición.'); return; }
    this.setState(next);
    Particles.text(this.x + 8, this.y - 10, next, PAL.coral);
  }
  hazard() { return false; }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const col = { OFF: '#565E8C', STARTING: PAL.sun, RUNNING: PAL.lime, COOLING: PAL.sky, FAULT: PAL.coral, DIAGNOSTIC: PAL.violet }[this.state];
    rect(g, x, y + 2, 16, 6, '#3A2A48'); rect(g, x + 2, y, 12, 3, '#6A4A7A'); rect(g, x + 4, y + 1, 8, 1, '#1A0E2A');
    rect(g, x + 6, y + 4, 4, 2, col);
  }
  drawOverlay(g, cx, cy) { if (this.lv.lensT > 0.3) drawText(g, this.state, Math.round(this.x + 8 - cx), Math.round(this.y + 12 - cy), PAL.mint, { align: 'center', outline: PAL.ink }); }
  lensInfo() { return 'estado = {o}' + this.state + '{/}'; }
}

// ---------- Objeto recogible para ARRAY PACK ----------
class PackItem extends Entity {
  constructor(lv, x, y, cfg) { super(lv, x, y, 10, 10); this.cfg = cfg; this.uid = cfg.uid; if ((G.save.packTaken || {})[cfg.uid]) this.dead = true; }
  // los residuos descansan sobre el suelo o la plataforma de debajo (no flotan)
  settle() {
    this.settled = true;
    const lv = this.lv, tx = Math.floor((this.x + this.w / 2) / TILE);
    for (let ty = Math.floor(this.y / TILE); ty < Math.min(lv.h, Math.floor(this.y / TILE) + 8); ty++) {
      if (ty * TILE < this.y + this.h - 2) continue;
      if (lv.solidAt(tx, ty) || lv.oneWayAt(tx, ty)) { this.y = ty * TILE - this.h; this.grounded = true; return; }
    }
  }
  update(dt) {
    super.update(dt);
    if (!this.settled) this.settle();
    if (rectHit(this.lv.player, this)) {
      if (!hasAbility('pack')) { if (!this.warned) { this.warned = true; Bark.say('pix', 'Necesitamos una forma ordenada de cargar varias cosas...'); } return; }
      G.save.pack = G.save.pack || []; G.save.packTaken = G.save.packTaken || {};
      if (G.save.pack.length >= 8) { if (!this.warned) { this.warned = true; Bark.say('pix', 'mochila.length == 8. ¡Está llena!'); } return; }
      this.dead = true; G.save.packTaken[this.uid] = true;
      G.save.pack.push({ name: this.cfg.name, type: this.cfg.type, icon: this.cfg.icon });
      AudioSys.sfx('seed');
      Particles.text(this.x + 5, this.y - 4, `mochila[${G.save.pack.length - 1}] = ${this.cfg.name}`, PAL.lime);
    }
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy + (this.grounded ? 0 : Math.sin(this.t * 2) * 1));
    if (this.grounded) { g.globalAlpha = 0.3; rect(g, x + 1, y + this.h, this.w - 2, 1, '#000000'); g.globalAlpha = 1; }
    drawWasteIcon(g, this.cfg.type, x, y);
  }
  lensInfo() { return `{g}${this.cfg.name}{/}: ${WASTE_TYPES[this.cfg.type].label}`; }
}
const WASTE_TYPES = {
  organico: { label: 'orgánico', color: PAL.lime },
  plastico: { label: 'plástico', color: PAL.sky },
  madera: { label: 'madera seca', color: PAL.wood },
  vidrio: { label: 'vidrio', color: PAL.aqua },
  metal: { label: 'metal', color: '#C9D2F0' }
};
function drawWasteIcon(g, type, x, y) {
  switch (type) {
    case 'organico': rect(g, x + 2, y + 2, 6, 6, '#FFD84A'); rect(g, x + 1, y + 3, 1, 4, '#FFD84A'); rect(g, x + 4, y, 2, 2, '#66D66A'); px(g, x + 3, y + 4, '#C88A2A'); break;
    case 'plastico': rect(g, x + 3, y, 4, 2, PAL.sky); rect(g, x + 2, y + 2, 6, 8, '#9FE8FF'); rect(g, x + 3, y + 3, 1, 5, '#FFFFFF'); rect(g, x + 2, y + 5, 6, 2, PAL.coral); break;
    case 'madera': rect(g, x, y + 3, 10, 4, '#8B5A3C'); rect(g, x, y + 3, 10, 1, '#B07A4A'); pcircle(g, x + 9, y + 5, 2, '#D8A06A'); break;
    case 'vidrio': rect(g, x + 3, y, 3, 3, '#9CF5D8'); rect(g, x + 2, y + 3, 5, 7, '#9CF5D8'); rect(g, x + 3, y + 4, 1, 4, '#FFFFFF'); break;
    case 'metal': rect(g, x + 1, y + 2, 8, 7, '#C9D2F0'); rect(g, x + 1, y + 2, 8, 1, '#FFFFFF'); rect(g, x + 1, y + 5, 8, 1, '#8A8FB0'); break;
  }
}

// ---------- Eco de Step Spark ----------
class SparkGhost {
  constructor(lv, x, y, face, seq) {
    this.lv = lv; this.x = x; this.y = y; this.w = 10; this.h = 20; this.vx = 0; this.vy = 0; this.face = face; this.onGround = false;
    this.seq = seq; this.i = -1; this.stepT = 0; this.hold = 5; this.done = false; this.t = 0; this.jumped = false; this.log = [];
    this.next();
  }
  next() {
    this.i++; this.stepT = 0; this.jumped = false;
    if (this.i < this.seq.length) { AudioSys.sfx('tick', this.i); Particles.text(this.x + 5, this.y - 8, (this.i + 1) + ': ' + SPARK_OPS[this.seq[this.i]].label, PAL.sun); }
  }
  update(dt) {
    this.t += dt;
    const op = this.i < this.seq.length ? this.seq[this.i] : null;
    let ax = 0;
    if (op) {
      this.stepT += dt;
      const o = SPARK_OPS[op];
      ax = o.dx;
      if (o.jump && !this.jumped && this.onGround) { this.vy = -PHYS.jumpV; this.jumped = true; }
      if (op === 'act') { const tgt = this.lv.entities.find(e => e.onSpark && rectHit(this, { x: e.x - 6, y: e.y - 6, w: e.w + 12, h: e.h + 12 })); if (tgt && !this.acted) { this.acted = true; tgt.onSpark(this); } }
      if (this.stepT >= o.dur && (this.onGround || this.stepT > 1.2)) { this.acted = false; this.next(); }
    } else { this.hold -= dt; if (this.hold <= 0) { this.done = true; Particles.burst(this.x + 5, this.y + 10, 16, { color: PAL.sun, min: 20, max: 60 }); } }
    if (ax) this.face = ax;
    this.vx = ax * PHYS.walk;
    this.vy = Math.min(this.vy + (this.vy < 0 ? PHYS.gravHold : PHYS.grav) * dt, PHYS.maxFall);
    // movimiento y colisiones (reutiliza la física de la jugadora)
    Player.prototype.moveX.call(this, this.vx * dt);
    Player.prototype.moveY.call(this, this.vy * dt);
    if (this.y > this.lv.ph) this.done = true;
    if (Math.random() < 0.4) Particles.spawn({ x: this.x + rand(0, 10), y: this.y + rand(0, 20), vy: -10, life: 0.4, type: 'dot', color: PAL.sun });
  }
  get cx() { return this.x + this.w / 2; }
  draw(g, cx, cy) {
    const a = !this.onGround ? (this.vy < 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 5 ? 'walk' : 'idle';
    const A = Spr.liaGhost[a]; const f = Math.floor(this.t * 9) % A.length;
    const fr = this.face > 0 ? A[f].r : A[f].l;
    g.globalAlpha = 0.6 + Math.sin(this.t * 10) * 0.2;
    g.drawImage(fr, Math.round(this.x + 5 - fr.width / 2 - cx), Math.round(this.y + 21 - fr.height - cy));
    g.globalAlpha = 1;
  }
}
// para que moveX/moveY funcionen en el fantasma
SparkGhost.prototype.tileRectSolid = Player.prototype.tileRectSolid;
SparkGhost.prototype.entitySolids = Player.prototype.entitySolids;
SparkGhost.prototype.land = function () { this.onGround = true; this.vy = 0; };

const SPARK_OPS = {
  R: { label: 'AVANZAR →', short: '→', dx: 1, dur: 0.45 },
  L: { label: 'AVANZAR ←', short: '←', dx: -1, dur: 0.45 },
  JR: { label: 'SALTAR ↗', short: '↗', dx: 1, jump: true, dur: 0.5 },
  JL: { label: 'SALTAR ↖', short: '↖', dx: -1, jump: true, dur: 0.5 },
  J: { label: 'SALTAR ↑', short: '↑', dx: 0, jump: true, dur: 0.5 },
  W: { label: 'ESPERAR', short: '⏸', dx: 0, dur: 0.6 },
  act: { label: 'ACTIVAR', short: '✦', dx: 0, dur: 0.4 }
};

// ---------- Enemigos conceptuales ----------
function makeEnemy(lv, x, y, cfg) {
  switch (cfg.type) {
    case 'bugglin': return new Bugglin(lv, x, y, cfg);
    case 'loopling': return new Loopling(lv, x, y, cfg);
    case 'shadowif': return new ShadowIf(lv, x, y, cfg);
    case 'drainer': return new Drainer(lv, x, y, cfg);
    case 'chaos': return new ChaosPacket(lv, x, y, cfg);
    case 'overflow': return new Overflow(lv, x, y, cfg);
  }
  return new Bugglin(lv, x, y, cfg);
}
class Enemy extends Entity {
  constructor(lv, x, y, w, h, cfg) { super(lv, x, y, w, h); this.cfg = cfg; this.hostile = true; this.face = -1; this.id = cfg.id; }
  stompCheck() {
    const p = this.lv.player;
    if (!rectHit(p, this)) return false;
    if (p.vy > 40 && p.y + p.h - this.y < 10) { p.vy = -200; this.debug(); return true; }
    p.hurt(this); return true;
  }
  debug() {
    this.dead = true; this.hostile = false;
    AudioSys.sfx('debug'); addXP(8); addMastery('debugging', 1.5);
    Particles.burst(this.x + this.w / 2, this.y + this.h / 2, 14, { colors: [PAL.violet, PAL.lime, PAL.white], min: 20, max: 70, type: 'bit' });
    Particles.text(this.x + this.w / 2, this.y - 6, this.fixText || '¡depurado!', PAL.lime);
    this.lv.addEntity(new FreedCritter(this.lv, this.x, this.y, this.freeKind || 'ladybug'));
    if (this.cfg.onDebug) this.cfg.onDebug(this.lv);
  }
  bounce(p) { p.vx = -p.face * 150; p.vy = -120; }
}
class FreedCritter extends Entity {
  constructor(lv, x, y, kind) { super(lv, x, y, 8, 6); this.kind = kind; this.life = 3; }
  update(dt) { super.update(dt); this.life -= dt; this.y -= 25 * dt; this.x += Math.sin(this.t * 4) * 20 * dt; if (this.life <= 0) this.dead = true; }
  draw(g, cx, cy) { const s = Spr.enemy.ladybug[Math.floor(this.t * 8) % 2]; g.drawImage(s.r, Math.round(this.x - cx), Math.round(this.y - cy)); }
}
class Bugglin extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 3, y + 9, 10, 7, cfg); this.speed = cfg.speed || 25; this.fixText = '¡instrucción reparada!'; }
  update(dt) {
    super.update(dt);
    const lv = this.lv;
    const nx = this.x + this.face * this.speed * dt;
    const aheadX = this.face > 0 ? nx + this.w : nx;
    const wall = lv.solidAt(Math.floor(aheadX / TILE), Math.floor((this.y + 3) / TILE));
    const floor = lv.solidAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h + 2) / TILE)) || lv.oneWayAt(Math.floor(aheadX / TILE), Math.floor((this.y + this.h + 2) / TILE));
    if (wall || !floor) this.face *= -1; else this.x = nx;
    if (Math.random() < 0.02) Particles.spawn({ x: this.x + rand(0, 10), y: this.y, vy: -12, life: 0.6, type: 'bit', color: PAL.violet });
    this.stompCheck();
  }
  draw(g, cx, cy) { const f = Spr.enemy.bugglin[Math.floor(this.t * 6) % 2]; g.drawImage(this.face > 0 ? f.r : f.l, Math.round(this.x - 1 - cx), Math.round(this.y - 1 - cy)); }
  lensInfo() { return ['BUGGLIN', '{v}intercambia el orden{/}', 'salta encima: {g}depurar{/}']; }
}
class Loopling extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x, y, 12, 12, cfg); this.ox = x + 2; this.oy = y + 2; this.r = (cfg.r || 2.5) * TILE; this.exitA = cfg.exitA || 1.2; this.a = 0; this.iter = 0; this.stopped = false; this.freeKind = 'ladybug'; }
  update(dt) {
    super.update(dt);
    if (this.stopped) { this.y += Math.sin(this.t * 2) * 0.1; return; }
    const prevA = this.a;
    this.a += dt * (this.cfg.speed || 2.2);
    if (Math.floor(prevA / (Math.PI * 2)) !== Math.floor(this.a / (Math.PI * 2))) this.iter++;
    this.x = this.ox + Math.cos(this.a) * this.r; this.y = this.oy + Math.sin(this.a) * this.r * (this.cfg.flat || 0.6);
    const p = this.lv.player;
    // nodo de salida visible con la lente
    const ex = this.ox + Math.cos(this.exitA) * this.r + 6, ey = this.oy + Math.sin(this.exitA) * this.r * (this.cfg.flat || 0.6) + 6;
    if (this.lv.lensT > 0.5 && dist(p.cx, p.y + 10, ex, ey) < 12) {
      this.stopped = true; this.hostile = false; AudioSys.sfx('win'); addMastery(['loops', 'debugging'], 3); addXP(12);
      Particles.text(ex, ey - 10, 'condición de salida: VERDADERA', PAL.lime);
      Particles.burst(this.x + 6, this.y + 6, 20, { colors: [PAL.aqua, PAL.lime], min: 20, max: 60 });
      if (this.cfg.onStop) this.cfg.onStop(this.lv);
      return;
    }
    if (rectHit(p, this)) p.hurt(this);
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    if (this.stopped) { pring(g, x + 6, y + 6, 5, PAL.lime); drawText(g, 'FIN', x + 6, y + 3, PAL.lime, { align: 'center' }); return; }
    // rastro del bucle
    for (let i = 1; i < 6; i++) { const a = this.a - i * 0.25; px(g, this.ox + Math.cos(a) * this.r + 6 - cx, this.oy + Math.sin(a) * this.r * (this.cfg.flat || 0.6) + 6 - cy, rgba(PAL.aqua, 1 - i / 6)); }
    pcircle(g, x + 6, y + 6, 6, '#2A6AA8'); pring(g, x + 6, y + 6, 6, PAL.aqua);
    const s = this.t * 10; for (let k = 0; k < 3; k++) px(g, x + 6 + Math.cos(s + k * 2.1) * 4, y + 6 + Math.sin(s + k * 2.1) * 4, '#FFFFFF');
    drawText(g, '↻', x + 4, y + 3, '#FFFFFF');
  }
  drawOverlay(g, cx, cy) {
    if (this.stopped || this.lv.lensT < 0.1) return;
    const ex = this.ox + Math.cos(this.exitA) * this.r + 6, ey = this.oy + Math.sin(this.exitA) * this.r * (this.cfg.flat || 0.6) + 6;
    g.globalAlpha = this.lv.lensT;
    pring(g, ex - cx, ey - cy, 5 + Math.sin(this.t * 6), PAL.lime); px(g, ex - cx, ey - cy, '#FFFFFF');
    drawText(g, 'SALIDA', ex - cx, ey - cy + 8, PAL.lime, { align: 'center', outline: PAL.ink });
    g.globalAlpha = 1;
  }
  lensInfo() { return this.stopped ? null : ['LOOPLING: MIENTRAS VERDADERO', 'iteración ' + this.iter + ' · sin salida', 'toca el nodo {g}SALIDA{/}']; }
}
class ShadowIf extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 1, y, 14, 14, cfg); this.oy = y; this.freeKind = 'ladybug'; this.fixText = '¡condición corregida!'; }
  update(dt) {
    super.update(dt);
    // flota por encima de su sitio (nunca atraviesa el suelo)
    this.y = this.oy - 4 - (Math.sin(this.t * 1.5) * 0.5 + 0.5) * (this.cfg.amp || 20);
    const p = this.lv.player;
    const near = dist(p.cx, p.y + 10, this.x + 7, this.y + 7) < 46;
    if (near && !p.shieldOn && !this.lv.inverted) { this.lv.inverted = 1.6; Bark.say('pix', '¡SHADOW IF invirtió tus controles! SI izquierda → derecha...'); AudioSys.sfx('bug'); }
    if (near && !p.shieldOn) this.lv.inverted = Math.max(this.lv.inverted || 0, 0.6);
    this.stompCheck();
  }
  draw(g, cx, cy) {
    const f = Spr.enemy.shadowif[Math.floor(this.t * 4) % 4];
    g.drawImage(f.r, Math.round(this.x - 1 - cx), Math.round(this.y - 1 - cy));
    const p = this.lv.player;
    if (dist(p.cx, p.y + 10, this.x + 7, this.y + 7) < 60) { g.globalAlpha = 0.2; pring(g, this.x + 7 - cx, this.y + 7 - cy, 46, PAL.violet); g.globalAlpha = 1; }
  }
  lensInfo() { return ['SHADOW IF', 'SI {r}NO{/} izquierda → izquierda', '{g}IF SHIELD{/} lo bloquea']; }
}
class Drainer extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x, y, 10, 9, cfg); this.oy = y; this.ox = x; this.freeKind = 'ladybug'; this.fixText = '¡energía devuelta!'; this.priority = cfg.priority || 3; }
  update(dt) {
    super.update(dt);
    const p = this.lv.player;
    const d = dist(p.cx, p.y + 10, this.x + 5, this.y + 5);
    if (d < 90) { this.x += sign(p.cx - this.x - 5) * 18 * dt; this.y += sign(p.y + 6 - this.y) * 12 * dt; }
    else { this.x = lerp(this.x, this.ox, dt); this.y = lerp(this.y, this.oy - 5 + Math.sin(this.t * 2) * 3, Math.min(1, dt * 3)); }
    if (rectHit(p, this)) {
      if (p.dashT > 0) { this.debug(); return; }
      p.energy = Math.max(0, p.energy - 60 * dt);
      if (Math.random() < 0.3) Particles.spawn({ x: p.cx, y: p.y + 8, vx: (this.x - p.x) * 2, vy: -10, life: 0.4, type: 'dot', color: PAL.sun });
      if (p.energy <= 0) p.hurt(this);
      if (p.vy > 40 && p.y + p.h - this.y < 8) { p.vy = -200; this.debug(); }
    }
  }
  draw(g, cx, cy) { const f = Spr.enemy.drainer[Math.floor(this.t * 5) % 3]; g.drawImage(f.r, Math.round(this.x - 1 - cx), Math.round(this.y - 1 - cy)); }
  lensInfo() { return ['DRAINER', 'energia -= 60/s', '{p}PRIORITY DASH{/} lo atraviesa']; }
}
class ChaosPacket extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x + 4, y + 4, 8, 6, cfg); this.vx = cfg.vx || 40; this.vy = 0; this.freeKind = 'ladybug'; this.fixText = '¡datos ordenados!'; }
  update(dt) {
    super.update(dt);
    const lv = this.lv;
    this.vy += 500 * dt;
    const nx = this.x + this.vx * dt;
    if (lv.solidAt(Math.floor((this.vx > 0 ? nx + this.w : nx) / TILE), Math.floor((this.y + 3) / TILE))) this.vx *= -1; else this.x = nx;
    const ny = this.y + this.vy * dt;
    if (lv.solidAt(Math.floor((this.x + 4) / TILE), Math.floor((ny + this.h) / TILE)) || lv.oneWayAt(Math.floor((this.x + 4) / TILE), Math.floor((ny + this.h) / TILE))) { this.y = Math.floor((ny + this.h) / TILE) * TILE - this.h; this.vy = -rand(160, 220); } else this.y = ny;
    const p = lv.player;
    if (rectHit(p, this)) {
      if (p.vy > 40 && p.y + p.h - this.y < 10) { p.vy = -200; this.debug(); return; }
      if (p.inv <= 0 && !p.shieldOn && G.save.pack && G.save.pack.length > 1) { G.save.pack = shuffle(G.save.pack); Bark.say('pix', '¡CHAOS PACKET desordenó la mochila! Los índices cambiaron.'); AudioSys.sfx('bug'); }
      p.hurt(this);
    }
  }
  draw(g, cx, cy) { const f = Spr.enemy.chaos[Math.floor(this.t * 6) % 2]; g.drawImage(f.r, Math.round(this.x - 1 - cx), Math.round(this.y - 1 - cy)); }
  lensInfo() { return ['CHAOS PACKET', '{o}desordena listas{/}']; }
}
class Overflow extends Enemy {
  constructor(lv, x, y, cfg) { super(lv, x, y + 8, 16, 8, cfg); this.size = 4; this.base = y + 16; this.cx0 = x + 8; this.phase = 0; this.freeKind = 'ladybug'; this.fixText = '¡capacidad respetada!'; }
  update(dt) {
    super.update(dt);
    this.size += dt * (this.cfg.rate || 2.5);
    if (this.size > (this.cfg.max || 14)) {
      for (let i = 0; i < 6; i++) Particles.spawn({ x: this.cx0, y: this.base - this.size * 2, vx: rand(-80, 80), vy: rand(-160, -60), grav: 400, life: 1, type: 'dot', size: 2, color: PAL.coral });
      AudioSys.sfx('bug'); this.size = 4;
    }
    this.w = this.size * 2; this.h = this.size * 1.6; this.x = this.cx0 - this.size; this.y = this.base - this.h;
    const p = this.lv.player;
    if (rectHit(p, this)) {
      if (p.vy > 30 && p.y + p.h - this.y < 10) {
        if (this.size > 9) { p.vy = -PHYS.jumpV * 1.35; AudioSys.sfx('jump'); Particles.text(this.cx0, this.y - 8, '¡rebote!', PAL.sun); }
        else { p.vy = -200; this.debug(); }
      } else p.hurt(this);
    }
  }
  draw(g, cx, cy) {
    const x = Math.round(this.cx0 - cx), y = Math.round(this.base - cy), s = this.size;
    pellipse(g, x, y - s * 0.8, s, s * 0.8, '#FF6B6B'); pellipse(g, x - s * 0.3, y - s * 1.1, s * 0.4, s * 0.3, '#FFB0B0');
    rect(g, x - 3, y - s, 2, 2, '#1A1030'); rect(g, x + 2, y - s, 2, 2, '#1A1030');
    drawText(g, Math.round(s / (this.cfg.max || 14) * 100) + '%', x, y - s * 2 - 8, PAL.coral, { align: 'center', outline: PAL.ink });
  }
  lensInfo() { return ['OVERFLOW', 'capacidad ' + Math.round(this.size / (this.cfg.max || 14) * 100) + '%', 'grande: {y}rebota{/} · pequeño: {g}depura{/}']; }
}
