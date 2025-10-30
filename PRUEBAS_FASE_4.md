# 🧪 PLAN DE PRUEBAS - FASE 4

**Fecha**: 30 de Octubre, 2025  
**Objetivo**: Validar funciones de guardado de levantamiento y cotización

---

## 🚀 PREPARACIÓN DEL ENTORNO

### **1. Iniciar el servidor backend**
```bash
cd server
npm run dev
```
**Verificar**: Consola muestra "Servidor corriendo en puerto 5001"

### **2. Iniciar el cliente frontend**
```bash
cd client
npm start
```
**Verificar**: Navegador abre en http://localhost:3000

### **3. Iniciar sesión**
- Usuario: [tu usuario de prueba]
- Contraseña: [tu contraseña]

### **4. Navegar a Proyectos**
- Ir a módulo "Proyectos"
- Seleccionar un proyecto existente o crear uno nuevo

---

## ✅ TEST 1: Guardado de Levantamiento (SIN PRECIOS)

### **Objetivo**: Verificar que se guarden correctamente las medidas técnicas sin precios

### **Pasos**:

1. **Abrir modal de levantamiento**
   - Clic en "Agregar Partida"
   - Seleccionar "📐 Levantamiento de Medidas (Sin precios)"
   - ✅ Verificar: Modal se abre con título "📏 Agregar Medidas Técnicas"
   - ✅ Verificar: Chip muestra "SIN PRECIOS"

2. **Agregar primera partida**
   - Ubicación: "Sala comedor"
   - Producto: "Persianas Blackout"
   - Color: "Ivory"
   - Modelo/Código: "Long Beach"
   - Cantidad: 3 piezas

3. **Llenar medidas de Pieza 1**
   - Ancho: 2.5 m
   - Alto: 3.0 m
   - Sistema: Roller
   - Control: Izquierda
   - Instalación: Muro
   - Fijación: Concreto
   - Caída: Normal
   - Galería: Galería
   - Tela/Marca: "BDhome"
   - Base/Tabla: "15"
   - Operación: Manual
   - Detalle Técnico: Traslape
   - Traslape: 10cm

4. **Llenar medidas de Pieza 2 y 3**
   - Copiar valores similares
   - Cambiar solo ancho si es necesario

5. **Agregar partida**
   - Clic en "Agregar Partida"
   - ✅ Verificar: Partida aparece en lista
   - ✅ Verificar: Muestra "Sala comedor - 3 piezas"

6. **Guardar levantamiento**
   - Clic en botón "Guardar" (verde)
   - ✅ Verificar: Botón muestra "Guardando..."
   - ✅ Verificar: No hay errores en consola
   - ✅ Verificar: Modal se cierra
   - ✅ Verificar: Lista de partidas se actualiza

### **Verificaciones en Backend**:

7. **Revisar consola del servidor**
   ```
   ✅ Debe mostrar:
   🔧 Guardando levantamiento para proyecto: [id]
   📊 AUDIT: LEVANTAMIENTO_GUARDADO
   ✅ Levantamiento guardado
   ```

8. **Verificar en MongoDB**
   ```javascript
   // Abrir MongoDB Compass o mongo shell
   db.proyectos.findOne({ _id: ObjectId("[id]") })
   
   ✅ Verificar campos:
   - levantamiento.partidas (array con 1 elemento)
   - levantamiento.partidas[0].ubicacion = "Sala comedor"
   - levantamiento.partidas[0].cantidad = 3
   - levantamiento.partidas[0].piezas (array con 3 elementos)
   - levantamiento.partidas[0].piezas[0].ancho = 2.5
   - levantamiento.partidas[0].piezas[0].sistema = "Roller"
   - levantamiento.totales.m2 = 22.5 (2.5 × 3.0 × 3 piezas)
   - estado = "levantamiento"
   ```

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar cualquier error o comportamiento inesperado]
```

---

## ✅ TEST 2: Validaciones de Campos Obligatorios

### **Objetivo**: Verificar que las validaciones bloqueen guardado incompleto

### **Pasos**:

1. **Intentar guardar sin partidas**
   - Abrir modal
   - Clic en "Guardar" sin agregar partidas
   - ✅ Verificar: Mensaje de error "Debes agregar al menos una partida"

2. **Intentar agregar partida sin ubicación**
   - Llenar solo medidas, dejar ubicación vacía
   - Clic en "Agregar Partida"
   - ✅ Verificar: Mensaje de error "Completa la ubicación"

3. **Intentar agregar partida sin medidas**
   - Llenar ubicación
   - Dejar ancho y alto vacíos
   - Clic en "Agregar Partida"
   - ✅ Verificar: Mensaje de error "Completa las medidas de la pieza 1"

4. **Intentar guardar sin campos técnicos**
   - Llenar ubicación, ancho y alto
   - Dejar sistema, control, instalación vacíos
   - Agregar partida
   - Clic en "Guardar"
   - ✅ Verificar: Mensaje de error listando campos faltantes:
     ```
     Completa los campos obligatorios:
     Partida 1 (Sala comedor):
     Pieza 1: Sistema es obligatorio
     Pieza 1: Control es obligatorio
     Pieza 1: Tipo de instalación es obligatorio
     ...
     ```

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar cualquier error o comportamiento inesperado]
```

