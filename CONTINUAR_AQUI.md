# 🚀 Próxima Sesión: Ejecutar Migración de Datos

**Última actualización:** 5 Noviembre 2025 - 09:45  
**Estado:** ✅ Consolidación Legacy COMPLETADA - Listo para migrar  
**Próxima acción:** Ejecutar migración siguiendo plan de 8 pasos

---

## 🎯 OBJETIVO PRÓXIMA SESIÓN

**Ejecutar migración de ProyectoPedido.legacy → Pedido moderno**

- Migrar datos con validación
- Verificar integridad
- Generar reporte de resultados
- Confirmar éxito antes de desactivar legacy

---

## 📋 ESTADO ACTUAL

### ✅ Implementación Completada (100%)

**Código listo:**
- ✅ Pedido.js con 5 métodos portados
- ✅ syncLegacyService.js completo
- ✅ KPI.js con adaptador multi-fuente
- ✅ Script de ejecución funcional
- ✅ Documentación exhaustiva

**Archivos creados/modificados:**
- `server/models/Pedido.js` (+124 líneas)
- `server/models/KPI.js` (+82 líneas)
- `server/services/syncLegacyService.js` (+450 líneas)
- `server/scripts/ejecutarConsolidacionLegacy.js` (+200 líneas)
- `docs/analisis_consolidacion_legacy.md` (+650 líneas)
- `docs/fase3_consolidacion.md` (+400 líneas)

**Total agregado:** +1,906 líneas

---

## 🎯 PLAN DE EJECUCIÓN (Próxima Sesión)

> **IMPORTANTE:** Seguir los 8 pasos exactamente como están en `AGENTS.md` - Fase 4

### 📖 PASO 0: LEER DOCUMENTACIÓN (5 min)

Lee en este orden:
1. `CONTINUAR_AQUI.md` ⬅️ **EMPEZAR AQUÍ** (este archivo)
2. `docs/fase3_consolidacion.md` (contexto técnico)
3. `docs/analisis_consolidacion_legacy.md` (detalles de implementación)

---

### 🚀 PASO 1: BACKUP (CRÍTICO - NO OMITIR)

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

### 🧪 PASO 2: MIGRACIÓN DE PRUEBA (10 registros)

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

### 🔍 PASO 3: VALIDACIÓN DE PRUEBA

```bash
# Verificar que los datos se migraron correctamente
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); Pedido.find().limit(10).then(pedidos => { console.log('Pedidos migrados:', pedidos.length); pedidos.forEach(p => { console.log('ID:', p._id, 'Total:', p.total, 'Fuente:', p.fuenteDatos); }); process.exit(0); });"
```

**✅ Criterio de éxito:**
- Muestra 10 pedidos
- Todos tienen campo `fuenteDatos`
- Totales son consistentes

---

### ⚠️ PUNTO DE DECISIÓN

**SI la prueba fue exitosa (✅):** Continúa al Paso 4
**SI hubo errores (❌):** DETENTE y reporta los logs completos

---

### 🚀 PASO 4: MIGRACIÓN COMPLETA (100%)

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

### 🔍 PASO 5: VALIDACIÓN COMPLETA

```bash
# Verificar totales
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); async function validar() { const total = await Pedido.countDocuments(); const conFuente = await Pedido.countDocuments({ fuenteDatos: { \$exists: true } }); const totalMonto = await Pedido.aggregate([{ \$group: { _id: null, total: { \$sum: '\$total' } } }]); console.log('Total pedidos:', total); console.log('Con fuenteDatos:', conFuente); console.log('Monto total:', totalMonto[0]?.total || 0); process.exit(0); } validar();"
```

---

### 📊 PASO 6: VALIDAR KPIs

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

### 📝 PASO 7: GENERAR REPORTE

Crear archivo `docs/consolidacion_resultados.md` con el template completo (ver sección Template de Reporte abajo)

---

### 📤 PASO 8: ENTREGAR RESUMEN

Proporcionar resumen final al usuario con métricas, estado y recomendación (ver sección Formato de Entrega abajo)

---

## 📊 CRITERIOS DE ÉXITO

### ✅ Migración Exitosa

**Debe cumplir:**
- [ ] 100% de registros migrados
- [ ] 0 errores críticos
- [ ] Diferencia de montos < $0.01
- [ ] Sin números duplicados
- [ ] KPIs consistentes antes/después
- [ ] Reporte generado correctamente

### ⚠️ Migración con Discrepancias

**Si hay discrepancias menores:**
- [ ] Documentar en reporte
- [ ] Analizar causa
- [ ] Decidir si es aceptable
- [ ] Corregir si es necesario

### ❌ Migración Fallida

**Si falla:**
- [ ] Revisar logs de error
- [ ] Identificar causa raíz
- [ ] Restaurar desde backup
- [ ] Corregir código
- [ ] Re-ejecutar

---

## 🔍 COMANDOS ÚTILES

### Verificación de Datos (PowerShell/CMD)

```bash
# Contar registros
mongosh sundeck --eval "db.proyectoPedidos.countDocuments(); db.pedidos.countDocuments();"

# Ver últimos migrados
mongosh sundeck --eval "db.pedidos.find().sort({createdAt: -1}).limit(5);"

# Buscar duplicados
mongosh sundeck --eval "db.pedidos.aggregate([{ \$group: { _id: '\$numero', count: { \$sum: 1 } } }, { \$match: { count: { \$gt: 1 } } }]);"

# Verificar sin cotización
mongosh sundeck --eval "db.pedidos.countDocuments({ cotizacion: null });"
```

### Rollback (si es necesario)

