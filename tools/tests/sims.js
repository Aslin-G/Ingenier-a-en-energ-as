// Simuladores: cada uno se puede completar moviendo SOLO sus mandos (como un
// estudiante), las misiones no se cumplen solas al empezar, y no hay errores.
// Uso: node tools/tests/sims.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

const { PLANS } = require('./_plans');
// errores típicos que NO deben completar la misión en curso
const TRAPS = {
  SIM_EOLICO: { at: 2, plan: [['wait', 8]], why: 'la tormenta no se supera sin poner las palas en bandera' },
  SIM_HIDRO: { at: 1, plan: [['dam', 60], ['gate', 60], ['wait', 6]], why: 'inundar el pueblo no cuenta para 1500 kW' },
  SIM_BIOGAS: { at: 2, plan: [['heat', 37], ['load', 100], ['wait', 10]], why: 'cargar de más empacha el digestor' },
  SIM_GEO: { at: 2, plan: [['wait', 12]], why: 'con la reinyección al 100 % el yacimiento sigue frío' },
  SIM_H2: { at: 1, plan: [['cell', 40], ['wait', 6]], why: 'con el electrolizador encendido de noche hay apagón' }
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
    if (TRAPS[name]) {
      const tr = TRAPS[name];
      const r2 = await p.evaluate(({ name, plan, tr }) => {
        const sim = new LL.SimScene(LL.SIMS[name], () => {});
        LL.Scenes.push(sim);
        const run = s => { for (let i = 0; i < s * 60; i++) sim.tick(1 / 60); };
        // llegar a la misión de la trampa con el plan bueno y luego cometer el error
        for (const [k, v] of plan) { if (sim.mi >= tr.at) break; if (k === 'wait') { for (let i = 0; i < v * 60 && sim.mi < tr.at; i++) sim.tick(1 / 60); } else { sim.setCtl(sim.def.controls.find(c => c.id === k), v); run(0.05); } }
        const at = sim.mi;
        for (const [k, v] of tr.plan) { if (k === 'wait') run(v); else { sim.setCtl(sim.def.controls.find(c => c.id === k), v); run(0.05); } }
        LL.Scenes.pop();
        return { at, mi: sim.mi };
      }, { name, plan, tr });
      ok(r2.at === tr.at && r2.mi === tr.at, `${name}: ${tr.why}`);
    }
    ok(r.success && r.mi === r.total, `${name}: se completan las ${r.total} misiones con los mandos (${r.log})`);
    await p.waitForTimeout(300);
    await p.screenshot({ path: outDir + '/sim_' + name + '.png' });
    await p.evaluate(() => { while (LL.Scenes.stack.length > 1) LL.Scenes.pop(); });
  }
  const kiosks = await p.evaluate(() => {
    const out = {};
    for (const k of ['aeris', 'hydria', 'bioloop', 'gea', 'h2']) {
      const lv = LL.buildLevel(k), t = lv.entities.find(e => e.cfg && e.cfg.look === 'simkiosk');
      out[k] = t ? { sim: t.cfg.sim, ground: lv.tile(Math.floor((t.x + t.w / 2) / 16), Math.floor((t.y + t.h + 2) / 16)) === '#', x: Math.round(t.x / 16), w: lv.w } : null;
    }
    return out;
  });
  for (const k in kiosks) ok(kiosks[k] && kiosks[k].ground && kiosks[k].x < kiosks[k].w * 0.55, `${k}: quiosco del simulador ${kiosks[k] ? kiosks[k].sim + ' en x=' + kiosks[k].x + '/' + kiosks[k].w : 'NO colocado'}`);
  const lab = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    LL.G.save.sims = {}; const c0 = LL.G.save.forgeCores || 0;
    const first = LL.simReward('SIM_EOLICO'), again = LL.simReward('SIM_EOLICO');
    LL.Scenes.push(new LL.SimLabScene()); await sleep(300);
    return { first, again, cores: (LL.G.save.forgeCores || 0) - c0, top: LL.Scenes.top().constructor.name };
  });
  ok(lab.first && !lab.again && lab.cores === 1, 'el primer simulador completado da 1 núcleo de forja (solo una vez)');
  ok(lab.top === 'SimLabScene', 'el Laboratorio de simuladores se abre');
  await p.screenshot({ path: outDir + '/sim_lab.png' });
  await p.evaluate(() => LL.Scenes.pop());
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'SIMULADORES OK');
  process.exitCode = fails ? 1 : 0;
})();
