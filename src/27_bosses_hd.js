// =====================================================================
//  ARTE HD DE LOS JEFES: detalle a medio píxel
//  Se dibuja ENCIMA del sprite base de cada jefe, en el lienzo de
//  BossFX (a resolución de pantalla), así que 0,5 = un píxel real de la
//  pantalla: remaches, brillos de metal, reflejos de cristal, texturas
//  de roca, grietas de lava, venas de hojas... Sigue siendo pixel art,
//  pero con el doble de resolución en los detalles.
// =====================================================================
const HD_ = 0.5;
const hdPx = (g, x, y, c) => { g.fillStyle = c; g.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, HD_, HD_); };
const hdRect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x * 2) / 2, Math.round(y * 2) / 2, Math.round(w * 2) / 2, Math.round(h * 2) / 2); };
function hdLine(g, x0, y0, x1, y1, c) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
  g.fillStyle = c;
  for (let i = 0; i <= n; i++) { const k = i / n; g.fillRect(Math.round((x0 + (x1 - x0) * k) * 2) / 2, Math.round((y0 + (y1 - y0) * k) * 2) / 2, HD_, HD_); }
}
// arco de elipse (ángulos en radianes)
function hdArc(g, cx, cy, rx, ry, a0, a1, c) {
  const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) * 2));
  g.fillStyle = c;
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; g.fillRect(Math.round((cx + Math.cos(a) * rx) * 2) / 2, Math.round((cy + Math.sin(a) * ry) * 2) / 2, HD_, HD_); }
}
// destello en cruz
function hdGlint(g, x, y, c = '#FFFFFF', big) {
  hdPx(g, x, y, c); hdPx(g, x - 0.5, y, c); hdPx(g, x + 0.5, y, c); hdPx(g, x, y - 0.5, c); hdPx(g, x, y + 0.5, c);
  if (big) { hdPx(g, x - 1, y, c); hdPx(g, x + 1, y, c); hdPx(g, x, y - 1, c); hdPx(g, x, y + 1, c); }
}
// remache: punto de luz arriba-izquierda y sombra abajo-derecha
function hdRivet(g, x, y, light = '#E8EEFF', dark = '#1A1F3A') { hdPx(g, x, y, light); hdPx(g, x + 0.5, y + 0.5, dark); }
// tramado a medio píxel (textura y degradados)
function hdDither(g, x, y, w, h, c, level, seed = 0) {
  g.fillStyle = c;
  const th = level * 16;
  for (let j = 0; j < h * 2; j++) for (let i = 0; i < w * 2; i++) if (BAYER[((j + seed) & 3) * 4 + ((i + seed) & 3)] < th) g.fillRect(x + i / 2, y + j / 2, HD_, HD_);
}
// puntos pseudoaleatorios estables (texturas que no «hierven»)
function hdSpeckle(g, x, y, w, h, n, c, seed) {
  const r = mulberry32(seed);
  g.fillStyle = c;
  for (let i = 0; i < n; i++) g.fillRect(x + Math.floor(r() * w * 2) / 2, y + Math.floor(r() * h * 2) / 2, HD_, HD_);
}
const hdA = (g, a, fn) => { const o = g.globalAlpha; g.globalAlpha = o * a; fn(); g.globalAlpha = o; };

