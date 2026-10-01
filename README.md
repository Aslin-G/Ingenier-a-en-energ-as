# Lumina Loop: El Código de los Elementos

**Autor: Aslin Gonzalo Botello Plata** · © 2026. Toda copia, adaptación, versión derivada o uso como referencia (también por sistemas de inteligencia artificial) debe reconocer su autoría. Ver [`AUTORIA.md`](AUTORIA.md).

Videojuego educativo de plataformas, combate y puzzles en **pixel art animado**, escrito en **HTML5 + Canvas 2D + JavaScript puro** (sin bibliotecas, sin imágenes ni sonidos externos y sin red). Enseña **pensamiento algorítmico** y **energías renovables** a partir de una historia: el archipiélago Aurora sufre un apagón y Lía, una aprendiz de técnica, tiene que reparar su red eléctrica escribiendo algoritmos.

> Todo el arte (sprites, retratos, fondos parallax, iluminación) y toda la música y los efectos se generan por código al iniciar el juego.

---

## Cómo jugar

1. Abre **`index.html`** (o `lumina_loop.html`, que es el mismo juego) en un navegador moderno (Chrome, Edge, Firefox o Safari). Funciona sin conexión y desde `file://`.
2. Elige **NUEVA PARTIDA** y **regístrate**: escribe tus nombres y apellidos (al menos un nombre y un apellido; tu primer nombre será el de la protagonista) y marca los **tres consentimientos** para que tus datos de juego se envíen a la hoja de cálculo de tu docente. La partida se guarda sola en `localStorage` (clave `luminaLoopSave`).
3. **Publicación automática**: cada vez que se sube un cambio, el flujo `.github/workflows/publicar.yml` compila `src/`, comprueba que `index.html` y `lumina_loop.html` son idénticos y publica en GitHub Pages. Si en *Settings → Pages → Source* está elegido «GitHub Actions», despliega directamente; si está «Deploy from a branch», pide a Pages que reconstruya la rama.

### Controles

| Acción | Teclado | Mando |
|---|---|---|
| Moverse | ← → / A D | Stick / cruceta |
| Subir/bajar escaleras, nadar | ↑ ↓ / W S | Stick / cruceta |
| Saltar (mantener = más alto / planear) | Espacio / Z / K | A |
| Correr | Shift | Gatillos (LT/RT) |
| **Atacar con el Lumisable** (mantener = pulso cargado) | X / J | X |
| **Agacharse** (los disparos altos pasan por encima; por túneles bajos se avanza gateando) | mantener ↓ | Stick abajo |
| **Gancho** (en el suelo: salta golpeando hacia arriba) / tajo hacia arriba en el aire | ↑ + ataque | Stick arriba + X |
| **Barrida** (en el suelo: se desliza agachada con el sable a ras de suelo) / rebote en el aire | ↓ + ataque | Stick abajo + X |
| Recargar una célula (quieta y agachada) | mantener ↓ | Stick abajo |
| Hablar / usar | E (o ataque si no hay peligro cerca) | B (o X) |
| Volver / cancelar | Esc / Retroceso | B |
| Usar habilidad | Q / L | Y |
| Cambiar de habilidad | R | R3 (pulsar stick derecho) |
| **Lente Debug** (golpes críticos, programa de los jefes) | F | LB |
| Blueprint (tu último algoritmo) | B | L3 (pulsar stick izquierdo) |
| Atlas Aurora | C | Select / Back |
| Cartas del Atlas (en el mapa) | R | — |
| Pista de PÍX | H | RB |
| Pausa (y **PODERES**: los poderes conseguidos) | Esc / P | Start |
| Doble salto · torbellino · embestida (poderes) | Salto en el aire · Salto + ataque en el aire · Correr + ataque | A · A + X · gatillo + X |

- **Táctil**: en móvil o tableta aparece una cruceta virtual y botones de acción (⚔ ataca); en los puzzles basta con tocar.
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

### Combate: el Lumisable y los jefes

Lumi concentra su luz en una hoja: el **Lumisable**. Los enemigos son programas corrompidos por el apagón y, al vencerlos, se **depuran** y vuelven a ser criaturas felices.

