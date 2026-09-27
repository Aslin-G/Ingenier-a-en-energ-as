// =====================================================================
//  BANCO DE RETOS (Modo Docente): 100+ desafíos generados por plantillas
//  Tipos: ordenar, completar, conectar, simular, depurar, predecir,
//  clasificar, construir, diagnosticar, optimizar. (Opción múltiple ≈ 20%)
// =====================================================================
const CHALLENGES = [];
function addCh(o) { o.id = 'ch' + (CHALLENGES.length + 1); CHALLENGES.push(o); }

// ---------- 1. Cadenas energéticas (ordenar) ----------
const CHAINS = [
  { e: 'solar', t: 'Cadena solar', cards: [['sol', 'radiación solar', 'sun', CHAIN_ICONS.sun], ['pan', 'panel fotovoltaico', 'bolt', CHAIN_ICONS.panel], ['inv', 'inversor', 'gear', CHAIN_ICONS.bolt], ['uso', 'lámparas de la casa', 'star', CHAIN_ICONS.lamp]] },
  { e: 'wind', t: 'Cadena eólica', cards: [['vie', 'viento', 'wind', CHAIN_ICONS.turbine], ['asp', 'aspas y rotor', 'gear', CHAIN_ICONS.turbine], ['gen', 'generador', 'bolt', CHAIN_ICONS.bolt], ['red', 'red eléctrica', 'home', CHAIN_ICONS.lamp]] },
  { e: 'hydro', t: 'Cadena hidroeléctrica', cards: [['emb', 'agua embalsada', 'drop', CHAIN_ICONS.water], ['caida', 'caída por la tubería', 'wave', CHAIN_ICONS.water], ['tur', 'turbina', 'gear', CHAIN_ICONS.turbine], ['gen', 'generador', 'bolt', CHAIN_ICONS.bolt]] },
  { e: 'biomass', t: 'Cadena de biogás', cards: [['res', 'residuos orgánicos', 'leaf', CHAIN_ICONS.sun], ['dig', 'biodigestor', 'factory', CHAIN_ICONS.tank], ['gas', 'biogás', 'fire', CHAIN_ICONS.h2], ['coc', 'cocina / generador', 'fire', CHAIN_ICONS.lamp]] },
  { e: 'geothermal', t: 'Cadena geotérmica', cards: [['cal', 'calor del subsuelo', 'fire', CHAIN_ICONS.sun], ['vap', 'vapor', 'cloud', CHAIN_ICONS.water], ['tur', 'turbina', 'gear', CHAIN_ICONS.turbine], ['ele', 'electricidad', 'bolt', CHAIN_ICONS.bolt]] },
  { e: 'hydrogen', t: 'Cadena del hidrógeno', cards: [['ren', 'electricidad renovable', 'bolt', CHAIN_ICONS.bolt], ['ele', 'electrólisis', 'h2', CHAIN_ICONS.electro], ['tan', 'tanque de H2', 'battery', CHAIN_ICONS.tank], ['pil', 'pila de combustible', 'bolt', CHAIN_ICONS.cell]] },
  { e: 'storage', t: 'Ciclo de una batería', cards: [['exc', 'excedente solar', 'sun', CHAIN_ICONS.sun], ['car', 'cargar batería', 'battery', CHAIN_ICONS.battery], ['esp', 'esperar la noche', 'clock', CHAIN_ICONS.battery], ['des', 'descargar a la casa', 'home', CHAIN_ICONS.lamp]] }
];
CHAINS.forEach(c => addCh({
  title: c.t, type: 'ordenar', prog: ['sequence'], energy: [c.e],
  make: () => ({ kind: 'seq', tags: ['SECUENCIA', MASTERY_LABELS[c.e]], concepts: ['sequence', c.e], codex: 'flujo_energia', intro: 'Ordena el camino de la energía: fuente → conversión → (almacenamiento) → uso.', cards: c.cards.map(k => ({ id: k[0], label: k[1], icon: k[2], color: PAL.teal })), answer: c.cards.map(k => k[0]), visual: visualEnergyChain(c.cards.map(k => k[3])), why: () => 'Pregunta: ¿de dónde sale la energía y en qué se convierte en cada paso?', hints: ['¿Cuál es la FUENTE?', '¿Qué máquina transforma la energía?'] })
}));

