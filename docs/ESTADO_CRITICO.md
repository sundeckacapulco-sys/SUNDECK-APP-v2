# 🚨 ESTADO CRÍTICO - DOCUMENTACIÓN

**Fecha de implementación:** 8 Noviembre 2025  
**Versión:** 1.0  
**Autor:** Equipo Técnico Sundeck

---

## 🎯 PROPÓSITO

El estado **"Crítico"** se utiliza para marcar proyectos que tienen **problemas graves que impiden la entrega a tiempo**.

---

## 📋 CASOS DE USO

### Cuándo usar el estado "Crítico"

1. **🧵 Problemas con materiales**
   - Tela llegó defectuosa o con manchas
   - Material incorrecto o de mala calidad
   - Falta de material para completar el proyecto
   - Proveedor no entregó a tiempo

2. **📏 Errores de medición**
   - Medida tomada incorrectamente
   - Dimensiones no coinciden con el espacio
   - Error en el levantamiento técnico
   - Cliente cambió medidas después de iniciar fabricación

3. **🏗️ Problemas de fabricación**
   - Error en el corte de tela
   - Daño durante la fabricación
   - Equipo/maquinaria descompuesta
   - Personal insuficiente

4. **🚚 Problemas de instalación**
   - Cliente no disponible en fecha programada
   - Acceso al lugar complicado/imposible
   - Condiciones del sitio no permiten instalación
   - Falta de herramientas o personal

5. **⏰ Retrasos críticos**
   - Fecha de entrega comprometida
   - Cliente urgente esperando
   - Penalización por retraso
   - Riesgo de cancelación

---

## 🎨 CARACTERÍSTICAS VISUALES

### Badge en el Dashboard

```
🚨 Crítico
Color: #d32f2f (Rojo intenso)
Estilo: Outlined chip
```

### Ubicación
- Aparece en la columna "Estado" de la tabla
- Disponible en el menú de "Cambiar Estado"
- Filtrable en la sección de filtros (solo para proyectos)

---

## 📊 IMPACTO EN KPIs

### Métricas afectadas

