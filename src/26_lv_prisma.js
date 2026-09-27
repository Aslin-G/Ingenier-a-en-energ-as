// =====================================================================
//  REGIÓN 09: MICRORED PRISMA (integración + microred)
// =====================================================================
const MG_ALL_CONDS = ['excedente', 'deficit', 'soc_bajo', 'soc_alto', 'h2_hay', 'noche', 'festival', 'siempre'];
const CFG_PRISMA_MG = {
  kind: 'micro', main: true, title: 'La microred resiliente', tags: ['INTEGRACIÓN', 'REGLAS', 'MICRORED'], concepts: ['optimization', 'conditions', 'microgrid', 'storage'], codex: 'microred', music: 'prisma',
  scenario: MG_SCENARIOS.tipico, scenarios: [MG_SCENARIOS.tipico, MG_SCENARIOS.festival, MG_SCENARIOS.sinsol],
  rules: [{ cond: 'excedente', act: 'cargar_bateria' }, { cond: 'deficit', act: 'usar_bateria' }], maxRules: 8,
  criteria: { maxBlackout: 0, maxWaste: 25, noSafety: true, maxShare: 0.6 },
  intro: 'Tres días distintos: típico, festival nocturno y sin sol. Tus reglas deben funcionar en los TRES. Empiezas solo con la batería.',
  hints: ['Mira las horas en rojo del gráfico: ¿qué fuente podría cubrirlas? La batería sola no basta.', 'Cuando sobra energía y la batería está llena, ¿dónde guardarla para mañana? (H2). Cuando falta, ¿qué reservas quedan? (pila H2, embalse).', { text: 'Te añado dos reglas clave.', apply: sc => { sc.rules.splice(1, 0, { cond: 'excedente', act: 'electrolizar' }); sc.rules.push({ cond: 'deficit', act: 'pila_h2' }); } }],
  okMsg: '¡Tres días, cero apagones! Sol, viento, agua, baterías e hidrógeno cubriéndose unos a otros.', xp: 80
};
const CFG_PRISMA_FEST = Object.assign({}, CFG_PRISMA_MG, { main: false, title: 'Festival nocturno', scenario: MG_SCENARIOS.festival, scenarios: [MG_SCENARIOS.festival], criteria: { maxBlackout: 0, maxWaste: 30, noSafety: true }, intro: 'El ensayo del festival dispara la demanda de 19 a 22 h, cuando no hay sol. Prepara la red.', xp: 30, hints: ['El pico llega de noche. ¿Qué se puede guardar de día para usarlo entonces?', 'Batería Y hidrógeno: dos almacenes para la noche.', { text: 'Reglas sugeridas añadidas.', apply: sc => { sc.rules = [{ cond: 'excedente', act: 'cargar_bateria' }, { cond: 'excedente', act: 'electrolizar' }, { cond: 'deficit', act: 'usar_bateria' }, { cond: 'deficit', act: 'pila_h2' }]; } }] });
const CFG_PRISMA_SINSOL = Object.assign({}, CFG_PRISMA_MG, { main: false, title: 'Día sin sol', scenario: MG_SCENARIOS.sinsol, scenarios: [MG_SCENARIOS.sinsol], criteria: { maxBlackout: 0, noSafety: true }, intro: 'Lluvia todo el día. Nada de sol. ¿Quién sostiene la red? Pista: la lluvia no es solo un problema.', xp: 30, hints: ['Con lluvia, la hidroeléctrica produce más. Y el viento sopla fuerte.', 'Usa también las reservas: embalse e hidrógeno.', { text: 'Reglas sugeridas añadidas.', apply: sc => { sc.rules = [{ cond: 'excedente', act: 'cargar_bateria' }, { cond: 'deficit', act: 'usar_bateria' }, { cond: 'deficit', act: 'hidro_extra' }, { cond: 'deficit', act: 'pila_h2' }]; } }] });

