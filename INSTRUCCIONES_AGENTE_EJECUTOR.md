# 🎯 INSTRUCCIONES PARA AGENTE EJECUTOR - MIGRACIÓN FASE 4

**Fecha:** 5 Nov 2025  
**Misión:** Ejecutar migración de consolidación legacy  
**Tiempo estimado:** 15-30 minutos  
**Revisor:** Usuario validará tu trabajo

---

## 📖 PASO 0: LEER DOCUMENTACIÓN (5 min)

Lee en este orden:
1. `CONTINUAR_AQUI.md` ⬅️ **EMPEZAR AQUÍ**
2. `docs/fase3_consolidacion.md`
3. `docs/analisis_consolidacion_legacy.md`

---

## 🚀 PASO 1: BACKUP (CRÍTICO - NO OMITIR)

```bash
# Crear backup completo de la base de datos
mongodump --db sundeck --out backup_pre_migracion

# Verificar que se creó correctamente
ls -lh backup_pre_migracion/sundeck/
```

**✅ Criterio de éxito:**
- Carpeta `backup_pre_migracion/sundeck/` existe
- Contiene archivos `.bson` y `.json`
- Tamaño > 0 bytes

---

## 🧪 PASO 2: MIGRACIÓN DE PRUEBA (10 registros)

```bash
# Ejecutar migración con límite de 10 registros
node server/scripts/ejecutarConsolidacionLegacy.js 10
```

**✅ Criterio de éxito:**
- Script termina sin errores críticos
- Muestra: "✅ Migración completada: X/10 registros"
- Totales ANTES y DESPUÉS coinciden
- Logs muestran operaciones exitosas

**📊 Captura estos datos:**
```
Registros procesados: X/10
Errores: X
Total antes: $X
Total después: $X
¿Coinciden?: ✅/❌
```

---

## 🔍 PASO 3: VALIDACIÓN DE PRUEBA

```bash
# Verificar que los datos se migraron correctamente
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); Pedido.find().limit(10).then(pedidos => { console.log('Pedidos migrados:', pedidos.length); pedidos.forEach(p => { console.log('ID:', p._id, 'Total:', p.total, 'Fuente:', p.fuenteDatos); }); process.exit(0); });"
```

**✅ Criterio de éxito:**
- Muestra 10 pedidos
- Todos tienen campo `fuenteDatos`
- Totales son consistentes

---

## ⚠️ PUNTO DE DECISIÓN

**SI la prueba fue exitosa (✅):** Continúa al Paso 4  
**SI hubo errores (❌):** DETENTE y reporta los logs completos

---

## 🚀 PASO 4: MIGRACIÓN COMPLETA (100%)

```bash
# Ejecutar migración completa
node server/scripts/ejecutarConsolidacionLegacy.js 100
```

**✅ Criterio de éxito:**
- Script termina sin errores críticos
- Muestra: "✅ Migración completada: X/X registros"
- Totales finales coinciden 100%
- Sin duplicados creados

**📊 Captura estos datos:**
```
Registros procesados: X/total
Errores: X
Total antes: $X
Total después: $X
¿Coinciden?: ✅/❌
Duplicados: X
```

---

## 🔍 PASO 5: VALIDACIÓN COMPLETA

```bash
# Verificar totales
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); async function validar() { const total = await Pedido.countDocuments(); const conFuente = await Pedido.countDocuments({ fuenteDatos: { \$exists: true } }); const totalMonto = await Pedido.aggregate([{ \$group: { _id: null, total: { \$sum: '\$total' } } }]); console.log('Total pedidos:', total); console.log('Con fuenteDatos:', conFuente); console.log('Monto total:', totalMonto[0]?.total || 0); process.exit(0); } validar();"
```

---

## 📊 PASO 6: VALIDAR KPIs

```bash
# Probar que los KPIs siguen funcionando
curl http://localhost:5001/api/kpis/comerciales
curl http://localhost:5001/api/kpis/operacionales
```

**✅ Criterio de éxito:**
- Ambos endpoints responden 200 OK
- Datos son consistentes
- Sin errores en consola del servidor

---

## 📝 PASO 7: GENERAR REPORTE

Crear archivo `docs/consolidacion_resultados.md` con:

```markdown
# Reporte de Migración - Consolidación Legacy
**Fecha:** [fecha actual]
**Ejecutor:** [tu nombre/ID]

## Resumen Ejecutivo
- **Estado:** ✅ EXITOSA / ❌ FALLIDA / ⚠️ CON OBSERVACIONES
- **Registros migrados:** X/X
- **Errores:** X
- **Duración:** X minutos

## Backup
- ✅ Ejecutado
- Ubicación: `backup_pre_migracion/`
- Tamaño: X MB

## Migración Prueba (10 registros)
- Procesados: X/10
- Errores: X
- Total antes: $X
- Total después: $X
- Coinciden: ✅/❌

## Migración Completa (100%)
- Procesados: X/total
- Errores: X
- Total antes: $X
- Total después: $X
- Coinciden: ✅/❌
- Duplicados: X

## Validación KPIs
- KPI Comerciales: ✅/❌
- KPI Operacionales: ✅/❌

## Logs Críticos
[Pegar aquí cualquier error o warning importante]

## Recomendación Final
[CONTINUAR / ROLLBACK / REVISAR]

### Justificación
[Explicar por qué recomiendas esa acción]

## Próximos Pasos
1. [...]
2. [...]
```

---

## 📤 PASO 8: ENTREGAR RESUMEN

Proporciona al usuario un resumen con este formato:

```markdown
## ✅ MIGRACIÓN COMPLETADA

### Estado: [EXITOSA/FALLIDA/PARCIAL]

### Métricas:
- Backup: ✅
- Prueba (10): ✅ X/10 procesados
- Completa (100%): ✅ X/X procesados
- Totales coinciden: ✅
- KPIs funcionan: ✅

### Errores: X

### Reporte completo:
Ver: `docs/consolidacion_resultados.md`

### Recomendación: [CONTINUAR/ROLLBACK/REVISAR]

### Logs críticos:
[Solo si hay errores importantes]
```

---

## ⚠️ REGLAS CRÍTICAS

### ❌ NUNCA:
- Omitir el backup
- Migrar 100% sin probar 10 primero
- Ignorar errores
- Continuar si los totales no coinciden
- Modificar el código de migración

### ✅ SIEMPRE:
- Hacer backup primero
- Probar con 10 antes de 100%
- Validar totales en cada paso
- Documentar errores
- Reportar discrepancias

---

## 🆘 SI ALGO SALE MAL

### Errores de Conexión:
```bash
# Verificar MongoDB
mongosh
show dbs
use sundeck
db.pedidos.countDocuments()
```

### Errores en el Script:
```bash
# Ver logs completos
node server/scripts/ejecutarConsolidacionLegacy.js 10 2>&1 | tee migracion.log
```

### Rollback (si es necesario):
```bash
# Restaurar backup
mongorestore --db sundeck --drop backup_pre_migracion/sundeck/
```

---

## 🎯 TU OBJETIVO

Ejecutar la migración siguiendo **EXACTAMENTE** estos pasos y entregar un reporte completo para que el revisor pueda validar tu trabajo.

**¿Listo para empezar?** 🚀
