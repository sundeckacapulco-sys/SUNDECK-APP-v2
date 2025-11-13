# 🔄 FLUJO: PAGO → FABRICACIÓN

**Fecha:** 13 Nov 2025  
**Estado:** ✅ IMPLEMENTADO  
**Propósito:** Automatizar el flujo desde que se recibe el anticipo hasta que inicia fabricación

---

## 🎯 FLUJO COMPLETO

### 1️⃣ Cliente Aprueba Cotización
```
Estado: cotizacion → aprobado
```

**Acciones:**
- ✅ Proyecto cambia a estado "aprobado"
- ✅ Se muestra botón "💰 Registrar Anticipo"
- ✅ KPI muestra anticipo esperado (60%)

---

### 2️⃣ Se Recibe el Anticipo
```
Usuario hace clic en "💰 Registrar Anticipo"
```

**Modal se abre con:**
- Monto sugerido: $39,253.69 (60%)
- Sugerencias de redondeo
- Campos de pago
- Sección de facturación (opcional)

**Usuario completa:**
1. Ajusta monto si es necesario
2. Selecciona método de pago
3. Ingresa referencia
4. Sube comprobante
5. (Opcional) Marca "Requiere factura"
6. (Opcional) Ingresa correo y sube constancia

---

### 3️⃣ Sistema Registra el Pago
```
POST /api/proyectos/:id/pagos/anticipo
```

**Backend ejecuta:**

#### A. Guarda información del pago
```javascript
proyecto.pagos.anticipo = {
  monto: 40000,
  porcentaje: 60,
  fechaPago: "2025-11-13",
  metodoPago: "transferencia",
  referencia: "SPEI-123456",
  comprobante: "/uploads/comprobantes/...",
  pagado: true
}
```

#### B. Actualiza información de facturación
```javascript
proyecto.requiere_factura = true;
proyecto.cliente.correo = "cliente@ejemplo.com";
proyecto.constancia_fiscal = "/uploads/constancias/...";
proyecto.metodo_pago_anticipo = "transferencia";
```

#### C. Calcula saldo pendiente
```javascript
proyecto.pagos.saldo.monto = total - anticipo;
// $65,422.81 - $40,000 = $25,422.81
```

---

### 4️⃣ 🚨 Sistema Crea Alerta de Fabricación
```javascript
Notificacion.create({
  tipo: 'anticipo_recibido',
  prioridad: 'alta',
  titulo: '💰 Anticipo Recibido - Listo para Fabricación',
  mensaje: 'El proyecto 2025-ARQ-HECTOR-003 ha recibido el anticipo...',
  destinatarios: ['fabricacion', 'admin'],
  proyecto: proyectoId,
  datos: {
    proyectoNumero: '2025-ARQ-HECTOR-003',
    clienteNombre: 'Arq. Hector Huerta',
    montoAnticipo: 40000,
    metodoPago: 'transferencia',
    requiereFactura: true
  }
})
```

**Destinatarios:**
- 👷 Equipo de fabricación
- 👨‍💼 Administradores

---

### 5️⃣ 📊 Sistema Actualiza Estado del Proyecto
```javascript
if (proyecto.estado === 'aprobado') {
  proyecto.estado = 'fabricacion';
  proyecto.estadoComercial = 'en_fabricacion';
}
```

**Cambio de estado:**
```
aprobado → fabricacion
```

**Progreso:**
```
40% → 60%
```

---

### 6️⃣ 🔔 Equipo de Fabricación Recibe Alerta

**Notificación aparece en:**
- 🔔 Centro de notificaciones
- 📧 Email (si está configurado)
- 📱 Push notification (si está configurado)

**Contenido de la alerta:**
```
┌─────────────────────────────────────────┐
│ 💰 Anticipo Recibido - Listo para      │
│    Fabricación                          │
├─────────────────────────────────────────┤
│ Proyecto: 2025-ARQ-HECTOR-003           │
│ Cliente: Arq. Hector Huerta             │
│ Anticipo: $40,000.00                    │
│ Método: Transferencia                   │
│ Requiere factura: Sí                    │
│                                         │
│ [Ver Proyecto] [Iniciar Fabricación]   │
└─────────────────────────────────────────┘
```

---

### 7️⃣ 👷 Fabricación Revisa el Proyecto

**Checklist de revisión:**

#### ✅ Información del Cliente
- [x] Nombre completo
- [x] Teléfono
- [x] Dirección
- [x] Correo (si requiere factura)

