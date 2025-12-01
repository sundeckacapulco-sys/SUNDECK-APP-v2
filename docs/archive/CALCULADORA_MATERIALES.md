# 🧮 CALCULADORA DE MATERIALES INTELIGENTE v2.0

**Fecha:** 25 Noviembre 2025 - 4:00 PM  
**Estado:** ✅ COMPLETADO (Fase 1, 2 y 3)  
**Integración:** PDF, Almacén, Frontend Admin, Prueba Rápida

---

## 📋 DESCRIPCIÓN

Sistema configurable para calcular materiales (BOM) basado en reglas dinámicas almacenadas en base de datos. Se integra automáticamente con la generación de Orden de Producción PDF y con el inventario de Almacén para descuentos automáticos.

---

## 🎯 NUEVAS CARACTERÍSTICAS (v2.0)

### ✅ Prueba Rápida (Simulador)
- **Interfaz:** Botón "Prueba Rápida" en la calculadora.
- **Función:** Simula el consumo de una pieza sin crear proyecto.
- **Inteligencia:**
  - Verifica stock real en Almacén.
  - Prioriza el uso de **Sobrantes** (Retazos) compatibles.
  - Calcula desperdicio real y porcentaje de aprovechamiento.
  - Sugiere **Descuentos Comerciales** si el desperdicio es bajo.

### ✅ Gestión de Sistemas Dinámica
- **UI por Acordeón:** Organización jerárquica (Sistema > Configuraciones).
- **Creación Flexible:** Permite crear nuevos Sistemas (ej. "Motores 2025") escribiendo el nombre directamente, sin código.
- **Reglas Visibles:** Panel para editar reglas de selección de Tubos y Mecanismos (antes ocultas).

### ✅ Reglas Oficiales Roller Shade
- Implementación de fórmulas exactas para Telas (con/sin galería, rotadas).
- Cortes de Tubos y Contrapesos.
- Selección de Accesorios (Cadenas, Tapas).

---

## 🏗️ ARQUITECTURA ACTUALIZADA

### Modelo: ConfiguracionMateriales

Se agregaron campos para reglas de selección:

```javascript
{
  nombre: "Configuración Oficial Roller Shade",
  sistema: "Roller Shade",
  reglasSeleccion: {
    tubos: [
      { condicion: "ancho > 2.50", diametro: "T70", codigo: "T70" }
    ],
    mecanismos: [...],
    kits: [...]
  },
  materiales: [ ... ],
  anchosRollo: [2.50, 3.00],
  alturaMaxRotacion: 2.80
}
```

### Servicio: CalculadoraMaterialesService

**Nuevos Métodos:**
- `simularConsumo(datosPieza)`: Lógica de prueba rápida + consulta a Almacén.
- `aplicarReglasTelaEnrollables(pieza)`: Lógica compleja de rotación y holguras.

---

## 📐 REGLAS IMPLEMENTADAS (ROLLER SHADE)

### 1. Telas
| Tipo | Condición | Fórmula |
|------|-----------|---------|
| Estándar | `!galeria` | `alto + 0.25` |
| Con Galería | `galeria` | `alto + 0.50` |
| Rotada | `rotada` | `ancho + 0.03` |

### 2. Perfiles
| Tipo | Fórmula |
|------|---------|
| Tubo | `ancho - 0.005` |
| Contrapeso | `ancho - 0.030` |

### 3. Accesorios
| Tipo | Fórmula | Condición |
|------|---------|-----------|
| Cadena | `(alto - 0.80) * 2` | Manual |
| Tapas | `1` (juego) | Siempre |

---

## 🚀 USO DEL SISTEMA

### 1. Prueba Rápida (Ventas)
1. Abrir Calculadora de Materiales.
2. Clic en **"🚀 Prueba Rápida"**.
3. Ingresar Ancho y Alto.
4. Resultado inmediato:
   - *"✅ Stock Disponible"* o *"⚠️ Usar Sobrante #123"*
   - *"📉 Desperdicio: 2%"*
   - *"🏷️ Sugerencia: Aplicar 10% descuento"*

### 2. Administración de Reglas (Admin/Gerencia)
1. Buscar el Sistema en la lista de Acordeones.
2. Editar la Configuración.
3. Modificar fórmulas en la tabla de Materiales.
4. Desplegar "Reglas de Selección" para ajustar lógica de tubos.

### 3. Agregar Nuevo Sistema
1. Clic en "Nueva Configuración".
2. En "Sistema", escribir el nombre nuevo (ej. "Toldos 2026").
3. Guardar. El sistema crea automáticamente el grupo.

---

## ✅ ESTADO ACTUAL

- ✅ Modelo creado
- ✅ Servicio implementado
- ✅ Integración con PDF
- ✅ Configuración inicial
- ✅ **API REST (COMPLETADO)**
- ✅ **UI Admin (COMPLETADO)**
- ✅ **Simulador / Prueba Rápida (COMPLETADO)**
- ✅ **Reglas Oficiales Roller (COMPLETADO)**
- ✅ **Gestión Dinámica de Sistemas (COMPLETADO)**

---

**Versión:** 2.0  
**Fecha:** 25 Noviembre 2025  
**Autor:** Equipo Sundeck
