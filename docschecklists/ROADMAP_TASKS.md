
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

## ⚙️ FASE 0 — Baseline y Observabilidad *(0–1 mes)*

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| Inventario de dependencias (`Proyecto.js`, controladores, hooks) | Core | ⚙️ | Documentar en `/docs/architecture_map.md` |
| Implementar logging estructurado (Winston / Pino) | Server | ❌ | JSON + timestamps |
| Crear carpeta `/logs/` con rotación semanal | Server | ❌ | No requiere cloud |
| Definir KPIs baseline (latencia, errores, tamaño docs) | KPIs | ❌ | Manual o script Python |
| Dashboard de métricas local (console / Datadog Lite) | Core | ❌ | Versión ligera local |
| Establecer naming convention y ownership | Global | ⚙️ | Definir responsables |

---

## 🧱 FASE 1 — Desacoplo y Confiabilidad *(1–4 meses)*

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| Extraer subdocumentos (levantamientos, cotizaciones, pedidos) | DB / Server | ❌ | Crear colecciones independientes |
| Implementar referencias entre colecciones | DB | ❌ | `proyectoId` ↔ `pedidoId` |
| Consolidar motor de validaciones (shared validators) | Client / Server | ⚙️ | Evitar duplicación entre modales |
| Unificar hooks (`usePiezasManager`, `useMedidas`) | Client | ⚙️ | Revisión completa UI |
| Configurar CI/CD con GitHub Actions | DevOps | ⚙️ | Lint + tests unitarios |
| Crear pruebas unitarias básicas (Jest / Mocha) | Server | ❌ | PDF, Excel, Pedidos |
| Actualizar dependencias críticas | Global | ❌ | Probar en rama `dev` primero |

---

## 🤖 FASE 2 — Orquestación y Automatización *(4–8 meses)*

| Tarea | Módulo | Estado | Notas |
|-------|---------|--------|-------|
| Crear `eventBusService.js` local | Server | ❌ | Sustituye Redis/Kafka |
| Implementar motor de reglas | Server | ❌ | Registrar transiciones de estado |
| Diseñar panel operativo en React | Client | ❌ | WebSocket o polling |
| Integrar IA interna (validación de partidas) | IA | ❌ | Reutilizar modelos existentes |
| Crear módulo de recordatorios proactivos | IA / Client | ❌ | Basado en fechas |
| Integrar APM ligero y tracing básico | DevOps | ❌ | Pino + consola |
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

| Categoría | Indicador | Meta | Estado |
|------------|------------|------|--------|
| **Estabilidad** | Uptime servicios críticos | ≥ 99 % | ⚙️ |
| **Rendimiento** | Latencia promedio API | < 1.5 s | ⚙️ |
| **Calidad** | Cobertura de tests | ≥ 80 % | ❌ |
| **Automatización** | Flujo A→P→F automatizado | ≥ 90 % | ❌ |
| **Observabilidad** | Logs + Métricas + Traces | ≥ 85 % | ⚙️ |
| **IA** | Precisión de modelos | ≥ 80 % | ⚙️ |
| **Escalabilidad** | Módulos desacoplados | ≥ 3 | ❌ |
| **Usuarios móviles** | Adopción app | ≥ 60 % | ❌ |

---

> 💬 *Este tablero sirve como control interno de avances del CRM Sundeck.*  
> Marca los progresos por fase y enlaza cada tarea con su commit o issue correspondiente en el repositorio.
