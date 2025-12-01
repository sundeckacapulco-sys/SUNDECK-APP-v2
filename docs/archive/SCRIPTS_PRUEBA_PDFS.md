# 📋 SCRIPTS DE PRUEBA - PDFs DE FABRICACIÓN

**Fecha:** 14 Noviembre 2025  
**Propósito:** Scripts para probar y validar generación de PDFs  
**Ubicación:** `server/scripts/`

---

## 🎯 SCRIPTS DISPONIBLES

### 1. `probarAmbosPDFs.js` ⭐ PRINCIPAL

**Propósito:** Genera ambos PDFs (Lista de Pedido + Orden de Taller) para un proyecto específico.

**Uso:**
```bash
node server/scripts/probarAmbosPDFs.js
```

**Qué hace:**
1. Conecta a MongoDB
2. Busca proyecto "2025-ARQ-HECTOR-003"
3. Genera datos de orden de producción
4. Genera PDF de Lista de Pedido (proveedores)
5. Genera PDF de Orden de Taller (fabricación)
6. Guarda ambos en `temp/`
7. Muestra estadísticas y rutas

**Salida:**
```
📄 PROBANDO AMBOS PDFs
============================================================
✅ Proyecto: 2025-ARQ-HECTOR-003
   Cliente: Arq. Hector Huerta

📋 Obteniendo datos de la orden...
✅ Datos obtenidos:
   Piezas: 6
   Materiales: 15

============================================================
🔵 GENERANDO PDF 1: LISTA DE PEDIDO (Proveedores)
✅ PDF 1 GENERADO:
   📁 C:\...\temp\Lista-Pedido-2025-ARQ-HECTOR-003.pdf
   📊 Tamaño: 9.81 KB

============================================================
🟡 GENERANDO PDF 2: ORDEN DE TALLER (Fabricación)
✅ PDF 2 GENERADO:
   📁 C:\...\temp\Orden-Taller-2025-ARQ-HECTOR-003.pdf
   📊 Tamaño: 11.85 KB

🎉 AMBOS PDFs GENERADOS EXITOSAMENTE
```

**Archivos generados:**
- `temp/Lista-Pedido-2025-ARQ-HECTOR-003.pdf`
- `temp/Orden-Taller-2025-ARQ-HECTOR-003.pdf`

---

### 2. `debugConectores.js` 🔍 DEBUG

**Propósito:** Verificar cálculo de conectores y topes para piezas manuales.

**Uso:**
```bash
node server/scripts/debugConectores.js
```

**Qué hace:**
1. Obtiene datos de orden de producción
2. Muestra todas las piezas con su modo de operación
3. Muestra materiales consolidados
4. Identifica qué piezas generan conectores/topes
5. Muestra cantidades finales

**Salida:**
```
🔍 DEBUG: Verificando conectores y topes
============================================================

📋 PIEZAS DEL PROYECTO:

1. Sala
   Motorizado: SÍ
   Ancho: 3.28m | Alto: 2.56m

2. Sala
   Motorizado: SÍ
   Ancho: 3.38m | Alto: 2.56m

3. Rec Princ
   Motorizado: SÍ
   Ancho: 4.28m | Alto: 2.8m

4. Rec Princ
   Motorizado: NO
   Ancho: 1.32m | Alto: 2.8m

🔧 MATERIALES CONSOLIDADOS:

Conectores: 1 pza
Topes: 1 pza

📊 ANÁLISIS:
   Piezas manuales: 1
   Conectores esperados: 1
   Topes esperados: 1

   Piezas manuales:
    - Pieza 4: Rec Princ (1.32m × 2.8m)

✅ VALIDACIÓN:
   Conectores: ✅ CORRECTO
   Topes: ✅ CORRECTO

============================================================
✅ Debug completado
```

**Cuándo usar:**
- Verificar que conectores y topes se calculan correctamente
- Validar que solo piezas manuales generan estos accesorios
- Debugging de consolidación de materiales

