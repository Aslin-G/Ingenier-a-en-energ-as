// =====================================================================
//  REGIÓN 07: BAHÍA H2 (pipelines + hidrógeno)  ·  REGIÓN 08: CIUDAD BATERÍA (búsqueda/orden + almacenamiento)
// =====================================================================
const CFG_H2_PIPE = {
  kind: 'seq', main: true, title: 'El pipeline del hidrógeno', tags: ['PIPELINE', 'MODULARIDAD', 'HIDRÓGENO'], concepts: ['sequence', 'functions', 'hydrogen'], codex: 'pipeline', label: 'PIPELINE', music: 'h2',
  intro: 'El barco del Capitán funciona con H2. Diseña la cadena completa: de dónde sale, cómo se transforma y cuánta energía llega al final.',
  showEnergy: true,
  cards: [
    { id: 'agua', label: 'agua', icon: 'drop', color: PAL.sky, desc: 'Materia prima: H2O.' },
    { id: 'elec', label: 'electricidad renovable', icon: 'bolt', color: PAL.sun, desc: 'Del sol y el viento de otras islas.' },
    { id: 'eli', label: 'electrólisis', icon: 'h2', color: PAL.aqua, desc: 'Separa el agua en H2 y O2. Pierde ~30%.', loss: 0.7 },
    { id: 'h2', label: 'hidrógeno H2', icon: 'h2', color: PAL.teal, desc: 'Un gas que GUARDA energía.' },
    { id: 'tan', label: 'comprimir y almacenar', icon: 'battery', color: PAL.cream, desc: 'Tanques a presión. Pierde ~10%.', loss: 0.9 },
    { id: 'pil', label: 'pila de combustible', icon: 'bolt', color: PAL.orange, desc: 'H2 + O2 → electricidad + agua. Pierde ~45%.', loss: 0.55 },
    { id: 'bar', label: 'mover el barco', icon: 'wave', color: PAL.coral, desc: 'El uso final.' },
    { id: 'pozo', label: 'pozo de hidrógeno', icon: 'question', color: PAL.violet, desc: 'Según el Capitán, "el H2 sale del mar como el petróleo".' },
    { id: 'carb', label: 'electricidad de carbón', icon: 'fire', color: '#8C93B8', desc: 'Barata... y con humo.' }
  ],
  slots: 7, answer: ['agua', 'elec', 'eli', 'h2', 'tan', 'pil', 'bar'],
  why: (i, id) => ({
    pozo: 'No existen pozos de hidrógeno puro que podamos usar: hay que FABRICARLO. El hidrógeno no es una fuente primaria, es un VECTOR (transporta energía).',
    carb: 'Con electricidad de carbón el hidrógeno no sería "verde": arrastraría todas las emisiones del carbón.',
    elec: i === 0 ? 'La electricidad sola no basta: la electrólisis necesita agua como materia prima.' : 'Aquí ya no toca electricidad.',
    eli: 'La electrólisis necesita tener ya agua Y electricidad disponibles.',
    h2: 'El hidrógeno aún no existe: primero hay que producirlo.',
    tan: 'No se puede almacenar algo que aún no se ha producido.',
    pil: 'La pila convierte H2 almacenado en electricidad: va después del tanque.',
    bar: 'El barco es el final: el uso.',
    agua: 'El agua va al principio.'
  }[id]),
  visual: visualEnergyChain([CHAIN_ICONS.water, CHAIN_ICONS.bolt, CHAIN_ICONS.electro, CHAIN_ICONS.h2, CHAIN_ICONS.tank, CHAIN_ICONS.cell, CHAIN_ICONS.ship]),
  finalCheck: sc => null,
  hints: ['Pregunta clave: ¿de dónde sale el hidrógeno? ¿Hay minas? ¿Pozos?', 'Hay dos tarjetas trampa. Una es un mito; la otra no es "verde".', { text: 'Principio del pipeline:', apply: sc => { sc.slots[0] = 'agua'; sc.slots[1] = 'elec'; sc.pool = sc.pool.filter(p => p !== 'agua' && p !== 'elec'); } }],
  okMsg: '¡Pipeline completo! De cada 100 unidades de electricidad llegan ~35 al barco. El H2 guarda y transporta energía... con pérdidas.', xp: 60
};
const CFG_H2_BARCO = {
  kind: 'seq', title: 'Barco H2', tags: ['SECUENCIA', 'SEGURIDAD', 'HIDRÓGENO'], concepts: ['sequence', 'hydrogen'], codex: 'hidrogeno', label: 'REPOSTAJE',
  intro: 'Repostar hidrógeno exige un orden estricto. Un fallo y... mejor no pensarlo.',
  cards: [
    { id: 'ven', label: 'ventilar la zona', icon: 'wind', color: PAL.aqua }, { id: 'con', label: 'conectar manguera', icon: 'gear', color: PAL.cream },
    { id: 'fug', label: 'comprobar fugas', icon: 'eye', color: PAL.teal }, { id: 'abr', label: 'abrir válvula y llenar', icon: 'h2', color: PAL.sky },
    { id: 'cer', label: 'cerrar válvula', icon: 'lock', color: PAL.orange }, { id: 'des', label: 'desconectar manguera', icon: 'gear', color: PAL.cream },
    { id: 'fum', label: 'encender una vela para ver mejor', icon: 'fire', color: PAL.coral }
  ],
  slots: 6, answer: ['ven', 'con', 'fug', 'abr', 'cer', 'des'],
  why: (i, id) => ({ fum: '¡NUNCA llamas cerca del hidrógeno! Arde con una llama casi invisible.', abr: 'Abrir antes de comprobar fugas es jugársela.', fug: 'Para comprobar fugas, primero hay que conectar.', des: 'Desconectar con la válvula abierta liberaría gas.', cer: 'Cerrar va después de llenar.', con: 'Primero ventilar.', ven: 'Ventilar va primero.' }[id]),
  visual: visualEnergyChain([CHAIN_ICONS.water, CHAIN_ICONS.tank, CHAIN_ICONS.h2, CHAIN_ICONS.ship]),
  hints: ['La seguridad empieza antes de tocar la manguera.', 'Una tarjeta es peligrosísima.', { text: 'Primero ventilar.', apply: sc => { sc.slots[0] = 'ven'; sc.pool = sc.pool.filter(p => p !== 'ven'); } }],
  okMsg: '¡Repostaje seguro! El barco zarpa.'
};

