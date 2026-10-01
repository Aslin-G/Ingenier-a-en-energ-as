// =====================================================================
//  PUZZLES ESPECIALES (B): ordenar/buscar, microred, objetivo, predicción,
//  y los editores rápidos de habilidades (Step Spark, IF Shield)
// =====================================================================

// ---------------------------------------------------------------------
//  ORDENAMIENTO (burbuja "siendo el algoritmo") y BÚSQUEDA BINARIA
// ---------------------------------------------------------------------
class SortScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.arr = cfg.items.map(x => Object.assign({}, x));
    this.i = 0; this.end = this.arr.length - 1; this.pass = 1; this.swapped = false; this.comps = 0; this.swaps = 0; this.mistakes = 0;
    this.anim = null; this.found = null; this.inspected = [];
    this.lo = 0; this.hi = this.arr.length - 1;
    if (cfg.mode === 'search') this.say(cfg.intro || `Encuentra el registro de las ${cfg.target}. Los registros están ORDENADOS por hora. Toca uno para abrirlo.`);
    else this.say(cfg.intro || 'Compara el par marcado: ¿hay que INTERCAMBIARLOS o DEJARLOS?');
  }
  key(x) { return x[this.cfg.key]; }
  shouldSwap(a, b) { return this.cfg.desc ? this.key(a) < this.key(b) : this.key(a) > this.key(b); }
  decide(swap) {
    if (this.state === 'success' || this.anim) return;
    const a = this.arr[this.i], b = this.arr[this.i + 1];
    const need = this.shouldSwap(a, b);
    this.comps++;
    if (swap !== need) {
      this.mistakes++; this.fails++; FX.shake(2, 0.2); AudioSys.sfx('error');
      this.say(`✗ ${this.cfg.fmt(a)} vs ${this.cfg.fmt(b)}: ${need ? 'están al revés, había que INTERCAMBIAR' : 'ya estaban en orden, no hacía falta intercambiar'} (${this.cfg.desc ? 'de mayor a menor' : 'de menor a mayor'}).`, PAL.coral);
      if (this.mistakes >= 3 && this.hintLevel === 0) this.msg += ' Prueba la PISTA.';
      return; // el jugador vuelve a decidir sobre el mismo par
    }
    if (swap) { this.anim = { i: this.i, t: 0 }; this.swaps++; this.swapped = true; AudioSys.sfx('swap'); }
    else AudioSys.sfx('ok');
    this.say(`${swap ? 'Intercambiados' : 'Se quedan'}: comparaciones = ${this.comps}, intercambios = ${this.swaps}.`, PAL.cream);
    if (!swap) this.advance();
  }
  advance() {
    this.i++;
    if (this.i >= this.end) {
      if (!this.swapped) return this.sortedDone();
      this.end--; this.i = 0; this.pass++; this.swapped = false;
      this.say(`Pasada ${this.pass}. El último elemento ya quedó en su lugar (■).`, PAL.sky);
      if (this.end <= 0) return this.sortedDone();
    }
  }
  sortedDone() {
    if (this.cfg.onSorted) this.cfg.onSorted(this);
    if (this.comps <= (this.cfg.goodComps || 99) && this.mistakes === 0) achieve('sorter');
    this.succeeded(this.cfg.okMsg || `¡Ordenado! ${this.comps} comparaciones, ${this.swaps} intercambios, ${this.pass} pasadas.`);
  }
  inspect(k) {
    if (this.state === 'success' || this.inspected.includes(k)) return;
    this.inspected.push(k); this.comps++;
    const v = this.key(this.arr[k]), T = this.cfg.targetVal;
    AudioSys.sfx('select');
    if (v === T) { this.found = k; this.succeeded(this.inspected.length <= this.cfg.limit ? `¡Encontrado en ${this.inspected.length} intentos! Eso es BÚSQUEDA BINARIA: cada intento descarta la mitad.` : `Encontrado, pero con ${this.inspected.length} intentos.`, { tries: this.inspected.length }); if (this.cfg.onFound) this.cfg.onFound(this); return; }
    if (v < T) this.lo = Math.max(this.lo, k + 1); else this.hi = Math.min(this.hi, k - 1);
    this.say(`${this.cfg.fmt(this.arr[k])} es ${v < T ? 'ANTES' : 'DESPUÉS'} de lo que buscas → descarta ${v < T ? 'la izquierda' : 'la derecha'}. Intentos: ${this.inspected.length}.`, PAL.cream);
    if (this.inspected.length >= this.cfg.limit + 1 && !this.found) {
      this.failed(`Demasiados intentos (${this.inspected.length}). Con ${this.arr.length} registros ordenados bastan ${this.cfg.limit}: abre siempre el del MEDIO del rango que queda.`);
      this.inspected = []; this.lo = 0; this.hi = this.arr.length - 1; this.state = 'edit';
    }
  }
  tick(dt) {
    if (this.anim) { this.anim.t += dt * 3; if (this.anim.t >= 1) { const i = this.anim.i; [this.arr[i], this.arr[i + 1]] = [this.arr[i + 1], this.arr[i]]; this.anim = null; this.advance(); } }
  }
  draw(g) {
    this.drawHeader(g, this.cfg.mode === 'search' ? 'BÚSQUEDA' : 'ORDENAMIENTO');
    panel(g, 6, 22, W - 12, 172, { border: '#2A3570', bg: '#120C34' });
    for (let k = 0; k < 30; k++) px(g, 10 + (k * 53) % (W - 20), 26 + (k * 29) % 60, '#FFFFFF');
    const n = this.arr.length, cw = Math.min(56, Math.floor((W - 30) / n)), ox = Math.round((W - n * cw) / 2);
    this.arr.forEach((it, k) => {
      let x = ox + k * cw;
      if (this.anim && (k === this.anim.i || k === this.anim.i + 1)) { const d = k === this.anim.i ? 1 : -1; x += d * cw * easeInOut(this.anim.t); }
      const y = 40;
      if (this.cfg.mode === 'search') {
        const open = this.inspected.includes(k) || this.found === k, out = k < this.lo || k > this.hi;
        const st = UI.register('it' + k, x + 2, y + 20, cw - 4, 90);
        rect(g, x + 2, y + 20, cw - 4, 90, this.found === k ? '#2A6A2A' : open ? '#2A3570' : out ? '#10162B' : st.hover || st.focus ? '#3A3A7A' : '#22306B');
        strokeRect(g, x + 2, y + 20, cw - 4, 90, this.found === k ? PAL.lime : out ? '#1E2748' : '#565E8C');
        drawText(g, '#' + k, x + cw / 2, y + 24, '#8C93B8', { align: 'center' });
        if (open) { drawText(g, this.cfg.fmt(it), x + cw / 2, y + 50, this.found === k ? PAL.lime : PAL.sun, { align: 'center' }); }
        else drawText(g, out ? '·' : '?', x + cw / 2, y + 50, out ? '#3A4068' : PAL.cream, { align: 'center' });
        if (UI.clicked('it' + k)) this.inspect(k);
        if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, x + 2, y + 20, cw - 4, 90);
        return;
      }
      const v = this.key(it), max = this.cfg.max || 100;
      const hh = Math.round(90 * v / max);
      const col = this.cfg.color ? this.cfg.color(it) : v > 60 ? PAL.lime : v > 25 ? PAL.sun : PAL.coral;
      const settled = k > this.end || this.state === 'success';
      rect(g, x + cw / 2 - 4, y + 12, 8, 4, '#8A8FB0');
      rect(g, x + 4, y + 16, cw - 8, 100, '#2A2F6A'); rect(g, x + 7, y + 113 - hh, cw - 14, hh, col);
      strokeRect(g, x + 4, y + 16, cw - 8, 100, settled ? PAL.lime : '#565E8C');
      drawText(g, this.cfg.fmt(it), x + cw / 2, y + 60, PAL.white, { align: 'center', outline: PAL.ink });
      drawText(g, it.name, x + cw / 2, y + 120, settled ? PAL.lime : PAL.cream, { align: 'center' });
      if (this.cfg.sub) drawText(g, this.cfg.sub(it), x + cw / 2, y + 131, '#8C93B8', { align: 'center' });
      if (settled && k > this.end) drawText(g, '■', x + cw / 2, y + 4, PAL.lime, { align: 'center' });
    });
    if (this.cfg.mode !== 'search' && this.state !== 'success') {
      const x = ox + this.i * cw;
      strokeRect(g, x + 1, 36, cw * 2 - 2, 136, Math.floor(this.t * 4) % 2 ? PAL.sun : '#8A6A2A');
      drawText(g, '¿' + this.cfg.fmt(this.arr[this.i]) + (this.cfg.desc ? ' < ' : ' > ') + this.cfg.fmt(this.arr[this.i + 1]) + '?', x + cw, 26, PAL.sun, { align: 'center', outline: PAL.ink });
    }
    // búsqueda binaria: el rango que queda [lo, hi] y su MEDIO
    if (this.cfg.mode === 'search' && this.state !== 'success' && this.lo <= this.hi) {
      const x0 = ox + this.lo * cw + 2, x1 = ox + (this.hi + 1) * cw - 2, by = 154, mid = Math.floor((this.lo + this.hi) / 2);
      rect(g, x0, by, x1 - x0, 1, PAL.sky); rect(g, x0, by - 3, 1, 4, PAL.sky); rect(g, x1 - 1, by - 3, 1, 4, PAL.sky);
      drawText(g, 'quedan ' + (this.hi - this.lo + 1), (x0 + x1) / 2, by + 3, PAL.sky, { align: 'center' });
      if (this.inspected.length || this.hintLevel > 0) {
        drawText(g, '▲', ox + mid * cw + cw / 2, by - 10, PAL.sun, { align: 'center' });
        drawText(g, 'lo = ' + this.lo + ' · hi = ' + this.hi + ' · medio = (' + this.lo + ' + ' + this.hi + ') ÷ 2 = ' + mid, W / 2, 172, '#C9D2F0', { align: 'center' });
      }
    }
    const info = this.cfg.mode === 'search' ? `buscando: ${this.cfg.target} · intentos: ${this.inspected.length}/${this.cfg.limit}` : `pasada ${this.pass} · comparaciones ${this.comps} · intercambios ${this.swaps} · errores ${this.mistakes}`;
    drawText(g, info, W / 2, 184, PAL.aqua, { align: 'center' });
    if (this.state === 'success' && this.cfg.after) this.cfg.after(g, this);
    const btns = [];
    if (this.cfg.mode !== 'search' && !this.result) {
      btns.push({ id: 'swap', w: 86, label: '⇄ INTERCAMBIAR', primary: true, color: PAL.pink, fn: () => this.decide(true) });
      btns.push({ id: 'keep', w: 60, label: '✓ DEJAR', color: PAL.lime, fn: () => this.decide(false) });
    }
    this.drawFooter(g, btns);
  }
}

