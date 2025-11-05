# Fase 1: Sistema de Estados Seguro con Notificaciones Automáticas

## 📋 Descripción General

Sistema completo de gestión de estados de proyectos con notificaciones automáticas al aprobar pedidos. Implementa un flujo controlado de transiciones de estado y alertas automáticas al administrador.

---

## 🔄 Flujo de Estados

### Estados Disponibles

1. **Levantamiento** 📏 - Toma de medidas inicial
2. **Cotización** 💰 - Generación de presupuesto
3. **Aprobado** ✅ - Pedido confirmado por el cliente
4. **Fabricación** 🏭 - Producción en proceso
5. **Instalación** 🔧 - Instalación en sitio
6. **Completado** 🎉 - Proyecto finalizado
7. **Cancelado** ❌ - Proyecto cancelado

### Transiciones Válidas

```
Levantamiento → Cotización, Cancelado
Cotización → Aprobado, Levantamiento, Cancelado
Aprobado → Fabricación, Cotización, Cancelado
Fabricación → Instalación, Aprobado, Cancelado
Instalación → Completado, Fabricación, Cancelado
Completado → (estado final)
Cancelado → Levantamiento, Cotización, Aprobado (reactivación)
```

---

## 🔔 Notificación de Aprobación

### Trigger Automático

Cuando un proyecto cambia al estado **"Aprobado"**, se dispara automáticamente:

1. **Notificación por WhatsApp** (si está habilitada)
2. **Notificación por Correo Electrónico** (si está habilitada)

### Contenido de las Notificaciones

#### WhatsApp
```
🎉 *PEDIDO APROBADO*

📋 *Proyecto:* #PROJ-001
👤 *Cliente:* Juan Pérez
💰 *Total:* $15,750.00 MXN
📅 *Fecha:* 4 de noviembre de 2025

✅ El pedido ha sido aprobado y está listo para pasar a fabricación.

_Notificación automática de Sundeck CRM_
```

#### Correo Electrónico
- **Asunto:** 🎉 Pedido Aprobado - #PROJ-001
- **Formato:** HTML profesional con diseño corporativo
- **Contenido:** Información completa del proyecto y botón de acceso al sistema

---

## 🛠️ Implementación Técnica

### Backend

#### 1. Servicio de Notificaciones
**Archivo:** `/server/services/notificacionService.js`

**Funciones principales:**
- `enviarNotificacionWhatsApp(numero, mensaje)` - Envío por WhatsApp
- `enviarNotificacionCorreo(destinatario, asunto, cuerpo)` - Envío por correo
- `enviarNotificacionAprobacionPedido(proyecto)` - Notificación completa de aprobación

**Características:**
- ✅ Validación de formatos (teléfono, email)
- ✅ Logging estructurado con `logger`
- ✅ Manejo de errores robusto
- ✅ Configuración centralizada
- ✅ Soporte para habilitar/deshabilitar canales

#### 2. Configuración
**Archivo:** `/server/config/notificaciones.json`

```json
{
  "whatsappAdmin": "5217441996923",
  "correoAdmin": "sundeck.acapulco@gmail.com",
  "whatsappEnabled": true,
  "correoEnabled": true
}
```

**Campos:**
- `whatsappAdmin` - Número de WhatsApp del administrador (formato: 52XXXXXXXXXX)
- `correoAdmin` - Correo electrónico del administrador
- `whatsappEnabled` - Activar/desactivar WhatsApp
- `correoEnabled` - Activar/desactivar correo

#### 3. Controller
**Archivo:** `/server/controllers/proyectoController.js`

**Función:** `ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId)`

**Lógica:**
```javascript
// Al aprobar pedido
if (nuevoEstado === 'aprobado' && estadoAnterior !== 'aprobado') {
  // Registrar evento
  logger.info('Enviando notificación de aprobación de pedido', {...});
  
  // Enviar notificaciones
  const resultado = await notificacionService.enviarNotificacionAprobacionPedido(proyecto);
  
  // Registrar resultado
  logger.info('Notificación enviada', {
    whatsappEnviado: resultado.whatsapp?.enviado,
    correoEnviado: resultado.correo?.enviado
  });
}
```

### Frontend

#### 1. Modal de Cambio de Estado
**Archivo:** `/client/src/modules/proyectos/ProyectoDetail.jsx`