// ---------- 2. Rutas en cuadrícula (construir) ----------
function genGrid(seed) {
  const rng = mulberry32(seed * 7919 + 13);
  for (let attempt = 0; attempt < 60; attempt++) {
    const w = 7 + Math.floor(rng() * 3), h = 5;
    const g = []; for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) r.push(y === 0 || y === h - 1 || x === 0 || x === w - 1 ? '#' : rng() < 0.18 ? 'c' : '.'); g.push(r); }
    g[1][1] = 'S';
    const free = []; for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === '.') free.push([x, y]);
    if (free.length < 6) continue;
    const k = free[Math.floor(rng() * free.length)]; let t; do { t = free[Math.floor(rng() * free.length)]; } while (t === k);
    g[k[1]][k[0]] = 'k'; g[t[1]][t[0]] = 'T';
    const reach = (from, to) => { const seen = new Set([from + '']); const q = [from]; while (q.length) { const [x, y] = q.shift(); if (x === to[0] && y === to[1]) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, c = g[ny][nx]; if (c !== '#' && c !== 'c' && !seen.has(nx + ',' + ny)) { seen.add(nx + ',' + ny); q.push([nx, ny]); } } } return false; };
    if (reach([1, 1], k) && reach(k, t)) return g.map(r => r.join(''));
  }
  return ['#######', '#S.k.T#', '#######'];
}
for (let i = 1; i <= 12; i++) addCh({
  title: 'Ruta de PÍX #' + i, type: 'construir', prog: ['sequence', i > 8 ? 'debugging' : 'sequence'], energy: ['storage'],
  make: () => ({ kind: 'code', tags: ['SECUENCIA'], concepts: ['sequence'], codex: 'secuencia', palette: ['act:avanzar', 'act:girar_izq', 'act:girar_der', 'act:recoger', 'act:entregar'], actions: GRID_ACTS, world: W_grid({ map: genGrid(i), need: { deliver: 1 } }), intro: 'Lleva la pieza amarilla hasta la ★. PÍX empieza mirando →.', hints: ['Planifica la ruta antes de escribir.', 'Usa avanzar(n) para ahorrar líneas.'] })
});

