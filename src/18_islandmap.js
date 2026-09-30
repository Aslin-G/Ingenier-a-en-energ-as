// =====================================================================
//  MAPA DEL ARCHIPIÉLAGO AURORA (ilustrado, a doble resolución)
//  Cada isla tiene una ilustración propia que representa su tema y su
//  energía. Se dibuja a doble densidad (RES) y existe en tres versiones:
//  restaurada (color y luces), apagada (en pleno apagón) y por descubrir
//  (cubierta de niebla). Encima se animan molinos, turbinas, cascadas,
//  lava, neón, el haz del faro, etc.
// =====================================================================
const ISL_W = 80, ISL_H = 60;            // tamaño de cada ilustración en píxeles de juego
const ISL_DW = ISL_W * RES, ISL_DH = ISL_H * RES; // en píxeles reales
const ISL_AX = 40, ISL_AY = 38;          // punto de la ilustración que coincide con la posición de la isla

// utilidades de dibujo en píxeles reales del lienzo de la isla
function islandKit(g) {
  return {
    R: (x, y, w, h, c) => rect(g, x, y, w, h, c),
    P: (x, y, c) => px(g, x, y, c),
    C: (x, y, r, c) => pcircle(g, x, y, r, c),
    E: (x, y, rx, ry, c) => pellipse(g, x, y, rx, ry, c),
    L: (x0, y0, x1, y1, c) => pline(g, x0, y0, x1, y1, c),
    // masa irregular (costa natural): elipse con bordes ondulados
    blob(cx, cy, rx, ry, c, seed = 1) {
      g.fillStyle = c;
      for (let dy = -ry; dy <= ry; dy++) {
        const t = dy / ry, base = rx * Math.sqrt(Math.max(0, 1 - t * t));
        const l = base * (1 + 0.07 * Math.sin(dy * 0.35 + seed) + 0.04 * Math.sin(dy * 0.9 + seed * 3));
        const r = base * (1 + 0.07 * Math.sin(dy * 0.31 + seed * 2) + 0.04 * Math.sin(dy * 1.1 + seed));
        g.fillRect(Math.round(cx - l), Math.round(cy + dy), Math.round(l + r), 1);
      }
    },
    // triángulo relleno (tejados, montañas, cristales)
    tri(x0, y0, x1, y1, x2, y2, c) {
      g.fillStyle = c;
      const pts = [[x0, y0], [x1, y1], [x2, y2]].sort((a, b) => a[1] - b[1]);
      const [a, b, d] = pts;
      const edge = (p, q, y) => p[1] === q[1] ? p[0] : p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]);
      for (let y = Math.ceil(a[1]); y <= Math.floor(d[1]); y++) {
        const xa = edge(a, d, y), xb = y < b[1] ? edge(a, b, y) : edge(b, d, y);
        g.fillRect(Math.round(Math.min(xa, xb)), y, Math.max(1, Math.round(Math.abs(xb - xa))), 1);
      }
    }
  };
}
// base de la isla: bajíos, playa, acantilado y superficie
function islandBase(K, o) {
  const { cx = 80, cy = 70, rx = 60, ry = 28, th = 10, top, top2, side, beach, seed = 1, floating } = o;
  if (!floating) {
    K.E(cx, cy + th + 3, rx + 14, ry + 9, 'rgba(127,231,255,0.28)');
    K.E(cx, cy + th + 2, rx + 7, ry + 5, 'rgba(160,240,255,0.35)');
    K.blob(cx, cy + th + 1, rx + 4, ry + 3, beach, seed + 7);
  }
  K.blob(cx, cy + th, rx, ry, side, seed);
  for (let i = 0; i < th; i += 3) K.blob(cx, cy + i, rx, ry, shade(side, 0.08 * (i % 2)), seed);
  K.blob(cx, cy, rx, ry, top, seed);
  if (top2) K.blob(cx - 6, cy - 4, rx * 0.7, ry * 0.6, top2, seed + 2);
  // textura: matas y piedrecitas
  const rng = mulberry32(seed * 977);
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng());
    const x = cx + Math.cos(a) * rx * 0.85 * r, y = cy + Math.sin(a) * ry * 0.8 * r;
    K.P(x, y, shade(top, rng() < 0.5 ? 0.18 : -0.15));
  }
}
function isHouse(K, x, y, wall, roof, lit, w = 10, h = 8) {
  K.R(x - 1, y - 1, w + 2, h + 2, OUTLINE); K.R(x, y, w, h, wall); K.R(x, y + h - 2, w, 2, shade(wall, -0.15));
  K.tri(x - 2, y, x + w / 2, y - 6, x + w + 2, y, roof);
  K.R(x + 2, y + 2, 2, 2, lit ? PAL.sun : '#3A4068'); K.R(x + w - 4, y + 2, 2, 2, lit ? PAL.sun : '#3A4068');
  K.R(x + w / 2 - 1, y + h - 4, 2, 4, shade(wall, -0.4));
}
function isPalm(K, x, y, h = 14) {
  for (let i = 0; i < h; i++) K.P(x + Math.round(Math.sin(i * 0.2) * 1.5), y - i, i % 3 ? '#8B5A3C' : '#6B4A2C');
  const tx = x + Math.round(Math.sin(h * 0.2) * 1.5), ty = y - h;
  for (const [dx, dy] of [[-6, 2], [6, 2], [-4, -2], [4, -2], [0, -3]]) K.L(tx, ty, tx + dx, ty + dy, '#3FA85A');
  K.P(tx, ty + 1, '#8B5A3C');
}
function isTree(K, x, y, r, c) { K.R(x - 1, y, 2, 4, '#6B4A2C'); K.C(x, y - r + 1, r, shade(c, -0.25)); K.C(x - 1, y - r, r - 1, c); K.P(x - 2, y - r - 1, shade(c, 0.35)); }
function isTurbineTower(K, x, y, h) { K.R(x, y - h, 1, h, '#FFFFFF'); K.R(x + 1, y - h, 1, h, '#C9D2F0'); }
function isPanels(K, x, y, cols, rows) {
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const X = x + c * 9 - r * 2, Y = y + r * 6;
    K.R(X - 1, Y - 1, 9, 6, '#10162B'); K.R(X, Y, 7, 4, '#2A4A9A'); K.R(X, Y, 7, 1, '#59C7FF'); K.R(X + 3, Y, 1, 4, '#3A5ABA');
  }
}

