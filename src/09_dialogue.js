// =====================================================================
//  DIÁLOGOS, ESCENAS (corutinas con generadores), BURBUJAS Y TARJETAS
// =====================================================================
const SPEAKERS = {
  lia: { name: 'Lía', color: PAL.coral, voice: 520 },
  pix: { name: 'PÍX', color: PAL.teal, voice: 1100 },
  teo: { name: 'Teó', color: PAL.orange, voice: 300 },
  vega: { name: 'Prof. Vega', color: PAL.lilac, voice: 260 },
  eclipse: { name: 'ECLIPSE', color: '#C9B2FF', voice: 150, glitch: true },
  aurora: { name: 'AURORA', color: PAL.aqua, voice: 210 },
  pz: { name: 'PERFECT ZERO', color: '#FFFFFF', voice: 523 },
  prisma: { name: 'PRISMA', color: PAL.pink, voice: 660, rainbow: true },
  lumi: { name: 'Lumi', color: PAL.sun, voice: 880 },
  beta: { name: 'BETA', color: '#C9D2F0', voice: 700 },
  sistema: { name: 'TERMINAL', color: PAL.lime, voice: 1200 },
  narrador: { name: '', color: PAL.cream, voice: 0 }
};
for (const k in CAST) if (!SPEAKERS[k]) SPEAKERS[k] = { name: CAST[k].name, color: shade(CAST[k].shirt, 0.25), voice: CAST[k].voice };

const TEXT_CPS = [28, 55, 120, 9999];

