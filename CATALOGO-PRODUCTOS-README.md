# 📦 Catálogo de Productos Flexible - SUNDECK CRM

## ✅ Funcionalidades Implementadas

### **Problema Resuelto**
El catálogo anterior solo manejaba productos por m², pero necesitábamos flexibilidad para diferentes unidades de medida:
- **Motores y controles**: Se venden por pieza
- **Galerías y canaletas**: Se venden por metro lineal
- **Kits de toldo**: Se venden por kit completo
- **Herrajes**: Se venden por par o juego

### **Solución Implementada**
Sistema de catálogo flexible que maneja **7 unidades de medida diferentes** con cálculos automáticos específicos para cada tipo.

## 🎯 Unidades de Medida Soportadas

### **1. m² (Metro Cuadrado)**
- **Uso**: Persianas, cortinas, domos
- **Cálculo**: `precio = precioBase × (ancho × alto)`
- **Requiere**: Ancho y alto en metros
- **Ejemplo**: Persiana Screen 3% - $750/m²

### **2. m.l. (Metro Lineal)**
- **Uso**: Galerías para cortinas
- **Cálculo**: `precio = precioBase × metrosLineales`
- **Requiere**: Metros lineales
- **Ejemplo**: Galería Aluminio - $180/m.l.

### **3. m (Metro)**
- **Uso**: Perfiles, tubos, barras
- **Cálculo**: `precio = precioBase × metros`
- **Requiere**: Metros
- **Ejemplo**: Tubo de aluminio - $45/m

### **4. Pieza**
- **Uso**: Motores, controles, accesorios individuales
- **Cálculo**: `precio = precioBase × cantidad`
- **Requiere**: Solo cantidad
- **Ejemplo**: Motor Tubular 20Nm - $2,500/pieza

### **5. Par**
- **Uso**: Soportes, bisagras, elementos que van en pares
- **Cálculo**: `precio = precioBase × cantidad`
- **Requiere**: Solo cantidad
- **Ejemplo**: Soporte de Pared - $85/par

### **6. Juego**
- **Uso**: Conjuntos de herrajes, poleas
- **Cálculo**: `precio = precioBase × cantidad`
- **Requiere**: Solo cantidad
- **Ejemplo**: Juego de Poleas - $65/juego

### **7. Kit**
- **Uso**: Kits completos de toldo, sistemas completos
- **Cálculo**: `precio = precioBase × cantidad`
- **Requiere**: Solo cantidad
- **Ejemplo**: Kit Toldo 3x2m - $8,500/kit

## 🚀 Componentes Creados

### **1. Modelo de Producto Mejorado**
**Archivo**: `server/models/Producto.js`

**Nuevas características**:
```javascript
// Categorías expandidas
categoria: ['ventana', 'puerta', 'cancel', 'domo', 'accesorio', 
           'motor', 'control', 'kit', 'galeria', 'canaleta', 
           'herraje', 'repuesto']

// Unidades de medida flexibles
unidadMedida: ['m2', 'ml', 'pieza', 'metro', 'par', 'juego', 'kit']

// Configuración automática por unidad
configuracionUnidad: {
  requiereMedidas: Boolean,    // ¿Necesita ancho/alto?
  calculoPorArea: Boolean,     // ¿Se calcula por área?
  minimoVenta: Number,         // Mínimo a vender
  incremento: Number           // Incremento mínimo
}
```

**Métodos inteligentes**:
- `calcularPrecio()` - Calcula según unidad de medida
- `calcularTiempoFabricacion()` - Tiempo según tipo
- `requiereMedidas()` - Valida si necesita medidas
- `getEtiquetaUnidad()` - Etiqueta amigable

### **2. Catálogo de Productos**
**Archivo**: `client/src/components/Productos/CatalogoProductos.js`

**Funcionalidades**:
- ✅ **Crear productos** con diferentes unidades
- ✅ **Buscar y filtrar** por categoría, unidad, texto
- ✅ **Editar productos** existentes
- ✅ **Configuración automática** según unidad seleccionada
- ✅ **Validaciones inteligentes** por tipo de producto
- ✅ **Interfaz intuitiva** con chips de colores

### **3. Selector de Productos Inteligente**
**Archivo**: `client/src/components/Cotizaciones/SelectorProductos.js`

**Funcionalidades**:
- ✅ **Búsqueda en tiempo real** por código o nombre
- ✅ **Campos dinámicos** según unidad de medida
- ✅ **Cálculo automático** de precios
- ✅ **Validaciones específicas** por tipo
- ✅ **Integración directa** con cotizaciones

### **4. API Mejorada**
**Archivo**: `server/routes/productos.js`

**Endpoints nuevos**:
- `GET /productos` - Lista con filtros avanzados
- `POST /productos` - Crear con validaciones
- `PUT /productos/:id` - Actualizar con validaciones
- `DELETE /productos/:id` - Eliminar producto
- `GET /productos/meta/categorias` - Categorías disponibles
- `GET /productos/meta/unidades` - Unidades disponibles
- `GET /productos/buscar/:texto` - Búsqueda rápida
- `POST /productos/:id/calcular-precio` - Cálculo inteligente

## 📋 Ejemplos de Productos

### **Motores (Pieza)**
```javascript
{
  nombre: 'Motor Tubular 20Nm',
  codigo: 'MOTOR-001',
  categoria: 'motor',
  unidadMedida: 'pieza',
  precioBase: 2500,
  configuracionUnidad: {
    requiereMedidas: false,
    calculoPorArea: false,
    minimoVenta: 1,
    incremento: 1
  }
}
```

