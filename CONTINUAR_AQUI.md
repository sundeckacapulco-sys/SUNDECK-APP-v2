# 🚀 CONTINUAR AQUÍ - Completar Logging

**Fecha:** 31 Oct 2025  
**Estado:** Sprint 1 y 2 completados → Archivos críticos ✅ COMPLETADOS (pdfService + controladores)

---

## ✅ COMPLETADO

### Sprint 1: Logger Estructurado ⚠️ EN PROGRESO
- ✅ Winston Logger implementado
- ⚠️ 187/419 console.log reemplazados (44.6%) ⬆️ +8.1%
- ✅ Archivos críticos: 100% ✅
- ✅ **pdfService.js: 100% migrado (28 console.log → 0)** 🎉
- ✅ **cotizacionController.js: 100% migrado (5 console.log → 0)** 🎉
- ✅ **exportacionController.js: 100% migrado (3 console.log → 0)** 🎉

### Sprint 2: Métricas Baseline ✅ BACKEND COMPLETO
- ✅ Modelo Metric
- ✅ Middleware de métricas
- ✅ API REST (4 endpoints)
- ✅ 15/15 tests pasando

**Fase 0:** 74% completada ⬆️ +3%

---

## 🎯 TAREA ACTUAL: Completar console.log Restantes

### Objetivo
Reemplazar los 232 console.log restantes en archivos no críticos para completar la migración al logger estructurado.

### Archivos Completados ✅

**Prioridad Alta (36 console.log):**
1. ✅ ~~`server/services/pdfService.js` - 28 console.log~~ **COMPLETADO** 🎉
2. ✅ ~~`server/controllers/cotizacionController.js` - 5 console.log~~ **COMPLETADO** 🎉
3. ✅ ~~`server/controllers/exportacionController.js` - 3 console.log~~ **COMPLETADO** 🎉

### Archivos Pendientes

**Prioridad Media (40 console.log):**
1. `server/routes/plantillasWhatsApp.js` - 13 console.log
2. `server/routes/instalaciones.js` - 7 console.log
3. `server/routes/prospectos.js` - 7 console.log
4. `server/routes/backup.js` - 7 console.log
5. `server/routes/pedidos.js` - 5 console.log
6. Otros servicios - 1 console.log c/u

**Prioridad Baja (192 console.log):**
- Scripts de migración (45+19+14+11+10+10+8+7+7+6+5+4+3 = 149)
- Otros scripts de utilidad (43)
- Tests (opcional)

---

## 📋 INSTRUCCIONES PASO A PASO

### Paso 1: Identificar archivos pendientes

```bash
# Contar console.log por archivo
grep -r "console.log" server/ --include="*.js" | cut -d: -f1 | sort | uniq -c | sort -rn

# Ver archivos con más console.log
grep -r "console.log" server/ --include="*.js" -l
```

### Paso 2: ✅ pdfService.js COMPLETADO

**Archivo:** `server/services/pdfService.js` ✅  
**Estado:** 28/28 console.log migrados (100%)  
**Ver:** `AUDITORIA_LOGGING_31OCT2025.md`

**Logros:**
- ✅ Helper `getDocumentId` implementado
- ✅ 24 logs estructurados con contexto rico
- ✅ Warnings de assets (logo/fuentes)
- ✅ Eventos completos (Start/Success/Error)
- ✅ Identificación de motores (puppeteer/html-pdf-node)

### Paso 3: ✅ Controladores COMPLETADOS

**Archivos completados:**
- ✅ `server/controllers/cotizacionController.js` (5 → 0)
- ✅ `server/controllers/exportacionController.js` (3 → 0)

### Paso 4: Continuar con rutas (Prioridad Media)

**Próximo archivo:** `server/routes/plantillasWhatsApp.js` (13 console.log)

**Patrón de reemplazo:**