```bash
# Restaurar desde backup
mongorestore --db sundeck --drop backup_pre_migracion/sundeck

# Verificar restauración
mongosh sundeck --eval "db.pedidos.countDocuments();"
```

---

## 📚 DOCUMENTACIÓN DE REFERENCIA

### Leer ANTES de ejecutar

1. **`docs/fase3_consolidacion.md`** ⬅️ **LEER PRIMERO**
   - Resumen completo de implementación
   - Fragmentos portados
   - Flujo de migración
   - Próximos pasos

2. **`docs/analisis_consolidacion_legacy.md`**
   - Análisis técnico detallado
   - Comparativa legacy vs moderno
   - Plan de consolidación
   - Código de ejemplo

3. **`RESUMEN_SESION_04_NOV_2025_CONSOLIDACION.md`**
   - Resumen de sesión anterior
   - Logros y métricas
   - Estado actual

### Código Relevante

- `server/services/syncLegacyService.js` - Servicio de migración
- `server/scripts/ejecutarConsolidacionLegacy.js` - Script de ejecución
- `server/models/Pedido.js` - Modelo con métodos portados
- `server/models/KPI.js` - Adaptador multi-fuente

---

## ⚠️ PRECAUCIONES

### Antes de Ejecutar

- ✅ Hacer backup completo de BD
- ✅ Verificar espacio en disco
- ✅ Confirmar conexión a BD
- ✅ Leer documentación completa
- ✅ Tener plan de rollback

### Durante Ejecución

- ✅ Monitorear logs en tiempo real
- ✅ Verificar progreso cada 10 registros
- ✅ Anotar cualquier error
- ✅ No interrumpir proceso

### Después de Ejecutar

- ✅ Revisar reporte completo
- ✅ Validar totales y montos
- ✅ Verificar KPIs
- ✅ Documentar resultados
- ✅ Guardar backup exitoso

---

## 🎯 DECISIONES POST-MIGRACIÓN

### Si Migración Exitosa ✅

**Próximos pasos (1 semana después):**
1. Monitorear KPIs diarios
2. Verificar funcionalidad
3. Revisar logs de errores
4. Desactivar rutas legacy
5. Eliminar código legacy

### Si Migración con Discrepancias ⚠️

**Acciones:**
1. Analizar discrepancias
2. Determinar si son aceptables
3. Corregir datos si es necesario
4. Re-validar
5. Documentar decisiones

### Si Migración Fallida ❌

**Acciones:**
1. Restaurar desde backup
2. Analizar causa raíz
3. Corregir código
4. Probar en ambiente local
5. Re-ejecutar con más logging

---

## 📊 TEMPLATE DE REPORTE

```markdown
# Reporte de Migración Legacy → Moderno

**Fecha:** [Fecha]
**Ejecutado por:** [Nombre]
**Estado:** [EXITOSO/CON_DISCREPANCIAS/FALLIDO]

## Resultados

- **Registros legacy:** X
- **Registros migrados:** Y
- **Errores:** Z
- **Diferencia de montos:** $W

## Validaciones

- [ ] Totales coinciden
- [ ] Montos coinciden
- [ ] Sin duplicados
- [ ] KPIs consistentes

## Discrepancias

[Listar si existen]

## Recomendación

[CONTINUAR/CORREGIR/ROLLBACK]
```

---

## 🚀 CHECKLIST PRÓXIMA SESIÓN

### Preparación
- [ ] Leer `docs/fase3_consolidacion.md`
- [ ] Leer `docs/analisis_consolidacion_legacy.md`
- [ ] Verificar conexión a MongoDB
- [ ] Hacer backup completo

### Ejecución
- [ ] Migrar 10 registros (prueba)
- [ ] Revisar reporte de prueba
- [ ] Migrar 100+ registros (completo)
- [ ] Monitorear progreso

### Validación
- [ ] Verificar totales
- [ ] Verificar montos
- [ ] Verificar KPIs
- [ ] Buscar duplicados
- [ ] Verificar cotizaciones

### Documentación
- [ ] Actualizar reporte de resultados
- [ ] Documentar discrepancias
- [ ] Generar recomendación
- [ ] Actualizar AGENTS.md

---

## 💡 TIPS

### Para Migración Exitosa

1. **Empezar pequeño**
   - Migrar 10 primero
   - Validar completamente
   - Luego escalar

2. **Monitorear activamente**
   - Ver logs en tiempo real
   - Anotar errores
   - Verificar progreso

3. **Validar exhaustivamente**
   - Totales
   - Montos
   - KPIs
   - Duplicados

4. **Documentar todo**
   - Errores
   - Discrepancias
   - Decisiones
   - Resultados

---

---

## 📊 FORMATO DE ENTREGA REQUERIDO

Al terminar la migración, entregar este resumen:

```markdown
## ✅ MIGRACIÓN COMPLETADA

### Estado: [EXITOSA/FALLIDA/PARCIAL]

### Métricas:
- Backup: ✅ [tamaño]
- Prueba (10): ✅ X/10 procesados
- Completa (100%): ✅ X/X procesados
- Totales coinciden: ✅ ($X antes = $X después)
- KPIs funcionan: ✅

### Errores: X

### Reporte completo:
Ver: `docs/consolidacion_resultados.md`

### Recomendación: [CONTINUAR/ROLLBACK/REVISAR]

### Justificación:
[Explicar por qué recomiendas esa acción]

### Logs críticos:
[Solo si hay errores importantes]
```

---

**Responsable:** Próximo Agente  
**Duración estimada:** 60-90 minutos  
**Complejidad:** Media  
**Riesgo:** Bajo (con backup)

**¡Listo para ejecutar migración!** 🚀✨
