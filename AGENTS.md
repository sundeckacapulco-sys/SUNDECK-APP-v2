# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 5 Nov 2025
**Estado:** Fase 0 ✅ | Fase 1 ✅ | Fase 2 ✅ | Fase 3 ✅ | **Fase 4 ⏳ EJECUTAR MIGRACIÓN**

---

## 🎉 FASE 0 COMPLETADA (100%)

- 419 console.log migrados → 0 restantes ✅
- Logger estructurado aplicado en todos los scripts críticos ✅
- Scripts de datos y mantenimiento con cierres y validaciones trazables ✅
- 15/15 pruebas unitarias y de integración pasando ✅

---

## 🎉 FASE 1 COMPLETADA (100%)

### ✅ COMPLETADO (31 Oct 2025)

**Día 0: Modelo Unificado** ✅
- ✅ Agregados campos: `cronograma`, `fabricacion`, `instalacion`, `pagos`, `notas`
- ✅ Implementados métodos inteligentes:
  - `generarEtiquetasProduccion()` - Etiquetas con QR para empaques
  - `calcularTiempoInstalacion()` - Algoritmo inteligente de tiempos
  - `generarRecomendacionesInstalacion()` - Sugerencias personalizadas
  - `optimizarRutaDiaria()` - Optimización de rutas con Nearest Neighbor
- ✅ Archivo actualizado: `server/models/Proyecto.js` (502 → 1,241 líneas)

**Día 1: Endpoints Implementados** ✅ ⭐
- ✅ Instalada dependencia: `qrcode@1.5.3`
- ✅ Creado `server/utils/qrcodeGenerator.js` (resiliente con fallback)
- ✅ Endpoint: `POST /api/proyectos/:id/etiquetas-produccion`
- ✅ Endpoint: `POST /api/proyectos/:id/calcular-tiempo-instalacion`
- ✅ Endpoint: `GET /api/proyectos/ruta-diaria/:fecha`
- ✅ Validaciones completas (ID, fecha, existencia)
- ✅ Logging estructurado en todos los endpoints
- ✅ Manejo de errores robusto

**Día 2: Services Actualizados** ✅ ⭐
- ✅ `FabricacionService` migrado a `Proyecto` (+107/-37 líneas)
- ✅ Normalización de productos centralizada
- ✅ Cálculo automático de materiales y procesos
- ✅ `InstalacionesInteligentesService` reescrito (+308/-91 líneas)
- ✅ Integración con métodos del modelo
- ✅ Análisis de datos históricos
- ✅ Sugerencias inteligentes de cuadrilla y herramientas
- ✅ Endpoint: `POST /api/instalaciones/sugerencias`
- ✅ Rutas actualizadas para usar nueva lógica

**Documentación:**
- ✅ `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md`
- ✅ `docschecklists/IMPLEMENTACION_COMPLETADA.md`
- ✅ `docschecklists/FASE_1_UNIFICACION_MODELOS.md`
- ✅ `docschecklists/ANALISIS_FABRICACION_ACTUAL.md`
- ✅ `docschecklists/auditorias/AUDITORIA_FASE_1_DIA_0.md`
- ✅ `docschecklists/auditorias/AUDITORIA_ENDPOINTS_FASE_1.md`

**Día 3: Scripts de Migración** ✅ ⭐
- ✅ Creado `migrarProyectoPedidoAProyecto.js` (444 líneas)
- ✅ Mapeo completo de campos: fabricación, instalación, pagos, notas
- ✅ Normalización de estados y roles
- ✅ Merge inteligente de proyectos existentes
- ✅ Creado `validarMigracion.js` (226 líneas)
- ✅ Validación de totales, estados y teléfonos
- ✅ Logging estructurado con estadísticas
- ✅ Detección de discrepancias