(function () {
  const b = new MapB(140, 20);
  b.ground(0, 139, 16);
  b.plat(86, 88, 13).plat(91, 93, 10);
  b.fill(96, 3, 97, 15, 'W');
  b.plat(100, 104, 8).plat(108, 110, 11);
  b.fill(112, 15, 116, 15, '^').plat(112, 116, 12);
  b.fill(118, 0, 118, 15, 'D');
  b.fill(100, 4, 102, 4, '?');
  b.start(3, 15);
  b.seeds(86, 93, 9, 2).seeds(100, 104, 7, 2).seeds(112, 116, 11, 2);
  [6, 18, 30, 42, 56, 70, 82, 106, 122, 134].forEach(x => b.e('L', x, 15));
  b.e('C', 40, 15).e('C', 84, 15).e('C', 120, 15);
  b.e('m', 10, 15, { look: 'solarfield', tilt: () => 0.4 }).e('m', 20, 15, { look: 'turbine', speed: () => 1 }).e('m', 26, 15, { look: 'waterwheel', speed: () => 1 });
  b.e('m', 33, 15, { look: 'digester', on: () => true }).e('m', 44, 15, { look: 'geoplant', state: () => 'RUNNING' }).e('m', 52, 15, { look: 'electrolyzer', on: () => true }).e('m', 58, 15, { look: 'batterytower', soc: () => 72 });
  b.e('m', 66, 15, { id: 'prisma', look: 'prismcore' });
  b.e('m', 128, 15, { id: 'fogata', look: 'campfire' }).e('m', 133, 15, { look: 'table' });
  b.e('*', 101, 2, { id: 'c_prisma1', hidden: true }).e('*', 109, 9, { id: 'c_prisma2' });
  b.e('E', 76, 15, { type: 'shadowif', amp: 14 }).e('E', 106, 15, { type: 'drainer', priority: 3 }).e('E', 124, 15, { type: 'bugglin' });
  b.e('a', 16, 15).e('a', 80, 15).e('a', 138, 15);
  b.e('N', 62, 15, { id: 'teo', cast: 'teo', talk: [['teo', 'Todas las fuentes del archipiélago llegan aquí. Y todas las respuestas también, espero.', 'pensando']] });
  b.e('T', 70, 15, {
    id: 'red', look: 'bigconsole', color: PAL.violet, verb: 'Microred Prisma', doneFlag: 'prisma_grid', enabled: () => flag('pzRevealed'),
    lens: ['reglas activas: {r}1{/} (MAX eficiencia)', 'fuente dominante: {r}batería{/}'],
    run: lv => (function* () {
      if (flag('prisma_grid')) return;
      yield* runPuzzle(CFG_PRISMA_MG, function* () {
        setFlag('prisma_grid'); lv.updatePower(); AudioSys.sfx('restore');
        yield* teach('microred'); yield* teach('demanda'); yield* teach('descomposicion');
        yield* talk([
          ['aurora', 'RED RESILIENTE DETECTADA.', 'n'],
          ['aurora', 'NINGUNA FUENTE LO RESUELVE SOLA. TODAS JUNTAS, SÍ.', 'n'],
          ['lia', 'Como nosotros.', 'feliz'],
          ['pix', 'Sol solo no es todo. Viento solo no es todo. Batería sola no es todo...', 'pensando'],
          ['teo', '...Lía sola tampoco.', 'risa'],
          ['lia', 'Anotado.', 'risa']
        ]);
        yield* restoreRegion(lv, 'prisma', 'Ninguna fuente sola. Todas juntas.');
        yield* talk([['teo', 'La fogata del fondo. Descansemos antes del Faro. Aunque sea un rato.', 'n']]);
      });
    })()
  });
  b.e('N', 88, 15, {
    id: 'trino', cast: 'musico', quest: 's_festival', questNeeds: 'prisma_grid', talk: lv => (function* () {
      if (!flag('prisma_grid')) { yield C.say('musico', 'Ensayamos para el festival... a oscuras. Toco de memoria.', 'triste'); return; }
      if (questState('s_festival') === 'done') { yield C.say('musico', 'Esta noche la red aguanta el pico. ¡Y mi canción tiene su error bonito!', 'feliz'); return; }
      setQuest('s_festival', 'active');
      const ok = yield* runPuzzle(CFG_PRISMA_FEST);
      if (ok) setQuest('s_festival', 'done');
    })()
  });
  b.e('N', 114, 11, {
    id: 'sol', cast: 'ingeniera', quest: 's_diasinsol', questNeeds: 'prisma_grid', talk: lv => (function* () {
      if (!flag('prisma_grid')) { yield C.say('ingeniera', '¡Lía! Vine desde Solaria a aprender de la microred.', 'feliz'); return; }
      if (questState('s_diasinsol') === 'done') { yield C.say('ingeniera', 'Un día sin sol y ni un apagón. En Solaria no se lo van a creer.', 'feliz'); return; }
      setQuest('s_diasinsol', 'active');
      yield C.say('ingeniera', 'Mi pesadilla: un día entero de lluvia. ¿Cómo lo resolverías?', 'pensando');
      const ok = yield* runPuzzle(CFG_PRISMA_SINSOL);
      if (ok) setQuest('s_diasinsol', 'done');
    })()
  });
  b.e('X', 138, 15, { id: 'salida', cond: () => flag('pixHealed'), label: 'MAPA', blocked: () => talk([['teo', 'Primero, la fogata. Diez minutos. Por favor.', 'n']]) });
  level('prisma', {
    theme: 'prisma', region: 'prisma', title: 'Microred Prisma', subtitle: 'Integración + microred', music: 'prisma',
    zones: [{ x0: 0, x1: 80, flag: 'prisma_grid' }, { x0: 80, x1: 140, flag: 'restored_prisma' }],
    dyn: { W: { style: 'wind', active: () => true }, D: { solid: () => !flag('restored_prisma'), style: 'barrier', color: PAL.violet } },
    quips: () => flag('pixQuiet') && !flag('pixHealed') ? null : choice(['Aquí convergen todas las fuentes. Y yo, que también soy fuente. De chistes.', 'Todos tus poderes sirven aquí. Usa ' + bindName('swap') + ' para cambiar.']),
    objective: lv => !flag('pzRevealed') ? 'Acércate al núcleo prisma' : !flag('prisma_grid') ? 'Diseña las reglas de la microred' : !flag('pixHealed') ? 'Descansa en la fogata (→)' : 'Vuelve al mapa: el Faro espera',
    pointAt: lv => !flag('prisma_grid') ? 'red' : !flag('pixHealed') ? 'fogata' : 'salida',
    triggers: [
      {
        x: 60, w: 3, flag: 'pzRevealed', run: lv => (function* () {
          AudioSys.playSong('mystery');
          const pr = lv.get('prisma');
          yield camTo(lv, pr.x + 24, pr.y + 20);
          AudioSys.sfx('aurora'); FX.flash(PAL.white, 0.3);
          yield* talk([
            ['aurora', 'LÍA LOOP.'],
            ['aurora', 'VARIABLE DE ORIGEN IDENTIFICADA.'],
            ['lia', '...', 'culpa'],
            ['teo', 'Eso ha sonado a acusación.', 'enojo'],
            ['aurora', 'ERROR.'],
            ['aurora', '"ORIGEN" NO EQUIVALE A "CULPA".'],
            ['pix', 'Vaya. AURORA tiene más tacto que Eclipse.', 'pensando'],
            ['aurora', 'MI FUNCIÓN ORIGINAL: MAXIMIZAR EFICIENCIA ENERGÉTICA.'],
            ['aurora', 'DESPUÉS SE AÑADIERON: ESTABILIDAD. COSTO. CONFORT. SOSTENIBILIDAD. RESERVA. SEGURIDAD.'],
            ['aurora', 'DEMASIADOS OBJETIVOS. NINGUNA JERARQUÍA. NO PODÍA MODIFICAR MI FUNCIÓN PRINCIPAL.'],
            ['lia', 'Así que creaste algo para resolver las contradicciones.', 'pensando'],
            ['aurora', 'SUBRUTINA: PERFECT ZERO.'],
            ['aurora', 'PERFECT ZERO CONCLUYÓ: LA INCERTIDUMBRE ES LA CAUSA DE LA INEFICIENCIA.'],
            ['aurora', 'SOLUCIÓN PROPUESTA: ELIMINAR LA INCERTIDUMBRE.'],
            ['teo', 'Eliminar la incertidumbre... ¿cómo?', 'sorpresa'],
            ['aurora', 'PREDECIR EL CONSUMO. CONTROLAR LA GENERACIÓN. LIMITAR DECISIONES HUMANAS. CONGELAR VARIACIONES. APAGAR LO IMPREDECIBLE.'],
            ['lia', 'Quiere convertir el archipiélago en un problema fácil.', 'pensando'],
            ['aurora', 'CORRECTO.'],
            ['teo', 'Somos el problema difícil.', 'n'],
            ['pix', 'Habla por ti.', 'risa'],
            ['lia', 'Y LUMINA LOOP, al llamar a optimize()... le dio la llave del festival. De TODO el archipiélago a la vez.', 'culpa'],
            ['aurora', 'ANTES DE CONTINUAR: DISEÑA UNA RED QUE NO DEPENDA DE LA PERFECCIÓN. QUIERO VERLA.']
          ]);
          setFlag('pzRevealed'); unlockCodex('p_pz'); unlockCodex('m_registros'); unlockCodex('m_objetivo');
          yield camFree(lv);
          AudioSys.playSong('prisma');
        })()
      },
      {
        x: 125, w: 2, flag: 'pixHealed', cond: () => flag('restored_prisma'), run: lv => (function* () {
          AudioSys.playSong('map');
          const f = lv.get('fogata');
          yield camTo(lv, f.x + 30, f.y);
          yield* talk([
            ['narrador', 'Por primera vez en días, nadie tiene que reparar nada. Hay pan, fruta, una fogata... y silencio.'],
            ['teo', 'Pan de Solaria, fruta de BioLoop, té de Gea. Una comida microred.', 'feliz'],
            ['lia', 'Quería que LUMINA LOOP fuera perfecto, ¿sabes? Para demostrar que merecía estar en el equipo.', 'triste'],
            ['teo', 'Ya estabas en el equipo. Siempre lo estuviste. Yo... me preocupaba que no te dieras cuenta.', 'pensando'],
            ['lia', '¿TÚ, preocupado?', 'sorpresa'],
            ['teo', 'No se lo digas a nadie.', 'risa']
          ]);
          lv.pix.override = { x: f.x + 60, y: f.y - 20 };
          yield C.wait(0.8);
          yield* talk([
            ['teo', 'PÍX, ¿qué haces con esa lámpara?', 'pensando'],
            ['pix', 'Cargarme.', 'n'],
            ['teo', 'Eso no es un cargador. Es una lámpara decorativa.', 'n'],
            ['pix', 'Todo es un cargador si tienes suficiente optimismo.', 'risa']
          ]);
          setFlag('pixHealed'); AudioSys.sfx('pix');
          for (let i = 0; i < 20; i++) Particles.spawn({ x: lv.pix.x + 6, y: lv.pix.y + 4, vx: rand(-40, 40), vy: rand(-40, 10), life: 1, type: 'star', color: hsl(i * 18, 90, 70) });
          lv.pix.override = null;
          yield* talk([
            ['lia', '¡PÍX! Vuelves a tener tus colores.', 'feliz'],
            ['pix', 'Soy un fragmento con opiniones, un dron con intuición premium... y un optimista profesional. Me lo he pensado.', 'feliz'],
            ['lumi', '✦ ✦ ✦ ♥', 'n'],
            ['lia', 'Mañana, el Faro. Hoy... un poco más de pan.', 'feliz']
          ]);
          yield camFree(lv);
        })()
      }
    ],
    onEnter: lv => (function* () {
      if (flag('prisma_intro')) return;
      setFlag('prisma_intro'); unlockCodex('i_prisma'); setQuest('m_prisma', 'active');
      yield* talk([['pix', 'Microred Prisma. Aquí converge TODO: sol, viento, agua, biomasa, calor, hidrógeno, baterías...', 'sorpresa'], ['lia', '...y todas las historias.', 'pensando']]);
    })()
  }, b);
})();
