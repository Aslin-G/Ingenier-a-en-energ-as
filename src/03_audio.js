// =====================================================================
//  AUDIO PROCEDURAL (Web Audio API): efectos, música por región, ambiente
// =====================================================================
const AudioSys = {
  ctx: null, master: null, sfxBus: null, musicBus: null, ambBus: null, noiseBuf: null,
  unlocked: false, song: null, nextStep: 0, stepIdx: 0, timer: null,
  intensity: 1, ambientNodes: null, ambientName: null, captions: [],
  unlock() {
    if (this.unlocked) { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      const c = this.ctx;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4;
      this.master = c.createGain(); this.master.gain.value = 0.8;
      this.master.connect(comp); comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.connect(this.master);
      this.musicBus = c.createGain(); this.musicBus.connect(this.master);
      this.ambBus = c.createGain(); this.ambBus.connect(this.master);
      const len = c.sampleRate * 2;
      this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.unlocked = true;
      this.applyVolumes();
      this.timer = setInterval(() => this.schedule(), 25);
      if (this.pendingSong) { const s = this.pendingSong; this.pendingSong = null; this.playSong(s); }
      if (this.pendingAmb) { const a = this.pendingAmb; this.pendingAmb = null; this.ambient(a); }
    } catch (e) { this.ctx = null; }
  },
  applyVolumes() {
    if (!this.ctx) return;
    const s = G.save.settings;
    this.sfxBus.gain.value = s.sfxVol;
    this.musicBus.gain.value = s.musicVol * 0.55;
    this.ambBus.gain.value = s.sfxVol * 0.5;
  },
  // ---------- primitivas ----------
  tone(o) {
    const c = this.ctx; if (!c) return;
    const t0 = (o.when || c.currentTime) + (o.delay || 0);
    const osc = c.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t0 + (o.slide || o.dur || 0.1));
    if (o.detune) osc.detune.value = o.detune;
    const g = c.createGain();
    const a = o.a || 0.005, dur = o.dur || 0.1, vol = o.vol == null ? 0.2 : o.vol, rel = o.r || 0.05;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.setValueAtTime(vol * (o.sus == null ? 1 : o.sus), t0 + a + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + rel);
    let node = osc;
    if (o.vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = o.vib; lg.gain.value = o.vibDepth || 4;
      l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + dur + rel + 0.05);
    }
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; f.Q.value = o.q || 1; node.connect(f); node = f; }
    node.connect(g); g.connect(o.bus || this.sfxBus);
    osc.start(t0); osc.stop(t0 + dur + rel + 0.05);
  },
  noise(o) {
    const c = this.ctx; if (!c) return;
    const t0 = (o.when || c.currentTime) + (o.delay || 0);
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = c.createBiquadFilter(); f.type = o.ft || 'lowpass'; f.frequency.setValueAtTime(o.ff || 2000, t0);
    if (o.ff2) f.frequency.exponentialRampToValueAtTime(o.ff2, t0 + (o.dur || 0.1));
    f.Q.value = o.q || 1;
    const g = c.createGain(); const vol = o.vol == null ? 0.2 : o.vol, dur = o.dur || 0.1;
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (o.a || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || this.sfxBus);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  },
  caption(text) {
    if (!G.save.settings.captions) return;
    this.captions.push({ text, t: 2.2 });
    if (this.captions.length > 3) this.captions.shift();
  },
  // ---------- efectos ----------
  sfx(name, p = 1) {
    if (!this.ctx) return;
    const T = (o) => this.tone(o), N = (o) => this.noise(o);
    switch (name) {
      case 'jump': T({ f: 280, f2: 620, dur: 0.12, type: 'square', vol: 0.09, lp: 3000 }); break;
      case 'land': N({ ff: 900, dur: 0.07, vol: 0.12 }); T({ f: 110, f2: 60, dur: 0.06, type: 'sine', vol: 0.12 }); break;
      case 'step': N({ ff: 1400, dur: 0.025, vol: 0.035 }); break;
      case 'click': T({ f: 880, dur: 0.03, type: 'square', vol: 0.06, lp: 4000 }); break;
      case 'hover': T({ f: 1320, dur: 0.02, type: 'triangle', vol: 0.035 }); break;
      case 'place': T({ f: 520, f2: 780, dur: 0.06, type: 'square', vol: 0.07, lp: 3000 }); break;
      case 'remove': T({ f: 600, f2: 300, dur: 0.07, type: 'square', vol: 0.06, lp: 2500 }); break;
      case 'confirm': [0, 4, 7].forEach((s, i) => T({ f: 523 * Math.pow(2, s / 12), dur: 0.08, type: 'square', vol: 0.07, delay: i * 0.05, lp: 3500 })); break;
      case 'error': T({ f: 220, f2: 140, dur: 0.18, type: 'sawtooth', vol: 0.08, lp: 1400 }); break;
      case 'ok': T({ f: 880, dur: 0.05, type: 'triangle', vol: 0.09 }); T({ f: 1320, dur: 0.08, type: 'triangle', vol: 0.09, delay: 0.05 }); break;
      case 'fail': T({ f: 330, f2: 180, dur: 0.22, type: 'square', vol: 0.08, lp: 1200 }); this.caption('[error]'); break;
      case 'tick': T({ f: 1200 + p * 40, dur: 0.02, type: 'square', vol: 0.04, lp: 5000 }); break;
      case 'bug': for (let i = 0; i < 4; i++) T({ f: rand(300, 900), dur: 0.03, type: 'square', vol: 0.05, delay: i * 0.035 }); this.caption('[glitch de bug]'); break;
      case 'debug': T({ f: 400, f2: 1600, dur: 0.18, type: 'triangle', vol: 0.08 }); N({ ff: 5000, ft: 'highpass', dur: 0.2, vol: 0.04 }); break;
      case 'charge': T({ f: 200, f2: 900, dur: 0.5, type: 'sawtooth', vol: 0.05, lp: 1800 }); this.caption('[batería cargando]'); break;
      case 'turbine': N({ ff: 400, ff2: 1600, ft: 'bandpass', q: 3, dur: 0.6, vol: 0.12 }); this.caption('[turbina]'); break;
      case 'win': [0, 4, 7, 12, 16].forEach((s, i) => T({ f: 523 * Math.pow(2, s / 12), dur: 0.12, type: i % 2 ? 'triangle' : 'square', vol: 0.08, delay: i * 0.08, lp: 4000 })); this.caption('[¡éxito!]'); break;
      case 'fanfare': [[0, 0], [4, .12], [7, .24], [12, .36], [7, .52], [12, .64], [16, .76]].forEach(([s, d]) => { T({ f: 392 * Math.pow(2, s / 12), dur: 0.16, type: 'square', vol: 0.07, delay: d, lp: 3000 }); T({ f: 196 * Math.pow(2, s / 12), dur: 0.16, type: 'triangle', vol: 0.08, delay: d }); }); this.caption('[fanfarria]'); break;
      case 'text': T({ f: p, dur: 0.018, type: 'square', vol: 0.025, lp: 3000 }); break;
      case 'dash': N({ ff: 3000, ff2: 400, ft: 'bandpass', dur: 0.18, vol: 0.12 }); T({ f: 700, f2: 200, dur: 0.12, type: 'sawtooth', vol: 0.04, lp: 2000 }); break;
      case 'shield': T({ f: 660, dur: 0.2, type: 'sine', vol: 0.1, vib: 18, vibDepth: 30 }); this.caption('[escudo]'); break;
      case 'portal': T({ f: 300, f2: 1200, dur: 0.35, type: 'triangle', vol: 0.09, vib: 12, vibDepth: 40 }); this.caption('[portal]'); break;
      case 'seed': T({ f: 1047, dur: 0.05, type: 'square', vol: 0.05, lp: 5000 }); T({ f: 1568, dur: 0.07, type: 'square', vol: 0.05, delay: 0.05, lp: 5000 }); break;
      case 'chispa': [0, 7, 12, 19, 24].forEach((s, i) => T({ f: 880 * Math.pow(2, s / 12), dur: 0.1, type: 'triangle', vol: 0.06, delay: i * 0.06 })); this.caption('[chispa de Aurora]'); break;
      case 'hurt': T({ f: 400, f2: 120, dur: 0.2, type: 'square', vol: 0.1, lp: 1600 }); N({ ff: 1200, dur: 0.12, vol: 0.08 }); this.caption('[daño]'); break;
      case 'checkpoint': [0, 5, 9, 12].forEach((s, i) => T({ f: 659 * Math.pow(2, s / 12), dur: 0.1, type: 'triangle', vol: 0.08, delay: i * 0.07 })); this.caption('[punto de control]'); break;
      case 'door': T({ f: 150, f2: 90, dur: 0.35, type: 'sawtooth', vol: 0.06, lp: 600 }); N({ ff: 500, dur: 0.3, vol: 0.06 }); this.caption('[compuerta]'); break;
      case 'splash': N({ ff: 2500, ff2: 500, dur: 0.3, vol: 0.14 }); this.caption('[agua]'); break;
      case 'wind': N({ ff: 600, ff2: 1500, ft: 'bandpass', q: 1.5, dur: 0.7, vol: 0.12, a: 0.2 }); this.caption('[viento]'); break;
      case 'run': T({ f: 440, dur: 0.06, type: 'square', vol: 0.06 }); T({ f: 660, dur: 0.1, type: 'square', vol: 0.06, delay: 0.06 }); break;
      case 'swap': T({ f: 700, f2: 500, dur: 0.05, type: 'triangle', vol: 0.07 }); T({ f: 500, f2: 700, dur: 0.05, type: 'triangle', vol: 0.07, delay: 0.05 }); break;
      case 'loop': T({ f: 660 + p * 30, dur: 0.05, type: 'triangle', vol: 0.06 }); break;
      case 'pz': T({ f: 1046.5, dur: 0.6, type: 'sine', vol: 0.06 }); T({ f: 523.25, dur: 0.6, type: 'sine', vol: 0.05 }); break;
      case 'eclipse': for (let i = 0; i < 6; i++) T({ f: [392, 466, 349, 523][i % 4], dur: 0.05, type: 'square', vol: 0.04, delay: i * 0.05, lp: 1500 }); N({ ff: 3000, ft: 'bandpass', dur: 0.3, vol: 0.05 }); this.caption('[interferencia violeta]'); break;
      case 'aurora': [0, 4, 7, 11, 9].forEach((s, i) => T({ f: 523 * Math.pow(2, s / 12), dur: 0.25, type: 'sine', vol: 0.06, delay: i * 0.12 })); this.caption('[tono de AURORA]'); break;
      case 'restore': [0, 4, 7, 11, 14, 19].forEach((s, i) => { T({ f: 392 * Math.pow(2, s / 12), dur: 0.3, type: 'triangle', vol: 0.07, delay: i * 0.09 }); }); N({ ff: 6000, ft: 'highpass', dur: 0.8, vol: 0.03, a: 0.3 }); this.caption('[la isla recupera energía]'); break;
      case 'pix': T({ f: 1800, f2: 2600, dur: 0.05, type: 'sine', vol: 0.05 }); T({ f: 2400, f2: 1900, dur: 0.05, type: 'sine', vol: 0.05, delay: 0.06 }); break;
      case 'bonk': T({ f: 300, f2: 90, dur: 0.12, type: 'square', vol: 0.09, lp: 1500 }); this.caption('[¡bonk!]'); break;
      case 'lumi': T({ f: 880, f2: 1320, dur: 0.12, type: 'sine', vol: 0.05, vib: 8, vibDepth: 20 }); break;
      case 'boom': N({ ff: 800, ff2: 80, dur: 0.6, vol: 0.2 }); T({ f: 90, f2: 30, dur: 0.5, type: 'sine', vol: 0.2 }); this.caption('[estallido de luz]'); break;
      case 'powerdown': T({ f: 600, f2: 50, dur: 0.9, type: 'sawtooth', vol: 0.06, lp: 1200 }); this.caption('[apagón]'); break;
      case 'crowd': for (let i = 0; i < 12; i++) N({ ff: rand(800, 3000), ft: 'bandpass', q: 4, dur: 0.08, vol: 0.05, delay: rand(0, 0.8) }); this.caption('[aplausos]'); break;
      case 'spark': T({ f: rand(1500, 2500), dur: 0.02, type: 'square', vol: 0.03 }); break;
      case 'select': T({ f: 740, dur: 0.04, type: 'square', vol: 0.05, lp: 3500 }); break;
      case 'steam': N({ ff: 5000, ft: 'highpass', dur: 0.4, vol: 0.08, a: 0.05 }); break;
      // ---- combate: sable de luz ----
      case 'slash': N({ ff: 5200 + p * 400, ff2: 900, ft: 'bandpass', q: 2, dur: 0.13, vol: 0.1 }); T({ f: 420 + p * 60, f2: 880 + p * 90, dur: 0.09, type: 'sawtooth', vol: 0.035, lp: 2600 }); break;
      case 'hitE': T({ f: 190, f2: 70, dur: 0.1, type: 'square', vol: 0.1, lp: 1800 }); N({ ff: 2600, ff2: 600, dur: 0.08, vol: 0.1 }); T({ f: 1500, dur: 0.03, type: 'square', vol: 0.04, delay: 0.02 }); break;
      case 'crit': T({ f: 1318, dur: 0.06, type: 'triangle', vol: 0.08 }); T({ f: 1975, dur: 0.1, type: 'triangle', vol: 0.07, delay: 0.05 }); N({ ff: 3000, ff2: 500, dur: 0.12, vol: 0.1 }); break;
      case 'clang': T({ f: 1760, dur: 0.14, type: 'triangle', vol: 0.07 }); T({ f: 2637, dur: 0.1, type: 'sine', vol: 0.04 }); N({ ff: 6000, ft: 'highpass', dur: 0.06, vol: 0.05 }); this.caption('[clang]'); break;
      case 'parry': [0, 7, 12].forEach((s, i) => T({ f: 988 * Math.pow(2, s / 12), dur: 0.09, type: 'triangle', vol: 0.08, delay: i * 0.03 })); N({ ff: 8000, ft: 'highpass', dur: 0.12, vol: 0.06 }); this.caption('[¡parada perfecta!]'); break;
      case 'chargeUp': T({ f: 220 + p * 400, dur: 0.05, type: 'triangle', vol: 0.03 }); break;
      case 'pulse': T({ f: 1200, f2: 160, dur: 0.35, type: 'sawtooth', vol: 0.07, lp: 3000 }); N({ ff: 4000, ff2: 300, dur: 0.35, vol: 0.12 }); this.caption('[pulso de luz]'); break;
      case 'heal': [0, 4, 7, 12].forEach((s, i) => T({ f: 784 * Math.pow(2, s / 12), dur: 0.08, type: 'sine', vol: 0.07, delay: i * 0.05 })); this.caption('[energía recuperada]'); break;
      case 'shot': T({ f: 900, f2: 500, dur: 0.08, type: 'square', vol: 0.045, lp: 3000 }); break;
      case 'roar': T({ f: 110, f2: 55, dur: 0.7, type: 'sawtooth', vol: 0.09, lp: 700, vib: 9, vibDepth: 12 }); N({ ff: 700, ff2: 200, dur: 0.7, vol: 0.1, a: 0.08 }); this.caption('[rugido del jefe]'); break;
      case 'stun': for (let i = 0; i < 5; i++) T({ f: 1400 - i * 150, dur: 0.05, type: 'square', vol: 0.045, delay: i * 0.05, lp: 3500 }); this.caption('[jefe aturdido]'); break;
      case 'bossDown': N({ ff: 1200, ff2: 60, dur: 1.2, vol: 0.2 }); T({ f: 220, f2: 40, dur: 1.1, type: 'sawtooth', vol: 0.08, lp: 900 }); [0, 4, 7, 12].forEach((s, i) => T({ f: 523 * Math.pow(2, s / 12), dur: 0.2, type: 'triangle', vol: 0.07, delay: 0.9 + i * 0.1 })); this.caption('[jefe depurado]'); break;
      case 'defeat': [0, -3, -7, -12].forEach((s, i) => T({ f: 392 * Math.pow(2, s / 12), dur: 0.32, type: 'triangle', vol: 0.08, delay: i * 0.22 })); T({ f: 70, f2: 35, dur: 0.9, type: 'sine', vol: 0.16, delay: 0.1 }); this.caption('[Lía sin energía]'); break;
      case 'warn': T({ f: 880, dur: 0.07, type: 'square', vol: 0.05, lp: 2500 }); T({ f: 880, dur: 0.07, type: 'square', vol: 0.05, delay: 0.12, lp: 2500 }); break;
    }
  },
  // ---------- música ----------
  playSong(name) {
    if (!this.ctx) { this.pendingSong = name; return; }
    if (this.song && this.song.name === name) return;
    const def = SONGS[name];
    if (!def) { this.song = null; return; }
    this.song = buildSong(name, def);
    this.stepIdx = 0; this.nextStep = this.ctx.currentTime + 0.08;
  },
  stopSong() { this.song = null; this.pendingSong = null; },
  schedule() {
    if (!this.ctx || !this.song) return;
    const s = this.song, c = this.ctx;
    const stepDur = 60 / s.bpm / 4;
    while (this.nextStep < c.currentTime + 0.12) {
      this.playStep(s, this.stepIdx, this.nextStep, stepDur);
      this.nextStep += stepDur * (s.swing && this.stepIdx % 2 === 0 ? 1 + s.swing : s.swing && this.stepIdx % 2 === 1 ? 1 - s.swing : 1);
      this.stepIdx = (this.stepIdx + 1) % (s.bars * 16);
    }
  },
  playStep(s, idx, when, sd) {
    const bar = Math.floor(idx / 16), st = idx % 16;
    const I = this.intensity;
    const bus = this.musicBus;
    const jit = () => s.human ? rand(-0.012, 0.012) : 0;
    const chord = s.chords[bar % s.chords.length];
    const nf = (deg, oct) => midiF(s.root + scaleNote(s.scale, deg) + 12 * oct);
    // pad (al inicio de cada compás)
    if (st === 0 && s.pad) chord.forEach(d => this.tone({ when, f: nf(d, 0), dur: sd * 15, a: 0.3, r: 0.4, type: s.pad, vol: 0.022, lp: 1400, bus, detune: rand(-6, 6) }));
    // bajo
    const b = s.bass[bar % s.bass.length][st];
    if (b !== '.' && b !== undefined) this.tone({ when: when + jit(), f: nf(chord[+b] - 7 * 0, -1), dur: sd * 1.6, type: s.bassType || 'triangle', vol: 0.11, lp: 900, bus });
    // arpegio
    if (I > 0.3 && s.arp) {
      const a = s.arp[st];
      if (a !== '.') this.tone({ when: when + jit(), f: nf(chord[+a % chord.length] + (+a >= chord.length ? 7 : 0), 1), dur: sd * 0.9, type: s.arpType || 'square', vol: 0.03, lp: s.arpLp || 3000, bus });
    }
    // melodía
    if (I > 0.55 && s.lead) {
      const n = s.lead[idx];
      if (n != null) this.tone({ when: when + jit(), f: nf(n.d, 1), dur: sd * n.l * 0.95, type: s.leadType || 'triangle', vol: 0.05, vib: 5, vibDepth: 3, a: 0.01, bus, lp: 4000 });
    }
    // batería
    if (I > 0.72 && s.drums) {
      const k = s.drums.k[st], sn = s.drums.s[st], h = s.drums.h[st];
      if (k === 'x') this.tone({ when, f: 140, f2: 45, slide: 0.12, dur: 0.12, type: 'sine', vol: 0.16, bus });
      if (sn === 'x') this.noise({ when, ff: s.organic ? 900 : 2500, ft: s.organic ? 'lowpass' : 'bandpass', dur: 0.1, vol: 0.06, bus });
      if (sn === 'o') this.tone({ when, f: 220, f2: 120, dur: 0.1, type: 'sine', vol: 0.1, bus });
      if (h === 'x') this.noise({ when, ff: 7000, ft: 'highpass', dur: 0.03, vol: 0.025, bus });
      if (h === 'w') this.tone({ when, f: 1400, dur: 0.02, type: 'square', vol: 0.02, bus, lp: 3000 });
    }
  },
  // ---------- ambiente ----------
  ambient(name) {
    if (!this.ctx) { this.pendingAmb = name; return; }
    if (this.ambientName === name) return;
    this.ambientName = name;
    const c = this.ctx;
    if (this.ambientNodes) {
      const old = this.ambientNodes;
      old.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.4);
      setTimeout(() => { try { old.src.stop(); old.lfo && old.lfo.stop(); } catch (_) { } }, 2000);
      this.ambientNodes = null;
    }
    if (!name || name === 'none') return;
    const cfg = { wind: { ft: 'bandpass', f: 700, q: 0.8, v: 0.12, lfo: 0.15, depth: 400 }, water: { ft: 'lowpass', f: 700, q: 0.5, v: 0.14, lfo: 0.3, depth: 150 }, sea: { ft: 'lowpass', f: 500, q: 0.4, v: 0.16, lfo: 0.08, depth: 300 }, rain: { ft: 'highpass', f: 2500, q: 0.3, v: 0.08, lfo: 0.5, depth: 300 }, cave: { ft: 'lowpass', f: 220, q: 2, v: 0.14, lfo: 0.05, depth: 60 }, forest: { ft: 'bandpass', f: 3000, q: 2, v: 0.03, lfo: 2, depth: 800 }, city: { ft: 'lowpass', f: 180, q: 1, v: 0.1, lfo: 0.1, depth: 40 }, hum: { ft: 'bandpass', f: 120, q: 8, v: 0.1, lfo: 0.2, depth: 20 } }[name];
    if (!cfg) return;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = cfg.ft; f.frequency.value = cfg.f; f.Q.value = cfg.q;
    const g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(cfg.v, c.currentTime, 0.8);
    const lfo = c.createOscillator(); lfo.frequency.value = cfg.lfo; const lg = c.createGain(); lg.gain.value = cfg.depth;
    lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    src.connect(f); f.connect(g); g.connect(this.ambBus); src.start();
    this.ambientNodes = { src, g, lfo };
  }
};

