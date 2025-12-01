# 🔒 CANDADO DE ROTACIÓN FORZADA

**Fecha:** 19 Noviembre 2025  
**Estado:** ✅ MODELO ACTUALIZADO | ⏳ FRONTEND PENDIENTE  
**Archivo modificado:** `server/models/Proyecto.js`

---

## 🎯 OBJETIVO

Permitir marcar manualmente piezas que **DEBEN ir rotadas** en el levantamiento, independientemente de si el ancho es mayor a 3.0m.

---

## 📋 CASOS DE USO

### Caso 1: Rotación Automática (ancho > 3.0m)
```
Pieza: 4.28m × 2.80m
→ Sistema detecta: ancho > 3.0m
→ Marca automáticamente: rotadaForzada = true
→ Usuario ve: 🔒 (candado cerrado)
```

### Caso 2: Rotación Manual (decisión del técnico)
```
Pieza: 2.50m × 2.80m
→ Técnico decide que debe ir rotada (por diseño, instalación, etc.)
→ Activa candado manualmente: rotadaForzada = true
→ Sistema respeta la decisión
```

### Caso 3: Sin Rotación
```
Pieza: 1.99m × 1.58m
→ No requiere rotación
→ rotadaForzada = false (default)
→ Usuario ve: 🔓 (candado abierto o sin icono)
```

---

## 🔧 IMPLEMENTACIÓN

### 1. Modelo (COMPLETADO ✅)

**Archivo:** `server/models/Proyecto.js` (línea 230-234)

```javascript
piezas: [{
  ancho: Number,
  alto: Number,
  // ... otros campos
  rotadaForzada: {
    type: Boolean,
    default: false,
    description: '🔒 Candado: Si true, esta pieza DEBE ir rotada'
  }
}]
```

---

### 2. Lógica de Negocio (PENDIENTE ⏳)

**Archivo a modificar:** `server/services/optimizadorCortesService.js`

**Agregar función:**
```javascript
/**
 * Determina si una pieza debe ir rotada
 * @param {object} pieza - Datos de la pieza
 * @returns {boolean} true si debe ir rotada
 */
static debeIrRotada(pieza) {
  // Prioridad 1: Candado manual (decisión del técnico)
  if (pieza.rotadaForzada === true) {
    return true;
  }
  
  // Prioridad 2: Regla automática (ancho > 3.0m)
  if (pieza.ancho > 3.0) {
    return true;
  }
  
  // Por defecto: no rotar
  return false;
}
```

**Usar en cálculo de materiales:**
```javascript
async calcularMaterialesPieza(pieza) {
  // Determinar si va rotada
  const rotada = this.debeIrRotada(pieza);
  
  // Calcular metros lineales según rotación
  const metrosLineales = rotada 
    ? pieza.ancho + 0.05  // Si rotada: usar ancho como largo
    : pieza.alto + 0.05;  // Si normal: usar alto como largo
  
  // ... resto del cálculo
}
```

---

### 3. Frontend - UI del Levantamiento (PENDIENTE ⏳)

**Componente sugerido:** `client/src/components/Levantamiento/PiezaForm.jsx`

**UI propuesta:**

```jsx
<div className="pieza-form">
  {/* Campos existentes: ancho, alto, etc. */}
  
  {/* NUEVO: Candado de rotación */}
  <div className="campo-rotacion">
    <label>
      <input
        type="checkbox"
        checked={pieza.rotadaForzada}
        onChange={(e) => handleRotacionForzada(e.target.checked)}
      />
      <span className={pieza.rotadaForzada ? 'candado-cerrado' : 'candado-abierto'}>
        {pieza.rotadaForzada ? '🔒' : '🔓'} Forzar rotación
      </span>
    </label>
    
    {/* Indicador visual */}
    {pieza.ancho > 3.0 && (
      <span className="alerta-auto">
        ⚠️ Se rotará automáticamente (ancho > 3.0m)
      </span>
    )}
    
    {pieza.rotadaForzada && pieza.ancho <= 3.0 && (
      <span className="info-manual">
        ℹ️ Rotación forzada manualmente
      </span>
    )}
  </div>
</div>
```

**Estilos sugeridos:**
```css
.campo-rotacion {
  margin: 10px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.candado-cerrado {
  color: #dc3545;
  font-weight: bold;
}

.candado-abierto {
  color: #6c757d;
}

.alerta-auto {
  display: block;
  margin-top: 5px;
  color: #ff6600;
  font-size: 12px;
}

.info-manual {
  display: block;
  margin-top: 5px;
  color: #0066cc;
  font-size: 12px;
}
```

---

### 4. API Endpoint (OPCIONAL)

Si necesitas un endpoint específico para actualizar solo el candado:

**Archivo:** `server/routes/proyectos.js`

