# 📐 REGLAS DE CALCULADORA DE MATERIALES v1.2

**Fecha:** 13 Noviembre 2025  
**Estado:** 🔄 EN DEFINICIÓN  
**Objetivo:** Documentar todas las reglas de negocio para cada sistema

---

## 🎯 SISTEMAS A CONFIGURAR

1. ✅ **Roller Shade (Enrollable)**
2. ⏳ **Sheer Elegance**
3. ⏳ **Toldos**

---

## 📋 ROLLER SHADE (ENROLLABLE)

### 🔧 REGLAS DE TUBOS ✅ CONFIRMADO

**Longitud estándar:** 5.80m  
**Fórmula de corte:** `ancho - 0.005` (ancho menos 5mm)

#### SISTEMA MANUAL

| Condición | Diámetro | Código | Notas |
|-----------|----------|--------|-------|
| Ancho ≤ 2.50m | 38mm | T38-M | Manual hasta 2.50m |
| Ancho 2.50m - 3.00m | 50mm | T50-M | Manual hasta 3.00m |
| Ancho > 3.00m | ❌ | - | **REQUIERE MOTORIZACIÓN** |

#### SISTEMA MOTORIZADO

| Condición | Diámetro | Código | Notas |
|-----------|----------|--------|-------|
| Ancho < 2.50m | 35mm | T35 | Motorización menor a 2.50m |
| Ancho 2.50m - 3.00m | 50mm | T50 | Motorización 2.50m a 3.00m |
| Ancho 3.00m - 4.00m | 70mm | T70 | Motorización 3.00m a 4.00m |
| Ancho 4.00m - 5.90m | 79mm | T79 | Motorización 4.00m a 5.90m |

**⚙️ MOTORIZACIÓN:**
- Un motor puede manejar de 1 a 3 lienzos simultáneamente
- Configuración: 1 lienzo, 2 lienzos o 3 lienzos por motor

**🚨 REGLA CRÍTICA:**
- **Ancho > 3.00m = MOTORIZACIÓN OBLIGATORIA**
- No se permite sistema manual para anchos mayores a 3.00m

---

### ⚙️ REGLAS DE MECANISMOS ✅ CONFIRMADO

#### SISTEMAS MANUALES (KIT COMPLETO)

| Condición | Tipo | Código | Incluye | Notas |
|-----------|------|--------|---------|-------|
| Ancho ≤ 2.50m | Kit SL-16 | SL-16 | Clutch + Soportes (Drive End + Idle End) | Kit completo |
| Ancho 2.50m - 3.00m | Kit R-24 | R-24 | Clutch + Soportes (Drive End + Idle End) | Kit completo |

#### SISTEMA MOTORIZADO

| Condición | Tipo | Código | Obligatorio | Incluye |
|-----------|------|--------|-------------|---------|
| Ancho > 3.00m | Motor | MOTOR | **SÍ** | Motor + Soportes básicos |
| Usuario pide motorizado | Motor | MOTOR | No | Motor + Soportes básicos |

**📦 SOPORTES INTERMEDIOS (MOTORIZADO):**
- **1 lienzo:** Solo soportes básicos (incluidos con motor)
- **2 lienzos:** Agregar soportes intermedios
- **3 lienzos:** Agregar soportes intermedios

**Fórmula soportes intermedios:** ✅ CONFIRMADO
- 1 lienzo: `0` (no requiere)
- 2 lienzos: `1` soporte intermedio
- 3 lienzos: `2` soportes intermedios

**📦 IMPORTANTE:**
- SL-16 y R-24 son **KITS COMPLETOS** (Clutch + Soportes)
- Motor incluye **soportes básicos**
- Soportes intermedios solo para configuraciones multi-lienzo
- Cantidad: **1 motor** por persiana (puede manejar 1-3 lienzos)

---

### 📦 MATERIALES Y FÓRMULAS

#### 1. TELA ✅ CONFIRMADO

**Anchos estándar de rollos:**
- 2.00m
- 2.50m
- 3.00m

**🔄 ROTACIÓN DE TELA (90 grados):**

