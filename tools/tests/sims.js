// Simuladores: cada uno se puede completar moviendo SOLO sus mandos (como un
// estudiante), las misiones no se cumplen solas al empezar, y no hay errores.
// Uso: node tools/tests/sims.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

// Pasos de solución: [nombre del mando, valor] o ['wait', segundos]
const PLANS = {
  SIM_SOLAR: [['tilt', 32], ['wait', 1.5], ['tilt', 32], ['wait', 1.5], ['wait', 2.5], ['tilt', 68], ['wait', 1.5], ['wait', 8]]
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + gameFile + '#level=solaria');
  await p.waitForTimeout(700);
  await p.evaluate(() => LL.Cut.abort());
  const names = await p.evaluate(() => Object.keys(LL.SIMS));
  for (const name of names) {
    const plan = PLANS[name];
    if (!plan) { ok(false, name + ': falta un plan de solución en la prueba'); continue; }
    const r = await p.evaluate(({ name, plan }) => {
      let res = null;
      const sim = new LL.SimScene(LL.SIMS[name], x => res = x);
      LL.Scenes.push(sim);
      const run = s => { for (let i = 0; i < s * 60; i++) sim.tick(1 / 60); };
      run(1.5);
      const doneAtStart = sim.mi;
      const log = [];
      for (const [k, v] of plan) {
        if (k === 'wait') run(v);
        else { const c = sim.def.controls.find(c => c.id === k); sim.setCtl(c, v); run(0.05); }
        log.push(sim.mi);
      }
      return { doneAtStart, mi: sim.mi, total: sim.def.missions.length, success: !!(sim.result && sim.result.success), log: log.join(',') };
    }, { name, plan });
    ok(r.doneAtStart === 0, `${name}: ninguna misión se cumple sola al empezar`);
    ok(r.success && r.mi === r.total, `${name}: se completan las ${r.total} misiones con los mandos (${r.log})`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: outDir + '/sim_' + name + '.png' });
    await p.evaluate(() => { while (LL.Scenes.stack.length > 1) LL.Scenes.pop(); });
  }
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'SIMULADORES OK');
  process.exitCode = fails ? 1 : 0;
})();
