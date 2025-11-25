# 📋 Plan de Acción: Sistema CRM Sundeck

Basado en la auditoría del sistema (`docs/auditoria_sistema_actual.md`) y los objetivos de la Fase 4.

**Estado General:** 🟢 En Progreso

---

## ✅ Tareas Completadas

### ✅ ENV-001: Corrección de Configuración y Entorno
**DESCRIPCION:**
El servidor estaba apuntando a una base de datos incorrecta/vacía (`sundeck`) y el archivo `.env` tenía problemas de codificación que impedían cargar `JWT_SECRET`, causando errores 500 en login.
**ACCIONES REALIZADAS:**
- Se forzó la carga explícita del `.env` desde la raíz en `server/index.js`.
- Se corrigió `MONGODB_URI` para apuntar a `sundeck-crm`.
- Se regeneró el archivo `.env` limpio.
**FECHA:** 25 Nov 2025

### ✅ DATA-001: Integridad de Datos y Limpieza
**DESCRIPCION:**
Existen proyectos con montos en 0 a pesar de tener cotizaciones, y datos "basura" afectando las métricas del dashboard.
**ACCIONES REALIZADAS:**
- Script `fix_proyectos_totales.js`: Sincronizó totales de proyectos (Hector Huerta, Luis Bello) con sus cotizaciones vinculadas.
- Script `limpiar_proyectos.js`: Eliminó 7 proyectos basura, conservando solo los 2 validados.
- Verificación de suma total en Dashboard: **$90,412.81** (Correcto).
**FECHA:** 25 Nov 2025

### ✅ DASH-001: Corrección Dashboard Unificado
**DESCRIPCION:**
Corrección del cálculo de `montoTotal` en `dashboardUnificado.js`. Ahora utiliza una lógica de fallback:
1. Prioriza `proyecto.total` (Nivel raíz).
2. Si es 0, usa `cotizacionActual.totales.total`.
**FECHA:** 25 Nov 2025

### ✅ PROY-000: Bloqueo de Rutas Legacy (Index)
**DESCRIPCION:**
Se bloquearon rutas obsoletas en `server/index.js` para evitar divergencia de datos.
- Bloqueada: `/api/dashboard` (Legacy) -> Usar `/api/dashboard/unificado`
- Comentario explicativo agregado en rutas de prospectos.
**FECHA:** 25 Nov 2025

---

## 🚨 Prioridad Alta: Tarea Actual

### PROY-001
**DESCRIPCION:** 
Documentar y bloquear definitivamente las rutas legacy en `server/routes/proyectoPedido.js`. Aunque se retiró del index, el archivo sigue existiendo y podría ser importado o usado incorrectamente. Se reemplazará su contenido con un middleware que devuelva un error 410 Gone explícito.

**ARCHIVO:** 
`server/routes/proyectoPedido.js`

**CODIGO_A_REEMPLAZAR:**
*(Todo el contenido del archivo)*

**CODIGO_NUEVO:**
```javascript
const express = require('express');
const logger = require('../config/logger');
const router = express.Router();

/**
 * 🚫 RUTA OBSOLETA (LEGACY)
 * Bloqueada permanentemente el 25 Nov 2025 como parte de la Fase 4.
 * Esta ruta causaba divergencia de datos al mantener un flujo paralelo de proyectos.
 * 
 * Nueva implementación:
 * - Usar endpoints de /api/proyectos para toda la gestión de proyectos.
 * - Usar modelo unificado server/models/Proyecto.js
 */

router.use((req, res) => {
  logger.warn('Intento de acceso a ruta obsoleta: proyectoPedido', {
    method: req.method,
    url: req.originalUrl,
    usuario: req.user?.id || 'anonimo',
    ip: req.ip
  });

  return res.status(410).json({
    error: 'Ruta obsoleta (410 Gone)',
    mensaje: 'El endpoint /api/proyecto-pedido ha sido desactivado permanentemente.',
    recomendacion: 'Utilice los endpoints de /api/proyectos para gestionar proyectos unificados.',
    fecha_bloqueo: '2025-11-25'
  });
});

module.exports = router;
```

**COMANDO_VERIFICACION:** 
```bash
# Intentar acceder a la ruta bloqueada (debe devolver 410)
curl -I -X GET http://localhost:5001/api/proyecto-pedido
```

**RESULTADO_ESPERADO:** 
Código de estado HTTP **410 Gone**.

---

## 🗓️ Próximas Tareas

### 🚀 EXP-001: Consolidación de Exportaciones
**DESCRIPCION:**
Actualmente hay lógica de exportación dispersa. El objetivo es consolidar todo en `exportacionController` y eliminar rutas duplicadas en `proyectos.js`.
**PRIORIDAD:** Alta
**ESTADO:** Pendiente

### 🚀 KPI-001: Verificación de KPIs de Instalación
**DESCRIPCION:**
Asegurar que los KPIs de instalación lean correctamente los datos de la colección unificada de `Proyectos` (campo `instalacion`) y no de modelos legacy.
**PRIORIDAD:** Media
**ESTADO:** Pendiente

