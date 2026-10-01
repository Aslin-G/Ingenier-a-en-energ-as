// =====================================================================
//  TALLER DE LÍA (casa base) · PATIO DE ENTRENAMIENTO
//  El taller es una habitación viva: por la ventana se ve el archipiélago
//  (cada isla restaurada enciende sus luces), los recuerdos de cada isla
//  guardan un dato real de su energía, el tablero reúne las pegatinas, la
//  casa funciona con su panel y su batería, y la lámpara se puede apagar.
//  Desde aquí se sale al patio de entrenamiento, a los simuladores y a la
//  forja del Lumisable.
// =====================================================================
const COSMETICS = {
  pack: { name: 'Mochila solar', region: 'solaria', desc: 'Pequeños paneles que brillan al sol.' },
  cape: { name: 'Capa eólica', region: 'aeris', desc: 'Ondea con cualquier brisa.' },
  boots: { name: 'Botas hidro', region: 'hydria', desc: 'Impermeables y con estilo.' },
  goggles: { name: 'Gafas Debug', region: 'gea', desc: 'Las gafas bajadas: modo concentración.' }
};
// recuerdos de cada isla: cada uno guarda un dato real (y comprobable) de su energía
const SOUVENIRS = {
  puerto: { name: 'Faro de juguete', fact: 'La energía no se crea ni se destruye: se transforma. Un faro solar convierte la luz en electricidad, la guarda en su batería y de noche la vuelve luz.' },
  valle: { name: 'Molinillo', fact: 'Un molino transforma el giro de sus aspas. Antes molía grano o bombeaba agua; un aerogenerador mueve un generador y produce electricidad.' },
  solaria: { name: 'Mini panel solar', fact: 'Un panel solar de silicio convierte en electricidad cerca del 20 % de la luz que recibe. Rinde más bien orientado al sol y sin sombras.' },
  aeris: { name: 'Cometa', fact: 'La potencia del viento crece con el cubo de su velocidad: con el doble de viento hay unas 8 veces más potencia (2 × 2 × 2).' },
  hydria: { name: 'Frasco de cascada', fact: 'Una central hidroeléctrica aprovecha la energía potencial del agua: cuanto más alta la caída y mayor el caudal, más potencia.' },
  bioloop: { name: 'Maceta de compost', fact: 'La biomasa guarda energía del sol que las plantas capturaron con la fotosíntesis. Un biodigestor convierte residuos en biogás.' },
  gea: { name: 'Cristal cálido', fact: 'Bajo tierra la temperatura sube, en promedio, unos 25-30 °C por cada kilómetro de profundidad. La geotermia aprovecha ese calor.' },
  h2: { name: 'Barquito H2', fact: 'El hidrógeno verde se obtiene separando el agua con electricidad renovable (electrólisis). Es un vector: transporta energía, no la crea.' },
  bateria: { name: 'Pila de neón', fact: 'Una batería no produce energía: la guarda en forma química. Las de ion-litio devuelven alrededor del 90 % de la energía que se les carga.' },
  prisma: { name: 'Prisma', fact: 'Una microrred une fuentes, baterías y consumos. Puede funcionar conectada a la red o aislada (en isla) si la red principal falla.' },
  faro: { name: 'Foto del festival', fact: 'Ninguna fuente es perfecta sola: de noche no hay sol y el viento no siempre sopla. Combinarlas con almacenamiento da una red confiable.' }
};
const STICKER_ICON = {
  first_algo: 'chip', no_infinite: 'clock', wind_master: 'wind', debugger: 'eye', imperfect: 'heart', no_hints: 'star', collector: 'spark',
  beta_friend: 'people', menta: 'leaf', reuse: 'gear', safe_states: 'temp', vector: 'drop', sorter: 'battery', microgrid: 'bolt', curious: 'question',
  humble: 'heart', lab: 'flag', sidequests: 'home', parry: 'shield', bosses: 'flag', reader: 'eye', locksmith: 'lock', memory: 'star', streak: 'clock',
  smith: 'fire', simulators: 'sun', powerful: 'bolt', minis: 'bug', trainer: 'flower'
};
const fmtSec = t => fmt(t, 1).replace('.', ',') + ' s';

// ---------- disposición ----------
const TL = {
  win: { x: 12, y: 30, w: 106, h: 78 }, glass: { x: 16, y: 34, w: 98, h: 70 },
  shelfX: 126, shelfW: 176, shelf1: 72, shelf2: 114,
  board: { x: 312, y: 30, w: 158, h: 88 },
  ward: { x: 10, y: 122, w: 110, h: 77 },
  peg: { x: 130, y: 128, w: 66, h: 26 },
  mon: { x: 244, y: 126, w: 62, h: 36 },
  lamp: { x: 182, y: 148, w: 20, h: 25 },
  note: { x: 8, y: 222, w: 396, h: 44 }
};
// posición de cada recuerdo (centro y altura del estante): 6 arriba, 5 abajo
const souvenirSlot = i => i < 6 ? { x: TL.shelfX + 17 + i * 28.4, y: TL.shelf1 } : { x: TL.shelfX + 22 + (i - 6) * 33, y: TL.shelf2 };
const stickerPos = i => ({ x: TL.board.x + 15 + (i % 10) * 14.3, y: TL.board.y + 26 + Math.floor(i / 10) * 15 });

