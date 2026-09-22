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
