# 📦 FLUJO DE ALMACÉN DE MATERIALES

**Fecha:** 28 Noviembre 2025  
**Estado:** 📋 DOCUMENTADO | ⏳ PENDIENTE IMPLEMENTACIÓN  
**Tipo:** Híbrido (Reserva + Confirmación Manual)

---

## 🎯 OBJETIVO

Gestionar el flujo de materiales (tubos, contrapesos, telas, madera) desde el almacén hasta fabricación, con trazabilidad completa y control de sobrantes.

---

## 🔄 FLUJO HÍBRIDO (3 ETAPAS)

### ETAPA 1: GENERAR ORDEN DE FABRICACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Usuario genera PDF de Orden de Fabricación            │
├─────────────────────────────────────────────────────────────────┤
│ ACCIONES AUTOMÁTICAS:                                           │
│  1. Calcular materiales necesarios por pieza                    │
│  2. Buscar sobrantes disponibles en almacén                     │
│  3. Optimizar cortes (tubos, contrapesos, madera)               │
│  4. RESERVAR materiales (estado: "reservado")                   │
│  5. Generar plan de cortes en PDF                               │
├─────────────────────────────────────────────────────────────────┤
│ RESULTADO:                                                      │
│  - Materiales marcados como "reservados" para esta orden        │
│  - No disponibles para otros proyectos                          │
│  - PDF incluye lista de materiales a jalar del almacén          │
└─────────────────────────────────────────────────────────────────┘
```

### ETAPA 2: CONFIRMAR USO EN TALLER

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Encargado de taller presiona [✓ Confirmar Uso]        │
├─────────────────────────────────────────────────────────────────┤
│ UBICACIÓN UI: Pantalla de Fabricación del Proyecto              │
├─────────────────────────────────────────────────────────────────┤
│ ACCIONES:                                                       │
│  1. Mostrar lista de materiales reservados                      │
│  2. Permitir ajustar cantidades si es necesario                 │
│  3. Al confirmar:                                               │
│     - Descontar del inventario de almacén                       │
│     - Cambiar estado de "reservado" → "usado"                   │
│     - Registrar fecha y usuario que confirmó                    │
└─────────────────────────────────────────────────────────────────┘
```

### ETAPA 3: REGISTRAR SOBRANTES

```
┌─────────────────────────────────────────────────────────────────┐
│ TRIGGER: Al terminar fabricación de la orden                    │
├─────────────────────────────────────────────────────────────────┤
│ UBICACIÓN UI: Pantalla de Fabricación → [Registrar Sobrantes]  │
├─────────────────────────────────────────────────────────────────┤
│ ACCIONES:                                                       │
│  1. Mostrar sobrantes calculados (sugerencia)                   │
│  2. Permitir ingresar sobrantes REALES                          │
│  3. Validar longitud mínima útil:                               │
│     - Tubos/Contrapesos: >= 0.60m                               │
│     - Madera: >= 0.50m                                          │
│  4. Agregar sobrantes útiles al almacén (estado: "disponible")  │
│  5. Registrar desperdicios (para métricas)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 ESTADOS DE MATERIAL

| Estado | Descripción | Visible en Almacén |
|--------|-------------|-------------------|
| `disponible` | Listo para usar en cualquier proyecto | ✅ Sí |
| `reservado` | Asignado a una orden específica | ⚠️ Con indicador |
| `usado` | Ya fue consumido en fabricación | ❌ No |

---

## 🗃️ TIPOS DE MATERIAL

### 1. TUBOS
- **Longitud estándar:** 5.80m
- **Sobrante mínimo útil:** 0.60m
- **Tipos:** T38, T50, T70, T79

### 2. CONTRAPESOS
- **Longitud estándar:** 5.80m
- **Sobrante mínimo útil:** 0.60m
- **Tipos:** Plano, Redondo (STD/Negro)

### 3. TELAS
- **Presentación:** Rollos (ancho variable: 2.00, 2.50, 3.00m)
- **Unidad:** Metros lineales
- **Sobrante mínimo útil:** Según ancho de rollo

### 4. MADERA (GALERÍA)
- **Longitud estándar:** 2.40m
- **Sobrante mínimo útil:** 0.50m
- **Aplica solo:** Piezas con galería
- **Permite unión:** Sí (cuando ancho > 2.40m)

---

## 🖥️ COMPONENTES UI REQUERIDOS

### En Pantalla de Fabricación:

```
┌─────────────────────────────────────────────────────────────────┐
│ ORDEN DE FABRICACIÓN: 2025-ARQ-HECTOR-003                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📦 MATERIALES DEL ALMACÉN                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Material          │ Cantidad │ Estado     │ Ubicación       │ │
│ ├───────────────────┼──────────┼────────────┼─────────────────┤ │
│ │ Tubo T50 (sob.)   │ 1.20m    │ Reservado  │ Rack A-3        │ │
│ │ Madera (sob.)     │ 0.80m    │ Reservado  │ Rack B-1        │ │
│ │ Tubo T50 (nuevo)  │ 2 barras │ Por pedir  │ -               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [✓ Confirmar Uso de Material]    [📋 Ver Plan de Cortes]       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Al terminar:                                                    │
│ [🪵 Registrar Sobrantes]                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Modal de Registrar Sobrantes:

