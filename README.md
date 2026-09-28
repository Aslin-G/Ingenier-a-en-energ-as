# Lumina Loop: El Código de los Elementos

Videojuego educativo de plataformas y puzzles en **pixel art animado**, escrito en **HTML5 + Canvas 2D + JavaScript puro** (sin bibliotecas, sin imágenes ni sonidos externos y sin red). Enseña **pensamiento algorítmico** y **energías renovables** a partir de una historia: el archipiélago Aurora sufre un apagón y Lía, una aprendiz de técnica, tiene que reparar su red eléctrica escribiendo algoritmos.

> Todo el arte (sprites, retratos, fondos parallax, iluminación) y toda la música y los efectos se generan por código al iniciar el juego.

---

## Cómo jugar

1. Abre **`lumina_loop.html`** en un navegador moderno (Chrome, Edge, Firefox o Safari). Funciona sin conexión y desde `file://`.
2. Elige **NUEVA PARTIDA**. La partida se guarda sola en `localStorage` (clave `luminaLoopSave`).
3. `index.html` solo redirige a `lumina_loop.html`, así que el juego se puede publicar tal cual en GitHub Pages o en cualquier servidor estático.

### Controles

| Acción | Teclado | Mando |
|---|---|---|
| Moverse | ← → / A D | Stick / cruceta |
| Subir/bajar escaleras, nadar | ↑ ↓ / W S | Stick / cruceta |
| Saltar (mantener = más alto / planear) | Espacio / Z / K | A |
| Correr | Shift | Gatillos (LT/RT) |
| Hablar / usar | E / X / J | X |
| Volver / cancelar | Esc / Retroceso | B |
| Usar habilidad | Q / L | Y |
| Cambiar de habilidad | R | R3 (pulsar stick derecho) |
| **Lente Debug** | F | LB |
| Blueprint (tu último algoritmo) | B | L3 (pulsar stick izquierdo) |
| Atlas Aurora | C | Select / Back |
| Pista de PÍX | H | RB |
| Pausa | Esc / P | Start |

- **Táctil**: en móvil o tableta aparece una cruceta virtual y botones de acción; en los puzzles se puede arrastrar o tocar para *seleccionar y colocar*.
- Todas las teclas se pueden **remapear** en *Ajustes → Remapear teclas*.

---

## Qué hay dentro

### Campaña: 11 islas, un concepto de programación y una energía en cada una

| # | Isla | Algoritmos | Energía | Habilidad nueva |
|---|---|---|---|---|
| 0 | Festival de las Mil Luces (prólogo) | Secuencia de arranque | Flujo de energía | — |
| 1 | Puerto Inicial | Secuencias | Flujo de energía | **Debug Lens** |
| 2 | Valle Secuencia | Secuencia y depuración, variables | Conversión | **Step Spark** |
| 3 | Solaria | Variables y SI / SINO | Solar | **If Shield** |
| 4 | Aeris | Bucles (MIENTRAS, REPETIR) | Eólica | **Loop Glide** |
| 5 | Cascadas Hydria | Funciones y parámetros | Hidroeléctrica | **Function Portal** |
| 6 | Bosque BioLoop | Listas y recorridos | Biomasa | **Array Pack** |
| 7 | Gea Profunda | Máquinas de estados | Geotermia | **State Shift** |
| 8 | Bahía H2 | Pipelines | Hidrógeno verde | **Pipeline Beam** · PÍX aprende **Predict** |
| 9 | Ciudad Batería | Búsqueda y ordenamiento | Almacenamiento | **Priority Dash** |
| 10 | Microred Prisma | Integración | Microred | — |
| 11 | Faro Aurora | Todo | Sistema híbrido | **Aurora Link** |

Cada habilidad es un concepto que se *juega* además de programarse: el **If Shield** solo te protege si se cumple la condición que le pusiste, el **Loop Glide** te mantiene en el aire *mientras* haya corriente, el **Array Pack** guarda objetos por índice, el **State Shift** solo acepta transiciones válidas, etc.

