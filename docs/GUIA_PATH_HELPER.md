# 📁 GUÍA: Path Helper - Manejo Correcto de Rutas de Archivos

**Fecha:** 13 Nov 2025  
**Estado:** ✅ IMPLEMENTADO  
**Propósito:** Evitar errores de rutas en lectura/escritura de archivos

---

## 🎯 PROBLEMA QUE RESUELVE

**Antes (INCORRECTO):**
```javascript
// ❌ Construcción manual de rutas - propenso a errores
const path = require('path');
const pdfPath = path.join(__dirname, '../..', cotizacion.pdfPath);
// Resultado: Ruta incorrecta → Error ENOENT
```

**Después (CORRECTO):**
```javascript
// ✅ Uso de pathHelper - construcción correcta garantizada
const { getAbsolutePath } = require('../utils/pathHelper');
const pdfPath = getAbsolutePath(cotizacion.pdfPath);
// Resultado: Ruta correcta → Archivo encontrado
```

---

## 📚 FUNCIONES DISPONIBLES

### 1. `getAbsolutePath(relativePath)`

**Propósito:** Convertir ruta relativa de BD a ruta absoluta del sistema

**Uso:**
```javascript
const { getAbsolutePath } = require('../utils/pathHelper');

// BD guarda: /uploads/cotizaciones/COT-2025-0007.pdf
const absolutePath = getAbsolutePath(cotizacion.pdfPath);
// Resultado: C:\...\SUNDECK-APP-v2\server\uploads\cotizaciones\COT-2025-0007.pdf

// Leer archivo
const fs = require('fs').promises;
const pdfBuffer = await fs.readFile(absolutePath);
```

**Cuándo usar:**
- ✅ Leer archivos guardados en BD
- ✅ Verificar existencia de archivos
- ✅ Obtener información de archivos

---

### 2. `getUploadPath(subdirectory, filename)`

**Propósito:** Construir ruta absoluta para guardar archivos nuevos

**Uso:**
```javascript
const { getUploadPath } = require('../utils/pathHelper');

// Guardar nuevo PDF
const nombreArchivo = `COT-2025-0007-${Date.now()}.pdf`;
const rutaCompleta = getUploadPath('cotizaciones', nombreArchivo);
// Resultado: C:\...\SUNDECK-APP-v2\server\uploads\cotizaciones\COT-2025-0007-1763062062014.pdf

await fs.writeFile(rutaCompleta, pdfBuffer);
```

**Subdirectorios comunes:**
- `cotizaciones` - PDFs de cotizaciones
- `fabricacion` - Etiquetas y documentos de fabricación
- `instalaciones` - Fotos y documentos de instalación
- `proyectos` - Documentos generales de proyectos

---

### 3. `getRelativePath(subdirectory, filename)`

**Propósito:** Construir ruta relativa para guardar en BD

**Uso:**
```javascript
const { getRelativePath } = require('../utils/pathHelper');

const nombreArchivo = `COT-2025-0007-${Date.now()}.pdf`;
const rutaRelativa = getRelativePath('cotizaciones', nombreArchivo);
// Resultado: /uploads/cotizaciones/COT-2025-0007-1763062062014.pdf

// Guardar en BD
cotizacion.pdfPath = rutaRelativa;
await cotizacion.save();
```

**Cuándo usar:**
- ✅ Guardar referencia de archivo en BD
- ✅ Siempre después de guardar un archivo nuevo

---

### 4. `fileExists(absolutePath)`

**Propósito:** Verificar si un archivo existe

**Uso:**
```javascript
const { getAbsolutePath, fileExists } = require('../utils/pathHelper');

const pdfPath = getAbsolutePath(cotizacion.pdfPath);
const exists = await fileExists(pdfPath);

if (!exists) {
  console.log('PDF no encontrado, regenerando...');
  // Generar nuevo PDF
}
```

**Cuándo usar:**
- ✅ Antes de leer un archivo
- ✅ Validar que archivos referenciados existen
- ✅ Limpiar referencias huérfanas

---

### 5. `ensureUploadDirectory(subdirectory)`

