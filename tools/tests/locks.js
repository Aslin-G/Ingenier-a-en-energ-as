// Cerraduras de código: los generadores producen preguntas válidas (una respuesta
// correcta, tres opciones distintas, traza coherente y solo caracteres de la fuente),
// cada isla tiene cofres sobre suelo firme, y el flujo fallar → traza → variante
// nueva → acertar → recompensa funciona.
// Uso: node tools/tests/locks.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium, gameFile, outDir } = require('./_pw');
const fontSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', '02_font.js'), 'utf8');
const body = fontSrc.slice(fontSrc.indexOf('const GLYPHS = {') + 'const GLYPHS = '.length);
const GLYPHS = eval('(' + body.slice(0, body.indexOf('\n};') + 2) + ')');
// equivalencias que la fuente dibuja con otro glifo (− se dibuja como -)
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
  await p.goto('file://' + gameFile + '#level=aeris');
  await p.waitForTimeout(800);

  // 1) generadores
  const gen = await p.evaluate(() => {
    const out = { bad: [], chars: '', maxW: 0, count: 0 };
    const strip = s => s.replace(/\{[a-z]?\}|\{\/\}/g, '');
    for (const reg of Object.keys(LL.LOCK_GEN)) for (let seed = 1; seed <= 300; seed++) {
      const q = LL.makeLockQuestion(reg, seed * 977 + 13);
      out.count++;
      const oks = q.options.filter(o => o.ok);
      const vals = new Set(q.options.map(o => o.v));
      if (q.options.length !== 3 || oks.length !== 1 || vals.size !== 3 || oks[0].v !== String(q.answer)) out.bad.push(reg + '#' + seed + ' opciones ' + JSON.stringify(q.options.map(o => o.v)) + ' resp ' + q.answer);
      if (!q.trace.length || q.trace.some(t => t[0] < 0 || t[0] >= q.code.length)) out.bad.push(reg + '#' + seed + ' traza');
      if (q.options.some(o => !o.ok && !o.why)) out.bad.push(reg + '#' + seed + ' falta explicación');
      if (q.options.some(o => /NaN|undefined|Infinity/.test(o.v)) || /NaN|undefined/.test(q.code.join(''))) out.bad.push(reg + '#' + seed + ' valor raro');
      const txt = q.code.map(strip).join('') + q.ask + q.title + q.hint + q.trace.map(t => t[1]).join('') + q.options.map(o => o.v + (o.why || '')).join('');
      out.chars += txt;
      for (const l of q.code) out.maxW = Math.max(out.maxW, LL.textW(strip(l)));
    }
    out.chars = [...new Set(out.chars)].join('');
    return out;
  });
  ok(gen.bad.length === 0, `${gen.count} preguntas generadas y válidas` + (gen.bad.length ? '\n     ' + gen.bad.slice(0, 8).join('\n     ') : ''));
  const missing = [...gen.chars].filter(ch => ch !== ' ' && !GLYPHS[ch] && !GLYPHS[ch.toUpperCase()] && !GLYPHS[ALIAS[ch]]);
  ok(missing.length === 0, 'todos los caracteres existen en la fuente' + (missing.length ? ': ' + missing.join(' ') : ''));
  ok(gen.maxW <= 290, `las líneas de código caben en el holograma (máx ${gen.maxW} px)`);

  // 2) cofres en cada isla, sobre suelo firme
  const placed = await p.evaluate(() => {
    const res = {};
    for (const k of ['puerto', 'valle', 'solaria', 'aeris', 'hydria', 'bioloop', 'gea', 'h2', 'bateria', 'prisma']) {
      const lv = LL.buildLevel(k);
      const locks = lv.entities.filter(e => e instanceof LL.CodeLock);
      res[k] = locks.map(l => { const tx = Math.floor(l.cx / 16), ty = Math.floor((l.y + l.h) / 16); return { tx, ground: lv.tile(tx, ty) === '#', air: lv.tile(tx, ty - 1) === '.', crystals: l.crystals.length }; });
    }
    return res;
  });
  for (const k in placed) ok(placed[k].length >= 1 && placed[k].every(l => l.ground && l.air && l.crystals === 3), `${k}: ${placed[k].length} cofre(s) sobre suelo, 3 cristales`);

  // 3) flujo completo en Aeris
  await p.evaluate(() => { LL.Cut.abort(); LL.G.noDamage = true; LL.G.save.locks = {}; LL.G.save.forgeCores = 0; LL.setFlag('saberIntro'); });
  const lockInfo = await p.evaluate(() => {
    const lv = LL.G.run.level, lock = lv.entities.find(e => e instanceof LL.CodeLock);
    lv.player.x = lock.cx - 40; lv.player.y = lock.y + lock.h - lv.player.h - 1; lv.player.vx = 0; lv.player.vy = 0;
    lv.cam.x = lock.cx - 240; lv.cam.y = lv.player.y - 150;
    return { id: lock.id, ask: lock.q.ask };
  });
  await p.waitForTimeout(700);
  const near = await p.evaluate(() => { const lv = LL.G.run.level; return { panel: !!lv.lockPanel, near: lv.lockPanel ? lv.lockPanel.near : 0 }; });
  ok(near.panel && near.near > 0.9, 'al acercarse aparece el holograma con el código');
  await p.screenshot({ path: outDir + '/locks_panel.png' });
  const wrong = await p.evaluate(() => {
    const lv = LL.G.run.level, lock = lv.lockPanel, q0 = lock.q;
    const c = lock.crystals.find(c => !c.opt.ok);
    c.onHit({ dmg: 1 });
    const top = LL.Scenes.top();
    return { trace: top instanceof LL.TraceScene, why: c.opt.why, q0: q0.code.join('|') };
  });
  ok(wrong.trace && !!wrong.why, 'un cristal equivocado abre la traza con la explicación del error típico');
  await p.waitForTimeout(3500);
  await p.screenshot({ path: outDir + '/locks_trace.png' });
  const after = await p.evaluate(() => {
    const top = LL.Scenes.top(); top.close();
    const lv = LL.G.run.level, lock = lv.entities.find(e => e instanceof LL.CodeLock);
    return { code: lock.q.code.join('|'), crystals: lock.crystals.filter(c => !c.dead).length, busy: lock.busy };
  });
  ok(after.code !== wrong.q0 && after.crystals === 3 && !after.busy, 'tras la traza llega una variante nueva con 3 cristales');
  const good = await p.evaluate(() => {
    const lv = LL.G.run.level, lock = lv.entities.find(e => e instanceof LL.CodeLock);
    const c = lock.crystals.find(c => c.opt.ok);
    c.interact();
    const st = LL.G.save.locks[lock.id];
    return { solved: lock.solved, cores: LL.G.save.forgeCores, st, saved: JSON.parse(localStorage.getItem('luminaLoopSave') || '{}').locks };
  });
  ok(good.solved && good.cores === 1 && good.st.solved && good.st.tries === 2 && good.saved && good.saved[lockInfo.id], 'la respuesta correcta abre el cofre, da 1 núcleo (2.º intento) y se guarda');
  await p.waitForTimeout(900);
  await p.screenshot({ path: outDir + '/locks_open.png' });
  // un cofre abierto sigue abierto al volver a cargar el nivel
  const reopen = await p.evaluate(id => { const lv = LL.buildLevel('aeris'); const l = lv.entities.find(e => e instanceof LL.CodeLock && e.id === id); return { solved: l.solved, crystals: l.crystals.length }; }, lockInfo.id);
  ok(reopen.solved && reopen.crystals === 0, 'el cofre resuelto queda abierto al volver');

  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'CERRADURAS OK');
  process.exitCode = fails ? 1 : 0;
})();
