// =====================================================================
//  CERRADURAS DE CÓDIGO: «predice y golpea»
//  En cada isla hay cofres sellados con un programa corto del concepto de
//  la isla. Lía lee el código, predice el resultado y golpea con el
//  Lumisable el cristal con la respuesta. Leer y trazar código antes de
//  escribirlo es una de las prácticas más eficaces para aprender a
//  programar; aquí además cada opción incorrecta es un error típico con
//  su explicación, y fallar muestra la traza paso a paso (el error es
//  información) y genera una variante nueva con otros números.
// =====================================================================

// formato del código: palabras clave, números, textos y comentarios con color
const LKf = { k: s => '{c}' + s + '{/}', n: v => '{y}' + v + '{/}', s: v => '{o}"' + v + '"{/}', c: s => '{k}' + s + '{/}' };

// Cada generador devuelve { title, keys, code[], ask, answer, wrong: [[valor, por qué], ...], trace: [[línea, estado]], hint }
const LOCK_GEN = {
  puerto(r) {
    // secuencia de movimientos: cada paso cuenta, con su signo y en orden
    const steps = [], names = [['avanzar', 1], ['retroceder', -1]];
    let x = 0; const trace = [[0, 'x = 0']];
    for (let i = 0; i < 4; i++) {
      const [nm, sg] = i === 1 || (i === 3 && r() < 0.5) ? names[1] : names[0];
      const v = 1 + Math.floor(r() * 3);
      steps.push([nm, sg, v]); x += sg * v; trace.push([i + 1, 'x = ' + x]);
    }
    const plus = steps.reduce((s, q) => s + q[2], 0), last = steps[3][1] * steps[3][2];
    return {
      title: 'LA RUTA DEL DRON', keys: ['sequence'],
      code: ['x ' + '← ' + LKf.n(0)].concat(steps.map(([nm, sg, v]) => LKf.k(nm) + ' ' + LKf.n(v) + '   ' + LKf.c(sg > 0 ? '(x + ' + v + ')' : '(x − ' + v + ')'))),
      ask: '¿En qué casilla x termina el dron?', answer: x,
      wrong: [[plus, 'Sumaste todos los pasos: retroceder RESTA.'], [last, 'Ese es solo el último paso: la secuencia se ejecuta completa, de arriba abajo.'], [x + 1, 'Revisa paso a paso: cada instrucción cambia x una sola vez.']],
      trace, hint: 'tras el paso 2, x = ' + (steps[0][1] * steps[0][2] + steps[1][1] * steps[1][2])
    };
  },
  valle(r) {
    // una variable guarda un valor, no una fórmula
    const a0 = 2 + Math.floor(r() * 5), k = 1 + Math.floor(r() * 4), a1 = 10 + Math.floor(r() * 9);
    const b = a0 + k;
    if (r() < 0.5) return {
      title: 'LA CAJA DE VEGA', keys: ['variables', 'sequence'],
      code: ['a ← ' + LKf.n(a0), 'b ← a + ' + LKf.n(k), 'a ← ' + LKf.n(a1)],
      ask: '¿Cuánto vale b al final?', answer: b,
      wrong: [[a1 + k, 'b guardó su valor en la línea 2. Cambiar a después no actualiza b sola.'], [a0, 'Ese es el valor inicial de a, no el de b.'], [a1, 'Ese es el valor final de a: b no es un alias de a.']],
      trace: [[0, 'a = ' + a0], [1, 'b = ' + a0 + ' + ' + k + ' = ' + b], [2, 'a = ' + a1 + '   (b sigue = ' + b + ')']],
      hint: 'tras la línea 2, b = ' + b
    };
    const m = 2 + Math.floor(r() * 2), fin = b * m;
    return {
      title: 'LA CAJA DE VEGA', keys: ['variables', 'sequence'],
      code: ['a ← ' + LKf.n(a0), 'b ← a + ' + LKf.n(k), 'a ← b × ' + LKf.n(m)],
      ask: '¿Cuánto vale a al final?', answer: fin,
      wrong: [[a0 * m, 'La línea 3 usa b, que ya vale ' + b + ', no el a inicial.'], [a0, 'a cambia en la línea 3: el último valor guardado es el que queda.'], [b, 'Ese es b. La línea 3 guarda b × ' + m + ' en a.']],
      trace: [[0, 'a = ' + a0], [1, 'b = ' + b], [2, 'a = ' + b + ' × ' + m + ' = ' + fin]],
      hint: 'tras la línea 2, b = ' + b
    };
  },
  solaria(r) {
    // condicionales: solo se ejecuta una rama; > no incluye el igual
    const U = [300, 400, 500, 600][Math.floor(r() * 4)];
    const edge = r() < 0.4, R = edge ? U : U + (r() < 0.5 ? -1 : 1) * (40 + Math.floor(r() * 5) * 20);
    const cond = R > U;
    if (r() < 0.55) return {
      title: 'EL CONTROLADOR SOLAR', keys: ['conditions', 'variables', 'solar'],
      code: ['radiacion ← ' + LKf.n(R), LKf.k('SI') + ' radiacion > ' + LKf.n(U) + ' ' + LKf.k('ENTONCES'), '  modo ← ' + LKf.s('cargar'), LKf.k('SINO'), '  modo ← ' + LKf.s('red'), LKf.k('FIN SI')],
      ask: '¿Qué valor tiene modo?', answer: cond ? 'cargar' : 'red',
      wrong: [[cond ? 'red' : 'cargar', edge ? R + ' > ' + U + ' es FALSO: el signo > no incluye el caso igual.' : 'Compara con cuidado: ' + R + ' > ' + U + ' es ' + (cond ? 'VERDADERO' : 'FALSO') + '.'], ['ambos', 'Solo se ejecuta UNA rama: la del SI o la del SINO, nunca las dos.'], ['ninguno', 'Con SINO siempre se ejecuta una de las dos ramas.']],
      trace: [[0, 'radiacion = ' + R], [1, R + ' > ' + U + ' → ' + (cond ? 'VERDADERO' : 'FALSO')], [cond ? 2 : 4, 'modo = "' + (cond ? 'cargar' : 'red') + '"']],
      hint: 'la condición es ' + R + ' > ' + U
    };
    const bat = 20 + Math.floor(r() * 5) * 10, lim = 40, add = 30, sub = 10, low = bat < lim, fin = low ? bat + add : bat - sub;
    return {
      title: 'LA BATERÍA DE SURI', keys: ['conditions', 'variables', 'storage'],
      code: ['bateria ← ' + LKf.n(bat), LKf.k('SI') + ' bateria < ' + LKf.n(lim) + ' ' + LKf.k('ENTONCES'), '  bateria ← bateria + ' + LKf.n(add), LKf.k('SINO'), '  bateria ← bateria − ' + LKf.n(sub), LKf.k('FIN SI')],
      ask: '¿Cuánto vale bateria al final?', answer: fin,
      wrong: [[low ? bat - sub : bat + add, 'Esa es la otra rama: ' + bat + ' < ' + lim + ' es ' + (low ? 'VERDADERO' : 'FALSO') + '.'], [bat + add - sub, 'Solo se ejecuta UNA rama, no las dos seguidas.'], [bat, 'La rama elegida sí cambia bateria.']],
      trace: [[0, 'bateria = ' + bat], [1, bat + ' < ' + lim + ' → ' + (low ? 'VERDADERO' : 'FALSO')], [low ? 2 : 4, 'bateria = ' + fin]],
      hint: 'la condición es ' + bat + ' < ' + lim
    };
  },
  aeris(r) {
    if (r() < 0.55) {
      // REPETIR: cuántas vueltas (error «por uno»)
      const N = 3 + Math.floor(r() * 4), K = 2 + Math.floor(r() * 4), g0 = Math.floor(r() * 3);
      const tr = [[0, 'giros = ' + g0]]; let v = g0;
      for (let i = 1; i <= N; i++) { v += K; if (i <= 3 || i === N) tr.push([2, 'vuelta ' + i + ': giros = ' + v]); }
      return {
        title: 'EL MOLINO DE DON VENTO', keys: ['loops', 'wind'],
        code: ['giros ← ' + LKf.n(g0), LKf.k('REPETIR') + ' ' + LKf.n(N) + ' ' + LKf.k('VECES'), '  giros ← giros + ' + LKf.n(K), LKf.k('FIN REPETIR')],
        ask: '¿Cuánto vale giros al final?', answer: v,
        wrong: [[g0 + (N - 1) * K, 'Una vuelta de menos: REPETIR ' + N + ' VECES hace ' + N + ' vueltas completas.'], [g0 + N + K, 'Sumaste ' + N + ' y ' + K + ': el bucle suma ' + K + ' en CADA vuelta.'], [N * K, 'No olvides el valor inicial de giros (' + g0 + ').']],
        trace: tr, hint: 'tras la vuelta 1, giros = ' + (g0 + K)
      };
    }
    // MIENTRAS: contar vueltas hasta que la condición deja de cumplirse
    const D = 2 + Math.floor(r() * 3), L = 2 + Math.floor(r() * 3), V = L + D * (2 + Math.floor(r() * 3)) + Math.floor(r() * D);
    let v = V, n = 0; const tr = [[0, 'temp = ' + V + ', vueltas = 0']];
    while (v > L) { v -= D; n++; tr.push([3, 'vuelta ' + n + ': temp = ' + v]); }
    tr.push([1, v + ' > ' + L + ' es FALSO → sale']);
    return {
      title: 'EL FRENO DEL MOLINO', keys: ['loops', 'wind'],
      code: ['temp ← ' + LKf.n(V) + ' · vueltas ← ' + LKf.n(0), LKf.k('MIENTRAS') + ' temp > ' + LKf.n(L) + ' ' + LKf.k('HACER'), '  temp ← temp − ' + LKf.n(D), '  vueltas ← vueltas + ' + LKf.n(1), LKf.k('FIN MIENTRAS')],
      ask: '¿Cuántas vueltas da el bucle?', answer: n,
      wrong: [[n + 1, 'La condición se comprueba ANTES de cada vuelta: cuando temp ≤ ' + L + ' ya no entra.'], [n - 1 < 0 ? n + 2 : n - 1, 'Cuenta de nuevo: la última vuelta también cuenta si al empezarla temp > ' + L + '.'], ['infinitas', 'temp baja en cada vuelta: la condición termina siendo FALSA (tiene salida).']],
      trace: tr.slice(0, 5).concat(tr.length > 5 ? tr.slice(-2) : []), hint: 'tras la vuelta 1, temp = ' + (V - D)
    };
  },
  hydria(r) {
    if (r() < 0.5) {
      // funciones: se definen una vez y se llaman varias
      const m = 2 + Math.floor(r() * 2), a = 2 + Math.floor(r() * 4), b = 1 + Math.floor(r() * 4), res = a * m + b * m;
      return {
        title: 'LA FORJA DE FUNCIONES', keys: ['functions', 'hydro'],
        code: [LKf.k('FUNCIÓN') + ' energia(caudal)', '  ' + LKf.k('DEVOLVER') + ' caudal × ' + LKf.n(m), LKf.k('FIN FUNCIÓN'), 'total ← energia(' + LKf.n(a) + ') + energia(' + LKf.n(b) + ')'],
        ask: '¿Cuánto vale total?', answer: res,
        wrong: [[a * m + b, 'energia() se llama DOS veces: también ' + b + ' se multiplica por ' + m + '.'], [a * m, 'Falta la segunda llamada: energia(' + b + ').'], [a + b, 'Sumaste los argumentos: cada llamada ejecuta el cuerpo de la función.']],
        trace: [[3, 'llamada energia(' + a + ')'], [1, 'devuelve ' + a + ' × ' + m + ' = ' + a * m], [3, 'llamada energia(' + b + ')'], [1, 'devuelve ' + b + ' × ' + m + ' = ' + b * m], [3, 'total = ' + a * m + ' + ' + b * m + ' = ' + res]],
        hint: 'energia(' + a + ') devuelve ' + a * m
      };
    }
    // el parámetro es una copia: la variable de fuera no cambia
    const x = 3 + Math.floor(r() * 6), k = 1 + Math.floor(r() * 3);
    return {
      title: 'EL CAUDAL COPIADO', keys: ['functions', 'hydro'],
      code: [LKf.k('FUNCIÓN') + ' subir(n)', '  n ← n + ' + LKf.n(k), '  ' + LKf.k('DEVOLVER') + ' n', LKf.k('FIN FUNCIÓN'), 'x ← ' + LKf.n(x) + ' · y ← subir(x)'],
      ask: '¿Cuánto vale x al final?', answer: x,
      wrong: [[x + k, 'n es una COPIA del valor de x: cambiar n no cambia x. Ese es el valor de y.'], [k, 'x recibió ' + x + ' y nadie volvió a asignarle otro valor.'], [0, 'x conserva su valor: la función devuelve el resultado en y.']],
      trace: [[4, 'x = ' + x], [4, 'llamada subir(' + x + ') → n = ' + x], [1, 'n = ' + (x + k) + '   (x sigue = ' + x + ')'], [2, 'devuelve ' + (x + k) + ' → y = ' + (x + k)]],
      hint: 'dentro de la función, n = ' + x + ' al empezar'
    };
  },
  bioloop(r) {
    const pool = ['cáscara', 'hojas', 'botella', 'lata', 'papel', 'semillas'];
    if (r() < 0.5) {
      // índices desde 0
      const L = shuffle(pool, r).slice(0, 4), i = 1 + Math.floor(r() * 3);
      return {
        title: 'LA LISTA DE LA ABUELA', keys: ['arrays', 'biomass'],
        code: ['residuos ← [' + L.map(s => LKf.s(s)).join(', ') + ']', 'x ← residuos[' + LKf.n(i) + ']'],
        ask: '¿Qué guarda x?', answer: L[i],
        wrong: [[L[i - 1], 'Contaste desde 1. En las listas el primer elemento es [0].'], [L[(i + 1) % 4], 'Un puesto de más: residuos[' + i + '] es el elemento número ' + (i + 1) + '.'], [L[0], 'residuos[0] es el primero; aquí se pide residuos[' + i + '].']],
        trace: L.map((s, k) => [0, '[' + k + '] = "' + s + '"' + (k === i ? '   ← x' : '')]),
        hint: 'residuos[0] = "' + L[0] + '"'
      };
    }
    // recorrer una lista y acumular
    const nums = [1 + Math.floor(r() * 5), 2 + Math.floor(r() * 6), 1 + Math.floor(r() * 4)], tot = nums.reduce((a, b) => a + b, 0);
    let acc = 0; const tr = [[0, 'kilos = 0']];
    nums.forEach((n, k) => { acc += n; tr.push([2, 'vuelta ' + (k + 1) + ': kilos = ' + acc]); });
    return {
      title: 'EL BIODIGESTOR DE MENTA', keys: ['arrays', 'loops', 'biomass'],
      code: ['kilos ← ' + LKf.n(0), LKf.k('PARA CADA') + ' r ' + LKf.k('EN') + ' [' + nums.map(LKf.n).join(', ') + ']', '  kilos ← kilos + r', LKf.k('FIN PARA')],
      ask: '¿Cuánto vale kilos al final?', answer: tot,
      wrong: [[tot - nums[0], 'El recorrido empieza en el primer elemento: no te saltes ' + nums[0] + '.'], [nums[2], 'Ese es solo el último: kilos ACUMULA cada elemento.'], [nums.length, 'Eso es cuántos elementos hay; se suman sus valores.']],
      trace: tr, hint: 'tras la vuelta 1, kilos = ' + nums[0]
    };
  },
  gea(r) {
    // máquina de estados: los eventos no válidos se ignoran
    const T = { APAGADA: { encender: 'CALIENTA' }, CALIENTA: { listo: 'GENERA', falla: 'FALLO' }, GENERA: { falla: 'FALLO', apagar: 'APAGADA' }, FALLO: { reparar: 'APAGADA' } };
    const seqs = [['encender', 'listo', 'falla'], ['listo', 'encender', 'listo'], ['encender', 'falla', 'listo'], ['encender', 'listo', 'apagar', 'encender'], ['encender', 'reparar', 'listo']];
    const ev = seqs[Math.floor(r() * seqs.length)];
    let s = 'APAGADA', naive = 'APAGADA'; const tr = [[0, 'estado = APAGADA']];
    ev.forEach(e => { const nx = T[s][e]; tr.push([2, e + ': ' + (nx ? s + ' → ' + nx : 'no válido en ' + s + ' → se ignora')]); if (nx) s = nx; });
    // «error típico»: aplicar el último evento como si siempre fuera válido
    const lastTarget = { encender: 'CALIENTA', listo: 'GENERA', falla: 'FALLO', apagar: 'APAGADA', reparar: 'APAGADA' }[ev[ev.length - 1]];
    const opts = ['APAGADA', 'CALIENTA', 'GENERA', 'FALLO'].filter(q => q !== s);
    const wrong = [];
    if (lastTarget !== s) wrong.push([lastTarget, 'El evento «' + ev[ev.length - 1] + '» no es válido desde ' + (tr[tr.length - 2] ? 'ese estado' : 'ahí') + ': una máquina de estados ignora las transiciones que no existen.']);
    for (const q of opts) if (!wrong.some(w => w[0] === q)) wrong.push([q, 'Sigue los eventos uno a uno con la tabla de transiciones.']);
    return {
      title: 'LA PLANTA GEOTÉRMICA', keys: ['states', 'geothermal'],
      code: ['estado ← ' + LKf.s('APAGADA'), LKf.c('APAGADA -encender→ CALIENTA -listo→ GENERA'), LKf.c('CALIENTA/GENERA -falla→ FALLO -reparar→ APAGADA'), 'eventos: ' + ev.map(e => LKf.k(e)).join(', ')],
      ask: '¿En qué estado termina la planta?', answer: s,
      wrong: wrong.slice(0, 3), trace: tr, hint: 'tras el primer evento: ' + (T.APAGADA[ev[0]] || 'APAGADA')
    };
  },
  h2(r) {
    // pipeline: la salida de cada etapa es la entrada de la siguiente; el orden importa
    const agua = 2 * (3 + Math.floor(r() * 5)), plus = 1 + Math.floor(r() * 3), m = 2 + Math.floor(r() * 2);
    const e1 = agua / 2, e2 = e1 + plus, e3 = e2 * m;
    return {
      title: 'EL PIPELINE DEL HIDRÓGENO', keys: ['functions', 'sequence', 'hydrogen'],
      code: ['h ← ' + LKf.n(agua) + '   ' + LKf.c('(agua)'), 'h ← electrolizar(h)  ' + LKf.c('(÷ 2)'), 'h ← comprimir(h)     ' + LKf.c('(+ ' + plus + ')'), 'h ← almacenar(h)     ' + LKf.c('(× ' + m + ')')],
      ask: '¿Cuánto vale h al salir del pipeline?', answer: e3,
      wrong: [[(agua + plus) / 2 * m, 'Aplicaste comprimir antes que electrolizar: en un pipeline el orden cambia el resultado.'], [e2, 'Falta la última etapa: almacenar también transforma h.'], [agua * m / 2, 'Te saltaste comprimir: cada etapa recibe la salida de la anterior.']],
      trace: [[0, 'h = ' + agua], [1, 'h = ' + agua + ' ÷ 2 = ' + e1], [2, 'h = ' + e1 + ' + ' + plus + ' = ' + e2], [3, 'h = ' + e2 + ' × ' + m + ' = ' + e3]],
      hint: 'tras electrolizar, h = ' + e1
    };
  },
  bateria(r) {
    const L = shuffle([3, 5, 7, 8, 9, 12, 15, 4], r).slice(0, 5);
    if (r() < 0.5) {
      // búsqueda lineal: cuántas comparaciones
      const i = 1 + Math.floor(r() * 4), tgt = L[i];
      return {
        title: 'BUSCANDO A BETA', keys: ['search', 'storage'],
        code: ['socs ← [' + L.map(LKf.n).join(', ') + ']', LKf.k('PARA') + ' i ' + LKf.k('DESDE') + ' 0: ' + LKf.k('SI') + ' socs[i] = ' + LKf.n(tgt) + ' → ' + LKf.k('PARAR')],
        ask: '¿Cuántas comparaciones hace?', answer: i + 1,
        wrong: [[i, 'Contaste el índice (' + i + '), pero la comparación con socs[0] también cuenta: son ' + (i + 1) + '.'], [L.length, 'La búsqueda PARA al encontrarlo: no revisa el resto.'], [tgt, 'Ese es el valor buscado, no el número de comparaciones.']],
        trace: L.slice(0, i + 1).map((v, k) => [1, 'comparación ' + (k + 1) + ': socs[' + k + '] = ' + v + (v === tgt ? ' ✓ PARAR' : ' ✗')]),
        hint: 'comparación 1: socs[0] = ' + L[0]
      };
    }
    // el mayor de una lista (recorrido con máximo)
    const S = L.slice(0, 4), mx = Math.max(...S);
    let cur = S[0]; const tr = [[0, 'mayor = ' + cur]];
    S.slice(1).forEach(v => { if (v > cur) cur = v; tr.push([2, 'x = ' + v + (v === cur ? ' → mayor = ' + v : ' → sigue ' + cur)]); });
    return {
      title: 'LA BATERÍA MÁS LLENA', keys: ['search', 'sorting', 'storage'],
      code: ['mayor ← socs[0]  ' + LKf.c('socs = [' + S.join(', ') + ']'), LKf.k('PARA CADA') + ' x ' + LKf.k('EN') + ' socs', '  ' + LKf.k('SI') + ' x > mayor: mayor ← x'],
      ask: '¿Cuánto vale mayor al final?', answer: mx,
      wrong: [[S[S.length - 1], 'Ese es el último elemento: mayor solo cambia cuando x > mayor.'], [S[0], 'mayor empieza en socs[0], pero el recorrido lo actualiza.'], [Math.min(...S), 'Ese es el menor: la condición es x > mayor.']],
      trace: tr, hint: 'mayor empieza en ' + S[0]
    };
  },
  prisma(r) {
    // despacho por prioridad en una microred
    const D = 8 + Math.floor(r() * 6), S = 2 + Math.floor(r() * 4), E = 1 + Math.floor(r() * 3), B = Math.max(0, D - S - E);
    return {
      title: 'EL DESPACHO DE PRISMA', keys: ['optimization', 'conditions', 'microgrid'],
      code: ['demanda ← ' + LKf.n(D) + ' · solar ← ' + LKf.n(S) + ' · eolica ← ' + LKf.n(E), 'resto ← demanda − solar', 'resto ← resto − eolica', 'bateria ← resto   ' + LKf.c('(la batería cubre lo que falta)')],
      ask: '¿Cuánto aporta la batería?', answer: B,
      wrong: [[D - S, 'Falta restar la eólica: se usa antes que la batería.'], [D, 'Primero se usan las renovables: la batería solo cubre lo que falta.'], [S + E, 'Eso es lo que aportan solar y eólica juntas.']],
      trace: [[0, 'demanda = ' + D], [1, 'resto = ' + D + ' − ' + S + ' = ' + (D - S)], [2, 'resto = ' + (D - S) + ' − ' + E + ' = ' + B], [3, 'bateria = ' + B]],
      hint: 'tras la línea 2, resto = ' + (D - S)
    };
  }
};

