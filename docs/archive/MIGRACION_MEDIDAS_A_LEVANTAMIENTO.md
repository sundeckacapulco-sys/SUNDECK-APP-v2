# 📋 Migración: medidas → levantamiento

**Fecha:** 5 Noviembre 2025  
**Estado:** ⚠️ EN PROGRESO  
**Objetivo:** Unificar fuente de información de levantamientos

---

## 🎯 PROBLEMA

Actualmente existen **DOS fuentes** de información para levantamientos:

1. **`proyecto.medidas[]`** - Formato antiguo (DEPRECADO)
2. **`proyecto.levantamiento`** - Formato nuevo (OFICIAL)

Esto causa:
- ❌ Duplicidad de datos
- ❌ Confusión sobre cuál usar
- ❌ Código más complejo
- ❌ Posibles inconsistencias

---

## ✅ SOLUCIÓN

**Usar ÚNICAMENTE `proyecto.levantamiento` como fuente oficial.**

### Estructura Oficial:

```javascript
{
  levantamiento: {
    partidas: [{
      ubicacion: String,
      producto: String,
      color: String,
      cantidad: Number,
      piezas: [{
        ancho: Number,
        alto: Number,
        m2: Number,
        // ... especificaciones técnicas
      }],
      motorizacion: {
        activa: Boolean,
        modeloMotor: String,
        // ...
      },
      totales: {
        m2: Number,
        subtotal: Number
      }
    }],
    totales: {
      m2: Number,
      subtotal: Number,
      iva: Number,
      total: Number
    },
    observaciones: String,
    actualizadoEn: Date
  }
}
```

---

## 📊 ESTADO ACTUAL

### ✅ Completado:

1. **Frontend - CotizacionForm.js**
   - ✅ Usa solo `levantamiento.partidas`
   - ✅ Eliminada referencia a `medidas`
   - ✅ Mensaje claro si no hay levantamiento

2. **Modelo - Proyecto.js**
   - ✅ Campo `medidas` marcado como `@deprecated`
   - ✅ Comentario de migración agregado

### ⏳ Pendiente:

1. **Migrar datos existentes**
   - ⏳ Script de migración de `medidas` → `levantamiento`
   - ⏳ Ejecutar migración en BD

2. **Actualizar código backend**
   - ⏳ Revisar controllers que usen `medidas`
   - ⏳ Actualizar a usar `levantamiento`

3. **Actualizar código frontend**
   - ⏳ Revisar componentes que lean `medidas`
   - ⏳ Actualizar a usar `levantamiento`

4. **Eliminar campo deprecado**
   - ⏳ Después de migración, eliminar `medidas` del schema

---

## 🔧 SCRIPT DE MIGRACIÓN

```javascript
// server/scripts/migrarMedidasALevantamiento.js

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

async function migrarMedidasALevantamiento() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Buscar proyectos con medidas pero sin levantamiento
    const proyectos = await Proyecto.find({
      'medidas.0': { $exists: true },
      'levantamiento.partidas': { $exists: false }
    });
    
    logger.info(`Proyectos a migrar: ${proyectos.length}`);
    
    for (const proyecto of proyectos) {
      // Convertir medidas a levantamiento
      const partidas = proyecto.medidas[0]?.piezas?.map(pieza => ({
        ubicacion: pieza.ubicacion,
        producto: pieza.productoLabel || pieza.producto,
        color: pieza.color,
        cantidad: pieza.cantidad || 1,
        piezas: pieza.medidas || [],
        totales: {
          m2: pieza.areaTotal || 0,
          subtotal: pieza.precioTotal || 0
        }
      })) || [];
      
      proyecto.levantamiento = {
        partidas,
        totales: proyecto.medidas[0]?.totales || {},
        observaciones: proyecto.medidas[0]?.observacionesGenerales || '',
        actualizadoEn: new Date()
      };
      
      await proyecto.save();
      logger.info(`Proyecto ${proyecto._id} migrado`);
    }
    
    logger.info('✅ Migración completada');
    
  } catch (error) {
    logger.error('Error en migración', { error: error.message });
  } finally {
    await mongoose.connection.close();
  }
}

migrarMedidasALevantamiento();
```

---

## 📋 CHECKLIST DE MIGRACIÓN

### Fase 1: Preparación ✅
- [x] Marcar `medidas` como deprecado
- [x] Actualizar CotizacionForm para usar solo `levantamiento`
- [x] Documentar migración

### Fase 2: Migración de Datos ⏳
- [ ] Crear script de migración
- [ ] Probar script en ambiente de desarrollo
- [ ] Hacer backup de BD
- [ ] Ejecutar migración en producción
- [ ] Validar datos migrados

### Fase 3: Actualizar Código ⏳
- [ ] Buscar todos los usos de `proyecto.medidas`
- [ ] Actualizar a `proyecto.levantamiento`
- [ ] Probar todas las funcionalidades
- [ ] Actualizar tests

### Fase 4: Limpieza ⏳
- [ ] Eliminar campo `medidas` del schema
- [ ] Eliminar código relacionado
- [ ] Actualizar documentación
- [ ] Crear CHANGELOG entry

---

## 🔍 BUSCAR USOS DE `medidas`

```bash
# Buscar en backend
grep -r "\.medidas" server/

# Buscar en frontend
grep -r "\.medidas" client/src/

# Buscar en modelos
grep -r "medidas:" server/models/
```

---

## ⚠️ CONSIDERACIONES

1. **Compatibilidad hacia atrás:**
   - Mantener `medidas` temporalmente
   - Migrar datos gradualmente
   - No romper funcionalidad existente

2. **Validación:**
   - Verificar que todos los proyectos tengan levantamiento
   - Validar estructura de datos
   - Confirmar que no se pierda información

3. **Rollback:**
   - Mantener backup antes de migración
   - Tener plan de rollback si algo falla

---

## 📊 IMPACTO

### Beneficios:
- ✅ Una sola fuente de verdad
- ✅ Código más simple
- ✅ Menos bugs por inconsistencias
- ✅ Más fácil de mantener

### Riesgos:
- ⚠️ Datos antiguos pueden perderse si no se migran bien
- ⚠️ Funcionalidad puede romperse temporalmente
- ⚠️ Requiere coordinación con equipo

---

## 🎯 PRÓXIMOS PASOS

1. **Crear script de migración** (1-2 horas)
2. **Probar en desarrollo** (30 min)
3. **Hacer backup de BD** (10 min)
4. **Ejecutar migración** (5 min)
5. **Validar resultados** (30 min)
6. **Actualizar código restante** (2-3 horas)
7. **Eliminar campo deprecado** (30 min)

**Tiempo total estimado:** 1 día

---

**Última actualización:** 5 Noviembre 2025
