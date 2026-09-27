# LUMINA LOOP: EL CÓDIGO DE LOS ELEMENTOS
## Documento Maestro de Implementación para Agente de Inteligencia Artificial
### Videojuego educativo Pixel Art sobre Algoritmos de Programación y Energías Alternativas
### Game Design + Metodología Pedagógica + Especificación Técnica

---

# 0. PROPÓSITO

Este documento debe ser utilizado por un agente de inteligencia artificial como **especificación maestra de implementación** del videojuego educativo:

# LUMINA LOOP: EL CÓDIGO DE LOS ELEMENTOS

Debe leerse junto con:

```text
LUMINA_LOOP_STORY_BIBLE.md
```

Los dos archivos forman una sola obra.

Este documento se concentra en:

- mecánicas;
- arquitectura del software;
- metodología pedagógica;
- progresión;
- niveles;
- sistemas de aprendizaje;
- Pixel Art;
- interacción;
- simulación energética;
- puzzles de programación;
- gamificación;
- accesibilidad;
- QA;
- criterios de aceptación.

El segundo documento se concentra en:

- historia;
- personajes;
- misterio;
- giros argumentales;
- ritmo emocional;
- diálogos;
- ambientación;
- revelaciones;
- evolución dramática.

---

# 1. VISIÓN GENERAL

Crear un videojuego educativo 2D en Pixel Art que combine:

```text
AVENTURA
+
PLATAFORMAS
+
PUZZLES
+
PROGRAMACIÓN
+
ENERGÍAS ALTERNATIVAS
+
SIMULACIÓN
+
MISTERIO
+
EXPLORACIÓN
+
HUMOR
+
HISTORIA EMOCIONAL
```

El jugador debe aprender haciendo.

No debe sentir que está respondiendo un cuestionario escolar.

Debe sentir que está:

- reparando una isla solar;
- programando molinos;
- automatizando una central híbrida;
- persiguiendo errores;
- equilibrando baterías;
- diseñando algoritmos;
- reconstruyendo una red energética;
- resolviendo misterios.

---

# 2. PRINCIPIO DE DISEÑO

Toda mecánica educativa debe cumplir:

> **El conocimiento debe cambiar lo que el jugador puede hacer.**

No usar como mecánica principal:

```text
Pregunta correcta = puerta abierta
```

Usar:

```text
Comprender un IF
↓
configurar una compuerta energética
↓
el sistema decide correctamente
↓
la instalación funciona
```

---

# 3. OBJETIVO EDUCATIVO GENERAL

Al finalizar, el estudiante debe poder:

## 3.1 Algoritmos

- explicar qué es un algoritmo;
- representar procesos mediante pseudocódigo;
- diseñar diagramas de flujo;
- utilizar secuencias;
- variables;
- operadores;
- decisiones;
- condicionales;
- ciclos;
- funciones;
- arreglos/listas;
- contadores;
- acumuladores;
- validaciones;
- búsqueda;
- ordenamiento;
- depuración;
- modularidad;
- estados;
- eventos;
- resolución de problemas;
- descomposición;
- abstracción.

## 3.2 Energías alternativas

- distinguir fuentes renovables;
- comprender energía solar;
- energía eólica;
- hidroenergía;
- biomasa;
- geotermia;
- hidrógeno verde;
- almacenamiento;
- eficiencia energética;
- variabilidad;
- demanda;
- generación;
- combinación de fuentes;
- microredes;
- sostenibilidad;
- pérdidas;
- seguridad;
- complementariedad energética.

## 3.3 Integración

El estudiante debe comprender que los algoritmos permiten decidir:

```text
CUÁNDO
CÓMO
CUÁNTO
DÓNDE
```

usar la energía disponible.

---

# 4. FORMATO TÉCNICO

Resultado final:

```text
lumina_loop.html
```

Un único HTML autocontenido.

Debe poder abrirse localmente en un navegador moderno.

---

# 5. TECNOLOGÍA PERMITIDA

Usar únicamente:

- HTML5;
- CSS3;
- JavaScript Vanilla;
- Canvas 2D;
- Web Audio API;
- localStorage;
- requestAnimationFrame;
- Gamepad API opcional;
- teclado;
- Touch/Pointer Events.

---

# 6. TECNOLOGÍA PROHIBIDA

No utilizar:

- Phaser;
- Three.js;
- PixiJS;
- React;
- Vue;
- Angular;
- librerías externas;
- frameworks;
- CDN;
- imágenes externas;
- sprites descargados;
- archivos de audio;
- fuentes externas;
- APIs remotas;
- peticiones de red;
- fetch;
- XMLHttpRequest;
- modelos 3D.

---

# 7. DIRECCIÓN ARTÍSTICA

El juego debe ser:

# MUY COLORIDO

# ALEGRE

# ESTÉTICO

# FANTÁSTICO

# DETALLADO

# EXPRESIVO

No usar una estética tecnológica gris dominante.

La tecnología debe sentirse integrada con:

- naturaleza;
- luz;
- agua;
- viento;
- vegetación;
- cristales;
- pequeñas criaturas;
- máquinas amables;
- arquitectura fantástica.

---

# 8. IDENTIDAD VISUAL

Inspiración conceptual:

```text
Pixel Art de aventura
+
ecotecnología
+
fantasía solar
+
ciencia alegre
+
laboratorio colorido
+
archipiélago mágico
```

No imitar directamente ningún videojuego existente.

---

# 9. PALETA

Paleta base sugerida:

```text
Azul cielo          #59C7FF
Azul profundo       #163A73
Turquesa            #30E1C5
Verde hoja          #66D66A
Verde lima          #B6F35B
Amarillo solar      #FFD84A
Naranja             #FF9D42
Coral               #FF6B6B
Rosa                #FF7FCF
Violeta             #9B76FF
Blanco cálido       #FFF3D7
Marrón madera       #8B5A3C
Negro azul          #10162B
```

Cada región debe tener identidad cromática propia.

---

# 10. REGLAS PIXEL ART

Resolución interna recomendada:

```text
480 × 270
```

o:

```text
384 × 216
```

Escalar con nearest-neighbor.

Usar:

```javascript
ctx.imageSmoothingEnabled = false;
```

Evitar suavizado accidental.

---

# 11. DETALLE VISUAL DEL MUNDO

Incluir elementos animados y ambientales:

- hojas;
- nubes;
- aves Pixel;
- molinos;
- destellos solares;
- agua;
- paneles inclinándose;
- luciérnagas;
- flores;
- peces;
- burbujas;
- cables luminosos;
- baterías;
- pequeñas turbinas;
- terminales;
- mercados;
- viviendas;
- personajes secundarios.

El mundo debe sentirse vivo aun cuando el jugador permanece quieto.

---

# 12. ARQUITECTURA DEL MOTOR

Separar responsabilidades.

Sugerencia:

```javascript
Game
SceneManager
InputManager
AudioManager
SaveManager
Renderer
Camera
World
TileMap
Entity
Player
Companion
NPC
Enemy
Boss
PhysicsSystem
CollisionSystem
ParticleSystem
DialogueManager
QuestManager
AlgorithmSystem
EnergySystem
PuzzleManager
LearningModel
HintSystem
CodexSystem
FlowchartSystem
CodeLabSystem
SimulationSystem
AchievementSystem
UIManager
AccessibilityManager
```

No es obligatorio copiar esta jerarquía literalmente, pero sí separar responsabilidades.

---

# 13. GAME LOOP

Orden recomendado:

```text
INPUT
↓
PLAYER
↓
PHYSICS
↓
AI
↓
ENERGY SIMULATION
↓
ALGORITHM EXECUTION
↓
QUEST LOGIC
↓
LEARNING MODEL
↓
ANIMATION
↓
CAMERA
↓
RENDER
↓
UI
```

Utilizar deltaTime.

---

# 14. MÁQUINA DE ESTADOS

Estados mínimos:

```text
BOOT
TITLE
MENU
INTRO
WORLD_MAP
GAMEPLAY
DIALOGUE
PUZZLE
FLOWCHART
CODELAB
ENERGY_SIM
CODEX
PAUSE
BOSS
LEVEL_COMPLETE
ENDING
CREDITS
```

---

# 15. PERSONAJE PRINCIPAL

Nombre recomendado:

# LÍA LOOP

Lía es estudiante de programación y sistemas energéticos.

Debe transmitir entusiasmo, curiosidad y energía.

---

# 16. MOVIMIENTO

Implementar:

- caminar;
- correr;
- salto;
- coyote time;
- jump buffer;
- caída;
- plataformas móviles;
- escaleras;
- cuerdas;
- viento;
- agua;
- impulso;
- planeo opcional.

---

# 17. ANIMACIONES DE LÍA

Mínimo:

- idle;
- caminar;
- correr;
- saltar;
- caer;
- aterrizar;
- interactuar;
- programar;
- reparar;
- celebrar;
- sorprenderse;
- daño;
- usar habilidad.

---

# 18. COMPAÑEROS

## PÍX

Pequeño colibrí-dron.

Funciones:

- guía;
- humor;
- análisis;
- feedback;
- pistas;
- escaneo.

## LUMI

Pequeña criatura de luz energética.

Funciones:

- representar energía;
- reaccionar a generación;
- mostrar equilibrio;
- reforzar emociones.

Ambos deben tener identidad visual y animaciones propias.

---

# 19. PRINCIPIO DE DOBLE APRENDIZAJE

Cada región debe combinar:

```text
CONCEPTO DE PROGRAMACIÓN
+
CONCEPTO ENERGÉTICO
```

Ejemplo:

```text
IF / ELSE
+
gestión solar según radiación
```

---

# 20. MAPA GENERAL

El mundo:

# ARCHIPIÉLAGO AURORA

Regiones:

```text
00 Puerto Inicial
01 Valle Secuencia
02 Solaria
03 Aeris
04 Cascadas Hydria
05 Bosque BioLoop
06 Gea Profunda
07 Bahía H2
08 Ciudad Batería
09 Microred Prisma
10 Faro Aurora
```

---

# 21. NIVEL 00 — PUERTO INICIAL

## Programación

- algoritmo;
- secuencia;
- instrucciones.

## Energía

- fuente;
- conversión;
- uso;
- almacenamiento.

## Mecánica

Ordenar pasos para encender un faro.

```text
1 captar energía
2 convertir
3 almacenar
4 alimentar carga
```

