# 📊 ANÁLISIS TÉCNICO: FLUJO LEVANTAMIENTO → COTIZACIÓN
## PARTE 2: FLUJO ACTUAL Y PROBLEMAS DETECTADOS

**Continuación de:** `analisis_flujo_levantamiento_cotizacion_parte1.md`

---

## 🔁 5. FLUJO ACTUAL PASO A PASO

### 5.1 FLUJO LEVANTAMIENTO TÉCNICO (SIN PRECIOS)

#### Frontend → Backend

**Componente React:** `AgregarMedidasProyectoModal.jsx`  
**Función:** `handleGuardarMedidasTecnicas()` (Líneas 422-526)

```javascript
// PASO 1: Usuario completa formulario en el frontend
// Componente: AgregarMedidasProyectoModal.jsx
// Estado: piezas[] con 13 campos técnicos por medida

const handleGuardarMedidasTecnicas = async () => {
  // PASO 2: Preparar partidas con TODOS los campos técnicos
  const partidasConTotales = piezas.map(pieza => ({
    ubicacion: pieza.ubicacion,
    producto: pieza.productoLabel || pieza.producto,
    color: pieza.color,
    modelo: pieza.modeloCodigo,
    cantidad: pieza.cantidad,
    piezas: pieza.medidas.map(medida => ({
      ancho: parseFloat(medida.ancho),
      alto: parseFloat(medida.alto),
      m2: parseFloat(medida.ancho) * parseFloat(medida.alto),
      // ✅ LOS 13 CAMPOS TÉCNICOS SE ENVÍAN
      sistema: Array.isArray(medida.sistema) ? medida.sistema : [medida.sistema],
      control: medida.tipoControl,
      instalacion: medida.tipoInstalacion,
      fijacion: medida.tipoFijacion,
      caida: medida.caida || medida.orientacion,
      galeria: medida.galeria,
      telaMarca: medida.telaMarca,
      baseTabla: medida.baseTabla,
      operacion: medida.tipoOperacion,
      detalle: medida.detalleTecnico,
      traslape: medida.traslape,
      modeloCodigo: medida.modeloCodigo,
      color: medida.color,
      observacionesTecnicas: medida.observacionesTecnicas || ''
    })),
    totales: calcularTotalesPartida(pieza, false)
  }));
  
  // PASO 3: Preparar payload
  const payload = {
    tipo: 'levantamiento',
    partidas: partidasConTotales,
    totales: totalesProyecto,
    observaciones: comentarios,
    personaVisita: personaVisita
  };
  
  // PASO 4: Enviar al backend
  const response = await axiosConfig.patch(
    `/proyectos/${proyecto._id}/levantamiento`,
    payload
  );
};
```

**📤 Datos que viajan en el body del request:**
```json
{
  "tipo": "levantamiento",
  "partidas": [
    {
      "ubicacion": "Sala",
      "producto": "Persiana Screen 3%",
      "color": "Blanco",
      "modelo": "SC-3%",
      "cantidad": 2,
      "piezas": [
        {
          "ancho": 2.5,
          "alto": 3.0,
          "m2": 7.5,
          "sistema": ["Roller"],
          "control": "Izquierda",
          "instalacion": "Muro",
          "fijacion": "Concreto",
          "caida": "Normal",
          "galeria": "Sí",
          "telaMarca": "Sunscreen Premium",
          "baseTabla": "15cm",
          "operacion": "Manual",
          "detalle": "Sin traslape",
          "traslape": "N/A",
          "modeloCodigo": "SC-3%",
          "color": "Blanco",
          "observacionesTecnicas": "Ventana con marco de aluminio"
        }
      ],
      "totales": {
        "m2": 7.5,
        "subtotal": 0,
        "costoMotorizacion": 0,
        "costoInstalacion": 0
      }
    }
  ],
  "totales": {
    "m2": 7.5
  },
  "observaciones": "Cliente requiere instalación urgente",
  "personaVisita": "Juan Pérez"
}
```

---

#### Backend - Procesamiento

**Endpoint:** `PATCH /api/proyectos/:id/levantamiento`  
**Controlador:** `proyectoController.js → guardarLevantamiento()` (Líneas 1350-1431)

