# 📄 Guía para Modificar PDF de Orden de Taller

**Fecha:** 20 Nov 2025  
**Archivo principal:** `server/services/pdfOrdenFabricacionService.js`  
**Propósito:** Documentar cómo agregar o modificar secciones en el PDF de la orden de taller

---

## 📚 Estructura Actual del PDF

### **Páginas del PDF de Orden de Taller**

| Página | Contenido | Método | Línea Aprox |
|--------|-----------|--------|-------------|
| **1** | Orden de Fabricación (Header + Piezas) | `generarPaginaOrden()` | ~170 |
| **2** | Etiquetas de Producción (para recortar) | `generarPaginaEtiquetas()` | ~66 |
| **3+** | Detalle por Pieza (especificaciones completas) | `generarPaginaDetallePiezas()` | ~489 |

### **Flujo de Generación**

```javascript
static async generarPDF(datosOrden, listaPedido) {
  // PÁGINA 1: ORDEN DE FABRICACIÓN
  this.generarPaginaOrden(doc, datosOrden);
  
  // PÁGINA 2: ETIQUETAS DE PRODUCCIÓN
  doc.addPage();
  this.generarPaginaEtiquetas(doc, datosOrden);
  
  // PÁGINA 3+: DETALLE POR PIEZA
  doc.addPage();
  this.generarPaginaDetallePiezas(doc, datosOrden);
  
  doc.end();
}
```

---

## 🎯 Casos de Uso Comunes

### **1. Agregar Nueva Sección en Página Existente**

**Ejemplo:** Agregar "Optimización de Cortes" después de "Piezas a Fabricar"

**Ubicación:** Dentro de `generarPaginaOrden()`, línea ~263 (después del forEach de piezas)

```javascript
static generarPaginaOrden(doc, datos) {
  // ... código existente ...
  
  // Resumen de Piezas (línea ~223)
  this.dibujarSeccion(doc, `PIEZAS A FABRICAR - ${piezas.length} TOTAL`);
  piezas.forEach((pieza, index) => {
    // ... renderizado de piezas ...
  });
  
  // ✅ AGREGAR NUEVA SECCIÓN AQUÍ (línea ~263)
  doc.moveDown(1);
  this.dibujarSeccionOptimizacionCortes(doc, datos);
  
  // Footer (línea ~265)
  doc.fontSize(8).font('Helvetica')
     .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720);
}
```

**Crear método auxiliar:**

```javascript
/**
 * Sección: Optimización de Cortes
 */
static dibujarSeccionOptimizacionCortes(doc, datos) {
  const { piezas } = datos;
  
  // Verificar espacio disponible
  if (doc.y > 600) {
    doc.addPage();
    doc.y = 50;
  }
  
  // Título de sección
  this.dibujarSeccion(doc, 'OPTIMIZACIÓN DE CORTES');
  
  // Contenido
  doc.fontSize(8).font('Helvetica');
  doc.text('Tubos:', 50, doc.y);
  doc.moveDown(0.5);
  
  // Lógica de optimización aquí
  const optimizacionTubos = this.calcularOptimizacionTubos(piezas);
  optimizacionTubos.forEach(tubo => {
    doc.text(`• Tubo ${tubo.longitud}m: ${tubo.cortes.join(', ')}`, 60, doc.y);
    doc.moveDown(0.3);
  });
  
  doc.moveDown(0.5);
}
```

---

### **2. Agregar Nueva Página Completa**

**Ejemplo:** Agregar página de "Instrucciones de Instalación"

**Ubicación:** En el método principal `generarPDF()`, línea ~43

```javascript
static async generarPDF(datosOrden, listaPedido) {
  // ... páginas existentes ...
  
  // PÁGINA 3+: DETALLE POR PIEZA
  doc.addPage();
  this.generarPaginaDetallePiezas(doc, datosOrden);
  
  // ✅ NUEVA PÁGINA: INSTRUCCIONES DE INSTALACIÓN
  doc.addPage();
  this.generarPaginaInstrucciones(doc, datosOrden);
  
  doc.end();
}
```

**Crear método de página:**

```javascript
/**
 * PÁGINA NUEVA: Instrucciones de Instalación
 */
static generarPaginaInstrucciones(doc, datos) {
  // Título
  doc.fontSize(16).font('Helvetica-Bold')
     .text('INSTRUCCIONES DE INSTALACIÓN', { align: 'center' });
  
  doc.moveDown(1);
  
  // Contenido
  doc.fontSize(10).font('Helvetica');
  doc.text('1. Verificar medidas en sitio', 50, doc.y);
  doc.moveDown(0.5);
  // ... más contenido ...
}
```