---

# 22. MECÁNICA — CAMINO DE INSTRUCCIONES

El jugador coloca baldosas de acciones:

```text
AVANZAR
ACTIVAR
GIRAR
RECOGER
ENTREGAR
```

PÍX ejecuta la secuencia.

Si falla, visualizar exactamente dónde y por qué.

---

# 23. DEPURACIÓN DESDE EL PRINCIPIO

No decir únicamente:

```text
Incorrecto
```

Mostrar:

```text
PASO 1 ✓
PASO 2 ✓
PASO 3 ✗
```

Permitir corregir y volver a ejecutar.

---

# 24. NIVEL 01 — VALLE SECUENCIA

Paisaje:

- praderas;
- puentes;
- molinos pequeños;
- caminos florales;
- casas de madera tecnológica.

Tema:

```text
SECUENCIA
```

Misión:

reconstruir rutas automáticas de mantenimiento.

---

# 25. PODER — STEP SPARK

Lía puede colocar temporalmente una secuencia de acciones.

La habilidad aumenta gradualmente.

---

# 26. NIVEL 02 — SOLARIA

Ciudad luminosa.

## Energía

- solar fotovoltaica;
- irradiancia;
- sombra;
- orientación;
- generación;
- variabilidad.

## Programación

- variables;
- operadores;
- condicionales.

---

# 27. VARIABLES COMO CONTENEDORES

Representar:

```text
radiacion
bateria
demanda
temperatura
```

como cápsulas visibles.

El jugador puede inspeccionar valores en tiempo real.

---

# 28. PUZZLE SOLAR

Crear lógica:

```text
SI radiacion > umbral
    cargar_bateria
SINO
    usar_bateria
```

El jugador construye el flujo y observa el resultado.

---

# 29. PODER — IF SHIELD

Escudo condicionado.

Solo se activa cuando una condición se cumple.

Debe ser útil en plataformas y combate.

---

# 30. CLIMA DINÁMICO

Implementar:

- sol;
- nubes;
- lluvia;
- viento.

Debe afectar realmente la generación.

---

# 31. NIVEL 03 — AERIS

Islas flotantes.

Molinos.

Cometas.

Puentes de viento.

## Programación

- bucles;
- contadores;
- acumuladores.

## Energía

- viento;
- generación;
- variabilidad;
- control.

---

# 32. MECÁNICA — LOOP TURBINE

El jugador programa:

```text
REPETIR 5 VECES
    ajustar_aspas
    medir_viento
```

La turbina responde.

Cada iteración debe ser visible.

---

# 33. BUCLES VISIBLES

Mostrar:

- número de iteración;
- condición;
- salida;
- cambio de estado.

---

# 34. PODER — LOOP GLIDE

Permite encadenar corrientes de aire mediante repetición.

---

# 35. NIVEL 04 — CASCADAS HYDRIA

Ríos.

Cascadas.

Turbinas.

Canales.

## Programación

- funciones;
- parámetros;
- retorno.

## Energía

- flujo;
- altura;
- turbina;
- generación hidráulica.

---

# 36. FUNCIONES COMO MÓDULOS

Ejemplo:

```text
generarEnergia(caudal, altura)
```

El jugador crea un módulo reutilizable.

---

# 37. MECÁNICA — FUNCTION FORGE

Construir una función una vez.

Reutilizarla en varios mecanismos.

Aprendizaje:

> reutilizar una solución puede ser mejor que repetir código.

---

# 38. PODER — FUNCTION PORTAL

Invoca una acción previamente definida.

---

# 39. NIVEL 05 — BOSQUE BIOLOOP

Bosque tropical Pixel Art.

Mercados.

Granjas.

Biodigestores.

## Energía

- biomasa;
- residuos;
- biogás;
- circularidad;
- sostenibilidad.

## Programación

- arreglos;
- listas;
- recorridos.

---

# 40. MECÁNICA — INVENTARIO DE RESIDUOS

Lista:

```text
[hojas, restos, cáscaras, plástico, madera]
```

El jugador debe:

- recorrer;
- clasificar;
- filtrar;
- procesar.

---

# 41. SOSTENIBILIDAD SIN SIMPLIFICACIÓN

Enseñar:

```text
renovable ≠ impacto cero
```

Introducir contexto, recursos, residuos y uso responsable.

---

# 42. PODER — ARRAY PACK

Permite almacenar y manipular varios objetos de manera ordenada.

---

# 43. NIVEL 06 — GEA PROFUNDA

Cuevas cálidas.

Cristales.

Tuberías.

Magma.

## Programación

- estados;
- máquinas de estado;
- eventos;
- validación.

## Energía

- geotermia;
- temperatura;
- intercambio térmico;
- control.

---

# 44. STATE MACHINE

Estados:

```text
OFF
STARTING
RUNNING
COOLING
FAULT
```

El jugador debe crear transiciones válidas.

---

# 45. SEGURIDAD

No permitir:

```text
FAULT → RUNNING
```

sin diagnóstico.

---

# 46. PODER — STATE SHIFT

Cambiar entre modos de equipo.

---

# 47. NIVEL 07 — BAHÍA H2

Puerto futurista.

Electrolizadores.

Depósitos.

Barcos.

## Energía

