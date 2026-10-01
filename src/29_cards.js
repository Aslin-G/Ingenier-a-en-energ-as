// =====================================================================
//  CARTAS DEL ATLAS: repaso espaciado (sistema de Leitner) + reto del día
//  Cada concepto que Lía practica se convierte en una carta coleccionable.
//  Recordar una idea justo cuando empieza a olvidarse la fija mucho mejor
//  que repetirla seguida (efecto de espaciado y de recuperación): cada
//  acierto sube la carta de nivel y aleja su próximo repaso; cada fallo la
//  acerca. Las cartas de programación usan preguntas de traza generadas
//  (infinitas variantes); las de energía, un banco de preguntas con su
//  explicación. El reto del día es el mismo para toda la clase.
// =====================================================================

// intervalos de repaso por nivel (0 = nueva … 5 = dominada)
const CARD_INT = [0, 10 * 60e3, 24 * 3600e3, 3 * 24 * 3600e3, 7 * 24 * 3600e3, 21 * 24 * 3600e3];
const CARD_LEVELS = ['NUEVA', 'BRONCE I', 'BRONCE II', 'PLATA I', 'PLATA II', 'ORO'];
const CARD_COLS = ['#8C93B8', '#C8844A', '#E09A5A', '#C9D2F0', '#E8EEFF', '#FFD84A'];

