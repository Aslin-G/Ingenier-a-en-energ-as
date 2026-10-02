// Acceso al MODO DOCENTE con contraseña y enlace del registro oculto:
// - el SHA-256 del juego coincide con el de Node y la contraseña no está escrita en el código
// La contraseña real no se escribe en esta prueba (el repositorio es público): se usa una
// contraseña de prueba que se añade en la página. Para comprobar también la real:
//   LUMINA_CLAVE_DOCENTE="…" node tools/tests/docente.js
// - MODO DOCENTE pide la contraseña: con una incorrecta no entra; con la correcta, sí
// - tras 5 intentos fallidos hay que esperar
// - mientras se usa el modo docente no se anota nada en la hoja (aunque haya un estudiante)
// - la dirección «/exec» no aparece en ninguna pantalla ni en el código de la página
// - en un navegador normal no hay window.LL (no se puede saltar la contraseña desde la consola)
// Uso: node tools/tests/docente.js
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };
const URL_REAL = /script\.google|AKfyc|\/exec\b/;
const CLAVE_REAL = (process.env.LUMINA_CLAVE_DOCENTE || '').trim();
const CLAVE = 'Prueba-Docente.42';
const huella = (C, s) => { const h = x => crypto.createHash('sha256').update(x, 'utf8').digest('hex'); let x = h(C.sal + ':' + s); for (let i = 0; i < C.vueltas; i++) x = h(x + C.sal); return x; };

