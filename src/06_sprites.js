// =====================================================================
//  SPRITES PROCEDURALES: Lía, PÍX, Lumi, personajes, enemigos, iconos
//  Todo se dibuja con código / matrices de píxeles y se pre-renderiza.
// =====================================================================
const Spr = {};
const OUTLINE = '#1A1030';

// ---------- LÍA LOOP ----------
const LIA_PAL = {
  h: '#FF6B6B', H: '#D0415F', j: '#FFA08A', s: '#F7C39A', S: '#DE9A76', e: '#1A1030', w: '#FFFFFF',
  y: '#FFD84A', Y: '#E0A92A', c: '#30E1C5', C: '#C9FFF4', m: '#B5475A', b: '#FF8FA3',
  t: '#30E1C5', T: '#1FA89A', u: '#FFD84A', p: '#2A4A9A', P: '#1B3170', o: '#8B5A3C', O: '#5E3A26'
};
const LIA_HEAD = [
  '....hhhhh..',
  '..hhjjhhhh.',
  '.hhjhhhhhhh',
  '.hjhyyyyyyy',
  'hhhhycCycCy',
  'hhhhhyyyyy.',
  'hhhhshhssss',
  'hHhhsssssss',
  '.Hhhsssssss',
  '.HhSsssssss',
  '..H.SSssss.'
];
function liaHead(expr) {
  const rows = LIA_HEAD.map(r => r.split(''));
  const set = (x, y, ch) => { if (rows[y] && x >= 0 && x < rows[y].length) rows[y][x] = ch; };
  // ojos en (6,7-8) y (9,7-8); boca fila 9
  switch (expr) {
    case 'blink': set(6, 8, 'e'); set(9, 8, 'e'); set(8, 9, 'm'); break;
    case 'happy': set(5, 8, 'e'); set(6, 7, 'e'); set(7, 8, 'e'); set(9, 7, 'e'); set(10, 8, 'e'); set(8, 9, 'm'); set(9, 9, 'm'); set(5, 9, 'b'); break;
    case 'surprise': set(6, 7, 'e'); set(6, 8, 'e'); set(9, 7, 'e'); set(9, 8, 'e'); set(5, 7, 'w'); set(8, 9, 'm'); set(8, 10, 'm'); break;
    case 'hurt': set(6, 7, 'e'); set(7, 8, 'e'); set(9, 8, 'e'); set(10, 7, 'e'); set(8, 9, 'm'); set(9, 9, 'm'); break;
    case 'focus': set(6, 8, 'e'); set(9, 8, 'e'); set(6, 7, 'H'); set(9, 7, 'H'); set(8, 9, 'm'); break;
    case 'sad': set(6, 8, 'e'); set(9, 8, 'e'); set(7, 7, 'H'); set(10, 7, 'H'); set(8, 10, 'm'); break;
    default: set(6, 7, 'e'); set(6, 8, 'e'); set(9, 7, 'e'); set(9, 8, 'e'); set(8, 9, 'm'); set(5, 9, 'b');
  }
  return spriteFromRows(rows.map(r => r.join('')), LIA_PAL);
}

// pose: {bob, legA, legB (desplazamientos x del pie), liftA, liftB, arm (-2..2), hair (desplazamiento coleta), expr, squash, armUp}
function paintLia(pose, cos) {
  const c = makeCanvas(20, 27), g = c.g;
  const L = LIA_PAL;
  const by = 1 + (pose.bob || 0);
  const sq = pose.squash || 0; // aplastamiento al aterrizar
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const hipY = 19 + sq, feetY = 24;
  // mochila solar (cosmético)
  if (cos && cos.pack) { R(3, 13 + by + sq, 4, 6, '#2A4A9A'); R(3, 13 + by + sq, 4, 1, PAL.sun); R(4, 14 + by + sq, 2, 1, PAL.aqua); R(4, 16 + by + sq, 2, 1, PAL.aqua); }
  // capa eólica (cosmético)
  if (cos && cos.cape) { const sw = pose.hair || 0; R(4 - Math.max(0, sw), 13 + by + sq, 3, 8, '#7FE7FF'); R(3 - Math.max(0, sw), 18 + by + sq, 3, 3, '#59C7FF'); }
  // pierna trasera
  const leg = (fx, lift, col, colS, boot) => {
    const x0 = 8, top = hipY + by * 0;
    R(x0 + Math.round(fx / 2), top, 2, 3, col);
    R(x0 + fx, top + 3 - lift, 2, 2 + (lift ? 0 : 0), colS);
    R(x0 + fx - (fx < 0 ? 1 : 0), feetY - lift, 3, 2, boot);
  };
  const bootCol = cos && cos.boots ? '#30A8E1' : L.o, bootS = cos && cos.boots ? '#1B6FA0' : L.O;
  leg(pose.legB || 0, pose.liftB || 0, L.P, L.P, bootS);
  // brazo trasero
  R(6, 14 + by + sq, 2, 4, L.T);
  R(6, 18 + by + sq, 2, 1, L.S);
  // torso (chaqueta)
  R(7, 13 + by + sq, 6, 6 - sq, L.t);
  R(7, 13 + by + sq, 1, 6 - sq, L.T);
  R(11, 13 + by + sq, 1, 6 - sq, L.u); // cremallera amarilla
  R(7, 18 + by, 6, 1, L.T);
  // pierna delantera
  leg(pose.legA || 0, pose.liftA || 0, L.p, L.p, bootCol);
  // coleta
  const hs = pose.hair || 0;
  R(2 - hs, 5 + by + sq, 3, 2, L.h); R(1 - hs, 7 + by + sq, 3, 2, L.h); R(1 - hs, 9 + by + sq, 2, 2, L.H); R(4, 4 + by + sq, 2, 2, L.y);
  // cabeza
  g.drawImage(liaHead(pose.expr), 5, 2 + by + sq);
  // gafas debug (cosmético): lentes en los ojos
  if (cos && cos.goggles) { R(10, 9 + by + sq, 5, 2, 'rgba(48,225,197,0.65)'); R(10, 9 + by + sq, 5, 1, PAL.sun); }
  // brazo delantero
  const ay = pose.armUp ? -4 : 0;
  const ax = 10 + (pose.arm || 0);
  R(ax, 14 + by + sq + ay, 2, 4, L.t);
  R(ax, 18 + by + sq + ay, 2, 1, L.s);
  if (pose.tool) { R(ax + 2, 16 + by + sq, 3, 1, PAL.stone); R(ax + 4, 15 + by + sq, 1, 3, PAL.sun); }
  return outlined(c, OUTLINE);
}