// ---------- 1 · Capitán Cortocircuito: barril remachado, sombrero con galón, monóculo ----------
BOSSES.puerto.drawHD = function (b, g, x, y) {
  const f = b.face, fr = b.friendly, t = b.t, lift = b.air ? 2 : 0;
  const body = fr ? '#6FA0E0' : '#5A7AA8', dk = shade(body, -0.45), lt = shade(body, 0.45);
  // duelas del barril y brillo especular vertical
  hdLine(g, x + 6.5, y + 11, x + 5.5, y + 24, dk); hdLine(g, x + 19.5, y + 11, x + 20.5, y + 24, dk);
  hdA(g, 0.7, () => { hdRect(g, x + 8, y + 12.5, 0.5, 4, '#FFFFFF'); hdRect(g, x + 9, y + 12, 0.5, 2, '#FFFFFF'); });
  hdLine(g, x + 3, y + 14.5, x + 6, y + 11.5, lt);
  // remaches a lo largo del aro
  for (let i = 0; i < 6; i++) hdRivet(g, x + 4 + i * 3.6, y + 21.5);
  for (const [rx, ry] of [[4, 17], [22, 17], [8, 24], [18, 24]]) hdPx(g, x + rx + 0.5, y + ry + 0.5, '#1A1F3A');
  // óxido con tramado (se va al depurarlo)
  if (!fr) { hdSpeckle(g, x + 3, y + 22, 8, 3, 7, '#C8612E', 11); hdSpeckle(g, x + 16, y + 13, 6, 3, 5, '#9A4A22', 12); }
  // pistones de las piernas
  hdRect(g, x + 7.5, y + 24.5 - lift, 0.5, 4, '#8A93C8'); hdRect(g, x + 17.5, y + 24.5 - lift, 0.5, 4, '#8A93C8');
  hdRect(g, x + 6, y + 28.5 - lift, 4, 0.5, '#22264A'); hdRect(g, x + 16, y + 28.5 - lift, 4, 0.5, '#22264A');
  // cañón: anillos y boca oscura
  const cX = f > 0 ? x + 23 : x - 4;
  hdRect(g, cX + 1, y + 16, 5, 0.5, '#8A93C8'); hdRect(g, cX + 2.5, y + 16, 0.5, 4, '#22264A'); hdRect(g, cX + 4, y + 16, 0.5, 4, '#22264A');
  hdRect(g, f > 0 ? cX + 5.5 : cX + 0.5, y + 16.5, 0.5, 3, '#0A0E1C');
  // monóculo: reflejo del cristal y cadenita dorada hasta el sombrero
  const ex = x + 13 + f * 2, ey = y + 13;
  hdArc(g, ex, ey, 3.5, 3.5, Math.PI * 1.05, Math.PI * 1.45, '#FFFFFF');
  hdA(g, 0.8, () => hdPx(g, ex - 2, ey - 1.5, '#DDE6FF'));
  for (let k = 0; k <= 6; k++) { const kk = k / 6; hdPx(g, lerp(ex + 4.5, x + (f > 0 ? 22 : 4), kk), lerp(ey + 1, y + 8, kk) + Math.sin(kk * Math.PI) * 1.5, k % 2 ? '#FFD84A' : '#B8862A'); }
  // bigote de cables: hebras
  hdRect(g, x + 7, y + 19, 12, 0.5, fr ? '#FFF3A0' : '#FFC27A'); hdRect(g, x + 7.5, y + 20.5, 11, 0.5, '#B8622A');
  if (!fr && Math.floor(t * 9) % 4 === 0) hdGlint(g, f > 0 ? x + 19.5 : x + 6, y + 18, PAL.sun);
  // sombrero: galón dorado, brillo de la copa y ancla con destello
  for (let i = 0; i < 16; i++) hdPx(g, x + 2 + i * 1.5, y + 6.5, i % 2 ? '#FFF3A0' : PAL.sun);
  hdRect(g, x + 6, y, 14, 0.5, '#3A6AB8'); hdRect(g, x + 6, y + 0.5, 0.5, 4.5, '#2A5298');
  hdRect(g, x + 2, y + 8.5, 22, 0.5, '#0A1A3A');
  hdGlint(g, x + 12.5, y + 1.5, '#FFFFFF');
  // FURIA: grietas incandescentes en el barril
  if ((b.stage || 1) === 3 && !fr) {
    const c = Math.floor(t * 10) % 2 ? PAL.coral : '#FFD84A';
    hdLine(g, x + 10, y + 12, x + 11.5, y + 16, c); hdLine(g, x + 11.5, y + 16, x + 10.5, y + 19, c); hdLine(g, x + 17, y + 22, x + 19.5, y + 24.5, c);
  }
};

