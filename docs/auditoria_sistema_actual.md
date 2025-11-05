# 🔍 Auditoría del Sistema CRM Sundeck

**Fecha:** 5 Noviembre 2025
**Versión:** 1.1 (Auditoría Fase 3)
**Responsable:** Agente gpt-5-codex
**Estado:** ✅ Documentación inicial completada

---

## 📊 RESUMEN EJECUTIVO

### Estado General
- **Módulos activos:** Proyectos unificados, Gestión de fabricación, Motor de exportación (PDF/Excel), Instalaciones inteligentes.
- **Módulos parciales:** Cotizaciones (lógica distribuida entre controller y rutas), Pedidos (sin controller dedicado y sin sincronización automática con Proyecto), KPIs (dependen de datos legacy), ProyectoPedido.legacy (deprecado pero aún expuesto vía API).
- **Módulos inactivos:** Fabricacion.legacy (solo compatibilidad), antiguos scripts de exportación reemplazados por exportacionController.
- **Riesgos críticos:** Doble flujo Proyecto vs ProyectoPedido, endpoints duplicados de exportación, servicios de métricas leyendo colecciones legacy.
- **Oportunidades de optimización:** Consolidar endpoints en controllers, retirar rutas legacy tras migrar datos, centralizar cálculos de cotización/pedido sobre Proyecto.

## 📋 Radiografía Completa del Sistema

| Área | Estado | Evidencia clave | Observaciones inmediatas |
| --- | --- | --- | --- |
| **Proyecto** | ✅ Activo | Modelo unificado con métodos inteligentes y logging completo. | Consolida el flujo comercial y operativo; arrays de referencias requieren sincronización con rutas legacy. |
| **Pedido** | ⚙️ Parcial | Modelo moderno pero operado solo desde rutas. | Falta controller dedicado y sincronización con `Proyecto`. |
| **ProyectoPedido.legacy** | ⚠️ Riesgo | Modelo y rutas legacy aún habilitados. | Puede reintroducir divergencias si se usa en paralelo al modelo moderno. |
| **Cotización** | ⚙️ Parcial | Controller especializado solo cubre creación. | Exportaciones y mantenimiento siguen embebidos en rutas. |
| **Instalación** | ✅ Activo | Modelo con numeración automática y métodos de progreso. | Depende de `proyectoId` como `String`; validar integridad al consolidar dominio. |
| **Servicios de exportación** | ✅ Activo | `exportacionController` consume `pdfService`/`excelService`. | Rutas legacy de proyectos siguen exponiendo endpoints duplicados. |
| **KPIs** | ⚙️ Parcial | `KPI.calcularKPIs` consulta colecciones legacy. | Necesita migración hacia métricas basadas en `Proyecto`. |

> _Esta radiografía refleja el estado al 5 de noviembre de 2025 tras la auditoría de Fase 3. Los elementos señalados como ⚙️ o ⚠️ requieren intervención planificada en los sprints propuestos en `CONTINUAR_AQUI.md`._

### Hallazgos Principales
1. **Persisten dos modelos operativos para pedidos** (`Proyecto` y `ProyectoPedido`), con rutas independientes que permiten divergencia de estados y pagos.
2. **Varias rutas contienen lógica compleja inline** (especialmente en `cotizaciones.js` y `pedidos.js`), dificultando reutilización y pruebas; los controllers solo cubren una parte del flujo.
3. **Exportaciones y servicios de métricas tienen implementaciones duplicadas**, coexistiendo endpoints nuevos (`exportacionController`) con versiones heredadas en `proyectos.js`, y KPIs que siguen leyendo del modelo legacy.

---

## 🗂️ AUDITORÍA DE MODELOS

### Proyecto ✅
**Estado:** Activo
**Ubicación:** `server/models/Proyecto.js`
**Líneas:** ~1,240

**Campos Principales:**
- **Cliente y metadatos:** `cliente`, `numero`, `tipo_fuente`, `estado`, fechas de creación/actualización.
- **Levantamiento técnico:** Subdocumentos `levantamiento`, `medidas`, `materiales`, `productos`, galería de `fotos`.
- **Operación unificada:** Bloques estructurados para `cronograma`, `fabricacion`, `instalacion`, `pagos`, `notas` y referencias a otras colecciones (`prospecto_original`, `cotizaciones`, `pedidos`, `ordenes_fabricacion`, `instalaciones`).

**Relaciones:**
- Referencias directas a `Usuario`, `Prospecto`, `Cotizacion`, `Pedido`, `OrdenFabricacion`, `Instalacion`.
- Hooks `pre('save')` generan número secuencial y actualizan `fecha_actualizacion`.

