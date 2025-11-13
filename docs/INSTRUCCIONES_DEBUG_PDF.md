# 🔍 INSTRUCCIONES PARA DEBUG DE REGENERACIÓN DE PDFs

**Fecha:** 13 Nov 2025  
**Estado:** Logs estructurados implementados ✅  
**Objetivo:** Diagnosticar por qué el PDF se regenera en cada vista

---

## ✅ IMPLEMENTADO

### 1. Logs Estructurados en Endpoint PDF

**Archivo:** `server/routes/cotizaciones.js` (líneas 918-1072)

**Logs agregados:**

#### Inicio del endpoint
```javascript
logger.info('=== INICIO ENDPOINT PDF ===', {
  cotizacionId: req.params.id,
  numero: cotizacion.numero,
  timestamp: new Date().toISOString()
});
```

#### Estado de pdfPath en BD
```javascript
logger.info('Estado de pdfPath en BD', {
  cotizacionId: req.params.id,
  tienePdfPath: !!cotizacion.pdfPath,
  pdfPath: cotizacion.pdfPath,
  tipoPdfPath: typeof cotizacion.pdfPath,
  longitudPdfPath: cotizacion.pdfPath?.length,
  pdfGeneradoEn: cotizacion.pdfGeneradoEn,
  valorBooleano: !!cotizacion.pdfPath
});
```

#### Rama de lectura de PDF guardado
```javascript
logger.info('✅ RAMA: Leer PDF guardado', {
  cotizacionId: req.params.id,
  pdfPath: cotizacion.pdfPath
});

logger.info('Intentando leer archivo del disco', {
  cotizacionId: req.params.id,
  rutaRelativa: cotizacion.pdfPath,
  rutaAbsoluta: pdfPath
});

logger.info('✅ Archivo existe en disco', {
  cotizacionId: req.params.id,
  pdfPath: pdfPath
});

logger.info('✅ PDF leído exitosamente del disco', {
  cotizacionId: req.params.id,
  pdfPath: cotizacion.pdfPath,
  pdfGeneradoEn: cotizacion.pdfGeneradoEn,
  tamañoBytes: pdfBuffer.length
});
```

#### Errores en lectura
```javascript
logger.error('❌ ERROR al leer PDF guardado', {
  cotizacionId: req.params.id,
  pdfPath: cotizacion.pdfPath,
  rutaAbsoluta: pdfPath,
  error: readError.message,
  errorCode: readError.code,
  errorStack: readError.stack
});
```

#### Rama de generación de PDF nuevo
```javascript
logger.warn('❌ RAMA: Generar PDF nuevo (pdfPath vacío o null)', {
  cotizacionId: req.params.id,
  pdfPath: cotizacion.pdfPath,
  tipoPdfPath: typeof cotizacion.pdfPath
});

logger.info('🔄 Iniciando generación de PDF nuevo', {
  cotizacionId: req.params.id,
  numero: cotizacion.numero,
  razon: cotizacion.pdfPath ? 'error_lectura' : 'sin_pdfPath'
});

logger.info('✅ PDF generado exitosamente', {
  cotizacionId: req.params.id,
  tamañoBytes: pdf.length
});

logger.info('💾 Guardando PDF en disco', {
  cotizacionId: req.params.id,
  nombreArchivo: nombreArchivo,
  rutaCompleta: rutaCompleta
});

logger.info('✅ PDF guardado en disco', {
  cotizacionId: req.params.id,
  rutaCompleta: rutaCompleta
});

logger.info('📝 Actualizando pdfPath en BD (primera vez)', {
  cotizacionId: req.params.id,
  pdfPathNuevo: `/uploads/cotizaciones/${nombreArchivo}`
});

logger.warn('⚠️ PDF regenerado pero NO se actualizó pdfPath (ya existía)', {
  cotizacionId: req.params.id,
  pdfPathExistente: cotizacion.pdfPath,
  pdfNuevoGenerado: nombreArchivo,
  nota: 'Esto NO debería pasar - investigar por qué se regeneró'
});
```

### 2. Endpoint de Debug

**Ruta:** `GET /api/cotizaciones/:id/debug-pdf`  
**Archivo:** `server/routes/cotizaciones.js` (líneas 1095-1191)