function midiF(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function scaleNote(scale, deg) {
  const n = scale.length; const o = Math.floor(deg / n); const i = ((deg % n) + n) % n;
  return scale[i] + 12 * o;
}

const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], mixo: [0, 2, 4, 5, 7, 9, 10], penta: [0, 2, 4, 7, 9, 12, 14], pentm: [0, 3, 5, 7, 10, 12, 15]
};
// Motivo de AURORA (grados de escala): lo comparten Eclipse, Perfect Zero y Prisma
const AURORA_MOTIF = [0, 2, 4, 6, 5];

// Canciones: la melodía se genera con una semilla (misma pieza cada vez)
const SONGS = {
  title: { bpm: 112, root: 60, scale: 'major', prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bass: ['0...0...2...0.1.'], arp: '0.1.2.1.0.1.2.1.', drums: 'pop', lead: 'bright', seed: 7, arpType: 'square', leadType: 'square', pad: 'triangle' },
  festival: { bpm: 122, root: 62, scale: 'major', prog: [[0, 2, 4], [3, 5, 0], [4, 6, 1], [0, 2, 4]], bass: ['0.0.2.0.0.0.2.1.'], arp: '0120012001200120', drums: 'pop', lead: 'bright', seed: 3, pad: 'triangle', leadType: 'square' },
  puerto: { bpm: 92, root: 57, scale: 'dorian', prog: [[0, 2, 4], [3, 5, 0], [0, 2, 4], [4, 6, 1]], bass: ['0.......2.......', '0.......1...2...'], arp: '0..1..2..1..0..2', drums: 'soft', lead: 'calm', seed: 11, pad: 'sine', arpType: 'triangle' },
  valle: { bpm: 104, root: 64, scale: 'penta', prog: [[0, 2, 3], [1, 3, 4], [0, 2, 3], [4, 1, 2]], bass: ['0...2...0...2...'], arp: '0.2.1.2.0.2.1.2.', drums: 'folk', lead: 'flute', seed: 21, arpType: 'triangle', leadType: 'sine', swing: 0.12 },
  solaria: { bpm: 118, root: 65, scale: 'lydian', prog: [[0, 2, 4, 6], [1, 3, 5], [0, 2, 4, 6], [4, 6, 1]], bass: ['0..0..2.0..0..1.'], arp: '0123012301230123', drums: 'pop', lead: 'bright', seed: 33, arpType: 'triangle', leadType: 'square', arpLp: 6000 },
  aeris: { bpm: 96, root: 62, scale: 'major', prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bass: ['0.....2.....0...'], arp: '0120120120120120', drums: 'soft', lead: 'flute', seed: 41, arpType: 'sine', leadType: 'triangle' },
  hydria: { bpm: 88, root: 60, scale: 'major', prog: [[0, 2, 4], [5, 0, 2], [1, 3, 5], [4, 6, 1]], bass: ['0.......0...2...'], arp: '0.2.4.2.0.2.4.2.', drums: 'water', lead: 'calm', seed: 55, arpType: 'sine', leadType: 'sine', pad: 'sine' },
  bioloop: { bpm: 108, root: 57, scale: 'dorian', prog: [[0, 2, 4], [3, 5, 0], [6, 1, 3], [0, 2, 4]], bass: ['0..0..2...0.1...'], arp: '0.1.0.2.0.1.0.2.', drums: 'organic', lead: 'flute', seed: 61, arpType: 'triangle', leadType: 'triangle', organic: true },
  gea: { bpm: 76, root: 52, scale: 'minor', prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bass: ['0...............', '0.......2.......'], arp: '0...2...1...2...', drums: 'cave', lead: 'calm', seed: 71, pad: 'sawtooth', arpType: 'sine', leadType: 'sine' },
  h2: { bpm: 114, root: 62, scale: 'mixo', prog: [[0, 2, 4], [6, 1, 3], [3, 5, 0], [0, 2, 4]], bass: ['0.0.0.0.2.2.0.0.'], arp: '0120012001200120', drums: 'pulse', lead: 'bright', seed: 81, bassType: 'square', arpType: 'square', arpLp: 1800 },
  bateria: { bpm: 100, root: 57, scale: 'minor', prog: [[0, 2, 4], [5, 0, 2], [2, 4, 6], [6, 1, 3]], bass: ['0.0.0.0.0.0.0.0.'], arp: '0121012101210121', drums: 'synth', lead: 'synth', seed: 91, bassType: 'sawtooth', arpType: 'sawtooth', leadType: 'square', arpLp: 1500, pad: 'sawtooth' },
  prisma: { bpm: 110, root: 60, scale: 'lydian', prog: [[0, 2, 4], [1, 3, 5], [4, 6, 1], [0, 2, 4]], bass: ['0..0..2.0.1.2...'], arp: '0123210101232101', drums: 'pop', lead: 'motif', seed: 101, human: true, arpType: 'triangle', leadType: 'triangle' },
  mystery: { bpm: 80, root: 55, scale: 'minor', prog: [[0, 2, 4], [5, 0, 2], [0, 2, 4], [4, 6, 1]], bass: ['0...............'], arp: '0...1...2...1...', drums: null, lead: 'motif', seed: 111, pad: 'sine', arpType: 'sine', leadType: 'sine' },
  eclipse: { bpm: 86, root: 55, scale: 'minor', prog: [[0, 2, 4], [6, 1, 3]], bass: ['0.......0.......'], arp: '0.2.1.2.0.2.1.2.', drums: 'soft', lead: 'motif', seed: 121, arpType: 'square', leadType: 'square', arpLp: 1200 },
  perfect: { bpm: 120, root: 60, scale: 'major', prog: [[0, 2, 4]], bass: ['0...0...0...0...'], arp: '0.0.0.0.0.0.0.0.', drums: 'rigid', lead: 'motifRigid', seed: 1, arpType: 'sine', leadType: 'sine', pad: 'sine' },
  boss: { bpm: 132, root: 57, scale: 'minor', prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bass: ['0.0.0.0.2.2.1.1.'], arp: '0120012001200120', drums: 'synth', lead: 'motif', seed: 131, bassType: 'square', arpType: 'square', leadType: 'square' },
  map: { bpm: 90, root: 60, scale: 'major', prog: [[0, 2, 4], [3, 5, 0], [5, 0, 2], [4, 6, 1]], bass: ['0.......2.......'], arp: '0.1.2.4.2.1.0.1.', drums: 'soft', lead: 'calm', seed: 141, arpType: 'triangle', leadType: 'triangle' },
  sad: { bpm: 68, root: 57, scale: 'minor', prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], bass: ['0...............'], arp: '0.......2.......', drums: null, lead: 'calm', seed: 151, pad: 'sine', arpType: 'sine', leadType: 'sine' },
  ending: { bpm: 116, root: 62, scale: 'major', prog: [[0, 2, 4], [4, 6, 1], [5, 0, 2], [3, 5, 0]], bass: ['0.0.2.0.0.0.2.1.'], arp: '0120012001200120', drums: 'pop', lead: 'motifWarm', seed: 161, pad: 'triangle', leadType: 'square', human: true }
};

