const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderFormularioTicket } = require("./formularioTicket.js");

const categorias = ["Control de accesos", "SailPoint (identidades)"];

test("incluye los 5 campos obligatorios del formulario", () => {
  const html = renderFormularioTicket(categorias);
  for (const campo of ["titulo", "descripcion", "sistema_afectado", "zona", "reportado_por"]) {
    assert.match(html, new RegExp(`name="${campo}"`));
  }
});

test("arma una opción de <select> por cada categoría recibida", () => {
  const html = renderFormularioTicket(categorias);
  assert.match(html, /<option value="Control de accesos">/);
  assert.match(html, /<option value="SailPoint \(identidades\)">/);
});

test("escapa HTML en las categorías", () => {
  const html = renderFormularioTicket(["<script>alert(1)</script>"]);
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /&lt;script&gt;/);
});
