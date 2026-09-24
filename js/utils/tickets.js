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
