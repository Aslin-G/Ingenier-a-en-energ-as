// =====================================================================
//  MÁS SIMULADORES: uno por isla de energía
//  Cada uno junta una energía renovable con un concepto de programación:
//    Aeris   · aerogenerador  → condiciones y bucles (P crece con v³)
//    Hydria  · presa          → funciones con parámetros: potencia(caudal, altura)
//    Bioloop · biodigestor    → listas (la cola de residuos)
//    Gea     · pozo geotérmico→ máquina de estados
//    H2      · cadena del H2  → pipeline (cada etapa pierde una parte)
//  Están en cada isla (un quiosco «SIM» cerca del inicio) y en el Taller
//  (Laboratorio de simuladores), donde se pueden repetir cuando se quiera.
// =====================================================================

// ---------- utilidades de dibujo comunes ----------
function simSky(g, x, y, w, h, top, bottom) { vGradient(g, x, y, w, h, [[0, top], [1, bottom]], false); }
function simLabel(g, text, x, y, col = PAL.white, align = 'left') { drawText(g, text, x, y, col, { outline: '#10162B', align }); }
const f1 = v => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',');

// ---------------------------------------------------------------------
//  AERIS · AEROGENERADOR (condiciones + bucles, energía eólica)
//  P = ½·ρ·A·v³·Cp. El rotor debe mirar al viento (orientación) y, con
//  tormenta, poner las palas «en bandera» (paso ≥ 80°) para protegerse.
// ---------------------------------------------------------------------
const windAlign = s => Math.max(0, Math.cos((s.yaw - s.dir) * Math.PI / 180));
function windPower(s) {
  const ve = s.v * windAlign(s), cp = 0.45 * Math.pow(Math.max(0, Math.cos(s.pitch * Math.PI / 180)), 2);
  if (ve < 3) return 0; // velocidad de arranque
  return Math.min(600, 0.5 * 1.225 * 1257 * ve * ve * ve * cp / 1000);
}
const SIM_EOLICO = {
  title: 'Aerogenerador de pruebas', short: 'Aerogenerador', region: 'aeris', color: PAL.aqua,
  blurb: 'Orienta el rotor, mira cómo crece la potencia con v³ y protégelo de la tormenta con una condición.',
  tags: ['CONDICIONES', 'EÓLICA'], concepts: ['conditions', 'loops', 'wind'], codex: 'eolica', xp: 40,
  init: () => ({ yaw: -60, pitch: 0, dir: 20, v: 8, vT: 8, P: 0, rpm: 0, rot: 0, stress: 0, braked: 0 }),
  controls: [
    { id: 'yaw', label: 'orientación', min: -90, max: 90, step: 1, unit: '°', speed: 45, color: PAL.orange, get: s => s.yaw, set: (s, v) => { s.yaw = v; } },
    { id: 'pitch', label: 'paso de pala', min: 0, max: 90, step: 1, unit: '°', speed: 45, color: PAL.aqua, get: s => s.pitch, set: (s, v) => { s.pitch = v; } }
  ],
  step(s, dt, sim) {
    s.v = approach(s.v, s.vT, dt * 4);
    s.P = windPower(s);
    const ve = s.v * windAlign(s), rpmT = ve * 2.2 * Math.max(0.05, Math.cos(s.pitch * Math.PI / 180));
    s.rpm = approach(s.rpm, s.braked > 0 ? 0 : rpmT, dt * 20);
    s.rot += s.rpm * 0.105 * dt;
    s.braked = Math.max(0, s.braked - dt);
    // tensión: si el rotor gira demasiado rápido las palas sufren
    s.stress = clamp(s.stress + (s.rpm > 40 ? (s.rpm - 40) * 2 : -15) * dt, 0, 100);
    if (s.stress >= 100) {
      s.stress = 55; s.braked = 1.5; AudioSys.sfx('fail'); FX.shake(2, 0.3);
      sim.say('¡FRENO DE EMERGENCIA! Las palas giraban demasiado rápido. Regla: SI viento > 25 ENTONCES paso ≥ 80°.', PAL.coral);
    }
  },
  vars: [
    { name: 'viento', get: s => s.v, max: 30, unit: 'm/s', color: PAL.sky, fmt: f1 },
    { name: 'potencia', get: s => s.P, max: 600, unit: 'kW', color: PAL.aqua },
    { name: 'rotor', get: s => s.rpm, max: 70, unit: 'rpm', color: PAL.orange },
    { name: 'tension', get: s => s.stress, max: 100, unit: '%', color: PAL.coral }
  ],
  chart: { label: 'potencia (kW)', get: s => s.P, min: 0, max: 650, target: (s, sim) => [150, 550, null, 300][sim.mi], color: PAL.aqua },
  missions: [
    { text: 'Gira el rotor con «orientación» hasta mirar de frente al viento (flecha azul): potencia ≥ 150 kW.', check: s => s.P >= 150, hold: 0.5, ok: 'De frente al viento las palas captan toda su fuerza.' },
    { text: 'El viento sube a 12 m/s y cambia de dirección. Reorienta el rotor: potencia ≥ 550 kW.', start: s => { s.vT = 12; s.dir = -10; }, check: s => s.v >= 11.5 && s.P >= 550, hold: 0.5, ok: 'Viento ×1,5 → potencia ×3,4: la potencia crece con v³.' },
    { text: '¡TORMENTA de 28 m/s! Regla: SI viento > 25 ENTONCES paso de pala ≥ 80° (bandera). Protégelo 3 s.', start: s => { s.vT = 28; }, check: s => s.v > 25 && s.pitch >= 80, hold: 3, ok: 'Una CONDICIÓN protege la máquina: en bandera el viento no empuja las palas.' },
    { text: 'Pasó la tormenta (10 m/s). Baja el paso de pala y vuelve a producir ≥ 300 kW.', start: s => { s.vT = 10; }, check: s => s.v < 11 && s.P >= 300, hold: 0.5, ok: 'El controlador repite en BUCLE: medir el viento → decidir → ajustar.' }
  ],
  final: 'La potencia crece con el CUBO del viento (v × v × v). El control es un BUCLE que mide el viento sin parar y decide con CONDICIONES: SI viento > 25 m/s, palas en bandera.',
  hints: ['La flecha azul del círculo es el viento y la naranja, el rotor: haz que coincidan.', 'En la tormenta sube el «paso de pala» a 80° o más: las palas se ponen de canto.', 'Tras la tormenta baja el paso de pala cerca de 0° para volver a captar el viento.'],
  view(g, x, y, w, h, s, t) {
    const storm = clamp((s.v - 14) / 12, 0, 1);
    simSky(g, x, y, w, h - 18, mix('#7FC8FF', '#3A4068', storm), mix('#E8F6FF', '#6A7090', storm));
    // nubes que corren con el viento
    for (let i = 0; i < 4; i++) {
      const cx = x + ((i * 97 + t * s.v * 2.2) % (w + 70)) - 35, cy = y + 14 + (i % 2) * 12;
      g.globalAlpha = 0.8; pellipse(g, cx, cy, 14, 3, mix('#FFFFFF', '#8A90B0', storm)); pellipse(g, cx + 7, cy - 2, 8, 3, mix('#FFFFFF', '#9AA0C0', storm)); g.globalAlpha = 1;
    }
    // colinas y un aerogenerador lejano
    const gy = y + h - 18;
    for (let xx = 0; xx < w; xx++) { const hh = 12 + Math.sin(xx * 0.025 + 2) * 7 + Math.sin(xx * 0.07) * 2; rect(g, x + xx, gy - hh, 1, hh, mix('#9CC8A8', '#5A6A7A', storm)); }
    const fx = x + 252, fy = gy - 34;
    rect(g, fx, fy, 1, 34 - 14, '#E8EEFF'); rect(g, fx - 2, fy - 1, 5, 2, '#E8EEFF');
    for (let k = 0; k < 3; k++) { const a = s.rot * 0.9 + 1 + k * 2.094; pline(g, fx, fy, fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, '#F4F8FF'); }
    rect(g, x, gy, w, 18, mix('#66D66A', '#3A6A4A', storm)); rect(g, x, gy, w, 2, mix('#B6F35B', '#5A8A5A', storm));
    // hierba que se inclina con el viento
    const lean = clamp(s.v / 14, 0, 2);
    for (let i = 0; i < 46; i++) { const hx = x + (i * 29) % w, hh = 2 + (i % 3), sw = Math.sin(t * (2 + s.v * 0.3) + i) * 0.5; pline(g, hx, gy + 2, hx + lean * 1.5 + sw, gy + 2 - hh, mix('#8ADA6A', '#4A7A4A', storm)); }
    // rachas de viento (más rápidas y numerosas con más viento)
    const n = 6 + Math.round(s.v / 2);
    for (let i = 0; i < n; i++) {
      const sx = x + ((i * 53 + t * s.v * 9) % (w + 40)) - 20, sy = y + 10 + (i * 37) % (h - 34);
      g.globalAlpha = 0.35 + storm * 0.3; rect(g, sx, sy, 6 + s.v * 0.6, 1, '#FFFFFF'); g.globalAlpha = 1;
    }
    if (storm > 0.5) for (let i = 0; i < 14; i++) { const rx = x + (i * 23 + t * 140) % w, ry = y + (i * 41 + t * 260) % (h - 18); pline(g, rx, ry, rx - 2, ry + 5, '#9FB8E0'); }
    if (storm > 0.8 && Math.floor(t * 3) % 7 === 0) { g.globalAlpha = 0.25; rect(g, x, y, w, h, '#FFFFFF'); g.globalAlpha = 1; }
    // torre, góndola y rotor
    const tx = x + 170, hubY = y + 38;
    for (let yy = hubY; yy < y + h - 18; yy++) { const ww = 2 + Math.floor((yy - hubY) / 22); rect(g, tx - ww, yy, ww * 2 + 1, 1, '#E8EEFF'); px(g, tx + ww, yy, '#A8B0D0'); }
    rect(g, tx - 7, hubY - 4, 15, 8, '#C9D2F0'); rect(g, tx - 7, hubY + 3, 15, 1, '#8A93B8');
    const fat = Math.max(0, Math.cos(s.pitch * Math.PI / 180));
    for (let k = 0; k < 3; k++) {
      const a = s.rot + k * 2.094, ex = tx + Math.cos(a) * 34, ey = hubY + Math.sin(a) * 34;
      pline(g, tx, hubY, ex, ey, '#FFFFFF');
      if (fat > 0.3) pline(g, tx + Math.cos(a + 0.08) * 6, hubY + Math.sin(a + 0.08) * 6, ex + Math.cos(a + 1.6) * 2 * fat, ey + Math.sin(a + 1.6) * 2 * fat, '#C9D2F0');
      if (fat > 0.7) pline(g, tx + Math.cos(a + 0.12) * 8, hubY + Math.sin(a + 0.12) * 8, ex + Math.cos(a + 1.6) * 3 * fat, ey + Math.sin(a + 1.6) * 3 * fat, '#A8B0D0');
    }
    pcircle(g, tx, hubY, 3, '#FFFFFF'); px(g, tx, hubY, '#8A93B8');
    if (s.braked > 0) simLabel(g, 'FRENO', tx, hubY + 10, PAL.coral, 'center');
    // brújula: viento (azul) y rotor (naranja) vistos desde arriba
    const cx0 = x + 46, cy0 = y + 40;
    pcircle(g, cx0, cy0, 21, 'rgba(16,22,43,0.55)'); pring(g, cx0, cy0, 21, '#C9D2F0');
    const arr = (deg, len, col) => { const a = (deg - 90) * Math.PI / 180; pline(g, cx0, cy0, cx0 + Math.cos(a) * len, cy0 + Math.sin(a) * len, col); pcircle(g, cx0 + Math.cos(a) * len, cy0 + Math.sin(a) * len, 1, col); };
    arr(s.dir, 18, PAL.sky); arr(s.yaw, 14, PAL.orange);
    simLabel(g, 'vista de arriba', cx0, cy0 + 24, '#E8EEFF', 'center');
    const dev = Math.round(Math.abs(s.yaw - s.dir));
    simLabel(g, 'desvío: ' + dev + '°', cx0, y + 6, dev <= 12 ? PAL.lime : PAL.sun, 'center');
    simLabel(g, 'P crece con v³', x + w - 6, y + 6, PAL.white, 'right');
    if (s.v > 25) simLabel(g, 'SI viento > 25 → bandera', x + w - 6, y + 18, s.pitch >= 80 ? PAL.lime : PAL.coral, 'right');
  }
};

