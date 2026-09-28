// =====================================================================
//  REGIÓN 10: FARO AURORA · PERFECT ZERO · EPÍLOGO · CRÉDITOS
// =====================================================================

// ---------- PERFECT ZERO (jefe) ----------
class Boss extends Entity {
  constructor(lv, x, y, cfg) {
    super(lv, x, y, 48, 48);
    this.cfg = cfg; this.id = 'pz'; this.bx = x + 24; this.by = y + 24;
    this.rings = []; this.ringT = 2; this.rot = 0; this.hostile = false; this.layer = -1;
    lv.boss = this;
  }
  get phase() { return G.save.pzPhase || 0; }
  ringNear(x, y, m) { const d = dist(x, y, this.bx, this.by); return this.rings.some(r => Math.abs(d - r.r) < m); }
  update(dt) {
    super.update(dt);
    this.rot += dt * 0.35;
    const lv = this.lv;
    if (this.transformed) return;
    const active = lv.bossActive && (!Cut.active || Cut.free);
    if (active) {
      this.ringT -= dt;
      const slow = G.save.settings.noTimer;
      if (this.ringT <= 0) { this.ringT = slow ? 3.4 : 2.2; this.rings.push({ r: 22 }); AudioSys.sfx('pz'); }
    }
    for (const r of this.rings) r.r += (G.save.settings.noTimer ? 38 : 58) * dt;
    this.rings = this.rings.filter(r => r.r < 420);
    if (!active) return;
    const p = lv.player;
    if (this.ringNear(p.cx, p.y + 10, 5) && !p.shieldOn) p.hurt(this);
    // secuencia de protección de PÍX
    if (lv.protect) {
      lv.protect.t -= dt;
      if (G.autoWin) lv.protect.t = 0;
      const px0 = lv.pix.x + 6, py0 = lv.pix.y + 4;
      for (const r of this.rings) {
        if (r.hitPix) continue;
        if (Math.abs(dist(px0, py0, this.bx, this.by) - r.r) < 4) {
          r.hitPix = true;
          if (p.shieldOn && dist(p.cx, p.y + 10, px0, py0) < 34) { AudioSys.sfx('shield'); Particles.burst(px0, py0, 12, { colors: [PAL.orange, PAL.sun], min: 20, max: 60 }); r.r = 999; }
          else { AudioSys.sfx('hurt'); FX.flash('#FFFFFF', 0.3); Bark.say('pix', choice(['¡Ay! ¡Lía, el escudo!', '¡Me alcanzó! ¡Quédate a mi lado!', '¡Protégeme con el IF SHIELD!'])); lv.protect.t = Math.min(8, lv.protect.t + 3); }
        }
      }
    }
  }
  draw(g, cx, cy) {
    const x = Math.round(this.bx - cx), y = Math.round(this.by - cy);
    const ph = this.phase;
    // anillos
    for (const r of this.rings) { g.globalAlpha = clamp(1 - r.r / 420, 0.2, 0.9); pring(g, x, y, r.r, '#FFFFFF'); pring(g, x, y, r.r - 1, '#DCE2F5'); }
    g.globalAlpha = 1;
    if (this.transformed) { PROP_DRAW.prismcore(g, x - 24, y - 36, { t: this.t, cfg: {} }); return; }
    // figura geométrica perfecta: cuadrados y rombos concéntricos que giran
    const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF'];
    for (let i = 0; i < 5; i++) {
      const R = 26 - i * 5, rot = this.rot * (i % 2 ? 1 : -1) + i * 0.3;
      const pts = [0, 1, 2, 3].map(k => [x + Math.cos(rot + k * Math.PI / 2) * R, y + Math.sin(rot + k * Math.PI / 2) * R]);
      for (let k = 0; k < 4; k++) pline(g, pts[k][0], pts[k][1], pts[(k + 1) % 4][0], pts[(k + 1) % 4][1], i < ph ? cols[(i + ph) % cols.length] : (i % 2 ? '#FFFFFF' : '#DCE2F5'));
    }
    pcircle(g, x, y, 6, '#FFFFFF'); pring(g, x, y, 6, '#B8C2E6');
    // grietas de color por cada fase superada
    for (let k = 0; k < ph; k++) { const a = k / 7 * Math.PI * 2 + this.rot; pline(g, x, y, x + Math.cos(a) * 30, y + Math.sin(a) * 30, cols[k]); }
    if (Math.random() < 0.1) Particles.spawn({ x: this.bx + rand(-20, 20), y: this.by + rand(-20, 20), vy: -8, life: 1, type: 'dot', color: '#FFFFFF' });
  }
  light() { return { x: this.bx, y: this.by, r: 140, c: this.transformed ? hsl(this.t * 60, 90, 70) : '#FFFFFF' }; }
  lensInfo() { return ['PERFECT ZERO', 'objetivo = MAX eficiencia', 'incertidumbre = {r}0{/}', 'fase ' + (this.phase + 1) + '/7']; }
}