**Día 4: Deprecación** ✅ ⭐
- ✅ Renombrado `Fabricacion.js` → `Fabricacion.legacy.js`
- ✅ Renombrado `ProyectoPedido.js` → `ProyectoPedido.legacy.js`
- ✅ Agregados banners de deprecación con warnings en runtime
- ✅ Actualizados 13 archivos con imports a `.legacy`
- ✅ Creado `docschecklists/MODELOS_LEGACY.md`
- ✅ Documentación completa de modelos deprecados
- ✅ Compatibilidad mantenida con código existente

**Documentación Final:**
- ✅ `docschecklists/MODELOS_LEGACY.md` - Guía de deprecación

---

## 🎊 FASE 1 COMPLETADA AL 100%

### Resumen de Logros

**Modelo Unificado:**
- ✅ Proyecto.js con 5 secciones completas (1,241 líneas)
- ✅ 4 métodos inteligentes implementados
- ✅ 100% KPIs comerciales preservados

**Endpoints y Services:**
- ✅ 4 endpoints funcionales con validaciones
- ✅ QR Generator resiliente con fallback
- ✅ 2 services actualizados e integrados

**Migración:**
- ✅ Scripts completos de migración y validación
- ✅ Modelos legacy deprecados correctamente
- ✅ 13 archivos actualizados con imports

**Métricas Totales:**
- 📊 Archivos creados: 9
- 📊 Archivos modificados: 22
- 📊 Líneas agregadas: +2,044
- 📊 Documentos técnicos: 7

---

## 🎉 FASE 2 COMPLETADA (100%)

### ✅ COMPLETADO

**Bloqueante Crítico #1: Módulo Fabricación** ✅ (1 Nov 2025)
- ✅ Creado `fabricacionController.js` (346 líneas)
- ✅ 4 handlers principales implementados
- ✅ Helpers de utilidad exportados
- ✅ Routes simplificadas (365 → 37 líneas, -328)
- ✅ Tests unitarios creados (125 líneas)
- ✅ 5/5 tests pasando ✅

**Pruebas Unitarias Básicas** ✅ (4 Nov 2025)
- ✅ Tests para Pedido Controller (3 tests)
- ✅ Tests para PDF Service (4 tests)
- ✅ Tests para Excel Service (5 tests)
- ✅ Corregido test de Logger (4 tests)
- ✅ 32/32 tests pasando ✅ (100%)

**Archivos Creados:**
- `server/controllers/fabricacionController.js`
- `server/routes/fabricacion.js` (refactorizado)
- `server/tests/controllers/fabricacionController.test.js`
- `server/tests/controllers/pedidoController.test.js`
- `server/tests/services/pdfService.test.js`
- `server/tests/services/excelService.test.js`

**Métricas Fase 2:**
- 📊 Archivos creados: 5
- 📊 Archivos modificados: 2
- 📊 Tests agregados: 17
- 📊 Tests totales: 32/32 pasando ✅

---

## 🔍 VERIFICACIONES RÁPIDAS

```bash
# Fase 0
rg "console\.log" server              # Debe regresar sin resultados
npm test -- --runInBand                # 32/32 tests pasando ✅

# Fase 1
node -e "const P = require('./server/models/Proyecto'); console.log(typeof P.schema.methods.generarEtiquetasProduccion)"  # function

# Fase 2
npm test -- fabricacionController.test.js  # 5/5 tests pasando
npm test -- pedidoController.test.js       # 3/3 tests pasando
npm test -- pdfService.test.js             # 4/4 tests pasando
npm test -- excelService.test.js           # 5/5 tests pasando
```

---

## 📋 ESTÁNDAR DE LOGGING (PERMANENTE)

1. **Importar logger**
   ```javascript
   const logger = require('../config/logger');
   ```
   Ajusta la ruta relativa según la ubicación del archivo.

2. **Contexto mínimo obligatorio**
   - `script` o `archivo`
   - Identificadores clave (`id`, `proyectoId`, `cotizacionId`, etc.)
   - Conteos o resúmenes (`totalRegistros`, `itemsProcesados`)

3. **Niveles de severidad**
   - `logger.info` para operaciones normales
   - `logger.warn` para inconsistencias recuperables
   - `logger.error` con `{ error: error.message, stack: error.stack }`