// prepara una pregunta: opciones únicas y barajadas
function makeLockQuestion(region, seed) {
  const r = mulberry32(seed);
  const gen = LOCK_GEN[region] || LOCK_GEN.puerto;
  const q = gen(r);
  const ans = String(q.answer), opts = [{ v: ans, ok: true }];
  for (const [v, why] of q.wrong) { const s = String(v); if (opts.length < 3 && !opts.some(o => o.v === s)) opts.push({ v: s, why }); }
  let k = 1;
  while (opts.length < 3) { const n = Number(ans); const s = isNaN(n) ? ans + k : String(n + (k % 2 ? k : -k)); if (!opts.some(o => o.v === s)) opts.push({ v: s, why: 'Traza el programa línea a línea: ese valor no aparece.' }); k++; }
  q.options = shuffle(opts, r);
  q.region = region;
  return q;
}

// ---------------------------------------------------------------------
//  El cofre sellado, su proyector y los tres cristales de respuesta
// ---------------------------------------------------------------------
const LOCK_ZONE = 64; // distancia a la que se despliega el holograma
class CodeLock extends Entity {
  constructor(lv, x, y, id) {
    super(lv, x - 8, y - 12, 16, 12);
    this.id = id; this.region = lv.def.region; this.layer = -1; this.t = 0;
    const st = (G.save.locks || {})[id];
    this.solved = !!(st && st.solved);
    this.tries = 0; this.near = 0; this.openT = this.solved ? 1 : 0; this.crystals = [];
    this.variant = 0;
    this.newQuestion();
  }
  newQuestion() {
    this.q = makeLockQuestion(this.region, hashStr(this.id) + this.variant * 7919 + (G.save.locks && G.save.locks[this.id] ? G.save.locks[this.id].tries || 0 : 0) * 131);
    for (const c of this.crystals) c.dead = true;
    this.crystals = [];
    if (this.solved) return;
    this.q.options.forEach((o, i) => {
      const c = new LockCrystal(this.lv, this.x + 8 + (i - 1) * 30 - 4, this.y - 20, this, o, i);
      this.crystals.push(c); this.lv.addEntity(c);
    });
  }
  get cx() { return this.x + 8; }
  update(dt) {
    super.update(dt);
    const p = this.lv.player, d = Math.abs(p.cx - this.cx), dy = Math.abs(p.y + p.h - (this.y + this.h));
    const inZone = d < LOCK_ZONE && dy < 40 && !this.solved;
    this.near = approach(this.near, inZone ? 1 : 0, dt * 4);
    this.lv.lockPanel = inZone ? this : (this.lv.lockPanel === this ? null : this.lv.lockPanel);
    // el cartel con el nombre de la isla se retira para dejar ver el código
    if (inZone && this.lv.banner > 0) this.lv.banner = Math.min(this.lv.banner, 0.3);
    // la primera vez se explica con una tarjeta ilustrada (después, H la vuelve a mostrar)
    if (inZone && !flag('lockIntro') && !Cut.active && Scenes.top() && Scenes.top().lv === this.lv) {
      setFlag('lockIntro');
      Scenes.push(new LockHelpScene());
    }
    if (this.solved) this.openT = Math.min(1, this.openT + dt * 1.5);
  }
  choose(c) {
    if (this.solved || this.busy) return;
    const st = (G.save.locks = G.save.locks || {})[this.id] || (G.save.locks[this.id] = { tries: 0 });
    st.tries = (st.tries || 0) + 1; this.tries++;
    Registro.log('cerradura', this.q.title + ': ' + this.q.ask, c.opt.ok ? 'acierto' : 'error', this.tries, { respuesta: c.opt.v, conceptos: (this.q.keys || []).join(', ') });
    if (c.opt.ok) {
      this.solved = true; st.solved = true; st.first = this.tries === 1;
      c.state = 'ok';
      for (const o of this.crystals) if (o !== c) o.state = 'gone';
      AudioSys.sfx('win'); hitstop(this.lv, 0.08); FX.flash(PAL.sun, 0.25);
      Particles.burst(this.cx, this.y, 26, { colors: [PAL.sun, PAL.white, PAL.teal], min: 30, max: 90, type: 'star' });
      const first = this.tries === 1;
      const cores = first ? 2 : 1;
      G.save.forgeCores = (G.save.forgeCores || 0) + cores;
      addMastery(this.q.keys, first ? 6 : 3);
      addXP(first ? 30 : 15, first ? 'predicción al primer intento' : 'cerradura abierta');
      Toast.show('◆ +' + cores + ' núcleo' + (cores > 1 ? 's' : '') + ' de forja', PAL.aqua, 2.6);
      for (let i = 0; i < 3; i++) this.lv.addEntity(new Pickup(this.lv, this.cx, this.y - 4, 'orb'));
      const all = Object.values(G.save.locks).filter(s => s.solved);
      if (all.filter(s => s.first).length >= 5) achieve('reader');
      if (all.length >= 10) achieve('locksmith');
      this.lv.lumi.mood = 'happy'; this.lv.lumi.moodT = 2;
      Bark.say('pix', first ? choice(['¡Predicción perfecta! Leíste el código como una máquina.', '¡Al primer intento! Así se traza un programa.']) : '¡Abierto! Rastrear el programa paso a paso funciona.');
      Save.write();
    } else {
      c.state = 'cracked';
      AudioSys.sfx('fail'); FX.shake(2, 0.2);
      Particles.burst(c.x + 4, c.y + 6, 12, { colors: ['#8A8FB0', '#C9D2F0'], min: 20, max: 60 });
      G.save.stats.lockFails = (G.save.stats.lockFails || 0) + 1;
      addMastery(this.q.keys, -1);
      // la traza explica el error típico y después llega una variante nueva
      this.busy = true;
      const lock = this;
      Scenes.push(new TraceScene(this.q, c.opt, () => { lock.busy = false; lock.variant++; lock.newQuestion(); Save.write(); }));
    }
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), col = REGIONS[regionIdx(this.region)] ? REGIONS[regionIdx(this.region)].col : PAL.teal;
    // pedestal con proyector
    rect(g, x - 1, y + 10, 18, 3, '#3A4068'); rect(g, x, y + 10, 16, 1, '#565E8C');
    // cofre de datos
    const lid = this.openT;
    rect(g, x + 1, y + 3, 14, 8, '#6B4A2A'); rect(g, x + 1, y + 3, 14, 1, '#B07A4A'); strokeRect(g, x + 1, y + 3, 14, 8, OUTLINE);
    rect(g, x + 1, y + 6, 14, 1, col);
    if (lid < 0.5) { rect(g, x, y, 16, 4, '#8B5A3C'); rect(g, x, y, 16, 1, '#D8A06A'); strokeRect(g, x, y, 16, 4, OUTLINE); rect(g, x + 7, y + 3, 2, 3, this.solved ? PAL.sun : col); }
    else {
      rect(g, x - 2, y - 5, 4, 8, '#8B5A3C'); strokeRect(g, x - 2, y - 5, 4, 8, OUTLINE);
      // haz de luz suave que sale del cofre abierto
      const grd = g.createLinearGradient(0, y + 4, 0, y - 30);
      grd.addColorStop(0, rgba(PAL.sun, 0.55 + Math.sin(this.t * 3) * 0.1)); grd.addColorStop(1, rgba(PAL.sun, 0));
      g.fillStyle = grd; g.beginPath(); g.moveTo(x + 3, y + 4); g.lineTo(x + 13, y + 4); g.lineTo(x + 17, y - 30); g.lineTo(x - 1, y - 30); g.closePath(); g.fill();
    }
    // luz del proyector
    if (!this.solved) { g.globalAlpha = 0.25 + this.near * 0.35; rect(g, x + 6, y - 2, 4, 2, col); g.globalAlpha = 1; }
  }
  // letrero visible desde lejos: invita a acercarse (se oculta al llegar, cuando aparece el holograma)
  drawOverlay(g, cx, cy) {
    if (this.solved || this.near > 0.6) return;
    const p = this.lv.player, d = Math.abs(p.cx - this.cx);
    if (d > 230) return;
    const label = '◆ COFRE DE CÓDIGO', w = textW(label) + 8, bob = Math.round(Math.sin(this.t * 3) * 1.5);
    const x = Math.round(this.cx - cx - w / 2), y = Math.round(this.y - cy - 52 + bob);
    g.globalAlpha = (1 - this.near) * clamp((230 - d) / 60, 0, 1);
    rect(g, x, y, w, 11, 'rgba(10,14,32,0.85)'); strokeRect(g, x, y, w, 11, PAL.sun);
    drawText(g, label, x + 4, y + 2, PAL.sun);
    drawText(g, '▼', this.cx - cx, y + 12, PAL.sun, { align: 'center' });
    g.globalAlpha = 1;
  }
  light() { return { x: this.cx, y: this.y, r: this.solved ? 50 : 34 + this.near * 20, c: this.solved ? PAL.sun : PAL.teal, a: 0.8 }; }
}

