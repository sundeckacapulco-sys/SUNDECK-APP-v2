# 📊 ANÁLISIS TÉCNICO: FLUJO LEVANTAMIENTO → COTIZACIÓN
## PARTE 1: RUTAS, ENDPOINTS Y MODELOS

**Fecha de Análisis:** 6 de Noviembre de 2025  
**Sistema:** SUNDECK CRM - Módulo de Proyectos  
**Objetivo:** Identificar por qué los 13 campos técnicos no pasan correctamente del levantamiento a la cotización

---

## 🧭 1. RUTAS Y ENDPOINTS INVOLUCRADOS

### 1.1 Backend - Rutas de Proyectos

**Archivo:** `server/routes/proyectos.js`

| Método | Endpoint | Controlador | Descripción |
|--------|----------|-------------|-------------|
| `PATCH` | `/api/proyectos/:id/levantamiento` | `guardarLevantamiento` | Guarda levantamiento técnico SIN precios |
| `POST` | `/api/proyectos/:id/cotizaciones` | `crearCotizacionDesdeProyecto` | Crea cotización formal CON precios desde proyecto |
| `GET` | `/api/proyectos/:id` | `obtenerProyectoPorId` | Obtiene proyecto completo con levantamiento |
| `GET` | `/api/proyectos/:id/generar-pdf` | `generarPDFProyecto` | Genera PDF del levantamiento |
| `GET` | `/api/proyectos/:id/generar-excel` | `generarExcelLevantamiento` | Genera Excel del levantamiento |
| `POST` | `/proyectos/levantamiento/fotos` | `subirFotosLevantamiento` | Sube fotos del levantamiento |

**Líneas clave en `proyectos.js`:**
```javascript
// Línea 140-145: Endpoint de levantamiento técnico
router.patch('/:id/levantamiento', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  guardarLevantamiento
);

// Línea 147-152: Endpoint de cotización desde proyecto
router.post('/:id/cotizaciones', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  crearCotizacionDesdeProyecto
);
```

---

### 1.2 Backend - Rutas de Etapas (Sistema Legacy)

**Archivo:** `server/routes/etapas.js`

| Método | Endpoint | Controlador | Descripción |
|--------|----------|-------------|-------------|
| `POST` | `/api/etapas` | Handler inline | Crea etapa en Prospecto (sistema antiguo) |
| `POST` | `/api/etapas/levantamiento-pdf` | `generarPDFLevantamiento` | Genera PDF desde etapa |
| `POST` | `/api/etapas/levantamiento-excel` | Handler inline | Genera Excel desde etapa |

**⚠️ PROBLEMA DETECTADO:** Las etapas tienen su propio flujo paralelo que NO sincroniza con Proyectos.

**Líneas clave en `etapas.js`:**
```javascript
// Línea 101-126: CAMPOS TÉCNICOS CRÍTICOS QUE SE GUARDAN EN ETAPAS
sistema: Array.isArray(pieza.sistema) ? pieza.sistema : [],
sistemaEspecial: Array.isArray(pieza.sistemaEspecial) ? pieza.sistemaEspecial : [],
tipoControl: pieza.tipoControl || '',
galeria: pieza.galeria || '',
baseTabla: pieza.baseTabla || '',
orientacion: pieza.orientacion || '',
tipoInstalacion: pieza.tipoInstalacion || '',
eliminacion: pieza.eliminacion || '',
risoAlto: pieza.risoAlto || '',
risoBajo: pieza.risoBajo || '',
telaMarca: pieza.telaMarca || '',
// CAMPOS DE TOLDOS Y MOTORIZACIÓN
esToldo: Boolean(pieza.esToldo),
tipoToldo: pieza.tipoToldo || '',
motorizado: Boolean(pieza.motorizado),
motorModelo: pieza.motorModelo || '',
controlModelo: pieza.controlModelo || ''
```

---

### 1.3 Backend - Rutas de Cotizaciones

**Archivo:** `server/routes/cotizaciones.js`

