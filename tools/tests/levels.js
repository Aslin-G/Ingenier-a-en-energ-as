// Carga cada nivel directamente (#level=clave), camina un poco, abre la Lente y guarda una captura.
// Uso: node tools/tests/levels.js [clave1,clave2,...]
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  const file = gameFile, out = outDir + '/lv';
  const keys = (process.argv[2] || 'festival,puerto,valle,solaria,aeris,hydria,bioloop,gea,h2,bateria,prisma,faro,faro_top,festival_end').split(',');
  const b = await chromium.launch();
  for (const k of keys) {
    const p = await b.newPage({ viewport: { width: 960, height: 540 } });
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto('file://' + file + '#level=' + k);
    await p.waitForTimeout(900);
    // saltar diálogos iniciales y caminar un poco
    await p.evaluate(() => { LL.Cut.abort(); });
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(700); await p.keyboard.up('ArrowRight');
    await p.keyboard.press('KeyF'); await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}_${k}.png` });
    const info = await p.evaluate(() => { const lv = LL.G.run.level; return { w: lv.w, h: lv.h, ents: lv.entities.length, px: Math.round(lv.player.x / 16), py: Math.round(lv.player.y / 16) }; });
    console.log(k.padEnd(14), JSON.stringify(info), errs.length ? '\n   ' + errs.join('\n   ') : 'OK');
    await p.close();
  }
  await b.close();
})();
