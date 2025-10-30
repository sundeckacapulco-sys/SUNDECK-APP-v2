# 📋 PENDIENTES - COTIZACIÓN EN VIVO DEL PROYECTO

**Fecha de última actualización**: 29 de Octubre, 2025  
**Módulo**: Proyectos - Cotización en Vivo  
**Archivos principales**:
- `client/src/modules/proyectos/components/AgregarMedidasProyectoModal.jsx`
- `client/src/modules/proyectos/components/AgregarMedidaPartidasModal.jsx`
- `client/src/components/Prospectos/hooks/usePiezasManager.js`

---

## 🎯 TRABAJO COMPLETADO HOY

### ✅ Estructura Jerárquica de 3 Niveles
- **NIVEL 1**: Especificaciones Generales (siempre visible)
  - Cantidad, Área Total, Color, Modelo/Código
  - Fondo gris claro, 4 columnas responsivas

- **NIVEL 2**: Medidas Individuales (acordeón)
  - Acordeón principal para todas las medidas
  - Cada pieza es un sub-acordeón individual
  - 13 campos técnicos por pieza

- **NIVEL 3**: Secciones Complementarias (acordeones)
  - ⚡ Motorización (con total visible en header)
  - 🔧 Instalación Especial (con total calculado)
  - 📝 Observaciones

### ✅ Corrección de Nombres de Campos (Fase 4 Parcial)
| Campo | Formulario | Panel Visualización | Estado |
|-------|-----------|---------------------|--------|
| Galería | `galeria` | `galeria` | ✅ Corregido |
| Control | `tipoControl` | `tipoControl` | ✅ Corregido |
| Operación | `modoOperacion` | `modoOperacion` | ✅ Corregido |
| Caída | `caida` / `orientacion` | Ambos + Formateo | ✅ Corregido |

### ✅ Campos Detalle y Traslape con Opción Manual (Fase 5 Parcial)

**Detalle Técnico**:
- Opciones: No aplica, Traslape, Corte, Sin traslape, Empalme, Doble Sistema, Otro
- Campo manual cuando selecciona "Otro"
- Implementado en Levantamiento y Cotización en Vivo
- Visualización con formateo correcto

**Traslape**:
- Opciones: No aplica, 5cm, 10cm, 15cm, 20cm, Otro
- Campo manual cuando selecciona "Otro"
- Formateo con espacio (10cm → 10 cm)
- Implementado en ambos módulos

### ✅ Ajustes de Redundancia y Claridad
- Caída: "Caída normal" → "Normal"
- Sistema Especial: Sin etiqueta redundante (solo valor en magenta)
- Traslape: Con espacio para mejor legibilidad

### ✅ Limpieza de Código
- Eliminadas 294 líneas de código duplicado usando Python
- Archivo optimizado de 2,689 a 2,395 líneas

---

## ⚠️ PENDIENTES CRÍTICOS PARA MAÑANA

### 🔴 PRIORIDAD 1: REVISAR FASE 4 COMPLETA

**Objetivo**: Verificar que TODAS las funciones de guardado funcionen correctamente

#### **4.1. Función `handleGuardarMedidasTecnicas` (SIN precios)**
**Ubicación**: `AgregarMedidasProyectoModal.jsx`

**Verificar**:
- [ ] Se guardan todas las piezas correctamente
- [ ] Se guardan todos los campos técnicos (13 campos)
- [ ] Se guardan campos manuales (detalleTecnicoManual, traslapeManual)
- [ ] Validación de campos obligatorios funciona
- [ ] Manejo de errores correcto
- [ ] Mensaje de éxito se muestra
- [ ] Modal se cierra después de guardar
- [ ] Callback `onActualizar` se ejecuta

**Campos a verificar en guardado**:
```javascript
{
  // Medidas básicas
  ancho, alto, area,
  
  // Campos técnicos
  galeria, tipoControl, caida/orientacion,
  tipoInstalacion, tipoFijacion, modoOperacion,
  detalleTecnico, detalleTecnicoManual,
  traslape, traslapeManual,
  telaMarca, baseTabla,
  sistema, sistemaEspecial,
  observacionesTecnicas,
  
  // Producto
  producto, productoLabel, color, modeloCodigo, precioM2
}
```

