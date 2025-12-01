# 📊 ANÁLISIS TÉCNICO: FLUJO LEVANTAMIENTO → COTIZACIÓN
## PARTE 3: PROPUESTA DE UNIFICACIÓN Y RECOMENDACIONES

**Continuación de:** `analisis_flujo_levantamiento_cotizacion_parte2.md`

---

## 🧩 7. PROPUESTA DE UNIFICACIÓN

### 7.1 Fuente Única de Verdad

**Modelo Principal:** `Proyecto.js`  
**Campo Principal:** `proyecto.levantamiento`

**Justificación:**
- ✅ Ya contiene los 13 campos técnicos completos
- ✅ Estructura normalizada y moderna (FASE 4)
- ✅ Incluye motorización e instalación especial
- ✅ Totales calculados por partida
- ✅ Se guarda correctamente desde el frontend

**Campo a Deprecar:** `proyecto.medidas` (legacy)

---

### 7.2 Solución Propuesta: Expandir Modelo Cotizacion

**Archivo a modificar:** `server/models/Cotizacion.js`

**Cambio #1: Agregar campos técnicos a productos[]**

```javascript
productos: [{
  // Campos existentes
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
  
  // ✅ AGREGAR: 13 CAMPOS TÉCNICOS
  especificacionesTecnicas: {
    sistema: [String],              // 1. Sistema (array: Roller, Zebra, etc.)
    control: String,                // 2. Control (Izquierda/Derecha)
    tipoInstalacion: String,        // 3. Tipo instalación (Muro/Techo/Empotrado)
    tipoFijacion: String,           // 4. Tipo fijación (Concreto/Tablaroca/etc.)
    caida: String,                  // 5. Caída/Orientación
    galeria: String,                // 6. Galería (Sí/No)
    telaMarca: String,              // 7. Tela/Marca
    baseTabla: String,              // 8. Base/Tabla (7cm/15cm/18cm)
    modoOperacion: String,          // 9. Modo operación (Manual/Motorizado)
    detalleTecnico: String,         // 10. Detalle técnico
    traslape: String,               // 11. Traslape
    modeloCodigo: String,           // 12. Modelo/Código (SC-3%, BK-100)
    observacionesTecnicas: String   // 13. Observaciones técnicas
  },
  
  // Campos existentes de motorización
  motorizado: Boolean,
  motorModelo: String,
  motorPrecio: Number,
  controlModelo: String,
  controlPrecio: Number
}]
```

---

### 7.3 Solución Propuesta: Corregir Función de Mapeo

**Archivo a crear/modificar:** `server/utils/cotizacionMapper.js`

```javascript
/**
 * Construir productos de cotización desde partidas del levantamiento
 * PRESERVANDO los 13 campos técnicos
 */
const construirProductosDesdePartidas = (partidas) => {
  const productos = [];
  
  partidas.forEach(partida => {
    partida.piezas.forEach((pieza, index) => {
      productos.push({
        // Información básica
        ubicacion: partida.ubicacion,
        cantidad: 1,
        ancho: pieza.ancho,
        alto: pieza.alto,
        area: pieza.m2,
        nombre: partida.producto,
        productoLabel: partida.producto,
        color: pieza.color || partida.color,
        precioM2: pieza.precioM2,
        precioUnitario: pieza.precioM2,
        subtotal: pieza.m2 * (pieza.precioM2 || 0),
        
        // ✅ MAPEAR LOS 13 CAMPOS TÉCNICOS
        especificacionesTecnicas: {
          sistema: Array.isArray(pieza.sistema) ? pieza.sistema : [pieza.sistema],
          control: pieza.control,
          tipoInstalacion: pieza.instalacion,
          tipoFijacion: pieza.fijacion,
          caida: pieza.caida,
          galeria: pieza.galeria,
          telaMarca: pieza.telaMarca,
          baseTabla: pieza.baseTabla,
          modoOperacion: pieza.operacion,
          detalleTecnico: pieza.detalle,
          traslape: pieza.traslape,
          modeloCodigo: pieza.modeloCodigo,
          observacionesTecnicas: pieza.observacionesTecnicas
        },
        
        // Motorización (si aplica)
        motorizado: partida.motorizacion?.activa || false,
        motorModelo: partida.motorizacion?.modeloMotor,
        motorPrecio: partida.motorizacion?.precioMotor,
        controlModelo: partida.motorizacion?.modeloControl,
        controlPrecio: partida.motorizacion?.precioControl
      });
    });
  });
  
  return productos;
};

module.exports = {
  construirProductosDesdePartidas
};
```

---

### 7.4 Solución Propuesta: Actualizar Controlador

**Archivo a modificar:** `server/controllers/proyectoController.js`

