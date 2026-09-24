# Mini Service Desk

Proyecto hilo de la formación **"IA generativa y agéntica con Claude aplicada al ciclo de vida
del software"** (Neotalent Conclusion). Lo construimos entre la Sesión 2 y la Sesión 4 — cada
fase del Bloque 2 añade una pieza.

## Qué es

Una bandeja de incidencias pequeña, para un servicio de seguridad ficticio:

- Lista de tickets + ficha de cada incidencia.
- Clasificación automática de **prioridad** y **categoría** hecha con Claude.
- Panel de métricas básico (incidencias por sistema, por zona, por estado).

Los datos son inventados de cero — cero relación con clientes reales.

## De dónde sale cada pieza

| Sesión | Qué se añade |
|---|---|
| Sesión 2 | Este repo (fork) + el Project "Mini Service Desk" en Claude, con este README en el Knowledge |
| Sesión 3 | El spec de la funcionalidad (Fase 1), el diseño de las pantallas con Artifacts (Fase 2), y el desarrollo con Claude Code (Fase 3) |
| Sesión 4 | Tests y validación del dataset (Fase 4), despliegue (Fase 5, con la herramienta que prefieras) y una automatización en n8n para el triaje (Fase 6) |

## Estructura del repositorio

```
/
├── index.html       → construido en la Fase 3 (Sesión 3)
├── css/
│   └── styles.css   → estilos de la app
├── js/
│   ├── app.js       → orquesta la carga y el pintado
│   ├── components/  → piezas de UI reutilizables, cada una con su test
│   └── utils/       → funciones auxiliares sin estado, cada una con su test
├── data/
│   └── tickets.json → dataset ya listo
├── docs/
│   ├── spec.md       → spec de funcionalidad (Fase 1)
│   └── diseno.md      → decisiones de diseño con Artifacts (Fase 2)
├── README.md
└── CLAUDE.md
```

| Carpeta / archivo | Responsabilidad | Qué contiene | Cómo interactúa |
|---|---|---|---|
| `index.html` | Punto de entrada de la app en el navegador | La estructura HTML de la bandeja de tickets | Carga `css/styles.css` y `js/app.js`; `js/app.js` lee `data/tickets.json` para pintar la lista |
| `css/` | Estilos de la interfaz | `styles.css` — reglas visuales, sin lógica | Lo referencia `index.html`; no depende de ninguna otra carpeta |
| `js/` | Lógica de la interfaz | `app.js` — cargar tickets, filtrar, mostrar ficha, disparar la clasificación con Claude Code | Lee `data/tickets.json`; escribe en el DOM que define `index.html` |
| `js/components/` | Piezas de interfaz reutilizables | Fila de ticket, ficha de detalle, filtro — cada una en su propio archivo | Las usa `app.js` para montar la pantalla; no acceden a `data/tickets.json` directamente |
| `js/utils/` | Funciones auxiliares sin estado | Filtrar, formatear fecha, agrupar por zona/sistema | Las usan `app.js` y `components/`; no tocan el DOM |
| `data/` | El dataset del proyecto | `tickets.json` — las incidencias sintéticas, sin categoría ni prioridad todavía | Lo consume `js/app.js` en el navegador, y Claude Code directamente cuando clasifica los tickets |
| `docs/` | Los entregables de las Fases 1 y 2 de la Sesión 3 | `spec.md` (requisitos) y `diseno.md` (decisiones de Artifacts) | `spec.md` es la entrada de la Fase 3 (Desarrollo, lo que construye `index.html`/`css`/`js`); `diseno.md` es la salida de la Fase 2 a partir de ese mismo spec |
| `README.md` | Qué es el proyecto y cómo empezar | Brief del proyecto, esta misma tabla | Es lo primero que lee cualquiera al abrir el repo — humano o Claude Code |
| `CLAUDE.md` | Contexto del proyecto para Claude Code | Se genera en la Sesión 2 | Se genera en la Sesión 2 a partir de lo que Claude Code entienda del resto de archivos |

No hay carpetas de dependencias ni de build — el proyecto es HTML/CSS/JS plano, sin instalar
nada. Eso sí, abrir `index.html` con doble click (URL `file://`) rompe el `fetch` de
`data/tickets.json` en todos los navegadores modernos (origen opaco, sin CORS). Sírvelo con un
servidor estático simple, por ejemplo `python3 -m http.server 8000` (viene con Python, no hay
nada que instalar) y abre `http://localhost:8000`.

## Cómo empezar (Sesión 2)

1. Haz **Fork** de este repositorio a tu cuenta.
2. Clónalo en tu portátil.
3. Ábrelo con Claude Code y pídele que revise el repo y proponga un `CLAUDE.md`.

Si tu empresa bloquea GitHub, descarga el ZIP del repo desde el botón verde **Code**.

## Stack

HTML + CSS + JS plano, sin build — para que funcione en cualquier portátil sin instalar nada.
La clasificación de tickets la hace Claude Code sobre el repo, no el navegador: no hace falta
ninguna API key propia.
