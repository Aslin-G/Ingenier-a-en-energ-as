// Gráficos 2.5D (HD-2D):
// - fase 1: sin relieve, luces ni posprocesado, la composición por bandas en WebGL2
//   da el mismo fotograma que el modo clásico (píxel a píxel, con tolerancia)
// - fase 2: con el terreno extruido, las caras frontales (el plano de juego, Z = 0)
//   siguen exactamente donde estaban: el relieve solo cubre píxeles del fondo
// - modo completo (sombras, oclusión, bloom, tilt-shift) en todas las islas, sin errores de WebGL
// - la derrota pone el mundo en gris también en 2.5D
// - sin WebGL2, o si se pierde el contexto, el juego vuelve al dibujo clásico
// - en Ajustes, «Gráficos» alterna 2.5D → HD → CLÁSICOS
// Uso: node tools/tests/d25.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

// dibuja el mismo instante en modo clásico y en 2.5D (sin avanzar el juego) y compara
const COMPARE = (opts) => {
  const D = LL.D25, gl = D.gl, w = 960, h = 540;
  LL.Cut.abort();
  const saved = { on: D.on, flat: D.flat, noDepth: D.noDepth };
  const g2 = document.getElementById('game').getContext('2d');
  D.on = false; LL.Game.draw();
  const a = g2.getImageData(0, 0, w, h).data;
  const read = (fbo, att) => { const px = new Uint8Array(w * h * 4); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); if (fbo) gl.readBuffer(att); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return px; };
  const frame = (flat, noDepth) => { D.on = true; D.flat = flat; D.noDepth = noDepth; LL.Game.draw(); return { img: read(null), mat: read(D.fG, gl.COLOR_ATTACHMENT0) }; };
  const flat = frame(true, true), deep = frame(true, false);
  Object.assign(D, saved);
  // a: lienzo 2D (origen arriba); WebGL: origen abajo
  let diff = 0, sum = 0, front = 0, frontBad = 0, covered = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, j = ((h - 1 - y) * w + x) * 4;
    const d = Math.max(Math.abs(a[i] - flat.img[j]), Math.abs(a[i + 1] - flat.img[j + 1]), Math.abs(a[i + 2] - flat.img[j + 2]));
    sum += d; if (d > 24) diff++;
    const dd = Math.max(Math.abs(deep.img[j] - flat.img[j]), Math.abs(deep.img[j + 1] - flat.img[j + 1]), Math.abs(deep.img[j + 2] - flat.img[j + 2]));
    if (flat.mat[j + 3] > 40) { front++; if (dd > 6) frontBad++; } else if (dd > 6) covered++;
  }
  return { diffFrac: diff / (w * h), mean: sum / (w * h), front, frontBad, covered };
};

