# 🚀 FASE 1: Plan Detallado - Extensión de Producción e Instalación

**Fecha:** 31 Octubre 2025  
**Estado:** En Planificación  
**Objetivo:** Agregar capas de producción e instalación SIN alterar KPIs comerciales

---

## 🎯 PRINCIPIOS FUNDAMENTALES

### ✅ LO QUE SE MANTIENE INTACTO (100%)

**KPIs Comerciales en `Proyecto.js`:**
- ✅ `monto_estimado` - Monto total del proyecto
- ✅ `subtotal` - Subtotal antes de IVA
- ✅ `iva` - IVA calculado
- ✅ `total` - Total final
- ✅ `anticipo` - Anticipo recibido
- ✅ `saldo_pendiente` - Saldo por cobrar
- ✅ `estado` - Estado del proyecto (levantamiento → completado)
- ✅ `fecha_creacion` - Fecha de creación
- ✅ `fecha_actualizacion` - Última actualización
- ✅ `fecha_compromiso` - Fecha de entrega comprometida
- ✅ `cliente.*` - Toda la información del cliente
- ✅ `cotizaciones[]` - Referencias a cotizaciones
- ✅ `pedidos[]` - Referencias a pedidos

**Campos Técnicos Comerciales:**
- ✅ `levantamiento.*` - Toda la información técnica
- ✅ `cotizacionActual.*` - Última cotización
- ✅ `medidas[]` - Medidas y partidas
- ✅ `materiales[]` - Materiales cotizados
- ✅ `productos[]` - Productos cotizados

**Referencias Existentes:**
- ✅ `prospecto_original` - Prospecto origen
- ✅ `asesor_asignado` - Asesor comercial
- ✅ `tecnico_asignado` - Técnico asignado
- ✅ `creado_por` - Usuario creador
- ✅ `actualizado_por` - Usuario que actualiza

### 🆕 LO QUE SE AGREGA (Extensiones)

**Nuevas Referencias en `Proyecto.js` (YA EXISTEN):**
```javascript
ordenes_fabricacion: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'OrdenFabricacion'
}],
instalaciones: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Instalacion'
}]
```
✅ **Estas referencias YA ESTÁN en el modelo actual** (líneas 335-342)

**Nuevos Modelos Independientes:**
1. `OrdenFabricacion.js` - Órdenes de producción
2. `OrdenInstalacion.js` - Órdenes de instalación (ya existe como `Instalacion.js`)

---

## 📋 ANÁLISIS DE SITUACIÓN ACTUAL

### Modelos Existentes

#### ✅ `Proyecto.js` (502 líneas)
- **Estado:** Núcleo central del sistema ✅
- **Función:** Gestión completa del ciclo comercial
- **Referencias:** Ya incluye `ordenes_fabricacion[]` e `instalaciones[]`
- **Acción:** **MANTENER INTACTO** - Solo usar referencias existentes

#### ⚠️ `Pedido.js` (219 líneas)
- **Estado:** Modelo simple, posible duplicidad
- **Función:** Gestión básica de pedidos
- **Problema:** Puede estar duplicando información de `Proyecto.js`
- **Acción:** **ANALIZAR** - Verificar si se usa o migrar a `Proyecto.js`

#### ⚠️ `ProyectoPedido.js` (756 líneas)
- **Estado:** Modelo completo con fabricación e instalación
- **Función:** Gestión completa del ciclo de vida
- **Problema:** Duplica información que ya está en `Proyecto.js`
- **Acción:** **DEPRECAR** - Migrar funcionalidad a modelos separados

#### ✅ `Instalacion.js` (existe)
- **Estado:** Modelo de instalaciones
- **Función:** Gestión de instalaciones
- **Acción:** **REVISAR** - Verificar si cumple con requisitos o crear `OrdenInstalacion.js`

#### ❌ `OrdenFabricacion.js` (NO EXISTE)
- **Estado:** No existe
- **Función:** Gestión de órdenes de fabricación
- **Acción:** **CREAR** - Nuevo modelo para producción

#### ⚠️ `Fabricacion.js` (existe pero no funcional)
- **Estado:** Existe pero con imports faltantes
- **Función:** Gestión de fabricación
- **Problema:** No funcional (30%)
- **Acción:** **CORREGIR** o **REEMPLAZAR** con `OrdenFabricacion.js`