- hidrógeno verde;
- electrólisis;
- energía eléctrica;
- almacenamiento;
- reconversión;
- seguridad.

## Programación

- subprocesos;
- modularidad;
- pipelines.

---

# 48. PIPELINE DE HIDRÓGENO

```text
agua
↓
electricidad renovable
↓
electrólisis
↓
H2
↓
almacenamiento
↓
uso
```

El jugador diseña el proceso.

---

# 49. REGLA PEDAGÓGICA DE H2

No presentar hidrógeno como fuente primaria.

Mostrar mediante gameplay que funciona como vector energético.

---

# 50. PODER — PIPELINE BEAM

Encadena módulos correctamente.

---

# 51. NIVEL 08 — CIUDAD BATERÍA

Ciudad nocturna multicolor.

Baterías como edificios.

## Programación

- búsqueda;
- ordenamiento;
- prioridades.

## Energía

- almacenamiento;
- SOC;
- carga;
- descarga;
- eficiencia.

---

# 52. SOC VISIBLE

Cada batería:

```text
0–100%
```

El jugador debe decidir cuál usar y por qué.

---

# 53. ALGORITMOS DE PRIORIDAD

Ejemplo:

```text
ordenar baterías por:
1 SOC
2 disponibilidad
3 eficiencia
```

---

# 54. MECÁNICA — SORT GRID

Ordenar módulos para reducir pérdidas y atender demanda.

---

# 55. PODER — PRIORITY DASH

Selecciona rápidamente el objetivo prioritario.

---

# 56. NIVEL 09 — MICRORED PRISMA

Aquí se integran todas las fuentes.

## Programación

- algoritmos completos;
- optimización;
- eventos;
- condiciones;
- funciones;
- listas.

## Energía

- microred;
- demanda;
- generación;
- almacenamiento;
- resiliencia.

---

# 57. SIMULADOR DE MICRORED

Variables:

```text
solar
wind
hydro
battery
hydrogen
demand
weather
```

El jugador crea reglas operativas.

---

# 58. OBJETIVO DE MICRORED

Mantener:

```text
supply ≈ demand
```

sin:

- vaciar baterías;
- desperdiciar demasiado;
- comprometer seguridad;
- depender de una sola fuente.

---

# 59. SISTEMA DE EVENTOS

Ejemplos:

- nube;
- calma de viento;
- aumento de demanda;
- batería fuera;
- lluvia;
- festival nocturno;
- mantenimiento.

El algoritmo debe adaptarse.

---

# 60. NIVEL 10 — FARO AURORA

Final.

Integra programación, energía y narrativa.

No resolver mediante preguntas de opción múltiple.

Resolver mediante un sistema vivo.

---

# 61. HABILIDADES

Lista sugerida:

```text
STEP SPARK
IF SHIELD
LOOP GLIDE
FUNCTION PORTAL
ARRAY PACK
STATE SHIFT
PIPELINE BEAM
PRIORITY DASH
DEBUG LENS
AURORA LINK
```

---

# 62. DEBUG LENS

Poder esencial.

Permite observar:

- variables;
- estados;
- flujos;
- condiciones;
- errores.

---

# 63. DEPURACIÓN VISUAL

Mostrar:

- breakpoint;
- valor actual;
- paso a paso;
- línea activa;
- condición evaluada.

Todo mediante Pixel Art.

---

# 64. CODELAB

Modo especial.

Utilizar bloques textuales.

Ejemplo:

```text
SET
IF
ELSE
REPEAT
WHILE
CALL
RETURN
FOR EACH
```

---

# 65. PSEUDOCÓDIGO

Debe ser legible en español.

Ejemplo:

```text
SI bateria < 30
    cargar
SINO
    alimentar_red
FIN SI
```

---

# 66. FLOWCHART MODE

Permitir construir diagramas.

Nodos:

- inicio;
- proceso;
- decisión;
- entrada;
- salida;
- fin.

---

# 67. DIAGRAMAS COMO MECÁNICA

El flujo construido debe controlar sistemas reales del nivel.

---

# 68. ERROR VISUAL

Si hay flujo imposible:

- resaltar;
- animar;
- detener ejecución;
- permitir inspección.

---

# 69. SIMULACIÓN DE ALGORITMOS

Cada algoritmo debe mostrar:

```text
entrada
↓
procesamiento
↓
salida
```

---

# 70. VARIABLES EN TIEMPO REAL

Panel opcional:

```text
radiacion = 820
viento = 6.5
soc = 72
demanda = 4.2
```

---

# 71. METODOLOGÍA PEDAGÓGICA PRINCIPAL

Ciclo:

```text
DESCUBRIR
↓
EXPERIMENTAR
↓
NOMBRAR
↓
MODELAR
↓
PROGRAMAR
↓
PROBAR
↓
DEPURAR
↓
APLICAR
↓
TRANSFERIR
```

---

# 72. NO EMPEZAR CON DEFINICIÓN

Evitar:

> Una variable es...

Primero permitir manipular un valor que cambia.

Después introducir el nombre formal.

---

# 73. EJEMPLO RESUELTO

Usar:

```text
YO TE MUESTRO
↓
LO HACEMOS JUNTOS
↓
LO HACES TÚ
```

---

# 74. RETROALIMENTACIÓN

