# ✅ FASE 4 COMPLETADA - Funciones de Guardado

**Fecha de implementación**: 30 de Octubre, 2025  
**Estado**: ✅ COMPLETADO  

---

## 📋 RESUMEN DE IMPLEMENTACIÓN

### **Objetivo**
Implementar funciones de guardado completas con validaciones de 13 campos técnicos obligatorios, cálculos automáticos de totales, y estructura de datos según el contrato definido.

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### **1. Frontend: Validaciones y Cálculos**

#### ✅ **Función `validarCamposTecnicos(pieza)`**
**Ubicación**: `client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx` (líneas 313-357)

**Valida 13 campos técnicos obligatorios por pieza:**
1. ✅ Ancho > 0
2. ✅ Alto > 0
3. ✅ Sistema (array, no vacío)
4. ✅ Control (tipoControl)
5. ✅ Instalación (tipoInstalacion)
6. ✅ Fijación (tipoFijacion)
7. ✅ Caída/Orientación
8. ✅ Galería
9. ✅ Modo de Operación
10. ✅ Tela/Marca (opcional)
11. ✅ Base/Tabla (opcional)
12. ✅ Detalle Técnico (opcional)
13. ✅ Traslape (opcional)

**Validación especial:**
- Si `modoOperacion === 'motorizado'` → Valida que exista `motorModelo`

**Retorna:**
- Array de errores con mensajes específicos por pieza

---

#### ✅ **Función `calcularTotalesPartida(pieza, conPrecios)`**
**Ubicación**: `client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx` (líneas 362-414)

**Cálculos implementados:**

```javascript
// 1. Calcular m² totales
totalM2 = Σ(ancho × alto) de todas las piezas

// 2. Calcular subtotal de productos (si conPrecios)
subtotal = Σ(m2 × precioM2) de todas las piezas

// 3. Agregar motorización (si aplica)
costoMotorizacion = (numMotores × precioMotor) + precioControl
subtotal += costoMotorizacion

// 4. Agregar instalación especial (si aplica)
// Tipo Fijo:
costoInstalacion = precioBase

// Tipo Por Pieza:
costoInstalacion = cantidad × precioBase

// Tipo Base + Por Pieza:
costoInstalacion = precioBase + ((cantidad - 1) × precioPorPieza)

subtotal += costoInstalacion
```

**Retorna:**
```javascript
{
  m2: Number,              // Total m² con 2 decimales
  subtotal: Number,        // Subtotal con 2 decimales
  costoMotorizacion: Number,
  costoInstalacion: Number
}
```

---

### **2. Frontend: Función de Guardado SIN PRECIOS**

#### ✅ **Función `handleGuardarMedidasTecnicas()`**
**Ubicación**: `client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx` (líneas 419-523)

**Flujo de guardado:**

```
1. Validar que hay partidas
   ↓
2. Validar 13 campos técnicos de todas las partidas
   ↓
3. Preparar partidas con estructura normalizada
   ↓
4. Calcular totales del proyecto (solo m²)
   ↓
5. Enviar PATCH a /api/proyectos/:id/levantamiento
   ↓
6. Cerrar modal y actualizar vista
```

**Payload enviado:**
```javascript
{
  tipo: 'levantamiento',
  partidas: [{
    ubicacion: String,
    producto: String,
    color: String,
    modelo: String,
    cantidad: Number,
    piezas: [{
      ancho: Number,
      alto: Number,
      m2: Number,
      sistema: [String],
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
      observacionesTecnicas: String
    }],
    totales: {
      m2: Number,
      subtotal: 0,
      costoMotorizacion: 0,
      costoInstalacion: 0
    }
  }],
  totales: {
    m2: Number  // Total del proyecto
  },
  observaciones: String,
  personaVisita: String
}
```

**Manejo de errores:**
- ✅ Validación de partidas vacías
- ✅ Validación de campos técnicos
- ✅ Mensajes de error específicos por campo
- ✅ Manejo de errores del backend

---

### **3. Frontend: Función de Guardado CON PRECIOS**

#### ✅ **Función `handleGuardarCotizacionEnVivo()`**
**Ubicación**: `client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx` (líneas 528-699)

**Flujo de guardado:**