**Métodos y virtuales relevantes:**
- Virtuales `area_total`, `cliente_nombre_completo`, `progreso_porcentaje`.
- Métodos `toExportData`, `generarEtiquetasProduccion()`, `calcularTiempoInstalacion()`, `generarRecomendacionesInstalacion()`, estático `optimizarRutaDiaria()`.

**Observaciones:**
- Consolidación completa del flujo comercial y operativo con campos para programación, costos y evidencias.
- El método `pre('save')` registra eventos con logger estructurado; fallback a timestamp ante fallas.

**Riesgos:**
- Mantiene arrays de referencias (`cotizaciones`, `pedidos`) sin sincronización automática con controladores legacy; riesgo de referencias huérfanas si se opera desde rutas antiguas.

---

### Pedido ⚙️
**Estado:** Parcial
**Ubicación:** `server/models/Pedido.js`

**Campos Principales:** Referencias obligatorias a `Cotizacion` y `Prospecto`, numeración secuencial, estructura financiera (`anticipo`, `saldo`), cronograma (`fechaInicioFabricacion`, `fechaInstalacion`), productos copiados desde cotización y notas/archivos asociados.

**Relaciones:** Referencias a `Usuario` (vendedor, fabricante, instalador), índices por número, estado y vendedor.

**Métodos:** `estaPagado()`, `diasRetraso()`.

**Observaciones:**
- Modelo moderno con plugin de paginación.
- Su flujo se ejecuta desde `routes/pedidos.js` (sin controller dedicado), mezclando lógica de negocio y HTTP.

**Riesgos:**
- Duplicidad de campos respecto a `Proyecto`. La conversión desde cotización rellena estructuras pero no actualiza `Proyecto`, generando posibles divergencias.

---

### ProyectoPedido.legacy ⚠️
**Estado:** ❌ Deprecado (aún expuesto)
**Ubicación:** `server/models/ProyectoPedido.legacy.js`

**Observaciones:**
- Archivo incluye banner `console.warn` y documentación de deprecación.
- Sigue exportando `mongoose.model('ProyectoPedido')` y mantiene hooks/métodos (`agregarNota`, `cambiarEstado`).
- Controladores y rutas específicas (`proyectoPedidoController`, `routes/proyectoPedido.js`) permiten crear, actualizar y gestionar pagos sobre este modelo.

**Riesgos:**
- El mantenimiento paralelo con `Proyecto` habilita entradas duplicadas y métricas inconsistentes.
- KPI.js continúa consultando `ProyectoPedido`, manteniendo dependencia con datos legacy.

---

### Cotización ⚙️
**Estado:** Parcial
**Ubicación:** `server/models/Cotizacion.js`

**Campos Principales:** Referencias a `Prospecto` y `Proyecto`, numeración auto-generada en `pre('save')`, lista de productos enriquecidos (motorización, toldos, medidas), configuraciones de instalación, descuentos, facturación y términos.

**Relaciones:** `elaboradaPor` → `Usuario`; plugin de paginación e índices por `numero`, `estado`, `proyecto`.

**Métodos/Hooks:** Hook `pre('save')` genera consecutivo con logging y fallback.

**Observaciones:**
- Controller dedicado (`crearCotizacion`) concentra validaciones y normalización (usa `CotizacionMappingService` y `ValidacionTecnicaService`).
- Otras operaciones (listar, exportar, archivar, vista previa) permanecen embebidas en `routes/cotizaciones.js`.

**Riesgos:**
- Falta de controller unificado provoca duplicación de lógica para filtros, exportaciones y actualizaciones.

---

### Instalación ✅
**Estado:** Activo
**Ubicación:** `server/models/Instalacion.js`

**Campos Principales:** Referencias opcionales a `Pedido`/`Fabricacion`, `proyectoId` obligatorio, configuración de programación (`instaladores`, `herramientas`, `productos`, `checklist`), evidencias fotográficas y control de tiempos.

**Relaciones:** Hooks `pre('save')` para numeración `INS-YYYY-XXXX`; métodos `calcularProgreso()`, `listaParaEntrega()`, `generarOrdenInstalacion()`, `calcularTiempoTotal()` apoyados en `ValidacionTecnicaService`.

**Observaciones:**
- Datos listos para integrarse con sugerencias inteligentes y validaciones técnicas.

**Riesgos:**
- `proyectoId` almacenado como `String`; dependencias externas deben asegurar consistencia con IDs de `Proyecto`.

