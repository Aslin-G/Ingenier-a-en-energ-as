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
  js += `\n// ===== ${f} =====\n` + code + '\n';
}

// Envolver en un IIFE para no contaminar el ámbito global
// (se expone solo window.LL para depuración y pruebas).
const game = `(function(){\n'use strict';\n${js}\n})();`;
if (game.includes('</script')) {
  throw new Error('El código contiene "</script", lo que rompería el HTML.');
}
const out = shell.replace('/*__GAME__*/', () => game);
fs.writeFileSync(path.join(root, 'lumina_loop.html'), out);

// index.html: lanzador ligero (útil para GitHub Pages o servidores estáticos).
const index = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0; url=lumina_loop.html">
<title>Lumina Loop: El Código de los Elementos</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#10162B;color:#FFF3D7;font:16px monospace}a{color:#2EE6C9}</style>
</head>
<body>
<p>Cargando <a href="lumina_loop.html">Lumina Loop</a>…</p>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), index);
const kb = (Buffer.byteLength(out) / 1024).toFixed(1);
console.log(`lumina_loop.html generado (${files.length} módulos, ${kb} KB)`);