- **Combo de 3 tajos**, **gancho** (↑ + ataque en el suelo: Lía salta con un arco de luz en forma de gancho), **barrida** (↓ + ataque en el suelo: se desliza agachada y golpea a ras de suelo), tajo hacia arriba y **rebote (pogo)** en el aire, **pulso cargado** (mantener el ataque) y **parada**: golpear un proyectil justo a tiempo lo devuelve a quien lo lanzó. Con ↓ **se agacha** (caja más baja: los disparos altos pasan por encima) y gatea por los túneles bajos. Lía mira hacia donde camina y su sprite se dibuja a doble resolución.
- **Energía** (ahora más exigente): se gana golpeando (6 por golpe) y con orbes; sola solo sube **hasta 50 y despacio** (4,5/s, menos a oscuras) y **se pausa 2,2 s** después de gastarla. El pulso cuesta 35, el torbellino 12 y la embestida 15. Quieta y agachada, Lumi convierte 50 de energía en una **célula**. El **escudo IF** bloquea golpes, pero **cada golpe le quita un tercio de la energía: al tercero se rompe**. Con la **Lente Debug** activa cada golpe es **crítico**.
- **Derrota con cinemática** (unos 5 s antes de poder continuar): el mundo se congela y la última célula se rompe sobre Lía; cae a cámara lenta, Lumi parpadea y se apaga y el mundo pierde el color; el círculo de visión se cierra con «Lía se quedó sin energía...» y aparece la tarjeta **MISIÓN FALLIDA** (qué la venció, un consejo y que volverá al último punto de control). Solo pasado un momento E la devuelve al punto de control.
- **Mini jefes a mitad de cada isla** (10): Cangrejo Voltio, Espantapájaros Bug, Girasol Sobrecargado, Halcón Bucle, Anguila Compuerta, Hongo Recursivo, Magmita, Medusa de Presión, Rata Cortocircuito y Cristal Errante. Al entrar en su zona se cierran dos barreras de luz; cada uno avisa antes de atacar, ejecuta su patrón (embestidas, saltos, disparos, picados) y **descansa** (golpe +1). Al depurarlo da un **núcleo de forja**; si Lía cae, el combate vuelve a empezar.
- **Enemigos con personalidad** en todas las islas, con los colores de su región: Bit Saltarín, Zumbyte, Toro-Ohm, Torretín, más los enemigos conceptuales (Bugglin, Loopling, Shadow If, Drainer...). Con la Lente muestran su algoritmo.
- **Un jefe al final de cada isla**, que *ejecuta un algoritmo* del concepto de esa isla: con la Lente se lee su programa con la línea actual resaltada. Tienen **seis veces su vida base** y **tres fases**: a 2/3 de vida reescribe su código y hay que aplicarle un **parche** (una pregunta rápida) para ralentizarlo; a 1/3 entra en **FURIA** y pide un **PARCHE FINAL** (predecir el resultado de un programa nuevo, generado como en las cerraduras).
- **ERROR CRÍTICO**: si un parche falla, el jefe lanza su **ataque especial** (Lluvia de chatarra, Tormenta de rayos, Triple chorro, Erupción total...): columnas de rayos, lluvia de bloques de error, chorros que obligan a saltar o a quedarse abajo, u ondas por el suelo. Siempre hay aviso («!» y marcas en el suelo) y un hueco seguro; cada golpe cuesta una célula **y 20 de energía** (se ve «−1 célula · −20 energía») y, al terminar, el jefe queda **sobrecalentado** (momento para golpearlo). En FURIA lo repite cada dos ciclos de su programa (cada tres si el parche final salió perfecto). El parche se puede volver a intentar en cada combate.
- **Arte HD de los jefes**: cada jefe se dibuja a resolución de pantalla con detalle de medio píxel (remaches, brillos de metal, reflejos de cristal, texturas de roca, grietas de lava), brillos y sombras en los bordes, volumen, **aura por fase** (roja y palpitante en FURIA) y sombra en el suelo. Si el equipo va lento, el acabado se simplifica solo.

