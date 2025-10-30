# 🧪 PRUEBAS DE FASE 4, 5 Y 6 - EJECUTAR AHORA

**Fecha**: 30 de Octubre, 2025  
**Hora**: 1:40 PM  
**Estado Servidores**: 
- ✅ Backend corriendo en puerto 5001
- ✅ Frontend corriendo en puerto 3000

---

## 📋 TEST 1: GUARDADO DE MEDIDAS TÉCNICAS (Sin precios)

### Objetivo
Verificar que `handleGuardarMedidasTecnicas` guarda correctamente todos los campos técnicos.

### Pasos a Seguir

1. **Navegar al módulo de Proyectos**
   - Ir a http://localhost:3000
   - Login si es necesario
   - Clic en "Proyectos" en el menú lateral

2. **Seleccionar un proyecto existente**
   - Buscar proyecto de prueba
   - Clic en el proyecto para abrirlo
   - Ir a la pestaña "Levantamiento"

3. **Abrir modal de levantamiento**
   - Clic en botón "📏 Agregar Medidas"
   - En el modal selector, clic en "📋 Sin Precios"
   - Verificar que se abre `AgregarMedidaPartidasModal`

4. **Llenar formulario con 2 piezas**
   
   **Datos Generales:**
   - Ubicación: `Sala Principal`
   - Cantidad: `2`
   - Producto: `Persianas Screen 3%`
   - Color: `Blanco`

   **Pieza 1:**
   - Ancho: `2.50`
   - Alto: `3.00`
   - Galería: `Sí`
   - Base/Tabla: `15 cm`
   - Control: `Izquierdo`
   - Caída: `Normal`
   - Tipo Instalación: `Muro`
   - Tipo Fijación: `Concreto`
   - Modo Operación: `Manual`
   - Sistema: Seleccionar `Roller`
   - Detalle Técnico: `Traslape`
   - Traslape: `10cm`
   - Tela/Marca: `Screen 3% Premium`
   - Observaciones: `Ventana principal con vista al jardín`

   **Pieza 2:**
   - Ancho: `2.80`
   - Alto: `2.50`
   - Galería: `No`
   - Control: `Derecho`
   - Caída: `Normal`
   - Tipo Instalación: `Techo`
   - Tipo Fijación: `Tablaroca`
   - Modo Operación: `Manual`
   - Sistema: Seleccionar `Roller`
   - Detalle Técnico: `Corte`
   - Traslape: `No aplica`
   - Tela/Marca: `Screen 3% Premium`
   - Observaciones: `Ventana secundaria`

5. **Guardar y verificar**
   - Clic en botón "Guardar Levantamiento"
   - **Verificar en consola del navegador (F12)**:
     ```
     🔧 Guardando medidas técnicas...
     📤 Enviando payload: {...}
     ✅ Levantamiento guardado: {...}
     ```
   - Verificar que el modal se cierra
   - Verificar que la partida aparece en la lista

6. **Verificar datos guardados**
   - Abrir MongoDB Compass o consola
   - Buscar el proyecto actualizado
   - Verificar que existe el campo `levantamiento` o `medidas`
   - Verificar que contiene los 13 campos técnicos por pieza

### ✅ Criterios de Éxito
- [ ] Modal se abre correctamente
- [ ] Formulario permite llenar todos los campos
- [ ] No hay errores de validación
- [ ] Payload se envía correctamente
- [ ] Backend responde con éxito
- [ ] Modal se cierra automáticamente
- [ ] Partida aparece en la lista
- [ ] Datos se guardan en BD con todos los campos

### ❌ Si Falla
- Capturar error de consola
- Capturar respuesta del backend
- Verificar endpoint `/proyectos/:id/levantamiento`

---

## 📋 TEST 2: GUARDADO DE COTIZACIÓN COMPLETA (Con precios)

### Objetivo
Verificar que `handleGuardarCotizacionEnVivo` guarda correctamente con motorización, instalación y cálculos.

### Pasos a Seguir

1. **Abrir modal de cotización**
   - Desde la pestaña "Levantamiento"
   - Clic en "📏 Agregar Medidas"
   - En el modal selector, clic en "💰 Con Precios"
   - Verificar que se abre `AgregarMedidasProyectoModal` con campos de precios

2. **Llenar especificaciones generales**
   - Cantidad: `2`
   - Color: `Gris`
   - Modelo/Código: `SC-3%`
   - Precio General: `750`

