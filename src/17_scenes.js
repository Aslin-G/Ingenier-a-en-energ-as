// =====================================================================
//  ESCENAS: gestor, juego, HUD, título, mapa, pausa, ajustes, Atlas...
// =====================================================================
const Scenes = {
  stack: [],
  push(s) { this.stack.push(s); if (s.onEnter) s.onEnter(); },
  pop() { const s = this.stack.pop(); if (s && s.onExit) s.onExit(); return s; },
  clear() { while (this.stack.length) this.pop(); Cut.abort(); },
  top() { return this.stack[this.stack.length - 1]; },
  replace(s) { this.pop(); this.push(s); }
};

const REGIONS = [
  { key: 'puerto', name: 'Puerto Inicial', prog: 'Secuencias', energy: 'Flujo de energía', x: 64, y: 198, transport: 'barca solar', col: PAL.teal },
  { key: 'valle', name: 'Valle Secuencia', prog: 'Secuencia y depuración', energy: 'Conversión', x: 116, y: 148, transport: 'barca solar', col: PAL.leaf },
  { key: 'solaria', name: 'Solaria', prog: 'Variables y SI', energy: 'Solar', x: 190, y: 204, transport: 'barca solar', col: PAL.sun },
  { key: 'aeris', name: 'Aeris', prog: 'Bucles', energy: 'Eólica', x: 158, y: 82, transport: 'planeador eólico', col: PAL.aqua },
  { key: 'hydria', name: 'Cascadas Hydria', prog: 'Funciones', energy: 'Hidroeléctrica', x: 256, y: 134, transport: 'ascensor hidráulico', col: PAL.sky },
  { key: 'bioloop', name: 'Bosque BioLoop', prog: 'Listas y recorridos', energy: 'Biomasa', x: 320, y: 208, transport: 'barca solar', col: PAL.lime },
  { key: 'gea', name: 'Gea Profunda', prog: 'Estados', energy: 'Geotermia', x: 382, y: 158, transport: 'teleférico geotérmico', col: PAL.coral },
  { key: 'h2', name: 'Bahía H2', prog: 'Pipelines', energy: 'Hidrógeno verde', x: 436, y: 214, transport: 'barca solar', col: PAL.aqua },
  { key: 'bateria', name: 'Ciudad Batería', prog: 'Búsqueda y orden', energy: 'Almacenamiento', x: 414, y: 90, transport: 'tranvía batería', col: PAL.pink },
  { key: 'prisma', name: 'Microred Prisma', prog: 'Integración', energy: 'Microred', x: 324, y: 60, transport: 'planeador eólico', col: PAL.violet },
  { key: 'faro', name: 'Faro Aurora', prog: 'Todo', energy: 'Sistema híbrido', x: 238, y: 38, transport: 'ascensor de luz', col: PAL.white }
];
const regionIdx = k => REGIONS.findIndex(r => r.key === k);
const restored = k => flag('restored_' + k);
const unlocked = k => { const i = regionIdx(k); return i === 0 || G.save.teacherAll || restored(REGIONS[i - 1].key) || restored(k); };

const Game = {
  update(dt) {
    Time.t += dt; Time.frame++;
    G.save.stats.playTime += dt;
    UI.update();
    const top = Scenes.top();
    TouchPad.update(!!(top && top.touchPad));
    if (top) top.update(dt);
    if (top && top.hostsCut && Scenes.top() === top) Cut.update(dt);
    Particles.update(dt); FX.update(dt); Toast.update(dt); Trans.update(dt);
    for (const c of AudioSys.captions) c.t -= dt; AudioSys.captions = AudioSys.captions.filter(c => c.t > 0);
    Save.flash = Math.max(0, Save.flash - dt);
  },
  draw() {
    UI.beginFrame();
    ctx.imageSmoothingEnabled = false;
    // dibujar desde la última escena opaca
    let start = 0;
    for (let i = Scenes.stack.length - 1; i >= 0; i--) if (Scenes.stack[i].opaque !== false) { start = i; break; }
    if (!Scenes.stack.length) rect(ctx, 0, 0, W, H, PAL.ink);
    for (let i = start; i < Scenes.stack.length; i++) {
      const s = Scenes.stack[i];
      if (i < Scenes.stack.length - 1) { const saved = UI.items; s.draw(ctx); UI.items = saved.length ? saved : []; UI.items = []; }
      else s.draw(ctx);
    }
    if (Cut.fadeA > 0.001) { ctx.globalAlpha = Cut.fadeA; rect(ctx, 0, 0, W, H, Cut.fadeColor || '#000'); ctx.globalAlpha = 1; }
    FX.drawFlash(ctx);
    Toast.draw(ctx);
    TouchPad.draw(ctx);
    if (G.save.settings.captions && AudioSys.captions.length) {
      AudioSys.captions.forEach((c, i) => { const w = textW(c.text) + 8; ctx.globalAlpha = Math.min(1, c.t * 2); rect(ctx, W / 2 - w / 2, 24 + i * 12, w, 11, 'rgba(0,0,0,0.6)'); drawText(ctx, c.text, W / 2, 26 + i * 12, '#C9D2F0', { align: 'center' }); ctx.globalAlpha = 1; });
    }
    if (Save.flash > 0) { ctx.globalAlpha = Math.min(1, Save.flash); icon(ctx, 'star', W - 12, H - 12); ctx.globalAlpha = 1; }
    Trans.draw(ctx);
  },
  newGame() {
    const settings = G.save.settings, teacher = G.save.teacherUnlocked, lab = G.save.labUnlocked;
    G.save = newSave(); G.save.settings = settings; G.save.started = true; G.save.teacherUnlocked = teacher; G.save.labUnlocked = lab;
    rebuildLia();
    Save.write();
    this.startLevel('festival');
  },
  continueGame() {
    Save.load(); rebuildLia();
    const sc = G.save.scene;
    if (LEVELS[sc] && sc !== 'festival') this.startLevel(sc, 'checkpoint');
    else if (flag('prologueDone')) this.toMap();
    else this.startLevel('festival');
  },
  startLevel(key, spawn) {
    Trans.go(() => {
      Scenes.clear(); Particles.clear(); Bark.clear();
      G.save.scene = key; G.save.lastRegion = LEVELS[key].region || G.save.lastRegion;
      Scenes.push(new GameplayScene(key, spawn));
    });
  },
  toMap(focus) {
    Trans.go(() => { Scenes.clear(); Particles.clear(); Bark.clear(); G.save.scene = 'map'; Save.write(); Scenes.push(new MapScene(focus)); });
  },
  toTitle() { Trans.go(() => { Scenes.clear(); Particles.clear(); Scenes.push(new TitleScene()); }); }
};

// ---------------------------------------------------------------------
//  ESCENA DE JUEGO (plataformas)
// ---------------------------------------------------------------------
class GameplayScene {
  constructor(key, spawn) {
    this.lv = new Level(key, spawn); G.run.level = this.lv;
    this.hostsCut = true; this.touchPad = true; this.opaque = true;
    const th = this.lv.theme;
    AudioSys.playSong(this.lv.def.music || th.music); AudioSys.ambient(this.lv.def.ambient || th.ambient);
    if (this.lv.def.onEnter) Cut.run(() => this.lv.def.onEnter(this.lv));
    G.save.started = true;
  }
  update(dt) {
    const lv = this.lv;
    if (!Cut.active && !Trans.busy) {
      if (Input.hit('pause')) { Input.consume(); Scenes.push(new PauseScene(lv)); return; }
      if (Input.hit('codex')) { Input.consume(); Scenes.push(new CodexScene()); return; }
      if (Input.hit('blueprint')) { Input.consume(); Scenes.push(new BlueprintScene()); return; }
      if (Input.hit('hint')) { Input.consume(); this.contextHint(); }
    }
    lv.update(dt);
    AudioSys.intensity = lv.def.intensity != null ? (typeof lv.def.intensity === 'function' ? lv.def.intensity(lv) : lv.def.intensity) : 0.35 + lv.power * 0.65;
  }
  contextHint() {
    const lv = this.lv;
    const h = lv.def.hint ? lv.def.hint(lv) : null;
    Bark.say('pix', h || 'Explora, habla con la gente y busca terminales con "?". F activa la Lente Debug.', 4);
  }
  draw(g) {
    this.lv.draw(g);
    drawHUD(g, this.lv);
    Cut.draw(g);
  }
}

