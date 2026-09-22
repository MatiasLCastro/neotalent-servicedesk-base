const { test } = require("node:test");
const assert = require("node:assert/strict");
const { renderPanelMetricas } = require("./panelMetricas.js");

test("renderiza una fila de barra por cada valor de cada grupo", () => {
  const html = renderPanelMetricas({
    porSistema: { "Control de accesos": 2, "SailPoint (identidades)": 1 },
    porZona: { "Torre de control": 1 },
    porEstado: { abierto: 2, cerrado: 1 },
  });
  assert.match(html, /Control de accesos \(2\)/);
  assert.match(html, /SailPoint \(identidades\) \(1\)/);
  assert.match(html, /Torre de control \(1\)/);
  assert.match(html, /abierto \(2\)/);
  assert.match(html, /cerrado \(1\)/);
});

test("la barra con más conteo llega al 100% de ancho", () => {
  const html = renderPanelMetricas({
    porSistema: { A: 4, B: 2 },
    porZona: {},
    porEstado: {},
  });
  assert.match(html, /width: 100%/);
  assert.match(html, /width: 50%/);
});
