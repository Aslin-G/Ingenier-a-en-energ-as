// Modo HD: el filtro WebGL compila y se muestra encima del lienzo, se puede apagar
// desde Ajustes y, en navegadores automatizados, está apagado salvo con #hd=1.
// Uso: node tools/tests/hd.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  // WebGL por software (SwiftShader) para que funcione sin GPU
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const page = async hash => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto('file://' + gameFile + hash);
    await p.waitForTimeout(900);
    return p;
  };
  const p0 = await page('#level=valle');
  const st0 = await p0.evaluate(() => ({ ok: LL.HD.ok, on: LL.HD.on, disp: document.getElementById('hd').style.display }));
  ok(st0.ok && !st0.on && st0.disp === 'none', 'en pruebas automáticas el modo HD queda apagado por defecto');
  await p0.close();

  const p = await page('#level=valle&hd=1');
  await p.evaluate(() => { LL.Cut.abort(); });
  await p.waitForTimeout(500);
  const st = await p.evaluate(() => { const r1 = document.getElementById('game').getBoundingClientRect(), r2 = document.getElementById('hd').getBoundingClientRect(); return { ok: LL.HD.ok, on: LL.HD.on, disp: document.getElementById('hd').style.display, same: Math.abs(r1.x - r2.x) < 1 && Math.abs(r1.y - r2.y) < 1 && Math.abs(r1.width - r2.width) < 1 && Math.abs(r1.height - r2.height) < 1 }; });
  ok(st.ok && st.on && st.disp === 'block', 'con #hd=1 el filtro compila y la capa HD se muestra');
  ok(st.same, 'la capa HD cubre exactamente el lienzo del juego');
  await p.screenshot({ path: outDir + '/hd_on.png' });
  // los clics siguen llegando al lienzo del juego (la capa HD no los recibe)
  const pe = await p.evaluate(() => getComputedStyle(document.getElementById('hd')).pointerEvents);
  ok(pe === 'none', 'la capa HD no intercepta el ratón ni el tacto');
  const off = await p.evaluate(() => { LL.G.save.settings.hd = false; LL.HD.apply(); const r = { on: LL.HD.on, disp: document.getElementById('hd').style.display }; LL.G.save.settings.hd = true; LL.HD.apply(); r.back = LL.HD.on; return r; });
  ok(!off.on && off.disp === 'none' && off.back, 'el ajuste «Gráficos HD» lo apaga y lo vuelve a encender');
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'MODO HD OK');
  process.exitCode = fails ? 1 : 0;
})();
