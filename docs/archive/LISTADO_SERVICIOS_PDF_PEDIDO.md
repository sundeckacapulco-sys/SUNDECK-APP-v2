# 📋 LISTADO DE SERVICIOS PDF - PEDIDOS Y FABRICACIÓN

**Fecha:** 19 Noviembre 2025  
**Total de servicios:** 5

---

## 🎯 SERVICIOS PRINCIPALES

### 1. **pdfService.js** (PRINCIPAL - ORQUESTADOR)

**Ubicación:** `server/services/pdfService.js`  
**Clase:** `PDFService`  
**Tecnología:** Puppeteer + HTML templates  
**Líneas:** ~3,500

**Métodos principales:**

```javascript
// Cotizaciones
async generarPDFCotizacion(proyectoId, cotizacionId)
  → Genera PDF de cotización con productos y precios
  → Usa templates HTML + Handlebars
  → Incluye sugerencias inteligentes

// Levantamiento técnico
async generarPDFLevantamiento(proyectoId)
  → PDF del levantamiento técnico
  → Fotos y medidas
  → Observaciones

// Proyecto unificado
async generarPDFProyecto(proyectoId)
  → PDF desde modelo Proyecto unificado
  → Normaliza datos de ProyectoPedido legacy

// Orden de producción (delega)
async generarPDFOrdenProduccion(proyectoId)
  → Delega a PDFOrdenFabricacionService
  → Genera lista de pedido para proveedor
```

**Uso:**
```javascript
const PDFService = require('./services/pdfService');
const pdfService = new PDFService();

// Cotización
const pdfBuffer = await pdfService.generarPDFCotizacion(proyectoId, cotizacionId);

// Orden de producción
const pdfOrden = await pdfService.generarPDFOrdenProduccion(proyectoId);
```

---

### 2. **pdfOrdenFabricacionService.js** (TALLER Y PROVEEDOR)

**Ubicación:** `server/services/pdfOrdenFabricacionService.js`  
**Clase:** `PDFOrdenProduccionService`  
**Tecnología:** PDFKit (generación directa)  
**Líneas:** ~970

**Métodos principales:**

```javascript
// PDF para TALLER (técnico completo)
static async generarPDF(datosOrden, listaPedido)
  → Orden completa para taller
  → Especificaciones técnicas detalladas
  → Piezas con materiales por pieza
  → Códigos QR para etiquetas
  → Análisis de cortes

// PDF para PROVEEDOR (lista de pedido)
static async generarPDFListaPedido(datosOrden, listaPedido)
  → Lista simplificada para proveedor
  → Material consolidado
  → Cantidades a pedir
  → Sin análisis técnico interno
```

**Características:**
- ✅ Generación rápida con PDFKit
- ✅ Sin dependencias de navegador
- ✅ Dos formatos: taller y proveedor
- ✅ Códigos QR integrados
- ✅ Análisis de materiales

**Uso:**
```javascript
const PDFOrdenFabricacionService = require('./services/pdfOrdenFabricacionService');
const OrdenProduccionService = require('./services/ordenProduccionService');

// Obtener datos
const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);

// PDF para taller
const pdfTaller = await PDFOrdenFabricacionService.generarPDF(datosOrden, datosOrden.listaPedido);

// PDF para proveedor
const pdfProveedor = await PDFOrdenFabricacionService.generarPDFListaPedido(datosOrden, datosOrden.listaPedido);
```

---

### 3. **pdfListaPedidoV3Service.js** ⭐ (NUEVO - V3.1)

**Ubicación:** `server/services/pdfListaPedidoV3Service.js`  
**Clase:** `PDFListaPedidoV3Service`  
**Tecnología:** PDFKit  
**Líneas:** ~500  
**Estado:** ✅ IMPLEMENTADO (19 Nov 2025)

**Método principal:**

```javascript
static async generarPDF(datosOrden)
  → Lista de Pedido V3.1 (algoritmo oficial)
  → 3 páginas estructuradas:
    - HOJA 1: Material Consolidado (imprimible)
    - HOJA 2: Despiece por Pieza (técnico)
    - HOJA 3: Almacén + Garantías
```

**Características V3.1:**
- ✅ Despiece inteligente con rollo óptimo (2.00/2.50/3.00)
- ✅ Usa stock de almacén primero
- ✅ Telas agrupadas por tipo (Screen/Blackout/Sheer)
- ✅ Reglas: <22ml = metros, >=22ml = rollo
- ✅ Análisis de sobrantes por rollo
- ✅ Formato profesional de 3 páginas