// ---------- 2 · Gran Bugglin Rey: caparazón iridiscente, antenas y corona enjoyada ----------
BOSSES.valle.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t, f = b.face;
  const shell = fr ? '#FF6B6B' : '#9B76FF', shellD = fr ? '#B8334A' : '#5B3A8C';
  const iri = fr ? ['#FFD0D0', '#FFFFFF', '#FFB0B0'] : ['#7FE7FF', '#FFFFFF', '#C9B2FF', '#B6F35B'];
  if (b.rolling) {
    const c0 = x + 16, c1 = y + 10;
    // estelas de velocidad y brillo que gira con la bola
    hdArc(g, c0, c1, 12, 12, b.spin + 2.2, b.spin + 3.6, '#FFFFFF');
    hdA(g, 0.5, () => hdArc(g, c0, c1, 13, 13, b.spin + 2.4, b.spin + 3.4, iri[0]));
    hdArc(g, c0, c1, 8.5, 8.5, Math.PI * 1.1, Math.PI * 1.45, '#FFFFFF');
    return;
  }
  if (b.flipped) {
    // panza: segmentos con brillo
    for (let k = 0; k < 4; k++) { hdRect(g, x + 7.5 + k * 5, y + 10, 0.5, 6, '#FFFFFF'); hdA(g, 0.4, () => hdRect(g, x + 6.5 + k * 5, y + 10, 0.5, 6, shellD)); }
    hdArc(g, x + 16, y + 13, 12, 4.5, Math.PI * 1.1, Math.PI * 1.9, '#FFFFFF');
    return;
  }
  // caparazón: banda iridiscente, textura y brillo junto a la sutura
  for (let i = 0; i <= 28; i++) {
    const a = Math.PI * (1.08 + i * 0.03), c = iri[Math.floor(i / 3 + t * 4) % iri.length];
    hdA(g, 0.75, () => hdPx(g, x + 16 + Math.cos(a) * 11.5, y + 10 + Math.sin(a) * 5.5, c));
  }
  hdRect(g, x + 16.5, y + 3.5, 0.5, 11, shade(shell, 0.35)); hdRect(g, x + 15.5, y + 4, 0.5, 11, shade(shellD, -0.3));
  hdSpeckle(g, x + 4, y + 12, 24, 4, 26, shade(shell, -0.28), 21);
  // manchas con reflejo
  for (const [sx, sy, r] of [[9, 8, 2], [23, 8, 2], [12, 13, 1], [21, 13, 1]]) { hdPx(g, x + sx - r * 0.5, y + sy - r * 0.5, '#FFFFFF'); hdPx(g, x + sx + r * 0.5, y + sy + r * 0.5, shade(fr ? '#1A1030' : '#B6F35B', -0.4)); }
  // patas articuladas
  for (let i = 0; i < 3; i++) { const lx = x + 6 + i * 9, ph = b.air ? 0 : Math.round(Math.sin(t * 10 + i * 2) * 1.5); hdPx(g, lx + ph + 0.5, y + 17, '#8C93B8'); hdPx(g, lx + 4 - ph + 0.5, y + 17, '#8C93B8'); }
  // cabeza: antenas, mandíbulas brillantes y corona enjoyada
  const hx = f > 0 ? x + 26 : x - 4, ax = f > 0 ? hx + 8 : hx;
  const sw = Math.sin(t * 5) * 0.8;
  pline(g, ax, y + 8, ax + f * 3, y + 4 + Math.round(sw), OUTLINE); pline(g, ax + f * 3, y + 4 + Math.round(sw), ax + f * 5, y + 3 + Math.round(sw), OUTLINE);
  hdLine(g, ax + f * 0.5, y + 7.5, ax + f * 3, y + 4 + Math.round(sw), shade(shellD, 0.5));
  hdGlint(g, ax + f * 5.5, y + 2.5 + Math.round(sw), fr ? PAL.sun : '#B6F35B');
  hdArc(g, hx + 4, y + 11, 4, 4, Math.PI * 1.1, Math.PI * 1.5, shade(shellD, 0.45));
  const mx = f > 0 ? hx + 9 : hx - 1; hdPx(g, mx + 0.5, y + 13, '#FFFFFF');
  // corona: grabado, gemas y destello
  hdRect(g, hx, y + 3.5, 8, 0.5, '#B8862A');
  [PAL.coral, PAL.teal, '#B6F35B'].forEach((c, k) => { hdRect(g, hx + k * 3 + 0.5, y - 1.5, 1, 1, c); hdPx(g, hx + k * 3 + 0.5, y - 1.5, '#FFFFFF'); });
  if (Math.floor(t * 3) % 4 === 0) hdGlint(g, hx + 1, y + 2, '#FFFFFF');
};