Correcta:

- explicar;
- mostrar efecto;
- celebrar.

Incorrecta:

- no castigar;
- mostrar consecuencia;
- orientar;
- reintentar.

---

# 75. SISTEMA DE PISTAS

Tres niveles.

## Pista 1

Pregunta orientadora.

## Pista 2

Resaltado visual.

## Pista 3

Solución parcial.

---

# 76. MODELO DE DOMINIO

```javascript
mastery = {
 sequence:0,
 variables:0,
 conditions:0,
 loops:0,
 functions:0,
 arrays:0,
 states:0,
 debugging:0,
 search:0,
 sorting:0,
 optimization:0,
 solar:0,
 wind:0,
 hydro:0,
 biomass:0,
 geothermal:0,
 hydrogen:0,
 storage:0,
 microgrid:0
}
```

Rango recomendado:

```text
0–100
```

---

# 77. DIFICULTAD

Escala:

```text
1 reconocer
2 comprender
3 aplicar
4 analizar
5 diseñar
```

---

# 78. ADAPTACIÓN

Si falla:

- reducir complejidad;
- mostrar ejemplo;
- ofrecer pista;
- volver más adelante.

Si domina:

- combinar conceptos;
- retirar apoyos;
- introducir transferencia.

---

# 79. RECUPERACIÓN ESPACIADA

Un concepto aprendido debe reaparecer en otras islas.

Ejemplo:

IF aprendido en Solaria.

Posteriormente IF controla carga en Ciudad Batería.

---

# 80. TRANSFERENCIA

Un concepto debe utilizarse en varios contextos.

---

# 81. MISIONES PRINCIPALES

Formato:

```javascript
{
 id,
 title,
 programmingConcept,
 energyConcept,
 narrativePurpose,
 objectives,
 rewards,
 prerequisites
}
```

---

# 82. MISIONES SECUNDARIAS

Crear mínimo 18.

Ejemplos:

1. Flores solares.
2. Molino dormido.
3. Río bloqueado.
4. Lista de residuos.
5. Sensor loco.
6. Batería tímida.
7. Barco H2.
8. Festival nocturno.
9. Nube inesperada.
10. Viento caprichoso.
11. Bug de prioridad.
12. Bucle infinito.
13. Función duplicada.
14. Variable perdida.
15. Matriz de paneles.
16. Microred aislada.
17. Día sin sol.
18. Carrera del algoritmo.

---

# 83. ENEMIGOS CONCEPTUALES

## BUGGLIN

Cambia instrucciones.

## LOOPLING

Atrapa sistemas en repetición.

## SHADOW IF

Invierte condiciones.

## OVERFLOW

Llena contenedores.

## CHAOS PACKET

Desordena datos.

## DRAINER

Consume energía.

---

# 84. CONTRAMEDIDAS EDUCATIVAS

Cada enemigo tiene respuesta conceptual.

Ejemplo:

```text
LOOPLING
↓
encontrar condición de salida
```

---

# 85. COMBATE

Ligero.

Colorido.

No realista.

Combinar:

- esquivar;
- habilidad;
- puzzle;
- análisis.

---

# 86. JEFE FINAL

Nombre:

# PERFECT ZERO

Rutina de optimización que quiere eliminar toda incertidumbre.

Su error conceptual:

> confunde eficiencia con perfección absoluta.

---

# 87. FASES DEL JEFE

## Secuencia

reordenar procesos.

## Condiciones

seleccionar reglas.

## Loops

detener bucle infinito.

## Funciones

modular.

## Arrays

redistribuir recursos.

## Estados

evitar transiciones inseguras.

## Energía

equilibrar fuentes.

## Final

diseñar objetivo multicriterio.

---

# 88. FINAL MULTICRITERIO

Variables:

```text
RELIABILITY
EFFICIENCY
ENVIRONMENT
SAFETY
HUMAN NEEDS
RESILIENCE
```

No maximizar únicamente una.

---

# 89. MAPA DEL MUNDO

Mapa Pixel Art animado.

Cada isla se ilumina al restaurarse.

---

# 90. TRANSPORTE

Moverse mediante:

- barca solar;
- planeador eólico;
- ascensor hidráulico;
- tranvía batería;
- teleférico geotérmico.

---

# 91. UI

Colorida pero legible.

Mostrar:

```text
energía
XP
concepto
habilidad
misión
```

---

# 92. CODEX

Nombre:

# ATLAS AURORA

Secciones:

```text
ALGORITMOS
ENERGÍAS
PERSONAJES
ISLAS
MISTERIOS
```

---

# 93. FICHA DE ALGORITMO

```text
¿Qué es?
¿Cómo se representa?
¿Para qué sirve?
Ejemplo
Error frecuente
Uso en el juego
```

---

# 94. FICHA DE ENERGÍA

```text
Fuente
Conversión
Ventajas
Limitaciones
Variabilidad
Aplicaciones
Impactos
Uso en el juego
```

---

# 95. APRENDIZAJE SIN DOGMATISMO

No presentar una fuente como perfecta.

Mostrar contexto, ventajas y limitaciones.

---

# 96. ANALÍTICA FINAL

Ejemplo:

```text
SECUENCIAS          90%
CONDICIONES         82%
BUCLES              78%
FUNCIONES           88%
SOLAR               84%
EÓLICA              79%
ALMACENAMIENTO      73%
MICRORED            81%
```

---

# 97. NOMBRE DEL INFORME

```text
Mapa de dominio estimado
```

No usar “inteligencia” ni etiquetas de capacidad personal.

---

# 98. GUARDADO

Usar `localStorage`.

Clave:

```text
luminaLoopSave
```

---

# 99. DATOS GUARDADOS

```javascript
{
 version,
 scene,
 checkpoint,
 xp,
 level,
 abilities,
 mastery,
 quests,
 codex,
 storyFlags,
 collectibles,
 settings
}
```

---

# 100. AUDIO

Web Audio API.

Sonidos procedurales para:

- salto;
- viento;
- agua;
- click;
- bug;
- respuesta;
- batería;
- turbina;
- victoria;
- UI.

---

# 101. MÚSICA PROCEDURAL

Opcional.

Cada región con personalidad.

Solaria:

- timbres brillantes.

Aeris:

- arpegios ligeros.

Hydria:

- texturas acuáticas.

BioLoop:

- percusión orgánica.

---

# 102. ACCESIBILIDAD

Incluir:

- subtítulos;
- contraste;
- reducir flashes;
- reducir shake;
- velocidad de texto;
- control táctil;
- remapeo básico;
- modo sin tiempo.

---

# 103. MODO DOCENTE

Funciones:

- elegir isla;
- elegir concepto;
- lanzar reto;
- ver mastery;
- reiniciar progreso;
- mostrar resumen local.

---

# 104. TEACHER CHALLENGE

Permitir seleccionar combinaciones como:

```text
Loops + Wind
```

para lanzar un reto específico.

---

# 105. BANCO DE RETOS

Mínimo:

# 100 desafíos

---

# 106. TIPOS DE DESAFÍO

- ordenar;
- completar;
- conectar;
- simular;
- depurar;
- predecir;
- clasificar;
- construir;
- diagnosticar;
- optimizar.

---

# 107. MULTIPLE CHOICE

Usar con moderación.

Máximo orientativo:

20–25% de los retos.

---

# 108. RETOS VISUALES

Ejemplo:

construir un flujo arrastrando nodos.

---

# 109. RETOS DE SIMULACIÓN

Modificar reglas y observar producción y demanda.

---

# 110. RETOS DE DEBUG

Encontrar:

```text
bucle sin salida
variable incorrecta
condición invertida
función mal llamada
```

---

# 111. RETOS DE ENERGÍA

Diagnosticar:

- batería vacía;
- viento insuficiente;
- sombra;
- exceso de demanda;
- desbalance;
- fuente indisponible.

---

# 112. METACOGNICIÓN

Pregunta ocasional:

```text
¿Qué tan seguro estás?
```

---

# 113. ERROR CON ALTA CONFIANZA

Mostrar explicación más profunda y nueva representación.

---

# 114. RECOMPENSAS

- habilidades;
- atuendos;
- semillas luminosas;
- stickers;
- mejoras del taller;
- música;
- lore.

---

# 115. PERSONALIZACIÓN

Lía puede obtener:

- mochila solar;
- capa eólica;
- botas hidro;
- gafas Debug.

Cosmético.

---

# 116. CASA BASE

Pequeño taller.

Se llena de recuerdos de cada isla.

---

# 117. PROGRESO VISUAL

Cada isla restaurada añade:

- plantas;
- luz;
- NPC;
- música;
- movimiento;
- mercados;
- animales.

---

# 118. CAMBIOS SIN BARRA DE “FELICIDAD”

Mostrar recuperación del mundo visualmente en lugar de reducirlo a una sola estadística.

---

# 119. PÍX COMO FEEDBACK

Ejemplo:

> ¡Ese IF estuvo tan limpio que hasta el sol salió antes!

---

# 120. LUMI

Expresa emociones mediante:

- color;
- forma;
- brillo;
- partículas.

---

# 121. WORLD EVENTS

Opcionales:

- festival;
- tormenta;
- migración;
- día nublado;
- mantenimiento;
- feria científica.

---

# 122. REJUGABILIDAD

Después del final desbloquear:

# AURORA LAB

---

# 123. AURORA LAB

Sandbox donde el jugador puede:

- cambiar clima;
- cambiar demanda;
- crear reglas;
- comparar resultados;
- experimentar sin penalización.

---

# 124. NEW GAME+

Opcional.

Conceptos avanzados:

- recursión;
- estructuras;
- heurísticas;
- optimización;
- concurrencia conceptual.

---

# 125. FLOWCHART ENGINE

Representar nodos visualmente.

Nodos arrastrables.

---

# 126. VALIDACIÓN DE FLOWCHART

Comprobar:

- inicio;
- fin;
- ramas;
- ciclos;
- conexiones inválidas.

---

# 127. EXECUTION TRACE

Mostrar recorrido animado.

---

# 128. CODE BLOCK ENGINE

Bloques:

```text
SET
ADD
IF
ELSE
REPEAT
WHILE
CALL
RETURN
FOR EACH
```

---

# 129. BLOQUES COMO PIXEL CARDS

Color por categoría.

---

# 130. SIMULADOR DE ENERGÍA

