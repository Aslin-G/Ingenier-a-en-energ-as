// Recorre la campaña completa de principio a fin (diálogos y puzzles automáticos)
// y verifica que cada región se restaura y que el juego termina en el epílogo.
// Uso: node tools/tests/walk.js
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  const file = gameFile, out = outDir + '/walk';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + file);
  await p.waitForTimeout(600);
  const log = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const L = [];
    const waitIdle = async (ms = 15000) => { const t0 = performance.now(); while (performance.now() - t0 < ms) { const top = LL.Scenes.top(); if (!LL.Cut.active && top && top.lv && !Trans_busy()) return true; await sleep(40); } return false; };
    const Trans_busy = () => false;
    LL.G.autoDialog = true; LL.G.autoWin = true;
    LL.Game.newGame();
    await sleep(900);
    const regions = ['festival', 'puerto', 'valle', 'solaria', 'aeris', 'hydria', 'bioloop', 'gea', 'h2', 'bateria', 'prisma', 'faro', 'faro_top'];
    for (const key of regions) {
      // entrar al nivel si no estamos
      let lv = LL.G.run.level;
      // esperar a que termine la cinemática en curso antes de cambiar de nivel (como haría un jugador)
      for (let tries = 0; tries < 3 && (!lv || lv.key !== key); tries++) {
        const t0 = performance.now(); while (LL.Cut.active && performance.now() - t0 < 20000) await sleep(50);
        LL.Game.startLevel(key); await sleep(1100);
        lv = LL.G.run.level;
      }
      lv = LL.G.run.level;
      if (!lv || lv.key !== key) { L.push(key + ': NO SE CARGÓ (actual ' + (lv && lv.key) + ')'); continue; }
      await waitIdle();
      let steps = 0;
      const done = () => key === 'festival' ? LL.flag('prologueDone') : key === 'faro' ? LL.G.run.level.key !== 'faro' : key === 'faro_top' ? LL.flag('ending') : LL.flag('restored_' + (key === 'prisma' ? 'prisma' : key)) && (key !== 'prisma' || LL.flag('pixHealed'));
      while (!done() && steps++ < 50) {
        lv = LL.G.run.level;
        if (lv.key !== key) break;
        // disparadores con condición cumplida
        for (const tr of (lv.def.triggers || [])) { if (tr.done || (tr.flag && LL.flag(tr.flag))) continue; if (tr.cond && !tr.cond(lv)) continue; lv.player.x = tr.x * 16 + 4; if (tr.y != null) lv.player.y = (tr.y + 1) * 16; await sleep(120); await waitIdle(); }
        // recoger objetos de la mochila
        if (key === 'bioloop' && LL.G.save.abilities.pack) for (const e of lv.entities.slice()) if (e.constructor.name === 'PackItem' && !e.dead) { lv.player.x = e.x; lv.player.y = e.y - 8; await sleep(60); }
        const id = lv.def.pointAt ? lv.def.pointAt(lv) : null;
        let e = id ? lv.get(id) : null;
        if (!e && key === 'faro') { e = lv.entities.find(x => x.constructor.name === 'Exit'); }
        if (!e) { L.push(key + ': sin objetivo (paso ' + steps + ')'); break; }
        if (e.cfg && e.cfg.onAbility && !(e.cfg.run)) { e.onAbility(e.cfg.look === 'node' ? 'beam' : 'portal', lv.player); await sleep(80); continue; }
        if (e.canInteract && !e.canInteract()) { L.push(key + ': ' + id + ' no interactuable (paso ' + steps + ')'); break; }
        lv.player.x = e.x; lv.player.y = e.y + (e.h || 16) - 20;
        e.interact();
        await sleep(100);
        await waitIdle(20000);
      }
      L.push(key + ': ' + (done() ? 'COMPLETADO' : 'INCOMPLETO') + ' en ' + steps + ' pasos');
      if (key === 'faro_top') { await sleep(2500); }
    }
    // epílogo
    await sleep(1500);
    let t0 = performance.now();
    while (performance.now() - t0 < 20000 && !(LL.Scenes.top() && LL.Scenes.top().constructor.name === 'TitleScene')) await sleep(100);
    L.push('final: ' + (LL.Scenes.top() ? LL.Scenes.top().constructor.name : 'nada') + ' · ending=' + LL.flag('ending') + ' · lab=' + LL.G.save.labUnlocked);
    L.push('habilidades: ' + Object.keys(LL.G.save.abilities).join(','));
    L.push('atlas: ' + Object.keys(LL.G.save.codex).length + ' / ' + Object.keys(LL.CODEX).length);
    L.push('misiones hechas: ' + Object.values(LL.G.save.quests).filter(x => x === 'done').length);
    L.push('xp: ' + LL.G.save.xp + ' nivel ' + LL.G.save.level + ' logros ' + Object.keys(LL.G.save.achievements).length);
    return L;
  });
  console.log(log.join('\n'));
  await p.screenshot({ path: out + '_end.png' });
  console.log('ERRORS:', errs.length ? errs.slice(0, 15).join('\n') : 'none');
  await b.close();
})();
