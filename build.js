// ====================================================================
// BUILD.JS — OPTIMIZACIÓN PARA PRODUCCIÓN (minificación)
// --------------------------------------------------------------------
// Se ejecuta con:  npm run build
// Toma el frontend legible de public/ (con todos sus comentarios) y
// genera una copia liviana en dist/:
//   · JavaScript: los 6 módulos .mjs se UNEN en un solo archivo (menos
//     peticiones) y se MINIFICAN (sin comentarios ni espacios).
//   · CSS: se minifica.
//   · index.html e imágenes: se copian tal cual.
// El servidor (server.js) sirve dist/ si existe; si no, sirve public/.
// En tu PC trabajas sobre public/ (legible); en producción se usa dist/.
// ====================================================================
import { build } from "esbuild";
import { cp, rm, mkdir, stat } from "node:fs/promises";

const ORIGEN = "public";
const DESTINO = "dist";

await rm(DESTINO, { recursive: true, force: true }); // limpia el build anterior
await mkdir(DESTINO + "/js", { recursive: true });
await mkdir(DESTINO + "/css", { recursive: true });

// JavaScript: bundle (une los import) + minify. Sigue siendo módulo ES.
await build({
  entryPoints: [ORIGEN + "/js/app.mjs"],
  outfile: DESTINO + "/js/app.mjs",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
});

// CSS: solo minificar.
await build({
  entryPoints: [ORIGEN + "/css/estilos.css"],
  outfile: DESTINO + "/css/estilos.css",
  minify: true,
});

// Archivos que se copian sin cambios.
await cp(ORIGEN + "/index.html", DESTINO + "/index.html");
await cp(ORIGEN + "/img", DESTINO + "/img", { recursive: true });

// Informe de tamaños: sirve como evidencia de la optimización.
async function kb(ruta) { return ((await stat(ruta)).size / 1024).toFixed(1) + " KB"; }
console.log("Build listo en dist/");
console.log("  CSS propio :", await kb(ORIGEN + "/css/estilos.css"), "→", await kb(DESTINO + "/css/estilos.css"));
console.log("  app.mjs    : (6 módulos sumados) →", await kb(DESTINO + "/js/app.mjs"));
