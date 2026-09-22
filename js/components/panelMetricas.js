function renderGrupoBarras(titulo, conteo) {
  const entradas = Object.entries(conteo).sort((a, b) => b[1] - a[1]);
  const max = entradas.length ? Math.max(...entradas.map(([, n]) => n)) : 0;
  const barras = entradas
    .map(([etiqueta, n]) => {
      const ancho = max ? Math.round((n / max) * 100) : 0;
      return `
        <div class="barra-fila">
          <span class="barra-etiqueta">${etiqueta} (${n})</span>
          <div class="barra-track"><div class="barra-relleno" style="width: ${ancho}%"></div></div>
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
      ${renderGrupoBarras("Por estado", porEstado)}
    </div>`;
}

if (typeof window !== "undefined") {
  window.Components = window.Components || {};
  window.Components.renderPanelMetricas = renderPanelMetricas;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { renderPanelMetricas, renderGrupoBarras };
}
