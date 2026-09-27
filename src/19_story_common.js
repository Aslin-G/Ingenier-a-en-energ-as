// =====================================================================
//  HISTORIA: utilidades comunes, escenarios de microred, eventos del mapa
// =====================================================================
const LEVELS = {};
const LEVEL_OF_REGION = { puerto: 'puerto', faro: 'faro' };

// Restaurar una isla: luces, música, NPCs, recompensas y desbloqueo
function* restoreRegion(lv, key, text) {
  setFlag('restored_' + key);
  (lv.def.zones || []).forEach(z => setFlag(z.flag));
  lv.updatePower();
  AudioSys.sfx('restore'); FX.flash(PAL.sun, 0.5);
  for (let i = 0; i < 40; i++) Particles.spawn({ x: lv.cam.x + rand(0, W), y: lv.cam.y + rand(0, H), vx: rand(-20, 20), vy: rand(-50, -10), life: rand(1, 2), type: 'star', color: choice([PAL.sun, PAL.pink, PAL.teal, PAL.lime]) });
  lv.lumi.mood = 'happy'; lv.lumi.moodT = 5; lv.player.celebrateT = 1.5;
  const q = 'm_' + key; if (QUESTS[q]) setFlag('q_' + key), setQuest(q, 'done');
  unlockCodex('i_' + key);
  yield C.title('¡' + REGIONS[regionIdx(key)].name.toUpperCase() + ' RESTAURADA!', text || 'La isla vuelve a brillar.', 3.2, PAL.sun);
  const cos = Object.keys(COSMETICS).find(k => COSMETICS[k].region === key);
  if (cos) Toast.show('Nuevo cosmético en el Taller: ' + COSMETICS[cos].name, PAL.orange, 3);
  const next = REGIONS[regionIdx(key) + 1];
  if (next) Toast.show('Nueva ruta: ' + next.name + ' (' + next.transport + ')', PAL.teal, 3);
  Save.write();
}
function* teach(id) { if (!G.save.codex[id] || !G.save.codex[id].taught) { yield C.concept(id); G.save.codex[id].taught = true; } }
function* grant(id) { if (!hasAbility(id)) yield C.ability(id); }
function walkTo(npc, x, speed) { return C.until(() => { if (npc.walkTarget == null && Math.abs(npc.x - x) > 2) npc.walkTo(x, speed); return Math.abs(npc.x - x) <= 2; }); }
function camTo(lv, x, y) { return C.now(() => { lv.cam.tx = x; lv.cam.ty = y; }); }
function camFree(lv) { return C.now(() => { lv.cam.tx = null; lv.cam.ty = null; }); }
function tx(t) { return t * TILE; }
// Resultado de puzzle: si falla/sale, el jugador puede volver a intentarlo en el terminal
function* runPuzzle(cfg, onOk) {
  const r = yield puzzle(cfg);
  if (r && r.success) { if (onOk) yield* onOk(r); return true; }
  yield C.say('pix', choice(['Podemos volver cuando quieras. El terminal no se va a ir a ningún lado.', 'Pausa estratégica. Muy profesional.', 'Respira. Depurar también es pensar.']));
  return false;
}

// ---------- Escenarios de la microred ----------
const WX = (s) => s.split('').map(c => ({ s: 'sol', n: 'nube', l: 'lluvia' }[c]));
const MG_SCENARIOS = {
  tipico: { name: 'Día típico', weather: WX('ssssssssssnnssssssssssss'), wind: [7, 7, 6, 6, 5, 5, 4, 4, 3, 3, 4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 8, 8, 7, 7], demand: [3, 3, 3, 3, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 8, 6, 4, 3], solar: 14, windCap: 6, hydro: 1.5, soc0: 50, h20: 8, batCap: 40 },
  nublado: { name: 'Nublado con calma', weather: WX('nnnnnnnnnnnnllllnnnnnnnn'), wind: [6, 6, 6, 5, 5, 5, 4, 4, 4, 5, 6, 7, 8, 9, 9, 10, 10, 9, 9, 8, 8, 7, 7, 6], demand: [3, 3, 3, 3, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 8, 6, 4, 3], solar: 14, windCap: 7, hydro: 2, soc0: 70, h20: 25, reservoir: 12, batCap: 40, events: { 8: 'calma', 9: 'calma', 10: 'calma' } },
  festival: { name: 'Festival nocturno', weather: WX('ssssssssssssssssssssssss'), wind: [6, 6, 5, 5, 4, 4, 3, 3, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 7, 7, 6, 6], demand: [3, 3, 3, 3, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 8, 6, 4, 3], solar: 14, windCap: 6, hydro: 1.5, soc0: 50, h20: 12, batCap: 40, events: { 19: 'festival', 20: 'festival', 21: 'festival', 22: 'festival' } },
  sinsol: { name: 'Día sin sol', weather: WX('llllllllllllllllllllllll'), wind: [8, 8, 8, 9, 9, 9, 8, 8, 7, 7, 6, 6, 6, 6, 7, 7, 8, 8, 8, 7, 7, 7, 8, 8], demand: [3, 3, 3, 3, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 8, 6, 4, 3], solar: 14, windCap: 6, hydro: 1.5, soc0: 55, h20: 25, batCap: 40 },
  tormenta: { name: 'Perfect Zero: tormenta perfecta', weather: WX('nnnnnnssssnnllllssssnnnn'), wind: [6, 6, 5, 4, 3, 2, 2, 2, 3, 4, 6, 8, 9, 9, 8, 6, 4, 3, 3, 3, 4, 5, 6, 6], demand: [3, 3, 3, 3, 3, 4, 5, 6, 6, 5, 5, 5, 5, 5, 5, 6, 7, 8, 9, 9, 8, 6, 4, 3], solar: 14, windCap: 6, hydro: 1.5, soc0: 50, h20: 20, batCap: 40, events: { 5: 'calma', 6: 'calma', 7: 'calma', 12: 'sequia', 13: 'sequia', 14: 'bateria_fuera', 20: 'festival', 21: 'festival' } }
};
const MG_SCENARIOS_LIST = () => Object.values(MG_SCENARIOS);