### **Galerías (Metro Lineal)**
```javascript
{
  nombre: 'Galería Aluminio Natural',
  codigo: 'GAL-001',
  categoria: 'galeria',
  unidadMedida: 'ml',
  precioBase: 180,
  configuracionUnidad: {
    requiereMedidas: true,
    calculoPorArea: false,
    minimoVenta: 0.5,
    incremento: 0.1
  }
}
```

### **Kits (Kit Completo)**
```javascript
{
  nombre: 'Kit Toldo Retráctil 3x2m',
  codigo: 'KIT-001',
  categoria: 'kit',
  unidadMedida: 'kit',
  precioBase: 8500,
  configuracionUnidad: {
    requiereMedidas: false,
    calculoPorArea: false,
    minimoVenta: 1,
    incremento: 1
  }
}
```

## 🔄 Flujo de Trabajo

### **1. Agregar Producto al Catálogo**
```
Administrador:
1. Va a /productos
2. Clic en "Nuevo Producto"
3. Llena información básica
4. Selecciona unidad de medida
5. Sistema configura automáticamente campos
6. Guarda producto
```

### **2. Usar en Cotización**
```
Vendedor:
1. Va a /cotizaciones/nueva o /cotizaciones/directa
2. En "Agregar Producto del Catálogo":
   - Busca por código o nombre
   - Selecciona producto
   - Sistema muestra campos según unidad
   - Ingresa medidas/cantidad según corresponda
   - Clic en "Calcular y Agregar"
3. Producto se agrega automáticamente con precio calculado
```

## 💰 Cálculos Automáticos

### **Por Metro Cuadrado (m²)**
```
Área = ancho × alto
Precio = precioBase × área × cantidad
Tiempo = tiempoBase + (área - 1) × tiempoAdicional
```

### **Por Metro Lineal (m.l.)**
```
Precio = precioBase × metrosLineales × cantidad
Tiempo = tiempoBase + (metros - 1) × 0.5 días
```

### **Por Pieza/Par/Juego/Kit**
```
Precio = precioBase × cantidad
Tiempo = tiempoBase + (cantidad - 1) × 0.2 días
```

## 🎨 Interfaz de Usuario

### **Catálogo de Productos**
- **Tabla organizada** con filtros inteligentes
- **Chips de colores** por categoría
- **Búsqueda en tiempo real**
- **Estados visuales** (activo/inactivo, disponible/no disponible)

### **Selector en Cotizaciones**
- **Autocomplete inteligente** con vista previa
- **Campos dinámicos** según tipo de producto
- **Validaciones en tiempo real**
- **Cálculo automático** al agregar

### **Colores por Categoría**
- 🔴 **Motor**: Error (rojo)
- 🟡 **Control**: Warning (amarillo)  
- 🔵 **Kit**: Info (azul)
- 🟢 **Galería**: Success (verde)
- 🟣 **Canaleta**: Secondary (morado)
- ⚫ **Herraje**: Default (gris)
- 🔵 **Accesorio**: Primary (azul)

## 🧪 Datos de Prueba

### **Ejecutar Seed de Productos**
```bash
node seed-productos.js
```

**Productos incluidos**:
- 2 Motores (20Nm, 40Nm)
- 2 Controles (1 canal, 5 canales)
- 2 Kits de toldo (3x2m, 4x3m)
- 2 Galerías (simple, doble)
- 2 Canaletas (lateral, superior)
- 2 Herrajes (soporte, poleas)
- 2 Productos tradicionales (screen, blackout)

**Total**: 14 productos de ejemplo cubriendo todos los casos de uso

## 🔗 Integración

### **Rutas Agregadas**
- `/productos` - Catálogo completo
- Integrado en `/cotizaciones/nueva`
- Integrado en `/cotizaciones/directa`

### **Permisos**
- **Crear productos**: Cualquier usuario autenticado
- **Editar productos**: Cualquier usuario autenticado  
- **Eliminar productos**: Cualquier usuario autenticado
- **Ver catálogo**: Todos los usuarios

## 📊 Beneficios

### **Para el Negocio**
- ✅ **Flexibilidad total** para diferentes tipos de productos
- ✅ **Cálculos precisos** automáticos
- ✅ **Memoria de productos** - se van guardando automáticamente
- ✅ **Búsqueda rápida** por código o nombre
- ✅ **Consistencia** en precios y tiempos

### **Para los Vendedores**
- ✅ **Proceso más rápido** - seleccionar en lugar de escribir
- ✅ **Menos errores** - cálculos automáticos
- ✅ **Información completa** - precios, tiempos, especificaciones
- ✅ **Búsqueda intuitiva** - por código o descripción

### **Para los Clientes**
- ✅ **Cotizaciones más precisas** - precios exactos
- ✅ **Información detallada** - especificaciones técnicas
- ✅ **Tiempos realistas** - cálculos basados en tipo de producto

## 🚀 Próximos Pasos

### **Funcionalidades Futuras**
- [ ] **Imágenes de productos** - galería visual
- [ ] **Precios por volumen** - descuentos automáticos
- [ ] **Productos relacionados** - sugerencias inteligentes
- [ ] **Historial de precios** - seguimiento de cambios
- [ ] **Importación masiva** - Excel/CSV
- [ ] **Códigos de barras** - escaneo rápido

### **Integraciones**
- [ ] **Inventario** - stock disponible
- [ ] **Proveedores** - costos y tiempos
- [ ] **Fabricación** - materiales necesarios

---

**Desarrollado para SUNDECK - Soluciones en Cortinas y Persianas**
*Versión: 2.0 - Catálogo Flexible - Septiembre 2024*
