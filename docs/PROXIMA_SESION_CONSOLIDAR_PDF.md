# 🎯 PRÓXIMA SESIÓN: CONSOLIDAR SERVICIOS PDF DE PEDIDOS

**Fecha de creación:** 19 Noviembre 2025, 7:03 PM  
**Prioridad:** 🔴 ALTA  
**Tiempo estimado:** 1-2 horas

---

## 🎯 OBJETIVO

**Crear UN SOLO servicio PDF de pedidos definitivo** que combine lo mejor de los 3 servicios actuales.

---

## 📋 SERVICIOS A CONSOLIDAR

### 1. **pdfOrdenFabricacionService.js** (generarPDFListaPedido - línea 615)

**Lo mejor de este servicio:**
- ✅ **Checklist de empaque y control de calidad** (líneas 568-599)
  - Lista completa de verificación
  - Checkboxes para marcar
  - Sección "Elaborado por" con firma
- ✅ **Formato profesional de 3 páginas**
  - Página 1: Lista de Pedido para Proveedor
  - Página 2: Detalle de Materiales por Pieza
  - Página 3: Materiales Consolidados
- ✅ **Estructura clara y organizada**
- ✅ **Información completa de tubos, mecanismos, motores**

**Código clave a preservar:**
```javascript
// Checklist (líneas 568-599)
const checklist = [
  'Todas las piezas están correctamente etiquetadas',
  'Medidas verificadas y dentro de tolerancia',
  'Mecanismos probados y funcionando correctamente',
  'Acabados y color según especificación',
  'Embalaje protector aplicado',
  'Accesorios completos incluidos',
  'Documentación de instalación incluida',
  'Control de calidad aprobado'
];
```

---

### 2. **pdfListaPedidoV3Service.js** (NUEVO - 19 Nov 2025)

**Lo mejor de este servicio:**
- ✅ **Despiece inteligente con rollo óptimo**
  - Selección automática de rollo (2.00/2.50/3.00)
  - Minimiza desperdicio
  - Calcula sobrantes por rollo
- ✅ **Stock de almacén integrado**
  - Usa stock disponible primero
  - Calcula faltante real
  - Actualiza stock usado
- ✅ **Telas agrupadas por tipo**
  - Screen / Blackout / Sheer
  - Orden del despiece mantenido
- ✅ **Reglas de compra automáticas**
  - Si faltante < 22ml → pedir metros exactos
  - Si faltante >= 22ml → pedir rollo completo (30ml)
- ✅ **Algoritmo oficial implementado**
  - Según documento: "calculo de telas, para orden de pedido"

**Código clave a preservar:**
```javascript
// Despiece inteligente (líneas 50-180)
static calcularDespieceInteligente(datosOrden) {
  const ROLLOS_DISPONIBLES = [2.00, 2.50, 3.00];
  const ROLLO_COMPLETO_ML = 30;
  const UMBRAL_ROLLO = 22;
  
  // Selección de rollo óptimo
  // Uso de stock de almacén
  // Cálculo de faltante
  // Agrupación por tipo
}
```

---

### 3. **Nueva lógica de compra** (ordenProduccionService.js - líneas 655-716)

**Lo mejor de esta lógica:**
- ✅ **Cálculo de faltante vs stock**
  - `faltante = requerimiento_total - stock_almacen`
- ✅ **Decisión automática ML vs rollo**
  - Reglas claras y documentadas
- ✅ **Observaciones descriptivas**
  - "Compra por metro lineal (X.XX ml)"
  - "Compra rollo completo (30 ml) | Sobrante: X.XX ml"

**Código clave a preservar:**
```javascript
// Lógica de compra (líneas 655-691)
const ROLLO_COMPLETO_ML = 30;
const UMBRAL_ROLLO = 22;

if (faltante <= 0) {
  tipoPedido = 'ninguno';
  observaciones = `Stock suficiente en almacén`;
} else if (faltante < UMBRAL_ROLLO) {
  tipoPedido = 'metros';
  cantidadPedir = faltante;
  observaciones = `Compra por metro lineal`;
} else {
  tipoPedido = 'rollo';
  cantidadPedir = ROLLO_COMPLETO_ML;
  sobranteEstimado = ROLLO_COMPLETO_ML - faltante;
  observaciones = `Compra rollo completo | Sobrante: ${sobranteEstimado}ml`;
}
```

---

## 🎨 DISEÑO DEL SERVICIO UNIFICADO

### Nombre sugerido: `pdfListaPedidoFinalService.js`

### Estructura del PDF (3 páginas):

