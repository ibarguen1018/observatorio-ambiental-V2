# Bitácora de cambios

Cada vez que se construye o cambia algo en el prototipo se agrega una entrada **al inicio** de esta lista, con este formato:

```
## AAAA-MM-DD · Título corto
**Qué se hizo:** el cambio, en una o dos frases.
**Cómo se hizo:** el enfoque técnico y los archivos tocados.
**Funciones:** lo que el cambio le permite hacer al usuario (y las funciones de código principales).
**Commit:** hash corto
```

---

## 2026-10-11 · Documentación del proyecto
**Qué se hizo:** se creó la carpeta `Docs.app` con un resumen del prototipo y esta bitácora, y se dejó el archivo `AGENTS.md` con la guía técnica para agentes de IA.
**Cómo se hizo:** documentos Markdown en `Docs.app/`; `AGENTS.md` en la raíz del repositorio indica que cada cambio debe registrarse aquí.
**Funciones:** da un punto único para saber qué hay construido, cómo funciona y qué cambió en cada entrega.

## 2026-09-30 · Corrección del Geovisor
**Qué se hizo:** el Geovisor se quedaba colgado al abrirse por un error `Invalid LatLng (NaN, NaN)`.
**Cómo se hizo:** se reprodujo con Chrome headless. La causa era que la estación por defecto se seleccionaba (con `flyTo`) antes de que el mapa tuviera tamaño. Se movió esa selección después de `invalidateSize()`, se añadió un respaldo con `setView()` en `selectGeoStation()` y se libera el mini-mapa del inicio al salir de esa pantalla. Archivo: `app.js`.
**Funciones:** el Geovisor abre y navega sin bloquearse, incluso entrando y saliendo varias veces.
**Commit:** `88cb546`

## 2026-09-30 · Mejoras del inicio del ciudadano (RF-05 a RF-10)
**Qué se hizo:** se implementaron los requerimientos pendientes de las Etapas 2 y 3 del documento de mejoras del home.
**Cómo se hizo:** nuevas funciones en `app.js`, estilos en `styles.css` y dos hojas nuevas (zona y notificaciones) en `login.html` / `loguin.html`. Todas las alertas salen de una sola función, `getActiveAlerts()`.
**Funciones:**
- **RF-05** Mini-mapa de estaciones en el inicio con acceso al mapa completo (`initHomeMiniMap`).
- **RF-06** Buscador de estaciones, trámites y módulos (`wireHomeSearch`).
- **RF-07** "Le puede interesar" priorizado según alertas activas (`contenidoRelevante`).
- **RF-08** Selección de comuna/corregimiento, manual o por ubicación, guardada en el navegador; tarjetas y mapa muestran la zona (`setZona`, `zonaResumen`).
- **RF-09** La campana refleja alertas reales y ofrece notificaciones del navegador (`renderAlertasSheet`, `maybeNotifyCritical`). No es Web Push real: eso requiere backend.
- **RF-10** Capa para consumir la API del CEMUA/IDESC con respaldo a los datos de prueba (`cargarDatosReales`, `fetchConFallback`). La API aún no existe, así que se siguen usando los datos de prueba.
**Commit:** `e9b6f14`

## 2026-09-30 · Cambio de nombre a CEMUA
**Qué se hizo:** "SEMO" y "Centro de Monitoreo Ambiental" pasaron a **Centro de Monitoreo Unificado Ambiental (CEMUA)**.
**Cómo se hizo:** reemplazo de texto en las páginas, `app.js` y `README.txt`.
**Funciones:** nombre institucional correcto en todo el prototipo.
**Commit:** `17618da`

## 2026-09-21 · Versión V2 (base del prototipo)
**Qué se hizo:** primera versión subida al repositorio. Reúne el trabajo anterior descrito en `README.txt`.
**Cómo se hizo:** app de una sola página en `app.js`: `load(id)` pinta cada módulo y `wireModuleInteractions()` conecta los botones; los permisos por rol se aplican con CSS (`data-admin-only`).
**Funciones:**
- Shell móvil tipo app bancaria: saludo, tarjetas de resumen, grilla de módulos, barra inferior y hoja "Más".
- Login con roles Ciudadano (consulta) y Usuario DAGMA (entra directo a Recurso Hídrico).
- Recurso Hídrico: wizard de 6 pasos para registrar y editar visitas (expediente, visita, ubicación con coordenadas, hallazgos, seguimiento, checklist y cierre) e histórico de visitas.
- Alertas de vencimiento de permisos calculadas por fecha (Vigente / Por vencer / Vencido).
- Geovisor con mapa Leaflet y estaciones IoT; portal público con carrusel.
**Commit:** `81e2d3a`
