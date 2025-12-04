# 🚀 ROADMAP MAESTRO V2 - SUNDECK CRM

**Versión:** 2.2  
**Fecha de Creación:** 24 Nov 2025  
**Última Actualización:** 3 Dic 2025  
**Objetivo:** Aterrizar el CRM con flujo completo funcional antes de activar inteligencia avanzada.

---

## 🔄 ECUACIÓN DE FLUJO PRINCIPAL

```
PROSPECTO → PROYECTO → LEVANTAMIENTO → COTIZACIÓN → PEDIDO → FABRICACIÓN → INSTALACIÓN → COBRO → SATISFACCIÓN
```

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌───────────┐    ┌────────┐
│ PROSPECTO│ → │ PROYECTO │ → │ LEVANTAMIENTO│ → │ COTIZACIÓN│ → │ PEDIDO │
└──────────┘    └──────────┘    └──────────────┘    └───────────┘    └────────┘
     │               │                │                  │               │
   Fotos          Notas          13 campos           Precios        pedidoId
   Notas          Fotos          técnicos            en vivo        fecha compromiso
   Duplicados     Validación     por pieza           PDF/Excel      prioridad
                                                     Acordeones     estado
                                                                          │
     ┌────────────────────────────────────────────────────────────────────┘
     ▼
┌─────────────┐    ┌─────────────┐    ┌───────┐    ┌──────────────┐
│ FABRICACIÓN │ → │ INSTALACIÓN │ → │ COBRO │ → │ SATISFACCIÓN │
└─────────────┘    └─────────────┘    └───────┘    └──────────────┘
      │                  │                │               │
   5 etapas           Fecha           Saldo          Encuesta
   Fotos/etapa        Oficial         Recordatorio   Seguimiento
   Comentarios        Complejidad     Factura        Postventa
   Códigos            Tiempo est.
                      Evidencias
                      Firma cliente
