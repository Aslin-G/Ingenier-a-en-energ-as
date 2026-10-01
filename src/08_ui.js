// =====================================================================
//  UI INMEDIATA: botones, foco con teclado, arrastrar/soltar, táctil
//  Los widgets se registran al dibujar; los clics se resuelven en update.
// =====================================================================
const UI = {
  items: [], last: [], focus: null, hover: null, press: null,
  clicks: new Set(), drops: [], held: null, heldFrom: null, dragging: null, dragFrom: null,
  nav: false, scope: null, tooltip: null, blink: 0, lastFocusMove: 0,
  beginFrame() { this.last = this.items; this.items = []; this.tooltip = null; if (this.scope && !this.last.some(i => i.group === this.scope)) this.scope = null; },
  register(id, x, y, w, h, o = {}) {
    const it = { id, x, y, w, h, nav: o.nav !== false, drag: o.drag, drop: !!o.drop, group: o.group || null, disabled: !!o.disabled };
    this.items.push(it);
    return {
      hover: this.hover === id, focus: this.nav && this.focus === id, pressed: this.press === id && Input.pointer.down,
      held: this.held != null && this.heldFrom === id, dragging: this.dragging != null && this.dragFrom === id
    };
  },
  clicked(id) { if (this.clicks.has(id)) { this.clicks.delete(id); return true; } return false; },
  dropped(id) {
    const i = this.drops.findIndex(d => d.target === id);
    if (i < 0) return null;
    const d = this.drops[i]; this.drops.splice(i, 1); return d;
  },
  anyDrop() { return this.drops.length ? this.drops.shift() : null; },
  cancelHeld() { this.held = null; this.heldFrom = null; },
  setFocus(id) { this.focus = id; },
  topAt(x, y) {
    for (let i = this.last.length - 1; i >= 0; i--) { const it = this.last[i]; if (!it.disabled && x >= it.x && x < it.x + it.w && y >= it.y && y < it.y + it.h) return it; }
    return null;
  },
  update() {
    this.blink += 1 / 60;
    const P = Input.pointer;
    const over = this.topAt(P.x, P.y);
    const newHover = over ? over.id : null;
    if (newHover && newHover !== this.hover && Input.lastDevice === 'mouse') AudioSys.sfx('hover');
    this.hover = newHover;
    if (P.pressed) {
      this.press = over ? over.id : null;
      this.pressItem = over;
      if (over) { this.focus = over.id; }
    }
    if (P.down && this.pressItem && this.pressItem.drag != null && P.moved && !this.dragging) {
      this.dragging = this.pressItem.drag; this.dragFrom = this.pressItem.id; this.cancelHeld();
    }
    if (P.released) {
      if (this.dragging != null) {
        const tgt = this.topAt(P.x, P.y);
        if (tgt && tgt.drop) this.drops.push({ target: tgt.id, payload: this.dragging, from: this.dragFrom });
        else this.drops.push({ target: null, payload: this.dragging, from: this.dragFrom });
        this.dragging = null; this.dragFrom = null;
      } else if (over && this.press === over.id) {
        this.activate(over);
      }
      this.press = null; this.pressItem = null;
    }
    // navegación con teclado / mando
    if (this.nav) {
      const dirs = [['left', -1, 0], ['right', 1, 0], ['up', 0, -1], ['down', 0, 1]];
      for (const [a, dx, dy] of dirs) if (Input.hit(a)) this.moveFocus(dx, dy);
      if (Input.hit('confirm') || (Input.hit('interact') && !Input.hit('confirm'))) {
        const it = this.last.find(i => i.id === this.focus);
        if (it && !it.disabled) this.activate(it);
      }
      if (!this.last.find(i => i.id === this.focus && i.nav && (!this.scope || i.group === this.scope))) {
        const first = this.last.find(i => i.nav && !i.disabled && (!this.scope || i.group === this.scope));
        if (first) this.focus = first.id;
      }
    }
    if (Input.hit('back') && this.held != null) { this.cancelHeld(); Input.consume(); }
    // limpiar entradas no consumidas tras un tiempo
    if (this.clicks.size && !P.released && !Input.hit('confirm')) { this._age = (this._age || 0) + 1; if (this._age > 3) { this.clicks.clear(); this._age = 0; } } else this._age = 0;
    if (this.drops.length > 4) this.drops.splice(0, this.drops.length - 4);
  },
  activate(it) {
    if (it.disabled) return;
    if (this.held != null && it.drop) {
      this.drops.push({ target: it.id, payload: this.held, from: this.heldFrom });
      this.cancelHeld();
      return;
    }
    if (it.drag != null) {
      // clic en elemento arrastrable = tomarlo (modo seleccionar-y-colocar)
      if (this.heldFrom === it.id) { this.cancelHeld(); }
      else { this.held = it.drag; this.heldFrom = it.id; AudioSys.sfx('select'); }
      this.clicks.add(it.id);
      return;
    }
    this.clicks.add(it.id);
  },
  moveFocus(dx, dy) {
    const cur = this.last.find(i => i.id === this.focus);
    const cands = this.last.filter(i => i.nav && !i.disabled && i.id !== this.focus && (!this.scope || i.group === this.scope));
    if (!cur) { if (cands[0]) this.focus = cands[0].id; return; }
    const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2;
    let best = null, bd = 1e9;
    for (const c of cands) {
      const ox = c.x + c.w / 2 - cx, oy = c.y + c.h / 2 - cy;
      const along = ox * dx + oy * dy;
      if (along <= 2) continue;
      const perp = Math.abs(ox * dy) + Math.abs(oy * dx);
      const d = along + perp * 2.2;
      if (d < bd) { bd = d; best = c; }
    }
    if (best) { this.focus = best.id; AudioSys.sfx('hover'); }
  },
  // ---------- widgets dibujados ----------
  btn(g, id, x, y, w, h, label, o = {}) {
    const st = this.register(id, x, y, w, h, o);
    const col = o.color || PAL.teal;
    const hc = G.save.settings.highContrast;
    const active = st.hover || st.focus;
    const dy = st.pressed ? 1 : 0;
    let bg = o.bg || (o.primary ? shade(col, -0.45) : hc ? '#05070F' : '#1C2550');
    if (active) bg = shade(bg, 0.12);
    if (o.disabled) bg = '#1A1F38';
    rect(g, x + 1, y + dy, w - 2, h, bg); rect(g, x, y + 1 + dy, w, h - 2, bg);
    const bcol = o.disabled ? '#3A4068' : active ? (hc ? PAL.white : shade(col, 0.2)) : o.primary ? col : (hc ? PAL.white : '#3E4C8A');
    strokeRect(g, x, y + dy, w, h, bcol);
    px(g, x, y + dy, '#10162B'); px(g, x + w - 1, y + dy, '#10162B'); px(g, x, y + h - 1 + dy, '#10162B'); px(g, x + w - 1, y + h - 1 + dy, '#10162B');
    if (!st.pressed) rect(g, x + 1, y + h, w - 2, 1, 'rgba(0,0,0,0.35)');
    if (o.icon) icon(g, o.icon, x + 4, y + Math.floor((h - 8) / 2) + dy);
    const tx = o.icon ? x + 14 + (w - 14) / 2 : x + w / 2;
    // etiquetas largas se recortan con «…» y muestran el texto completo como ayuda
    const maxW = w - (o.icon ? 16 : 4);
    if (label && label.length > 1 && textW(label) > maxW) {
      const full = label;
      while (label.length > 1 && textW(label + '…') > maxW) label = label.slice(0, -1);
      label = label.trimEnd() + '…';
      if (!o.tip && st.hover) this.tooltip = full;
    }
    drawText(g, label, Math.round(tx), y + Math.floor((h - 7) / 2) + dy, o.disabled ? '#5A6090' : active ? PAL.white : (o.textColor || PAL.cream), { align: 'center' });
    if (st.focus && Input.lastDevice !== 'mouse' && Input.lastDevice !== 'touch') this.focusRing(g, x, y + dy, w, h);
    if (o.tip && st.hover) this.tooltip = o.tip;
    return this.clicked(id);
  },
  focusRing(g, x, y, w, h, col = PAL.sun) {
    const on = Math.floor(this.blink * 4) % 2 === 0;
    strokeRect(g, x - 2, y - 2, w + 4, h + 4, on ? col : shade(col, -0.35));
  },
  toggle(g, id, x, y, w, label, value, o = {}) {
    const clicked = this.btn(g, id, x, y, w, 14, label + ': ' + (value ? 'SÍ' : 'NO'), Object.assign({ color: value ? PAL.lime : PAL.coral }, o));
    return clicked;
  },
  drawTooltip(g) {
    if (!this.tooltip) return;
    const lines = wrapRich(this.tooltip, 160);
    const w = Math.min(170, Math.max(...lines.map(l => l.reduce((s, x) => s + (x.t === ' ' ? 3 : textW(x.t) + 1), 0))) + 10);
    const h = lines.length * 11 + 6;
    let x = Input.pointer.x + 8, y = Input.pointer.y + 10;
    if (x + w > W - 2) x = W - w - 2; if (y + h > H - 2) y = Input.pointer.y - h - 4;
    panel(g, x, y, w, h, { border: PAL.sun });
    lines.forEach((ln, i) => drawRichLine(g, ln, x + 5, y + 5 + i * 11));
  }
};