---

### Otros Modelos
- **Prospecto ✅:** Activo como origen comercial; incluye scoring (`calcularScore`) y seguimiento (`necesitaSeguimiento`).
- **OrdenFabricacion ✅:** Activo para órdenes derivadas de `Pedido`, con métodos de progreso y control de calidad.
- **Usuario ✅:** Activo para autenticación/permisos; métodos `compararPassword`, `tienePermiso`, `enHorarioTrabajo`.
- **KPI ⚙️:** Parcial; `calcularKPIs` todavía usa `ProyectoPedido`, lo que limita la confiabilidad tras la migración al modelo `Proyecto`.
- **Fabricacion.legacy ❌:** Solo para compatibilidad; no tiene rutas activas en la nueva fase.

---

## 🛣️ AUDITORÍA DE ENDPOINTS

### Proyectos (`server/routes/proyectos.js`)
- `GET /api/proyectos` → `obtenerProyectos` (auth + permisos) ✅
- `GET /api/proyectos/ruta-diaria/:fecha` → `optimizarRutaDiaria` ✅ (usa método estático del modelo)
- `GET /api/proyectos/:id` → `obtenerProyectoPorId` ✅
- `POST /api/proyectos` → `crearProyecto` ✅
- `PUT /api/proyectos/:id` → `actualizarProyecto` ✅
- `PATCH /api/proyectos/:id/estado` → `cambiarEstado` (middleware de transición) ✅
- `DELETE /api/proyectos/:id` → `eliminarProyecto` (soft delete) ✅
- Flujos avanzados: levantamiento (`PATCH /:id/levantamiento`), cotización (`POST /:id/cotizaciones`), sincronización, estadísticas, generación de etiquetas, cálculo de tiempo de instalación.
- **Duplicidad exportación:** Rutas nuevas (`GET /:id/generar-pdf`, `GET /:id/generar-excel`) conviven con endpoints antiguos (`GET/POST /:id/pdf`, `/excel`) que reproducen la lógica dentro del router.
- **Fabricación integrada:** Endpoints delegan en `fabricacionService` (`/fabricacion/iniciar`, `/proceso/:procesoId`, `/control-calidad`, `/empaque`).

### Cotizaciones (`server/routes/cotizaciones.js`)
- `GET /api/cotizaciones` con filtros y paginación (lógica en ruta). ✅
- `POST /api/cotizaciones/desde-visita` genera cotización desde visitas; normaliza piezas manualmente. ✅
- `POST /api/cotizaciones` usa `cotizacionController.crearCotizacion`. ✅
- Exportaciones y vistas previas se gestionan desde las rutas usando `pdfService`/`excelService` sin pasar por controller.
- Varias rutas manejan archivado, duplicado y actualización de estados directamente en el router → estado ⚙️ (parcial).

### Pedidos (`server/routes/pedidos.js`)
- `GET /api/pedidos` con filtros por estado/vendedor (inline). ✅
- `POST /api/pedidos/desde-cotizacion/:cotizacionId` crea pedidos copiando datos de cotización. ✅
- `POST /api/pedidos/aplicar-anticipo/:cotizacionId`, `PUT /api/pedidos/:id/fabricacion`, `PUT /api/pedidos/:id/pagar-saldo`, `POST /api/pedidos/desde-etapa` cubren pagos y actualizaciones de estado. ✅
- **Observación:** No existe `pedidoController`; toda la lógica reside en rutas, dificultando pruebas y reutilización (estado ⚙️).

### ProyectoPedido Legacy (`server/routes/proyectoPedido.js`)
- Rutas completas (`GET`, `POST`, `PATCH`, `POST /pagos`, `PATCH /productos/...`) todavía exponen el modelo deprecado. ⚠️
- Riesgo: operaciones paralelas pueden reintroducir registros legacy.

### Fabricación (`server/routes/fabricacion.js`)
- `GET /cola`, `GET /metricas` → `fabricacionController` ✅
- `POST /desde-pedido/:pedidoId` crea orden de fabricación desde `Pedido`. ✅
- `PATCH /:id/estado` actualiza estado de orden; valida contra lista `ESTADOS_VALIDOS_ORDEN`. ✅

### Exportación (`server/routes/exportacion.js`)
- Endpoints unificados para formatos (`GET /formatos`), vista previa, validación y generación de PDF/Excel/ZIP. ✅
- Recomendación: retirar endpoints duplicados en `routes/proyectos.js` una vez adoptado este módulo.

