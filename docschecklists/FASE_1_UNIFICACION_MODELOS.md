# 🔄 FASE 1: Unificación de Modelos - Lo Mejor de Ambos

**Fecha:** 31 Octubre 2025  
**Objetivo:** Unificar `Proyecto.js` y `ProyectoPedido.js` en un solo modelo robusto  
**Estrategia:** Mantener `Proyecto.js` como base + Agregar lo mejor de `ProyectoPedido.js`

---

## 🎯 DECISIÓN ESTRATÉGICA

### Modelo Base: `Proyecto.js` ✅
**Razón:** Es el que está activamente usado en producción
- Controllers, services, middleware
- Generación de PDFs, Excel
- Sincronización de estados
- **12+ archivos** lo usan activamente

### Agregar de: `ProyectoPedido.js` 📦
**Razón:** Tiene campos valiosos que `Proyecto.js` NO tiene

---

## 📊 COMPARACIÓN DETALLADA

### ✅ Lo que `Proyecto.js` YA TIENE (Mantener)

```javascript
// Información del cliente
cliente: { nombre, telefono, correo, direccion, zona }

// Estados del proyecto
estado: ['levantamiento', 'cotizacion', 'aprobado', 'fabricacion', 'instalacion', 'completado', 'cancelado']

// Fechas importantes
fecha_creacion, fecha_actualizacion, fecha_compromiso

// Levantamiento técnico completo
levantamiento: { partidas[], totales, observaciones, personaVisita }

// Cotización actual
cotizacionActual: { cotizacion, numero, totales, precioReglas, facturacion }

// Medidas estructuradas
medidas: [{ tipo, personaVisita, piezas[], totales }]

// Información financiera
monto_estimado, subtotal, iva, total, anticipo, saldo_pendiente

// Referencias
prospecto_original, cotizaciones[], pedidos[], ordenes_fabricacion[], instalaciones[]

// Responsables
asesor_asignado, tecnico_asignado, creado_por, actualizado_por
```

### 🆕 Lo que `ProyectoPedido.js` TIENE y `Proyecto.js` NO (Agregar)

#### 1. **Cronograma Unificado** ⭐ CRÍTICO
```javascript
cronograma: {
  fechaPedido: Date,
  fechaInicioFabricacion: Date,
  fechaFinFabricacionEstimada: Date,
  fechaFinFabricacionReal: Date,
  fechaInstalacionProgramada: Date,
  fechaInstalacionReal: Date,
  fechaEntrega: Date,
  fechaCompletado: Date
}
```
**Valor:** Trazabilidad completa de fechas en un solo lugar

#### 2. **Fabricación Detallada** ⭐ CRÍTICO
```javascript
fabricacion: {
  estado: ['pendiente', 'materiales_pedidos', 'en_proceso', 'control_calidad', 'terminado', 'empacado'],
  asignadoA: ObjectId,
  prioridad: ['baja', 'media', 'alta', 'urgente'],
  
  materiales: [{
    nombre, cantidad, unidad, disponible,
    fechaPedido, fechaLlegada, proveedor, costo
  }],
  
  procesos: [{
    nombre, descripcion, orden,
    tiempoEstimado, tiempoReal,
    fechaInicio, fechaFin,
    responsable, estado, observaciones,
    evidenciasFotos[]
  }],
  
  controlCalidad: {
    realizado, fechaRevision, revisadoPor,
    resultado, observaciones, evidenciasFotos[],
    defectosEncontrados: [{
      descripcion, gravedad, corregido
    }]
  },
  
  empaque: {
    realizado, fechaEmpaque, responsable,
    tipoEmpaque, observaciones, evidenciasFotos[]
  },
  
  costos: {
    materiales, manoObra, overhead, total
  },
  
  progreso: Number (0-100)
}
```
**Valor:** Control completo de fabricación sin modelo separado