**Cuándo rotar:**
- Si el ancho requerido > ancho del rollo disponible
- Ejemplo: Cortina 3.50m ancho → Usar rollo de 3.00m rotado

**Limitaciones al rotar:**
- **Altura máxima** = Ancho original del rollo
- Ejemplo: Rollo 3.00m rotado → Altura máx 3.00m
- **Restricción:** No todas las telas permiten rotación (depende de diseño/tejido)

**🔥 TERMOSELLO (para alturas mayores):**

**Cuándo usar:**
- Si altura requerida > ancho del rollo rotado
- Ejemplo: Necesitas 3.50m alto con rollo de 3.00m

**Proceso:**
- Pegar 2 o más lienzos con calor y presión
- Unión SIEMPRE horizontal
- **Efecto:** Borra diseño en la franja de unión
- Solo algunas colecciones lo permiten

**📐 REGLAS DE CÁLCULO:**

**Caso 1: Tela normal (sin rotar)** ✅
```
Condición: ancho_cortina ≤ ancho_rollo
Fórmula: alto + 0.25 (alto + 25cm de enrolle)
Unidad: ml
```

**Caso 2: Tela rotada** ✅
```
Condición: ancho_cortina > 3.00m Y alto_cortina ≤ 2.80m
Fórmula: ancho + 0.03 (ancho + 3cm para cuadrar)
Unidad: ml
Rollo usado: Tela de 3.00m rotada 90°
Límite altura: Máximo 2.80m (limitado por ancho del rollo de 3.00m)
Límite ancho: Hasta 5.80m (largo del rollo)
Contrapeso: ELEGANCE (obligatorio para tela rotada)
```

**Caso 3: Tela con termosello** ✅
```
Condición: alto_cortina > 2.80m (sobrepasa rollo rotado)
Ejemplo: 3.20m alto x 3.20m ancho
Proceso: Unir 2+ lienzos horizontalmente
Telas permitidas: Blackout plastificado (y otras específicas)
ADVERTIR: Diseño se borra en unión
VALIDAR: Solo ciertas telas permiten termosello
```

**📝 EJEMPLOS PRÁCTICOS:**

**Ejemplo 1 - Normal:**
- Cortina: 2.00m ancho x 2.50m alto
- Rollo disponible: 2.50m ancho
- Cálculo: 2.50 + 0.25 = **2.75 ml**

**Ejemplo 2 - Rotada:**
- Cortina: 3.50m ancho x 2.80m alto
- Rollo disponible: 3.00m ancho
- Solución: Rotar tela 90°
- Validación: Alto 2.80m ≤ 2.80m ✅
- Cálculo: 3.50 + 0.03 = **3.53 ml**
- Contrapeso: **ELEGANCE**

**Ejemplo 3 - Termosello:**
- Cortina: 3.20m ancho x 3.20m alto
- Rollo disponible: 3.00m ancho
- Problema: Alto 3.20m > 2.80m (no se puede rotar)
- Solución: Termosello (si tela lo permite)
- Validar: ¿Es blackout plastificado u otra compatible?

**🔧 MERMA CONFIRMADA:**
- **25cm** adicionales para enrolle
- Fórmula: `medida + 0.25`

#### 2. TUBO
- **Fórmula:** `ancho - 0.005` ✅ CONFIRMADO
- **Unidad:** ml
- **Notas:** Ancho menos 5mm (0.005m)
- **Selección automática según ancho:**
  - ≤ 2.50m → Tubo 38mm
  - 2.50m - 3.00m → Tubo 50mm
  - 3.00m - 4.00m → Tubo 65mm
  - > 4.00m → Tubo 79mm

#### 3. SOPORTES
- **Drive End Bracket:** ¿Siempre 1?
- **Idle End Bracket:** ¿Siempre 1?
- **Soportes intermedios:** ¿Cuándo se agregan?
- **Fórmula:** `???`

#### 4. CADENA (solo manual) ✅ CONFIRMADO

**Cálculo de largo de cadena:**
- Altura de operación: `alto - 0.80` (altura menos 80cm)
- Largo de cadena: `(alto - 0.80) * 2` (doble de la altura de operación)
- **Unidad:** ml

