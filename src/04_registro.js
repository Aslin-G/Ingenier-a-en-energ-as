// =====================================================================
//  REGISTRO DE ACTIVIDAD PARA EL DOCENTE (rendimiento y calificación)
//  Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
//
//  · Solo funciona si el estudiante se registró y ACEPTÓ los tres
//    consentimientos de la pantalla de registro (RegisterScene).
//  · Anota lo que hace en el juego (retos, errores, logros, misiones,
//    derrotas, tiempos) y lo envía por lotes a la hoja de cálculo de
//    Google Drive del docente (una aplicación web de Google Apps Script).
//  · No cambia la mecánica del juego. Si no hay conexión, los eventos
//    esperan en el dispositivo y se reenvían después.
//  · Configuración: pega en REGISTRO_URL la dirección «/exec» de la
//    aplicación web (instrucciones en tools/google-sheets/LEEME.md).
// =====================================================================
const REGISTRO_URL = '';

const Registro = {
  KEY: 'luminaLoopRegistro', MAX: 3000, LOTE: 40,
  cola: [], sesion: null, inicio: 0, enviando: false,
  url() { try { return String(window.LUMINA_REGISTRO_URL || REGISTRO_URL || '').trim(); } catch (e) { return ''; } },
  activo() { const p = G.save && G.save.player; return !!(p && p.consent && p.consent.ok); },
  idSesion() {
    if (!this.sesion) { this.sesion = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); this.inicio = Date.now(); }
    return this.sesion;
  },
  lugar() {
    const lv = G.run && G.run.level;
    return lv ? (lv.def.title || lv.key) : (G.save.scene || '');
  },
  // un evento: tipo, detalle (qué), resultado, valor (número) y datos adicionales
  log(tipo, detalle = '', resultado = '', valor = '', extra = null) {
    try {
      if (!this.activo()) return;
      const p = G.save.player;
      this.cola.push({
        t: new Date().toISOString(), sesion: this.idSesion(), id: p.id, estudiante: p.full, tipo, lugar: this.lugar(),
        detalle: String(detalle == null ? '' : detalle).slice(0, 300), resultado: String(resultado == null ? '' : resultado).slice(0, 600),
        valor: valor == null ? '' : valor, extra: extra ? JSON.stringify(extra) : ''
      });
      if (this.cola.length > this.MAX) this.cola.splice(0, this.cola.length - this.MAX);
      this.guardar();
      if (this.cola.length >= this.LOTE) this.enviar();
    } catch (e) { }
  },
  guardar() { try { localStorage.setItem(this.KEY, JSON.stringify(this.cola)); } catch (e) { } },
  cargar() { try { const c = JSON.parse(localStorage.getItem(this.KEY) || '[]'); if (Array.isArray(c)) this.cola = c.concat(this.cola).slice(-this.MAX); } catch (e) { } },
  // envía un lote (al cerrar la página, con sendBeacon)
  enviar(alSalir) {
    const url = this.url();
    if (!url || !this.cola.length || (this.enviando && !alSalir)) return;
    const lote = this.cola.slice(0, this.LOTE), cuerpo = JSON.stringify({ v: 1, juego: 'Lumina Loop', eventos: lote });
    const quitar = () => { this.cola.splice(0, lote.length); this.guardar(); };
    try {
      if (alSalir && navigator.sendBeacon) { if (navigator.sendBeacon(url, new Blob([cuerpo], { type: 'text/plain;charset=utf-8' }))) quitar(); return; }
      this.enviando = true;
      fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: cuerpo, keepalive: cuerpo.length < 60000 })
        .then(() => { this.enviando = false; quitar(); if (this.cola.length) setTimeout(() => this.enviar(), 1500); })
        .catch(() => { this.enviando = false; });
    } catch (e) { this.enviando = false; }
  },
  // resumen del progreso (al empezar y al terminar cada sesión)
  resumen() {
    try {
      const s = G.save.stats || {};
      return {
        nivel: G.save.level, xp: G.save.xp, islasRestauradas: REGIONS.filter(r => restored(r.key)).map(r => r.name).join(', '),
        jefes: Object.keys(BOSSES).filter(k => flag('boss_' + k)).length, miniJefes: Object.keys(MINI).filter(k => flag('mini_' + k)).length,
        retosResueltos: s.puzzles, alPrimerIntento: s.firstTry, pistas: s.hints, errores: s.fails, derrotas: s.deaths || 0,
        logros: Object.keys(G.save.achievements || {}).length, minutosJugados: Math.round((s.playTime || 0) / 60), dominio: G.save.mastery
      };
    } catch (e) { return null; }
  },
  // ---------- eventos con formato propio ----------
  registro(p) { this.log('registro', p.full, 'consentimientos aceptados', '', { nombres: p.nombres, apellidos: p.apellidos, nombreEnElJuego: p.hero, consentimientos: p.consent.items, version: p.consent.version, fecha: p.consent.at }); },
  inicioSesion(nueva) { this.sesion = null; this.log('inicio_sesion', nueva ? 'partida nueva' : 'continuar partida', '', '', this.resumen()); this.enviar(); },
  reto(sc, r, clase) {
    const cfg = sc.cfg || {};
    const tipo = cfg.label === 'PARCHE' ? 'parche_jefe' : clase === 'SimScene' ? 'simulador' : 'reto';
    let programa;
    try { if (r && r.program && typeof progToText === 'function') programa = progToText(r.program).slice(0, 1500); } catch (e) { }
    this.log(tipo, cfg.title || '', r && r.success ? 'superado' : 'salió sin terminar', r && r.success ? (r.stars || 0) : '', {
      tipoDeReto: clase, conceptos: (cfg.concepts || []).join(', '), ejecuciones: (r && r.attempts) || sc.runs || 0,
      errores: sc.fails || 0, pistas: sc.hintLevel || 0, alPrimerIntento: !!(r && r.firstTry), segundos: Math.round(sc.t || 0), programa
    });
  },
  error(sc, msg) { this.log('error_en_reto', (sc.cfg && sc.cfg.title) || '', String(msg || ''), sc.fails || ''); },
  // banderas de la historia: las importantes con un nombre legible; el resto, como «hito»
  hito(k) {
    if (!this.activo()) return;
    const isla = key => { const r = REGIONS.find(x => x.key === key); return r ? r.name : key; };
    let m;
    if ((m = /^restored_(.+)/.exec(k))) this.log('isla_restaurada', isla(m[1]));
    else if ((m = /^boss_(.+)/.exec(k))) this.log('jefe_vencido', BOSSES[m[1]] ? BOSSES[m[1]].name : m[1], isla(m[1]));
    else if ((m = /^mini_(.+)/.exec(k))) this.log('minijefe_vencido', MINI[m[1]] ? MINI[m[1]].name : m[1], isla(m[1]));
    else if (k === 'ending') this.log('final_del_juego', 'créditos vistos');
    else this.log('hito', k);
  }
};
Registro.cargar();
// envío periódico y al ocultar o cerrar la página
setInterval(() => { if (Registro.cola.length) Registro.enviar(); }, 20000);
document.addEventListener('visibilitychange', () => {
  if (!Registro.sesion || !Registro.activo()) return;
  if (document.visibilityState === 'hidden') { Registro.log('pausa', 'la pestaña se ocultó', '', Math.round((Date.now() - Registro.inicio) / 1000)); Registro.enviar(true); }
  else Registro.log('reanuda', 'la pestaña volvió a estar visible');
});
window.addEventListener('pagehide', () => {
  if (!Registro.sesion || !Registro.activo()) return;
  Registro.log('fin_sesion', 'cierre de la página', '', Math.round((Date.now() - Registro.inicio) / 1000), Registro.resumen());
  Registro.enviar(true);
});
