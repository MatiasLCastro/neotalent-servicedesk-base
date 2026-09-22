// js/utils/datos.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { cargarTickets } = require("./datos.js");

test("cargarTickets devuelve ok:true con los tickets cuando el fetch funciona", async () => {
  const fetchFalso = async () => ({
    ok: true,
    json: async () => [{ id: "A" }, { id: "B" }],
  });
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, true);
  assert.equal(resultado.tickets.length, 2);
});

test("cargarTickets devuelve ok:false cuando el HTTP falla", async () => {
  const fetchFalso = async () => ({ ok: false, status: 404 });
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /404/);
});

test("cargarTickets devuelve ok:false cuando el JSON no es un array", async () => {
  const fetchFalso = async () => ({
    ok: true,
    json: async () => ({}),
  });
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.error, "formato inesperado");
});

test("cargarTickets devuelve ok:false cuando el fetch rechaza (red caída)", async () => {
  const fetchFalso = async () => {
    throw new Error("network down");
  };
  const resultado = await cargarTickets(fetchFalso);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.error, "network down");
});
