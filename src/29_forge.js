// =====================================================================
//  FORJA DEL LUMISABLE (en el Taller de Lía)
//  Mejoras del sable que SON conceptos: se pagan con núcleos de forja
//  (cerraduras de código, repaso diario de cartas y reto del día) y, para
//  forjarlas, hay que demostrar el concepto respondiendo una pregunta.
//  Fallar no cuesta núcleos: se explica el error y llega otra pregunta.
// =====================================================================
const FORGE = [
  { id: 'reach', name: 'Alcance variable', key: 'variables', cost: 2, code: 'alcance ← alcance + 5', desc: 'La hoja llega más lejos: golpeas antes.' },
  { id: 'parry', name: 'Filtro SI', key: 'conditions', cost: 2, code: 'SI llega un disparo → devolver', desc: 'Más margen para devolver disparos.' },
  { id: 'energy', name: 'Bucle de energía', key: 'loops', cost: 2, code: 'MIENTRAS golpeas: energía + 9', desc: 'Cada golpe da 9 de energía (antes 6).' },
  { id: 'pulse', name: 'Función pulso()', key: 'functions', cost: 3, code: 'pulso() cuesta 25', desc: 'El pulso cargado gasta 25 (antes 35).' },
  { id: 'cells', name: 'Lista de células', key: 'arrays', cost: 3, code: 'recargar(células[i]) más rápido', desc: 'Recargar cuesta 40 (antes 50) y es rápido.' },
  { id: 'guard', name: 'Estado GUARDIA', key: 'states', cost: 3, code: 'DAÑO → GUARDIA (1,9 s)', desc: 'Más invulnerable tras recibir un golpe.' },
  { id: 'finisher', name: 'Tajo ordenado', key: 'sorting', cost: 4, code: 'combo[2] → daño + 1', desc: 'El tercer tajo del combo hace +1 de daño.' }
];

class ForgeScene {
  constructor() { this.opaque = false; this.nav = true; this.t = 0; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (Input.hit('back')) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(12,6,4,0.9)');
    panel(g, 10, 4, 460, 262, { border: PAL.orange, accent: PAL.orange, accentW: 80, bg: 'rgba(30,18,14,0.96)' });
    drawText(g, 'FORJA DEL LUMISABLE', 240, 10, PAL.orange, { align: 'center', scale: 2 });
    drawText(g, 'Cada mejora es un concepto: para forjarla, demuestra que lo entiendes.', 240, 28, '#E8C8A0', { align: 'center' });
    // sable que gana brillo con cada mejora
    const n = FORGE.filter(f => forged(f.id)).length, cx = 240, cy = 44;
    for (let i = 0; i < 90; i++) { const k = i / 90; rect(g, cx - 45 + i, cy, 1, 3, mix(PAL.sun, '#FFFFFF', k)); }
    g.globalAlpha = 0.25 + n * 0.08 + Math.sin(this.t * 4) * 0.08; rect(g, cx - 46, cy - 2, 92, 7, PAL.sun); g.globalAlpha = 1;
    rect(g, cx - 56, cy - 1, 11, 5, '#565E8C'); rect(g, cx - 58, cy - 3, 3, 9, '#3A4068');
    const cores = G.save.forgeCores || 0;
    drawText(g, '◆ ' + cores + ' núcleo' + (cores === 1 ? '' : 's'), 460, 40, PAL.aqua, { align: 'right' });
    drawText(g, n + '/' + FORGE.length + ' forjadas', 20, 40, PAL.sun);
    // mejoras
    FORGE.forEach((f, i) => {
      const y = 56 + i * 26, done = forged(f.id), can = !done && cores >= f.cost;
      panel(g, 18, y, 444, 23, { bg: done ? '#2A2410' : '#1A1420', border: done ? PAL.sun : '#5A3A2A', flat: true });
      icon(g, CARD_META[f.key].icon, 24, y + 7);
      drawText(g, f.name, 36, y + 4, done ? PAL.sun : PAL.cream);
      drawText(g, MASTERY_LABELS[f.key], 36, y + 13, '#8C93B8');
      drawText(g, fitText(f.code, 150), 150, y + 4, PAL.lime);
      drawText(g, fitText(f.desc, 210), 150, y + 13, '#C9D2F0');
      const label = done ? '✓ FORJADA' : 'FORJAR ◆' + f.cost;
      if (UI.btn(g, 'fg' + f.id, 370, y + 4, 86, 15, label, { color: done ? PAL.sun : can ? PAL.orange : '#6A5A5A', disabled: done || !can, primary: can, tip: done ? f.desc : can ? 'Responde una pregunta de ' + MASTERY_LABELS[f.key] : 'Te faltan ' + (f.cost - cores) + ' núcleos' })) Scenes.push(new ForgeTrialScene(f));
    });
    drawPara(g, 'Consigue núcleos con cerraduras de código, mini jefes, simuladores, el patio de entrenamiento, el reto del día y repasando tus cartas.', 20, 242, 360, '#8C7A6A', { lh: 10 });
    if (UI.btn(g, 'fgback', 392, 246, 70, 15, 'VOLVER', { color: PAL.teal })) Scenes.pop();
    UI.drawTooltip(g);
  }
}

