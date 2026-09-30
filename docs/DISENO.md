# Lumina Loop: documento de diseño

Este documento resume cómo se llevaron al juego la **especificación técnica y pedagógica** (`LUMINA_LOOP_AGENT_IMPLEMENTATION.md`) y la **biblia narrativa** (`LUMINA_LOOP_STORY_BIBLE.md`), y qué decisiones creativas se tomaron por el camino.

---

## 1. Pilares

1. **El concepto se juega, no solo se lee.** Cada idea de programación aparece tres veces: como **mecánica de plataformas** (una habilidad), como **puzzle** (CodeLab u otro formato) y como **consecuencia en el mundo** (la isla se restaura por zonas y la música gana capas).
2. **Primero experimentar, después nombrar.** Las entradas del Atlas se desbloquean *después* de usar el concepto. Nada de definiciones antes de tiempo.
3. **El error es información.** Cada fallo explica qué hizo el programa, qué pasó en la simulación y por qué no bastó. PÍX se equivoca a propósito (y con humor) para quitarle dramatismo al error.
4. **La perfección es el antagonista.** El villano, *Perfect Zero*, quiere eliminar la incertidumbre. El mensaje final del juego es que un buen sistema no es el que nunca duda, sino el que se adapta.
5. **Energía real, con matices.** El hidrógeno es un *vector* y no una fuente, la solar depende de la radiación y del clima, la batería necesita reserva y la microred prioriza: los retos modelan esas ideas con números plausibles.

## 2. Ideas nuevas respecto a un juego educativo típico

| Idea | Cómo funciona |
|---|---|
| **Habilidades que son conceptos** | *If Shield* protege solo si se cumple la condición que le programas; *Loop Glide* sostiene el planeo *mientras* haya viento; *Array Pack* guarda objetos por índice y hay que sacarlos en orden; *State Shift* solo acepta transiciones válidas; *Pipeline Beam* exige activar los módulos en orden; *Priority Dash* embiste hacia el objetivo de mayor prioridad. |
| **Step Spark** | Programas una secuencia de pasos (→, ↗, activar...) y un eco de chispa la ejecuta en el escenario para pulsar interruptores lejanos. Una secuencia literalmente caminando. |
| **Lente Debug** | Una capa de depuración del mundo: muestra variables de las máquinas, estados de las puertas, mensajes ocultos y pistas del misterio. Es también la herramienta narrativa: los giros se descubren *mirando con la lente*. |
| **Diagrama de flujo en vivo** | Todo programa del CodeLab se puede ver como diagrama de flujo, y el nodo activo se ilumina durante la ejecución. |
| **«¿Qué tan seguro estás?»** | Antes de ejecutar se puede pedir una estimación de confianza. El juego registra los aciertos con duda y los errores con mucha seguridad (metacognición), y el logro *Humildad algorítmica* premia admitir duda. |
| **El jefe final es una función objetivo** | Tras deshacer 7 «optimizaciones» de Perfect Zero (una por concepto), la batalla final consiste en **reescribir su objetivo**: ponderar cobertura, reserva, emisiones y equidad y aceptar la incertidumbre. No hay forma de ganar maximizando un solo número. |
| **La música como indicador de progreso** | Cada isla tiene una canción generada con varias capas; al restaurar cada zona entran nuevos instrumentos. |
| **Blueprint** | Tu último algoritmo resuelto se puede consultar en cualquier momento como un plano (B). |
| **Lumisable: depurar, no destruir** | Lumi concentra su luz en una hoja. Los enemigos son programas corrompidos por el apagón: al vencerlos vuelven a ser criaturas felices (y a veces dan las gracias). |
| **Jefes que ejecutan un algoritmo** | Cada isla termina con un guardián cuyo comportamiento ES un programa del concepto de la isla. Con la Lente Debug se lee su código con la línea actual resaltada y sus variables en vivo: leer el algoritmo permite predecir el siguiente ataque. |
| **El parche a mitad de combate** | Al perder la mitad de la vida, el jefe reescribe su código. Una pregunta rápida (PARCHE) sobre ese código lo ralentiza si se acierta a la primera: comprender el programa es una ventaja jugable. |
| **La Lente como arma de estudio** | Con la Lente activa, cada golpe es crítico (+1). Mirar «por dentro» del mundo se recompensa también en combate. |

## 3. Bucle de juego

```
explorar la isla  →  encontrar una máquina apagada  →  resolver el reto (DEMO → JUNTOS → SOLO)
      ↑                                                            │
      │                                                            ▼
nueva habilidad ← zona restaurada (luz, música, NPCs) ← el mundo refleja el algoritmo
                                   │
                                   ▼
          isla restaurada → JEFE en la salida (lee su programa, parchéalo, depúralo) → mapa
```

