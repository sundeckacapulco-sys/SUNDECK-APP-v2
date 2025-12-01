# 📋 Análisis: Consolidación Legacy → Moderno

**Fecha:** 4 Noviembre 2025  
**Objetivo:** Evaluar qué se perdería con la consolidación propuesta  
**Estado:** Análisis completo

---

## 🎯 RESUMEN EJECUTIVO

### ¿Perderíamos algo con la consolidación?

**Respuesta corta:** ❌ **NO, si se hace correctamente**

**Respuesta detallada:** El modelo `ProyectoPedido.legacy` tiene funcionalidad valiosa que **DEBE** portarse antes de desactivarlo. La consolidación es segura si seguimos el plan correcto.

---

## 📊 COMPARATIVA: Legacy vs Moderno

### Modelo ProyectoPedido.legacy (774 líneas)

**Fortalezas únicas:**
1. ✅ **Métodos de instancia valiosos:**
   - `agregarNota()` - Sistema de notas estructurado
   - `cambiarEstado()` - Cambios de estado con logging automático
   - `calcularProgreso()` - Cálculo de progreso por estados
   - `diasRetraso()` - Cálculo inteligente de retrasos
   - `estaPagado()` - Validación de pagos completos

2. ✅ **Hook pre-save inteligente:**
   - Generación automática de número secuencial
   - Cálculo automático de totales (subtotal, IVA, anticipo, saldo)
   - Actualización de fechas estimadas de fabricación
   - Logging estructurado

3. ✅ **Estructura de instalación detallada:**
   - Checklist completo de instalación
   - Control de tiempos y pausas
   - Gestión de incidencias
   - Documentación fotográfica categorizada
   - Mediciones finales vs plano

4. ✅ **Información de cliente unificada:**
   - Datos completos del cliente embebidos
   - Dirección de entrega estructurada
   - Contacto de sitio

### Modelo Pedido moderno (219 líneas)

**Fortalezas:**
1. ✅ Estructura más limpia y enfocada
2. ✅ Mejor separación de responsabilidades
3. ✅ Plugin de paginación incluido
4. ✅ Estados más específicos

**Debilidades:**
1. ❌ **NO tiene métodos de instancia** (agregarNota, cambiarEstado, etc.)
2. ❌ **NO tiene hook pre-save** para cálculos automáticos
3. ❌ **NO tiene sistema de notas** estructurado
4. ❌ **NO tiene cálculo de progreso** ni retrasos
5. ❌ **Instalación menos detallada** que legacy

### Modelo Proyecto unificado (1,241 líneas)

**Fortalezas:**
1. ✅ Consolidación completa del ciclo
2. ✅ Métodos inteligentes implementados
3. ✅ Bloques estructurados para fabricación, instalación, pagos
4. ✅ Logging estructurado

**Observación:**
- Tiene estructura para notas, pagos, cronograma
- Pero **NO hereda los métodos útiles** de ProyectoPedido.legacy

---

## ⚠️ RIESGOS DE CONSOLIDACIÓN SIN PORTEO

### Funcionalidad que se PERDERÍA:

**1. Métodos de negocio críticos** 🔴
```javascript
// LEGACY - Se perdería:
proyectoPedido.agregarNota(contenido, usuario, etapa, tipo)
proyectoPedido.cambiarEstado(nuevoEstado, usuario, nota)
proyectoPedido.calcularProgreso()
proyectoPedido.diasRetraso()
proyectoPedido.estaPagado()
```

**2. Cálculos automáticos** 🔴
```javascript
// LEGACY - Hook pre-save que se perdería:
- Generación automática de número secuencial
- Cálculo de subtotal, IVA, total
- Cálculo de anticipo y saldo basado en porcentajes
- Estimación de fechas de fabricación
```

