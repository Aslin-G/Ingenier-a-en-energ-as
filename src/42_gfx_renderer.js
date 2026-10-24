// =====================================================================
//  GRÁFICOS 2.5D (HD-2D) · RENDERIZADOR «DIORAMA 3/4 LATERAL»
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//
//  La lógica del juego no cambia: física, colisiones (cajas AABB contra la
//  rejilla de baldosas), niveles y textos siguen en el plano 2D. Solo cambia
//  cómo se ve ese plano:
//   · Bandas: el fondo, los actores y la interfaz se dibujan con el código
//     2D de siempre en lienzos separados (Level.drawBackdrop/drawActors/
//     drawOverlay) y la GPU los compone.
//   · Cámara con desplazamiento de lente: el plano de juego (Z = 0) cae 1:1
//     sobre los 480×270 de siempre y el punto de fuga queda por encima de la
//     pantalla: se ven las caras de arriba y de los lados sin deformar saltos.
//   · Terreno extruido: cada baldosa sólida es un prisma; su cara frontal es
//     el pixel art original y las demás se texturizan a mano (materiales).
//   · Luz: ambiente hemisférico, sol o luna con mapa de sombras, las luces
//     del juego (Light.add) como luces puntuales y el mismo «apagón» del
//     modo clásico, para que en las zonas oscuras se vea igual que antes.
//   · Posprocesado: oclusión ambiental (SSAO) a media resolución, bloom
//     dual-Kawase, enfoque tilt-shift en la banda de juego y color por isla.
//  Si no hay WebGL2 o el equipo va lento, el juego vuelve al modo HD/clásico.
// =====================================================================
const D25_VS_FULL = D25_GLSL_HEAD + 'in vec2 aP; out vec2 vUv; void main(){ vUv = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }';
// reconstrucción de la posición en el mundo a partir de la profundidad
const D25_WORLD = `
uniform vec3 uEye; uniform vec2 uCam; uniform vec2 uZab; uniform vec2 uRes;
float zOf(float depth){ float zn = depth * 2.0 - 1.0; return uEye.z * (uZab.y - zn) / (zn - uZab.x * uEye.z); }
vec3 worldPos(vec2 pix, float depth){
  float z = zOf(depth), w = (uEye.z + z) / uEye.z;
  return vec3(uEye.xy + (uCam + (pix + 0.5) * 0.5 - uEye.xy) * w, z);
}`;
// Scale2x (EPX) por bloques de 2×2, el mismo filtro del modo HD (05_hd.js), con alfa
const D25_EPX = `
vec4 T(sampler2D t, vec2 q){ return texelFetch(t, ivec2(clamp(q, vec2(0.0), uRes - 1.0)), 0); }
bool eqc(vec4 a, vec4 b){ vec4 d = abs(a - b); return max(max(d.r, d.g), max(d.b, d.a)) < 0.075; }
bool samec(vec4 a, vec4 b){ vec4 d = abs(a - b); return max(max(d.r, d.g), max(d.b, d.a)) < 0.03; }
vec4 epx(sampler2D t, vec2 pix){
  vec2 blk = floor(pix * 0.5) * 2.0, q = pix - blk;
  vec4 p00 = T(t, blk), p10 = T(t, blk + vec2(1.0, 0.0)), p01 = T(t, blk + vec2(0.0, 1.0)), p11 = T(t, blk + vec2(1.0, 1.0));
  vec4 self = q.y < 0.5 ? (q.x < 0.5 ? p00 : p10) : (q.x < 0.5 ? p01 : p11);
  if (!(samec(p00, p10) && samec(p00, p01) && samec(p00, p11))) return self;
  vec4 A = T(t, blk + vec2(q.x, -1.0)), D = T(t, blk + vec2(q.x, 2.0)), C = T(t, blk + vec2(-1.0, q.y)), B = T(t, blk + vec2(2.0, q.y));
  vec4 o = p00;
  if (q.x < 0.5 && q.y < 0.5) { if (eqc(C, A) && !eqc(C, D) && !eqc(A, B)) o = A; }
  else if (q.y < 0.5) { if (eqc(A, B) && !eqc(A, C) && !eqc(B, D)) o = B; }
  else if (q.x < 0.5) { if (eqc(D, C) && !eqc(D, B) && !eqc(C, A)) o = C; }
  else { if (eqc(B, D) && !eqc(B, A) && !eqc(D, C)) o = D; }
  return o;
}`;

