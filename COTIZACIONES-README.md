# 📋 Módulo de Cotizaciones - SUNDECK CRM

## ✅ Problemas Resueltos

### 1. **Guardado de Cotizaciones Corregido**
- **Problema**: Las cotizaciones no se guardaban correctamente
- **Solución**: Corregido el payload y validaciones en `CotizacionForm.js`
- **Mejoras implementadas**:
  - Validación de productos antes del envío
  - Cálculo automático de subtotales
  - Manejo de errores mejorado
  - Logs detallados para debugging

### 2. **Cotización Directa Implementada**
- **Problema**: Clientes llamaban con medidas pero no había prospecto
- **Solución**: Nuevo componente `CotizacionDirecta.js`
- **Funcionalidades**:
  - Crear prospecto y cotización en un solo flujo
  - Wizard de 3 pasos: Cliente → Productos → Totales
  - Validaciones por paso
  - Creación automática del prospecto

## 🚀 Nuevas Funcionalidades

### **Cotización Directa**
**Ruta**: `/cotizaciones/directa`

**Flujo de trabajo**:
1. **Paso 1 - Datos del Cliente**:
   - Nombre completo (requerido)
   - Teléfono (requerido)
   - Email (opcional)
   - Dirección (opcional)

2. **Paso 2 - Productos y Medidas**:
   - Agregar múltiples productos
   - Especificar ubicación, m², cantidad, precio
   - Cálculo automático de subtotales

3. **Paso 3 - Totales y Condiciones**:
   - Aplicar descuentos
   - Configurar fecha de validez
   - Ver resumen completo con IVA

**Resultado**: Se crea automáticamente:
- ✅ Prospecto con fuente `cotizacion_directa`
- ✅ Cotización completa con número automático
- ✅ Etapa del prospecto actualizada a `cotizacion`

### **Cotización Tradicional Mejorada**
**Ruta**: `/cotizaciones/nueva`

**Mejoras implementadas**:
- ✅ Validaciones robustas antes del guardado
- ✅ Cálculo automático de subtotales en tiempo real
- ✅ Importación de levantamientos técnicos
- ✅ Generación de descripciones con IA
- ✅ Manejo de errores mejorado

## 🎯 Casos de Uso

### **Caso 1: Cliente llama con medidas**
```
Cliente: "Hola, quiero cotización para 3 persianas"
Vendedor: Usa "Cotización Directa"
1. Captura datos básicos del cliente
2. Agrega productos con medidas que proporciona
3. Genera cotización inmediatamente
4. Cliente queda registrado automáticamente
```

### **Caso 2: Prospecto existente**
```
Vendedor: Ya tiene prospecto registrado
1. Va a "Nueva Cotización"
2. Selecciona el prospecto existente
3. Puede importar levantamiento técnico previo
4. Completa productos y genera cotización
```

## 🔧 Configuración Técnica

### **Archivos Modificados**:
- `client/src/components/Cotizaciones/CotizacionForm.js` - Guardado corregido
- `client/src/components/Cotizaciones/CotizacionDirecta.js` - Nuevo componente
- `client/src/components/Cotizaciones/CotizacionesList.js` - Botón agregado
- `client/src/App.js` - Nueva ruta agregada
- `server/models/Prospecto.js` - Fuente `cotizacion_directa` agregada

### **Nuevas Rutas**:
- `GET /cotizaciones/directa` - Formulario de cotización directa
- `POST /prospectos` - Crear prospecto (usado por cotización directa)
- `POST /cotizaciones` - Crear cotización (corregido)

## 🧪 Pruebas

### **Ejecutar Pruebas Automáticas**:
```bash
node test-cotizaciones.js
```

### **Pruebas Manuales**:

**1. Cotización Directa**:
- [ ] Ir a `/cotizaciones/directa`
- [ ] Completar datos del cliente
- [ ] Agregar productos con medidas
- [ ] Verificar cálculos automáticos
- [ ] Crear cotización
- [ ] Verificar que se creó el prospecto

**2. Cotización Tradicional**:
- [ ] Ir a `/cotizaciones/nueva`
- [ ] Seleccionar prospecto existente
- [ ] Agregar productos manualmente
- [ ] Probar importación de levantamiento
- [ ] Guardar cotización

**3. Listado de Cotizaciones**:
- [ ] Ver cotizaciones creadas
- [ ] Verificar números automáticos
- [ ] Comprobar totales calculados
- [ ] Probar acciones (ver, editar, PDF)

## 📊 Validaciones Implementadas

### **Frontend**:
- ✅ Datos del cliente requeridos
- ✅ Al menos un producto por cotización
- ✅ Productos con nombre y precio válido
- ✅ Cálculos automáticos en tiempo real
- ✅ Navegación por pasos validada

### **Backend**:
- ✅ Prospecto requerido para cotización
- ✅ Productos con estructura válida
- ✅ Cálculos automáticos de totales
- ✅ Generación automática de números
- ✅ Fechas de entrega calculadas

## 🎨 Interfaz de Usuario

### **Colores Sundeck**:
- **Primario**: `#2563eb` (Azul)
- **Secundario**: `#1a1a1a` (Negro)
- **Éxito**: `#28a745` (Verde)
- **Advertencia**: `#ffc107` (Amarillo)

### **Componentes**:
- **Stepper**: Navegación por pasos clara
- **Tablas**: Productos organizados visualmente
- **Cards**: Información agrupada lógicamente
- **Botones**: Acciones diferenciadas por color

## 🚨 Notas Importantes

### **Flujo de Datos**:
1. **Cotización Directa**: Cliente → Prospecto → Cotización
2. **Cotización Tradicional**: Prospecto → Cotización

### **Estados del Prospecto**:
- Ambos flujos actualizan la etapa a `cotizacion`
- El prospecto queda listo para seguimiento

### **Numeración Automática**:
- Formato: `COT-2024-0001`, `COT-2024-0002`, etc.
- Se genera automáticamente al guardar
- Único por año

### **Cálculos Automáticos**:
- Subtotal = Σ(área × precio × cantidad)
- Descuento = Subtotal × porcentaje
- IVA = (Subtotal - Descuento + Instalación) × 16%
- Total = Subtotal - Descuento + Instalación + IVA

## 📞 Soporte

Para dudas o problemas:
1. Revisar logs en consola del navegador
2. Verificar logs del servidor
3. Ejecutar script de pruebas
4. Consultar este README

---

**Desarrollado para SUNDECK - Soluciones en Cortinas y Persianas**
*Versión: 2.0 - Septiembre 2024*