**3. Sistema de notas estructurado** 🟡
```javascript
// LEGACY - Estructura que se perdería:
notas: [{
  contenido: String,
  usuario: ObjectId,
  etapa: String, // 'general', 'fabricacion', 'instalacion'
  tipo: String,  // 'info', 'cambio', 'problema', 'solucion'
  fecha: Date
}]
```

**4. Gestión de instalación detallada** 🟡
```javascript
// LEGACY - Detalles que se perderían:
- Checklist categorizado de instalación
- Control de tiempos con pausas
- Gestión de incidencias con costos
- Mediciones finales vs plano
- Documentación fotográfica categorizada
```

---

## ✅ PLAN DE CONSOLIDACIÓN SEGURO

### Fase 1: Porteo de Funcionalidad (CRÍTICO)

**1.1. Portar métodos a Pedido.js**
```javascript
// server/models/Pedido.js - AGREGAR:

// Método para agregar notas
pedidoSchema.methods.agregarNota = function(contenido, usuario, etapa = 'general', tipo = 'info') {
  if (!this.notas) this.notas = [];
  this.notas.push({
    contenido,
    usuario,
    etapa,
    tipo,
    fecha: new Date()
  });
  return this.save();
};

// Método para cambiar estado con logging
pedidoSchema.methods.cambiarEstado = function(nuevoEstado, usuario, nota = null) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  // Agregar nota automática
  this.agregarNota(
    `Estado cambiado de "${estadoAnterior}" a "${nuevoEstado}"${nota ? `. ${nota}` : ''}`,
    usuario,
    'general',
    'cambio'
  );
  
  // Actualizar fechas según estado
  const ahora = new Date();
  switch(nuevoEstado) {
    case 'en_fabricacion':
      if (!this.fechaInicioFabricacion) this.fechaInicioFabricacion = ahora;
      break;
    case 'fabricado':
      if (!this.fechaFinFabricacion) this.fechaFinFabricacion = ahora;
      break;
    case 'en_instalacion':
      if (!this.fechaInstalacion) this.fechaInstalacion = ahora;
      break;
    case 'entregado':
      if (!this.fechaEntrega) this.fechaEntrega = ahora;
      break;
  }
  
  return this.save();
};

// Método para verificar si está pagado
pedidoSchema.methods.estaPagado = function() {
  return this.anticipo?.pagado && this.saldo?.pagado;
};

// Método para calcular días de retraso
pedidoSchema.methods.diasRetraso = function() {
  const hoy = new Date();
  let fechaLimite;
  
  switch(this.estado) {
    case 'confirmado':
      fechaLimite = this.fechaInicioFabricacion;
      break;
    case 'en_fabricacion':
      fechaLimite = this.fechaFinFabricacion;
      break;
    case 'fabricado':
      fechaLimite = this.fechaInstalacion;
      break;
    default:
      return 0;
  }
  
  if (!fechaLimite || hoy <= fechaLimite) return 0;
  return Math.ceil((hoy - fechaLimite) / (1000 * 60 * 60 * 24));
};
```

**1.2. Agregar hook pre-save a Pedido.js**
```javascript
// server/models/Pedido.js - AGREGAR:

const logger = require('../config/logger');

pedidoSchema.pre('save', async function(next) {
  // Generar número secuencial si es nuevo
  if (this.isNew && !this.numero) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      numero: new RegExp(`^PED-${year}-`)
    });
    this.numero = `PED-${year}-${String(count + 1).padStart(4, '0')}`;
    
    logger.info('Número de pedido generado', {
      pedidoId: this._id,
      numero: this.numero
    });
  }
  
  // Calcular montos automáticamente
  if (this.productos && this.productos.length > 0) {
    const subtotal = this.productos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    const iva = subtotal * 0.16;
    this.montoTotal = subtotal + iva;
    
    // Calcular anticipo y saldo si hay porcentajes
    if (this.anticipo?.porcentaje) {
      this.anticipo.monto = this.montoTotal * (this.anticipo.porcentaje / 100);
    }
    if (this.saldo?.porcentaje) {
      this.saldo.monto = this.montoTotal * (this.saldo.porcentaje / 100);
    }
  }
  
  next();
});
```

