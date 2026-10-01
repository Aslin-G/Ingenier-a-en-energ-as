// =====================================================================
//  REGISTRO DEL ESTUDIANTE (al empezar una partida)
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//  · Nombres y apellidos (al menos un nombre y un apellido). El primer
//    nombre es el de la protagonista en toda la historia; el nombre
//    completo aparece en los créditos y en el registro para el docente.
//  · Tres consentimientos explícitos (hay que marcar los tres): qué datos
//    se envían y adónde, para qué se usan (ver el rendimiento y calificar)
//    y la autorización del acudiente si el estudiante es menor de edad.
//  · Los campos son <input> reales, transparentes, sobre el lienzo (así
//    funcionan el teclado del móvil, las tildes y la ñ); el juego dibuja el
//    texto con su propia fuente.
// =====================================================================
const CONSENT_VERSION = 'v1';
const CONSENTS = [
  'Acepto que mis datos de juego se envíen a una hoja de cálculo de Google Drive de mi docente: mi nombre completo, mis avances, respuestas, aciertos y errores, logros, objetivos y tiempos de juego.',
  'Entiendo que mi docente usará esa información para ver mi rendimiento y calificarme.',
  'Si soy menor de edad, mi madre, mi padre o mi acudiente conoce y autoriza este registro.'
];
const NAME_CHAR = /[A-Za-zÁÉÍÓÚÑÜáéíóúñü' -]/;
// deja solo letras que la fuente sabe dibujar (ç → c, ã → a...), espacios, guiones y apóstrofos
function cleanNameInput(s) {
  let out = '';
  for (const ch of s) {
    if (NAME_CHAR.test(ch)) out += ch;
    else { const b = ch.normalize('NFD')[0]; if (/[A-Za-z]/.test(b)) out += b; }
  }
  return out.replace(/\s+/g, ' ').replace(/^[ '-]+/, '').slice(0, 30);
}
const NAME_SMALL = ['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'do', 'dos', 'van', 'von'];
function nameCase(s) {
  return s.trim().toLowerCase().split(' ').filter(Boolean)
    .map((w, i) => i > 0 && NAME_SMALL.includes(w) ? w : w.replace(/(^|[-'])([a-záéíóúñü])/g, (m, a, b) => a + b.toUpperCase()))
    .join(' ');
}
// palabras con al menos dos letras
const nameWords = s => s.trim().split(' ').filter(w => (w.match(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/g) || []).length >= 2);
function makePlayer(nombres, apellidos) {
  const n = nameCase(nombres), a = nameCase(apellidos), w = nameWords(n);
  return {
    nombres: n, apellidos: a, full: n + ' ' + a, hero: (w[0] || n).slice(0, 12),
    id: 'est-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    consent: { ok: true, at: new Date().toISOString(), version: CONSENT_VERSION, items: CONSENTS.slice() }
  };
}

class RegisterScene {
  constructor(onDone, mode = 'new') {
    this.onDone = onDone; this.mode = mode; this.opaque = true; this.t = 0; this.err = ''; this.done = false;
    this.checks = CONSENTS.map(() => false);
    this.prevNav = UI.nav; UI.nav = true; UI.focus = null;
    this.bg = getBackground('festival');
    this.fields = [
      { id: 'nombres', label: 'NOMBRES', x: 44, y: 61, w: 230, h: 17, ph: 'p. ej. Ana María' },
      { id: 'apellidos', label: 'APELLIDOS', x: 44, y: 93, w: 230, h: 17, ph: 'p. ej. Pérez Gómez' }
    ];
    this.makeInputs();
  }
  makeInputs() {
    const stage = document.getElementById('stage') || document.body;
    this.inputs = this.fields.map((f, i) => {
      const el = document.createElement('input');
      el.type = 'text'; el.maxLength = 30; el.autocomplete = 'off'; el.spellcheck = false;
      el.setAttribute('autocapitalize', 'words'); el.setAttribute('aria-label', f.label);
      Object.assign(el.style, {
        position: 'absolute', left: (f.x / W * 100) + '%', top: (f.y / H * 100) + '%', width: (f.w / W * 100) + '%', height: (f.h / H * 100) + '%',
        opacity: '0', border: '0', padding: '0', margin: '0', fontSize: '16px', zIndex: '5', background: 'transparent', color: 'transparent'
      });
      el.addEventListener('input', () => { const c = cleanNameInput(el.value); if (c !== el.value) el.value = c; this.err = ''; });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); if (i === 0) this.inputs[1].focus(); else { el.blur(); cv.focus(); UI.focus = 'rg_c0'; } }
        else if (e.key === 'Escape') { el.blur(); cv.focus(); }
      });
      stage.appendChild(el);
      return el;
    });
    if (Input.lastDevice !== 'touch') setTimeout(() => { if (!this.done && this.inputs) this.inputs[0].focus(); }, 60);
  }
  removeInputs() { if (this.inputs) for (const el of this.inputs) el.remove(); this.inputs = null; }
  val(i) { return this.inputs ? this.inputs[i].value : ''; }
  problem() {
    if (!nameWords(this.val(0)).length) return 'Escribe al menos un nombre (dos letras o más).';
    if (!nameWords(this.val(1)).length) return 'Escribe al menos un apellido (dos letras o más).';
    if (!this.checks.every(Boolean)) return 'Para empezar, marca las tres casillas del consentimiento.';
    return '';
  }
  submit() {
    const pr = this.problem();
    if (pr) { this.err = pr; AudioSys.sfx('warn'); return; }
    const player = makePlayer(this.val(0), this.val(1));
    this.done = true; this.removeInputs(); UI.nav = this.prevNav; cv.focus();
    AudioSys.sfx('confirm');
    this.onDone(player);
  }
  close() { this.done = true; this.removeInputs(); UI.nav = this.prevNav; cv.focus(); Scenes.pop(); }
  typing() { return !!(this.inputs && this.inputs.includes(document.activeElement)); }
  update(dt) {
    this.t += dt;
    if (this.done) return;
    if (!this.typing() && Input.hit('back')) { Input.consume(); this.close(); }
  }
  draw(g) {
    if (this.done && !this.inputs) { rect(g, 0, 0, W, H, '#10162B'); return; }
    g.drawImage(this.bg.sky, 0, 0, W, H);
    this.bg.layers.forEach(L => g.drawImage(L.c, -Math.round((this.t * 6 * L.p * 3) % 960), 0));
    rect(g, 0, 0, W, H, 'rgba(10,14,32,0.55)');
    panel(g, 24, 8, 432, 254, { border: PAL.teal, accent: PAL.sun, accentW: 60 });
    drawText(g, this.mode === 'continue' ? 'ANTES DE CONTINUAR' : 'REGISTRO DEL ESTUDIANTE', W / 2, 14, PAL.sun, { align: 'center', scale: 2, outline: PAL.ink });
    drawText(g, this.mode === 'continue' ? 'Esta partida aún no tiene estudiante: regístrate para seguir.' : 'Escribe tu nombre completo: así te llamarás en la historia.', W / 2, 36, '#C9D2F0', { align: 'center' });
    // campos de texto (los dibuja el juego; debajo hay un <input> real transparente)
    this.fields.forEach((f, i) => {
      const el = this.inputs && this.inputs[i], on = el && document.activeElement === el, v = this.val(i);
      drawText(g, f.label, f.x, f.y - 10, on ? PAL.sun : PAL.teal);
      rect(g, f.x, f.y, f.w, f.h, '#0B1020'); strokeRect(g, f.x, f.y, f.w, f.h, on ? PAL.sun : '#3E4C8A');
      if (v) drawText(g, fitText(v, f.w - 10), f.x + 5, f.y + 5, PAL.white);
      else if (!on) drawText(g, f.ph, f.x + 5, f.y + 5, '#565E8C');
      if (on && Math.floor(this.t * 2.5) % 2 === 0) { const cx = f.x + 5 + Math.min(f.w - 10, v ? textW(v) + 2 : 0); rect(g, cx, f.y + 4, 1, 9, PAL.sun); }
      if (!on) { const st = UI.register('rg_f' + i, f.x, f.y, f.w, f.h); if (st.focus && Input.lastDevice !== 'mouse' && Input.lastDevice !== 'touch') UI.focusRing(g, f.x, f.y, f.w, f.h); if (UI.clicked('rg_f' + i) && el) el.focus(); }
    });
    // vista previa: así se llamará la protagonista
    panel(g, 290, 50, 150, 62, { border: '#3E4C8A' });
    drawText(g, 'ASÍ TE LLAMARÁS', 365, 55, '#8C93B8', { align: 'center' });
    const F = Spr.lia.idle[liaIdleFrame(this.t)];
    if (F.rh) g.drawImage(F.rh, 300, 106 - F.r.height, F.r.width, F.r.height); else g.drawImage(F.r, 300, 106 - F.r.height);
    const w = nameWords(nameCase(this.val(0))), hero = w.length ? w[0].slice(0, 12) : '';
    drawText(g, hero ? fitText(hero, 104) : '...', 374, 74, hero ? PAL.sun : '#565E8C', { align: 'center', scale: hero && textW(hero) * 2 <= 104 ? 2 : 1 });
    if (hero && nameWords(nameCase(this.val(1))).length) drawText(g, fitText(nameCase(this.val(0)) + ' ' + nameCase(this.val(1)), 104), 374, 96, '#C9D2F0', { align: 'center' });
    // consentimientos
    drawText(g, 'CONSENTIMIENTO · marca las tres casillas', 44, 120, PAL.teal);
    let y = 131;
    CONSENTS.forEach((c, i) => {
      const lines = wrapRich(c, 380).length, h = lines * 9;
      const st = UI.register('rg_c' + i, 40, y - 2, 404, h + 3);
      if (UI.clicked('rg_c' + i)) { this.checks[i] = !this.checks[i]; this.err = ''; AudioSys.sfx('select'); }
      rect(g, 44, y, 9, 9, '#0B1020'); strokeRect(g, 44, y, 9, 9, this.checks[i] ? PAL.lime : st.hover || st.focus ? PAL.sun : '#8C93B8');
      if (this.checks[i]) drawText(g, '✓', 46, y + 1, PAL.lime);
      drawPara(g, c, 58, y + 1, 380, this.checks[i] ? PAL.cream : '#C9D2F0', { lh: 9 });
      if (st.focus && Input.lastDevice !== 'mouse' && Input.lastDevice !== 'touch') UI.focusRing(g, 40, y - 2, 404, h + 3);
      y += h + 6;
    });
    if (this.err) drawText(g, this.err, W / 2, 224, PAL.coral, { align: 'center' });
    if (UI.btn(g, 'rg_back', 44, 238, 70, 16, 'VOLVER', { color: PAL.teal })) { this.close(); return; }
    if (UI.btn(g, 'rg_go', 320, 238, 120, 16, 'COMENZAR ▶', { color: PAL.lime, primary: !this.problem() })) this.submit();
    UI.drawTooltip(g);
  }
}
