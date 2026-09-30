// =====================================================================
//  ARTE DEL MUNDO: temas por región, fondos parallax, tiles autoajustables
// =====================================================================

const THEMES = {
  festival: {
    name: 'Puerto Inicial', sky: [[0, '#3B2A7A'], [0.45, '#B0508C'], [0.75, '#FF9D6B'], [1, '#FFD89A']],
    stars: 40, sun: { x: 0.7, y: 0.62, r: 22, c: '#FFD84A', glow: '#FF9D42' },
    layers: [
      { p: 0.08, fn: 'sea', o: { y: 190, c1: '#5A4A9A', c2: '#FF9D6B' } },
      { p: 0.12, fn: 'islands', o: { base: 196, color: '#4A3A8A', count: 5 } },
      { p: 0.3, fn: 'city', o: { base: 214, color: '#3A2E6E', win: ['#FFD84A', '#FF7FCF', '#30E1C5'], min: 30, max: 80, lit: 0.6, roofs: true } },
      { p: 0.55, fn: 'trees', o: { base: 236, color: '#2A2560', type: 'palm', count: 8 } }
    ],
    live: ['lanterns', 'lighthouse', 'boats', 'birds', 'fireworks'],
    ground: { fill: '#6B4A7A', fill2: '#57386A', top: 'planks', topC: '#B07A4A', topHi: '#D8A06A', edge: '#2A1A3A', deco: ['flower', 'crate'], pier: '#3A2E7A' },
    plat: 'wood', water: ['#2A4A9A', '#59C7FF'], hazard: 'goo', ambient: 'sea', music: 'festival', particles: 'confetti', dark: 0, tint: '#1B1040'
  },
  puerto: {
    name: 'Puerto Inicial', sky: [[0, '#10163A'], [0.5, '#22306B'], [0.8, '#3A4A8A'], [1, '#5A5AA0']],
    stars: 90, sun: { x: 0.2, y: 0.2, r: 10, c: '#FFF3D7', glow: '#9B76FF', moon: true },
    layers: [
      { p: 0.08, fn: 'sea', o: { y: 186, c1: '#1B2A5A', c2: '#3A5A9A' } },
      { p: 0.14, fn: 'islands', o: { base: 192, color: '#1E2A5A', count: 5 } },
      { p: 0.3, fn: 'city', o: { base: 212, color: '#1B2248', win: ['#FFD84A', '#30E1C5'], min: 30, max: 70, lit: 0.12, roofs: true } },
      { p: 0.55, fn: 'trees', o: { base: 236, color: '#141A3A', type: 'palm', count: 7 } }
    ],
    live: ['boats', 'fireflies'], // el faro del Puerto es un objeto del nivel: no se repite en el fondo
    ground: { fill: '#4A3F6B', fill2: '#3A3058', top: 'planks', topC: '#8B5A3C', topHi: '#B07A4A', edge: '#1A1030', deco: ['crate', 'rope'], pier: '#1B2A5A' },
    plat: 'wood', water: ['#1B3A7A', '#30E1C5'], hazard: 'goo', ambient: 'sea', music: 'puerto', particles: 'fireflies', dark: 0.5, tint: '#0B1030'
  },
  valle: {
    name: 'Valle Secuencia', sky: [[0, '#4FB8FF'], [0.6, '#9FE0FF'], [1, '#E8FFF0']],
    stars: 0, sun: { x: 0.8, y: 0.16, r: 14, c: '#FFF3A0', glow: '#FFD84A' },
    layers: [
      { p: 0.06, fn: 'mountains', o: { base: 150, amp: 60, color: '#9FC8F0', color2: '#C8E4FF', snow: '#FFFFFF' } },
      { p: 0.15, fn: 'hills', o: { base: 175, amp: 25, color: '#7ACB7A', hi: '#A6E08A' } },
      { p: 0.3, fn: 'windmills', o: { base: 185, color: '#FFF3D7', roof: '#FF6B6B', count: 3 } },
      { p: 0.4, fn: 'hills', o: { base: 205, amp: 18, color: '#4FB060', hi: '#7ACB7A', flowers: ['#FF7FCF', '#FFD84A', '#FFFFFF'] } },
      { p: 0.62, fn: 'trees', o: { base: 240, color: '#3A9A55', color2: '#66D66A', type: 'round', count: 6 } }
    ],
    live: ['clouds', 'birds', 'butterflies'],
    ground: { fill: '#A0643C', fill2: '#8B5A3C', top: 'grass', topC: '#66D66A', topHi: '#B6F35B', edge: '#4A2A18', deco: ['flower', 'flower', 'grass', 'rock', 'mushroom'] },
    plat: 'wood', water: ['#2A8AD8', '#9FE8FF'], hazard: 'thorn', ambient: 'wind', music: 'valle', particles: 'pollen', dark: 0.35, tint: '#1B2A50'
  },
  solaria: {
    name: 'Solaria', sky: [[0, '#FFB84A'], [0.4, '#FFE08A'], [0.8, '#BFF4FF'], [1, '#8FE8F0']],
    stars: 0, sun: { x: 0.5, y: 0.14, r: 20, c: '#FFFFFF', glow: '#FFD84A' },
    layers: [
      { p: 0.06, fn: 'mountains', o: { base: 160, amp: 40, color: '#F0C080', color2: '#FFE0A8' } },
      { p: 0.18, fn: 'city', o: { base: 190, color: '#FFE6B0', win: ['#30E1C5', '#59C7FF'], min: 30, max: 90, lit: 0.9, domes: true, panels: true } },
      { p: 0.35, fn: 'mirrors', o: { base: 210, count: 10 } },
      { p: 0.6, fn: 'trees', o: { base: 242, color: '#30B090', color2: '#66D66A', type: 'palm', count: 6 } }
    ],
    live: ['sunrays', 'birds', 'clouds'],
    ground: { fill: '#F0D090', fill2: '#E0B870', top: 'tiles', topC: '#30E1C5', topHi: '#9CF5D8', edge: '#8A5A2A', deco: ['flower', 'sunflower', 'panel', 'lamp'] },
    plat: 'glass', water: ['#30B8D8', '#BFF8FF'], hazard: 'heat', ambient: 'wind', music: 'solaria', particles: 'glints', dark: 0.3, tint: '#3A2A10'
  },
  aeris: {
    name: 'Aeris', sky: [[0, '#6A8AFF'], [0.5, '#9FC0FF'], [0.85, '#FFD0E8'], [1, '#FFE8D0']],
    stars: 0, sun: { x: 0.25, y: 0.22, r: 12, c: '#FFFFFF', glow: '#FF7FCF' },
    layers: [
      { p: 0.05, fn: 'clouds', o: { y: 200, color: '#FFFFFF', shadow: '#D8E0FF', count: 10, big: true } },
      { p: 0.12, fn: 'floaters', o: { color: '#8A9AE0', color2: '#AFC0FF', count: 6 } },
      { p: 0.28, fn: 'windmills', o: { base: 150, color: '#FFFFFF', roof: '#9B76FF', count: 2, floating: true } },
      { p: 0.4, fn: 'clouds', o: { y: 240, color: '#FFF3FF', shadow: '#E0D8FF', count: 8 } }
    ],
    live: ['kites', 'windlines', 'birds', 'clouds'],
    ground: { fill: '#9A7AC8', fill2: '#8A6AB8', top: 'grass', topC: '#9CF5D8', topHi: '#D6FFF0', edge: '#3A2A6A', deco: ['flower', 'grass', 'kite'], roots: true },
    plat: 'cloud', water: ['#59C7FF', '#D6F6FF'], hazard: 'spark', ambient: 'wind', music: 'aeris', particles: 'wind', dark: 0.25, tint: '#20205A'
  },
  hydria: {
    name: 'Cascadas Hydria', sky: [[0, '#30C8E0'], [0.6, '#9FF0F0'], [1, '#F0FFF8']],
    stars: 0, sun: { x: 0.75, y: 0.18, r: 13, c: '#FFFFFF', glow: '#9CF5D8' },
    layers: [
      { p: 0.06, fn: 'mountains', o: { base: 150, amp: 70, color: '#5AB8B0', color2: '#8FD8C8' } },
      { p: 0.16, fn: 'waterfalls', o: { base: 200, color: '#FFFFFF', rock: '#E8E0F0', coral: '#FF9D8A', count: 4 } },
      { p: 0.35, fn: 'city', o: { base: 214, color: '#FFF3EE', win: ['#FF6B6B', '#30E1C5'], min: 20, max: 60, lit: 0.6, domes: true } },
      { p: 0.6, fn: 'trees', o: { base: 244, color: '#2A9A8A', color2: '#66D6A0', type: 'round', count: 7 } }
    ],
    live: ['waterfall', 'bubbles', 'fish', 'clouds'],
    ground: { fill: '#EDE6F5', fill2: '#D8CFE8', top: 'moss', topC: '#66D6A0', topHi: '#B6F3C8', edge: '#6A5A8A', deco: ['coral', 'shell', 'grass', 'lily'] },
    plat: 'stone', water: ['#1FA8C8', '#9CF5F0'], hazard: 'urchin', ambient: 'water', music: 'hydria', particles: 'mist', dark: 0.3, tint: '#0A2A40'
  },
  bioloop: {
    name: 'Bosque BioLoop', sky: [[0, '#1A6A5A'], [0.5, '#3AA870'], [1, '#B6F35B']],
    stars: 0, sun: null,
    layers: [
      { p: 0.08, fn: 'trees', o: { base: 190, color: '#1F5A4A', type: 'tall', count: 10 } },
      { p: 0.2, fn: 'trees', o: { base: 210, color: '#2A7A55', color2: '#3FA85A', type: 'round', count: 9 } },
      { p: 0.38, fn: 'market', o: { base: 222 } },
      { p: 0.62, fn: 'ferns', o: { base: 250, color: '#1F6A40', color2: '#3FA85A' } }
    ],
    live: ['fireflies', 'leaves', 'butterflies'],
    ground: { fill: '#5E3A26', fill2: '#4A2A1A', top: 'leafy', topC: '#3FA85A', topHi: '#B6F35B', edge: '#2A1810', deco: ['mushroom', 'fern', 'flower', 'grass'] },
    plat: 'leaf', water: ['#2A7A5A', '#9CF5D8'], hazard: 'thorn', ambient: 'forest', music: 'bioloop', particles: 'leaves', dark: 0.4, tint: '#0A2018'
  },
  gea: {
    name: 'Gea Profunda', sky: [[0, '#1A0E2A'], [0.6, '#3A1A3A'], [1, '#6A2A30']],
    stars: 0, sun: null, cave: true,
    layers: [
      { p: 0.1, fn: 'cave', o: { color: '#2A1638', color2: '#3A2050', crystals: ['#9B76FF', '#FF7FCF'] } },
      { p: 0.25, fn: 'cave', o: { color: '#3A1E48', color2: '#4A2A5A', crystals: ['#30E1C5', '#C9B2FF'], lower: true } },
      { p: 0.45, fn: 'pipesBg', o: { color: '#5A3A5A', hi: '#8A5A6A', y: 180 } }
    ],
    live: ['embers', 'crystalGlow', 'steamBg'],
    ground: { fill: '#3A2A48', fill2: '#2E2040', top: 'rock', topC: '#6A4A7A', topHi: '#9A7AB0', edge: '#140A20', deco: ['crystal', 'crystal', 'rock', 'glowmush'] },
    plat: 'crystal', water: ['#FF6A2A', '#FFD84A'], hazard: 'magma', ambient: 'cave', music: 'gea', particles: 'embers', dark: 0.5, tint: '#140A24'
  },
  h2: {
    name: 'Bahía H2', sky: [[0, '#2A8AE0'], [0.5, '#7FD0FF'], [0.85, '#FFE0F0'], [1, '#FFF3D7']],
    stars: 0, sun: { x: 0.35, y: 0.2, r: 14, c: '#FFFFFF', glow: '#7FE7FF' },
    layers: [
      { p: 0.06, fn: 'sea', o: { y: 170, c1: '#2A7AC8', c2: '#9FE8FF' } },
      { p: 0.14, fn: 'tanks', o: { base: 178, colors: ['#FFFFFF', '#FF9D42', '#30E1C5', '#FF7FCF'] } },
      { p: 0.32, fn: 'city', o: { base: 206, color: '#E8F0FF', win: ['#30E1C5', '#FF9D42'], min: 25, max: 75, lit: 0.7, pipes: true } },
      { p: 0.58, fn: 'cranes', o: { base: 240, color: '#FF9D42' } }
    ],
    live: ['boats', 'gulls', 'bubblesH2', 'clouds'],
    ground: { fill: '#7A8AB8', fill2: '#6A7AA8', top: 'metal', topC: '#C9D2F0', topHi: '#FFFFFF', edge: '#2A3060', deco: ['pipe', 'valve', 'crate', 'lamp'] },
    plat: 'metal', water: ['#1F6AB8', '#7FE7FF'], hazard: 'leak', ambient: 'sea', music: 'h2', particles: 'spray', dark: 0.35, tint: '#0A1838'
  },
  bateria: {
    name: 'Ciudad Batería', sky: [[0, '#0A0A2A'], [0.5, '#1E1450'], [0.85, '#4A1E6A'], [1, '#8A2A7A']],
    stars: 70, sun: { x: 0.8, y: 0.18, r: 11, c: '#FFE8F8', glow: '#FF7FCF', moon: true },
    layers: [
      { p: 0.08, fn: 'city', o: { base: 170, color: '#1A1440', win: ['#FF7FCF', '#30E1C5', '#FFD84A', '#9B76FF'], min: 40, max: 120, lit: 0.5 } },
      { p: 0.2, fn: 'batteries', o: { base: 196 } },
      { p: 0.4, fn: 'city', o: { base: 222, color: '#221A50', win: ['#30E1C5', '#FF4FB8', '#B6F35B'], min: 30, max: 90, lit: 0.7, neon: true } }
    ],
    live: ['tram', 'stars'],
    ground: { fill: '#2A2458', fill2: '#221E4A', top: 'neon', topC: '#30E1C5', topHi: '#C9FFF4', edge: '#0A0820', deco: ['lamp', 'sign', 'battery', 'plant'] },
    plat: 'neon', water: ['#2A1A6A', '#FF7FCF'], hazard: 'spark', ambient: 'city', music: 'bateria', particles: 'neon', dark: 0.45, tint: '#08061A'
  },
  prisma: {
    name: 'Microred Prisma', sky: [[0, '#6A4AE0'], [0.35, '#E07ACF'], [0.7, '#FFC88A'], [1, '#B6F3D8']],
    stars: 20, sun: { x: 0.5, y: 0.2, r: 15, c: '#FFFFFF', glow: '#FF7FCF' },
    layers: [
      { p: 0.06, fn: 'mountains', o: { base: 160, amp: 50, color: '#9A7AE0', color2: '#C8B0FF' } },
      { p: 0.18, fn: 'prismTowers', o: { base: 200 } },
      { p: 0.35, fn: 'windmills', o: { base: 208, color: '#FFFFFF', roof: '#30E1C5', count: 3 } },
      { p: 0.6, fn: 'hills', o: { base: 240, amp: 12, color: '#5AB88A', hi: '#9CF5D8', flowers: ['#FF7FCF', '#FFD84A', '#59C7FF', '#FF9D42'] } }
    ],
    live: ['prismrays', 'birds', 'clouds'],
    ground: { fill: '#8A7AC8', fill2: '#7A6AB8', top: 'crystalTop', topC: '#FF7FCF', topHi: '#FFFFFF', edge: '#2A1A5A', deco: ['crystal', 'flower', 'panel', 'turbine'] },
    plat: 'prism', water: ['#59C7FF', '#FFFFFF'], hazard: 'spark', ambient: 'wind', music: 'prisma', particles: 'prism', dark: 0.45, tint: '#140A30'
  },
  faro: {
    name: 'Faro Aurora', sky: [[0, '#050A20'], [0.4, '#10204A'], [0.8, '#1A3A6A'], [1, '#2A5A7A']],
    stars: 140, sun: null, aurora: true,
    layers: [
      { p: 0.05, fn: 'sea', o: { y: 215, c1: '#0A1838', c2: '#30E1C5' } },
      { p: 0.12, fn: 'islands', o: { base: 218, color: '#0E1A3A', count: 8, lights: true } }
    ],
    live: ['aurora', 'stars', 'beam'],
    ground: { fill: '#E8E6F5', fill2: '#D0CCE8', top: 'marble', topC: '#FFD84A', topHi: '#FFF3D7', edge: '#4A4A7A', deco: ['lamp', 'crystal'] },
    plat: 'gold', water: ['#1B3A7A', '#30E1C5'], hazard: 'zero', ambient: 'wind', music: 'boss', particles: 'aurora', dark: 0.3, tint: '#050A20'
  },
  taller: {
    name: 'Taller de Lía', sky: [[0, '#8B5A3C'], [1, '#6B4A2C']], stars: 0, sun: null, layers: [], live: [],
    ground: { fill: '#8B5A3C', fill2: '#7A4A2C', top: 'planks', topC: '#C88A5A', topHi: '#E8B07A', edge: '#3A2010', deco: [] },
    plat: 'wood', water: ['#2A4A9A', '#59C7FF'], hazard: 'goo', ambient: 'none', music: 'map', particles: 'none', dark: 0
  }
};

