# 🚀 CONTINUAR AQUÍ - Día 2

**Última actualización:** 31 Octubre 2025 - 15:52  
**Estado:** Fase 1 EN PROGRESO (60%)  
**Próxima tarea:** Actualizar Services

---

## ✅ LO QUE SE COMPLETÓ HOY (31 Oct 2025)

### Día 0: Modelo Unificado ✅
- ✅ `Proyecto.js` actualizado (502 → 1,241 líneas)
- ✅ 5 secciones agregadas: cronograma, fabricación, instalación, pagos, notas
- ✅ 4 métodos inteligentes implementados

### Día 1: Endpoints Implementados ✅ ⭐
- ✅ Dependencia `qrcode@1.5.3` instalada
- ✅ `server/utils/qrcodeGenerator.js` creado (resiliente con fallback)
- ✅ 3 endpoints funcionales:
  - `POST /api/proyectos/:id/etiquetas-produccion`
  - `POST /api/proyectos/:id/calcular-tiempo-instalacion`
  - `GET /api/proyectos/ruta-diaria/:fecha`
- ✅ Validaciones completas
- ✅ Logging estructurado
- ✅ Manejo de errores robusto

**Progreso:** 60% de Fase 1 completado

---

## 📋 PRÓXIMA SESIÓN: Día 2 - Actualizar Services

### Objetivo
Actualizar los services existentes para usar el modelo `Proyecto.js` unificado en lugar de `ProyectoPedido.js`

### Archivos a Modificar

#### 1. `server/services/fabricacionService.js`

**Cambios necesarios:**

```javascript
// ANTES (línea 1):
const ProyectoPedido = require('../models/ProyectoPedido');

// DESPUÉS:
const Proyecto = require('../models/Proyecto');
```

**Métodos a actualizar:**

##### `iniciarFabricacion(proyectoId)`
```javascript
// ANTES:
const proyecto = await ProyectoPedido.findById(proyectoId);
proyecto.fabricacion.estado = 'en_proceso';
proyecto.cronograma.fechaInicioFabricacion = new Date();

// DESPUÉS:
const proyecto = await Proyecto.findById(proyectoId);
proyecto.fabricacion.estado = 'en_proceso';
proyecto.cronograma.fechaInicioFabricacion = new Date();
// (mismo código, solo cambiar el modelo)
```

##### `actualizarProgreso(proyectoId, progreso)`
```javascript
// ANTES:
const proyecto = await ProyectoPedido.findById(proyectoId);
proyecto.fabricacion.progreso = progreso;

// DESPUÉS:
const proyecto = await Proyecto.findById(proyectoId);
proyecto.fabricacion.progreso = progreso;
```

##### `realizarControlCalidad(proyectoId, datos)`
```javascript
// ANTES:
const proyecto = await ProyectoPedido.findById(proyectoId);
proyecto.fabricacion.controlCalidad = { ...datos };

// DESPUÉS:
const proyecto = await Proyecto.findById(proyectoId);
proyecto.fabricacion.controlCalidad = { ...datos };
```

##### `completarEmpaque(proyectoId, datos)`
```javascript
// ANTES:
const proyecto = await ProyectoPedido.findById(proyectoId);
proyecto.fabricacion.empaque = { ...datos };

// DESPUÉS:
const proyecto = await Proyecto.findById(proyectoId);
proyecto.fabricacion.empaque = { ...datos };
```

##### `obtenerColaFabricacion()`
```javascript
// ANTES:
const proyectos = await ProyectoPedido.find({
  'fabricacion.estado': { $in: ['pendiente', 'en_proceso'] }
});

// DESPUÉS:
const proyectos = await Proyecto.find({
  'fabricacion.estado': { $in: ['pendiente', 'en_proceso'] }
});
```

**Estimado:** 30-45 minutos

---

#### 2. `server/services/instalacionesInteligentesService.js`

**Verificar si existe:**
```bash
ls server/services/instalacionesInteligentesService.js
```