#### ✅ Información de Pago
- [x] Anticipo recibido
- [x] Comprobante de pago
- [x] Método de pago
- [x] Referencia

#### ✅ Información de Facturación (si aplica)
- [x] Requiere factura: Sí/No
- [x] Correo del cliente
- [x] Constancia fiscal

#### ✅ Información Técnica
- [x] Medidas del proyecto
- [x] Productos a fabricar
- [x] Especificaciones
- [x] Observaciones

#### ⚠️ Información Pendiente (ajustar)
- [ ] Días de entrega estimados
- [ ] Fecha de entrega estimada
- [ ] Detalles en PDF

---

### 8️⃣ 🏭 Inicia Fabricación

**Fabricación hace clic en "Iniciar Fabricación"**

**Sistema ejecuta:**
1. Genera etiquetas de producción con QR
2. Crea orden de fabricación
3. Asigna a operarios
4. Calcula materiales necesarios
5. Actualiza inventario

**Estado del proyecto:**
```
fabricacion (activo) → fabricacion (en proceso)
```

---

## 📊 DIAGRAMA DE FLUJO

```
┌─────────────────┐
│ Cliente Aprueba │
│   Cotización    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Estado:         │
│ "aprobado"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Usuario Registra│
│    Anticipo     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend Guarda  │
│ Pago + Info     │
└────────┬────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ Crea Alerta     │   │ Cambia Estado   │
│ Fabricación     │   │ "fabricacion"   │
└────────┬────────┘   └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
         ┌─────────────────┐
         │ Equipo Recibe   │
         │    Alerta       │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Revisa Proyecto │
         │ y Documentos    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ Inicia          │
         │ Fabricación     │
         └─────────────────┘
```

---

## 🔍 LOGS Y TRAZABILIDAD

### Registro del Anticipo
```
2025-11-13 14:00:00 [info] Anticipo registrado exitosamente
{
  proyectoId: "673456789abc123def456789",
  monto: 40000,
  metodoPago: "transferencia",
  usuario: "Juan Pérez"
}
```

### Creación de Alerta
```
2025-11-13 14:00:01 [info] 🔔 Alerta de fabricación creada
{
  proyectoId: "673456789abc123def456789",
  tipo: "anticipo_recibido"
}
```

### Cambio de Estado
```
2025-11-13 14:00:02 [info] 📊 Estado del proyecto actualizado a fabricación
{
  proyectoId: "673456789abc123def456789",
  estadoAnterior: "aprobado",
  estadoNuevo: "fabricacion"
}
```

---

## 🎯 PRÓXIMAS MEJORAS

### Fase 1 (Actual) ✅
- [x] Registro de anticipo
- [x] Creación de alerta
- [x] Cambio de estado automático
- [x] Logs estructurados

### Fase 2 (Próxima)
- [ ] Calcular días de entrega automáticamente
- [ ] Completar información en PDF
- [ ] Notificaciones por email
- [ ] Dashboard de fabricación

### Fase 3 (Futura)
- [ ] Generación automática de etiquetas
- [ ] Asignación automática de operarios
- [ ] Cálculo de materiales
- [ ] Integración con inventario

---

## 🛠️ COMANDOS ÚTILES

### Ver alertas de fabricación
```bash
# MongoDB
db.notificaciones.find({ 
  tipo: 'anticipo_recibido',
  activa: true 
}).pretty()
```

### Ver proyectos en fabricación
```bash
db.proyectos.find({ 
  estado: 'fabricacion',
  'pagos.anticipo.pagado': true 
}).pretty()
```

### Ver logs de pagos
```bash
Get-Content "logs\combined-2025-11-13.log" | Select-String -Pattern "Anticipo registrado|Alerta de fabricación"
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Backend ✅
- [x] Endpoint de registro de anticipo
- [x] Creación de notificación
- [x] Cambio de estado automático
- [x] Logs estructurados
- [x] Validaciones completas

### Frontend ⚠️
- [x] Modal de registro de pago
- [x] Formulario completo
- [x] Validaciones
- [ ] Centro de notificaciones (pendiente)
- [ ] Vista de alertas de fabricación (pendiente)

### Documentación ✅
- [x] Flujo completo documentado
- [x] Diagrama de flujo
- [x] Logs y trazabilidad
- [x] Próximas mejoras

---

**Estado:** ✅ FLUJO BÁSICO IMPLEMENTADO  
**Próximo paso:** Implementar centro de notificaciones en frontend  
**Tiempo estimado:** 2-3 horas
