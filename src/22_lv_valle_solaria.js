// =====================================================================
//  REGIÓN 01: VALLE SECUENCIA   ·   REGIÓN 02: SOLARIA
// =====================================================================

// ---------- Mundo pequeño: carros de sacos (variable perdida) ----------
function W_sacks(o) {
  return {
    init() { return { carts: 0 }; },
    sensors: {},
    act(name, arg, st) { if (name === 'llega_carro') { st.carts++; return { ok: true, dur: 0.4 }; } return { ok: false, msg: '?' }; },
    check(st, env) {
      const v = env.vars.sacos;
      if (v === undefined) return { ok: false, msg: 'La variable "sacos" nunca recibió un valor.' };
      if (v !== o.expect) return { ok: false, msg: `sacos vale ${v}, pero en los carros hay ${o.expect}.` };
      return { ok: true, msg: `sacos = ${v}. ¡Cuenta correcta! Una variable debe empezar con un valor conocido.` };
    },
    draw(g, x, y, w, h, st, t, scene) {
      rect(g, x, y, w, h, '#7ACB7A'); rect(g, x, y + h - 30, w, 30, '#A0643C');
      for (let c = 0; c < 3; c++) {
        const cx = x + 14 + c * 56, cy = y + h - 60;
        rect(g, cx, cy + 14, 44, 12, '#8B5A3C'); pcircle(g, cx + 8, cy + 28, 5, '#5E3A26'); pcircle(g, cx + 36, cy + 28, 5, '#5E3A26');
        for (let k = 0; k < 4; k++) { const sx = cx + 3 + (k % 2) * 20, sy = cy + (k > 1 ? -2 : 6); rect(g, sx, sy, 16, 10, '#E8D8A8'); rect(g, sx + 6, sy - 2, 4, 3, '#C8B888'); }
        if (st.carts > c) drawText(g, '✓', cx + 22, cy - 12, PAL.lime, { align: 'center', outline: PAL.ink });
      }
      const v = scene && scene.env ? scene.env.vars.sacos : undefined;
      rect(g, x + 4, y + 4, 90, 14, '#10162B'); drawText(g, 'sacos = ' + (v === undefined ? '???' : fmtVal(v)), x + 8, y + 7, v === undefined ? PAL.coral : PAL.lime);
    }
  };
}

// ---------- Mundo flores solares (Suri) ----------
function W_flowers(o) {
  const hours = [6, 8, 10, 12, 14, 16, 18, 20], wx = o.weather;
  const irr = (i) => Math.round(1000 * Math.max(0, Math.sin((hours[i] - 6) / 14 * Math.PI)) * (wx[i] === 'sol' ? 1 : wx[i] === 'nube' ? 0.35 : 0.1));
  return {
    init() { return { i: 0, open: false, log: [], dec: null }; },
    sensors: { radiacion: st => irr(Math.min(st.i, hours.length - 1)), hora: st => hours[Math.min(st.i, hours.length - 1)] },
    onTick(st, tick) { st.i = tick; st.dec = null; },
    act(name, arg, st) { if (name === 'abrir_flores') { st.dec = true; return { ok: true, dur: 0.3 }; } if (name === 'cerrar_flores') { st.dec = false; return { ok: true, dur: 0.3 }; } return { ok: false, msg: '?' }; },
    afterTick(st, tick) {
      if (st.dec === null) return { fail: `A las ${hours[tick]}:00 las flores no recibieron ninguna orden.` };
      st.open = st.dec;
      const r = irr(tick), want = r > 300;
      st.log.push({ ok: st.dec === want });
      if (st.dec && wx[tick] === 'lluvia') return { fail: `A las ${hours[tick]}:00 llovía y las flores estaban abiertas: se mojaron los paneles. Con lluvia la radiación es muy baja (${r} W/m²).` };
      if (st.dec && r < 100) return { fail: `A las ${hours[tick]}:00 casi no hay sol (${r} W/m²) y las flores siguen abiertas.` };
      if (!st.dec && r > 700) return { fail: `A las ${hours[tick]}:00 hay mucho sol (${r} W/m²) y las flores están cerradas: no cargan nada.` };
      return null;
    },
    check() { return { ok: true, msg: '¡Las flores se abren con el sol y se guardan cuando no lo hay! Suri está feliz.' }; },
    draw(g, x, y, w, h, st, t) {
      const i = Math.min(st.i, hours.length - 1), hr = hours[i], k = Math.max(0, Math.sin((hr - 6) / 14 * Math.PI));
      vGradient(g, x, y, w, h * 0.65, [[0, mix('#1B2550', '#59C7FF', k)], [1, mix('#3A2E6E', '#FFE08A', k)]], false);
      if (wx[i] !== 'sol') for (let c = 0; c < 3; c++) { pcircle(g, x + 30 + c * 50, y + 20, 9, wx[i] === 'lluvia' ? '#8C96C0' : '#FFFFFF'); pcircle(g, x + 40 + c * 50, y + 22, 7, wx[i] === 'lluvia' ? '#8C96C0' : '#FFFFFF'); }
      if (wx[i] === 'lluvia') for (let r = 0; r < 18; r++) rect(g, x + (r * 31 + t * 80) % w, y + 30 + (r * 17 + t * 110) % 50, 1, 3, '#9FE8FF');
      else pcircle(g, x + 20 + (hr - 6) * 10, y + h * 0.55 - k * 50, 6, PAL.sun);
      rect(g, x, y + h * 0.65, w, h * 0.35, '#3FA85A');
      PROP_DRAW.flowers(g, x + 60, y + h * 0.65 - 18, { t, cfg: { open: () => st.open } });
      drawText(g, hr + ':00', x + w - 4, y + 4, PAL.white, { align: 'right', outline: PAL.ink });
    }
  };
}