// ---------- 3. Umbral solar (simular) ----------
const SOLAR_DAYS = [
  ['sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'nube', 'sol', 'sol', 'lluvia', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'sol', 'sol', 'nube', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'lluvia', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol'],
  ['sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol', 'sol', 'nube', 'sol', 'sol', 'sol', 'sol']
];
SOLAR_DAYS.forEach((wx, i) => addCh({
  title: 'Controlador solar · día ' + (i + 1), type: 'simular', prog: ['conditions', 'variables'], energy: ['solar'],
  make: () => ({ kind: 'code', tags: ['SI / SINO', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'condicional', ticks: 16, tickLabel: t => (6 + Math.min(15, t)) + ':00', palette: ['ifelse', 'act:cargar_bateria', 'act:usar_bateria'], actions: { cargar_bateria: { label: 'cargar_bateria' }, usar_bateria: { label: 'usar_bateria' } }, sensors: ['radiacion', 'bateria', 'hora'], condRight: [300, 500, 600, 700, 800, 900, 1000], world: W_solar({ weather: wx, demand: SOL_DEMAND, panels: 6, soc0: 60, K: 3 }), intro: 'Escribe la regla que decide cada hora. Ningún apagón.', hints: ['SI radiacion > umbral → cargar SINO usar.', 'Si el umbral es bajo, "cargas" cuando el sol no alcanza.'] })
}));

// ---------- 4. Depurar condiciones invertidas (depurar) ----------
const DEBUG_SETS = [
  ['Sensor loco del mercado', 'solar', () => ({ world: W_solar({ weather: SOLAR_DAYS[1], demand: SOL_DEMAND, panels: 6, soc0: 60, K: 3 }), ticks: 16, sensors: ['radiacion', 'bateria'], condRight: [500, 700, 800, 900], palette: ['ifelse', 'act:cargar_bateria', 'act:usar_bateria'], actions: { cargar_bateria: { label: 'cargar_bateria' }, usar_bateria: { label: 'usar_bateria' } }, start: [{ op: 'if', cond: { l: 'radiacion', op: '<', r: 800 }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }] })],
  ['Flores al revés', 'solar', () => ({ world: W_flowers({ weather: ['sol', 'sol', 'sol', 'sol', 'nube', 'lluvia', 'sol', 'sol'] }), ticks: 8, sensors: ['radiacion'], condRight: [100, 300, 500], palette: ['ifelse', 'act:abrir_flores', 'act:cerrar_flores'], actions: { abrir_flores: { label: 'abrir_flores' }, cerrar_flores: { label: 'cerrar_flores' } }, start: [{ op: 'if', cond: { l: 'radiacion', op: '<', r: 300 }, body: [A('abrir_flores')], else: [A('cerrar_flores')] }] })],
  ['Prioridad invertida', 'storage', () => ({ world: W_dispatch({ bats: [{ name: 'A', soc: 90, eff: 0.9 }, { name: 'B', soc: 80, eff: 0.95 }], demand: [2, 2, 2, 2, 2, 2] }), ticks: 6, sensors: ['soc_A', 'soc_B'], condRight: ['soc_A', 'soc_B'], palette: ['ifelse', 'act:usar_A', 'act:usar_B'], actions: { usar_A: { label: 'usar_A' }, usar_B: { label: 'usar_B' } }, start: [{ op: 'if', cond: { l: 'soc_A', op: '<', r: 'soc_B' }, body: [A('usar_A')], else: [A('usar_B')] }] })],
  ['Viento sin medir', 'wind', () => ({ world: W_turbine({ wind0: 8, gusts: [8, 7, 6, 5, 4, 3, 2], heat: 2, check: st => st.gen > 0 ? { ok: true, msg: '¡Bucle con salida!' } : { ok: false, msg: 'No generó.' } }), loopLimit: 25, sensors: ['viento'], condRight: [2, 3, 4], palette: ['while', 'act:medir_viento', 'act:generar'], actions: TURB_ACTS, start: [A('medir_viento'), { op: 'while', cond: { l: 'viento', op: '>', r: 3 }, body: [A('generar')] }] })],
  ['Hora que no avanza', 'wind', () => ({ world: W_accum({ data: [1, 4, 6, 3], var: 'total', check: (st, env) => env.vars.total === 14 ? { ok: true, msg: '¡14 kWh!' } : { ok: false, msg: 'total debería ser 14.' } }), loopLimit: 20, sensors: ['hora', 'produccion'], condRight: [3, 4, 5], exprOptions: { set: [0], add: ['produccion'] }, palette: ['while', 'set:total', 'add:total', 'act:siguiente_hora'], actions: { siguiente_hora: { label: 'siguiente_hora' } }, start: [{ op: 'set', var: 'total', expr: 0 }, { op: 'while', cond: { l: 'hora', op: '<', r: 4 }, body: [{ op: 'add', var: 'total', expr: 'produccion' }] }] })],
  ['Contador sin inicializar', 'biomass', () => ({ world: W_counter({ items: [{ name: 'hojas', type: 'organico' }, { name: 'lata', type: 'metal' }, { name: 'fruta', type: 'organico' }] }), sensors: ['tipo'], ops: ['==', '!='], condRight: ['organico', 'metal'], defaults: { itemVar: 'residuo' }, exprOptions: { set: [0], add: [1] }, palette: ['set:organicos', 'foreach:residuos', 'if', 'add:organicos'], start: [{ op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'organico' }, body: [{ op: 'add', var: 'organicos', expr: 1 }], else: null }] }] })],
  ['Plástico en el biodigestor', 'biomass', () => ({ world: W_sorter({ items: [{ name: 'bolsa', type: 'plastico' }, { name: 'cáscara', type: 'organico' }, { name: 'botella', type: 'plastico' }], bins: ['biodigestor', 'reciclaje'], rule: t => t === 'organico' ? 'biodigestor' : 'reciclaje' }), sensors: ['tipo'], ops: ['==', '!='], condRight: ['organico', 'plastico'], defaults: { itemVar: 'residuo' }, palette: ['foreach:residuos', 'ifelse', 'act:a_biodigestor', 'act:a_reciclaje'], actions: BIO_ACTS, start: [{ op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '!=', r: 'organico' }, body: [A('a_biodigestor')], else: [A('a_reciclaje')] }] }] })],
  ['Robot que riega de más', 'storage', () => ({ world: W_grid({ map: ['#######', '#S.p.p#', '#######'], bot: 'robot', floor: '#A0643C', wall: '#3FA85A', need: { plants: true } }), palette: ['act:avanzar', 'act:regar'], actions: GRID_ACTS, start: [A('avanzar', 2), A('regar'), A('regar'), A('avanzar', 2), A('regar')] })]
];
DEBUG_SETS.forEach(([t, e, mk]) => addCh({ title: 'Depurar: ' + t, type: 'depurar', prog: ['debugging', 'conditions'], energy: [e], make: () => Object.assign({ kind: 'code', tags: ['DEPURACIÓN', MASTERY_LABELS[e]], concepts: ['debugging', e], codex: 'depuracion', intro: 'Este programa tiene un error. Ejecútalo, observa la traza y corrígelo.', hints: ['Usa PASO para ir línea a línea.', 'Revisa operadores, orden y valores iniciales.'] }, mk()) }));

