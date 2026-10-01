#!/usr/bin/env node
// Construye lumina_loop.html: un único HTML autocontenido a partir de src/.
// Uso: node tools/build.js
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const shell = fs.readFileSync(path.join(srcDir, 'shell.html'), 'utf8');

// Los módulos se concatenan en orden alfabético (prefijo numérico).
const files = fs.readdirSync(srcDir)
  .filter(f => /^\d\d_.*\.js$/.test(f))
  .sort();

let js = '';
for (const f of files) {
  const code = fs.readFileSync(path.join(srcDir, f), 'utf8');
  js += `\n// ===== ${f} · Lumina Loop · © Aslin Gonzalo Botello Plata =====\n` + code + '\n';
}

// Envolver en un IIFE para no contaminar el ámbito global
// (se expone solo window.LL para depuración y pruebas).
const game = `(function(){\n'use strict';\n${js}\n})();`;
if (game.includes('</script')) {
  throw new Error('El código contiene "</script", lo que rompería el HTML.');
}
const out = shell.replace('/*__GAME__*/', () => game);
// El juego completo se escribe en DOS archivos idénticos:
//  - index.html: lo que abre GitHub Pages en la dirección del sitio (lo que juegan los estudiantes).
//  - lumina_loop.html: el mismo juego con su nombre propio (enlaces antiguos y uso sin conexión).
// Así cualquier cambio en src/ se refleja en ambos al compilar.
fs.writeFileSync(path.join(root, 'lumina_loop.html'), out);
fs.writeFileSync(path.join(root, 'index.html'), out);
// .nojekyll: GitHub Pages publica los archivos tal cual, sin pasarlos por Jekyll
fs.writeFileSync(path.join(root, '.nojekyll'), '');
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`index.html y lumina_loop.html generados (${files.length} módulos, ${kb} KB)`);