**PÁGINA 1: Material Consolidado (IMPRIMIBLE)** ⭐
```
LISTA DE PEDIDO - MATERIAL CONSOLIDADO

Proyecto: XXX | Cliente: XXX | Fecha: XXX

SCREEN
├─ Soft White - 3.00m
│  Cantidad total: 6.72 ml (rotada)
│  Usado en: 2 piezas
│  Stock usado: 8.00 ml de almacén
│  >> PEDIR: 1 rollo de 30 ml
│
└─ [Más telas Screen...]

BLACKOUT
├─ Montreal White - 3.00m
│  Cantidad total: 7.33 ml
│  Usado en: 3 piezas
│  ✓ Stock suficiente (12.00 ml en almacén)
│
└─ [Más telas Blackout...]

TUBOS
├─ T50 - Tubo 50mm
│  >> PEDIR: 4 barras x 5.80m | Total: 23.20ml
│
└─ [Más tubos...]

MOTORES Y CONTROLES
├─ MOTORES REQUERIDOS: 5
│  >> Modelos a pedir:
│     1) Motor Somfy RTS - Cantidad: 5
│
└─ CONTROLES:
    Tipo: _______ Cantidad: ____
```

**PÁGINA 2: Despiece por Pieza (TÉCNICO)**
```
DESPIECE POR PIEZA (TÉCNICO)

PIEZA 1 – Rec Princ
Sistema: Roller Shade
Tela: Soft White
Rotada: No
Ancho final: 3.28 m
Alto final: 2.56 m

Análisis del rollo:
- Rollos disponibles: 2.00m, 2.50m, 3.00m
- Rollo seleccionado: 3.00m (óptimo)
- ML consumidos: 3.28 ml
- Tomado de almacén: Sí
- Sobrante del rollo: 8.72 ml
- Stock actualizado: 8.72 ml restantes

────────────────────────────────────────

[Más piezas...]
```

**PÁGINA 3: Almacén + Garantías + Checklist**
```
ALMACÉN Y GARANTÍAS

MATERIAL A TOMAR DE ALMACÉN
- Tela rollo 2.00m: usar 1.37 ml
  Stock restante: 6.63 ml
- Tela rollo 3.00m: usar 6.66 ml
  Stock restante: 5.34 ml
- Tubo T50: usar 2 barras
  Stock restante: 8 barras

NUEVO STOCK ESTIMADO
[Tabla con stock actualizado]

CHECKLIST DE EMPAQUE Y CONTROL DE CALIDAD
□ Todas las piezas están correctamente etiquetadas
□ Medidas verificadas y dentro de tolerancia
□ Mecanismos probados y funcionando correctamente
□ Acabados y color según especificación
□ Embalaje protector aplicado
□ Accesorios completos incluidos
□ Documentación de instalación incluida
□ Control de calidad aprobado

GARANTÍAS
Garantía: 1 año en materiales y mano de obra
Fecha de emisión: [fecha]

Elaborado por: _______________________
```

---

## 🔧 PLAN DE IMPLEMENTACIÓN

### Paso 1: Crear nuevo servicio (30 min)
```javascript
// server/services/pdfListaPedidoFinalService.js

class PDFListaPedidoFinalService {
  
  // Combinar calcularDespieceInteligente de V3.1
  static calcularDespieceInteligente(datosOrden) {
    // Código de pdfListaPedidoV3Service.js
    // + Lógica de compra de ordenProduccionService.js
  }
  
  // Página 1: Material Consolidado
  static generarHoja1MaterialConsolidado(doc, datos, despiece) {
    // Código de pdfListaPedidoV3Service.js
    // + Formato de pdfOrdenFabricacionService.js
  }
  
  // Página 2: Despiece por Pieza
  static generarHoja2Despiece(doc, datos, despiece) {
    // Código de pdfListaPedidoV3Service.js
    // + Detalles de pdfOrdenFabricacionService.js
  }
  
  // Página 3: Almacén + Garantías + Checklist
  static generarHoja3AlmacenGarantiasChecklist(doc, datos, despiece) {
    // Código de pdfListaPedidoV3Service.js
    // + Checklist de pdfOrdenFabricacionService.js (líneas 568-599)
  }
  
  // Método principal
  static async generarPDF(datosOrden) {
    // Orquestar las 3 páginas
  }
}
```

### Paso 2: Integrar con almacén real (30 min)
```javascript
// Reemplazar stock simulado por consulta real
const AlmacenService = require('./almacenProduccionService');

const stockAlmacen = await AlmacenService.obtenerStockRollos({
  tipo: 'Tela',
  modelo: tela.modelo,
  color: tela.color
});
```