// oclusión ambiental en pantalla (media resolución)
const D25_FS_SSAO = D25_GLSL_HEAD + D25_HASH + D25_WORLD + `
uniform sampler2D tAlb, tNrm, tDepth; uniform vec3 uK[8];
out vec4 o;
void main(){
  ivec2 fc = ivec2(gl_FragCoord.xy) * 2;
  if (texelFetch(tAlb, fc, 0).a < 0.5) { o = vec4(1.0); return; }   // fondo y caras frontales: sin oclusión
  vec2 pix = vec2(float(fc.x), uRes.y - 1.0 - float(fc.y));
  vec3 P = worldPos(pix, texelFetch(tDepth, fc, 0).r);
  vec3 N = normalize(texelFetch(tNrm, fc, 0).xyz * 2.0 - 1.0);
  float a = h21(gl_FragCoord.xy) * 6.2832;
  vec3 rv = vec3(cos(a), sin(a), 0.37);
  vec3 Tg = normalize(rv - N * dot(rv, N)), Bt = cross(N, Tg);
  float occ = 0.0;
  for (int i = 0; i < 8; i++) {
    vec3 s = P + (Tg * uK[i].x + Bt * uK[i].y + N * uK[i].z) * 11.0;
    float w = (uEye.z + s.z) / uEye.z;
    vec2 scr = (uEye.xy + (s.xy - uEye.xy) / w - uCam) * 2.0;
    ivec2 sf = ivec2(int(scr.x), int(uRes.y - 1.0 - scr.y));
    if (sf.x < 0 || sf.y < 0 || sf.x >= int(uRes.x) || sf.y >= int(uRes.y)) continue;
    float sd = texelFetch(tDepth, sf, 0).r;
    if (sd >= 1.0) continue;
    float sz = zOf(sd);
    occ += (sz < s.z - 0.8 ? 1.0 : 0.0) * clamp(14.0 / max(abs(P.z - sz), 1.0), 0.0, 1.0);
  }
  float ao = 1.0 - occ / 8.0 * 0.9;
  o = vec4(ao, ao, ao, 1.0);
}`;
// desenfoques y reducciones (cuadro, gaussiano separable, dual-Kawase)
const D25_FS_BOX = D25_GLSL_HEAD + `
in vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; out vec4 o;
void main(){ vec3 s = vec3(0.0); for (int y = -1; y <= 2; y++) for (int x = -1; x <= 2; x++) s += texture(tSrc, vUv + vec2(float(x) - 0.5, float(y) - 0.5) * uTexel).rgb; o = vec4(s / 16.0, 1.0); }`;
const D25_FS_GAUSS = D25_GLSL_HEAD + `
in vec2 vUv; uniform sampler2D tSrc; uniform vec2 uDir; out vec4 o;
void main(){
  vec3 c = texture(tSrc, vUv).rgb * 0.227027;
  c += (texture(tSrc, vUv + uDir * 1.384615).rgb + texture(tSrc, vUv - uDir * 1.384615).rgb) * 0.316216;
  c += (texture(tSrc, vUv + uDir * 3.230769).rgb + texture(tSrc, vUv - uDir * 3.230769).rgb) * 0.070270;
  o = vec4(c, 1.0);
}`;
const D25_FS_PRE = D25_GLSL_HEAD + `
in vec2 vUv; uniform sampler2D tSrc; uniform float uThr; out vec4 o;
void main(){
  vec3 c = texture(tSrc, vUv).rgb;
  float l = max(c.r, max(c.g, c.b)), k = clamp(l - uThr + 0.2, 0.0, 0.4);
  float w = max(k * k / 0.8, l - uThr) / max(l, 1e-4);
  o = vec4(c * w, 1.0);
}`;
const D25_FS_KDOWN = D25_GLSL_HEAD + `
in vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; out vec4 o;
void main(){
  vec3 s = texture(tSrc, vUv).rgb * 4.0;
  s += texture(tSrc, vUv - uTexel).rgb + texture(tSrc, vUv + uTexel).rgb;
  s += texture(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture(tSrc, vUv - vec2(uTexel.x, -uTexel.y)).rgb;
  o = vec4(s / 8.0, 1.0);
}`;
const D25_FS_KUP = D25_GLSL_HEAD + `
in vec2 vUv; uniform sampler2D tSrc; uniform vec2 uTexel; out vec4 o;
void main(){
  vec2 h = uTexel;
  vec3 s = texture(tSrc, vUv + vec2(-h.x * 2.0, 0.0)).rgb + texture(tSrc, vUv + vec2(h.x * 2.0, 0.0)).rgb;
  s += texture(tSrc, vUv + vec2(0.0, h.y * 2.0)).rgb + texture(tSrc, vUv + vec2(0.0, -h.y * 2.0)).rgb;
  s += (texture(tSrc, vUv + vec2(-h.x, h.y)).rgb + texture(tSrc, vUv + vec2(h.x, h.y)).rgb + texture(tSrc, vUv + vec2(h.x, -h.y)).rgb + texture(tSrc, vUv + vec2(-h.x, -h.y)).rgb) * 2.0;
  o = vec4(s / 12.0, 1.0);
}`;