class LockCrystal extends Entity {
  constructor(lv, x, y, lock, opt, i) {
    super(lv, x, y, 9, 12);
    this.lock = lock; this.opt = opt; this.i = i; this.state = 'idle'; this.layer = 1; this.weakPoint = false; this.t = i * 0.7; this.fx = 0;
    this.baseY = y; this.cfg = { verb: 'Elegir' }; this.noPrompt = true;
  }
  update(dt) {
    super.update(dt);
    this.y = this.baseY + Math.round(Math.sin(this.t * 2 + this.i) * 2);
    if (this.state === 'gone' || this.state === 'ok') { this.fx += dt; if (this.fx > 0.6) this.dead = true; }
  }
  // solo un tajo directo elige (el pulso cargado atraviesa los cristales sin escoger ninguno)
  // con enemigos cerca los tajos no eligen (así no se escoge sin querer en plena pelea; E sigue eligiendo)
  onHit(h) { if (this.state !== 'idle' || this.lock.busy || (h && h.kind === 'pulse') || (h && h.src === 'saber' && this.lv.dangerNear(90))) return false; this.lock.choose(this); return true; }
  canInteract() { return this.state === 'idle' && !this.lock.busy && !this.lock.solved; }
  interactRect() { return { x: this.x - 6, y: this.y - 4, w: this.w + 12, h: 40 }; }
  interact() { this.lock.choose(this); }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const cols = [PAL.teal, PAL.pink, PAL.sun], base = this.state === 'cracked' ? '#6A7090' : cols[this.i % 3];
    if (this.state === 'gone') g.globalAlpha = Math.max(0, 1 - this.fx * 2);
    const hl = shade(base, 0.35), dk = shade(base, -0.3);
    // cristal facetado (rombo alargado)
    for (let k = 0; k < 12; k++) {
      const ww = k < 4 ? k + 1 : Math.max(1, Math.round((12 - k) * 0.55));
      rect(g, x + 4 - ww, y + k, ww, 1, hl); rect(g, x + 4, y + k, ww + 1, 1, dk);
    }
    rect(g, x + 4, y + 1, 1, 10, '#FFFFFF');
    if (this.state === 'cracked') { px(g, x + 3, y + 4, OUTLINE); px(g, x + 4, y + 5, OUTLINE); px(g, x + 3, y + 6, OUTLINE); px(g, x + 5, y + 8, OUTLINE); }
    if (this.state === 'ok') { g.globalAlpha = 1 - this.fx; pring(g, x + 4, y + 6, Math.round(4 + this.fx * 20), PAL.sun); }
    g.globalAlpha = 1;
  }
  // zona de la etiqueta: se reserva para que globos y avisos no la tapen
  labelRect(cx, cy) {
    if (this.state === 'gone' || this.lock.solved || this.lock.near < 0.05) return null;
    const label = fitText(this.opt.v, 58), key = this.lv.nearby === this ? bindName('interact') : '';
    const kw = key ? textW(key) + 6 : 0, w = textW(label) + 6 + kw;
    // la zona reservada cubre la etiqueta y el cristal (los globos no los tapan)
    return { x: Math.round(this.x + 4 - cx - Math.max(w, 12) / 2), y: Math.round(this.baseY - cy - 15), w: Math.max(w, 12), h: 30, label, key, kw };
  }
  // etiqueta con la respuesta (sin la luz del nivel encima)
  drawOverlay(g, cx, cy) {
    const L = this.labelRect(cx, cy); if (!L) return;
    // la etiqueta muestra la tecla de elegir cuando Lía está junto a este cristal
    const { label, key, kw } = L, w = textW(label) + 6 + kw, x = Math.round(this.x + 4 - cx - w / 2), y = Math.round(this.y - cy - 13);
    g.globalAlpha = this.lock.near;
    rect(g, x, y, w, 10, this.state === 'cracked' ? '#2A2F48' : '#0B1020'); strokeRect(g, x, y, w, 10, this.state === 'cracked' ? '#565E8C' : [PAL.teal, PAL.pink, PAL.sun][this.i % 3]);
    if (key) { rect(g, x + 1, y + 1, kw - 2, 8, PAL.cream); drawText(g, key, x + 3, y + 2, PAL.ink); }
    drawText(g, label, x + 3 + kw, y + 2, this.state === 'cracked' ? '#8A8FB0' : PAL.cream);
    g.globalAlpha = 1;
  }
  light() { return this.state === 'cracked' ? null : { x: this.x + 4, y: this.y + 6, r: 16, c: [PAL.teal, PAL.pink, PAL.sun][this.i % 3], a: 0.7 }; }
}

