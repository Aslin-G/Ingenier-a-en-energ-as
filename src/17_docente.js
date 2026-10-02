// =====================================================================
//  ACCESO AL MODO DOCENTE (con contraseña)
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//  · El MODO DOCENTE (elegir isla, lanzar retos, reiniciar el progreso,
//    revisar la hoja de cálculo) solo se abre con la contraseña del docente.
//  · La contraseña no está escrita en el código: se guarda su huella
//    SHA-256 (con sal y miles de vueltas) y se compara con la que se escribe.
//  · Para cambiarla: node tools/clave-docente.js "NuevaContraseña"
//    y pega aquí la sal y la huella que imprime.
// =====================================================================
const DOCENTE_CLAVE = {
  sal: '9d3c2308580edf2a', vueltas: 5000,
  huellas: ['dc7c8fd83c63ffda8bad71ec012b145805453a35221dc7697dfb39443a59ec10', '85bd8442b07cf9ea1f2c6c661db388ef09378e3af554d97a9014ceddba6484f2']
};
const DOCENTE_MAX_FALLOS = 5, DOCENTE_ESPERA = 30;

// SHA-256 en JavaScript puro (funciona también al abrir el archivo sin servidor)
const SHA_K = (() => {
  const k = [], frac = x => ((x - Math.floor(x)) * 4294967296) | 0;
  for (let n = 2; k.length < 64; n++) { let p = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; } if (p) k.push(frac(Math.cbrt(n))); }
  return k;
})();
function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str), l = bytes.length, nb = (l + 9 + 63) >> 6;
  const w = new Int32Array(nb * 16), m = new Int32Array(64);
  for (let i = 0; i < l; i++) w[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
  w[l >> 2] |= 0x80 << (24 - (l & 3) * 8);
  w[nb * 16 - 1] = l * 8;
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19].map(x => x | 0);
  const r = (x, n) => (x >>> n) | (x << (32 - n));
  for (let b = 0; b < nb; b++) {
    for (let t = 0; t < 64; t++) {
      if (t < 16) m[t] = w[b * 16 + t];
      else { const x = m[t - 15], y = m[t - 2]; m[t] = ((r(x, 7) ^ r(x, 18) ^ (x >>> 3)) + m[t - 7] + (r(y, 17) ^ r(y, 19) ^ (y >>> 10)) + m[t - 16]) | 0; }
    }
    let [a, bb, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + SHA_K[t] + m[t]) | 0;
      const t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
    }
    [a, bb, c, d, e, f, g, hh].forEach((v, i) => { h[i] = (h[i] + v) | 0; });
  }
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
function claveDocenteOk(s) {
  const C = DOCENTE_CLAVE;
  let x = sha256Hex(C.sal + ':' + String(s || '').trim());
  for (let i = 0; i < C.vueltas; i++) x = sha256Hex(x + C.sal);
  return C.huellas.includes(x);
}

