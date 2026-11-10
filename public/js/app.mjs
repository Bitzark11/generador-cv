// ====================================================================
// APP.MJS — el "director de orquesta" del frontend.
// No hace el trabajo pesado: le dice a cada módulo cuándo actuar.
//
//   formulario.mjs     → eventos del formulario (delegación) y estado
//   plantillas.mjs     → construye el CV en el DOM de forma segura
//   api.mjs            → fetch al servidor Express
//   almacenamiento.mjs → localStorage y sessionStorage
//   interfaz.mjs       → mensajes, spinner y tema claro/oscuro
//
// import = "traer" lo que otro archivo compartió con "export" (módulos ES).
// ====================================================================
import { iniciarFormulario, estadoVacio } from "./formulario.mjs";
import { construirCV } from "./plantillas.mjs";
import { obtenerPlantillas, guardarCVEnServidor, obtenerCVPorId } from "./api.mjs";
import {
  guardarBorrador, cargarBorrador, olvidarTodo,
  guardarUltimoId, cargarUltimoId, contarRecarga,
} from "./almacenamiento.mjs";
import { mostrarMensaje, iniciarCarga, iniciarTema } from "./interfaz.mjs";

// Lista de respaldo: si el servidor no responde, la app sigue mostrando
// las 2 plantillas (la página nunca queda "rota").
const PLANTILLAS_POR_DEFECTO = [
  { id: "clasica", nombre: "Clásica" },
  { id: "moderna", nombre: "Moderna" },
];

/**
 * Dibuja los radios de plantilla con la lista recibida del servidor.
 * Usa clases de Bootstrap (form-check) y createElement (nada de innerHTML).
 *
 * @param {HTMLElement} contenedor - #selector-plantilla
 * @param {Array} plantillas       - [{ id, nombre }]
 * @param {string} actual          - id de la plantilla marcada
 */
function dibujarSelectorPlantilla(contenedor, plantillas, actual) {
  contenedor.replaceChildren(); // quita el "Cargando plantillas..."
  plantillas.forEach(function (plantilla) {
    const envoltorio = document.createElement("div");
    envoltorio.className = "form-check form-check-inline";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "plantilla"; // mismo name = solo se elige una
    input.id = "plantilla-" + plantilla.id;
    input.value = plantilla.id;
    input.className = "form-check-input";
    input.checked = plantilla.id === actual;

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.className = "form-check-label";
    label.textContent = plantilla.nombre; // dato que vino del servidor → textContent

    envoltorio.append(input, label);
    contenedor.appendChild(envoltorio);
  });
}

/**
 * Función principal: arranca toda la aplicación (se llama al final del archivo).
 * Es async porque adentro usa "await" para esperar al servidor.
 */
