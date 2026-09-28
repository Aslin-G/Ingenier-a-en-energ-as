// =====================================================================
//  CODELAB: editor de bloques + intérprete paso a paso + depuración
// =====================================================================
const BLOCK_CAT = {
  act: { color: '#30E1C5', dark: '#135A52', name: 'acción' },
  if: { color: '#FF9D42', dark: '#6A3A10', name: 'decisión' },
  repeat: { color: '#59C7FF', dark: '#1A4A7A', name: 'bucle' },
  while: { color: '#59C7FF', dark: '#1A4A7A', name: 'bucle' },
  foreach: { color: '#7FE7FF', dark: '#1A5A6A', name: 'recorrido' },
  set: { color: '#B6F35B', dark: '#3A5A10', name: 'variable' },
  add: { color: '#B6F35B', dark: '#3A5A10', name: 'acumulador' },
  call: { color: '#C9A2FF', dark: '#4A2A7A', name: 'función' },
  ret: { color: '#C9A2FF', dark: '#4A2A7A', name: 'retorno' },
  blank: { color: '#8C93B8', dark: '#2A3060', name: 'hueco' }
};
const OPS = ['>', '<', '>=', '<=', '==', '!='];
const OP_TXT = { '>': '>', '<': '<', '>=': '≥', '<=': '≤', '==': '=', '!=': '≠' };

// ---------- utilidades del modelo ----------
function cloneProg(p) { return JSON.parse(JSON.stringify(p || [])); }
function hasBody(b) { return ['if', 'repeat', 'while', 'foreach'].includes(b.op); }
function countBlocks(list) { let n = 0; for (const b of list) { n++; if (b.body) n += countBlocks(b.body); if (b.else) n += countBlocks(b.else); } return n; }
function getList(root, path) { // path: [] => root ; [i,'body'] => root[i].body ; ...
  let l = root;
  for (let k = 0; k < path.length; k += 2) l = l[path[k]][path[k + 1]];
  return l;
}
function getBlock(root, path) { const l = getList(root, path.slice(0, -1)); return l[path[path.length - 1]]; }
function pathKey(p) { return p.join('.'); }
function exprText(e) {
  if (e == null) return '?';
  if (typeof e === 'number') return String(Math.round(e * 100) / 100);
  if (typeof e === 'string') return e;
  if (e.bin) return exprText(e.a) + ' ' + e.bin + ' ' + exprText(e.b);
  return '?';
}
function condText(c) {
  if (!c) return '?';
  let s = exprText(c.l) + ' ' + OP_TXT[c.op] + ' ' + exprText(c.r);
  if (c.join && c.c2) s += ' ' + c.join + ' ' + condText(c.c2);
  return s;
}
function blockText(b, fns) {
  switch (b.op) {
    case 'act': return b.name + (b.arg != null ? '(' + exprText(b.arg) + ')' : '');
    case 'if': return 'SI ' + condText(b.cond) + ' ENTONCES';
    case 'repeat': return 'REPETIR ' + exprText(b.n) + ' VECES';
    case 'while': return 'MIENTRAS ' + condText(b.cond) + ' HACER';
    case 'foreach': return 'PARA CADA ' + b.var + ' EN ' + b.list;
    case 'set': return b.var + ' ← ' + exprText(b.expr);
    case 'add': return b.var + ' ← ' + b.var + ' + ' + exprText(b.expr);
    case 'call': return (b.into ? b.into + ' ← ' : '') + 'LLAMAR ' + b.fn + '(' + (b.args || []).map(exprText).join(', ') + ')';
    case 'ret': return 'DEVOLVER ' + exprText(b.expr);
    case 'blank': return '▢ ' + (b.hint || '???');
  }
  return '?';
}
function progToText(list, depth = 0) {
  let out = [];
  const ind = '  '.repeat(depth);
  for (const b of list) {
    out.push(ind + blockText(b));
    if (b.body) out = out.concat(progToText(b.body, depth + 1));
    if (b.op === 'if' && b.else) { out.push(ind + 'SINO'); out = out.concat(progToText(b.else, depth + 1)); }
    if (hasBody(b)) out.push(ind + { if: 'FIN SI', repeat: 'FIN REPETIR', while: 'FIN MIENTRAS', foreach: 'FIN PARA' }[b.op]);
  }
  return out;
}

// ---------- Plantillas de la paleta ----------
// Cada puzzle declara su paleta con cadenas: 'act:avanzar', 'if', 'ifelse', 'repeat', 'while', 'foreach', 'set:x', 'add:x', 'call:f', 'ret'
function makeFromTemplate(tpl, cfg) {
  const [kind, name] = tpl.split(':');
  const d = cfg.defaults || {};
  switch (kind) {
    case 'act': { const a = (cfg.actions || {})[name] || {}; return { op: 'act', name, arg: a.arg != null ? a.arg : undefined }; }
    case 'if': return { op: 'if', cond: JSON.parse(JSON.stringify(d.cond || { l: (cfg.sensors || ['x'])[0], op: '>', r: 0 })), body: [], else: null };
    case 'ifelse': return { op: 'if', cond: JSON.parse(JSON.stringify(d.cond || { l: (cfg.sensors || ['x'])[0], op: '>', r: 0 })), body: [], else: [] };
    case 'repeat': return { op: 'repeat', n: d.n || 3, body: [] };
    case 'while': return { op: 'while', cond: JSON.parse(JSON.stringify(d.wcond || d.cond || { l: (cfg.sensors || ['x'])[0], op: '<', r: 10 })), body: [] };
    case 'foreach': return { op: 'foreach', var: d.itemVar || 'item', list: name || d.list || 'lista', body: [] };
    case 'set': return { op: 'set', var: name, expr: d.setExpr != null ? d.setExpr : 0 };
    case 'add': return { op: 'add', var: name, expr: d.addExpr != null ? d.addExpr : 1 };
    case 'call': { const f = (cfg.functions || {})[name]; return { op: 'call', fn: name, args: f ? f.params.map(p => (f.defaults || {})[p] != null ? f.defaults[p] : 0) : [], into: f && f.returns ? f.returns : undefined }; }
    case 'ret': return { op: 'ret', expr: d.retExpr || 0 };
  }
  return { op: 'blank' };
}
function templateLabel(tpl, cfg) {
  const [kind, name] = tpl.split(':');
  switch (kind) {
    case 'act': { const a = (cfg.actions || {})[name] || {}; return a.label || name; }
    case 'if': return 'SI ... ENTONCES';
    case 'ifelse': return 'SI ... SINO';
    case 'repeat': return 'REPETIR n VECES';
    case 'while': return 'MIENTRAS ...';
    case 'foreach': return 'PARA CADA';
    case 'set': return name + ' ← valor';
    case 'add': return name + ' ← ' + name + ' + ...';
    case 'call': return 'LLAMAR ' + name + '()';
    case 'ret': return 'DEVOLVER';
  }
  return tpl;
}
function templateCat(tpl) { const k = tpl.split(':')[0]; return k === 'ifelse' ? 'if' : k; }

// ---------- Intérprete (generadores) ----------
class ReturnSignal { constructor(v) { this.value = v; } }
class ExecError { constructor(path, msg, kind) { this.path = path; this.msg = msg; this.kind = kind || 'error'; } }

