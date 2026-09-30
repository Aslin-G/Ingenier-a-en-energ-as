// =====================================================================
//  MUNDO: nivel, física de plataformas, jugadora, compañeros, cámara, HUD
// =====================================================================
// fondos construidos (a doble resolución pesan más): se guardan solo los últimos
const BG_CACHE = {}, BG_ORDER = [];
function getBackground(theme) {
  if (BG_CACHE[theme]) return BG_CACHE[theme];
  BG_ORDER.push(theme);
  while (BG_ORDER.length > 3) delete BG_CACHE[BG_ORDER.shift()];
  return (BG_CACHE[theme] = buildBackground(theme));
}

const PHYS = {
  grav: 980, gravHold: 560, maxFall: 330, walk: 88, run: 138, accG: 1000, decG: 1500, accA: 720,
  jumpV: 258, coyote: 0.1, buffer: 0.13, climb: 62, waterGrav: 240, waterMax: 70, swimV: 150, glideFall: 34
};

// ---------------------------------------------------------------------
//  Interpolación de dibujo: la física avanza a 60 Hz fijos y el dibujo
//  mezcla el estado anterior y el actual según el tiempo sobrante.
// ---------------------------------------------------------------------
const Interp = {
  alpha: 1,
  objs(lv) { const o = [lv.player, lv.pix, lv.lumi]; if (lv.ghost) o.push(lv.ghost); for (const e of lv.entities) o.push(e); return o; },
  save() {
    const lv = G.run.level; if (!lv || !lv.player) return;
    for (const o of this.objs(lv)) { o._ix = o.x; o._iy = o.y; }
    lv.cam._ix = lv.cam.x; lv.cam._iy = lv.cam.y;
  },
  // aplica posiciones interpoladas; devuelve una función que las restaura
  apply(lv) {
    const a = this.alpha, saved = [];
    if (a >= 1) return () => { };
    const mix = o => {
      if (o._ix == null || typeof o.x !== 'number') return;
      const dx = o.x - o._ix, dy = o.y - o._iy;
      if (Math.abs(dx) > 40 || Math.abs(dy) > 40) return; // teletransporte: no interpolar
      saved.push([o, o.x, o.y]); o.x = o._ix + dx * a; o.y = o._iy + dy * a;
    };
    for (const o of this.objs(lv)) mix(o);
    mix(lv.cam);
    return () => { for (const [o, x, y] of saved) { o.x = x; o.y = y; } };
  }
};

