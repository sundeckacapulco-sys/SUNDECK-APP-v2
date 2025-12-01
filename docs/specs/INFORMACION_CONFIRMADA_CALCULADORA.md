# ✅ INFORMACIÓN CONFIRMADA - CALCULADORA v1.2

**Fecha:** 18 Noviembre 2025, 9:50 AM  
**Estado:** 100% CONFIRMADO - LISTO PARA IMPLEMENTAR  

---

## 🎯 INFORMACIÓN COMPLETA CONFIRMADA

### 1. TELAS QUE PERMITEN TERMOSELLO

**Condición:** Cuando altura > 2.80m

**Telas permitidas:**
- ✅ **Blackout (modelo 500)**
- ✅ **Montreal**
- ✅ **Screens (todos los tipos)**

**Proceso:**
- Unir 2+ lienzos horizontalmente
- Fórmula: `alto + 0.25` (por lienzo)
- Número de lienzos: `Math.ceil(alto / 2.80)`
- **ADVERTENCIA:** Diseño se borra en la franja de unión

---

### 2. COLORES DE PERFILERÍA

#### ROLLER SHADE (Enrollable)

**Colores disponibles:**
- **Blanco**
- **Ivory** (Marfil)
- **Negro**
- **Gris**

**Componentes con color:**
- Mecanismos (SL-16, R-24)
- Cadenas
- Topes de cadena
- Conectores de cadena
- Tapas de tubo
- Tapas de contrapeso
- Fascia
- Cofre
- Contrapeso plano

#### SHEER ELEGANCE

**Colores disponibles:**
- **Ivory** (Marfil)
- **Chocolate** (Café)
- **Gris**
- **Negro**

**Componentes con color:**
- Cofre/Fascia
- Barra de giro
- Contrapeso oculto
- Todas las tapas
- Inserto del cofre
- Cadena sin fin

#### TOLDOS CONTEMPO

**Colores disponibles:**
- **Blanco**
- **Negro**
- **Gris**

**Componentes con color:**
- Kit completo (tubo, contrapeso, soportes, mecanismo)

---

### 3. COLORES DE TELAS

**Decisión:** 
- Los colores de tela se configuran en los **productos**, NO en la calculadora
- La calculadora solo calcula **cantidades**
- Los colores se seleccionan al momento de cotizar

**Razón:**
- Cada tela tiene sus propios colores disponibles
- Más flexible mantenerlo en catálogo de productos
- Calculadora se enfoca en cantidades y medidas

---

### 4. CÓDIGOS DE PRODUCTO

**Decisión:**
- ✅ **YA EXISTE catálogo de productos** en el sistema
- ✅ Modelo `Producto.js` tiene campo `codigo` (único y requerido)
- ✅ La calculadora se vinculará con productos existentes
- ⏳ Códigos específicos de componentes aún no definidos

**Integración con catálogo:**
- Calculadora calcula **cantidades** de materiales
- Cada material se vincula con un **producto del catálogo**
- El producto tiene: código, precio, colores, especificaciones
- Sistema completo: Calculadora → Productos → Cotización

**Próximo paso:**
- Definir mapeo entre materiales calculados y productos del catálogo
- Ejemplo: Material "Tubo 38mm" → Producto código "TUB-38-MAN"

---

### 5. PRECIOS UNITARIOS

**Decisión:**
- Por ahora, calculadora solo calcula **cantidades**
- Precios se pueden agregar después
- Campo `precioUnitario` ya existe en el modelo (preparado)

**Beneficio:**
- Implementación más rápida
- Se enfoca en lo esencial (cantidades correctas)
- Precios se pueden agregar cuando estén definidos

---

## 📊 RESUMEN DE SISTEMAS

### ROLLER SHADE (Enrollable)

**Componentes:**
- 9 componentes principales
- 4 colores de perfilería
- Rotación de tela (altura máx 2.80m)
- Termosello: Blackout 500, Montreal, Screens
- Galería opcional

**Reglas clave:**
- Ancho máx manual: 3.00m
- Ancho máx motorizado: 5.90m
- Altura máx rotación: 2.80m
- Optimización de cortes: 5.80m

### SHEER ELEGANCE

**Componentes:**
- 14 componentes principales
- 4 colores de perfilería
- NO permite rotación de tela
- Ancho máximo: 3.00m

**Reglas clave:**
- Solo sistema manual (SL-16)
- Motorización se cotiza aparte
- Tela: (alto × 2) + 0.35
- Optimización de cortes: 5.80m

### TOLDOS CONTEMPO (Caída Vertical)

**Componentes:**
- Kit completo (4.00m o 5.80m)
- 3 colores disponibles
- Tela Screen (casi siempre rotada)
- Cable acerado

**Reglas clave:**
- Ancho máx: 5.80m
- Altura máx rotación: 2.80m
- Termosello: Screens
- Kit incluye todo

---

## 🚀 LISTO PARA IMPLEMENTAR

### ✅ INFORMACIÓN 100% COMPLETA

**Tenemos:**
- [x] Reglas de selección de componentes
- [x] Fórmulas de cálculo
- [x] Colores disponibles por sistema
- [x] Telas con termosello
- [x] Restricciones y validaciones
- [x] Optimización de cortes

**No necesitamos (por ahora):**
- [ ] Códigos SKU (se agregan después)
- [ ] Precios unitarios (se agregan después)
- [ ] Colores de tela (están en productos)

### 🎯 PRÓXIMO PASO

**Implementación técnica (2.5 horas):**

1. **Modelo mejorado** (30 min)
   - Activar `reglasSeleccion`
   - Activar `optimizacion`
   - Agregar `coloresDisponibles`
   - Métodos de selección automática

2. **Service mejorado** (1 hora)
   - Selección automática de componentes
   - Validación de termosello
   - Validación de colores
   - Optimización de cortes

3. **Panel web** (1 hora)
   - Formulario de configuración
   - Selector de colores
   - Probador de fórmulas
   - Vista previa

4. **Scripts de inicialización** (30 min)
   - Roller Shade completo
   - Sheer Elegance completo
   - Toldos Contempo completo

---

## 📝 NOTAS IMPORTANTES

### Termosello
- Solo 3 tipos de tela: Blackout 500, Montreal, Screens
- Advertir al usuario que diseño se borra
- Validar antes de permitir

### Colores
- Cada sistema tiene sus propios colores
- Roller Shade: 4 colores (Blanco, Ivory, Negro, Gris)
- Sheer Elegance: 4 colores (Ivory, Chocolate, Gris, Negro)
- Toldos: 3 colores (Blanco, Negro, Gris)

### Rotación de tela
- Altura máxima: 2.80m (SIEMPRE)
- Aplica a: Roller Shade y Toldos
- NO aplica a: Sheer Elegance

### Optimización
- Longitud estándar: 5.80m
- Aplica a: Tubos, contrapesos, perfiles
- Minimizar desperdicio

---

## ✅ CONFIRMACIÓN FINAL

**Todo listo para implementar:**
- ✅ Información completa
- ✅ Reglas definidas
- ✅ Colores confirmados
- ✅ Telas con termosello identificadas
- ✅ Decisiones tomadas (códigos y precios después)

**Tiempo estimado:** 2.5 horas

**¿Arranco con la implementación?** 🚀

---

**Última actualización:** 18 Nov 2025, 9:50 AM