const Dlg = {
  box: null,
  open(who, text, expr, choices) {
    const sp = SPEAKERS[who] || SPEAKERS.narrador;
    const hasPortrait = who !== 'narrador' && who !== 'sistema';
    const maxW = hasPortrait ? 410 : 450;
    this.box = { who, sp, text, expr: expr || 'n', lines: wrapRich(text, maxW, who === 'aurora' || who === 'pz' || who === 'sistema' ? (who === 'sistema' ? PAL.lime : '#E8F4FF') : PAL.cream), shown: 0, total: 0, t: 0, choices, sel: 0, done: false, hasPortrait, open: 0 };
    this.box.total = this.box.lines.reduce((s, l) => s + richLen(l), 0);
    if (G.save.settings.textSpeed === 3) this.box.shown = this.box.total;
  },
  close() { this.box = null; },
  update(dt) {
    const b = this.box; if (!b) return null;
    if (G.autoDialog) { b.shown = b.total; return b.choices ? { choice: G.autoChoice || 0 } : { next: true }; }
    b.open = Math.min(1, b.open + dt * 8);
    const cps = TEXT_CPS[G.save.settings.textSpeed] * (Input.down('run') ? 4 : 1);
    if (b.shown < b.total) {
      const prev = Math.floor(b.shown);
      b.shown = Math.min(b.total, b.shown + cps * dt);
      if (Math.floor(b.shown) !== prev && Math.floor(b.shown) % 2 === 0 && b.sp.voice) AudioSys.sfx('text', b.sp.voice * (1 + (Math.random() - 0.5) * 0.12));
    }
    const adv = Input.hit('confirm') || Input.hit('interact') || (Input.pointer.pressed && !TouchPad.consumesPointer(Input.pointer.x, Input.pointer.y));
    const complete = b.shown >= b.total;
    if (b.choices && complete) {
      if (Input.hit('up')) { b.sel = (b.sel + b.choices.length - 1) % b.choices.length; AudioSys.sfx('hover'); }
      if (Input.hit('down')) { b.sel = (b.sel + 1) % b.choices.length; AudioSys.sfx('hover'); }
      // selección con puntero
      const P = Input.pointer;
      const r = this.choiceRects();
      r.forEach((rc, i) => { if (inRect(P.x, P.y, rc)) { if (b.sel !== i && Input.lastDevice === 'mouse') AudioSys.sfx('hover'); b.sel = i; } });
      if (P.pressed) {
        const hit = r.findIndex(rc => inRect(P.x, P.y, rc));
        if (hit >= 0) { b.sel = hit; AudioSys.sfx('confirm'); Input.consume(); return { choice: hit }; }
        return null;
      }
      if (Input.hit('confirm') || Input.hit('interact')) { AudioSys.sfx('confirm'); Input.consume(); return { choice: b.sel }; }
      return null;
    }
    if (adv) {
      Input.consume();
      if (!complete) { b.shown = b.total; return null; }
      AudioSys.sfx('click');
      return { next: true };
    }
    if (complete && Input.down('run') && !b.choices) { b.autoT = (b.autoT || 0) + dt; if (b.autoT > 0.25) return { next: true }; }
    return null;
  },
  choiceRects() {
    const b = this.box; if (!b || !b.choices) return [];
    const w = Math.max(...b.choices.map(c => textW(c))) + 20;
    const h = 14;
    const x = W - w - 10, y0 = b.atTop ? 82 : 192 - b.choices.length * (h + 2) - 4;
    return b.choices.map((c, i) => ({ x, y: y0 + i * (h + 2), w, h }));
  },
  draw(g) {
    const b = this.box; if (!b) return;
    const lv = G.run.level, top = Scenes.top();
    if (b.open < 0.2) b.atTop = !!(lv && top && top.lv === lv && (lv.player.y - lv.cam.y) > 110);
    const oy = Math.round((1 - easeOut(b.open)) * 20) * (b.atTop ? -1 : 1);
    const x = 6, y = (b.atTop ? 8 : 196) + oy, w = W - 12, h = 70;
    const hc = G.save.settings.highContrast;
    panel(g, x, y, w, h, { bg: hc ? '#000000' : 'rgba(14,18,40,0.95)', border: b.sp.color, hi: shade(b.sp.color, -0.3) });
    let tx = x + 10;
    if (b.hasPortrait) {
      const pt = Portraits.get(b.who, b.expr);
      rect(g, x + 6, y + 6, 36, 36, '#0B1020'); strokeRect(g, x + 5, y + 5, 38, 38, b.sp.color);
      const shake = b.sp.glitch && Math.random() < 0.15 ? randi(-1, 1) : 0;
      g.drawImage(pt, x + 8 + shake, y + 8);
      if (b.sp.glitch && Math.random() < 0.3) rect(g, x + 8, y + 8 + randi(0, 30), 32, 1, '#FF7FCF');
      tx = x + 50;
    }
    // nombre
    if (b.sp.name) {
      const nw = textW(b.sp.name) + 12;
      const ny = b.atTop ? y + h - 4 : y - 9;
      panel(g, tx - 4, ny, nw, 13, { bg: shade(b.sp.color, -0.55), border: b.sp.color });
      if (b.sp.rainbow) { let cx = tx + 2; for (const ch of b.sp.name) { drawText(g, ch, cx, ny + 4, hsl(Time.t * 120 + cx * 8, 90, 70)); cx += Font.charW(ch); } }
      else drawText(g, b.sp.name, tx + 2, ny + 4, b.sp.color);
    }
    // texto
    let remaining = Math.floor(b.shown);
    b.lines.forEach((ln, i) => {
      if (remaining <= 0) return;
      const n = richLen(ln);
      const gx = b.sp.glitch && Math.random() < 0.04 ? 1 : 0;
      drawRichLine(g, ln, tx + gx, y + 10 + i * 12, { limit: remaining });
      remaining -= n;
    });
    // indicador de continuar
    if (b.shown >= b.total && !b.choices) {
      const bob = Math.floor(Time.t * 4) % 2;
      drawText(g, '▼', x + w - 12, y + h - 12 + bob, b.sp.color);
    }
    // opciones
    if (b.choices && b.shown >= b.total) {
      const rects = this.choiceRects();
      rects.forEach((rc, i) => {
        const sel = i === b.sel;
        panel(g, rc.x, rc.y, rc.w, rc.h, { border: sel ? PAL.sun : '#3E4C8A', bg: sel ? '#2A3570' : 'rgba(14,18,40,0.95)' });
        drawText(g, (sel ? '▶ ' : '  ') + b.choices[i], rc.x + 5, rc.y + 4, sel ? PAL.sun : PAL.cream);
      });
    }
  }
};