class Level {
  constructor(key, spawnId) {
    const def = LEVELS[key];
    this.key = key; this.def = def; this.theme = THEMES[def.theme]; this.themeKey = def.theme;
    this.time = 0; this.lens = false; this.lensT = 0; this.weather = def.weather || 'clear'; this.weatherT = 0;
    this.entities = []; this.byId = {}; this.checkpoints = [];
    this.parse(def.map);
    this.hitstop = 0;
    populateFoes(this);
    this.bg = getBackground(def.theme);
    this.buildStatic();
    const start = this.findSpawn(spawnId);
    this.player = new Player(this, start.x, start.y);
    this.pix = new PixCompanion(this); this.lumi = new LumiCompanion(this);
    this.pix.x = start.x - 14; this.pix.y = start.y - 30; this.lumi.x = start.x + 6; this.lumi.y = start.y - 10;
    this.cam = { x: 0, y: 0, tx: null, ty: null, lock: false };
    this.snapCamera();
    this.enteredAt = Time.t; this.banner = 3.2;
    this.power = 0; this.updatePower(true);
    this.ghost = null; this.shake = 0;
    this.lastSafe = { x: start.x, y: start.y };
    if (def.init) def.init(this);
  }
  // ---------- mapa ----------
  parse(rows) {
    this.h = rows.length; this.w = Math.max(...rows.map(r => r.length));
    this.tiles = [];
    const counters = {};
    for (let y = 0; y < this.h; y++) {
      const row = [];
      for (let x = 0; x < this.w; x++) {
        let ch = rows[y][x] || '.';
        const px0 = x * TILE, py0 = y * TILE;
        const takeCfg = (k) => { counters[k] = (counters[k] || 0) + 1; const list = this.def[k]; return list ? list[counters[k] - 1] : null; };
        switch (ch) {
          case '@': this.spawn = { x: px0 + 3, y: py0 - 4 }; ch = '.'; break;
          case 'C': this.spawnEnt('C', px0, py0, {}, x, y); ch = '.'; break;
          case '*': { const cfg = takeCfg('chispas') || {}; this.addEntity(new Chispa(this, px0 + 4, py0 + 4, cfg)); ch = '.'; break; }
          case 'o': this.addEntity(new Seed(this, px0 + 5, py0 + 5, `${this.key}:${x},${y}`)); ch = '.'; break;
          case 'N': { const cfg = takeCfg('npcs'); if (cfg) this.addEntity(new NPC(this, px0, py0, cfg)); ch = '.'; break; }
          case 'T': { const cfg = takeCfg('terms'); if (cfg) this.addEntity(makeTerminal(this, px0, py0, cfg)); ch = '.'; break; }
          case 'E': { const cfg = takeCfg('enemies'); if (cfg) this.addEntity(makeEnemy(this, px0, py0, cfg)); ch = '.'; break; }
          case 'M': { const cfg = takeCfg('movers') || {}; this.addEntity(new Mover(this, px0, py0, cfg)); ch = '.'; break; }
          case 'P': { const cfg = takeCfg('plates') || {}; this.addEntity(new Plate(this, px0, py0, cfg)); ch = '.'; break; }
          case 'X': { const cfg = takeCfg('exits') || {}; this.addEntity(new Exit(this, px0, py0, cfg)); ch = '.'; break; }
          case 'S': { const cfg = takeCfg('vents') || {}; this.addEntity(new Vent(this, px0, py0, cfg)); ch = '.'; break; }
          case 'm': { const cfg = takeCfg('props'); if (cfg) this.addEntity(new Prop(this, px0, py0, cfg)); ch = '.'; break; }
          case 'i': { const cfg = takeCfg('items'); if (cfg) this.addEntity(new PackItem(this, px0 + 3, py0 + 4, cfg)); ch = '.'; break; }
          case 'L': this.addEntity(new Lamp(this, px0, py0)); ch = '.'; break;
          case 'a': this.addEntity(new Critter(this, px0, py0)); ch = '.'; break;
        }
        row.push(ch);
      }
      this.tiles.push(row);
    }
    // entidades declaradas con el constructor de mapas
    for (const en of (this.def.ents || [])) this.spawnEnt(en.t, en.x * TILE, en.y * TILE, en.cfg, en.x, en.y);
    if (this.def.spawnAt) this.spawn = { x: this.def.spawnAt[0] * TILE + 3, y: this.def.spawnAt[1] * TILE - 4 };
    if (!this.spawn) this.spawn = { x: 32, y: 32 };
    this.pw = this.w * TILE; this.ph = this.h * TILE;
  }
  addEntity(e) { this.entities.push(e); if (e.id) this.byId[e.id] = e; return e; }
  spawnEnt(t, px0, py0, cfg, x, y) {
    switch (t) {
      case 'C': { const c = new Checkpoint(this, px0, py0, this.checkpoints.length); this.checkpoints.push(c); return this.addEntity(c); }
      case '*': return this.addEntity(new Chispa(this, px0 + 4, py0 + 4, cfg));
      case 'o': return this.addEntity(new Seed(this, px0 + 5, py0 + 5, `${this.key}:${x},${y}`));
      case 'N': return this.addEntity(new NPC(this, px0, py0, cfg));
      case 'T': return this.addEntity(makeTerminal(this, px0, py0, cfg));
      case 'E': return this.addEntity(makeEnemy(this, px0, py0, cfg));
      case 'M': return this.addEntity(new Mover(this, px0, py0, cfg));
      case 'P': return this.addEntity(new Plate(this, px0, py0, cfg));
      case 'X': return this.addEntity(new Exit(this, px0, py0, cfg));
      case 'S': return this.addEntity(new Vent(this, px0, py0, cfg));
      case 'm': return this.addEntity(new Prop(this, px0, py0, cfg));
      case 'i': return this.addEntity(new PackItem(this, px0 + 3, py0 + 4, cfg));
      case 'L': return this.addEntity(new Lamp(this, px0, py0));
      case 'a': return this.addEntity(new Critter(this, px0, py0));
      case 'B': return this.addEntity(new Boss(this, px0, py0, cfg));
      case 'R': return this.addEntity(new RegionBoss(this, px0, py0, cfg));
    }
  }
  get(id) { return this.byId[id]; }
  findSpawn(spawnId) {
    if (spawnId === 'checkpoint' && G.save.checkpoint && G.save.checkpoint.level === this.key) {
      const cp = this.checkpoints[G.save.checkpoint.idx];
      if (cp) { cp.active = true; return { x: cp.x + 3, y: cp.y - 4 }; }
    }
    if (spawnId && this.def.spawns && this.def.spawns[spawnId]) { const s = this.def.spawns[spawnId]; return { x: s[0] * TILE + 3, y: s[1] * TILE - 4 }; }
    return this.spawn;
  }
  tile(tx, ty) {
    if (tx < 0 || tx >= this.w) return '#';
    if (ty < 0) return '.';
    if (ty >= this.h) return '.';
    return this.tiles[ty][tx];
  }
  dyn(ch) { return (this.def.dyn && this.def.dyn[ch]) || DEFAULT_DYN[ch]; }
  solidAt(tx, ty) {
    const t = this.tile(tx, ty);
    if (t === '#') return true;
    const d = this.dyn(t);
    if (d && d.solid) return !!d.solid(this);
    return false;
  }
  oneWayAt(tx, ty) {
    const t = this.tile(tx, ty);
    if (t === '=') return true;
    if ((t === 'H' || t === '|') && this.tile(tx, ty - 1) !== t) return true;
    const d = this.dyn(t);
    return !!(d && d.oneWay && d.oneWay(this));
  }
  // ---------- pre-render del terreno estático ----------
  buildStatic() {
    const c = makeCanvas(this.pw, this.ph), g = c.g, th = this.theme;
    const rng = mulberry32(hashStr(this.key + 'tiles'));
    const solid = (x, y) => { const t = this.tile(x, y); return t === '#' || (y >= this.h && t !== '.'); };
    const decoSpots = [];
    this.paintSupports(g, th);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const t = this.tiles[y][x];
      if (t === '#') {
        const m = (solid(x, y - 1) || y === 0 ? 1 : 0) | (solid(x, y + 1) || y === this.h - 1 ? 2 : 0) | (solid(x - 1, y) ? 4 : 0) | (solid(x + 1, y) ? 8 : 0);
        paintSolidTile(g, x * TILE, y * TILE, m, th, rng);
        if (!(m & 1) && y > 0 && this.tiles[y - 1][x] === '.') decoSpots.push([x, y]);
      } else if (t === '~') {
        // fondo del agua opaco: el paisaje lejano no se ve «a través» del estanque
        const top = y > 0 && this.tiles[y - 1][x] !== '~';
        rect(g, x * TILE, y * TILE, 16, 16, shade(th.water[0], top ? -0.2 : -0.38));
        if (rng() < 0.3) rect(g, x * TILE + randi(2, 12), y * TILE + randi(4, 13), 2, 1, shade(th.water[0], -0.5));
      } else if (t === '=') paintPlatform(g, x * TILE, y * TILE, th.plat, th);
      else if (t === 'H') paintLadder(g, x * TILE, y * TILE);
      else if (t === '|') paintRope(g, x * TILE, y * TILE);
    }
    // volumen: la roca se oscurece hacia el interior (antes de las decoraciones)
    shadeTerrain(this, c);
    for (const [x, y] of decoSpots) if (rng() < 0.42 && th.ground.deco.length) drawDeco(g, choice(th.ground.deco), x * TILE, y * TILE, rng, th);
    this.staticCv = c;
  }
  // Postes bajo las plataformas de madera, metal o piedra (o cuerdas desde arriba):
  // así no parecen flotar sin motivo. Nubes, cristales, neón y prismas sí flotan.
  paintSupports(g, th) {
    const style = th.plat;
    const post = { wood: ['#6B4A2A', '#8B5A3C', 2], metal: ['#565E8C', '#8A96C8', 2], stone: ['#C8BFD8', '#EDE6F5', 3], glass: ['#8A8FB0', '#C9D2F0', 1] }[style];
    if (!post) return;
    const empty = t => t === '.' || t === '~' || t === 'H' || t === '|' || t === '^';
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        if (this.tiles[y][x] !== '=') { x++; continue; }
        let x2 = x; while (x2 + 1 < this.w && this.tiles[y][x2 + 1] === '=') x2++;
        const cols = x2 - x >= 5 ? [x, Math.floor((x + x2) / 2), x2] : x2 > x ? [x, x2] : [x];
        for (const tx of cols) {
          const px0 = tx * TILE + (tx === x2 && tx !== x ? 11 : 3);
          // buscar apoyo hacia abajo
          let d = 1, ok = false;
          while (y + d < this.h && d <= 9) { const t = this.tiles[y + d][tx]; if (t === '#' || t === '=') { ok = true; break; } if (!empty(t)) break; d++; }
          if (!ok && y + d >= this.h) ok = d <= 9;
          if (ok && d > 1) {
            const top = y * TILE + 5, bot = (y + d) * TILE;
            rect(g, px0, top, post[2], bot - top, post[0]); rect(g, px0, top, 1, bot - top, post[1]);
            if (bot - top > 40) { rect(g, px0 - 1, top + 3, post[2] + 2, 1, post[0]); }
            continue;
          }
          // colgar de una cuerda si hay techo cerca
          let u = 1; while (y - u >= 0 && u <= 6 && this.tiles[y - u][tx] !== '#') u++;
          if (y - u >= 0 && u <= 6 && style === 'wood') { for (let yy = (y - u + 1) * TILE; yy < y * TILE; yy += 2) px(g, px0, yy, '#C8A070'); }
        }
        x = x2 + 1;
      }
    }
  }
  // ---------- energía por zonas ----------
  updatePower(silent) {
    const zones = this.def.zones || [];
    if (!zones.length) { this.power = this.def.restoredFlag && flag(this.def.restoredFlag) ? 1 : (this.def.basePower != null ? this.def.basePower : 1); return; }
    const on = zones.filter(z => flag(z.flag)).length;
    this.power = on / zones.length;
  }
  zonePowered(px0) {
    const zones = this.def.zones || [];
    if (!zones.length) return this.power >= 1;
    const tx = px0 / TILE;
    for (const z of zones) if (tx >= z.x0 && tx < z.x1) return flag(z.flag);
    return this.power >= 1;
  }
  darkness() {
    const base = this.def.dark != null ? this.def.dark : this.theme.dark;
    let d = base * (1 - this.power * 0.85);
    if (this.weather === 'storm' || this.weather === 'rain') d += 0.15;
    if (this.weather === 'dust') d += 0.1;
    if (this.def.forceDark != null) d = this.def.forceDark;
    if (this.forceDark != null) d = this.forceDark;
    return clamp(d, 0, 0.85);
  }
  // ---------- cámara ----------
  snapCamera() {
    const p = this.player;
    this.cam.x = clamp(p.x + p.w / 2 - W / 2, 0, Math.max(0, this.pw - W));
    this.cam.y = clamp(p.y + p.h / 2 - H / 2 - 10, 0, Math.max(0, this.ph - H));
  }
  updateCamera(dt) {
    const p = this.player;
    let tx, ty;
    if (this.cam.tx != null) { tx = this.cam.tx - W / 2; ty = this.cam.ty - H / 2; }
    else {
      tx = p.x + p.w / 2 - W / 2 + p.face * 34 + p.vx * 0.15;
      ty = p.y + p.h / 2 - H / 2 - 12;
      if (p.onGround) this.camGroundY = ty;
      else if (this.camGroundY != null && Math.abs(ty - this.camGroundY) < 40 && p.vy < 0) ty = this.camGroundY;
    }
    tx = clamp(tx, 0, Math.max(0, this.pw - W)); ty = clamp(ty, 0, Math.max(0, this.ph - H));
    const k = this.cam.tx != null ? 2.5 : 6;
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, k * dt));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, (k + 2) * dt));
  }
  // ---------- actualización ----------
  update(dt) {
    // pausa de impacto: el mundo se congela un instante tras un golpe
    if (this.hitstop > 0) { this.hitstop -= dt; Bark.update(dt); return; }
    this.time += dt;
    this.banner = Math.max(0, this.banner - dt);
    const control = (!Cut.active || Cut.free) && !this.frozen;
    // lente debug
    if (control && Input.hit('lens') && hasAbility('lens')) { this.lens = !this.lens; AudioSys.sfx(this.lens ? 'debug' : 'click'); }
    this.lensT = approach(this.lensT, this.lens ? 1 : 0, dt * 5);
    this.player.update(dt, control);
    for (const e of this.entities) if (!e.dead && e.update) e.update(dt);
    this.entities = this.entities.filter(e => !e.dead || e.keep);
    if (this.ghost) { this.ghost.update(dt); if (this.ghost.done) this.ghost = null; }
    this.pix.update(dt); this.lumi.update(dt);
    // interacción
    this.nearby = null;
    if (control) {
      let best = null, bd = 1e9;
      for (const e of this.entities) {
        if (!e.canInteract || !e.canInteract()) continue;
        const r = e.interactRect ? e.interactRect() : { x: e.x - 8, y: e.y - 8, w: e.w + 16, h: e.h + 16 };
        if (rectHit(this.player, r)) { const d = Math.abs(e.x + e.w / 2 - this.player.x - this.player.w / 2); if (d < bd) { bd = d; best = e; } }
      }
      this.nearby = best;
      // E siempre habla/usa; el botón de ataque también, si no hay peligro cerca
      if (best && (Input.hit('interact') || (Input.hit('attack') && !this.dangerNear()))) { Input.consume(); this.player.atk = null; this.player.anim = 'interact'; this.player.animT = 0.3; best.interact(); }
      // presentación del Lumisable la primera vez que aparece un enemigo
      if (!flag('saberIntro') && !Cut.active && !this.def.noHud && this.dangerNear(170)) { setFlag('saberIntro'); Cut.run(() => saberIntro(this)); }
    }
    // disparadores
    if (this.def.triggers) for (const tr of this.def.triggers) {
      if (tr.done || (tr.flag && flag(tr.flag))) continue;
      if (tr.cond && !tr.cond(this)) continue;
      const r = { x: tr.x * TILE, y: (tr.y || 0) * TILE, w: (tr.w || 1) * TILE, h: (tr.h || this.h) * TILE };
      if (rectHit(this.player, r) && !Cut.active) {
        if (tr.once !== false) tr.done = true;
        if (tr.flag) setFlag(tr.flag);
        if (tr.run) Cut.run(() => tr.run(this));
        if (tr.fn) tr.fn(this);
      }
    }
    if (this.def.update) this.def.update(this, dt);
    this.updateCamera(dt);
    // clima
    this.updateWeather(dt);
    // partículas ambientales
    this.ambientParticles(dt);
    Bark.update(dt);
  }
  updateWeather(dt) {
    const w = this.weather;
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < (w === 'storm' ? 6 : 3); i++) Particles.spawn({ x: rand(-20, W + 40), y: -5, vx: -60, vy: rand(280, 360), life: 1, type: 'rain', color: 'rgba(200,230,255,0.7)', screen: true, drag: 1, layer: 1 });
      if (w === 'storm' && Math.random() < 0.004) { FX.flash('#FFFFFF', 0.5); AudioSys.sfx('boom'); }
    } else if (w === 'dust') {
      for (let i = 0; i < 4; i++) Particles.spawn({ x: W + 5, y: rand(0, H), vx: rand(-260, -160), vy: rand(-10, 10), life: 2.5, type: 'fade', size: 2, color: choice(['#E8B870', '#D09850', '#F0D0A0']), screen: true, drag: 1, layer: 1 });
    } else if (w === 'wind') {
      if (Math.random() < 0.3) Particles.spawn({ x: -5, y: rand(10, H - 60), vx: rand(160, 260), vy: 0, life: 2.2, type: 'fade', size: 1, color: 'rgba(255,255,255,0.8)', screen: true, drag: 1, layer: 1 });
    }
  }
  ambientParticles(dt) {
    const type = this.theme.particles, cx = this.cam.x, cy = this.cam.y;
    const r = Math.random();
    switch (type) {
      case 'fireflies': if (r < 0.06) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(40, H - 40), vx: rand(-8, 8), vy: rand(-8, 4), life: rand(2, 4), type: 'star', color: choice([PAL.sun, PAL.lime]), wob: 10, drag: 1 }); break;
      case 'pollen': if (r < 0.08) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, H), vx: rand(5, 20), vy: rand(-5, 5), life: 3, type: 'dot', color: choice(['#FFF3A0', '#FFFFFF', '#FFD84A']), wob: 8, drag: 1 }); break;
      case 'glints': if (r < 0.09) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, H), life: 0.7, type: 'glint', color: choice([PAL.sun, '#FFFFFF']), drag: 1 }); break;
      case 'wind': if (r < 0.1) Particles.spawn({ x: cx - 4, y: cy + rand(0, H), vx: rand(60, 140), vy: rand(-6, 6), life: 5, type: 'leaf', color: choice(['#9CF5D8', '#FFFFFF', '#FF7FCF']), wob: 12, drag: 1 }); break;
      case 'mist': if (r < 0.1) Particles.spawn({ x: cx + rand(0, W), y: cy + H + 2, vx: rand(-6, 6), vy: rand(-18, -8), life: 5, type: 'bubble', size: 1, color: '#DFFBFF', wob: 6, drag: 1 }); break;
      case 'leaves': if (r < 0.08) Particles.spawn({ x: cx + rand(0, W), y: cy - 4, vx: rand(-15, 15), vy: rand(14, 28), life: 8, type: 'leaf', color: choice(['#66D66A', '#B6F35B', '#FF9D42']), wob: 20, drag: 1 }); if (r > 0.96) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(60, H - 30), vx: rand(-8, 8), vy: rand(-6, 6), life: 3, type: 'star', color: PAL.lime, wob: 10, drag: 1 }); break;
      case 'embers': if (r < 0.12) Particles.spawn({ x: cx + rand(0, W), y: cy + H, vx: rand(-10, 10), vy: rand(-40, -20), life: 5, type: 'dot', color: choice(['#FF9D42', '#FFD84A', '#FF6B6B']), wob: 8, drag: 1 }); break;
      case 'spray': if (r < 0.06) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, H), vx: rand(20, 40), vy: rand(-4, 4), life: 3, type: 'dot', color: '#FFFFFF', wob: 5, drag: 1 }); break;
      case 'neon': if (r < 0.04) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(H * 0.3, H), vx: rand(-3, 3), vy: rand(-8, -3), life: 2.5, type: 'dot', color: choice([PAL.pink, PAL.teal, PAL.lime]), drag: 1 }); break;
      case 'prism': if (r < 0.1) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, H), vx: rand(-5, 5), vy: rand(-12, -4), life: 3, type: 'star', color: hsl(rand(0, 360), 90, 70), drag: 1 }); break;
      case 'aurora': if (r < 0.06) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, H), vx: 0, vy: rand(-8, -3), life: 4, type: 'star', color: choice([PAL.teal, PAL.violet, PAL.lime]), drag: 1 }); break;
      case 'confetti': if (r < 0.2) Particles.spawn({ x: cx + rand(0, W), y: cy - 4, vx: rand(-20, 20), vy: rand(20, 40), life: 7, type: 'leaf', color: choice([PAL.pink, PAL.sun, PAL.teal, PAL.lime, PAL.orange]), wob: 25, drag: 1 }); break;
    }
  }
  // ---------- dibujo ----------
  draw(g) {
    const restore = Interp.apply(this);
    try { this.drawWorld(g); } finally { restore(); }
  }
  // Cámara en píxeles enteros «anclada» al píxel de Lía: el escenario y la
  // protagonista avanzan en el mismo fotograma, sin vaivén de 1 px.
  // desplazamiento vertical de una capa de fondo con profundidad p
  layerOY(p, cy) { return Math.round((Math.max(1, this.ph - H) - cy) * p * 0.5); }
  camPixel() {
    const p = this.player, c = this.cam;
    if (c.tx != null || !p) return { x: Math.round(c.x), y: Math.round(c.y) };
    const px0 = Math.round(p.x), py0 = Math.round(p.y);
    const maxX = Math.max(0, this.pw - W), maxY = Math.max(0, this.ph - H);
    return { x: clamp(px0 + Math.round(c.x - p.x), 0, maxX), y: clamp(py0 + Math.round(c.y - p.y), 0, maxY) };
  }
  drawWorld(g) {
    const cp = this.camPixel();
    const cx = cp.x + FX.ox, cy = cp.y + FX.oy;
    Level.camRef.x = cx; Level.camRef.y = cy;
    const th = this.theme;
    g.drawImage(this.bg.sky, 0, 0, W, H);
    drawSkyLive(g, this.bg, this.time);
    if (th.aurora) drawAurora(g, this.time);
    // capas de parallax; los elementos vivos se intercalan según su profundidad
    let prevP = -1;
    for (const L of this.bg.layers) {
      drawLiveBackground(g, this, cx, cy, prevP, L.p);
      const ox = -Math.round((cx * L.p) % 960);
      const oy = this.layerOY(L.p, cy);
      g.drawImage(L.c, ox, oy); g.drawImage(L.c, ox + 960, oy);
      if (ox + 960 * 2 < W) g.drawImage(L.c, ox + 1920, oy);
      drawLayerBlades(g, L, ox, oy, this.time, 0.4 + this.power * 1.4);
      prevP = L.p;
    }
    drawLiveBackground(g, this, cx, cy, prevP, 99);
    if (this.def.skyDraw) this.def.skyDraw(this, g, cx, cy);
    // terreno
    g.drawImage(this.staticCv, cx, cy, W, H, 0, 0, W, H);
    this.drawDynamicTiles(g, cx, cy);
    // entidades de fondo
    for (const e of this.entities) if (e.layer === -1 && e.draw && this.onScreen(e, cx, cy)) drawEntity(g, e, cx, cy);
    this.drawShadows(g, cx, cy);
    for (const e of this.entities) if (!e.layer && e.draw && this.onScreen(e, cx, cy)) drawEntity(g, e, cx, cy);
    if (this.ghost) this.ghost.draw(g, cx, cy);
    if (this.def.extraDraw) this.def.extraDraw(this, g, cx, cy);
    if (this.eclipseAt) { drawEclipseFigure(g, this.eclipseAt.x - cx, this.eclipseAt.y - cy, this.time, 2); if (Math.random() < 0.5) Particles.spawn({ x: this.eclipseAt.x + rand(-10, 10), y: this.eclipseAt.y + rand(0, 26), vy: -10, life: 0.5, type: 'dot', color: PAL.violet }); }
    this.lumi.draw(g, cx, cy);
    this.player.draw(g, cx, cy);
    this.pix.draw(g, cx, cy);
    for (const e of this.entities) if (e.layer === 1 && e.draw && this.onScreen(e, cx, cy)) drawEntity(g, e, cx, cy);
    this.drawWater(g, cx, cy);
    Particles.draw(g, cx, cy, false, 0);
    // iluminación
    Light.begin();
    const p = this.player;
    Light.add(p.x + p.w / 2 - cx, p.y + 8 - cy, 70, 0.9);
    Light.add(this.lumi.x + 3 - cx, this.lumi.y + 3 - cy, 50 + this.lumi.glow * 20, 1, this.lumi.color);
    if (p.atk || p.chargeT > 0.3) Light.add(p.cx + p.face * 10 - cx, p.y + 8 - cy, 56, 0.9, saberColor(this));
    for (const e of this.entities) if (e.light && this.onScreen(e, cx, cy, 80)) { const l = e.light(); if (l) Light.add(l.x - cx, l.y - cy, l.r, l.a == null ? 1 : l.a, l.c); }
    if (this.def.lights) this.def.lights(this, cx, cy);
    const dk = this.darkness();
    Light.render(g, dk, th.tint || '#0B1030');
    // el sol y la luna no se apagan con el apagón: se redibujan casi con su brillo propio
    if (th.sun && dk > 0.05 && th.sun.y < 0.35 && this.bg.sunImg) {
      const sn = th.sun, sx = sn.x * W, sy = sn.y * H;
      g.globalAlpha = Math.min(1, dk * 2.2); g.drawImage(this.bg.sunImg, Math.round(sx - sn.r - 1), Math.round(sy - sn.r - 1));
      g.globalAlpha = 1;
    }
    // viñeta suave: más marcada de noche y en cuevas
    g.drawImage(Vignette.get(th.sun && !th.sun.moon ? 0.2 : 0.34), 0, 0);
    Particles.draw(g, cx, cy, true, 1);
    if (this.lensT > 0.01) this.drawLensOverlay(g, cx, cy);
    for (const e of this.entities) if (e.drawOverlay && this.onScreen(e, cx, cy, 40)) e.drawOverlay(g, cx, cy);
    for (const e of this.entities) if (e instanceof Enemy && !e.dead && (e.excl > 0 || e.hpShowT > 0 || e.stunT > 0) && this.onScreen(e, cx, cy)) drawFoeUI(g, e, cx, cy);
    // textos flotantes: primero se reservan HUD y aviso de interacción, luego globos y etiquetas de la Lente
    this.layoutLabels(cx, cy);
    Bark.draw(g, cx, cy, id => id === 'pix' ? this.pix : id === 'lia' ? this.player : id === 'lumi' ? this.lumi : this.byId[id]);
    if (this.lensT > 0.01) this.drawLensLabels(g, cx, cy);
  }
  layoutLabels(cx, cy) {
    Labels.reset();
    if (!this.def.noHud) {
      Labels.reserve(0, 0, this.hudW || 150, 22); Labels.reserve(W - 80 - touchOff(), 0, 80 + touchOff(), 24);
      if (this.rboss && this.rboss.showBar) Labels.reserve(W / 2 - 104, 0, 208, 26);
      if (this.rboss && this.rboss.showBar && this.lensT > 0.05 && this.rboss.codeRect) { const r = this.rboss.codeRect; Labels.reserve(r.x, r.y, r.w, r.h); }
      const obj = this.def.objective ? this.def.objective(this) : null;
      if (obj && (!Cut.active || Cut.free)) Labels.reserve(0, TouchPad.visible ? 23 : H - 20, Math.min(260, textW(obj) + 20) + 6, 20);
    }
    if (this.lensT > 0.01) Labels.reserve(W - 64, H - 16, 64, 16);
    if (this.banner > 0 && this.def.title) Labels.reserve(W / 2 - 130, 32, 260, 44);
    Toast.reserveAreas();
    this.promptRect = null;
    const e = this.nearby;
    if (e && (!Cut.active || Cut.free) && !this.def.noHud) {
      const label = this.promptLabel(e), kw = textW(bindName('interact')) + 6, w = kw + 8 + textW(label) + 6;
      this.promptRect = Labels.place(e.x + e.w / 2 - cx - w / 2, e.y - cy - 20, w, 13);
      this.promptRect.label = label;
    }
  }
  promptLabel(e) { return e.cfg && e.cfg.verb ? e.cfg.verb : e instanceof NPC ? 'Hablar' : e instanceof Exit ? (e.cfg.label ? 'Ir a ' + e.cfg.label.toLowerCase() : 'Ir al mapa') : 'Usar'; }
  onScreen(e, cx, cy, m = 32) { return e.x + (e.w || 16) > cx - m && e.x < cx + W + m && e.y + (e.h || 16) > cy - m - 40 && e.y < cy + H + m; }
  drawDynamicTiles(g, cx, cy) {
    const x0 = Math.max(0, Math.floor(cx / TILE)), x1 = Math.min(this.w - 1, Math.floor((cx + W) / TILE));
    const y0 = Math.max(0, Math.floor(cy / TILE)), y1 = Math.min(this.h - 1, Math.floor((cy + H) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const t = this.tiles[y][x];
      if (t === '.' || t === '#' || t === '=' || t === 'H' || t === '|') continue;
      const sx = x * TILE - cx, sy = y * TILE - cy;
      if (t === '^') { drawHazard(g, sx, sy, this.theme.hazard, this.time, x); continue; }
      if (t === '~') continue;
      const d = this.dyn(t);
      if (d) drawDynTile(g, sx, sy, d, this, x, y);
    }
  }
  // sombras de contacto bajo Lía, los NPCs y los enemigos que pisan suelo
  drawShadows(g, cx, cy) {
    const p = this.player;
    if (p.onGround && !p.inWater && !p.climbing) groundShadow(g, p.x + p.w / 2 - cx, p.y + p.h - cy, 12);
    for (const e of this.entities) {
      if (e.dead || e.hidden || !this.onScreen(e, cx, cy)) continue;
      if (e instanceof NPC ? !!e.present : e instanceof Enemy && e.onGround) groundShadow(g, e.x + e.w / 2 - cx, e.y + e.h - cy, Math.min(20, e.w + 4));
    }
  }
  drawWater(g, cx, cy) {
    const x0 = Math.max(0, Math.floor(cx / TILE)), x1 = Math.min(this.w - 1, Math.floor((cx + W) / TILE));
    const y0 = Math.max(0, Math.floor(cy / TILE)), y1 = Math.min(this.h - 1, Math.floor((cy + H) / TILE));
    const [c1, c2] = this.theme.water, t = this.time;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (this.tiles[y][x] !== '~') continue;
      const sx = x * TILE - cx, sy = y * TILE - cy;
      let depth = 0; while (depth < 4 && this.tile(x, y - depth - 1) === '~') depth++;
      const surface = depth === 0;
      // más profundo = más opaco y oscuro
      g.globalAlpha = 0.66 + depth * 0.06; rect(g, sx, sy, 16, 16, depth ? shade(c1, -0.07 * depth) : c1); g.globalAlpha = 1;
      if (surface) {
        g.globalAlpha = 0.28; rect(g, sx, sy + 3, 16, 3, c2); g.globalAlpha = 1;
        for (let i = 0; i < 16; i++) { const wy = Math.round(Math.sin((x * 16 + i) * 0.3 + t * 3) * 1.2); rect(g, sx + i, sy + 1 + wy, 1, 2, c2); }
        // destellos de medio píxel que corren por la superficie
        g.fillStyle = '#FFFFFF';
        for (let i = 0; i < 2; i++) {
          const a = Math.sin(t * 2.6 + x * 1.7 + i * 2.4);
          if (a < 0.55) continue;
          g.globalAlpha = (a - 0.55) * 2;
          const gx = (x * 7 + i * 9 + Math.floor(t * 5)) % 14;
          g.fillRect(sx + gx, sy + 1.5 + Math.round(Math.sin((x * 16 + gx) * 0.3 + t * 3) * 1.2), 2.5, 0.5);
        }
        g.globalAlpha = 1;
      } else {
        // cáusticas: líneas de luz que ondulan bajo el agua
        g.globalAlpha = 0.1 / depth;
        for (let k = 0; k < 2; k++) rect(g, sx + (k * 7 + Math.floor(t * 6) + x * 3) % 14, sy + (k * 9 + y * 5) % 15, 3, 1, c2);
        g.globalAlpha = 1;
        if ((x + y + Math.floor(t * 2)) % 7 === 0) px(g, sx + 5, sy + 8, c2);
      }
    }
  }
  drawLensOverlay(g, cx, cy) {
    const a = this.lensT;
    g.globalAlpha = 0.18 * a; rect(g, 0, 0, W, H, PAL.teal); g.globalAlpha = 1;
    g.globalAlpha = 0.12 * a;
    for (let y = (Math.floor(this.time * 30) % 4); y < H; y += 4) rect(g, 0, y, W, 1, '#FFFFFF');
    g.globalAlpha = 1;
    // marco de lente
    g.globalAlpha = a;
    rect(g, 0, 0, W, 2, PAL.teal); rect(g, 0, H - 2, W, 2, PAL.teal); rect(g, 0, 0, 2, H, PAL.teal); rect(g, W - 2, 0, 2, H, PAL.teal);
    drawText(g, 'DEBUG LENS', W - 60, H - 14, PAL.teal);
    // rejilla de tiles
    const gx0 = -(cx % 16), gy0 = -(cy % 16);
    g.globalAlpha = 0.08 * a;
    for (let x = gx0; x < W; x += 16) rect(g, x, 0, 1, H, PAL.teal);
    for (let y = gy0; y < H; y += 16) rect(g, 0, y, W, 1, PAL.teal);
    g.globalAlpha = 1;
  }
  // etiquetas de la Lente: las más cercanas a Lía eligen sitio primero; si una se
  // desplaza para no pisar a otra, una línea de puntos la une a su objeto
  drawLensLabels(g, cx, cy) {
    const a = this.lensT, p = this.player;
    const items = [];
    for (const e of this.entities) if (e.lensInfo && this.onScreen(e, cx, cy)) {
      const info = e.lensInfo(); if (!info) continue;
      items.push({ e, lines: Array.isArray(info) ? info : [info], d: Math.abs(e.x + (e.w || 16) / 2 - p.cx) + Math.abs(e.y - p.y) * 0.5 });
    }
    items.sort((u, v) => u.d - v.d);
    g.globalAlpha = a;
    for (const it of items.slice(0, 7)) {
      const e = it.e, lines = it.lines;
      const w = Math.max(...lines.map(l => textW(stripMarkup(l)))) + 8, h = lines.length * 10 + 5;
      const ax = e.x + (e.w || 16) / 2 - cx, ay = e.y - cy;
      const r = Labels.place(ax - w / 2, ay - h - 6, w, h);
      const lx = clamp(Math.round(ax), r.x + 2, r.x + w - 3), ly = r.y + h < ay ? r.y + h : r.y;
      if (Math.abs(r.y + h + 6 - ay) > 3 || Math.abs(r.x + w / 2 - ax) > 3) { const ty = r.y + h < ay ? ay - 1 : ay + (e.h || 16); for (let yy = Math.min(ly, ty); yy < Math.max(ly, ty); yy += 2) px(g, lx, yy, PAL.teal); }
      panel(g, r.x, r.y, w, h, { border: PAL.teal, bg: 'rgba(5,30,40,0.92)' });
      lines.forEach((l, i) => drawRichLine(g, wrapRich(l, 400, PAL.mint)[0], r.x + 4, r.y + 4 + i * 10));
    }
    g.globalAlpha = 1;
  }
}

