
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

## ⚙️ Fase 0 (0-1 mes) · Baseline y Observabilidad ✅ COMPLETADA

**Objetivo:**  
Inventariar dependencias, definir métricas base y habilitar trazabilidad mínima en todo el sistema.

**Entregables**
- ✅ Inventario completo de dependencias (`Proyecto.js`, controladores, hooks).  
- ✅ Logging estructurado (Winston implementado).  
- ✅ 419 console.log eliminados y migrados a logger.  
- ✅ KPIs baseline: 32/32 tests pasando.  

**Indicadores**
- ✅ Endpoints críticos con logging 100%.  
- ✅ Métricas baseline registradas y visibles.

**Fecha de Completación:** 4 Nov 2025  

---

## 🧱 Fase 1 (1-4 meses) · Desacoplo y Confiabilidad ✅ COMPLETADA

**Objetivo:**  
Reducir la complejidad del modelo `Proyecto` y unificar validaciones front/back.

**Acciones**
- ✅ Modelo Proyecto.js unificado (1,241 líneas).
- ✅ 4 métodos inteligentes implementados.
- ✅ Consolidación legacy ProyectoPedido → Pedido.
- ✅ Migración de 3 registros exitosa ($12,296 validados).
- ✅ Scripts de migración y validación completos.
- ✅ Modelos legacy deprecados correctamente.

**Indicadores**
- ✅ Reducción lograda en complejidad de documentos.
- ✅ Cobertura de pruebas: 32/32 tests pasando (100%).
- ✅ Migración validada con 0 discrepancias.

**Fecha de Completación:** 5 Nov 2025  

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

## 🏗️ Extensión de Producto — "Sundeck CRM SaaS Path"

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

## 📦 Catálogo de Módulos Rentables

**Modelo de negocio:** Renta por módulos. El cliente paga solo por lo que usa.

### Módulo BASE (Obligatorio)
| Componente | Descripción |
|------------|-------------|
| Autenticación | Login, usuarios, roles básicos |
| Dashboard | Vista principal personalizable |
| Configuración | Datos de empresa, preferencias |
| **Precio sugerido** | Incluido en cualquier plan |

### Módulo PROYECTOS
| Componente | Descripción |
|------------|-------------|
| Cotizaciones | Crear, editar, enviar cotizaciones |
| Proyectos | Gestión de proyectos/pedidos |
| Clientes | Base de datos de clientes |
| Estados | Seguimiento de flujo (Cotizado → Aprobado → etc.) |
| PDFs | Generación de cotizaciones PDF |
| **Dependencias** | Módulo BASE |
| **Archivos clave** | `Proyecto.js`, `Cotizacion.js`, `proyectoController.js` |

### Módulo FABRICACIÓN
| Componente | Descripción |
|------------|-------------|
| Órdenes de producción | Generar órdenes para taller |
| Etiquetas | Etiquetas de producción con QR |
| Optimización de cortes | Tubos, contrapesos, telas |
| Optimización de madera | Galerías con uniones |
| PDFs de taller | Orden completa para fabricación |
| Checklist instalador | Verificación de entrega |
| **Dependencias** | Módulo BASE, Módulo PROYECTOS |
| **Archivos clave** | `pdfOrdenFabricacionService.js`, `optimizadorCortesService.js`, `fabricacionController.js` |

### Módulo ALMACÉN
| Componente | Descripción |
|------------|-------------|
| Inventario | Stock de materiales |
| Sobrantes/Retazos | Gestión de sobrantes útiles |
| Entradas/Salidas | Registro de movimientos |
| Reservas | Reservar material para órdenes |
| Alertas | Notificaciones de stock bajo |
| **Dependencias** | Módulo BASE |
| **Archivos clave** | `SobranteMaterial.js`, `sobrantesService.js`, `sobrantes.js` |

### Módulo INSTALACIONES
| Componente | Descripción |
|------------|-------------|
| Calendario | Programación de instalaciones |
| Rutas | Optimización de rutas diarias |
| Cuadrillas | Asignación de equipos |
| Checklist | Verificación en campo |
| **Dependencias** | Módulo BASE, Módulo PROYECTOS |
| **Archivos clave** | `InstalacionesInteligentesService.js`, `instalaciones.js` |

### Módulo FINANZAS (Futuro)
| Componente | Descripción |
|------------|-------------|
| Pagos | Registro de pagos y abonos |
| Cobranza | Seguimiento de cuentas por cobrar |
| Reportes | Estados financieros básicos |
| **Dependencias** | Módulo BASE, Módulo PROYECTOS |

### Módulo REPORTES/KPIs (Futuro)
| Componente | Descripción |
|------------|-------------|
| Dashboards | Métricas visuales avanzadas |
| Producción | Análisis de tiempos y eficiencia |
| Rentabilidad | Análisis de márgenes por proyecto |
| **Dependencias** | Módulo BASE + módulos de datos |

---

## 🎯 Paquetes Sugeridos para Renta

| Paquete | Módulos incluidos | Caso de uso |
|---------|-------------------|-------------|
| **Básico** | BASE + PROYECTOS | Solo cotizaciones y seguimiento |
| **Taller** | BASE + ALMACÉN + FABRICACIÓN | Solo producción y materiales |
| **Completo** | Todos los módulos | Operación integral |
| **Personalizado** | A elegir | Según necesidad del cliente |

---

## 🔧 Preparación Técnica para Módulos

### Checklist por implementar (Nivel 2):
- [ ] Agregar `tenantId` a todos los modelos
- [ ] Crear modelo `Tenant` (empresa cliente)
- [ ] Crear modelo `ModuloContratado` (módulos activos por tenant)
- [ ] Middleware de verificación de módulo en rutas
- [ ] Menú dinámico según módulos contratados
- [ ] Panel admin para gestionar tenants

### Estado actual de modularidad:
| Área | Estado | Notas |
|------|--------|-------|
| Modelos | ✅ Separados | Cada entidad en su archivo |
| Rutas | ✅ Separadas | `/api/proyectos`, `/api/sobrantes`, etc. |
| Servicios | ✅ Independientes | Lógica encapsulada |
| Frontend | ⚠️ Parcial | Requiere menú dinámico |
| Base de datos | ⚠️ Sin tenantId | Pendiente Nivel 2 |  

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