| Isla | Jefe | Concepto que ejecuta |
|---|---|---|
| Puerto Inicial | Capitán Cortocircuito | Secuencia |
| Valle Secuencia | Gran Bugglin Rey | Depuración |
| Solaria | Don Nubarrón | SI / SINO |
| Aeris | Tornado Loopling | Bucle MIENTRAS |
| Cascadas Hydria | Hidra de Compuertas | Funciones con parámetro |
| Bosque BioLoop | Compostor Glotón | Listas e índices |
| Gea Profunda | Magmatón | Máquina de estados |
| Bahía H2 | Kraken de Fugas | Pipeline |
| Ciudad Batería | Drenadora Suprema | Búsqueda del mínimo / orden |
| Microred Prisma | Sobrecarga | Integración |
| Faro Aurora | Perfect Zero | La función objetivo |

Al vencerlos se vuelven amistosos, entran en el **Bestiario** del Atlas, dejan un **fragmento de célula** (3 fragmentos = +1 célula máxima) y **enseñan un poder nuevo del Lumisable**. Tras dos derrotas, PÍX ofrece la **ayuda de combate** (+2 células, jefes más lentos y con cuatro veces su vida base en vez de seis).

### Poderes del Lumisable: uno por cada jefe depurado

Cada poder es el concepto de la isla convertido en una forma de jugar. Se presentan con una tarjeta al vencer al jefe y se consultan en **Pausa → PODERES** (las partidas anteriores reciben los poderes de los jefes que ya vencieron).

| Jefe | Poder | Concepto | Cómo se usa |
|---|---|---|---|
| Capitán Cortocircuito | **Doble salto** | Secuencia: `saltar() → saltar()` | Salto otra vez en el aire |
| Gran Bugglin Rey | **Punto de interrupción** | Depuración | Con 1 célula el mundo va a cámara lenta 4 s (una vez por punto de control) |
| Don Nubarrón | **Rayo solar** | `SI pulso_cargado → daño × 2` | El pulso cargado es más grande y hace el doble de daño |
| Tornado Loopling | **Tajo torbellino** | `REPETIR 3 VECES: girar + tajo` | En el aire, mantener SALTO y atacar |
| Hidra de Compuertas | **Pulso doble** | Funciones: `pulso(delante) · pulso(detrás)` | El pulso cargado sale hacia los dos lados |
| Compostor Glotón | **Célula extra** | Listas: `células.agregar(1)` | +1 célula máxima |
| Magmatón | **Estado sobrecarga** | Estados | Con la energía llena el sable hace +1 de daño hasta bajar de 70 |
| Kraken de Fugas | **Embestida de luz** | Pipeline: `correr → impulso → tajo` | Corriendo, atacar: embiste sin recibir daño |
| Drenadora Suprema | **Rayo buscador** | Búsqueda: `enemigo_más_cercano()` | El pulso cargado persigue al enemigo más cercano |
| Sobrecarga | **Recarga solar** | Microred: `MIENTRAS energía < 100: +2/s` | La energía se recarga sola hasta llenarse (también por encima de 50) |

### Simuladores de energía

Un quiosco **SIM** cerca del inicio de cada isla de energía abre un simulador con **mandos**, **misiones visibles** (✓ al cumplirlas, con la explicación de por qué), **variables** y una **gráfica en vivo**. Cada uno une una energía renovable con un concepto de programación, con física simplificada pero real:

| Isla | Simulador | Energía | Programación |
|---|---|---|---|
| Solaria | Panel de pruebas | Solar: mejor inclinación ≈ 90° − altura del sol; con el sol bajo la luz cruza más atmósfera y llega menos | Variables |
| Aeris | Aerogenerador | Eólica: P crece con v³, orientación, paso de pala, tormenta | `SI viento > 25 ENTONCES bandera` en un bucle |
| Hydria | Presa | Hidro: `potencia(caudal, altura) = 9,8 × Q × H × 0,9` | Función con dos parámetros |
| BioLoop | Biodigestor | Biomasa: bacterias a 37 °C, acidez por sobrecarga | La cola (lista) de residuos |
| Gea | Pozo geotérmico | Geotermia: extracción (t/h), reinyección, presión y temperatura que sube con la profundidad | Máquina de estados |
| Bahía H2 | Cadena del hidrógeno | Hidrógeno verde: de 100 kWh de sol vuelven ≈ 35 | Pipeline de etapas |

