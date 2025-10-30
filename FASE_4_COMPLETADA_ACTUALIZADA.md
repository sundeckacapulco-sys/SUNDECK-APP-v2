# ✅ FASE 4 COMPLETADA - Funciones de Guardado (ACTUALIZADA)

**Fecha de implementación**: 30 de Octubre, 2025  
**Estado**: ✅ COMPLETADO CON MEJORAS EN MODELO DE DATOS

---

## 📋 CAMBIOS ADICIONALES IMPLEMENTADOS

### **1. Normalización de Partidas en Controlador**

Se implementó normalización y validación de entradas en el controlador de proyectos para:
- ✅ Validar estructura de partidas de levantamiento y cotización
- ✅ Generar totales automáticamente (m², subtotales, motorización, instalación)
- ✅ Sincronizar medidas y estado al guardar
- ✅ Mantener consistencia entre levantamiento y cotización

**Ubicación**: `server/controllers/proyectoController.js`

---

### **2. Ampliación del Esquema de Proyecto**

#### **Campo `levantamiento` (Nuevo)**
**Ubicación**: `server/models/Proyecto.js` (líneas 74-139)

```javascript
levantamiento: {
  partidas: [{
    ubicacion: String,
    producto: String,
    color: String,
    modelo: String,
    cantidad: Number,
    piezas: [{
      // 13 campos técnicos
      ancho: Number,
      alto: Number,
      m2: Number,
      sistema: String,
      control: String,
      instalacion: String,
      fijacion: String,
      caida: String,
      galeria: String,
      telaMarca: String,
      baseTabla: String,
      operacion: String,
      detalle: String,
      traslape: String,
      modeloCodigo: String,
      color: String,
      observacionesTecnicas: String,
      precioM2: Number
    }],
    motorizacion: {
      activa: Boolean,
      modeloMotor: String,
      precioMotor: Number,
      cantidadMotores: Number,
      modeloControl: String,
      precioControl: Number,
      tipoControl: String,
      piezasPorControl: Number
    },
    instalacionEspecial: {
      activa: Boolean,
      tipoCobro: String,
      precioBase: Number,
      precioPorPieza: Number,
      observaciones: String
    },
    totales: {
      m2: Number,
      subtotal: Number,
      costoMotorizacion: Number,
      costoInstalacion: Number
    }
  }],
  totales: {
    m2: Number,
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  },
  observaciones: String,
  personaVisita: String,
  actualizadoEn: Date
}
```

**Propósito**: 
- Persistir el levantamiento estructurado completo
- Mantener historial de medidas técnicas
- Facilitar regeneración de cotizaciones

---

#### **Campo `cotizacionActual` (Nuevo)**
**Ubicación**: `server/models/Proyecto.js` (líneas 141-172)

```javascript
cotizacionActual: {
  cotizacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cotizacion'
  },
  numero: String,
  totales: {
    m2: Number,
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  },
  precioReglas: {
    precio_m2: Number,
    aplicaDescuento: Boolean,
    tipoDescuento: String,
    valorDescuento: Number
  },
  facturacion: {
    requiereFactura: Boolean,
    razonSocial: String,
    rfc: String
  },
  observaciones: String,
  personaVisita: String,
  fechaCreacion: Date
}
```

**Propósito**:
- Resumen rápido de la última cotización generada
- Evitar consultas adicionales a la colección Cotizacion
- Facilitar reportes y KPIs

---

### **3. Referencia a Proyectos en Cotización**

#### **Campo `proyecto` con Índice**
**Ubicación**: `server/models/Cotizacion.js` (líneas 9-12)

```javascript
proyecto: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Proyecto'
}
```

**Índice agregado**:
```javascript
cotizacionSchema.index({ proyecto: 1 });
```

**Propósito**:
- Vincular cotizaciones con proyectos
- Permitir consultas rápidas: "todas las cotizaciones de un proyecto"
- Mantener trazabilidad completa

---

## 🔄 FLUJO DE DATOS ACTUALIZADO

### **Guardado de Levantamiento**