#### 3. **Productos con Estado de Fabricación** ⭐ IMPORTANTE
```javascript
productos: [{
  // ... campos existentes ...
  
  // AGREGAR:
  estadoFabricacion: ['pendiente', 'en_proceso', 'terminado', 'instalado'],
  fechaInicioFabricacion: Date,
  fechaFinFabricacion: Date,
  fechaInstalacion: Date,
  requiereR24: Boolean,
  tiempoFabricacion: Number
}]
```
**Valor:** Seguimiento por producto individual

#### 4. **Instalación Detallada** ⭐ CRÍTICO
```javascript
instalacion: {
  estado: ['programada', 'en_proceso', 'completada', 'cancelada'],
  
  programacion: {
    fechaProgramada: Date,
    horaInicio: String,
    horaFin: String,
    cuadrilla: [{
      tecnico: ObjectId,
      rol: String
    }]
  },
  
  ejecucion: {
    fechaInicio: Date,
    fechaFin: Date,
    horasReales: Number,
    
    checklist: [{
      item: String,
      completado: Boolean,
      observaciones: String,
      foto: String
    }],
    
    materialesAdicionales: [{
      material: String,
      cantidad: Number,
      motivo: String,
      costo: Number
    }],
    
    incidencias: [{
      fecha: Date,
      tipo: String,
      descripcion: String,
      resolucion: String,
      resuelta: Boolean
    }]
  },
  
  evidencias: {
    fotosAntes: [String],
    fotosDurante: [String],
    fotosDespues: [String],
    firmaCliente: String,
    nombreQuienRecibe: String,
    comentariosCliente: String
  },
  
  garantia: {
    vigente: Boolean,
    fechaInicio: Date,
    fechaFin: Date,
    terminos: String
  },
  
  costos: {
    manoObra: Number,
    materiales: Number,
    transporte: Number,
    total: Number
  }
}
```
**Valor:** Instalación completa sin modelo separado

#### 5. **Pagos Estructurados** ⭐ IMPORTANTE
```javascript
pagos: {
  montoTotal: Number,
  subtotal: Number,
  iva: Number,
  descuentos: Number,
  
  anticipo: {
    monto: Number,
    porcentaje: Number,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String, // URL
    pagado: Boolean
  },
  
  saldo: {
    monto: Number,
    porcentaje: Number,
    fechaVencimiento: Date,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String,
    pagado: Boolean
  },
  
  pagosAdicionales: [{
    concepto: String,
    monto: Number,
    fecha: Date,
    metodoPago: String,
    referencia: String
  }]
}
```
**Valor:** Gestión completa de pagos con comprobantes

#### 6. **Historial de Notas** ⭐ ÚTIL
```javascript
notas: [{
  fecha: Date,
  usuario: ObjectId,
  tipo: ['general', 'fabricacion', 'instalacion', 'pago', 'cliente', 'problema'],
  contenido: String,
  importante: Boolean,
  archivosAdjuntos: [String]
}]
```
**Valor:** Trazabilidad de comunicación

---

## 🎯 PLAN DE UNIFICACIÓN

### Fase 1: Agregar Campos a `Proyecto.js` (2 días)

#### Día 1: Campos de Fabricación e Instalación
```javascript
// Agregar a Proyecto.js

// 1. Cronograma unificado
cronograma: {
  fechaPedido: Date,
  fechaInicioFabricacion: Date,
  fechaFinFabricacionEstimada: Date,
  fechaFinFabricacionReal: Date,
  fechaInstalacionProgramada: Date,
  fechaInstalacionReal: Date,
  fechaEntrega: Date,
  fechaCompletado: Date
},

// 2. Fabricación detallada (embebida)
fabricacion: {
  estado: String,
  asignadoA: ObjectId,
  prioridad: String,
  materiales: [],
  procesos: [],
  controlCalidad: {},
  empaque: {},
  costos: {},
  progreso: Number
},

// 3. Instalación detallada (embebida)
instalacion: {
  estado: String,
  programacion: {},
  ejecucion: {},
  evidencias: {},
  garantia: {},
  costos: {}
}
```

