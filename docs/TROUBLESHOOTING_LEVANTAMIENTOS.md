# 🔧 TROUBLESHOOTING - SISTEMA DE LEVANTAMIENTOS

**Última actualización:** 7 Nov 2025  
**Versión del sistema:** v2.0  
**Módulo:** Levantamientos Técnicos

---

## 📋 ÍNDICE

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Problemas Comunes](#problemas-comunes)
3. [Diagnóstico Paso a Paso](#diagnóstico-paso-a-paso)
4. [Logs y Debugging](#logs-y-debugging)
5. [Validaciones Críticas](#validaciones-críticas)
6. [Casos de Uso Resueltos](#casos-de-uso-resueltos)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Flujo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────┤
│ AgregarMedidaPartidasModal.jsx                              │
│   ├─ Captura datos del formulario                           │
│   ├─ Calcula áreas (ancho × alto)                          │
│   ├─ Prepara payload                                        │
│   └─ POST /api/proyectos/:id/levantamiento                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                         │
├─────────────────────────────────────────────────────────────┤
│ proyectoController.js → guardarLevantamiento()              │
│   ├─ Normaliza partidas                                     │
│   ├─ Construye registro de medidas                          │
│   ├─ Guarda en proyecto.medidas[]                          │
│   └─ Guarda en proyecto.levantamiento{}                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BASE DE DATOS (MongoDB)                   │
├─────────────────────────────────────────────────────────────┤
│ Colección: proyectos                                        │
│   proyecto.medidas = [                                      │
│     {                                                       │
│       tipo: 'levantamiento',                               │
│       nombreLevantamiento: "...",                          │
│       personaVisita: "...",                                │
│       quienRecibe: "...",                                  │
│       piezas: [...]                                        │
│     }                                                       │
│   ]                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    VISUALIZACIÓN (React)                     │
├─────────────────────────────────────────────────────────────┤
│ LevantamientoTab.jsx                                        │
│   ├─ Lee proyecto.medidas[]                                │
│   ├─ Renderiza cada levantamiento                          │
│   └─ Muestra partidas y m²                                 │
└─────────────────────────────────────────────────────────────┘
```

### Archivos Clave

| Archivo | Responsabilidad | Ubicación |
|---------|----------------|-----------|
| `AgregarMedidaPartidasModal.jsx` | Formulario de captura | `client/src/modules/proyectos/components/` |
| `LevantamientoTab.jsx` | Visualización | `client/src/modules/proyectos/components/` |
| `proyectoController.js` | Lógica de negocio | `server/controllers/` |
| `Proyecto.js` | Modelo de datos | `server/models/` |

---

## 🐛 PROBLEMAS COMUNES

### 1. ❌ Los m² aparecen en 0.00

**Síntomas:**
```
📍 Rec Princ - blackout
2 piezas • 0.00 m²  ❌
```

**Causa:**
Las medidas individuales no tienen el campo `area` calculado.

**Solución:**
Verificar en `AgregarMedidaPartidasModal.jsx` líneas 310-346:

```javascript
// ✅ CORRECTO
const medidasConArea = (pieza.medidas || []).map(medida => ({
  ...medida,
  area: (parseFloat(medida.ancho) || 0) * (parseFloat(medida.alto) || 0)
}));

const areaTotal = calcularAreaPieza({ ...pieza, medidas: medidasConArea });
```

**Verificación:**
```javascript
// En consola del navegador
console.log('📏 Medidas con área:', medidasConArea);
// Debe mostrar: [{ ancho: 2.5, alto: 1.8, area: 4.5 }, ...]
```

---

### 2. ❌ El levantamiento no se guarda

**Síntomas:**
- Click en "Guardar"
- Mensaje de éxito
- Al recargar, el levantamiento no aparece

**Causa:**
El endpoint del backend no está recibiendo los datos correctamente.

**Diagnóstico:**

1. **Verificar payload en frontend:**
```javascript
// En AgregarMedidaPartidasModal.jsx línea 352
console.log('🔍 Guardando levantamiento:', payload);
```

2. **Verificar logs del backend:**
```bash
# En terminal del servidor
# Buscar: "Guardando levantamiento"
```

3. **Verificar endpoint:**
```javascript
// Debe ser:
await axiosConfig.patch(`/proyectos/${proyecto._id}/levantamiento`, payload);

// ❌ NO:
await axiosConfig.put(`/proyectos/${proyecto._id}`, payload);
```

**Solución:**
Asegurar que se usa el endpoint correcto: `PATCH /proyectos/:id/levantamiento`

---

### 3. ❌ "Quien recibe" no aparece

**Síntomas:**
- El campo se llena en el formulario
- No se muestra en la vista

**Causa:**
El backend no está guardando el campo `quienRecibe`.

**Verificación:**

1. **En el payload del frontend:**
```javascript
// AgregarMedidaPartidasModal.jsx línea 340-350
const payload = {
  nombreLevantamiento,
  partidas,
  totales,
  observaciones,
  personaVisita,
  quienRecibe,  // ✅ Debe estar aquí
  linkVideo,
  fotosGenerales
};
```

2. **En el backend:**
```javascript
// proyectoController.js línea 1453-1463
const { 
  nombreLevantamiento = '',
  partidas = [], 
  totales = {}, 
  observaciones = '', 
  personaVisita = '',
  quienRecibe = '',  // ✅ Debe estar aquí
  fechaCotizacion = '',
  linkVideo = '',
  fotosGenerales = []
} = req.body;
```

3. **En construirRegistroMedidas:**
```javascript
// proyectoController.js línea 315-317
const construirRegistroMedidas = (
  partidasNormalizadas,
  { nombreLevantamiento, personaVisita, quienRecibe, ... }  // ✅ Debe estar aquí
) => {
```

---

### 4. ❌ Error al eliminar levantamiento

**Síntomas:**
```
TypeError: Cannot read properties of undefined (reading 'filter')
```

**Causa:**
`proyecto.medidas` es `undefined`.

**Solución:**
Agregar validación en `LevantamientoTab.jsx` línea 133-137:

```javascript
// ✅ CORRECTO
if (!proyecto.medidas || !Array.isArray(proyecto.medidas)) {
  alert('No hay medidas para eliminar');
  return;
}

const nuevasMedidas = proyecto.medidas.filter((_, i) => i !== index);
```

---

### 5. ❌ Error 500 en estadísticas

**Síntomas:**
```
GET /api/proyectos/:id/estadisticas 500 (Internal Server Error)
```

**Causa:**
El backend intenta acceder a `proyecto.medidas.length` cuando `medidas` es `undefined`.

**Solución:**
En `proyectoController.js` línea 1349:

```javascript
// ✅ CORRECTO
total_medidas: Array.isArray(proyecto.medidas) ? proyecto.medidas.length : 0,

// ❌ INCORRECTO
total_medidas: proyecto.medidas.length,
```

---

### 6. ❌ El levantamiento no se elimina de la vista

**Síntomas:**
- Mensaje "Levantamiento eliminado correctamente"
- El levantamiento sigue apareciendo

**Causa:**
La vista no se recarga después de eliminar.

**Solución:**
En `LevantamientoTab.jsx` línea 149-160:

```javascript
// ✅ CORRECTO
console.log('✅ Levantamiento eliminado:', respuesta.data);

alert('Levantamiento eliminado correctamente');

if (onActualizar) {
  await onActualizar();
}

// Forzar recarga completa
window.location.reload();
```

---

### 7. ❌ Las medidas individuales no se guardan (medidas: [])

**Síntomas:**
```javascript
// En el frontend antes de guardar
medidas: [{ancho: 2, alto: 2, area: 4}]  // ✅ Tiene datos

// Después de guardar en el backend
medidas: []  // ❌ Vacío
areaTotal: 0  // ❌ Cero
```

**Causa:**
El frontend envía `partida.medidas[]` pero el backend espera `partida.piezas[]`. La función `normalizarPartidas` no encuentra las medidas y devuelve un array vacío.

**Diagnóstico:**

1. **Revisar logs del servidor:**
```bash
# Buscar estos logs después de guardar
grep "Partidas recibidas del frontend" logs/combined.log
grep "Partidas después de normalizar" logs/combined.log
```

2. **Verificar estructura recibida:**
```javascript
// Log: Partidas recibidas del frontend
"medidas":[{"ancho":2,"alto":2,"area":4}]  // ✅ Frontend envía medidas

// Log: Partidas después de normalizar
"piezas":[]  // ❌ Backend no las encuentra
```

**Solución:**
En `proyectoController.js` línea 193-195:

```javascript
// ❌ INCORRECTO - Solo busca 'piezas'
const piezas = (partida.piezas || []).map(pieza => {

// ✅ CORRECTO - Acepta 'piezas' o 'medidas'
const piezasArray = partida.piezas || partida.medidas || [];
const piezas = piezasArray.map(pieza => {
```

**Verificación:**
Después de aplicar el fix, los logs deben mostrar:
```javascript
// Log: Partidas después de normalizar
"piezas":[{"ancho":2,"alto":2,"m2":4}]  // ✅ Ya tiene datos
```

---

### 8. ❌ Campo 'medidas' no existe en el esquema de Mongoose

**Síntomas:**
```javascript
// Backend guarda correctamente
proyecto.medidas = [...medidasExistentes, registroMedidas];
await proyecto.save();  // ✅ Sin errores

// Pero al consultar el proyecto
proyecto.medidas  // undefined o []
```

**Causa:**
El campo `medidas` no está definido en el esquema de Mongoose del modelo `Proyecto.js`. Mongoose ignora silenciosamente los campos que no están en el esquema.

**Solución:**
En `server/models/Proyecto.js` después del campo `levantamiento`:

```javascript
// Array de medidas/levantamientos para visualización (CRÍTICO)
medidas: {
  type: [mongoose.Schema.Types.Mixed],
  default: []
},
```

**Verificación:**
```bash
# Reiniciar el servidor (OBLIGATORIO)
Ctrl + C
npm start

# Guardar un nuevo levantamiento
# Verificar en MongoDB o logs que medidas[] tiene datos
```

---

## 🔍 DIAGNÓSTICO PASO A PASO

### Checklist de Verificación

#### Frontend

- [ ] **Formulario captura todos los campos**
  - Nombre del levantamiento
  - Persona que visitó
  - Quien recibe
  - Fecha
  - Partidas con medidas

- [ ] **Cálculo de áreas**
  ```javascript
  // Verificar en consola
  console.log('📏 Área calculada:', area);
  // Debe ser: ancho × alto
  ```

- [ ] **Payload completo**
  ```javascript
  console.log('📦 Payload:', payload);
  // Debe incluir: nombreLevantamiento, quienRecibe, partidas, etc.
  ```

- [ ] **Endpoint correcto**
  ```javascript
  // Debe ser:
  PATCH /proyectos/:id/levantamiento
  ```

#### Backend

- [ ] **Recibe todos los campos**
  ```javascript
  // En guardarLevantamiento
  console.log('Datos recibidos:', req.body);
  ```

- [ ] **Normaliza partidas**
  ```javascript
  console.log('Partidas normalizadas:', partidasNormalizadas);
  ```

- [ ] **Construye registro de medidas**
  ```javascript
  console.log('Registro medidas:', registroMedidas);
  ```

- [ ] **Guarda en base de datos**
  ```javascript
  console.log('Proyecto guardado:', proyecto._id);
  ```

#### Base de Datos

- [ ] **Verificar estructura**
  ```javascript
  // En MongoDB Compass o shell
  db.proyectos.findOne({ _id: ObjectId("...") }, { medidas: 1 })
  ```

- [ ] **Verificar campos**
  ```javascript
  // Debe tener:
  {
    medidas: [{
      tipo: 'levantamiento',
      nombreLevantamiento: "...",
      quienRecibe: "...",
      piezas: [...]
    }]
  }
  ```

---

## 📊 LOGS Y DEBUGGING

### Logs del Frontend

**Ubicación:** Consola del navegador (F12)

```javascript
// Logs importantes
🔍 Guardando levantamiento con endpoint correcto: {...}
📦 Total de partidas: 4
📊 Totales calculados: {totalPartidas: 4, totalPiezas: 8, areaTotal: 45.5}
📏 Calculando área para pieza: {ubicacion: "...", medidas: [...], areaTotal: 10.5}
✅ Respuesta del servidor: {...}
```

### Logs del Backend

**Ubicación:** Terminal del servidor

```bash
# Logs importantes
info: Guardando levantamiento {"proyectoId":"...","nombreLevantamiento":"...","partidasCount":4}
info: Levantamiento guardado exitosamente {"proyectoId":"...","partidasCount":4}
```

### Comandos Útiles

```bash
# Ver logs en tiempo real
tail -f logs/combined.log

# Buscar errores
grep "error" logs/combined.log

# Buscar levantamientos
grep "Guardando levantamiento" logs/combined.log
```

---

## ✅ VALIDACIONES CRÍTICAS

### 1. Validación de Campos Obligatorios

```javascript
// Frontend - AgregarMedidaPartidasModal.jsx
if (piezasManager.piezas.length === 0) {
  setErrorLocal('Debes agregar al menos una partida');
  return;
}

for (let i = 0; i < piezasManager.piezas.length; i++) {
  const pieza = piezasManager.piezas[i];
  if (!pieza.ubicacion) {
    setErrorLocal(`La partida ${i + 1} no tiene ubicación`);
    return;
  }
  
  for (let j = 0; j < (pieza.medidas || []).length; j++) {
    const medida = pieza.medidas[j];
    if (!medida.ancho || !medida.alto) {
      setErrorLocal(`La partida ${i + 1}, pieza ${j + 1} no tiene medidas completas`);
      return;
    }
  }
}
```

### 2. Validación de Arrays

```javascript
// Backend - proyectoController.js
if (!Array.isArray(partidas) || partidas.length === 0) {
  return res.status(400).json({
    success: false,
    message: 'Debes proporcionar al menos una partida'
  });
}
```

### 3. Validación de Proyecto

```javascript
// Backend - proyectoController.js
const proyecto = await Proyecto.findById(id);
if (!proyecto) {
  return res.status(404).json({
    success: false,
    message: 'Proyecto no encontrado'
  });
}
```

---

## 📚 CASOS DE USO RESUELTOS

### Caso 0: Problema Completo - Medidas no se guardan (7 Nov 2025)

**Escenario:**
Usuario guarda un levantamiento con 1 partida y 1 pieza de 2×2m. El sistema muestra "Levantamiento guardado exitosamente" pero al recargar, el área aparece en 0.00 m² y no hay medidas individuales.

**Síntomas observados:**
```javascript
// Frontend antes de guardar (correcto)
{
  ubicacion: "Recámara Principal",
  medidas: [{ancho: 2, alto: 2, area: 4}],
  areaTotal: 4
}

// Backend después de guardar (incorrecto)
{
  ubicacion: "Recámara Principal",
  medidas: [],  // ❌ Vacío
  areaTotal: 0  // ❌ Cero
}
```

**Diagnóstico realizado:**

1. **Verificación en logs del servidor:**
```bash
# Log 1: Partidas recibidas del frontend
"medidas":[{"ancho":2,"alto":2,"area":4}]  # ✅ Frontend envía correctamente

# Log 2: Partidas después de normalizar
"piezas":[]  # ❌ Backend pierde las medidas

# Log 3: Registro de medidas construido
"medidas":[]  # ❌ Ya no hay medidas para guardar
```

2. **Análisis del código:**
   - Frontend envía: `partida.medidas[]`
   - Backend busca: `partida.piezas[]`
   - Resultado: Array vacío porque no coinciden los nombres

**Soluciones aplicadas:**

1. **Fix en `normalizarPartidas` (proyectoController.js:194):**
```javascript
// Antes (incorrecto)
const piezas = (partida.piezas || []).map(pieza => {

// Después (correcto)
const piezasArray = partida.piezas || partida.medidas || [];
const piezas = piezasArray.map(pieza => {
```

2. **Fix en `construirRegistroMedidas` (proyectoController.js:362):**
```javascript
// Agregar cálculo de área
area: roundNumber((medida.ancho || 0) * (medida.alto || 0))
```

3. **Fix en modelo `Proyecto.js`:**
```javascript
// Agregar campo al esquema
medidas: {
  type: [mongoose.Schema.Types.Mixed],
  default: []
}
```

**Resultado:**
```javascript
// Después de los fixes
{
  ubicacion: "Recámara Principal",
  medidas: [{ancho: 2, alto: 2, area: 4}],  // ✅ Correcto
  areaTotal: 4  // ✅ Correcto
}
```

**Lecciones aprendidas:**
- Siempre verificar nombres de campos entre frontend y backend
- Usar logs estructurados para debugging
- Validar que el esquema de Mongoose incluya todos los campos necesarios
- Reiniciar el servidor después de cambios en el modelo

---

### Caso 1: Levantamiento Simple

**Escenario:**
- 1 ubicación (Recámara Principal)
- 2 piezas (2.5×1.8m y 3.0×2.0m)
- Producto: Blackout

**Datos esperados:**
```javascript
{
  nombreLevantamiento: "Depto 2000 Porto Bello",
  personaVisita: "David Rojas",
  quienRecibe: "Héctor Huerta",
  piezas: [{
    ubicacion: "Recámara Principal",
    producto: "blackout",
    cantidad: 2,
    areaTotal: 10.5,  // 4.5 + 6.0
    medidas: [
      { ancho: 2.5, alto: 1.8, area: 4.5 },
      { ancho: 3.0, alto: 2.0, area: 6.0 }
    ]
  }]
}
```

**Resultado esperado:**
```
📋 Depto 2000 Porto Bello
  Persona que visitó: David Rojas
  Quien recibe: Héctor Huerta

📍 Recámara Principal - blackout
  2 piezas • 10.50 m²
```

---

### Caso 2: Levantamiento Múltiple

**Escenario:**
- 4 ubicaciones diferentes
- Productos mixtos (Blackout, Screen 5%)
- Total: 8 piezas

**Datos esperados:**
```javascript
{
  nombreLevantamiento: "Casa Completa - Fracc. Las Brisas",
  piezas: [
    { ubicacion: "Rec Princ", producto: "blackout", cantidad: 2, areaTotal: 10.5 },
    { ubicacion: "Rec 2", producto: "blackout", cantidad: 1, areaTotal: 4.5 },
    { ubicacion: "Rec 3", producto: "blackout", cantidad: 1, areaTotal: 4.5 },
    { ubicacion: "Sala Comedor", producto: "screen_5", cantidad: 2, areaTotal: 12.0 }
  ],
  totales: {
    totalPartidas: 4,
    totalPiezas: 6,
    areaTotal: 31.5
  }
}
```

**Resultado esperado:**
```
KPIs:
  Partidas: 4
  Área Total: 31.50 m²
  Total de Piezas: 6

Levantamiento:
  📍 Rec Princ - blackout (2 piezas • 10.50 m²)
  📍 Rec 2 - blackout (1 pieza • 4.50 m²)
  📍 Rec 3 - blackout (1 pieza • 4.50 m²)
  📍 Sala Comedor - screen_5 (2 piezas • 12.00 m²)
```

---

### Caso 3: Con Check-in GPS

**Escenario:**
- Técnico llega al sitio
- Hace check-in antes de medir
- Captura geolocalización

**Flujo:**
1. Abrir modal de levantamiento
2. Click en "📍 Hacer Check-in"
3. Navegador pide permiso de ubicación
4. Usuario acepta
5. Sistema captura GPS: `[-99.8901, 16.8531]`
6. Botón cambia a "✓ Check-in Realizado"
7. Continuar con levantamiento

**Datos guardados:**
```javascript
{
  checkIn: {
    proyectoId: "...",
    ubicacion: {
      type: "Point",
      coordinates: [-99.8901, 16.8531]
    },
    timestamp: "2025-11-07T16:21:00.000Z"
  }
}
```

---

## 🚨 ERRORES CRÍTICOS Y SOLUCIONES

### Error: "Cannot read properties of undefined"

**Mensaje completo:**
```
TypeError: Cannot read properties of undefined (reading 'filter')
    at eliminarMedida (LevantamientoTab.jsx:133)
```

**Causa:** `proyecto.medidas` es `undefined`

**Solución inmediata:**
```javascript
// Agregar validación
if (!proyecto.medidas || !Array.isArray(proyecto.medidas)) {
  alert('No hay medidas para eliminar');
  return;
}
```

**Solución permanente:**
Inicializar `medidas` como array vacío en el modelo:
```javascript
// Proyecto.js
medidas: {
  type: [Schema.Types.Mixed],
  default: []  // ✅ Siempre será un array
}
```

---

### Error: "Request failed with status code 500"

**Mensaje completo:**
```
GET /api/proyectos/:id/estadisticas 500 (Internal Server Error)
```

**Causa:** Backend intenta acceder a propiedades undefined

**Solución:**
Agregar validaciones en todas las operaciones con arrays:
```javascript
// ✅ SIEMPRE validar antes de usar
total_medidas: Array.isArray(proyecto.medidas) ? proyecto.medidas.length : 0,
total: Array.isArray(proyecto.cotizaciones) ? proyecto.cotizaciones.length : 0,
```

---

## 📞 CONTACTO Y SOPORTE

### Documentación Relacionada

- `docs/MIGRACION_MEDIDAS_A_LEVANTAMIENTO.md` - Migración de sistema antiguo
- `docs/fase3_consolidacion.md` - Consolidación de modelos
- `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md` - Requisitos funcionales

### Comandos de Verificación Rápida

```bash
# Verificar que el servidor está corriendo
curl http://localhost:5001/api/health

# Verificar endpoint de levantamientos
curl -X GET http://localhost:5001/api/proyectos/:id

# Ver logs en tiempo real
tail -f logs/combined.log | grep levantamiento
```

### Checklist de Salud del Sistema

```bash
# 1. Frontend compilando sin errores
npm run build

# 2. Backend sin errores
npm test

# 3. Base de datos conectada
mongo --eval "db.proyectos.count()"

# 4. Todos los endpoints respondiendo
npm run test:endpoints
```

---

## 📝 NOTAS FINALES

### Mejores Prácticas

1. **Siempre validar arrays antes de usar `.length` o `.filter()`**
2. **Calcular áreas en el frontend antes de enviar al backend**
3. **Usar logs estructurados para debugging**
4. **Mantener sincronizados frontend y backend**
5. **Probar eliminación y edición después de cada cambio**

### Cambios Recientes (Nov 2025)

**7 Nov 2025 - 17:30 hrs:**
- ✅ **FIX CRÍTICO:** Resuelto problema de medidas vacías
  - Backend ahora acepta tanto `partida.piezas[]` como `partida.medidas[]`
  - Agregado campo `medidas` al esquema de Mongoose
  - Agregado cálculo de área en `construirRegistroMedidas`
  - Logs estructurados para debugging mejorado

**7 Nov 2025 - 16:00 hrs:**
- ✅ Agregado campo `nombreLevantamiento`
- ✅ Agregado campo `quienRecibe`
- ✅ Cálculo automático de áreas (ancho × alto)
- ✅ Check-in con geolocalización GPS
- ✅ Validaciones robustas en frontend y backend
- ✅ Eliminación con recarga automática
- ✅ Logs estructurados para debugging

**Archivos modificados:**
- `server/controllers/proyectoController.js` (líneas 194, 362, 1488-1500)
- `server/models/Proyecto.js` (líneas 288-292)
- `client/src/modules/proyectos/components/LevantamientoTab.jsx` (líneas 353-362)

---

**Documento creado:** 7 Nov 2025  
**Última actualización:** 7 Nov 2025 17:30 hrs  
**Autor:** Sistema Sundeck CRM  
**Versión:** 1.1