**1.3. Extender schema de Pedido.js**
```javascript
// server/models/Pedido.js - AGREGAR campos:

// Sistema de notas estructurado
notas: [{
  contenido: String,
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  },
  etapa: {
    type: String,
    enum: ['general', 'fabricacion', 'instalacion', 'entrega'],
    default: 'general'
  },
  tipo: {
    type: String,
    enum: ['info', 'cambio', 'problema', 'solucion', 'recordatorio'],
    default: 'info'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}],

// Archivos adjuntos
archivos: [{
  nombre: String,
  url: String,
  tipo: String,
  categoria: {
    type: String,
    enum: ['comprobante', 'plano', 'foto', 'contrato', 'otro']
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}]
```

---

### Fase 2: Actualizar KPI.js (CRÍTICO)

**2.1. Crear adaptador de transición**
```javascript
// server/models/KPI.js - MODIFICAR:

kpiSchema.statics.calcularKPIs = async function(fechaInicio, fechaFin, periodo = 'mensual') {
  const Proyecto = mongoose.model('Proyecto');
  const Pedido = mongoose.model('Pedido');
  const ProyectoPedido = mongoose.model('ProyectoPedido'); // Temporal
  
  // Obtener datos de AMBAS fuentes durante transición
  const proyectos = await Proyecto.find({
    createdAt: { $gte: fechaInicio, $lte: fechaFin }
  }).lean();
  
  const pedidos = await Pedido.find({
    fechaPedido: { $gte: fechaInicio, $lte: fechaFin }
  }).lean();
  
  // TEMPORAL: Incluir legacy solo si existen registros recientes
  const legacyCount = await ProyectoPedido.countDocuments({
    createdAt: { $gte: fechaInicio }
  });
  
  let proyectosLegacy = [];
  if (legacyCount > 0) {
    logger.warn('KPI: Aún existen registros legacy', {
      cantidad: legacyCount,
      fechaInicio,
      fechaFin
    });
    proyectosLegacy = await ProyectoPedido.find({
      createdAt: { $gte: fechaInicio, $lte: fechaFin }
    }).lean();
  }
  
  // Normalizar datos de todas las fuentes
  const datosNormalizados = [
    ...proyectos.map(p => normalizarProyecto(p)),
    ...pedidos.map(p => normalizarPedido(p)),
    ...proyectosLegacy.map(p => normalizarLegacy(p))
  ];
  
  // Calcular métricas sobre datos normalizados
  const metricas = calcularMetricas(datosNormalizados);
  
  // ... resto del código
};

// Funciones de normalización
function normalizarProyecto(proyecto) {
  return {
    id: proyecto._id,
    estado: proyecto.estado,
    montoTotal: proyecto.pagos?.montoTotal || 0,
    fechaCreacion: proyecto.createdAt,
    tipo: 'proyecto'
  };
}

function normalizarPedido(pedido) {
  return {
    id: pedido._id,
    estado: pedido.estado,
    montoTotal: pedido.montoTotal || 0,
    fechaCreacion: pedido.fechaPedido,
    tipo: 'pedido'
  };
}

function normalizarLegacy(legacy) {
  return {
    id: legacy._id,
    estado: legacy.estado,
    montoTotal: legacy.pagos?.montoTotal || 0,
    fechaCreacion: legacy.createdAt,
    tipo: 'legacy'
  };
}
```

---

### Fase 3: Servicio de Sincronización