---

## 🎯 ESTRATEGIA DE MIGRACIÓN

### Fase 1.1: Análisis y Limpieza (2-3 días)

#### Día 1: Auditoría de Modelos
```bash
# Verificar uso de Pedido.js
rg "require.*Pedido\.js" server --type js
rg "Pedido\." server --type js

# Verificar uso de ProyectoPedido.js
rg "require.*ProyectoPedido" server --type js
rg "ProyectoPedido\." server --type js

# Verificar uso de Fabricacion.js
rg "require.*Fabricacion" server --type js
rg "Fabricacion\." server --type js
```

**Entregables:**
- [ ] Documento de análisis de uso de cada modelo
- [ ] Identificar campos únicos de cada modelo
- [ ] Mapeo de campos a conservar vs deprecar

#### Día 2: Validación de Base de Datos
```javascript
// Conectar a MongoDB y verificar datos
db.proyectos.count()
db.pedidos.count()
db.proyectopedidos.count()
db.fabricaciones.count()
db.instalaciones.count()

// Analizar estructura de documentos
db.proyectos.findOne()
db.pedidos.findOne()
db.proyectopedidos.findOne()
```

**Entregables:**
- [ ] Reporte de datos existentes
- [ ] Identificar datos a migrar
- [ ] Plan de migración de datos

#### Día 3: Diseño de Nuevos Modelos
**Entregables:**
- [ ] Diseño de `OrdenFabricacion.js`
- [ ] Revisión/mejora de `Instalacion.js` o diseño de `OrdenInstalacion.js`
- [ ] Validación de que NO se alteran KPIs comerciales

---

### Fase 1.2: Creación de Modelos de Extensión (3-4 días)

#### `OrdenFabricacion.js` - Nuevo Modelo

**Propósito:** Gestionar órdenes de producción sin alterar datos comerciales

**Estructura propuesta:**
```javascript
{
  // Referencia al proyecto (CRÍTICO)
  proyecto: { type: ObjectId, ref: 'Proyecto', required: true },
  
  // Número de orden
  numeroOrden: String, // Ej: "OF-2025-001"
  
  // Estado de fabricación
  estado: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'control_calidad', 'empaque', 'completada', 'cancelada'],
    default: 'pendiente'
  },
  
  // Productos a fabricar (copiados del proyecto)
  productos: [{
    nombre: String,
    descripcion: String,
    cantidad: Number,
    especificaciones: Object, // Copiado de levantamiento
    
    // Estado de fabricación por producto
    estadoFabricacion: {
      type: String,
      enum: ['pendiente', 'cortando', 'ensamblando', 'terminado'],
      default: 'pendiente'
    },
    
    // Fechas de producción
    fechaInicio: Date,
    fechaTermino: Date,
    
    // Materiales usados
    materialesUsados: [{
      material: String,
      cantidad: Number,
      unidad: String
    }],
    
    // Control de calidad
    controlCalidad: {
      aprobado: Boolean,
      inspector: String,
      fecha: Date,
      observaciones: String,
      fotos: [String]
    }
  }],
  
  // Fechas de la orden
  fechaCreacion: { type: Date, default: Date.now },
  fechaInicio: Date,
  fechaEstimadaTermino: Date,
  fechaRealTermino: Date,
  
  // Asignaciones
  responsableProduccion: { type: ObjectId, ref: 'Usuario' },
  operariosAsignados: [{ type: ObjectId, ref: 'Usuario' }],
  
  // Notas y observaciones
  notas: [{
    fecha: Date,
    usuario: { type: ObjectId, ref: 'Usuario' },
    nota: String
  }],
  
  // Incidencias
  incidencias: [{
    fecha: Date,
    tipo: String,
    descripcion: String,
    resolucion: String,
    resuelta: Boolean
  }],
  
  // Archivos adjuntos
  archivos: [{
    nombre: String,
    url: String,
    tipo: String,
    fecha: Date
  }],
  
  // NO incluir montos ni información comercial
  // Eso permanece en Proyecto.js
}
```

**Características:**
- ✅ Referencia a `Proyecto` (no duplica datos)
- ✅ Enfocado 100% en producción
- ✅ NO incluye montos, anticipos, ni KPIs comerciales
- ✅ Trazabilidad completa de fabricación
- ✅ Control de calidad integrado