**Propósito:** Crear directorio si no existe

**Uso:**
```javascript
const { ensureUploadDirectory } = require('../utils/pathHelper');

// Asegurar que el directorio existe antes de guardar
await ensureUploadDirectory('fabricacion');

// Ahora puedes guardar archivos sin error
const etiquetaPath = getUploadPath('fabricacion', 'etiqueta-001.pdf');
await fs.writeFile(etiquetaPath, etiquetaBuffer);
```

**Cuándo usar:**
- ✅ Antes de guardar archivos en un nuevo subdirectorio
- ✅ En scripts de inicialización
- ✅ Al crear nuevos módulos con archivos

---

### 6. `getFileInfo(absolutePath)`

**Propósito:** Obtener información del archivo

**Uso:**
```javascript
const { getAbsolutePath, getFileInfo } = require('../utils/pathHelper');

const pdfPath = getAbsolutePath(cotizacion.pdfPath);
const info = await getFileInfo(pdfPath);

console.log('Tamaño:', info.size, 'bytes');
console.log('Creado:', info.created);
console.log('Modificado:', info.modified);
```

**Cuándo usar:**
- ✅ Logging de operaciones de archivos
- ✅ Validar tamaño de archivos
- ✅ Auditoría de archivos

---

## 🔄 PATRÓN COMPLETO: Guardar y Leer Archivos

### Guardar archivo nuevo:

```javascript
const { 
  getUploadPath, 
  getRelativePath, 
  ensureUploadDirectory 
} = require('../utils/pathHelper');

// 1. Asegurar que el directorio existe
await ensureUploadDirectory('cotizaciones');

// 2. Construir rutas
const nombreArchivo = `${cotizacion.numero}-${Date.now()}.pdf`;
const rutaCompleta = getUploadPath('cotizaciones', nombreArchivo);
const rutaRelativa = getRelativePath('cotizaciones', nombreArchivo);

// 3. Guardar archivo
await fs.writeFile(rutaCompleta, pdfBuffer);

// 4. Guardar referencia en BD
cotizacion.pdfPath = rutaRelativa;
cotizacion.pdfGeneradoEn = new Date();
await cotizacion.save();

logger.info('PDF guardado', {
  rutaCompleta,
  rutaRelativa,
  tamaño: pdfBuffer.length
});
```

### Leer archivo guardado:

```javascript
const { 
  getAbsolutePath, 
  fileExists 
} = require('../utils/pathHelper');

// 1. Construir ruta absoluta desde BD
const pdfPath = getAbsolutePath(cotizacion.pdfPath);

// 2. Verificar existencia
const exists = await fileExists(pdfPath);
if (!exists) {
  throw new Error('Archivo no encontrado');
}

// 3. Leer archivo
const pdfBuffer = await fs.readFile(pdfPath);

// 4. Enviar al cliente
res.setHeader('Content-Type', 'application/pdf');
res.send(pdfBuffer);
```

---

## 📋 CASOS DE USO POR MÓDULO

### Cotizaciones:
```javascript
// Guardar PDF
const pdfPath = getUploadPath('cotizaciones', `${numero}-${Date.now()}.pdf`);
const relativePath = getRelativePath('cotizaciones', nombreArchivo);

// Leer PDF
const absolutePath = getAbsolutePath(cotizacion.pdfPath);
```

### Fabricación:
```javascript
// Guardar etiquetas
await ensureUploadDirectory('fabricacion');
const etiquetaPath = getUploadPath('fabricacion', `etiqueta-${pedidoId}.pdf`);
const relativePath = getRelativePath('fabricacion', nombreArchivo);

// Leer etiqueta
const absolutePath = getAbsolutePath(pedido.etiquetaPath);
```

### Instalaciones:
```javascript
// Guardar fotos
await ensureUploadDirectory('instalaciones');
const fotoPath = getUploadPath('instalaciones', `foto-${instalacionId}-${index}.jpg`);
const relativePath = getRelativePath('instalaciones', nombreArchivo);

// Leer foto
const absolutePath = getAbsolutePath(instalacion.fotos[0]);
```