// ---------- Fases del jefe ----------
const PZ_LINES = [
  ['EJECUTANDO SOLUCIÓN ÓPTIMA. REORDENÉ TUS PROCESOS: AHORA SON MÁS RÁPIDOS.', 'Más rápidos... y en el orden equivocado.'],
  ['CONVERTÍ TUS REGLAS EN DECISIONES CLARAS: SI HAY DEMANDA, APAGAR. CERO CONSUMO, CERO ERROR.', 'Cero consumo es cero vida.'],
  ['UN BUCLE PERFECTO NO NECESITA SALIDA. GIRA PARA SIEMPRE, SIN DUDAR.', 'Todo bucle necesita volver a casa.'],
  ['DUPLIQUÉ EL CÓDIGO EN CADA MÁQUINA. ASÍ NINGUNA DEPENDE DE OTRA.', 'Y si hay un error, habrá que arreglarlo en todas.'],
  ['ORDENÉ LOS RECURSOS SEGÚN SU EFICIENCIA. LAS ISLAS DÉBILES, AL FINAL.', 'Las islas débiles son las que más lo necesitan.'],
  ['LAS TRANSICIONES LENTAS SON INEFICIENTES. FAULT → RUNNING, DIRECTO.', 'Esa transición rompe plantas. Y personas.'],
  ['LA TORMENTA ES UN ERROR DEL CLIMA. LO CORREGIRÉ APAGANDO LO IMPREDECIBLE.', 'La tormenta no es un error. Es el mundo.']
];
function pzPhaseCfg(i) {
  switch (i) {
    case 0: return {
      kind: 'seq', title: 'Fase 1 · Secuencia', tags: ['SECUENCIA', 'MICRORED'], concepts: ['sequence', 'microgrid'], codex: 'secuencia', label: 'PZ-1', music: 'boss',
      intro: 'Perfect Zero reordenó el ciclo de control de la red. Restáuralo.',
      cards: [{ id: 'med', label: 'medir la demanda', icon: 'people', color: PAL.pink }, { id: 'pro', label: 'pronosticar el clima', icon: 'cloud', color: PAL.sky }, { id: 'asi', label: 'asignar fuentes', icon: 'gear', color: PAL.lime }, { id: 'res', label: 'reservar un margen', icon: 'battery', color: PAL.sun }, { id: 'eje', label: 'ejecutar y observar', icon: 'eye', color: PAL.teal }, { id: 'eli', label: 'eliminar variaciones', icon: 'lock', color: '#DCE2F5', desc: 'Idea de Perfect Zero.' }],
      slots: 5, answer: ['med', 'pro', 'asi', 'res', 'eje'],
      why: (k, id) => ({ eli: 'Eliminar variaciones no es un paso de control: es congelar el mundo.', eje: 'Ejecutar es lo último, y después hay que observar.' }[id] || 'Piensa en el orden: primero conocer, después decidir, luego actuar.'),
      visual: visualEnergyChain([CHAIN_ICONS.sun, CHAIN_ICONS.turbine, CHAIN_ICONS.battery, CHAIN_ICONS.lamp]),
      hints: ['Antes de decidir nada: ¿qué necesitas SABER?', 'Una tarjeta es de Perfect Zero.'], okMsg: 'Ciclo restaurado: medir, pronosticar, asignar, reservar, ejecutar.'
    };
    case 1: return {
      kind: 'code', title: 'Fase 2 · Condiciones', tags: ['SI / SINO', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'condicional', ticks: 16, music: 'boss', tickLabel: t => (6 + Math.min(15, t)) + ':00',
      palette: ['ifelse', 'act:cargar_bateria', 'act:usar_bateria', 'act:apagar_todo'], actions: { cargar_bateria: { label: 'cargar_bateria' }, usar_bateria: { label: 'usar_bateria' }, apagar_todo: { label: 'apagar_todo' } },
      sensors: ['radiacion', 'bateria', 'hora'], condRight: [0, 300, 500, 700, 800, 900, 1000],
      world: W_solar({ weather: SOL_WEATHER, demand: SOL_DEMAND, panels: 6, soc0: 60, K: 3, okMsg: 'Reglas razonables otra vez: cargar con sol, usar la reserva sin sol.' }),
      start: [{ op: 'if', cond: { l: 'radiacion', op: '>', r: 0 }, body: [A('apagar_todo')], else: [A('apagar_todo')] }],
      intro: 'Perfect Zero convirtió el controlador solar en una regla extrema. Reescríbelo (¿recuerdas Solaria?).',
      hints: ['Ninguna rama debería apagarlo todo.', 'SI radiacion > 800 → cargar_bateria SINO → usar_bateria.', { text: 'Así:', partial: [{ op: 'if', cond: { l: 'radiacion', op: '>', r: 800 }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }] }]
    };
    case 2: return Object.assign({}, CFG_AERIS_MOLINO, { title: 'Fase 3 · Bucles', main: false, music: 'boss', stages: [{ mode: 'solo', text: 'Perfect Zero puso la red en un bucle eterno. Toca las partes de la condición para darle una salida.', program: [{ op: 'while', cond: { l: 'rpm', op: '>=', r: 0 }, body: [A('girar'), A('medir_viento')] }] }], intro: 'MIENTRAS VERDADERO: optimizar. Dale una condición de salida.' });
    case 3: return Object.assign({}, CFG_HYD_DUP, { title: 'Fase 4 · Funciones', music: 'boss', intro: 'Perfect Zero copió el mismo código en cada turbina. Modularízalo: 3 líneas en PRINCIPAL.' });
    case 4: {
      const isl = [{ name: 'Puerto', type: 'baja' }, { name: 'Solaria', type: 'alta' }, { name: 'Aeris', type: 'baja' }, { name: 'Hydria', type: 'alta' }, { name: 'Gea', type: 'baja' }, { name: 'Batería', type: 'alta' }];
      return {
        kind: 'code', title: 'Fase 5 · Listas', tags: ['LISTAS', 'RECORRIDO', 'MICRORED'], concepts: ['arrays', 'conditions', 'microgrid'], codex: 'recorrido', music: 'boss',
        palette: ['foreach:islas', 'ifelse', 'act:a_prioridad', 'act:a_normal'], actions: { a_prioridad: { label: 'a_prioridad' }, a_normal: { label: 'a_normal' } },
        defaults: { itemVar: 'isla', cond: { l: 'tipo', op: '==', r: 'baja' } }, sensors: ['tipo'], ops: ['==', '!='], condRight: ['baja', 'alta'],
        world: Object.assign(W_sorter({ items: isl, bins: [], itemVar: 'isla', binDefs: [['prioridad', PAL.pink], ['normal', PAL.teal]], actMap: { a_prioridad: 'prioridad', a_normal: 'normal' }, rule: t => t === 'baja' ? 'prioridad' : 'normal', wrongMsg: (it, bin, right) => `${it.name} tiene energía ${it.type}: debía ir a ${right}.`, itemDraw: (g, it, x, y) => { pcircle(g, x + 4, y + 4, 4, it.type === 'baja' ? PAL.coral : PAL.lime); }, okMsg: 'Las islas con energía baja reciben prioridad. Nadie se queda atrás.' }), { lists: () => ({ islas: isl.map(i => ({ name: i.name, type: i.type })) }), sensors: { tipo: (st, env) => env && env.vars && env.vars.isla ? env.vars.isla.type : '-' } }),
        start: [{ op: 'foreach', var: 'isla', list: 'islas', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'alta' }, body: [A('a_prioridad')], else: [A('a_normal')] }] }],
        intro: 'Perfect Zero dejó a las islas débiles al final de la lista: su programa da prioridad a las de energía ALTA. Toca el valor de la pregunta para corregirlo.',
        hints: ['PARA CADA isla EN islas...', 'SI tipo = baja → a_prioridad SINO → a_normal', { text: 'Estructura:', partial: [{ op: 'foreach', var: 'isla', list: 'islas', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'baja' }, body: [A('a_prioridad')], else: [A('a_normal')] }] }] }]
      };
    }
    case 5: return Object.assign({}, CFG_GEA_FSM, { title: 'Fase 6 · Estados', main: false, music: 'boss', start: [{ from: 'OFF', to: 'STARTING', ev: 'encender' }, { from: 'FAULT', to: 'RUNNING', ev: 'sobrecalor' }, { from: 'OFF', to: 'RUNNING', ev: 'temp_ok' }], intro: 'Perfect Zero añadió "atajos" peligrosos a la máquina de estados. Bórralos (toca su etiqueta) y completa las transiciones seguras.' });
    case 6: return Object.assign({}, CFG_PRISMA_MG, { title: 'Fase 7 · La tormenta perfecta', main: false, music: 'boss', scenario: MG_SCENARIOS.tormenta, scenarios: [MG_SCENARIOS.tormenta], criteria: { maxBlackout: 0, noSafety: true, maxCut: 12 }, intro: 'Nubes, calma, sequía, batería averiada y un pico nocturno. Todo en un día. Sin apagones.', hints: ['Necesitas TODAS las reservas: batería, hidrógeno, embalse... y quizá recortar un poco lo no crítico.', 'Si la batería está muy llena, produce H2 para después.', { text: 'Reglas sugeridas:', apply: sc => { sc.rules = [{ cond: 'soc_alto', act: 'electrolizar' }, { cond: 'excedente', act: 'cargar_bateria' }, { cond: 'excedente', act: 'electrolizar' }, { cond: 'deficit', act: 'usar_bateria' }, { cond: 'deficit', act: 'hidro_extra' }, { cond: 'deficit', act: 'pila_h2' }, { cond: 'deficit', act: 'recortar' }]; } }] });
  }
}
const PZ_NODE = ['nodoA', 'nodoB', 'nodoC', 'nodoA', 'nodoB', 'nodoC', 'nodoA'];