#### `OrdenInstalacion.js` - Revisar/Crear

**Opción A:** Si `Instalacion.js` ya cumple con requisitos, solo mejorarlo  
**Opción B:** Crear nuevo modelo `OrdenInstalacion.js`

**Estructura propuesta:**
```javascript
{
  // Referencia al proyecto (CRÍTICO)
  proyecto: { type: ObjectId, ref: 'Proyecto', required: true },
  
  // Referencia a orden de fabricación (opcional)
  ordenFabricacion: { type: ObjectId, ref: 'OrdenFabricacion' },
  
  // Número de orden
  numeroOrden: String, // Ej: "OI-2025-001"
  
  // Estado de instalación
  estado: {
    type: String,
    enum: ['programada', 'en_ruta', 'instalando', 'completada', 'cancelada', 'reprogramada'],
    default: 'programada'
  },
  
  // Programación
  fechaProgramada: Date,
  horaInicio: String,
  horaFin: String,
  
  // Cuadrilla asignada
  cuadrilla: [{
    tecnico: { type: ObjectId, ref: 'Usuario' },
    rol: String, // 'lider', 'ayudante', 'especialista'
  }],
  
  // Productos a instalar (referencia, no duplicar)
  productosInstalar: [{
    productoId: String,
    nombre: String,
    cantidad: Number,
    ubicacion: String,
    instalado: Boolean,
    fechaInstalacion: Date
  }],
  
  // Checklist de instalación
  checklist: [{
    item: String,
    completado: Boolean,
    observaciones: String,
    foto: String
  }],
  
  // Materiales adicionales usados
  materialesAdicionales: [{
    material: String,
    cantidad: Number,
    motivo: String
  }],
  
  // Incidencias
  incidencias: [{
    fecha: Date,
    tipo: String,
    descripcion: String,
    resolucion: String,
    resuelta: Boolean,
    fotos: [String]
  }],
  
  // Evidencias
  evidencias: {
    fotosAntes: [String],
    fotosDurante: [String],
    fotosDespues: [String],
    firmaCliente: String,
    nombreQuienRecibe: String,
    comentariosCliente: String
  },
  
  // Garantía
  garantia: {
    vigente: Boolean,
    fechaInicio: Date,
    fechaFin: Date,
    terminos: String
  },
  
  // Fechas reales
  fechaInicioReal: Date,
  fechaFinReal: Date,
  
  // NO incluir montos ni información comercial
  // Eso permanece en Proyecto.js
}
```

**Características:**
- ✅ Referencia a `Proyecto` (no duplica datos)
- ✅ Enfocado 100% en instalación
- ✅ NO incluye montos, anticipos, ni KPIs comerciales
- ✅ Checklist y evidencias completas
- ✅ Gestión de garantías

---

### Fase 1.3: Migración de Lógica (3-4 días)

#### Paso 1: Crear Controllers

**`ordenFabricacionController.js`**
```javascript
// Crear orden de fabricación desde proyecto aprobado
exports.crearOrdenDesdeProyecto = async (req, res) => {
  const { proyectoId } = req.params;
  
  // 1. Obtener proyecto (con todos sus datos comerciales)
  const proyecto = await Proyecto.findById(proyectoId);
  
  // 2. Verificar que esté aprobado
  if (proyecto.estado !== 'aprobado') {
    return res.status(400).json({ error: 'Proyecto no aprobado' });
  }
  
  // 3. Crear orden de fabricación (solo datos de producción)
  const orden = new OrdenFabricacion({
    proyecto: proyectoId,
    productos: proyecto.productos.map(p => ({
      nombre: p.nombre,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      especificaciones: proyecto.levantamiento // Copiar especificaciones técnicas
    })),
    responsableProduccion: req.user._id
  });
  
  await orden.save();
  
  // 4. Agregar referencia en proyecto (NO alterar otros campos)
  proyecto.ordenes_fabricacion.push(orden._id);
  proyecto.estado = 'fabricacion'; // Actualizar estado del flujo
  await proyecto.save();
  
  // 5. Los KPIs comerciales permanecen intactos
  
  res.json(orden);
};
```