---

### 3. `debugConsolidacion.js` 🔍 DEBUG

**Propósito:** Verificar consolidación de materiales y claves únicas.

**Uso:**
```bash
node server/scripts/debugConsolidacion.js
```

**Qué hace:**
1. Obtiene datos de orden de producción
2. Muestra materiales consolidados con sus claves
3. Identifica conectores y topes
4. Muestra cantidades en lista de pedido

**Salida:**
```
🔍 DEBUG: Consolidación de materiales
============================================================

📦 MATERIALES CONSOLIDADOS:

Conectores encontrados: 1
  - Conector de cadena: 1 pza
    Tipo: Accesorios
    Código: ACCESORIOS

Topes encontrados: 1
  - Tope de cadena: 1 pza
    Tipo: Accesorios
    Código: ACCESORIOS

📋 LISTA DE PEDIDO - ACCESORIOS:

Conectores: 1
  - Conector de cadena: 1 pza

Topes: 1
  - Tope de cadena: 1 pza

============================================================
✅ Debug completado
```

**Cuándo usar:**
- Verificar que materiales se consolidan correctamente
- Validar claves de consolidación
- Debugging de lista de pedido

---

### 4. `verificarRotadas.js` 🔍 VALIDACIÓN

**Propósito:** Verificar que el flag `rotada` se guarda y calcula correctamente.

**Uso:**
```bash
node server/scripts/verificarRotadas.js
```

**Qué hace:**
1. Busca proyecto específico
2. Verifica campo `rotada` en levantamiento
3. Muestra cálculo de tela (ancho vs alto)
4. Valida fórmulas aplicadas

**Salida:**
```
🔍 Verificando telas rotadas en proyecto

Proyecto: 2025-ARQ-HECTOR-003
Cliente: Arq. Hector Huerta

📋 LEVANTAMIENTO:

Partida: Sala
  Pieza 1:
    Ancho: 3.28m | Alto: 2.56m
    Rotada: ✅ SÍ
    Cálculo: ancho + 0.03 = 3.31m

  Pieza 2:
    Ancho: 3.38m | Alto: 2.56m
    Rotada: ❌ NO
    Cálculo: alto + 0.25 = 2.81m

✅ Verificación completada
```

**Cuándo usar:**
- Validar que telas rotadas usan fórmula correcta
- Verificar persistencia del flag `rotada`
- Testing de cálculos de tela

---

## 🛠️ COMANDOS ÚTILES

### Ver logs específicos

**Logs de anchos de tela:**
```bash
node server/scripts/probarAmbosPDFs.js 2>&1 | Select-String -Pattern "Calculando ancho"
```

**Logs de conectores/topes:**
```bash
node server/scripts/probarAmbosPDFs.js 2>&1 | Select-String -Pattern "accesorio manual"
```

**Logs de consolidación:**
```bash
node server/scripts/probarAmbosPDFs.js 2>&1 | Select-String -Pattern "Lista de pedido generada"
```

### Regenerar PDFs rápidamente

```bash
# Generar ambos PDFs
node server/scripts/probarAmbosPDFs.js

# Abrir PDFs generados
start temp\Lista-Pedido-2025-ARQ-HECTOR-003.pdf
start temp\Orden-Taller-2025-ARQ-HECTOR-003.pdf
```

### Limpiar PDFs antiguos

```bash
# Windows PowerShell
Remove-Item temp\*.pdf

# Verificar
ls temp\*.pdf
```

---

## 📊 PROYECTO DE PRUEBA

**Proyecto usado:** `2025-ARQ-HECTOR-003`  
**Cliente:** Arq. Hector Huerta  
**ID:** `690e69251346d61cfcd5178d`

**Características:**
- 6 piezas (5 motorizadas, 1 manual)
- 2 tipos de tela (Screen 5, Blackout)
- 3 ubicaciones (Sala, Rec Princ, Rec 2)
- Incluye tela rotada
- Incluye galería

