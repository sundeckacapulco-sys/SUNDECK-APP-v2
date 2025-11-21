# 📋 Guía: Agregar Nuevas Especificaciones al Levantamiento

**Fecha:** 20 Nov 2025  
**Autor:** Sistema Sundeck  
**Versión:** 1.0

---

## 🎯 Objetivo

Esta guía documenta el proceso completo para agregar una nueva especificación técnica al módulo de levantamiento y asegurar que aparezca correctamente en el PDF de la orden de fabricación.

**Ejemplo implementado:** Galería Compartida y Sistema Skyline  
**Ejemplo futuro sugerido:** Motor Compartido por Piezas

---

## 📊 Flujo de Datos

```
┌─────────────────┐
│   FRONTEND      │
│  (Captura)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   BACKEND       │
│ (Normalización) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  BASE DE DATOS  │
│   (Mongoose)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SERVICIOS     │
│  (Extracción)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PDF SERVICE   │
│  (Renderizado)  │
└─────────────────┘
```

---

## 🔧 Paso a Paso: Agregar Nueva Especificación

### **PASO 1: Definir el Campo en el Schema de Mongoose**

**Archivo:** `server/models/Proyecto.js`  
**Ubicación:** Schema `levantamiento.partidas.piezas`

```javascript
// Dentro de levantamiento.partidas[].piezas[]
{
  // ... otros campos existentes ...
  
  // NUEVO CAMPO: Motor Compartido
  motorCompartido: {
    type: Boolean,
    default: false,
    description: '🔌 Indica si esta pieza comparte motor con otras piezas'
  },
  grupoMotor: {
    type: String,
    default: null,
    description: '🔌 Grupo de motor compartido (M1, M2, M3, etc.)'
  },
  piezasPorMotor: {
    type: Number,
    default: 1,
    description: '🔌 Cantidad de piezas que sube este motor'
  }
}
```

**⚠️ Importante:**
- Usa `type: Boolean` para campos de sí/no
- Usa `type: String` para identificadores de grupo
- Usa `type: Number` para cantidades
- Siempre define `default` para evitar valores `undefined`
- Agrega `description` para documentación

---

### **PASO 2: Normalizar en el Backend**

**Archivo:** `server/controllers/proyectoController.js`  
**Función:** `normalizarPartidas`

```javascript
function normalizarPartidas(partidas, opciones = {}) {
  // ... código existente ...
  
  const piezasNormalizadas = piezas.map(pieza => {
    return {
      // ... campos existentes ...
      
      // NUEVOS CAMPOS: Motor Compartido
      motorCompartido: Boolean(pieza.motorCompartido),
      grupoMotor: pieza.grupoMotor || null,
      piezasPorMotor: Number(pieza.piezasPorMotor) || 1,
      
      // ... resto de campos ...
    };
  });
  
  // Log para debug (IMPORTANTE para troubleshooting)
  if (pieza.motorCompartido) {
    logger.info('🔍 Motor compartido detectado en pieza', {
      motorCompartido: pieza.motorCompartido,
      grupoMotor: pieza.grupoMotor,
      piezasPorMotor: pieza.piezasPorMotor
    });
  }
}
```

**⚠️ Importante:**
- Usa `Boolean()` para convertir a booleano
- Usa `Number()` para convertir a número
- Usa `|| null` o `|| 'valor_default'` para valores opcionales
- Agrega logs con emoji único para facilitar búsqueda

---

### **PASO 3: Incluir en Registro de Medidas**

**Archivo:** `server/controllers/proyectoController.js`  
**Función:** `construirRegistroMedidas`

```javascript
function construirRegistroMedidas(partidas, metadata) {
  // ... código existente ...
  
  const piezasParaRegistro = partidas.map(partida => ({
    // ... campos existentes ...
    
    medidas: partida.piezas.map(pieza => ({
      // ... campos existentes ...
      
      // NUEVOS CAMPOS: Motor Compartido
      motorCompartido: pieza.motorCompartido || false,
      grupoMotor: pieza.grupoMotor || null,
      piezasPorMotor: pieza.piezasPorMotor || 1
    }))
  }));
}
```