// ---------- 5. Bucles con turbina (completar) ----------
[[6, 60, 'temperatura'], [8, 80, 'temperatura'], [5, 50, 'rpm'], [7, 90, 'rpm'], [4, 40, 'temperatura'], [6, 100, 'rpm'], [9, 70, 'temperatura'], [3, 45, 'rpm']].forEach(([heat, target, key], i) => addCh({
  title: `Turbina #${i + 1}: ≥ ${target} rpm`, type: 'completar', prog: ['loops'], energy: ['wind'],
  make: () => ({ kind: 'code', tags: ['BUCLES', 'EÓLICA'], concepts: ['loops', 'wind'], codex: key === 'rpm' ? 'repetir' : 'mientras', palette: ['repeat', 'while', 'act:ajustar_aspas', 'act:medir_viento'], actions: TURB_ACTS, sensors: ['temperatura', 'rpm', 'viento'], condRight: [30, 40, 50, 60, 70, 80, 90, 100], values: { repeat: [1, 2, 3, 4, 5, 6, 8, 10] }, defaults: { wcond: { l: key, op: '<', r: key === 'rpm' ? target : 70 }, n: 3 }, world: W_turbine({ heat, check: st => st.broken ? { ok: false, msg: 'Sobrecalentada.' } : st.rpm < target ? { ok: false, msg: `Solo ${Math.round(st.rpm)} rpm; necesita ${target}.` } : { ok: true, msg: `${Math.round(st.rpm)} rpm a ${Math.round(st.temp)}°.` } }), intro: `Cada ajuste suma rpm y calienta +${heat}°. Llega a ${target} rpm sin pasar de 90°.`, hints: ['REPETIR n VECES o MIENTRAS con una condición que termine.', 'Calcula: ¿cuántos ajustes hacen falta?'] })
}));