#### **4.2. Función `handleGuardarCotizacionEnVivo` (CON precios)**
**Ubicación**: `AgregarMedidasProyectoModal.jsx`

**Verificar**:
- [ ] Se guardan todas las piezas + campos técnicos
- [ ] Se guarda precio general
- [ ] Se guarda motorización (motor + control)
- [ ] Se guarda instalación especial (con cálculo correcto)
- [ ] Se guardan descuentos
- [ ] Se guarda facturación
- [ ] Se guarda método de pago
- [ ] Cálculos de totales son correctos
- [ ] Validación de completitud funciona
- [ ] Manejo de errores correcto

**Estructura de datos a guardar**:
```javascript
{
  piezas: [...], // Con todos los campos técnicos
  precioGeneral: Number,
  
  // Motorización
  motorizado: Boolean,
  motorModelo: String,
  motorModeloEspecificar: String,
  motorPrecio: Number,
  numMotores: Number,
  controlModelo: String,
  controlPrecio: Number,
  
  // Instalación
  cobraInstalacion: Boolean,
  tipoInstalacion: String,
  precioInstalacion: Number,
  precioInstalacionPorPieza: Number,
  
  // Descuentos
  aplicaDescuento: Boolean,
  tipoDescuento: String,
  valorDescuento: Number,
  
  // Facturación
  requiereFactura: Boolean,
  razonSocial: String,
  rfc: String,
  
  // Pago
  metodoPago: String,
  anticipo: Number,
  
  // Totales calculados
  subtotal: Number,
  descuento: Number,
  iva: Number,
  total: Number
}
```

#### **4.3. Validaciones a Revisar**

**Validación de Medidas Técnicas**:
```javascript
// Verificar que valide:
- Ubicación no vacía
- Cantidad entre 1 y 20
- Ancho y alto de cada pieza
- ¿Campos técnicos obligatorios? (definir cuáles)
```

**Validación de Cotización Completa**:
```javascript
// Verificar que valide:
- Todas las validaciones de medidas técnicas
- Precio general > 0
- Si motorizado: modelo y precio de motor
- Si instalación: tipo y precio
- Si factura: razón social y RFC
- Método de pago seleccionado
```

---

### 🔴 PRIORIDAD 2: IMPLEMENTAR FASE 5 COMPLETA

**Objetivo**: Generación de PDF funcional

#### **5.1. Función `handleVerPDF`**
**Ubicación**: `AgregarMedidasProyectoModal.jsx`

**Implementar/Verificar**:
- [ ] Validación de datos completos antes de generar
- [ ] Formulario HTML se crea correctamente
- [ ] Se envía POST a `/api/proyectos/:id/generar-pdf`
- [ ] Manejo de estados de carga
- [ ] Manejo de errores
- [ ] Descarga automática del PDF
- [ ] Mensaje de éxito/error

**Estructura del formulario HTML**:
```javascript
const form = document.createElement('form');
form.method = 'POST';
form.action = `${API_URL}/proyectos/${proyecto._id}/generar-pdf`;
form.target = '_blank';

// Agregar todos los datos como campos hidden
// - Piezas con campos técnicos
// - Precios y totales
// - Motorización
// - Instalación
// - Descuentos
// - Facturación
```

#### **5.2. Endpoint Backend**
**Verificar en**: `server/routes/proyectos.js`

**Debe incluir**:
- [ ] Ruta POST `/proyectos/:id/generar-pdf`
- [ ] Generación de PDF con todos los campos técnicos
- [ ] Sección de Especificaciones Generales
- [ ] Tabla de Medidas Individuales (con 13 campos)
- [ ] Sección de Motorización
- [ ] Sección de Instalación Especial
- [ ] Tabla de totales
- [ ] Logo y datos de la empresa

