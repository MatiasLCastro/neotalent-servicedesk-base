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