// fotograma de reposo para escenas sin física (taller, créditos): respiración lenta y parpadeo ocasional
function liaIdleFrame(t) { return ((t % 3.7) < 0.13 ? 2 : 0) + ((t % 2.4) > 1.3 ? 1 : 0); }
function buildLia(cos = {}) {
  const A = {};
  const mk = (arr) => arr.map(p => { const r = paintLia(p, cos); return { r, l: flipCanvas(r) }; });
  // idle: [normal, normal respirando, parpadeo, parpadeo respirando]
  A.idle = mk([{ expr: 'n' }, { expr: 'n', bob: 1 }, { expr: 'blink' }, { expr: 'blink', bob: 1 }]);
  // ciclo de paso de 6 fotogramas: contacto, recogida, paso (x2), con balanceo de brazos opuesto a las piernas
  A.walk = mk([
    { legA: 2, legB: -2, arm: -1, hair: 0 },
    { legA: 1, legB: -1, liftB: 1, arm: 0, hair: 1, bob: -1 },
    { legA: -1, legB: 1, liftB: 1, arm: 1, hair: 1, bob: -1 },
    { legA: -2, legB: 2, arm: 1, hair: 0 },
    { legA: -1, legB: 1, liftA: 1, arm: 0, hair: 1, bob: -1 },
    { legA: 1, legB: -1, liftA: 1, arm: -1, hair: 1, bob: -1 }
  ]);
  A.run = mk([
    { legA: 3, legB: -3, arm: -2, hair: 1, expr: 'focus' },
    { legA: 1, legB: -2, liftB: 2, bob: -1, arm: -1, hair: 2, expr: 'focus' },
    { legA: -1, legB: 1, liftB: 1, bob: -1, arm: 1, hair: 2, expr: 'focus' },
    { legA: -3, legB: 3, arm: 2, hair: 1, expr: 'focus' },
    { legA: -2, legB: 1, liftA: 2, bob: -1, arm: 1, hair: 2, expr: 'focus' },
    { legA: 1, legB: -1, liftA: 1, bob: -1, arm: -1, hair: 2, expr: 'focus' }
  ]);
  A.jump = mk([{ legA: 1, legB: -1, liftA: 2, liftB: 1, armUp: true, hair: -1, expr: 'focus' }]);
  A.fall = mk([{ legA: -1, legB: 1, liftA: 0, liftB: 1, arm: 1, hair: -2, bob: -1, expr: 'surprise' }]);
  A.land = mk([{ squash: 2, expr: 'blink' }]);
  A.interact = mk([{ arm: 2, expr: 'focus' }, { arm: 3, expr: 'focus' }]);
  A.program = mk([{ arm: 2, tool: true, expr: 'focus' }, { arm: 3, tool: true, expr: 'focus', bob: 1 }]);
  A.celebrate = mk([{ armUp: true, expr: 'happy', liftA: 2, liftB: 2, bob: -2 }, { armUp: true, expr: 'happy' }]);
  A.surprise = mk([{ expr: 'surprise', bob: -1, arm: -1 }]);
  A.hurt = mk([{ expr: 'hurt', arm: -2, legA: -1, legB: 1, hair: 2 }]);
  A.ability = mk([{ armUp: true, expr: 'focus', arm: 2 }]);
  A.sad = mk([{ expr: 'sad', bob: 1 }]);
  A.climb = mk([{ armUp: true, legA: 0, legB: 0, liftA: 2, expr: 'focus' }, { armUp: false, liftB: 2, expr: 'focus' }]);
  A.swim = mk([{ legA: 2, legB: -2, arm: 2, hair: 2, bob: 1 }, { legA: -2, legB: 2, arm: -1, hair: 3, bob: 0 }]);
  A.glide = mk([{ armUp: true, legA: -1, legB: 1, liftA: 1, liftB: 1, hair: 3, expr: 'happy' }]);
  // Lumisable: preparación, golpe y seguimiento (la hoja se dibuja aparte, con la luz de Lumi)
  A.slash = mk([{ armUp: true, arm: 0, expr: 'focus', legA: 1, legB: -1 }, { arm: 3, expr: 'focus', legA: 2, legB: -2, hair: 1 }, { arm: 2, expr: 'focus', legA: 2, legB: -2, hair: 2 }]);
  A.slashUp = mk([{ arm: 1, expr: 'focus', bob: 1 }, { armUp: true, arm: 2, expr: 'focus', bob: -1, liftA: 1 }, { armUp: true, arm: 1, expr: 'focus' }]);
  A.slashDown = mk([{ armUp: true, liftA: 2, liftB: 1, expr: 'focus', hair: -1 }, { arm: 2, liftA: 2, liftB: 2, expr: 'focus', hair: -2 }, { arm: 2, liftA: 1, liftB: 2, expr: 'focus', hair: -2 }]);
  A.charge = mk([{ arm: -1, expr: 'focus', legA: 2, legB: -2, squash: 1 }]);
  return A;
}

// ---------- PÍX (colibrí-dron: turquesa, amarillo, magenta) ----------
function buildPix(quiet = false) {
  const P = { t: '#30E1C5', T: '#1FA89A', y: '#FFD84A', m: '#FF4FB8', M: '#B8338A', w: '#FFFFFF', e: '#1A1030', g: '#D6F6FF', k: '#7C86B8' };
  const body = [
    '.....mm.....',
    '....tttt....',
    '...tttwet...',
    'yyyytttttt..',
    '...Tttttyy..',
    '....TTTTm...',
    '.....mmm....'
  ];
  const wings = [
    ['...gg.', '..ggg.', '.gg...'],
    ['......', 'gggg..', '..gg..'],
    ['......', '......', 'ggggg.'],
    ['......', 'gggg..', '..gg..']
  ];
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const c = makeCanvas(14, 11);
    const wy = f === 0 ? 0 : f === 2 ? 5 : 2;
    const pal = Object.assign({}, P);
    if (quiet) { pal.t = '#6FB5AC'; pal.T = '#4F8A84'; pal.m = '#B86A98'; pal.y = '#CFB76A'; }
    c.g.drawImage(spriteFromRows(body, pal), 0, 3);
    c.g.drawImage(spriteFromRows(wings[f], pal), 5, wy);
    const o = outlined(c, OUTLINE);
    frames.push({ r: o, l: flipCanvas(o) });
  }
  return frames;
}

// ---------- LUMI (luciérnaga + gota + estrella) ----------
function buildLumi() {
  const frames = [];
  const shapes = [
    ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
    ['...#...', '..###..', '.#####.', '.#####.', '.#####.', '..###..', '.......'],
    ['.......', '..###..', '.#####.', '#######', '#######', '.#####.', '..###..']
  ];
  for (const s of shapes) frames.push(s);
  return frames; // se colorean en tiempo real según emoción
}
function drawLumiShape(g, x, y, shape, core, edge, eyes = true, mood = 'n') {
  for (let r = 0; r < shape.length; r++) for (let q = 0; q < shape[r].length; q++) {
    if (shape[r][q] !== '#') continue;
    const d = Math.abs(r - 3) + Math.abs(q - 3);
    g.fillStyle = d <= 1 ? PAL.white : d <= 2 ? core : edge;
    g.fillRect(x + q, y + r, 1, 1);
  }
  if (eyes) {
    g.fillStyle = '#1A1030';
    if (mood === 'happy') { g.fillRect(x + 2, y + 3, 1, 1); g.fillRect(x + 4, y + 3, 1, 1); }
    else if (mood === 'sleep') { g.fillRect(x + 2, y + 4, 1, 1); g.fillRect(x + 4, y + 4, 1, 1); }
    else { g.fillRect(x + 2, y + 3, 1, 2); g.fillRect(x + 4, y + 3, 1, 2); }
  }
}