// iluminación y composición de fondo + terreno + actores (HDR)
const D25_FS_LIGHT = D25_GLSL_HEAD + D25_WORLD + D25_EPX + `
precision highp sampler2DShadow;
uniform sampler2D tAlb, tNrm, tDepth, tBg, tBgBlur, tAct, tAO;
uniform sampler2DShadow tShadow;
uniform mat4 uLight;
uniform vec3 uSun, uSunCol, uHemi, uTint;
uniform float uAmb, uDif, uDark, uBgDof, uPL;
uniform vec4 uSunDisc;
uniform int uNL, uFlat, uShadows, uAO, uEPX, uDof;
uniform vec4 uL[32]; uniform vec4 uLC[32];
out vec4 o;
float shadowAt(vec3 P){
  vec4 l = uLight * vec4(P, 1.0);
  vec3 c = l.xyz * 0.5 + 0.5;
  if (c.x <= 0.0 || c.x >= 1.0 || c.y <= 0.0 || c.y >= 1.0 || c.z >= 1.0) return 1.0;
  vec2 ts = 1.0 / vec2(textureSize(tShadow, 0));
  float r = c.z - 0.002, s = 0.0;
  s += texture(tShadow, vec3(c.xy + vec2(-0.6, -0.6) * ts, r));
  s += texture(tShadow, vec3(c.xy + vec2(0.6, -0.6) * ts, r));
  s += texture(tShadow, vec3(c.xy + vec2(-0.6, 0.6) * ts, r));
  s += texture(tShadow, vec3(c.xy + vec2(0.6, 0.6) * ts, r));
  return s * 0.25;
}
vec3 pointLights(vec3 P, vec3 N){
  vec3 s = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    if (i >= uNL) break;
    vec4 L = uL[i];
    vec3 d = vec3(L.xy + uCam, -10.0) - P;
    float dist = length(d), att = clamp(1.0 - dist / (L.z * 1.15), 0.0, 1.0);
    att *= att * L.w;
    if (att <= 0.0) continue;
    vec3 lc = uLC[i].w > 0.5 ? uLC[i].rgb : vec3(1.0, 0.92, 0.78);
    s += lc * att * max(dot(N, d / dist), 0.0);
  }
  return s * uPL;
}
void main(){
  ivec2 fc = ivec2(gl_FragCoord.xy);
  vec2 pix = vec2(float(fc.x), uRes.y - 1.0 - float(fc.y));   // píxel del lienzo (origen arriba)
  vec2 sp = (pix + 0.5) * 0.5;                                  // coordenadas de juego
  vec2 gp = floor(sp) + 0.5;                                    // centro del píxel de juego
  vec4 alb = texelFetch(tAlb, fc, 0);
  int mat = int(alb.a * 3.0 + 0.5);
  float k0 = uAmb + uDif * max(-uSun.z, 0.0);
  vec3 col;
  if (mat == 0) {
    col = texelFetch(tBg, ivec2(pix), 0).rgb;
    if (uDof == 1) col = mix(col, texture(tBgBlur, (pix + 0.5) / uRes).rgb, uBgDof);
    if (uFlat == 0) col += uSunCol * uSunDisc.w * (1.0 - smoothstep(uSunDisc.z * 0.5, uSunDisc.z + 1.5, length(sp - uSunDisc.xy)));
  } else {
    col = alb.rgb;
    if (uFlat == 0) {
      vec4 nr = texelFetch(tNrm, fc, 0);
      vec3 N = normalize(nr.xyz * 2.0 - 1.0);
      vec3 P = worldPos(pix, texelFetch(tDepth, fc, 0).r);
      float ao = uAO == 1 ? texture(tAO, gl_FragCoord.xy / uRes).r : 1.0;
      float sh = uShadows == 1 && mat >= 2 ? shadowAt(P + N * 0.8) : 1.0;
      vec3 amb = uAmb * (vec3(1.0) + uHemi * (-N.y)) * ao;
      vec3 dif = uDif * max(dot(N, uSun), 0.0) * sh * uSunCol;
      col = alb.rgb * (amb + dif) / k0 + alb.rgb * pointLights(P, N);
      if (mat == 3) { vec3 V = normalize(vec3(uEye.xy, -uEye.z) - P); col += uSunCol * pow(max(dot(N, normalize(uSun + V)), 0.0), 60.0) * 1.3 * sh; }
      col += alb.rgb * nr.a * 1.6;
    }
  }
  // actores (Lía, enemigos, objetos, partículas): tarjetas en Z = 0, siempre delante
  vec4 a = uEPX == 1 ? epx(tAct, pix) : texelFetch(tAct, ivec2(pix), 0);
  if (a.a > 0.0) {
    vec3 ac = a.rgb;
    if (uFlat == 0) {
      float hl = T(tAct, pix + vec2(-2.0, 0.0)).a, hr = T(tAct, pix + vec2(2.0, 0.0)).a, hu = T(tAct, pix + vec2(0.0, -2.0)).a, hd = T(tAct, pix + vec2(0.0, 2.0)).a;
      vec3 Na = normalize(vec3((hl - hr) * 0.55, (hu - hd) * 0.55, -1.0));
      ac *= (uAmb + uDif * max(dot(Na, uSun), 0.0) * uSunCol) / k0;
    }
    col = mix(col, ac, a.a);
  }
  // el mismo apagón con huecos de luz que el modo clásico (Light.render)
  if (uDark > 0.01) {
    float ov = uDark;
    for (int i = 0; i < 32; i++) {
      if (i >= uNL) break;
      vec4 L = uL[i];
      float t = length(gp - L.xy) / L.z;
      if (t < 1.0) ov *= 1.0 - (t < 0.55 ? mix(L.w, 0.7 * L.w, t / 0.55) : mix(0.7 * L.w, 0.0, (t - 0.55) / 0.45));
    }
    col = mix(col, uTint, ov);
  }
  for (int i = 0; i < 32; i++) {
    if (i >= uNL) break;
    if (uLC[i].w < 0.5) continue;
    float t = length(sp - uL[i].xy) / (uL[i].z * 0.6);
    if (t < 1.0) col += uLC[i].rgb * 0.22 * uL[i].w * (1.0 - t);
  }
  if (uFlat == 1) col = clamp(col, 0.0, 1.0);
  o = vec4(col, 1.0);
}`;

