// Combate: prueba el Lumisable contra enemigos (tajos, rebote, pulso, parada) y recorre
// los 10 jefes regionales: presentación, programa visible con la Lente, cambio de fase
// con parche, derrota, recompensas y vuelta al mapa.
// Uso: node tools/tests/bosses.js [clave1,clave2,...]
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  const keys = (process.argv[2] || 'puerto,valle,solaria,aeris,hydria,bioloop,gea,h2,bateria,prisma').split(',');
  const b = await chromium.launch();
  let fails = 0;
  const newPage = async (hash) => {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto('file://' + gameFile + (hash || ''));
    await p.waitForTimeout(700);
    return { p, errs };
  };

  // ---------- 1. Lumisable contra enemigos ----------
  {
    const { p, errs } = await newPage('#level=puerto');
    const r = await p.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const L = [];
      LL.Cut.abort(); LL.G.noDamage = true; LL.setFlag('saberIntro'); LL.setFlag('healTip');
      const lv = LL.G.run.level, pl = lv.player;
      const foes = lv.entities.filter(e => e.hostile && e.onHit && e.type);
      L.push('enemigos en el Puerto: ' + foes.length + ' (' + [...new Set(foes.map(e => e.type))].join(', ') + ')');
      // quitar los enemigos generados para una prueba controlada
      foes.forEach(e => { e.dead = true; });
      await sleep(50);
      const spawn = (type, dx) => { const e = LL.makeEnemy(lv, Math.floor(pl.x / 16 + dx) * 16, Math.floor((pl.y + pl.h) / 16 - 1) * 16, { type }); lv.addEntity(e); return e; };
      const tap = async (code, ms = 60) => { LL.Input.keys[code] = true; LL.Input.pressedCodes[code] = true; await sleep(ms); LL.Input.keys[code] = false; LL.Input.releasedCodes[code] = true; };
      // tajos contra un Toro-Ohm (4 de vida)
      const t = spawn('charger', 2); t.face = -1; t.st = 'stun'; t.stT = 99;
      pl.face = 1;
      for (let i = 0; i < 6 && !t.dead; i++) { await tap('KeyX'); await sleep(320); }
      L.push('tajos: toro-ohm ' + (t.dead ? 'DEPURADO' : 'vivo hp=' + t.hp));
      // pulso cargado
      const h = spawn('hopper', 4); h.st = 'idle'; h.stT = 99; pl.energy = 100;
      LL.Input.keys.KeyX = true; LL.Input.pressedCodes.KeyX = true; await sleep(900); LL.Input.keys.KeyX = false; LL.Input.releasedCodes.KeyX = true;
      await sleep(600);
      L.push('pulso: ' + (h.dead ? 'bit saltarín DEPURADO' : 'vivo hp=' + h.hp) + ' · energía ' + Math.round(pl.energy));
      // parada: devolver un disparo
      const tur = spawn('turret', 5); tur.hp = tur.maxHp = 1; tur.st = 'scan'; tur.stT = 99;
      const shot = new LL.S.Shot(lv, pl.cx + 16, pl.y + 10, -60, 0, { owner: tur, color: '#FF6B6B', r: 3 });
      lv.addEntity(shot);
      await sleep(80); await tap('KeyX');
      await sleep(900);
      L.push('parada: disparo ' + (shot.friendly ? 'DEVUELTO' : 'no devuelto') + ' · torretín ' + (tur.dead ? 'DEPURADO' : 'vivo'));
      // rebote (pogo) sobre un enemigo desde el aire
      const z = spawn('hopper', 0); z.st = 'idle'; z.stT = 99; z.hp = 5; z.maxHp = 5;
      pl.x = z.x - 1; pl.y = z.y - 34; pl.vy = 60; pl.onGround = false;
      LL.Input.keys.ArrowDown = true; await tap('KeyX'); await sleep(40); LL.Input.keys.ArrowDown = false;
      await sleep(120);
      L.push('pogo: vy=' + Math.round(pl.vy) + ' (negativo = rebote) · hp enemigo ' + z.hp);
      // recarga de célula
      z.dead = true; pl.cells = 1; pl.energy = 100; pl.vx = 0;
      await sleep(400);
      LL.Input.keys.ArrowDown = true; await sleep(1300); LL.Input.keys.ArrowDown = false;
      L.push('recarga: células ' + pl.cells + '/' + pl.maxCells + ' · energía ' + Math.round(pl.energy));
      return L;
    });
    console.log(r.join('\n'));
    const ok = r.some(l => l.includes('toro-ohm DEPURADO')) && r.some(l => l.includes('pulso: bit saltarín DEPURADO')) && r.some(l => l.includes('DEVUELTO')) && r.some(l => /pogo: vy=-/.test(l)) && r.some(l => l.includes('células 2/'));
    if (!ok) fails++;
    await p.screenshot({ path: outDir + '/combat_puerto.png' });
    console.log('combate:', ok ? 'OK' : 'FALLO', errs.length ? '\n   ' + errs.join('\n   ') : '');
    if (errs.length) fails++;
    await p.close();
  }

  // ---------- 2. Jefes ----------
  for (const k of keys) {
    const { p, errs } = await newPage('');
    const r = await p.evaluate(async (k) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const L = [];
      LL.G.autoDialog = true; LL.G.autoWin = true; LL.G.noDamage = true;
      LL.G.save.started = true; LL.setFlag('prologueDone'); LL.G.save.bossGate = true;
      LL.Game.startLevel('jefe_' + k);
      let t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(LL.G.run.level && LL.G.run.level.rboss && LL.G.run.level.rboss.state === 'fight')) await sleep(50);
      const lv = LL.G.run.level, bo = lv.rboss;
      L.push(k + ': ' + (bo ? bo.D.name + ' · estado ' + bo.state : 'SIN JEFE'));
      if (!bo || bo.state !== 'fight') return L;
      LL.G.autoDialog = false;
      // fase 1: dejar que ejecute su programa completo con la Lente activa
      lv.lens = true;
      const lines = new Set();
      t0 = performance.now();
      while (performance.now() - t0 < 11000) { lines.add(bo.line); await sleep(60); }
      L.push('  fase 1: líneas ejecutadas ' + [...lines].filter(x => x >= 0).sort().join(',') + ' de ' + bo.D.code(bo).length);
      lv.lens = false;
      // alcanzable: en su ventana vulnerable, un tajo desde el suelo le hace daño
      const tap = async (code, ms = 60) => { LL.Input.keys[code] = true; LL.Input.pressedCodes[code] = true; await sleep(ms); LL.Input.keys[code] = false; LL.Input.releasedCodes[code] = true; };
      if (k === 'bateria') { for (let n = 0; n < 6; n++) { const left = bo.parts.filter(c => !c.gone); if (!left.length) break; const c = left.sort((a, b) => a.num - b.num)[0]; bo.D.partHit(bo, c, { dmg: 1, dir: 1 }); } }
      const vuln = () => k === 'hydria' ? bo.parts.find(h => h.stuck > 0.6) : k === 'h2' ? bo.parts.find(t => t.mode === 'planted' && t.idx === bo.vars.next && !t.done) : k === 'bioloop' ? (bo.open ? bo : null) : (bo.stunned ? bo : null);
      t0 = performance.now(); let tgt = null;
      while (performance.now() - t0 < 16000 && !(tgt = vuln())) await sleep(30);
      if (!tgt) L.push('  alcance: NO llegó a su ventana vulnerable');
      else {
        const r = tgt === bo ? bo.hitRect() : tgt, pl = lv.player, hp0 = bo.hp;
        const fromLeft = r.x - 16 > 20;
        pl.x = fromLeft ? r.x - 16 : r.x + r.w + 6; pl.y = 240 - pl.h; pl.vx = 0; pl.vy = 0; pl.face = fromLeft ? 1 : -1; pl.atkCD = 0; pl.atk = null;
        await sleep(40); await tap('KeyX'); await sleep(250);
        L.push('  alcance: ' + (bo.hp < hp0 ? 'OK (' + hp0 + '→' + bo.hp + ')' : 'SIN DAÑO en ' + JSON.stringify({ x: Math.round(r.x), y: Math.round(r.y), w: r.w, h: r.h })));
      }
      await sleep(10);
      // vida triple (doble con la ayuda de combate)
      L.push('  vida: ' + (bo.maxHp === bo.D.hp * (LL.G.save.settings.assist ? 2 : 3) ? 'TRIPLE OK' : 'MAL ' + bo.maxHp + ' vs base ' + bo.D.hp));
      // fase 2 a 2/3 de vida (el parche se resuelve solo en la prueba)
      LL.G.autoDialog = true;
      bo.hurtCD = 0; bo.damage({ dmg: Math.ceil(bo.hp - bo.maxHp * 2 / 3) + 1, dir: 1 });
      t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(bo.stage === 2 && bo.state === 'fight')) await sleep(50);
      L.push('  fase 2: ' + (bo.phase === 2 && bo.stage === 2 && bo.state === 'fight' && bo.hp > bo.maxHp / 3 ? 'OK' : 'NO') + ' · parche ' + bo.patched);
      LL.G.autoDialog = false;
      lines.clear(); t0 = performance.now();
      while (performance.now() - t0 < 9000) { lines.add(bo.line); await sleep(60); }
      L.push('  fase 2: líneas ejecutadas ' + [...lines].filter(x => x >= 0).sort().join(','));
      // fase 3 (FURIA) a 1/3 de vida, con el parche final
      LL.G.autoDialog = true;
      bo.hurtCD = 0; bo.damage({ dmg: Math.ceil(bo.hp - bo.maxHp / 3) + 1, dir: 1 });
      t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(bo.stage === 3 && bo.state === 'fight')) await sleep(50);
      L.push('  fase 3: ' + (bo.stage === 3 && bo.state === 'fight' && bo.hp > 0 ? 'OK' : 'NO') + ' · parche final ' + bo.patched2);
      LL.G.autoDialog = false;
      // ERROR CRÍTICO: avisa, lanza peligros y termina sobrecalentado
      const before = new Set(lv.entities);
      bo.pendingSpecial = true; bo.gen = null; bo.stunned = false;
      t0 = performance.now(); let name = null, spawned = 0, stunned = false;
      while (performance.now() - t0 < 14000) {
        if (bo.special) name = bo.special.name;
        spawned = Math.max(spawned, lv.entities.filter(e => e.bossSpawn && !before.has(e)).length);
        if (name && !bo.special && bo.stunned) { stunned = true; break; }
        await sleep(40);
      }
      L.push('  especial: ' + (name && spawned > 0 && stunned ? 'OK' : 'NO') + ' · «' + name + '» · ' + spawned + ' peligros · sobrecalentado=' + stunned);
      // derrota
      LL.G.autoDialog = true;
      const shards = LL.G.save.cellShards || 0;
      t0 = performance.now();
      while (performance.now() - t0 < 15000 && (bo.state === 'fight' || bo.state === 'shift')) { if (bo.state === 'fight') { bo.hurtCD = 0; bo.damage({ dmg: 3, dir: 1 }); } await sleep(20); }
      t0 = performance.now();
      while (performance.now() - t0 < 12000 && !(LL.Scenes.top() && LL.Scenes.top().constructor.name === 'MapScene')) await sleep(80);
      L.push('  derrota: flag=' + LL.flag('boss_' + k) + ' · fragmentos ' + shards + '→' + (LL.G.save.cellShards || 0) + ' · atlas=' + !!LL.G.save.codex['b_' + k] + ' · escena ' + (LL.Scenes.top() ? LL.Scenes.top().constructor.name : '-'));
      return L;
    }, k);
    console.log(r.join('\n'));
    const ok = ['vida: TRIPLE OK', 'fase 2: OK', 'fase 3: OK', 'especial: OK', 'alcance: OK'].every(w => r.some(l => l.includes(w))) && r.some(l => l.includes('flag=true') && l.includes('MapScene'));
    console.log('  ' + (ok ? 'OK' : 'FALLO') + (errs.length ? '\n   ' + errs.join('\n   ') : ''));
    if (!ok || errs.length) fails++;
    await p.close();
  }

  // ---------- 2b. Parche fallido → ERROR CRÍTICO (puede costar una célula) ----------
  {
    const { p, errs } = await newPage('');
    const r = await p.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const L = [];
      LL.G.autoDialog = true; LL.G.noDamage = true; LL.G.save.started = true; LL.setFlag('prologueDone'); LL.setFlag('saberIntro');
      LL.Game.startLevel('jefe_puerto');
      let t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(LL.G.run.level && LL.G.run.level.rboss && LL.G.run.level.rboss.state === 'fight')) await sleep(50);
      const lv = LL.G.run.level, bo = lv.rboss, pl = lv.player;
      bo.hurtCD = 0; bo.damage({ dmg: Math.ceil(bo.hp - bo.maxHp * 2 / 3) + 1, dir: 1 });
      // el parche: primero una respuesta equivocada y luego la buena (= parche a medias)
      t0 = performance.now(); let quiz = null;
      while (performance.now() - t0 < 8000 && !(quiz = LL.Scenes.stack.find(s => s.constructor.name === 'QuizScene'))) await sleep(50);
      if (!quiz) { L.push('parche: NO apareció'); return L; }
      const wrong = quiz.cfg.options.findIndex((o, i) => i !== quiz.cfg.answer);
      quiz.pick(wrong); await sleep(100); quiz.pick(quiz.cfg.answer); await sleep(100); quiz.exit(quiz.result);
      t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(bo.stage === 2 && bo.state === 'fight')) await sleep(50);
      L.push('parche: ' + bo.patched + ' · ataque pendiente=' + bo.pendingSpecial);
      // Lía se queda quieta: la lluvia de errores apunta a ella
      LL.G.autoDialog = false; LL.G.noDamage = false; pl.inv = 0; pl.cells = pl.maxCells; const c0 = pl.cells;
      t0 = performance.now(); let saw = false;
      while (performance.now() - t0 < 12000) { if (bo.special) saw = true; if (saw && !bo.special) break; pl.vx = 0; await sleep(40); }
      L.push('especial tras parche fallido: ' + (saw ? 'SÍ' : 'NO') + ' · células ' + c0 + '→' + pl.cells);
      return L;
    });
    console.log(r.join('\n'));
    const ok = r.some(l => l.includes('parche: partial') && l.includes('pendiente=')) && r.some(l => /especial tras parche fallido: SÍ · células (\d)→(\d)/.test(l) && +RegExp.$2 < +RegExp.$1);
    console.log('parche fallido:', ok ? 'OK' : 'FALLO', errs.length ? '\n   ' + errs.join('\n   ') : '');
    if (!ok || errs.length) fails++;
    await p.close();
  }

  // ---------- 3. Flujo: salida de la isla → jefe → mapa → siguiente isla ----------
  {
    const { p, errs } = await newPage('');
    const r = await p.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const L = [];
      LL.Game.newGame(); await sleep(900);
      LL.G.autoDialog = true; LL.G.autoWin = true; LL.G.noDamage = true;
      LL.setFlag('prologueDone'); LL.setFlag('restored_puerto');
      L.push('bossGate (partida nueva) = ' + LL.G.save.bossGate);
      LL.Game.startLevel('puerto'); await sleep(1200);
      let t0 = performance.now(); while (LL.Cut.active && performance.now() - t0 < 15000) await sleep(50);
      const lv = LL.G.run.level, ex = lv.entities.find(e => e.constructor.name === 'Exit' && (!e.cfg.run));
      ex.interact();
      t0 = performance.now(); while (performance.now() - t0 < 10000 && !(LL.G.run.level && LL.G.run.level.key === 'jefe_puerto' && LL.G.run.level.rboss.state === 'fight')) await sleep(50);
      L.push('salida del Puerto → ' + (LL.G.run.level ? LL.G.run.level.key : '-'));
      const bo = LL.G.run.level.rboss;
      while (bo.state !== 'dying' && bo.state !== 'friend') { if (bo.state === 'fight') { bo.hurtCD = 0; bo.damage({ dmg: 4, dir: 1 }); } await sleep(60); }
      t0 = performance.now(); while (performance.now() - t0 < 15000 && !(LL.Scenes.top() && LL.Scenes.top().constructor.name === 'MapScene')) await sleep(80);
      L.push('tras el jefe → ' + (LL.Scenes.top() ? LL.Scenes.top().constructor.name : '-') + ' · boss_puerto=' + LL.flag('boss_puerto'));
      return L;
    });
    console.log(r.join('\n'));
    const ok = r.some(l => l.includes('→ jefe_puerto')) && r.some(l => l.includes('MapScene') && l.includes('boss_puerto=true'));
    console.log('flujo:', ok ? 'OK' : 'FALLO', errs.length ? '\n   ' + errs.join('\n   ') : '');
    if (!ok || errs.length) fails++;
    await p.close();
  }

  // ---------- 4. Capturas con la Lente (programa del jefe) ----------
  for (const k of ['puerto', 'hydria', 'bateria']) {
    if (!keys.includes(k)) continue;
    const { p, errs } = await newPage('');
    await p.evaluate(async (k) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      LL.G.autoDialog = true; LL.G.noDamage = true; LL.G.save.started = true; LL.setFlag('prologueDone');
      LL.Game.startLevel('jefe_' + k);
      const t0 = performance.now();
      while (performance.now() - t0 < 8000 && !(LL.G.run.level && LL.G.run.level.rboss && LL.G.run.level.rboss.state === 'fight')) await sleep(50);
      LL.G.autoDialog = false; LL.G.run.level.lens = true;
      await sleep(2600);
    }, k);
    await p.screenshot({ path: outDir + '/boss_' + k + '.png' });
    if (errs.length) { console.log(k, errs.join('\n')); fails++; }
    await p.close();
  }
  await b.close();
  console.log(fails ? 'FALLOS: ' + fails : 'TODO OK');
  process.exit(fails ? 1 : 0);
})();