// ---------- Controles táctiles en pantalla ----------
const TouchPad = {
  visible: false, alpha: 0,
  buttons() {
    return [
      { a: 'left', x: 8, y: 204, w: 36, h: 36, label: '◀' },
      { a: 'right', x: 50, y: 204, w: 36, h: 36, label: '▶' },
      { a: 'up', x: 29, y: 166, w: 36, h: 34, label: '▲' },
      { a: 'down', x: 29, y: 242, w: 36, h: 26, label: '▼' },
      { a: 'jump', x: 432, y: 210, w: 40, h: 40, label: 'A', col: PAL.lime },
      { a: 'attack', x: 388, y: 222, w: 38, h: 38, label: '⚔', col: PAL.coral },
      { a: 'interact', x: 352, y: 238, w: 30, h: 28, label: 'E', col: PAL.sun },
      { a: 'ability', x: 440, y: 170, w: 32, h: 32, label: 'Q', col: PAL.pink },
      { a: 'lens', x: 402, y: 184, w: 30, h: 30, label: 'F', col: PAL.teal },
      { a: 'pause', x: 446, y: 4, w: 28, h: 18, label: '≡', col: PAL.cream }
    ];
  },
  shouldShow() {
    const s = G.save.settings.touch;
    return s === 'on' || (s === 'auto' && Input.lastDevice === 'touch');
  },
  update(active) {
    this.visible = active && this.shouldShow();
    const target = this.visible ? 1 : 0;
    this.alpha = approach(this.alpha, target, 0.1);
    for (const b of this.buttons()) Input.virtual[b.a] = false;
    if (!this.visible) return;
    for (const [, t] of Input.touches) {
      for (const b of this.buttons()) {
        if (t.x >= b.x - 4 && t.x < b.x + b.w + 4 && t.y >= b.y - 4 && t.y < b.y + b.h + 4) Input.virtual[b.a] = true;
      }
    }
  },
  consumesPointer(x, y) {
    if (!this.visible) return false;
    return this.buttons().some(b => x >= b.x - 4 && x < b.x + b.w + 4 && y >= b.y - 4 && y < b.y + b.h + 4);
  },
  draw(g) {
    if (this.alpha <= 0.01) return;
    g.globalAlpha = this.alpha * 0.8;
    for (const b of this.buttons()) {
      const on = Input.virtual[b.a];
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      pcircle(g, cx, cy, Math.min(b.w, b.h) / 2, on ? 'rgba(255,255,255,0.45)' : 'rgba(16,22,43,0.55)');
      pring(g, cx, cy, Math.min(b.w, b.h) / 2, b.col || PAL.cream);
      drawText(g, b.label, cx, cy - 3, b.col || PAL.cream, { align: 'center' });
    }
    g.globalAlpha = 1;
  }
};

