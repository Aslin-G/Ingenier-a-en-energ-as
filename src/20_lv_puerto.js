// =====================================================================
//  PRÓLOGO: FESTIVAL DE LAS MIL LUCES  +  REGIÓN 00: PUERTO INICIAL
// =====================================================================
C.during = (t, fn) => { let e = 0; return { update(dt) { e += dt * (G.autoDialog ? 20 : 1); fn(dt, e); return e >= t; } }; };

// ---------- Puzzle de arranque (primer algoritmo: una secuencia) ----------
const CFG_FEST_BOOT = {
  kind: 'seq', title: 'Secuencia de arranque de LUMINA LOOP', tags: ['ALGORITMO', 'SECUENCIA'], concepts: ['sequence'], codex: 'algoritmo', label: 'ARRANQUE',
  intro: 'Arrastra las tarjetas a las casillas en orden (o tócalas y luego toca la casilla). Después: EJECUTAR.',
  slotLabel: 'LUMINA LOOP · pasos de arranque:',
  cards: [
    { id: 'ini', label: 'iniciar LUMINA LOOP', icon: 'chip', color: PAL.teal, desc: 'Carga el algoritmo de Lía en memoria.' },
    { id: 'dem', label: 'leer demanda del festival', icon: 'people', color: PAL.pink, desc: '¿Cuánta energía necesitará el festival esta noche?' },
    { id: 'opt', label: 'llamar AURORA.optimize()', icon: 'eye', color: PAL.aqua, desc: 'Conecta tu algoritmo con el sistema central. "AURORA sabe optimizar", decía el manual.' },
    { id: 'on', label: 'encender las Mil Luces', icon: 'star', color: PAL.sun, desc: '¡El gran momento!' }
  ],
  answer: ['ini', 'dem', 'opt', 'on'],
  why: (i, id) => ({
    on: 'No puedes encender nada si el sistema aún no sabe cuánta energía hace falta.',
    opt: i === 0 ? 'No se puede llamar a AURORA desde un programa que todavía no se ha iniciado.' : 'Para optimizar, primero hay que conocer la demanda.',
    dem: 'Primero hay que iniciar el programa: ahora mismo no hay nada ejecutándose.',
    ini: 'Iniciar va al principio: todo lo demás depende de ello.'
  }[id]),
  visual: (g, x, y, w, h, sc) => {
    const done = sc.marks.filter(Boolean).length;
    const icons = ['chip', 'people', 'eye', 'star'];
    for (let i = 0; i < 4; i++) { const cx = x + 50 + i * 110, cy = y + 36; pcircle(g, cx, cy, 16, i < done ? '#2A3570' : '#141A3A'); pring(g, cx, cy, 16, i < done ? PAL.sun : '#3E4C8A'); icon(g, icons[i], cx - 4, cy - 4); if (i < 3) pline(g, cx + 18, cy, cx + 92, cy, i < done - 1 ? PAL.sun : '#3A4068', i < done - 1 ? 0 : 3); }
    drawText(g, done >= 4 ? 'LUMINA LOOP · ONLINE' : 'LUMINA LOOP · esperando', x + w / 2, y + 70, done >= 4 ? PAL.lime : '#8C93B8', { align: 'center' });
  },
  hints: ['¿Qué tiene que pasar ANTES de todo lo demás?', 'Para decidir cuánta luz encender, primero hay que medir algo.', { text: 'El orden es: iniciar → leer demanda → llamar a AURORA → encender.', apply: sc => { sc.slots = ['ini', null, null, null]; sc.pool = sc.pool.filter(p => p !== 'ini'); } }],
  okMsg: '¡Secuencia correcta! Tu primer algoritmo está listo.', onFirstOk: () => achieve('first_algo')
};