3. **Llenar medidas individuales (Acordeón)**
   
   **Pieza 1:**
   - Ancho: `3.00`
   - Alto: `2.50`
   - Galería: `Sí`
   - Base/Tabla: `15 cm`
   - Control: `Izquierdo`
   - Caída: `Normal`
   - Tipo Instalación: `Muro`
   - Tipo Fijación: `Concreto`
   - Modo Operación: `Manual`
   - Sistema: `Roller`
   - Detalle: `Traslape`
   - Traslape: `10cm`

   **Pieza 2:**
   - Ancho: `2.50`
   - Alto: `3.00`
   - Galería: `Sí`
   - Base/Tabla: `18 cm`
   - Control: `Derecho`
   - Caída: `Normal`
   - Tipo Instalación: `Muro`
   - Tipo Fijación: `Concreto`
   - Modo Operación: `Manual`
   - Sistema: `Roller`
   - Detalle: `Sin traslape`
   - Traslape: `No aplica`

4. **Configurar motorización (Acordeón)**
   - Activar: `Sí`
   - Modelo Motor: `Somfy 35Nm`
   - Precio Motor: `9500`
   - Número de Motores: `2`
   - Modelo Control: `Monocanal`
   - Precio Control: `2500`

5. **Configurar instalación especial (Acordeón)**
   - Activar: `Sí`
   - Tipo de Cobro: `Por Pieza`
   - Precio por Pieza: `1500`

6. **Configurar descuentos**
   - Aplicar Descuento: `Sí`
   - Tipo: `Porcentaje`
   - Valor: `10`

7. **Configurar facturación**
   - Requiere Factura: `Sí`
   - Razón Social: `Empresa Test SA de CV`
   - RFC: `ETE123456ABC`

8. **Guardar y verificar**
   - Clic en "Guardar Cotización"
   - **Verificar en consola**:
     ```
     💰 Guardando cotización en vivo...
     📤 Enviando payload de cotización: {...}
     ✅ Cotización guardada: {...}
     ```
   - Verificar cálculos en consola:
     - Subtotal productos
     - Costo motorización
     - Costo instalación
     - Descuento aplicado
     - IVA
     - Total final

### ✅ Criterios de Éxito
- [ ] Modal se abre con campos de precios
- [ ] Acordeones funcionan correctamente
- [ ] Cálculos en tiempo real son correctos
- [ ] Motorización se guarda correctamente
- [ ] Instalación especial se calcula bien
- [ ] Descuentos se aplican correctamente
- [ ] IVA se calcula correctamente
- [ ] Payload completo se envía
- [ ] Backend responde con éxito
- [ ] Cotización se guarda en BD

### 🧮 Cálculos Esperados
```
Pieza 1: 3.00 × 2.50 = 7.5 m² × $750 = $5,625
Pieza 2: 2.50 × 3.00 = 7.5 m² × $750 = $5,625
Subtotal Productos: $11,250

Motorización:
- 2 motores × $9,500 = $19,000
- 2 controles × $2,500 = $5,000
Total Motorización: $24,000

Instalación:
- 2 piezas × $1,500 = $3,000

Subtotal: $11,250 + $24,000 + $3,000 = $38,250
Descuento 10%: $3,825
Subtotal con Descuento: $34,425
IVA 16%: $5,508
Total Final: $39,933
```

---

## 📋 TEST 3: GENERACIÓN DE PDF

### Objetivo
Verificar que `handleVerPDF` genera correctamente el PDF con todos los datos.

### Pasos a Seguir

1. **Después de guardar la cotización del Test 2**
   - Verificar que el botón "Ver PDF" está habilitado
   - Verificar que muestra el icono de PDF

2. **Generar PDF**
   - Clic en botón "Ver PDF"
   - **Verificar en consola**:
     ```
     📄 Generando PDF...
     ✅ PDF generado y descargado
     ```

3. **Verificar descarga**
   - Verificar que se descarga un archivo PDF
   - Nombre esperado: `COTIZACION-[NombreCliente]-2025-10-30.pdf`

4. **Abrir y revisar PDF**
   
   **Debe contener:**
   - [ ] Logo de Sundeck
   - [ ] Datos del proyecto
   - [ ] Datos del cliente
   - [ ] Fecha de cotización
   
   **Sección: Especificaciones Generales**
   - [ ] Cantidad: 2 piezas
   - [ ] Área Total: 15.00 m²
   - [ ] Color: Gris
   - [ ] Modelo: SC-3%
   
   **Tabla: Medidas Individuales**
   - [ ] Pieza 1: 3.00 × 2.50 m
   - [ ] Pieza 2: 2.50 × 3.00 m
   - [ ] Todos los 13 campos técnicos por pieza
   - [ ] Galería, Control, Caída, Instalación, etc.
   
   **Sección: Motorización**
   - [ ] Modelo Motor: Somfy 35Nm
   - [ ] Cantidad: 2 motores
   - [ ] Precio: $9,500 c/u
   - [ ] Modelo Control: Monocanal
   - [ ] Total Motorización: $24,000
   
   **Sección: Instalación Especial**
   - [ ] Tipo: Por Pieza
   - [ ] Precio: $1,500 por pieza
   - [ ] Total: $3,000
   
   **Tabla: Totales**
   - [ ] Subtotal Productos: $11,250
   - [ ] Motorización: $24,000
   - [ ] Instalación: $3,000
   - [ ] Subtotal: $38,250
   - [ ] Descuento 10%: -$3,825
   - [ ] Subtotal con Descuento: $34,425
   - [ ] IVA 16%: $5,508
   - [ ] **TOTAL: $39,933**