// ---------- Utilidades de HUD ----------
// ---------- Estrellas de un reto: 3 = a la primera sin pistas; se guarda el récord ----------
const puzzleStars = (fails, hints) => fails === 0 && hints === 0 ? 3 : fails <= 2 && hints <= 1 ? 2 : 1;
function recordStars(cfg, n) {
  const k = cfg.title || cfg.id || '?';
  G.save.stars = G.save.stars || {};
  const prev = G.save.stars[k] || 0;
  if (n > prev) G.save.stars[k] = n;
  return { n, prev, best: Math.max(prev, n), isNew: n > prev && prev > 0, t: Time.t };
}
// fila de 3 estrellas que aparecen una a una (rec = resultado de recordStars)
function drawStarRow(g, x, y, rec) {
  if (!rec) return;
  const dt = Time.t - rec.t;
  for (let i = 0; i < 3; i++) {
    const k = clamp((dt - i * 0.25) * 4, 0, 1), on = i < rec.n;
    if (k <= 0) continue;
    const sc = on && k < 1 ? 2 : 1, ox = sc === 2 ? -3 : 0;
    drawText(g, '★', x + i * 10 + ox, y + ox, on ? PAL.sun : '#3A4068', { outline: PAL.ink, scale: sc });
  }
  if (dt > 0.9) {
    if (rec.isNew) drawText(g, '¡RÉCORD!', x + 34, y, Math.floor(Time.t * 4) % 2 ? PAL.sun : PAL.lime);
    else if (rec.best > rec.n) drawText(g, 'mejor: ' + '★'.repeat(rec.best), x + 34, y, '#8C93B8');
  }
}
function keyHint(g, x, y, action, label, col = PAL.cream) {
  const k = Input.lastDevice === 'touch' ? ({ jump: 'A', interact: 'E', attack: '⚔', ability: 'Q', lens: 'F', hint: 'H', pause: '≡', codex: 'C', blueprint: 'B', confirm: 'TOCA', back: '✗' }[action] || action) : bindName(action);
  const kw = textW(k) + 6;
  rect(g, x, y, kw, 11, '#FFF3D7'); rect(g, x, y + 10, kw, 1, '#8C93B8');
  drawText(g, k, x + 3, y + 2, PAL.ink);
  if (label) drawText(g, label, x + kw + 4, y + 2, col, { shadow: PAL.ink });
  return kw + 4 + (label ? textW(label) + 8 : 0);
}