---

### **3. Modificar Sección Existente**

**Ejemplo:** Agregar campo "Motor Compartido" en resumen de piezas

**Ubicación:** `generarPaginaOrden()`, línea ~245 (array de specs)

```javascript
// Línea 2: Medidas y especificaciones técnicas
const specs = [
  `${pieza.ancho}×${pieza.alto}m`,
  pieza.motorizado ? 'Motorizado' : 'Manual',
  pieza.control ? `Control: ${pieza.control}` : null,
  // ... campos existentes ...
  pieza.galeriaCompartida ? `[GAL-${pieza.grupoGaleria || 'A'}]` : null,
  pieza.sistemaSkyline ? '[SKYLINE]' : null,
  // ✅ AGREGAR NUEVO CAMPO
  pieza.motorCompartido ? `[MOTOR-${pieza.grupoMotor || 'M1'}]` : null
].filter(Boolean).join(' | ');
```

---

## 🛠️ Métodos Auxiliares Útiles

### **Dibujar Sección con Título**

```javascript
static dibujarSeccion(doc, titulo) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2196f3');
  doc.text(titulo, 50, doc.y);
  doc.fillColor('#000');
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
}
```

### **Verificar Espacio en Página**

```javascript
// Verificar si hay espacio suficiente
if (doc.y > 680) {  // 680 es cerca del final de la página
  doc.addPage();
  doc.y = 50;  // Resetear posición Y
}
```

### **Dibujar Tabla Simple**

```javascript
static dibujarTabla(doc, headers, rows, x, y, columnWidths) {
  let currentY = y;
  
  // Headers
  doc.fontSize(8).font('Helvetica-Bold');
  headers.forEach((header, i) => {
    const colX = x + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.text(header, colX, currentY, { width: columnWidths[i] });
  });
  
  currentY += 15;
  doc.moveTo(x, currentY).lineTo(x + columnWidths.reduce((a, b) => a + b), currentY).stroke();
  currentY += 5;
  
  // Rows
  doc.font('Helvetica');
  rows.forEach(row => {
    row.forEach((cell, i) => {
      const colX = x + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(cell, colX, currentY, { width: columnWidths[i] });
    });
    currentY += 12;
  });
  
  return currentY;
}
```

---

## 📊 Datos Disponibles

### **Estructura de `datosOrden`**

```javascript
{
  proyecto: {
    numero: 'P-2024-001',
    nombre: 'Casa Residencial',
    fechaCreacion: Date
  },
  cliente: {
    nombre: 'Juan Pérez',
    telefono: '123-456-7890',
    direccion: 'Calle Principal 123'
  },
  piezas: [
    {
      numero: 1,
      ubicacion: 'Sala',
      ancho: 1.8,
      alto: 2.5,
      area: 4.5,
      sistema: 'Enrollable',
      motorizado: true,
      control: 'izquierda',
      caida: 'normal',
      tipoInstalacion: 'techo',
      tipoFijacion: 'concreto',
      color: 'Blanco',
      // Campos especiales
      galeriaCompartida: true,
      grupoGaleria: 'A',
      sistemaSkyline: false,
      motorCompartido: true,
      grupoMotor: 'M1',
      piezasPorMotor: 3
    }
  ],
  cronograma: {
    fechaLevantamiento: Date,
    fechaFabricacion: Date,
    fechaInstalacion: Date
  },
  totalPiezas: 6,
  areaTotal: 27.5
}
```

---

## 🎨 Estilos y Formato

### **Tamaños de Fuente Estándar**

```javascript
// Títulos principales
doc.fontSize(16).font('Helvetica-Bold')

// Títulos de sección
doc.fontSize(11).font('Helvetica-Bold').fillColor('#2196f3')

// Subtítulos
doc.fontSize(10).font('Helvetica-Bold')

// Texto normal
doc.fontSize(8).font('Helvetica')

// Texto pequeño (detalles)
doc.fontSize(7).font('Helvetica')

// Notas al pie
doc.fontSize(6).font('Helvetica').fillColor('#666')
```

### **Colores Estándar**

```javascript
// Azul (títulos de sección)
doc.fillColor('#2196f3')

// Negro (texto normal)
doc.fillColor('#000')

// Gris (texto secundario)
doc.fillColor('#666')

// Rojo (alertas)
doc.fillColor('#f44336')

// Verde (éxito)
doc.fillColor('#4caf50')
```

