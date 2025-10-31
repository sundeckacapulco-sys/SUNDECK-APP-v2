# 🧭 Mapa de Arquitectura — Sundeck CRM (Fase 0)

## 1. Estructura general del repositorio
- `client/`: Aplicación React 18. Incluye módulos de Proyectos e Instalaciones, componentes compartidos, hooks propios y servicios de consumo de API. 【F:README_MASTER.md†L98-L134】
  - `src/components/Prospectos/hooks/`: Lógica reutilizable para manejo de piezas y etapas. 【F:client/src/components/Prospectos/hooks/usePiezasManager.js†L1-L120】
  - `src/hooks/`: Hooks globales (`useCotizacionUnificada`, `useEtapaManager`, `useModalEtapasSharedLogic`). 【F:client/src/hooks/useEtapaManager.js†L1-L10】
  - `src/modules/proyectos/`: Componentes y servicios especializados para la experiencia de proyectos (modales de levantamiento y cotización). 【F:client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx†L1-L60】
  - `src/modules/instalaciones/`: Consumo y vistas del flujo de instalaciones, con servicios específicos de API. 【F:client/src/modules/instalaciones/services/instalacionesApi.js†L1-L120】
  - `src/services/`: Utilidades de cálculo, normalización y validación compartidas por los módulos de UI. 【F:client/src/services/calculosService.js†L1-L20】
- `server/`: Backend Node.js + Express + MongoDB. Agrupa modelos Mongoose, controladores REST, servicios de negocio y utilidades de exportación. 【F:README_MASTER.md†L98-L134】
  - `models/`: Definiciones de esquemas principales (`Proyecto`, `Pedido`, `Instalacion`, etc.). 【F:server/models/Proyecto.js†L1-L120】
  - `controllers/`: Endpoints HTTP que orquestan lógica de proyectos, cotizaciones y exportaciones. 【F:server/controllers/proyectoController.js†L1-L80】
  - `services/`: Capa de dominio con normalizadores, generación de PDF/Excel, IA y métricas. 【F:server/services/instalacionesInteligentesService.js†L1-L40】
  - `routes/`, `middleware/`, `config/`, `utils/`: Infraestructura Express (no modificada en esta fase).
- `docs/`: Documentación operativa (nuevo archivo `architecture_map.md`).
- `docschecklists/`, `docs-archivo/`: Archivos históricos, roadmap y checklists por fase. 【F:docschecklists/ROADMAPMASTER.md†L1-L120】
- Archivos raíz: `README_MASTER.md`, `README.md`, `KPIS_SISTEMA.md`, scripts de generación (`generar-pdf.js`, `generar-excel.js`). 【F:README_MASTER.md†L1-L120】

## 2. Modelos clave (`server/models`)
- `Proyecto.js`: Núcleo del dominio. Centraliza datos de cliente, estado del flujo (levantamiento→instalación), levantamientos normalizados, cotización activa y colecciones de medidas/partidas. Referencia a `Cotizacion` y sincroniza totales. 【F:server/models/Proyecto.js†L1-L120】
- `Pedido.js`: Representa la conversión de una cotización aprobada en pedido. Referencia `Cotizacion` y `Prospecto`, controla pagos, estados de fabricación e hitos de entrega. 【F:server/models/Pedido.js†L1-L100】
- `Instalacion.js`: Gestiona programación de cuadrillas, checklist operativo y vínculo con `Pedido` o `Proyecto`. Integra `validacionTecnicaService` para consistencia técnica. 【F:server/models/Instalacion.js†L1-L80】
- Otros modelos relevantes: `Cotizacion`, `Fabricacion`, `ProyectoPedido`, `Usuario`, `Producto`, `KPI`, `Recordatorio`, `Plantilla(WhatsApp)`, `Prospecto` y `ProspectoNoConvertido`. Soportan módulos de ventas, comunicación y postventa. 【F:server/models/Cotizacion.js†L1-L32】【F:server/models/Fabricacion.js†L1-L32】【F:server/models/KPI.js†L1-L32】【F:server/models/PlantillaWhatsApp.js†L1-L32】

## 3. Controladores principales (`server/controllers`)
- `proyectoController.js`: Gestión integral de proyectos (generación de PDF/Excel, normalización de partidas, persistencia de levantamientos y cotizaciones). 【F:server/controllers/proyectoController.js†L1-L120】
- `cotizacionController.js`: CRUD de cotizaciones vinculadas a proyectos y pedidos. 【F:server/controllers/cotizacionController.js†L1-L80】
- `exportacionController.js`: Centraliza exportaciones de reportes y normalizadores para PDF/Excel. 【F:server/controllers/exportacionController.js†L1-L80】
- `proyectoPedidoController.js`: Sincroniza proyectos con pedidos generados (flujo aprobado → fabricación). 【F:server/controllers/proyectoPedidoController.js†L1-L80】

## 4. Hooks relevantes en el frontend
- `usePiezasManager` (`client/src/components/Prospectos/hooks/`): Administra el ciclo de vida de piezas/partidas, validaciones y cálculos de áreas, motorización e instalación especial. Reutilizado en modales de proyectos. 【F:client/src/components/Prospectos/hooks/usePiezasManager.js†L1-L120】
- `useCotizacionUnificada` (`client/src/hooks/`): Orquesta estado de cotizaciones en vivo y sincronización con la API. 【F:client/src/hooks/useCotizacionUnificada.js†L1-L80】
- `useEtapaManager` y `useModalEtapasSharedLogic`: Compartimentalizan lógica de etapas y modales, facilitando reutilización entre prospectos y proyectos. 【F:client/src/hooks/useEtapaManager.js†L1-L60】