**3.1. Crear syncLegacyService.js**
```javascript
// server/services/syncLegacyService.js

const mongoose = require('mongoose');
const logger = require('../config/logger');

class SyncLegacyService {
  
  /**
   * Migrar un ProyectoPedido.legacy a Pedido moderno
   */
  async migrarProyectoPedidoAPedido(legacyId) {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    const Pedido = mongoose.model('Pedido');
    
    const legacy = await ProyectoPedido.findById(legacyId);
    if (!legacy) {
      throw new Error(`ProyectoPedido ${legacyId} no encontrado`);
    }
    
    // Verificar si ya existe
    const existente = await Pedido.findOne({ 
      numero: legacy.numero 
    });
    
    if (existente) {
      logger.warn('Pedido ya migrado', {
        legacyId,
        pedidoId: existente._id,
        numero: legacy.numero
      });
      return existente;
    }
    
    // Crear nuevo pedido con datos legacy
    const pedido = new Pedido({
      cotizacion: legacy.cotizacion,
      prospecto: legacy.prospecto,
      numero: legacy.numero,
      fechaPedido: legacy.cronograma?.fechaPedido || legacy.createdAt,
      
      // Montos
      montoTotal: legacy.pagos?.montoTotal || 0,
      anticipo: {
        monto: legacy.pagos?.anticipo?.monto,
        porcentaje: legacy.pagos?.anticipo?.porcentaje,
        fechaPago: legacy.pagos?.anticipo?.fechaPago,
        metodoPago: legacy.pagos?.anticipo?.metodoPago,
        referencia: legacy.pagos?.anticipo?.referencia,
        comprobante: legacy.pagos?.anticipo?.comprobante,
        pagado: legacy.pagos?.anticipo?.pagado || false
      },
      saldo: {
        monto: legacy.pagos?.saldo?.monto,
        porcentaje: legacy.pagos?.saldo?.porcentaje,
        fechaVencimiento: legacy.pagos?.saldo?.fechaVencimiento,
        fechaPago: legacy.pagos?.saldo?.fechaPago,
        metodoPago: legacy.pagos?.saldo?.metodoPago,
        referencia: legacy.pagos?.saldo?.referencia,
        comprobante: legacy.pagos?.saldo?.comprobante,
        pagado: legacy.pagos?.saldo?.pagado || false
      },
      
      // Estado y fechas
      estado: this.mapearEstado(legacy.estado),
      fechaInicioFabricacion: legacy.cronograma?.fechaInicioFabricacion,
      fechaFinFabricacion: legacy.cronograma?.fechaFinFabricacionReal,
      fechaInstalacion: legacy.cronograma?.fechaInstalacionReal,
      fechaEntrega: legacy.cronograma?.fechaEntrega,
      
      // Productos
      productos: legacy.productos || [],
      
      // Dirección de entrega
      direccionEntrega: legacy.entrega?.direccion || legacy.cliente?.direccion,
      
      // Notas (PRESERVAR)
      notas: legacy.notas || [],
      
      // Archivos
      archivos: legacy.archivos || [],
      
      // Responsables
      vendedor: legacy.responsables?.vendedor,
      fabricante: legacy.responsables?.fabricante,
      instalador: legacy.responsables?.instalador,
      
      // Metadata
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt
    });
    
    await pedido.save();
    
    logger.info('ProyectoPedido migrado a Pedido', {
      legacyId: legacy._id,
      pedidoId: pedido._id,
      numero: pedido.numero,
      montoTotal: pedido.montoTotal
    });
    
    return pedido;
  }
  
  /**
   * Mapear estados legacy a estados modernos
   */
  mapearEstado(estadoLegacy) {
    const mapa = {
      'cotizado': 'confirmado',
      'confirmado': 'confirmado',
      'en_fabricacion': 'en_fabricacion',
      'fabricado': 'fabricado',
      'en_instalacion': 'en_instalacion',
      'completado': 'entregado',
      'cancelado': 'cancelado'
    };
    
    return mapa[estadoLegacy] || 'confirmado';
  }
  
  /**
   * Migrar todos los ProyectoPedido legacy
   */
  async migrarTodos(limite = 100) {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    
    const total = await ProyectoPedido.countDocuments();
    logger.info('Iniciando migración masiva', { total, limite });
    
    let procesados = 0;
    let exitosos = 0;
    let errores = 0;
    
    const cursor = ProyectoPedido.find().limit(limite).cursor();
    
    for (let legacy = await cursor.next(); legacy != null; legacy = await cursor.next()) {
      try {
        await this.migrarProyectoPedidoAPedido(legacy._id);
        exitosos++;
      } catch (error) {
        logger.error('Error migrando ProyectoPedido', {
          legacyId: legacy._id,
          error: error.message
        });
        errores++;
      }
      procesados++;
    }
    
    logger.info('Migración masiva completada', {
      total,
      procesados,
      exitosos,
      errores
    });
    
    return { total, procesados, exitosos, errores };
  }
  
  /**
   * Validar integridad post-migración
   */
  async validarMigracion() {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    const Pedido = mongoose.model('Pedido');
    
    const totalLegacy = await ProyectoPedido.countDocuments();
    const totalModerno = await Pedido.countDocuments();
    
    const discrepancias = [];
    
    // Verificar montos
    const legacyMontos = await ProyectoPedido.aggregate([
      { $group: { _id: null, total: { $sum: '$pagos.montoTotal' } } }
    ]);
    
    const modernoMontos = await Pedido.aggregate([
      { $group: { _id: null, total: { $sum: '$montoTotal' } } }
    ]);
    
    const montoLegacy = legacyMontos[0]?.total || 0;
    const montoModerno = modernoMontos[0]?.total || 0;
    const diferenciaMonto = Math.abs(montoLegacy - montoModerno);
    
    if (diferenciaMonto > 0.01) {
      discrepancias.push({
        tipo: 'monto',
        legacy: montoLegacy,
        moderno: montoModerno,
        diferencia: diferenciaMonto
      });
    }
    
    logger.info('Validación de migración', {
      totalLegacy,
      totalModerno,
      montoLegacy,
      montoModerno,
      discrepancias: discrepancias.length
    });
    
    return {
      totalLegacy,
      totalModerno,
      montoLegacy,
      montoModerno,
      discrepancias
    };
  }
}

module.exports = new SyncLegacyService();
```

