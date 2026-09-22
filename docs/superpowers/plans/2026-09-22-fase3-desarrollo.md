# Mini Service Desk — Fase 3 (Desarrollo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the working Mini Service Desk app — ticket list + detail, Claude-Code-assisted
classification via clipboard, and a metrics panel — as plain HTML/CSS/JS with no build step.

**Architecture:** `app.js` holds an in-memory state object (`tickets`, `vista`, `filtro`,
`ticketSeleccionado`) and re-renders on every change; no hash routing. `js/utils/` holds pure,
DOM-free functions (filtering, counting, prompt text, the fetch wrapper) testable from Node
with zero dependencies. `js/components/` holds pure functions that turn data into HTML strings
— no DOM access, no fetch. `app.js` is the only file that touches `document`, wires event
delegation, and calls `fetch`.

**Tech Stack:** Vanilla HTML/CSS/JS, classic (non-module) `<script>` tags, UMD-style exports
(`window.X` in the browser, `module.exports` in Node) so the same file works unmodified in
both. Tests run with Node's built-in test runner (`node --test`) — ships with Node, no
`npm install`, no `package.json`, no test framework dependency.

**Spec:** [`docs/spec.md`](../../spec.md) — this plan implements it. Executors should read
both this plan and the spec; the spec's acceptance criteria are the source of truth for
"done."

## Global Constraints

(From [`docs/constitution.md`](../../constitution.md) — copied verbatim, applies to every task below.)

- **Artículo 1 — sin build, sin dependencias:** no `package.json`, no `node_modules/`, no
  build step. `node --test` is fine to run during development — it ships with Node itself,
  nothing to install — but it is a dev-time check, never something the app or a visitor needs.
- **Artículo 3 — la clasificación no llama a ningún LLM desde el navegador:** no `fetch`/`XHR`
  to any AI endpoint anywhere in `js/`. The "Clasificar" button only builds text and copies it
  to the clipboard.
- **Artículo 4 — separación de responsabilidades:** `js/components/**` never references
  `tickets.json` or does its own fetching; `js/utils/**` never touches `document` or any DOM
  API.
- **Artículo 5 — alcance cerrado:** no editing/creating tickets, no auth, no backend, no
  filter/view persistence across reloads, no hash routing, no bulk classification. If a task
  below seems to need any of these, stop and flag it instead of adding it.
- **Artículo 6 — todo requisito tiene criterio de aceptación comprobable:** every task cites
  the exact spec criterion it satisfies.

---

## Task 1: `js/utils/tickets.js` — filtrado y conteo

**Files:**
- Create: `js/utils/tickets.js`
- Test: `js/utils/tickets.test.js`

**Interfaces:**
- Produces: `filtrarPorEstado(tickets: Ticket[], estado: 'todos'|'abierto'|'cerrado') => Ticket[]`
- Produces: `contarPorCampo(tickets: Ticket[], campo: string) => Record<string, number>`
- Both exported as `window.Utils.filtrarPorEstado` / `window.Utils.contarPorCampo` in the
  browser, and via `module.exports` in Node.

- [ ] **Step 1: Write the failing tests**

```js
// js/utils/tickets.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { filtrarPorEstado, contarPorCampo } = require("./tickets.js");

const tickets = [
  { id: "A", estado: "abierto", sistema_afectado: "Control de accesos" },
  { id: "B", estado: "cerrado", sistema_afectado: "Control de accesos" },
  { id: "C", estado: "abierto", sistema_afectado: "SailPoint (identidades)" },
];

test("filtrarPorEstado('todos') devuelve todos los tickets", () => {
  assert.equal(filtrarPorEstado(tickets, "todos").length, 3);
});

test("filtrarPorEstado('abierto') devuelve solo los abiertos", () => {
  const resultado = filtrarPorEstado(tickets, "abierto");
  assert.equal(resultado.length, 2);
  assert.ok(resultado.every((t) => t.estado === "abierto"));
});

test("filtrarPorEstado('cerrado') devuelve solo los cerrados", () => {
  const resultado = filtrarPorEstado(tickets, "cerrado");
  assert.deepEqual(resultado.map((t) => t.id), ["B"]);
});

test("contarPorCampo agrupa y cuenta por el campo indicado", () => {
  const conteo = contarPorCampo(tickets, "sistema_afectado");
  assert.deepEqual(conteo, {
    "Control de accesos": 2,
    "SailPoint (identidades)": 1,
  });
});

test("contarPorCampo por estado suma el total de tickets", () => {
  const conteo = contarPorCampo(tickets, "estado");
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  assert.equal(total, tickets.length);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/utils/tickets.test.js`
Expected: FAIL — `Cannot find module './tickets.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/utils/tickets.js
function filtrarPorEstado(tickets, estado) {
  if (estado === "todos") return tickets.slice();
  return tickets.filter((t) => t.estado === estado);
}

function contarPorCampo(tickets, campo) {
  const conteo = {};
  for (const ticket of tickets) {
    const valor = ticket[campo];
    conteo[valor] = (conteo[valor] || 0) + 1;
  }
  return conteo;
}

if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.filtrarPorEstado = filtrarPorEstado;
  window.Utils.contarPorCampo = contarPorCampo;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { filtrarPorEstado, contarPorCampo };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/utils/tickets.test.js`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/tickets.js js/utils/tickets.test.js