**Características:**
- ✅ Selector de estados con transiciones válidas
- ✅ Validación de transiciones permitidas
- ✅ Campo de observaciones opcional
- ✅ Alerta informativa al aprobar pedido
- ✅ Botón destacado para aprobación
- ✅ Manejo de errores con feedback visual

**Función de transiciones:**
```javascript
const obtenerTransicionesValidas = (estadoActual) => {
  const flujoNormal = {
    'levantamiento': ['cotizacion', 'cancelado'],
    'cotizacion': ['aprobado', 'levantamiento', 'cancelado'],
    'aprobado': ['fabricacion', 'cotizacion', 'cancelado'],
    // ...
  };
  return flujoNormal[estadoActual] || [];
};
```

---

## 📧 Configuración de Correo (Producción)

### Variables de Entorno Requeridas

Agregar al archivo `.env`:

```env
# Configuración SMTP para envío de correos
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASS=tu-contraseña-de-aplicación
```

### Configuración de Gmail

1. **Habilitar verificación en 2 pasos** en tu cuenta de Gmail
2. **Generar contraseña de aplicación:**
   - Ir a: https://myaccount.google.com/apppasswords
   - Seleccionar "Correo" y "Otro (nombre personalizado)"
   - Copiar la contraseña generada
   - Usar esa contraseña en `SMTP_PASS`

