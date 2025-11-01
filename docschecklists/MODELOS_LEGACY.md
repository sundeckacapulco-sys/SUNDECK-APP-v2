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