// holograma con el código: se fija arriba en pantalla mientras Lía está junto al cofre
// Holograma en dos columnas: el código a la izquierda y la pregunta a la derecha.
// Va arriba en pantalla; si ahí taparía los cristales, baja bajo el suelo del cofre.
const LOCK_SIDE = 150;
function lockTip(lv) { return lv.lensT > 0.5 ? 'LENTE: ' + lv.lockPanel.q.hint : 'Golpea (' + bindName('attack') + ') o elige (' + bindName('interact') + ') el cristal con tu respuesta. ' + bindName('hint') + ' = cómo se juega.'; }
function lockPanelRect(lock) {
  const q = lock.q, lv = lock.lv;
  const codeW = Math.max(...q.code.map(l => textW(l))) + 24;
  const w = Math.min(W - 16, Math.max(codeW + LOCK_SIDE + 22, textW('CERRADURA DE CÓDIGO · ' + q.title) + 20));
  const side = w - codeW - 22;
  const askL = wrapPlain(q.ask, side).length, tipL = wrapPlain(lockTip(lv), side).length;
  const h = 18 + Math.max(q.code.length * 10, askL * 10 + 4 + tipL * 10) + 4;
  const x = Math.round(W / 2 - w / 2);
  const cy = Level.camRef.y, labelTop = lock.y - 38 - cy, groundY = lock.y + lock.h - cy;
  let y = 24;
  if (y + h > labelTop - 3 && groundY + 8 + h < H - 22) y = Math.round(groundY + 8);
  return { x, y, w, h, codeW, side };
}
function drawLockPanel(g, lv) {
  const lock = lv.lockPanel; if (!lock || lock.near < 0.02 || lock.solved || Dlg.box) return;
  const q = lock.q, r = lockPanelRect(lock), a = lock.near;
  g.globalAlpha = a;
  panel(g, r.x, r.y, r.w, r.h, { border: PAL.teal, accent: PAL.sun, accentW: 40 });
  drawText(g, fitText('CERRADURA DE CÓDIGO · ' + q.title, r.w - 16), r.x + 8, r.y + 5, PAL.teal);
  // código con números de línea
  q.code.forEach((ln, i) => {
    const yy = r.y + 17 + i * 10;
    drawText(g, String(i + 1), r.x + 12, yy, '#565E8C', { align: 'right' });
    drawRichLine(g, parseRich(ln, PAL.cream), r.x + 18, yy);
  });
  // pregunta y cómo responder
  const sx = r.x + r.codeW + 12;
  rect(g, sx - 6, r.y + 16, 1, r.h - 20, '#2A3570');
  let yy = r.y + 17;
  yy += drawPara(g, q.ask, sx, yy, r.side, PAL.sun, { lh: 10 }) + 4;
  drawPara(g, lockTip(lv), sx, yy, r.side, lv.lensT > 0.5 ? PAL.lime : '#8C93B8', { lh: 10 });
  g.globalAlpha = 1;
}

