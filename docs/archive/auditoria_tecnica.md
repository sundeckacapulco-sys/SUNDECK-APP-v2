# 📋 Auditoría técnica — Sundeck CRM vs ROADMAP_MASTER

## Resumen ejecutivo
- La base funcional del CRM cubre Prospectos, Proyectos, Levantamientos, Cotizaciones, Instalaciones, KPIs operativos y exportaciones PDF/Excel tanto en backend como en frontend.
- Persisten brechas en automatización de Pedidos/Fabricación, uso de IA y observabilidad: el código duplica dominios (`Pedido` vs `ProyectoPedido`), la ruta de fabricación depende de dependencias no importadas y la "IA" devuelve textos simulados. El logging estructurado y las métricas baseline de Fase 0 siguen sin instrumentarse.
- Para alinear la Fase 1 del roadmap se recomienda unificar el modelo operativo alrededor de `Proyecto`, activar un logger centralizado y cerrar la deuda de métricas antes de avanzar hacia reglas automáticas.

## Módulos activos y funcionales ✅
| Módulo | Cobertura actual | Observaciones |
| --- | --- | --- |
| Prospectos | API con filtros, adjuntos y control de permisos en `/api/prospectos`. 【F:server/routes/prospectos.js†L1-L187】 | Hooks y componentes dedicados documentados en el frontend para gestionar piezas y etapas de prospectos. 【F:docs/architecture_map.md†L3-L9】 |
| Proyectos | Endpoints completos (CRUD, sincronización, exportación, levanta-cotiza-fabrica) desde `proyectoController`. 【F:server/routes/proyectos.js†L29-L196】 | UI especializada con listados, filtros y acciones sincronizadas contra la API. 【F:client/src/modules/proyectos/ProyectosList.jsx†L1-L130】 |
| Levantamientos | Persistencia normalizada de partidas y medidas vía `guardarLevantamiento`. 【F:server/controllers/proyectoController.js†L1100-L1144】 | Modales y servicios frontend reutilizan el gestor de piezas del módulo de Prospectos. 【F:docs/architecture_map.md†L3-L9】 |
| Cotizaciones | CRUD con generación de PDF/Excel y conversión desde visitas iniciales. 【F:server/routes/cotizaciones.js†L1-L120】 | Integrado con servicios de cotización unificada en el cliente. 【F:docs/architecture_map.md†L45-L48】 |
| Instalaciones | API para programar, validar y asignar cuadrillas, más flujos derivados de fabricación. 【F:server/routes/instalaciones.js†L37-L155】 | Módulo UI independiente con listado, filtros y navegación a KPIs/calendario. 【F:client/src/modules/instalaciones/InstalacionesList.jsx†L34-L156】 |
| KPIs | Ruta `/api/kpis` consolida dashboard, conversión y pérdidas apoyándose en modelos especializados. 【F:server/routes/kpis.js†L1-L117】 | Documentación de arquitectura recoge servicios y objetivos de métricas. 【F:docs/architecture_map.md†L36-L71】 |
| Exportaciones PDF/Excel | Controlador unificado para validar datos, generar PDF, Excel y paquetes ZIP. 【F:server/routes/exportacion.js†L1-L55】 | Scripts y documentación raíz listan los generadores disponibles. 【F:docs/architecture_map.md†L36-L39】 |

## Módulos parcialmente implementados ⚙️
| Módulo | Brecha detectada | Evidencia |
| --- | --- | --- |
| Pedidos / Proyecto-Pedido | Conviven dos modelos (`Pedido` y `ProyectoPedido`) y dos rutas paralelas para el mismo flujo, lo que duplica estados y aumenta riesgo de divergencia de datos. 【F:server/models/Pedido.js†L1-L158】【F:server/models/ProyectoPedido.js†L1-L120】【F:server/routes/proyectoPedido.js†L20-L84】【F:server/routes/pedidos.js†L11-L195】 |
| Fabricación | La ruta usa `Pedido`, `Fabricacion` y `CotizacionMappingService` sin importarlos, por lo que las altas fallan; depende de logs manuales para depurar. 【F:server/routes/fabricacion.js†L1-L56】【F:server/routes/fabricacion.js†L33-L118】 |
| IA / Automatizaciones | Los endpoints `/api/ai` devuelven textos estáticos simulados y no conectan con modelos reales ni métricas de precisión. 【F:server/routes/ai.js†L6-L78】 |
| Observabilidad (logger + métricas) | Persisten `console.log` en lugar de un logger estructurado y las métricas baseline siguen siendo placeholders. 【F:server/index.js†L42-L181】【F:server/controllers/proyectoController.js†L35-L76】【F:docs/metrics_baseline.md†L1-L57】 |