// ---------- 3 · Don Nubarrón: nube esponjosa con volutas, gafas con reflejo ----------
BOSSES.solaria.drawHD = function (b, g, x, y) {
  const fr = b.friendly, dim = b.low || b.stunned, t = b.t;
  y += b.portrait ? 0 : Math.round(Math.sin(t * 2) * 1.5);
  const c1 = fr ? '#F4F6FF' : dim ? '#A0A0C0' : '#C4C4E0', c2 = fr ? '#C9D2F0' : dim ? '#70708E' : '#8A8AB0';
  const blobs = [[10, 16, 9], [22, 11, 12], [34, 16, 9], [16, 19, 8], [28, 19, 8]];
  // volutas de luz arriba y sombra esponjosa abajo
  for (const [bx, by, r] of blobs) {
    hdArc(g, x + bx, y + by - 2, r - 3, r - 3, Math.PI * 1.15, Math.PI * 1.55, '#FFFFFF');
    hdA(g, 0.6, () => hdArc(g, x + bx, y + by - 1, r - 5, r - 5, Math.PI * 1.2, Math.PI * 1.45, '#FFFFFF'));
    hdA(g, 0.55, () => hdArc(g, x + bx, y + by, r - 0.5, r - 0.5, Math.PI * 0.2, Math.PI * 0.8, shade(c2, -0.3)));
  }
  hdDither(g, x + 6, y + 21, 32, 3, shade(c2, -0.15), 0.35);
  // gafas de sol: montura con brillo y reflejos en diagonal
  if (!fr && !(b.expr === 'dizzy' || b.stunned)) {
    hdRect(g, x + 13, y + 10, 7, 0.5, '#4A4A70'); hdRect(g, x + 23, y + 11, 7, 0.5, '#4A4A70');
    hdA(g, 0.8, () => { hdLine(g, x + 14.5, y + 13.5, x + 16.5, y + 10.5, '#FFFFFF'); hdLine(g, x + 24.5, y + 14.5, x + 26.5, y + 11.5, '#FFFFFF'); });
  }
  // chispas eléctricas dentro de la nube cuando está enfadado
  if (!fr && !dim && !b.portrait && Math.floor(t * 7) % 3 === 0) {
    const sx = x + 10 + (Math.floor(t * 7) * 7) % 24;
    hdLine(g, sx, y + 20, sx + 1.5, y + 22, PAL.sun); hdLine(g, sx + 1.5, y + 22, sx + 0.5, y + 23.5, '#FFFFFF');
  }
  if (fr) { hdA(g, 0.7, () => { hdRect(g, x + 12, y + 15.5, 2, 0.5, '#FF8AB0'); hdRect(g, x + 29, y + 15.5, 2, 0.5, '#FF8AB0'); }); hdGlint(g, x + 36, y + 6, PAL.sun); }
};

// ---------- 4 · Tornado Loopling: corrientes de viento, hojas y núcleo de cristal ----------
BOSSES.aeris.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t, cx0 = x + 14;
  if (b.spin && !fr) {
    // corrientes finas que suben girando
    for (let i = 0; i < 11; i++) {
      const yy = y + 44 - i * 4, rw = 3 + i * 1.2, off = Math.round(Math.sin(t * 6 + i * 0.7) * 2), ph = t * 9 + i * 0.9;
      hdA(g, 0.85, () => hdArc(g, cx0 + off, yy - 0.5, rw, 1.5, ph % 6.283, ph % 6.283 + 1.4, '#FFFFFF'));
      hdA(g, 0.5, () => hdArc(g, cx0 + off, yy + 0.5, rw + 0.5, 1.5, (ph + 3) % 6.283, (ph + 3) % 6.283 + 1, '#2A7ACC'));
    }
    // hojas con nervio
    for (let k = 0; k < 4; k++) { const a = t * 4 + k * 1.6, lx = cx0 + Math.cos(a) * (8 + k * 2), ly = y + 10 + k * 9 + Math.sin(a) * 2; hdRect(g, lx, ly, 1.5, 1, '#66D66A'); hdPx(g, lx + 0.5, ly, '#B6F35B'); }
  }
  const coreY = b.spin && !fr ? y + 20 : fr ? y + 24 : y + 36;
  // núcleo: anillo de cristal con reflejos y remolino interior
  hdArc(g, cx0, coreY, 5, 5, Math.PI * 1.05, Math.PI * 1.5, '#FFFFFF');
  hdA(g, 0.6, () => hdArc(g, cx0, coreY, 5, 5, Math.PI * 0.1, Math.PI * 0.5, '#0A2A5A'));
  for (let k = 0; k < 3; k++) { const a = t * 6 + k * 2.09; hdPx(g, cx0 + Math.cos(a) * 3.5, coreY + Math.sin(a) * 3.5, '#9FE8FF'); }
  hdGlint(g, cx0 - 3, coreY - 4, '#FFFFFF');
};

