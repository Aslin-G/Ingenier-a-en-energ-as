// =====================================================================
//  DETALLE DEL SUBSUELO Y DE LA SUPERFICIE
//  El interior del terreno ya no es un bloque liso: tiene estratos y, en
//  cada isla, lo que hay bajo tierra: piedras, raíces y fósiles en el
//  Valle; cables de energía enterrados en Solaria; cristales en Aeris y
//  Prisma; bolsas de agua (acuíferos) en Hydria; raíces, lombrices y
//  hongos en BioLoop; vetas de magma en Gea; tuberías en la Bahía H2;
//  circuitos en Ciudad Batería. Todo se pinta una vez en el lienzo
//  estático del nivel (no cuesta nada al jugar).
// =====================================================================
const UNDERGROUND = {
  valle: [['stone', 3], ['root', 2], ['pebbles', 3], ['fossil', 0.5], ['worm', 0.7]],
  solaria: [['cable', 1], ['pebbles', 2.5], ['stone', 1.2], ['shell', 0.6]],
  aeris: [['crystal', 1.2], ['pebbles', 2], ['stone', 1.2], ['root', 0.8]],
  hydria: [['aquifer', 1.1], ['pebbles', 2], ['shell', 1], ['moss', 1.6]],
  bioloop: [['root', 3], ['worm', 1], ['fungus', 1.2], ['pebbles', 2]],
  gea: [['magma', 1.4], ['crystal', 1.1], ['stone', 1.6]],
  h2: [['pipe', 1], ['bolt', 2.4], ['grille', 0.8]],
  bateria: [['circuit', 1.6], ['cable', 0.9], ['bolt', 1]],
  prisma: [['crystal', 1.6], ['pebbles', 1.5], ['cable', 0.6]],
  faro: [['crystal', 0.6], ['pebbles', 1.6]]
};
// distancia (en baldosas) de cada baldosa sólida al aire más cercano
function terrainDepth(lv) {
  const tw = lv.w, thh = lv.h, dist = new Int16Array(tw * thh).fill(-1), q = [];
  for (let y = 0; y < thh; y++) for (let x = 0; x < tw; x++) if (lv.tiles[y][x] !== '#') { dist[y * tw + x] = 0; q.push(x, y); }
  for (let h = 0; h < q.length; h += 2) {
    const x = q[h], y = q[h + 1], dd = dist[y * tw + x];
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + ax, ny = y + ay;
      if (nx < 0 || ny < 0 || nx >= tw || ny >= thh || dist[ny * tw + nx] >= 0) continue;
      dist[ny * tw + nx] = dd + 1; q.push(nx, ny);
    }
  }
  // lo que queda sin visitar (bordes cerrados) es «muy profundo»
  return (x, y) => { if (x < 0 || y < 0 || x >= tw || y >= thh) return 99; const v = dist[y * tw + x]; return v < 0 ? 99 : v; };
}
// estratos: capas onduladas y continuas (tramadas) a través de todo el terreno
function paintStrata(lv, g, th) {
  if (!UNDERGROUND[lv.themeKey] || th.ground.pier) return;
  const depth = terrainDepth(lv), G2 = th.ground;
  const strata = shade(G2.fill, -0.12), strataHi = shade(G2.fill, 0.08);
  for (let k = 0; k < 6; k++) {
    const base = 40 + k * 34 + (k % 2) * 7, amp = 2 + (k % 3), fr = 0.035 + k * 0.006;
    for (let x = 0; x < lv.pw; x++) {
      const y = Math.round(base + Math.sin(x * fr + k * 1.7) * amp + Math.sin(x * 0.011 + k) * 4);
      const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
      if (lv.tile(tx, ty) !== '#' || depth(tx, ty) < 1 || (y - ty * TILE) < 6 && depth(tx, ty) < 2 || (x + k) % 3 === 0) continue;
      px(g, x, y, strata); if ((x + k) % 5 === 0) px(g, x, y - 1, strataHi);
    }
  }
}
// objetos enterrados (se pintan después del sombreado: se leen como incrustados)
function paintUnderground(lv, g, th, rng) {
  const items = UNDERGROUND[lv.themeKey];
  if (!items || th.ground.pier) return;
  const depth = terrainDepth(lv), G2 = th.ground;
  const R = (x, y, w, h, c) => rect(g, x, y, w, h, c);
  const total = items.reduce((s, it) => s + it[1], 0);
  const used = new Set();
  for (let ty = 0; ty < lv.h; ty++) for (let tx = 0; tx < lv.w; tx++) {
    if (lv.tiles[ty][tx] !== '#' || depth(tx, ty) < 2 || used.has(tx + ',' + ty)) continue;
    if (rng() > 0.3) continue;
    let r = rng() * total, kind = items[0][0];
    for (const [k, w] of items) { if ((r -= w) <= 0) { kind = k; break; } }
    const x = tx * TILE, y = ty * TILE;
    used.add(tx + ',' + ty); used.add((tx + 1) + ',' + ty); used.add(tx + ',' + (ty + 1));
    paintBuried(g, kind, x, y, rng, G2, lv, depth, tx, ty, used, R);
  }
}
function paintBuried(g, kind, x, y, rng, G2, lv, depth, tx, ty, used, R) {
  const ox = x + Math.floor(rng() * 8) + 2, oy = y + Math.floor(rng() * 8) + 3;
  switch (kind) {
    case 'stone': {
      const rx = 2 + Math.floor(rng() * 3), ry = 1 + Math.floor(rng() * 2), c = mix(G2.fill, '#9A98B8', 0.45);
      pellipse(g, ox + rx, oy, rx, ry, shade(c, -0.25)); pellipse(g, ox + rx, oy - 0.5, rx - 0.5, ry - 0.5, c);
      R(ox + rx - 1, oy - ry, 2, 1, shade(c, 0.25));
      break;
    }
    case 'pebbles':
      for (let i = 0; i < 5; i++) { const c = mix(G2.fill, ['#B8B0C8', '#8A8098', '#D8C8A8'][i % 3], 0.5); R(x + Math.floor(rng() * 14), y + Math.floor(rng() * 14), 1 + (i % 2), 1, c); }
      break;
    case 'root': {
      let rx = ox, ry = y; const c = mix(G2.fill, '#2A1408', 0.55), hi = mix(G2.fill, '#C89A6A', 0.35);
      for (let i = 0; i < 14; i++) { R(rx, ry, 1, 1, i % 4 ? c : hi); ry++; if (rng() < 0.45) rx += rng() < 0.5 ? -1 : 1; if (i === 6) R(rx + 1, ry, 2, 1, c); }
      break;
    }
    case 'fossil': {
      const c = '#E8D8B8';
      pring(g, ox + 3, oy, 3, shade(c, -0.15)); pring(g, ox + 3, oy, 2, c); px(g, ox + 3, oy, c); px(g, ox + 4, oy - 1, shade(c, -0.2));
      break;
    }
    case 'worm': {
      const c = '#FF9DB0';
      for (let i = 0; i < 6; i++) px(g, ox + i, oy + (i % 3 === 1 ? -1 : 0), i === 5 ? '#FFC8D4' : c);
      break;
    }
    case 'shell': {
      const c = ['#FFE0D0', '#FFF3D7', '#FFC8B8'][Math.floor(rng() * 3)];
      for (let k = 0; k < 3; k++) R(ox + 2 - k, oy - k, 1 + k * 2, 1, c);
      px(g, ox + 2, oy - 2, shade(c, -0.2)); R(ox + 1, oy + 1, 3, 1, shade(c, -0.25));
      break;
    }
    case 'moss':
      for (let i = 0; i < 6; i++) px(g, x + Math.floor(rng() * 15), y + Math.floor(rng() * 15), i % 2 ? '#7AD6A0' : '#4FB070');
      break;
    case 'aquifer': {
      // bolsa de agua subterránea con su brillo
      pellipse(g, ox + 4, oy, 5, 2, '#2A6ACB'); pellipse(g, ox + 4, oy + 0.5, 4, 1, '#3A8AE0');
      R(ox + 1, oy - 1, 5, 1, '#9FE8FF'); px(g, ox + 7, oy - 1, '#FFFFFF');
      R(ox + 4, oy + 3, 1, 2, '#59C7FF');
      break;
    }
    case 'fungus': {
      pellipse(g, ox + 4, oy, 5, 3, shade(G2.fill, -0.35));
      R(ox + 2, oy, 1, 2, '#E8E0F0'); R(ox + 1, oy - 1, 3, 1, '#30E1C5');
      R(ox + 6, oy + 1, 1, 1, '#E8E0F0'); R(ox + 5, oy, 3, 1, '#9CF5D8');
      break;
    }
    case 'crystal': {
      const c = ['#9B76FF', '#FF7FCF', '#30E1C5', '#59C7FF', '#FFD84A'][Math.floor(rng() * 5)];
      pellipse(g, ox + 3, oy + 1, 4, 2, shade(G2.fill, -0.3));
      for (const [dx, h] of [[1, 4], [3, 6], [5, 3]]) { R(ox + dx, oy + 1 - h, 1, h, c); px(g, ox + dx, oy + 1 - h, '#FFFFFF'); R(ox + dx + 1, oy + 2 - h, 1, h - 1, shade(c, -0.3)); }
      break;
    }
    case 'magma': {
      // veta de lava: costra oscura con núcleo brillante
      let mx = x + 1, my = oy;
      for (let i = 0; i < 18; i++) {
        R(mx, my - 1, 1, 3, '#1A0A14'); px(g, mx, my, i % 5 === 2 ? '#FFD84A' : '#FF6B3A');
        mx++; if (rng() < 0.4) my += rng() < 0.5 ? -1 : 1;
        if (mx >= (tx + 2) * TILE || lv.tile(Math.floor(mx / TILE), Math.floor(my / TILE)) !== '#') break;
      }
      break;
    }
    case 'cable': case 'pipe': {
      // tramo largo y horizontal que atraviesa varias baldosas
      const n = 3 + Math.floor(rng() * 6), yy = y + 8, thick = kind === 'pipe' ? 3 : 2;
      let len = 0;
      for (let i = 0; i < n; i++) { if (lv.tile(tx + i, ty) !== '#' || depth(tx + i, ty) < 2) break; used.add((tx + i) + ',' + ty); len++; }
      const x1 = x + len * TILE;
      if (kind === 'pipe') {
        R(x, yy - 1, x1 - x, 3, '#8A96C8'); R(x, yy - 1, x1 - x, 1, '#C9D2F0'); R(x, yy + 1, x1 - x, 1, '#565E8C');
        for (let k = x + 6; k < x1; k += 16) { R(k, yy - 2, 2, 5, '#C9D2F0'); px(g, k, yy - 2, '#FFFFFF'); }
      } else {
        const c = G2.top === 'neon' ? '#30E1C5' : '#FF9D42';
        R(x, yy, x1 - x, thick, '#2A2A3A'); R(x, yy, x1 - x, 1, shade(c, -0.2));
        for (let k = x + 4; k < x1; k += 7) px(g, k, yy, c);
        if (len > 1) { R(x + 14, yy - 2, 4, 6, '#3A3058'); px(g, x + 15, yy - 1, PAL.sun); }
      }
      break;
    }
    case 'bolt':
      for (let i = 0; i < 2; i++) { const bx = x + 3 + i * 8, by = y + 4 + (i % 2) * 6; R(bx, by, 2, 2, '#565E8C'); px(g, bx, by, '#C9D2F0'); }
      break;
    case 'grille':
      R(ox, oy - 2, 8, 5, '#3A4068'); for (let k = 0; k < 4; k++) R(ox + 1 + k * 2, oy - 1, 1, 3, '#10162B'); R(ox, oy - 2, 8, 1, '#8A96C8');
      break;
    case 'circuit': {
      // pistas de un circuito impreso con sus soldaduras
      const c = '#1F8A7A', pad = '#B6F35B';
      R(x + 2, y + 5, 9, 1, c); R(x + 10, y + 5, 1, 7, c); R(x + 10, y + 11, 5, 1, c);
      R(x + 4, y + 9, 1, 6, c); R(x + 4, y + 9, 4, 1, c);
      px(g, x + 2, y + 5, pad); px(g, x + 14, y + 11, pad); px(g, x + 4, y + 14, pad); px(g, x + 7, y + 9, pad);
      R(x + 6, y + 2, 4, 2, '#10162B'); px(g, x + 6, y + 2, '#3A4068');
      break;
    }
  }
}
// hierba que cuelga por los bordes de los acantilados y musgo en las esquinas
function paintEdgeOverhang(lv, g, th, rng) {
  const tt = th.ground.top;
  if (!(tt === 'grass' || tt === 'moss' || tt === 'leafy')) return;
  for (let ty = 0; ty < lv.h; ty++) for (let tx = 0; tx < lv.w; tx++) {
    if (lv.tiles[ty][tx] !== '#' || (ty > 0 && lv.tiles[ty - 1][tx] === '#')) continue;
    for (const side of [-1, 1]) {
      if (lv.tile(tx + side, ty) === '#') continue;
      const ex = side < 0 ? tx * TILE : tx * TILE + 15;
      const n = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i++) {
        const len = 2 + Math.floor(rng() * 5), xx = ex + side * (i % 2), y0 = ty * TILE + 3 + i;
        rect(g, xx, y0, 1, len, i % 2 ? th.ground.topC : shade(th.ground.topC, -0.2));
      }
      if (tt === 'leafy' && rng() < 0.5) { const vy = ty * TILE + 4; for (let k = 0; k < 9; k++) px(g, ex + side * (k % 3 === 0 ? 1 : 0), vy + k, k % 3 ? '#3FA85A' : '#66D66A'); }
    }
  }
}
