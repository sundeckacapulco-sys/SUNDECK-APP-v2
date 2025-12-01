# 📘 ESTRUCTURA ACTUAL DEL MODELO PROYECTO.JS

**Ubicación del archivo:** `/server/models/Proyecto.js`  
**Fecha de documentación:** 6 Noviembre 2025  
**Responsable:** Agente Codex  
**Líneas totales:** 1,282  
**Versión del modelo:** Unificado (Post-Fase 4)

---

## 🎯 RESUMEN EJECUTIVO

El modelo `Proyecto.js` es el **modelo central unificado** del CRM Sundeck. Integra todo el ciclo de vida comercial y operativo: desde el levantamiento técnico hasta la instalación final, incluyendo fabricación, pagos y garantías.

**Características principales:**
- ✅ Modelo unificado (reemplaza Prospecto + Proyecto legacy)
- ✅ Levantamiento técnico normalizado con 13 campos críticos
- ✅ Cronograma completo de producción
- ✅ Fabricación detallada con control de calidad
- ✅ Instalación inteligente con optimización de rutas
- ✅ Sistema de pagos estructurado
- ✅ Métodos inteligentes de cálculo y generación

---

## 🔹 CAMPOS PRINCIPALES DEL SCHEMA

### 1. Información del Cliente
- `cliente.nombre` (String, required)
- `cliente.telefono` (String, required)
- `cliente.correo` (String)
- `cliente.direccion` (Object: calle, colonia, ciudad, codigoPostal, referencias, linkUbicacion)
- `cliente.zona` (String)

### 2. Identificación y Estado
- `numero` (String, unique) - Formato: `2025-NOMBRE-001`
- `tipo_fuente` (Enum: simple, en_vivo, formal, directo)
- `estado` (Enum: levantamiento, cotizacion, aprobado, fabricacion, instalacion, completado, cancelado)

### 3. Fechas
- `fecha_creacion` (Date)
- `fecha_actualizacion` (Date)
- `fecha_compromiso` (Date)

### 4. Levantamiento Técnico ⭐ (CRÍTICO)
- `levantamiento.partidas[]` - Array de partidas
  - `piezas[]` - Array con **13 campos técnicos**:
    1. `sistema`
    2. `control`
    3. `instalacion`
    4. `fijacion`
    5. `caida`
    6. `galeria`
    7. `telaMarca`
    8. `baseTabla`
    9. `operacion`
    10. `detalle`
    11. `traslape`
    12. `modeloCodigo`
    13. `observacionesTecnicas`
  - `motorizacion` (Object)
  - `instalacionEspecial` (Object)
  - `totales` (Object)
  - `fotos[]` (Array)

### 5. Cotización Actual
- `cotizacionActual.cotizacion` (ObjectId ref Cotizacion)
- `cotizacionActual.totales` (Object)
- `cotizacionActual.precioReglas` (Object)
- `cotizacionActual.facturacion` (Object)

### 6. Medidas (DEPRECATED) ⚠️
- `medidas[]` - Mantener por compatibilidad, **usar `levantamiento` en su lugar**

### 7. Materiales y Productos
- `materiales[]` (Array)
- `productos[]` (Array)
- `fotos[]` (Array de URLs)

### 8. Responsables
- `responsable` (String)
- `asesor_asignado` (ObjectId ref Usuario)
- `tecnico_asignado` (ObjectId ref Usuario)

### 9. Información Financiera
- `monto_estimado`, `subtotal`, `iva`, `total`, `anticipo`, `saldo_pendiente`

### 10. Cronograma Unificado ⭐
- `cronograma.fechaPedido`
- `cronograma.fechaInicioFabricacion`
- `cronograma.fechaFinFabricacionEstimada`
- `cronograma.fechaFinFabricacionReal`
- `cronograma.fechaInstalacionProgramada`
- `cronograma.fechaInstalacionReal`
- `cronograma.fechaEntrega`
- `cronograma.fechaCompletado`

### 11. Fabricación Detallada ⭐
- `fabricacion.estado` (Enum: pendiente, materiales_pedidos, en_proceso, control_calidad, terminado, empacado)
- `fabricacion.asignadoA` (ObjectId ref Usuario)
- `fabricacion.prioridad` (Enum: baja, media, alta, urgente)
- `fabricacion.materiales[]` (Array)
- `fabricacion.procesos[]` (Array)
- `fabricacion.controlCalidad` (Object)
- `fabricacion.empaque` (Object)
- `fabricacion.costos` (Object)
- `fabricacion.progreso` (Number 0-100)
- `fabricacion.etiquetas[]` (Array con QR)

