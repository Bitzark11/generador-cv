// ====================================================================
// API.MJS — TODA la comunicación con el servidor vive en este archivo
// --------------------------------------------------------------------
// El resto de la app NO llama a fetch directamente: usa las funciones
// de aquí. Así, si cambia una ruta o la URL del servidor, se modifica
// en UN solo lugar.
// ====================================================================

// ÚNICO lugar donde se define la dirección del servidor.
//  - ""  (vacío) = el servidor Express también sirve esta página
//                  (npm start en tu PC, o un solo servicio en Render).
//  - Si el frontend está en Netlify/Vercel y el backend en Render,
//    se cambia por la URL pública del backend, por ejemplo:
//    export const API_URL = "https://generador-cv-api.onrender.com";
export const API_URL = "";

/**
 * Función genérica que hace TODAS las peticiones y maneja los errores.
 *
 * @param {string} ruta   - ej: "/api/plantillas"
 * @param {object} [opciones] - opciones de fetch (method, body, headers)
 * @returns {Promise<object>} el JSON que respondió el servidor
 * @throws {Error} con un mensaje claro para el usuario si algo falla
 */
async function pedir(ruta, opciones) {
  let respuesta;
  try {
    // await: espera la respuesta del servidor sin congelar la página.
    respuesta = await fetch(API_URL + ruta, opciones);
  } catch (error) {
    // fetch solo lanza error cuando NO hay conexión (servidor caído,
    // sin internet, CORS bloqueado). No lanza error por un 404 o 400.
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  }

  // Leemos el JSON (si el cuerpo no es JSON válido, usamos un objeto vacío).
  const datos = await respuesta.json().catch(function () {
    return {};
  });

  // response.ok es true solo para códigos 200-299.
  // Si es false (400, 404, 500...), mostramos los mensajes del servidor.
  if (!respuesta.ok) {
    let mensaje = "El servidor respondió con un error (" + respuesta.status + ").";
    if (datos.errores) {
      // Respuesta de NUESTRO servidor Express: trae sus mensajes en JSON.
      mensaje = datos.errores.join(" ");
    } else if (respuesta.status === 404 || respuesta.status === 405) {
      // 404/405 SIN JSON = la página está siendo servida por otro programa
      // (Live Server, Netlify, GitHub Pages...) y no por Express, así que
      // ahí NO existe la API. Es el error de configuración más común.
      mensaje = "No se encontró la API del servidor (error " + respuesta.status + "). " +
        "Abre la app con «npm start» en http://localhost:3000 o, si está publicada, " +
        "revisa API_URL en js/api.mjs.";
    }
    throw new Error(mensaje);
  }
  return datos;
}

/** GET /api/plantillas → lista de plantillas [{id, nombre}] */
export function obtenerPlantillas() {
  return pedir("/api/plantillas");
}

/** POST /api/cv → envía el CV; el servidor lo valida y devuelve {id, cv} */
export function guardarCVEnServidor(cv) {
  return pedir("/api/cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cv), // el objeto viaja como texto JSON
  });
}

/** GET /api/cv/:id → recupera un CV guardado por su código */
export function obtenerCVPorId(id) {
  // encodeURIComponent evita que caracteres raros del usuario rompan la URL.
  return pedir("/api/cv/" + encodeURIComponent(id));
}