git commit -m "feat: add ticket filtering and counting utils"
```

**Satisfies:** spec Feature 1 acceptance criteria (filtro por estado exacto) and Feature 3
(conteos por campo, base de las barras del panel de métricas).

---

## Task 2: `js/utils/prompt.js` — texto de clasificación

**Files:**
- Create: `js/utils/prompt.js`
- Test: `js/utils/prompt.test.js`

**Interfaces:**
- Consumes: none (pure function, takes a plain ticket object)
- Produces: `generarPromptClasificacion(ticket: Ticket) => string`, plus the constants
  `PRIORIDADES: string[]` (4 items) and `CATEGORIAS: string[]` (6 items), all under
  `window.Utils.*` / `module.exports`.

- [ ] **Step 1: Write the failing tests**

```js
// js/utils/prompt.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generarPromptClasificacion, PRIORIDADES, CATEGORIAS } = require("./prompt.js");

const ticket = {
  id: "SVD-4108",
  titulo: "Puerta de emergencia abierta sin alarma en Edificio B, planta 3",
  descripcion: "La puerta de emergencia se ha quedado abierta y el sensor no ha lanzado alarma.",
  sistema_afectado: "Control de accesos",
  zona: "Edificio B, planta 3",
};

test("PRIORIDADES tiene las 4 opciones del spec", () => {
  assert.deepEqual(PRIORIDADES, ["Crítica", "Alta", "Media", "Baja"]);
});

test("CATEGORIAS tiene las 6 opciones del spec", () => {
  assert.deepEqual(CATEGORIAS, [
    "Control de accesos",
    "SailPoint (identidades)",
    "Centralita de guardia",
    "Central de alarmas",
    "App de rondas",
    "CCTV / videovigilancia",
  ]);
});

test("el prompt incluye el id exacto del ticket", () => {
  assert.ok(generarPromptClasificacion(ticket).includes("SVD-4108"));
});

test("el prompt lista las 4 prioridades textualmente", () => {
  const prompt = generarPromptClasificacion(ticket);
  for (const prioridad of PRIORIDADES) {
    assert.ok(prompt.includes(prioridad), `falta la prioridad ${prioridad}`);
  }
});