---

### 🔴 PRIORIDAD 3: IMPLEMENTAR FASE 6 COMPLETA

**Objetivo**: Integración completa con LevantamientoTab

#### **6.1. Reemplazo de AgregarEtapaModal**
**Ubicación**: `client/src/modules/proyectos/components/LevantamientoTab.jsx`

**Verificar**:
- [ ] Import de `AgregarMedidasProyectoModal` correcto
- [ ] Prop `conPrecios` se pasa correctamente desde modal selector
- [ ] Callback `onActualizar` funciona
- [ ] Modal se abre/cierra correctamente
- [ ] Datos se cargan al editar partida existente

**Código a verificar**:
```javascript
// Modal selector (debe tener dos opciones)
<Dialog>
  <Button onClick={() => {
    setConPrecios(false);
    setDialogoPartidas(true);
  }}>
    📐 Levantamiento de Medidas (Sin precios)
  </Button>
  
  <Button onClick={() => {
    setConPrecios(true);
    setDialogoPartidas(true);
  }}>
    💰 Cotización en Vivo (Con precios)
  </Button>
</Dialog>

// Modal principal
<AgregarMedidasProyectoModal
  open={dialogoPartidas}
  onClose={cerrarDialogoPartidas}
  proyecto={proyecto}
  conPrecios={conPrecios}
  onActualizar={actualizarProyecto}
  medidaEditando={medidaEditando}
/>
```

#### **6.2. Flujo de Datos**

**Verificar flujo completo**:
1. Usuario hace clic en "Agregar Partida"
2. Se abre modal selector
3. Usuario selecciona "Levantamiento" o "Cotización"
4. Se abre `AgregarMedidasProyectoModal` con `conPrecios` correcto
5. Usuario llena formulario
6. Usuario guarda
7. Datos se envían al backend
8. Backend guarda en BD
9. Callback `onActualizar` se ejecuta
10. Lista de partidas se actualiza
11. Modal se cierra

---

## 🟡 FUNCIONALIDADES PENDIENTES (NO CRÍTICAS)

### **1. Kit de Toldo** ❌ NO IMPLEMENTADO

**Campos en `usePiezasManager.js`** (YA EXISTEN):
```javascript
esToldo: false,
tipoToldo: 'caida_vertical',
kitModelo: '',
kitModeloManual: '',
kitPrecio: ''
```

**Falta implementar en formularios**:
- [ ] Checkbox "¿Es Toldo?"
- [ ] Selector de tipo de toldo
  - Caída vertical
  - Brazo articulado
  - Brazo invisible
  - Punto recto
  - Otro
- [ ] Selector de modelo de kit
- [ ] Campo manual "Otro modelo"
- [ ] Campo de precio del kit
- [ ] Visualización en panel de detalles
- [ ] Incluir en cálculos de cotización

**Ubicación sugerida**: Después de sección de Motorización

---

### **2. Fotos y Archivos** ❌ NO IMPLEMENTADO

**Campos en `usePiezasManager.js`** (YA EXISTEN):
```javascript
fotoUrls: [],
videoUrl: ''
```

**Falta implementar**:
- [ ] Componente de subida de archivos (Dropzone o similar)
- [ ] Preview de fotos subidas
- [ ] Preview de video
- [ ] Botón eliminar foto individual
- [ ] Integración con backend para upload
- [ ] Almacenamiento en servidor/cloud
- [ ] Visualización en panel de detalles
- [ ] Incluir en PDF generado

**Requiere**: Endpoint backend para upload de archivos

---

### **3. Sugerencias Inteligentes** ⚠️ PARCIALMENTE IMPLEMENTADO

**Código existente** (`AgregarMedidaPartidasModal.jsx` líneas 999-1006):
```javascript
// Solo hay UNA sugerencia implementada
if (medida.detalleTecnico === 'traslape' && piezasManager.piezaForm.cantidad > 1) {
  sugerencias.push({
    tipo: 'info',
    mensaje: '📏 Traslape en múltiples piezas: Verificar alineación visual.'
  });
}
```

