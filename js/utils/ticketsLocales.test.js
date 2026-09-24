const { test } = require("node:test");
const assert = require("node:assert/strict");
const { crearTicketLocal, leerTicketsLocales } = require("./ticketsLocales.js");

const datosValidos = {
  titulo: "El lector de tarjetas de la puerta 3 no responde",
  descripcion: "Los guardias no pueden fichar en la puerta 3 desde esta mañana.",
  sistema_afectado: "Control de accesos",
  zona: "Puerta 3",
  reportado_por: "Guardia de seguridad",
};

// Storage falso en memoria, misma forma que window.localStorage
// (getItem/setItem), para no depender de un navegador real en los tests.
function crearStorageFalso() {
  let valor = null;
  return {
    getItem: () => valor,
    setItem: (_clave, v) => {
      valor = v;
    },
  };
}

test("crearTicketLocal con datos válidos devuelve ok:true y arma el resto del ticket", () => {
  const resultado = crearTicketLocal(datosValidos, crearStorageFalso(), "2026-09-24");
  assert.equal(resultado.ok, true);
  assert.match(resultado.ticket.id, /^LOCAL-/);
  assert.equal(resultado.ticket.estado, "abierto");
  assert.equal(resultado.ticket.fecha, "2026-09-24");
  assert.equal(resultado.ticket.titulo, datosValidos.titulo);
});

test("crearTicketLocal guarda el ticket en el storage", () => {
  const storage = crearStorageFalso();
  crearTicketLocal(datosValidos, storage, "2026-09-24");
  const guardados = JSON.parse(storage.getItem());
  assert.equal(guardados.length, 1);
  assert.equal(guardados[0].titulo, datosValidos.titulo);
});

test("crearTicketLocal asigna ids incrementales sin repetir", () => {
  const storage = crearStorageFalso();
  const primero = crearTicketLocal(datosValidos, storage, "2026-09-24");
  const segundo = crearTicketLocal(datosValidos, storage, "2026-09-24");
  assert.notEqual(primero.ticket.id, segundo.ticket.id);
});

test("crearTicketLocal rechaza el alta si falta un campo obligatorio", () => {
  const storage = crearStorageFalso();
  const resultado = crearTicketLocal({ ...datosValidos, zona: "" }, storage, "2026-09-24");
  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /zona/);
  assert.equal(storage.getItem(), null);
});

test("leerTicketsLocales devuelve [] cuando no hay nada guardado", () => {
  assert.deepEqual(leerTicketsLocales(crearStorageFalso()), []);
});

test("leerTicketsLocales devuelve los tickets guardados previamente", () => {
  const storage = crearStorageFalso();
  crearTicketLocal(datosValidos, storage, "2026-09-24");
  assert.equal(leerTicketsLocales(storage).length, 1);
});
