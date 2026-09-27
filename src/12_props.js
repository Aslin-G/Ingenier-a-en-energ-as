// =====================================================================
//  PROPS: estructuras del mundo dibujadas y animadas por código
//  Cada prop recibe (g, x, y, e, lv): e.cfg guarda su estado/condiciones
// =====================================================================
const PROP_SIZES = {
  console: [16, 20], sign: [16, 18], bigconsole: [32, 28], lighthouse: [32, 96], windmill: [32, 64], house: [48, 44],
  stall: [40, 32], stage: [96, 52], solarfield: [80, 28], turbine: [32, 84], waterwheel: [40, 44], digester: [56, 36],
  geoplant: [56, 48], electrolyzer: [56, 44], batterytower: [24, 52], prismcore: [48, 72], tower: [28, 96], boat: [72, 34],
  flowers: [48, 18], table: [48, 20], tree: [48, 64], workbench: [40, 24], sluice: [16, 36], socket: [16, 16], node: [16, 20],
  mirror: [16, 24], banner: [64, 24], pillar: [16, 48], core: [64, 80], tank: [24, 32], kiosk: [32, 36], robot: [16, 22], bin: [16, 16],
  crystal: [24, 32], gate: [16, 48], campfire: [24, 18], screen: [48, 32], sensor: [8, 20]
};
const PROP_LIGHT = {
  lighthouse: (e, lv) => e.cfg.on && e.cfg.on(lv) ? { x: e.x + 16, y: e.y + 8, r: 140, c: PAL.sun } : null,
  house: (e, lv) => lv.zonePowered(e.x) ? { x: e.x + 24, y: e.y + 28, r: 50, c: PAL.sun, a: 0.8 } : null,
  stage: (e, lv) => ({ x: e.x + 48, y: e.y + 16, r: 90, c: PAL.pink }),
  stall: (e, lv) => lv.zonePowered(e.x) ? { x: e.x + 20, y: e.y + 10, r: 40, c: PAL.sun, a: 0.7 } : null,
  prismcore: (e) => ({ x: e.x + 24, y: e.y + 30, r: 110, c: hsl(e.t * 60, 90, 70) }),
  core: (e) => ({ x: e.x + 32, y: e.y + 40, r: 130, c: e.cfg.color ? e.cfg.color(e.lv) : PAL.white }),
  batterytower: (e) => ({ x: e.x + 12, y: e.y + 20, r: 40, c: PAL.lime, a: 0.6 }),
  digester: (e, lv) => e.cfg.on && e.cfg.on(lv) ? { x: e.x + 28, y: e.y + 12, r: 50, c: PAL.lime } : null,
  electrolyzer: (e, lv) => e.cfg.on && e.cfg.on(lv) ? { x: e.x + 28, y: e.y + 14, r: 50, c: PAL.aqua } : null,
  geoplant: (e, lv) => ({ x: e.x + 28, y: e.y + 30, r: 50, c: PAL.orange, a: 0.7 }),
  campfire: (e) => ({ x: e.x + 12, y: e.y + 8, r: 90, c: PAL.orange }),
  crystal: (e) => ({ x: e.x + 12, y: e.y + 12, r: 50, c: e.cfg.color || PAL.violet }),
  tower: (e, lv) => e.cfg.eclipse && e.cfg.eclipse(lv) ? { x: e.x + 14, y: e.y + 10, r: 70, c: PAL.violet } : null,
  screen: (e) => ({ x: e.x + 24, y: e.y + 14, r: 50, c: PAL.teal, a: 0.7 }),
  flowers: (e, lv) => e.cfg.open && e.cfg.open(lv) ? { x: e.x + 24, y: e.y + 6, r: 40, c: PAL.sun, a: 0.6 } : null,
  sign: () => null, table: () => null, tree: () => null, banner: () => null, workbench: () => null, bin: () => null, sensor: () => null, robot: () => null,
  mirror: () => null, pillar: () => null, kiosk: (e, lv) => lv.zonePowered(e.x) ? { x: e.x + 16, y: e.y + 12, r: 40, c: PAL.pink, a: 0.6 } : null,
  gate: () => null, boat: () => null, tank: () => null, sluice: () => null, windmill: () => null, turbine: () => null, solarfield: () => null, waterwheel: () => null
};
const R_ = (g, x, y, w, h, c) => rect(g, x, y, w, h, c);

