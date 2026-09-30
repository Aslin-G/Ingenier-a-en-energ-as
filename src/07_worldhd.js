// =====================================================================
//  ARTE DEL MUNDO EN ALTA RESOLUCIÓN
//  Cielos con degradado fino, sol y luna nítidos, estrellas que titilan,
//  perspectiva aérea entre capas de fondo, volumen por sombreado en
//  montañas, árboles y nubes, profundidad del terreno, agua y viñeta.
//  Todo se calcula una vez (al construir el fondo o el nivel) salvo los
//  destellos vivos, así el coste por fotograma casi no cambia.
// =====================================================================

// color del cielo de un tema a una altura relativa t (0 arriba, 1 abajo)
function skyColorAt(th, t) {
  const st = th.sky;
  if (t <= st[0][0]) return st[0][1];
  for (let i = 0; i < st.length - 1; i++) {
    const a = st[i], b = st[i + 1];
    if (t <= b[0]) return mix(a[1], b[1], (t - a[0]) / Math.max(0.0001, b[0] - a[0]));
  }
  return st[st.length - 1][1];
}

// dirección de la luz del tema: 1 si el sol está a la derecha, -1 si a la izquierda
const themeLight = th => (th.sun && th.sun.x > 0.5 ? 1 : -1);

// disco del sol o de la luna (en píxeles de juego; el modo HD redondea su borde)
function buildSunSprite(s) {
  const r = s.r, c = makeCanvas(r * 2 + 3, r * 2 + 3), g = c.g, o = r + 1;
  pcircle(g, o, o, r, s.c);
  if (s.moon) {
    // luna creciente: se recorta un disco desplazado y se marcan dos cráteres suaves
    g.globalCompositeOperation = 'destination-out';
    pcircle(g, o + Math.round(r * 0.45), o - Math.round(r * 0.3), r - 1, '#000');
    g.globalCompositeOperation = 'source-over';
    g.globalCompositeOperation = 'source-atop';
    rect(g, o - Math.round(r * 0.55), o - 1, 2, 2, shade(s.c, -0.12));
    rect(g, o - Math.round(r * 0.25), o + Math.round(r * 0.45), 2, 1, shade(s.c, -0.1));
    g.globalCompositeOperation = 'source-over';
  } else {
    // núcleo más brillante desplazado hacia arriba: el disco parece una esfera luminosa
    pcircle(g, o - 1, o - 1, Math.max(2, r - 3), shade(s.c, 0.5));
  }
  return c;
}

// cielo a doble resolución: degradado continuo, halo suave y estrellas de medio píxel
function buildSkyHD(th, rng) {
  const S = RES, cw = W * S, ch = H * S, c = makeCanvas(cw, ch), g = c.g;
  for (let y = 0; y < ch; y++) { g.fillStyle = skyColorAt(th, (y + 0.5) / ch); g.fillRect(0, y, cw, 1); }
  const twinkles = [];
  if (th.stars) for (let i = 0; i < th.stars; i++) {
    // mismas tiradas que el cielo anterior: el resto del fondo conserva su diseño
    const y = Math.pow(rng(), 1.6) * H * 0.75, x = rng() * W, gold = rng() < 0.2;
    const col = gold ? PAL.sun : '#FFFFFF', big = i % 6 === 0;
    g.globalAlpha = big ? 0.95 : 0.45 + (i % 5) * 0.11;
    g.fillStyle = col; g.fillRect(Math.round(x * S), Math.round(y * S), big ? 2 : 1, big ? 2 : 1);
    g.globalAlpha = 1;
    if (i % 3 === 0) twinkles.push({ x, y, ph: i * 1.93, c: col, big });
  }
  let sunImg = null;
  if (th.sun) {
    const s = th.sun, sx = s.x * W, sy = s.y * H;
    const grd = g.createRadialGradient(sx * S, sy * S, s.r * S * 0.9, sx * S, sy * S, s.r * S * (s.moon ? 3.2 : 4.6));
    grd.addColorStop(0, rgba(s.glow, s.moon ? 0.3 : 0.45)); grd.addColorStop(0.3, rgba(s.glow, s.moon ? 0.1 : 0.18)); grd.addColorStop(1, rgba(s.glow, 0));
    g.fillStyle = grd; g.fillRect(0, 0, cw, ch);
    sunImg = buildSunSprite(s);
    g.save(); g.scale(S, S);
    g.drawImage(sunImg, Math.round(sx - s.r - 1), Math.round(sy - s.r - 1));
    g.restore();
  }
  return { c, twinkles, sunImg };
}