async function iniciar() {
  // PASO 0: referencias a los elementos del HTML que se usan en varios lugares.
  const elementos = {
    form: document.getElementById("formulario-cv"),
    listaExperiencia: document.getElementById("lista-experiencia"),
    listaEducacion: document.getElementById("lista-educacion"),
    listaHabilidades: document.getElementById("lista-habilidades"),
    entradaHabilidad: document.getElementById("entrada-habilidad"),
    selectorPlantilla: document.getElementById("selector-plantilla"),
  };
  const mensaje = document.getElementById("mensaje-estado");
  const infoSesion = document.getElementById("info-sesion");
  const entradaCodigo = document.getElementById("codigo");
  let vistaPrevia = document.getElementById("vista-previa"); // let: apunta al <article> actual

  // PASO 1: tema claro/oscuro guardado en localStorage.
  iniciarTema(document.getElementById("btn-tema"));

  // PASO 2: datos de ESTA visita (sessionStorage).
  const recargas = contarRecarga();
  function mostrarInfoSesion() {
    const ultimo = cargarUltimoId(); // null si todavía no guardó nada en esta visita
    infoSesion.textContent = "Cargas de la página en esta visita: " + recargas +
      (ultimo !== null ? " · Último código guardado: " + ultimo : "");
  }
  mostrarInfoSesion();

  // PASO 3: borrador anterior (localStorage). Es null en la primera visita.
  const borrador = cargarBorrador();
  const estado = estadoVacio();
  if (borrador !== null && typeof borrador.plantilla === "string") {
    estado.plantilla = borrador.plantilla;
  }

  // PASO 4: fetch GET /api/plantillas con manejo de error.
  let plantillas;
  try {
    plantillas = await obtenerPlantillas(); // espera la respuesta del servidor
  } catch (error) {
    plantillas = PLANTILLAS_POR_DEFECTO;
    mostrarMensaje(mensaje, error.message + " Se usan las plantillas locales.", "warning");
  }
  dibujarSelectorPlantilla(elementos.selectorPlantilla, plantillas, estado.plantilla);

  /** Reconstruye el CV con el estado actual y lo reemplaza en pantalla. */
  function dibujarVistaPrevia(estadoActual) {
    const nueva = construirCV(estadoActual);
    vistaPrevia.replaceWith(nueva);
    vistaPrevia = nueva; // ahora apunta al <article> nuevo
  }

  /**
   * Puente entre formulario.mjs y el resto: se llama CADA VEZ que el
   * usuario cambia algo.  1) redibuja el CV   2) guarda el borrador.
   */
  function alCambiar(estadoActual) {
    dibujarVistaPrevia(estadoActual);
    guardarBorrador(estadoActual); // localStorage
  }

  // PASO 5: conectar eventos del formulario y restaurar el borrador.
  const controlador = iniciarFormulario(elementos, estado, alCambiar);
  if (borrador !== null) {
    controlador.rellenarFormulario(borrador);
    if (borrador.nombre) {
      mostrarMensaje(mensaje, "Bienvenido de nuevo, " + borrador.nombre + ". Recuperamos tu borrador.", "info");
    }
  } else {
    // Primera visita: dibujamos el CV vacío, pero NO guardamos nada
    // todavía (solo se guarda cuando el usuario realmente escribe algo).
    dibujarVistaPrevia(estado);
  }

  // PASO 6: botón "Guardar CV en el servidor" → fetch POST /api/cv
  const btnGuardar = document.getElementById("btn-guardar");
  btnGuardar.addEventListener("click", async function () {
    const terminarCarga = iniciarCarga(btnGuardar, "Guardando..."); // spinner + botón desactivado
    try {
      const respuesta = await guardarCVEnServidor(estado);
      guardarUltimoId(respuesta.id);   // sessionStorage: dato de esta visita
      mostrarInfoSesion();
      mostrarMensaje(mensaje, "CV guardado en el servidor. Tu código es: " + respuesta.id, "success");
    } catch (error) {
      // Aquí llegan tanto errores de red como los 400 del servidor (validación).
      mostrarMensaje(mensaje, error.message, "danger");
    } finally {
      terminarCarga(); // pase lo que pase, el botón vuelve a la normalidad
    }
  });

  // PASO 7: botón "Cargar" → fetch GET /api/cv/:id
  const btnCargar = document.getElementById("btn-cargar");
  async function cargarPorCodigo() {
    const id = entradaCodigo.value.trim();
    if (id === "") {
      mostrarMensaje(mensaje, "Escribe el código del CV que quieres cargar.", "warning");
      entradaCodigo.focus(); // lleva el teclado al campo que falta
      return;
    }
    const terminarCarga = iniciarCarga(btnCargar, "Buscando...");
    try {
      const respuesta = await obtenerCVPorId(id);
      controlador.rellenarFormulario(respuesta.cv); // el CV del servidor pasa al formulario
      mostrarMensaje(mensaje, "CV cargado correctamente.", "success");
    } catch (error) {
      mostrarMensaje(mensaje, error.message, "danger"); // ej: 404 "No existe un CV con ese código."
    } finally {
      terminarCarga();
    }
  }
  btnCargar.addEventListener("click", cargarPorCodigo);
  entradaCodigo.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") cargarPorCodigo();
  });

  // PASO 8: imprimir.
  document.getElementById("btn-imprimir").addEventListener("click", function () {
    window.print();
  });

  // PASO 9: "Olvidar mis datos" con confirmación en DOS clics (en vez de confirm()).
  const btnOlvidar = document.getElementById("btn-olvidar");
  let esperandoConfirmacion = false; // let: cambia entre true y false
  btnOlvidar.addEventListener("click", function () {
    if (!esperandoConfirmacion) {
      esperandoConfirmacion = true;
      btnOlvidar.textContent = "¿Seguro? Pulsa otra vez";
      mostrarMensaje(mensaje, "Se borrarán tu borrador, tu tema y los datos de esta visita.", "warning");
      // Si no confirma en 4 segundos, el botón vuelve a su texto normal.
      setTimeout(function () {
        esperandoConfirmacion = false;
        btnOlvidar.textContent = "Olvidar mis datos";
      }, 4000);
      return;
    }
    olvidarTodo();            // borra localStorage y sessionStorage
    window.location.reload(); // recarga: la app vuelve a su estado inicial
  });
}

// Única línea que se ejecuta "sola" al cargar el archivo: pone todo en marcha.
iniciar();
