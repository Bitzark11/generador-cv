// ====================================================================
// VALIDAR.JS — VALIDACIÓN EN EL SERVIDOR (seguridad)
// --------------------------------------------------------------------
// ¿Por qué validar aquí si el formulario ya valida en el navegador?
// Porque TODO lo que viene del navegador se puede falsificar: alguien
// puede saltarse la página y enviar una petición POST directa (con
// Postman, curl o la consola). El servidor NUNCA debe confiar en lo
// que recibe: valida, limpia y recién entonces acepta el dato.
//
// Este archivo solo valida y limpia. No sabe nada de Express: recibe
// un objeto y devuelve { errores, cv }. Así server.js queda corto.
// ====================================================================

// Lista de plantillas válidas. Es la MISMA que sirve la ruta
// GET /api/plantillas, así que hay una sola fuente de verdad.
export const PLANTILLAS = [
  { id: "clasica", nombre: "Clásica" },
  { id: "moderna", nombre: "Moderna" },
];

// Expresión regular simple para un correo: algo@algo.algo (sin espacios).
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfono: solo dígitos, espacios, +, guiones y paréntesis (6 a 20 caracteres).
const REGEX_TELEFONO = /^[0-9 +()-]{6,20}$/;

/**
 * Convierte cualquier valor en texto limpio y con largo máximo.
 * - Si no es texto (ej: un número o un objeto), devuelve "".
 * - trim() quita espacios al inicio y al final.
 * - slice(0, max) recorta para que nadie envíe textos gigantes.
 */
function limpiar(valor, max) {
  if (typeof valor !== "string") return "";
  return valor.trim().slice(0, max);
}

/**
 * Valida y limpia el CV que llega en el cuerpo (body) del POST.
 *
 * @param {object} cuerpo - lo que llegó en req.body (ya convertido de JSON)
 * @returns {{errores: string[], cv: object}} errores = lista de
 *   mensajes para el usuario (vacía si todo está bien); cv = el objeto
 *   limpio que SÍ es seguro guardar.
 */
export function validarCV(cuerpo) {
  const errores = [];

  // Si ni siquiera llegó un objeto, no seguimos.
  if (cuerpo === null || typeof cuerpo !== "object") {
    return { errores: ["El cuerpo de la petición debe ser un objeto JSON."], cv: null };
  }

  // 1) Campos de texto: los limpiamos uno por uno.
  const cv = {
    plantilla: limpiar(cuerpo.plantilla, 20),
    nombre: limpiar(cuerpo.nombre, 80),
    cargo: limpiar(cuerpo.cargo, 80),
    correo: limpiar(cuerpo.correo, 100),
    telefono: limpiar(cuerpo.telefono, 20),
    resumen: limpiar(cuerpo.resumen, 500),
    experiencia: [],
    educacion: [],
    habilidades: [],
  };

  // 2) Reglas. Cada regla que falla agrega un mensaje a "errores".
  if (cv.nombre.length < 2) {
    errores.push("El nombre es obligatorio (mínimo 2 caracteres).");
  }
  // some() devuelve true si ALGUNA plantilla tiene ese id.
  if (!PLANTILLAS.some((p) => p.id === cv.plantilla)) {
    errores.push("La plantilla elegida no existe.");
  }
  // El correo es opcional, pero si viene debe tener formato válido.
  if (cv.correo !== "" && !REGEX_CORREO.test(cv.correo)) {
    errores.push("El correo no tiene un formato válido.");
  }
  if (cv.telefono !== "" && !REGEX_TELEFONO.test(cv.telefono)) {
    errores.push("El teléfono solo puede tener números, espacios, +, - y paréntesis.");
  }

  // 3) Listas: deben ser arreglos, con máximo 10 elementos cada una.
  if (Array.isArray(cuerpo.experiencia)) {
    cv.experiencia = cuerpo.experiencia.slice(0, 10).map((e) => ({
      puesto: limpiar(e && e.puesto, 80),
      empresa: limpiar(e && e.empresa, 80),
    }));
  }
  if (Array.isArray(cuerpo.educacion)) {
    cv.educacion = cuerpo.educacion.slice(0, 10).map((e) => ({
      titulo: limpiar(e && e.titulo, 80),
      institucion: limpiar(e && e.institucion, 80),
    }));
  }
  if (Array.isArray(cuerpo.habilidades)) {
    // filter(...) descarta habilidades vacías después de limpiar.
    cv.habilidades = cuerpo.habilidades
      .slice(0, 20)
      .map((h) => limpiar(h, 40))
      .filter((h) => h !== "");
  }

  return { errores, cv };
}