### Paso 3: Probar y validar (20 min)
```bash
# Script de prueba
node server/scripts/generarPDFListaFinalTest.js
```

### Paso 4: Deprecar servicios antiguos (10 min)
- Marcar V2 como deprecado
- Documentar migración a servicio final
- Actualizar endpoints

---

## 📊 COMPARATIVA

| Característica | V2 | generarPDFListaPedido | V3.1 | **FINAL** |
|----------------|----|-----------------------|------|-----------|
| Despiece inteligente | ❌ | ❌ | ✅ | ✅ |
| Stock almacén | ❌ | ❌ | ✅ | ✅ |
| Agrupación por tipo | ❌ | ❌ | ✅ | ✅ |
| Reglas ML vs rollo | ❌ | ❌ | ✅ | ✅ |
| Checklist empaque | ❌ | ✅ | ❌ | ✅ |
| Formato profesional | ⚠️ | ✅ | ✅ | ✅ |
| Garantías | ❌ | ✅ | ✅ | ✅ |
| 3 páginas | ❌ | ✅ | ✅ | ✅ |

---

## ✅ RESULTADO ESPERADO

**Un solo servicio PDF de pedidos que:**
1. ✅ Use despiece inteligente con rollo óptimo
2. ✅ Integre stock de almacén real
3. ✅ Agrupe telas por tipo (Screen/Blackout/Sheer)
4. ✅ Aplique reglas automáticas de compra
5. ✅ Incluya checklist de empaque completo
6. ✅ Tenga formato profesional de 3 páginas
7. ✅ Sea el servicio definitivo y único

---

## 📁 ARCHIVOS A REVISAR EN PRÓXIMA SESIÓN

**Servicios actuales:**
1. `server/services/pdfOrdenFabricacionService.js` (línea 615)
   - Método: `generarPDFListaPedido()`
   - Checklist: líneas 568-599
   
2. `server/services/pdfListaPedidoV3Service.js`
   - Método: `calcularDespieceInteligente()` (líneas 50-180)
   - Método: `generarPDF()` (línea 22)
   
3. `server/services/ordenProduccionService.js`
   - Lógica de compra: líneas 655-716

**Documentación:**
- `docs/LISTA_PEDIDO_V3.1_IMPLEMENTACION.md`
- `docs/NUEVA_LOGICA_COMPRA_TELAS.md`
- `docs/proyectos/calculo de telas, para orden de pedido, solo orden de pedido.md`

**Scripts de prueba:**
- `server/scripts/generarPDFListaV3Test.js`
- `server/scripts/generarPDFListaPedidoDirecto.js`

---

## 🎯 CHECKLIST DE CONSOLIDACIÓN

### Antes de empezar:
- [ ] Revisar los 3 servicios actuales
- [ ] Identificar código clave a preservar
- [ ] Leer algoritmo oficial de cálculo de telas

### Durante la implementación:
- [ ] Crear `pdfListaPedidoFinalService.js`
- [ ] Copiar despiece inteligente de V3.1
- [ ] Copiar checklist de generarPDFListaPedido
- [ ] Integrar lógica de compra de ordenProduccionService
- [ ] Crear las 3 páginas del PDF
- [ ] Integrar con almacén real

### Después de implementar:
- [ ] Probar con 3 proyectos diferentes
- [ ] Validar cálculos con equipo
- [ ] Actualizar endpoints API
- [ ] Deprecar servicios antiguos
- [ ] Actualizar documentación

---

## 📝 NOTAS IMPORTANTES

**Prioridades:**
1. 🔴 **Despiece inteligente** - Es la base del algoritmo oficial
2. 🔴 **Stock de almacén** - Crítico para optimización de compras
3. 🟡 **Checklist** - Importante para control de calidad
4. 🟢 **Formato** - Mejorar presentación

**No perder:**
- ✅ Checklist de empaque (líneas 568-599 de pdfOrdenFabricacionService.js)
- ✅ Despiece inteligente (pdfListaPedidoV3Service.js)
- ✅ Reglas de compra (ordenProduccionService.js líneas 655-691)
- ✅ Agrupación por tipo de tela

**Integrar después:**
- ⏳ Almacén real (actualmente simulado)
- ⏳ Endpoint API
- ⏳ Botón en frontend

---

**Fecha de creación:** 19 Nov 2025, 7:03 PM  
**Creado por:** Usuario + Cascade  
**Estado:** 📋 PENDIENTE PARA PRÓXIMA SESIÓN  
**Prioridad:** 🔴 ALTA