(function () {
  const b = new MapB(150, 20);
  b.ground(0, 34, 16).ground(12, 16, 15);
  b.fill(35, 17, 44, 18, '~').ground(35, 44, 19).plat(37, 38, 14).plat(41, 42, 12);
  b.ground(45, 88, 16);
  b.fill(60, 15, 66, 15, '^');
  b.plat(59, 61, 12).plat(64, 66, 12);
  b.fill(89, 13, 100, 13, 'B');
  b.ground(101, 149, 16);
  b.fill(112, 0, 112, 15, 'E');
  b.fill(116, 10, 118, 10, '?');
  b.start(3, 15);
  b.seeds(12, 16, 14, 2).seeds(37, 42, 11, 2).seeds(59, 66, 11, 2).seeds(116, 118, 9, 1).seeds(125, 140, 15, 3);
  [6, 22, 32, 48, 70, 84, 104, 122, 136].forEach(x => b.e('L', x, 15));
  b.e('C', 46, 15).e('C', 68, 15).e('C', 102, 15);
  b.e('m', 26, 15, { id: 'electro', look: 'electrolyzer', on: () => flag('h2_pipe') });
  b.e('m', 52, 15, { look: 'tank', color: '#FFFFFF' }).e('m', 55, 15, { look: 'tank', color: PAL.orange, label: 'O2' });
  b.e('m', 40, 17, { id: 'barco', look: 'boat', oy: -4, on: () => flag('restored_h2') }); // el barco del Capitán flota en la dársena
  b.e('m', 142, 15, { look: 'house', color: '#E8F0FF', roof: '#FF9D42' });
  const node = (id, n, label) => ({
    id, look: 'node', label, lit: lv => (lv.beamSeq || []).includes(n) || flag('h2_beam'), enabled: () => false,
    lens: 'módulo ' + n + ' del pipeline: ' + label,
    onAbility: (lv, t, ab) => {
      if (ab !== 'beam' && ab !== 'link') { Bark.say('pix', 'Esto se conecta con PIPELINE BEAM (' + bindName('swap') + ' para cambiar).'); return; }
      if (flag('h2_beam')) return;
      lv.beamSeq = lv.beamSeq || [];
      if (n !== lv.beamSeq.length + 1) { lv.beamSeq = []; AudioSys.sfx('error'); FX.shake(2, 0.2); Bark.say('pix', 'Orden incorrecto: el pipeline se reinicia. ¿Qué módulo va primero?'); return; }
      lv.beamSeq.push(n); AudioSys.sfx('charge'); Particles.text(t.x + 8, t.y - 8, 'módulo ' + n + ' ✓', PAL.sky);
      const prev = lv.beamLast; lv.beamLast = { x: t.x + 8, y: t.y + 4 };
      if (prev) for (let k = 0; k < 20; k++) Particles.spawn({ x: lerp(prev.x, t.x + 8, k / 20), y: lerp(prev.y, t.y + 4, k / 20), life: 1.2, type: 'fade', size: 2, color: PAL.sky });
      if (lv.beamSeq.length === 4) { setFlag('h2_beam'); AudioSys.sfx('restore'); Bark.say('pix', '¡Pipeline conectado! El puente de hidrógeno se ilumina.'); lv.updatePower(); }
    }
  });
  b.e('T', 30, 15, node('n2', 2, 'ELEC')).e('T', 8, 15, node('n1', 1, 'AGUA')).e('T', 74, 15, node('n3', 3, 'H2')).e('T', 86, 15, node('n4', 4, 'USO'));
  b.e('*', 117, 8, { id: 'c_h21', hidden: true }).e('*', 42, 10, { id: 'c_h22' });
  b.e('E', 50, 15, { type: 'drainer' }).e('E', 78, 15, { type: 'chaos', vx: 30 }).e('E', 120, 15, { type: 'overflow', max: 14 });
  b.e('a', 20, 15).e('a', 105, 15).e('a', 146, 15);
  b.e('N', 18, 15, {
    id: 'capitan', cast: 'capitan', talk: lv => (function* () {
      if (!flag('h2_pipe')) {
        yield* talk([
          ['capitan', '¡Ah del muelle! Capitán H2O, a su servicio. Mi barco va a hidrógeno. ¡El combustible del futuro!', 'feliz'],
          ['capitan', 'Se saca del mar, como el petróleo, ¿no? Un buen pozo de hidrógeno y listo.', 'n'],
          ['lia', 'Mmm... no exactamente, Capitán.', 'pensando'],
          ['capitan', '¿No? Pues el electrolizador está parado y no sé ni por dónde empezar. La consola es suya.', 'sorpresa']
        ]);
        return;
      }
      if (!hasAbility('beam')) { yield* talk([['capitan', '¡Un vector! El hidrógeno es un vector. Llevo cuarenta años llamándolo "combustible mágico".', 'risa'], ['capitan', 'Tome, mi linterna de enlace. Conecta módulos en orden... si el orden es el correcto.', 'feliz']]); yield* grant('beam'); yield* talk([['pix', 'Los módulos 1-2-3-4 del puerto: conéctalos EN ORDEN con PIPELINE BEAM para encender el puente.', 'n']]); return; }
      if (questState('s_barco') !== 'done') { setQuest('s_barco', 'active'); yield C.say('capitan', 'Antes de zarpar, repostemos. Con seguridad, que el hidrógeno no perdona despistes.', 'n'); const ok = yield* runPuzzle(CFG_H2_BARCO); if (ok) setQuest('s_barco', 'done'); return; }
      yield C.say('capitan', 'Rumbo a Ciudad Batería cuando quiera, grumete.', 'feliz');
    })()
  });
  b.e('T', 23, 15, {
    id: 'consola', look: 'bigconsole', color: PAL.aqua, verb: 'Diseñar pipeline', doneFlag: 'h2_pipe',
    lens: ['electrolizador: {r}sin entrada{/}', 'pipeline: {r}sin definir{/}'],
    run: lv => (function* () {
      if (flag('h2_pipe')) return;
      yield* runPuzzle(CFG_H2_PIPE, function* () { setFlag('h2_pipe'); achieve('vector'); lv.updatePower(); yield* teach('hidrogeno'); yield* teach('pipeline'); yield* teach('eficiencia'); });
    })()
  });
  b.e('N', 106, 15, { id: 'teo', cast: 'teo', needs: 'eclipseRevealed', talk: [['teo', 'Eclipse abrió una ruta de emergencia. Sigue siendo raro confiar en él.', 'pensando']] });
  b.e('T', 128, 15, {
    id: 'muelle', look: 'bigconsole', color: PAL.aqua, verb: 'Muelle de hidrógeno', doneFlag: 'restored_h2', enabled: () => flag('eclipseRevealed'),
    run: lv => (function* () {
      if (flag('restored_h2')) return;
      yield* restoreRegion(lv, 'h2', 'Agua → electricidad → H2 → tanque → pila → uso.');
      setQuest('m_bateria', 'active');
    })()
  });
  b.e('X', 148, 15, { cond: () => flag('restored_h2'), label: 'MAPA' });
  level('h2', {
    theme: 'h2', region: 'h2', title: 'Bahía H2', subtitle: 'Pipelines + hidrógeno verde', music: 'h2',
    zones: [{ x0: 0, x1: 45, flag: 'h2_pipe' }, { x0: 45, x1: 101, flag: 'h2_beam' }, { x0: 101, x1: 150, flag: 'restored_h2' }],
    dyn: { B: { solid: () => flag('h2_beam'), style: 'bridge' }, E: { solid: () => !flag('eclipseRevealed'), style: 'barrier', color: PAL.violet } },
    quips: () => flag('pixQuiet') && !flag('pixHealed') ? null : choice(['El hidrógeno arde con llama casi invisible. Dato divertido. Y aterrador.', 'OVERFLOW: cuando es grande, rebota. Cuando es pequeño, se depura.']),
    objective: lv => !flag('h2_pipe') ? 'Diseña el pipeline del hidrógeno (consola)' : !hasAbility('beam') ? 'Habla con el Capitán H2O' : !flag('h2_beam') ? 'Conecta los módulos 1→2→3→4 con PIPELINE BEAM' : !flag('eclipseRevealed') ? 'Cruza el puente de hidrógeno (→)' : !flag('restored_h2') ? 'Activa el muelle de hidrógeno' : 'Vuelve al mapa (→)',
    hint: lv => !flag('h2_beam') && flag('h2_pipe') ? 'Módulo 1 (AGUA) está al principio, el 2 junto al electrolizador, el 3 y el 4 pasado el tanque.' : null,
    pointAt: lv => !flag('h2_pipe') ? 'consola' : !hasAbility('beam') ? 'capitan' : !flag('h2_beam') ? ['n1', 'n2', 'n3', 'n4'][(lv.beamSeq || []).length] : 'muelle',
    triggers: [
      {
        x: 101, w: 2, flag: 'h2_rescue', cond: () => flag('h2_beam'), run: lv => (function* () {
          const p = lv.player;
          AudioSys.sfx('steam'); AudioSys.sfx('boom'); FX.shake(4, 0.5);
          yield C.say('teo', '¡LÍA! ¡La tubería de arriba va a reventar!', 'sorpresa');
          p.anim = 'surprise'; p.forceAnim = 'surprise';
          AudioSys.sfx('eclipse'); AudioSys.playSong('eclipse');
          lv.eclipseAt = { x: p.x + 20, y: p.y - 30 };
          yield C.during(1.5, () => { for (let i = 0; i < 3; i++) Particles.spawn({ x: p.x + 20 + rand(-20, 20), y: p.y - 40, vx: rand(-20, 20), vy: rand(20, 60), life: 0.6, type: 'fade', size: 3, color: 'rgba(255,255,255,0.7)' }); });
          p.forceAnim = null;
          yield* talk([
            ['narrador', 'Una silueta violeta se interpone entre Lía y el chorro de gas. Lo aísla. Lo contiene.'],
            ['lia', '...Me ha salvado.', 'sorpresa'],
            ['pix', 'Eso... no se puede explicar como sabotaje.', 'triste']
          ]);
          lv.eclipseAt.x += 60;
          yield* talk([['lia', '¡Espera!', 'decidida']]);
          yield* talk([['narrador', 'Eclipse intenta marcharse. Teó se planta en la salida.'], ['teo', 'No. Esta vez hablas.', 'decidida']]);
          yield* talk([
            ['eclipse', 'IDENTIFICACIÓN: E.C.L.I.P.S.E.'],
            ['eclipse', 'Energy Containment Logic for Instability Prevention and System Equilibrium.'],
            ['pix', 'Traducción libre: freno de emergencia con muy mal carácter.', 'pensando'],
            ['eclipse', 'No robo energía. La AÍSLO.'],
            ['lia', 'Nos has dejado sin luz.', 'enojo'],
            ['eclipse', 'He impedido siete colapsos.'],
            ['teo', 'Podías haberlo explicado.', 'enojo'],
            ['eclipse', 'No era necesario para ejecutar la contención.'],
            ['pix', 'Confirmado. Cero carisma.', 'pensando'],
            ['eclipse', 'Fragmento predictivo detectado.'],
            ['pix', 'No me llames fragmento.', 'enojo'],
            ['eclipse', '...'],
            ['eclipse', 'Ruta de emergencia abierta. Contención activa.']
          ]);
          setFlag('eclipseRevealed'); unlockCodex('m_quien'); unlockCodex('m_patron');
          lv.eclipseAt = null; AudioSys.sfx('door');
          yield C.wait(0.8);
          AudioSys.playSong('mystery');
          yield* talk([
            ['lia', 'Entonces Eclipse no era el villano. Llegaba ANTES de cada desastre... para contenerlo.', 'pensando'],
            ['teo', 'La imagen era verdadera. La interpretación, equivocada.', 'n'],
            ['lia', 'Nueva pregunta: ¿por qué AURORA crearía un freno de emergencia... contra sí misma?', 'pensando'],
            ['pix', 'Lía... desde Gea puedo... predecir cosas. Un poco. No es certeza: son probabilidades.', 'triste']
          ]);
          yield* grant('predict');
          yield* talk([['pix', 'Por ejemplo: 70% de probabilidad de que las cosas se compliquen. Pero un 30% de que no. Eso es lo que tienen las predicciones.', 'pensando'], ['lia', 'Predicción no es certeza. Me gusta ese 30%.', 'feliz']]);
          yield* teach('prediccion');
        })()
      }
    ],
    onEnter: lv => (function* () {
      if (flag('h2_intro')) return;
      setFlag('h2_intro'); unlockCodex('i_h2'); unlockCodex('p_capitan');
      yield* talk([['teo', 'Bahía H2. Electrolizadores, depósitos, barcos...', 'n'], ['pix', '...', 'triste']]);
      const a = yield C.ask('pix', 'Lía... ¿crees que soy una parte de AURORA?', ['Eres PÍX.', 'Eres las dos cosas.', 'Todavía no lo sabemos.'], 'triste');
      G.save.pixAnswer = a;
      if (a === 0) yield* talk([['pix', 'Eso dijiste en Gea. Todavía no sé si me lo creo... pero me gusta cómo suena.', 'triste']]);
      else if (a === 1) yield* talk([['pix', 'Las dos cosas. Como el hidrógeno: agua y energía a la vez. Hmm. No está mal.', 'pensando']]);
      else yield* talk([['pix', '"Todavía". Esa palabra deja la puerta abierta. Gracias por no inventarte una respuesta.', 'pensando']]);
      yield* talk([['lumi', '✦ ✦', 'n'], ['teo', 'Vamos. El Capitán H2O está en el muelle.', 'n']]);
    })()
  }, b);
})();

