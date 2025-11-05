# 🎯 INSTRUCCIONES PARA AGENTE - FASE 2: EVENT BUS SERVICE

**Fecha:** 5 Noviembre 2025  
**Fase:** 2 - Orquestación y Automatización  
**Sprint:** 1 (Semanas 1-2)  
**Tiempo estimado:** 2-3 semanas

---

## 📖 PASO 1: LEER DOCUMENTACIÓN (30 min)

Lee estos 4 documentos EN ORDEN:

1. **`docs/fase2/01_EVENT_DRIVEN_ARCHITECTURE.md`**
   - Fundamentos de Event-Driven Architecture
   - Ventajas para Sundeck CRM
   - Arquitectura propuesta
   - Componentes del sistema

2. **`docs/fase2/02_DIAGRAMA_EVENTOS.md`**
   - Flujo completo de eventos
   - Catálogo de eventos por módulo
   - Cadenas de eventos automáticas
   - Matriz de listeners

3. **`docs/fase2/03_EVENTOS_CRITICOS.md`**
   - 3 eventos prioritarios
   - Datos de cada evento
   - Listeners requeridos
   - Condiciones de activación

4. **`docs/fase2/04_ESTRUCTURA_BASICA.md`**
   - Código completo para implementar
   - Estructura de archivos
   - Plantillas de código
   - Checklist de implementación

---

## 🎯 PASO 2: IMPLEMENTAR EVENT BUS (Semana 1)

### Día 1-2: Modelo y Service Base

**Tareas:**
1. Crear `server/models/Event.js`
2. Crear `server/services/eventBusService.js`
3. Implementar métodos `on()` y `emit()`

**Resultado esperado:**
```javascript
// Debe funcionar:
const eventBus = require('./services/eventBusService');

eventBus.on('test.evento', {
  handle: async (event) => {
    console.log('Evento recibido:', event);
  }
});

await eventBus.emit('test.evento', { mensaje: 'Hola' });
```

---

### Día 3-4: Listeners Base

**Tareas:**
1. Crear `server/listeners/BaseListener.js`
2. Crear `server/listeners/pedidoListener.js`
3. Crear `server/listeners/index.js`

**Resultado esperado:**
- Listeners registrados correctamente
- Método `handle()` implementado
- Logging funcionando

---

### Día 5: Integración y Tests

**Tareas:**
1. Registrar listeners en `server/index.js`
2. Crear tests unitarios básicos
3. Verificar persistencia en MongoDB

**Resultado esperado:**
- Event Bus inicializado al arrancar servidor
- Tests pasando
- Eventos guardados en MongoDB

---

## 🎯 PASO 3: IMPLEMENTAR EVENTOS CRÍTICOS (Semana 2)

### Día 6-7: Evento `cotizacion.aprobada`

**Tareas:**
1. Emitir evento desde `CotizacionController`
2. Implementar lógica en `PedidoListener`
3. Validar creación automática de pedidos

**Código a agregar en controller:**
```javascript
await eventBus.emit('cotizacion.aprobada', {
  cotizacionId: cotizacion._id,
  monto: cotizacion.total,
  anticipo: cotizacion.anticipo,
  productos: cotizacion.productos
}, 'CotizacionController', req.user._id);
```

**Resultado esperado:**
- Evento emitido correctamente
- Pedido creado automáticamente
- Evento `pedido.creado` emitido

---

### Día 8-9: Evento `pedido.anticipo_pagado`

**Tareas:**
1. Crear `server/listeners/fabricacionListener.js`
2. Emitir evento desde `PedidoController`
3. Implementar creación de orden de fabricación

**Resultado esperado:**
- Orden de fabricación creada automáticamente
- Evento `fabricacion.iniciada` emitido

---

### Día 10: Evento `fabricacion.completada`

**Tareas:**
1. Crear `server/listeners/instalacionListener.js`
2. Emitir evento desde `FabricacionController`
3. Implementar notificación para instalación

**Resultado esperado:**
- Notificación enviada
- Cliente contactado para programar

---

## 📊 PASO 4: VALIDACIÓN Y DOCUMENTACIÓN (Días 11-12)

### Validaciones Requeridas:

1. **Persistencia:**
   ```bash
   # Verificar eventos en MongoDB
   mongosh sundeck-crm --eval "db.events.find().limit(5)"
   ```

2. **Listeners:**
   ```bash
   # Verificar que listeners se ejecuten
   # Logs deben mostrar: "Listener procesado exitosamente"
   ```

3. **Flujo completo:**
   - Aprobar cotización → Pedido creado ✅
   - Pagar anticipo → Fabricación iniciada ✅
   - Completar fabricación → Notificación enviada ✅

### Documentación:

1. Crear `docs/fase2/IMPLEMENTACION_EVENT_BUS.md`
2. Documentar eventos implementados
3. Agregar ejemplos de uso
4. Actualizar `CHANGELOG.md`

---

## ✅ CRITERIOS DE ÉXITO

### Funcionalidad:
- [ ] Event Bus operativo
- [ ] 3 eventos críticos implementados
- [ ] 3 listeners funcionando
- [ ] Persistencia en MongoDB
- [ ] Logging completo