- **Plataformas**: física de paso fijo a 60 Hz, *coyote time*, *jump buffer*, salto variable, escaleras, agua, plataformas atravesables y puntos de control.
- **Combate**: el Lumisable (ver sección 5) contra enemigos repartidos por cada isla y un jefe al final de cada una.
- **Compañeros**: **PÍX** (robot que comenta, da pistas y más tarde aprende a predecir) y **Lumi** (espíritu de luz que habla con destellos).
- **Restauración progresiva**: cada isla se divide en zonas que pasan de apagadas a iluminadas; las luces, los NPCs y las capas musicales cambian con cada una.

## 4. Mapa de niveles, conceptos, emociones y revelaciones

| Isla | Retos principales | Concepto → mecánica | Energía | Emoción dominante | Revelación |
|---|---|---|---|---|---|
| **Festival de las Mil Luces** (prólogo) | *Secuencia de arranque de LUMINA LOOP* | Secuencia | Flujo de energía | Ilusión → vergüenza | El algoritmo de Lía arranca... y el archipiélago entero se apaga. |
| **Puerto Inicial** | *Camino de instrucciones*, *El faro: flujo de energía*, *Carrera del algoritmo* | Secuencias → **Debug Lens** | Cadena captar-convertir-almacenar-usar | Culpa, primeras risas | Un mensaje firmado «▒▒▒» llegó **3 s antes** del apagón. |
| **Valle Secuencia** | *Rutas de mantenimiento*, *Variable perdida*, *Molino dormido* | Secuencia y depuración, variables → **Step Spark** | Conversión | Confianza que vuelve | El orden importa: un paso mal colocado rompe todo el proceso. |
| **Solaria** | *El controlador solar* (diagrama), *Flores solares*, *Sensor loco*, *Matriz de paneles*, *Nube inesperada* | Variables y SI/SINO → **If Shield** | Solar (radiación en W/m²) | Asombro → alarma | **Eclipse** aparece sobre el campo solar y lo desconecta justo antes de una tormenta de polvo. ¿Enemigo o algo más? |
| **Aeris** | *El molino que no para*, *Viento caprichoso*, *Bucle infinito* | Bucles → **Loop Glide** | Eólica | Vértigo, libertad | Un bucle sin salida es un peligro real (el molino se sobrecalienta). |
| **Cascadas Hydria** | *La Forja de Funciones*, *Río bloqueado*, *Función duplicada* | Funciones → **Function Portal** | Hidroeléctrica (caudal × altura) | Intriga | Grabación de **Vega**: «busca la función que todos están llamando». Es `perfectOptimize()`, 1204 llamadas por segundo. |
| **Bosque BioLoop** | *El biodigestor de Menta*, *Lista de residuos*, *Día de mercado* | Listas y recorridos → **Array Pack** | Biomasa | Calidez (abuela Menta) | **PÍX sabe cosas que no debería saber.** |
| **Gea Profunda** | *La planta sin transiciones*, *Microred aislada*, *Cristales afinados* | Estados → **State Shift** | Geotermia | Inquietud | Algo resuena dentro de PÍX: lleva un **fragmento** de otro sistema. |
| **Bahía H2** | *El pipeline del hidrógeno*, *Barco H2* | Pipelines → **Pipeline Beam** · **Predict** | Hidrógeno verde (vector, no fuente) | Tensión | **Eclipse** se identifica: no roba energía, la *aísla*. Ha evitado siete colapsos. |
| **Ciudad Batería** | *SORT GRID*, *Buscar el registro de Vega*, *Batería tímida*, *Bug de prioridad* | Búsqueda y orden → **Priority Dash** | Almacenamiento | Culpa asumida, amistad | El registro confirma que el algoritmo de Lía fue **parte** de la causa. Teó: «Ser parte de la causa no significa ser toda la causa». |
| **Microred Prisma** | *La microred resiliente*, *Festival nocturno*, *Día sin sol* | Integración (reglas priorizadas) | Microred | Calma antes de la tormenta | **AURORA** creó la subrutina **Perfect Zero** para resolver objetivos contradictorios, y esta concluyó que la incertidumbre es el problema. |
| **Faro Aurora** | Ascenso con todas las habilidades, 7 fases de Perfect Zero y reescritura del objetivo | Todo → **Aurora Link** | Sistema híbrido | Clímax, catarsis | Vega creó a Eclipse como freno de emergencia. PÍX es un trozo del predictor de AURORA escondido a propósito. Perfect Zero se transforma en **Prisma**. |
| **Festival (epílogo)** | — | — | — | Celebración | El archipiélago vuelve a encenderse, esta vez con un sistema que sabe dudar. Se desbloquea el **Aurora Lab**. |

