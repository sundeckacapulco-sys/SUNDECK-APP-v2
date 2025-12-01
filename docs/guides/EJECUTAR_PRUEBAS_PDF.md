# 🧪 EJECUTAR PRUEBAS DE DEBUG - PDF REGENERACIÓN

**LEER PRIMERO ESTE ARCHIVO** ⬅️ EMPEZAR AQUÍ

---

## ⚡ RESUMEN RÁPIDO (30 segundos)

**Problema:** PDF se regenera cada vez que abres el visor  
**Solución:** Logs implementados para diagnosticar  
**Acción:** Ejecutar pruebas y capturar logs  
**Tiempo:** 10-15 minutos

---

## 📋 CHECKLIST DE PRUEBA

### ☑️ PASO 1: Reiniciar Servidor (1 min)

```powershell
# Detener servidor actual
Stop-Process -Name node -Force

# Iniciar servidor con logs visibles
npm run server
```

**✅ Verificar:** Consola muestra "Servidor corriendo en puerto 5001"

---

### ☑️ PASO 2: Abrir Visor 3 Veces (5 min)

#### Primera Apertura
1. Ir a: `http://localhost:3000/cotizaciones/69152a4d91f868b9f75a337b`
2. Esperar a que cargue el PDF
3. **CAPTURAR LOGS** de la consola del servidor
4. Buscar: `=== INICIO ENDPOINT PDF ===`

#### Segunda Apertura
1. Cerrar el visor (botón "Volver")
2. Volver a abrir la misma cotización
3. **CAPTURAR LOGS** nuevamente
4. Comparar con la primera apertura

#### Tercera Apertura
1. Cerrar el visor
2. Volver a abrir la misma cotización
3. **CAPTURAR LOGS** por tercera vez
4. Comparar con las dos anteriores

---

### ☑️ PASO 3: Probar Endpoint de Debug (2 min)

**Opción A: Desde el navegador**

Abrir en una nueva pestaña:
```
http://localhost:5001/api/cotizaciones/69152a4d91f868b9f75a337b/debug-pdf
```

**Opción B: Desde PowerShell**

```powershell
# Obtener token de autenticación (si no lo tienes)
# Luego ejecutar:
Invoke-RestMethod -Uri "http://localhost:5001/api/cotizaciones/69152a4d91f868b9f75a337b/debug-pdf" -Headers @{ Authorization = "Bearer TU_TOKEN" }
```

**✅ Verificar:** Respuesta JSON con información del PDF

---

### ☑️ PASO 4: Analizar Resultados (5 min)

#### ¿Qué buscar en los logs?

**ESCENARIO A: PDF se lee correctamente (ESPERADO en 2da y 3ra apertura)**
```
=== INICIO ENDPOINT PDF ===
Estado de pdfPath en BD { tienePdfPath: true, pdfPath: '/uploads/...' }
✅ RAMA: Leer PDF guardado
Intentando leer archivo del disco
✅ Archivo existe en disco
✅ PDF leído exitosamente del disco { tamañoBytes: 163002 }
=== FIN ENDPOINT PDF (archivo guardado) ===
```

**ESCENARIO B: PDF se regenera (PROBLEMA)**
```
=== INICIO ENDPOINT PDF ===
Estado de pdfPath en BD { tienePdfPath: false, pdfPath: null }
❌ RAMA: Generar PDF nuevo (pdfPath vacío o null)
🔄 Iniciando generación de PDF nuevo
```

**ESCENARIO C: Error al leer archivo**
```
✅ RAMA: Leer PDF guardado
Intentando leer archivo del disco
❌ ERROR al leer PDF guardado { errorCode: 'ENOENT' }
```

---

## 🎯 RESULTADO ESPERADO

### Primera Apertura:
- ✅ Genera PDF nuevo (normal)
- ✅ Guarda en disco
- ✅ Actualiza `pdfPath` en BD

### Segunda y Tercera Apertura:
- ✅ Lee PDF del disco
- ✅ NO regenera
- ✅ Logs muestran "PDF leído exitosamente"

---

## 🚨 SI HAY PROBLEMAS

### Problema: Siempre regenera PDF

**Capturar:**
1. Logs completos de las 3 aperturas
2. Respuesta del endpoint `/debug-pdf`

**Buscar en los logs:**
- ¿`tienePdfPath` es `true` o `false`?
- ¿`pdfPath` tiene valor o es `null`?
- ¿Hay algún error al leer el archivo?

### Problema: Error al leer archivo

**Verificar:**
1. ¿El archivo existe en disco?
   ```powershell
   Test-Path "server\uploads\cotizaciones\COT-2025-0007-*.pdf"
   ```

2. ¿Hay permisos de lectura?
   ```powershell
   Get-Acl "server\uploads\cotizaciones"
   ```

---

## 📊 FORMATO DE REPORTE

**Copiar y llenar:**

```
=== REPORTE DE PRUEBAS PDF ===

FECHA: 13 Nov 2025
HORA: [hora de prueba]
COTIZACIÓN ID: 69152a4d91f868b9f75a337b

--- PRIMERA APERTURA ---
¿Generó PDF nuevo? [Sí/No]
¿Guardó en disco? [Sí/No]
¿Actualizó pdfPath? [Sí/No]
Logs: [copiar logs relevantes]

--- SEGUNDA APERTURA ---
¿Leyó PDF guardado? [Sí/No]
¿Regeneró PDF? [Sí/No]
Logs: [copiar logs relevantes]

--- TERCERA APERTURA ---
¿Leyó PDF guardado? [Sí/No]
¿Regeneró PDF? [Sí/No]
Logs: [copiar logs relevantes]

--- ENDPOINT DEBUG ---
pdfPath.valorBooleano: [true/false]
archivo.existe: [true/false]
archivo.error: [null/error]
JSON completo: [copiar respuesta]

--- CONCLUSIÓN ---
Escenario identificado: [A/B/C]
Causa probable: [descripción]
```

---

## 🔗 DOCUMENTACIÓN COMPLETA

Para más detalles, ver:
- `docs/INSTRUCCIONES_DEBUG_PDF.md` - Guía completa
- `docs/PROBLEMA_PDF_REGENERACION.md` - Análisis del problema
- `docs/RESUMEN_IMPLEMENTACION_DEBUG_PDF.md` - Resumen técnico

---

## ⏱️ TIEMPO ESTIMADO

- Reiniciar servidor: 1 min
- Abrir visor 3 veces: 5 min
- Endpoint debug: 2 min
- Analizar resultados: 5 min
- **TOTAL: 13 minutos**

---

**ESTADO:** ✅ Listo para ejecutar  
**SIGUIENTE PASO:** Reiniciar servidor y empezar pruebas  
**OBJETIVO:** Identificar por qué se regenera el PDF