function drawHUD(g, lv) {
  const p = lv.player;
  if (lv.def.noHud) return;
  // células de energía (forma de Lumi)
  for (let i = 0; i < p.maxCells; i++) {
    const on = i < p.cells;
    drawLumiShape(g, 6 + i * 10, 5, Spr.lumi[0], on ? PAL.sun : '#3A4068', on ? PAL.orange : '#22306B', false);
  }
  bar(g, 6, 14, 28, 4, p.energy, 100, PAL.teal, '#10162B');
  // habilidad actual
  const ab = G.save.currentAbility;
  if (ab && hasAbility(ab)) {
    const A = ABILITIES[ab];
    rect(g, 38, 3, 4, 14, A.color);
    drawText(g, A.name, 45, 3, A.color, { shadow: PAL.ink });
    let info = '';
    if (ab === 'shield') info = (p.shieldArmed ? (p.shieldOn ? '■ ACTIVO' : '○ armado') : 'desarmado') + ' · ' + ['SI peligro', 'SIEMPRE', 'SI saltando'][p.shieldRule];
    else if (ab === 'pack') info = 'mochila[' + (G.save.pack || []).length + ']';
    else if (ab === 'glide') info = 'mantén SALTO en el aire';
    if (info) drawText(g, info, 45, 12, '#C9D2F0', { shadow: PAL.ink });
  }
  if (hasAbility('lens') && !lv.lens && lv.time < 60 && lv.def.lensHint) keyHint(g, 6, 22, 'lens', 'Lente', '#C9D2F0');
  // coleccionables
  const ch = Object.keys(G.save.collectibles.chispas).length;
  icon(g, 'spark', W - 70, 4); drawText(g, String(ch), W - 60, 5, PAL.pink, { shadow: PAL.ink });
  icon(g, 'seed', W - 40, 4); drawText(g, String(G.save.collectibles.seeds), W - 30, 5, PAL.lime, { shadow: PAL.ink });
  // objetivo
  const obj = lv.def.objective ? lv.def.objective(lv) : null;
  if (obj && (!Cut.active || Cut.free)) {
    const w = Math.min(260, textW(obj) + 20);
    rect(g, 4, H - 18, w, 13, 'rgba(16,22,43,0.75)'); rect(g, 4, H - 18, 2, 13, PAL.sun);
    drawText(g, '▶ ' + obj, 9, H - 15, PAL.cream);
  }
  // indicador de interacción
  if (lv.nearby && (!Cut.active || Cut.free)) {
    const e = lv.nearby;
    const label = e.cfg && e.cfg.verb ? e.cfg.verb : e instanceof NPC ? 'Hablar' : e instanceof Exit ? (e.cfg.label ? 'Ir a ' + e.cfg.label.toLowerCase() : 'Ir al mapa') : 'Usar';
    const x = Math.round(e.x + e.w / 2 - lv.cam.x - 20), y = Math.round(e.y - lv.cam.y - 22);
    keyHint(g, clamp(x, 4, W - 80), clamp(y, 26, H - 30), 'interact', label, PAL.white);
  }
  // cartel de región
  if (lv.banner > 0 && lv.def.title) {
    const a = Math.min(1, lv.banner, (3.2 - lv.banner) * 3);
    g.globalAlpha = clamp(a, 0, 1);
    const t1 = lv.def.title, t2 = lv.def.subtitle || '';
    const w = Math.max(textW(t1) * 2, textW(t2)) + 30;
    rect(g, W / 2 - w / 2, 34, w, 40, 'rgba(16,22,43,0.8)'); rect(g, W / 2 - w / 2, 34, w, 1, PAL.sun); rect(g, W / 2 - w / 2, 73, w, 1, PAL.sun);
    drawText(g, t1, W / 2, 40, PAL.sun, { align: 'center', scale: 2 });
    drawText(g, t2, W / 2, 60, PAL.cream, { align: 'center' });
    g.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------
//  TÍTULO
// ---------------------------------------------------------------------
class TitleScene {
  constructor() {
    this.t = 0; this.opaque = true; this.bg = getBackground('festival'); this.pixX = -40; this.pixPhase = 0; this.rot = 0;
    this.hasSave = Save.exists();
    AudioSys.playSong('title'); AudioSys.ambient('sea');
    UI.nav = true; UI.focus = this.hasSave ? 'm_cont' : 'm_new';
  }
  update(dt) {
    this.t += dt; this.rot += dt * 2;
    // PÍX cruza y casi choca con el título
    this.pixX += dt * 90;
    if (this.pixX > W + 60) { this.pixX = -60; this.pixPhase++; }
    if (Math.abs(this.pixX - 330) < 2 && !this.bonked) { this.bonked = true; AudioSys.sfx('bonk'); FX.shake(1, 0.15); }
    if (this.pixX < 0) this.bonked = false;
    if (Math.random() < 0.05) Particles.spawn({ x: rand(0, W), y: -4, vx: rand(-10, 10), vy: rand(20, 40), life: 6, type: 'leaf', color: choice([PAL.pink, PAL.sun, PAL.teal, PAL.lime]), wob: 20, screen: true });
  }
  draw(g) {
    g.drawImage(this.bg.sky, 0, 0);
    this.bg.layers.forEach((L, i) => { const ox = -Math.round((this.t * 8 * L.p * 3) % 960); g.drawImage(L.c, ox, 0); g.drawImage(L.c, ox + 960, 0); });
    // molino, río y sol animados
    rect(g, 0, 214, W, 56, '#2A2560'); rect(g, 0, 214, W, 2, '#6A5AA0');
    for (let i = 0; i < W; i += 16) { rect(g, i, 216, 15, 4, '#B07A4A'); rect(g, i, 216, 15, 1, '#D8A06A'); }
    PROP_DRAW.windmill(g, 40, 152, { t: this.t, rot: this.rot, cfg: { speed: () => 1.2 } }, null);
    PROP_DRAW.lighthouse(g, 400, 120, { t: this.t, cfg: { on: () => true } }, null);
    for (let i = 0; i < W; i += 3) rect(g, i, 236 + Math.sin(i * 0.05 + this.t * 2) * 1.5, 3, 2, PAL.aqua);
    // título
    const bob = Math.sin(this.t * 1.5) * 2;
    const tx = W / 2, ty = 44 + bob;
    drawText(g, 'LUMINA', tx, ty, PAL.sun, { align: 'center', scale: 4, outline: '#3A1A5A' });
    drawText(g, 'LOOP', tx, ty + 34, PAL.teal, { align: 'center', scale: 4, outline: '#10162B' });
    drawText(g, 'EL CÓDIGO DE LOS ELEMENTOS', tx, ty + 72, PAL.cream, { align: 'center', outline: '#3A1A5A' });
    // bucle ↻ girando alrededor de "LOOP"
    for (let k = 0; k < 10; k++) { const a = this.t * 2 + k * 0.63; px(g, tx + Math.cos(a) * 60, ty + 44 + Math.sin(a) * 18, hsl(k * 36 + this.t * 60, 90, 70)); }
    // PÍX cruzando
    const py = 70 + Math.sin(this.pixX * 0.05) * 10 + (this.bonked && this.pixX < 360 ? 6 : 0);
    const f = Spr.pix[Math.floor(this.t * 18) % 4];
    g.drawImage(f.r, Math.round(this.pixX), Math.round(py));
    if (this.bonked && this.pixX < 380) { drawText(g, '¡intencional!', this.pixX - 10, py - 12, PAL.cream, { outline: PAL.ink }); }
    Particles.draw(g, 0, 0, true);
    // menú
    const items = [
      ['new', 'NUEVA PARTIDA', true],
      ['cont', 'CONTINUAR', this.hasSave],
      ['lab', G.save.labUnlocked ? 'AURORA LAB' : 'AURORA LAB (bloqueado)', G.save.labUnlocked],
      ['teacher', 'MODO DOCENTE', true],
      ['settings', 'AJUSTES', true]
    ];
    items.forEach(([id, label, en], i) => {
      if (UI.btn(g, 'm_' + id, W / 2 - 70, 142 + i * 18, 140, 15, label, { disabled: !en, color: i === 0 ? PAL.sun : PAL.teal, primary: i === (this.hasSave ? 1 : 0) })) this.pick(id);
    });
    drawText(g, 'Teclado · Mando · Táctil', W / 2, 238, '#C9D2F0', { align: 'center', shadow: PAL.ink });
    drawText(g, 'v1.0 · HTML5 + Canvas + JS puro', W - 6, H - 10, 'rgba(255,243,215,0.6)', { align: 'right' });
  }
  pick(id) {
    AudioSys.unlock();
    if (id === 'new') { if (this.hasSave) Scenes.push(new ConfirmScene('¿Empezar de nuevo? Se sobrescribirá la partida guardada (los ajustes se conservan).', () => Game.newGame())); else Game.newGame(); }
    if (id === 'cont') Game.continueGame();
    if (id === 'lab') { Save.load(); Scenes.push(new LabScene()); }
    if (id === 'teacher') Scenes.push(new TeacherScene());
    if (id === 'settings') Scenes.push(new SettingsScene());
  }
}

class ConfirmScene {
  constructor(text, onYes, onNo) { this.text = text; this.onYes = onYes; this.onNo = onNo; this.opaque = false; UI.focus = 'no'; this.prevNav = UI.nav; UI.nav = true; }
  update() { if (Input.hit('back')) { Input.consume(); this.close(false); } }
  close(yes) { UI.nav = this.prevNav; Scenes.pop(); if (yes && this.onYes) this.onYes(); if (!yes && this.onNo) this.onNo(); }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.6)');
    panel(g, 110, 90, 260, 90, { border: PAL.sun });
    drawPara(g, this.text, 122, 102, 236, PAL.cream);
    if (UI.btn(g, 'yes', 130, 152, 100, 16, 'SÍ', { color: PAL.lime })) this.close(true);
    if (UI.btn(g, 'no', 250, 152, 100, 16, 'NO', { color: PAL.coral })) this.close(false);
  }
}

