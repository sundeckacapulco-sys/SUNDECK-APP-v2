# 📊 AUDITORÍA DE DEPENDENCIAS — PROSPECTO LEGACY

**Fecha:** 6/11/2025, 2:07:34 p.m.  
**Total de archivos:** 61  
**Total de referencias:** 990

---

## 📁 RESUMEN POR CATEGORÍA

| Categoría | Archivos | Referencias |
|-----------|----------|-------------|
| Models | 13 | 59 |
| Routes | 12 | 525 |
| Controllers | 6 | 93 |
| Middleware | 1 | 64 |
| Otros | 29 | 249 |

---

## 🔴 ARCHIVOS CRÍTICOS (MODELS)

### \server\models\Cotizacion.js
**Referencias:** 3

```javascript
// Línea 6
prospecto: {

// Línea 8
ref: 'Prospecto'

// Línea 229
cotizacionSchema.index({ prospecto: 1 });

```

### \server\models\Etapa.js
**Referencias:** 2

```javascript
// Línea 47
prospectoId: {

// Línea 49
ref: 'Prospecto',

```

### \server\models\Fabricacion.legacy.js
**Referencias:** 2

```javascript
// Línea 27
prospecto: {

// Línea 29
ref: 'Prospecto',

```

### \server\models\KPI.js
**Referencias:** 10

```javascript
// Línea 21
prospectosNuevos: { type: Number, default: 0 },

// Línea 22
prospectosActivos: { type: Number, default: 0 },

// Línea 23
prospectosConvertidos: { type: Number, default: 0 },

// Línea 24
prospectosPerdidos: { type: Number, default: 0 },

// Línea 52
prospectoACotizacion: { type: Number, default: 0 },

```

### \server\models\Pedido.js
**Referencias:** 3

```javascript
// Línea 12
prospecto: {

// Línea 14
ref: 'Prospecto',

// Línea 420
pedidoSchema.index({ prospecto: 1 });

```

### \server\models\Postventa.js
**Referencias:** 1

```javascript
// Línea 17
ref: 'Prospecto',

```

### \server\models\Prospecto.js
**Referencias:** 13

```javascript
// Línea 4
const prospectoSchema = new mongoose.Schema({

// Línea 190
prospectoSchema.index({ telefono: 1 });

// Línea 191
prospectoSchema.index({ email: 1 });

// Línea 192
prospectoSchema.index({ etapa: 1 });

// Línea 193
prospectoSchema.index({ vendedorAsignado: 1 });

```

### \server\models\ProspectoNoConvertido.js
**Referencias:** 11

```javascript
// Línea 4
const prospectoNoConvertidoSchema = new mongoose.Schema({

// Línea 168
prospectoNoConvertidoSchema.index({ fechaPerdida: -1 });

// Línea 169
prospectoNoConvertidoSchema.index({ vendedorAsignado: 1, estadoRecuperacion: 1 });

// Línea 170
prospectoNoConvertidoSchema.index({ 'razonPerdida.tipo': 1 });

// Línea 171
prospectoNoConvertidoSchema.index({ 'alertas.proximoSeguimiento': 1, 'alertas.alertaActiva': 1 });

```

### \server\models\Proyecto.js
**Referencias:** 2

```javascript
// Línea 748
prospecto_original: {

// Línea 750
ref: 'Prospecto'

```

### \server\models\ProyectoPedido.legacy.js
**Referencias:** 3

```javascript
// Línea 24
prospecto: {

// Línea 26
ref: 'Prospecto',

// Línea 761
proyectoPedidoSchema.index({ prospecto: 1 });

```

### \server\models\Recordatorio.js
**Referencias:** 3

```javascript
// Línea 44
prospecto: {

// Línea 46
ref: 'Prospecto'

// Línea 151
recordatorioSchema.index({ prospecto: 1 });

```

### \server\models\Usuario.js
**Referencias:** 2

