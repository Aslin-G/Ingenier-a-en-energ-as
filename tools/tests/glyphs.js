// Comprueba que las flechas de la fuente pixel apuntan hacia donde dicen
// (giros ↰ ↱, rotaciones ↺ ↻ y flechas ← → ↖ ↗ ◀ ▶). No necesita navegador.
// Uso: node tools/tests/glyphs.js
'use strict';
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', '02_font.js'), 'utf8');
const body = src.slice(src.indexOf('const GLYPHS = {') + 'const GLYPHS = '.length);
const GLYPHS = eval('(' + body.slice(0, body.indexOf('\n};') + 2) + ')');
const rows = ch => { const d = GLYPHS[ch]; if (!d) throw new Error('falta el glifo ' + ch); const m = d.match(/^(-?\d+):(.*)$/); const r = (m ? m[2] : d).split('|'); const w = Math.max(...r.map(x => x.length)); return r.map(x => x.padEnd(w, '.')); };
const mirror = r => r.map(x => x.split('').reverse().join(''));
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FALLO') + ' ' + msg); if (!cond) fails++; };

// 1) parejas que deben ser espejo exacto la una de la otra
for (const [a, b] of [['↰', '↱'], ['↺', '↻'], ['←', '→'], ['↖', '↗'], ['◀', '▶']])
  ok(JSON.stringify(mirror(rows(a))) === JSON.stringify(rows(b)), `${a} es el espejo de ${b}`);

// 2) → apunta a la derecha: la fila más llena termina en la última columna y las puntas quedan detrás
{ const r = rows('→'); const i = r.map(x => (x.match(/#/g) || []).length).reduce((bi, n, k, arr) => n > arr[bi] ? k : bi, 0); const last = r[i].length - 1;
  ok(r[i][last] === '#' && r[i - 1].lastIndexOf('#') < last && r[i + 1].lastIndexOf('#') < last, '→ apunta a la derecha'); }

// 3) ↱ = avanzar y torcer a la DERECHA: barra superior con punta en la derecha y mástil a la izquierda
{ const r = rows('↱'); const bar = r.findIndex(x => /^#+$/.test(x)); const last = r[bar].length - 1;
  ok(bar >= 1 && r[bar - 1][last - 1] === '#' && r[bar + 1][last - 1] === '#' && r.slice(bar + 1).every(x => x[0] === '#'), '↱ gira a la derecha (punta a la derecha, mástil a la izquierda)'); }

// 4) ↻ = sentido horario: la punta está en el lado IZQUIERDO y apunta hacia ARRIBA
{ const r = rows('↻'); const head = r.findIndex(x => x.startsWith('###'));
  ok(head > 0 && r[head - 1].slice(0, 3) === '.#.', '↻ gira en sentido horario (punta izquierda hacia arriba)'); }

// 5) las etiquetas de los giros usan la flecha correcta
const puerto = fs.readFileSync(path.join(__dirname, '..', '..', 'src', '20_lv_puerto.js'), 'utf8');
ok(/girar_der: \{ label: 'girar_der ↱'/.test(puerto), "girar_der se dibuja con ↱");
ok(/girar_izq: \{ label: 'girar_izq ↰'/.test(puerto), "girar_izq se dibuja con ↰");
// y el mundo de cuadrícula gira en el sentido que dice la etiqueta (x → derecha, y ↓ abajo)
const worlds = fs.readFileSync(path.join(__dirname, '..', '..', 'src', '14_worlds.js'), 'utf8');
ok(/DIRS = \[\[1, 0\], \[0, 1\], \[-1, 0\], \[0, -1\]\]/.test(worlds) && /'girar_der'\) \{ st\.dir = \(st\.dir \+ 1\) % 4/.test(worlds), 'girar_der pasa de → a ↓ (horario en pantalla)');

console.log(fails ? `${fails} FALLO(S)` : 'TODAS LAS FLECHAS OK');
process.exitCode = fails ? 1 : 0;