// ---------------------------------------------------------------------
//  PAUSA
// ---------------------------------------------------------------------
class PauseScene {
  constructor(lv) { this.lv = lv; this.opaque = false; this.t = 0; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (Input.hit('pause') && this.t > 0.1) { Input.consume(); this.close(); } }
  close() { UI.nav = false; Scenes.pop(); }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.7)');
    panel(g, 150, 30, 180, 214, { border: PAL.teal, accent: PAL.teal, accentW: 50 });
    drawText(g, 'PAUSA', 240, 38, PAL.teal, { align: 'center', scale: 2 });
    drawText(g, G.run.level ? G.run.level.def.title || '' : '', 240, 58, PAL.cream, { align: 'center' });
    const opts = [
      ['c', 'CONTINUAR', () => this.close()],
      ['a', 'ATLAS AURORA', () => Scenes.push(new CodexScene())],
      ['q', 'MISIONES', () => Scenes.push(new QuestLogScene())],
      ['m', 'MAPA DE DOMINIO', () => Scenes.push(new MasteryScene())],
      ['s', 'AJUSTES', () => Scenes.push(new SettingsScene())],
      ['k', 'CONTROLES', () => Scenes.push(new ControlsScene())],
      flag('prologueDone') && !(this.lv && this.lv.def.noMap) ? ['w', 'VOLVER AL MAPA', () => { UI.nav = false; Game.toMap(this.lv && this.lv.def.region); }] : null,
      ['t', 'MENÚ PRINCIPAL', () => Scenes.push(new ConfirmScene('¿Volver al menú? Se guardará tu progreso en el último punto de control.', () => { Save.write(); Game.toTitle(); }))]
    ].filter(Boolean);
    opts.forEach(([id, label, fn], i) => { if (UI.btn(g, 'p_' + id, 170, 72 + i * 20, 140, 16, label, { color: i === 0 ? PAL.lime : PAL.teal })) fn(); });
    drawText(g, 'Nivel ' + G.save.level + ' · ' + rankName(), 240, 236, '#8C93B8', { align: 'center' });
  }
}

class ControlsScene {
  constructor() { this.opaque = false; }
  update() { if (Input.hit('back') || Input.hit('confirm') || Input.pointer.pressed) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.85)');
    panel(g, 60, 20, 360, 230, { border: PAL.sun });
    drawText(g, 'CONTROLES', 240, 28, PAL.sun, { align: 'center', scale: 2 });
    const rows = [['left', 'mover a la izquierda'], ['right', 'mover a la derecha'], ['up', 'subir escaleras / nadar'], ['down', 'bajar / atravesar plataformas'], ['jump', 'saltar (mantén: salto alto / planear)'], ['run', 'correr'], ['interact', 'hablar / usar'], ['ability', 'usar habilidad'], ['swap', 'cambiar de habilidad'], ['lens', 'Lente Debug'], ['blueprint', 'Blueprint: tu último algoritmo'], ['codex', 'Atlas Aurora'], ['hint', 'pista de PÍX'], ['pause', 'pausa']];
    rows.forEach(([a, d], i) => { keyHint(g, 80, 50 + i * 13, a, d, PAL.cream); });
    drawText(g, 'Táctil: botones en pantalla · Mando: A saltar, X usar, Y habilidad', 240, 238, '#8C93B8', { align: 'center' });
  }
}

class BlueprintScene {
  constructor() { this.opaque = false; }
  update() { if (Input.hit('back') || Input.hit('blueprint') || Input.hit('confirm') || Input.pointer.pressed) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,10,30,0.88)');
    for (let x = 0; x < W; x += 16) rect(g, x, 0, 1, H, 'rgba(89,199,255,0.08)');
    for (let y = 0; y < H; y += 16) rect(g, 0, y, W, 1, 'rgba(89,199,255,0.08)');
    drawText(g, 'BLUEPRINT · tu último algoritmo', 20, 16, PAL.sky);
    const lp = G.save.lastProgram;
    if (!lp) { drawPara(g, 'Aún no has resuelto ningún reto en el CodeLab. Cuando lo hagas, aquí verás tu algoritmo como un plano.', 20, 40, 440, PAL.cream); return; }
    drawText(g, lp.title, 20, 30, PAL.sun);
    lp.text.slice(0, 18).forEach((l, i) => drawText(g, String(i + 1).padStart(2, ' ') + '  ' + l, 20, 48 + i * 11, PAL.mint));
    drawText(g, 'Pulsa cualquier tecla para volver', W - 20, H - 16, '#8C93B8', { align: 'right' });
  }
}

