# 🚀 CONTINUAR AQUÍ - Día 4: Deprecación de Modelos Legacy

**Última actualización:** 31 Octubre 2025 - 18:19  
**Estado:** Fase 1 EN PROGRESO (90%)  
**Próxima tarea:** Deprecar modelos legacy y actualizar imports

---

## ✅ LO COMPLETADO HASTA AHORA

### Día 0: Modelo Unificado ✅
- ✅ `Proyecto.js` con 5 secciones nuevas (1,241 líneas)
- ✅ 4 métodos inteligentes implementados

### Día 1: Endpoints ✅
- ✅ 3 endpoints funcionales
- ✅ QR Generator resiliente

### Día 2: Services Actualizados ✅
- ✅ `FabricacionService` migrado a `Proyecto`
- ✅ `InstalacionesInteligentesService` reescrito

### Día 3: Scripts de Migración ✅
- ✅ `migrarProyectoPedidoAProyecto.js` (444 líneas)
- ✅ `validarMigracion.js` (226 líneas)

**Progreso:** 90% de Fase 1 completado

---

## 📋 PRÓXIMA SESIÓN: Día 4 - Deprecación de Modelos Legacy

### Objetivo
Marcar los modelos `Fabricacion.js` y `ProyectoPedido.js` como legacy (deprecated) para evitar su uso futuro, actualizando todos los imports existentes.

---

## 🔍 PASO 1: Identificar Archivos que Usan Modelos Legacy

### Buscar usos de `Fabricacion`

```bash
# Buscar imports de Fabricacion
rg "require.*Fabricacion" server --type js

# Buscar imports ES6
rg "from.*Fabricacion" server --type js

# Buscar usos directos
rg "Fabricacion\." server --type js
```

### Buscar usos de `ProyectoPedido`

```bash
# Buscar imports de ProyectoPedido
rg "require.*ProyectoPedido" server --type js

# Buscar imports ES6
rg "from.*ProyectoPedido" server --type js

# Buscar usos directos
rg "ProyectoPedido\." server --type js
```

---

## 📝 PASO 2: Renombrar Modelos a .legacy.js

### 1. Renombrar Fabricacion.js

```bash
# Renombrar archivo
mv server/models/Fabricacion.js server/models/Fabricacion.legacy.js
```

**Agregar aviso de deprecación al inicio del archivo:**

```javascript
/**
 * @deprecated Este modelo está deprecado. Usar Proyecto.fabricacion en su lugar.
 * 
 * MODELO LEGACY - NO USAR EN CÓDIGO NUEVO
 * 
 * Este modelo se mantiene solo para compatibilidad con código existente.
 * Para nuevas funcionalidades, usar el modelo unificado Proyecto.js
 * 
 * Migración: server/scripts/migrarProyectoPedidoAProyecto.js
 * 
 * @see server/models/Proyecto.js
 * @since Legacy (pre-unificación)
 * @deprecated Desde 31 Oct 2025
 */

console.warn('⚠️ ADVERTENCIA: Fabricacion.legacy.js está deprecado. Usar Proyecto.fabricacion');
```

---

### 2. Renombrar ProyectoPedido.js

```bash
# Renombrar archivo
mv server/models/ProyectoPedido.js server/models/ProyectoPedido.legacy.js
```

**Agregar aviso de deprecación al inicio del archivo:**

```javascript
/**
 * @deprecated Este modelo está deprecado. Usar Proyecto en su lugar.
 * 
 * MODELO LEGACY - NO USAR EN CÓDIGO NUEVO
 * 
 * Este modelo se mantiene solo para compatibilidad con código existente.
 * Para nuevas funcionalidades, usar el modelo unificado Proyecto.js
 * 
 * Migración: server/scripts/migrarProyectoPedidoAProyecto.js
 * Validación: server/scripts/validarMigracion.js
 * 
 * @see server/models/Proyecto.js
 * @since Legacy (pre-unificación)
 * @deprecated Desde 31 Oct 2025
 */

console.warn('⚠️ ADVERTENCIA: ProyectoPedido.legacy.js está deprecado. Usar Proyecto');
```

---

## 🔧 PASO 3: Actualizar Imports en Archivos Existentes

### Archivos que probablemente necesitan actualización:

#### 1. Routes
```javascript
// server/routes/fabricacion.js
// ANTES:
const Fabricacion = require('../models/Fabricacion');

// DESPUÉS:
const Fabricacion = require('../models/Fabricacion.legacy');
// TODO: Migrar a usar Proyecto

// server/routes/instalaciones.js
// ANTES:
const Fabricacion = require('../models/Fabricacion');

// DESPUÉS:
const Fabricacion = require('../models/Fabricacion.legacy');
// TODO: Migrar a usar Proyecto
```

#### 2. Scripts de migración
```javascript
// server/scripts/migrarProyectoPedidoAProyecto.js
// ANTES:
const ProyectoPedido = require('../models/ProyectoPedido');

// DESPUÉS:
const ProyectoPedido = require('../models/ProyectoPedido.legacy');

// server/scripts/validarMigracion.js
// ANTES:
const ProyectoPedido = require('../models/ProyectoPedido');

// DESPUÉS:
const ProyectoPedido = require('../models/ProyectoPedido.legacy');
```

#### 3. Otros archivos
Actualizar cualquier otro archivo que importe estos modelos.

---

## 📋 PASO 4: Crear Archivo de Documentación

### Crear: `docschecklists/MODELOS_LEGACY.md`