// ---------- Personajes humanos genéricos (NPC) ----------
// o: {skin, hair, style, shirt, pants, shoes, acc:[], kind:'adult'|'child'|'elder'|'tall', eyes}
function paintHuman(o, pose) {
  const c = makeCanvas(18, 28), g = c.g;
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const kind = o.kind || 'adult';
  const child = kind === 'child', elder = kind === 'elder', tall = kind === 'tall';
  const skin = o.skin || PAL.skin, skinS = shade(skin, -0.18);
  const hair = o.hair || '#5B3A26', hairS = shade(hair, -0.25);
  const shirt = o.shirt || PAL.coral, shirtS = shade(shirt, -0.22);
  const pants = o.pants || PAL.deep, shoes = o.shoes || '#5E3A26';
  const acc = o.acc || [];
  const feet = 27;
  const legH = child ? 3 : tall ? 6 : 5;
  const torsoH = child ? 5 : tall ? 8 : 7;
  const headH = child ? 8 : 8;
  const bob = pose.bob || 0;
  const hipY = feet - 2 - legH;
  const torsoY = hipY - torsoH + (elder ? 1 : 0);
  const headY = torsoY - headH + 1 + bob + (elder ? 1 : 0);
  const hx = elder ? 6 : 5; // posición x de la cabeza
  // piernas
  const la = pose.legA || 0, lb = pose.legB || 0;
  if (acc.includes('dress')) {
    R(6, hipY - 1, 7, legH - 1, o.dress || shirt); R(7, feet - 3, 2, 1, skin); R(10, feet - 3, 2, 1, skin);
    R(6 + Math.round(lb / 2), feet - 2, 3, 2, shoes); R(10 + Math.round(la / 2), feet - 2, 3, 2, shoes);
  } else {
    R(7 + Math.round(lb / 2), hipY, 2, legH, shade(pants, -0.2)); R(6 + lb, feet - 2, 3, 2, shade(shoes, -0.2));
    R(10 + Math.round(la / 2), hipY, 2, legH, pants); R(10 + la, feet - 2, 3, 2, shoes);
  }
  // torso
  R(6, torsoY, 7, torsoH + (acc.includes('dress') ? 0 : 1), shirt);
  R(6, torsoY, 1, torsoH, shirtS);
  if (acc.includes('apron')) { R(8, torsoY + 2, 4, torsoH - 1, o.apron || '#FFF3D7'); R(8, torsoY + 1, 1, 1, o.apron || '#FFF3D7'); R(11, torsoY + 1, 1, 1, o.apron || '#FFF3D7'); }
  if (acc.includes('labcoat')) { R(5, torsoY, 2, torsoH + 3, '#EDEBF7'); R(12, torsoY, 2, torsoH + 3, '#EDEBF7'); R(12, torsoY, 1, torsoH + 3, '#C9C5E0'); }
  if (acc.includes('toolbelt')) { R(6, hipY - 1, 7, 1, '#8B5A3C'); R(12, hipY - 1, 1, 2, PAL.stone); R(8, hipY - 1, 1, 1, PAL.sun); }
  if (acc.includes('scarf')) { R(6, torsoY, 8, 2, o.scarf || PAL.sun); R(4 - (pose.arm || 0), torsoY + 1, 3, 2, o.scarf || PAL.sun); }
  if (acc.includes('vest')) { R(7, torsoY + 1, 2, torsoH - 1, o.vest || PAL.orange); R(11, torsoY + 1, 2, torsoH - 1, o.vest || PAL.orange); }
  // brazos
  const arm = pose.arm || 0;
  R(5, torsoY + 1, 1, torsoH - 2, shirtS); R(5, torsoY + torsoH - 1, 1, 1, skinS);
  const aUp = pose.armUp ? -3 : 0;
  R(12 + (arm > 0 ? 1 : 0), torsoY + 1 + aUp, 2, torsoH - 2, shirt); R(12 + (arm > 0 ? 1 : 0), torsoY + torsoH - 1 + aUp, 2, 1, skin);
  if (acc.includes('cane')) { R(15, torsoY + 3, 1, feet - torsoY - 3, '#8B5A3C'); R(14, torsoY + 3, 2, 1, '#8B5A3C'); }
  if (acc.includes('wrench')) { R(14, torsoY + 2, 1, 4, PAL.stone); R(13, torsoY + 2, 3, 1, PAL.stone); }
  // cabeza
  const hw = child ? 7 : 8;
  R(hx, headY, hw, headH - 1, skin);
  R(hx, headY + headH - 2, hw, 1, skinS);
  // ojos
  const ex = hx + hw - 3, ey = headY + 3;
  if (pose.blink) R(ex - 2, ey + 1, 4, 1, OUTLINE);
  else { R(ex - 2, ey, 1, 2, OUTLINE); R(ex + 1, ey, 1, 2, OUTLINE); }
  if (pose.talk) R(ex - 1, ey + 3, 2, 1, '#8A3A4A'); else R(ex - 1, ey + 3, 2, 1, skinS);
  if (!child && !acc.includes('beard')) R(ex - 3, ey + 2, 1, 1, shade(skin, -0.05));
  // pelo
  const st = o.style || 'short';
  if (st === 'short' || st === 'spiky' || st === 'curly') {
    R(hx - 1, headY - 1, hw + 1, 3, hair); R(hx - 1, headY + 2, 2, 3, hair);
    if (st === 'spiky') { R(hx, headY - 2, 1, 1, hair); R(hx + 3, headY - 2, 1, 1, hair); R(hx + 6, headY - 2, 1, 1, hair); }
    if (st === 'curly') { R(hx - 2, headY, 1, 4, hair); R(hx + hw - 1, headY - 1, 2, 2, hair); R(hx + 2, headY - 2, 4, 1, hair); }
  } else if (st === 'long') {
    R(hx - 1, headY - 1, hw + 1, 3, hair); R(hx - 1, headY + 2, 3, headH + 3, hair); R(hx - 1, headY + 2, 1, headH + 3, hairS);
  } else if (st === 'bun') {
    R(hx - 1, headY - 1, hw + 1, 3, hair); R(hx - 1, headY + 2, 2, 2, hair); R(hx + 1, headY - 4, 4, 3, hair); R(hx + 1, headY - 4, 4, 1, shade(hair, 0.2));
  } else if (st === 'braids') {
    R(hx - 1, headY - 1, hw + 1, 3, hair); R(hx - 1, headY + 2, 2, 7, hair); R(hx - 2, headY + 5, 1, 1, PAL.pink); R(hx + hw - 1, headY + 2, 2, 3, hair);
  } else if (st === 'bald') {
    R(hx - 1, headY + 1, 2, 3, hair);
  } else if (st === 'mohawk') {
    R(hx + 1, headY - 3, 4, 3, hair); R(hx - 1, headY + 1, 2, 3, hair);
  }
  if (acc.includes('cap')) { R(hx - 1, headY - 2, hw + 1, 3, o.cap || PAL.orange); R(hx - 3, headY, 3, 1, o.cap || PAL.orange); R(hx + 2, headY - 1, 2, 1, PAL.sun); }
  if (acc.includes('hat')) { R(hx - 2, headY - 1, hw + 4, 1, o.hatC || '#2A4A9A'); R(hx, headY - 4, hw, 3, o.hatC || '#2A4A9A'); R(hx, headY - 2, hw, 1, PAL.cream); }
  if (acc.includes('strawhat')) { R(hx - 3, headY - 1, hw + 6, 1, '#E8C170'); R(hx, headY - 4, hw, 3, '#E8C170'); R(hx, headY - 2, hw, 1, PAL.coral); }
  if (acc.includes('panelhat')) { R(hx - 1, headY - 3, hw + 2, 2, '#2A4A9A'); R(hx, headY - 3, 2, 1, PAL.aqua); R(hx + 4, headY - 3, 2, 1, PAL.aqua); R(hx + 3, headY - 1, 1, 2, PAL.stone); }
  if (acc.includes('glasses')) { R(ex - 3, ey - 1, 3, 3, 'rgba(0,0,0,0)'); strokeRect(g, ex - 3, ey - 1, 3, 3, o.glassC || '#9B76FF'); strokeRect(g, ex, ey - 1, 3, 3, o.glassC || '#9B76FF'); }
  if (acc.includes('beard')) { R(hx + 1, ey + 2, hw - 1, 3, o.beardC || hair); R(ex - 1, ey + 3, 2, 1, '#8A3A4A'); }
  if (acc.includes('mustache')) { R(ex - 3, ey + 2, 5, 1, o.beardC || hair); R(ex - 4, ey + 1, 1, 1, o.beardC || hair); R(ex + 2, ey + 1, 1, 1, o.beardC || hair); }
  if (acc.includes('goggles')) { R(hx, headY + 1, hw, 1, PAL.sun); R(hx + 3, headY, 2, 2, PAL.teal); }
  if (acc.includes('headset')) { R(hx + 2, headY - 1, 1, 4, PAL.stone); R(ex + 2, ey + 1, 1, 2, PAL.pink); }
  return outlined(c, OUTLINE);
}
function buildHuman(o) {
  const mk = arr => arr.map(p => { const r = paintHuman(o, p); return { r, l: flipCanvas(r) }; });
  return {
    // idle: [normal, respirando, parpadeo, parpadeo respirando] (el índice lo elige el NPC según su reloj)
    idle: mk([{}, { bob: 1 }, { blink: true }, { bob: 1, blink: true }]),
    talk: mk([{ talk: true }, {}, { talk: true, arm: 1 }, { arm: 1 }]),
    walk: mk([{ legA: 2, legB: -2 }, { bob: -1 }, { legA: -2, legB: 2 }, { bob: -1 }]),
    cheer: mk([{ armUp: true, bob: -1, talk: true }, { armUp: true }])
  };
}

