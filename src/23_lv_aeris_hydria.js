// =====================================================================
//  REGIÓN 03: AERIS (bucles + eólica)   ·   REGIÓN 04: CASCADAS HYDRIA (funciones + hidro)
// =====================================================================
const TURB_ACTS = { ajustar_aspas: { label: 'ajustar_aspas' }, medir_viento: { label: 'medir_viento' }, girar: { label: 'girar' }, generar: { label: 'generar' }, enfriar: { label: 'enfriar' } };
const CFG_AERIS_MOLINO = {
  kind: 'code', main: true, title: 'El molino que no para', tags: ['BUCLES', 'EÓLICA'], concepts: ['loops', 'wind'], codex: 'mientras', music: 'aeris',
  palette: ['repeat', 'while', 'act:ajustar_aspas', 'act:medir_viento', 'act:girar'], actions: TURB_ACTS,
  sensors: ['temperatura', 'rpm', 'viento'], condRight: [0, 30, 50, 60, 70, 80, 90, 100, 150], values: { repeat: [1, 2, 3, 4, 5, 6, 8, 10] },
  defaults: { wcond: { l: 'temperatura', op: '<', r: 70 }, n: 3 },
  world: W_turbine({ heat: 6, check: (st, env) => st.broken ? { ok: false, msg: 'La turbina se rompió por sobrecalentamiento.' } : st.rpm < 60 ? { ok: false, msg: `Solo ${Math.round(st.rpm)} rpm: la turbina gira demasiado lento para producir. Necesita al menos 60.` } : st.temp > 90 ? { ok: false, msg: 'Está a más de 90°. Peligroso.' } : { ok: true, msg: `${Math.round(st.rpm)} rpm y ${Math.round(st.temp)}°: produce energía sin quemarse.` } }),
  stages: [
    { mode: 'demo', label: 'YO TE MUESTRO', text: 'Un bucle REPETIR hace lo mismo varias veces. Mira el contador ↻ junto a la línea. Pulsa EJECUTAR.', program: [{ op: 'repeat', n: 3, body: [A('ajustar_aspas', undefined, 1), A('medir_viento', undefined, 1)], locked: true }], world: W_turbine({ heat: 6, check: st => ({ ok: true, msg: 'Tres vueltas, contadas una por una. ¿Viste el ↻ 1/3, 2/3, 3/3?' }) }) },
    { mode: 'solo', label: 'LO HACES TÚ', text: 'Este es el programa real del molino. Ejecútalo... y luego arréglalo: necesita ≥ 60 rpm sin pasar de 90°.', program: [{ op: 'while', cond: { l: 'rpm', op: '>=', r: 0 }, body: [A('girar')] }] }
  ],
  hints: ['¿Cuándo deja de ser verdadera la condición "rpm ≥ 0"? ¿Alguna vez?', { text: 'La condición de salida debería depender de algo que CAMBIE dentro del bucle y que importe: la temperatura, por ejemplo.', highlight: 'palette:while' }, { text: 'Una posible solución:', partial: [{ op: 'while', cond: { l: 'temperatura', op: '<', r: 70 }, body: [A('ajustar_aspas'), A('medir_viento')] }] }],
  deep: 'Un bucle MIENTRAS necesita que algo dentro de él haga falsa la condición algún día. Si no, es un LOOPLING.',
  intro: '"Técnicamente está funcionando muchísimo." El molino de Don Vento gira sin parar y se recalienta.', xp: 60
};
const CFG_AERIS_VIENTO = {
  kind: 'code', title: 'Viento caprichoso', tags: ['MIENTRAS', 'EÓLICA'], concepts: ['loops', 'debugging', 'wind'], codex: 'mientras', loopLimit: 30,
  palette: ['while', 'act:medir_viento', 'act:generar'], actions: TURB_ACTS, sensors: ['viento', 'temperatura'], condRight: [1, 2, 3, 4, 5, 6],
  world: W_turbine({ wind0: 8, gusts: [8, 7, 7, 6, 5, 4, 3, 2, 2, 1], heat: 2, check: (st) => st.gen > 0 ? { ok: true, msg: 'Genera mientras hay viento y para cuando se calma. ¡No estaba embrujado!' } : { ok: false, msg: 'No generó nada.' } }),
  start: [A('medir_viento'), { op: 'while', cond: { l: 'viento', op: '>', r: 3 }, body: [A('generar')] }],
  intro: 'Don Vento jura que su molino está embrujado: "¡Nunca se detiene aunque el viento pare!".',
  hints: ['Dentro del bucle, ¿alguien vuelve a mirar el viento?', { text: '"viento" solo cambia cuando se ejecuta medir_viento. ¿Dónde debería estar?', highlight: 'palette:act:medir_viento' }, { text: 'Así:', partial: [A('medir_viento'), { op: 'while', cond: { l: 'viento', op: '>', r: 3 }, body: [A('generar'), A('medir_viento')] }] }]
};
const CFG_AERIS_BUCLE = {
  kind: 'code', title: 'Bucle infinito', tags: ['BUCLES', 'ACUMULADOR', 'EÓLICA'], concepts: ['loops', 'debugging', 'wind'], codex: 'acumulador', loopLimit: 25,
  palette: ['while', 'repeat', 'set:total', 'add:total', 'act:siguiente_hora'], actions: { siguiente_hora: { label: 'siguiente_hora' } },
  sensors: ['hora', 'produccion'], condRight: [3, 4, 5, 6, 7], exprOptions: { set: [0], add: ['produccion', 1] },
  world: W_accum({ data: [2, 3, 5, 4, 3, 1], var: 'total', unit: 'kWh por hora', color: PAL.aqua, check: (st, env) => env.vars.total === 18 ? { ok: true, msg: 'total = 18 kWh. ¡La cometa-generador de Mika sumó bien su día!' } : { ok: false, msg: `total = ${env.vars.total}, debería ser 18 (la suma de las 6 horas).` } }),
  start: [{ op: 'set', var: 'total', expr: 0 }, { op: 'while', cond: { l: 'hora', op: '<', r: 6 }, body: [{ op: 'add', var: 'total', expr: 'produccion' }] }],
  intro: 'La cometa de Mika mide energía hora a hora. Su programa se quedó colgado. ¿Por qué?',
  hints: ['¿Qué valor tiene "hora" en cada vuelta? ¿Cambia?', { text: 'Falta avanzar la hora dentro del bucle.', highlight: 'palette:act:siguiente_hora' }, { text: 'Así:', partial: [{ op: 'set', var: 'total', expr: 0 }, { op: 'while', cond: { l: 'hora', op: '<', r: 6 }, body: [{ op: 'add', var: 'total', expr: 'produccion' }, A('siguiente_hora')] }] }]
};