1. **🚨 En Riesgo** (⏳ PENDIENTE DE IMPLEMENTACIÓN)
   - KPI específico para proyectos críticos
   - Muestra cantidad de proyectos en estado crítico
   - Color rojo intenso (#d32f2f)
   - Icono: 🚨 o ⚠️
   - **Ver:** `docs/MEJORA_KPI_EN_RIESGO.md` para detalles de implementación

2. **En Seguimiento**
   - Los proyectos críticos también se cuentan como "En Seguimiento"
   - Requieren atención inmediata

3. **Alertas automáticas** (Fase 2)
   - Notificación inmediata al coordinador
   - Email/WhatsApp al responsable
   - Escalamiento si no se resuelve en 24h

4. **Reportes**
   - Sección especial en reportes gerenciales
   - Indicador de riesgo alto
   - Seguimiento diario obligatorio

---

## 🔄 FLUJO DE TRABAJO

### Cómo marcar un proyecto como Crítico

**Desde el Dashboard:**

1. Click en menú (⋮) del proyecto
2. Seleccionar "Cambiar Estado"
3. Elegir "🚨 Crítico"
4. Click "Actualizar"
5. **IMPORTANTE:** Agregar nota explicando el problema

**Desde el detalle del proyecto:**

1. Abrir proyecto
2. Cambiar estado a "Crítico"
3. Documentar el problema en notas
4. Asignar responsable de resolución

---

## 📝 BUENAS PRÁCTICAS

### Al marcar como Crítico

1. ✅ **Siempre agregar nota** explicando:
   - ¿Qué problema ocurrió?
   - ¿Cuándo se detectó?
   - ¿Quién lo reportó?
   - ¿Cuál es el impacto?

2. ✅ **Notificar inmediatamente**
   - Avisar al coordinador
   - Contactar al cliente si es necesario
   - Informar al equipo involucrado

3. ✅ **Documentar acciones**
   - Plan de solución
   - Tiempo estimado de resolución
   - Recursos necesarios
   - Responsables asignados

4. ✅ **Seguimiento diario**
   - Actualizar estado del problema
   - Registrar avances
   - Comunicar con cliente

### Al resolver el problema

1. ✅ **Cambiar estado** a:
   - `en_fabricacion` si se resolvió en fabricación
   - `en_instalacion` si se resolvió y está listo para instalar
   - `activo` si requiere replanificación

2. ✅ **Documentar solución**
   - ¿Cómo se resolvió?
   - ¿Cuánto tiempo tomó?
   - ¿Qué se aprendió?
   - ¿Cómo evitarlo en el futuro?

3. ✅ **Actualizar fechas**
   - Nueva fecha de entrega
   - Comunicar al cliente
   - Ajustar cronograma

---

## 🚨 ALERTAS AUTOMÁTICAS (Fase 2)

### Configuración futura

Cuando se implemente la Fase 2 (Automatización), los proyectos críticos activarán:

1. **Alerta inmediata**
   - Email al coordinador
   - WhatsApp al responsable
   - Notificación en dashboard

2. **Seguimiento automático**
   - Recordatorio cada 4 horas
   - Escalamiento si no hay actualización en 24h
   - Reporte diario a gerencia

3. **Métricas de tiempo**
   - Tiempo en estado crítico
   - Tiempo de resolución
   - Impacto en entrega

---

## 📊 REPORTES Y ANÁLISIS

### Información disponible

**Dashboard Comercial:**
- Contador de proyectos críticos
- Lista de proyectos en estado crítico
- Filtro específico para críticos

**Reportes (Fase 3):**
- Proyectos críticos del mes
- Causas más comunes
- Tiempo promedio de resolución
- Impacto en satisfacción del cliente

**KPIs:**
- % de proyectos que entran en crítico
- Tasa de resolución
- Tiempo promedio en crítico
- Impacto en entregas a tiempo

---

## 🎯 OBJETIVOS

### Metas del estado crítico

1. **Visibilidad inmediata** de problemas graves
2. **Respuesta rápida** del equipo
3. **Documentación completa** de incidencias
4. **Prevención** de problemas similares
5. **Mejora continua** del proceso

### Indicadores de éxito

- ✅ Tiempo de resolución < 48 horas
- ✅ 100% de críticos con notas documentadas
- ✅ 0 proyectos críticos sin seguimiento
- ✅ Reducción mensual de incidencias

---

## 📋 CHECKLIST DE PROYECTO CRÍTICO

### Al marcar como crítico

- [ ] Nota agregada con descripción del problema
- [ ] Coordinador notificado
- [ ] Cliente informado (si aplica)
- [ ] Plan de acción definido
- [ ] Responsable asignado
- [ ] Fecha estimada de resolución

### Durante la resolución

- [ ] Actualización diaria del estado
- [ ] Comunicación con cliente
- [ ] Registro de avances
- [ ] Ajuste de cronograma

### Al resolver

- [ ] Estado actualizado
- [ ] Solución documentada
- [ ] Cliente notificado
- [ ] Fechas actualizadas
- [ ] Lecciones aprendidas registradas

---

## 🔍 EJEMPLOS REALES

### Ejemplo 1: Tela defectuosa

**Situación:**
- Proyecto en fabricación
- Tela llegó con manchas
- Cliente espera entrega en 3 días

**Acciones:**
1. Marcar como "🚨 Crítico"
2. Nota: "Tela con manchas detectadas. Proveedor enviará reemplazo en 24h"
3. Notificar a cliente sobre retraso de 2 días
4. Coordinar nueva fecha de instalación
5. Al recibir tela nueva: cambiar a "en_fabricacion"

---

### Ejemplo 2: Medida incorrecta

**Situación:**
- Proyecto en instalación
- Cortina no cabe en el espacio
- Error en medición inicial

**Acciones:**
1. Marcar como "🚨 Crítico"
2. Nota: "Medida incorrecta. Ancho real: 2.5m vs medido: 2.3m"
3. Regresar a taller para ajuste
4. Re-tomar medidas correctas
5. Ajustar fabricación
6. Cambiar a "en_fabricacion" al corregir

---

## 💡 RECOMENDACIONES

### Para el equipo

1. **No abusar del estado crítico**
   - Solo para problemas graves
   - No para retrasos menores
   - Evaluar impacto real

2. **Documentar siempre**
   - Cada crítico debe tener notas
   - Explicar causa y solución
   - Registrar aprendizajes

3. **Comunicar proactivamente**
   - Informar al cliente
   - Mantener transparencia
   - Ofrecer soluciones

4. **Prevenir recurrencias**
   - Analizar causas raíz
   - Implementar mejoras
   - Capacitar al equipo

---

## 📞 CONTACTOS DE EMERGENCIA

### Escalamiento para proyectos críticos

**Nivel 1: Coordinador de Producción**
- Tiempo de respuesta: 2 horas
- Autoridad: Reasignar recursos

**Nivel 2: Gerente de Operaciones**
- Tiempo de respuesta: 4 horas
- Autoridad: Decisiones de costo/tiempo

**Nivel 3: Dirección General**
- Tiempo de respuesta: 24 horas
- Autoridad: Decisiones estratégicas

---

## 🔄 HISTORIAL DE CAMBIOS

### Versión 1.0 (8 Nov 2025)
- ✅ Estado crítico implementado
- ✅ Badge rojo intenso (#d32f2f)
- ✅ Disponible en filtros y menús
- ✅ Documentación completa

### Próximas mejoras (Fase 2)
- ⏳ Alertas automáticas
- ⏳ Notificaciones por email/WhatsApp
- ⏳ Escalamiento automático
- ⏳ Métricas de tiempo de resolución

---

**Estado:** ✅ Implementado y documentado  
**Versión:** 1.0  
**Última actualización:** 8 Noviembre 2025  
**Responsable:** Equipo Técnico Sundeck
