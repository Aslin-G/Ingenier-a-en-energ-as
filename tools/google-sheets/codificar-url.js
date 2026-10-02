// Lumina Loop · © Aslin Gonzalo Botello Plata
// Codifica la dirección «/exec» de la aplicación web para REGISTRO_URL
// (src/04_registro.js), así no se lee a simple vista en el código de la página.
// Uso: node tools/google-sheets/codificar-url.js "https://script.google.com/macros/s/…/exec"
'use strict';
const url = (process.argv[2] || '').trim();
if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
  console.error('Uso: node tools/google-sheets/codificar-url.js "https://script.google.com/macros/s/…/exec"');
  process.exit(1);
}
console.log(`const REGISTRO_URL = '${Buffer.from([...url].reverse().join(''), 'utf8').toString('base64')}';`);
