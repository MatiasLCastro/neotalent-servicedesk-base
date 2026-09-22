// js/app.js
const state = {
  tickets: [],
  filtro: "todos",
  vista: "bandeja",
  ticketSeleccionado: null,
};

const el = {
  listaTickets: document.getElementById("lista-tickets"),
  panelMetricas: document.getElementById("panel-metricas"),
  filtroEstado: document.getElementById("filtro-estado"),
  errorMensaje: document.getElementById("error-mensaje"),
  vistaBandeja: document.getElementById("vista-bandeja"),
  vistaFicha: document.getElementById("vista-ficha"),
  fichaContenido: document.getElementById("ficha-contenido"),
};

function mostrarError(mensaje) {
  el.errorMensaje.textContent = mensaje;
  el.errorMensaje.hidden = false;
}

function ocultarError() {
  el.errorMensaje.hidden = true;
}

function renderBandeja() {
  const filtrados = Utils.filtrarPorEstado(state.tickets, state.filtro);
  el.listaTickets.innerHTML = Components.renderListaTickets(filtrados);
  el.panelMetricas.innerHTML = Components.renderPanelMetricas({
    porSistema: Utils.contarPorCampo(filtrados, "sistema_afectado"),
    porZona: Utils.contarPorCampo(filtrados, "zona"),
    porEstado: Utils.contarPorCampo(filtrados, "estado"),
  });
}

el.filtroEstado.addEventListener("change", (evento) => {
  state.filtro = evento.target.value;
  renderBandeja();
});

function mostrarFicha(id) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return;
  state.vista = "ficha";
  state.ticketSeleccionado = id;
  el.fichaContenido.innerHTML = Components.renderFichaTicket(ticket);
  el.vistaBandeja.hidden = true;
  el.vistaFicha.hidden = false;
}

function volverABandeja() {
  state.vista = "bandeja";
  state.ticketSeleccionado = null;
  el.vistaFicha.hidden = true;
  el.vistaBandeja.hidden = false;
}

el.listaTickets.addEventListener("click", (evento) => {
  const fila = evento.target.closest(".ticket-row");
  if (fila) mostrarFicha(fila.dataset.ticketId);
});

el.fichaContenido.addEventListener("click", (evento) => {
  if (evento.target.closest(".btn-volver")) volverABandeja();
});

async function iniciar() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    mostrarError(`No se ha podido cargar data/tickets.json (${resultado.error}).`);
    el.listaTickets.innerHTML = "";
    return;
  }
  ocultarError();
  state.tickets = resultado.tickets;
  renderBandeja();
}

iniciar();