// Personajes principales y secundarios (parámetros)
const CAST = {
  teo: { name: 'Teó', skin: '#A86B45', hair: '#2A1A14', style: 'spiky', shirt: '#FF9D42', pants: '#3B4A7A', acc: ['cap', 'toolbelt', 'wrench'], cap: '#66D66A', kind: 'adult', voice: 330 },
  vega: { name: 'Prof. Vega', skin: '#E8B48E', hair: '#8C7BB8', style: 'bun', shirt: '#9B76FF', pants: '#2A2F55', acc: ['labcoat', 'glasses'], glassC: '#FFD84A', kind: 'tall', voice: 250 },
  menta: { name: 'Abuela Menta', skin: '#C98F6A', hair: '#D8D8E8', style: 'bun', shirt: '#3FA85A', pants: '#5E3A26', acc: ['apron', 'cane', 'glasses'], apron: '#B6F35B', glassC: '#FFF3D7', kind: 'elder', voice: 220 },
  vento: { name: 'Don Vento', skin: '#F0C090', hair: '#5A5A7A', style: 'short', shirt: '#59C7FF', pants: '#22306B', acc: ['mustache', 'scarf'], scarf: '#FF6B6B', beardC: '#E8E8F0', kind: 'adult', voice: 180 },
  suri: { name: 'Suri', skin: '#8E5A3C', hair: '#1A1A2E', style: 'braids', shirt: '#FFD84A', pants: '#FF7FCF', acc: ['panelhat', 'dress'], dress: '#FFD84A', kind: 'child', voice: 520 },
  capitan: { name: 'Capitán H2O', skin: '#D9A07A', hair: '#F0F0F8', style: 'short', shirt: '#163A73', pants: '#163A73', acc: ['hat', 'beard'], hatC: '#FFF3D7', beardC: '#F0F0F8', kind: 'adult', voice: 160 },
  lina: { name: 'Lina', skin: '#F2C29A', hair: '#FF9D42', style: 'long', shirt: '#30E1C5', pants: '#8B5A3C', acc: ['apron'], apron: '#FFF3D7', kind: 'adult', voice: 400 },
  nico: { name: 'Nico', skin: '#B87A55', hair: '#3A2418', style: 'curly', shirt: '#FF6B6B', pants: '#163A73', acc: [], kind: 'child', voice: 560 },
  pescador: { name: 'Don Anzuelo', skin: '#C88A62', hair: '#6A5A4A', style: 'bald', shirt: '#59C7FF', pants: '#5E3A26', acc: ['beard', 'strawhat'], beardC: '#8A7A6A', kind: 'elder', voice: 170 },
  vendedora: { name: 'Doña Kiwi', skin: '#E0A882', hair: '#2A1A14', style: 'long', shirt: '#B6F35B', pants: '#3FA85A', acc: ['apron', 'dress'], dress: '#66D66A', apron: '#FFF3D7', kind: 'adult', voice: 380 },
  ingeniera: { name: 'Ing. Sol', skin: '#F0C8A0', hair: '#FFD84A', style: 'long', shirt: '#FF9D42', pants: '#22306B', acc: ['goggles', 'vest'], vest: '#FFD84A', kind: 'adult', voice: 420 },
  kite: { name: 'Mika', skin: '#EFC39E', hair: '#9B76FF', style: 'spiky', shirt: '#59C7FF', pants: '#FFF3D7', acc: ['scarf'], scarf: '#FF7FCF', kind: 'child', voice: 600 },
  minero: { name: 'Roca', skin: '#9A6446', hair: '#1A1A2E', style: 'short', shirt: '#FF6B6B', pants: '#565E8C', acc: ['hat', 'goggles'], hatC: '#FFD84A', kind: 'tall', voice: 150 },
  neon: { name: 'Voltia', skin: '#E6B090', hair: '#FF4FB8', style: 'mohawk', shirt: '#22306B', pants: '#10162B', acc: ['headset', 'vest'], vest: '#30E1C5', kind: 'adult', voice: 460 },
  guardia: { name: 'Guardia Lux', skin: '#C58B63', hair: '#10162B', style: 'short', shirt: '#FFF3D7', pants: '#22306B', acc: ['cap'], cap: '#163A73', kind: 'tall', voice: 200 },
  nina: { name: 'Pepa', skin: '#F5CBA7', hair: '#8B5A3C', style: 'braids', shirt: '#FF7FCF', pants: '#FFD84A', acc: ['dress'], dress: '#FF7FCF', kind: 'child', voice: 620 },
  musico: { name: 'Trino', skin: '#B98060', hair: '#FFD84A', style: 'curly', shirt: '#9B76FF', pants: '#10162B', acc: ['scarf'], scarf: '#30E1C5', kind: 'adult', voice: 350 },
  granjero: { name: 'Don Maíz', skin: '#D49A70', hair: '#5E3A26', style: 'short', shirt: '#FF9D42', pants: '#2A4A9A', acc: ['strawhat'], kind: 'adult', voice: 190 }
};