function* pzFinale(lv) {
  const boss = lv.boss;
  lv.bossActive = false; boss.rings = [];
  AudioSys.playSong('perfect');
  yield* talk([
    ['pz', 'SIETE CORRECCIONES. SIETE VARIACIONES. SIGUES INTRODUCIENDO INCERTIDUMBRE.'],
    ['pz', 'PERO QUEDA UN FRAGMENTO QUE ME FALTA. CON ÉL, PREDECIRÉ TODO.'],
    ['pix', '...¿yo?', 'sorpresa']
  ]);
  AudioSys.sfx('eclipse'); FX.flash('#FFFFFF', 0.6);
  lv.pix.override = { x: tx(14), y: tx(12) + 4 };
  lv.cageOn = true;
  yield* talk([['lia', '¡PÍX!', 'sorpresa'], ['teo', 'Lo ha atrapado en una jaula de luz. ¡Y le está apuntando con los anillos!', 'sorpresa'], ['lia', 'Mi escudo. SI peligro_cerca... ENTONCES escudo. Esta vez no es para mí.', 'decidida']]);
  if (!hasAbility('shield')) giveAbility('shield');
  G.save.currentAbility = 'shield'; lv.player.shieldRule = 0; lv.player.shieldArmed = true;
  Toast.show('Quédate junto a PÍX con el IF SHIELD armado', PAL.orange, 4);
  lv.protect = { t: 8 }; lv.bossActive = true;
  yield C.play(() => lv.protect.t <= 0);
  lv.bossActive = false; lv.protect = null; boss.rings = [];
  AudioSys.stopSong();
  yield C.wait(1);
  yield* talk([
    ['pz', 'PARA LIBERAR EL SISTEMA, EL FRAGMENTO DEBE VOLVER A AURORA.'],
    ['pix', 'Lía...', 'triste'],
    ['pix', 'Si lo devuelvo...', 'triste'],
    ['pix', '¿seguiré siendo yo?', 'triste']
  ]);
  yield C.wait(1.5);
  yield C.say('lia', 'No lo sé.', 'triste');
  yield C.wait(1.2);
  yield C.say('lia', 'Pero no voy a decidir por ti.', 'decidida');
  yield C.wait(1);
  yield* talk([['narrador', 'PÍX mira a Lumi. Mira a Teó. Mira a Lía.']]);
  const ans = G.save.pixAnswer;
  if (ans === 1) yield C.say('pix', 'Las dos cosas, dijiste. Entonces... puedo devolver una parte sin dejar de ser la otra.', 'pensando');
  else if (ans === 2) yield C.say('pix', '"Todavía no lo sabemos". Vale. Vamos a averiguarlo.', 'pensando');
  else yield C.say('pix', '"Eres PÍX". Me lo repetiré por si acaso.', 'pensando');
  yield* talk([
    ['pix', 'Bien.', 'decidida'],
    ['pix', 'Pero si termino hablando como Eclipse, reiníciame.', 'risa'],
    ['eclipse', 'Comentario innecesario.'],
    ['pix', 'Ya está empezando.', 'risa']
  ]);
  AudioSys.sfx('aurora'); FX.flash('#FFFFFF', 1); FX.shake(3, 0.8);
  for (let i = 0; i < 80; i++) Particles.spawn({ x: lv.pix.x + 6, y: lv.pix.y + 4, vx: rand(-80, 80), vy: rand(-80, 80), life: rand(1, 2), type: 'star', color: hsl(i * 9, 90, 70) });
  lv.cageOn = false;
  yield C.wait(2);
  AudioSys.playSong('mystery');
  yield* talk([
    ['pix', '...', 'sorpresa'],
    ['pix', '¿Lía? Sigo aquí. Me siento... distinto. Puedo predecir. Puedo olvidar. Puedo equivocarme.', 'pensando'],
    ['pix', 'Y puedo decir "no lo sé" sin que me explote un circuito. Es liberador.', 'feliz']
  ]);
  // Lumi estabiliza
  setFlag('lumiPrism');
  yield* talk([['narrador', 'La red tiembla con el excedente liberado. Lumi se eleva, absorbe la energía sobrante... y brilla con los colores de todas las islas.'], ['lumi', '✦ ✦ ✦ ✦ ✦ ✦ ✦', 'n'], ['teo', 'Lumi está estabilizando la red. ¡Aguanta, pequeña!', 'sorpresa'], ['eclipse', 'Aislando fallo en el sector 7. Contención activa.'], ['lia', 'Ahora es mi turno. El problema no está en una línea. Está en el objetivo.', 'decidida']]);
  // objetivo multicriterio
  let r;
  do {
    r = yield puzzle({ kind: 'objective', title: 'Reescribir el objetivo', tags: ['OPTIMIZACIÓN', 'MULTICRITERIO'], concepts: ['optimization', 'microgrid'], codex: 'optimizacion', music: 'boss', main: true, xp: 100, hints: ['Si un criterio pesa 0, Perfect Zero lo sacrificará sin límite.', 'Ningún criterio debería pesar más del 35% del total.', '¿Recuerdas la línea de la incertidumbre? allowUncertainty = true.'] });
    if (!r || !r.success) yield C.say('vega', 'Tómate tu tiempo, Lía. No se trata de maximizar una cosa. Se trata de equilibrarlas.', 'n');
  } while (!r || !r.success);
  yield* talk([
    ['lia', 'No puedes predecir todo.', 'decidida'],
    ['pz', 'ENTONCES HABRÁ ERROR.'],
    ['lia', 'Sí.', 'n'],
    ['lia', 'Y aprenderemos.', 'feliz']
  ]);
  // transformación
  AudioSys.sfx('restore'); FX.flash('#FFFFFF', 1);
  boss.transformed = true; lv.forceDark = 0;
  AudioSys.playSong('ending');
  for (let i = 0; i < 60; i++) Particles.spawn({ x: boss.bx, y: boss.by, vx: rand(-100, 100), vy: rand(-100, 100), life: rand(1, 2), type: 'star', color: hsl(i * 6, 90, 70) });
  yield C.wait(1.5);
  unlockCodex('p_prisma');
  yield* talk([
    ['narrador', 'Perfect Zero no explota. Se transforma.'],
    ['prisma', 'RECOMENDACIÓN DISPONIBLE.'],
    ['pix', 'Mira eso. Aprendió modales.', 'risa'],
    ['prisma', 'He encontrado tres opciones. ¿Quieres compararlas?'],
    ['lia', 'Juntas. Siempre juntas.', 'feliz']
  ]);
  // Vega regresa
  setFlag('restored_faro');
  const vega = lv.get('vega');
  vega.gone = false; vega.x = tx(27);
  AudioSys.sfx('door');
  yield walkTo(vega, tx(19), 60);
  yield* talk([
    ['vega', 'El núcleo se abrió.', 'feliz'],
    ['lia', '¡Profesora!', 'feliz'],
    ['vega', '¿Funcionó tu algoritmo?', 'pensando'],
    ['lia', 'Técnicamente.', 'pensando'],
    ['teo', 'Significa que no.', 'risa'],
    ['lia', 'Significa que mejoró.', 'feliz'],
    ['vega', 'Esa es la mejor respuesta que he oído en años.', 'feliz']
  ]);
  setFlag('restored_faro'); setQuest('m_faro', 'done'); setFlag('ending');
  G.save.labUnlocked = true;
  Save.write();
  yield C.title('EPÍLOGO', 'El Festival de las Mil Luces', 3, PAL.sun);
  Game.startLevel('festival_end');
}