### Tipos de puzzle

- **CodeLab**: editor de bloques **sin arrastrar**. Cada reto trae las instrucciones necesarias ya armadas: el estudiante las **ordena** (toca una línea y la mueve con ▲ ▼), **ajusta los números** con − + y **toca los valores** para cambiarlos. Tocar un bloque de la izquierda lo añade bajo la línea marcada y ✗ borra. Tiene intérprete real: `SI/SINO`, `REPETIR`, `MIENTRAS`, `PARA CADA`, variables, funciones con parámetros y retorno. Tiene ejecución paso a paso, puntos de interrupción, traza, vista de variables, detección de bucles infinitos y **vista de diagrama de flujo** del mismo programa.
- **Secuencias**: tocar las tarjetas de procesos energéticos en orden (cada una va a la siguiente casilla; tocar una casilla la vacía) y detectar la tarjeta intrusa.
- **Diagrama de flujo**: el controlador solar viene armado; se tocan los nodos de acción para cambiarlos, ⇄ intercambia las salidas SÍ/NO y el umbral se ajusta con − +.
- **Máquina de estados**: dibujar transiciones válidas de una planta geotérmica.
- **Ordenar y buscar**: burbuja con conteo de comparaciones, búsqueda binaria.
- **Microred**: reglas priorizadas que se simulan hora a hora en varios escenarios (día típico, festival nocturno, día sin sol, tormenta).
- **Objetivo multicriterio**: el combate final consiste en *reescribir la función objetivo* de Perfect Zero.
- **Preguntas de razonamiento** con explicación de cada opción.

Cada reto pasa por **DEMO → LO HACEMOS JUNTOS → TÚ SOLO**, ofrece **pistas en 3 niveles** (idea, concepto, solución parcial) y, si se activa, pregunta **«¿qué tan seguro estás?»** antes de ejecutar. Los errores explican *por qué* falló el programa y qué pasó en el mundo simulado.

### Meta-juego

- **Atlas Aurora**: 66 entradas (algoritmos, energías, personajes, islas y misterios) que se desbloquean jugando, no antes.
- **Lente Debug** (F): muestra variables, estados y secretos ocultos en el escenario.
- **Blueprint** (B): tu último algoritmo como un plano.
- **Mapa del archipiélago** con viajes animados (barca solar, planeador, teleférico, tranvía...).
- **Misiones**: 12 principales y 20 secundarias. **22 Chispas de Aurora** escondidas y **18 pegatinas** (logros).
- **Mapa de dominio estimado**: progreso por concepto y por energía (presentado como una estimación, nunca como una nota).
- **Taller de Lía**: recuerdos de cada isla, pegatinas y cosméticos.
- **Aurora Lab** (tras el final): sandbox de microred para experimentar sin penalización y comparar experimentos.

### Modo docente

Desde el menú principal, sin necesidad de cuenta y sin que nada salga del navegador:

- **Elegir isla**: abre cualquier región (marca como restauradas las anteriores y concede sus habilidades).
- **Lanzar reto**: filtra el banco de **115 retos** por concepto y energía.
- **Ver dominio** y **resumen local** (retos resueltos, al primer intento, pistas, bucles infinitos, errores con alta confianza...).
- Acceso directo al **Aurora Lab** y reinicio del progreso.

### Accesibilidad

Volumen de música y efectos, velocidad del texto (incluida instantánea), **subtítulos de sonidos**, **alto contraste**, **reducir destellos**, **reducir sacudidas**, **modo sin tiempo**, controles táctiles (auto/siempre/nunca), escalado de píxel entero y remapeo de teclas. Todos los menús se pueden usar con teclado, mando, ratón o pantalla táctil.

---

## Estructura del proyecto

