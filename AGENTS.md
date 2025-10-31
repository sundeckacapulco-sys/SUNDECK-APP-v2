# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 31 Oct 2025  
**Estado:** Fase 0 - Completar al 100% (NO dejar nada a medias)

---

## ✅ PARTE 1 COMPLETADA

¡Excelente trabajo! La Parte 1 fue completada exitosamente.

**Resultados:**
- 10 archivos migrados: 36 console.log → 0
- Tests: 15/15 pasando ✅
- Progreso: 263/419 (62.8%)

---

## 🎯 TAREA ACTUAL: PARTE 2 de 3

### Objetivo
**REEMPLAZAR** 85 console.log en 10 archivos (scripts grandes + routes/services restantes).

**Progreso actual:** 263/419 (62.8%) → Meta después de Parte 2: 348/419 (83.1%)

---

## 📦 PARTE 2: Scripts Grandes + Routes/Services Restantes

### Archivos a Migrar (10 archivos, 85 console.log):

1. **server/scripts/migrarDatos.js** - 45 console.log
2. **server/scripts/migrarAProyectos.js** - 19 console.log
3. **server/scripts/fixCotizaciones.js** - 14 console.log
4. **server/models/Proyecto.js** - 1 console.log
5. **server/routes/fabricacion.js** - 1 console.log
6. **server/routes/fix.js** - 1 console.log
7. **server/routes/produccion.js** - 1 console.log
8. **server/services/kpisInstalacionesService.js** - 1 console.log
9. **server/services/metricasComerciales.js** - 1 console.log
10. **server/middleware/transicionesEstado.js** - 1 console.log

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
grep "console.log" server/scripts/migrarDatos.js
grep "console.log" server/scripts/migrarAProyectos.js
# ... (repetir para los 10 archivos)

# 2. Contar total restante (debe ser 71)
grep -r "console.log" server/ --include="*.js" | wc -l

# 3. Ejecutar tests
npm test
# Resultado esperado: 15/15 pasando
```

---

## 📊 REPORTE ESPERADO

Al finalizar, proporciona:

```
✅ PARTE 2 COMPLETADA

Archivos migrados (10):
- migrarDatos.js: 45 → 0
- migrarAProyectos.js: 19 → 0
- fixCotizaciones.js: 14 → 0
- Proyecto.js: 1 → 0
- fabricacion.js: 1 → 0
- fix.js: 1 → 0
- produccion.js: 1 → 0
- kpisInstalacionesService.js: 1 → 0
- metricasComerciales.js: 1 → 0
- transicionesEstado.js: 1 → 0

Total migrado: 85 console.log
Total restante: 71 console.log
Tests: 15/15 pasando ✅
```

### ⚠️ VERIFICACIÓN CRÍTICA
Antes de reportar, ejecuta:
```bash
grep "console.log" server/scripts/migrarDatos.js
# Debe retornar: (sin resultados)
```

Si hay resultados, la tarea NO está completa.

---

## 📚 CONTEXTO

### Archivos ya completados (112 console.log):
- ✅ pdfService.js (28)
- ✅ cotizacionController.js (5)
- ✅ exportacionController.js (3)
- ✅ plantillasWhatsApp.js (13)
- ✅ backup.js (7)
- ✅ instalaciones.js (7)
- ✅ prospectos.js (7)
- ✅ pedidos.js (5)
- ✅ storage.js (1)
- ✅ Parte 1: 10 archivos (36)

### Próximas partes:
- **Parte 2:** 10 archivos, 85 console.log (scripts grandes) - **ACTUAL**
- **Parte 3:** 10 archivos, 71 console.log (scripts restantes)

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
