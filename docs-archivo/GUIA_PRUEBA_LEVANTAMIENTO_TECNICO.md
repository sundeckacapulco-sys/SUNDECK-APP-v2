# 🧪 Guía de Prueba - Levantamiento Técnico Completo

## 📋 Información de la Prueba

**Fecha:** 28 de octubre de 2025
**Funcionalidad:** Formulario de levantamiento técnico con especificaciones completas
**Estado:** Listo para prueba

---

## ✅ Pre-requisitos

1. **Servidor backend corriendo** en puerto 5001
2. **Servidor frontend corriendo** en puerto 3000
3. **MongoDB conectado** y accesible
4. **Usuario autenticado** en el sistema
5. **Proyecto existente** en estado "levantamiento"

---

## 🎯 Caso de Prueba 1: Levantamiento Completo con 1 Partida de 3 Piezas

### Paso 1: Abrir Proyecto
```
1. Ir a /proyectos
2. Seleccionar un proyecto en estado "levantamiento"
3. Ir al tab "Levantamiento"
4. Clic en botón "Agregar Partidas" (azul)
```

### Paso 2: Información General
```
Persona que realizó visita: Juan Pérez
Fecha de cotización: [Dejar vacío o poner fecha futura]
Quien recibe: María González
```

### Paso 3: Agregar Partida
```
Clic en "Agregar Partida" (botón dorado)
```

### Paso 4: Datos de la Partida
```
Ubicación: Sala-Comedor
Cantidad de piezas: 3
Producto: Persianas Screen 3%
Modelo/Código: SCR-3000
Color/Acabado: Blanco
```

### Paso 5: Pieza 1 - Medidas y Especificaciones
```
📏 MEDIDAS:
- Ancho: 2.50 m
- Alto: 3.00 m

🔧 ESPECIFICACIONES TÉCNICAS:
- Galería/Cabezal: Cassette
- Tipo de Control: Izquierda
- Caída: Caída Normal
- Tipo de Instalación: Techo
- Tipo de Fijación: Concreto
- Modo de Operación: Motorizado
- Detalle Técnico: Traslape
- Sistema: Enrollable
- Tela/Marca: Screen 3% Premium
- Base Tabla: 15
- Observaciones técnicas: Toma de corriente a 1.5m del punto de instalación
```

### Paso 6: Pieza 2 - Copiar Especificaciones
```
1. Clic en "📋 Copiar de pieza 1"
2. Verificar que se copiaron TODOS los campos técnicos
3. Cambiar solo las medidas:
   - Ancho: 2.80 m
   - Alto: 2.50 m
4. Observaciones técnicas: Sin obstáculos
```

### Paso 7: Pieza 3 - Copiar Especificaciones
```
1. Clic en "📋 Copiar de pieza 2"
2. Verificar que se copiaron TODOS los campos técnicos
3. Cambiar solo las medidas:
   - Ancho: 3.00 m
   - Alto: 2.80 m
4. Observaciones técnicas: Verificar altura de cortinero
```

### Paso 8: Observaciones de la Partida
```
Observaciones: Cliente solicita instalación en horario matutino (8-10am)
```

### Paso 9: Agregar Partida
```
Clic en "Agregar Partida" (botón verde)
```

### Paso 10: Observaciones Generales
```
Observaciones Generales del Levantamiento: 
Visita realizada el 28/10/2025. Cliente muy interesado. 
Requiere cotización formal para el viernes.
```

### Paso 11: Guardar Levantamiento
```
Clic en "Guardar Levantamiento" (botón dorado)
```

---

## 🔍 Validaciones a Realizar

### A. Validación en Consola del Navegador (F12)

Buscar estos logs en orden:

```javascript
// 1. Al hacer clic en "Agregar Partida"
🔍 DEBUG - Intentando agregar partida
🔍 DEBUG - piezaForm completo: {...}
🔍 DEBUG - ubicacion: "Sala-Comedor"
🔍 DEBUG - cantidad: 3
🔍 DEBUG - medidas: [{...}, {...}, {...}]

// 2. Al hacer clic en "Guardar Levantamiento"
🔍 Guardando levantamiento con partidas: {...}
📦 Piezas del manager: [...]
📊 Detalle de primera pieza: {...}
📏 Detalle de primera medida de primera pieza: {...}
```

**Verificar en el último log que contenga:**
```javascript
{
  ancho: 2.5,
  alto: 3.0,
  producto: "screen_3",
  productoLabel: "Persianas Screen 3%",
  modeloCodigo: "SCR-3000",
  color: "Blanco",
  galeria: "cassette",              // ✅ CRÍTICO
  tipoControl: "izquierda",         // ✅ CRÍTICO
  caida: "normal",                  // ✅ CRÍTICO
  tipoInstalacion: "techo",         // ✅ CRÍTICO
  tipoFijacion: "concreto",         // ✅ CRÍTICO
  modoOperacion: "motorizado",      // ✅ CRÍTICO
  detalleTecnico: "traslape",       // ✅ CRÍTICO
  sistema: "Enrollable",            // ✅ CRÍTICO
  telaMarca: "Screen 3% Premium",   // ✅ CRÍTICO
  baseTabla: "15",                  // ✅ CRÍTICO
  observacionesTecnicas: "Toma de corriente a 1.5m del punto de instalación" // ✅ CRÍTICO
}
```

### B. Validación en Terminal del Servidor

Buscar estos logs:

```bash
🔍 [BACKEND] Actualizando proyecto: [ID del proyecto]
📦 [BACKEND] Actualizaciones recibidas: {...}
📏 [BACKEND] Medidas recibidas: 1
📊 [BACKEND] Primera medida: {...}
✅ [BACKEND] Proyecto guardado exitosamente
📏 [BACKEND] Medidas guardadas: 1
📊 [BACKEND] Primera medida guardada: {...}
```

**Verificar en el log "Primera medida guardada" que contenga:**
```json
{
  "tipo": "levantamiento",
  "personaVisita": "Juan Pérez",
  "quienRecibe": "María González",
  "piezas": [{
    "ubicacion": "Sala-Comedor",
    "cantidad": 3,
    "producto": "screen_3",
    "productoLabel": "Persianas Screen 3%",
    "modeloCodigo": "SCR-3000",
    "color": "Blanco",
    "medidas": [
      {
        "ancho": 2.5,
        "alto": 3.0,
        "galeria": "cassette",
        "tipoControl": "izquierda",
        "caida": "normal",
        "tipoInstalacion": "techo",
        "tipoFijacion": "concreto",
        "modoOperacion": "motorizado",
        "detalleTecnico": "traslape",
        "sistema": "Enrollable",
        "telaMarca": "Screen 3% Premium",
        "baseTabla": "15",
        "observacionesTecnicas": "Toma de corriente a 1.5m del punto de instalación"
      },
      // ... pieza 2 y 3
    ]
  }]
}
```

### C. Validación en MongoDB

Conectar a MongoDB y ejecutar:

```javascript
// Reemplazar [ID_PROYECTO] con el ID real
db.proyectos.findOne(
  { _id: ObjectId("[ID_PROYECTO]") },
  { 
    "medidas": 1,
    "_id": 0
  }
).medidas[0].piezas[0].medidas[0]
```

**Resultado esperado:**
```json
{
  "ancho": 2.5,
  "alto": 3,
  "producto": "screen_3",
  "productoLabel": "Persianas Screen 3%",
  "modeloCodigo": "SCR-3000",
  "color": "Blanco",
  "galeria": "cassette",
  "tipoControl": "izquierda",
  "caida": "normal",
  "tipoInstalacion": "techo",
  "tipoFijacion": "concreto",
  "modoOperacion": "motorizado",
  "detalleTecnico": "traslape",
  "sistema": "Enrollable",
  "telaMarca": "Screen 3% Premium",
  "baseTabla": "15",
  "observacionesTecnicas": "Toma de corriente a 1.5m del punto de instalación"
}
```