```javascript
// Importar mapper corregido
const { construirProductosDesdePartidas } = require('../utils/cotizacionMapper');

const crearCotizacionDesdeProyecto = async (req, res) => {
  // ... código existente ...
  
  // ✅ USAR MAPPER CORREGIDO que preserva los 13 campos
  const productosCotizacion = construirProductosDesdePartidas(partidasNormalizadas);
  
  // Crear cotización con productos completos
  const nuevaCotizacion = new Cotizacion({
    numero: numeroCotizacion,
    proyecto: proyecto._id,
    prospecto: proyecto.prospecto_original,
    origen: 'cotizacion_vivo',
    productos: productosCotizacion, // ✅ AHORA INCLUYE LOS 13 CAMPOS
    // ... resto del código ...
  });
  
  await nuevaCotizacion.save();
  
  // ... resto del código ...
};
```

---

## 🧱 8. DIAGRAMA DEL FLUJO DE DATOS PROPUESTO

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: AgregarMedidasProyectoModal.jsx                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Usuario completa formulario con 13 campos técnicos          │ │
│ │ • Sistema, Control, Instalación, Fijación, Caída, etc.      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ handleGuardarCotizacionEnVivo()
                           │ Payload: { partidas: [...] }
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /api/proyectos/:id/cotizaciones                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ CONTROLLER: proyectoController.js                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ crearCotizacionDesdeProyecto()                              │ │
│ │ 1. Recibe partidas con 13 campos técnicos                   │ │
│ │ 2. Normaliza partidas                                       │ │
│ │ 3. ✅ Mapea a productos CON campos técnicos                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ MAPPER: cotizacionMapper.js                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ construirProductosDesdePartidas()                           │ │
│ │ ✅ Preserva los 13 campos en especificacionesTecnicas       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ MODELO: Cotizacion.js                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ new Cotizacion({                                            │ │
│ │   productos: [{                                             │ │
│ │     especificacionesTecnicas: {                             │ │
│ │       ✅ sistema, control, instalacion, fijacion, etc.      │ │
│ │     }                                                       │ │
│ │   }]                                                        │ │
│ │ })                                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ save()
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ MONGODB: Colección 'cotizaciones'                              │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                           │ │
│ │   _id: ObjectId,                                            │ │
│ │   numero: "COT-2025-0001",                                  │ │
│ │   productos: [{                                             │ │
│ │     especificacionesTecnicas: {                             │ │
│ │       ✅ sistema: ["Roller"],                               │ │
│ │       ✅ control: "Izquierda",                              │ │
│ │       ✅ tipoInstalacion: "Muro",                           │ │
│ │       ✅ ... (13 campos completos)                          │ │
│ │     }                                                       │ │
│ │   }]                                                        │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ MODELO: Proyecto.js                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ proyecto.levantamiento = {                                  │ │
│ │   partidas: [...], // ✅ 13 campos técnicos                 │ │
│ │   totales: {...}                                            │ │
│ │ }                                                           │ │
│ │                                                             │ │
│ │ proyecto.cotizacionActual = {                               │ │
│ │   cotizacion: ObjectId(nuevaCotizacion),                    │ │
│ │   numero: "COT-2025-0001",                                  │ │
│ │   totales: {...}                                            │ │
│ │ }                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ 9. RECOMENDACIONES FINALES

### 9.1 Archivos que Deben Modificarse

| Archivo | Cambio Requerido | Prioridad |
|---------|------------------|-----------|
| `server/models/Cotizacion.js` | Agregar `especificacionesTecnicas` a `productos[]` | 🔴 CRÍTICO |
| `server/utils/cotizacionMapper.js` | Crear mapper que preserve los 13 campos | 🔴 CRÍTICO |
| `server/controllers/proyectoController.js` | Usar nuevo mapper en `crearCotizacionDesdeProyecto()` | 🔴 CRÍTICO |
| `server/models/Proyecto.js` | Marcar `medidas` como deprecado (comentarios) | 🟡 MEDIO |
| `server/routes/etapas.js` | Mejorar sincronización con Proyectos | 🟡 MEDIO |

---

### 9.2 Dependencias a Revisar

1. **Funciones de normalización:**
   - `normalizarPartidas()` - Verificar que preserve campos técnicos
   - `construirTotalesProyecto()` - Verificar cálculos
   - `construirRegistroMedidas()` - Verificar mapeo a legacy

2. **Servicios relacionados:**
   - `pdfService.js` - Actualizar para leer de `especificacionesTecnicas`
   - `excelService.js` - Actualizar para leer de `especificacionesTecnicas`

3. **Frontend:**
   - Verificar que componentes de visualización lean correctamente los campos técnicos

---

### 9.3 Pruebas a Ejecutar Después de Unificar

#### Prueba 1: Levantamiento Técnico
```bash
# 1. Crear levantamiento con 13 campos técnicos
# 2. Verificar en MongoDB:
db.proyectos.findOne({ _id: ObjectId("...") }, { 
  "levantamiento.partidas.piezas": 1 
})
# 3. Confirmar que los 13 campos están presentes
```

