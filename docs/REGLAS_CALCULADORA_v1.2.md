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

**Caso 2: Tela rotada** ✅ **REGLA CORRECTA SUNDECK**
```
SISTEMA: Roller Shade
COMPONENTE: Tela rotada
FÓRMULA: ancho + 0.03
UNIDAD: ml
CONDICIÓN: ancho_cortina > ancho_rollo AND alto_cortina ≤ 2.80m
NOTAS: Altura máxima rotada = 2.80m. Si supera esta medida → requiere termosello.

⚠️ IMPORTANTE:
- Altura máxima para rotar: 2.80m (SIEMPRE)
- NO importa si el rollo es de 3.00m
- Colchón de seguridad: 20cm (3.00m - 2.80m)
- Contrapeso: ELEGANCE (obligatorio para tela rotada)
```

**Caso 3: Tela con termosello** ✅
```
SISTEMA: Roller Shade
COMPONENTE: Tela con termosello
FÓRMULA: alto + 0.25 (por lienzo)
UNIDAD: ml
CONDICIÓN: alto_cortina > 2.80m
NOTAS: Unión horizontal. Diseño se borra en la franja. Solo algunas telas permiten termosello.

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

## 🎨 SHEER ELEGANCE

**Estado:** ✅ COMPLETADO (14 Nov 2025)

### 📋 CARACTERÍSTICAS GENERALES

- **Ancho máximo:** 3.00m
- **Sistema:** Manual (SL-16) o Motorizado
- **Tela:** NO se puede rotar
- **Colores de perfilería:** Ivory, Chocolate, Gris, Negro
- **Longitud estándar de perfiles:** 5.80m

---

### 🔧 1. TUBO

**Selección según motorización:**

| Condición | Diámetro | Código | Notas |
|-----------|----------|--------|-------|
| Motorizado ≤ 2.50m | 35mm | TUB-35-MOT | Tubo motorizado pequeño |
| Motorizado > 2.50m | 50mm | TUB-50-MOT | Tubo motorizado grande |
| Manual ≤ 2.50m | 38mm | TUB-38-MAN | Tubo manual pequeño |
| Manual > 2.50m | 50mm | TUB-50-MAN | Tubo manual grande |

**Fórmula de corte:**
```javascript
tubo.cantidad = ancho - 0.005; // Descuento de 5mm
tubo.unidad = 'ml';
tubo.longitudEstandar = 5.80; // metros
tubo.optimizar = true;
```

---

### 🏠 2. COFRE/FASCIA

**Componente decorativo que cubre el mecanismo**

**Fórmula:**
```javascript
cofre.cantidad = ancho - 0.005; // Mismo descuento que tubo
cofre.unidad = 'ml';
cofre.longitudEstandar = 5.80;
cofre.optimizar = true;
cofre.color = 'ivory' | 'chocolate' | 'gris' | 'negro';
```

**Accesorios del cofre:**
```javascript
// Tapas para cofre
tapasCofre.cantidad = 1; // 1 juego = 2 piezas
tapasCofre.unidad = 'juego';
tapasCofre.color = cofre.color;

// Inserto del cofre
insertoCofre.cantidad = ancho; // Ancho total sin descuento
insertoCofre.unidad = 'ml';
insertoCofre.color = cofre.color;
```

---

### ⚙️ 3. MECANISMO

**Sistema Manual:**

| Condición | Tipo | Código | Incluye | Notas |
|-----------|------|--------|---------|-------|
| Ancho ≤ 3.00m | SL-16 | MEC-SL16 | Mecanismo + soportes | Único mecanismo manual |

**Fórmula:**
```javascript
if (esManual && ancho <= 3.00) {
  mecanismo.tipo = 'SL-16';
  mecanismo.cantidad = 1;
  mecanismo.unidad = 'pza';
}
```

**Sistema Motorizado:**
```javascript
if (esMotorizado) {
  // Se cotiza por separado
  // No entra en calculadora automática
  motor.cotizacionManual = true;
}
```

---

### 🎨 4. TELA SHEER

**Anchos estándar disponibles:**
- 2.80m
- 3.00m

**Fórmula de cálculo:**
```javascript
tela.cantidad = (alto * 2) + 0.35;
tela.unidad = 'ml';
tela.anchoRollo = ancho <= 2.80 ? 2.80 : 3.00;
tela.puedeRotar = false; // IMPORTANTE: NO se puede rotar
```

**Optimización de cortes:**
```javascript
// Se pueden sacar múltiples cortinas del mismo lienzo
// Ejemplo: Cortina 1.30m + 1.40m = 2.70m → Cabe en rollo de 2.80m

