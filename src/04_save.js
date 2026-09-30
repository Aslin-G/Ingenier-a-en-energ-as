// =====================================================================
//  ESTADO GLOBAL, GUARDADO (localStorage), MAESTRÍA, XP, LOGROS
// =====================================================================
const SAVE_KEY = 'luminaLoopSave';
const SAVE_VERSION = 1;

const MASTERY_KEYS = ['sequence', 'variables', 'conditions', 'loops', 'functions', 'arrays', 'states', 'debugging', 'search', 'sorting', 'optimization', 'solar', 'wind', 'hydro', 'biomass', 'geothermal', 'hydrogen', 'storage', 'microgrid'];
const MASTERY_LABELS = {
  sequence: 'SECUENCIAS', variables: 'VARIABLES', conditions: 'CONDICIONES', loops: 'BUCLES', functions: 'FUNCIONES',
  arrays: 'LISTAS', states: 'ESTADOS', debugging: 'DEPURACIÓN', search: 'BÚSQUEDA', sorting: 'ORDENAMIENTO',
  optimization: 'OPTIMIZACIÓN', solar: 'SOLAR', wind: 'EÓLICA', hydro: 'HIDRO', biomass: 'BIOMASA',
  geothermal: 'GEOTERMIA', hydrogen: 'HIDRÓGENO', storage: 'ALMACENAMIENTO', microgrid: 'MICRORED'
};
const PROG_KEYS = MASTERY_KEYS.slice(0, 11), ENERGY_KEYS = MASTERY_KEYS.slice(11);

const DEFAULT_SETTINGS = () => ({
  musicVol: 0.55, sfxVol: 0.8, textSpeed: 1, highContrast: false, reduceFlash: false, reduceShake: false,
  touch: 'auto', noTimer: false, captions: true, pixelPerfect: false, bindings: null, confidence: true, assist: false, hd: true
});

function newSave() {
  const mastery = {}; MASTERY_KEYS.forEach(k => mastery[k] = 0);
  return {
    version: SAVE_VERSION, started: false, scene: 'prologue', checkpoint: null,
    xp: 0, level: 1, abilities: {}, mastery, quests: {}, codex: {}, storyFlags: {},
    collectibles: { chispas: {}, seeds: 0, seedIds: {}, stickers: {} },
    settings: DEFAULT_SETTINGS(),
    regions: {}, cosmetics: { owned: {}, worn: {} }, achievements: {},
    stats: { puzzles: 0, firstTry: 0, hints: 0, fails: 0, runs: 0, lensFinds: 0, playTime: 0, infiniteLoops: 0, confHighWrong: 0 },
    attempts: {}, teacherUnlocked: false, labUnlocked: false, lastRegion: 'puerto',
    // combate: fragmentos de célula (3 = +1 célula), intentos por jefe, y si la isla siguiente
    // exige vencer al jefe (las partidas anteriores a los jefes no quedan bloqueadas)
    cellShards: 0, bossTries: {}, bossGate: true,
    // cerraduras de código resueltas y núcleos de forja ganados
    locks: {}, forgeCores: 0
  };
}

const G = {
  save: newSave(),
  // estado en ejecución (no se guarda)
  run: { region: null, level: null },
  debug: /[?&#]debug/.test(location.href)
};

const Save = {
  exists() { try { const s = localStorage.getItem(SAVE_KEY); return !!(s && JSON.parse(s).started); } catch (e) { return false; } },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      const base = newSave();
      if (data.bossGate === undefined) data.bossGate = false;
      // fusión defensiva para versiones antiguas
      for (const k in base) if (data[k] === undefined) data[k] = base[k];
      data.settings = Object.assign(DEFAULT_SETTINGS(), data.settings || {});
      data.mastery = Object.assign(base.mastery, data.mastery || {});
      data.stats = Object.assign(base.stats, data.stats || {});
      data.collectibles = Object.assign(base.collectibles, data.collectibles || {});
      G.save = data;
      if (data.settings.bindings) Input.bindings = mergeBindings(data.settings.bindings);
      return true;
    } catch (e) { return false; }
  },
  loadSettingsOnly() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.settings) G.save.settings = Object.assign(DEFAULT_SETTINGS(), data.settings);
      if (data.settings && data.settings.bindings) Input.bindings = mergeBindings(data.settings.bindings);
      if (data.teacherUnlocked) G.save.teacherUnlocked = true;
      if (data.labUnlocked) G.save.labUnlocked = true;
    } catch (e) { }
  },
  write() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); Save.flash = 1.2; return true; } catch (e) { return false; }
  },
  writeSettings() {
    // guarda los ajustes aunque aún no se haya iniciado partida
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw && G.save.started === false) {
        const data = JSON.parse(raw); data.settings = G.save.settings; localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      } else localStorage.setItem(SAVE_KEY, JSON.stringify(G.save));
    } catch (e) { }
  },
  resetAll() {
    const settings = G.save.settings;
    G.save = newSave(); G.save.settings = settings;
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
    Save.writeSettings();
  },
  flash: 0
};