4. **Cierres de recursos**
   - Encapsular cierres de conexión en bloques `finally`
   - Registrar éxito y errores al cerrar conexiones externas

5. **Validaciones**
   - Registrar advertencias cuando la entrada sea incompleta o duplicada
   - Documentar decisiones automáticas (ej. normalizaciones, skips)

Estas reglas aplican a cualquier nueva funcionalidad del repositorio.

---

## 🗂️ HISTÓRICO DE LA MIGRACIÓN

- Parte 1: Middleware, modelos y services (36 console.log) ✅
- Parte 2: Rutas principales y scripts grandes (85 console.log) ✅
- Parte 3: Scripts utilitarios y de mantenimiento (71 console.log) ✅

> Total acumulado: **419 console.log eliminados**.

---

## 🎊 FASES 0, 1 Y 2 COMPLETADAS

**Estado:** ✅ 3 FASES COMPLETADAS AL 100%

### Resumen de Logros

**Fase 0: Baseline y Observabilidad** ✅
- 419 console.log eliminados
- Logger estructurado implementado
- 15/15 tests iniciales pasando

**Fase 1: Unificación de Modelos** ✅
- Modelo Proyecto.js unificado (1,241 líneas)
- 4 endpoints funcionales
- 2 services actualizados
- Scripts de migración completos
- Modelos legacy deprecados

**Fase 2: Desacoplo y Confiabilidad** ✅
- Módulo fabricación corregido
- 17 tests unitarios agregados
- 32/32 tests pasando (100%)
- Cobertura en módulos críticos

---

## 🎉 FASE 3 COMPLETADA (100%)

### ✅ COMPLETADO (4 Nov 2025)

**Auditoría y Documentación del Sistema** ✅
- ✅ Modelos principales auditados (6 modelos)
- ✅ Controllers y routes documentados (27 archivos)
- ✅ Servicios analizados (13 activos)
- ✅ Flujo completo documentado
- ✅ Documento `/docs/auditoria_sistema_actual.md` completado (320 líneas)
- ✅ Radiografía completa del sistema agregada
- ✅ Tablas priorizadas de riesgos y sugerencias

**Hallazgos Clave:**
- ⚠️ **Riesgo Crítico:** Doble flujo Proyecto vs ProyectoPedido
- ⚠️ **Duplicidad:** Endpoints de exportación duplicados
- ⚠️ **Dependencia Legacy:** KPIs leyendo de ProyectoPedido.legacy
- 💡 **Oportunidad:** Consolidar lógica en controllers

**Mejoras en Documentación:**
- 📊 Radiografía completa con tabla de estado por área
- 🎯 Plan de 3 sprints compacto y priorizado
- ✅ Checklist operativa para implementación
- 🔍 Comandos útiles para análisis y migración

**Métricas de Auditoría:**
- 📊 Modelos: 19 (6 principales auditados)
- 📊 Controllers: 5 principales
- 📊 Routes: 27 archivos
- 📊 Services: 13 activos
- 📊 Tests: 32/32 ✅

**Documento Generado:**
- `docs/auditoria_sistema_actual.md` (320 líneas)
- Clasificación completa: ✅ Activos | ⚙️ Parciales | ❌ Inactivos
- Matriz de riesgos: 🔴 Críticos | 🟡 Medios | 🟢 Bajos
- Sugerencias priorizadas: Inmediatas | Corto plazo | Largo plazo

### 🚀 PRÓXIMOS PASOS (Post-Fase 3)

**Consolidación Legacy Implementada:** ✅
- Métodos portados a Pedido.js
- syncLegacyService.js creado
- KPI.js actualizado con adaptador
- Script de migración listo

**Consultar:** `docs/fase3_consolidacion.md` para detalles completos

---

## 🎯 FASE 4: EJECUCIÓN DE MIGRACIÓN (PENDIENTE)

### 📋 PLAN DE EJECUCIÓN PASO A PASO

#### 📖 PASO 0: LEER DOCUMENTACIÓN (5 min)

