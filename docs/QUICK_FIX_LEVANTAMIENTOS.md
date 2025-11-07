# 🚀 QUICK FIX - Levantamientos

**Última actualización:** 7 Nov 2025 17:30 hrs

---

## ❌ PROBLEMA: Medidas no se guardan (areaTotal = 0)

### Síntomas
```javascript
// Frontend muestra correctamente
areaTotal: 4.00 m²
medidas: [{ancho: 2, alto: 2}]

// Después de guardar
areaTotal: 0.00 m²  // ❌
medidas: []         // ❌
```

---

## ✅ SOLUCIÓN RÁPIDA

### 1. Backend - Aceptar ambos formatos

**Archivo:** `server/controllers/proyectoController.js`  
**Línea:** 194

```javascript
// ❌ ANTES
const piezas = (partida.piezas || []).map(pieza => {

// ✅ DESPUÉS
const piezasArray = partida.piezas || partida.medidas || [];
const piezas = piezasArray.map(pieza => {
```

### 2. Backend - Calcular área

**Archivo:** `server/controllers/proyectoController.js`  
**Línea:** 362

```javascript
medidas: (partida.piezas || []).map(medida => ({
  ancho: medida.ancho,
  alto: medida.alto,
  area: roundNumber((medida.ancho || 0) * (medida.alto || 0)),  // ✅ AGREGAR
  // ... resto de campos
}))
```

### 3. Modelo - Agregar campo

**Archivo:** `server/models/Proyecto.js`  
**Después de:** campo `levantamiento`

```javascript
// Array de medidas/levantamientos para visualización (CRÍTICO)
medidas: {
  type: [mongoose.Schema.Types.Mixed],
  default: []
},
```

### 4. Reiniciar servidor

```bash
Ctrl + C
npm start
```

---

## 🔍 VERIFICACIÓN

### Logs del servidor
Después de guardar un levantamiento, debes ver:

```bash
[info]: Partidas recibidas del frontend
  "medidas":[{"ancho":2,"alto":2,"area":4}]  # ✅

[info]: Partidas después de normalizar
  "piezas":[{"ancho":2,"alto":2,"m2":4}]     # ✅

[info]: Registro de medidas construido
  "medidas":[{"ancho":2,"alto":2,"area":4}]  # ✅
```

### Frontend
```javascript
// Console del navegador
🔍 Levantamientos encontrados: 1
  areaTotal de primera pieza: 4  // ✅ Ya no es 0
  medidas de primera pieza: [{ancho: 2, alto: 2, area: 4}]  // ✅ Ya no está vacío
```

---

## 🚨 SI SIGUE SIN FUNCIONAR

### Checklist
- [ ] ¿Reiniciaste el servidor después de los cambios?
- [ ] ¿El campo `medidas` está en el esquema de Mongoose?
- [ ] ¿Los logs muestran que las partidas se reciben correctamente?
- [ ] ¿Las partidas después de normalizar tienen `piezas[]` con datos?

### Comandos de diagnóstico
```bash
# Ver logs en tiempo real
tail -f logs/combined.log | grep "Partidas"

# Verificar que el servidor cargó el nuevo esquema
grep "medidas:" server/models/Proyecto.js

# Verificar que el fix está aplicado
grep "piezasArray" server/controllers/proyectoController.js
```

---

## 📞 CONTACTO

Si el problema persiste:
1. Comparte los logs del servidor (busca "Partidas recibidas" y "Partidas después de normalizar")
2. Comparte los logs del navegador (busca "🔍 Levantamientos encontrados")
3. Verifica que los 3 cambios estén aplicados

---

**Documento creado:** 7 Nov 2025 17:30 hrs  
**Autor:** Sistema Sundeck CRM
