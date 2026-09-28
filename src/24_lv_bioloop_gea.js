// =====================================================================
//  REGIÓN 05: BOSQUE BIOLOOP (listas + biomasa)  ·  REGIÓN 06: GEA PROFUNDA (estados + geotermia)
// =====================================================================
const WASTE_ITEMS = [
  { uid: 'w1', name: 'hojas', type: 'organico' }, { uid: 'w2', name: 'botella', type: 'plastico' }, { uid: 'w3', name: 'cáscara', type: 'organico' },
  { uid: 'w4', name: 'rama', type: 'madera' }, { uid: 'w5', name: 'frasco', type: 'vidrio' }, { uid: 'w6', name: 'fruta', type: 'organico' },
  { uid: 'w7', name: 'lata', type: 'metal' }, { uid: 'w8', name: 'bolsa', type: 'plastico' }
];
const BIO_RULE = t => t === 'organico' ? 'biodigestor' : t === 'madera' ? 'secado' : 'reciclaje';
const BIO_ACTS = { a_biodigestor: { label: 'a_biodigestor' }, a_reciclaje: { label: 'a_reciclaje' }, a_secado: { label: 'a_secado' } };
function cfgBioSorter() {
  const items = (G.save.pack && G.save.pack.length ? G.save.pack : WASTE_ITEMS.slice(0, 6)).map(i => ({ name: i.name, type: i.type }));
  return {
    kind: 'code', main: true, title: 'El biodigestor de Menta', tags: ['LISTAS', 'RECORRIDO', 'BIOMASA'], concepts: ['arrays', 'conditions', 'biomass'], codex: 'lista', music: 'bioloop',
    palette: ['foreach:residuos', 'ifelse', 'act:a_biodigestor', 'act:a_reciclaje', 'act:a_secado'], actions: BIO_ACTS,
    defaults: { itemVar: 'residuo', cond: { l: 'tipo', op: '==', r: 'organico' } }, sensors: ['tipo'], ops: ['==', '!='], condRight: ['organico', 'madera', 'plastico', 'vidrio', 'metal'],
    world: W_sorter({ items, bins: ['biodigestor', 'reciclaje', 'secado'], rule: BIO_RULE, okMsg: '¡Todo clasificado en su sitio! El biodigestor produce biogás limpio.' }),
    stages: [
      { mode: 'demo', label: 'YO TE MUESTRO', text: 'Una LISTA guarda varios elementos en orden: [0], [1], [2]... PARA CADA los visita uno a uno. Mira el ▼.', world: W_sorter({ items: [{ name: 'botella', type: 'plastico' }, { name: 'lata', type: 'metal' }, { name: 'frasco', type: 'vidrio' }], bins: ['biodigestor', 'reciclaje', 'secado'], rule: BIO_RULE, okMsg: 'Tres elementos, tres vueltas. Todos eran reciclables.' }), program: [{ op: 'foreach', var: 'residuo', list: 'residuos', body: [A('a_reciclaje', undefined, 1)], locked: true }] },
      { mode: 'solo', label: 'LO HACES TÚ', text: 'Ahora TU mochila: orgánico → biodigestor, madera → secado, lo demás → reciclaje. La estructura ya está: toca los valores de las preguntas para corregirlas.', program: [{ op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'plastico' }, body: [A('a_biodigestor')], else: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'organico' }, body: [A('a_secado')], else: [A('a_reciclaje')] }] }] }] }
    ],
    hints: ['Dentro del PARA CADA, cada residuo debe ir a UN solo contenedor. ¿Qué pregunta harías primero?', { text: 'SI tipo = organico → a_biodigestor. SINO → otra pregunta: SI tipo = madera...', highlight: 'palette:ifelse' }, { text: 'Estructura casi completa:', partial: [{ op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'organico' }, body: [A('a_biodigestor')], else: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'madera' }, body: [A('a_secado')], else: [A('a_reciclaje')] }] }] }] }],
    deep: 'Piensa en la lista como una fila de cajas numeradas: el PARA CADA pasa por todas, y el SI decide para cada una por separado.',
    intro: 'La Abuela Menta necesita clasificar lo que traes en la mochila (tu ARRAY PACK). Nada de plástico en el biodigestor.', xp: 60
  };
}
function W_counter(o) {
  return {
    init() { return { k: -1 }; },
    sensors: { tipo: (st, env) => env && env.vars && env.vars.residuo ? env.vars.residuo.type : '-' },
    lists: () => ({ residuos: o.items.map(t => ({ name: t.name, type: t.type })) }),
    act() { return { ok: false, msg: '?' }; },
    check(st, env) { const n = o.items.filter(i => i.type === 'organico').length; return env.vars.organicos === n ? { ok: true, msg: `organicos = ${n}. ¡Contador perfecto!` } : { ok: false, msg: `organicos = ${env.vars.organicos}, pero hay ${n} orgánicos en la lista.` }; },
    draw(g, x, y, w, h, st, t, scene) {
      rect(g, x, y, w, h, '#1F5A4A');
      const it = scene && scene.env && Object.values(scene.env.iter)[0];
      o.items.forEach((r, i) => { const ix = x + 8 + i * 20; drawWasteIcon(g, r.type, ix, y + 30); drawText(g, '[' + i + ']', ix, y + 44, it && it.idx === i ? PAL.sun : '#8C93B8'); if (it && it.idx === i) drawText(g, '▼', ix + 2, y + 18, PAL.sun); });
      const v = scene && scene.env ? scene.env.vars.organicos : undefined;
      drawText(g, 'organicos = ' + (v === undefined ? '?' : v), x + 8, y + 70, PAL.lime, { scale: 2 });
    }
  };
}
const CFG_BIO_LISTA = {
  kind: 'code', title: 'Lista de residuos', tags: ['LISTAS', 'CONTADOR', 'BIOMASA'], concepts: ['arrays', 'loops', 'biomass'], codex: 'acumulador',
  palette: ['set:organicos', 'foreach:residuos', 'if', 'add:organicos'], sensors: ['tipo'], ops: ['==', '!='], condRight: ['organico', 'madera', 'plastico'],
  defaults: { itemVar: 'residuo', cond: { l: 'tipo', op: '==', r: 'organico' } }, exprOptions: { set: [0, 1], add: [1, 2] },
  world: W_counter({ items: [{ name: 'hojas', type: 'organico' }, { name: 'bolsa', type: 'plastico' }, { name: 'cáscara', type: 'organico' }, { name: 'rama', type: 'madera' }, { name: 'fruta', type: 'organico' }, { name: 'semillas', type: 'organico' }, { name: 'lata', type: 'metal' }] }),
  start: [{ op: 'set', var: 'organicos', expr: 1 }, { op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'plastico' }, body: [{ op: 'add', var: 'organicos', expr: 1 }], else: null }] }],
  intro: 'El mercado quiere saber cuántos residuos orgánicos hay en la lista. El CONTADOR ya está armado, pero con dos valores mal: tócalos para corregirlos.',
  hints: ['Un contador empieza en 0 y suma 1 cuando se cumple algo.', 'organicos ← 0; PARA CADA...; SI tipo = organico: organicos ← organicos + 1', { text: 'Estructura:', partial: [{ op: 'set', var: 'organicos', expr: 0 }, { op: 'foreach', var: 'residuo', list: 'residuos', body: [] }] }]
};
const CFG_BIO_MERCADO = {
  kind: 'code', title: 'Día de mercado', tags: ['ACUMULADOR', 'SI', 'BIOMASA'], concepts: ['arrays', 'conditions', 'biomass'], codex: 'acumulador',
  palette: ['set:total', 'foreach:demandas', 'add:total', 'ifelse', 'act:abrir_mercado', 'act:pedir_energia'], actions: { abrir_mercado: { label: 'abrir_mercado' }, pedir_energia: { label: 'pedir_energia' } },
  defaults: { itemVar: 'd', cond: { l: 'total', op: '>', r: 'biogas' } }, varNames: ['total', 'biogas'], condRight: ['biogas', 10, 15, 20, 25], exprOptions: { set: [0], add: ['d', 1] },
  vars: { biogas: 18 },
  world: (() => ({
    init() { return { decision: null }; },
    sensors: {},
    lists: () => ({ demandas: [3, 5, 2, 4, 6] }),
    act(name, arg, st) { st.decision = name; return { ok: true, dur: 0.4 }; },
    check(st, env) { if (env.vars.total !== 20) return { ok: false, msg: `total = ${env.vars.total}; la suma de los puestos es 20 kWh.` }; if (st.decision !== 'pedir_energia') return { ok: false, msg: `20 kWh > 18 kWh de biogás: no alcanza. ¿Qué debería decidir el SI?` }; return { ok: true, msg: 'Faltan 2 kWh: el mercado pide ayuda a la red solar. ¡Nadie se queda sin luz!' }; },
    draw(g, x, y, w, h, st, t, scene) {
      rect(g, x, y, w, h, '#2A5A3A');
      [3, 5, 2, 4, 6].forEach((d, i) => { PROP_DRAW.stall(g, x + 4 + i * 35, y + 20, { t, cfg: { color: [PAL.coral, PAL.sun, PAL.pink, PAL.orange, PAL.teal][i] } }, { zonePowered: () => true }); drawText(g, d + ' kWh', x + 22 + i * 35, y + 56, PAL.cream, { align: 'center' }); });
      const v = scene && scene.env ? scene.env.vars.total : undefined;
      drawText(g, 'total = ' + (v === undefined ? '?' : v) + '   biogás = 18', x + 6, y + 80, PAL.lime);
      if (st.decision) drawText(g, st.decision, x + 6, y + 96, st.decision === 'pedir_energia' ? PAL.lime : PAL.coral);
    }
  }))(),
  start: [{ op: 'set', var: 'total', expr: 0 }, { op: 'foreach', var: 'd', list: 'demandas', body: [{ op: 'add', var: 'total', expr: 1 }] }, { op: 'if', cond: { l: 'total', op: '>', r: 'biogas' }, body: [A('abrir_mercado')], else: [A('pedir_energia')] }],
  intro: 'Cada puesto del mercado necesita energía. ¿Alcanza el biogás (18 kWh)? El programa suma mal y decide al revés: toca los valores y las acciones para corregirlo.',
  hints: ['Primero suma todas las demandas en "total".', 'Después: SI total > biogas ENTONCES pedir_energia SINO abrir_mercado.', { text: 'Suma lista:', partial: [{ op: 'set', var: 'total', expr: 0 }, { op: 'foreach', var: 'd', list: 'demandas', body: [{ op: 'add', var: 'total', expr: 'd' }] }] }]
};