### 12. Instalación Completa ⭐
- `instalacion.numeroOrden`
- `instalacion.estado` (Enum: programada, en_ruta, instalando, completada, cancelada, reprogramada)
- `instalacion.programacion` (Object con cuadrilla y tiempos)
- `instalacion.productosInstalar[]` (Array con especificaciones técnicas)
- `instalacion.checklist[]` (Array)
- `instalacion.ruta` (Object con optimización)
- `instalacion.ejecucion` (Object)
- `instalacion.evidencias` (Object con fotos y firma)
- `instalacion.garantia` (Object)
- `instalacion.costos` (Object)

### 13. Pagos Estructurados ⭐
- `pagos.montoTotal`, `pagos.subtotal`, `pagos.iva`, `pagos.descuentos`
- `pagos.anticipo` (Object: 60% default)
- `pagos.saldo` (Object: 40% default)
- `pagos.pagosAdicionales[]` (Array)

### 14. Historial de Notas
- `notas[]` (Array con tipo, contenido, usuario, fecha)

### 15. Referencias a Otras Colecciones
- `prospecto_original` (ObjectId ref Prospecto)
- `cotizaciones[]` (Array ObjectId ref Cotizacion)
- `pedidos[]` (Array ObjectId ref Pedido)
- `ordenes_fabricacion[]` (Array ObjectId ref OrdenFabricacion)
- `instalaciones[]` (Array ObjectId ref Instalacion)

### 16. Metadatos
- `creado_por` (ObjectId ref Usuario, required)
- `actualizado_por` (ObjectId ref Usuario)
- `requiere_factura` (Boolean)
- `metodo_pago_anticipo` (Enum)
- `tiempo_entrega` (Object)
- `activo` (Boolean)

---

## 🔹 ÍNDICES DE BASE DE DATOS

```javascript
proyectoSchema.index({ 'cliente.telefono': 1 });
proyectoSchema.index({ estado: 1 });
proyectoSchema.index({ fecha_creacion: -1 });
proyectoSchema.index({ asesor_asignado: 1 });
proyectoSchema.index({ tipo_fuente: 1 });
```

---

## 🔹 MIDDLEWARES Y HOOKS ACTIVOS

### Pre-Save Hook

**Funciones:**
1. Actualiza `fecha_actualizacion` automáticamente
2. Genera `numero` de proyecto único con formato: `YYYY-NOMBRE-XXX`
3. Logging estructurado

**Formato del número:** `2025-SAHID-CAMPOS-001`

---

## 🔹 VIRTUALS (CAMPOS CALCULADOS)

1. **`area_total`** - Suma de todas las áreas de medidas
2. **`cliente_nombre_completo`** - Nombre del cliente
3. **`progreso_porcentaje`** - Progreso basado en estado (0-100%)

---

## 🔹 MÉTODOS DE INSTANCIA

### 1. toExportData()
Convierte el proyecto a formato de exportación limpio.

### 2. generarEtiquetasProduccion() ⭐
Genera etiquetas de producción para empaques con:
- Número de orden y pieza
- Datos del cliente
- Especificaciones técnicas completas
- Código QR con información del producto

### 3. calcularTiempoInstalacion() ⭐
Algoritmo inteligente que calcula tiempo estimado considerando:
- Tipo de sistema (roller, romana, panel, etc.)
- Tamaño del área
- Motorización
- Tipo de instalación (techo, empotrado, piso)
- Tipo de fijación (concreto, tablaroca)
- Altura
- Accesibilidad del sitio

**Retorna:**
- Tiempo estimado en minutos y horas
- Desglose (preparación, instalación, limpieza, buffer)
- Factores aplicados
- Recomendaciones

### 4. generarRecomendacionesInstalacion()
Genera recomendaciones basadas en factores de complejidad:
- Técnico especializado si hay motorización
- Escalera/andamio si hay altura
- Tiempo extra si hay dificultad de acceso
- Cuadrilla de 2+ técnicos si alta complejidad

---

## 🔹 MÉTODOS ESTÁTICOS

### optimizarRutaDiaria(fecha) ⭐

Optimiza la ruta diaria de instalaciones usando:
- **Algoritmo Nearest Neighbor** (vecino más cercano)
- **Fórmula de Haversine** para calcular distancias
- Cálculo de horarios considerando traslados
- Asignación de orden en ruta

**Retorna:**
- Ruta optimizada con horarios
- Distancia total en km
- Tiempo total estimado
- Orden de visitas

---

## 🔹 SUBDOCUMENTOS RELACIONADOS

| Subdocumento | Descripción | Uso |
|--------------|-------------|-----|
| `cliente` | Información general del cliente | Contacto y ubicación |
| `levantamiento` | **Medidas y especificaciones técnicas** | **Fuente de verdad técnica** |
| `cotizacionActual` | Resumen de última cotización | Acceso rápido |
| `cronograma` | Timeline del proyecto | Seguimiento de fechas |
| `fabricacion` | Proceso de fabricación completo | Control de producción |
| `instalacion` | Programación y ejecución | Logística de instalación |
| `pagos` | Estructura de pagos | Control financiero |
| `notas` | Historial de comunicaciones | Trazabilidad |

