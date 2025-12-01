# 💰 SISTEMA DE PAGOS Y COMPROBANTES

**Fecha:** 13 Nov 2025  
**Estado:** ✅ IMPLEMENTADO  
**Propósito:** Registrar anticipos, saldos y comprobantes de pago

---

## 🎯 PROBLEMA RESUELTO

**Antes:**
- ❌ KPI "ANTICIPO RECIBIDO" mostraba $0.00
- ❌ No había forma de registrar pagos
- ❌ No se guardaban comprobantes
- ❌ Sin auditoría de pagos

**Después:**
- ✅ KPI lee correctamente de `proyecto.pagos.anticipo.monto`
- ✅ Endpoints para registrar anticipos y saldos
- ✅ Subida y almacenamiento de comprobantes
- ✅ Historial completo de pagos

---

## 📊 ESTRUCTURA DE DATOS

### Modelo Proyecto - Sección Pagos:

```javascript
pagos: {
  montoTotal: Number,
  subtotal: Number,
  iva: Number,
  descuentos: Number,
  
  anticipo: {
    monto: Number,
    porcentaje: { type: Number, default: 60 },
    fechaPago: Date,
    metodoPago: {
      type: String,
      enum: ['efectivo', 'transferencia', 'cheque', 'tarjeta', 'deposito']
    },
    referencia: String,
    comprobante: String, // URL del comprobante
    pagado: { type: Boolean, default: false }
  },
  
  saldo: {
    monto: Number,
    porcentaje: { type: Number, default: 40 },
    fechaVencimiento: Date,
    fechaPago: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String,
    pagado: { type: Boolean, default: false }
  },
  
  pagosAdicionales: [{
    concepto: String,
    monto: Number,
    fecha: Date,
    metodoPago: String,
    referencia: String,
    comprobante: String
  }]
}
```

---

## 🔌 ENDPOINTS DISPONIBLES

### 1. Registrar Anticipo

**Endpoint:** `POST /api/proyectos/:id/pagos/anticipo`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "monto": 39253.69,
  "porcentaje": 60,
  "fechaPago": "2025-11-13",
  "metodoPago": "transferencia",
  "referencia": "SPEI-123456",
  "comprobante": "data:image/jpeg;base64,..." // Opcional
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Anticipo registrado exitosamente",
  "data": {
    "anticipo": {
      "monto": 39253.69,
      "porcentaje": 60,
      "fechaPago": "2025-11-13T00:00:00.000Z",
      "metodoPago": "transferencia",
      "referencia": "SPEI-123456",
      "comprobante": "/uploads/comprobantes/comprobante-2025-ARQ-HECTOR-003-anticipo-1763062062014.jpg",
      "pagado": true
    },
    "saldo": {
      "monto": 26169.12
    }
  }
}
```

---

### 2. Registrar Saldo

**Endpoint:** `POST /api/proyectos/:id/pagos/saldo`

**Body:**
```json
{
  "monto": 26169.12,
  "fechaPago": "2025-12-15",
  "metodoPago": "transferencia",
  "referencia": "SPEI-789012",
  "comprobante": "data:image/jpeg;base64,..."
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Saldo registrado exitosamente",
  "data": {
    "saldo": {
      "monto": 26169.12,
      "fechaPago": "2025-12-15T00:00:00.000Z",
      "metodoPago": "transferencia",
      "referencia": "SPEI-789012",
      "comprobante": "/uploads/comprobantes/...",
      "pagado": true
    }
  }
}
```

---

### 3. Subir Comprobante

**Endpoint:** `POST /api/proyectos/:id/pagos/comprobante`

**Body:**
```json
{
  "tipoPago": "anticipo",
  "archivo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
}
```

**Tipos de pago válidos:**
- `anticipo` - Comprobante del anticipo
- `saldo` - Comprobante del saldo final

**Respuesta:**
```json
{
  "success": true,
  "message": "Comprobante subido exitosamente",
  "data": {
    "comprobante": "/uploads/comprobantes/comprobante-2025-ARQ-HECTOR-003-anticipo-1763062062014.jpg"
  }
}
```

---

### 4. Obtener Historial de Pagos

**Endpoint:** `GET /api/proyectos/:id/pagos`

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "proyecto": {
      "numero": "2025-ARQ-HECTOR-003",
      "cliente": "Arq. Hector Huerta"
    },
    "pagos": {
      "montoTotal": 65422.81,
      "anticipo": {
        "monto": 39253.69,
        "porcentaje": 60,
        "fechaPago": "2025-11-13T00:00:00.000Z",
        "metodoPago": "transferencia",
        "referencia": "SPEI-123456",
        "comprobante": "/uploads/comprobantes/...",
        "pagado": true
      },
      "saldo": {
        "monto": 26169.12,
        "fechaPago": null,
        "pagado": false
      },
      "pagosAdicionales": []
    }
  }
}
```

---

## 🔄 FLUJO COMPLETO

### Paso 1: Proyecto Aprobado

Cuando un proyecto se aprueba, el total se calcula desde las cotizaciones.

### Paso 2: Cliente Paga Anticipo

1. **Recibir pago del cliente** (60% del total)
2. **Registrar anticipo:**
   ```javascript
   POST /api/proyectos/673456789abc123def456789/pagos/anticipo
   {
     "monto": 39253.69,
     "metodoPago": "transferencia",
     "referencia": "SPEI-123456"
   }
   ```