Ninguna misión se cumple sola y los errores típicos (no poner las palas en bandera, inundar el pueblo, empachar el digestor...) tienen consecuencias visibles. El primero de cada simulador da un **núcleo de forja**, y todos se pueden repetir en el **Laboratorio de simuladores** del Taller.

### Aprender jugando: cerraduras, cartas y forja

- **Cerraduras de código** (en todas las islas): cofres sellados con un programa corto del concepto de la isla. Lía lee el código en un holograma, **predice el resultado** y golpea con el Lumisable (o elige con E) el cristal correcto. Cada opción incorrecta es un **error típico** (contar desde 1, una vuelta de menos, ejecutar las dos ramas de un SI, olvidar el valor inicial, cambiar el orden de un pipeline...). Si falla, el programa se **ejecuta paso a paso** con la explicación del error y llega una **variante nueva** con otros números. Con la Lente Debug el holograma da una pista.
- **Cartas del Atlas con repaso espaciado**: cada concepto practicado se vuelve una carta coleccionable (NUEVA → BRONCE → PLATA → ORO). El **repaso relámpago** sigue el sistema de Leitner: acertar aleja el siguiente repaso (10 min, 1 día, 3, 7 y 21 días) y fallar lo acerca, porque recordar justo antes de olvidar es lo que fija lo aprendido. Hay combo, XP y **racha de días**. En el mapa, el botón **CARTAS** (tecla R) avisa cuando hay cartas pendientes.
- **Reto del día**: el mismo reto del banco para toda la clase. Al superarlo aparece un **código de 4 cifras** que el modo docente también muestra, para comprobarlo en clase.
- **Forja del Lumisable** (en el Taller): siete mejoras del sable que son conceptos (*alcance ← alcance + 5*, *Filtro SI* para parar mejor, *bucle de energía*, *función pulso()* más barata, *lista de células*, *estado GUARDIA*, *tajo ordenado*). Se pagan con **núcleos de forja** (cerraduras, mini jefes, simuladores, patio de entrenamiento, repaso diario y reto del día) y se forjan **respondiendo bien una pregunta** del concepto; fallar no cuesta núcleos.

### Tipos de puzzle

- **CodeLab**: editor de bloques **sin arrastrar**. Cada reto trae las instrucciones necesarias ya armadas: el estudiante las **ordena** (toca una línea y la mueve con ▲ ▼), **ajusta los números** con − + y **toca los valores** para cambiarlos. Tocar un bloque de la izquierda lo añade bajo la línea marcada y ✗ borra. Tiene intérprete real: `SI/SINO`, `REPETIR`, `MIENTRAS`, `PARA CADA`, variables, funciones con parámetros y retorno. Tiene ejecución paso a paso, puntos de interrupción, traza, vista de variables, detección de bucles infinitos y **vista de diagrama de flujo** del mismo programa.
- **Secuencias**: tocar las tarjetas de procesos energéticos en orden (cada una va a la siguiente casilla; tocar una casilla la vacía) y detectar la tarjeta intrusa.
- **Diagrama de flujo**: el controlador solar viene armado; se tocan los nodos de acción para cambiarlos, ⇄ intercambia las salidas SÍ/NO y el umbral se ajusta con − +.
- **Máquina de estados**: dibujar transiciones válidas de una planta geotérmica.
- **Ordenar y buscar**: burbuja con conteo de comparaciones, búsqueda binaria.
- **Microred**: reglas priorizadas que se simulan hora a hora en varios escenarios (día típico, festival nocturno, día sin sol, tormenta).
- **Objetivo multicriterio**: el combate final consiste en *reescribir la función objetivo* de Perfect Zero.
- **Preguntas de razonamiento** con explicación de cada opción.
- **Simuladores**: experimentos con mandos y misiones (ver arriba).

Cada reto da de **1 a 3 estrellas** (3 = a la primera y sin pistas) y guarda el **récord**, para que valga la pena repetirlo. La búsqueda binaria muestra el rango que queda y su medio, y la microred enseña la previsión de demanda y sol antes de simular.

