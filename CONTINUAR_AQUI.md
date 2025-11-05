# 🚀 Próxima Sesión: Ejecutar Migración de Datos

**Última actualización:** 4 Noviembre 2025 - 18:57  
**Estado:** ✅ Consolidación Legacy COMPLETADA - Listo para migrar  
**Próxima acción:** Ejecutar migración en entorno de prueba

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

### Paso 1: Preparación (5 min)

```bash
# 1. Leer documentación
cat docs/fase3_consolidacion.md

# 2. Verificar conexión a BD
mongo --eval "db.adminCommand('ping')"

# 3. Backup de seguridad
mongodump --db sundeck --out backup_pre_migracion_$(date +%Y%m%d_%H%M%S)
```

---

### Paso 2: Migración de Prueba (10 min)

```bash
# Migrar primeros 10 registros (prueba)
node server/scripts/ejecutarConsolidacionLegacy.js 10
```

**Verificar:**
- ✅ Sin errores en consola
- ✅ Reporte generado en `docs/consolidacion_resultados.md`
- ✅ Totales coinciden
- ✅ Montos coinciden

---

### Paso 3: Migración Completa (20 min)

```bash
# Si prueba exitosa, migrar 100 registros
node server/scripts/ejecutarConsolidacionLegacy.js 100

# O migrar todos (si hay pocos)
node server/scripts/ejecutarConsolidacionLegacy.js 1000
```

**Monitorear:**
- Progreso cada 10 registros
- Errores (si existen)
- Tiempo de ejecución

---

### Paso 4: Validación (15 min)

```bash
# 1. Revisar reporte completo
cat docs/consolidacion_resultados.md

# 2. Verificar en MongoDB
mongo sundeck --eval "
  db.pedidos.countDocuments();
  db.proyectoPedidos.countDocuments();
"

# 3. Comparar montos
mongo sundeck --eval "
  db.pedidos.aggregate([
    { \$group: { _id: null, total: { \$sum: '\$montoTotal' } } }
  ]);
  db.proyectoPedidos.aggregate([
    { \$group: { _id: null, total: { \$sum: '\$pagos.montoTotal' } } }
  ]);
"
```

**Criterios de éxito:**
- ✅ Diferencia de registros = 0
- ✅ Diferencia de montos < $0.01
- ✅ Sin números duplicados
- ✅ Todos con cotización válida

---

### Paso 5: Validación de KPIs (10 min)

```bash
# Calcular KPIs antes de migración
# (guardar para comparar)

# Calcular KPIs después de migración
# (deben ser iguales o muy similares)
```

**Verificar:**
- Ventas cerradas
- Monto total de ventas
- Proyectos completados
- Tasas de conversión

---

### Paso 6: Documentar Resultados (10 min)

**Actualizar `docs/consolidacion_resultados.md` con:**
- Total migrado
- Errores (si existen)
- Discrepancias (si existen)
- KPIs antes/después
- Recomendación final

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

### Verificación de Datos

```bash
# Contar registros
mongo sundeck --eval "
  print('Legacy:', db.proyectoPedidos.countDocuments());
  print('Moderno:', db.pedidos.countDocuments());
"

# Ver últimos migrados
mongo sundeck --eval "
  db.pedidos.find().sort({createdAt: -1}).limit(5).pretty();
"

# Buscar duplicados
mongo sundeck --eval "
  db.pedidos.aggregate([
    { \$group: { _id: '\$numero', count: { \$sum: 1 } } },
    { \$match: { count: { \$gt: 1 } } }
  ]);
"

# Verificar sin cotización
mongo sundeck --eval "
  db.pedidos.countDocuments({ cotizacion: null });
"
```

### Rollback (si es necesario)

```bash
# Restaurar desde backup
mongorestore --db sundeck --drop backup_pre_migracion_YYYYMMDD_HHMMSS/sundeck

# Verificar restauración
mongo sundeck --eval "db.pedidos.countDocuments();"
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

**Responsable:** Próximo Agente  
**Duración estimada:** 60-90 minutos  
**Complejidad:** Media  
**Riesgo:** Bajo (con backup)

**¡Listo para ejecutar migración!** 🚀✨