// ---------- BETA (robot batería) ----------
function buildBeta() {
  const frames = [];
  for (let f = 0; f < 4; f++) {
    const c = makeCanvas(16, 22), g = c.g;
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    const b = f % 2;
    R(4, 2 + b, 8, 14, '#C9D2F0'); R(4, 2 + b, 1, 14, '#8C96C0'); R(6, 0 + b, 4, 2, '#8C96C0'); // cuerpo-batería
    R(5, 5 + b, 6, 4, '#10162B'); // pantalla
    R(6, 6 + b, 1, 2, PAL.teal); R(9, 6 + b, 1, 2, PAL.teal); // ojos
    R(5, 11 + b, 6, 4, '#22306B'); // indicador SOC
    R(3, 8 + b, 1, 4, '#8C96C0'); R(12, 8 + b, 1, 4, '#8C96C0');
    R(5, 16, 2, 4, '#565E8C'); R(9, 16, 2, 4, '#565E8C'); R(4, 20, 3, 2, '#22306B'); R(9, 20, 3, 2, '#22306B');
    const o = outlined(c, OUTLINE);
    frames.push({ r: o, l: flipCanvas(o) });
  }
  return frames;
}

// ---------- Enemigos conceptuales ----------
function buildEnemies() {
  const E = {};
  // BUGGLIN: escarabajo glitch
  E.bugglin = [0, 1].map(f => {
    const rows = f ? ['..v..v..', '.vvvvvv.', 'vVgvvgVv', 'vvvvvvvv', '.vVvvVv.', 'v.v..v.v'] : ['.v....v.', '..vvvv..', 'vVgvvgVv', 'vvvvvvvv', '.vVvvVv.', '.v.vv.v.'];
    const r = outlined(spriteFromRows(rows, { v: '#9B76FF', V: '#5B3A8C', g: '#B6F35B' }), OUTLINE);
    return { r, l: flipCanvas(r) };
  });
  // Bugglin depurado → mariquita feliz
  E.ladybug = [0, 1].map(f => {
    const rows = f ? ['..ww..ww', '.rrrr...', 'rkrrkr..', 'rrrrrr..', '.rkkr...'] : ['........', '.rrrr.ww', 'rkrrkrww', 'rrrrrr..', '.rkkr...'];
    const r = outlined(spriteFromRows(rows, { r: '#FF6B6B', k: '#1A1030', w: '#D6F6FF' }), OUTLINE);
    return { r, l: flipCanvas(r) };
  });
  // SHADOW IF: rombo con "?"
  E.shadowif = [0, 1, 2, 3].map(f => {
    const c = makeCanvas(14, 14), g = c.g;
    const s = f % 2;
    for (let y = 0; y < 13; y++) { const w = 6 - Math.abs(y - 6); g.fillStyle = y < 6 ? '#5B3A8C' : '#3A2466'; g.fillRect(6 - w + s * 0, y, w * 2 + 1, 1); }
    drawText(g, '?', 5, 3, f < 2 ? '#FF7FCF' : '#C9B2FF');
    return { r: outlined(c, OUTLINE), l: outlined(c, OUTLINE) };
  });
  // DRAINER: medusa que absorbe energía
  E.drainer = [0, 1, 2].map(f => {
    const rows = [
      '..vvvvv..', '.vVVVVVv.', 'vVwVVVwVv', 'vVkVVVkVv', 'vVVVVVVVv', '.vvvvvvv.',
      f === 0 ? '.v.v.v.v.' : f === 1 ? 'v.v.v.v.v' : '.v..v..v.', f === 1 ? '.v.v.v.v.' : 'v.v...v.v'
    ];
    const r = outlined(spriteFromRows(rows, { v: '#FF4FB8', V: '#B8338A', w: '#FFFFFF', k: '#1A1030' }), OUTLINE);
    return { r, l: r };
  });
  // CHAOS PACKET: cubo que desordena datos
  E.chaos = [0, 1].map(f => {
    const rows = f ? ['.oooooo.', 'oOyOOyOo', 'oOOOOOOo', 'oO1OO0Oo', 'oOOOOOOo', '.oooooo.'] : ['.oooooo.', 'oOOyOOyo', 'oOOOOOOo', 'oO0OO1Oo', 'oOOOOOOo', '.oooooo.'];
    const r = outlined(spriteFromRows(rows, { o: '#FF9D42', O: '#C8612E', y: '#FFF3D7', '1': '#FFD84A', '0': '#FFD84A' }), OUTLINE);
    return { r, l: r };
  });
  return E;
}