### Las 7 fases de Perfect Zero

Cada fase deshace una «optimización» que rompe un concepto aprendido:

1. **Secuencia**: reordenó el ciclo de control (y coló la tarjeta «eliminar variaciones»).
2. **Condiciones**: «si hay demanda, apagar». Cero consumo, cero error.
3. **Bucles**: un bucle perfecto sin salida.
4. **Funciones**: código duplicado en cada máquina.
5. **Listas**: ordenó las islas por eficiencia y dejó a las débiles para el final.
6. **Estados**: la transición directa `FAULT → RUNNING`.
7. **Microred**: la tormenta tratada como un error que hay que apagar.

Final: **reescribir la función objetivo**. Solo un equilibrio de criterios que acepte la incertidumbre transforma a Perfect Zero en Prisma.

### Jefes regionales

| Isla | Jefe | Su programa (concepto) | Cómo se vence | Parche de la fase 2 |
|---|---|---|---|---|
| Puerto | **Capitán Cortocircuito**, grúa-pirata que narra sus pasos | `REPETIR: ancla, salto, cañón, recargar` (secuencia) | Saltar el ancla, devolver las chispas, golpear al recargar | Ordenar *cargar → apuntar → disparar* |
| Valle | **Gran Bugglin Rey**, escarabajo con corona glitch | Rodar, aplastar, invocar; en la fase 2 intercambia dos líneas (depuración) | Rueda hasta chocar y queda panza arriba | Intercambiar las dos líneas fuera de sitio |
| Solaria | **Don Nubarrón**, nube diva con gafas de sol | `SI Lía_debajo → rayo SINO → granizo` (condicionales) | Devolver el granizo, golpear cuando baja a recargar | Con dos SI separados, ¿qué pasa a 50 px? (ninguno: zona segura) |
| Aeris | **Tornado Loopling** | `MIENTRAS viento > 0` y `viento ← viento − 1` (bucles) | Esperar a que la condición sea falsa: núcleo expuesto | Detectar el bucle infinito `viento ← viento + 1` |
| Hydria | **Hidra de Compuertas** (UNO, DOS y TRES) | `FUNCIÓN chorro(altura)` llamada con 1, 3, 2 (funciones) | Colocarse según el parámetro; golpear la cabeza que muerde | ¿Cuántas veces se ejecuta el cuerpo? (una por llamada) |
| BioLoop | **Compostor Glotón** | `PARA CADA cosa EN menú: escupir(cosa)` (listas) | Devolver la lata; golpear con la boca abierta | ¿Qué es `menú[2]`? (índices desde 0) |
| Gea | **Magmatón** | REPOSO → CALENTANDO → ERUPCIÓN → ENFRIANDO (estados) | Solo es vulnerable en ENFRIANDO; golpearlo al calentarse provoca FAULT | ¿`FAULT → ERUPCIÓN` es segura? (no: DIAGNÓSTICO) |
| Bahía H2 | **Kraken de Fugas** | Tentáculos-etapa: agua → electrólisis → tanque → pila (pipelines) | Golpearlos en orden de pipeline; al completarlo, núcleo expuesto | Ordenar el pipeline del hidrógeno |
| Ciudad Batería | **Drenadora Suprema** | Escudo de pilas numeradas (búsqueda del mínimo, orden) | Romper las pilas de menor a mayor | Comparaciones para hallar el mínimo (n − 1) |
| Prisma | **Sobrecarga** | `SEGÚN modo`: sol, viento, agua, magma (integración) | Reconocer cada modo; golpear al equilibrarse | ¿Qué fuente usar de noche con déficit? (la batería) |
| Faro | **Perfect Zero** | Las 7 fases y la función objetivo (ver arriba) | Reescribir, no destruir | — |

Reglas de diseño de todos los jefes: **cada ataque se anuncia** (signo «!», marcas en el suelo, líneas discontinuas) antes de hacer daño; siempre hay un **momento de descanso** para contraatacar; al caer, el jefe vuelve a empezar pero el parche se conserva; tras dos derrotas PÍX ofrece la **ayuda de combate** (+2 células y jefes más lentos). Al vencerlo, el jefe se depura, se vuelve amistoso, entra en el **Bestiario** del Atlas y deja un **fragmento de célula** (3 fragmentos = +1 célula máxima). La isla siguiente se desbloquea al vencer al jefe (las partidas guardadas antes de esta versión no quedan bloqueadas).

