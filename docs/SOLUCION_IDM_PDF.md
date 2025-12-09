# 🔒 Solución: Evitar que IDM Intercepte PDFs

**Fecha:** 9 Dic 2025  
**Problema:** Internet Download Manager (IDM) intercepta las descargas de PDF antes de que lleguen al visor del navegador.

---

## 📋 Problema Original

Cuando el frontend hacía una petición GET para obtener un PDF:
```javascript
// ❌ IDM INTERCEPTA ESTO
const response = await axiosConfig.get(
  `/fabricacion/orden-taller/${proyecto._id}/pdf`,
  { responseType: 'blob' }
);
```

IDM detectaba el `Content-Type: application/pdf` y capturaba la descarga, impidiendo que el PDF se mostrara en el visor interno.

---

## ✅ Solución Implementada

### 1. Backend: Nuevo Endpoint POST que devuelve JSON con Base64

**Archivo:** `server/controllers/fabricacionController.js`

```javascript
/**
 * Obtener PDF como base64 (evita que IDM intercepte)
 * POST /api/fabricacion/orden-taller/:proyectoId/base64
 */
async function obtenerPDFOrdenTallerBase64(req, res) {
  try {
    const { proyectoId } = req.params;
    
    // Obtener datos y generar PDF
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(datosOrden, datosOrden.listaPedido);
    
    // Convertir a base64
    const base64 = pdfBuffer.toString('base64');
    
    // Devolver como JSON (IDM NO intercepta JSON)
    res.json({
      success: true,
      pdf: base64,
      filename: `Orden-Taller-${datosOrden.proyecto.numero}.pdf`,
      size: pdfBuffer.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generando PDF',
      error: error.message
    });
  }
}
```

**Archivo:** `server/routes/fabricacion.js`

```javascript
// VER PDF como base64 (POST para evitar que IDM intercepte)
router.post('/orden-taller/:proyectoId/base64',
  auth,
  obtenerPDFOrdenTallerBase64
);
```

---

### 2. Frontend: Usar POST y Convertir Base64 a Blob

**Archivo:** `client/src/components/Fabricacion/DashboardFabricacion.jsx`  
**Archivo:** `client/src/modules/fabricacion/TallerKanban.jsx`

```javascript
// ✅ IDM NO INTERCEPTA ESTO
const abrirVisorPDF = async (proyecto) => {
  try {
    setVisorPDF({ open: true, url: null, proyecto, loading: true });
    
    // Usar POST que devuelve JSON con base64
    const response = await axiosConfig.post(
      `/fabricacion/orden-taller/${proyecto._id}/base64`
    );

    if (response.data.success && response.data.pdf) {
      // Convertir base64 a blob URL
      const byteCharacters = atob(response.data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      
      setVisorPDF({ open: true, url, proyecto, loading: false });
    } else {
      throw new Error(response.data.message || 'Error generando PDF');
    }
    
  } catch (error) {
    console.error('Error cargando PDF:', error);
    setError('Error al cargar el PDF');
    setVisorPDF({ open: false, url: null, proyecto: null, loading: false });
  }
};
```

---

## 🔑 ¿Por qué funciona?

| Método | Content-Type | IDM Intercepta |
|--------|--------------|----------------|
| GET `/pdf` | `application/pdf` | ✅ SÍ |
| POST `/base64` | `application/json` | ❌ NO |

IDM está configurado para interceptar descargas de archivos binarios (PDF, ZIP, etc.), pero **NO intercepta respuestas JSON** porque no son archivos descargables.

---

## 📁 Archivos Modificados

### Backend
- `server/controllers/fabricacionController.js` - Nuevo endpoint `obtenerPDFOrdenTallerBase64`
- `server/routes/fabricacion.js` - Nueva ruta POST `/orden-taller/:proyectoId/base64`

### Frontend
- `client/src/components/Fabricacion/DashboardFabricacion.jsx` - Función `abrirVisorOrdenTaller`
- `client/src/modules/fabricacion/TallerKanban.jsx` - Función `abrirOrden`

---

## 🔄 Patrón Reutilizable

Para cualquier PDF que necesite mostrarse en visor sin que IDM intercepte:

### Backend
```javascript
async function obtenerPDFComoBase64(req, res) {
  const pdfBuffer = await generarPDF(...);
  res.json({
    success: true,
    pdf: pdfBuffer.toString('base64'),
    filename: 'documento.pdf'
  });
}
```

### Frontend
```javascript
const response = await axiosConfig.post('/ruta/base64');
if (response.data.success) {
  const byteCharacters = atob(response.data.pdf);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(pdfBlob);
  // Usar url en VisorPDF o iframe
}
```

---

## ⚠️ Consideraciones

1. **Tamaño:** Base64 aumenta el tamaño ~33%. Para PDFs muy grandes (>10MB), considerar alternativas.
2. **Memoria:** El PDF se carga completo en memoria del navegador.
3. **Limpieza:** Siempre llamar `window.URL.revokeObjectURL(url)` al cerrar el visor.

---

## 🧪 Verificación

1. Abrir DevTools → Network
2. Hacer clic en "Ver Orden de Taller"
3. Verificar que la petición sea POST y devuelva JSON
4. El PDF debe mostrarse en el visor sin que IDM aparezca
