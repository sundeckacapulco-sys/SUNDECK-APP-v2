# 🐛 PROBLEMA: PDF SE REGENERA EN CADA VISTA

**Fecha:** 13 Nov 2025 13:02 PM  
**Estado:** ❌ NO RESUELTO - Requiere investigación profunda

---

## 🎯 OBJETIVO

Que el visor de PDF use el archivo guardado y NO regenere uno nuevo cada vez.

---

## ✅ LO QUE SÍ FUNCIONA

1. **Visor de PDF** ✅
   - Muestra el PDF correctamente en iframe
   - Blob con tipo MIME correcto
   - Sin problemas de IDM

2. **Generación y guardado de PDF** ✅
   - Genera PDF correctamente con Puppeteer
   - Guarda en `server/uploads/cotizaciones/`
   - Actualiza `pdfPath` en la base de datos

3. **Lectura del PDF guardado** ✅
   - Si `pdfPath` existe, lee el archivo del disco
   - Envía el buffer al frontend
   - Frontend lo muestra correctamente

---

## ❌ EL PROBLEMA

**Cada vez que abres el visor, genera un PDF nuevo** aunque:
- ✅ El archivo existe en disco
- ✅ El `pdfPath` está en la base de datos
- ✅ El código verifica `if (cotizacion.pdfPath)`

**Resultado:** Genera 3 PDFs nuevos cada vez que abres 3 veces.

---

## 🔍 INVESTIGACIÓN REALIZADA

### **1. Verificación de archivo en disco**
```bash
Test-Path "server\uploads\cotizaciones\COT-2025-0007-1763053619881.pdf"
# Resultado: True ✅
```

### **2. Verificación de pdfPath en BD**
```javascript
const cotizacion = await Cotizacion.findById('69152a4d91f868b9f75a337b');
console.log('pdfPath:', cotizacion.pdfPath);
// Resultado: /uploads/cotizaciones/COT-2025-0007-1763053619881.pdf ✅
```

### **3. Código del endpoint**
```javascript
// server/routes/cotizaciones.js línea 925
if (cotizacion.pdfPath) {
  const pdfBuffer = await fs.readFile(pdfPath);
  return res.send(pdfBuffer); // ← Debería usar este camino
}

// Si no tiene pdfPath, genera nuevo
const pdf = await pdfService.generarCotizacionPDF(cotizacion);
// ← Pero siempre llega aquí
```

---

## 🤔 HIPÓTESIS

### **Hipótesis 1: pdfPath se borra antes de consultar**
- Algo está borrando el `pdfPath` entre que se guarda y se consulta
- Posible culpable: Middleware de Mongoose
- **Descartada:** Usamos `findByIdAndUpdate` directo y sigue pasando

### **Hipótesis 2: El archivo no se encuentra**
- La ruta del archivo es incorrecta
- **Descartada:** El archivo existe y la ruta es correcta

### **Hipótesis 3: Error en lectura del archivo**
- `fs.readFile` falla y cae en el catch
- **Posible:** No tenemos logs del catch

### **Hipótesis 4: Condición `if (cotizacion.pdfPath)` falla**
- El campo existe pero es `null`, `undefined`, o string vacío
- **Posible:** Necesitamos agregar log antes del if

---

## 🛠️ INTENTOS DE SOLUCIÓN

### **Intento 1: Agregar pdfPath a campos permitidos** ❌
```javascript
const camposPermitidos = [
  // ... otros campos
  'pdfPath', 'pdfGeneradoEn'
];
```
**Resultado:** Sigue regenerando

### **Intento 2: No actualizar pdfPath si ya existe** ❌
```javascript
if (!cotizacion.pdfPath) {
  cotizacion.pdfPath = `/uploads/cotizaciones/${nombreArchivo}`;
  await cotizacion.save();
}
```
**Resultado:** Sigue regenerando

### **Intento 3: Usar findByIdAndUpdate directo** ❌
```javascript
await Cotizacion.findByIdAndUpdate(id, {
  $set: { pdfPath: '...', pdfGeneradoEn: '...' }
});
```
**Resultado:** Sigue regenerando

---

## 📊 DATOS ACTUALES

**Cotización ID:** `69152a4d91f868b9f75a337b`  
**Número:** `COT-2025-0007`  
**PDF original:** `COT-2025-0007-1763053619881.pdf` (163,002 bytes)  
**PDFs generados:** 60+ archivos duplicados

**Estado en BD:**
```json
{
  "_id": "69152a4d91f868b9f75a337b",
  "numero": "COT-2025-0007",
  "pdfPath": "/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf",
  "pdfGeneradoEn": "2025-11-13T17:06:59.881Z"
}
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### **1. Agregar logs detallados**
```javascript
router.get('/:id/pdf', async (req, res) => {
  const cotizacion = await Cotizacion.findById(req.params.id);
  
  console.log('=== DEBUG PDF ===');
  console.log('1. Cotización encontrada:', !!cotizacion);
  console.log('2. pdfPath:', cotizacion.pdfPath);
  console.log('3. pdfPath type:', typeof cotizacion.pdfPath);
  console.log('4. pdfPath length:', cotizacion.pdfPath?.length);
  console.log('5. Condición if:', !!cotizacion.pdfPath);
  
  if (cotizacion.pdfPath) {
    console.log('6. Entrando a leer archivo guardado');
    // ...
  } else {
    console.log('6. NO tiene pdfPath, generando nuevo');
  }
});
```

### **2. Verificar middleware de Mongoose**
```javascript
// En server/models/Cotizacion.js
CotizacionSchema.pre('save', function(next) {
  console.log('PRE-SAVE:', this.pdfPath);
  next();
});

CotizacionSchema.post('save', function(doc) {
  console.log('POST-SAVE:', doc.pdfPath);
});
```

### **3. Verificar populate**
El `.populate()` podría estar causando problemas:
```javascript
const cotizacion = await Cotizacion.findById(req.params.id)
  .populate('prospecto')
  .populate('elaboradaPor');
// ¿El populate borra pdfPath?
```

### **4. Usar endpoint separado para debug**
```javascript
router.get('/:id/debug-pdf', async (req, res) => {
  const cotizacion = await Cotizacion.findById(req.params.id);
  res.json({
    id: cotizacion._id,
    numero: cotizacion.numero,
    pdfPath: cotizacion.pdfPath,
    pdfGeneradoEn: cotizacion.pdfGeneradoEn,
    tienePdfPath: !!cotizacion.pdfPath,
    tipoPdfPath: typeof cotizacion.pdfPath
  });
});
```

---

## 📝 CONCLUSIÓN

El visor funciona perfectamente. El problema es que **el backend siempre genera un PDF nuevo** en lugar de usar el guardado.

**Necesitamos logs detallados** para entender por qué la condición `if (cotizacion.pdfPath)` no se cumple o por qué la lectura del archivo falla.

---

## 🔧 ARCHIVOS MODIFICADOS

1. `server/routes/cotizaciones.js` - Endpoint de PDF
2. `server/models/Cotizacion.js` - Campos pdfPath y pdfGeneradoEn
3. `client/src/components/Cotizaciones/CotizacionViewer.jsx` - Visor con iframe
4. `server/scripts/actualizarPdfPathCotizacion.js` - Script de actualización
5. `server/scripts/fijarPdfPathPermanente.js` - Script de fijación

---

**Tiempo invertido:** ~5 horas  
**Estado:** Visor funciona ✅ | Regeneración NO resuelta ❌