// estrellas que titilan y un leve brillo cruzado en las más grandes (detalle de medio píxel)
function drawSkyLive(g, bg, t) {
  const tw = bg.twinkles; if (!tw || !tw.length) return;
  for (const s of tw) {
    const a = Math.sin(t * (s.big ? 1.6 : 2.4) + s.ph);
    if (a < 0.35) continue;
    g.globalAlpha = (a - 0.35) * 1.4;
    g.fillStyle = s.c;
    const x = Math.round(s.x * 2) / 2, y = Math.round(s.y * 2) / 2;
    g.fillRect(x - 0.5, y, 1.5, 0.5); g.fillRect(x, y - 0.5, 0.5, 1.5);
    if (s.big && a > 0.8) { g.fillRect(x - 1.5, y, 3.5, 0.5); g.fillRect(x, y - 1.5, 0.5, 3.5); }
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------------
//  Volumen: esferas unidas sombreadas (copas de árboles, nubes, arbustos)
// ---------------------------------------------------------------------
// puffs: [[cx, cy, r], ...] en píxeles de la capa; tones: [sombra, medio, luz, brillo]
// Se pinta directamente en un ImageData (rápido y con píxeles exactos).
function shadeBlob(img, puffs, tones, lx, opts = {}) {
  const w = img.width, h = img.height, d = img.data;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [cx, cy, r] of puffs) { x0 = Math.min(x0, cx - r); y0 = Math.min(y0, cy - r); x1 = Math.max(x1, cx + r); y1 = Math.max(y1, cy + r); }
  x0 = Math.floor(x0); y0 = Math.max(0, Math.floor(y0)); x1 = Math.ceil(x1); y1 = Math.min(h - 1, Math.ceil(y1));
  if (opts.flatBottom != null) y1 = Math.min(y1, Math.floor(opts.flatBottom));
  const T = tones.map(hexRgb);
  const L = [lx * 0.45, -0.72, 0.52], ln = Math.hypot(L[0], L[1], L[2]);
  for (let y = y0; y <= y1; y++) for (let xr = x0; xr <= x1; xr++) {
    let best = -1, nx = 0, ny = 0, nz = 0;
    for (const [cx, cy, r] of puffs) {
      const dx = (xr + 0.5 - cx) / r, dy = (y + 0.5 - cy) / r, q = dx * dx + dy * dy;
      if (q > 1) continue;
      const z = Math.sqrt(1 - q), zz = z * r + (opts.front ? (cy - y0) * 0.02 : 0);
      if (zz > best) { best = zz; nx = dx; ny = dy; nz = z; }
    }
    if (best < 0) continue;
    const dot = (nx * L[0] + ny * L[1] + nz * L[2]) / ln;
    // tramado ordenado entre tonos: el sombreado sigue siendo pixel art
    const lv = clamp((dot + 0.15) * 2.4, 0, 3), b = Math.floor(lv), fr = lv - b;
    const x = ((xr % w) + w) % w;
    const k = Math.min(3, b + (fr * 16 > BAYER[(y & 3) * 4 + (x & 3)] ? 1 : 0));
    const i = (y * w + x) * 4, col = T[Math.min(k, T.length - 1)];
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
}

// nubes sombreadas pre-renderizadas (en píxeles de juego)
const CloudSprites = {
  cache: {},
  get(seed, s, tones) {
    const key = seed + ':' + s + ':' + tones.join(',');
    if (this.cache[key]) return this.cache[key];
    const rng = mulberry32(seed * 7919 + 3);
    const w = Math.round(64 * s), h = Math.round(30 * s), c = makeCanvas(w, h);
    const img = c.g.createImageData(w, h);
    const n = 4 + Math.floor(rng() * 3), puffs = [];
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), mid = 1 - Math.abs(k - 0.5) * 2;
      const r = (6 + rng() * 4 + mid * 7) * s;
      puffs.push([w * 0.16 + w * 0.68 * k + (rng() - 0.5) * 4 * s, h - 5 * s - r * 0.55, r]);
    }
    shadeBlob(img, puffs, tones, -1, { flatBottom: h - 4 * s });
    c.g.putImageData(img, 0, 0);
    return (this.cache[key] = c);
  }
};