(function () {
  const b = new MapB(132, 24);
  const isl = (x0, x1, top) => b.fill(x0, top, x1, top + 2, '#');
  isl(0, 18, 18); b.plat(21, 22, 17);
  isl(25, 45, 16); b.plat(47, 48, 14);
  isl(50, 57, 13);
  b.fill(61, 3, 62, 20, 'W').fill(68, 3, 69, 20, 'W').fill(75, 3, 76, 20, 'W');
  b.fill(64, 9, 66, 9, '?');
  isl(81, 100, 12); b.plat(86, 88, 9).plat(92, 94, 7);
  b.fill(101, 11, 103, 11, '='); b.fill(102, 3, 103, 12, 'W');
  isl(106, 131, 14);
  b.start(3, 17);
  b.seeds(21, 22, 16, 1).seeds(47, 48, 13, 1).seeds(61, 76, 8, 3).seeds(86, 94, 6, 2).seeds(110, 120, 13, 2);
  [6, 16, 30, 40, 54, 84, 98, 110, 126].forEach(x => b.e('L', x, x < 20 ? 17 : x < 46 ? 15 : x < 58 ? 12 : x < 101 ? 11 : 13));
  b.e('C', 27, 15).e('C', 52, 12).e('C', 83, 11).e('C', 108, 13);
  b.e('m', 36, 15, { id: 'molino', look: 'turbine', speed: () => flag('aeris_fix') ? 1.4 : 3, hot: () => !flag('aeris_fix'), lens: () => flag('aeris_fix') ? 'MIENTRAS temperatura < 70' : ['MIENTRAS rpm ≥ 0 HACER girar', '{r}condición siempre VERDADERA{/}'] });
  b.e('m', 90, 11, { look: 'turbine', speed: () => flag('restored_aeris') ? 1 : 0, lens: ['detenida por {v}ECLIPSE{/}', 'motivo: rachas de 30 m/s', 'previstas en 2 h'] });
  b.e('m', 97, 11, { look: 'turbine', speed: () => 1.1 });
  b.e('m', 116, 13, { look: 'windmill', speed: () => flag('restored_aeris') ? 1 : 0.1, roof: PAL.violet });
  b.e('*', 65, 7, { id: 'c_aeris1', hidden: true }).e('*', 93, 5, { id: 'c_aeris2' });
  b.e('E', 22, 14, { type: 'loopling', r: 2, exitA: 4.4 }).e('E', 46, 11, { type: 'loopling', r: 2.5, exitA: 0.4, speed: 2.6 }).e('E', 71, 12, { type: 'loopling', r: 3, exitA: 2.5, flat: 1 }).e('E', 104, 8, { type: 'loopling', r: 2.5, exitA: 1.6 });
  b.e('a', 10, 17).e('a', 42, 15).e('a', 124, 13);
  b.e('N', 32, 15, {
    id: 'vento', cast: 'vento', quest: 's_viento', questNeeds: 'aeris_fix', talk: lv => (function* () {
      if (!flag('aeris_fix')) { yield* talk([['vento', '¡Mi molino! ¡Mi precioso molino! ¡Gira y gira y gira y no hay quien lo pare!', 'triste'], ['pix', 'Técnicamente está funcionando muchísimo.', 'pensando'], ['vento', '¡Técnicamente se está QUEMANDO, pajarito!', 'enojo']]); return; }
      if (questState('s_viento') === 'done') { yield C.say('vento', 'Resulta que el fantasma era un MIENTRAS que nunca volvía a mirar el viento. Qué decepción. Y qué alivio.', 'n'); return; }
      setQuest('s_viento', 'active');
      yield* talk([['vento', 'Tengo otro molino. ESE sí está embrujado: cuando el viento para, él sigue intentando generar.', 'sorpresa']]);
      const ok = yield* runPuzzle(CFG_AERIS_VIENTO);
      if (ok) { setQuest('s_viento', 'done'); yield C.say('vento', '¡Exorcizado con un medir_viento! Escribiré una ópera sobre esto.', 'feliz'); }
    })()
  });
  b.e('T', 38, 15, {
    id: 'consola', look: 'console', color: PAL.aqua, verb: 'Programa del molino', doneFlag: 'aeris_fix',
    run: lv => (function* () {
      if (flag('aeris_fix')) { yield C.say('pix', 'Gira con calma. Como yo después de un café. Bueno, yo no tomo café.', 'feliz'); return; }
      yield* runPuzzle(CFG_AERIS_MOLINO, function* (r) {
        setFlag('aeris_fix'); setFlag('aeris_wind');
        if (!r.sawInfinite) achieve('no_infinite');
        AudioSys.sfx('turbine'); lv.updatePower();
        yield* teach('repetir'); yield* teach('mientras');
        yield* talk([
          ['vento', '¡Se ha calmado! ¡Y las corrientes de viento vuelven a soplar entre las islas!', 'feliz'],
          ['teo', 'Lía... esto no parece sabotaje. El molino hacía EXACTAMENTE lo que le pidieron: girar.', 'pensando'],
          ['lia', 'Algoritmos que hacen demasiado bien lo que se les pidió.', 'pensando'],
          ['teo', '¿Y si el problema no es que AURORA dejó de obedecer?', 'pensando'],
          ['lia', '¿Entonces?', 'sorpresa'],
          ['teo', '¿Y si está obedeciendo demasiado?', 'n'],
          ['vento', 'Tomad, jóvenes. El planeador de mi abuelo. Con estas corrientes, volaréis.', 'feliz']
        ]);
        yield* grant('glide');
        yield* talk([['pix', 'Mantén ' + bindName('jump') + ' en el aire para planear. Dentro de una corriente, subes. MIENTRAS haya viento... ¡a volar!', 'feliz']]);
      });
    })()
  });
  b.e('N', 53, 12, {
    id: 'mika', cast: 'kite', quest: 's_bucle', talk: lv => (function* () {
      if (questState('s_bucle') === 'done') { yield C.say('kite', '¡18 kWh! Mi cometa es una pequeña central eólica.', 'feliz'); return; }
      setQuest('s_bucle', 'active');
      yield* talk([['kite', 'Mi cometa tiene un generador. Quise sumar lo que produjo cada hora... y el programa se quedó pensando para siempre.', 'triste']]);
      const ok = yield* runPuzzle(CFG_AERIS_BUCLE);
      if (ok) { setQuest('s_bucle', 'done'); yield C.say('kite', 'Todo bucle debería volver a casa, como mi cometa.', 'feliz'); }
    })()
  });
  b.e('N', 112, 13, { id: 'teo', cast: 'teo', talk: [['teo', 'Estas turbinas las detuvo Eclipse. Mira con la lente.', 'pensando'], ['teo', 'Rachas de 30 m/s previstas... Si hubieran seguido girando, se habrían partido.', 'pensando'], ['lia', 'Otra vez "suerte".', 'culpa']] });
  b.e('T', 122, 13, {
    id: 'central', look: 'bigconsole', color: PAL.aqua, verb: 'Reconectar Aeris', doneFlag: 'restored_aeris', enabled: () => flag('aeris_fix'),
    run: lv => (function* () {
      if (flag('restored_aeris')) return;
      yield* restoreRegion(lv, 'aeris', 'REPETIR, sí. Pero siempre con una salida.');
      const all = ['s_viento', 's_bucle'].every(q => questState(q) === 'done');
      if (all) achieve('wind_master');
      yield* talk([['pix', 'Siguiente: Cascadas Hydria. Agua, cataratas... y yo sin paraguas.', 'n']]);
      setQuest('m_hydria', 'active');
    })()
  });
  b.e('X', 130, 13, { cond: () => flag('restored_aeris'), label: 'MAPA' });
  level('aeris', {
    theme: 'aeris', region: 'aeris', title: 'Aeris', subtitle: 'Bucles + energía eólica', music: 'aeris', basePower: 0.3, restoredFlag: 'restored_aeris',
    dyn: { W: { style: 'wind', active: () => flag('aeris_wind') } },
    lensHint: true,
    quips: ['Los LOOPLING dan vueltas sin salida. Con la Lente se ve su nodo SALIDA: tócalo.', 'Si caes al vacío, técnicamente descendimos. Y volvemos al último punto seguro.', 'Estas islas flotan. Yo también. Somos colegas.'],
    objective: lv => !flag('aeris_fix') ? 'Arregla el programa del molino de Don Vento' : !flag('restored_aeris') ? 'Planea por las corrientes (→) y reconecta Aeris' : 'Vuelve al mapa (→)',
    hint: lv => !flag('aeris_fix') ? 'La consola está junto al molino caliente. Un MIENTRAS necesita una condición que llegue a ser FALSA.' : 'Mantén ' + bindName('jump') + ' en el aire dentro de las corrientes blancas para subir.',
    pointAt: lv => !flag('aeris_fix') ? 'consola' : 'central',
    onEnter: lv => (function* () {
      if (flag('aeris_intro')) return;
      setFlag('aeris_intro'); unlockCodex('i_aeris'); setQuest('m_aeris', 'active');
      yield* talk([['pix', '¡Aeris! Islas flotantes, cometas, puentes de viento...', 'feliz'], ['teo', '...y un molino que suena a tetera a punto de explotar.', 'pensando'], ['lia', 'Sin viento, las corrientes entre islas no funcionan. Empecemos por ese molino.', 'decidida']]);
    })()
  }, b);
})();

