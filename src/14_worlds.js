// =====================================================================
//  MUNDOS DE SIMULACIÓN para el CodeLab
//  Cada mundo: init, act, sensors, update, draw, check (+ onTick/afterTick para bucles de control)
// =====================================================================

// ---------- Mundo cuadrícula: PÍX / robots ejecutan instrucciones ----------
// mapa: '#' muro, '.' suelo, 'S' inicio, 'T' entrega, 'k' pieza para RECOGER, 's' interruptor, 'c' caja, '~' agua, 'p' planta sin regar, 'f' flor
function W_grid(o) {
  const map = o.map;
  const H0 = map.length, W0 = Math.max(...map.map(r => r.length));
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const DN = ['→', '↓', '←', '↑'];
  return {
    init() {
      const cells = map.map(r => r.split(''));
      let sx = 0, sy = 0;
      cells.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') { sx = x; sy = y; r[x] = '.'; } }));
      return { cells, x: sx, y: sy, dir: o.dir || 0, ax: sx, ay: sy, adir: o.dir || 0, carry: null, delivered: 0, switches: 0, bump: 0, errCell: null, log: [], moves: 0 };
    },
    sensors: o.sensors || {},
    act(name, arg, st) {
      const cell = (x, y) => (st.cells[y] && st.cells[y][x]) || '#';
      if (name === 'avanzar') {
        const n = arg || 1;
        for (let i = 0; i < n; i++) {
          const nx = st.x + DIRS[st.dir][0], ny = st.y + DIRS[st.dir][1];
          const c = cell(nx, ny);
          if (c === '#' || c === 'c' || c === '~') { st.bump = 0.5; st.errCell = [nx, ny]; return { ok: false, msg: c === 'c' ? `Chocó con una caja en la casilla (${nx},${ny}). ¿Faltaba girar antes?` : c === '~' ? 'Delante hay agua: no puede avanzar por ahí.' : 'Delante hay un muro (el robot mira ' + DN[st.dir] + '). ¿Giró antes de tiempo o avanzó de más? Cuenta las casillas.' }; }
          st.x = nx; st.y = ny; st.moves++;
        }
        return { ok: true, dur: 0.35 * (arg || 1) };
      }
      if (name === 'girar_der') { st.dir = (st.dir + 1) % 4; return { ok: true, dur: 0.25 }; }
      if (name === 'girar_izq') { st.dir = (st.dir + 3) % 4; return { ok: true, dur: 0.25 }; }
      if (name === 'recoger') {
        const c = cell(st.x, st.y);
        if (c !== 'k') { st.errCell = [st.x, st.y]; return { ok: false, msg: 'Aquí no hay nada que recoger.' }; }
        if (st.carry) return { ok: false, msg: 'Ya lleva una pieza: solo puede cargar una.' };
        st.carry = 'k'; st.cells[st.y][st.x] = '.'; AudioSys.sfx('seed');
        return { ok: true, dur: 0.3 };
      }
      if (name === 'entregar') {
        const c = cell(st.x, st.y);
        if (!st.carry) return { ok: false, msg: 'No lleva nada para entregar. ¿El orden RECOGER → ENTREGAR se invirtió?' };
        if (c !== 'T') { st.errCell = [st.x, st.y]; return { ok: false, msg: 'Aquí no es el punto de entrega (★).' }; }
        st.carry = null; st.delivered++; AudioSys.sfx('charge');
        return { ok: true, dur: 0.5 };
      }
      if (name === 'activar') {
        const c = cell(st.x, st.y);
        if (c !== 's') { st.errCell = [st.x, st.y]; return { ok: false, msg: 'No hay interruptor en esta casilla.' }; }
        st.cells[st.y][st.x] = 'S2'; st.switches++; AudioSys.sfx('ok');
        return { ok: true, dur: 0.3 };
      }
      if (name === 'regar') {
        const c = cell(st.x, st.y);
        if (c !== 'p') { st.errCell = [st.x, st.y]; return { ok: false, msg: c === 'f' ? '¡Esta planta ya estaba regada! Regar dos veces encharca la raíz.' : 'Aquí no hay planta que regar.' }; }
        st.cells[st.y][st.x] = 'f'; AudioSys.sfx('splash');
        return { ok: true, dur: 0.3 };
      }
      if (o.extraActs && o.extraActs[name]) return o.extraActs[name](st, arg);
      return { ok: false, msg: 'Acción desconocida.' };
    },
    update(st, dt) {
      st.ax = lerp(st.ax, st.x, Math.min(1, dt * 12)); st.ay = lerp(st.ay, st.y, Math.min(1, dt * 12));
      let d = st.dir - st.adir; if (d > 2) d -= 4; if (d < -2) d += 4; st.adir += d * Math.min(1, dt * 12);
      st.bump = Math.max(0, st.bump - dt);
    },
    check(st, env) {
      if (o.maxLines && env && env.prog && countBlocks(env.prog) > o.maxLines) return { ok: false, msg: `Llega, pero con ${countBlocks(env.prog)} instrucciones. El reto pide ${o.maxLines} o menos.` };
      if (o.need.deliver && st.delivered < o.need.deliver) return { ok: false, msg: 'El programa terminó pero la pieza no llegó a su destino (★).' };
      if (o.need.switches && st.switches < o.need.switches) return { ok: false, msg: `Faltan interruptores por ACTIVAR (${st.switches}/${o.need.switches}).` };
      if (o.need.plants) { const left = st.cells.flat().filter(c => c === 'p').length; if (left) return { ok: false, msg: `Quedan ${left} plantas sin regar.` }; }
      if (o.need.at && (st.x !== o.need.at[0] || st.y !== o.need.at[1])) return { ok: false, msg: 'Terminó en otra casilla. Debía acabar en la marca ◎.' };
      if (o.need.maxMoves && st.moves > o.need.maxMoves) return { ok: false, msg: 'Funciona, pero da demasiados pasos. ¿Hay un camino más corto?' };
      return { ok: true, msg: o.okMsg || '¡Ruta completada!' };
    },
    draw(g, x, y, w, h, st, t) {
      const cs = Math.floor(Math.min((w - 8) / W0, (h - 8) / H0));
      const ox = x + Math.floor((w - cs * W0) / 2), oy = y + Math.floor((h - cs * H0) / 2);
      rect(g, x, y, w, h, o.bg || '#1B2A4A');
      for (let yy = 0; yy < H0; yy++) for (let xx = 0; xx < W0; xx++) {
        const c = (st.cells[yy] && st.cells[yy][xx]) || '#';
        const px0 = ox + xx * cs, py0 = oy + yy * cs;
        if (c === '#') { rect(g, px0, py0, cs, cs, o.wall || '#3A3058'); rect(g, px0, py0, cs, 2, shade(o.wall || '#3A3058', 0.2)); continue; }
        rect(g, px0, py0, cs, cs, (xx + yy) % 2 ? (o.floor || '#8B5A3C') : shade(o.floor || '#8B5A3C', 0.08));
        const m = cs / 2;
        if (c === 'T') { drawText(g, '★', px0 + m - 2, py0 + m - 3, PAL.sun); if (st.delivered) pcircle(g, px0 + m, py0 + m, m - 2, 'rgba(255,216,74,0.4)'); }
        if (c === 'k') { rect(g, px0 + m - 3, py0 + m - 2, 6, 4, PAL.sun); rect(g, px0 + m - 1, py0 + m - 4, 2, 8, '#C9D2F0'); }
        if (c === 's') { rect(g, px0 + m - 3, py0 + m - 3, 6, 6, '#3A4068'); rect(g, px0 + m - 1, py0 + m - 2, 2, 3, PAL.coral); }
        if (c === 'S2') { rect(g, px0 + m - 3, py0 + m - 3, 6, 6, '#3A4068'); rect(g, px0 + m - 1, py0 + m - 2, 2, 3, PAL.lime); }
        if (c === 'c') { rect(g, px0 + 2, py0 + 2, cs - 4, cs - 4, '#B07A4A'); strokeRect(g, px0 + 2, py0 + 2, cs - 4, cs - 4, '#6B4A2A'); pline(g, px0 + 2, py0 + 2, px0 + cs - 3, py0 + cs - 3, '#6B4A2A'); }
        if (c === '~') { rect(g, px0, py0, cs, cs, '#2A6AB8'); rect(g, px0 + 2, py0 + m + Math.round(Math.sin(t * 3 + xx) * 1), cs - 4, 1, '#9FE8FF'); }
        if (c === 'p') { rect(g, px0 + m, py0 + m - 2, 1, 5, '#8B5A3C'); rect(g, px0 + m - 2, py0 + m - 3, 2, 2, '#9A8A4A'); }
        if (c === 'f') { rect(g, px0 + m, py0 + m - 2, 1, 5, '#3FA85A'); rect(g, px0 + m - 2, py0 + m - 5, 5, 3, PAL.pink); px(g, px0 + m, py0 + m - 4, PAL.sun); }
        if (o.need.at && o.need.at[0] === xx && o.need.at[1] === yy) pring(g, px0 + m, py0 + m, m - 2, PAL.lime);
      }
      // casillas numeradas por tramo recto (ayuda a contar cuánto debe avanzar cada instrucción)
      if (o.stepNumbers) {
        if (!this._steps) {
          const open = (xx, yy) => { const c = map[yy] && map[yy][xx]; return c && c !== '#' && c !== 'c'; };
          let cx0 = 0, cy0 = 0; map.forEach((r, yy) => { const i = r.indexOf('S'); if (i >= 0) { cx0 = i; cy0 = yy; } });
          let d = o.dir || 0, n = 0; const seen = new Set([cx0 + ',' + cy0]); this._steps = [];
          for (let guard = 0; guard < 200; guard++) {
            let nx = cx0 + DIRS[d][0], ny = cy0 + DIRS[d][1];
            if (!open(nx, ny) || seen.has(nx + ',' + ny)) {
              const turns = [(d + 1) % 4, (d + 3) % 4].filter(k => open(cx0 + DIRS[k][0], cy0 + DIRS[k][1]) && !seen.has((cx0 + DIRS[k][0]) + ',' + (cy0 + DIRS[k][1])));
              if (!turns.length) break;
              d = turns[0]; n = 0; nx = cx0 + DIRS[d][0]; ny = cy0 + DIRS[d][1];
            }
            n++; cx0 = nx; cy0 = ny; seen.add(nx + ',' + ny); this._steps.push({ x: nx, y: ny, n });
          }
        }
        for (const sp of this._steps) drawText(g, String(sp.n), ox + sp.x * cs + cs / 2, oy + sp.y * cs + cs / 2 - 3, 'rgba(255,243,215,0.75)', { align: 'center' });
      }
      if (o.note) o.note.forEach((ln, i) => drawText(g, ln, x + w / 2, y + 3 + i * 9, i ? '#C9D2F0' : PAL.sun, { align: 'center' }));
      if (st.errCell) { const [ex, ey] = st.errCell; strokeRect(g, ox + ex * cs, oy + ey * cs, cs, cs, Math.floor(t * 6) % 2 ? PAL.coral : '#FFFFFF'); }
      // bot
      const bx = ox + st.ax * cs + cs / 2, by = oy + st.ay * cs + cs / 2 + Math.sin(t * 6) * 1 + (st.bump > 0 ? Math.sin(st.bump * 40) * 2 : 0);
      if (o.bot === 'robot') { rect(g, bx - 4, by - 4, 8, 8, '#C9D2F0'); rect(g, bx - 3, by - 2, 6, 3, '#10162B'); px(g, bx - 2, by - 1, PAL.teal); px(g, bx + 1, by - 1, PAL.teal); }
      else { const f = Spr.pix[Math.floor(t * 16) % 4]; const fr = Math.cos(st.adir * Math.PI / 2) >= 0 ? f.r : f.l; g.drawImage(fr, Math.round(bx - 7), Math.round(by - 6)); }
      const a = st.adir * Math.PI / 2;
      pline(g, bx, by, bx + Math.cos(a) * (cs / 2 + 2), by + Math.sin(a) * (cs / 2 + 2), PAL.sun);
      if (st.carry) { rect(g, bx - 2, by - 10, 5, 3, PAL.sun); }
    }
  };
}

