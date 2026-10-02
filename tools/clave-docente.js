// Lumina Loop · © Aslin Gonzalo Botello Plata
// Cambia la contraseña del MODO DOCENTE sin escribirla en el código del juego.
// Uso: node tools/clave-docente.js "NuevaContraseña"
// Imprime el bloque DOCENTE_CLAVE para pegarlo en src/17_docente.js
// (después: node tools/build.js y publicar).
'use strict';
const crypto = require('crypto');
const clave = (process.argv[2] || '').trim();
if (clave.length < 6) { console.error('Uso: node tools/clave-docente.js "NuevaContraseña"  (6 caracteres o más)'); process.exit(1); }
const sal = crypto.randomBytes(8).toString('hex'), vueltas = 5000;
const h = s => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
let x = h(sal + ':' + clave);
for (let i = 0; i < vueltas; i++) x = h(x + sal);
console.log(`const DOCENTE_CLAVE = {\n  sal: '${sal}', vueltas: ${vueltas},\n  huellas: ['${x}']\n};`);