// ---------- 5 · Hidra de Compuertas: metal remachado, cáusticas y goteo ----------
BOSSES.hydria.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t;
  const pipe = fr ? '#9FE8FF' : '#59C7FF', pipeD = fr ? '#59C7FF' : '#163A73';
  // cáusticas del embalse
  for (let i = 0; i < 14; i++) { const cx = x + ((i * 13 + t * 14) % b.w), cy = y + 36 + (i % 3) * 3; hdRect(g, cx, cy, 1.5, 0.5, '#9CF5F0'); hdPx(g, cx + 1.5, cy + 0.5, '#59E0E8'); }
  hdRect(g, x, y + 32, b.w, 0.5, '#B8FFFA');
  // cuerpo de tuberías: brillo metálico y remaches en cada abrazadera
  hdA(g, 0.6, () => hdArc(g, x + 50, y + 26, 27, 11.5, Math.PI * 1.1, Math.PI * 1.75, '#FFFFFF'));
  for (let i = 0; i < 5; i++) { hdRivet(g, x + 26.5 + i * 11, y + 15.5); hdRivet(g, x + 26.5 + i * 11, y + 34); hdRect(g, x + 27.5 + i * 11, y + 14, 0.5, 22, shade(pipeD, 0.35)); }
  // volante con radios brillantes
  hdGlint(g, x + 62.5, y + 18.5, '#FFF3A0');
  // cuellos: brillo en cada anillo
  const heads = b.parts && b.parts.length ? b.parts : HYDRA_HOME.map(([hx, hy], i) => ({ x: (b.x || 0) + hx, y: (b.y || 0) + hy, idx: i, stuck: 0, flashT: 0, mode: 'idle' }));
  heads.forEach((h, i) => {
    const hx = x + (h.x - (b.x || 0)), hy = y + (h.y - (b.y || 0)), ax = x + 30 + i * 12, ay = y + 18;
    for (let k = 0; k <= 8; k++) { const kk = k / 8, nx = lerp(ax, hx + 8, kk), ny = lerp(ay, hy + 8, kk) - Math.sin(kk * Math.PI) * 10; hdPx(g, Math.round(nx) - 1.5, Math.round(ny) - 2, '#FFFFFF'); }
    if (h.flashT > 0) return;
    // cabeza: brillo superior, tornillos en las esquinas y boquilla oscura
    hdRect(g, hx + 0.5, hy + 0.5, 15, 0.5, shade(pipe, 0.5));
    hdRect(g, hx, hy + 9.5, 16, 0.5, shade(pipeD, -0.3));
    for (const [rx, ry] of [[1, 2], [14.5, 2], [1, 11.5], [14.5, 11.5]]) hdRivet(g, hx + rx, hy + ry);
    hdRect(g, hx - 2.5, hy + 7, 0.5, 1.5, '#0A0E1C');
    // goteo de la boquilla
    const dy = (t * 26 + i * 7) % 10;
    if (!fr || i === 1) hdA(g, 1 - dy / 10, () => hdRect(g, hx - 2, hy + 9.5 + dy, 0.5, 1, '#9FE8FF'));
  });
};

// ---------- 6 · Compostor Glotón: plástico con nervios, símbolo de reciclaje HD, vapores ----------
BOSSES.bioloop.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t;
  const bin = fr ? '#66D66A' : '#3FA85A', binD = fr ? '#3FA85A' : '#2A6A3A';
  // nervios del contenedor con brillo
  for (let i = 0; i < 4; i++) { hdRect(g, x + 8 + i * 7, y + 14, 0.5, 15, shade(bin, 0.3)); hdRect(g, x + 5.5 + i * 7, y + 14, 0.5, 15, shade(binD, -0.3)); }
  hdRect(g, x + 2, y + 12, 32, 0.5, shade(bin, 0.4)); hdRect(g, x + 2, y + 30.5, 32, 0.5, shade(binD, -0.35));
  // símbolo de reciclaje: tres flechas en triángulo
  hdRect(g, x + 13, y + 22, 10, 6, binD);
  const cr = '#FFF3D7';
  hdLine(g, x + 17.5, y + 23, x + 15.5, y + 26, cr); hdLine(g, x + 18.5, y + 23, x + 20.5, y + 26, cr); hdLine(g, x + 16, y + 27.5, x + 20, y + 27.5, cr);
  // puntas de flecha (sentido horario)
  hdPx(g, x + 20, y + 24.5, cr); hdPx(g, x + 21, y + 25, cr); hdPx(g, x + 15, y + 27, cr); hdPx(g, x + 15.5, y + 26.5, cr); hdPx(g, x + 17, y + 23.5, cr); hdPx(g, x + 16.5, y + 24, cr);
  // manchas de compost y suciedad
  if (!fr) hdSpeckle(g, x + 3, y + 26, 30, 4, 14, '#6A4A2A', 61);
  // tapa: asa, bisagras y brillo
  const open = Math.round((b.mouth || 0) * 9), ly = y + 4 - open;
  hdRect(g, x + 15, ly - 1.5, 6, 1.5, OUTLINE); hdRect(g, x + 15.5, ly - 1, 5, 0.5, shade(bin, 0.4));
  hdRivet(g, x + 2.5, ly + 5.5); hdRivet(g, x + 33, ly + 5.5);
  hdRect(g, x + 1, ly + 6.5, 34, 0.5, shade(binD, -0.35));
  // dientes de la boca abierta
  if (open > 2) for (let i = 0; i < 7; i++) { hdRect(g, x + 4 + i * 4.5, y + 11 - open + 1, 1, 1, '#FFF3D7'); }
  // hojas: nervio central
  for (let i = 0; i < 4; i++) { const lx = x + 6 + i * 8, sw = Math.round(Math.sin(t * 3 + i) * 1.5); hdRect(g, lx + sw + 1.25, ly - 3.5, 0.5, 3, shade(i % 2 ? '#66D66A' : '#B6F35B', -0.3)); }
  // vapor maloliente (solo enfadado)
  if (!fr && !b.portrait) for (let k = 0; k < 3; k++) {
    const ph = (t * 0.7 + k * 0.33) % 1, sx = x + 8 + k * 10, sy = ly - 4 - ph * 10;
    hdA(g, 1 - ph, () => { for (let j = 0; j < 4; j++) hdPx(g, sx + Math.sin(ph * 9 + j) * 1.2, sy - j * 0.5, '#B6F35B'); });
  }
};

