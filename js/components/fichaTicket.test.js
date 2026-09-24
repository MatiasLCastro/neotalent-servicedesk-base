// js/components/fichaTicket.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderFichaTicket } = require("./fichaTicket.js");

const ticketSinClasificar = {
  id: "SVD-4108",
  titulo: "Puerta de emergencia abierta",
  descripcion: "Detalle.",
  sistema_afectado: "Control de accesos",
  zona: "Edificio B, planta 3",
  reportado_por: "Guardia de seguridad",
  fecha: "2026-09-10",
  estado: "abierto",
};

const ticketClasificado = { ...ticketSinClasificar, prioridad: "Alta", categoria: "Control de accesos" };

test("muestra 'Sin clasificar' cuando el ticket no tiene prioridad", () => {
  assert.match(renderFichaTicket(ticketSinClasificar), /Sin clasificar/);
});

test("muestra el botón Clasificar cuando el ticket no tiene prioridad", () => {
  const html = renderFichaTicket(ticketSinClasificar);
  assert.match(html, /btn-clasificar/);
  assert.match(html, /data-ticket-id="SVD-4108"/);
});

test("oculta el botón Clasificar cuando el ticket ya tiene prioridad", () => {
  assert.ok(!renderFichaTicket(ticketClasificado).includes("btn-clasificar"));
});

test("oculta el botón Clasificar para un ticket creado en el navegador (id LOCAL-)", () => {
  const ticketLocal = { ...ticketSinClasificar, id: "LOCAL-1" };
  assert.ok(!renderFichaTicket(ticketLocal).includes("btn-clasificar"));
});

test("muestra los 8 campos base del ticket", () => {
  const html = renderFichaTicket(ticketClasificado);
  for (const valor of [
    ticketClasificado.id,
    ticketClasificado.titulo,
    ticketClasificado.descripcion,
    ticketClasificado.sistema_afectado,
    ticketClasificado.zona,
    ticketClasificado.reportado_por,
    ticketClasificado.fecha,
    ticketClasificado.estado,
  ]) {
    assert.ok(html.includes(valor), `falta el campo con valor ${valor}`);
  }
});
