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
  vistaFormulario: document.getElementById("vista-formulario"),
  formularioContenido: document.getElementById("formulario-contenido"),
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
  el.vistaFormulario.hidden = true;
  el.vistaBandeja.hidden = false;
}

function mostrarFormulario() {
  state.vista = "formulario";
  el.formularioContenido.innerHTML = Components.renderFormularioTicket(Utils.CATEGORIAS);
  el.vistaBandeja.hidden = true;
  el.vistaFormulario.hidden = false;
}

document.getElementById("btn-nuevo-ticket").addEventListener("click", mostrarFormulario);

el.formularioContenido.addEventListener("click", (evento) => {
  if (evento.target.closest(".btn-volver")) volverABandeja();
});

el.formularioContenido.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const datos = Object.fromEntries(new FormData(evento.target).entries());
  const hoy = new Date().toISOString().slice(0, 10);
  const resultado = Utils.crearTicketLocal(datos, localStorage, hoy);
  if (!resultado.ok) {
    const errorForm = document.getElementById("form-error");
    errorForm.textContent = resultado.error;
    errorForm.hidden = false;
    return;
  }
  state.tickets = [...state.tickets, resultado.ticket];
  volverABandeja();
  renderBandeja();
});

el.listaTickets.addEventListener("click", (evento) => {
  const fila = evento.target.closest(".ticket-row");
  if (fila) mostrarFicha(fila.dataset.ticketId);
});

el.fichaContenido.addEventListener("click", (evento) => {
  if (evento.target.closest(".btn-volver")) volverABandeja();
});

function mostrarFallbackClasificar(texto) {
  const contenedor = document.getElementById("clasificar-fallback");
  const textarea = document.getElementById("clasificar-textarea");
  textarea.value = texto;
  contenedor.hidden = false;
  textarea.select();
}

async function copiarPromptClasificacion(id) {
  const ticket = state.tickets.find((t) => t.id === id);
  if (!ticket) return;
  const prompt = Utils.generarPromptClasificacion(ticket);
  if (!navigator.clipboard) {
    mostrarFallbackClasificar(prompt);
    return;
  }
  try {
    await navigator.clipboard.writeText(prompt);
  } catch {
    mostrarFallbackClasificar(prompt);
  }
}

el.fichaContenido.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-clasificar");
  if (boton) copiarPromptClasificacion(boton.dataset.ticketId);
});

async function actualizarDatos() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    mostrarError(`No se ha podido actualizar data/tickets.json (${resultado.error}).`);
    return;
  }
  ocultarError();
  state.tickets = resultado.tickets.concat(Utils.leerTicketsLocales(localStorage));
  renderBandeja();
  if (state.vista === "ficha" && state.ticketSeleccionado) {
    const sigueExistiendo = state.tickets.some((t) => t.id === state.ticketSeleccionado);
    if (sigueExistiendo) {
      mostrarFicha(state.ticketSeleccionado);
    } else {
      volverABandeja();
    }
  }
}

document.getElementById("btn-actualizar").addEventListener("click", actualizarDatos);

async function iniciar() {
  const resultado = await Utils.cargarTickets(fetch);
  if (!resultado.ok) {
    mostrarError(`No se ha podido cargar data/tickets.json (${resultado.error}).`);
    el.listaTickets.innerHTML = "";
    return;
  }
  ocultarError();
  state.tickets = resultado.tickets.concat(Utils.leerTicketsLocales(localStorage));
  renderBandeja();
}

iniciar();
