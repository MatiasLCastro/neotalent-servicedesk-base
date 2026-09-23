const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderListaTickets } = require("./listaTickets.js");

const tickets = [
  { id: "A", estado: "abierto", titulo: "Uno", sistema_afectado: "X", zona: "Y", fecha: "2026-09-01" },
  { id: "B", estado: "cerrado", titulo: "Dos", sistema_afectado: "X", zona: "Y", fecha: "2026-09-02" },
];

test("renderiza una fila por ticket con su data-ticket-id", () => {
  const html = renderListaTickets(tickets);
  assert.match(html, /data-ticket-id="A"/);
  assert.match(html, /data-ticket-id="B"/);
});

test("muestra un mensaje cuando la lista está vacía", () => {
  assert.match(renderListaTickets([]), /No hay tickets/);
});

test("escapa HTML en los campos de texto", () => {
  const html = renderListaTickets([{ ...tickets[0], titulo: "<script>alert(1)</script>" }]);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
});
