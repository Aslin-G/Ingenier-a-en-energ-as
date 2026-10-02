// =====================================================================
//  ARRANQUE Y BUCLE PRINCIPAL (paso fijo de 1/60 s + dibujo por frame)
// =====================================================================
// Navegación con teclado por escena: los menús la activan, el juego no
[TitleScene, PauseScene, SettingsScene, RemapScene, CodexScene, TeacherScene, TallerScene, ConfirmScene, QuestLogScene, SparkEditorScene, ShieldRuleScene, CodeLabScene, PuzzleBase].forEach(K => K.prototype.nav = true);
// los avisos (MISIÓN, ATLAS, XP...) se muestran al volver al juego, no encima de puzzles o menús
[PuzzleBase, CodeLabScene, CodexScene, SettingsScene, RemapScene, QuestLogScene, MasteryScene, LabScene, TallerScene, ControlsScene, BlueprintScene, ConceptCardScene, AbilityCardScene, CardsScene, ReviewScene, TraceScene, ForgeScene, ForgeTrialScene, LockHelpScene, SparkEditorScene, ShieldRuleScene, PowersScene, PowerCardScene, SimLabScene, DefeatScene].forEach(K => K.prototype.hideToasts = true);
[GameplayScene, MapScene, ChispaScene, AbilityCardScene, ConceptCardScene, MasteryScene, ControlsScene, BlueprintScene].forEach(K => K.prototype.nav = false);

const STEP = 1 / 60;
let lastT = performance.now(), acc = 0;
function frame(now) {
  let dt = (now - lastT) / 1000; lastT = now;
  if (dt > 0.25) dt = 0.25;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 5) {
    Input.pollGamepad();
    const top = Scenes.top();
    if (top && top.nav !== undefined) UI.nav = top.nav;
    Interp.save();
    Game.update(STEP);
    Input.endStep();
    acc -= STEP; steps++;
  }
  if (steps >= 5) acc = 0;
  // fracción del siguiente paso: el dibujo interpola posiciones (movimiento fluido a 120/144 Hz)
  Interp.alpha = clamp(acc / STEP, 0, 1);
  Game.draw();
  requestAnimationFrame(frame);
}

function boot() {
  Save.loadSettingsOnly();
  HD.init();
  Font.build(); Light.init();
  buildAllSprites();
  resize();
  // acceso directo para pruebas automáticas: #level=clave (en la página publicada no salta el modo docente)
  const m = DEV && location.hash.match(/level=(\w+)/);
  if (m && LEVELS[m[1]]) {
    G.save.started = true; setFlag('prologueDone');
    grantAbilitiesUpTo(LEVELS[m[1]].region || 'puerto');
    Scenes.push(new GameplayScene(m[1]));
  } else Scenes.push(new TitleScene());
  requestAnimationFrame(frame);
}

// Interfaz mínima para las pruebas automáticas (solo con un navegador automatizado:
// en la página publicada no deja saltarse la contraseña del modo docente)
const DEV = !!navigator.webdriver;
if (DEV) window.LL = {
  autoria: AUTORIA, Registro, sha256Hex, claveDocenteOk, DOCENTE_CLAVE, TeacherLockScene, makePlayer, cleanNameInput, nameCase, HERO, setHero, G, Game, Scenes, HD, LEVELS, textW, TextAudit, Spr, DefeatScene, MINI, MiniBoss, placeMiniBoss, TRAIN_MOVES, trainList, TrainDummy, SOUVENIRS, COSMETICS, POWERS, hasPower, grantPower, syncPowers, PowersScene, PowerCardScene, LockHelpScene, SimScene, SIMS, SIM_SOLAR, VariableLabScene, SimLabScene, SIM_ORDER, simDone, simReward, placeSims, FORGE, forged, ForgeScene, ForgeTrialScene, pulseCost, healCost, Cards, cardQuestion, CardsScene, ReviewScene, CARD_BANK, CARD_META, dailyChallenge, dailyCode, launchDaily, makeLockQuestion, LOCK_GEN, CodeLock, TraceScene, buildLevel: (k, sp) => new Level(k, sp), Save, Input, UI, Cut, flag, setFlag, CODEX, QUESTS, CHALLENGES, REGIONS, makePuzzleScene, Particles, AudioSys, BOSSES, makeEnemy, unlocked, MapArt,
  cfg: { CFG_FEST_BOOT, CFG_PUERTO_ROUTE, CFG_PUERTO_CHAIN, CFG_PUERTO_CARRERA, CFG_VALLE_RUTA, CFG_VALLE_SACOS, CFG_VALLE_MOLINO, CFG_SOL_FLOW, CFG_SOL_FLORES, CFG_SOL_SENSOR, CFG_SOL_MATRIZ, CFG_SOL_NUBE, CFG_AERIS_MOLINO, CFG_AERIS_VIENTO, CFG_AERIS_BUCLE, CFG_HYD_FORJA, CFG_HYD_RIO, CFG_HYD_DUP, cfgBioSorter, CFG_BIO_LISTA, CFG_BIO_MERCADO, CFG_GEA_FSM, CFG_GEA_AISLADA, CFG_GEA_CRISTAL, CFG_H2_PIPE, CFG_H2_BARCO, CFG_BAT_SORT, CFG_BAT_SEARCH, CFG_BAT_BETA, CFG_BAT_BUG, CFG_PRISMA_MG, CFG_PRISMA_FEST, CFG_PRISMA_SINSOL, pzPhaseCfg },
  A,
  S: { RegisterScene, CreditsScene, TitleScene, PauseScene, SettingsScene, RemapScene, CodexScene, TeacherScene, TallerScene, QuestLogScene, MasteryScene, MapScene, LabScene, ControlsScene, BlueprintScene, ConfirmScene, SparkEditorScene, ShieldRuleScene, Shot, RegionBoss, LumenWave, BossFX }
};
try { boot(); } catch (e) {
  console.error(e);
  ctx.fillStyle = '#10162B'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FF6B6B'; ctx.font = '10px monospace'; ctx.fillText('Error al iniciar: ' + e.message, 10, 20);
}