```
Frontend (handleGuardarMedidasTecnicas)
    ↓
    Payload con partidas normalizadas
    ↓
Backend (guardarLevantamiento)
    ↓
    1. Validar estructura de partidas
    2. Calcular totales por partida
    3. Calcular totales del proyecto
    4. Guardar en Proyecto.levantamiento
    5. Actualizar Proyecto.estado = 'levantamiento'
    6. Registrar evento AUDIT
    ↓
Respuesta al frontend
```

### **Creación de Cotización**

```
Frontend (handleGuardarCotizacionEnVivo)
    ↓
    Payload con partidas + precios
    ↓
Backend (crearCotizacionDesdeProyecto)
    ↓
    1. Validar estructura y precios
    2. Calcular totales con motorización e instalación
    3. Aplicar descuentos e IVA
    4. Generar número secuencial (COT-0001)
    5. Crear documento Cotizacion
    6. Actualizar Proyecto.levantamiento (con precios)
    7. Actualizar Proyecto.cotizacionActual (resumen)
    8. Vincular Cotizacion.proyecto = proyectoId
    9. Actualizar Proyecto.estado = 'cotizacion'
    10. Registrar evento AUDIT
    ↓
Respuesta con proyecto y cotización
```

---

## 📊 ESTRUCTURA DE DATOS COMPLETA

### **Proyecto (MongoDB)**

```javascript
{
  _id: ObjectId("proj_xxx"),
  cliente: {
    nombre: "Juan Pérez",
    telefono: "7441234567",
    correo: "juan@email.com",
    direccion: "Av. Principal #123",
    zona: "Diamante"
  },
  estado: "cotizacion",
  
  // LEVANTAMIENTO ESTRUCTURADO (Nuevo)
  levantamiento: {
    partidas: [{
      ubicacion: "Sala comedor",
      producto: "Persianas Blackout",
      color: "Ivory",
      modelo: "Long Beach",
      cantidad: 3,
      piezas: [
        { ancho: 2.5, alto: 3.0, m2: 7.5, sistema: "Roller", ... },
        { ancho: 2.5, alto: 3.0, m2: 7.5, sistema: "Roller", ... },
        { ancho: 2.5, alto: 3.0, m2: 7.5, sistema: "Roller", ... }
      ],
      motorizacion: {
        activa: true,
        modeloMotor: "Somfy RTS",
        precioMotor: 7000,
        cantidadMotores: 1,
        modeloControl: "15 canales",
        precioControl: 1200
      },
      instalacionEspecial: {
        activa: true,
        tipoCobro: "Fijo",
        precioBase: 3500
      },
      totales: {
        m2: 22.5,
        subtotal: 25450,
        costoMotorizacion: 8200,
        costoInstalacion: 3500
      }
    }],
    totales: {
      m2: 22.5,
      subtotal: 25450,
      descuento: 2545,
      iva: 3664.80,
      total: 26569.80
    },
    observaciones: "Cliente prefiere instalación en fin de semana",
    personaVisita: "Carlos Mendoza",
    actualizadoEn: ISODate("2025-10-30T15:30:00Z")
  },
  
  // RESUMEN DE COTIZACIÓN ACTUAL (Nuevo)
  cotizacionActual: {
    cotizacion: ObjectId("cot_xxx"),
    numero: "COT-0042",
    totales: {
      m2: 22.5,
      subtotal: 25450,
      descuento: 2545,
      iva: 3664.80,
      total: 26569.80
    },
    precioReglas: {
      precio_m2: 750,
      aplicaDescuento: true,
      tipoDescuento: "porcentaje",
      valorDescuento: 10
    },
    facturacion: {
      requiereFactura: true,
      razonSocial: "Empresa SA de CV",
      rfc: "EMP123456ABC"
    },
    fechaCreacion: ISODate("2025-10-30T15:35:00Z")
  }
}
```

### **Cotizacion (MongoDB)**

