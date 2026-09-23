const state = {
  tickets: [],
  filtro: "todos",
};

const el = {
  listaTickets: document.getElementById("lista-tickets"),
  filtroEstado: document.getElementById("filtro-estado"),
  errorMensaje: document.getElementById("error-mensaje"),
};

function renderBandeja() {
  const filtrados = Utils.filtrarPorEstado(state.tickets, state.filtro);
  el.listaTickets.innerHTML = Components.renderListaTickets(filtrados);
}

el.filtroEstado.addEventListener("change", (evento) => {
  state.filtro = evento.target.value;
  renderBandeja();
});

async function iniciar() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    el.errorMensaje.textContent = `No se ha podido cargar data/tickets.json (${resultado.error}).`;
    el.errorMensaje.hidden = false;
    el.listaTickets.innerHTML = "";
    return;
  }
  state.tickets = resultado.tickets;
  renderBandeja();
}

iniciar();