**`ordenInstalacionController.js`**
```javascript
// Crear orden de instalación desde orden de fabricación completada
exports.crearOrdenDesdeProyecto = async (req, res) => {
  const { proyectoId } = req.params;
  
  // 1. Obtener proyecto
  const proyecto = await Proyecto.findById(proyectoId);
  
  // 2. Verificar que tenga orden de fabricación completada
  const ordenFab = await OrdenFabricacion.findOne({
    proyecto: proyectoId,
    estado: 'completada'
  });
  
  if (!ordenFab) {
    return res.status(400).json({ error: 'No hay orden de fabricación completada' });
  }
  
  // 3. Crear orden de instalación
  const ordenInst = new OrdenInstalacion({
    proyecto: proyectoId,
    ordenFabricacion: ordenFab._id,
    productosInstalar: ordenFab.productos.map(p => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      instalado: false
    }))
  });
  
  await ordenInst.save();
  
  // 4. Agregar referencia en proyecto
  proyecto.instalaciones.push(ordenInst._id);
  proyecto.estado = 'instalacion';
  await proyecto.save();
  
  res.json(ordenInst);
};
```

#### Paso 2: Crear Rutas

**`server/routes/ordenFabricacion.js`**
```javascript
const express = require('express');
const router = express.Router();
const ordenFabricacionController = require('../controllers/ordenFabricacionController');
const auth = require('../middleware/auth');

// Crear orden desde proyecto
router.post('/proyecto/:proyectoId', auth, ordenFabricacionController.crearOrdenDesdeProyecto);

// CRUD de órdenes
router.get('/', auth, ordenFabricacionController.listar);
router.get('/:id', auth, ordenFabricacionController.obtener);
router.patch('/:id', auth, ordenFabricacionController.actualizar);
router.patch('/:id/estado', auth, ordenFabricacionController.cambiarEstado);

// Gestión de producción
router.post('/:id/productos/:productoId/iniciar', auth, ordenFabricacionController.iniciarProducto);
router.post('/:id/productos/:productoId/terminar', auth, ordenFabricacionController.terminarProducto);
router.post('/:id/control-calidad', auth, ordenFabricacionController.registrarControlCalidad);

module.exports = router;
```

---

### Fase 1.4: Migración de Datos (2-3 días)

#### Script de Migración

**`server/scripts/migrarAOrdenesProduccion.js`**
```javascript
const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const ProyectoPedido = require('../models/ProyectoPedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const logger = require('../config/logger');

async function migrarProyectoPedidosAOrdenes() {
  try {
    logger.info('Iniciando migración de ProyectoPedido a OrdenFabricacion');
    
    // 1. Obtener todos los ProyectoPedido con fabricación
    const proyectoPedidos = await ProyectoPedido.find({
      'fabricacion.estado': { $exists: true }
    });
    
    logger.info(`Encontrados ${proyectoPedidos.length} ProyectoPedidos con fabricación`);
    
    for (const pp of proyectoPedidos) {
      // 2. Buscar proyecto correspondiente
      let proyecto = await Proyecto.findOne({
        'cliente.telefono': pp.cliente.telefono,
        numero: pp.numero
      });
      
      if (!proyecto) {
        logger.warn(`No se encontró proyecto para ProyectoPedido ${pp._id}`);
        continue;
      }
      
      // 3. Crear OrdenFabricacion con datos de fabricación
      const ordenFab = new OrdenFabricacion({
        proyecto: proyecto._id,
        numeroOrden: `OF-${pp.numero}`,
        estado: pp.fabricacion.estado,
        productos: pp.fabricacion.productos || [],
        fechaCreacion: pp.fabricacion.fechaInicio || pp.createdAt,
        fechaInicio: pp.fabricacion.fechaInicio,
        fechaEstimadaTermino: pp.fabricacion.fechaEstimadaTermino,
        fechaRealTermino: pp.fabricacion.fechaTermino,
        notas: pp.fabricacion.notas || []
      });
      
      await ordenFab.save();
      
      // 4. Agregar referencia en proyecto (SIN alterar KPIs)
      if (!proyecto.ordenes_fabricacion.includes(ordenFab._id)) {
        proyecto.ordenes_fabricacion.push(ordenFab._id);
        await proyecto.save();
      }
      
      logger.info(`Migrado ProyectoPedido ${pp._id} → OrdenFabricacion ${ordenFab._id}`);
    }
    
    logger.info('Migración completada exitosamente');
    
  } catch (error) {
    logger.error('Error en migración', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Ejecutar migración
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => migrarProyectoPedidosAOrdenes())
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('Error fatal en migración', { error: err.message });
      process.exit(1);
    });
}

module.exports = { migrarProyectoPedidosAOrdenes };
```

