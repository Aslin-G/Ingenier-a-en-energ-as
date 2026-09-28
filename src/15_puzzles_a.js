// =====================================================================
//  PUZZLES ESPECIALES (A): base común, secuencias/pipeline, flujo, estados
// =====================================================================
class PuzzleBase {
  constructor(cfg, done) {
    this.cfg = cfg; this.done = done; this.opaque = true; this.t = 0;
    this.msg = cfg.intro || ''; this.msgColor = PAL.cream; this.msgWho = cfg.who || 'pix';
    this.hintLevel = 0; this.fails = 0; this.runs = 0; this.result = null; this.state = 'edit';
    UI.nav = true; UI.focus = null;
    if (cfg.music) AudioSys.playSong(cfg.music);
  }
  say(msg, color = PAL.cream, who) { this.msg = msg; this.msgColor = color; if (who) this.msgWho = who; }
  hint() {
    const H = this.cfg.hints || [];
    if (this.hintLevel >= H.length) { this.say('No quedan más pistas. Observa el resultado paso a paso.', PAL.sun); return; }
    const h = H[this.hintLevel++]; G.save.stats.hints++;
    this.say('★ PISTA ' + this.hintLevel + ': ' + (typeof h === 'string' ? h : h.text), PAL.sun, this.cfg.hintWho);
    if (h.apply) h.apply(this);
    AudioSys.sfx('confirm');
  }
  failed(msg) { this.fails++; G.save.stats.fails++; this.state = 'error'; this.say('✗ ' + msg, PAL.coral); AudioSys.sfx('fail'); addMastery(this.cfg.concepts || [], -1); if (this.fails === 2 && this.hintLevel === 0) this.msg += ' (Prueba una PISTA.)'; }
  succeeded(msg, extra) {
    this.state = 'success'; this.say('✓ ' + msg, PAL.lime); AudioSys.sfx('win');
    this.result = { success: true, firstTry: this.fails === 0 && this.hintLevel === 0, hints: this.hintLevel, fails: this.fails, attempts: this.runs, extra };
    for (let i = 0; i < 30; i++) Particles.spawn({ x: rand(40, W - 40), y: rand(30, 180), vx: rand(-40, 40), vy: rand(-60, -10), grav: 60, life: rand(0.8, 1.6), type: 'star', color: choice([PAL.sun, PAL.lime, PAL.teal, PAL.pink]), screen: true });
  }
  exit(r) {
    UI.nav = false; UI.scope = null; UI.cancelHeld(); Scenes.pop();
    r = r || { success: false, hints: this.hintLevel, fails: this.fails };
    if (r.success) {
      G.save.stats.puzzles++;
      if (r.firstTry) { G.save.stats.firstTry++; if (this.cfg.main) achieve('no_hints'); }
      addMastery(this.cfg.concepts || [], r.firstTry ? 14 : r.hints >= 2 ? 6 : 10);
      if (this.fails) addMastery('debugging', 3);
      addXP(this.cfg.xp || (this.cfg.main ? 40 : 25), this.cfg.title);
      Save.write();
    }
    this.done(r);
  }
  update(dt) {
    this.t += dt;
    if (G.autoWin && !this.result) { this.exit({ success: true, firstTry: true, hints: 0, fails: 0, extra: { tries: 3 } }); return; }
    if (Input.hit('hint') && !this.popup) this.hint();
    if (Input.hit('pause') && UI.held == null && !this.popup) { Input.consume(); if (this.result) this.exit(this.result); else this.exit(null); }
    if (this.tick) this.tick(dt);
  }
  drawHeader(g, label = 'RETO') {
    vGradient(g, 0, 0, W, H, [[0, '#141A3A'], [1, '#0B1020']], false);
    rect(g, 0, 0, W, 16, '#0B1020'); rect(g, 0, 16, W, 1, '#2A3570');
    drawText(g, label, 6, 5, PAL.teal); drawText(g, this.cfg.title, 12 + textW(label), 5, PAL.cream);
    let cx = W - 6;
    for (const c of (this.cfg.tags || []).slice().reverse()) { const w = textW(c) + 8; cx -= w; rect(g, cx, 3, w, 11, c.match(/SOLAR|EÓLICA|HIDRO|BIOMASA|GEOTERMIA|HIDRÓGENO|ALMACEN|MICRORED|ENERG/) ? '#2A5A1A' : '#1A3A5A'); drawText(g, c, cx + 4, 5, PAL.cream); cx -= 3; }
  }
  drawFooter(g, buttons) {
    const y = 227;
    rect(g, 0, y - 1, W, 1, '#2A3570');
    let x = 4;
    for (const b of buttons) { if (!b) continue; if (UI.btn(g, b.id, x, y + 2, b.w, 15, b.label, b)) b.fn(); x += b.w + 3; }
    if (!this.result) { if (UI.btn(g, 'hint', x, y + 2, 46, 15, 'PISTA', { color: PAL.sun, icon: 'star' })) this.hint(); x += 49; }
    if (UI.btn(g, 'atlas', x, y + 2, 40, 15, 'ATLAS', { color: PAL.teal })) Scenes.push(new CodexScene(this.cfg.codex)); x += 43;
    if (this.result) { if (UI.btn(g, 'cont', W - 124, y + 2, 120, 15, 'CONTINUAR ▶', { primary: true, color: PAL.lime })) this.exit(this.result); }
    else if (UI.btn(g, 'exit', W - 40, y + 2, 36, 15, 'SALIR', {})) this.exit(null);
    const my = y + 20;
    g.drawImage(Portraits.get(this.msgWho, this.state === 'error' ? 'pensando' : this.state === 'success' ? 'feliz' : 'n'), 0, 0, 32, 32, 4, my, 16, 16);
    const lines = wrapRich(this.msg, W - 30, this.msgColor);
    const off = lines.length > 2 ? Math.floor(this.t * 0.4) % (lines.length - 1) : 0;
    lines.slice(off, off + 2).forEach((ln, i) => drawRichLine(g, ln, 24, my + 1 + i * 9));
    Particles.draw(g, 0, 0, true);
    UI.drawTooltip(g);
  }
}