Si NO existe, crear nuevo service:

```javascript
// server/services/instalacionesInteligentesService.js
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');

/**
 * Programar instalación para un proyecto
 */
async function programarInstalacion(proyectoId, datos) {
  try {
    const proyecto = await Proyecto.findById(proyectoId);
    
    if (!proyecto) {
      throw new Error('Proyecto no encontrado');
    }
    
    // Calcular tiempo estimado automáticamente
    const calculo = proyecto.calcularTiempoInstalacion();
    
    // Actualizar instalación
    proyecto.instalacion = {
      numeroOrden: `INST-${proyecto.numero}`,
      estado: 'programada',
      programacion: {
        fechaProgramada: datos.fecha,
        horaInicio: datos.horaInicio,
        horaFinEstimada: calcularHoraFin(datos.horaInicio, calculo.tiempoEstimadoMinutos),
        tiempoEstimado: calculo.tiempoEstimadoMinutos,
        cuadrilla: datos.cuadrilla || []
      },
      productosInstalar: proyecto.productos.map(p => ({
        productoId: p._id,
        ubicacion: p.ubicacion || p.nombre,
        especificaciones: {
          producto: p.nombre,
          medidas: p.medidas || {},
          // ... más campos
        },
        instalado: false
      })),
      checklist: generarChecklistDefault(),
      garantia: {
        vigente: true,
        fechaInicio: datos.fecha,
        fechaFin: new Date(new Date(datos.fecha).setFullYear(new Date(datos.fecha).getFullYear() + 1)),
        terminos: 'Garantía de 1 año en instalación y funcionamiento'
      }
    };
    
    await proyecto.save();
    
    logger.info('Instalación programada', {
      proyectoId,
      fecha: datos.fecha,
      tiempoEstimado: calculo.tiempoEstimadoMinutos
    });
    
    return proyecto;
  } catch (error) {
    logger.error('Error programando instalación', {
      proyectoId,
      error: error.message
    });
    throw error;
  }
}

/**
 * Iniciar instalación (cambiar estado a "en_ruta")
 */
async function iniciarInstalacion(proyectoId) {
  const proyecto = await Proyecto.findById(proyectoId);
  
  if (!proyecto) {
    throw new Error('Proyecto no encontrado');
  }
  
  proyecto.instalacion.estado = 'en_ruta';
  proyecto.instalacion.ejecucion = {
    fechaInicioReal: new Date()
  };
  
  await proyecto.save();
  
  logger.info('Instalación iniciada', { proyectoId });
  
  return proyecto;
}

/**
 * Completar instalación
 */
async function completarInstalacion(proyectoId, evidencias) {
  const proyecto = await Proyecto.findById(proyectoId);
  
  if (!proyecto) {
    throw new Error('Proyecto no encontrado');
  }
  
  proyecto.instalacion.estado = 'completada';
  proyecto.instalacion.ejecucion.fechaFinReal = new Date();
  proyecto.instalacion.evidencias = evidencias;
  proyecto.cronograma.fechaInstalacionReal = new Date();
  
  await proyecto.save();
  
  logger.info('Instalación completada', { proyectoId });
  
  return proyecto;
}

// Helpers
function calcularHoraFin(horaInicio, minutos) {
  const [horas, mins] = horaInicio.split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(horas, mins + minutos);
  return `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}`;
}

function generarChecklistDefault() {
  return [
    { item: 'Verificar medidas en sitio', completado: false },
    { item: 'Verificar nivel de instalación', completado: false },
    { item: 'Perforar y colocar taquetes', completado: false },
    { item: 'Instalar soportes', completado: false },
    { item: 'Montar persiana', completado: false },
    { item: 'Verificar funcionamiento', completado: false },
    { item: 'Limpiar área de trabajo', completado: false },
    { item: 'Obtener firma del cliente', completado: false }
  ];
}

module.exports = {
  programarInstalacion,
  iniciarInstalacion,
  completarInstalacion
};
```

