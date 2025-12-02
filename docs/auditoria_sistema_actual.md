# Auditoría del Sistema y Plan de Acción - 5 Nov 2025

## 1. Resumen Ejecutivo

La auditoría ha revelado una arquitectura de sistema fracturada, resultado de una migración de datos y lógica que no ha sido completada. El sistema opera actualmente con un **doble flujo de datos**, uno "nuevo" centrado en el modelo `Proyecto.js` y uno "legacy" que todavía utilizan componentes críticos como los KPIs, basado en `Pedido.js` y otros modelos antiguos.

Esta situación introduce riesgos significativos, incluyendo la **inconsistencia de datos**, la **duplicación de lógica** y, lo más crítico, el cálculo de **KPIs basados en información incompleta y desactualizada**.

Este documento presenta una radiografía del estado actual y un plan de acción de 3 sprints para unificar el sistema, eliminar la deuda técnica y asegurar la integridad de los datos.

---

## 2. Radiografía del Sistema

### 2.1. Estado de los Componentes Principales

| Área | Componente | Estado | Observaciones |
| :--- | :--- | :--- | :--- |
| **Modelos** | `Proyecto.js` | ✅ **Activo** | Nuevo modelo unificado. Potente pero complejo. Contiene campos legacy. |
| | `Pedido.js` | ⚙️ **Parcial** | Modelo de "instantánea" que no usa los nuevos datos. **Fuente de KPIs.** |
| | `Cotizacion.js` | ✅ **Activo** | Punto de entrada del flujo. Funcional. |
| | `Usuario.js` | ✅ **Activo** | Modelo central para permisos y roles. Estable. |
| | `ProyectoPedido.legacy.js` | ❌ **Deprecado** | Modelo antiguo. **Aún referenciado por código de KPIs.** |
| **Controladores** | `proyectoController.js`| ✅ **Activo** | Gestiona el nuevo flujo de `Proyecto.js`. |
| | `pedidoController.js` | ⚙️ **Parcial** | Lógica duplicada que opera sobre `Pedido.js`. |
| | `proyectoPedidoController.js` | ❌ **Inactivo** | Controlador legacy que evidencia el doble flujo. **Debe ser eliminado.** |
| **Rutas** | `proyectos.js` | ✅ **Activo** | Endpoints para el nuevo flujo. |
| | `pedidos.js` | ⚙️ **Parcial** | Endpoints legacy que alimentan los KPIs. |
| | `kpis.js` | 🔴 **Crítico** | **Lee de la fuente de datos incorrecta (`Pedido.js`).** |
| | `exportacion.js` | 🟡 **Riesgo** | Endpoints de exportación duplicados y inconsistentes. |

### 2.2. Diagrama del Doble Flujo de Datos

```mermaid
graph TD
    subgraph Flujo Nuevo (Moderno)
        A[API: /api/proyectos] --> B(proyectoController)
        B --> C{Proyecto.js}
        C -- Nuevos Módulos --> D((Fabricación, Instalación, etc.))
    end

    subgraph Flujo Legacy (KPIs)
        E[API: /api/pedidos] --> F(pedidoController)
        F --> G{Pedido.js}
        G -- Datos Incompletos --> H((KPIs y Reportes))
    end

    subgraph Conflicto
        C -- ??? --> G
    end

    style H fill:#f77,stroke:#c00,stroke-width:2px
    style G fill:#f77,stroke:#c00,stroke-width:2px
    style F fill:#f77,stroke:#c00,stroke-width:2px
    style E fill:#f77,stroke:#c00,stroke-width:2px
```

---

## 3. Matriz de Riesgos