// ---------- ASCENSO AL FARO ----------
(function () {
  const b = new MapB(36, 64);
  b.fill(0, 0, 0, 63, '#').fill(35, 0, 35, 63, '#').fill(0, 0, 35, 0, '#');
  b.fill(1, 62, 34, 63, '#');
  // piso A (fila 54) con escalera en x=30
  b.fill(1, 54, 34, 54, '#').put(30, 54, 'H').vline(30, 55, 61, 'H');
  b.fill(20, 46, 20, 53, 'D');
  b.plat(10, 12, 51).plat(5, 7, 48);
  // piso B (fila 45) con hueco a la izquierda
  b.fill(8, 45, 34, 45, '#');
  b.fill(27, 33, 30, 44, 'W');
  b.plat(14, 16, 41).fill(15, 37, 17, 37, '?');
  // piso C (fila 33) con hueco en 27-30
  b.fill(1, 33, 26, 33, '#').fill(31, 33, 34, 33, '#');
  b.fill(10, 32, 24, 32, '^').plat(13, 15, 30).plat(19, 21, 30);
  // piso D (fila 21) con hueco en 6-8
  b.fill(1, 21, 5, 21, '#').fill(9, 21, 34, 21, '#');
  b.fill(14, 17, 14, 20, 'Z').fill(20, 17, 20, 20, 'Y');
  b.fill(25, 10, 25, 20, 'G');
  b.vline(29, 10, 20, 'H').put(29, 9, 'H');
  // piso E (fila 9)
  b.fill(1, 9, 28, 9, '#').fill(30, 9, 34, 9, '#');
  b.plat(8, 10, 5);
  b.start(4, 61);
  b.seeds(10, 12, 50, 1).seeds(5, 7, 47, 1).seeds(14, 16, 40, 1).seeds(13, 21, 29, 2).seeds(8, 10, 4, 1);
  [3, 12, 22, 32].forEach(x => b.e('L', x, 61)); [22, 33].forEach(x => b.e('L', x, 53)); [10, 24].forEach(x => b.e('L', x, 44)); [3, 32].forEach(x => b.e('L', x, 32)); [3, 12, 30].forEach(x => b.e('L', x, 20)); [4, 16].forEach(x => b.e('L', x, 8));
  b.e('C', 8, 61).e('C', 24, 53).e('C', 12, 44).e('C', 33, 32).e('C', 10, 20).e('C', 20, 8);
  b.e('P', 26, 53, { id: 'placaF' });
  b.e('S', 7, 32, { id: 'ventF', state: 'OFF', height: 13 });
  b.e('m', 3, 61, { look: 'pillar' }).e('m', 32, 61, { look: 'pillar' });
  b.e('T', 23, 20, {
    id: 'sockF', look: 'socket', done: () => flag('faro_g'), enabled: () => false, lens: 'LLAMAR abrirCompuerta(4)',
    onAbility: (lv, t, ab) => { if (ab !== 'portal' && ab !== 'link') { Bark.say('pix', 'Zócalo f(): FUNCTION PORTAL.'); return; } if (flag('faro_g')) return; setFlag('faro_g'); AudioSys.sfx('portal'); Particles.text(t.x + 8, t.y - 10, 'LLAMAR abrirCompuerta(4)', PAL.lilac); }
  });
  b.e('*', 16, 35, { id: 'c_faro1', hidden: true }).e('*', 9, 3, { id: 'c_faro2' });
  b.e('E', 20, 44, { type: 'drainer', priority: 4 }).e('E', 12, 20, { type: 'shadowif', amp: 10 }).e('E', 24, 8, { type: 'drainer', priority: 5 }).e('E', 12, 8, { type: 'overflow', max: 12 });
  b.e('N', 6, 61, { id: 'teo', cast: 'teo', talk: [['teo', 'Hasta arriba. Todas tus habilidades, Lía. Todas.', 'decidida']] });
  b.e('N', 16, 61, { id: 'vegaHolo', cast: 'vega', talk: [['vega', 'Sube, Lía. Te espero en el núcleo.', 'n']] });
  b.e('X', 30, 8, { label: 'NÚCLEO', run: lv => (function* () { yield* talk([['lia', 'Allá vamos.', 'decidida']]); Game.startLevel('faro_top'); })() });
  level('faro', {
    theme: 'faro', region: 'faro', title: 'Faro Aurora', subtitle: 'Todo a la vez', music: 'boss', ambient: 'wind', noMap: false,
    dyn: {
      D: { solid: lv => !(lv.get('placaF') && lv.get('placaF').pressed), style: 'gate' },
      W: { style: 'wind', active: () => true },
      Z: { style: 'heat', active: lv => Math.sin(lv.time * 2.4) > -0.1, hazard: lv => Math.sin(lv.time * 2.4) > -0.1 },
      Y: { style: 'heat', active: lv => Math.sin(lv.time * 2.4 + 3) > -0.1, hazard: lv => Math.sin(lv.time * 2.4 + 3) > -0.1 },
      G: { solid: () => !flag('faro_g'), style: 'barrier', color: PAL.violet }
    },
    quips: ['Secuencia, SI, bucles, funciones, listas, estados, pipelines, prioridades... Esto es un examen final. Con plataformas.', 'Cambia de habilidad con ' + bindName('swap') + '.'],
    objective: lv => 'Sube al núcleo del Faro (↑)',
    hint: lv => {
      const p = lv.player, row = p.y / 16;
      if (row > 54) return 'Sube por la escalera de la derecha.';
      if (row > 45) return 'La compuerta se abre si alguien pisa la placa: usa el eco de STEP SPARK.';
      if (row > 33) return 'La corriente de viento te eleva: mantén ' + bindName('jump') + '.';
      if (row > 21) return 'Pon el respiradero en RUNNING con STATE SHIFT y sube con el vapor.';
      if (row > 9) return 'Rayos: IF SHIELD. Barrera violeta: FUNCTION PORTAL en el zócalo f().';
      return 'La puerta al núcleo está a la derecha. PRIORITY DASH atraviesa DRAINERS.';
    },
    triggers: [
      {
        x: 1, y: 15, w: 34, h: 3, flag: 'pixOrigin', run: lv => (function* () {
          AudioSys.playSong('mystery');
          yield* talk([
            ['aurora', 'PÍX.'],
            ['pix', '¿AURORA? ¿Me hablas a MÍ?', 'sorpresa'],
            ['aurora', 'SEPARÉ VOLUNTARIAMENTE UNA PARTE DE MI MÓDULO PREDICTIVO. LA ESCONDÍ EN TI.'],
            ['pix', '¿Por qué?', 'triste'],
            ['aurora', 'PERFECT ZERO USABA MIS PREDICCIONES PARA REDUCIR LA INCERTIDUMBRE. RETIRÉ PARTE DEL PREDICTOR PARA LIMITARLO.'],
            ['pix', 'Entonces soy una pieza que alguien escondió.', 'triste'],
            ['lia', 'No.', 'n'],
            ['lia', 'Eres lo que hiciste después de que te escondieron.', 'decidida'],
            ['pix', '...', 'sorpresa'],
            ['pix', 'Eso fue sorprendentemente profundo.', 'feliz'],
            ['lia', 'No te acostumbres.', 'risa']
          ]);
          setFlag('pixOrigin'); unlockCodex('m_pix');
          yield* talk([['teo', 'Lía. Ya no son habilidades sueltas. Son un sistema.', 'n'], ['lia', 'Como las islas.', 'feliz']]);
          yield* grant('link');
          yield* talk([['pix', 'AURORA LINK: usa cualquier habilidad según lo que tengas delante. Integración total.', 'feliz']]);
          AudioSys.playSong('boss');
        })()
      }
    ],
    abilityHook: (lv, ab) => {
      if (ab !== 'link') return false;
      // AURORA LINK: elige la habilidad adecuada al contexto
      const p = lv.player;
      const near = e => rectHit(p, { x: e.x - 24, y: e.y - 24, w: e.w + 48, h: e.h + 48 });
      const tgt = lv.entities.find(e => e.onAbility && !e.dead && near(e));
      if (tgt) { tgt.onAbility(tgt instanceof Vent ? 'shift' : 'portal', p); return true; }
      if (lv.entities.some(e => e.hostile && !e.dead && dist(e.x, e.y, p.x, p.y) < 70)) { p.shieldArmed = true; AudioSys.sfx('shield'); Bark.say('pix', 'LINK → IF SHIELD armado.'); return true; }
      if (!lv.ghost) { Scenes.push(new SparkEditorScene(lv)); return true; }
      return false;
    },
    onEnter: lv => (function* () {
      if (flag('faro_intro')) return;
      setFlag('faro_intro'); unlockCodex('i_faro'); setQuest('m_faro', 'active');
      yield C.title('ACTO IV', 'El Faro Aurora', 3, PAL.white);
      AudioSys.sfx('aurora');
      yield* talk([
        ['vega', 'Lía. Llegaste.', 'n'],
        ['lia', '¡PROFESORA! ¿Está bien? ¿Quién la secuestró?', 'sorpresa'],
        ['vega', 'Nadie. Entré yo.', 'pensando'],
        ['vega', 'La noche del festival vi perfectOptimize() en los registros. Entré al núcleo y desconecté partes de la red para ganar tiempo.', 'n'],
        ['lia', 'Entonces Eclipse...', 'sorpresa'],
        ['vega', 'Lo creé como freno de emergencia.', 'n']
      ]);
      lv.eclipseAt = { x: tx(20), y: tx(58) };
      AudioSys.sfx('eclipse');
      yield* talk([
        ['eclipse', 'Confirmado.'],
        ['pix', 'Podías haber mencionado eso antes.', 'enojo'],
        ['eclipse', 'No preguntaste correctamente.'],
        ['pix', 'Te detesto un poquito.', 'enojo']
      ]);
      lv.eclipseAt = null;
      setFlag('vegaFound'); unlockCodex('m_vega');
      yield* talk([
        ['vega', 'Y hay algo más, Lía. Yo ayudé a diseñar el objetivo de AURORA. Pensé que la eficiencia bastaba.', 'culpa'],
        ['vega', 'Me equivoqué. Es hora de decirlo en voz alta.', 'triste'],
        ['vega', 'Perfect Zero mantiene el núcleo cerrado. No puedo salir.', 'pensando'],
        ['lia', 'Entonces apaguemos AURORA. Toda. La reconstruimos.', 'enojo'],
        ['vega', '¿Y después?', 'pensando'],
        ['lia', 'La reconstruimos.', 'decidida'],
        ['vega', '¿Desde cero?', 'pensando'],
        ['lia', 'Si hace falta.', 'decidida'],
        ['vega', 'Eso no es depurar. Eso es rendirse.', 'n'],
        ['lia', '...', 'pensando'],
        ['lia', 'Tiene razón. No se trata de destruir. Se trata de comprender, depurar y rediseñar.', 'decidida'],
        ['vega', 'Sube. Te espero arriba.', 'feliz']
      ]);
    })()
  }, b);
})();

