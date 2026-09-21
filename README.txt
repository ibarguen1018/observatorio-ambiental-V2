OBSERVATORIO AMBIENTAL - PROTOTIPO MÓVIL (estilo app bancaria)
================================================================

NOVEDAD DE ESTA VERSIÓN
Se rediseñó la aplicación (después de iniciar sesión) para verse y
navegarse como una app bancaria de celular (tipo Davivienda):
- Header con saludo ("Hola, [Nombre]") y tarjetas de resumen.
- Un solo "Inicio" con una grilla de íconos: cada ícono es un módulo,
  y basta con tocarlo para entrar (Dashboard, Geovisor, Indicadores,
  Analítica, Recurso Hídrico, Reportes, Catálogo, Consulta Ciudadana,
  Administración de contenido).
- Barra inferior fija (Inicio | Geovisor | Recurso Hídrico | Más).
- "Más" abre una hoja con el resto de los módulos.
- Cada módulo tiene un encabezado con botón "‹" para volver al inicio.

LOGIN CON DOS ROLES
- Ciudadano: entra al inicio (home). Ve todos los módulos en modo de
  consulta; en Recurso Hídrico solo puede "Consultar histórico de
  visitas" (el botón "Registrar visita" queda oculto).
- Usuario DAGMA: entra DIRECTO al módulo "Recurso Hídrico" (no pasa
  por el inicio). Ahí puede tanto registrar visitas técnicas como
  consultar el histórico.

RECURSO HÍDRICO: REGISTRO Y HISTÓRICO DE VISITAS (nuevo)
- "Registrar visita": formulario con fecha, hora, punto de monitoreo,
  tipo de actividad, comuna, técnico responsable, observaciones y un
  campo de evidencia fotográfica (solo visual en este prototipo).
  Al guardar, la visita queda registrada en memoria del navegador
  (no hay backend real) y aparece de inmediato en el histórico.
- "Consultar histórico de visitas": lista todas las visitas
  registradas (las de ejemplo + las que se registren en la sesión),
  con fecha, punto, tipo de actividad, comuna, técnico y observación.
- En producción, esto se reemplaza por un CRUD real contra la API
  del Centro de Monitoreo Ambiental (SEMO).

CÓMO USARLO
1. Abra "login.html" en Chrome o Edge (requiere internet para el
   mapa y los íconos, que se cargan desde CDN/OpenStreetMap-Esri).
2. Elija "Ciudadano" o "Usuario DAGMA" y presione "Ingresar".
3. Navegue tocando los íconos del inicio o la barra inferior.

NOTAS TÉCNICAS
- Todo el shell de navegación se reescribió en app.js: ya no hay
  menú lateral fijo (sidebar); ahora es un contenedor tipo teléfono
  (máx. 460px) con header dinámico + contenido + barra inferior fija.
- Los módulos y su contenido interno (KPIs, tablas, gráficos, mapa)
  se reutilizan de la versión anterior; solo cambió el "shell" que
  los envuelve y la forma de navegar entre ellos.
- El estado de los roles ahora se llama 'ciudadano' / 'dagma' (antes
  'user' / 'admin'); si integran esto con un backend real, mapeen
  estos valores a sus propios roles de autenticación.

ARCHIVOS
- login.html / loguin.html → pantalla de ingreso (idénticas)
- index.html / home.html   → portal público (sin cambios)
- styles.css               → estilos, incluye el nuevo shell móvil
- app.js                   → navegación, roles, módulos y lógica de
                              visitas del recurso hídrico

ACTUALIZACIÓN: FORMULARIO DE VISITA TIPO WIZARD (5 PASOS)
================================================================
Se reemplazó el formulario simple de "Registrar visita" por un
wizard de 5 pasos, adaptado del prototipo de visita ambiental
compartido por el cliente, con la información propia del proyecto:

1. Expediente: selecciona uno de los expedientes/concesiones reales
   del módulo (autocompleta titular, NIT, tipo, comuna y predio;
   todos los campos quedan editables).
2. Información de la visita: fecha, hora, tipo de visita, técnico
   responsable (reutiliza los técnicos ya usados en el proyecto),
   resultado y motivo.
3. Hallazgos y compromisos: permite agregar/eliminar hallazgos
   dinámicamente, con categorías reutilizadas de "Hallazgos más
   recurrentes" del propio módulo.
4. Seguimiento: si la visita requiere seguimiento, captura tipo,
   fecha, responsable y actividad.
5. Evidencias y cierre: adjuntar evidencia (visual en el prototipo),
   observaciones finales y un resumen de todo lo capturado.

El botón "Registrar visita" sigue en el mismo lugar de siempre,
junto a "Consultar histórico de visitas". Cada visita del histórico
ahora tiene un botón "✎ Editar visita" (visible solo para Usuario
DAGMA) que reabre el wizard con los datos precargados y permite
modificarlos; al finalizar, actualiza el registro existente en vez
de crear uno nuevo. El rol Ciudadano solo puede consultar, no
registrar ni editar.

Nota técnica: como el formulario cambia de paso reemplazando todo
el contenido de la pantalla, los valores digitados se guardan en un
objeto en memoria (`visitaDraft`) cada vez que se avanza, retrocede,
o se agrega/elimina un hallazgo, para no perder lo ya escrito.

ACTUALIZACIÓN: REQUERIMIENTOS Y AJUSTES DE RECURSO HÍDRICO
================================================================
A partir de la reunión "Revisión Módulo Recursos Hídrico" (17 de
septiembre de 2026) con el equipo técnico de Recurso Hídrico, se
construyó un documento de requerimientos (ver
Requerimientos_Modulo_Recurso_Hidrico.docx) con la comparación entre
lo que exige el proceso real del equipo y lo que ya tenía el
prototipo. Se incorporaron los siguientes ajustes:

1. El wizard de "Registrar / Editar visita" pasó de 5 a 6 pasos,
   con un nuevo paso "Ubicación y georreferenciación": corriente/río,
   tramo, tipo de cuerpo de agua, nombre del cuerpo de agua,
   corregimiento/barrio/vereda, dirección, y latitud/longitud (con
   botón "Usar mi ubicación actual" vía geolocalización del navegador).

2. Paso "Información de la visita": se agregó número de acta y
   personal de apoyo (acompañantes del técnico responsable).

3. Paso "Checklist, evidencias y cierre": se agregó medida preventiva
   (aplica/no aplica, con nota de que deriva a jurídica), vertimientos
   (sí/no + tipo), cumplimiento de la Franja Protectora (FP), y campo
   de caudal medido en la visita (mostrando el caudal concesionado del
   expediente como referencia).

4. Alertas de vencimiento dinámicas: la tabla "Concesiones y permisos
   de agua" y la sección "Alertas y vencimientos" del módulo ahora
   calculan en tiempo real (Vigente / Por vencer / Vencido) a partir
   de la fecha de vigencia de cada expediente, en lugar de estados fijos.

5. El histórico de visitas muestra todos los campos nuevos: acta,
   río/tramo/cuerpo de agua con coordenadas, caudal medido,
   vertimiento, cumplimiento FP y personal de apoyo.

Pendiente para una siguiente fase (documentado en el punto 7 del
documento de requerimientos): carga real de archivos/fotos a un
servidor, generación automática de acta/informe en PDF, integración
con el sistema de pagos de la TUA, y diferenciación formal de roles
jefe/técnico dentro del módulo.
