/**
 * Lumina Loop: El Código de los Elementos · © Aslin Gonzalo Botello Plata
 * Receptor del registro de actividad (Google Apps Script).
 *
 * Versión 2. Se pega en el editor de Apps Script (mejor desde la hoja de
 * cálculo: Extensiones → Apps Script) y se publica como «Aplicación web»
 * (ver LEEME.md). Si el proyecto no está vinculado a una hoja, crea una en
 * tu Drive («Lumina Loop · Registro de la clase») y la recuerda.
 * El juego le envía, por lotes, los eventos de los estudiantes que se
 * registraron y aceptaron los consentimientos. Crea y mantiene dos hojas:
 *   · Registro:    una fila por evento (todo lo que hizo cada estudiante).
 *   · Estudiantes: una fila por estudiante con un resumen para calificar.
 */

var HOJA_REGISTRO = 'Registro';
var HOJA_ESTUDIANTES = 'Estudiantes';
var COLS_REGISTRO = ['Fecha y hora', 'Estudiante', 'ID', 'Sesión', 'Evento', 'Lugar', 'Detalle', 'Resultado', 'Valor', 'Datos adicionales'];
var COLS_ESTUDIANTES = ['Estudiante', 'ID', 'Nombres', 'Apellidos', 'Consentimiento (fecha)', 'Primera actividad', 'Última actividad',
  'Eventos', 'Retos superados', 'Retos sin terminar', 'Errores en retos', 'Estrellas', 'Cerraduras: aciertos', 'Cerraduras: errores',
  'Derrotas', 'Logros', 'Islas restauradas', 'Jefes vencidos', 'Nivel', 'Minutos jugados'];

// la hoja donde se escribe: la del proyecto (si está vinculado) o una propia en Drive
function libro_() {
  var activo = SpreadsheetApp.getActiveSpreadsheet();
  if (activo) return activo;
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('HOJA_ID');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (e) { } }
  var nuevo = SpreadsheetApp.create('Lumina Loop · Registro de la clase');
  props.setProperty('HOJA_ID', nuevo.getId());
  return nuevo;
}

// ?estado=1 → el modo docente del juego comprueba la conexión y ve la hoja
function doGet(e) {
  if (e && e.parameter && e.parameter.estado) {
    var libro = libro_();
    var reg = hoja_(libro, HOJA_REGISTRO, COLS_REGISTRO), est = hoja_(libro, HOJA_ESTUDIANTES, COLS_ESTUDIANTES);
    var out = { ok: true, version: 2, hoja: libro.getName(), url: libro.getUrl(), eventos: Math.max(0, reg.getLastRow() - 1), estudiantes: Math.max(0, est.getLastRow() - 1) };
    return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput('Lumina Loop: registro de actividad activo.');
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var datos = JSON.parse(e.postData.contents);
    var eventos = (datos && datos.eventos) || [];
    if (!eventos.length) return ContentService.createTextOutput('sin eventos');
    var libro = libro_();
    var reg = hoja_(libro, HOJA_REGISTRO, COLS_REGISTRO);
    var filas = eventos.map(function (ev) {
      return [new Date(ev.t), ev.estudiante || '', ev.id || '', ev.sesion || '', ev.tipo || '', ev.lugar || '',
        ev.detalle || '', ev.resultado || '', ev.valor === undefined ? '' : ev.valor, ev.extra || ''];
    });
    reg.getRange(reg.getLastRow() + 1, 1, filas.length, COLS_REGISTRO.length).setValues(filas);
    actualizarEstudiantes_(libro, eventos);
    return ContentService.createTextOutput('ok ' + filas.length);
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  } finally {
    lock.releaseLock();
  }
}

// crea la hoja con su encabezado si no existe
function hoja_(libro, nombre, cols) {
  var h = libro.getSheetByName(nombre);
  if (!h) {
    h = libro.insertSheet(nombre);
    h.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}

// una fila por estudiante (por ID) con contadores para calificar
function actualizarEstudiantes_(libro, eventos) {
  var h = hoja_(libro, HOJA_ESTUDIANTES, COLS_ESTUDIANTES);
  var n = h.getLastRow() - 1;
  var filas = n > 0 ? h.getRange(2, 1, n, COLS_ESTUDIANTES.length).getValues() : [];
  var porId = {};
  filas.forEach(function (f, i) { porId[f[1]] = i; });
  var C = {}; COLS_ESTUDIANTES.forEach(function (c, i) { C[c] = i; });
  eventos.forEach(function (ev) {
    if (!ev.id) return;
    var i = porId[ev.id];
    if (i === undefined) {
      var nueva = COLS_ESTUDIANTES.map(function () { return ''; });
      nueva[C['Estudiante']] = ev.estudiante; nueva[C['ID']] = ev.id; nueva[C['Primera actividad']] = new Date(ev.t);
      ['Eventos', 'Retos superados', 'Retos sin terminar', 'Errores en retos', 'Estrellas', 'Cerraduras: aciertos', 'Cerraduras: errores', 'Derrotas', 'Logros', 'Islas restauradas', 'Jefes vencidos'].forEach(function (c) { nueva[C[c]] = 0; });
      filas.push(nueva); i = porId[ev.id] = filas.length - 1;
    }
    var f = filas[i], extra = {};
    try { extra = ev.extra ? JSON.parse(ev.extra) : {}; } catch (e) { extra = {}; }
    f[C['Estudiante']] = ev.estudiante; f[C['Última actividad']] = new Date(ev.t);
    f[C['Eventos']] = (+f[C['Eventos']] || 0) + 1;
    var suma = function (col, k) { f[C[col]] = (+f[C[col]] || 0) + (k === undefined ? 1 : k); };
    switch (ev.tipo) {
      case 'registro':
        f[C['Nombres']] = extra.nombres || ''; f[C['Apellidos']] = extra.apellidos || ''; f[C['Consentimiento (fecha)']] = extra.fecha ? new Date(extra.fecha) : '';
        break;
      case 'reto': case 'simulador': case 'parche_jefe':
        if (ev.resultado === 'superado') { suma('Retos superados'); suma('Estrellas', +ev.valor || 0); } else suma('Retos sin terminar');
        break;
      case 'error_en_reto': suma('Errores en retos'); break;
      case 'cerradura': suma(ev.resultado === 'acierto' ? 'Cerraduras: aciertos' : 'Cerraduras: errores'); break;
      case 'derrota': suma('Derrotas'); break;
      case 'logro': suma('Logros'); break;
      case 'isla_restaurada': suma('Islas restauradas'); break;
      case 'jefe_vencido': suma('Jefes vencidos'); break;
      case 'inicio_sesion': case 'fin_sesion': case 'pausa':
        if (extra.nivel) f[C['Nivel']] = extra.nivel;
        if (extra.minutosJugados !== undefined) f[C['Minutos jugados']] = extra.minutosJugados;
        break;
    }
  });
  if (filas.length) h.getRange(2, 1, filas.length, COLS_ESTUDIANTES.length).setValues(filas);
}