// teclas guardadas + teclas nuevas por defecto; X y J pasaron de «usar» a «atacar»
function mergeBindings(saved) {
  const b = Object.assign(JSON.parse(JSON.stringify(DEFAULT_BINDINGS)), saved);
  if (!saved.attack) { b.attack = DEFAULT_BINDINGS.attack.slice(); b.interact = (b.interact || []).filter(c => !b.attack.includes(c)); if (!b.interact.length) b.interact = ['KeyE']; }
  return b;
}

// ---------- banderas de historia ----------
const flag = k => !!G.save.storyFlags[k];
const setFlag = (k, v = true) => { G.save.storyFlags[k] = v; };
const hasAbility = k => !!G.save.abilities[k];

// ---------- XP y nivel ----------
const RANKS = ['Aprendiz de chispas', 'Ayudante de taller', 'Técnica de campo', 'Depuradora', 'Diseñadora de sistemas', 'Arquitecta de microredes', 'Guardiana de Aurora'];
function addXP(n, reason) {
  G.save.xp += n;
  const lv = 1 + Math.floor(Math.sqrt(G.save.xp / 60));
  if (lv > G.save.level) {
    G.save.level = lv;
    Toast.show('★ NIVEL ' + lv + ': ' + RANKS[Math.min(RANKS.length - 1, lv - 1)], PAL.sun);
  }
  if (reason) Toast.show('+' + n + ' XP · ' + reason, PAL.lime, 1.8);
}
const rankName = () => RANKS[Math.min(RANKS.length - 1, G.save.level - 1)];

// ---------- maestría (0-100) ----------
function addMastery(keys, delta) {
  if (!Array.isArray(keys)) keys = [keys];
  for (const k of keys) {
    if (!(k in G.save.mastery)) continue;
    const m = G.save.mastery[k];
    // crecimiento con rendimientos decrecientes; las caídas son suaves
    const d = delta > 0 ? delta * (1 - m / 130) : delta * 0.5;
    G.save.mastery[k] = clamp(Math.round((m + d) * 10) / 10, 0, 100);
  }
}

// ---------- logros ----------
const ACHIEVEMENTS = {
  first_algo: { name: 'PRIMER ALGORITMO', desc: 'Ejecutaste tu primera secuencia correcta.' },
  no_infinite: { name: 'SIN BUCLES INFINITOS', desc: 'Reparaste el molino de Aeris sin crear un bucle infinito.' },
  wind_master: { name: 'MAESTRO DEL VIENTO', desc: 'Dominaste todos los retos de Aeris.' },
  debugger: { name: 'DEBUGGER DE AURORA', desc: 'Descubriste 12 secretos con la Lente Debug.' },
  imperfect: { name: 'EQUILIBRIO PERFECTAMENTE IMPERFECTO', desc: 'Reescribiste el objetivo de Perfect Zero.' },
  no_hints: { name: 'SIN RED DE SEGURIDAD', desc: 'Resolviste un reto principal sin pistas al primer intento.' },
  collector: { name: 'COLECCIONISTA DE CHISPAS', desc: 'Encontraste todas las Chispas de Aurora.' },
  beta_friend: { name: 'AMIGA DE BETA', desc: 'Ayudaste a BETA sin dejar al barrio a oscuras.' },
  menta: { name: 'LA ABUELA APRUEBA', desc: 'Clasificaste los residuos sin un solo error.' },
  reuse: { name: 'NO TE REPITAS', desc: 'Reutilizaste una función en tres mecanismos.' },
  safe_states: { name: 'TRANSICIONES SEGURAS', desc: 'Tu máquina de estados nunca permitió FAULT → RUNNING.' },
  vector: { name: 'VECTOR, NO FUENTE', desc: 'Entendiste que el hidrógeno transporta energía.' },
  sorter: { name: 'ORDEN EN LA CIUDAD', desc: 'Ordenaste las baterías con pocas comparaciones.' },
  microgrid: { name: 'RED RESILIENTE', desc: 'Tu microred sobrevivió a todos los eventos.' },
  curious: { name: 'CURIOSIDAD INFINITA', desc: 'Leíste 25 entradas del Atlas Aurora.' },
  humble: { name: 'HUMILDAD ALGORÍTMICA', desc: 'Admitiste duda y aun así acertaste.' },
  lab: { name: 'CIENTÍFICA DEL LAB', desc: 'Comparaste tres experimentos en Aurora Lab.' },
  sidequests: { name: 'VECINA EJEMPLAR', desc: 'Completaste 10 misiones secundarias.' },
  parry: { name: 'REFLEJOS DE LUZ', desc: 'Hiciste una parada perfecta con el Lumisable.' },
  bosses: { name: 'GUARDIANA DEL ARCHIPIÉLAGO', desc: 'Depuraste a los 10 jefes regionales.' },
  reader: { name: 'LECTORA DE CÓDIGO', desc: 'Predijiste 5 cerraduras de código al primer intento.' },
  locksmith: { name: 'CERRAJERA DE AURORA', desc: 'Abriste 10 cerraduras de código.' }
};
function achieve(id) {
  if (G.save.achievements[id] || !ACHIEVEMENTS[id]) return;
  G.save.achievements[id] = Date.now();
  G.save.collectibles.stickers[id] = true;
  Toast.show('★ LOGRO: ' + ACHIEVEMENTS[id].name, PAL.pink, 3);
  AudioSys.sfx('chispa');
  addXP(25);
}

