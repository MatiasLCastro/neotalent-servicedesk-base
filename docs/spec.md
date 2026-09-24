# Spec — Fase 1 (Sesión 3)

Spec de funcionalidad para el Mini Service Desk, escrito siguiendo Spec Driven Development:
qué debe hacer la app, qué no, y los criterios de aceptación de cada requisito. Cumple
[`docs/constitution.md`](constitution.md) — en caso de conflicto, gana la constitución.

## Resumen

Una bandeja de incidencias de seguridad física con cuatro piezas: lista + ficha de tickets,
clasificación de prioridad/categoría asistida por Claude Code, un panel de métricas, y alta de
tickets nuevos guardados en el navegador. Sin backend: HTML + CSS + JS plano sobre
`data/tickets.json` para los tickets del dataset y `localStorage` para los creados en el
navegador (artículo 1 de la constitución).

## Arquitectura (decisiones ya tomadas, guían la Fase 3)

- `app.js` hace `fetch('data/tickets.json')` una vez al cargar y guarda el resultado en un
  estado en memoria: `tickets` (array), `vista` (`'bandeja'` | `'ficha'`), `filtro` (estado),
  `ticketSeleccionado` (id o `null`).
- Sin routing por hash ni por URL: cambiar de vista es solo cambiar `state.vista` y volver a
  renderizar. No hay deep-link a un ticket ni botón "atrás" del navegador para la ficha —
  decisión consciente por simplicidad (YAGNI para el alcance de este proyecto).
- `js/utils/` calcula (filtrar, agrupar por sistema/zona/estado, generar el texto del prompt
  de clasificación) sin tocar el DOM. `js/components/` recibe esos datos ya calculados y
  pinta HTML. `app.js` orquesta fetch, estado y eventos. (Artículo 4 de la constitución.)
- Los tickets creados en el navegador (Feature 4) se leen/escriben en `localStorage` a través
  de una función de `js/utils/` con el storage inyectado como parámetro — mismo patrón que
  `cargarTickets(fetchImpl)` (Feature 1) usa con `fetch`, para poder testearla desde Node sin
  un navegador real. Al iniciar y al actualizar datos, `app.js` concatena esos tickets con los
  de `data/tickets.json` dentro de `state.tickets`: el resto de la app (filtro, ficha,
  métricas) los trata igual que a cualquier otro ticket, sin lógica aparte.

## Feature 1 — Bandeja de tickets + ficha de detalle

**Requisitos**
- La bandeja lista los 60 tickets de `data/tickets.json`: id, título, estado, zona, sistema
  afectado y fecha.
- Filtro por estado con tres opciones: Todos, Abiertos, Cerrados.
- Al hacer click en un ticket de la lista, la app cambia a la vista "ficha" y muestra todos
  sus campos (`id`, `titulo`, `descripcion`, `sistema_afectado`, `reportado_por`, `zona`,
  `fecha`, `estado`) más `prioridad`/`categoria` si ya existen, o la etiqueta "Sin clasificar"
  si no.
- Un link/botón "Volver a la bandeja" regresa a la vista de lista conservando el filtro activo.

**Criterios de aceptación**
- Dado el dataset completo, cuando no hay filtro aplicado, entonces la bandeja muestra
  exactamente 60 tickets.
- Dado el filtro "Abiertos", cuando se aplica, entonces la bandeja muestra exactamente los
  tickets con `estado: "abierto"` (50 en el dataset actual) y ninguno con `estado: "cerrado"`.
- Dado un click en un ticket de la lista, cuando se abre su ficha, entonces los 8 campos del
  registro JSON de ese ticket son visibles en la página.
- Dado un ticket sin `prioridad` ni `categoria` en el JSON, cuando se abre su ficha, entonces
  se muestra la etiqueta "Sin clasificar" en lugar de un valor vacío o `undefined`.

## Feature 2 — Clasificación de prioridad y categoría asistida por Claude Code

**Requisitos**
- La clasificación se hace fuera del navegador: ninguna llamada de red a un LLM se dispara
  desde el JS de la app (artículo 3 de la constitución).
- En la ficha de un ticket sin `prioridad`, aparece un botón "Clasificar con Claude Code".
- Al clickearlo, la app genera un prompt de texto con `id`, `titulo`, `descripcion`,
  `sistema_afectado` y `zona` del ticket, y lo copia al portapapeles
  (`navigator.clipboard.writeText`).
- El prompt pide explícitamente que la respuesta traiga:
  - `prioridad`: una de `Crítica`, `Alta`, `Media`, `Baja`.
  - `categoria`: una de `Control de accesos`, `SailPoint (identidades)`,
    `Centralita de guardia`, `Central de alarmas`, `App de rondas`,
    `CCTV / videovigilancia` (las 6 categorías ya presentes como `sistema_afectado` en el
    dataset — la clasificación normaliza, no inventa una taxonomía nueva).
  - Instrucción de reescribir esos dos campos en `data/tickets.json`, solo para ese ticket,
    sin tocar el resto del archivo.
- Un botón "Actualizar datos" (visible en bandeja y en ficha) vuelve a hacer `fetch` de
  `data/tickets.json` y re-renderiza la vista activa con los datos nuevos.
- Si `navigator.clipboard` no está disponible, el prompt se muestra en un `<textarea>`
  seleccionable en lugar de copiarse automáticamente.

**Criterios de aceptación**
- Dado un ticket sin `prioridad`, cuando se clickea "Clasificar con Claude Code", entonces el
  contenido copiado al portapapeles incluye el `id` exacto del ticket y las 4 opciones de
  prioridad listadas textualmente.