```javascript
// Línea 44
enum: ['prospectos', 'cotizaciones', 'pedidos', 'fabricacion', 'instalaciones', 'postventa', 'reportes', 'usuarios', 'configuracion']

// Línea 83
prospectosAsignados: { type: Number, default: 0 },

```

### \server\models\WhatsAppTracking.js
**Referencias:** 4

```javascript
// Línea 9
prospecto: {

// Línea 11
ref: 'Prospecto',

// Línea 51
etapa_prospecto: String,

// Línea 65
whatsAppTrackingSchema.index({ prospecto: 1, fecha_evento: -1 });

```

## 🟡 ARCHIVOS DE RUTAS (ROUTES)

### \server\routes\backup.js
**Referencias:** 67

### \server\routes\cotizaciones.js
**Referencias:** 25

### \server\routes\dashboard.js
**Referencias:** 28

### \server\routes\etapas.js
**Referencias:** 61

### \server\routes\instalaciones.js
**Referencias:** 7

### \server\routes\kpis.js
**Referencias:** 45

### \server\routes\pedidos.js
**Referencias:** 40

### \server\routes\plantillasWhatsApp.js
**Referencias:** 7

### \server\routes\produccion.js
**Referencias:** 9

### \server\routes\prospectos.js
**Referencias:** 230

### \server\routes\proyectos.js
**Referencias:** 5

### \server\routes\recordatorios.js
**Referencias:** 1

## 🟢 ARCHIVOS DE MIDDLEWARE

### \server\middleware\proyectoSync.js
**Referencias:** 64

## 📋 OTROS ARCHIVOS

- \server\index.js (1 referencias)
- \server\listeners\fabricacionListener.js (4 referencias)
- \server\listeners\instalacionListener.js (3 referencias)
- \server\listeners\pedidoListener.js (17 referencias)
- \server\scripts\auditoria_colecciones.js (1 referencias)
- \server\scripts\auditoria_dependencias_prospecto.js (4 referencias)
- \server\scripts\buscarProspecto.js (4 referencias)
- \server\scripts\crearDatosPruebaFlujoTecnico.js (26 referencias)
- \server\scripts\crearDatosSimple.js (11 referencias)
- \server\scripts\crearProyectosPrueba.js (9 referencias)
- \server\scripts\eliminarDatosPrueba.js (3 referencias)
- \server\scripts\insertarDatos.js (3 referencias)
- \server\scripts\limpiarBaseDatos.js (6 referencias)
- \server\scripts\migrarAProyectos.js (37 referencias)
- \server\scripts\migrarDatos.js (45 referencias)
- \server\scripts\migrarProyectoPedidoAProyecto.js (2 referencias)
- \server\scripts\plantillasIniciales.js (2 referencias)
- \server\scripts\pruebasFinales.js (1 referencias)
- \server\scripts\seedData.js (15 referencias)
- \server\scripts\validarFlujoTecnicoUnificado.js (3 referencias)
- \server\services\cotizacionMappingService.js (1 referencias)
- \server\services\excelService.js (4 referencias)
- \server\services\metricasComerciales.js (2 referencias)
- \server\services\notificacionesComerciales.js (11 referencias)
- \server\services\pdfService.js (20 referencias)
- \server\services\syncLegacyService.js (1 referencias)
- \server\tests\listeners\pedidoListener.test.js (8 referencias)
- \server\tests\metric.test.js (3 referencias)
- \server\utils\exportNormalizer.js (2 referencias)

---

## ✅ PRÓXIMOS PASOS

1. Revisar archivos críticos en Models
2. Desactivar rutas en Routes
3. Eliminar middleware ProyectoSyncMiddleware
4. Actualizar referencias en otros archivos
5. Ejecutar tests de regresión

---

**Generado automáticamente por:** auditoria_dependencias_prospecto.js  
**Fecha:** 2025-11-06T20:07:34.443Z