// ---------- Las 11 ilustraciones ----------
const ISLAND_ART = {
  puerto: {
    draw(K, lit) {
      islandBase(K, { top: '#7FC46A', top2: '#96D67A', side: '#7A5A3A', beach: '#F2D59A', seed: 3 });
      // muelles con barcas (sobre el agua, a la izquierda)
      K.R(14, 76, 34, 4, '#6B4A2C'); K.R(14, 76, 34, 1, '#B07A4A'); for (let i = 0; i < 4; i++) K.R(16 + i * 9, 80, 2, 6, '#4A2A18');
      K.R(20, 90, 26, 3, '#6B4A2C'); K.R(20, 90, 26, 1, '#B07A4A');
      // casas del puerto
      isHouse(K, 54, 58, '#FFF3D7', '#FF6B6B', lit); isHouse(K, 68, 64, '#FFE0B0', '#30E1C5', lit); isHouse(K, 84, 56, '#F4F6FF', '#FFD84A', lit); isHouse(K, 62, 76, '#FFE8D0', '#9B76FF', lit, 9, 7);
      // farolillos del festival
      for (let i = 0; i < 9; i++) { const x = 50 + i * 6, y = 48 + Math.round(Math.sin(i * 0.8) * 1.5); K.P(x, y, '#5A4A6A'); K.P(x, y + 1, lit ? [PAL.pink, PAL.sun, PAL.teal][i % 3] : '#4A4A6A'); }
      isPalm(K, 44, 70, 13); isPalm(K, 100, 74, 12);
      // faro del puerto
      const fx = 116;
      K.E(fx + 4, 76, 9, 3, '#8A8FB0');
      for (let y = 38; y < 76; y++) { const w = 6 + Math.round((y - 38) / 12); const x0 = fx + 4 - Math.floor(w / 2); K.R(x0, y, w, 1, Math.floor((y - 38) / 6) % 2 ? '#FF6B6B' : '#FFFFFF'); K.P(x0, y, OUTLINE); K.P(x0 + w - 1, y, OUTLINE); }
      K.R(fx - 1, 36, 10, 2, '#3A4068'); K.R(fx + 1, 30, 6, 6, lit ? PAL.sun : '#565E8C'); K.tri(fx, 30, fx + 4, 24, fx + 8, 30, '#E8435A');
    },
    live(g, K, t, lit) {
      // barcas meciéndose junto al muelle
      const boat = (x, y, hull, sail, ph) => { const b = Math.round(Math.sin(t * 2 + ph)); K.R(x, y + b, 16, 3, hull); K.R(x + 2, y + 3 + b, 12, 1, shade(hull, -0.3)); K.R(x + 7, y - 10 + b, 1, 10, '#6B4A2C'); K.tri(x + 8, y - 10 + b, x + 8, y - 1 + b, x + 15, y - 2 + b, sail); };
      boat(2, 84, '#FF6B6B', '#FFF3D7', 0); boat(26, 98, '#30A8C8', '#FFD84A', 2);
      if (lit) {
        // haz del faro
        const a = t * 1.3, lx = 120, ly = 33;
        g.globalAlpha = 0.28; for (const s of [1, -1]) { const aa = a + (s < 0 ? Math.PI : 0); for (let r = 4; r < 40; r += 2) { const w = r * 0.25; K.R(lx + Math.cos(aa) * r - w / 2, ly + Math.sin(aa) * r * 0.35 - 1, w, 2, '#FFF3A0'); } } g.globalAlpha = 1;
        K.C(lx, ly, 3, '#FFFFFF');
      }
    }
  },
  valle: {
    draw(K, lit) {
      islandBase(K, { top: '#76C85A', side: '#8B5A3C', beach: '#E8D8A0', seed: 5 });
      K.E(52, 60, 26, 11, '#5FB04A'); K.E(50, 58, 22, 8, '#86D668'); K.E(104, 58, 26, 10, '#8FDC6E'); K.E(106, 56, 20, 7, '#A6E88A');
      // campos de cultivo
      for (let r = 0; r < 5; r++) for (let x = 0; x < 30; x++) K.P(36 + x + r * 2, 74 + r * 3, r % 2 ? '#FFD84A' : '#B6F35B');
      for (let r = 0; r < 5; r++) K.L(36 + r * 2, 75 + r * 3, 66 + r * 2, 75 + r * 3, '#6B8A3A');
      // río con puente
      for (let y = 38; y < 98; y++) { const x = 96 + Math.round(Math.sin(y * 0.09) * 6); K.R(x, y, 4, 1, '#59C7FF'); K.P(x + 1, y, '#9FE8FF'); }
      K.R(92, 68, 16, 3, '#8B5A3C'); K.R(92, 68, 16, 1, '#D8A06A');
      // granero
      K.R(114, 60, 16, 12, OUTLINE); K.R(115, 61, 14, 11, '#E8435A'); K.tri(113, 61, 122, 53, 131, 61, '#8A2A3A'); K.L(118, 64, 126, 71, '#FFF3D7'); K.L(126, 64, 118, 71, '#FFF3D7');
      // molino (las aspas se animan)
      for (let y = 30; y < 58; y++) { const w = 6 + Math.round((y - 30) / 5); K.R(70 - Math.floor(w / 2), y, w, 1, y % 5 ? '#FFF3D7' : '#E8D8C0'); }
      K.tri(64, 31, 70, 22, 76, 31, '#FF6B6B'); K.R(68, 50, 4, 8, '#8B5A3C'); K.R(69, 38, 2, 3, lit ? PAL.sun : '#565E8C');
      isTree(K, 30, 64, 5, '#3FA85A'); isTree(K, 124, 80, 4, '#66D66A'); isTree(K, 86, 84, 4, '#3FA85A');
    },
    live(g, K, t, lit) {
      const a = lit ? t * 1.6 : 0.4, cx = 70, cy = 30;
      for (let k = 0; k < 4; k++) { const aa = a + k * Math.PI / 2; K.L(cx, cy, cx + Math.cos(aa) * 15, cy + Math.sin(aa) * 15, '#8B5A3C'); const sx = cx + Math.cos(aa) * 9, sy = cy + Math.sin(aa) * 9; K.R(sx - 1, sy - 1, 3, 3, '#FFF3D7'); }
      K.C(cx, cy, 2, '#6B4A2C');
      if (lit) for (let i = 0; i < 3; i++) { const bx = (t * 14 + i * 50) % 170 - 5, by = 20 + i * 6 + Math.sin(t * 3 + i) * 2; K.P(bx, by, '#3A4068'); K.P(bx - 1, by - 1, '#3A4068'); K.P(bx + 1, by - 1, '#3A4068'); }
    }
  },
  solaria: {
    draw(K, lit) {
      islandBase(K, { top: '#F2CC7A', top2: '#FFE0A0', side: '#C8913A', beach: '#FFF0C0', seed: 9 });
      isPanels(K, 30, 64, 5, 3);
      // espejos alrededor de la torre solar
      for (let i = 0; i < 10; i++) { const a = Math.PI * (0.1 + i * 0.09), x = 104 + Math.cos(a) * 22, y = 72 + Math.sin(a) * 7; K.R(x - 2, y, 4, 2, '#BFF4FF'); K.P(x, y + 2, '#8A8FB0'); }
      // torre solar de concentración
      K.R(102, 26, 5, 46, '#E8E0D0'); K.R(106, 26, 1, 46, '#B8A890'); K.R(100, 22, 9, 6, lit ? '#FFFFFF' : '#8A8FB0');
      // ciudad dorada con cúpulas
      const dome = (x, y, w, h, c) => { K.R(x, y, w, h, '#FFF3EE'); K.R(x, y + h - 2, w, 2, '#E8D8C8'); K.E(x + w / 2, y, w / 2, 5, c); K.P(x + w / 2, y - 6, c); for (let i = 2; i < w - 2; i += 4) K.R(x + i, y + 3, 2, 2, lit ? '#30E1C5' : '#8A8FB0'); };
      dome(70, 50, 14, 14, PAL.sun); dome(86, 56, 10, 10, '#FF9D42'); dome(58, 58, 10, 9, '#30E1C5');
      isPalm(K, 26, 60, 12); isPalm(K, 132, 72, 13); isPalm(K, 50, 84, 10);
    },
    live(g, K, t, lit) {
      if (!lit) return;
      const pulse = 0.5 + Math.sin(t * 4) * 0.3;
      g.globalAlpha = pulse; K.C(104, 24, 6, '#FFF3A0'); g.globalAlpha = 1; K.C(104, 24, 2, '#FFFFFF');
      for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i * 0.37) % 1; if (ph < 0.25) { const x = 32 + i * 10, y = 65 + (i % 3) * 6; K.P(x, y, '#FFFFFF'); K.P(x - 1, y, '#BFF4FF'); K.P(x + 1, y, '#BFF4FF'); } }
    }
  },
  aeris: {
    draw(K, lit) {
      // isla flotante: sin playa, con rocas colgando y nubes debajo
      const under = (cx, cy, rx, depth, col) => { for (let i = 0; i < depth; i++) { const w = rx * (1 - i / depth); K.R(cx - w, cy + i, w * 2, 1, shade(col, -i / depth * 0.4)); } };
      under(80, 76, 46, 26, '#8A6AB8');
      islandBase(K, { cy: 72, rx: 48, ry: 20, th: 6, top: '#8FE0A0', side: '#9A7AC8', beach: '#9A7AC8', seed: 11, floating: true });
      for (const [x, d] of [[60, 8], [78, 12], [96, 7]]) for (let i = 0; i < d; i++) K.P(x + Math.round(Math.sin(i) * 1), 100 + i, '#5E8C3A');
      // islotes flotantes con turbinas
      under(36, 40, 16, 12, '#8A6AB8'); K.E(36, 38, 16, 6, '#9CF5D8'); K.E(36, 37, 12, 4, '#B6F3D8');
      under(124, 32, 14, 10, '#8A6AB8'); K.E(124, 30, 14, 5, '#9CF5D8'); K.E(124, 29, 10, 3, '#B6F3D8');
      for (let i = 0; i < 12; i++) { K.P(48 + i * 2, 42 + Math.round(Math.sin(i * 0.5) * 2) + i, '#C8A070'); }
      isTurbineTower(K, 36, 36, 18); isTurbineTower(K, 124, 28, 16); isTurbineTower(K, 80, 64, 22);
      // nubes bajo la isla
      pixelCloud(K.g, 44, 104, 0.55, 0.95); pixelCloud(K.g, 112, 102, 0.5, 0.95); pixelCloud(K.g, 78, 112, 0.45, 0.9);
      isTree(K, 64, 70, 4, '#66D66A'); isTree(K, 98, 72, 5, '#3FA85A');
    },
    live(g, K, t, lit) {
      const sp = lit ? 3 : 0.3;
      for (const [x, y, r, ph] of [[36, 18, 7, 0], [124, 12, 6, 1], [80, 42, 9, 2]]) { const a = t * sp + ph; for (let k = 0; k < 3; k++) { const aa = a + k * 2.094; K.L(x, y, x + Math.cos(aa) * r, y + Math.sin(aa) * r, '#FFFFFF'); } K.P(x, y, '#9B76FF'); }
      if (lit) for (const [x, y, c, ph] of [[104, 44, PAL.pink, 0], [56, 22, PAL.sun, 2]]) { const dx = Math.round(Math.sin(t * 2 + ph) * 2); K.tri(x + dx, y - 4, x + 3 + dx, y, x + dx, y + 4, c); K.tri(x + dx, y - 4, x - 3 + dx, y, x + dx, y + 4, shade(c, -0.2)); for (let i = 0; i < 8; i++) K.P(x + dx + Math.round(Math.sin(t * 5 + i * 0.8 + ph) * 2), y + 5 + i, i % 2 ? c : '#FFFFFF'); }
    }
  },
  hydria: {
    draw(K, lit) {
      islandBase(K, { top: '#8FD8B0', side: '#D8CFE8', beach: '#F0FFF8', seed: 13, th: 12 });
      // acantilados de piedra blanca
      K.R(34, 30, 90, 30, '#EDE6F5'); K.R(34, 30, 90, 3, '#FFFFFF'); for (let i = 0; i < 90; i += 7) K.R(34 + i, 36 + (i % 3) * 5, 1, 20, '#C9C2DC');
      K.tri(34, 30, 50, 18, 66, 30, '#EDE6F5'); K.tri(92, 30, 110, 14, 124, 30, '#E4DCF0'); K.tri(60, 30, 78, 22, 96, 30, '#F4F0FA');
      K.R(34, 58, 90, 3, '#8FD8B0');
      // estanque al pie de las cascadas
      K.E(76, 80, 30, 7, '#1FA8C8'); K.E(76, 79, 26, 5, '#59C7FF');
      // presa con casa de turbinas
      K.R(22, 66, 16, 12, '#8A8FB0'); K.R(22, 66, 16, 2, '#C9D2F0'); K.R(26, 70, 3, 3, lit ? PAL.sun : '#3A4068'); K.R(31, 70, 3, 3, lit ? PAL.sun : '#3A4068');
      // casas blancas con cúpulas coral
      const dome = (x, y, w) => { K.R(x, y, w, 9, '#FFFFFF'); K.R(x, y + 7, w, 2, '#E8E0F0'); K.E(x + w / 2, y, w / 2, 4, '#FF9D8A'); K.R(x + 2, y + 3, 2, 3, lit ? '#30E1C5' : '#8A8FB0'); };
      dome(104, 64, 12); dome(118, 70, 10); dome(96, 74, 9);
      isTree(K, 44, 76, 4, '#2A9A8A'); isTree(K, 52, 82, 3, '#66D6A0');
    },
    live(g, K, t, lit) {
      const flow = lit ? 1 : 0.25;
      for (const x of [56, 76, 96]) {
        K.R(x, 32, 6, 46, 'rgba(159,232,255,0.8)');
        for (let i = 0; i < 6; i++) { const y = 32 + ((t * 40 * flow + i * 8 + x) % 46); K.R(x + (i % 3) * 2, y, 2, 3, '#FFFFFF'); }
        if (lit && Math.floor(t * 8 + x) % 2) K.R(x - 2, 77, 10, 2, '#FFFFFF');
      }
    }
  },
  bioloop: {
    draw(K, lit) {
      islandBase(K, { top: '#3FA85A', side: '#5E3A26', beach: '#E8D8A0', seed: 17 });
      // selva densa al fondo
      const rng = mulberry32(99);
      const greens = ['#2A7A4B', '#3FA85A', '#66D66A', '#1F6A40'];
      for (let i = 0; i < 26; i++) { const x = 28 + rng() * 104, y = 46 + rng() * 22, r = 5 + Math.round(rng() * 5); isTree(K, x, y, r, greens[Math.floor(rng() * 4)]); }
      // biodigestores (cúpulas)
      const dome = (x, y, r) => { for (let dy = -r; dy <= 0; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); K.R(x - w, y + dy, w * 2, 1, dy < -r + 2 ? '#E8FFD0' : '#B6F35B'); } K.R(x - r, y, r * 2, 2, '#5E8C3A'); K.R(x - 1, y - r - 2, 2, 2, lit ? PAL.sun : '#565E8C'); };
      dome(94, 84, 9); dome(114, 86, 7); K.R(100, 84, 8, 2, '#C9D2F0');
      // puestos del mercado
      const stall = (x, y, c) => { K.R(x, y, 12, 6, '#8B5A3C'); for (let i = 0; i < 12; i += 2) K.R(x + i, y - 3, 2, 3, i % 4 ? '#FFFFFF' : c); K.R(x + 2, y + 1, 2, 2, PAL.orange); K.R(x + 7, y + 1, 2, 2, PAL.lime); };
      stall(40, 82, PAL.coral); stall(58, 86, PAL.sun);
    },
    live(g, K, t, lit) {
      if (!lit) return;
      for (let i = 0; i < 8; i++) { const x = 34 + (i * 37) % 96 + Math.sin(t * 1.3 + i) * 4, y = 50 + (i * 13) % 26 + Math.cos(t * 1.7 + i) * 3; if (Math.sin(t * 3 + i * 1.7) > 0.2) { K.P(x, y, '#FFF3A0'); K.P(x + 1, y, 'rgba(255,243,160,0.5)'); } }
      g.globalAlpha = 0.35 + Math.sin(t * 2) * 0.15; K.C(94, 78, 5, '#E8FFD0'); g.globalAlpha = 1;
    }
  },
  gea: {
    draw(K, lit) {
      islandBase(K, { top: '#6A4A5A', side: '#3A2A38', beach: '#8A6A6A', seed: 19 });
      // volcán
      for (let y = 18; y < 72; y++) { const w = 6 + Math.round((y - 18) * 0.9); K.R(76 - w, y, w * 2, 1, y % 6 ? '#5A3A48' : '#4A2E3E'); K.R(76 - w, y, Math.round(w * 0.6), 1, '#6A4858'); }
      K.R(70, 18, 12, 3, lit ? '#FF7B4A' : '#8A3A2A');
      for (let y = 21; y < 62; y++) { const x = 76 + Math.round(Math.sin(y * 0.2) * 3) + Math.round((y - 21) * 0.35); K.R(x, y, 2, 1, lit ? (y % 4 ? '#FF7B4A' : '#FFD84A') : '#6A2A2A'); }
      // planta geotérmica con torre de enfriamiento
      K.R(108, 64, 18, 12, '#8A8FB0'); K.R(108, 64, 18, 2, '#C9D2F0'); K.R(111, 68, 3, 3, lit ? PAL.sun : '#3A4068'); K.R(117, 68, 3, 3, lit ? PAL.sun : '#3A4068');
      for (let y = 50; y < 66; y++) { const w = 5 + Math.round(Math.abs(y - 58) * 0.35); K.R(128 - w, y, w * 2, 1, '#C9C2DC'); }
      K.L(100, 72, 108, 70, '#C9D2F0'); K.L(96, 74, 100, 72, '#C9D2F0');
      // cristales
      const crystal = (x, y, h, c) => { K.tri(x - 3, y, x, y - h, x + 3, y, c); K.L(x, y - h, x, y, shade(c, 0.4)); };
      crystal(34, 78, 12, '#9B76FF'); crystal(40, 80, 8, '#FF7FCF'); crystal(28, 82, 7, '#C9B2FF'); crystal(56, 86, 9, '#30E1C5');
    },
    live(g, K, t, lit) {
      if (lit) { g.globalAlpha = 0.5 + Math.sin(t * 3) * 0.25; K.E(76, 18, 9, 3, '#FFD84A'); g.globalAlpha = 1; }
      for (let i = 0; i < 4; i++) { const ph = (t * 0.5 + i * 0.25) % 1, y = 48 - ph * 30; g.globalAlpha = (1 - ph) * (lit ? 0.7 : 0.25); K.C(128 + Math.sin(ph * 6 + i) * 3, y, 3 + ph * 4, '#FFFFFF'); g.globalAlpha = 1; }
      if (lit) for (let i = 0; i < 3; i++) { const ph = (t * 0.7 + i * 0.33) % 1; g.globalAlpha = 1 - ph; K.P(74 + i * 3, 16 - ph * 14, i % 2 ? '#FFD84A' : '#FF7B4A'); g.globalAlpha = 1; }
    }
  },
  h2: {
    draw(K, lit) {
      islandBase(K, { top: '#8FA2CE', top2: '#A6B6DC', side: '#4A5A8A', beach: '#E8F0FF', seed: 23 });
      for (let i = 0; i < 6; i++) K.R(30 + i * 16, 80, 10, 1, '#FFD84A'); // marcas del muelle
      // tanques esféricos de hidrógeno
      const tank = (x, y, r) => { K.R(x - 1, y, 2, r + 3, '#8A8FB0'); K.C(x, y, r, '#FFFFFF'); K.C(x + 1, y + 1, r - 1, '#E8ECF8'); K.C(x - 2, y - 2, 2, '#FFFFFF'); for (let i = -r; i <= r; i++) K.P(x + i, y, '#C9D2F0'); };
      tank(38, 60, 7); tank(54, 56, 8); tank(46, 74, 6);
      // electrolizador
      K.R(70, 52, 26, 18, OUTLINE); K.R(71, 53, 24, 17, '#59C7FF'); K.R(71, 53, 24, 3, '#9FE8FF'); for (let i = 0; i < 4; i++) K.R(74 + i * 5, 60, 3, 4, lit ? '#FFFFFF' : '#2A4A7A');
      drawText(K.g, 'H2', 77, 44, lit ? '#FFFFFF' : '#8A8FB0');
      // tuberías naranja
      K.R(60, 64, 12, 2, '#FF9D42'); K.R(46, 66, 2, 8, '#FF9D42'); K.R(46, 66, 16, 2, '#FF9D42'); K.R(96, 62, 14, 2, '#FF9D42');
      // grúa
      K.R(112, 32, 2, 42, '#FF9D42'); K.R(100, 32, 30, 2, '#FF9D42'); K.L(113, 34, 126, 33, '#C8612E'); K.R(126, 34, 1, 10, '#C9D2F0');
    },
    live(g, K, t, lit) {
      const b = Math.round(Math.sin(t * 1.8)); const x = 112, y = 96 + b;
      K.R(x, y, 26, 4, '#FF9D42'); K.R(x + 2, y + 4, 22, 2, '#C8612E'); K.R(x + 8, y - 5, 10, 5, '#FFFFFF'); K.R(x + 10, y - 3, 2, 2, lit ? PAL.sun : '#8A8FB0'); K.R(x + 14, y - 3, 2, 2, lit ? PAL.sun : '#8A8FB0');
      if (lit) for (let i = 0; i < 5; i++) { const ph = (t * 0.6 + i * 0.2) % 1; g.globalAlpha = 1 - ph; pring(g, 76 + i * 4, 50 - ph * 22, 1 + (i % 2), '#DFFBFF'); g.globalAlpha = 1; }
    }
  },
  bateria: {
    draw(K, lit) {
      islandBase(K, { top: '#3A3070', side: '#221E4A', beach: '#5A4A8A', seed: 29 });
      const rng = mulberry32(31);
      // rascacielos con ventanas de neón
      for (let i = 0; i < 9; i++) {
        const x = 30 + i * 11, h = 16 + Math.round(rng() * 26), y = 76 - h;
        K.R(x - 1, y - 1, 10, h + 1, OUTLINE); K.R(x, y, 8, h, i % 2 ? '#1A1440' : '#2A2458');
        for (let wy = y + 2; wy < 74; wy += 4) for (let wx = x + 1; wx < x + 7; wx += 3) if (rng() < 0.6) K.P(wx, wy, lit ? ['#FF7FCF', '#30E1C5', '#FFD84A'][Math.floor(rng() * 3)] : '#3A3460');
      }
      // torres-batería
      const bat = (x, y, h) => { K.R(x - 1, y - 1, 14, h + 2, OUTLINE); K.R(x, y, 12, h, '#C9D2F0'); K.R(x + 4, y - 3, 4, 3, '#8A8FB0'); K.R(x + 2, y + 2, 8, h - 4, '#10162B'); };
      bat(62, 24, 38); bat(98, 34, 30);
      // viaducto del tranvía
      K.R(24, 80, 112, 2, '#565E8C'); for (let i = 0; i < 8; i++) K.R(28 + i * 15, 82, 2, 6, '#3A4068');
    },
    live(g, K, t, lit) {
      const charge = (x, y, h, ph) => { const lvl = lit ? (Math.sin(t * 0.8 + ph) * 0.5 + 0.5) : 0.1; const n = Math.max(1, Math.round(lvl * (h - 4) / 4)); for (let k = 0; k < n; k++) K.R(x + 3, y + h - 5 - k * 4, 6, 3, lvl > 0.6 ? PAL.lime : lvl > 0.3 ? PAL.sun : PAL.coral); };
      charge(62, 24, 38, 0); charge(98, 34, 30, 2);
      if (lit) {
        const tx = 22 + (t * 24) % 112; K.R(tx, 76, 14, 4, '#FF4FB8'); K.R(tx + 2, 77, 3, 2, '#FFF3D7'); K.R(tx + 8, 77, 3, 2, '#FFF3D7');
        if (Math.floor(t * 6) % 7) { K.R(44, 40, 10, 1, PAL.pink); K.R(44, 46, 10, 1, PAL.pink); K.R(44, 40, 1, 7, PAL.pink); K.R(53, 40, 1, 7, PAL.pink); }
      }
    }
  },
  prisma: {
    draw(K, lit) {
      islandBase(K, { top: '#9CF5D8', top2: '#C8FFE8', side: '#8A7AC8', beach: '#FFF3FF', seed: 37 });
      // mini fuentes de la microred
      isPanels(K, 30, 72, 3, 2);
      isTurbineTower(K, 118, 76, 20);
      K.C(112, 88, 5, '#59C7FF'); pring(K.g, 112, 88, 5, '#FFFFFF');
      K.R(46, 56, 8, 12, '#C9D2F0'); K.R(48, 54, 4, 2, '#8A8FB0'); K.R(48, 60, 4, 6, PAL.lime);
      // torre-prisma central
      const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF'];
      for (let y = 12; y < 74; y++) { const w = Math.round((y - 12) * 0.28) + 2; for (let x = -w; x <= w; x++) K.P(80 + x, y, x < 0 ? cols[Math.floor((y - 12) / 9) % 7] : shade(cols[Math.floor((y - 12) / 9) % 7], -0.25)); }
      K.L(80, 12, 80, 74, '#FFFFFF');
    },
    live(g, K, t, lit) {
      const a = lit ? t * 3 : 0.5;
      for (let k = 0; k < 3; k++) { const aa = a + k * 2.094; K.L(118, 56, 118 + Math.cos(aa) * 7, 56 + Math.sin(aa) * 7, '#FFFFFF'); }
      if (!lit) return;
      // energía que viaja por la microred hacia el prisma
      for (const [x0, y0] of [[42, 72], [50, 58], [118, 70], [112, 86]]) {
        g.globalAlpha = 0.5; pline(g, x0, y0, 80, 68, PAL.sun, 2, Math.floor(t * 12)); g.globalAlpha = 1;
        const ph = (t * 0.7 + x0 * 0.01) % 1; K.R(lerp(x0, 80, ph) - 1, lerp(y0, 68, ph) - 1, 2, 2, '#FFFFFF');
      }
      g.globalAlpha = 0.35 + Math.sin(t * 2) * 0.15; K.L(78, 12, 78, 74, hsl(t * 120, 90, 75)); g.globalAlpha = 1;
    }
  },
  faro: {
    draw(K, lit) {
      islandBase(K, { top: '#8A8FB0', top2: '#A8ADCC', side: '#4A4A7A', beach: '#C9D2F0', seed: 41, rx: 50 });
      // rocas
      for (const [x, y, r] of [[46, 76, 6], [58, 82, 4], [104, 78, 5], [114, 70, 4]]) { K.C(x, y, r, '#6A6A9A'); K.C(x - 1, y - 1, r - 2, '#9A9ACB'); }
      // gran faro
      for (let y = 20; y < 76; y++) { const w = 8 + Math.round((y - 20) / 7); const x0 = 80 - Math.floor(w / 2); K.R(x0, y, w, 1, y % 14 < 3 ? '#FFD84A' : '#FFFFFF'); K.P(x0, y, OUTLINE); K.P(x0 + w - 1, y, OUTLINE); K.P(x0 + w - 2, y, '#DCE2F5'); }
      K.R(72, 18, 16, 3, '#3A4068'); K.R(74, 8, 12, 10, lit ? '#FFD84A' : '#565E8C'); K.R(76, 10, 8, 6, lit ? '#FFFFFF' : '#3A4068');
      K.tri(72, 8, 80, 0, 88, 8, '#22306B');
      K.R(78, 66, 4, 10, '#8B5A3C');
      isHouse(K, 94, 66, '#F4F6FF', '#22306B', lit, 10, 7);
    },
    live(g, K, t, lit) {
      if (!lit) return;
      const a = t * 1.1, lx = 80, ly = 13;
      g.globalAlpha = 0.3;
      for (const s of [0, Math.PI]) { const aa = a + s; for (let r = 6; r < 70; r += 2) { const w = r * 0.22; K.R(lx + Math.cos(aa) * r - w / 2, ly + Math.sin(aa) * r * 0.3 - 1, w, 2, '#FFF3A0'); } }
      g.globalAlpha = 1;
      K.C(lx, ly, 4, '#FFFFFF');
    }
  }
};