---

### Fase 1.5: Actualización de KPIs (1-2 días)

#### Verificar que KPIs NO se alteran

**`server/services/kpisComerciales.js`**
```javascript
// MANTENER EXACTAMENTE IGUAL
// Los KPIs comerciales siguen usando Proyecto.js

exports.obtenerKPIsComerciales = async () => {
  const proyectos = await Proyecto.find({ activo: true });
  
  return {
    // Estos campos NO se alteran
    totalVentas: proyectos.reduce((sum, p) => sum + p.total, 0),
    totalAnticipos: proyectos.reduce((sum, p) => sum + p.anticipo, 0),
    totalSaldos: proyectos.reduce((sum, p) => sum + p.saldo_pendiente, 0),
    clientesAtendidos: new Set(proyectos.map(p => p.cliente.telefono)).size,
    proyectosActivos: proyectos.filter(p => p.estado !== 'completado' && p.estado !== 'cancelado').length,
    
    // Por estado (comercial)
    porEstado: {
      levantamiento: proyectos.filter(p => p.estado === 'levantamiento').length,
      cotizacion: proyectos.filter(p => p.estado === 'cotizacion').length,
      aprobado: proyectos.filter(p => p.estado === 'aprobado').length,
      fabricacion: proyectos.filter(p => p.estado === 'fabricacion').length,
      instalacion: proyectos.filter(p => p.estado === 'instalacion').length,
      completado: proyectos.filter(p => p.estado === 'completado').length
    }
  };
};
```

#### Agregar KPIs de Producción (NUEVOS)

**`server/services/kpisProduccion.js`**
```javascript
// NUEVO servicio para KPIs de producción
const OrdenFabricacion = require('../models/OrdenFabricacion');

exports.obtenerKPIsProduccion = async () => {
  const ordenes = await OrdenFabricacion.find();
  
  return {
    totalOrdenes: ordenes.length,
    ordenesPendientes: ordenes.filter(o => o.estado === 'pendiente').length,
    ordenesEnProceso: ordenes.filter(o => o.estado === 'en_proceso').length,
    ordenesCompletadas: ordenes.filter(o => o.estado === 'completada').length,
    
    // Tiempos promedio
    tiempoPromedioProduccion: calcularTiempoPromedio(ordenes),
    
    // Eficiencia
    eficienciaProduccion: calcularEficiencia(ordenes)
  };
};
```

---

## 📊 VERIFICACIÓN DE NO ALTERACIÓN

### Checklist de Validación

Antes de considerar completada la migración, verificar:

#### ✅ KPIs Comerciales Intactos
```javascript
// Script de verificación
const proyectos = await Proyecto.find();

// Verificar que estos campos existen y tienen valores
proyectos.forEach(p => {
  assert(p.total !== undefined, 'Campo total existe');
  assert(p.anticipo !== undefined, 'Campo anticipo existe');
  assert(p.saldo_pendiente !== undefined, 'Campo saldo_pendiente existe');
  assert(p.monto_estimado !== undefined, 'Campo monto_estimado existe');
  assert(p.subtotal !== undefined, 'Campo subtotal existe');
  assert(p.iva !== undefined, 'Campo iva existe');
  assert(p.cliente !== undefined, 'Campo cliente existe');
  assert(p.estado !== undefined, 'Campo estado existe');
});
```

#### ✅ Referencias Correctas
```javascript
// Verificar que las referencias se crearon correctamente
const proyectosConOrdenes = await Proyecto.find({
  ordenes_fabricacion: { $exists: true, $ne: [] }
}).populate('ordenes_fabricacion');

proyectosConOrdenes.forEach(p => {
  assert(p.ordenes_fabricacion.length > 0, 'Tiene órdenes de fabricación');
  p.ordenes_fabricacion.forEach(of => {
    assert(of.proyecto.toString() === p._id.toString(), 'Referencia bidireccional correcta');
  });
});
```