// ---------------------------------------------------------------------
//  HYDRIA · PRESA (funciones con parámetros, energía hidráulica)
//  potencia(caudal, altura) = 9,8 × Q × H × 0,9  (kW, con Q en m³/s y H en m)
// ---------------------------------------------------------------------
const SIM_HIDRO = {
  title: 'Presa de pruebas', short: 'Presa', region: 'hydria', color: PAL.sky,
  blurb: 'La función potencia(caudal, altura): cambia sus dos parámetros sin vaciar el embalse ni inundar el pueblo.',
  tags: ['FUNCIONES', 'HIDRO'], concepts: ['functions', 'hydro'], codex: 'hidro', xp: 40,
  init: () => ({ gate: 0, dam: 20, lvl: 0.8, inflow: 6, Q: 0, H: 16, P: 0, flood: false, spill: 0, rot: 0, warned: false }),
  controls: [
    { id: 'gate', label: 'compuerta', min: 0, max: 100, step: 1, unit: '%', speed: 40, color: PAL.sky, get: s => s.gate, set: (s, v) => { s.gate = v; } },
    { id: 'dam', label: 'altura presa', min: 10, max: 60, step: 1, unit: ' m', speed: 20, color: '#C9D2F0', get: s => s.dam, set: (s, v) => { s.dam = v; } }
  ],
  step(s, dt, sim) {
    s.Q = 12 * s.gate / 100;
    if (s.lvl <= 0.02) s.Q = Math.min(s.Q, s.inflow); // embalse vacío: solo pasa lo que trae el río
    s.lvl = clamp(s.lvl + (s.inflow - s.Q) * 0.6 / s.dam * dt, 0, 1);
    s.spill = s.lvl >= 1 && s.inflow > s.Q ? s.inflow - s.Q : 0;
    s.H = s.dam * s.lvl;
    s.P = 9.8 * s.Q * s.H * 0.9;
    s.flood = s.dam > 45 && s.H > 45;
    s.rot += s.Q * dt * 1.2;
    if (s.flood && !s.warned) { s.warned = true; AudioSys.sfx('fail'); sim.say('¡El agua inunda el pueblo! Con más de 45 m de altura el embalse llega a las casas.', PAL.coral); }
    if (!s.flood) s.warned = false;
  },
  vars: [
    { name: 'caudal', get: s => s.Q, max: 12, unit: 'm³/s', color: PAL.sky, fmt: f1 },
    { name: 'altura', get: s => s.H, max: 60, unit: 'm', color: '#C9D2F0' },
    { name: 'nivel', get: s => s.lvl * 100, max: 100, unit: '%', color: PAL.teal },
    { name: 'potencia', get: s => s.P, max: 2500, unit: 'kW', color: PAL.sun }
  ],
  chart: { label: 'potencia (kW)', get: s => s.P, min: 0, max: 2500, target: (s, sim) => [500, 1500, 700][sim.mi], color: PAL.sun },
  missions: [
    { text: 'Abre la compuerta: más caudal hacia la turbina. Produce ≥ 500 kW.', check: s => s.P >= 500, hold: 0.5, ok: 'Más caudal (agua por segundo) → más potencia.' },
    { text: 'potencia(caudal, altura) tiene DOS parámetros. Sube también la presa: ≥ 1500 kW sin inundar el pueblo (presa ≤ 45 m).', check: s => s.P >= 1500 && !s.flood && s.dam <= 45, hold: 0.8, ok: 'Más altura → más potencia: la función usa los dos parámetros.' },
    { text: 'Sequía: el río trae solo 3 m³/s. Produce ≥ 700 kW 4 s dejando salir como mucho lo que entra (caudal ≤ 3).', start: s => { s.inflow = 3; }, check: s => s.P >= 700 && s.Q <= s.inflow + 0.05 && !s.flood, hold: 4, ok: 'Sostenible: si sale lo mismo que entra, el embalse no se vacía.' }
  ],
  final: 'potencia(caudal, altura) es una FUNCIÓN: recibe dos PARÁMETROS y devuelve 9,8 × caudal × altura × 0,9 (kW). Si cambias un parámetro, cambia el resultado.',
  hints: ['La compuerta decide el caudal: cuánta agua pasa por la turbina cada segundo.', 'Subir la presa sube el nivel del agua (altura). Pero por encima de 45 m inunda el pueblo.', 'En la sequía, con la compuerta al 25 % sale lo mismo que entra: 3 m³/s.'],
  view(g, x, y, w, h, s, t) {
    simSky(g, x, y, w, h, '#7FC8FF', '#D8F2FF');
    // montañas
    for (let i = 0; i < 5; i++) { const mx = x + i * 70 - 20; for (let k = 0; k < 40; k++) rect(g, mx + k, y + 40 - k * 0.6 + 40, 80 - k * 2, 1, '#8AB0C8'); }
    const base = y + h - 12, k = 1.5, damX = x + 168;
    rect(g, x, base, w, 12, '#7A5A3A'); rect(g, x, base, w, 2, '#9A7A5A');
    // ladera y pueblo a 45 m de altura
    const vy = base - 45 * k;
    for (let yy = vy + 8; yy < base; yy++) rect(g, x, yy, 24 + (yy - vy) * 0.9, 1, '#6A9A4A');
    rect(g, x, vy + 8, 34, 2, '#8ACA5A');
    for (let i = 0; i < 3; i++) { const hx = x + 4 + i * 10; rect(g, hx, vy, 8, 8, '#E8D8C0'); rect(g, hx - 1, vy - 2, 10, 2, '#C8503A'); rect(g, hx + 3, vy + 4, 2, 4, '#6A4A2A'); }
    // embalse
    const wy = base - s.H * k;
    rect(g, x + 20, wy, damX - x - 20, base - wy, '#2A7ACC');
    rect(g, x + 20, wy, damX - x - 20, 1, '#9FE8FF');
    for (let i = 0; i < 8; i++) px(g, x + 30 + ((i * 17 + t * 12) % (damX - x - 40)), wy + 2 + (i % 3) * 3, '#59C7FF');
    if (s.flood) { g.globalAlpha = 0.7; rect(g, x, wy, 40, vy + 10 - wy, '#2A7ACC'); g.globalAlpha = 1; simLabel(g, '¡PUEBLO INUNDADO!', x + 4, vy - 14, PAL.coral); }
    // río que llega
    rect(g, x, base - 3, 22, 3, '#59C7FF');
    // presa
    const dy = base - s.dam * k;
    for (let yy = dy; yy < base; yy++) { const ww = 6 + (yy - dy) * 0.12; rect(g, damX, yy, ww, 1, '#B8B8C8'); px(g, damX, yy, '#E8E8F0'); }
    simLabel(g, s.dam + ' m', damX + 4, dy - 10, PAL.white);
    // aliviadero
    if (s.spill > 0) for (let i = 0; i < 6; i++) { const fy = dy + ((t * 60 + i * 9) % (base - dy)); rect(g, damX + 8 + i % 2, fy, 2, 3, '#9FE8FF'); }
    // ladera con pinos y torre eléctrica que sale de la central
    for (let xx = 190; xx < w; xx++) { const top = Math.max(y + 70 + Math.sin(xx * 0.04) * 5 - (xx - 196) * 0.08, base - (xx - 190) * 1.6); rect(g, x + xx, top, 1, base - top, xx % 7 ? '#7AB06A' : '#6AA05A'); }
    for (let i = 0; i < 6; i++) { const tx0 = x + 210 + i * 14 + (i % 2) * 5, ty0 = y + 64 + (i % 3) * 4; for (let k = 0; k < 7; k++) rect(g, tx0 - Math.floor(k / 2), ty0 + k, 1 + Math.floor(k / 2) * 2, 1, k % 2 ? '#2F7A4A' : '#3F9A5A'); rect(g, tx0, ty0 + 7, 1, 2, '#6B4A2A'); }
    const pyx = x + w - 22, pyy = base - 44;
    pline(g, pyx, pyy, pyx - 5, base, '#565E8C'); pline(g, pyx, pyy, pyx + 5, base, '#565E8C'); rect(g, pyx - 7, pyy + 4, 15, 1, '#565E8C'); rect(g, pyx - 5, pyy + 10, 11, 1, '#565E8C');
    pline(g, damX + 60, base - 18, pyx - 7, pyy + 4, s.P > 50 ? PAL.sun : '#3A4068');
    // tubería forzada y turbina
    const ty = base - 8, tx = damX + 44;
    if (s.Q > 0.1) for (let i = 0; i < 4; i++) { const k = (t * (0.5 + s.Q * 0.12) + i / 4) % 1; px(g, damX - 2 + (tx - damX + 2) * k, base - 6 + (ty - base + 6) * k - 1, '#9FE8FF'); }
    pline(g, damX - 2, base - 6, tx, ty, '#3A4068'); pline(g, damX - 2, base - 5, tx, ty + 1, '#3A4068');
    rect(g, tx - 8, ty - 14, 26, 16, '#C9D2F0'); rect(g, tx - 8, ty - 14, 26, 2, '#8A93B8');
    for (let i = 0; i < 4; i++) { const a = s.rot + i * 1.57; pline(g, tx + 5, ty - 6, tx + 5 + Math.cos(a) * 5, ty - 6 + Math.sin(a) * 5, '#2A4A9A'); }
    // agua que sale
    rect(g, tx + 18, base - 3, w, 3, s.Q > 0.1 ? '#59C7FF' : '#7A5A3A');
    for (let i = 0; i < Math.round(s.Q); i++) px(g, tx + 20 + ((i * 13 + t * 40) % 80), base - 2, '#FFFFFF');
    // la función en vivo
    rect(g, x + 4, y + 3, 200, 12, 'rgba(16,22,43,0.75)');
    drawText(g, 'potencia(' + (Math.round(s.Q * 10) / 10).toFixed(1) + ', ' + Math.round(s.H) + ') ≈ ' + Math.round(s.P) + ' kW', x + 8, y + 5, PAL.lime);
    simLabel(g, 'río: ' + f1(s.inflow) + ' m³/s', x + 4, base - 16, PAL.white);
  }
};