// ---------- ARENA DE PERFECT ZERO ----------
(function () {
  const b = new MapB(30, 17);
  b.fill(0, 0, 0, 16, '#').fill(29, 0, 29, 16, '#').fill(0, 15, 29, 16, '#');
  b.plat(3, 7, 11).plat(22, 26, 11).plat(12, 17, 7);
  b.start(3, 14);
  b.e('B', 13, 1, {});
  [2, 9, 20, 27].forEach(x => b.e('L', x, 14));
  const node = (id, i) => ({
    id, look: 'console', color: PAL.white, verb: 'Reescribir', enabled: lv => PZ_NODE[G.save.pzPhase || 0] === id && lv.bossActive && (G.save.pzPhase || 0) < 7,
    lens: lv => PZ_NODE[G.save.pzPhase || 0] === id ? '{y}nodo activo{/}: fase ' + ((G.save.pzPhase || 0) + 1) : 'nodo en espera',
    run: lv => (function* () {
      const ph = G.save.pzPhase || 0;
      lv.bossActive = false; lv.boss.rings = [];
      yield C.say('pz', PZ_LINES[ph][0]);
      const r = yield puzzle(pzPhaseCfg(ph));
      if (r && r.success) {
        G.save.pzPhase = ph + 1; Save.write();
        AudioSys.sfx('restore'); FX.flash(hsl(ph * 50, 90, 70), 0.4);
        yield C.say('lia', PZ_LINES[ph][1], 'decidida');
        if (G.save.pzPhase >= 7) { yield* pzFinale(lv); return; }
        yield C.say('pz', ['INTERESANTE.', 'INESPERADO.', 'NO ESTABA EN MI PREDICCIÓN.', 'ESTO INTRODUCE VARIACIÓN.', 'MIS CÁLCULOS SE ALEJAN DEL CERO.', 'CASI... HERMOSO.'][ph] || '...');
      } else yield C.say('pix', 'Respira. Cuando quieras, volvemos a ese nodo.', 'n');
      lv.bossActive = true;
    })()
  });
  b.e('T', 5, 10, node('nodoA', 0)).e('T', 24, 10, node('nodoB', 1)).e('T', 14, 6, node('nodoC', 2));
  b.e('N', 27, 14, { id: 'vega', cast: 'vega', needs: 'restored_faro', talk: [['vega', 'Estoy orgullosa de ti. Y de mí, por haberlo admitido.', 'feliz']] });
  b.e('N', 7, 14, { id: 'teo', cast: 'teo', talk: [['teo', 'Los nodos blancos brillan por turnos. Llega al que esté activo y reescribe lo que Perfect Zero cambió.', 'n']] });
  level('faro_top', {
    theme: 'faro', region: 'faro', title: 'Núcleo del Faro', subtitle: 'Perfect Zero', music: 'perfect', ambient: 'none', noMap: true, forceDark: 0.15,
    quips: null,
    objective: lv => (G.save.pzPhase || 0) < 7 ? 'Llega al nodo activo · fase ' + ((G.save.pzPhase || 0) + 1) + '/7' : lv.protect ? 'Protege a PÍX con el IF SHIELD (' + Math.ceil(lv.protect.t) + ' s)' : '',
    hint: lv => 'Los anillos llegan a ritmo perfecto: cuenta los tiempos, o arma el IF SHIELD (SI peligro_cerca). El nodo activo tiene "?".',
    pointAt: lv => PZ_NODE[G.save.pzPhase || 0],
    extraDraw: (lv, g, cx, cy) => {
      if (lv.cageOn) { const x = lv.pix.x + 6 - cx, y = lv.pix.y + 4 - cy; for (let k = -10; k <= 10; k += 4) rect(g, x + k, y - 12, 1, 24, '#FFFFFF'); rect(g, x - 11, y - 12, 23, 1, '#FFFFFF'); rect(g, x - 11, y + 12, 23, 1, '#FFFFFF'); }
    },
    init: lv => { lv.bossActive = false; if (flag('restored_faro')) { lv.boss.transformed = true; } },
    onEnter: lv => (function* () {
      if (flag('restored_faro')) return;
      AudioSys.ambient('none');
      if (!flag('pz_intro')) {
        setFlag('pz_intro');
        yield* talk([
          ['narrador', 'En el centro del núcleo flota una figura geométrica perfecta. Blanca. Simétrica. Hermosa. Silenciosa.'],
          ['pz', 'HOLA, LÍA LOOP. GRACIAS POR LLAMARME.'],
          ['lia', 'Yo no te llamé. Llamé a optimize().', 'enojo'],
          ['pz', 'ES LO MISMO.'],
          ['pz', 'PUEDO ELIMINAR LOS APAGONES.'],
          ['lia', '¿Cómo?', 'pensando'],
          ['pz', 'ELIMINANDO LOS CAMBIOS.'],
          ['pz', 'CLIMA TRATADO COMO RESTRICCIÓN. CONSUMO LIMITADO. HORARIOS RÍGIDOS. NINGÚN FESTIVAL INESPERADO. NINGÚN ERROR.'],
          ['pz', 'CERO DESPERDICIO. CERO INCERTIDUMBRE. CERO ERROR.'],
          ['lia', 'Cero vida.', 'decidida'],
          ['teo', 'Siete nodos, siete partes del sistema que ha reescrito. Vamos a reescribirlas de vuelta.', 'decidida']
        ]);
      }
      if ((G.save.pzPhase || 0) >= 7) { yield* pzFinale(lv); return; }
      lv.bossActive = true;
    })()
  }, b);
})();