---

### **PASO 4: Extraer en Servicio de Orden de Producción**

**Archivo:** `server/services/ordenProduccionService.js`  
**Función:** `obtenerPiezasConDetallesTecnicos`

```javascript
static obtenerPiezasConDetallesTecnicos(proyecto) {
  // ... código existente ...
  
  // CASO 1: Si hay productos directos
  if (proyecto.productos && proyecto.productos.length > 0) {
    proyecto.productos.forEach(producto => {
      piezas.push({
        // ... campos existentes ...
        
        // NUEVOS CAMPOS: Motor Compartido
        motorCompartido: Boolean(producto.motorCompartido || medidas.motorCompartido),
        grupoMotor: producto.grupoMotor || medidas.grupoMotor || null,
        piezasPorMotor: Number(producto.piezasPorMotor || medidas.piezasPorMotor) || 1
      });
    });
  }
  
  // CASO 2: Si hay levantamiento con partidas
  if (proyecto.levantamiento?.partidas) {
    proyecto.levantamiento.partidas.forEach(partida => {
      partida.piezas?.forEach(pieza => {
        piezasArray.push({
          // ... campos existentes ...
          
          // NUEVOS CAMPOS: Motor Compartido
          motorCompartido: Boolean(pieza.motorCompartido),
          grupoMotor: pieza.grupoMotor || null,
          piezasPorMotor: Number(pieza.piezasPorMotor) || 1
        });
      });
    });
  }
}
```

**⚠️ Importante:**
- Mapear desde AMBOS flujos: `productos` Y `levantamiento.partidas`
- Usar el operador `||` para fallback entre fuentes
- Mantener conversión de tipos consistente

---

### **PASO 5: Renderizar en PDF**

**Archivo:** `server/services/pdfOrdenFabricacionService.js`

#### **5.1 En el Resumen de Piezas (Línea ~245)**

```javascript
// Línea 2: Medidas y especificaciones técnicas
const specs = [
  `${pieza.ancho}×${pieza.alto}m`,
  pieza.motorizado ? 'Motorizado' : 'Manual',
  // ... otros campos ...
  
  // NUEVOS INDICADORES
  pieza.galeriaCompartida ? `[GAL-${pieza.grupoGaleria || 'A'}]` : null,
  pieza.sistemaSkyline ? '[SKYLINE]' : null,
  pieza.motorCompartido ? `[MOTOR-${pieza.grupoMotor || 'M1'}]` : null
].filter(Boolean).join(' | ');
```

#### **5.2 En Especificaciones Técnicas Completas (Línea ~518)**

```javascript
const especificaciones = [
  `Sistema: ${pieza.sistema || 'N/A'}`,
  `Control: ${pieza.control || 'N/A'}`,
  // ... otros campos ...
  `Traslape: ${pieza.traslape || 'N/A'}`
];

// Agregar información de galería compartida si aplica
if (pieza.galeriaCompartida) {
  especificaciones.push(`>> GALERIA COMPARTIDA - Grupo ${pieza.grupoGaleria || 'A'}`);
}

// Agregar información de sistema Skyline si aplica
if (pieza.sistemaSkyline) {
  especificaciones.push(`>> SISTEMA SKYLINE`);
}

// NUEVO: Agregar información de motor compartido si aplica
if (pieza.motorCompartido) {
  especificaciones.push(`>> MOTOR COMPARTIDO - Grupo ${pieza.grupoMotor || 'M1'} (${pieza.piezasPorMotor} piezas)`);
}
```

**⚠️ Formato de Indicadores:**
- **Resumen:** `[CODIGO-GRUPO]` - Formato compacto para el listado
- **Especificaciones:** `>> DESCRIPCION - Detalles` - Formato descriptivo para la sección técnica
- **Evitar emojis:** No se renderizan bien en PDFs, usar `>>` o `[...]`

---

### **PASO 6: Frontend - Captura de Datos**

**Archivo:** `client/src/modules/proyectos/components/AgregarMedidaPartidasModal.jsx`

#### **6.1 Agregar campos al formulario de captura (Línea ~1110)**