// ---------------------------------------------------------------------
//  AJUSTES Y ACCESIBILIDAD
// ---------------------------------------------------------------------
class SettingsScene {
  constructor() { this.opaque = false; this.prevNav = UI.nav; UI.nav = true; UI.focus = null; }
  update() { if (Input.hit('back')) { Input.consume(); this.close(); } }
  close() { Save.writeSettings(); UI.nav = this.prevNav; Scenes.pop(); resize(); }
  draw(g) {
    const S = G.save.settings;
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.88)');
    panel(g, 40, 8, 400, 254, { border: PAL.teal, accent: PAL.teal, accentW: 60 });
    drawText(g, 'AJUSTES Y ACCESIBILIDAD', 240, 16, PAL.teal, { align: 'center' });
    let y = 32;
    const row = (label) => { drawText(g, label, 56, y + 3, PAL.cream); };
    const vol = (key, label) => {
      row(label);
      for (let i = 0; i <= 10; i++) { const id = 'v' + key + i; const on = Math.round(S[key] * 10) >= i && i > 0; if (UI.btn(g, id, 230 + i * 17, y, 15, 12, i === 0 ? '0' : '', { color: on ? PAL.lime : '#3E4C8A', bg: on ? '#2A5A1A' : undefined })) { S[key] = i / 10; AudioSys.applyVolumes(); AudioSys.sfx('click'); } }
      y += 16;
    };
    const tog = (key, label, desc) => {
      row(label);
      if (UI.btn(g, 't' + key, 330, y, 90, 12, S[key] ? 'SÍ' : 'NO', { color: S[key] ? PAL.lime : PAL.coral })) { S[key] = !S[key]; AudioSys.sfx('click'); if (key === 'pixelPerfect') resize(); }
      y += 16;
    };
    const cyc = (key, label, opts, names) => {
      row(label);
      const i = opts.indexOf(S[key]);
      if (UI.btn(g, 'c' + key, 330, y, 90, 12, names[i < 0 ? 0 : i], { color: PAL.sun })) { S[key] = opts[(i + 1) % opts.length]; AudioSys.sfx('click'); }
      y += 16;
    };
    vol('musicVol', 'Música');
    vol('sfxVol', 'Efectos de sonido');
    cyc('textSpeed', 'Velocidad del texto', [0, 1, 2, 3], ['LENTA', 'NORMAL', 'RÁPIDA', 'INSTANTÁNEA']);
    tog('captions', 'Subtítulos de sonidos');
    tog('highContrast', 'Alto contraste en paneles');
    tog('reduceFlash', 'Reducir destellos');
    tog('reduceShake', 'Reducir sacudidas de cámara');
    cyc('touch', 'Controles táctiles', ['auto', 'on', 'off'], ['AUTO', 'SIEMPRE', 'NUNCA']);
    tog('noTimer', 'Modo sin tiempo (sin prisas)');
    tog('confidence', 'Preguntar "¿qué tan seguro estás?"');
    tog('pixelPerfect', 'Escalado de píxel entero');
    if (UI.btn(g, 'remap', 56, y + 4, 150, 14, 'REMAPEAR TECLAS', { color: PAL.violet })) Scenes.push(new RemapScene());
    if (UI.btn(g, 'sback', 330, y + 4, 90, 14, 'VOLVER', { color: PAL.teal, primary: true })) this.close();
  }
}
class RemapScene {
  constructor() { this.opaque = false; this.waiting = null; UI.focus = null; }
  update() { if (!this.waiting && Input.hit('back')) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.92)');
    panel(g, 90, 20, 300, 230, { border: PAL.violet });
    drawText(g, 'REMAPEAR TECLAS', 240, 28, PAL.violet, { align: 'center' });
    const acts = [['left', 'Izquierda'], ['right', 'Derecha'], ['up', 'Arriba'], ['down', 'Abajo'], ['jump', 'Saltar'], ['interact', 'Interactuar'], ['ability', 'Habilidad'], ['swap', 'Cambiar habilidad'], ['lens', 'Lente Debug'], ['hint', 'Pista'], ['run', 'Correr']];
    acts.forEach(([a, n], i) => {
      const y = 44 + i * 16;
      drawText(g, n, 110, y + 3, PAL.cream);
      const label = this.waiting === a ? 'pulsa una tecla...' : (Input.bindings[a] || []).slice(0, 2).map(keyName).join(' / ');
      if (UI.btn(g, 'rm' + a, 230, y, 140, 13, label, { color: this.waiting === a ? PAL.sun : PAL.teal })) {
        this.waiting = a;
        Input.captureNext = code => {
          if (code !== 'Escape') {
            const rest = (DEFAULT_BINDINGS[a] || []).filter(c => c !== code);
            Input.bindings[a] = [code].concat(rest.slice(0, 1));
            G.save.settings.bindings = G.save.settings.bindings || {};
            G.save.settings.bindings[a] = Input.bindings[a];
            Save.writeSettings();
          }
          this.waiting = null;
        };
      }
    });
    if (UI.btn(g, 'rmreset', 110, 226, 120, 14, 'RESTABLECER', { color: PAL.coral })) { Input.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS)); G.save.settings.bindings = null; Save.writeSettings(); }
    if (UI.btn(g, 'rmback', 250, 226, 120, 14, 'VOLVER', { color: PAL.teal })) Scenes.pop();
  }
}

// ---------------------------------------------------------------------
//  ATLAS AURORA (códice)
// ---------------------------------------------------------------------
function unlockCodex(id) {
  if (!CODEX[id]) return;
  if (!G.save.codex[id]) { G.save.codex[id] = { read: false, t: Date.now() }; Toast.show('+ ATLAS: ' + CODEX[id].title, PAL.teal, 2); }
}
const CODEX_CATS = [['algoritmos', 'ALGORITMOS', PAL.teal], ['energias', 'ENERGÍAS', PAL.lime], ['personajes', 'PERSONAJES', PAL.pink], ['islas', 'ISLAS', PAL.sun], ['misterios', 'MISTERIOS', PAL.violet]];
class CodexScene {
  static VIS = 14;
  constructor(focusId) {
    this.opaque = true; this.cat = 'algoritmos'; this.sel = null; this.scroll = 0; this.lscroll = 0; this.t = 0;
    this.prevNav = UI.nav; UI.nav = true; UI.focus = null;
    if (focusId && CODEX[focusId]) { this.cat = CODEX[focusId].cat; this.sel = focusId; this.lscroll = Math.max(0, this.entries().indexOf(focusId) - 6); }
  }
  entries() { return Object.keys(CODEX).filter(k => CODEX[k].cat === this.cat); }
  update(dt) {
    this.t += dt;
    if (Input.hit('back') || (Input.hit('codex') && this.t > 0.2)) { Input.consume(); UI.nav = this.prevNav; Scenes.pop(); return; }
    if (Input.pointer.wheel && inRect(Input.pointer.x, Input.pointer.y, { x: 150, y: 30, w: 330, h: 230 })) this.scroll = clamp(this.scroll + Input.pointer.wheel * 2, 0, 400);
    // lista con desplazamiento: con teclado/mando se recorre fila a fila aunque la fila siguiente esté oculta
    const list = this.entries(), VIS = CodexScene.VIS;
    const pf = this.prevFocus && this.prevFocus.startsWith('ce') ? list.indexOf(this.prevFocus.slice(2)) : -1;
    if (pf >= 0 && UI.nav) {
      if (Input.hit('down') && pf + 1 < list.length) UI.focus = 'ce' + list[pf + 1];
      if (Input.hit('up') && pf > 0) UI.focus = 'ce' + list[pf - 1];
    }
    if (Input.pointer.wheel && inRect(Input.pointer.x, Input.pointer.y, { x: 4, y: 42, w: 142, h: 224 })) this.lscroll += Math.sign(Input.pointer.wheel);
    const fi = UI.focus && UI.focus.startsWith('ce') ? list.indexOf(UI.focus.slice(2)) : -1;
    if (fi >= 0 && fi !== pf) this.lscroll = clamp(this.lscroll, fi - VIS + 1, fi);
    this.lscroll = clamp(this.lscroll, 0, Math.max(0, list.length - VIS));
    this.prevFocus = UI.focus;
  }
  draw(g) {
    vGradient(g, 0, 0, W, H, [[0, '#1A1440'], [1, '#0B1020']], false);
    for (let i = 0; i < 40; i++) px(g, (i * 97) % W, (i * 53) % H, 'rgba(255,255,255,0.3)');
    drawText(g, 'ATLAS AURORA', 8, 6, PAL.sun, { scale: 2 });
    const known = Object.keys(G.save.codex).length;
    drawText(g, known + ' / ' + Object.keys(CODEX).length + ' entradas', W - 66, 8, '#8C93B8', { align: 'right' });
    CODEX_CATS.forEach(([k, n, c], i) => { if (UI.btn(g, 'cc' + k, 8 + i * 94, 24, 90, 14, n, { color: c, bg: this.cat === k ? shade(c, -0.6) : undefined })) { this.cat = k; this.sel = null; this.scroll = 0; this.lscroll = 0; } });
    // lista (con desplazamiento si no cabe)
    panel(g, 4, 42, 142, 224, { border: '#2A3570' });
    const list = this.entries(), VIS = CodexScene.VIS;
    if (list.length > VIS) {
      if (UI.btn(g, 'clup', 8, 248, 64, 13, '▲', { disabled: this.lscroll <= 0 })) this.lscroll = Math.max(0, this.lscroll - VIS + 1);
      if (UI.btn(g, 'cldn', 78, 248, 64, 13, '▼', { disabled: this.lscroll >= list.length - VIS })) this.lscroll = Math.min(list.length - VIS, this.lscroll + VIS - 1);
    }
    list.forEach((k, idx) => {
      const i = idx - this.lscroll;
      if (i < 0 || i >= VIS) return;
      const e = CODEX[k], has = !!G.save.codex[k] || G.save.teacherAll;
      const label = has ? e.title : '? ? ?';
      if (UI.btn(g, 'ce' + k, 8, 46 + i * 14, 134, 13, (has && G.save.codex[k] && !G.save.codex[k].read ? '• ' : '') + (label.length > 20 ? label.slice(0, 19) + '…' : label), { disabled: !has, color: CODEX_CATS.find(c => c[0] === this.cat)[2], bg: this.sel === k ? '#2A3570' : undefined })) { this.sel = k; this.scroll = 0; if (G.save.codex[k]) { if (!G.save.codex[k].read) { G.save.codex[k].read = true; addXP(3); const read = Object.values(G.save.codex).filter(x => x.read).length; if (read >= 25) achieve('curious'); } } }
    });
    // detalle
    panel(g, 150, 42, 326, 224, { border: '#2A3570' });
    if (!this.sel) { drawPara(g, 'Elige una entrada. El Atlas crece a medida que exploras, experimentas y resuelves retos. Nada de definiciones antes de tiempo: primero juega, luego lee.', 162, 56, 300, '#8C93B8'); }
    else this.drawEntry(g, CODEX[this.sel]);
    if (UI.btn(g, 'cback', W - 60, 5, 54, 14, 'VOLVER', { color: PAL.teal })) { UI.nav = this.prevNav; Scenes.pop(); }
  }
  drawEntry(g, e) {
    g.save(); g.beginPath(); g.rect(152, 44, 322, 202); g.clip();
    let y = 50 - this.scroll;
    drawText(g, e.title, 162, y, PAL.sun, { scale: 2 }); y += 20;
    if (e.icon) icon(g, e.icon, 450, 50 - this.scroll);
    const secs = e.sectionsFn ? e.sectionsFn() : (e.sections || []);
    if (e.short) { y += drawPara(g, e.short, 162, y, 300, PAL.cream) + 6; }
    for (const [h, body] of secs) {
      drawText(g, h, 162, y, PAL.teal); y += 11;
      if (Array.isArray(body)) { body.forEach(l => { drawText(g, l, 170, y, PAL.lime); y += 10; }); y += 4; }
      else y += drawPara(g, body, 162, y, 300, PAL.cream) + 6;
    }
    this.maxScroll = Math.max(0, y + this.scroll - 238);
    g.restore();
    if (this.maxScroll > 0) { drawText(g, 'rueda / ▲▼', 470, 252, '#5A6090', { align: 'right' }); if (UI.btn(g, 'cup', 440, 44, 14, 12, '▲')) this.scroll = Math.max(0, this.scroll - 30); if (UI.btn(g, 'cdn', 458, 44, 14, 12, '▼')) this.scroll = Math.min(this.maxScroll, this.scroll + 30); }
    this.scroll = Math.min(this.scroll, this.maxScroll || 0);
  }
}

