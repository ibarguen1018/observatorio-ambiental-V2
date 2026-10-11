# Observatorio Ambiental de Santiago de Cali · Documentación del prototipo

Prototipo móvil del Observatorio Ambiental (DAGMA / DATIC). Es una app web estática: HTML, CSS y JavaScript sin framework ni backend; los datos son de referencia y viven en memoria.

- **Ver la app:** https://ibarguen1018.github.io/observatorio-ambiental-V2/
- **Repositorio:** https://github.com/ibarguen1018/observatorio-ambiental-V2

## Estado actual

| Área | Qué hay hoy |
|---|---|
| Portal público | Página de inicio con carrusel, temas, cifras y observatorios comunitarios. |
| Ingreso | Login con dos roles: **Ciudadano** (consulta) y **Usuario DAGMA** (registra visitas). |
| Inicio del ciudadano | Buscador, resumen por zona, mini-mapa de estaciones, alertas y contenido sugerido. |
| Geovisor | Mapa Leaflet con 14 estaciones IoT, semáforo de estados, capas y búsqueda. |
| Recurso Hídrico | Wizard de 6 pasos para registrar/editar visitas, histórico y alertas de vencimiento de permisos. |
| Otros módulos | Dashboard, Indicadores, Analítica, Reportes, Catálogo, Consulta Ciudadana y Administración (contenido de referencia). |
| Datos | Arreglos de prueba; capa lista para conectar la API del CEMUA/IDESC cuando exista. |

## Documentos de esta carpeta

- [BITACORA.md](BITACORA.md): registro de cada cambio del prototipo, del más reciente al más antiguo, con qué se hizo, cómo se hizo y qué funciones aporta.
