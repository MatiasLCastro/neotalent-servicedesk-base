// js/utils/datos.js
async function cargarTickets(fetchImpl) {
  try {
    const respuesta = await fetchImpl("data/tickets.json");
    if (!respuesta.ok) {
      return { ok: false, error: `HTTP ${respuesta.status}` };
    }
    const tickets = await respuesta.json();
    if (!Array.isArray(tickets)) {
      return { ok: false, error: "formato inesperado" };
    }
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
