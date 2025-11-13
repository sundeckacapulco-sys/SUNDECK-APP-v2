# 🧮 CALCULADORA DE MATERIALES INTELIGENTE

**Fecha:** 13 Noviembre 2025 - 5:35 PM  
**Estado:** ✅ IMPLEMENTADO  
**Integración:** Automática con Orden de Producción PDF

---

## 📋 DESCRIPCIÓN

Sistema configurable para calcular materiales (BOM) basado en reglas dinámicas almacenadas en base de datos. Se integra automáticamente con la generación de Orden de Producción PDF.

---

## 🎯 CARACTERÍSTICAS

### ✅ Configuración Dinámica
- Reglas de cálculo por producto/sistema
- Fórmulas JavaScript personalizables
- Condiciones de aplicación
- Sin necesidad de modificar código

### ✅ Cálculo Inteligente
- Evalúa fórmulas matemáticas
- Aplica condiciones lógicas
- Fallback a cálculo por defecto
- Logging completo

### ✅ Integración Automática
- Se ejecuta al generar PDF
- Calcula materiales por pieza
- Consolida totales
- Transparente para el usuario

---

## 🏗️ ARQUITECTURA

### Modelo: ConfiguracionMateriales

```javascript
{
  nombre: "Configuración Genérica",
  producto: "screen_5",      // Opcional
  sistema: "Enrollable",
  materiales: [
    {
      tipo: "Tela",
      descripcion: "Tela estándar",
      unidad: "m²",
      formula: "area * 1.1",   // 10% merma
      condicion: "",           // Opcional
      precioUnitario: 150,
      observaciones: "Incluye 10% de merma",
      activo: true
    }
  ],
  activo: true
}
```

### Servicio: CalculadoraMaterialesService

**Métodos principales:**
- `calcularMaterialesPieza(pieza)` - Calcula materiales para una pieza
- `obtenerConfiguracion(producto, sistema)` - Busca configuración aplicable
- `evaluarFormula(formula, pieza)` - Evalúa expresión matemática
- `evaluarCondicion(condicion, pieza)` - Evalúa condición lógica
- `calcularPorDefecto(pieza)` - Fallback si no hay configuración

---

## 📐 FÓRMULAS DISPONIBLES

### Variables Disponibles

```javascript
{
  ancho: 3.28,           // metros
  alto: 2.56,            // metros
  area: 8.3968,          // m²
  motorizado: true,      // boolean
  galeria: "galeria",    // string
  sistema: "Enrollable"  // string
}
```

### Ejemplos de Fórmulas

```javascript
// Tela con merma
"area * 1.1"

// Tubo con margen
"ancho + 0.10"

// Soportes según ancho
"ancho <= 1.5 ? 2 : ancho <= 3.0 ? 3 : 4"

// Redondeo hacia arriba
"Math.ceil(ancho / 1.5)"

// Cálculo complejo
"(ancho + alto) * 2 + 0.5"
```

### Ejemplos de Condiciones

```javascript
// Solo si es motorizado
"motorizado === true"

// Solo para anchos grandes
"ancho > 2.5"

// Solo si tiene galería
"galeria !== 'sin_galeria'"

// Combinación
"motorizado === true && ancho > 2.0"
```

---

## 🚀 USO

### 1. Inicializar Configuración

```bash
node server/scripts/inicializarCalculadora.js
```

Esto crea la configuración genérica inicial.

### 2. Generar Orden de Producción

El cálculo se ejecuta automáticamente al generar el PDF:

```javascript
// En el frontend
descargarOrdenProduccion(proyectoId)

// En el backend (automático)
ordenProduccionService.obtenerDatosOrdenProduccion(proyectoId)
  ↓
calculadoraMaterialesService.calcularMaterialesPieza(pieza)
  ↓
Materiales calculados según configuración
```

### 3. Personalizar Configuración

**Opción A: Desde MongoDB Compass**
1. Abrir colección `configuracionmateriales`
2. Editar documento
3. Modificar fórmulas/condiciones
4. Guardar

**Opción B: Desde código**
```javascript
const ConfiguracionMateriales = require('./models/ConfiguracionMateriales');

// Crear nueva configuración
const config = new ConfiguracionMateriales({
  nombre: "Screen 5% Motorizado",
  producto: "screen_5",
  sistema: "Enrollable",
  materiales: [
    {
      tipo: "Tela",
      descripcion: "Screen 5%",
      unidad: "m²",
      formula: "area * 1.15", // 15% merma para screen
      activo: true
    },
    {
      tipo: "Motor",
      descripcion: "Motor Somfy",
      unidad: "pza",
      formula: "1",
      condicion: "motorizado === true",
      precioUnitario: 2500,
      activo: true
    }
  ]
});

await config.save();
```

---

## 🔍 BÚSQUEDA DE CONFIGURACIÓN

El sistema busca en este orden:

1. **Configuración específica:** `producto` + `sistema`
2. **Configuración por sistema:** solo `sistema`
3. **Configuración genérica:** nombre "Configuración Genérica"
4. **Fallback:** Cálculo por defecto en código

---

## 📊 TIPOS DE MATERIALES

```javascript
enum TipoMaterial {
  'Tela',
  'Tubo',
  'Soportes',
  'Mecanismo',
  'Motor',
  'Galería',
  'Herrajes',
  'Accesorios'
}
```

---

## 📏 UNIDADES DISPONIBLES

```javascript
enum Unidad {
  'ml',    // Metro lineal
  'm²',    // Metro cuadrado
  'pza',   // Pieza
  'kit',   // Kit
  'juego'  // Juego
}
```

