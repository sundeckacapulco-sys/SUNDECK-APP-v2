# 🤖 INSTRUCCIONES PARA AGENTES

**Fecha:** 31 Oct 2025
**Estado:** Fase 0 - COMPLETADA al 100%

---

## 🎉 RESUMEN

- 419 console.log migrados → 0 restantes ✅
- Logger estructurado aplicado en todos los scripts críticos ✅
- Scripts de datos y mantenimiento con cierres y validaciones trazables ✅
- 15/15 pruebas unitarias y de integración pasando ✅

El sistema quedó listo para iniciar la siguiente fase sin deuda técnica pendiente en logging.

---

## 🔍 VERIFICACIONES RÁPIDAS

```bash
rg "console\.log" server              # Debe regresar sin resultados
npm test -- --runInBand                # 15/15 pruebas pasando
```

Si se agregan nuevos scripts, repetir estas verificaciones antes de concluir el trabajo.

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