**Por qué este proyecto:**
- Tiene variedad de configuraciones
- Incluye casos edge (rotada, manual, motorizada)
- Datos completos y validados
- Usado en desarrollo y testing

---

## 🔄 FLUJO DE TESTING RECOMENDADO

### 1. Desarrollo de nueva feature

```bash
# 1. Modificar código
# 2. Regenerar PDFs
node server/scripts/probarAmbosPDFs.js

# 3. Verificar salida
start temp\Orden-Taller-2025-ARQ-HECTOR-003.pdf

# 4. Si hay problemas, usar debug
node server/scripts/debugConectores.js
node server/scripts/debugConsolidacion.js
```

### 2. Validación de bug fix

```bash
# 1. Reproducir bug
node server/scripts/probarAmbosPDFs.js

# 2. Aplicar fix
# 3. Regenerar y comparar
node server/scripts/probarAmbosPDFs.js

# 4. Validar con debug
node server/scripts/debugConectores.js
```

### 3. Testing de regresión

```bash
# Ejecutar todos los scripts
node server/scripts/probarAmbosPDFs.js
node server/scripts/debugConectores.js
node server/scripts/debugConsolidacion.js
node server/scripts/verificarRotadas.js

# Verificar que todo funciona correctamente
```

---

## 📝 NOTAS IMPORTANTES

### Logs de debug removidos

Los siguientes logs fueron removidos del código de producción (14 Nov 2025):
- ❌ Logs de conectores/topes en consolidación
- ❌ Logs de cálculo de anchos de tela

**Razón:** Logs temporales solo para debugging, no necesarios en producción.

**Alternativa:** Usar scripts de debug cuando se necesite troubleshooting.

### Scripts a mantener

✅ **MANTENER ESTOS SCRIPTS:**
- `probarAmbosPDFs.js` - Testing principal
- `debugConectores.js` - Debug de accesorios
- `debugConsolidacion.js` - Debug de consolidación
- `verificarRotadas.js` - Validación de rotación

**Razón:** Útiles para desarrollo, testing y debugging futuro.

### Ubicación de PDFs generados

**Directorio:** `temp/`  
**Formato:** `{Tipo}-{Numero}.pdf`  
**Ejemplos:**
- `Lista-Pedido-2025-ARQ-HECTOR-003.pdf`
- `Orden-Taller-2025-ARQ-HECTOR-003.pdf`

**Nota:** Los PDFs en `temp/` son temporales y pueden eliminarse.

---

## 🎯 PRÓXIMOS PASOS

### Scripts pendientes de crear

1. **`probarProyectoSheer.js`**
   - Probar con proyecto Sheer Elegance
   - Validar fórmulas específicas
   - Verificar que tela NO se puede rotar

2. **`compararPDFs.js`**
   - Comparar PDFs antes/después de cambios
   - Detectar diferencias automáticamente
   - Útil para testing de regresión

3. **`validarTodosMateriales.js`**
   - Verificar que todos los materiales se calculan
   - Validar fórmulas de cada tipo
   - Detectar materiales faltantes

---

## 📚 REFERENCIAS

**Documentación relacionada:**
- `docs/auditorias/AUDITORIA_SESION_14_NOV_2025.md` - Auditoría completa
- `docs/ORDEN_PRODUCCION_IMPLEMENTACION.md` - Implementación de PDFs
- `docs/CALCULADORA_MATERIALES.md` - Sistema de cálculo

**Código relacionado:**
- `server/services/ordenProduccionService.js` - Lógica de orden
- `server/services/pdfOrdenFabricacionService.js` - Generación de PDF
- `server/services/optimizadorCortesService.js` - Cálculo de materiales

---

**Última actualización:** 14 Noviembre 2025, 7:25 PM  
**Mantenido por:** Equipo de Desarrollo Sundeck