---

## ✅ TEST 3: Guardado de Cotización (CON PRECIOS)

### **Objetivo**: Verificar guardado completo con precios, motorización e instalación

### **Pasos**:

1. **Abrir modal de cotización**
   - Clic en "Agregar Partida"
   - Seleccionar "💰 Cotización en Vivo (Con precios)"
   - ✅ Verificar: Modal se abre con título "💰 Agregar Medidas con Precios"
   - ✅ Verificar: Chip muestra "CON PRECIOS"

2. **Configurar precio general**
   - Precio por m²: $750
   - ✅ Verificar: Campo visible y editable

3. **Agregar partida con medidas**
   - Ubicación: "Recámara principal"
   - Producto: "Persianas Zebra"
   - Color: "Gris"
   - Modelo: "Manhattan"
   - Cantidad: 2 piezas
   - Pieza 1: 2.0m × 2.5m
   - Pieza 2: 2.0m × 2.5m
   - Llenar todos los 13 campos técnicos

4. **Configurar motorización**
   - Marcar "Motorizado"
   - Modelo de motor: "Somfy RTS"
   - Precio motor: $7,000
   - Número de motores: 1
   - Modelo de control: "15 canales"
   - Precio control: $1,200

5. **Configurar instalación especial**
   - Marcar "Cobra instalación"
   - Tipo: "Fijo"
   - Precio: $3,500

6. **Configurar descuento**
   - Marcar "Aplica descuento"
   - Tipo: "Porcentaje"
   - Valor: 10%

7. **Configurar facturación**
   - Marcar "Requiere factura"
   - Razón social: "Empresa SA de CV"
   - RFC: "EMP123456ABC"

8. **Verificar cálculos en pantalla**
   ```
   ✅ Área total: 10 m² (2.0 × 2.5 × 2)
   ✅ Subtotal productos: $7,500 (10 × 750)
   ✅ Motorización: $8,200 (7,000 + 1,200)
   ✅ Instalación: $3,500
   ✅ Subtotal: $19,200
   ✅ Descuento 10%: $1,920
   ✅ Subtotal con descuento: $17,280
   ✅ IVA 16%: $2,764.80
   ✅ TOTAL: $20,044.80
   ```

9. **Guardar cotización**
   - Clic en "Guardar"
   - ✅ Verificar: Botón muestra "Guardando..."
   - ✅ Verificar: No hay errores
   - ✅ Verificar: Modal se cierra

### **Verificaciones en Backend**:

10. **Revisar consola del servidor**
    ```
    ✅ Debe mostrar:
    💰 Creando cotización para proyecto: [id]
    📊 AUDIT: COTIZACION_CREADA
    ✅ Cotización guardada
    ```

11. **Verificar en MongoDB - Proyecto**
    ```javascript
    db.proyectos.findOne({ _id: ObjectId("[id]") })
    
    ✅ Verificar:
    - levantamiento.partidas[0].piezas[0].precioM2 = 750
    - levantamiento.partidas[0].motorizacion.activa = true
    - levantamiento.partidas[0].motorizacion.precioMotor = 7000
    - levantamiento.partidas[0].instalacionEspecial.activa = true
    - levantamiento.partidas[0].totales.costoMotorizacion = 8200
    - levantamiento.totales.total = 20044.80
    - cotizacionActual.numero = "COT-0001" (o siguiente)
    - cotizacionActual.totales.total = 20044.80
    - estado = "cotizacion"
    ```

12. **Verificar en MongoDB - Cotización**
    ```javascript
    db.cotizaciones.findOne({ numero: "COT-0001" })
    
    ✅ Verificar:
    - numero = "COT-0001"
    - proyecto = ObjectId("[id del proyecto]")
    - partidas (array con datos completos)
    - totales.total = 20044.80
    - precioReglas.precio_m2 = 750
    - precioReglas.aplicaDescuento = true
    - facturacion.requiereFactura = true
    - facturacion.rfc = "EMP123456ABC"
    - estado = "borrador"
    ```

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar cualquier error o comportamiento inesperado]
```

---

## ✅ TEST 4: Validaciones de Cotización

### **Objetivo**: Verificar validaciones específicas de cotización

### **Pasos**:

1. **Intentar guardar con precio general = 0**
   - Configurar precio: $0
   - Agregar partida
   - Clic en "Guardar"
   - ✅ Verificar: Error "El precio general debe ser mayor a 0"

2. **Intentar guardar motorizado sin modelo**
   - Marcar "Motorizado"
   - Dejar modelo de motor vacío
   - Agregar partida
   - Clic en "Guardar"
   - ✅ Verificar: Error "Modelo de motor es obligatorio"

3. **Intentar guardar con factura sin RFC**
   - Marcar "Requiere factura"
   - Llenar razón social
   - Dejar RFC vacío
   - Agregar partida
   - Clic en "Guardar"
   - ✅ Verificar: Error de datos de facturación incompletos

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar cualquier error o comportamiento inesperado]
```

