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

## 3. Bucle de juego

```
explorar la isla  →  encontrar una máquina apagada  →  resolver el reto (DEMO → JUNTOS → SOLO)
      ↑                                                            │
      │                                                            ▼
nueva habilidad ← zona restaurada (luz, música, NPCs) ← el mundo refleja el algoritmo
```

- **Plataformas**: física de paso fijo a 60 Hz, *coyote time*, *jump buffer*, salto variable, escaleras, agua, plataformas atravesables, puntos de control y enemigos (*drainers*) que roban energía.
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

## 5. Progresión pedagógica

- **Andamiaje por etapas**: casi todos los retos principales tienen **DEMO** (PÍX lo resuelve y explica), **LO HACEMOS JUNTOS** (programa con huecos ▢) y **TÚ SOLO**.
- **Pistas en 3 niveles**: una pregunta orientadora, luego el concepto y por último una solución parcial que se puede insertar. Usarlas reduce XP, pero no penaliza el avance.
- **Errores explicativos**: el intérprete detecta huecos sin completar, bucles infinitos (límite de pasos), variables sin valor y transiciones inválidas, y las simulaciones explican el fallo con datos (p. ej. «a las 8:00 la ciudad se quedó sin luz: eligió cargar_bateria con radiación 434 W/m²»).
- **Dominio estimado**: 11 conceptos de programación y 8 de energía, actualizados según aciertos al primer intento, pistas y errores. Se presenta como estimación, no como nota.
- **Retos secundarios y banco de 115 retos**: variaciones por concepto y energía para practicar o para usar en clase.
- **Atlas Aurora**: cada entrada tiene *¿Qué es?*, *¿Cómo se representa?*, *¿Para qué sirve?*, un ejemplo y un **error frecuente**.

## 6. Dirección de arte y sonido

- **Resolución interna de 480×270**, escalada con píxel nítido (entero opcional).
- **Paleta propia** con variantes por isla: puerto al atardecer, valle verde, Solaria dorada, Aeris celeste, Hydria turquesa, BioLoop frondoso, Gea volcánica, Bahía H2 industrial, Ciudad Batería de neón, Prisma iridiscente y el Faro blanco.
- **Todo procedural**: sprites con animaciones (correr, saltar, planear, nadar, trepar), retratos con expresiones, *tiles*, fondos parallax de varias capas, partículas, iluminación a media resolución con luces de color y transiciones en diamante.
- **Audio con Web Audio**: efectos sintetizados, canciones por isla generadas a partir de una semilla con capas de intensidad, ambientes (mar, viento, cascada, bosque, magma) y subtítulos de sonidos opcionales.

## 7. Arquitectura técnica

- **Un único HTML autocontenido** generado a partir de 28 módulos (`src/NN_*.js`) concatenados dentro de una función autoejecutable. Sin dependencias, sin red y sin recursos externos.
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

## 8. Control de calidad

Las pruebas de `tools/tests/` se ejecutan con Playwright y Chromium sin interfaz:

- **levels**: los 14 niveles cargan sin errores de consola.
- **puzzles**: todos los retos principales se resuelven con su solución de referencia, las soluciones incorrectas fallan con una explicación (p. ej. umbral solar de 500 o 1000 W/m², reglas de microred básicas) y los 115 retos del banco se construyen y se dibujan.
- **walk**: recorrido automático de la campaña completa. Todas las islas quedan restauradas, se obtienen las 11 habilidades y el juego llega al epílogo y a los créditos.
- **menus**: capturas de todas las pantallas de menú para revisarlas a ojo.
