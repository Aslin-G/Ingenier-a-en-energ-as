// =====================================================================
//  PODERES DEL LUMISABLE: uno nuevo por cada jefe depurado
//  Cada poder ES el concepto de su isla convertido en una forma de jugar:
//  el doble salto es una secuencia (saltar → saltar), el punto de
//  interrupción congela el mundo como un depurador, el pulso doble es una
//  función llamada dos veces... Se presentan con una tarjeta al vencer al
//  jefe y se consultan en Pausa → PODERES.
// =====================================================================
const POWERS = [
  { id: 'djump', boss: 'puerto', name: 'DOBLE SALTO', concept: 'Secuencia', code: 'saltar() → saltar()', desc: 'En el aire, pulsa SALTO otra vez: un segundo salto.', how: 'jump', howText: 'en el aire', color: PAL.teal },
  { id: 'breakpoint', boss: 'valle', name: 'PUNTO DE INTERRUPCIÓN', concept: 'Depuración', code: 'SI células = 1 → pausar(mundo)', desc: 'Al quedarte con 1 célula, el mundo va a cámara lenta 4 s para que puedas reaccionar (una vez por punto de control).', how: null, howText: 'automático', color: PAL.lilac },
  { id: 'sunbeam', boss: 'solaria', name: 'RAYO SOLAR', concept: 'Condicionales', code: 'SI pulso_cargado → daño × 2', desc: 'El pulso cargado se vuelve un rayo más grande que hace el doble de daño.', how: 'attack', howText: 'mantén y suelta', color: PAL.sun },
  { id: 'spin', boss: 'aeris', name: 'TAJO TORBELLINO', concept: 'Bucles', code: 'REPETIR 3 VECES: girar + tajo', desc: 'En el aire, MANTÉN SALTO y pulsa ATAQUE: giras golpeando todo a tu alrededor.', how: 'attack', howText: 'en el aire con SALTO', color: PAL.aqua },
  { id: 'twin', boss: 'hydria', name: 'PULSO DOBLE', concept: 'Funciones', code: 'pulso(delante) · pulso(detrás)', desc: 'El pulso cargado se lanza hacia delante y hacia atrás a la vez.', how: 'attack', howText: 'mantén y suelta', color: PAL.sky },
  { id: 'cell', boss: 'bioloop', name: 'CÉLULA EXTRA', concept: 'Listas', code: 'células.agregar(1)', desc: 'Tu lista de células crece: +1 célula máxima.', how: null, howText: 'siempre activo', color: PAL.lime },
  { id: 'overload', boss: 'gea', name: 'ESTADO SOBRECARGA', concept: 'Estados', code: 'energía = 100 → SOBRECARGA', desc: 'Con la energía llena, el sable entra en SOBRECARGA: brilla y cada golpe hace +1 de daño hasta bajar de 70.', how: null, howText: 'llena la energía', color: PAL.coral },
  { id: 'rush', boss: 'h2', name: 'EMBESTIDA DE LUZ', concept: 'Pipelines', code: 'correr → impulso → tajo', desc: 'Corriendo, pulsa ATAQUE: embistes hacia delante cortando todo y sin recibir daño.', how: 'run', howText: '+ ATAQUE', color: PAL.orange },
  { id: 'seeker', boss: 'bateria', name: 'RAYO BUSCADOR', concept: 'Búsqueda', code: 'objetivo ← enemigo_más_cercano()', desc: 'El pulso cargado busca y persigue al enemigo más cercano.', how: 'attack', howText: 'mantén y suelta', color: PAL.pink },
  { id: 'solar', boss: 'prisma', name: 'RECARGA SOLAR', concept: 'Microred', code: 'MIENTRAS energía < 100: +4/s', desc: 'Tu propia microred: la energía se recarga sola hasta llenarse.', how: null, howText: 'automático', color: PAL.violet }
];
const hasPower = id => !!(G.save.powers && G.save.powers[id]);
const powerOfBoss = key => POWERS.find(p => p.boss === key);
function grantPower(id) {
  G.save.powers = G.save.powers || {};
  if (G.save.powers[id]) return false;
  G.save.powers[id] = true;
  if (POWERS.every(p => G.save.powers[p.id])) achieve('powerful');
  const lv = G.run.level;
  if (id === 'cell' && lv && lv.player) { lv.player.refreshCells(); lv.player.cells = lv.player.maxCells; }
  return true;
}
// partidas anteriores: los jefes ya vencidos dan su poder al cargar
function syncPowers() {
  const got = [];
  for (const p of POWERS) if (flag('boss_' + p.boss) && grantPower(p.id)) got.push(p.name);
  if (got.length) Toast.show('★ Poderes desbloqueados: ' + got.join(', '), PAL.sun, 5);
  return got;
}

