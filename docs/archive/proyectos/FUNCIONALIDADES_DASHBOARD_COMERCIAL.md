# 📋 FUNCIONALIDADES DEL DASHBOARD COMERCIAL

**Fecha:** 7 Noviembre 2025  
**Responsable:** David Rojas  
**Estado:** ✅ IMPLEMENTADO

---

## 🎯 RESPUESTAS A TUS PREGUNTAS

### 1. ¿Cómo asigno un asesor?

**Opción 1: Desde el menú contextual (⋮)**
1. Click en el icono de 3 puntos (⋮) del registro
2. Seleccionar "Asignar Asesor"
3. Elegir el asesor del dropdown
4. Click en "Asignar"

**Opción 2: Desde editar**
1. Click en el icono de editar (✏️)
2. Modificar el campo "Asesor Comercial"
3. Guardar cambios

### 2. ¿Cómo los pongo como perdidos?

**Opción 1: Desde el menú contextual (⋮)**
1. Click en el icono de 3 puntos (⋮)
2. Seleccionar "Marcar como Perdido" (❌)
3. Confirmar la acción

**Opción 2: Cambiar estado manualmente**
1. Click en el icono de 3 puntos (⋮)
2. Seleccionar "Cambiar Estado"
3. Elegir "❌ Perdido"
4. Click en "Actualizar"

### 3. ¿Qué función tiene el tipo (Prospecto/Proyecto)?

**🔵 PROSPECTO:**
- Es un **cliente potencial** que aún no ha confirmado el proyecto
- Estados típicos: Nuevo, Contactado, Cita Agendada, Cotizado
- **Puede convertirse a Proyecto** cuando el cliente confirma
- No tiene fabricación ni instalación activa

**🟢 PROYECTO:**
- Es un **proyecto confirmado** con cliente comprometido
- Estados típicos: Activo, En Fabricación, En Instalación, Completado
- Ya no puede "desconvertirse" a prospecto
- Tiene seguimiento completo de fabricación e instalación

**Flujo normal:**
```
🔵 Prospecto → [Cliente confirma] → 🟢 Proyecto
```

---

## 🎨 NUEVAS FUNCIONALIDADES IMPLEMENTADAS

### 1. **Asignar Asesor Comercial** ✅

**Ubicación:** Menú contextual (⋮) → "Asignar Asesor"

**Función:**
- Asigna un asesor comercial al registro
- Actualiza el campo `asesorComercial`
- Permite filtrar por asesor en el dashboard

**Asesores disponibles:**
- Abigail
- Carlos
- Diana
- Sin asignar

### 2. **Cambiar Estado Comercial** ✅

**Ubicación:** Menú contextual (⋮) → "Cambiar Estado"

**Estados disponibles:**

**Para Prospectos:**
- 🆕 Nuevo - Prospecto recién creado
- 📞 Contactado - Ya se contactó al cliente
- 📅 Cita Agendada - Cita programada
- 💰 Cotizado - Cotización enviada
- ⏸️ Pausado - En espera
- ❌ Perdido - Cliente no interesado

**Para Proyectos:**
- ✅ Activo - Proyecto confirmado
- 🏗️ En Fabricación - Producción en proceso
- 🚚 En Instalación - Instalación en curso
- ✔️ Completado - Proyecto terminado
- ⏸️ Pausado - Proyecto pausado

### 3. **Marcar como Perdido** ✅

**Ubicación:** Menú contextual (⋮) → "Marcar como Perdido"

**Función:**
- Cambia el estado a "perdido"
- Requiere confirmación
- Útil para cerrar prospectos que no prosperaron

### 4. **Convertir Prospecto a Proyecto** ✅

**Ubicación:** Menú contextual (⋮) → "Convertir a Proyecto" (solo prospectos)

**Función:**
- Cambia `tipo: "prospecto"` → `tipo: "proyecto"`
- Actualiza `estadoComercial: "activo"`
- Registra en historial de estados
- **Solo disponible para prospectos**

---

## 📊 DIFERENCIAS ENTRE PROSPECTO Y PROYECTO

| Característica | 🔵 Prospecto | 🟢 Proyecto |
|----------------|--------------|-------------|
| **Cliente** | Potencial | Confirmado |
| **Estados** | Nuevo, Contactado, Cotizado | Activo, Fabricación, Instalación |
| **Conversión** | Puede convertirse a Proyecto | No puede desconvertirse |
| **Fabricación** | No aplica | Sí aplica |
| **Instalación** | No aplica | Sí aplica |
| **Facturación** | No aplica | Sí aplica |
| **Objetivo** | Cerrar venta | Completar proyecto |

---

## 🔄 FLUJO DE TRABAJO COMPLETO

### Fase 1: Prospecto Nuevo
```
1. Crear prospecto (🔵 Nuevo)
2. Asignar asesor comercial
3. Contactar cliente (📞 Contactado)
4. Agendar cita (📅 Cita Agendada)
5. Enviar cotización (💰 Cotizado)
```

### Fase 2: Decisión del Cliente

**Opción A: Cliente acepta**
```
6. Convertir a Proyecto (🟢 Activo)
7. Iniciar fabricación (🏗️ En Fabricación)
8. Programar instalación (🚚 En Instalación)
9. Completar proyecto (✔️ Completado)
```

**Opción B: Cliente rechaza**
```
6. Marcar como Perdido (❌ Perdido)
```

**Opción C: Cliente pide tiempo**
```
6. Pausar prospecto (⏸️ Pausado)
7. Reactivar cuando cliente responda
```

