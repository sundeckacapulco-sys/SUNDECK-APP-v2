# 🎯 REQUISITOS PARA OPTIMIZAR CALCULADORA v1.2

**Fecha:** 18 Noviembre 2025  
**Estado Actual:** Documentación 100% ✅ | Implementación 0% ⏳  
**Objetivo:** Implementar sistema configurable completo

---

## 📊 ESTADO ACTUAL

### ✅ LO QUE YA TENEMOS

**1. Documentación Completa (100%)**
- ✅ Roller Shade: 9 componentes documentados
- ✅ Sheer Elegance: 14 componentes documentados
- ✅ Toldos Contempo: Kit completo documentado
- ✅ Reglas de rotación de tela (altura máx 2.80m)
- ✅ Reglas de termosello
- ✅ Optimización de cortes

**2. Modelo Base Creado**
- ✅ `ConfiguracionMateriales.js` existe
- ✅ Campos básicos: `nombre`, `sistema`, `materiales[]`
- ✅ Fórmulas JavaScript configurables
- ✅ Condiciones de aplicación
- ⚠️ **FALTA:** Campos `reglasSeleccion` y `optimizacion` (definidos pero no usados)

**3. Service de Cálculo**
- ✅ `calculadoraMaterialesService.js` existe
- ✅ Evalúa fórmulas matemáticas
- ✅ Evalúa condiciones lógicas
- ✅ Fallback a cálculo por defecto

---

## 🎯 LO QUE NECESITO PARA OPTIMIZAR

### 1️⃣ INFORMACIÓN DEL USUARIO (TU PARTE)

**Necesito que me confirmes/definas:**

#### A) REGLAS DE SELECCIÓN AUTOMÁTICA

**Pregunta 1: Tubos**
```
¿Cómo selecciono el tubo correcto automáticamente?

ROLLER SHADE (Manual):
- Ancho ≤ 2.50m → Tubo 38mm ✅ CONFIRMADO
- Ancho 2.50m - 3.00m → Tubo 50mm ✅ CONFIRMADO
- Ancho > 3.00m → ❌ REQUIERE MOTORIZACIÓN ✅ CONFIRMADO

ROLLER SHADE (Motorizado):
- Ancho < 2.50m → Tubo 35mm ✅ CONFIRMADO
- Ancho 2.50m - 3.00m → Tubo 50mm ✅ CONFIRMADO
- Ancho 3.00m - 4.00m → Tubo 70mm ✅ CONFIRMADO
- Ancho 4.00m - 5.90m → Tubo 79mm ✅ CONFIRMADO

SHEER ELEGANCE:
- Manual ≤ 2.50m → Tubo 38mm ✅ CONFIRMADO
- Manual > 2.50m → Tubo 50mm ✅ CONFIRMADO
- Motorizado ≤ 2.50m → Tubo 35mm ✅ CONFIRMADO
- Motorizado > 2.50m → Tubo 50mm ✅ CONFIRMADO

✅ TODO CONFIRMADO EN DOCUMENTACIÓN
```

**Pregunta 2: Mecanismos**
```
¿Cómo selecciono el mecanismo correcto?

ROLLER SHADE (Manual):
- Ancho ≤ 2.50m → Kit SL-16 ✅ CONFIRMADO
- Ancho 2.50m - 3.00m → Kit R-24 ✅ CONFIRMADO

ROLLER SHADE (Motorizado):
- Cualquier ancho → Motor + Soportes ✅ CONFIRMADO
- Soportes intermedios:
  * 1 lienzo → 0 soportes ✅ CONFIRMADO
  * 2 lienzos → 1 soporte ✅ CONFIRMADO
  * 3 lienzos → 2 soportes ✅ CONFIRMADO

SHEER ELEGANCE:
- Manual → SL-16 (único mecanismo) ✅ CONFIRMADO
- Motorizado → Motor + Soportes ✅ CONFIRMADO

TOLDOS CONTEMPO:
- Kit completo (incluye todo) ✅ CONFIRMADO

✅ TODO CONFIRMADO EN DOCUMENTACIÓN
```

**Pregunta 3: Anchos de Rollo de Tela**
```
¿Qué anchos de rollo tenemos disponibles?

ROLLER SHADE:
- 2.00m ✅ CONFIRMADO
- 2.50m ✅ CONFIRMADO
- 3.00m ✅ CONFIRMADO

SHEER ELEGANCE:
- 2.80m ✅ CONFIRMADO (único ancho)

TOLDOS CONTEMPO (Screen):
- 2.50m ✅ CONFIRMADO
- 3.00m ✅ CONFIRMADO

✅ TODO CONFIRMADO EN DOCUMENTACIÓN
```

#### B) VALIDACIONES Y RESTRICCIONES