// ---------------------------------------------------------------------
//  BIOLOOP · BIODIGESTOR (listas: la cola de residuos, energía de biomasa)
//  Las bacterias sacan residuos del principio de la lista a su ritmo
//  (máximo a 37 °C). Si entran más de los que salen, la lista crece y el
//  pH baja: el digestor se «empacha» (acidifica) y se para.
// ---------------------------------------------------------------------
const bioCap = s => 60 * Math.exp(-Math.pow((s.T - 37) / 7, 2)) * (s.pH < 6.6 ? 0.3 : 1);
const BIO_ITEMS = [['#C8503A', '#FFD84A'], ['#66D66A', '#B6F35B'], ['#C88A2A', '#E8C8A0'], ['#9A5ACC', '#C9B2FF']];
const SIM_BIOGAS = {
  title: 'Biodigestor de pruebas', short: 'Biodigestor', region: 'bioloop', color: PAL.lime,
  blurb: 'Una LISTA de residuos que las bacterias vacían a su ritmo: más carga, más biogás... hasta que se empacha.',
  tags: ['LISTAS', 'BIOMASA'], concepts: ['arrays', 'biomass'], codex: 'biomasa', xp: 40,
  init: () => ({ load: 0, heat: 37, T: 37, q: 0, pH: 7.2, gas: 0, acidMsg: false, bub: 0 }),
  controls: [
    { id: 'load', label: 'carga residuos', min: 0, max: 100, step: 1, unit: ' kg/h', speed: 40, color: PAL.lime, get: s => s.load, set: (s, v) => { s.load = v; } },
    { id: 'heat', label: 'calefacción', min: 15, max: 55, step: 1, unit: ' °C', speed: 16, color: PAL.coral, get: s => s.heat, set: (s, v) => { s.heat = v; } }
  ],
  step(s, dt, sim) {
    s.T = approach(s.T, s.heat, dt * 4);
    const cap = bioCap(s);
    // la cola (lista) crece si entra más de lo que las bacterias pueden comer
    s.q = Math.max(0, s.q + (s.load - cap) * dt * 0.08);
    const eaten = s.q > 0.01 ? cap : Math.min(s.load, cap);
    s.gas = approach(s.gas, eaten * 0.05, dt * 1.5);
    s.pH = approach(s.pH, clamp(7.2 - Math.max(0, s.q - 6) * 0.1, 5.8, 7.2), dt * 0.25);
    s.bub += s.gas * dt;
    if (s.pH < 6.6 && !s.acidMsg) { s.acidMsg = true; AudioSys.sfx('fail'); sim.say('¡ÁCIDO! La lista creció demasiado y las bacterias se paran. Baja la carga para que se recuperen.', PAL.coral); }
    if (s.pH > 6.9) s.acidMsg = false;
  },
  vars: [
    { name: 'carga', get: s => s.load, max: 100, unit: 'kg/h', color: PAL.lime },
    { name: 'temperatura', get: s => s.T, max: 60, unit: '°C', color: PAL.coral },
    { name: 'pH', get: s => s.pH, max: 8, unit: '', color: PAL.sky, fmt: f1 },
    { name: 'biogas', get: s => s.gas, max: 3.5, unit: 'm³/h', color: PAL.sun, fmt: f1 }
  ],
  chart: { label: 'biogás (m³/h)', get: s => s.gas, min: 0, max: 3.5, target: (s, sim) => [1, 2, 2.6][sim.mi], color: PAL.sun },
  missions: [
    { text: 'Echa residuos con «carga»: las bacterias los convierten en biogás. Consigue ≥ 1,0 m³/h.', check: s => s.gas >= 1, hold: 0.5, ok: 'Cada residuo entra al final de la lista y las bacterias toman el primero.' },
    { text: 'Invierno: el digestor se enfría a 20 °C y las bacterias se duermen. Sube la calefacción y la carga: ≥ 2,0 m³/h.', start: s => { s.heat = 20; }, check: s => s.gas >= 2, hold: 0.5, ok: 'A 37 °C las bacterias trabajan al máximo.' },
    { text: 'Máximo sin empacho: ≥ 2,6 m³/h durante 4 s con el pH ≥ 6,9 (que la lista no crezca).', check: s => s.gas >= 2.6 && s.pH >= 6.9, hold: 4, ok: 'Equilibrio: entran tantos residuos como las bacterias pueden comer.' }
  ],
  final: 'Los residuos esperan en una LISTA (cola): las bacterias toman el primero, lo vuelven biogás y pasan al siguiente. Si la lista crece más rápido de lo que se vacía, el digestor se acidifica.',
  hints: ['La carga es cuántos residuos entran por hora. Empieza por 20 o 30 kg/h.', 'Las bacterias trabajan mejor a 37 °C: lleva la calefacción ahí.', 'A 37 °C las bacterias comen unos 60 kg/h: con más carga la lista crece y el pH baja.'],
  view(g, x, y, w, h, s, t) {
    simSky(g, x, y, w, h, '#9FD8FF', '#E8F8D0');
    const base = y + h - 14;
    // campo arado, granero y valla al fondo
    for (let xx = 0; xx < w; xx++) { const hh = 22 + Math.sin(xx * 0.02 + 1) * 4; rect(g, x + xx, base - hh, 1, hh, '#8ACA6A'); }
    for (let k = 0; k < 4; k++) rect(g, x, base - 18 + k * 4, w, 1, '#6AAA4A');
    const bx0 = x + w - 70, by0 = base - 38;
    rect(g, bx0, by0 + 8, 26, 22, '#C8503A'); for (let k = 0; k < 8; k++) rect(g, bx0 - 2 + k, by0 + 8 - k, 30 - k * 2, 1, '#8A2E2A');
    rect(g, bx0 + 9, by0 + 18, 8, 12, '#F0E0C8'); pline(g, bx0 + 9, by0 + 18, bx0 + 16, by0 + 29, '#C8503A'); pline(g, bx0 + 16, by0 + 18, bx0 + 9, by0 + 29, '#C8503A');
    for (let fx = x + 140; fx < x + w - 76; fx += 8) { rect(g, fx, base - 8, 1, 8, '#C8A070'); } rect(g, x + 140, base - 6, w - 216, 1, '#B08A5A');
    rect(g, x, base, w, 14, '#7A5A3A'); rect(g, x, base, w, 2, '#5A9A3A');
    // la lista (cola de residuos) sobre una cinta
    const n = Math.min(12, Math.floor(s.q)), lx = x + 8, ly = y + 30;
    rect(g, lx - 2, ly + 10, 132, 3, '#3A4068');
    drawText(g, 'cola (lista de residuos):', lx - 2, ly - 12, '#10162B');
    for (let i = 0; i < n; i++) {
      const ix = lx + i * 11, c = BIO_ITEMS[i % BIO_ITEMS.length];
      pcircle(g, ix + 4, ly + 5, 4, c[0]); px(g, ix + 3, ly + 3, c[1]);
      drawText(g, String(i), ix + 4, ly + 15, '#565E8C', { align: 'center' });
    }
    if (!n) drawText(g, '[ ] vacía', lx + 2, ly + 2, '#565E8C');
    simLabel(g, 'cola.length = ' + Math.floor(s.q), lx, ly + 26, s.q > 6 ? PAL.coral : PAL.white);
    if (s.q > 12) simLabel(g, '+' + Math.floor(s.q - 12), lx + 136, ly + 2, PAL.coral);
    // digestor (cúpula) con bacterias
    const dx = x + 190, dy = base - 20;
    pellipse(g, dx, dy, 44, 30, '#3A4068'); pellipse(g, dx, dy, 42, 28, '#2A3050');
    // corte: lodo con bacterias abajo y gas arriba
    const sludge = s.pH < 6.6 ? '#9A8A3A' : '#5A8A3A';
    for (let yy = -2; yy <= 28; yy++) { const ww = Math.round(42 * Math.sqrt(Math.max(0, 1 - (yy * yy) / (28.5 * 28.5)))); rect(g, dx - ww, dy + yy, ww * 2 + 1, 1, yy < 1 ? shade(sludge, 0.2) : sludge); }
    for (let yy = -27; yy < -2; yy++) { const ww = Math.round(42 * Math.sqrt(Math.max(0, 1 - (yy * yy) / (28.5 * 28.5)))); g.globalAlpha = 0.25 + s.gas * 0.12; rect(g, dx - ww, dy + yy, ww * 2 + 1, 1, '#E8C8A0'); g.globalAlpha = 1; }
    const bact = Math.round(bioCap(s) / 5);
    for (let i = 0; i < bact; i++) { const a = t * 2 + i * 1.7, r = 8 + (i * 7) % 22; px(g, dx + Math.cos(a) * r, dy - 6 + Math.sin(a * 1.3) * 10, '#B6F35B'); }
    // tubo de entrada desde la cinta
    pline(g, lx + 132, ly + 11, dx - 40, dy - 6, '#3A4068');
    rect(g, x, base, w, 14, '#7A5A3A'); rect(g, x, base, w, 2, '#5A9A3A');
    // gasómetro (globo) que crece con el biogás
    const gx = dx + 4, gy = y + 22, gr = 6 + Math.round(s.gas * 4);
    pline(g, dx, dy - 28, gx, gy + gr, '#3A4068');
    pcircle(g, gx, gy, gr + 1, '#3A4068'); pcircle(g, gx, gy, gr, '#E8C8A0'); pcircle(g, gx - 2, gy - 2, Math.max(1, gr - 4), '#FFF3D7');
    for (let i = 0; i < 4; i++) { const by = dy - 4 - ((t * 20 * (0.3 + s.gas) + i * 7) % 24); px(g, dx - 10 + i * 6, by, '#FFFFFF'); }
    // termómetro y llama de la cocina
    const thx = x + w - 14, thy = y + 16;
    rect(g, thx, thy, 4, 60, '#10162B'); rect(g, thx + 1, thy + 1 + 58 - Math.round(58 * clamp(s.T / 60, 0, 1)), 2, Math.round(58 * clamp(s.T / 60, 0, 1)), PAL.coral);
    for (const k of [37]) { const ty = thy + 59 - Math.round(58 * k / 60); rect(g, thx - 4, ty, 3, 1, PAL.lime); }
    simLabel(g, Math.round(s.T) + '°', thx + 2, thy + 64, PAL.white, 'center');
    const fl = s.gas * 3;
    if (fl > 0.3) { pcircle(g, x + w - 44, base - 8 - fl, Math.round(fl), '#59C7FF'); px(g, x + w - 44, base - 9 - fl, '#FFFFFF'); }
    rect(g, x + w - 52, base - 6, 16, 4, '#3A4068');
    simLabel(g, s.pH < 6.6 ? '¡EMPACHO! pH ' + f1(s.pH) : 'pH ' + f1(s.pH), dx, dy + 6, s.pH < 6.8 ? PAL.coral : PAL.white, 'center');
  }
};