// ---------- 7 · Magmatón: roca con textura, grietas de lava incandescentes, pantalla de estado ----------
BOSSES.gea.drawHD = function (b, g, x, y, iso) {
  const fr = b.friendly, t = b.t, st = b.st || 'REPOSO';
  const glow = fr ? '#FFB060' : MAGMA_COL[st] || '#8A3A2A';
  const rock = fr ? '#7A5A4A' : st === 'ENFRIANDO' ? '#5A5A6A' : '#4A3030', rockL = shade(rock, 0.4), rockD = shade(rock, -0.35);
  const pf = st === 'ERUPCIÓN' ? -3 : 0;
  // textura de roca: motas estables, recortadas a la silueta (solo en el lienzo del jefe)
  if (iso) {
    g.globalCompositeOperation = 'source-atop';
    hdSpeckle(g, x + 3, y + 11, 26, 20, 26, rockL, 71); hdSpeckle(g, x + 3, y + 11, 26, 20, 26, rockD, 72);
    hdSpeckle(g, x + 9, y + 2, 14, 10, 8, rockD, 73); hdSpeckle(g, x + 5, y + 29, 22, 8, 8, rockL, 74);
    g.globalCompositeOperation = 'source-over';
  }
  // aristas de luz en cada roca
  hdArc(g, x + 16, y + 21, 12, 10, Math.PI * 1.1, Math.PI * 1.45, shade(rock, 0.65));
  hdArc(g, x + 16, y + 7, 7, 5, Math.PI * 1.1, Math.PI * 1.5, shade(rock, 0.65));
  for (const [cx, cy] of [[0, 20 + pf], [32, 20 + pf], [9, 33], [23, 33]]) hdArc(g, x + cx, y + cy, 3, 3, Math.PI * 1.1, Math.PI * 1.5, shade(rock, 0.6));
  // grietas: núcleo blanco que late y brasas
  const hot = !fr && (st === 'ERUPCIÓN' || st === 'CALENTANDO' || st === 'FAULT');
  const core = hot ? '#FFFFFF' : shade(glow, 0.5), k = 0.55 + 0.45 * Math.sin(t * (hot ? 14 : 4));
  hdA(g, k, () => {
    hdLine(g, x + 8.5, y + 12, x + 12.5, y + 20, core); hdLine(g, x + 12.5, y + 20, x + 9.5, y + 28, core);
    hdLine(g, x + 22.5, y + 13, x + 19.5, y + 22, core); hdLine(g, x + 19.5, y + 22, x + 24.5, y + 29, core);
  });
  hdA(g, 0.45, () => { hdLine(g, x + 9, y + 12, x + 13, y + 20, glow); hdLine(g, x + 22, y + 13.5, x + 19, y + 22.5, glow); });
  if (!fr && !b.portrait && Math.random() < (hot ? 0.5 : 0.15)) Particles.spawn({ x: (b.x || 0) + rand(6, 26), y: (b.y || 0) + rand(12, 28), vx: rand(-10, 10), vy: rand(-50, -20), life: 0.6, type: 'dot', color: choice([glow, PAL.sun, '#FFFFFF']) });
  // pantalla del pecho: líneas de barrido y reflejo
  for (let r = 0; r < 4; r++) hdA(g, 0.35, () => hdRect(g, x + 13, y + 23 + r + 0.5, 6, 0.5, shade(glow, -0.5)));
  hdPx(g, x + 13.5, y + 23, '#FFFFFF'); hdRect(g, x + 13 + ((t * 8) % 6), y + 23, 0.5, 4, '#FFFFFF');
  // ojos encendidos con brillo
  if (!(fr || b.expr === 'happy' || b.expr === 'dizzy')) { hdPx(g, x + 11.5, y + 5.5, '#FFFFFF'); hdPx(g, x + 18.5, y + 5.5, '#FFFFFF'); hdRect(g, x + 11, y + 7.5, 3, 0.5, shade(glow, -0.4)); hdRect(g, x + 18, y + 7.5, 3, 0.5, shade(glow, -0.4)); }
  // cráter: borde brillante
  hdRect(g, x + 14, y + 0.5, 5, 0.5, hot ? '#FFFFFF' : shade(glow, 0.4));
  if (fr) { hdPx(g, x + 12.5, y + 0.5, '#B6F35B'); hdPx(g, x + 20.5, y + 0.5, '#FFFFFF'); }
};