// ---------------------------------------------------------------------
//  SECUENCIA / PIPELINE: ordenar tarjetas y ejecutar paso a paso
// ---------------------------------------------------------------------
class SeqScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.slots = new Array(cfg.slots || cfg.answer.length).fill(null);
    this.pool = shuffle(cfg.cards.map(c => c.id), mulberry32(hashStr(cfg.title || 'reto')));
    this.stepI = -1; this.stepT = 0; this.marks = []; this.energy = 100; this.flowK = 0;
    this.say(cfg.intro || 'Ordena las tarjetas en las casillas y pulsa EJECUTAR.');
  }
  card(id) { return this.cfg.cards.find(c => c.id === id); }
  run() {
    if (this.slots.some(s => !s)) { this.say('Faltan casillas por llenar. Cada paso del algoritmo cuenta.', PAL.sun); AudioSys.sfx('error'); return; }
    this.state = 'running'; this.stepI = -1; this.stepT = 0.3; this.marks = []; this.energy = 100; this.runs++;
    AudioSys.sfx('run'); this.say('Ejecutando la secuencia...');
  }
  tick(dt) {
    let d;
    while ((d = UI.anyDrop())) {
      if (this.state === 'running') continue;
      if (this.state !== 'edit') { this.state = 'edit'; this.marks = []; }
      const p = d.payload;
      if (!d.target) continue;
      if (d.target.startsWith('slot')) {
        const i = +d.target.slice(4);
        const prev = this.slots[i];
        if (p.from === 'pool') { this.pool = this.pool.filter(x => x !== p.id); if (prev) this.pool.push(prev); this.slots[i] = p.id; }
        else if (p.from === 'slot') { const j = p.slot; this.slots[j] = prev; this.slots[i] = p.id; }
        AudioSys.sfx('place');
      } else if (d.target === 'pool' && p.from === 'slot') { this.slots[p.slot] = null; this.pool.push(p.id); AudioSys.sfx('remove'); }
    }
    if (this.state !== 'running') return;
    this.stepT -= dt;
    this.flowK += dt;
    if (this.stepT > 0) return;
    this.stepI++;
    if (this.stepI >= this.slots.length) {
      const extra = this.cfg.finalCheck ? this.cfg.finalCheck(this) : null;
      if (extra) { this.failed(extra); return; }
      this.succeeded(this.cfg.okMsg || '¡Secuencia correcta!'); if (this.cfg.onFirstOk) this.cfg.onFirstOk(); return;
    }
    const id = this.slots[this.stepI];
    const ok = this.cfg.answer[this.stepI] === id || (this.cfg.accept && this.cfg.accept(this.stepI, id, this.slots));
    const c = this.card(id);
    if (ok && c.loss) this.energy *= c.loss;
    this.marks[this.stepI] = ok;
    AudioSys.sfx(ok ? 'ok' : 'fail');
    if (!ok) {
      const why = this.cfg.why ? this.cfg.why(this.stepI, id, this.slots) : null;
      this.failed(`PASO ${this.stepI + 1} ✗ «${c.label}» no puede ir aquí. ${why || ''}`);
      return;
    }
    this.stepT = 0.7;
  }
  draw(g) {
    this.drawHeader(g, this.cfg.label || 'SECUENCIA');
    const cfg = this.cfg, n = this.slots.length;
    // visual
    panel(g, 6, 22, W - 12, 92, { border: '#2A3570', bg: '#0B1020' });
    if (cfg.visual) cfg.visual(g, 8, 24, W - 16, 88, this);
    // casillas
    const sw = Math.min(106, Math.floor((W - 20) / n) - 6), sx0 = Math.round((W - n * (sw + 6)) / 2);
    drawText(g, cfg.slotLabel || 'ALGORITMO (ordena los pasos):', 8, 120, PAL.sun);
    for (let i = 0; i < n; i++) {
      const x = sx0 + i * (sw + 6), y = 132;
      const id = this.slots[i];
      // tocar una casilla llena devuelve su tarjeta al montón
      const st = UI.register('slot' + i, x, y, sw, 36, {});
      if (UI.clicked('slot' + i) && id && this.state !== 'running') { if (this.state !== 'edit') { this.state = 'edit'; this.marks = []; } this.slots[i] = null; this.pool.push(id); AudioSys.sfx('remove'); }
      const mk = this.marks[i];
      rect(g, x, y, sw, 36, st.hover || st.focus ? '#2A3570' : '#1A2248');
      strokeRect(g, x, y, sw, 36, mk === true ? PAL.lime : mk === false ? PAL.coral : this.stepI === i && this.state === 'running' ? PAL.sun : !id && this.slots.indexOf(null) === i ? PAL.sun : '#3E4C8A');
      if (id && (st.hover || st.focus) && this.state !== 'running') drawText(g, '✗', x + sw - 8, y + 26, PAL.coral);
      drawText(g, (i + 1) + '', x + 3, y + 3, '#8C93B8');
      if (id) this.drawCard(g, this.card(id), x + 2, y + 10, sw - 4, st.held);
      if (mk != null) drawText(g, mk ? '✓' : '✗', x + sw - 8, y + 3, mk ? PAL.lime : PAL.coral);
      if (i < n - 1) drawText(g, '→', x + sw + 1, y + 16, '#5A6090');
      if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, x, y, sw, 36);
    }
    // tarjetas disponibles
    const pst = UI.register('pool', 6, 172, W - 12, 52, { drop: true, nav: false });
    rect(g, 6, 172, W - 12, 52, pst.hover && UI.dragging ? '#1A2A50' : '#10162B');
    drawText(g, 'TARJETAS · toca una para ponerla en la siguiente casilla; toca una casilla para quitarla', 10, 175, '#8C93B8');
    // una fila si caben (hasta 5 tarjetas), si no dos filas; tarjetas tan anchas como permita el panel
    const total = this.cfg.cards.length, cols = total <= 5 ? total : Math.ceil(total / 2);
    const pw = Math.min(150, Math.floor((W - 20) / Math.max(1, cols)) - 4);
    this.pool.forEach((id, k) => {
      const col = k % cols, row = Math.floor(k / cols);
      const x = 10 + col * (pw + 4), y = 184 + row * 20;
      // tocar una tarjeta la coloca en la primera casilla libre
      const st = UI.register('card' + id, x, y, pw, 18, {});
      if (UI.clicked('card' + id) && this.state !== 'running') {
        const free = this.slots.indexOf(null);
        if (free < 0) { this.say('Todas las casillas están llenas: toca una casilla para devolver su tarjeta.', PAL.sun); AudioSys.sfx('error'); }
        else { if (this.state !== 'edit') { this.state = 'edit'; this.marks = []; } this.slots[free] = id; this.pool = this.pool.filter(x2 => x2 !== id); AudioSys.sfx('place'); }
      }
      this.drawCard(g, this.card(id), x, y, pw, st.held, st.hover || st.focus);
      if (st.hover && this.card(id).desc) UI.tooltip = this.card(id).desc;
      if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, x, y, pw, 18);
    });
    this.drawFooter(g, [
      this.result ? null : { id: 'run', w: 70, label: '▶ EJECUTAR', primary: true, color: PAL.lime, fn: () => this.run(), disabled: this.state === 'running' }
    ]);
  }
  drawCard(g, c, x, y, w, held, hover) {
    rect(g, x, y, w, 18, held ? '#5A4A1A' : hover ? '#2A4A6A' : '#1C3350'); rect(g, x, y, 3, 18, c.color || PAL.teal);
    if (c.icon) icon(g, c.icon, x + 5, y + 5);
    const tx = x + (c.icon ? 15 : 6);
    const lines = wrapPlain(c.label, w - (tx - x) - 2);
    if (lines.length > 2) { lines.length = 2; lines[1] = lines[1].replace(/.$/, '…'); }
    lines.forEach((l, i) => drawText(g, l, tx, y + (lines.length > 1 ? 2 : 6) + i * 8, held ? PAL.sun : PAL.cream));
  }
}