### Calidad:
- [ ] Tests unitarios pasando
- [ ] Sin errores en logs
- [ ] Código documentado
- [ ] Siguiendo estándares del proyecto

### Automatización:
- [ ] Pedidos creados automáticamente
- [ ] Fabricación iniciada automáticamente
- [ ] Notificaciones enviadas automáticamente

---

## 📊 MÉTRICAS ESPERADAS

Al finalizar, debes reportar:

```markdown
## Resultados de Implementación

### Eventos Implementados:
- cotizacion.aprobada: ✅
- pedido.anticipo_pagado: ✅
- fabricacion.completada: ✅

### Listeners Creados:
- PedidoListener: ✅
- FabricacionListener: ✅
- InstalacionListener: ✅

### Tests:
- Event Bus: X/X pasando
- Listeners: X/X pasando
- Integración: X/X pasando

### Eventos Registrados en BD:
- Total eventos: X
- Eventos procesados: X
- Eventos con error: X

### Automatización:
- Pedidos creados automáticamente: X
- Fabricaciones iniciadas: X
- Notificaciones enviadas: X
```

---

## 🚨 SI ENCUENTRAS PROBLEMAS

### Problema: Listeners no se ejecutan
**Solución:**
1. Verificar que listeners estén registrados en `index.js`
2. Verificar que `registrarListeners()` se llame después de conectar a MongoDB
3. Revisar logs para ver errores

### Problema: Eventos no se guardan en MongoDB
**Solución:**
1. Verificar conexión a MongoDB
2. Verificar que modelo `Event` esté correctamente definido
3. Revisar permisos de escritura

### Problema: Tests fallan
**Solución:**
1. Verificar que MongoDB de prueba esté corriendo
2. Limpiar colección de eventos antes de cada test
3. Usar mocks para dependencias externas

---

## 📁 ARCHIVOS A CREAR

```
server/
├── models/
│   └── Event.js                         ← NUEVO
├── services/
│   └── eventBusService.js               ← NUEVO
├── listeners/
│   ├── BaseListener.js                  ← NUEVO
│   ├── index.js                         ← NUEVO
│   ├── pedidoListener.js                ← NUEVO
│   ├── fabricacionListener.js           ← NUEVO
│   └── instalacionListener.js           ← NUEVO
├── tests/
│   ├── services/
│   │   └── eventBusService.test.js      ← NUEVO
│   └── listeners/
│       └── pedidoListener.test.js       ← NUEVO
└── controllers/
    ├── cotizacionController.js          ← MODIFICAR
    ├── pedidoController.js              ← MODIFICAR
    └── fabricacionController.js         ← MODIFICAR
```

**Total:** 9 archivos nuevos, 3 modificados

---

## 🎯 RESULTADO FINAL ESPERADO

Al completar esta fase, el sistema debe:

1. ✅ **Automatizar creación de pedidos**
   - Cotización aprobada → Pedido creado automáticamente

2. ✅ **Automatizar inicio de fabricación**
   - Anticipo pagado → Fabricación iniciada automáticamente

3. ✅ **Automatizar notificaciones**
   - Fabricación completada → Cliente notificado

4. ✅ **Trazabilidad completa**
   - Todos los eventos registrados en MongoDB
   - Historial consultable

5. ✅ **Base para Fase 2.2**
   - Event Bus listo para agregar más eventos
   - Listeners listos para expandir

---

## 📋 CHECKLIST FINAL

Antes de marcar como completado, verificar:

- [ ] Todos los archivos creados
- [ ] Código siguiendo estándares del proyecto
- [ ] Tests unitarios pasando
- [ ] Logging implementado
- [ ] Documentación actualizada
- [ ] CHANGELOG.md actualizado
- [ ] Sin errores en consola
- [ ] Flujo completo probado manualmente
- [ ] Eventos persistidos en MongoDB
- [ ] Listeners ejecutándose correctamente

---

## 📤 FORMATO DE ENTREGA

Al finalizar, proporciona:

```markdown
## ✅ FASE 2.1 COMPLETADA: EVENT BUS SERVICE

### Estado: EXITOSA

### Archivos Creados: 9
- server/models/Event.js
- server/services/eventBusService.js
- server/listeners/BaseListener.js
- server/listeners/index.js
- server/listeners/pedidoListener.js
- server/listeners/fabricacionListener.js
- server/listeners/instalacionListener.js
- server/tests/services/eventBusService.test.js
- server/tests/listeners/pedidoListener.test.js

### Archivos Modificados: 3
- server/controllers/cotizacionController.js
- server/controllers/pedidoController.js
- server/controllers/fabricacionController.js

### Tests: X/X pasando (100%)

### Eventos Implementados:
- cotizacion.aprobada ✅
- pedido.anticipo_pagado ✅
- fabricacion.completada ✅

### Automatización:
- Pedidos creados automáticamente: X
- Fabricaciones iniciadas: X
- Notificaciones enviadas: X

### Documentación:
- docs/fase2/IMPLEMENTACION_EVENT_BUS.md ✅
- CHANGELOG.md actualizado ✅

### Próximo Paso:
Fase 2.2 - Motor de Reglas Declarativas
```

---

**Tiempo estimado total:** 2-3 semanas  
**Complejidad:** Media  
**Prioridad:** CRÍTICA

**¿Listo para empezar?** 🚀