// preguntas de opción múltiple: [pregunta, correcta, [[incorrecta, por qué], ...], explicación, código opcional]
const MQ = (ask, ok, wrong, ex, code) => ({ ask, ok, wrong, ex, code });
const CARD_BANK = {
  debugging: [
    MQ('Queríamos 15 y da 5. ¿Dónde está el error?', 'Línea 3: debería ser total ← total + 5', [['Línea 1: total debe empezar en 5', 'Si empieza en 5 daría 20; el problema es que cada vuelta REEMPLAZA total.'], ['Línea 2: hay que repetir 15 veces', 'Tres vueltas bastan si cada una SUMA 5.']], 'total ← 5 guarda 5 en cada vuelta; para acumular hay que usar el valor anterior.', ['total ← {y}0{/}', '{c}REPETIR{/} {y}3{/} {c}VECES{/}', '  total ← {y}5{/}', '{c}FIN REPETIR{/}']),
    MQ('La alarma debía sonar con batería BAJA. ¿Qué falla?', 'La condición está invertida: debería ser bateria < 20', [['Falta un bucle REPETIR', 'No hace falta repetir: la decisión es una sola.'], ['La variable se llama mal', 'El nombre está bien; el signo > hace justo lo contrario.']], 'Una condición invertida hace lo opuesto a lo que queríamos: > y < no son intercambiables.', ['{c}SI{/} bateria > {y}20{/} {c}ENTONCES{/}', '  sonar_alarma', '{c}FIN SI{/}']),
    MQ('¿Qué pasa al ejecutar este programa?', 'Error: la lista no tiene posición [3]', [['x vale 9', 'El 9 está en [2]: los índices van de 0 a 2.'], ['x vale 3', '[0] es el primero; [3] no existe en una lista de 3 elementos.']], 'En una lista de 3 elementos los índices válidos son 0, 1 y 2.', ['lista ← [{y}3{/}, {y}6{/}, {y}9{/}]', 'x ← lista[{y}3{/}]']),
    MQ('¿Qué problema tiene este bucle?', 'Nada cambia temp: puede no terminar nunca', [['Ninguno: se detiene solo', 'Solo se detiene si temp llega a ≤ 50, y dentro nada la cambia.'], ['Le falta un SINO', 'Los bucles no usan SINO; lo que falta es una salida.']], 'Un MIENTRAS necesita que algo dentro del bucle acerque la condición a FALSO.', ['{c}MIENTRAS{/} temp > {y}50{/} {c}HACER{/}', '  encender_ventilador', '{c}FIN MIENTRAS{/}']),
    MQ('¿Cuál es la mejor forma de depurar?', 'Formular una hipótesis y probarla paso a paso', [['Cambiar cosas al azar hasta que funcione', 'Puede funcionar por suerte, pero no sabrás por qué ni evitarás el error la próxima vez.'], ['Borrar todo y empezar de cero', 'Casi siempre el error está en una línea; primero hay que encontrarla.']], 'Depurar es comparar lo que el programa DEBÍA hacer con lo que HIZO, paso a paso.'),
    MQ('El robot debía recoger y luego entregar, pero falla. ¿Por qué?', 'Los pasos 2 y 3 están en orden invertido', [['Falta avanzar al final', 'El problema está antes: entrega sin haber recogido.'], ['Hay que repetir recoger', 'Una vez basta, si ocurre ANTES de entregar.']], 'En una secuencia el orden importa: entregar antes de recoger no tiene sentido.', ['avanzar', 'entregar', 'recoger'])
  ],
  solar: [
    MQ('¿De qué depende sobre todo la energía de un panel solar?', 'De la radiación que recibe (W/m²)', [['De la temperatura: con más calor produce más', 'El calor en realidad baja un poco su eficiencia; lo decisivo es la radiación.'], ['Del tamaño de la batería', 'La batería guarda energía, no la produce.']], 'Más radiación sobre el panel = más electricidad.'),
    MQ('Un panel de 1 m² recibe 800 W/m² y convierte el 20 %. ¿Cuánta potencia da?', '160 W', [['800 W', 'Ningún panel convierte toda la radiación: aquí solo el 20 %.'], ['40 W', 'El 20 % de 800 es 160 (800 × 0,2).']], 'Potencia = radiación × área × eficiencia = 800 × 1 × 0,2 = 160 W.'),
    MQ('Pasa una nube sobre el campo solar. ¿Qué ocurre?', 'Produce menos porque baja la radiación', [['Sigue igual: el panel guarda la luz', 'Un panel no almacena energía; para eso hace falta una batería.'], ['Se apaga y hay que reiniciarlo', 'Vuelve a producir en cuanto aumenta la radiación.']], 'La solar es variable: depende del clima y de la hora.'),
    MQ('¿Por qué una ciudad solar necesita baterías o red?', 'Porque de noche no hay sol y la demanda sigue', [['Porque los paneles se gastan de día', 'Los paneles duran muchos años; el problema es el horario.'], ['Porque el sol da corriente peligrosa', 'La corriente se adapta con un inversor; el problema es cuándo se produce.']], 'Generación y consumo no ocurren a la misma hora: hay que guardar o compartir energía.'),
    MQ('Un panel bien orientado hacia el sol...', 'recibe más radiación que uno mal orientado', [['recibe lo mismo, da igual la posición', 'La inclinación cambia cuánta luz llega por metro cuadrado.'], ['se calienta y produce el doble', 'Calentarse no ayuda; lo que ayuda es captar más luz.']], 'Orientar e inclinar los paneles aumenta la radiación captada.')
  ],
  wind: [
    MQ('Si la velocidad del viento se duplica, la potencia de la turbina...', 'se multiplica por 8 (depende de v³)', [['se duplica', 'La potencia crece con el cubo de la velocidad: 2³ = 8.'], ['no cambia', 'Más viento lleva mucha más energía.']], 'La potencia crece con v³: pequeños cambios de viento dan grandes cambios de potencia.'),
    MQ('¿Por qué una turbina se frena con vientos muy fuertes?', 'Para protegerse: tiene una velocidad máxima segura', [['Porque el viento fuerte no tiene energía', 'Tiene muchísima; justamente por eso puede dañarla.'], ['Para ahorrar energía para después', 'No la guarda: se protege para no romperse.']], 'Las turbinas operan entre una velocidad mínima de arranque y una máxima de seguridad.'),
    MQ('¿Qué convierte una turbina eólica?', 'La energía cinética del viento en electricidad', [['El calor del aire en electricidad', 'Usa el movimiento del aire, no su temperatura.'], ['La luz en movimiento', 'Eso sería otra tecnología; la eólica usa el viento.']], 'Viento → giro del rotor → generador → electricidad.'),
    MQ('La eólica es variable porque...', 'el viento cambia de un momento a otro', [['las aspas se cansan', 'Las aspas no se cansan; el recurso (viento) es el que varía.'], ['solo funciona de noche', 'Funciona de día y de noche si hay viento.']], 'Por eso se combina con otras fuentes y con almacenamiento.'),
    MQ('¿Dónde suele haber buen viento para turbinas?', 'En costas, zonas altas y mar abierto', [['Dentro de bosques densos', 'Los árboles frenan el viento y crean turbulencias.'], ['En valles cerrados', 'Suelen tener poco viento constante.']], 'Se buscan lugares con viento fuerte y estable.')
  ],
  hydro: [
    MQ('La potencia de una central hidráulica depende sobre todo de...', 'el caudal y la altura del salto', [['el color del agua', 'El color no importa; importa cuánta agua cae y desde qué altura.'], ['la temperatura del río', 'La temperatura casi no influye; cuentan caudal y altura.']], 'P ≈ caudal × altura × g × rendimiento.'),
    MQ('Mismo caudal, pero el agua cae desde el doble de altura. La potencia...', 'aproximadamente se duplica', [['se reduce a la mitad', 'Más altura = más energía por cada litro que cae.'], ['no cambia', 'La altura multiplica la potencia.']], 'La potencia es proporcional a la altura del salto.'),
    MQ('¿Qué es una central de bombeo?', 'Sube agua cuando sobra energía y la turbina cuando falta', [['Una fuente que crea agua', 'No crea agua: la mueve entre dos embalses.'], ['Una turbina que funciona sin agua', 'Siempre necesita agua; es una forma de almacenar energía.']], 'Funciona como una gran batería de agua.'),
    MQ('Una sequía afecta a la hidroeléctrica porque...', 'baja el caudal disponible', [['el agua pesa más', 'El agua no cambia de peso; hay menos agua.'], ['no la afecta', 'Sin agua no hay potencia.']], 'La hidro depende de las lluvias y del caudal de los ríos.'),
    MQ('Un impacto de las grandes presas es que...', 'cambian el ecosistema del río', [['producen humo', 'No queman nada; su impacto es sobre el río y el territorio.'], ['consumen gasolina', 'No usan combustibles para generar.']], 'Renovable no significa impacto cero: hay que evaluar cada proyecto.')
  ],
  biomass: [
    MQ('¿Qué produce un biodigestor?', 'Biogás (sobre todo metano) y abono', [['Hidrógeno puro', 'El producto principal es metano; el hidrógeno se obtiene de otra forma.'], ['Electricidad directamente', 'Primero da biogás; luego el biogás puede quemarse para generar electricidad.']], 'Bacterias descomponen residuos sin oxígeno y liberan biogás.'),
    MQ('¿Qué residuo va al biodigestor?', 'Cáscaras y restos de comida', [['Botellas de plástico', 'Las bacterias no pueden digerir el plástico: lo daña.'], ['Latas de aluminio', 'El metal no se descompone: va a reciclaje.']], 'Solo la materia orgánica sirve para hacer biogás.'),
    MQ('La biomasa es renovable si...', 'se repone al ritmo que se usa', [['se quema lo más rápido posible', 'Si se usa más rápido de lo que se repone, se agota.'], ['viene del petróleo', 'El petróleo es fósil: tardó millones de años en formarse.']], 'Renovable = el recurso se regenera en tiempos humanos.'),
    MQ('¿Por qué separar los residuos antes del biodigestor?', 'Los inorgánicos no se digieren y lo estropean', [['Por estética', 'Es una cuestión técnica: el proceso necesita solo materia orgánica.'], ['Para que pese más', 'El peso no mejora el biogás.']], 'Clasificar bien es parte del algoritmo del biodigestor.'),
    MQ('El biogás se puede usar para...', 'cocinar, calentar o generar electricidad', [['solo para inflar globos', 'Es un combustible útil para muchas cosas.'], ['nada útil', 'Es energía aprovechable, como el gas natural pero renovable.']], 'Es un combustible renovable versátil.')
  ],
  geothermal: [
    MQ('La geotermia aprovecha...', 'el calor del interior de la Tierra', [['la luz de la Luna', 'La geotermia usa calor subterráneo.'], ['el viento de las cuevas', 'No es viento: es calor.']], 'Ese calor calienta agua y produce vapor.'),
    MQ('¿Por qué la geotermia es tan estable?', 'El calor interno no depende del clima ni de la hora', [['Porque llueve mucho', 'La lluvia no es la fuente; el calor del subsuelo sí.'], ['Porque solo funciona en invierno', 'Funciona todo el año.']], 'Es una de las pocas renovables disponibles las 24 horas.'),
    MQ('Una planta geotérmica suele...', 'usar vapor o agua caliente para mover una turbina', [['quemar carbón', 'No quema nada: el calor viene de la Tierra.'], ['usar paneles solares', 'Eso es energía solar.']], 'Calor → vapor → turbina → generador.'),
    MQ('Una limitación de la geotermia es que...', 'solo es práctica donde el calor es accesible', [['se acaba en un día', 'El calor terrestre dura muchísimo si se gestiona bien.'], ['funciona igual en cualquier lugar', 'Depende mucho de la geología de cada zona.']], 'Las zonas volcánicas o con agua caliente son las más adecuadas.'),
    MQ('¿Por qué una planta geotérmica usa estados (ARRANQUE, GENERA, FALLO)?', 'Para no pasar a una situación peligrosa sin control', [['Para que el vapor vaya más rápido', 'Los estados no cambian la física del vapor: ordenan las transiciones seguras.'], ['Por decoración en la pantalla', 'Son la lógica de seguridad del sistema.']], 'Una máquina de estados solo permite transiciones válidas.')
  ],
  hydrogen: [
    MQ('El hidrógeno verde es...', 'un vector: transporta energía producida con renovables', [['una fuente que sale del mar lista para usar', 'Hay que fabricarlo por electrólisis: no está libre en la naturaleza.'], ['un combustible fósil', 'El verde se produce con electricidad renovable.']], 'Guarda y transporta energía que antes se generó.'),
    MQ('¿Cómo se obtiene hidrógeno verde?', 'Electrolizando agua con electricidad renovable', [['Quemando gas natural', 'Así se obtiene hidrógeno «gris», con emisiones.'], ['Filtrando el aire', 'El aire casi no tiene hidrógeno libre.']], 'Electrólisis: la electricidad separa el agua en hidrógeno y oxígeno.'),
    MQ('Electricidad → hidrógeno → electricidad...', 'pierde parte de la energía en cada paso', [['gana energía', 'Ningún proceso crea energía de la nada.'], ['no pierde nada', 'Cada conversión tiene pérdidas.']], 'Por eso el hidrógeno se usa donde sus ventajas compensan las pérdidas.'),
    MQ('¿Para qué es útil el hidrógeno?', 'Guardar energía mucho tiempo o mover vehículos pesados', [['Iluminar sin energía', 'Siempre hace falta energía para producirlo.'], ['Reemplazar el agua potable', 'No tiene nada que ver con el agua para beber.']], 'Es útil donde las baterías se quedan cortas.'),
    MQ('En una pila de combustible, el hidrógeno produce...', 'electricidad y agua', [['humo negro', 'No hay combustión: solo sale agua.'], ['petróleo', 'No se forma petróleo.']], 'Hidrógeno + oxígeno → electricidad + agua.')
  ],
  storage: [
    MQ('¿Qué significa el SOC de una batería?', 'Su estado de carga: cuánto le queda (en %)', [['Su velocidad', 'Las baterías no tienen velocidad: SOC es el nivel de carga.'], ['Su temperatura', 'La temperatura se mide aparte.']], 'SOC = State Of Charge (estado de carga).'),
    MQ('¿Por qué conviene dejar una reserva en la batería?', 'Para emergencias y para no dañarla', [['Porque las baterías llenas explotan', 'Una batería bien gestionada no explota; la reserva es por seguridad y vida útil.'], ['Para que pese menos', 'El peso no cambia con la carga.']], 'La reserva cubre imprevistos y alarga la vida de la batería.'),
    MQ('Una batería de 10 kWh está al 60 %. ¿Cuánta energía tiene?', '6 kWh', [['60 kWh', 'El 60 % de 10 es 6, no 60.'], ['4 kWh', 'Eso es lo que le falta para llenarse.']], 'Energía = capacidad × SOC = 10 × 0,6 = 6 kWh.'),
    MQ('El almacenamiento ayuda a las renovables porque...', 'guarda energía cuando sobra y la entrega cuando falta', [['crea energía de la nada', 'Solo guarda la que se produjo antes.'], ['hace que el sol brille de noche', 'Guarda la energía del día para usarla de noche.']], 'Desplaza la energía en el tiempo.'),
    MQ('Al cargar y descargar una batería...', 'sale un poco menos energía de la que entró', [['sale el doble', 'No se puede sacar más energía de la que se metió.'], ['sale exactamente lo mismo', 'Siempre hay pequeñas pérdidas (calor).']], 'La eficiencia de ida y vuelta es menor que 100 %.')
  ],
  microgrid: [
    MQ('Una microred es...', 'una red local que puede funcionar conectada o aislada', [['un cable muy corto', 'Es un sistema completo: generación, almacenamiento y consumo.'], ['una sola batería', 'Incluye varias fuentes y cargas coordinadas.']], 'Si la red grande falla, la microred puede seguir sola.'),
    MQ('¿Qué es el balance de una red eléctrica?', 'Que la generación iguale a la demanda en cada momento', [['Que todas las casas gasten lo mismo', 'Cada casa consume distinto; lo que se equilibra es el total.'], ['Que siempre haya el doble de energía', 'Producir de más también es un problema.']], 'Generación = demanda, segundo a segundo.'),
    MQ('Si la demanda supera a la generación y no hay reserva...', 'hay que reducir cargas o habrá apagón', [['la red crea energía extra', 'La red no crea energía: solo reparte la que hay.'], ['no pasa nada', 'El desequilibrio provoca apagones.']], 'Por eso se priorizan las cargas esenciales.'),
    MQ('¿Por qué el hospital va antes que los letreros luminosos?', 'Para que lo esencial funcione si falta energía', [['Porque los letreros consumen más', 'No es por el consumo: es por la importancia.'], ['Por orden alfabético', 'La prioridad es por necesidad, no por nombre.']], 'Una microred decide con prioridades.'),
    MQ('Combinar varias fuentes en una microred...', 'reduce el riesgo: si una baja, otra puede cubrir', [['aumenta los apagones', 'La diversidad hace el sistema más resiliente.'], ['no sirve de nada', 'Sol, viento y almacenamiento se complementan.']], 'Resiliencia: no depender de una sola fuente.')
  ]
};

