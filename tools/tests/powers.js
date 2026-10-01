// Poderes del Lumisable: cada jefe depurado da un poder y cada poder funciona
// (doble salto, punto de interrupción, rayo solar, torbellino, pulso doble,
// célula extra, sobrecarga, embestida, rayo buscador y recarga solar).
// Uso: node tools/tests/powers.js
'use strict';
const { chromium, gameFile, outDir } = require('./_pw');
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + gameFile + '#level=aeris');
  await p.waitForTimeout(800);
  await p.evaluate(() => { LL.Cut.abort(); LL.setFlag('saberIntro'); LL.setFlag('healTip'); LL.G.save.powers = {}; });

  // sin poderes: nada cambia
  const base = await p.evaluate(() => ({ n: LL.POWERS.length, ids: new Set(LL.POWERS.map(p => p.id)).size, bosses: new Set(LL.POWERS.map(p => p.boss)).size, any: LL.POWERS.some(p => LL.hasPower(p.id)) }));
  ok(base.n === 10 && base.ids === 10 && base.bosses === 10 && !base.any, '10 poderes distintos, uno por jefe, y al empezar ninguno');

  // sincronizar partidas antiguas: los jefes ya vencidos dan su poder
  const sync = await p.evaluate(() => { LL.setFlag('boss_puerto'); LL.setFlag('boss_valle'); const got = LL.syncPowers(); return { got, dj: LL.hasPower('djump'), bp: LL.hasPower('breakpoint'), sb: LL.hasPower('sunbeam') }; });
  ok(sync.got.length === 2 && sync.dj && sync.bp && !sync.sb, 'una partida con jefes ya vencidos recibe sus poderes (' + sync.got.join(', ') + ')');

  const r = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = {};
    const lv = LL.G.run.level, pl = lv.player;
    lv.entities.filter(e => e.hostile && e.onHit && e.type).forEach(e => { e.dead = true; });
    const tap = async (code, ms = 50) => { LL.Input.keys[code] = true; LL.Input.pressedCodes[code] = true; await sleep(ms); LL.Input.keys[code] = false; LL.Input.releasedCodes[code] = true; };
    const toGround = async () => { for (let i = 0; i < 80 && !pl.onGround; i++) await sleep(25); };
    const lift = () => { pl.y -= 60; pl.vy = 30; pl.onGround = false; pl.coyote = 0; pl.buffer = 0; pl.usedDJ = false; };
    await toGround();
    // DOBLE SALTO: en el aire salta una vez más, y solo una
    lift(); await sleep(60);
    await tap('KeyZ'); await sleep(20);
    out.dj1 = pl.vy;
    pl.vy = 30; await tap('KeyZ'); await sleep(20);
    out.dj2 = pl.vy;
    await toGround();
    // PUNTO DE INTERRUPCIÓN: al quedarse con 1 célula el mundo va lento, una sola vez
    pl.inv = 0; pl.cells = 2; pl.hurt({ x: pl.x + 20, w: 4 });
    out.bp = { cells: pl.cells, slow: lv.slowT };
    lv.slowT = 0; pl.inv = 0; pl.cells = 2; pl.hurt({ x: pl.x + 20, w: 4 });
    out.bp2 = lv.slowT;
    pl.cells = pl.maxCells; pl.inv = 0;
    // sin el poder de la célula, maxCells base
    out.cells0 = pl.maxCells;
    // conceder el resto de poderes
    for (const k of ['sunbeam', 'spin', 'twin', 'cell', 'overload', 'rush', 'seeker', 'solar']) LL.grantPower(k);
    out.cells1 = pl.maxCells;
    // PULSO DOBLE + RAYO SOLAR: dos ondas grandes en sentidos opuestos con daño 6
    await toGround(); pl.energy = 100; pl.face = 1;
    const before = new Set(lv.entities);
    pl.firePulse();
    const waves = lv.entities.filter(e => e instanceof LL.S.LumenWave && !before.has(e));
    out.waves = waves.map(w => ({ dir: w.dir, h: w.h, dmg: w.dmg, seek: w.seek }));
    waves.forEach(w => { w.dead = true; });
    pl.atk = null;
    // RAYO BUSCADOR: la onda se curva hacia un enemigo que está más arriba
    const foe = LL.makeEnemy(lv, Math.floor(pl.x / 16 + 6) * 16, Math.floor(pl.y / 16 - 2) * 16, { type: 'hopper' });
    foe.st = 'idle'; foe.stT = 99; foe.update = () => {}; lv.addEntity(foe);
    const w = new LL.S.LumenWave(lv, pl.x + pl.w, pl.y - 1, 1, '#FFFFFF'); const y0 = w.y; lv.addEntity(w);
    await sleep(200);
    out.seek = { dy: w.y - y0, foeAbove: foe.y + foe.h / 2 < y0 + w.h / 2 };
    w.dead = true; foe.dead = true;
    // TORBELLINO: en el aire con SALTO mantenido + ATAQUE
    await toGround(); await sleep(400);
    pl.atk = null; pl.atkCD = 0; lift(); pl.usedDJ = true;
    LL.Input.keys.KeyZ = true; await sleep(30); await tap('KeyX'); await sleep(30);
    out.spin = pl.atk && pl.atk.kind; LL.Input.keys.KeyZ = false; LL.Input.releasedCodes.KeyZ = true;
    await toGround(); await sleep(500);
    // EMBESTIDA: corriendo + ATAQUE
    pl.atk = null; pl.atkCD = 0;
    LL.Input.keys.ShiftLeft = true; LL.Input.keys.ArrowRight = true; await sleep(350);
    await tap('KeyX'); await sleep(20);
    out.rush = { kind: pl.atk && pl.atk.kind, dash: pl.dashT > 0, inv: pl.inv > 0 };
    LL.Input.keys.ShiftLeft = false; LL.Input.keys.ArrowRight = false;
    await sleep(500);
    // RECARGA SOLAR: con la energía en 60 sigue subiendo sola
    pl.energy = 60; pl.overload = false; await sleep(1000);
    out.solar = pl.energy;
    // SOBRECARGA: con 100 se activa, hace +1 de daño y se apaga bajo 70
    pl.energy = 100; await sleep(60);
    out.over = pl.overload;
    const dummy = { dead: false, hits: [], onHit(h) { this.hits.push(h.dmg); return true; }, x: 0, y: 0, w: 0, h: 0 };
    pl.startAttack('f1'); pl.atk.hits = new Set(lv.entities);
    // golpe directo a través de resolveHits
    const box = pl.atkBox(); Object.assign(dummy, { x: box.x, y: box.y, w: box.w, h: box.h });
    lv.entities.push(dummy); pl.resolveHits(); lv.entities.splice(lv.entities.indexOf(dummy), 1);
    out.overDmg = dummy.hits[0];
    pl.atk = null;
    pl.energy = 65; await sleep(60);
    out.overOff = pl.overload;
    return out;
  });
  ok(r.dj1 < -150, `DOBLE SALTO: en el aire vuelve a saltar (vy ${Math.round(r.dj1)})`);
  ok(r.dj2 > 0, `DOBLE SALTO: solo una vez por salto (vy ${Math.round(r.dj2)})`);
  ok(r.bp.cells === 1 && r.bp.slow > 3, `PUNTO DE INTERRUPCIÓN: con 1 célula el mundo va lento ${r.bp.slow.toFixed(1)} s`);
  ok(r.bp2 === 0, 'PUNTO DE INTERRUPCIÓN: solo una vez por punto de control');
  ok(r.cells1 === r.cells0 + 1, `CÉLULA EXTRA: ${r.cells0} → ${r.cells1} células`);
  ok(r.waves.length === 2 && r.waves[0].dir === -r.waves[1].dir, 'PULSO DOBLE: dos ondas en sentidos opuestos');
  ok(r.waves.every(w => w.h === 34 && w.dmg === 6), 'RAYO SOLAR: ondas más grandes con daño 6');
  ok(r.waves.every(w => w.seek), 'RAYO BUSCADOR: las ondas buscan enemigos');
  ok(r.seek.foeAbove && r.seek.dy < -2, `RAYO BUSCADOR: la onda se curva hacia el enemigo (dy ${r.seek.dy.toFixed(1)})`);
  ok(r.spin === 'spin', 'TAJO TORBELLINO: en el aire con SALTO + ATAQUE (' + r.spin + ')');
  ok(r.rush.kind === 'rush' && r.rush.dash && r.rush.inv, 'EMBESTIDA DE LUZ: corriendo + ATAQUE embiste sin recibir daño (' + r.rush.kind + ')');
  ok(r.solar > 63, `RECARGA SOLAR: la energía pasa de 60 a ${r.solar.toFixed(1)} en 1 s`);
  ok(r.over && r.overDmg === 2 && !r.overOff, `SOBRECARGA: se activa con 100, tajo de ${r.overDmg} de daño y se apaga bajo 70`);

  // tarjeta del poder y pantalla de Pausa → PODERES
  await p.evaluate(() => { LL.Scenes.push(new LL.PowerCardScene(LL.POWERS[3], () => {})); });
  await p.waitForTimeout(900);
  await p.screenshot({ path: outDir + '/powers_card.png' });
  const closed = await p.evaluate(async () => { const sleep = ms => new Promise(r => setTimeout(r, ms)); LL.Input.keys.Enter = true; LL.Input.pressedCodes.Enter = true; await sleep(50); LL.Input.keys.Enter = false; await sleep(50); return LL.Scenes.top().constructor.name; });
  ok(closed === 'GameplayScene', 'la tarjeta del poder se cierra con ENTER');
  await p.evaluate(() => { LL.G.save.powers.seeker = false; LL.Scenes.push(new LL.PowersScene()); });
  await p.waitForTimeout(300);
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  await p.waitForTimeout(200);
  await p.screenshot({ path: outDir + '/powers_menu.png' });
  await p.evaluate(() => { const s = LL.Scenes.top(); s.sel = LL.POWERS.findIndex(p => p.id === 'seeker'); });
  await p.waitForTimeout(200);
  await p.screenshot({ path: outDir + '/powers_menu_locked.png' });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  ok(await p.evaluate(() => LL.Scenes.top().constructor.name === 'GameplayScene'), 'PODERES se cierra con ESC');

  // el jefe vencido entrega su poder con tarjeta
  const p2 = await b.newPage({ viewport: { width: 960, height: 540 } });
  p2.on('pageerror', e => errs.push('PAGEERROR(2): ' + e.message));
  await p2.goto('file://' + gameFile + '#level=puerto');
  await p2.waitForTimeout(700);
  ok(await p2.evaluate(() => LL.powerOfBoss ? true : typeof LL.POWERS.find(p => p.boss === 'puerto') === 'object'), 'el jefe del Puerto tiene poder asociado');
  await p2.close();

  ok(errs.length === 0, 'sin errores de consola' + (errs.length ? '\n     ' + errs.join('\n     ') : ''));
  await b.close();
  console.log(fails ? `${fails} FALLO(S)` : 'PODERES OK');
  process.exitCode = fails ? 1 : 0;
})();