---

## 🧪 EJEMPLO COMPLETO

### Configuración

```javascript
{
  nombre: "Blackout Motorizado",
  producto: "blackout",
  sistema: "Enrollable",
  materiales: [
    {
      tipo: "Tela",
      descripcion: "Blackout premium",
      unidad: "m²",
      formula: "area * 1.12",
      observaciones: "12% merma para blackout",
      precioUnitario: 180,
      activo: true
    },
    {
      tipo: "Tubo",
      descripcion: "Tubo reforzado",
      unidad: "ml",
      formula: "ancho + 0.15",
      observaciones: "15cm adicional para blackout",
      precioUnitario: 95,
      activo: true
    },
    {
      tipo: "Motor",
      descripcion: "Motor Somfy RTS",
      unidad: "pza",
      formula: "1",
      condicion: "motorizado === true",
      observaciones: "Incluye control remoto",
      precioUnitario: 2800,
      activo: true
    },
    {
      tipo: "Soportes",
      descripcion: "Soporte reforzado",
      unidad: "pza",
      formula: "Math.ceil(ancho / 1.2)",
      observaciones: "Cada 1.2m para blackout",
      precioUnitario: 120,
      activo: true
    }
  ],
  activo: true
}
```

### Pieza de Entrada

```javascript
{
  ancho: 4.28,
  alto: 2.8,
  area: 11.984,
  motorizado: true,
  galeria: "sin_galeria",
  sistema: "Enrollable",
  producto: "blackout"
}
```

### Resultado

```javascript
[
  {
    tipo: "Tela",
    descripcion: "Blackout premium",
    cantidad: 13.42,  // 11.984 * 1.12
    unidad: "m²",
    observaciones: "12% merma para blackout",
    precioUnitario: 180
  },
  {
    tipo: "Tubo",
    descripcion: "Tubo reforzado",
    cantidad: 4.43,  // 4.28 + 0.15
    unidad: "ml",
    observaciones: "15cm adicional para blackout",
    precioUnitario: 95
  },
  {
    tipo: "Motor",
    descripcion: "Motor Somfy RTS",
    cantidad: 1,
    unidad: "pza",
    observaciones: "Incluye control remoto",
    precioUnitario: 2800
  },
  {
    tipo: "Soportes",
    descripcion: "Soporte reforzado",
    cantidad: 4,  // Math.ceil(4.28 / 1.2)
    unidad: "pza",
    observaciones: "Cada 1.2m para blackout",
    precioUnitario: 120
  }
]
```

---

## 🔒 SEGURIDAD

### Evaluación de Fórmulas

- Solo variables permitidas disponibles
- No acceso a funciones globales peligrosas
- Manejo de errores con fallback
- Logging de todas las evaluaciones

### Validaciones

- Fórmulas deben ser expresiones válidas
- Condiciones deben retornar boolean
- Resultados deben ser números
- Unidades deben ser del enum

---

## 📈 VENTAJAS

### Para el Negocio
- ✅ Cálculos precisos y consistentes
- ✅ Fácil actualización sin código
- ✅ Adaptable a nuevos productos
- ✅ Trazabilidad completa

### Para Desarrollo
- ✅ Sin hardcoding de fórmulas
- ✅ Fácil mantenimiento
- ✅ Extensible
- ✅ Testeable

### Para Operaciones
- ✅ Configuración visual (MongoDB Compass)
- ✅ Cambios inmediatos
- ✅ Histórico de configuraciones
- ✅ Rollback fácil

---

## 🛠️ MANTENIMIENTO

### Agregar Nuevo Producto

```javascript
const config = new ConfiguracionMateriales({
  nombre: "Sunscreen 3%",
  producto: "sunscreen_3",
  sistema: "Enrollable",
  materiales: [
    // ... definir materiales
  ]
});
await config.save();
```

### Modificar Fórmula

```javascript
await ConfiguracionMateriales.updateOne(
  { nombre: "Configuración Genérica", "materiales.tipo": "Tela" },
  { $set: { "materiales.$.formula": "area * 1.15" } }
);
```

### Desactivar Material

```javascript
await ConfiguracionMateriales.updateOne(
  { nombre: "Configuración Genérica", "materiales.tipo": "Galería" },
  { $set: { "materiales.$.activo": false } }
);
```

---

## 📝 LOGGING

Todos los cálculos se registran:

```javascript
logger.info('Calculando materiales para pieza', {
  servicio: 'calculadoraMaterialesService',
  producto: 'blackout',
  sistema: 'Enrollable',
  ancho: 4.28,
  alto: 2.8
});

logger.info('Materiales calculados exitosamente', {
  servicio: 'calculadoraMaterialesService',
  totalMateriales: 4
});
```

---

## 🚀 PRÓXIMAS MEJORAS

1. **API REST** para gestionar configuraciones
2. **UI de administración** para editar fórmulas
3. **Validador de fórmulas** antes de guardar
4. **Simulador** para probar configuraciones
5. **Importar/Exportar** configuraciones
6. **Versionado** de configuraciones
7. **Cálculo de costos** automático

---

## ✅ ESTADO ACTUAL

- ✅ Modelo creado
- ✅ Servicio implementado
- ✅ Integración con PDF
- ✅ Configuración inicial
- ✅ Script de inicialización
- ✅ Documentación completa
- ⏳ API REST (pendiente)
- ⏳ UI Admin (pendiente)

---

**Versión:** 1.0  
**Fecha:** 13 Noviembre 2025  
**Autor:** Equipo Sundeck