// ordenamiento: una pasada de burbuja (para la carta de ORDENAMIENTO)
function sortingQuestion(r) {
  // una lista que una pasada cambia pero no deja ordenada del todo
  let L, a;
  for (let n = 0; n < 30; n++) {
    L = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r).slice(0, 4); a = L.slice();
    for (let i = 0; i < a.length - 1; i++) if (a[i] > a[i + 1]) [a[i], a[i + 1]] = [a[i + 1], a[i]];
    const srt = L.slice().sort((x, y) => x - y).join(), rev = L.slice().reverse().join();
    if (a.join() !== srt && a.join() !== L.join() && rev !== a.join() && rev !== srt) break;
  }
  const b = L.slice(), tr = [[0, 'lista = [' + b.join(', ') + ']']];
  for (let i = 0; i < b.length - 1; i++) { if (b[i] > b[i + 1]) { [b[i], b[i + 1]] = [b[i + 1], b[i]]; tr.push([2, 'cambia: [' + b.join(', ') + ']']); } else tr.push([1, b[i] + ' ≤ ' + b[i + 1] + ': no cambia']); }
  const sorted = L.slice().sort((x, y) => x - y);
  const ans = a.join(', ');
  const wrong = [[sorted.join(', '), 'Eso es la lista ordenada del todo: UNA pasada solo lleva el mayor al final.'], [L.slice().reverse().join(', '), 'Invertir no es ordenar: se comparan vecinos de dos en dos.'], [L.join(', '), 'Sí hay cambios: cada vez que un vecino es mayor, se intercambian.']];
  return {
    title: 'UNA PASADA DE BURBUJA', keys: ['sorting'],
    code: ['lista ← [' + L.map(LKf.n).join(', ') + ']', LKf.k('PARA') + ' i ' + LKf.k('DESDE') + ' 0: ' + LKf.k('SI') + ' lista[i] > lista[i+1]', '  intercambiar lista[i] y lista[i+1]'],
    ask: '¿Cómo queda tras UNA pasada?', answer: ans, wrong, trace: tr, hint: 'el mayor (' + Math.max(...L) + ') termina al final'
  };
}

