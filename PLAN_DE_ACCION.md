# 📋 Plan de Acción: Sistema CRM Sundeck

Basado en la auditoría del sistema (`docs/auditoria_sistema_actual.md`) y los objetivos de la Fase 4.

**Estado General:** 🟢 En Progreso

---

## ✅ Tareas Completadas

### ✅ ENV-001: Corrección de Configuración y Entorno
**DESCRIPCION:**
El servidor estaba apuntando a una base de datos incorrecta/vacía (`sundeck`) y el archivo `.env` tenía problemas de codificación que impedían cargar `JWT_SECRET`, causando errores 500 en login.
**FECHA:** 25 Nov 2025

### ✅ DATA-001: Integridad de Datos y Limpieza
**DESCRIPCION:**
Existen proyectos con montos en 0 a pesar de tener cotizaciones, y datos "basura" afectando las métricas del dashboard.
**FECHA:** 25 Nov 2025

### ✅ DASH-001: Corrección Dashboard Unificado
**DESCRIPCION:**
Corrección del cálculo de `montoTotal` en `dashboardUnificado.js` para usar una lógica de fallback consistente.
**FECHA:** 25 Nov 2025

### ✅ PROY-001: Bloqueo de Rutas Legacy (ProyectoPedido)
**DESCRIPCION:** 
Se documentaron y bloquearon definitivamente las rutas legacy en `server/routes/proyectoPedido.js` usando un middleware que devuelve 410 Gone.
**FECHA:** 25 Nov 2025

### ✅ EXP-001: Consolidación de Exportaciones
**DESCRIPCION:** 
Se eliminaron rutas de exportación duplicadas (`/pdf`, `/excel`) de `server/routes/proyectos.js`. La lógica ahora está centralizada en `exportacionController.js` y expuesta a través de `/api/exportacion`, reduciendo la deuda técnica.
**FECHA:** 25 Nov 2025

---

## 🚨 Prioridad Alta: Tarea Actual

### KPI-001: Verificación de KPIs de Instalación
**DESCRIPCION:**
Asegurar que los KPIs de instalación lean correctamente los datos de la colección unificada de `Proyectos` (campo `instalacion`) y no de modelos legacy. El endpoint clave a verificar es `GET /api/kpis/operacionales`.

**ARCHIVO_A_REVISAR:** 
`server/routes/kpi.js`

**ACCION_REQUERIDA:**
Analizar el código del endpoint. Si se encuentra que lee de fuentes legacy (ej. `Instalacion.find()`), se debe reemplazar por una agregación sobre `Proyecto.aggregate()` que extraiga las métricas del campo `instalacion` del modelo unificado.

**COMANDO_VERIFICACION:** 
```bash
# Ejecutar el endpoint de KPIs operacionales
curl http://localhost:5001/api/kpis/operacionales
```

**RESULTADO_ESPERADO:** 
Una respuesta JSON con KPIs precisos y consistentes, extraídos exclusivamente del modelo `Proyecto`. Si el endpoint ya es correcto, el resultado esperado es la confirmación de que no se necesitan cambios.

---

## 🗓️ Próximas Tareas

*(Ninguna, `KPI-001` es la última tarea planificada por ahora)*