```
1. Validar que hay partidas
   ↓
2. Validar 13 campos técnicos
   ↓
3. Validar precio general > 0
   ↓
4. Preparar partidas con precios y totales
   ↓
5. Calcular totales del proyecto
   ↓
6. Aplicar descuentos (porcentaje o monto fijo)
   ↓
7. Calcular IVA (si requiere factura)
   ↓
8. Enviar POST a /api/proyectos/:id/cotizaciones
   ↓
9. Cerrar modal y actualizar vista
```

**Payload enviado:**
```javascript
{
  tipo: 'cotizacion',
  partidas: [{
    ubicacion: String,
    producto: String,
    color: String,
    modelo: String,
    cantidad: Number,
    piezas: [{
      // ... mismos campos técnicos
      precioM2: Number  // ← Incluye precio
    }],
    motorizacion: {
      activa: Boolean,
      modeloMotor: String,
      precioMotor: Number,
      cantidadMotores: Number,
      modeloControl: String,
      precioControl: Number,
      tipoControl: 'Individual' | 'Multicanal',
      piezasPorControl: Number
    },
    instalacionEspecial: {
      activa: Boolean,
      tipoCobro: 'Fijo' | 'Por pieza' | 'Base + Por pieza',
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
  precioReglas: {
    precio_m2: Number,
    aplicaDescuento: Boolean,
    tipoDescuento: 'porcentaje' | 'monto',
    valorDescuento: Number
  },
  facturacion: {
    requiereFactura: Boolean,
    razonSocial: String,
    rfc: String
  },
  totales: {
    m2: Number,
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  },
  observaciones: String,
  personaVisita: String
}
```

**Cálculos de totales:**
```javascript
// 1. Subtotal del proyecto
subtotalProyecto = Σ(partida.totales.subtotal)

// 2. Descuento
if (tipoDescuento === 'porcentaje') {
  descuento = subtotalProyecto × (valorDescuento / 100)
} else {
  descuento = valorDescuento
}

// 3. Subtotal con descuento
subtotalConDescuento = subtotalProyecto - descuento

// 4. IVA
iva = requiereFactura ? subtotalConDescuento × 0.16 : 0

// 5. Total final
total = subtotalConDescuento + iva
```

---

### **4. Backend: Controladores**

#### ✅ **Función `guardarLevantamiento(req, res)`**
**Ubicación**: `server/controllers/proyectoController.js` (líneas 708-758)

**Funcionalidad:**
- Recibe payload del frontend
- Busca el proyecto por ID
- Actualiza campos: `partidas`, `totales`, `observaciones`, `personaVisita`
- Cambia estado a `'levantamiento'`
- Registra evento de auditoría: `LEVANTAMIENTO_GUARDADO`
- Retorna proyecto actualizado

**Evento de auditoría:**
```javascript
console.log('📊 AUDIT: LEVANTAMIENTO_GUARDADO', {
  proyectoId: id,
  usuario: req.usuario.id,
  partidas: partidas.length,
  m2Total: totales.m2,
  fecha: new Date()
});
```

---

#### ✅ **Función `crearCotizacionDesdeProyecto(req, res)`**
**Ubicación**: `server/controllers/proyectoController.js` (líneas 760-852)

**Funcionalidad:**
- Recibe payload del frontend
- Busca el proyecto por ID
- Genera número de cotización secuencial: `COT-0001`, `COT-0002`, etc.
- Crea documento `Cotizacion` en MongoDB
- Actualiza proyecto con referencia a cotización
- Cambia estado a `'cotizacion'`
- Registra evento de auditoría: `COTIZACION_CREADA`
- Retorna proyecto y cotización

**Generación de número:**
```javascript
const ultimaCotizacion = await Cotizacion.findOne().sort({ numero: -1 });
let numeroSecuencial = 1;
if (ultimaCotizacion && ultimaCotizacion.numero) {
  const match = ultimaCotizacion.numero.match(/COT-(\d+)/);
  if (match) {
    numeroSecuencial = parseInt(match[1]) + 1;
  }
}
const numeroCotizacion = `COT-${String(numeroSecuencial).padStart(4, '0')}`;
```

