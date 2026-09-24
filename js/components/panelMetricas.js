// Duplicada intencionalmente en cada componente (ver docs/constitution.md /
// decisión del proyecto: demasiado pequeña para justificar un módulo
// compartido). En el navegador, ambas copias son declaraciones de función de
// nivel superior en un <script> clásico, así que ambas terminan asignando
// window.escaparHtml — no confíes en ese global, usa siempre la referencia
// local de este archivo. Si editas esta función, replica el cambio en los
// otros archivos que la definen (listaTickets.js, fichaTicket.js) para que
// sigan siendo idénticas byte a byte.
function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// colorPorEtiqueta es opcional: solo el grupo "Por estado" lo usa, para que
// la barra "abierto" salga en ámbar y "cerrado" en verde — el mismo color
// que la insignia de estado en la bandeja (ver css/styles.css).
function renderGrupoBarras(titulo, conteo, colorPorEtiqueta) {
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const max = entradas.length ? Math.max(...entradas.map(([, n]) => n)) : 0;
  const barras = entradas
    .map(([etiqueta, n]) => {
      const ancho = max ? Math.round((n / max) * 100) : 0;
      const color = colorPorEtiqueta && colorPorEtiqueta[etiqueta] ? ` barra-relleno--${colorPorEtiqueta[etiqueta]}` : "";
      return `
        <div class="barra-fila">
          <span class="barra-etiqueta">${escaparHtml(etiqueta)} (${escaparHtml(n)})</span>
          <div class="barra-track"><div class="barra-relleno${color}" style="width: ${ancho}%"></div></div>
        </div>`;
    })
    .join("");
  return `<section class="grupo-barras"><h3>${titulo}</h3>${barras}</section>`;
}

function renderPanelMetricas({ porSistema, porZona, porEstado }) {
  return `
    <div class="panel-metricas">
      ${renderGrupoBarras("Por sistema afectado", porSistema)}
      ${renderGrupoBarras("Por zona", porZona)}
      ${renderGrupoBarras("Por estado", porEstado, { abierto: "abierto", cerrado: "cerrado" })}
    </div>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderPanelMetricas = renderPanelMetricas;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderPanelMetricas, renderGrupoBarras };
}