const DRUMS = {
  pop: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' },
  soft: { k: 'x.......x.......', s: '........o.......', h: '....x.......x...' },
  folk: { k: 'x.....x...x.....', s: '....o.......o...', h: 'w.w.w.w.w.w.w.w.' },
  water: { k: 'x.........x.....', s: '......o.......o.', h: '..w.......w.....' },
  organic: { k: 'x..x..x...x.x...', s: '...o..o....o..o.', h: 'w.w.ww.ww.w.w.ww' },
  cave: { k: 'x...............', s: '........o.......', h: '................' },
  pulse: { k: 'x...x...x...x...', s: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' },
  synth: { k: 'x...x...x...x.x.', s: '....x.......x...', h: '..x...x...x...x.' },
  rigid: { k: 'x...x...x...x...', s: '................', h: 'x.x.x.x.x.x.x.x.' }
};

function buildSong(name, d) {
  const rng = mulberry32(d.seed || 1);
  const bars = 8;
  const s = { name, bpm: d.bpm, root: d.root, scale: SCALES[d.scale] || SCALES.major, bars, human: !!d.human, swing: d.swing || 0 };
  s.chords = []; for (let b = 0; b < bars; b++) s.chords.push(d.prog[b % d.prog.length]);
  s.bass = d.bass; s.arp = d.arp; s.drums = d.drums ? DRUMS[d.drums] : null; s.organic = d.organic;
  s.pad = d.pad; s.bassType = d.bassType; s.arpType = d.arpType; s.leadType = d.leadType; s.arpLp = d.arpLp;
  // melodía
  const lead = new Array(bars * 16).fill(null);
  const style = d.lead;
  const motif = style && style.startsWith('motif');
  const phrase = [];
  for (let b = 0; b < 4; b++) {
    const ch = s.chords[b];
    let pos = 0;
    while (pos < 16) {
      let len = style === 'calm' || style === 'flute' ? choice([4, 4, 2, 6, 8]) : choice([2, 2, 4, 1, 2, 3]);
      if (style === 'motifRigid') len = 4;
      if (pos + len > 16) len = 16 - pos;
      const strong = pos % 4 === 0;
      let deg;
      if (motif) deg = AURORA_MOTIF[Math.floor((b * 16 + pos) / 4) % AURORA_MOTIF.length] + (style === 'motifWarm' && b % 2 ? 2 : 0);
      else deg = strong ? ch[Math.floor(rng() * ch.length)] : ch[0] + Math.floor(rng() * 5) - 2;
      const rest = !motif && rng() < (style === 'calm' ? 0.35 : 0.18);
      phrase.push({ i: b * 16 + pos, d: rest ? null : deg, l: len });
      pos += len;
    }
  }
  for (const n of phrase) {
    if (n.d == null) continue;
    lead[n.i] = { d: n.d, l: n.l };
    // repetición con variación en la segunda mitad
    const v = style === 'motifRigid' ? 0 : (rng() < 0.3 ? (rng() < 0.5 ? 1 : -1) : 0);
    lead[n.i + 64] = { d: n.d + v, l: n.l };
  }
  s.lead = style ? lead : null;
  return s;
}
