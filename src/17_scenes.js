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
  { key: 'puerto', name: 'Puerto Inicial', prog: 'Secuencias', energy: 'Flujo de energía', x: 56, y: 198, transport: 'barca solar', col: PAL.teal },
  { key: 'valle', name: 'Valle Secuencia', prog: 'Secuencia y depuración', energy: 'Conversión', x: 106, y: 128, transport: 'barca solar', col: PAL.leaf },
  { key: 'solaria', name: 'Solaria', prog: 'Variables y SI', energy: 'Solar', x: 172, y: 196, transport: 'barca solar', col: PAL.sun },
  { key: 'aeris', name: 'Aeris', prog: 'Bucles', energy: 'Eólica', x: 160, y: 66, transport: 'planeador eólico', col: PAL.aqua },
  { key: 'hydria', name: 'Cascadas Hydria', prog: 'Funciones', energy: 'Hidroeléctrica', x: 246, y: 132, transport: 'ascensor hidráulico', col: PAL.sky },
  { key: 'bioloop', name: 'Bosque BioLoop', prog: 'Listas y recorridos', energy: 'Biomasa', x: 292, y: 204, transport: 'barca solar', col: PAL.lime },
  { key: 'gea', name: 'Gea Profunda', prog: 'Estados', energy: 'Geotermia', x: 362, y: 150, transport: 'teleférico geotérmico', col: PAL.coral },
  { key: 'h2', name: 'Bahía H2', prog: 'Pipelines', energy: 'Hidrógeno verde', x: 428, y: 200, transport: 'barca solar', col: PAL.aqua },
  { key: 'bateria', name: 'Ciudad Batería', prog: 'Búsqueda y orden', energy: 'Almacenamiento', x: 430, y: 80, transport: 'tranvía batería', col: PAL.pink },
  { key: 'prisma', name: 'Microred Prisma', prog: 'Integración', energy: 'Microred', x: 330, y: 62, transport: 'planeador eólico', col: PAL.violet },
  { key: 'faro', name: 'Faro Aurora', prog: 'Todo', energy: 'Sistema híbrido', x: 242, y: 48, transport: 'ascensor de luz', col: PAL.white }
];
const regionIdx = k => REGIONS.findIndex(r => r.key === k);
const restored = k => flag('restored_' + k);
// jefe de una isla vencido (o no hace falta: partidas anteriores a los jefes, o isla sin jefe)
const bossDone = k => !G.save.bossGate || !BOSSES[k] || flag('boss_' + k);
const unlocked = k => { const i = regionIdx(k); if (i === 0 || G.save.teacherAll || restored(k)) return true; const prev = REGIONS[i - 1].key; return restored(prev) && bossDone(prev); };