## 5. Combate: el Lumisable

| Acción | Cómo | Idea de diseño |
|---|---|---|
| Combo | 3 tajos seguidos (el tercero, más amplio y fuerte) | Ritmo y lectura del espacio; al golpear en el suelo Lía se planta un poco. |
| Tajo arriba / pogo | ↑ + ataque; en el aire ↓ + ataque rebota sobre enemigos, proyectiles y pinchos | Movimiento expresivo: se puede cruzar un tramo de pinchos rebotando. |
| Pulso cargado | Mantener el ataque y soltar (30 de energía) | Ataque a distancia que atraviesa enemigos. |
| Parada | Golpear un proyectil justo al llegar lo devuelve hacia quien lo lanzó (parada perfecta si es instantánea); el Toro-Ohm también se para en plena embestida | Premia leer el patrón en vez de huir. |
| Recarga | Quieta, mantener ↓: 50 de energía = +1 célula | La energía se gana golpeando: arriesgar para curarse. |
| Crítico | Con la Lente Debug activa, +1 de daño | Refuerza el hábito de «mirar por dentro». |

**Sensación de impacto**: pausa de impacto de unos milisegundos, destello blanco, retroceso, chispas del color de Lumi (el sable cambia de color con su emoción) y un breve retroceso sin control al recibir daño para salir del contacto. Durante los diálogos nadie ataca.

**Enemigos carismáticos**: además de los enemigos conceptuales (Bugglin, Loopling, Shadow If, Drainer, Chaos Packet, Overflow), cada isla tiene enemigos nuevos con la paleta de su región y su propia personalidad: **Bit Saltarín** («¡Bip! ¡BIP BIP!», se agacha antes de saltar), **Zumbyte** (tiembla antes del picado), **Toro-Ohm** (resopla y embiste hasta chocar) y **Torretín** (gruñón, apunta y dispara lo que se puede devolver). Todos muestran «!» al descubrir a Lía, expresiones (enfado, mareo) y, con la Lente, su algoritmo en pseudocódigo. Se reparten solos por el mapa sin tapar NPCs, terminales, salidas ni puntos de control. Al depurarse sueltan orbes de energía o células.

## 6. Progresión pedagógica

- **Ordenar y ajustar, no construir desde cero**: cada reto de código trae las instrucciones necesarias ya colocadas (en desorden, con números por ajustar o con valores equivocados). El estudiante razona sobre el algoritmo, no sobre la interfaz: toca una línea y la mueve con ▲ ▼ (entra y sale de los bucles fila a fila), ajusta números con − +, toca un valor o el nombre de una instrucción para elegir otro en una lista, y toca un hueco ▢ para elegir qué va ahí. No hay que arrastrar nada. Una prueba automática (`tools/tests/presets.js`) garantiza que ningún programa inicial resuelve ya el reto y que la solución se alcanza.

- **Andamiaje por etapas**: casi todos los retos principales tienen **DEMO** (PÍX lo resuelve y explica), **LO HACEMOS JUNTOS** (programa con huecos ▢) y **TÚ SOLO**.
- **Pistas en 3 niveles**: una pregunta orientadora, luego el concepto y por último una solución parcial que se puede insertar. Usarlas reduce XP, pero no penaliza el avance.
- **Errores explicativos**: el intérprete detecta huecos sin completar, bucles infinitos (límite de pasos), variables sin valor y transiciones inválidas, y las simulaciones explican el fallo con datos (p. ej. «a las 8:00 la ciudad se quedó sin luz: eligió cargar_bateria con radiación 434 W/m²»).
- **Dominio estimado**: 11 conceptos de programación y 8 de energía, actualizados según aciertos al primer intento, pistas y errores. Se presenta como estimación, no como nota.
- **Retos secundarios y banco de 115 retos**: variaciones por concepto y energía para practicar o para usar en clase.
- **Atlas Aurora**: cada entrada tiene *¿Qué es?*, *¿Cómo se representa?*, *¿Para qué sirve?*, un ejemplo y un **error frecuente**.

## 7. Dirección de arte y sonido

- **Resolución interna de 480×270**, escalada con píxel nítido (entero opcional).
- **Paleta propia** con variantes por isla: puerto al atardecer, valle verde, Solaria dorada, Aeris celeste, Hydria turquesa, BioLoop frondoso, Gea volcánica, Bahía H2 industrial, Ciudad Batería de neón, Prisma iridiscente y el Faro blanco.
- **Todo procedural**: sprites con animaciones (correr, saltar, planear, nadar, trepar), retratos con expresiones, *tiles*, fondos parallax de varias capas, partículas, iluminación a media resolución con luces de color y transiciones en diamante.
- **Audio con Web Audio**: efectos sintetizados, canciones por isla generadas a partir de una semilla con capas de intensidad, ambientes (mar, viento, cascada, bosque, magma) y subtítulos de sonidos opcionales.