// ---------- 6. Predicción (opción múltiple) ----------
for (let i = 0; i < 5; i++) {
  const n = 3 + i, k = 2 + (i % 3);
  addCh({ title: `Predice el acumulador #${i + 1}`, type: 'predecir', prog: ['loops', 'variables'], energy: ['wind'], make: () => ({ kind: 'quiz', label: 'PREDICE', tags: ['BUCLES', 'ACUMULADOR'], concepts: ['loops', 'variables'], codex: 'acumulador', question: '¿Cuánto vale "total" al terminar?', code: ['total ← 0', `REPETIR ${n} VECES`, `    total ← total + ${k}`, 'FIN REPETIR'], options: shuffle([{ text: String(n * k) }, { text: String(n + k), why: 'Suma cada vuelta, no una sola vez.' }, { text: String((n - 1) * k), why: 'Cuenta bien: el bucle da ' + n + ' vueltas.' }, { text: String(k), why: 'total se ACUMULA, no se reemplaza.' }], mulberry32(i + 5)).map(o => o), answer: -1, explain: `${n} vueltas × ${k} = ${n * k}.` }) });
}
for (let i = 0; i < 5; i++) {
  const U = [500, 700, 800, 600, 900][i], r = [650, 640, 950, 450, 880][i], yes = r > U;
  addCh({ title: `Predice la decisión solar #${i + 1}`, type: 'predecir', prog: ['conditions'], energy: ['solar'], make: () => ({ kind: 'quiz', label: 'PREDICE', tags: ['SI / SINO', 'SOLAR'], concepts: ['conditions', 'solar'], codex: 'condicional', question: `radiacion = ${r}. ¿Qué hace el controlador?`, code: [`SI radiacion > ${U} ENTONCES`, '    cargar_bateria', 'SINO', '    usar_bateria', 'FIN SI'], options: [{ text: 'cargar_bateria', why: `${r} no es mayor que ${U}.` }, { text: 'usar_bateria', why: `${r} sí es mayor que ${U}.` }, { text: 'las dos cosas', why: 'SI/SINO elige solo una rama.' }, { text: 'nada', why: 'Siempre se ejecuta una rama.' }], answer: yes ? 0 : 1, explain: `${r} ${yes ? '>' : '≤'} ${U} → ${yes ? 'cargar_bateria' : 'usar_bateria'}.` }) });
}
for (let i = 0; i < 5; i++) {
  const start = [20, 30, 10, 40, 25][i], step = [10, 15, 20, 10, 5][i], lim = [60, 80, 70, 90, 45][i];
  const it = Math.max(0, Math.ceil((lim - start) / step));
  addCh({ title: `Predice las vueltas #${i + 1}`, type: 'predecir', prog: ['loops'], energy: ['geothermal'], make: () => ({ kind: 'quiz', label: 'PREDICE', tags: ['MIENTRAS', 'GEOTERMIA'], concepts: ['loops', 'geothermal'], codex: 'mientras', question: '¿Cuántas veces se ejecuta "calentar"?', code: [`temp ← ${start}`, `MIENTRAS temp < ${lim} HACER`, '    calentar', `    temp ← temp + ${step}`, 'FIN MIENTRAS'], options: shuffle([{ text: String(it) }, { text: String(it + 1), why: 'Cuando temp llega al límite, la condición ya es FALSA.' }, { text: String(Math.max(0, it - 1)), why: 'Recorre cada vuelta con cuidado.' }, { text: 'infinitas', why: 'temp cambia en cada vuelta: el bucle termina.' }], mulberry32(i + 50)), answer: -1, explain: `temp va ${start} → ${lim}: ${it} vueltas.` }) });
}
CHALLENGES.filter(c => c.type === 'predecir').forEach(c => { const mk = c.make; c.make = () => { const cfg = mk(); if (cfg.answer < 0) cfg.answer = cfg.options.findIndex(o => !o.why); return cfg; }; });

// ---------- 7. Funciones hidráulicas (construir) ----------
[[[2, 10], [3, 5], [1, 20]], [[4, 5], [2, 8], [5, 4]], [[3, 6], [3, 8], [2, 12]], [[1, 15], [4, 6], [2, 5]], [[5, 5], [2, 10], [3, 12]], [[2, 6], [2, 15], [4, 8]]].forEach((gs, i) => addCh({
  title: 'Forja de funciones #' + (i + 1), type: 'construir', prog: ['functions'], energy: ['hydro'],
  make: () => Object.assign({}, CFG_HYD_FORJA, { main: false, stages: null, start: [], functions: { generarEnergia: { params: ['caudal', 'altura'], body: [], returns: 'p1', defaults: { caudal: 1, altura: 5 } } }, exprOptions: Object.assign({}, CFG_HYD_FORJA.exprOptions, { 'arg:generarEnergia:0': [1, 2, 3, 4, 5], 'arg:generarEnergia:1': [4, 5, 6, 8, 10, 12, 15, 20] }), world: W_hydro({ gates: gs.map(([c, h]) => ({ caudal: c, altura: h })), check: CFG_HYD_FORJA.world.check }), intro: 'Define generarEnergia(caudal, altura) y llámala una vez por turbina (3 líneas en PRINCIPAL).' })
}));

// ---------- 8. Clasificar listas (clasificar) ----------
for (let i = 0; i < 8; i++) {
  const rng = mulberry32(900 + i);
  const items = []; const n = 4 + (i % 4);
  for (let k = 0; k < n; k++) items.push(Object.assign({}, WASTE_ITEMS[Math.floor(rng() * WASTE_ITEMS.length)]));
  addCh({ title: 'Clasificador #' + (i + 1), type: 'clasificar', prog: ['arrays', 'conditions'], energy: ['biomass'], make: () => { const c = cfgBioSorter(); c.main = false; c.stages = null; c.world = W_sorter({ items: items.map(x => ({ name: x.name, type: x.type })), bins: ['biodigestor', 'reciclaje', 'secado'], rule: BIO_RULE }); c.intro = 'Orgánico → biodigestor, madera → secado, lo demás → reciclaje.'; return c; } });
}

