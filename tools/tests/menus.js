// Abre todas las pantallas de menú (título, ajustes, docente, Atlas, misiones,
// dominio, controles, Blueprint, Aurora Lab, mapa, taller) y guarda capturas.
// Uso: node tools/tests/menus.js
const { chromium, gameFile, outDir } = require('./_pw');
(async () => {
  const file = gameFile, out = outDir + '/menus';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + file);
  await p.waitForTimeout(800);
  const shot = async n => { await p.waitForTimeout(450); await p.screenshot({ path: out + '_' + n + '.png' }); };
  await shot('title');
  const push = async (expr, n) => { await p.evaluate(expr); await shot(n); await p.evaluate(() => { while (LL.Scenes.stack.length > 1) LL.Scenes.pop(); }); };
  await push(() => LL.Scenes.push(new LL.S.SettingsScene()), 'settings');
  await push(() => LL.Scenes.push(new LL.S.RemapScene()), 'remap');
  await push(() => LL.Scenes.push(new LL.S.TeacherScene()), 'teacher');
  // simular progreso completo
  await p.evaluate(() => {
    LL.G.save.started = true; LL.setFlag('prologueDone');
    ['puerto','valle','solaria','aeris','hydria','bioloop','gea','h2','bateria'].forEach(k => LL.setFlag('restored_' + k));
    LL.G.save.labUnlocked = true;
    Object.keys(LL.CODEX).slice(0, 40).forEach(k => LL.G.save.codex[k] = { read: false, t: 1 });
    Object.keys(LL.QUESTS).slice(0, 14).forEach((k, i) => LL.G.save.quests[k] = i < 9 ? 'done' : 'active');
    for (const k in LL.G.save.mastery) LL.G.save.mastery[k] = 20 + Math.random() * 70;
  });
  await push(() => LL.Scenes.push(new LL.S.CodexScene()), 'codex');
  await push(() => { const s = new LL.S.CodexScene(Object.keys(LL.CODEX)[3]); LL.Scenes.push(s); }, 'codex_entry');
  await push(() => LL.Scenes.push(new LL.S.QuestLogScene()), 'quests');
  await push(() => LL.Scenes.push(new LL.S.MasteryScene()), 'mastery');
  await push(() => LL.Scenes.push(new LL.S.ControlsScene()), 'controls');
  await push(() => LL.Scenes.push(new LL.S.BlueprintScene()), 'blueprint');
  await push(() => LL.Scenes.push(new LL.S.LabScene()), 'lab');
  await push(() => LL.Scenes.push(new LL.S.MapScene('gea')), 'map');
  await push(() => LL.Scenes.push(new LL.S.TallerScene()), 'taller');
  const st = await p.evaluate(() => LL.Scenes.stack.map(s => s.constructor.name).join(','));
  console.log('stack', st);
  console.log('ERRORS:', errs.length ? errs.slice(0, 15).join('\n') : 'none');
  await b.close();
})();