// =====================================================================
//  HYDRIA
// =====================================================================
const HYD_GATES = [{ caudal: 3, altura: 10 }, { caudal: 2, altura: 15 }, { caudal: 4, altura: 6 }];
const CFG_HYD_FORJA = {
  kind: 'code', main: true, title: 'La Forja de Funciones', tags: ['FUNCIONES', 'PARÁMETROS', 'HIDRO'], concepts: ['functions', 'hydro'], codex: 'funcion', music: 'hydria',
  palette: ['call:generarEnergia', 'ret'], functions: { generarEnergia: { params: ['caudal', 'altura'], body: [], returns: 'p1', defaults: { caudal: 1, altura: 5 } } },
  intoOptions: ['p1', 'p2', 'p3'],
  exprOptions: { ret: [{ bin: '*', a: { bin: '*', a: 'caudal', b: 'altura' }, b: 8 }, { bin: '+', a: 'caudal', b: 'altura' }, { bin: '*', a: 'caudal', b: 8 }, { bin: '*', a: 'altura', b: 8 }, 'caudal', 0], 'arg:generarEnergia:0': [1, 2, 3, 4, 5], 'arg:generarEnergia:1': [5, 6, 8, 10, 12, 15, 20] },
  maxBlocks: 3,
  world: W_hydro({ gates: HYD_GATES, check: (st) => { for (let i = 0; i < st.gates.length; i++) { const g = st.gates[i], want = g.caudal * g.altura * 8; if (!g.called) return { ok: false, msg: `La turbina ${i + 1} (caudal ${g.caudal}, altura ${g.altura}) no recibió ninguna llamada.` }; if (Math.round(g.power) !== want) return { ok: false, msg: `La turbina ${i + 1} dio ${Math.round(g.power)} kW; con caudal ${g.caudal} y altura ${g.altura} deberían ser ${want} kW. Revisa lo que DEVUELVE la función.` }; } return { ok: true, msg: `¡Tres turbinas, una sola función! Total: ${Math.round(st.total)} kW.` }; } }),
  stages: [
    { mode: 'guided', label: 'LO HACEMOS JUNTOS', text: 'Pestaña "f: generarEnergia": arrastra DEVOLVER al cuerpo y elige la fórmula. Luego llama a la función en PRINCIPAL para cada turbina.', program: [{ op: 'call', fn: 'generarEnergia', args: [3, 10], into: 'p1', locked: true }], functions: { generarEnergia: [] } },
  ],
  hints: ['Potencia hidráulica ≈ 8 × caudal × altura (en kW). ¿Qué debe DEVOLVER la función?', { text: 'En PRINCIPAL: tres LLAMAR, uno por turbina, con su caudal y su altura.', highlight: 'palette:call:generarEnergia' }, { text: 'Función lista; faltan las llamadas 2 y 3.', partialFn: { generarEnergia: [{ op: 'ret', expr: { bin: '*', a: { bin: '*', a: 'caudal', b: 'altura' }, b: 8 } }] } }],
  deep: 'Una función es una mini-máquina: recibe caudal y altura, calcula, y DEVUELVE el resultado a quien la llamó.',
  intro: 'Tres turbinas con distinto caudal y altura. En vez de calcular tres veces, forja UNA función y reutilízala.', xp: 60
};
const CFG_HYD_RIO = {
  kind: 'code', title: 'Río bloqueado', tags: ['FUNCIONES', 'SECUENCIA', 'HIDRO'], concepts: ['functions', 'sequence', 'hydro'], codex: 'funcion',
  palette: ['call:abrirCompuerta'], functions: { abrirCompuerta: { params: ['n'], body: [A('abrir', undefined, 1)], locked: true, defaults: { n: 1 } } },
  actions: { abrir: { label: 'abrir(n)' } },
  exprOptions: { 'arg:abrirCompuerta:0': [1, 2, 3] },
  world: (() => {
    const w = {
      init() { return { open: [false, false, false], order: [], flood: false, t: 0 }; },
      sensors: {},
      act(name, arg, st, env) {
        const n = env.vars.n;
        if (st.open[n - 1]) return { ok: false, msg: `La compuerta ${n} ya estaba abierta.` };
        // si abres una compuerta de arriba con la de abajo cerrada, se inunda el pueblo
        if (n < 3 && !st.open[n]) { st.flood = true; return { ok: false, msg: `¡Abriste la compuerta ${n} con la ${n + 1} (río abajo) cerrada! El agua se acumula e inunda el pueblo. Hay que abrir de abajo hacia arriba.` }; }
        st.open[n - 1] = true; st.order.push(n); AudioSys.sfx('splash');
        return { ok: true, dur: 0.5 };
      },
      update(st, dt) { st.t += dt; },
      check(st) { return st.open.every(Boolean) ? { ok: true, msg: '¡El río fluye de nuevo sin inundar a nadie!' } : { ok: false, msg: `Quedan compuertas cerradas (${st.open.filter(Boolean).length}/3).` }; },
      draw(g, x, y, w2, h, st, t) {
        vGradient(g, x, y, w2, h, [[0, '#30C8E0'], [1, '#F0FFF8']], false);
        for (let i = 0; i < 3; i++) {
          const gx = x + 20 + i * 52, gy = y + 20 + i * 26;
          rect(g, gx - 16, gy + 16, 60, 8, '#EDE6F5');
          const wl = st.open[i] ? 4 : 12;
          rect(g, gx - 16, gy + 16 - wl, 44, wl, st.flood && !st.open[i] ? '#FF6B6B' : '#59C7FF');
          PROP_DRAW.sluice(g, gx + 26, gy - 12, { t, cfg: { open: () => st.open[i] ? 1 : 0 } });
          drawText(g, String(i + 1), gx + 34, gy - 22, PAL.deep, { align: 'center' });
        }
        rect(g, x + w2 - 40, y + h - 26, 36, 20, '#FF9D8A'); drawText(g, 'pueblo', x + w2 - 22, y + h - 20, PAL.ink, { align: 'center' });
        if (st.flood) drawText(g, '¡INUNDACIÓN!', x + w2 / 2, y + 6, PAL.coral, { align: 'center', outline: PAL.ink });
      }
    };
    return w;
  })(),
  intro: 'La función abrirCompuerta(n) ya existe (está bloqueada). Tú decides con qué número y en qué orden llamarla. El pueblo está río abajo, junto a la 3.',
  hints: ['El agua baja de la 1 a la 3. ¿Qué pasa si abres arriba con abajo cerrado?', 'Abre primero la compuerta más cercana al pueblo.', { text: 'Orden: 3, 2, 1.', partial: [{ op: 'call', fn: 'abrirCompuerta', args: [3] }] }]
};
const CFG_HYD_DUP = {
  kind: 'code', title: 'Función duplicada', tags: ['FUNCIONES', 'REFACTORIZAR'], concepts: ['functions', 'debugging'], codex: 'funcion',
  palette: ['call:revisarTurbina', 'act:cerrar_valvula', 'act:limpiar_rejilla', 'act:abrir_valvula'],
  functions: { revisarTurbina: { params: ['n'], body: [], defaults: { n: 1 } } },
  actions: { cerrar_valvula: { label: 'cerrar_valvula(n)' }, limpiar_rejilla: { label: 'limpiar_rejilla(n)' }, abrir_valvula: { label: 'abrir_valvula(n)' } },
  exprOptions: { 'arg:revisarTurbina:0': [1, 2, 3] },
  world: (() => ({
    init() { return { log: {}, bad: null }; },
    sensors: {},
    act(name, arg, st, env) {
      const n = env.vars.n != null ? env.vars.n : 1;
      const L = st.log[n] = st.log[n] || [];
      const seq = ['cerrar_valvula', 'limpiar_rejilla', 'abrir_valvula'];
      if (seq[L.length] !== name) return { ok: false, msg: `Turbina ${n}: "${name}" fuera de orden. El mantenimiento es cerrar → limpiar → abrir.` };
      L.push(name); return { ok: true, dur: 0.2 };
    },
    check(st, env) {
      for (const n of [1, 2, 3]) if (!st.log[n] || st.log[n].length < 3) return { ok: false, msg: `La turbina ${n} no recibió el mantenimiento completo.` };
      if (countBlocks(env.prog) > 3) return { ok: false, msg: `Funciona, pero PRINCIPAL tiene ${countBlocks(env.prog)} líneas. Mueve los pasos a la función y deja solo 3 llamadas.` };
      return { ok: true, msg: '¡Tres llamadas limpias! Si mañana cambia el mantenimiento, lo corriges en UN solo sitio.' };
    },
    draw(g, x, y, w, h, st, t) {
      rect(g, x, y, w, h, '#10263A');
      for (let n = 1; n <= 3; n++) { const cx = x + 30 + (n - 1) * 60, L = st.log[n] || []; pcircle(g, cx, y + 50, 16, L.length === 3 ? PAL.lime : '#565E8C'); drawText(g, 'T' + n, cx, y + 47, PAL.ink, { align: 'center' }); L.forEach((s, i) => drawText(g, '✓ ' + s.split('_')[0], cx - 24, y + 76 + i * 10, PAL.lime)); }
    }
  }))(),
  start: [A('cerrar_valvula'), A('limpiar_rejilla'), A('abrir_valvula'), { op: 'call', fn: 'revisarTurbina', args: [2] }, { op: 'call', fn: 'revisarTurbina', args: [3] }],
  vars: { n: 1 },
  intro: 'El programa de mantenimiento copia los mismos 3 pasos para cada turbina. La función revisarTurbina(n) está vacía. Arréglalo: PRINCIPAL con 3 líneas como máximo.',
  hints: ['Abre la pestaña de la función: ¿qué pasos deberían ir ahí dentro?', 'Mueve cerrar → limpiar → abrir a la función. En PRINCIPAL, tres LLAMAR con n = 1, 2, 3.', { text: 'Función completada:', partialFn: { revisarTurbina: [A('cerrar_valvula'), A('limpiar_rejilla'), A('abrir_valvula')] } }]
};