```

---

## 📊 ESTADO ACTUAL POR MÓDULO (3 Dic 2025)

| # | Transición | Estado | % | Faltante Crítico |
|---|------------|--------|---|------------------|
| 1 | Prospecto → Proyecto | ✅ | 90% | Detección duplicados |
| 2 | Proyecto → Levantamiento | ✅ | 95% | Validación automática |
| 3 | Levantamiento → Cotización | ✅ | 90% | Totales unificados, sin duplicidades |
| 4 | **Cotización → Pedido** | ✅ | **100%** | ~~Modelo unificado~~ COMPLETADO |
| 5 | Pedido → Fabricación | ⚠️ | 60% | 5 etapas, fotos, códigos |
| 6 | Fabricación → Instalación | ⚠️ | 50% | Fecha, oficial, firma cliente |
| 7 | Instalación → Cobro → Postventa | ⚠️ | 40% | Saldo, recordatorio, satisfacción |

---

## 🎯 PLAN DE EJECUCIÓN (6 PASOS)

### ✅ PASO 1: UNIFICAR PEDIDO (COMPLETADO 3 Dic 2025)
**Sin esto, nada se mueve.**

**Problema:** Duplicidad `Pedido` vs `ProyectoPedido` vs campos en `Proyecto`

**Solución:**
- [x] Definir modelo único `Pedido` con campos:
  - `numero` (autogenerado: PED-2025-0001)
  - `proyecto` (referencia a Proyecto) ✅ NUEVO
  - `fechaCompromiso` ✅ NUEVO
  - `prioridad` (urgente, alta, media, baja) ✅ NUEVO
  - `origen` (cotizacion_aprobada, directo, renovacion) ✅ NUEVO
  - `estado` (confirmado, en_fabricacion, fabricado, en_instalacion, instalado, entregado)
- [x] Endpoint `POST /api/proyectos/:id/generar-pedido`
- [x] Endpoint `GET /api/proyectos/:id/pedidos`
- [x] Migrar datos existentes → Colección `proyectopedidos` vaciada (3 registros de prueba eliminados)
- [x] Deprecar `ProyectoPedido` → Ruta bloqueada (410 Gone), modelo comentado en KPI.js

**Entregable:** ✅ PASO 1 COMPLETADO AL 100%

---

### 🟠 PASO 2: RECONSTRUIR FABRICACIÓN
**Con las fases y fotos aprobadas.**

**5 Etapas de Fabricación:**
1. **Corte** - Fotos de piezas cortadas
2. **Armado** - Fotos del ensamble
3. **Ensamble** - Fotos del producto armado
4. **Revisión** - Control de calidad
5. **Empaque** - Fotos del empaque final

**Por cada etapa:**
- [ ] Foto obligatoria
- [ ] Comentarios del armador
- [ ] Código interno de pieza
- [ ] Timestamp automático
- [ ] Usuario que registró

**Entregable:** Módulo de fabricación con trazabilidad completa

---

### 🟡 PASO 3: INSTALAR LOGGER + AUDITORÍA
**Para evitar errores ocultos.**

- [ ] Logger estructurado en todos los endpoints críticos
- [ ] Auditoría de cambios de estado
- [ ] Registro de quién hizo qué y cuándo
- [ ] Alertas de errores en tiempo real

**Entregable:** Sistema observable y trazable

---

### 🟢 PASO 4: NORMALIZAR PROYECTO Y COTIZACIÓN
**Todo limpio, bonito, sin duplicidades.**

- [ ] Totales unificados (un solo cálculo)
- [ ] Sin campos duplicados
- [ ] Resumen final siempre correcto
- [ ] PDF/Excel consistentes

**Entregable:** Cotización perfecta al 100%

---

### 🔵 PASO 5: INTEGRAR INSTALACIONES
**Con fotos + firma del cliente.**

- [ ] Fecha programada
- [ ] Oficial asignado
- [ ] Complejidad calculada
- [ ] Tiempo estimado
- [ ] Evidencias fotográficas (antes/después)
- [ ] Firma digital del cliente
- [ ] Checklist de entrega

**Entregable:** Instalación documentada completamente

---

### 🟣 PASO 6: CONSOLIDAR COBRO Y POSTVENTA

- [ ] Registrar saldo pendiente
- [ ] Generar recordatorio automático
- [ ] Registrar satisfacción del cliente
- [ ] Trigger de seguimiento postventa
- [ ] Encuesta de calidad

**Entregable:** Ciclo completo cerrado

---

## 🧩 DESPUÉS DE LOS 6 PASOS → MODO DIOS

**Cuando el CRM esté aterrizado, entonces se activa:**

| Funcionalidad | Descripción |
|---------------|-------------|
| **Eventos Automáticos** | Fabricación terminada → Alerta agendar instalación |
| **KPIs Reales** | Métricas basadas en datos limpios |
| **Indexación** | Búsqueda rápida en todo el sistema |
| **Motor de Reglas** | Automatización de flujos |
| **Planner IA** | Sugerencias inteligentes |
| **Agentes Especializados** | Asistentes por área |

---

## 📊 ESTADO LEGACY (Referencia)

| Área | Estado | Notas |
|------|--------|-------|
| Entorno | ✅ Estable | MongoDB, Backend (5001), Frontend (3000) |
| KPIs | ✅ Unificados | Modelo `Proyecto` como fuente única |
| Panel Alertas | ✅ Nuevo | 4 bloques con pendientes del día |
| Fabricación | ⚠️ Parcial | Estados y botones funcionando |
| PDF Lista Pedido | 🔴 Pendiente | Diagnóstico pendiente |

---

## 🗺️ FASES ESTRATÉGICAS (POST-ATERRIZAJE)

### ⚡ FASE 1: OPTIMIZACIÓN Y UX TOTAL (Duración: 1 Semana)

**Objetivo:** Eliminar toda la deuda técnica visible, completar funcionalidades clave y crear una experiencia de usuario impecable.

- **1.1: Finalizar Optimización de Cortes (90% → 100%):**
  - ✅ **Tarea:** Implementar el algoritmo de optimización 1D para tubos y perfiles.
  - ✅ **Tarea:** Agregar la sección de "Plan de Cortes" al PDF de Orden de Taller.
  - ✅ **Entregable:** PDF con sugerencias claras para minimizar desperdicio de material.

- **1.2: Consolidar Servicios PDF:**
  - 🔴 **Tarea:** Crear `pdfListaPedidoFinalService.js` unificando los 3 servicios actuales.
  - 🔴 **Entregable:** Un único servicio robusto para generar la lista de pedido, eliminando código duplicado.
  - ⚠️ **Bloqueador:** PDF genera contenido ilegible, requiere diagnóstico.

- **1.3: Calculadora de Materiales v1.2:**
  - ✅ **Tarea:** Implementar la UI para gestionar las reglas de la calculadora sin tocar la base de datos.
  - ✅ **Tarea:** Agregar soporte para variables y condiciones más complejas.
  - ✅ **Entregable:** Un panel de administración para la calculadora de materiales.

- **1.4: Integración con Almacén:**
  - ✅ **Tarea:** Conectar el `pdfListaPedidoV3Service.js` con el stock real del almacén.
  - ⏳ **Tarea:** Actualizar el stock automáticamente cuando se genera una orden.
  - ⏳ **Entregable:** Descuento automático de inventario y alertas de stock bajo.

- **1.5: Unificación de KPIs (NUEVO):**
  - 🔴 **Tarea:** Auditar y unificar las 3 fuentes de datos de KPIs.
  - 🔴 **Tarea:** Crear un único servicio `kpiUnificadoService.js`.
  - 🔴 **Entregable:** Dashboards consistentes con fuente única de verdad.

### 🧠 FASE 2: INTELIGENCIA DE PRODUCCIÓN (Duración: 2 Semanas)

**Objetivo:** Transformar el taller de un centro de costos a un centro de eficiencia, usando datos para optimizar cada paso.

- **2.1: Dashboard de Producción en Tiempo Real:**
  - ✅ **Tarea:** Crear un panel que muestre el estado de todas las órdenes en producción.
  - ✅ **Entregable:** KPIs visuales: órdenes en cola, en proceso, completadas, demoradas. Tiempos promedio por etapa.

- **2.2: Algoritmo de Priorización de Órdenes:**
  - ✅ **Tarea:** Desarrollar un sistema que sugiera el orden de fabricación basado en la fecha de entrega, complejidad y disponibilidad de material.
  - ✅ **Entregable:** Una "Cola de Fabricación Inteligente" que optimice el flujo del taller.

- **2.3: Alertas de Producción Proactivas:**
  - ✅ **Tarea:** Generar alertas si una orden se retrasa, si falta material o si un proceso toma más de lo esperado.
  - ✅ **Entregable:** Notificaciones automáticas para el gerente de producción.

### 📈 FASE 3: INTELIGENCIA COMERCIAL Y DE CLIENTES (Duración: 2 Semanas)

**Objetivo:** Dar a los asesores herramientas predictivas para cerrar más ventas y fidelizar a los clientes.

- **3.1: Lead Scoring Predictivo:**
  - ✅ **Tarea:** Crear un algoritmo que califique a los nuevos prospectos (leads) basado en su fuente, tipo de solicitud y datos demográficos.
  - ✅ **Entregable:** Un score (ej. 1-100) en cada prospecto, indicando su probabilidad de compra.

- **3.2: Sugerencias de Up-selling y Cross-selling:**
  - ✅ **Tarea:** Analizar el levantamiento técnico para sugerir mejoras o productos complementarios (ej. "Este cliente pide motorización en 3 de 5 cortinas, ¿ofrecer en las otras 2?").
  - ✅ **Entregable:** Notificaciones inteligentes para el asesor comercial durante la cotización.

- **3.3: Dashboard de Salud del Cliente (Customer Health):**
  - ✅ **Tarea:** Crear una vista 360° del cliente, mostrando su historial de compras, frecuencia, tickets de soporte y satisfacción.
  - ✅ **Entregable:** Un indicador de "Salud del Cliente" (ej. verde, amarillo, rojo) para identificar clientes en riesgo.

### 🔗 FASE 4: ECOSISTEMA CONECTADO (Duración: 1-2 Semanas)

**Objetivo:** Romper las barreras de la aplicación y crear un flujo de comunicación transparente con el exterior.

- **4.1: Portal de Clientes Simplificado:**
  - ✅ **Tarea:** Desarrollar una página web simple donde el cliente pueda ver el estado de su proyecto, descargar su cotización y ver su fecha de instalación.
  - ✅ **Entregable:** Un link único por proyecto para que el cliente consulte el avance.

- **4.2: Integración con Proveedores vía Email:**
  - ✅ **Tarea:** Automatizar el envío de órdenes de compra a proveedores directamente desde la "Lista de Pedido".
  - ✅ **Entregable:** Un botón "Enviar OC a Proveedor" que genere y envíe un email estandarizado con el PDF adjunto.

### 🛠️ FASE 5: AUTO-SERVICIO Y PERSONALIZACIÓN (Duración: 1 Semana)

**Objetivo:** Dar al usuario administrador el poder de adaptar el sistema a sus necesidades sin requerir desarrollo.

- **5.1: Editor de Flujos de Trabajo (Workflows):**
  - ✅ **Tarea:** Crear una interfaz para que el admin pueda definir los `estadoComercial` y las transiciones permitidas.
  - ✅ **Entregable:** Un editor visual de estados y transiciones.

- **5.2: Constructor de Reportes Personalizados:**
  - ✅ **Tarea:** Permitir al usuario seleccionar qué campos quiere ver en la tabla de proyectos y exportarlos a Excel.
  - ✅ **Entregable:** Una interfaz para construir y guardar reportes personalizados.