const DEFAULT_DYN = {
  '?': { solid: lv => lv.lensT > 0.5, style: 'hidden' }
};
function drawDynTile(g, sx, sy, d, lv, tx, ty) {
  const s = d.style;
  const on = d.solid ? d.solid(lv) : d.active ? d.active(lv) : true;
  if (s === 'hidden') {
    if (lv.lensT > 0.05) { g.globalAlpha = lv.lensT; rect(g, sx + 1, sy + 1, 14, 14, 'rgba(48,225,197,0.35)'); strokeRect(g, sx + 1, sy + 1, 14, 14, PAL.teal); drawText(g, '01', sx + 3, sy + 5, PAL.mint); g.globalAlpha = 1; }
  } else if (s === 'bridge') {
    if (on) { rect(g, sx, sy, 16, 4, '#FFD84A'); rect(g, sx, sy, 16, 1, '#FFF3D7'); rect(g, sx, sy + 4, 16, 1, '#C88A2A'); if ((tx + Math.floor(lv.time * 8)) % 4 === 0) rect(g, sx + 6, sy + 1, 3, 2, '#FFFFFF'); }
    else { g.globalAlpha = 0.35; for (let i = 0; i < 16; i += 4) rect(g, sx + i, sy + 1, 2, 1, PAL.sun); g.globalAlpha = 1; }
  } else if (s === 'gate') {
    // compuerta física de 3 baldosas; por encima, un campo de energía que se desvanece con la altura
    const ch = lv.tile(tx, ty);
    let below = 0; while (below < 30 && lv.tile(tx, ty + below + 1) === ch) below++;
    if (below < 3) {
      if (on) {
        rect(g, sx + 2, sy, 12, 16, '#565E8C'); rect(g, sx + 2, sy, 2, 16, '#8C96C0'); rect(g, sx + 12, sy, 2, 16, '#2A3060');
        for (let i = 0; i < 16; i += 4) rect(g, sx + 4, sy + i, 8, 1, '#3A4068');
        if (below === 1) { const blink = Math.floor(lv.time * 3) % 2; rect(g, sx + 6, sy + 6, 4, 4, blink ? PAL.coral : '#8A2A3A'); }
        if (below === 2) { rect(g, sx, sy, 16, 3, '#3A4068'); rect(g, sx, sy, 16, 1, '#8C96C0'); rect(g, sx + 3, sy + 1, 2, 1, PAL.coral); rect(g, sx + 11, sy + 1, 2, 1, PAL.coral); }
      } else if (below === 0) { rect(g, sx + 2, sy + 14, 12, 2, '#3A4068'); }
    } else if (on) {
      const a = Math.max(0.12, 0.55 - (below - 3) * 0.07);
      g.globalAlpha = a * (0.8 + Math.sin(lv.time * 5 + ty) * 0.2);
      rect(g, sx + 6, sy, 1, 16, PAL.coral); rect(g, sx + 9, sy, 1, 16, PAL.coral); rect(g, sx + 7, sy, 2, 16, '#FFB0B0');
      const k = Math.floor((lv.time * 40 + ty * 7) % 16); rect(g, sx + 7, sy + 15 - k, 2, 2, '#FFFFFF');
      g.globalAlpha = 1;
    }
  } else if (s === 'barrier') {
    if (on) { const c = d.color || PAL.violet; g.globalAlpha = 0.5 + Math.sin(lv.time * 6 + ty) * 0.2; rect(g, sx + 5, sy, 6, 16, c); rect(g, sx + 7, sy, 2, 16, '#FFFFFF'); g.globalAlpha = 1; }
  } else if (s === 'wind') {
    if (on) { for (let i = 0; i < 3; i++) { const yy = sy + 16 - ((lv.time * 60 + i * 6 + tx * 5) % 16); rect(g, sx + 3 + i * 4, yy, 1, 3, 'rgba(255,255,255,0.7)'); } }
    else if ((tx + ty) % 2 === 0) { rect(g, sx + 7, sy + 7, 2, 2, 'rgba(255,255,255,0.2)'); }
  } else if (s === 'block') {
    if (on) { rect(g, sx, sy, 16, 16, d.color || '#8A7AC8'); strokeRect(g, sx, sy, 16, 16, shade(d.color || '#8A7AC8', -0.4)); rect(g, sx + 1, sy + 1, 14, 1, shade(d.color || '#8A7AC8', 0.3)); }
    else { g.globalAlpha = 0.3; strokeRect(g, sx + 1, sy + 1, 14, 14, d.color || '#8A7AC8'); g.globalAlpha = 1; }
  } else if (s === 'heat') {
    if (on) { g.globalAlpha = 0.55; rect(g, sx + 4, sy, 8, 16, '#FFD84A'); rect(g, sx + 6, sy, 4, 16, '#FFFFFF'); g.globalAlpha = 1; }
    else if ((ty + Math.floor(lv.time * 4)) % 3 === 0) px(g, sx + 8, sy + 8, PAL.sun);
  } else if (s === 'custom' && d.draw) d.draw(g, sx, sy, lv, tx, ty);
}
function drawHazard(g, sx, sy, type, t, tx) {
  switch (type) {
    case 'thorn': for (let i = 0; i < 16; i += 4) { rect(g, sx + i + 1, sy + 10, 2, 6, '#3FA85A'); rect(g, sx + i + 1, sy + 8, 2, 2, '#9B76FF'); px(g, sx + i + 1, sy + 7, '#FF7FCF'); } break;
    case 'magma': { rect(g, sx, sy + 6, 16, 10, '#FF6A2A'); for (let i = 0; i < 16; i++) rect(g, sx + i, sy + 5 + Math.round(Math.sin(i * 0.6 + t * 4 + tx) * 1.5), 1, 2, '#FFD84A'); if (Math.random() < 0.02) Particles.spawn({ x: sx + rand(0, 16) + Level.camRef.x, y: sy + 6 + Level.camRef.y, vy: -40, vx: rand(-10, 10), grav: 120, life: 0.8, color: PAL.sun }); break; }
    case 'heat': rect(g, sx, sy + 12, 16, 4, '#FF9D42'); for (let i = 0; i < 16; i += 3) rect(g, sx + i, sy + 8 + Math.round(Math.sin(t * 8 + i) * 2), 1, 4, '#FFD84A'); break;
    case 'spark': for (let i = 0; i < 16; i += 5) { const f = Math.floor(t * 10 + i) % 3; rect(g, sx + i, sy + 12 - f * 2, 2, 4 + f * 2, f ? PAL.aqua : '#FFFFFF'); } rect(g, sx, sy + 14, 16, 2, '#565E8C'); break;
    case 'urchin': for (let i = 0; i < 16; i += 8) { pcircle(g, sx + i + 4, sy + 12, 3, '#9B76FF'); for (let k = 0; k < 6; k++) { const a = k * 1.05 + t; px(g, sx + i + 4 + Math.cos(a) * 5, sy + 12 + Math.sin(a) * 5, '#C9B2FF'); } } break;
    case 'leak': rect(g, sx, sy + 12, 16, 4, '#8A96C8'); for (let i = 0; i < 3; i++) { const yy = sy + 12 - ((t * 30 + i * 5) % 12); px(g, sx + 4 + i * 4, yy, '#FFFFFF'); } break;
    case 'zero': { rect(g, sx, sy + 10, 16, 6, '#F4F6FF'); rect(g, sx, sy + 10, 16, 1, '#FFFFFF'); const f = Math.floor(t * 6) % 16; rect(g, sx + f, sy + 8, 2, 2, '#DCE2F5'); break; }
    default: rect(g, sx, sy + 8, 16, 8, '#9B76FF'); for (let i = 0; i < 16; i += 4) pcircle(g, sx + i + 2, sy + 8 + Math.round(Math.sin(t * 3 + i) * 1), 2, '#C9B2FF');
  }
}
Level.camRef = { x: 0, y: 0 };

