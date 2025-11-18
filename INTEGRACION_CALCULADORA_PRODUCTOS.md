# 🔗 INTEGRACIÓN: CALCULADORA ↔ CATÁLOGO DE PRODUCTOS

**Fecha:** 18 Noviembre 2025  
**Objetivo:** Vincular materiales calculados con productos del catálogo

---

## 🎯 FLUJO COMPLETO

```
1. CALCULADORA
   ↓ Calcula cantidades de materiales
   
2. MATERIALES CALCULADOS
   - Tubo 38mm: 2.395 ml
   - Mecanismo SL-16: 1 pza
   - Tela: 5.35 ml
   - etc.
   ↓ Se vinculan con productos
   
3. CATÁLOGO DE PRODUCTOS
   - Código: TUB-38-MAN
   - Precio: $150/ml
   - Color: Blanco
   ↓ Se agregan a cotización
   
4. COTIZACIÓN
   - Tubo 38mm Blanco: 2.395 ml × $150 = $359.25
   - Total: $X,XXX.XX
```

---

## 📊 MODELO ACTUAL DE PRODUCTO

**Archivo:** `server/models/Producto.js`

**Campos clave:**
```javascript
{
  codigo: String,           // Único y requerido ✅
  nombre: String,           // "Tubo 38mm Manual"
  categoria: String,        // 'accesorio', 'motor', 'kit', etc.
  material: String,         // 'aluminio', 'tela', etc.
  coloresDisponibles: [],   // ['Blanco', 'Ivory', 'Negro', 'Gris']
  precioBase: Number,       // Precio por unidad
  unidadMedida: String,     // 'ml', 'pza', 'kit', 'm2'
  dimensiones: {
    anchoMinimo: Number,
    anchoMaximo: Number,
    altoMinimo: Number,
    altoMaximo: Number
  }
}
```

---

## 🔗 VINCULACIÓN PROPUESTA

### Opción 1: Campo `codigoProducto` en ConfiguracionMateriales

**Ventaja:** Mapeo directo y simple

```javascript
// En ConfiguracionMateriales.js
materiales: [{
  tipo: 'Tubo',
  descripcion: 'Tubo 38mm manual',
  formula: 'ancho - 0.005',
  unidad: 'ml',
  codigoProducto: 'TUB-38-MAN', // ← NUEVO CAMPO
  condicion: 'ancho <= 2.50 && esManual'
}]
```

**Uso:**
```javascript
// Al calcular materiales
const materialesCalculados = calculadora.calcular(medidas);
// Resultado:
[{
  tipo: 'Tubo',
  cantidad: 2.395,
  unidad: 'ml',
  codigoProducto: 'TUB-38-MAN' // ← Se usa para buscar en catálogo
}]

// Buscar producto
const producto = await Producto.findOne({ codigo: 'TUB-38-MAN' });
const precioTotal = materialesCalculados.cantidad * producto.precioBase;
```

### Opción 2: Tabla de Mapeo Dinámica

**Ventaja:** Más flexible, permite múltiples productos por material

```javascript
// Nuevo modelo: MapeoMaterialProducto.js
{
  material: {
    tipo: 'Tubo',
    condiciones: {
      diametro: '38mm',
      esManual: true,
      color: 'Blanco'
    }
  },
  codigoProducto: 'TUB-38-BLA-MAN',
  prioridad: 1
}
```

**Uso:**
```javascript
// Buscar producto según condiciones
const mapeo = await MapeoMaterialProducto.findOne({
  'material.tipo': 'Tubo',
  'material.condiciones.diametro': '38mm',
  'material.condiciones.esManual': true,
  'material.condiciones.color': 'Blanco'
});

const producto = await Producto.findOne({ codigo: mapeo.codigoProducto });
```

### Opción 3: Búsqueda Inteligente por Nombre

**Ventaja:** No requiere códigos predefinidos

```javascript
// Buscar producto por nombre y características
const producto = await Producto.findOne({
  nombre: /tubo.*38mm.*manual/i,
  categoria: 'accesorio',
  coloresDisponibles: 'Blanco'
});
```

---

## 🎯 RECOMENDACIÓN: OPCIÓN 1 (Más Simple)

**Razones:**
1. ✅ Mapeo directo y claro
2. ✅ Fácil de mantener
3. ✅ Performance óptimo
4. ✅ No requiere modelo adicional

**Implementación:**

### 1. Actualizar ConfiguracionMateriales.js

```javascript
materiales: [{
  tipo: String,
  descripcion: String,
  formula: String,
  unidad: String,
  condicion: String,
  
  // NUEVO: Vinculación con catálogo
  codigoProducto: {
    type: String,
    ref: 'Producto' // Referencia al catálogo
  },
  
  // NUEVO: Mapeo por color (si aplica)
  codigosPorColor: {
    type: Map,
    of: String
    // Ejemplo:
    // {
    //   'Blanco': 'TUB-38-BLA-MAN',
    //   'Ivory': 'TUB-38-IVO-MAN',
    //   'Negro': 'TUB-38-NEG-MAN',
    //   'Gris': 'TUB-38-GRI-MAN'
    // }
  }
}]
```

### 2. Service de Vinculación

