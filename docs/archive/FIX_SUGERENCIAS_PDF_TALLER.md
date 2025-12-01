# 🔧 FIX: Sugerencias No Aparecen en PDF del Taller

**Fecha:** 19 Noviembre 2025  
**Problema:** Sugerencias inteligentes implementadas pero no aparecen en PDF  
**Prioridad:** 🔴 ALTA  
**Tiempo estimado:** 15-20 minutos

---

## 📋 ANÁLISIS DEL PROBLEMA

### Estado Actual

**✅ Código implementado correctamente:**

1. **Backend - Generación de sugerencias** (`ordenProduccionService.js` líneas 665-720)
   ```javascript
   // Crear sugerencias inteligentes de corte
   let sugerencias = [];
   
   if (piezasPequenas.length > 0 && piezasGrandes.length === 0) {
     sugerencias.push(`Todas las ${piezasPequenas.length} pieza(s) caben en lienzo de 2.50m`);
     sugerencias.push(`Revisar si hay lienzo de 2.50m en stock del taller`);
   }
   // ... más lógica
   ```

2. **Backend - Inclusión en listaPedido** (línea 720)
   ```javascript
   listaPedido.telas.push({
     // ... otros campos
     sugerencias // Array de sugerencias para mostrar en PDF
   });
   ```

3. **PDF Service - Renderizado** (`pdfOrdenFabricacionService.js` líneas 385-399)
   ```javascript
   // SUGERENCIAS INTELIGENTES
   if (tela.sugerencias && tela.sugerencias.length > 0) {
     doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC');
     doc.text(`   [>>] SUGERENCIAS:`, 60, doc.y);
     // ... renderiza cada sugerencia
   }
   ```

### ⚠️ Problema Identificado

**Hipótesis principal:** Las sugerencias se generan correctamente pero no llegan al PDF porque:

1. **Posible causa #1:** El campo `sugerencias` no se está pasando en el flujo completo
2. **Posible causa #2:** La condición `if (tela.sugerencias && tela.sugerencias.length > 0)` falla
3. **Posible causa #3:** Las sugerencias se generan vacías en algunos casos

---

## 🔍 PLAN DE DEBUG

### Paso 1: Verificar Generación de Sugerencias

**Script creado:** `server/scripts/debugSugerenciasPDF.js`

**Uso:**
```bash
node server/scripts/debugSugerenciasPDF.js <proyectoId>
```

**Qué verifica:**
- ✅ Existencia de `listaPedido`
- ✅ Cantidad de telas en `listaPedido.telas`
- ✅ Campo `sugerencias` en cada tela
- ✅ Tipo y contenido de sugerencias
- ✅ Detalles de piezas asociadas

**Ejemplo de salida esperada:**
```
=== DEBUG SUGERENCIAS PDF ===

Proyecto: PROY-2025-0001
Total piezas: 3

✅ listaPedido existe
Telas en listaPedido: 2

=== ANÁLISIS DE TELAS ===

Tela 1:
  Descripción: Tela Screen 3%
  Modelo: Screen 3%
  Color: Blanco
  Metros lineales: 15.50
  Ancho rollo: 2.50
  Piezas pequeñas: 2
  Piezas grandes: 0

  🔍 SUGERENCIAS:
  ✅ Campo sugerencias existe
  Tipo: object
  Es array: true
  Longitud: 2

  📋 Contenido de sugerencias:
    1. Todas las 2 pieza(s) caben en lienzo de 2.50m
    2. Revisar si hay lienzo de 2.50m en stock del taller
```

### Paso 2: Verificar Flujo Completo

**Puntos de verificación:**

1. **En `ordenProduccionService.js`** (línea 139):
   ```javascript
   // Verificar que listaPedido se genera correctamente
   listaPedido: this.generarListaPedido(piezasConBOM, reporteOptimizacion)
   ```

2. **En `pdfOrdenFabricacionService.js`** (línea 181):
   ```javascript
   // Verificar que listaPedido llega al método generarPDF
   this.generarListaPedido(doc, datos.listaPedido);
   ```

3. **En el renderizado** (líneas 385-399):
   ```javascript
   // Agregar log temporal para debug
   if (tela.sugerencias && tela.sugerencias.length > 0) {
     console.log('✅ Renderizando sugerencias:', tela.sugerencias);
     // ... código de renderizado
   } else {
     console.log('❌ No hay sugerencias para:', tela.descripcion);
     console.log('   tela.sugerencias:', tela.sugerencias);
   }
   ```

---

## 🛠️ SOLUCIONES PROPUESTAS

