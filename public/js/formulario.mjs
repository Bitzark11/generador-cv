// ====================================================================
// FORMULARIO.MJS
// Escucha TODO lo que pasa en el formulario (escribir, hacer clic en
// "Agregar", eliminar un bloque...) y mantiene actualizado un objeto
// JavaScript (el "estado") con los datos del CV. Cada vez que algo
// cambia, avisa llamando a la función "alCambiar" que le pasaron
// (app.mjs la usa para redibujar la vista previa y guardar el borrador).
//
// Buenas prácticas usadas en TODO este archivo:
//  - Solo let/const, nunca var.
//  - Solo === (nunca ==) al comparar valores.
//  - addEventListener (nunca onclick en el HTML).
//
// IDEA CLAVE — DELEGACIÓN DE EVENTOS:
// Los bloques de experiencia y educación se crean y se borran todo el
// tiempo. En vez de ponerle un listener a cada bloque, escuchamos en el
// CONTENEDOR PADRE (que nunca se destruye): el evento "sube" solo desde
// el hijo hasta el padre (bubbling) y ahí usamos evento.target para
// saber en qué hijo ocurrió.
//
// Las clases (btn, form-control, border, p-3...) son de BOOTSTRAP.
// ====================================================================

// Contador para generar ids únicos ("exp-1", "exp-2"...). Es let porque cambia.
let contador = 0;
function nuevoId(prefijo) {
  contador = contador + 1;
  return prefijo + "-" + contador;
}

/**
 * Crea el objeto vacío con el que arranca un CV nuevo.
 * @returns {object} el "estado" inicial
 */
export function estadoVacio() {
  return {
    plantilla: "clasica",
    nombre: "",
    cargo: "",
    correo: "",
    telefono: "",
    resumen: "",
    experiencia: [], // [{ id, puesto, empresa }]
    educacion: [],   // [{ id, titulo, institucion }]
    habilidades: [], // ["JavaScript", "CSS"]
  };
}

/**
 * FUNCIÓN PRINCIPAL: conecta TODOS los eventos del formulario.
 * Se llama una sola vez, al arrancar la aplicación.
 *
 * @param {object} elementos  - referencias a los elementos del HTML
 * @param {object} estado     - objeto que se modifica al escribir
 * @param {Function} alCambiar - se ejecuta CADA VEZ que algo cambia
 * @returns {object} { rellenarFormulario } para restaurar un borrador
 *                   o un CV traído del servidor.
 */