### Instalaciones (`server/routes/instalaciones.js`)
- Incluye endpoint `POST /sugerencias` que invoca `instalacionesInteligentesService.generarSugerenciasInstalacion`. ✅

---

## 🔧 AUDITORÍA DE SERVICIOS

### FabricacionService (`server/services/fabricacionService.js`)
- Funciones para iniciar fabricación, actualizar procesos, registrar control de calidad y empaque.
- Calcula materiales, procesos y fechas estimadas usando los datos del `Proyecto`.
- Maneja progreso y registra eventos con logger.

### InstalacionesInteligentesService (`server/services/instalacionesInteligentesService.js`)
- Analiza productos del proyecto, complejidad, datos históricos y disponibilidad de cuadrilla para sugerir programación.
- Integra cálculo del modelo `Proyecto.calcularTiempoInstalacion()` y recomendaciones históricas.

### CotizacionMappingService (`server/services/cotizacionMappingService.js`)
- Normaliza productos de cotización/pedido y unifica cálculos de totales.
- Genera payloads para fabricación (`generarPayloadUnificado`).

### ValidacionTecnicaService (`server/services/validacionTecnicaService.js`)
- Evalúa requisitos técnicos por etapa (`validarAvanceEtapa`), genera órdenes de instalación y plantillas de checklist.
- Usado por `cotizacionController` e `Instalacion` para asegurar consistencia.

### Servicios de exportación
- **pdfService:** Genera PDF para proyectos, cotizaciones, levantamientos y paquetes personalizados.
- **excelService:** Produce libros Excel para proyectos y levantamientos con hojas separadas por secciones.
- **exportNormalizer:** Fuente única para vistas previas y paquetes unificados; utilizada por `exportacionController`.

### Otros servicios relevantes
- `notificacionesComerciales.js` y `notificacionesService.js` gestionan recordatorios y envíos (sin cambios recientes, revisar al consolidar flujos).
- `sincronizacionService.js` centraliza sincronizaciones batch con fuentes externas.

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### Levantamiento → Cotización
- **Modelos:** `Prospecto` recopila datos iniciales y agenda visitas; `Proyecto` almacena levantamientos estructurados (`levantamiento.partidas`, `medidas`).
- **Controllers/Rutas:** Proyectos (`PATCH /:id/levantamiento`) normaliza partidas; `cotizacionController.crearCotizacion` o `POST /cotizaciones/desde-visita` generan cotizaciones con validación técnica y totales unificados.
- **Estado:** ✅ Funcional, aunque con lógica repartida.

### Cotización → Pedido
- **Conversión:** `POST /pedidos/desde-cotizacion/:cotizacionId` crea `Pedido` y calcula cronograma base.
- **Paralelo Legacy:** `POST /proyecto-pedido/desde-cotizacion/:cotizacionId` mantiene flujo deprecado. ⚠️
- **Estado:** ⚙️ Parcial por duplicidad y ausencia de sincronización con `Proyecto`.

### Pedido → Fabricación
- **Modernizado:** `fabricacionController.crearOrdenDesdePedido` crea `OrdenFabricacion` y actualiza estado del pedido.
- **Proyecto:** Endpoints en `routes/proyectos.js` permiten iniciar y monitorear fabricación directamente sobre `Proyecto`.
- **Estado:** ✅ Activo; verificar alineación entre orden independiente y bloque `proyecto.fabricacion`.

### Fabricación → Instalación
- **Instalación inteligente:** `instalacionesInteligentesService` genera sugerencias; `Instalacion` registra ejecución con checklist y evidencias.
- **Integraciones:** Métodos del modelo calculan progreso y tiempos reales; garantías y costos documentados.
- **Estado:** ✅ Activo.

---

## ⚠️ RIESGOS IDENTIFICADOS

### Riesgos Priorizados

