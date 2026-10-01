// Registro del estudiante y registro de actividad para el docente:
// - NUEVA PARTIDA pide nombres, apellidos y los tres consentimientos (sin ellos no empieza)
// - el primer nombre sustituye a «Lía» en los textos y el nombre completo sale en los créditos
// - sin estudiante registrado (p. ej., modo docente o #level=) no se anota nada
// - con consentimiento se anotan y se envían por lotes los eventos (a un receptor simulado)
// Uso: node tools/tests/registro.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };
const URL_FALSA = 'https://registro.prueba.invalid/exec';

(async () => {
  const b = await chromium.launch();
  // 1) sin registro no se anota nada
  {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    await p.goto('file://' + gameFile + '#level=valle'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => { LL.Cut.abort(); LL.setFlag('prueba_sin_registro'); return { activo: LL.Registro.activo(), cola: LL.Registro.cola.length }; });
    ok(!r.activo && r.cola === 0, 'sin estudiante registrado no se anota ninguna actividad');
    await p.close();
  }
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [], enviados = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.route(URL_FALSA, async route => { try { enviados.push(JSON.parse(route.request().postData() || '{}')); } catch (e) { } await route.fulfill({ status: 200, body: 'ok' }); });
  await p.addInitScript(u => { window.LUMINA_REGISTRO_URL = u; try { localStorage.clear(); } catch (e) { } }, URL_FALSA);
  await p.goto('file://' + gameFile); await p.waitForTimeout(900);

  // 2) pantalla de registro
  await p.evaluate(() => { LL.UI.clicks.add('m_new'); }); await p.waitForTimeout(400);
  const top1 = await p.evaluate(() => LL.Scenes.top().constructor.name);
  ok(top1 === 'RegisterScene', 'NUEVA PARTIDA abre el registro del estudiante');
  const inputs = p.locator('#stage input');
  await inputs.nth(0).click(); await p.keyboard.type('valentina');
  await p.evaluate(() => { LL.UI.clicks.add('rg_go'); }); await p.waitForTimeout(150);
  const e1 = await p.evaluate(() => LL.Scenes.top().err);
  ok(/apellido/.test(e1), 'sin apellido no deja empezar (' + e1 + ')');
  await inputs.nth(1).click(); await p.keyboard.type('gómez çarvajal 3');
  // E y Escape escritos en el campo no son acciones del juego
  const v1 = await p.evaluate(() => LL.Scenes.top().val(1));
  ok(v1 === 'gómez carvajal ', 'el campo limpia lo que la fuente no sabe dibujar (ç → c, números fuera): «' + v1 + '»');
  await p.evaluate(() => { LL.UI.clicks.add('rg_c0'); LL.UI.clicks.add('rg_c1'); }); await p.waitForTimeout(150);
  await p.evaluate(() => { LL.UI.clicks.add('rg_go'); }); await p.waitForTimeout(150);
  const e2 = await p.evaluate(() => ({ err: LL.Scenes.top().err, top: LL.Scenes.top().constructor.name }));
  ok(e2.top === 'RegisterScene' && /tres casillas/.test(e2.err), 'sin los tres consentimientos no deja empezar');
  await p.screenshot({ path: outDir + '/registro.png' });
  await p.evaluate(() => { LL.UI.clicks.add('rg_c2'); }); await p.waitForTimeout(150);
  await p.evaluate(() => { LL.UI.clicks.add('rg_go'); }); await p.waitForTimeout(1600);
  const r2 = await p.evaluate(() => ({ top: LL.Scenes.top().constructor.name, player: LL.G.save.player, inputs: document.querySelectorAll('#stage input').length, sub: LL.textW('Lía') === LL.textW('Valentina') }));
  ok(r2.top === 'GameplayScene' && r2.player && r2.player.full === 'Valentina Gómez Carvajal' && r2.player.hero === 'Valentina', 'con todo completo empieza la partida como «' + (r2.player && r2.player.full) + '»');
  ok(r2.player && r2.player.consent.ok && r2.player.consent.items.length === 3, 'los tres consentimientos quedan guardados con su fecha');
  ok(r2.inputs === 0, 'los campos de texto se retiran al empezar');
  ok(r2.sub, 'el nombre del estudiante sustituye a «Lía» en los textos');

  // 3) eventos: registro, sesión, nivel, reto, derrota, logro
  const r3 = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    LL.Cut.abort();
    const sc = LL.makePuzzleScene({ kind: 'quiz', title: 'Reto de prueba', question: '¿2 + 2?', options: [{ text: '4' }, { text: '5' }], answer: 0 }, () => {});
    LL.Scenes.push(sc); await sleep(100); sc.failed('respuesta equivocada'); sc.succeeded('¡bien!'); sc.exit(sc.result); await sleep(100);
    const lv = LL.G.run.level, pl = lv.player; LL.G.noDamage = false; pl.inv = 0; pl.cells = 1;
    const e = LL.makeEnemy(lv, Math.round(pl.x + 30), Math.round(pl.y), { type: 'charger' }); lv.addEntity(e); pl.hurt(e); e.dead = true;
    await sleep(200);
    const tipos = LL.Registro.cola.map(x => x.tipo);
    LL.Registro.enviar(); await sleep(600);
    return { tipos, quedan: LL.Registro.cola.length };
  });
  const enviadosTipos = enviados.flatMap(x => (x.eventos || []).map(e => e.tipo)), todos = enviadosTipos.concat(r3.tipos);
  ok(['registro', 'inicio_sesion', 'entra_a_nivel', 'error_en_reto', 'reto', 'derrota'].every(t => todos.includes(t)), 'se anotan registro, inicio de sesión, nivel, error, reto y derrota (' + [...new Set(todos)].join(', ') + ')');
  ok(enviados.length >= 1 && enviadosTipos.includes('registro') && r3.quedan === 0, 'el lote se envía a la hoja y la cola queda vacía');
  const ev = enviados.flatMap(x => x.eventos || []).find(e => e.tipo === 'registro');
  ok(ev && ev.estudiante === 'Valentina Gómez Carvajal' && /consentimientos/.test(ev.extra), 'cada fila lleva el nombre del estudiante y el registro incluye los consentimientos');

  // 4) transparencia: el menú de pausa dice que el progreso se comparte con el docente
  await p.waitForTimeout(6500);
  await p.evaluate(() => { LL.Scenes.push(new LL.S.PauseScene(LL.G.run.level)); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: outDir + '/registro_pausa.png' });
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'REGISTRO OK');
  process.exitCode = fails ? 1 : 0;
})();
