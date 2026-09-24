// Duplicada intencionalmente en cada componente (ver docs/constitution.md /
// decisión del proyecto: demasiado pequeña para justificar un módulo
// compartido). En el navegador, ambas copias son declaraciones de función de
// nivel superior en un <script> clásico, así que ambas terminan asignando
// window.escaparHtml — no confíes en ese global, usa siempre la referencia
// local de este archivo. Si editas esta función, replica el cambio en el
// otro archivo que la define (listaTickets.js) para que sigan siendo
// idénticas byte a byte.
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Mapea el valor exacto de prioridad (Crítica/Alta/Media/Baja, ver
// docs/spec.md Feature 2) a la clase que la colorea — ver css/styles.css.
const PRIORIDAD_SLUG = { Crítica: "critica", Alta: "alta", Media: "media", Baja: "baja" };

function renderFichaTicket(ticket) {
  const prioridad = ticket.prioridad
    ? `<span class="ficha-prioridad ficha-prioridad--${PRIORIDAD_SLUG[ticket.prioridad] || ""}">${escaparHtml(ticket.prioridad)}</span>`
    : '<span class="ficha-sin-clasificar">Sin clasificar</span>';
  const categoria = ticket.categoria
    ? `<span class="ficha-categoria">${escaparHtml(ticket.categoria)}</span>`
    : '<span class="ficha-sin-clasificar">Sin clasificar</span>';
  const estado = `<span class="ticket-estado ticket-estado--${escaparHtml(ticket.estado)}">${ticket.estado === "cerrado" ? "DONE" : escaparHtml(ticket.estado)}</span>`;
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
        <dt>Estado</dt><dd>${estado}</dd>
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
