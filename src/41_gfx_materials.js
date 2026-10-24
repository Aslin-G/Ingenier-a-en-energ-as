// =====================================================================
//  GRÁFICOS 2.5D (HD-2D) · MATERIALES
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//  · Parámetros de cada isla: colores del suelo, estilo de la cara superior
//    (césped, tablones, baldosas, roca, metal, neón, mármol, cristal), luz
//    del sol o de la luna y corrección de color.
//  · Sombreadores del G-buffer: las caras superiores y laterales de los
//    prismas se texturizan a mano, píxel a píxel, con ruido determinista;
//    la cara frontal es el pixel art original con relieve por Sobel.
// =====================================================================
const D25_TOP = { grass: 0, moss: 0, leafy: 0, planks: 1, tiles: 2, rock: 3, metal: 4, neon: 5, marble: 6, crystalTop: 7 };
// plataformas de un solo sentido: [principal, brillo, sombra, estilo] (como paintPlatform)
const D25_PLAT = {
  wood: ['#B07A4A', '#D8A06A', '#5E3A26', 1], glass: ['#9FE8FF', '#FFFFFF', '#30A8C8', 2], stone: ['#EDE6F5', '#66D6A0', '#8A7AA8', 3],
  leaf: ['#3FA85A', '#B6F35B', '#2A7A4B', 4], crystal: ['#6A4A9A', '#C9B2FF', '#2A1A44', 5], metal: ['#C9D2F0', '#FFFFFF', '#565E8C', 6],
  neon: ['#2A2458', '#FF4FB8', '#30E1C5', 7], prism: ['#FFD84A', '#FFFFFF', '#9B76FF', 8], gold: ['#FFD84A', '#FFF3D7', '#C88A2A', 9]
  // las nubes de Aeris siguen planas: un prisma no parece una nube
};
const D25_FLOWERS = { flower: ['#FF7FCF', '#FFD84A', '#FFFFFF'], sunflower: ['#FFD84A', '#FF9D42', '#FFFFFF'], coral: ['#FF7FCF', '#FF9D42', '#FFFFFF'], fern: ['#B6F35B', '#FF7FCF', '#FFD84A'] };
const c3 = hex => { const c = hexRgb(hex); return [c[0] / 255, c[1] / 255, c[2] / 255]; };
const lum3 = c => c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114;
// color de una luz (hex, rgb(), hsl()...) en 0..1, con memoria
const D25_COLORS = new Map();
function d25Color(s) {
  let c = D25_COLORS.get(s);
  if (c) return c;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)) c = c3(s);
  else {
    const g = d25Color.g || (d25Color.g = makeCanvas(1, 1).g);
    g.clearRect(0, 0, 1, 1); g.fillStyle = '#000'; g.fillStyle = s; g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data; c = [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  if (D25_COLORS.size < 512) D25_COLORS.set(s, c);
  return c;
}

// parámetros de material e iluminación de una isla
function d25Theme(th) {
  const G2 = th.ground, sun = th.sun, plat = D25_PLAT[th.plat] || null;
  const deco = (G2.deco || []).find(d => D25_FLOWERS[d]);
  // dirección hacia el sol (mundo: x a la derecha, y hacia abajo, z hacia el fondo)
  let S = sun ? [(sun.x - 0.5) * 1.3, -(0.62 + (0.5 - Math.min(sun.y, 0.5)) * 0.7), -0.58] : [0.28, -0.86, -0.46];
  const n = Math.hypot(S[0], S[1], S[2]); S = S.map(v => v / n);
  const night = !sun || sun.moon || (th.dark || 0) >= 0.45;
  const sky = c3((th.sky && th.sky[0] && th.sky[0][1]) || '#59C7FF'), sl = Math.max(0.15, lum3(sky));
  const sunCol = sun ? c3(mix('#FFFFFF', sun.glow || sun.c, sun.moon ? 0.35 : 0.18)) : c3('#E8DCFF');
  return {
    top: D25_TOP[G2.top] != null ? D25_TOP[G2.top] : 3, pier: G2.pier ? 1 : 0,
    topC: c3(G2.topC), topHi: c3(G2.topHi), fill: c3(G2.fill), fill2: c3(G2.fill2), edge: c3(G2.edge), pierC: c3(G2.pier || G2.fill),
    wat1: c3(th.water[0]), wat2: c3(th.water[1]), lava: th.hazard === 'magma' ? 1 : 0,
    plat: plat ? [c3(plat[0]), c3(plat[1]), c3(plat[2])] : null, platStyle: plat ? plat[3] : 0,
    flowers: deco ? D25_FLOWERS[deco].map(c3) : null,
    sun: S, sunCol, dif: sun && !sun.moon ? 0.52 : sun ? 0.36 : 0.3, amb: 0.62,
    // ambiente hemisférico: lo que mira al cielo toma un poco de su color
    hemi: sky.map(v => clamp((v / sl - 1) * 0.16, -0.12, 0.12)),
    sunDisc: sun ? [sun.x * W, sun.y * H, sun.r, sun.moon ? 0.25 : 0.55] : [0, 0, 0, 0],
    sat: night ? 1.04 : 1.1, con: night ? 1.06 : 1.05,
    shTint: c3(th.tint || '#0B1030'), hiTint: c3(sun ? (sun.glow || sun.c) : '#FFFFFF'),
    pl: night ? 0.55 : 0.3
  };
}

// --------- sombreadores ---------
const D25_GLSL_HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\n';
const D25_HASH = 'float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }\n';

// vértices del diorama: cámara con desplazamiento de lente (off-axis). El plano
// Z = 0 cae 1:1 sobre los 480×270 de siempre; el punto de fuga queda por encima.
const D25_VS_SCENE = D25_GLSL_HEAD + `
in vec3 aP; in vec2 aT;
uniform vec3 uEye; uniform vec2 uCam; uniform vec2 uZab; uniform vec2 uScr; uniform vec3 uOff;
uniform mat4 uLight; uniform int uShadowPass;
out vec3 vW; out vec2 vUv; flat out vec2 vT;
void main(){
  vec3 p = aP + uOff;
  vW = p; vUv = aT; vT = aT;
  if (uShadowPass == 1) { gl_Position = uLight * vec4(p, 1.0); return; }
  float w = (uEye.z + p.z) / uEye.z;
  vec2 c = (2.0 / uScr) * (p.xy - uEye.xy) + (2.0 * (uEye.xy - uCam) / uScr - 1.0) * w;
  gl_Position = vec4(c.x, -c.y, uZab.x * p.z + uZab.y, w);
}`;

// caras superiores y laterales de los prismas, plataformas y superficie del agua
const D25_FS_FACE = D25_GLSL_HEAD + D25_HASH + `
in vec3 vW; flat in vec2 vT;
uniform int uTop, uPlatStyle;
uniform float uPier, uDz, uTime, uFlowers, uLava;
uniform vec3 uTopC, uTopHi, uFill, uFill2, uEdge, uPierC, uWat1, uWat2, uPl0, uPl1, uPl2, uDeco0, uDeco1, uDeco2;
layout(location = 0) out vec4 oAlb;
layout(location = 1) out vec4 oNrm;
const vec3 YEL = vec3(1.0, 0.847, 0.29), INK = vec3(0.063, 0.086, 0.169);
vec3 rainbow(float i){
  i = mod(i, 8.0);
  return i < 1.0 ? vec3(1.0, 0.42, 0.42) : i < 2.0 ? vec3(1.0, 0.616, 0.259) : i < 3.0 ? YEL : i < 4.0 ? vec3(0.4, 0.839, 0.416)
    : i < 5.0 ? vec3(0.188, 0.882, 0.773) : i < 6.0 ? vec3(0.349, 0.78, 1.0) : i < 7.0 ? vec3(0.608, 0.463, 1.0) : vec3(1.0, 0.498, 0.812);
}
vec3 topSurface(vec3 P, out float emis){
  emis = 0.0;
  vec2 q = floor(vec2(P.x, P.z * 0.5));
  float n = h21(q + 0.37), m = h21(floor(vec2(P.x / 6.0, P.z / 7.0)) + 5.1);
  bool rim = P.z < 1.0;
  vec3 c;
  if (uPier > 0.5 || uTop == 1) {               // tablones (muelle, taller)
    float b = floor(P.x / 4.0);
    c = uTopC * (0.88 + 0.2 * h21(vec2(b, 7.7)));
    if (mod(floor(P.x), 4.0) < 1.0) c = mix(uTopC, uEdge, 0.55);
    if (mod(floor(P.z) + b * 5.0, 13.0) < 1.0) c = mix(uTopC, uEdge, 0.4);
    if (n > 0.94) c *= 0.85;
    if (rim) c = uTopHi;
  } else if (uTop == 0) {                        // césped, musgo, hojas
    c = uTopC * (0.9 + 0.16 * m);
    if (n < 0.1) c = uTopHi; else if (n > 0.9) c = mix(uTopC, uEdge, 0.28);
    float f = h21(q * vec2(1.7, 2.3) + 11.0);
    if (uFlowers > 0.5 && f > 0.986) { float k = h21(q + 3.0); c = k < 0.33 ? uDeco0 : k < 0.66 ? uDeco1 : uDeco2; }
    if (rim) c = uTopHi;
  } else if (uTop == 2) {                        // baldosas solares
    float i = floor(mod(P.x, 16.0) / 4.0) + floor(P.x / 16.0) + floor(P.z / 4.0);
    c = mod(i, 2.0) < 1.0 ? uTopC : YEL;
    if (mod(floor(P.x), 4.0) < 1.0 || mod(floor(P.z), 4.0) < 1.0) c *= 0.8;
    if (rim) c = uTopHi;
  } else if (uTop == 4) {                        // metal con franja de seguridad
    c = uTopC * (0.9 + 0.1 * m);
    if (mod(floor(P.x), 8.0) < 1.0 || mod(floor(P.z), 12.0) < 1.0) c = mix(uTopC, uFill, 0.6);
    if (mod(floor(P.x), 8.0) == 3.0 && mod(floor(P.z), 12.0) == 4.0) c = vec3(1.0);
    if (P.z < 3.0) c = mod(floor(P.x / 4.0), 2.0) < 1.0 ? YEL : INK;
  } else if (uTop == 5) {                        // neón de Ciudad Batería
    c = uFill * 0.75;
    if (mod(floor(P.x), 8.0) < 1.0 || mod(floor(P.z), 8.0) < 1.0) { c = uTopC; emis = 0.7; }
    if (rim) { c = uTopHi; emis = 0.5; }
  } else if (uTop == 6) {                        // mármol del Faro
    c = uTopHi;
    float v = sin(P.x * 0.21 + P.z * 0.6 + sin(P.z * 0.3 + P.x * 0.05) * 2.0);
    if (v > 0.93) c = mix(uTopHi, uEdge, 0.35);
    if (P.z < 2.0) c = uTopC;
  } else if (uTop == 7) {                        // cristal arcoíris de Prisma
    c = mix(rainbow(floor(P.x / 2.0)), vec3(1.0), 0.15 + 0.25 * step(0.9, n));
    if (rim) c = vec3(1.0);
    emis = 0.12;
  } else {                                       // roca
    c = uTopC * (0.82 + 0.3 * h21(floor(vec2(P.x / 2.0, P.z / 3.0))));
    if (n < 0.08 || rim) c = uTopHi;
  }
  return c;
}
vec3 sideSurface(vec3 P, float runTop, out float emis){
  emis = 0.0;
  float n = h21(floor(vec2(P.z * 0.5, P.y)) + 1.7);
  vec3 c = uPier > 0.5 ? uPierC : uFill;
  if (n < 0.14) c = uPier > 0.5 ? uPierC * 1.15 : uFill2;
  if (uPier < 0.5 && fract((P.y + sin(P.z * 0.2) * 1.5) / 11.0) < 0.09) c = mix(c, uEdge, 0.25);   // estratos
  c *= 1.0 - 0.18 * clamp(P.z / uDz, 0.0, 1.0);
  if (P.z < 1.0) c = uEdge;
  // la franja del suelo (césped, tablones...) continúa por el costado
  if (runTop >= 0.0) {
    float d = P.y - runTop;
    if (d < 4.0) { c = uTopC; if (uTop == 5) emis = 0.6; }
    if (d < 1.0) c = uTopHi;
    if ((uTop == 1 || uPier > 0.5) && d >= 5.0 && d < 6.0) c = uEdge;
  }
  return c;
}
vec3 platSurface(vec3 P, bool top, out float emis){
  emis = 0.0;
  if (!top) return P.z < 1.0 ? uPl2 * 0.8 : uPl2;
  vec3 c = uPl0;
  int s = uPlatStyle;
  if (s == 1) { if (mod(floor(P.x), 4.0) < 1.0) c = uPl2; else c *= 0.9 + 0.15 * h21(vec2(floor(P.x / 4.0), 2.0)); }
  else if (s == 2) { c = mix(uPl0, uPl1, 0.2 + 0.5 * step(0.82, fract((P.x + P.z) / 9.0))); }
  else if (s == 3) { if (mod(floor(P.x), 8.0) < 1.0 || mod(floor(P.z), 8.0) < 1.0) c = uPl2; }
  else if (s == 4) { c = uPl0 * (0.85 + 0.25 * h21(floor(vec2(P.x / 2.0, P.z / 2.0)))); }
  else if (s == 5) { if (h21(floor(vec2(P.x / 2.0, P.z / 2.0))) > 0.9) { c = uPl1; emis = 0.3; } }
  else if (s == 6) { if (mod(floor(P.x), 8.0) < 1.0) c = uPl2; }
  else if (s == 7) { if (mod(floor(P.x), 6.0) < 1.0) { c = uPl2; emis = 0.7; } }
  else if (s == 8) { float i = mod(floor(P.x / 4.0), 4.0); c = i < 1.0 ? vec3(1.0, 0.42, 0.42) : i < 2.0 ? YEL : i < 3.0 ? vec3(0.188, 0.882, 0.773) : vec3(0.608, 0.463, 1.0); }
  else if (s == 9) { c = uPl0 * (0.92 + 0.12 * h21(floor(vec2(P.x / 3.0, P.z / 2.0)))); }
  if (P.z < 1.0) { c = uPl1; if (s == 7) emis = 0.6; }
  return c;
}
void main(){
  int type = int(vT.x + 0.5);
  vec3 P = vW, N, c;
  float emis = 0.0, mat = 2.0;
  if (type == 0) { N = vec3(0.0, -1.0, 0.0); c = topSurface(P, emis); }
  else if (type == 1 || type == 2) { N = vec3(type == 1 ? -1.0 : 1.0, 0.0, 0.0); c = sideSurface(P, vT.y, emis); }
  else if (type == 3) { N = vec3(0.0, -1.0, 0.0); c = platSurface(P, true, emis); }
  else if (type == 4 || type == 5) { N = vec3(type == 4 ? -1.0 : 1.0, 0.0, 0.0); c = platSurface(P, false, emis); }
  else {                                         // superficie del agua (o de la lava)
    mat = 3.0;
    float a = P.x * 0.35 + uTime * 2.2, b = P.z * 0.55 - uTime * 1.7 + P.x * 0.1, r = sin(a) + sin(b);
    N = normalize(vec3(cos(a) * 0.12, -1.0, cos(b) * 0.18));
    c = mix(uWat1, uWat2, 0.3 + 0.15 * r);
    if (P.z < 1.0) c = uWat2;
    emis = uLava > 0.5 ? 0.55 + 0.2 * r : 0.0;
  }
  oAlb = vec4(c, mat / 3.0);
  oNrm = vec4(N * 0.5 + 0.5, emis);
}`;

// cara frontal: el pixel art de siempre (Z = 0) con relieve por Sobel de su luminancia
const D25_FS_FRONT = D25_GLSL_HEAD + `
in vec3 vW;
uniform sampler2D tStatic; uniform vec2 uLvl; uniform float uBump;
layout(location = 0) out vec4 oAlb;
layout(location = 1) out vec4 oNrm;
vec4 S(ivec2 q){ return texelFetch(tStatic, clamp(q, ivec2(0), ivec2(uLvl) - 1), 0); }
float Hh(ivec2 q){ vec4 c = S(q); return dot(c.rgb, vec3(0.299, 0.587, 0.114)) * c.a; }
void main(){
  ivec2 q = ivec2(floor(vW.xy));
  vec4 c = S(q);
  if (c.a < 0.5) discard;
  float gx = Hh(q + ivec2(1, -1)) + 2.0 * Hh(q + ivec2(1, 0)) + Hh(q + ivec2(1, 1)) - Hh(q + ivec2(-1, -1)) - 2.0 * Hh(q + ivec2(-1, 0)) - Hh(q + ivec2(-1, 1));
  float gy = Hh(q + ivec2(-1, 1)) + 2.0 * Hh(q + ivec2(0, 1)) + Hh(q + ivec2(1, 1)) - Hh(q + ivec2(-1, -1)) - 2.0 * Hh(q + ivec2(0, -1)) - Hh(q + ivec2(1, -1));
  vec3 N = normalize(vec3(-gx * uBump, -gy * uBump, -1.0));
  oAlb = vec4(c.rgb, 1.0 / 3.0);
  oNrm = vec4(N * 0.5 + 0.5, 0.0);
}`;

// mapa de sombras: solo profundidad (el pixel art y los actores con prueba de alfa)
const D25_FS_SHADOW = D25_GLSL_HEAD + `
in vec3 vW; in vec2 vUv;
uniform int uMode; uniform sampler2D tSrc; uniform vec2 uLvl;
void main(){
  if (uMode == 1 && texelFetch(tSrc, clamp(ivec2(floor(vW.xy)), ivec2(0), ivec2(uLvl) - 1), 0).a < 0.5) discard;
  if (uMode == 2 && texture(tSrc, vUv).a < 0.5) discard;
}`;