### ✅ Criterios de Éxito
- [ ] PDF se genera sin errores
- [ ] PDF se descarga automáticamente
- [ ] Nombre del archivo es correcto
- [ ] PDF contiene todas las secciones
- [ ] Datos técnicos están completos
- [ ] Cálculos son correctos
- [ ] Formato es profesional

### ❌ Si Falla
- Verificar endpoint `/proyectos/:id/generar-pdf`
- Verificar que existe `generar-pdf.js` en server
- Verificar logs del backend

---

## 📋 TEST 4: INTEGRACIÓN COMPLETA

### Objetivo
Verificar el flujo completo desde el modal selector hasta la visualización.

### Pasos a Seguir

1. **Flujo completo de levantamiento**
   - Ir a Proyectos → Seleccionar proyecto → Levantamiento
   - Clic en "📏 Agregar Medidas"
   - Verificar que aparece modal selector
   - Seleccionar "📋 Sin Precios"
   - Verificar que se abre el modal correcto
   - Llenar y guardar
   - Verificar que aparece en lista

2. **Flujo completo de cotización**
   - Clic en "📏 Agregar Medidas"
   - Seleccionar "💰 Con Precios"
   - Verificar que se abre el modal correcto
   - Llenar todos los campos
   - Guardar
   - Generar PDF
   - Verificar descarga

3. **Editar partida existente**
   - Buscar partida guardada en lista
   - Clic en botón "Editar"
   - Verificar que se cargan todos los datos
   - Modificar algún campo
   - Guardar
   - Verificar actualización

4. **Eliminar partida**
   - Buscar partida en lista
   - Clic en botón "Eliminar"
   - Confirmar eliminación
   - Verificar que desaparece de la lista

### ✅ Criterios de Éxito
- [ ] Modal selector funciona correctamente
- [ ] Se abre el modal correcto según selección
- [ ] Prop `conPrecios` se pasa correctamente
- [ ] Datos se guardan en BD
- [ ] Lista se actualiza automáticamente
- [ ] Edición carga datos correctamente
- [ ] Eliminación funciona
- [ ] No hay errores en consola

---

## 📊 RESUMEN DE RESULTADOS

### Test 1: Guardado Sin Precios
- Estado: [ ] ✅ Pasó / [ ] ❌ Falló
- Notas: _______________________________________________

### Test 2: Guardado Con Precios
- Estado: [ ] ✅ Pasó / [ ] ❌ Falló
- Notas: _______________________________________________

### Test 3: Generación de PDF
- Estado: [ ] ✅ Pasó / [ ] ❌ Falló
- Notas: _______________________________________________

### Test 4: Integración Completa
- Estado: [ ] ✅ Pasó / [ ] ❌ Falló
- Notas: _______________________________________________

---

## 🐛 BUGS ENCONTRADOS

### Bug #1
- **Descripción**: _____________________________________
- **Pasos para reproducir**: ___________________________
- **Error en consola**: _________________________________
- **Prioridad**: [ ] Alta / [ ] Media / [ ] Baja

### Bug #2
- **Descripción**: _____________________________________
- **Pasos para reproducir**: ___________________________
- **Error en consola**: _________________________________
- **Prioridad**: [ ] Alta / [ ] Media / [ ] Baja

---

## ✅ CHECKLIST FINAL

- [ ] Fase 4: Guardado sin precios funciona
- [ ] Fase 4: Guardado con precios funciona
- [ ] Fase 4: Validaciones funcionan correctamente
- [ ] Fase 4: Cálculos son precisos
- [ ] Fase 5: PDF se genera correctamente
- [ ] Fase 5: PDF contiene todos los datos
- [ ] Fase 5: Formato del PDF es profesional
- [ ] Fase 6: Modal selector funciona
- [ ] Fase 6: Integración con LevantamientoTab correcta
- [ ] Fase 6: Prop conPrecios se pasa correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend
- [ ] Datos se guardan correctamente en BD

---

**Responsable de Pruebas**: _______________  
**Fecha de Ejecución**: 30 de Octubre, 2025  
**Hora de Inicio**: _______________  
**Hora de Fin**: _______________  
**Resultado General**: [ ] ✅ Todas las pruebas pasaron / [ ] ⚠️ Algunas pruebas fallaron / [ ] ❌ Pruebas críticas fallaron