// ---------- Laboratorio de variables: inclinar el panel ----------
// (el Panel de pruebas de Solaria es un simulador: ver VariableLabScene en 16_sims.js)

// ---------- VALLE: configuraciones de puzzles ----------
const CFG_VALLE_RUTA = {
  kind: 'code', main: true, title: 'Rutas de mantenimiento', tags: ['SECUENCIA', 'DEPURACIÓN'], concepts: ['sequence', 'debugging'], codex: 'depuracion', music: 'valle',
  palette: ['act:avanzar', 'act:girar_izq', 'act:girar_der', 'act:regar'], actions: GRID_ACTS,
  world: W_grid({ map: ['#########', '#S..p...#', '#.##.##.#', '#p.....p#', '#########'], bot: 'robot', floor: '#A0643C', wall: '#3FA85A', bg: '#66D66A', need: { plants: true }, okMsg: '¡Las tres plantas regadas y ninguna dos veces!' }),
  stages: [
    {
      mode: 'guided', label: 'DEPURA EL BUG', text: 'Un BUGGLIN intercambió dos instrucciones. Ejecuta, mira la TRAZA y encuentra dónde falla. Toca una línea y muévela con ▲▼.',
      world: W_grid({ map: ['########', '#S.p.p.#', '#.....p#', '########'], bot: 'robot', floor: '#A0643C', wall: '#3FA85A', bg: '#66D66A', need: { plants: true }, okMsg: '¡Bug corregido! El orden lo era todo.' }),
      program: [A('avanzar', 2), A('regar'), A('avanzar', 2), A('regar'), A('girar_der'), A('avanzar', 1), A('avanzar', 1), A('regar')]
    },
    { mode: 'solo', label: 'LO HACES TÚ', text: 'Nuevo huerto: las instrucciones ya están en orden. Ajusta cuántas casillas avanza cada «avanzar» (− +) para regar las 3 plantas.', program: [A('avanzar', 1), A('regar'), A('avanzar', 1), A('girar_der'), A('avanzar', 1), A('regar'), A('girar_der'), A('avanzar', 1), A('regar')] }
  ],
  hints: ['Pulsa PASO para ejecutar línea a línea. ¿En qué paso el robot se desvía?', { text: 'En el huerto nuevo, la primera planta está en la misma fila. Después hay que bajar por la derecha.', highlight: 'palette:act:regar' }, { text: 'Te dejo la primera parte:', partial: [A('avanzar', 3), A('regar'), A('avanzar', 3), A('girar_der'), A('avanzar', 2), A('regar')] }],
  deep: 'Mira el diagrama: cada caja depende de dónde dejó al robot la anterior. El error no está en una instrucción sino en su POSICIÓN.',
  intro: 'Los robots de riego hacen las cosas fuera de orden. Arreglemos su ruta.', xp: 50
};
const CFG_VALLE_SACOS = {
  kind: 'code', title: 'Variable perdida', tags: ['VARIABLES', 'DEPURACIÓN'], concepts: ['variables', 'debugging'], codex: 'variable',
  palette: ['set:sacos', 'add:sacos', 'act:llega_carro'], actions: { llega_carro: { label: 'llega_carro' } },
  exprOptions: { set: [0, 4, 8, 12], add: [1, 2, 4, 8] }, varNames: ['sacos'],
  world: W_sacks({ expect: 12 }),
  start: [A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, { op: 'set', var: 'sacos', expr: 0 }],
  intro: 'El contador de sacos de Pepa dice "???". Ejecuta, lee el error y ordena las líneas (toca una línea y usa ▲▼).',
  hints: ['¿Qué valor tiene "sacos" antes de la primera suma?', { text: 'Un acumulador necesita un valor inicial ANTES de sumar: sube «sacos ← 0» hasta la línea 1.' }, { text: 'Añadí la inicialización:', partial: [{ op: 'set', var: 'sacos', expr: 0 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }] }]
};
const CFG_VALLE_MOLINO = {
  kind: 'seq', title: 'Molino dormido', tags: ['SECUENCIA', 'EÓLICA'], concepts: ['sequence', 'wind'], codex: 'eolica', label: 'MOLINO',
  intro: 'El molino de Don Maíz está frenado. ¿En qué orden se arranca con seguridad?',
  cards: [
    { id: 'ori', label: 'orientar al viento', icon: 'wind', color: PAL.aqua, desc: 'Girar la cabeza del molino hacia donde sopla el viento.' },
    { id: 'fre', label: 'soltar el freno', icon: 'gear', color: PAL.orange, desc: 'Libera las aspas para que giren.' },
    { id: 'med', label: 'medir el giro', icon: 'eye', color: PAL.teal, desc: '¿Gira a velocidad estable?' },
    { id: 'gen', label: 'conectar el generador', icon: 'bolt', color: PAL.sun, desc: 'Empieza a producir electricidad.' },
    { id: 'eng', label: 'engrasar mientras gira', icon: 'drop', color: PAL.coral, desc: 'Mantenimiento... ¿en marcha?' }
  ],
  slots: 4, answer: ['ori', 'fre', 'med', 'gen'],
  why: (i, id) => ({ eng: '¡Nunca se hace mantenimiento con las aspas girando! Es peligroso.', gen: 'Si conectas el generador antes de que gire estable, el molino se "ahoga" y se detiene.', fre: i === 0 ? 'Si sueltas el freno mirando al lado equivocado, las aspas reciben el viento de costado y se dañan.' : 'El freno ya estaba suelto.', med: 'Aún no hay nada que medir.', ori: 'Orientar va primero.' }[id]),
  visual: visualEnergyChain([CHAIN_ICONS.turbine, CHAIN_ICONS.turbine, CHAIN_ICONS.turbine, CHAIN_ICONS.bolt]),
  hints: ['Antes de dejar que las aspas giren, ¿hacia dónde deberían mirar?', 'Una tarjeta sobra: es peligrosa.', { text: 'Primero orientar.', apply: sc => { sc.slots[0] = 'ori'; sc.pool = sc.pool.filter(p => p !== 'ori'); } }],
  okMsg: '¡El molino gira y produce!'
};

