# 🔍 DIAGNÓSTICO: PUNTO DE QUIEBRE DEL FLUJO TÉCNICO

**Fecha:** 6 Noviembre 2025  
**Responsable:** Supervisor Técnico  
**Estado:** ✅ DIAGNÓSTICO COMPLETADO

---

## 🎯 OBJETIVO DEL DIAGNÓSTICO

Identificar exactamente dónde se pierde la información técnica (13 campos) en el flujo:
```
Levantamiento → Cotización → Pedido → Fabricación
```

---

## 🔴 HALLAZGOS CRÍTICOS

### **HALLAZGO #1: Mapper Unificado NO EXISTE**

**Archivo esperado:** `server/utils/cotizacionMapper.js`  
**Estado:** ❌ **NO EXISTE**

**Impacto:**
- No hay función centralizada para mapear datos técnicos
- Cada controlador hace su propio mapeo manual
- Pérdida de información técnica en el proceso

**Evidencia:**
```bash
# Búsqueda en directorio utils
c:\Users\dav_r\App Sundeck\SUNDECK-APP-v2\server\utils\
├── exportNormalizer.js ✅
├── qrcodeGenerator.js ✅
└── cotizacionMapper.js ❌ NO EXISTE
```

---

### **HALLAZGO #2: Mapeo Manual Incompleto en pedidoController.js**

**Archivo:** `server/controllers/pedidoController.js`  
**Líneas:** 61-106  
**Estado:** ⚠️ **MAPEO INCOMPLETO**

**Problema:**
El controlador mapea manualmente 40+ campos desde la cotización, pero **NO incluye `especificacionesTecnicas`**.

**Código actual:**
```javascript
productos: cotizacion.productos.map(producto => ({
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  categoria: producto.categoria,
  material: producto.material,
  color: producto.color,
  // ... 35 campos más ...
  estadoFabricacion: 'pendiente'
  // ❌ FALTA: especificacionesTecnicas
}))
```

**Campos técnicos que se pierden:**
1. `sistema` - Tipo de sistema (Roller, Zebra, Panel, etc.)
2. `control` - Tipo de control (Manual, Motorizado, etc.)
3. `tipoInstalacion` - Tipo de instalación (Muro, Techo, etc.)
4. `tipoFijacion` - Tipo de fijación (Concreto, Tablaroca, etc.)
5. `caida` - Orientación de caída
6. `galeria` - Galería (Sí/No)
7. `telaMarca` - Marca de tela
8. `baseTabla` - Medida de base/tabla
9. `modoOperacion` - Modo de operación
10. `detalleTecnico` - Detalle técnico
11. `traslape` - Traslape
12. `modeloCodigo` - Modelo/código
13. `observacionesTecnicas` - Observaciones técnicas

---

### **HALLAZGO #3: Modelo Pedido.js Sin Estructura Técnica**

**Archivo:** `server/models/Pedido.js`  
**Líneas:** 71-95  
**Estado:** ⚠️ **ESTRUCTURA INCOMPLETA**

**Problema:**
El schema del array `productos` NO incluye el campo `especificacionesTecnicas`.

**Estructura actual:**
```javascript
productos: [{
  nombre: String,
  descripcion: String,
  categoria: String,
  material: String,
  color: String,
  cristal: String,
  herrajes: String,
  medidas: {
    ancho: Number,
    alto: Number,
    area: Number
  },
  cantidad: Number,
  precioUnitario: Number,
  subtotal: Number,
  requiereR24: Boolean,
  tiempoFabricacion: Number,
  estadoFabricacion: {
    type: String,
    enum: ['pendiente', 'en_proceso', 'terminado', 'instalado'],
    default: 'pendiente'
  }
  // ❌ FALTA: especificacionesTecnicas
}]
```

**Estructura necesaria:**
```javascript
productos: [{
  // ... campos existentes ...
  especificacionesTecnicas: {
    sistema: [String],
    control: String,
    tipoInstalacion: String,
    tipoFijacion: String,
    caida: String,
    galeria: String,
    telaMarca: String,
    baseTabla: String,
    modoOperacion: String,
    detalleTecnico: String,
    traslape: String,
    modeloCodigo: String,
    observacionesTecnicas: String
  }
}]
```

---

### **HALLAZGO #4: Fuente de Verdad Técnica Confirmada**

**Archivo:** `server/models/Proyecto.js`  
**Líneas:** 105-187  
**Estado:** ✅ **ESTRUCTURA COMPLETA**

**Confirmación:**
El modelo `Proyecto.js` SÍ contiene toda la información técnica en `levantamiento.partidas[].piezas[]`:

```javascript
levantamiento: {
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
      sistema: String,           // ✅ Campo 1
      control: String,           // ✅ Campo 2
      instalacion: String,       // ✅ Campo 3 (tipoInstalacion)
      fijacion: String,          // ✅ Campo 4 (tipoFijacion)
      caida: String,             // ✅ Campo 5
      galeria: String,           // ✅ Campo 6
      telaMarca: String,         // ✅ Campo 7
      baseTabla: String,         // ✅ Campo 8
      operacion: String,         // ✅ Campo 9 (modoOperacion)
      detalle: String,           // ✅ Campo 10 (detalleTecnico)
      traslape: String,          // ✅ Campo 11
      modeloCodigo: String,      // ✅ Campo 12
      observacionesTecnicas: String, // ✅ Campo 13
      color: String,
      precioM2: Number
    }]
  }]
}
```

