# 📜 Catálogo de scripts (versión inicial)

> Objetivo: tener visibilidad inmediata de qué hace cada script del directorio `server/scripts/`, evitar ejecuciones accidentales y preparar la reorganización por carpetas que acordamos (migraciones, debugging, PDF, etc.).

## 🗂️ Convenciones propuestas

| Carpeta | Alcance | Notas |
| --- | --- | --- |
| `server/scripts/migraciones/` | Migraciones y consolidaciones de datos (ej. `migrarProyectoPedidoAProyecto`) | Se ejecutan previo backup; llevar bitácora en `docs/fase3_consolidacion.md`. |
| `server/scripts/debug/` | Búsquedas, verificaciones puntuales, scripts *ad hoc* (`buscar*`, `ver*`, `debug*`) | Mantener plantillas para conexión y logging. |
| `server/scripts/pdf/` | Generación/validación de PDFs, listas de pedido, ordenes | Útiles para el plan de consolidación de servicios PDF. |
| `server/scripts/datos-prueba/` | Seeders y generadores de data (`crearDatosPrueba*`, `seedData`) | Solo ambientes locales. |
| `server/scripts/legacy/` | Parches ya aplicados (ej. `fixCotizaciones`, `limpiarPreciosProyecto`) | Agregar banner `// LEGACY` y referencia a la tarea original. |

## 📋 Tabla resumida por categoría

### Migraciones y consolidación (mantener vigilados)

| Scripts | Estado | Acción recomendada |
| --- | --- | --- |
| `ejecutarConsolidacionLegacy`, `migrarProyectoPedidoAProyecto`, `migrar_prospectos_a_proyectos`, `validarMigracion`, `validarFlujoTecnicoUnificado` | **Activo** | Mantener en `migraciones/`, documentar insumos y resultados en `docs/fase3_consolidacion.md`. |
| `migrarAProyectos`, `migrarDatos`, `migrarProyectoPedidoAProyecto` (versiones antiguas) | **Legacy** | Revisar duplicidad; mover a `legacy/` si ya se usaron o comparar contra la versión vigente. |

### Auditorías, backups y salud

| Scripts | Estado | Acción recomendada |
| --- | --- | --- |
| `auditoria_colecciones`, `auditoria_dashboard`, `auditoria_dependencias_prospecto` | **Activo** | Integrar a comandos npm (`npm run scripts:audit:*`). |
| `backupCorrecto`, `backupManual` | **Activo** | Estandarizar en un solo script (`backupCorrecto`) e indicar variables `.env`. |
| `verificarDB`, `verificarDBCorrecta`, `verificarDatosDB`, `verificarServidor` | **Duplicado** | Consolidar en `healthcheck.js` con flags `--db`, `--server`, etc. |

### PDF / Lista de pedido / Orden

| Scripts | Estado | Acción recomendada |
| --- | --- | --- |
| `probarPDFOrden`, `generarPDFOrdenTest`, `probarAmbosPDFs`, `probarListaPedidoV2`, `generarPDFListaV3Test`, `generarPDFListaPedidoDirecto`, `validarOrdenProduccionHector`, `validarPDFSugerencias` | **Activo** | Migrar a `scripts/pdf/` y definir runner oficial cuando exista el servicio PDF unificado. |

### Datos de prueba / seeders

| Scripts | Estado | Acción recomendada |
| --- | --- | --- |
| `seedData`, `insertarDatos`, `crearDatosPruebaFlujoTecnico`, `crearProyectosPrueba`, `crearProyectoPrueba`, `crearUsuarioPrueba`, `crearDatosSimple`, `crearProyectoHectorConRotacion` | **Solo local** | Documentar prerequisitos y advertir que no deben correr en producción. |

### Diagnóstico y debugging puntual

| Scripts | Estado | Acción recomendada |
| --- | --- | --- |
| Búsquedas (`buscarHectorTodasColecciones`, `buscarProspecto`, `buscarProyecto`, `buscarPorId`) | **Útiles** | Consolidar en un CLI único `scripts/debug/buscar.js` con parámetros (ej. `--coleccion`, `--query`). |
| Vistas (`verProyectoHector`, `verProyectoCompleto`, `verProyectoPorId`, `verProspectos`, `verDatosReales`) | **Útiles** | Documentar formato de salida y mover a `debug/`. |
| Validaciones puntuales (`corregirFormulaTela`, `verificarFormulaCinta`, `limpiarPreciosProyecto`, `limpiarTotalesProyecto`) | **Legacy** | Si la corrección ya se aplicó, mover a `legacy/` con banner. |
| Scripts `debug*` y `test*` (ej. `debugObservacionesTelas`, `testPieza428`, `testRotacion`) | **En uso esporádico** | Mover a `debug/` y anotar qué módulo depuran. |

### Otros

- `probarSistemaCompleto`, `pruebasFinales`, `smokeTestProspectosUnificados`: corren suites manuales. Definir checklist y mover a `debug/`.
- `plantillasIniciales`, `crearConfiguracionRollerShade`, `inicializarCalculadora`, `inicializarSistemaProduccion`: scripts de setup inicial; mantener en `datos-prueba/` con advertencia “ejecutar una sola vez”.

## ✅ Próximos pasos sugeridos

1. **Mover archivos** según el mapa de carpetas (no se ha hecho para evitar conflictos en pleno desarrollo).
2. **Banners legacy**: añadir a los scripts marcados como Legacy un comentario inicial:
   ```js
   // LEGACY: Script ejecutado el 2025-11-10 para corregir totales.
   // Mantener como referencia, no ejecutar sin aprobación.
   ```
3. **Comandos npm**: usar los nuevos atajos agregados en `package.json` (`npm run scripts:audit:colecciones`, etc.).
4. **Automatizar catálogo**: a futuro se puede generar esta tabla leyendo la carpeta (`node tools/list-scripts.js > docs/scripts_catalogo.md`).

> Esta versión es base; en cuanto reubiquemos archivos, actualizaremos las rutas y añadiremos fecha/owner.