// ---------- ruido periódico (para fondos que se repiten sin costuras) ----------
function periodicNoise(rng, w, octaves = 4) {
  const comps = [];
  for (let o = 1; o <= octaves; o++) comps.push({ k: o * randi(1, 3) + (o === 1 ? 1 : 0), a: 1 / o, ph: rng() * Math.PI * 2 });
  const total = comps.reduce((s, c) => s + c.a, 0);
  return x => comps.reduce((s, c) => s + c.a * Math.sin(c.k * x / w * Math.PI * 2 + c.ph), 0) / total;
}

// ---------- pintores de capas de fondo ----------
const BGP = {
  sea(g, w, h, rng, o) {
    vGradient(g, 0, o.y, w, h - o.y, [[0, o.c2], [0.15, o.c1], [1, shade(o.c1, -0.4)]], false);
    for (let i = 0; i < 90; i++) { const y = o.y + 3 + Math.floor(Math.pow(rng(), 1.5) * (h - o.y)); rect(g, rng() * w, y, 4 + rng() * 14, 1, rgba(o.c2, 0.35)); }
  },
  mountains(g, w, h, rng, o) {
    // perfil con crestas afiladas: ruido suave + «ridged noise»
    const n = periodicNoise(rng, w, 5), r2 = periodicNoise(rng, w, 3);
    const ys = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      const base = n(x) * 0.5 + 0.5, ridge = 1 - Math.abs(r2(x));
      ys[x] = o.base - (base * 0.6 + ridge * ridge * 0.45) * o.amp - Math.abs(Math.sin(x / w * Math.PI * 6)) * o.amp * 0.1;
    }
    const lx = BGP.lx || -1;
    const T = { lit: hexRgb(o.color2 || shade(o.color, 0.14)), mid: hexRgb(o.color), dark: hexRgb(shade(o.color, -0.1)), deep: hexRgb(shade(o.color, -0.18)) };
    const snow = o.snow ? hexRgb(o.snow) : null, snowS = o.snow ? hexRgb(mix(o.snow, o.color, 0.45)) : null;
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const wrap = x => ((x % w) + w) % w;
    const slope = x => (ys[wrap(x + 3)] - ys[wrap(x - 3)]) / 6;
    const put = (x, y, c) => { const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    const snowLine = o.base - o.amp * 0.74;
    for (let x = 0; x < w; x++) {
      const y0 = Math.max(0, Math.round(ys[x]));
      for (let y = y0; y < h; y++) {
        const k = y - y0;
        // la frontera luz/sombra baja en diagonal desde cada cresta (caras facetadas)
        const s = slope(Math.round(x - k * lx * 0.45)) * lx;
        let c = s > 0.12 ? (k < 70 ? T.lit : T.mid) : s < -0.12 ? (k > 34 ? T.deep : T.dark) : T.mid;
        if (Math.abs(Math.abs(s) - 0.12) < 0.05 && BAYER[(y & 3) * 4 + (x & 3)] < 8) c = T.mid;
        if (snow && y < snowLine + Math.sin(x * 0.37) * 3 + Math.sin(x * 0.11) * 4) c = s > -0.12 ? snow : snowS;
        put(x, y, c);
      }
    }
    g.putImageData(img, 0, 0);
  },
  hills(g, w, h, rng, o) {
    const n = periodicNoise(rng, w, 3), lx = BGP.lx || -1;
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const C = hexRgb(o.color), HI = hexRgb(o.hi), DK = hexRgb(shade(o.color, -0.1)), LT = hexRgb(mix(o.color, o.hi, 0.5));
    const put = (x, y, c) => { if (y < 0 || y >= h) return; const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    const ys = []; for (let x = 0; x < w; x++) ys.push(o.base - (n(x) * 0.5 + 0.5) * o.amp);
    for (let x = 0; x < w; x++) {
      const y0 = Math.round(ys[x]), sl = (ys[(x + 5) % w] - ys[(x - 5 + w) % w]) * lx;
      for (let y = Math.max(0, y0); y < h; y++) {
        const k = y - y0, b = BAYER[(y & 3) * 4 + (x & 3)];
        let c = C;
        if (k < 2) c = HI;
        else if (k < 7 && sl > 0.6 && b < 10) c = LT;
        else if (k > 12 && b < clamp((k - 12) / 26, 0, 1) * 9) c = DK;
        put(x, y, c);
      }
    }
    // matorrales redondos sombreados sobre la loma
    const bush = [shade(o.color, -0.14), o.color, mix(o.color, o.hi, 0.6), o.hi];
    for (let i = 0; i < w / 40; i++) {
      const x = Math.floor(rng() * w), r = 2.5 + rng() * 3;
      shadeBlob(img, [[x, ys[x] + r * 0.5, r], [x + r * 1.1, ys[x] + r * 0.7, r * 0.8]], bush, lx);
    }
    if (o.flowers) for (let x = 0; x < w; x++) if (rng() < 0.12) { const c = hexRgb(choice(o.flowers)); put(x, Math.round(ys[x] + 3 + rng() * 20), c); }
    g.putImageData(img, 0, 0);
  },
  trees(g, w, h, rng, o) {
    const n = o.count || 6, lx = BGP.lx || -1;
    const c = o.color, c2 = o.color2 || shade(o.color, 0.14);
    const tones = [shade(c, -0.16), c, c2, shade(c2, 0.2)];
    const list = [];
    for (let i = 0; i < n * 2; i++) list.push({ x: (i / (n * 2)) * w + rng() * 30, s: 0.7 + rng() * 0.6, base: o.base + rng() * 6, i });
    const trunk = (xx, t) => {
      const s = t.s;
      if (o.type === 'tall') { rect(g, xx - 2, t.base - 120 * s, 5, 130 * s, shade(c, -0.1)); rect(g, xx - 2 + (lx > 0 ? 3 : 0), t.base - 120 * s, 2, 130 * s, shade(c, 0.02)); }
      else if (o.type === 'pine') { for (let y = 0; y < 40 * s; y++) { const ww = y * 0.35; rect(g, xx - ww, t.base - 44 * s + y, ww * 2 + 1, 1, y % 6 < 3 ? c : c2); } rect(g, xx - 1, t.base - 6, 3, 6, shade(c, -0.2)); }
      else if (o.type === 'palm') {
        // tronco segmentado y algo curvado; hojas en dos tonos que cuelgan
        const th = 40 * s, lean = (t.i % 2 ? 1 : -1) * 3 * s;
        let tx = xx, ty = t.base;
        for (let k = 0; k < th; k++) { tx = xx + Math.sin(k / th * 1.4) * lean; ty = t.base - k; rect(g, tx, ty, 3, 1, k % 4 === 0 ? shade(c, -0.28) : shade(c, -0.1)); }
        for (let f = 0; f < 6; f++) {
          const a = -2.9 + f * 0.56, len = (16 + (f % 2) * 4) * s;
          for (let r = 0; r < len; r++) {
            const fx = tx + 1 + Math.cos(a) * r, fy = ty + Math.sin(a) * r * 0.6 + r * r * 0.022;
            rect(g, fx, fy, r > len * 0.7 ? 2 : 3, 2, r < len * 0.45 ? c2 : c);
          }
        }
        rect(g, tx, ty + 1, 2, 2, shade(c, -0.3)); rect(g, tx + 2, ty + 2, 2, 2, shade(c, -0.3));
      } else rect(g, xx - 1, t.base - 18 * t.s, 3, 18 * t.s, shade(c, -0.15));
    };
    for (const t of list) { trunk(t.x, t); if (t.x > w - 60) trunk(t.x - w, t); if (t.x < 60) trunk(t.x + w, t); }
    if (o.type === 'round' || o.type === 'tall') {
      // copas: esferas unidas con luz del lado del sol y tramado entre tonos
      const img = g.getImageData(0, 0, w, h);
      for (const t of list) {
        const s = t.s, x = t.x, b = t.base;
        const puffs = o.type === 'tall'
          ? [[x, b - 120 * s, 16 * s], [x - 12 * s, b - 105 * s, 12 * s], [x + 12 * s, b - 108 * s, 13 * s], [x + 2 * s, b - 132 * s, 10 * s]]
          : [[x, b - 24 * s, 11 * s], [x - 7 * s, b - 18 * s, 8 * s], [x + 7 * s, b - 19 * s, 8 * s], [x - 2 * s, b - 30 * s, 7 * s]];
        shadeBlob(img, puffs, tones, lx);
      }
      g.putImageData(img, 0, 0);
      if (o.type === 'tall') for (const t of list) for (let v = 0; v < 3; v++) rect(g, t.x - 14 * t.s + v * 12, t.base - 100 * t.s, 1, 30 + rng() * 40, shade(c, 0.15));
    }
    rect(g, 0, o.base + 4, w, h, o.color);
  },
  ferns(g, w, h, rng, o) {
    for (let x = 0; x < w; x += 3) {
      const hh = 10 + rng() * 26;
      for (let k = 0; k < hh; k++) rect(g, x + Math.sin(k * 0.3) * 2, o.base - k, 2, 1, k > hh - 4 ? o.color2 : o.color);
    }
    rect(g, 0, o.base, w, h, o.color);
  },
  city(g, w, h, rng, o) {
    let x = 0;
    while (x < w) {
      const bw = 16 + Math.floor(rng() * 30), bh = o.min + Math.floor(rng() * (o.max - o.min));
      const top = o.base - bh;
      const col = shade(o.color, (rng() - 0.5) * 0.12);
      rect(g, x, top, bw, h - top, col);
      rect(g, x, top, 1, h - top, shade(col, 0.1));
      if (o.domes && rng() < 0.4) pellipse(g, x + bw / 2, top, bw / 2 - 1, 7, col);
      if (o.roofs && rng() < 0.6) { for (let k = 0; k < bw / 2 + 2; k++) rect(g, x + k - 1, top - k * 0.6, bw - k * 2 + 2, 1, shade(col, -0.1)); }
      if (o.panels && rng() < 0.5) { rect(g, x + 2, top - 3, bw - 4, 2, '#2A4A9A'); rect(g, x + 3, top - 3, bw - 6, 1, '#7FE7FF'); }
      if (o.pipes && rng() < 0.4) { rect(g, x + bw - 5, top - 12, 3, 12, shade(col, -0.2)); }
      // ventanas
      for (let wy = top + 4; wy < o.base - 2; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) {
        if (rng() < o.lit) rect(g, wx, wy, 2, 3, choice(o.win)); else rect(g, wx, wy, 2, 3, shade(col, -0.15));
      }
      if (o.neon && rng() < 0.3) { const nc = choice(o.win); rect(g, x + 2, top + 6, bw - 4, 1, nc); rect(g, x + 2, top + 10, bw - 4, 1, nc); }
      // rótulos de neón colgados de la fachada (no flotando en el cielo)
      if (o.neon && bw >= 24 && rng() < 0.45) {
        const nc = choice(o.win), label = choice(['BAT', 'SOC', 'LUX', '24H', 'KWH']), sw = Math.min(bw - 6, 20);
        rect(g, x + 3, top + 14, sw, 9, '#0A0820'); strokeRect(g, x + 3, top + 14, sw, 9, nc);
        drawText(g, label, x + 3 + Math.floor(sw / 2), top + 15, nc, { align: 'center' });
      }
      x += bw + Math.floor(rng() * 4);
    }
  },
  islands(g, w, h, rng, o) {
    for (let i = 0; i < o.count; i++) {
      const cx = rng() * w, iw = 30 + rng() * 60, ih = 6 + rng() * 14;
      for (let k = -1; k <= 1; k++) {
        const x = cx + k * w;
        pellipse(g, x, o.base, iw / 2, ih, o.color);
        rect(g, x - iw / 2, o.base, iw, 3, o.color);
        if (o.lights) for (let l = 0; l < 4; l++) rect(g, x - iw / 3 + rng() * iw * 0.6, o.base - rng() * ih, 1, 1, choice(['#FFD84A', '#30E1C5', '#FF7FCF']));
        if (rng() < 0.4) { rect(g, x, o.base - ih - 16, 2, 16, o.color); rect(g, x - 1, o.base - ih - 18, 4, 3, o.lights ? '#FFD84A' : shade(o.color, 0.1)); }
      }
    }
  },
  clouds(g, w, h, rng, o) {
    // nubes con volumen: esferas unidas iluminadas desde arriba
    const img = g.getImageData(0, 0, w, h);
    const tones = [o.shadow, mix(o.shadow, o.color, 0.5), o.color, '#FFFFFF'];
    for (let i = 0; i < o.count; i++) {
      const cx = rng() * w, cy = o.y + rng() * 20, s = o.big ? 1.6 + rng() : 0.8 + rng() * 0.8;
      shadeBlob(img, [[cx, cy + 4, 14 * s], [cx - 14 * s, cy + 8, 10 * s], [cx + 16 * s, cy + 8, 11 * s], [cx - 3 * s, cy - 3 * s, 9 * s]], tones, BGP.lx || -1);
    }
    g.putImageData(img, 0, 0);
    rect(g, 0, o.y + 18, w, h, o.color);
    ditherRect(g, 0, o.y + 18, w, 3, o.shadow, 0.5);
  },
  floaters(g, w, h, rng, o) {
    for (let i = 0; i < o.count; i++) {
      const cx = (i + rng() * 0.5) / o.count * w, cy = 70 + rng() * 90, iw = 20 + rng() * 40;
      for (let y = 0; y < iw * 0.6; y++) { const ww = iw / 2 * (1 - y / (iw * 0.6)); rect(g, cx - ww, cy + y, ww * 2, 1, y < 2 ? o.color2 : o.color); }
      rect(g, cx - iw / 2, cy - 2, iw, 2, '#9CF5D8');
    }
  },
  windmills(g, w, h, rng, o) {
    const hubs = [];
    for (let i = 0; i < o.count; i++) {
      const x = Math.round((i + 0.3 + rng() * 0.4) / o.count * w), base = Math.round(o.base + rng() * 8);
      const hh = Math.round(34 + rng() * 14);
      if (o.floating) { pellipse(g, x, base + 4, 18, 7, '#AFC0FF'); rect(g, x - 18, base, 36, 3, '#9CF5D8'); }
      for (let y = 0; y < hh; y++) { const ww = 3 + y * 0.12; rect(g, x - ww, base - hh + y, ww * 2, 1, o.color); }
      for (let k = 0; k < 7; k++) rect(g, x - 5 - k * 0.2 + k, base - hh - 5 + k, 10 - k * 2 + 2, 1, o.roof);
      rect(g, x - 1, base - 8, 3, 8, shade(o.color, -0.3));
      rect(g, x - 1, base - hh + 5, 3, 3, shade(o.color, -0.35)); // ventana
      hubs.push({ x, y: base - hh + 1, r: 15 + (hh - 34) * 0.4, color: shade(o.color, -0.08), sail: '#FFF3D7' });
    }
    return { hubs };
  },
  mirrors(g, w, h, rng, o) {
    for (let i = 0; i < o.count * 2; i++) {
      const x = rng() * w, y = o.base + rng() * 10;
      rect(g, x, y - 12, 1, 12, '#8A6A4A');
      for (let k = 0; k < 10; k++) rect(g, x - 6 + k * 0.4, y - 16 + k * 0.5, 12, 1, k < 2 ? '#FFFFFF' : k % 3 ? '#59C7FF' : '#7FE7FF');
    }
    rect(g, 0, o.base + 12, w, h, '#E8C880');
  },
  waterfalls(g, w, h, rng, o) {
    // acantilados con cascada: la roca llega hasta la base y el agua cae por una hendidura
    for (let i = 0; i < o.count; i++) {
      const x = (i + 0.2 + rng() * 0.5) / o.count * w;
      const top = 70 + rng() * 40, cw = 46 + rng() * 20;
      const rock = o.rock, rockS = shade(o.rock, -0.12), rockD = shade(o.rock, -0.22);
      for (let k = -1; k <= 1; k++) {
        const xx = x + k * w;
        // masa rocosa con borde irregular
        for (let yy = top; yy < o.base + 4; yy++) {
          const f = (yy - top) / (o.base - top);
          const half = cw / 2 + Math.sin(yy * 0.21 + i) * 2 + f * 8;
          rect(g, xx - half, yy, half * 2, 1, yy % 7 === 0 ? rockS : rock);
          rect(g, xx + half - 4, yy, 4, 1, rockD);
        }
        rect(g, xx - cw / 2 - 1, top - 2, cw + 2, 3, '#66D6A0'); rect(g, xx - cw / 2 + 4, top - 4, 10, 2, '#8FE8B8');
        // cascada
        const sw = 8 + (i % 2) * 4;
        rect(g, xx - sw / 2, top - 1, sw, o.base - top + 1, '#DFFBFF');
        for (let yy = top; yy < o.base; yy += 3) rect(g, xx - sw / 2 + ((yy / 3) % 3), yy, 1, 2, '#FFFFFF');
        rect(g, xx - 1, top, 2, o.base - top, '#FFFFFF');
        // espuma en la base
        pellipse(g, xx, o.base, sw + 6, 4, '#FFFFFF'); pellipse(g, xx - sw, o.base + 1, 5, 2, '#EFFFFF');
        if (o.coral) { rect(g, xx - cw / 2 - 2, o.base - 8, 3, 8, o.coral); rect(g, xx - cw / 2 + 2, o.base - 5, 2, 5, o.coral); }
      }
    }
  },
  market(g, w, h, rng, o) {
    let x = 0; const cols = ['#FF6B6B', '#FFD84A', '#FF9D42', '#FF7FCF', '#30E1C5'];
    while (x < w) {
      const sw = 26 + rng() * 14;
      const c = choice(cols);
      rect(g, x, o.base - 26, 2, 26, '#5E3A26'); rect(g, x + sw - 2, o.base - 26, 2, 26, '#5E3A26');
      for (let k = 0; k < sw; k += 4) { rect(g, x + k, o.base - 30, 4, 6, k % 8 ? c : '#FFF3D7'); rect(g, x + k, o.base - 24, 4, 2, k % 8 ? shade(c, -0.2) : '#E8D8B8'); }
      rect(g, x + 2, o.base - 10, sw - 4, 10, '#8B5A3C');
      for (let k = 0; k < 5; k++) pcircle(g, x + 6 + k * 4, o.base - 12, 2, choice(['#FF6B6B', '#FFD84A', '#B6F35B', '#FF9D42']));
      x += sw + 20 + rng() * 30;
    }
    rect(g, 0, o.base, w, h, '#2A5A3A');
  },
  cave(g, w, h, rng, o) {
    // techo con estalactitas cónicas y suelo con estalagmitas; el borde recibe el resplandor del magma
    const n = periodicNoise(rng, w, 4), n2 = periodicNoise(rng, w, 4);
    const img = g.getImageData(0, 0, w, h), d = img.data;
    const C = hexRgb(o.color), C2 = hexRgb(o.color2), HI = hexRgb(mix(o.color, '#FF9D6B', 0.28)), HI2 = hexRgb(mix(o.color2, '#FF9D6B', 0.22)), DK = hexRgb(shade(o.color, -0.2));
    const put = (x, y, c) => { if (y < 0 || y >= h) return; x = ((x % w) + w) % w; const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
    const wd = (a, b) => { const q = Math.abs(a - b) % w; return Math.min(q, w - q); };
    const stal = [], stag = [];
    for (let i = 0; i < 46; i++) stal.push({ x: rng() * w, len: 8 + rng() * 36, r: 2 + rng() * 5 });
    for (let i = 0; i < 30; i++) stag.push({ x: rng() * w, len: 6 + rng() * 22, r: 2 + rng() * 5 });
    for (let x = 0; x < w; x++) {
      let top = 40 + (n(x) * 0.5 + 0.5) * 50;
      for (const s of stal) { const q = wd(x, s.x); if (q < s.r) top = Math.max(top, 40 + (n(s.x) * 0.5 + 0.5) * 50 + s.len * Math.pow(1 - q / s.r, 1.4)); }
      top = Math.round(top);
      for (let y = 0; y < top; y++) {
        const k = top - y, b = BAYER[(y & 3) * 4 + (x & 3)];
        put(x, y, k <= 2 ? HI : (y < 26 && b < (26 - y) * 0.6) ? DK : C);
      }
      if (o.lower) {
        let bt = 200 + (n2(x) * 0.5 + 0.5) * 40;
        for (const s of stag) { const q = wd(x, s.x); if (q < s.r) bt = Math.min(bt, 200 + (n2(s.x) * 0.5 + 0.5) * 40 - s.len * Math.pow(1 - q / s.r, 1.4)); }
        bt = Math.round(bt);
        for (let y = bt; y < h; y++) put(x, y, y - bt < 2 ? HI2 : C2);
      }
    }
    // racimos de cristales facetados (cara clara, cara oscura, punta blanca)
    for (let i = 0; i < 18; i++) {
      const x0 = Math.floor(rng() * w), up = !!o.lower, col = choice(o.crystals);
      const base = up ? 212 + Math.floor(rng() * 20) : 34 + Math.floor(rng() * 50);
      const Lc = hexRgb(shade(col, 0.22)), Dc = hexRgb(shade(col, -0.18)), Tc = hexRgb('#FFFFFF');
      for (let j = 0; j < 3; j++) {
        const cx = x0 + (j - 1) * 3, len = 5 + Math.floor(rng() * 7) - (j === 1 ? 0 : 2), hw = 1 + (j === 1 ? 1 : 0);
        for (let k = 0; k < len; k++) {
          const ww = Math.max(0, Math.round(hw * (1 - k / len) + 0.4)), y = up ? base - k : base + k;
          for (let q = -ww; q <= ww; q++) put(cx + q, y, k >= len - 2 ? Tc : q < 0 ? Lc : q > 0 ? Dc : Lc);
        }
      }
    }
    g.putImageData(img, 0, 0);
  },
  pipesBg(g, w, h, rng, o) {
    for (let i = 0; i < 6; i++) {
      const y = o.y + i * 8 + rng() * 6;
      rect(g, 0, y, w, 4, o.color); rect(g, 0, y, w, 1, o.hi);
      for (let x = rng() * 60; x < w; x += 60 + rng() * 80) { rect(g, x, y - 1, 3, 6, o.hi); }
    }
  },
  tanks(g, w, h, rng, o) {
    let x = 10;
    while (x < w) {
      const r = 10 + rng() * 12, c = choice(o.colors);
      rect(g, x, o.base - r * 2, r * 2, r * 2, c); pellipse(g, x + r, o.base - r * 2, r, 4, shade(c, 0.2));
      rect(g, x + 3, o.base - r * 2, 2, r * 2, shade(c, 0.3));
      drawText(g, 'H2', x + r - 4, o.base - r - 3, shade(c, -0.4));
      x += r * 2 + 12 + rng() * 30;
    }
    rect(g, 0, o.base, w, h, '#C9D2F0');
  },
  cranes(g, w, h, rng, o) {
    for (let i = 0; i < 4; i++) {
      const x = (i + rng() * 0.5) / 4 * w;
      rect(g, x, o.base - 70, 4, 70, o.color); rect(g, x - 30, o.base - 70, 60, 3, o.color);
      for (let y = 0; y < 70; y += 6) pline(g, x, o.base - 70 + y, x + 3, o.base - 64 + y, shade(o.color, -0.3));
      rect(g, x + 22, o.base - 67, 1, 20, '#565E8C'); rect(g, x + 18, o.base - 47, 9, 7, choice(['#30E1C5', '#FF6B6B', '#FFD84A']));
    }
    rect(g, 0, o.base, w, h, '#565E8C');
  },
  batteries(g, w, h, rng, o) {
    let x = 0;
    while (x < w) {
      const bw = 22 + rng() * 14, bh = 50 + rng() * 60, soc = rng();
      const top = o.base - bh;
      rect(g, x, top, bw, bh + 80, '#2A2F6A'); rect(g, x + bw / 2 - 4, top - 5, 8, 5, '#565E8C');
      const col = soc > 0.6 ? '#B6F35B' : soc > 0.3 ? '#FFD84A' : '#FF6B6B';
      const fill = Math.round((bh - 6) * soc);
      rect(g, x + 3, o.base - 3 - fill, bw - 6, fill, col); rect(g, x + 3, o.base - 3 - fill, 2, fill, shade(col, 0.3));
      strokeRect(g, x + 2, top + 2, bw - 4, bh - 4, '#565E8C');
      x += bw + 8 + rng() * 26;
    }
  },
  prismTowers(g, w, h, rng, o) {
    const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF', '#FF7FCF'];
    for (let i = 0; i < 8; i++) {
      const x = (i + rng() * 0.6) / 8 * w, hh = 50 + rng() * 60, c = cols[i % cols.length];
      for (let y = 0; y < hh; y++) { const ww = 2 + (y / hh) * 8; rect(g, x - ww, o.base - hh + y, ww * 2, 1, y % 5 === 0 ? shade(c, 0.3) : c); }
      rect(g, x - 1, o.base - hh - 4, 2, 4, '#FFFFFF');
    }
  }
};

// ---------- Construcción del fondo de una región ----------
// aspas giratorias de los molinos del fondo (las torres están pintadas en la capa)
function drawLayerBlades(g, L, ox, oy, t, speed) {
  if (!L.meta || !L.meta.hubs) return;
  for (const hb of L.meta.hubs) for (const off of [0, 960]) {
    const hx = hb.x + ox + off, hy = hb.y + oy;
    if (hx < -30 || hx > W + 30) continue;
    const a0 = t * speed + hb.x;
    for (let k = 0; k < 4; k++) {
      const a = a0 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      for (let r = 2; r < hb.r; r++) { px(g, hx + ca * r, hy + sa * r, hb.color); if (r > 5) px(g, hx + ca * r - sa * 2, hy + sa * r + ca * 2, hb.sail); }
    }
    rect(g, hx - 1, hy - 1, 3, 3, '#5E3A26');
  }
}
function buildBackground(themeKey) {
  const th = THEMES[themeKey];
  const rng = mulberry32(hashStr(themeKey));
  const BW = 960;
  // cielo a doble resolución (degradado fino, halo y estrellas de medio píxel)
  const skyHD = buildSkyHD(th, rng);
  BGP.lx = themeLight(th);
  const layers = th.layers.map(L => {
    const c = makeCanvas(BW, H);
    const meta = BGP[L.fn](c.g, BW, H, rng, L.o) || null;
    // perspectiva aérea: velo del color del cielo, borde iluminado y niebla baja
    finishLayer(c, th, L);
    return { c, p: L.p, meta };
  });
  return { sky: skyHD.c, twinkles: skyHD.twinkles, sunImg: skyHD.sunImg, layers, theme: th };
}

// ---------- Decoraciones pequeñas sobre el terreno ----------
function drawDeco(g, type, x, y, rng, th) {
  // (x, y) = esquina superior izquierda de la baldosa sobre la que se apoya (y = parte superior)
  const R = (a, b, w, h, c) => rect(g, x + a, y + b, w, h, c);
  switch (type) {
    case 'flower': { const c = choice(['#FF7FCF', '#FFD84A', '#FFFFFF', '#FF6B6B', '#9B76FF']); const fx = randi(2, 12); R(fx, -4, 1, 4, '#3FA85A'); R(fx - 1, -6, 3, 1, c); R(fx, -7, 1, 3, c); R(fx, -6, 1, 1, '#FFF3A0'); break; }
    case 'sunflower': { const fx = randi(3, 11); R(fx, -10, 1, 10, '#3FA85A'); R(fx + 1, -6, 2, 1, '#66D66A'); R(fx - 2, -14, 5, 5, '#FFD84A'); R(fx - 1, -13, 3, 3, '#8B5A3C'); break; }
    case 'grass': { for (let i = 0; i < 4; i++) { const gx = randi(0, 14); R(gx, -randi(2, 4), 1, 4, shade(th.ground.topC, 0.2)); } break; }
    case 'rock': { const rx = randi(1, 10); R(rx, -3, 5, 3, '#8A8FB0'); R(rx + 1, -4, 3, 1, '#A8AECF'); break; }
    case 'mushroom': { const mx = randi(2, 12); const c = choice(['#FF6B6B', '#FF9D42', '#9B76FF']); R(mx, -3, 1, 3, '#FFF3D7'); R(mx - 2, -5, 5, 2, c); R(mx - 1, -6, 3, 1, c); R(mx - 1, -5, 1, 1, '#FFFFFF'); break; }
    case 'glowmush': { const mx = randi(2, 12); R(mx, -4, 1, 4, '#C9B2FF'); R(mx - 2, -6, 5, 2, '#30E1C5'); R(mx - 1, -7, 3, 1, '#9CF5D8'); break; }
    case 'crystal': { const cx = randi(2, 11); const c = choice(['#9B76FF', '#FF7FCF', '#30E1C5', '#59C7FF']); for (let k = 0; k < 7; k++) { const ww = Math.max(0, 2 - Math.abs(k - 5) * 0.5); R(cx - ww, -k - 1, ww * 2 + 1, 1, k > 4 ? '#FFFFFF' : c); } break; }
    case 'fern': { const fx = randi(2, 12); for (let k = 0; k < 6; k++) { R(fx - k * 0.7, -k - 1, 1, 1, '#3FA85A'); R(fx + k * 0.7, -k - 1, 1, 1, '#66D66A'); } break; }
    case 'coral': { const cx = randi(2, 12); R(cx, -6, 1, 6, '#FF9D8A'); R(cx - 2, -4, 1, 3, '#FF9D8A'); R(cx + 2, -5, 1, 4, '#FF6B6B'); R(cx - 2, -4, 2, 1, '#FF9D8A'); break; }
    case 'shell': { const sx = randi(2, 12); R(sx, -2, 4, 2, '#FFE0D0'); R(sx + 1, -3, 2, 1, '#FFB8A0'); break; }
    case 'lily': { const lx = randi(2, 10); R(lx, -2, 5, 2, '#66D6A0'); R(lx + 2, -4, 2, 2, '#FF7FCF'); break; }
    case 'crate': { const cx = randi(0, 4); R(cx, -9, 10, 9, '#B07A4A'); strokeRect(g, x + cx, y - 9, 10, 9, '#6B4A2A'); pline(g, x + cx, y - 9, x + cx + 9, y - 1, '#6B4A2A'); break; }
    case 'rope': { R(2, -8, 3, 8, '#8B5A3C'); R(1, -9, 5, 1, '#6B4A2A'); for (let k = 0; k < 4; k++) R(2 + k % 2, -7 + k * 2, 2, 1, '#E8C170'); break; }
    case 'panel': { const px0 = randi(1, 4); R(px0 + 4, -6, 1, 6, '#8A8FB0'); for (let k = 0; k < 4; k++) R(px0 + k, -9 + k, 9, 1, k === 0 ? '#9FE8FF' : '#2A4A9A'); break; }
    case 'turbine': { R(7, -16, 1, 16, '#FFFFFF'); const a = rng() * 6; for (let k = 0; k < 3; k++) pline(g, x + 7, y - 16, x + 7 + Math.cos(a + k * 2.1) * 6, y - 16 + Math.sin(a + k * 2.1) * 6, '#FFFFFF'); break; }
    case 'pipe': { R(0, -6, 16, 4, '#C9D2F0'); R(0, -6, 16, 1, '#FFFFFF'); R(6, -8, 4, 8, '#8A96C8'); break; }
    case 'valve': { R(6, -8, 1, 8, '#8A8FB0'); R(3, -9, 7, 2, '#FF6B6B'); break; }
    case 'sign': { R(6, -14, 1, 14, '#565E8C'); R(1, -18, 12, 6, '#1A1440'); R(2, -17, 10, 1, choice(['#FF4FB8', '#30E1C5', '#B6F35B'])); R(2, -14, 7, 1, '#FFD84A'); break; }
    case 'battery': { R(4, -10, 7, 10, '#C9D2F0'); R(6, -11, 3, 1, '#8A8FB0'); R(5, -6, 5, 5, '#B6F35B'); break; }
    case 'plant': { R(5, -4, 6, 4, '#FF9D42'); R(7, -9, 1, 5, '#3FA85A'); R(5, -8, 2, 1, '#66D66A'); R(8, -7, 2, 1, '#66D66A'); break; }
    case 'kite': break;
  }
}

// ---------- Tiles ----------
function tileSolid(t) { return t === '#' || t === 'B'; }
function paintSolidTile(g, x, y, mask, th, rng) {
  const G2 = th.ground;
  const top = !(mask & 1), bottom = !(mask & 2), left = !(mask & 4), right = !(mask & 8);
  rect(g, x, y, 16, 16, G2.fill);
  const tt = G2.top;
  if (G2.pier) {
    // muelle: agua bajo los tablones y postes de madera
    rect(g, x, y, 16, 16, G2.pier);
    if ((x / 16) % 3 === 0) { rect(g, x + 6, y, 4, 16, '#6B4A2A'); rect(g, x + 6, y, 1, 16, '#8B5A3C'); }
    if ((y / 16 + x / 16) % 4 === 0) rect(g, x + 2, y + 10, 5, 1, shade(G2.pier, 0.25));
    if ((y / 16 + x / 16) % 5 === 2) rect(g, x + 9, y + 4, 4, 1, shade(G2.pier, 0.18));
    if (top) {
      rect(g, x, y, 16, 5, G2.topC); rect(g, x, y, 16, 1, G2.topHi); rect(g, x, y + 5, 16, 1, G2.edge);
      rect(g, x + ((x / 16) % 2 ? 5 : 11), y + 1, 1, 4, shade(G2.topC, -0.25));
      rect(g, x + 1, y + 6, 14, 2, '#5E3A26');
    }
    if (left && top) rect(g, x, y, 1, 6, G2.edge);
    if (right && top) rect(g, x + 15, y, 1, 6, G2.edge);
    return;
  }
  if (tt === 'tiles' || tt === 'marble' || tt === 'metal' || tt === 'neon') {
    // patrón de bloques
    rect(g, x, y + 7, 16, 1, G2.fill2); rect(g, x + ((y / 16) % 2 ? 4 : 11), y, 1, 7, G2.fill2); rect(g, x + ((y / 16) % 2 ? 11 : 4), y + 8, 1, 8, G2.fill2);
    if (tt === 'metal') { px(g, x + 2, y + 2, '#C9D2F0'); px(g, x + 13, y + 2, '#C9D2F0'); px(g, x + 2, y + 12, '#C9D2F0'); px(g, x + 13, y + 12, '#C9D2F0'); }
    if (tt === 'marble' && rng() < 0.3) pline(g, x + 2, y + 3, x + 9, y + 11, shade(G2.fill2, -0.05));
  } else {
    for (let i = 0; i < 5; i++) { const sx = x + Math.floor(rng() * 14), sy = y + Math.floor(rng() * 14); rect(g, sx, sy, 2, 1, G2.fill2); if (rng() < 0.3) px(g, sx, sy - 1, shade(G2.fill, 0.12)); }
  }
  if (left) { rect(g, x, y, 1, 16, G2.edge); rect(g, x + 1, y, 1, 16, shade(G2.fill, -0.08)); }
  if (right) { rect(g, x + 15, y, 1, 16, G2.edge); rect(g, x + 14, y, 1, 16, shade(G2.fill, -0.12)); }
  if (bottom) { rect(g, x, y + 15, 16, 1, G2.edge); rect(g, x, y + 14, 16, 1, shade(G2.fill, -0.12)); if (th.ground.roots && rng() < 0.6) { const rx = x + randi(2, 13); rect(g, rx, y + 16, 1, randi(2, 7), '#6A5AA0'); } }
  if (top) {
    switch (tt) {
      case 'grass': case 'moss': case 'leafy':
        rect(g, x, y, 16, 4, G2.topC); rect(g, x, y, 16, 1, G2.topHi);
        for (let i = 0; i < 16; i += 2) rect(g, x + i, y + 4, 1, 1 + ((i * 7 + x) % 3), G2.topC);
        if (tt === 'leafy') for (let i = 0; i < 3; i++) rect(g, x + randi(0, 13), y + 1, 3, 1, G2.topHi);
        if (tt === 'moss') for (let i = 0; i < 3; i++) px(g, x + randi(0, 15), y + randi(1, 3), '#FFFFFF');
        break;
      case 'planks':
        rect(g, x, y, 16, 5, G2.topC); rect(g, x, y, 16, 1, G2.topHi); rect(g, x, y + 5, 16, 1, G2.edge);
        rect(g, x + ((x / 16) % 2 ? 5 : 11), y + 1, 1, 4, shade(G2.topC, -0.25));
        break;
      case 'tiles':
        for (let i = 0; i < 16; i += 4) rect(g, x + i, y, 4, 3, (i / 4 + x / 16) % 2 ? G2.topC : '#FFD84A');
        rect(g, x, y, 16, 1, G2.topHi); rect(g, x, y + 3, 16, 1, shade(G2.fill, -0.2));
        break;
      case 'rock':
        rect(g, x, y, 16, 3, G2.topC); rect(g, x, y, 16, 1, G2.topHi);
        for (let i = 0; i < 3; i++) rect(g, x + randi(0, 13), y + 3, 3, 1, G2.topC);
        break;
      case 'metal':
        rect(g, x, y, 16, 3, G2.topC); rect(g, x, y, 16, 1, G2.topHi);
        for (let i = 0; i < 16; i += 8) { rect(g, x + i, y + 3, 4, 1, '#FFD84A'); rect(g, x + i + 4, y + 3, 4, 1, '#10162B'); }
        break;
      case 'neon':
        rect(g, x, y, 16, 2, G2.topC); rect(g, x, y, 16, 1, G2.topHi); rect(g, x, y + 2, 16, 1, shade(G2.topC, -0.5));
        break;
      case 'marble':
        rect(g, x, y, 16, 3, G2.topHi); rect(g, x, y + 3, 16, 1, G2.topC);
        break;
      case 'crystalTop': {
        const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF', '#FF7FCF'];
        for (let i = 0; i < 16; i += 2) rect(g, x + i, y, 2, 3, cols[((x + i) / 2) % cols.length]);
        rect(g, x, y, 16, 1, '#FFFFFF');
        break;
      }
      default:
        rect(g, x, y, 16, 3, G2.topC); rect(g, x, y, 16, 1, G2.topHi);
    }
  }
}

function paintPlatform(g, x, y, style, th) {
  switch (style) {
    case 'wood': rect(g, x, y, 16, 4, '#B07A4A'); rect(g, x, y, 16, 1, '#D8A06A'); rect(g, x, y + 4, 16, 1, '#5E3A26'); rect(g, x + 2, y + 5, 2, 3, '#6B4A2A'); rect(g, x + 12, y + 5, 2, 3, '#6B4A2A'); break;
    case 'glass': rect(g, x, y, 16, 3, '#9FE8FF'); rect(g, x, y, 16, 1, '#FFFFFF'); rect(g, x, y + 3, 16, 1, '#30A8C8'); px(g, x + 4, y + 1, '#FFFFFF'); break;
    case 'cloud': pellipse(g, x + 8, y + 3, 9, 3, '#FFFFFF'); rect(g, x, y + 4, 16, 1, '#D8E0FF'); break;
    case 'stone': rect(g, x, y, 16, 5, '#EDE6F5'); rect(g, x, y, 16, 1, '#66D6A0'); rect(g, x, y + 5, 16, 1, '#8A7AA8'); rect(g, x + 7, y + 1, 1, 4, '#C8BFD8'); break;
    case 'leaf': pellipse(g, x + 8, y + 2, 9, 2, '#3FA85A'); rect(g, x + 1, y + 2, 14, 1, '#B6F35B'); break;
    case 'crystal': rect(g, x, y, 16, 4, '#6A4A9A'); rect(g, x, y, 16, 1, '#C9B2FF'); px(g, x + 3, y + 1, '#FF7FCF'); px(g, x + 11, y + 2, '#30E1C5'); rect(g, x, y + 4, 16, 1, '#2A1A44'); break;
    case 'metal': rect(g, x, y, 16, 4, '#C9D2F0'); rect(g, x, y, 16, 1, '#FFFFFF'); rect(g, x, y + 4, 16, 1, '#565E8C'); px(g, x + 2, y + 2, '#565E8C'); px(g, x + 13, y + 2, '#565E8C'); break;
    case 'neon': rect(g, x, y, 16, 3, '#2A2458'); rect(g, x, y, 16, 1, '#FF4FB8'); rect(g, x, y + 3, 16, 1, '#30E1C5'); break;
    case 'prism': { const cols = ['#FF6B6B', '#FFD84A', '#30E1C5', '#9B76FF']; for (let i = 0; i < 4; i++) rect(g, x + i * 4, y, 4, 3, cols[(i + x / 16) % 4]); rect(g, x, y, 16, 1, '#FFFFFF'); break; }
    case 'gold': rect(g, x, y, 16, 4, '#FFD84A'); rect(g, x, y, 16, 1, '#FFF3D7'); rect(g, x, y + 4, 16, 1, '#C88A2A'); break;
    default: rect(g, x, y, 16, 4, '#B07A4A');
  }
}
function paintLadder(g, x, y) {
  rect(g, x + 3, y, 2, 16, '#8B5A3C'); rect(g, x + 11, y, 2, 16, '#8B5A3C');
  for (let i = 2; i < 16; i += 5) rect(g, x + 3, y + i, 10, 2, '#D8A06A');
}
function paintRope(g, x, y) {
  for (let i = 0; i < 16; i += 2) rect(g, x + 7 + (i % 4 ? 1 : 0), y + i, 2, 2, '#E8C170');
}