function drawAurora(g, t) {
  const cols = ['#30E1C5', '#66D66A', '#9B76FF', '#FF7FCF'];
  for (let b = 0; b < 4; b++) {
    g.globalAlpha = 0.18;
    for (let x = 0; x < W; x += 2) {
      const y = 30 + b * 18 + Math.sin(x * 0.012 + t * 0.4 + b) * 16 + Math.sin(x * 0.03 - t * 0.7) * 6;
      rect(g, x, y, 2, 20 + Math.sin(x * 0.05 + t + b) * 8, cols[b]);
    }
  }
  g.globalAlpha = 1;
}

// ---------- elementos vivos de fondo ----------
// Cada elemento tiene su profundidad de parallax (p): se dibuja entre las capas
// adecuadas y se ancla verticalmente igual que ellas (los barcos siempre sobre el mar).
function themeHorizon(th) { const sea = (th.layers || []).find(L => L.fn === 'sea'); return sea ? sea.o.y : 190; }
function wrapX(x, span) { return ((x % span) + span) % span; }
const LIVE_BG = {
  // rayos de luz con degradado real (detalle fino en modo HD)
  sunrays: { p: 0, draw(g, lv, cx, cy, oy, t) { drawSoftRays(g, t, ['#FFF3C0', '#FFFFFF', '#FFE08A', '#FFFFFF', '#FFF3C0', '#FFE8A0'], 0.09, W * (lv.theme.sun ? lv.theme.sun.x : 0.5) - cx * 0.02 % 40); } },
  prismrays: { p: 0, draw(g, lv, cx, cy, oy, t) { const cols = []; for (let i = 0; i < 7; i++) cols.push(hsl(i * 50 + t * 20, 90, 65)); drawSoftRays(g, t, cols, 0.1, W * 0.5); } },
  clouds: {
    // nubes altas con volumen (pre-renderizadas) que derivan despacio
    p: 0.03, draw(g, lv, cx, cy, oy, t) {
      const th = lv.theme, top = skyColorAt(th, 0.15);
      const tones = lv._cloudTones || (lv._cloudTones = [mix(top, '#FFFFFF', 0.45), mix(top, '#FFFFFF', 0.7), '#F4F8FF', '#FFFFFF']);
      for (let i = 0; i < 5; i++) {
        const spr = CloudSprites.get(i + 1, i % 2 ? 0.55 : 0.75, tones);
        const x = wrapX(i * 137 + t * (3 + i) - cx * 0.03, W + 120) - 60, y = 18 + i * 15 + oy;
        g.globalAlpha = 0.94; g.drawImage(spr, Math.round(x - spr.width / 2), Math.round(y - spr.height * 0.6)); g.globalAlpha = 1;
      }
    }
  },
  lighthouse: {
    // el Faro Aurora a lo lejos, sobre un islote en el horizonte
    p: 0.1, draw(g, lv, cx, cy, oy, t) {
      const hz = themeHorizon(lv.theme) + oy;
      const x = Math.round(wrapX(380 - cx * 0.1, W + 200) - 60), top = hz - 58;
      pellipse(g, x + 5, hz + 1, 16, 4, '#2A2050'); rect(g, x - 9, hz - 2, 28, 3, '#3A2E6E'); rect(g, x - 6, hz - 3, 22, 1, '#4A3E7E');
      rect(g, x, top, 10, hz - 2 - top, '#FFF3D7'); for (let k = 0; k < hz - top - 4; k += 12) rect(g, x, top + k, 10, 5, '#FF6B6B');
      rect(g, x - 2, top - 8, 14, 8, '#22306B'); rect(g, x - 3, top - 10, 16, 2, '#FF6B6B');
      const on = lv.def.lighthouseOn ? lv.def.lighthouseOn(lv) : (lv.power > 0.5 || lv.themeKey === 'festival');
      rect(g, x + 2, top - 6, 6, 4, on ? PAL.sun : '#3A4068');
      if (on) drawLightBeam(g, x + 5, top - 4, t * 1.1, 120, 0.25, PAL.sun, 0.4);
    }
  },
  boats: {
    // veleros lejanos: la quilla siempre sobre la línea del mar
    p: 0.1, draw(g, lv, cx, cy, oy, t) {
      const hz = themeHorizon(lv.theme) + oy;
      for (let i = 0; i < 3; i++) {
        const x = Math.round(wrapX(i * 170 + t * (3 + i) - cx * 0.1, W + 80) - 40), y = Math.round(hz + 3 + i * 3 + Math.sin(t * 1.2 + i * 2) * 0.8);
        const tilt = Math.sin(t * 1.2 + i * 2) > 0.4 ? 1 : 0;
        rect(g, x, y - 4, 20, 3, '#8B5A3C'); rect(g, x + 2, y - 1, 16, 2, '#5E3A26'); rect(g, x + 3, y - 6, 5, 2, '#2A4A9A');
        rect(g, x + 9, y - 19 + tilt, 1, 15, '#FFF3D7');
        for (let k = 0; k < 11; k++) rect(g, x + 10, y - 18 + k + tilt, Math.floor(k * 0.7), 1, i % 2 ? PAL.sun : PAL.cream);
        g.globalAlpha = 0.35; rect(g, x - 1, y + 1, 22, 1, '#FFFFFF'); g.globalAlpha = 1; // espuma
      }
    }
  },
  gulls: { p: 0.2, draw(g, lv, cx, cy, oy, t) { for (let i = 0; i < 3; i++) { const x = wrapX(t * 26 + i * 140 - cx * 0.2, W + 60) - 30, y = 40 + i * 12 + Math.sin(t * 1.2 + i) * 5 + oy; const f = Math.floor(t * 3 + i) % 2; rect(g, x - 3, y - f, 3, 1, '#FFFFFF'); rect(g, x + 1, y - f, 3, 1, '#FFFFFF'); rect(g, x, y, 1, 1, '#FFFFFF'); } } },
  birds: { p: 0.22, draw(g, lv, cx, cy, oy, t) { for (let i = 0; i < 4; i++) { const x = wrapX(t * 18 + i * 90 - cx * 0.22, W + 60) - 30, y = 46 + i * 9 + Math.sin(t * 1.5 + i) * 4 + oy; const f = Math.floor(t * 4 + i) % 2; rect(g, x, y, 1, 1, '#2A2A4A'); rect(g, x - 2, y - f, 2, 1, '#2A2A4A'); rect(g, x + 1, y - f, 2, 1, '#2A2A4A'); } } },
  kites: {
    p: 0.2, draw(g, lv, cx, cy, oy, t) {
      for (let i = 0; i < 3; i++) {
        const xx = wrapX(60 + i * 170 - cx * 0.2, W), y = 50 + i * 15 + Math.sin(t * 1.1 + i) * 6 + oy; const c = [PAL.pink, PAL.sun, PAL.teal][i];
        for (let k = 0; k < 6; k++) rect(g, xx - (5 - Math.abs(k - 3)), y + k, (5 - Math.abs(k - 3)) * 2, 1, c);
        // el hilo baja hasta perderse entre las nubes (alguien la sujeta desde una isla)
        for (let k = 0; k < 60; k++) { g.globalAlpha = Math.max(0, 1 - k / 60); px(g, xx + Math.sin(k * 0.25 + t * 2.5) * (2 + k * 0.05), y + 6 + k * 2, '#FFFFFF'); }
        g.globalAlpha = 1;
      }
    }
  },
  crystalGlow: {
    // resplandores suaves de cristales lejanos (degradado real, detalle fino en HD)
    p: 0.2, draw(g, lv, cx, cy, oy, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const x = wrapX(i * 67 - cx * 0.2, W), y = 60 + (i * 37) % 120 + oy + Math.sin(t * 0.6 + i) * 4, a = 0.22 + Math.sin(t * 1.2 + i) * 0.12;
        const grd = g.createRadialGradient(x, y, 0, x, y, 9);
        grd.addColorStop(0, rgba(i % 2 ? PAL.violet : PAL.pink, a)); grd.addColorStop(1, rgba(i % 2 ? PAL.violet : PAL.pink, 0));
        g.fillStyle = grd; g.fillRect(x - 9, y - 9, 18, 18);
      }
      g.restore();
    }
  },
  lanterns: {
    // farolillos del festival que suben lentamente al cielo
    p: 0.35, draw(g, lv, cx, cy, oy, t) {
      for (let i = 0; i < 12; i++) {
        const life = (t * 0.035 + i / 12) % 1;
        const x = Math.round(wrapX(i * 53 + Math.sin(t * 0.5 + i) * 6 - cx * 0.35, W + 40) - 20), y = Math.round(200 - life * 190 + oy);
        const c = [PAL.coral, PAL.sun, PAL.pink, PAL.orange][i % 4];
        g.globalAlpha = life > 0.85 ? (1 - life) / 0.15 : Math.min(1, life * 6);
        g.globalAlpha *= 0.3; pcircle(g, x + 2, y + 2, 5, c); g.globalAlpha /= 0.3;
        rect(g, x, y, 5, 5, c); rect(g, x + 1, y + 1, 3, 2, '#FFF3D7'); rect(g, x + 1, y + 5, 3, 1, shade(c, -0.3));
        g.globalAlpha = 1;
      }
    }
  },
  tram: {
    // tranvía elevado sobre un viaducto, a la profundidad de la ciudad cercana
    p: 0.45, draw(g, lv, cx, cy, oy, t) {
      const ry = 164 + oy;
      rect(g, 0, ry, W, 2, '#3A4068'); rect(g, 0, ry + 2, W, 1, '#22285A');
      for (let k = 0; k < W + 60; k += 60) { const px0 = Math.round(k - wrapX(cx * 0.45, 60)); rect(g, px0, ry + 3, 4, H - ry, '#22285A'); }
      const x = Math.round(wrapX(t * 40 - cx * 0.45, W + 200) - 100), y = ry - 14;
      rect(g, x, y, 60, 13, '#FFD84A'); rect(g, x, y + 10, 60, 3, '#C88A2A'); for (let k = 0; k < 5; k++) rect(g, x + 4 + k * 11, y + 3, 8, 5, '#9FE8FF');
      rect(g, x + 28, y - 8, 1, 8, '#565E8C'); rect(g, 0, y - 9, W, 1, '#3A4068');
    }
  },
  butterflies: { p: 0.7, draw(g, lv, cx, cy, oy, t) { for (let i = 0; i < 4; i++) { const xx = wrapX(i * 120 + Math.sin(t * 0.4 + i) * 50 - cx * 0.6, W), y = 150 + Math.sin(t * 0.9 + i * 2) * 18 + oy; const f = Math.floor(t * 6 + i) % 2; const c = [PAL.pink, PAL.sun, PAL.sky, PAL.orange][i]; rect(g, xx, y, 1, 2, '#2A2A4A'); if (f) { rect(g, xx - 2, y - 1, 2, 2, c); rect(g, xx + 1, y - 1, 2, 2, c); } else { rect(g, xx - 1, y - 1, 1, 2, c); rect(g, xx + 1, y - 1, 1, 2, c); } } } },
  windlines: { p: 0.9, draw(g, lv, cx, cy, oy, t) { for (let i = 0; i < 6; i++) { const x = wrapX(t * 120 + i * 90, W + 60) - 30, y = 30 + i * 35; g.globalAlpha = 0.45; rect(g, x, y, 24, 1, '#FFFFFF'); rect(g, x + 8, y + 3, 16, 1, '#FFFFFF'); g.globalAlpha = 1; } } },
  fish: {
    // peces que saltan desde el agua real del nivel
    p: 99, draw(g, lv, cx, cy, oy, t) {
      if (!lv._waterTops) { lv._waterTops = []; for (let ty = 1; ty < lv.h; ty++) for (let tx = 0; tx < lv.w; tx++) if (lv.tile(tx, ty) === '~' && lv.tile(tx, ty - 1) !== '~' && !lv.solidAt(tx, ty - 1)) lv._waterTops.push([tx, ty]); }
      const tops = lv._waterTops.filter(([tx, ty]) => tx * TILE > cx - 16 && tx * TILE < cx + W && ty * TILE > cy && ty * TILE < cy + H);
      if (!tops.length) return;
      for (let i = 0; i < 2; i++) {
        const cyc = t * 0.45 + i * 1.3, ph = cyc % 3;
        if (ph > 1) continue;
        const [tx, ty] = tops[(Math.floor(cyc / 3) * 7 + i * 5) % tops.length];
        const x = Math.round(tx * TILE + 4 + ph * 10 - cx), y = Math.round(ty * TILE + 2 - Math.sin(ph * Math.PI) * 18 - cy);
        rect(g, x, y, 5, 2, i ? PAL.coral : PAL.orange); px(g, x + (ph < 0.5 ? 5 : -1), y + (ph < 0.5 ? -1 : 1), PAL.sun);
      }
    }
  },
  beam: {
    // el haz nace de la linterna del faro (arriba del nivel), no de un punto fijo de la pantalla
    p: 99, draw(g, lv, cx, cy, oy, t) {
      const sx = lv.pw / 2 - cx, sy = 24 - cy;
      drawLightBeam(g, sx, sy, t * 0.8, 320, 0.2, PAL.sun, 0.3);
    }
  },
  fireworks: { p: 99, draw(g, lv, cx, cy) { if (Math.random() < 0.02) { const fx = rand(40, W - 40), fy = rand(30, 90); Particles.burst(fx + cx, fy + cy, 24, { colors: [PAL.pink, PAL.sun, PAL.teal, PAL.lime, PAL.orange], min: 30, max: 70, lmin: 0.6, lmax: 1.2, grav: 30, type: 'dot' }); } } },
  bubbles: { p: 99, draw(g, lv, cx, cy) { if (Math.random() < 0.05) Particles.spawn({ x: cx + rand(0, W), y: cy + H, vy: -20, life: 4, type: 'bubble', size: 1, color: '#DFFBFF', wob: 6, drag: 1 }); } },
  bubblesH2: { p: 99, draw(g, lv, cx, cy) { if (Math.random() < 0.05) Particles.spawn({ x: cx + rand(0, W), y: cy + H, vy: -30, life: 3, type: 'bubble', size: 1, color: '#9FE8FF', wob: 4, drag: 1 }); } },
  steamBg: { p: 99, draw(g, lv, cx, cy) { if (Math.random() < 0.1) Particles.spawn({ x: cx + rand(0, W), y: cy + 190, vy: -25, vx: rand(-5, 5), life: 2, type: 'fade', size: 3, color: 'rgba(255,255,255,0.3)', drag: 1 }); } },
  stars: { p: 99, draw(g, lv, cx, cy) { if (Math.random() < 0.01) Particles.spawn({ x: cx + rand(0, W), y: cy + rand(0, 100), vx: -80, vy: 30, life: 0.6, type: 'dot', color: '#FFFFFF', drag: 1 }); } }
};
function drawLiveBackground(g, lv, cx, cy, pMin = -1, pMax = 99) {
  const t = lv.time, live = lv.theme.live || [];
  for (const k of live) {
    const L = LIVE_BG[k];
    if (!L) continue;
    if (!(L.p > pMin && L.p <= pMax)) continue;
    L.draw(g, lv, cx, cy, L.p < 99 ? lv.layerOY(L.p, cy) : 0, t);
  }
}