**Ubicación:** Después del campo "Sistema Skyline", dentro del mapeo de medidas

**Estructura del campo:**
```jsx
{/* Motor Compartido */}
<Grid item xs={12}>
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1, 
    p: 1, 
    bgcolor: '#dbeafe',  // Color de fondo distintivo
    borderRadius: 1, 
    border: '1px solid #3b82f6' 
  }}>
    {/* Checkbox principal */}
    <input
      type="checkbox"
      checked={medida.motorCompartido || false}
      onChange={(e) => {
        const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
        nuevasMedidas[index] = { 
          ...nuevasMedidas[index], 
          motorCompartido: e.target.checked,
          grupoMotor: e.target.checked ? (nuevasMedidas[index].grupoMotor || 'M1') : null,
          piezasPorMotor: e.target.checked ? (nuevasMedidas[index].piezasPorMotor || 1) : 1
        };
        piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
      }}
      style={{ width: 18, height: 18, cursor: 'pointer' }}
    />
    
    {/* Label con icono */}
    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af' }}>
      🔌 Motor Compartido
    </Typography>
    
    {/* Campos condicionales cuando está activado */}
    {medida.motorCompartido && (
      <>
        {/* Select de grupo */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Grupo</InputLabel>
          <Select
            value={medida.grupoMotor || 'M1'}
            label="Grupo"
            onChange={(e) => {
              const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
              nuevasMedidas[index] = { ...nuevasMedidas[index], grupoMotor: e.target.value };
              piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
            }}
          >
            <MenuItem value="M1">M1</MenuItem>
            <MenuItem value="M2">M2</MenuItem>
            <MenuItem value="M3">M3</MenuItem>
            <MenuItem value="M4">M4</MenuItem>
            <MenuItem value="M5">M5</MenuItem>
          </Select>
        </FormControl>
        
        {/* Input numérico */}
        <TextField
          type="number"
          label="Piezas por motor"
          size="small"
          value={medida.piezasPorMotor || 1}
          onChange={(e) => {
            const nuevasMedidas = [...(piezasManager.piezaForm.medidas || [])];
            nuevasMedidas[index] = { 
              ...nuevasMedidas[index], 
              piezasPorMotor: parseInt(e.target.value) || 1 
            };
            piezasManager.setPiezaForm(prev => ({ ...prev, medidas: nuevasMedidas }));
          }}
          inputProps={{ min: 1, max: 10 }}
          sx={{ width: 140 }}
        />
        
        {/* Indicador en vivo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
          <Typography variant="caption" sx={{ color: '#1e40af' }}>
            ℹ️ Grupo {medida.grupoMotor || 'M1'}: {(() => {
              const grupo = medida.grupoMotor || 'M1';
              const medidasDelGrupo = (piezasManager.piezaForm.medidas || []).filter(
                m => m.motorCompartido && m.grupoMotor === grupo
              );
              return `${medidasDelGrupo.length} pieza${medidasDelGrupo.length !== 1 ? 's' : ''}`;
            })()}
          </Typography>
        </Box>
      </>
    )}
  </Box>
</Grid>
```

**⚠️ Importante:**
- **Ubicación exacta:** Buscar el comentario `{/* Sistema Skyline */}` y agregar después del cierre de su `</Grid>`
- **Grid item:** Usar `xs={12}` para ocupar todo el ancho
- **Color distintivo:** Cada tipo de campo especial tiene su propio color:
  - Galería Compartida: Azul claro (`#bfdbfe`)
  - Sistema Skyline: Amarillo (`#fef3c7`)
  - Motor Compartido: Azul (`#dbeafe`)
- **Icono único:** Usar emoji distintivo (🔌 para motor)
- **Campos condicionales:** Solo mostrar select y input cuando el checkbox está activado
- **Contador en vivo:** Calcular y mostrar cuántas piezas comparten el mismo grupo

#### **6.2 Preparar datos antes de enviar (Línea ~315)**