**Información que devuelve:**
```json
{
  "success": true,
  "timestamp": "2025-11-13T19:15:00.000Z",
  "debug": {
    "cotizacion": {
      "id": "69152a4d91f868b9f75a337b",
      "numero": "COT-2025-0007",
      "createdAt": "2025-11-13T17:00:00.000Z",
      "updatedAt": "2025-11-13T17:06:59.881Z"
    },
    "pdfPath": {
      "valor": "/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf",
      "tipo": "string",
      "esNull": false,
      "esUndefined": false,
      "esStringVacio": false,
      "longitud": 56,
      "valorBooleano": true,
      "pdfGeneradoEn": "2025-11-13T17:06:59.881Z"
    },
    "archivo": {
      "rutaRelativa": "/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf",
      "rutaAbsoluta": "C:\\Users\\dav_r\\App Sundeck\\SUNDECK-APP-v2\\uploads\\cotizaciones\\COT-2025-0007-1763053619881.pdf",
      "existe": true,
      "tamaño": 163002,
      "fechaModificacion": "2025-11-13T17:06:59.881Z",
      "error": null
    },
    "modelo": {
      "campos": ["_id", "numero", "pdfPath", "pdfGeneradoEn", ...],
      "tienePdfPath": true,
      "tipoCampoPdfPath": "String"
    }
  }
}
```

---

## 🧪 INSTRUCCIONES DE PRUEBA

### Paso 1: Reiniciar el servidor backend

```bash
# Detener servidor actual
Stop-Process -Name node -Force

# Iniciar servidor con logs visibles
npm run server
```

### Paso 2: Abrir el visor de PDF 3 veces

1. **Primera apertura:**
   - Ir a: `http://localhost:3000/cotizaciones/69152a4d91f868b9f75a337b`
   - Observar logs en la consola del servidor
   - Buscar: `=== INICIO ENDPOINT PDF ===`

2. **Segunda apertura:**
   - Cerrar el visor
   - Volver a abrir la misma cotización
   - Observar logs nuevamente

3. **Tercera apertura:**
   - Cerrar el visor
   - Volver a abrir la misma cotización
   - Observar logs por tercera vez

### Paso 3: Revisar logs en la consola

**Buscar estas líneas clave:**

#### ✅ Si usa PDF guardado (CORRECTO):
```
=== INICIO ENDPOINT PDF ===
Estado de pdfPath en BD { tienePdfPath: true, pdfPath: '/uploads/...' }
✅ RAMA: Leer PDF guardado
Intentando leer archivo del disco
✅ Archivo existe en disco
✅ PDF leído exitosamente del disco
=== FIN ENDPOINT PDF (archivo guardado) ===
```

#### ❌ Si regenera PDF (INCORRECTO):
```
=== INICIO ENDPOINT PDF ===
Estado de pdfPath en BD { tienePdfPath: false, pdfPath: null }
❌ RAMA: Generar PDF nuevo (pdfPath vacío o null)
🔄 Iniciando generación de PDF nuevo
✅ PDF generado exitosamente
💾 Guardando PDF en disco
```

O:

```
=== INICIO ENDPOINT PDF ===
Estado de pdfPath en BD { tienePdfPath: true, pdfPath: '/uploads/...' }
✅ RAMA: Leer PDF guardado
Intentando leer archivo del disco
❌ ERROR al leer PDF guardado { error: 'ENOENT: no such file or directory' }
🔄 Iniciando generación de PDF nuevo
```

### Paso 4: Usar endpoint de debug

**Desde el navegador o Postman:**

```bash
GET http://localhost:5001/api/cotizaciones/69152a4d91f868b9f75a337b/debug-pdf
```

**Headers:**
```
Authorization: Bearer <tu_token>
```

**Analizar la respuesta JSON:**
- ¿`pdfPath.valor` tiene contenido?
- ¿`pdfPath.tipo` es "string"?
- ¿`pdfPath.valorBooleano` es `true`?
- ¿`archivo.existe` es `true`?
- ¿`archivo.error` es `null`?

### Paso 5: Capturar logs completos

**Copiar los logs de las 3 aperturas y compartir:**

