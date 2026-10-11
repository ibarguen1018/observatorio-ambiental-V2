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

- Correr en local: abre `index.html` (portal público) o `login.html` (la app) directamente en Chrome o Edge. Se necesita internet: Leaflet carga desde cdnjs y las teselas del mapa desde `server.arcgisonline.com` (Esri). Las teselas de OpenStreetMap se descartaron a propósito porque devuelven 403 para esta app.
- Desplegar: `git push origin main` publica en GitHub Pages en https://ibarguen1018.github.io/observatorio-ambiental-V2/ (repo `ibarguen1018/observatorio-ambiental-V2`, servido desde la raíz de `main`). Pages distingue mayúsculas y minúsculas en los nombres de archivo; la copia local en Windows no.
- No hay tests ni linters, y en esta máquina no están instalados Node ni Python. Para detectar errores de JavaScript en tiempo de ejecución, maneja la app con Chrome headless (`C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --dump-dom --virtual-time-budget=6000 file:///.../harness.html`) usando una copia de `login.html` en una carpeta temporal que registre un colector de `window.onerror` antes de `app.js`, luego llame a `enterApp()` / `load('<módulo>')` y escriba los errores recogidos en el DOM. Los errores lanzados dentro de scripts de cdnjs solo aparecen como "Script error." en `onerror`; envuelve la llamada en `try/catch` para obtener la traza real.

## Estructura de archivos

- `index.html` / `home.html` + `home.js`: portal público (solo el carrusel del hero). Los dos HTML son idénticos salvo el `href` del enlace de la marca.
- `login.html` / `loguin.html` + `app.js`: pantalla de ingreso y toda la app después del login. Los dos HTML deben mantenerse idénticos byte a byte: aplica cada cambio a ambos.
- `styles.css`: compartido por todo. Los estilos del shell móvil post-login están en la sección "APP MÓVIL ESTILO BANCA" (`.phone`, `.m-*`, `.sheet-*`, `.bottom-nav`).

## Arquitectura de app.js

Un único script global; todo es `const`/`function` de nivel superior. Las funciones suelen referirse a datos declarados más abajo en el archivo (por ejemplo, `renderHome` usa `visitasRecursoHidrico`). Esto solo funciona porque nada se ejecuta hasta que el usuario inicia sesión, cuando el archivo ya terminó de cargarse. No llames esas funciones desde el nivel superior.

**Navegación y renderizado.** `load(id)` es el único punto de entrada de navegación. Si `id === 'home'` pinta el inicio del ciudadano (`renderHeader('home')` + `renderHome()`); si no, busca `renderers[id]` (el mapa al final del archivo), que devuelve un string HTML que se inyecta en `#content` con `innerHTML`. Todo renderizado termina con `wireModuleInteractions()`, que vuelve a conectar los eventos sobre el DOM recién creado:
- cualquier elemento con `data-nav="<idDelMódulo>"` navega con `load()`; usa este atributo en vez de escribir manejadores de clic;
- la inicialización propia de cada vista se dispara según el elemento presente (por ejemplo, `#geo-leaflet-map` → `initGeoMap()`, `#home-mini-map` → `initHomeMiniMap()`).

Los listeners de elementos que viven fuera de `#content`/`#m-header` (hojas, modales, `document`) se registran una sola vez en el nivel superior, no dentro de `wireModuleInteractions()`, porque si no se acumulan en cada navegación.

Los módulos se declaran en el arreglo `modules` (id, etiqueta, ícono, `adminOnly`); `visibleModules()` los filtra por rol. Las hojas inferiores (`#sheet-mas`, `#sheet-zona`, `#sheet-alertas`) son marcado estático en `login.html` que se muestra y oculta con el atributo `hidden`.

**Roles.** `state.role` vale `'ciudadano'` o `'dagma'`. Al iniciar sesión, el ciudadano llega a `home` y el usuario DAGMA entra directo a `gestion`. Los permisos se aplican con CSS, no con JS: `enterApp()` pone la clase `role-dagma` o `role-ciudadano` en `#app`, y el marcado usa `data-admin-only` (visible solo para DAGMA), `data-hide-user` y `data-admin-action`.

**Datos.** Todos los datos son arreglos de prueba en memoria (`geoStations`, `expedientesRecursoHidrico`, `visitasRecursoHidrico`, …); nada persiste salvo la zona elegida por el ciudadano (`localStorage['oa_zona']`). `cargarDatosReales()` / `fetchConFallback()` es el punto de conexión con la API real del CEMUA/IDESC: intenta los endpoints documentados y, si fallan, conserva los arreglos de prueba sin avisar (esos endpoints todavía no existen). Al integrar la API, modifica los arreglos existentes en lugar de reasignarlos.

**Inicio del ciudadano (RF-05 a RF-10).** `getActiveAlerts(zona)` es la única fuente de alertas (estaciones críticas o fuera de línea, y permisos cuyo `estadoVigencia()` es "Vencido" o "Por vencer"); alimenta el punto de la campana, la hoja de notificaciones y los chips dinámicos de "Le puede interesar". `stationsInZona()` / `zonaResumen()` alimentan las tarjetas de resumen por zona y el mini-mapa. Las notificaciones usan solo la Notification API del navegador; el Web Push real queda fuera del alcance de este prototipo estático.

**Recurso Hídrico (`gestion`).** Tiene subvistas internas controladas por la variable `gestionView` (`main` / `registrar` / `historico`) y los atributos `data-rh`. El wizard de visitas vuelve a pintar toda la pantalla en cada paso, así que los valores de los campos deben guardarse en `visitaDraft` antes de cada cambio de paso; `visitaEditingId` distingue entre editar y crear. Las fechas de vigencia son strings `dd/mm/aaaa` (`addDaysStr`, `parseDDMMYYYY`, `estadoVigencia`).

**Trampas de Leaflet.** Los mapas se crean justo después de que `innerHTML` inserta su contenedor, cuando todavía no tiene un tamaño medible. Todo lo que dependa del tamaño (`flyTo`, la selección inicial) debe correr después del `invalidateSize()` diferido dentro del `setTimeout`; llamar a `flyTo` de forma sincrónica lanza `Invalid LatLng (NaN, NaN)` y deja la vista colgada. Llama siempre a `.remove()` sobre la instancia existente antes de crear otra (`geoMap`, y `homeMiniMap`, que `load()` también elimina al salir del inicio).