**Ejemplos:**
- Alto 2.00m → Operación 1.20m → Cadena: 2.40 ml
- Alto 3.00m → Operación 1.80m → Cadena: 3.60 ml

**Accesorios de cadena:**
- **Conector de cadena:** `1` pieza por persiana
- **Tope de cadena:** `1` pieza por persiana (tope inferior)

**📝 FÓRMULA FINAL:**
```
largoCadena = (alto - 0.80) * 2
```

#### 5. CONTRAPESO (Bottom Rail) ✅ CONFIRMADO

**Tipos de contrapeso:**

##### A) CONTRAPESO ELEGANCE
- **Uso:** Galerías y persianas pequeñas
- **Fórmula para galería:** `ancho` (ancho total)
- **Fórmula para persiana:** `ancho - 0.030` (ancho menos 30mm)
- **Unidad:** ml

##### B) CONTRAPESO OVALADO SIN ACABADO
- **Uso:** Mayoría de persianas enrollables
- **Fórmula:** `ancho - 0.030` (ancho total menos 30mm)
- **Unidad:** ml

**📝 NOTAS:**
- Elegance para galería = ancho total
- Elegance para persiana = ancho - 30mm
- Ovalado = ancho - 30mm (estándar)

**🔧 OPTIMIZACIÓN:**
- Longitud estándar: **5.80m**
- Aplicar optimización de cortes
- Calcular cortes por barra y desperdicio

#### 6. TAPAS Y TAPONES ✅ CONFIRMADO

##### TAPAS LATERALES DE TUBO (End Plug)
- **Cantidad:** Ya incluidas en kit de mecanismo (SL-16, R-24 o Motor)
- **No se cuentan por separado**

##### TAPAS LATERALES DE CONTRAPESO (End Cap)
- **Contrapeso Ovalado:** `2` piezas por persiana
- **Contrapeso Elegance (con galería):** `2` piezas por persiana
- **Unidad:** pza

**📝 NOTA:**
- Tapas de tubo vienen con el kit de mecanismo
- Tapas de contrapeso siempre son 2 por persiana

#### 7. CINTA ADHESIVA ✅ CONFIRMADO

**Usos:**
- Pegar tela al tubo
- Pegar tela al contrapeso

**Fórmula:**
- **Cantidad:** `ancho * 2` (una para tubo, una para contrapeso)
- **Unidad:** ml

**Ejemplo:**
- Cortina 2.50m ancho → Cinta: 5.00 ml (2.50 x 2)

#### 8. INSERTOS ✅ CONFIRMADO

##### A) INSERTO DE CONTRAPESO (Ovalado)
- **Función:** Evitar que salga la tela del contrapeso
- **Fórmula:** `ancho` (mismo ancho que se ocupa)
- **Unidad:** ml

##### B) INSERTO ADHERIBLE (Elegance)
- **Función:** Inserto para contrapeso Elegance
- **Fórmula:** `ancho` (mismo ancho que se ocupa)
- **Unidad:** ml

**📝 RESUMEN INSERTOS:**
- Contrapeso Ovalado → Inserto de contrapeso (ancho)
- Contrapeso Elegance → Inserto adherible (ancho)

#### 9. GALERÍA (OPCIONAL)

**¿Cuándo se usa?**
- Cuando el cliente solicita galería decorativa

**Componentes de galería:**

##### A) MADERA PARA GALERÍA ✅ CONFIRMADO

**Longitud estándar:** 2.40m por pieza

**Reglas de cálculo:**

**Si ancho ≤ 2.40m:**
- Cantidad: `1` pieza de madera
- Se corta a la medida

**Si ancho > 2.40m:**
- Cantidad: `2` piezas de madera (se unen)
- Ejemplo: 2.60m ancho → 2 maderas unidas

**🔧 OPTIMIZACIÓN DE CORTES:**
- Maderas vienen de 2.40m
- Calcular cuántas maderas por pedido
- Minimizar desperdicio