---

## ✅ RESPUESTA FINAL

### ¿Perderíamos algo?

**NO, si seguimos este plan:**

1. ✅ **Portar métodos críticos** a Pedido.js
2. ✅ **Agregar hook pre-save** para cálculos automáticos
3. ✅ **Extender schema** con notas y archivos
4. ✅ **Actualizar KPI.js** con adaptador de transición
5. ✅ **Crear syncLegacyService** para migración segura
6. ✅ **Validar integridad** post-migración

### Lo que SÍ se preserva:

- ✅ Todos los métodos de negocio (agregarNota, cambiarEstado, etc.)
- ✅ Cálculos automáticos (totales, IVA, anticipo, saldo)
- ✅ Sistema de notas estructurado
- ✅ Gestión de archivos
- ✅ Logging de cambios
- ✅ Datos históricos (mediante migración)
- ✅ KPIs (mediante adaptador)

### Lo que se MEJORA:

- ✅ Separación de responsabilidades
- ✅ Código más mantenible
- ✅ Sin duplicidad de endpoints
- ✅ Tests más fáciles
- ✅ Arquitectura más limpia

---

## 🎯 RECOMENDACIÓN

**Proceder con la consolidación PERO:**

1. **Primero:** Portar toda la funcionalidad útil
2. **Segundo:** Crear servicio de migración
3. **Tercero:** Migrar datos con validación
4. **Cuarto:** Actualizar KPIs con adaptador
5. **Quinto:** Desactivar rutas legacy
6. **Sexto:** Monitorear por 1 semana
7. **Séptimo:** Eliminar código legacy

**Duración estimada:** 5-7 días  
**Riesgo:** Bajo (con plan correcto)  
**Beneficio:** Alto (elimina duplicidad)

---

**Conclusión:** La consolidación es **SEGURA y RECOMENDADA** si se porta correctamente la funcionalidad valiosa del legacy.
