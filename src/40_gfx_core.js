// =====================================================================
//  GRÁFICOS 2.5D (HD-2D) · NÚCLEO WEBGL2
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//  Utilidades mínimas escritas a mano (sin motores ni librerías): programas
//  de sombreado, texturas, búferes de fotograma, geometría y la matriz de
//  la luz direccional. El renderizador está en 42_gfx_renderer.js.
// =====================================================================
const GLX = {
  compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); gl.deleteShader(s); throw new Error('sombreador: ' + log); }
    return s;
  },
  // programa con atributos fijos (aP = 0, aT = 1) y mapa de uniformes por nombre
  program(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, this.compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, this.compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aT');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('programa: ' + gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name); }
    return { p, u };
  },
  // textura con almacenamiento fijo (texStorage2D): RGBA8, RGBA16F, DEPTH24...
  tex(gl, w, h, internal, linear) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, internal, w, h);
    const f = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    t.w = w; t.h = h;
    return t;
  },
  fbo(gl, colors, depth) {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    colors.forEach((c, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, c, 0));
    if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    gl.drawBuffers(colors.length ? colors.map((c, i) => gl.COLOR_ATTACHMENT0 + i) : [gl.NONE]);
    if (!colors.length) gl.readBuffer(gl.NONE);
    const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('búfer de fotograma incompleto (' + st + ')');
    const ref = colors[0] || depth;
    f.w = ref.w; f.h = ref.h;
    return f;
  },
  // geometría: vértices (posición de 3 floats + datos de 2 floats) e índices
  mesh(gl, verts, idx) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, vb, ib, n: idx.length };
  },
  free(gl, m) { if (!m) return; gl.deleteBuffer(m.vb); gl.deleteBuffer(m.ib); gl.deleteVertexArray(m.vao); }
};

// Matriz (columna mayor) de la luz direccional: proyección ortográfica alineada
// con la dirección de la luz que abarca la caja visible del diorama. El origen se
// ajusta a múltiplos de un texel para que las sombras no «tiemblen» al avanzar.
function lightMatrix(S, box, size) {
  const n = Math.hypot(S[0], S[1], S[2]), f = [-S[0] / n, -S[1] / n, -S[2] / n];
  const up = Math.abs(f[2]) > 0.95 ? [1, 0, 0] : [0, 0, 1];
  const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const r = nm(cr(up, f)), u = cr(f, r);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const x of [box[0], box[1]]) for (const y of [box[2], box[3]]) for (const z of [box[4], box[5]]) {
    const p = [x, y, z], v = [dot(p, r), dot(p, u), dot(p, f)];
    for (let i = 0; i < 3; i++) { mn[i] = Math.min(mn[i], v[i]); mx[i] = Math.max(mx[i], v[i]); }
  }
  const sx = mx[0] - mn[0], sy = mx[1] - mn[1], sz = mx[2] - mn[2] + 8;
  const tx = sx / size, ty = sy / size;
  const x0 = Math.floor(mn[0] / tx) * tx, y0 = Math.floor(mn[1] / ty) * ty, z0 = mn[2] - 4;
  const ax = 2 / sx, ay = 2 / sy, az = 2 / sz;
  return new Float32Array([
    r[0] * ax, u[0] * ay, f[0] * az, 0,
    r[1] * ax, u[1] * ay, f[1] * az, 0,
    r[2] * ax, u[2] * ay, f[2] * az, 0,
    -x0 * ax - 1, -y0 * ay - 1, -z0 * az - 1, 1
  ]);
}
