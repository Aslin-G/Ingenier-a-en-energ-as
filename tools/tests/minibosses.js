// Mini jefes: hay uno a mitad de cada isla, cierra su zona con barreras al
// entrar, ejecuta su patrón (avisos, ataques y descanso), se puede depurar,
// da un núcleo de forja, abre las barreras y no reaparece. Si Lía cae, el
// combate vuelve a empezar.
// Uso: node tools/tests/minibosses.js [isla1,isla2...]
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const keys = (process.argv[2] || 'puerto,valle,solaria,aeris,hydria,bioloop,gea,h2,bateria,prisma').split(',');
  const b = await chromium.launch();
  for (const k of keys) {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    await p.goto('file://' + gameFile + '#level=' + k);
    await p.waitForTimeout(800);
    const r = await p.evaluate(async (k) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      LL.Cut.abort(); LL.G.noDamage = true; LL.setFlag('saberIntro'); LL.setFlag('miniTip');
      const lv = LL.G.run.level, m = lv.miniBoss, pl = lv.player;
      if (!m) return { none: true };
      const out = { name: m.D.name, kind: m.D.kind, states: new Set() };
      // entrar en la zona
      pl.x = m.arena.x0 + 24; pl.y = m.arena.ground - pl.h - 1; pl.vx = pl.vy = 0;
      await sleep(300);
      out.walls = lv.entities.filter(e => e.constructor.name === 'MiniWall' && !e.dead).length;
      out.fight = lv.miniFight === m;
      // dejar que ejecute su algoritmo
      const t0 = performance.now();
      while (performance.now() - t0 < 9000) { out.states.add(m.state); await sleep(40); }
      out.states = [...out.states].join(',');
      // golpearlo en sus descansos hasta depurarlo
      const cores0 = LL.G.save.forgeCores || 0, hp0 = m.hp;
      const t1 = performance.now(); let restHit = false;
      while (!m.dead && performance.now() - t1 < 40000) {
        if (m.state === 'rest' && m.invT <= 0) { const h0 = m.hp; m.onHit({ dmg: 2, dir: 1 }); if (m.hp === h0 - 3) restHit = true; }
        await sleep(60);
      }
      out.restBonus = restHit;
      out.dead = m.dead; out.flag = LL.flag('mini_' + k); out.cores = (LL.G.save.forgeCores || 0) - cores0;
      await sleep(200);
      out.wallsAfter = lv.entities.filter(e => e.constructor.name === 'MiniWall' && !e.dead).length;
      out.hudGone = !lv.miniFight;
      // no reaparece al volver a cargar la isla
      out.again = !!LL.buildLevel(k).miniBoss;
      return out;
    }, k);
    await p.screenshot({ path: outDir + '/mini_' + k + '.png' });
    if (r.none) { ok(false, `${k}: no hay mini jefe`); await p.close(); continue; }
    ok(r.fight && r.walls === 2, `${k}: ${r.name} cierra su zona con 2 barreras`);
    ok(/tele/.test(r.states) && /rest/.test(r.states), `${k}: avisa y descansa (${r.states})`);
    ok(r.restBonus, `${k}: en su descanso recibe +1 de daño`);
    ok(r.dead && r.flag && r.cores === 1 && r.wallsAfter === 0 && r.hudGone, `${k}: depurado → núcleo de forja y barreras abiertas`);
    ok(!r.again, `${k}: no reaparece`);
    ok(errs.length === 0, `${k}: sin errores` + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
    await p.close();
  }
  // si Lía cae durante la pelea, el mini jefe vuelve a empezar
  {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    await p.goto('file://' + gameFile + '#level=valle'); await p.waitForTimeout(800);
    const r = await p.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      LL.Cut.abort(); LL.setFlag('saberIntro'); LL.setFlag('miniTip'); LL.G.noDamage = true;
      const lv = LL.G.run.level, m = lv.miniBoss, pl = lv.player;
      pl.x = m.arena.x0 + 24; pl.y = m.arena.ground - pl.h - 1; await sleep(300);
      m.hp = 3; LL.G.autoDialog = true; lv.respawn(); await sleep(100);
      return { state: m.state, hp: m.hp, max: m.maxHp, walls: lv.entities.filter(e => e.constructor.name === 'MiniWall' && !e.dead).length };
    });
    ok(r.state === 'wait' && r.hp === r.max && r.walls === 0, 'al caer, el mini jefe vuelve a empezar con toda su vida');
    await p.close();
  }
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'MINI JEFES OK');
  process.exitCode = fails ? 1 : 0;
})();