```markdown
# 📦 MODELOS LEGACY - NO USAR

**Fecha de deprecación:** 31 Octubre 2025  
**Razón:** Unificación de modelos en Proyecto.js

---

## ⚠️ MODELOS DEPRECADOS

### 1. Fabricacion.legacy.js

**Estado:** ❌ DEPRECADO  
**Reemplazo:** `Proyecto.fabricacion`

**Razón de deprecación:**
- Duplicidad con ProyectoPedido.fabricacion
- Falta de integración con ciclo de vida completo
- Datos fragmentados en múltiples colecciones

**Migración:**
```javascript
// ANTES (NO USAR):
const Fabricacion = require('./models/Fabricacion.legacy');
const fab = await Fabricacion.findById(id);

// DESPUÉS (USAR):
const Proyecto = require('./models/Proyecto');
const proyecto = await Proyecto.findById(id);
const fabricacion = proyecto.fabricacion;
```

---

### 2. ProyectoPedido.legacy.js

**Estado:** ❌ DEPRECADO  
**Reemplazo:** `Proyecto`

**Razón de deprecación:**
- Nombre confuso (mezcla proyecto y pedido)
- Duplicidad con modelo Proyecto
- Campos incompletos vs modelo unificado

**Migración:**
```javascript
// ANTES (NO USAR):
const ProyectoPedido = require('./models/ProyectoPedido.legacy');
const pp = await ProyectoPedido.findById(id);

// DESPUÉS (USAR):
const Proyecto = require('./models/Proyecto');
const proyecto = await Proyecto.findById(id);
```

---

## 🔄 SCRIPTS DE MIGRACIÓN

### Migrar datos existentes

```bash
# Migrar ProyectoPedido → Proyecto
node server/scripts/migrarProyectoPedidoAProyecto.js

# Validar migración
node server/scripts/validarMigracion.js
```

---

## 📊 COMPARACIÓN DE MODELOS

| Característica | Legacy | Unificado (Proyecto) |
|----------------|--------|----------------------|
| **Ciclo de vida completo** | ❌ | ✅ |
| **Fabricación integrada** | ❌ | ✅ |
| **Instalación integrada** | ❌ | ✅ |
| **Pagos estructurados** | ❌ | ✅ |
| **Historial de notas** | ❌ | ✅ |
| **Métodos inteligentes** | ❌ | ✅ |
| **Etiquetas de producción** | ❌ | ✅ |
| **Optimización de rutas** | ❌ | ✅ |

---

## ⚡ ACCIÓN REQUERIDA

### Para Desarrolladores

1. **NO usar** `Fabricacion.legacy.js` en código nuevo
2. **NO usar** `ProyectoPedido.legacy.js` en código nuevo
3. **USAR** `Proyecto.js` para todas las funcionalidades
4. **MIGRAR** código existente gradualmente

### Cronograma de Eliminación

- **Fase 1 (Actual):** Deprecación y avisos
- **Fase 2 (1 mes):** Migración de código existente
- **Fase 3 (2 meses):** Eliminación de archivos legacy

---

## 📚 DOCUMENTACIÓN

- **Modelo unificado:** `server/models/Proyecto.js`
- **Requisitos:** `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md`
- **Implementación:** `docschecklists/IMPLEMENTACION_COMPLETADA.md`
- **Migración:** `server/scripts/migrarProyectoPedidoAProyecto.js`

---

**Última actualización:** 31 Octubre 2025  
**Responsable:** Equipo Desarrollo CRM Sundeck
```

---

## 📋 Checklist de Tareas

- [ ] **Tarea 1:** Identificar archivos que usan modelos legacy
  - [ ] Buscar usos de `Fabricacion`
  - [ ] Buscar usos de `ProyectoPedido`
  - [ ] Documentar archivos encontrados

- [ ] **Tarea 2:** Renombrar archivos
  - [ ] `Fabricacion.js` → `Fabricacion.legacy.js`
  - [ ] `ProyectoPedido.js` → `ProyectoPedido.legacy.js`
  - [ ] Agregar avisos de deprecación

- [ ] **Tarea 3:** Actualizar imports
  - [ ] Actualizar routes
  - [ ] Actualizar scripts
  - [ ] Actualizar otros archivos

- [ ] **Tarea 4:** Crear documentación
  - [ ] Crear `MODELOS_LEGACY.md`
  - [ ] Documentar razones de deprecación
  - [ ] Documentar proceso de migración

- [ ] **Tarea 5:** Verificar funcionamiento
  - [ ] Ejecutar tests
  - [ ] Verificar que no hay errores
  - [ ] Actualizar AGENTS.md

---

## ⚠️ IMPORTANTE

### NO Eliminar Archivos
- Los archivos legacy se mantienen para compatibilidad
- Solo se renombran y marcan como deprecados
- Se eliminarán en Fase 2 (después de migrar todo el código)

### Avisos en Consola
- Los modelos legacy mostrarán advertencias en consola
- Esto ayuda a identificar código que aún los usa
- Facilita la migración gradual

---

## 📚 DOCUMENTOS DE REFERENCIA

- `server/models/Proyecto.js` - Modelo unificado
- `server/models/Fabricacion.js` - A renombrar
- `server/models/ProyectoPedido.js` - A renombrar
- `docschecklists/FASE_1_UNIFICACION_MODELOS.md` - Plan completo

---

## 📊 PROGRESO FASE 1

```
Día 0: Modelo Unificado        ████████████████████ 100% ✅
Día 1: Endpoints               ████████████████████ 100% ✅
Día 2: Services Actualizados   ████████████████████ 100% ✅
Día 3: Scripts de Migración    ████████████████████ 100% ✅
Día 4: Deprecación             ░░░░░░░░░░░░░░░░░░░░   0% ⬅️ AQUÍ

Total: ██████████████████░░ 90%
```

---

**Responsable:** Próximo Agente  
**Duración estimada:** 1-2 horas  
**Complejidad:** Baja  
**Riesgo:** Bajo (solo renombrar y marcar)

**¡Listo para deprecación!** 🚀