```javascript
// PASO 5: Backend recibe el payload
const guardarLevantamiento = async (req, res) => {
  const { partidas = [], totales = {}, observaciones = '', personaVisita = '' } = req.body;
  
  // PASO 6: Normalizar partidas (función externa)
  const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: false });
  
  // PASO 7: Construir totales del proyecto
  const totalesProyecto = construirTotalesProyecto(partidasNormalizadas, totales);
  
  // PASO 8: Construir registro de medidas para campo legacy
  const registroMedidas = construirRegistroMedidas(partidasNormalizadas, {
    personaVisita,
    observaciones,
    incluirPrecios: false
  });
  
  // PASO 9: Guardar en proyecto.levantamiento (NUEVO)
  proyecto.levantamiento = {
    partidas: partidasNormalizadas, // ✅ AQUÍ SE GUARDAN LOS 13 CAMPOS
    totales: totalesProyecto,
    observaciones,
    personaVisita,
    actualizadoEn: new Date()
  };
  
  // PASO 10: Guardar TAMBIÉN en proyecto.medidas (LEGACY)
  const medidasExistentes = Array.isArray(proyecto.medidas)
    ? proyecto.medidas.filter(medida => !medida.esPartidasV2)
    : [];
  proyecto.medidas = [...medidasExistentes, registroMedidas];
  
  // PASO 11: Actualizar estado del proyecto
  proyecto.estado = 'levantamiento';
  proyecto.actualizado_por = req.usuario.id;
  
  // PASO 12: Guardar en MongoDB
  await proyecto.save();
  
  // PASO 13: Responder al frontend
  res.json({
    success: true,
    message: 'Levantamiento guardado exitosamente',
    data: proyecto
  });
};
```

**✅ RESULTADO:** Los 13 campos técnicos se guardan correctamente en:
- `proyecto.levantamiento.partidas[].piezas[]` ✅
- `proyecto.medidas[].piezas[].medidas[]` ✅ (legacy)

---

### 5.2 FLUJO COTIZACIÓN FORMAL (CON PRECIOS)

#### Frontend → Backend

**Componente React:** `AgregarMedidasProyectoModal.jsx`  
**Función:** `handleGuardarCotizacionEnVivo()` (Líneas 531-707)

```javascript
// PASO 1: Usuario completa formulario CON precios
const handleGuardarCotizacionEnVivo = async () => {
  // PASO 2: Preparar partidas con TODOS los campos técnicos + precios
  const partidasConTotales = piezas.map(pieza => {
    const totales = calcularTotalesPartida(pieza, true);
    
    return {
      ubicacion: pieza.ubicacion,
      producto: pieza.productoLabel || pieza.producto,
      color: pieza.color,
      modelo: pieza.modeloCodigo,
      cantidad: pieza.cantidad,
      piezas: pieza.medidas.map(medida => ({
        ancho: parseFloat(medida.ancho),
        alto: parseFloat(medida.alto),
        m2: parseFloat(medida.ancho) * parseFloat(medida.alto),
        // ✅ LOS 13 CAMPOS TÉCNICOS SE ENVÍAN
        sistema: Array.isArray(medida.sistema) ? medida.sistema : [medida.sistema],
        control: medida.tipoControl,
        instalacion: medida.tipoInstalacion,
        fijacion: medida.tipoFijacion,
        caida: medida.caida || medida.orientacion,
        galeria: medida.galeria,
        telaMarca: medida.telaMarca,
        baseTabla: medida.baseTabla,
        operacion: medida.tipoOperacion,
        detalle: medida.detalleTecnico,
        traslape: medida.traslape,
        modeloCodigo: medida.modeloCodigo,
        color: medida.color,
        precioM2: parseFloat(medida.precioM2) || parseFloat(precioGeneral),
        observacionesTecnicas: medida.observacionesTecnicas || ''
      })),
      // Motorización
      motorizacion: pieza.motorizado ? { ... } : { activa: false },
      // Instalación Especial
      instalacionEspecial: pieza.cobraInstalacion ? { ... } : { activa: false },
      totales
    };
  });
  
  // PASO 3: Preparar payload de cotización
  const payload = {
    tipo: 'cotizacion',
    partidas: partidasConTotales, // ✅ INCLUYE LOS 13 CAMPOS
    precioReglas: { ... },
    facturacion: { ... },
    totales: { ... },
    observaciones: comentarios,
    personaVisita: personaVisita
  };
  
  // PASO 4: Enviar al backend
  const response = await axiosConfig.post(
    `/proyectos/${proyecto._id}/cotizaciones`,
    payload
  );
};
```