// prueba de forja: una pregunta del concepto; acertar forja la mejora
class ForgeTrialScene {
  constructor(f) { this.f = f; this.opaque = false; this.nav = true; this.t = 0; this.n = 0; UI.focus = null; this.load(); }
  load() { this.q = cardQuestion(this.f.key, hashStr(this.f.id) + Date.now() % 50000 + this.n * 97); this.pick = -1; this.n++; }
  answer(j) {
    if (this.pick >= 0) return;
    this.pick = j; UI.clicks.clear();
    const f = this.f;
    Registro.log('forja', f.name, this.q.options[j].ok ? 'acierto: mejora forjada' : 'error', '', { concepto: f.key });
    if (this.q.options[j].ok) {
      G.save.forgeCores = Math.max(0, (G.save.forgeCores || 0) - f.cost);
      (G.save.forge = G.save.forge || {})[f.id] = true;
      addMastery(f.key, 3); AudioSys.sfx('fanfare'); FX.flash(PAL.sun, 0.3);
      Particles.burst(240, 60, 30, { colors: [PAL.sun, PAL.orange, PAL.white], min: 30, max: 110, type: 'star', screen: true, layer: 1 });
      Toast.show('⚒ Forjado: ' + f.name, PAL.orange, 3);
      if (FORGE.every(x => forged(x.id))) achieve('smith');
      Save.write();
    } else AudioSys.sfx('fail');
    this.focusN = 3;
  }
  update(dt) {
    this.t += dt;
    if (G.autoDialog) { if (this.pick < 0) this.answer(this.q.options.findIndex(o => o.ok)); else Scenes.pop(); return; }
    if (this.pick < 0) for (let j = 0; j < 3; j++) if (Input.codeHit('Digit' + (j + 1)) || Input.codeHit('Numpad' + (j + 1))) this.answer(j);
    if (Input.hit('back')) { Input.consume(); Scenes.pop(); }
  }
  draw(g) {
    const f = this.f, q = this.q;
    rect(g, 0, 0, W, H, 'rgba(12,6,4,0.85)');
    panel(g, 30, 14, 420, 242, { border: PAL.orange, accent: PAL.orange, accentW: 60, bg: 'rgba(30,18,14,0.97)' });
    drawText(g, 'PRUEBA DE FORJA · ' + f.name.toUpperCase(), 40, 20, PAL.orange);
    drawText(g, MASTERY_LABELS[f.key], 440, 20, '#8C93B8', { align: 'right' });
    let y = 34;
    if (q.code && q.code.length) {
      const ch = q.code.length * 10 + 8;
      panel(g, 40, y, 400, ch, { bg: '#0B1020', border: '#2A3570', flat: true });
      q.code.forEach((ln, i) => { drawText(g, String(i + 1), 52, y + 5 + i * 10, '#565E8C', { align: 'right' }); drawRichLine(g, parseRich(ln, PAL.cream), 58, y + 5 + i * 10); });
      y += ch + 6;
    }
    y += drawPara(g, q.ask, 40, y, 400, PAL.sun, { lh: 10 }) + 6;
    q.options.forEach((o, j) => {
      const bh = Math.max(16, wrapPlain(o.v, 370).length * 10 + 6);
      const col = this.pick < 0 ? PAL.orange : o.ok ? PAL.lime : j === this.pick ? PAL.coral : '#5A3A2A';
      if (UI.btn(g, 'ft' + j, 40, y, 400, bh, '', { color: col, disabled: this.pick >= 0 && !o.ok && j !== this.pick }) && this.pick < 0) this.answer(j);
      drawText(g, String(j + 1), 48, y + Math.floor(bh / 2) - 3, col);
      drawPara(g, o.v, 60, y + 4, 370, this.pick >= 0 && o.ok ? PAL.lime : PAL.cream, { lh: 10 });
      y += bh + 3;
    });
    if (this.pick >= 0) {
      const o = q.options[this.pick];
      drawPara(g, o.ok ? '{g}¡Forjado!{/} ' + f.desc : '{r}Aún no.{/} ' + (o.why || '') + ' No gastaste núcleos: prueba con otra pregunta.', 40, y + 2, 400, PAL.cream, { lh: 10 });
      const id = o.ok ? 'ftdone' : 'ftagain';
      if (UI.btn(g, id, 330, 234, 110, 16, o.ok ? 'VOLVER ▶' : 'OTRA PREGUNTA ↻', { primary: true, color: o.ok ? PAL.lime : PAL.orange })) { if (o.ok) Scenes.pop(); else { this.load(); UI.focus = null; } }
      if (this.focusN > 0) { UI.focus = id; this.focusN--; }
    } else drawText(g, 'Elige con 1 · 2 · 3, el ratón o el dedo', 440, 240, '#8C7A6A', { align: 'right' });
    UI.drawTooltip(g);
  }
}