class TeacherLockScene {
  constructor() {
    this.opaque = false; this.t = 0; this.err = ''; this.done = false;
    this.prevNav = UI.nav; UI.nav = true; UI.focus = null;
    this.f = { x: 150, y: 126, w: 180, h: 17 };
    this.makeInput();
  }
  makeInput() {
    const stage = document.getElementById('stage') || document.body, f = this.f;
    const el = this.input = document.createElement('input');
    el.type = 'password'; el.maxLength = 40; el.autocomplete = 'off'; el.spellcheck = false;
    el.setAttribute('autocapitalize', 'off'); el.setAttribute('autocorrect', 'off'); el.setAttribute('aria-label', 'Contraseña del docente');
    Object.assign(el.style, {
      position: 'absolute', left: (f.x / W * 100) + '%', top: (f.y / H * 100) + '%', width: (f.w / W * 100) + '%', height: (f.h / H * 100) + '%',
      opacity: '0', border: '0', padding: '0', margin: '0', fontSize: '16px', zIndex: '5', background: 'transparent', color: 'transparent'
    });
    el.addEventListener('input', () => { if (!this.wait()) this.err = ''; });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
      else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    });
    stage.appendChild(el);
    if (Input.lastDevice !== 'touch') setTimeout(() => { if (!this.done && this.input) this.input.focus(); }, 60);
  }
  // tras varios intentos fallidos hay que esperar
  wait() { return Math.max(0, Math.ceil(((TeacherLockScene.until || 0) - Date.now()) / 1000)); }
  removeInput() { if (this.input) this.input.remove(); this.input = null; }
  close() { if (this.done) return; this.done = true; this.removeInput(); UI.nav = this.prevNav; cv.focus(); Scenes.pop(); }
  submit() {
    if (this.done || !this.input) return;
    if (this.wait()) { AudioSys.sfx('warn'); return; }
    if (!this.input.value.trim()) { this.err = 'Escribe la contraseña del docente.'; AudioSys.sfx('warn'); return; }
    if (claveDocenteOk(this.input.value)) {
      TeacherLockScene.fails = 0;
      this.close(); AudioSys.sfx('confirm');
      Scenes.push(new TeacherScene());
      return;
    }
    this.input.value = '';
    TeacherLockScene.fails = (TeacherLockScene.fails || 0) + 1;
    if (TeacherLockScene.fails >= DOCENTE_MAX_FALLOS) { TeacherLockScene.fails = 0; TeacherLockScene.until = Date.now() + DOCENTE_ESPERA * 1000; }
    this.err = 'Contraseña incorrecta.'; AudioSys.sfx('warn');
  }
  typing() { return !!(this.input && document.activeElement === this.input); }
  update(dt) {
    this.t += dt;
    if (!this.done && !this.typing() && Input.hit('back')) { Input.consume(); this.close(); }
  }
  draw(g) {
    if (this.done) return;
    const f = this.f, el = this.input, on = el && document.activeElement === el, n = el ? el.value.length : 0, w = this.wait();
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.72)');
    panel(g, 120, 70, 240, 128, { border: PAL.teal, accent: PAL.sun, accentW: 50 });
    drawText(g, 'MODO DOCENTE', W / 2, 80, PAL.sun, { align: 'center', scale: 2, outline: PAL.ink });
    drawText(g, 'Acceso solo para el docente.', W / 2, 102, '#C9D2F0', { align: 'center' });
    drawText(g, 'CONTRASEÑA', f.x, f.y - 10, on ? PAL.sun : PAL.teal);
    rect(g, f.x, f.y, f.w, f.h, '#0B1020'); strokeRect(g, f.x, f.y, f.w, f.h, on ? PAL.sun : '#3E4C8A');
    const dots = '•'.repeat(Math.min(n, 34));
    if (n) drawText(g, dots, f.x + 5, f.y + 5, PAL.white);
    else if (!on) drawText(g, 'toca aquí para escribirla', f.x + 5, f.y + 5, '#565E8C');
    if (on && Math.floor(this.t * 2.5) % 2 === 0) rect(g, f.x + 5 + Math.min(f.w - 10, n ? textW(dots) + 2 : 0), f.y + 4, 1, 9, PAL.sun);
    if (!on) { const st = UI.register('dc_f', f.x, f.y, f.w, f.h); if (st.focus && Input.lastDevice !== 'mouse' && Input.lastDevice !== 'touch') UI.focusRing(g, f.x, f.y, f.w, f.h); if (UI.clicked('dc_f') && el) el.focus(); }
    const msg = w ? 'Demasiados intentos. Espera ' + w + ' s.' : this.err;
    if (msg) drawText(g, msg, W / 2, 152, PAL.coral, { align: 'center' });
    if (UI.btn(g, 'dc_back', f.x, 172, 80, 16, 'CANCELAR', { color: PAL.teal })) { this.close(); return; }
    if (UI.btn(g, 'dc_go', f.x + f.w - 80, 172, 80, 16, 'ENTRAR', { color: PAL.lime, primary: n > 0 && !w, disabled: !!w })) this.submit();
  }
}