#### Día 2: Campos de Pagos y Notas
```javascript
// 4. Pagos estructurados (reemplazar campos simples)
pagos: {
  montoTotal: Number,
  subtotal: Number,
  iva: Number,
  descuentos: Number,
  anticipo: {
    monto: Number,
    porcentaje: Number,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String,
    pagado: Boolean
  },
  saldo: {
    monto: Number,
    porcentaje: Number,
    fechaVencimiento: Date,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String,
    pagado: Boolean
  },
  pagosAdicionales: []
},

// 5. Historial de notas
notas: [{
  fecha: Date,
  usuario: ObjectId,
  tipo: String,
  contenido: String,
  importante: Boolean,
  archivosAdjuntos: []
}],

// 6. Productos con estado de fabricación
// Agregar a productos[] existente:
productos: [{
  // ... campos existentes ...
  estadoFabricacion: String,
  fechaInicioFabricacion: Date,
  fechaFinFabricacion: Date,
  fechaInstalacion: Date,
  requiereR24: Boolean,
  tiempoFabricacion: Number
}]
```

---

### Fase 2: Migrar Datos de `ProyectoPedido` → `Proyecto` (2 días)

#### Script de Migración

```javascript
// server/scripts/unificarModelos.js

const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido');
const logger = require('../config/logger');

async function migrarProyectoPedidosAProyecto() {
  try {
    const proyectosPedidos = await ProyectoPedido.find();
    
    logger.info('Iniciando unificación de modelos', {
      script: 'unificarModelos',
      totalProyectosPedidos: proyectosPedidos.length
    });
    
    for (const pp of proyectosPedidos) {
      // Buscar si ya existe un Proyecto correspondiente
      let proyecto = await Proyecto.findOne({
        'cliente.telefono': pp.cliente.telefono,
        numero: pp.numero
      });
      
      if (proyecto) {
        // ACTUALIZAR proyecto existente con datos de ProyectoPedido
        proyecto.cronograma = pp.cronograma;
        proyecto.fabricacion = pp.fabricacion;
        proyecto.instalacion = pp.instalacion;
        proyecto.pagos = {
          montoTotal: pp.pagos.montoTotal,
          subtotal: pp.pagos.subtotal,
          iva: pp.pagos.iva,
          descuentos: pp.pagos.descuentos,
          anticipo: pp.pagos.anticipo,
          saldo: pp.pagos.saldo,
          pagosAdicionales: pp.pagos.pagosAdicionales || []
        };
        proyecto.notas = pp.notas || [];
        
        // Actualizar productos con estado de fabricación
        if (pp.productos && pp.productos.length > 0) {
          proyecto.productos = pp.productos.map(p => ({
            ...p.toObject(),
            estadoFabricacion: p.estadoFabricacion,
            fechaInicioFabricacion: p.fechaInicioFabricacion,
            fechaFinFabricacion: p.fechaFinFabricacion,
            fechaInstalacion: p.fechaInstalacion
          }));
        }
        
        await proyecto.save();
        logger.info('Proyecto actualizado con datos de ProyectoPedido', {
          proyectoId: proyecto._id,
          proyectoPedidoId: pp._id
        });
        
      } else {
        // CREAR nuevo Proyecto desde ProyectoPedido
        proyecto = new Proyecto({
          // Datos básicos
          cliente: pp.cliente,
          numero: pp.numero,
          estado: pp.estado,
          
          // Referencias
          prospecto_original: pp.prospecto,
          cotizaciones: [pp.cotizacion],
          
          // Nuevos campos unificados
          cronograma: pp.cronograma,
          fabricacion: pp.fabricacion,
          instalacion: pp.instalacion,
          pagos: pp.pagos,
          notas: pp.notas,
          productos: pp.productos,
          
          // Fechas
          fecha_creacion: pp.createdAt,
          fecha_actualizacion: pp.updatedAt,
          
          // Metadatos
          creado_por: pp.creado_por
        });
        
        await proyecto.save();
        logger.info('Nuevo Proyecto creado desde ProyectoPedido', {
          proyectoId: proyecto._id,
          proyectoPedidoId: pp._id
        });
      }
    }
    
    logger.info('Unificación de modelos completada', {
      script: 'unificarModelos',
      proyectosProcesados: proyectosPedidos.length
    });
    
  } catch (error) {
    logger.error('Error en unificación de modelos', {
      script: 'unificarModelos',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = { migrarProyectoPedidosAProyecto };
```