```javascript
{
  _id: ObjectId("cot_xxx"),
  numero: "COT-0042",
  
  // REFERENCIA A PROYECTO (Nuevo con índice)
  proyecto: ObjectId("proj_xxx"),
  
  cliente: {
    nombre: "Juan Pérez",
    telefono: "7441234567",
    correo: "juan@email.com",
    direccion: "Av. Principal #123"
  },
  
  partidas: [{
    ubicacion: "Sala comedor",
    producto: "Persianas Blackout",
    color: "Ivory",
    modelo: "Long Beach",
    cantidad: 3,
    piezas: [{ /* 13 campos técnicos */ }],
    motorizacion: { /* datos de motorización */ },
    instalacionEspecial: { /* datos de instalación */ },
    totales: { m2: 22.5, subtotal: 25450 }
  }],
  
  totales: {
    m2: 22.5,
    subtotal: 25450,
    descuento: 2545,
    iva: 3664.80,
    total: 26569.80
  },
  
  precioReglas: {
    precio_m2: 750,
    aplicaDescuento: true,
    tipoDescuento: "porcentaje",
    valorDescuento: 10
  },
  
  facturacion: {
    requiereFactura: true,
    razonSocial: "Empresa SA de CV",
    rfc: "EMP123456ABC"
  },
  
  estado: "borrador",
  creado_por: ObjectId("user_xxx"),
  fecha: ISODate("2025-10-30T15:35:00Z")
}
```

---

## 🔍 CONSULTAS HABILITADAS

### **1. Obtener proyecto con levantamiento y cotización**
```javascript
const proyecto = await Proyecto.findById(id)
  .populate('cotizacionActual.cotizacion');

// Acceso directo:
console.log(proyecto.levantamiento.totales.m2);
console.log(proyecto.cotizacionActual.numero);
```

### **2. Obtener todas las cotizaciones de un proyecto**
```javascript
const cotizaciones = await Cotizacion.find({ proyecto: proyectoId })
  .sort({ fecha: -1 });
```

### **3. Regenerar cotización desde levantamiento**
```javascript
// El levantamiento está persistido en Proyecto.levantamiento
// Se puede usar para regenerar cotización con nuevos precios
const nuevosCotizacion = calcularConNuevosPreciosDesde(
  proyecto.levantamiento.partidas
);
```

---

## 📈 VENTAJAS DE LA NORMALIZACIÓN

### **1. Consistencia de Datos**
- ✅ Una sola fuente de verdad para levantamiento
- ✅ Resumen de cotización siempre disponible
- ✅ Sincronización automática entre Proyecto y Cotizacion

### **2. Performance**
- ✅ Menos consultas a la base de datos
- ✅ Índice en `Cotizacion.proyecto` acelera búsquedas
- ✅ Resumen en `cotizacionActual` evita populate

### **3. Trazabilidad**
- ✅ Historial completo de levantamiento
- ✅ Vínculo bidireccional Proyecto ↔ Cotizacion
- ✅ Auditoría completa con eventos

### **4. Flexibilidad**
- ✅ Regenerar cotizaciones con nuevos precios
- ✅ Comparar versiones de cotizaciones
- ✅ Reportes y KPIs más precisos

---

## 🧪 VALIDACIONES IMPLEMENTADAS

### **En el Controlador `guardarLevantamiento`**

```javascript
// 1. Validar estructura de partidas
if (!partidas || !Array.isArray(partidas) || partidas.length === 0) {
  throw new Error('Partidas inválidas');
}

// 2. Validar cada partida
partidas.forEach(partida => {
  if (!partida.ubicacion) throw new Error('Ubicación requerida');
  if (!partida.piezas || partida.piezas.length === 0) {
    throw new Error('Piezas requeridas');
  }
  
  // 3. Validar cada pieza (13 campos técnicos)
  partida.piezas.forEach(pieza => {
    if (!pieza.ancho || pieza.ancho <= 0) throw new Error('Ancho inválido');
    if (!pieza.alto || pieza.alto <= 0) throw new Error('Alto inválido');
    if (!pieza.sistema) throw new Error('Sistema requerido');
    // ... validar los 13 campos
  });
});

// 4. Calcular y validar totales
const totalesCalculados = calcularTotales(partidas);
if (totalesCalculados.m2 !== totales.m2) {
  throw new Error('Totales inconsistentes');
}
```

