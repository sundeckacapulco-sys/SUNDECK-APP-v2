# 📊 DATA MODEL ACTUAL - Sundeck App

**Fecha:** 20 Nov 2025  
**Versión:** 2.0 (Post-Fase 4)  
**Propósito:** DATA CONTRACT oficial

---

## ⚠️ IMPORTANTE

Este archivo documenta EXACTAMENTE cómo estás guardando la información AHORA MISMO.
- NO inventa nada
- NO resume nada  
- NO transforma nada
- Es la VERDAD ABSOLUTA del sistema actual

**Necesitamos este archivo para construir un DATA CONTRACT oficial de Sundeck.**

---

## 📑 ÍNDICE

1. [Levantamiento Técnico](#1-levantamiento-técnico)
2. [Proyecto](#2-proyecto)
3. [Orden de Taller](#3-orden-de-taller)
4. [Lista de Pedido](#4-lista-de-pedido)
5. [Campos No Usados](#5-campos-no-usados)
6. [Ejemplo JSON Real](#6-ejemplo-json-real)

---

## 1. LEVANTAMIENTO TÉCNICO

### Ubicación en BD
```
Proyecto.levantamiento.partidas[]
```

### Campos de Partida

| Campo | Tipo | Obligatorio | Guardado Como |
|-------|------|-------------|---------------|
| `ubicacion` | String | ❌ | `String` |
| `producto` | String | ❌ | `String` |
| `color` | String | ❌ | `String` |
| `modelo` | String | ❌ | `String` |
| `cantidad` | Number | ❌ | `Number` |
| `piezas` | Array | ✅ | `Array<Object>` |

### Campos de Pieza (partidas[].piezas[])

**MEDIDAS:**
- `ancho` (Number, ✅ Obligatorio) - Metros
- `alto` (Number, ✅ Obligatorio) - Metros  
- `m2` (Number, ❌) - Calculado: ancho × alto

**13 CAMPOS TÉCNICOS:**
- `sistema` (String/Array, ❌) - "Roller Shade", "Sheer Elegance", etc.
- `control` (String, ❌) - "izquierda", "derecha", "centro", "motorizado"
- `instalacion` (String, ❌) - "techo", "pared", "marco"
- `fijacion` (String, ❌) - "concreto", "tablaroca", "madera"
- `caida` (String, ❌) - "normal", "frente"
- `galeria` (String, ❌) - "galeria", "cassette", "cabezal", "sin_galeria"
- `telaMarca` (String, ❌) - "Shades", "Sunscreen", "Blackout"
- `baseTabla` (String, ❌) - "7", "7cm", "10cm"
- `operacion` (String, ❌) - "manual", "motorizado"
- `detalle` (String, ❌) - "rotada", "traslape", "doble_sistema"
- `traslape` (String, ❌) - Texto libre
- `modeloCodigo` (String, ❌) - Código de modelo
- `observacionesTecnicas` (String, ❌) - Notas técnicas

**CAMPOS ESPECIALES:**
- `galeriaCompartida` (Boolean, ❌) - 🔗 Comparte galería
- `grupoGaleria` (String, ❌) - "A", "B", "C"
- `sistemaSkyline` (Boolean, ❌) - ⭐ Sistema Skyline
- `motorCompartido` (Boolean, ❌) - 🔌 Comparte motor
- `grupoMotor` (String, ❌) - "M1", "M2", "M3"
- `piezasPorMotor` (Number, ❌) - Cantidad (default: 1)

**ADICIONALES:**
- `color` (String, ❌)
- `precioM2` (Number, ❌)
- `rotadaForzada` (Boolean, ❌) - 🔒 DEBE ir rotada

---

## 2. PROYECTO

### Campos Principales

**CLIENTE:**
- `cliente.nombre` (String, ✅)
- `cliente.telefono` (String, ✅)
- `cliente.correo` (String, ❌)
- `cliente.direccion.*` (Object, ❌)

**IDENTIFICACIÓN:**
- `numero` (String, ❌) - Auto: "P-2024-001"
- `tipo` (String, ❌) - "prospecto" | "proyecto"
- `tipo_fuente` (String, ✅) - "simple" | "en_vivo" | "formal" | "directo"

**ESTADOS:**
- `estadoComercial` (String, ❌) - Ver lista completa en doc
- `estado` (String, ❌) - "levantamiento" | "cotizacion" | "aprobado" | "fabricacion" | "instalacion" | "completado" | "cancelado"

**FECHAS:**
- `fecha_creacion` (Date, ❌) - Auto: `Date.now()`
- `fecha_actualizacion` (Date, ❌) - Auto: `Date.now()`
- `fecha_compromiso` (Date, ❌)

**DATOS:**
- `levantamiento` (Object, ❌) - Ver sección 1
- `medidas` (Array<Mixed>, ❌) - Array de visualización

**FINANCIERO:**
- `subtotal` (Number, ❌) - Calculado
- `iva` (Number, ❌) - Calculado
- `total` (Number, ❌) - Calculado
- `anticipo` (Number, ❌)
- `saldo_pendiente` (Number, ❌) - Calculado

### Transformaciones Automáticas

| Campo Original | Campo Guardado | Transformación |
|----------------|----------------|----------------|
| `tipoControl` | `control` | Normalización |
| `tipoInstalacion` | `instalacion` | Normalización |
| `tipoFijacion` | `fijacion` | Normalización |
| `modoOperacion` | `operacion` | Normalización |
| `detalleTecnico` | `detalle` | Normalización |
| `sistema` (Array) | `sistema` (String) | Join con ", " |
| Números | Redondeados | `roundNumber(valor, 4)` |

---

## 3. ORDEN DE TALLER

### Fuente de Datos (Prioridad)
1. `proyecto.productos[]` (si existe)
2. `proyecto.levantamiento.partidas[]` (fallback)

### Mapeo de Campos

**DE PRODUCTOS:**
```javascript
{
  numero: index + 1,
  ubicacion: producto.ubicacion || "Pieza N",
  ancho: Number(producto.ancho),
  alto: Number(producto.alto),
  area: Number(producto.area),
  sistema: mapearSistema(producto),  // Ver lógica abajo
  control: producto.control || "No especificado",
  // ... resto de 13 campos técnicos
  galeriaCompartida: Boolean(producto.galeriaCompartida),
  grupoGaleria: producto.grupoGaleria || null,
  sistemaSkyline: Boolean(producto.sistemaSkyline),
  motorCompartido: Boolean(producto.motorCompartido),
  grupoMotor: producto.grupoMotor || null,
  piezasPorMotor: Number(producto.piezasPorMotor) || 1
}
```

**DE LEVANTAMIENTO:**
```javascript
{
  numero: numeroPieza++,
  ubicacion: partida.ubicacion || "Pieza N",
  ancho: Number(pieza.ancho),
  alto: Number(pieza.alto),
  area: Number(pieza.m2 || pieza.area),
  sistema: mapearSistema(pieza),
  control: pieza.control || "No especificado",
  tipoInstalacion: pieza.instalacion || "Techo",
  tipoFijacion: pieza.fijacion || "Tablaroca",
  // ... resto de campos
  galeriaCompartida: Boolean(pieza.galeriaCompartida),
  sistemaSkyline: Boolean(pieza.sistemaSkyline),
  motorCompartido: Boolean(pieza.motorCompartido)
}
```

### Lógica de Mapeo de Sistema

```javascript
function mapearSistema(item) {
  let sistema = item.sistema;
  
  if (!sistema || sistema === 'Enrollable' || sistema === 'No especificado') {
    const nombre = (item.nombre || item.producto || '').toLowerCase();
    const tela = (item.telaMarca || '').toLowerCase();
    
    if (nombre.includes('sheer') || tela.includes('sheer')) {
      return 'Sheer Elegance';
    } else if (nombre.includes('toldo') || nombre.includes('contempo')) {
      return 'Toldos Contempo';
    } else {
      return 'Roller Shade';  // Default
    }
  }
  
  return sistema;
}
```

### Campos que NO se Incluyen

❌ **Excluidos de orden de taller:**
- Todos los precios (`precioM2`, `subtotal`, `total`, etc.)
- Campos financieros
- Campos de UI del frontend
- Campos de seguimiento comercial

---

## 4. LISTA DE PEDIDO

### Cálculo de Materiales

**Servicio:** `OptimizadorCortesService`

**Por Pieza:**
1. **Tela:** `area × 1.1` (10% merma)
2. **Tubo:** `ancho + 0.1m` (10cm adicional)
3. **Soportes:** Calculado según ancho
4. **Contrapeso:** Calculado según ancho y alto

### Campos Usados

- `pieza.ancho` → Largo de tubo
- `pieza.alto` → Cálculo de contrapeso
- `pieza.area` → Cantidad de tela
- `pieza.sistema` → Tipo de materiales
- `pieza.telaMarca` → Descripción de tela
- `pieza.rotada` → Decisión de ancho de rollo

### Decisión de Rotada

```javascript
// Pieza se considera rotada si:
pieza.rotada === true ||
pieza.detalle === 'rotada' ||
pieza.detalleTecnico === 'rotada' ||
pieza.ancho > 3.0  // Automático si ancho > 3m
```

### Decisión de Ancho de Rollo

```javascript
if (pieza.rotada) {
  anchoRollo = pieza.alto;  // Usa el alto como ancho
} else {
  anchoRollo = pieza.ancho;  // Usa el ancho normal
}
```

### Consolidado Final

```javascript
{
  telas: [
    {
      descripcion: "Shades Blackout",
      cantidad: 45.5,
      unidad: "m²",
      anchoRollo: 2.8,
      piezas: [1, 2, 3]  // Números de piezas
    }
  ],
  tubos: [
    {
      descripcion: "Tubo 38mm",
      cantidad: 12.5,
      unidad: "ml",
      cortes: ["1.8m", "2.5m", "3.0m"],
      optimizacion: "2 tubos de 6m"
    }
  ],
  contrapesos: [...],
  soportes: [...]
}
```

---

## 5. CAMPOS NO USADOS

### Del Levantamiento que NO se Usan

❌ **Ignorados completamente:**
- `partida.fotos[]` - NO se usan en orden de taller
- `levantamiento.fotosGenerales[]` - NO se usan en orden
- `levantamiento.linkVideo` - NO se usa
- `partida.motorizacion.*` - Se lee pero NO se incluye en PDF
- `partida.instalacionEspecial.*` - Se lee pero NO se incluye en PDF

### Campos Descartados en Normalización

❌ **Se eliminan:**
- Campos temporales del frontend (`_id` temporal, `isEditing`, `isNew`)
- Campos de UI (`expanded`, `selected`, `highlighted`)

### Datos Generados Automáticamente

✅ **Auto-generados (NO vienen del frontend):**
- `proyecto.numero` - "P-YYYY-XXX"
- `fecha_creacion` - `Date.now()`
- `fecha_actualizacion` - `Date.now()`
- `levantamiento.actualizadoEn` - `Date.now()`
- `pieza.numero` - Secuencial en orden de taller

---

## 6. EJEMPLO JSON REAL

```json
{
  "levantamiento": {
    "partidas": [
      {
        "ubicacion": "Sala",
        "producto": "blackout",
        "color": "Blanco",
        "modelo": "ROLLER-001",
        "cantidad": 1,
        "piezas": [
          {
            "ancho": 1.8,
            "alto": 2.5,
            "m2": 4.5,
            "sistema": "Enrollable",
            "control": "izquierda",
            "instalacion": "techo",
            "fijacion": "concreto",
            "caida": "normal",
            "galeria": "galeria",
            "telaMarca": "Shades",
            "baseTabla": "7",
            "operacion": "motorizado",
            "detalle": "doble_sistema",
            "traslape": "",
            "modeloCodigo": "ROLLER-001",
            "color": "Blanco",
            "observacionesTecnicas": "1 motor sube 2 cortinas",
            "galeriaCompartida": true,
            "grupoGaleria": "A",
            "sistemaSkyline": false,
            "motorCompartido": true,
            "grupoMotor": "M1",
            "piezasPorMotor": 3
          }
        ]
      }
    ],
    "totales": {
      "m2": 4.5,
      "subtotal": 2250,
      "descuento": 0,
      "iva": 360,
      "total": 2610
    }
  },
  "proyecto": {
    "numero": "P-2024-001",
    "tipo": "proyecto",
    "estado": "fabricacion",
    "estadoComercial": "en_fabricacion",
    "cliente": {
      "nombre": "Juan Pérez",
      "telefono": "123-456-7890"
    },
    "total": 2610
  },
  "orden_taller": {
    "proyecto": {
      "numero": "P-2024-001",
      "estado": "fabricacion"
    },
    "cliente": {
      "nombre": "Juan Pérez",
      "telefono": "123-456-7890"
    },
    "piezas": [
      {
        "numero": 1,
        "ubicacion": "Sala",
        "sistema": "Roller Shade",
        "control": "izquierda",
        "tipoInstalacion": "techo",
        "tipoFijacion": "concreto",
        "caida": "normal",
        "galeria": "galeria",
        "telaMarca": "Shades",
        "baseTabla": "7",
        "modoOperacion": "motorizado",
        "detalleTecnico": "doble_sistema",
        "ancho": 1.8,
        "alto": 2.5,
        "area": 4.5,
        "motorizado": true,
        "color": "Blanco",
        "galeriaCompartida": true,
        "grupoGaleria": "A",
        "motorCompartido": true,
        "grupoMotor": "M1",
        "piezasPorMotor": 3
      }
    ]
  },
  "lista_pedido": {
    "telas": [
      {
        "descripcion": "Shades Blackout",
        "cantidad": 4.95,
        "unidad": "m²",
        "anchoRollo": 1.8
      }
    ],
    "tubos": [
      {
        "descripcion": "Tubo 38mm",
        "cantidad": 1.9,
        "unidad": "ml"
      }
    ]
  }
}
```

---

## ✅ FIRMA DEL DATA CONTRACT

- **Estado:** Confirmado como versión oficial del modelo de datos vigente.
- **Revisión:** 24 Nov 2025 — verificada contra `server/models/Proyecto.js` y servicios asociados.
- **Responsables:** Equipo Desarrollo CRM Sundeck + Agente Cascade.
- **Acción requerida:** Cualquier cambio estructural debe actualizar este documento en el mismo PR.

---

**Última actualización:** 20 Nov 2025  
**Mantenido por:** Equipo Sundeck  
**Versión:** 2.0 (Post-Fase 4)
