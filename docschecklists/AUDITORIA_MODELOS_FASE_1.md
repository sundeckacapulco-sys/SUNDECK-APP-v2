# 🔍 AUDITORÍA DE MODELOS - FASE 1

**Fecha:** 31 Octubre 2025  
**Objetivo:** Identificar uso de modelos duplicados y planificar migración  
**Estado:** ✅ Auditoría completada

---

## 📊 RESUMEN EJECUTIVO

### Hallazgos Principales

1. ✅ **`Proyecto.js`** - Núcleo central funcionando correctamente
2. ⚠️ **`Pedido.js`** - Modelo simple, usado en 4 archivos
3. ⚠️ **`ProyectoPedido.js`** - Modelo completo, usado en 8 archivos
4. ⚠️ **`Fabricacion.js`** - Usado en 3 archivos
5. ✅ **`OrdenFabricacion.js`** - Ya existe referencia en 1 archivo

### Conclusión

**NO hay duplicidad crítica con `Proyecto.js`**. Los modelos `Pedido`, `ProyectoPedido` y `Fabricacion` son **complementarios** al flujo de Proyectos, no duplicados.

**Estrategia recomendada:** Mantener arquitectura actual y solo **corregir módulo de Fabricación**.

---

## 📋 ANÁLISIS DETALLADO POR MODELO

### 1. `Pedido.js` - Modelo Simple

**Archivos que lo usan (4):**

1. **`routes/instalaciones.js`** (línea 4)
   ```javascript
   const Pedido = require('../models/Pedido');
   ```
   - **Uso:** Gestión de instalaciones vinculadas a pedidos
   - **Función:** Obtener información de pedidos para programar instalaciones

2. **`routes/produccion.js`** (línea 3)
   ```javascript
   const Pedido = require('../models/Pedido');
   ```
   - **Uso:** Gestión de producción vinculada a pedidos
   - **Función:** Obtener información de pedidos para fabricación

3. **`routes/dashboard.js`** (línea 4)
   ```javascript
   const Pedido = require('../models/Pedido');
   ```
   - **Uso:** Dashboard de KPIs
   - **Función:** Métricas de pedidos (ventas, anticipos, estados)

4. **`services/sincronizacionService.js`** (línea 3)
   ```javascript
   const Pedido = require('../models/Pedido');
   ```
   - **Uso:** Sincronización entre modelos
   - **Función:** Mantener consistencia entre Proyecto, Cotizacion y Pedido

**Análisis:**
- ✅ Modelo activo y en uso
- ✅ Función clara: Gestión de pedidos comerciales
- ✅ NO duplica `Proyecto.js` - Es complementario
- ⚠️ Podría estar referenciado desde `Proyecto.js` (línea 331-334)

**Recomendación:** **MANTENER** - Es parte del flujo comercial

---

### 2. `ProyectoPedido.js` - Modelo Completo

**Archivos que lo usan (8):**

1. **`controllers/proyectoPedidoController.js`** (línea 1)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Controller principal de ProyectoPedido
   - **Función:** CRUD completo de proyectos-pedidos

2. **`routes/fabricacion.js`** (línea 2)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Rutas de fabricación
   - **Función:** Obtener datos de proyectos para fabricación

3. **`routes/kpis.js`** (línea 5)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** KPIs y métricas
   - **Función:** Calcular métricas de proyectos-pedidos

4. **`services/fabricacionService.js`** (línea 1)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Servicio de fabricación
   - **Función:** Lógica de negocio de fabricación

5. **`services/instalacionesInteligentesService.js`** (línea 9)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Servicio de instalaciones con IA
   - **Función:** Sugerencias inteligentes basadas en proyectos

6. **`scripts/crearDatosSimple.js`** (línea 2)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Script de datos de prueba
   - **Función:** Crear proyectos-pedidos de ejemplo

7. **`scripts/crearProyectosPrueba.js`** (línea 2)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Script de proyectos de prueba
   - **Función:** Generar datos de prueba

8. **`scripts/migrarAProyectos.js`** (línea 6)
   ```javascript
   const ProyectoPedido = require('../models/ProyectoPedido');
   ```
   - **Uso:** Script de migración
   - **Función:** Migrar datos de ProyectoPedido a Proyecto

**Análisis:**
- ⚠️ Modelo usado activamente en producción
- ⚠️ Tiene controller propio (proyectoPedidoController.js)
- ⚠️ Usado en KPIs y fabricación
- ⚠️ Existe script de migración a Proyecto.js (línea 6)

**Pregunta crítica:** ¿`ProyectoPedido` es un modelo legacy que se está migrando a `Proyecto`?

**Recomendación:** **INVESTIGAR** - Verificar si es legacy o activo

---

### 3. `Fabricacion.js` - Modelo de Fabricación

**Archivos que lo usan (3):**

1. **`routes/instalaciones.js`** (línea 3)
   ```javascript
   const Fabricacion = require('../models/Fabricacion');
   ```
   - **Uso:** Rutas de instalaciones
   - **Función:** Verificar fabricación completada antes de instalar

2. **`routes/produccion.js`** (línea 2)
   ```javascript
   const Fabricacion = require('../models/Fabricacion');
   ```
   - **Uso:** Rutas de producción
   - **Función:** CRUD de órdenes de fabricación

3. **`routes/dashboard.js`** (línea 5)
   ```javascript
   const Fabricacion = require('../models/Fabricacion');
   ```
   - **Uso:** Dashboard de KPIs
   - **Función:** Métricas de fabricación

**Análisis:**
- ⚠️ Modelo usado en 3 archivos
- ⚠️ Según README_MASTER.md: "30% funcional, imports faltantes"
- 🔴 **BLOQUEANTE IDENTIFICADO:** Módulo no funcional