### D. Validación Visual en la Interfaz

1. **Refrescar la página** (F5)
2. **Ir al tab "Levantamiento"**
3. **Expandir el levantamiento recién creado**
4. **Expandir la partida "Sala-Comedor"**

**Verificar que aparezca:**

```
📋 Levantamiento 1
├── Persona que visitó: Juan Pérez
├── Quien recibe: María González
└── Total: 1 partidas, 3 piezas, 21.50 m²

📍 Sala-Comedor
├── Persianas Screen 3%
└── 3 piezas • 21.50 m²

📐 Especificaciones
├── Cantidad: 3 piezas
├── Área total: 21.50 m²
├── Color: Blanco
└── Modelo/Código: SCR-3000

📏 Medidas Individuales
├── Pieza 1: 2.5 × 3.0 m
│   ├── Producto: Persianas Screen 3%
│   └── Color: Blanco
├── Pieza 2: 2.8 × 2.5 m
│   ├── Producto: Persianas Screen 3%
│   └── Color: Blanco
└── Pieza 3: 3.0 × 2.8 m
    ├── Producto: Persianas Screen 3%
    └── Color: Blanco

🔧 Especificaciones Técnicas
├── Galería/Cabezal: Cassette
├── Tipo de Control: izquierda
├── Caída: Caída Normal
├── Tipo de Instalación: techo
├── Tipo de Fijación: concreto
├── Modo de Operación: Motorizado
├── Detalle Técnico: Traslape
├── Sistema: Enrollable
├── Tela/Marca: Screen 3% Premium
├── Base Tabla: 15
└── Observaciones Técnicas: Toma de corriente a 1.5m del punto de instalación
```

---

## 🎯 Caso de Prueba 2: Botón "Copiar de pieza anterior"

### Objetivo
Verificar que el botón copia TODOS los campos técnicos excepto ancho y alto.

### Procedimiento
1. Llenar completamente la Pieza 1 con todos los campos técnicos
2. En Pieza 2, hacer clic en "📋 Copiar de pieza 1"
3. **Verificar que se copiaron:**
   - ✅ Galería/Cabezal
   - ✅ Tipo de Control
   - ✅ Caída
   - ✅ Tipo de Instalación
   - ✅ Tipo de Fijación
   - ✅ Modo de Operación
   - ✅ Detalle Técnico
   - ✅ Sistema
   - ✅ Tela/Marca
   - ✅ Base Tabla
4. **Verificar que NO se copiaron:**
   - ❌ Ancho (debe quedar vacío o con valor anterior)
   - ❌ Alto (debe quedar vacío o con valor anterior)

---

## 🎯 Caso de Prueba 3: Sugerencias Inteligentes

### Escenario 1: Medida Grande
```
Ancho: 4.0 m
Alto: 3.5 m
Resultado esperado: ⚠️ Medida grande detectada. Considera refuerzo estructural o sistema motorizado.
```

### Escenario 2: Motorizado
```
Modo de Operación: Motorizado
Resultado esperado: 💡 Sistema motorizado: Verifica disponibilidad de toma de corriente cercana.
```

### Escenario 3: Techo + Tablaroca
```
Tipo de Instalación: Techo
Tipo de Fijación: Tablaroca
Resultado esperado: ⚠️ Instalación en techo con tablaroca: Requiere refuerzo adicional.
```

### Escenario 4: Caída hacia el Frente
```
Caída: Caída hacia el Frente
Resultado esperado: ⬇️ Caída hacia el frente: Verificar espacio libre y mecanismo de soporte.
```

### Escenario 5: Traslape Múltiple
```
Detalle Técnico: Traslape
Cantidad de piezas: 3
Resultado esperado: 📏 Traslape en múltiples piezas: Verificar alineación visual.
```

---

## 🐛 Problemas Conocidos a Verificar