### **En el Controlador `crearCotizacionDesdeProyecto`**

```javascript
// Validaciones adicionales para cotización
if (!precioReglas.precio_m2 || precioReglas.precio_m2 <= 0) {
  throw new Error('Precio por m² requerido');
}

if (facturacion.requiereFactura) {
  if (!facturacion.razonSocial || !facturacion.rfc) {
    throw new Error('Datos de facturación incompletos');
  }
}
```

---

## 📊 EVENTOS DE AUDITORÍA ACTUALIZADOS

### **LEVANTAMIENTO_GUARDADO**
```javascript
{
  proyectoId: String,
  usuario: String,
  partidas: Number,
  m2Total: Number,
  partidasDetalle: [{
    ubicacion: String,
    m2: Number,
    piezas: Number
  }],
  fecha: Date
}
```

### **COTIZACION_CREADA**
```javascript
{
  proyectoId: String,
  cotizacionId: String,
  numero: String,
  usuario: String,
  total: Number,
  m2Total: Number,
  partidasCount: Number,
  tieneMotorizacion: Boolean,
  tieneInstalacion: Boolean,
  requiereFactura: Boolean,
  fecha: Date
}
```

---

## ✅ DEFINITION OF DONE - FASE 4 (ACTUALIZADA)

- [x] Validar 13 campos técnicos obligatorios
- [x] Calcular totales correctamente (pieza → partida → proyecto)
- [x] Guardar sin precios funcional
- [x] Guardar con precios funcional
- [x] Endpoints backend implementados
- [x] Eventos de auditoría registrados
- [x] **Normalización de partidas en controlador** ✨
- [x] **Esquema Proyecto ampliado con `levantamiento`** ✨
- [x] **Esquema Proyecto ampliado con `cotizacionActual`** ✨
- [x] **Referencia `proyecto` en Cotizacion con índice** ✨
- [x] **Sincronización automática entre modelos** ✨

---

## 🚀 IMPACTO EN FASE 5 (Generación de PDF)

Con estos cambios, la Fase 5 se simplifica:

### **Antes (sin normalización)**
```javascript
// Necesitaba consultar múltiples colecciones
const proyecto = await Proyecto.findById(id);
const cotizacion = await Cotizacion.findById(proyecto.cotizacion_id);
const partidas = await Partida.find({ proyecto: id });
// ... más consultas
```

### **Ahora (con normalización)**
```javascript
// Una sola consulta con todo incluido
const proyecto = await Proyecto.findById(id)
  .populate('cotizacionActual.cotizacion');

// Datos listos para PDF
const datos = {
  cliente: proyecto.cliente,
  partidas: proyecto.levantamiento.partidas, // ✅ Ya estructurado
  totales: proyecto.cotizacionActual.totales, // ✅ Ya calculado
  numero: proyecto.cotizacionActual.numero    // ✅ Ya disponible
};
```

---

## 📝 MIGRACIÓN DE DATOS EXISTENTES

Si hay proyectos existentes sin la nueva estructura:

```javascript
// Script de migración (opcional)
async function migrarProyectosExistentes() {
  const proyectos = await Proyecto.find({ levantamiento: { $exists: false } });
  
  for (const proyecto of proyectos) {
    // Migrar medidas antiguas a levantamiento estructurado
    proyecto.levantamiento = {
      partidas: convertirMedidasAPartidas(proyecto.medidas),
      totales: calcularTotales(proyecto.medidas),
      actualizadoEn: new Date()
    };
    
    await proyecto.save();
  }
}
```

---

**Estado**: ✅ FASE 4 COMPLETADA CON MEJORAS  
**Fecha**: 30 de Octubre, 2025  
**Mejoras implementadas**: Normalización, persistencia estructurada, índices  
**Siguiente fase**: FASE 5 - Generación de PDF (simplificada gracias a normalización)