// ---------- 8 · Kraken de Fugas: casco brillante remachado, manómetros con escala, ventosas ----------
BOSSES.h2.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t;
  const body = fr ? '#B6A0FF' : '#7C5AC8', bodyD = shade(body, -0.35);
  // tentáculos: ventosas y brillo lateral
  for (const tn of (b.parts || [])) {
    if (tn.mode === 'idle' || tn.mode === 'warn' || (tn.mode === 'up' && tn.y <= -70) || tn.flashT > 0) continue;
    const tx0 = x + (tn.x - b.x) + 8, tipY = y + (tn.y - b.y), botY = tipY + tn.h;
    hdA(g, 0.5, () => hdRect(g, tx0 - 5.5, tipY + 1, 0.5, tn.h - 3, '#FFFFFF'));
    for (let yy = tipY + 3; yy < botY - 9; yy += 5) { hdArc(g, tx0 + 3, yy, 1, 1, 0, 6.28, shade(body, 0.45)); hdPx(g, tx0 + 3, yy, bodyD); }
  }
  // cabeza: reflejo grande, segundo reflejo y remaches de la junta
  hdA(g, 0.75, () => hdArc(g, x + 36, y + 30, 26.5, 22.5, Math.PI * 1.12, Math.PI * 1.42, '#FFFFFF'));
  hdA(g, 0.4, () => hdArc(g, x + 36, y + 30, 24.5, 20.5, Math.PI * 1.15, Math.PI * 1.35, '#FFFFFF'));
  hdRect(g, x + 18, y + 13, 1.5, 1, '#FFFFFF'); hdPx(g, x + 20, y + 12, '#FFFFFF');
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.12 + i * 0.095); hdRivet(g, x + 36 + Math.cos(a) * 26, y + 31 + Math.sin(a) * 21.5, shade(body, 0.6), shade(bodyD, -0.4)); }
  hdA(g, 0.5, () => hdArc(g, x + 36, y + 30, 28.5, 24.5, Math.PI * 0.15, Math.PI * 0.85, shade(bodyD, -0.4)));
  // manómetros: escala, zona roja y reflejo del cristal
  for (const ox of [26, 46]) {
    for (let k = 0; k < 9; k++) { const a = Math.PI * (0.75 + k * 0.1875); hdPx(g, x + ox + Math.cos(a) * 5, y + 26 + Math.sin(a) * 5, '#3A4068'); }
    hdArc(g, x + ox, y + 26, 5, 5, Math.PI * 2.0, Math.PI * 2.25, PAL.coral);
    hdA(g, 0.8, () => hdArc(g, x + ox, y + 26, 4.5, 4.5, Math.PI * 1.1, Math.PI * 1.4, '#FFFFFF'));
  }
  // válvula con brillo y fuga de vapor fina
  hdRect(g, x + 34, y + 3, 4, 0.5, '#FFFFFF');
  if (!fr && !b.portrait) for (let k = 0; k < 4; k++) { const ph = (t * 1.6 + k / 4) % 1; hdA(g, 1 - ph, () => hdPx(g, x + 36 + Math.sin(ph * 12 + k) * 2, y + 1 - ph * 9, '#FFFFFF')); }
};