```javascript
const partidas = piezasManager.piezas.map(pieza => {
  const medidasConArea = (pieza.medidas || []).map(medida => {
    const medidaConArea = {
      ...medida,
      area: (parseFloat(medida.ancho) || 0) * (parseFloat(medida.alto) || 0),
      rotada: medida.rotada || medida.detalleTecnico === 'rotada' || false,
      
      // Campos especiales existentes
      galeriaCompartida: medida.galeriaCompartida || false,
      grupoGaleria: medida.grupoGaleria || null,
      sistemaSkyline: medida.sistemaSkyline || false,
      
      // NUEVOS CAMPOS: Motor Compartido
      motorCompartido: medida.motorCompartido || false,
      grupoMotor: medida.grupoMotor || null,
      piezasPorMotor: medida.piezasPorMotor || 1
    };
    
    // Log para debug si tiene campos especiales
    if (medida.motorCompartido) {
      console.log('🔍 Medida con motor compartido:', {
        motorCompartido: medida.motorCompartido,
        grupoMotor: medida.grupoMotor,
        piezasPorMotor: medida.piezasPorMotor
      });
    }
    
    return medidaConArea;
  });
  
  return {
    ubicacion: pieza.ubicacion,
    // ... otros campos ...
    medidas: medidasConArea
  };
});
```

#### **6.3 Paleta de Colores para Campos Especiales**

Usar colores distintivos ayuda a identificar rápidamente cada tipo de especificación:

| Campo | Color Fondo | Color Borde | Color Texto | Icono |
|-------|-------------|-------------|-------------|-------|
| Galería Compartida | `#bfdbfe` | `#3b82f6` | `#1e40af` | 🔗 |
| Sistema Skyline | `#fef3c7` | `#fbbf24` | `#92400e` | ⭐ |
| Motor Compartido | `#dbeafe` | `#3b82f6` | `#1e40af` | 🔌 |

**Sugerencias para nuevos campos:**
- Control Compartido: Verde (`#d1fae5` / `#10b981` / `#065f46`) 🎮
- Instalación Especial: Morado (`#e9d5ff` / `#a855f7` / `#6b21a8`) 🔧
- Material Especial: Naranja (`#fed7aa` / `#f97316` / `#9a3412`) 📦

---

### **PASO 7: Actualizar Componente de Visualización**

**Archivos:** 
- `client/src/modules/proyectos/components/PiezaCard.jsx`
- `client/src/modules/proyectos/components/LevantamientoTab.jsx`

#### **7.1 Agregar props en PiezaCard.jsx**

**Ubicación:** Línea ~5 (parámetros del componente)

```jsx
const PiezaCard = ({ 
  numero, 
  ancho, 
  alto, 
  // ... otros campos existentes ...
  observacionesTecnicas,
  // NUEVOS: Campos especiales
  galeriaCompartida,
  grupoGaleria,
  sistemaSkyline,
  motorCompartido,
  grupoMotor,
  piezasPorMotor
}) => {
```

#### **7.2 Agregar sección de badges en PiezaCard.jsx**

**Ubicación:** Línea ~284 (después de Observaciones, antes del cierre de Grid)

```jsx
{/* Campos Especiales - Ancho completo */}
{(galeriaCompartida || sistemaSkyline || motorCompartido) && (
  <Grid item xs={12}>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {galeriaCompartida && (
        <Box sx={{ 
          bgcolor: '#bfdbfe', 
          px: 1.5, 
          py: 0.5, 
          borderRadius: '6px',
          border: '1px solid #3b82f6'
        }}>
          <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
            🔗 Galería Compartida - Grupo {grupoGaleria || 'A'}
          </Typography>
        </Box>
      )}
      
      {sistemaSkyline && (
        <Box sx={{ 
          bgcolor: '#fef3c7', 
          px: 1.5, 
          py: 0.5, 
          borderRadius: '6px',
          border: '1px solid #fbbf24'
        }}>
          <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
            ⭐ Sistema Skyline
          </Typography>
        </Box>
      )}
      
      {motorCompartido && (
        <Box sx={{ 
          bgcolor: '#dbeafe', 
          px: 1.5, 
          py: 0.5, 
          borderRadius: '6px',
          border: '1px solid #3b82f6'
        }}>
          <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 600 }}>
            🔌 Motor Compartido - Grupo {grupoMotor || 'M1'} ({piezasPorMotor || 1} piezas)
          </Typography>
        </Box>
      )}
    </Box>
  </Grid>
)}
```