3. **Subir comprobante:**
   ```javascript
   POST /api/proyectos/673456789abc123def456789/pagos/comprobante
   {
     "tipoPago": "anticipo",
     "archivo": "data:image/jpeg;base64,..."
   }
   ```

### Paso 3: KPI Se Actualiza Automáticamente

El KPI "ANTICIPO RECIBIDO" ahora muestra **$39,253.69** ✅

### Paso 4: Cliente Paga Saldo (al completar)

1. **Recibir saldo del cliente** (40% restante)
2. **Registrar saldo:**
   ```javascript
   POST /api/proyectos/673456789abc123def456789/pagos/saldo
   {
     "monto": 26169.12,
     "metodoPago": "transferencia",
     "referencia": "SPEI-789012"
   }
   ```

3. **Subir comprobante del saldo**

---

## 💻 EJEMPLO DE USO EN FRONTEND

### Registrar Anticipo con Axios:

```javascript
import axios from 'axios';

const registrarAnticipo = async (proyectoId, datos) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await axios.post(
      `http://localhost:5001/api/proyectos/${proyectoId}/pagos/anticipo`,
      {
        monto: datos.monto,
        porcentaje: 60,
        fechaPago: datos.fechaPago,
        metodoPago: datos.metodoPago,
        referencia: datos.referencia
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      alert('✅ Anticipo registrado exitosamente');
      // Recargar estadísticas del proyecto
      await cargarEstadisticas();
    }
  } catch (error) {
    console.error('Error registrando anticipo:', error);
    alert('❌ Error al registrar anticipo');
  }
};
```

### Subir Comprobante con File Input:

```javascript
const subirComprobante = async (proyectoId, tipoPago, file) => {
  try {
    const token = localStorage.getItem('token');
    
    // Convertir archivo a base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      
      const response = await axios.post(
        `http://localhost:5001/api/proyectos/${proyectoId}/pagos/comprobante`,
        {
          tipoPago: tipoPago, // 'anticipo' o 'saldo'
          archivo: base64
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        alert('✅ Comprobante subido exitosamente');
      }
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    console.error('Error subiendo comprobante:', error);
    alert('❌ Error al subir comprobante');
  }
};

// Uso con input file
<input 
  type="file" 
  accept="image/*,application/pdf"
  onChange={(e) => subirComprobante(proyectoId, 'anticipo', e.target.files[0])}
/>
```

---

## 🔍 VERIFICACIÓN

### Ver KPI Actualizado:

1. Abrir proyecto: `http://localhost:3000/proyectos/:id`
2. Ir a pestaña "COTIZACIÓN"
3. Verificar que "ANTICIPO RECIBIDO" muestra el monto correcto

### Ver Historial de Pagos:

```javascript
const verPagos = async (proyectoId) => {
  const token = localStorage.getItem('token');
  
  const response = await axios.get(
    `http://localhost:5001/api/proyectos/${proyectoId}/pagos`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  console.log('Pagos del proyecto:', response.data.data.pagos);
};
```

---

## 📁 ALMACENAMIENTO DE COMPROBANTES

### Ubicación:
```
server/uploads/comprobantes/
```

### Formato de nombres:
```
comprobante-{numero_proyecto}-{tipo_pago}-{timestamp}.{extension}
```

### Ejemplo:
```
comprobante-2025-ARQ-HECTOR-003-anticipo-1763062062014.jpg
comprobante-2025-ARQ-HECTOR-003-saldo-1763162062014.pdf
```

### Acceso:
```
http://localhost:5001/uploads/comprobantes/comprobante-2025-ARQ-HECTOR-003-anticipo-1763062062014.jpg
```

---

## 🛡️ SEGURIDAD

- ✅ Autenticación requerida en todos los endpoints
- ✅ Permisos verificados (solo usuarios con permiso de actualizar proyectos)
- ✅ Validación de montos (debe ser > 0)
- ✅ Validación de IDs de proyecto
- ✅ Logs estructurados de todas las operaciones
- ✅ Comprobantes almacenados de forma segura

---

## 📊 AUDITORÍA

Todos los registros de pagos se logean con:
- Usuario que registró el pago
- Fecha y hora
- Monto y método de pago
- Proyecto asociado

**Ver logs:**
```bash
Get-Content "logs\combined-2025-11-13.log" | Select-String -Pattern "Anticipo registrado|Saldo registrado"
```

---

## 🚀 PRÓXIMOS PASOS

### Implementar en Frontend:

1. **Crear componente PagosTab.jsx**
   - Formulario para registrar anticipo
   - Formulario para registrar saldo
   - Subida de comprobantes
   - Historial de pagos

2. **Agregar a ProyectoDetail.jsx**
   - Nueva pestaña "PAGOS"
   - Mostrar historial y comprobantes

3. **Notificaciones**
   - Email al registrar pago
   - Recordatorio de saldo pendiente

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [x] Modelo Proyecto con estructura de pagos
- [x] Controller de pagos (pagoController.js)
- [x] Rutas de pagos (pagos.js)
- [x] Integración en server/index.js
- [x] Corrección de KPI en estadísticas
- [x] Documentación completa
- [ ] Componente frontend PagosTab
- [ ] Integración en ProyectoDetail
- [ ] Tests unitarios
- [ ] Tests de integración

---

**Estado:** ✅ BACKEND COMPLETADO  
**Siguiente paso:** Implementar componente frontend  
**Tiempo estimado:** 2-3 horas para frontend completo