test("el prompt lista las 6 categorías textualmente", () => {
  const prompt = generarPromptClasificacion(ticket);
  for (const categoria of CATEGORIAS) {
    assert.ok(prompt.includes(categoria), `falta la categoría ${categoria}`);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/utils/prompt.test.js`
Expected: FAIL — `Cannot find module './prompt.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/utils/prompt.js
const PRIORIDADES = ["Crítica", "Alta", "Media", "Baja"];
const CATEGORIAS = [
  "Control de accesos",
  "SailPoint (identidades)",
  "Centralita de guardia",
  "Central de alarmas",
  "App de rondas",
  "CCTV / videovigilancia",
];

function generarPromptClasificacion(ticket) {
  return [
    `Clasifica el ticket ${ticket.id} del Mini Service Desk.`,
    "",
    `Título: ${ticket.titulo}`,
    `Descripción: ${ticket.descripcion}`,
    `Sistema afectado: ${ticket.sistema_afectado}`,
    `Zona: ${ticket.zona}`,
    "",
    `Elegí una prioridad de esta lista: ${PRIORIDADES.join(", ")}.`,
    `Elegí una categoría de esta lista: ${CATEGORIAS.join(", ")}.`,
    "",
    `Reescribí data/tickets.json agregando "prioridad" y "categoria" al`,
    `ticket ${ticket.id}, sin tocar ningún otro campo ni ningún otro ticket.`,
  ].join("\n");
}

if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.generarPromptClasificacion = generarPromptClasificacion;
  window.Utils.PRIORIDADES = PRIORIDADES;
  window.Utils.CATEGORIAS = CATEGORIAS;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generarPromptClasificacion, PRIORIDADES, CATEGORIAS };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/utils/prompt.test.js`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/prompt.js js/utils/prompt.test.js
git commit -m "feat: add classification prompt builder"
```

**Satisfies:** spec Feature 2 acceptance criterion — "el contenido copiado al portapapeles
incluye el id exacto del ticket y las 4 opciones de prioridad listadas textualmente."

---

## Task 3: `js/utils/datos.js` — carga de tickets con manejo de error

**Files:**
- Create: `js/utils/datos.js`
- Test: `js/utils/datos.test.js`

**Interfaces:**
- Consumes: a `fetch`-shaped function, injected by the caller (never the global `fetch`
  directly — this is what makes it testable from Node without a browser).
- Produces: `async cargarTickets(fetchImpl: Function) => { ok: true, tickets: Ticket[] } | { ok: false, error: string }`,
  exposed as `window.Utils.cargarTickets` / `module.exports`.

- [ ] **Step 1: Write the failing tests**

```js
// js/utils/datos.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargarTickets } = require("./datos.js");

test("cargarTickets devuelve ok:true con los tickets cuando el fetch funciona", async () => {
  const fetchFalso = async () => ({
    ok: true,
    json: async () => [{ id: "A" }, { id: "B" }],
  });
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, true);
  assert.equal(resultado.tickets.length, 2);
});

test("cargarTickets devuelve ok:false cuando el HTTP falla", async () => {
  const fetchFalso = async () => ({ ok: false, status: 404 });
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /404/);
});

test("cargarTickets devuelve ok:false cuando el fetch rechaza (red caída)", async () => {
  const fetchFalso = async () => {
    throw new Error("network down");
  };
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.error, "network down");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/utils/datos.test.js`
Expected: FAIL — `Cannot find module './datos.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/utils/datos.js
async function cargarTickets(fetchImpl) {
  try {
    const respuesta = await fetchImpl("data/tickets.json");
    if (!respuesta.ok) {
      return { ok: false, error: `HTTP ${respuesta.status}` };
    }
    const tickets = await respuesta.json();
    return { ok: true, tickets };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.cargarTickets = cargarTickets;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { cargarTickets };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/utils/datos.test.js`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/utils/datos.js js/utils/datos.test.js
git commit -m "feat: add ticket loading with injectable fetch"
```

**Satisfies:** spec "Manejo de errores" — fetch failure must show a visible message, never a
blank/broken page. `app.js` (Task 7) will call `cargarTickets(fetch)` and branch on `.ok`.

---

## Task 4: `js/components/listaTickets.js`

**Files:**
- Create: `js/components/listaTickets.js`
- Test: `js/components/listaTickets.test.js`

**Interfaces:**
- Consumes: `Ticket[]` (already filtered — this component does no filtering itself)
- Produces: `renderListaTickets(tickets: Ticket[]) => string` (HTML). Each ticket row is a
  `<div class="ticket-row" data-ticket-id="...">` — `app.js` (Task 8) reads that attribute via
  event delegation, this component never attaches listeners itself.

- [ ] **Step 1: Write the failing tests**

```js
// js/components/listaTickets.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderListaTickets } = require("./listaTickets.js");

const tickets = [
  { id: "A", estado: "abierto", titulo: "Uno", sistema_afectado: "X", zona: "Y", fecha: "2026-09-01" },
  { id: "B", estado: "cerrado", titulo: "Dos", sistema_afectado: "X", zona: "Y", fecha: "2026-09-02" },
];

test("renderiza una fila por ticket con su data-ticket-id", () => {
  const html = renderListaTickets(tickets);
  assert.match(html, /data-ticket-id="A"/);
  assert.match(html, /data-ticket-id="B"/);
});

test("muestra un mensaje cuando la lista está vacía", () => {
  const html = renderListaTickets([]);
  assert.match(html, /No hay tickets/);
});

test("escapa HTML en los campos de texto", () => {
  const conHtml = [
    { id: "A", estado: "abierto", titulo: "<script>alert(1)</script>", sistema_afectado: "X", zona: "Y", fecha: "2026-09-01" },
  ];
  const html = renderListaTickets(conHtml);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/components/listaTickets.test.js`
Expected: FAIL — `Cannot find module './listaTickets.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/components/listaTickets.js
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderListaTickets(tickets) {
  if (tickets.length === 0) {
    return '<p class="lista-vacia">No hay tickets para este filtro.</p>';
  }
  const filas = tickets
    .map(
      (t) => `
      <div class="ticket-row" data-ticket-id="${escaparHtml(t.id)}">
        <span class="ticket-id">${escaparHtml(t.id)}</span>
        <span class="ticket-estado ticket-estado--${escaparHtml(t.estado)}">${escaparHtml(t.estado)}</span>
        <span class="ticket-titulo">${escaparHtml(t.titulo)}</span>
        <span class="ticket-sistema">${escaparHtml(t.sistema_afectado)}</span>
        <span class="ticket-zona">${escaparHtml(t.zona)}</span>
        <span class="ticket-fecha">${escaparHtml(t.fecha)}</span>
      </div>`
    )
    .join("");
  return `<div class="lista-tickets">${filas}</div>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderListaTickets = renderListaTickets;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderListaTickets };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/components/listaTickets.test.js`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/components/listaTickets.js js/components/listaTickets.test.js
git commit -m "feat: add ticket list component"
```

**Satisfies:** spec Feature 1 — bandeja lista id/título/estado/zona/sistema/fecha.

---

## Task 5: `js/components/fichaTicket.js`

**Files:**
- Create: `js/components/fichaTicket.js`
- Test: `js/components/fichaTicket.test.js`

**Interfaces:**
- Consumes: one `Ticket` object (all 8 base fields, plus optional `prioridad`/`categoria`)
- Produces: `renderFichaTicket(ticket: Ticket) => string` (HTML). Includes a
  `<button class="btn-volver">` and, only when `!ticket.prioridad`, a
  `<button class="btn-clasificar" data-ticket-id="...">` — `app.js` (Tasks 8–9) wires both via
  delegation.

- [ ] **Step 1: Write the failing tests**

```js
// js/components/fichaTicket.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderFichaTicket } = require("./fichaTicket.js");

const ticketSinClasificar = {
  id: "SVD-4108",
  titulo: "Puerta de emergencia abierta",
  descripcion: "Detalle.",
  sistema_afectado: "Control de accesos",
  zona: "Edificio B, planta 3",
  reportado_por: "Guardia de seguridad",
  fecha: "2026-09-10",
  estado: "abierto",
};

const ticketClasificado = { ...ticketSinClasificar, prioridad: "Alta", categoria: "Control de accesos" };

test("muestra 'Sin clasificar' cuando el ticket no tiene prioridad", () => {
  assert.match(renderFichaTicket(ticketSinClasificar), /Sin clasificar/);
});

test("muestra el botón Clasificar cuando el ticket no tiene prioridad", () => {
  const html = renderFichaTicket(ticketSinClasificar);
  assert.match(html, /btn-clasificar/);
  assert.match(html, /data-ticket-id="SVD-4108"/);
});

test("oculta el botón Clasificar cuando el ticket ya tiene prioridad", () => {
  assert.ok(!renderFichaTicket(ticketClasificado).includes("btn-clasificar"));
});

test("muestra los 8 campos base del ticket", () => {
  const html = renderFichaTicket(ticketClasificado);
  for (const valor of [
    ticketClasificado.id,
    ticketClasificado.titulo,
    ticketClasificado.descripcion,
    ticketClasificado.sistema_afectado,
    ticketClasificado.zona,
    ticketClasificado.reportado_por,
    ticketClasificado.fecha,
    ticketClasificado.estado,
  ]) {
    assert.ok(html.includes(valor), `falta el campo con valor ${valor}`);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/components/fichaTicket.test.js`
Expected: FAIL — `Cannot find module './fichaTicket.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/components/fichaTicket.js
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderFichaTicket(ticket) {
  const prioridad = ticket.prioridad
    ? `<span class="ficha-prioridad">${escaparHtml(ticket.prioridad)}</span>`
    : '<span class="ficha-sin-clasificar">Sin clasificar</span>';
  const categoria = ticket.categoria
    ? `<span class="ficha-categoria">${escaparHtml(ticket.categoria)}</span>`
    : '<span class="ficha-sin-clasificar">Sin clasificar</span>';
  const botonClasificar = ticket.prioridad
    ? ""
    : `<button class="btn-clasificar" data-ticket-id="${escaparHtml(ticket.id)}">Clasificar con Claude Code</button>`;

  return `
    <article class="ficha-ticket">
      <button class="btn-volver">&larr; Volver a la bandeja</button>
      <h2>${escaparHtml(ticket.id)} — ${escaparHtml(ticket.titulo)}</h2>
      <p class="ficha-descripcion">${escaparHtml(ticket.descripcion)}</p>
      <dl class="ficha-campos">
        <dt>Sistema afectado</dt><dd>${escaparHtml(ticket.sistema_afectado)}</dd>
        <dt>Zona</dt><dd>${escaparHtml(ticket.zona)}</dd>
        <dt>Reportado por</dt><dd>${escaparHtml(ticket.reportado_por)}</dd>
        <dt>Fecha</dt><dd>${escaparHtml(ticket.fecha)}</dd>
        <dt>Estado</dt><dd>${escaparHtml(ticket.estado)}</dd>
        <dt>Prioridad</dt><dd>${prioridad}</dd>
        <dt>Categoría</dt><dd>${categoria}</dd>
      </dl>
      ${botonClasificar}
    </article>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderFichaTicket = renderFichaTicket;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderFichaTicket };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/components/fichaTicket.test.js`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/components/fichaTicket.js js/components/fichaTicket.test.js
git commit -m "feat: add ticket detail component"
```

**Satisfies:** spec Feature 1 (8 campos visibles, "Sin clasificar") and Feature 2 ("el botón
Clasificar no se muestra" cuando ya hay prioridad).

---

## Task 6: `js/components/panelMetricas.js`

**Files:**
- Create: `js/components/panelMetricas.js`
- Test: `js/components/panelMetricas.test.js`

**Interfaces:**
- Consumes: `{ porSistema: Record<string,number>, porZona: Record<string,number>, porEstado: Record<string,number> }`
  — three counts already computed by `Utils.contarPorCampo` (Task 1). This component does no
  aggregation of raw tickets itself.
- Produces: `renderPanelMetricas(counts) => string` (HTML, three bar groups).

- [ ] **Step 1: Write the failing tests**

```js
// js/components/panelMetricas.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderPanelMetricas } = require("./panelMetricas.js");

test("renderiza una fila de barra por cada valor de cada grupo", () => {
  const html = renderPanelMetricas({
    porSistema: { "Control de accesos": 2, "SailPoint (identidades)": 1 },
    porZona: { "Torre de control": 1 },
    porEstado: { abierto: 2, cerrado: 1 },
  });
  assert.match(html, /Control de accesos \(2\)/);
  assert.match(html, /SailPoint \(identidades\) \(1\)/);
  assert.match(html, /Torre de control \(1\)/);
  assert.match(html, /abierto \(2\)/);
  assert.match(html, /cerrado \(1\)/);
});

test("la barra con más conteo llega al 100% de ancho", () => {
  const html = renderPanelMetricas({
    porSistema: { A: 4, B: 2 },
    porZona: {},
    porEstado: {},
  });
  assert.match(html, /width: 100%/);
  assert.match(html, /width: 50%/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test js/components/panelMetricas.test.js`
Expected: FAIL — `Cannot find module './panelMetricas.js'`

- [ ] **Step 3: Write the implementation**

```js
// js/components/panelMetricas.js
function renderGrupoBarras(titulo, conteo) {
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const max = entradas.length ? Math.max(...entradas.map(([, n]) => n)) : 0;
  const barras = entradas
    .map(([etiqueta, n]) => {
      const ancho = max ? Math.round((n / max) * 100) : 0;
      return `
        <div class="barra-fila">
          <span class="barra-etiqueta">${etiqueta} (${n})</span>
          <div class="barra-track"><div class="barra-relleno" style="width: ${ancho}%"></div></div>
        </div>`;
    })
    .join("");
  return `<section class="grupo-barras"><h3>${titulo}</h3>${barras}</section>`;
}

function renderPanelMetricas({ porSistema, porZona, porEstado }) {
  return `
    <div class="panel-metricas">
      ${renderGrupoBarras("Por sistema afectado", porSistema)}
      ${renderGrupoBarras("Por zona", porZona)}
      ${renderGrupoBarras("Por estado", porEstado)}
    </div>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderPanelMetricas = renderPanelMetricas;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderPanelMetricas, renderGrupoBarras };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test js/components/panelMetricas.test.js`
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add js/components/panelMetricas.js js/components/panelMetricas.test.js
git commit -m "feat: add metrics bar panel component"
```

**Satisfies:** spec Feature 3 — 3 grupos de barras (sistema/zona/estado), sin canvas/SVG/librería.

---

## Task 7: `index.html` + `css/styles.css` + `js/app.js` — carga inicial, filtro, lista, métricas

This is where the 6 pure files above get wired to the page for the first time. It replaces
the old placeholder `index.html`, `css/styles.css` and `js/app.js` entirely.

**Files:**
- Modify: `index.html` (currently the Sesión-2 placeholder read at the top of this plan)
- Modify: `css/styles.css` (currently near-empty placeholder)
- Modify: `js/app.js` (currently the Sesión-2 stub that fetches and sets `#conteo`, which no
  longer exists after this task)

**Interfaces:**
- Consumes: `Utils.cargarTickets`, `Utils.filtrarPorEstado`, `Utils.contarPorCampo` (Tasks
  1 & 3), `Components.renderListaTickets`, `Components.renderPanelMetricas` (Tasks 4 & 6).
- Produces: a `state` object (`{ tickets: Ticket[], filtro: string, vista: string,
  ticketSeleccionado: string|null }`) and `renderBandeja()` — later tasks extend both.

No automated test here — this task is DOM + network wiring, which the project's no-build
constraint (constitution article 1) rules out testing with a headless-browser dependency.
Verify manually against the exact spec criteria listed below.

- [ ] **Step 1: Replace `index.html`**

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mini Service Desk</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="cabecera">
    <h1>Mini Service Desk</h1>
    <div class="acciones-cabecera">
      <select id="filtro-estado">
        <option value="todos">Todos</option>
        <option value="abierto">Abiertos</option>
        <option value="cerrado">Cerrados</option>
      </select>
      <button id="btn-actualizar">Actualizar datos</button>
    </div>
  </header>

  <p id="error-mensaje" class="error-mensaje" hidden></p>

  <main>
    <section id="vista-bandeja">
      <div id="lista-tickets">Cargando tickets…</div>
      <div id="panel-metricas"></div>
    </section>

    <section id="vista-ficha" hidden>
      <div id="ficha-contenido"></div>
    </section>
  </main>

  <div id="clasificar-fallback" class="clasificar-fallback" hidden>
    <p>No se pudo copiar automáticamente. Copiá este texto y pegalo en Claude Code:</p>
    <textarea id="clasificar-textarea" readonly></textarea>
  </div>

  <script src="js/utils/tickets.js"></script>
  <script src="js/utils/prompt.js"></script>
  <script src="js/utils/datos.js"></script>
  <script src="js/components/listaTickets.js"></script>
  <script src="js/components/fichaTicket.js"></script>
  <script src="js/components/panelMetricas.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Replace `css/styles.css`**

```css
body {
  font-family: system-ui, sans-serif;
  max-width: 960px;
  margin: 2rem auto;
  padding: 0 1rem;
  color: #1a1a2e;
}

.cabecera {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.error-mensaje {
  background: #fde2e2;
  color: #7a1f1f;
  padding: 0.75rem 1rem;
  border-radius: 6px;
}

.lista-tickets {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.ticket-row {
  display: grid;
  grid-template-columns: 90px 90px 1fr 160px 140px 90px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}
.ticket-row:hover {
  background: #f4f4f8;
}

.ticket-estado {
  font-size: 0.8rem;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  text-align: center;
}
.ticket-estado--abierto {
  background: #fdecd2;
  color: #8a5a00;
}
.ticket-estado--cerrado {
  background: #dff3e3;
  color: #226b3a;
}

.ficha-ticket {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.ficha-campos {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.4rem 1rem;
}
.ficha-campos dt {
  font-weight: 600;
  color: #555;
}

.ficha-sin-clasificar {
  color: #999;
  font-style: italic;
}

.btn-volver,
.btn-clasificar,
#btn-actualizar {
  cursor: pointer;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  background: white;
}

.panel-metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.grupo-barras h3 {
  margin-bottom: 0.5rem;
}

.barra-fila {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
}

.barra-track {
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
  height: 10px;
}
.barra-relleno {
  background: #4a6cf7;
  height: 100%;
}

.clasificar-fallback textarea {
  width: 100%;
  height: 140px;
}
```

- [ ] **Step 3: Replace `js/app.js` with initial load + filter wiring**

```js
// js/app.js
const state = {
  tickets: [],
  filtro: "todos",
  vista: "bandeja",
  ticketSeleccionado: null,
};

const el = {
  listaTickets: document.getElementById("lista-tickets"),
  panelMetricas: document.getElementById("panel-metricas"),
  filtroEstado: document.getElementById("filtro-estado"),
  errorMensaje: document.getElementById("error-mensaje"),
  vistaBandeja: document.getElementById("vista-bandeja"),
  vistaFicha: document.getElementById("vista-ficha"),
  fichaContenido: document.getElementById("ficha-contenido"),
};

function mostrarError(mensaje) {
  el.errorMensaje.textContent = mensaje;
  el.errorMensaje.hidden = false;
}

function ocultarError() {
  el.errorMensaje.hidden = true;
}

function renderBandeja() {
  const filtrados = Utils.filtrarPorEstado(state.tickets, state.filtro);
  el.listaTickets.innerHTML = Components.renderListaTickets(filtrados);
  el.panelMetricas.innerHTML = Components.renderPanelMetricas({
    porSistema: Utils.contarPorCampo(filtrados, "sistema_afectado"),
    porZona: Utils.contarPorCampo(filtrados, "zona"),
    porEstado: Utils.contarPorCampo(filtrados, "estado"),
  });
}

el.filtroEstado.addEventListener("change", (evento) => {
  state.filtro = evento.target.value;
  renderBandeja();
});

async function iniciar() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    mostrarError(`No se ha podido cargar data/tickets.json (${resultado.error}).`);
    el.listaTickets.innerHTML = "";
    return;
  }
  ocultarError();
  state.tickets = resultado.tickets;
  renderBandeja();
}

iniciar();
```

- [ ] **Step 4: Manual verification**

Open `index.html` directly in a browser (double-click, no server needed) and check, against
spec Feature 1 and Feature 3 acceptance criteria:

1. The header, filter `<select>` and "Actualizar datos" button are visible.
2. The ticket list shows exactly 60 rows (matches `data/tickets.json`'s length).
3. Selecting "Abiertos" in the filter shows exactly 50 rows, all with the `abierto` badge;
   selecting "Cerrados" shows exactly 10, all `cerrado`.
4. The metrics panel shows 3 groups (sistema / zona / estado); the "Por estado" group's two
   bars' counts add up to the number of rows currently shown in the list (60 with "Todos", 50
   with "Abiertos").
5. Browser console has no errors.

- [ ] **Step 5: Commit**

```bash
git add index.html css/styles.css js/app.js
git commit -m "feat: wire ticket list, filter and metrics panel to the page"
```

**Satisfies:** spec Feature 1 (listar 60 tickets, filtro Todos/Abiertos/Cerrados), Feature 3
(3 grupos de barras, recálculo al cambiar el filtro), Manejo de errores (fetch failure message).

---

## Task 8: `js/app.js` — navegación a la ficha de detalle

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `Components.renderFichaTicket` (Task 5), `state.tickets` (Task 7)
- Produces: `mostrarFicha(id: string)` and `volverABandeja()`, wired via delegated click
  listeners on `#lista-tickets` and `#ficha-contenido`.

No automated test (DOM wiring) — verify manually.

- [ ] **Step 1: Add ficha navigation to `js/app.js`**

Append to the file from Task 7 (before the final `iniciar();` call):

```js
function mostrarFicha(id) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return;
  state.vista = "ficha";
  state.ticketSeleccionado = id;
  el.fichaContenido.innerHTML = Components.renderFichaTicket(ticket);
  el.vistaBandeja.hidden = true;
  el.vistaFicha.hidden = false;
}

function volverABandeja() {
  state.vista = "bandeja";
  state.ticketSeleccionado = null;
  el.vistaFicha.hidden = true;
  el.vistaBandeja.hidden = false;
}

el.listaTickets.addEventListener("click", (evento) => {
  const fila = evento.target.closest(".ticket-row");
  if (fila) mostrarFicha(fila.dataset.ticketId);
});

el.fichaContenido.addEventListener("click", (evento) => {
  if (evento.target.closest(".btn-volver")) volverABandeja();
});
```

- [ ] **Step 2: Manual verification**

Open `index.html` in the browser and check, against spec Feature 1:

1. Clicking any ticket row switches to the ficha view showing all 8 base fields of that exact
   ticket (compare against `data/tickets.json`).
2. A ticket with no `prioridad`/`categoria` shows "Sin clasificar" for both.
3. Clicking "Volver a la bandeja" returns to the list view, and the previously selected filter
   (e.g. "Abiertos") is still applied — the `<select>` still shows it and the list is still
   filtered.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: wire ticket detail navigation"
```

**Satisfies:** spec Feature 1 acceptance criteria — abrir ficha muestra los 8 campos; etiqueta
"Sin clasificar" cuando falta prioridad/categoría; volver conserva el filtro.

---

## Task 9: `js/app.js` — clasificación (copiar prompt al portapapeles)

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `Utils.generarPromptClasificacion` (Task 2)
- Produces: `copiarPromptClasificacion(id: string)`, wired via delegated click on
  `#ficha-contenido` for `.btn-clasificar`.

No automated test (clipboard API is browser-only) — verify manually.

- [ ] **Step 1: Add clasificación handling to `js/app.js`**

Append (before `iniciar();`):

```js
function mostrarFallbackClasificar(texto) {
  const contenedor = document.getElementById("clasificar-fallback");
  const textarea = document.getElementById("clasificar-textarea");
  textarea.value = texto;
  contenedor.hidden = false;
  textarea.select();
}

async function copiarPromptClasificacion(id) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return;
  const prompt = Utils.generarPromptClasificacion(ticket);
  if (!navigator.clipboard) {
    mostrarFallbackClasificar(prompt);
    return;
  }
  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    mostrarFallbackClasificar(prompt);
  }
}

el.fichaContenido.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-clasificar");
  if (boton) copiarPromptClasificacion(boton.dataset.ticketId);
});
```

- [ ] **Step 2: Manual verification**

Open `index.html` in the browser, open a ticket with no `prioridad`, and check, against spec
Feature 2:

1. Clicking "Clasificar con Claude Code" copies text to the clipboard (paste it somewhere to
   confirm) that includes the ticket's exact id and the 4 priority options
   (Crítica/Alta/Media/Baja) written out.
2. To exercise the fallback path: temporarily comment out the `if (!navigator.clipboard)`
   block's early return in the browser devtools console (or test in a context where clipboard
   permission is denied) and confirm the `<textarea>` under "No se pudo copiar
   automáticamente" appears with the same prompt text, pre-selected.

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: wire classification prompt clipboard copy"
```

**Satisfies:** spec Feature 2 acceptance criterion — el portapapeles contiene el id exacto y
las 4 prioridades listadas; fallback a textarea si `navigator.clipboard` no está disponible.

---

## Task 10: `js/app.js` — actualizar datos (refetch sin F5)

**Files:**
- Modify: `js/app.js`

**Interfaces:**
- Consumes: `Utils.cargarTickets` (Task 3), `mostrarFicha` (Task 8)
- Produces: `actualizarDatos()`, wired to `#btn-actualizar` click.

No automated test (DOM + network wiring) — verify manually.

- [ ] **Step 1: Add refresh handling to `js/app.js`**

Append (before `iniciar();`):

```js
async function actualizarDatos() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    mostrarError(`No se ha podido actualizar data/tickets.json (${resultado.error}).`);
    return;
  }
  ocultarError();
  state.tickets = resultado.tickets;
  if (state.vista === "ficha" && state.ticketSeleccionado) {
    const sigueExistiendo = state.tickets.some((t) => t.id === state.ticketSeleccionado);
    if (sigueExistiendo) {
      mostrarFicha(state.ticketSeleccionado);
    } else {
      volverABandeja();
    }
  } else {
    renderBandeja();
  }
}

document.getElementById("btn-actualizar").addEventListener("click", actualizarDatos);
```

- [ ] **Step 2: Manual verification**

With the app open in the browser on a ticket's ficha (a ticket with no `prioridad` yet):

1. In a text editor, manually add `"prioridad": "Alta", "categoria": "Control de accesos"` to
   that exact ticket's object in `data/tickets.json` and save.
2. Click "Actualizar datos" in the browser (do **not** reload the page / press F5).
3. Confirm the open ficha now shows "Alta" and "Control de accesos" instead of "Sin
   clasificar", and the "Clasificar con Claude Code" button is gone.
4. Go back to the bandeja, confirm the metrics panel's counts reflect the updated dataset.
5. Revert your manual edit to `data/tickets.json` afterwards (or leave it — that's a real
   product of Feature 2 working, your call).

- [ ] **Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: wire data refresh without full page reload"
```

**Satisfies:** spec Feature 2 acceptance criterion — tras reescribir `data/tickets.json` y
clickear "Actualizar datos", la ficha muestra los valores nuevos sin recargar la página.

---

## Self-Review Notes

- **Spec coverage:** Feature 1 → Tasks 1, 4, 7, 8. Feature 2 → Tasks 2, 3, 5, 9, 10. Feature 3
  → Tasks 1, 6, 7. Fuera de alcance (edición, auth, backend, persistencia, routing, lote) →
  deliberately absent from every task above. Manejo de errores → Tasks 3, 7, 10.
- **Placeholder scan:** no TBD/TODO; every step has real, runnable code.
- **Type/name consistency checked:** `Utils.filtrarPorEstado`, `Utils.contarPorCampo`,
  `Utils.cargarTickets`, `Utils.generarPromptClasificacion`, `Components.renderListaTickets`,
  `Components.renderFichaTicket`, `Components.renderPanelMetricas` — each name is defined once
  (Tasks 1–6) and used with the same signature in every later task that consumes it.