// ---------------------------------------------------------------------
//  Perspectiva aérea: cada capa lejana se funde con el cielo y lleva
//  un borde iluminado y niebla baja entre cordilleras.
// ---------------------------------------------------------------------
function finishLayer(c, th, L) {
  if (L.fn === 'sea') return;
  const w = c.width, h = c.height, g = c.g;
  const img = g.getImageData(0, 0, w, h), d = img.data;
  const far = clamp(1 - L.p / 0.62, 0, 1);
  const haze0 = 0.04 + far * 0.24, fog = 0.05 + far * 0.34;
  const night = !th.sun || th.sun.moon;
  const rimHex = th.sun ? (th.sun.moon ? mix(th.sun.c, th.sun.glow, 0.5) : mix(th.sun.c, '#FFFFFF', 0.3)) : th.cave ? '#FF9D42' : '#DFFBFF';
  const rimC = hexRgb(rimHex), rimA = night ? 0.26 : 0.42;
  const rows = []; for (let y = 0; y < h; y++) rows.push(hexRgb(skyColorAt(th, y / h)));
  // altura típica de la silueta: por debajo empieza la niebla
  const tops = [];
  for (let x = 0; x < w; x += 4) { let y = 0; while (y < h && d[(y * w + x) * 4 + 3] < 10) y++; if (y < h) tops.push(y); }
  tops.sort((a, b) => a - b);
  const med = tops.length ? tops[Math.floor(tops.length / 2)] : h * 0.6;
  const fogTop = med + (h - med) * 0.15;
  for (let x = 0; x < w; x++) {
    let run = -1;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 10) { run = -1; continue; }
      if (run < 0) run = y;
      let r = d[i], gg = d[i + 1], b = d[i + 2];
      const k = y - run;
      if (run > 0 && k < 2) { const a = k === 0 ? rimA : rimA * 0.35; r += (rimC[0] - r) * a; gg += (rimC[1] - gg) * a; b += (rimC[2] - b) * a; }
      const fy = clamp((y - fogTop) / Math.max(1, h - fogTop), 0, 1);
      const a = Math.min(0.8, haze0 + fog * fy * fy), sc = rows[y];
      d[i] = r + (sc[0] - r) * a; d[i + 1] = gg + (sc[1] - gg) * a; d[i + 2] = b + (sc[2] - b) * a;
    }
  }
  g.putImageData(img, 0, 0);
}