Modelo simplificado pero coherente.

Debe ser pedagógico, no sustituir software profesional.

---

# 131. VARIABLES SOLARES

Ejemplo:

```text
irradiance
panelCount
efficiency
```

---

# 132. VARIABLES EÓLICAS

```text
wind
turbines
availability
```

---

# 133. BATERÍA

```text
soc
capacity
chargeEfficiency
dischargeEfficiency
```

---

# 134. DEMANDA

Usar perfil simple y visible.

---

# 135. BALANCE

```text
net = generation - demand
```

---

# 136. RESULTADOS VISUALES

No limitarse a números.

Mostrar:

- luces;
- velocidad;
- barras;
- flujo;
- animación de carga.

---

# 137. EVENTOS NARRATIVOS Y SIMULACIÓN

La historia puede alterar parámetros de la simulación.

---

# 138. CLIMA NARRATIVO

Una tormenta puede ser simultáneamente:

- reto;
- historia;
- aprendizaje.

---

# 139. CHECKPOINTS

Antes de:

- puzzles grandes;
- bosses;
- revelaciones.

---

# 140. GAME OVER

Texto amable:

```text
La red perdió estabilidad.
Recalculando ruta...
```

---

# 141. SIN CASTIGO EXCESIVO

No perder conocimiento, codex ni coleccionables permanentes.

---

# 142. CÁMARA

Side-scrolling con salas compactas.

---

# 143. PARALLAX

Capas:

- cielo;
- nubes;
- montañas;
- vegetación;
- estructuras.

---

# 144. PARTÍCULAS

- polen;
- chispas;
- burbujas;
- hojas;
- bits;
- rayos solares.

---

# 145. PERFORMANCE

Usar:

- pooling;
- culling;
- pre-render de sprites;
- tile rendering visible.

---

# 146. SPRITES PROCEDURALES

Generar mediante matrices de píxeles o dibujo Canvas.

---

# 147. ANIMATOR

Formato sugerido:

```javascript
{
 frames,
 fps,
 loop
}
```

---

# 148. QA — MOTOR

Verificar:

- controles;
- colisiones;
- cámara;
- deltaTime;
- estabilidad.

---

# 149. QA — PROGRAMACIÓN

Verificar:

- secuencias ejecutan;
- IF ramifica;
- loops terminan;
- funciones llaman;
- arrays recorren;
- estados cambian;
- debugging funciona.

---

# 150. QA — ENERGÍA

Verificar:

- solar cambia con clima;
- viento cambia;
- SOC responde;
- demanda importa;
- microred se equilibra.

---

# 151. QA — PEDAGOGÍA

Verificar:

- feedback;
- hints;
- mastery;
- repetición;
- transferencia.

---

# 152. QA — NARRATIVA

Usar:

```text
LUMINA_LOOP_STORY_BIBLE.md
```

como referencia.

---

# 153. DESARROLLO POR FASES

## FASE A — MOTOR

Canvas, input, cámara, física, colisiones.

## FASE B — ARTE

Lía, PÍX, Lumi, tiles, UI.

## FASE C — VERTICAL SLICE

Una miniisla completa.

## FASE D — SISTEMAS DE ALGORITMOS

CodeLab, Flowchart, Debug.

## FASE E — SISTEMAS DE ENERGÍA

Simulación, clima, almacenamiento.

## FASE F — HISTORIA

Diálogos, flags, escenas.

## FASE G — CAMPAÑA

Todas las regiones.

## FASE H — FINAL

Perfect Zero.

## FASE I — QA

Pruebas completas.

---

# 154. VERTICAL SLICE OBLIGATORIO

Debe incluir:

- una miniisla;
- Lía;
- PÍX;
- Lumi;
- puzzle de secuencia;
- panel solar;
- clima;
- diálogo;
- save;
- Codex;
- una misión.

---

# 155. NO DETENERSE EN EL VERTICAL SLICE

El vertical slice es validación, no entrega final.

---

# 156. PRIORIDAD EN CASO DE LIMITACIONES

1. gameplay;
2. aprendizaje;
3. historia;
4. estética;
5. niveles;
6. sonido;
7. efectos secundarios.

---

# 157. LIBERTAD DEL AGENTE

El agente puede:

- mejorar minijuegos;
- añadir NPC;
- añadir fuentes;
- crear nuevas habilidades;
- reorganizar puzzles;
- crear microhistorias;
- añadir humor;
- mejorar UI;
- añadir eventos.

---

# 158. CONDICIÓN PARA INNOVAR

Toda innovación debe fortalecer:

```text
DIVERSIÓN
OR
APRENDIZAJE
OR
HISTORIA
```

Idealmente dos o tres a la vez.

---

# 159. NO CONVERTIR EL JUEGO EN

- formulario;
- presentación;
- libro;
- quiz disfrazado.

---

# 160. CONVERTIRLO EN

> un mundo que responda al algoritmo del jugador.

---

# 161. CRITERIO FINAL

El jugador debe poder decir:

> “Aprendí programación porque tuve que hacer que el mundo funcionara.”

Y:

> “Entendí las energías alternativas porque vi cómo cambian, se combinan y necesitan decisiones.”

---

# 162. FRASE GUÍA

> **Programar es enseñar a un sistema a tomar decisiones. Diseñar energía es decidir cómo usar recursos que cambian.**

