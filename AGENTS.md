# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 31 Oct 2025
**Estado:** Fase 0 ✅ COMPLETADA | Fase 1 🔄 EN PROGRESO

---

## 🎉 FASE 0 COMPLETADA (100%)

- 419 console.log migrados → 0 restantes ✅
- Logger estructurado aplicado en todos los scripts críticos ✅
- Scripts de datos y mantenimiento con cierres y validaciones trazables ✅
- 15/15 pruebas unitarias y de integración pasando ✅

---

## 🚀 FASE 1 EN PROGRESO (90%)

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

### ⏳ PENDIENTE (Próxima Sesión - Día 4)

**Día 4: Deprecación** ⬅️ EMPEZAR AQUÍ
- [ ] Renombrar `Fabricacion.js` → `Fabricacion.legacy.js`
- [ ] Renombrar `ProyectoPedido.js` → `ProyectoPedido.legacy.js`
- [ ] Actualizar imports en archivos afectados
- [ ] Marcar como deprecated en código

**Día 5: Validación Final**
- [ ] Verificar KPIs comerciales intactos
- [ ] Pruebas de integración completas
- [ ] Documentación actualizada
- [ ] Auditoría final de Fase 1

---

## 🔍 VERIFICACIONES RÁPIDAS

```bash
# Fase 0
rg "console\.log" server              # Debe regresar sin resultados
npm test -- --runInBand                # 15/15 pruebas pasando

# Fase 1
node -e "const P = require('./server/models/Proyecto'); console.log(typeof P.schema.methods.generarEtiquetasProduccion)"  # function
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

## ✅ FASE 0 COMPLETADA - PRÓXIMOS PASOS

**Fase 0: 100% ✅** - Baseline y Observabilidad completada exitosamente.

### Mantenimiento Continuo:
1. Mantener la cobertura de pruebas (`npm test`) como parte del flujo habitual.
2. Auditar nuevos commits para verificar que no se reintroduzcan `console.log`.
3. Cuando se creen scripts adicionales, iniciar con un helper `createLoggerContext` para reutilizar metadatos.

### 🚀 INICIAR FASE 1: Desacoplo y Confiabilidad (1-4 meses)

**Bloqueantes Críticos Identificados:**

1. **🔴 PRIORIDAD MÁXIMA: Unificar Dominio de Pedidos**
   - Problema: Duplicidad `Pedido` vs `ProyectoPedido`
   - Impacto: Riesgo de divergencia de datos
   - Esfuerzo: 5-7 días
   - Ubicación: `server/models/Pedido.js` y `server/models/ProyectoPedido.js`

2. **🔴 ALTA PRIORIDAD: Corregir Módulo Fabricación**
   - Problema: Imports faltantes, módulo no funcional
   - Impacto: Bloquea flujo de producción
   - Esfuerzo: 2-3 días
   - Ubicación: `server/controllers/fabricacionController.js`

3. **⚠️ MEDIA PRIORIDAD: Pruebas Unitarias Básicas**
   - Problema: 0% cobertura en módulos críticos
   - Impacto: Sin garantías de calidad
   - Esfuerzo: 3-4 días
   - Módulos: PDF, Excel, Pedidos, Fabricación

**Consultar:** `docschecklists/ROADMAP_TASKS.md` para plan detallado de Fase 1.

¡Fase 0 completada exitosamente! 🎉
