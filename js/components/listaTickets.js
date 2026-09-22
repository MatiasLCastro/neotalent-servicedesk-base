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