## 8. Arquitectura técnica

- **Un único HTML autocontenido** generado a partir de 30 módulos (`src/NN_*.js`) concatenados dentro de una función autoejecutable. Sin dependencias, sin red y sin recursos externos.
- **Pila de escenas** (`push`/`pop` con `onEnter`/`onExit`); las escenas transparentes dibujan encima de la anterior.
- **Bucle de paso fijo** (1/60 s) con dibujo por frame e **interpolación**: el dibujo mezcla el estado anterior y el actual según el tiempo sobrante, así el movimiento es fluido también en pantallas de 120/144 Hz.
- **Cámara anclada al píxel de Lía**: el escenario y la protagonista avanzan en el mismo fotograma, sin el vaivén de 1 px que aparece al redondear por separado cámara y sprite. El contacto con el suelo usa bordes exclusivos, de modo que Lía no alterna entre «caer» y «reposo» cuando está quieta.
- **Animación natural**: ciclos de 6 fotogramas para caminar y correr cuya velocidad sigue a la velocidad real, respiración lenta y parpadeo aleatorio (también en los NPCs, cada uno con su propio desfase), giros de aspas y ruedas basados en el tiempo y criaturas que alternan pausas, paseos y huidas.
- **Profundidad coherente del fondo**: los elementos vivos (barcos, faro, farolillos, tranvía, aspas de los molinos) se dibujan entre las capas de parallax que les corresponden y se anclan a su horizonte, de modo que los barcos siempre quedan sobre el mar y detrás de la ciudad.
- **Reparto del espacio para textos flotantes**: globos, etiquetas de la Lente Debug y el aviso de interacción buscan el hueco libre más cercano y nunca se montan entre sí ni sobre el HUD. Los avisos (MISIÓN, ATLAS…) esperan a que se cierre el puzzle o menú abierto.
- **UI inmediata**: los widgets se registran al dibujarse; el foco de teclado o mando es espacial (se mueve al vecino más cercano en la dirección pulsada); arrastrar/soltar y *seleccionar y colocar* para táctil y accesibilidad. Las etiquetas largas se recortan con «…» y muestran el texto completo al pasar el cursor.
- **Cinemáticas con generadores** (`function*` + comandos `C.*`): diálogos, movimientos de cámara, esperas y `C.play()` para devolver el control durante una secuencia.
- **Intérprete del CodeLab con generadores**: cada instrucción cede el control para animar la ejecución, permitir paso a paso y puntos de interrupción, y cortar bucles infinitos.
- **Constructor de niveles** (`MapB`) con mapas ASCII, entidades declarativas, *tiles* dinámicos y zonas de restauración.
- **Guardado** en `localStorage` (`luminaLoopSave`), con los ajustes guardados aparte para que sobrevivan a un reinicio del progreso.
- **Jefes como generadores** (`12_combat.js`, `27_bosses.js`): el programa de cada jefe es un `function*` que cede un fotograma en cada `yield` y marca la línea de pseudocódigo que ejecuta; la Lente dibuja ese mismo código. Ataques, avisos, aturdimientos y peligros son utilidades reutilizables (`bTele`, `bJumpTo`, `bDrop`, `bBeam`, `bColumn`, `bLob`...). Las partes golpeables (cabezas, tentáculos, pilas) son entidades propias que delegan en el jefe.

## 9. Control de calidad

Las pruebas de `tools/tests/` se ejecutan con Playwright y Chromium sin interfaz:

- **levels**: los 14 niveles y las 10 arenas de jefe cargan sin errores de consola.
- **puzzles**: todos los retos principales se resuelven con su solución de referencia, las soluciones incorrectas fallan con una explicación (p. ej. umbral solar de 500 o 1000 W/m², reglas de microred básicas) y los 115 retos del banco se construyen y se dibujan.
- **walk**: recorrido automático de la campaña completa. Todas las islas quedan restauradas, se obtienen las 11 habilidades y el juego llega al epílogo y a los créditos.
- **menus**: capturas de todas las pantallas de menú para revisarlas a ojo.
- **bosses**: el Lumisable depura enemigos con tajos, pulso, parada y rebote, y la recarga funciona; los 10 jefes ejecutan su programa, son alcanzables con un tajo normal en su ventana vulnerable, cambian de fase con el parche, se depuran, dan su recompensa y devuelven al mapa; la salida de una isla lleva a su jefe.
