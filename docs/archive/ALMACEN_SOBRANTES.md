# Sistema de Almacén y Sobrantes

**Fecha:** 27 Nov 2025  
**Estado:** Implementado ✅

---

## Resumen

Sistema para gestionar el inventario de materiales y los sobrantes de producción. Permite al encargado de taller registrar materiales que llegan y reutilizar sobrantes en futuras órdenes.

---

## Reglas de Negocio

### Sobrantes Permitidos

| Tipo | Subtipos | Notas |
|------|----------|-------|
| **Tubo** | 38mm, 50mm, 70mm, 79mm | Según ancho de persiana |
| **Contrapeso** | Plano, Redondo | Blanco y Negro |
| **Tela** | Todas | Screen, Blackout, Translúcido, etc. |

### Longitudes

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| **Mínimo útil** | 60cm (0.60m) | Menor a esto se desecha |
| **Máximo** | Sin límite | Los rollos pueden llegar de diferentes tamaños |

### Alertas

- **10+ sobrantes** del mismo tipo/diámetro → Avisar para revisar si desechar

---

## Códigos de Materiales en Almacén

### Tubos
| Código | Descripción | Unidad |
|--------|-------------|--------|
| TUB-38 | Tubo Aluminio 38mm | barra |
| TUB-50 | Tubo Aluminio 50mm | barra |
| TUB-70 | Tubo Aluminio 70mm | barra |
| TUB-79 | Tubo Aluminio 79mm | barra |

### Contrapesos
| Código | Descripción | Unidad |
|--------|-------------|--------|
| CP-PLANO-STD | Contrapeso Plano Blanco | barra |
| CP-PLANO-NEG | Contrapeso Plano Negro | barra |
| CP-REDONDO-STD | Contrapeso Redondo Blanco | barra |
| CP-REDONDO-NEG | Contrapeso Redondo Negro | barra |

### Telas
| Código | Descripción | Unidad |
|--------|-------------|--------|
| TEL-SCREEN-5-BLA | Tela Screen 5% Blanco | rollo |
| TEL-SCREEN-5-GRI | Tela Screen 5% Gris | rollo |
| TEL-SCREEN-3-BLA | Tela Screen 3% Blanco | rollo |
| TEL-BLACKOUT-BLA | Tela Blackout Blanco | rollo |
| TEL-BLACKOUT-NEG | Tela Blackout Negro | rollo |
| TEL-TRANSLUCIDO-BLA | Tela Translúcido Blanco | rollo |

---

## API de Sobrantes

### Endpoints

```
GET    /api/sobrantes              - Listar sobrantes disponibles
GET    /api/sobrantes/resumen      - Resumen agrupado por tipo
GET    /api/sobrantes/reglas       - Obtener reglas de configuración
GET    /api/sobrantes/buscar       - Buscar sobrantes para reutilizar
POST   /api/sobrantes              - Registrar un sobrante
POST   /api/sobrantes/orden        - Registrar sobrantes de una orden
POST   /api/sobrantes/:id/usar     - Usar un sobrante en producción
POST   /api/sobrantes/descartar    - Descartar múltiples sobrantes
PUT    /api/sobrantes/:id          - Actualizar sobrante
DELETE /api/sobrantes/:id          - Eliminar (solo si está descartado)
```

### Ejemplos de Uso

#### Registrar sobrante individual
```javascript
POST /api/sobrantes
{
  "tipo": "Tubo",
  "codigo": "TUB-38",
  "descripcion": "Sobrante Tubo 38mm - 85cm",
  "longitud": 0.85,
  "diametro": "38mm"
}
```

#### Registrar sobrantes de una orden de producción
```javascript
POST /api/sobrantes/orden
{
  "proyectoId": "690e69251346d61cfcd5178d",
  "ordenProduccion": "OP-2025-001",
  "sobrantes": [
    { "tipo": "Tubo", "codigo": "TUB-50", "longitud": 0.72, "diametro": "50mm" },
    { "tipo": "Contrapeso", "codigo": "CP-PLANO-STD", "longitud": 0.65, "subtipo": "plano" }
  ]
}
```

#### Buscar sobrantes para reutilizar
```javascript
GET /api/sobrantes/buscar?tipo=Tubo&longitudNecesaria=0.80&diametro=38mm

// Respuesta:
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "longitud": 0.85,
      "desperdicioSiSeUsa": 0.05,
      "eficiencia": 94.1
    }
  ],
  "mejorOpcion": { ... }
}
```

#### Usar un sobrante
```javascript
POST /api/sobrantes/:id/usar
{
  "longitudUsada": 0.80,
  "proyectoId": "..."
}

// Si queda sobrante >= 60cm, se crea nuevo registro automáticamente
```