// ---------- Mundo solar: un día (control por horas) ----------
// o.weather: array de 'sol'|'nube'|'lluvia' por hora ; o.demand: por hora (kW) ; programa decide cargar/usar
function W_solar(o) {
  const hours = o.hours || [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
  const wx = o.weather;
  const irrOf = (h, w) => { const sunH = Math.max(0, Math.sin((h - 6) / 14 * Math.PI)); return Math.round(1000 * sunH * (w === 'sol' ? 1 : w === 'nube' ? 0.35 : w === 'polvo' ? 0.2 : 0.1)); };
  return {
    init() { return { hi: 0, soc: o.soc0 != null ? o.soc0 : 60, lit: [], blackout: 0, wasted: 0, log: [], decision: null, dark: 0, clouds: 0, sunk: 0 }; },
    weatherAt: st => wx[Math.min(st.hi, wx.length - 1)],
    sensors: {
      radiacion: (st) => irrOf(hours[Math.min(st.hi, hours.length - 1)], wx[Math.min(st.hi, wx.length - 1)]),
      bateria: (st) => Math.round(st.soc),
      hora: (st) => hours[Math.min(st.hi, hours.length - 1)],
      demanda: (st) => (o.demand ? o.demand[Math.min(st.hi, o.demand.length - 1)] : 3)
    },
    onTick(st, tick) { st.hi = tick; st.decision = null; },
    act(name, arg, st) {
      if (['cargar_bateria', 'usar_bateria', 'alimentar_red', 'cerrar_paneles', 'apagar_todo'].includes(name)) { st.decision = name; return { ok: true, dur: 0.25 }; }
      return { ok: false, msg: 'Acción desconocida.' };
    },
    afterTick(st, tick, env) {
      const h = hours[tick], w = wx[tick];
      const irr = irrOf(h, w);
      const gen = irr / 1000 * (o.panels || 6); // kW
      const dem = o.demand ? o.demand[tick] : 3;
      const K = o.K || 3; // % de batería por kWh
      let lit = true, why = null;
      const dec = st.decision;
      if (!dec) { st.log.push({ h, gen, soc: st.soc, lit: false, dec: 'nada' }); return { fail: `A las ${h}:00 el programa no tomó ninguna decisión. Cada hora debe elegir qué hacer con la energía.`, kind: 'goal' }; }
      if (dec === 'cargar_bateria') {
        // modo carga: la ciudad usa solo el sol y el sobrante va a la batería
        if (gen + 0.001 >= dem) { st.soc = Math.min(100, st.soc + (gen - dem) * K * 0.9); if (st.soc >= 100) st.wasted += gen - dem; }
        else { lit = false; why = `eligió cargar_bateria con radiación ${irr} W/m²: el sol daba ${gen.toFixed(1).replace('.', ',')} kW y la ciudad pedía ${dem} kW. ¿El umbral es demasiado bajo?`; }
      } else if (dec === 'usar_bateria' || dec === 'cerrar_paneles') {
        const g2 = dec === 'cerrar_paneles' ? 0 : gen;
        const need = Math.max(0, dem - g2) * K;
        if (st.soc >= need) st.soc -= need; else { st.soc = 0; lit = false; why = `la batería se vació. ¿Se cargó lo suficiente cuando había sol? ¿El umbral es demasiado alto?`; }
        st.wasted += Math.max(0, g2 - dem);
        if (dec === 'cerrar_paneles') st.closed = true;
      } else if (dec === 'alimentar_red') { if (gen < dem) lit = false; }
      else if (dec === 'apagar_todo') { lit = false; why = 'Perfect Zero lo apagó todo: cero consumo, cero error... y cero vida. Una regla EXTREMA no es una buena regla.'; }
      if (w === 'polvo' && dec !== 'cerrar_paneles') st.dust = (st.dust || 0) + 1;
      st.soc = clamp(st.soc, 0, 100);
      if (!lit) st.blackout++;
      st.log.push({ h, gen, soc: st.soc, lit, dec, w });
      if (o.strict !== false && !lit) return { fail: `A las ${h}:00 la ciudad se quedó sin luz: ${why || 'faltó energía.'}`, kind: 'goal' };
      return null;
    },
    update(st, dt) { st.sunk += dt; },
    check(st) {
      if (st.blackout > (o.maxBlackout || 0)) return { ok: false, msg: `Hubo ${st.blackout} horas de apagón. Revisa la condición: ¿cuándo conviene cargar y cuándo usar la batería?` };
      if (o.needDust && st.dust) return { ok: false, msg: 'La tormenta de polvo dañó los paneles abiertos. ¿Qué condición los protegería?' };
      return { ok: true, msg: o.okMsg || '¡La ciudad estuvo iluminada todo el día!' };
    },
    extraVars(st) { return []; },
    drawsTime: true, // la hora ya se ve en la ilustración
    draw(g, x, y, w, h, st, t, scene) {
      const hi = Math.min(st.hi, hours.length - 1), hr = hours[hi], wth = wx[hi];
      const dayK = Math.max(0, Math.sin((hr - 6) / 14 * Math.PI));
      vGradient(g, x, y, w, h * 0.7, [[0, mix('#1B2550', '#59C7FF', dayK)], [1, mix('#3A2E6E', '#BFF4FF', dayK)]], false);
      // sol
      const sa = (hr - 6) / 14 * Math.PI;
      const sx = x + w / 2 - Math.cos(sa) * (w / 2 - 14), sy = y + h * 0.6 - Math.sin(sa) * (h * 0.5);
      if (hr >= 6 && hr <= 20) { pcircle(g, sx, sy, 7, '#FFD84A'); pcircle(g, sx, sy, 4, '#FFF3A0'); }
      else { pcircle(g, x + w - 20, y + 16, 5, '#FFF3D7'); }
      if (wth === 'nube' || wth === 'lluvia') for (let i = 0; i < 3; i++) { const cx = x + 20 + i * 55 + Math.sin(t + i) * 6; pcircle(g, cx, y + 18, 8, wth === 'lluvia' ? '#8C96C0' : '#FFFFFF'); pcircle(g, cx + 9, y + 20, 6, wth === 'lluvia' ? '#8C96C0' : '#FFFFFF'); }
      if (wth === 'lluvia') for (let i = 0; i < 20; i++) rect(g, x + (i * 37 + t * 90) % w, y + 25 + (i * 13 + t * 120) % 60, 1, 3, '#9FE8FF');
      if (wth === 'polvo') { g.globalAlpha = 0.45; rect(g, x, y, w, h * 0.7, '#D09850'); g.globalAlpha = 1; for (let i = 0; i < 20; i++) px(g, x + (i * 29 - t * 160) % w + w, y + (i * 17) % 80, '#F0D0A0'); }
      // suelo
      rect(g, x, y + h * 0.7, w, h * 0.3, '#3FA85A'); rect(g, x, y + h * 0.7, w, 2, '#66D66A');
      // paneles
      const closed = st.decision === 'cerrar_paneles';
      for (let i = 0; i < 3; i++) { const px0 = x + 8 + i * 16, py0 = y + h * 0.7 - 10; rect(g, px0 + 5, py0 + 4, 1, 6, '#8A8FB0'); if (closed) rect(g, px0, py0 + 6, 12, 2, '#3A4068'); else for (let k = 0; k < 5; k++) rect(g, px0 + k * 0.5, py0 + k, 12, 1, k === 0 ? '#9FE8FF' : '#2A4A9A'); }
      // batería
      const bx = x + 64, by = y + h * 0.7 - 26;
      rect(g, bx + 3, by - 2, 6, 2, '#8A8FB0'); rect(g, bx, by, 12, 24, '#2A2F6A'); const fh = Math.round(20 * st.soc / 100); rect(g, bx + 2, by + 22 - fh, 8, fh, st.soc > 50 ? PAL.lime : st.soc > 20 ? PAL.sun : PAL.coral);
      drawText(g, Math.round(st.soc) + '%', bx + 6, by + 26, PAL.white, { align: 'center', outline: PAL.ink });
      // ciudad
      const last = st.log[st.log.length - 1];
      const lit = !last || last.lit;
      for (let i = 0; i < 5; i++) { const hx = x + 90 + i * 17, hh = 14 + (i * 7) % 12; rect(g, hx, y + h * 0.7 - hh, 14, hh, '#FFE6B0'); for (let k = 0; k < 2; k++) rect(g, hx + 3 + k * 5, y + h * 0.7 - hh + 4, 3, 3, lit && dayK < 0.9 ? PAL.sun : lit ? '#FFF3D7' : '#22306B'); }
      // flujo de energía
      if (st.decision && scene && scene.state === 'running') { const k = (t * 2) % 1; const d = st.decision; const fx = d === 'cargar_bateria' ? [x + 30, bx] : d === 'usar_bateria' ? [bx + 12, x + 100] : [x + 30, x + 100]; px(g, lerp(fx[0], fx[1], k), y + h * 0.7 - 16, PAL.sun); px(g, lerp(fx[0], fx[1], (k + 0.5) % 1), y + h * 0.7 - 16, PAL.sun); }
      // gráfico SOC
      const gx = x + 4, gy = y + 4, gw = 70, gh = 22;
      rect(g, gx, gy, gw, gh, 'rgba(11,16,32,0.7)'); strokeRect(g, gx, gy, gw, gh, 'rgba(201,210,240,0.35)');
      rect(g, gx + 2, gy + gh - 3, gw - 4, 1, 'rgba(201,210,240,0.25)');
      if (!st.log.length) drawText(g, 'batería / hora', gx + gw / 2, gy + 8, '#8C93B8', { align: 'center' });
      st.log.forEach((l, i) => { const lx = gx + 2 + i * (gw - 4) / hours.length; rect(g, lx, gy + gh - 2 - l.soc / 100 * (gh - 4), 3, 2, l.lit ? PAL.lime : PAL.coral); });
      drawText(g, hr + ':00', x + w - 4, y + 4, PAL.white, { align: 'right', outline: PAL.ink });
      drawText(g, { sol: '☀', nube: '☁', lluvia: '☁', polvo: '≈' }[wth] || '', x + w - 4, y + 14, PAL.sun, { align: 'right' });
    }
  };
}

// ---------- Mundo turbina eólica (bucles) ----------
// La turbina sube de rpm con cada ajuste; se sobrecalienta si gira demasiado sin control
function W_turbine(o) {
  return {
    init() { return { rpm: 0, temp: 20, angle: 0, adj: 0, meas: 0, rot: 0, wind: o.wind0 || 6, broken: false, log: [] }; },
    sensors: {
      viento: st => Math.round(st.wind * 10) / 10,
      temperatura: st => Math.round(st.temp),
      rpm: st => Math.round(st.rpm)
    },
    act(name, arg, st) {
      if (name === 'ajustar_aspas') { st.adj++; st.angle = Math.min(30, st.angle + 5); st.rpm += st.wind * 3; st.temp += o.heat || 6; if (st.temp > 90) { st.broken = true; return { ok: false, msg: '¡Sobrecalentamiento! La turbina pasó de 90°. Un bucle sin límite la hizo girar de más.', kind: 'infinite' }; } return { ok: true, dur: 0.3 }; }
      if (name === 'medir_viento') { st.meas++; if (o.gusts) st.wind = Math.max(0, o.gusts[(st.meas - 1) % o.gusts.length]); return { ok: true, dur: 0.2 }; }
      if (name === 'enfriar') { st.temp = Math.max(20, st.temp - 25); st.rpm *= 0.7; return { ok: true, dur: 0.3 }; }
      if (name === 'girar') { st.rpm += 20; st.temp += 8; if (st.temp > 90) { st.broken = true; return { ok: false, msg: '¡Sobrecalentamiento! Gira y gira sin comprobar nada.', kind: 'infinite' }; } return { ok: true, dur: 0.15 }; }
      if (name === 'frenar') { st.rpm = Math.max(0, st.rpm - 30); return { ok: true, dur: 0.2 }; }
      if (name === 'generar') { st.gen = (st.gen || 0) + st.wind; st.rpm = st.wind * 12; st.temp += 1; return { ok: true, dur: 0.15 }; }
      return { ok: false, msg: 'Acción desconocida.' };
    },
    update(st, dt) { st.rot += st.rpm * dt * 0.02; st.temp = Math.max(20, st.temp - dt * 0.5); },
    check(st, env) { return o.check(st, env); },
    draw(g, x, y, w, h, st, t) {
      vGradient(g, x, y, w, h, [[0, '#6A8AFF'], [1, '#FFD0E8']], false);
      for (let i = 0; i < 4; i++) { const cx = x + ((t * 20 * st.wind / 6 + i * 60) % (w + 40)) - 20; rect(g, cx, y + 20 + i * 22, 20, 1, 'rgba(255,255,255,0.7)'); }
      pellipse(g, x + w / 2, y + h - 10, 50, 10, '#9CF5D8'); rect(g, x + w / 2 - 50, y + h - 10, 100, 10, '#9A7AC8');
      const tx = x + w / 2, ty = y + 36;
      rect(g, tx - 2, ty, 4, h - 46, '#FFFFFF');
      const hot = st.temp > 70;
      rect(g, tx - 6, ty - 5, 12, 8, hot ? (Math.floor(t * 8) % 2 ? PAL.coral : PAL.orange) : '#E8F0FF');
      for (let b = 0; b < 3; b++) { const a = st.rot + b * 2.094; for (let r = 3; r < 26; r++) rect(g, tx + Math.cos(a) * r, ty + Math.sin(a) * r, r < 20 ? 2 : 1, 2, '#FFFFFF'); }
      pcircle(g, tx, ty, 3, '#C9D2F0');
      if (hot) for (let i = 0; i < 2; i++) px(g, tx + rand(-4, 4), ty - 8 - rand(0, 8), '#8C93B8');
      // termómetro
      rect(g, x + 8, y + 10, 6, 60, '#22306B'); const th = Math.round(56 * clamp((st.temp - 20) / 80, 0, 1)); rect(g, x + 9, y + 68 - th, 4, th, st.temp > 80 ? PAL.coral : st.temp > 60 ? PAL.orange : PAL.sun);
      rect(g, x + 7, y + 10 + Math.round(56 * (1 - 70 / 100)), 8, 1, PAL.white);
      drawText(g, Math.round(st.temp) + '°', x + 18, y + 10, PAL.white, { outline: PAL.ink });
      rect(g, x + w - 62, y + 3, 60, 33, 'rgba(16,22,60,0.55)');
      drawText(g, 'rpm ' + Math.round(st.rpm), x + w - 6, y + 6, PAL.white, { align: 'right', outline: PAL.ink });
      drawText(g, 'viento ' + st.wind + ' m/s', x + w - 6, y + 16, PAL.aqua, { align: 'right', outline: PAL.ink });
      drawText(g, 'ajustes ' + st.adj, x + w - 6, y + 26, PAL.sun, { align: 'right', outline: PAL.ink });
    }
  };
}

// ---------- Mundo hidroeléctrico (funciones) ----------
function W_hydro(o) {
  return {
    init() { return { gates: o.gates.map(g => ({ ...g, power: 0, open: 0, called: false })), total: 0, calls: 0, flowT: 0 }; },
    sensors: {},
    lists: st => ({}),
    act(name, arg, st) { return { ok: false, msg: 'Usa LLAMAR para activar las turbinas.' }; },
    onCall(fn, args, ret, st, env) {
      st.calls++;
      if (fn === 'generarEnergia') {
        const [q, hgt] = args;
        const g = st.gates.find(gg => gg.caudal === q && gg.altura === hgt && !gg.called) || st.gates.find(gg => !gg.called && gg.caudal === q) || null;
        if (g) { g.called = true; g.power = ret || 0; g.open = 1; }
        st.total = st.gates.reduce((s, gg) => s + gg.power, 0);
        AudioSys.sfx('turbine');
      }
      if (fn === 'abrirCompuerta') { const g = st.gates[args[0] - 1]; if (g) { g.open = 1; g.called = true; } }
    },
    update(st, dt) { st.flowT += dt; },
    check(st, env) { return o.check(st, env); },
    draw(g, x, y, w, h, st, t) {
      vGradient(g, x, y, w, h, [[0, '#30C8E0'], [1, '#F0FFF8']], false);
      // escala de altura para que las etiquetas de la torre más alta quepan bajo el total
      const maxAlt = Math.max(...st.gates.map(gg => gg.altura)), kH = Math.min(7, (h - 52) / maxAlt);
      st.gates.forEach((gt, i) => {
        const gx = x + 10 + i * (w - 20) / st.gates.length, cw = (w - 20) / st.gates.length - 8;
        const top = Math.round(y + h - 20 - gt.altura * kH);
        rect(g, gx, top, cw, y + h - top, '#EDE6F5'); rect(g, gx, top, cw, 2, '#66D6A0');
        // agua cayendo
        if (gt.open) for (let k = 0; k < gt.caudal; k++) rect(g, gx + cw / 2 - gt.caudal + k * 2, top + ((st.flowT * 80 + k * 9) % (y + h - 26 - top)), 2, 5, '#DFFBFF');
        else rect(g, gx + cw / 2 - 3, top + 2, 6, 6, '#8A96C8');
        // turbina
        const ty = y + h - 16;
        pcircle(g, gx + cw / 2, ty, 6, gt.power > 0 ? PAL.sun : '#565E8C');
        const a = st.flowT * (gt.power > 0 ? 8 : 0);
        for (let b = 0; b < 4; b++) pline(g, gx + cw / 2, ty, gx + cw / 2 + Math.cos(a + b * 1.57) * 5, ty + Math.sin(a + b * 1.57) * 5, '#FFFFFF');
        drawText(g, 'Q' + gt.caudal + ' h' + gt.altura, gx + cw / 2, top - 18, '#10162B', { align: 'center' });
        drawText(g, gt.power ? Math.round(gt.power) + 'kW' : '--', gx + cw / 2, top - 9, gt.power ? PAL.deep : '#565E8C', { align: 'center' });
      });
      drawText(g, 'TOTAL ' + Math.round(st.total) + ' kW', x + 4, y + 4, PAL.deep);
      drawText(g, 'llamadas: ' + st.calls, x + w - 4, y + 4, PAL.deep, { align: 'right' });
    }
  };
}

// ---------- Mundo clasificador de residuos (listas / recorridos) ----------
function W_sorter(o) {
  const items = o.items;
  return {
    init() { const bins = {}; (o.binDefs || [['biodigestor'], ['reciclaje'], ['secado']]).forEach(b => bins[b[0]] = []); return { idx: -1, placed: items.map(() => null), bins, errors: 0, conveyor: 0, cur: null, gas: 0 }; },
    sensors: {
      tipo: (st, env) => env.vars && env.vars.residuo ? env.vars.residuo.type : '-',
    },
    lists: st => ({ residuos: items.map(it => ({ name: it.name, type: it.type })) }),
    act(name, arg, st, env) {
      const it = env.vars[o.itemVar || 'residuo'];
      if (!it) return { ok: false, msg: 'No hay ningún residuo seleccionado. Esta acción va DENTRO del PARA CADA.' };
      const k = env.vars.i;
      if (st.placed[k]) return { ok: false, msg: `${it.name} ya fue enviado a ${st.placed[k]}. ¿Hay dos acciones seguidas sin SI/SINO?` };
      const bin = (o.actMap || { a_biodigestor: 'biodigestor', a_reciclaje: 'reciclaje', a_secado: 'secado' })[name];
      if (!bin) return { ok: false, msg: 'Acción desconocida.' };
      st.placed[k] = bin; st.bins[bin].push(it); st.idx = k;
      const right = o.rule(it.type);
      if (bin !== right) { st.errors++; return { ok: false, msg: o.wrongMsg ? o.wrongMsg(it, bin, right) : bin === 'biodigestor' ? `¡${it.name} (${it.type}) en el biodigestor! Contaminaría el biogás. Solo lo orgánico va ahí.` : `${it.name} es ${it.type}: debía ir a ${right}.` }; }
      if (bin === 'biodigestor') { st.gas += 1; AudioSys.sfx('seed'); }
      return { ok: true, dur: 0.35 };
    },
    update(st, dt) { st.conveyor += dt; },
    check(st, env) {
      const missing = st.placed.filter(p => !p).length;
      if (missing) return { ok: false, msg: `Quedaron ${missing} residuos sin clasificar. ¿El recorrido pasó por TODA la lista?` };
      if (o.needCount && env.vars.organicos !== o.needCount) return { ok: false, msg: `El contador "organicos" vale ${env.vars.organicos}, pero hay ${o.needCount} residuos orgánicos. ¿Dónde se incrementa?` };
      return { ok: true, msg: o.okMsg || '¡Todo clasificado! El biodigestor produce biogás limpio.' };
    },
    extraVars(st, env) { return env && env.vars.residuo ? [] : []; },
    draw(g, x, y, w, h, st, t, scene) {
      rect(g, x, y, w, h, '#1F5A4A');
      // cinta
      rect(g, x + 4, y + 30, w - 8, 10, '#565E8C'); for (let i = 0; i < w; i += 8) rect(g, x + 4 + ((i + st.conveyor * 20) % (w - 8)), y + 34, 3, 1, '#8C96C0');
      const env = scene && scene.env;
      const cur = env && env.iter && Object.values(env.iter)[0];
      items.forEach((it, i) => {
        const ix = x + 8 + i * Math.min(22, (w - 16) / items.length);
        if (!st.placed[i]) { if (o.itemDraw) o.itemDraw(g, it, ix, y + 18); else drawWasteIcon(g, it.type, ix, y + 18); }
        drawText(g, '[' + i + ']', ix + 1, y + 44, cur && cur.idx === i ? PAL.sun : '#8C93B8');
        if (cur && cur.idx === i) drawText(g, '▼', ix + 2, y + 8, PAL.sun);
      });
      // contenedores
      const bins = o.binDefs || [['biodigestor', PAL.lime], ['reciclaje', PAL.sky], ['secado', PAL.orange]].filter(b => o.bins.includes(b[0]));
      bins.forEach(([b, c], i) => {
        const bx = x + 8 + i * (w - 16) / bins.length, bw = (w - 16) / bins.length - 6;
        rect(g, bx, y + 62, bw, 44, shade(c, -0.5)); rect(g, bx, y + 62, bw, 3, c);
        drawText(g, b, bx + bw / 2, y + 108, c, { align: 'center' });
        st.bins[b].forEach((it, k) => { if (o.itemDraw) o.itemDraw(g, it, bx + 3 + (k % 3) * 11, y + 68 + Math.floor(k / 3) * 11); else drawWasteIcon(g, it.type, bx + 3 + (k % 3) * 11, y + 68 + Math.floor(k / 3) * 11); });
      });
      if (st.gas) drawText(g, 'biogás +' + st.gas, x + w - 4, y + 4, PAL.lime, { align: 'right' });
    }
  };
}

// ---------- Mundo acumulador (contadores y sumas en un día) ----------
function W_accum(o) {
  return {
    init() { return { k: 0, bars: [] }; },
    sensors: { produccion: (st, env) => o.data[Math.min(st.k, o.data.length - 1)], hora: st => st.k },
    lists: () => ({ produccion_dia: o.data.slice() }),
    act(name, arg, st) {
      if (name === 'siguiente_hora') { st.bars.push(o.data[st.k]); st.k++; if (st.k > o.data.length) return { ok: false, msg: 'Te pasaste de las horas medidas: el bucle repite más veces de las necesarias.' }; return { ok: true, dur: 0.2 }; }
      return { ok: false, msg: 'Acción desconocida.' };
    },
    onVar(name, v, st) { if (o.onVar) o.onVar(name, v, st); },
    check(st, env) { return o.check(st, env); },
    draw(g, x, y, w, h, st, t, scene) {
      rect(g, x, y, w, h, '#10263A');
      const n = o.data.length, bw = (w - 20) / n, max = Math.max(...o.data);
      const env = scene && scene.env;
      o.data.forEach((v, i) => {
        const bh = (h - 50) * v / max;
        const done = env && env.iter && Object.values(env.iter)[0] ? Object.values(env.iter)[0].k > i : st.bars.length > i;
        rect(g, x + 10 + i * bw, y + h - 22 - bh, bw - 2, bh, done ? (o.color || PAL.sun) : '#3A4068');
        if (n <= 12) drawText(g, String(v), x + 10 + i * bw + bw / 2 - 1, y + h - 30 - bh, '#8C93B8', { align: 'center' });
      });
      rect(g, x + 8, y + h - 21, w - 16, 1, '#8C93B8');
      const tot = env && env.vars[o.var] != null ? env.vars[o.var] : '?';
      drawText(g, o.var + ' = ' + fmtVal(tot), x + 6, y + 6, PAL.lime);
      if (o.unit) drawText(g, o.unit, x + w - 6, y + 6, '#8C93B8', { align: 'right' });
    }
  };
}

// ---------- Mundo despacho (Ciudad Batería: IF con varias baterías) ----------
function W_dispatch(o) {
  return {
    init() { return { bats: o.bats.map(b => ({ ...b })), served: 0, hour: 0, fails: 0, log: [] }; },
    sensors: {
      demanda: st => o.demand[Math.min(st.hour, o.demand.length - 1)],
      soc_A: st => Math.round(st.bats[0].soc), soc_B: st => Math.round(st.bats[1].soc), soc_C: st => st.bats[2] ? Math.round(st.bats[2].soc) : 0
    },
    onTick(st, tick) { st.hour = tick; st.used = null; },
    act(name, arg, st) {
      const idx = { usar_A: 0, usar_B: 1, usar_C: 2 }[name];
      if (idx == null) return { ok: false, msg: 'Acción desconocida.' };
      st.used = idx; return { ok: true, dur: 0.25 };
    },
    afterTick(st, tick) {
      const d = o.demand[tick];
      if (st.used == null) return { fail: `Hora ${tick}: ninguna batería fue elegida.` };
      const b = st.bats[st.used];
      const need = d * 10 / (b.eff || 0.9);
      if (b.soc - need < 5) { st.fails++; st.log.push(false); return { fail: `Hora ${tick}: la batería ${b.name} bajó de su mínimo seguro (${Math.round(b.soc)}% → ${Math.round(b.soc - need)}%). ¿La condición elige la batería con más carga?` }; }
      b.soc -= need; st.served++; st.log.push(true);
      return null;
    },
    check(st) { return { ok: true, msg: o.okMsg || '¡Demanda atendida sin agotar ninguna batería!' }; },
    draw(g, x, y, w, h, st, t) {
      rect(g, x, y, w, h, '#150E3A');
      for (let i = 0; i < 20; i++) px(g, x + (i * 37) % w, y + (i * 17) % 40, '#FFFFFF');
      st.bats.forEach((b, i) => {
        const bx = x + 14 + i * 56, by = y + 20;
        rect(g, bx + 10, by - 4, 12, 4, '#8A8FB0'); rect(g, bx, by, 32, 70, '#2A2F6A'); strokeRect(g, bx, by, 32, 70, st.used === i ? PAL.sun : '#565E8C');
        const fh = Math.round(64 * b.soc / 100); const col = b.soc > 60 ? PAL.lime : b.soc > 25 ? PAL.sun : PAL.coral;
        rect(g, bx + 3, by + 67 - fh, 26, fh, col);
        drawText(g, b.name, bx + 16, by + 74, PAL.white, { align: 'center' });
        drawText(g, Math.round(b.soc) + '%', bx + 16, by + 30, PAL.white, { align: 'center', outline: PAL.ink });
        if (b.eff) drawText(g, 'ef ' + Math.round(b.eff * 100) + '%', bx + 16, by + 84, '#8C93B8', { align: 'center' });
      });
      drawText(g, 'hora ' + st.hour + ' · demanda ' + o.demand[Math.min(st.hour, o.demand.length - 1)] + ' kW', x + 4, y + 4, PAL.pink);
    }
  };
}