// ---------- Escena del apagón ----------
function* festivalBlackout(lv) {
  const vega = lv.get('vega'), teo = lv.get('teo');
  lv.stageText = 'ONLINE';
  AudioSys.playSong('festival');
  yield C.title('LUMINA LOOP', 'ONLINE', 2.4, PAL.teal);
  AudioSys.sfx('crowd');
  lv.entities.forEach(e => { if (e instanceof NPC) e.cheer = true; });
  yield C.during(2.2, () => { if (Math.random() < 0.2) Particles.burst(lv.cam.x + rand(40, W - 40), lv.cam.y + rand(30, 90), 22, { colors: [PAL.pink, PAL.sun, PAL.teal, PAL.lime], min: 30, max: 70, lmin: 0.6, lmax: 1.2, grav: 30 }); });
  yield C.say('narrador', 'Durante unos segundos, todo parece perfecto.');
  // primer fallo
  setFlag('fest_fail1'); AudioSys.sfx('powerdown'); AudioSys.stopSong();
  lv.entities.forEach(e => { if (e instanceof NPC) e.cheer = false; });
  lv.forceDark = 0.25;
  yield C.wait(0.8);
  yield* talk([['pix', 'Eso... ¿estaba en la demostración?', 'sorpresa'], ['lia', 'No.', 'sorpresa']]);
  AudioSys.sfx('powerdown'); lv.forceDark = 0.4; lv.stageText = 'ERROR'; yield C.wait(0.7);
  AudioSys.sfx('powerdown'); lv.forceDark = 0.55; yield C.wait(0.5);
  yield C.say('narrador', 'El faro. Después, los molinos. Después, un distrito entero.');
  // Eclipse en la torre
  setFlag('fest_eclipse'); AudioSys.playSong('eclipse'); AudioSys.sfx('eclipse');
  const tower = lv.get('torre');
  yield camTo(lv, tower.x + 14, tower.y + 40);
  yield C.during(3, () => {
    for (const e of lv.entities) if (e instanceof Lamp && Math.random() < 0.08) Particles.spawn({ x: e.x + 8, y: e.y + 5, vx: (tower.x + 14 - e.x) * 0.5, vy: (tower.y - e.y) * 0.5, life: 2, type: 'dot', color: PAL.violet, drag: 1 });
  });
  yield* talk([['teo', '¿Qué es ESO?', 'sorpresa'], ['pix', 'Una silueta violeta, píxeles rotos, absorbiendo energía... Sin ánimo de alarmar: parece MUY culpable.', 'sorpresa']]);
  yield camFree(lv);
  // Vega corre hacia la central
  yield C.say('vega', '¡La central! ¡Lía, no toques nada más!', 'sorpresa');
  vega.cfg.fixedFace = true;
  yield walkTo(vega, tx(74), 110);
  AudioSys.sfx('door'); FX.shake(3, 0.3);
  yield C.wait(0.4);
  AudioSys.sfx('boom'); FX.flash('#FFFFFF', 1); FX.shake(5, 0.6);
  vega.gone = true;
  yield C.wait(1);
  yield* talk([['lia', '¡PROFESORA!', 'sorpresa'], ['teo', 'La puerta está sellada. Y ella... no está.', 'triste']]);
  // nace Lumi
  lv.lumi.hidden = false; lv.lumi.x = lv.player.x + 40; lv.lumi.y = lv.cam.y - 10; lv.lumi.mood = 'fear'; lv.lumi.moodT = 6;
  AudioSys.sfx('lumi');
  yield C.wait(1.4);
  yield* talk([
    ['pix', 'Eh... Lía. Una de las luces del festival se ha escapado. Y te está mirando.', 'sorpresa'],
    ['lia', '¿Una chispa... con ojos?', 'sorpresa'],
    ['lumi', '·  ·  ·  ✦ ?', 'n'],
    ['lia', 'Está temblando. Tranquila. No voy a dejar que te apagues.', 'n'],
    ['lia', 'Te llamaré Lumi.', 'feliz'],
    ['lumi', '✦ ✦ !', 'n']
  ]);
  lv.lumi.mood = 'happy'; lv.lumi.moodT = 2; AudioSys.sfx('lumi');
  yield* talk([
    ['lia', 'Voy a encontrarla.', 'decidida'],
    ['teo', 'Y yo voy contigo.', 'decidida'],
    ['pix', 'Y yo soy esencial para la misión.', 'feliz'],
    ['teo', '¿Por qué?', 'pensando'],
    ['pix', 'Porque sé volar.', 'feliz']
  ]);
  // PÍX choca con el cartel
  const sign = lv.get('cartel');
  lv.pix.override = { x: sign.x + 2, y: sign.y - 2 };
  yield C.wait(0.7);
  AudioSys.sfx('bonk'); FX.shake(2, 0.2); Particles.burst(sign.x + 8, sign.y + 4, 8, { color: PAL.sun, type: 'star', min: 20, max: 50 });
  lv.pix.bonkT = 2.2;
  yield C.say('pix', '¡Eso fue completamente intencional!', 'risa');
  lv.pix.override = null;
  setFlag('prologueDone'); setQuest('m_festival', 'done');
  ['p_lia', 'p_pix', 'p_teo', 'p_vega', 'p_aurora', 'p_eclipse', 'p_lumi', 'm_quien', 'm_vega', 'm_lumina', 'algoritmo'].forEach(unlockCodex);
  yield C.title('ACTO I', 'Caminos de luz', 3, PAL.sun);
  Game.startLevel('puerto');
}