// ---------------------------------------------------------------------
//  GEA · POZO GEOTÉRMICO (máquina de estados, geotermia)
//  Extraer vapor da energía, pero baja la presión si no se reinyecta el
//  agua; reinyectar demasiada enfría el yacimiento. Estados visibles.
// ---------------------------------------------------------------------
const GEO_STATES = ['REPOSO', 'PRODUCIENDO', 'PRESIÓN BAJA', 'ENFRIANDO'];
const SIM_GEO = {
  title: 'Pozo geotérmico', short: 'Pozo geotérmico', region: 'gea', color: PAL.coral,
  blurb: 'Una máquina de estados: produce vapor sin quedarte sin presión ni enfriar de más el yacimiento.',
  tags: ['ESTADOS', 'GEOTERMIA'], concepts: ['states', 'geothermal'], codex: 'geotermia', xp: 40,
  init: () => ({ ext: 0, inj: 0, pr: 100, T: 230, P: 0, state: 'REPOSO', last: 'REPOSO', flash: 0 }),
  controls: [
    { id: 'ext', label: 'extracción', min: 0, max: 100, step: 1, unit: ' t/h', speed: 40, color: PAL.coral, get: s => s.ext, set: (s, v) => { s.ext = v; } },
    { id: 'inj', label: 'reinyección', min: 0, max: 100, step: 1, unit: '%', speed: 40, color: PAL.sky, get: s => s.inj, set: (s, v) => { s.inj = v; } }
  ],
  step(s, dt) {
    s.pr = clamp(s.pr + (-s.ext * (1 - s.inj / 100) * 0.06 + (s.pr < 100 ? 2 : 0)) * dt, 0, 100);
    s.T += (-s.ext * s.inj / 100 * 0.03 + (230 - s.T) * 0.05) * dt;
    s.P = s.ext * Math.max(0, s.T - 100) * 0.15 * s.pr / 100;
    s.state = s.ext < 5 ? 'REPOSO' : s.pr < 80 ? 'PRESIÓN BAJA' : s.T < 205 ? 'ENFRIANDO' : 'PRODUCIENDO';
    if (s.state !== s.last) { s.last = s.state; s.flash = 1; AudioSys.sfx(s.state === 'PRODUCIENDO' ? 'ok' : s.state === 'REPOSO' ? 'click' : 'warn'); }
    s.flash = Math.max(0, s.flash - dt * 2);
  },
  vars: [
    { name: 'presion', get: s => s.pr, max: 100, unit: '%', color: PAL.sky },
    { name: 'temperatura', get: s => s.T, max: 250, unit: '°C', color: PAL.coral },
    { name: 'potencia', get: s => s.P, max: 1500, unit: 'kW', color: PAL.sun },
    { name: 'estado', get: s => GEO_STATES.indexOf(s.state) + 1, max: 4, unit: '', color: PAL.lilac, fmt: v => GEO_STATES[v - 1] || '' }
  ],
  chart: { label: 'potencia (kW)', get: s => s.P, min: 0, max: 1500, target: (s, sim) => [600, 600, 800][sim.mi], color: PAL.sun },
  missions: [
    { text: 'Abre la extracción del pozo (agua a más de 200 °C que se vuelve vapor): pasa de REPOSO a PRODUCIENDO. Consigue ≥ 600 kW.', check: s => s.P >= 600, hold: 0.5, ok: 'extracción > 5 → transición de REPOSO a PRODUCIENDO.' },
    { text: 'Sacaste vapor sin devolver el agua y la presión cayó al 75 % (PRESIÓN BAJA). Reinyecta: presión ≥ 85 % con ≥ 600 kW.', start: s => { s.pr = Math.min(s.pr, 75); }, check: s => s.pr >= 85 && s.P >= 600, hold: 2, ok: 'Devolver el agua al subsuelo mantiene la presión: geotermia renovable.' },
    { text: 'Alguien dejó la reinyección al 100 % toda la noche: el yacimiento se enfrió (ENFRIANDO). Equilibra: ≥ 800 kW, presión ≥ 85 % y temperatura ≥ 205 °C 5 s.', start: s => { s.inj = 100; s.T = 204; s.ext = Math.max(s.ext, 40); }, check: s => s.P >= 800 && s.pr >= 85 && s.T >= 205, hold: 5, ok: 'Ni mucha ni poca: el estado PRODUCIENDO se mantiene en equilibrio.' }
  ],
  final: 'La central es una MÁQUINA DE ESTADOS: según presión y temperatura pasa de PRODUCIENDO a PRESIÓN BAJA o ENFRIANDO, y vuelve al corregirse. Reinyectar el agua la hace renovable.',
  hints: ['Más extracción = más potencia, pero la presión baja si no reinyectas.', 'Con la reinyección al 70 % o más, la presión vuelve a subir poco a poco.', 'Si reinyectas el 100 % el agua fría enfría el yacimiento: baja la reinyección a 60 %.'],
  view(g, x, y, w, h, s, t) {
    const surf = y + 40;
    simSky(g, x, y, w, 40, '#FFB88A', '#FFE0C0');
    // capas del subsuelo y yacimiento (más rojo cuanto más caliente)
    // subsuelo: cuanto más hondo, más caliente (unos 25-30 °C más por kilómetro)
    vGradient(g, x, surf, w, h - 40, [[0, '#8A6A4A'], [0.5, '#7A4A3A'], [1, '#6A2A2A']], false);
    for (let i = 0; i < 6; i++) for (let xx = 0; xx < w; xx += 2) px(g, x + xx, surf + 10 + i * 12 + Math.round(Math.sin(xx * 0.05 + i) * 2), 'rgba(40,20,10,0.35)');
    for (let i = 0; i < 60; i++) px(g, x + (i * 47) % w, surf + 4 + (i * 31) % (h - 46), i % 3 ? 'rgba(255,220,180,0.18)' : 'rgba(30,10,10,0.3)');
    for (let i = 0; i < 3; i++) { rect(g, x + 150, surf + 8 + i * 20, 4, 1, 'rgba(255,230,200,0.6)'); drawText(g, (60 + i * 40) + ' °C', x + 157, surf + 5 + i * 20, 'rgba(255,230,200,0.85)'); }
    const hot = clamp((s.T - 180) / 60, 0, 1), rs = y + h - 30;
    pellipse(g, x + 200, rs + 10, 110, 18, mix('#5A6A9A', '#C8503A', hot));
    for (let i = 0; i < 12; i++) px(g, x + 110 + (i * 23) % 180, rs + 4 + (i * 7) % 14, mix('#9FB8E0', PAL.sun, hot));
    // pozos: producción (rojo) e inyección (azul)
    const p1 = x + 190, p2 = x + 262;
    rect(g, p1 - 2, surf, 4, rs - surf + 4, '#3A2A2A'); rect(g, p1 - 1, surf, 2, rs - surf + 4, s.ext > 4 ? PAL.coral : '#5A3A3A');
    rect(g, p2 - 2, surf, 4, rs - surf + 4, '#2A2A3A'); rect(g, p2 - 1, surf, 2, rs - surf + 4, s.inj > 4 && s.ext > 4 ? PAL.sky : '#3A3A5A');
    for (let i = 0; i < 3; i++) { if (s.ext > 4) px(g, p1, rs - ((t * s.ext + i * 20) % (rs - surf)), '#FFFFFF'); if (s.inj > 4 && s.ext > 4) px(g, p2, surf + ((t * s.inj * 0.8 + i * 20) % (rs - surf)), '#FFFFFF'); }
    // central y torre de refrigeración con vapor
    rect(g, p1 - 22, surf - 16, 30, 16, '#C9D2F0'); rect(g, p1 - 22, surf - 16, 30, 2, '#8A93B8');
    for (let yy = 0; yy < 22; yy++) { const ww = 9 - Math.abs(yy - 11) * 0.3; rect(g, p1 + 18 - ww, surf - yy, ww * 2, 1, '#E8E8F0'); }
    const steam = s.P / 1200;
    for (let i = 0; i < 6; i++) { const ph = (t * 0.6 + i / 6) % 1; if (steam > 0.05) { g.globalAlpha = (1 - ph) * Math.min(1, steam); pcircle(g, p1 + 18 + Math.sin(ph * 6 + i) * 4, surf - 24 - ph * 20, 3 + ph * 4, '#FFFFFF'); g.globalAlpha = 1; } }
    // manómetro
    pcircle(g, p2, surf - 10, 8, '#10162B'); pcircle(g, p2, surf - 10, 7, '#FFFFFF');
    const a = Math.PI * (0.75 + 1.5 * s.pr / 100); pline(g, p2, surf - 10, p2 + Math.cos(a) * 6, surf - 10 + Math.sin(a) * 6, PAL.coral);
    // máquina de estados
    // máquina de estados: el estado actual se ilumina y cada flecha dice su condición
    const sx0 = x + 6, sy0 = y + 6;
    rect(g, sx0 - 3, sy0 - 3, 146, 74, 'rgba(16,22,43,0.78)');
    const box = (i, bx, by) => { const on = GEO_STATES[i] === s.state, col = i === 1 ? PAL.lime : i === 0 ? '#C9D2F0' : PAL.coral; rect(g, bx, by, 66, 11, on ? col : '#1A2248'); if (on && s.flash > 0) strokeRect(g, bx - 1, by - 1, 68, 13, '#FFFFFF'); drawText(g, GEO_STATES[i], bx + 33, by + 2, on ? '#10162B' : col, { align: 'center' }); };
    box(0, sx0 + 36, sy0); box(1, sx0 + 36, sy0 + 24); box(2, sx0, sy0 + 54); box(3, sx0 + 74, sy0 + 54);
    drawText(g, '↕', sx0 + 66, sy0 + 13, '#C9D2F0'); drawText(g, 'extracción > 5', sx0 + 74, sy0 + 14, '#8C93B8');
    drawText(g, '↙ presión < 80', sx0 + 2, sy0 + 40, '#8C93B8'); drawText(g, 'temp < 205 ↘', sx0 + 139, sy0 + 40, '#8C93B8', { align: 'right' });
  }
};