// ---------- arte del fondo (se pinta una vez, a doble resolución) ----------
const TallerArt = { back: null, front: null };
function tallerLayer(fn) { const c = makeCanvas(W * RES, H * RES); c.g.setTransform(RES, 0, 0, RES, 0, 0); fn(c.g); return c; }
function paintTallerBack(g) {
  const rng = mulberry32(1337);
  // pared de tablas verticales con veta, nudos y clavos
  const tones = ['#6B4A2C', '#664527', '#714F2F', '#684829', '#6E4C2D'];
  for (let i = 0, x = 0; x < W; i++, x += 20) {
    rect(g, x, 0, 20, 200, tones[i % tones.length]);
    rect(g, x, 0, 1, 200, '#47301B');
    g.fillStyle = 'rgba(255,220,170,0.08)'; g.fillRect(x + 1, 0, 0.5, 200);
    for (let k = 0; k < 18; k++) {
      g.fillStyle = rng() < 0.6 ? 'rgba(48,26,10,0.25)' : 'rgba(255,214,160,0.09)';
      g.fillRect(x + 2 + Math.floor(rng() * 32) / 2, Math.floor(rng() * 380) / 2, 0.5, 4 + rng() * 20);
    }
    if (rng() < 0.55) { const kx = Math.round(x + 5 + rng() * 10), ky = Math.round(16 + rng() * 120); pellipse(g, kx, ky, 2, 1, '#523419'); g.fillStyle = '#3C2410'; g.fillRect(kx - 0.5, ky - 0.5, 1, 1); }
    g.fillStyle = '#A89488'; g.fillRect(x + 9.5, 14, 1, 1); g.fillRect(x + 9.5, 141, 1, 1);
    g.fillStyle = '#3A2414'; g.fillRect(x + 10, 15, 0.5, 0.5); g.fillRect(x + 10, 142, 0.5, 0.5);
  }
  // viga del techo
  rect(g, 0, 0, W, 9, '#3E2615'); rect(g, 0, 1, W, 1, '#5A3A22'); rect(g, 0, 9, W, 1, '#24140A');
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(20,10,4,' + (0.22 - i * 0.05) + ')'; g.fillRect(0, 10 + i, W, 1); }
  // zócalo de paneles
  rect(g, 0, 152, W, 44, '#5A3820');
  for (let x = 4; x < W; x += 60) { strokeRect(g, x, 158, 52, 32, '#4A2C16'); rect(g, x + 1, 159, 50, 1, '#6E4A2A'); rect(g, x + 1, 159, 1, 30, '#654226'); }
  rect(g, 0, 148, W, 4, '#8B5A3C'); rect(g, 0, 148, W, 1, '#B07A4A'); rect(g, 0, 152, W, 1, '#3A2010');
  rect(g, 0, 194, W, 6, '#3A2414'); rect(g, 0, 194, W, 1, '#5A3A22');
  // suelo de tablas con perspectiva
  const ys = [200, 205, 211, 218, 226, 235, 245, 256, 270];
  for (let r = 0; r < ys.length - 1; r++) {
    const y0 = ys[r], h = ys[r + 1] - y0;
    rect(g, 0, y0, W, h, r % 2 ? '#87573A' : '#8E5D3E');
    rect(g, 0, y0, W, 1, '#5E3A22');
    g.fillStyle = 'rgba(255,220,170,0.1)'; g.fillRect(0, y0 + 1, W, 0.5);
    const step = 46 + r * 14, off = (r * 37) % step;
    for (let x = -off; x < W; x += step) rect(g, x, y0, 1, h, '#6A4128');
    for (let k = 0; k < 12; k++) { g.fillStyle = 'rgba(60,30,12,0.22)'; g.fillRect(Math.floor(rng() * W * 2) / 2, y0 + 1.5 + Math.floor(rng() * (h - 3) * 2) / 2, 4 + rng() * 14, 0.5); }
  }
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(20,10,4,' + (0.3 - i * 0.05) + ')'; g.fillRect(0, 200 + i, W, 1); }
  // alfombra tejida bajo Lía
  pellipse(g, 236, 213, 62, 9, '#5A1E2A'); pellipse(g, 236, 212, 60, 8, '#8A2E3A'); pellipse(g, 236, 212, 52, 6, '#C24A4A'); pellipse(g, 236, 212, 40, 4, '#8A2E3A'); pellipse(g, 236, 212, 26, 2, '#E8B04A');
  for (let i = -48; i <= 48; i += 6) { g.fillStyle = '#E8B04A'; g.fillRect(236 + i, 212 + (i / 6 % 2 ? -5 : 5), 1, 0.5); }
  for (let k = -4; k <= 4; k += 1) { g.fillStyle = '#D8C8A0'; g.fillRect(173.5 - Math.abs(k) * 0.3, 212 + k, 1.5, 0.5); g.fillRect(297 + Math.abs(k) * 0.3, 212 + k, 1.5, 0.5); }
}
function paintTallerFront(g) {
  const rng = mulberry32(4242);
  // ---- ventana: marco, parteluz, alféizar, cortinas y una planta ----
  const Wn = TL.win;
  const frame = '#4A2E18', bevel = '#7A5232';
  rect(g, Wn.x, Wn.y, Wn.w, 4, frame); rect(g, Wn.x, Wn.y + Wn.h - 4, Wn.w, 4, frame);
  rect(g, Wn.x, Wn.y, 4, Wn.h, frame); rect(g, Wn.x + Wn.w - 4, Wn.y, 4, Wn.h, frame);
  rect(g, Wn.x + 1, Wn.y + 1, Wn.w - 2, 1, bevel); rect(g, Wn.x + 3, Wn.y + 3, Wn.w - 6, 1, '#2E1C0E');
  rect(g, Wn.x + Wn.w / 2 - 1, Wn.y + 4, 2, Wn.h - 8, frame); rect(g, Wn.x + Wn.w / 2 - 1, Wn.y + 4, 1, Wn.h - 8, bevel);
  rect(g, Wn.x + 4, Wn.y + 30, Wn.w - 8, 2, frame); rect(g, Wn.x + 4, Wn.y + 30, Wn.w - 8, 1, bevel);
  rect(g, Wn.x - 4, Wn.y + Wn.h - 3, Wn.w + 8, 5, '#9A6A40'); rect(g, Wn.x - 4, Wn.y + Wn.h - 3, Wn.w + 8, 1, '#C08A58'); rect(g, Wn.x - 4, Wn.y + Wn.h + 2, Wn.w + 8, 1, '#4A2E18');
  g.fillStyle = 'rgba(20,10,4,0.25)'; g.fillRect(Wn.x - 4, Wn.y + Wn.h + 3, Wn.w + 8, 2);
  // barra y cortinas recogidas con un lazo
  rect(g, 4, 26, 122, 2, '#3A2414'); pcircle(g, 4, 27, 2, '#C9A060'); pcircle(g, 126, 27, 2, '#C9A060');
  const curtain = (x0, dir) => {
    for (let y = 28; y <= 104; y++) {
      const tie = 68, w = y < tie ? 16 - (y - 28) / (tie - 28) * 9 : 7 + (y - tie) / (104 - tie) * 6;
      for (let i = 0; i < w; i++) {
        const xx = dir > 0 ? x0 + i : x0 - i - 1;
        g.fillStyle = (i % 4) < 2 ? '#B8435A' : '#9A3348';
        g.fillRect(xx, y, 1, 1);
      }
      g.fillStyle = '#D8607A'; g.fillRect(dir > 0 ? x0 + w - 1 : x0 - w, y, 0.5, 1);
    }
    for (let i = 0; i < 9; i++) rect(g, dir > 0 ? x0 + i : x0 - i - 1, 67, 1, 3, i % 3 ? '#E8B04A' : '#C8902A');
    g.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = 30; y < 104; y += 2) g.fillRect(dir > 0 ? x0 + 1 : x0 - 2, y, 0.5, 1);
  };
  curtain(6, 1); curtain(124, -1);
  // maceta con helecho en el alféizar
  for (let r = 0; r < 7; r++) rect(g, 96 + r * 0.25, 99 + r, 10 - r * 0.5, 1, r < 2 ? '#D8784A' : '#C0623A');
  [[-5, -6], [-3, -9], [0, -10], [3, -8], [5, -5], [-1, -7], [2, -6]].forEach(([dx, dy], k) => { hdLine(g, 101, 99, 101 + dx, 99 + dy, k % 2 ? '#3FA85A' : '#66D66A'); hdPx(g, 101 + dx, 99 + dy, '#9BE38A'); });
  // ---- estantes con ménsulas ----
  for (const y of [TL.shelf1, TL.shelf2]) {
    rect(g, TL.shelfX, y, TL.shelfW, 4, '#B07A4A'); rect(g, TL.shelfX, y, TL.shelfW, 1, '#D8A06A'); rect(g, TL.shelfX, y + 4, TL.shelfW, 1, '#5A3A20');
    g.fillStyle = 'rgba(20,10,4,0.25)'; g.fillRect(TL.shelfX, y + 5, TL.shelfW, 3);
    for (const bx of [TL.shelfX + 8, TL.shelfX + TL.shelfW - 14]) for (let k = 0; k < 6; k++) rect(g, bx, y + 5 + k, 6 - k, 1, k ? '#7A4E2A' : '#8B5A3C');
  }
  // ---- tablero de corcho ----
  const B = TL.board;
  rect(g, B.x, B.y, B.w, B.h, '#6A4224'); rect(g, B.x, B.y, B.w, 1, '#8B5A3C'); rect(g, B.x, B.y + B.h - 1, B.w, 1, '#3A2010');
  rect(g, B.x + 3, B.y + 3, B.w - 6, B.h - 6, '#B98A50');
  hdSpeckle(g, B.x + 3, B.y + 3, B.w - 6, B.h - 6, 900, '#A2743E', 11); hdSpeckle(g, B.x + 3, B.y + 3, B.w - 6, B.h - 6, 500, '#CDA066', 12);
  rect(g, B.x + 3, B.y + 3, B.w - 6, 1, '#8E6236');
  g.fillStyle = 'rgba(20,10,4,0.25)'; g.fillRect(B.x + 2, B.y + B.h, B.w, 2);
  // tira de papel del título y nota inferior
  rect(g, B.x + 30, B.y + 6, 98, 11, '#FFF3D7'); rect(g, B.x + 30, B.y + 17, 98, 1, 'rgba(60,30,10,0.3)');
  pcircle(g, B.x + 33, B.y + 8, 1, PAL.coral); pcircle(g, B.x + 125, B.y + 8, 1, PAL.teal);
  rect(g, B.x + 8, B.y + 70, 142, 12, '#F4E6C0'); rect(g, B.x + 8, B.y + 82, 142, 1, 'rgba(60,30,10,0.3)');
  pcircle(g, B.x + 79, B.y + 71, 1, PAL.sun);
  // ---- armario abierto ----
  const A = TL.ward;
  rect(g, A.x - 6, A.y + 12, 6, A.h - 14, '#6E4426'); rect(g, A.x + A.w, A.y + 12, 6, A.h - 14, '#6E4426');
  rect(g, A.x - 6, A.y + 12, 1, A.h - 14, '#8B5A3C'); rect(g, A.x + A.w + 5, A.y + 12, 1, A.h - 14, '#4A2E18');
  pcircle(g, A.x - 3, A.y + 44, 1, '#E8C070'); pcircle(g, A.x + A.w + 3, A.y + 44, 1, '#E8C070');
  rect(g, A.x, A.y, A.w, A.h, '#5E3A22'); rect(g, A.x - 2, A.y, A.w + 4, 10, '#6E4426'); rect(g, A.x - 2, A.y, A.w + 4, 1, '#9A6A40'); rect(g, A.x - 2, A.y + 9, A.w + 4, 1, '#3A2010');
  rect(g, A.x + 5, A.y + 11, A.w - 10, A.h - 13, '#2A190E');
  rect(g, A.x + 6, A.y + 13, A.w - 12, 1, '#B8A090');
  for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(0,0,0,' + (0.4 - i * 0.06) + ')'; g.fillRect(A.x + 5, A.y + 11 + i, A.w - 10, 1); }
  // ---- tablero de herramientas sobre el banco ----
  const P = TL.peg;
  rect(g, P.x, P.y, P.w, P.h, '#C8A070'); strokeRect(g, P.x, P.y, P.w, P.h, '#7A5232');
  for (let y = P.y + 3; y < P.y + P.h - 1; y += 4) for (let x = P.x + 3; x < P.x + P.w - 1; x += 4) { g.fillStyle = '#8B6A40'; g.fillRect(x, y, 1, 1); }
  // llave inglesa, martillo, destornillador, alicates, cable y multímetro
  rect(g, P.x + 6, P.y + 6, 2, 16, '#A8B0C8'); rect(g, P.x + 4, P.y + 3, 6, 3, '#A8B0C8'); rect(g, P.x + 6, P.y + 3, 2, 2, '#C8A070'); rect(g, P.x + 6, P.y + 6, 1, 16, '#D8E0F0');
  rect(g, P.x + 16, P.y + 6, 2, 17, '#8B5A3C'); rect(g, P.x + 13, P.y + 3, 8, 4, '#7C86A8'); rect(g, P.x + 13, P.y + 3, 8, 1, '#B8C2E6');
  rect(g, P.x + 26, P.y + 4, 3, 7, '#E0484E'); rect(g, P.x + 26, P.y + 4, 1, 7, '#FF8A8A'); rect(g, P.x + 27, P.y + 11, 1, 10, '#C9D2F0');
  hdLine(g, P.x + 34, P.y + 4, P.x + 37, P.y + 12, '#FF9D42'); hdLine(g, P.x + 40, P.y + 4, P.x + 37, P.y + 12, '#FF9D42'); rect(g, P.x + 36, P.y + 12, 2, 6, '#8C93B8');
  pring(g, P.x + 50, P.y + 11, 5, '#30E1C5'); pring(g, P.x + 50, P.y + 11, 3, '#1FA89A'); rect(g, P.x + 50, P.y + 16, 1, 6, '#30E1C5');
  rect(g, P.x + 57, P.y + 4, 7, 12, '#FFD84A'); rect(g, P.x + 58, P.y + 5, 5, 3, '#22306B'); pcircle(g, P.x + 60, P.y + 11, 1, '#3A3058'); rect(g, P.x + 58, P.y + 16, 1, 6, '#E0484E'); rect(g, P.x + 62, P.y + 16, 1, 6, '#2A2A3A');
  // ---- banco de trabajo ----
  rect(g, 128, 172, 76, 4, '#B07A4A'); rect(g, 128, 172, 76, 1, '#D8A06A'); rect(g, 128, 176, 76, 4, '#8B5A3C'); rect(g, 128, 180, 76, 1, '#4A2E18');
  rect(g, 150, 176, 22, 4, '#7A4E2A'); px(g, 161, 178, '#E8C070');
  rect(g, 131, 180, 3, 19, '#6B4A2A'); rect(g, 198, 180, 3, 19, '#6B4A2A'); rect(g, 131, 190, 70, 2, '#7A4E2A');
  rect(g, 142, 183, 14, 7, '#C0392B'); rect(g, 142, 183, 14, 1, '#E86A5A'); rect(g, 147, 182, 4, 1, '#3A2414');
  pring(g, 180, 186, 3, '#30E1C5'); pring(g, 180, 186, 2, '#1FA89A');
  g.fillStyle = 'rgba(20,10,4,0.3)'; g.fillRect(128, 199, 76, 1);
  // tornillo de banco, placa de circuito, taza y soldador
  rect(g, 130, 165, 10, 7, '#7C86A8'); rect(g, 130, 165, 10, 1, '#B8C2E6'); rect(g, 128, 168, 2, 1, '#565E8C');
  rect(g, 144, 168, 16, 4, '#1F7A4A'); rect(g, 144, 168, 16, 1, '#3FA85A'); rect(g, 147, 169, 3, 2, '#2A2A3A'); rect(g, 152, 169, 4, 2, '#2A2A3A');
  for (let i = 0; i < 6; i++) px(g, 145 + i * 2.5, 171, '#E8C070');
  rect(g, 164, 166, 5, 6, '#FFF3D7'); rect(g, 169, 167, 1, 3, '#FFF3D7'); rect(g, 164, 166, 5, 1, '#5A3A20'); rect(g, 165, 168, 3, 1, PAL.pink);
  rect(g, 172, 170, 6, 2, '#565E8C'); hdLine(g, 173, 170, 178, 165, '#3A3058'); hdLine(g, 178, 165, 181, 163, '#C9D2F0');
  // ---- lámpara articulada ----
  const L = TL.lamp;
  rect(g, L.x + 10, L.y + 22, 9, 2, '#3A3058'); rect(g, L.x + 13, L.y + 21, 3, 1, '#565E8C');
  hdLine(g, L.x + 14, L.y + 21, L.x + 17, L.y + 10, '#C9D2F0'); hdLine(g, L.x + 17, L.y + 10, L.x + 9, L.y + 4, '#C9D2F0');
  pcircle(g, L.x + 17, L.y + 10, 1, '#565E8C');
  // ---- pantalla de la casa solar ----
  const M = TL.mon;
  rect(g, M.x + M.w / 2 - 2, M.y + M.h, 4, 3, '#3A3058');
  rect(g, M.x, M.y, M.w, M.h, '#22306B'); strokeRect(g, M.x, M.y, M.w, M.h, '#3E4C8A'); rect(g, M.x + 1, M.y + 1, M.w - 2, 1, '#6A7BC4');
  rect(g, M.x + 2, M.y + 2, M.w - 4, M.h - 4, '#0A1430');
  // cable de la pantalla a la pared
  hdLine(g, M.x + M.w - 6, M.y + M.h, M.x + M.w - 3, 152, '#2A2A3A');
  // ---- placa del título colgada de la viga ----
  rect(g, 172, 9, 1, 4, '#C9A060'); rect(g, 308, 9, 1, 4, '#C9A060');
  rect(g, 164, 12, 152, 17, '#8B5A3C'); rect(g, 164, 12, 152, 1, '#B07A4A'); rect(g, 164, 28, 152, 1, '#4A2E18'); strokeRect(g, 166, 14, 148, 13, '#6B4A2A');
  for (let k = 0; k < 10; k++) { g.fillStyle = 'rgba(48,26,10,0.25)'; g.fillRect(168 + rng() * 140, 15 + Math.floor(rng() * 22) / 2, 6 + rng() * 14, 0.5); }
  g.fillStyle = 'rgba(20,10,4,0.25)'; g.fillRect(166, 29, 150, 2);
}

