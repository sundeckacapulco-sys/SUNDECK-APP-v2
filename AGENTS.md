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

## ✅ PARTE 2 COMPLETADA

¡Excelente trabajo! La Parte 2 fue completada exitosamente.

**Resultados:**
- 10 archivos migrados: 85 console.log → 0
- Scripts grandes completados ✅
- Tests: 15/15 pasando ✅
- Progreso: 348/419 (83.1%)

---

## 🎯 TAREA ACTUAL: PARTE 3 de 3 - FINAL

### Objetivo
**ELIMINAR** los últimos 71 console.log para completar Fase 0 al 100%.

**Progreso actual:** 348/419 (83.1%) → Meta: 419/419 (100%)

---

## 📦 PARTE 3: Scripts Restantes - FINAL

### Archivos a Migrar (10 archivos, 71 console.log):

1. **server/scripts/seedData.js** - 11 console.log
2. **server/scripts/crearProyectosPrueba.js** - 10 console.log
3. **server/scripts/limpiarTotalesProyecto.js** - 10 console.log
4. **server/scripts/limpiarPreciosProyecto.js** - 8 console.log
5. **server/scripts/actualizarNumerosProyectos.js** - 7 console.log
6. **server/scripts/verificarProyecto.js** - 7 console.log
7. **server/scripts/insertarDatos.js** - 6 console.log
8. **server/scripts/plantillasIniciales.js** - 5 console.log
9. **server/scripts/limpiarMedidasProyecto.js** - 4 console.log
10. **server/scripts/crearDatosSimple.js** - 3 console.log

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

### 🔍 CÓMO VERIFICAR QUE ELIMINASTE LOS CONSOLE.LOG

Después de editar cada archivo, ejecuta:
```bash
grep "console.log" server/scripts/migrarDatos.js
```

**Si ves resultados = NO terminaste** ❌  
**Si NO ves resultados = Archivo completo** ✅

---

## 🧪 VERIFICACIÓN

### Antes de reportar completado:

```bash
# 1. Verificar 0 console.log en cada archivo
grep "console.log" server/scripts/seedData.js
grep "console.log" server/scripts/crearProyectosPrueba.js
# ... (repetir para los 10 archivos)

# 2. Contar total restante (debe ser 0)
grep -r "console.log" server/ --include="*.js" | wc -l

# 3. Ejecutar tests
npm test
# Resultado esperado: 15/15 pasando
```

---

## 📊 REPORTE ESPERADO

Al finalizar, proporciona:

```
✅ PARTE 3 COMPLETADA - FASE 0 AL 100%

Archivos migrados (10):
- seedData.js: 11 → 0
- crearProyectosPrueba.js: 10 → 0
- limpiarTotalesProyecto.js: 10 → 0
- limpiarPreciosProyecto.js: 8 → 0
- actualizarNumerosProyectos.js: 7 → 0
- verificarProyecto.js: 7 → 0
- insertarDatos.js: 6 → 0
- plantillasIniciales.js: 5 → 0
- limpiarMedidasProyecto.js: 4 → 0
- crearDatosSimple.js: 3 → 0

Total migrado: 71 console.log
Total restante: 0 console.log ✅
Fase 0: 100% COMPLETADA 🎉
Tests: 15/15 pasando ✅
```

### ⚠️ VERIFICACIÓN CRÍTICA
Antes de reportar, ejecuta:
```bash
grep "console.log" server/scripts/seedData.js
# Debe retornar: (sin resultados)

grep -r "console.log" server/ --include="*.js" | wc -l
# Debe retornar: 0
```

Si hay resultados, la tarea NO está completa.

### 📝 EJEMPLO PASO A PASO

**Archivo:** `server/scripts/seedData.js` (11 console.log)

**Paso 1:** Leer el archivo
```bash
# Ver cuántos console.log tiene
grep -c "console.log" server/scripts/seedData.js
# Resultado: 11
```

**Paso 2:** Editar el archivo
- Buscar CADA console.log
- ELIMINAR la línea con console.log
- AGREGAR línea con logger.info/warn/error

**Paso 3:** Verificar que quedó en 0
```bash
grep -c "console.log" server/scripts/seedData.js
# Resultado esperado: 0
```

**Si el resultado NO es 0, el archivo NO está completo.**

---

## 📚 CONTEXTO

### Archivos ya completados (348 console.log):
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
- ✅ Parte 2: 10 archivos (85)

### Próximas partes:
- **Parte 3:** 10 archivos, 71 console.log (scripts restantes) - **ACTUAL**

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
