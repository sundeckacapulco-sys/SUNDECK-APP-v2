# 🚀 CONTINUAR AQUÍ - Completar Logging

**Fecha:** 31 Oct 2025  
**Estado:** Sprint 1 y 2 completados → Tarea pendiente: Completar console.log

---

## ✅ COMPLETADO

### Sprint 1: Logger Estructurado ⚠️ PARCIAL
- ✅ Winston Logger implementado
- ⚠️ 153/419 console.log reemplazados (36.5%)
- ✅ Archivos críticos: 89.5%

### Sprint 2: Métricas Baseline ✅ BACKEND COMPLETO
- ✅ Modelo Metric
- ✅ Middleware de métricas
- ✅ API REST (4 endpoints)
- ✅ 15/15 tests pasando

**Fase 0:** 71% completada

---

## 🎯 TAREA ACTUAL: Completar console.log Restantes

### Objetivo
Reemplazar los 266 console.log restantes en archivos no críticos para completar la migración al logger estructurado.

### Archivos Pendientes

**Prioridad Media (66 console.log):**
1. `server/services/pdfService.js` - 28 console.log
2. `server/routes/proyectos.js` - 38 console.log (si tiene más)

**Prioridad Baja (200 console.log):**
- Scripts de utilidad
- Seeders
- Archivos de configuración
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

### Paso 2: Empezar con pdfService.js (28 console.log)

Este archivo ya tiene el logger importado pero no se usó en el Sprint 1.

**Archivo:** `server/services/pdfService.js`

**Patrón de reemplazo:**

```javascript
// Antes:
console.log('Generando PDF...');

// Después:
logger.info('Generando PDF', { servicio: 'pdfService' });

// Antes:
console.error('Error generando PDF:', error);

// Después:
logger.error('Error generando PDF', { 
  error: error.message, 
  stack: error.stack,
  servicio: 'pdfService'
});

// Antes:
console.log('PDF generado:', filename);

// Después:
logger.info('PDF generado exitosamente', { 
  filename,
  servicio: 'pdfService'
});
```

### Paso 3: Verificar que el logger esté importado

```javascript
// Al inicio del archivo debe estar:
const logger = require('../config/logger');
```

Si no está, agregarlo.

### Paso 4: Reemplazar console.log uno por uno

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

### Paso 5: Ejecutar pruebas

```bash
# Verificar sintaxis
node server/services/pdfService.js

# Ejecutar tests (si existen)
npm test

# Verificar que no queden console.log
grep "console.log" server/services/pdfService.js
```

---

## ✅ Checklist

- [ ] Identificar archivos con más console.log
- [ ] Reemplazar en `server/services/pdfService.js` (28)
- [ ] Verificar logger importado
- [ ] Ejecutar `npm test`
- [ ] Verificar que no queden console.log en el archivo
- [ ] Commit: "Completar logging en pdfService.js"

---

## 📊 Meta

**Objetivo:** Completar logging al 100%
- Actual: 153/419 (36.5%)
- Meta: 419/419 (100%)
- Pendiente: 266 console.log

**Prioridad:**
1. pdfService.js (28) - Archivo de servicio importante
2. Otros archivos de servicios
3. Scripts y utilidades (baja prioridad)

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