### Solución #1: Agregar Logs de Debug (INMEDIATO)

**Archivo:** `server/services/pdfOrdenFabricacionService.js`

**Modificación temporal en línea 385:**
```javascript
// SUGERENCIAS INTELIGENTES
console.log('\n=== DEBUG SUGERENCIAS ===');
console.log('Tela:', tela.descripcion);
console.log('tela.sugerencias existe:', !!tela.sugerencias);
console.log('tela.sugerencias tipo:', typeof tela.sugerencias);
console.log('tela.sugerencias es array:', Array.isArray(tela.sugerencias));
console.log('tela.sugerencias longitud:', tela.sugerencias?.length);
console.log('tela.sugerencias contenido:', tela.sugerencias);
console.log('========================\n');

if (tela.sugerencias && tela.sugerencias.length > 0) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC');
  doc.text(`   [>>] SUGERENCIAS:`, 60, doc.y);
  doc.fillColor('#000');
  
  doc.fontSize(7).font('Helvetica').fillColor('#333');
  
  // Mostrar sugerencias del backend
  tela.sugerencias.forEach(sugerencia => {
    doc.text(`      ${sugerencia}`, 60, doc.y);
  });
  
  doc.fillColor('#000');
} else {
  console.log('⚠️ No se renderizaron sugerencias para:', tela.descripcion);
}
```

### Solución #2: Fallback a Observaciones (SI SUGERENCIAS NO EXISTEN)

**Si el campo `sugerencias` no existe, usar `observaciones`:**

```javascript
// SUGERENCIAS INTELIGENTES (con fallback)
const sugerenciasArray = tela.sugerencias || [];
const observacionesTexto = tela.observaciones || '';

// Extraer sugerencias de observaciones si no hay array
if (sugerenciasArray.length === 0 && observacionesTexto.includes('SUGERENCIAS:')) {
  const partes = observacionesTexto.split('SUGERENCIAS:');
  if (partes.length > 1) {
    const sugerenciasTexto = partes[1].trim();
    sugerenciasArray.push(...sugerenciasTexto.split('|').map(s => s.trim()));
  }
}

if (sugerenciasArray.length > 0) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC');
  doc.text(`   [>>] SUGERENCIAS:`, 60, doc.y);
  doc.fillColor('#000');
  
  doc.fontSize(7).font('Helvetica').fillColor('#333');
  
  sugerenciasArray.forEach(sugerencia => {
    if (sugerencia && sugerencia.trim()) {
      doc.text(`      ${sugerencia}`, 60, doc.y);
    }
  });
  
  doc.fillColor('#000');
}
```

### Solución #3: Forzar Generación de Sugerencias (SI NO SE GENERAN)

**En `ordenProduccionService.js` línea 665, asegurar que siempre se generen:**

```javascript
// Crear sugerencias inteligentes de corte
let sugerencias = [];

// Sugerencia 1: Si todas las piezas pequeñas caben en 2.50m
if (piezasPequenas.length > 0 && piezasGrandes.length === 0) {
  sugerencias.push(`Todas las ${piezasPequenas.length} pieza(s) caben en lienzo de 2.50m`);
  sugerencias.push(`Revisar si hay lienzo de 2.50m en stock del taller`);
}

// Sugerencia 2: Si hay mezcla de piezas pequeñas y grandes
else if (piezasPequenas.length > 0 && piezasGrandes.length > 0) {
  sugerencias.push(`OPCION 1: Pedir 1 rollo de 3.0m para todas las piezas`);
  sugerencias.push(`OPCION 2: Usar lienzo de 2.50m del taller para ${piezasPequenas.length} pieza(s) pequena(s)`);
  
  // ... resto del código
}

// Sugerencia 3: Si todas son grandes
else if (piezasGrandes.length > 0) {
  sugerencias.push(`Requiere rollo de 3.0m (piezas grandes)`);
}

// AGREGAR: Sugerencia por defecto si no hay ninguna
if (sugerencias.length === 0) {
  sugerencias.push(`Verificar ancho de rollo disponible: ${anchosDisponibles}`);
}

console.log('✅ Sugerencias generadas:', sugerencias); // LOG TEMPORAL
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Debug (5 min)
- [ ] Ejecutar `node server/scripts/debugSugerenciasPDF.js <proyectoId>`
- [ ] Verificar si sugerencias existen en `listaPedido.telas[].sugerencias`
- [ ] Verificar tipo y contenido de sugerencias

### Fase 2: Logs Temporales (5 min)
- [ ] Agregar logs en `pdfOrdenFabricacionService.js` línea 385
- [ ] Generar PDF de prueba
- [ ] Revisar consola del servidor
- [ ] Identificar si sugerencias llegan al renderizado

### Fase 3: Corrección (5 min)
- [ ] Aplicar solución según resultado del debug
- [ ] Quitar logs temporales
- [ ] Generar PDF final
- [ ] Validar que sugerencias aparecen correctamente

### Fase 4: Validación (5 min)
- [ ] Probar con proyecto real (Héctor Huerta)
- [ ] Verificar diferentes casos:
  - [ ] Todas piezas pequeñas (≤2.50m)
  - [ ] Todas piezas grandes (>2.50m)
  - [ ] Mezcla de piezas
- [ ] Confirmar formato y legibilidad

---

## 📊 CASOS DE PRUEBA

### Caso 1: Todas Piezas Pequeñas
**Entrada:**
- Pieza 1: 1.20m × 2.80m
- Pieza 2: 1.50m × 2.50m

**Sugerencias esperadas:**
```
[>>] SUGERENCIAS:
      Todas las 2 pieza(s) caben en lienzo de 2.50m
      Revisar si hay lienzo de 2.50m en stock del taller