// ---------- Construcción (una vez) de las tres versiones de cada isla ----------
const MapArt = {
  built: false, isl: {},
  build() {
    if (this.built) return;
    for (const k in ISLAND_ART) {
      const mk = lit => { const c = makeCanvas(ISL_DW, ISL_DH), K = islandKit(c.g); K.g = c.g; ISLAND_ART[k].draw(K, lit); return c; };
      const on = mk(true), offRaw = mk(false);
      // apagada: sin luces, desaturada y en penumbra azulada (el apagón)
      const off = recolorCanvas(offRaw, (r, g, b) => { const l = r * 0.3 + g * 0.59 + b * 0.11; return [lerp(r, l, 0.55) * 0.55 + 10, lerp(g, l, 0.55) * 0.55 + 12, lerp(b, l, 0.55) * 0.6 + 30]; });
      // por descubrir: silueta en la niebla
      const fog = makeCanvas(ISL_DW, ISL_DH), fg = fog.g;
      fg.globalAlpha = 0.45; fg.drawImage(silhouette(on, '#1B2A5A'), 0, 0); fg.globalAlpha = 1;
      const rng = mulberry32(hashStr(k));
      for (const [x, y, sc] of [[46, 62, 0.95], [108, 56, 1.05], [78, 78, 1.1], [60, 90, 0.7], [112, 88, 0.75]]) pixelCloud(fg, x + (rng() - 0.5) * 8, y + (rng() - 0.5) * 6, sc, 0.92);
      fg.globalAlpha = 1;
      this.isl[k] = { on, off, fog };
    }
    this.ocean = this.buildOcean();
    this.built = true;
  },
  // océano: degradado, bajíos claros alrededor de cada isla, cuadrícula náutica y rosa de los vientos
  buildOcean() {
    const c = makeCanvas(W * RES, H * RES), g = c.g, D = RES;
    const grd = g.createLinearGradient(0, 0, W * D * 0.3, H * D);
    grd.addColorStop(0, '#0F2A66'); grd.addColorStop(0.45, '#1A56A6'); grd.addColorStop(1, '#2A92C4');
    g.fillStyle = grd; g.fillRect(0, 0, W * D, H * D);
    for (const r of REGIONS) {
      const x = r.x * D, y = (r.y + 6) * D;
      const rg = g.createRadialGradient(x, y, 10, x, y, 62 * D / 2);
      rg.addColorStop(0, 'rgba(127,231,255,0.35)'); rg.addColorStop(1, 'rgba(127,231,255,0)');
      g.fillStyle = rg; g.fillRect(x - 70 * D, y - 50 * D, 140 * D, 100 * D);
    }
    // ondas suaves
    const rng = mulberry32(7);
    for (let i = 0; i < 260; i++) { const x = rng() * W * D, y = rng() * H * D, w = 4 + rng() * 10; g.fillStyle = 'rgba(255,255,255,' + (0.04 + rng() * 0.06).toFixed(3) + ')'; g.fillRect(Math.round(x), Math.round(y), Math.round(w), 1); }
    // cuadrícula náutica
    g.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 40 * D; x < W * D; x += 40 * D) g.fillRect(x, 0, 1, H * D);
    for (let y = 40 * D; y < H * D; y += 40 * D) g.fillRect(0, y, W * D, 1);
    // rosa de los vientos
    const cx = 30 * D, cy = 50 * D;
    g.globalAlpha = 0.55;
    pring(g, cx, cy, 26, '#FFF3D7'); pring(g, cx, cy, 20, 'rgba(255,243,215,0.6)');
    const K = islandKit(g);
    K.tri(cx, cy - 30, cx - 5, cy, cx + 5, cy, '#FFD84A'); K.tri(cx, cy + 30, cx - 5, cy, cx + 5, cy, '#FFF3D7');
    K.tri(cx - 30, cy, cx, cy - 5, cx, cy + 5, '#FFF3D7'); K.tri(cx + 30, cy, cx, cy - 5, cx, cy + 5, '#FFF3D7');
    g.globalAlpha = 1;
    drawText(g, 'N', cx, cy - 44, '#FFD84A', { align: 'center' });
    // viñeta
    const vg = g.createRadialGradient(W * D / 2, H * D / 2, H * D * 0.35, W * D / 2, H * D / 2, W * D * 0.62);
    vg.addColorStop(0, 'rgba(5,10,30,0)'); vg.addColorStop(1, 'rgba(5,10,30,0.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W * D, H * D);
    return c;
  }
};