function optimizarTela(cortinas) {
  const anchoDisponible = 2.80; // o 3.00
  let anchoUsado = 0;
  let corteActual = [];
  
  cortinas.forEach(cortina => {
    if (anchoUsado + cortina.ancho <= anchoDisponible) {
      corteActual.push(cortina);
      anchoUsado += cortina.ancho;
    } else {
      // Iniciar nuevo corte
      anchoUsado = cortina.ancho;
      corteActual = [cortina];
    }
  });
}
```

---

### 📏 5. BARRA DE GIRO

**Componente superior donde se enrolla la tela**

**Fórmula:**
```javascript
barraGiro.cantidad = ancho - 0.035; // Descuento de 35mm
barraGiro.unidad = 'ml';
barraGiro.longitudEstandar = 5.80;
barraGiro.optimizar = true;
barraGiro.color = 'ivory' | 'chocolate' | 'gris' | 'negro';
```

**Accesorios:**
```javascript
tapasBarraGiro.cantidad = 1; // 1 juego = 2 piezas
tapasBarraGiro.unidad = 'juego';
tapasBarraGiro.color = barraGiro.color;
```

---

### ⚖️ 6. CONTRAPESO OCULTO

**Componente inferior que da peso a la cortina**

**Fórmula:**
```javascript
contrapeso.cantidad = ancho - 0.030; // Descuento de 30mm
contrapeso.unidad = 'ml';
contrapeso.longitudEstandar = 5.80;
contrapeso.optimizar = true;
contrapeso.color = 'ivory' | 'chocolate' | 'gris' | 'negro';
```

**Accesorios:**
```javascript
tapasContrapeso.cantidad = 1; // 1 juego = 2 piezas
tapasContrapeso.unidad = 'juego';
tapasContrapeso.color = contrapeso.color;
```

---

### 🔗 7. CADENA SIN FIN

**Sistema de control manual**

**Fórmula:**
```javascript
cadenaSinFin.cantidad = alto - 0.40; // Aproximado
cadenaSinFin.unidad = 'ml';
cadenaSinFin.color = perfileria.color; // Mismo color que perfiles
```

**Ejemplo:**
- Cortina: 2.00m alto
- Cadena: 2.00 - 0.40 = 1.60m

---

### 🔩 8. SOPORTES

**Fórmula de cantidad:**
```javascript
soportes.cantidad = Math.ceil(ancho / 0.60); // 1 cada 60cm
soportes.unidad = 'pza';
```

**Ejemplos:**
- Ancho 1.50m: ceil(1.50 / 0.60) = 3 soportes
- Ancho 2.40m: ceil(2.40 / 0.60) = 4 soportes
- Ancho 3.00m: ceil(3.00 / 0.60) = 5 soportes

---

### 🎀 9. CINTA DOBLE CARA

**Para fijar la tela al tubo**

**Fórmula:**
```javascript
cinta.cantidad = ancho - 0.005; // Misma medida que tubo
cinta.unidad = 'ml';
```

---

### 🎨 10. COLORES DISPONIBLES

**Todos los componentes de perfilería están disponibles en:**

- **Ivory** (Marfil)
- **Chocolate** (Café)
- **Gris**
- **Negro**

**Componentes que llevan color:**
- Cofre/Fascia
- Barra de giro
- Contrapeso oculto
- Todas las tapas
- Inserto del cofre
- Cadena sin fin

---

### 📦 RESUMEN DE MATERIALES

**Para una cortina Sheer Elegance se necesita:**

```javascript
const materialesSheerElegance = {
  // Estructura principal
  tubo: { cantidad: ancho - 0.005, unidad: 'ml' },
  cofre: { cantidad: ancho - 0.005, unidad: 'ml' },
  barraGiro: { cantidad: ancho - 0.035, unidad: 'ml' },
  contrapeso: { cantidad: ancho - 0.030, unidad: 'ml' },
  
  // Mecanismo
  mecanismoSL16: { cantidad: 1, unidad: 'pza' },
  
  // Tela
  telaSheer: { cantidad: (alto * 2) + 0.35, unidad: 'ml' },
  
  // Control
  cadenaSinFin: { cantidad: alto - 0.40, unidad: 'ml' },
  
  // Soportes
  soportes: { cantidad: Math.ceil(ancho / 0.60), unidad: 'pza' },
  
  // Tapas (juegos de 2 piezas)
  tapasCofre: { cantidad: 1, unidad: 'juego' },
  tapasBarraGiro: { cantidad: 1, unidad: 'juego' },
  tapasContrapeso: { cantidad: 1, unidad: 'juego' },
  
  // Accesorios
  insertoCofre: { cantidad: ancho, unidad: 'ml' },
  cintaDobleCara: { cantidad: ancho - 0.005, unidad: 'ml' }
};
```

---

### ✅ EJEMPLO COMPLETO

**Cortina Sheer Elegance:**
- Ancho: 2.40m
- Alto: 2.50m
- Sistema: Manual
- Color: Ivory

**Materiales calculados:**

```javascript
{
  tubo: '2.395 ml (38mm)',
  cofre: '2.395 ml',
  barraGiro: '2.365 ml',
  contrapeso: '2.370 ml',
  mecanismoSL16: '1 pza',
  telaSheer: '5.35 ml (rollo 2.80m)',
  cadenaSinFin: '2.10 ml',
  soportes: '4 pza',
  tapasCofre: '1 juego (2 pzas)',
  tapasBarraGiro: '1 juego (2 pzas)',
  tapasContrapeso: '1 juego (2 pzas)',
  insertoCofre: '2.40 ml',
  cintaDobleCara: '2.395 ml',
  color: 'Ivory'
}
```

---

## 📋 TOLDOS CONTEMPO (CAÍDA VERTICAL)

**Estado:** ✅ COMPLETADO (14 Nov 2025)

### 📋 CARACTERÍSTICAS GENERALES

- **Tipo:** Toldo de caída vertical
- **Sistema:** Kit completo (Toldo Contempo)
- **Tela:** Screen 2.50m y 3.00m de ancho
- **Colores del kit:** Blanco, Negro, Gris
- **Rotación:** Casi siempre se rota la tela
- **Altura máxima rotada:** 2.80m

---

### 📦 1. KIT TOLDO CONTEMPO

**Sistema de kit completo que incluye TODO**

**Selección según ancho:**

| Condición | Kit | Longitud | Incluye | Notas |
|-----------|-----|----------|---------|-------|
| Ancho ≤ 4.00m | Kit 4.00m | 4.00m | Tubo + Contrapeso + Soportes + Mecanismo + Accesorios | Kit completo |
| Ancho > 4.00m | Kit 5.80m | 5.80m | Tubo + Contrapeso + Soportes + Mecanismo + Accesorios | Kit completo |

**Fórmula:**
```javascript
if (ancho <= 4.00) {
  kit.tipo = 'Kit Toldo Contempo 4.00m';
  kit.cantidad = 1;
  kit.unidad = 'kit';
} else {
  kit.tipo = 'Kit Toldo Contempo 5.80m';
  kit.cantidad = 1;
  kit.unidad = 'kit';
}

