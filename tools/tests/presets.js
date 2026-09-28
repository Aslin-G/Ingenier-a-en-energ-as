// Comprueba el diseño «ordenar y ajustar» de los retos de código:
//  1) el programa con el que empieza cada reto (o cada etapa) NO lo resuelve ya;
//  2) los retos del banco que traen solución de referencia se resuelven con ella.
// Uso: node tools/tests/presets.js
const { chromium, gameFile } = require('./_pw');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto('file://' + gameFile + '#level=puerto');
  await p.waitForTimeout(800);
  await p.evaluate(() => { LL.Cut.abort(); LL.G.save.settings.confidence = false; });
  const out = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const waitFor = async (fn, ms = 30000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { if (fn()) return true; await sleep(40); } return false; };
    const res = [];
    // ejecuta el programa actual de la etapa y devuelve el estado final
    const runStage = async s => { s.speed = 3; s.startRun(false); await waitFor(() => s.state !== 'running' && s.state !== 'paused'); return s.state; };
    const check = async (name, cfg, solution) => {
      const s = LL.makePuzzleScene(cfg, () => { }); LL.Scenes.push(s);
      try {
        if (!s.stages) { res.push([name, 'SKIP (no es CodeLab)']); return; }
        for (let i = 0; i < s.stages.length; i++) {
          s.stageIdx = i; s.loadStage();
          if (s.mode === 'demo') continue;
          const st = await runStage(s);
          const solved = st === 'success' || s.stageDone;
          res.push([name + (s.stages.length > 1 ? ' · etapa ' + (i + 1) : ''), solved ? 'FALLO: el programa inicial ya resuelve el reto' : 'ok (el inicio no resuelve: ' + (s.msg || '').replace(/\s+/g, ' ').slice(0, 60) + ')']);
        }
        if (solution) {
          s.stageIdx = s.stages.length - 1; s.loadStage();
          s.prog = JSON.parse(JSON.stringify(solution.main || solution));
          if (solution.fns) for (const k in solution.fns) s.functions[k].body = JSON.parse(JSON.stringify(solution.fns[k]));
          const st = await runStage(s);
          res.push([name + ' · solución', st === 'success' ? 'ok' : 'FALLO: ' + s.msg]);
        }
      } finally { if (LL.Scenes.top() === s) LL.Scenes.pop(); }
    };
    const C = LL.cfg;
    for (const k of Object.keys(C)) { const c = C[k]; if (c && c.kind === 'code') await check(k, c); }
    await check('pz2', C.pzPhaseCfg(1)); await check('pz5', C.pzPhaseCfg(4));
    for (const ch of LL.CHALLENGES) {
      const cfg = ch.make(); if (cfg.kind !== 'code') continue;
      const fns = cfg.title && ch.title.startsWith('Forja') ? { generarEnergia: [{ op: 'ret', expr: { bin: '*', a: { bin: '*', a: 'caudal', b: 'altura' }, b: 8 } }] } : null;
      await check(ch.title, cfg, cfg.solution ? (fns ? { main: cfg.solution, fns } : cfg.solution) : null);
    }
    return res;
  });
  let bad = 0;
  for (const [n, r] of out) { if (/^FALLO/.test(r)) bad++; console.log(n.padEnd(44), r); }
  console.log(bad ? bad + ' PROBLEMA(S)' : 'TODOS LOS PROGRAMAS INICIALES OK');
  console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
  process.exitCode = bad || errs.length ? 1 : 0;
  await b.close();
})();