// nube pixel art: base plana, copetes redondos, sombra suave debajo
function pixelCloud(g, x, y, s, alpha = 1) {
  const puffs = [[-18, 2, 9], [-7, -4, 12], [7, -6, 13], [19, 0, 9], [0, 2, 10]];
  g.globalAlpha = alpha * 0.9;
  for (const [dx, dy, r] of puffs) pcircle(g, x + dx * s, y + dy * s, r * s, '#DCE4FA');
  for (const [dx, dy, r] of puffs) pcircle(g, x + dx * s, y + (dy - 2) * s, (r - 2) * s, '#FFFFFF');
  g.fillStyle = '#C4D0F0'; g.fillRect(Math.round(x - 26 * s), Math.round(y + 6 * s), Math.round(52 * s), Math.round(3 * s));
  g.globalAlpha = 1;
}

// dibuja en píxeles reales (doble detalle) con el origen en (x, y) de juego
function hiResAt(g, x, y, fn) { g.save(); g.translate(x, y); g.scale(1 / RES, 1 / RES); try { fn(g); } finally { g.restore(); } }

// curva de la ruta marítima entre dos islas
function routePoint(a0, b0, k, bend) {
  // la ruta sale de la orilla, no del centro de la isla
  const ddx = b0.x - a0.x, ddy = b0.y - a0.y, l0 = Math.hypot(ddx, ddy) || 1, off = Math.min(26, l0 * 0.3);
  const a = { x: a0.x + ddx / l0 * off, y: a0.y + ddy / l0 * off * 0.7 }, b = { x: b0.x - ddx / l0 * off, y: b0.y - ddy / l0 * off * 0.7 };
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const cx = mx - dy / len * len * bend, cy = my + dx / len * len * bend;
  const u = 1 - k;
  return { x: u * u * a.x + 2 * u * k * cx + k * k * b.x, y: u * u * (a.y + 8) + 2 * u * k * (cy + 8) + k * k * (b.y + 8) };
}
const routeBend = i => (i % 2 ? 0.16 : -0.16);