// =====================================================================
//  JUGADORA: LÍA
// =====================================================================
class Player {
  constructor(lv, x, y) {
    this.lv = lv; this.x = x; this.y = y; this.w = 10; this.h = 20;
    this.vx = 0; this.vy = 0; this.face = 1; this.onGround = false; this.coyote = 0; this.buffer = 0;
    this.climbing = false; this.inWater = false; this.gliding = false; this.anim = 'idle'; this.animT = 0; this.frameT = 0;
    // células: 3 + 1 por cada 3 fragmentos de los jefes (+2 con la ayuda de combate)
    this.maxCells = 3 + Math.floor((G.save.cellShards || 0) / 3) + (G.save.settings.assist ? 2 : 0);
    this.cells = this.maxCells; this.inv = 0; this.energy = 100; this.shieldOn = false; this.shieldArmed = false;
    this.dashT = 0; this.landT = 0; this.stepT = 0; this.idleT = 0; this.onPlat = null; this.celebrateT = 0;
    this.shieldRule = G.save.shieldRule || 0;
    this.initCombat();
  }
  get cx() { return this.x + this.w / 2; }
  tileRectSolid(x, y, w, h) {
    const lv = this.lv;
    // bordes exclusivos con tolerancia mínima: tocar el suelo cuenta como apoyo sin hundirse 1 px
    const E = 0.01;
    const x0 = Math.floor(x / TILE), x1 = Math.floor((x + w - E) / TILE), y0 = Math.floor(y / TILE), y1 = Math.floor((y + h - E) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (lv.solidAt(tx, ty)) return { tx, ty };
    return null;
  }
  entitySolids() { return this.lv.entities.filter(e => e.solidRect && !e.dead); }
  moveX(dx) {
    this.x += dx;
    const hit = this.tileRectSolid(this.x, this.y, this.w, this.h);
    if (hit) {
      if (dx > 0) this.x = hit.tx * TILE - this.w; else if (dx < 0) this.x = (hit.tx + 1) * TILE;
      if (Math.abs(this.vx) > 60 && this.onGround && Math.random() < 0.08) this.lv.pix.bonkChance();
      this.vx = 0; this.hitWall = true;
    }
    for (const e of this.entitySolids()) {
      const r = e.solidRect(); if (!r || r.oneWay) continue;
      if (rectHit(this, r)) { if (dx > 0) this.x = r.x - this.w; else this.x = r.x + r.w; this.vx = 0; }
    }
  }
  moveY(dy) {
    const prevBottom = this.y + this.h;
    this.y += dy;
    const lv = this.lv;
    this.onGround = false;
    const hit = this.tileRectSolid(this.x, this.y, this.w, this.h);
    if (hit) {
      if (dy > 0) { this.y = hit.ty * TILE - this.h; this.land(); }
      else if (dy < 0) { this.y = (hit.ty + 1) * TILE; this.vy = 0; }
    } else if (dy >= 0 && !this.dropThrough) {
      // plataformas de un sentido
      const ty = Math.floor((this.y + this.h - 0.01) / TILE);
      const x0 = Math.floor(this.x / TILE), x1 = Math.floor((this.x + this.w - 0.01) / TILE);
      for (let tx = x0; tx <= x1; tx++) {
        if (lv.oneWayAt(tx, ty) && prevBottom <= ty * TILE + 1) { this.y = ty * TILE - this.h; this.land(); break; }
      }
    }
    // plataformas/entidades sólidas
    this.onPlat = null;
    for (const e of this.entitySolids()) {
      const r = e.solidRect(); if (!r) continue;
      if (!rectHit(this, r)) continue;
      if (dy >= 0 && prevBottom <= r.y + 2 + Math.max(0, e.dy || 0)) { this.y = r.y - this.h; this.land(); this.onPlat = e; }
      else if (!r.oneWay) { if (dy < 0) { this.y = r.y + r.h; this.vy = 0; } }
    }
  }
  land() {
    if (!this.onGround && this.vy > 160) { this.landT = 0.12; AudioSys.sfx('land'); Particles.burst(this.cx + this.lv.cam.x * 0, this.y + this.h, 5, { color: '#FFF3D7', min: 10, max: 30, angle: -Math.PI / 2, spread: 1.2, lmin: 0.2, lmax: 0.4 }); }
    this.onGround = true; this.vy = 0; this.coyote = PHYS.coyote; this.gliding = false;
  }
  hurt(src) {
    if (this.inv > 0 || this.dashT > 0 || G.noDamage || (Cut.active && !Cut.free)) return;
    if (this.shieldOn) { AudioSys.sfx('shield'); Particles.burst(this.cx, this.y + 10, 10, { color: PAL.orange, min: 30, max: 60 }); if (src && src.bounce) src.bounce(this); return; }
    // el golpe empuja lejos de quien lo dio
    const sx = src && src.x != null ? src.x + (src.w || 0) / 2 : null;
    const dir = sx != null && Math.abs(sx - this.cx) > 1 ? sign(this.cx - sx) : -this.face;
    this.cells--; this.inv = 1.3; this.vy = -180; this.vx = dir * 150; this.hurtT = 0.28;
    if (src && src.knockPlayer) src.knockPlayer(this);
    this.atk = null; this.chargeT = 0; this.chargeReady = false; this.healT = 0;
    hitstop(this.lv, 0.07);
    AudioSys.sfx('hurt'); FX.shake(3, 0.25); FX.flash('#FF6B6B', 0.25);
    this.anim = 'hurt'; this.animT = 0.4;
    this.lv.lumi.mood = 'fear'; this.lv.lumi.moodT = 2;
    if (this.cells <= 0) this.lv.gameOver();
    else if (Math.random() < 0.5) Bark.say('pix', choice(['¡Ay! Eso dolió en mis sensores.', 'Anotado: no tocar eso.', '¡Cuidado, Lía!']));
  }
  update(dt, control) {
    const lv = this.lv;
    this.frameT += dt; this.inv = Math.max(0, this.inv - dt); this.animT = Math.max(0, this.animT - dt); this.landT = Math.max(0, this.landT - dt);
    let ax = control ? Input.axisX() : (this.autoX || 0);
    if (lv.inverted > 0) { lv.inverted -= dt; ax = -ax; }
    const up = control && Input.down('up'), down = control && Input.down('down');
    const jumpHit = control && Input.hit('jump'), jumpDown = control && Input.down('jump');
    const running = control && Input.down('run');
    // sable de luz
    this.updateCombat(dt, control);
    // plataforma móvil
    if (this.onPlat && this.onPlat.dx) this.moveX(this.onPlat.dx);
    // agua
    const midT = lv.tile(Math.floor(this.cx / TILE), Math.floor((this.y + 10) / TILE));
    const wasWater = this.inWater;
    this.inWater = midT === '~';
    if (this.inWater && !wasWater) { AudioSys.sfx('splash'); Particles.burst(this.cx, this.y + 8, 10, { color: '#DFFBFF', min: 30, max: 70, angle: -Math.PI / 2, spread: 1, grav: 300 }); }
    // escaleras / cuerdas
    const ladderAt = (px0, py0) => { const t = lv.tile(Math.floor(px0 / TILE), Math.floor(py0 / TILE)); return t === 'H' || t === '|'; };
    const onLadder = ladderAt(this.cx, this.y + this.h - 2) || ladderAt(this.cx, this.y + 4);
    if (!this.climbing && onLadder && (up || (down && !this.onGround) || (down && ladderAt(this.cx, this.y + this.h + 2)))) { this.climbing = true; this.x = Math.floor(this.cx / TILE) * TILE + 3; }
    if (this.climbing) {
      if (!onLadder && !ladderAt(this.cx, this.y + this.h + 2)) this.climbing = false;
      this.vx = ax * 40; this.vy = (up ? -PHYS.climb : 0) + (down ? PHYS.climb : 0);
      if (jumpHit) { this.climbing = false; this.vy = -PHYS.jumpV * 0.8; AudioSys.sfx('jump'); }
      this.moveX(this.vx * dt);
      // dejar la escalera al llegar arriba
      this.dropThrough = true; this.moveY(this.vy * dt); this.dropThrough = false;
      if (this.onGround && !up) this.climbing = false;
      this.anim = 'climb';
      if (this.vy !== 0) this.stepT += dt;
      return this.post(dt);
    }
    // habilidad
    if (control) this.updateAbility(dt);
    if (this.dashT > 0) {
      this.dashT -= dt; this.vy = 0;
      this.moveX(this.dashDir * 330 * dt);
      if (Math.random() < 0.8) Particles.spawn({ x: this.cx, y: this.y + rand(2, 18), vx: -this.dashDir * 40, life: 0.3, type: 'fade', size: 2, color: PAL.pink });
      return this.post(dt);
    }
    // horizontal
    // al atacar en el suelo se planta un poco (el golpe «pesa»); en el aire se mantiene el impulso
    const slow = this.atk && this.onGround ? 0.55 : this.healT > 0 ? 0 : 1;
    const maxS = (running ? PHYS.run : PHYS.walk) * (this.inWater ? 0.6 : 1) * slow;
    const target = ax * maxS;
    const acc = this.onGround ? (ax !== 0 ? PHYS.accG : PHYS.decG) : PHYS.accA;
    // retroceso breve tras un golpe: el impulso aleja a Lía de lo que la dañó
    this.hurtT = Math.max(0, (this.hurtT || 0) - dt);
    if (this.hurtT > 0) this.vx = approach(this.vx, 0, 220 * dt);
    else this.vx = approach(this.vx, target, acc * dt);
    if (ax !== 0 && !this.atk && this.hurtT <= 0) this.face = ax > 0 ? 1 : -1;
    // viento
    let lift = 0;
    const tMid = lv.tile(Math.floor(this.cx / TILE), Math.floor((this.y + this.h / 2) / TILE));
    const dd = lv.dyn(tMid);
    if (dd && dd.style === 'wind' && (!dd.active || dd.active(lv))) lift = this.gliding ? 1500 : 900;
    for (const e of lv.entities) if (e.windRect) { const r = e.windRect(); if (r && rectHit(this, r)) lift = Math.max(lift, this.gliding ? 1500 : 850); }
    // gravedad
    let grav = this.vy < 0 && jumpDown ? PHYS.gravHold : PHYS.grav;
    let maxFall = PHYS.maxFall;
    if (this.inWater) { grav = PHYS.waterGrav; maxFall = PHYS.waterMax; }
    // planeo (Loop Glide)
    this.gliding = false;
    if (hasAbility('glide') && !this.onGround && !this.inWater && this.vy > 0 && jumpDown && this.coyote <= 0) { this.gliding = true; maxFall = PHYS.glideFall; }
    this.vy += grav * dt - lift * dt;
    if (lift) this.vy = Math.max(this.vy, -220);
    this.vy = Math.min(this.vy, maxFall);
    // salto con coyote + buffer
    this.coyote -= dt; this.buffer -= dt;
    if (jumpHit) this.buffer = PHYS.buffer;
    if (this.buffer > 0) {
      if (this.onGround && down && this.standingOnOneWay()) { this.dropThrough = true; this.dropT = 0.2; this.buffer = 0; }
      else if (this.coyote > 0 || this.onGround) { this.vy = -PHYS.jumpV; this.onGround = false; this.coyote = 0; this.buffer = 0; AudioSys.sfx('jump'); Particles.burst(this.cx, this.y + this.h, 4, { color: '#FFF3D7', min: 10, max: 30, angle: Math.PI / 2, spread: 1.4, lmin: 0.2, lmax: 0.3 }); }
      else if (this.inWater) { this.vy = -PHYS.swimV; this.buffer = 0; AudioSys.sfx('splash'); }
    }
    if (this.inWater && up) this.vy = Math.max(this.vy - 500 * dt, -90);
    if (this.dropT > 0) { this.dropT -= dt; if (this.dropT <= 0) this.dropThrough = false; }
    // mover
    this.hitWall = false;
    this.moveX(this.vx * dt);
    const wasGround = this.onGround;
    this.moveY(this.vy * dt);
    if (wasGround && !this.onGround && this.vy >= 0) this.coyote = PHYS.coyote;
    // peligros
    this.checkHazards();
    // caer del mapa
    if (this.y > lv.ph + 40) lv.fellOut();
    return this.post(dt);
  }
  standingOnOneWay() {
    const ty = Math.floor((this.y + this.h + 1) / TILE);
    const x0 = Math.floor(this.x / TILE), x1 = Math.floor((this.x + this.w - 0.01) / TILE);
    for (let tx = x0; tx <= x1; tx++) if (this.lv.solidAt(tx, ty)) return false;
    for (let tx = x0; tx <= x1; tx++) if (this.lv.oneWayAt(tx, ty)) return true;
    return this.onPlat && this.onPlat.solidRect && this.onPlat.solidRect() && this.onPlat.solidRect().oneWay;
  }
  checkHazards() {
    const lv = this.lv;
    const hb = { x: this.x + 2, y: this.y + 6, w: this.w - 4, h: this.h - 6 };
    const x0 = Math.floor(hb.x / TILE), x1 = Math.floor((hb.x + hb.w) / TILE), y0 = Math.floor(hb.y / TILE), y1 = Math.floor((hb.y + hb.h) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = lv.tile(tx, ty);
      if (t === '^') { const r = { x: tx * TILE + 1, y: ty * TILE + 8, w: 14, h: 8 }; if (rectHit(hb, r)) { this.hurt(); return; } }
      const d = lv.dyn(t);
      if (d && d.hazard && d.hazard(lv)) { this.hurt(); return; }
    }
  }
  // ---------- habilidades ----------
  updateAbility(dt) {
    const lv = this.lv;
    const owned = ABILITY_ORDER.filter(a => hasAbility(a));
    if (Input.hit('swap') && owned.length > 1) {
      const i = owned.indexOf(G.save.currentAbility);
      G.save.currentAbility = owned[(i + 1) % owned.length];
      AudioSys.sfx('select'); Toast.show('Habilidad: ' + ABILITIES[G.save.currentAbility].name, ABILITIES[G.save.currentAbility].color, 1.4);
    }
    const ab = G.save.currentAbility;
    // escudo condicional: se evalúa en cada frame
    this.shieldOn = false;
    if (this.shieldArmed && hasAbility('shield')) {
      const cond = this.shieldCondition();
      if (cond && this.energy > 0) { this.shieldOn = true; this.energy -= (this.shieldRule === 1 ? 45 : 30) * dt; if (this.energy <= 0) { this.energy = 0; this.shieldArmed = false; Bark.say('pix', 'Escudo sin energía. ¿Quizás la condición era demasiado amplia?'); } }
    }
    // la energía se recarga sola hasta 60; el resto se gana golpeando con el sable y con los orbes
    if (!this.shieldOn && this.energy < PASSIVE_ENERGY_CAP) this.energy = Math.min(PASSIVE_ENERGY_CAP, this.energy + (lv.power > 0.3 ? 18 : 10) * dt);
    if (Input.hit('ability') && ab) {
      if (lv.def.abilityHook && lv.def.abilityHook(lv, ab)) return;
      switch (ab) {
        case 'spark': if (!lv.ghost || lv.ghost.done) Scenes.push(new SparkEditorScene(lv)); else Bark.say('pix', 'Espera a que termine el eco actual.'); break;
        case 'shield': Scenes.push(new ShieldRuleScene(this)); break;
        case 'glide': Bark.say('pix', 'MIENTRAS mantengas SALTO en el aire: planear. ¡Un bucle con condición!'); break;
        case 'dash':
          if (this.energy >= 20) {
            this.energy -= 20; this.dashT = 0.2; this.dashDir = this.face; this.inv = Math.max(this.inv, 0.25); AudioSys.sfx('dash');
            const tgt = lv.entities.filter(e => e.priority != null && !e.dead && Math.abs(e.y - this.y) < 40 && (e.x - this.x) * this.face > 0 && Math.abs(e.x - this.x) < 110).sort((a, b) => b.priority - a.priority)[0];
            if (tgt) { this.dashDir = sign(tgt.x - this.x) || this.face; Particles.text(tgt.x + 4, tgt.y - 6, 'PRIORIDAD ' + tgt.priority, PAL.pink); }
          } else Bark.say('pix', 'Energía insuficiente para el Dash. Recarga cerca de la luz.');
          break;
        default: {
          // habilidades contextuales: portal, estados, pipeline, pack
          const tgt = lv.entities.find(e => e.onAbility && !e.dead && rectHit(this, { x: e.x - 24, y: e.y - 24, w: e.w + 48, h: e.h + 48 }));
          if (tgt) { this.anim = 'ability'; this.animT = 0.35; tgt.onAbility(ab, this); }
          else if (ab === 'pack') { const items = G.save.pack || []; Bark.say('pix', items.length ? 'mochila = [' + items.map(i => i.name).join(', ') + ']' : 'mochila = [ ]  (lista vacía)'); }
          else Bark.say('pix', ABILITIES[ab].name + ': no hay nada con qué usarla aquí.');
        }
      }
    }
  }
  shieldCondition() {
    const lv = this.lv;
    if (this.shieldRule === 1) return true; // SIEMPRE
    if (this.shieldRule === 2) return !this.onGround; // SI saltando
    if (lv.boss && lv.boss.ringNear(this.cx, this.y + 10, 22)) return true;
    // SI peligro_cerca
    const R = 26;
    for (const e of lv.entities) if (e.hostile && !e.dead && dist(e.x + e.w / 2, e.y + e.h / 2, this.cx, this.y + 10) < R + 10) return true;
    const x0 = Math.floor((this.x - R) / TILE), x1 = Math.floor((this.x + this.w + R) / TILE), y0 = Math.floor((this.y - R / 2) / TILE), y1 = Math.floor((this.y + this.h + R / 2) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const t = lv.tile(tx, ty); if (t === '^') return true; const d = lv.dyn(t); if (d && d.hazard && d.hazard(lv)) return true; }
    return false;
  }
  post(dt) {
    // animación
    if (this.animT > 0 && ['interact', 'hurt', 'ability', 'program', 'celebrate', 'surprise'].includes(this.anim)) { }
    else if (this.atk && !this.climbing) this.anim = this.atk.kind === 'up' ? 'slashUp' : this.atk.kind === 'down' ? 'slashDown' : 'slash';
    else if (this.chargeT > 0.15 && !this.climbing && !this.inWater && this.onGround) this.anim = 'charge';
    else if (this.healT > 0.05) this.anim = 'ability';
    else if (this.celebrateT > 0) { this.celebrateT -= dt; this.anim = 'celebrate'; }
    else if (this.climbing) this.anim = 'climb';
    else if (this.inWater) this.anim = 'swim';
    else if (this.gliding) this.anim = 'glide';
    else if (!this.onGround) this.anim = this.vy < 0 ? 'jump' : 'fall';
    else if (this.landT > 0) this.anim = 'land';
    else if (Math.abs(this.vx) > 100) this.anim = 'run';
    else if (Math.abs(this.vx) > 8) this.anim = 'walk';
    else this.anim = this.forceAnim || 'idle';
    // reloj de animación: se reinicia al cambiar de animación y avanza según la velocidad real
    if (this.anim !== this.lastAnim) { this.lastAnim = this.anim; this.animClock = 0; }
    const sp = Math.abs(this.vx);
    const rate = this.anim === 'walk' ? clamp(sp / PHYS.walk, 0.45, 1.3) : this.anim === 'run' ? clamp(sp / PHYS.run, 0.6, 1.2) : this.anim === 'climb' ? (this.vy !== 0 ? 1 : 0) : this.anim === 'swim' ? (Math.abs(this.vx) + Math.abs(this.vy) > 10 ? 1 : 0.5) : 1;
    this.animClock = (this.animClock || 0) + dt * rate;
    // parpadeo natural: cada 2,5–5,5 s, dura 0,13 s
    this.blinkT = (this.blinkT == null ? 3 : this.blinkT) - dt;
    if (this.blinkT < -0.13) this.blinkT = rand(2.5, 5.5);
    if (this.onGround && Math.abs(this.vx) > 8) { this.stepT += dt * Math.abs(this.vx) / 60; if (this.stepT > 0.5) { this.stepT = 0; AudioSys.sfx('step'); } }
    if (this.onGround && Math.abs(this.vx) < 5 && !Cut.active) this.idleT += dt; else this.idleT = 0;
    if (this.onGround && !this.inWater) this.lv.lastSafe = { x: this.x, y: this.y };
  }
  draw(g, cx, cy) {
    if (this.inv > 0 && Math.floor(this.inv * 15) % 2 === 0) return;
    const A = Spr.lia[this.anim] || Spr.lia.idle;
    const fps = { walk: 11, run: 14, climb: 6, swim: 4, interact: 8, program: 5, celebrate: 4 }[this.anim] || 8;
    const t = this.animClock || 0;
    let f;
    if (this.atk && Spr.lia[this.anim] && this.anim.startsWith('slash')) {
      // fotograma según el avance del tajo: preparación, golpe, seguimiento
      const k = this.atk.t / this.atk.def.dur;
      f = Math.min(A.length - 1, k < 0.12 ? 0 : k < 0.55 ? 1 : 2);
    } else if (this.anim === 'idle' || !Spr.lia[this.anim]) {
      // respiración lenta (ciclo de 2,4 s) + parpadeo ocasional
      const breath = (t % 2.4) > 1.3 ? 1 : 0;
      f = (this.blinkT < 0 ? 2 : 0) + breath;
    } else f = Math.floor(t * fps) % A.length;
    const fr = this.face > 0 ? A[f].r : A[f].l;
    const dx = Math.round(this.x + this.w / 2 - fr.width / 2 - cx), dy = Math.round(this.y + this.h - fr.height + 1 - cy);
    g.drawImage(fr, dx, dy);
    this.drawSaber(g, cx, cy);
    if (this.shieldOn || this.shieldArmed) {
      const r = 15, sx = this.cx - cx, sy = this.y + 10 - cy;
      if (this.shieldOn) { g.globalAlpha = 0.5 + Math.sin(this.lv.time * 20) * 0.2; pring(g, sx, sy, r, PAL.orange); pring(g, sx, sy, r - 1, PAL.sun); g.globalAlpha = 0.15; pcircle(g, sx, sy, r - 2, PAL.sun); g.globalAlpha = 1; }
      else { g.globalAlpha = 0.25; pring(g, sx, sy, r, PAL.orange); g.globalAlpha = 1; }
    }
  }
}

// =====================================================================
//  COMPAÑEROS
// =====================================================================
class PixCompanion {
  constructor(lv) { this.lv = lv; this.x = 0; this.y = 0; this.w = 12; this.h = 9; this.face = 1; this.t = 0; this.isPix = true; this.bonkT = 0; this.quipT = 12 + Math.random() * 10; this.target = null; this.hidden = false; this.override = null; }
  bonkChance() {
    if (this.bonkT > 0 || Cut.active || flag('pixQuiet') && !flag('pixHealed')) return;
    this.bonkT = 2.2; AudioSys.sfx('bonk');
    Particles.burst(this.x + 6, this.y + 4, 6, { color: PAL.sun, min: 20, max: 50, type: 'star' });
    Bark.say('pix', choice(['¡Eso fue completamente intencional!', 'Totalmente planeado. Estaba midiendo la pared.', '¡Intencional! 100% intencional.']));
  }
  update(dt) {
    this.t += dt; this.bonkT = Math.max(0, this.bonkT - dt);
    const p = this.lv.player;
    let tx, ty;
    if (this.override) { tx = this.override.x; ty = this.override.y; }
    else if (this.target && !this.target.dead) { tx = this.target.x + (this.target.w || 16) / 2 - 6; ty = this.target.y - 22; }
    else { tx = p.cx - 6 - p.face * 16; ty = p.y - 20; }
    const quiet = flag('pixQuiet') && !flag('pixHealed');
    const hover = Math.sin(this.t * (quiet ? 2 : 4)) * (quiet ? 1.5 : 3);
    if (this.bonkT > 1.7) { ty += 6; }
    this.x = lerp(this.x, tx, Math.min(1, dt * (quiet ? 3 : 5)));
    this.y = lerp(this.y, ty + hover, Math.min(1, dt * 5));
    // girar solo con un margen claro (evita que PÍX parpadee de lado a lado)
    const dx = tx - this.x; if (Math.abs(dx) > 4) this.face = dx > 0 ? 1 : -1; else if (Math.abs(dx) < 1.5 && Math.abs(p.vx) < 5) this.face = p.face;
    // comentarios espontáneos
    if (!Cut.active && !quiet) {
      this.quipT -= dt;
      if (this.quipT <= 0) { this.quipT = 18 + Math.random() * 16; const q = this.lv.def.quips; const text = typeof q === 'function' ? q(this.lv) : (q && q.length ? choice(q) : null); if (text) Bark.say('pix', text, 3); }
    }
    // señalar interactivos cuando Lía está quieta
    if (this.lv.player.idleT > 5 && !this.target && this.lv.def.pointAt) { const e = this.lv.get(this.lv.def.pointAt(this.lv)); if (e && !e.dead) this.target = e; }
    if (this.lv.player.idleT < 1) this.target = null;
  }
  draw(g, cx, cy) {
    if (this.hidden) return;
    const quiet = flag('pixQuiet') && !flag('pixHealed');
    const set = quiet ? Spr.pixQuiet : Spr.pix;
    const f = Math.floor(this.t * (quiet ? 10 : 18)) % 4;
    const fr = this.face > 0 ? set[f].r : set[f].l;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    g.drawImage(fr, x, y);
    if (flag('pixHealed') && Math.random() < 0.2) Particles.spawn({ x: this.x + 6, y: this.y + 10, vy: 10, life: 0.5, type: 'dot', color: hsl(Time.t * 200, 90, 70) });
    if (this.bonkT > 1.2) { for (let i = 0; i < 3; i++) { const a = this.t * 8 + i * 2.1; px(g, x + 7 + Math.cos(a) * 6, y - 2 + Math.sin(a) * 2, PAL.sun); } }
    if (this.lv.lensT > 0.5 && flag('pixFragment')) { drawText(g, 'fragmento_predictivo', x - 30, y - 10, PAL.pink); }
  }
}

class LumiCompanion {
  constructor(lv) { this.lv = lv; this.x = 0; this.y = 0; this.w = 7; this.h = 7; this.t = 0; this.mood = 'n'; this.moodT = 0; this.glow = 0.5; this.color = PAL.sun; this.stay = null; this.hidden = false; }
  update(dt) {
    this.t += dt; this.moodT = Math.max(0, this.moodT - dt); this.slashT = Math.max(0, (this.slashT || 0) - dt);
    const p = this.lv.player;
    if (this.moodT <= 0) this.mood = flag('lumiSad') ? 'sad' : this.lv.power >= 1 ? 'happy' : this.lv.darkness() > 0.45 ? 'fear' : 'n';
    let tx = p.cx + p.face * 10 - 3, ty = p.y + 2;
    if (this.stay) { tx = this.stay.x; ty = this.stay.y; }
    // flotación suave; con miedo se acerca a Lía y se estremece de vez en cuando (no todo el tiempo)
    const shiver = this.mood === 'fear' && (this.t % 3) < 0.35 ? Math.sin(this.t * 22) * 1 : 0;
    const bounce = this.mood === 'happy' ? -Math.abs(Math.sin(this.t * 3.2)) * 5 : this.mood === 'fear' ? Math.sin(this.t * 2) * 1 + shiver : Math.sin(this.t * 2.2) * 2;
    if (this.mood === 'fear' && !this.stay) { tx = p.cx + p.face * 6 - 3; ty = p.y + 4; }
    this.x = lerp(this.x, tx, Math.min(1, dt * 4));
    this.y = lerp(this.y, ty + bounce, Math.min(1, dt * 6));
    const e = p.energy / 100, c = p.cells / p.maxCells;
    const base = this.lv.power;
    this.glow = clamp(0.35 + base * 0.4 + e * 0.25, 0.2, 1.1);
    this.color = this.mood === 'fear' ? PAL.sky : this.mood === 'sad' ? '#7C86C8' : this.mood === 'happy' ? PAL.sun : c < 0.5 ? PAL.coral : PAL.sun;
    if (flag('lumiPrism')) this.color = hsl(this.t * 90, 90, 70);
    if (Math.random() < 0.15 * this.glow) Particles.spawn({ x: this.x + 3, y: this.y + 3, vx: rand(-6, 6), vy: rand(-12, -2), life: 0.6, type: 'dot', color: this.color });
  }
  draw(g, cx, cy) {
    if (this.hidden) return;
    const x = Math.round(this.x - cx), y = Math.round(this.y - cy);
    const shapeI = this.mood === 'fear' ? 1 : this.mood === 'happy' ? Math.floor(this.t * 2.5) % 2 * 2 : 0;
    g.globalAlpha = 0.25; pcircle(g, x + 3, y + 3, 5 + Math.round(this.glow * 3), this.color); g.globalAlpha = 1;
    // Lumi presta su luz al sable: destella con cada tajo
    if (this.slashT > 0) { g.globalAlpha = this.slashT / 0.3; pring(g, x + 3, y + 3, 6 + Math.round((0.3 - this.slashT) * 20), '#FFFFFF'); g.globalAlpha = 1; }
    drawLumiShape(g, x, y, Spr.lumi[shapeI], this.color, shade(this.color, -0.25), true, this.mood === 'happy' ? 'happy' : this.mood === 'sad' ? 'sleep' : 'n');
  }
}

// ---------- utilidades de nivel ----------
Level.prototype.gameOver = function () {
  const lv = this;
  lv.frozen = true;
  Cut.run(function* () {
    yield C.title('La red perdió estabilidad.', 'Recalculando ruta...', 2.4, PAL.coral);
    lv.respawn();
    lv.frozen = false;
    if (lv.rboss) yield* bossRetry(lv);
  });
};
Level.prototype.fellOut = function () {
  const p = this.player;
  const cp = this.checkpoints.find(c => c.active);
  const s = this.lastSafe && !this.lastSafeBad ? this.lastSafe : cp ? { x: cp.x + 3, y: cp.y - 4 } : this.spawn;
  p.x = s.x; p.y = s.y; p.vx = 0; p.vy = 0; p.inv = 1;
  p.cells = Math.max(1, p.cells - 1);
  this.snapCamera();
  Bark.say('pix', choice(['Técnicamente descendimos.', 'Bajada no planificada. Recalculando.', 'Eso fue una caída libre educativa.']));
};
Level.prototype.respawn = function () {
  const p = this.player;
  const cp = this.checkpoints.filter(c => c.active).pop();
  const s = cp ? { x: cp.x + 3, y: cp.y - 4 } : this.spawn;
  p.x = s.x; p.y = s.y; p.vx = p.vy = 0; p.cells = p.maxCells; p.inv = 1.5; p.energy = 100; p.atk = null; p.chargeT = 0;
  for (const e of this.entities) if (e instanceof Shot || e instanceof BossHazard) e.dead = true;
  this.snapCamera();
  Particles.burst(p.cx, p.y + 10, 20, { colors: [PAL.sun, PAL.teal], min: 20, max: 60 });
};
