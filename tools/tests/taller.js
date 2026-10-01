// Taller de Lía y patio de entrenamiento:
// - el taller muestra el dato real de cada recuerdo, la lámpara se apaga y enciende
// - el botón del patio lleva a la sala de práctica
// - cada movimiento de la lista se marca al hacerlo con el teclado (agacharse en el
//   túnel, combo, barrida, gancho, rebote, pulso, recarga)
// - al completar la lista: pegatina, núcleo de forja (solo la primera vez) y récord
// - la puerta TALLER vuelve al taller (con el mapa debajo)
// Uso: node tools/tests/taller.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + gameFile + '#level=puerto');
  await p.waitForTimeout(800);

  // ---------- taller ----------
  const t1 = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    LL.Cut.abort();
    ['puerto', 'valle', 'solaria'].forEach(k => LL.setFlag('restored_' + k));
    LL.Scenes.clear(); const T = new LL.S.TallerScene(); LL.Scenes.push(T);
    await sleep(200);
    LL.Input.lastDevice = 'keyboard'; LL.UI.focus = 'sv_solaria'; await sleep(120);
    const solar = T.note && T.note.title + ' | ' + T.note.text;
    LL.UI.focus = 'sv_gea'; await sleep(120);
    const locked = T.note && T.note.title;
    LL.UI.focus = 'st_parry'; await sleep(120);
    const sticker = T.note && T.note.title;
    LL.UI.clicks.add('tlamp'); await sleep(120);
    const lampOff = T.lamp === false;
    LL.UI.clicks.add('tlamp'); await sleep(120);
    return { solar, locked, sticker, lampOff, lampOn: T.lamp === true };
  });
  await p.screenshot({ path: outDir + '/taller.png' });
  ok(/MINI PANEL SOLAR/.test(t1.solar) && /20 %/.test(t1.solar), 'el recuerdo de Solaria muestra su dato real (' + (t1.solar || '').slice(0, 60) + '…)');
  ok(t1.locked === '? ? ?', 'un recuerdo de una isla sin restaurar queda en «? ? ?»');
  ok(/PEGATINA POR CONSEGUIR/.test(t1.sticker || ''), 'una pegatina sin conseguir explica cómo se consigue');
  ok(t1.lampOff && t1.lampOn, 'la lámpara se apaga y se enciende');

  // ---------- al patio ----------
  await p.evaluate(() => { LL.UI.clicks.add('ttrain'); });
  await p.waitForTimeout(1500);
  const t2 = await p.evaluate(() => {
    LL.Cut.abort();
    const lv = LL.G.run.level;
    return { key: lv && lv.key, dummies: lv.entities.filter(e => e.constructor.name === 'TrainDummy').length, cells: lv.player.cells, max: lv.player.maxCells, list: LL.trainList().map(m => m.id).join(',') };
  });
  ok(t2.key === 'practica' && t2.dummies === 4, 'el botón del patio abre la sala de práctica con 4 muñecos');
  ok(t2.cells === t2.max - 1, 'empieza con una célula vacía para practicar la recarga');
  await p.waitForTimeout(3200); // deja pasar el cartel del nivel
  await p.screenshot({ path: outDir + '/practica.png' });

  const put = (x, face = 1) => p.evaluate(([x, face]) => { const pl = LL.G.run.level.player; pl.x = x; pl.y = 14 * 16 - pl.h - 0.5; pl.vx = pl.vy = 0; pl.face = face; pl.atk = null; pl.atkCD = 0; pl.setCrouch(false); }, [x, face]);
  const done = id => p.evaluate(id => !!LL.G.run.level.pr.done[id], id);
  const key = async (code, ms = 60) => { await p.keyboard.down(code); await p.waitForTimeout(ms); await p.keyboard.up(code); };

  // agacharse y cruzar el túnel bajo la tarima
  await put(8 * 16 - 4);
  await p.keyboard.down('ArrowDown'); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1600);
  await p.keyboard.up('ArrowRight'); await p.keyboard.up('ArrowDown');
  ok(await done('crouch'), 'agacharse y avanzar por el túnel marca «agachada»');
  // combo de tres tajos contra el muñeco
  await put(17 * 16 - 22); await p.waitForTimeout(200);
  for (let i = 0; i < 3; i++) { await key('KeyX'); await p.waitForTimeout(170); }
  await p.waitForTimeout(300);
  ok(await done('combo'), 'tres tajos seguidos al muñeco marcan el combo');
  // barrida
  await put(17 * 16 - 40); await p.waitForTimeout(200);
  await p.keyboard.down('ArrowDown'); await key('KeyX'); await p.waitForTimeout(450); await p.keyboard.up('ArrowDown');
  ok(await done('slide'), '↓ + ataque contra el muñeco marca la barrida');
  // gancho al dron
  await put(24 * 16 - 6); await p.waitForTimeout(250);
  await p.keyboard.down('ArrowUp'); await key('KeyX'); await p.keyboard.up('ArrowUp'); await p.waitForTimeout(500);
  ok(await done('hook'), '↑ + ataque bajo el dron marca el gancho');
  // rebote sobre la seta (cayendo desde arriba)
  await p.waitForTimeout(400);
  await p.evaluate(() => { const lv = LL.G.run.level, pl = lv.player; pl.atk = null; pl.atkCD = 0; pl.x = 30 * 16 + 8 - pl.w / 2; pl.y = 14 * 16 - 60; pl.vy = 60; pl.onGround = false; });
  await p.keyboard.down('ArrowDown'); await key('KeyX'); await p.waitForTimeout(350); await p.keyboard.up('ArrowDown');
  ok(await done('pogo'), 'en el aire, ↓ + ataque sobre la seta marca el rebote');
  // pulso cargado hacia la diana
  await put(36 * 16, 1); await p.evaluate(() => { LL.G.run.level.player.energy = 100; });
  await p.waitForTimeout(200);
  await key('KeyX', 900); await p.waitForTimeout(1600);
  ok(await done('pulse'), 'mantener y soltar el ataque lanza un pulso que marca la diana');
  // recarga agachada
  await put(5 * 16); await p.evaluate(() => { const pl = LL.G.run.level.player; pl.energy = 100; pl.cells = pl.maxCells - 1; });
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(1400); await p.keyboard.up('ArrowDown');
  ok(await done('heal'), 'quieta con ↓ recarga una célula y la marca');
  // poderes (si los tiene) y final
  const t3 = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lv = LL.G.run.level, P = lv.pr, d = lv.entities.find(e => e.constructor.name === 'TrainDummy');
    const K = { combo: 'f3', pogo: 'down' };
    for (const m of LL.trainList()) if (!P.done[m.id]) { if (m.id === 'crouch' || m.id === 'heal') P.done[m.id] = true; else d.onHit({ dmg: 1, dir: 1, kind: K[m.id] || m.id }); }
    await sleep(200);
    return { finished: P.finished, flag: LL.flag('trainDone'), cores: LL.G.save.forgeCores || 0, sticker: !!LL.G.save.achievements.trainer, best: LL.G.save.trainBest };
  });
  ok(t3.finished && t3.flag && t3.sticker && t3.best > 0, `lista completa: pegatina y récord (${(t3.best || 0).toFixed(1)} s)`);
  ok(t3.cores >= 1, 'la primera vez da un núcleo de forja');
  await p.screenshot({ path: outDir + '/practica_fin.png' });
  // volver por la puerta del taller
  await p.evaluate(() => { const lv = LL.G.run.level; const ex = lv.entities.find(e => e.constructor.name === 'Exit'); ex.interact(); });
  await p.waitForTimeout(1500);
  const t4 = await p.evaluate(() => LL.Scenes.stack.map(s => s.constructor.name).join('>'));
  ok(/MapScene>TallerScene$/.test(t4), 'la puerta TALLER vuelve al taller con el mapa debajo (' + t4 + ')');

  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'TALLER OK');
  process.exitCode = fails ? 1 : 0;
})();
