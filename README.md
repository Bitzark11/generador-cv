# Generador de Currículums Visuales

Proyecto del **segundo corte** (UNISANGIL) · Autor: **Dayron Sotelo**

Aplicación web para crear un currículum llenando un formulario: la vista previa se actualiza mientras escribes,
puedes elegir entre dos plantillas propias (HTML/CSS), guardar el CV en un servidor propio (Node.js + Express),
recuperarlo con un código, imprimirlo o guardarlo como PDF.

- **Frontend:** HTML + Bootstrap 5.3.8 + JavaScript en módulos `.mjs` (sin librerías de JS).
- **Backend:** Node.js + Express (API JSON, validación, CORS, variables de entorno).
- **Publicación:** (completar con tus URLs)
  - Repositorio: `https://github.com/TU-USUARIO/generador-cv`
  - Aplicación publicada: `https://TU-APP.onrender.com`

## Cómo ejecutarlo en tu computador

Requisitos: [Node.js](https://nodejs.org) 18 o superior.

```bash
npm install                 # instala express, cors, dotenv, compression
cp .env.example .env        # en Windows: copy .env.example .env
npm start                   # abre http://localhost:3000
```

Otros comandos: `npm run dev` (se reinicia al guardar) y `npm run build` (genera `dist/` minificado).

> No abras `index.html` con doble clic: el `fetch` necesita el servidor (`npm start`).

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| Al guardar sale **error 405** (o 404) | La página la está sirviendo otro programa (Live Server de VS Code, Netlify, GitHub Pages…) que no ejecuta `server.js`. En local, usa `npm start` y abre `http://localhost:3000`. Si el frontend está en Netlify/Vercel, pon la URL del backend en `API_URL` (`public/js/api.mjs`) y la URL del frontend en `ALLOWED_ORIGIN` de Render |
| Sale «No se pudo conectar con el servidor» | El backend está apagado, dormido (Render gratis tarda ~1 min en despertar) o CORS lo bloquea: revisa `ALLOWED_ORIGIN` |
| Los CV guardados desaparecen | Se guardan en memoria: se pierden al reiniciar el servidor |

## Estructura

```
├── server.js            Servidor Express: rutas, CORS, estáticos, errores
├── validar.js           Validación y limpieza de datos en el servidor
├── build.js             Minificación para producción (npm run build)
├── package.json         Dependencias y scripts (start, dev, build)
├── .env.example         Plantilla de variables de entorno (el .env real NO se sube)
├── .gitignore           Excluye node_modules/, .env y dist/
├── public/              Frontend (código legible)
│   ├── index.html       Vista única: cuadrícula Bootstrap + formulario + vista previa
│   ├── css/estilos.css  CSS propio (≈100 líneas): foco, microinteracciones y hoja del CV
│   ├── img/consejos.svg Imagen con loading="lazy"
│   └── js/
│       ├── app.mjs            Orquesta todo (arranque, botones, flujo)
│       ├── formulario.mjs     Eventos del formulario (delegación) y estado
│       ├── plantillas.mjs     Construye el CV con createElement/textContent
│       ├── api.mjs            TODOS los fetch + API_URL (un solo lugar)
│       ├── almacenamiento.mjs localStorage y sessionStorage
│       └── interfaz.mjs       Mensajes, spinner de carga y tema claro/oscuro
└── docs/                Informe de Lighthouse y diagrama de componentes
```

## API del servidor

| Método y ruta | Qué hace | Respuestas |
|---|---|---|
| `GET /api/salud` | Comprueba que el servidor vive | `200 {ok, hora}` |
| `GET /api/plantillas` | Lista de plantillas | `200 [{id, nombre}]` |
| `POST /api/cv` | Valida y guarda un CV (en memoria) | `201 {ok, id, cv}` · `400 {ok:false, errores[]}` |
| `GET /api/cv/:id` | Devuelve un CV guardado | `200 {ok, id, cv}` · `404 {ok:false, errores[]}` |

Cualquier otra ruta `/api/...` responde `404` en JSON; un JSON mal formado responde `400`; un origen no autorizado, `403`.

## Variables de entorno

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor (Render lo define solo) | `3000` |
| `ALLOWED_ORIGIN` | Sitios autorizados a llamar la API (CORS), separados por coma | `https://mi-app.netlify.app` |
| `NODE_ENV` | `production` → el servidor sirve `dist/` (minificado) | `production` |

Este proyecto no usa claves secretas de terceros, pero la configuración **igual** va en variables de entorno:
si algún día se añade una clave (una API externa, una base de datos), escribirla en el código y subirla a GitHub
permitiría que cualquiera la copie y la use a nombre mío. Por eso el `.env` está en `.gitignore`
y se sube solo `.env.example` (sin valores reales).

## Cómo cumple cada tema

| Tema | Dónde se ve |
|---|---|
| JavaScript moderno y módulos | 6 módulos `.mjs` con `import/export`; solo `let/const` y `===`; `addEventListener` y **delegación de eventos** (`formulario.mjs`: un listener en cada contenedor sirve para todos los bloques) |
| Node.js y Express | `server.js` + `package.json` (`npm start`); rutas JSON con 200/201/400/403/404; archivos estáticos con `express.static` |
| Cliente-servidor | `api.mjs`: `fetch` + `async/await` + `response.ok` + `try/catch`; mensajes claros al usuario; `API_URL` definida **una sola vez** |
| Seguridad | **XSS:** todo dato del usuario entra al DOM con `textContent`/`createElement`, nunca `innerHTML`. **Validación en el servidor** (`validar.js`). **CORS** restringido por `ALLOWED_ORIGIN`. **Variables de entorno** fuera del repositorio. Además: `x-powered-by` desactivado y límite de 50 KB al JSON |
| Persistencia | `localStorage`: borrador del CV (`cv-borrador`, objeto con `JSON.stringify/parse`) y tema (`cv-tema`). `sessionStorage`: último código guardado (`cv-ultimo-id`) y cargas de la visita (`cv-recargas`). Maneja `null` en la primera visita, no guarda datos sensibles y el botón **Olvidar mis datos** (con doble clic de confirmación) lo borra todo |
| Bootstrap | CDN con versión fija y `integrity`; `meta viewport`; `container-fluid`/`row`/`col-12 col-lg-5 col-xl-4`; componentes (`card`, `btn`, `alert`, `input-group`, `spinner-border`) y utilidades (`d-flex`, `gap-2`, `mb-3`, `d-print-none`…); tema claro/oscuro con `data-bs-theme` |
| UX/UI y accesibilidad | Mensajes de éxito/error/aviso con texto (no solo color) en una región `role="status" aria-live="polite"`; spinner y botón desactivado mientras carga; `label for`/`id` en todos los campos; foco visible de 3 px; operable solo con teclado; microinteracciones (`transition`, `:active`); respeta `prefers-reduced-motion` |
| Git y GitHub | `.gitignore`, README, commits pequeños con mensajes descriptivos |
| Optimización y despliegue | Minificación (`npm run build`), compresión gzip, `loading="lazy"`, caché; informe en `docs/ANALISIS-LIGHTHOUSE.md` |

### Contraste medido (fórmula WCAG; mínimo 4,5 a 1)

| Elemento | Relación |
|---|---|
| Botón `btn-primary` (blanco sobre `#0d6efd`) | 4,50 a 1 |
| Botón `btn-secondary` (blanco sobre `#6c757d`) | 4,69 a 1 |
| Botón `btn-danger` (blanco sobre `#dc3545`) | 4,53 a 1 |
| Texto de la hoja (`#1f2328` sobre blanco) | 15,80 a 1 |
| Títulos plantilla Clásica (`#6b5328` sobre blanco) | 7,26 a 1 |
| Acentos plantilla Moderna (`#156660` sobre blanco) | 6,77 a 1 |
| Contorno de foco, tema claro (`#0a58ca` sobre blanco) / oscuro (`#6ea8fe` sobre `#212529`) | 6,44 / 6,39 a 1 |

> Se evitaron los botones `btn-outline-*`: en tema oscuro quedan en ≈3,3 a 1 (no cumplen).
> Verifícalo tú también con F12 → Inspeccionar → selector de color, o con Lighthouse.

## Despliegue

### Opción A — un solo servicio en Render (la más simple, sin CORS)
1. Sube el proyecto a GitHub (ver abajo).
2. En [render.com](https://render.com): **New → Web Service**, conecta el repositorio.
3. **Build Command:** `npm install && npm run build` · **Start Command:** `node server.js`
4. Render define `PORT` y `NODE_ENV=production`. No necesitas `ALLOWED_ORIGIN` (la página y la API son del mismo sitio).
5. Abre la URL pública y prueba. El plan gratuito se "duerme" tras ~15 min sin uso: la primera petición tarda.

### Opción B — frontend en Netlify/Vercel y backend en Render
1. Despliega el backend en Render como en la opción A y copia su URL (`https://generador-cv-api.onrender.com`).
2. En Render → **Environment**, crea `ALLOWED_ORIGIN` con la URL del frontend (la pondrás en el paso 4).
3. En `public/js/api.mjs` cambia la **única** línea `export const API_URL = "";` por la URL del backend, y haz commit.
4. En Netlify: **Add new site → Import from Git**, **Build command** `npm run build`, **Publish directory** `dist`.
   Copia la URL del sitio y pégala en `ALLOWED_ORIGIN` (paso 2).
5. Prueba: si ves el error de CORS en la consola, la URL de `ALLOWED_ORIGIN` no coincide exactamente (sin `/` al final).

### Subir a GitHub
```bash
git remote add origin https://github.com/TU-USUARIO/generador-cv.git
git branch -M main
git push -u origin main
```
Antes de hacer `git add`, comprueba con `git status` que **no** aparezcan `node_modules/` ni `.env`.

## Cómo probarlo rápido (para la sustentación)

1. Escribe un nombre → la vista previa cambia al instante (delegación de eventos + DOM seguro).
2. Escribe `<img src=x onerror=alert(1)>` en una habilidad → se muestra como texto (XSS prevenido).
3. Recarga la página → el borrador vuelve (localStorage). Cambia el tema → también se recuerda.
4. **Guardar CV en el servidor** → mensaje con un código (POST 201). Con el nombre vacío → error 400 explicado.
5. Pega el código en **Cargar** → el CV vuelve al formulario (GET 200). Un código falso → error 404 explicado.
6. **Olvidar mis datos** (dos clics) → se borra todo y la página vuelve a su estado inicial.
7. F12 → modo dispositivo → 375 px: una sola columna, sin scroll horizontal.
