# 🏭 DIFERENCIACIÓN DE MÓDULOS SUNDECK

## 📋 **RESUMEN DE MÓDULOS**

### **🛒 MÓDULO PEDIDOS (Comercial)**
**Usuarios:** Equipo de ventas, administración comercial  
**Propósito:** Gestión comercial y seguimiento de ventas

#### **Información Incluida:**
- ✅ **Precios completos**: Unitarios, subtotales, totales
- ✅ **Márgenes de ganancia**: Costos vs precios de venta
- ✅ **Descuentos aplicados**: Porcentajes y montos
- ✅ **Formas de pago**: Anticipos, saldos, condiciones
- ✅ **IVA y impuestos**: Cálculos fiscales
- ✅ **Información del prospecto**: Datos comerciales completos

#### **Funcionalidades:**
- Crear pedidos desde cotizaciones aprobadas
- Seguimiento de pagos (anticipo/saldo)
- Control de estados comerciales
- Reportes de ventas y comisiones
- Gestión de clientes y prospectos

---

### **🏭 MÓDULO FABRICACIÓN (Producción)**
**Usuarios:** Área de fabricación, supervisores, instaladores  
**Propósito:** Instrucciones técnicas para fabricación e instalación

#### **Información Incluida:**
- ❌ **SIN PRECIOS**: No se muestran costos ni precios
- ✅ **Especificaciones técnicas**: Medidas, materiales, colores
- ✅ **Instrucciones de fabricación**: Pasos detallados
- ✅ **Requerimientos especiales**: R24, motorización, etc.
- ✅ **Control de calidad**: Checkpoints y validaciones
- ✅ **Tiempos de fabricación**: Estimados y reales
- ✅ **Información del cliente**: Solo datos de contacto y dirección

#### **Funcionalidades:**
- Crear órdenes de fabricación desde pedidos confirmados
- Seguimiento de progreso de fabricación
- Control de calidad por producto
- Asignación de fabricantes y supervisores
- Gestión de materiales y herramientas

---

## 🔄 **FLUJO DE TRABAJO**

```
COTIZACIÓN → PEDIDO (Comercial) → ORDEN FABRICACIÓN (Producción)
    ↓              ↓                        ↓
 Con precios   Con precios              Sin precios
 Prospecto     Cliente                  Solo técnico
 Comercial     Ventas                   Fabricación
```

---

## 📊 **COMPARACIÓN DETALLADA**

| Aspecto | PEDIDOS (Comercial) | FABRICACIÓN (Producción) |
|---------|-------------------|------------------------|
| **Precios** | ✅ Completos | ❌ Ocultos |
| **Costos** | ✅ Visibles | ❌ No incluidos |
| **Márgenes** | ✅ Calculados | ❌ No aplica |
| **Cliente** | ✅ Info comercial completa | ✅ Solo contacto básico |
| **Especificaciones** | ✅ Básicas | ✅ Técnicas detalladas |
| **Instrucciones** | ❌ No incluidas | ✅ Paso a paso |
| **Control calidad** | ❌ No aplica | ✅ Checkpoints |
| **Materiales** | ❌ Solo descripción | ✅ Lista detallada |
| **Tiempos** | ✅ Estimados comerciales | ✅ Tiempos de fabricación |

---

## 🎯 **OBJETIVOS DE LA DIFERENCIACIÓN**

### **Para el Área Comercial:**
- **Confidencialidad**: Mantener información de precios y márgenes segura
- **Enfoque comercial**: Herramientas específicas para ventas
- **Seguimiento de pagos**: Control financiero completo
- **Reportes comerciales**: Análisis de ventas y rentabilidad

### **Para el Área de Fabricación:**
- **Enfoque técnico**: Solo información relevante para producción
- **Simplicidad**: Sin distracciones de información comercial
- **Eficiencia**: Instrucciones claras y directas
- **Control de calidad**: Herramientas específicas para producción

---

## 📁 **ARCHIVOS IMPLEMENTADOS**

### **Modelos:**
- `server/models/Pedido.js` - Modelo comercial con precios
- `server/models/OrdenFabricacion.js` - Modelo técnico sin precios

### **Servicios:**
- `server/services/pdfService.js` - PDFs comerciales con precios
- `server/services/pdfFabricacionService.js` - PDFs técnicos sin precios

### **Rutas:**
- `server/routes/pedidos.js` - Endpoints comerciales
- `server/routes/fabricacion.js` - Endpoints de producción

---

## 🔐 **SEGURIDAD Y PERMISOS**

### **Roles Sugeridos:**
- **Vendedor**: Solo módulo Pedidos
- **Administrador**: Ambos módulos
- **Fabricante**: Solo módulo Fabricación
- **Supervisor**: Ambos módulos (sin precios en fabricación)

### **Controles de Acceso:**
- Verificación de permisos por módulo
- Filtrado automático de información sensible
- Logs de acceso por área

---

## 🚀 **BENEFICIOS**

### **Operacionales:**
- **Separación clara** de responsabilidades
- **Información específica** para cada área
- **Reducción de errores** por información irrelevante
- **Mayor eficiencia** en cada proceso

### **Seguridad:**
- **Protección de información comercial** sensible
- **Control de acceso** granular
- **Trazabilidad** de acciones por área

### **Escalabilidad:**
- **Módulos independientes** fáciles de mantener
- **Posibilidad de equipos especializados**
- **Integración con sistemas externos** específicos

---

**Estado:** ✅ **IMPLEMENTADO Y LISTO**  
**Próximo paso:** Integrar en la interfaz de usuario y configurar permisos
