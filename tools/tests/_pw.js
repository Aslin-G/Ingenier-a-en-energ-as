// Utilidades comunes para las pruebas automáticas con Playwright (Chromium sin interfaz).
// Busca Playwright instalado en el proyecto o de forma global.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* probar instalación global */ }
  try {
    const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(g, 'playwright'));
  } catch (e) {
    console.error('No se encontró Playwright. Instálalo con: npm i -D playwright');
    process.exit(2);
  }
}

const root = path.join(__dirname, '..', '..');
const gameFile = process.env.LUMINA_FILE || path.join(root, 'lumina_loop.html');
const outDir = process.env.LUMINA_OUT || path.join(require('os').tmpdir(), 'lumina_loop_tests');
fs.mkdirSync(outDir, { recursive: true });

module.exports = { chromium: loadPlaywright().chromium, gameFile, outDir };
