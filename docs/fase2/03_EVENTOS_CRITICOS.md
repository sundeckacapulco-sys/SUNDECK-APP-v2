# 🎯 Eventos Críticos - Lista Priorizada

**Fecha:** 5 Noviembre 2025  
**Fase:** 2 - Orquestación y Automatización  
**Propósito:** Definir eventos a implementar primero

---

## 🔴 PRIORIDAD CRÍTICA (Sprint 1 - Semanas 1-2)

### 1. `cotizacion.aprobada` ⭐⭐⭐

**Importancia:** CRÍTICA  
**Impacto:** Automatiza creación de pedidos  
**Frecuencia:** Alta (5-10 veces/semana)

**Trigger:**
- Cliente acepta cotización
- Anticipo está confirmado

**Datos del Evento:**
```javascript
{
  cotizacionId: ObjectId,
  numero: 'COT-2025-0001',
  monto: 12500,
  cliente: {
    id: ObjectId,
    nombre: 'Juan Pérez',
    telefono: '7441234567'
  },
  anticipo: {
    porcentaje: 60,
    monto: 7500,
    pagado: true,
    metodoPago: 'transferencia'
  },
  productos: [{
    nombre: 'Persiana Screen 3%',
    cantidad: 3,
    m2: 15.5
  }]
}
```

**Listeners:**
1. **PedidoListener** → Crear pedido automáticamente
2. **KPIListener** → Actualizar métricas de conversión
3. **NotificacionListener** → Notificar al equipo

**Condiciones de Activación:**
- ✅ Anticipo debe estar pagado
- ✅ Cliente debe estar activo
- ✅ Productos deben estar disponibles

**Resultado Esperado:**
- Pedido creado automáticamente
- Estado: 'confirmado'
- Notificación enviada
- KPIs actualizados

---

### 2. `pedido.anticipo_pagado` ⭐⭐⭐

**Importancia:** CRÍTICA  
**Impacto:** Inicia fabricación automáticamente  
**Frecuencia:** Alta (5-10 veces/semana)

**Trigger:**
- Pago de anticipo confirmado
- Monto correcto recibido

**Datos del Evento:**
```javascript
{
  pedidoId: ObjectId,
  numero: 'PED-2025-0001',
  cotizacionId: ObjectId,
  anticipo: {
    monto: 7500,
    metodoPago: 'transferencia',
    referencia: 'REF123',
    fecha: ISODate
  },
  productos: [{
    nombre: 'Persiana Screen 3%',
    cantidad: 3,
    requiereR24: false
  }]
}
```

**Listeners:**
1. **FabricacionListener** → Crear orden de fabricación
2. **KPIListener** → Actualizar flujo de caja
3. **NotificacionListener** → Notificar a producción

**Condiciones de Activación:**
- ✅ Monto debe coincidir con anticipo esperado
- ✅ Método de pago debe estar validado
- ✅ No debe existir orden de fabricación previa

**Resultado Esperado:**
- Orden de fabricación creada
- Estado: 'en_fabricacion'
- Etiquetas QR generadas
- Notificación a producción

---

### 3. `fabricacion.completada` ⭐⭐⭐

**Importancia:** CRÍTICA  
**Impacto:** Activa proceso de instalación  
**Frecuencia:** Media (3-5 veces/semana)

**Trigger:**
- Todos los productos fabricados
- Control de calidad aprobado

**Datos del Evento:**
```javascript
{
  fabricacionId: ObjectId,
  pedidoId: ObjectId,
  numero: 'FAB-2025-0001',
  productos: [{
    nombre: 'Persiana Screen 3%',
    cantidad: 3,
    calidad: 'aprobado',
    ubicacion: 'Almacén A'
  }],
  tiempoTotal: 15,  // días
  fechaInicio: ISODate,
  fechaFin: ISODate
}
```

**Listeners:**
1. **InstalacionListener** → Notificar para programar
2. **KPIListener** → Actualizar tiempos de fabricación
3. **NotificacionListener** → Notificar al cliente

**Condiciones de Activación:**
- ✅ Todos los productos deben estar completos
- ✅ Control de calidad debe estar aprobado
- ✅ Productos deben estar en almacén

**Resultado Esperado:**
- Notificación al cliente
- Programación de instalación sugerida
- KPIs de fabricación actualizados

---

## 🟡 PRIORIDAD ALTA (Sprint 2 - Semanas 3-4)

### 4. `pedido.creado`

**Importancia:** ALTA  
**Impacto:** Inicia flujo operativo  
**Frecuencia:** Alta

**Datos:**
```javascript
{
  pedidoId: ObjectId,
  cotizacionId: ObjectId,
  numero: 'PED-2025-0001',
  monto: 12500,
  estado: 'confirmado'
}
```