// ---------- 9. Máquinas de estados (diagnosticar) ----------
const FSM_VARIANTS = [[0, 1], [0, 2, 3], [0, 1, 2], [2, 3, 4], [0, 1, 2, 3], [0, 1, 2, 3, 4, 5]];
FSM_VARIANTS.forEach((sel, i) => addCh({ title: 'Planta geotérmica #' + (i + 1), type: 'diagnosticar', prog: ['states'], energy: ['geothermal'], make: () => Object.assign({}, CFG_GEA_FSM, { main: false, scenarios: sel.map(k => CFG_GEA_FSM.scenarios[k]), intro: 'Define solo las transiciones necesarias para estos escenarios, sin atajos peligrosos.' }) }));

// ---------- 10. Ordenar baterías (ordenar) ----------
for (let i = 0; i < 8; i++) {
  const rng = mulberry32(300 + i), n = 4 + (i % 3);
  const items = []; for (let k = 0; k < n; k++) items.push({ name: String.fromCharCode(65 + k), soc: 5 + Math.floor(rng() * 95) });
  addCh({ title: 'SORT GRID #' + (i + 1), type: 'ordenar', prog: ['sorting'], energy: ['storage'], make: () => Object.assign({}, CFG_BAT_SORT, { main: false, items: items.map(x => ({ ...x })), desc: i % 2 === 0, intro: i % 2 === 0 ? 'Ordena de MAYOR a MENOR SOC.' : 'Ordena de MENOR a MAYOR SOC (para cargar primero las más vacías).' }) });
}

// ---------- 11. Búsqueda binaria (optimizar) ----------
[[8, 5], [16, 3], [16, 11], [8, 1], [16, 14], [16, 7]].forEach(([n, tgt], i) => addCh({
  title: `Búsqueda binaria #${i + 1} (${n} registros)`, type: 'optimizar', prog: ['search'], energy: ['storage'],
  make: () => { const items = []; for (let k = 0; k < n; k++) items.push({ name: String(k * 3 + 2).padStart(2, '0') + ':00', t: k }); return Object.assign({}, CFG_BAT_SEARCH, { main: false, items, targetVal: tgt, target: items[tgt].name, limit: Math.ceil(Math.log2(n)) + (n === 16 ? 0 : 1), intro: `Encuentra el registro de las ${items[tgt].name} en ${Math.ceil(Math.log2(n)) + (n === 16 ? 0 : 1)} intentos o menos.` }); }
}));

// ---------- 12. Diagnóstico energético (opción múltiple) ----------
const DIAG = [
  ['La batería se vació a las 20:00 después de un día soleado.', ['La demanda nocturna es alta y no se reservó suficiente carga.', 'Los paneles producen más de noche.', 'La batería se carga sola de noche.', 'El viento apagó los paneles.'], 0, 'storage'],
  ['Un panel produce la mitad que sus vecinos al mediodía.', ['Está a la sombra o sucio.', 'Es de noche.', 'La batería está llena.', 'Hay demasiado sol.'], 0, 'solar'],
  ['El aerogenerador está quieto con viento de 30 m/s.', ['Se frenó por seguridad: demasiado viento.', 'No hay viento.', 'Es de día.', 'La batería lo impide.'], 0, 'wind'],
  ['La turbina hidráulica produce menos en verano.', ['Hay menos caudal por la sequía.', 'El agua pesa menos en verano.', 'Las turbinas se cansan.', 'Hay más sol.'], 0, 'hydro'],
  ['El biodigestor dejó de producir biogás.', ['Entró plástico y alteró el proceso.', 'Había demasiadas cáscaras.', 'Llovió.', 'Es de noche.'], 0, 'biomass'],
  ['La red se apaga cada noche del festival.', ['Pico de demanda nocturna sin almacenamiento suficiente.', 'El festival produce energía.', 'Las lámparas no consumen.', 'Sobra energía.'], 0, 'microgrid'],
  ['El hidrógeno solo devuelve un tercio de la energía usada.', ['Cada conversión pierde energía.', 'El hidrógeno se evapora siempre.', 'Es un error del medidor.', 'El agua absorbe la electricidad.'], 0, 'hydrogen'],
  ['La planta geotérmica pasó de FAULT a RUNNING y se dañó.', ['Faltó el diagnóstico antes de reiniciar.', 'La geotermia no funciona de noche.', 'Hacía demasiado frío.', 'Faltó sol.'], 0, 'geothermal']
];
DIAG.forEach(([q, opts, ans, e], i) => addCh({ title: 'Diagnóstico #' + (i + 1), type: 'diagnosticar', prog: ['debugging'], energy: [e], make: () => ({ kind: 'quiz', label: 'DIAGNOSTICA', tags: ['DIAGNÓSTICO', MASTERY_LABELS[e]], concepts: ['debugging', e], codex: e === 'storage' ? 'almacenamiento' : e === 'microgrid' ? 'microred' : e === 'hydrogen' ? 'hidrogeno' : e === 'geothermal' ? 'geotermia' : e === 'biomass' ? 'biomasa' : e === 'hydro' ? 'hidro' : e === 'wind' ? 'eolica' : 'solar', question: q, options: opts.map((t, k) => ({ text: t, why: k === ans ? null : 'Piensa en cómo funciona esa fuente y qué la limita.' })), answer: ans, explain: 'Diagnóstico correcto: ' + opts[ans] }) }));