```

### Caso 2: Mezcla de Piezas
**Entrada:**
- Pieza 1: 1.20m × 2.80m (pequeña)
- Pieza 2: 2.80m × 2.50m (grande)

**Sugerencias esperadas:**
```
[>>] SUGERENCIAS:
      OPCION 1: Pedir 1 rollo de 3.0m para todas las piezas
      OPCION 2: Usar lienzo de 2.50m del taller para 1 pieza(s) pequena(s)
```

### Caso 3: Todas Piezas Grandes
**Entrada:**
- Pieza 1: 2.80m × 2.50m
- Pieza 2: 2.90m × 2.80m

**Sugerencias esperadas:**
```
[>>] SUGERENCIAS:
      Requiere rollo de 3.0m (piezas grandes)
```

---

## 🎯 RESULTADO ESPERADO

**Antes (ACTUAL):**
```
TELAS
1. Tela Screen 3% Blanco
   ESPECIFICACIONES:
      • Modelo: Screen 3%
      • Color: Blanco
      • Ancho de rollo: 2.50m
   
   PEDIDO:
      • Cantidad: 1 rollo(s) de 2.50m
      • Total metros lineales: 15.50ml
   
   ANÁLISIS DE CORTES:
      • Total de piezas: 2
      ...
   
   [AQUÍ DEBERÍAN APARECER LAS SUGERENCIAS] ❌
```

**Después (ESPERADO):**
```
TELAS
1. Tela Screen 3% Blanco
   ESPECIFICACIONES:
      • Modelo: Screen 3%
      • Color: Blanco
      • Ancho de rollo: 2.50m
   
   PEDIDO:
      • Cantidad: 1 rollo(s) de 2.50m
      • Total metros lineales: 15.50ml
   
   ANÁLISIS DE CORTES:
      • Total de piezas: 2
      ...
   
   [>>] SUGERENCIAS:
      Todas las 2 pieza(s) caben en lienzo de 2.50m
      Revisar si hay lienzo de 2.50m en stock del taller
```

---

## 📝 NOTAS ADICIONALES

### Archivos Involucrados
1. `server/services/ordenProduccionService.js` - Generación de sugerencias
2. `server/services/pdfOrdenFabricacionService.js` - Renderizado en PDF
3. `server/scripts/debugSugerenciasPDF.js` - Script de debug (nuevo)

### Comandos Útiles
```bash
# Debug de sugerencias
node server/scripts/debugSugerenciasPDF.js 673456789abc123def456789

# Generar PDF de prueba
curl -X GET "http://localhost:5001/api/proyectos/673456789abc123def456789/pdf?tipo=orden-produccion" \
  -H "Authorization: Bearer <token>" \
  --output test-orden.pdf

# Ver logs del servidor
tail -f server/logs/combined.log | grep -i "sugerencias"
```

### Referencias
- Auditoría completa: `docs/auditorias/AUDITORIA_SESION_14_NOV_2025.md`
- Implementación original: Líneas 632-642 de `ordenProduccionService.js`
- Renderizado PDF: Líneas 385-399 de `pdfOrdenFabricacionService.js`

---

**Estado:** 📋 PENDIENTE DE IMPLEMENTACIÓN  
**Próximo paso:** Ejecutar script de debug para identificar causa exacta  
**Tiempo estimado total:** 15-20 minutos