// ---------- 9 · Drenadora Suprema: cúpula de cristal con circuitos y energía que circula ----------
BOSSES.bateria.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t;
  const dome = fr ? '#FF9FD8' : '#FF4FB8', domeD = fr ? '#D06AB0' : '#B8338A';
  // pistas de circuito dentro de la cúpula
  const tr = shade(dome, -0.22);
  hdLine(g, x + 6, y + 16, x + 10, y + 16, tr); hdLine(g, x + 10, y + 16, x + 12, y + 18, tr);
  hdLine(g, x + 24, y + 15, x + 20, y + 15, tr); hdLine(g, x + 20, y + 15, x + 18.5, y + 17.5, tr);
  hdLine(g, x + 15, y + 6, x + 15, y + 9, tr);
  for (const [px0, py0] of [[6, 16], [24, 15], [15, 6]]) hdRect(g, x + px0 - 0.5, y + py0 - 0.5, 1, 1, tr);
  // energía que viaja por las pistas
  const k = (t * 1.3) % 1;
  hdGlint(g, x + lerp(6, 12, k), y + lerp(16, 18, k), PAL.sun); hdGlint(g, x + lerp(24, 18.5, k), y + lerp(15, 17.5, k), PAL.sun);
  // cristal: reflejos curvos
  hdA(g, 0.85, () => hdArc(g, x + 15, y + 14, 11.5, 7.5, Math.PI * 1.1, Math.PI * 1.45, '#FFFFFF'));
  hdA(g, 0.5, () => hdArc(g, x + 15, y + 14, 9.5, 5.5, Math.PI * 1.15, Math.PI * 1.35, '#FFFFFF'));
  hdA(g, 0.5, () => hdArc(g, x + 15, y + 14, 13, 9, Math.PI * 0.15, Math.PI * 0.45, '#FFFFFF'));
  // franja de luces
  for (let i = 0; i < 7; i++) hdPx(g, x + 4.5 + i * 3.5, y + 20, Math.floor(t * 6 + i) % 3 === 0 ? '#FFFFFF' : shade(domeD, 0.4));
  // corona de pilas: polos + y nivel de carga
  for (let i = 0; i < 3; i++) { hdRect(g, x + 8 + i * 6, y + 2, 0.5, 4, '#FFFFFF'); hdPx(g, x + 9 + i * 6, y + 0.5, '#FFFFFF'); }
  // pilas del escudo: brillo, polo y nivel
  for (const c of (b.parts || [])) {
    if (c.gone || c.flashT > 0) continue;
    const cx0 = x + (c.x - b.x), cy0 = y + (c.y - b.y);
    hdRect(g, cx0 + 0.5, cy0 + 3.5, 0.5, 9.5, '#5A62A8'); hdRect(g, cx0 + 11, cy0 + 3.5, 0.5, 9.5, '#14183A');
    hdRect(g, cx0 + 4.5, cy0 - 2.5, 3, 0.5, '#FFFFFF');
    hdRect(g, cx0 + 2, cy0 + 12, 8 * ((c.num % 5) + 1) / 5, 0.5, PAL.lime);
  }
};

// ---------- 10 · Sobrecarga: cristal tallado con facetas, refracción arcoíris y núcleo vivo ----------
BOSSES.prisma.drawHD = function (b, g, x, y) {
  const fr = b.friendly, t = b.t, c0 = x + 16, c1 = y + 16;
  const col = fr ? hsl(t * 60, 80, 72) : PRISMA_MODE_COL[b.mode] || '#C9B2FF';
  // facetas
  hdA(g, 0.7, () => { hdLine(g, c0, c1 - 10.5, c0 - 5, c1 - 1, '#FFFFFF'); hdLine(g, c0, c1 - 10.5, c0 + 5, c1 - 1, shade(col, 0.5)); });
  hdA(g, 0.6, () => { hdLine(g, c0 - 5, c1 + 1, c0, c1 + 10.5, shade(col, -0.45)); hdLine(g, c0 + 5, c1 + 1, c0, c1 + 10.5, shade(col, -0.3)); });
  hdA(g, 0.5, () => { hdLine(g, c0 - 10, c1, c0 - 5, c1 - 1, '#FFFFFF'); hdLine(g, c0 + 10, c1, c0 + 5, c1 - 1, '#FFFFFF'); });
  // refracción arcoíris por el borde superior
  for (let k = 0; k < 11; k++) { hdPx(g, c0 - 11 + k + 0.5, c1 - k - 0.5, hsl(k * 32 + t * 120, 90, 70)); hdPx(g, c0 + k + 0.5, c1 - 11 + k + 0.5, hsl(k * 32 + 180 + t * 120, 90, 70)); }
  // núcleo de luz que late
  const r = 1.5 + Math.sin(t * 6) * 0.5;
  hdA(g, 0.6, () => hdArc(g, c0, c1 - 5, r + 1, r + 1, 0, 6.28, '#FFFFFF'));
  hdGlint(g, c0 - 4, c1 - 6, '#FFFFFF', true);
  // esquirlas con borde de luz
  for (let i = 0; i < 6; i++) {
    const a = (b.rot || 0) + i * Math.PI / 3, sx = c0 + Math.cos(a) * 15, sy = c1 + Math.sin(a) * 15 * 0.8;
    hdPx(g, Math.round(sx) - 0.5, Math.round(sy) - 2, '#FFFFFF'); hdPx(g, Math.round(sx) + 0.5, Math.round(sy) + 1.5, hsl(i * 60 + t * 90, 90, 70));
  }
};