// ---------- VALLE: nivel ----------
PROP_DRAW.podabot = (g, x, y, e) => {
  const b = Math.floor(e.t * 4) % 2;
  pcircle(g, x + 8, y + 10 + b, 6, '#66D66A'); rect(g, x + 4, y + 8 + b, 8, 3, '#10162B'); px(g, x + 6, y + 9 + b, PAL.sun); px(g, x + 10, y + 9 + b, PAL.sun);
  rect(g, x + 3, y + 16, 3, 2, '#3A4068'); rect(g, x + 10, y + 16, 3, 2, '#3A4068');
  rect(g, x + 13, y + 6 + b, 4, 3, '#59C7FF'); if (b) px(g, x + 17, y + 10, '#9FE8FF');
};
PROP_SIZES.podabot = [18, 18]; PROP_LIGHT.podabot = () => null;
(function () {
  const b = new MapB(150, 18);
  b.ground(0, 34, 14).ground(10, 16, 13);
  b.fill(35, 15, 40, 16, '~').ground(35, 40, 17).plat(36, 39, 12);
  b.ground(41, 73, 14);
  b.fill(52, 0, 52, 13, 'D');
  b.plat(58, 60, 11).plat(62, 64, 9).fill(63, 5, 66, 5, '?').ground(67, 73, 12);
  b.ground(74, 149, 14);
  b.plat(88, 90, 11).plat(92, 93, 9).plat(110, 112, 11);
  b.start(3, 13);
  b.seeds(11, 15, 12, 2).seeds(36, 39, 11, 1).seeds(58, 64, 8, 3).seeds(88, 93, 8, 2).seeds(110, 112, 10, 1);
  [6, 20, 30, 44, 56, 78, 96, 118, 134].forEach(x => b.e('L', x, 13));
  b.e('C', 42, 13).e('C', 75, 13).e('C', 115, 13);
  b.e('m', 22, 13, { id: 'molinoMaiz', look: 'windmill', speed: () => flag('q_molino') ? 1.2 : 0, roof: PAL.coral });
  b.e('m', 5, 13, { look: 'house', color: '#B07A4A' }).e('m', 124, 13, { look: 'house', color: '#D8A06A', roof: '#FF7FCF' }).e('m', 138, 13, { look: 'house', color: '#B07A4A', roof: '#66D66A' });
  b.e('m', 130, 13, { id: 'molinoCentral', look: 'windmill', speed: () => flag('restored_valle') ? 1 : 0.05, roof: PAL.pink, sail: PAL.sun });
  b.e('m', 28, 13, { look: 'podabot', text: [['sistema', 'PODABOT-3: REGANDO TIERRA SIN SEMILLA. EFICIENCIA: 100%.'], ['pix', 'Técnicamente eficiente. Prácticamente inútil.', 'risa']] });
  b.e('m', 84, 13, { look: 'podabot', text: [['sistema', 'PODABOT-7: OPTIMIZAR RUTA → MINIMIZAR PASOS → OMITIR "PLANTAR".'], ['teo', 'Alguien les dijo que menos pasos siempre es mejor.', 'pensando'], ['lia', 'Menos pasos no sirve si te saltas el importante.', 'decidida']] });
  b.e('m', 100, 13, { look: 'flowers', open: () => flag('restored_valle') });
  b.e('P', 47, 13, { id: 'placa1' });
  b.e('P', 70, 11, { id: 'placa2' });
  b.e('M', 68, 7, { id: 'elev', len: 2, range: 4, axis: 'y', speed: 1.2, active: lv => lv.get('placa2') && lv.get('placa2').pressed, lens: 'se mueve SI placa2 = VERDADERO' });
  b.e('*', 65, 3, { id: 'c_valle1', hidden: true }).e('*', 69, 1, { id: 'c_valle2' });
  b.e('E', 44, 13, { type: 'bugglin' }).e('E', 60, 13, { type: 'bugglin', speed: 30 }).e('E', 96, 13, { type: 'bugglin' }).e('E', 140, 13, { type: 'bugglin' });
  b.e('a', 18, 13).e('a', 102, 13).e('a', 145, 13);
  b.e('N', 19, 13, {
    id: 'maiz', cast: 'granjero', quest: 's_molino', talk: lv => (function* () {
      if (questState('s_molino') === 'done') { yield C.say('granjero', '¡Mira cómo gira! Ahora muele harina Y electricidad.', 'feliz'); return; }
      if (questState('s_molino') === 'none') { yield* talk([['granjero', 'Mi molino se durmió con el apagón. Lo intenté arrancar: conecté todo a la vez.', 'triste'], ['granjero', 'Hizo "¡clonc!" y se paró. ¿Me ayudas? El panel está en la base.', 'n']]); setQuest('s_molino', 'active'); }
      const ok = yield* runPuzzle(CFG_VALLE_MOLINO);
      if (ok) { setFlag('q_molino'); setQuest('s_molino', 'done'); AudioSys.sfx('turbine'); yield C.say('granjero', '¡Orientar, soltar, medir, conectar! Lo escribiré en la puerta del granero.', 'feliz'); }
    })()
  });
  b.e('N', 8, 13, { id: 'vecina', cast: 'lina', barks: ['¡Hoy toca plantar, regar, cosechar! O cosechar, plantar, regar. Algo así.', '¿Alguien ha visto mi lista de tareas? Estaba en orden alfabético... o no.'], talk: [['lina', 'Bienvenidas al Valle Secuencia. Somos gente alegre... y un poco desordenada.', 'feliz'], ['lina', 'Desde el apagón los robots de riego hacen las cosas al revés. Riegan antes de plantar, cosechan antes de regar...', 'triste'], ['lia', 'Un buen plan no sirve si el orden está mal.', 'pensando'], ['pix', 'Lo apunto para mi autobiografía.', 'feliz']] });
  b.e('N', 79, 13, {
    id: 'pepa', cast: 'nina', quest: 's_variable', talk: lv => (function* () {
      if (questState('s_variable') === 'done') { yield C.say('nina', 'sacos ← 0 primero. ¡Ya nunca se me olvida!', 'feliz'); return; }
      if (questState('s_variable') === 'none') { yield* talk([['nina', 'Mi contador de sacos dice "???". ¡Y había traído tres carros!', 'triste'], ['lia', 'Déjame ver ese programa.', 'n']]); setQuest('s_variable', 'active'); }
      const ok = yield* runPuzzle(CFG_VALLE_SACOS);
      if (ok) { setFlag('q_variable'); setQuest('s_variable', 'done'); yield* talk([['nina', '¡Doce! ¡Ahora sí!', 'feliz'], ['pix', 'Eso que guardaba el número se llama VARIABLE. La volverás a ver en Solaria... con más brillo.', 'feliz']]); }
    })()
  });
  b.e('N', 86, 13, { id: 'teo', cast: 'teo', talk: [['teo', 'La consola de rutas está aquí. Los robots riegan en el orden equivocado.', 'n'], ['teo', 'Primero medimos: ejecuta el programa tal cual y mira la traza.', 'pensando']] });
  b.e('T', 90, 13, {
    id: 'rutas', look: 'console', color: PAL.lime, verb: 'Consola de riego', doneFlag: 'restored_valle', enabled: () => hasAbility('spark'),
    lens: ['programa_riego: {r}2 líneas intercambiadas{/}', 'autor: {v}BUGGLIN{/}'],
    run: lv => (function* () {
      if (flag('restored_valle')) { yield C.say('pix', 'Los robots riegan en orden. Las plantas lo agradecen. Creo. No hablo planta.', 'feliz'); return; }
      yield* runPuzzle(CFG_VALLE_RUTA, function* () {
        yield* restoreRegion(lv, 'valle', 'Un buen plan no sirve si el orden está mal.');
        yield* talk([
          ['lina', '¡Riegan después de plantar! ¡Qué concepto tan revolucionario!', 'risa'],
          ['teo', 'Conocer los pasos no basta. Hay que ordenarlos bien.', 'n'],
          ['lia', 'Como con los apagones. Tenemos pistas... pero quizá las estamos ordenando mal.', 'pensando'],
          ['pix', 'Siguiente parada: Solaria. Dicen que allí el sol brilla tanto que hasta las sombras usan gafas.', 'feliz']
        ]);
        setQuest('m_solaria', 'active');
      });
    })()
  });
  b.e('T', 31, 13, {
    id: 'caja', look: 'sign', verb: 'Caja de herramientas', doneFlag: 'valle_spark',
    run: lv => (function* () {
      if (hasAbility('spark')) { yield C.say('pix', 'La caja de herramientas de Vega. Vacía. Bueno, con una pegatina de "sé paciente".', 'n'); return; }
      yield* talk([
        ['lia', '¡La caja de herramientas de Vega! La dejó aquí para el taller comunitario.', 'sorpresa'],
        ['lia', 'Un emisor de pulsos... Si lo conecto a mis gafas y Lumi le presta un poco de luz...', 'pensando'],
        ['lumi', '✦ !', 'n'],
        ['lia', '...¡puedo proyectar un ECO que repite una secuencia de pasos!', 'feliz']
      ]);
      setFlag('valle_spark');
      yield* grant('spark');
      yield* talk([['pix', 'El eco hará tus pasos EN ORDEN. Perfecto para placas de presión: el eco se queda encima y tú pasas.', 'n'], ['pix', 'Pulsa ' + bindName('ability') + ' para programarlo. La compuerta de ahí delante se abre SOLO mientras alguien pisa la placa.', 'n']]);
    })()
  });
  level('valle', {
    theme: 'valle', region: 'valle', title: 'Valle Secuencia', subtitle: 'Secuencias y depuración', basePower: 0.25, restoredFlag: 'restored_valle', music: 'valle',
    dyn: { D: { solid: lv => !(lv.get('placa1') && lv.get('placa1').pressed), style: 'gate' } },
    quips: ['Aquí todo el mundo es feliz. Desordenado, pero feliz.', 'Si saltas encima de un BUGGLIN, lo depuras. Es terapia para bichos.', 'El eco de STEP SPARK hace EXACTAMENTE lo que le dices. Como yo. Casi.'],
    objective: lv => !hasAbility('spark') ? 'Encuentra la caja de herramientas de Vega (→)' : !flag('restored_valle') ? 'Cruza la compuerta con STEP SPARK y repara la ruta de riego' : 'Vuelve al mapa (→ salida)',
    hint: lv => !hasAbility('spark') ? 'La caja de herramientas es un cartel de madera antes del arroyo.' : !flag('restored_valle') ? 'Usa ' + bindName('ability') + ': programa el eco con → → → ⏸ para que camine hasta la placa y se quede. Luego corre a la compuerta.' : 'La salida está al final, a la derecha.',
    pointAt: lv => !hasAbility('spark') ? 'caja' : 'rutas',
    onEnter: lv => (function* () {
      if (flag('valle_intro')) return;
      setFlag('valle_intro'); unlockCodex('i_valle'); setQuest('m_valle', 'active');
      yield* talk([['pix', '¡El Valle Secuencia! Praderas, puentes, molinitos... y un robot regando una piedra.', 'sorpresa'], ['teo', 'Voy delante a buscar la consola de riego.', 'n'], ['lia', 'Y yo busco la caja de herramientas de Vega. Siempre deja una en cada taller.', 'decidida']]);
      const t = lv.get('teo'); if (t) { }
    })()
  }, b);
  LEVELS.valle.ents.push({ t: 'X', x: 147, y: 13, cfg: { cond: () => flag('restored_valle'), label: 'MAPA' } });
})();