// Visual de cadena energética (captar → convertir → almacenar → usar)
function visualEnergyChain(stages) {
  return (g, x, y, w, h, sc) => {
    const n = stages.length;
    const done = sc.marks.filter(m => m).length;
    for (let i = 0; i < n; i++) {
      const cx = x + 30 + i * (w - 60) / (n - 1), cy = y + (sc.cfg.showEnergy ? 30 : 40); // deja sitio a la barra de energía
      const on = i < done;
      stages[i](g, cx, cy, on, sc.t);
      if (i < n - 1) {
        const nx = x + 30 + (i + 1) * (w - 60) / (n - 1);
        pline(g, cx + 18, cy, nx - 18, cy, on ? PAL.sun : '#3A4068', on ? 0 : 3);
        if (on && i + 1 < done + 1) for (let k = 0; k < 3; k++) { const f = ((sc.t * 1.2 + k / 3) % 1); rect(g, lerp(cx + 18, nx - 18, f), cy - 1, 2, 2, PAL.sun); }
      }
    }
    if (sc.cfg.showEnergy) {
      bar(g, x + 10, y + h - 14, w - 20, 8, sc.energy, 100, PAL.aqua);
      drawText(g, 'energía útil que llega: ' + Math.round(sc.energy) + '%', x + w / 2, y + h - 24, PAL.aqua, { align: 'center' });
    }
  };
}
const CHAIN_ICONS = {
  sun: (g, x, y, on, t) => { pcircle(g, x, y, 10, on ? PAL.sun : '#6A5A2A'); for (let k = 0; k < 8; k++) { const a = k * 0.785 + t * 0.5; px(g, x + Math.cos(a) * 14, y + Math.sin(a) * 14, PAL.sun); } drawText(g, 'SOL', x, y + 18, PAL.sun, { align: 'center' }); },
  panel: (g, x, y, on, t) => { for (let k = 0; k < 8; k++) rect(g, x - 12 + k, y - 6 + k, 22, 1, k === 0 ? '#9FE8FF' : on ? '#2A6ADA' : '#2A3A6A'); drawText(g, 'PANEL', x, y + 18, PAL.sky, { align: 'center' }); },
  battery: (g, x, y, on, t) => { rect(g, x - 3, y - 13, 6, 3, '#8A8FB0'); rect(g, x - 8, y - 10, 16, 22, '#2A2F6A'); rect(g, x - 6, y + 10 - (on ? 16 : 3), 12, on ? 16 : 3, on ? PAL.lime : PAL.coral); drawText(g, 'BATERÍA', x, y + 18, PAL.lime, { align: 'center' }); },
  lamp: (g, x, y, on, t) => { rect(g, x - 1, y - 2, 2, 14, '#3A4068'); pcircle(g, x, y - 6, 6, on ? PAL.sun : '#3A4068'); if (on) { g.globalAlpha = 0.3; pcircle(g, x, y - 6, 14, PAL.sun); g.globalAlpha = 1; } drawText(g, 'FARO', x, y + 18, PAL.cream, { align: 'center' }); },
  water: (g, x, y, on, t) => { pcircle(g, x, y, 9, on ? PAL.sky : '#2A4A6A'); rect(g, x - 2, y - 14, 4, 6, on ? PAL.sky : '#2A4A6A'); drawText(g, 'AGUA', x, y + 18, PAL.sky, { align: 'center' }); },
  bolt: (g, x, y, on, t) => { drawText(g, '⚡', x - 2, y - 8, on ? PAL.sun : '#5A5A3A', { scale: 2 }); drawText(g, 'ELECTR.', x, y + 18, PAL.sun, { align: 'center' }); },
  electro: (g, x, y, on, t) => { rect(g, x - 10, y - 10, 20, 20, on ? '#9FE8FF' : '#3A4A6A'); for (let k = 0; k < 4; k++) px(g, x - 6 + k * 4, y + 6 - ((t * 20 + k * 5) % 14), '#FFFFFF'); drawText(g, 'ELECTRÓL.', x, y + 18, PAL.aqua, { align: 'center' }); },
  h2: (g, x, y, on, t) => { pcircle(g, x - 5, y, 6, on ? PAL.aqua : '#2A4A5A'); pcircle(g, x + 5, y, 6, on ? PAL.aqua : '#2A4A5A'); drawText(g, 'H2', x, y - 3, PAL.ink, { align: 'center' }); drawText(g, 'H2', x, y + 18, PAL.aqua, { align: 'center' }); },
  tank: (g, x, y, on, t) => { rect(g, x - 8, y - 12, 16, 24, on ? '#FFFFFF' : '#5A6090'); pellipse(g, x, y - 12, 8, 3, '#C9D2F0'); drawText(g, 'TANQUE', x, y + 18, PAL.cream, { align: 'center' }); },
  cell: (g, x, y, on, t) => { rect(g, x - 10, y - 8, 20, 16, on ? PAL.orange : '#5A4A3A'); for (let k = 0; k < 4; k++) rect(g, x - 8 + k * 5, y - 6, 2, 12, '#10162B'); drawText(g, 'PILA', x, y + 18, PAL.orange, { align: 'center' }); },
  ship: (g, x, y, on, t) => { for (let k = 0; k < 6; k++) rect(g, x - 14 + k, y + 2 + k, 28 - k * 2, 1, PAL.coral); rect(g, x - 6, y - 6, 12, 8, '#FFF3D7'); if (on) rect(g, x - 16, y + 4, 3, 1, '#FFFFFF'); drawText(g, 'BARCO', x, y + 18, PAL.coral, { align: 'center' }); },
  turbine: (g, x, y, on, t) => { rect(g, x - 1, y - 4, 2, 16, '#FFFFFF'); for (let b = 0; b < 3; b++) { const a = (on ? t * 6 : 0) + b * 2.09; pline(g, x, y - 6, x + Math.cos(a) * 10, y - 6 + Math.sin(a) * 10, '#FFFFFF'); } drawText(g, 'TURBINA', x, y + 18, PAL.cream, { align: 'center' }); }
};