**Recomendación:** **CORREGIR URGENTE** - Bloqueante de Fase 1

---

### 4. `OrdenFabricacion.js` - Modelo Nuevo

**Archivos que lo usan (1):**

1. **`services/sincronizacionService.js`** (línea 4)
   ```javascript
   const OrdenFabricacion = require('../models/OrdenFabricacion');
   ```
   - **Uso:** Servicio de sincronización
   - **Función:** Sincronizar órdenes de fabricación

**Análisis:**
- ✅ Ya existe referencia en código
- ⚠️ Pero el modelo `OrdenFabricacion.js` **NO EXISTE** en `/models/`
- 🔴 **ERROR:** Referencia a modelo inexistente

**Recomendación:** **CREAR** - El modelo está referenciado pero no existe

---

## 🎯 ESTRATEGIA DE MIGRACIÓN AJUSTADA

### Hallazgo Importante

**`Proyecto.js` NO tiene duplicidad con `Pedido.js` ni `ProyectoPedido.js`**

Según el análisis:
- `Proyecto.js` (líneas 331-334) **ya tiene referencias** a `Pedido`:
  ```javascript
  pedidos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedido'
  }]
  ```

Esto significa que **`Pedido` es un modelo complementario**, no duplicado.

### Arquitectura Actual (Descubierta)

```
Proyecto (núcleo comercial)
  ├── cotizaciones[] → Cotizacion
  ├── pedidos[] → Pedido (modelo simple)
  ├── ordenes_fabricacion[] → OrdenFabricacion (NO EXISTE)
  └── instalaciones[] → Instalacion

ProyectoPedido (¿legacy o paralelo?)
  └── Modelo completo con todo el ciclo
```

### Pregunta Crítica

**¿`ProyectoPedido` es:**
1. **Modelo legacy** que se está migrando a `Proyecto`? (evidencia: script migrarAProyectos.js)
2. **Modelo paralelo** que coexiste con `Proyecto`?
3. **Modelo temporal** para casos específicos?

**Evidencia de que es legacy:**
- Existe `scripts/migrarAProyectos.js` (línea 6)
- El README dice "Proyectos Unificados" como núcleo central
- `Proyecto.js` tiene todas las capacidades de `ProyectoPedido`

---

## 📊 PLAN DE ACCIÓN REVISADO

### Opción A: ProyectoPedido es Legacy (Recomendado)

Si `ProyectoPedido` es legacy y se está migrando a `Proyecto`:

1. ✅ **Mantener `Proyecto.js`** como núcleo (ya está)
2. ✅ **Mantener `Pedido.js`** como modelo complementario (ya está)
3. 🔧 **Corregir `Fabricacion.js`** (bloqueante)
4. 🆕 **Crear `OrdenFabricacion.js`** (ya referenciado)
5. 📦 **Deprecar `ProyectoPedido.js`** (migrar datos restantes)

**Pasos:**
1. Completar migración de `ProyectoPedido` → `Proyecto` (script ya existe)
2. Corregir imports de `Fabricacion.js`
3. Crear `OrdenFabricacion.js` (ya referenciado en sincronizacionService.js)
4. Actualizar rutas y controllers para usar `Proyecto` + `Pedido` + `OrdenFabricacion`

### Opción B: ProyectoPedido es Activo

Si `ProyectoPedido` coexiste con `Proyecto`:

1. ✅ **Mantener ambos modelos**
2. 🔧 **Corregir `Fabricacion.js`**
3. 🆕 **Crear `OrdenFabricacion.js`**
4. 📝 **Documentar cuándo usar cada uno**

---

## 🔍 VERIFICACIÓN NECESARIA

### Paso 1: Verificar Base de Datos

```bash
# Conectar a MongoDB
mongo sundeck_crm

# Contar documentos
db.proyectos.count()
db.pedidos.count()
db.proyectopedidos.count()
db.fabricaciones.count()
db.instalaciones.count()

# Ver ejemplos
db.proyectos.findOne()
db.proyectopedidos.findOne()
```

### Paso 2: Analizar Script de Migración

```bash
# Revisar script de migración existente
cat server/scripts/migrarAProyectos.js
```

### Paso 3: Verificar Modelo Fabricacion.js

```bash
# Ver contenido del modelo
cat server/models/Fabricacion.js

# Buscar imports faltantes
grep "require" server/models/Fabricacion.js
```

---

## ✅ CONCLUSIONES

### Hallazgos Clave

1. ✅ **`Proyecto.js` es el núcleo central** - Confirmado
2. ✅ **`Pedido.js` es complementario** - NO es duplicado
3. ⚠️ **`ProyectoPedido.js` posiblemente legacy** - Requiere verificación
4. 🔴 **`Fabricacion.js` no funcional** - Bloqueante crítico
5. 🔴 **`OrdenFabricacion.js` NO EXISTE** - Pero está referenciado

### Recomendaciones Inmediatas

1. **ALTA PRIORIDAD:** Verificar base de datos (proyectos vs proyectopedidos)
2. **ALTA PRIORIDAD:** Revisar script `migrarAProyectos.js`
3. **CRÍTICO:** Corregir `Fabricacion.js` (bloqueante)
4. **CRÍTICO:** Crear `OrdenFabricacion.js` (ya referenciado)

### Próximo Paso

**ACCIÓN INMEDIATA:** Revisar `scripts/migrarAProyectos.js` para entender la relación entre `Proyecto` y `ProyectoPedido`

```bash
# Leer script de migración
cat server/scripts/migrarAProyectos.js
```

---

**Auditor:** Sistema Automatizado  
**Fecha:** 31 Octubre 2025  
**Estado:** ✅ Auditoría completada - Requiere verificación de base de datos