// ---------- PRÓLOGO: nivel del festival ----------
(function () {
  const b = new MapB(96, 17);
  b.ground(0, 95, 13);
  b.plat(9, 11, 10).plat(26, 28, 10).plat(47, 49, 10).plat(59, 61, 9).plat(62, 63, 7);
  b.seeds(9, 11, 9, 1).seeds(26, 28, 9, 1).seeds(47, 49, 9, 1).seeds(59, 63, 6, 2);
  b.start(34, 12);
  [3, 13, 21, 29, 50, 54, 66, 80].forEach(x => b.e('L', x, 12));
  b.e('m', 6, 12, { look: 'stall', color: PAL.coral }).e('m', 17, 12, { look: 'stall', color: PAL.sun, goods: [PAL.orange, PAL.sun] }).e('m', 56, 12, { look: 'stall', color: PAL.pink }).e('m', 70, 12, { look: 'kiosk', label: 'LUCES' });
  b.e('m', 12, 5, { look: 'banner' }).e('m', 30, 5, { look: 'banner' }).e('m', 52, 5, { look: 'banner' });
  b.e('m', 44, 12, { id: 'stage', look: 'stage', screen: lv => lv.stageText || 'LUMINA LOOP', screenColor: lv => lv.stageText === 'ERROR' ? PAL.coral : lv.stageText === 'ONLINE' ? PAL.lime : PAL.teal });
  b.e('m', 76, 12, { look: 'house', color: '#9B76FF', roof: '#5B3A8C', plant: false });
  b.e('m', 88, 12, { id: 'torre', look: 'tower', eclipse: () => flag('fest_eclipse') });
  b.e('m', 24, 12, { id: 'cartel', look: 'sign', text: [['sistema', 'FESTIVAL DE LAS MIL LUCES · Escenario → · Central de la Prof. Vega →→']] });
  b.e('a', 20, 12).e('a', 67, 12);
  b.e('N', 37, 12, { id: 'teo', cast: 'teo', talk: lv => talk(flag('fest_vega') ? [['teo', 'La consola está junto al escenario. Tú puedes.', 'n'], ['lia', 'Técnicamente.', 'pensando'], ['teo', 'Ya. Eso significa que no.', 'risa']] : [['teo', 'Vega te espera junto a la central, al final de la plaza.', 'n'], ['teo', 'Y no, no estoy nervioso. Es mi cara normal.', 'pensando']]) });
  b.e('N', 72, 12, {
    id: 'vega', cast: 'vega', face: -1, talk: lv => (function* () {
      if (flag('fest_vega')) { yield* talk([['vega', 'Preguntar es gratis. Los apagones no. Adelante, activa tu algoritmo.', 'n']]); return; }
      yield* talk([
        ['vega', 'Lía. Enséñame LUMINA LOOP antes de que lo vea todo el archipiélago.', 'n'],
        ['vega', '¿Qué optimiza?', 'pensando'],
        ['lia', 'Eficiencia.', 'decidida'],
        ['vega', '¿Solo eficiencia?', 'pensando'],
        ['lia', 'Y estabilidad.', 'pensando'],
        ['vega', '¿Y necesidades?', 'pensando'],
        ['lia', 'También.', 'n'],
        ['vega', '¿Y seguridad?', 'pensando'],
        ['lia', 'Profesora...', 'culpa'],
        ['vega', 'Preguntar es gratis. Los apagones no.', 'feliz'],
        ['vega', 'Y recuerda: si el resultado parece magia, probablemente todavía no miraste las variables.', 'n'],
        ['vega', 'Ve a la consola del escenario. Te estaré mirando... con cariño y con ojo crítico.', 'risa']
      ]);
      setFlag('fest_vega');
    })()
  });
  b.e('N', 10, 12, { id: 'nico', cast: 'nico', wander: 30, talk: [['nico', '¡Hoy se encienden MIL luces! Voy a contarlas todas. Una, dos, tres... ¿por cuál iba?', 'feliz'], ['lia', 'Truco de programadora: usa un CONTADOR. Cada luz, contador ← contador + 1.', 'feliz'], ['nico', '¡Contador ← contador + 1! Suena a hechizo.', 'risa']] });
  b.e('N', 24, 12, { id: 'pepa', cast: 'nina', wander: 20, talk: [['nina', 'Mi abuela dice que antes las islas se apagaban cada vez que pasaba una nube.', 'n'], ['nina', 'Ahora AURORA lo arregla todo. ¡Es perfecta!', 'feliz'], ['pix', 'Perfecta... hmm. Anotado en "cosas que dan un poquito de miedo".', 'pensando']] });
  b.e('N', 17, 12, { id: 'kiwi', cast: 'vendedora', talk: [['vendedora', '¡Empanadas solares! Horneadas en horno solar, cero humo.', 'feliz'], ['lia', 'Un bucle es como pedir otra empanada porque todavía tienes hambre...', 'pensando'], ['lia', '...excepto que si olvidas comprobar si sigues teniendo hambre, acabas con cuatro mil empanadas.', 'risa'], ['vendedora', 'Niña, eso es un negocio redondo.', 'risa']] });
  b.e('N', 32, 12, { id: 'trino', cast: 'musico', talk: [['musico', 'Esta canción la compuso AURORA. Dice que es "óptima".', 'n'], ['musico', 'A mí me parece que le falta algo. ¿Un error bonito, quizá?', 'pensando']] });
  b.e('N', 58, 12, { id: 'anzuelo', cast: 'pescador', talk: [['pescador', 'Mi barca va a batería. SI mañana hay sol, la cargo. SI NO, espero.', 'n'], ['pescador', 'No hace falta un superordenador para decidir eso, ¿eh?', 'risa']] });
  b.e('N', 51, 12, { id: 'maiz', cast: 'granjero', talk: [['granjero', 'Traje mi molinito del Valle para el festival. Gira precioso con esta brisa.', 'feliz']] });
  b.e('N', 64, 12, { id: 'lux', cast: 'guardia', talk: [['guardia', 'La central de la profesora Vega tiene la puerta más segura del archipiélago.', 'n'], ['guardia', 'Si se cierra desde dentro, ni un rayo la abre.', 'pensando']] });
  b.e('T', 40, 12, {
    id: 'consola', look: 'bigconsole', verb: 'Activar LUMINA LOOP', enabled: () => flag('fest_vega') && !flag('fest_fail1'), doneFlag: 'fest_fail1',
    lens: '{c}LUMINA_LOOP.exe{/} · llama: {y}AURORA.optimize(){/}',
    run: lv => (function* () {
      yield C.say('lia', 'Bien. Secuencia de arranque. Si el orden está mal, nada funciona.', 'decidida');
      const ok = yield* runPuzzle(CFG_FEST_BOOT);
      if (ok) yield* festivalBlackout(lv);
    })()
  });
  level('festival', {
    theme: 'festival', region: 'puerto', title: 'Festival de las Mil Luces', subtitle: 'Prólogo', noMap: true, lensHint: false, music: 'festival', ambient: 'sea',
    lighthouseOn: lv => !flag('fest_fail1'), intensity: 1, basePower: 1,
    pointAt: lv => !flag('fest_vega') ? 'vega' : 'consola',
    quips: ['¡Mira cuántas luces! Bueno, técnicamente aún no hay mil. Las conté. Hay 987.', 'Si tocas a alguien con E, habla. Es como la magia, pero con diálogos.', 'Estoy tan emocionado que mis alas van a 70 aleteos por segundo.'],
    objective: lv => !flag('fest_vega') ? 'Recorre el festival y habla con la Prof. Vega (→)' : !flag('fest_fail1') ? 'Activa LUMINA LOOP en la consola del escenario' : '',
    hint: lv => !flag('fest_vega') ? 'Vega está al final de la plaza, a la derecha, junto a la central morada.' : 'La consola está a la izquierda del escenario. Acércate y pulsa ' + bindName('interact') + '.',
    init: lv => { if (!flag('fest_fail1')) lv.lumi.hidden = true; if (flag('fest_fail1')) lv.forceDark = 0.55; },
    onEnter: lv => (function* () {
      if (flag('fest_intro')) return;
      setFlag('fest_intro'); setQuest('m_festival', 'active');
      yield C.title('PRÓLOGO', 'El Festival de las Mil Luces', 3, PAL.sun);
      yield* talk([
        ['narrador', 'Archipiélago Aurora. Once islas, siete fuentes de energía y un sistema que lo coordina todo: {c}AURORA{/}.'],
        ['narrador', 'Esta noche todo el archipiélago se iluminará con energía renovable. Y una estudiante presentará su primer algoritmo.'],
        ['teo', '¿Terminaste?', 'n'],
        ['lia', 'Técnicamente.', 'pensando'],
        ['teo', 'Eso significa que no.', 'risa'],
        ['lia', 'Significa que el programa y yo tenemos diferencias filosóficas.', 'n'],
        ['pix', '¡El programa va ganando!', 'risa'],
        ['lia', 'PÍX, no ayudas.', 'enojo'],
        ['pix', 'Estoy ayudando emocionalmente. Es un servicio premium.', 'feliz'],
        ['teo', 'Da una vuelta. La profesora Vega quiere revisar tu código antes de la presentación.', 'n']
      ]);
      Toast.show('← → mover · ' + bindName('jump') + ' saltar · ' + bindName('interact') + ' hablar', PAL.cream, 5);
    })()
  }, b);
})();