// metadatos de cada carta: icono, entrada del Atlas y de dónde salen sus preguntas
const CARD_META = {
  sequence: { icon: 'flag', codex: 'secuencia', gen: 'puerto' }, variables: { icon: 'chip', codex: 'variable', gen: 'valle' },
  conditions: { icon: 'shield', codex: 'condicional', gen: 'solaria' }, loops: { icon: 'gear', codex: 'repetir', gen: 'aeris' },
  functions: { icon: 'factory', codex: 'funcion', gen: 'hydria' }, arrays: { icon: 'seed', codex: 'lista', gen: 'bioloop' },
  states: { icon: 'temp', codex: 'estados', gen: 'gea' }, debugging: { icon: 'bug', codex: 'depuracion' },
  search: { icon: 'eye', codex: 'busqueda', gen: 'bateria' }, sorting: { icon: 'star', codex: 'ordenamiento', gen: 'sorting' },
  optimization: { icon: 'lock', codex: 'optimizacion', gen: 'prisma' },
  solar: { icon: 'sun', codex: 'solar' }, wind: { icon: 'wind', codex: 'eolica' }, hydro: { icon: 'drop', codex: 'hidro' },
  biomass: { icon: 'leaf', codex: 'biomasa' }, geothermal: { icon: 'fire', codex: 'geotermia' }, hydrogen: { icon: 'h2', codex: 'hidrogeno' },
  storage: { icon: 'battery', codex: 'almacenamiento' }, microgrid: { icon: 'bolt', codex: 'microred' }
};