---

### Fase 3: Actualizar Controllers y Services (2 días)

#### Actualizar archivos que usan `ProyectoPedido`:

1. ✅ `proyectoPedidoController.js` → Usar `Proyecto` en lugar de `ProyectoPedido`
2. ✅ `fabricacionService.js` → Usar `Proyecto.fabricacion`
3. ✅ `instalacionesInteligentesService.js` → Usar `Proyecto.instalacion`
4. ✅ `routes/fabricacion.js` → Usar `Proyecto`
5. ✅ `routes/kpis.js` → Usar solo `Proyecto`

---

### Fase 4: Deprecar `ProyectoPedido.js` (1 día)

1. ✅ Renombrar `ProyectoPedido.js` → `ProyectoPedido.legacy.js`
2. ✅ Agregar comentario de deprecación
3. ✅ Actualizar documentación
4. ✅ Validar que todos los KPIs funcionan

---

## ✅ VENTAJAS DE LA UNIFICACIÓN

### 1. **Un Solo Modelo** ⭐
- NO más confusión sobre cuál usar
- Código más simple y mantenible
- Menos duplicación

### 2. **Lo Mejor de Ambos** ⭐
- Estructura comercial de `Proyecto.js`
- Fabricación e instalación de `ProyectoPedido.js`
- Pagos estructurados con comprobantes
- Cronograma unificado

### 3. **KPIs Preservados** ⭐
- Todos los campos comerciales intactos
- Pagos con más detalle
- Trazabilidad completa

### 4. **Sin Modelos Separados** ⭐
- NO necesitas `OrdenFabricacion.js` separado
- NO necesitas `OrdenInstalacion.js` separado
- Todo en un solo documento (MongoDB style)

---

## 📊 CRONOGRAMA

**Total:** 7 días (1.5 semanas)

- **Día 1-2:** Agregar campos a `Proyecto.js`
- **Día 3-4:** Migrar datos de `ProyectoPedido` → `Proyecto`
- **Día 5-6:** Actualizar controllers y services
- **Día 7:** Deprecar `ProyectoPedido.js` y validar

---

## 🎯 CRITERIOS DE ÉXITO

### Funcionales
- ✅ Un solo modelo `Proyecto.js` con todo el ciclo de vida
- ✅ Fabricación e instalación embebidas
- ✅ Cronograma unificado
- ✅ Pagos estructurados con comprobantes

### No Funcionales (CRÍTICO)
- ✅ **KPIs comerciales 100% intactos**
- ✅ **NO se pierden datos**
- ✅ **Todos los reportes funcionando**
- ✅ **Migración exitosa de ProyectoPedido**

### Técnicos
- ✅ Modelo bien estructurado
- ✅ Índices optimizados
- ✅ Métodos helper actualizados
- ✅ Logging estructurado en migración

---

## 🚀 SIGUIENTE PASO

**ACCIÓN INMEDIATA:** Crear rama de desarrollo y empezar con Día 1

```bash
# Crear rama
git checkout -b feature/unificar-modelos

# Backup de Proyecto.js actual
cp server/models/Proyecto.js server/models/Proyecto.backup.js

# Empezar a agregar campos
code server/models/Proyecto.js
```

---

**Responsable:** Equipo Desarrollo CRM Sundeck  
**Fecha de inicio:** 31 Octubre 2025  
**Duración estimada:** 7 días (1.5 semanas)  
**Estado:** ✅ Plan aprobado - Listo para iniciar