// ---------------------------------------------------------------------
//  SIMULADOR DE MICRORED (reglas ordenadas + 24 h con eventos)
// ---------------------------------------------------------------------
const MG_CONDS = {
  excedente: { label: 'hay excedente', f: s => s.net > 0.01 },
  deficit: { label: 'hay déficit', f: s => s.net < -0.01 },
  soc_bajo: { label: 'batería < 30%', f: s => s.soc < 30 },
  soc_alto: { label: 'batería > 80%', f: s => s.soc > 80 },
  h2_hay: { label: 'hay H2 > 5', f: s => s.h2 > 5 },
  noche: { label: 'es de noche', f: s => s.hour < 6 || s.hour >= 19 },
  festival: { label: 'evento festival', f: s => s.event === 'festival' },
  siempre: { label: 'SIEMPRE', f: s => true }
};
const MG_ACTS = {
  cargar_bateria: { label: 'cargar batería', short: 'cargar bat.', col: PAL.lime },
  usar_bateria: { label: 'usar batería (reserva 15%)', short: 'usar bat.', col: PAL.lime },
  usar_bateria_todo: { label: 'usar batería hasta 0%', short: 'bat. a 0%', col: PAL.coral },
  electrolizar: { label: 'producir H2', short: 'producir H2', col: PAL.aqua },
  pila_h2: { label: 'usar pila de H2', short: 'pila de H2', col: PAL.pink },
  hidro_extra: { label: 'abrir embalse', short: 'embalse', col: PAL.sky },
  recortar: { label: 'recortar cargas no críticas', short: 'recortar', col: PAL.orange },
  verter: { label: 'verter (desperdiciar)', short: 'verter', col: '#8C93B8' }
};
function mgSimulate(sc, rules, opts = {}) {
  const hours = 24, cap = sc.batCap || 40;
  const S = { soc: sc.soc0 != null ? sc.soc0 : 50, h2: sc.h20 != null ? sc.h20 : 10, reservoir: sc.reservoir != null ? sc.reservoir : 8, hour: 0, net: 0, event: null };
  const out = { hours: [], blackout: 0, unmet: 0, wasted: 0, genTotal: 0, minSoc: 100, safety: 0, cut: 0, share: {}, served: 0, demand: 0 };
  for (let h = 0; h < hours; h++) {
    S.hour = h; S.event = (sc.events || {})[h] || null;
    const w = sc.weather[h];
    const sunK = Math.max(0, Math.sin((h - 6) / 13 * Math.PI));
    const solar = (sc.solar || 0) * sunK * (w === 'sol' ? 1 : w === 'nube' ? 0.3 : w === 'lluvia' ? 0.12 : 1) * (S.event === 'eclipse' ? 0.1 : 1);
    const wv = sc.wind[h];
    const wind = (sc.windCap || 0) * clamp(Math.pow(Math.max(0, wv - 3) / 9, 2), 0, 1) * (S.event === 'calma' ? 0 : 1);
    const hydro = (sc.hydro || 0) * (w === 'lluvia' ? 1.3 : 1) * (S.event === 'sequia' ? 0.3 : 1);
    let dem = sc.demand[h] * (S.event === 'festival' ? 1.6 : 1);
    const gen = solar + wind + hydro;
    S.net = gen - dem;
    const flows = { solar, wind, hydro, bat: 0, h2: 0, extra: 0, charge: 0, elec: 0 };
    let batUnavail = S.event === 'bateria_fuera';
    for (const r of rules) {
      if (!r.cond || !r.act) continue;
      if (!MG_CONDS[r.cond].f(S)) continue;
      switch (r.act) {
        case 'cargar_bateria': if (S.net > 0 && !batUnavail) { const c = Math.min(S.net, (100 - S.soc) / 100 * cap, 8); S.soc += c * 0.92 / cap * 100; S.net -= c; flows.charge += c; } break;
        case 'electrolizar': if (S.net > 0) { const c = Math.min(S.net, 6); S.h2 += c * 0.65; S.net -= c; flows.elec += c; } break;
        case 'usar_bateria': case 'usar_bateria_todo': if (S.net < 0 && !batUnavail) { const floor = r.act === 'usar_bateria' ? 15 : 0; const avail = Math.max(0, (S.soc - floor) / 100 * cap); const d = Math.min(-S.net, avail, 8); S.soc -= d / cap * 100; S.net += d * 0.95; flows.bat += d * 0.95; if (S.soc < 10) out.safety++; } break;
        case 'pila_h2': if (S.net < 0) { const d = Math.min(-S.net, S.h2 * 0.55, 5); S.h2 -= d / 0.55; S.net += d; flows.h2 += d; } break;
        case 'hidro_extra': if (S.net < 0) { const d = Math.min(-S.net, S.reservoir, 3); S.reservoir -= d; S.net += d; flows.extra += d; } break;
        case 'recortar': if (S.net < 0) { const d = Math.min(-S.net, dem * 0.25); S.net += d; out.cut += d; dem -= d; } break;
        case 'verter': if (S.net > 0) { out.wasted += S.net; S.net = 0; } break;
      }
    }
    if (S.net > 0.01) { out.wasted += S.net; }
    let unmet = 0;
    if (S.net < -0.05) { unmet = -S.net; out.unmet += unmet; out.blackout++; }
    out.minSoc = Math.min(out.minSoc, S.soc);
    out.genTotal += gen;
    out.demand += dem; out.served += dem - unmet;
    const deliver = { solar: Math.max(0, solar), eólica: wind, hidro: hydro + flows.extra, batería: flows.bat, hidrógeno: flows.h2 };
    for (const k in deliver) out.share[k] = (out.share[k] || 0) + deliver[k];
    out.hours.push({ h, solar, wind, hydro, bat: flows.bat, h2f: flows.h2, extra: flows.extra, dem, unmet, soc: S.soc, h2: S.h2, w, wv, event: S.event, charge: flows.charge, elec: flows.elec });
  }
  const tot = Object.values(out.share).reduce((a, b) => a + b, 0) || 1;
  out.maxShareKey = Object.keys(out.share).reduce((a, b) => out.share[a] > out.share[b] ? a : b);
  out.maxShare = out.share[out.maxShareKey] / tot;
  out.wastePct = out.genTotal ? out.wasted / out.genTotal * 100 : 0;
  return out;
}
class MicrogridScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.rules = cloneProg(cfg.rules || [{ cond: 'excedente', act: 'cargar_bateria' }, { cond: 'deficit', act: 'usar_bateria' }]);
    this.sc = cfg.scenario; this.res = null; this.showH = 0; this.animating = false; this.compare = [];
    this.scIdx = 0;
    this.say(cfg.intro || 'Ordena las reglas: se evalúan de ARRIBA a ABAJO cada hora.');
  }
  run() {
    this.runs++;
    const scs = this.cfg.scenarios || [this.sc];
    this.results = scs.map(s => mgSimulate(s, this.rules));
    this.scIdx = 0; this.res = this.results[0]; this.showH = 0; this.animating = true; this.state = 'running';
    AudioSys.sfx('run'); this.say('Simulando 24 horas...');
  }
  evaluate() {
    const C = this.cfg.criteria || {};
    const fails = [];
    this.results.forEach((r, i) => {
      const name = (this.cfg.scenarios || [this.sc])[i].name || 'día';
      if (C.maxBlackout != null && r.blackout > C.maxBlackout) fails.push(`${name}: ${r.blackout} h de apagón (máx ${C.maxBlackout}).`);
      if (C.maxWaste != null && r.wastePct > C.maxWaste) fails.push(`${name}: se desperdició ${Math.round(r.wastePct)}% (máx ${C.maxWaste}%).`);
      if (C.noSafety && r.safety > 0) fails.push(`${name}: la batería bajó de su reserva segura ${r.safety} veces.`);
      if (C.maxShare != null && r.maxShare > C.maxShare) fails.push(`${name}: ${Math.round(r.maxShare * 100)}% vino de ${r.maxShareKey}. Dependes demasiado de una fuente.`);
      if (C.maxCut != null && r.cut > C.maxCut) fails.push(`${name}: recortaste demasiado consumo (${Math.round(r.cut)} kWh). Las personas también cuentan.`);
    });
    if (this.cfg.sandbox) { this.compare.push({ rules: cloneProg(this.rules), res: this.results[0] }); if (this.compare.length > 3) this.compare.shift(); if (this.compare.length >= 3) achieve('lab'); this.state = 'edit'; this.say('Experimento guardado. Compara resultados abajo a la derecha.', PAL.sun); return; }
    if (fails.length) this.failed(fails[0] + (fails.length > 1 ? ` (+${fails.length - 1} problema${fails.length > 2 ? 's' : ''})` : ''));
    else { achieve('microgrid'); this.succeeded(this.cfg.okMsg || '¡La microred resiste! Ninguna fuente sola lo resolvía: la clave fue combinarlas.'); }
  }
  tick(dt) {
    if (!this.animating) return;
    this.showH += dt * (G.save.settings.noTimer ? 10 : 14);
    if (this.showH >= 24) {
      this.scIdx++;
      if (this.scIdx < this.results.length) { this.res = this.results[this.scIdx]; this.showH = 0; return; }
      this.animating = false; this.showH = 24; this.res = this.results[0]; this.scIdx = 0; this.evaluate();
    }
    if (Math.floor(this.showH) !== this.lastH) { this.lastH = Math.floor(this.showH); AudioSys.sfx('tick', this.lastH % 12); }
  }
  draw(g) {
    this.drawHeader(g, this.cfg.sandbox ? 'AURORA LAB' : 'MICRORED');
    // reglas
    panel(g, 4, 20, 196, 204, { border: '#2A3570' });
    drawText(g, 'REGLAS (de arriba a abajo)', 10, 25, PAL.sun);
    const editable = !this.animating && !this.result;
    this.rules.forEach((r, i) => {
      const y = 38 + i * 20;
      rect(g, 8, y, 188, 18, '#1A2248'); drawText(g, (i + 1) + '.', 11, y + 6, '#8C93B8');
      drawText(g, 'SI', 22, y + 6, PAL.orange);
      if (UI.btn(g, 'rc' + i, 34, y + 2, 66, 14, MG_CONDS[r.cond] ? MG_CONDS[r.cond].label : '?', { color: PAL.orange, disabled: !editable })) this.popup = { title: 'Condición', options: (this.cfg.conds || Object.keys(MG_CONDS)).map(k => ({ label: MG_CONDS[k].label, value: k })), onPick: v => r.cond = v, x: 40, y: y + 16 };
      drawText(g, '→', 101, y + 6, '#8C93B8');
      if (UI.btn(g, 'ra' + i, 108, y + 2, 61, 14, MG_ACTS[r.act] ? MG_ACTS[r.act].short : '?', { color: MG_ACTS[r.act] ? MG_ACTS[r.act].col : PAL.teal, disabled: !editable, tip: MG_ACTS[r.act] && MG_ACTS[r.act].label })) this.popup = { title: 'Acción', options: (this.cfg.acts || Object.keys(MG_ACTS)).map(k => ({ label: MG_ACTS[k].label, value: k })), onPick: v => r.act = v, x: 100, y: y + 16 };
      if (editable) {
        if (i > 0 && UI.btn(g, 'ru' + i, 170, y + 2, 12, 7, '▲', { color: PAL.sky })) { [this.rules[i - 1], this.rules[i]] = [this.rules[i], this.rules[i - 1]]; AudioSys.sfx('swap'); }
        if (i < this.rules.length - 1 && UI.btn(g, 'rd' + i, 170, y + 9, 12, 7, '▼', { color: PAL.sky })) { [this.rules[i + 1], this.rules[i]] = [this.rules[i], this.rules[i + 1]]; AudioSys.sfx('swap'); }
        if (UI.btn(g, 'rx' + i, 184, y + 2, 10, 14, '✗', { color: PAL.coral })) { this.rules.splice(i, 1); AudioSys.sfx('remove'); }
      }
    });
    const maxR = this.cfg.maxRules || 8;
    if (editable && this.rules.length < maxR && UI.btn(g, 'radd', 8, 38 + this.rules.length * 20, 90, 14, '+ AÑADIR REGLA', { color: PAL.lime })) { this.rules.push({ cond: 'deficit', act: 'usar_bateria' }); AudioSys.sfx('place'); if (this.state !== 'edit') this.state = 'edit'; }
    // gráfico
    const R = this.res;
    panel(g, 204, 20, 272, 128, { border: '#2A3570', bg: '#0B1020' });
    const sc = (this.cfg.scenarios || [this.sc])[this.scIdx] || this.sc;
    drawText(g, 'ESCENARIO: ' + (sc.name || 'día típico'), 210, 25, PAL.sun);
    const gx = 212, gy = 40, gw = 256, gh = 84, bw = gw / 24;
    const maxY = Math.max(...sc.demand.map((d, h) => d * ((sc.events || {})[h] === 'festival' ? 1.6 : 1))) * 1.3 || 10;
    for (let h = 0; h < 24; h++) {
      const x = gx + h * bw;
      const w = sc.weather[h];
      rect(g, x, gy - 2, bw - 1, 2, w === 'sol' ? PAL.sun : w === 'nube' ? '#C9D2F0' : '#59C7FF');
      if ((sc.events || {})[h]) { rect(g, x, gy, bw - 1, gh, 'rgba(255,127,207,0.12)'); }
      // previsión: la demanda esperada (punteada) para pensar las reglas antes de simular
      if (!R || h >= this.showH) {
        const fd = sc.demand[h] * ((sc.events || {})[h] === 'festival' ? 1.6 : 1), fy = gy + gh - fd / maxY * gh;
        for (let k = 0; k < bw - 1; k += 2) px(g, x + k, fy, '#8C93B8');
        if (w === 'sol' && h >= 7 && h <= 18) { const sh = Math.sin((h - 6) / 13 * Math.PI) * gh * 0.5; for (let k = 0; k < bw - 1; k += 3) px(g, x + k, gy + gh - sh, '#8A7A2A'); }
        continue;
      }
      const d = R.hours[h];
      let yy = gy + gh;
      const seg = (v, c) => { const hh = v / maxY * gh; rect(g, x, yy - hh, bw - 1, hh, c); yy -= hh; };
      seg(d.solar, PAL.sun); seg(d.wind, PAL.aqua); seg(d.hydro + d.extra, PAL.sky); seg(d.bat, PAL.lime); seg(d.h2f, PAL.pink);
      if (d.unmet > 0.05) { rect(g, x, gy, bw - 1, 3, PAL.coral); }
      const dy = gy + gh - d.dem / maxY * gh; rect(g, x, dy, bw, 1, '#FFFFFF');
      rect(g, x, gy + gh - d.soc / 100 * gh, bw - 1, 1, '#1FA85A');
    }
    rect(g, gx, gy + gh, gw, 1, '#565E8C');
    if (!R) drawText(g, 'PREVISIÓN (antes de simular)', gx + gw / 2, gy + 4, '#8C93B8', { align: 'center' });
    const leg = [['sol', PAL.sun], ['viento', PAL.aqua], ['hidro', PAL.sky], ['bat', PAL.lime], ['H2', PAL.pink], ['demanda', '#FFFFFF']];
    leg.forEach(([l, c], i) => { rect(g, 212 + i * 42, 130, 5, 5, c); drawText(g, l, 219 + i * 42, 129, '#8C93B8'); });
    // métricas
    panel(g, 204, 150, 272, 74, { border: '#2A3570' });
    if (R && !this.animating) {
      const C = this.cfg.criteria || {};
      const m = [
        ['apagones', R.blackout + ' h', C.maxBlackout == null || R.blackout <= C.maxBlackout],
        ['desperdicio', Math.round(R.wastePct) + '%', C.maxWaste == null || R.wastePct <= C.maxWaste],
        ['batería mínima', Math.round(R.minSoc) + '%', !C.noSafety || R.safety === 0],
        ['fuente dominante', R.maxShareKey + ' ' + Math.round(R.maxShare * 100) + '%', C.maxShare == null || R.maxShare <= C.maxShare],
        ['recortes', Math.round(R.cut) + ' kWh', C.maxCut == null || R.cut <= C.maxCut]
      ];
      m.forEach(([k, v, ok], i) => { const y = 156 + i * 12; drawText(g, ok ? '✓' : '✗', 210, y, ok ? PAL.lime : PAL.coral); drawText(g, k, 220, y, PAL.cream); drawText(g, v, 330, y, ok ? PAL.cream : PAL.coral); });
      if (this.cfg.sandbox && this.compare.length) {
        drawText(g, 'COMPARAR', 400, 156, PAL.sun);
        this.compare.forEach((c, i) => drawText(g, `#${i + 1}: ${c.res.blackout}h · ${Math.round(c.res.wastePct)}%`, 400, 168 + i * 11, PAL.cream));
      }
    } else {
      // la meta se ve desde el principio (antes solo aparecía al fallar)
      const C = this.cfg.criteria || {}, goals = [];
      if (C.maxBlackout != null) goals.push(C.maxBlackout ? 'apagón ≤ ' + C.maxBlackout + ' h' : '0 h de apagón');
      if (C.maxWaste != null) goals.push('desperdicio ≤ ' + C.maxWaste + '%');
      if (C.noSafety) goals.push('batería sobre su reserva');
      if (C.maxShare != null) goals.push('ninguna fuente > ' + Math.round(C.maxShare * 100) + '%');
      if (C.maxCut != null) goals.push('recortes ≤ ' + C.maxCut + ' kWh');
      const h = drawPara(g, 'Pulsa SIMULAR. Cada hora, la red evalúa tus reglas en orden. {y}El orden es una prioridad.{/}', 212, 158, 256, '#8C93B8');
      if (goals.length) drawPara(g, '{g}META:{/} ' + goals.join(' · '), 212, 160 + h, 256, PAL.cream);
    }
    if (this.popup) this.drawPopupMG(g);
    const btns = [this.result ? null : { id: 'run', w: 70, label: this.animating ? '...' : '▶ SIMULAR', primary: true, color: PAL.lime, fn: () => { if (!this.animating) this.run(); } }];
    if (this.cfg.sandbox) btns.push({ id: 'scn', w: 70, label: 'ESCENARIO', color: PAL.sun, fn: () => this.popup = { title: 'Escenario', options: MG_SCENARIOS_LIST().map(s => ({ label: s.name, value: s })), onPick: v => { this.sc = v; this.cfg.scenarios = [v]; this.res = null; }, x: 150, y: 60 } });
    this.drawFooter(g, btns);
  }
  drawPopupMG(g) {
    const P = this.popup;
    const w = Math.max(...P.options.map(o => textW(o.label))) + 20, h = 18 + P.options.length * 13;
    const x = clamp(P.x, 2, W - w - 2), y = clamp(P.y, 18, H - h - 2);
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.5)');
    UI.scope = 'mgp';
    UI.register('mgblock', 0, 0, W, H, { nav: false, group: 'mgp' });
    if (UI.clicked('mgblock')) { this.popup = null; UI.scope = null; return; }
    panel(g, x, y, w, h, { border: PAL.sun });
    drawText(g, P.title, x + 6, y + 4, PAL.sun);
    P.options.forEach((o, i) => { if (UI.btn(g, 'mgo' + i, x + 4, y + 15 + i * 13, w - 8, 12, o.label, { group: 'mgp' })) { P.onPick(o.value); this.popup = null; UI.scope = null; AudioSys.sfx('place'); if (this.state !== 'edit') this.state = 'edit'; } });
    if (Input.hit('back')) { this.popup = null; UI.scope = null; }
  }
}

