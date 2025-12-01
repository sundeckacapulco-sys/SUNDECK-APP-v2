# 📊 ANÁLISIS: FLUJO COTIZACIÓN → PROYECTO

**Fecha:** 13 Nov 2025  
**Situación:** Usuario aprobó cotización pero no pidió anticipo y tuvo que ir al inicio para convertir a proyecto

---

## 🔍 FLUJO ACTUAL DETECTADO

### 1️⃣ **APROBAR COTIZACIÓN**

**Ubicación:** `server/controllers/cotizacionController.js` línea 277

**Qué hace:**
```javascript
exports.aprobarCotizacion = async (req, res) => {
  // 1. Busca la cotización
  const cotizacion = await Cotizacion.findById(id);
  
  // 2. Cambia estado a 'aprobada'
  cotizacion.estado = 'aprobada';
  cotizacion.fechaRespuesta = new Date();
  await cotizacion.save();
  
  // 3. Actualiza prospecto a etapa 'pedido'
  await Prospecto.findByIdAndUpdate(cotizacion.prospecto._id, {
    etapa: 'pedido',
    fechaUltimoContacto: new Date()
  });
  
  // 4. Calcula anticipo (60% por defecto)
  const anticipoMonto = (cotizacion.total || 0) * 0.6;
  
  // 5. Emite evento 'cotizacion.aprobada'
  await eventBus.emit('cotizacion.aprobada', eventoCotizacion);
  
  // 6. Retorna cotización aprobada
  return res.json({ message: 'Cotización aprobada', cotizacion });
}
```

**❌ PROBLEMA:**
- **NO pide monto de anticipo al usuario**
- Calcula automáticamente 60%
- NO crea proyecto automáticamente
- Solo cambia estado y emite evento

---

### 2️⃣ **CONVERTIR A PROYECTO**

**Ubicación:** `server/routes/proyectos.js` línea 83

**Endpoint:** `POST /api/proyectos/:id/convertir`

**Qué hace:**
```javascript
router.post('/:id/convertir',
  auth,
  verificarPermiso('proyectos', 'editar'),
  convertirProspectoAProyecto
);
```

**Frontend:** `client/src/modules/proyectos/components/TablaComercial.jsx` línea 116

```javascript
const handleConvertir = async (id) => {
  if (!window.confirm('¿Estás seguro de convertir este prospecto a proyecto?')) {
    return;
  }
  
  const response = await axiosConfig.post(`/proyectos/${id}/convertir`);
  showSnackbar('Prospecto convertido a proyecto exitosamente', 'success');
}
```

**❌ PROBLEMA:**
- Se ejecuta desde el **Dashboard Comercial** (inicio)
- NO está integrado con el flujo de aprobar cotización
- Usuario tiene que ir manualmente al inicio

---

## 🚨 PROBLEMAS IDENTIFICADOS

### **Problema 1: Flujo Desconectado**
```
Usuario aprueba cotización → Estado cambia a 'aprobada'
                          ↓
                    ¿Y ahora qué?
                          ↓
              Usuario va al inicio
                          ↓
         Busca el proyecto en la tabla
                          ↓
        Click en "Convertir a Proyecto"
```

### **Problema 2: NO Pide Anticipo**
- Cuando apruebas cotización, NO hay modal/formulario para:
  - ✅ Monto del anticipo
  - ✅ Método de pago
  - ✅ Fecha de pago
  - ✅ Referencia/comprobante

### **Problema 3: Cotización Desaparece**
- Después de aprobar, la cotización:
  - ❌ NO se muestra en la vista de cotizaciones del proyecto
  - ❌ NO tiene botón "Convertir a Proyecto" visible
  - ❌ Usuario no sabe qué hacer después

---

## ✅ FLUJO ESPERADO (IDEAL)

### **Opción A: Flujo Integrado**
```
1. Usuario aprueba cotización
   ↓
2. Modal aparece: "Registrar Anticipo"
   - Monto (default 60%)
   - Método de pago
   - Fecha de pago
   - Referencia
   - Comprobante (opcional)
   ↓
3. Al guardar anticipo:
   - Crea proyecto automáticamente
   - Asocia cotización al proyecto
   - Cambia estado a 'En Fabricación'
   - Redirige a vista del proyecto
```

### **Opción B: Flujo con Botón Visible**
```
1. Usuario aprueba cotización
   ↓
2. Cotización muestra estado "Aprobada"
   ↓
3. Aparece botón: "Convertir a Proyecto"
   (visible en la misma vista de cotizaciones)
   ↓
4. Click en botón → Modal de anticipo
   ↓
5. Al guardar → Crea proyecto y redirige
```

---

## 📍 UBICACIONES CLAVE EN EL CÓDIGO

### **Backend:**
- `server/controllers/cotizacionController.js:277` - `aprobarCotizacion()`
- `server/controllers/proyectoController.js` - `convertirProspectoAProyecto()`
- `server/routes/cotizaciones.js:889` - Ruta PUT `/:id/aprobar`
- `server/routes/proyectos.js:83` - Ruta POST `/:id/convertir`

### **Frontend:**
- `client/src/modules/proyectos/components/CotizacionTab.jsx` - Vista de cotizaciones
- `client/src/modules/proyectos/components/TablaComercial.jsx:116` - Botón convertir
- `client/src/modules/proyectos/ProyectoDetail.jsx:608` - Estado "aprobado"

---

## 🎯 RECOMENDACIONES

### **Inmediato (Quick Fix):**
1. Agregar botón "Convertir a Proyecto" en `CotizacionTab.jsx`
2. Mostrar solo cuando `cotizacion.estado === 'aprobada'`
3. Al hacer click, abrir modal para registrar anticipo
4. Después de guardar anticipo, llamar a `/proyectos/:id/convertir`

### **Mediano Plazo (Mejora):**
1. Modificar `aprobarCotizacion()` para que pida anticipo
2. Crear proyecto automáticamente después de registrar anticipo
3. Redirigir al usuario a la vista del proyecto nuevo

### **Largo Plazo (Ideal):**
1. Unificar flujo completo: Cotización → Anticipo → Proyecto
2. Wizard de 3 pasos con progreso visual
3. Validaciones y confirmaciones en cada paso

---

## 📝 NOTAS ADICIONALES

- El evento `cotizacion.aprobada` se emite pero no crea proyecto
- El anticipo se calcula pero no se registra en ningún lado
- El prospecto cambia a etapa 'pedido' pero no se crea el pedido
- Hay desconexión entre aprobar cotización y crear proyecto

---

**Estado:** ⚠️ FLUJO INCOMPLETO - Requiere integración

---

## 🧭 SIGUIENTES PASOS ACCIONABLES

1. **Diseñar modal de anticipo conectado al endpoint de aprobación:**
   - Archivo objetivo: `client/src/modules/proyectos/components/CotizacionTab.jsx`.
   - Mostrar formulario con monto, método, fecha y referencia apenas se apruebe la cotización.
2. **Encadenar creación de proyecto sin salir de la vista:**
   - Reutilizar `convertirProspectoAProyecto` desde el mismo flujo, actualizando `cotizacionController.aprobarCotizacion` para devolver IDs necesarios.
3. **Registrar logs de auditoría en cada paso:**
   - Usar `logger.info` para dejar rastro de la conversión y validar que no se duplique el proyecto ni se pierda el `pdfPath` recién instrumentado.