function evalExpr(e, env) {
  if (e == null) return 0;
  if (typeof e === 'number') return e;
  if (typeof e === 'string') {
    if (e in env.vars) return env.vars[e];
    if (env.sensors && e in env.sensors) return env.sensors[e](env.st, env);
    if (e === 'VERDADERO') return true;
    if (!isNaN(parseFloat(e))) return parseFloat(e);
    if (env.literals && env.literals.has(e)) return e;
    throw new ExecError(env.curPath, `La variable "${e}" no existe todavía. ¿Olvidaste darle un valor (←)?`, 'undefined');
  }
  if (e.bin) {
    const a = evalExpr(e.a, env), b = evalExpr(e.b, env);
    switch (e.bin) { case '+': return a + b; case '-': return a - b; case '*': return a * b; case '/': return b === 0 ? 0 : a / b; }
  }
  return 0;
}
function evalCond(c, env) {
  const a = evalExpr(c.l, env), b = evalExpr(c.r, env);
  let v;
  const A = typeof a === 'string' ? a : a, B = typeof b === 'string' ? b : b;
  switch (c.op) { case '>': v = A > B; break; case '<': v = A < B; break; case '>=': v = A >= B; break; case '<=': v = A <= B; break; case '==': v = A == B; break; case '!=': v = A != B; break; }
  if (env.inverted) v = !v; // efecto de SHADOW IF en algunos retos
  if (c.join && c.c2) { const v2 = evalCond(c.c2, env); v = c.join === 'Y' ? v && v2 : v || v2; }
  return v;
}
function fmtVal(v) { if (typeof v === 'number') return String(Math.round(v * 100) / 100); if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO'; if (v && v.name) return v.name; return String(v); }

function* execList(list, env, path, fnName) {
  for (let i = 0; i < list.length; i++) yield* execStmt(list[i], env, path.concat(i), fnName);
}
function* execStmt(b, env, path, fnName) {
  env.curPath = path; env.curFn = fnName || null;
  env.steps++;
  if (env.steps > env.maxSteps) throw new ExecError(path, 'Demasiados pasos: el programa parece no terminar nunca.', 'infinite');
  yield { t: 'line', path, fn: fnName, b };
  switch (b.op) {
    case 'blank': throw new ExecError(path, 'Hay un hueco ▢ sin completar: tócalo y elige qué instrucción va ahí.', 'blank');
    case 'act': {
      const arg = b.arg != null ? evalExpr(b.arg, env) : undefined;
      const r = env.world.act(b.name, arg, env.st, env) || { ok: true };
      env.trace.push({ path, fn: fnName, ok: r.ok !== false, text: b.name + (arg != null ? '(' + fmtVal(arg) + ')' : ''), msg: r.msg });
      yield { t: 'act', path, r, dur: r.dur == null ? 0.35 : r.dur };
      if (r.ok === false) throw new ExecError(path, r.msg || 'La acción falló.', r.kind || 'act');
      if (r.stop) throw new ExecError(path, r.msg, 'stop');
      break;
    }
    case 'if': {
      const v = evalCond(b.cond, env);
      env.trace.push({ path, fn: fnName, ok: true, text: condText(b.cond) + ' → ' + (v ? 'VERDADERO' : 'FALSO'), cond: v });
      yield { t: 'cond', path, v, text: condText(b.cond) };
      if (v) yield* execList(b.body, env, path.concat('body'), fnName);
      else if (b.else) yield* execList(b.else, env, path.concat('else'), fnName);
      break;
    }
    case 'repeat': {
      const n = Math.max(0, Math.floor(evalExpr(b.n, env)));
      for (let k = 0; k < n; k++) {
        env.iter[pathKey(path)] = { k: k + 1, n };
        env.trace.push({ path, fn: fnName, ok: true, text: 'iteración ' + (k + 1) + ' de ' + n });
        yield { t: 'iter', path, k: k + 1, n };
        yield* execList(b.body, env, path.concat('body'), fnName);
      }
      delete env.iter[pathKey(path)];
      break;
    }
    case 'while': {
      let k = 0;
      while (true) {
        const v = evalCond(b.cond, env);
        yield { t: 'cond', path, v, text: condText(b.cond) };
        if (!v) break;
        k++;
        if (k > (env.loopLimit || 40)) throw new ExecError(path, `¡LOOPLING! Este MIENTRAS lleva ${k - 1} vueltas y su condición sigue VERDADERA. ¿Qué cambia dentro del bucle para que algún día sea FALSA?`, 'infinite');
        env.iter[pathKey(path)] = { k, n: '?' };
        env.trace.push({ path, fn: fnName, ok: true, text: 'vuelta ' + k + ': ' + condText(b.cond) + ' VERDADERO' });
        yield { t: 'iter', path, k, n: '?' };
        yield* execList(b.body, env, path.concat('body'), fnName);
      }
      delete env.iter[pathKey(path)];
      env.trace.push({ path, fn: fnName, ok: true, text: 'condición FALSA → salir del bucle' });
      break;
    }
    case 'foreach': {
      const list = env.lists[b.list];
      if (!list) throw new ExecError(path, `No existe la lista "${b.list}".`);
      for (let k = 0; k < list.length; k++) {
        env.vars[b.var] = list[k]; env.vars['i'] = k;
        env.iter[pathKey(path)] = { k: k + 1, n: list.length, idx: k, list: b.list };
        env.trace.push({ path, fn: fnName, ok: true, text: `${b.var} ← ${b.list}[${k}] = ${fmtVal(list[k])}` });
        yield { t: 'iter', path, k: k + 1, n: list.length, idx: k };
        yield* execList(b.body, env, path.concat('body'), fnName);
      }
      delete env.iter[pathKey(path)];
      break;
    }
    case 'set': case 'add': {
      const v = evalExpr(b.expr, env);
      const old = env.vars[b.var];
      if (b.op === 'add' && old === undefined) throw new ExecError(path, `"${b.var}" no tiene valor inicial. Un acumulador debe empezar en algo (por ejemplo ${b.var} ← 0).`, 'undefined');
      env.vars[b.var] = b.op === 'set' ? v : old + v;
      env.changed[b.var] = 1;
      env.trace.push({ path, fn: fnName, ok: true, text: b.var + ' = ' + fmtVal(env.vars[b.var]) });
      if (env.world.onVar) env.world.onVar(b.var, env.vars[b.var], env.st, env);
      yield { t: 'var', path, name: b.var };
      break;
    }
    case 'call': {
      const f = env.functions[b.fn];
      if (!f) throw new ExecError(path, `La función "${b.fn}" no está definida. Constrúyela primero en la Forja.`, 'call');
      if (!f.body.length) throw new ExecError(path, `"${b.fn}" existe pero está vacía: no hace nada.`, 'call');
      const args = (b.args || []).map(a => evalExpr(a, env));
      const saved = env.vars;
      const local = Object.assign({}, env.globals || {});
      f.params.forEach((p, i) => local[p] = args[i]);
      env.trace.push({ path, fn: fnName, ok: true, text: 'LLAMAR ' + b.fn + '(' + args.map(fmtVal).join(', ') + ')' });
      yield { t: 'call', path, fn: b.fn, args };
      env.vars = local; env.callDepth++;
      if (env.callDepth > 6) throw new ExecError(path, 'Demasiadas llamadas anidadas.', 'call');
      let ret;
      try { yield* execList(f.body, env, ['fn', b.fn], b.fn); }
      catch (e) { if (e instanceof ReturnSignal) ret = e.value; else { env.vars = saved; env.callDepth--; throw e; } }
      env.vars = saved; env.callDepth--;
      env.curFn = fnName;
      if (b.into) { env.vars[b.into] = ret; env.changed[b.into] = 1; }
      if (env.world.onCall) env.world.onCall(b.fn, args, ret, env.st, env);
      env.trace.push({ path, fn: fnName, ok: true, text: b.fn + ' devolvió ' + (ret === undefined ? '(nada)' : fmtVal(ret)) });
      yield { t: 'return', path, fn: b.fn, value: ret };
      if (b.into && ret === undefined && f.returns) throw new ExecError(path, `"${b.fn}" terminó sin DEVOLVER un valor.`, 'call');
      break;
    }
    case 'ret': {
      const v = evalExpr(b.expr, env);
      yield { t: 'var', path, name: '↩' };
      throw new ReturnSignal(v);
    }
  }
}

// ---------- Escena del CodeLab ----------
const SPEEDS = [{ n: 'LENTO', line: 0.7 }, { n: 'NORMAL', line: 0.32 }, { n: 'RÁPIDO', line: 0.12 }, { n: 'TURBO', line: 0.03 }];

class CodeLabScene {
  constructor(cfg, done) {
    this.cfg = cfg; this.done = done; this.opaque = true;
    this.stageIdx = 0;
    this.stages = cfg.stages || [{ mode: 'solo' }];
    this.functions = {};
    for (const k in (cfg.functions || {})) { const f = cfg.functions[k]; this.functions[k] = { params: f.params.slice(), body: cloneProg(f.body || []), returns: f.returns, locked: f.locked }; }
    this.tab = 'main';
    this.world = cfg.world;
    this.loadStage();
    this.speed = 1; this.state = 'edit'; this.exec = null; this.popup = null; this.sel = null; this.scroll = 0;
    this.hintLevel = 0; this.attempts = 0; this.fails = 0; this.runs = 0; this.firstTry = true;
    this.msg = cfg.intro || '¡Construye el algoritmo y pulsa EJECUTAR!'; this.msgColor = PAL.cream; this.msgWho = 'pix';
    this.panelTab = 'vars'; this.breakpoints = new Set(); this.view = 'code';
    this.t = 0; this.highlight = null; this.resultShown = false; this.confidence = null;
    UI.nav = true; UI.focus = null;
    AudioSys.playSong(cfg.music || 'mystery');
    this.prevSong = null;
  }
  loadStage() {
    const st = this.stages[this.stageIdx];
    this.mode = st.mode;
    const base = st.program || (this.stageIdx === 0 ? this.cfg.start : null) || [];
    this.prog = cloneProg(base);
    if (st.functions) for (const k in st.functions) this.functions[k].body = cloneProg(st.functions[k]);
    if (st.text) { this.msg = st.text; this.msgWho = st.who || 'pix'; }
    this.locked = st.mode === 'demo';
    this.world = st.world || this.cfg.world;
    this.resetWorld();
  }
  get curList() { return this.tab === 'main' ? this.prog : this.functions[this.tab].body; }
  resetWorld() {
    this.st = this.world.init ? this.world.init(this.cfg) : {};
    this.env = null; this.highlight = null;
  }
  // ---------- ejecución ----------
  startRun(stepMode) {
    if (this.state === 'running' || this.state === 'paused') { if (stepMode) { this.stepOnce = true; this.state = 'running'; } return; }
    // confianza (metacognición)
    if (!stepMode && this.cfg.confidence !== false && G.save.settings.confidence && this.confidence == null && this.mode !== 'demo' && (G.save.stats.runs % 4 === 1 || this.cfg.askConfidence)) {
      this.popup = { title: '¿Qué tan segura/o estás de que funcionará?', options: [{ label: 'Poco: estoy probando', value: 0 }, { label: 'Algo', value: 1 }, { label: 'Mucho: seguro que sí', value: 2 }], onPick: v => { this.confidence = v; this.startRun(false); }, x: 150, y: 90, w: 190 };
      return;
    }
    this.resetWorld();
    this.runs++; G.save.stats.runs++;
    const env = {
      world: this.world, st: this.st, vars: Object.assign({}, this.cfg.vars || {}), sensors: this.world.sensors || {},
      lists: this.world.lists ? this.world.lists(this.st) : {}, functions: this.functions, trace: [], iter: {}, changed: {},
      steps: 0, maxSteps: this.cfg.maxSteps || 600, loopLimit: this.cfg.loopLimit || 40, callDepth: 0, inverted: this.cfg.inverted
    };
    env.globals = {}; env.prog = this.prog;
    env.literals = new Set((this.cfg.condRight || []).concat(this.cfg.literals || []).filter(v => typeof v === 'string' && !(this.cfg.varNames || []).includes(v) && !(v in (this.world.sensors || {})) && !(v in (this.cfg.vars || {}))));
    this.env = env;
    this.tick = 0; this.ticks = this.cfg.ticks || 1;
    if (this.world.beforeRun) this.world.beforeRun(this.st, env);
    this.newGen();
    this.state = 'running'; this.wait = 0.25; this.stepMode = stepMode; this.stepOnce = false;
    this.msg = stepMode ? 'Modo PASO A PASO: pulsa PASO para avanzar cada línea.' : 'Ejecutando...'; this.msgColor = PAL.cream;
    AudioSys.sfx('run');
    this.panelTab = this.cfg.showTrace ? 'traza' : this.panelTab;
  }
  newGen() {
    const self = this;
    if (this.world.onTick) this.world.onTick(this.st, this.tick, this.env);
    this.gen = (function* () { yield* execList(self.prog, self.env, [], null); })();
  }
  stopRun(msg) {
    this.state = 'edit'; this.gen = null;
    if (msg) { this.msg = msg; this.msgColor = PAL.cream; }
  }
  stepExec(dt) {
    if (this.state !== 'running') return;
    if (this.wait > 0) { this.wait -= dt; if (this.world.update) this.world.update(this.st, dt, this.env); return; }
    if (this.stepMode && !this.stepOnce) { this.state = 'paused'; return; }
    this.stepOnce = false;
    let r;
    try { r = this.gen.next(); }
    catch (e) {
      if (e instanceof ExecError) return this.fail(e);
      if (e instanceof ReturnSignal) r = { done: true };
      else { console.error(e); return this.fail(new ExecError(null, 'Error interno: ' + e.message)); }
    }
    if (r.done) {
      this.tick++;
      if (this.world.afterTick) { const res = this.world.afterTick(this.st, this.tick - 1, this.env); if (res && res.fail) return this.fail(new ExecError(null, res.fail, res.kind)); }
      if (this.tick < this.ticks) { this.newGen(); this.wait = this.cfg.tickPause != null ? this.cfg.tickPause * SPEEDS[this.speed].line / 0.32 : SPEEDS[this.speed].line; return; }
      return this.finish();
    }
    const ev = r.value;
    const sp = SPEEDS[this.speed].line;
    this.highlight = { path: ev.path, fn: ev.fn, t: ev.t, v: ev.v };
    if (ev.fn && this.tab !== ev.fn && this.functions[ev.fn]) this.tab = ev.fn;
    if (!ev.fn && this.tab !== 'main' && ev.t === 'line') this.tab = 'main';
    switch (ev.t) {
      case 'line': this.wait = sp * 0.5; AudioSys.sfx('tick', Math.min(20, this.env.steps % 12)); if (this.breakpoints.has(this.bpKey(ev.path, ev.fn)) && !this.stepMode) { this.state = 'paused'; this.stepMode = true; this.msg = '● Punto de interrupción: revisa las variables. Pulsa PASO o EJECUTAR.'; this.msgColor = PAL.coral; } break;
      case 'act': this.wait = Math.max(sp, ev.dur * sp / 0.32); break;
      case 'cond': this.wait = sp; this.condBubble = { text: ev.text, v: ev.v, t: 1.2 }; AudioSys.sfx(ev.v ? 'ok' : 'select'); break;
      case 'iter': this.wait = sp * 0.6; AudioSys.sfx('loop', ev.k); break;
      case 'var': this.wait = sp * 0.6; break;
      case 'call': this.wait = sp * 1.2; this.callAnim = { fn: ev.fn, t: 0.8, dir: 1 }; AudioSys.sfx('portal'); break;
      case 'return': this.wait = sp * 1.2; this.callAnim = { fn: ev.fn, t: 0.8, dir: -1, value: ev.value }; AudioSys.sfx('confirm'); break;
    }
    if (this.speed === 3) this.wait = Math.min(this.wait, 0.03);
  }
  bpKey(path, fn) { return (fn || 'main') + ':' + pathKey(path); }
  fail(err) {
    this.state = 'error'; this.gen = null; this.fails++; this.firstTry = false; G.save.stats.fails++;
    if (err.kind === 'infinite') { G.save.stats.infiniteLoops++; this.sawInfinite = true; }
    this.errPath = err.path; this.errFn = this.env.curFn;
    AudioSys.sfx('fail'); FX.shake(2, 0.2);
    const why = this.cfg.explain && this.cfg.explain(err, this.st, this.env);
    this.msg = '✗ ' + err.msg + (why ? ' ' + why : '');
    this.msgColor = PAL.coral; this.msgWho = 'pix';
    this.panelTab = 'traza';
    // confianza alta + error: explicación más profunda y nueva representación
    if (this.confidence === 2 && this.cfg.deep) {
      G.save.stats.confHighWrong++;
      this.deepT = 1;
      this.msg += ' ' + this.cfg.deep;
      this.view = 'flow';
    }
    this.confidence = null;
    addMastery(this.cfg.concepts || [], -1);
    if (this.fails === 2 && this.hintLevel === 0) this.msg += ' (Pulsa PISTA si quieres ayuda.)';
    if (this.fails >= 3 && this.cfg.simplify && !this.simplified) { this.simplified = true; this.cfg.simplify(this); this.msg += ' He quitado algunos bloques que despistaban.'; }
  }
  finish() {
    const res = this.world.check ? this.world.check(this.st, this.env) : { ok: true };
    if (!res.ok) return this.fail(new ExecError(null, res.msg || 'El objetivo no se cumplió.', 'goal'));
    this.state = 'success'; this.highlight = null;
    if ((this.mode === 'demo' || this.mode === 'guided') && this.stageIdx < this.stages.length - 1) {
      AudioSys.sfx('win');
      this.msg = res.msg || '¡Funciona!'; this.msgColor = PAL.lime;
      this.stageDone = true;
      return;
    }
    AudioSys.sfx('win');
    this.msg = '✓ ' + (res.msg || '¡Algoritmo correcto!'); this.msgColor = PAL.lime;
    if (this.confidence === 0) { this.msg += ' Dudaste, pero razonaste bien.'; achieve('humble'); }
    this.confidence = null;
    this.result = { success: true, firstTry: this.firstTry && this.hintLevel === 0, hints: this.hintLevel, attempts: this.runs, fails: this.fails, stars: res.stars || (this.fails === 0 ? 3 : this.fails < 3 ? 2 : 1), sawInfinite: !!this.sawInfinite, program: cloneProg(this.prog), st: this.st, extra: res.extra };
    for (let i = 0; i < 30; i++) Particles.spawn({ x: rand(290, 476), y: rand(20, 150), vx: rand(-40, 40), vy: rand(-60, -10), grav: 60, life: rand(0.8, 1.6), type: 'star', color: choice([PAL.sun, PAL.lime, PAL.teal, PAL.pink]), screen: true });
  }
  nextStage() {
    this.stageIdx++; this.stageDone = false; this.state = 'edit'; this.loadStage(); this.env = null;
    AudioSys.sfx('confirm');
  }
  exit(result) {
    UI.nav = false; UI.cancelHeld(); Scenes.pop();
    const r = result || { success: false, hints: this.hintLevel, attempts: this.runs, fails: this.fails };
    if (r.success) {
      G.save.stats.puzzles++;
      if (r.firstTry) { G.save.stats.firstTry++; if (this.cfg.main) achieve('no_hints'); }
      const gain = r.firstTry ? 14 : r.hints >= 2 ? 6 : 10;
      addMastery(this.cfg.concepts || [], gain);
      if (!r.firstTry) addMastery('debugging', 3);
      addXP(this.cfg.xp || (this.cfg.main ? 40 : 25), this.cfg.title);
      G.save.lastProgram = { title: this.cfg.title, text: progToText(r.program) };
      Save.write();
    }
    this.done(r);
  }
  // ---------- pistas ----------
  hint() {
    const H = this.cfg.hints || [];
    if (this.hintLevel >= H.length) { this.msg = 'No quedan más pistas. ¡Tú puedes! Revisa la traza y las variables.'; return; }
    const h = H[this.hintLevel]; this.hintLevel++; G.save.stats.hints++;
    this.firstTry = false;
    const text = typeof h === 'string' ? h : h.text;
    this.msg = '★ PISTA ' + this.hintLevel + ': ' + text; this.msgColor = PAL.sun; this.msgWho = this.cfg.hintWho || 'pix';
    if (h.highlight) this.hintHighlight = { what: h.highlight, t: 6 };
    if (h.partial) { this.prog = cloneProg(h.partial); this.msg += ' (He colocado una parte de la solución.)'; }
    if (h.partialFn) { for (const k in h.partialFn) this.functions[k].body = cloneProg(h.partialFn[k]); }
    AudioSys.sfx('confirm');
  }
  // ---------- actualización ----------
  update(dt) {
    this.t += dt;
    if (this.condBubble) { this.condBubble.t -= dt; if (this.condBubble.t <= 0) this.condBubble = null; }
    if (this.callAnim) { this.callAnim.t -= dt; if (this.callAnim.t <= 0) this.callAnim = null; }
    if (this.hintHighlight) { this.hintHighlight.t -= dt; if (this.hintHighlight.t <= 0) this.hintHighlight = null; }
    if (this.world.update && this.state !== 'running') this.world.update(this.st, dt, this.env);
    if (this.state === 'running') for (let i = 0; i < 4 && this.state === 'running'; i++) { this.stepExec(i === 0 ? dt : 0); if (this.wait > 0) break; }
    // atajos
    if (!this.popup) {
      if (Input.hit('hint')) this.hint();
      if (Input.hit('blueprint')) this.view = this.view === 'code' ? 'flow' : 'code';
      if (Input.codeHit('KeyR') && this.state === 'edit') this.startRun(false);
      if (Input.hit('del') && this.sel && this.state === 'edit' && UI.held == null) this.deleteSel();
      if (Input.hit('pause') && UI.held == null) { Input.consume(); this.askExit(); }
    } else if (Input.hit('back')) { this.popup = null; UI.scope = null; Input.consume(); }
    // soltar bloques
    let d;
    while ((d = UI.anyDrop())) this.handleDrop(d);
  }
  askExit() {
    if (this.result) { this.exit(this.result); return; }
    this.popup = { title: '¿Salir del CodeLab?', options: [{ label: 'Seguir intentando', value: 0 }, { label: 'Salir (podrás volver)', value: 1 }], onPick: v => { if (v === 1) this.exit(null); }, x: 160, y: 100, w: 160 };
  }
  handleDrop(d) {
    if (this.state !== 'edit' && this.state !== 'error' && this.state !== 'success') return;
    if (this.locked) { this.msg = 'Este es un ejemplo: obsérvalo y pulsa EJECUTAR.'; return; }
    if (this.state !== 'edit') { this.state = 'edit'; this.resetWorld(); }
    if (!d.target) return;
    const p = d.payload;
    const tgt = d.target;
    if (tgt === 'trash') {
      if (p.move) { this.removeAt(p.move); AudioSys.sfx('remove'); }
      return;
    }
    let tg = tgt;
    if (tg.startsWith('line:')) {
      // soltar sobre una línea = colocar justo debajo de ella
      const path = tg.split(':')[2].split('.').map(x => isNaN(+x) ? x : +x);
      tg = 'slot:' + pathKey(path.slice(0, -1)) + ':' + (path[path.length - 1] + 1);
    }
    if (tg.startsWith('slot:')) {
      const [, key, idxS] = tg.split(':');
      const listPath = key === '' ? [] : key.split('.').map(x => isNaN(+x) ? x : +x);
      const idx = +idxS;
      let block;
      if (p.tpl) {
        if (this.cfg.maxBlocks && countBlocks(this.curList) >= this.cfg.maxBlocks) { this.msg = 'Máximo ' + this.cfg.maxBlocks + ' bloques. ¿Puedes hacerlo más corto (con un bucle)?'; AudioSys.sfx('error'); return; }
        block = makeFromTemplate(p.tpl, this.cfg);
      } else if (p.move) {
        // mover: no permitir mover un bloque dentro de sí mismo
        const mk = pathKey(p.move);
        if (pathKey(listPath).startsWith(mk)) return;
        block = getBlock(this.curList, p.move);
        if (block.locked) return;
        const srcList = getList(this.curList, p.move.slice(0, -1));
        const srcIdx = p.move[p.move.length - 1];
        const sameList = pathKey(p.move.slice(0, -1)) === pathKey(listPath);
        srcList.splice(srcIdx, 1);
        const target = getList(this.curList, listPath);
        target.splice(sameList && srcIdx < idx ? idx - 1 : idx, 0, block);
        AudioSys.sfx('place'); this.sel = null; return;
      }
      const target = getList(this.curList, listPath);
      target.splice(idx, 0, block);
      AudioSys.sfx('place');
      this.sel = listPath.concat(idx);
    } else if (tgt.startsWith('blank:')) {
      const path = tgt.slice(6).split('.').map(x => isNaN(+x) ? x : +x);
      if (!p.tpl) return;
      const list = getList(this.curList, path.slice(0, -1));
      list[path[path.length - 1]] = makeFromTemplate(p.tpl, this.cfg);
      AudioSys.sfx('place');
    }
  }
  removeAt(path) {
    const b = getBlock(this.curList, path);
    if (!b || b.locked) { this.msg = 'Esa línea está fija en este reto.'; return; }
    getList(this.curList, path.slice(0, -1)).splice(path[path.length - 1], 1);
    this.sel = null;
  }
  deleteSel() { if (this.sel) { this.removeAt(this.sel); AudioSys.sfx('remove'); } }
  // ---------- líneas de visualización ----------
  buildLines(list, depth = 0, path = []) {
    let out = [];
    out.push({ kind: 'slot', listPath: path, idx: 0, depth });
    list.forEach((b, i) => {
      const p = path.concat(i);
      out.push({ kind: 'head', b, path: p, depth });
      if (hasBody(b)) {
        out = out.concat(this.buildLines(b.body, depth + 1, p.concat('body')));
        if (b.op === 'if' && b.else) { out.push({ kind: 'else', b, path: p, depth }); out = out.concat(this.buildLines(b.else, depth + 1, p.concat('else'))); }
        out.push({ kind: 'end', b, path: p, depth });
      }
      out.push({ kind: 'slot', listPath: path, idx: i + 1, depth });
    });
    return out;
  }
  // ---------- dibujo ----------
  draw(g) {
    const cfg = this.cfg;
    vGradient(g, 0, 0, W, H, [[0, '#141A3A'], [1, '#0B1020']], false);
    for (let y = 0; y < H; y += 8) rect(g, 0, y, W, 1, 'rgba(48,225,197,0.04)');
    // cabecera
    rect(g, 0, 0, W, 16, '#0B1020'); rect(g, 0, 16, W, 1, '#2A3570');
    drawText(g, 'CODELAB', 6, 5, PAL.teal);
    drawText(g, cfg.title, 52, 5, PAL.cream);
    let cx = W - 6;
    for (const c of (cfg.tags || []).slice().reverse()) {
      const w = textW(c) + 8; cx -= w;
      rect(g, cx, 3, w, 11, c.match(/SOLAR|EÓLICA|HIDRO|BIOMASA|GEOTERMIA|HIDRÓGENO|ALMACEN|MICRORED|ENERG/) ? '#2A5A1A' : '#1A3A5A');
      drawText(g, c, cx + 4, 5, PAL.cream); cx -= 3;
    }
    if (this.stages.length > 1) { const lbl = ['YO TE MUESTRO', 'LO HACEMOS JUNTOS', 'LO HACES TÚ'][Math.min(2, this.stageIdx)]; const st = this.stages[this.stageIdx]; drawText(g, (st.label || lbl) + ' (' + (this.stageIdx + 1) + '/' + this.stages.length + ')', cx - 6, 5, PAL.sun, { align: 'right' }); }
    this.drawPalette(g);
    if (this.view === 'code') this.drawCode(g); else this.drawFlow(g);
    this.drawWorld(g);
    this.drawPanel(g);
    this.drawBottom(g);
    if (UI.dragging != null) this.drawDragGhost(g);
    if (this.popup) this.drawPopup(g);
    Particles.draw(g, 0, 0, true);
    UI.drawTooltip(g);
  }
  // ---------- edición sencilla (sin arrastrar) ----------
  // Tocar un bloque de la izquierda lo AÑADE debajo de la línea marcada (o al final).
  canEdit() { return !this.locked && this.state !== 'running' && this.state !== 'paused'; }
  touchEdit() { if (this.state !== 'edit') { this.state = 'edit'; this.resetWorld(); } }
  addBlock(tpl) {
    if (!this.canEdit()) { if (this.locked) this.msg = 'Este es un ejemplo: obsérvalo y pulsa EJECUTAR.'; return; }
    if (this.cfg.maxBlocks && countBlocks(this.curList) >= this.cfg.maxBlocks) { this.msg = 'Máximo ' + this.cfg.maxBlocks + ' bloques. Borra uno con ✗ o reutiliza los que tienes.'; AudioSys.sfx('error'); return; }
    this.touchEdit();
    const block = makeFromTemplate(tpl, this.cfg);
    const sel = this.sel && getBlock(this.curList, this.sel) ? this.sel : null;
    let list = this.curList, idx = list.length, path = [list.length];
    if (sel) {
      const cur = getBlock(this.curList, sel);
      if (cur.op === 'blank') { Object.keys(cur).forEach(k => delete cur[k]); Object.assign(cur, block); this.sel = sel; this.flashLine(sel); AudioSys.sfx('place'); return; }
      if (hasBody(cur) && !cur.body.length) { list = cur.body; idx = 0; path = sel.concat('body', 0); }
      else { list = getList(this.curList, sel.slice(0, -1)); idx = sel[sel.length - 1] + 1; path = sel.slice(0, -1).concat(idx); }
    }
    list.splice(idx, 0, block);
    this.sel = path; this.flashLine(path);
    AudioSys.sfx('place');
  }
  flashLine(path) { this.flash = { key: this.tab + ':' + pathKey(path), t: 0.7 }; }
  // ▲ / ▼: la línea sube o baja UNA fila del programa; al cruzar un SI/REPETIR/MIENTRAS entra o sale de él
  moveLine(path, dir) {
    if (!this.canEdit()) return;
    const root = this.curList, lp = path.slice(0, -1), list = getList(root, lp), i = path[path.length - 1], b = list[i];
    if (!b || b.locked) { this.msg = 'Esa línea está fija en este reto.'; return; }
    this.touchEdit();
    let np = null;
    const into = t => t.op === 'if' && t.else ? 'else' : 'body';
    if (dir < 0) {
      if (i > 0) {
        const prev = list[i - 1];
        if (hasBody(prev) && !prev.locked) { list.splice(i, 1); const k = into(prev); prev[k].push(b); np = lp.concat(i - 1, k, prev[k].length - 1); }
        else { list[i] = prev; list[i - 1] = b; np = lp.concat(i - 1); }
      } else if (lp.length) {
        const key = lp[lp.length - 1], op = lp.slice(0, -1), owner = getBlock(root, op);
        list.splice(0, 1);
        if (key === 'else') { owner.body.push(b); np = op.concat('body', owner.body.length - 1); }
        else { const ol = getList(root, op.slice(0, -1)), oi = op[op.length - 1]; ol.splice(oi, 0, b); np = op.slice(0, -1).concat(oi); }
      }
    } else {
      if (i < list.length - 1) {
        const next = list[i + 1];
        if (hasBody(next) && !next.locked) { list.splice(i, 1); next.body.unshift(b); np = lp.concat(i, 'body', 0); }
        else { list[i] = next; list[i + 1] = b; np = lp.concat(i + 1); }
      } else if (lp.length) {
        const key = lp[lp.length - 1], op = lp.slice(0, -1), owner = getBlock(root, op);
        list.splice(i, 1);
        if (key === 'body' && owner.op === 'if' && owner.else) { owner.else.unshift(b); np = op.concat('else', 0); }
        else { const ol = getList(root, op.slice(0, -1)), oi = op[op.length - 1]; ol.splice(oi + 1, 0, b); np = op.slice(0, -1).concat(oi + 1); }
      }
    }
    if (!np) { AudioSys.sfx('error'); return; }
    this.sel = np; this.flashLine(np); AudioSys.sfx('swap');
  }
  drawPalette(g) {
    const x = 4, y = 20, w = 92;
    panel(g, x, y, w, 204, { border: '#2A3570' });
    drawText(g, 'BLOQUES', x + 6, y + 5, PAL.sun);
    const pal = this.cfg.palette || [];
    let yy = y + 17;
    const can = this.canEdit();
    pal.forEach(tpl => {
      if (this.hiddenTpl && this.hiddenTpl.includes(tpl)) return;
      const cat = BLOCK_CAT[templateCat(tpl)] || BLOCK_CAT.act;
      const label = templateLabel(tpl, this.cfg);
      const id = 'pal:' + tpl;
      const st = UI.register(id, x + 4, yy, w - 8, 13, {});
      const hl = this.hintHighlight && this.hintHighlight.what === 'palette:' + tpl && Math.floor(this.t * 4) % 2;
      rect(g, x + 4, yy, w - 8, 13, st.pressed ? shade(cat.color, 0.2) : st.hover || st.focus ? shade(cat.dark, 0.25) : cat.dark);
      rect(g, x + 4, yy, 3, 13, cat.color);
      if (hl) strokeRect(g, x + 3, yy - 1, w - 6, 15, PAL.sun);
      drawText(g, fitText(label, w - 22), x + 10, yy + 3, can ? PAL.cream : '#8C93B8');
      if (can) drawText(g, '+', x + w - 9, yy + 3, cat.color);
      if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, x + 4, yy, w - 8, 13);
      const actDesc = tpl.startsWith('act:') && this.cfg.actions && this.cfg.actions[tpl.slice(4)] && this.cfg.actions[tpl.slice(4)].desc;
      if (st.hover) UI.tooltip = (this.cfg.tips && this.cfg.tips[tpl]) || actDesc || (cat.name[0].toUpperCase() + cat.name.slice(1) + ': ' + label);
      if (UI.clicked(id)) this.addBlock(tpl);
      yy += 15;
    });
    // leyenda de controles (en lugar de la papelera)
    if (!this.locked) {
      const lines = [['Toca un bloque:', 0], ['se añade bajo', 0], ['la línea marcada', 0], ['', 0], ['▲ ▼  mover', 1], ['−  +  números', 1], ['✗  borrar', 1], ['toca un valor', 0], ['para cambiarlo', 0]];
      const ly = Math.max(yy + 6, 221 - lines.length * 9);
      rect(g, x + 4, ly - 3, w - 8, lines.length * 9 + 4, '#10162B');
      lines.forEach(([t, k], i) => drawText(g, fitText(t, w - 14), x + 7, ly + i * 9, k ? PAL.sun : '#8C93B8'));
    }
  }
  drawCode(g) {
    const x = 100, y = 20, w = 190, h = 204;
    panel(g, x, y, w, h, { border: '#2A3570', bg: 'rgba(8,12,28,0.95)' });
    // pestañas de funciones
    let ty = y + 4;
    const fnNames = Object.keys(this.functions);
    if (fnNames.length) {
      let tx = x + 4;
      for (const t of ['main'].concat(fnNames)) {
        const label = t === 'main' ? 'PRINCIPAL' : 'f: ' + t;
        const tw = textW(label) + 10;
        const on = this.tab === t;
        if (UI.btn(g, 'tab:' + t, tx, ty, tw, 12, label, { color: t === 'main' ? PAL.teal : PAL.violet, bg: on ? '#2A3570' : '#10162B' })) { this.tab = t; this.sel = null; this.scroll = 0; }
        tx += tw + 3;
      }
      ty += 15;
      if (this.tab !== 'main') { const f = this.functions[this.tab]; drawText(g, 'FUNCIÓN ' + this.tab + '(' + f.params.join(', ') + ')', x + 6, ty, PAL.lilac); ty += 11; }
    } else drawText(g, 'PROGRAMA', x + 6, ty + 1, PAL.sun), ty += 11;
    const lines = this.buildLines(this.curList).filter(l => l.kind !== 'slot');
    const editable = this.canEdit();
    const LH = 12;
    const areaTop = ty + 1, areaBot = y + h - 16; // fila inferior: ayuda de la línea marcada
    const maxLines = Math.floor((areaBot - areaTop) / LH);
    if (this.sel && !getBlock(this.curList, this.sel)) this.sel = null;
    // mantener visible la línea activa o la marcada
    const focusKey = this.highlight && this.state === 'running' ? pathKey(this.highlight.path) : this.sel && this.selMoved ? pathKey(this.sel) : null;
    if (focusKey != null) { const hi = lines.findIndex(l => l.kind === 'head' && pathKey(l.path) === focusKey); if (hi >= 0) { if (hi - this.scroll >= maxLines - 1) this.scroll = hi - maxLines + 2; if (hi < this.scroll) this.scroll = hi; } }
    this.selMoved = false;
    if (Input.pointer.wheel && inRect(Input.pointer.x, Input.pointer.y, { x, y, w, h })) this.scroll += Input.pointer.wheel;
    this.scroll = clamp(this.scroll, 0, Math.max(0, lines.length - maxLines));
    let lineNo = 0;
    const nums = new Map(); lines.forEach(l => { lineNo++; nums.set(l, lineNo); });
    // tocar el fondo vacío quita la marca
    const bgId = 'codebg:' + this.tab;
    UI.register(bgId, x + 2, areaTop, w - 4, areaBot - areaTop, { nav: false });
    if (UI.clicked(bgId)) this.sel = null;
    let yy = areaTop;
    let selRow = null;
    lines.slice(this.scroll, this.scroll + maxLines).forEach(l => {
      const ind = x + 20 + l.depth * 9;
      const b = l.b, cat = BLOCK_CAT[b.op] || BLOCK_CAT.act;
      const n = nums.get(l);
      const active = this.highlight && l.kind === 'head' && pathKey(this.highlight.path) === pathKey(l.path) && (this.highlight.fn || 'main') === this.tab;
      const isErr = this.state === 'error' && this.errPath && l.kind === 'head' && pathKey(this.errPath) === pathKey(l.path) && (this.errFn || 'main') === this.tab;
      const selected = this.sel && l.kind === 'head' && pathKey(this.sel) === pathKey(l.path);
      const flashing = this.flash && this.flash.t > 0 && l.kind === 'head' && this.flash.key === this.tab + ':' + pathKey(l.path);
      // gutter: número de línea + punto de interrupción
      const bpk = this.bpKey(l.path, this.tab === 'main' ? null : this.tab);
      if (l.kind === 'head') {
        const gst = UI.register('bp:' + bpk, x + 2, yy, 16, LH - 1, { nav: false });
        if (UI.clicked('bp:' + bpk)) { if (this.breakpoints.has(bpk)) this.breakpoints.delete(bpk); else this.breakpoints.add(bpk); AudioSys.sfx('click'); }
        if (this.breakpoints.has(bpk)) pcircle(g, x + 6, yy + 5, 3, PAL.coral); else if (gst.hover) pring(g, x + 6, yy + 5, 3, '#7A3A4A');
      }
      drawText(g, String(n).padStart(2, ' '), x + 17, yy + 2, active ? PAL.sun : '#4A5590', { align: 'right' });
      if (active) { rect(g, ind - 2, yy, x + w - 4 - ind, LH - 1, 'rgba(255,216,74,0.25)'); drawText(g, '▶', ind - 8, yy + 2, PAL.sun); }
      if (isErr) { rect(g, ind - 2, yy, x + w - 4 - ind, LH - 1, 'rgba(255,107,107,0.35)'); drawText(g, '✗', ind - 8, yy + 2, PAL.coral); }
      if (l.kind === 'head') {
        const ctl = selected && editable && !b.locked;
        const lw = x + w - 6 - ind - (ctl ? 36 : 0);
        const lid = 'line:' + this.tab + ':' + pathKey(l.path);
        const st = UI.register(lid, ind, yy, lw, LH - 1, {});
        if (UI.clicked(lid)) { this.sel = selected ? null : l.path; AudioSys.sfx('select'); }
        if (selected) rect(g, ind - 1, yy - 1, x + w - 5 - ind, LH + 1, 'rgba(255,216,74,0.14)');
        if (flashing) rect(g, ind - 1, yy - 1, x + w - 5 - ind, LH + 1, `rgba(255,216,74,${0.35 * this.flash.t})`);
        rect(g, ind, yy, 3, LH - 1, cat.color);
        if (selected) strokeRect(g, ind - 1, yy - 1, x + w - 5 - ind, LH + 1, PAL.sun);
        if (b.locked) drawText(g, '■', x + w - 12, yy + 2, '#5A6090');
        this.drawBlockLine(g, b, ind + 5, yy + 2, l.path, st.hover || st.focus, lw - 8 - (b.locked ? 10 : 0));
        if (st.focus && Input.lastDevice === 'keyboard') UI.focusRing(g, ind, yy, lw, LH - 1);
        // controles de la línea marcada: subir, bajar, borrar
        if (ctl) {
          const bx = x + w - 40, pk = this.tab + ':' + pathKey(l.path);
          if (UI.btn(g, 'up:' + pk, bx, yy, 11, LH - 1, '▲', { color: PAL.sky, tip: 'Subir una fila' })) { this.moveLine(l.path, -1); this.selMoved = true; }
          if (UI.btn(g, 'dn:' + pk, bx + 12, yy, 11, LH - 1, '▼', { color: PAL.sky, tip: 'Bajar una fila' })) { this.moveLine(l.path, 1); this.selMoved = true; }
          if (UI.btn(g, 'del:' + pk, bx + 24, yy, 11, LH - 1, '✗', { color: PAL.coral, tip: 'Borrar esta línea' })) { this.touchEdit(); this.removeAt(l.path); AudioSys.sfx('remove'); }
          selRow = n;
        }
        // burbuja de condición e iteración
        if (active && this.condBubble && (b.op === 'if' || b.op === 'while')) {
          const tx = this.condBubble.v ? 'VERDADERO' : 'FALSO';
          const bx = x + w - 60;
          rect(g, bx, yy - 1, 56, 11, this.condBubble.v ? '#2A6A2A' : '#7A2A3A'); drawText(g, tx, bx + 28, yy + 1, PAL.white, { align: 'center' });
        }
        if (this.env && this.env.iter[pathKey(l.path)] && (b.op === 'repeat' || b.op === 'while' || b.op === 'foreach')) {
          const it = this.env.iter[pathKey(l.path)];
          const lbl = '↻ ' + it.k + '/' + it.n;
          rect(g, x + w - 40, yy - 1, 36, 11, '#1A4A7A'); drawText(g, lbl, x + w - 22, yy + 1, PAL.aqua, { align: 'center' });
        }
      } else {
        const txt = l.kind === 'else' ? 'SINO' : { if: 'FIN SI', repeat: 'FIN REPETIR', while: 'FIN MIENTRAS', foreach: 'FIN PARA' }[b.op];
        rect(g, ind, yy, 3, LH - 1, shade(cat.color, -0.3));
        drawText(g, txt, ind + 5, yy + 2, shade(cat.color, -0.1));
      }
      yy += LH;
    });
    if (this.flash) { this.flash.t -= 1 / 60; if (this.flash.t <= 0) this.flash = null; }
    if (!lines.length) drawPara(g, this.locked ? '' : 'Toca un bloque de la izquierda para añadirlo aquí.', x + 10, areaTop + 16, w - 20, '#5A6090');
    // fila de ayuda inferior
    rect(g, x + 2, areaBot + 1, w - 4, 11, '#10162B');
    let help;
    if (this.locked) help = 'Ejemplo: pulsa EJECUTAR y observa.';
    else if (!editable) help = 'Ejecutando… (PARAR para editar)';
    else if (selRow) help = 'Línea ' + selRow + ' marcada: ▲▼ mover · ✗ borrar';
    else help = 'Toca una línea para moverla o borrarla';
    drawText(g, fitText(help, w - (lines.length > maxLines ? 44 : 10)), x + 6, areaBot + 3, selRow ? PAL.sun : '#8C93B8');
    if (lines.length > maxLines) {
      if (UI.btn(g, 'scrUp', x + w - 30, areaBot + 1, 12, 11, '▲')) this.scroll--;
      if (UI.btn(g, 'scrDn', x + w - 16, areaBot + 1, 12, 11, '▼')) this.scroll++;
    }
    // animación de llamada / retorno
    if (this.callAnim) {
      const a = this.callAnim, k = 1 - a.t / 0.8;
      const txt = a.dir > 0 ? '→ LLAMANDO ' + a.fn + '()' : '↩ ' + a.fn + ' DEVUELVE ' + (a.value === undefined ? '' : fmtVal(a.value));
      const bw = textW(txt) + 10;
      rect(g, x + w / 2 - bw / 2, y + h - 34 - k * 6, bw, 12, a.dir > 0 ? '#4A2A7A' : '#2A5A1A'); drawText(g, txt, x + w / 2, y + h - 32 - k * 6, PAL.white, { align: 'center' });
    }
  }
  drawBlockLine(g, b, x, y, path, hover, maxW = 999) {
    let parts = this.blockParts(b);
    const editable = !this.locked && !b.locked && this.state !== 'running' && this.state !== 'paused';
    // números con − y +: se ajustan sin abrir listas
    const isNum = p => editable && p.options && p.options.length > 1 && p.options.every(o => typeof o.value === 'number');
    const chipW = p => textW(p.text) + 6 + (isNum(p) ? 18 : 0);
    // si la línea no cabe: primero se compacta el texto fijo, luego se juntan las piezas
    const widthOf = (ps, gap) => ps.reduce((s, p) => s + (typeof p === 'string' ? textW(p) + gap : chipW(p) + gap - 1), 0);
    let gap = 4;
    if (widthOf(parts, gap) > maxW) parts = parts.map(p => typeof p === 'string' ? p.replace(/^LLAMAR /, '').replace('ENTONCES', '→') : p);
    if (widthOf(parts, gap) > maxW) gap = 2;
    let cx = x;
    for (const p of parts) {
      if (typeof p === 'string') { drawText(g, p, cx, y, hover ? PAL.white : PAL.cream); cx += textW(p) + gap; continue; }
      const txt = p.text; const w = textW(txt) + 6;
      const id = 'chip:' + this.tab + ':' + pathKey(path) + ':' + p.key;
      if (isNum(p)) {
        const opts = p.options, cur = opts.findIndex(o => o.value === p.value);
        const step = d => { const k = clamp((cur < 0 ? 0 : cur) + d, 0, opts.length - 1); if (k !== cur) { this.touchEdit(); p.set(opts[k].value); AudioSys.sfx('click'); } else AudioSys.sfx('error'); };
        if (UI.btn(g, id + ':m', cx - 1, y - 2, 8, 11, '−', { color: PAL.sky, disabled: cur === 0, tip: 'Menos' })) step(-1);
        cx += 8;
        const st = UI.register(id, cx, y - 2, w, 11);
        rect(g, cx, y - 2, w, 11, st.hover || st.focus ? '#3A4A8A' : '#22306B'); rect(g, cx, y + 8, w, 1, p.color || PAL.sun);
        drawText(g, txt, cx + 3, y, p.color || PAL.sun);
        if (UI.clicked(id)) this.openChip(p, cx, y + 10);
        cx += w;
        if (UI.btn(g, id + ':p', cx + 1, y - 2, 8, 11, '+', { color: PAL.sky, disabled: cur === opts.length - 1, tip: 'Más' })) step(1);
        cx += 10 + gap - 1;
        continue;
      }
      if (editable && p.options) {
        const st = UI.register(id, cx - 1, y - 2, w, 11);
        rect(g, cx - 1, y - 2, w, 11, st.hover || st.focus ? '#3A4A8A' : p.blank ? '#4A3A10' : '#22306B');
        rect(g, cx - 1, y + 8, w, 1, p.color || PAL.sun);
        if (p.blank && Math.floor(this.t * 2) % 2) strokeRect(g, cx - 1, y - 2, w, 11, PAL.sun);
        if (UI.clicked(id)) this.openChip(p, cx, y + 10);
      } else rect(g, cx - 1, y - 2, w, 11, '#1A2248');
      drawText(g, txt, cx + 2, y, p.color || PAL.sun);
      cx += w + gap - 1;
    }
  }
  blockParts(b) {
    const cfg = this.cfg;
    const numOpts = (key) => (cfg.values && cfg.values[key]) || cfg.numbers || [0, 1, 2, 3, 4, 5, 6, 8, 10];
    const exprOpts = (key) => {
      const o = [];
      (cfg.exprOptions && cfg.exprOptions[key] ? cfg.exprOptions[key] : null || []).forEach(v => o.push(v));
      if (!o.length) { numOpts(key).forEach(n => o.push(n)); (cfg.sensors || []).forEach(s => o.push(s)); (cfg.varNames || []).forEach(s => o.push(s)); }
      return o.map(v => ({ label: exprText(v), value: v }));
    };
    const condParts = (c, pre) => {
      const lopts = (cfg.condLeft || cfg.sensors || []).concat(cfg.varNames || []).map(v => ({ label: v, value: v }));
      const r = [
        { key: pre + 'l', text: exprText(c.l), value: c.l, options: lopts, set: v => c.l = v, color: PAL.aqua },
        { key: pre + 'op', text: OP_TXT[c.op], options: (cfg.ops || OPS).map(o => ({ label: OP_TXT[o], value: o })), set: v => c.op = v, color: PAL.orange },
        { key: pre + 'r', text: exprText(c.r), value: c.r, options: (cfg.condRight ? cfg.condRight.map(v => ({ label: exprText(v), value: v })) : exprOpts('cond')), set: v => c.r = v, color: PAL.sun }
      ];
      if (cfg.allowJoin) {
        r.push({ key: pre + 'join', text: c.join ? c.join : '+', options: [{ label: '(ninguna)', value: null }, { label: 'Y', value: 'Y' }, { label: 'O', value: 'O' }], set: v => { c.join = v; if (v && !c.c2) c.c2 = { l: (cfg.condLeft || cfg.sensors || ['x'])[1] || (cfg.sensors || ['x'])[0], op: '<', r: 0 }; if (!v) delete c.c2; }, color: PAL.pink });
        if (c.join && c.c2) return r.concat(condParts(c.c2, pre + 'c2'));
      }
      return r;
    };
    switch (b.op) {
      case 'act': {
        const a = (cfg.actions || {})[b.name] || {};
        // el nombre de la instrucción se puede cambiar por otra de la paleta con un toque
        const alts = (cfg.palette || []).filter(t => t.startsWith('act:')).map(t => t.slice(4));
        const name = alts.length > 1 ? { key: 'name', text: a.label || b.name, color: PAL.cream, value: b.name, options: alts.map(nm => ({ label: ((cfg.actions || {})[nm] || {}).label || nm, value: nm })), set: v => { const na = (cfg.actions || {})[v] || {}; b.name = v; b.arg = na.arg != null ? (b.arg != null && na.options && na.options.includes(b.arg) ? b.arg : na.arg) : undefined; } } : a.label || b.name;
        if (b.arg !== undefined && a.options) return [name, { key: 'arg', text: exprText(b.arg), value: b.arg, options: a.options.map(v => ({ label: exprText(v), value: v })), set: v => b.arg = v, color: PAL.sun }];
        return [name];
      }
      case 'if': return ['SI'].concat(condParts(b.cond, 'c')).concat(['ENTONCES']);
      case 'while': return ['MIENTRAS'].concat(condParts(b.cond, 'c'));
      case 'repeat': return ['REPETIR', { key: 'n', text: exprText(b.n), value: b.n, options: numOpts('repeat').concat(cfg.repeatVars || []).map(v => ({ label: exprText(v), value: v })), set: v => b.n = v, color: PAL.sun }, 'VECES'];
      case 'foreach': return ['PARA CADA', { key: 'var', text: b.var, color: PAL.lime }, 'EN', { key: 'list', text: b.list, color: PAL.aqua }];
      case 'set': return [{ key: 'var', text: b.var, color: PAL.lime }, '←', { key: 'expr', text: exprText(b.expr), value: b.expr, options: exprOpts('set:' + b.var).length ? exprOpts('set:' + b.var) : exprOpts('set'), set: v => b.expr = v, color: PAL.sun }];
      case 'add': return [{ key: 'var', text: b.var, color: PAL.lime }, '← ' + b.var + ' +', { key: 'expr', text: exprText(b.expr), value: b.expr, options: exprOpts('add:' + b.var).length ? exprOpts('add:' + b.var) : exprOpts('add'), set: v => b.expr = v, color: PAL.sun }];
      case 'call': {
        const f = cfg.functions && cfg.functions[b.fn];
        const parts = [];
        if (b.into) parts.push({ key: 'into', text: b.into, color: PAL.lime, options: (cfg.intoOptions || [b.into]).map(v => ({ label: v, value: v })), set: v => b.into = v }, '←');
        parts.push('LLAMAR ' + b.fn + '(');
        (b.args || []).forEach((a, i) => { parts.push({ key: 'a' + i, text: exprText(a), value: a, options: exprOpts('arg:' + b.fn + ':' + i).length ? exprOpts('arg:' + b.fn + ':' + i) : exprOpts('arg'), set: v => b.args[i] = v, color: PAL.sun }); });
        parts.push(')');
        return parts;
      }
      case 'ret': return ['DEVOLVER', { key: 'expr', text: exprText(b.expr), value: b.expr, options: exprOpts('ret'), set: v => b.expr = v, color: PAL.sun }];
      case 'blank': {
        // hueco: al tocarlo se elige qué instrucción va ahí
        const opts = (cfg.palette || []).map(t => ({ label: templateLabel(t, cfg), value: t }));
        return [{ key: 'blank', blank: true, text: '▢ ' + (b.hint || 'toca para elegir'), color: PAL.sun, options: opts, set: v => { const nb = makeFromTemplate(v, cfg); Object.keys(b).forEach(k => delete b[k]); Object.assign(b, nb); } }];
      }
    }
    return ['?'];
  }
  openChip(p, x, y) {
    if (this.state !== 'edit') { this.state = 'edit'; this.resetWorld(); }
    this.popup = { title: null, options: p.options, onPick: v => { p.set(v); AudioSys.sfx('place'); }, x: Math.min(x, W - 110), y: Math.min(y, H - 20 - p.options.length * 12), w: Math.max(80, Math.max(...p.options.map(o => textW(o.label))) + 16) };
    UI.focus = 'pop:0';
  }
  drawPopup(g) {
    const P = this.popup;
    const rows = P.options.length;
    const cols = rows > 12 ? 2 : 1;
    const perCol = Math.ceil(rows / cols);
    const h = perCol * 12 + (P.title ? 16 : 4) + 4;
    const w = P.w * cols;
    const x = clamp(P.x, 2, W - w - 2), y = clamp(P.y, 18, H - h - 2);
    rect(g, 0, 0, W, H, 'rgba(5,7,15,0.45)');
    UI.scope = 'pop';
    UI.register('popblock', 0, 0, W, H, { nav: false, group: 'pop' });
    if (UI.clicked('popblock') && !P.title) { this.popup = null; UI.scope = null; return; }
    panel(g, x, y, w, h, { border: PAL.sun });
    let yy = y + 4;
    if (P.title) { drawText(g, P.title, x + 6, yy + 1, PAL.sun); yy += 14; }
    P.options.forEach((o, i) => {
      const col = Math.floor(i / perCol), row = i % perCol;
      const ox = x + 3 + col * P.w, oy = yy + row * 12;
      const id = 'pop:' + i;
      const st = UI.register(id, ox, oy, P.w - 6, 11, { group: 'pop' });
      if (st.hover || st.focus) rect(g, ox, oy, P.w - 6, 11, '#2A3570');
      drawText(g, o.label, ox + 4, oy + 2, st.hover || st.focus ? PAL.white : PAL.cream);
      if (UI.clicked(id)) { this.popup = null; UI.scope = null; P.onPick(o.value); }
    });
  }
  drawDragGhost(g) {
    const p = UI.dragging;
    const label = p.tpl ? templateLabel(p.tpl, this.cfg) : blockText(getBlock(this.curList, p.move) || { op: 'blank' });
    const w = textW(label) + 10;
    const x = Input.pointer.x - 6, y = Input.pointer.y - 6;
    g.globalAlpha = 0.85; rect(g, x, y, w, 12, '#2A3570'); strokeRect(g, x, y, w, 12, PAL.sun); drawText(g, label, x + 5, y + 3, PAL.sun); g.globalAlpha = 1;
  }
  drawWorld(g) {
    const x = 294, y = 20, w = 182, h = 136;
    panel(g, x, y, w, h, { border: this.state === 'success' ? PAL.lime : this.state === 'error' ? PAL.coral : '#2A3570', bg: '#0B1020' });
    g.save(); g.beginPath(); g.rect(x + 2, y + 2, w - 4, h - 4); g.clip();
    if (this.world.draw) this.world.draw(g, x + 2, y + 2, w - 4, h - 4, this.st, this.t, this);
    g.restore();
    if (this.state === 'success') { drawText(g, '✓ ÉXITO', x + w - 6, y + h - 12, PAL.lime, { align: 'right', outline: PAL.ink }); }
    if (this.state === 'running' && this.ticks > 1 && this.cfg.tickLabel) drawText(g, this.cfg.tickLabel(this.tick), x + 6, y + h - 12, PAL.sun, { outline: PAL.ink });
  }
  drawPanel(g) {
    const x = 294, y = 158, w = 182, h = 66;
    panel(g, x, y, w, h, { border: '#2A3570' });
    if (UI.btn(g, 'ptab:vars', x + 4, y + 3, 60, 11, 'VARIABLES', { color: PAL.lime, bg: this.panelTab === 'vars' ? '#2A3570' : '#10162B' })) this.panelTab = 'vars';
    if (UI.btn(g, 'ptab:traza', x + 67, y + 3, 48, 11, 'TRAZA', { color: PAL.sun, bg: this.panelTab === 'traza' ? '#2A3570' : '#10162B' })) this.panelTab = 'traza';
    if (this.panelTab === 'vars') {
      const rows = [];
      const sens = this.world.sensors || {};
      for (const k in sens) { try { rows.push({ k, v: sens[k](this.st, this.env || {}), sensor: true }); } catch (e) { } }
      const vars = this.env ? this.env.vars : (this.cfg.vars || {});
      for (const k in vars) if (typeof vars[k] !== 'object' || vars[k] === null) rows.push({ k, v: vars[k] }); else rows.push({ k, v: vars[k] });
      if (this.world.extraVars) this.world.extraVars(this.st, this.env).forEach(r => rows.push(r));
      let yy = y + 17;
      rows.slice(0, 4).forEach((r, i) => {
        const changed = this.env && this.env.changed[r.k];
        const cap = x + 6 + (i % 1) * 0;
        // cápsula
        rect(g, cap, yy, 44, 10, r.sensor ? '#1A3A5A' : '#2A4A1A');
        rect(g, cap, yy, 2, 10, r.sensor ? PAL.aqua : PAL.lime);
        drawText(g, r.k.length > 9 ? r.k.slice(0, 8) + '…' : r.k, cap + 4, yy + 2, r.sensor ? PAL.aqua : PAL.lime);
        drawText(g, '=', cap + 48, yy + 2, '#8C93B8');
        const vt = fmtVal(r.v);
        drawText(g, vt.length > 18 ? vt.slice(0, 17) + '…' : vt, cap + 56, yy + 2, changed ? PAL.sun : PAL.cream);
        if (typeof r.v === 'number' && r.max) bar(g, x + w - 38, yy + 2, 32, 6, r.v, r.max, r.sensor ? PAL.aqua : PAL.lime);
        yy += 12;
      });
      if (!rows.length) drawText(g, '(sin variables)', x + 8, y + 20, '#5A6090');
      if (this.env) for (const k in this.env.changed) this.env.changed[k] = Math.max(0, this.env.changed[k] - 0.02);
    } else {
      const tr = this.env ? this.env.trace : [];
      const show = tr.slice(-4);
      show.forEach((s, i) => {
        const n = tr.length - show.length + i + 1;
        const yy = y + 17 + i * 12;
        const failLine = this.state === 'error' && i === show.length - 1 && !s.ok;
        drawText(g, 'PASO ' + n, x + 6, yy, '#8C93B8');
        drawText(g, s.ok ? '✓' : '✗', x + 42, yy, s.ok ? PAL.lime : PAL.coral);
        const t = s.text.length > 24 ? s.text.slice(0, 23) + '…' : s.text;
        drawText(g, t, x + 52, yy, failLine ? PAL.coral : PAL.cream);
      });
      if (!tr.length) drawText(g, 'Ejecuta para ver cada paso.', x + 8, y + 20, '#5A6090');
    }
  }
  drawBottom(g) {
    const y = 227;
    rect(g, 0, y - 1, W, 1, '#2A3570');
    let x = 4;
    const running = this.state === 'running' || this.state === 'paused';
    const b = (id, w, label, o) => { const r = UI.btn(g, id, x, y + 2, w, 15, label, o); x += w + 3; return r; };
    if (this.stageDone) {
      if (b('next', 120, 'SIGUIENTE ETAPA ▶', { primary: true, color: PAL.lime })) this.nextStage();
    } else if (this.result) {
      if (b('cont', 120, 'CONTINUAR ▶', { primary: true, color: PAL.lime })) this.exit(this.result);
    } else {
      if (b('run', 64, running && this.state === 'paused' ? '▶ SEGUIR' : '▶ EJECUTAR', { primary: true, color: PAL.lime, disabled: this.state === 'running' && !this.stepMode })) { if (this.state === 'paused') { this.stepMode = false; this.state = 'running'; } else this.startRun(false); }
      if (b('step', 46, '⏯ PASO', { color: PAL.sky, tip: 'Ejecuta una línea cada vez para depurar.' })) { if (this.state === 'paused') { this.stepOnce = true; this.state = 'running'; } else if (!running) this.startRun(true); }
      if (b('stop', 42, '■ PARAR', { color: PAL.coral, disabled: !running && this.state !== 'error' })) { this.stopRun('Detenido. Puedes editar el programa.'); this.resetWorld(); }
    }
    if (b('speed', 52, SPEEDS[this.speed].n, { color: PAL.sun, tip: 'Velocidad de ejecución' })) this.speed = (this.speed + 1) % SPEEDS.length;
    if (b('hint', 46, 'PISTA', { color: PAL.sun, icon: 'star', tip: 'Tres niveles: pregunta, resaltado y solución parcial. (H)' })) this.hint();
    if (b('flow', 50, this.view === 'code' ? 'FLUJO' : 'CÓDIGO', { color: PAL.violet, tip: 'Ver el mismo algoritmo como diagrama de flujo. (B)' })) this.view = this.view === 'code' ? 'flow' : 'code';
    if (b('atlas', 40, 'ATLAS', { color: PAL.teal })) Scenes.push(new CodexScene(this.cfg.codex));
    if (b('exit', 34, 'SALIR', { color: PAL.cream })) this.askExit();
    // mensaje
    const mx = 4, my = y + 20;
    const pt = Portraits.get(this.msgWho || 'pix', this.state === 'error' ? 'pensando' : this.state === 'success' ? 'feliz' : 'n');
    g.drawImage(pt, 0, 0, 32, 32, mx, my, 16, 16);
    const lines = wrapRich(this.msg, W - 30, this.msgColor);
    const off = lines.length > 2 ? Math.floor(this.t * 0.4) % (lines.length - 1) : 0;
    lines.slice(off, off + 2).forEach((ln, i) => drawRichLine(g, ln, mx + 20, my + 1 + i * 9));
  }
  // ---------- vista de diagrama de flujo (auto-generado) ----------
  drawFlow(g) {
    const x = 100, y = 20, w = 190, h = 204;
    panel(g, x, y, w, h, { border: PAL.violet, bg: 'rgba(8,12,28,0.95)' });
    drawText(g, 'DIAGRAMA DE FLUJO', x + 6, y + 5, PAL.violet);
    const nodes = [];
    const layout = (list, cx, yy, path) => {
      for (let i = 0; i < list.length; i++) {
        const b = list[i], p = path.concat(i);
        if (b.op === 'if' || b.op === 'while' || b.op === 'repeat' || b.op === 'foreach') {
          const txt = b.op === 'if' || b.op === 'while' ? condText(b.cond) + '?' : b.op === 'repeat' ? '¿k<' + exprText(b.n) + '?' : '¿quedan ' + b.list + '?';
          nodes.push({ type: 'dec', x: cx, y: yy, text: txt, path: p, loop: b.op !== 'if' });
          const top = yy;
          yy += 22;
          const bodyEnd = layout(b.body, cx + (b.op === 'if' ? -22 : 0), yy, p.concat('body'));
          let elseEnd = yy;
          if (b.op === 'if' && b.else) elseEnd = layout(b.else, cx + 22, yy, p.concat('else'));
          if (b.op !== 'if') nodes.push({ type: 'back', x: cx, y1: bodyEnd, y0: top });
          yy = Math.max(bodyEnd, elseEnd) + 4;
          if (b.op === 'if') nodes.push({ type: 'merge', x: cx, y: yy - 2 });
        } else {
          nodes.push({ type: b.op === 'call' ? 'call' : 'proc', x: cx, y: yy, text: blockText(b), path: p });
          yy += 16;
        }
      }
      return yy;
    };
    nodes.push({ type: 'term', x: x + w / 2, y: y + 18, text: 'INICIO' });
    const end = layout(this.curList, x + w / 2, y + 34, []);
    nodes.push({ type: 'term', x: x + w / 2, y: end, text: 'FIN' });
    const maxY = Math.max(end + 10, y + h);
    const scale = Math.min(1, (h - 24) / (maxY - y - 10));
    g.save(); g.beginPath(); g.rect(x + 2, y + 14, w - 4, h - 16); g.clip();
    const ty = v => y + 14 + (v - y - 14) * scale;
    pline(g, x + w / 2, ty(y + 22), x + w / 2, ty(end), '#3E4C8A');
    for (const n of nodes) {
      const active = n.path && this.highlight && pathKey(n.path) === pathKey(this.highlight.path);
      const col = active ? PAL.sun : n.type === 'dec' ? PAL.orange : n.type === 'call' ? PAL.lilac : n.type === 'term' ? PAL.lime : PAL.teal;
      const ny = Math.round(ty(n.y));
      if (n.type === 'back') { const y1 = Math.round(ty(n.y1)), y0 = Math.round(ty(n.y0)); pline(g, n.x + 40, y1, n.x + 40, y0, PAL.sky, 2, Math.floor(this.t * 8)); pline(g, n.x, y1, n.x + 40, y1, PAL.sky); pline(g, n.x + 40, y0, n.x + 30, y0, PAL.sky); continue; }
      if (n.type === 'merge') { pcircle(g, n.x, ny, 2, '#3E4C8A'); continue; }
      const t = n.text.length > 26 ? n.text.slice(0, 25) + '…' : n.text;
      const tw = Math.min(w - 20, textW(t) + 12);
      if (n.type === 'dec') { for (let k = 0; k < 7; k++) { const ww = Math.round((tw / 2 + 4) * (1 - Math.abs(k - 3) / 4)); rect(g, n.x - ww, ny - 3 + k, ww * 2, 1, active ? '#5A4A1A' : '#3A2A10'); } drawText(g, t, n.x, ny - 3, col, { align: 'center', outline: '#10162B' }); if (!n.loop) { drawText(g, 'SÍ', n.x - tw / 2 - 12, ny - 3, PAL.lime); drawText(g, 'NO', n.x + tw / 2 + 2, ny - 3, PAL.coral); } }
      else if (n.type === 'term') { rect(g, n.x - tw / 2 + 2, ny - 5, tw - 4, 11, '#1A3A1A'); rect(g, n.x - tw / 2, ny - 3, tw, 7, '#1A3A1A'); drawText(g, t, n.x, ny - 3, col, { align: 'center' }); }
      else { rect(g, n.x - tw / 2, ny - 5, tw, 11, active ? '#4A4A1A' : '#10263A'); strokeRect(g, n.x - tw / 2, ny - 5, tw, 11, col); if (n.type === 'call') { rect(g, n.x - tw / 2 + 2, ny - 5, 1, 11, col); rect(g, n.x + tw / 2 - 3, ny - 5, 1, 11, col); } drawText(g, t, n.x, ny - 3, col, { align: 'center' }); }
    }
    g.restore();
    drawText(g, 'misma lógica, otra representación', x + w / 2, y + h - 10, '#5A6090', { align: 'center' });
  }
}
