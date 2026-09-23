const { test } = require("node:test");
const assert = require("node:assert/strict");
const { filtrarPorEstado } = require("./tickets.js");

const tickets = [
  { id: "A", estado: "abierto" },
  { id: "B", estado: "cerrado" },
  { id: "C", estado: "abierto" },
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
  assert.deepEqual(filtrarPorEstado(tickets, "cerrado").map((t) => t.id), ["B"]);
});