(function () {
  const b = new MapB(150, 20);
  b.ground(0, 30, 16).ground(8, 12, 15);
  b.fill(31, 17, 38, 18, '~').ground(31, 38, 19).plat(33, 35, 14);
  b.ground(39, 72, 16);
  b.fill(60, 0, 60, 15, 'G');
  b.fill(73, 17, 82, 18, '~').ground(73, 82, 19).fill(76, 12, 79, 12, '?');
  b.ground(83, 112, 16).plat(90, 92, 13).plat(94, 96, 11);
  b.fill(98, 0, 98, 15, 'K');
  b.fill(113, 17, 118, 18, '~').ground(113, 118, 19);
  b.ground(119, 149, 16);
  b.fill(128, 0, 128, 15, 'Q');
  b.start(3, 15);
  b.seeds(8, 12, 14, 2).seeds(33, 35, 13, 1).seeds(76, 79, 11, 1).seeds(90, 96, 10, 2).seeds(130, 140, 15, 2);
  [5, 20, 42, 56, 66, 86, 104, 122, 138].forEach(x => b.e('L', x, 15));
  b.e('C', 40, 15).e('C', 62, 15).e('C', 100, 15).e('C', 130, 15);
  b.e('m', 16, 15, { look: 'house', color: '#FFF3EE', roof: '#FF6B6B' }).e('m', 143, 15, { look: 'house', color: '#FFF3EE', roof: '#30E1C5' });
  b.e('m', 26, 15, { look: 'waterwheel', speed: () => flag('restored_hydria') ? 1 : 0 }).e('m', 108, 15, { look: 'waterwheel', speed: () => flag('hyd_g2') ? 1 : 0 });
  b.e('m', 58, 15, { look: 'sluice', open: () => flag('hyd_g1') ? 1 : 0 }).e('m', 96, 15, { look: 'sluice', open: () => flag('hyd_g2') ? 1 : 0 }).e('m', 126, 15, { look: 'sluice', open: () => flag('hyd_g3') ? 1 : 0 });
  const socket = (id, n) => ({
    id, look: 'socket', verb: 'Invocar función', done: () => flag('hyd_g' + n), enabled: () => false,
    lens: () => flag('hyd_g' + n) ? 'compuerta ' + n + ' = ABIERTA' : ['LLAMAR abrirCompuerta(' + n + ')', 'requiere {v}FUNCTION PORTAL{/} (' + bindName('ability') + ')'],
    onAbility: (lv, t, ab) => {
      if (ab !== 'portal' && ab !== 'link') { Bark.say('pix', 'Aquí va una FUNCIÓN. Cambia a FUNCTION PORTAL con ' + bindName('swap') + '.'); return; }
      if (flag('hyd_g' + n)) { Bark.say('pix', 'Esa compuerta ya está abierta.'); return; }
      setFlag('hyd_g' + n); AudioSys.sfx('portal'); AudioSys.sfx('door'); FX.flash(PAL.violet, 0.3);
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; Particles.spawn({ x: t.x + 8 + Math.cos(a) * 12, y: t.y + 8 + Math.sin(a) * 12, vx: Math.cos(a) * 30, vy: Math.sin(a) * 30, life: 0.8, type: 'star', color: PAL.violet }); }
      Particles.text(t.x + 8, t.y - 10, 'LLAMAR abrirCompuerta(' + n + ')', PAL.lilac);
      G.save.portalUses = (G.save.portalUses || 0) + 1;
      if (G.save.portalUses >= 3) achieve('reuse');
      lv.updatePower();
    }
  });
  b.e('T', 56, 15, socket('sock1', 1)).e('T', 94, 15, socket('sock2', 2)).e('T', 124, 15, socket('sock3', 3));
  b.e('*', 78, 10, { id: 'c_hydria1', hidden: true }).e('*', 95, 9, { id: 'c_hydria2' });
  b.e('E', 50, 15, { type: 'bugglin' }).e('E', 104, 15, { type: 'drainer' }).e('E', 136, 15, { type: 'bugglin', speed: 35 });
  b.e('a', 22, 15).e('a', 88, 15).e('a', 146, 15);
  b.e('N', 44, 15, { id: 'teo', cast: 'teo', talk: [['teo', 'Tres compuertas, tres turbinas. Todas con el mismo cálculo... escrito tres veces en tres sitios distintos.', 'pensando'], ['lia', 'Y si hay un error, habría que arreglarlo tres veces.', 'culpa'], ['teo', 'La Forja está aquí. Hagámoslo una vez, bien.', 'n']] });
  b.e('T', 47, 15, {
    id: 'forja', look: 'bigconsole', color: PAL.violet, verb: 'Forja de Funciones', doneFlag: 'hyd_forja',
    lens: () => ['llamadas registradas: {v}perfectOptimize(){/}', '1.204 veces por segundo'],
    run: lv => (function* () {
      if (flag('hyd_forja')) { yield C.say('pix', 'La Forja está fría. Bueno, templada. Forja-tibia.', 'n'); return; }
      yield* runPuzzle(CFG_HYD_FORJA, function* () {
        setFlag('hyd_forja'); addMastery('functions', 3);
        yield* teach('funcion');
        yield* talk([['teo', 'Ya tenemos generarEnergia(). Y hay otra función en la Forja: abrirCompuerta(n).', 'n'], ['lia', 'Si puedo invocarla desde cualquier sitio...', 'pensando']]);
        yield* grant('portal');
        yield* talk([['pix', 'Acércate a un zócalo f() y pulsa ' + bindName('ability') + '. La misma función, en tres mecanismos. ¡Eso es reutilizar!', 'feliz']]);
      });
    })()
  });
  b.e('T', 70, 15, {
    id: 'holo', look: 'screen', color: PAL.lilac, verb: 'Grabación', doneFlag: 'vegaMsg1', enabled: () => flag('hyd_g1'),
    lines: () => flag('vegaMsg1') ? ['perfectOptimize()', '1204/s', '???'] : ['▶ REC', 'Prof. Vega', '...'],
    run: lv => (function* () {
      AudioSys.playSong('mystery');
      yield* talk([
        ['pix', '¡Una grabación! Tiene la firma de Vega.', 'sorpresa'],
        ['vega', 'Si ves esto, no vengas a buscarme todavía.', 'pensando'],
        ['lia', 'Genial. Porque decir eso siempre funciona.', 'enojo'],
        ['vega', 'Busca la función que todos están llamando.', 'n'],
        ['teo', '¿La función que todos...? La Forja registraba llamadas. Mira con la lente.', 'pensando'],
        ['lia', '(F) perfectOptimize(). Mil doscientas cuatro veces por segundo. Desde el Puerto, Solaria, Aeris...', 'sorpresa'],
        ['pix', 'Nadie recuerda haberla programado. Lo he preguntado. A todos. Dos veces.', 'pensando']
      ]);
      setFlag('vegaMsg1'); setFlag('perfectOptimize'); unlockCodex('m_registros'); unlockCodex('m_vega');
      AudioSys.playSong('hydria');
    })()
  });
  b.e('N', 86, 15, {
    id: 'anzuelo', cast: 'pescador', quest: 's_rio', talk: lv => (function* () {
      if (questState('s_rio') === 'done') { yield C.say('pescador', 'El río baja contento y el pueblo sigue seco. Así da gusto pescar.', 'feliz'); return; }
      setQuest('s_rio', 'active');
      yield* talk([['pescador', 'El río está bloqueado por tres compuertas viejas. Si las abro en mal orden, el agua inunda el pueblo.', 'pensando']]);
      const ok = yield* runPuzzle(CFG_HYD_RIO);
      if (ok) { setQuest('s_rio', 'done'); yield C.say('pescador', 'Parámetros: el mismo botón, distintos números. ¡Qué invento!', 'feliz'); }
    })()
  });
  b.e('N', 120, 15, {
    id: 'lina', cast: 'lina', quest: 's_duplicada', talk: lv => (function* () {
      if (questState('s_duplicada') === 'done') { yield C.say('lina', 'Tres llamadas. Un solo sitio donde corregir. Me encanta.', 'feliz'); return; }
      setQuest('s_duplicada', 'active');
      yield* talk([['lina', 'Mi programa de mantenimiento repite lo mismo para cada turbina. Y cada vez que cambio algo, me olvido de una copia.', 'triste']]);
      const ok = yield* runPuzzle(CFG_HYD_DUP);
      if (ok) { setQuest('s_duplicada', 'done'); yield C.say('lina', 'Reutilizar una solución es mejor que repetir código. ¡Lo bordaré en un cojín!', 'risa'); }
    })()
  });
  b.e('T', 140, 15, {
    id: 'central', look: 'bigconsole', color: PAL.sky, verb: 'Central de Hydria', doneFlag: 'restored_hydria', enabled: () => flag('hyd_g3'),
    run: lv => (function* () {
      if (flag('restored_hydria')) return;
      yield* restoreRegion(lv, 'hydria', 'Defínelo una vez. Llámalo muchas.');
      yield* talk([['teo', 'Hydria da luz. Y ahora sabemos qué buscar: perfectOptimize().', 'decidida'], ['pix', 'Siguiente: el Bosque BioLoop. Tengo... un presentimiento. No sé de dónde viene.', 'pensando']]);
      setQuest('m_bioloop', 'active');
    })()
  });
  b.e('X', 148, 15, { cond: () => flag('restored_hydria'), label: 'MAPA' });
  level('hydria', {
    theme: 'hydria', region: 'hydria', title: 'Cascadas Hydria', subtitle: 'Funciones + hidroenergía', music: 'hydria',
    zones: [{ x0: 0, x1: 60, flag: 'hyd_forja' }, { x0: 60, x1: 98, flag: 'hyd_g1' }, { x0: 98, x1: 128, flag: 'hyd_g2' }, { x0: 128, x1: 150, flag: 'hyd_g3' }],
    dyn: {
      G: { solid: () => !flag('hyd_g1'), style: 'barrier', color: PAL.sky },
      K: { solid: () => !flag('hyd_g2'), style: 'barrier', color: PAL.sky },
      Q: { solid: () => !flag('hyd_g3'), style: 'barrier', color: PAL.sky }
    },
    quips: ['El agua cae. La energía sube. Física: 1, gravedad: también 1.', 'Un DRAINER chupa energía. Esquívalo o sáltale encima.', 'FUNCTION PORTAL: la misma función, en cualquier zócalo f().'],
    objective: lv => !flag('hyd_forja') ? 'Forja la función generarEnergia()' : !flag('hyd_g1') ? 'Invoca abrirCompuerta(1) en el zócalo f()' : !flag('vegaMsg1') ? 'Examina la grabación de Vega' : !flag('hyd_g3') ? 'Abre las compuertas 2 y 3 con FUNCTION PORTAL' : !flag('restored_hydria') ? 'Activa la central de Hydria' : 'Vuelve al mapa (→)',
    hint: lv => !flag('hyd_forja') ? 'La Forja está junto a Teó. Potencia ≈ 8 × caudal × altura.' : !flag('hyd_g3') ? 'Con FUNCTION PORTAL seleccionado (' + bindName('swap') + ' cambia de habilidad), pulsa ' + bindName('ability') + ' junto a un zócalo f().' : 'La central está al final.',
    pointAt: lv => !flag('hyd_forja') ? 'forja' : !flag('hyd_g1') ? 'sock1' : !flag('vegaMsg1') ? 'holo' : !flag('hyd_g2') ? 'sock2' : !flag('hyd_g3') ? 'sock3' : 'central',
    onEnter: lv => (function* () {
      if (flag('hydria_intro')) return;
      setFlag('hydria_intro'); unlockCodex('i_hydria'); setQuest('m_hydria', 'active');
      yield* talk([['pix', 'Cascadas Hydria. Agua turquesa, puentes blancos, arquitectura coral...', 'feliz'], ['lia', '...y compuertas cerradas por todas partes. Aisladas, una por una.', 'pensando'], ['teo', 'Como si alguien hubiera querido contener algo.', 'pensando']]);
    })()
  }, b);
})();
