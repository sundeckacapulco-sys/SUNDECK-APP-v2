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

### ✅ PROY-001: Bloqueo de Rutas Legacy (ProyectoPedido)
**DESCRIPCION:** 
Se documentaron y bloquearon definitivamente las rutas legacy en `server/routes/proyectoPedido.js` usando un middleware que devuelve 410 Gone.
**FECHA:** 25 Nov 2025

---

## 🚨 Prioridad Alta: Tarea Actual

### EXP-001: Consolidación de Exportaciones
**DESCRIPCION:** 
Eliminar rutas de exportación duplicadas y dispersas en `server/routes/proyectos.js` que ya han sido centralizadas y mejoradas en `server/controllers/exportacionController.js` (accesibles vía `/api/exportacion`). Esto reduce deuda técnica y asegura que solo se use la lógica de "fuente única de verdad" para generar documentos.

**ARCHIVO:** 
`server/routes/proyectos.js`

**CODIGO_A_ELIMINAR:**
Se deben eliminar los siguientes bloques de código que manejan exportaciones de PDF y Excel de forma redundante:

1. **GET /:id/pdf (Líneas aprox 303-339):**
```javascript
// GET /api/proyectos/:id/pdf - Generar PDF del proyecto
router.get('/:id/pdf', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    // ... lógica antigua ...
  }
);
```

2. **GET /:id/excel (Líneas aprox 341-366):**
```javascript
// GET /api/proyectos/:id/excel - Generar Excel del proyecto
router.get('/:id/excel', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  async (req, res) => {
    // ... lógica antigua ...
  }
);
```

3. **POST /:id/pdf (Líneas aprox 375-399):**
```javascript
// POST /api/proyectos/:id/pdf - Generar PDF del proyecto
router.post('/:id/pdf', 
  // ... lógica antigua ...
);
```

4. **POST /:id/excel (Líneas aprox 401-460):**
```javascript
// POST /api/proyectos/:id/excel - Generar Excel del proyecto
router.post('/:id/excel', 
  // ... lógica antigua ...
);
```

**NOTA:** Mantener la ruta `router.get('/:id/generar-pdf', ...)` (línea 209) y `router.get('/:id/generar-excel', ...)` (línea 216) SOLO si apuntan a controladores diferentes que sean necesarios. Si también son redundantes, confirmar antes de borrar. Por seguridad, en este paso nos enfocaremos en borrar las rutas explícitas `/pdf` y `/excel`.

**COMANDOS_VERIFICACION:** 

1. **Verificar que ruta antigua ya no existe (404):**
```bash
curl -I -X GET http://localhost:5001/api/proyectos/12345/pdf
```
*Resultado esperado: HTTP/1.1 404 Not Found*

2. **Verificar que ruta unificada responde (400 si ID inválido, o 200):**
```bash
curl -I -X GET http://localhost:5001/api/exportacion/proyectos/12345/pdf
```
*(Asumiendo que la ruta de exportación está montada en /api/exportacion/proyectos/:id/pdf - Verificar montaje en index.js si falla)*

**RESULTADO_ESPERADO:** 
Limpieza de aproximadamente 150 líneas de código redundante en `proyectos.js`.

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