// ---------------------------------------------------------------------
//  MISIONES Y MAPA DE DOMINIO
// ---------------------------------------------------------------------
class QuestLogScene {
  constructor() { this.opaque = false; }
  update() { if (Input.hit('back') || Input.hit('confirm')) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.9)');
    panel(g, 20, 10, 440, 250, { border: PAL.sun });
    drawText(g, 'MISIONES', 240, 18, PAL.sun, { align: 'center', scale: 2 });
    const ids = Object.keys(QUESTS).filter(k => questState(k) !== 'none');
    const main = ids.filter(k => QUESTS[k].main), side = ids.filter(k => !QUESTS[k].main);
    let y = 40;
    drawText(g, 'PRINCIPALES', 34, y, PAL.sun); y += 12;
    main.slice(-6).forEach(k => { const q = QUESTS[k], d = questState(k) === 'done'; drawText(g, (d ? '✓ ' : '▶ ') + q.title, 40, y, d ? '#8C93B8' : PAL.cream); drawText(g, q.prog + ' + ' + q.energy, 440, y, '#5A6090', { align: 'right' }); y += 11; });
    y += 6; drawText(g, 'SECUNDARIAS (' + side.filter(k => questState(k) === 'done').length + '/' + Object.keys(QUESTS).filter(k => !QUESTS[k].main).length + ')', 34, y, PAL.teal); y += 12;
    side.forEach(k => { if (y > 244) return; const q = QUESTS[k], d = questState(k) === 'done'; drawText(g, (d ? '✓ ' : '▶ ') + q.title, 40, y, d ? '#8C93B8' : PAL.cream); drawText(g, REGIONS[regionIdx(q.region)] ? REGIONS[regionIdx(q.region)].name : '', 440, y, '#5A6090', { align: 'right' }); y += 11; });
  }
}
class MasteryScene {
  constructor() { this.opaque = false; this.t = 0; }
  update(dt) { this.t += dt; if (this.t > 0.2 && (Input.hit('back') || Input.hit('confirm') || Input.pointer.pressed)) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.92)');
    panel(g, 10, 6, 460, 258, { border: PAL.lime });
    drawText(g, 'MAPA DE DOMINIO ESTIMADO', 240, 12, PAL.lime, { align: 'center' });
    drawText(g, 'Una estimación de tus retos, no una medida de capacidad personal.', 240, 24, '#8C93B8', { align: 'center' });
    const col = (keys, x, title, c) => {
      drawText(g, title, x, 40, c);
      keys.forEach((k, i) => {
        const y = 52 + i * 15, v = G.save.mastery[k], k2 = Math.min(1, this.t * 1.5);
        drawText(g, MASTERY_LABELS[k], x, y, PAL.cream);
        bar(g, x + 96, y - 1, 100, 8, v * k2, 100, c);
        drawText(g, Math.round(v) + '%', x + 200, y, '#C9D2F0');
      });
    };
    col(PROG_KEYS, 22, 'ALGORITMOS', PAL.teal);
    col(ENERGY_KEYS, 250, 'ENERGÍAS', PAL.lime);
    const s = G.save.stats;
    drawText(g, `Retos resueltos ${s.puzzles} · al primer intento ${s.firstTry} · pistas ${s.hints} · bucles infinitos detectados ${s.infiniteLoops}`, 240, 226, PAL.sun, { align: 'center' });
    drawText(g, `Tiempo de juego ${Math.floor(s.playTime / 60)} min · XP ${G.save.xp} · ${rankName()}`, 240, 240, '#C9D2F0', { align: 'center' });
  }
}