## Módulos pendientes ❌
| Elemento | Observaciones | Evidencia |
| --- | --- | --- |
| Instrumentación de logs locales | No existe `logger.js` ni carpeta `/logs/`; toda la traza depende de consola a pesar de que la Fase 0 exige logging estructurado. 【F:server/index.js†L42-L181】【F:docschecklists/ROADMAPMASTER.md†L31-L45】 |
| Métricas automatizadas baseline | No hay colección ni pipeline que consuma el `metrics_baseline`; el documento indica valores simulados en espera de instrumentación real. 【F:docs/metrics_baseline.md†L1-L57】 |

## Comentarios y riesgos detectados
- **Duplicidad de dominio**: mantener `Pedido` y `ProyectoPedido` simultáneamente complica el flujo Aprobado→Pedido→Fabricación, aumenta la superficie de bugs y contradice el objetivo de desacoplar el modelo `Proyecto` en Fase 1. 【F:server/models/Pedido.js†L1-L158】【F:server/models/ProyectoPedido.js†L1-L120】
- **Fabricación bloqueante**: la ausencia de imports en `fabricacion.js` impide crear órdenes desde pedidos; además depende de `console.log` para trazas, dificultando observabilidad. 【F:server/routes/fabricacion.js†L1-L118】
- **IA simulada**: el módulo actual no genera insights accionables ni registra precisión; se necesitará rediseñar para cumplir los objetivos de Fase 2. 【F:server/routes/ai.js†L6-L78】
- **Observabilidad incompleta**: el roadmap exige logging ≥70 % y métricas visibles, pero el backend sigue sin logger ni colectores automáticos; solo existen recomendaciones en la documentación. 【F:docschecklists/ROADMAPMASTER.md†L31-L45】【F:docs/architecture_map.md†L58-L71】

## Recomendaciones inmediatas para arrancar Fase 1
1. **Unificación de dominio de pedidos**: seleccionar entre `Pedido` o `ProyectoPedido` y migrar las rutas/servicios para evitar datos duplicados antes de refactorizar `Proyecto`, alineado con el objetivo de desacoplo de Fase 1. 【F:docschecklists/ROADMAPMASTER.md†L48-L62】
2. **Implementar logger estructurado**: crear `server/logger.js` con Winston/Pino e inyectarlo en controladores críticos reemplazando `console.log`, cumpliendo con los entregables de Fase 0 y habilitando métricas de tiempo por endpoint. 【F:docschecklists/ROADMAPMASTER.md†L31-L45】【F:docs/architecture_map.md†L58-L62】
3. **Activar métricas baseline reales**: instrumentar los endpoints clave (`/proyectos/:id/levantamiento`, `/proyectos/:id/cotizaciones`, `/instalaciones/...`) para registrar latencias y tamaños en una colección dedicada, sustituyendo los valores simulados del documento baseline. 【F:docs/metrics_baseline.md†L1-L57】
4. **Corregir módulo de fabricación**: añadir imports faltantes, pruebas y validaciones automáticas para órdenes; posteriormente conectar con el dashboard de Fabricación del frontend. 【F:server/routes/fabricacion.js†L1-L118】【F:client/src/components/Fabricacion/DashboardFabricacion.jsx†L73-L108】
5. **Diseñar IA mínimamente funcional**: definir servicios internos (reglas heurísticas o modelos locales) que produzcan métricas de precisión y registros de entrenamiento, preparando el terreno para la automatización de Fase 2. 【F:server/routes/ai.js†L6-L78】【F:docschecklists/ROADMAPMASTER.md†L66-L83】