// ---------- Iconos 8x8 (en color) ----------
const ICON_DEFS = {
  sun: { p: { y: '#FFD84A', o: '#FF9D42' }, r: ['y..y..y.', '.y.yy.y.', '..yooy..', 'yyooooyy', '..yooy..', '.y.yy.y.', 'y..y..y.', '........'] },
  cloud: { p: { w: '#FFFFFF', g: '#C9D2F0' }, r: ['........', '...ww...', '.wwwww..', 'wwwwwwwg', 'gggggggg', '........', '........', '........'] },
  rain: { p: { w: '#E0E6F8', g: '#9AA6D0', b: '#59C7FF' }, r: ['...ww...', '.wwwww..', 'wwwwwwwg', 'gggggggg', '.b..b..b', 'b..b..b.', '........', '........'] },
  wind: { p: { a: '#7FE7FF', w: '#FFFFFF' }, r: ['........', 'aaaaaw..', '......a.', 'wwaaaa..', '........', 'aaaaaaw.', '.......a', '......a.'] },
  drop: { p: { b: '#59C7FF', w: '#FFFFFF', d: '#2A7ACC' }, r: ['...b....', '...b....', '..bbb...', '.bwbbb..', '.bwbbb..', '.bbbbd..', '..ddd...', '........'] },
  leaf: { p: { g: '#66D66A', G: '#3FA85A', l: '#B6F35B' }, r: ['.....gg.', '...gggg.', '..glgGg.', '.glgGgg.', '.gGgGg..', '.GGgg...', 'G.......', '........'] },
  fire: { p: { r: '#FF6B6B', o: '#FF9D42', y: '#FFD84A' }, r: ['...r....', '..rr..r.', '..ror.r.', '.roorrr.', '.rooyor.', '.royyor.', '..ryyr..', '........'] },
  battery: { p: { g: '#B6F35B', k: '#C9D2F0', d: '#565E8C' }, r: ['..dd....', '.kkkk...', '.kggk...', '.kggk...', '.kggk...', '.kggk...', '.kkkk...', '........'] },
  h2: { p: { a: '#7FE7FF', w: '#FFFFFF', b: '#2A7ACC' }, r: ['........', '.aa..aa.', 'awwaawwa', 'awaaaawa', '.aa..aa.', '...bb...', '........', '........'] },
  gear: { p: { s: '#C9D2F0', d: '#565E8C' }, r: ['...s....', '.s.s.s..', '..sss...', 'sssdsss.', '..sss...', '.s.s.s..', '...s....', '........'] },
  bolt: { p: { y: '#FFD84A', o: '#FF9D42' }, r: ['....yy..', '...yy...', '..yy....', '.yyyyy..', '...yo...', '..yo....', '.yo.....', '........'] },
  heart: { p: { r: '#FF6B6B', w: '#FFFFFF' }, r: ['.rr.rr..', 'rwrrrrr.', 'rrrrrrr.', '.rrrrr..', '..rrr...', '...r....', '........', '........'] },
  star: { p: { y: '#FFD84A', o: '#FF9D42' }, r: ['...y....', '...y....', 'yyyyyyy.', '.yyyyy..', '..yoy...', '.yo.oy..', '........', '........'] },
  bug: { p: { v: '#9B76FF', g: '#B6F35B', k: '#1A1030' }, r: ['.v...v..', '..vvv...', '.vgvgv..', 'vvvvvvv.', '.vvkvv..', 'v.v.v.v.', '........', '........'] },
  lock: { p: { s: '#C9D2F0', y: '#FFD84A', k: '#1A1030' }, r: ['..sss...', '.s...s..', '.s...s..', 'yyyyyyy.', 'yyykyyy.', 'yyykyyy.', 'yyyyyyy.', '........'] },
  eye: { p: { t: '#30E1C5', w: '#FFFFFF', k: '#1A1030' }, r: ['........', '..tttt..', '.twwwwt.', 'twwkkwwt', '.twwwwt.', '..tttt..', '........', '........'] },
  chip: { p: { v: '#9B76FF', y: '#FFD84A', w: '#FFFFFF' }, r: ['.y.y.y..', 'vvvvvvv.', 'yvwwwvy.', 'vvwvwvv.', 'yvwwwvy.', 'vvvvvvv.', '.y.y.y..', '........'] },
  seed: { p: { g: '#B6F35B', y: '#FFD84A', w: '#FFFFFF' }, r: ['...w....', '..ygy...', '.ygggy..', '.ggwgg..', '.ygggy..', '..ygy...', '........', '........'] },
  spark: { p: { w: '#FFFFFF', p: '#FF7FCF', c: '#30E1C5' }, r: ['...c....', '...w....', '.p.w.p..', 'cwwwwwc.', '.p.w.p..', '...w....', '...c....', '........'] },
  flag: { p: { r: '#FF6B6B', s: '#C9D2F0' }, r: ['srrrr...', 'srrrrr..', 'srrrr...', 's.......', 's.......', 's.......', 's.......', '........'] },
  home: { p: { r: '#FF6B6B', w: '#FFF3D7', b: '#8B5A3C' }, r: ['...r....', '..rrr...', '.rrrrr..', 'rrrrrrr.', '.wwbww..', '.wwbww..', '........', '........'] },
  flower: { p: { p: '#FF7FCF', y: '#FFD84A', g: '#66D66A' }, r: ['..p.p...', '.ppypp..', '..ppp...', '...g....', '.g.g....', '..gg....', '...g....', '........'] },
  wave: { p: { b: '#59C7FF', w: '#FFFFFF' }, r: ['........', '..ww....', '.b..b..b', 'b....bb.', '..ww....', '.b..b..b', 'b....bb.', '........'] },
  factory: { p: { s: '#C9D2F0', d: '#565E8C', y: '#FFD84A' }, r: ['......s.', '.....ss.', 'd..d.ss.', 'dd.dd.s.', 'ddddddd.', 'dydydyd.', 'ddddddd.', '........'] },
  people: { p: { s: '#F7C39A', b: '#59C7FF', r: '#FF6B6B' }, r: ['.s...s..', 'sss.sss.', '.s...s..', 'bbb.rrr.', 'bbb.rrr.', '.b...r..', '........', '........'] },
  shield: { p: { o: '#FF9D42', y: '#FFD84A', w: '#FFFFFF' }, r: ['.oooooo.', 'oyyyyyyo', 'oywyyyyo', 'oyyyyyyo', '.oyyyyo.', '..oyyo..', '...oo...', '........'] },
  clock: { p: { w: '#FFF3D7', k: '#1A1030' }, r: ['..www...', '.wwkww..', 'wwwkwww.', 'wwwkkww.', 'wwwwwww.', '.wwwww..', '..www...', '........'] },
  temp: { p: { r: '#FF6B6B', w: '#FFF3D7' }, r: ['...w....', '..wrw...', '..wrw...', '..wrw...', '.wrrrw..', '.wrrrw..', '..www...', '........'] },
  question: { p: { v: '#C9B2FF' }, r: ['.vvvv...', 'v....v..', '....v...', '...v....', '...v....', '........', '...v....', '........'] }
};
const ICONS = {};
function icon(g, name, x, y) { const ic = ICONS[name]; if (ic) g.drawImage(ic, Math.round(x), Math.round(y)); }