// colocación: en suelo llano y despejado, lejos de NPCs, terminales, salidas y del inicio
function placeLocks(lv) {
  const def = lv.def;
  if (def.noHud || def.region !== lv.key || !LOCK_GEN[lv.key]) return;
  const avoid = [];
  for (const e of lv.entities) {
    const isTerm = e instanceof Terminal && !(e instanceof Prop);
    if (e instanceof NPC || isTerm || e instanceof Exit || e instanceof Checkpoint || e instanceof Plate || e instanceof Mover || e instanceof Vent || e instanceof PackItem || e instanceof Chispa) avoid.push({ x: (e.x + e.w / 2) / TILE, y: (e.y + e.h) / TILE, r: 5 });
  }
  const sp = lv.spawn; avoid.push({ x: sp.x / TILE, y: sp.y / TILE, r: 14 });
  const free = (x, y) => lv.tile(x, y) === '.';
  const solid = (x, y) => lv.tile(x, y) === '#';
  const spots = [];
  for (let y = 3; y < lv.h - 1; y++) for (let x = 6; x < lv.w - 6; x++) {
    let ok = true;
    for (let dx = -2; dx <= 2 && ok; dx++) { if (!solid(x + dx, y + 1)) ok = false; for (let dy = 0; dy < 4 && ok; dy++) if (!free(x + dx, y - dy)) ok = false; }
    if (!ok || avoid.some(a => Math.abs(a.x - x) < a.r && Math.abs(a.y - y - 1) < 5)) continue;
    spots.push({ x, y });
  }
  if (!spots.length) return;
  // dos cofres por isla: hacia el 40 % y el 75 % del recorrido
  const picked = [];
  for (const f of [0.4, 0.75]) {
    const tx = lv.w * f;
    let best = null, bd = 1e9;
    for (const s of spots) { const d = Math.abs(s.x - tx); if (d < bd && !picked.some(p => Math.abs(p.x - s.x) < 20)) { bd = d; best = s; } }
    if (best) picked.push(best);
  }
  picked.forEach((s, i) => lv.addEntity(new CodeLock(lv, s.x * TILE + 8, (s.y + 1) * TILE, lv.key + '_' + i)));
}

