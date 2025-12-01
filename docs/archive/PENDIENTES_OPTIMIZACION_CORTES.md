# ⚠️ PENDIENTES CRÍTICOS: OPTIMIZACIÓN DE CORTES Y TUBOS

**Fecha:** 25 Noviembre 2025
**Estado:** 🔄 PENDIENTE DE IMPLEMENTACIÓN TÉCNICA
**Fuente de Verdad:** `docs/REGLAS_CALCULADORA_v1.2.md` (YA EXISTE)

---

## 🛑 SITUACIÓN ACTUAL
El usuario reporta que las sugerencias de optimización son incorrectas.
**ERROR IDENTIFICADO:** El código actual (`optimizadorCortesService.js`) usa valores default o aproximados en lugar de las reglas exactas ya definidas en la documentación del proyecto.

---

## 📋 TAREAS PARA LA SIGUIENTE SESIÓN

### 1. Corregir Reglas de Tubos (Roller Shade)
- **Fuente:** `REGLAS_CALCULADORA_v1.2.md` Sección 1.
- **Corrección:**
  - Fórmula Corte: Cambiar `ancho + 0.10` ❌ por `ancho - 0.005` (5mm descuento) ✅.
  - Selección: Implementar tabla exacta (38mm hasta 2.50m, 50mm hasta 3.00m, etc.).

### 2. Corregir Reglas de Telas (Roller Shade)
- **Fuente:** `REGLAS_CALCULADORA_v1.2.md` Sección 1.
- **Corrección:**
  - **Normal:** `alto + 0.25` (Enrolle).
  - **Con Galería:** `alto + 0.50` (0.25 Enrolle + 0.25 Galería).
  - **Rotada:** Cambiar Margen 0 ❌ por `ancho + 0.03` (3cm) ✅.
  - **Termosello:** Implementar regla `alto > 2.80m`.

### 3. Implementar Reglas Específicas (Sheer y Toldos)
- **Sheer Elegance:** Corte Tubo `ancho - 0.005`, Tela `(alto * 2) + 0.35`.
- **Toldos Contempo:** Corte Tubo `ancho - 0.12`, Tela `ancho - 0.13` (Rotada +0.03).

### 4. Implementar Reglas de Galería (DETALLADO)
- **Fuente:** `REGLAS_CALCULADORA_v1.2.md` Sección 9.
- **Tela:**
  - Si lleva galería: `alto + 0.25` (Enrolle) + `0.25` (Galería) = **`alto + 0.50`**.
- **Madera (Estructura):**
  - Longitud estándar: **2.40m**.
  - Regla: Si `ancho > 2.40m` → Usar 2 piezas. Optimizar cortes de barras de 2.40m.
- **Contrapeso:**
  - Si lleva galería: Usar modelo **Elegance**.
  - Corte: `ancho` exacto (SIN descuento de 3cm).
- **Accesorios:**
  - Tapas: 1 juego adicional para la galería.

---

## 📂 ARCHIVOS A CORREGIR
1.  `server/services/optimizadorCortesService.js`
    - Actualizar método `calcularMaterialesPieza`.
    - Actualizar método `optimizarCortesTela` con márgenes correctos.
    - Implementar lógica de madera de galería (nuevo material).
    - Eliminar defaults hardcodeados.

---

**NOTA:**
Ya contamos con toda la información necesaria en `docs/REGLAS_CALCULADORA_v1.2.md`. No es necesario solicitar nada al usuario, solo ejecutar la implementación fiel a este documento.