// ---------- Burbujas (frases cortas en el mundo) ----------
const Bark = {
  list: [],
  say(target, text, dur = 2.4, color = PAL.ink) {
    this.list = this.list.filter(b => b.target !== target);
    this.list.push({ target, text, t: dur, max: dur, color });
    if (target === 'pix' || (target && target.isPix)) AudioSys.sfx('pix');
  },
  clear() { this.list = []; },
  update(dt) { for (const b of this.list) b.t -= dt; this.list = this.list.filter(b => b.t > 0); },
  draw(g, camX, camY, resolve) {
    for (const b of this.list) {
      const tgt = typeof b.target === 'string' ? resolve(b.target) : b.target;
      if (!tgt) continue;
      const lines = wrapPlain(b.text, 150);
      const w = Math.max(...lines.map(l => textW(l))) + 8, h = lines.length * 10 + 5;
      let x = Math.round(tgt.x + (tgt.w || 0) / 2 - camX - w / 2), y = Math.round(tgt.y - camY - h - 8);
      x = clamp(x, 2, W - w - 2); y = clamp(y, 2, H - h - 2);
      const pop = Math.min(1, (b.max - b.t) * 8);
      if (pop < 1) y += Math.round((1 - pop) * 4);
      rect(g, x + 1, y, w - 2, h, '#FFF3D7'); rect(g, x, y + 1, w, h - 2, '#FFF3D7');
      strokeRect(g, x, y, w, h, '#10162B');
      const tx = clamp(Math.round(tgt.x + (tgt.w || 0) / 2 - camX), x + 3, x + w - 4);
      rect(g, tx - 1, y + h, 3, 1, '#FFF3D7'); rect(g, tx, y + h + 1, 1, 2, '#FFF3D7');
      px(g, tx - 2, y + h, '#10162B'); px(g, tx + 2, y + h, '#10162B'); px(g, tx - 1, y + h + 1, '#10162B'); px(g, tx + 1, y + h + 1, '#10162B'); px(g, tx, y + h + 3, '#10162B');
      lines.forEach((l, i) => drawText(g, l, x + 4, y + 4 + i * 10, b.color));
    }
  }
};

// ---------- Corutinas de escena ----------
const Cut = {
  gen: null, cur: null, active: false, onEnd: null, stack: [],
  run(genFn, onEnd) {
    if (this.active) { this.stack.push({ genFn, onEnd }); return; }
    this.gen = genFn(); this.active = true; this.onEnd = onEnd || null;
    this.step(undefined);
  },
  step(val) {
    let guard = 0;
    while (guard++ < 1000) {
      let r;
      try { r = this.gen.next(val); } catch (e) { console.error(e); r = { done: true }; }
      if (r.done) { this.finish(); return; }
      const cmd = r.value;
      if (!cmd || typeof cmd.update !== 'function') { val = undefined; continue; }
      this.cur = cmd;
      if (cmd.start) cmd.start();
      if (cmd.instant) { val = cmd.result; this.cur = null; continue; }
      return;
    }
  },
  finish() {
    this.gen = null; this.cur = null; this.active = false; this.free = false; Dlg.close();
    const cb = this.onEnd; this.onEnd = null;
    if (cb) cb();
    if (!this.active && this.stack.length) { const n = this.stack.shift(); this.run(n.genFn, n.onEnd); }
  },
  update(dt) {
    if (!this.active || !this.cur) return;
    const done = this.cur.update(dt);
    if (done) { const v = this.cur.result; this.cur = null; this.step(v); }
  },
  draw(g) { if (this.cur && this.cur.draw) this.cur.draw(g); },
  abort() { this.gen = null; this.cur = null; this.active = false; this.free = false; this.stack = []; Dlg.close(); }
};