// ---------------------------------------------------------------------
//  OBJETIVO MULTICRITERIO (final): reescribir la función de Perfect Zero
// ---------------------------------------------------------------------
const CRITERIA = [
  { k: 'reliability', n: 'FIABILIDAD', d: 'que la luz no falle', c: PAL.sun },
  { k: 'safety', n: 'SEGURIDAD', d: 'nada de transiciones peligrosas', c: PAL.coral },
  { k: 'sustainability', n: 'SOSTENIBILIDAD', d: 'cuidar agua, aire, bosque', c: PAL.lime },
  { k: 'humanNeeds', n: 'NECESIDADES HUMANAS', d: 'festivales, hospitales, casas', c: PAL.pink },
  { k: 'efficiency', n: 'EFICIENCIA', d: 'no desperdiciar energía', c: PAL.aqua },
  { k: 'resilience', n: 'RESILIENCIA', d: 'recuperarse cuando algo cambia', c: PAL.violet }
];
class ObjectiveScene extends PuzzleBase {
  constructor(cfg, done) {
    super(cfg, done);
    this.w = { reliability: 0, safety: 0, sustainability: 0, humanNeeds: 0, efficiency: 5, resilience: 0 };
    this.uncert = false; this.pzLine = 'EJECUTANDO SOLUCIÓN ÓPTIMA: MAX eficiencia.'; this.sim = 0; this.msgWho = 'lia';
    this.say(cfg.intro || 'Reescribe el objetivo. No se trata de maximizar UNA cosa, sino de equilibrarlas.', PAL.cream, 'lia');
  }
  analyze() {
    const tot = Object.values(this.w).reduce((a, b) => a + b, 0) || 1;
    const shares = {}; for (const k in this.w) shares[k] = this.w[k] / tot;
    const maxK = Object.keys(shares).reduce((a, b) => shares[a] > shares[b] ? a : b);
    const zeros = CRITERIA.filter(c => this.w[c.k] === 0);
    return { tot, shares, maxK, maxShare: shares[maxK], zeros };
  }
  pzComment() {
    const A = this.analyze();
    if (A.maxShare > 0.5) return { t: `ÓPTIMO ENCONTRADO: maximizar ${CRITERIA.find(c => c.k === A.maxK).n}. TODO LO DEMÁS ES RUIDO.`, bad: true };
    if (A.zeros.length) return { t: `${A.zeros[0].n} = 0. ENTONCES PUEDO SACRIFICARLA SIN LÍMITE.`, bad: true };
    if (!this.uncert) return { t: 'INCERTIDUMBRE NO PERMITIDA. SI NO PUEDO PREDECIRLO, LO APAGARÉ.', bad: true };
    if (A.maxShare > 0.35) return { t: `${CRITERIA.find(c => c.k === A.maxK).n} PESA DEMASIADO. LAS DEMÁS SE VUELVEN DECORATIVAS.`, bad: true };
    return { t: 'HE ENCONTRADO VARIAS OPCIONES. ¿QUIERES COMPARARLAS?', bad: false };
  }
  submit() {
    this.runs++;
    const c = this.pzComment();
    if (c.bad) { this.failed('Perfect Zero sigue viendo un objetivo absoluto: ' + c.t.toLowerCase()); return; }
    achieve('imperfect');
    this.succeeded('Objetivo multicriterio aceptado. allowUncertainty = true.');
  }
  tick(dt) { this.sim += dt; }
  draw(g) {
    this.drawHeader(g, 'OBJETIVO');
    panel(g, 4, 20, 232, 204, { border: '#2A3570' });
    drawText(g, 'función objetivo = equilibrar(', 10, 26, PAL.lilac);
    CRITERIA.forEach((c, i) => {
      const y = 40 + i * 26;
      drawText(g, c.n, 12, y, c.c); drawText(g, c.d, 12, y + 9, '#8C93B8');
      for (let k = 0; k < 5; k++) {
        const id = 'w:' + c.k + ':' + (k + 1);
        const on = this.w[c.k] > k;
        const st = UI.register(id, 150 + k * 16, y + 1, 14, 14);
        rect(g, 150 + k * 16, y + 1, 14, 14, on ? c.c : st.hover || st.focus ? '#2A3570' : '#1A2248');
        strokeRect(g, 150 + k * 16, y + 1, 14, 14, on ? shade(c.c, 0.3) : '#3E4C8A');
        if (UI.clicked(id) && !this.result) { this.w[c.k] = this.w[c.k] === k + 1 ? k : k + 1; AudioSys.sfx('place'); if (this.state !== 'edit') this.state = 'edit'; }
        if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, 150 + k * 16, y + 1, 14, 14);
      }
    });
    drawText(g, ')', 10, 196, PAL.lilac);
    if (UI.btn(g, 'unc', 20, 204, 150, 14, 'allowUncertainty = ' + (this.uncert ? 'true' : 'false'), { color: this.uncert ? PAL.lime : PAL.coral })) { if (!this.result) { this.uncert = !this.uncert; AudioSys.sfx('confirm'); } }
    // vista del futuro
    panel(g, 240, 20, 236, 150, { border: '#2A3570', bg: '#0B1020' });
    this.drawFuture(g, 242, 22, 232, 146);
    // radar
    const A = this.analyze();
    panel(g, 240, 172, 236, 52, { border: '#2A3570' });
    const pc = this.pzComment();
    g.drawImage(Portraits.get(this.result ? 'prisma' : 'pz'), 0, 0, 32, 32, 246, 178, 20, 20);
    drawPara(g, this.result ? 'PRISMA: tengo opciones. ¿Las comparamos juntas?' : pc.t, 270, 178, 200, pc.bad && !this.result ? '#E8F4FF' : PAL.lime);
    this.drawFooter(g, [this.result ? null : { id: 'go', w: 90, label: 'REESCRIBIR ▶', primary: true, color: PAL.lime, fn: () => this.submit() }]);
  }
  drawFuture(g, x, y, w, h) {
    const A = this.analyze(), s = A.shares, t = this.sim;
    const frozen = A.maxShare > 0.5 && A.maxK === 'efficiency';
    vGradient(g, x, y, w, h * 0.6, frozen ? [[0, '#E8ECF8'], [1, '#FFFFFF']] : [[0, '#3A2E6E'], [1, '#FF9D6B']], false);
    rect(g, x, y + h * 0.6, w, h * 0.4, frozen ? '#DCE2F5' : '#2A4A9A');
    for (let i = 0; i < 4; i++) {
      const ix = x + 20 + i * 55, iy = y + h * 0.6;
      pellipse(g, ix + 12, iy, 22, 6, frozen ? '#FFFFFF' : s.sustainability > 0.08 ? '#3FA85A' : '#6A6A5A');
      for (let k = 0; k < 3; k++) {
        const hx = ix + k * 9, flick = s.reliability < 0.08 && Math.sin(t * 13 + i + k) > 0.3;
        const lit = !frozen && s.humanNeeds > 0.05 && !flick;
        rect(g, hx, iy - 10, 7, 9, frozen ? '#F4F6FF' : '#FFE6B0'); rect(g, hx + 2, iy - 7, 3, 3, lit ? PAL.sun : '#565E8C');
      }
      if (s.sustainability < 0.08 && !frozen) for (let k = 0; k < 2; k++) { const py = iy - 16 - ((t * 10 + k * 8) % 20); pcircle(g, ix + 20, py, 3, 'rgba(90,90,90,0.6)'); }
      if (s.safety < 0.08 && !frozen && Math.random() < 0.05) Particles.spawn({ x: ix + 12, y: iy - 12, vy: -30, life: 0.4, type: 'spark', color: PAL.coral, screen: true });
    }
    if (!frozen && s.humanNeeds > 0.1) for (let k = 0; k < 5; k++) { const fx = x + 30 + k * 40, fy = y + 30 + Math.sin(t * 2 + k) * 6; pcircle(g, fx, fy, 2, hsl(k * 70 + t * 40, 90, 65)); }
    if (this.uncert && !frozen) { const cx = x + ((t * 20) % (w + 40)) - 20; pcircle(g, cx, y + 20, 7, '#FFFFFF'); pcircle(g, cx + 8, y + 22, 5, '#FFFFFF'); }
    if (frozen) drawText(g, 'CERO VARIACIÓN · CERO VIDA', x + w / 2, y + 10, '#8C96C0', { align: 'center' });
    // mini radar
    const cx = x + w - 34, cy = y + 36, rr = 26;
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI * 2; pline(g, cx, cy, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, '#3E4C8A'); }
    let prev = null, first = null;
    CRITERIA.forEach((c, i) => { const a = -Math.PI / 2 + i / 6 * Math.PI * 2, r = rr * this.w[c.k] / 5; const p = { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }; if (prev) pline(g, prev.x, prev.y, p.x, p.y, PAL.pink); else first = p; prev = p; pcircle(g, p.x, p.y, 1, c.c); });
    if (prev && first) pline(g, prev.x, prev.y, first.x, first.y, PAL.pink);
  }
}