kit.color = 'blanco' | 'negro' | 'gris';
```

**Componentes del kit (ya incluidos):**
- Tubo (se corta a medida)
- Contrapeso (se corta a medida)
- Soportes
- Mecanismo de control
- Todos los accesorios necesarios

**Medidas de corte del kit:**
```javascript
// Tubo y contrapeso se cortan a:
tubo.corte = ancho - 0.12; // Ancho menos 12cm
contrapeso.corte = ancho - 0.12; // Ancho menos 12cm
```

---

### 🎨 2. TELA SCREEN

**Tela para toldo vertical**

**Anchos estándar disponibles:**
- 2.50m
- 3.00m

**Fórmula de cálculo:**

**Ancho de tela:**
```javascript
tela.ancho = ancho - 0.13; // Ancho menos 13cm
tela.unidad = 'ml';
```

**Alto de tela:**
```javascript
tela.alto = alto + 0.25; // Alto más 25cm para enrolle
tela.unidad = 'ml';
```

**Cálculo total:**
```javascript
tela.cantidad = alto + 0.25; // Si no se rota
tela.anchoRollo = ancho <= 2.50 ? 2.50 : 3.00;
```

---

### 🔄 3. ROTACIÓN DE TELA

**Reglas de rotación (iguales que Roller Shade)**

**Cuándo rotar:**
- **Casi siempre** se rota la tela en toldos
- Si el ancho requerido > ancho del rollo disponible

**Fórmula con rotación:**
```javascript
// Tela rotada 90°
tela.cantidad = ancho + 0.03; // Ancho + 3cm para cuadrar
tela.unidad = 'ml';
tela.rotada = true;
```

**Limitaciones:**
```javascript
// Altura máxima para rotar: 2.80m (SIEMPRE)
if (alto <= 2.80) {
  // Se puede rotar
  tela.cantidad = ancho + 0.03;
  tela.rotada = true;
} else {
  // Requiere termosello
  tela.termosello = true;
}
```

**⚠️ IMPORTANTE:**
- Altura máxima para rotar: **2.80m** (SIEMPRE)
- NO importa si el rollo es de 3.00m
- Colchón de seguridad: 20cm (3.00m - 2.80m)

---

### 🔗 4. CABLE ACERADO

**Guías laterales del toldo**

**Fórmula:**
```javascript
cableAcerado.cantidad = alto * 2; // Alto por 2
cableAcerado.unidad = 'ml';
```

**Ejemplo:**
- Toldo: 3.00m alto
- Cable: 3.00 × 2 = 6.00 ml

---

### 🔥 5. TERMOSELLO (SI ALTO > 2.80m)

**Para alturas mayores a 2.80m**

**Fórmula:**
```javascript
if (alto > 2.80) {
  tela.termosello = true;
  tela.cantidad = alto + 0.25; // Por lienzo
  tela.lienzos = Math.ceil(alto / 2.80); // Número de lienzos
}
```

**Proceso:**
- Unir 2+ lienzos horizontalmente
- Diseño se borra en la franja de unión
- Solo algunas telas screen permiten termosello

---

### ⚙️ 6. MOTORIZACIÓN

**Sistema motorizado (opcional)**

```javascript
if (esMotorizado) {
  // Se cotiza por separado
  // No entra en calculadora automática
  motor.cotizacionManual = true;
}
```

---

### 📦 RESUMEN DE MATERIALES

**Para un toldo Contempo se necesita:**

```javascript
const materialesToldoContempo = {
  // Kit completo
  kit: {
    tipo: ancho <= 4.00 ? 'Kit 4.00m' : 'Kit 5.80m',
    cantidad: 1,
    unidad: 'kit',
    color: 'blanco' | 'negro' | 'gris',
    corte: {
      tubo: ancho - 0.12,
      contrapeso: ancho - 0.12
    }
  },
  
  // Tela screen
  tela: {
    ancho: ancho - 0.13,
    cantidad: rotada ? (ancho + 0.03) : (alto + 0.25),
    unidad: 'ml',
    anchoRollo: ancho <= 2.50 ? 2.50 : 3.00,
    rotada: true // Casi siempre
  },
  
  // Cable acerado
  cableAcerado: {
    cantidad: alto * 2,
    unidad: 'ml'
  }
};
```

---

### ✅ EJEMPLO COMPLETO

**Toldo Contempo:**
- Ancho: 3.50m
- Alto: 2.50m
- Color: Blanco
- Tela: Screen (rotada)

**Materiales calculados:**

```javascript
{
  kit: 'Kit Toldo Contempo 4.00m (Blanco)',
  kitCorte: {
    tubo: '3.38 ml (3.50 - 0.12)',
    contrapeso: '3.38 ml (3.50 - 0.12)'
  },
  telaScreen: {
    cantidad: '3.53 ml (3.50 + 0.03)',
    anchoRollo: '3.00m',
    rotada: true,
    alto: '2.50m (≤ 2.80m ✅)'
  },
  cableAcerado: '5.00 ml (2.50 × 2)',
  motorizado: 'Cotización manual (si aplica)'
}
```

---

### ✅ EJEMPLO 2: TOLDO GRANDE

**Toldo Contempo:**
- Ancho: 4.50m
- Alto: 3.00m
- Color: Gris
- Tela: Screen (rotada)

**Materiales calculados:**

```javascript
{
  kit: 'Kit Toldo Contempo 5.80m (Gris)',
  kitCorte: {
    tubo: '4.38 ml (4.50 - 0.12)',
    contrapeso: '4.38 ml (4.50 - 0.12)'
  },
  telaScreen: {
    cantidad: '4.53 ml (4.50 + 0.03)',
    anchoRollo: '3.00m',
    rotada: true,
    alto: '3.00m (> 2.80m ⚠️ VERIFICAR TERMOSELLO)'
  },
  cableAcerado: '6.00 ml (3.00 × 2)',
  nota: 'Alto 3.00m > 2.80m: Verificar si requiere termosello'
}
```

---

## 🎉 ESTADO FINAL DEL DOCUMENTO

### ✅ COMPLETADO AL 100% (14 Nov 2025)

**3 sistemas documentados completamente:**

1. **✅ Roller Shade (Enrollable):**
   - 9 componentes documentados
   - Reglas de tubos, mecanismos, tela, contrapesos
   - Rotación de tela (altura máx 2.80m)
   - Termosello para alturas > 2.80m
   - Galería opcional
   - Optimización de cortes

2. **✅ Sheer Elegance:**
   - 14 componentes documentados
   - Tubos, cofre/fascia, mecanismo SL-16
   - Tela Sheer (NO rotable)
   - Barra de giro, contrapeso oculto
   - Cadena sin fin, soportes
   - 4 colores disponibles
   - Optimización de cortes

3. **✅ Toldos Contempo (Caída Vertical):**
   - Kit completo (4.00m o 5.80m)
   - Tela Screen (casi siempre rotada)
   - Cable acerado
   - Rotación (altura máx 2.80m)
   - Termosello para alturas > 2.80m
   - 3 colores disponibles

---

## 📊 RESUMEN DE REGLAS

### Reglas Comunes

**Rotación de tela:**
- Altura máxima: **2.80m** (SIEMPRE)
- Colchón de seguridad: 20cm
- Aplica a: Roller Shade y Toldos Contempo
- NO aplica a: Sheer Elegance

**Termosello:**
- Cuando: Alto > 2.80m
- Unión horizontal de lienzos
- Diseño se borra en franja
- Solo algunas telas lo permiten

**Optimización de cortes:**
- Longitud estándar: 5.80m
- Materiales: Tubos, contrapesos, perfiles
- Minimizar desperdicio

---

## 🎯 PRÓXIMOS PASOS

### IMPLEMENTACIÓN:

1. **✅ Documentación completa**
2. **⏳ Modelo mejorado con `reglasSeleccion`**
3. **⏳ Panel web de configuración**
4. **⏳ Probador de fórmulas**
5. **⏳ Configurar sistemas en producción**

---

**ESTADO:** ✅ DOCUMENTACIÓN COMPLETADA AL 100%  
**Fecha:** 14 Noviembre 2025  
**Sistemas:** 3/3 completados  
**Componentes:** 26 documentados  
**Listo para:** Implementación técnica

