# ✅ VERIFICACIÓN: PDFs DE ORDEN DE PRODUCCIÓN

**Fecha:** 18 Noviembre 2025, 10:18 AM  
**Proyecto:** ARQ-HECTOR-003  
**PDFs generados:** Lista de Pedido + Orden de Taller

---

## 📄 PDF 1: LISTA DE PEDIDO (PROVEEDOR)

### ✅ LO QUE DEBE APARECER

#### PÁGINA 1: INFORMACIÓN GENERAL
- ✅ Número de orden
- ✅ Fecha
- ✅ Cliente
- ✅ Resumen de piezas

#### PÁGINA 2: LISTA DE MATERIALES

**SECCIÓN: TUBOS**
```
Código - Descripción
>> PEDIR: X barras x 5.80m | Total: X ml
Desperdicio: X% | ✓ Disponible / ⚠ PEDIR A PROVEEDOR
```

**SECCIÓN: TELAS** ⭐ VERIFICAR ESTO
```
TELA-XXX - Descripción
>> PEDIR: X rollo(s) x Xm | Total: X ml
Modelo: [NOMBRE DEL MODELO] | Color: [COLOR]  ← DEBE APARECER
Anchos disponibles: 2.50m, 3.00m | ✓/⚠ Estado
[Observaciones si existen]
```

**Ejemplo esperado:**
```
TELA-BLACKOUT - Blackout 500
>> PEDIR: 2 rollo(s) x 3.00m | Total: 15.50 ml
Modelo: Blackout 500 | Color: Gris
Anchos disponibles: 2.50m, 3.00m | ⚠ PEDIR A PROVEEDOR
```

**SECCIÓN: MECANISMOS MANUALES**
```
Código - Descripción
>> PEDIR: X pza | Observaciones
```

**SECCIÓN: MOTORES Y CONTROLES**
```
MOTORES REQUERIDOS: X piezas motorizadas
Código - Descripción
>> PEDIR: X pza
```

**SECCIÓN: CONTRAPESOS**
```
Código - Descripción
>> PEDIR: X barras x 5.80m | Total: X ml
Desperdicio: X% | ✓/⚠ Estado
```

**SECCIÓN: ACCESORIOS**
```
- Descripción: X unidad
```

**RESUMEN DE PEDIDO**
```
Barras: X | Rollos: X | Items: X
```

---

## 📄 PDF 2: ORDEN DE TALLER (FABRICACIÓN)

### ✅ LO QUE DEBE APARECER

#### PÁGINA 1: ORDEN DE FABRICACIÓN
- ✅ Información del proyecto
- ✅ Cliente (nombre, teléfono, dirección)
- ✅ Resumen de piezas
- ✅ Cronograma (fechas)

#### PÁGINA 3: DETALLE POR PIEZA

**Para cada pieza:**

**ENCABEZADO:**
```
PIEZA #X
Ubicación
Medidas: X × Xm | Área: X m²
```

**ESPECIFICACIONES TÉCNICAS (13 campos):**
```
Sistema: [Roller Shade/Sheer/Toldos]
Control: [Manual/Motorizado]
Caída: [Interior/Exterior]
Tipo: [Manual/Motorizado]
Producto: [Nombre del producto]
Modelo: [Modelo de la tela]  ← DEBE APARECER
Color: [Color]  ← DEBE APARECER
Instalación: [Tipo]
Fijación: [Tipo]
Galería: [Sí/No]
Base/Tabla: [N/A]
Modo Operación: [Manual]
Traslape: [No aplica]
```

**MATERIALES (BOM):**
```
- Tipo: Descripción
  X.XX unidad
  [Observaciones si existen]
```

**CHECKLIST DE EMPAQUE:**
```
☐ Todas las piezas están correctamente etiquetadas
☐ Medidas verificadas y dentro de tolerancia
☐ Mecanismos probados y funcionando correctamente
☐ Acabados y color según especificación
☐ Embalaje protector aplicado
☐ Accesorios completos incluidos
☐ Documentación de instalación incluida
☐ Control de calidad aprobado
```

**FIRMAS:**
```
Responsable de Fabricación: _______________
Control de Calidad: _______________
Coordinador de Producción: _______________
```

---

## 🔍 PUNTOS CRÍTICOS A VERIFICAR

### 1. ✅ MODELO Y COLOR EN TELAS (Lista de Pedido)

**Ubicación:** Página 2, Sección TELAS

**Debe aparecer:**
```
Modelo: [nombre] | Color: [color]
```