// composición final: bloom, tilt-shift, tono y color por isla, viñeta e interfaz
const D25_FS_FINAL = D25_GLSL_HEAD + `
uniform vec2 uRes;
` + D25_EPX + `
uniform sampler2D tHdr, tHalf, tBloom, tUi;
uniform int uFlat, uEPX, uTilt;
uniform float uBloomK, uFocusY, uVigA, uGray, uSat, uCon;
uniform vec3 uShTint, uHiTint;
out vec4 o;
vec3 tone(vec3 x){ const float k = 0.8; vec3 e = k + (1.0 - k) * (1.0 - exp(-(x - k) / (1.0 - k))); return mix(x, e, step(k, x)); }
void main(){
  ivec2 fc = ivec2(gl_FragCoord.xy);
  vec2 pix = vec2(float(fc.x), uRes.y - 1.0 - float(fc.y)), sp = (pix + 0.5) * 0.5, gp = floor(sp) + 0.5;
  vec3 c = texelFetch(tHdr, fc, 0).rgb;
  if (uFlat == 0) {
    if (uTilt == 1) c = mix(c, texture(tHalf, gl_FragCoord.xy / uRes).rgb, smoothstep(72.0, 170.0, abs(sp.y - uFocusY)) * 0.65);
    c += texture(tBloom, gl_FragCoord.xy / uRes).rgb * uBloomK;
    c = tone(max(c, 0.0));
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, uSat);
    c = (c - 0.5) * uCon + 0.5;
    c += (uShTint - 0.5) * (1.0 - smoothstep(0.0, 0.45, l)) * 0.08 + (uHiTint - 0.5) * smoothstep(0.6, 1.0, l) * 0.05;
  }
  // viñeta: la misma del modo clásico (Vignette.get)
  float vt = clamp((length(gp - vec2(240.0, 129.6)) - 113.4) / (297.6 - 113.4), 0.0, 1.0);
  c = mix(c, vec3(10.0, 14.0, 28.0) / 255.0, uVigA * vt);
  if (uGray > 0.0) c = mix(c, vec3(dot(c, vec3(0.3, 0.59, 0.11))), uGray);
  c = clamp(c, 0.0, 1.0);
  vec4 u = uEPX == 1 ? epx(tUi, pix) : texelFetch(tUi, ivec2(pix), 0);
  o = vec4(mix(c, u.rgb, u.a), 1.0);
}`;