// ---------------------------------------------------------------------
//  FLUJO: diagrama de flujo editable que controla una simulación real
// ---------------------------------------------------------------------
const FLOW_TYPES = {
  start: { label: 'INICIO', color: PAL.lime, outs: ['next'] },
  read: { label: 'LEER radiación', color: PAL.aqua, outs: ['next'] },
  dec: { label: '¿radiación > U?', color: PAL.orange, outs: ['yes', 'no'] },
  charge: { label: 'cargar_bateria', color: PAL.teal, outs: ['next'], act: 'cargar_bateria' },
  use: { label: 'usar_bateria', color: PAL.teal, outs: ['next'], act: 'usar_bateria' },
  close: { label: 'cerrar_paneles', color: PAL.teal, outs: ['next'], act: 'cerrar_paneles' },
  dec2: { label: '¿polvo?', color: PAL.orange, outs: ['yes', 'no'] },
  end: { label: 'FIN', color: PAL.lime, outs: [] }
};
class FlowScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.nodes = cloneProg(cfg.start || []);
    this.nextId = 100; this.conn = null; this.world = cfg.world; this.st = this.world.init();
    this.threshold = cfg.threshold0 || 800;
    this.running = false; this.tokenAt = null; this.errNode = null;
    this.COLS = 4; this.ROWS = 6; this.CW = 62; this.CH = 30; this.OX = 100; this.OY = 22;
    this.say(cfg.intro || 'Arrastra nodos a la cuadrícula y conéctalos: toca un puerto (●) y luego el nodo destino.');
  }
  nodeAt(c, r) { return this.nodes.find(n => n.c === c && n.r === r); }
  byId(id) { return this.nodes.find(n => n.id === id); }
  nodeRect(n) { return { x: this.OX + n.c * this.CW + 3, y: this.OY + n.r * this.CH + 3, w: this.CW - 6, h: 16 }; }
  validate() {
    const starts = this.nodes.filter(n => n.type === 'start'), ends = this.nodes.filter(n => n.type === 'end');
    if (starts.length !== 1) return { msg: starts.length ? 'Solo puede haber un INICIO.' : 'Falta el nodo INICIO.', node: starts[1] };
    if (!ends.length) return { msg: 'Falta el nodo FIN: el algoritmo debe terminar.' };
    for (const n of this.nodes) {
      for (const o of FLOW_TYPES[n.type].outs) if (!n[o] || !this.byId(n[o])) return { msg: `«${this.nodeLabel(n)}» tiene una salida ${o === 'yes' ? 'SÍ' : o === 'no' ? 'NO' : ''} sin conectar.`, node: n };
    }
    // alcanzable
    const seen = new Set(); const q = [starts[0].id];
    while (q.length) { const id = q.shift(); if (seen.has(id)) continue; seen.add(id); const n = this.byId(id); for (const o of FLOW_TYPES[n.type].outs) if (n[o]) q.push(n[o]); }
    if (!ends.some(e => seen.has(e.id))) return { msg: 'Desde INICIO nunca se llega a FIN.' };
    const orphan = this.nodes.find(n => !seen.has(n.id));
    if (orphan) return { msg: `«${this.nodeLabel(orphan)}» no está conectado al flujo: nunca se ejecutará.`, node: orphan };
    return null;
  }
  nodeLabel(n) { return n.type === 'dec' ? '¿radiación > ' + this.threshold + '?' : FLOW_TYPES[n.type].label; }
  run() {
    const err = this.validate();
    if (err) { this.errNode = err.node ? err.node.id : null; this.failed(err.msg); return; }
    this.runs++; this.st = this.world.init(); this.running = true; this.hour = 0; this.cur = this.nodes.find(n => n.type === 'start').id; this.stepT = 0.2; this.steps = 0; this.state = 'running'; this.errNode = null;
    this.world.onTick(this.st, 0);
    AudioSys.sfx('run'); this.say('Simulando un día completo: el diagrama se ejecuta cada hora.');
  }
  tick(dt) {
    let d;
    while ((d = UI.anyDrop())) this.onDrop(d);
    if (this.world.update) this.world.update(this.st, dt);
    if (!this.running) return;
    this.stepT -= dt; if (this.stepT > 0) return;
    const n = this.byId(this.cur);
    this.tokenAt = n.id; this.stepT = this.cfg.fast ? 0.08 : 0.18; this.steps++;
    if (this.steps > 40) { this.running = false; this.errNode = n.id; this.failed('El flujo da vueltas sin llegar a FIN. ¿Hay un ciclo sin salida?'); return; }
    const env = { vars: {}, st: this.st };
    if (n.type === 'end') {
      const r = this.world.afterTick(this.st, this.hour, env);
      if (r && r.fail) { this.running = false; this.failed(r.fail); return; }
      this.hour++; this.steps = 0;
      if (this.hour >= this.cfg.hours) { this.running = false; const res = this.world.check(this.st); if (res.ok) this.succeeded(res.msg); else this.failed(res.msg); return; }
      this.world.onTick(this.st, this.hour);
      this.cur = this.nodes.find(x => x.type === 'start').id; this.stepT = 0.25; return;
    }
    if (FLOW_TYPES[n.type].act) { this.world.act(FLOW_TYPES[n.type].act, null, this.st, env); AudioSys.sfx('tick', 3); }
    if (n.type === 'dec') { const v = this.world.sensors.radiacion(this.st) > this.threshold; this.lastDec = { id: n.id, v, t: 0.5 }; this.cur = v ? n.yes : n.no; AudioSys.sfx(v ? 'ok' : 'select'); return; }
    if (n.type === 'dec2') { const v = (this.cfg.world.weatherAt ? this.cfg.world.weatherAt(this.st) : '') === 'polvo'; this.lastDec = { id: n.id, v, t: 0.5 }; this.cur = v ? n.yes : n.no; return; }
    this.cur = n.next;
  }
  onDrop(d) {
    if (this.running) return;
    if (this.state !== 'edit') this.state = 'edit';
    const p = d.payload;
    if (d.target === 'trash' && p.move) { this.nodes = this.nodes.filter(n => n.id !== p.move); this.nodes.forEach(n => { for (const o of ['next', 'yes', 'no']) if (n[o] === p.move) n[o] = null; }); AudioSys.sfx('remove'); return; }
    if (!d.target || !d.target.startsWith('cell:')) return;
    const [c, r] = d.target.slice(5).split(',').map(Number);
    if (this.nodeAt(c, r)) return;
    if (p.newType) {
      if (p.newType === 'start' && this.nodes.some(n => n.type === 'start')) { this.say('Ya hay un INICIO.', PAL.sun); return; }
      this.nodes.push({ id: this.nextId++, type: p.newType, c, r }); AudioSys.sfx('place');
    } else if (p.move) { const n = this.byId(p.move); if (n) { n.c = c; n.r = r; AudioSys.sfx('place'); } }
  }
  portPos(n, o) {
    const R = this.nodeRect(n);
    if (o === 'next') return { x: R.x + R.w / 2, y: R.y + R.h + 3 };
    if (o === 'yes') return { x: R.x + 8, y: R.y + R.h + 3 };
    return { x: R.x + R.w - 8, y: R.y + R.h + 3 };
  }
  draw(g) {
    this.drawHeader(g, 'FLOWCHART');
    // panel izquierdo: instrucciones y umbral (el diagrama ya viene armado: nada que arrastrar)
    panel(g, 4, 20, 92, 204, { border: '#2A3570' });
    drawText(g, 'CÓMO SE EDITA', 10, 25, PAL.sun);
    drawPara(g, 'Toca un nodo de {c}acción{/} para cambiarlo.\n\nToca {y}⇄{/} junto al rombo para intercambiar SÍ y NO.\n\nAbajo: umbral con − +.', 10, 38, 80, '#C9D2F0');
    drawText(g, 'UMBRAL U', 10, 150, PAL.orange);
    drawText(g, this.threshold + ' W/m²', 50, 162, PAL.sun, { align: 'center' });
    const edit = () => { if (this.state !== 'edit') this.state = 'edit'; };
    if (UI.btn(g, 'thDn', 8, 158, 14, 13, '−', { color: PAL.orange, disabled: this.running })) { edit(); this.threshold = Math.max(0, this.threshold - 100); AudioSys.sfx('click'); }
    if (UI.btn(g, 'thUp', 78, 158, 14, 13, '+', { color: PAL.orange, disabled: this.running })) { edit(); this.threshold = Math.min(1000, this.threshold + 100); AudioSys.sfx('click'); }
    // cuadrícula
    panel(g, this.OX - 4, 20, this.COLS * this.CW + 8, 204, { border: '#2A3570', bg: '#0B1020' });
    for (let r = 0; r < this.ROWS; r++) for (let c = 0; c < this.COLS; c++) {
      const x = this.OX + c * this.CW, y = this.OY + r * this.CH;
      if (!this.nodeAt(c, r)) { g.globalAlpha = 0.25; px(g, x + this.CW / 2, y + this.CH / 2, '#5A6090'); g.globalAlpha = 1; }
    }
    // conexiones
    for (const n of this.nodes) for (const o of FLOW_TYPES[n.type].outs) {
      const t = n[o] && this.byId(n[o]); if (!t) continue;
      const a = this.portPos(n, o), R = this.nodeRect(t);
      const b = { x: R.x + R.w / 2, y: R.y - 1 };
      const col = o === 'yes' ? PAL.lime : o === 'no' ? PAL.coral : '#8C93B8';
      if (b.y > a.y) { const my = a.y + 4; pline(g, a.x, a.y, a.x, my, col); pline(g, a.x, my, b.x, my, col); pline(g, b.x, my, b.x, b.y, col); }
      else { const rx = this.OX + this.COLS * this.CW + (o === 'no' ? 0 : -2); pline(g, a.x, a.y, a.x, a.y + 3, col); pline(g, a.x, a.y + 3, rx, a.y + 3, col); pline(g, rx, a.y + 3, rx, b.y - 3, col); pline(g, rx, b.y - 3, b.x, b.y - 3, col); pline(g, b.x, b.y - 3, b.x, b.y, col); }
      px(g, b.x - 1, b.y - 1, col); px(g, b.x + 1, b.y - 1, col);
    }
    // nodos
    for (const n of this.nodes) {
      const R = this.nodeRect(n), T = FLOW_TYPES[n.type];
      const acts = this.cfg.actTypes || ['charge', 'use'];
      const isAct = acts.includes(n.type);
      const st = UI.register('node:' + n.id, R.x, R.y, R.w, R.h, { nav: isAct && !this.running });
      if (UI.clicked('node:' + n.id) && isAct && !this.running) { this.state = 'edit'; n.type = acts[(acts.indexOf(n.type) + 1) % acts.length]; AudioSys.sfx('place'); }
      if (isAct && st.hover && !this.running) UI.tooltip = 'Toca para cambiar la acción';
      const active = this.tokenAt === n.id && this.running, err = this.errNode === n.id;
      const bg = active ? '#5A4A1A' : err ? '#5A1A2A' : '#1A2248';
      if (n.type === 'dec' || n.type === 'dec2') { for (let k = 0; k < R.h; k++) { const ww = Math.round((R.w / 2) * (1 - Math.abs(k - R.h / 2) / (R.h / 2 + 2))); rect(g, R.x + R.w / 2 - ww, R.y + k, ww * 2, 1, bg); } }
      else if (n.type === 'start' || n.type === 'end') { rect(g, R.x + 3, R.y, R.w - 6, R.h, bg); rect(g, R.x, R.y + 3, R.w, R.h - 6, bg); }
      else { rect(g, R.x, R.y, R.w, R.h, bg); if (n.type === 'read') { rect(g, R.x, R.y, 2, R.h, T.color); } }
      strokeRect(g, R.x, R.y, R.w, R.h, active ? PAL.sun : err ? PAL.coral : st.hover || st.focus ? PAL.white : T.color);
      const lbl = n.type === 'dec' ? 'rad > ' + this.threshold + '?' : T.label;
      drawText(g, lbl.length > 11 ? lbl.slice(0, 10) + '…' : lbl, R.x + R.w / 2, R.y + 5, active ? PAL.sun : PAL.cream, { align: 'center' });
      if (this.lastDec && this.lastDec.id === n.id && this.running) drawText(g, this.lastDec.v ? 'SÍ' : 'NO', R.x + R.w + 1, R.y + 5, this.lastDec.v ? PAL.lime : PAL.coral);
      if ((n.type === 'dec' || n.type === 'dec2') && !this.running && UI.btn(g, 'swap:' + n.id, R.x + R.w + 2, R.y + 3, 12, 11, '⇄', { color: PAL.orange, tip: 'Intercambiar las salidas SÍ y NO' })) { this.state = 'edit'; [n.yes, n.no] = [n.no, n.yes]; AudioSys.sfx('swap'); }
      // etiquetas de las salidas del rombo (sin puertos que conectar)
      if (n.type === 'dec' || n.type === 'dec2') { const py = R.y + R.h + 3; drawText(g, 'SÍ', R.x + 2, py - 3, PAL.lime); drawText(g, 'NO', R.x + R.w - 12, py - 3, PAL.coral); }
      if (this.cfg.editPorts) for (const o of T.outs) {
        const p = this.portPos(n, o);
        const pid = 'port:' + n.id + ':' + o;
        const pst = UI.register(pid, p.x - 5, p.y - 4, 10, 8);
        const on = this.conn && this.conn.id === n.id && this.conn.o === o;
        pcircle(g, p.x, p.y, 3, on ? PAL.sun : o === 'yes' ? PAL.lime : o === 'no' ? PAL.coral : '#8C93B8');
        if (pst.hover || pst.focus) pring(g, p.x, p.y, 5, PAL.white);
        if (o !== 'next') drawText(g, o === 'yes' ? 'SÍ' : 'NO', p.x + (o === 'yes' ? -14 : 5), p.y - 3, o === 'yes' ? PAL.lime : PAL.coral);
        if (UI.clicked(pid)) { this.conn = on ? null : { id: n.id, o }; AudioSys.sfx('select'); if (this.conn) this.say('Ahora toca el nodo al que debe ir esta salida.', PAL.sun); }
      }
      if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, R.x, R.y, R.w, R.h);
    }
    if (this.conn) { const n = this.byId(this.conn.id); if (n) { const p = this.portPos(n, this.conn.o); pline(g, p.x, p.y, Input.pointer.x, Input.pointer.y, PAL.sun, 2, Math.floor(this.t * 10)); } }
    // mundo
    panel(g, 358, 20, 118, 204, { border: '#2A3570', bg: '#0B1020' });
    g.save(); g.beginPath(); g.rect(360, 22, 114, 120); g.clip();
    this.world.draw(g, 360, 22, 114, 120, this.st, this.t, { state: this.running ? 'running' : 'edit' });
    g.restore();
    const S = this.world.sensors;
    const rows = [['hora', S.hora(this.st) + ':00'], ['radiación', S.radiacion(this.st)], ['batería', S.bateria(this.st) + '%'], ['apagones', this.st.blackout]];
    rows.forEach((r, i) => { drawText(g, r[0], 364, 148 + i * 11, i === 3 && this.st.blackout ? PAL.coral : PAL.aqua); drawText(g, String(r[1]), 470, 148 + i * 11, PAL.cream, { align: 'right' }); });
    drawPara(g, 'El diagrama decide qué hacer {y}cada hora{/}.', 364, 196, 108, '#8C93B8');
    this.drawFooter(g, [this.result ? null : { id: 'run', w: 70, label: this.running ? '...' : '▶ EJECUTAR', primary: true, color: PAL.lime, fn: () => { if (!this.running) this.run(); } },
      this.result || !this.running ? null : { id: 'stop', w: 44, label: '■ PARAR', color: PAL.coral, fn: () => { this.running = false; this.state = 'edit'; this.say('Detenido.'); } },
      this.result ? null : { id: 'fast', w: 50, label: this.cfg.fast ? 'RÁPIDO' : 'NORMAL', color: PAL.sun, fn: () => { this.cfg.fast = !this.cfg.fast; } }]);
  }
}

