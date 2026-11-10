// ====================================================================
// PLANTILLAS.MJS
// Construye la "hoja" del CV (el <article id="vista-previa">) a partir
// del objeto datosCV. Es un MÓDULO ES: comparte su función principal
// con "export" para que app.mjs pueda usarla con "import".
//
// ------------------------------------------------------------------
// SEGURIDAD XSS — LA PARTE MÁS IMPORTANTE DE ESTE ARCHIVO
// ------------------------------------------------------------------
// Todo lo que aparece aquí (nombre, cargo, descripciones...) lo
// escribió la persona que llenó el formulario. Nunca debemos confiar
// ciegamente en ese texto.
//
//   ❌ PELIGROSO (nunca hacer esto):
//   contenedor.innerHTML = "<h2>" + datosCV.nombre + "</h2>";
//
//   Si alguien escribiera en el campo "Nombre" algo como:
//   <img src=x onerror="alert('hackeado')">
//   el navegador lo tomaría como HTML real y EJECUTARÍA ese código.
//   Eso es un ataque XSS (Cross-Site Scripting): código ajeno
//   corriendo dentro de nuestra propia página.
//
//   ✅ SEGURO (lo que hacemos en TODAS las funciones de este archivo):
//   const h2 = document.createElement("h2");
//   h2.textContent = datosCV.nombre;
//
//   textContent SIEMPRE trata el valor como texto plano, nunca como
//   código HTML, sin importar qué haya escrito la persona. Por eso en
//   este archivo jamás usamos innerHTML: solo createElement (para
//   crear la "caja") + textContent (para poner el texto adentro).
// ====================================================================

/**
 * FUNCIÓN PRINCIPAL DEL ARCHIVO (la única que se exporta y se usa
 * desde afuera). Recibe el objeto completo con los datos del CV y
 * devuelve un <article> ya armado, listo para mostrarse en pantalla.
 *
 * app.mjs la llama cada vez que algo cambia en el formulario, y
 * reemplaza el <article> viejo por el que esta función devuelve.
 *
 * @param {object} datosCV - objeto con: plantilla, nombre, cargo,
 *                            correo, telefono, resumen, experiencia
 *                            (arreglo), educacion (arreglo) y
 *                            habilidades (arreglo de textos).
 * @returns {HTMLElement} el <article class="hoja plantilla-..."> completo
 */
export function construirCV(datosCV) {
  // 1) Creamos el "molde" vacío: el <article> que va a contener todo
  //    el CV. Es como una hoja de papel en blanco.
  const articulo = document.createElement("article");
  articulo.id = "vista-previa";

  // La clase depende de qué plantilla eligió el usuario:
  // quedará "hoja plantilla-clasica" o "hoja plantilla-moderna".
  // Esa clase es la que el CSS (estilos.css) usa para cambiar la
  // tipografía y los colores; el JavaScript NO decide colores, solo
  // pone el nombre correcto de la clase.
  articulo.className = "hoja plantilla-" + datosCV.plantilla;

  // 2) Nombre y cargo (el encabezado del CV).
  const nombre = document.createElement("h2");
  // Operador ternario: "si nombre es distinto de vacío, úsalo;
  // si no, muestra un texto de relleno para que la hoja no se vea rota."
  nombre.textContent = datosCV.nombre !== "" ? datosCV.nombre : "Tu nombre";

  const cargo = document.createElement("p");
  cargo.className = "hoja__cargo"; // el CSS usa esta clase para pintarlo de color en la plantilla Moderna
  cargo.textContent = datosCV.cargo;

  // 3) Datos de contacto (correo y teléfono), solo si el usuario los
  //    llenó. Usamos un arreglo con los dos valores y forEach para no
  //    repetir el mismo código de "crear <li> y agregarlo" dos veces.
  const contacto = document.createElement("ul");
  contacto.className = "hoja__contacto";
  [datosCV.correo, datosCV.telefono].forEach(function (valor) {
    if (valor !== "") {
      const li = document.createElement("li");
      li.textContent = valor; // dato del usuario -> siempre textContent
      contacto.appendChild(li);
    }
  });

  // append() agrega varios elementos hijos de una sola vez (equivale
  // a llamar appendChild tres veces seguidas).
  articulo.append(nombre, cargo, contacto);

  // 4) El resto de secciones se arman llamando a funciones más chicas
  //    (definidas más abajo). Esto evita repetir código: en vez de
  //    escribir "crear título + crear texto" 5 veces, lo escribimos
  //    UNA vez dentro de crearSeccion() y aquí solo la llamamos.
  articulo.appendChild(crearSeccion("Perfil", datosCV.resumen || "Agrega un breve perfil."));

  articulo.appendChild(
    crearSeccionLista("Experiencia laboral", datosCV.experiencia, function (item) {
      return crearItem(item.puesto || "Cargo", item.empresa);
    })
  );

  articulo.appendChild(
    crearSeccionLista("Educación", datosCV.educacion, function (item) {
      return crearItem(item.titulo || "Título", item.institucion);
    })
  );

  articulo.appendChild(crearSeccionHabilidades(datosCV.habilidades));

  // 5) Devolvemos el <article> ya completo. app.mjs se encarga de
  //    ponerlo en la página (reemplazando el anterior).
  return articulo;
}

