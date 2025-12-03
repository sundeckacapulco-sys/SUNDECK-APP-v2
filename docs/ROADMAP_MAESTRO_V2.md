# 🚀 ROADMAP MAESTRO V2 - SUNDECK CRM

**Versión:** 2.1  
**Fecha de Creación:** 24 Nov 2025  
**Última Actualización:** 3 Dic 2025  
**Objetivo:** Transformar la aplicación de un sistema de gestión a una plataforma de inteligencia de negocio, optimizando cada etapa del ciclo de vida del cliente.

---

## 📊 ESTADO ACTUAL DEL PROYECTO

| Área | Estado | Notas |
|------|--------|-------|
| Entorno | ✅ Estable | MongoDB, Backend (5001), Frontend (3000) funcionando |
| KPIs | ⚠️ Inconsistente | 3 fuentes de datos diferentes, requiere unificación |
| PDF Lista Pedido | 🔴 Pendiente | Generación ilegible, diagnóstico pendiente |
| Migración Legacy | ⏳ Pendiente | Fase 4 de consolidación |

---

## 🎯 VISIÓN GENERAL

El Roadmap V2 se enfoca en 5 pilares estratégicos, distribuidos en 5 fases:

1.  **⚡ Fase 1: Optimización y UX Total:** Finalizar lo pendiente y refinar la interfaz para una eficiencia máxima.
2.  **🧠 Fase 2: Inteligencia de Producción:** Automatizar y optimizar el taller para reducir costos y tiempos.
3.  **📈 Fase 3: Inteligencia Comercial y de Clientes:** Predecir ventas y entender el comportamiento del cliente.
4.  **🔗 Fase 4: Ecosistema Conectado:** Integrar la app con proveedores y clientes para una comunicación fluida.
5.  **🛠️ Fase 5: Auto-Servicio y Personalización:** Empoderar al usuario para que configure el sistema a su medida.

---

## 🔥 PRIORIDAD INMEDIATA (3 Dic 2025)

### 🔴 Unificar Fuentes de Datos KPIs
**Problema detectado:** El sistema tiene 3 endpoints diferentes calculando KPIs con modelos distintos:
- `/proyectos/kpis/comerciales` → Modelo `Proyecto`
- `/kpis/dashboard` → Modelos `Pedido` + `Prospecto`
- `/kpis/conversion` → `kpiController`

**Acción requerida:**
1. Definir modelo canónico (¿`Proyecto` o `Pedido`+`Prospecto`?)
2. Unificar cálculos en un solo servicio
3. Deprecar endpoints redundantes

---

## 🗺️ FASES DEL PROYECTO

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