// =====================================================================
//  CIUDAD BATERÍA
// =====================================================================
const CFG_BAT_SORT = {
  kind: 'sort', main: true, title: 'SORT GRID: prioridad de descarga', tags: ['ORDENAMIENTO', 'ALMACENAMIENTO'], concepts: ['sorting', 'storage'], codex: 'ordenamiento', music: 'bateria',
  items: [{ name: 'A', soc: 58 }, { name: 'B', soc: 91 }, { name: 'C', soc: 23 }, { name: 'D', soc: 76 }, { name: 'E', soc: 12 }, { name: 'F', soc: 64 }],
  key: 'soc', desc: true, fmt: x => x.soc + '%', goodComps: 15,
  intro: 'Tú ERES el algoritmo burbuja: compara el par marcado. De MAYOR a MENOR carga (la más llena descarga primero).',
  hints: ['¿El de la izquierda tiene MÁS carga que el de la derecha? Si no, intercambia.', 'Cada pasada lleva el más pequeño hasta el final. El ■ marca los que ya están en su sitio.', { text: 'Regla: si izquierda < derecha → INTERCAMBIAR. Si no → DEJAR.' }],
  okMsg: '¡Ordenadas por SOC! Ahora la ciudad descarga primero las más llenas y protege las más débiles.', xp: 50
};
const LOGS = [['00:12', 'arranque'], ['02:40', 'nube'], ['05:05', 'ok'], ['07:31', 'ok'], ['09:02', 'pico'], ['11:48', 'ok'], ['13:15', 'aviso'], ['15:59', 'ok'], ['17:20', 'baja'], ['19:03', 'fest'], ['20:44', 'ERR'], ['21:30', 'ERR'], ['22:18', 'ecl'], ['23:47', 'VEGA'], ['23:52', 'ecl'], ['23:59', 'fin']];
const CFG_BAT_SEARCH = {
  kind: 'sort', mode: 'search', main: true, title: 'Buscar el registro de Vega', tags: ['BÚSQUEDA BINARIA', 'ALMACENAMIENTO'], concepts: ['search', 'storage'], codex: 'busqueda',
  items: LOGS.map(([t, s], i) => ({ name: t, t: i, s })), key: 't', targetVal: 13, target: '23:47', limit: 4, fmt: x => x.name,
  intro: '16 registros ordenados por hora. Vega dejó un mensaje a las 23:47. Encuéntralo abriendo 4 registros como máximo.',
  hints: ['Si abres uno al azar, ¿cuántos descartas? ¿Y si abres el del MEDIO?', 'Abre el #7 u #8 (el medio). Luego el medio de la mitad que queda.', { text: 'Pista fuerte: #8 → #12 → #14 → #13.' }],
  okMsg: '¡Encontrado!', xp: 50
};
const CFG_BAT_BETA = {
  kind: 'code', title: 'Batería tímida', tags: ['SI / SINO', 'ALMACENAMIENTO'], concepts: ['conditions', 'storage'], codex: 'almacenamiento', ticks: 6, tickLabel: t => 'hora ' + (t + 1),
  palette: ['ifelse', 'act:usar_A', 'act:usar_B'], actions: { usar_A: { label: 'usar_A' }, usar_B: { label: 'usar_B' } },
  sensors: ['soc_A', 'soc_B', 'demanda'], condRight: ['soc_A', 'soc_B', 20, 40, 60], defaults: { cond: { l: 'soc_A', op: '>', r: 'soc_B' } },
  world: W_dispatch({ bats: [{ name: 'A', soc: 90, eff: 0.9 }, { name: 'B', soc: 80, eff: 0.95 }], demand: [2, 2, 2, 2, 2, 2], okMsg: 'El barrio tiene luz 6 horas y ninguna torre bajó del 5%.' }),
  start: [{ op: 'if', cond: { l: 'soc_A', op: '>', r: 'soc_B' }, body: [A('usar_B')], else: [A('usar_A')] }],
  intro: 'El barrio de BETA agota siempre la torre equivocada. Cada hora debe usar la torre con MÁS carga: la pregunta está bien, pero las acciones están cambiadas (tócalas o muévelas con ▲▼).',
  hints: ['¿Qué pregunta harías cada hora para elegir la torre?', { text: 'SI soc_A > soc_B ENTONCES usar_A SINO usar_B', highlight: 'palette:ifelse' }, { text: 'Estructura:', partial: [{ op: 'if', cond: { l: 'soc_A', op: '>', r: 'soc_B' }, body: [A('usar_A')], else: [A('usar_B')] }] }]
};
const CFG_BAT_BUG = {
  kind: 'code', title: 'Bug de prioridad', tags: ['DEPURACIÓN', 'SI', 'ALMACENAMIENTO'], concepts: ['debugging', 'conditions', 'storage'], codex: 'depuracion', ticks: 6, tickLabel: t => 'hora ' + (t + 1),
  palette: ['ifelse', 'act:usar_A', 'act:usar_B'], actions: { usar_A: { label: 'usar_A' }, usar_B: { label: 'usar_B' } },
  sensors: ['soc_A', 'soc_B'], condRight: ['soc_A', 'soc_B', 20, 40],
  world: W_dispatch({ bats: [{ name: 'A', soc: 85, eff: 0.9 }, { name: 'B', soc: 88, eff: 0.9 }], demand: [2, 2, 2, 2, 2, 2] }),
  start: [{ op: 'if', cond: { l: 'soc_A', op: '<', r: 'soc_B' }, body: [A('usar_A')], else: [A('usar_B')] }],
  intro: 'Este programa "prioriza" las baterías... pero agota siempre la más débil. Depúralo.',
  hints: ['Ejecuta PASO a PASO: ¿qué torre elige cuando A tiene MENOS carga?', 'El operador está al revés.', { text: 'Cambia < por >.' }]
};