// ---------- Retratos (32x32) para diálogos ----------
function paintPortraitHuman(o, expr) {
  const c = makeCanvas(32, 32), g = c.g;
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const skin = o.skin || PAL.skin, skinS = shade(skin, -0.15), hair = o.hair || '#5B3A26', hairS = shade(hair, -0.25), hairL = shade(hair, 0.25);
  const shirt = o.shirt || PAL.coral;
  const acc = o.acc || [];
  const st = o.style || 'short';
  // hombros
  R(4, 26, 24, 6, shirt); R(4, 26, 24, 1, shade(shirt, 0.2)); R(12, 25, 8, 3, skinS);
  if (acc.includes('labcoat')) { R(4, 26, 7, 6, '#EDEBF7'); R(21, 26, 7, 6, '#EDEBF7'); }
  if (acc.includes('apron')) { R(11, 27, 10, 5, o.apron || '#FFF3D7'); }
  if (acc.includes('scarf')) { R(8, 24, 16, 3, o.scarf || PAL.sun); }
  if (acc.includes('vest')) { R(6, 27, 5, 5, o.vest || PAL.orange); R(21, 27, 5, 5, o.vest || PAL.orange); }
  // pelo trasero
  if (st === 'long' || st === 'lia') { R(5, 8, 22, 18, hair); R(5, 8, 3, 18, hairS); }
  if (st === 'braids') { R(5, 10, 3, 14, hair); R(24, 10, 3, 14, hair); R(5, 22, 3, 2, PAL.pink); R(24, 22, 3, 2, PAL.pink); }
  // cara
  R(8, 7, 16, 18, skin); R(9, 6, 14, 1, skin); R(9, 25, 14, 1, skinS); R(8, 22, 16, 3, skinS); R(9, 22, 14, 2, skin);
  R(7, 13, 1, 5, skinS); R(24, 13, 1, 5, skinS); // orejas
  // pelo delantero
  if (st === 'lia') {
    R(7, 3, 18, 7, hair); R(6, 5, 2, 9, hair); R(24, 5, 2, 9, hair); R(10, 4, 5, 2, hairL); R(8, 9, 4, 2, hair); R(18, 9, 5, 1, hair);
    R(1, 8, 5, 4, hair); R(0, 11, 4, 6, hair); R(0, 16, 3, 4, hairS); R(5, 6, 3, 3, PAL.sun); // coleta y lazo
    R(8, 7, 16, 2, PAL.sun); R(10, 6, 5, 4, PAL.teal); R(17, 6, 5, 4, PAL.teal); R(11, 7, 2, 1, '#C9FFF4'); R(18, 7, 2, 1, '#C9FFF4'); // gafas en la frente
  } else if (st === 'bun') {
    R(7, 4, 18, 5, hair); R(7, 8, 2, 6, hair); R(23, 8, 2, 6, hair); R(12, 0, 8, 5, hair); R(13, 0, 6, 1, hairL); R(10, 5, 6, 1, hairL);
  } else if (st === 'spiky') {
    R(7, 4, 18, 5, hair); for (let i = 0; i < 5; i++) R(8 + i * 4, 2 - (i % 2), 3, 3, hair); R(7, 8, 2, 5, hair); R(23, 8, 2, 4, hair);
  } else if (st === 'curly') {
    for (let i = 0; i < 6; i++) { pcircle(g, 8 + i * 3, 6 + (i % 2), 3, hair); } R(6, 8, 3, 8, hair); R(23, 8, 3, 8, hair);
  } else if (st === 'braids') {
    R(7, 4, 18, 5, hair); R(15, 4, 1, 4, hairS); R(7, 8, 2, 5, hair); R(23, 8, 2, 5, hair);
  } else if (st === 'long') {
    R(7, 4, 18, 5, hair); R(7, 8, 3, 10, hair); R(22, 8, 3, 10, hair); R(11, 5, 6, 1, hairL);
  } else if (st === 'bald') {
    R(7, 10, 2, 6, hair); R(23, 10, 2, 6, hair); R(12, 7, 4, 1, shade(skin, 0.2));
  } else if (st === 'mohawk') {
    R(13, 0, 6, 8, hair); R(14, 0, 4, 1, hairL); R(7, 10, 2, 5, hairS); R(23, 10, 2, 5, hairS);
  } else {
    R(7, 4, 18, 5, hair); R(7, 8, 2, 6, hair); R(23, 8, 2, 5, hair); R(10, 5, 8, 1, hairL);
  }
  if (acc.includes('cap')) { R(6, 3, 20, 5, o.cap || PAL.orange); R(20, 7, 9, 2, o.cap || PAL.orange); R(12, 4, 4, 2, PAL.sun); }
  if (acc.includes('hat')) { R(4, 6, 24, 2, o.hatC || '#2A4A9A'); R(8, 0, 16, 6, o.hatC || '#2A4A9A'); R(8, 4, 16, 1, PAL.cream); }
  if (acc.includes('strawhat')) { R(2, 6, 28, 2, '#E8C170'); R(8, 1, 16, 5, '#E8C170'); R(8, 4, 16, 1, PAL.coral); }
  if (acc.includes('panelhat')) { R(6, 2, 20, 4, '#2A4A9A'); R(7, 3, 5, 2, PAL.aqua); R(14, 3, 5, 2, PAL.aqua); R(21, 3, 4, 2, PAL.aqua); }
  if (acc.includes('goggles') && st !== 'lia') { R(7, 8, 18, 2, PAL.sun); R(10, 7, 5, 4, PAL.teal); R(17, 7, 5, 4, PAL.teal); }
  if (acc.includes('headset')) { R(6, 4, 2, 14, PAL.stone); R(24, 12, 3, 4, PAL.pink); R(24, 16, 1, 5, PAL.stone); }
  // ojos y cejas según expresión
  const K = '#1A1030', Wt = '#FFFFFF';
  const eyeL = 11, eyeR = 18, ey = 14;
  const brow = (dy1, dy2) => { R(eyeL - 1, ey - 3 + dy1, 4, 1, hairS); R(eyeR, ey - 3 + dy2, 4, 1, hairS); };
  const eyesOpen = (h = 3) => { R(eyeL, ey, 2, h, K); R(eyeR + 1, ey, 2, h, K); R(eyeL, ey, 1, 1, Wt); R(eyeR + 1, ey, 1, 1, Wt); };
  switch (expr) {
    case 'feliz': R(eyeL - 1, ey + 1, 1, 1, K); R(eyeL, ey, 2, 1, K); R(eyeL + 2, ey + 1, 1, 1, K); R(eyeR, ey + 1, 1, 1, K); R(eyeR + 1, ey, 2, 1, K); R(eyeR + 3, ey + 1, 1, 1, K); brow(-1, -1); R(13, 20, 6, 1, K); R(14, 21, 4, 1, '#C0405A'); R(9, 18, 2, 1, '#FF8FA3'); R(21, 18, 2, 1, '#FF8FA3'); break;
    case 'sorpresa': eyesOpen(4); brow(-2, -2); R(14, 20, 3, 3, K); R(15, 21, 1, 1, '#C0405A'); break;
    case 'triste': eyesOpen(2); R(eyeL - 1, ey - 2, 2, 1, hairS); R(eyeL + 1, ey - 3, 2, 1, hairS); R(eyeR + 1, ey - 3, 2, 1, hairS); R(eyeR + 3, ey - 2, 1, 1, hairS); R(13, 21, 1, 1, K); R(14, 20, 4, 1, K); R(18, 21, 1, 1, K); break;
    case 'enojo': eyesOpen(2); R(eyeL - 1, ey - 3, 2, 1, hairS); R(eyeL + 1, ey - 2, 2, 1, hairS); R(eyeR, ey - 2, 2, 1, hairS); R(eyeR + 2, ey - 3, 2, 1, hairS); R(13, 21, 6, 1, K); break;
    case 'pensando': R(eyeL, ey + 1, 2, 2, K); R(eyeR + 1, ey + 1, 2, 2, K); brow(-1, -3); R(14, 21, 4, 1, K); R(18, 20, 1, 1, K); break;
    case 'culpa': R(eyeL, ey + 1, 2, 2, K); R(eyeR + 1, ey + 1, 2, 2, K); R(eyeL - 1, ey - 1, 3, 1, hairS); R(eyeR + 1, ey - 1, 3, 1, hairS); R(14, 21, 4, 1, K); R(10, 18, 2, 1, '#9AB6FF'); break;
    case 'decidida': eyesOpen(3); R(eyeL - 1, ey - 2, 4, 1, hairS); R(eyeR, ey - 2, 4, 1, hairS); R(13, 20, 6, 1, K); R(18, 19, 1, 1, K); break;
    case 'risa': R(eyeL - 1, ey + 1, 1, 1, K); R(eyeL, ey, 2, 1, K); R(eyeL + 2, ey + 1, 1, 1, K); R(eyeR, ey + 1, 1, 1, K); R(eyeR + 1, ey, 2, 1, K); R(eyeR + 3, ey + 1, 1, 1, K); R(12, 19, 8, 3, K); R(13, 21, 6, 1, '#C0405A'); R(13, 19, 6, 1, Wt); break;
    default: eyesOpen(3); brow(0, 0); R(14, 20, 4, 1, K); R(9, 18, 2, 1, '#FF9DA8'); R(21, 18, 2, 1, '#FF9DA8');
  }
  // accesorios de cara
  if (acc.includes('glasses')) { const gc = o.glassC || '#9B76FF'; strokeRect(g, eyeL - 2, ey - 2, 6, 6, gc); strokeRect(g, eyeR - 1, ey - 2, 6, 6, gc); R(eyeL + 4, ey, 3, 1, gc); }
  if (acc.includes('mustache')) { const bc = o.beardC || hair; R(10, 19, 12, 2, bc); R(8, 18, 2, 2, bc); R(22, 18, 2, 2, bc); }
  if (acc.includes('beard')) { const bc = o.beardC || hair; R(8, 18, 16, 7, bc); R(10, 25, 12, 2, bc); R(13, 20, 6, 1, '#8A3A4A'); }
  return c;
}