// ---------------------------------------------------------------------
//  MAPA DEL ARCHIPIÉLAGO AURORA
// ---------------------------------------------------------------------
class MapScene {
  constructor(focus) {
    this.t = 0; this.opaque = true; this.hostsCut = true; this.touchPad = false;
    const avail = REGIONS.filter(r => unlocked(r.key));
    this.sel = regionIdx(focus || (avail.find(r => !restored(r.key)) || avail[avail.length - 1]).key);
    if (this.sel < 0) this.sel = 0;
    this.travel = null;
    AudioSys.playSong('map'); AudioSys.ambient('sea');
    UI.nav = false;
    if (MAP_EVENTS) { const ev = MAP_EVENTS.find(e => !flag(e.flag) && e.cond()); if (ev) { setFlag(ev.flag); Cut.run(ev.run); } }
  }
  update(dt) {
    this.t += dt;
    if (this.travel) {
      this.travel.t += dt / 1.4;
      if (this.travel.t >= 1 && !this.travel.gone) { this.travel.gone = true; Game.startLevel(LEVEL_OF_REGION[REGIONS[this.travel.to].key] || REGIONS[this.travel.to].key); }
      return;
    }
    if (Cut.active) return;
    if (Input.hit('right') || Input.hit('down')) this.move(1);
    if (Input.hit('left') || Input.hit('up')) this.move(-1);
    if (Input.hit('confirm') || Input.hit('interact')) this.go();
    if (Input.hit('pause')) { Input.consume(); Scenes.push(new PauseScene(null)); }
    if (Input.hit('codex')) Scenes.push(new CodexScene());
    if (Input.pointer.pressed) {
      const P = Input.pointer;
      REGIONS.forEach((r, i) => { if (dist(P.x, P.y, r.x, r.y) < 18 && unlocked(r.key)) { if (this.sel === i) this.go(); else { this.sel = i; AudioSys.sfx('select'); } } });
    }
  }
  move(d) {
    let i = this.sel;
    for (let k = 0; k < REGIONS.length; k++) { i = (i + d + REGIONS.length) % REGIONS.length; if (unlocked(REGIONS[i].key)) break; }
    if (i !== this.sel) { this.sel = i; AudioSys.sfx('hover'); }
  }
  go() {
    const r = REGIONS[this.sel];
    if (!unlocked(r.key)) return;
    const from = regionIdx(G.save.lastRegion || 'puerto');
    this.travel = { from: from < 0 ? 0 : from, to: this.sel, t: 0 };
    AudioSys.sfx('run');
  }
  drawIsland(g, r, i) {
    const on = restored(r.key), un = unlocked(r.key), sel = this.sel === i;
    const t = this.t, x = r.x, y = r.y + Math.sin(t * 0.8 + i) * 1.5;
    const th = THEMES[r.key === 'puerto' ? 'puerto' : r.key] || THEMES.valle;
    // sombra y agua
    g.globalAlpha = 0.35; pellipse(g, x, y + 10, 26, 5, '#0B1A40'); g.globalAlpha = 1;
    if (!un) { g.globalAlpha = 0.5; pellipse(g, x, y, 20, 8, '#2A2F55'); drawText(g, '?', x, y - 3, '#5A6090', { align: 'center' }); g.globalAlpha = 1; return; }
    const gc = on ? th.ground.topC : desaturate(th.ground.topC, 0.7), fc = on ? th.ground.fill : desaturate(th.ground.fill, 0.7);
    pellipse(g, x, y + 3, 22, 8, fc); pellipse(g, x, y, 22, 7, gc); pellipse(g, x - 4, y - 2, 12, 3, shade(gc, 0.2));
    // icono de la isla
    const k = r.key;
    const c = on ? r.col : '#5A6090';
    if (k === 'puerto' || k === 'faro') { rect(g, x - 2, y - 18, 4, 16, on ? '#FFF3D7' : '#6A6A8A'); rect(g, x - 3, y - 21, 6, 3, on ? PAL.sun : '#3A4068'); if (on && k === 'faro') { g.globalAlpha = 0.3; for (let rr = 0; rr < 60; rr += 3) rect(g, x + Math.cos(t) * rr, y - 20 + Math.sin(t) * rr * 0.3, 2, 2, PAL.sun); g.globalAlpha = 1; } }
    else if (k === 'valle' || k === 'aeris' || k === 'prisma') { rect(g, x - 1, y - 16, 2, 14, '#FFF3D7'); for (let b = 0; b < 4; b++) { const a = (on ? t * 2 : 0) + b * 1.57; pline(g, x, y - 16, x + Math.cos(a) * 7, y - 16 + Math.sin(a) * 7, '#FFFFFF'); } }
    else if (k === 'solaria') { for (let p = 0; p < 3; p++) rect(g, x - 10 + p * 7, y - 6, 6, 3, on ? '#2A6ADA' : '#3A4068'); pcircle(g, x + 10, y - 14, 3, on ? PAL.sun : '#6A6A5A'); }
    else if (k === 'hydria') { rect(g, x - 3, y - 14, 6, 12, on ? '#DFFBFF' : '#5A6A8A'); }
    else if (k === 'bioloop') { pcircle(g, x - 6, y - 8, 6, on ? '#2A9A55' : '#3A5A4A'); pcircle(g, x + 5, y - 10, 7, on ? '#3FA85A' : '#3A5A4A'); }
    else if (k === 'gea') { for (let p = 0; p < 3; p++) rect(g, x - 6 + p * 5, y - 8 - p * 2, 3, 6 + p * 2, on ? PAL.violet : '#4A3A5A'); if (on && Math.random() < 0.1) Particles.spawn({ x: x, y: y - 12, vy: -15, life: 1, type: 'fade', size: 2, color: 'rgba(255,255,255,0.5)', screen: true }); }
    else if (k === 'h2') { rect(g, x - 8, y - 12, 7, 10, on ? '#FFFFFF' : '#6A6A8A'); rect(g, x + 2, y - 10, 6, 8, on ? PAL.orange : '#6A5A4A'); }
    else if (k === 'bateria') { for (let p = 0; p < 3; p++) { rect(g, x - 9 + p * 7, y - 14 + p, 5, 12 - p, '#2A2F6A'); rect(g, x - 8 + p * 7, y - 6, 3, 4, on ? [PAL.lime, PAL.sun, PAL.pink][p] : '#3A4068'); } }
    if (!on) { g.globalAlpha = 0.35 + Math.sin(t * 2 + i) * 0.1; pellipse(g, x, y - 4, 26, 12, '#5B3A8C'); g.globalAlpha = 1; }
    else if (Math.random() < 0.03) Particles.spawn({ x: x + rand(-15, 15), y: y - rand(4, 16), vy: -10, life: 1, type: 'star', color: r.col, screen: true });
    if (sel) { const bob = Math.floor(t * 3) % 2; drawText(g, '▼', x, y - 34 - bob, PAL.sun, { align: 'center', outline: PAL.ink }); pring(g, x, y + 2, 28, PAL.sun); }
  }
  draw(g) {
    vGradient(g, 0, 0, W, H, [[0, '#1B3A8A'], [0.5, '#2A6ADA'], [1, '#30A8C8']], false);
    for (let i = 0; i < 70; i++) { const x = (i * 71 + this.t * 6 * (i % 3 + 1)) % (W + 20) - 10, y = (i * 37) % H; rect(g, x, y, 4 + (i % 3) * 2, 1, 'rgba(255,255,255,0.12)'); }
    // nubes
    for (let i = 0; i < 4; i++) { const x = ((this.t * 5 + i * 140) % (W + 100)) - 50; g.globalAlpha = 0.35; pcircle(g, x, 20 + i * 60, 12, '#FFFFFF'); pcircle(g, x + 12, 22 + i * 60, 9, '#FFFFFF'); g.globalAlpha = 1; }
    // caminos
    for (let i = 1; i < REGIONS.length; i++) {
      const a = REGIONS[i - 1], b = REGIONS[i];
      if (!unlocked(b.key)) continue;
      pline(g, a.x, a.y, b.x, b.y, restored(b.key) ? 'rgba(255,216,74,0.8)' : 'rgba(255,243,215,0.45)', 3, Math.floor(this.t * 6));
    }
    // líneas de energía hacia el faro (islas restauradas)
    REGIONS.forEach(r => { if (restored(r.key) && r.key !== 'faro') { g.globalAlpha = 0.25 + Math.sin(this.t * 3 + r.x) * 0.1; pline(g, r.x, r.y - 6, REGIONS[10].x, REGIONS[10].y - 10, r.col); g.globalAlpha = 1; } });
    REGIONS.forEach((r, i) => this.drawIsland(g, r, i));
    // viaje
    if (this.travel) {
      const a = REGIONS[this.travel.from], b = REGIONS[this.travel.to], k = easeInOut(clamp(this.travel.t, 0, 1));
      const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 20;
      const tr = b.transport;
      if (tr.includes('planeador') || tr.includes('ascensor') || tr.includes('teleférico')) { for (let q = 0; q < 8; q++) rect(g, x - 8 + q * 2, y - 4 + Math.abs(q - 4), 2, 1, PAL.aqua); g.drawImage(Spr.lia.glide[0].r, x - 10, y - 2, 20, 27); }
      else { for (let q = 0; q < 6; q++) rect(g, x - 10 + q, y + 4 + q * 0.5, 20 - q * 2, 1, '#8B5A3C'); rect(g, x - 1, y - 10, 1, 14, PAL.cream); for (let q = 0; q < 8; q++) rect(g, x, y - 9 + q, q, 1, PAL.sun); rect(g, x - 8, y + 1, 6, 2, '#2A4A9A'); }
      drawText(g, tr, x, y + 12, PAL.cream, { align: 'center', outline: PAL.ink });
    }
    Particles.draw(g, 0, 0, true);
    // panel de info
    const r = REGIONS[this.sel];
    panel(g, 4, 4, 180, 58, { border: r.col, accent: r.col });
    drawText(g, 'ARCHIPIÉLAGO AURORA', 10, 8, '#8C93B8');
    drawText(g, r.name, 10, 20, r.col, { outline: PAL.ink });
    drawText(g, '⚙ ' + r.prog, 10, 32, PAL.teal); drawText(g, '⚡ ' + r.energy, 10, 42, PAL.lime);
    const ch = Object.keys(CHISPAS).filter(k => CHISPAS[k].region === r.key), got = ch.filter(k => G.save.collectibles.chispas[k]).length;
    drawText(g, (restored(r.key) ? '✓ restaurada' : unlocked(r.key) ? '○ sin energía' : '? bloqueada') + '  ·  chispas ' + got + '/' + ch.length, 10, 52, restored(r.key) ? PAL.lime : PAL.coral);
    // botones
    UI.nav = false;
    if (UI.btn(g, 'mgo', W - 96, H - 20, 92, 16, '▶ VIAJAR', { primary: true, color: PAL.lime, disabled: !unlocked(r.key) })) this.go();
    if (UI.btn(g, 'mtaller', W - 96, H - 40, 92, 16, 'TALLER', { icon: 'home', color: PAL.orange })) Scenes.push(new TallerScene());
    if (UI.btn(g, 'matlas', W - 196, H - 20, 96, 16, 'ATLAS (C)', { color: PAL.teal })) Scenes.push(new CodexScene());
    if (UI.btn(g, 'mmast', W - 196, H - 40, 96, 16, 'DOMINIO', { color: PAL.lime })) Scenes.push(new MasteryScene());
    if (UI.btn(g, 'mpause', W - 40, 4, 36, 14, '≡', { color: PAL.cream })) Scenes.push(new PauseScene(null));
    drawText(g, '← → elegir isla · ENTER viajar', 8, H - 12, '#C9D2F0', { shadow: PAL.ink });
    Cut.draw(g);
  }
}

