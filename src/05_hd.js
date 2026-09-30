// =====================================================================
//  MODO HD: posprocesado en la GPU que duplica la resolución del pixel art
// =====================================================================
// El juego se dibuja en «píxeles de juego» (480×270) sobre un lienzo de
// 960×540: cada píxel de juego es un bloque de 2×2. Este filtro aplica
// Scale2x (EPX) a esos bloques: las escaleras de los bordes se redondean con
// píxeles la mitad de grandes, así siluetas, textos, círculos y diagonales
// ganan resolución sin dejar de ser pixel art. Lo que ya se dibujó con
// detalle doble (cielos, luces suaves, el mapa ilustrado) pasa intacto.
// El lienzo 2D sigue recibiendo el dibujo y los clics; la capa HD solo lo muestra.
const HD_VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
const HD_FRAG = [
  '#ifdef GL_FRAGMENT_PRECISION_HIGH',
  'precision highp float;',
  '#else',
  'precision mediump float;',
  '#endif',
  'uniform sampler2D tex;',
  'uniform vec2 size;',
  'vec3 T(vec2 q){ return texture2D(tex, (clamp(q, vec2(0.0), size - 1.0) + 0.5) / size).rgb; }',
  // «igual» con tolerancia: los degradados finos del fondo cuentan como un mismo color
  'bool eq(vec3 a, vec3 b){ vec3 d = abs(a - b); return max(max(d.r, d.g), d.b) < 0.075; }',
  'bool same(vec3 a, vec3 b){ vec3 d = abs(a - b); return max(max(d.r, d.g), d.b) < 0.03; }',
  'void main(){',
  '  vec2 pix = vec2(floor(gl_FragCoord.x), size.y - 1.0 - floor(gl_FragCoord.y));',
  '  vec2 blk = floor(pix * 0.5) * 2.0;',
  '  vec2 q = pix - blk;',
  '  vec3 p00 = T(blk), p10 = T(blk + vec2(1.0, 0.0)), p01 = T(blk + vec2(0.0, 1.0)), p11 = T(blk + vec2(1.0, 1.0));',
  '  vec3 self = q.y < 0.5 ? (q.x < 0.5 ? p00 : p10) : (q.x < 0.5 ? p01 : p11);',
  // bloque con detalle doble: se respeta tal cual
  '  if (!(same(p00, p10) && same(p00, p01) && same(p00, p11))) { gl_FragColor = vec4(self, 1.0); return; }',
  '  vec3 A = T(blk + vec2(q.x, -1.0));',
  '  vec3 D = T(blk + vec2(q.x, 2.0));',
  '  vec3 C = T(blk + vec2(-1.0, q.y));',
  '  vec3 B = T(blk + vec2(2.0, q.y));',
  '  vec3 o = p00;',
  '  if (q.x < 0.5 && q.y < 0.5) { if (eq(C, A) && !eq(C, D) && !eq(A, B)) o = A; }',
  '  else if (q.y < 0.5) { if (eq(A, B) && !eq(A, C) && !eq(B, D)) o = B; }',
  '  else if (q.x < 0.5) { if (eq(D, C) && !eq(D, B) && !eq(C, A)) o = C; }',
  '  else { if (eq(B, D) && !eq(B, A) && !eq(D, C)) o = D; }',
  '  gl_FragColor = vec4(o, 1.0);',
  '}'
].join('\n');

const HD = {
  ok: false, on: false, gl: null, cv: null, tex: null,
  // vigilancia de fluidez: si con el filtro el juego va a tirones, se apaga en esta sesión
  lastT: 0, avg: 0, slowT: 0, autoOff: false,
  init() {
    this.cv = document.getElementById('hd');
    if (!this.cv) return;
    let gl = null;
    try { gl = this.cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = sh(gl.VERTEX_SHADER, HD_VERT), fs = sh(gl.FRAGMENT_SHADER, HD_FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    // un triángulo que cubre toda la pantalla
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(prog, 'tex'), 0);
    gl.uniform2f(gl.getUniformLocation(prog, 'size'), cv.width, cv.height);
    gl.viewport(0, 0, this.cv.width, this.cv.height);
    this.cv.addEventListener('webglcontextlost', e => { e.preventDefault(); this.ok = false; this.apply(); });
    this.gl = gl; this.ok = true;
    this.apply();
  },
  // en las pruebas automáticas (navegador sin pantalla) se usa el dibujo normal salvo que se pida #hd=1
  wanted() {
    if (G.save.settings.hd === false || this.autoOff) return false;
    return !(navigator.webdriver && !/hd=1/.test(location.hash));
  },
  apply() {
    this.on = this.ok && this.wanted();
    if (this.cv) this.cv.style.display = this.on ? 'block' : 'none';
    this.avg = 0; this.slowT = 0;
  },
  present() {
    if (!this.on) return;
    const gl = this.gl;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } catch (e) { this.ok = false; this.apply(); return; }
    this.watch();
  },
  watch() {
    const now = performance.now(), dt = now - this.lastT; this.lastT = now;
    if (!(dt > 0 && dt < 200)) return;
    this.avg = this.avg ? this.avg * 0.95 + dt * 0.05 : dt;
    // por debajo de ~35 fps durante 6 s seguidos: se vuelve al dibujo normal
    this.slowT = this.avg > 28 ? this.slowT + dt / 1000 : 0;
    if (this.slowT > 6 && !navigator.webdriver) {
      this.autoOff = true; this.apply();
      Toast.show('Gráficos HD en pausa para ir más fluido (Ajustes)', PAL.sun, 3.5);
    }
  }
};
