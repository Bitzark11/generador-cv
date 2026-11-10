# Informe de Lighthouse y análisis

> Medición **local** (Lighthouse 13.6, Chrome headless, modo escritorio/móvil por defecto de la herramienta,
> servidor en modo producción con `NODE_ENV=production`, es decir sirviendo `dist/` minificado y comprimido).
> El archivo completo está en `docs/lighthouse-local.html` (ábrelo en el navegador).
>
> **Pendiente para la entrega:** repetir la medición sobre la **URL publicada** (F12 → Lighthouse → Analyze page load)
> y reemplazar/añadir los números de la última sección.

## Puntajes (local)

| Categoría | Puntaje |
|---|---|
| Rendimiento (Performance) | 100 |
| Accesibilidad | 100 |
| Buenas prácticas | 100 |
| SEO | 100 |

| Métrica | Valor |
|---|---|
| First Contentful Paint | 1,1 s |
| Largest Contentful Paint | 1,1 s |
| Total Blocking Time | 0 ms |
| Cumulative Layout Shift | 0 |
| Peso total de la página | 42 KiB |

## Optimizaciones aplicadas y evidencia

| Optimización | Dónde está | Evidencia |
|---|---|---|
| **Minificación** | `npm run build` (`build.js`, esbuild) genera `dist/` | CSS propio 3,7 KB → 1,5 KB; los 6 módulos JS (≈38 KB con comentarios) quedan en un solo archivo de ≈10 KB. La auditoría "Minify JavaScript" pasó de 0,5 a 1 |
| **Compresión (gzip)** | middleware `compression()` en `server.js` | `app.mjs` viaja como 3,8 KB en vez de 10 KB; `index.html` 3,3 KB en vez de 8,8 KB |
| **Lazy loading** | `<img loading="lazy">` en `index.html` | La imagen del pie no se pide hasta que el usuario se acerca; lleva `width` y `height`, por eso CLS = 0 |
| **Caché** | `express.static(..., { maxAge: "1h" })` | El navegador reutiliza archivos durante 1 hora |
| **Bootstrap ya minificado + versión fija** | `bootstrap.min.css` 5.3.8 por CDN | Sin el JS de Bootstrap (no se usa) se ahorran ≈80 KB |

## Qué dijo Lighthouse y qué decidí

1. **Reduce unused CSS (≈31 KiB):** es el CSS de Bootstrap, que trae reglas de componentes que no uso (carruseles, modales…).
   Se podría recortar con una compilación personalizada de Bootstrap, pero el costo (complejidad) es mayor que el beneficio
   (el puntaje de Rendimiento ya es 100). Decisión: se deja y se documenta.
2. **Use efficient cache lifetimes:** el `maxAge` es de 1 hora a propósito: si cambio un archivo, los usuarios lo ven pronto.
   Para cachear más tiempo habría que añadir un hash al nombre del archivo en cada build.
3. **Render-blocking requests:** el CSS de Bootstrap bloquea el primer dibujo. Es inevitable: sin CSS la página se vería rota.
4. **Contraste (Accesibilidad):** pasa. Medido además con la fórmula WCAG (ver README): botones 4,5 a 1 o más, hoja del CV de 6,7 a 15,8 a 1.

## Mediciones en la URL publicada (completar)

| Categoría | Móvil | Escritorio |
|---|---|---|
| Rendimiento | | |
| Accesibilidad | | |
| Buenas prácticas | | |
| SEO | | |

Observaciones: (por ejemplo, si el primer arranque del backend en Render es lento porque el plan gratuito "duerme" tras ~15 min sin uso)