const Game = {
  update(dt) {
    Time.t += dt; Time.frame++;
    G.save.stats.playTime += dt;
    UI.update();
    const top = Scenes.top();
    TouchPad.update(!!(top && top.touchPad));
    if (top) top.update(dt);
    if (top && top.hostsCut && Scenes.top() === top) Cut.update(dt);
    // los avisos esperan mientras hay un puzzle o menú a pantalla completa (no tapan la interfaz)
    const holdToasts = top && top.hideToasts;
    Particles.update(dt); FX.update(dt); if (!holdToasts) Toast.update(dt); Trans.update(dt);
    for (const c of AudioSys.captions) c.t -= dt; AudioSys.captions = AudioSys.captions.filter(c => c.t > 0);
    Save.flash = Math.max(0, Save.flash - dt);
  },
  draw() {
    UI.beginFrame();
    ctx.setTransform(RES, 0, 0, RES, 0, 0);
    ctx.imageSmoothingEnabled = false;
    // dibujar desde la última escena opaca
    let start = 0;
    for (let i = Scenes.stack.length - 1; i >= 0; i--) if (Scenes.stack[i].opaque !== false) { start = i; break; }
    if (!Scenes.stack.length) rect(ctx, 0, 0, W, H, PAL.ink);
    for (let i = start; i < Scenes.stack.length; i++) {
      const s = Scenes.stack[i];
      TextAudit.layer = i;
      if (i < Scenes.stack.length - 1) { const saved = UI.items; s.draw(ctx); UI.items = saved.length ? saved : []; UI.items = []; }
      else s.draw(ctx);
    }
    TextAudit.layer = Scenes.stack.length - 1; // avisos y subtítulos: encima de la escena superior
    if (Cut.fadeA > 0.001) { ctx.globalAlpha = Cut.fadeA; rect(ctx, 0, 0, W, H, Cut.fadeColor || '#000'); ctx.globalAlpha = 1; }
    FX.drawFlash(ctx);
    if (!(Scenes.top() && Scenes.top().hideToasts)) Toast.draw(ctx);
    TouchPad.draw(ctx);
    // en puzzles y menús los resultados ya se leen en pantalla: los subtítulos de sonido no tapan la interfaz
    // subtítulos de sonido: bajo el cartel de la isla, la barra del jefe o el holograma, sin chocar con los avisos
    if (G.save.settings.captions && AudioSys.captions.length && !(Scenes.top() && Scenes.top().hideToasts)) {
      const top = Toast.top() + 2; let cy = top;
      AudioSys.captions.forEach(c => {
        const w = textW(c.text) + 8, x = W / 2 - w / 2;
        const hit = Toast.list.some((t, k) => { const tw = textW(t.text) + 12, ty = t.y != null ? t.y : top + k * 18; return x + w > W - tw - 6 && cy < ty + 15 && cy + 11 > ty; });
        if (hit) cy = Math.max(cy, top + Toast.list.length * 18);
        ctx.globalAlpha = Math.min(1, c.t * 2); rect(ctx, x, cy, w, 11, 'rgba(0,0,0,0.6)'); drawText(ctx, c.text, W / 2, cy + 2, '#C9D2F0', { align: 'center' }); ctx.globalAlpha = 1;
        cy += 12;
      });
    }
    if (Save.flash > 0) { ctx.globalAlpha = Math.min(1, Save.flash); icon(ctx, 'star', W - 12, H - 12); ctx.globalAlpha = 1; }
    Trans.draw(ctx);
    HD.present();
  },
  newGame(player) {
    const settings = G.save.settings, teacher = G.save.teacherUnlocked, lab = G.save.labUnlocked;
    G.save = newSave(); G.save.settings = settings; G.save.started = true; G.save.teacherUnlocked = teacher; G.save.labUnlocked = lab;
    G.save.player = player || null; setHero(G.save.player);
    if (G.save.player) { Registro.registro(G.save.player); Registro.inicioSesion(true); }
    rebuildLia();
    Save.write();
    this.startLevel('festival');
  },
  continueGame(player) {
    Save.load(); rebuildLia(); syncPowers();
    if (player) { G.save.player = player; setHero(player); Save.write(); Registro.registro(player); }
    Registro.inicioSesion(false);
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
      Registro.log('entra_a_nivel', LEVELS[key].title || key);
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
    // jefes vencidos en partidas anteriores (o abiertos desde el modo docente): su poder llega ahora
    syncPowers();
  }
  update(dt) {
    const lv = this.lv;
    if (!Cut.active && !Trans.busy) {
      if (Input.hit('pause')) { Input.consume(); Scenes.push(new PauseScene(lv)); return; }
      if (Input.hit('codex')) { Input.consume(); Scenes.push(new CodexScene()); return; }
      if (Input.hit('blueprint')) { Input.consume(); Scenes.push(new BlueprintScene()); return; }
      // junto a un cofre de código, H explica cómo se juega
      if (Input.hit('hint')) { Input.consume(); if (lv.lockPanel && lv.lockPanel.near > 0.5) Scenes.push(new LockHelpScene()); else this.contextHint(); }
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

// ---------------------------------------------------------------------
//  DERROTA: Lía se queda sin células
//  1) golpe final: destello, cámara lenta y Lía cae al suelo; Lumi se apaga
//  2) el círculo de visión se cierra sobre ella
//  3) tarjeta «¡SIN CÉLULAS!» con qué la venció y un consejo (E para reintentar)
//  4) reaparece en el punto de control con el círculo abriéndose
// ---------------------------------------------------------------------
const FOE_NAMES = { hopper: 'un Bit Saltarín', flyer: 'un Zumbyte', charger: 'un Toro-Ohm', turret: 'un Torretín', bugglin: 'un Bugglin', loopling: 'un Loopling', shadowif: 'una Sombra SI', drainer: 'un Drainer', chaos: 'un Paquete Caótico', overflow: 'un Desbordamiento' };
const DEFEAT_TIPS = [
  'Agáchate (↓) para que los disparos altos pasen por encima.',
  'Agachada y quieta, Lumi convierte 50 de energía en una célula.',
  'Golpea un proyectil justo cuando llega: vuelve a quien lo lanzó.',
  'El escudo IF aguanta 3 golpes: elige una condición que no lo gaste de más.',
  'La barrida (↓ + ataque) pasa por debajo y el gancho (↑ + ataque) alcanza lo que vuela.',
  'Con la Lente Debug (F) cada golpe es crítico y ves el algoritmo de los enemigos.',
  'Los puntos de control guardan tu avance: actívalos al pasar.'
];
function defeatCause(src, lv) {
  if (!src) return 'un peligro del camino';
  const own = src.owner || src;
  if (own.D && own.D.name) return own.D.name;
  if (own.mini && own.name) return own.name;
  if (own.type && FOE_NAMES[own.type]) return FOE_NAMES[own.type];
  if (src instanceof Shot) return 'un proyectil';
  return 'un peligro del camino';
}
class DefeatScene {
  // cinemática de derrota (≈ 5 s antes de poder continuar):
  //  impact: el mundo se congela, Lía parpadea y su última célula se rompe sobre ella
  //  fall:   cae a cámara lenta y queda tendida; Lumi parpadea y se apaga; el mundo pierde el color
  //  dark:   el círculo de visión se cierra y aparece «Lía se quedó sin energía»
  //  card:   tarjeta MISIÓN FALLIDA (qué la venció, consejo, vuelta al punto de control)
  //  open:   reaparece en el punto de control con el círculo abriéndose
  constructor(lv) {
    this.lv = lv; this.t = 0; this.opaque = false; this.phase = 'impact'; this.openT = 0; this.nav = false;
    const p = lv.player;
    this.px = p.cx; this.py = p.y + p.h; this.face = p.face; this.vy = -110; this.ground = p.y + p.h;
    this.cause = defeatCause(p.lastHurt, lv);
    Registro.log('derrota', 'sin células', 'la venció ' + this.cause, G.save.stats.deaths || '');
    this.tip = lv.rboss ? 'Usa la Lente (F) para leer su programa y golpéalo en su descanso. ¡Cada intento es una prueba!' : DEFEAT_TIPS[(G.save.stats.deaths || 0) % DEFEAT_TIPS.length];
    p.hidden = true;
    AudioSys.stopSong(); AudioSys.sfx('defeat'); FX.flash('#FF6B6B', 0.6); FX.shake(4, 0.6);
    Particles.burst(p.cx, p.y + 8, 24, { colors: [PAL.sun, PAL.coral, PAL.white], min: 30, max: 110, type: 'star', lmax: 0.8 });
  }
  get skip() { return G.autoDialog; }
  static get T() { return { impact: 0.9, fall: 2.6, dark: 3.8, wait: 1.6 }; }
  update(dt) {
    this.t += dt;
    const T = DefeatScene.T;
    if (this.phase === 'impact') {
      if (this.t >= T.impact || this.skip) this.phase = 'fall';
    } else if (this.phase === 'fall') {
      // caída lenta del cuerpo hasta el suelo
      this.vy += 260 * dt; this.py += this.vy * dt * 0.5;
      if (this.py >= this.ground && this.vy > 0) { this.py = this.ground; if (this.vy > 40) { AudioSys.sfx('land'); FX.shake(2, 0.2); } this.vy = 0; }
      if (!this.lumiOff && this.t > 2.0) { this.lumiOff = true; AudioSys.sfx('powerdown'); }
      if (this.t >= T.fall || this.skip) this.phase = 'dark';
    } else if (this.phase === 'dark') {
      if (this.t >= T.dark || this.skip) { this.phase = 'card'; this.cardT = 0; AudioSys.sfx('fail'); }
    } else if (this.phase === 'card') {
      this.cardT += dt;
      const go = this.skip || (this.cardT > T.wait && (Input.hit('interact') || Input.hit('confirm') || Input.hit('attack') || Input.hit('jump') || Input.pointer.pressed));
      if (go) { Input.consume(); this.retry(); }
    } else if (this.phase === 'open') {
      this.openT += dt;
      if (this.openT > 1.0 || this.skip) this.finish();
    }
  }
  retry() {
    const lv = this.lv;
    lv.respawn(); lv.player.hidden = false;
    AudioSys.playSong(lv.def.music || lv.theme.music); AudioSys.sfx('restore');
    this.phase = 'open'; this.openT = 0;
  }
  finish() {
    const lv = this.lv;
    Scenes.pop(); lv.frozen = false; lv.defeated = false;
    Bark.say('pix', lv.rboss ? 'Otra vez. Ahora ya conoces su programa.' : choice(['¡Volvemos! Lumi recargó tus células.', 'Reiniciando desde el punto de control.', 'Depurar es fallar, mirar qué pasó y ajustar.']), 3);
    if (lv.rboss) Cut.run(() => bossRetry(lv));
  }
  // círculo de visión (se cierra sobre Lía o se abre en el punto de control)
  drawIris(g, ox, oy, R) {
    g.fillStyle = '#05070F';
    for (let y = 0; y < H; y += 2) {
      const dy = y + 1 - oy, half = R * R - dy * dy;
      if (half <= 0) { g.fillRect(0, y, W, 2); continue; }
      const hw = Math.sqrt(half);
      g.fillRect(0, y, Math.max(0, ox - hw), 2); g.fillRect(ox + hw, y, W, 2);
    }
  }
  draw(g) {
    const lv = this.lv, cx = lv.cam.x, cy = lv.cam.y, T = DefeatScene.T, t = this.t;
    const sx = Math.round(this.px - cx), sy = Math.round(this.py - cy);
    if (this.phase === 'open') {
      const k = easeOut(clamp(this.openT / 1.0, 0, 1));
      g.globalAlpha = 0.35 * (1 - k); rect(g, 0, 0, W, H, '#2A0A1A'); g.globalAlpha = 1;
      this.drawIris(g, Math.round(lv.player.cx - cx), Math.round(lv.player.y + 10 - cy), lerp(24, 520, k));
      g.globalAlpha = clamp(1 - k * 1.4, 0, 1); drawText(g, '¡DE VUELTA AL PUNTO DE CONTROL!', W / 2, 40, PAL.lime, { align: 'center', outline: PAL.ink }); g.globalAlpha = 1;
      return;
    }
    // el mundo pierde el color y se oscurece poco a poco
    const gray = clamp((t - 0.3) / 2.0, 0, 1);
    if (gray > 0) { g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,' + gray + ')'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    const pulse = this.phase === 'impact' ? 0.25 + 0.2 * Math.abs(Math.sin(t * 9)) : 0.35;
    g.globalAlpha = pulse * clamp(t / 0.4, 0, 1); rect(g, 0, 0, W, H, '#2A0A1A'); g.globalAlpha = 1;
    // viñeta roja en los bordes
    g.globalAlpha = 0.5 * clamp(t / 0.6, 0, 1);
    for (let i = 0; i < 10; i++) { strokeRect(g, i, i, W - i * 2, H - i * 2, '#7A1A2A'); g.globalAlpha *= 0.82; }
    g.globalAlpha = 1;
    // círculo de visión que se cierra sobre Lía
    const R = lerp(520, 30, easeInOut(clamp((t - T.fall + 0.4) / (T.dark - T.fall + 0.2), 0, 1)));
    if (t > T.fall - 0.4) this.drawIris(g, sx, sy - 6, R);
    // Lía: parpadea con el golpe final, cae a cámara lenta y queda tendida
    const S = Spr.lia.hurt[0], img = this.face > 0 ? S.rh : S.lh, base = this.face > 0 ? S.r : S.l;
    if (this.phase === 'impact') {
      if (Math.floor(t * 14) % 2 === 0) g.drawImage(img, sx - base.width / 2 + Math.round(Math.sin(t * 40)), sy - base.height + 1, base.width, base.height);
      // la última célula se rompe sobre su cabeza
      const k = clamp(t / T.impact, 0, 1), cyy = sy - base.height - 14 - k * 6, spread = Math.round(k * 5);
      g.globalAlpha = 1 - k * 0.6;
      drawLumiShape(g, sx - 4 - spread, cyy, Spr.lumi[0], PAL.coral, '#7A1A2A', false);
      drawLumiShape(g, sx - 3 + spread, cyy + spread, Spr.lumi[0], PAL.coral, '#7A1A2A', false);
      g.globalAlpha = 1;
      if (t > 0.25) drawText(g, '0 células', sx, cyy - 10, PAL.coral, { align: 'center', outline: PAL.ink });
    } else if (this.vy !== 0) g.drawImage(img, sx - base.width / 2, sy - base.height + 1, base.width, base.height);
    else {
      g.save(); g.translate(sx, sy - 5); g.rotate(this.face > 0 ? -Math.PI / 2 : Math.PI / 2);
      g.drawImage(img, -base.width / 2, -base.height / 2, base.width, base.height); g.restore();
    }
    // Lumi parpadea y se apaga a su lado
    const lx = sx + this.face * 10, ly = sy - 18 + Math.sin(t * 3) * 2;
    const flick = t < 1.2 ? 1 : t < 2.0 ? (Math.floor(t * 10) % 3 === 0 ? 0.2 : 0.9) : 0;
    if (flick > 0) { g.globalAlpha = flick; pcircle(g, lx, ly, 3, PAL.sun); g.globalAlpha = flick * 0.3; pcircle(g, lx, ly, 6, PAL.sun); g.globalAlpha = 1; }
    else pcircle(g, lx, ly + 6, 2, '#565E8C');
    // frase en la oscuridad
    if (t > T.fall + 0.2) {
      const msg = 'Lía se quedó sin energía...', n = Math.floor((t - T.fall - 0.2) * 24);
      drawText(g, msg.slice(0, n), W / 2, this.phase === 'card' ? 18 : 120, '#FFB0B8', { align: 'center', outline: '#2A0A1A' });
    }
    // tarjeta
    if (this.phase === 'card') {
      const a = easeBack(clamp(this.cardT * 2.2, 0, 1)), w = 300, h = 120, x = (W - w) / 2, y = 34 + (1 - a) * -70;
      panel(g, x, y, w, h, { border: PAL.coral, accent: PAL.coral, accentW: 90 });
      drawText(g, 'MISIÓN FALLIDA', W / 2, y + 10, PAL.coral, { align: 'center', scale: 2, outline: '#2A0A1A' });
      drawText(g, 'Te quedaste sin células · te venció ' + this.cause, W / 2, y + 32, PAL.cream, { align: 'center' });
      drawPara(g, '{y}Consejo:{/} ' + this.tip, x + 12, y + 46, w - 24, '#C9D2F0', { lh: 10 });
      drawText(g, 'Volverás al último punto de control con todas tus células.', W / 2, y + 82, '#8C93B8', { align: 'center' });
      if (this.cardT > T.wait) drawText(g, (Input.lastDevice === 'touch' ? 'Toca' : 'E / ENTER') + ': volver a intentarlo', W / 2, y + h - 14, Math.floor(t * 3) % 2 ? PAL.lime : PAL.sun, { align: 'center' });
      else bar(g, x + 60, y + h - 11, w - 120, 3, this.cardT, T.wait, PAL.coral, '#1E2748');
    }
  }
}

// con controles táctiles, el botón de pausa ocupa la esquina: el contador se aparta
const touchOff = () => TouchPad.visible ? 32 : 0;
function drawHUD(g, lv) {
  const p = lv.player;
  if (lv.def.noHud) return;
  // con un diálogo abierto arriba, el HUD se retira (no asoma cortado bajo el cuadro)
  if (Dlg.box && Dlg.box.atTop) return;
  // ancho de la zona de células (crece con los fragmentos de los jefes)
  const cellsW = Math.max(30, p.maxCells * 10);
  const abX = 8 + cellsW;
  // fondos suaves del HUD: el texto se lee sobre cualquier escenario
  {
    const ab0 = G.save.currentAbility, A0 = ab0 && hasAbility(ab0) ? ABILITIES[ab0] : null;
    const info0 = A0 && (ab0 === 'shield' || ab0 === 'pack' || ab0 === 'glide');
    const wAb = A0 ? Math.max(textW(A0.name), info0 ? 110 : 0) + 12 : 0;
    const hudW = abX + wAb, hudH = info0 ? 21 : 20;
    lv.hudW = hudW + 4;
    rect(g, 1, 1, hudW, hudH, 'rgba(10,14,32,0.5)'); rect(g, 2, 0, hudW - 2, 1, 'rgba(10,14,32,0.5)');
    rect(g, W - 75 - touchOff(), 1, 72, 15, 'rgba(10,14,32,0.5)');
  }
  // barra del mini jefe (durante su pelea)
  if (lv.miniFight) drawMiniHUD(g, lv);
  // paneles propios del nivel (p. ej., la lista del patio de entrenamiento)
  if (lv.def.hudDraw) lv.def.hudDraw(lv, g);
  // células de energía (forma de Lumi)
  for (let i = 0; i < p.maxCells; i++) {
    const on = i < p.cells;
    drawLumiShape(g, 6 + i * 10, 5, Spr.lumi[0], on ? PAL.sun : '#3A4068', on ? PAL.orange : '#22306B', false);
  }
  // energía: la marca indica lo que cuesta recargar una célula
  const bw = cellsW - 4;
  const eCol = p.chargeReady ? (Math.floor(lv.time * 12) % 2 ? PAL.white : PAL.teal) : p.energy >= healCost() && p.cells < p.maxCells ? PAL.lime : PAL.teal;
  bar(g, 6, 14, bw, 4, p.energy, 100, p.regenDelay > 0 && !p.chargeReady ? shade(eCol, -0.35) : eCol, '#10162B');
  rect(g, 6 + Math.round(bw * PASSIVE_ENERGY_CAP / 100), 18, 1, 1, '#8C93B8'); // hasta aquí se recarga sola
  rect(g, 6 + Math.round(bw * healCost() / 100), 13, 1, 6, 'rgba(255,243,215,0.55)');
  // estados de los poderes bajo la barra
  if (p.overload) drawText(g, 'SOBRECARGA', 6, 22, Math.floor(lv.time * 8) % 2 ? PAL.coral : PAL.white, { shadow: PAL.ink });
  else if (lv.slowT > 0) drawText(g, '⏸ ' + lv.slowT.toFixed(1).replace('.', ',') + ' s', 6, 22, PAL.lilac, { shadow: PAL.ink });
  // habilidad actual
  const ab = G.save.currentAbility;
  if (ab && hasAbility(ab)) {
    const A = ABILITIES[ab];
    rect(g, abX, 3, 4, 14, A.color);
    drawText(g, A.name, abX + 7, 3, A.color, { shadow: PAL.ink });
    let info = '';
    if (ab === 'shield') info = (p.shieldArmed ? (p.shieldOn ? '■ ACTIVO' : '○ armado') : 'desarmado') + ' · ' + ['SI peligro', 'SIEMPRE', 'SI saltando'][p.shieldRule];
    else if (ab === 'pack') info = 'mochila[' + (G.save.pack || []).length + ']';
    else if (ab === 'glide') info = 'mantén SALTO en el aire';
    if (info) drawText(g, info, abX + 7, 12, '#C9D2F0', { shadow: PAL.ink });
  }
  if (hasAbility('lens') && !lv.lens && lv.time < 60 && lv.def.lensHint) keyHint(g, 6, TouchPad.visible ? 40 : 22, 'lens', 'Lente', '#C9D2F0');
  // jefe: nombre, vida y (con la Lente) su programa
  if (lv.rboss && lv.rboss.showBar) drawBossHUD(g, lv, lv.rboss);
  // coleccionables
  const ch = Object.keys(G.save.collectibles.chispas).length;
  const to = touchOff();
  icon(g, 'spark', W - 70 - to, 4); drawText(g, String(ch), W - 60 - to, 5, PAL.pink, { shadow: PAL.ink });
  icon(g, 'seed', W - 40 - to, 4); drawText(g, String(G.save.collectibles.seeds), W - 30 - to, 5, PAL.lime, { shadow: PAL.ink });
  // objetivo
  const obj = lv.def.objective ? lv.def.objective(lv) : null;
  if (obj && (!Cut.active || Cut.free)) {
    // con controles táctiles, el objetivo sube bajo el HUD (abajo lo taparía la cruceta)
    const w = Math.min(260, textW(obj) + 20), oy = TouchPad.visible ? 25 : H - 18;
    rect(g, 4, oy, w, 13, 'rgba(16,22,43,0.75)'); rect(g, 4, oy, 2, 13, PAL.sun);
    drawText(g, fitText('▶ ' + obj, w - 8), 9, oy + 3, PAL.cream);
  }
  // indicador de interacción (con fondo propio, en el hueco que le reservó el nivel)
  if (lv.nearby && (!Cut.active || Cut.free) && lv.promptRect) {
    const r = lv.promptRect;
    rect(g, r.x - 1, r.y - 1, r.w + 2, r.h + 1, 'rgba(10,14,32,0.72)');
    keyHint(g, r.x + 1, r.y + 1, 'interact', r.label, PAL.white);
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
    g.drawImage(this.bg.sky, 0, 0, W, H);
    drawSkyLive(g, this.bg, this.t);
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
    drawText(g, 'v1.1 · HTML5 + Canvas + JS puro', W - 6, H - 10, 'rgba(255,243,215,0.6)', { align: 'right' });
    drawText(g, '© ' + AUTORIA.autor, 6, H - 10, 'rgba(255,243,215,0.6)');
  }
  pick(id) {
    AudioSys.unlock();
    // nueva partida: primero el registro del estudiante (nombre completo y consentimientos)
    const register = () => Scenes.push(new RegisterScene(p => Game.newGame(p)));
    if (id === 'new') { if (this.hasSave) Scenes.push(new ConfirmScene('¿Empezar de nuevo? Se sobrescribirá la partida guardada (los ajustes se conservan).', register)); else register(); }
    // continuar una partida guardada sin estudiante registrado: se registra antes de seguir
    if (id === 'cont') { Save.load(); if (G.save.player) Game.continueGame(); else Scenes.push(new RegisterScene(p => Game.continueGame(p), 'continue')); }
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
      ['o', 'PODERES (' + POWERS.filter(p => hasPower(p.id)).length + '/' + POWERS.length + ')', () => Scenes.push(new PowersScene())],
      ['s', 'AJUSTES', () => Scenes.push(new SettingsScene())],
      ['k', 'CONTROLES', () => Scenes.push(new ControlsScene())],
      flag('prologueDone') && !(this.lv && this.lv.def.noMap) ? ['w', 'VOLVER AL MAPA', () => { UI.nav = false; Game.toMap(this.lv && this.lv.def.region); }] : null,
      ['t', 'MENÚ PRINCIPAL', () => Scenes.push(new ConfirmScene('¿Volver al menú? Se guardará tu progreso en el último punto de control.', () => { Save.write(); Game.toTitle(); }))]
    ].filter(Boolean);
    opts.forEach(([id, label, fn], i) => { if (UI.btn(g, 'p_' + id, 170, 70 + i * 18, 140, 15, label, { color: i === 0 ? PAL.lime : id === 'o' ? PAL.sun : PAL.teal })) fn(); });
    drawText(g, 'Nivel ' + G.save.level + ' · ' + rankName(), 240, 236, '#8C93B8', { align: 'center' });
    // transparencia: el estudiante ve con quién se comparte su progreso
    if (G.save.player) drawText(g, fitText(G.save.player.full + ' · tu progreso se comparte con tu docente', 470), 240, 254, '#6A7090', { align: 'center' });
  }
}

class ControlsScene {
  constructor() { this.opaque = false; }
  update() { if (Input.hit('back') || Input.hit('confirm') || Input.pointer.pressed) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.85)');
    panel(g, 60, 20, 360, 230, { border: PAL.sun });
    drawText(g, 'CONTROLES', 240, 28, PAL.sun, { align: 'center', scale: 2 });
    const rows = [['left', 'mover a la izquierda'], ['right', 'mover a la derecha'], ['up', 'subir escaleras / nadar'], ['down', 'bajar · quieta: recargar una célula'], ['jump', 'saltar (mantén: salto alto / planear)'], ['run', 'correr'], ['attack', 'Lumisable (mantén: pulso · ↓ en el aire: rebote)'], ['interact', 'hablar / usar'], ['ability', 'usar habilidad'], ['swap', 'cambiar de habilidad'], ['lens', 'Lente Debug (golpes críticos)'], ['blueprint', 'Blueprint: tu último algoritmo'], ['codex', 'Atlas Aurora'], ['hint', 'pista de PÍX'], ['pause', 'pausa']];
    rows.forEach(([a, d], i) => { keyHint(g, 76, 48 + i * 12, a, d, PAL.cream); });
    drawText(g, 'Mando: A saltar · X atacar · B usar · Y habilidad', 240, 236, '#8C93B8', { align: 'center' });
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
      y += 15;
    };
    const tog = (key, label, desc) => {
      row(label);
      if (UI.btn(g, 't' + key, 330, y, 90, 12, S[key] ? 'SÍ' : 'NO', { color: S[key] ? PAL.lime : PAL.coral })) { S[key] = !S[key]; AudioSys.sfx('click'); if (key === 'pixelPerfect') resize(); if (key === 'assist' && G.run.level && G.run.level.player) G.run.level.player.refreshCells(); }
      y += 15;
    };
    const cyc = (key, label, opts, names) => {
      row(label);
      const i = opts.indexOf(S[key]);
      if (UI.btn(g, 'c' + key, 330, y, 90, 12, names[i < 0 ? 0 : i], { color: PAL.sun })) { S[key] = opts[(i + 1) % opts.length]; AudioSys.sfx('click'); }
      y += 15;
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
    // gráficos HD: filtro en la GPU que redondea los bordes con píxeles más finos
    row('Gráficos HD (bordes y curvas finos)');
    if (UI.btn(g, 'thd', 330, y, 90, 12, !HD.ok ? 'NO DISPONIBLE' : S.hd !== false && !HD.autoOff ? 'SÍ' : 'NO', { color: !HD.ok ? '#8A8FB0' : S.hd !== false && !HD.autoOff ? PAL.lime : PAL.coral }) && HD.ok) {
      S.hd = HD.autoOff ? true : S.hd === false; HD.autoOff = false; HD.apply(); AudioSys.sfx('click');
    }
    y += 15;
    tog('assist', 'Ayuda de combate (+2 células, jefes lentos)');
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
    const acts = [['left', 'Izquierda'], ['right', 'Derecha'], ['up', 'Arriba'], ['down', 'Abajo'], ['jump', 'Saltar'], ['attack', 'Atacar (sable)'], ['interact', 'Interactuar'], ['ability', 'Habilidad'], ['swap', 'Cambiar habilidad'], ['lens', 'Lente Debug'], ['hint', 'Pista'], ['run', 'Correr']];
    acts.forEach(([a, n], i) => {
      const y = 42 + i * 15;
      drawText(g, n, 110, y + 3, PAL.cream);
      const label = this.waiting === a ? 'pulsa una tecla...' : [...new Set((Input.bindings[a] || []).map(keyName))].slice(0, 2).join(' / ');
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
    if (UI.btn(g, 'rmreset', 110, 228, 120, 14, 'RESTABLECER', { color: PAL.coral })) { Input.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS)); G.save.settings.bindings = null; Save.writeSettings(); }
    if (UI.btn(g, 'rmback', 250, 228, 120, 14, 'VOLVER', { color: PAL.teal })) Scenes.pop();
  }
}

// ---------------------------------------------------------------------
//  ATLAS AURORA (códice)
// ---------------------------------------------------------------------
function unlockCodex(id) {
  if (!CODEX[id]) return;
  if (!G.save.codex[id]) { G.save.codex[id] = { read: false, t: Date.now() }; Toast.show('+ ATLAS: ' + CODEX[id].title, PAL.teal, 2); Registro.log('atlas', CODEX[id].title); }
}
const CODEX_CATS = [['algoritmos', 'ALGORITMOS', PAL.teal], ['energias', 'ENERGÍAS', PAL.lime], ['personajes', 'PERSONAJES', PAL.pink], ['islas', 'ISLAS', PAL.sun], ['misterios', 'MISTERIOS', PAL.violet], ['bestiario', 'BESTIARIO', PAL.coral]];
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
    CODEX_CATS.forEach(([k, n, c], i) => { if (UI.btn(g, 'cc' + k, 8 + i * 78, 24, 76, 14, n, { color: c, bg: this.cat === k ? shade(c, -0.6) : undefined })) { this.cat = k; this.sel = null; this.scroll = 0; this.lscroll = 0; } });
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
    if (e.portrait) { const pt = Portraits.get(e.portrait, 'feliz'); strokeRect(g, 437, 45 - this.scroll, 34, 34, PAL.coral); g.drawImage(pt, 438, 46 - this.scroll); }
    else if (e.icon) icon(g, e.icon, 450, 50 - this.scroll);
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
  get toastTop() { return 30; }
  constructor(focus) {
    this.t = 0; this.opaque = true; this.hostsCut = true; this.touchPad = false;
    const avail = REGIONS.filter(r => unlocked(r.key));
    this.sel = regionIdx(focus || (avail.find(r => !restored(r.key)) || avail[avail.length - 1]).key);
    if (this.sel < 0) this.sel = 0;
    this.travel = null;
    AudioSys.playSong('map'); AudioSys.ambient('sea');
    UI.nav = false;
    if (MAP_EVENTS) { const ev = MAP_EVENTS.find(e => !flag(e.flag) && e.cond()); if (ev) { setFlag(ev.flag); Cut.run(ev.run); } }
    // aviso de repaso: una vez por visita al mapa
    const due = Cards.due().length;
    if (due) Toast.show('◆ ' + due + ' carta' + (due > 1 ? 's' : '') + ' del Atlas lista' + (due > 1 ? 's' : '') + ' para repasar (CARTAS)', PAL.sun, 3.5);
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
    if (Input.hit('swap')) Scenes.push(new CardsScene());
    if (Input.pointer.pressed) {
      const P = Input.pointer;
      if (P.y < H - 40) REGIONS.forEach((r, i) => { if (Math.abs(P.x - r.x) < 30 && P.y > r.y - 34 && P.y < r.y + 20 && unlocked(r.key)) { if (this.sel === i) this.go(); else { this.sel = i; AudioSys.sfx('select'); } } });
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
  // ---------- dibujo: océano, rutas, islas ilustradas, placas y panel inferior ----------
  draw(g) {
    MapArt.build();
    const t = this.t;
    drawHiRes(g, MapArt.ocean, 0, 0, W, H);
    drawOceanLive(g, t);
    drawRoutes(g, t);
    // islas de arriba abajo para que las más cercanas tapen a las lejanas
    const order = REGIONS.map((r, i) => i).sort((a, b) => REGIONS[a].y - REGIONS[b].y);
    for (const i of order) drawIslandArt(g, REGIONS[i], i, t, this.sel === i && !this.travel);
    for (const i of order) this.drawBadge(g, REGIONS[i], i);
    // nombres bajo las islas conocidas (la elegida lleva su cartel)
    const ban = this.travel ? null : this.nameBannerRect(REGIONS[this.sel]);
    for (const i of order) {
      const r = REGIONS[i];
      if (!unlocked(r.key) || this.travel || i === this.sel) continue;
      // el cartel de la isla elegida tapa el nombre de la vecina: ese nombre espera
      const ny = Math.min(r.y + 21, H - 48), nw = textW(r.name) + 4;
      if (ban && r.x + nw / 2 > ban.x && r.x - nw / 2 < ban.x + ban.w && ny + 9 > ban.y && ny - 1 < ban.y + ban.h) continue;
      drawText(g, r.name, r.x, ny, restored(r.key) ? PAL.cream : '#9AA2C8', { align: 'center', outline: '#0A1638' });
    }
    // viaje por la ruta marítima
    if (this.travel) this.drawTravel(g);
    Particles.draw(g, 0, 0, true);
    // cartel con el nombre de la isla elegida
    if (!this.travel) this.drawNameBanner(g, REGIONS[this.sel]);
    this.drawTopBar(g);
    this.drawInfoPanel(g, REGIONS[this.sel]);
    Cut.draw(g);
  }
  // insignia de estado: ✓ restaurada, corona si su jefe está depurado, «!» si el jefe espera
  drawBadge(g, r, i) {
    if (!unlocked(r.key) || !restored(r.key)) return;
    const x = r.x + 34, y = r.y + 6;
    const boss = BOSSES[r.key], beaten = boss && flag('boss_' + r.key);
    const col = boss && !beaten ? PAL.coral : beaten ? PAL.sun : PAL.lime;
    pcircle(g, x, y, 5, OUTLINE); pcircle(g, x, y, 4, col);
    if (boss && !beaten) { if (Math.floor(this.t * 3) % 2) drawText(g, '!', x, y - 3, PAL.ink, { align: 'center' }); }
    else if (beaten) { rect(g, x - 3, y - 1, 7, 3, PAL.ink); px(g, x - 3, y - 2, PAL.ink); px(g, x, y - 3, PAL.ink); px(g, x + 3, y - 2, PAL.ink); }
    else drawText(g, '✓', x, y - 3, PAL.ink, { align: 'center' });
  }
  nameBannerRect(r) {
    const name = r.name.toUpperCase(), w = textW(name) + 16, h = 13;
    let x = Math.round(r.x - w / 2), y = Math.round(r.y - ISL_AY - 12);
    x = clamp(x, 4, W - w - 4);
    if (y < 24) y = Math.round(r.y + 22);
    return { x: x - 3, y, w: w + 6, h: h + 9, name, bx: x, bw: w, bh: h };
  }
  drawNameBanner(g, r) {
    const R = this.nameBannerRect(r), name = R.name, w = R.bw, h = R.bh, x = R.bx, y = R.y;
    const bob = Math.floor(this.t * 3) % 2;
    rect(g, x + 2, y + 2, w, h, 'rgba(5,10,30,0.45)');
    rect(g, x, y, w, h, shade(r.col, -0.55)); rect(g, x, y, w, 1, r.col); rect(g, x, y + h - 1, w, 1, r.col);
    rect(g, x - 3, y + 3, 3, h - 6, shade(r.col, -0.7)); rect(g, x + w, y + 3, 3, h - 6, shade(r.col, -0.7));
    drawText(g, name, x + w / 2, y + 3, PAL.white, { align: 'center' });
    drawText(g, '▼', clamp(r.x, x + 6, x + w - 6), y + h + 1 + bob, PAL.sun, { align: 'center', outline: PAL.ink });
  }
  drawTravel(g) {
    const a = REGIONS[this.travel.from], b = REGIONS[this.travel.to], k = easeInOut(clamp(this.travel.t, 0, 1));
    const i = Math.max(this.travel.from, this.travel.to), fwd = this.travel.to >= this.travel.from;
    const p = routePoint(fwd ? a : b, fwd ? b : a, fwd ? k : 1 - k, routeBend(i));
    const tr = b.transport, x = p.x, y = p.y;
    if (tr.includes('planeador') || tr.includes('ascensor') || tr.includes('teleférico')) {
      const yy = y - 14 - Math.sin(k * Math.PI) * 10;
      for (let q = 0; q < 8; q++) rect(g, x - 8 + q * 2, yy - 4 + Math.abs(q - 4), 2, 1, PAL.aqua);
      g.drawImage(Spr.lia.glide[0].r, Math.round(x - 11), Math.round(yy - 2));
    } else {
      for (let q = 1; q < 6; q++) { g.globalAlpha = 0.5 - q * 0.08; rect(g, x - 10 - q * 5, y + 5, 5, 1, '#FFFFFF'); } g.globalAlpha = 1;
      const bob = Math.round(Math.sin(this.t * 6));
      rect(g, x - 10, y + 2 + bob, 20, 3, '#8B5A3C'); rect(g, x - 8, y + 5 + bob, 16, 1, '#5E3A26');
      rect(g, x - 1, y - 10 + bob, 1, 12, PAL.cream); for (let q = 0; q < 8; q++) rect(g, x, y - 9 + q + bob, q, 1, PAL.sun);
      rect(g, x - 8, y - 1 + bob, 6, 3, '#2A4A9A'); rect(g, x - 8, y - 1 + bob, 6, 1, PAL.aqua);
    }
    const lw = textW(tr) + 10, ly = y - 36 - (tr.includes('planeador') || tr.includes('ascensor') || tr.includes('teleférico') ? 12 : 0);
    rect(g, x - lw / 2, ly, lw, 11, 'rgba(10,14,32,0.75)');
    drawText(g, tr, x, ly + 2, PAL.cream, { align: 'center' });
  }
  drawTopBar(g) {
    const done = REGIONS.filter(r => restored(r.key)).length;
    const bosses = Object.keys(BOSSES).filter(k => flag('boss_' + k)).length;
    const chispas = Object.keys(G.save.collectibles.chispas).length, chTot = Object.keys(CHISPAS).length;
    // placa izquierda: título y ayuda
    const hint = Input.lastDevice === 'touch' ? 'toca una isla para elegirla' : '← → elige · ENTER viaja';
    const lw = Math.max(textW('ARCHIPIÉLAGO AURORA'), textW(hint)) + 14;
    panel(g, 3, 2, lw, 24, { border: '#C8A04A', bg: 'rgba(12,20,48,0.85)', hi: '#8A6A2A' });
    drawText(g, 'ARCHIPIÉLAGO AURORA', 10, 6, PAL.sun);
    drawText(g, hint, 10, 15, '#C9D2F0');
    // placa derecha: progreso (islas, jefes, chispas) y pausa
    const s1 = 'islas ' + done + '/11 · jefes ' + bosses + '/10', s2 = 'chispas ' + chispas + '/' + chTot;
    const sw = Math.max(textW(s1), textW(s2)) + 14, sx = W - sw - 26;
    panel(g, sx, 2, sw, 24, { border: '#C8A04A', bg: 'rgba(12,20,48,0.85)', hi: '#8A6A2A' });
    drawText(g, s1, sx + 7, 6, PAL.cream); drawText(g, s2, sx + 7, 15, PAL.pink);
    if (UI.btn(g, 'mpause', W - 23, 2, 20, 24, '≡', { color: PAL.cream, tip: 'Pausa' })) Scenes.push(new PauseScene(null));
  }
  drawInfoPanel(g, r) {
    const y0 = H - 38, un = unlocked(r.key), on = restored(r.key);
    panel(g, 2, y0, W - 4, 36, { border: r.col, bg: 'rgba(12,18,42,0.94)', accent: r.col, accentW: 60 });
    // miniatura de la isla (postal)
    const art = MapArt.isl[r.key];
    rect(g, 6, y0 + 4, 44, 28, shade(r.col, -0.75));
    if (art) { g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(un ? (on ? art.on : art.off) : art.fog, 8, y0 + 3, 40, 30); g.restore(); g.imageSmoothingEnabled = false; }
    strokeRect(g, 6, y0 + 4, 44, 28, r.col);
    // textos (cada línea recortada a su ancho: nunca se montan sobre los botones)
    const tx = 56, tw = 262;
    const status = on ? '✓ RESTAURADA' : un ? '○ SIN ENERGÍA' : '? POR DESCUBRIR';
    const stCol = on ? PAL.lime : un ? PAL.coral : '#8C93B8';
    const nm = (regionIdx(r.key) + 1) + '. ' + r.name;
    drawText(g, fitText(nm, tw - textW(status) - 10), tx, y0 + 4, r.col, { outline: PAL.ink });
    drawText(g, status, tx + tw, y0 + 4, stCol, { align: 'right' });
    drawText(g, fitText('⚙ ' + r.prog + '   ⚡ ' + r.energy, tw), tx, y0 + 14, '#C9D2F0');
    const ch = Object.keys(CHISPAS).filter(k => CHISPAS[k].region === r.key), got = ch.filter(k => G.save.collectibles.chispas[k]).length;
    const chTxt = '✦ chispas ' + got + '/' + ch.length + '   ';
    drawText(g, chTxt, tx, y0 + 24, PAL.pink);
    if (BOSSES[r.key]) {
      const beaten = flag('boss_' + r.key);
      const boss = beaten ? '♦ ' + BOSSES[r.key].name + ' depurado' : on ? '! Jefe: te espera en la salida' : '♦ Jefe: ' + BOSSES[r.key].name;
      drawText(g, fitText(boss, tw - textW(chTxt)), tx + textW(chTxt), y0 + 24, beaten ? PAL.sun : on ? PAL.coral : '#8C93B8');
    }
    // botones (el mapa no usa foco de teclado; las ventanas abiertas encima sí)
    if (Scenes.top() === this) UI.nav = false;
    const bx = W - 158;
    if (UI.btn(g, 'mgo', bx, y0 + 4, 76, 14, '▶ VIAJAR', { primary: true, color: PAL.lime, disabled: !un })) this.go();
    if (UI.btn(g, 'mtaller', bx + 80, y0 + 4, 74, 14, 'TALLER', { icon: 'home', color: PAL.orange })) Scenes.push(new TallerScene());
    if (UI.btn(g, 'matlas', bx, y0 + 20, 76, 14, 'ATLAS (C)', { color: PAL.teal })) Scenes.push(new CodexScene());
    // cartas del Atlas: el botón late si hay repasos pendientes
    const due = Cards.due().length;
    if (UI.btn(g, 'mcards', bx + 80, y0 + 20, 74, 14, due ? '◆ CARTAS ' + due : 'CARTAS (R)', { color: due ? PAL.sun : PAL.lime, tip: 'Cartas del Atlas, repaso y reto del día' })) Scenes.push(new CardsScene());
    if (due) { g.globalAlpha = 0.35 + Math.sin(this.t * 5) * 0.3; strokeRect(g, bx + 78, y0 + 18, 78, 18, PAL.sun); g.globalAlpha = 1; }
    UI.drawTooltip(g);
  }
}

// (El TALLER DE LÍA y el patio de entrenamiento viven en 29_taller.js)

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
        ['jefe', 'LUCHAR CONTRA UN JEFE', 'Cada jefe ejecuta un algoritmo de su isla: se lee con la Lente Debug.'],
        ['lab', 'AURORA LAB', 'Sandbox de microred sin penalización.'],
        ['reset', 'REINICIAR PROGRESO', 'Borra la partida guardada (conserva ajustes).']
      ];
      opts.forEach(([id, l, d], i) => {
        if (UI.btn(g, 'tm' + id, 40, 42 + i * 30, 140, 18, l, { color: id === 'reset' ? PAL.coral : id === 'jefe' ? PAL.orange : PAL.teal })) this.pick(id);
        drawPara(g, d, 190, 46 + i * 30, 260, PAL.cream);
      });
      // el reto del día es el mismo para toda la clase: quien lo supera ve este código
      drawText(g, 'Reto del día: ' + dailyChallenge().title + ' · código ' + dailyCode(), 12, H - 16, PAL.pink);
      if (UI.btn(g, 'tmback', W - 70, H - 20, 64, 14, 'VOLVER', {})) { Scenes.pop(); }
    } else if (this.page === 'isla') {
      REGIONS.forEach((r, i) => { if (UI.btn(g, 'ti' + r.key, 30 + (i % 3) * 144, 50 + Math.floor(i / 3) * 40, 136, 30, r.name, { color: r.col })) { G.save.started = true; G.save.teacherAll = true; G.save.teacherUnlocked = true; setFlag('prologueDone'); for (let k = 0; k < i; k++) { setFlag('restored_' + REGIONS[k].key); setFlag('boss_' + REGIONS[k].key); } grantAbilitiesUpTo(r.key); Save.write(); UI.nav = false; Game.startLevel(LEVEL_OF_REGION[r.key] || r.key); } });
      drawPara(g, 'Al elegir una isla se marcan como restauradas las anteriores (con sus jefes) y se otorgan sus habilidades, para poder trabajar un concepto concreto en clase.', 30, 214, 420, '#8C93B8');
    } else if (this.page === 'jefe') {
      const keys = Object.keys(BOSSES);
      keys.forEach((k, i) => {
        const D = BOSSES[k], r = REGIONS[regionIdx(k)];
        if (UI.btn(g, 'tj' + k, 30 + (i % 2) * 214, 44 + Math.floor(i / 2) * 32, 206, 17, D.name, { color: D.color, tip: r.name + ' · ' + r.prog })) {
          G.save.started = true; G.save.teacherAll = true; G.save.teacherUnlocked = true; setFlag('prologueDone');
          const idx = regionIdx(k);
          for (let q = 0; q < idx; q++) { setFlag('restored_' + REGIONS[q].key); setFlag('boss_' + REGIONS[q].key); }
          setFlag('restored_' + k); grantAbilitiesUpTo(REGIONS[idx + 1] ? REGIONS[idx + 1].key : k);
          G.bossRematch = flag('boss_' + k) ? k : null;
          Save.write(); UI.nav = false; Game.startLevel('jefe_' + k);
        }
        drawText(g, (flag('boss_' + k) ? '✓ ' : '') + r.name + ' · ' + r.prog, 30 + (i % 2) * 214 + 103, 44 + Math.floor(i / 2) * 32 + 19, flag('boss_' + k) ? PAL.lime : '#C9D2F0', { align: 'center' });
      });
      drawPara(g, 'Cada jefe cierra su isla con el concepto trabajado: con la Lente se lee su programa y a mitad del combate hay que corregir su código con un parche.', 30, 214, 420, '#8C93B8');
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
    if (id === 'jefe') this.page = 'jefe';
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