(function () {
  const b = new MapB(150, 20);
  b.ground(0, 40, 16).ground(14, 18, 14);
  b.plat(22, 24, 13).plat(27, 29, 10);
  b.fill(41, 17, 46, 18, '~').ground(41, 46, 19).plat(42, 45, 13);
  b.ground(47, 100, 16);
  b.plat(52, 54, 12).plat(57, 59, 9).plat(84, 86, 12).plat(89, 91, 9).plat(94, 96, 6);
  b.fill(101, 15, 104, 15, '^').ground(101, 104, 16);
  b.plat(101, 104, 12);
  b.ground(105, 149, 16);
  b.fill(140, 0, 140, 15, 'D');
  b.fill(8, 13, 10, 13, '?');
  b.start(3, 15);
  b.seeds(22, 29, 9, 2).seeds(52, 59, 8, 2).seeds(84, 96, 5, 3).seeds(125, 140, 15, 3);
  [6, 20, 35, 50, 66, 80, 98, 110, 126, 142].forEach(x => b.e('L', x, 15));
  b.e('C', 48, 15).e('C', 80, 15).e('C', 107, 15);
  b.e('m', 30, 15, { look: 'tree', color: '#2A7A55', fruit: PAL.orange }).e('m', 62, 15, { look: 'tree', color: '#3FA85A', fruit: PAL.pink }).e('m', 134, 15, { look: 'tree', color: '#2A9A55' });
  b.e('m', 110, 15, { look: 'stall', color: PAL.orange }).e('m', 124, 15, { look: 'stall', color: PAL.lime }).e('m', 138, 15, { look: 'stall', color: PAL.pink });
  b.e('m', 74, 15, { id: 'digestor', look: 'digester', on: () => flag('bio_ok') });
  b.e('m', 68, 15, { look: 'bin', color: PAL.lime, icon: 'organico' }).e('m', 87, 15, { look: 'bin', color: PAL.sky, icon: 'plastico' }).e('m', 91, 15, { look: 'bin', color: PAL.orange, icon: 'madera' });
  const items = WASTE_ITEMS;
  const spots = [[12, 13], [23, 11], [28, 8], [44, 12], [53, 10], [58, 7], [95, 4], [102, 10]];
  items.forEach((it, i) => b.e('i', spots[i][0], spots[i][1], it));
  b.e('*', 9, 11, { id: 'c_bioloop1', hidden: true }).e('*', 146, 5, { id: 'c_bioloop2' });
  b.fill(142, 12, 144, 12, '=').fill(145, 9, 147, 9, '=');
  b.e('E', 35, 15, { type: 'chaos', vx: 30 }).e('E', 64, 15, { type: 'bugglin' }).e('E', 96, 15, { type: 'chaos', vx: -35 }).e('E', 130, 15, { type: 'drainer' });
  b.e('a', 18, 13).e('a', 58, 15).e('a', 116, 15);
  b.e('N', 70, 15, {
    id: 'menta', cast: 'menta', talk: lv => (function* () {
      if (!hasAbility('pack')) {
        yield* talk([
          ['menta', '¿Tú eres la programadora? Bien. Mi biodigestor lleva días parado.', 'enojo'],
          ['menta', 'Por el bosque hay residuos tirados: hojas, cáscaras... y también botellas y latas que NO deben entrar aquí.', 'n'],
          ['menta', 'Si puedes programar un dron, puedes separar una cáscara de una botella.', 'enojo'],
          ['lia', 'Para eso necesito llevar varias cosas... en orden.', 'pensando'],
          ['menta', 'Toma esta mochila de mi nieta. Tiene compartimentos numerados. Del cero en adelante, que es como cuentan los programadores raros.', 'risa']
        ]);
        yield* grant('pack');
        yield* talk([['pix', 'Cada cosa que recojas irá a mochila[0], mochila[1], mochila[2]... Una LISTA con índices.', 'n'], ['menta', 'Trae al menos seis residuos. Y cuidado con esos cubos naranjas: desordenan todo lo que tocan.', 'n']]);
        setQuest('m_bioloop', 'active');
        return;
      }
      if (!flag('bio_ok')) { const n = (G.save.pack || []).length; yield C.say('menta', n >= 6 ? 'Seis o más. Bien. Clasifícalos en la consola, junto al biodigestor.' : `Llevas ${n}. Necesito al menos seis. El bosque no se limpia solo, criatura.`, n >= 6 ? 'n' : 'enojo'); return; }
      yield C.say('menta', 'Biogás limpio y abono para los huertos. Nada se tira: todo se transforma.', 'feliz');
    })()
  });
  b.e('T', 78, 15, {
    id: 'clasificador', look: 'console', color: PAL.lime, verb: 'Clasificador', doneFlag: 'bio_ok', enabled: () => (G.save.pack || []).length >= 6,
    lens: () => ['mochila = [' + (G.save.pack || []).map(i => i.name).join(', ') + ']', 'mochila.length = ' + (G.save.pack || []).length],
    run: lv => (function* () {
      if (flag('bio_ok')) return;
      yield* runPuzzle(cfgBioSorter(), function* (r) {
        setFlag('bio_ok'); G.save.pack = []; lv.updatePower();
        if (r.firstTry) achieve('menta');
        yield* teach('lista'); yield* teach('recorrido');
        AudioSys.sfx('charge');
        yield* talk([
          ['menta', 'Mira eso. Burbujea. Biogás.', 'feliz'],
          ['vendedora', '¡Abuela Menta! Con tanto biogás, ¿y si talamos el bosque de al lado para producir aún más?', 'feliz']
        ]);
        const a = yield C.ask('lia', '¿Talar el bosque para más biogás? (elige tu respuesta)', ['¡Sí! Más energía renovable.', 'No: usemos residuos, no árboles.', 'Depende: ¿cuánto crece el bosque y quién vive en él?'], 'pensando');
        G.save.bioAnswer = a;
        if (a === 0) yield* talk([['menta', '¡Ja! Renovable no significa impacto cero, niña. Si talas más rápido de lo que crece, deja de ser renovable.', 'enojo'], ['lia', 'Tiene razón. Me dejé llevar por el número grande.', 'culpa']]);
        else if (a === 1) yield* talk([['menta', 'Eso es. Los residuos son un recurso. Los árboles vivos también: dan sombra, agua, casa.', 'feliz']]);
        else yield* talk([['menta', 'Buena pregunta. Contexto, recursos, ritmo de crecimiento... y la gente y los animales que viven ahí. Casi siempre: no talar.', 'feliz']]);
        yield* teach('renovable_impacto');
      });
    })()
  });
  b.e('N', 112, 15, {
    id: 'kiwi', cast: 'vendedora', quest: 's_mercado', questNeeds: 'bio_ok', talk: lv => (function* () {
      if (!flag('bio_ok')) { yield C.say('vendedora', 'Sin biogás no hay mercado. ¡Y hoy es día de mercado!', 'triste'); return; }
      if (questState('s_mercado') === 'done') { yield C.say('vendedora', 'Veinte kilovatios-hora y ni uno menos. ¡El mercado brilla!', 'feliz'); return; }
      setQuest('s_mercado', 'active');
      const ok = yield* runPuzzle(CFG_BIO_MERCADO);
      if (ok) setQuest('s_mercado', 'done');
    })()
  });
  b.e('N', 128, 15, {
    id: 'maiz', cast: 'granjero', quest: 's_lista', questNeeds: 'bio_ok', talk: lv => (function* () {
      if (!flag('bio_ok')) { yield C.say('granjero', 'Mi hermano del Valle me contó que arreglaste sus robots. ¡Aquí también hay listas por arreglar!', 'n'); return; }
      if (questState('s_lista') === 'done') { yield C.say('granjero', 'Contar con un contador. ¡Quién lo diría!', 'risa'); return; }
      setQuest('s_lista', 'active');
      const ok = yield* runPuzzle(CFG_BIO_LISTA);
      if (ok) setQuest('s_lista', 'done');
    })()
  });
  b.e('N', 115, 15, { id: 'teo', cast: 'teo', needs: 'bio_ok', talk: [['teo', 'La compuerta de raíces del fondo no se abre. Y nadie sabe dónde está su nodo de control.', 'pensando']] });
  b.e('T', 120, 15, {
    id: 'raices', look: 'console', color: PAL.lime, verb: 'Nodo de raíces', doneFlag: 'restored_bioloop', enabled: () => flag('bio_ok'),
    run: lv => (function* () {
      if (flag('restored_bioloop')) return;
      if (!flag('pixKnows')) {
        yield* talk([
          ['teo', 'Este nodo está muerto. El control real debe estar en otro sitio.', 'pensando'],
          ['pix', 'Sé dónde está ese nodo.', 'n'],
          ['lia', '¿Cómo?', 'sorpresa'],
          ['pix', 'Por intuición.', 'pensando'],
          ['teo', 'Eres un dron.', 'pensando'],
          ['pix', 'Intuición premium.', 'feliz'],
          ['pix', 'Está bajo este mismo panel. Segunda raíz a la izquierda, tres palmos. No me preguntes cómo lo sé. Yo tampoco lo sé.', 'pensando']
        ]);
        setFlag('pixKnows'); unlockCodex('m_pix');
      }
      yield* restoreRegion(lv, 'bioloop', 'Recorrer, decidir, transformar. Nada se tira.');
      yield* talk([['lia', 'PÍX... ¿de verdad no sabes cómo lo supiste?', 'pensando'], ['pix', 'No. Y eso me da un poquito de miedo. Pero solo un poquito. Un 12%.', 'triste']]);
      setQuest('m_gea', 'active');
    })()
  });
  b.e('X', 148, 15, { cond: () => flag('restored_bioloop'), label: 'MAPA' });
  level('bioloop', {
    theme: 'bioloop', region: 'bioloop', title: 'Bosque BioLoop', subtitle: 'Listas y recorridos + biomasa', music: 'bioloop',
    zones: [{ x0: 0, x1: 100, flag: 'bio_ok' }, { x0: 100, x1: 150, flag: 'restored_bioloop' }],
    dyn: { D: { solid: () => !flag('restored_bioloop'), style: 'barrier', color: PAL.lime } },
    quips: ['Los CHAOS PACKET desordenan la mochila. Salta encima para ordenarlos.', 'mochila[0] es el PRIMER elemento. Los programadores empiezan en cero. Es una manía.', 'Huele a compost. Huele a futuro.'],
    objective: lv => !hasAbility('pack') ? 'Habla con la Abuela Menta (biodigestor →)' : !flag('bio_ok') ? `Recoge residuos (${(G.save.pack || []).length}/6) y clasifícalos` : !flag('restored_bioloop') ? 'Busca el nodo de raíces al fondo' : 'Vuelve al mapa (→)',
    hint: lv => !flag('bio_ok') ? 'Los residuos brillan sobre plataformas y en el agua. La Lente (F) te dice de qué tipo son.' : 'El nodo de raíces está pasando el mercado.',
    pointAt: lv => !hasAbility('pack') ? 'menta' : !flag('bio_ok') ? 'clasificador' : 'raices',
    onEnter: lv => (function* () {
      if (flag('bioloop_intro')) return;
      setFlag('bioloop_intro'); unlockCodex('i_bioloop'); unlockCodex('p_menta');
      yield* talk([['pix', 'El Bosque BioLoop. Mercados, granjas, biodigestores... y residuos por todas partes.', 'pensando'], ['teo', 'Las reglas de reciclaje se volvieron locas con el apagón.', 'n'], ['lia', 'Busquemos a quien manda aquí. Seguro que es alguien con MUCHO carácter.', 'risa']]);
    })()
  }, b);
})();