(function () {
  const b = new MapB(160, 20);
  b.ground(0, 160, 16);
  b.plat(14, 16, 13).plat(19, 21, 10).plat(24, 26, 7);
  b.fill(40, 15, 44, 15, '^').plat(40, 44, 12);
  b.plat(60, 62, 12).plat(66, 68, 10).plat(72, 74, 12);
  b.fill(96, 15, 101, 15, '^').plat(97, 100, 12);
  b.fill(120, 0, 120, 15, 'D');
  b.fill(128, 11, 130, 11, '?');
  b.start(3, 15);
  b.seeds(14, 26, 6, 3).seeds(40, 44, 11, 2).seeds(60, 74, 9, 3).seeds(128, 130, 10, 1).seeds(140, 152, 15, 3);
  [5, 18, 32, 48, 58, 80, 92, 108, 124, 138, 152].forEach(x => b.e('L', x, 15));
  b.e('C', 30, 15).e('C', 64, 15).e('C', 104, 15).e('C', 124, 15);
  [8, 36, 52, 84, 112, 134, 146].forEach((x, i) => b.e('m', x, 15, { look: 'batterytower', soc: lv => flag('restored_bateria') ? 60 + (i * 13) % 40 : flag('bat_sort') ? [91, 76, 64, 58, 23, 12, 50][i] : [12, 23, 58, 64, 76, 91, 40][i] }));
  b.e('m', 90, 15, { look: 'kiosk', label: 'SOC' });
  b.e('*', 25, 5, { id: 'c_bateria1' }).e('*', 129, 9, { id: 'c_bateria2', hidden: true });
  b.e('E', 46, 15, { type: 'drainer', priority: 4 }).e('E', 76, 15, { type: 'drainer', priority: 2 }).e('E', 116, 15, { type: 'drainer', priority: 5 }).e('E', 144, 15, { type: 'overflow', max: 12 });
  b.e('a', 22, 15).e('a', 86, 15).e('a', 156, 15);
  b.e('N', 12, 15, {
    id: 'beta', cast: 'beta', quest: 's_beta', soc: () => questState('s_beta') === 'done' ? 90 : 18, talk: lv => (function* () {
      unlockCodex('p_beta');
      if (questState('s_beta') === 'done') { yield* talk([['beta', 'Estoy al 90%. No quiero alarmar a nadie...', 'feliz'], ['beta', '...pero estoy ENCANTADA.', 'feliz']]); return; }
      yield* talk([['beta', 'Estoy al 18%.', 'triste'], ['beta', 'No quiero alarmar a nadie.', 'triste'], ['beta', 'Pero estoy alarmando a todos.', 'triste'], ['beta', 'Mi barrio vacía siempre la misma torre. Luego yo tengo que compartir mi carga. ¿Podrías...?', 'triste']]);
      setQuest('s_beta', 'active');
      const ok = yield* runPuzzle(CFG_BAT_BETA);
      if (ok) { setQuest('s_beta', 'done'); achieve('beta_friend'); yield C.say('beta', '¡Me estoy cargando! ¡Siento las cosquillas de los electrones!', 'feliz'); }
    })()
  });
  b.e('N', 55, 15, { id: 'voltia', cast: 'neon', talk: lv => (function* () {
    if (!flag('bat_sort')) { yield* talk([['neon', 'Soy Voltia. Alguien ordenó todas las baterías de la ciudad... por COLOR. Y por número de serie. Obsesivamente.', 'pensando'], ['neon', 'Pero NO por su carga. Resultado: se descargan primero las más débiles. El SORT GRID está aquí.', 'n']]); return; }
    if (!hasAbility('dash')) { yield* talk([['neon', 'Ahora sí: primero lo prioritario. Toma, mis zapatillas de impulso.', 'feliz']]); yield* grant('dash'); yield* talk([['pix', 'PRIORITY DASH: un impulso rápido. Atraviesa DRAINERS y, si hay un objetivo prioritario cerca, va directo a él.', 'n'], ['neon', 'Ojo: prioridad no significa lo único que importa.', 'pensando']]); return; }
    yield C.say('neon', 'El archivo de registros está al fondo, pasando la barrera. Dicen que hay mensajes... raros.', 'n');
  })() });
  b.e('T', 58, 15, {
    id: 'sortgrid', look: 'bigconsole', color: PAL.pink, verb: 'SORT GRID', doneFlag: 'bat_sort',
    lens: ['orden actual: {r}por color{/}', 'orden deseado: {g}por SOC{/}'],
    run: lv => (function* () { if (flag('bat_sort')) return; yield* runPuzzle(CFG_BAT_SORT, function* () { setFlag('bat_sort'); lv.updatePower(); yield* teach('ordenamiento'); yield* teach('prioridad'); }); })()
  });
  b.e('N', 100, 15, {
    id: 'guardia', cast: 'guardia', quest: 's_bug', questNeeds: 'bat_sort', talk: lv => (function* () {
      if (!flag('bat_sort')) { yield C.say('guardia', 'Circulen. Bueno, si pueden: todo está a oscuras.', 'n'); return; }
      if (questState('s_bug') === 'done') { yield C.say('guardia', 'Un símbolo al revés y todo al revés. Aprendido.', 'n'); return; }
      setQuest('s_bug', 'active');
      yield C.say('guardia', 'Nuestro programa de prioridad tiene un bug. Descarga siempre la más débil.', 'pensando');
      const ok = yield* runPuzzle(CFG_BAT_BUG);
      if (ok) setQuest('s_bug', 'done');
    })()
  });
  b.e('N', 118, 15, { id: 'teo', cast: 'teo', talk: [['teo', 'Barrera de seguridad. Tiene un nodo de prioridad... hay que llegar a él a toda velocidad.', 'pensando'], ['teo', 'Con PRIORITY DASH atraviesas a los DRAINERS sin que te chupen energía.', 'n']] });
  b.e('T', 122, 15, {
    id: 'archivo', look: 'screen', color: PAL.pink, verb: 'Archivo de registros', doneFlag: 'vegaMsg2', enabled: () => flag('bat_sort'),
    lines: () => flag('vegaMsg2') ? ['23:47 VEGA', 'objetivo?', ''] : ['16 registros', 'ordenados', 'por hora'],
    run: lv => (function* () {
      if (flag('restored_bateria')) return;
      if (!flag('vegaMsg2')) {
        const r = yield puzzle(CFG_BAT_SEARCH);
        if (!r || !r.success) return;
        if (r.extra && r.extra.tries <= 4) addMastery('search', 5);
        setFlag('vegaMsg2'); yield* teach('busqueda');
        yield* talk([['vega', 'Lía, el problema no está en una línea.', 'pensando'], ['vega', 'Está en el objetivo.', 'n'], ['lia', '¿En el objetivo? ¿Qué objetivo?', 'sorpresa']]);
      }
      // la llamada que la jugadora colocó en el prólogo
      AudioSys.playSong('sad');
      lv.forceDark = 0.55;
      yield* talk([
        ['sistema', 'REGISTRO 19:03:12 · LUMINA_LOOP.start() → AURORA.optimize() → perfectOptimize() · ×1204/s'],
        ['lia', 'Esa llamada...', 'sorpresa'],
        ['lia', 'La puse yo. En la secuencia de arranque. En el festival. "llamar AURORA.optimize()".', 'culpa'],
        ['pix', '...', 'triste']
      ]);
      yield C.wait(2);
      yield* talk([
        ['lia', 'Yo activé esto.', 'culpa'],
        ['teo', 'Activaste algo.', 'n'],
        ['lia', 'Esa es una forma muy amable de decirlo.', 'culpa'],
        ['teo', 'No. Es una forma precisa.', 'decidida']
      ]);
      yield C.wait(1.5);
      yield* talk([
        ['teo', 'Ser parte de la causa no significa ser toda la causa.', 'n'],
        ['lumi', '✦', 'n'],
        ['lia', '...Gracias, Teó.', 'triste'],
        ['teo', 'No me des las gracias. Arréglalo. Conmigo.', 'feliz'],
        ['pix', 'Y conmigo. Aunque sea un fragmento. Un fragmento con opiniones.', 'triste']
      ]);
      setFlag('liaImplicated'); unlockCodex('m_lumina');
      lv.forceDark = null;
      yield* restoreRegion(lv, 'bateria', 'Ordenar, buscar, priorizar... y hacerse cargo.');
      setQuest('m_prisma', 'active');
    })()
  });
  b.e('X', 158, 15, { cond: () => flag('restored_bateria'), label: 'MAPA' });
  level('bateria', {
    theme: 'bateria', region: 'bateria', title: 'Ciudad Batería', subtitle: 'Búsqueda y ordenamiento + almacenamiento', music: 'bateria',
    zones: [{ x0: 0, x1: 120, flag: 'bat_sort' }, { x0: 120, x1: 160, flag: 'restored_bateria' }],
    dyn: { D: { solid: () => !hasAbility('dash'), style: 'barrier', color: PAL.pink } },
    quips: () => flag('pixQuiet') && !flag('pixHealed') ? null : 'Neón por todas partes. Me siento en casa.',
    objective: lv => !flag('bat_sort') ? 'Reordena las baterías en el SORT GRID' : !hasAbility('dash') ? 'Habla con Voltia' : !flag('vegaMsg2') ? 'Busca el registro de Vega en el archivo (→)' : !flag('restored_bateria') ? 'Revisa el archivo de registros' : 'Vuelve al mapa (→)',
    hint: lv => !flag('bat_sort') ? 'En burbuja comparas vecinos. Izquierda con menos carga que derecha → INTERCAMBIAR.' : 'La búsqueda binaria empieza por el MEDIO.',
    pointAt: lv => !flag('bat_sort') ? 'sortgrid' : !hasAbility('dash') ? 'voltia' : 'archivo',
    onEnter: lv => (function* () {
      if (flag('bateria_intro')) return;
      setFlag('bateria_intro'); unlockCodex('i_bateria');
      yield* talk([['teo', 'Ciudad Batería. La ciudad más bonita de noche... cuando tiene luz.', 'n'], ['lia', 'Mira las torres: ordenadas por color, con una precisión obsesiva.', 'pensando'], ['pix', '...Alguien odia el desorden. Muchísimo.', 'triste']]);
    })()
  }, b);
})();
