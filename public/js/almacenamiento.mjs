// ====================================================================
// ALMACENAMIENTO.MJS — Web Storage (localStorage y sessionStorage)
// --------------------------------------------------------------------
// Regla de decisión que usamos (ver tema "Persistencia en el navegador"):
//
//  localStorage  → lo que debe SOBREVIVIR al cerrar el navegador:
//                  · "cv-borrador": el CV que el usuario va escribiendo
//                  · "cv-tema": tema claro u oscuro (preferencia)
//  sessionStorage → lo que solo sirve en ESTA visita (pestaña):
//                  · "cv-ultimo-id": código del último CV enviado al servidor
//                  · "cv-recargas": cuántas veces se cargó la página en esta visita
//
// NO se guarda ningún dato sensible (ni contraseñas ni tokens).
// Todas las funciones usan try/catch: el almacenamiento puede estar
// bloqueado (modo privado, política del navegador) y la app debe
// seguir funcionando igual, solo que sin recordar.
// ====================================================================

const CLAVE_BORRADOR = "cv-borrador";
const CLAVE_TEMA = "cv-tema";
const CLAVE_ULTIMO_ID = "cv-ultimo-id";
const CLAVE_RECARGAS = "cv-recargas";

// ---------- localStorage: borrador del CV (es un OBJETO) ----------

/** Guarda el objeto CV. localStorage solo guarda TEXTO → JSON.stringify. */
export function guardarBorrador(estado) {
  try {
    localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(estado));
  } catch (error) {
    console.warn("No se pudo guardar el borrador:", error);
  }
}

/** Lee el borrador. Devuelve null si no hay nada (primera visita) o si está dañado. */
export function cargarBorrador() {
  try {
    const texto = localStorage.getItem(CLAVE_BORRADOR);
    if (texto === null) return null;   // primera visita: no hay nada guardado
    return JSON.parse(texto);          // texto → objeto otra vez
  } catch (error) {
    return null; // JSON dañado o almacenamiento bloqueado: partimos de cero
  }
}

// ---------- localStorage: tema (es un TEXTO simple) ----------

export function guardarTema(tema) {
  try { localStorage.setItem(CLAVE_TEMA, tema); } catch (error) { /* sin almacenamiento: se ignora */ }
}

/** Devuelve "dark" o "light". Si nunca se guardó (null) → "light". */
export function cargarTema() {
  try {
    return localStorage.getItem(CLAVE_TEMA) === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

// ---------- sessionStorage: datos de ESTA visita ----------

export function guardarUltimoId(id) {
  try { sessionStorage.setItem(CLAVE_ULTIMO_ID, id); } catch (error) { /* se ignora */ }
}

/** Devuelve el último código usado en esta pestaña, o null. */
export function cargarUltimoId() {
  try { return sessionStorage.getItem(CLAVE_ULTIMO_ID); } catch (error) { return null; }
}

/** Suma 1 al contador de cargas de esta visita y devuelve el total. */
export function contarRecarga() {
  try {
    // Number(null) es 0, así que la primera vez empieza en 0 + 1.
    const total = Number(sessionStorage.getItem(CLAVE_RECARGAS)) + 1;
    sessionStorage.setItem(CLAVE_RECARGAS, String(total));
    return total;
  } catch (error) {
    return 1;
  }
}

// ---------- Borrar datos (el usuario controla lo que se recuerda) ----------

/** "Olvidar mis datos": borra borrador, tema y datos de sesión. */
export function olvidarTodo() {
  try {
    localStorage.removeItem(CLAVE_BORRADOR);
    localStorage.removeItem(CLAVE_TEMA);
    sessionStorage.removeItem(CLAVE_ULTIMO_ID);
    sessionStorage.removeItem(CLAVE_RECARGAS);
  } catch (error) {
    console.warn("No se pudo borrar:", error);
  }
}