// =====================================================================
//  GEA PROFUNDA
// =====================================================================
const CFG_GEA_FSM = {
  kind: 'fsm', main: true, title: 'La planta sin transiciones', tags: ['ESTADOS', 'EVENTOS', 'GEOTERMIA'], concepts: ['states', 'geothermal'], codex: 'estados', music: 'gea',
  states: ['OFF', 'STARTING', 'RUNNING', 'COOLING', 'FAULT'], events: ['encender', 'temp_ok', 'apagar', 'enfriado', 'sobrecalor', 'diagnostico'], initial: 'OFF',
  start: [{ from: 'OFF', to: 'STARTING', ev: 'encender' }],
  scenarios: [
    { name: 'Arranque normal', from: 'OFF', events: ['encender', 'temp_ok'], expect: 'RUNNING' },
    { name: 'Parada', from: 'RUNNING', events: ['apagar', 'enfriado'], expect: 'OFF' },
    { name: 'Emergencia', from: 'RUNNING', events: ['sobrecalor'], expect: 'FAULT' },
    { name: 'Recuperación', from: 'FAULT', events: ['diagnostico', 'encender', 'temp_ok'], expect: 'RUNNING' },
    { name: 'Sobrecalor al arrancar', from: 'STARTING', events: ['sobrecalor', 'diagnostico'], expect: 'OFF' },
    { name: 'Evento sin sentido', from: 'OFF', events: ['temp_ok'], expect: 'OFF', mustHandle: false }
  ],
  forbidden: [
    { from: 'FAULT', to: 'RUNNING', msg: '¡Transición insegura! FAULT → RUNNING sin diagnóstico. Así es como se rompen las plantas de verdad.' },
    { from: 'OFF', to: 'RUNNING', msg: 'OFF → RUNNING se salta el arranque: la turbina recibiría vapor frío con agua. Peligroso.' },
    { from: 'FAULT', to: 'STARTING', msg: 'FAULT → STARTING: volver a arrancar sin diagnosticar es repetir el fallo.' }
  ],
  intro: 'Toca un estado ORIGEN, luego un DESTINO y elige el evento. PROBAR ejecuta 6 escenarios reales. Toca una etiqueta para borrarla.',
  hints: ['Para cada escenario, ¿qué flecha necesitas? Empieza por el arranque: STARTING --temp_ok--> RUNNING.', 'Desde FAULT solo se sale con "diagnostico"... ¿hacia qué estado seguro?', { text: 'Te añado la parada completa.', apply: sc => { sc.trans.push({ from: 'RUNNING', to: 'COOLING', ev: 'apagar' }, { from: 'COOLING', to: 'OFF', ev: 'enfriado' }); } }],
  okMsg: '¡Seis escenarios, cero transiciones peligrosas!', xp: 60
};
const CFG_GEA_AISLADA = {
  kind: 'seq', title: 'Microred aislada', tags: ['SECUENCIA', 'ESTADOS', 'GEOTERMIA'], concepts: ['states', 'sequence', 'geothermal'], codex: 'estados', label: 'REINICIO',
  intro: 'La aldea minera quedó aislada con su bomba de calor en FAULT. Ordena un reinicio SEGURO.',
  cards: [
    { id: 'dia', label: 'diagnosticar la falla', icon: 'eye', color: PAL.violet }, { id: 'ais', label: 'aislar el circuito', icon: 'lock', color: PAL.sky },
    { id: 'rep', label: 'reparar la pieza', icon: 'gear', color: PAL.orange }, { id: 'arr', label: 'arrancar (STARTING)', icon: 'bolt', color: PAL.sun },
    { id: 'ver', label: 'verificar temperatura', icon: 'temp', color: PAL.lime }, { id: 'for', label: 'forzar RUNNING', icon: 'fire', color: PAL.coral }
  ],
  slots: 5, answer: ['ais', 'dia', 'rep', 'arr', 'ver'],
  why: (i, id) => ({ for: 'Forzar RUNNING desde una falla es la transición más peligrosa de todas.', dia: i === 0 ? 'Diagnosticar con el circuito conectado es arriesgado: primero hay que aislarlo.' : 'Diagnóstico fuera de lugar.', rep: 'No puedes reparar lo que aún no diagnosticaste.', arr: 'Arrancar antes de reparar repite la falla.', ver: 'Verificar es el último paso.', ais: 'Aislar va primero.' }[id]),
  visual: (g, x, y, w, h, sc) => { const d = sc.marks.filter(Boolean).length; PROP_DRAW.geoplant(g, x + w / 2 - 28, y + 20, { t: sc.t, cfg: { state: () => ['FAULT', 'FAULT', 'FAULT', 'OFF', 'STARTING', 'RUNNING'][d] } }, null); },
  hints: ['Antes de tocar nada eléctrico, ¿qué harías por seguridad?', 'Una tarjeta es una trampa peligrosa.', { text: 'Primero: aislar.', apply: sc => { sc.slots[0] = 'ais'; sc.pool = sc.pool.filter(p => p !== 'ais'); } }],
  okMsg: '¡La aldea vuelve a tener calor, sin riesgos!'
};
const CFG_GEA_CRISTAL = {
  kind: 'quiz', title: 'Cristales afinados', tags: ['CONDICIONES', 'DEPURACIÓN'], concepts: ['conditions', 'debugging'], codex: 'operadores', label: 'DIAGNOSTICA',
  question: 'El cristal-sensor de Roca nunca se enciende. Este es su programa. ¿Por qué?',
  code: ['SI temperatura > 300 Y temperatura < 200 ENTONCES', '    encender_cristal', 'FIN SI'],
  options: [
    { text: 'Porque la temperatura nunca llega a 300.', why: 'Aunque llegara a 300, la segunda parte fallaría.' },
    { text: 'Porque ningún número es a la vez mayor que 300 y menor que 200.' },
    { text: 'Porque falta un SINO.', why: 'Un SI sin SINO es válido: simplemente no hace nada si es falso.' },
    { text: 'Porque "Y" debería escribirse "&&".', why: 'En pseudocódigo "Y" está perfecto. El problema es lógico, no de escritura.' }
  ], answer: 1, explain: '¡Exacto! Con "Y" deben cumplirse las dos condiciones. Aquí es imposible: el rango está al revés. Probablemente querían 200 < temperatura < 300.'
};

