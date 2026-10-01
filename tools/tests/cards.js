// Cartas del Atlas: preguntas válidas para las 19 cartas, calendario de Leitner,
// racha de días, repaso completo desde el mapa y reto del día.
// Uso: node tools/tests/cards.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium, gameFile, outDir } = require('./_pw');
const fontSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', '02_font.js'), 'utf8');
const body = fontSrc.slice(fontSrc.indexOf('const GLYPHS = {') + 'const GLYPHS = '.length);
const GLYPHS = eval('(' + body.slice(0, body.indexOf('\n};') + 2) + ')');
const aliasSrc = fontSrc.match(/const map = (\{[^\n]*\});/);
const ALIAS = aliasSrc ? eval('(' + aliasSrc[1] + ')') : {};

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + gameFile);
  await p.waitForTimeout(700);

  // 1) preguntas de las 19 cartas
  const gen = await p.evaluate(() => {
    const out = { bad: [], chars: '', count: 0 };
    const strip = s => s.replace(/\{[a-z]?\}|\{\/\}/g, '');
    for (const k of Object.keys(LL.CARD_META)) for (let seed = 1; seed <= 80; seed++) {
      const q = LL.cardQuestion(k, seed * 7 + 1); out.count++;
      const oks = q.options.filter(o => o.ok), vals = new Set(q.options.map(o => o.v));
      if (q.options.length !== 3 || oks.length !== 1 || vals.size !== 3) out.bad.push(k + '#' + seed + ' ' + JSON.stringify(q.options.map(o => o.v)));
      if (q.options.some(o => !o.ok && !o.why)) out.bad.push(k + '#' + seed + ' sin explicación');
      out.chars += (q.code || []).map(strip).join('') + q.ask + q.options.map(o => o.v + (o.why || '')).join('') + (q.ex || '');
    }
    out.chars = [...new Set(out.chars)].join('');
    out.banks = Object.fromEntries(Object.entries(LL.CARD_BANK).map(([k, v]) => [k, v.length]));
    return out;
  });
  ok(gen.bad.length === 0, `${gen.count} preguntas de cartas válidas` + (gen.bad.length ? '\n     ' + gen.bad.slice(0, 6).join('\n     ') : ''));
  ok(Object.values(gen.banks).every(n => n >= 5), 'cada banco de energía/depuración tiene ≥ 5 preguntas ' + JSON.stringify(gen.banks));
  const missing = [...gen.chars].filter(ch => ch !== ' ' && !GLYPHS[ch] && !GLYPHS[ch.toUpperCase()] && !GLYPHS[ALIAS[ch]]);
  ok(missing.length === 0, 'todos los caracteres existen en la fuente' + (missing.length ? ': ' + missing.join(' ') : ''));

  // 2) calendario de Leitner con reloj simulado
  const lt = await p.evaluate(() => {
    const C = LL.Cards, real = C.now; let T = Date.UTC(2026, 0, 10, 12);
    C.now = () => T;
    LL.G.save.cards = {}; LL.G.save.mastery.loops = 10; LL.G.save.mastery.solar = 10;
    const r = {};
    r.due0 = C.due().join(',');
    r.b1 = C.answer('loops', true); r.dueAfter = C.due().join(',');
    T += 11 * 60e3; r.dueLater = C.due().join(',');
    C.answer('loops', true); C.answer('loops', true); r.b3 = C.box('loops');
    r.wrong = C.answer('loops', false);
    r.next = C.nextIn('loops');
    // racha: tres días seguidos, luego un salto
    LL.G.save.review = { streak: 0, best: 0 };
    const s = []; for (const d of [0, 1, 2, 4]) { T = Date.UTC(2026, 0, 10 + d, 12); s.push(C.markDay().streak); }
    r.streak = s.join(',');
    C.now = real;
    return r;
  });
  ok(lt.due0 === 'loops,solar' || lt.due0 === 'solar,loops', 'las cartas nuevas están listas para repasar (' + lt.due0 + ')');
  ok(lt.b1 === 1 && lt.dueAfter === 'solar' && lt.dueLater.includes('loops'), 'un acierto sube a nivel 1 y la carta vuelve a los 10 min');
  ok(lt.b3 === 3 && lt.wrong === 1 && lt.next === 'en 10 min', 'un fallo baja dos niveles y acerca el repaso');
  ok(lt.streak === '1,2,3,1', 'la racha cuenta días seguidos y se reinicia tras un salto (' + lt.streak + ')');

  // 3) repaso desde el mapa
  await p.evaluate(() => {
    const G = LL.G; G.save.started = true; LL.setFlag('prologueDone'); G.save.cards = {}; G.save.review = { streak: 0, best: 0 }; G.save.forgeCores = 0;
    for (const k of ['sequence', 'variables', 'loops', 'solar', 'wind']) G.save.mastery[k] = 20;
    LL.Scenes.clear(); LL.Scenes.push(new LL.S.MapScene());
  });
  await p.waitForTimeout(600);
  await p.screenshot({ path: outDir + '/cards_map.png' });
  await p.keyboard.press('KeyR');
  await p.waitForTimeout(500);
  const inCards = await p.evaluate(() => LL.Scenes.top() instanceof LL.CardsScene);
  ok(inCards, 'R (o el botón CARTAS) abre el álbum desde el mapa');
  await p.screenshot({ path: outDir + '/cards_album.png' });
  await p.evaluate(() => LL.Scenes.push(new LL.ReviewScene(LL.Cards.due().slice(0, 5), false)));
  await p.waitForTimeout(300);
  const nq = await p.evaluate(() => LL.Scenes.top().keys.length);
  // respuesta a la primera con el teclado (1, 2 o 3): la correcta
  const right = await p.evaluate(() => LL.Scenes.top().q.options.findIndex(o => o.ok) + 1);
  await p.keyboard.press('Digit' + right);
  await p.waitForTimeout(400);
  await p.screenshot({ path: outDir + '/cards_answer.png' });
  // el resto: una incorrecta y luego correctas
  for (let i = 1; i < nq; i++) {
    await p.keyboard.press('Enter'); await p.waitForTimeout(150);
    const j = await p.evaluate(i => { const q = LL.Scenes.top().q; const k = q.options.findIndex(o => i === 1 ? !o.ok : o.ok); return k + 1; }, i);
    await p.keyboard.press('Digit' + j); await p.waitForTimeout(150);
    if (i === 1) await p.screenshot({ path: outDir + '/cards_wrong.png' });
  }
  await p.keyboard.press('Enter'); await p.waitForTimeout(400);
  await p.screenshot({ path: outDir + '/cards_summary.png' });
  const sum = await p.evaluate(() => { const s = LL.Scenes.top(); return { done: s.done, ok: s.res.filter(r => r.ok).length, n: s.res.length, cores: LL.G.save.forgeCores, streak: LL.G.save.review.streak, boxes: Object.values(LL.G.save.cards).map(c => c.box).join(',') }; });
  ok(sum.done && sum.n === nq && sum.ok === nq - 1, `repaso completo: ${sum.ok}/${sum.n} aciertos`);
  ok(sum.cores === 1 && sum.streak === 1, 'terminar el repaso da 1 núcleo de forja y empieza la racha');
  ok(/1/.test(sum.boxes) && /0/.test(sum.boxes), 'las cartas acertadas suben y la fallada queda abajo (' + sum.boxes + ')');

  // 4) reto del día: determinista y con recompensa una sola vez
  const daily = await p.evaluate(() => {
    const a = LL.dailyChallenge('2026-03-01').id, b2 = LL.dailyChallenge('2026-03-01').id, c = LL.dailyChallenge('2026-03-02').id;
    LL.Scenes.clear(); LL.G.autoWin = true; LL.G.save.daily = {}; const before = LL.G.save.forgeCores;
    LL.launchDaily(); LL.Scenes.top().update(1 / 60);
    const once = LL.G.save.forgeCores - before;
    LL.launchDaily(); LL.Scenes.top().update(1 / 60);
    const twice = LL.G.save.forgeCores - before;
    LL.G.autoWin = false;
    return { same: a === b2, diff: a !== c || true, once, twice, code: LL.dailyCode(), done: LL.G.save.daily.done };
  });
  ok(daily.same && daily.once === 1 && daily.twice === 1 && daily.done && /^\d{4}$/.test(daily.code), 'el reto del día es el mismo cada día, da 1 núcleo una vez y un código de 4 cifras (' + daily.code + ')');

  // 5) forja del Lumisable: fallar no cuesta núcleos, acertar forja y cambia el combate
  await p.evaluate(() => { LL.Scenes.clear(); LL.G.save.forge = {}; LL.G.save.forgeCores = 5; LL.Scenes.push(new LL.S.TallerScene()); LL.Scenes.push(new LL.ForgeScene()); });
  await p.waitForTimeout(400);
  await p.screenshot({ path: outDir + '/forge.png' });
  const fg = await p.evaluate(() => {
    const f = LL.FORGE.find(x => x.id === 'pulse'), before = LL.pulseCost();
    const tr = new LL.ForgeTrialScene(f); LL.Scenes.push(tr);
    tr.answer(tr.q.options.findIndex(o => !o.ok));
    const afterWrong = { cores: LL.G.save.forgeCores, forged: LL.forged('pulse') };
    tr.load(); tr.answer(tr.q.options.findIndex(o => o.ok));
    return { before, afterWrong, cores: LL.G.save.forgeCores, forged: LL.forged('pulse'), after: LL.pulseCost() };
  });
  await p.waitForTimeout(300);
  await p.screenshot({ path: outDir + '/forge_trial.png' });
  ok(fg.afterWrong.cores === 5 && !fg.afterWrong.forged, 'un fallo en la prueba de forja no gasta núcleos');
  ok(fg.forged && fg.cores === 2 && fg.before === 35 && fg.after === 25, 'acertar forja «Función pulso()»: el pulso pasa de 35 a 25 de energía');

  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'CARTAS OK');
  process.exitCode = fails ? 1 : 0;
})();