**Uso:**
```javascript
const PDFListaPedidoV3Service = require('./services/pdfListaPedidoV3Service');
const OrdenProduccionService = require('./services/ordenProduccionService');

const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
const pdfV3 = await PDFListaPedidoV3Service.generarPDF(datosOrden);
```

**Documentación:** `docs/LISTA_PEDIDO_V3.1_IMPLEMENTACION.md`

---

### 4. **pdfListaPedidoV2Service.js** (V2.0 - ANTERIOR)

**Ubicación:** `server/services/pdfListaPedidoV2Service.js`  
**Clase:** `PDFListaPedidoV2Service`  
**Tecnología:** PDFKit  
**Líneas:** ~300  
**Estado:** ⚠️ DEPRECADO (usar V3.1)

**Método principal:**

```javascript
static async generarPDF(datosProyecto, listaOptimizada)
  → Lista de Pedido V2.0
  → Con inventario optimizado
```

**Diferencias con V3.1:**
- ❌ No agrupa por tipo de tela
- ❌ No usa stock de almacén
- ❌ No tiene despiece inteligente
- ❌ Formato menos estructurado

**Recomendación:** Migrar a V3.1

---

### 5. **pdfFabricacionService.js** (GENÉRICO)

**Ubicación:** `server/services/pdfFabricacionService.js`  
**Clase:** `PDFFabricacionService`  
**Tecnología:** Puppeteer (lazy load)  
**Líneas:** ~200  
**Estado:** ⚠️ USO LIMITADO

**Características:**
- Servicio genérico de fabricación
- Carga lazy de Puppeteer
- Uso específico para casos especiales

**Nota:** No es el servicio principal para pedidos

---

## 📊 COMPARATIVA DE SERVICIOS

| Servicio | Tecnología | Uso Principal | Estado | Páginas |
|----------|------------|---------------|--------|---------|
| **pdfService.js** | Puppeteer | Cotizaciones, Levantamientos | ✅ Activo | Variable |
| **pdfOrdenFabricacionService.js** | PDFKit | Taller + Proveedor | ✅ Activo | 2-3 |
| **pdfListaPedidoV3Service.js** ⭐ | PDFKit | Lista Pedido V3.1 | ✅ Nuevo | 3 |
| **pdfListaPedidoV2Service.js** | PDFKit | Lista Pedido V2.0 | ⚠️ Deprecado | 2 |
| **pdfFabricacionService.js** | Puppeteer | Genérico | ⚠️ Limitado | Variable |

---

## 🎯 RECOMENDACIONES DE USO

### Para Cotizaciones
```javascript
// Usar: pdfService.js
const pdfService = new PDFService();
const pdf = await pdfService.generarPDFCotizacion(proyectoId, cotizacionId);
```

### Para Orden de Taller (Técnico)
```javascript
// Usar: pdfOrdenFabricacionService.js
const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
const pdf = await PDFOrdenFabricacionService.generarPDF(datosOrden, datosOrden.listaPedido);
```

### Para Lista de Pedido a Proveedor ⭐ RECOMENDADO
```javascript
// Usar: pdfListaPedidoV3Service.js (NUEVO)
const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
const pdf = await PDFListaPedidoV3Service.generarPDF(datosOrden);
```

### Para Lista de Pedido (Alternativa)
```javascript
// Usar: pdfOrdenFabricacionService.js
const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
const pdf = await PDFOrdenFabricacionService.generarPDFListaPedido(datosOrden, datosOrden.listaPedido);
```

---

## 🔄 FLUJO DE GENERACIÓN DE PDFs

### 1. Cotización → Cliente
```
Usuario solicita cotización
    ↓
pdfService.generarPDFCotizacion()
    ↓
PDF con precios y productos
    ↓
Enviar a cliente
```

### 2. Orden de Producción → Taller
```
Proyecto aprobado
    ↓
OrdenProduccionService.obtenerDatosOrdenProduccion()
    ↓
PDFOrdenFabricacionService.generarPDF()
    ↓
PDF técnico completo
    ↓
Enviar a taller
```