// ---------------------------------------------------------------------
//  TRAZA: tras un fallo se ejecuta el programa paso a paso
// ---------------------------------------------------------------------
class TraceScene {
  constructor(q, chosen, done) {
    this.q = q; this.chosen = chosen; this.done = done; this.t = 0; this.step = 0; this.auto = 0; this.opaque = false; this.nav = true;
    UI.focus = null;
  }
  update(dt) {
    this.t += dt;
    const n = this.q.trace.length;
    if (this.step < n - 1) { this.auto += dt; if (this.auto > 1.1) { this.auto = 0; this.step++; AudioSys.sfx('tick', this.step); } }
    if (Input.hit('right')) { this.step = Math.min(n - 1, this.step + 1); this.auto = 0; }
    if (Input.hit('left')) { this.step = Math.max(0, this.step - 1); this.auto = 0; }
    if (G.autoDialog || (this.t > 0.6 && Input.hit('back'))) this.close();
  }
  close() { Input.consume(); Scenes.pop(); this.done(); }
  draw(g) {
    const q = this.q, n = q.trace.length;
    g.globalAlpha = Math.min(0.8, this.t * 3); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const w = 440, x = (W - w) / 2;
    const codeH = q.code.length * 11 + 8, stateRows = Math.min(5, n);
    const h = 22 + codeH + 8 + 12 + stateRows * 10 + 8 + 46 + 22;
    const y = Math.round((H - h) / 2 + (1 - easeOut(clamp(this.t * 3, 0, 1))) * 20);
    panel(g, x, y, w, h, { border: PAL.coral, accent: PAL.coral, accentW: 60 });
    drawText(g, 'TRAZA DEL PROGRAMA · ' + q.title, x + 10, y + 7, PAL.coral);
    drawText(g, 'PASO ' + (this.step + 1) + '/' + n, x + w - 10, y + 7, PAL.sun, { align: 'right' });
    // código con la línea que se ejecuta resaltada
    const cur = q.trace[this.step][0];
    let yy = y + 20;
    panel(g, x + 8, yy, w - 16, codeH, { bg: '#0B1020', border: '#2A3570', flat: true });
    q.code.forEach((ln, i) => {
      const ly = yy + 5 + i * 11;
      if (i === cur) { rect(g, x + 9, ly - 2, w - 18, 11, 'rgba(255,216,74,0.18)'); drawText(g, '▶', x + 12, ly, PAL.sun); }
      drawText(g, String(i + 1), x + 28, ly, '#565E8C', { align: 'right' });
      drawRichLine(g, parseRich(ln, PAL.cream), x + 34, ly);
    });
    // estado: los últimos pasos ejecutados
    yy += codeH + 6;
    drawText(g, 'ESTADO', x + 10, yy, PAL.teal);
    yy += 11;
    const from = Math.max(0, this.step - stateRows + 1);
    for (let i = from; i <= this.step; i++, yy += 10) drawText(g, fitText((i + 1) + '. ' + q.trace[i][1], w - 24), x + 14, yy, i === this.step ? PAL.sun : '#8C93B8');
    yy = y + 22 + codeH + 8 + 12 + stateRows * 10 + 6;
    // explicación del error típico
    rect(g, x + 8, yy - 3, w - 16, 1, '#2A3570');
    drawText(g, 'Elegiste ' + this.chosen.v + ' ✗    Respuesta correcta: ' + (this.step >= n - 1 ? q.answer + ' ✓' : '(mira la traza...)'), x + 10, yy + 2, PAL.cream);
    drawPara(g, '{r}Por qué:{/} ' + (this.chosen.why || 'traza el programa línea a línea.'), x + 10, yy + 13, w - 20, PAL.cream);
    // botones
    const by = y + h - 20;
    if (UI.btn(g, 'trprev', x + 10, by, 70, 14, '◀ PASO', { color: PAL.teal })) { this.step = Math.max(0, this.step - 1); this.auto = 0; }
    if (UI.btn(g, 'trnext', x + 86, by, 70, 14, 'PASO ▶', { color: PAL.teal })) { this.step = Math.min(n - 1, this.step + 1); this.auto = 0; }
    if (UI.btn(g, 'trok', x + w - 150, by, 140, 14, 'OTRA VARIANTE ↻', { color: PAL.lime, primary: true })) this.close();
  }
}