---

# 163. MATRIZ DE INTEGRACIÓN BASE

| Región | Algoritmo | Energía | Mecánica principal |
|---|---|---|---|
| Puerto | Secuencia | Flujo energético | Ordenar acciones |
| Solaria | Variables + IF | Solar | Reglas con irradiancia |
| Aeris | Bucles | Eólica | Control repetitivo |
| Hydria | Funciones | Hidro | Módulos reutilizables |
| BioLoop | Arrays | Biomasa | Recorrer y clasificar |
| Gea | Estados | Geotermia | Máquina de estados |
| H2 | Pipelines | Hidrógeno | Cadena de procesos |
| Battery | Search/Sort | Almacenamiento | Prioridad y SOC |
| Prisma | Integración | Microred | Gestión dinámica |
| Faro | Todo | Sistema híbrido | Optimización multicriterio |

---

# 164. CRITERIO DE UNA BUENA MECÁNICA

Una buena mecánica debe ser al menos dos de estas tres cosas:

```text
DIVERTIDA
EDUCATIVA
NARRATIVA
```

Idealmente las tres.

---

# 165. CRITERIO DE UN BUEN PUZZLE

Debe permitir al jugador:

1. observar;
2. formular una hipótesis;
3. probar;
4. ver consecuencias;
5. corregir.

---

# 166. CRITERIO DE BUEN FEEDBACK

Debe responder:

```text
¿qué ocurrió?
¿por qué ocurrió?
¿qué puedo cambiar?
```

---

# 167. CRITERIO DE BUEN DISEÑO ENERGÉTICO

No comparar tecnologías con un único número.

Mostrar trade-offs.

---

# 168. CRITERIO DE BUEN DISEÑO DE ALGORITMOS

No premiar memorizar sintaxis.

Premiar entender lógica.

---

# 169. REGLA DE COLOR

Cada nuevo concepto puede introducir un color funcional, pero la interfaz debe mantener consistencia.

---

# 170. INTERFAZ DIDÁCTICA

No mostrar paneles densos permanentemente.

Usar capas:

- HUD mínimo;
- detalle bajo demanda;
- Debug Lens para profundidad.

---

# 171. ANIMACIONES EDUCATIVAS

Una variable que aumenta debe cambiar visualmente.

Un loop debe repetir físicamente.

Una función debe mostrar llamada y retorno.

---

# 172. SIMULACIÓN COMO EXPLICACIÓN

Cuando un concepto pueda mostrarse mediante comportamiento del mundo, preferirlo sobre texto.

---

# 173. MODO EXPLORACIÓN

No todos los minutos deben tener puzzle.

Permitir:

- caminar;
- hablar;
- descubrir;
- coleccionar;
- observar.

---

# 174. RITMO EDUCATIVO

Alternar:

```text
concepto nuevo
↓
práctica
↓
aventura
↓
transferencia
↓
descanso
```

---

# 175. INFORMACIÓN OPCIONAL AVANZADA

Puede incluirse en Atlas Aurora:

- factor de capacidad;
- eficiencia;
- pérdidas;
- potencia vs energía;
- despacho;
- demanda pico.

No hacerla obligatoria para estudiantes principiantes.

---

# 176. PODERES COMO CONOCIMIENTO

Cada habilidad desbloqueada debe representar un concepto aprendido.

---

# 177. EVITAR GRINDING

No exigir repetir actividades simples para ganar XP.

---

# 178. XP

Recompensar:

- resolver;
- explorar;
- explicar;
- depurar;
- transferir.

---

# 179. LOGROS

Ejemplos:

```text
SIN BUCLES INFINITOS
MAESTRO DEL VIENTO
DEBUGGER DE AURORA
EQUILIBRIO PERFECTAMENTE IMPERFECTO
```

---

# 180. CONTROLES SUGERIDOS

```text
A / ←    mover izquierda
D / →    mover derecha
W / ↑    subir / contextual
S / ↓    bajar
SPACE    saltar
E        interactuar
Q        habilidad
F        Debug Lens
B        Flowchart / Blueprint
C        Atlas Aurora
H        pista
ESC      pausa
```

---

# 181. CONTROLES TÁCTILES

Mostrar solo cuando sea necesario.

---

# 182. MENÚ PRINCIPAL

```text
NUEVA PARTIDA
CONTINUAR
AURORA LAB
MODO DOCENTE
AJUSTES
```

AURORA LAB bloqueado hasta progreso suficiente.

---

# 183. PANTALLA DE TÍTULO

Animación:

- sol;
- molino;
- río;
- luces;
- PÍX cruza la pantalla y casi choca con el título.

---

# 184. INSTRUCCIÓN FINAL AL AGENTE

Leer también:

```text
LUMINA_LOOP_STORY_BIBLE.md
```

No implementar mecánicas sin contexto.

No escribir historia separada del juego.

No depender de Internet.

No utilizar recursos externos.

No dejar TODO esenciales.

Entregar un único HTML jugable, completo, colorido, hermoso, pedagógico y narrativamente integrado.

El resultado debe sentirse como una aventura fantástica en Pixel Art donde:

> **cada algoritmo mueve el mundo y cada fuente de energía cambia la aventura.**
