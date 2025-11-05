# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 4 Nov 2025
**Estado:** Fase 0 ✅ COMPLETADA | Fase 1 ✅ COMPLETADA | Fase 2 ✅ COMPLETADA | Fase 3 ✅ COMPLETADA

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
- ✅ Documento `/docs/auditoria_sistema_actual.md` completado

**Hallazgos Clave:**
- ⚠️ **Riesgo Crítico:** Doble flujo Proyecto vs ProyectoPedido
- ⚠️ **Duplicidad:** Endpoints de exportación duplicados
- ⚠️ **Dependencia Legacy:** KPIs leyendo de ProyectoPedido.legacy
- 💡 **Oportunidad:** Consolidar lógica en controllers

**Métricas de Auditoría:**
- 📊 Modelos: 19 (6 principales auditados)
- 📊 Controllers: 5 principales
- 📊 Routes: 27 archivos
- 📊 Services: 13 activos
- 📊 Tests: 32/32 ✅

**Documento Generado:**
- `docs/auditoria_sistema_actual.md` (309 líneas)
- Clasificación completa: ✅ Activos | ⚙️ Parciales | ❌ Inactivos
- Matriz de riesgos: 🔴 Críticos | 🟡 Medios | 🟢 Bajos
- Sugerencias priorizadas: Inmediatas | Corto plazo | Largo plazo

---