// ---------- recuerdos ilustrados (x = centro, y = estante) ----------
const SOUVENIR_DRAW = {
  puerto(g, x, y, t) {
    pellipse(g, x, y - 1, 6, 1, '#565E8C');
    for (let k = 0; k < 12; k++) { const hw = 3.5 - k * 0.12; g.fillStyle = Math.floor(k / 3) % 2 ? '#FFF3D7' : '#E0484E'; g.fillRect(x - hw, y - 2 - k, hw * 2, 1); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 2.5, y - 13, 0.5, 11);
    rect(g, x - 4, y - 15, 8, 1, '#22306B');
    const on = Math.sin(t * 3) > -0.3;
    rect(g, x - 2, y - 18, 4, 3, on ? PAL.sun : '#8A7A4A'); rect(g, x - 3, y - 19, 6, 1, '#E0484E'); rect(g, x - 1, y - 20, 2, 1, '#E0484E');
    if (on) { g.globalAlpha = 0.3; pcircle(g, x, y - 17, 4, PAL.sun); g.globalAlpha = 1; drawLightBeam(g, x, y - 16.5, t * 1.6, 11, 0.4, '#FFF3A0', 0.4); }
  },
  valle(g, x, y, t, spin) {
    rect(g, x - 3, y - 2, 6, 2, '#6B4A2A'); rect(g, x - 3, y - 2, 6, 1, '#8B5A3C');
    g.fillStyle = '#B07A4A'; g.fillRect(x - 0.5, y - 14, 1, 12);
    const cx = x, cy = y - 15, a0 = t * (1.4 + spin * 10);
    const cols = ['#FF7FCF', '#FFD84A', '#30E1C5', '#66D66A'];
    for (let k = 0; k < 4; k++) {
      const a = a0 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let r = 0; r <= 6; r += 0.5) for (let s = 0; s <= r * 0.55; s += 0.5) hdPx(g, cx + ca * r - sa * s, cy + sa * r + ca * s, s > r * 0.4 ? shade(cols[k], -0.25) : cols[k]);
    }
    pcircle(g, cx, cy, 1, '#FFFFFF'); hdPx(g, cx, cy, '#8B5A3C');
  },
  solaria(g, x, y, t) {
    rect(g, x - 5, y - 5, 1, 5, '#8C93B8'); rect(g, x + 4, y - 8, 1, 8, '#8C93B8'); rect(g, x - 6, y - 1, 12, 1, '#565E8C');
    for (let r = 0; r < 8; r++) { g.fillStyle = r === 0 ? '#C9D2F0' : '#1E3A8A'; g.fillRect(x - 8 + r * 0.5, y - 15 + r, 15, 1); }
    g.fillStyle = 'rgba(160,200,255,0.55)';
    for (let c = 1; c < 5; c++) for (let r = 1; r < 8; r++) g.fillRect(x - 8 + c * 3 + r * 0.5, y - 15 + r, 0.5, 1);
    g.fillRect(x - 8 + 2, y - 11, 15, 0.5);
    const s = (t * 0.5) % 2;
    if (s < 1) { g.fillStyle = 'rgba(255,255,255,0.7)'; for (let r = 1; r < 8; r++) g.fillRect(x - 9 + s * 17 + r * 0.2, y - 15 + r, 1, 1); }
  },
  aeris(g, x, y, t) {
    const cx = x - 1, cy = y - 12 + Math.sin(t * 2) * 0.5;
    for (let dy = -7; dy <= 7; dy += 0.5) {
      const hw = 5 * (1 - Math.abs(dy) / 7.5);
      g.fillStyle = dy < 0 ? '#FF7FCF' : '#FFD84A'; g.fillRect(cx - hw, cy + dy, hw, 0.5);
      g.fillStyle = dy < 0 ? '#FFD84A' : '#FF7FCF'; g.fillRect(cx, cy + dy, hw, 0.5);
    }
    hdLine(g, cx, cy - 7, cx, cy + 7, '#8B5A3C'); hdLine(g, cx - 5, cy, cx + 5, cy, '#8B5A3C');
    for (let i = 0; i < 14; i++) { const k = i / 13; hdPx(g, cx + k * 7 + Math.sin(t * 4 + i * 0.8) * 0.8, cy + 7 + k * 4.5, '#FFF3D7'); }
    for (const k of [0.35, 0.75]) { const bx = cx + k * 7 + Math.sin(t * 4 + k * 10) * 0.8, by = cy + 7 + k * 4.5; hdRect(g, bx - 1, by - 0.5, 2, 1, '#30E1C5'); }
  },
  hydria(g, x, y, t) {
    const x0 = x - 5, y0 = y - 14;
    g.fillStyle = 'rgba(160,220,255,0.16)'; g.fillRect(x0, y0 + 3, 10, 11);
    const lvl = y0 + 6.5;
    rect(g, x0 + 1, lvl, 8, y - lvl - 1, '#2A7ACB'); g.fillStyle = '#1B5A9A'; g.fillRect(x0 + 1, y - 3, 8, 2);
    for (let i = 0; i < 16; i++) hdPx(g, x0 + 1 + i * 0.5, lvl + Math.sin(t * 4 + i * 0.7) * 0.5, '#9FE8FF');
    for (let i = 0; i < 3; i++) { const by = y - 2 - ((t * 5 + i * 2.7) % 6); hdPx(g, x0 + 3 + i * 2, by, '#DFFBFF'); }
    g.fillStyle = '#C9E8FF'; g.fillRect(x0, y0 + 3, 0.5, 11); g.fillRect(x0 + 9.5, y0 + 3, 0.5, 11); g.fillRect(x0, y - 0.5, 10, 0.5);
    rect(g, x - 3, y0, 6, 3, '#B07A4A'); rect(g, x - 3, y0, 6, 1, '#D8A06A');
    hdPx(g, x0 + 1.5, y0 + 4.5, '#FFFFFF'); hdPx(g, x0 + 1.5, y0 + 5, '#FFFFFF');
  },
  bioloop(g, x, y, t) {
    for (let r = 0; r < 7; r++) rect(g, x - 4.5 + r * 0.25, y - 7 + r, 9 - r * 0.5, 1, '#C0623A');
    rect(g, x - 6, y - 9, 12, 2, '#D8784A'); g.fillStyle = 'rgba(255,255,255,0.2)'; g.fillRect(x - 5, y - 9, 3, 0.5);
    rect(g, x - 5, y - 9, 10, 1, '#4A2E18');
    const sw = Math.sin(t * 1.5) * 0.7;
    hdLine(g, x, y - 9, x + sw, y - 16, '#3FA85A');
    pellipse(g, x - 2.5 + sw, y - 15, 2, 1, '#66D66A'); pellipse(g, x + 2.5 + sw, y - 17, 2, 1, '#66D66A');
    hdPx(g, x - 3 + sw, y - 15.5, '#B6F35B'); hdPx(g, x + 2 + sw, y - 17.5, '#B6F35B');
  },
  gea(g, x, y, t) {
    const glow = 0.5 + Math.sin(t * 2) * 0.2;
    g.globalAlpha = 0.25 * glow; pcircle(g, x, y - 7, 8, '#FF9D42'); g.globalAlpha = 1;
    pellipse(g, x, y - 1, 7, 1, '#5A3A4A');
    [[-3.5, 8, 3, -0.15], [0, 13, 4, 0], [3.5, 7, 3, 0.2]].forEach(([dx, h, w, lean]) => {
      for (let k = 0; k < h; k += 0.5) {
        const wk = k > h - 3 ? w * (h - k) / 3 : w, cx = x + dx + lean * k;
        g.fillStyle = '#E0484E'; g.fillRect(cx - wk / 2, y - 1 - k, wk / 2, 0.5);
        g.fillStyle = '#FF9D42'; g.fillRect(cx, y - 1 - k, wk / 2, 0.5);
      }
      hdPx(g, x + dx + lean * (h - 1.5) - 0.5, y - h + 0.5, '#FFF3A0');
    });
  },
  h2(g, x, y, t) {
    const b = Math.sin(t * 2) * 0.5;
    rect(g, x - 4, y - 2, 8, 2, '#6B4A2A');
    for (let r = 0; r < 4; r++) { g.fillStyle = r === 1 ? '#30E1C5' : '#FFF3D7'; g.fillRect(x - 6 + r, y - 6 + r + b, 12 - r * 2, 1); }
    g.fillStyle = '#8B5A3C'; g.fillRect(x - 0.5, y - 17 + b, 1, 11);
    for (let k = 0; k < 9; k++) { g.fillStyle = '#E8F6FF'; g.fillRect(x + 0.5, y - 16 + k + b, k * 0.6, 1); }
    rect(g, x, y - 18 + b, 3, 2, '#30E1C5');
    for (let i = 0; i < 3; i++) { const ph = (t * 0.8 + i / 3) % 1; g.globalAlpha = 1 - ph; pring(g, x - 5 + i * 3, y - 7 - ph * 9, 1, '#9FE8FF'); }
    g.globalAlpha = 1;
  },
  bateria(g, x, y, t) {
    const glow = 0.6 + Math.sin(t * 3) * 0.25;
    g.globalAlpha = 0.25 * glow; pcircle(g, x, y - 7, 8, PAL.pink); g.globalAlpha = 1;
    rect(g, x - 4, y - 13, 8, 13, '#2A2050'); strokeRect(g, x - 4, y - 13, 8, 13, '#FF7FCF'); rect(g, x - 2, y - 15, 4, 2, '#C9D2F0');
    const n = 1 + Math.floor(t * 1.5) % 4;
    for (let i = 0; i < 4; i++) rect(g, x - 2, y - 4 - i * 2.5, 4, 1.5, i < n ? '#FF7FCF' : '#4A3A6A');
    hdPx(g, x - 3, y - 12, '#FFFFFF');
  },
  prisma(g, x, y, t) {
    for (let r = 0; r < 11; r += 0.5) { const hw = r * 0.55; g.fillStyle = 'rgba(200,230,255,0.35)'; g.fillRect(x - hw, y - 12 + r, hw * 2, 0.5); }
    hdLine(g, x, y - 12, x - 6, y - 1, '#E8F6FF'); hdLine(g, x, y - 12, x + 6, y - 1, '#E8F6FF'); hdLine(g, x - 6, y - 1, x + 6, y - 1, '#C9D2F0');
    const k = 0.6 + Math.sin(t * 2) * 0.25;
    g.globalAlpha = k; hdLine(g, x - 12, y - 9, x - 3, y - 6.5, '#FFFFFF');
    ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF'].forEach((c, i) => hdLine(g, x + 3, y - 6.5, x + 12, y - 9.5 + i * 1.1, c));
    g.globalAlpha = 1;
  },
  faro(g, x, y, t) {
    hdLine(g, x + 3, y - 4, x + 6, y, '#8B5A3C');
    rect(g, x - 7, y - 15, 14, 13, '#E8C070'); rect(g, x - 7, y - 15, 14, 1, '#FFE8A0');
    rect(g, x - 6, y - 14, 12, 3, '#3B2A7A'); rect(g, x - 6, y - 11, 12, 3, '#B0508C'); rect(g, x - 6, y - 8, 12, 2, '#FF9D6B'); rect(g, x - 6, y - 6, 12, 3, '#2A4A9A');
    for (let i = 0; i < 4; i++) if (Math.sin(t * 3 + i * 1.7) > 0) hdPx(g, x - 5 + i * 3, y - 13 + (i % 2), ['#FFD84A', '#FF7FCF', '#30E1C5', '#FFFFFF'][i]);
    rect(g, x - 3, y - 7, 1, 2, '#FF7FCF'); rect(g, x - 3, y - 5, 1, 1, '#1A1030');
    rect(g, x + 1, y - 8, 2, 2, '#30E1C5');
  }
};