### Proyectos:
```javascript
// Guardar documentos
await ensureUploadDirectory('proyectos');
const docPath = getUploadPath('proyectos', `contrato-${proyectoId}.pdf`);
const relativePath = getRelativePath('proyectos', nombreArchivo);

// Leer documento
const absolutePath = getAbsolutePath(proyecto.contratoPath);
```

---

## ⚠️ ERRORES COMUNES A EVITAR

### ❌ Error 1: Construcción manual de rutas
```javascript
// ❌ NO HACER ESTO
const path = require('path');
const pdfPath = path.join(__dirname, '../..', cotizacion.pdfPath);
```

**Solución:**
```javascript
// ✅ HACER ESTO
const { getAbsolutePath } = require('../utils/pathHelper');
const pdfPath = getAbsolutePath(cotizacion.pdfPath);
```

---

### ❌ Error 2: Guardar ruta absoluta en BD
```javascript
// ❌ NO HACER ESTO
cotizacion.pdfPath = 'C:\\Users\\...\\server\\uploads\\cotizaciones\\archivo.pdf';
```

**Solución:**
```javascript
// ✅ HACER ESTO
const { getRelativePath } = require('../utils/pathHelper');
cotizacion.pdfPath = getRelativePath('cotizaciones', nombreArchivo);
```

---

### ❌ Error 3: No verificar existencia antes de leer
```javascript
// ❌ NO HACER ESTO
const pdfBuffer = await fs.readFile(pdfPath); // Puede fallar con ENOENT
```

**Solución:**
```javascript
// ✅ HACER ESTO
const { fileExists } = require('../utils/pathHelper');
if (await fileExists(pdfPath)) {
  const pdfBuffer = await fs.readFile(pdfPath);
} else {
  // Regenerar o manejar error
}
```

---

### ❌ Error 4: No crear directorio antes de guardar
```javascript
// ❌ NO HACER ESTO
await fs.writeFile(rutaCompleta, buffer); // Puede fallar si el directorio no existe
```

**Solución:**
```javascript
// ✅ HACER ESTO
const { ensureUploadDirectory } = require('../utils/pathHelper');
await ensureUploadDirectory('cotizaciones');
await fs.writeFile(rutaCompleta, buffer);
```

---

## 🧪 TESTING

### Verificar que pathHelper funciona:

```javascript
// server/tests/utils/pathHelper.test.js
const { 
  getAbsolutePath, 
  getUploadPath, 
  getRelativePath 
} = require('../../utils/pathHelper');

describe('pathHelper', () => {
  test('getAbsolutePath construye ruta correcta', () => {
    const relativePath = '/uploads/cotizaciones/test.pdf';
    const absolutePath = getAbsolutePath(relativePath);
    
    expect(absolutePath).toContain('server\\uploads\\cotizaciones\\test.pdf');
  });

  test('getRelativePath construye ruta correcta', () => {
    const relativePath = getRelativePath('cotizaciones', 'test.pdf');
    
    expect(relativePath).toBe('/uploads/cotizaciones/test.pdf');
  });
});
```

---

## 📊 CHECKLIST DE IMPLEMENTACIÓN

Cuando trabajes con archivos, verifica:

- [ ] Importar pathHelper al inicio del archivo
- [ ] Usar `getAbsolutePath()` para leer archivos
- [ ] Usar `getUploadPath()` para guardar archivos
- [ ] Usar `getRelativePath()` para guardar en BD
- [ ] Usar `ensureUploadDirectory()` antes de guardar
- [ ] Usar `fileExists()` antes de leer
- [ ] Agregar logs con rutas completas
- [ ] Manejar errores de archivos no encontrados

---

## 🔗 ARCHIVOS RELACIONADOS

- `server/utils/pathHelper.js` - Utilidad principal
- `server/routes/cotizaciones.js` - Ejemplo de uso
- `docs/SOLUCION_PDF_REGENERACION.md` - Problema que resolvió

---

**Estado:** ✅ LISTO PARA USAR  
**Mantenedor:** Sistema Sundeck  
**Última actualización:** 13 Nov 2025