// ---------- tarjeta al conseguir un poder ----------
function drawPowerIcon(g, p, x, y, r, t, locked) {
  const col = locked ? '#3A4068' : p.color;
  for (let k = r; k > 3; k -= 4) { g.globalAlpha = locked ? 0.4 : 0.25 + 0.15 * Math.sin(t * 4 + k); pring(g, x, y, k, col); }
  g.globalAlpha = 1;
  pcircle(g, x, y, Math.max(4, r - 8), shade(col, -0.35)); pcircle(g, x, y, Math.max(3, r - 10), col);
  const s = POWERS.indexOf(p);
  // glifo distinto para cada poder
  const gl = ['↑', '⏸', '☀', '↻', '⇄', '♥', '⚡', '»', '◎', '✦'][s] || '★', sc = r >= 26 ? 2 : 1;
  drawText(g, locked ? '?' : gl, x, y - 3 * sc, locked ? '#8C93B8' : PAL.white, { align: 'center', outline: shade(col, -0.6), scale: sc });
}
class PowerCardScene {
  constructor(p, done) { this.p = p; this.done = done; this.t = 0; this.opaque = false; }
  update(dt) {
    this.t += dt;
    if (G.autoDialog) { Scenes.pop(); this.done(true); return; }
    if (this.t > 0.2 && this.t < 0.25) AudioSys.sfx('fanfare');
    if (this.t > 1 && (Input.hit('confirm') || Input.hit('interact') || Input.hit('attack') || Input.pointer.pressed)) { Input.consume(); Scenes.pop(); this.done(true); }
    if (Math.random() < 0.6) Particles.spawn({ x: rand(110, 370), y: rand(50, 210), vy: -24, life: 1, type: 'star', color: this.p.color, screen: true });
  }
  draw(g) {
    const p = this.p, k = easeBack(clamp(this.t * 2, 0, 1));
    g.globalAlpha = Math.min(0.75, this.t * 2); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const w = 320, h = 168, x = (W - w) / 2, y = (H - h) / 2 + (1 - k) * 60;
    panel(g, x, y, w, h, { border: p.color, accent: p.color, accentW: 80 });
    drawPowerIcon(g, p, x + 44, y + 58, 30, this.t, false);
    drawText(g, '¡NUEVO PODER DEL LUMISABLE!', x + 88, y + 12, PAL.cream);
    drawText(g, p.name, x + 88, y + 26, p.color, { scale: p.name.length > 14 ? 1 : 2, outline: '#10162B' });
    drawText(g, 'Concepto: ' + p.concept, x + 88, y + (p.name.length > 14 ? 40 : 46), PAL.sun);
    rect(g, x + 88, y + 58, w - 100, 12, '#0B1020'); drawText(g, p.code, x + 92, y + 61, PAL.lime);
    drawPara(g, p.desc, x + 88, y + 76, w - 100, PAL.cream, { lh: 10 });
    if (p.how) keyHint(g, x + 14, y + h - 22, p.how, p.howText, PAL.cream);
    else drawText(g, p.howText.toUpperCase(), x + 14, y + h - 20, '#8C93B8');
    drawText(g, 'Continuar ▶', x + w - 10, y + h - 20, PAL.lime, { align: 'right' });
    Particles.draw(g, 0, 0, true);
  }
}