#### ✅ Reportes Comerciales Funcionando
```bash
# Ejecutar reportes existentes y verificar que funcionan igual
npm run test:kpis-comerciales
```

---

## 📅 CRONOGRAMA DETALLADO

### Semana 1: Análisis y Diseño (5 días)
- **Día 1:** Auditoría de modelos existentes
- **Día 2:** Validación de base de datos
- **Día 3:** Diseño de OrdenFabricacion.js
- **Día 4:** Diseño de OrdenInstalacion.js
- **Día 5:** Revisión y aprobación de diseños

### Semana 2: Implementación (5 días)
- **Día 6:** Crear modelo OrdenFabricacion.js
- **Día 7:** Crear modelo OrdenInstalacion.js
- **Día 8:** Crear controllers y rutas
- **Día 9:** Crear servicios de KPIs de producción
- **Día 10:** Pruebas unitarias de modelos

### Semana 3: Migración y Validación (5 días)
- **Día 11:** Script de migración de datos
- **Día 12:** Ejecutar migración en entorno de prueba
- **Día 13:** Validar KPIs comerciales intactos
- **Día 14:** Pruebas de integración
- **Día 15:** Correcciones y ajustes

### Semana 4: Limpieza y Documentación (3 días)
- **Día 16:** Deprecar ProyectoPedido.js
- **Día 17:** Actualizar documentación
- **Día 18:** Deploy y monitoreo

**Total:** 18 días (~3.5 semanas)

---

## 🎯 CRITERIOS DE ÉXITO

### Funcionales
- ✅ Órdenes de fabricación se crean desde proyectos aprobados
- ✅ Órdenes de instalación se crean desde órdenes completadas
- ✅ Flujo completo: Proyecto → Fabricación → Instalación
- ✅ Trazabilidad completa de producción

### No Funcionales
- ✅ **CRÍTICO:** KPIs comerciales 100% intactos
- ✅ **CRÍTICO:** Reportes comerciales funcionando igual
- ✅ **CRÍTICO:** No se pierden datos de ventas
- ✅ Todos los campos comerciales preservados
- ✅ Referencias bidireccionales correctas
- ✅ Pruebas unitarias pasando

### Técnicos
- ✅ Modelos bien diseñados y documentados
- ✅ Controllers con manejo de errores
- ✅ Logging estructurado en todas las operaciones
- ✅ Índices optimizados en nuevos modelos
- ✅ Migración de datos exitosa

---

## 🚨 RIESGOS Y MITIGACIÓN

### Riesgo 1: Alteración de KPIs Comerciales
**Probabilidad:** Baja  
**Impacto:** CRÍTICO  
**Mitigación:**
- Validación exhaustiva antes de deploy
- Script de verificación de KPIs
- Backup completo de base de datos
- Rollback plan preparado

### Riesgo 2: Pérdida de Datos en Migración
**Probabilidad:** Media  
**Impacto:** ALTO  
**Mitigación:**
- Backup completo antes de migración
- Migración en entorno de prueba primero
- Validación de datos migrados
- Script de rollback

### Riesgo 3: Referencias Rotas
**Probabilidad:** Media  
**Impacto:** MEDIO  
**Mitigación:**
- Validación de referencias bidireccionales
- Pruebas de integridad referencial
- Logging de errores de referencia

---

## 📚 DOCUMENTACIÓN A GENERAR

1. **Guía de Uso de Órdenes de Fabricación**
2. **Guía de Uso de Órdenes de Instalación**
3. **API Documentation** (endpoints nuevos)
4. **Diagrama de Flujo** (Proyecto → Fabricación → Instalación)
5. **Reporte de Migración** (datos migrados, validaciones)

---

## ✅ SIGUIENTE PASO

**ACCIÓN INMEDIATA:** Ejecutar auditoría de modelos existentes

```bash
# Analizar uso de modelos
rg "require.*Pedido\.js" server --type js > analisis-pedido.txt
rg "require.*ProyectoPedido" server --type js > analisis-proyecto-pedido.txt
rg "require.*Fabricacion" server --type js > analisis-fabricacion.txt
```

**Responsable:** Equipo Desarrollo CRM Sundeck  
**Fecha de inicio:** 31 Octubre 2025  
**Duración estimada:** 18 días (3.5 semanas)  
**Estado:** ✅ Plan aprobado - Listo para iniciar