### **Márgenes y Espaciado**

```javascript
// Márgenes de página
margins: { top: 50, bottom: 50, left: 50, right: 50 }

// Espaciado vertical
doc.moveDown(0.3)  // Pequeño
doc.moveDown(0.5)  // Medio
doc.moveDown(1)    // Grande

// Límite de página (antes de agregar nueva)
if (doc.y > 680) { doc.addPage(); }
```

---

## ✅ Checklist para Agregar Nueva Sección

- [ ] **1. Identificar ubicación:** ¿En qué página y después de qué sección?
- [ ] **2. Verificar espacio:** ¿Hay suficiente espacio o necesita nueva página?
- [ ] **3. Crear método auxiliar:** `dibujarSeccionNombre(doc, datos)`
- [ ] **4. Agregar llamada:** En el método de página correspondiente
- [ ] **5. Calcular datos:** Si requiere lógica, crear método `calcularNombre(piezas)`
- [ ] **6. Aplicar estilos:** Usar tamaños y colores estándar
- [ ] **7. Probar con datos reales:** Generar PDF y verificar
- [ ] **8. Documentar cambios:** Actualizar este archivo con el nuevo caso de uso

---

## 🧪 Testing

### **Generar PDF de Prueba**

```javascript
// En el servidor
const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(datosOrden, datosOrden.listaPedido);
fs.writeFileSync('test-orden.pdf', pdfBuffer);
```

### **Verificar Cambios**

1. Generar PDF con proyecto de prueba
2. Verificar que la nueva sección aparece correctamente
3. Verificar que no se rompen secciones existentes
4. Verificar paginación (que no se corte contenido)
5. Verificar con diferentes cantidades de piezas (1, 10, 50)

---

## 📝 Ejemplos de Implementación

### **Ejemplo 1: Optimización de Cortes** ⭐

**Objetivo:** Mostrar cómo optimizar cortes de tubos y telas

**Ubicación:** Después de "PIEZAS A FABRICAR" en página 1

**Implementación:** Ver sección "Agregar Nueva Sección en Página Existente"

### **Ejemplo 2: Notas de Instalación**

**Objetivo:** Agregar notas específicas por proyecto

**Ubicación:** Al final de página 1, antes del footer

```javascript
// En generarPaginaOrden(), antes del footer
if (datos.notasInstalacion) {
  doc.moveDown(1);
  this.dibujarSeccion(doc, 'NOTAS DE INSTALACIÓN');
  doc.fontSize(8).font('Helvetica');
  doc.text(datos.notasInstalacion, 50, doc.y, { width: 500 });
}
```

### **Ejemplo 3: Resumen de Materiales**

**Objetivo:** Consolidar materiales por tipo

**Ubicación:** Nueva página después de detalle de piezas

```javascript
// En generarPDF()
doc.addPage();
this.generarPaginaResumenMateriales(doc, datosOrden);
```

---

## 🚨 Errores Comunes

### **1. Contenido se corta entre páginas**

**Problema:** No se verifica espacio antes de dibujar

**Solución:**
```javascript
if (doc.y > 680) {
  doc.addPage();
  doc.y = 50;
}
```

### **2. Texto se sale del margen**

**Problema:** No se especifica ancho máximo

**Solución:**
```javascript
doc.text('Texto largo...', 50, doc.y, { width: 500 });
```

### **3. Fuentes no se resetean**

**Problema:** Cambios de fuente afectan secciones siguientes

**Solución:**
```javascript
// Siempre resetear después de cambiar
doc.fontSize(11).font('Helvetica-Bold');
// ... usar fuente ...
doc.fontSize(8).font('Helvetica');  // Resetear
```

### **4. Colores no se resetean**

**Problema:** Color de título se mantiene en texto normal

**Solución:**
```javascript
doc.fillColor('#2196f3');
// ... usar color ...
doc.fillColor('#000');  // Resetear a negro
```

---

## 📚 Recursos Adicionales

### **Documentación de PDFKit**

- [PDFKit Documentation](http://pdfkit.org/)
- [PDFKit Examples](https://github.com/foliojs/pdfkit/tree/master/docs)

### **Archivos Relacionados**

- `server/services/pdfOrdenFabricacionService.js` - Servicio principal
- `server/services/ordenProduccionService.js` - Obtención de datos
- `server/controllers/fabricacionController.js` - Endpoint de descarga

---

**Última actualización:** 20 Nov 2025  
**Mantenido por:** Equipo de Desarrollo Sundeck