const D25 = {
  ok: false, on: false, gl: null, cv: null, err: '',
  quality: 'alta', autoOff: false, shown: false,
  flat: false,            // pruebas: sin luces ni posprocesado (los colores del modo clásico)
  noDepth: false,         // pruebas: sin extrusión; con flat, el fotograma es idéntico al clásico
  frame: null, gray: 0, lvRef: null, staticRef: null,
  // cámara del diorama en píxeles de juego: distancia del ojo, altura sobre la pantalla
  // y profundidad de los prismas (suelo y plataformas)
  D: 600, K: 170, DZ: 28, DP: 20, SHADOW: 1024,
  lastT: 0, avg: 0, slowT: 0,
  get active() { return this.on; },
  init() {
    try {
      const c = document.getElementById('d25');
      if (!c || typeof WebGL2RenderingContext === 'undefined') return this.apply();
      c.width = W * RES; c.height = H * RES;
      const gl = c.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) return this.apply();
      this.cv = c; this.gl = gl;
      this.hdr = !!gl.getExtension('EXT_color_buffer_float');
      this.setup();
      c.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; this.apply(); });
      this.ok = true;
    } catch (e) { this.err = String(e && e.message || e); this.ok = false; }
    this.apply();
  },
  // en las pruebas automáticas solo se usa si se pide #d25=1
  wanted() {
    const S = G.save.settings;
    if (S.d25 === false || S.hd === false || this.autoOff) return false;
    return !(navigator.webdriver && !/d25=1/.test(location.hash));
  },
  apply() { this.on = this.ok && this.wanted(); if (!this.on) this.show(false); this.avg = 0; this.slowT = 0; },
  show(v) { if (this.cv && v !== this.shown) { this.cv.style.display = v ? 'block' : 'none'; this.shown = v; } },

  // ---------- recursos ----------
  setup() {
    const gl = this.gl, X = GLX, F = this.hdr ? gl.RGBA16F : gl.RGBA8, fw = W * RES, fh = H * RES, hw = fw / 2, hh = fh / 2;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    const P = (fs, vs) => X.program(gl, vs || D25_VS_FULL, fs);
    this.pr = {
      face: P(D25_FS_FACE, D25_VS_SCENE), front: P(D25_FS_FRONT, D25_VS_SCENE), shadow: P(D25_FS_SHADOW, D25_VS_SCENE),
      ssao: P(D25_FS_SSAO), box: P(D25_FS_BOX), gauss: P(D25_FS_GAUSS), pre: P(D25_FS_PRE), kdown: P(D25_FS_KDOWN), kup: P(D25_FS_KUP),
      light: P(D25_FS_LIGHT), final: P(D25_FS_FINAL)
    };
    // lienzos de las bandas 2D (mismo tamaño y escala que el lienzo del juego)
    const band = () => { const c = document.createElement('canvas'); c.width = fw; c.height = fh; const g = c.getContext('2d'); return { c, g }; };
    this.bgB = band(); this.actB = band();
    const T = (w, h, f, lin) => X.tex(gl, w, h, f, lin);
    this.tBg = T(fw, fh, gl.RGBA8, true); this.tAct = T(fw, fh, gl.RGBA8, false); this.tUi = T(fw, fh, gl.RGBA8, false);
    this.tAlb = T(fw, fh, gl.RGBA8, false); this.tNrm = T(fw, fh, gl.RGBA8, false); this.tDepth = T(fw, fh, gl.DEPTH_COMPONENT24, false);
    this.fG = X.fbo(gl, [this.tAlb, this.tNrm], this.tDepth);
    this.tHdr = T(fw, fh, F, true); this.fHdr = X.fbo(gl, [this.tHdr]);
    this.tAO = T(hw, hh, gl.RGBA8, true); this.fAO = X.fbo(gl, [this.tAO]);
    this.tAO2 = T(hw, hh, gl.RGBA8, true); this.fAO2 = X.fbo(gl, [this.tAO2]);
    this.tBgH = T(hw, hh, gl.RGBA8, true); this.fBgH = X.fbo(gl, [this.tBgH]);
    this.tBgH2 = T(hw, hh, gl.RGBA8, true); this.fBgH2 = X.fbo(gl, [this.tBgH2]);
    this.tHalf = T(hw, hh, F, true); this.fHalf = X.fbo(gl, [this.tHalf]);
    this.tHalf2 = T(hw, hh, F, true); this.fHalf2 = X.fbo(gl, [this.tHalf2]);
    this.bl = [];
    for (let i = 0, w = hw, h = hh; i < 5; i++, w = Math.ceil(w / 2), h = Math.ceil(h / 2)) { const t = T(w, h, F, true); this.bl.push({ t, f: X.fbo(gl, [t]) }); }
    this.tShadow = T(this.SHADOW, this.SHADOW, gl.DEPTH_COMPONENT24, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    this.fShadow = X.fbo(gl, [], this.tShadow);
    // triángulo de pantalla completa y tarjeta de los actores (W×H en Z = 0)
    this.vFull = gl.createVertexArray(); gl.bindVertexArray(this.vFull);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.mAct = X.mesh(gl, new Float32Array([0, 0, 0, 0, 0, W, 0, 0, 1, 0, W, H, 0, 1, 1, 0, H, 0, 0, 1]), new Uint32Array([0, 1, 2, 0, 2, 3]));
    // núcleo de muestras de la oclusión ambiental (hemisferio, más denso cerca del centro)
    const k = [];
    for (let i = 0; i < 8; i++) { const a = i * 2.39996, r = 0.35 + 0.65 * ((i + 0.5) / 8), z = 0.25 + 0.7 * ((i * 5) % 8) / 8, s = (0.25 + 0.75 * (i / 7) * (i / 7)); k.push(Math.cos(a) * r * s, Math.sin(a) * r * s, z * s); }
    this.kernel = new Float32Array(k);
  },
  // geometría del nivel: prismas del terreno, plataformas y superficie del agua
  prepareLevel(lv) {
    const gl = this.gl;
    GLX.free(gl, this.mTer); GLX.free(gl, this.mFront);
    if (this.tStatic) gl.deleteTexture(this.tStatic);
    const sc = lv.staticCv;
    this.tStatic = GLX.tex(gl, sc.width, sc.height, gl.RGBA8, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sc);
    this.mFront = GLX.mesh(gl, new Float32Array([0, 0, 0, 0, 0, sc.width, 0, 0, 1, 0, sc.width, sc.height, 0, 1, 1, 0, sc.height, 0, 0, 1]), new Uint32Array([0, 1, 2, 0, 2, 3]));
    const m = d25Mesh(lv, this.DZ, this.DP);
    this.mTer = m.idx.length ? GLX.mesh(gl, m.verts, m.idx) : null;
    this.mat = d25Theme(lv.theme);
    this.lvRef = lv; this.staticRef = sc;
  },
  upload(t, src) { const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src); },

  // ---------- dibujo de un fotograma ----------
  // Lo llama Level.drawWorld en modo 2.5D: las mismas etapas que el modo
  // clásico, pero el fondo y los actores van a sus lienzos y el lienzo del
  // juego queda transparente para la interfaz.
  drawLevel(lv, g, cx, cy) {
    const B = this.bgB.g, A = this.actB.g;
    for (const x of [B, A]) { x.setTransform(RES, 0, 0, RES, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.imageSmoothingEnabled = false; }
    A.clearRect(0, 0, W, H);
    g.clearRect(0, 0, W, H);
    lv.drawBackdrop(B, cx, cy);
    lv.drawActors(A, cx, cy);
    lv.addLights(cx, cy);
    const dk = lv.darkness(), p = lv.player;
    this.frame = { lv, cx, cy, dk, tint: lv.theme.tint || '#0B1030', lights: Light.lights.slice(0, 32).map(l => ({ x: l.x, y: l.y, r: l.r, a: l.a, color: l.color })), vig: lv.vignetteA(), focusY: p ? p.y + p.h / 2 - cy : H / 2 };
    this.gray = 0;
    lv.drawSunAfterDark(g, dk);
    lv.drawOverlay(g, cx, cy);
  },
  // se llama al final de Game.draw: compone el fotograma 2.5D (o devuelve false)
  present() {
    const f = this.frame;
    this.frame = null;
    if (!f || !this.on) { this.show(false); return false; }
    try { this.render(f); } catch (e) { this.err = String(e && e.message || e); this.ok = false; this.apply(); return false; }
    this.show(true);
    this.watch();
    return true;
  },
  fs(prog, fbo, tex) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo || null);
    gl.viewport(0, 0, fbo ? fbo.w : this.cv.width, fbo ? fbo.h : this.cv.height);
    gl.useProgram(prog.p);
    if (tex) for (const k in tex) { const i = tex[k][0]; gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tex[k][1]); if (prog.u[k]) gl.uniform1i(prog.u[k], i); }
    gl.bindVertexArray(this.vFull);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  },
  uni(prog, o) {
    const gl = this.gl, u = prog.u;
    for (const k in o) {
      const v = o[k], l = u[k];
      if (l == null) continue;
      if (typeof v === 'number') gl.uniform1f(l, v);
      else if (v.i != null) gl.uniform1i(l, v.i);
      else if (v.length === 2) gl.uniform2fv(l, v);
      else if (v.length === 3) gl.uniform3fv(l, v);
      else if (v.length === 4) gl.uniform4fv(l, v);
      else if (v.m) gl.uniformMatrix4fv(l, false, v.m);
      else if (v.v3) gl.uniform3fv(l, v.v3);
      else if (v.v4) gl.uniform4fv(l, v.v4);
    }
  },
  render(f) {
    const gl = this.gl, lv = f.lv;
    if (this.lvRef !== lv || this.staticRef !== lv.staticCv) this.prepareLevel(lv);
    const M = this.mat, fw = this.cv.width, fh = this.cv.height;
    const flat = this.flat, alta = this.quality === 'alta' && !flat, depth = !this.noDepth;
    const epx = !flat && HD.ok && G.save.settings.hd !== false ? 1 : 0;
    this.upload(this.tBg, this.bgB.c); this.upload(this.tAct, this.actB.c); this.upload(this.tUi, cv);
    // cámara: el ojo sobre el centro de la pantalla, por encima de su borde superior
    const D = this.D, zN = 60, zF = 600;
    const A = (2 * D + zF - zN) / (D * (zF + zN)), Bz = (D + zF) / D - A * zF;
    const cam = [f.cx, f.cy], eye = [f.cx + W / 2, f.cy - this.K, D];
    const scene = { uEye: eye, uCam: cam, uZab: [A, Bz], uScr: [W, H], uRes: [fw, fh], uOff: [0, 0, 0], uShadowPass: { i: 0 } };
    // luz direccional (sol o luna) y su matriz de sombras
    const lm = lightMatrix(M.sun, [f.cx - 70, f.cx + W + 70, f.cy - 90, f.cy + H + 40, -2, this.DZ + 2], this.SHADOW);
    gl.disable(gl.BLEND);
    // 1) mapa de sombras (terreno, pixel art frontal y actores con prueba de alfa)
    if (alta && depth) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fShadow); gl.viewport(0, 0, this.SHADOW, this.SHADOW);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.5, 2.0);
      const S = this.pr.shadow; gl.useProgram(S.p);
      this.uni(S, Object.assign({}, scene, { uShadowPass: { i: 1 }, uLight: { m: lm }, uLvl: [lv.staticCv.width, lv.staticCv.height] }));
      if (this.mTer) { this.uni(S, { uMode: { i: 0 } }); gl.bindVertexArray(this.mTer.vao); gl.drawElements(gl.TRIANGLES, this.mTer.n, gl.UNSIGNED_INT, 0); }
      gl.activeTexture(gl.TEXTURE0); gl.uniform1i(S.u.tSrc, 0);
      gl.bindTexture(gl.TEXTURE_2D, this.tStatic); this.uni(S, { uMode: { i: 1 } }); gl.bindVertexArray(this.mFront.vao); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      gl.bindTexture(gl.TEXTURE_2D, this.tAct); this.uni(S, { uMode: { i: 2 }, uOff: [f.cx, f.cy, 0] }); gl.bindVertexArray(this.mAct.vao); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    // 2) G-buffer: caras 3D del terreno y, encima, el pixel art frontal (Z = 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fG); gl.viewport(0, 0, fw, fh);
    gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LESS);
    if (depth && this.mTer) {
      const P = this.pr.face; gl.useProgram(P.p);
      this.uni(P, Object.assign({}, scene, {
        uTop: { i: M.top }, uPlatStyle: { i: M.platStyle }, uPier: M.pier, uDz: this.DZ, uTime: lv.time, uFlowers: M.flowers ? 1 : 0, uLava: M.lava,
        uTopC: M.topC, uTopHi: M.topHi, uFill: M.fill, uFill2: M.fill2, uEdge: M.edge, uPierC: M.pierC, uWat1: M.wat1, uWat2: M.wat2,
        uPl0: M.plat ? M.plat[0] : M.topC, uPl1: M.plat ? M.plat[1] : M.topHi, uPl2: M.plat ? M.plat[2] : M.edge,
        uDeco0: M.flowers ? M.flowers[0] : M.topHi, uDeco1: M.flowers ? M.flowers[1] : M.topHi, uDeco2: M.flowers ? M.flowers[2] : M.topHi
      }));
      gl.bindVertexArray(this.mTer.vao); gl.drawElements(gl.TRIANGLES, this.mTer.n, gl.UNSIGNED_INT, 0);
    }
    gl.depthFunc(gl.LEQUAL);
    const Fr = this.pr.front; gl.useProgram(Fr.p);
    this.uni(Fr, Object.assign({}, scene, { uLvl: [lv.staticCv.width, lv.staticCv.height], uBump: flat ? 0 : 0.22 }));
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tStatic); gl.uniform1i(Fr.u.tStatic, 0);
    gl.bindVertexArray(this.mFront.vao); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
    gl.disable(gl.DEPTH_TEST);
    // 3) oclusión ambiental a media resolución (+ desenfoque de 4×4)
    const half = [this.tAO.w, this.tAO.h];
    if (alta && depth) {
      gl.useProgram(this.pr.ssao.p); this.uni(this.pr.ssao, scene); gl.uniform3fv(this.pr.ssao.u.uK, this.kernel);
      this.fs(this.pr.ssao, this.fAO, { tAlb: [0, this.tAlb], tNrm: [1, this.tNrm], tDepth: [2, this.tDepth] });
      gl.useProgram(this.pr.box.p); this.uni(this.pr.box, { uTexel: [1 / half[0], 1 / half[1]] });
      this.fs(this.pr.box, this.fAO2, { tSrc: [0, this.tAO] });
    }
    // 4) fondo desenfocado (profundidad de campo: el fondo queda fuera de foco)
    if (alta) {
      gl.useProgram(this.pr.box.p); this.uni(this.pr.box, { uTexel: [1 / fw, 1 / fh] });
      this.fs(this.pr.box, this.fBgH, { tSrc: [0, this.tBg] });
      gl.useProgram(this.pr.gauss.p); this.uni(this.pr.gauss, { uDir: [1 / half[0], 0] }); this.fs(this.pr.gauss, this.fBgH2, { tSrc: [0, this.tBgH] });
      gl.useProgram(this.pr.gauss.p); this.uni(this.pr.gauss, { uDir: [0, 1 / half[1]] }); this.fs(this.pr.gauss, this.fBgH, { tSrc: [0, this.tBgH2] });
    }
    // 5) iluminación y composición (HDR)
    const L = this.pr.light, lu = new Float32Array(128), lc = new Float32Array(128);
    f.lights.forEach((l, i) => { lu.set([l.x, l.y, Math.max(1, l.r), l.a], i * 4); if (l.color) { const c = d25Color(l.color); lc.set([c[0], c[1], c[2], 1], i * 4); } });
    gl.useProgram(L.p);
    this.uni(L, Object.assign({}, scene, {
      uLight: { m: lm }, uSun: M.sun, uSunCol: M.sunCol, uHemi: M.hemi, uTint: c3(f.tint), uAmb: M.amb, uDif: M.dif, uDark: f.dk, uBgDof: 0.55, uPL: M.pl * (0.6 + f.dk),
      uSunDisc: M.sunDisc, uNL: { i: f.lights.length }, uFlat: { i: flat ? 1 : 0 }, uShadows: { i: alta && depth ? 1 : 0 }, uAO: { i: alta && depth ? 1 : 0 }, uEPX: { i: epx }, uDof: { i: alta ? 1 : 0 }
    }));
    gl.uniform4fv(L.u.uL, lu); gl.uniform4fv(L.u.uLC, lc);
    this.fs(L, this.fHdr, { tAlb: [0, this.tAlb], tNrm: [1, this.tNrm], tDepth: [2, this.tDepth], tBg: [3, this.tBg], tBgBlur: [4, this.tBgH], tAct: [5, this.tAct], tAO: [6, this.tAO2], tShadow: [7, this.tShadow] });
    // 6) tilt-shift (copia desenfocada a media resolución) y bloom dual-Kawase
    if (alta) {
      gl.useProgram(this.pr.box.p); this.uni(this.pr.box, { uTexel: [1 / fw, 1 / fh] }); this.fs(this.pr.box, this.fHalf, { tSrc: [0, this.tHdr] });
      gl.useProgram(this.pr.gauss.p); this.uni(this.pr.gauss, { uDir: [1 / half[0], 0] }); this.fs(this.pr.gauss, this.fHalf2, { tSrc: [0, this.tHalf] });
      gl.useProgram(this.pr.gauss.p); this.uni(this.pr.gauss, { uDir: [0, 1 / half[1]] }); this.fs(this.pr.gauss, this.fHalf, { tSrc: [0, this.tHalf2] });
    }
    if (!flat) {
      const bl = this.bl, n = alta ? bl.length : 3;
      gl.useProgram(this.pr.pre.p); this.uni(this.pr.pre, { uThr: this.hdr ? 1.0 : 0.82 }); this.fs(this.pr.pre, bl[0].f, { tSrc: [0, this.tHdr] });
      for (let i = 1; i < n; i++) { gl.useProgram(this.pr.kdown.p); this.uni(this.pr.kdown, { uTexel: [1 / bl[i - 1].t.w, 1 / bl[i - 1].t.h] }); this.fs(this.pr.kdown, bl[i].f, { tSrc: [0, bl[i - 1].t] }); }
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = n - 1; i > 0; i--) { gl.useProgram(this.pr.kup.p); this.uni(this.pr.kup, { uTexel: [0.5 / bl[i].t.w, 0.5 / bl[i].t.h] }); this.fs(this.pr.kup, bl[i - 1].f, { tSrc: [0, bl[i].t] }); }
      gl.disable(gl.BLEND);
    }
    // 7) composición final en pantalla
    const Fi = this.pr.final; gl.useProgram(Fi.p);
    this.uni(Fi, {
      uRes: [fw, fh], uFlat: { i: flat ? 1 : 0 }, uEPX: { i: epx }, uTilt: { i: alta ? 1 : 0 }, uBloomK: this.hdr ? 0.42 : 0.3, uFocusY: f.focusY,
      uVigA: f.vig, uGray: this.gray, uSat: M.sat, uCon: M.con, uShTint: M.shTint, uHiTint: M.hiTint
    });
    this.fs(Fi, null, { tHdr: [0, this.tHdr], tHalf: [1, this.tHalf], tBloom: [2, this.bl[0].t], tUi: [3, this.tUi] });
  },
  // vigilancia de fluidez: primero baja la calidad; si aún va lento, vuelve al modo HD
  watch() {
    const now = performance.now(), dt = now - this.lastT; this.lastT = now;
    if (!(dt > 0 && dt < 200)) return;
    this.avg = this.avg ? this.avg * 0.95 + dt * 0.05 : dt;
    this.slowT = this.avg > 26 ? this.slowT + dt / 1000 : 0;
    if (this.slowT > 5 && !navigator.webdriver) {
      this.slowT = 0; this.avg = 0;
      if (this.quality === 'alta') { this.quality = 'baja'; Toast.show('Gráficos 2.5D en modo ligero para ir más fluido', PAL.sun, 3.5); }
      else { this.autoOff = true; this.apply(); Toast.show('Gráficos 2.5D en pausa para ir más fluido (Ajustes)', PAL.sun, 3.5); }
    }
  }
};

