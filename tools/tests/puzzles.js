// Resuelve automáticamente cada puzzle principal con una solución de referencia,
// comprueba que las soluciones incorrectas fallan con explicación y construye los 115 retos.
// Uso: node tools/tests/puzzles.js
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  const file = gameFile, out = outDir + '/puzzles';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + file + '#level=puerto');
  await p.waitForTimeout(800);
  await p.evaluate(() => { LL.Cut.abort(); LL.G.save.settings.confidence = false; });
  const results = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const A = LL.A, C = LL.cfg;
    const push = cfg => { let res = null; const s = LL.makePuzzleScene(cfg, r => res = r); LL.Scenes.push(s); if (s.speed !== undefined) s.speed = 3; return { s, get res() { return res; } }; };
    const waitFor = async (fn, ms = 20000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await sleep(50); } return false; };
    const out = {};
    const code = async (name, cfg, stageProgs, fnBodies) => {
      const h = push(cfg); const s = h.s;
      try {
        for (let i = 0; i < stageProgs.length; i++) {
          if (stageProgs[i]) s.prog = JSON.parse(JSON.stringify(stageProgs[i]));
          if (fnBodies && fnBodies[i]) for (const k in fnBodies[i]) s.functions[k].body = JSON.parse(JSON.stringify(fnBodies[i][k]));
          s.startRun(false);
          await waitFor(() => s.state !== 'running' && s.state !== 'paused');
          if (s.stageDone) { s.nextStage(); s.speed = 3; continue; }
          if (s.state === 'error') { out[name] = 'FAIL stage ' + i + ': ' + s.msg; break; }
        }
        if (!out[name]) out[name] = s.result && s.result.success ? 'OK' : 'NO RESULT: ' + s.state + ' ' + s.msg;
      } catch (e) { out[name] = 'EXC ' + e.message; }
      if (LL.Scenes.top() === s) s.exit(s.result);
    };
    const R = (x) => x;
    // Puerto
    await code('puerto_route', C.CFG_PUERTO_ROUTE, [null, [A('avanzar', 2), A('recoger'), A('avanzar', 2), A('girar_der'), A('avanzar', 2), A('entregar')], [A('girar_der'), A('avanzar', 1), A('girar_izq'), A('avanzar', 4), A('recoger'), A('girar_der'), A('avanzar', 1), A('girar_der'), A('avanzar', 4), A('entregar')]]);
    await code('puerto_carrera', C.CFG_PUERTO_CARRERA, [[A('avanzar', 7), A('girar_der'), A('avanzar', 2)]]);
    await code('puerto_carrera_inicio', C.CFG_PUERTO_CARRERA, [null]);
    // Valle
    await code('valle_ruta', C.CFG_VALLE_RUTA, [[A('avanzar', 2), A('regar'), A('avanzar', 2), A('regar'), A('avanzar', 1), A('girar_der'), A('avanzar', 1), A('regar')], [A('avanzar', 3), A('regar'), A('avanzar', 3), A('girar_der'), A('avanzar', 2), A('regar'), A('girar_der'), A('avanzar', 6), A('regar')]]);
    await code('valle_sacos', C.CFG_VALLE_SACOS, [[{ op: 'set', var: 'sacos', expr: 0 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }, A('llega_carro'), { op: 'add', var: 'sacos', expr: 4 }]]);
    // Solaria
    await code('sol_flores', C.CFG_SOL_FLORES, [[{ op: 'if', cond: { l: 'radiacion', op: '>', r: 300 }, body: [A('abrir_flores')], else: [A('cerrar_flores')] }]]);
    await code('sol_sensor', C.CFG_SOL_SENSOR, [[{ op: 'if', cond: { l: 'radiacion', op: '>', r: 800 }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }]]);
    for (const U of [500, 700, 800, 900, 1000]) await code('sol_sensor_U' + U, C.CFG_SOL_SENSOR, [[{ op: 'if', cond: { l: 'radiacion', op: '>', r: U }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }]]);
    await code('sol_matriz', C.CFG_SOL_MATRIZ, [[{ op: 'set', var: 'total', expr: 0 }, { op: 'add', var: 'total', expr: 'fila1' }, { op: 'add', var: 'total', expr: 'fila2' }, { op: 'add', var: 'total', expr: 'fila3' }]]);
    // Aeris
    await code('aeris_molino', C.CFG_AERIS_MOLINO, [null, [{ op: 'while', cond: { l: 'temperatura', op: '<', r: 70 }, body: [A('ajustar_aspas'), A('medir_viento')] }]]);
    await code('aeris_molino_orig', C.CFG_AERIS_MOLINO, [null, null]);
    await code('aeris_viento', C.CFG_AERIS_VIENTO, [[A('medir_viento'), { op: 'while', cond: { l: 'viento', op: '>', r: 3 }, body: [A('generar'), A('medir_viento')] }]]);
    await code('aeris_bucle', C.CFG_AERIS_BUCLE, [[{ op: 'set', var: 'total', expr: 0 }, { op: 'while', cond: { l: 'hora', op: '<', r: 6 }, body: [{ op: 'add', var: 'total', expr: 'produccion' }, A('siguiente_hora')] }]]);
    // Hydria
    await code('hyd_forja', C.CFG_HYD_FORJA, [[{ op: 'call', fn: 'generarEnergia', args: [3, 10], into: 'p1' }, { op: 'call', fn: 'generarEnergia', args: [2, 15], into: 'p2' }, { op: 'call', fn: 'generarEnergia', args: [4, 6], into: 'p3' }]], [{ generarEnergia: [{ op: 'ret', expr: { bin: '*', a: { bin: '*', a: 'caudal', b: 'altura' }, b: 8 } }] }]);
    await code('hyd_rio', C.CFG_HYD_RIO, [[{ op: 'call', fn: 'abrirCompuerta', args: [3] }, { op: 'call', fn: 'abrirCompuerta', args: [2] }, { op: 'call', fn: 'abrirCompuerta', args: [1] }]]);
    await code('hyd_dup', C.CFG_HYD_DUP, [[{ op: 'call', fn: 'revisarTurbina', args: [1] }, { op: 'call', fn: 'revisarTurbina', args: [2] }, { op: 'call', fn: 'revisarTurbina', args: [3] }]], [{ revisarTurbina: [A('cerrar_valvula'), A('limpiar_rejilla'), A('abrir_valvula')] }]);
    // BioLoop
    const fe = { op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'organico' }, body: [A('a_biodigestor')], else: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'madera' }, body: [A('a_secado')], else: [A('a_reciclaje')] }] }] };
    await code('bio_sorter', C.cfgBioSorter(), [null, [fe]]);
    await code('bio_lista', C.CFG_BIO_LISTA, [[{ op: 'set', var: 'organicos', expr: 0 }, { op: 'foreach', var: 'residuo', list: 'residuos', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'organico' }, body: [{ op: 'add', var: 'organicos', expr: 1 }], else: null }] }]]);
    await code('bio_mercado', C.CFG_BIO_MERCADO, [[{ op: 'set', var: 'total', expr: 0 }, { op: 'foreach', var: 'd', list: 'demandas', body: [{ op: 'add', var: 'total', expr: 'd' }] }, { op: 'if', cond: { l: 'total', op: '>', r: 'biogas' }, body: [A('pedir_energia')], else: [A('abrir_mercado')] }]]);
    // Batería (code)
    await code('bat_beta', C.CFG_BAT_BETA, [[{ op: 'if', cond: { l: 'soc_A', op: '>', r: 'soc_B' }, body: [A('usar_A')], else: [A('usar_B')] }]]);
    await code('bat_beta_bad', C.CFG_BAT_BETA, [[A('usar_A')]]);
    await code('bat_bug', C.CFG_BAT_BUG, [[{ op: 'if', cond: { l: 'soc_A', op: '>', r: 'soc_B' }, body: [A('usar_A')], else: [A('usar_B')] }]]);
    // Secuencias
    const seq = async (name, cfg, slots) => { const h = push(cfg); const s = h.s; s.slots = slots.slice(); s.pool = s.pool.filter(x => !slots.includes(x)); s.run(); await waitFor(() => s.state !== 'running'); out[name] = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); };
    await seq('fest_boot', C.CFG_FEST_BOOT, ['ini', 'dem', 'opt', 'on']);
    await seq('puerto_chain', C.CFG_PUERTO_CHAIN, ['cap', 'con', 'alm', 'ali']);
    await seq('valle_molino', C.CFG_VALLE_MOLINO, ['ori', 'fre', 'med', 'gen']);
    await seq('gea_aislada', C.CFG_GEA_AISLADA, ['ais', 'dia', 'rep', 'arr', 'ver']);
    await seq('h2_pipe', C.CFG_H2_PIPE, ['agua', 'elec', 'eli', 'h2', 'tan', 'pil', 'bar']);
    await seq('h2_barco', C.CFG_H2_BARCO, ['ven', 'con', 'fug', 'abr', 'cer', 'des']);
    // Flujo
    { const h = push(C.CFG_SOL_FLOW); const s = h.s; s.nodes = [{ id: 1, type: 'start', c: 1, r: 0, next: 3 }, { id: 3, type: 'dec', c: 1, r: 2, yes: 4, no: 5 }, { id: 4, type: 'charge', c: 0, r: 3, next: 2 }, { id: 5, type: 'use', c: 2, r: 3, next: 2 }, { id: 2, type: 'end', c: 1, r: 5 }]; s.threshold = 800; s.cfg.fast = true; s.run(); await waitFor(() => !s.running, 60000); out.sol_flow = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result);
      const h2 = push(C.CFG_SOL_FLOW); const s2 = h2.s; s2.nodes = JSON.parse(JSON.stringify(s.nodes)); s2.threshold = 400; s2.cfg.fast = true; s2.run(); await waitFor(() => !s2.running, 60000); out.sol_flow_U400_should_fail = s2.result ? 'UNEXPECTED OK' : 'failed as expected: ' + s2.msg.slice(0, 90); s2.exit(null); }
    // Estados
    { const h = push(C.CFG_GEA_FSM); const s = h.s; s.trans = [['OFF', 'STARTING', 'encender'], ['STARTING', 'RUNNING', 'temp_ok'], ['RUNNING', 'COOLING', 'apagar'], ['COOLING', 'OFF', 'enfriado'], ['RUNNING', 'FAULT', 'sobrecalor'], ['FAULT', 'OFF', 'diagnostico'], ['STARTING', 'FAULT', 'sobrecalor']].map(([from, to, ev]) => ({ from, to, ev })); s.run(); await waitFor(() => s.state !== 'running', 30000); out.gea_fsm = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
    // Ordenar
    { const h = push(C.CFG_BAT_SORT); const s = h.s; let guard = 0; while (!s.result && guard++ < 200) { if (!s.anim) s.decide(s.shouldSwap(s.arr[s.i], s.arr[s.i + 1])); await sleep(420); } out.bat_sort = s.result ? 'OK comps=' + s.comps : 'FAIL'; s.exit(s.result); }
    { const h = push(C.CFG_BAT_SEARCH); const s = h.s; let lo = 0, hi = 15; while (!s.result) { const m = Math.floor((lo + hi) / 2); s.inspect(m); const v = s.arr[m].t; if (v < 13) lo = m + 1; else hi = m - 1; if (lo > hi && !s.result) break; await sleep(50); } out.bat_search = s.result ? 'OK tries=' + s.inspected.length : 'FAIL ' + s.msg; s.exit(s.result); }
    // Microred
    { const good = [['excedente', 'cargar_bateria'], ['excedente', 'electrolizar'], ['deficit', 'usar_bateria'], ['deficit', 'pila_h2'], ['deficit', 'hidro_extra']].map(([cond, act]) => ({ cond, act }));
      for (const [n, cfg] of [['prisma_mg', C.CFG_PRISMA_MG], ['prisma_fest', C.CFG_PRISMA_FEST], ['prisma_sinsol', C.CFG_PRISMA_SINSOL]]) { const h = push(cfg); const s = h.s; s.rules = JSON.parse(JSON.stringify(good)); s.run(); await waitFor(() => !s.animating, 30000); out[n] = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
      const h = push(C.CFG_PRISMA_MG); const s = h.s; s.run(); await waitFor(() => !s.animating, 30000); out.prisma_basic_should_fail = s.result ? 'UNEXPECTED OK' : 'failed as expected'; s.exit(null); }
    // Fases de Perfect Zero
    { const cfg = C.pzPhaseCfg(0); const h = push(cfg); const s = h.s; s.slots = ['med', 'pro', 'asi', 'res', 'eje']; s.pool = ['eli']; s.run(); await waitFor(() => s.state !== 'running'); out.pz1 = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
    await code('pz2', C.pzPhaseCfg(1), [[{ op: 'if', cond: { l: 'radiacion', op: '>', r: 800 }, body: [A('cargar_bateria')], else: [A('usar_bateria')] }]]);
    await code('pz3', C.pzPhaseCfg(2), [[{ op: 'while', cond: { l: 'temperatura', op: '<', r: 70 }, body: [A('ajustar_aspas'), A('medir_viento')] }]]);
    await code('pz4', C.pzPhaseCfg(3), [[{ op: 'call', fn: 'revisarTurbina', args: [1] }, { op: 'call', fn: 'revisarTurbina', args: [2] }, { op: 'call', fn: 'revisarTurbina', args: [3] }]], [{ revisarTurbina: [A('cerrar_valvula'), A('limpiar_rejilla'), A('abrir_valvula')] }]);
    await code('pz5', C.pzPhaseCfg(4), [[{ op: 'foreach', var: 'isla', list: 'islas', body: [{ op: 'if', cond: { l: 'tipo', op: '==', r: 'baja' }, body: [A('a_prioridad')], else: [A('a_normal')] }] }]]);
    { const h = push(C.pzPhaseCfg(5)); const s = h.s; s.trans = [['OFF', 'STARTING', 'encender'], ['STARTING', 'RUNNING', 'temp_ok'], ['RUNNING', 'COOLING', 'apagar'], ['COOLING', 'OFF', 'enfriado'], ['RUNNING', 'FAULT', 'sobrecalor'], ['FAULT', 'OFF', 'diagnostico'], ['STARTING', 'FAULT', 'sobrecalor']].map(([from, to, ev]) => ({ from, to, ev })); s.run(); await waitFor(() => s.state !== 'running', 30000); out.pz6 = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
    { const h = push(C.pzPhaseCfg(6)); const s = h.s; s.rules = [['soc_alto', 'electrolizar'], ['excedente', 'cargar_bateria'], ['excedente', 'electrolizar'], ['deficit', 'usar_bateria'], ['deficit', 'hidro_extra'], ['deficit', 'pila_h2'], ['deficit', 'recortar']].map(([cond, act]) => ({ cond, act })); s.run(); await waitFor(() => !s.animating, 30000); out.pz7 = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
    { const h = push({ kind: 'objective', title: 'obj' }); const s = h.s; s.submit(); out.obj_default_should_fail = s.result ? 'UNEXPECTED OK' : 'failed as expected'; for (const k in s.w) s.w[k] = 3; s.uncert = true; s.state = 'edit'; s.submit(); out.objective = s.result ? 'OK' : 'FAIL ' + s.msg; s.exit(s.result); }
    // Retos del banco: todos se construyen
    let built = 0, bad = [];
    for (const c of LL.CHALLENGES) { try { const cfg = c.make(); const s = LL.makePuzzleScene(cfg, () => { }); LL.Scenes.push(s); s.draw(document.getElementById('game').getContext('2d')); LL.Scenes.pop(); built++; } catch (e) { bad.push(c.title + ': ' + e.message); } }
    out.challenges = built + '/' + LL.CHALLENGES.length + (bad.length ? ' BAD: ' + bad.join('; ') : '');
    return out;
  });
  // Soluciones incorrectas a propósito: deben fallar y explicar por qué
  const EXPECT_FAIL = ['sol_sensor_U500', 'sol_sensor_U1000', 'aeris_molino_orig', 'bat_beta_bad', 'puerto_carrera_inicio'];
  let bad = 0;
  for (const k in results) {
    let r = results[k];
    if (EXPECT_FAIL.includes(k)) r = /^FAIL/.test(r) ? 'failed as expected: ' + r.replace(/^FAIL stage \d+: /, '').slice(0, 80) : 'UNEXPECTED ' + r;
    if (/^(FAIL|EXC|NO RESULT|UNEXPECTED)/.test(r) || / BAD: /.test(r)) bad++;
    console.log(k.padEnd(28), r);
  }
  console.log(bad ? bad + ' PROBLEMA(S)' : 'TODOS LOS PUZZLES OK');
  if (bad) process.exitCode = 1;
  console.log('ERRORS:', errs.length ? errs.slice(0, 10).join('\n') : 'none');
  await b.close();
})();