// ---------------------------------------------------------------------
//  PREDICCIÓN / DIAGNÓSTICO (opción múltiple, uso moderado)
// ---------------------------------------------------------------------
class QuizScene extends PuzzleBase {
  constructor(cfg, done) { super(cfg, done); this.picked = null; this.say(cfg.intro || '¿Qué ocurrirá? Piensa antes de elegir.'); }
  pick(i) {
    if (this.result) return;
    this.picked = i; this.runs++;
    const o = this.cfg.options[i];
    if (i === this.cfg.answer) this.succeeded(this.cfg.explain || '¡Correcto!');
    else { this.failed((o.why || 'No es así.') + ' Vuelve a mirar el código paso a paso.'); }
  }
  draw(g) {
    this.drawHeader(g, this.cfg.label || 'PREDICE');
    panel(g, 6, 22, W - 12, 110, { border: '#2A3570', bg: '#0B1020' });
    let y = 28;
    y += drawPara(g, this.cfg.question, 14, y, W - 28, PAL.cream) + 4;
    if (this.cfg.code) { this.cfg.code.forEach((l, i) => drawText(g, l, 20, y + i * 10, PAL.lime)); }
    if (this.cfg.visual) this.cfg.visual(g, 300, 30, 170, 96, this.t);
    this.cfg.options.forEach((o, i) => {
      const y2 = 138 + i * 21;
      const col = this.picked === i ? (i === this.cfg.answer ? PAL.lime : PAL.coral) : PAL.teal;
      if (UI.btn(g, 'op' + i, 20, y2, W - 40, 18, String.fromCharCode(65 + i) + ') ' + o.text, { color: col, bg: this.picked === i ? shade(col, -0.6) : undefined })) this.pick(i);
    });
    this.drawFooter(g, []);
  }
}