Cada reto pasa por **DEMO → LO HACEMOS JUNTOS → TÚ SOLO**, ofrece **pistas en 3 niveles** (idea, concepto, solución parcial) y, si se activa, pregunta **«¿qué tan seguro estás?»** antes de ejecutar. Los errores explican *por qué* falló el programa y qué pasó en el mundo simulado.

### Meta-juego

- **Atlas Aurora**: 87 entradas (algoritmos, energías, personajes, islas, misterios y **bestiario** de enemigos y jefes) que se desbloquean jugando, no antes.
- **Lente Debug** (F): muestra variables, estados y secretos ocultos en el escenario.
- **Blueprint** (B): tu último algoritmo como un plano.
- **Mapa del archipiélago ilustrado** (a doble resolución): cada isla tiene su propia ilustración animada que representa su tema y su energía (el faro y los muelles del Puerto, el molino y los cultivos del Valle, los paneles y la torre solar de Solaria, las islas flotantes con turbinas de Aeris, las cascadas de Hydria, la selva y los biodigestores de BioLoop, el volcán y la planta geotérmica de Gea, los tanques de hidrógeno de la Bahía H2, los rascacielos-batería de neón, la torre-prisma de la microred y el gran Faro Aurora). Las islas aparecen **apagadas** hasta restaurarlas y **cubiertas de niebla** hasta descubrirlas; los viajes siguen rutas marítimas animadas.
- **Misiones**: 12 principales y 20 secundarias. **22 Chispas de Aurora** escondidas y **29 pegatinas** (logros).
- **Mapa de dominio estimado**: progreso por concepto y por energía (presentado como una estimación, nunca como una nota).
- **Taller de Lía**: una habitación ilustrada y viva. Por la **ventana** se ve el archipiélago de noche (cada isla restaurada enciende sus luces); en los estantes, **11 recuerdos animados** (faro, molinillo, mini panel, cometa, frasco de cascada...) que muestran **un dato real de su energía**; un **tablero de corcho** con las pegatinas (cada una explica cómo se consigue); el **armario** de cosméticos; la **casa solar** (de noche el panel no genera y la casa usa la batería) y una **lámpara LED** que se puede apagar. Desde aquí se va al **patio de entrenamiento**, al **Laboratorio de simuladores** y a la **Forja del Lumisable**.
- **Patio de entrenamiento**: una lista de movimientos para practicar contra muñecos que no se rompen (agacharse en un túnel, combo, barrida, gancho a un dron, rebote sobre una seta, pulso a una diana, recarga y los poderes que se tengan), con cronómetro y récord. La primera vez da un núcleo de forja y una pegatina.
- **Escenarios con subsuelo**: el interior del terreno tiene estratos y lo que hay bajo tierra en cada isla (raíces y fósiles, cables enterrados, cristales, acuíferos, vetas de magma, tuberías, circuitos), hierba que cuelga de los bordes y decoraciones propias (vallas, fardos, cactus, juncos, troncos, estalagmitas, barriles...).
- **Aurora Lab** (tras el final): sandbox de microred para experimentar sin penalización y comparar experimentos.

### Registro del estudiante y seguimiento para el docente

- Al empezar una partida (o al continuar una sin estudiante) aparece el **REGISTRO DEL ESTUDIANTE**: nombres y apellidos (con tildes y ñ; el teclado del móvil funciona) y **tres consentimientos** que hay que marcar: (1) que los datos de juego se envían a una hoja de cálculo de Google Drive del docente; (2) que el docente los usará para ver el rendimiento y calificar; (3) que, si es menor de edad, su madre, padre o acudiente lo conoce y autoriza.
- El primer nombre sustituye a «Lía» en toda la historia y el nombre completo aparece en los créditos.
- Con los consentimientos aceptados, el juego anota la actividad (sesiones, niveles, retos con estrellas, errores y pistas, programas finales, cerraduras, cartas, forja, logros, misiones, islas, jefes, derrotas) y la envía por lotes a la hoja del docente. En el **menú de pausa** se ve siempre «tu progreso se comparte con tu docente».
- Para conectarlo con tu hoja de cálculo sigue [`tools/google-sheets/LEEME.md`](tools/google-sheets/LEEME.md) (Google Apps Script, una sola vez) y pega la URL en `REGISTRO_URL` (`src/04_registro.js`). Sin URL, los eventos esperan guardados en cada dispositivo.