**Evento de auditoría:**
```javascript
console.log('📊 AUDIT: COTIZACION_CREADA', {
  proyectoId: id,
  cotizacionId: nuevaCotizacion._id,
  numero: numeroCotizacion,
  usuario: req.usuario.id,
  total: totales.total,
  m2Total: totales.m2,
  fecha: new Date()
});
```

---

### **5. Backend: Rutas**

#### ✅ **Ruta PATCH `/api/proyectos/:id/levantamiento`**
**Ubicación**: `server/routes/proyectos.js` (líneas 101-106)

```javascript
router.patch('/:id/levantamiento', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  guardarLevantamiento
);
```

**Middleware aplicado:**
- ✅ `auth` - Autenticación JWT
- ✅ `verificarPermiso('proyectos', 'editar')` - Autorización

---

#### ✅ **Ruta POST `/api/proyectos/:id/cotizaciones`**
**Ubicación**: `server/routes/proyectos.js` (líneas 108-113)

```javascript
router.post('/:id/cotizaciones', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  crearCotizacionDesdeProyecto
);
```

**Middleware aplicado:**
- ✅ `auth` - Autenticación JWT
- ✅ `verificarPermiso('proyectos', 'editar')` - Autorización

---

## 📊 EVENTOS DE AUDITORÍA IMPLEMENTADOS

### **1. LEVANTAMIENTO_GUARDADO**
```javascript
{
  proyectoId: String,
  usuario: String,
  partidas: Number,
  m2Total: Number,
  fecha: Date
}
```

### **2. COTIZACION_CREADA**
```javascript
{
  proyectoId: String,
  cotizacionId: String,
  numero: String,  // COT-0001
  usuario: String,
  total: Number,
  m2Total: Number,
  fecha: Date
}
```

**Uso para KPIs:**
- Tiempo de conversión: levantamiento → cotización
- Tasa de conversión: levantamientos vs cotizaciones
- Ticket promedio por m²
- Productividad por asesor

---

## ✅ DEFINITION OF DONE - FASE 4

### **Checklist de Aceptación**

- [x] **Validar 13 campos técnicos obligatorios por pieza**
  - Ancho, alto, sistema, control, instalación, fijación, caída, galería, operación
  - Validación especial para motorización

- [x] **Calcular totales correctamente**
  - m² = ancho × alto
  - Subtotal = m² × precio
  - Motorización = (motores × precio) + control
  - Instalación = según tipo (fijo, por pieza, base + pieza)

- [x] **Función `handleGuardarMedidasTecnicas` implementada**
  - Validaciones completas
  - Payload estructurado
  - Manejo de errores
  - Cierre de modal y actualización

- [x] **Función `handleGuardarCotizacionEnVivo` implementada**
  - Validaciones completas
  - Cálculos de descuentos e IVA
  - Payload con precios y totales
  - Manejo de errores

- [x] **Endpoint PATCH `/api/proyectos/:id/levantamiento`**
  - Controlador implementado
  - Ruta registrada
  - Middleware de autenticación y autorización

- [x] **Endpoint POST `/api/proyectos/:id/cotizaciones`**
  - Controlador implementado
  - Generación de número secuencial
  - Creación de documento Cotizacion
  - Vinculación con Proyecto

- [x] **Eventos de auditoría registrados**
  - LEVANTAMIENTO_GUARDADO
  - COTIZACION_CREADA
  - Logs con información completa

- [x] **Estados agregados en frontend**
  - `razonSocial`
  - `rfc`
  - Todos los estados necesarios para cotización

---

## 🧪 PRUEBAS RECOMENDADAS

### **Test 1: Guardado de Levantamiento (Sin precios)**
```
1. Abrir modal en modo "Levantamiento"
2. Agregar partida con 3 piezas
3. Llenar todos los 13 campos técnicos
4. Usar campos manuales (Detalle: Otro, Traslape: Otro)
5. Hacer clic en "Guardar"
6. Verificar:
   ✓ No hay errores de validación
   ✓ Request se envía correctamente
   ✓ Proyecto se actualiza en BD
   ✓ Modal se cierra
   ✓ Lista se actualiza
```

