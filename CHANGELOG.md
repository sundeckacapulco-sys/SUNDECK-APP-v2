# 📝 CHANGELOG - Sundeck CRM

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] - 2025-11-05

### ✅ Fase 4: Consolidación Legacy Completada

#### Agregado
- Script de migración `ejecutarConsolidacionLegacy.js` para migrar ProyectoPedido.legacy → Pedido
- Servicio `syncLegacyService.js` con lógica de sincronización completa
- Script de backup manual `backupCorrecto.js` (alternativa a mongodump)
- Scripts de validación: `pruebasFinales.js`, `verificarDBCorrecta.js`
- Reportes completos de migración en `docs/migraciones/fase4_consolidacion_legacy/`

#### Cambiado
- Modelo `Pedido.js` actualizado con métodos portados desde legacy
- Modelo `KPI.js` con adaptador multi-fuente (legacy + moderno)
- URI de MongoDB actualizada a `sundeck-crm` en scripts de migración
- `AGENTS.md` actualizado con Fase 4 completada
- `ROADMAPMASTER.md` actualizado con Fases 0 y 1 completadas

#### Migrado
- 3 registros de ProyectoPedido.legacy → Pedido moderno
- $12,296.00 validados sin discrepancias
- 3 productos preservados correctamente
- Estructura de datos completa migrada

#### Validado
- 7/7 pruebas pasadas exitosamente
- 0 errores durante migración
- 0 discrepancias en montos
- 100% de datos migrados correctamente

### ⚡ Fase 2.1: Event Bus Service

#### Agregado
- Modelo `Event.js` para persistir eventos de dominio con trazabilidad completa.
- Servicio `eventBusService.js` con registro dinámico de listeners, persistencia y control de errores.
- Listeners automáticos para pedidos, fabricación e instalación (`server/listeners/*`).
- Registro centralizado de listeners en `server/index.js`.
- Tests unitarios para el Event Bus y el `PedidoListener`.

#### Cambiado
- Controladores de cotización, pedido y fabricación emiten eventos críticos (`cotizacion.aprobada`, `pedido.anticipo_pagado`, `fabricacion.completada`).
- Rutas de pedidos reutilizan controlador dedicado y notifican al Event Bus en creaciones manuales.

#### Validado
- Nuevas pruebas Jest: `eventBusService.test.js` y `pedidoListener.test.js`.
- Flujo de aprobación de cotizaciones → pedidos → fabricación → instalación automatizado mediante eventos.

---

## [1.0.0] - 2025-11-04

### ✅ Fase 0: Baseline y Observabilidad Completada

#### Agregado
- Logger estructurado con Winston en todo el sistema
- 32 tests unitarios y de integración
- Documentación completa en `docs/`
- Scripts de mantenimiento y validación

#### Cambiado
- 419 `console.log` migrados a logger estructurado
- Todos los scripts críticos con logging trazable
- Middleware y servicios con validaciones robustas

#### Mejorado
- Observabilidad del sistema al 100%
- Trazabilidad completa de operaciones
- Manejo de errores estandarizado

---

## [0.9.0] - 2025-10-23

### Inicial
- Sistema base de Sundeck CRM
- Módulos: Prospectos, Proyectos, Cotizaciones, Pedidos, Fabricación, Instalaciones
- Frontend: React 18 + Material-UI
- Backend: Node.js + Express + MongoDB
- Autenticación con JWT

---

## Tipos de Cambios

- **Agregado** - Para nuevas funcionalidades
- **Cambiado** - Para cambios en funcionalidades existentes
- **Deprecado** - Para funcionalidades que serán eliminadas
- **Eliminado** - Para funcionalidades eliminadas
- **Corregido** - Para corrección de bugs
- **Seguridad** - Para vulnerabilidades corregidas
- **Migrado** - Para migraciones de datos
- **Validado** - Para validaciones y pruebas

---

**Última actualización:** 5 Noviembre 2025