// ---------------------------------------------------------------------
//  H2 · CADENA DEL HIDRÓGENO (pipeline, hidrógeno verde y almacenamiento)
//  sol → electrolizador (70 %) → compresor (90 %) → tanque → pila (55 %) → ciudad
// ---------------------------------------------------------------------
const SIM_H2 = {
  title: 'Cadena del hidrógeno', short: 'Hidrógeno', region: 'h2', color: PAL.mint,
  blurb: 'Un PIPELINE de energía: guarda el sol del día en hidrógeno y devuélvelo de noche sin apagones.',
  tags: ['PIPELINE', 'HIDRÓGENO'], concepts: ['sequence', 'hydrogen', 'storage'], codex: 'pipeline', xp: 40,
  init: () => ({ elec: 0, cell: 0, tank: 10, sun: 120, dem: 40, bal: 0, night: false, black: false, msg: false }),
  controls: [
    { id: 'elec', label: 'electrolizador', min: 0, max: 100, step: 1, unit: ' kW', speed: 40, color: PAL.mint, get: s => s.elec, set: (s, v) => { s.elec = v; } },
    { id: 'cell', label: 'pila H2', min: 0, max: 60, step: 1, unit: ' kW', speed: 24, color: PAL.sun, get: s => s.cell, set: (s, v) => { s.cell = v; } }
  ],
  step(s, dt, sim) {
    const fromTank = s.tank > 0.5 ? s.cell : 0;
    s.bal = s.sun + fromTank - s.dem - s.elec;
    s.tank = clamp(s.tank + (s.elec * 0.7 * 0.9 - fromTank / 0.55) * 0.15 * dt, 0, 100);
    s.black = s.bal < 0;
    if (s.black && !s.msg) { s.msg = true; AudioSys.sfx('fail'); sim.say('¡APAGÓN! La ciudad necesita ' + s.dem + ' kW y le falta energía: revisa el electrolizador y la pila.', PAL.coral); }
    if (!s.black) s.msg = false;
  },
  vars: [
    { name: 'sol', get: s => s.sun, max: 120, unit: 'kW', color: PAL.sun },
    { name: 'demanda', get: s => s.dem, max: 60, unit: 'kW', color: PAL.coral },
    { name: 'tanque H2', get: s => s.tank, max: 100, unit: '%', color: PAL.mint },
    { name: 'balance', get: s => s.bal, max: 100, unit: 'kW', color: PAL.lime, fmt: v => (v > 0 ? '+' : '') + Math.round(v) }
  ],
  chart: { label: 'tanque H2 (%)', get: s => s.tank, min: 0, max: 100, target: (s, sim) => [80, null, null][sim.mi], color: PAL.mint },
  missions: [
    { text: 'Mediodía: sobran 80 kW de sol. Mándalos al electrolizador (sin apagón) y llena el tanque hasta el 80 %.', check: s => s.tank >= 80 && s.bal >= 0, hold: 0.3, ok: 'Etapas 1-3 del pipeline: sol → electrolizador → compresor → tanque.' },
    { text: 'Noche: no hay sol y la ciudad pide 30 kW. Apaga el electrolizador y usa la pila: ciudad con luz 4 s.', start: s => { s.sun = 0; s.dem = 30; s.night = true; }, check: s => s.bal >= 0 && s.cell >= 30, hold: 4, ok: 'Etapas 4-5: tanque → pila de combustible → ciudad.' },
    { text: 'Madrugada: la ciudad solo pide 20 kW. Mantén la luz 5 s gastando lo justo (pila ≤ 25 kW).', start: s => { s.dem = 20; }, check: s => s.bal >= 0 && s.cell <= 25, hold: 5, ok: 'Dar solo lo que se pide ahorra hidrógeno.' }
  ],
  final: 'El hidrógeno es un PIPELINE: cada etapa recibe lo que sale de la anterior y pierde una parte (70 % × 90 % × 55 %). De 100 kWh de sol vuelven unos 35, pero sirven de noche.',
  hints: ['Sobran 80 kW: pon el electrolizador en 80 o menos para no dejar a la ciudad sin luz.', 'De noche el electrolizador debe estar en 0 y la pila en 30 kW o más.', 'Ajusta la pila entre 20 y 25 kW.'],
  view(g, x, y, w, h, s, t) {
    simSky(g, x, y, w, h, s.night ? '#1B2A5A' : '#7FC8FF', s.night ? '#3A4A8A' : '#E8F6FF');
    const base = y + h - 12;
    rect(g, x, base, w, 12, '#5A6A8A');
    if (!s.night) { pcircle(g, x + 20, y + 20, 9, PAL.sun); pcircle(g, x + 18, y + 18, 4, '#FFF3A0'); }
    else { pcircle(g, x + 20, y + 20, 7, '#E8EEFF'); pcircle(g, x + 23, y + 18, 6, '#1B2A5A'); for (let i = 0; i < 10; i++) px(g, x + (i * 37) % w, y + (i * 13) % 50, '#FFFFFF'); }
    // etapas del pipeline
    const st = [
      { n: 'SOL', c: PAL.sun, v: Math.min(s.sun, s.elec + s.dem) },
      { n: 'ELECTRO', c: PAL.mint, k: '×0,7', v: s.elec * 0.7 },
      { n: 'COMPR.', c: '#C9D2F0', k: '×0,9', v: s.elec * 0.63 },
      { n: 'TANQUE', c: PAL.sky, v: null },
      { n: 'PILA', c: PAL.orange, k: '×0,55', v: s.tank > 0.5 ? s.cell : 0 },
      { n: 'CIUDAD', c: s.black ? PAL.coral : PAL.lime, v: s.dem }
    ];
    const bw = 44, gap = 5, sx0 = x + 4, sy0 = y + 44;
    const ICO = ['sun', 'drop', 'gear', 'battery', 'bolt', 'home'];
    st.forEach((e, i) => {
      const bx = sx0 + i * (bw + gap);
      // icono de la etapa (con burbujas de hidrógeno en el electrolizador)
      g.globalAlpha = 0.9; pcircle(g, bx + bw / 2, sy0 - 9, 7, 'rgba(16,22,43,0.6)'); g.globalAlpha = 1;
      icon(g, ICO[i], bx + bw / 2 - 4, sy0 - 13);
      if (i === 1 && s.elec > 1) for (let k = 0; k < 3; k++) { const ph = (t * 1.5 + k / 3) % 1; px(g, bx + bw / 2 - 3 + k * 3, sy0 - 14 - ph * 8, '#DFFBFF'); }
      if (i === 2 && s.elec > 1) { const a = t * 6; px(g, bx + bw / 2 + Math.cos(a) * 6, sy0 - 9 + Math.sin(a) * 6, PAL.white); }
      rect(g, bx, sy0, bw, 30, 'rgba(16,22,43,0.8)'); rect(g, bx, sy0, bw, 2, e.c);
      drawText(g, e.n, bx + bw / 2, sy0 + 5, e.c, { align: 'center' });
      if (e.k) drawText(g, e.k, bx + bw / 2, sy0 + 14, '#8C93B8', { align: 'center' });
      if (i === 3) { rect(g, bx + 6, sy0 + 15, bw - 12, 10, '#10162B'); rect(g, bx + 7, sy0 + 16, Math.round((bw - 14) * s.tank / 100), 8, PAL.sky); drawText(g, Math.round(s.tank) + '%', bx + bw / 2, sy0 + 17, PAL.white, { align: 'center' }); }
      else drawText(g, Math.round(e.v) + ' kW', bx + bw / 2, sy0 + 22, PAL.white, { align: 'center' });
      if (i < st.length - 1) { const ax = bx + bw, ay = sy0 + 15, flow = i < 3 ? s.elec > 1 : i === 3 ? s.cell > 1 && s.tank > 0.5 : true; rect(g, ax, ay, gap, 1, flow ? PAL.white : '#565E8C'); if (flow && Math.floor(t * 8 + i) % 2) px(g, ax + 2, ay - 1, PAL.white); }
    });
    drawText(g, 'electrolizador → compresor → tanque → pila de combustible', x + w / 2, sy0 + 34, s.night ? '#C9D2F0' : '#2A3570', { align: 'center' });
    // ciudad: luces encendidas o apagón
    const cx0 = x + 60;
    for (let i = 0; i < 8; i++) {
      const bx = cx0 + i * 26, bh = 14 + (i * 7) % 16;
      rect(g, bx, base - bh, 18, bh, s.night ? '#2A3570' : '#8A93B8');
      for (let k = 0; k < 3; k++) px(g, bx + 4 + k * 5, base - bh + 4, s.black ? '#10162B' : s.night ? PAL.sun : '#C9D2F0');
    }
    if (s.black && Math.floor(t * 4) % 2) simLabel(g, '¡APAGÓN!', x + w / 2, base - 40, PAL.coral, 'center');
    drawText(g, 'De 100 kWh de sol vuelven ≈ 35 (0,7 × 0,9 × 0,55)', x + w - 4, y + 4, s.night ? '#C9D2F0' : '#2A3570', { align: 'right' });
  }
};