#### Prueba 2: Cotización desde Levantamiento
```bash
# 1. Crear cotización desde proyecto con levantamiento
# 2. Verificar en MongoDB:
db.cotizaciones.findOne({ numero: "COT-2025-0001" }, { 
  "productos.especificacionesTecnicas": 1 
})
# 3. Confirmar que los 13 campos están presentes
```

#### Prueba 3: Generación de PDF
```bash
# 1. Generar PDF de cotización
# 2. Verificar que el PDF incluye los 13 campos técnicos
# 3. Confirmar formato y legibilidad
```

#### Prueba 4: Sincronización Etapas → Proyectos
```bash
# 1. Crear etapa en Prospecto con campos técnicos
# 2. Verificar sincronización automática
# 3. Confirmar que proyecto.levantamiento tiene los datos
```

---

### 9.4 Plan de Implementación (3 Sprints)

#### Sprint 1: Modelo y Mapper (1-2 días)
- [ ] Modificar `Cotizacion.js` para agregar `especificacionesTecnicas`
- [ ] Crear `cotizacionMapper.js` con función corregida
- [ ] Escribir tests unitarios para el mapper
- [ ] Ejecutar migración de datos existentes (opcional)

#### Sprint 2: Controlador y Rutas (1-2 días)
- [ ] Actualizar `proyectoController.js` para usar nuevo mapper
- [ ] Verificar que `guardarLevantamiento()` funciona correctamente
- [ ] Verificar que `crearCotizacionDesdeProyecto()` preserva campos
- [ ] Escribir tests de integración

#### Sprint 3: Servicios y Frontend (2-3 días)
- [ ] Actualizar `pdfService.js` para leer `especificacionesTecnicas`
- [ ] Actualizar `excelService.js` para leer `especificacionesTecnicas`
- [ ] Actualizar componentes de visualización en frontend
- [ ] Ejecutar pruebas end-to-end completas
- [ ] Documentar cambios en README

---

### 9.5 Comandos Útiles para Análisis

#### Verificar estructura de levantamiento en MongoDB
```javascript
db.proyectos.aggregate([
  { $match: { "levantamiento.partidas": { $exists: true } } },
  { $project: {
    numero: 1,
    "levantamiento.partidas.piezas.sistema": 1,
    "levantamiento.partidas.piezas.control": 1,
    "levantamiento.partidas.piezas.instalacion": 1
  }},
  { $limit: 5 }
])
```

#### Verificar cotizaciones sin campos técnicos
```javascript
db.cotizaciones.aggregate([
  { $match: { "productos.especificacionesTecnicas": { $exists: false } } },
  { $project: { numero: 1, fecha: 1, "productos.nombre": 1 } },
  { $limit: 10 }
])
```

#### Contar proyectos con levantamiento vs medidas legacy
```javascript
db.proyectos.aggregate([
  {
    $project: {
      numero: 1,
      tieneLevantamiento: { $cond: [{ $gt: [{ $size: { $ifNull: ["$levantamiento.partidas", []] } }, 0] }, 1, 0] },
      tieneMedidas: { $cond: [{ $gt: [{ $size: { $ifNull: ["$medidas", []] } }, 0] }, 1, 0] }
    }
  },
  {
    $group: {
      _id: null,
      conLevantamiento: { $sum: "$tieneLevantamiento" },
      conMedidas: { $sum: "$tieneMedidas" }
    }
  }
])
```

---

## 📊 RESUMEN EJECUTIVO

### Problema Raíz
Los 13 campos técnicos del levantamiento NO pasan a la cotización formal porque:
1. El modelo `Cotizacion` no tiene campos para almacenarlos
2. La función `construirProductosDesdePartidas()` los descarta al mapear

### Solución
1. **Expandir modelo Cotizacion:** Agregar `especificacionesTecnicas` a `productos[]`
2. **Corregir mapper:** Preservar los 13 campos en el mapeo
3. **Actualizar controlador:** Usar mapper corregido

### Impacto
- ✅ Cotizaciones formales tendrán información técnica completa
- ✅ PDFs y Excels incluirán especificaciones técnicas
- ✅ Fabricación e instalación tendrán datos precisos
- ✅ Eliminación de duplicidad (deprecar `medidas` legacy)

### Esfuerzo Estimado
- **Sprint 1:** 1-2 días (Modelo y Mapper)
- **Sprint 2:** 1-2 días (Controlador y Rutas)
- **Sprint 3:** 2-3 días (Servicios y Frontend)
- **Total:** 4-7 días de desarrollo

---

**FIN DEL ANÁLISIS TÉCNICO**

**Documentos generados:**
1. `analisis_flujo_levantamiento_cotizacion_parte1.md` - Rutas y Modelos
2. `analisis_flujo_levantamiento_cotizacion_parte2.md` - Flujo Actual y Problemas
3. `analisis_flujo_levantamiento_cotizacion_parte3.md` - Propuestas y Recomendaciones
