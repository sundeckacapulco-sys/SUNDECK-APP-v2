
ROADMAP_MASTER

A brief description of what this project does and who it's for
# 🧭 ROADMAP_MASTER — Sundeck CRM 12 Meses

**Versión:** 1.1  
**Periodo:** Noviembre 2025 → Octubre 2026  
**Alineado con:** `README_MASTER.md`  
**Responsable funcional:** David Rojas  
**Responsable técnico:** Equipo Desarrollo CRM Sundeck  

---

## 🎯 Objetivo General

Consolidar, automatizar y escalar el **Sundeck CRM**, asegurando coherencia con la arquitectura actual (`React 18 + Node/Express + MongoDB`) y los módulos definidos en el `README_MASTER.md`.  

El plan cubre 12 meses divididos en **4 fases secuenciales (F0–F3)** que equilibran estabilidad, automatización y expansión, manteniendo **cero costos externos** y **preparación total para SaaS futuro**.

---

## 🔁 Estructura General del Flujo

> **Levantamiento → Cotización → Aprobado → Pedido → Fabricación → Instalación → Completado**

Cada fase del roadmap fortalece partes específicas de este flujo para alcanzar una operación 100 % trazable, automatizada y escalable.

---

## ⚙️ Fase 0 (0-1 mes) · Baseline y Observabilidad

**Objetivo:**  
Inventariar dependencias, definir métricas base y habilitar trazabilidad mínima en todo el sistema.

**Entregables**
- Inventario completo de dependencias (`Proyecto.js`, controladores, hooks).  
- Logging estructurado (Winston / Pino).  
- Dashboard de observabilidad básico (consola o Datadog Lite local).  
- KPIs baseline: latencia API, tamaño de documentos Mongo, errores 500.  

**Indicadores**
- Endpoints críticos con logging ≥ 70 %.  
- Métricas baseline registradas y visibles.  

---

## 🧱 Fase 1 (1-4 meses) · Desacoplo y Confiabilidad

**Objetivo:**  
Reducir la complejidad del modelo `Proyecto` y unificar validaciones front/back.

**Acciones**
- Extraer subdocumentos (levantamientos, cotizaciones, pedidos) a colecciones referenciadas.  
- Consolidar motor de validaciones y servicios compartidos.  
- Implementar CI/CD (GitHub Actions con lint + pruebas unitarias).  
- Actualizar dependencias críticas (Mongoose 8, Axios 1.6, MUI LTS).  

**Indicadores**
- Reducción ≥ 40 % tamaño promedio de documento `Proyecto`.  
- Cobertura de pruebas ≥ 60 %.  
- CI/CD operativo y estable.  

---

## 🤖 Fase 2 (4-8 meses) · Orquestación y Automatización Inteligente

**Objetivo:**  
Automatizar el flujo **“Aprobado → Pedido → Fabricación”** mediante reglas declarativas y notificaciones locales en tiempo real.

**Acciones**
- Crear `eventBusService.js` local (registro en Mongo en lugar de Redis/Kafka).  
- Motor de reglas (Temporal.io / DSL propio) para transiciones automáticas.  
- Panel operativo en React (WebSocket local o polling cada 5 s).  
- IA operativa con validaciones y recordatorios internos.  
- APM ligero y tracing básico para endpoints críticos.  

**Indicadores**
- Pedidos automatizados ≥ 90 %.  
- Latencia eventos < 5 s.  
- Precisión IA ≥ 80 %.  
- Panel operativo en producción.  

---

## 🚀 Fase 3 (8-12 meses) · Escalamiento y Preparación API-Ready

**Objetivo:**  
Dejar lista la arquitectura modular y multicanal sin incurrir en costos de infraestructura externa.

**Acciones**
- Separar módulos internos (`pedidos`, `fabricacion`, `instalaciones`) como servicios locales con estructura de API interna.  
- Documentar contratos OpenAPI / GraphQL en `/docs/api/` (sin exponer endpoints).  
- Simular gateway local (`gateway.config.js`) para pruebas internas.  
- Preparar app móvil base (React Native / Expo) conectada al backend actual.  
- Crear plantillas ETL en `/scripts/etl` para futuro Data Warehouse.  