(async () => {
  const b = await chromium.launch();
  const levels = ['valle', 'puerto', 'solaria', 'aeris', 'hydria', 'bioloop', 'gea', 'h2', 'bateria', 'prisma', 'faro', 'festival', 'jefe_valle', 'practica'];
  const errs = [];
  for (const key of levels) {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    p.on('pageerror', e => errs.push(key + ' PAGEERROR: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') errs.push(key + ' console: ' + m.text()); });
    await p.goto('file://' + gameFile + '#level=' + key + '&d25=1');
    await p.waitForTimeout(1200);
    const st = await p.evaluate(() => ({ ok: LL.D25.ok, on: LL.D25.on, err: LL.D25.err, lv: !!(LL.G.run && LL.G.run.level) }));
    if (!st.lv) { ok(false, key + ': el nivel no cargó'); await p.close(); continue; }
    if (key === 'valle') ok(st.ok && st.on, 'WebGL2 disponible: el modo 2.5D está activo' + (st.err ? ' (' + st.err + ')' : ''));
    if (['valle', 'solaria', 'gea', 'bateria', 'puerto'].includes(key)) {
      const r = await p.evaluate(COMPARE);
      ok(r.diffFrac < 0.006 && r.mean < 1.5, key + ': fase 1, la composición plana es igual al modo clásico (' + (r.diffFrac * 100).toFixed(2) + ' % de píxeles distintos, diferencia media ' + r.mean.toFixed(2) + ')');
      ok(r.frontBad / Math.max(1, r.front) < 0.002 && r.covered > 2000, key + ': fase 2, las caras frontales no se mueven (' + r.frontBad + ' de ' + r.front + ' distintos) y el relieve cubre ' + r.covered + ' píxeles de fondo');
    }
    // modo completo durante unos fotogramas
    await p.evaluate(() => { LL.Cut.abort(); LL.D25.quality = 'alta'; });
    await p.waitForTimeout(500);
    const full = await p.evaluate(() => {
      const D = LL.D25, gl = D.gl, px = new Uint8Array(4 * 960 * 540);
      LL.Game.draw();
      gl.readPixels(0, 0, 960, 540, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const cols = new Set(); for (let i = 0; i < px.length; i += 4 * 97) cols.add(px[i] >> 3 << 10 | px[i + 1] >> 3 << 5 | px[i + 2] >> 3);
      return { ok: D.ok, shown: D.shown, err: D.err, glErr: gl.getError(), colors: cols.size };
    });
    ok(full.ok && full.shown && full.glErr === 0 && full.colors > 60, key + ': modo completo sin errores (' + full.colors + ' tonos' + (full.err ? ', ' + full.err : '') + ')');
    await p.screenshot({ path: outDir + '/d25_' + key + '.png' });
    if (key === 'valle') {
      // derrota: el mundo pierde el color también en 2.5D
      const g = await p.evaluate(async () => {
        const lv = LL.G.run.level, sc = new LL.DefeatScene(lv); LL.Scenes.push(sc);
        await new Promise(r => setTimeout(r, 3000));
        return { gray: LL.D25.gray, want: Math.min(1, Math.max(0, (sc.t - 0.3) / 2)) };
      });
      ok(g.gray > 0.3 && Math.abs(g.gray - g.want) < 0.1, 'derrota: el mundo se vuelve gris en 2.5D (' + g.gray.toFixed(2) + ')');
      await p.screenshot({ path: outDir + '/d25_derrota.png' });
    }
    await p.close();
  }
  // sin WebGL2: vuelve al dibujo clásico
  {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const e2 = [];
    p.on('pageerror', e => e2.push(e.message));
    await p.addInitScript(() => { const gc = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, o) { return t === 'webgl2' ? null : gc.call(this, t, o); }; });
    await p.goto('file://' + gameFile + '#level=valle&d25=1'); await p.waitForTimeout(1200);
    const r = await p.evaluate(() => { const d = document.getElementById('game').getContext('2d').getImageData(480, 300, 1, 1).data; return { ok: LL.D25.ok, on: LL.D25.on, shown: LL.D25.shown, a: d[3] }; });
    ok(!r.ok && !r.on && !r.shown && r.a === 255 && !e2.length, 'sin WebGL2 el juego se dibuja en modo clásico' + (e2.length ? ' · ' + e2.join(' | ') : ''));
    await p.close();
  }
  // contexto perdido a mitad de partida: vuelve al modo clásico sin errores
  {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const e3 = [];
    p.on('pageerror', e => e3.push(e.message));
    await p.goto('file://' + gameFile + '#level=valle&d25=1'); await p.waitForTimeout(1000);
    await p.evaluate(() => { LL.D25.gl.getExtension('WEBGL_lose_context').loseContext(); });
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ ok: LL.D25.ok, shown: LL.D25.shown, a: document.getElementById('game').getContext('2d').getImageData(480, 300, 1, 1).data[3] }));
    ok(!r.ok && !r.shown && r.a === 255 && !e3.length, 'si se pierde el contexto WebGL, sigue en modo clásico' + (e3.length ? ' · ' + e3.join(' | ') : ''));
    await p.close();
  }
  // Ajustes: 2.5D → HD → CLÁSICOS → 2.5D
  {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    await p.goto('file://' + gameFile + '#d25=1'); await p.waitForTimeout(900);
    const seq = await p.evaluate(async () => {
      const S = LL.G.save.settings, out = [], st = () => (S.hd === false ? 'CLÁSICOS' : S.d25 !== false ? '2.5D' : 'HD') + (LL.D25.on ? '+gpu' : '');
      LL.Scenes.push(new LL.S.SettingsScene()); await new Promise(r => setTimeout(r, 200));
      out.push(st());
      for (let i = 0; i < 3; i++) { LL.UI.clicks.add('thd'); await new Promise(r => setTimeout(r, 200)); out.push(st()); }
      return out;
    });
    ok(seq.join(' → ') === '2.5D+gpu → HD → CLÁSICOS → 2.5D+gpu', 'Ajustes → Gráficos: ' + seq.join(' → '));
    await p.screenshot({ path: outDir + '/d25_ajustes.png' });
    await p.close();
  }
  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.slice(0, 8).join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'GRÁFICOS 2.5D OK');
  process.exitCode = fails ? 1 : 0;
})();