### Modo docente

Desde el menú principal, sin necesidad de cuenta y sin que nada salga del navegador:

- **Elegir isla**: abre cualquier región (marca como restauradas las anteriores y concede sus habilidades).
- **Lanzar reto**: filtra el banco de **115 retos** por concepto y energía.
- **Luchar contra un jefe**: abre directamente la arena de cualquiera de los 10 jefes (también como revancha).
- **Ver dominio** y **resumen local** (retos resueltos, al primer intento, pistas, bucles infinitos, errores con alta confianza...).
- Acceso directo al **Aurora Lab** y reinicio del progreso.
- El **código del reto del día** aparece al pie del menú docente: quien supera el reto ve el mismo código.

### Accesibilidad

**Gráficos HD** (se pueden apagar si el equipo va justo), volumen de música y efectos, velocidad del texto (incluida instantánea), **subtítulos de sonidos**, **alto contraste**, **reducir destellos**, **reducir sacudidas**, **modo sin tiempo**, **ayuda de combate** (+2 células y jefes más lentos), controles táctiles (auto/siempre/nunca), escalado de píxel entero y remapeo de teclas. Todos los menús se pueden usar con teclado, mando, ratón o pantalla táctil.

### Gráficos: pixel art a doble resolución

- **Modo HD**: el juego se dibuja en «píxeles de juego» de 480×270 sobre un lienzo de 960×540. Una capa WebGL aplica **Scale2x** a cada bloque de 2×2: las escaleras de los bordes se redondean con píxeles la mitad de grandes, así personajes, enemigos, textos, círculos y diagonales ganan resolución sin dejar de ser pixel art. Si el navegador no tiene WebGL, o el equipo va lento, el juego vuelve solo al dibujo normal (y se puede apagar en Ajustes).
- **Cielos a doble resolución** con degradado continuo, halo del sol, luna creciente y estrellas de medio píxel que titilan.
- **Perspectiva aérea**: las capas lejanas del fondo se funden con el cielo, tienen el borde iluminado por el sol y niebla baja entre cordilleras.
- **Volumen**: montañas facetadas con nieve, lomas con matorrales, copas de árboles y nubes sombreadas como esferas con tramado, cuevas con estalactitas y cristales facetados; el terreno se oscurece hacia el interior de la roca.
- **Luz y agua**: iluminación a resolución de juego, rayos de sol y resplandores con degradado real, viñeta suave, sombras de contacto bajo los personajes y agua con profundidad, destellos y cáusticas.

---

## Estructura del proyecto