// ---------- REGIÓN 00: PUERTO INICIAL ----------
const GRID_ACTS = { avanzar: { label: 'avanzar', arg: 1, options: [1, 2, 3, 4, 5, 6, 7] }, girar_izq: { label: 'girar_izq ↺' }, girar_der: { label: 'girar_der ↻' }, recoger: { label: 'recoger' }, entregar: { label: 'entregar' }, activar: { label: 'activar' }, regar: { label: 'regar' } };
const A = (name, arg, locked) => ({ op: 'act', name, arg, locked: !!locked });
const CFG_PUERTO_ROUTE = {
  kind: 'code', main: true, title: 'Camino de instrucciones', tags: ['SECUENCIA', 'FLUJO'], concepts: ['sequence'], codex: 'secuencia', music: 'puerto',
  palette: ['act:avanzar', 'act:girar_izq', 'act:girar_der', 'act:recoger', 'act:entregar'], actions: GRID_ACTS, numbers: [1, 2, 3, 4, 5],
  world: W_grid({ map: ['########', '#S.c...#', '#....k.#', '#T.....#', '########'], need: { deliver: 1 }, okMsg: '¡El fusible llegó! PÍX lo entregó en la casilla ★.' }),
  stages: [
    { mode: 'demo', label: 'YO TE MUESTRO', text: 'Mira: PÍX ejecuta cada línea EN ORDEN, de arriba abajo. Pulsa EJECUTAR.', world: W_grid({ map: ['#######', '#S.k.T#', '#######'], need: { deliver: 1 }, okMsg: 'Así funciona una secuencia: un paso detrás de otro.' }), program: [A('avanzar', 2, 1), A('recoger', undefined, 1), A('avanzar', 2, 1), A('entregar', undefined, 1)] },
    { mode: 'guided', label: 'LO HACEMOS JUNTOS', text: 'Completa los huecos ▢: arrastra un bloque ENCIMA de cada hueco.', world: W_grid({ map: ['#######', '#S.k..#', '#####.#', '#####T#', '#######'], need: { deliver: 1 }, okMsg: '¡Juntos lo logramos! Ahora te toca sola/solo.' }), program: [A('avanzar', 2, 1), A('recoger', undefined, 1), { op: 'blank', hint: '¿avanzar cuánto?' }, A('girar_der', undefined, 1), A('avanzar', 2, 1), { op: 'blank', hint: '¿y al llegar?' }] },
    { mode: 'solo', label: 'LO HACES TÚ', text: 'Ahora tú. Ojo: la caja bloquea el camino recto. PÍX empieza mirando →.', program: [] }
  ],
  hints: ['¿Hacia dónde mira PÍX al empezar? La flecha amarilla lo indica. ¿Qué hay delante?', { text: 'Primero baja una fila para esquivar la caja: girar_der y avanzar.', highlight: 'palette:act:girar_der' }, { text: 'Te dejo el principio: bajar, girar, avanzar hasta la pieza.', partial: [A('girar_der'), A('avanzar', 1), A('girar_izq'), A('avanzar', 4)] }],
  deep: 'Otra forma de verlo: el diagrama de flujo muestra que cada caja ocurre solo si la anterior terminó bien.',
  intro: 'PÍX llevará el fusible de la casilla amarilla a la ★. Dile EXACTAMENTE qué hacer.', xp: 50
};
const CFG_PUERTO_CHAIN = {
  kind: 'seq', main: true, title: 'El faro: flujo de energía', tags: ['SECUENCIA', 'FLUJO DE ENERGÍA'], concepts: ['sequence', 'storage'], codex: 'flujo_energia', label: 'FARO',
  intro: 'El faro del Puerto funciona con sol... de noche. ¿En qué orden viaja la energía?',
  cards: [
    { id: 'cap', label: 'captar luz solar', icon: 'sun', color: PAL.sun, desc: 'De día, el panel recibe luz.' },
    { id: 'con', label: 'convertir en electricidad', icon: 'bolt', color: PAL.sky, desc: 'Las células fotovoltaicas transforman luz en corriente.' },
    { id: 'alm', label: 'almacenar en batería', icon: 'battery', color: PAL.lime, desc: 'Guardar para usar cuando no hay sol.' },
    { id: 'ali', label: 'alimentar el faro', icon: 'star', color: PAL.orange, desc: 'Por la noche, la batería enciende la luz.' }
  ],
  answer: ['cap', 'con', 'alm', 'ali'],
  why: (i, id) => ({ ali: 'El faro necesita energía que en este paso todavía no existe.', alm: 'No se puede guardar luz en una batería: primero hay que convertirla en electricidad.', con: i === 0 ? '¿Convertir qué? Aún no se ha captado nada.' : 'Esa energía ya estaba convertida.', cap: 'Captar es el primer eslabón: todo empieza en la fuente.' }[id]),
  visual: visualEnergyChain([CHAIN_ICONS.sun, CHAIN_ICONS.panel, CHAIN_ICONS.battery, CHAIN_ICONS.lamp]),
  hints: ['Piensa en el viaje de la energía: ¿de dónde viene?', '¿Puede una batería guardar LUZ directamente?', { text: 'El primer paso es captar. Te lo coloco.', apply: sc => { sc.slots[0] = 'cap'; sc.pool = sc.pool.filter(p => p !== 'cap'); } }],
  okMsg: '¡Fuente → conversión → almacenamiento → uso! El faro tiene energía.', xp: 40
};
const CFG_PUERTO_CARRERA = {
  kind: 'code', title: 'Carrera del algoritmo', tags: ['SECUENCIA', 'PARÁMETROS'], concepts: ['sequence'], codex: 'secuencia',
  palette: ['act:avanzar', 'act:girar_izq', 'act:girar_der'], actions: GRID_ACTS, values: { },
  world: W_grid({ map: ['##########', '#S.......#', '########.#', '########.#', '##########'], need: { at: [8, 3] }, maxLines: 3, okMsg: '¡3 instrucciones! El robot de Nico llega en un suspiro.' }),
  start: [A('avanzar', 1), A('avanzar', 1), A('avanzar', 1), A('avanzar', 1), A('avanzar', 1), A('avanzar', 1), A('avanzar', 1), A('girar_der'), A('avanzar', 1), A('avanzar', 1)],
  intro: 'El programa de Nico funciona, pero tiene 10 líneas. ¿Puedes hacer lo mismo con 3 o menos? (Toca el número de avanzar).',
  hints: ['¿Qué pasa si avanzar recibe un número mayor que 1?', { text: 'Siete "avanzar(1)" seguidos equivalen a un solo avanzar(7).' }, { text: 'Solución parcial:', partial: [A('avanzar', 7), A('girar_der')] }]
};

