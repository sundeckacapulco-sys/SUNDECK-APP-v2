# 📘 Algoritmo Oficial de Cálculo de Telas, Despiece y Lista de Pedido (V3.1)

## Sundeck Persianas y Decoraciones

---

# ⭐ 1. Estructura General del PDF (Máximo 3 páginas)

## **HOJA 1 – Material Consolidado (Imprimible)**

* Telas agrupadas por tipo (Screen / Blackout / Sheer)
* Mostrar siempre: nombre, tipo, color, ancho del rollo, cantidad en ml, si está rotada, número de piezas que la usan
* Tubos (barras 5.80 m)
* Cinta (rollos 50 ml)
* Contrapesos (barras 5.80 m)
* Accesorios
* Motores
* Controles
* Resumen total

## **HOJA 2 – Despiece por Pieza (Técnico)**

Para cada pieza:

* Ubicación
* Sistema
* Tela
* Rotada sí/no
* ML consumidos
* Ancho del rollo asignado (2.00 / 2.50 / 3.00)
* Uso de almacén
* Sobrante de rollo

## **HOJA 3 – Almacén + Garantías**

* Material a tomar de almacén
* Nuevo stock estimado
* Garantías (formato actual)
* Checklist final

---

# ⭐ 2. Algoritmo Completo (Paso a Paso)

# 📌 FASE 1 — Recopilación por Pieza

Para cada persiana:

1. Tomar ancho final, alto final, tela, tipo, color, rotación.
2. Calcular ML consumidos:

```
Si NO rotada: ML = ancho_final
Si rotada:    ML = alto_final
```

3. Registrar información para consolidado y despiece.

---

# 📌 FASE 2 — Selección del Rollo Óptimo (Despiece Inteligente)

1. Revisar en almacén rollos disponibles: 2.00 m, 2.50 m, 3.00 m.
2. Filtrar solo los rollos que sirven para el ancho/alto según rotación.
3. Criterios de selección del rollo:

   * Rollo más pequeño que funcione.
   * Menos desperdicio.
   * Usar rollo con stock primero.
4. Calcular:

```
ml_usados = ML_pieza
ml_sobrante = stock_rollo_actual - ml_usados
```

5. Actualizar almacén.

---

# 📌 FASE 3 — Cálculo del Faltante de Tela

```
requerimiento_total = suma ML_pieza
stock_total = stock actual
faltante = requerimiento_total - stock_total
```

### Reglas:

```
Si faltante <= 0 → NO pedir
Si 0 < faltante < 22 ml → pedir ML exactos
Si faltante >= 22 ml → pedir 1 rollo (30 ml)
```

Mostrar siempre el ancho del rollo.

---

# 📌 FASE 4 — Tubos (Barras 5.80 m)

```
ML_total = suma anchos
barras = ceil(ML_total / 5.80)
sobrante = barras*5.80 - ML_total
```

---

# 📌 FASE 5 — Contrapesos & Accesorios

Misma lógica de tubos.

Cinta:

```
si faltante > 0 → pedir 1 rollo 50 ml
```

---

# 📌 FASE 6 — Motores & Controles

Mantener formato actual:

```
MOTORES REQUERIDOS: X
>> Modelos a pedir:
1) ______
2) ______

CONTROLES:
Tipo: ____ Cantidad: ____
Observaciones: _________
```

---

# 📌 FASE 7 — Despiece por Pieza (Formato Final)

Ejemplo:

```
PIEZA 3 – Recámara Principal
Sistema: Roller Screen
Tela: Screen 5% – Soft White
Rotada: No
Ancho final: 1.37 m
ML usados: 1.37 ml
Rollo usado: 2.00 m
Sobrante: 6.63 ml
Stock nuevo del rollo: 6.63 ml
```

---

# 📌 FASE 8 — Material Consolidado (Hoja Imprimible)

Agrupar por tipo (en orden del despiece):

## SCREEN

```
Screen 5% – Soft White – 3.00 m
Cantidad total: 6.72 ml (rotada)
Usado en: 3 piezas
```

## BLACKOUT

```
Blackout – Montreal White – 3.00 m
Cantidad total: 7.33 ml
Usado en: 2 piezas
```

## SHEER

```
Sheer Elegance – Linen Sand – 3.00 m
Cantidad total: 5.88 ml
Usado en: 1 pieza
```

---

# 📌 FASE 9 — Tomar de Almacén

```
Tela Screen Soft White: usar 8 ml de almacén
Tubo 70 mm: usar 1 barra
Contrapeso: usar 2 barras
```

---

# 📌 FASE 10 — Stock Nuevo + Garantías

* ML sobrantes
* Barras restantes
* Garantías
* Checklist

---

# 📌 DIAGRAMA RESUMIDO (Simplificado)

```
PIEZAS
  ↓
DESPIECE
  ↓
ROLLO ÓPTIMO
  ↓
USO DE STOCK
  ↓
FALTANTE → ( <22 ml = pedir ml exactos )
          ( >=22 ml = pedir rollo )

TUBOS  → /5.8 → BARRAS
CONTRAPESOS → /5.8 → BARRAS

CONSOLIDADO → AGRUPADO POR TIPO

HOJA FINAL → SOLO CONSOLIDADO
```