### **Test 2: Guardado de Cotización (Con precios)**
```
1. Abrir modal en modo "Cotización en Vivo"
2. Agregar partida con 2 piezas
3. Llenar campos técnicos
4. Configurar motorización (motor + control)
5. Configurar instalación especial (tipo fijo)
6. Aplicar descuento del 10%
7. Marcar "Requiere Factura"
8. Hacer clic en "Guardar"
9. Verificar:
   ✓ Cálculos de totales correctos
   ✓ IVA calculado (16%)
   ✓ Cotización creada en BD
   ✓ Número secuencial correcto (COT-0001)
   ✓ Proyecto vinculado a cotización
```

### **Test 3: Validaciones**
```
1. Intentar guardar sin partidas
   → Error: "Debes agregar al menos una partida"

2. Intentar guardar con campos vacíos
   → Error: Lista de campos faltantes

3. Intentar guardar con precio general = 0
   → Error: "El precio general debe ser mayor a 0"

4. Intentar guardar motorizado sin modelo de motor
   → Error: "Modelo de motor es obligatorio"
```

### **Test 4: Cálculos**
```
Escenario: 2 piezas de 2.5m × 3.0m
Precio: $750/m²
Motorización: 1 motor ($7,000) + 1 control ($1,200)
Instalación: Fija ($3,500)

Cálculos esperados:
- m² totales: 15 m² (7.5 + 7.5)
- Subtotal productos: $11,250 (15 × 750)
- Motorización: $8,200 (7,000 + 1,200)
- Instalación: $3,500
- Subtotal: $22,950
- Descuento 10%: $2,295
- Subtotal con descuento: $20,655
- IVA 16%: $3,304.80
- Total: $23,959.80
```

---

## 📝 NOTAS TÉCNICAS

### **Estructura de Datos en MongoDB**

**Proyecto:**
```javascript
{
  _id: ObjectId,
  cliente: { nombre, telefono, email, direccion },
  estado: 'levantamiento' | 'cotizacion',
  partidas: [{
    ubicacion: String,
    producto: String,
    color: String,
    modelo: String,
    cantidad: Number,
    piezas: [{ /* 13 campos técnicos */ }],
    motorizacion: { /* si aplica */ },
    instalacionEspecial: { /* si aplica */ },
    totales: { m2, subtotal, costoMotorizacion, costoInstalacion }
  }],
  totales: { m2, subtotal, descuento, iva, total },
  observaciones: String,
  personaVisita: String,
  cotizacion_id: ObjectId  // Referencia a Cotizacion
}
```

**Cotizacion:**
```javascript
{
  _id: ObjectId,
  numero: 'COT-0001',
  proyectoId: ObjectId,
  cliente: { /* datos del cliente */ },
  partidas: [{ /* misma estructura que proyecto */ }],
  precioReglas: { precio_m2, aplicaDescuento, tipoDescuento, valorDescuento },
  facturacion: { requiereFactura, razonSocial, rfc },
  totales: { m2, subtotal, descuento, iva, total },
  estado: 'borrador' | 'enviada' | 'aprobada',
  creado_por: ObjectId
}
```

---

## 🚀 PRÓXIMOS PASOS

### **FASE 5: Generación de PDF** (Siguiente)
- Implementar `handleVerPDF()`
- Crear plantilla HTML para cotización
- Endpoint `/api/proyectos/:id/generar-pdf`
- Incluir todas las secciones técnicas

### **FASE 6: Integración con LevantamientoTab**
- Conectar botones en `LevantamientoTab.jsx`
- Flujo completo: Levantamiento → Cotización → PDF
- Pruebas de integración end-to-end

---

## 📊 MÉTRICAS Y KPIs HABILITADOS

Con los eventos de auditoría implementados, ahora es posible calcular:

### **Ventas:**
- Tasa de conversión: levantamientos → cotizaciones
- Tiempo promedio de conversión
- Ticket promedio por m²
- Productividad por asesor

### **Operaciones:**
- m² totales levantados por período
- m² cotizados por período
- Número de partidas promedio por proyecto
- Distribución de sistemas (Roller, Zebra, etc.)

---

**Estado**: ✅ FASE 4 COMPLETADA  
**Fecha**: 30 de Octubre, 2025  
**Responsable**: Equipo de Desarrollo Sundeck  
**Siguiente fase**: FASE 5 - Generación de PDF