class TallerScene {
  constructor() {
    this.opaque = true; this.t = 0; this.prevNav = UI.nav; UI.nav = true; UI.focus = null;
    this.lamp = true; this.pop = {}; this.note = null; this.cheerT = 0; this.bat = 76 + REGIONS.filter(r => restored(r.key)).length * 2;
    if (!TallerArt.back) { TallerArt.back = tallerLayer(paintTallerBack); TallerArt.front = tallerLayer(paintTallerFront); }
  }
  close() { UI.nav = this.prevNav; Scenes.pop(); }
  update(dt) {
    this.t += dt; this.cheerT = Math.max(0, this.cheerT - dt);
    for (const k in this.pop) this.pop[k] = Math.max(0, this.pop[k] - dt);
    if (this.lamp) this.bat = Math.max(5, this.bat - dt / 90);
    if (Input.hit('back')) { Input.consume(); this.close(); }
  }
  // ventana: cielo, luna, mar y las islas (las restauradas, con luces)
  drawView(g) {
    const S = TL.glass, t = this.t;
    g.save(); g.beginPath(); g.rect(S.x, S.y, S.w, S.h); g.clip();
    vGradient(g, S.x, S.y, S.w, S.h, [[0, '#0B1030'], [0.5, '#1E2A62'], [0.66, '#3A4A8A'], [0.67, '#14235A'], [1, '#0E1A44']], false);
    const rng = mulberry32(99);
    for (let i = 0; i < 46; i++) { const sx = S.x + rng() * S.w, sy = S.y + rng() * 40, sp = 1 + rng() * 2, ph = rng() * 6; g.fillStyle = Math.sin(t * sp + ph) > 0.5 ? '#FFFFFF' : 'rgba(255,255,255,0.4)'; g.fillRect(Math.round(sx * 2) / 2, Math.round(sy * 2) / 2, 0.5, 0.5); }
    if (flag('ending')) for (let k = 0; k < 3; k++) for (let i = 0; i < S.w; i += 0.5) {
      const yy = S.y + 10 + k * 5 + Math.sin(i * 0.08 + t * 0.6 + k) * 4;
      g.fillStyle = rgba(['#30E1C5', '#66D66A', '#9B76FF'][k], 0.18); g.fillRect(S.x + i, yy, 0.5, 6);
    }
    const mx = S.x + 80, my = S.y + 12;
    g.globalAlpha = 0.15; pcircle(g, mx, my, 9, '#FFF3D7'); g.globalAlpha = 1;
    pcircle(g, mx, my, 5, '#FFF3D7'); hdPx(g, mx - 2, my - 1, '#E2D6B8'); hdPx(g, mx + 1, my + 2, '#E2D6B8'); hdPx(g, mx + 1.5, my - 2, '#E2D6B8');
    const sea = S.y + 46;
    for (let k = 0; k < 8; k++) { const w = 7 - k * 0.6 + Math.sin(t * 3 + k) * 1.5; g.fillStyle = 'rgba(255,243,215,' + (0.55 - k * 0.06) + ')'; g.fillRect(mx - w / 2, sea + 2 + k * 2.6, w, 0.5); }
    for (let i = 0; i < 14; i++) { const wx = S.x + ((i * 23 + t * 4) % S.w), wy = sea + 4 + (i * 7) % 20; g.fillStyle = 'rgba(160,190,255,0.35)'; g.fillRect(wx, wy, 2.5, 0.5); }
    // islas: más lejanas arriba y pequeñas, más cercanas abajo y grandes
    REGIONS.forEach((r, i) => {
      const depth = clamp((r.y - 40) / 170, 0, 1), ix = S.x + 8 + (r.x - 40) / 400 * (S.w - 16), iy = sea + 2 + depth * 13, s = 1.5 + depth * 2.6;
      const on = restored(r.key), rr = mulberry32(i * 31 + 7);
      // silueta irregular de la isla (más clara arriba) y su reflejo en el agua
      for (let xx = -s * 1.7; xx <= s * 1.7; xx += 0.5) {
        const k = 1 - Math.pow(xx / (s * 1.7), 2), hgt = Math.max(0.5, s * 0.9 * k + (rr() - 0.5) * 0.8 * k);
        g.fillStyle = mix('#0A1230', '#18224C', depth * 0.6); g.fillRect(ix + xx, iy - hgt, 0.5, hgt);
        g.fillStyle = 'rgba(120,140,220,0.25)'; g.fillRect(ix + xx, iy - hgt, 0.5, 0.5);
      }
      if (r.key === 'faro') { rect(g, ix - 0.5, iy - s - 6, 1, 6, '#C9D2F0'); if (on) { hdPx(g, ix, iy - s - 6.5, '#FFF3A0'); drawLightBeam(g, ix, iy - s - 6, t * 1.2, 34, 0.25, '#FFF3A0', 0.35); } }
      if (!on) return;
      for (let j = 0; j < 3; j++) {
        const lx = ix - s + j * s, ly = iy - 0.5 - (j === 1 ? s * 0.5 : 0);
        if (Math.sin(t * 2.5 + i * 3 + j * 2) > -0.7) hdPx(g, lx, ly, j === 1 ? '#FFFFFF' : PAL.sun);
        g.fillStyle = 'rgba(255,216,74,0.35)'; g.fillRect(lx, iy + 1 + (j % 2), 0.5, 1 + Math.sin(t * 3 + j) * 0.5);
      }
    });
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let k = 0; k < 14; k++) g.fillRect(S.x + 6 + k, S.y + 4 + k * 2, 0.5, 16);
  }
  // pantalla de la casa solar: de noche el panel no genera y la casa tira de la batería
  drawMonitor(g) {
    const M = TL.mon, t = this.t, x = M.x + 5, y = M.y + 4;
    icon(g, 'sun', x, y); g.globalAlpha = 0.6; rect(g, x, y, 8, 8, '#0A1430'); g.globalAlpha = 1;
    icon(g, 'battery', x + 22, y); icon(g, 'bolt', x + 44, y);
    for (let i = 0; i < 5; i++) px(g, x + 10 + i * 2, y + 4, '#3A4068');
    for (let i = 0; i < 5; i++) { const on = this.lamp && (Math.floor(t * 8) - i) % 5 === 0; px(g, x + 32 + i * 2, y + 4, on ? PAL.sun : '#3A4068'); }
    drawText(g, 'noche · 0 W', x, y + 11, '#8C93B8');
    const b = Math.round(this.bat);
    bar(g, x, y + 22, 30, 4, b, 100, b > 30 ? PAL.lime : PAL.coral, '#10162B');
    drawText(g, b + ' %', x + 52, y + 20, PAL.cream, { align: 'right' });
  }
  noteFor(id) {
    if (!id) return null;
    if (id.startsWith('sv_')) {
      const k = id.slice(3), r = REGIONS[regionIdx(k)], S = SOUVENIRS[k];
      return restored(k) ? { title: S.name.toUpperCase() + ' · ' + r.name, text: S.fact, col: r.col === PAL.white ? PAL.sun : r.col } : { title: '? ? ?', text: 'Aquí irá el recuerdo de ' + r.name + '. Restaura la isla para traerlo.', col: '#8C93B8' };
    }
    if (id.startsWith('st_')) {
      const k = id.slice(3), A = ACHIEVEMENTS[k];
      return G.save.achievements[k] ? { title: '★ ' + A.name, text: A.desc, col: PAL.pink } : { title: 'PEGATINA POR CONSEGUIR', text: A.desc, col: '#8C93B8' };
    }
    if (id.startsWith('cos')) {
      const c = COSMETICS[id.slice(3)];
      if (!restored(c.region)) return { title: '? ? ?', text: 'Se consigue restaurando ' + REGIONS[regionIdx(c.region)].name + '.', col: '#8C93B8' };
      return { title: c.name.toUpperCase(), text: c.desc + (G.save.cosmetics.worn[id.slice(3)] ? ' Lía la lleva puesta.' : ' Pulsa para ponérsela.'), col: PAL.orange };
    }
    const n = REGIONS.filter(r => restored(r.key)).length;
    const best = G.save.trainBest;
    return {
      twin: { title: 'EL ARCHIPIÉLAGO', text: n + ' de ' + REGIONS.length + ' islas tienen luz. Cada isla que restauras se enciende en la ventana.', col: PAL.sky },
      tlamp: { title: 'LÁMPARA LED · ' + (this.lamp ? '9 W' : 'apagada'), text: 'Una lámpara LED de 9 W alumbra más o menos como una bombilla incandescente de 60 W: gasta unas 6 veces menos. Pulsa para ' + (this.lamp ? 'apagarla.' : 'encenderla.'), col: PAL.sun },
      tmon: { title: 'CASA SOLAR', text: 'De noche el panel no genera: la casa usa la energía que la batería guardó durante el día. ' + (this.lamp ? 'Ahora mismo, la lámpara la va gastando.' : 'Con todo apagado, la batería descansa.'), col: PAL.lime },
      tboard: { title: 'TABLERO DE PEGATINAS', text: 'Cada logro deja una pegatina. Pasa por encima de una para ver cómo se consigue.', col: PAL.pink },
      ttrain: { title: 'PATIO DE ENTRENAMIENTO', text: 'Practica agacharte, la barrida, el gancho, el rebote, el pulso y la recarga contra muñecos que no se rompen.' + (best ? ' Tu récord: ' + fmtSec(best) + '.' : ' La primera vez que completes la lista: +1 núcleo.'), col: PAL.coral },
      tsims: { title: 'SIMULADORES', text: 'Energía renovable + programación: repite cualquier simulador que ya hayas encontrado en las islas.', col: PAL.aqua },
      tforge: { title: 'FORJA DEL LUMISABLE', text: 'Mejoras del sable a cambio de núcleos y de demostrar el concepto. Los núcleos salen de cerraduras, mini jefes, simuladores y repasos.', col: PAL.orange },
      tback: { title: 'VOLVER', text: 'Regresa al mapa del archipiélago.', col: PAL.teal }
    }[id] || null;
  }
  // zona interactiva sin botón visible (recuerdo, pegatina, lámpara, ventana...)
  spot(g, id, x, y, w, h) {
    const st = UI.register(id, x, y, w, h);
    if (st.focus && Input.lastDevice !== 'mouse' && Input.lastDevice !== 'touch') UI.focusRing(g, x, y, w, h);
    return { hot: st.hover || st.focus, click: UI.clicked(id) };
  }
  draw(g) {
    const t = this.t;
    g.drawImage(TallerArt.back, 0, 0, W, H);
    this.drawView(g);
    g.drawImage(TallerArt.front, 0, 0, W, H);
    // ---- recuerdos ----
    REGIONS.forEach((r, i) => {
      const s = souvenirSlot(i), have = restored(r.key), id = 'sv_' + r.key;
      const sp = this.spot(g, id, s.x - 12, s.y - 22, 24, 22);
      if (sp.click && have) { this.pop[r.key] = 0.6; AudioSys.sfx('confirm'); }
      const p = this.pop[r.key] || 0, lift = p > 0 ? Math.sin((0.6 - p) / 0.6 * Math.PI) * 3 : 0;
      if (have) {
        g.fillStyle = 'rgba(20,10,4,0.3)'; g.fillRect(s.x - 6, s.y - 1, 12, 1);
        if (sp.hot) { g.globalAlpha = 0.18; pcircle(g, s.x, s.y - 9, 11, '#FFF3D7'); g.globalAlpha = 1; }
        SOUVENIR_DRAW[r.key](g, s.x, s.y - lift, t + i, p);
      } else {
        g.globalAlpha = 0.45; strokeRect(g, s.x - 5, s.y - 12, 10, 12, '#4A2E18'); g.globalAlpha = 1;
        drawText(g, '?', s.x, s.y - 10, sp.hot ? '#E8C8A0' : '#7A5A3A', { align: 'center' });
      }
    });
    // ---- pegatinas en el corcho ----
    const keys = Object.keys(ACHIEVEMENTS), got = keys.filter(k => G.save.achievements[k]).length;
    keys.forEach((k, i) => {
      const p = stickerPos(i), has = !!G.save.achievements[k];
      const sp = this.spot(g, 'st_' + k, p.x - 7, p.y - 7, 14, 14);
      if (has) {
        const col = hsl(i * 37 % 360, 75, 62);
        g.fillStyle = 'rgba(40,20,8,0.3)'; g.fillRect(p.x - 5, p.y + 6, 11, 1);
        pcircle(g, p.x, p.y, 6, '#FFFFFF'); pcircle(g, p.x, p.y, 5, col); icon(g, STICKER_ICON[k] || 'star', p.x - 4, p.y - 4);
        hdPx(g, p.x - 3, p.y - 3.5, '#FFFFFF');
      } else { g.globalAlpha = 0.55; pring(g, p.x, p.y, 5, '#8A6034'); g.globalAlpha = 1; }
      if (sp.hot) pring(g, p.x, p.y, 7, PAL.sun);
    });
    // ---- detalles vivos del banco ----
    if (Math.floor(t * 2) % 2) px(g, 157, 168, PAL.lime); else px(g, 157, 168, '#1F4A2A');
    px(g, 149, 168, Math.floor(t * 3) % 3 === 0 ? PAL.coral : '#5A2A2A');
    for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; g.globalAlpha = 0.5 * (1 - ph); hdPx(g, 166.5 + Math.sin(t * 2 + i * 2) * 1.2, 165 - ph * 9, '#FFFFFF'); }
    for (let i = 0; i < 2; i++) { const ph = (t * 0.7 + i / 2) % 1; g.globalAlpha = 0.45 * (1 - ph); hdPx(g, 181 + Math.sin(t * 3 + i) * 1.5, 162 - ph * 8, '#C9D2F0'); }
    g.globalAlpha = 1;
    // ---- lámpara (cabeza y bombilla) ----
    const L = TL.lamp, lsp = this.spot(g, 'tlamp', L.x, L.y, L.w, L.h);
    if (lsp.click) { this.lamp = !this.lamp; AudioSys.sfx(this.lamp ? 'confirm' : 'select'); }
    for (let k = 0; k < 6; k++) rect(g, L.x + 3 + k * 0.5, L.y + 1 + k, 9 - k, 1, k < 1 ? '#FF9D9D' : '#E0484E');
    rect(g, L.x + 5, L.y + 7, 4, 1, this.lamp ? '#FFF3A0' : '#6A6A7A');
    if (lsp.hot) pring(g, L.x + 8, L.y + 6, 9, PAL.sun);
    // ---- pantalla de la casa solar ----
    this.drawMonitor(g);
    this.spot(g, 'tmon', TL.mon.x, TL.mon.y, TL.mon.w, TL.mon.h);
    // ---- Lía, PÍX y Lumi ----
    const F = this.cheerT > 0 ? Spr.lia.celebrate[Math.floor(t * 4) % 2] : Spr.lia.idle[liaIdleFrame(t)];
    const lx = 222, ly = 207 - F.r.height;
    groundShadow(g, lx + F.r.width / 2, 206, 14, 0.35);
    if (F.rh) g.drawImage(F.rh, lx, ly, F.r.width, F.r.height); else g.drawImage(F.r, lx, ly);
    const pf = Spr.pix[Math.floor(t * 16) % 4];
    groundShadow(g, 254, 206, 8, 0.18);
    g.drawImage(pf.r, 248, 172 + Math.round(Math.sin(t * 3) * 2));
    const lux = 206 + Math.sin(t * 1.3) * 3, luy = 184 + Math.sin(t * 2.1) * 2;
    g.globalAlpha = 0.25; pcircle(g, lux + 3, luy + 3, 6, PAL.sun); g.globalAlpha = 1;
    drawLumiShape(g, Math.round(lux), Math.round(luy), Spr.lumi[this.cheerT > 0 ? 2 : 0], PAL.sun, PAL.orange, true, this.cheerT > 0 ? 'happy' : 'n');
    // ---- luz: lámpara encendida (cálida) o apagada (luz de luna) ----
    if (this.lamp) {
      const grd = g.createRadialGradient(190, 156, 4, 190, 156, 150);
      grd.addColorStop(0, 'rgba(255,200,120,0.22)'); grd.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,230,160,0.12)'; g.beginPath(); g.moveTo(L.x + 4, L.y + 8); g.lineTo(L.x + 11, L.y + 8); g.lineTo(L.x + 14, 172); g.lineTo(142, 172); g.closePath(); g.fill();
      for (let i = 0; i < 10; i++) { const mx = 150 + ((i * 37 + t * 4) % 50), my = 150 + ((i * 23 + t * 6 + Math.sin(t + i) * 4) % 22); g.fillStyle = 'rgba(255,240,200,0.5)'; g.fillRect(mx, my, 0.5, 0.5); }
    } else {
      g.fillStyle = 'rgba(6,8,26,0.5)'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(160,190,255,0.10)'; g.beginPath(); g.moveTo(20, 104); g.lineTo(112, 104); g.lineTo(150, 262); g.lineTo(46, 262); g.closePath(); g.fill();
      const glow = (x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); };
      glow(TL.mon.x + TL.mon.w / 2, TL.mon.y + TL.mon.h / 2, 30, '#59C7FF', 0.2);
      REGIONS.forEach((r, i) => { const s = souvenirSlot(i); if (restored(r.key) && (r.key === 'gea' || r.key === 'bateria' || r.key === 'puerto')) glow(s.x, s.y - 8, 14, r.key === 'gea' ? '#FF9D42' : r.key === 'bateria' ? '#FF7FCF' : '#FFD84A', 0.3); });
      glow(TL.glass.x + TL.glass.w / 2, TL.glass.y + TL.glass.h / 2, 70, '#9FB8FF', 0.12);
    }
    // ---- rótulos (encima de la luz: siempre legibles) ----
    drawText(g, 'TALLER DE LÍA', 240, 15, PAL.sun, { align: 'center', scale: 2, shadow: '#3A2010' });
    const B = TL.board;
    drawText(g, 'PEGATINAS ' + got + '/' + keys.length, B.x + 79, B.y + 8, '#5A3A20', { align: 'center' });
    const bossesDone = Object.keys(BOSSES).filter(k => flag('boss_' + k)).length, minisDone = Object.keys(MINI).filter(k => flag('mini_' + k)).length;
    drawText(g, 'Jefes ' + bossesDone + '/' + Object.keys(BOSSES).length + ' · Mini jefes ' + minisDone + '/' + Object.keys(MINI).length, B.x + 79, B.y + 73, '#5A3A20', { align: 'center' });
    this.spot(g, 'tboard', B.x + 30, B.y + 6, 98, 11);
    this.spot(g, 'twin', TL.glass.x + 8, TL.glass.y + 6, TL.glass.w - 16, 28);
    drawText(g, 'recuerdos ' + REGIONS.filter(r => restored(r.key)).length + '/' + REGIONS.length, 196, TL.shelf2 + 7, '#E8C8A0', { align: 'center' });
    drawText(g, 'ARMARIO', TL.ward.x + TL.ward.w / 2, TL.ward.y + 2, '#FFE8B0', { align: 'center', shadow: '#3A2010' });
    // ---- armario: cosméticos ----
    Object.keys(COSMETICS).forEach((k, i) => {
      const c = COSMETICS[k], owned = restored(c.region), worn = !!G.save.cosmetics.worn[k];
      if (UI.btn(g, 'cos' + k, TL.ward.x + 8, TL.ward.y + 16 + i * 15, TL.ward.w - 16, 13, owned ? (worn ? '● ' : '○ ') + c.name : '? ? ?', { disabled: !owned, color: worn ? PAL.lime : PAL.teal })) {
        G.save.cosmetics.worn[k] = !worn; rebuildLia(); AudioSys.sfx('confirm'); Save.write();
        if (!worn) this.cheerT = 1.2;
      }
    });
    // ---- salidas: patio, simuladores, forja ----
    const trained = flag('trainDone');
    if (UI.btn(g, 'ttrain', 312, 124, 158, 16, (trained ? '✓ ' : '⚔ ') + 'PATIO DE ENTRENAMIENTO', { color: PAL.coral, primary: !trained })) { UI.nav = this.prevNav; Game.startLevel('practica'); }
    const simsN = SIM_ORDER.filter(simDone).length;
    if (UI.btn(g, 'tsims', 312, 144, 158, 16, '⚗ SIMULADORES ' + simsN + '/' + SIM_ORDER.length, { color: PAL.aqua })) Scenes.push(new SimLabScene());
    const cores = G.save.forgeCores || 0, forgedN = FORGE.filter(f => forged(f.id)).length;
    if (UI.btn(g, 'tforge', 312, 164, 158, 16, '⚒ FORJA DEL LUMISABLE', { color: PAL.orange, primary: cores > 0 && forgedN < FORGE.length })) Scenes.push(new ForgeScene());
    drawText(g, '◆ ' + cores + ' núcleo' + (cores === 1 ? '' : 's') + ' · ' + forgedN + '/' + FORGE.length + ' forjadas', 391, 186, '#E8C8A0', { align: 'center', shadow: '#3A2010' });
    if (UI.btn(g, 'tback', W - 70, H - 20, 64, 14, 'VOLVER', { color: PAL.teal })) { this.close(); return; }
    // ---- nota: lo que se mira o, si no, un comentario de PÍX ----
    const sel = (Input.lastDevice === 'mouse' || Input.lastDevice === 'touch') ? UI.hover : UI.focus;
    const nn = this.noteFor(sel);
    if (nn) this.note = nn;
    const quips = [
      'Cada recuerdo del estante guarda un dato real de su isla. Pasa el cursor por encima.',
      'Apagar la lámpara al salir también es programar: SI no hay nadie, ENTONCES apagar.',
      'El patio de entrenamiento está detrás de la puerta. Los muñecos no muerden.'
    ];
    if (flag('ending')) quips.push('He creado un algoritmo para elegir merienda. LÍA: "¿Por qué tiene 72 condiciones?"');
    const N = this.note || { title: 'PÍX', text: quips[Math.floor(t / 7) % quips.length], col: PAL.teal };
    const R = TL.note;
    panel(g, R.x, R.y, R.w, R.h, { border: shade(N.col, -0.2), bg: 'rgba(30,18,10,0.9)', hi: '#6B4A2C' });
    drawText(g, N.title, R.x + 7, R.y + 5, N.col);
    drawPara(g, N.text, R.x + 7, R.y + 16, R.w - 14, PAL.cream, { lh: 9 });
  }
}
Game.toTaller = function () {
  Trans.go(() => { Scenes.clear(); Particles.clear(); Bark.clear(); G.save.scene = 'map'; Save.write(); Scenes.push(new MapScene()); Scenes.push(new TallerScene()); });
};

