# Registro de actividad en Google Sheets

**Lumina Loop: El Código de los Elementos** · © Aslin Gonzalo Botello Plata

Al empezar una partida, cada estudiante escribe sus nombres y apellidos y marca **tres consentimientos**:

1. que sus datos de juego se envíen a una hoja de cálculo de Google Drive del docente (nombre completo, avances, respuestas, aciertos y errores, logros, objetivos y tiempos);
2. que el docente usará esa información para ver su rendimiento y calificarle;
3. que, si es menor de edad, su madre, padre o acudiente lo conoce y lo autoriza.

Sin los tres no se puede empezar. Desde ese momento el juego anota su actividad y la envía por lotes a la hoja. En el menú de pausa siempre se ve «tu progreso se comparte con tu docente».

## Qué se registra

| Evento | Cuándo |
|---|---|
| `registro` | al registrarse (nombres, apellidos, consentimientos aceptados y fecha) |
| `inicio_sesion` / `pausa` / `reanuda` / `fin_sesion` | al empezar o continuar, al ocultar o volver a la pestaña y al cerrar (con un resumen del progreso) |
| `entra_a_nivel` | al entrar en una isla, arena o sala |
| `reto` / `simulador` / `parche_jefe` | al terminar o abandonar un reto: estrellas, ejecuciones, errores, pistas, segundos y, en los retos de código, el programa final |
| `error_en_reto` | cada ejecución fallida, con la explicación del error |
| `cerradura` | cada respuesta en un cofre de código (acierto o error y la respuesta elegida) |
| `carta_repaso` | cada respuesta en el repaso de cartas |
| `forja` | cada respuesta en la forja del Lumisable |
| `logro`, `mision`, `habilidad`, `atlas` | logros, misiones iniciadas o completadas, habilidades nuevas y entradas del Atlas |
| `isla_restaurada`, `jefe_vencido`, `minijefe_vencido`, `final_del_juego`, `hito` | avances de la historia |
| `derrota` | al perder todas las células (qué la venció) |
| `entrenamiento` | al completar el patio de entrenamiento (tiempo) |

La hoja **Registro** guarda una fila por evento. La hoja **Estudiantes** guarda una fila por estudiante con un resumen para calificar: retos superados y sin terminar, errores, estrellas, cerraduras acertadas y falladas, derrotas, logros, islas, jefes, nivel y minutos jugados.

## Cómo conectarlo (una sola vez)

1. Crea una hoja de cálculo nueva en Google Drive (por ejemplo, «Lumina Loop · Registro de la clase»).
2. Menú **Extensiones → Apps Script**. Borra lo que haya y pega todo el contenido de [`Registro.gs`](Registro.gs). Guarda.
3. **Implementar → Nueva implementación** → tipo **Aplicación web**.
   - *Ejecutar como*: **Yo**.
   - *Quién tiene acceso*: **Cualquier usuario** (los estudiantes no necesitan cuenta de Google).
   - Pulsa **Implementar** y autoriza el acceso cuando lo pida.
4. Copia la **URL de la aplicación web** (termina en `/exec`).
5. Pégala en `src/04_registro.js`, en la línea `const REGISTRO_URL = ...` (entre las comillas), compila con `node tools/build.js` y publica. **Ya está conectada** la aplicación web de esta clase (versión 1 del 1 oct 2026).

Para comprobar que funciona, abre la URL en el navegador: debe decir «Lumina Loop: registro de actividad activo». Después juega una partida de prueba y mira la hoja **Registro** (los eventos llegan en lotes, cada 20 segundos o al cerrar la pestaña).

## Notas

- Si un estudiante juega sin conexión, sus eventos esperan en su dispositivo y se envían cuando vuelve a haber red.
- Cualquiera que conozca la URL podría enviar filas: compártela solo dentro del juego publicado.
- Si cambias el código de `Registro.gs`, vuelve a **Implementar → Gestionar implementaciones → Editar → Nueva versión** para que se aplique.
- Al tratarse de datos de estudiantes (muchas veces menores de edad), conserva la hoja solo con acceso del docente y usa la información únicamente para acompañar y evaluar el aprendizaje, como dice el consentimiento.
