# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 31 Oct 2025  
**Estado:** Fase 0 - Completar al 100% (NO dejar nada a medias)

---

## 🔴 TAREA INCOMPLETA - CORRECCIÓN REQUERIDA

### Problema Detectado
Tu trabajo anterior agregó logger PERO **NO eliminó los console.log existentes**.

**Los 10 archivos AÚN tienen 36 console.log sin migrar.**

---

## 🎯 TAREA: COMPLETAR PARTE 1 CORRECTAMENTE

### Objetivo
**REEMPLAZAR** (no solo agregar) 34 console.log en 10 archivos críticos.

**Progreso actual:** 227/419 (54.2%) → Meta después de Parte 1: 261/419 (62.3%)

---

## 📦 PARTE 1: Middleware, Modelos y Services Críticos

### Archivos a Migrar (10 archivos, 34 console.log):

1. **server/middleware/proyectoSync.js** - 6 console.log
2. **server/models/Cotizacion.js** - 5 console.log
3. **server/services/fabricacionService.js** - 6 console.log
4. **server/services/notificacionesService.js** - 4 console.log
5. **server/services/notificacionesComerciales.js** - 3 console.log
6. **server/services/pdfFabricacionService.js** - 3 console.log
7. **server/routes/dashboardPedidos.js** - 3 console.log
8. **server/services/excelService.js** - 2 console.log
9. **server/services/instalacionesInteligentesService.js** - 2 console.log
10. **server/routes/kpisInstalaciones.js** - 2 console.log

---

## 📋 PATRÓN DE MIGRACIÓN

### ⚠️ IMPORTANTE: REEMPLAZAR, NO AGREGAR

**NO hagas esto:**
```javascript
console.log('Mensaje'); // ❌ Dejar el console.log
logger.info('Mensaje', { archivo: 'test' }); // ❌ Solo agregar logger
```

**SÍ haz esto:**
```javascript
// Antes:
console.log('Mensaje');

// Después (ELIMINAR console.log):
logger.info('Mensaje', { archivo: 'test' }); // ✅ REEMPLAZAR
```

### Importar Logger
```javascript
const logger = require('../config/logger');
```

### Operaciones Normales
```javascript
// Antes:
console.log('Operación completada');

// Después (REEMPLAZAR):
logger.info('Operación completada', { 
  archivo: 'nombreArchivo',
  accion: 'nombreAccion',
  contexto: 'datos relevantes'
});
```

### Errores
```javascript
// Antes:
console.log('Error:', error);

// Después:
logger.error('Error en operación', {
  archivo: 'nombreArchivo',
  error: error.message,
  stack: error.stack
});
```

### Advertencias
```javascript
// Antes:
console.log('Advertencia: situación inusual');

// Después:
logger.warn('Situación inusual detectada', {
  archivo: 'nombreArchivo',
  detalle: 'descripción'
});
```

---

## ✅ REQUISITOS OBLIGATORIOS

- ✅ Logger importado en CADA archivo
- ✅ Contexto mínimo: `{ archivo, accion }`
- ✅ Niveles apropiados: `info` (normal), `warn` (inusual), `error` (con stack)
- ✅ Mensajes en español
- ✅ **0 console.log al finalizar en los 10 archivos** (CRÍTICO)
- ✅ `npm test` debe pasar (15/15)

### ⚠️ CRÍTICO
**Cada archivo debe quedar con 0 console.log. Si un archivo tiene console.log, la tarea NO está completa.**

---

## 🧪 VERIFICACIÓN

### Antes de reportar completado:

```bash
# 1. Verificar 0 console.log en cada archivo
grep "console.log" server/middleware/proyectoSync.js
grep "console.log" server/models/Cotizacion.js
# ... (repetir para los 10 archivos)

# 2. Contar total restante (debe ser 158)
grep -r "console.log" server/ --include="*.js" | wc -l

# 3. Ejecutar tests
npm test
# Resultado esperado: 15/15 pasando
```

---

## 📊 REPORTE ESPERADO

Al finalizar, proporciona:

```
✅ PARTE 1 COMPLETADA

Archivos migrados (10):
- proyectoSync.js: 6 → 0
- Cotizacion.js: 5 → 0
- fabricacionService.js: 6 → 0
- notificacionesService.js: 4 → 0
- notificacionesComerciales.js: 3 → 0
- pdfFabricacionService.js: 3 → 0
- dashboardPedidos.js: 3 → 0
- excelService.js: 2 → 0
- instalacionesInteligentesService.js: 2 → 0
- kpisInstalaciones.js: 2 → 0

Total migrado: 34 console.log
Total restante: 158 console.log
Tests: 15/15 pasando ✅
```

### ⚠️ VERIFICACIÓN CRÍTICA
Antes de reportar, ejecuta:
```bash
grep "console.log" server/middleware/proyectoSync.js
# Debe retornar: (sin resultados)
```

Si hay resultados, la tarea NO está completa.

---

## 📚 CONTEXTO

### Archivos ya completados (76 console.log):
- ✅ pdfService.js (28)
- ✅ cotizacionController.js (5)
- ✅ exportacionController.js (3)
- ✅ plantillasWhatsApp.js (13)
- ✅ backup.js (7)
- ✅ instalaciones.js (7)
- ✅ prospectos.js (7)
- ✅ pedidos.js (5)
- ✅ storage.js (1)

### Próximas partes:
- **Parte 2:** 9 archivos, 84 console.log (scripts grandes)
- **Parte 3:** 10 archivos, 74 console.log (scripts restantes)

---

## ⚠️ IMPORTANTE

- NO modificar archivos ya completados
- NO usar console.log en ningún lugar
- NO dejar logs sin contexto
- SÍ seguir el patrón establecido
- SÍ verificar cada archivo antes de continuar
- SÍ reportar cualquier problema

---

## 🎯 ESTÁNDAR DE CALIDAD

**Nivel esperado:** ⭐⭐⭐⭐⭐ (Excelente)

Como en archivos anteriores:
- Contexto estructurado
- Niveles apropiados
- Mensajes descriptivos
- Trazabilidad clara

---

**Tiempo estimado:** 30-40 minutos  
**Dificultad:** Media  
**Impacto:** Alto (archivos de producción)
