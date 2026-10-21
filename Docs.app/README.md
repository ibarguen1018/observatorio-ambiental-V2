# Observatorio Ambiental de Santiago de Cali · Documentación del prototipo

Prototipo de consulta ciudadana del Observatorio Ambiental (Comuna 22 y La Buitrera). Es una app web estática: HTML, CSS y JavaScript sin framework ni backend; los datos provienen de los documentos del proyecto 2025.

- **Ver la app:** https://ibarguen1018.github.io/observatorio-ambiental-V2/
- **Repositorio:** https://github.com/ibarguen1018/observatorio-ambiental-V2

## Estado actual

| Área | Qué hay hoy |
|---|---|
| Acceso | Directo, sin login ni roles. Selector de territorio: **Comuna 22** o **corregimiento La Buitrera**. `home.html`, `login.html` y `loguin.html` redirigen a `index.html`. |
| Inicio | Resumen del territorio, cifras principales y accesos por tema. |
| Indicadores | Comuna 22: 7 indicadores con resultados. La Buitrera: 111 fichas formuladas en 10 componentes. Filtros, fichas de detalle y descarga CSV. |
| Mapas del territorio | Atlas con 21 mapas originales, cortes temporales, zoom y descarga. |
| Biodiversidad | Registros del anexo de aves (212 filas) y plantas de importancia, con filtros y CSV. |
| Biblioteca | PDF, Excel y geodatabases originales del proyecto 2025, con búsqueda y filtro por formato. |
| Participa y aprende | Cuaderno de notas personales guardado en el navegador, descarga JSON y glosario. |
| Datos | `data.js` con la información de los documentos del proyecto 2025; sin conexión a CEMUA, IDESC ni sensores. Funciona sin internet. |

## Documentos de esta carpeta

- [BITACORA.md](BITACORA.md): registro de cada cambio del prototipo, del más reciente al más antiguo, con qué se hizo, cómo se hizo y qué funciones aporta.
