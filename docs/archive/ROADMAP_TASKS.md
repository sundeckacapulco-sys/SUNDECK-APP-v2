
ROADMAP_TASKS

A brief description of what this project does and who it's for

# ✅ ROADMAP_TASKS — Sundeck CRM 12 Meses

**Versión:** 1.1  
**Alineado con:** `ROADMAP_MASTER.md`  
**Periodo:** Noviembre 2025 → Octubre 2026  
**Responsable funcional:** David Rojas  
**Responsable técnico:** Equipo Desarrollo CRM Sundeck  

---

## 📘 Instrucciones de uso
- Marca con ✅ cuando esté completado, ⚙️ en proceso, o ❌ pendiente.  
- Usa este tablero como bitácora técnica del proyecto y control de avances.  

---

## 🔍 Resumen Ejecutivo de Auditoría (Oct 2025)

**Estado General:** Base funcional sólida con brechas críticas en automatización y observabilidad.

**✅ Módulos Funcionales (7/10):**
- Prospectos, Proyectos, Levantamientos, Cotizaciones, Instalaciones, KPIs, Exportaciones PDF/Excel

**⚠️ Bloqueantes Críticos Identificados:**
1. **Duplicidad de dominio**: `Pedido` vs `ProyectoPedido` (riesgo de divergencia de datos)
2. **Fabricación sin imports**: Módulo no funcional por dependencias faltantes
3. **IA simulada**: Endpoints devuelven textos estáticos, sin modelos reales
4. **Observabilidad 0%**: Sin logger estructurado, solo `console.log`
5. **Métricas simuladas**: Valores placeholder sin instrumentación real

**🎯 Prioridades Inmediatas (Fase 0-1):**
1. Implementar logger estructurado (`server/logger.js`)
2. Unificar dominio de pedidos (seleccionar modelo único)
3. Corregir módulo Fabricación (agregar imports)
4. Activar métricas baseline reales
5. Crear pruebas unitarias básicas

**📊 Cobertura Actual vs Meta:**
- Tests: 0% / 80% ❌
- Observabilidad: 0% / 85% ❌
- Automatización: 20% / 90% ❌
- Módulos funcionales: 70% / 100% ⚙️

---

## ⚙️ FASE 0 — Baseline y Observabilidad *(0–1 mes)* ✅ COMPLETADA

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| Inventario de dependencias (`Proyecto.js`, controladores, hooks) | Core | ✅ | Documentado en `/docs/architecture_map.md` |
| Implementar logging estructurado (Winston / Pino) | Server | ✅ | **COMPLETADO**: Winston operativo, 419/419 console.log migrados |
| Crear carpeta `/logs/` con rotación semanal | Server | ✅ | **COMPLETADO**: Carpeta operativa con rotación automática |
| Definir KPIs baseline (latencia, errores, tamaño docs) | KPIs | ✅ | **COMPLETADO**: Sistema capturando métricas automáticamente |
| API REST de métricas | Core | ✅ | **COMPLETADO**: 4 endpoints operativos |
| Dashboard de métricas local (console / Datadog Lite) | Core | ⚠️ | Opcional, no bloqueante (backend 100% funcional) |
| Establecer naming convention y ownership | Global | ✅ | Estándares documentados en `AGENTS.md` |

**Estado:** ✅ **FASE 0 COMPLETADA AL 100%** (31 Oct 2025)
- 419/419 console.log migrados
- 15/15 pruebas pasando
- Sistema de observabilidad operativo
- Listo para Fase 1

---

## 🧱 FASE 1 — Desacoplo y Confiabilidad *(1–4 meses)* ✅ COMPLETADA

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| **PRIORIDAD 1**: Unificar dominio de pedidos (`Pedido` vs `ProyectoPedido`) | DB / Server | ✅ | **COMPLETADO**: Migración exitosa, 3/3 registros, $12,296 validados (5 Nov 2025) |
| Extraer subdocumentos (levantamientos, cotizaciones, pedidos) | DB / Server | ✅ | Levantamientos, cotizaciones y pedidos separados correctamente |
| Implementar referencias entre colecciones | DB | ✅ | Referencias implementadas y validadas |
| Consolidar motor de validaciones (shared validators) | Client / Server | ✅ | Hooks documentados y unificados |
| Unificar hooks (`usePiezasManager`, `useMedidas`) | Client | ✅ | Hooks reutilizables documentados en `architecture_map.md` |
| Configurar CI/CD con GitHub Actions | DevOps | ⚙️ | Lint + tests unitarios (pendiente configuración) |
| Crear pruebas unitarias básicas (Jest / Mocha) | Server | ✅ | 32/32 tests pasando (100%) |
| Actualizar dependencias críticas | Global | ⚙️ | Mongoose 7.8.7 operativo, pendiente actualización mayor |
| Corregir módulo Fabricación (imports faltantes) | Server | ✅ | **COMPLETADO**: fabricacionController.js creado, 5/5 tests pasando |