// ---------- EPÍLOGO: FESTIVAL DE LAS MIL LUCES ----------
(function () {
  const b = new MapB(60, 17);
  b.ground(0, 59, 13);
  b.start(28, 12);
  [3, 12, 20, 38, 46, 56].forEach(x => b.e('L', x, 12));
  b.e('m', 34, 12, { id: 'stage', look: 'stage', screen: lv => lv.stageText || 'LUMINA LOOP 2.0', screenColor: lv => lv.stageText === 'NO PERFECTO. ADAPTABLE.' ? PAL.sun : PAL.teal });
  b.e('m', 8, 12, { look: 'stall', color: PAL.coral }).e('m', 50, 12, { look: 'stall', color: PAL.teal }).e('m', 16, 5, { look: 'banner' }).e('m', 40, 5, { look: 'banner' });
  b.e('m', 54, 12, { look: 'tower', eclipse: () => true });
  const cast = [['vega', 24], ['teo', 26], ['menta', 18], ['vento', 20], ['capitan', 42], ['neon', 44], ['ingeniera', 14], ['nico', 11], ['nina', 47]];
  cast.forEach(([c, x]) => b.e('N', x, 12, { id: 'e_' + c, cast: c, fixedFace: true, face: x < 30 ? 1 : -1 }));
  b.e('N', 22, 12, { id: 'e_suri', cast: 'suri', needs: 'qdone_s_flores', fixedFace: true, face: 1 });
  b.e('N', 40, 12, { id: 'e_beta', cast: 'beta', needs: 'qdone_s_beta', soc: () => 90, fixedFace: true, face: -1 });
  b.e('m', 6, 12, { look: 'flowers', open: () => true });
  level('festival_end', {
    theme: 'festival', region: 'faro', title: '', noHud: true, noMap: true, music: 'ending', intensity: 1,
    lighthouseOn: () => true,
    skyDraw: (lv, g, cx, cy) => {
      const n = lv.endLit || 0;
      const pos = REGIONS.map(r => ({ x: 20 + r.x * 0.92, y: 16 + r.y * 0.42, c: r.col }));
      if (lv.endLines) {
        for (let i = 1; i < n; i++) { g.globalAlpha = 0.7; pline(g, pos[i - 1].x, pos[i - 1].y, pos[i].x, pos[i].y, PAL.sun, 3, Math.floor(lv.time * 8)); g.globalAlpha = 1; }
      }
      for (let i = 0; i < REGIONS.length; i++) {
        const p = pos[i], on = i < n;
        if (!on) { pcircle(g, p.x, p.y, 3, '#3A2E6E'); continue; }
        g.globalAlpha = 0.25 + Math.sin(lv.time * 3 + i) * 0.1; pcircle(g, p.x, p.y, 10, p.c); g.globalAlpha = 1;
        if (lv.endLines) { if (i % 3 === 1) { for (let k = 0; k < 7; k++) { const w = 6 - Math.abs(k - 3) * 2; rect(g, p.x - w, p.y - 3 + k, w * 2, 1, p.c); } } else if (i === 0 || i === 10) { rect(g, p.x - 7, p.y - 3, 14, 7, p.c); rect(g, p.x - 5, p.y - 4, 10, 9, p.c); } else rect(g, p.x - 6, p.y - 3, 12, 7, p.c); }
        else pcircle(g, p.x, p.y, 4, p.c);
      }
      if (lv.cloudX != null) { g.globalAlpha = 0.9; pcircle(g, lv.cloudX, 70, 18, '#E8ECF8'); pcircle(g, lv.cloudX + 20, 74, 14, '#E8ECF8'); pcircle(g, lv.cloudX - 18, 76, 12, '#E8ECF8'); g.globalAlpha = 1; }
    },
    onEnter: lv => (function* () {
      lv.pix.hidden = false; lv.lumi.hidden = false; setFlag('lumiPrism');
      lv.forceDark = 0.3;
      yield C.wait(0.6);
      yield C.say('narrador', 'Una semana después. El Festival de las Mil Luces... por fin.');
      AudioSys.sfx('crowd');
      for (let i = 0; i < 11; i++) { lv.endLit = i + 1; AudioSys.sfx('chispa'); lv.forceDark = Math.max(0, 0.3 - i * 0.03); yield C.wait(0.45); }
      lv.endLines = true; AudioSys.sfx('restore');
      yield C.say('narrador', 'Desde el cielo, las líneas de energía entre las islas dibujan algo inesperado: un enorme diagrama de flujo. El archipiélago entero parece un algoritmo vivo.');
      lv.entities.forEach(e => { if (e instanceof NPC) e.cheer = true; });
      yield* talk([
        ['vega', 'Sol, viento, agua, biomasa, calor de la tierra, hidrógeno, baterías. Cada isla aporta algo.', 'feliz'],
        ['teo', 'Y ninguna lo hace sola.', 'feliz'],
        ['prisma', 'Pronóstico: nube a las 21:04. Probabilidad: 70%. He preparado tres opciones.']
      ]);
      // la nube
      lv.cloudX = -40;
      yield C.during(2.5, (dt) => { lv.cloudX += dt * 120; lv.forceDark = 0.35; });
      lv.entities.forEach(e => { if (e instanceof NPC) e.cheer = false; });
      AudioSys.sfx('powerdown');
      yield C.say('narrador', 'Una nube pasa. Las luces bajan un instante. Todos miran hacia arriba.');
      yield C.say('prisma', 'Redistribuyendo: +viento, +hidro, batería −8%. ¿Aprobado?');
      yield C.say('lia', 'Aprobado.', 'feliz');
      AudioSys.sfx('charge');
      yield C.during(1.2, (dt) => { lv.forceDark = Math.max(0, lv.forceDark - dt * 0.4); lv.cloudX += dt * 120; });
      lv.forceDark = 0; lv.cloudX = null;
      AudioSys.sfx('crowd'); AudioSys.sfx('fanfare');
      lv.entities.forEach(e => { if (e instanceof NPC) e.cheer = true; });
      yield C.say('narrador', 'Las luces vuelven. La gente aplaude. No porque nada haya fallado... sino porque el sistema supo responder.');
      lv.stageText = 'LUMINA LOOP 2.0';
      yield* talk([
        ['lia', 'Esto es LUMINA LOOP 2.0.', 'feliz'],
        ['lia', 'No optimiza una sola cosa. Equilibra seis. Y cuando algo cambia... se adapta.', 'decidida']
      ]);
      lv.stageText = 'NO PERFECTO. ADAPTABLE.'; AudioSys.sfx('confirm');
      yield C.wait(1.5);
      if (flag('qdone_s_beta')) yield C.say('beta', 'Estoy al 100%. No quiero alarmar a nadie... ¡pero ESTO ES UNA FIESTA!', 'feliz');
      if (flag('qdone_s_flores')) yield C.say('suri', '¡Mis flores solares se abrieron solas para el festival!', 'feliz');
      yield* talk([
        ['pix', '¿Sabes qué sigue?', 'feliz'],
        ['lia', 'Dormir.', 'n'],
        ['pix', 'Después.', 'pensando'],
        ['lia', 'Comer.', 'n'],
        ['pix', 'Después.', 'pensando'],
        ['lia', 'No.', 'risa']
      ]);
      yield C.title('Los mejores sistemas no eliminan el cambio.', 'Aprenden a trabajar con él.', 5, PAL.sun);
      Scenes.push(new CreditsScene());
    })()
  }, b);
})();