**📝 EJEMPLOS:**
- Cortina 2.00m → 1 madera (corte de 2.40m)
- Cortina 2.20m → 1 madera (corte de 2.40m)
- Cortina 2.60m → 2 maderas unidas
- Dos cortinas: 2.00m + 2.20m → 2 maderas total
- Dos cortinas: 2.60m + 2.20m → 2 maderas total (1 para la de 2.60m+.20 cm de sobrante, 1 para la de 2.20m sobran .20 cm )

##### B) TELA PARA GALERÍA ✅ CONFIRMADO

**Regla:**
- La tela de galería se agrega al cálculo de la tela principal
- Se suman **25cm adicionales** al alto de la cortina

**Fórmula modificada cuando lleva galería:**
```
SIN galería: alto + 0.25 (enrolle)
CON galería: (alto + 0.25) + 0.25 (galería)
           = alto + 0.50
```

**📝 EJEMPLOS:**

**Sin galería:**
- Alto: 2.00m
- Cálculo: 2.00 + 0.25 = **2.25 ml**

**Con galería:**
- Alto: 2.00m
- Cálculo: 2.00 + 0.25 (enrolle) + 0.25 (galería) = **2.50 ml**

**Otro ejemplo:**
- Alto: 2.50m sin galería → 2.75 ml
- Alto: 2.50m con galería → 3.00 ml

**🔧 RESUMEN GALERÍA:**
- Madera: Según ancho (1 o 2 piezas de 2.40m)
- Tela: +25cm adicionales al cálculo normal
- Contrapeso: ELEGANCE (ancho total)

---

## 📋 SHEER ELEGANCE

### 🔧 REGLAS DE TUBOS

**Longitud estándar:** ¿5.80m también?  
**Margen de corte:** ¿10cm también?

| Condición | Diámetro | Código | Descripción |
|-----------|----------|--------|-------------|
| ??? | ??? | ??? | ??? |

**❓ PENDIENTE:**
- ¿Cómo se selecciona el tubo?
- ¿Usa los mismos diámetros que Roller?
- ¿Hay reglas diferentes?

---

### ⚙️ REGLAS DE MECANISMOS

| Condición | Tipo | Código | Obligatorio | Notas |
|-----------|------|--------|-------------|-------|
| ??? | ??? | ??? | ??? | ??? |

**❓ PENDIENTE:**
- ¿Qué mecanismos usa Sheer Elegance?
- ¿Tiene motorización?
- ¿Reglas de selección?

---

### 📦 MATERIALES Y FÓRMULAS

**❓ PENDIENTE:**
- ¿Qué materiales lleva Sheer Elegance?
- ¿Telas especiales?
- ¿Rieles diferentes?
- ¿Accesorios únicos?

---

## 📋 TOLDOS

### 🔧 REGLAS DE ESTRUCTURA

**❓ PENDIENTE:**
- ¿Qué tipo de estructura usan?
- ¿Brazos extensibles?
- ¿Cofre?
- ¿Manual o motorizado?

---

### 📦 MATERIALES Y FÓRMULAS

**❓ PENDIENTE:**
- ¿Lona/tela?
- ¿Estructura metálica?
- ¿Brazos?
- ¿Soportes de pared?
- ¿Motor?

---

## 🎯 PRÓXIMOS PASOS

### PARA COMPLETAR ESTE DOCUMENTO:

1. **Roller Shade:**
   - [ ] Confirmar fórmulas de cada material
   - [ ] Nombres completos de mecanismos
   - [ ] Reglas de soportes intermedios
   - [ ] Porcentajes de merma exactos

2. **Sheer Elegance:**
   - [ ] Definir todas las reglas desde cero
   - [ ] Materiales específicos
   - [ ] Fórmulas de cálculo

3. **Toldos:**
   - [ ] Definir todas las reglas desde cero
   - [ ] Materiales específicos
   - [ ] Fórmulas de cálculo

---

## 📝 FORMATO PARA AGREGAR REGLAS

Cuando me des una regla, usa este formato:

```
SISTEMA: Roller Shade
COMPONENTE: Tela
FÓRMULA: alto * 1.15
UNIDAD: ml
CONDICIÓN: ninguna
NOTAS: 15% de merma para todas las telas
```

O simplemente dime en lenguaje natural y yo lo formateo.

---

**ESTADO:** Esperando definición de reglas...