**Falta implementar**:
- [ ] Sistema completo de detección automática
- [ ] Sugerencias por tipo de instalación
  - Muro: Sugerir fijación en concreto/tablaroca
  - Techo: Advertir sobre peso y soporte
  - Piso-Techo: Sugerir guías laterales
- [ ] Sugerencias por sistema
  - Roller: Sugerir galería
  - Zebra: Sugerir control específico
  - Panel: Sugerir rieles
- [ ] Sugerencias por medidas
  - Ancho > 3m: Advertir sobre refuerzos
  - Alto > 3m: Sugerir motorización
- [ ] Sugerencias de etapa completa
- [ ] Panel de sugerencias visible en UI
- [ ] Contador de sugerencias

---

### **4. Productos Personalizados** ❌ NO IMPLEMENTADO

**Falta implementar**:
- [ ] Modal para crear producto custom
- [ ] Formulario con campos:
  - Nombre del producto
  - Categoría
  - Precio base
  - Campos técnicos aplicables
- [ ] Guardar en base de datos
- [ ] Integración con selector de productos
- [ ] Sugerencias rápidas basadas en historial

---

### **5. Funciones de Copia** ⚠️ PARCIALMENTE IMPLEMENTADO

**Código existente** (`AgregarMedidaPartidasModal.jsx` líneas 595-620):
```javascript
const copiarDePiezaAnterior = () => {
  // Implementado pero botón no visible
}
```

**Implementado**:
- ✅ Lógica de copiar de pieza anterior

**Falta implementar**:
- [ ] Botón "Copiar de pieza anterior" visible en UI
- [ ] Función "Copiar pieza 1 a todas"
- [ ] Botón "Aplicar pieza 1 a todas" visible
- [ ] Confirmación antes de copiar
- [ ] Indicador visual de qué se copió
- [ ] Opción de copiar solo campos técnicos (sin medidas)

**Ubicación sugerida**: Encima del formulario de cada pieza

---

### **6. Validaciones Técnicas Avanzadas** ⚠️ BÁSICAS IMPLEMENTADAS

**Código existente** (`usePiezasManager.js` líneas 72-81):
```javascript
const validarMedidas = useCallback((cantidad, medidas) => {
  // Solo valida ancho y alto
  for (let i = 0; i < cantidad; i += 1) {
    const medida = medidas[i];
    if (!medida || !medida.ancho || !medida.alto) {
      setErrorLocal(`Completa las medidas de la pieza ${i + 1}.`);
      return false;
    }
  }
  return true;
}, [setErrorLocal]);
```

**Falta implementar**:
- [ ] Validar campos técnicos obligatorios para levantamiento
  - Instalación
  - Fijación
  - Sistema
- [ ] Advertencias de campos faltantes (no bloqueantes)
  - Control
  - Caída
  - Galería
- [ ] Validación por tipo de producto
  - Roller: Requiere galería
  - Motorizado: Requiere control
- [ ] Sugerencias de campos recomendados
- [ ] Indicador visual de completitud (%)
- [ ] Lista de campos faltantes

---

## 📊 RESUMEN DE PRIORIDADES

### **PARA MAÑANA (CRÍTICO)** 🔴
1. ✅ **Revisar Fase 4**: Funciones de guardado
2. ✅ **Implementar Fase 5**: Generación de PDF
3. ✅ **Implementar Fase 6**: Integración con LevantamientoTab

### **SIGUIENTE SPRINT (IMPORTANTE)** 🟡
4. Kit de Toldo
5. Funciones de Copia completas
6. Validaciones Técnicas avanzadas

### **FUTURO (DESEABLE)** 🟢
7. Fotos y Archivos (requiere backend)
8. Sugerencias Inteligentes completas
9. Productos Personalizados

---

## 🧪 PLAN DE PRUEBAS PARA MAÑANA

