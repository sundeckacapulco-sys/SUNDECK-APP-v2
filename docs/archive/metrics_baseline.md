# 📊 Métricas Baseline — Sundeck CRM (Fase 0)

Este documento consolida una primera línea base de métricas operativas para la Fase 0 (Baseline y Observabilidad) del proyecto. Los valores mostrados son simulados y sirven como placeholders hasta contar con instrumentación real.

## 1. Tamaño promedio de documentos MongoDB

| Colección | Promedio (MB) | p95 (MB) | Metodología propuesta |
|-----------|---------------|----------|-----------------------|
| `Proyecto` | 1.8 | 3.1 | Agregar script Mongo (`db.proyectos.aggregate`) que calcule `Object.bsonsize` por documento y consolide estadísticos. |
| `Pedido` | 0.9 | 1.6 | Mismo script reutilizado filtrando por colección `pedidos`. |
| `Instalacion` | 0.6 | 1.2 | Medición vía agregado con `Object.bsonsize` para checklist y notas de instalación. |

> **Acción siguiente**: habilitar tarea cron semanal que registre los resultados en colección `metricas_baseline` o exporte a dashboard (Google Sheets / Metabase).

## 2. Latencia promedio de endpoints

| Endpoint crítico | Promedio (ms) | p95 (ms) | Método de medición |
|------------------|---------------|----------|--------------------|
| `GET /api/proyectos/:id/levantamiento` | 420 | 690 | Middleware Express que anote `process.hrtime` en `res.locals` y envíe métricas a logger `performance`. |
| `POST /api/proyectos/:id/cotizaciones` | 550 | 880 | Instrumentar `cotizacionController` con wrapper de latencia + envío a colección `api_metrics`. |
| `GET /api/instalaciones/sugerencias` | 310 | 560 | Añadir medición alrededor de `instalacionesInteligentesService.obtenerSugerencias`. |
| `POST /api/documentos/pdf` | 780 | 1250 | Registrar inicio/fin en `pdfService` y adjuntar `requestId` para trazabilidad. |

> **Nota**: Los valores incluyen tiempo de red estimado (±50 ms). Se recomienda iniciar pruebas de carga ligeras (k6) para validar.

## 3. Volumen actual de entidades clave

| Entidad | Conteo actual (simulado) | Observaciones |
|---------|--------------------------|---------------|
| Usuarios activos | 48 | Usuarios con último inicio de sesión ≤ 30 días. |
| Proyectos abiertos | 125 | Estados `levantamiento`, `cotizacion` o `aprobado` sin pedido asociado. |
| Pedidos activos | 62 | Pedidos con estado `< completado` y fecha estimada futura. |

> **Siguiente paso**: Crear consulta agregada en `server/services/kpisInstalacionesService.js` para poblar dashboard operativo.

## 4. Tiempos de generación de PDF

| Flujo | Promedio (s) | p95 (s) | Observaciones |
|-------|--------------|---------|---------------|
| PDF de levantamiento (`pdfService`) | 6.2 | 8.4 | Incluir métricas de número de componentes renderizados. |
| PDF de fabricación (`pdfFabricacionService`) | 7.8 | 10.1 | Evaluar caching de imágenes y plantillas Handlebars. |
| PDF de pedido (`excelService`/`pdfService`) | 5.5 | 7.0 | Documentar peso de archivos resultantes para detectar regresiones. |

> **Instrumentación sugerida**: encapsular generadores en helper `withMetrics(label, fn)` que registre duración, tamaño final y errores para la colección `document_metrics`.

## 5. Próximos pasos

1. Activar logger estructurado mencionado en `docs/architecture_map.md` y enviar resultados a `metricas_baseline`.
2. Integrar dashboard provisional en Google Data Studio o Metabase con estos placeholders.
3. Revisar semanalmente las desviaciones versus la línea base para ajustar objetivos de Fase 1.

