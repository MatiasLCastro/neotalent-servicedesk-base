// Alta de tickets nuevos (spec Feature 4): se guardan en localStorage, nunca
// en data/tickets.json. El storage se recibe por parámetro (misma idea que
// cargarTickets(fetchImpl) en datos.js) para poder testear sin navegador.
const CLAVE_STORAGE = "ticketsLocales";
const CAMPOS_OBLIGATORIOS = ["titulo", "descripcion", "sistema_afectado", "zona", "reportado_por"];

function leerTicketsLocales(storage) {
  try {
    const crudo = storage.getItem(CLAVE_STORAGE);
    return crudo ? JSON.parse(crudo) : [];
  } catch {
    return [];
  }
}

function crearTicketLocal(datos, storage, hoy) {
  const faltante = CAMPOS_OBLIGATORIOS.find((campo) => !String(datos[campo] || "").trim());
  if (faltante) {
    return { ok: false, error: `Falta completar: ${faltante}` };
  }

  const existentes = leerTicketsLocales(storage);
  const ticket = {
    id: `LOCAL-${existentes.length + 1}`,
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    sistema_afectado: datos.sistema_afectado,
    zona: datos.zona,
    reportado_por: datos.reportado_por,
    fecha: hoy,
    estado: "abierto",
  };
  storage.setItem(CLAVE_STORAGE, JSON.stringify([...existentes, ticket]));
  return { ok: true, ticket };
}

if (typeof window !== "undefined") {
  window.Utils = window.Utils || {};
  window.Utils.crearTicketLocal = crearTicketLocal;
  window.Utils.leerTicketsLocales = leerTicketsLocales;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { crearTicketLocal, leerTicketsLocales };
}