(function () {
  const b = new MapB(140, 22);
  b.fill(0, 0, 139, 1, '#');
  b.ground(0, 26, 18).ground(10, 14, 17);
  b.fill(27, 19, 34, 19, '^').ground(27, 34, 20);
  b.ground(35, 70, 18);
  b.fill(44, 12, 70, 13, '#');
  b.fill(71, 19, 80, 19, '^').ground(71, 80, 20);
  b.ground(81, 139, 18);
  b.plat(28, 30, 15).plat(32, 33, 13).plat(38, 39, 15).plat(41, 42, 13);
  b.fill(74, 14, 76, 14, '?');
  b.plat(90, 92, 14).plat(96, 98, 11).plat(102, 104, 8);
  b.start(3, 17);
  b.seeds(28, 33, 12, 2).seeds(74, 76, 13, 1).seeds(90, 104, 7, 4);
  [6, 20, 38, 52, 66, 86, 100, 116, 130].forEach(x => b.e('L', x, x >= 44 && x <= 70 ? 11 : 17));
  b.e('C', 36, 17).e('C', 46, 11).e('C', 83, 17).e('C', 110, 17);
  b.e('S', 24, 17, { id: 'v1', state: 'OFF', height: 5 }).e('S', 36, 17, { id: 'v2', state: 'FAULT', height: 7 }).e('S', 70, 17, { id: 'v3', state: 'OFF', height: 6 }).e('S', 82, 17, { id: 'v4', state: 'OFF', height: 5 });
  b.e('m', 62, 11, { id: 'planta', look: 'geoplant', state: () => flag('gea_fsm') ? 'RUNNING' : 'FAULT' });
  b.e('m', 18, 17, { look: 'crystal', color: PAL.violet }).e('m', 94, 17, { look: 'crystal', color: PAL.pink }).e('m', 124, 17, { look: 'crystal', color: PAL.teal });
  b.e('m', 116, 17, { id: 'nucleo', look: 'core', mode: () => 'aurora' });
  b.e('*', 75, 12, { id: 'c_gea1', hidden: true }).e('*', 103, 6, { id: 'c_gea2' });
  b.e('E', 52, 11, { type: 'bugglin' }).e('E', 88, 17, { type: 'drainer' }).e('E', 106, 17, { type: 'bugglin', speed: 30 });
  b.e('a', 8, 17).e('a', 58, 11).e('a', 134, 17);
  b.e('N', 50, 11, {
    id: 'roca', cast: 'minero', talk: lv => (function* () {
      if (!flag('gea_fsm')) { yield* talk([['minero', 'Soy Roca. La planta geotérmica se volvió loca: salta de estado en estado sin reglas.', 'pensando'], ['minero', 'Ayer pasó de FAULT a RUNNING ella solita. Casi nos cuesta un susto enorme.', 'sorpresa'], ['minero', 'Su tablero de estados está aquí al lado. Hay que decirle qué transiciones están permitidas... y cuáles NO.', 'n']]); return; }
      if (!hasAbility('shift')) { yield* talk([['minero', 'Estados claros, transiciones seguras. Toma esta llave de válvulas.', 'feliz']]); yield* grant('shift'); yield* talk([['pix', 'Con STATE SHIFT cambias el estado de un respiradero, siempre por el camino permitido. En RUNNING, el vapor te eleva.', 'n']]); return; }
      yield C.say('minero', 'El núcleo está al fondo. Dicen que allí la voz de AURORA suena distinta.', 'pensando');
    })()
  });
  b.e('T', 56, 11, {
    id: 'tablero', look: 'bigconsole', color: PAL.coral, verb: 'Tablero de estados', doneFlag: 'gea_fsm',
    lens: () => flag('gea_fsm') ? 'estado = {g}RUNNING{/}' : ['estado = {r}FAULT{/}', 'transiciones definidas: {r}1{/}'],
    run: lv => (function* () {
      if (flag('gea_fsm')) return;
      yield* runPuzzle(CFG_GEA_FSM, function* () { setFlag('gea_fsm'); lv.updatePower(); yield* teach('estados'); yield C.say('minero', '¡Por fin una máquina con modales! Ven, que te doy algo.', 'feliz'); });
    })()
  });
  b.e('N', 88, 17, {
    id: 'aldea', cast: 'lina', quest: 's_aislada', questNeeds: 'gea_fsm', talk: lv => (function* () {
      if (!flag('gea_fsm')) { yield C.say('lina', 'Nuestra aldea minera se quedó sin calefacción. ¡Hace un frío de cueva!', 'triste'); return; }
      if (questState('s_aislada') === 'done') { yield C.say('lina', 'Calentita otra vez. Y sin forzar nada.', 'feliz'); return; }
      setQuest('s_aislada', 'active');
      const ok = yield* runPuzzle(CFG_GEA_AISLADA);
      if (ok) setQuest('s_aislada', 'done');
    })()
  });
  b.e('N', 98, 17, {
    id: 'cristalero', cast: 'guardia', quest: 's_cristal', talk: lv => (function* () {
      if (questState('s_cristal') === 'done') { yield C.say('guardia', 'Cambié el programa: SI temperatura > 200 Y temperatura < 300. ¡Brilla!', 'feliz'); return; }
      setQuest('s_cristal', 'active');
      const ok = yield* runPuzzle(CFG_GEA_CRISTAL);
      if (ok) setQuest('s_cristal', 'done');
    })()
  });
  b.e('T', 113, 17, {
    id: 'core', look: 'console', color: PAL.violet, verb: 'Núcleo geotérmico', doneFlag: 'restored_gea', enabled: () => hasAbility('shift'),
    run: lv => (function* () {
      if (flag('restored_gea')) return;
      yield* talk([['lia', 'El núcleo. Si lo reconectamos, toda Gea tendrá calor y luz.', 'decidida']]);
      AudioSys.stopSong(); AudioSys.sfx('aurora');
      yield C.during(1.5, () => { if (Math.random() < 0.5) Particles.spawn({ x: lv.pix.x + 6, y: lv.pix.y + 4, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.6, type: 'bit', color: PAL.pink }); });
      lv.pix.bonkT = 0;
      yield* talk([['pix', 'Lía... algo... resuena. Aquí dentro. En mí.', 'sorpresa'], ['teo', '¡Sus lecturas se disparan! ¡Usa la lente!', 'sorpresa']]);
      lv.lens = true; AudioSys.sfx('debug'); setFlag('pixFragment');
      yield C.wait(1.2);
      yield* talk([
        ['sistema', 'PÍX :: módulo interno detectado :: fragmento_predictivo :: origen = AURORA.predict()'],
        ['lia', 'PÍX... llevas dentro una parte del modelo predictivo de AURORA.', 'sorpresa'],
        ['lia', '¿Sabías esto?', 'pensando'],
        ['pix', 'No.', 'triste']
      ]);
      lv.lens = false;
      yield C.wait(2.2);
      AudioSys.playSong('sad');
      yield* talk([
        ['pix', '¿Soy... AURORA?', 'triste'],
        ['lia', 'Eres PÍX.', 'n'],
        ['pix', 'Eso no respondió.', 'triste'],
        ['lia', 'Era la respuesta importante.', 'decidida']
      ]);
      yield C.wait(1.5);
      setFlag('pixQuiet'); unlockCodex('m_pix');
      yield* restoreRegion(lv, 'gea', 'No todas las transiciones son seguras.');
      yield* talk([['teo', 'PÍX... ¿estás bien?', 'triste'], ['pix', '...', 'triste'], ['lumi', '✦', 'n']]);
      setQuest('m_h2', 'active');
    })()
  });
  b.e('X', 138, 17, { cond: () => flag('restored_gea'), label: 'MAPA' });
  level('gea', {
    theme: 'gea', region: 'gea', title: 'Gea Profunda', subtitle: 'Máquinas de estados + geotermia', music: 'gea',
    zones: [{ x0: 0, x1: 81, flag: 'gea_fsm' }, { x0: 81, x1: 140, flag: 'restored_gea' }],
    quips: ['Aquí dentro hace un calor... geotérmico.', 'Ese respiradero está en FAULT. Nunca pases de FAULT a RUNNING sin diagnóstico.', 'Con STATE SHIFT: OFF → STARTING → RUNNING. El vapor en RUNNING te eleva.'],
    objective: lv => !flag('gea_fsm') ? 'Define transiciones seguras en el tablero de la planta' : !hasAbility('shift') ? 'Habla con Roca' : !flag('restored_gea') ? 'Llega al núcleo geotérmico (→)' : 'Vuelve al mapa (→)',
    hint: lv => !flag('gea_fsm') ? 'Recorre cada escenario: ¿qué flecha falta? Desde FAULT, solo "diagnostico" lleva a OFF.' : 'Usa STATE SHIFT (' + bindName('ability') + ') en los respiraderos para subir con el vapor sobre el magma.',
    pointAt: lv => !flag('gea_fsm') ? 'tablero' : !hasAbility('shift') ? 'roca' : 'core',
    onEnter: lv => (function* () {
      if (flag('gea_intro')) return;
      setFlag('gea_intro'); unlockCodex('i_gea');
      yield* talk([['pix', 'Gea Profunda. Cuevas cálidas, cristales, magma... Mis sensores dicen: "calor". Mis alas dicen: "no".', 'sorpresa'], ['teo', 'La planta geotérmica está en la galería de arriba.', 'n']]);
    })()
  }, b);
})();
