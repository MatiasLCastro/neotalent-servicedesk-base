function filtrarPorEstado(tickets, estado) {
  if (estado === "todos") return tickets.slice();
  return tickets.filter((t) => t.estado === estado);
}

if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.filtrarPorEstado = filtrarPorEstado;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { filtrarPorEstado };
}