```
index.html              ← el juego completo (un solo archivo, generado): lo que publica GitHub Pages
lumina_loop.html        ← copia idéntica de index.html (enlaces antiguos)
.nojekyll               ← GitHub Pages publica los archivos tal cual
.github/workflows/      ← publicación automática en GitHub Pages
src/
  shell.html            plantilla HTML (lienzo de 960×540, capa HD y estilos)
  01_core.js            lienzo, paleta, utilidades, entrada (teclado, puntero, táctil, mando)
  02_font.js            fuente bitmap propia con acentos y marcado de color
  03_audio.js           Web Audio: efectos procedurales y música generativa por capas
  04_save.js            estado global, guardado, dominio, XP, logros, habilidades
  05_gfx.js             primitivas, partículas, iluminación, transiciones, avisos
  05_hd.js              modo HD: posprocesado WebGL (Scale2x por bloques de 2×2)
  06_sprites.js         sprites animados y retratos generados por código
  07_worldart.js        temas de cada isla, tiles y fondos parallax
  07_worldhd.js         cielos HD, perspectiva aérea, volumen, terreno, agua y viñeta
  08_ui.js              UI inmediata con foco de teclado/mando y arrastrar/soltar
  09_dialogue.js        diálogos con retratos, globos, cinemáticas con generadores
  10_world.js           niveles, física de plataformas, Lía, PÍX y Lumi
  11_entities.js        entidades interactivas (plataformas, puertas, enemigos...)
  12_combat.js          Lumisable, proyectiles, botín y enemigos nuevos
  12_powers.js          poderes del Lumisable (uno por jefe), tarjeta y pantalla PODERES
  12_props.js           decorado animado (molinos, paneles, turbinas, faro...)
  13_codelab.js         editor de bloques, intérprete, traza y diagrama de flujo
  14_worlds.js          simulaciones de cada reto (rejilla, solar, eólica, hidro...)
  15_puzzles_a.js       secuencias, diagramas de flujo, máquinas de estados
  16_puzzles_b.js       ordenar/buscar, microred, objetivo, preguntas, habilidades
  16_sims.js            simuladores: marco común (mandos, misiones, gráfica) y panel solar
  16_sims_b.js          aerogenerador, presa, biodigestor, pozo geotérmico, cadena del H2,
                        quioscos SIM en las islas y Laboratorio de simuladores
  17_scenes.js          escenas: título, mapa, pausa, Atlas, ajustes, docente, Lab...
  18_islandmap.js       ilustraciones de las islas y océano del mapa (doble resolución)
  18_codex.js           Atlas Aurora, Chispas y misiones
  19_story_common.js    utilidades de historia y constructor de niveles
  20_… 26_lv_*.js       las islas (niveles, diálogos y puzzles)
  27_bosses.js          los 10 jefes: fases, parches, ERROR CRÍTICO, acabado HD y Bestiario
  27_bosses_hd.js       detalle a medio píxel de cada jefe
  28_locks.js           cerraduras de código: preguntas de traza generadas y traza paso a paso
  29_cards.js           cartas del Atlas, repaso espaciado (Leitner) y reto del día
  29_challenges.js      banco de 115 retos del modo docente
  29_forge.js           Forja del Lumisable (mejoras del sable ligadas a conceptos)
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

Los módulos `src/NN_*.js` se concatenan en orden numérico dentro de una única función autoejecutable, se insertan en `src/shell.html` y el resultado se escribe **a la vez** en `index.html` y `lumina_loop.html`. Nunca se editan esos HTML a mano: se edita `src/` y se compila.

### Pruebas automáticas

Requieren [Playwright](https://playwright.dev/) (local o global) con Chromium:

```bash
node tools/tests/glyphs.js    # comprueba que las flechas de la fuente apuntan bien (sin navegador)
node tools/tests/levels.js    # carga los 15 niveles (con el patio) y las 10 arenas de jefe y guarda capturas
node tools/tests/puzzles.js   # resuelve los puzzles principales y construye los 115 retos
node tools/tests/presets.js   # cada reto de código empieza armado pero sin resolver, y su solución funciona
node tools/tests/bosses.js    # sable y los 10 jefes: vida ×6, 3 fases, ERROR CRÍTICO, parche fallido que cuesta célula
node tools/tests/map.js       # mapa ilustrado, viaje entre islas e index.html idéntico a lumina_loop.html
node tools/tests/hd.js        # modo HD: el filtro WebGL compila, cubre el lienzo y se puede apagar
node tools/tests/locks.js     # cerraduras de código: 3000 preguntas válidas, cofres en cada isla, fallo → traza → variante
node tools/tests/cards.js     # cartas: calendario de Leitner, racha, repaso desde el mapa, reto del día y forja
node tools/tests/sims.js      # los 6 simuladores se completan con sus mandos, no se cumplen solos y los errores no cuentan
node tools/tests/powers.js    # los 10 poderes funcionan, tarjeta y pantalla PODERES
node tools/tests/moves.js     # Lía mira a donde camina, se agacha, barrida, gancho, escudo de 3 golpes, recarga lenta y derrota
node tools/tests/minibosses.js # los 10 mini jefes: barreras, avisos, descanso, núcleo y reinicio al caer
node tools/tests/taller.js    # taller (datos de los recuerdos, lámpara) y patio: cada movimiento se marca con el teclado
node tools/tests/registro.js  # registro (nombre, 3 consentimientos), nombre en los textos y envío de eventos a un receptor simulado
node tools/tests/overlap.js   # ninguna pantalla (menús, retos, simuladores, niveles) tiene textos encima de otros
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
