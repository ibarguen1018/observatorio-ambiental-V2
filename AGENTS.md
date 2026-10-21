# CLAUDE.md

Este archivo orienta a Claude Code (claude.ai/code) cuando trabaja con el código de este repositorio.

## Proyecto

Prototipo estático, solo frontend, del **Observatorio Ambiental de Santiago de Cali** (DAGMA / DATIC). HTML + CSS + ES6 sin framework, sin paso de build, sin backend y sin gestor de paquetes. Todos los textos de la interfaz están en español.

## Documentación obligatoria de cada cambio

La documentación del proyecto vive en `Docs.app/`. Cada vez que construyas o cambies algo, en el mismo commit:
- Agrega una entrada **al inicio** de `Docs.app/BITACORA.md` siguiendo el formato que aparece al comienzo de ese archivo: **Qué se hizo**, **Cómo se hizo**, **Funciones** y **Commit**. Mantenla breve.
- Si el cambio altera lo que la app ofrece, actualiza la tabla "Estado actual" de `Docs.app/README.md`.

`README.txt` es el registro histórico anterior a esta carpeta; ya no se actualiza.

La fuente de datos se llama siempre **Centro de Monitoreo Unificado Ambiental (CEMUA)**. Antes se llamaba "SEMO" / "Centro de Monitoreo Ambiental": no vuelvas a usar esos nombres.

## Ejecución y despliegue

- Correr en local: abre `index.html` directamente en Chrome o Edge. No necesita internet: no hay dependencias externas; mapas, imágenes y documentos están en `assets/` y `documentos/`.
- Desplegar: `git push origin main` publica en GitHub Pages en https://ibarguen1018.github.io/observatorio-ambiental-V2/ (repo `ibarguen1018/observatorio-ambiental-V2`, servido desde la raíz de `main`). Pages distingue mayúsculas y minúsculas en los nombres de archivo; la copia local en Windows no. Los PDF de más de 50 MB se guardan con Git LFS (`.gitattributes`). Pages no entrega archivos LFS, así que en `data.js` esos documentos llevan un campo `remote` con su URL de `media.githubusercontent.com`, que `ciudadania.js` usa en lugar de `file` cuando la página no se abre como `file:`. Si agregas otro archivo grande, hazlo igual.
- No hay tests ni linters, y en esta máquina no están instalados Node ni Python. Para detectar errores de JavaScript usa Chrome headless (`C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --dump-dom --virtual-time-budget=6000 file:///.../index.html#<sección>`) sobre una copia que registre un colector de `window.onerror` antes de `ciudadania.js`.

## Estructura de archivos

- `index.html`: shell (barra lateral, topbar con selector de territorio, `<main id="contenido">`, diálogo `#detail`).
- `home.html`, `login.html`, `loguin.html`: solo redirigen a `index.html` (enlaces antiguos).
- `data.js`: define `window.OBS_DATA` con todos los datos (indicadores, mapas, aves, flora, documentos).
- `ciudadania.js`: toda la lógica. `ciudadania.css`: todos los estilos.
- `assets/`: imágenes de mapas. `documentos/`: PDF, Excel y geodatabases originales; no se modifican.
- `LEEME.txt`, `Ajustes_del_prototipo.md`, `Verificacion.txt`: notas de la entrega ciudadana del 2026-10-20.

## Arquitectura de ciudadania.js

Un único script global. La navegación es por hash: `render()` lee `location.hash` (`#inicio`, `#indicadores`, `#mapas`, `#biodiversidad`, `#biblioteca`, `#participa`, `#acerca`, con parámetros opcionales tras `?`), pinta el menú desde el arreglo `nav` y escribe el HTML de la sección en `#contenido`. Se vuelve a llamar en `hashchange` y al cambiar el selector `#territory` (variable `territory`: `comuna22` o `buitrera`).

Cada sección tiene una función que devuelve HTML (`inicio`, `indicators`, `mapas`, `biodiversidad`, `biblioteca`, `participa`, `acerca`) y una función `draw*` que rellena la parte filtrable (`drawIndicators`, `drawMap`, `drawBio`, `drawDocs`, `drawNotes`). Los clics y envíos se manejan con listeners delegados sobre `document` (`data-detail`, `data-page`, `data-biotab`, `#export-*`), registrados una sola vez.

**Datos.** Respeta los criterios de `Ajustes_del_prototipo.md`: no trasladar resultados de Comuna 22 a La Buitrera, no inventar valores ni semáforos para indicadores solo formulados y no presentar los datos como tiempo real. Lo único que persiste son las notas del cuaderno (`localStorage['observatorio-notas-ciudadanas']`), siempre dentro de `try/catch`.