// =====================================================================
//  PATIO DE ENTRENAMIENTO: una lista de movimientos para practicar
//  contra muñecos que no se rompen (y nada quita células). Completarla
//  da una pegatina y, la primera vez, un núcleo de forja; además se
//  guarda el mejor tiempo.
// =====================================================================
const TRAIN_MOVES = [
  { id: 'crouch', done: 'AGACHADA', label: () => 'Agáchate y cruza el túnel (' + bindName('down') + ')' },
  { id: 'combo', done: 'COMBO', label: () => { const k = bindName('attack'); return 'Combo de 3 tajos (' + k + ' ' + k + ' ' + k + ')'; } },
  { id: 'slide', done: 'BARRIDA', label: () => 'Barrida (' + bindName('down') + ' + ' + bindName('attack') + ')' },
  { id: 'hook', done: 'GANCHO', label: () => 'Gancho al dron (' + bindName('up') + ' + ' + bindName('attack') + ')' },
  { id: 'pogo', done: 'REBOTE', label: () => 'Rebote: en el aire ' + bindName('down') + ' + ' + bindName('attack') },
  { id: 'pulse', done: 'PULSO', label: () => 'Pulso: mantén ' + bindName('attack') + ' y suelta' },
  { id: 'heal', done: 'RECARGA', label: () => 'Recarga: quieta con ' + bindName('down') },
  { id: 'spin', power: 'spin', done: 'TORBELLINO', label: () => 'Torbellino: mantén salto + ' + bindName('attack') },
  { id: 'rush', power: 'rush', done: 'EMBESTIDA', label: () => 'Embestida (corre + ' + bindName('attack') + ')' }
];
const trainList = () => TRAIN_MOVES.filter(m => !m.power || hasPower(m.power));
function trainMark(lv, id) {
  const P = lv.pr;
  if (!P || P.done[id]) return false;
  const M = trainList().find(m => m.id === id);
  if (!M) return false;
  P.done[id] = true; P.flash[id] = 1;
  AudioSys.sfx('ok');
  Particles.text(lv.player.cx, lv.player.y - 14, '✓ ' + M.done, PAL.lime);
  if (!P.finished && trainList().every(m => P.done[m.id])) trainFinish(lv);
  return true;
}
function trainFinish(lv) {
  const P = lv.pr, p = lv.player;
  P.finished = true;
  const first = !flag('trainDone'), best = G.save.trainBest, rec = !best || P.t < best;
  setFlag('trainDone');
  if (rec) G.save.trainBest = P.t;
  AudioSys.sfx('fanfare'); FX.flash(PAL.sun, 0.3);
  for (let i = 0; i < 24; i++) Particles.spawn({ x: p.cx + rand(-30, 30), y: p.y + rand(-20, 10), vx: rand(-30, 30), vy: rand(-60, -20), life: rand(0.8, 1.5), type: 'star', color: choice([PAL.sun, PAL.pink, PAL.teal, PAL.lime]) });
  p.celebrateT = 1.5;
  Toast.show('¡ENTRENAMIENTO COMPLETO! ' + fmtSec(P.t) + (rec && best ? ' · ¡nuevo récord!' : ''), PAL.sun, 4);
  if (first) { G.save.forgeCores = (G.save.forgeCores || 0) + 1; Toast.show('◆ +1 núcleo de forja', PAL.orange, 3.5); addXP(30, 'Entrenamiento completo'); }
  achieve('trainer');
  Bark.say('pix', first ? '¡Lista completa! Ahora ya sabes TODO lo que puede hacer tu sable.' : rec ? '¡Más rápido que nunca! Optimizar también es programar.' : 'Lista completa. ¿Otra vuelta para bajar el tiempo?', 4);
  Save.write();
}