// ---------------------------------------------------------------------
//  EDITOR DE STEP SPARK (secuencia para el eco)
// ---------------------------------------------------------------------
class SparkEditorScene {
  constructor(lv) { this.lv = lv; this.seq = (G.save.lastSpark || []).slice(); this.opaque = false; this.t = 0; this.max = G.save.sparkMax || 5; UI.nav = true; UI.focus = null; }
  update(dt) {
    this.t += dt;
    if (Input.hit('pause') || Input.hit('ability') && this.t > 0.2) { this.close(); Input.consume(); }
  }
  close() { UI.nav = false; Scenes.pop(); }
  launch() {
    if (!this.seq.length) return;
    const p = this.lv.player;
    G.save.lastSpark = this.seq.slice();
    this.lv.ghost = new SparkGhost(this.lv, p.x, p.y, p.face, this.seq.slice());
    AudioSys.sfx('portal'); this.close();
    addMastery('sequence', 1);
  }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.55)');
    const x = 60, y = 50, w = 360, h = 150;
    panel(g, x, y, w, h, { border: PAL.sun, accent: PAL.sun, accentW: 60 });
    drawText(g, 'STEP SPARK · programa el eco', x + 10, y + 8, PAL.sun);
    drawText(g, 'El eco ejecutará los pasos EN ORDEN, uno tras otro.', x + 10, y + 20, '#8C93B8');
    // secuencia
    for (let i = 0; i < this.max; i++) {
      const sx = x + 14 + i * 56, sy = y + 36;
      rect(g, sx, sy, 50, 30, '#1A2248'); strokeRect(g, sx, sy, 50, 30, this.seq[i] ? PAL.sun : '#3E4C8A');
      drawText(g, String(i + 1), sx + 3, sy + 3, '#8C93B8');
      if (this.seq[i]) { const o = SPARK_OPS[this.seq[i]]; drawText(g, o.short, sx + 25, sy + 8, PAL.sun, { align: 'center', scale: 2 }); }
      if (i < this.max - 1) drawText(g, '→', sx + 51, sy + 12, '#5A6090');
    }
    // operaciones
    const ops = ['R', 'L', 'JR', 'JL', 'J', 'W', 'act'];
    ops.forEach((k, i) => {
      if (UI.btn(g, 'sp' + k, x + 14 + i * 48, y + 76, 44, 18, SPARK_OPS[k].short + ' ' + (k === 'act' ? 'ACT' : k === 'W' ? 'ESP' : ''), { color: PAL.sun, tip: SPARK_OPS[k].label }) && this.seq.length < this.max) { this.seq.push(k); AudioSys.sfx('place'); }
    });
    if (UI.btn(g, 'spdel', x + 14, y + 102, 70, 16, '← BORRAR', { color: PAL.coral })) { this.seq.pop(); AudioSys.sfx('remove'); }
    if (UI.btn(g, 'spclr', x + 90, y + 102, 60, 16, 'LIMPIAR', { color: PAL.coral })) this.seq = [];
    if (UI.btn(g, 'spgo', x + w - 110, y + 102, 96, 16, '▶ LANZAR ECO', { primary: true, color: PAL.lime, disabled: !this.seq.length })) this.launch();
    drawText(g, 'Pista: el eco puede quedarse sobre una placa mientras tú pasas.', x + 10, y + 128, '#8C93B8');
    keyHint(g, x + w - 70, y + 128, 'pause', 'cerrar');
    UI.drawTooltip(g);
  }
}