```
lumina_loop.html        ← el juego completo (un solo archivo, generado)
index.html              ← lanzador que redirige a lumina_loop.html
src/
  shell.html            plantilla HTML (lienzo 480×270 y estilos)
  01_core.js            lienzo, paleta, utilidades, entrada (teclado, puntero, táctil, mando)
  02_font.js            fuente bitmap propia con acentos y marcado de color
  03_audio.js           Web Audio: efectos procedurales y música generativa por capas
  04_save.js            estado global, guardado, dominio, XP, logros, habilidades
  05_gfx.js             primitivas, partículas, iluminación, transiciones, avisos
  06_sprites.js         sprites animados y retratos generados por código
  07_worldart.js        temas de cada isla, tiles y fondos parallax
  08_ui.js              UI inmediata con foco de teclado/mando y arrastrar/soltar
  09_dialogue.js        diálogos con retratos, globos, cinemáticas con generadores
  10_world.js           niveles, física de plataformas, Lía, PÍX y Lumi
  11_entities.js        entidades interactivas (plataformas, puertas, enemigos...)
  12_props.js           decorado animado (molinos, paneles, turbinas, faro...)
  13_codelab.js         editor de bloques, intérprete, traza y diagrama de flujo
  14_worlds.js          simulaciones de cada reto (rejilla, solar, eólica, hidro...)
  15_puzzles_a.js       secuencias, diagramas de flujo, máquinas de estados
  16_puzzles_b.js       ordenar/buscar, microred, objetivo, preguntas, habilidades
  17_scenes.js          escenas: título, mapa, pausa, Atlas, ajustes, docente, Lab...
  18_codex.js           Atlas Aurora, Chispas y misiones
  19_story_common.js    utilidades de historia y constructor de niveles
  20_… 26_lv_*.js       las islas (niveles, diálogos y puzzles)
  29_challenges.js      banco de 115 retos del modo docente
  30_lv_faro.js         Faro Aurora, Perfect Zero, final y créditos
  99_main.js            bucle de 60 Hz de paso fijo y arranque
tools/
  build.js              concatena src/ en lumina_loop.html
  tests/                pruebas automáticas con Playwright
docs/                   especificación original, biblia de historia y documento de diseño
```

### Compilar

No hay dependencias. Con Node.js 16 o superior:

```bash
node tools/build.js      # o: npm run build
```

Los módulos `src/NN_*.js` se concatenan en orden numérico dentro de una única función autoejecutable y se insertan en `src/shell.html`.

### Pruebas automáticas

Requieren [Playwright](https://playwright.dev/) (local o global) con Chromium:

```bash
node tools/tests/glyphs.js    # comprueba que las flechas de la fuente apuntan bien (sin navegador)
node tools/tests/levels.js    # carga los 14 niveles y guarda capturas
node tools/tests/puzzles.js   # resuelve los puzzles principales y construye los 115 retos
node tools/tests/presets.js   # cada reto de código empieza armado pero sin resolver, y su solución funciona
node tools/tests/walk.js      # recorre la campaña completa hasta el epílogo
node tools/tests/menus.js     # abre todas las pantallas de menú
```

Las capturas se guardan en la carpeta temporal del sistema (`lumina_loop_tests/`), o en la que indique `LUMINA_OUT`.

Para depurar: `lumina_loop.html#level=solaria` abre directamente un nivel, y `window.LL` expone el estado del juego en la consola.

---

## Documentación

- [`docs/DISENO.md`](docs/DISENO.md): documento de diseño (pilares, mapa de niveles, conceptos, emociones y revelaciones, pedagogía y arquitectura).
- [`docs/LUMINA_LOOP_STORY_BIBLE.md`](docs/LUMINA_LOOP_STORY_BIBLE.md): biblia de historia original.
- [`docs/LUMINA_LOOP_AGENT_IMPLEMENTATION.md`](docs/LUMINA_LOOP_AGENT_IMPLEMENTATION.md): especificación técnica y pedagógica original.