| Prioridad | Riesgo | Impacto | Recomendación inmediata |
| --- | --- | --- | --- |
| 🔴 Crítica | Doble fuente de verdad para pedidos (`Proyecto`, `Pedido`, `ProyectoPedido`). | Divergencia de estados, pagos y métricas. | Congelar rutas legacy, planificar migración definitiva y sincronizar arrays en `Proyecto`. |
| 🔴 Crítica | Lógica de negocio distribuida en routers (cotizaciones/pedidos). | Alta probabilidad de bugs y dificultad para probar. | Extraer controllers dedicados y compartir validaciones/mapeos desde servicios. |
| 🔴 Crítica | `KPI.calcularKPIs` consume `ProyectoPedido`. | Reportes comerciales inconsistentes tras migración. | Redirigir cálculos a `Proyecto` con adaptador temporal para datos legacy. |
| 🟡 Media | Endpoints duplicados de exportación. | Documentos divergentes y mantenimiento doble. | Consolidar uso de `exportacionController` y retirar rutas heredadas. |
| 🟡 Media | `Instalacion.proyectoId` es `String`. | Riesgo de referencias huérfanas al eliminar proyectos. | Migrar a `ObjectId` y validar relaciones al crear instalaciones. |
| 🟡 Media | Falta de sincronización automática entre arrays (`proyecto.cotizaciones`, `proyecto.pedidos`). | Reportes y vistas pueden quedar desactualizados. | Agregar servicios de sincronización y pruebas de regresión para altas/bajas. |
| 🟢 Baja | Rutas legacy con `console.warn`. | Ruido operativo y riesgo mínimo si se monitorea. | Documentar fecha de retiro y monitorear logs. |
| 🟢 Baja | Servicios de notificaciones desactualizados. | Limitado al equipo interno; no bloquea operación. | Incluir en backlog de documentación y pruebas en sprint de mantenimiento. |

---

## 💡 SUGERENCIAS DE OPTIMIZACIÓN

### Sugerencias Priorizadas

| Horizonte | Acción | Objetivo | Resultado esperado |
| --- | --- | --- | --- |
| Inmediato | Documentar y bloquear rutas `proyectoPedido`. | Evitar nuevas divergencias mientras se migra. | Única fuente de verdad para altas y actualizaciones. |
| Inmediato | Consolidar exportaciones en `exportacionController`. | Eliminar duplicidad de lógica en rutas. | Menor mantenimiento y consistencia en documentos. |
| Corto plazo | Crear controllers dedicados para `pedidos` y extraer lógica de cotizaciones. | Facilitar pruebas unitarias y reutilización. | Flujo comercial consistente y testeable. |
| Corto plazo | Actualizar `KPI.calcularKPIs` para usar `Proyecto`. | Modernizar métricas sin depender de modelos legacy. | Reportería confiable en dashboards existentes. |
| Corto plazo | Sincronizar arrays de `Proyecto` (`cotizaciones`, `pedidos`). | Mantener integridad entre colecciones. | Visualizaciones y reportes siempre actualizados. |
| Largo plazo | Retirar `ProyectoPedido.legacy` y su controller. | Culminar migración al modelo unificado. | Reducción de deuda técnica y riesgos. |
| Largo plazo | Unificar órdenes de fabricación dentro de `Proyecto`. | Simplificar dominio operativo. | Menos duplicidad de estados y procesos. |
| Largo plazo | Documentar y testear servicios de notificaciones/IA. | Garantizar calidad y trazabilidad futura. | Base sólida para automatizaciones posteriores. |

---

## 📊 MÉTRICAS DEL SISTEMA

### Código
- **Modelos:** 19
- **Controllers:** 5 principales (`proyecto`, `cotizacion`, `proyectoPedido`, `fabricacion`, `exportacion`).
- **Routes:** 27 archivos (incluye módulos legacy y utilitarios).
- **Services:** 13 activos.
- **Tests:** 32/32 ✅ (según documentación de fases anteriores).

### Cobertura
- **Controllers con tests:** Fabricación y pedidos cuentan con suites mencionadas; otros controllers carecen de pruebas automatizadas recientes.
- **Services con tests:** `pdfService`, `excelService`, `fabricacionService` documentados con pruebas en fases anteriores.
- **Routes con tests:** No se encontraron pruebas específicas para rutas nuevas en esta fase.

---

## ✅ CONCLUSIONES

### Fortalezas
1. Modelo `Proyecto` concentra el ciclo completo con métodos inteligentes y logging estructurado.
2. Servicios de fabricación e instalación proporcionan cálculos avanzados y sugerencias inteligentes.

### Áreas de Mejora
1. Consolidar lógica dispersa entre rutas y controllers para reducir duplicidad.
2. Retirar gradualmente dependencias del modelo legacy para estabilizar métricas y reportes.

### Próximos Pasos Recomendados
1. Deshabilitar rutas `ProyectoPedido` tras migrar datos a `Proyecto` y `Pedido`.
2. Refactorizar rutas de cotizaciones/pedidos hacia controllers testeables y sincronizados con `Proyecto`.

---

## 📝 NOTAS DEL AUDITOR

- Registrar métricas de adopción tras retirar rutas legacy.
- Verificar con el equipo comercial el impacto de consolidar reportes sobre `Proyecto`.

---

**Fin del Documento - Auditoría Fase 3**