// ---------------------------------------------------------------------
//  TALLER DE LÍA (casa base)
// ---------------------------------------------------------------------
const COSMETICS = {
  pack: { name: 'Mochila solar', region: 'solaria', desc: 'Pequeños paneles que brillan al sol.' },
  cape: { name: 'Capa eólica', region: 'aeris', desc: 'Ondea con cualquier brisa.' },
  boots: { name: 'Botas hidro', region: 'hydria', desc: 'Impermeables y con estilo.' },
  goggles: { name: 'Gafas Debug', region: 'gea', desc: 'Las gafas bajadas: modo concentración.' }
};
const SOUVENIRS = { puerto: 'faro de juguete', valle: 'molinito', solaria: 'mini panel', aeris: 'cometa', hydria: 'frasco de cascada', bioloop: 'maceta de compost', gea: 'cristal cálido', h2: 'barquito H2', bateria: 'pila de neón', prisma: 'prisma', faro: 'foto del festival' };
class TallerScene {
  constructor() { this.opaque = true; this.t = 0; this.prevNav = UI.nav; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (Input.hit('back')) { Input.consume(); UI.nav = this.prevNav; Scenes.pop(); } }
  draw(g) {
    vGradient(g, 0, 0, W, H, [[0, '#6B4A2C'], [1, '#4A2A18']], false);
    for (let x = 0; x < W; x += 24) rect(g, x, 0, 1, 190, '#5A3A20');
    rect(g, 0, 190, W, 80, '#8B5A3C'); for (let x = 0; x < W; x += 32) rect(g, x, 190, 1, 80, '#6B4A2A');
    // ventana
    rect(g, 200, 30, 80, 60, '#1B3A8A'); strokeRect(g, 200, 30, 80, 60, '#3A2010'); rect(g, 239, 30, 2, 60, '#3A2010'); pcircle(g, 260, 50, 5, PAL.cream);
    drawText(g, 'TALLER DE LÍA', 240, 8, PAL.sun, { align: 'center', scale: 2 });
    // estantes con recuerdos
    for (let s = 0; s < 2; s++) rect(g, 20, 70 + s * 50, 160, 4, '#B07A4A');
    REGIONS.forEach((r, i) => {
      const x = 28 + (i % 6) * 26, y = 58 + Math.floor(i / 6) * 50;
      if (restored(r.key)) { rect(g, x, y, 14, 12, shade(r.col, -0.3)); rect(g, x + 2, y + 2, 10, 8, r.col); if (Math.floor(this.t * 2 + i) % 7 === 0) px(g, x + 5, y + 3, '#FFFFFF'); }
      else strokeRect(g, x, y, 14, 12, '#5A3A20');
    });
    drawText(g, 'recuerdos de cada isla', 100, 130, '#E8C8A0', { align: 'center' });
    // pegatinas (logros)
    rect(g, 300, 30, 170, 100, '#5A3A2A'); strokeRect(g, 300, 30, 170, 100, '#3A2010');
    drawText(g, 'PEGATINAS', 385, 34, PAL.pink, { align: 'center' });
    Object.keys(ACHIEVEMENTS).forEach((k, i) => { const x = 308 + (i % 9) * 18, y = 48 + Math.floor(i / 9) * 20; if (G.save.achievements[k]) { pcircle(g, x + 6, y + 6, 6, hsl(i * 40, 80, 65)); icon(g, 'star', x + 2, y + 2); } else pring(g, x + 6, y + 6, 6, '#7A5A4A'); });
    // Lía y PÍX
    const f = Spr.lia.idle[Math.floor(this.t * 3) % 4];
    g.drawImage(f.r, 230, 164); g.drawImage(Spr.pix[Math.floor(this.t * 16) % 4].r, 252, 150 + Math.sin(this.t * 3) * 2);
    PROP_DRAW.workbench(g, 150, 168, { t: this.t, cfg: {} });
    // armario de cosméticos
    drawText(g, 'ARMARIO', 20, 150, PAL.sun);
    Object.keys(COSMETICS).forEach((k, i) => {
      const c = COSMETICS[k], owned = restored(c.region);
      const worn = !!G.save.cosmetics.worn[k];
      if (UI.btn(g, 'cos' + k, 20, 162 + i * 17, 120, 14, owned ? (worn ? '● ' : '○ ') + c.name : '? ? ?', { disabled: !owned, color: worn ? PAL.lime : PAL.teal, tip: owned ? c.desc : 'Se consigue restaurando ' + REGIONS[regionIdx(c.region)].name })) { G.save.cosmetics.worn[k] = !worn; rebuildLia(); AudioSys.sfx('confirm'); Save.write(); }
    });
    // postgame
    if (flag('ending')) {
      panel(g, 300, 140, 170, 44, { border: PAL.teal });
      drawPara(g, 'PÍX: "He creado un algoritmo para elegir merienda." LÍA: "¿Por qué tiene 72 condiciones?"', 306, 146, 160, PAL.cream);
    }
    if (UI.btn(g, 'tback', W - 70, H - 20, 64, 14, 'VOLVER', { color: PAL.teal })) { UI.nav = this.prevNav; Scenes.pop(); }
    UI.drawTooltip(g);
  }
}