// pregunta para una carta (mismo formato que las cerraduras: code, ask, options[{v, ok, why}])
function cardQuestion(key, seed) {
  const meta = CARD_META[key], r = mulberry32(seed);
  if (meta.gen) {
    const q = meta.gen === 'sorting' ? (() => {
      const s = sortingQuestion(r), opts = [{ v: s.answer, ok: true }];
      for (const [v, why] of s.wrong) if (opts.length < 3 && !opts.some(o => o.v === v)) opts.push({ v, why });
      s.options = shuffle(opts, r); return s;
    })() : makeLockQuestion(meta.gen, seed);
    // la explicación es la propia traza resumida (los últimos pasos)
    q.ex = 'Traza: ' + q.trace.map(t => t[1]).slice(-4).join(' → ') + '.';
    return q;
  }
  const bank = CARD_BANK[key]; const m = bank[Math.floor(r() * bank.length)];
  const opts = [{ v: m.ok, ok: true }].concat(m.wrong.map(([v, why]) => ({ v, why })));
  return { title: MASTERY_LABELS[key], code: m.code || [], ask: m.ask, answer: m.ok, options: shuffle(opts, r), ex: m.ex, keys: [key] };
}

// ---------- estado de las cartas ----------
const Cards = {
  now: () => Date.now(),
  day(t = Cards.now()) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); },
  st(k) { return (G.save.cards || {})[k]; },
  unlocked(k) { return (G.save.mastery[k] || 0) > 0 || !!this.st(k); },
  box(k) { const s = this.st(k); return s ? s.box : 0; },
  isDue(k) { if (!this.unlocked(k)) return false; const s = this.st(k); return !s || s.due <= this.now(); },
  due() { return MASTERY_KEYS.filter(k => this.isDue(k)).sort((a, b) => this.box(a) - this.box(b) || ((this.st(a) || {}).due || 0) - ((this.st(b) || {}).due || 0)); },
  // una carta «se apaga» si lleva mucho sin repasarse (solo visual: nunca se castiga)
  fading(k) { const s = this.st(k); return !!(s && s.box >= 2 && this.now() > s.due + CARD_INT[s.box]); },
  answer(k, right) {
    const cs = G.save.cards = G.save.cards || {};
    const s = cs[k] || (cs[k] = { box: 0, due: 0, right: 0, wrong: 0 });
    if (right) { s.box = Math.min(5, s.box + 1); s.right++; } else { s.box = Math.max(0, s.box - 2); s.wrong++; }
    s.due = this.now() + CARD_INT[s.box]; s.last = this.now();
    if (Object.values(cs).filter(c => c.box >= 5).length >= 5) achieve('memory');
    return s.box;
  },
  nextIn(k) {
    const s = this.st(k); if (!s) return 'ahora';
    const ms = s.due - this.now(); if (ms <= 0) return 'ahora';
    const m = Math.round(ms / 60e3); if (m < 60) return 'en ' + m + ' min';
    const h = Math.round(ms / 3600e3); if (h < 36) return 'en ' + h + ' h';
    return 'en ' + Math.round(ms / 86400e3) + ' días';
  },
  // racha de días con un repaso completo
  markDay() {
    const R = G.save.review = G.save.review || { streak: 0, last: null, coreDay: null, best: 0 };
    const today = this.day(), yest = this.day(this.now() - 86400e3);
    if (R.last !== today) { R.streak = R.last === yest ? R.streak + 1 : 1; R.last = today; R.best = Math.max(R.best || 0, R.streak); }
    if (R.streak >= 3) achieve('streak');
    return R;
  }
};

// ---------- reto del día: mismo reto y mismo código para toda la clase ----------
function dailyChallenge(day = Cards.day()) {
  return CHALLENGES[hashStr('reto:' + day) % CHALLENGES.length];
}
const dailyCode = (day = Cards.day()) => String(1000 + hashStr('codigo:' + day + ':' + dailyChallenge(day).id) % 9000);