### Problema 1: Campos técnicos no se guardan
**Síntoma:** Después de guardar, los campos técnicos aparecen vacíos
**Verificar:** Logs del payload en consola del navegador
**Solución esperada:** Payload debe incluir todos los campos anidados

### Problema 2: Botón "Copiar" no funciona correctamente
**Síntoma:** Al copiar, algunos campos técnicos no se copian
**Verificar:** Líneas 662-692 de AgregarMedidaPartidasModal.jsx
**Solución esperada:** Todos los campos técnicos deben copiarse

### Problema 3: Visualización incompleta
**Síntoma:** Especificaciones técnicas no aparecen en LevantamientoTab
**Verificar:** Condición de renderizado en línea 390 de LevantamientoTab.jsx
**Solución esperada:** Sección "🔧 Especificaciones Técnicas" debe aparecer

---

## ✅ Checklist de Validación

### Frontend
- [ ] Formulario se abre correctamente
- [ ] Todos los campos técnicos son visibles
- [ ] Campos se pueden llenar sin errores
- [ ] Botón "Copiar de pieza anterior" funciona
- [ ] Sugerencias inteligentes aparecen según condiciones
- [ ] Logs en consola muestran datos completos
- [ ] Modal se cierra después de guardar

### Backend
- [ ] Logs muestran recepción de datos
- [ ] Estructura de datos es correcta
- [ ] Todos los campos técnicos están presentes
- [ ] Proyecto se actualiza correctamente
- [ ] No hay errores en terminal

### Base de Datos
- [ ] Documento se guarda en MongoDB
- [ ] Estructura anidada es correcta: `medidas[].piezas[].medidas[]`
- [ ] Todos los campos técnicos están presentes
- [ ] Valores son correctos (no null, no undefined)

### Visualización
- [ ] Levantamiento aparece en la lista
- [ ] Información general se muestra correctamente
- [ ] Partidas se expanden correctamente
- [ ] Especificaciones técnicas son visibles
- [ ] Todos los campos técnicos se muestran con valores
- [ ] Formato es legible y profesional

---

## 📊 Resultados Esperados

### ✅ Éxito Total
- Todos los campos se guardan correctamente
- Visualización completa y correcta
- Botón "Copiar" funciona perfectamente
- Sugerencias inteligentes aparecen
- Sin errores en consola o terminal

### ⚠️ Éxito Parcial
- Algunos campos no se guardan
- Visualización incompleta
- Botón "Copiar" funciona parcialmente
- Necesita ajustes menores

### ❌ Fallo
- Campos técnicos no se guardan
- Errores en consola o terminal
- Visualización no funciona
- Requiere correcciones mayores

---

## 📝 Notas de la Prueba

**Fecha de prueba:** _______________
**Probado por:** _______________
**Resultado:** ☐ Éxito Total  ☐ Éxito Parcial  ☐ Fallo

**Campos que NO se guardaron (si aplica):**
- [ ] galeria
- [ ] tipoControl
- [ ] caida
- [ ] tipoInstalacion
- [ ] tipoFijacion
- [ ] modoOperacion
- [ ] detalleTecnico
- [ ] sistema
- [ ] telaMarca
- [ ] baseTabla
- [ ] observacionesTecnicas

**Observaciones adicionales:**
_______________________________________________
_______________________________________________
_______________________________________________

**Capturas de pantalla adjuntas:**
- [ ] Consola del navegador con logs
- [ ] Terminal del servidor con logs
- [ ] Visualización en LevantamientoTab
- [ ] Documento en MongoDB

---

## 🚀 Próximos Pasos

### Si la prueba es exitosa:
1. Crear memoria de la funcionalidad
2. Documentar casos de uso
3. Marcar como completado en el plan

### Si la prueba falla:
1. Identificar campos específicos que fallan
2. Revisar logs para encontrar el problema
3. Corregir código según hallazgos
4. Repetir prueba

---

**Fin de la Guía de Prueba**