// ---------- muñecos de práctica (no se rompen ni hacen daño) ----------
class TrainDummy extends Entity {
  constructor(lv, x, y, kind) {
    const S = { post: [14, 26], drone: [16, 12], mush: [16, 12], target: [16, 30] }[kind];
    super(lv, x, y, S[0], S[1]);
    this.kind = kind; this.hostile = true; this.harmless = true; this.weakPoint = false;
    this.wob = 0; this.wobV = 0; this.flashT = 0; this.hitT = 0; this.y0 = y; this.squash = 0;
  }
  update(dt) {
    super.update(dt);
    this.flashT = Math.max(0, this.flashT - dt); this.hitT = Math.max(0, this.hitT - dt); this.squash = Math.max(0, this.squash - dt * 4);
    // muelle amortiguado: se balancea y vuelve a su sitio
    this.wobV += (-this.wob * 90 - this.wobV * 6) * dt; this.wob += this.wobV * dt;
    if (this.kind === 'drone') this.y = this.y0 + Math.sin(this.t * 2) * 2;
  }
  onHit(h) {
    const lv = this.lv, cx = this.x + this.w / 2;
    this.flashT = 0.1; this.hitT = 0.6; this.squash = 1;
    this.wobV += (h.dir || (lv.player.cx < cx ? 1 : -1)) * (3 + (h.dmg || 1) * 2);
    AudioSys.sfx('hitE'); hitstop(lv, 0.035);
    Particles.burst(cx, this.y + this.h / 2, 6, { colors: ['#FFF3D7', saberColor(lv), PAL.sun], min: 30, max: 90, type: 'spark', lmax: 0.3 });
    const id = { f3: 'combo', slide: 'slide', hook: 'hook', down: 'pogo', pulse: 'pulse', spin: 'spin', rush: 'rush' }[h.kind];
    if (!(id && trainMark(lv, id))) Particles.text(cx, this.y - 6, '−' + (h.dmg || 1), PAL.cream);
    return true;
  }
  draw(g, cx, cy) {
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy), t = this.t, hit = this.hitT > 0;
    if (this.kind === 'post') {
      // muñeco de saco sobre un poste con muelle: se inclina al recibir el golpe
      const bx = x + 7, by = y + 26;
      groundShadow(g, bx, by - 1, 14, 0.3);
      rect(g, bx - 4, by - 3, 8, 3, '#565E8C'); rect(g, bx - 4, by - 3, 8, 1, '#8C93B8');
      g.save(); g.translate(bx, by - 3); g.rotate(clamp(this.wob, -0.6, 0.6));
      rect(g, -1, -8, 2, 8, '#8B5A3C');
      for (let k = 0; k < 4; k++) { g.fillStyle = '#C9D2F0'; g.fillRect(-2, -8 + k * 2, 4, 0.5); }
      pellipse(g, 0, -14, 5, 6, '#E8D2A0'); pellipse(g, 1, -13, 3, 4, '#F4E2B8');
      for (let k = -4; k <= 4; k += 2) { g.fillStyle = '#B09060'; g.fillRect(-0.25, -14 + k, 0.5, 1); }
      rect(g, -8, -16, 16, 2, '#8B5A3C');
      pcircle(g, 0, -23, 4, '#E8D2A0'); pring(g, 0, -23, 4, '#B09060');
      pring(g, 0, -14, 3, hit ? PAL.coral : '#E0484E'); px(g, 0, -14, hit ? PAL.sun : '#E0484E');
      if (hit) { rect(g, -2, -24, 1, 1, '#3A2414'); rect(g, 1, -24, 1, 1, '#3A2414'); rect(g, -1, -22, 2, 1, '#3A2414'); }
      else { rect(g, -2, -24, 1, 1, '#3A2414'); rect(g, 1, -24, 1, 1, '#3A2414'); rect(g, -2, -21, 4, 1, '#3A2414'); }
      g.restore();
    } else if (this.kind === 'drone') {
      // dron de prácticas: hélices, diana en la panza y antena
      const bx = x + 8, by = y + 6, spin = Math.floor(t * 30) % 2;
      g.save(); g.translate(bx, by); g.rotate(clamp(this.wob * 0.6, -0.5, 0.5));
      rect(g, -7, -5, 14, 1, '#565E8C');
      for (const s of [-1, 1]) { rect(g, s * 6 - (spin ? 3 : 1), -6, spin ? 6 : 2, 1, '#C9D2F0'); }
      rect(g, -5, -4, 10, 7, '#22306B'); rect(g, -5, -4, 10, 1, '#3E4C8A'); rect(g, -4, -3, 8, 1, '#59C7FF');
      pcircle(g, 0, 1, 2, hit ? PAL.sun : '#FFF3D7'); px(g, 0, 1, '#E0484E');
      rect(g, -0.5, -8, 1, 3, '#8C93B8'); px(g, 0, -9, Math.floor(t * 3) % 2 ? PAL.coral : '#5A2A2A');
      g.restore();
      g.globalAlpha = 0.2; groundShadow(g, bx, 224 - cy, 10, 0.25); g.globalAlpha = 1;
    } else if (this.kind === 'mush') {
      // seta de rebote: se aplasta al recibir el golpe desde arriba
      const bx = x + 8, by = y + 12, sq = this.squash;
      groundShadow(g, bx, by - 1, 16, 0.3);
      rect(g, bx - 3, by - 6 + sq * 2, 6, 6 - sq * 2, '#FFF3D7'); rect(g, bx - 3, by - 6 + sq * 2, 1, 6 - sq * 2, '#E8D2A0');
      const hw = 8 + sq * 2, top = by - 12 + sq * 3;
      for (let r = 0; r < 7 - sq * 2; r++) { const w = hw * Math.sqrt(Math.max(0, 1 - Math.pow(1 - r / 6, 2))); rect(g, bx - w, top + r, w * 2, 1, r < 1 ? '#FF8A8A' : '#E0484E'); }
      pcircle(g, bx - 4, top + 3, 1, '#FFFFFF'); pcircle(g, bx + 3, top + 2, 1, '#FFFFFF'); px(g, bx, top + 4, '#FFFFFF');
      rect(g, bx - 2, by - 4, 1, 1, '#3A2414'); rect(g, bx + 1, by - 4, 1, 1, '#3A2414');
    } else {
      // diana para el pulso, sobre un trípode
      const bx = x + 8, by = y + 10;
      groundShadow(g, bx, y + 29, 16, 0.3);
      hdLine(g, bx, by + 6, bx - 6, y + 30, '#6B4A2A'); hdLine(g, bx, by + 6, bx + 6, y + 30, '#6B4A2A'); rect(g, bx - 0.5, by + 6, 1, 14, '#6B4A2A');
      g.save(); g.translate(bx, by); g.rotate(clamp(this.wob * 0.5, -0.4, 0.4));
      pcircle(g, 0, 0, 8, '#FFF3D7'); pcircle(g, 0, 0, 6, hit ? PAL.sun : '#E0484E'); pcircle(g, 0, 0, 4, '#FFF3D7'); pcircle(g, 0, 0, 2, hit ? PAL.sun : '#E0484E');
      pring(g, 0, 0, 8, '#8B5A3C');
      g.restore();
    }
  }
}