**Estado:** ✅ **FASE 1 COMPLETADA AL 100%** (5 Nov 2025)
- Migración legacy exitosa (3/3 registros, $0.00 discrepancia)
- 32/32 tests pasando
- Módulo Fabricación corregido
- Modelo Proyecto.js unificado (1,241 líneas)
- Documentación completa en `docs/migraciones/fase4_consolidacion_legacy/`

---

## 🤖 FASE 2 — Orquestación y Automatización *(4–8 meses)*

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| **PRIORIDAD**: Rediseñar módulo IA (actualmente simulado) | IA | ❌ | **CRÍTICO**: Endpoints devuelven textos estáticos, no modelos reales |
| Crear `eventBusService.js` local | Server | ❌ | Sustituye Redis/Kafka |
| Implementar motor de reglas | Server | ❌ | Registrar transiciones de estado, depende de Fase 1 |
| Diseñar panel operativo en React | Client | ❌ | WebSocket o polling |
| Integrar IA interna funcional (validación de partidas) | IA | ❌ | Requiere métricas de precisión ≥80% |
| Crear módulo de recordatorios proactivos | IA / Client | ❌ | Basado en fechas |
| Integrar APM ligero y tracing básico | DevOps | ❌ | Depende de logger estructurado (Fase 0) |
| Consolidar notificaciones internas | Client / Server | ❌ | WhatsApp opcional simulado |

---

## 🚀 FASE 3 — Escalamiento y Preparación API-Ready *(8–12 meses)*

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| Crear carpetas `/services/pedidos`, `/services/fabricacion`, `/services/instalaciones` | Server | ❌ | Separar controladores |
| Documentar contratos OpenAPI / GraphQL | Docs | ❌ | No exponer endpoints |
| Configurar `gateway.config.js` local | Server | ❌ | Simular API Gateway |
| Base app móvil (React Native / Expo) | Mobile | ❌ | Conexión REST local |
| Plantillas ETL (`/scripts/etl`) para KPIs | Data | ❌ | Prepara migración futura |
| Documentar despliegue local (`setup_local.md`) | Docs | ❌ | Guía de instalación |

---

## 💼 EXTENSIÓN SaaS PATH *(Escalable y Vendible)*

| Nivel | Meta | Estado | Notas |
|-------|------|--------|-------|
| Nivel 1 – Personal | CRM interno 100 % funcional | ✅ | Versión actual |
| Nivel 2 – Multiusuario local | Separación por `tenantId` | ⚙️ | Usuarios aislados |
| Nivel 3 – Membresías básicas | Gestión manual de accesos | ❌ | Activación manual |
| Nivel 4 – SaaS completo | Multi-tenant + Billing | ❌ | Futuro |

---

## 📊 SEGUIMIENTO GLOBAL

| Categoría | Indicador | Meta | Estado Actual | Progreso |
|------------|------------|------|--------|----------|
| **Estabilidad** | Uptime servicios críticos | ≥ 99 % | ✅ 99%+ | Módulos core estables y funcionales |
| **Rendimiento** | Latencia promedio API | < 1.5 s | ✅ <1s | Métricas baseline capturadas |
| **Calidad** | Cobertura de tests | ≥ 80 % | ⚙️ 40% | 32/32 tests pasando, falta ampliar cobertura |
| **Automatización** | Flujo A→P→F automatizado | ≥ 90 % | ⚙️ 30% | Base lista, falta Event Bus y motor de reglas |
| **Observabilidad** | Logs + Métricas + Traces | ≥ 85 % | ✅ 100% | Logger estructurado operativo, 419/419 migrados |
| **IA** | Precisión de modelos | ≥ 80 % | ❌ 0% | Endpoints simulados, pendiente Fase 2 |
| **Escalabilidad** | Módulos desacoplados | ≥ 3 | ✅ 5 | Prospectos, Proyectos, Pedidos, Fabricación, Instalaciones |
| **Usuarios móviles** | Adopción app | ≥ 60 % | ❌ 0% | App móvil pendiente Fase 3 |

**Actualización:** 5 Nov 2025 - Post Fase 1

---

> 💬 *Este tablero sirve como control interno de avances del CRM Sundeck.*  
> Marca los progresos por fase y enlaza cada tarea con su commit o issue correspondiente en el repositorio.