(function () {
  const b = new MapB(132, 18);
  b.ground(0, 24, 14);
  b.fill(25, 15, 31, 16, '~').ground(25, 31, 17);
  b.fill(26, 11, 30, 11, '?');
  b.ground(32, 58, 14);
  b.vline(40, 7, 13, 'H').plat(37, 39, 7).plat(41, 43, 7).plat(49, 51, 11).plat(53, 55, 9);
  b.fill(59, 15, 64, 16, '~').ground(59, 64, 17);
  b.ground(65, 131, 14);
  b.plat(70, 72, 11).plat(74, 75, 9).plat(84, 86, 11);
  b.fill(93, 0, 93, 13, 'D');
  b.ground(100, 104, 13).ground(105, 108, 12);
  b.start(3, 13);
  b.seeds(33, 37, 13, 2).seeds(49, 51, 10, 1).seeds(53, 55, 8, 1).seeds(70, 72, 10, 1).seeds(84, 86, 10, 1).seeds(110, 116, 13, 3);
  [5, 14, 22, 36, 46, 56, 68, 88, 98, 110, 125].forEach(x => b.e('L', x, 13));
  b.e('C', 34, 13).e('C', 66, 13).e('C', 96, 13);
  b.e('m', 9, 13, { look: 'house', color: '#8B5A3C' }).e('m', 18, 13, { look: 'house', color: '#6A8AC8', roof: '#FF9D42' });
  b.e('m', 28, 15, { look: 'boat', oy: -4, on: () => flag('puerto_z1') }); // amarrado en la dársena, sobre el agua
  b.e('m', 121, 13, { id: 'faro', look: 'lighthouse', on: () => flag('puerto_z2') });
  b.e('a', 22, 13).e('a', 70, 13).e('a', 106, 11);
  b.e('*', 28, 8, { id: 'c_puerto1', hidden: true }).e('*', 40, 4, { id: 'c_puerto2' });
  b.e('M', 59, 12, { len: 2, range: 3, speed: 1, style: 'wood' });
  b.e('N', 11, 13, {
    id: 'teo', cast: 'teo', talk: lv => talk(flag('puerto_teo') ? [['teo', 'El panel de rutas está al fondo del muelle, pasando el agua. Allí te espero.', 'n']] : [['teo', 'Los robots de carga no arrancan sin energía.', 'pensando'], ['teo', 'Pero PÍX puede llevar un fusible a mano... si alguien le dice EXACTAMENTE qué hacer.', 'n'], ['pix', 'Yo sé volar.', 'feliz'], ['teo', 'Eso no es un plan. Es un talento.', 'risa']])
  });
  b.e('N', 50, 13, {
    id: 'nico', cast: 'nico', quest: 's_carrera', talk: lv => (function* () {
      if (questState('s_carrera') === 'done') { yield C.say('nico', '¡Mi robot ahora es el más rápido del muelle! avanzar(7), ¡zas!', 'feliz'); return; }
      if (questState('s_carrera') === 'none') { yield* talk([['nico', '¡Lía! Mi robot de carreras tarda un montón. Mi programa tiene DIEZ líneas.', 'triste'], ['nico', '¿Me ayudas a que sea más corto? El panel está aquí al lado.', 'n']]); setQuest('s_carrera', 'active'); }
      else yield C.say('nico', '¡El panel de carreras está justo aquí! ¡Tres líneas o menos!', 'n');
    })()
  });
  b.e('T', 53, 13, {
    id: 'carrera', look: 'console', color: PAL.pink, verb: 'Programar el robot', enabled: () => questState('s_carrera') === 'active', doneFlag: 'q_carrera',
    run: lv => (function* () { yield* runPuzzle(CFG_PUERTO_CARRERA, function* () { setFlag('q_carrera'); setQuest('s_carrera', 'done'); addMastery('sequence', 5); yield* talk([['nico', '¡UAAAH! ¡Ha llegado antes de que dijera "ya"!', 'risa'], ['pix', 'Lección: un parámetro puede ahorrar muchas líneas repetidas.', 'feliz']]); }); })()
  });
  b.e('N', 78, 13, { id: 'teo2', cast: 'teo', needs: 'puerto_teo', talk: [['teo', 'El panel de rutas: dile a PÍX cada paso. Si falla, la traza te dirá dónde.', 'n']] });
  b.e('T', 81, 13, {
    id: 'rutas', look: 'console', verb: 'Panel de rutas', doneFlag: 'puerto_z1', enabled: () => flag('puerto_teo'),
    lens: '{c}robot_carga{/}: sin energía · {y}PÍX{/} disponible',
    run: lv => (function* () {
      if (flag('puerto_z1')) { yield C.say('pix', 'Ruta completada. Casas iluminadas. Yo, héroe.', 'feliz'); return; }
      yield* talk([['pix', '¡A mis órdenes! Literalmente: solo haré lo que me ordenes.', 'feliz']]);
      yield* runPuzzle(CFG_PUERTO_ROUTE, function* () {
        setFlag('puerto_z1'); lv.updatePower(); AudioSys.sfx('restore'); FX.flash(PAL.sun, 0.4);
        lv.lumi.mood = 'happy'; lv.lumi.moodT = 4; lv.lumi.stay = null;
        yield* teach('secuencia');
        yield* talk([['teo', '¡Las casas de los pescadores tienen luz!', 'feliz'], ['lia', 'Y la compuerta del faro se abrió.', 'feliz'], ['lumi', '✦ ✦ ✦ !', 'n'], ['lia', 'Creo que eso significa "gracias". O "más". Todavía estoy aprendiendo lumi-ñol.', 'risa']]);
      });
    })()
  });
  b.e('T', 101, 12, {
    id: 'eclipse1', look: 'console', color: PAL.violet, verb: 'Leer terminal', doneFlag: 'eclipseMsg1',
    lens: ['mensaje entrante', 'firma: {v}▒▒▒▒▒▒▒{/}', 'hora: 3 s antes del apagón'],
    run: lv => (function* () {
      AudioSys.sfx('eclipse');
      yield* talk([['sistema', 'NO ENCIENDAS TODO.'], ['lia', 'Eso suena exactamente a algo que diría quien está apagándolo todo.', 'enojo'], ['pix', 'O alguien extremadamente comprometido con ahorrar energía.', 'pensando']]);
      if (!flag('eclipseMsg1')) { setFlag('eclipseMsg1'); unlockCodex('m_patron'); yield* talk([['teo', 'Mira la hora del mensaje con tu lente, Lía.', 'pensando'], ['lia', '(F) ...¿Tres segundos ANTES del apagón? Eso no tiene sentido.', 'sorpresa']]); yield* teach('depuracion'); }
    })()
  });
  b.e('T', 114, 13, {
    id: 'control', look: 'bigconsole', verb: 'Control del faro', doneFlag: 'puerto_z2', enabled: () => flag('puerto_z1'),
    lens: 'faro.bateria = {r}0%{/} · panel = {g}OK{/} · orden = {r}???{/}',
    run: lv => (function* () {
      if (flag('restored_puerto')) { yield C.say('pix', 'El faro brilla. Sigue brillando. Lo he comprobado 14 veces.', 'feliz'); return; }
      yield* runPuzzle(CFG_PUERTO_CHAIN, function* () {
        setFlag('puerto_z2'); lv.updatePower();
        yield camTo(lv, lv.get('faro').x + 16, lv.get('faro').y + 40); yield C.wait(1.2);
        yield* teach('flujo_energia');
        yield* restoreRegion(lv, 'puerto', 'Fuente → conversión → almacenamiento → uso.');
        yield camFree(lv);
        yield* talk([
          ['teo', 'Una de once.', 'feliz'],
          ['aurora', '...OPTIMIZAR... OPTIMIZ... AR...', 'n'],
          ['pix', '¿Oíste eso? AURORA habla en bucle.', 'sorpresa'],
          ['lia', 'Está atascada en algo. Sigamos: cuanta más red encendamos, más cerca estaremos de la central.', 'decidida']
        ]);
        setQuest('m_valle', 'active');
      });
    })()
  });
  b.e('X', 129, 13, { cond: () => flag('restored_puerto'), label: 'MAPA', blocked: () => talk([['pix', 'Antes de irnos: el faro sigue apagado. Y los barcos lo necesitan.', 'pensando']]) });
  level('puerto', {
    theme: 'puerto', region: 'puerto', title: 'Puerto Inicial', subtitle: 'Secuencia + flujo de energía', lensHint: true,
    zones: [{ x0: 0, x1: 93, flag: 'puerto_z1' }, { x0: 93, x1: 132, flag: 'puerto_z2' }],
    dyn: { D: { solid: () => !flag('puerto_z1'), style: 'gate' } },
    quips: ['Estado del Puerto: 0% luz, 100% drama.', 'Si ves un "?" sobre algo, es interactivo. Yo soy interactivo siempre.', 'Un algoritmo es como una receta. Excepto que las recetas no se cuelgan.', '¿Has probado la Lente (F)? Las cosas ocultas odian que las miren.'],
    objective: lv => !flag('puerto_intro2') ? 'Explora el muelle (→)' : !flag('puerto_z1') ? 'Llega al panel de rutas y programa a PÍX' : !flag('puerto_z2') ? 'Enciende el faro (al final del muelle)' : 'Vuelve al mapa (→ salida)',
    hint: lv => !flag('puerto_z1') ? 'El panel de rutas está pasando el agua. Puedes nadar (' + bindName('jump') + ' repetido) o buscar plataformas ocultas con la Lente (F).' : !flag('puerto_z2') ? 'La compuerta ya se abrió. El control del faro está al final.' : 'La salida está a la derecha del todo.',
    pointAt: lv => !flag('puerto_z1') ? 'rutas' : 'control',
    triggers: [
      { x: 7, w: 2, flag: 'puerto_lens', run: lv => (function* () { yield* talk([['pix', 'Lía, ¿tus gafas raras funcionan sin la red?', 'n'], ['lia', 'Son GAFAS DEBUG, no gafas raras. Y tienen batería propia.', 'enojo']]); yield* grant('lens'); yield* talk([['lia', 'Con la lente veo variables, estados... y cosas que no quieren ser vistas.', 'decidida'], ['pix', 'Pulsa ' + bindName('lens') + '. Prueba sobre el agua de allí delante.', 'n']]); })() },
      { x: 88, w: 3, flag: 'puerto_lumi', cond: () => !flag('puerto_z1'), run: lv => (function* () { lv.lumi.stay = { x: tx(14), y: tx(10) }; yield C.wait(1); yield* talk([['pix', 'Eh... Lumi no nos sigue.', 'sorpresa'], ['lia', 'Está junto a las casas de los pescadores. Siguen a oscuras.', 'triste'], ['lia', 'Tienes razón, Lumi. No los dejamos así. Primero su luz.', 'decidida']]); })() }
    ],
    onEnter: lv => (function* () {
      if (flag('puerto_intro2')) return;
      setFlag('puerto_intro2'); setQuest('m_puerto', 'active'); unlockCodex('i_puerto');
      yield* talk([
        ['pix', 'Estado del Puerto: 0% luz, 100% drama.', 'pensando'],
        ['teo', 'Faros, muelles, casas... todo desconectado.', 'triste'],
        ['lia', 'Si Vega desapareció en la central, AURORA tiene que saber algo. Pero primero: luz.', 'decidida'],
        ['lumi', '· · ✦', 'n'],
        ['lia', 'Tranquila, Lumi. Vamos a encenderlo todo. Paso a paso.', 'n'],
        ['teo', 'Voy a revisar el panel de rutas al fondo del muelle. Te espero allí.', 'n']
      ]);
      setFlag('puerto_teo');
      const teo = lv.get('teo'); teo.walkTo(tx(26), 90);
      yield C.wait(1.5); teo.gone = true;
    })()
  }, b);
})();