#### Descartar sobrantes
```javascript
POST /api/sobrantes/descartar
{
  "sobranteIds": ["id1", "id2", "id3"],
  "motivo": "Revisión mensual - material dañado"
}
```

---

## Flujo de Trabajo

### 1. Recepción de Material (Encargado de Taller)

```
┌─────────────────────────────────────────────────────────┐
│  LLEGA MATERIAL AL TALLER                               │
│  (Rollos de tela, barras de tubo, contrapesos)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  REGISTRAR EN ALMACÉN                                   │
│  - Código del material                                  │
│  - Cantidad recibida                                    │
│  - Longitud real (rollos no siempre son 30ml)           │
└─────────────────────────────────────────────────────────┘
```

### 2. Producción y Generación de Sobrantes

```
┌─────────────────────────────────────────────────────────┐
│  ORDEN DE PRODUCCIÓN                                    │
│  - Sistema optimiza cortes                              │
│  - Detecta sobrantes >= 60cm                            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  ¿SOBRANTE >= 60cm?                                     │
│                                                         │
│  SÍ → Registrar en sistema de sobrantes                 │
│  NO → Desechar (no útil para reutilizar)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  ¿HAY 10+ SOBRANTES DEL MISMO TIPO?                     │
│                                                         │
│  SÍ → Generar alerta para revisión                      │
│  NO → Continuar normal                                  │
└─────────────────────────────────────────────────────────┘
```

### 3. Reutilización de Sobrantes

```
┌─────────────────────────────────────────────────────────┐
│  NUEVA ORDEN DE PRODUCCIÓN                              │
│  - Sistema busca sobrantes disponibles                  │
│  - Sugiere el mejor match (menor desperdicio)           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  USAR SOBRANTE                                          │
│  - Marcar como usado                                    │
│  - Si queda >= 60cm, crear nuevo sobrante               │
└─────────────────────────────────────────────────────────┘
```

---

## Archivos del Sistema

| Archivo | Descripción |
|---------|-------------|
| `server/models/SobranteMaterial.js` | Modelo de datos para sobrantes |
| `server/models/Almacen.js` | Modelo de inventario principal |
| `server/services/sobrantesService.js` | Lógica de negocio de sobrantes |
| `server/routes/sobrantes.js` | API REST de sobrantes |
| `server/routes/almacen.js` | API REST de almacén |
| `server/scripts/inicializarMaterialesAlmacen.js` | Script para inicializar materiales |

---

## Integración con Optimizador de Cortes

El `OptimizadorCortesService` tiene métodos para trabajar con sobrantes:

```javascript
// Extraer sobrantes de una optimización
const sobrantes = OptimizadorCortesService.extraerSobrantesDeOptimizacion(
  optimizacion,
  { tipo: 'Tubo', codigo: 'TUB-38', diametro: '38mm' }
);

// Generar reporte completo con sobrantes identificados
const reporte = await OptimizadorCortesService.generarReporteConSobrantes(piezas);
// reporte.sobrantesParaAlmacen = { items: [...], total: N, longitudTotal: X }
```

---

## Pendientes para Módulo de Fabricación

> **NOTA:** Estas funcionalidades se implementarán cuando se desarrolle el módulo de fabricación completo.

1. **Interfaz para encargado de taller:**
   - Registrar materiales que llegan
   - Ver sobrantes disponibles
   - Confirmar sobrantes después de producción

2. **Integración automática:**
   - Al completar orden de producción, sugerir sobrantes a registrar
   - Buscar automáticamente sobrantes antes de usar material nuevo

3. **Reportes:**
   - Sobrantes por período
   - Eficiencia de reutilización
   - Material desechado vs reutilizado

---

## Comandos Útiles

```bash
# Inicializar materiales en almacén
node server/scripts/inicializarMaterialesAlmacen.js

# Ver sobrantes en BD
node -e "const mongoose = require('mongoose'); require('./server/models/SobranteMaterial'); mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => { const s = await mongoose.model('SobranteMaterial').find({estado:'disponible'}).lean(); console.log('Sobrantes:', s.length); s.forEach(x => console.log('-', x.tipo, x.longitud + 'm')); process.exit(0); });"

# Ver inventario de almacén
node -e "const mongoose = require('mongoose'); require('./server/models/Almacen'); mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => { const a = await mongoose.model('Almacen').find({activo:true}).select('codigo descripcion cantidad unidad').lean(); a.forEach(x => console.log(x.codigo, '-', x.cantidad, x.unidad)); process.exit(0); });"
```

---

## Historial de Cambios

| Fecha | Cambio |
|-------|--------|
| 27 Nov 2025 | Implementación inicial del sistema de sobrantes |
| 27 Nov 2025 | Longitud mínima: 60cm, sin límite máximo |
| 27 Nov 2025 | Códigos de materiales inicializados en almacén |