### **Test 1: Guardado de Medidas Técnicas (Sin precios)**
1. Abrir modal en modo "Levantamiento"
2. Agregar partida con 3 piezas
3. Llenar todos los campos técnicos
4. Usar campos manuales (Detalle: Otro, Traslape: Otro)
5. Guardar
6. Verificar en BD que se guardaron todos los campos
7. Reabrir para editar
8. Verificar que todos los datos se cargan correctamente

### **Test 2: Guardado de Cotización Completa (Con precios)**
1. Abrir modal en modo "Cotización en Vivo"
2. Agregar partida con 2 piezas
3. Llenar campos técnicos
4. Configurar motorización
5. Configurar instalación especial
6. Aplicar descuento
7. Configurar facturación
8. Seleccionar método de pago
9. Guardar
10. Verificar cálculos de totales
11. Verificar en BD

### **Test 3: Generación de PDF**
1. Crear cotización completa
2. Hacer clic en "Ver PDF"
3. Verificar que se genera correctamente
4. Verificar que incluye:
   - Especificaciones Generales
   - Todas las piezas con campos técnicos
   - Motorización
   - Instalación
   - Totales
5. Verificar formato y diseño

### **Test 4: Integración con LevantamientoTab**
1. Ir a pestaña "Levantamiento"
2. Hacer clic en "Agregar Partida"
3. Verificar modal selector
4. Seleccionar "Levantamiento"
5. Verificar que modal se abre sin precios
6. Guardar partida
7. Verificar que aparece en lista
8. Editar partida
9. Verificar que datos se cargan
10. Repetir con "Cotización en Vivo"

---

## 📝 NOTAS TÉCNICAS

### **Estructura de Datos en BD**
```javascript
{
  proyecto: ObjectId,
  tipo: 'levantamiento' | 'cotizacion',
  piezas: [{
    ubicacion: String,
    cantidad: Number,
    medidas: [{
      ancho: Number,
      alto: Number,
      area: Number,
      
      // Campos técnicos
      galeria: String,
      tipoControl: String,
      caida: String,
      orientacion: String,
      tipoInstalacion: String,
      tipoFijacion: String,
      modoOperacion: String,
      
      detalleTecnico: String,
      detalleTecnicoManual: String,
      traslape: String,
      traslapeManual: String,
      
      telaMarca: String,
      baseTabla: String,
      sistema: [String],
      sistemaEspecial: [String],
      observacionesTecnicas: String,
      
      producto: String,
      productoLabel: String,
      color: String,
      modeloCodigo: String,
      precioM2: Number
    }],
    
    // Solo si es cotización
    motorizado: Boolean,
    motorModelo: String,
    motorPrecio: Number,
    // ... resto de campos de cotización
  }],
  
  // Solo si es cotización
  precioGeneral: Number,
  aplicaDescuento: Boolean,
  // ... resto de campos de cotización
  
  totales: {
    subtotal: Number,
    descuento: Number,
    iva: Number,
    total: Number
  }
}
```

---

## ✅ CHECKLIST FINAL PARA MAÑANA

- [ ] Revisar función `handleGuardarMedidasTecnicas`
- [ ] Revisar función `handleGuardarCotizacionEnVivo`
- [ ] Verificar validaciones de ambas funciones
- [ ] Implementar/Revisar función `handleVerPDF`
- [ ] Verificar endpoint backend de PDF
- [ ] Verificar integración en `LevantamientoTab`
- [ ] Ejecutar Test 1: Guardado sin precios
- [ ] Ejecutar Test 2: Guardado con precios
- [ ] Ejecutar Test 3: Generación de PDF
- [ ] Ejecutar Test 4: Integración completa
- [ ] Documentar bugs encontrados
- [ ] Priorizar siguientes funcionalidades

---

**Última actualización**: 29 de Octubre, 2025 - 8:10 PM  
**Responsable**: Equipo de Desarrollo Sundeck  
**Estado**: En Progreso - Fases 1-3 Completadas, Fases 4-6 Pendientes de Revisión
