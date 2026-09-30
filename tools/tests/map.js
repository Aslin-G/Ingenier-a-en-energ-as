// Mapa del archipiélago: las 11 islas tienen ilustración (restaurada, apagada y por
// descubrir), el mapa se dibuja en los distintos estados de progreso, el viaje lleva
// a la isla elegida y index.html es el mismo juego que lumina_loop.html.
// Uso: node tools/tests/map.js
const fs = require('fs');
const path = require('path');
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  let fails = 0;
  const root = path.join(__dirname, '..', '..');
  const same = fs.readFileSync(path.join(root, 'index.html')).equals(fs.readFileSync(path.join(root, 'lumina_loop.html')));
  console.log('index.html = lumina_loop.html:', same ? 'OK' : 'DISTINTOS (ejecuta node tools/build.js)');
  if (!same) fails++;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + gameFile);
  await p.waitForTimeout(700);
  for (const n of [1, 5, 11]) {
    const r = await p.evaluate(async (n) => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      LL.G.save.started = true; LL.setFlag('prologueDone'); LL.setFlag('mapIntro'); LL.setFlag('mapFear'); LL.G.save.bossGate = true;
      LL.REGIONS.forEach((r, i) => { LL.setFlag('restored_' + r.key, i < n); LL.setFlag('boss_' + r.key, i < n); });
      LL.Game.toMap(); await sleep(900);
      const art = LL.MapArt.isl, keys = Object.keys(art);
      const ok = keys.length === 11 && keys.every(k => art[k].on && art[k].off && art[k].fog && art[k].on.width === 160);
      return 'islas restauradas ' + n + ': ilustraciones ' + keys.length + '/11 ' + (ok ? 'OK' : 'FALTAN') + ' · desbloqueadas ' + LL.REGIONS.filter(r => LL.unlocked(r.key)).length;
    }, n);
    console.log(r);
    if (!r.includes('11/11 OK')) fails++;
    await p.screenshot({ path: outDir + '/map_' + n + '.png' });
  }
  // viajar a la siguiente isla desde el mapa
  const v = await p.evaluate(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    LL.REGIONS.forEach((r, i) => { LL.setFlag('restored_' + r.key, i < 3); LL.setFlag('boss_' + r.key, i < 3); });
    LL.Game.toMap('aeris'); await sleep(900);
    const m = LL.Scenes.top(); m.sel = 3; m.go();
    const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(LL.G.run.level && LL.G.run.level.key === 'aeris' && LL.Scenes.top().constructor.name === 'GameplayScene')) await sleep(60);
    return LL.G.run.level ? LL.G.run.level.key : '-';
  });
  console.log('viaje en barca/planeador → ' + v, v === 'aeris' ? 'OK' : 'FALLO');
  if (v !== 'aeris') fails++;
  console.log('ERRORS:', errs.length ? errs.slice(0, 10).join('\n') : 'none');
  if (errs.length) fails++;
  await b.close();
  console.log(fails ? 'FALLOS: ' + fails : 'MAPA OK');
  process.exit(fails ? 1 : 0);
})();
