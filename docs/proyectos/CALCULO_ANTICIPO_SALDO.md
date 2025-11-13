# 💳 CÁLCULO AUTOMÁTICO DE ANTICIPO Y SALDO

**Fecha:** 12 Noviembre 2025  
**Componente:** `CotizacionForm.js`  
**Estado:** ✅ COMPLETADO

---

## 🎯 OBJETIVO

Mostrar el cálculo automático en tiempo real del **monto del anticipo** y **monto del saldo** en la sección de "Condiciones de Pago", para que el asesor pueda consultar rápidamente estos valores antes de generar la cotización.

---

## ✅ FUNCIONALIDAD IMPLEMENTADA

### 1. **Cálculo Automático del Anticipo**
- 💰 Muestra el monto en pesos del anticipo
- 🔄 Se actualiza en tiempo real al cambiar el porcentaje
- 🎨 Fondo verde claro (#e8f5e9)
- 📊 Formato: $XX,XXX.XX MXN

### 2. **Cálculo Automático del Saldo**
- 💵 Muestra el monto en pesos del saldo restante
- 🔄 Se actualiza automáticamente (100% - anticipo%)
- 🎨 Fondo naranja claro (#fff3e0)
- 📊 Formato: $XX,XXX.XX MXN

### 3. **Diseño Visual Mejorado**
- 📦 Card con borde verde (#28a745)
- 📋 Título con emoji 💳
- 🎯 Dos columnas: Anticipo | Saldo
- 📱 Responsive (se apila en móviles)

---

## 🧮 LÓGICA DE CÁLCULO

### Anticipo
```javascript
const porcentajeAnticipo = watchedFormaPago?.anticipo?.porcentaje || 60;
const montoAnticipo = (totales.total * porcentajeAnticipo) / 100;
```

**Ejemplo:**
- Total: $65,422.81
- Anticipo: 60%
- **Monto Anticipo: $39,253.69**

### Saldo
```javascript
const porcentajeSaldo = 100 - porcentajeAnticipo;
const montoSaldo = (totales.total * porcentajeSaldo) / 100;
```

**Ejemplo:**
- Total: $65,422.81
- Saldo: 40% (100% - 60%)
- **Monto Saldo: $26,169.12**

---

## 🎨 DISEÑO VISUAL

### Anticipo (Verde)
```
┌─────────────────────────────────┐
│ Anticipo (%)                    │
│ ┌─────────────────────────────┐ │
│ │ 60                          │ │
│ └─────────────────────────────┘ │
│ Porcentaje del total a pagar    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💰 Monto del Anticipo:      │ │
│ │                             │ │
│ │ $39,253.69                  │ │
│ │                             │ │
│ │ 60% del total               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Saldo (Naranja)
```
┌─────────────────────────────────┐
│ Condiciones del saldo           │
│ ┌─────────────────────────────┐ │
│ │ contra entrega              │ │
│ └─────────────────────────────┘ │
│ Ej. contra entrega, a 30 días   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 💵 Monto del Saldo:         │ │
│ │                             │ │
│ │ $26,169.12                  │ │
│ │                             │ │
│ │ 40% del total               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 📊 EJEMPLO COMPLETO

### Escenario 1: Anticipo 60%
```
Total de la cotización: $65,422.81

Condiciones de Pago:
┌────────────────────────────────────────────────────────┐
│ 💳 Condiciones de Pago                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Anticipo (%)              Condiciones del saldo      │
│  ┌──────────┐              ┌──────────────────────┐  │
│  │    60    │              │ contra entrega       │  │
│  └──────────┘              └──────────────────────┘  │
│                                                        │
│  💰 Monto del Anticipo:    💵 Monto del Saldo:       │
│  $39,253.69                $26,169.12                │
│  60% del total             40% del total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Escenario 2: Anticipo 50%
```
Total de la cotización: $65,422.81

Condiciones de Pago:
┌────────────────────────────────────────────────────────┐
│ 💳 Condiciones de Pago                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Anticipo (%)              Condiciones del saldo      │
│  ┌──────────┐              ┌──────────────────────┐  │
│  │    50    │              │ a 15 días            │  │
│  └──────────┘              └──────────────────────┘  │
│                                                        │
│  💰 Monto del Anticipo:    💵 Monto del Saldo:       │
│  $32,711.41                $32,711.41                │
│  50% del total             50% del total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Escenario 3: Anticipo 70%
```
Total de la cotización: $65,422.81

Condiciones de Pago:
┌────────────────────────────────────────────────────────┐
│ 💳 Condiciones de Pago                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Anticipo (%)              Condiciones del saldo      │
│  ┌──────────┐              ┌──────────────────────┐  │
│  │    70    │              │ contra entrega       │  │
│  └──────────┘              └──────────────────────┘  │
│                                                        │
│  💰 Monto del Anticipo:    💵 Monto del Saldo:       │
│  $45,795.97                $19,626.84                │
│  70% del total             30% del total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 ACTUALIZACIÓN EN TIEMPO REAL

### Flujo de Actualización
```
Usuario cambia anticipo → watchedFormaPago actualizado → Cálculos se ejecutan → UI se actualiza
```

### Ejemplo Interactivo
```
1. Usuario escribe "60" en Anticipo (%)
   → Anticipo: $39,253.69 (60%)
   → Saldo: $26,169.12 (40%)

2. Usuario cambia a "50"
   → Anticipo: $32,711.41 (50%)
   → Saldo: $32,711.41 (50%)

3. Usuario cambia a "80"
   → Anticipo: $52,338.25 (80%)
   → Saldo: $13,084.56 (20%)
```

---

## 💡 BENEFICIOS

### 1. **Consulta Rápida**
- ⏱️ El asesor ve los montos inmediatamente
- 📞 Puede responder al cliente en tiempo real
- ✅ No necesita calculadora externa

### 2. **Transparencia**
- 💰 Montos exactos visibles
- 📊 Porcentajes claros
- 🎯 Sin confusiones ni errores

### 3. **Flexibilidad**
- 🔄 Cambios instantáneos
- 📱 Responsive en móviles
- ✏️ Editable en cualquier momento

### 4. **Profesionalismo**
- 🎨 Diseño limpio y moderno
- 🟢 Colores intuitivos (verde/naranja)
- 📋 Formato de moneda profesional

---

## 🧪 CASOS DE USO

### Caso 1: Cliente Pregunta por Teléfono
```
Cliente: "¿Cuánto sería el anticipo?"
Asesor: [Mira la pantalla] "El anticipo sería de $39,253.69"
Cliente: "¿Y el saldo?"
Asesor: "El saldo restante sería de $26,169.12"
```

### Caso 2: Negociación de Anticipo
```
Cliente: "¿Puedo dar solo 50% de anticipo?"
Asesor: [Cambia el porcentaje a 50]
Asesor: "Claro, con 50% el anticipo sería $32,711.41 
         y el saldo $32,711.41"
Cliente: "Perfecto, así me conviene"
```

### Caso 3: Anticipo Mayor
```
Cliente: "Prefiero dar más anticipo para pagar menos después"
Asesor: [Cambia el porcentaje a 80]
Asesor: "Si das 80% de anticipo, serían $52,338.25 
         y solo quedarían $13,084.56 de saldo"
Cliente: "Excelente, así lo hacemos"
```

---

## 🎨 COLORES Y ESTILOS

### Card Principal
```javascript
sx={{
  bgcolor: '#f8f9fa',           // Gris claro de fondo
  border: '2px solid #28a745',  // Borde verde
  borderRadius: 3,              // Bordes redondeados
  boxShadow: 3                  // Sombra suave
}}
```

### Box Anticipo (Verde)
```javascript
sx={{
  bgcolor: '#e8f5e9',           // Verde muy claro
  border: '1px solid #28a745',  // Borde verde
  borderRadius: 2
}}
```

### Box Saldo (Naranja)
```javascript
sx={{
  bgcolor: '#fff3e0',           // Naranja muy claro
  border: '1px solid #ff9800',  // Borde naranja
  borderRadius: 2
}}
```

### Tipografía
```javascript
// Título del monto
variant="h5"
fontWeight="bold"
color="#28a745"  // Verde para anticipo
color="#ff9800"  // Naranja para saldo

// Subtítulo
variant="caption"
color="#6c757d"
fontStyle="italic"
```

---

## 📱 RESPONSIVE

### Desktop (md y superior)
```
┌─────────────────────────────────────────────┐
│ 💳 Condiciones de Pago                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐    ┌──────────────┐     │
│  │  Anticipo    │    │    Saldo     │     │
│  │              │    │              │     │
│  │ $39,253.69   │    │ $26,169.12   │     │
│  └──────────────┘    └──────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### Mobile (xs)
```
┌─────────────────────────┐
│ 💳 Condiciones de Pago  │
├─────────────────────────┤
│                         │
│  ┌───────────────────┐ │
│  │    Anticipo       │ │
│  │                   │ │
│  │  $39,253.69       │ │
│  └───────────────────┘ │
│                         │
│  ┌───────────────────┐ │
│  │     Saldo         │ │
│  │                   │ │
│  │  $26,169.12       │ │
│  └───────────────────┘ │
│                         │
└─────────────────────────┘
```

---

## ✅ VALIDACIONES

### 1. **Porcentaje Válido**
```javascript
inputProps={{ min: 0, max: 100, step: 1 }}
```
- Mínimo: 0%
- Máximo: 100%
- Incremento: 1%

### 2. **Valor por Defecto**
```javascript
const porcentajeAnticipo = watchedFormaPago?.anticipo?.porcentaje || 60;
```
- Si no hay valor: usa 60%

### 3. **Formato de Moneda**
```javascript
montoAnticipo.toLocaleString('es-MX', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})
```
- Separador de miles: coma
- Decimales: 2 dígitos
- Ejemplo: $65,422.81

---

## 🔧 CÓDIGO IMPLEMENTADO

### Watch de FormaPago
```javascript
const watchedFormaPago = watch('formaPago');
```

### Cálculo del Anticipo
```javascript
<Typography variant="h5" sx={{ fontWeight: 'bold', color: '#28a745' }}>
  ${(() => {
    const porcentajeAnticipo = watchedFormaPago?.anticipo?.porcentaje || 60;
    const montoAnticipo = (totales.total * porcentajeAnticipo) / 100;
    return montoAnticipo.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  })()}
</Typography>
```

### Cálculo del Saldo
```javascript
<Typography variant="h5" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
  ${(() => {
    const porcentajeAnticipo = watchedFormaPago?.anticipo?.porcentaje || 60;
    const porcentajeSaldo = 100 - porcentajeAnticipo;
    const montoSaldo = (totales.total * porcentajeSaldo) / 100;
    return montoSaldo.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  })()}
</Typography>
```

---

## 📈 IMPACTO

### Antes
```
❌ Asesor necesita calculadora
❌ Puede cometer errores de cálculo
❌ Cliente espera respuesta
❌ Proceso lento
```

### Después
```
✅ Cálculo automático instantáneo
✅ Sin errores de cálculo
✅ Respuesta inmediata al cliente
✅ Proceso ágil y profesional
```

---

## 🎯 RESULTADO FINAL

### Vista Completa
```
┌────────────────────────────────────────────────────────────────┐
│ 💰 Resumen de Totales                                          │
├────────────────────────────────────────────────────────────────┤
│ Subtotal: $56,398.97                                           │
│ Descuento (0%): -$0                                            │
│ Subtotal con descuento: $56,398.97                             │
│ IVA (16%): +$9,023.83                                          │
│ ────────────────────────────────────────────────────────────   │
│ Total (con IVA): $65,422.805                                   │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 💳 Condiciones de Pago                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Anticipo (%)                    Condiciones del saldo        │
│  ┌────────────────────┐          ┌────────────────────────┐  │
│  │        60          │          │  contra entrega        │  │
│  └────────────────────┘          └────────────────────────┘  │
│  Porcentaje del total            Ej. contra entrega, a 30   │
│  a pagar como anticipo           días, etc.                  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 💰 Monto del Anticipo:                                 │  │
│  │                                                        │  │
│  │ $39,253.69                                             │  │
│  │                                                        │  │
│  │ 60% del total                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 💵 Monto del Saldo:                                    │  │
│  │                                                        │  │
│  │ $26,169.12                                             │  │
│  │                                                        │  │
│  │ 40% del total                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

**Estado:** ✅ COMPLETADO Y FUNCIONAL  
**Listo para:** Uso inmediato en producción  
**Beneficio:** Consulta rápida de montos de anticipo y saldo

**¡Cálculo automático de anticipo y saldo implementado exitosamente! 💳✨**