// ---------- Pausa → PODERES: los 10 poderes y cómo se consiguen ----------
class PowersScene {
  constructor() { this.opaque = false; this.t = 0; this.sel = 0; }
  update(dt) {
    this.t += dt;
    if (Input.hit('right')) this.sel = (this.sel + 1) % POWERS.length;
    if (Input.hit('left')) this.sel = (this.sel + POWERS.length - 1) % POWERS.length;
    if (Input.hit('down')) this.sel = (this.sel + 5) % POWERS.length;
    if (Input.hit('up')) this.sel = (this.sel + 5) % POWERS.length;
    if (this.t > 0.2 && (Input.hit('back') || Input.hit('pause'))) { Input.consume(); Scenes.pop(); }
    const P = Input.pointer;
    if (P.pressed) POWERS.forEach((p, i) => { const x = 60 + (i % 5) * 90, y = 60 + Math.floor(i / 5) * 64; if (Math.abs(P.x - x) < 43 && P.y > y - 27 && P.y < y + 39) this.sel = i; });
  }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.9)');
    panel(g, 10, 6, 460, 258, { border: PAL.sun, accent: PAL.sun, accentW: 80 });
    const n = POWERS.filter(p => hasPower(p.id)).length;
    drawText(g, 'PODERES DEL LUMISABLE · ' + n + '/' + POWERS.length, 240, 12, PAL.sun, { align: 'center' });
    drawText(g, 'Cada jefe depurado te enseña un poder: su concepto convertido en una forma de jugar.', 240, 24, '#8C93B8', { align: 'center' });
    POWERS.forEach((p, i) => {
      const x = 60 + (i % 5) * 90, y = 60 + Math.floor(i / 5) * 64, on = hasPower(p.id);
      if (this.sel === i) { rect(g, x - 43, y - 27, 86, 66, '#18214A'); strokeRect(g, x - 43, y - 27, 86, 66, PAL.sun); }
      drawPowerIcon(g, p, x, y, 20, this.t + i, !on);
      // nombres largos en dos líneas (cortando por el espacio más cercano al centro)
      const name = on ? p.name : '???';
      if (textW(name) <= 86) drawText(g, name, x, y + 24, on ? p.color : '#565E8C', { align: 'center' });
      else {
        const sp = [...name].map((c, k) => c === ' ' ? k : -1).filter(k => k > 0).sort((a, b) => Math.abs(a - name.length / 2) - Math.abs(b - name.length / 2))[0];
        drawText(g, fitText(name.slice(0, sp), 86), x, y + 22, p.color, { align: 'center' });
        drawText(g, fitText(name.slice(sp + 1), 86), x, y + 31, p.color, { align: 'center' });
      }
    });
    // ficha del poder elegido
    const p = POWERS[this.sel], on = hasPower(p.id), R = REGIONS[regionIdx(p.boss)], D = BOSSES[p.boss];
    panel(g, 22, 176, 436, 70, { bg: '#0B1020', border: on ? p.color : '#2A3570', flat: true });
    drawText(g, on ? p.name : 'PODER BLOQUEADO', 30, 182, on ? p.color : '#8C93B8');
    drawText(g, 'Concepto: ' + p.concept, 450, 182, PAL.sun, { align: 'right' });
    if (on) {
      drawText(g, p.code, 30, 194, PAL.lime);
      drawPara(g, p.desc, 30, 206, 300, PAL.cream, { lh: 10 });
      if (p.how) keyHint(g, 340, 228, p.how, p.howText, PAL.cream); else drawText(g, p.howText, 450, 232, '#8C93B8', { align: 'right' });
    } else drawPara(g, 'Depura a ' + (D ? D.name : 'su jefe') + ' (' + (R ? R.name : '') + ') para conseguirlo.', 30, 198, 410, '#C9D2F0', { lh: 10 });
    drawText(g, '← → elegir · ESC volver', 450, 250, '#565E8C', { align: 'right' });
  }
}