// Fábrica de comandos
const C = {
  say(who, text, expr) {
    return {
      start() { Dlg.open(who, text, expr); },
      update(dt) { const r = Dlg.update(dt); if (r && r.next) { Dlg.close(); return true; } return false; },
      draw(g) { Dlg.draw(g); }
    };
  },
  ask(who, text, options, expr) {
    const cmd = {
      result: 0,
      start() { Dlg.open(who, text, expr, options); },
      update(dt) { const r = Dlg.update(dt); if (r && r.choice != null) { cmd.result = r.choice; Dlg.close(); return true; } return false; },
      draw(g) { Dlg.draw(g); }
    };
    return cmd;
  },
  wait(t) { let e = 0; return { update(dt) { e += dt * (G.autoDialog ? 20 : 1); return e >= t; } }; },
  until(fn) { return { update() { return !!fn(); } }; },
  now(fn) { return { instant: true, start() { fn(); }, update() { return true; } }; },
  // devuelve el control a la jugadora hasta que se cumpla la condición
  play(fn) { return { start() { Cut.free = true; }, update() { const d = !!fn(); if (d) Cut.free = false; return d; } }; },
  all(cmds) {
    return {
      start() { cmds.forEach(c => c.start && c.start()); this.done = cmds.map(() => false); },
      update(dt) { cmds.forEach((c, i) => { if (!this.done[i]) this.done[i] = !!c.update(dt); }); return this.done.every(Boolean); },
      draw(g) { cmds.forEach(c => c.draw && c.draw(g)); }
    };
  },
  title(text, sub, dur = 3, color = PAL.sun) {
    let t = 0;
    return {
      update(dt) { t += dt * (G.autoDialog ? 20 : 1); if (t > 0.8 && (Input.hit('confirm') || Input.pointer.pressed)) { Input.consume(); t = Math.max(t, dur - 0.4); } return t >= dur; },
      draw(g) {
        const a = Math.min(1, t * 3, (dur - t) * 3);
        g.globalAlpha = clamp(a, 0, 1) * 0.75; rect(g, 0, 100, W, 64, '#10162B'); g.globalAlpha = clamp(a, 0, 1);
        rect(g, 0, 100, W, 1, color); rect(g, 0, 163, W, 1, color);
        drawText(g, text, W / 2, 114, color, { align: 'center', scale: 2, outline: '#10162B' });
        if (sub) drawText(g, sub, W / 2, 142, PAL.cream, { align: 'center' });
        g.globalAlpha = 1;
      }
    };
  },
  fade(to = 1, dur = 0.6, color = '#000000') {
    let t = 0; const from = Cut.fadeA || 0;
    return {
      start() { Cut.fadeColor = color; },
      update(dt) { t += dt; Cut.fadeA = lerp(from, to, clamp(t / dur, 0, 1)); return t >= dur; }
    };
  },
  flash(c = '#FFFFFF', a = 0.9) { return C.now(() => FX.flash(c, a)); },
  shake(m = 4, t = 0.4) { return C.now(() => FX.shake(m, t)); },
  sfx(n) { return C.now(() => AudioSys.sfx(n)); },
  music(n) { return C.now(() => AudioSys.playSong(n)); },
  // abre una escena encima y espera a que se cierre; el resultado es lo que devuelva la escena
  scene(makeScene) {
    const cmd = {
      result: null, done: false,
      start() { const s = makeScene(r => { cmd.result = r; cmd.done = true; }); Scenes.push(s); },
      update() { return cmd.done; }
    };
    return cmd;
  },
  ability(id) { return C.scene(done => new AbilityCardScene(id, done)); },
  concept(id) { return C.scene(done => new ConceptCardScene(id, done)); }
};
function* talk(lines) {
  for (const l of lines) {
    if (typeof l === 'function') { l(); continue; }
    if (l.ask) { const r = yield C.ask(l[0], l[1], l.ask, l[2]); if (l.then) l.then(r); continue; }
    yield C.say(l[0], l[1], l[2]);
  }
}