// ---------- habilidades ----------
const ABILITIES = {
  lens: { name: 'DEBUG LENS', concept: 'Depuración', desc: 'Revela variables, estados, flujos y secretos ocultos.', key: 'lens', color: PAL.teal },
  spark: { name: 'STEP SPARK', concept: 'Secuencia', desc: 'Programa un eco de chispa con una secuencia de pasos.', key: 'ability', color: PAL.sun },
  shield: { name: 'IF SHIELD', concept: 'Condicionales', desc: 'Escudo que solo se activa SI se cumple su condición.', key: 'ability', color: PAL.orange },
  glide: { name: 'LOOP GLIDE', concept: 'Bucles', desc: 'Planea y encadena corrientes de aire: MIENTRAS haya viento.', key: 'ability', color: PAL.aqua },
  portal: { name: 'FUNCTION PORTAL', concept: 'Funciones', desc: 'Invoca una función ya definida en otro mecanismo.', key: 'ability', color: PAL.violet },
  pack: { name: 'ARRAY PACK', concept: 'Listas', desc: 'Guarda objetos en orden: [0], [1], [2]...', key: 'ability', color: PAL.lime },
  shift: { name: 'STATE SHIFT', concept: 'Estados', desc: 'Cambia el estado de una máquina solo por transiciones válidas.', key: 'ability', color: PAL.coral },
  beam: { name: 'PIPELINE BEAM', concept: 'Pipelines', desc: 'Encadena módulos en el orden correcto.', key: 'ability', color: PAL.sky },
  dash: { name: 'PRIORITY DASH', concept: 'Prioridades', desc: 'Impulso hacia el objetivo de mayor prioridad.', key: 'ability', color: PAL.pink },
  link: { name: 'AURORA LINK', concept: 'Integración', desc: 'Une todas las habilidades en un sistema adaptable.', key: 'ability', color: PAL.white },
  predict: { name: 'PREDICT (PÍX)', concept: 'Probabilidad', desc: 'PÍX estima probabilidades. Predicción ≠ certeza.', key: 'lens', color: PAL.magenta }
};
function giveAbility(id) {
  if (G.save.abilities[id]) return;
  G.save.abilities[id] = true;
  if (ABILITY_ORDER.includes(id)) G.save.currentAbility = id;
}
const ABILITY_ORDER = ['spark', 'shield', 'glide', 'portal', 'pack', 'shift', 'beam', 'dash', 'link'];

// ---------- misiones ----------
function questState(id) { return G.save.quests[id] || 'none'; }
function setQuest(id, st) {
  const prev = G.save.quests[id];
  G.save.quests[id] = st;
  const q = QUESTS[id];
  if (!q) return;
  if (st === 'active' && prev !== 'active') Toast.show('▶ MISIÓN: ' + q.title, q.main ? PAL.sun : PAL.teal, 2.5);
  if (st === 'done') setFlag('qdone_' + id);
  if (st === 'done' && prev !== 'done') {
    Toast.show('✓ COMPLETADA: ' + q.title, PAL.lime, 2.5);
    addXP(q.main ? 60 : 35);
    const sideDone = Object.keys(G.save.quests).filter(k => QUESTS[k] && !QUESTS[k].main && G.save.quests[k] === 'done').length;
    if (sideDone >= 10) achieve('sidequests');
  }
}