export function iniciarFormulario(elementos, estado, alCambiar) {

  // ---------- 1) Campos de texto simples (nombre, cargo, correo...) ----------
  // UN solo listener en el <form> sirve para los 5 campos: miramos el
  // atributo "name" de quien disparó el evento (evento.target).
  elementos.form.addEventListener("input", function (evento) {
    const campo = evento.target.name;
    if (campo === "nombre" || campo === "cargo" || campo === "correo" ||
        campo === "telefono" || campo === "resumen") {
      estado[campo] = evento.target.value; // estado["nombre"] = estado.nombre
      alCambiar(estado);
    }
  });

  // ---------- 2) Elegir plantilla (radios) ----------
  elementos.selectorPlantilla.addEventListener("change", function (evento) {
    estado.plantilla = evento.target.value;
    alCambiar(estado);
  });

  // ---------- 3) Experiencia y educación: DELEGACIÓN DE EVENTOS ----------
  // Las dos listas funcionan igual, así que conectamos ambas con la
  // misma función auxiliar (en vez de repetir el código dos veces).
  conectarLista(elementos.listaExperiencia, "experiencia");
  conectarLista(elementos.listaEducacion, "educacion");

  /**
   * Pone 2 listeners (escribir y eliminar) en el contenedor de una lista.
   * @param {HTMLElement} contenedor - #lista-experiencia o #lista-educacion
   * @param {string} nombreLista     - "experiencia" o "educacion" (propiedad del estado)
   */
  function conectarLista(contenedor, nombreLista) {
    // 3a) Escribir en un input DENTRO de un bloque:
    contenedor.addEventListener("input", function (evento) {
      // closest("[data-id]") sube desde el input hasta el bloque que
      // tiene data-id: "¿a qué bloque pertenece este input?"
      const bloque = evento.target.closest("[data-id]");
      if (bloque === null) return;
      // find() busca en el arreglo el objeto con ese mismo id.
      const item = estado[nombreLista].find((e) => e.id === bloque.dataset.id);
      // data-campo dice qué propiedad editar ("puesto", "empresa"...).
      item[evento.target.dataset.campo] = evento.target.value;
      alCambiar(estado);
    });

    // 3b) Clic en el botón "Eliminar" de un bloque:
    contenedor.addEventListener("click", function (evento) {
      const boton = evento.target.closest("[data-accion='eliminar']");
      if (boton === null) return; // el clic fue en otra cosa
      const bloque = boton.closest("[data-id]");
      // filter() crea un arreglo NUEVO sin el elemento eliminado.
      estado[nombreLista] = estado[nombreLista].filter((e) => e.id !== bloque.dataset.id);
      bloque.remove(); // lo quita también de la pantalla
      alCambiar(estado);
    });
  }

  // ---------- 4) Botones "Agregar ..." (también delegados en el <form>) ----------
  elementos.form.addEventListener("click", function (evento) {
    const boton = evento.target.closest("[data-accion]");
    if (boton === null) return;
    if (boton.dataset.accion === "agregar-experiencia") { agregarExperiencia(); alCambiar(estado); }
    if (boton.dataset.accion === "agregar-educacion") { agregarEducacion(); alCambiar(estado); }
    if (boton.dataset.accion === "agregar-habilidad") agregarHabilidad();
  });

  // Enter dentro del campo de habilidad también la agrega (teclado).
  elementos.entradaHabilidad.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
      evento.preventDefault(); // evita que el formulario se "envíe"
      agregarHabilidad();
    }
  });

  // ------------------------------------------------------------------
  // FUNCIONES QUE CREAN CADA BLOQUE/CHIP NUEVO EN EL DOM
  // ------------------------------------------------------------------

  /**
   * Agrega una experiencia: crea el objeto en estado.experiencia Y el
   * bloque visual. Si recibe "datos" (al restaurar), los precarga.
   * @param {object} [datos] - { puesto, empresa } opcional
   */
  function agregarExperiencia(datos) {
    const origen = datos || {};
    const item = { id: nuevoId("exp"), puesto: origen.puesto || "", empresa: origen.empresa || "" };
    estado.experiencia.push(item);
    elementos.listaExperiencia.appendChild(
      crearBloque(item, "puesto", "Cargo", "empresa", "Empresa")
    );
  }

  /** Igual que agregarExperiencia(), pero para un estudio. */
  function agregarEducacion(datos) {
    const origen = datos || {};
    const item = { id: nuevoId("edu"), titulo: origen.titulo || "", institucion: origen.institucion || "" };
    estado.educacion.push(item);
    elementos.listaEducacion.appendChild(
      crearBloque(item, "titulo", "Título", "institucion", "Institución")
    );
  }

  /**
   * Agrega una habilidad. Si no recibe texto, lo lee del input.
   * @param {string} [textoDado] - habilidad ya conocida (al restaurar)
   */
  function agregarHabilidad(textoDado) {
    const texto = (textoDado !== undefined ? textoDado : elementos.entradaHabilidad.value).trim();
    if (texto === "") return; // no agregamos habilidades vacías
    estado.habilidades.push(texto);
    elementos.listaHabilidades.appendChild(crearChip(texto));
    elementos.entradaHabilidad.value = "";
    alCambiar(estado);
  }

  /**
   * Crea un bloque con 2 campos de texto + botón "Eliminar".
   * La MISMA función sirve para experiencia y educación (solo cambian
   * los nombres de los campos): reutilizar en vez de duplicar.
   * @param {object} item - { id, ...datos } para precargar los valores
   */
  function crearBloque(item, campo1, etiqueta1, campo2, etiqueta2) {
    const bloque = document.createElement("div");
    bloque.className = "border rounded p-3 mb-3"; // Bootstrap: borde, esquinas, relleno, margen
    bloque.dataset.id = item.id; // así lo encuentran los listeners de arriba

    const cabecera = document.createElement("div");
    cabecera.className = "d-flex justify-content-end mb-2";
    const eliminar = document.createElement("button");
    eliminar.type = "button"; // "button" evita enviar el formulario
    eliminar.className = "btn btn-sm btn-danger";
    eliminar.dataset.accion = "eliminar"; // lo detecta la delegación de clic
    eliminar.textContent = "Eliminar";
    cabecera.appendChild(eliminar);

    bloque.append(
      cabecera,
      crearCampo(item, campo1, etiqueta1),
      crearCampo(item, campo2, etiqueta2)
    );
    return bloque;
  }

  /** Crea un <label> + <input> enlazados (accesibilidad: for/id). */
  function crearCampo(item, nombreCampo, etiquetaTexto) {
    const envoltorio = document.createElement("div");
    envoltorio.className = "mb-2";

    const input = document.createElement("input");
    input.type = "text";
    input.id = item.id + "-" + nombreCampo;     // id único
    input.className = "form-control";
    input.maxLength = 80;
    input.value = item[nombreCampo];            // precarga (value no interpreta HTML)
    input.dataset.campo = nombreCampo;          // lo usa la delegación de "input"

    const label = document.createElement("label");
    label.htmlFor = input.id;                   // enlaza label ↔ input
    label.className = "form-label small mb-1";
    label.textContent = etiquetaTexto;

    envoltorio.append(label, input);
    return envoltorio;
  }

  /**
   * Crea un "chip" de habilidad con botón para quitarla.
   * SEGURIDAD XSS: usamos textContent, NUNCA innerHTML, porque "texto"
   * lo escribió el usuario y podría traer código malicioso.
   */
  function crearChip(texto) {
    const li = document.createElement("li");
    li.className = "d-inline-flex align-items-center gap-2 border rounded-pill ps-3 pe-2 py-1";

    const span = document.createElement("span");
    span.textContent = texto; // siempre texto plano

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-close btn-sm"; // botón "X" de Bootstrap
    boton.setAttribute("aria-label", "Eliminar " + texto); // lectores de pantalla

    // Un chip tiene un solo botón y una sola acción: aquí basta un listener directo.
    boton.addEventListener("click", function () {
      estado.habilidades = estado.habilidades.filter((h) => h !== texto);
      li.remove();
      alCambiar(estado);
    });

    li.append(span, boton);
    return li;
  }

  // ------------------------------------------------------------------
  // RESTAURAR: pinta en pantalla un CV guardado (borrador o del servidor)
  // ------------------------------------------------------------------
  /**
   * Reemplaza TODO el contenido del formulario por los datos recibidos.
   * @param {object} datos - un CV (mismo formato que el estado)
   */
  function rellenarFormulario(datos) {
    // 1) Campos simples: asignamos al estado y a cada <input>.
    ["nombre", "cargo", "correo", "telefono", "resumen"].forEach(function (campo) {
      estado[campo] = datos[campo] || "";
      document.getElementById(campo).value = estado[campo];
    });

    // 2) Plantilla: marcamos el radio que corresponda (si existe).
    estado.plantilla = datos.plantilla || "clasica";
    const radio = elementos.selectorPlantilla.querySelector('input[value="' + estado.plantilla + '"]');
    if (radio !== null) radio.checked = true;

    // 3) Listas: vaciamos arreglo Y pantalla; luego agregamos una por una.
    estado.experiencia = [];
    estado.educacion = [];
    estado.habilidades = [];
    elementos.listaExperiencia.replaceChildren();
    elementos.listaEducacion.replaceChildren();
    elementos.listaHabilidades.replaceChildren();

    (datos.experiencia || []).forEach(agregarExperiencia);
    (datos.educacion || []).forEach(agregarEducacion);
    (datos.habilidades || []).forEach(agregarHabilidad);

    alCambiar(estado);
  }

  return { rellenarFormulario };
}