| Riesgo | Impacto en el Negocio | Probabilidad | Nivel de Riesgo |
| :--- | :--- | :--- | :--- |
| **KPIs Ciegos** | La toma de decisiones estratégicas se basa en datos que no reflejan la realidad operativa. | **Alta** | 🔴 **CRÍTICO** |
| **Doble Flujo de Datos**| Inconsistencia de datos, bugs, y doble trabajo para implementar nuevas funcionalidades. | **Alta** | 🔴 **CRÍTICO** |
| **Dependencias Legacy**| El código es difícil de entender, mantener y evolucionar. Riesgo de errores al tocar código antiguo. | **Media** | 🟡 **MEDIO** |
| **Endpoints Duplicados**| Confusión para los desarrolladores de frontend y posibles inconsistencias en los datos mostrados al usuario. | **Media** | 🟡 **MEDIO** |

---

## 4. Plan de Acción: Sprints de Consolidación

### Sprint 1: Consolidación de Datos y KPIs (Inmediato)
*   **Objetivo:** Corregir la fuente de datos de los KPIs para que reflejen la realidad operativa.
*   **Tareas Clave:**
    1.  **Crear `syncLegacyService.js`:** Un script de un solo uso para sincronizar los datos históricos de `ProyectoPedido.legacy` al nuevo `Pedido.js`, asegurando que no se pierda información.
    2.  **Portar Métodos Legacy:** Mover la lógica esencial (`calcularProgreso`, `agregarNota`, etc.) de `ProyectoPedido.legacy.js` a `Pedido.js` para mantener la compatibilidad de la API existente temporalmente.
    3.  **Actualizar `KPI.js` con Adaptador:** Modificar el modelo de KPIs para que lea directamente del modelo `Proyecto.js`, usando un adaptador para mapear los nuevos campos a la estructura que los KPIs esperan.
*   **Criterio de Éxito:** Los endpoints de KPIs (`/api/kpis/comerciales`, `/api/kpis/operacionales`) devuelven datos precisos y actualizados basados en `Proyecto.js`.

### Sprint 2: Unificación de Endpoints y Controladores
*   **Objetivo:** Centralizar toda la lógica de negocio en el flujo de `Proyecto.js` y eliminar la redundancia.
*   **Tareas Clave:**
    1.  **Consolidar Controladores:** Mover toda la lógica relevante de `pedidoController.js` y `proyectoPedidoController.js` a `proyectoController.js`.
    2.  **Deprecar Rutas Legacy:** Actualizar los archivos de rutas `pedidos.js` y `proyectoPedido.js` para que solo contengan un warning de deprecación y, si es posible, redirijan a los nuevos endpoints en `proyectos.js`.
    3.  **Unificar Exportaciones:** Refactorizar `exportacionController.js` para que utilice únicamente `Proyecto.js` como fuente de datos.
*   **Criterio de Éxito:** Los endpoints de `/api/pedidos` y `/api/proyectopedido` están marcados como deprecados y toda la funcionalidad es accesible a través de `/api/proyectos`.

### Sprint 3: Limpieza Final y Deprecación
*   **Objetivo:** Eliminar por completo el código muerto y los modelos de datos obsoletos.
*   **Tareas Clave:**
    1.  **Eliminar Archivos:** Borrar `pedidoController.js`, `proyectoPedidoController.js`, `pedidos.js`, y `proyectoPedido.js`.
    2.  **Eliminar Modelos Legacy:** Borrar `ProyectoPedido.legacy.js` y `Fabricacion.legacy.js` del proyecto.
    3.  **Auditoría Final:** Realizar una búsqueda global de cualquier referencia restante a los modelos o rutas eliminados y limpiar el código.
*   **Criterio de Éxito:** El proyecto está libre de los modelos y controladores legacy, reduciendo la complejidad y el riesgo de errores.

---

## 5. Comandos Útiles para Implementación

```bash
# Verificar qué archivos todavía importan los modelos legacy
rg "ProyectoPedido.legacy" server/
rg "Fabricacion.legacy" server/

# Listar todos los endpoints de la aplicación (requiere express-list-endpoints)
# npx express-list-endpoints app.js

# Ejecutar el script de sincronización (después de crearlo)
# node server/scripts/syncLegacyService.js

# Probar los endpoints de KPIs después de la modificación
curl http://localhost:5001/api/kpis/comerciales
curl http://localhost:5001/api/kpis/operacionales
```