// ---------- SOLARIA: configuraciones ----------
const SOL_WEATHER = ['sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'nube', 'sol', 'sol', 'lluvia', 'sol', 'sol', 'sol', 'sol', 'sol'];
const SOL_DEMAND = [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 5, 6, 5, 3];
const CFG_SOL_FLOW = {
  kind: 'flow', main: true, title: 'El controlador solar', tags: ['SI / SINO', 'VARIABLES', 'SOLAR'], concepts: ['conditions', 'variables', 'solar'], codex: 'condicional', music: 'solaria',
  world: W_solar({ weather: SOL_WEATHER, demand: SOL_DEMAND, panels: 6, soc0: 60, K: 3, okMsg: '¡Ni un solo apagón en todo el día!' }),
  hours: 16, threshold0: 300,
  // el diagrama viene armado, con las acciones cambiadas y un umbral demasiado bajo
  start: [{ id: 1, type: 'start', c: 1, r: 0, next: 2 }, { id: 2, type: 'read', c: 1, r: 1, next: 3 }, { id: 3, type: 'dec', c: 1, r: 2, yes: 4, no: 5 }, { id: 4, type: 'use', c: 0, r: 3, next: 6 }, { id: 5, type: 'charge', c: 2, r: 3, next: 6 }, { id: 6, type: 'end', c: 1, r: 5 }],
  actTypes: ['charge', 'use'],
  intro: 'Cada hora: SI radiación > umbral → cargar_bateria SINO → usar_bateria. El diagrama ya está, pero las acciones están cambiadas y el umbral es muy bajo: tócalas y ajusta el umbral.',
  hints: ['Con mucho sol (SÍ), la ciudad debe usar el sol y guardar el sobrante: ¿qué acción va en la rama SÍ?', { text: 'Si el umbral es muy bajo, "cargas" cuando el sol no alcanza para la ciudad. Si es muy alto, la batería nunca se carga. Prueba entre 700 y 900.' }, { text: 'Te coloco las acciones: SÍ → cargar_bateria, NO → usar_bateria. Solo falta el umbral.', apply: sc => { sc.nodes.forEach(n => { if (n.id === 4) n.type = 'charge'; if (n.id === 5) n.type = 'use'; }); } }],
  xp: 60
};
const CFG_SOL_FLORES = {
  kind: 'code', title: 'Flores solares', tags: ['SI / SINO', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'condicional', ticks: 8, tickLabel: t => ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'][Math.min(7, t)],
  palette: ['ifelse', 'act:abrir_flores', 'act:cerrar_flores'], actions: { abrir_flores: { label: 'abrir_flores' }, cerrar_flores: { label: 'cerrar_flores' } },
  sensors: ['radiacion', 'hora'], condRight: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaults: { cond: { l: 'radiacion', op: '>', r: 100 } },
  world: W_flowers({ weather: ['sol', 'sol', 'sol', 'nube', 'sol', 'lluvia', 'sol', 'sol'] }),
  start: [{ op: 'if', cond: { l: 'radiacion', op: '>', r: 100 }, body: [A('cerrar_flores')], else: [A('abrir_flores')] }],
  intro: 'Las flores-panel de Suri deben abrirse con sol fuerte y cerrarse con poca luz (¡y con lluvia!). La regla ya está, pero al revés y con un umbral muy bajo: arréglala.',
  hints: ['¿Qué variable dice cuánto sol hay?', { text: 'SI radiacion > ... ENTONCES abrir_flores SINO cerrar_flores.', highlight: 'palette:ifelse' }, { text: 'Estructura lista; ajusta el número.', partial: [{ op: 'if', cond: { l: 'radiacion', op: '>', r: 100 }, body: [A('abrir_flores')], else: [A('cerrar_flores')] }] }]
};
const CFG_SOL_SENSOR = {
  kind: 'code', title: 'Sensor loco', tags: ['DEPURACIÓN', 'SI', 'SOLAR'], concepts: ['debugging', 'conditions', 'solar'], codex: 'operadores', ticks: 16, tickLabel: t => (6 + Math.min(15, t)) + ':00',
  palette: ['ifelse', 'act:cargar_bateria', 'act:usar_bateria'], actions: { cargar_bateria: { label: 'cargar_bateria' }, usar_bateria: { label: 'usar_bateria' } },
  sensors: ['radiacion', 'bateria', 'hora'], condRight: [300, 500, 600, 700, 800, 900, 1000],
  world: W_solar({ weather: SOL_WEATHER, demand: SOL_DEMAND, panels: 6, soc0: 60, K: 3, okMsg: 'Operador corregido: el edificio vuelve a funcionar.' }),
  start: [{ op: 'if', cond: { l: 'radiacion', op: '<', r: 800 }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }],
  intro: 'El edificio de Ing. Sol usa el MISMO controlador que hiciste en diagrama... pero escrito en pseudocódigo. Y algo está al revés.',
  hints: ['Ejecuta paso a paso. ¿Qué hace el programa cuando hay MUCHO sol?', { text: 'Mira el operador de la condición: < significa "menor que".' }, { text: 'Cambia < por > (toca el símbolo naranja).' }],
  deep: 'Condición invertida: el programa hace justo lo contrario de lo que queremos. Así trabaja SHADOW IF.'
};
const CFG_SOL_MATRIZ = {
  kind: 'code', title: 'Matriz de paneles', tags: ['VARIABLES', 'ACUMULADOR', 'SOLAR'], concepts: ['variables', 'solar'], codex: 'acumulador',
  palette: ['set:total', 'add:total'], exprOptions: { set: [0, 10], add: ['fila1', 'fila2', 'fila3', 1] },
  world: W_accum({ data: [12, 18, 9], var: 'total', unit: 'kW por fila', color: PAL.sun, check: (st, env) => env.vars.total === 39 ? { ok: true, msg: 'total = 39 kW. ¡La matriz está bien sumada!' } : { ok: false, msg: `total = ${env.vars.total}. Debe ser la suma de las tres filas.` } }),
  vars: { fila1: 12, fila2: 18, fila3: 9 },
  start: [{ op: 'add', var: 'total', expr: 'fila1' }, { op: 'add', var: 'total', expr: 'fila1' }, { op: 'add', var: 'total', expr: 'fila1' }, { op: 'set', var: 'total', expr: 10 }],
  intro: 'Suma la potencia de las tres filas en "total": debe empezar en 0 (primera línea) y sumar fila1, fila2 y fila3. Ordena las líneas y toca los valores para cambiarlos.',
  hints: ['¿Con qué valor debe empezar "total"?', 'total ← 0, luego total ← total + fila1...', { text: 'Te dejo el inicio.', partial: [{ op: 'set', var: 'total', expr: 0 }, { op: 'add', var: 'total', expr: 'fila1' }] }]
};
const CFG_SOL_NUBE = {
  kind: 'quiz', title: 'Nube inesperada', tags: ['PREDICCIÓN', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'prediccion', label: 'PREDICE',
  question: 'Son las 15:00. Pasa una nube: radiación = 350. La batería está al 20%. Tu controlador dice:',
  code: ['SI radiacion > 800 ENTONCES', '    cargar_bateria', 'SINO', '    usar_bateria', 'FIN SI'],
  options: [
    { text: 'Carga la batería porque es de día.', why: 'La condición no pregunta la hora: pregunta la radiación. 350 no es mayor que 800.' },
    { text: 'Usa la batería: 350 no es mayor que 800.' },
    { text: 'No hace nada hasta que pase la nube.', why: 'Un SI/SINO siempre elige una de las dos ramas.' },
    { text: 'Da error porque la batería está baja.', why: 'La condición no mira la batería. Esa podría ser una mejora... pero hoy no.' }
  ], answer: 1, explain: '¡Exacto! La condición es FALSA, así que se ejecuta la rama SINO. Predicción: con la batería al 20% conviene vigilarla... quizá con un segundo SI.'
};

// ---------- SOLARIA: nivel ----------
(function () {
  const b = new MapB(162, 18);
  b.ground(0, 40, 14).ground(20, 24, 13);
  b.ground(41, 60, 14).plat(44, 46, 11).plat(50, 52, 9);
  b.ground(61, 92, 14);
  b.ground(93, 132, 14);
  b.fill(98, 10, 98, 13, 'Z').fill(104, 10, 104, 13, 'Y').fill(110, 10, 110, 13, 'Z').fill(116, 10, 116, 13, 'Y').fill(122, 10, 122, 13, 'Z');
  b.fill(100, 7, 102, 7, '?').plat(107, 108, 10).plat(119, 120, 10);
  b.fill(133, 15, 136, 16, '~').ground(133, 136, 17).plat(134, 135, 12);
  b.ground(137, 161, 14);
  b.start(3, 13);
  b.seeds(20, 24, 12, 2).seeds(44, 52, 8, 2).seeds(100, 102, 6, 1).seeds(140, 150, 13, 3);
  [7, 17, 34, 48, 63, 80, 95, 113, 128, 142, 156].forEach(x => b.e('L', x, 13));
  b.e('C', 42, 13).e('C', 62, 13).e('C', 94, 13).e('C', 138, 13);
  b.e('m', 12, 13, { look: 'house', color: '#FFE6B0', roof: '#30E1C5' }).e('m', 150, 13, { look: 'stall', color: PAL.sun, goods: [PAL.orange, PAL.sun, PAL.lime] }).e('m', 144, 13, { look: 'stall', color: PAL.teal });
  b.e('m', 30, 13, { look: 'mirror' }).e('m', 36, 13, { look: 'mirror' }).e('m', 126, 13, { look: 'mirror' });
  b.e('m', 70, 13, { id: 'campoA', look: 'solarfield', tilt: () => 0.4, off: () => flag('sol_disc'), dust: lv => 0 });
  b.e('m', 82, 13, { id: 'campoB', look: 'solarfield', tilt: () => 0.4, dust: lv => lv.dustB || 0 });
  b.e('m', 16, 13, { look: 'flowers', open: () => questState('s_flores') === 'done' || flag('restored_solaria') });
  b.e('*', 101, 5, { id: 'c_solaria1', hidden: true }).e('*', 51, 7, { id: 'c_solaria2' });
  b.e('E', 55, 13, { type: 'shadowif', amp: 16 }).e('E', 146, 11, { type: 'shadowif', amp: 12 });
  b.e('a', 26, 13).e('a', 88, 13).e('a', 158, 13);
  b.e('N', 18, 13, {
    id: 'suri', cast: 'suri', quest: 's_flores', questNeeds: 'sol_flow', talk: lv => (function* () {
      if (!flag('sol_flow')) { yield* talk([['suri', '¡Hola! Soy Suri. Construyo paneles pequeños. Este sombrero también es un panel.', 'feliz'], ['suri', 'Mis flores solares no saben cuándo abrirse. Cuando arregles el controlador, ¿me ayudas?', 'n']]); return; }
      if (questState('s_flores') === 'done') { yield C.say('suri', '¡Se abren solitas! SI hay sol... ¡flor abierta! ¡Es magia!', 'feliz'); yield C.say('lia', 'No es magia: son variables.', 'risa'); return; }
      setQuest('s_flores', 'active');
      const ok = yield* runPuzzle(CFG_SOL_FLORES);
      if (ok) { setQuest('s_flores', 'done'); addMastery('conditions', 4); yield C.say('suri', '¡Gracias, Lía! Cuando sea mayor voy a programar ciudades enteras.', 'feliz'); }
    })()
  });
  b.e('N', 26, 13, { id: 'sol', cast: 'ingeniera', talk: lv => talk(flag('restored_solaria') ? [['ingeniera', 'Solaria vuelve a brillar. Y con un controlador que decide mejor que el anterior.', 'feliz']] : [['ingeniera', 'Soy la Ing. Sol. El controlador solar de la ciudad dejó de decidir: carga cuando no debe, descarga cuando no toca.', 'pensando'], ['ingeniera', 'Antes de tocar nada, prueba el panel de pruebas: ahí verás qué cambia cuando mueves el panel. Sigue las misiones de la derecha.', 'n']]) });
  b.e('T', 23, 12, {
    id: 'lab', look: 'console', color: PAL.sun, verb: 'Panel de pruebas', doneFlag: 'sol_var',
    run: lv => (function* () {
      const r = yield C.scene(done => new VariableLabScene(done));
      if (r && r.success && !flag('sol_var')) {
        setFlag('sol_var');
        yield* talk([['pix', 'Eso que cambiaba mientras movías la palanca... tiene nombre.', 'pensando'], ['lia', 'Un valor con nombre que puede cambiar. Una VARIABLE.', 'feliz']]);
        yield* teach('variable');
        yield* talk([['ingeniera', 'Ahora el controlador. Está en el edificio de mando, pasando la plaza.', 'n']]);
      }
    })()
  });
  b.e('N', 56, 13, { id: 'teo', cast: 'teo', talk: [['teo', 'El controlador decide cada hora: cargar la batería o usarla. Hoy habrá nubes y lluvia.', 'n'], ['teo', 'Tú haz el diagrama. Yo vigilo que nadie toque los cables. Especialmente PÍX.', 'risa'], ['pix', 'Solo toqué UNO.', 'culpa']] });
  b.e('T', 58, 13, {
    id: 'mando', look: 'bigconsole', color: PAL.sun, verb: 'Controlador solar', doneFlag: 'sol_flow', enabled: () => flag('sol_var'),
    lens: ['controlador.umbral = {r}???{/}', 'decisión = SI radiacion > umbral'],
    run: lv => (function* () {
      if (flag('sol_flow')) { yield C.say('pix', 'El diagrama sigue funcionando. Hora a hora. Como un reloj. Un reloj solar.', 'feliz'); return; }
      yield* runPuzzle(CFG_SOL_FLOW, function* () {
        setFlag('sol_flow'); setFlag('solaria_z1'); lv.updatePower();
        yield* teach('condicional');
        yield* teach('flujo');
        yield* talk([['ingeniera', '¡Funciona! Vamos al campo solar a reconectar los paneles.', 'feliz']]);
      });
    })()
  });
  b.e('T', 76, 13, {
    id: 'campo', look: 'console', color: PAL.orange, verb: 'Reconectar paneles', doneFlag: 'sol_eclipse', enabled: () => flag('sol_flow'),
    run: lv => (function* () {
      if (flag('sol_eclipse')) return;
      setFlag('sol_eclipse'); setFlag('solariaEclipse');
      const A2 = lv.get('campoA');
      yield camTo(lv, A2.x + 60, A2.y);
      AudioSys.playSong('eclipse'); AudioSys.sfx('eclipse');
      lv.eclipseAt = { x: A2.x + 40, y: A2.y - 34 };
      yield C.say('pix', '¡Lía! ¡ECLIPSE! ¡Encima de los paneles!', 'sorpresa');
      yield C.wait(0.8);
      setFlag('sol_disc'); AudioSys.sfx('powerdown');
      yield C.say('lia', '¡Está desconectando el campo! ¡Eh!', 'enojo');
      lv.eclipseAt = null; AudioSys.sfx('eclipse');
      yield C.wait(0.6);
      lv.weather = 'dust'; AudioSys.sfx('wind'); AudioSys.ambient('wind');
      yield C.say('teo', '¿Qué es eso en el horizonte? ¡Tormenta de polvo! ¡Al suelo!', 'sorpresa');
      yield C.during(4, (dt) => { lv.dustB = Math.min(0.85, (lv.dustB || 0) + dt * 0.25); });
      lv.weather = 'clear'; AudioSys.ambient('wind');
      yield C.wait(0.8);
      AudioSys.playSong('mystery');
      yield* talk([
        ['ingeniera', 'Los paneles conectados... cubiertos de polvo. Rayados. Tardaremos semanas en limpiarlos.', 'triste'],
        ['teo', 'Y los que desconectó Eclipse... están intactos. Cerrados a tiempo.', 'pensando'],
        ['lia', 'Tuvo suerte.', 'enojo'],
        ['teo', 'Muchísima.', 'pensando'],
        ['sistema', 'A VECES APAGAR ES PROTEGER.'],
        ['pix', '¿Ese mensaje estaba ahí antes?', 'sorpresa'],
        ['lia', 'No. Y no me gusta que tenga razón.', 'pensando']
      ]);
      unlockCodex('m_patron');
      yield camFree(lv);
      yield* talk([['ingeniera', 'Lía, pasar por el jardín de espejos es peligroso: los rayos concentrados queman.', 'n'], ['ingeniera', 'Toma. Un escudo que solo se activa cuando se cumple una condición. Como un SI.', 'feliz']]);
      yield* grant('shield');
      yield* talk([['pix', 'Pulsa ' + bindName('ability') + ' para elegir la condición y armarlo. Consejo: "SIEMPRE" gasta muchísima energía.', 'n']]);
    })()
  });
  b.e('T', 132, 13, {
    id: 'plaza', look: 'bigconsole', color: PAL.sun, verb: 'Interruptor de la plaza', doneFlag: 'restored_solaria', enabled: () => flag('sol_eclipse'),
    run: lv => (function* () {
      if (flag('restored_solaria')) { yield C.say('pix', 'Solaria encendida. Brilla tanto que me veo reflejado en todas partes. Qué guapo.', 'feliz'); return; }
      yield* talk([['lia', 'Con el controlador nuevo, la plaza puede volver a conectarse.', 'decidida']]);
      yield* restoreRegion(lv, 'solaria', 'SI hay sol → cargar. SINO → usar la reserva.');
      yield* talk([['ingeniera', 'Llévate esto: una mochila solar que diseñé. Ah, y los niños te han dejado una pegatina.', 'feliz'], ['pix', 'Siguiente isla: Aeris. Islas que flotan. Yo también floto. Somos compatibles.', 'feliz']]);
      setQuest('m_aeris', 'active');
    })()
  });
  b.e('N', 141, 13, {
    id: 'guardia', cast: 'guardia', quest: 's_sensor', questNeeds: 'sol_eclipse', talk: lv => (function* () {
      if (!flag('sol_eclipse')) { yield C.say('guardia', 'El edificio de mantenimiento se volvió loco: carga de noche y descarga al mediodía.', 'pensando'); return; }
      if (questState('s_sensor') === 'done') { yield C.say('guardia', 'Un símbolo. Un solo símbolo al revés. ¡Increíble!', 'sorpresa'); return; }
      setQuest('s_sensor', 'active');
      const ok = yield* runPuzzle(CFG_SOL_SENSOR);
      if (ok) { setQuest('s_sensor', 'done'); yield C.say('guardia', '¡Gracias! Ahora el edificio decide como la gente sensata.', 'feliz'); }
    })()
  });
  b.e('N', 147, 13, {
    id: 'kiwi', cast: 'vendedora', quest: 's_matriz', talk: lv => (function* () {
      if (questState('s_matriz') === 'done') { yield C.say('vendedora', '39 kW. Lo he pintado en el toldo.', 'feliz'); return; }
      setQuest('s_matriz', 'active');
      yield C.say('vendedora', 'Mi puesto tiene tres filas de paneles. ¿Cuánta potencia dan en total? Mi calculadora se fundió.', 'pensando');
      const ok = yield* runPuzzle(CFG_SOL_MATRIZ);
      if (ok) { setQuest('s_matriz', 'done'); yield* teach('acumulador'); }
    })()
  });
  b.e('N', 154, 13, {
    id: 'trino', cast: 'musico', quest: 's_nube', talk: lv => (function* () {
      if (questState('s_nube') === 'done') { yield C.say('musico', 'Predecir no es adivinar. Es leer bien las condiciones.', 'n'); return; }
      setQuest('s_nube', 'active');
      yield C.say('musico', 'Apuesto un helado a que no sabes qué hará tu controlador si pasa una nube.', 'risa');
      const ok = yield* runPuzzle(CFG_SOL_NUBE);
      if (ok) { setQuest('s_nube', 'done'); yield C.say('musico', 'Te debo un helado solar.', 'risa'); }
    })()
  });
  b.e('X', 160, 13, { cond: () => flag('restored_solaria'), label: 'MAPA' });
  level('solaria', {
    theme: 'solaria', region: 'solaria', title: 'Solaria', subtitle: 'Variables y condicionales + energía solar', music: 'solaria',
    zones: [{ x0: 0, x1: 61, flag: 'solaria_z1' }, { x0: 61, x1: 162, flag: 'restored_solaria' }],
    dyn: {
      Z: { style: 'heat', active: lv => Math.sin(lv.time * 2.2) > -0.1, hazard: lv => Math.sin(lv.time * 2.2) > -0.1 },
      Y: { style: 'heat', active: lv => Math.sin(lv.time * 2.2 + 3) > -0.1, hazard: lv => Math.sin(lv.time * 2.2 + 3) > -0.1 }
    },
    lights: (lv, cx, cy) => { for (let x of [98, 104, 110, 116, 122]) { const d = lv.dyn(lv.tile(x, 12)); if (d && d.active(lv)) Light.add(x * 16 + 8 - cx, 12 * 16 - cy, 40, 1, PAL.sun); } },
    quips: ['Aquí brilla todo. Incluso yo, y eso que ya brillaba.', 'Los rayos de los espejos queman. SI rayo_cerca ENTONCES escudo.', 'Hay un SHADOW IF por aquí: invierte tus controles. El escudo lo bloquea.'],
    objective: lv => !flag('sol_var') ? 'Prueba el panel de pruebas junto a la Ing. Sol' : !flag('sol_flow') ? 'Construye el controlador solar (edificio de mando →)' : !flag('sol_eclipse') ? 'Reconecta el campo solar' : !flag('restored_solaria') ? 'Cruza el jardín de espejos y activa la plaza' : 'Vuelve al mapa (→)',
    hint: lv => !flag('sol_flow') ? 'En el diagrama, cada salida (●) debe ir a algún nodo. El rombo tiene dos: SÍ y NO.' : !flag('restored_solaria') ? 'Los rayos se encienden y apagan. Con el IF SHIELD armado (SI peligro_cerca) pasas sin miedo.' : 'Hay misiones de vecinos en la plaza. O ve a la salida.',
    pointAt: lv => !flag('sol_var') ? 'lab' : !flag('sol_flow') ? 'mando' : !flag('sol_eclipse') ? 'campo' : 'plaza',
    onEnter: lv => (function* () {
      if (flag('solaria_intro')) return;
      setFlag('solaria_intro'); unlockCodex('i_solaria'); setQuest('m_solaria', 'active');
      yield* talk([['pix', '¡Solaria! Jardines, espejos, mercados amarillos y turquesa...', 'feliz'], ['teo', '...y un controlador solar que ya no sabe decidir.', 'pensando'], ['lia', 'Antes de programar, quiero entender qué está cambiando aquí.', 'decidida']]);
    })()
  }, b);
})();