```javascript
// PUT /api/proyectos/:id/piezas/:piezaIndex/rotacion
router.put('/:id/piezas/:piezaIndex/rotacion', async (req, res) => {
  try {
    const { id, piezaIndex } = req.params;
    const { rotadaForzada } = req.body;
    
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Actualizar el candado de la pieza específica
    const pieza = proyecto.levantamiento.partidas[0].piezas[piezaIndex];
    if (!pieza) {
      return res.status(404).json({ error: 'Pieza no encontrada' });
    }
    
    pieza.rotadaForzada = rotadaForzada;
    await proyecto.save();
    
    res.json({
      success: true,
      pieza: {
        index: piezaIndex,
        rotadaForzada: pieza.rotadaForzada,
        ancho: pieza.ancho,
        alto: pieza.alto
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 FLUJO COMPLETO

### 1. En el Levantamiento (Frontend)
```
Usuario captura pieza:
├─ Ancho: 4.28m
├─ Alto: 2.80m
└─ Sistema detecta: ancho > 3.0m
   └─ Muestra: ⚠️ Se rotará automáticamente
   └─ Candado: 🔒 (cerrado automáticamente)
```

### 2. Al Guardar
```
POST /api/proyectos/:id/levantamiento
{
  "piezas": [{
    "ancho": 4.28,
    "alto": 2.80,
    "rotadaForzada": true  // ← Guardado en BD
  }]
}
```

### 3. En Cálculo de Materiales
```
optimizadorCortesService.calcularMaterialesPieza()
├─ Lee: pieza.rotadaForzada = true
├─ Calcula: metrosLineales = 4.28 + 0.05 = 4.33ml
└─ Marca: pieza.rotada = true (en resultado)
```

### 4. En PDF de Orden
```
PIEZAS A FABRICAR
1. Rec Princ - 4.28×2.80m
   Blackout Montreal white
   🔄 ROTADA (4.33ml de tela)
   ↻ Usar ancho de 4.28m como largo
```

---

## ✅ VENTAJAS

### 1. Control Manual
- ✅ Técnico puede forzar rotación por razones específicas
- ✅ No depende solo de reglas automáticas
- ✅ Flexibilidad para casos especiales

### 2. Claridad Visual
- ✅ Icono de candado 🔒 indica decisión forzada
- ✅ Alertas automáticas para anchos > 3.0m
- ✅ Usuario siempre sabe por qué se rota

### 3. Trazabilidad
- ✅ Decisión guardada en BD
- ✅ Se mantiene en todo el flujo (cotización → fabricación)
- ✅ Auditable en reportes

---

## 🧪 CASOS DE PRUEBA

### Test 1: Rotación Automática
```javascript
const pieza = {
  ancho: 4.28,
  alto: 2.80,
  rotadaForzada: false  // No forzada manualmente
};

const rotada = OptimizadorCortesService.debeIrRotada(pieza);
// Esperado: true (por ancho > 3.0m)
```

### Test 2: Rotación Manual
```javascript
const pieza = {
  ancho: 2.50,
  alto: 2.80,
  rotadaForzada: true  // Forzada por técnico
};

const rotada = OptimizadorCortesService.debeIrRotada(pieza);
// Esperado: true (por candado manual)
```

### Test 3: Sin Rotación
```javascript
const pieza = {
  ancho: 1.99,
  alto: 1.58,
  rotadaForzada: false
};

const rotada = OptimizadorCortesService.debeIrRotada(pieza);
// Esperado: false
```

---

## 🚀 PRÓXIMOS PASOS

### Prioridad Alta (1-2 horas)
1. ✅ Actualizar modelo Proyecto.js (COMPLETADO)
2. ⏳ Implementar lógica en `optimizadorCortesService.js`
3. ⏳ Agregar UI en formulario de levantamiento

### Prioridad Media (2-3 horas)
4. ⏳ Endpoint API para actualizar candado
5. ⏳ Validaciones en backend
6. ⏳ Tests unitarios

### Prioridad Baja (según necesidad)
7. ⏳ Historial de cambios de rotación
8. ⏳ Alertas cuando se cambia el candado
9. ⏳ Reportes de piezas rotadas

---

## 📝 NOTAS TÉCNICAS

### Compatibilidad
- ✅ Campo opcional (default: false)
- ✅ No rompe proyectos existentes
- ✅ Migración automática (campo se agrega al guardar)

### Reglas de Prioridad
1. **Candado manual** (rotadaForzada = true) → SIEMPRE rotar
2. **Regla automática** (ancho > 3.0m) → Rotar si no hay candado
3. **Default** → No rotar

### Validaciones Sugeridas
```javascript
// En el backend, al guardar
if (pieza.rotadaForzada && pieza.ancho > 3.0) {
  // Advertencia: rotación redundante (ya se rotaría automáticamente)
  logger.warn('Candado redundante', {
    pieza: pieza.ubicacion,
    ancho: pieza.ancho
  });
}
```

---

## 📚 REFERENCIAS

**Archivos relacionados:**
- `server/models/Proyecto.js` (línea 230-234) - Modelo actualizado
- `server/services/optimizadorCortesService.js` - Lógica de rotación
- `server/services/ordenProduccionService.js` - Uso en fabricación

**Documentación relacionada:**
- `docs/RESUMEN_ROTACION_TELAS.md` - Explicación general de rotación
- `docs/NUEVA_LOGICA_COMPRA_TELAS.md` - Lógica de compra de materiales

---

**Última actualización:** 19 Nov 2025, 6:25 PM  
**Estado:** ✅ MODELO LISTO | ⏳ IMPLEMENTACIÓN PENDIENTE