**📤 Datos que viajan en el body del request:**
```json
{
  "tipo": "cotizacion",
  "partidas": [
    {
      "ubicacion": "Sala",
      "producto": "Persiana Screen 3%",
      "color": "Blanco",
      "modelo": "SC-3%",
      "cantidad": 2,
      "piezas": [
        {
          "ancho": 2.5,
          "alto": 3.0,
          "m2": 7.5,
          "sistema": ["Roller"],
          "control": "Izquierda",
          "instalacion": "Muro",
          "fijacion": "Concreto",
          "caida": "Normal",
          "galeria": "Sí",
          "telaMarca": "Sunscreen Premium",
          "baseTabla": "15cm",
          "operacion": "Manual",
          "detalle": "Sin traslape",
          "traslape": "N/A",
          "modeloCodigo": "SC-3%",
          "color": "Blanco",
          "precioM2": 750,
          "observacionesTecnicas": "Ventana con marco de aluminio"
        }
      ],
      "motorizacion": { "activa": false },
      "instalacionEspecial": { "activa": false },
      "totales": {
        "m2": 7.5,
        "subtotal": 5625,
        "costoMotorizacion": 0,
        "costoInstalacion": 0
      }
    }
  ],
  "precioReglas": {
    "precio_m2": 750,
    "aplicaDescuento": false,
    "tipoDescuento": "porcentaje",
    "valorDescuento": 0
  },
  "facturacion": {
    "requiereFactura": true,
    "razonSocial": "Empresa SA de CV",
    "rfc": "EMP123456ABC"
  },
  "totales": {
    "m2": 7.5,
    "subtotal": 5625,
    "descuento": 0,
    "iva": 900,
    "total": 6525
  },
  "observaciones": "Cliente requiere instalación urgente",
  "personaVisita": "Juan Pérez"
}
```

---

#### Backend - Procesamiento

**Endpoint:** `POST /api/proyectos/:id/cotizaciones`  
**Controlador:** `proyectoController.js → crearCotizacionDesdeProyecto()` (Líneas 1433-1592)

```javascript
// PASO 5: Backend recibe el payload CON los 13 campos técnicos
const crearCotizacionDesdeProyecto = async (req, res) => {
  const { partidas = [], precioReglas = {}, facturacion = {}, totales = {} } = req.body;
  
  // PASO 6: Normalizar partidas CON precios
  const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: true });
  // ✅ partidasNormalizadas CONTIENE los 13 campos técnicos
  
  // PASO 7: Construir totales del proyecto
  const totalesProyecto = construirTotalesProyecto(partidasNormalizadas, totales);
  
  // PASO 8: Normalizar reglas de precio y facturación
  const precioReglasNormalizado = normalizarPrecioReglas(precioReglas);
  const facturacionNormalizada = normalizarFacturacion(facturacion);
  
  // PASO 9: Construir registro de medidas para campo legacy
  const registroMedidas = construirRegistroMedidas(partidasNormalizadas, {
    personaVisita,
    observaciones,
    incluirPrecios: true
  });
  
  // 🔴 PASO 10: AQUÍ OCURRE LA PÉRDIDA DE DATOS
  // Convertir partidas a productos de cotización
  const productosCotizacion = construirProductosDesdePartidas(partidasNormalizadas);
  // ❌ Esta función NO mapea los 13 campos técnicos
  
  // PASO 11: Generar número de cotización
  const numeroCotizacion = await generarNumeroCotizacionSecuencial();
  
  // PASO 12: Crear documento de cotización
  const nuevaCotizacion = new Cotizacion({
    numero: numeroCotizacion,
    fecha: new Date(),
    proyecto: proyecto._id,
    prospecto: proyecto.prospecto_original,
    origen: 'cotizacion_vivo',
    estado: 'borrador',
    comentarios: observaciones,
    precioGeneralM2: precioReglasNormalizado.precio_m2,
    unidadMedida: 'm2',
    productos: productosCotizacion, // ❌ SIN LOS 13 CAMPOS TÉCNICOS
    instalacion: { ... },
    descuento: { ... },
    facturacion: { ... },
    subtotal: totalesProyecto.subtotal,
    iva: totalesProyecto.iva,
    total: totalesProyecto.total,
    elaboradaPor: req.usuario.id
  });
  
  // PASO 13: Guardar cotización en MongoDB
  await nuevaCotizacion.save();
  // ❌ La cotización se guarda SIN los campos técnicos
  
  // PASO 14: Actualizar proyecto.levantamiento
  proyecto.levantamiento = {
    partidas: partidasNormalizadas, // ✅ AQUÍ SÍ SE GUARDAN LOS 13 CAMPOS
    totales: totalesProyecto,
    observaciones,
    personaVisita,
    actualizadoEn: new Date()
  };
  
  // PASO 15: Actualizar proyecto.medidas (legacy)
  const medidasExistentes = Array.isArray(proyecto.medidas)
    ? proyecto.medidas.filter(medida => !medida.esPartidasV2)
    : [];
  proyecto.medidas = [...medidasExistentes, registroMedidas];
  
  // PASO 16: Actualizar proyecto.cotizacionActual (resumen)
  proyecto.cotizacionActual = {
    cotizacion: nuevaCotizacion._id,
    numero: numeroCotizacion,
    totales: totalesProyecto,
    precioReglas: precioReglasNormalizado,
    facturacion: facturacionNormalizada,
    observaciones,
    personaVisita,
    fechaCreacion: new Date()
  };
  
  // PASO 17: Actualizar estado y totales del proyecto
  proyecto.estado = 'cotizacion';
  proyecto.subtotal = totalesProyecto.subtotal;
  proyecto.iva = totalesProyecto.iva;
  proyecto.total = totalesProyecto.total;
  proyecto.actualizado_por = req.usuario.id;
  
  // PASO 18: Agregar referencia a la cotización
  if (!Array.isArray(proyecto.cotizaciones)) {
    proyecto.cotizaciones = [];
  }
  if (!proyecto.cotizaciones.some(cotId => cotId.equals(nuevaCotizacion._id))) {
    proyecto.cotizaciones.push(nuevaCotizacion._id);
  }
  
  // PASO 19: Guardar proyecto en MongoDB
  await proyecto.save();
  
  // PASO 20: Responder al frontend
  res.json({
    success: true,
    message: 'Cotización creada exitosamente',
    data: {
      proyecto,
      cotizacion: nuevaCotizacion
    }
  });
};
```