- Dado que `data/tickets.json` fue reescrito por fuera de la app añadiendo `prioridad` y
  `categoria` a un ticket, cuando se clickea "Actualizar datos", entonces la ficha de ese
  ticket muestra esos dos valores nuevos sin necesidad de recargar la página completa (F5).
- Dado un ticket que ya tiene `prioridad`, cuando se abre su ficha, entonces el botón
  "Clasificar con Claude Code" no se muestra (evita reclasificar por accidente).

## Feature 3 — Panel de métricas

**Requisitos**
- Vive dentro de la misma pantalla de la bandeja (no es una vista separada ni requiere
  navegación).
- Tres grupos de barras, construidas con `<div>` + `width` inline en porcentaje (sin canvas,
  SVG externo ni librería de charting — artículo 1):
  - Incidencias por sistema afectado (6 barras).
  - Incidencias por zona (12 barras, según las zonas presentes en el dataset).
  - Incidencias por estado (2 barras: abierto/cerrado).
- Los conteos se recalculan sobre el array de tickets en memoria cada vez que cambia el
  filtro de la bandeja o se actualizan los datos.

**Criterios de aceptación**
- Dado el dataset sin filtrar, cuando se renderiza el panel, entonces la suma de las barras
  "por estado" es igual al total de tickets cargados (60).
- Dado que se aplica el filtro "Abiertos" en la bandeja, cuando el panel se recalcula,
  entonces las barras "por estado" muestran únicamente la barra "abierto" con el conteo total
  y "cerrado" en cero (o no se muestra).
- Dado que se actualiza `data/tickets.json` (Feature 2) y se clickea "Actualizar datos",
  cuando el panel se recalcula, entonces sus conteos reflejan el dataset recién cargado.

## Feature 4 — Alta de tickets nuevos (solo en el navegador)

**Requisitos**
- La bandeja tiene un botón "Nuevo ticket".
- Al hacer click, se muestra un formulario con los campos: título, descripción, sistema
  afectado (uno de los 6 valores ya usados como `sistema_afectado` en el dataset, vía
  `<select>`), zona (texto libre) y reportado por (texto libre). Los cinco son obligatorios.
- Al enviar el formulario con todos los campos completos, la app genera el resto del registro
  — `id` (prefijo `LOCAL-` + contador, para no chocar con los `SVD-xxxx` del dataset),
  `estado: "abierto"` y `fecha` (la fecha actual) — y lo guarda en `localStorage`. El ticket
  aparece de inmediato en la bandeja, sin recargar la página.
- Los tickets guardados en `localStorage` persisten entre recargas de página, pero solo en ese
  navegador: no hay sincronización entre dispositivos, pestañas ni servidor.
- Un ticket creado en el navegador no se puede editar ni borrar después de guardarse (ver
  "Fuera de alcance") ni clasificar con el flujo de Feature 2 — ese flujo asume que Claude
  Code edita `data/tickets.json` directamente, y estos tickets no viven ahí. Su ficha muestra
  "Sin clasificar" de forma permanente y no ofrece el botón "Clasificar con Claude Code".

**Criterios de aceptación**
- Dado el formulario "Nuevo ticket" completo y válido, cuando se envía, entonces aparece un
  ticket nuevo en la bandeja con `estado: "abierto"`, sin recargar la página y sin modificar
  `data/tickets.json`.
- Dado un ticket creado en el navegador, cuando se recarga la página (F5), entonces el ticket
  sigue apareciendo en la bandeja, leído desde `localStorage`.
- Dado un ticket creado en el navegador, cuando se abre su ficha, entonces se muestra "Sin
  clasificar" y no aparece el botón "Clasificar con Claude Code".
- Dado el formulario con algún campo obligatorio vacío, cuando se intenta enviar, entonces el
  ticket no se crea y la app indica qué campo falta.
- Dado un ticket creado en el navegador, cuando se clickea "Actualizar datos" (Feature 2, que
  vuelve a hacer `fetch` de `data/tickets.json`), entonces el ticket sigue apareciendo en la
  bandeja junto con los del dataset.

## Fuera de alcance

Explícito, por el artículo 5 de la constitución — nada de esto entra sin reescribir primero
este documento:

- Edición o borrado de tickets existentes desde la UI — la Fase 1 solo agrega altas nuevas
  (Feature 4), nunca edición ni borrado, ni siquiera de los tickets creados en el navegador.
- Clasificación de prioridad/categoría para tickets creados en el navegador — Feature 2 solo
  aplica a tickets de `data/tickets.json` (ver Feature 4).
- Sincronización entre dispositivos o pestañas de los tickets creados en el navegador, y
  cualquier backend o base de datos para guardarlos — quedan solo en el `localStorage` de ese
  navegador (artículo 1 de la constitución).
- Autenticación o control de acceso.
- Backend, servidor o base de datos — todo corre en el navegador sobre archivos estáticos.
- Persistencia del filtro o de la vista activa entre recargas de página.
- Cualquier llamada a un LLM (u otra API externa) hecha desde el JS del navegador.
- Routing por URL/hash para deep-linking a un ticket específico.
- Reclasificación en lote (un solo botón para clasificar todos los tickets pendientes a la
  vez) — la Fase 1 cubre solo clasificación de a un ticket por vez.

## Manejo de errores

- Si el `fetch` de `data/tickets.json` falla (404, JSON malformado, red caída), la app
  muestra un mensaje de error visible en pantalla y no deja la página en blanco ni rota.
- Si `navigator.clipboard` no está disponible o el permiso es denegado, el flujo de
  clasificación cae al `<textarea>` seleccionable descrito en Feature 2 — nunca falla en
  silencio.