(async () => {
  const html = fs.readFileSync(gameFile, 'utf8');
  ok(!/script\.google\.com\/macros|AKfycb/.test(html), 'el código de la página no contiene la dirección de la aplicación web a simple vista');
  if (CLAVE_REAL) ok(!html.includes(CLAVE_REAL), 'el código de la página no contiene la contraseña');

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.addInitScript(() => { try { localStorage.clear(); } catch (e) { } });
  // la aplicación web real no se contacta en las pruebas: respuesta simulada de la versión 2
  await p.route(/script\.google\.com/, route => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify({ ok: true, version: 2, hoja: 'Prueba', eventos: 3, estudiantes: 1 }) }));
  await p.goto('file://' + gameFile); await p.waitForTimeout(900);

  // 1) SHA-256 propio = SHA-256 de Node (incluye UTF-8 y los bordes de bloque)
  const muestras = ['', 'abc', 'ñandú · Lía', 'x'.repeat(55), 'y'.repeat(56), 'z'.repeat(64), 'w'.repeat(119), CLAVE];
  const propios = await p.evaluate(m => m.map(s => LL.sha256Hex(s)), muestras);
  ok(muestras.every((s, i) => propios[i] === crypto.createHash('sha256').update(s, 'utf8').digest('hex')), 'SHA-256 del juego igual al de Node en ' + muestras.length + ' muestras');
  if (CLAVE_REAL) {
    const real = await p.evaluate(c => [LL.claveDocenteOk(c), LL.claveDocenteOk(c + '.'), LL.claveDocenteOk(c.toLowerCase()), LL.claveDocenteOk(c.slice(0, -1))], CLAVE_REAL);
    ok(real[0] && !real[2] && !real[3], 'la contraseña real del docente es válida; en minúsculas o incompleta, no' + (real[1] ? ' (también se acepta con punto final)' : ''));
  }
  // contraseña de prueba: su huella se añade solo en esta página
  const C = await p.evaluate(() => ({ sal: LL.DOCENTE_CLAVE.sal, vueltas: LL.DOCENTE_CLAVE.vueltas }));
  await p.evaluate(h => { LL.DOCENTE_CLAVE.huellas.push(h); }, huella(C, CLAVE));
  const r1 = await p.evaluate(c => { const t0 = performance.now(); const a = LL.claveDocenteOk(c); const ms = performance.now() - t0; return { a, ms, c: LL.claveDocenteOk('  ' + c + ' '), d: LL.claveDocenteOk(c.toLowerCase()), e: LL.claveDocenteOk(c.slice(0, -1)), f: LL.claveDocenteOk('') }; }, CLAVE);
  ok(r1.a && r1.c, 'una contraseña con su huella es válida (también con espacios alrededor) · ' + Math.round(r1.ms) + ' ms');
  ok(!r1.d && !r1.e && !r1.f, 'mayúsculas, caracteres y vacío cuentan: otras contraseñas no valen');
  await p.waitForTimeout(300); // tras un cálculo largo, el bucle se pone al día antes de recibir clics simulados

  // 2) desde el título: pide la contraseña
  await p.evaluate(() => { LL.UI.clicks.add('m_teacher'); }); await p.waitForTimeout(300);
  const top = () => p.evaluate(() => LL.Scenes.top().constructor.name);
  ok(await top() === 'TeacherLockScene', 'MODO DOCENTE abre la pantalla de contraseña (no el modo docente)');
  const campo = p.locator('#stage input[type=password]');
  ok(await campo.count() === 1, 'hay un campo de contraseña (los caracteres no se ven)');
  await campo.click(); await p.keyboard.type('hola123'); await p.keyboard.press('Enter'); await p.waitForTimeout(250);
  const e1 = await p.evaluate(() => ({ top: LL.Scenes.top().constructor.name, err: LL.Scenes.top().err, val: document.querySelector('#stage input').value }));
  ok(e1.top === 'TeacherLockScene' && /incorrecta/.test(e1.err) && e1.val === '', 'con una contraseña incorrecta no entra («' + e1.err + '») y el campo se vacía');
  await p.screenshot({ path: outDir + '/docente_clave.png' });
  await p.evaluate(() => { LL.UI.clicks.add('dc_back'); }); await p.waitForTimeout(250);
  ok(await top() === 'TitleScene' && await p.locator('#stage input').count() === 0, 'CANCELAR vuelve al título y retira el campo');

  // 3) cinco fallos seguidos (aunque se cierre y se vuelva a abrir): espera
  const f1 = await p.evaluate(() => LL.TeacherLockScene.fails);
  ok(f1 === 1, 'los fallos se siguen contando al cerrar y volver a abrir (' + f1 + ')');
  await p.evaluate(() => { LL.TeacherLockScene.fails = 0; LL.UI.clicks.add('m_teacher'); }); await p.waitForTimeout(300);
  for (let i = 0; i < 4; i++) { await campo.fill('mal' + i); await campo.press('Enter'); await p.waitForTimeout(80); }
  await campo.fill(CLAVE); await campo.press('Enter'); await p.waitForTimeout(200);
  ok(await top() === 'TeacherScene', 'con 4 fallos todavía se puede entrar con la correcta');
  await p.evaluate(() => { LL.Scenes.top().leave(); }); await p.waitForTimeout(150);
  await p.evaluate(() => { LL.UI.clicks.add('m_teacher'); }); await p.waitForTimeout(300);
  for (let i = 0; i < 5; i++) { await campo.fill('mal' + i); await campo.press('Enter'); await p.waitForTimeout(80); }
  await campo.fill(CLAVE); await campo.press('Enter'); await p.waitForTimeout(200);
  const w = await p.evaluate(() => ({ top: LL.Scenes.top().constructor.name, wait: LL.Scenes.top().wait ? LL.Scenes.top().wait() : 0 }));
  ok(w.top === 'TeacherLockScene' && w.wait > 20, 'tras 5 fallos seguidos hay que esperar (' + w.wait + ' s), aunque se escriba la correcta');
  await p.screenshot({ path: outDir + '/docente_espera.png' });
  await p.evaluate(() => { LL.TeacherLockScene.until = 0; });

  // 4) estudiante registrado en este dispositivo: el modo docente no anota nada
  await p.evaluate(() => { LL.G.save.player = LL.makePlayer('Ana', 'Pérez Ruiz'); LL.G.save.started = true; LL.Save.write(); });
  await campo.fill(CLAVE); await campo.press('Enter'); await p.waitForTimeout(300);
  ok(await top() === 'TeacherScene', 'con la contraseña correcta entra al MODO DOCENTE');
  const d1 = await p.evaluate(() => { const n = LL.Registro.cola.length; LL.setFlag('prueba_docente'); return { docente: LL.G.docente, activo: LL.Registro.activo(), jugador: !!LL.G.save.player, nuevos: LL.Registro.cola.length - n }; });
  ok(d1.docente && d1.jugador && !d1.activo && d1.nuevos === 0, 'con la partida de un estudiante cargada, el modo docente no anota nada en la hoja');

  // 5) la dirección no se ve en ninguna pantalla (docente → hoja, título, juego, pausa)
  const textos = async () => p.evaluate(async () => { LL.TextAudit.list = []; LL.TextAudit.on = true; await new Promise(r => setTimeout(r, 250)); LL.TextAudit.on = false; return LL.TextAudit.list.map(x => x.t); });
  await p.evaluate(() => { LL.Scenes.top().pick('hoja'); }); await p.waitForTimeout(400);
  const th = await textos();
  ok(th.some(t => /Aplicación web: configurada/.test(t)) && !th.some(t => URL_REAL.test(t)), 'MODO DOCENTE → HOJA: dice que está configurada sin mostrar la dirección («' + (th.find(t => /Aplicación web/.test(t)) || '') + '»)');
  await p.screenshot({ path: outDir + '/docente_hoja.png' });
  // isla elegida desde el modo docente: tampoco se anota
  const n0 = await p.evaluate(() => { LL.Scenes.top().page = 'isla'; return LL.Registro.cola.length; });
  await p.waitForTimeout(150);
  await p.evaluate(() => { LL.UI.clicks.add('tivalle'); }); await p.waitForTimeout(1500);
  const d2 = await p.evaluate(n => ({ top: LL.Scenes.top().constructor.name, nuevos: LL.Registro.cola.slice(n).map(e => e.tipo) }), n0);
  ok(d2.top === 'GameplayScene' && d2.nuevos.length === 0, 'una isla abierta desde el modo docente no se anota (' + (d2.nuevos.join(', ') || 'nada') + ')');
  // al volver al título se vuelve a anotar la actividad del estudiante
  await p.evaluate(() => { LL.Game.toTitle(); }); await p.waitForTimeout(1200);
  const d3 = await p.evaluate(() => ({ top: LL.Scenes.top().constructor.name, docente: LL.G.docente, activo: LL.Registro.activo() }));
  ok(d3.top === 'TitleScene' && !d3.docente && d3.activo, 'al volver al título, la actividad del estudiante se anota otra vez');
  const tt = await textos();
  await p.evaluate(() => { LL.Cut.abort(); LL.Game.continueGame(); }); await p.waitForTimeout(1500);
  await p.evaluate(() => { LL.Cut.abort(); }); await p.waitForTimeout(200);
  const tj = await textos();
  await p.evaluate(() => { LL.Scenes.push(new LL.S.PauseScene(LL.G.run.level)); }); await p.waitForTimeout(300);
  const tp = await textos();
  ok(![...tt, ...tj, ...tp].some(t => URL_REAL.test(t)), 'ni el título, ni el juego, ni la pausa muestran la dirección (' + (tt.length + tj.length + tp.length) + ' textos revisados)');
  ok(await p.evaluate(() => LL.Registro.url().startsWith('https://script.google.com/macros/s/') && LL.Registro.url().endsWith('/exec')), 'el juego sigue enviando a la misma aplicación web (la dirección se decodifica bien)');
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await p.close();

  // 6) navegador normal (sin automatización): sin window.LL y sin atajo #level=
  const ctx2 = await b.newContext({ viewport: { width: 960, height: 540 } });
  await ctx2.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); });
  const q = await ctx2.newPage();
  await q.goto('file://' + gameFile + '#level=faro'); await q.waitForTimeout(1200);
  const n = await q.evaluate(() => ({ ll: typeof window.LL, wd: navigator.webdriver }));
  ok(n.wd === false && n.ll === 'undefined', 'en un navegador normal no hay window.LL para saltarse la contraseña desde la consola');
  await q.screenshot({ path: outDir + '/docente_publicado.png' });
  await ctx2.close();
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'DOCENTE OK');
  process.exitCode = fails ? 1 : 0;
})();