// Geometría del diorama a partir de la rejilla de baldosas (no cambia la física):
// tramos de caras superiores (horizontales) y laterales (verticales), losas
// finas para las plataformas de un solo sentido y la superficie del agua.
// Vértice: x, y, z, tipo de cara, dato (y del borde superior del tramo lateral).
function d25Mesh(lv, DZ, DP) {
  const V = [], I = [], T = TILE, t = (x, y) => lv.tile(x, y), solid = (x, y) => t(x, y) === '#';
  const q = (a, b, c, d, type, flag) => { const n = V.length / 5; for (const p of [a, b, c, d]) V.push(p[0], p[1], p[2], type, flag); I.push(n, n + 1, n + 2, n, n + 2, n + 3); };
  const runs = (y, test, fn) => { let x = 0; while (x < lv.w) { if (!test(x)) { x++; continue; } let x2 = x; while (x2 + 1 < lv.w && test(x2 + 1)) x2++; fn(x * T, (x2 + 1) * T); x = x2 + 1; } };
  for (let y = 0; y < lv.h; y++) {
    runs(y, x => solid(x, y) && !solid(x, y - 1) && t(x, y - 1) !== '~', (X0, X1) => q([X0, y * T, 0], [X1, y * T, 0], [X1, y * T, DZ], [X0, y * T, DZ], 0, 0));
    if (D25_PLAT[lv.theme.plat]) runs(y, x => t(x, y) === '=', (X0, X1) => {
      const Y = y * T, Yb = Y + 4;
      q([X0, Y, 0], [X1, Y, 0], [X1, Y, DP], [X0, Y, DP], 3, 0);
      q([X0, Y, 0], [X0, Y, DP], [X0, Yb, DP], [X0, Yb, 0], 4, 0);
      q([X1, Y, 0], [X1, Y, DP], [X1, Yb, DP], [X1, Yb, 0], 5, 0);
    });
    runs(y, x => t(x, y) === '~' && t(x, y - 1) !== '~' && !solid(x, y - 1), (X0, X1) => { const Y = y * T + 2; q([X0, Y, 0], [X1, Y, 0], [X1, Y, DZ], [X0, Y, DZ], 6, 0); });
  }
  for (let x = 0; x < lv.w; x++) for (const side of [-1, 1]) {
    let y = 0;
    while (y < lv.h) {
      if (!(solid(x, y) && !solid(x + side, y))) { y++; continue; }
      let y2 = y; while (y2 + 1 < lv.h && solid(x, y2 + 1) && !solid(x + side, y2 + 1)) y2++;
      const X = side < 0 ? x * T : (x + 1) * T, Y0 = y * T, Y1 = (y2 + 1) * T, top = !solid(x, y - 1) ? Y0 : -1;
      q([X, Y0, 0], [X, Y0, DZ], [X, Y1, DZ], [X, Y1, 0], side < 0 ? 1 : 2, top);
      y = y2 + 1;
    }
  }
  return { verts: new Float32Array(V), idx: new Uint32Array(I) };
}