### Otros Proveedores SMTP

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-api-key
```

---

## 📱 Configuración de WhatsApp (Producción)

### Opción 1: WhatsApp Business API (Oficial)

**Requisitos:**
- Cuenta de WhatsApp Business verificada
- Meta Business Manager
- Número de teléfono dedicado

**Configuración:**
```javascript
// En notificacionService.js, descomentar:
const response = await axios.post(
  `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
  {
    messaging_product: 'whatsapp',
    to: numeroLimpio,
    type: 'text',
    text: { body: mensaje }
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    }
  }
);
```

**Variables de entorno:**
```env
WHATSAPP_PHONE_ID=tu-phone-id
WHATSAPP_TOKEN=tu-access-token
```

### Opción 2: Servicios de Terceros

**Twilio WhatsApp:**
- Más fácil de configurar
- Costo por mensaje
- Documentación: https://www.twilio.com/docs/whatsapp

**Vonage (Nexmo):**
- API simple
- Precios competitivos
- Documentación: https://developer.vonage.com/messaging/whatsapp/overview

---

## 🔍 Logging y Monitoreo

### Eventos Registrados

Todos los eventos se registran con `logger` estructurado:

#### 1. Cambio de Estado
```javascript
logger.info('Cambio de estado de proyecto', {
  proyectoId: '...',
  estadoAnterior: 'cotizacion',
  estadoNuevo: 'aprobado',
  usuario: '...',
  timestamp: '...'
});
```

#### 2. Envío de Notificaciones
```javascript
logger.info('Notificación enviada', {
  proyectoId: '...',
  canal: 'whatsapp',
  destinatario: '52...',
  enviado: true,
  timestamp: '...'
});
```

#### 3. Errores
```javascript
logger.error('Error enviando notificación', {
  error: error.message,
  stack: error.stack,
  proyectoId: '...',
  canal: 'correo'
});
```

### Consultar Logs

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Buscar notificaciones de aprobación
grep "Notificación de aprobación" logs/combined.log

# Ver errores de notificaciones
grep "Error enviando notificación" logs/error.log
```

---

## ✅ Checklist de Implementación

### Backend
- [x] Crear `notificacionService.js`
- [x] Crear `notificaciones.json`
- [x] Actualizar `proyectoController.js`
- [x] Agregar import de `notificacionService`
- [x] Implementar trigger en `ejecutarTriggersEstado`
- [x] Agregar logging estructurado

### Frontend
- [x] Corregir modal de cambio de estado
- [x] Implementar lógica de transiciones válidas
- [x] Agregar alerta informativa para aprobación
- [x] Estilizar botón de aprobación
- [x] Manejar errores con feedback visual

### Configuración
- [x] Crear archivo `notificaciones.json`
- [ ] Configurar variables SMTP en `.env` (producción)
- [ ] Configurar WhatsApp API (producción)
- [ ] Probar envío de notificaciones

### Documentación
- [x] Crear `fase1_estado_seguro.md`
- [x] Documentar flujo de estados
- [x] Documentar sistema de notificaciones
- [x] Agregar guías de configuración

---

## 🧪 Pruebas

### Prueba 1: Cambio de Estado
1. Abrir un proyecto en estado "Cotización"
2. Click en menú (⋮) → "Cambiar Estado"
3. Verificar que aparezcan opciones: Aprobado, Levantamiento, Cancelado
4. Seleccionar "Aprobado"
5. Verificar alerta: "Al aprobar el pedido, se enviará una notificación..."
6. Agregar observaciones (opcional)
7. Click en "✅ Aprobar Pedido"
8. Verificar cambio de estado exitoso

### Prueba 2: Notificaciones (Desarrollo)
1. Aprobar un pedido
2. Verificar en logs del servidor:
   ```
   Enviando notificación de aprobación de pedido
   Notificación WhatsApp registrada
   Notificación por correo registrada
   ```
3. Verificar que no haya errores

### Prueba 3: Notificaciones (Producción)
1. Configurar SMTP en `.env`
2. Configurar WhatsApp API (opcional)
3. Aprobar un pedido
4. Verificar recepción de correo en `correoAdmin`
5. Verificar recepción de WhatsApp en `whatsappAdmin`
6. Verificar logs de envío exitoso

---

## 🐛 Troubleshooting

### Problema: Modal de estado vacío
**Causa:** No se cargan las transiciones válidas  
**Solución:** Verificar función `obtenerTransicionesValidas` en frontend

### Problema: Notificaciones no se envían
**Causa:** Configuración deshabilitada o credenciales faltantes  
**Solución:** 
1. Verificar `notificaciones.json` (`enabled: true`)
2. Verificar variables de entorno SMTP
3. Revisar logs para errores específicos

### Problema: Error de formato de número WhatsApp
**Causa:** Número no tiene formato 52XXXXXXXXXX  
**Solución:** Actualizar `whatsappAdmin` en `notificaciones.json`

### Problema: Correo no llega
**Causa:** Credenciales SMTP incorrectas o bloqueadas  
**Solución:**
1. Verificar usuario/contraseña SMTP
2. Habilitar "Acceso de aplicaciones menos seguras" (Gmail)
3. Usar contraseña de aplicación en lugar de contraseña normal

---

## 📊 Métricas y KPIs

### Métricas de Notificaciones
- Total de notificaciones enviadas
- Tasa de éxito de envío
- Tiempo promedio de envío
- Errores por canal (WhatsApp vs Correo)

### Consultas SQL/MongoDB

```javascript
// Contar aprobaciones en el último mes
db.proyectos.count({
  estado: 'aprobado',
  fecha_actualizacion: { $gte: new Date('2025-10-01') }
});

// Buscar en logs
grep "Notificación de aprobación enviada" logs/combined.log | wc -l
```

---

## 🔐 Seguridad

### Mejores Prácticas

1. **Nunca** commitear credenciales en el código
2. **Usar** variables de entorno para datos sensibles
3. **Validar** todos los inputs (números, correos)
4. **Limitar** rate de envío para evitar spam
5. **Encriptar** tokens y contraseñas en `.env`

### Archivo `.env.example`

```env
# Configuración SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# WhatsApp Business API
WHATSAPP_PHONE_ID=
WHATSAPP_TOKEN=
```

---

## 📝 Notas Adicionales

### Modo Desarrollo vs Producción

**Desarrollo:**
- Notificaciones se registran en logs
- No se envían mensajes reales
- Útil para testing sin costos

**Producción:**
- Configurar credenciales SMTP
- Configurar WhatsApp API
- Monitorear logs de envío
- Configurar alertas de errores

### Extensiones Futuras

- [ ] Plantillas personalizables de mensajes
- [ ] Notificaciones para otros estados (fabricación, instalación)
- [ ] Dashboard de notificaciones enviadas
- [ ] Historial de notificaciones por proyecto
- [ ] Configuración de destinatarios múltiples
- [ ] Integración con Slack/Telegram
- [ ] Notificaciones push en la app

---

## 📞 Soporte

Para problemas o dudas sobre el sistema de notificaciones:

1. Revisar esta documentación
2. Consultar logs del servidor
3. Verificar configuración en `notificaciones.json`
4. Contactar al equipo de desarrollo

---

**Última actualización:** 4 de noviembre de 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y Documentado