function drawOceanLive(g, t) {
  hiResAt(g, 0, 0, g2 => {
    // destellos del sol en el agua
    const rng = mulberry32(12);
    for (let i = 0; i < 70; i++) {
      const x = rng() * W * RES, y = rng() * H * RES, ph = rng() * 6.28, a = Math.sin(t * 1.5 + ph);
      if (a > 0.55) { g2.globalAlpha = (a - 0.55) * 1.6; g2.fillStyle = '#FFFFFF'; g2.fillRect(Math.round(x), Math.round(y), 3 + Math.round(a * 3), 1); }
    }
    g2.globalAlpha = 1;
    // nubes que pasan (con su sombra sobre el mar)
    for (let i = 0; i < 3; i++) {
      const x = ((t * (5 + i * 2) * RES + i * 330) % ((W + 140) * RES)) - 70 * RES, y = (44 + i * 76) * RES;
      g2.globalAlpha = 0.14; pellipse(g2, x + 10, y + 34, 50, 10, '#06122E'); g2.globalAlpha = 1;
      pixelCloud(g2, x, y, 1.6, 0.55);
    }
    // gaviotas
    for (let i = 0; i < 3; i++) {
      const x = ((t * 22 + i * 190) % (W + 40) - 20) * RES, y = (40 + i * 70 + Math.sin(t + i) * 6) * RES, f = Math.floor(t * 6 + i) % 2;
      g2.fillStyle = '#FFFFFF'; g2.fillRect(x, y, 2, 2); g2.fillRect(x - 4, y - 2 - f * 2, 4, 2); g2.fillRect(x + 2, y - 2 - f * 2, 4, 2);
    }
  });
}
function drawRoutes(g, t) {
  hiResAt(g, 0, 0, g2 => {
    for (let i = 1; i < REGIONS.length; i++) {
      const a = REGIONS[i - 1], b = REGIONS[i];
      const open = unlocked(b.key), done = restored(b.key);
      if (!open && !unlocked(a.key)) continue;
      const n = Math.max(8, Math.round(dist(a.x, a.y, b.x, b.y) / 5));
      for (let k = 1; k < n; k++) {
        const u = k / n, p = routePoint(a, b, u, routeBend(i));
        const on = ((k + Math.floor(t * (done ? 6 : 2))) % 3) !== 0;
        if (!on) continue;
        g2.globalAlpha = !open ? 0.2 : done ? 0.95 : 0.55;
        g2.fillStyle = done ? '#FFD84A' : '#FFF3D7';
        g2.fillRect(Math.round(p.x * RES) - 1, Math.round(p.y * RES) - 1, 3, 3);
      }
    }
    g2.globalAlpha = 1;
    // hilos de energía hacia el Faro desde las islas restauradas
    const faro = REGIONS[REGIONS.length - 1];
    REGIONS.forEach((r, i) => {
      if (!restored(r.key) || r.key === 'faro') return;
      g2.globalAlpha = 0.18 + Math.sin(t * 3 + i) * 0.08;
      pline(g2, r.x * RES, (r.y - 10) * RES, faro.x * RES, (faro.y - 30) * RES, r.col, 4, Math.floor(t * 10));
    });
    g2.globalAlpha = 1;
  });
}
function drawIslandArt(g, r, i, t, sel) {
  const art = MapArt.isl[r.key]; if (!art) return;
  const on = restored(r.key), un = unlocked(r.key);
  const bob = Math.sin(t * 0.8 + i) * 0.6;
  const x = r.x - ISL_AX, y = r.y - ISL_AY + bob;
  if (!un) { drawHiRes(g, art.fog, x, y, ISL_W, ISL_H); drawText(g, '?', r.x, r.y - 8, 'rgba(255,255,255,0.8)', { align: 'center', outline: PAL.ink }); return; }
  if (sel) {
    // anillo dorado a ras de agua alrededor de la isla elegida
    g.globalAlpha = 0.55 + Math.sin(t * 4) * 0.25;
    hiResAt(g, r.x, r.y + 14, g2 => { g2.fillStyle = PAL.sun; for (let k = 0; k < 90; k++) { const a = k / 90 * Math.PI * 2; g2.fillRect(Math.round(Math.cos(a) * 76) - 1, Math.round(Math.sin(a) * 26) - 1, 3, 2); } });
    g.globalAlpha = 1;
  }
  drawHiRes(g, on ? art.on : art.off, x, y, ISL_W, ISL_H);
  hiResAt(g, x, y, g2 => { const K = islandKit(g2); K.g = g2; ISLAND_ART[r.key].live(g2, K, t + i, on); });
  if (!on && Math.floor(t * 2 + i) % 5 === 0) drawText(g, '⚡', r.x + 18, r.y - 20, PAL.coral, { outline: PAL.ink });
}
