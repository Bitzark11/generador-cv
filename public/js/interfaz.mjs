// ====================================================================
// INTERFAZ.MJS — Retroalimentación al usuario (UX) y tema claro/oscuro
// --------------------------------------------------------------------
// Aquí van las piezas que "le hablan" al usuario: mensajes de éxito
// o error, el estado de carga de un botón y el cambio de tema.
// ====================================================================
import { guardarTema, cargarTema } from "./almacenamiento.mjs";

/**
 * Muestra un mensaje dentro de la página (en vez de alert()).
 * El contenedor tiene role="status" y aria-live="polite", así que los
 * lectores de pantalla ANUNCIAN el mensaje cuando cambia (ARIA).
 *
 * @param {HTMLElement} contenedor - el <div id="mensaje-estado">
 * @param {string} texto  - lo que se le dice al usuario
 * @param {string} tipo   - "success" | "danger" | "warning" | "info" (clases de Bootstrap)
 */
export function mostrarMensaje(contenedor, texto, tipo) {
  contenedor.className = "alert alert-" + tipo + " py-2 mb-3";
  contenedor.textContent = texto; // textContent: seguro contra XSS
}

/**
 * Pone un botón en modo "cargando": lo desactiva (evita 5 clics
 * seguidos) y muestra un spinner de Bootstrap con texto.
 * Devuelve una función para volver al estado normal.
 */
export function iniciarCarga(boton, textoCargando) {
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = "";
  const spinner = document.createElement("span");
  spinner.className = "spinner-border spinner-border-sm me-2";
  spinner.setAttribute("aria-hidden", "true"); // decorativo: el texto ya lo dice
  boton.append(spinner, document.createTextNode(textoCargando));

  return function terminarCarga() {
    boton.disabled = false;
    boton.textContent = textoOriginal;
  };
}

/**
 * Aplica el tema con el atributo data-bs-theme de la etiqueta <html>.
 * Bootstrap 5.3 cambia todos sus colores solo al leer este atributo.
 * dataset.bsTheme es el mismo atributo visto desde JavaScript.
 */
export function aplicarTema(tema, botonTema) {
  document.documentElement.dataset.bsTheme = tema;
  // aria-pressed le dice al lector de pantalla si el botón está "activado".
  botonTema.setAttribute("aria-pressed", String(tema === "dark"));
  botonTema.textContent = tema === "dark" ? "Tema claro" : "Tema oscuro";
}

/** Conecta el botón de tema: aplica el guardado y alterna al hacer clic. */
export function iniciarTema(botonTema) {
  aplicarTema(cargarTema(), botonTema); // null en la 1ª visita → "light"
  botonTema.addEventListener("click", function () {
    const nuevo = document.documentElement.dataset.bsTheme === "dark" ? "light" : "dark";
    aplicarTema(nuevo, botonTema);
    guardarTema(nuevo); // localStorage: preferencia que debe durar
  });
}