| Método | Endpoint | Controlador | Descripción |
|--------|----------|-------------|-------------|
| `POST` | `/api/cotizaciones` | `crearCotizacion` | Crea cotización directa |
| `GET` | `/api/cotizaciones/:id` | `obtenerCotizacion` | Obtiene cotización por ID |
| `PUT` | `/api/cotizaciones/:id` | `actualizarCotizacion` | Actualiza cotización existente |

---

## 🗄️ 2. MODELOS DE DATOS

### 2.1 Modelo Proyecto.js

**Archivo:** `server/models/Proyecto.js`

#### 2.1.1 Campo `levantamiento` (FASE 4 - Normalizado)

```javascript
// Líneas 104-187: Estructura del levantamiento técnico
levantamiento: {
  partidas: [{
    ubicacion: String,
    producto: String,
    color: String,
    modelo: String,
    cantidad: Number,
    piezas: [{
      ancho: Number,
      alto: Number,
      m2: Number,
      // ⭐ LOS 13 CAMPOS TÉCNICOS CRÍTICOS
      sistema: String,              // 1. Sistema (Roller, Zebra, Panel, etc.)
      control: String,              // 2. Control (Izquierda/Derecha)
      instalacion: String,          // 3. Tipo de instalación (Muro/Techo/Empotrado)
      fijacion: String,             // 4. Tipo de fijación (Concreto/Tablaroca/etc.)
      caida: String,                // 5. Caída/Orientación
      galeria: String,              // 6. Galería (Sí/No)
      telaMarca: String,            // 7. Tela/Marca
      baseTabla: String,            // 8. Base/Tabla (7cm/15cm/18cm)
      operacion: String,            // 9. Modo de operación (Manual/Motorizado)
      detalle: String,              // 10. Detalle técnico (Traslape/Corte/etc.)
      traslape: String,             // 11. Traslape específico
      modeloCodigo: String,         // 12. Modelo/Código (SC-3%, BK-100, etc.)
      color: String,                // 13. Color específico de la pieza
      observacionesTecnicas: String,
      precioM2: Number
    }],
    motorizacion: {
      activa: Boolean,
      modeloMotor: String,
      precioMotor: Number,
      cantidadMotores: Number,
      modeloControl: String,
      precioControl: Number,
      tipoControl: String,
      piezasPorControl: Number
    },
    instalacionEspecial: {
      activa: Boolean,
      tipoCobro: String,
      precioBase: Number,
      precioPorPieza: Number,
      observaciones: String
    },
    totales: {
      m2: Number,
      subtotal: Number,
      costoMotorizacion: Number,
      costoInstalacion: Number
    }
  }],
  totales: {
    m2: Number,
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  },
  observaciones: String,
  personaVisita: String,
  actualizadoEn: Date
}
```

#### 2.1.2 Campo `cotizacionActual` (Resumen de cotización generada)

```javascript
// Líneas 189-220: Resumen de la última cotización
cotizacionActual: {
  cotizacion: { type: ObjectId, ref: 'Cotizacion' },
  numero: String,
  totales: {
    m2: Number,
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  },
  precioReglas: {
    precio_m2: Number,
    aplicaDescuento: Boolean,
    tipoDescuento: String,
    valorDescuento: Number
  },
  facturacion: {
    requiereFactura: Boolean,
    razonSocial: String,
    rfc: String
  },
  observaciones: String,
  personaVisita: String,
  fechaCreacion: Date
}
```

#### 2.1.3 Campo `medidas` (@deprecated - Compatibilidad)

```javascript
// Líneas 225-302: Campo legacy para compatibilidad
// ⚠️ ESTE CAMPO ESTÁ DEPRECADO PERO AÚN SE USA
medidas: [{
  tipo: String, // 'levantamiento'
  personaVisita: String,
  fechaCotizacion: Date,
  esPartidasV2: Boolean,
  
  piezas: [{
    ubicacion: String,
    cantidad: Number,
    producto: String,
    productoLabel: String,
    modeloCodigo: String,
    color: String,
    
    medidas: [{
      ancho: Number,
      alto: Number,
      // Especificaciones técnicas
      galeria: String,
      tipoControl: String,
      caida: String,
      tipoInstalacion: String,
      tipoFijacion: String,
      modoOperacion: String,
      detalleTecnico: String,
      sistema: String,
      telaMarca: String,
      baseTabla: String,
      observacionesTecnicas: String,
      traslape: String,
      precioM2: Number
    }]
  }],
  
  totales: {
    totalPartidas: Number,
    totalPiezas: Number,
    areaTotal: Number,
    precioTotal: Number
  }
}]
```

