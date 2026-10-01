// Auditoría automática de textos superpuestos: abre puzzles, retos del banco,
// simuladores, menús, niveles y arenas de jefe, dibuja un fotograma y busca
// pares de textos cuyas cajas se pisan (un texto encima de otro).
// Uso: node tools/tests/overlap.js [--verbose] [--heroe=Nombre]  (con un nombre largo se comprueba que los textos con el nombre del estudiante caben)
'use strict';
const { chromium, gameFile } = require('./_pw');
const { PLANS } = require('./_plans');
const verbose = process.argv.includes('--verbose');
const heroArg = (process.argv.find(a => a.startsWith('--heroe=')) || '').slice(8);
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  await p.goto('file://' + gameFile + '#level=puerto');
  await p.waitForTimeout(700);
  // utilidades dentro de la página
  await p.evaluate(() => {
    LL.Cut.abort(); LL.G.noDamage = true; LL.setFlag('saberIntro'); LL.setFlag('healTip');
    window.__audit = (name) => {
      const A = LL.TextAudit; A.list = []; A.on = true; LL.Game.draw(); A.on = false;
      const L = A.list.filter(r => r.a > 0.3 && r.w > 0 && !r.hidden && r.l !== 'fx');
      const bad = [];
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], c = L[j];
        if (a.l !== c.l) continue; // un menú encima del juego tapa lo de abajo
        if (a.t === c.t && Math.abs(a.x - c.x) < 1 && Math.abs(a.y - c.y) < 1) continue; // el mismo texto dos veces
        const ix = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), iy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
        if (ix >= 2 && iy >= 3) bad.push(`«${a.t}» × «${c.t}» en (${Math.round(Math.max(a.x, c.x))}, ${Math.round(Math.max(a.y, c.y))})`);
      }
      // textos rotos: valores sin definir o mal formateados que llegan a la pantalla
      for (const r of A.list) if (/undefined|NaN|\[object|null\b/.test(r.t)) bad.push(`texto roto: «${r.t}»`);
      return { name, n: L.length, bad: [...new Set(bad)] };
    };
    window.__clear = () => { while (LL.Scenes.stack.length > 1) { const s = LL.Scenes.top(); if (s.removeInputs) s.removeInputs(); LL.Scenes.pop(); } };
  });
  const report = [];
  const audit = async (name, setup, arg, wait = 120) => {
    if (heroArg) await p.evaluate(h => LL.setHero({ hero: h }), heroArg);
    try { await p.evaluate(setup, arg); } catch (e) { report.push({ name, n: 0, bad: ['ERROR al preparar: ' + e.message] }); return; }
    if (heroArg) await p.evaluate(h => LL.setHero({ hero: h }), heroArg);
    await p.waitForTimeout(wait);
    report.push(await p.evaluate(n => window.__audit(n), name));
    await p.evaluate(() => window.__clear());
  };

  // 1) puzzles principales
  const cfgs = await p.evaluate(() => Object.keys(LL.cfg).filter(k => k !== 'pzPhaseCfg' && k !== 'cfgBioSorter'));
  for (const k of cfgs) await audit('puzzle ' + k, k => LL.Scenes.push(LL.makePuzzleScene(LL.cfg[k], () => {})), k, 150);
  // 2) banco de retos
  const nCh = await p.evaluate(() => LL.CHALLENGES.length);
  for (let i = 0; i < nCh; i++) await audit('reto #' + i, i => { const c = LL.CHALLENGES[i], cfg = c.make(); cfg.title = c.title; LL.Scenes.push(LL.makePuzzleScene(cfg, () => {})); }, i, 60);  // como launchChallenge
  // 3) simuladores al empezar y a mitad
  const sims = await p.evaluate(() => Object.keys(LL.SIMS));
  for (const k of sims) {
    await audit('sim ' + k + ' (inicio)', k => { const s = new LL.SimScene(LL.SIMS[k], () => {}); LL.Scenes.push(s); for (let i = 0; i < 60; i++) s.tick(1 / 60); }, k);
    await audit('sim ' + k + ' (mandos al máximo)', k => { const s = new LL.SimScene(LL.SIMS[k], () => {}); LL.Scenes.push(s); s.def.controls.forEach(c => s.setCtl(c, c.max)); for (let i = 0; i < 240; i++) s.tick(1 / 60); }, k);
  }
  // 3b) retos en marcha: el programa se ejecuta (mensajes, traza, mundo animado)
  for (const k of cfgs) {
    await audit('puzzle ' + k + ' (ejecutando)', k => {
      const s = LL.makePuzzleScene(LL.cfg[k], () => {}); LL.Scenes.push(s);
      if (s.startRun) { s.panelTab = 'traza'; s.startRun(false); }
      else if (s.slots && s.cfg.answer) { s.slots = s.cfg.answer.slice(0, s.slots.length); s.run(); }
      else if (s.run) s.run();
      else if (s.decide) { s.decide(true); s.decide(false); }
    }, k, 2200);
  }
  // 3c) simuladores terminados (misiones ✓, estrellas y mensaje final)
  for (const k of sims) {
    if (!PLANS[k]) continue;
    await audit('sim ' + k + ' (terminado)', ({ k, plan }) => {
      const s = new LL.SimScene(LL.SIMS[k], () => {}); LL.Scenes.push(s);
      const run = t => { for (let i = 0; i < t * 60; i++) s.tick(1 / 60); };
      for (const [c, v] of plan) { if (c === 'wait') run(v); else { s.setCtl(s.def.controls.find(x => x.id === c), v); run(0.05); } }
    }, { k, plan: PLANS[k] }, 1500);
  }
  // 4) menús y pantallas
  const menus = ['TitleScene', 'RegisterScene', 'PauseScene', 'SettingsScene', 'CodexScene', 'QuestLogScene', 'MasteryScene', 'TallerScene', 'ControlsScene', 'TeacherScene'];
  for (const m of menus) await audit('menú ' + m, m => { const K = LL.S[m]; LL.Scenes.push(m === 'PauseScene' ? new K(LL.G.run.level) : new K()); }, m, 250);
  for (const m of ['PowersScene', 'SimLabScene', 'CardsScene', 'ForgeScene']) await audit('menú ' + m, m => LL.Scenes.push(new LL[m]()), m, 250);
  // 5) niveles (HUD, letreros, etiquetas) y arenas de jefe con la Lente
  const levels = await p.evaluate(() => Object.keys(LL.LEVELS));
  for (const k of levels) {
    await audit('nivel ' + k, k => { LL.Game.startLevel(k); }, k, 900);
    await p.evaluate(() => { LL.Cut.abort(); });
  }
  // 6) arenas de jefe: HUD, programa con la Lente y ERROR CRÍTICO en FURIA
  for (const k of ['puerto', 'valle', 'solaria', 'aeris', 'hydria', 'bioloop', 'gea', 'h2', 'bateria', 'prisma']) {
    await p.evaluate(k => { LL.G.autoDialog = true; LL.G.autoWin = true; LL.Game.startLevel('jefe_' + k); }, k);
    await p.waitForFunction(() => LL.G.run.level && LL.G.run.level.rboss && LL.G.run.level.rboss.state === 'fight', null, { timeout: 10000 }).catch(() => {});
    await p.evaluate(() => { LL.G.autoDialog = false; LL.G.run.level.lens = true; });
    await p.waitForTimeout(1800);
    report.push(await p.evaluate(n => window.__audit(n), 'jefe ' + k + ' (Lente)'));
    await p.evaluate(() => { const bo = LL.G.run.level.rboss; LL.G.autoDialog = true; bo.hurtCD = 0; bo.damage({ dmg: Math.ceil(bo.hp - bo.maxHp / 3) + 1, dir: 1 }); });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { const bo = LL.G.run.level.rboss; if (bo.state === 'fight' && bo.stage < 3) { bo.hurtCD = 0; bo.damage({ dmg: Math.ceil(bo.hp - bo.maxHp / 3) + 1, dir: 1 }); } });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { const bo = LL.G.run.level.rboss; LL.G.autoDialog = false; bo.pendingSpecial = true; bo.gen = null; });
    await p.waitForTimeout(1500);
    report.push(await p.evaluate(n => window.__audit(n), 'jefe ' + k + ' (FURIA + especial)'));
    await p.evaluate(() => { LL.G.autoWin = false; LL.Cut.abort(); });
  }
  // 7) mapa del archipiélago
  await p.evaluate(() => { LL.Cut.abort(); LL.Game.toMap('puerto'); });
  await p.waitForTimeout(1500);
  report.push(await p.evaluate(n => window.__audit(n), 'mapa'));
  await b.close();

  let total = 0;
  for (const r of report) {
    total += r.bad.length;
    if (r.bad.length || verbose) console.log((r.bad.length ? 'FALLO ' : 'ok    ') + r.name + ' (' + r.n + ' textos)' + (r.bad.length ? '\n        ' + r.bad.slice(0, 12).join('\n        ') : ''));
  }
  ok(total === 0, `${report.length} pantallas revisadas: ${total} solapes de texto`);
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.slice(0, 5).join('\n     ') : ''));
  console.log(fails ? `${fails} FALLO(S)` : 'SIN SOLAPES DE TEXTO');
  process.exitCode = fails ? 1 : 0;
})();
