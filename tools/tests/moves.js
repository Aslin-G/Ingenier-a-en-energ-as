// Movimientos de Lía: mira hacia donde camina, se agacha con ↓ (caja más baja),
// barrida con ↓ + ataque, gancho con ↑ + ataque, pogo en el aire y recarga agachada.
// Uso: node tools/tests/moves.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await p.goto('file://' + gameFile + '#level=valle');
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    LL.Cut.abort(); LL.G.noDamage = true; LL.setFlag('saberIntro'); LL.setFlag('healTip');
    const lv = LL.G.run.level; lv.entities.filter(e => e.hostile && e.onHit && e.type).forEach(e => { e.dead = true; });
    lv.player.x += 160;
  });
  await p.waitForTimeout(400);
  const key = async (code, ms) => { await p.keyboard.down(code); await p.waitForTimeout(ms); await p.keyboard.up(code); };

  // 1) mirar hacia donde camina (antes siempre se dibujaba mirando a la derecha)
  await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(350);
  const left = await p.evaluate(() => { const pl = LL.G.run.level.player, A = LL.Spr.lia[pl.anim]; return { face: pl.face, isL: A.some(f => f.l === pl.lastFrame), isR: A.some(f => f.r === pl.lastFrame) }; });
  await p.keyboard.up('ArrowLeft');
  await p.keyboard.down('ArrowRight'); await p.waitForTimeout(350);
  const right = await p.evaluate(() => { const pl = LL.G.run.level.player, A = LL.Spr.lia[pl.anim]; return { face: pl.face, isL: A.some(f => f.l === pl.lastFrame), isR: A.some(f => f.r === pl.lastFrame) }; });
  await p.keyboard.up('ArrowRight');
  ok(left.face === -1 && left.isL && !left.isR, 'caminando a la izquierda se dibuja el sprite que mira a la izquierda');
  ok(right.face === 1 && right.isR && !right.isL, 'caminando a la derecha se dibuja el sprite que mira a la derecha');
  await p.waitForTimeout(300);

  // 2) agacharse
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(250);
  const cr = await p.evaluate(() => { const pl = LL.G.run.level.player; return { c: pl.crouching, h: pl.h, bottom: pl.y + pl.h, anim: pl.anim }; });
  await p.screenshot({ path: outDir + '/moves_crouch.png' });
  await p.keyboard.up('ArrowDown'); await p.waitForTimeout(150);
  const st = await p.evaluate(() => { const pl = LL.G.run.level.player; return { c: pl.crouching, h: pl.h, bottom: pl.y + pl.h }; });
  ok(cr.c && cr.h === 13 && cr.anim === 'crouch', `con ↓ se agacha: caja de ${cr.h} px y animación ${cr.anim}`);
  ok(!st.c && st.h === 20 && Math.abs(st.bottom - cr.bottom) < 0.5, 'al soltar ↓ se levanta sin moverse los pies');

  // 3) recarga agachada (quieta con ↓)
  const heal = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const pl = LL.G.run.level.player; pl.cells = 1; pl.energy = 100;
    LL.Input.keys.ArrowDown = true; await sleep(1300); LL.Input.keys.ArrowDown = false;
    return pl.cells;
  });
  ok(heal === 2, 'agachada y quieta, Lumi recarga una célula');
  await p.waitForTimeout(300);

  // 4) barrida contra un enemigo delante
  const slide = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lv = LL.G.run.level, pl = lv.player; pl.face = 1; pl.energy = 60;
    const e = LL.makeEnemy(lv, Math.floor(pl.x / 16 + 3) * 16, Math.floor((pl.y + pl.h) / 16 - 1) * 16, { type: 'hopper' }); e.st = 'idle'; e.stT = 99; e.hp = e.maxHp = 9; lv.addEntity(e);
    const x0 = pl.x;
    LL.Input.keys.ArrowDown = true; LL.Input.keys.KeyX = true; LL.Input.pressedCodes.KeyX = true;
    await sleep(60); LL.Input.keys.KeyX = false; LL.Input.releasedCodes.KeyX = true;
    const kind = pl.atk && pl.atk.kind, low = pl.h;
    await sleep(400); LL.Input.keys.ArrowDown = false;
    const r = { kind, low, dx: pl.x - x0, hp: e.hp, max: e.maxHp };
    e.dead = true; return r;
  });
  ok(slide.kind === 'slide' && slide.low === 13, '↓ + ataque en el suelo = barrida agachada');
  ok(slide.dx > 25, `la barrida avanza (${Math.round(slide.dx)} px)`);
  ok(slide.hp < slide.max, 'la barrida golpea al enemigo de delante');
  await p.waitForTimeout(500);

  // 5) gancho hacia arriba contra un enemigo encima
  const hook = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lv = LL.G.run.level, pl = lv.player; pl.face = 1; pl.atk = null; pl.atkCD = 0;
    const e = LL.makeEnemy(lv, Math.round(pl.x + 4), Math.round(pl.y - 26), { type: 'flyer' }); e.hp = e.maxHp = 9; e.update = () => {}; lv.addEntity(e);
    const y0 = pl.y;
    LL.Input.keys.ArrowUp = true; LL.Input.keys.KeyX = true; LL.Input.pressedCodes.KeyX = true;
    await sleep(60); LL.Input.keys.KeyX = false; LL.Input.releasedCodes.KeyX = true; LL.Input.keys.ArrowUp = false;
    const kind = pl.atk && pl.atk.kind;
    let minY = pl.y; for (let i = 0; i < 12; i++) { await sleep(25); minY = Math.min(minY, pl.y); }
    const r = { kind, rise: y0 - minY, hp: e.hp, max: e.maxHp };
    e.dead = true; return r;
  });
  await p.screenshot({ path: outDir + '/moves_hook.png' });
  ok(hook.kind === 'hook', '↑ + ataque en el suelo = gancho');
  ok(hook.rise > 18, `el gancho la eleva (${Math.round(hook.rise)} px)`);
  ok(hook.hp < hook.max, 'el gancho golpea al enemigo de arriba');
  await p.waitForTimeout(150);
  // en el aire: ↑ + ataque es el tajo hacia arriba (el gancho solo sale desde el suelo)
  const air = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const pl = LL.G.run.level.player; pl.atk = null; pl.atkCD = 0;
    pl.y -= 30; pl.vy = -150; pl.onGround = false; pl.coyote = 0; await sleep(30);
    LL.Input.keys.ArrowUp = true; LL.Input.keys.KeyX = true; LL.Input.pressedCodes.KeyX = true;
    await sleep(50); LL.Input.keys.KeyX = false; LL.Input.keys.ArrowUp = false;
    return { onGround: pl.onGround, kind: pl.atk && pl.atk.kind };
  });
  ok(!air.onGround && air.kind === 'up', 'en el aire, ↑ + ataque es el tajo hacia arriba');

  // 6) energía: el escudo bloquea 3 golpes y se agota; la recarga sola es lenta y se pausa al gastar
  const en = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const lv = LL.G.run.level, pl = lv.player; LL.G.noDamage = false;
    pl.cells = pl.maxCells; pl.energy = 100; pl.shieldRule = 1; pl.shieldArmed = true; LL.G.save.abilities.shield = true;
    await sleep(80);
    const out = { on: pl.shieldOn, e: [] };
    for (let i = 0; i < 3; i++) { pl.inv = 0; pl.hurt({ x: pl.x + 20, w: 4 }); out.e.push(Math.round(pl.energy)); await sleep(30); }
    out.broken = !pl.shieldArmed; out.cells0 = pl.cells;
    pl.inv = 0; pl.hurt({ x: pl.x + 20, w: 4 }); out.cells1 = pl.cells;
    pl.energy = 0; pl.regenDelay = 0; pl.spend(0); await sleep(1500); out.afterPause = pl.energy;
    await sleep(2000); out.after = pl.energy;
    LL.G.noDamage = true; pl.inv = 0; pl.cells = pl.maxCells;
    return out;
  });
  ok(en.on && en.e[0] <= 70 && en.broken, `el escudo bloquea pero cada golpe gasta un tercio (${en.e.join(' → ')}) y al 3.º se rompe`);
  ok(en.cells1 === en.cells0 - 1, 'con el escudo roto el siguiente golpe quita una célula');
  ok(en.afterPause < 0.5 && en.after > 2 && en.after < 12, `tras gastar energía la recarga espera y luego sube despacio (${en.afterPause.toFixed(1)} → ${en.after.toFixed(1)})`);

  // 7) derrota: escena clara (caída, tarjeta con la causa y un consejo, E para volver)
  await p.evaluate(() => { const lv = LL.G.run.level, pl = lv.player; LL.G.noDamage = false; pl.inv = 0; pl.cells = 1;
    const e = LL.makeEnemy(lv, Math.round(pl.x + 30), Math.round(pl.y), { type: 'charger' }); lv.addEntity(e); pl.hurt(e); e.dead = true; });
  await p.waitForTimeout(700);
  const d1 = await p.evaluate(() => ({ top: LL.Scenes.top().constructor.name, hidden: LL.G.run.level.player.hidden, frozen: LL.G.run.level.frozen }));
  await p.screenshot({ path: outDir + '/defeat_fall.png' });
  await p.waitForTimeout(2300);
  const d2 = await p.evaluate(() => { const s = LL.Scenes.top(); return { phase: s.phase, cause: s.cause, tip: s.tip }; });
  await p.screenshot({ path: outDir + '/defeat_card.png' });
  await p.keyboard.press('KeyE');
  await p.waitForTimeout(1200);
  const d3 = await p.evaluate(() => { const pl = LL.G.run.level.player; return { top: LL.Scenes.top().constructor.name, cells: pl.cells, max: pl.maxCells, hidden: pl.hidden, frozen: LL.G.run.level.frozen }; });
  ok(d1.top === 'DefeatScene' && d1.hidden && d1.frozen, 'al perder la última célula empieza la escena de derrota (el mundo se detiene)');
  ok(d2.phase === 'card' && /Toro-Ohm/.test(d2.cause) && d2.tip.length > 10, `la tarjeta dice qué la venció (${d2.cause}) y da un consejo`);
  ok(d3.top === 'GameplayScene' && d3.cells === d3.max && !d3.hidden && !d3.frozen, 'con E vuelve al punto de control con todas las células');
  await p.evaluate(() => { LL.G.noDamage = true; });

  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'MOVIMIENTOS OK');
  process.exitCode = fails ? 1 : 0;
})();