// --------------------------------------------------------------------
// FUNCIONES AUXILIARES (no se exportan: solo las usa este mismo
// archivo). Cada una construye UNA pieza pequeña y reutilizable del CV.
// --------------------------------------------------------------------

/**
 * Construye una sección de solo texto: un título (h3) + un párrafo.
 * Se usa para el "Perfil profesional".
 * @param {string} titulo - el texto del h3, ej: "Perfil"
 * @param {string} texto  - el texto del párrafo, ej: el resumen del usuario
 * @returns {HTMLElement} un <div class="hoja__seccion"> con su título y texto
 */
function crearSeccion(titulo, texto) {
  const seccion = document.createElement("div");
  seccion.className = "hoja__seccion";

  const h3 = document.createElement("h3");
  h3.textContent = titulo;

  const p = document.createElement("p");
  p.textContent = texto; // texto plano: seguro aunque el usuario pegue HTML aquí

  seccion.append(h3, p);
  return seccion;
}

/**
 * Construye una sección que muestra una LISTA de items: se usa tanto
 * para "Experiencia laboral" como para "Educación" (por eso recibe
 * "crearFilaItem" como parámetro: es una función que sabe construir
 * UN item, distinta según si es experiencia o educación).
 *
 * Esto es un ejemplo de reutilización de código: en vez de escribir
 * dos funciones casi idénticas (una para experiencia, otra para
 * educación), escribimos una sola función genérica y le pasamos como
 * argumento la parte que sí cambia.
 *
 * @param {string} titulo - título de la sección, ej: "Experiencia laboral"
 * @param {Array}  lista  - arreglo de objetos (datosCV.experiencia o .educacion)
 * @param {Function} crearFilaItem - función que recibe UN item del arreglo
 *                                   y devuelve el <div> ya armado para ese item
 * @returns {HTMLElement} la sección completa, con todos sus items dentro
 */
function crearSeccionLista(titulo, lista, crearFilaItem) {
  const seccion = document.createElement("div");
  seccion.className = "hoja__seccion";

  const h3 = document.createElement("h3");
  h3.textContent = titulo;
  seccion.appendChild(h3);

  // Si el usuario todavía no agregó nada, mostramos un aviso en vez
  // de dejar la sección vacía y confusa.
  if (lista.length === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Agrégalo en el formulario.";
    seccion.appendChild(vacio);
  } else {
    // Por cada objeto del arreglo (cada experiencia o cada estudio),
    // le pedimos a "crearFilaItem" que construya su <div> y lo
    // agregamos a la sección.
    lista.forEach(function (item) {
      seccion.appendChild(crearFilaItem(item));
    });
  }
  return seccion;
}

/**
 * Construye UN item de experiencia o de educación: un título en
 * negrita (cargo o título de estudio) + un subtítulo (empresa o
 * institución). Es la pieza más pequeña y reutilizable del archivo.
 *
 * @param {string} tituloPrincipal - ej: el cargo ("Desarrolladora Frontend")
 * @param {string} subtitulo       - ej: la empresa ("Atalaya Studio")
 * @returns {HTMLElement} un <div class="hoja__item"> con sus dos líneas de texto
 */
function crearItem(tituloPrincipal, subtitulo) {
  const div = document.createElement("div");
  div.className = "hoja__item";

  const titulo = document.createElement("p");
  titulo.className = "hoja__item-titulo";
  titulo.textContent = tituloPrincipal;

  const sub = document.createElement("p");
  sub.textContent = subtitulo;

  div.append(titulo, sub);
  return div;
}

/**
 * Construye la sección de "Habilidades": en vez de una lista con
 * viñetas, las mostramos todas juntas separadas por comas en un solo
 * párrafo (más simple visualmente que un <ul> con muchos <li>).
 * @param {string[]} habilidades - arreglo de textos, ej: ["JavaScript", "CSS"]
 */
function crearSeccionHabilidades(habilidades) {
  const seccion = document.createElement("div");
  seccion.className = "hoja__seccion";

  const h3 = document.createElement("h3");
  h3.textContent = "Habilidades";
  seccion.appendChild(h3);

  const p = document.createElement("p");
  // Array.join(", ") une todos los elementos del arreglo en un solo
  // texto, separados por la coma: ["JS","CSS"] -> "JS, CSS"
  p.textContent = habilidades.length > 0 ? habilidades.join(", ") : "Agrégalas en el formulario.";
  seccion.appendChild(p);
  return seccion;
}