```
┌─────────────────────────────────────────────────────────────────┐
│ REGISTRAR SOBRANTES DE FABRICACIÓN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Sobrantes calculados (sugerencia):                              │
│ • Tubo T50: 0.85m                                               │
│ • Madera: 0.60m                                                 │
│                                                                 │
│ Sobrantes reales:                                               │
│ ┌─────────────┬────────────┬───────────────┐                    │
│ │ Tipo        │ Longitud   │ ¿Útil?        │                    │
│ ├─────────────┼────────────┼───────────────┤                    │
│ │ Tubo T50    │ [0.80] m   │ ✅ (>= 0.60m) │                    │
│ │ Madera      │ [0.55] m   │ ✅ (>= 0.50m) │                    │
│ │ + Agregar   │            │               │                    │
│ └─────────────┴────────────┴───────────────┘                    │
│                                                                 │
│ [Cancelar]                      [✓ Guardar Sobrantes]           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 ENDPOINTS API REQUERIDOS

### Reservar Materiales
```
POST /api/almacen/reservar
Body: {
  ordenId: "...",
  materiales: [
    { tipo: "Tubo", codigo: "T50", cantidad: 1.20, sobranteId: "..." },
    { tipo: "Madera", cantidad: 0.80, sobranteId: "..." }
  ]
}
```

### Confirmar Uso
```
POST /api/almacen/confirmar-uso
Body: {
  ordenId: "...",
  materiales: [...] // Los reservados
}
```

### Registrar Sobrantes
```
POST /api/almacen/registrar-sobrantes
Body: {
  ordenId: "...",
  sobrantes: [
    { tipo: "Tubo", codigo: "T50", longitud: 0.80 },
    { tipo: "Madera", longitud: 0.55 }
  ]
}
```

### Liberar Reserva (si se cancela orden)
```
POST /api/almacen/liberar-reserva
Body: {
  ordenId: "..."
}
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Agregar campo `estado` a modelo SobranteMaterial
- [ ] Agregar campo `reservadoPara` (ordenId) a SobranteMaterial
- [ ] Crear endpoint POST /api/almacen/reservar
- [ ] Crear endpoint POST /api/almacen/confirmar-uso
- [ ] Crear endpoint POST /api/almacen/registrar-sobrantes
- [ ] Crear endpoint POST /api/almacen/liberar-reserva
- [ ] Integrar reserva automática en generación de orden
- [ ] Agregar madera a optimización de cortes en PDF

### Frontend
- [ ] Sección "Materiales del Almacén" en FabricacionTab
- [ ] Botón "Confirmar Uso de Material"
- [ ] Modal "Registrar Sobrantes"
- [ ] Indicadores visuales de estado (reservado/disponible)
- [ ] Integrar con pantalla de Almacén existente

### PDF
- [ ] Agregar sección "Materiales a Jalar del Almacén" en orden de fabricación
- [ ] Incluir optimización de madera para piezas con galería

---

## 📊 MÉTRICAS A TRACKEAR

- **Aprovechamiento:** % de material usado vs desperdicio
- **Rotación de sobrantes:** Tiempo promedio en almacén antes de usarse
- **Ahorro:** Tablas/tubos nuevos evitados por uso de sobrantes

---

## 🔗 ARCHIVOS RELACIONADOS

- `server/services/optimizadorCortesService.js` - Lógica de optimización
- `server/services/sobrantesService.js` - Gestión de sobrantes
- `server/models/SobranteMaterial.js` - Modelo de datos
- `server/routes/sobrantes.js` - Endpoints actuales
- `docs/ALMACEN_SOBRANTES.md` - Documentación de sobrantes

---

**Versión:** 1.0  
**Autor:** Equipo Sundeck