Lee en este orden:
1. `CONTINUAR_AQUI.md` ⬅️ **EMPEZAR AQUÍ** (plan de ejecución)
2. `docs/fase3_consolidacion.md` (contexto técnico)
3. `docs/analisis_consolidacion_legacy.md` (detalles de implementación)

#### 🚀 PASO 1: BACKUP (CRÍTICO - NO OMITIR)

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

#### 🧪 PASO 2: MIGRACIÓN DE PRUEBA (10 registros)

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

#### 🔍 PASO 3: VALIDACIÓN DE PRUEBA

```bash
# Verificar que los datos se migraron correctamente
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); Pedido.find().limit(10).then(pedidos => { console.log('Pedidos migrados:', pedidos.length); pedidos.forEach(p => { console.log('ID:', p._id, 'Total:', p.total, 'Fuente:', p.fuenteDatos); }); process.exit(0); });"
```

**✅ Criterio de éxito:**
- Muestra 10 pedidos
- Todos tienen campo `fuenteDatos`
- Totales son consistentes

#### ⚠️ PUNTO DE DECISIÓN

**SI la prueba fue exitosa (✅):** Continúa al Paso 4
**SI hubo errores (❌):** DETENTE y reporta los logs completos

#### 🚀 PASO 4: MIGRACIÓN COMPLETA (100%)

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

#### 🔍 PASO 5: VALIDACIÓN COMPLETA

```bash
# Verificar totales
node -e "const mongoose = require('mongoose'); const Pedido = require('./server/models/Pedido'); mongoose.connect('mongodb://localhost:27017/sundeck'); async function validar() { const total = await Pedido.countDocuments(); const conFuente = await Pedido.countDocuments({ fuenteDatos: { \$exists: true } }); const totalMonto = await Pedido.aggregate([{ \$group: { _id: null, total: { \$sum: '\$total' } } }]); console.log('Total pedidos:', total); console.log('Con fuenteDatos:', conFuente); console.log('Monto total:', totalMonto[0]?.total || 0); process.exit(0); } validar();"
```

#### 📊 PASO 6: VALIDAR KPIs

```bash
# Probar que los KPIs siguen funcionando
curl http://localhost:5001/api/kpis/comerciales
curl http://localhost:5001/api/kpis/operacionales
```

**✅ Criterio de éxito:**
- Ambos endpoints responden 200 OK
- Datos son consistentes
- Sin errores en consola del servidor

#### 📝 PASO 7: GENERAR REPORTE

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

#### 📤 PASO 8: ENTREGAR RESUMEN

Proporcionar resumen con:

1. **Estado general:** ✅/❌/⚠️
2. **Métricas clave:**
   - Registros migrados
   - Totales coinciden
   - Errores encontrados
3. **Logs importantes** (si hay errores)
4. **Recomendación:** CONTINUAR / ROLLBACK / REVISAR
5. **Ubicación del reporte completo:** `docs/consolidacion_resultados.md`

---

### ⚠️ REGLAS CRÍTICAS PARA MIGRACIÓN

#### ❌ NUNCA:
- Omitir el backup
- Migrar 100% sin probar 10 primero
- Ignorar errores
- Continuar si los totales no coinciden
- Modificar el código de migración

#### ✅ SIEMPRE:
- Hacer backup primero
- Probar con 10 antes de 100%
- Validar totales en cada paso
- Documentar errores
- Reportar discrepancias

---

### 🆘 SI ALGO SALE MAL

**Errores de Conexión:**
```bash
# Verificar MongoDB
mongosh
show dbs
use sundeck
db.pedidos.countDocuments()
```

**Errores en el Script:**
```bash
# Ver logs completos
node server/scripts/ejecutarConsolidacionLegacy.js 10 2>&1 | tee migracion.log
```

**Rollback (si es necesario):**
```bash
# Restaurar backup
mongorestore --db sundeck --drop backup_pre_migracion/sundeck/
```

---

### 📊 FORMATO DE ENTREGA REQUERIDO

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