Object.assign(SIMS, { SIM_EOLICO, SIM_HIDRO, SIM_BIOGAS, SIM_GEO, SIM_H2 });
SIM_SOLAR.short = 'Panel solar'; SIM_SOLAR.region = 'solaria'; SIM_SOLAR.color = PAL.sun;
SIM_SOLAR.blurb = 'Variables en vivo: orienta el panel hacia el sol y carga la batería.';
// orden del laboratorio (el de las islas)
const SIM_ORDER = ['SIM_SOLAR', 'SIM_EOLICO', 'SIM_HIDRO', 'SIM_BIOGAS', 'SIM_GEO', 'SIM_H2'];
const simDone = k => !!((G.save.sims || {})[k] || (k === 'SIM_SOLAR' && flag('sol_var')));

// primera vez que se completa un simulador: núcleo de forja de recompensa
function simReward(key) {
  G.save.sims = G.save.sims || {};
  if (G.save.sims[key]) return false;
  G.save.sims[key] = true;
  setFlag('sim_' + key);
  G.save.forgeCores = (G.save.forgeCores || 0) + 1;
  Toast.show('◆ +1 núcleo de forja · simulador «' + SIMS[key].short + '» completado', PAL.orange, 4);
  if (SIM_ORDER.every(simDone)) achieve('simulators');
  Save.write();
  return true;
}
function* runSim(key) {
  if (!flag('simIntro')) { setFlag('simIntro'); yield* talk([['pix', 'Un SIMULADOR: aquí se experimenta sin romper nada. Mueve los MANDOS y cumple las MISIONES de la derecha.', 'feliz']]); }
  const r = yield C.scene(done => new SimScene(SIMS[key], done));
  if (r && r.success) simReward(key);
  return r;
}