---

## 🔹 OBSERVACIONES TÉCNICAS

### ✅ Fortalezas

1. **Modelo unificado completo** - Cubre todo el ciclo de vida
2. **Levantamiento normalizado** - 13 campos técnicos bien definidos
3. **Métodos inteligentes** - Cálculos automáticos y optimización
4. **Trazabilidad completa** - Historial de notas y estados
5. **Integración con otros modelos** - Referencias bien definidas
6. **Generación automática de número** - Sin colisiones
7. **Índices optimizados** - Consultas eficientes

### ⚠️ Áreas de Atención

1. **Campo `medidas` deprecado** - Migrar datos a `levantamiento`
2. **Falta campo `tipo`** - Para distinguir prospecto vs proyecto activo
3. **No incluye campos de trazabilidad comercial** - Ej: origen, fuente de referencia detallada
4. **Subdocumento `fabricacion.etiquetas` puede crecer** - Considerar colección separada si hay muchas piezas
5. **Coordenadas en `instalacion.ruta`** - Requieren geocodificación manual o API

### 🎯 Compatibilidad

- ✅ Compatible con módulo **Pedidos** (vía `pedidos[]`)
- ✅ Compatible con módulo **Fabricación** (vía `fabricacion` y `ordenes_fabricacion[]`)
- ✅ Compatible con módulo **Instalaciones** (vía `instalacion` y `instalaciones[]`)
- ✅ Compatible con **KPIs** (vía estados y fechas)
- ✅ Compatible con **Cotizaciones** (vía `cotizaciones[]` y `cotizacionActual`)

---

## 🔹 FLUJO TÉCNICO UNIFICADO

```
1. LEVANTAMIENTO
   └─> proyecto.levantamiento.partidas[].piezas[]
       └─> 13 campos técnicos capturados

2. COTIZACIÓN
   └─> cotizacionMapper.js lee levantamiento
       └─> Genera productos con especificacionesTecnicas

3. PEDIDO
   └─> Pedido.productos[].especificacionesTecnicas
       └─> Recibe 13 campos desde cotización

4. FABRICACIÓN
   └─> fabricacionController lee Pedido
       └─> OrdenFabricacion con especificaciones completas

5. INSTALACIÓN
   └─> instalacion.productosInstalar[]
       └─> Especificaciones técnicas para instaladores
```

**✅ FLUJO VALIDADO:** Los 13 campos técnicos fluyen correctamente desde `Proyecto.levantamiento` hasta `Instalación`.

---

## 📊 MÉTRICAS DEL MODELO

| Métrica | Valor |
|---------|-------|
| **Líneas totales** | 1,282 |
| **Campos principales** | 16 secciones |
| **Subdocumentos** | 8 principales |
| **Referencias** | 5 colecciones |
| **Índices** | 5 |
| **Middlewares** | 1 (pre-save) |
| **Virtuals** | 3 |
| **Métodos instancia** | 4 |
| **Métodos estáticos** | 1 |
| **Enums** | 12 |

---

## 🎯 USO RECOMENDADO PARA MÓDULO PROSPECTOS UNIFICADOS

### Campos a Considerar

1. **Agregar campo `tipo`:**
   ```javascript
   tipo: {
     type: String,
     enum: ['prospecto', 'proyecto'],
     default: 'prospecto'
   }
   ```

2. **Agregar trazabilidad comercial:**
   ```javascript
   origenComercial: {
     fuente: String, // 'web', 'referido', 'facebook', 'llamada'
     referidoPor: String,
     campana: String,
     fechaPrimerContacto: Date
   }
   ```

3. **Agregar historial de estados:**
   ```javascript
   historialEstados: [{
     estado: String,
     fecha: Date,
     usuario: ObjectId,
     observaciones: String
   }]
   ```

### Flujo Sugerido

```
PROSPECTO (tipo: 'prospecto')
  └─> Levantamiento agregado
      └─> Cotización generada
          └─> Cliente aprueba
              └─> tipo = 'proyecto'
                  └─> Pedido → Fabricación → Instalación
```

---

## 📤 ENTREGABLE FINAL

**Archivo:** `/docs/proyectos/auditorias/estructura_modelo_proyecto_actual.md`  
**Estado:** ✅ Completado  
**Fecha:** 6 Noviembre 2025  
**Responsable:** Agente Codex

Este documento refleja la estructura real del modelo `Proyecto.js` en producción y servirá como base para el rediseño del módulo **Prospectos Unificados**.

---

**Firma Digital:**  
Agente Codex — Sistema de Documentación Automatizada  
Sundeck CRM v2.0  
6 Noviembre 2025, 16:25 hrs