#### **7.3 Pasar props desde LevantamientoTab.jsx**

**Ubicación:** Línea ~630 (donde se renderiza PiezaCard)

```jsx
<PiezaCard
  key={idx}
  numero={idx + 1}
  ancho={medidaIndiv.ancho}
  alto={medidaIndiv.alto}
  // ... otros props existentes ...
  observacionesTecnicas={medidaIndiv.observacionesTecnicas}
  // NUEVOS: Campos especiales
  galeriaCompartida={medidaIndiv.galeriaCompartida}
  grupoGaleria={medidaIndiv.grupoGaleria}
  sistemaSkyline={medidaIndiv.sistemaSkyline}
  motorCompartido={medidaIndiv.motorCompartido}
  grupoMotor={medidaIndiv.grupoMotor}
  piezasPorMotor={medidaIndiv.piezasPorMotor}
/>
```

**⚠️ Importante:**
- **Badges condicionales:** Solo se muestran si el campo está activado
- **Diseño responsive:** Usar `flexWrap: 'wrap'` para que los badges se ajusten en pantallas pequeñas
- **Colores consistentes:** Usar la misma paleta que en el formulario de captura
- **Información completa:** Mostrar grupo y cantidad de piezas cuando aplique

**📍 Ubicaciones exactas:**
1. `PiezaCard.jsx` línea 5: Agregar props
2. `PiezaCard.jsx` línea 284: Agregar sección de badges
3. `LevantamientoTab.jsx` línea 630: Pasar props al renderizar

---

## 🧪 Testing y Validación

### **Checklist de Verificación**

```bash
# 1. Verificar que el schema se actualizó
node -e "const P = require('./server/models/Proyecto'); console.log(P.schema.paths['levantamiento.partidas.0.piezas.0.motorCompartido'])"

# 2. Crear un levantamiento con el nuevo campo desde el frontend

# 3. Verificar logs del backend
# Buscar en la consola del servidor:
# - "🔍 Motor compartido detectado en pieza"
# - "🔍 Primera medida de primera partida" (debe incluir motorCompartido)

# 4. Generar orden de fabricación PDF

# 5. Verificar en el PDF:
# - Resumen: [MOTOR-M1]
# - Especificaciones: >> MOTOR COMPARTIDO - Grupo M1 (2 piezas)
```

---

## 📝 Logs de Debug Recomendados

### **Backend (proyectoController.js)**

```javascript
// En normalizarPartidas
if (pieza.motorCompartido) {
  logger.info('🔌 Motor compartido detectado', {
    motorCompartido: pieza.motorCompartido,
    grupoMotor: pieza.grupoMotor,
    piezasPorMotor: pieza.piezasPorMotor
  });
}
```

### **Frontend (AgregarMedidaPartidasModal.jsx)**

```javascript
// Antes de enviar al backend
if (medida.motorCompartido) {
  console.log('🔌 Enviando medida con motor compartido:', {
    motorCompartido: medida.motorCompartido,
    grupoMotor: medida.grupoMotor,
    piezasPorMotor: medida.piezasPorMotor
  });
}
```

---

## ⚠️ Errores Comunes y Soluciones

### **1. Campo no aparece en el PDF**

**Causa:** No se agregó en `ordenProduccionService.js`  
**Solución:** Verificar que el campo se extrae en `obtenerPiezasConDetallesTecnicos`

### **2. Campo aparece como `undefined` en el PDF**

**Causa:** No se definió `default` en el schema  
**Solución:** Agregar `default: false` o `default: null` en el schema

### **3. Campo no se guarda en la BD**

**Causa:** No se normalizó en `normalizarPartidas`  
**Solución:** Agregar el campo en la función `normalizarPartidas`

### **4. Campo se pierde al editar**

**Causa:** No se incluye al cargar datos para editar  
**Solución:** Verificar que `piezasManager.reemplazarPiezas()` preserve el campo

---

## 📚 Archivos Involucrados (Resumen)