```javascript
// Antes:
console.log('Backend: Recibiendo solicitud para crear cotización...');

// Después:
logger.info('Recibiendo solicitud para crear cotización', { 
  controlador: 'cotizacionController',
  metodo: 'crearCotizacion'
});

// Antes:
console.log('Backend: req.body recibido:', JSON.stringify(req.body, null, 2));

// Después:
logger.debug('Body de solicitud recibido', { 
  controlador: 'cotizacionController',
  prospectoId: req.body.prospecto,
  productosCount: req.body.productos?.length || 0
});

// Antes:
console.log('Backend: Cotización guardada exitosamente:', cotizacionGuardada._id);

// Después:
logger.info('Cotización guardada exitosamente', { 
  controlador: 'cotizacionController',
  cotizacionId: cotizacionGuardada._id,
  numero: cotizacionGuardada.numero
});
```

### Paso 4: Verificar que el logger esté importado

```javascript
// Al inicio del archivo debe estar:
const logger = require('../config/logger');
```

Si no está, agregarlo.

### Paso 5: Reemplazar console.log uno por uno

**Niveles a usar:**
- `logger.info()` - Operaciones normales, inicio/fin de procesos
- `logger.warn()` - Advertencias, situaciones inusuales
- `logger.error()` - Errores, excepciones
- `logger.debug()` - Información de debugging (opcional)

**Contexto a agregar:**
```javascript
{
  servicio: 'pdfService',
  // + cualquier variable relevante
}
```

### Paso 6: Ejecutar pruebas

```bash
# Verificar sintaxis
node server/controllers/cotizacionController.js

# Ejecutar tests (si existen)
npm test

# Verificar que no queden console.log
grep "console.log" server/controllers/cotizacionController.js
```

---

## ✅ Checklist

- [x] Identificar archivos con más console.log ✅
- [x] Reemplazar en `server/services/pdfService.js` (28) ✅
- [x] Verificar logger importado ✅
- [x] Ejecutar `npm test` ✅
- [x] Verificar que no queden console.log en el archivo ✅
- [x] Auditoría completa: `AUDITORIA_LOGGING_31OCT2025.md` ✅
- [x] Reemplazar en `server/controllers/cotizacionController.js` (5) ✅
- [x] Reemplazar en `server/controllers/exportacionController.js` (3) ✅
- [x] Commit: "Completar logging en controladores críticos" ✅
- [ ] Reemplazar en `server/routes/plantillasWhatsApp.js` (13)
- [ ] Reemplazar en otras rutas prioritarias (27)
- [ ] Commit: "Completar logging en rutas operativas"

---

## 📊 Meta

**Objetivo:** Completar logging al 100%
- Actual: 187/419 (44.6%) ⬆️ +8.1%
- Meta: 419/419 (100%)
- Pendiente: 232 console.log

**Progreso por archivo:**
1. ✅ pdfService.js (28) - **COMPLETADO** 🎉
2. ✅ cotizacionController.js (5) - **COMPLETADO** 🎉
3. ✅ exportacionController.js (3) - **COMPLETADO** 🎉
4. ⏳ plantillasWhatsApp.js (13) - **SIGUIENTE**
5. ⏳ Otras rutas operativas (27) - Prioridad media
6. ⏳ Scripts y utilidades (192) - Prioridad baja

---

## 🔧 Comandos Útiles

```bash
# Ver console.log en un archivo específico
grep -n "console.log" server/services/pdfService.js

# Contar console.log restantes
grep -r "console.log" server/ --include="*.js" | wc -l

# Ver archivos ordenados por cantidad de console.log
grep -r "console.log" server/ --include="*.js" | cut -d: -f1 | sort | uniq -c | sort -rn | head -10
```

---

## 📚 Referencias

- `docs/logger_usage.md` - Guía completa del logger
- `server/routes/cotizaciones.js` - Ejemplo de migración completa
- `server/config/logger.js` - Configuración del logger

---

**¡Adelante con la migración!** 🚀

**Siguiente:** Una vez completado pdfService.js, continuar con el siguiente archivo con más console.log.
