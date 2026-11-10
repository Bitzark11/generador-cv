// ====================================================================
// SERVER.JS — SERVIDOR NODE.JS + EXPRESS
// --------------------------------------------------------------------
// Este archivo hace 4 cosas:
//   1) Lee la configuración desde variables de entorno (.env).
//   2) Configura la seguridad básica (CORS, límite de tamaño).
//   3) Define las RUTAS de la API (responden JSON + código HTTP).
//   4) Sirve el frontend (carpeta public/) como archivos estáticos.
//
// Arranque: npm start  →  node server.js
// ====================================================================

// "import ... from" funciona porque package.json tiene "type": "module".
import "dotenv/config";            // lee el archivo .env y lo carga en process.env
import express from "express";     // el framework del servidor
import cors from "cors";           // permite (o bloquea) peticiones de otros orígenes
import compression from "compression"; // comprime las respuestas con gzip (optimización)
import { randomUUID } from "node:crypto"; // genera ids únicos e impredecibles
import { fileURLToPath } from "node:url";
import path from "node:path";
import { existsSync } from "node:fs";
import { PLANTILLAS, validarCV } from "./validar.js";

// ---------- 1) CONFIGURACIÓN (variables de entorno) ----------
// process.env.PORT: Render y otros servicios asignan el puerto por
// esta variable. Si no existe (en tu PC), usamos 3000.
const PORT = process.env.PORT || 3000;

// ALLOWED_ORIGIN: lista (separada por comas) de los sitios que SÍ
// pueden llamar a esta API desde un navegador. Va en .env, no en el
// código, porque cambia entre tu PC y producción.
const ORIGENES_PERMITIDOS = (process.env.ALLOWED_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

// En módulos ES no existe __dirname; lo reconstruimos así para poder
// ubicar la carpeta "public" sin importar desde dónde se ejecute node.
const CARPETA_RAIZ = path.dirname(fileURLToPath(import.meta.url));

// "Base de datos" de ejemplo: un Map en memoria (id → cv).
// Se borra cuando el servidor se reinicia (en Render gratis se duerme).
// Para el alcance de este curso es suficiente y evita instalar una BD.
const cvGuardados = new Map();
const MAX_GUARDADOS = 200; // evita que la memoria crezca sin límite

const app = express();
app.disable("x-powered-by"); // no avisamos a los atacantes que usamos Express

// ---------- 2) MIDDLEWARES (se ejecutan en orden, en cada petición) ----------
app.use(compression());            // comprime las respuestas
// CORS: solo se aplica a las rutas /api (los archivos estáticos son públicos).
// cors() recibe una función que decide, petición por petición, si el
// "Origin" (el sitio desde donde el navegador hace el fetch) está permitido.
app.use(
  "/api",
  cors(function (req, callback) {
    const origen = req.get("Origin"); // ej: "https://mi-app.netlify.app"
    let mismoSitio = false;
    try {
      // Si la página y la API viven en el MISMO servicio (despliegue
      // único), el Origin coincide con el host de esta petición.
      mismoSitio = origen !== undefined && new URL(origen).host === req.get("Host");
    } catch (error) {
      mismoSitio = false; // Origin mal formado (ej: "null")
    }
    // Se permite si: no hay Origin (curl/Postman), es el mismo sitio,
    // o está en la lista blanca ALLOWED_ORIGIN. Si no: error → 403.
    if (origen === undefined || mismoSitio || ORIGENES_PERMITIDOS.includes(origen)) {
      callback(null, { origin: true });
    } else {
      callback(new Error("Origen no permitido por CORS"));
    }
  })
);
app.use(express.json({ limit: "50kb" })); // convierte el JSON recibido en req.body

// ---------- 3) RUTAS DE LA API ----------

// GET /api/salud → "¿está vivo el servidor?" (útil para probar el despliegue)
app.get("/api/salud", function (req, res) {
  res.status(200).json({ ok: true, hora: new Date().toISOString() });
});

// GET /api/plantillas → lista de plantillas disponibles.
// El frontend la pide con fetch al cargar para dibujar los radios.
app.get("/api/plantillas", function (req, res) {
  res.status(200).json(PLANTILLAS);
});

// POST /api/cv → recibe el CV del formulario, lo VALIDA y lo guarda.
//   400 si los datos no son válidos | 201 si se creó correctamente
app.post("/api/cv", function (req, res) {
  const { errores, cv } = validarCV(req.body);

  if (errores.length > 0) {
    // 400 = Bad Request: el cliente envió datos incorrectos.
    return res.status(400).json({ ok: false, errores });
  }

  // Si ya hay demasiados, borramos el más antiguo (el primero del Map).
  if (cvGuardados.size >= MAX_GUARDADOS) {
    cvGuardados.delete(cvGuardados.keys().next().value);
  }
  const id = randomUUID().slice(0, 8); // ej: "3f9a1c2b"
  cvGuardados.set(id, cv);
  // 201 = Created: se creó un recurso nuevo.
  res.status(201).json({ ok: true, id, cv });
});

// GET /api/cv/:id → devuelve un CV guardado. ":id" es un parámetro de la URL.
//   404 si no existe | 200 si existe
app.get("/api/cv/:id", function (req, res) {
  const cv = cvGuardados.get(req.params.id);
  if (!cv) {
    // 404 = Not Found: ese id no existe.
    return res.status(404).json({ ok: false, errores: ["No existe un CV con ese código."] });
  }
  res.status(200).json({ ok: true, id: req.params.id, cv });
});

// Cualquier otra ruta que empiece por /api/ no existe → 404 en JSON.
app.use("/api", function (req, res) {
  res.status(404).json({ ok: false, errores: ["Ruta de la API no encontrada."] });
});

// ---------- 4) ARCHIVOS ESTÁTICOS (el frontend) ----------
// EN PRODUCCIÓN (NODE_ENV=production, que Render define solo) y si existe
// dist/ (lo crea "npm run build" con archivos MINIFICADOS), se sirve dist/.
// En tu PC se sirve public/ (código legible, para desarrollar).
// maxAge: el navegador guarda los archivos 1 hora (caché = más rápido).
const usarDist = process.env.NODE_ENV === "production" && existsSync(path.join(CARPETA_RAIZ, "dist"));
const CARPETA_FRONTEND = usarDist ? "dist" : "public";
app.use(express.static(path.join(CARPETA_RAIZ, CARPETA_FRONTEND), { maxAge: "1h" }));

// ---------- MANEJO DE ERRORES (siempre al final) ----------
// Express reconoce un manejador de errores porque tiene 4 parámetros.
// Aquí caen, por ejemplo, un JSON mal formado o un origen CORS bloqueado.
app.use(function (err, req, res, next) {
  const esJsonInvalido = err.type === "entity.parse.failed";
  const esCors = err.message.includes("CORS");
  const estado = esJsonInvalido ? 400 : esCors ? 403 : 500;
  // Al usuario le damos un mensaje claro; el detalle técnico solo a la consola.
  console.error("[error]", err.message);
  let mensaje = "No se pudo procesar la petición.";
  if (esJsonInvalido) mensaje = "El JSON enviado no es válido.";
  if (esCors) mensaje = "Este sitio no está autorizado para usar la API (CORS).";
  res.status(estado).json({ ok: false, errores: [mensaje] });
});

// ---------- ARRANQUE ----------
app.listen(PORT, function () {
  console.log("Servidor listo en http://localhost:" + PORT + " (sirviendo " + CARPETA_FRONTEND + "/)");
});