**Código responsable:**
- `ordenProduccionService.js` líneas 541-542, 586-588, 626-627
- `pdfOrdenFabricacionService.js` líneas 226-233

**Si NO aparece:**
- Verificar que `pieza.modelo` y `pieza.color` tengan valores
- Revisar que se estén pasando correctamente al PDF

---

### 2. ✅ MODELO Y COLOR EN ESPECIFICACIONES (Orden de Taller)

**Ubicación:** Página 3, Especificaciones Técnicas

**Debe aparecer:**
```
Modelo: [nombre del modelo]
Color: [color de la tela]
```

**Código responsable:**
- `pdfOrdenFabricacionService.js` líneas 415-416

**Si NO aparece:**
- Verificar que `pieza.modelo` y `pieza.color` estén en los datos

---

### 3. ✅ SEPARACIÓN POR MODELO Y COLOR

**En Lista de Pedido, las telas deben estar separadas:**

**Correcto:**
```
TELA-BLACKOUT - Blackout 500
Modelo: Blackout 500 | Color: Gris
>> PEDIR: 10 ml

TELA-BLACKOUT - Blackout 500
Modelo: Blackout 500 | Color: Blanco
>> PEDIR: 8 ml
```

**Incorrecto:**
```
TELA-BLACKOUT - Blackout 500
>> PEDIR: 18 ml  ← Mezclados sin separar por color
```

**Código responsable:**
- `ordenProduccionService.js` líneas 521-526
- Clave: `${material.tipo}-${material.descripcion}-${modelo}-${color}`

---

### 4. ✅ ANCHOS DISPONIBLES

**Debe mostrar:**
```
Anchos disponibles: 2.50m, 3.00m
```

**Código responsable:**
- `ordenProduccionService.js` líneas 591-625
- `pdfOrdenFabricacionService.js` líneas 236-241

---

### 5. ✅ OBSERVACIONES/SUGERENCIAS

**Si existen, deben aparecer:**
```
[Texto de observación o sugerencia]
```

**Código responsable:**
- `pdfOrdenFabricacionService.js` líneas 244-249

---

## 📋 CHECKLIST DE VALIDACIÓN

### Lista de Pedido (Proveedor)
- [ ] **Telas tienen modelo y color visible**
- [ ] **Telas separadas por modelo Y color**
- [ ] **Anchos disponibles mostrados**
- [ ] **Optimización de cortes (barras/rollos)**
- [ ] **Estado de almacén (✓ Disponible / ⚠ PEDIR)**
- [ ] **Resumen de pedido correcto**

### Orden de Taller (Fabricación)
- [ ] **13 campos técnicos completos**
- [ ] **Modelo y color en especificaciones**
- [ ] **BOM (materiales) por pieza**
- [ ] **Checklist de empaque**
- [ ] **Firmas**

---

## 🐛 SI ALGO NO APARECE

### Modelo y Color NO aparecen:

**Verificar en orden:**

1. **Datos del proyecto:**
```javascript
// ¿El proyecto tiene modelo y color?
pieza.modelo // Debe tener valor
pieza.color  // Debe tener valor
```

2. **Servicio de orden:**
```javascript
// ordenProduccionService.js línea 293
modelo: partida.modelo || pieza.modeloCodigo || 'No especificado'
```

3. **Lista de pedido:**
```javascript
// ordenProduccionService.js líneas 541-542
modelo: pieza.modelo || pieza.modeloCodigo || pieza.producto || ''
color: pieza.color || ''
```

4. **PDF:**
```javascript
// pdfOrdenFabricacionService.js líneas 226-233
if (tela.modelo || tela.color) {
  // Se debe mostrar
}
```

---

## ✅ ESTADO ACTUAL

**Código implementado:** ✅ 100%
- Modelo y color se guardan correctamente
- Se separan telas por modelo y color
- Se muestran en el PDF

**Pendiente:** Validar con datos reales del proyecto ARQ-HECTOR-003

---

## 🚀 PRÓXIMOS PASOS

1. **Abrir PDFs generados**
2. **Verificar sección de TELAS en Lista de Pedido**
3. **Verificar especificaciones en Orden de Taller**
4. **Confirmar que todo aparece correctamente**

Si algo no aparece, necesitamos ver:
- Los datos del proyecto (¿tiene modelo y color?)
- Los logs de generación del PDF

---

**¿Los PDFs muestran modelo y color correctamente?** 📄

---

**Última actualización:** 18 Nov 2025, 10:18 AM