// ---------------------------------------------------------------------
//  Terreno con volumen: cuanto más adentro de la roca, más oscuro
//  (con tramado ordenado), y más claro cerca de cada borde expuesto.
// ---------------------------------------------------------------------
function shadeTerrain(lv, c) {
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
  // profundidad (px) en el centro de cada baldosa; el aire cuenta como -8
  const depthAt = (x, y) => { x = clamp(x, 0, tw - 1); y = clamp(y, 0, thh - 1); const v = dist[y * tw + x]; return v === 0 ? -8 : v < 0 ? 200 : v * 16 - 8; };
  const g = c.g, w = c.width, h = c.height, img = g.getImageData(0, 0, w, h), d = img.data;
  const dark = hexRgb(lv.theme.ground.edge);
  const deep = lv.theme.ground.pier ? 0.1 : 0.12;
  for (let ty = 0; ty < thh; ty++) for (let tx = 0; tx < tw; tx++) {
    if (lv.tiles[ty][tx] !== '#' || dist[ty * tw + tx] < 1) continue;
    for (let yy = 0; yy < 16; yy++) {
      const py = ty * 16 + yy; if (py >= h) break;
      for (let xx = 0; xx < 16; xx++) {
        const px0 = tx * 16 + xx;
        // interpolación bilineal entre centros de baldosa
        const fx = px0 / 16 - 0.5, fy = py / 16 - 0.5, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
        const dp = lerp(lerp(depthAt(ix, iy), depthAt(ix + 1, iy), ax), lerp(depthAt(ix, iy + 1), depthAt(ix + 1, iy + 1), ax), ay);
        const s = clamp((dp - 9) / 60, 0, 1);
        if (s <= 0) continue;
        const lvq = s * 3, b = Math.floor(lvq), fr = lvq - b;
        const k = Math.min(3, b + (fr * 16 > BAYER[(py & 3) * 4 + (px0 & 3)] ? 1 : 0));
        if (!k) continue;
        const i = (py * w + px0) * 4, f = k * deep;
        d[i] += (dark[0] - d[i]) * f; d[i + 1] += (dark[1] - d[i + 1]) * f; d[i + 2] += (dark[2] - d[i + 2]) * f;
      }
    }
  }
  g.putImageData(img, 0, 0);
}

// sombra redonda bajo los pies (asienta a personajes y enemigos en el suelo)
function groundShadow(g, x, y, w, a = 0.26) {
  g.globalAlpha = a; g.fillStyle = '#0A0E1C';
  const hw = Math.max(3, Math.round(w / 2));
  g.fillRect(Math.round(x - hw), Math.round(y), hw * 2, 1);
  g.fillRect(Math.round(x - hw + 2), Math.round(y) + 1, hw * 2 - 4, 1);
  g.globalAlpha = 1;
}

// viñeta suave (más marcada de noche): enfoca la mirada en el centro
const Vignette = {
  cache: {},
  get(a) {
    const k = Math.round(a * 100); if (this.cache[k]) return this.cache[k];
    const c = makeCanvas(W, H), g = c.g;
    const grd = g.createRadialGradient(W / 2, H * 0.48, H * 0.42, W / 2, H * 0.48, W * 0.62);
    grd.addColorStop(0, 'rgba(10,14,28,0)'); grd.addColorStop(1, `rgba(10,14,28,${a})`);
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    return (this.cache[k] = c);
  }
};

// rayos de sol suaves (degradado real en lugar de franjas)
function drawSoftRays(g, t, cols, alpha, originX = W * 0.5) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < cols.length; i++) {
    const x = originX + (i - (cols.length - 1) / 2) * 70 + Math.sin(t * 0.3 + i * 1.7) * 18, lean = 0.28 + (i - cols.length / 2) * 0.05;
    const grd = g.createLinearGradient(x, 0, x + 200 * lean, 210);
    grd.addColorStop(0, rgba(cols[i], alpha * (0.7 + 0.3 * Math.sin(t * 0.8 + i)))); grd.addColorStop(1, rgba(cols[i], 0));
    g.fillStyle = grd;
    g.beginPath(); g.moveTo(x - 6, -2); g.lineTo(x + 8, -2); g.lineTo(x + 210 * lean + 22, 212); g.lineTo(x + 210 * lean - 14, 212); g.closePath(); g.fill();
  }
  g.restore();
}