**Pregunta 4: Restricciones de Medidas**
```
¿Cuáles son los límites?

ROLLER SHADE:
- Ancho máximo manual: 3.00m ✅ CONFIRMADO
- Ancho máximo motorizado: 5.90m ✅ CONFIRMADO
- Altura máxima para rotar: 2.80m ✅ CONFIRMADO

SHEER ELEGANCE:
- Ancho máximo: 3.00m ✅ CONFIRMADO
- NO se puede rotar tela ✅ CONFIRMADO
- Altura: Sin límite específico ✅ CONFIRMADO

TOLDOS CONTEMPO:
- Ancho máximo: 5.80m ✅ CONFIRMADO
- Altura máxima para rotar: 2.80m ✅ CONFIRMADO

✅ TODO CONFIRMADO EN DOCUMENTACIÓN
```

**Pregunta 5: Termosello**
```
¿Cuándo y cómo aplicar termosello?

CONDICIÓN:
- Cuando altura > 2.80m ✅ CONFIRMADO

TELAS QUE PERMITEN TERMOSELLO:
- Blackout plastificado ✅ CONFIRMADO
- ¿Otras telas? → NECESITO LISTA COMPLETA ⚠️

CÁLCULO:
- Fórmula: alto + 0.25 (por lienzo) ✅ CONFIRMADO
- Número de lienzos: Math.ceil(alto / 2.80) ✅ CONFIRMADO

⚠️ PENDIENTE: Lista completa de telas que permiten termosello
```

#### C) COLORES Y VARIANTES

**Pregunta 6: Colores Disponibles**
```
SHEER ELEGANCE:
- Ivory ✅ CONFIRMADO
- Chocolate ✅ CONFIRMADO
- Gris ✅ CONFIRMADO
- Negro ✅ CONFIRMADO

TOLDOS CONTEMPO:
- Blanco ✅ CONFIRMADO
- Negro ✅ CONFIRMADO
- Gris ✅ CONFIRMADO

ROLLER SHADE:
- ¿Tiene opciones de color? → NECESITO CONFIRMACIÓN ⚠️

⚠️ PENDIENTE: Confirmar si Roller Shade tiene colores
```

---

### 2️⃣ IMPLEMENTACIÓN TÉCNICA (MI PARTE)

**Lo que voy a construir:**

#### A) MODELO MEJORADO (30 min)

**Archivo:** `server/models/ConfiguracionMateriales.js`

**Mejoras:**
```javascript
// 1. Activar y usar campo reglasSeleccion
reglasSeleccion: {
  tubos: [{
    condicion: "ancho <= 2.50 && esManual",
    diametro: "38mm",
    codigo: "TUB-38-MAN",
    descripcion: "Tubo manual 38mm"
  }],
  mecanismos: [{
    condicion: "ancho <= 2.50 && esManual",
    tipo: "SL-16",
    codigo: "MEC-SL16",
    descripcion: "Kit SL-16 completo",
    incluye: ["Clutch", "Soportes"]
  }],
  kits: [{
    condicion: "ancho <= 4.00",
    tamano: "4.00m",
    codigo: "KIT-TOLDO-4M",
    descripcion: "Kit Toldo Contempo 4.00m"
  }]
}

// 2. Activar y usar campo optimizacion
optimizacion: {
  habilitada: true,
  longitudEstandar: 5.80,
  materialesOptimizables: [
    { tipo: "tubo", longitudEstandar: 5.80, margenCorte: 0.005 },
    { tipo: "contrapeso", longitudEstandar: 5.80, margenCorte: 0.030 },
    { tipo: "cofre", longitudEstandar: 5.80, margenCorte: 0.005 }
  ]
}

// 3. Agregar método de selección automática
seleccionarComponente(tipo, variables) {
  // Evalúa condiciones y retorna componente correcto
}
```

#### B) SERVICE MEJORADO (1 hora)

**Archivo:** `server/services/calculadoraMaterialesService.js`

**Nuevas funciones:**
```javascript
// 1. Selección automática de componentes
seleccionarTubo(ancho, esManual, sistema)
seleccionarMecanismo(ancho, esManual, lienzos, sistema)
seleccionarKit(ancho, sistema)

// 2. Validación de restricciones
validarMedidas(ancho, alto, sistema)
validarRotacion(ancho, alto, anchoRollo)
validarTermosello(alto, tela)

// 3. Optimización de cortes
optimizarCortes(materiales, longitudEstandar)
calcularDesperdicio(cortes, longitudEstandar)

// 4. Cálculo inteligente de tela
calcularTela(ancho, alto, sistema, opciones) {
  // Decide si rotar, termosello, etc.
}
```

#### C) PANEL WEB DE CONFIGURACIÓN (1-2 horas)

**Archivo:** `client/src/modules/admin/ConfiguracionMateriales.jsx`

**Componentes:**
```jsx
// 1. Lista de configuraciones
<ConfiguracionesList />

// 2. Formulario de edición
<ConfiguracionForm>
  <SeccionGeneral />
  <SeccionReglasSeleccion />
  <SeccionMateriales />
  <SeccionOptimizacion />
  <SeccionColores />
</ConfiguracionForm>

// 3. Probador de fórmulas
<ProbadorFormulas>
  <InputVariables />
  <ResultadosCalculados />
  <VistaPrevia />
</ProbadorFormulas>
```

