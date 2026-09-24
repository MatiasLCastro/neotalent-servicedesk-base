// js/utils/tickets.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { filtrarPorEstado, contarPorCampo } = require("./tickets.js");

const tickets = [
  { id: "A", estado: "abierto", sistema_afectado: "Control de accesos" },
  { id: "B", estado: "cerrado", sistema_afectado: "Control de accesos" },
  { id: "C", estado: "abierto", sistema_afectado: "SailPoint (identidades)" },
];

test("filtrarPorEstado('todos') devuelve todos los tickets", () => {
  assert.equal(filtrarPorEstado(tickets, "todos").length, 3);
});

test("filtrarPorEstado('abierto') devuelve solo los abiertos", () => {
  const resultado = filtrarPorEstado(tickets, "abierto");
  assert.equal(resultado.length, 2);
  assert.ok(resultado.every((t) => t.estado === "abierto"));
});

test("filtrarPorEstado('cerrado') devuelve solo los cerrados", () => {
  const resultado = filtrarPorEstado(tickets, "cerrado");
  assert.deepEqual(resultado.map((t) => t.id), ["B"]);
});

test("contarPorCampo agrupa y cuenta por el campo indicado", () => {
  const conteo = contarPorCampo(tickets, "sistema_afectado");
  assert.deepEqual(conteo, {
    "Control de accesos": 2,
    "SailPoint (identidades)": 1,
  });
});

test("contarPorCampo por estado suma el total de tickets", () => {
  const conteo = contarPorCampo(tickets, "estado");
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  assert.equal(total, tickets.length);
});