// ---------- 13. Microred (optimizar) ----------
Object.keys(MG_SCENARIOS).forEach(k => addCh({ title: 'Microred: ' + MG_SCENARIOS[k].name, type: 'optimizar', prog: ['optimization', 'conditions'], energy: ['microgrid', 'storage'], make: () => Object.assign({}, CFG_PRISMA_MG, { main: false, scenario: MG_SCENARIOS[k], scenarios: [MG_SCENARIOS[k]], criteria: { maxBlackout: k === 'tormenta' ? 1 : 0, noSafety: true }, intro: 'Diseña reglas para este día. Sin apagones y sin vaciar la reserva.' }) }));
addCh({ title: 'Microred: semana completa', type: 'optimizar', prog: ['optimization'], energy: ['microgrid'], make: () => Object.assign({}, CFG_PRISMA_MG, { main: false, scenarios: [MG_SCENARIOS.tipico, MG_SCENARIOS.nublado, MG_SCENARIOS.festival, MG_SCENARIOS.sinsol], criteria: { maxBlackout: 0, noSafety: true, maxShare: 0.6 } }) });

// ---------- 14. Pipelines de hidrógeno (ordenar) ----------
[0, 1, 2].forEach(i => addCh({ title: 'Pipeline H2 #' + (i + 1), type: 'ordenar', prog: ['sequence', 'functions'], energy: ['hydrogen'], make: () => { const c = Object.assign({}, CFG_H2_PIPE, { main: false }); if (i === 1) c.cards = c.cards.filter(x => x.id !== 'carb'); if (i === 2) { c.cards = c.cards.filter(x => x.id !== 'pozo' && x.id !== 'carb'); c.intro = 'Versión sin trampas: fíjate en cuánta energía se pierde en cada etapa.'; } return c; } }));

// ---------- 15. Acumuladores (completar) ----------
[[3, 5, 2, 6], [4, 4, 4, 4, 4], [1, 2, 3, 4, 5, 6], [7, 0, 3, 5], [2, 9, 1], [6, 6, 2, 2, 8]].forEach((data, i) => {
  const sum = data.reduce((a, b) => a + b, 0);
  addCh({ title: `Energía del día #${i + 1}`, type: 'completar', prog: ['loops', 'variables'], energy: ['solar'], make: () => ({ kind: 'code', tags: ['ACUMULADOR', 'SOLAR'], concepts: ['loops', 'variables', 'solar'], codex: 'acumulador', palette: ['set:total', 'foreach:produccion_dia', 'add:total'], defaults: { itemVar: 'p' }, exprOptions: { set: [0, 1], add: ['p', 1] }, world: W_accum({ data, var: 'total', color: PAL.sun, check: (st, env) => env.vars.total === sum ? { ok: true, msg: `total = ${sum} kWh.` } : { ok: false, msg: `total = ${env.vars.total}; debería ser ${sum}.` } }), intro: 'Suma la producción de todas las horas con un PARA CADA.', hints: ['total ← 0 antes del bucle.', 'Dentro: total ← total + p.'] }) });
});