// ---------------------------------------------------------------------
//  MODO DOCENTE
// ---------------------------------------------------------------------
class TeacherScene {
  constructor() { this.opaque = true; this.t = 0; this.page = 'main'; this.prog = 'loops'; this.energy = 'wind'; UI.nav = true; UI.focus = null; Save.loadSettingsOnly(); this.hasSave = Save.exists(); if (this.hasSave) Save.load(); }
  update(dt) { this.t += dt; if (Input.hit('back')) { Input.consume(); if (this.page !== 'main') this.page = 'main'; else { UI.nav = true; Scenes.pop(); } } }
  draw(g) {
    vGradient(g, 0, 0, W, H, [[0, '#1B2A4A'], [1, '#0B1020']], false);
    drawText(g, 'MODO DOCENTE', 240, 8, PAL.sun, { align: 'center', scale: 2 });
    drawText(g, 'Herramientas locales: nada sale de este navegador.', 240, 26, '#8C93B8', { align: 'center' });
    if (this.page === 'main') {
      const opts = [
        ['isla', 'ELEGIR ISLA', 'Abre cualquier región (desbloquea el mapa).'],
        ['reto', 'LANZAR RETO', 'Combina concepto + energía y elige del banco de ' + CHALLENGES.length + ' retos.'],
        ['mastery', 'VER DOMINIO', 'Mapa de dominio estimado del progreso local.'],
        ['resumen', 'RESUMEN LOCAL', 'Estadísticas de la partida guardada.'],
        ['lab', 'AURORA LAB', 'Sandbox de microred sin penalización.'],
        ['reset', 'REINICIAR PROGRESO', 'Borra la partida guardada (conserva ajustes).']
      ];
      opts.forEach(([id, l, d], i) => {
        if (UI.btn(g, 'tm' + id, 40, 44 + i * 34, 140, 18, l, { color: id === 'reset' ? PAL.coral : PAL.teal })) this.pick(id);
        drawPara(g, d, 190, 48 + i * 34, 260, PAL.cream);
      });
      if (UI.btn(g, 'tmback', W - 70, H - 20, 64, 14, 'VOLVER', {})) { Scenes.pop(); }
    } else if (this.page === 'isla') {
      REGIONS.forEach((r, i) => { if (UI.btn(g, 'ti' + r.key, 30 + (i % 3) * 144, 50 + Math.floor(i / 3) * 40, 136, 30, r.name, { color: r.col })) { G.save.started = true; G.save.teacherAll = true; G.save.teacherUnlocked = true; setFlag('prologueDone'); for (let k = 0; k < i; k++) { setFlag('restored_' + REGIONS[k].key); } grantAbilitiesUpTo(r.key); Save.write(); UI.nav = false; Game.startLevel(LEVEL_OF_REGION[r.key] || r.key); } });
      drawPara(g, 'Al elegir una isla se marcan como restauradas las anteriores y se otorgan sus habilidades, para poder trabajar un concepto concreto en clase.', 30, 214, 420, '#8C93B8');
    } else if (this.page === 'reto') {
      drawText(g, 'CONCEPTO', 40, 44, PAL.teal);
      const progs = ['sequence', 'variables', 'conditions', 'loops', 'functions', 'arrays', 'states', 'debugging', 'search', 'sorting', 'optimization'];
      progs.forEach((k, i) => { if (UI.btn(g, 'tp' + k, 40 + (i % 4) * 100, 56 + Math.floor(i / 4) * 16, 96, 13, MASTERY_LABELS[k], { color: this.prog === k ? PAL.sun : PAL.teal, bg: this.prog === k ? '#4A3A10' : undefined })) { this.prog = k; this.rpage = 0; } });
      drawText(g, 'ENERGÍA', 40, 108, PAL.lime);
      const ens = ['any'].concat(ENERGY_KEYS);
      ens.forEach((k, i) => { if (UI.btn(g, 'te' + k, 40 + (i % 5) * 80, 120 + Math.floor(i / 5) * 16, 76, 13, k === 'any' ? 'CUALQUIERA' : MASTERY_LABELS[k], { color: this.energy === k ? PAL.sun : PAL.lime, bg: this.energy === k ? '#4A3A10' : undefined })) { this.energy = k; this.rpage = 0; } });
      const list = CHALLENGES.filter(c => c.prog.includes(this.prog) && (this.energy === 'any' || c.energy.includes(this.energy)));
      drawText(g, list.length + ' retos disponibles', 40, 160, PAL.sun);
      const pages = Math.max(1, Math.ceil(list.length / 10));
      this.rpage = clamp(this.rpage || 0, 0, pages - 1);
      if (pages > 1) {
        if (UI.btn(g, 'trprev', 300, 157, 20, 12, '◀', { disabled: this.rpage === 0 })) this.rpage--;
        drawText(g, 'pág. ' + (this.rpage + 1) + '/' + pages, 354, 160, '#C9D2F0', { align: 'center' });
        if (UI.btn(g, 'trnext', 388, 157, 20, 12, '▶', { disabled: this.rpage >= pages - 1 })) this.rpage++;
      }
      list.slice(this.rpage * 10, this.rpage * 10 + 10).forEach((c, i) => { if (UI.btn(g, 'tc' + c.id, 40 + (i % 2) * 206, 172 + Math.floor(i / 2) * 15, 200, 13, c.title.length > 30 ? c.title.slice(0, 29) + '…' : c.title, { color: PAL.teal, tip: c.type })) launchChallenge(c); });
      if (!list.length) drawText(g, 'Prueba con otra combinación (o "CUALQUIERA").', 40, 176, '#8C93B8');
    } else if (this.page === 'resumen') {
      const s = G.save.stats;
      const rows = [['Partida iniciada', G.save.started ? 'sí' : 'no'], ['Nivel / XP', G.save.level + ' / ' + G.save.xp], ['Islas restauradas', REGIONS.filter(r => restored(r.key)).length + ' / 11'], ['Retos resueltos', s.puzzles], ['Resueltos al primer intento', s.firstTry], ['Pistas usadas', s.hints], ['Errores (ejecuciones fallidas)', s.fails], ['Bucles infinitos detectados', s.infiniteLoops], ['Error con alta confianza', s.confHighWrong], ['Chispas de Aurora', Object.keys(G.save.collectibles.chispas).length + ' / ' + Object.keys(CHISPAS).length], ['Entradas del Atlas', Object.keys(G.save.codex).length], ['Tiempo de juego', Math.floor(s.playTime / 60) + ' min']];
      rows.forEach(([k, v], i) => { drawText(g, k, 60, 48 + i * 14, PAL.cream); drawText(g, String(v), 420, 48 + i * 14, PAL.sun, { align: 'right' }); });
    }
    if (this.page !== 'main' && UI.btn(g, 'tback2', W - 70, H - 20, 64, 14, 'VOLVER', {})) this.page = 'main';
    UI.drawTooltip(g);
  }
  pick(id) {
    if (id === 'isla') this.page = 'isla';
    if (id === 'reto') this.page = 'reto';
    if (id === 'mastery') Scenes.push(new MasteryScene());
    if (id === 'resumen') this.page = 'resumen';
    if (id === 'lab') Scenes.push(new LabScene());
    if (id === 'reset') Scenes.push(new ConfirmScene('¿Borrar TODO el progreso guardado en este navegador?', () => { Save.resetAll(); Toast.show('Progreso reiniciado', PAL.coral); this.hasSave = false; }));
  }
}
function grantAbilitiesUpTo(key) {
  const order = ['puerto', 'valle', 'solaria', 'aeris', 'hydria', 'bioloop', 'gea', 'h2', 'bateria', 'prisma', 'faro'];
  const ab = { puerto: 'lens', valle: 'spark', solaria: 'shield', aeris: 'glide', hydria: 'portal', bioloop: 'pack', gea: 'shift', h2: 'beam', bateria: 'dash', prisma: null, faro: 'link' };
  const idx = order.indexOf(key);
  giveAbility('lens');
  for (let i = 0; i < idx; i++) if (ab[order[i]]) giveAbility(ab[order[i]]);
}
function launchChallenge(c) {
  const cfg = c.make();
  cfg.title = c.title; cfg.xp = 15;
  Scenes.push(makePuzzleScene(cfg, r => { if (r && r.success) Toast.show('Reto completado: ' + c.title, PAL.lime); }));
}
function makePuzzleScene(cfg, done) {
  if (G.autoWin) return { opaque: false, update() { Scenes.pop(); done({ success: true, firstTry: true, hints: 0, fails: 0, attempts: 1, extra: { tries: 3 }, program: [] }); }, draw() { } };
  switch (cfg.kind) {
    case 'seq': return new SeqScene(cfg, done);
    case 'flow': return new FlowScene(cfg, done);
    case 'fsm': return new FSMScene(cfg, done);
    case 'sort': return new SortScene(cfg, done);
    case 'micro': return new MicrogridScene(cfg, done);
    case 'objective': return new ObjectiveScene(cfg, done);
    case 'quiz': return new QuizScene(cfg, done);
    default: return new CodeLabScene(cfg, done);
  }
}
// En historias: yield puzzle(cfg) → devuelve el resultado
function puzzle(cfg) { return C.scene(done => makePuzzleScene(cfg, done)); }

// ---------------------------------------------------------------------
//  AURORA LAB (sandbox tras el final)
// ---------------------------------------------------------------------
class LabScene {
  constructor() {
    this.opaque = true; this.inner = null;
    const cfg = { kind: 'micro', title: 'Aurora Lab · experimenta sin penalización', sandbox: true, tags: ['LAB', 'MICRORED'], concepts: ['microgrid', 'optimization'], scenario: MG_SCENARIOS.tipico, scenarios: [MG_SCENARIOS.tipico], rules: [{ cond: 'excedente', act: 'cargar_bateria' }, { cond: 'deficit', act: 'usar_bateria' }], maxRules: 8, intro: 'Cambia el escenario, crea reglas y compara hasta 3 experimentos. Aquí nada se rompe.' };
    this.cfg = cfg;
  }
  onEnter() { Scenes.pop(); Scenes.push(new MicrogridScene(this.cfg, () => { })); }
  update() { }
  draw() { }
}