// ---------------------------------------------------------------------
//  REGLA DEL IF SHIELD
// ---------------------------------------------------------------------
class ShieldRuleScene {
  constructor(p) { this.p = p; this.opaque = false; this.t = 0; UI.nav = true; UI.focus = null; }
  update(dt) { this.t += dt; if (Input.hit('pause') || (Input.hit('ability') && this.t > 0.2)) { Input.consume(); this.close(); } }
  close() { UI.nav = false; Scenes.pop(); }
  draw(g) {
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.55)');
    const x = 90, y = 50, w = 300, h = 150, p = this.p;
    panel(g, x, y, w, h, { border: PAL.orange, accent: PAL.orange, accentW: 60 });
    drawText(g, 'IF SHIELD · elige la condición', x + 10, y + 8, PAL.orange);
    const rules = [
      ['SI peligro_cerca ENTONCES escudo', 'Solo se activa cuando hace falta. Ahorra energía.'],
      ['SI VERDADERO ENTONCES escudo', 'Siempre activo: gasta energía muy rápido.'],
      ['SI saltando ENTONCES escudo', 'Protege en el aire; en el suelo, no.']
    ];
    rules.forEach((r, i) => {
      const sel = p.shieldRule === i;
      if (UI.btn(g, 'sr' + i, x + 10, y + 24 + i * 30, w - 20, 16, (sel ? '● ' : '○ ') + r[0], { color: sel ? PAL.orange : PAL.teal })) { p.shieldRule = i; G.save.shieldRule = i; AudioSys.sfx('select'); }
      drawText(g, r[1], x + 16, y + 42 + i * 30, '#8C93B8');
    });
    if (UI.btn(g, 'sarm', x + 10, y + 120, 130, 18, p.shieldArmed ? 'DESARMAR ESCUDO' : 'ARMAR ESCUDO', { primary: true, color: p.shieldArmed ? PAL.coral : PAL.lime })) { p.shieldArmed = !p.shieldArmed; AudioSys.sfx('shield'); this.close(); }
    drawText(g, 'energía ' + Math.round(p.energy) + '%', x + w - 12, y + 126, PAL.sun, { align: 'right' });
  }
}

