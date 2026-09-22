// js/utils/prompt.test.js
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generarPromptClasificacion, PRIORIDADES, CATEGORIAS } = require("./prompt.js");

const ticket = {
  id: "SVD-4108",
  titulo: "Puerta de emergencia abierta sin alarma en Edificio B, planta 3",
  descripcion: "La puerta de emergencia se ha quedado abierta y el sensor no ha lanzado alarma.",
  sistema_afectado: "Control de accesos",
  zona: "Edificio B, planta 3",
};

test("PRIORIDADES tiene las 4 opciones del spec", () => {
  assert.deepEqual(PRIORIDADES, ["Crítica", "Alta", "Media", "Baja"]);
});

test("CATEGORIAS tiene las 6 opciones del spec", () => {
  assert.deepEqual(CATEGORIAS, [
    "Control de accesos",
    "SailPoint (identidades)",
    "Centralita de guardia",
    "Central de alarmas",
    "App de rondas",
    "CCTV / videovigilancia",
  ]);
});

test("el prompt incluye el id exacto del ticket", () => {
  assert.ok(generarPromptClasificacion(ticket).includes("SVD-4108"));
});

test("el prompt lista las 4 prioridades textualmente", () => {
  const prompt = generarPromptClasificacion(ticket);
  for (const prioridad of PRIORIDADES) {
    assert.ok(prompt.includes(prioridad), `falta la prioridad ${prioridad}`);
  }
});

test("el prompt lista las 6 categorías textualmente", () => {
  const prompt = generarPromptClasificacion(ticket);
  for (const categoria of CATEGORIAS) {
    assert.ok(prompt.includes(categoria), `falta la categoría ${categoria}`);
  }
});