```javascript
// server/services/vinculacionProductosService.js

class VinculacionProductosService {
  
  async vincularMaterialesConProductos(materialesCalculados, opciones) {
    const resultado = [];
    
    for (const material of materialesCalculados) {
      // Obtener código de producto según color
      let codigoProducto = material.codigoProducto;
      
      if (material.codigosPorColor && opciones.color) {
        codigoProducto = material.codigosPorColor.get(opciones.color);
      }
      
      // Buscar producto en catálogo
      const producto = await Producto.findOne({ 
        codigo: codigoProducto,
        activo: true 
      });
      
      if (!producto) {
        throw new Error(`Producto no encontrado: ${codigoProducto}`);
      }
      
      // Calcular precio
      const precioTotal = material.cantidad * producto.precioBase;
      
      resultado.push({
        material: material.descripcion,
        cantidad: material.cantidad,
        unidad: material.unidad,
        producto: {
          codigo: producto.codigo,
          nombre: producto.nombre,
          precioUnitario: producto.precioBase,
          color: opciones.color || 'N/A'
        },
        precioTotal: precioTotal
      });
    }
    
    return resultado;
  }
}
```

### 3. Uso en Cotización

```javascript
// En cotizacionController.js

// 1. Calcular materiales
const materialesCalculados = await CalculadoraMaterialesService
  .calcularMaterialesPieza(pieza);

// 2. Vincular con productos del catálogo
const materialesConPrecios = await VinculacionProductosService
  .vincularMaterialesConProductos(materialesCalculados, {
    color: pieza.color || 'Blanco'
  });

// 3. Agregar a cotización
cotizacion.items.push(...materialesConPrecios);
```

---

## 📋 MAPEO DE MATERIALES → PRODUCTOS

### ROLLER SHADE

| Material | Condición | Código Producto (ejemplo) |
|----------|-----------|---------------------------|
| Tubo 38mm | Manual, ≤2.50m | TUB-38-{COLOR}-MAN |
| Tubo 50mm | Manual, >2.50m | TUB-50-{COLOR}-MAN |
| Tubo 35mm | Motorizado, <2.50m | TUB-35-{COLOR}-MOT |
| Tubo 50mm | Motorizado, 2.50-3.00m | TUB-50-{COLOR}-MOT |
| Tubo 70mm | Motorizado, 3.00-4.00m | TUB-70-{COLOR}-MOT |
| Tubo 79mm | Motorizado, 4.00-5.90m | TUB-79-{COLOR}-MOT |
| Kit SL-16 | Manual, ≤2.50m | MEC-SL16-{COLOR} |
| Kit R-24 | Manual, 2.50-3.00m | MEC-R24-{COLOR} |
| Motor | Motorizado | MOT-{MODELO} |
| Contrapeso Elegance | Galería o rotada | CONT-ELEG-{COLOR} |
| Contrapeso Ovalado | Estándar | CONT-OVAL-{COLOR} |
| Tela | Según modelo | TELA-{MODELO}-{COLOR} |

### SHEER ELEGANCE

| Material | Código Producto (ejemplo) |
|----------|---------------------------|
| Tubo 38mm | TUB-SHEER-38-{COLOR} |
| Tubo 50mm | TUB-SHEER-50-{COLOR} |
| Cofre/Fascia | COFRE-SHEER-{COLOR} |
| Barra de Giro | BARRA-SHEER-{COLOR} |
| Contrapeso Oculto | CONT-SHEER-{COLOR} |
| Mecanismo SL-16 | MEC-SHEER-SL16-{COLOR} |
| Tela Sheer | TELA-SHEER-{MODELO}-{COLOR} |
| Cadena sin fin | CADENA-SHEER-{COLOR} |

### TOLDOS CONTEMPO

| Material | Condición | Código Producto (ejemplo) |
|----------|-----------|---------------------------|
| Kit 4.00m | Ancho ≤4.00m | KIT-TOLDO-4M-{COLOR} |
| Kit 5.80m | Ancho >4.00m | KIT-TOLDO-5.8M-{COLOR} |
| Tela Screen | Según modelo | TELA-SCREEN-{MODELO} |
| Cable Acerado | Estándar | CABLE-ACERADO |

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### Fase 1: Estructura Base (incluida en 2.5 horas)

1. ✅ Agregar campo `codigoProducto` a ConfiguracionMateriales
2. ✅ Agregar campo `codigosPorColor` para materiales con variantes
3. ✅ Crear VinculacionProductosService
4. ✅ Integrar en calculadoraMaterialesService

### Fase 2: Mapeo de Productos (después, con tu ayuda)

1. ⏳ Definir códigos de productos reales del catálogo
2. ⏳ Configurar mapeo en cada sistema (Roller, Sheer, Toldos)
3. ⏳ Validar que todos los productos existan en catálogo
4. ⏳ Probar flujo completo: Calculadora → Productos → Cotización

---

## 📝 NOTAS IMPORTANTES

### Productos que necesitan estar en catálogo:

**Por sistema:**
- Roller Shade: ~30 productos (tubos, mecanismos, accesorios)
- Sheer Elegance: ~20 productos
- Toldos Contempo: ~10 productos

**Por color:**
- Cada componente × 4 colores = Múltiples SKUs
- Ejemplo: Tubo 38mm × 4 colores = 4 productos diferentes

### Alternativa (si no hay productos en catálogo):

**Crear productos automáticamente:**
```javascript
// Script: crearProductosCalculadora.js
// Crea productos base para la calculadora
// Ejemplo: TUB-38-BLA-MAN, TUB-38-IVO-MAN, etc.
```

---

## ✅ RESUMEN

**Integración propuesta:**
1. ✅ Campo `codigoProducto` en materiales
2. ✅ Campo `codigosPorColor` para variantes
3. ✅ Service de vinculación
4. ✅ Integración en flujo de cotización

**Próximos pasos:**
1. Implementar estructura base (incluido en 2.5 horas)
2. Definir códigos reales con tu ayuda
3. Configurar mapeo completo
4. Validar con catálogo existente

**¿Arranco con la implementación?** 🚀

---

**Última actualización:** 18 Nov 2025, 10:00 AM