### 3. Lista de Pedido → Proveedor ⭐
```
Proyecto aprobado
    ↓
OrdenProduccionService.obtenerDatosOrdenProduccion()
    ↓
PDFListaPedidoV3Service.generarPDF()  ← NUEVO V3.1
    ↓
PDF con material consolidado
    ↓
Enviar a proveedor
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
server/
├── services/
│   ├── pdfService.js                    (Principal - Cotizaciones)
│   ├── pdfOrdenFabricacionService.js    (Taller + Proveedor)
│   ├── pdfListaPedidoV3Service.js       ⭐ (Lista V3.1 - NUEVO)
│   ├── pdfListaPedidoV2Service.js       (Lista V2.0 - Deprecado)
│   ├── pdfFabricacionService.js         (Genérico)
│   └── ordenProduccionService.js        (Datos para PDFs)
│
├── scripts/
│   ├── generarPDFProveedorTest.js       (Test proveedor)
│   ├── generarPDFListaV3Test.js         ⭐ (Test V3.1 - NUEVO)
│   └── generarPDFOrdenTest.js           (Test orden)
│
└── routes/
    └── proyectos.js                     (Endpoints API)
```

---

## 🚀 ENDPOINTS API

### Cotización
```
GET /api/proyectos/:id/pdf-cotizacion/:cotizacionId
→ pdfService.generarPDFCotizacion()
```

### Orden de Producción (Taller)
```
GET /api/proyectos/:id/pdf-orden-produccion
→ PDFOrdenFabricacionService.generarPDF()
```

### Lista de Pedido (Proveedor)
```
GET /api/proyectos/:id/pdf-lista-pedido
→ PDFOrdenFabricacionService.generarPDFListaPedido()
```

### Lista de Pedido V3.1 ⭐ (PENDIENTE)
```
GET /api/proyectos/:id/pdf-lista-pedido-v3
→ PDFListaPedidoV3Service.generarPDF()
```

---

## 📊 MÉTRICAS

### Tamaño de PDFs Generados

| Tipo de PDF | Servicio | Tamaño Promedio | Páginas |
|-------------|----------|-----------------|---------|
| Cotización | pdfService | 150-300 KB | 3-8 |
| Orden Taller | pdfOrdenFabricacion | 50-100 KB | 2-4 |
| Lista Proveedor | pdfOrdenFabricacion | 5-10 KB | 2-3 |
| Lista V3.1 ⭐ | pdfListaPedidoV3 | ~5 KB | 3 |

### Velocidad de Generación

| Servicio | Tiempo Promedio | Tecnología |
|----------|-----------------|------------|
| pdfService | 2-5 segundos | Puppeteer (lento) |
| pdfOrdenFabricacion | 100-300 ms | PDFKit (rápido) |
| pdfListaPedidoV3 ⭐ | 100-200 ms | PDFKit (rápido) |

---

## 🔧 DEPENDENCIAS

### Puppeteer (pdfService.js)
```json
{
  "puppeteer": "^21.0.0"
}
```

### PDFKit (Otros servicios)
```json
{
  "pdfkit": "^0.13.0",
  "qrcode": "^1.5.3"
}
```

---

## 📚 DOCUMENTACIÓN RELACIONADA

**Servicios:**
- `docs/LISTA_PEDIDO_V3.1_IMPLEMENTACION.md` - V3.1 completo
- `docs/NUEVA_LOGICA_COMPRA_TELAS.md` - Lógica de compra
- `docs/CANDADO_ROTACION_FORZADA.md` - Rotación de piezas

**Scripts de prueba:**
- `server/scripts/generarPDFListaV3Test.js` - Test V3.1
- `server/scripts/generarPDFProveedorTest.js` - Test proveedor
- `server/scripts/generarPDFOrdenTest.js` - Test orden

---

## ✅ RESUMEN EJECUTIVO

### Servicios Activos (Usar)
1. ✅ **pdfService.js** - Cotizaciones y levantamientos
2. ✅ **pdfOrdenFabricacionService.js** - Orden taller y lista proveedor
3. ✅ **pdfListaPedidoV3Service.js** ⭐ - Lista pedido V3.1 (NUEVO)

### Servicios Deprecados (No usar)
4. ⚠️ **pdfListaPedidoV2Service.js** - Migrar a V3.1
5. ⚠️ **pdfFabricacionService.js** - Uso limitado

### Recomendación Principal
**Para listas de pedido a proveedor:** Usar `pdfListaPedidoV3Service.js` (V3.1)
- ✅ Algoritmo oficial implementado
- ✅ Despiece inteligente
- ✅ Stock de almacén
- ✅ Formato profesional de 3 páginas

---

**Última actualización:** 19 Nov 2025, 6:59 PM  
**Total de servicios PDF:** 5  
**Servicio recomendado:** pdfListaPedidoV3Service.js ⭐