## 5. Servicios identificados
### Backend (`server/services`)
- `pdfService.js`, `pdfFabricacionService.js`, `excelService.js`: Generación de documentos para levantamientos, cotizaciones e hitos de fabricación. 【F:server/services/pdfService.js†L1-L40】
- `cotizacionMappingService.js`, `fabricacionService.js`, `sincronizacionService.js`: Normalización de datos y sincronización entre módulos proyecto→pedido→fabricación. 【F:server/services/cotizacionMappingService.js†L1-L40】
- `instalacionesInteligentesService.js`: Motor IA para sugerir cuadrillas, herramientas y tiempos. 【F:server/services/instalacionesInteligentesService.js†L1-L80】
- `kpisInstalacionesService.js`, `metricasComerciales.js`: Capa de métricas y análisis operativo.
- `notificacionesService.js`, `notificacionesComerciales.js`: Integración de avisos internos (correo/WhatsApp).
- `validacionTecnicaService.js`: Validaciones cruzadas para instalaciones, usado desde `Instalacion.js`. 【F:server/models/Instalacion.js†L1-L20】

### Frontend (`client/src/services` y módulos)
- `calculosService.js`, `normalizacionService.js`, `validacionService.js`: Utilidades de cálculo y reglas de negocio reflejadas en UI para mantener paridad con backend. 【F:client/src/services/calculosService.js†L1-L80】
- `cotizacionUnificadaService.js`: Abstracción para enviar cotizaciones en vivo y sincronizar totales. 【F:client/src/services/cotizacionUnificadaService.js†L1-L80】
- `modules/proyectos/services/proyectosApi.js`: Cliente Axios para endpoints de proyectos (levantamientos, cotizaciones, PDF). 【F:client/src/modules/proyectos/services/proyectosApi.js†L1-L80】
- `modules/instalaciones/services/instalacionesApi.js`: Cliente para programación y sugerencias IA de instalaciones. 【F:client/src/modules/instalaciones/services/instalacionesApi.js†L1-L120】

## 6. Relaciones entre módulos principales
- **Proyecto** es el eje central: contiene estado del flujo (`levantamiento`→`cotizacion`→`aprobado`→`fabricacion`→`instalacion`) y almacena levantamientos y cotizaciones normalizadas. 【F:server/models/Proyecto.js†L25-L110】
- **Pedido** se crea cuando una cotización es aprobada; referencia a `Cotizacion` y `Prospecto`, copia productos y controla los hitos de fabricación e instalación. 【F:server/models/Pedido.js†L1-L100】
- **Instalación** puede enlazarse a un `Pedido` o directamente a un `Proyecto`, incorporando programación de equipos y checklist operativo. 【F:server/models/Instalacion.js†L1-L80】
- La transición `Proyecto → Pedido` está coordinada por `proyectoPedidoController.js` y servicios de sincronización, mientras que `instalacionesInteligentesService` alimenta el paso `Pedido/Proyecto → Instalación` con sugerencias automáticas. 【F:server/services/instalacionesInteligentesService.js†L1-L80】
- Frontend mantiene consistencia mediante `usePiezasManager` y servicios de normalización, garantizando que los datos enviados al backend sigan la estructura esperada por los modelos. 【F:client/src/components/Prospectos/hooks/usePiezasManager.js†L1-L120】

## 7. Recomendaciones de logging (Fase 0)
- Adoptar **Winston o Pino** en `server/` con transporte JSON y etiquetas por módulo (`proyecto`, `pedido`, `instalacion`). Inyectar logger en controladores principales (`proyectoController.js`, `proyectoPedidoController.js`, `instalacionesInteligentesService.js`). 【F:server/controllers/proyectoController.js†L1-L80】
- Normalizar eventos de auditoría existentes (`📊 AUDIT` en `proyectoController.js`) para capturar `requestId`, `usuarioId`, `tiempos de ejecución` y `estado de respuesta`.
- Registrar métricas de performance en servicios críticos (generación de PDF/Excel, IA de instalaciones) utilizando middlewares de tiempo y almacenando resultados en colección `Logs` o exportando a dashboard local.
- Agregar logging estructurado en frontend solo para errores críticos (enviar a backend vía endpoint `/api/logs` futuro), evitando saturación de consola en producción.

## 8. KPIs baseline sugeridos
- **Latencia API**: Promedio y p95 por endpoint crítico (`/api/proyectos/:id/levantamiento`, `/api/proyectos/:id/cotizaciones`, `/api/instalaciones/sugerencias`). 【F:README_MASTER.md†L140-L180】
- **Tamaño de documento Mongo**: Medir tamaño de `Proyecto`, `Pedido` e `Instalacion` antes y después de operaciones clave para orientar refactor de Fase 1.
- **Errores 4xx/5xx**: Conteo diario por controlador, destacando validaciones y fallos de generación de documentos.
- **Tasa de conversión**: `Proyectos en cotización` → `Pedidos` → `Instalaciones completadas`, usando datos existentes en modelos para establecer baseline comercial.
- **Capacidad operativa**: Número de instalaciones programadas por semana y ocupación de cuadrillas sugeridas por IA (`instalacionesInteligentesService`). 【F:server/services/instalacionesInteligentesService.js†L1-L80】

> **Próximos pasos**: Con este mapa se puede iniciar la instrumentación de logging estructurado y capturar las métricas baseline exigidas en la Fase 0 del `ROADMAP_MASTER`. 【F:docschecklists/ROADMAPMASTER.md†L40-L80】