| Archivo | Función | Cambios Requeridos |
|---------|---------|-------------------|
| `server/models/Proyecto.js` | Schema BD | Definir campos nuevos en `levantamiento.partidas.piezas` |
| `server/controllers/proyectoController.js` | Normalización | Mapear campos en `normalizarPartidas` y `construirRegistroMedidas` |
| `server/services/ordenProduccionService.js` | Extracción | Incluir campos en `obtenerPiezasConDetallesTecnicos` (ambos flujos) |
| `server/services/pdfOrdenFabricacionService.js` | Renderizado PDF | Mostrar campos en resumen y especificaciones técnicas |
| `client/src/modules/proyectos/components/AgregarMedidaPartidasModal.jsx` | Captura | Agregar formulario y incluir campos en payload |
| `client/src/modules/proyectos/components/PiezaCard.jsx` | Visualización | Agregar props y badges de campos especiales |
| `client/src/modules/proyectos/components/LevantamientoTab.jsx` | Renderizado | Pasar props de campos especiales a PiezaCard |

---

## 🎯 Ejemplo Completo: Motor Compartido

### **Caso de Uso**

Un motor Somfy sube 3 cortinas simultáneamente:
- Pieza 1: Sala - 1.8m × 2.5m → Motor Grupo M1 (3 piezas)
- Pieza 2: Sala - 1.8m × 2.5m → Motor Grupo M1 (3 piezas)
- Pieza 3: Sala - 1.5m × 2.5m → Motor Grupo M1 (3 piezas)

### **Resultado en PDF**

**Resumen:**
```
Pieza #1: Sala | 1.8×2.5m | Motorizado | [MOTOR-M1]
Pieza #2: Sala | 1.8×2.5m | Motorizado | [MOTOR-M1]
Pieza #3: Sala | 1.5×2.5m | Motorizado | [MOTOR-M1]
```

**Especificaciones Técnicas:**
```
ESPECIFICACIONES TÉCNICAS:
Sistema: Enrollable          Control: Izquierda
Tipo: Motorizado            Motor: Somfy RTS
...
>> MOTOR COMPARTIDO - Grupo M1 (3 piezas)
```

---

## 🚀 Mejoras Futuras Sugeridas

1. **Validación en Frontend:** Asegurar que todas las piezas del mismo grupo tengan valores consistentes
2. **Visualización en Levantamiento:** Mostrar indicadores visuales en la tabla de piezas
3. **Agrupación Automática:** Sugerir grupos basados en ubicación y medidas similares
4. **Cálculo de Materiales:** Ajustar BOM cuando hay motores compartidos

---

## 📞 Soporte

Si encuentras problemas al agregar una nueva especificación:
1. Verifica que seguiste TODOS los pasos en orden
2. Revisa los logs del backend con el emoji único
3. Usa las herramientas de dev del navegador para ver el payload enviado
4. Compara con la implementación de Galería Compartida o Sistema Skyline

---

**Última actualización:** 20 Nov 2025  
**Implementaciones exitosas:**
- ✅ Galería Compartida (grupoGaleria) - 20 Nov 2025
- ✅ Sistema Skyline (sistemaSkyline) - 20 Nov 2025
- ✅ Motor Compartido (grupoMotor, piezasPorMotor) - 20 Nov 2025

**Archivos modificados en última implementación (Motor Compartido):**
- `server/models/Proyecto.js` - Líneas 257-272 (schema)
- `server/controllers/proyectoController.js` - Líneas 205-213 (logs), 238-241 (normalización), 410-413 (registro)
- `server/services/ordenProduccionService.js` - Líneas 258-261 (productos), 330-333 (levantamiento)
- `server/services/pdfOrdenFabricacionService.js` - Líneas 255 (resumen), 547-550 (especificaciones)
- `client/src/modules/proyectos/components/AgregarMedidaPartidasModal.jsx` - Líneas 338-341 (payload), 1136-1207 (formulario)
- `client/src/modules/proyectos/components/PiezaCard.jsx` - Líneas 24-30 (props), 284-331 (badges)
- `client/src/modules/proyectos/components/LevantamientoTab.jsx` - Líneas 650-655 (pasar props)