// ---------- Tarjeta de habilidad desbloqueada ----------
class AbilityCardScene {
  constructor(id, done) { this.id = id; this.done = done; this.t = 0; this.opaque = false; giveAbility(id); }
  update(dt) {
    this.t += dt;
    if (G.autoDialog) { Scenes.pop(); this.done(true); return; }
    if (this.t > 0.2 && this.t < 0.25) AudioSys.sfx('fanfare');
    if (this.t > 1 && (Input.hit('confirm') || Input.hit('interact') || Input.pointer.pressed)) { Input.consume(); Scenes.pop(); this.done(true); }
    if (Math.random() < 0.5) Particles.spawn({ x: rand(140, 340), y: rand(60, 200), vy: -20, life: 1, type: 'star', color: ABILITIES[this.id].color, screen: true });
  }
  draw(g) {
    const a = ABILITIES[this.id];
    const k = easeBack(clamp(this.t * 2, 0, 1));
    g.globalAlpha = Math.min(0.7, this.t * 2); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const w = 280, h = 150, x = (W - w) / 2, y = (H - h) / 2 + (1 - k) * 60;
    panel(g, x, y, w, h, { border: a.color, accent: a.color, accentW: 60 });
    for (let r = 30; r > 8; r -= 6) pring(g, x + 40, y + 50, r + Math.sin(this.t * 4 + r) * 2, shade(a.color, -0.3 + r / 100));
    pcircle(g, x + 40, y + 50, 9, a.color); pcircle(g, x + 40, y + 50, 5, PAL.white);
    drawText(g, 'NUEVA HABILIDAD', x + 80, y + 14, PAL.cream);
    drawText(g, a.name, x + 80, y + 28, a.color, { scale: 2, outline: '#10162B' });
    drawText(g, 'Concepto: ' + a.concept, x + 80, y + 52, PAL.sun);
    drawPara(g, a.desc, x + 80, y + 66, w - 92, PAL.cream);
    if (a.key) keyHint(g, x + 16, y + h - 24, a.key, a.key === 'ability' ? 'usar (también cambia con R)' : 'activar', PAL.cream);
    drawText(g, 'Continuar ▶', x + w - 10, y + h - 20, PAL.lime, { align: 'right' });
    Particles.draw(g, 0, 0, true);
  }
}

// ---------- Tarjeta de concepto (fase NOMBRAR del ciclo pedagógico) ----------
class ConceptCardScene {
  constructor(id, done) { this.id = id; this.done = done; this.t = 0; this.opaque = false; unlockCodex(id); }
  update(dt) {
    this.t += dt;
    if (G.autoDialog) { Scenes.pop(); this.done(true); return; }
    if (this.t > 0.8 && (Input.hit('confirm') || Input.hit('interact') || Input.pointer.pressed)) { Input.consume(); Scenes.pop(); this.done(true); }
  }
  draw(g) {
    const e = CODEX[this.id];
    g.globalAlpha = Math.min(0.75, this.t * 2); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const k = easeOut(clamp(this.t * 2.5, 0, 1));
    const w = 330, h = 170, x = (W - w) / 2, y = (H - h) / 2 + (1 - k) * 30;
    const col = e.cat === 'energias' ? PAL.lime : PAL.teal;
    panel(g, x, y, w, h, { border: col, accent: col, accentW: 80 });
    drawText(g, 'ESO QUE ACABAS DE HACER TIENE NOMBRE:', x + 12, y + 12, PAL.cream);
    drawText(g, e.title.toUpperCase(), x + 12, y + 26, col, { scale: 2, outline: '#10162B' });
    let yy = y + 50;
    yy += drawPara(g, e.short, x + 12, yy, w - 24, PAL.cream) + 4;
    if (e.example) {
      panel(g, x + 12, yy, w - 24, Math.min(64, e.example.split('\n').length * 10 + 8), { bg: '#0B1020', border: '#2A3570', flat: true });
      e.example.split('\n').slice(0, 6).forEach((l, i) => drawText(g, l, x + 18, yy + 5 + i * 10, PAL.lime));
    }
    drawText(g, '+ ATLAS AURORA', x + 12, y + h - 14, PAL.sun);
    drawText(g, 'Continuar ▶', x + w - 10, y + h - 14, PAL.lime, { align: 'right' });
  }
}
