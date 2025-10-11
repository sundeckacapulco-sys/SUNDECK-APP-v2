# 🧪 GUÍA DE PRUEBAS - CONTROLES MULTICANAL

## 📋 CASOS DE PRUEBA PARA VALIDAR LA CORRECCIÓN

### **CASO 1: Control Multicanal con 3 Piezas (Caso Real)**

#### **Datos de Entrada:**
- **Ubicación:** Sala Comedor
- **Producto:** Persianas Screen 5%
- **3 piezas:** 1.25m × 3.2m cada una (4.00 m² c/u)
- **Precio:** $850/m²
- **Motorizado:** Sí
- **Motor:** Somfy 35nm ($9,500 c/u)
- **Control:** Control 4 Canales ($1,800)
- **Instalación:** Eléctrica ($3,000)
- **Descuento:** Fijo $5,000
- **Factura:** Sí (IVA 16%)

#### **Resultados Esperados en Interfaz:**
```
Superficie: 12.00 m²
Subtotal m²: $10,200
3 Motores: $28,500
1 Control: $1,800
Total Partida: $40,500

Instalación: +$3,000
Descuento: -$5,000
Subtotal: $38,500
IVA (16%): +$6,160
Total Final: $44,660
```

#### **Resultados Esperados en PDF:**
- **Pieza 1:** $3,400 (m²) + $9,500 (motor) + $1,800 (control) = $14,700
- **Pieza 2:** $3,400 (m²) + $9,500 (motor) + $0 (control) = $12,900
- **Pieza 3:** $3,400 (m²) + $9,500 (motor) + $0 (control) = $12,900
- **Total:** $40,500 ✅

---

### **CASO 2: Controles Monocanal (Sin Cambios)**

#### **Datos de Entrada:**
- **3 piezas motorizadas**
- **Control:** Monocanal ($950 c/u)

#### **Resultados Esperados:**
- **Pieza 1:** Control $950 ✅
- **Pieza 2:** Control $950 ✅
- **Pieza 3:** Control $950 ✅
- **Total Controles:** $2,850 ✅

---

### **CASO 3: Controles Mixtos**

#### **Datos de Entrada:**
- **Pieza 1:** Control Monocanal ($950)
- **Pieza 2:** Control 5 Canales ($2,200)
- **Pieza 3:** Control 5 Canales ($2,200)
- **Pieza 4:** Control Monocanal ($950)

#### **Resultados Esperados:**
- **Pieza 1:** Control $950 ✅ (monocanal)
- **Pieza 2:** Control $2,200 ✅ (primer multicanal)
- **Pieza 3:** Control $0 ✅ (segundo multicanal, no se cobra)
- **Pieza 4:** Control $950 ✅ (monocanal)
- **Total Controles:** $4,100 ✅

---

## 🔍 PASOS PARA VALIDAR

### **1. Prueba en Interfaz:**
1. Crear nueva etapa "Cotización en Vivo"
2. Agregar partida con los datos del Caso 1
3. Verificar que el total muestre $40,500
4. Verificar sugerencia: "⚠️ Control 4 Canales detectado..."

### **2. Prueba en PDF:**
1. Hacer clic en "Ver PDF"
2. Verificar que cada pieza muestre el precio correcto
3. Verificar que solo la primera pieza tenga control
4. Verificar que el total sea $40,500

### **3. Prueba en Excel:**
1. Hacer clic en "Descargar Excel"
2. Verificar los mismos resultados que en PDF

---

## ✅ CHECKLIST DE VALIDACIÓN

### **Frontend (Interfaz):**
- [ ] Sugerencia inteligente aparece para controles multicanal
- [ ] Total de partida es correcto ($40,500)
- [ ] Visualización muestra "Incluido en otra pieza"
- [ ] No hay errores en consola del navegador

### **Backend (PDF):**
- [ ] PDF genera sin errores
- [ ] Totales por pieza son correctos
- [ ] Solo se muestra 1 control multicanal
- [ ] Total general coincide con interfaz

### **Backend (Excel):**
- [ ] Excel genera sin errores
- [ ] Mismos resultados que PDF
- [ ] Formato correcto de precios

---

## 🐛 PROBLEMAS CONOCIDOS RESUELTOS

### **❌ Antes:**
- Control multicanal se cobraba en cada pieza
- PDF mostraba $14,700 por pieza (incorrecto)
- Total inflado por $3,600-$5,400

### **✅ Después:**
- Control multicanal se cobra solo una vez
- PDF muestra precios correctos por pieza
- Total exacto: $40,500

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Verificar consola del navegador** para errores JavaScript
2. **Verificar logs del servidor** para errores backend
3. **Comparar totales** entre interfaz y PDF
4. **Probar con diferentes tipos de control** (monocanal vs multicanal)

---

## 🔧 ARCHIVOS MODIFICADOS

- `client/src/components/Prospectos/AgregarEtapaModal.js` - Lógica frontend
- `server/services/pdfService.js` - Generación de PDF
- `server/services/excelService.js` - Generación de Excel

---

**Fecha de implementación:** Octubre 11, 2025
**Versión:** 2.0 - Controles Multicanal