// ---------- el patio ----------
function* practiceIntro(lv) {
  yield C.wait(0.4);
  if (!flag('trainIntro')) {
    setFlag('trainIntro');
    yield* talk([
      ['pix', '¡Bienvenida al patio de entrenamiento! Los muñecos no se rompen y aquí nada te quita células.', 'feliz'],
      ['pix', 'Completa la lista de la derecha. Es como depurar: pruebas, miras qué pasa y ajustas.', 'n']
    ]);
  } else Bark.say('pix', choice(['¡A entrenar! El cronómetro ya corre.', 'Otra vuelta: ¿puedes bajar tu tiempo?']), 3);
}
function buildPractice() {
  const b = new MapB(48, 17);
  b.fill(0, 0, 0, 16, '#').fill(47, 0, 47, 16, '#').ground(0, 47, 14);
  b.fill(9, 11, 14, 12, '#'); // tarima: debajo queda un túnel de una casilla (solo se cruza agachada)
  b.start(4, 13);
  b.e('X', 2, 13, { label: 'TALLER', run: function* () { Game.toTaller(); } });
  [5, 21, 35].forEach(x => b.e('L', x, 13));
  return b;
}
const TRAIN_SIGNS = [[7.5, 'TÚNEL ↓'], [19.5, 'MUÑECO'], [24, 'DRON ↑'], [29.5, 'SETA ↓'], [38, 'DIANA →']];
level('practica', {
  theme: 'festival', title: 'PATIO DE ENTRENAMIENTO', subtitle: 'Practica los movimientos de Lía', music: 'festival', ambient: 'sea', basePower: 1, quips: null,
  objective: lv => {
    const P = lv.pr; if (!P) return '';
    const L = trainList(), n = L.filter(m => P.done[m.id]).length;
    return P.finished ? 'Lista completa: vuelve al TALLER o mejora tu tiempo' : 'Completa la lista de entrenamiento (' + n + '/' + L.length + ')';
  },
  hint: () => 'Cada línea de la lista es un movimiento. Los carteles marcan dónde practicar cada uno; la recarga, agachada y quieta.',
  init(lv) {
    const G0 = 14 * TILE;
    lv.addEntity(new TrainDummy(lv, 17 * TILE + 1, G0 - 26, 'post'));
    lv.addEntity(new TrainDummy(lv, 24 * TILE, G0 - 56, 'drone'));
    lv.addEntity(new TrainDummy(lv, 30 * TILE, G0 - 12, 'mush'));
    lv.addEntity(new TrainDummy(lv, 41 * TILE, G0 - 30, 'target'));
    const p = lv.player;
    lv.pr = { done: {}, flash: {}, t: 0, finished: false, heals0: p.heals || 0 };
    // empieza con una célula menos y poca energía: así se practica la recarga
    p.cells = Math.max(1, p.maxCells - 1); p.energy = 30;
  },
  update(lv, dt) {
    const P = lv.pr, p = lv.player;
    if (!P) return;
    for (const k in P.flash) P.flash[k] = Math.max(0, P.flash[k] - dt);
    if (!P.finished && (!Cut.active || Cut.free)) P.t += dt;
    if (p.crouching && p.onGround && p.cx > 10 * TILE && p.cx < 14 * TILE) trainMark(lv, 'crouch');
    if ((p.heals || 0) > P.heals0) { P.heals0 = p.heals; trainMark(lv, 'heal'); }
    // la recarga solo se puede practicar con una célula vacía
    if (!P.done.heal && p.cells >= p.maxCells) p.cells = p.maxCells - 1;
  },
  hudDraw(lv, g) {
    const P = lv.pr;
    lv.hudBottom = 0;
    if (!P || lv.banner > 0.3) return;
    const L = trainList(), w = 164, x = W - w - 4 - touchOff(), y = 20, best = G.save.trainBest;
    const h = 17 + L.length * 10 + (best ? 10 : 0);
    lv.hudBottom = y + h; // los avisos se colocan debajo de la lista
    rect(g, x, y, w, h, 'rgba(16,22,43,0.78)'); rect(g, x, y, w, 1, PAL.sun);
    drawText(g, 'ENTRENAMIENTO', x + 5, y + 4, PAL.sun);
    drawText(g, fmtSec(P.t), x + w - 5, y + 4, P.finished ? PAL.lime : PAL.cream, { align: 'right' });
    L.forEach((m, i) => {
      const yy = y + 15 + i * 10, ok = !!P.done[m.id], fl = P.flash[m.id] || 0;
      if (fl > 0) rect(g, x + 2, yy - 1, w - 4, 9, rgba(PAL.lime, fl * 0.35));
      drawText(g, ok ? '✓' : '□', x + 5, yy, ok ? PAL.lime : '#8C93B8');
      drawText(g, fitText(m.label(), w - 20), x + 15, yy, ok ? '#8FD48F' : PAL.cream);
    });
    if (best) drawText(g, 'Récord: ' + fmtSec(best), x + w - 5, y + 15 + L.length * 10, '#8C93B8', { align: 'right' });
  },
  skyDraw(lv, g, cx, cy) {
    // fachada trasera del taller alrededor de la puerta
    const fx = -cx, gy = 14 * TILE - cy;
    rect(g, fx, gy - 112, 76, 112, '#6B4A2C');
    for (let x = 0; x < 76; x += 12) { rect(g, fx + x, gy - 112, 1, 112, '#47301B'); rect(g, fx + x + 1, gy - 112, 1, 112, 'rgba(255,220,170,0.08)'); }
    for (let k = 0; k < 18; k++) rect(g, fx - 6 + k * 0.5, gy - 124 + k * 0.7, 88 - k, 1, k % 3 ? '#8A2E3A' : '#C24A4A');
    rect(g, fx + 50, gy - 92, 16, 14, '#4A2E18'); rect(g, fx + 52, gy - 90, 12, 10, '#FFD884'); rect(g, fx + 57, gy - 90, 1, 10, '#4A2E18'); rect(g, fx + 52, gy - 86, 12, 1, '#4A2E18');
    g.globalAlpha = 0.18; pcircle(g, fx + 58, gy - 85, 14, '#FFD884'); g.globalAlpha = 1;
    rect(g, fx + 14, gy - 70, 46, 12, '#B07A4A'); strokeRect(g, fx + 14, gy - 70, 46, 12, '#5A3A20');
    icon(g, 'gear', fx + 26, gy - 68); icon(g, 'bolt', fx + 40, gy - 68);
    // banderines de colores sobre el patio
    const cols = [PAL.coral, PAL.sun, PAL.teal, PAL.lime, PAL.pink, PAL.violet];
    for (let i = 0; i < 40; i++) {
      const wx = 80 + i * 17, sx = wx - cx;
      if (sx < -20 || sx > W + 20) continue;
      const sag = Math.sin((i % 8) / 8 * Math.PI) * 10, yy = 70 + sag - cy;
      const sag2 = Math.sin(((i % 8) + 1) / 8 * Math.PI) * 10;
      pline(g, sx, yy, sx + 17, 70 + sag2 - cy, '#3A2E5A');
      for (let r = 0; r < 6; r++) rect(g, sx + 4 + r * 0.5, yy + 1 + r, 7 - r, 1, cols[i % cols.length]);
    }
  },
  extraDraw(lv, g, cx, cy) {
    const gy = 14 * TILE - cy;
    for (const [tx, label] of TRAIN_SIGNS) {
      const sx = Math.round(tx * TILE - cx), w = textW(label) + 8;
      if (sx + w < 0 || sx - w > W) continue;
      rect(g, sx - 1, gy - 18, 2, 18, '#6B4A2A');
      rect(g, sx - w / 2, gy - 29, w, 11, '#B07A4A'); strokeRect(g, sx - w / 2, gy - 29, w, 11, '#5A3A20'); rect(g, sx - w / 2 + 1, gy - 28, w - 2, 1, '#D8A06A');
      drawText(g, label, sx, gy - 27, '#3A2010', { align: 'center' });
    }
  },
  onEnter: lv => practiceIntro(lv)
}, buildPractice());