**⚠️ DUPLICIDAD CRÍTICA:** Existen 2 estructuras para almacenar levantamientos:
1. `levantamiento` (nuevo, normalizado, FASE 4)
2. `medidas` (legacy, deprecado pero aún en uso)

---

### 2.2 Modelo Cotizacion.js

**Archivo:** `server/models/Cotizacion.js`

```javascript
// Líneas 1-150: Estructura de cotización
{
  prospecto: { type: ObjectId, ref: 'Prospecto' },
  proyecto: { type: ObjectId, ref: 'Proyecto' },
  numero: String,
  fecha: Date,
  estado: String,
  origen: String, // 'levantamiento', 'cotizacion_vivo', 'directa'
  
  productos: [{
    ubicacion: String,
    cantidad: Number,
    ancho: Number,
    alto: Number,
    area: Number,
    nombre: String,
    productoLabel: String,
    color: String,
    precioM2: Number,
    precioUnitario: Number,
    subtotal: Number,
    
    // ⚠️ CAMPOS TÉCNICOS LIMITADOS
    medidas: {
      ancho: Number,
      alto: Number,
      area: Number
    },
    
    // Motorización
    motorizado: Boolean,
    motorModelo: String,
    motorPrecio: Number,
    controlModelo: String,
    controlPrecio: Number,
    
    // ❌ FALTAN LOS 13 CAMPOS TÉCNICOS COMPLETOS
    // No hay: sistema, control, instalacion, fijacion, caida,
    // galeria, telaMarca, baseTabla, operacion, detalle, traslape, etc.
  }],
  
  instalacion: {
    incluye: Boolean,
    costo: Number,
    tipo: String
  },
  
  descuento: {
    aplica: Boolean,
    tipo: String,
    valor: Number,
    monto: Number
  },
  
  facturacion: {
    requiere: Boolean,
    iva: Number
  },
  
  subtotal: Number,
  total: Number,
  iva: Number
}
```

**🔴 PROBLEMA CRÍTICO:** El modelo `Cotizacion` NO tiene campos para almacenar los 13 campos técnicos por pieza. Solo tiene campos básicos de medidas y motorización.

---

## 📋 3. CONTROLADORES INVOLUCRADOS

### 3.1 proyectoController.js

**Archivo:** `server/controllers/proyectoController.js`

#### 3.1.1 Función `guardarLevantamiento` (Líneas 1350-1431)

```javascript
const guardarLevantamiento = async (req, res) => {
  const { partidas = [], totales = {}, observaciones = '', personaVisita = '' } = req.body;
  
  // Normalizar partidas
  const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: false });
  
  // Guardar en proyecto.levantamiento
  proyecto.levantamiento = {
    partidas: partidasNormalizadas,
    totales: totalesProyecto,
    observaciones,
    personaVisita,
    actualizadoEn: new Date()
  };
  
  // ⚠️ TAMBIÉN guarda en proyecto.medidas (legacy)
  const registroMedidas = construirRegistroMedidas(partidasNormalizadas, {
    personaVisita,
    observaciones,
    incluirPrecios: false
  });
  
  const medidasExistentes = Array.isArray(proyecto.medidas)
    ? proyecto.medidas.filter(medida => !medida.esPartidasV2)
    : [];
  proyecto.medidas = [...medidasExistentes, registroMedidas];
  
  await proyecto.save();
};
```

**✅ CORRECTO:** Guarda los 13 campos técnicos en `proyecto.levantamiento.partidas[].piezas[]`

---

#### 3.1.2 Función `crearCotizacionDesdeProyecto` (Líneas 1433-1592)