// ---------- quiosco del simulador en cada isla ----------
PROP_SIZES.simkiosk = [20, 26];
PROP_DRAW.simkiosk = function (g, x, y, e) {
  const def = SIMS[e.cfg.sim] || SIM_SOLAR, col = e.done() ? PAL.lime : def.color, t = e.t;
  // pantalla con una gráfica viva, placa «SIM» y peana
  rect(g, x, y, 20, 14, '#2A3570'); rect(g, x + 1, y + 1, 18, 11, '#0B1020'); rect(g, x + 1, y + 1, 18, 1, '#3E4C8A');
  for (let i = 0; i < 16; i++) px(g, x + 2 + i, y + 6 + Math.round(Math.sin(t * 4 + i * 0.6) * 3), col);
  rect(g, x + 1, y + 14, 18, 10, '#22306B'); rect(g, x + 1, y + 14, 18, 1, '#3E4C8A');
  drawText(g, 'SIM', x + 10, y + 16, col, { align: 'center' });
  rect(g, x - 1, y + 24, 22, 2, '#14183A');
};
PROP_LIGHT.simkiosk = e => ({ x: e.x + 10, y: e.y + 7, r: 40, c: e.done() ? PAL.lime : (SIMS[e.cfg.sim] || SIM_SOLAR).color, a: 0.8 });