// ---------------------------------------------------------------------
//  CÓMO SE JUEGA: tarjeta ilustrada de los cofres de código
// ---------------------------------------------------------------------
class LockHelpScene {
  constructor() { this.opaque = false; this.t = 0; this.nav = true; UI.focus = null; this.focusN = 3; }
  update(dt) {
    this.t += dt;
    if (G.autoDialog) { Scenes.pop(); return; }
    if (this.t > 0.4 && (Input.hit('back') || Input.hit('hint'))) { Input.consume(); Scenes.pop(); }
  }
  draw(g) {
    g.globalAlpha = Math.min(0.8, this.t * 3); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const w = 400, h = 222, x = (W - w) / 2, y = (H - h) / 2 + Math.round((1 - easeOut(clamp(this.t * 3, 0, 1))) * 16);
    panel(g, x, y, w, h, { border: PAL.sun, accent: PAL.sun, accentW: 70 });
    drawText(g, 'COFRE DE CÓDIGO · ¿CÓMO SE JUEGA?', x + w / 2, y + 7, PAL.sun, { align: 'center' });
    // ilustración: holograma con código, cofre y tres cristales
    const ix = x + 12, iy = y + 22;
    rect(g, ix, iy, 140, 96, '#0B1020'); strokeRect(g, ix, iy, 140, 96, '#2A3570');
    rect(g, ix + 10, iy + 6, 120, 34, 'rgba(48,225,197,0.15)'); strokeRect(g, ix + 10, iy + 6, 120, 34, PAL.teal);
    drawText(g, 'x ← 2', ix + 16, iy + 10, PAL.cream); drawText(g, 'x ← x + 3', ix + 16, iy + 20, PAL.cream); drawText(g, '¿x al final?', ix + 16, iy + 30, PAL.sun);
    const cols = [PAL.teal, PAL.pink, PAL.sun], vals = ['3', '5', '6'];
    for (let i = 0; i < 3; i++) {
      const cx = ix + 30 + i * 40, cy = iy + 54 + Math.round(Math.sin(this.t * 2 + i) * 2);
      for (let k = 0; k < 12; k++) { const ww = k < 4 ? k + 1 : Math.max(1, Math.round((12 - k) * 0.55)); rect(g, cx + 4 - ww, cy + k, ww, 1, shade(cols[i], 0.35)); rect(g, cx + 4, cy + k, ww + 1, 1, shade(cols[i], -0.3)); }
      rect(g, cx - 2, cy - 11, 13, 9, '#0B1020'); strokeRect(g, cx - 2, cy - 11, 13, 9, cols[i]); drawText(g, vals[i], cx + 4, cy - 9, PAL.cream, { align: 'center' });
      if (i === 1 && Math.floor(this.t * 2) % 2) strokeRect(g, cx - 4, cy - 13, 17, 28, PAL.lime);
    }
    rect(g, ix + 58, iy + 78, 24, 12, '#6B4A2A'); rect(g, ix + 56, iy + 74, 28, 5, '#8B5A3C'); rect(g, ix + 68, iy + 77, 3, 4, PAL.sun);
    const f = Spr.lia.slash[1]; g.drawImage(f.r, ix + 18, iy + 66);
    drawText(g, '✓ 5', ix + 104, iy + 80, PAL.lime);
    // pasos
    const tx = x + 162, tw = w - 174;
    let yy = y + 24;
    const step = (n, txt) => { drawText(g, n, tx, yy, PAL.sun); yy += drawPara(g, txt, tx + 12, yy, tw - 12, PAL.cream, { lh: 10 }) + 5; };
    step('1', '{c}LEE{/} el programa del holograma, línea a línea, de arriba abajo.');
    step('2', '{c}CALCULA{/} qué valor queda al final. Con la Lente (' + bindName('lens') + ') el holograma te da una pista.');
    step('3', '{c}GOLPEA{/} con el sable (' + bindName('attack') + ') el cristal con tu respuesta, o acércate y pulsa ' + bindName('interact') + '.');
    yy += 2;
    drawPara(g, '¿Fallaste? Verás el programa {y}paso a paso{/} y llegará otra versión con otros números.', x + 12, y + 126, w - 24, PAL.cream, { lh: 10 });
    drawPara(g, 'Premio: {p}núcleos de forja ◆{/} para mejorar tu sable en el Taller de Lía.', x + 12, y + 150, w - 24, PAL.cream, { lh: 10 });
    drawText(g, 'Junto a un cofre, ' + bindName('hint') + ' vuelve a mostrar esta ayuda.', x + 12, y + 174, '#8C93B8');
    if (UI.btn(g, 'lhok', x + w / 2 - 60, y + h - 24, 120, 16, '¡ENTENDIDO!', { primary: true, color: PAL.lime })) { Scenes.pop(); }
    if (this.focusN > 0) { UI.focus = 'lhok'; this.focusN--; }
  }
}