// ---------------------------------------------------------------------
//  ÁLBUM DE CARTAS (desde el mapa)
// ---------------------------------------------------------------------
function drawCard(g, x, y, k, o = {}) {
  const un = Cards.unlocked(k), b = Cards.box(k), w = o.w || 34, h = o.h || 44, prog = PROG_KEYS.includes(k);
  const base = un ? (prog ? '#14304A' : '#1E3A22') : '#141A30', frame = un ? CARD_COLS[b] : '#2A3050';
  const fade = un && Cards.fading(k);
  rect(g, x + 2, y + 2, w, h, 'rgba(0,0,0,0.4)');
  rect(g, x, y, w, h, base); strokeRect(g, x, y, w, h, frame); strokeRect(g, x + 2, y + 2, w - 4, h - 4, shade(frame, -0.45));
  if (!un) { drawText(g, '?', x + w / 2, y + h / 2 - 4, '#3A4068', { align: 'center' }); return; }
  // brillo del oro / de una carta pendiente
  if (b >= 5) { g.globalAlpha = 0.3 + Math.sin(Time.t * 3 + x) * 0.2; strokeRect(g, x - 1, y - 1, w + 2, h + 2, PAL.sun); g.globalAlpha = 1; }
  if (Cards.isDue(k) && !o.noDue) { g.globalAlpha = 0.5 + Math.sin(Time.t * 5) * 0.4; rect(g, x + w - 7, y + 3, 4, 4, PAL.coral); g.globalAlpha = 1; }
  if (fade) g.globalAlpha = 0.55;
  const ic = CARD_META[k].icon, s = o.big ? 2 : 1;
  if (o.big) { g.save(); g.translate(x + w / 2 - 8, y + 10); g.scale(2, 2); icon(g, ic, 0, 0); g.restore(); } else icon(g, ic, x + w / 2 - 4, y + 9);
  // estrellas de nivel
  for (let i = 0; i < 5; i++) rect(g, x + w / 2 - 12 + i * 5, y + h - (o.big ? 12 : 9), 3, 3, i < b ? CARD_COLS[b] : '#2A3050');
  g.globalAlpha = 1;
  if (o.label) drawText(g, fitText(MASTERY_LABELS[k], w - 4), x + w / 2, y + (o.big ? 32 : 24), PAL.cream, { align: 'center' });
}

class CardsScene {
  constructor() { this.opaque = false; this.nav = true; this.t = 0; this.sel = Cards.due()[0] || MASTERY_KEYS.find(k => Cards.unlocked(k)) || MASTERY_KEYS[0]; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (Input.hit('back')) { Input.consume(); this.close(); } }
  close() { UI.nav = false; Scenes.pop(); }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.9)');
    panel(g, 8, 4, 464, 262, { border: PAL.sun, accent: PAL.sun, accentW: 70 });
    drawText(g, 'CARTAS DEL ATLAS · REPASO ESPACIADO', 240, 10, PAL.sun, { align: 'center' });
    drawText(g, 'Recordar justo antes de olvidar fija lo aprendido. Cada acierto aleja el próximo repaso.', 240, 21, '#8C93B8', { align: 'center' });
    // álbum: programación arriba, energía abajo
    const row = (keys, y, title, col) => {
      drawText(g, title, 18, y - 10, col);
      keys.forEach((k, i) => {
        const x = 18 + i * 40;
        if (UI.btn(g, 'cd' + k, x - 1, y - 1, 36, 46, '', { color: col, bg: 'rgba(0,0,0,0)' })) { this.sel = k; AudioSys.sfx('select'); }
        drawCard(g, x, y, k);
        if (this.sel === k) strokeRect(g, x - 2, y - 2, 38, 48, PAL.sun);
      });
    };
    row(PROG_KEYS, 42, 'ALGORITMOS', PAL.teal);
    row(ENERGY_KEYS, 106, 'ENERGÍAS', PAL.lime);
    // ficha de la carta elegida
    const k = this.sel, un = Cards.unlocked(k), st = Cards.st(k) || { right: 0, wrong: 0 };
    const fy = 160;
    panel(g, 14, fy, 290, 98, { bg: '#0B1020', border: '#2A3570', flat: true });
    drawCard(g, 20, fy + 6, k, { big: true, w: 48, h: 60, label: false, noDue: true });
    const tx = 76;
    drawText(g, MASTERY_LABELS[k], tx, fy + 7, un ? CARD_COLS[Cards.box(k)] : '#8C93B8');
    if (un) {
      drawText(g, CARD_LEVELS[Cards.box(k)] + ' · dominio ' + Math.round(G.save.mastery[k]) + '%', tx, fy + 18, PAL.cream);
      drawText(g, 'próximo repaso: ' + Cards.nextIn(k) + (Cards.fading(k) ? ' · ¡se apaga!' : ''), tx, fy + 28, Cards.isDue(k) ? PAL.coral : '#8C93B8');
      drawText(g, 'aciertos ' + st.right + ' · fallos ' + st.wrong, tx, fy + 38, '#8C93B8');
      const e = CODEX[CARD_META[k].codex];
      if (e) drawPara(g, e.short, 20, fy + 70, 278, '#C9D2F0', { lh: 10 });
    } else drawPara(g, 'Carta por descubrir: aparece cuando practicas este concepto en una isla, una cerradura o un reto.', tx, fy + 20, 220, '#8C93B8', { lh: 10 });
    // acciones
    const due = Cards.due(), R = G.save.review || {}, D = G.save.daily || {};
    const bx = 312, bw = 150;
    const any = MASTERY_KEYS.some(q => Cards.unlocked(q));
    if (UI.btn(g, 'crev', bx, fy, bw, 18, due.length ? '◆ REPASAR (' + Math.min(5, due.length) + ')' : 'PRÁCTICA LIBRE', { primary: true, color: due.length ? PAL.sun : PAL.teal, disabled: !any })) Scenes.push(new ReviewScene(due.length ? due.slice(0, 5) : shuffle(MASTERY_KEYS.filter(q => Cards.unlocked(q))).slice(0, 3), !due.length));
    drawText(g, due.length ? due.length + ' carta' + (due.length > 1 ? 's' : '') + ' esperan repaso' : 'sin repasos pendientes hoy', bx + bw / 2, fy + 21, '#8C93B8', { align: 'center' });
    const doneToday = D.day === Cards.day() && D.done;
    if (UI.btn(g, 'cday', bx, fy + 32, bw, 18, doneToday ? '✓ RETO DEL DÍA' : '★ RETO DEL DÍA', { color: doneToday ? PAL.lime : PAL.pink })) launchDaily();
    drawText(g, doneToday ? 'código para tu docente: ' + dailyCode() : 'mismo reto para toda la clase', bx + bw / 2, fy + 53, doneToday ? PAL.lime : '#8C93B8', { align: 'center' });
    drawText(g, 'racha ' + (R.streak || 0) + ' día' + ((R.streak || 0) === 1 ? '' : 's') + ' · récord ' + (R.best || 0), bx + bw / 2, fy + 63, PAL.orange, { align: 'center' });
    if (UI.btn(g, 'cmast', bx, fy + 74, 72, 16, 'DOMINIO', { color: PAL.lime })) Scenes.push(new MasteryScene());
    if (UI.btn(g, 'cback', bx + 78, fy + 74, 72, 16, 'VOLVER', { color: PAL.teal })) this.close();
    UI.drawTooltip(g);
  }
}