// coloca el quiosco hacia el 20 % de la isla, en suelo firme y lejos de otras cosas
function placeSims(lv) {
  const def = lv.def, key = SIM_ORDER.find(k => SIMS[k].region === lv.key && k !== 'SIM_SOLAR');
  if (!key || def.noHud || def.region !== lv.key) return;
  const avoid = [];
  for (const e of lv.entities) if (e instanceof NPC || (e instanceof Terminal && !(e instanceof Prop)) || e instanceof Exit || e instanceof Checkpoint || e instanceof Plate || e instanceof Mover || e instanceof Vent || e instanceof CodeLock || e instanceof Chispa) avoid.push({ x: (e.x + e.w / 2) / TILE, y: (e.y + e.h) / TILE, r: 4 });
  const sp = lv.spawn; avoid.push({ x: sp.x / TILE, y: sp.y / TILE, r: 6 });
  const free = (x, y) => lv.tile(x, y) === '.', solid = (x, y) => lv.tile(x, y) === '#';
  let best = null, bd = 1e9;
  const tx = lv.w * 0.2;
  for (let y = 3; y < lv.h - 1; y++) for (let x = 4; x < lv.w * 0.5; x++) {
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) { if (!solid(x + dx, y + 1)) ok = false; for (let dy = 0; dy < 3 && ok; dy++) if (!free(x + dx, y - dy)) ok = false; }
    if (!ok || avoid.some(a => Math.abs(a.x - x) < a.r && Math.abs(a.y - y - 1) < 4)) continue;
    const d = Math.abs(x - tx) + Math.abs(y - sp.y / TILE) * 0.5;
    if (d < bd) { bd = d; best = { x, y }; }
  }
  if (!best) return;
  const sim = SIMS[key];
  lv.addEntity(makeTerminal(lv, best.x * TILE, best.y * TILE, {
    id: 'sim_' + lv.key, look: 'simkiosk', sim: key, color: sim.color, verb: 'Simulador: ' + sim.short, doneFlag: 'sim_' + key, oy: -2,
    lens: 'SIMULADOR · ' + sim.tags.join(' + '),
    run: () => runSim(key)
  }));
}

// ---------- Taller → LABORATORIO DE SIMULADORES ----------
class SimLabScene {
  constructor() { this.t = 0; this.opaque = false; this.prevNav = UI.nav; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (this.t > 0.2 && (Input.hit('back') || Input.hit('pause'))) { Input.consume(); this.close(); } }
  close() { UI.nav = this.prevNav; Scenes.pop(); }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.9)');
    panel(g, 10, 6, 460, 258, { border: PAL.aqua, accent: PAL.aqua, accentW: 90 });
    const n = SIM_ORDER.filter(simDone).length;
    drawText(g, 'LABORATORIO DE SIMULADORES · ' + n + '/' + SIM_ORDER.length, 240, 12, PAL.aqua, { align: 'center' });
    drawText(g, 'Energía renovable + programación. El primero de cada uno da ◆ 1 núcleo de forja.', 240, 24, '#8C93B8', { align: 'center' });
    SIM_ORDER.forEach((k, i) => {
      const d = SIMS[k], y = 38 + i * 36, R = REGIONS[regionIdx(d.region)], open = unlocked(d.region), done = simDone(k);
      rect(g, 20, y, 440, 32, '#0B1020'); rect(g, 20, y, 3, 32, open ? d.color : '#3A4068');
      drawText(g, (done ? '✓ ' : '') + d.title, 30, y + 4, open ? d.color : '#565E8C');
      drawText(g, (R ? R.name : '') + ' · ' + d.tags.join(' + '), 30, y + 14, '#8C93B8');
      drawText(g, fitText(open ? d.blurb : 'Se abre al llegar a ' + (R ? R.name : 'su isla') + '.', 330), 30, y + 23, open ? '#C9D2F0' : '#565E8C');
      if (UI.btn(g, 'sim' + k, 380, y + 8, 72, 16, done ? 'REPETIR' : '▶ JUGAR', { color: done ? PAL.teal : PAL.lime, primary: open && !done, disabled: !open })) {
        Scenes.push(new SimScene(SIMS[k], r => { if (r && r.success) simReward(k); }));
      }
    });
    if (UI.btn(g, 'simback', W - 82, H - 22, 64, 14, 'VOLVER', { color: PAL.teal })) this.close();
    UI.drawTooltip(g);
  }
}