**Indicadores**
- Código modular y documentado para cada dominio.  
- Gateway local y contratos listos.  
- App móvil base funcional.  
- Cero costos externos en infraestructura.  

---

## 📊 KPIs Globales

| Categoría | Indicador | Meta |
|------------|------------|------|
| **Estabilidad** | Uptime servicios críticos | ≥ 99 % |
| **Rendimiento** | Latencia promedio API | < 1.5 s |
| **Calidad** | Cobertura de tests | ≥ 80 % |
| **Automatización** | Flujo A→P→F automatizado | ≥ 90 % |
| **Observabilidad** | Logs + Métricas + Traces | ≥ 85 % del stack |
| **IA** | Precisión de modelos | ≥ 80 % |
| **Escalabilidad** | Módulos productivos desacoplados | ≥ 3 |
| **Usuarios móviles** | Adopción app | ≥ 60 % instaladores |

---

## 🔗 Relación con `README_MASTER.md`

| Módulo | Entregables por fase |
|--------|----------------------|
| **Prospectos** | Validaciones globales (F1). |
| **Proyectos** | Refactor Proyecto.js + telemetría (F0–F1). |
| **Pedidos** | Motor de reglas y orquestación (F2). |
| **Fabricación** | Automatización y tracing (F2–F3). |
| **Instalaciones** | IA + app móvil (F3). |
| **KPIs** | Migración a ETL y data warehouse (F3). |

---

## 📅 Seguimiento y Gobernanza

- **Revisión mensual de avance** (sprints de 4 semanas).  
- **Revisión trimestral de arquitectura** con KPIs técnicos.  
- **Versionado** por rama: `main` (estables) / `dev` (por fase).  
- **Checklists por fase** en `/docs/checklists/` con tareas y evidencias.  

---

## 🏁 Resultado Esperado a 12 Meses

- Núcleo estabilizado y observabilidad completa.  
- Flujo **Aprobado → Pedido → Fabricación** totalmente automatizado.  
- Arquitectura modular segura y monitoreada.  
- App móvil funcional + API local lista para expansión.  
- Madurez operativa corporativa: IA versionada, gobernanza de datos y SLA auditables.

---

## 🏗️ Extensión de Producto — “Sundeck CRM SaaS Path”

**Propósito:**  
Transformar progresivamente el CRM actual en un producto vendible por membresía, sin aumentar costos de infraestructura.

| Nivel | Meta | Implementación |
|-------|------|----------------|
| **Nivel 1 (Actual)** | CRM interno 100 % funcional. | Flujo operativo consolidado y UI estable. |
| **Nivel 2 (3–6 meses)** | Multiusuario local. | Campo `tenantId`, login con roles, separación de datos. |
| **Nivel 3 (6–12 meses)** | Membresías básicas. | Gestión de usuarios/planes, activación manual y roles. |
| **Nivel 4 (futuro)** | SaaS comercial completo. | Billing, multi-tenant real, API Gateway e integraciones externas. |

**Notas**
- Mantener arquitectura actual local y sin dependencias externas.  
- Cada nivel debe ser compatible con la versión personal.  
- Preparar documentación de despliegue simplificado (`setup_local.md`) para ofrecer licencias a colegas.  

---

## 💡 Estrategia “Preparado, no desplegado”

El CRM se desarrolla **API-ready y SaaS-ready**, pero sin activar aún servicios pagos o nubes externas.  
Todo el diseño se orienta a **minimizar costos ahora** y **habilitar crecimiento futuro**.

**Principios clave**
1. Lógica interna, sin llamadas API externas.  
2. Endpoints y módulos estructurados como placeholders documentados.  
3. Mensajería, gateways y microservicios definidos pero desactivados.  
4. Simuladores locales (mocks, Mongo) para automatizaciones y pruebas.

---

> 📌 **Este documento es la guía maestra de dirección técnica y comercial del Sundeck CRM.**  
> Toda nueva feature, commit o desarrollo deberá vincularse a su fase (F0–F3) o nivel SaaS correspondiente, para garantizar coherencia y escalabilidad del proyecto.