**Listeners:**
- KPIListener
- NotificacionListener

---

### 5. `instalacion.completada`

**Importancia:** ALTA  
**Impacto:** Cierra ciclo operativo  
**Frecuencia:** Media

**Datos:**
```javascript
{
  instalacionId: ObjectId,
  pedidoId: ObjectId,
  fecha: ISODate,
  conformidad: true,
  fotos: [String],
  observaciones: String
}
```

**Listeners:**
- EntregaListener
- KPIListener
- PostventaListener

---

### 6. `fabricacion.iniciada`

**Importancia:** ALTA  
**Impacto:** Tracking de producción  
**Frecuencia:** Alta

**Datos:**
```javascript
{
  fabricacionId: ObjectId,
  pedidoId: ObjectId,
  productos: Array,
  fechaEstimada: ISODate
}
```

**Listeners:**
- KPIListener
- NotificacionListener

---

## 🟢 PRIORIDAD MEDIA (Sprint 3 - Semanas 5-6)

### 7. `cotizacion.enviada`
### 8. `levantamiento.completado`
### 9. `instalacion.programada`
### 10. `pedido.saldo_pagado`

---

## ⚪ PRIORIDAD BAJA (Futuro)

### 11. `prospecto.creado`
### 12. `cotizacion.vencida`
### 13. `fabricacion.pausada`
### 14. `sistema.error`

---

## 📊 Matriz de Implementación

| # | Evento | Sprint | Complejidad | Impacto | Listeners |
|---|--------|--------|-------------|---------|-----------|
| 1 | `cotizacion.aprobada` | 1 | Media | ⭐⭐⭐ | 3 |
| 2 | `pedido.anticipo_pagado` | 1 | Media | ⭐⭐⭐ | 3 |
| 3 | `fabricacion.completada` | 1 | Baja | ⭐⭐⭐ | 3 |
| 4 | `pedido.creado` | 2 | Baja | ⭐⭐ | 2 |
| 5 | `instalacion.completada` | 2 | Media | ⭐⭐ | 3 |
| 6 | `fabricacion.iniciada` | 2 | Baja | ⭐⭐ | 2 |

---

## 🔄 Flujo de Implementación

### Semana 1: Event Bus Base
- Crear `eventBusService.js`
- Crear modelo `Event.js`
- Implementar `emit()` y `on()`
- Tests unitarios

### Semana 2: Eventos Críticos (1-3)
- Implementar `cotizacion.aprobada`
- Implementar `pedido.anticipo_pagado`
- Implementar `fabricacion.completada`
- Crear listeners correspondientes

### Semana 3: Eventos Alta Prioridad (4-6)
- Implementar eventos restantes
- Crear listeners adicionales
- Tests de integración

### Semana 4: Refinamiento
- Optimizaciones
- Manejo de errores
- Documentación

---

## ✅ Checklist de Evento Crítico

Para cada evento crítico, verificar:

- [ ] **Definición clara**
  - [ ] Nombre del evento
  - [ ] Trigger específico
  - [ ] Datos requeridos

- [ ] **Listeners identificados**
  - [ ] Lista de listeners
  - [ ] Acciones de cada listener
  - [ ] Orden de ejecución

- [ ] **Condiciones de activación**
  - [ ] Validaciones requeridas
  - [ ] Datos mínimos necesarios
  - [ ] Estados válidos

- [ ] **Resultado esperado**
  - [ ] Cambios en BD
  - [ ] Notificaciones enviadas
  - [ ] KPIs actualizados

- [ ] **Manejo de errores**
  - [ ] ¿Qué pasa si falla?
  - [ ] ¿Se reintenta?
  - [ ] ¿Se notifica?

---

## 📋 Plantilla de Evento

```javascript
// Nombre: [modulo].[accion]
// Prioridad: CRÍTICA | ALTA | MEDIA | BAJA
// Sprint: 1 | 2 | 3 | Futuro

{
  // Identificación
  tipo: 'modulo.accion',
  
  // Datos mínimos requeridos
  datos: {
    [moduloId]: ObjectId,  // REQUERIDO
    // ... otros datos
  },
  
  // Metadata
  origen: 'NombreController',
  timestamp: ISODate,
  
  // Listeners esperados
  listeners: [
    'ListenerA',
    'ListenerB'
  ],
  
  // Condiciones
  condiciones: [
    'campo.x debe ser true',
    'campo.y debe existir'
  ],
  
  // Resultado esperado
  resultado: {
    accion: 'Descripción de la acción',
    cambios: ['Cambio 1', 'Cambio 2']
  }
}
```

---

**Próximo documento:** `04_ESTRUCTURA_BASICA.md`