---

## ✅ TEST 5: Cálculos de Totales

### **Objetivo**: Verificar que los cálculos sean correctos

### **Escenario de Prueba**:
```
Partida: 3 piezas de 2.5m × 3.0m
Precio: $750/m²
Motorización: 1 motor ($7,000) + 1 control ($1,200)
Instalación: Fija ($3,500)
Descuento: 10%
Factura: Sí (IVA 16%)
```

### **Cálculos Esperados**:
```
1. m² totales: 22.5 m² (2.5 × 3.0 × 3)
2. Subtotal productos: $16,875 (22.5 × 750)
3. Motorización: $8,200 (7,000 + 1,200)
4. Instalación: $3,500
5. Subtotal: $28,575
6. Descuento 10%: $2,857.50
7. Subtotal con descuento: $25,717.50
8. IVA 16%: $4,114.80
9. TOTAL: $29,832.30
```

### **Pasos**:
1. Crear cotización con datos del escenario
2. Verificar cada cálculo en pantalla
3. Guardar y verificar en BD

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Cálculos verificados**:
- [ ] m² totales
- [ ] Subtotal productos
- [ ] Motorización
- [ ] Instalación
- [ ] Descuento
- [ ] IVA
- [ ] Total final

**Notas**:
```
[Anotar diferencias en cálculos]
```

---

## ✅ TEST 6: Integración con LevantamientoTab

### **Objetivo**: Verificar que el flujo completo funcione desde la pestaña

### **Pasos**:

1. **Ir a pestaña Levantamiento**
   - Navegar a proyecto
   - Clic en pestaña "Levantamiento"
   - ✅ Verificar: Pestaña se muestra

2. **Abrir modal desde botón**
   - Clic en "Agregar Partida"
   - ✅ Verificar: Modal selector se abre

3. **Seleccionar tipo de levantamiento**
   - Clic en "Levantamiento de Medidas"
   - ✅ Verificar: Modal principal se abre sin precios

4. **Guardar y verificar actualización**
   - Agregar partida
   - Guardar
   - ✅ Verificar: Lista se actualiza automáticamente
   - ✅ Verificar: Nueva partida aparece en la lista

5. **Editar partida existente**
   - Clic en "Editar" de una partida
   - ✅ Verificar: Modal se abre con datos cargados
   - Modificar un valor
   - Guardar
   - ✅ Verificar: Cambios se reflejan

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar problemas de integración]
```

---

## ✅ TEST 7: Eventos de Auditoría

### **Objetivo**: Verificar que los eventos se registren correctamente

### **Pasos**:

1. **Guardar levantamiento**
   - Realizar guardado completo
   - Revisar consola del servidor
   - ✅ Verificar log:
     ```
     📊 AUDIT: LEVANTAMIENTO_GUARDADO {
       proyectoId: "...",
       usuario: "...",
       partidas: 1,
       m2Total: 22.5,
       fecha: "..."
     }
     ```

2. **Crear cotización**
   - Realizar guardado completo
   - Revisar consola del servidor
   - ✅ Verificar log:
     ```
     📊 AUDIT: COTIZACION_CREADA {
       proyectoId: "...",
       cotizacionId: "...",
       numero: "COT-0001",
       usuario: "...",
       total: 20044.80,
       m2Total: 10,
       fecha: "..."
     }
     ```

### **Resultado Esperado**: ✅ PASS / ❌ FAIL

**Notas**:
```
[Anotar si faltan eventos]
```

---

## 📊 RESUMEN DE PRUEBAS

| # | Test | Estado | Notas |
|---|------|--------|-------|
| 1 | Guardado de Levantamiento | ⬜ | |
| 2 | Validaciones Obligatorias | ⬜ | |
| 3 | Guardado de Cotización | ⬜ | |
| 4 | Validaciones de Cotización | ⬜ | |
| 5 | Cálculos de Totales | ⬜ | |
| 6 | Integración LevantamientoTab | ⬜ | |
| 7 | Eventos de Auditoría | ⬜ | |

**Leyenda**: ⬜ Pendiente | ✅ PASS | ❌ FAIL | ⚠️ Con observaciones

---

## 🐛 BUGS ENCONTRADOS

### Bug #1
**Descripción**: 
**Pasos para reproducir**:
**Resultado esperado**:
**Resultado actual**:
**Prioridad**: 🔴 Alta / 🟡 Media / 🟢 Baja

---

## ✅ CHECKLIST FINAL

Antes de pasar a Fase 5, verificar:

- [ ] Todos los tests pasan (7/7)
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del servidor
- [ ] Datos se guardan correctamente en MongoDB
- [ ] Validaciones funcionan correctamente
- [ ] Cálculos son precisos
- [ ] Eventos de auditoría se registran
- [ ] Modal se cierra después de guardar
- [ ] Lista se actualiza automáticamente

---

**Responsable de pruebas**: [Nombre]  
**Fecha de ejecución**: [Fecha]  
**Resultado general**: ⬜ PASS / ⬜ FAIL  
**Listo para Fase 5**: ⬜ SÍ / ⬜ NO