**Conclusión:** La información técnica SÍ se captura correctamente en el levantamiento, pero NO se transfiere al pedido.

---

## 📊 FLUJO ACTUAL VS FLUJO ESPERADO

### **Flujo Actual (ROTO):**
```
┌─────────────────┐
│  Levantamiento  │ ✅ 13 campos técnicos
│  (Proyecto.js)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Cotización    │ ⚙️ Datos resumidos
│ (Cotizacion.js) │
└────────┬────────┘
         │
         ▼ ❌ PUNTO DE QUIEBRE
┌─────────────────┐
│     Pedido      │ ❌ Sin especificacionesTecnicas
│   (Pedido.js)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Fabricación    │ ❌ Sin información técnica
└─────────────────┘
```

### **Flujo Esperado (REPARADO):**
```
┌─────────────────┐
│  Levantamiento  │ ✅ 13 campos técnicos
│  (Proyecto.js)  │
└────────┬────────┘
         │
         ▼ ✅ cotizacionMapper.js
┌─────────────────┐
│   Cotización    │ ✅ Datos técnicos preservados
│ (Cotizacion.js) │
└────────┬────────┘
         │
         ▼ ✅ cotizacionMapper.js
┌─────────────────┐
│     Pedido      │ ✅ especificacionesTecnicas completo
│   (Pedido.js)   │
└────────┬────────┘
         │
         ▼ ✅ Lectura desde Pedido
┌─────────────────┐
│  Fabricación    │ ✅ Información técnica completa
└─────────────────┘
```

---

## 🎯 CONCLUSIONES

### **Punto de Quiebre Identificado:**
El corte está en **2 lugares simultáneos**:

1. **Ausencia del mapper unificado** (`cotizacionMapper.js`)
2. **Estructura incompleta en Pedido.js** (falta `especificacionesTecnicas`)

### **Causa Raíz:**
- No existe función centralizada para transferir datos técnicos
- El modelo de Pedido no tiene estructura para almacenar información técnica
- El controlador hace mapeo manual sin incluir campos técnicos

### **Impacto:**
- ❌ Fabricación no recibe especificaciones técnicas
- ❌ PDFs y etiquetas incompletas
- ❌ Pérdida de trazabilidad técnica
- ❌ Riesgo de errores en producción

---

## 🚀 PRÓXIMOS PASOS

### **FASE 2: Reinstalar Mapper Unificado**
1. Crear `server/utils/cotizacionMapper.js`
2. Implementar función `construirProductosDesdePartidas()`
3. Incluir los 13 campos técnicos en `especificacionesTecnicas`

### **FASE 3: Actualizar Modelo Pedido**
1. Extender schema de `productos[]` en `Pedido.js`
2. Agregar campo `especificacionesTecnicas`
3. Validar compatibilidad con Mongoose

### **FASE 4: Integrar Mapper en Controladores**
1. Importar mapper en `pedidoController.js`
2. Reemplazar mapeo manual con función unificada
3. Validar flujo completo

---

## 📝 EVIDENCIA TÉCNICA

### **Comando de verificación en MongoDB:**
```javascript
db.pedidos.findOne({}, { "productos.especificacionesTecnicas": 1 });
```

**Resultado actual:**
```json
{
  "_id": ObjectId("..."),
  "productos": [
    {
      // ❌ Campo especificacionesTecnicas NO EXISTE
    }
  ]
}
```

**Resultado esperado después de la reparación:**
```json
{
  "_id": ObjectId("..."),
  "productos": [
    {
      "especificacionesTecnicas": {
        "sistema": ["Roller"],
        "control": "Manual",
        "tipoInstalacion": "Muro",
        "tipoFijacion": "Concreto",
        "caida": "Frontal",
        "galeria": "Sí",
        "telaMarca": "Screen 3%",
        "baseTabla": "15cm",
        "modoOperacion": "Cadena",
        "detalleTecnico": "Instalación estándar",
        "traslape": "No",
        "modeloCodigo": "SC-3%",
        "observacionesTecnicas": "Ventana con marco de aluminio"
      }
    }
  ]
}
```

---

## ✅ VALIDACIÓN DEL DIAGNÓSTICO

- [x] Archivo `cotizacionMapper.js` confirmado como inexistente
- [x] Mapeo manual en `pedidoController.js` confirmado como incompleto
- [x] Estructura de `Pedido.js` confirmada sin `especificacionesTecnicas`
- [x] Fuente de verdad en `Proyecto.levantamiento` confirmada como completa
- [x] Punto de quiebre identificado con precisión
- [x] Flujo actual vs esperado documentado
- [x] Próximos pasos definidos claramente

---

**Estado:** ✅ **DIAGNÓSTICO COMPLETADO**  
**Siguiente fase:** FASE 2 - Reinstalar Mapper Unificado  
**Fecha de finalización:** 6 Noviembre 2025  
**Responsable:** Supervisor Técnico