const PROP_DRAW = {
  console(g, x, y, e, lv) {
    const done = e.done(), col = done ? PAL.lime : e.cfg.color || PAL.teal;
    R_(g, x + 2, y + 8, 12, 12, '#22306B'); R_(g, x + 2, y + 8, 12, 1, '#3E4C8A');
    R_(g, x, y, 16, 10, '#2A3570'); R_(g, x + 1, y + 1, 14, 8, '#0B1020');
    for (let i = 0; i < 3; i++) R_(g, x + 3, y + 2 + i * 2, 3 + ((i * 5 + Math.floor(e.t * 2)) % 8), 1, col);
    if (Math.floor(e.t * 2) % 2) R_(g, x + 12, y + 6, 2, 1, col);
    R_(g, x + 5, y + 12, 6, 2, '#10162B'); px(g, x + 6, y + 12, col);
  },
  sign(g, x, y, e) {
    R_(g, x + 7, y + 8, 2, 10, '#6B4A2A'); R_(g, x, y, 16, 10, '#B07A4A'); R_(g, x, y, 16, 1, '#D8A06A'); strokeRect(g, x, y, 16, 10, '#5E3A26');
    R_(g, x + 3, y + 3, 10, 1, '#5E3A26'); R_(g, x + 3, y + 6, 7, 1, '#5E3A26');
  },
  bigconsole(g, x, y, e, lv) {
    const col = e.cfg.color || PAL.aqua;
    R_(g, x + 4, y + 14, 24, 14, '#22306B'); R_(g, x, y, 32, 16, '#2A3570'); R_(g, x + 2, y + 2, 28, 12, '#0B1020');
    const glitch = e.cfg.glitch && e.cfg.glitch(lv) && Math.random() < 0.3;
    for (let i = 0; i < 4; i++) R_(g, x + 4 + (glitch ? randi(-2, 2) : 0), y + 4 + i * 2, 6 + ((i * 7 + Math.floor(e.t * 3)) % 16), 1, glitch ? PAL.violet : col);
    R_(g, x + 8, y + 18, 16, 3, '#10162B'); for (let i = 0; i < 5; i++) px(g, x + 9 + i * 3, y + 19, [PAL.coral, PAL.sun, PAL.lime, PAL.teal, PAL.pink][i]);
  },
  lighthouse(g, x, y, e, lv) {
    const on = e.cfg.on && e.cfg.on(lv);
    for (let i = 0; i < 80; i++) { const w = 12 + Math.floor(i * 0.1); R_(g, x + 16 - w / 2, y + 16 + i, w, 1, Math.floor(i / 10) % 2 ? '#FFF3D7' : '#FF6B6B'); }
    R_(g, x + 6, y + 10, 20, 7, '#22306B'); R_(g, x + 8, y + 11, 16, 5, on ? PAL.sun : '#3A4068');
    if (on) { R_(g, x + 10, y + 12, 4, 2, '#FFFFFF'); }
    R_(g, x + 4, y + 8, 24, 2, '#565E8C'); for (let k = 0; k < 6; k++) R_(g, x + 10 + k, y + 2 + k, 12 - k * 2, 1, '#22306B');
    R_(g, x + 13, y + 40, 6, 9, '#22306B'); R_(g, x + 14, y + 70, 5, 10, '#5E3A26');
    if (on) {
      g.globalAlpha = 0.18; const a = Math.sin(e.t * 0.8) * 0.6 + (e.t * 0.3 % 1 > 0.5 ? Math.PI : 0);
      for (let r = 6; r < 200; r += 2) { const w = r * 0.22; R_(g, x + 16 + Math.cos(a) * r, y + 13 + Math.sin(a) * r * 0.15 - w / 2, 2, w, PAL.sun); }
      g.globalAlpha = 1;
    }
  },
  windmill(g, x, y, e, lv) {
    const sp = e.cfg.speed ? e.cfg.speed(lv) : 1;
    e.rot = (e.rot || 0) + sp * 0.05;
    for (let i = 0; i < 44; i++) { const w = 8 + Math.floor(i * 0.2); R_(g, x + 16 - w / 2, y + 20 + i, w, 1, i % 11 === 0 ? '#E8D8B8' : '#FFF3D7'); }
    R_(g, x + 13, y + 52, 6, 12, '#8B5A3C'); R_(g, x + 14, y + 30, 4, 4, sp > 0.2 ? PAL.sun : '#3A4068');
    for (let k = 0; k < 7; k++) R_(g, x + 10 + k * 0.5, y + 14 + k, 12 - k, 1, e.cfg.roof || PAL.coral);
    const hx = x + 16, hy = y + 16;
    for (let b = 0; b < 4; b++) { const a = e.rot + b * Math.PI / 2; for (let r = 2; r < 15; r++) { const bx = hx + Math.cos(a) * r, by = hy + Math.sin(a) * r; R_(g, bx, by, 2, 2, r > 5 ? '#FFFFFF' : '#8B5A3C'); if (r > 5) px(g, bx + Math.cos(a + 1.57) * 2, by + Math.sin(a + 1.57) * 2, e.cfg.sail || PAL.sky); } }
    pcircle(g, hx, hy, 2, '#5E3A26');
    if (e.cfg.hot && e.cfg.hot(lv)) { if (Math.random() < 0.3) Particles.spawn({ x: e.x + 16, y: e.y + 16, vy: -30, vx: rand(-10, 10), life: 0.8, type: 'fade', size: 2, color: '#8C93B8' }); R_(g, x + 14, y + 30, 4, 4, Math.floor(e.t * 8) % 2 ? PAL.coral : PAL.orange); }
  },
  house(g, x, y, e, lv) {
    const on = lv.zonePowered(e.x), c = e.cfg.color || '#B07A4A';
    R_(g, x + 4, y + 18, 40, 26, c); R_(g, x + 4, y + 18, 40, 2, shade(c, 0.2));
    for (let k = 0; k < 14; k++) R_(g, x + 1 + k * 0.5 + k, y + 18 - k, 46 - k * 3, 1, e.cfg.roof || '#FF6B6B');
    R_(g, x + 12, y + 8, 12, 4, '#2A4A9A'); R_(g, x + 13, y + 9, 10, 1, '#9FE8FF');
    R_(g, x + 8, y + 24, 9, 8, on ? PAL.sun : '#22306B'); R_(g, x + 31, y + 24, 9, 8, on ? PAL.sun : '#22306B');
    R_(g, x + 12, y + 24, 1, 8, c); R_(g, x + 35, y + 24, 1, 8, c);
    R_(g, x + 20, y + 30, 8, 14, '#5E3A26'); px(g, x + 26, y + 37, PAL.sun);
    R_(g, x + 2, y + 42, 44, 2, '#5E3A26');
    if (on && e.cfg.plant !== false) { R_(g, x + 6, y + 38, 4, 4, '#FF9D42'); R_(g, x + 7, y + 34, 2, 4, '#66D66A'); px(g, x + 7, y + 33, PAL.pink); }
  },
  stall(g, x, y, e, lv) {
    const c = e.cfg.color || PAL.coral;
    R_(g, x + 2, y + 8, 2, 24, '#5E3A26'); R_(g, x + 36, y + 8, 2, 24, '#5E3A26');
    for (let k = 0; k < 40; k += 5) { R_(g, x + k, y + 2, 5, 7, (k / 5) % 2 ? c : '#FFF3D7'); R_(g, x + k, y + 9, 5, 1, shade(c, -0.3)); }
    R_(g, x + 3, y + 20, 34, 12, '#8B5A3C'); R_(g, x + 3, y + 20, 34, 2, '#B07A4A');
    const goods = e.cfg.goods || [PAL.coral, PAL.sun, PAL.lime, PAL.orange, PAL.pink];
    for (let k = 0; k < 6; k++) pcircle(g, x + 7 + k * 5, y + 18, 2, goods[k % goods.length]);
    if (lv.zonePowered(e.x)) for (let k = 0; k < 5; k++) px(g, x + 4 + k * 8, y + 10, [PAL.sun, PAL.pink, PAL.teal][k % 3]);
  },
  stage(g, x, y, e, lv) {
    R_(g, x, y + 36, 96, 16, '#5B3A8C'); R_(g, x, y + 36, 96, 2, '#9B76FF');
    R_(g, x + 4, y, 4, 36, '#3A2466'); R_(g, x + 88, y, 4, 36, '#3A2466'); R_(g, x, y - 2, 96, 4, '#3A2466');
    R_(g, x + 20, y + 4, 56, 28, '#10162B'); strokeRect(g, x + 20, y + 4, 56, 28, PAL.sun);
    const txt = e.cfg.screen ? e.cfg.screen(lv) : 'LUMINA LOOP';
    const col = e.cfg.screenColor ? e.cfg.screenColor(lv) : PAL.teal;
    drawText(g, txt, x + 48, y + 14, col, { align: 'center' });
    for (let k = 0; k < 12; k++) px(g, x + 8 + k * 7, y + 1, [PAL.sun, PAL.pink, PAL.teal, PAL.lime][(k + Math.floor(e.t * 4)) % 4]);
  },
  solarfield(g, x, y, e, lv) {
    const tilt = e.cfg.tilt ? e.cfg.tilt(lv) : 0.3, off = e.cfg.off && e.cfg.off(lv), dust = e.cfg.dust ? e.cfg.dust(lv) : 0;
    for (let p = 0; p < 4; p++) {
      const px0 = x + 2 + p * 20;
      R_(g, px0 + 8, y + 16, 2, 12, '#8A8FB0');
      const hgt = Math.round(10 * Math.cos(tilt)), sk = Math.round(8 * Math.sin(tilt));
      for (let k = 0; k < hgt; k++) R_(g, px0 + Math.round(k * sk / Math.max(1, hgt)) - 2, y + 16 - hgt + k, 18, 1, k === 0 ? '#9FE8FF' : off ? '#3A4068' : k % 3 === 0 ? '#59C7FF' : '#2A4A9A');
      if (!off && Math.floor(e.t * 2 + p) % 5 === 0) px(g, px0 + 4, y + 16 - hgt + 1, '#FFFFFF');
      if (dust > 0) { g.globalAlpha = dust; R_(g, px0 - 2, y + 16 - hgt, 18, hgt, '#D09850'); g.globalAlpha = 1; }
      if (off) { R_(g, px0 + 6, y + 20, 5, 3, '#10162B'); px(g, px0 + 8, y + 21, PAL.violet); }
    }
  },
  turbine(g, x, y, e, lv) {
    const sp = e.cfg.speed ? e.cfg.speed(lv) : 1;
    e.rot = (e.rot || 0) + sp * 0.08;
    for (let i = 0; i < 64; i++) R_(g, x + 15 - Math.floor(i / 22), y + 20 + i, 2 + Math.floor(i / 11), 1, '#FFFFFF');
    R_(g, x + 12, y + 14, 9, 6, '#E8F0FF'); px(g, x + 19, y + 16, sp > 0.3 ? PAL.lime : PAL.coral);
    for (let b = 0; b < 3; b++) { const a = e.rot + b * 2.094; for (let r = 2; r < 18; r++) R_(g, x + 16 + Math.cos(a) * r, y + 17 + Math.sin(a) * r, r < 14 ? 2 : 1, r < 14 ? 2 : 1, '#FFFFFF'); }
    pcircle(g, x + 16, y + 17, 2, '#C9D2F0');
    if (e.cfg.hot && e.cfg.hot(lv)) { R_(g, x + 12, y + 14, 9, 6, Math.floor(e.t * 8) % 2 ? PAL.coral : PAL.orange); if (Math.random() < 0.3) Particles.spawn({ x: e.x + 16, y: e.y + 14, vy: -30, life: 0.8, type: 'fade', size: 2, color: '#8C93B8' }); }
  },
  waterwheel(g, x, y, e, lv) {
    const sp = e.cfg.speed ? e.cfg.speed(lv) : 1; e.rot = (e.rot || 0) + sp * 0.04;
    pring(g, x + 20, y + 20, 18, '#8B5A3C'); pring(g, x + 20, y + 20, 17, '#B07A4A');
    for (let b = 0; b < 8; b++) { const a = e.rot + b * 0.785; pline(g, x + 20, y + 20, x + 20 + Math.cos(a) * 18, y + 20 + Math.sin(a) * 18, '#8B5A3C'); R_(g, x + 18 + Math.cos(a) * 18, y + 18 + Math.sin(a) * 18, 4, 4, '#D8A06A'); }
    pcircle(g, x + 20, y + 20, 3, '#5E3A26'); R_(g, x + 18, y + 20, 4, 24, '#6B4A2A');
    if (sp > 0.1) for (let k = 0; k < 3; k++) R_(g, x + 2 + k * 3, y + ((e.t * 60 + k * 7) % 40), 2, 5, '#DFFBFF');
  },
  digester(g, x, y, e, lv) {
    const on = e.cfg.on && e.cfg.on(lv);
    pellipse(g, x + 28, y + 22, 24, 14, on ? '#66D66A' : '#5E8C3A'); R_(g, x + 4, y + 22, 48, 14, on ? '#3FA85A' : '#4A6A3A');
    R_(g, x + 4, y + 30, 48, 1, '#2A7A4B'); pellipse(g, x + 20, y + 14, 6, 3, on ? '#B6F35B' : '#6A8A4A');
    R_(g, x + 44, y + 2, 4, 14, '#8A8FB0'); R_(g, x + 42, y, 8, 3, '#C9D2F0');
    if (on) { if (Math.random() < 0.2) Particles.spawn({ x: e.x + 46, y: e.y, vy: -20, vx: rand(-4, 4), life: 1.2, type: 'fade', size: 2, color: 'rgba(182,243,91,0.6)' }); drawText(g, 'CH4', x + 22, y + 24, '#FFF3D7'); }
    R_(g, x, y + 28, 6, 8, '#8B5A3C'); R_(g, x + 1, y + 26, 4, 2, '#B07A4A');
  },
  geoplant(g, x, y, e, lv) {
    R_(g, x + 4, y + 16, 48, 32, '#5A4A6A'); R_(g, x + 4, y + 16, 48, 2, '#8A7AA0');
    R_(g, x + 10, y + 2, 8, 16, '#6A5A7A'); R_(g, x + 36, y + 6, 8, 12, '#6A5A7A');
    for (let k = 0; k < 4; k++) R_(g, x + 8 + k * 11, y + 26, 7, 8, Math.floor(e.t * 2 + k) % 3 ? PAL.orange : PAL.sun);
    R_(g, x, y + 40, 56, 3, '#FF9D42'); R_(g, x, y + 44, 56, 2, '#8A5A5A');
    if (Math.random() < 0.3) Particles.spawn({ x: e.x + 14 + (Math.random() < 0.5 ? 0 : 26), y: e.y + 2, vy: -30, vx: rand(-6, 6), life: 1.4, type: 'fade', size: 3, color: 'rgba(255,255,255,0.5)' });
    const st = e.cfg.state ? e.cfg.state(lv) : null;
    if (st) drawText(g, st, x + 28, y + 19, { OFF: '#8C93B8', STARTING: PAL.sun, RUNNING: PAL.lime, COOLING: PAL.sky, FAULT: PAL.coral }[st] || PAL.cream, { align: 'center' });
  },
  electrolyzer(g, x, y, e, lv) {
    const on = e.cfg.on && e.cfg.on(lv);
    R_(g, x + 2, y + 14, 22, 30, '#E8F0FF'); R_(g, x + 2, y + 14, 22, 2, '#FFFFFF'); R_(g, x + 4, y + 18, 18, 22, '#9FE8FF');
    for (let k = 0; k < 5; k++) { const by = y + 38 - ((e.t * 20 + k * 5) % 20); if (on) px(g, x + 6 + k * 3, by, '#FFFFFF'); }
    R_(g, x + 30, y + 4, 12, 40, '#FFFFFF'); pellipse(g, x + 36, y + 4, 6, 3, '#FFFFFF'); R_(g, x + 44, y + 12, 10, 32, '#FF9D42'); pellipse(g, x + 49, y + 12, 5, 2, '#FFB86A');
    drawText(g, 'H2', x + 32, y + 22, '#2A7ACC'); drawText(g, 'O2', x + 45, y + 26, '#FFF3D7');
    R_(g, x + 24, y + 30, 6, 3, '#8A96C8'); R_(g, x + 42, y + 34, 2, 3, '#8A96C8');
    if (on) R_(g, x + 12, y + 8, 2, 6, PAL.sun);
  },
  batterytower(g, x, y, e, lv) {
    const soc = e.cfg.soc ? e.cfg.soc(lv) : 60;
    R_(g, x + 8, y, 8, 4, '#8A8FB0'); R_(g, x + 2, y + 4, 20, 48, '#2A2F6A'); strokeRect(g, x + 2, y + 4, 20, 48, '#565E8C');
    const col = soc > 60 ? PAL.lime : soc > 25 ? PAL.sun : PAL.coral, fh = Math.round(42 * soc / 100);
    R_(g, x + 5, y + 49 - fh, 14, fh, col); R_(g, x + 5, y + 49 - fh, 3, fh, shade(col, 0.3));
    drawText(g, Math.round(soc) + '%', x + 12, y + 24, PAL.white, { align: 'center', outline: PAL.ink });
  },
  prismcore(g, x, y, e, lv) {
    const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF', '#FF7FCF'];
    for (let i = 0; i < 64; i++) { const w = Math.floor((32 - Math.abs(i - 32)) * 0.7); R_(g, x + 24 - w, y + 4 + i, w * 2, 1, cols[(Math.floor(i / 8) + Math.floor(e.t * 3)) % 8]); }
    R_(g, x + 23, y + 4, 2, 64, '#FFFFFF');
    R_(g, x + 8, y + 66, 32, 6, '#3A2E6E');
  },
  core(g, x, y, e, lv) {
    const mode = e.cfg.mode ? e.cfg.mode(lv) : 'aurora';
    const cx = x + 32, cy = y + 40;
    if (mode === 'pz') {
      for (let i = 0; i < 5; i++) { const r = 30 - i * 6; const rot = e.t * 0.5 * (i % 2 ? 1 : -1); for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2; pline(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a + Math.PI / 2) * r, cy + Math.sin(a + Math.PI / 2) * r, i % 2 ? '#FFFFFF' : '#DCE2F5'); } }
      pcircle(g, cx, cy, 5, '#FFFFFF');
    } else if (mode === 'prisma') {
      PROP_DRAW.prismcore(g, x + 8, y, e, lv);
    } else {
      for (let r = 28; r > 4; r -= 5) pring(g, cx, cy, r + Math.sin(e.t * 2 + r) * 1.5, r > 18 ? PAL.teal : r > 10 ? PAL.sky : PAL.cream);
      pcircle(g, cx, cy, 4, '#FFFFFF');
    }
  },
  tower(g, x, y, e, lv) {
    for (let i = 0; i < 80; i++) { const w = 10 + Math.floor(i * 0.12); R_(g, x + 14 - w / 2, y + 16 + i, w, 1, i % 8 === 0 ? '#3A2E6E' : '#2A2458'); }
    R_(g, x + 4, y + 8, 20, 9, '#1A1440'); R_(g, x + 6, y + 10, 16, 5, e.cfg.eclipse && e.cfg.eclipse(lv) ? PAL.violet : '#3A4068');
    for (let k = 0; k < 8; k++) R_(g, x + 10 + k * 0.5, y + k, 8 - k, 1, '#1A1440');
    if (e.cfg.eclipse && e.cfg.eclipse(lv)) drawEclipseFigure(g, x + 14, y - 30, e.t, 2);
  },
  boat(g, x, y, e, lv) {
    const bob = Math.round(Math.sin(e.t * 1.5) * 1.5);
    for (let k = 0; k < 12; k++) R_(g, x + k, y + 18 + k * 0.6 + bob, 72 - k * 2, 1, k < 2 ? '#FFFFFF' : '#FF6B6B');
    R_(g, x + 20, y + 6 + bob, 30, 12, '#FFF3D7'); for (let k = 0; k < 4; k++) R_(g, x + 23 + k * 7, y + 9 + bob, 4, 4, '#59C7FF');
    R_(g, x + 52, y + 2 + bob, 10, 16, '#FFFFFF'); drawText(g, 'H2', x + 53, y + 7 + bob, '#2A7ACC');
    R_(g, x + 30, y - 4 + bob, 2, 10, '#565E8C');
    if (e.cfg.on && e.cfg.on(lv) && Math.random() < 0.3) Particles.spawn({ x: e.x + 2, y: e.y + 26, vx: -30, vy: -5, life: 0.8, type: 'bubble', size: 1, color: '#FFFFFF' });
  },
  flowers(g, x, y, e, lv) {
    const open = e.cfg.open && e.cfg.open(lv);
    for (let k = 0; k < 5; k++) {
      const fx = x + 4 + k * 9;
      R_(g, fx + 2, y + 6, 1, 12, '#3FA85A'); R_(g, fx, y + 12, 2, 1, '#66D66A');
      if (open) { R_(g, fx - 1, y + 1, 7, 5, '#FFD84A'); R_(g, fx + 1, y, 3, 7, '#FFD84A'); R_(g, fx + 1, y + 2, 3, 3, '#2A4A9A'); px(g, fx + 2, y + 3, '#9FE8FF'); }
      else { R_(g, fx + 1, y + 2, 3, 4, '#FF9D42'); R_(g, fx + 2, y + 1, 1, 1, '#FF9D42'); }
    }
  },
  table(g, x, y, e) {
    R_(g, x, y + 6, 48, 3, '#B07A4A'); R_(g, x + 3, y + 9, 3, 11, '#6B4A2A'); R_(g, x + 42, y + 9, 3, 11, '#6B4A2A');
    pellipse(g, x + 12, y + 4, 5, 2, '#FFF3D7'); R_(g, x + 9, y + 1, 6, 2, '#FF9D42');
    pellipse(g, x + 26, y + 4, 5, 2, '#FFF3D7'); R_(g, x + 23, y + 1, 3, 2, '#FFD84A'); R_(g, x + 27, y + 1, 3, 2, '#FF6B6B');
    R_(g, x + 36, y, 4, 6, '#9FE8FF'); R_(g, x + 37, y + 2, 2, 3, '#FF7FCF');
  },
  tree(g, x, y, e) {
    R_(g, x + 21, y + 34, 6, 30, '#6B4A2A'); R_(g, x + 21, y + 34, 2, 30, '#8B5A3C');
    const c = e.cfg.color || '#3FA85A';
    pcircle(g, x + 24, y + 22, 18, c); pcircle(g, x + 10, y + 30, 11, c); pcircle(g, x + 38, y + 30, 11, c); pcircle(g, x + 20, y + 14, 8, shade(c, 0.2));
    if (e.cfg.fruit) for (let k = 0; k < 6; k++) px(g, x + 10 + (k * 13) % 30, y + 16 + (k * 7) % 20, e.cfg.fruit);
  },
  workbench(g, x, y) {
    R_(g, x, y + 8, 40, 4, '#B07A4A'); R_(g, x + 2, y + 12, 3, 12, '#6B4A2A'); R_(g, x + 35, y + 12, 3, 12, '#6B4A2A');
    R_(g, x + 4, y + 2, 10, 6, '#22306B'); R_(g, x + 5, y + 3, 8, 4, PAL.teal); R_(g, x + 20, y + 5, 8, 3, PAL.stone); R_(g, x + 30, y + 3, 4, 5, PAL.sun);
  },
  sluice(g, x, y, e, lv) {
    const open = e.cfg.open ? e.cfg.open(lv) : 0;
    R_(g, x, y, 3, 36, '#C8BFD8'); R_(g, x + 13, y, 3, 36, '#C8BFD8');
    const gh = Math.round(30 * (1 - open));
    R_(g, x + 3, y + 36 - gh - 4, 10, gh, '#8A96C8'); for (let k = 0; k < gh; k += 4) R_(g, x + 3, y + 36 - gh - 4 + k, 10, 1, '#565E8C');
    if (open > 0) for (let k = 0; k < 3; k++) R_(g, x + 4 + k * 3, y + 30 + ((e.t * 40 + k * 4) % 6), 2, 3, '#DFFBFF');
    drawText(g, Math.round(open * 100) + '%', x + 8, y - 8, PAL.aqua, { align: 'center', outline: PAL.ink });
  },
  socket(g, x, y, e, lv) {
    const ok = e.cfg.done && e.cfg.done(lv);
    pring(g, x + 8, y + 8, 7, ok ? PAL.lime : PAL.violet); pring(g, x + 8, y + 8, 5 + Math.sin(e.t * 4), ok ? PAL.lime : PAL.lilac);
    drawText(g, 'f()', x + 8, y + 5, ok ? PAL.lime : PAL.lilac, { align: 'center' });
  },
  node(g, x, y, e, lv) {
    const lit = e.cfg.lit && e.cfg.lit(lv);
    R_(g, x + 2, y + 6, 12, 14, '#22306B'); strokeRect(g, x + 2, y + 6, 12, 14, lit ? PAL.sky : '#3E4C8A');
    pcircle(g, x + 8, y + 5, 4, lit ? PAL.sky : '#3A4068'); px(g, x + 7, y + 4, '#FFFFFF');
    if (e.cfg.label) drawText(g, e.cfg.label, x + 8, y + 10, lit ? PAL.white : '#8C93B8', { align: 'center' });
  },
  mirror(g, x, y, e) {
    R_(g, x + 7, y + 10, 2, 14, '#8A6A4A');
    for (let k = 0; k < 10; k++) R_(g, x + 1 + k * 0.4, y + k, 14, 1, k < 2 ? '#FFFFFF' : k % 3 ? '#59C7FF' : '#9FE8FF');
  },
  banner(g, x, y, e) {
    const cols = [PAL.coral, PAL.sun, PAL.teal, PAL.pink, PAL.lime, PAL.violet, PAL.orange];
    for (let k = 0; k < 64; k++) { const yy = y + 2 + Math.round(Math.sin(k / 64 * Math.PI) * 8); px(g, x + k, yy, '#FFF3D7'); if (k % 8 === 4) { const c = cols[(k / 8 | 0) % cols.length]; for (let j = 0; j < 5; j++) R_(g, x + k - 2 + j * 0.5, yy + 1 + j, 5 - j, 1, c); } }
  },
  pillar(g, x, y) { R_(g, x + 2, y, 12, 48, '#E8E6F5'); R_(g, x, y, 16, 3, '#FFD84A'); R_(g, x, y + 45, 16, 3, '#FFD84A'); R_(g, x + 4, y + 3, 1, 42, '#FFFFFF'); },
  tank(g, x, y, e) { R_(g, x + 2, y + 4, 20, 28, e.cfg.color || '#FFFFFF'); pellipse(g, x + 12, y + 4, 10, 3, shade(e.cfg.color || '#FFFFFF', 0.2)); drawText(g, e.cfg.label || 'H2', x + 12, y + 15, '#2A7ACC', { align: 'center' }); },
  kiosk(g, x, y, e, lv) {
    R_(g, x + 2, y + 10, 28, 26, '#22306B'); R_(g, x, y + 4, 32, 7, PAL.pink); R_(g, x + 5, y + 14, 22, 12, lv.zonePowered(e.x) ? '#30E1C5' : '#10162B');
    drawText(g, e.cfg.label || 'SOC', x + 16, y + 17, '#10162B', { align: 'center' });
  },
  robot(g, x, y, e, lv) {
    const f = Spr.beta[Math.floor(e.t * 3) % 4]; g.drawImage(f.r, x, y);
  },
  bin(g, x, y, e) {
    const c = e.cfg.color || PAL.lime;
    R_(g, x + 1, y + 4, 14, 12, c); R_(g, x, y + 2, 16, 3, shade(c, -0.25)); R_(g, x + 3, y + 7, 10, 1, shade(c, 0.3));
    if (e.cfg.icon) drawWasteIcon(g, e.cfg.icon, x + 3, y + 6);
  },
  crystal(g, x, y, e) {
    const c = e.cfg.color || PAL.violet;
    for (let k = 0; k < 30; k++) { const w = Math.max(1, 8 - Math.abs(k - 22) * 0.6); R_(g, x + 12 - w / 2, y + 30 - k, w, 1, k > 24 ? '#FFFFFF' : c); }
    R_(g, x + 3, y + 22, 4, 8, shade(c, 0.2)); R_(g, x + 18, y + 20, 3, 10, shade(c, -0.2));
  },
  gate(g, x, y, e, lv) {
    const open = e.cfg.open && e.cfg.open(lv);
    if (open) { R_(g, x + 2, y + 44, 12, 4, '#3A4068'); return; }
    R_(g, x + 2, y, 12, 48, '#565E8C'); R_(g, x + 2, y, 2, 48, '#8C96C0');
    for (let k = 0; k < 48; k += 6) R_(g, x + 4, y + k, 8, 1, '#3A4068');
    R_(g, x + 6, y + 20, 4, 4, Math.floor(e.t * 3) % 2 ? PAL.coral : '#8A2A3A');
  },
  campfire(g, x, y, e) {
    R_(g, x + 4, y + 14, 16, 3, '#6B4A2A'); R_(g, x + 7, y + 12, 10, 3, '#8B5A3C');
    for (let k = 0; k < 6; k++) { const fh = 4 + Math.abs(Math.sin(e.t * 9 + k)) * 7; R_(g, x + 7 + k * 2, y + 13 - fh, 2, fh, k % 2 ? PAL.sun : PAL.orange); }
    if (Math.random() < 0.3) Particles.spawn({ x: e.x + 12, y: e.y + 4, vy: -30, vx: rand(-8, 8), life: 1, type: 'dot', color: PAL.sun });
  },
  screen(g, x, y, e, lv) {
    R_(g, x, y, 48, 28, '#22306B'); R_(g, x + 2, y + 2, 44, 24, '#0B1020'); R_(g, x + 22, y + 28, 4, 4, '#3A4068');
    const lines = e.cfg.lines ? e.cfg.lines(lv) : ['...'];
    lines.slice(0, 3).forEach((l, i) => drawText(g, l, x + 4, y + 4 + i * 8, e.cfg.color || PAL.teal));
  },
  sensor(g, x, y, e, lv) {
    R_(g, x + 3, y + 6, 2, 14, '#8A8FB0'); pcircle(g, x + 4, y + 4, 3, e.cfg.color || PAL.sun); px(g, x + 3, y + 3, '#FFFFFF');
  }
};

// Figura de ECLIPSE (silueta de píxeles fragmentados)
function drawEclipseFigure(g, x, y, t, scale = 1, alpha = 1) {
  const rng = mulberry32(Math.floor(t * 12));
  g.globalAlpha = alpha;
  for (let i = 0; i < 46 * scale; i++) {
    const yy = rng() * 26 * scale, spread = (yy < 8 * scale ? 4 : 7) * scale;
    const xx = (rng() - 0.5) * spread * 2;
    rect(g, x + xx, y + yy, scale > 1 ? 2 : 1 + (rng() < 0.3 ? 1 : 0), scale > 1 ? 2 : 1, choice(['#5B3A8C', '#9B76FF', '#3A2466', '#C9B2FF', '#2A1A44']));
  }
  pellipse(g, x, y + 4 * scale, 3 * scale, 3 * scale, '#2A1A44');
  rect(g, x - 2 * scale, y + 3 * scale, scale, scale, '#FF7FCF'); rect(g, x + 1 * scale, y + 3 * scale, scale, scale, '#FF7FCF');
  if (rng() < 0.3) rect(g, x - 8 * scale, y + rng() * 26 * scale, 16 * scale, 1, '#FF7FCF');
  g.globalAlpha = 1;
}