---

## 🎯 CASOS DE USO

### Caso 1: Prospecto que no responde

**Problema:** Cliente no contesta llamadas ni mensajes

**Solución:**
1. Click en menú (⋮)
2. "Cambiar Estado" → "⏸️ Pausado"
3. Agregar nota: "Cliente no responde, reintentar en 1 semana"

### Caso 2: Cliente confirma proyecto

**Problema:** Cliente acepta cotización y quiere proceder

**Solución:**
1. Click en menú (⋮)
2. "Convertir a Proyecto"
3. Confirmar conversión
4. El registro ahora es 🟢 Proyecto con estado "✅ Activo"

### Caso 3: Cliente definitivamente no está interesado

**Problema:** Cliente dice que no le interesa

**Solución:**
1. Click en menú (⋮)
2. "Marcar como Perdido"
3. Confirmar
4. Estado cambia a "❌ Perdido"

### Caso 4: Asignar prospecto a otro asesor

**Problema:** Asesor A no puede atender, reasignar a Asesor B

**Solución:**
1. Click en menú (⋮)
2. "Asignar Asesor"
3. Seleccionar nuevo asesor
4. Click en "Asignar"

---

## 🔍 VISTA DETALLADA

### ¿Por qué al dar click en "Ver" es un proyecto?

**Explicación:**

La vista detallada (`ProyectoDetail.jsx`) muestra **TODA la información** del registro, sin importar si es prospecto o proyecto, porque:

1. **Modelo unificado:** Ambos usan el mismo modelo `Proyecto`
2. **Campos compartidos:** Cliente, asesor, estado, notas, etc.
3. **Información completa:** La vista muestra todos los datos disponibles

**Lo que cambia:**
- El **badge de tipo** (🔵 Prospecto o 🟢 Proyecto)
- Los **estados disponibles** según el tipo
- Las **acciones disponibles** (conversión solo para prospectos)

**Ejemplo:**
```
🔵 Prospecto "Juan Pérez"
  - Cliente: Juan Pérez
  - Teléfono: 662-123-4567
  - Estado: Cotizado
  - Asesor: Abigail
  - Monto estimado: $50,000
  - Notas: "Interesado en pergola 4x3"
  
[Convertir a Proyecto] ← Solo disponible para prospectos
```

Después de convertir:
```
🟢 Proyecto "Juan Pérez"
  - Cliente: Juan Pérez (mismo)
  - Teléfono: 662-123-4567 (mismo)
  - Estado: Activo (cambiado)
  - Asesor: Abigail (mismo)
  - Monto estimado: $50,000 (mismo)
  - Notas: "Interesado en pergola 4x3" (mismo)
  
[Iniciar Fabricación] ← Nuevas acciones disponibles
```

---

## 🎨 INTERFAZ ACTUALIZADA

### Menú Contextual (⋮)

```
┌─────────────────────────────┐
│ 👁️  Ver Detalles            │
│ ✏️  Editar                   │
│ 👤 Asignar Asesor           │
│ 🔄 Cambiar Estado           │
│ 📈 Convertir a Proyecto     │ ← Solo prospectos
│ ❌ Marcar como Perdido      │
└─────────────────────────────┘
```

### Diálogo de Asignación

```
┌─────────────────────────────┐
│ Asignar Asesor Comercial    │
├─────────────────────────────┤
│                             │
│ Asesor: [Dropdown ▼]       │
│   - Sin asignar             │
│   - Abigail                 │
│   - Carlos                  │
│   - Diana                   │
│                             │
├─────────────────────────────┤
│        [Cancelar] [Asignar] │
└─────────────────────────────┘
```

### Diálogo de Estado

```
┌─────────────────────────────┐
│ Cambiar Estado Comercial    │
├─────────────────────────────┤
│                             │
│ Estado: [Dropdown ▼]        │
│   - 🆕 Nuevo                │
│   - 📞 Contactado           │
│   - 📅 Cita Agendada        │
│   - 💰 Cotizado             │
│   - ✅ Activo               │
│   - ❌ Perdido              │
│   ...                       │
│                             │
├─────────────────────────────┤
│     [Cancelar] [Actualizar] │
└─────────────────────────────┘
```

---

## ✅ RESUMEN DE ACCIONES DISPONIBLES

| Acción | Prospecto | Proyecto | Ubicación |
|--------|-----------|----------|-----------|
| Ver Detalles | ✅ | ✅ | Menú (⋮) |
| Editar | ✅ | ✅ | Menú (⋮) |
| Asignar Asesor | ✅ | ✅ | Menú (⋮) |
| Cambiar Estado | ✅ | ✅ | Menú (⋮) |
| Convertir a Proyecto | ✅ | ❌ | Menú (⋮) |
| Marcar como Perdido | ✅ | ✅ | Menú (⋮) |

---

## 🚀 PRÓXIMAS MEJORAS

1. **Notificaciones Toast** - Reemplazar `alert()` con Snackbar
2. **Historial de cambios** - Ver quién y cuándo cambió el estado
3. **Filtros guardados** - Guardar combinaciones de filtros
4. **Acciones masivas** - Asignar asesor a múltiples registros
5. **Exportación** - Exportar a Excel/PDF

---

**Estado:** ✅ FUNCIONALIDADES IMPLEMENTADAS  
**Fecha:** 7 Noviembre 2025  
**Próximo paso:** Recargar frontend y probar funcionalidades