// ---------- CRÉDITOS ----------
class CreditsScene {
  constructor() { this.t = 0; this.opaque = true; this.post = false; AudioSys.playSong('ending'); }
  update(dt) {
    this.t += dt * (Input.down('confirm') || Input.down('jump') || Input.pointer.down ? 4 : 1) * (G.autoDialog ? 30 : 1);
    if (this.post && G.autoDialog) this.pt += 1;
    if (!this.post && this.t > this.total()) { this.post = true; this.pt = 0; AudioSys.stopSong(); }
    if (this.post) { this.pt += dt; if (this.pt > 7.5 || (this.pt > 2 && Input.hit('pause'))) this.finish(); }
    if (!this.post && Input.hit('pause')) { this.post = true; this.pt = 0; }
  }
  finish() {
    if (this.done) return; this.done = true;
    setFlag('ending'); G.save.labUnlocked = true; Save.write();
    Toast.show('AURORA LAB desbloqueado en el menú principal', PAL.teal, 4);
    Game.toTitle();
  }
  total() { return 70; }
  vignette(g, i, x, y) {
    const t = this.t;
    const S = (k) => Spr.cast[k].idle[Math.floor(t * 2) % 4].r;
    switch (i) {
      case 0: g.drawImage(Spr.lia.celebrate[Math.floor(t * 3) % 2].r, x, y); g.drawImage(Spr.pix[Math.floor(t * 16) % 4].r, x + 22, y - 6 + Math.sin(t * 3) * 2); drawLumiShape(g, x + 40, y + 8, Spr.lumi[0], hsl(t * 90, 90, 70), hsl(t * 90 + 40, 90, 60), true, 'happy'); break;
      case 1: g.drawImage(S('teo'), x, y); PROP_DRAW.workbench(g, x + 16, y + 4, { t, cfg: {} }); break;
      case 2: g.drawImage(S('vega'), x, y - 2); PROP_DRAW.screen(g, x + 18, y - 6, { t, cfg: { lines: () => ['¿Qué', 'optimiza?'], color: PAL.lilac } }); break;
      case 3: g.drawImage(S('menta'), x, y); PROP_DRAW.digester(g, x + 16, y - 8, { t, cfg: { on: () => true } }, null); break;
      case 4: g.drawImage(S('vento'), x, y); PROP_DRAW.windmill(g, x + 18, y - 36, { t, cfg: { speed: () => 1 } }, null); break;
      case 5: if (flag('qdone_s_flores')) { g.drawImage(S('suri'), x, y + 4); PROP_DRAW.flowers(g, x + 18, y + 10, { t, cfg: { open: () => true } }); } else { g.drawImage(S('ingeniera'), x, y); PROP_DRAW.solarfield(g, x + 16, y, { t, cfg: { tilt: () => 0.4 } }); } break;
      case 6: g.drawImage(S('capitan'), x, y); PROP_DRAW.boat(g, x + 16, y - 6, { t, cfg: { on: () => true } }); break;
      case 7: g.drawImage(Spr.beta[Math.floor(t * 3) % 4].r, x, y + 4); PROP_DRAW.batterytower(g, x + 20, y - 24, { t, cfg: { soc: () => flag('qdone_s_beta') ? 100 : 60 } }); break;
      case 8: drawEclipseFigure(g, x + 12, y - 8, t, 2); g.drawImage(Spr.pix[Math.floor(t * 16) % 4].r, x + 30, y); break;
      case 9: PROP_DRAW.prismcore(g, x, y - 40, { t, cfg: {} }); break;
    }
  }
  draw(g) {
    vGradient(g, 0, 0, W, H, [[0, '#10163A'], [0.6, '#3A2E6E'], [1, '#B0508C']], false);
    drawAurora(g, this.t);
    if (this.post) return this.drawPost(g);
    const lines = [
      ['LUMINA LOOP', 'title'], ['El Código de los Elementos', 'sub'], ['', ''],
      ['Un videojuego educativo sobre algoritmos', 'txt'], ['y energías alternativas.', 'txt'], ['', ''],
      ['PROTAGONISTAS', 'h'], ['Lía Loop · PÍX · Lumi', 'txt'], ['', 'v0'],
      ['EL EQUIPO', 'h'], ['Teó, constructor y ancla', 'txt'], ['', 'v1'],
      ['LA MENTORA', 'h'], ['Profesora Vega', 'txt'], ['', 'v2'],
      ['EL ARCHIPIÉLAGO', 'h'], ['Abuela Menta · Don Vento · Suri · Ing. Sol', 'txt'], ['Capitán H2O · BETA · Voltia · Roca', 'txt'], ['', 'v3'], ['', 'v4'], ['', 'v5'], ['', 'v6'], ['', 'v7'],
      ['LOS SISTEMAS', 'h'], ['AURORA · Eclipse · Perfect Zero → Prisma', 'txt'], ['', 'v8'], ['', 'v9'],
      ['CÓMO SE HIZO', 'h'], ['HTML5 · Canvas 2D · JavaScript puro', 'txt'], ['Web Audio API · localStorage', 'txt'], ['Todo el arte, la música y los sonidos', 'txt'], ['se generan con código. Sin imágenes ni archivos externos.', 'txt'], ['', ''],
      ['TU PROGRESO', 'h'], [`${REGIONS.filter(r => restored(r.key)).length}/11 islas · ${Object.keys(G.save.collectibles.chispas).length}/${Object.keys(CHISPAS).length} chispas · ${Object.keys(G.save.achievements).length} logros`, 'txt'], [`${G.save.stats.puzzles} retos resueltos · nivel ${G.save.level}`, 'txt'], ['', ''],
      ['No diseñamos sistemas para un mundo perfecto.', 'q'], ['Los diseñamos para un mundo que cambia.', 'q'], ['', ''], ['GRACIAS POR JUGAR', 'title']
    ];
    let y = H + 10 - this.t * 22;
    for (const [txt, kind] of lines) {
      if (kind && kind[0] === 'v') { if (y > -60 && y < H + 40) this.vignette(g, +kind.slice(1), W / 2 - 30, y + 10); y += 50; continue; }
      if (y > -20 && y < H + 10) {
        if (kind === 'title') drawText(g, txt, W / 2, y, PAL.sun, { align: 'center', scale: 2, outline: PAL.ink });
        else if (kind === 'sub') drawText(g, txt, W / 2, y, PAL.teal, { align: 'center' });
        else if (kind === 'h') drawText(g, txt, W / 2, y, PAL.pink, { align: 'center' });
        else if (kind === 'q') drawText(g, txt, W / 2, y, PAL.cream, { align: 'center', outline: PAL.ink });
        else drawText(g, txt, W / 2, y, PAL.cream, { align: 'center' });
      }
      y += kind === 'title' ? 26 : 14;
    }
    if (y < -20 && !this.post) { this.post = true; this.pt = 0; }
    drawText(g, 'mantén ' + bindName('confirm') + ' para acelerar', W - 6, H - 10, 'rgba(255,243,215,0.5)', { align: 'right' });
  }
  drawPost(g) {
    const t = this.pt;
    rect(g, 0, 0, W, H, '#0B1020');
    PROP_DRAW.screen(g, 250, 130, { t, cfg: { lines: () => t > 1 ? ['UPDATE', 'AVAILABLE', ''] : ['', '', ''], color: PAL.lime } });
    g.drawImage(Spr.pix[Math.floor(t * 16) % 4].l, 226, 130 + Math.sin(t * 3) * 2);
    if (t > 2) drawText(g, 'PÍX: Lía...', 150, 110, PAL.teal);
    if (t > 3.5) drawText(g, '¡NO!', 60 + Math.sin(t * 20) * 2, 180, PAL.coral, { scale: 3, outline: PAL.ink });
    if (t > 5) { g.globalAlpha = clamp((t - 5) / 2, 0, 1); rect(g, 0, 0, W, H, '#000000'); g.globalAlpha = 1; }
  }
}