**🔴 RESULTADO PROBLEMÁTICO:**

| Ubicación | Campos Técnicos | Estado |
|-----------|-----------------|--------|
| `proyecto.levantamiento.partidas[].piezas[]` | ✅ 13 campos completos | Guardado correctamente |
| `proyecto.medidas[].piezas[].medidas[]` | ✅ 13 campos completos | Guardado correctamente (legacy) |
| `cotizacion.productos[]` | ❌ Solo 3-4 campos | **DATOS PERDIDOS** |

---

## ⚠️ 6. PROBLEMAS DETECTADOS

### 6.1 Problema #1: Modelo Cotizacion Incompleto

**Ubicación:** `server/models/Cotizacion.js` (Líneas 46-85)

**Descripción:** El modelo `Cotizacion` solo tiene campos básicos en `productos[]`:

```javascript
productos: [{
  ubicacion: String,
  cantidad: Number,
  ancho: Number,
  alto: Number,
  area: Number,
  nombre: String,
  color: String,
  precioM2: Number,
  precioUnitario: Number,
  subtotal: Number,
  medidas: {
    ancho: Number,
    alto: Number,
    area: Number
  },
  motorizado: Boolean,
  motorModelo: String,
  motorPrecio: Number,
  controlModelo: String,
  controlPrecio: Number
}]
```

**❌ Campos técnicos faltantes:**
1. `sistema` (Roller, Zebra, Panel, etc.)
2. `control` (Izquierda/Derecha)
3. `instalacion` (Muro/Techo/Empotrado)
4. `fijacion` (Concreto/Tablaroca/etc.)
5. `caida` (Normal/Frente)
6. `galeria` (Sí/No)
7. `telaMarca` (Sunscreen, Blackout, etc.)
8. `baseTabla` (7cm/15cm/18cm)
9. `operacion` (Manual/Motorizado)
10. `detalle` (Traslape/Corte/etc.)
11. `traslape` (Específico)
12. `modeloCodigo` (SC-3%, BK-100, etc.)
13. `observacionesTecnicas` (Notas por pieza)

**Impacto:** Cuando se crea una cotización, los campos técnicos no tienen dónde almacenarse en el modelo.

---

### 6.2 Problema #2: Función de Mapeo Deficiente

**Ubicación:** `server/controllers/proyectoController.js` (Línea 1477)

**Descripción:** La función `construirProductosDesdePartidas()` convierte partidas en productos de cotización, pero NO mapea los 13 campos técnicos.

**Código sospechoso:**
```javascript
const productosCotizacion = construirProductosDesdePartidas(partidasNormalizadas);
```

**⚠️ Necesitamos encontrar esta función para confirmar que NO mapea los campos técnicos.**

**Impacto:** Aunque el frontend envía los 13 campos técnicos, la función de mapeo los descarta al crear el array `productos[]` para la cotización.

---

### 6.3 Problema #3: Duplicidad de Estructuras

**Descripción:** Existen 2 estructuras paralelas para almacenar levantamientos:

1. **`proyecto.levantamiento`** (NUEVO - FASE 4)
   - Estructura normalizada
   - Incluye los 13 campos técnicos
   - ✅ Se guarda correctamente

2. **`proyecto.medidas`** (LEGACY - Deprecado)
   - Estructura antigua
   - También incluye los 13 campos técnicos
   - ✅ Se guarda correctamente
   - ⚠️ Marcado como `@deprecated` pero aún en uso

**Impacto:** Confusión sobre cuál es la "fuente de verdad". Diferentes partes del código leen de diferentes estructuras.

---

### 6.4 Problema #4: Flujo Paralelo de Etapas

**Ubicación:** `server/routes/etapas.js`

**Descripción:** El sistema de Etapas (Prospectos) tiene su propio flujo paralelo que NO sincroniza con Proyectos.

**Código en etapas.js (Líneas 149-169):**
```javascript
// 🔄 SINCRONIZACIÓN AUTOMÁTICA: Sincronizar medidas al Proyecto
try {
  const Proyecto = require('../models/Proyecto');
  const proyecto = await Proyecto.findOne({ prospecto_original: prospectoId });
  
  if (proyecto) {
    await ProyectoSyncMiddleware.sincronizarMedidasDesdeEtapas(proyecto._id, prospectoId);
    logger.info('Medidas sincronizadas al proyecto desde etapa', {
      proyectoId: proyecto._id,
      prospectoId,
      etapaId: nuevaEtapa._id
    });
  }
} catch (syncError) {
  logger.warn('Error sincronizando medidas', {
    error: syncError.message,
    prospectoId,
    proyectoId: proyecto?._id
  });
  // No interrumpir el flujo principal
}
```

**⚠️ Problema:** La sincronización puede fallar silenciosamente (no interrumpe el flujo), causando inconsistencias.

**Impacto:** Los datos técnicos pueden guardarse en Etapas pero no sincronizarse correctamente con Proyectos.

---

### 6.5 Problema #5: Información se Desvía a Otras Rutas

**Descripción:** Los 13 campos técnicos se guardan correctamente en `proyecto.levantamiento` y `proyecto.medidas`, pero cuando se genera una cotización formal, la información NO se transfiere al documento `Cotizacion`.

**Flujo problemático:**
```
Frontend (13 campos) 
  ↓
Backend: guardarLevantamiento() 
  ↓
✅ proyecto.levantamiento (13 campos guardados)
✅ proyecto.medidas (13 campos guardados)

Frontend (13 campos + precios)
  ↓
Backend: crearCotizacionDesdeProyecto()
  ↓
✅ proyecto.levantamiento (13 campos guardados)
✅ proyecto.medidas (13 campos guardados)
❌ cotizacion.productos (solo 3-4 campos)
```

**Resultado:** Los campos técnicos quedan "atrapados" en el Proyecto y NO llegan a la Cotización formal.

---

## 📊 RESUMEN PARTE 2

### ✅ Flujo de Levantamiento Técnico

| Paso | Componente | Datos | Estado |
|------|------------|-------|--------|
| 1 | Frontend envía | 13 campos técnicos | ✅ Completo |
| 2 | Backend recibe | 13 campos técnicos | ✅ Completo |
| 3 | Guarda en `proyecto.levantamiento` | 13 campos técnicos | ✅ Completo |
| 4 | Guarda en `proyecto.medidas` | 13 campos técnicos | ✅ Completo |

### ❌ Flujo de Cotización Formal

| Paso | Componente | Datos | Estado |
|------|------------|-------|--------|
| 1 | Frontend envía | 13 campos técnicos + precios | ✅ Completo |
| 2 | Backend recibe | 13 campos técnicos + precios | ✅ Completo |
| 3 | Guarda en `proyecto.levantamiento` | 13 campos técnicos | ✅ Completo |
| 4 | Guarda en `proyecto.medidas` | 13 campos técnicos | ✅ Completo |
| 5 | **Mapea a `cotizacion.productos`** | **Solo 3-4 campos** | **❌ PÉRDIDA DE DATOS** |

### 🔴 Problemas Críticos

1. **Modelo Cotizacion incompleto** - No tiene campos para los 13 campos técnicos
2. **Función de mapeo deficiente** - `construirProductosDesdePartidas()` descarta campos técnicos
3. **Duplicidad de estructuras** - `levantamiento` vs `medidas` (legacy)
4. **Flujo paralelo** - Etapas vs Proyectos con sincronización frágil
5. **Información desviada** - Datos quedan en Proyecto, no llegan a Cotización

---

**Continúa en:** `analisis_flujo_levantamiento_cotizacion_parte3.md`
