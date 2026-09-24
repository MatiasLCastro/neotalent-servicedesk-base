# Constitution — Mini Service Desk

Reglas no negociables para las Fases 1 (spec) y 2 (diseño). Un spec o un diseño que
choque con un artículo se reescribe antes de pasar a Fase 3 (Desarrollo).

Cada artículo trae su propio criterio de verificación — algo que se puede comprobar
con una lectura del repo o un `grep`, no una opinión.

## Artículos

### 1. Sin build, sin dependencias
La app es HTML + CSS + JS plano. Se abre `index.html` directamente en el navegador.
**Verificable:** no existe `package.json`, `node_modules/` ni ningún paso de build en el repo.

### 2. Datos sintéticos, cero PII real
`data/tickets.json` es inventado. Ningún ticket, zona o persona referencia algo real.
**Verificable:** ningún registro del dataset es buscable como empresa, dirección o persona real.

### 3. La clasificación la hace Claude Code sobre el repo, no el navegador
Prioridad y categoría se calculan fuera del cliente — no hay llamada a un LLM desde JS de navegador.
**Verificable:** `grep -r "fetch\|XMLHttpRequest" js/` no encuentra ninguna llamada a un endpoint de IA;
ningún archivo contiene una API key.

### 4. Separación de responsabilidades fija
- `js/components/` no lee `data/tickets.json` directamente — solo recibe datos ya cargados.
- `js/utils/` es sin estado y no toca el DOM.
**Verificable:** `grep -r "tickets.json" js/components/` no da resultados;
`grep -r "document\." js/utils/` no da resultados.

### 5. Alcance cerrado a 4 features
Lista de tickets + ficha, clasificación de prioridad/categoría, panel de métricas, alta de
tickets nuevos guardados en `localStorage` (sin edición ni borrado de tickets existentes, y
sin escribir nunca en `data/tickets.json`). Nada más entra en `spec.md` sin pasar antes por
este documento.
**Verificable:** cada requisito de `spec.md` se puede etiquetar con una de las 4 features,
o está marcado explícitamente "fuera de alcance".

### 6. Todo requisito tiene criterio de aceptación comprobable
Nada de "debe ser rápido" o "debe ser claro" sin una condición verificable.
**Verificable:** cada requisito de `spec.md` trae al menos un criterio dado/cuando/entonces
o una condición booleana (verdadero o falso, sin ambigüedad).

### 7. El diseño no inventa datos ni features nuevas
`diseno.md` y los Artifacts de la Fase 2 usan tickets reales de `data/tickets.json` como
contenido de ejemplo — nunca cifras o textos inventados que no salgan del dataset o del spec.
**Verificable:** todo dato mostrado en una pantalla de diseño existe literalmente en
`data/tickets.json` o en un requisito de `spec.md`.

## Gobernanza

- Cambios a este documento requieren decisión explícita del autor del proyecto, no de Claude
  actuando solo.
- Ante conflicto entre `spec.md`/`diseno.md` y este documento, gana este documento.
- Versión: 1.1.0 · Fecha: 2026-09-24 — artículo 5 amplía el alcance a alta de tickets
  nuevos por localStorage, decisión explícita del autor del proyecto (ver spec.md Feature 4).
- Versión: 1.0.0 · Fecha: 2026-09-22