// ---------- Eventos que ocurren al volver al mapa ----------
const MAP_EVENTS = [
  {
    flag: 'mapIntro', cond: () => flag('restored_puerto') && !flag('restored_valle'), run: function* () {
      yield* talk([
        ['pix', '¡Mira el mapa, Lía! El Puerto brilla otra vez.', 'feliz'],
        ['lia', 'Una isla de once. Y Vega sigue sin aparecer.', 'pensando'],
        ['teo', 'Primero medimos. Después entramos en pánico. El Valle es lo más cercano.', 'n'],
        ['pix', 'Elige una isla con ← → y pulsa ENTER. Las islas grises todavía están a oscuras.', 'n']
      ]);
    }
  },
  {
    flag: 'mapFear', cond: () => flag('restored_prisma') && !flag('restored_faro'), run: function* () {
      yield C.say('narrador', 'Una a una, las islas del archipiélago parpadean... y se apagan a la vez.');
      FX.shake(3, 0.6); AudioSys.sfx('powerdown');
      yield C.wait(1);
      yield* talk([
        ['pix', 'No... las están apagando TODAS. Al mismo tiempo.', 'sorpresa'],
        ['teo', 'No están rotas. Están... congeladas. Como si alguien hubiera pulsado "pausa" al mundo.', 'pensando'],
        ['lia', 'Perfect Zero. Se acabó esperar. Vamos al Faro.', 'decidida']
      ]);
    }
  }
];

// ---------- Constructor de mapas (evita errores en ASCII largos) ----------
class MapB {
  constructor(w, h) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => Array(w).fill('.')); this.ents = []; this.spawns = {}; }
  fill(x0, y0, x1, y1, ch) { for (let y = Math.max(0, y0); y <= Math.min(this.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(this.w - 1, x1); x++) this.g[y][x] = ch; return this; }
  ground(x0, x1, top, ch = '#') { return this.fill(x0, top, x1, this.h - 1, ch); }
  plat(x0, x1, y) { return this.fill(x0, y, x1, y, '='); }
  put(x, y, ch) { if (y >= 0 && y < this.h && x >= 0 && x < this.w) this.g[y][x] = ch; return this; }
  clear(x0, y0, x1, y1) { return this.fill(x0, y0, x1, y1, '.'); }
  vline(x, y0, y1, ch) { return this.fill(x, y0, x, y1, ch); }
  e(t, x, y, cfg) { this.ents.push({ t, x, y, cfg: cfg || {} }); return this; }
  start(x, y) { this.spawn = [x, y]; return this; }
  sp(name, x, y) { this.spawns[name] = [x, y]; return this; }
  seeds(x0, x1, y, step = 2) { for (let x = x0; x <= x1; x += step) this.e('o', x, y); return this; }
  build() { return { map: this.g.map(r => r.join('')), ents: this.ents, spawnAt: this.spawn, spawns: this.spawns }; }
}
function level(key, def, mb) {
  const b = mb.build();
  LEVELS[key] = Object.assign({ key, map: b.map, ents: b.ents, spawnAt: b.spawnAt, spawns: Object.assign({}, b.spawns, def.spawns || {}) }, def);
  return LEVELS[key];
}