function portraitPix(expr, quiet) {
  const c = makeCanvas(32, 32), g = c.g;
  const t = quiet ? '#6FB5AC' : '#30E1C5', T = quiet ? '#4F8A84' : '#1FA89A', m = quiet ? '#B86A98' : '#FF4FB8', y = quiet ? '#CFB76A' : '#FFD84A';
  pellipse(g, 17, 18, 9, 8, t); pellipse(g, 17, 21, 8, 5, T); pellipse(g, 17, 16, 7, 5, t);
  rect(g, 0, 17, 10, 3, y); rect(g, 0, 18, 10, 1, shade(y, -0.2)); // pico largo
  rect(g, 13, 7, 6, 3, m); rect(g, 15, 5, 3, 2, m); // cresta
  rect(g, 20, 24, 8, 3, m);
  // ala
  g.fillStyle = '#D6F6FF'; g.fillRect(21, 9 + (Math.floor(Time.t * 12) % 2) * 2, 9, 4); g.fillRect(25, 7, 5, 3);
  // ojo
  const K = '#1A1030';
  if (expr === 'feliz' || expr === 'risa') { rect(g, 13, 14, 1, 1, K); rect(g, 14, 13, 2, 1, K); rect(g, 16, 14, 1, 1, K); }
  else if (expr === 'triste' || expr === 'culpa') { rect(g, 13, 15, 4, 2, K); rect(g, 13, 13, 4, 1, T); }
  else if (expr === 'sorpresa') { rect(g, 12, 12, 5, 5, '#FFFFFF'); rect(g, 13, 13, 3, 3, K); }
  else { rect(g, 12, 12, 5, 4, '#FFFFFF'); rect(g, 13, 13, 3, 3, K); rect(g, 13, 13, 1, 1, '#FFFFFF'); }
  rect(g, 22, 18, 2, 2, quiet ? '#8C93B8' : '#FFD84A'); // led
  return c;
}
function portraitGeneric(kind, expr) {
  if (kind.startsWith('boss_') && BOSSES[kind.slice(5)]) return bossPortrait(kind.slice(5), expr);
  const c = makeCanvas(32, 32), g = c.g;
  if (kind === 'eclipse') {
    for (let i = 0; i < 70; i++) { const a = rand(0, 6.28), r = Math.pow(Math.random(), 0.6) * 13; rect(g, 16 + Math.cos(a) * r * 0.8, 17 + Math.sin(a) * r, 2, 2, choice(['#5B3A8C', '#9B76FF', '#3A2466', '#C9B2FF'])); }
    pellipse(g, 16, 13, 6, 6, '#2A1A44'); rect(g, 12, 12, 3, 2, '#FF7FCF'); rect(g, 18, 12, 3, 2, '#FF7FCF');
    rect(g, 10, 20, 12, 10, '#3A2466');
  } else if (kind === 'aurora') {
    rect(g, 0, 0, 32, 32, '#10162B');
    for (let r = 14; r > 2; r -= 3) pring(g, 16, 16, r, r > 10 ? '#30E1C5' : r > 6 ? '#59C7FF' : '#FFF3D7');
    pcircle(g, 16, 16, 3, '#FFFFFF');
    rect(g, 0, 15, 5, 2, '#30E1C5'); rect(g, 27, 15, 5, 2, '#30E1C5');
  } else if (kind === 'pz') {
    rect(g, 0, 0, 32, 32, '#F4F6FF');
    for (let i = 0; i < 4; i++) { const r = 13 - i * 3; for (let y = -r; y <= r; y++) { const w = r - Math.abs(y); rect(g, 16 - w, 16 + y, w * 2 + 1, 1, i % 2 ? '#FFFFFF' : '#DCE2F5'); } }
    pring(g, 16, 16, 5, '#B8C2E6'); rect(g, 15, 15, 3, 3, '#10162B');
  } else if (kind === 'prisma') {
    const cols = ['#FF6B6B', '#FF9D42', '#FFD84A', '#66D66A', '#30E1C5', '#59C7FF', '#9B76FF', '#FF7FCF'];
    for (let y = 0; y < 26; y++) { const w = Math.floor(y * 0.55); rect(g, 16 - w, 3 + y, w * 2 + 1, 1, cols[Math.floor(y / 3.3) % cols.length]); }
    rect(g, 12, 17, 2, 3, '#10162B'); rect(g, 18, 17, 2, 3, '#10162B'); rect(g, 14, 22, 4, 1, '#10162B');
  } else if (kind === 'beta') {
    rect(g, 6, 4, 20, 26, '#C9D2F0'); rect(g, 6, 4, 2, 26, '#8C96C0'); rect(g, 12, 1, 8, 3, '#8C96C0');
    rect(g, 9, 8, 14, 9, '#10162B'); rect(g, 11, 10, 3, 4, PAL.teal); rect(g, 18, 10, 3, 4, PAL.teal);
    if (expr === 'triste') { rect(g, 11, 10, 3, 1, '#10162B'); rect(g, 18, 10, 3, 1, '#10162B'); }
    rect(g, 9, 20, 14, 7, '#22306B');
  } else if (kind === 'lumi') {
    rect(g, 0, 0, 32, 32, '#10162B');
    const grd = g.createRadialGradient(16, 16, 1, 16, 16, 15); grd.addColorStop(0, 'rgba(255,216,74,0.6)'); grd.addColorStop(1, 'rgba(255,216,74,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
    const sh = ['.....#.....', '....###....', '...#####...', '..#######..', '.#########.', '###########', '.#########.', '..#######..', '...#####...', '....###....', '.....#.....'];
    for (let r = 0; r < 11; r++) for (let q = 0; q < 11; q++) if (sh[r][q] === '#') { const d = Math.abs(r - 5) + Math.abs(q - 5); rect(g, 5 + q * 2, 5 + r * 2, 2, 2, d <= 2 ? '#FFFFFF' : d <= 4 ? '#FFD84A' : '#FF9D42'); }
    rect(g, 12, 14, 2, 3, '#1A1030'); rect(g, 18, 14, 2, 3, '#1A1030');
  } else if (kind === 'sistema') {
    rect(g, 0, 0, 32, 32, '#10162B'); rect(g, 3, 5, 26, 20, '#22306B'); rect(g, 5, 7, 22, 16, '#0B1020');
    drawText(g, '>_', 8, 12, PAL.teal);
  }
  return c;
}

const Portraits = {
  cache: {},
  get(who, expr = 'n') {
    const key = who + ':' + expr + (who === 'pix' && flag('pixQuiet') ? ':q' : '');
    if (who === 'pix') return portraitPix(expr, flag('pixQuiet') && !flag('pixHealed'));
    if (this.cache[key]) return this.cache[key];
    let c;
    if (who === 'lia') c = paintPortraitHuman({ skin: '#F7C39A', hair: '#FF6B6B', style: 'lia', shirt: '#30E1C5' }, expr);
    else if (CAST[who]) c = paintPortraitHuman(CAST[who], expr);
    else c = portraitGeneric(who, expr);
    return (this.cache[key] = c);
  }
};

// ---------- Construcción de todos los sprites ----------
function buildAllSprites() {
  Spr.lia = buildLia(G.save.cosmetics.worn || {});
  Spr.pix = buildPix(false); Spr.pixQuiet = buildPix(true);
  Spr.lumi = buildLumi();
  Spr.cast = {};
  for (const k in CAST) Spr.cast[k] = buildHuman(CAST[k]);
  Spr.beta = buildBeta();
  Spr.enemy = buildEnemies();
  for (const k in ICON_DEFS) ICONS[k] = spriteFromRows(ICON_DEFS[k].r, ICON_DEFS[k].p);
  // Lía fantasma (eco de Step Spark)
  Spr.liaGhost = {};
  for (const k of ['idle', 'walk', 'jump', 'fall']) Spr.liaGhost[k] = Spr.lia[k].map(f => ({ r: silhouette(f.r, 'rgba(255,216,74,0.75)'), l: silhouette(f.l, 'rgba(255,216,74,0.75)') }));
}
function rebuildLia() {
  Spr.lia = buildLia(G.save.cosmetics.worn || {});
}