// lanza el reto del día (se puede repetir; la recompensa solo una vez al día)
function launchDaily() {
  const c = dailyChallenge(), cfg = c.make();
  cfg.title = 'Reto del día · ' + c.title; cfg.xp = 30;
  Scenes.push(makePuzzleScene(cfg, r => {
    if (!(r && r.success)) return;
    const today = Cards.day(), D = G.save.daily || {};
    if (D.day !== today || !D.done) {
      G.save.daily = { day: today, done: true };
      G.save.forgeCores = (G.save.forgeCores || 0) + 1;
      Cards.markDay();
      Toast.show('★ Reto del día superado · +1 núcleo · código ' + dailyCode(), PAL.pink, 4);
      addXP(30);
      Save.write();
    }
  }));
}

// ---------------------------------------------------------------------
//  REPASO RELÁMPAGO: hasta 5 cartas, una pregunta por carta
// ---------------------------------------------------------------------
class ReviewScene {
  constructor(keys, practice) {
    this.keys = keys; this.practice = !!practice; this.i = 0; this.t = 0; this.opaque = false; this.nav = true;
    this.res = []; this.combo = 0; this.best = 0; this.xp = 0; this.done = false;
    UI.focus = null; this.load();
  }
  load() {
    const k = this.keys[this.i];
    this.q = cardQuestion(k, hashStr(k) + Date.now() % 100000 + this.i * 31);
    this.pick = -1; this.anim = 0; this.oldBox = Cards.box(k); this.newBox = this.oldBox;
  }
  answer(j) {
    if (this.pick >= 0) return;
    const k = this.keys[this.i], ok = !!this.q.options[j].ok;
    this.pick = j; this.anim = 0;
    // Enter / E pasan a la siguiente carta (el foco va al botón SIGUIENTE)
    this.focusBtn = 'rvnext'; this.focusN = 3; UI.clicks.clear();
    if (!this.practice) this.newBox = Cards.answer(k, ok);
    Registro.log('carta_repaso', k, ok ? 'acierto' : 'error', '', { practica: !!this.practice });
    this.res.push({ k, ok });
    if (ok) {
      this.combo++; this.best = Math.max(this.best, this.combo);
      const xp = (this.practice ? 2 : 5) + Math.min(4, this.combo - 1);
      this.xp += xp; addMastery(k, this.practice ? 1 : 2);
      AudioSys.sfx(this.combo >= 3 ? 'win' : 'ok');
    } else { this.combo = 0; AudioSys.sfx('fail'); addMastery(k, -0.5); }
  }
  next() {
    if (this.pick < 0) return;
    if (this.done) { Scenes.pop(); return; }
    UI.clicks.clear(); UI.focus = null;
    if (this.i < this.keys.length - 1) { this.i++; this.load(); return; }
    this.finish(); this.focusBtn = 'rvend'; this.focusN = 3;
  }
  // cierre de la sesión: XP, racha y núcleo de forja (una vez al día)
  finish() {
    if (this.done) return;
    this.done = true;
    if (this.xp) addXP(this.xp, 'repaso de cartas');
    if (!this.practice && this.res.length >= 3) {
      const R = Cards.markDay(), today = Cards.day();
      if (R.coreDay !== today) { R.coreDay = today; G.save.forgeCores = (G.save.forgeCores || 0) + 1; this.core = true; Toast.show('◆ +1 núcleo de forja por repasar hoy', PAL.aqua, 3); }
    }
    Save.write();
  }
  update(dt) {
    this.t += dt; this.anim += dt;
    if (G.autoDialog) { if (this.done) { Scenes.pop(); return; } this.answer(this.q.options.findIndex(o => o.ok)); this.next(); return; }
    if (this.pick < 0) for (let j = 0; j < 3; j++) if (Input.codeHit('Digit' + (j + 1)) || Input.codeHit('Numpad' + (j + 1))) this.answer(j);
    // salir antes de tiempo: se guardan las cartas ya respondidas
    if (Input.hit('back')) { Input.consume(); if (!this.done && this.res.length) this.finish(); else Scenes.pop(); }
  }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.92)');
    if (this.done) return this.drawSummary(g);
    const k = this.keys[this.i], q = this.q;
    panel(g, 8, 4, 464, 262, { border: PAL.sun, accent: PAL.sun, accentW: 60 });
    drawText(g, (this.practice ? 'PRÁCTICA LIBRE' : 'REPASO RELÁMPAGO') + ' · CARTA ' + (this.i + 1) + '/' + this.keys.length, 18, 10, PAL.sun);
    if (this.combo >= 2) drawText(g, 'COMBO ×' + this.combo, 462, 10, PAL.orange, { align: 'right' });
    // carta a la izquierda: sube o baja de nivel al responder
    const bump = this.pick >= 0 ? Math.max(0, 1 - this.anim * 2) : 0;
    drawCard(g, 18, 28 - Math.round(bump * 6), k, { big: true, w: 58, h: 76, noDue: true });
    drawText(g, fitText(MASTERY_LABELS[k], 70), 47, 108, PAL.cream, { align: 'center' });
    if (this.pick >= 0 && !this.practice) {
      const up = this.newBox > this.oldBox, same = this.newBox === this.oldBox;
      drawText(g, same ? CARD_LEVELS[this.newBox] : (up ? '▲ ' : '▼ ') + CARD_LEVELS[this.newBox], 47, 120, up ? PAL.lime : same ? '#8C93B8' : PAL.coral, { align: 'center' });
      drawText(g, 'repaso ' + Cards.nextIn(k), 47, 130, '#8C93B8', { align: 'center' });
    }
    // pregunta
    const qx = 90, qw = 372;
    let y = 28;
    if (q.code && q.code.length) {
      const ch = q.code.length * 10 + 8;
      panel(g, qx, y, qw, ch, { bg: '#0B1020', border: '#2A3570', flat: true });
      q.code.forEach((ln, i) => { drawText(g, String(i + 1), qx + 12, y + 5 + i * 10, '#565E8C', { align: 'right' }); drawRichLine(g, parseRich(ln, PAL.cream), qx + 18, y + 5 + i * 10); });
      y += ch + 6;
    }
    y += drawPara(g, q.ask, qx, y, qw, PAL.sun, { lh: 10 }) + 6;
    // opciones
    q.options.forEach((o, j) => {
      const lines = wrapPlain(o.v, qw - 30).length, bh = Math.max(16, lines * 10 + 6);
      let col = PAL.teal;
      if (this.pick >= 0) col = o.ok ? PAL.lime : j === this.pick ? PAL.coral : '#3E4C8A';
      if (UI.btn(g, 'rv' + j, qx, y, qw, bh, '', { color: col, disabled: this.pick >= 0 && !o.ok && j !== this.pick }) && this.pick < 0) this.answer(j);
      drawText(g, String(j + 1), qx + 8, y + Math.floor(bh / 2) - 3, col);
      drawPara(g, o.v, qx + 20, y + 4, qw - 30, this.pick >= 0 && o.ok ? PAL.lime : PAL.cream, { lh: 10 });
      if (this.pick >= 0 && (o.ok || j === this.pick)) drawText(g, o.ok ? '✓' : '✗', qx + qw - 8, y + Math.floor(bh / 2) - 3, o.ok ? PAL.lime : PAL.coral, { align: 'right' });
      y += bh + 3;
    });
    // explicación tras responder
    if (this.pick >= 0) {
      const o = q.options[this.pick];
      y += 2;
      const txt = o.ok ? '{g}¡Bien!{/} ' + (q.ex || '') : '{r}Casi.{/} ' + (o.why || '') + (q.ex ? ' ' + q.ex : '');
      drawPara(g, txt, qx, y, qw, PAL.cream, { lh: 10 });
      if (UI.btn(g, 'rvnext', 462 - 110, 244, 110, 16, this.i < this.keys.length - 1 ? 'SIGUIENTE ▶' : 'TERMINAR ▶', { primary: true, color: PAL.lime })) this.next();
      this.grabFocus();
    } else drawText(g, 'Elige con 1 · 2 · 3, el ratón o el dedo', 462, 250, '#8C93B8', { align: 'right' });
    UI.drawTooltip(g);
  }
  // el foco pasa al botón recién aparecido (la lista de botones se actualiza un fotograma después)
  grabFocus() { if (this.focusN > 0) { UI.focus = this.focusBtn; this.focusN--; } }
  drawSummary(g) {
    panel(g, 90, 40, 300, 190, { border: PAL.sun, accent: PAL.sun, accentW: 60 });
    const ok = this.res.filter(r => r.ok).length;
    drawText(g, this.practice ? 'PRÁCTICA TERMINADA' : 'REPASO TERMINADO', 240, 50, PAL.sun, { align: 'center', scale: 2 });
    drawText(g, ok + ' de ' + this.res.length + ' aciertos · mejor combo ×' + this.best, 240, 74, PAL.cream, { align: 'center' });
    this.res.forEach((r, i) => { const x = 240 - this.res.length * 22 + i * 44; drawCard(g, x + 4, 90, r.k, { noDue: true }); drawText(g, r.ok ? '✓' : '✗', x + 21, 138, r.ok ? PAL.lime : PAL.coral, { align: 'center' }); });
    const R = G.save.review || {};
    drawText(g, '+' + this.xp + ' XP' + (this.core ? ' · +1 núcleo de forja' : ''), 240, 154, PAL.lime, { align: 'center' });
    if (!this.practice) drawText(g, 'racha: ' + (R.streak || 0) + ' día' + ((R.streak || 0) === 1 ? '' : 's') + ' · vuelve mañana para seguirla', 240, 166, PAL.orange, { align: 'center' });
    drawPara(g, 'Las cartas que fallaste volverán pronto; las que aciertas esperan más. Así se recuerda a largo plazo.', 108, 180, 264, '#8C93B8', { lh: 10, align: 'center' });
    if (UI.btn(g, 'rvend', 190, 208, 100, 16, 'VOLVER', { primary: true, color: PAL.sun })) Scenes.pop();
    this.grabFocus();
  }
}