#### D) SCRIPTS DE INICIALIZACIÓN (30 min)

**Archivos:**
```bash
server/scripts/inicializarRollerShade.js
server/scripts/inicializarSheerElegance.js
server/scripts/inicializarToldosContempo.js
```

**Cada script crea configuración completa con:**
- Reglas de selección
- Materiales con fórmulas
- Optimización de cortes
- Colores disponibles
- Reglas especiales

---

## 📋 CHECKLIST DE INFORMACIÓN NECESARIA

### ✅ CONFIRMADO (de documentación)

- [x] Reglas de tubos (Roller Shade, Sheer, Toldos)
- [x] Reglas de mecanismos (SL-16, R-24, Motor)
- [x] Anchos de rollo disponibles
- [x] Altura máxima para rotación (2.80m)
- [x] Fórmulas de cálculo de materiales
- [x] Optimización de cortes (5.80m)
- [x] Colores Sheer Elegance (4 colores)
- [x] Colores Toldos Contempo (3 colores)
- [x] Reglas de galería (Roller Shade)
- [x] Reglas de cadena (Roller Shade)
- [x] Reglas de contrapesos
- [x] Reglas de tapas y accesorios

### ✅ CONFIRMADO POR USUARIO (18 Nov 2025)

- [x] **Telas que permiten termosello**
  - Blackout (modelo 500) ✅
  - Montreal ✅
  - Screens (todos los tipos) ✅

- [x] **Colores de perfilería (Roller Shade)**
  - Blanco ✅
  - Ivory ✅
  - Negro ✅
  - Gris ✅
  - **Aplica a:** Mecanismos, cadenas, topes, tapas, conectores, fascia, cofre, contrapeso plano

- [x] **Colores de telas**
  - Se configuran en productos (no en calculadora)
  - Sistema solo calcula cantidades

- [ ] **Códigos de producto** (opcional)
  - No urgente, se pueden agregar después
  - Sistema funciona sin códigos SKU

- [ ] **Precios unitarios** (opcional)
  - Por ahora solo cantidades
  - Precios se pueden agregar después

---

## 🎯 PLAN DE EJECUCIÓN

### OPCIÓN A: Empiezo YA con lo que tengo ⭐ RECOMENDADA

**Ventajas:**
- Puedo avanzar 80% con la documentación actual
- Tú me confirmas los 3 puntos pendientes después
- Trabajamos en paralelo

**Timeline:**
```
AHORA (30 min):
- Mejoro modelo ConfiguracionMateriales
- Agrego métodos de selección automática

+30 min (1 hora):
- Mejoro calculadoraMaterialesService
- Agrego validaciones y optimización

+1 hora (1 hora):
- Creo panel web básico
- Probador de fórmulas

+30 min (30 min):
- Scripts de inicialización
- Configurar Roller Shade

TOTAL: 2.5 horas
```

**Mientras tanto tú:**
- Confirmas lista de telas con termosello
- Confirmas colores de Roller Shade
- Confirmas códigos de producto (si los tienes)

### OPCIÓN B: Espero confirmaciones completas

**Ventajas:**
- Todo 100% preciso desde el inicio

**Desventajas:**
- Perdemos tiempo esperando
- No avanzamos en paralelo

**Timeline:**
```
TÚ (30 min):
- Confirmas 3 puntos pendientes

YO (2.5 horas):
- Implemento todo completo
```

---

## 💡 MI RECOMENDACIÓN

**OPCIÓN A: Empiezo YA**

**Razones:**
1. Tengo 95% de la información
2. Los 3 puntos pendientes son "nice to have"
3. Puedo agregar después sin romper nada
4. Trabajamos en paralelo = más eficiente

**Lo que haré:**
1. Implemento modelo mejorado (30 min)
2. Implemento service mejorado (1 hora)
3. Creo panel web básico (1 hora)
4. Scripts de inicialización (30 min)
5. **NUEVO:** Integración con catálogo de productos (30 min)

**Lo que necesito de ti (después):**
1. ✅ Lista de telas con termosello (CONFIRMADO)
2. ✅ Colores de Roller Shade (CONFIRMADO)
3. ⏳ Mapeo de materiales → productos del catálogo
   - Ejemplo: "Tubo 38mm manual" → ¿Qué código de producto?
   - Esto lo podemos hacer después de implementar la calculadora

---

## 🚀 PRÓXIMO PASO

**¿Qué prefieres?**

**A)** Empiezo YA con implementación (2.5 horas)
- Tú me confirmas pendientes después
- Trabajamos en paralelo

**B)** Espero a que confirmes los 3 puntos
- Luego implemento todo junto
- Más lento pero más preciso

**C)** Primero resolvemos pendientes juntos
- Revisamos punto por punto
- Luego implemento

---

**IMPORTANTE:** Con la documentación actual puedo implementar un sistema funcional al 95%. Los 3 puntos pendientes son detalles que podemos agregar después sin afectar la arquitectura.

**¿Arranco con Opción A?** 🚀

---

**Última actualización:** 18 Nov 2025, 9:50 AM