```javascript
const crearCotizacionDesdeProyecto = async (req, res) => {
  const { partidas = [], precioReglas = {}, facturacion = {}, totales = {} } = req.body;
  
  // Normalizar partidas CON precios
  const partidasNormalizadas = normalizarPartidas(partidas, { incluirPrecios: true });
  
  // ⚠️ CONSTRUIR PRODUCTOS PARA COTIZACIÓN
  const productosCotizacion = construirProductosDesdePartidas(partidasNormalizadas);
  
  // Crear cotización
  const nuevaCotizacion = new Cotizacion({
    numero: numeroCotizacion,
    proyecto: proyecto._id,
    prospecto: proyecto.prospecto_original,
    origen: 'cotizacion_vivo',
    productos: productosCotizacion, // ❌ AQUÍ SE PIERDEN LOS CAMPOS TÉCNICOS
    instalacion: { ... },
    descuento: { ... },
    facturacion: { ... },
    subtotal: totalesProyecto.subtotal,
    iva: totalesProyecto.iva,
    total: totalesProyecto.total
  });
  
  await nuevaCotizacion.save();
  
  // Actualizar proyecto
  proyecto.levantamiento = {
    partidas: partidasNormalizadas, // ✅ Guarda campos técnicos aquí
    totales: totalesProyecto,
    observaciones,
    personaVisita
  };
  
  proyecto.cotizacionActual = {
    cotizacion: nuevaCotizacion._id,
    numero: numeroCotizacion,
    totales: totalesProyecto,
    precioReglas: precioReglasNormalizado,
    facturacion: facturacionNormalizada
  };
  
  await proyecto.save();
};
```

**🔴 PROBLEMA IDENTIFICADO:** La función `construirProductosDesdePartidas()` mapea las partidas a productos de cotización, pero NO incluye los 13 campos técnicos en el mapeo.

---

## 🔍 4. FUNCIONES DE NORMALIZACIÓN Y MAPEO

### 4.1 Función `normalizarPartidas` (ubicación desconocida)

**Responsabilidad:** Normalizar estructura de partidas recibidas del frontend

**⚠️ PENDIENTE:** Necesitamos encontrar esta función para verificar si preserva los campos técnicos.

---

### 4.2 Función `construirProductosDesdePartidas` (ubicación desconocida)

**Responsabilidad:** Convertir partidas del levantamiento en productos de cotización

**🔴 SOSPECHA:** Esta función probablemente NO mapea los 13 campos técnicos, causando la pérdida de información.

---

### 4.3 Función `construirRegistroMedidas` (ubicación desconocida)

**Responsabilidad:** Construir registro de medidas para el campo legacy `proyecto.medidas`

**⚠️ PENDIENTE:** Verificar si esta función preserva los campos técnicos.

---

## 📊 RESUMEN PARTE 1

### ✅ Rutas Identificadas

| Ruta | Propósito | Estado |
|------|-----------|--------|
| `PATCH /proyectos/:id/levantamiento` | Guardar levantamiento técnico | ✅ Funcional |
| `POST /proyectos/:id/cotizaciones` | Crear cotización desde proyecto | ⚠️ Pierde datos |
| `POST /etapas` | Sistema legacy de etapas | ⚠️ Flujo paralelo |

### 🗄️ Modelos Analizados

| Modelo | Campo | Campos Técnicos | Estado |
|--------|-------|-----------------|--------|
| `Proyecto` | `levantamiento.partidas[].piezas[]` | ✅ 13 campos completos | Correcto |
| `Proyecto` | `medidas[]` (legacy) | ✅ 13 campos completos | Deprecado |
| `Cotizacion` | `productos[]` | ❌ Solo 3-4 campos | **INCOMPLETO** |

### 🔴 Problemas Críticos Detectados

1. **Modelo Cotizacion incompleto:** No tiene campos para los 13 campos técnicos
2. **Función de mapeo deficiente:** `construirProductosDesdePartidas()` no preserva campos técnicos
3. **Duplicidad de estructuras:** `levantamiento` vs `medidas` (legacy)
4. **Flujo paralelo:** Etapas vs Proyectos no sincronizados

---

**Continúa en:** `analisis_flujo_levantamiento_cotizacion_parte2.md`