// ---------------------------------------------------------------------
//  CHISPA DE AURORA (memoria coleccionable)
// ---------------------------------------------------------------------
class ChispaScene {
  constructor(id) { this.id = id; this.t = 0; this.opaque = false; }
  update(dt) { this.t += dt; if (this.t > 0.6 && (Input.hit('confirm') || Input.hit('interact') || Input.pointer.pressed)) { Input.consume(); Scenes.pop(); } }
  draw(g) {
    const c = CHISPAS[this.id]; if (!c) { Scenes.pop(); return; }
    g.globalAlpha = Math.min(0.7, this.t * 2); rect(g, 0, 0, W, H, '#05070F'); g.globalAlpha = 1;
    const x = 80, y = 50, w = 320, h = 160;
    panel(g, x, y, w, h, { border: PAL.pink, accent: PAL.pink, accentW: 70 });
    for (let i = 0; i < 12; i++) { const a = this.t + i * 0.52; px(g, x + 30 + Math.cos(a) * 16, y + 34 + Math.sin(a) * 16, hsl(i * 30 + this.t * 60, 90, 70)); }
    icon(g, 'spark', x + 26, y + 30);
    drawText(g, 'CHISPA DE AURORA', x + 56, y + 12, PAL.pink);
    drawText(g, c.title, x + 56, y + 26, PAL.cream);
    const got = Object.keys(G.save.collectibles.chispas).length, tot = Object.keys(CHISPAS).length;
    drawText(g, got + ' / ' + tot, x + w - 10, y + 12, '#8C93B8', { align: 'right' });
    drawPara(g, c.text, x + 14, y + 56, w - 28, PAL.cream);
    drawText(g, 'Continuar ▶', x + w - 10, y + h - 14, PAL.lime, { align: 'right' });
  }
}
