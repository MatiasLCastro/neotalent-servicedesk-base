// Duplicada intencionalmente en cada componente (ver docs/constitution.md /
// decisión del proyecto: demasiado pequeña para justificar un módulo
// compartido). En el navegador, ambas copias son declaraciones de función de
// nivel superior en un <script> clásico, así que ambas terminan asignando
// window.escaparHtml — no confíes en ese global, usa siempre la referencia
// local de este archivo. Si editas esta función, replica el cambio en los
// otros archivos que la definen (listaTickets.js, fichaTicket.js,
// panelMetricas.js) para que sigan siendo idénticas byte a byte.
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// categorias: los 6 valores de sistema_afectado (Utils.CATEGORIAS) — se
// reciben por parámetro, el componente no depende de Utils directamente
// (spec.md Arquitectura: los componentes solo pintan datos ya calculados).
function renderFormularioTicket(categorias) {
  const opciones = categorias.map((c) => `<option value="${escaparHtml(c)}">${escaparHtml(c)}</option>`).join("");
  return `
    <form id="form-nuevo-ticket" class="ficha-ticket" novalidate>
      <button type="button" class="btn-volver">&larr; Volver a la bandeja</button>
      <h2>Nuevo ticket</h2>
      <p id="form-error" class="error-mensaje" hidden></p>
      <div class="campo-formulario">
        <label for="campo-titulo">Título</label>
        <input id="campo-titulo" name="titulo" type="text" required>
      </div>
      <div class="campo-formulario">
        <label for="campo-descripcion">Descripción</label>
        <textarea id="campo-descripcion" name="descripcion" required></textarea>
      </div>
      <div class="campo-formulario">
        <label for="campo-sistema">Sistema afectado</label>
        <select id="campo-sistema" name="sistema_afectado" required>
          <option value="">Elegí un sistema…</option>
          ${opciones}
        </select>
      </div>
      <div class="campo-formulario">
        <label for="campo-zona">Zona</label>
        <input id="campo-zona" name="zona" type="text" required>
      </div>
      <div class="campo-formulario">
        <label for="campo-reportado-por">Reportado por</label>
        <input id="campo-reportado-por" name="reportado_por" type="text" required>
      </div>
      <div class="acciones-formulario">
        <button type="button" class="btn-volver">Cancelar</button>
        <button type="submit" class="btn-clasificar">Crear ticket</button>
      </div>
    </form>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderFormularioTicket = renderFormularioTicket;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderFormularioTicket };
}