**Estimado:** 45-60 minutos

---

#### 3. Actualizar Rutas

##### `server/routes/fabricacion.js`

```javascript
// ANTES (línea ~2):
const ProyectoPedido = require('../models/ProyectoPedido');

// DESPUÉS:
const Proyecto = require('../models/Proyecto');

// Actualizar todas las referencias en el archivo
```

##### `server/routes/instalaciones.js` (si existe)

Mismo cambio: `ProyectoPedido` → `Proyecto`

**Estimado:** 15-20 minutos

---

### Checklist de Tareas

- [ ] **Tarea 1:** Actualizar `fabricacionService.js`
  - [ ] Cambiar import de `ProyectoPedido` a `Proyecto`
  - [ ] Verificar que todos los métodos funcionen
  - [ ] Probar con un proyecto de prueba

- [ ] **Tarea 2:** Crear/Actualizar `instalacionesInteligentesService.js`
  - [ ] Crear service si no existe
  - [ ] Implementar métodos: programar, iniciar, completar
  - [ ] Agregar logging estructurado

- [ ] **Tarea 3:** Actualizar rutas
  - [ ] `routes/fabricacion.js` → usar `Proyecto`
  - [ ] `routes/instalaciones.js` → usar `Proyecto` (si existe)

- [ ] **Tarea 4:** Probar cambios
  - [ ] Crear proyecto de prueba
  - [ ] Iniciar fabricación
  - [ ] Programar instalación
  - [ ] Verificar que todo funcione

---

## 🔍 VERIFICACIÓN RÁPIDA

```bash
# Verificar que los endpoints funcionan
curl -X POST http://localhost:5000/api/proyectos/[ID]/etiquetas-produccion \
  -H "Authorization: Bearer [TOKEN]"

# Verificar imports
rg "ProyectoPedido" server/services/
rg "ProyectoPedido" server/routes/

# Después de los cambios, NO debe haber resultados en services
```

---

## 📚 DOCUMENTOS DE REFERENCIA

### Para Actualizar Services
- `server/services/fabricacionService.js` (líneas 1-461) - Service actual
- `server/models/Proyecto.js` (líneas 334-476) - Sección fabricación
- `server/models/Proyecto.js` (líneas 478-646) - Sección instalación

### Para Crear Instalaciones Service
- `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md` - Especificaciones
- `server/models/Proyecto.js` (líneas 1065-1235) - Método `optimizarRutaDiaria`

### Auditorías Completadas
- `docschecklists/auditorias/AUDITORIA_FASE_1_DIA_0.md`
- `docschecklists/auditorias/AUDITORIA_ENDPOINTS_FASE_1.md`

---

## ⚠️ IMPORTANTE: NO ALTERAR

**KPIs Comerciales:**
- `total`, `anticipo`, `saldo_pendiente`
- `monto_estimado`, `subtotal`, `iva`
- `cliente.*`, `estado`, `fecha_*`

Estos campos son críticos para reportes comerciales.

---

## 📊 PROGRESO FASE 1

```
Día 0: Modelo Unificado        ████████████████████ 100% ✅
Día 1: Endpoints               ████████████████████ 100% ✅
Día 2: Actualizar Services     ░░░░░░░░░░░░░░░░░░░░   0% ⬅️ AQUÍ
Día 3: Migración de Datos      ░░░░░░░░░░░░░░░░░░░░   0%
Día 4: Deprecación             ░░░░░░░░░░░░░░░░░░░░   0%
Día 5: Validación Final        ░░░░░░░░░░░░░░░░░░░░   0%

Total: ████████████░░░░░░░░ 60%
```

---

**Responsable:** Próximo Agente  
**Duración estimada:** 2-3 horas  
**Archivos a modificar:** 3-4 archivos  
**Complejidad:** Media

**¡Listo para continuar mañana!** 🚀