```bash
# Los logs se verán así:
[2025-11-13 13:15:00] INFO: === INICIO ENDPOINT PDF === { cotizacionId: '69152a4d91f868b9f75a337b', numero: 'COT-2025-0007' }
[2025-11-13 13:15:00] INFO: Estado de pdfPath en BD { tienePdfPath: true, pdfPath: '/uploads/cotizaciones/COT-2025-0007-1763053619881.pdf' }
[2025-11-13 13:15:00] INFO: ✅ RAMA: Leer PDF guardado { cotizacionId: '69152a4d91f868b9f75a337b' }
...
```

---

## 🎯 QUÉ BUSCAR EN LOS LOGS

### Escenario 1: pdfPath es null/undefined
```
Estado de pdfPath en BD { 
  tienePdfPath: false, 
  pdfPath: null,
  tipoPdfPath: 'object'  ← Mongoose devuelve null como object
}
```
**Causa:** El campo se borra antes de la consulta o no se guarda correctamente

### Escenario 2: Archivo no existe en disco
```
✅ RAMA: Leer PDF guardado
Intentando leer archivo del disco
❌ ERROR al leer PDF guardado { 
  error: 'ENOENT: no such file or directory',
  errorCode: 'ENOENT'
}
```
**Causa:** El archivo fue eliminado o la ruta es incorrecta

### Escenario 3: Error de permisos
```
❌ ERROR al leer PDF guardado { 
  error: 'EACCES: permission denied',
  errorCode: 'EACCES'
}
```
**Causa:** Node.js no tiene permisos para leer el archivo

### Escenario 4: Populate borra el campo
```
Estado de pdfPath en BD { 
  tienePdfPath: false, 
  pdfPath: undefined,
  tipoPdfPath: 'undefined'
}
```
**Causa:** El `.populate()` podría estar causando problemas

---

## 🔧 SOLUCIONES SEGÚN EL ESCENARIO

### Si pdfPath es null/undefined:
1. Verificar middleware de Mongoose en `server/models/Cotizacion.js`
2. Probar sin `.populate()` en la consulta
3. Verificar que el campo se guarda correctamente con `cotizacion.save()`

### Si el archivo no existe:
1. Verificar que la ruta sea correcta
2. Verificar que el archivo no se elimine después de guardarse
3. Verificar permisos del directorio `uploads/cotizaciones/`

### Si hay error de permisos:
1. Verificar permisos del directorio
2. Ejecutar: `chmod 755 server/uploads/cotizaciones/`

### Si populate borra el campo:
1. Quitar `.populate()` del endpoint PDF
2. O agregar `pdfPath` a la lista de campos a preservar

---

## 📊 RESULTADO ESPERADO

**Después de la primera apertura:**
- ✅ PDF se genera y guarda
- ✅ `pdfPath` se actualiza en BD
- ✅ Logs muestran: "PDF generado y guardado (primera vez)"

**Segunda y tercera apertura:**
- ✅ PDF se lee del disco
- ✅ NO se regenera
- ✅ Logs muestran: "PDF leído exitosamente del disco"

**Endpoint de debug:**
- ✅ `pdfPath.valorBooleano: true`
- ✅ `archivo.existe: true`
- ✅ `archivo.error: null`

---

## 📝 CHECKLIST DE PRUEBA

- [ ] Servidor backend reiniciado
- [ ] Logs visibles en consola
- [ ] Primera apertura del visor
- [ ] Logs de primera apertura capturados
- [ ] Segunda apertura del visor
- [ ] Logs de segunda apertura capturados
- [ ] Tercera apertura del visor
- [ ] Logs de tercera apertura capturados
- [ ] Endpoint `/debug-pdf` probado
- [ ] Respuesta JSON analizada
- [ ] Logs completos compartidos

---

## 🚀 PRÓXIMOS PASOS

Una vez que tengamos los logs:

1. **Identificar la causa raíz** según los escenarios
2. **Implementar la solución** específica
3. **Probar nuevamente** con los mismos pasos
4. **Verificar que el problema está resuelto**
5. **Documentar la solución** en `docs/SOLUCION_PDF_REGENERACION.md`

---

**Tiempo estimado de prueba:** 10-15 minutos  
**Archivos modificados:** 1 (`server/routes/cotizaciones.js`)  
**Nuevos endpoints:** 1 (`/api/cotizaciones/:id/debug-pdf`)  
**Logs agregados:** 15+ puntos de instrumentación