// ---------------------------------------------------------------------
//  MÁQUINA DE ESTADOS (Gea Profunda)
// ---------------------------------------------------------------------
class FSMScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.states = cfg.states; this.events = cfg.events;
    this.trans = cloneProg(cfg.start || []); // {from, to, ev}
    this.sel = null; this.pickEv = null; this.runLog = []; this.runI = -1; this.cur = cfg.initial || 'OFF'; this.temp = 20;
    this.say(cfg.intro || 'Toca un estado ORIGEN, luego un DESTINO y elige el evento.');
  }
  pos(s) {
    const i = this.states.indexOf(s), n = this.states.length;
    const a = -Math.PI / 2 + i / n * Math.PI * 2;
    return { x: 190 + Math.cos(a) * 86, y: 104 + Math.sin(a) * 66 };
  }
  step(state, ev) { const t = this.trans.find(t => t.from === state && t.ev === ev); return t ? t.to : null; }
  run() {
    this.runs++; this.state = 'running'; this.runLog = []; this.scI = 0; this.evI = -1; this.cur = this.cfg.initial || 'OFF'; this.stepT = 0.4; this.temp = 20;
    // seguridad estática primero
    for (const f of this.cfg.forbidden || []) {
      const bad = this.trans.find(t => t.from === f.from && t.to === f.to);
      if (bad) { this.badT = bad; this.failed(f.msg); return; }
    }
    AudioSys.sfx('run'); this.say('Probando escenarios de operación...');
  }
  tick(dt) {
    if (this.state !== 'running') return;
    this.stepT -= dt; if (this.stepT > 0) return;
    const sc = this.cfg.scenarios[this.scI];
    if (!sc) { achieve('safe_states'); this.succeeded(this.cfg.okMsg || '¡La planta geotérmica opera de forma segura!'); return; }
    this.evI++;
    if (this.evI === 0) { this.cur = sc.from || this.cfg.initial || 'OFF'; this.runLog.push({ text: 'Escenario ' + (this.scI + 1) + ': ' + sc.name, c: PAL.sun }); }
    if (this.evI >= sc.events.length) {
      if (sc.expect && this.cur !== sc.expect) { this.failed(`Escenario «${sc.name}»: terminó en ${this.cur}, se esperaba ${sc.expect}.`); return; }
      this.scI++; this.evI = -1; this.stepT = 0.5; return;
    }
    const ev = sc.events[this.evI];
    const nx = this.step(this.cur, ev);
    this.lastEv = { ev, t: 0.6 };
    if (!nx) {
      if (sc.mustHandle !== false) { this.runLog.push({ text: `${this.cur} --${ev}--> ?`, c: PAL.coral }); this.failed(`Escenario «${sc.name}»: en ${this.cur} ocurre «${ev}» y no hay transición. La máquina se queda atascada.`); return; }
      this.runLog.push({ text: `${this.cur}: ignora ${ev}`, c: '#8C93B8' });
    } else {
      this.runLog.push({ text: `${this.cur} --${ev}--> ${nx}`, c: PAL.lime });
      this.cur = nx; AudioSys.sfx('ok');
      this.temp = { OFF: 20, STARTING: 90, RUNNING: 160, COOLING: 80, FAULT: 220, DIAGNOSTIC: 120 }[nx] || this.temp;
    }
    if (this.runLog.length > 8) this.runLog.shift();
    this.stepT = 0.55;
  }
  draw(g) {
    this.drawHeader(g, 'ESTADOS');
    panel(g, 4, 20, 372, 204, { border: '#2A3570', bg: '#0B1020' });
    // transiciones
    this.trans.forEach((t, i) => {
      const a = this.pos(t.from), b = this.pos(t.to);
      const bad = this.badT === t && this.state === 'error';
      const col = bad ? PAL.coral : '#8C93B8';
      const off = (i % 2 ? 6 : -6);
      const mx = (a.x + b.x) / 2 + (a.y - b.y) * 0.12 + off * 0.3, my = (a.y + b.y) / 2 + (b.x - a.x) * 0.12;
      pline(g, a.x, a.y, mx, my, col); pline(g, mx, my, b.x, b.y, col);
      const dx = b.x - mx, dy = b.y - my, L = Math.hypot(dx, dy) || 1;
      const ax = b.x - dx / L * 16, ay = b.y - dy / L * 12;
      pcircle(g, ax, ay, 2, col);
      const lw = textW(t.ev) + 6;
      const id = 'tr:' + i;
      const st = UI.register(id, mx - lw / 2, my - 5, lw, 10);
      rect(g, mx - lw / 2, my - 5, lw, 10, st.hover || st.focus ? '#5A1A2A' : '#10162B');
      drawText(g, t.ev, mx, my - 3, bad ? PAL.coral : PAL.sun, { align: 'center' });
      if (st.hover) UI.tooltip = 'Toca para borrar: ' + t.from + ' → ' + t.to;
      if (UI.clicked(id) && this.state !== 'running') { this.trans.splice(i, 1); AudioSys.sfx('remove'); this.state = 'edit'; }
    });
    // estados
    for (const s of this.states) {
      const p = this.pos(s);
      const col = { OFF: '#8C93B8', STARTING: PAL.sun, RUNNING: PAL.lime, COOLING: PAL.sky, FAULT: PAL.coral, DIAGNOSTIC: PAL.violet }[s] || PAL.teal;
      const id = 'st:' + s;
      const st = UI.register(id, p.x - 30, p.y - 10, 60, 20);
      const cur = this.cur === s && this.state === 'running';
      const selected = this.sel === s;
      pellipse(g, p.x, p.y, 30, 10, cur ? shade(col, -0.3) : '#1A2248');
      for (let a = 0; a < 6.28; a += 0.05) px(g, p.x + Math.cos(a) * 30, p.y + Math.sin(a) * 10, selected ? PAL.white : col);
      drawText(g, s, p.x, p.y - 3, cur ? PAL.white : col, { align: 'center' });
      if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, p.x - 30, p.y - 10, 60, 20);
      if (UI.clicked(id) && this.state !== 'running') {
        if (this.state !== 'edit') this.state = 'edit';
        if (!this.sel) { this.sel = s; AudioSys.sfx('select'); this.say('Origen: ' + s + '. Ahora toca el estado DESTINO.', PAL.sun); }
        else { this.pickEv = { from: this.sel, to: s }; this.sel = null; AudioSys.sfx('select'); }
      }
    }
    if (this.lastEv && this.state === 'running') { drawText(g, '⚡ ' + this.lastEv.ev, 190, 196, PAL.sun, { align: 'center', outline: PAL.ink }); }
    // panel derecho: planta y registro
    panel(g, 380, 20, 96, 204, { border: '#2A3570' });
    PROP_DRAW.geoplant(g, 400, 26, { t: this.t, cfg: { state: () => this.cur } }, null);
    drawText(g, 'T = ' + this.temp + '°C', 428, 80, this.temp > 200 ? PAL.coral : PAL.orange, { align: 'center' });
    drawText(g, 'REGISTRO', 384, 94, PAL.sun);
    this.runLog.forEach((l, i) => drawText(g, l.text.length > 17 ? l.text.slice(0, 16) + '…' : l.text, 384, 106 + i * 10, l.c));
    // selector de evento
    if (this.pickEv) {
      const P = this.pickEv;
      const w = 150, h = 16 + this.events.length * 13, x = 120, y = 60;
      rect(g, 0, 0, W, H, 'rgba(5,7,15,0.5)');
      UI.scope = 'ev';
      panel(g, x, y, w, h, { border: PAL.sun });
      drawText(g, P.from + ' → ' + P.to + ' cuando...', x + 6, y + 4, PAL.sun);
      this.events.forEach((e, i) => {
        if (UI.btn(g, 'ev:' + e, x + 4, y + 15 + i * 13, w - 8, 12, e, { group: 'ev' })) {
          this.trans = this.trans.filter(t => !(t.from === P.from && t.ev === e));
          this.trans.push({ from: P.from, to: P.to, ev: e }); this.pickEv = null; UI.scope = null; AudioSys.sfx('place');
          this.say(`Transición añadida: ${P.from} --${e}--> ${P.to}`, PAL.lime);
        }
      });
      if (Input.hit('back')) { this.pickEv = null; UI.scope = null; }
    }
    this.drawFooter(g, [this.result ? null : { id: 'run', w: 70, label: '▶ PROBAR', primary: true, color: PAL.lime, fn: () => { if (this.state !== 'running') this.run(); } },
      this.result ? null : { id: 'clear', w: 50, label: 'LIMPIAR', color: PAL.coral, fn: () => { this.trans = cloneProg(this.cfg.start || []); this.state = 'edit'; } }]);
  }
}
