# 📋 MEJORAS PENDIENTES - SUNDECK CRM

**Fecha:** 8 Noviembre 2025  
**Última actualización:** 10:40 AM  
**Estado:** Documento vivo (se actualiza continuamente)

---

## 🎯 RESUMEN EJECUTIVO

Este documento lista todas las mejoras, funcionalidades y tareas pendientes del sistema, organizadas por prioridad y fase.

---

## 🚨 PRIORIDAD ALTA (Implementar pronto)

### 1. KPI "En Riesgo" ⭐

**Descripción:** Agregar KPI que muestre proyectos en estado crítico

**Detalles:**
- Mostrar cantidad de proyectos con estado "crítico"
- Color rojo intenso (#d32f2f)
- Icono: 🚨 o ⚠️
- Posición: Después de "En Seguimiento"

**Archivos a modificar:**
- `server/controllers/proyectoController.js`
- `client/src/modules/proyectos/components/KPIsComerciales.jsx`

**Tiempo estimado:** 30 minutos  
**Complejidad:** Baja  
**Impacto:** Alto  
**Documentación:** `docs/MEJORA_KPI_EN_RIESGO.md`

**Estado:** ⏳ PENDIENTE

---

### 2. Alertas Automáticas (Fase 2)

**Descripción:** Sistema de alertas para seguimiento automático

**Funcionalidades:**
- Prospectos sin nota en 5 días → alerta al asesor
- Proyectos sin movimiento en 10 días → alerta al coordinador
- Proyectos críticos → alerta inmediata
- Instalaciones retrasadas → alerta a operaciones

**Archivos a crear:**
- `server/jobs/alertasProspectos.js` (ya existe, actualizar)
- `server/jobs/alertasProyectosCriticos.js` (nuevo)
- `server/jobs/alertasInstalaciones.js` (ya existe, actualizar)

**Tiempo estimado:** 1 día  
**Complejidad:** Media  
**Impacto:** Alto  
**Fase:** 2 (Automatización)

**Estado:** ⏳ PENDIENTE

---

## 🟡 PRIORIDAD MEDIA (Mejoras UX)

### 3. Snackbar en lugar de alerts

**Descripción:** Reemplazar `alert()` y `confirm()` con componentes Material-UI

**Beneficios:**
- Mejor experiencia de usuario
- Más profesional
- No bloquea la interfaz
- Personalizable

**Archivos a modificar:**
- `client/src/modules/proyectos/components/TablaComercial.jsx`
- `client/src/modules/proyectos/DashboardComercial.jsx`

**Tiempo estimado:** 30 minutos  
**Complejidad:** Baja  
**Impacto:** Medio

**Estado:** ⏳ PENDIENTE

---

### 4. Loading States Mejorados

**Descripción:** Agregar indicadores de carga más elegantes

**Mejoras:**
- Skeleton screens mientras carga
- Progress bars para operaciones largas
- Spinners contextuales
- Desactivar botones durante carga

**Archivos a modificar:**
- `client/src/modules/proyectos/components/TablaComercial.jsx`
- `client/src/modules/proyectos/components/KPIsComerciales.jsx`

**Tiempo estimado:** 30 minutos  
**Complejidad:** Baja  
**Impacto:** Medio

**Estado:** ⏳ PENDIENTE

---

### 5. Exportación a Excel

**Descripción:** Exportar tabla de proyectos a Excel

**Funcionalidades:**
- Botón "Exportar a Excel"
- Incluir filtros aplicados
- Formato profesional
- Columnas personalizables

**Librerías sugeridas:**
- `xlsx` o `exceljs`

**Archivos a crear:**
- `server/utils/excelExporter.js`
- Endpoint: `GET /api/proyectos/exportar`

**Tiempo estimado:** 1 hora  
**Complejidad:** Media  
**Impacto:** Medio

**Estado:** ⏳ PENDIENTE

---

### 6. Búsqueda con Debounce

**Descripción:** Optimizar búsqueda para no hacer peticiones en cada tecla

**Mejoras:**
- Debounce de 500ms
- Indicador de "Buscando..."
- Cancelar peticiones anteriores

**Archivos a modificar:**
- `client/src/modules/proyectos/components/FiltrosComerciales.jsx`

**Tiempo estimado:** 15 minutos  
**Complejidad:** Baja  
**Impacto:** Bajo

**Estado:** ⏳ PENDIENTE

---

## 🟢 PRIORIDAD BAJA (Funcionalidades avanzadas)

### 7. Historial de Cambios

**Descripción:** Ver historial completo de cambios de un proyecto

**Funcionalidades:**
- Timeline visual
- Quién hizo el cambio
- Qué cambió
- Cuándo cambió
- Observaciones

**Archivos a crear:**
- `client/src/modules/proyectos/components/HistorialProyecto.jsx`
- Endpoint: `GET /api/proyectos/:id/historial`

**Tiempo estimado:** 1 hora  
**Complejidad:** Media  
**Impacto:** Medio  
**Fase:** 3 (Panel de Supervisión)

**Estado:** ⏳ PENDIENTE

---

### 8. Acciones Masivas

**Descripción:** Realizar acciones en múltiples proyectos a la vez

**Funcionalidades:**
- Seleccionar múltiples proyectos (checkbox)
- Cambiar estado masivo
- Asignar asesor masivo
- Exportar seleccionados

**Archivos a modificar:**
- `client/src/modules/proyectos/components/TablaComercial.jsx`
- Endpoint: `PUT /api/proyectos/masivo`

**Tiempo estimado:** 2 horas  
**Complejidad:** Media-Alta  
**Impacto:** Medio

**Estado:** ⏳ PENDIENTE

---

### 9. Gráficos de Tendencias

**Descripción:** Visualizar tendencias de conversión y estados

**Gráficos:**
- Conversión por mes (línea)
- Distribución de estados (pie)
- Prospectos vs Proyectos (barras)
- Rendimiento por asesor (barras)

**Librerías sugeridas:**
- `recharts` o `chart.js`

**Archivos a crear:**
- `client/src/modules/proyectos/components/GraficosComerciales.jsx`

**Tiempo estimado:** 2 horas  
**Complejidad:** Media  
**Impacto:** Medio  
**Fase:** 3 (Panel de Supervisión)

**Estado:** ⏳ PENDIENTE

---

### 10. Filtros Guardados

**Descripción:** Guardar combinaciones de filtros favoritas

**Funcionalidades:**
- Guardar filtro actual
- Nombrar filtro
- Cargar filtro guardado
- Eliminar filtro

**Archivos a modificar:**
- `client/src/modules/proyectos/components/FiltrosComerciales.jsx`
- LocalStorage o backend

**Tiempo estimado:** 1 hora  
**Complejidad:** Media  
**Impacto:** Bajo

**Estado:** ⏳ PENDIENTE

---

## 🔵 FASE 2: AUTOMATIZACIÓN INTELIGENTE

### 11. Estados Inteligentes

**Descripción:** Auto-actualización de estados según acciones

**Reglas:**
- Si se genera cotización → `estadoComercial = "cotizado"`
- Si se crea pedido → `estadoComercial = "convertido"`
- Si pasan 30 días sin pedido → `estadoComercial = "perdido"`

**Archivos a modificar:**
- `server/models/Proyecto.js` (middleware pre-save)
- `server/controllers/cotizacionController.js`
- `server/controllers/pedidoController.js`

**Tiempo estimado:** 1 día  
**Complejidad:** Media  
**Impacto:** Alto  
**Fase:** 2

**Estado:** ⏳ PENDIENTE

---

### 12. Middleware de Historial Automático

**Descripción:** Registrar automáticamente cambios en historialEstados

**Funcionalidades:**
- Hook `pre("save")` en modelo
- Detectar cambios en estadoComercial
- Guardar en historialEstados
- Incluir usuario y timestamp

**Archivos a modificar:**
- `server/models/Proyecto.js`

**Tiempo estimado:** 2 horas  
**Complejidad:** Media  
**Impacto:** Alto  
**Fase:** 2

**Estado:** ⏳ PENDIENTE

---

## 🟣 FASE 3: PANEL DE SUPERVISIÓN

### 13. Dashboard Gerencial

**Descripción:** Panel completo para gerencia

**Funcionalidades:**
- Vista consolidada por asesor
- Vista por canal de origen
- Métricas avanzadas
- Reportes PDF

**Tiempo estimado:** 5-7 días  
**Complejidad:** Alta  
**Impacto:** Alto  
**Fase:** 3

**Estado:** ⏳ PENDIENTE

---

### 14. Reportes PDF Automáticos

**Descripción:** Generar reportes en PDF

**Tipos de reportes:**
- Reporte de prospectos por asesor
- Reporte de conversión mensual
- Reporte de proyectos críticos
- Reporte de instalaciones

**Endpoint:** `/api/reportes/prospectos`

**Tiempo estimado:** 2 días  
**Complejidad:** Media-Alta  
**Impacto:** Medio  
**Fase:** 3

**Estado:** ⏳ PENDIENTE

---

## 🟤 FASE 4: CONTROL DE CALIDAD

### 15. Módulo de Auditoría Comercial

**Descripción:** Panel de auditoría completo

**Funcionalidades:**
- Historial de cambios por usuario
- Filtros: usuario, fecha, acción
- Exportable a PDF
- Alertas de auditoría

**Tiempo estimado:** 4 días  
**Complejidad:** Alta  
**Impacto:** Alto  
**Fase:** 4

**Estado:** ⏳ PENDIENTE

---

## 🟠 FASE 5: INTELIGENCIA COMERCIAL

### 16. Algoritmo Predictivo

**Descripción:** Calcular probabilidad de cierre

**Fórmula:**
```
probabilidadCierre = 
  (contactosRecientes * 0.4) +
  (tiempoPromedioDeRespuesta * 0.3) +
  (historicoNotas * 0.3)
```

**Visualización:**
- Semáforo: 🔴 < 30%, 🟠 30-70%, 🟢 > 70%

**Tiempo estimado:** 5 días  
**Complejidad:** Alta  
**Impacto:** Alto  
**Fase:** 5

**Estado:** ⏳ PENDIENTE

---

## 📊 RESUMEN POR PRIORIDAD

| Prioridad | Cantidad | Tiempo Total |
|-----------|----------|--------------|
| 🚨 Alta | 2 | 1.5 días |
| 🟡 Media | 4 | 2.5 horas |
| 🟢 Baja | 4 | 6 horas |
| 🔵 Fase 2 | 2 | 1.5 días |
| 🟣 Fase 3 | 2 | 7-9 días |
| 🟤 Fase 4 | 1 | 4 días |
| 🟠 Fase 5 | 1 | 5 días |

**Total:** 16 mejoras pendientes

---

## 🎯 RECOMENDACIÓN DE IMPLEMENTACIÓN

### Esta semana (8-15 Nov)

1. ⭐ **KPI "En Riesgo"** (30 min) - Impacto inmediato
2. ⭐ **Snackbar** (30 min) - Mejor UX
3. ⭐ **Loading States** (30 min) - Más profesional
4. ⭐ **Búsqueda con Debounce** (15 min) - Optimización

**Total:** 1.75 horas  
**Resultado:** Dashboard más profesional y funcional

---

### Próximas 2 semanas (15-30 Nov)

1. ⭐ **Fase 2: Automatización** (3 días)
   - Alertas automáticas
   - Estados inteligentes
   - Middleware de historial

2. ⭐ **Exportación a Excel** (1 hora)
3. ⭐ **Historial de Cambios** (1 hora)

**Total:** 3.5 días  
**Resultado:** Sistema automatizado y completo

---

## 📝 CÓMO USAR ESTE DOCUMENTO

### Para agregar una mejora

1. Agregar en la sección de prioridad correspondiente
2. Incluir descripción, archivos, tiempo, complejidad
3. Actualizar resumen al final
4. Marcar como ⏳ PENDIENTE

### Para completar una mejora

1. Cambiar estado a ✅ COMPLETADA
2. Agregar fecha de completación
3. Mover a sección "Completadas" (al final)
4. Actualizar resumen

### Para priorizar

1. Mover entre secciones según prioridad
2. Actualizar tabla de resumen
3. Comunicar cambios al equipo

---

## ✅ MEJORAS COMPLETADAS

### 1. Dashboard Comercial Unificado ✅

**Fecha:** 7 Nov 2025  
**Tiempo:** 1 día  
**Componentes:** 4 (Dashboard, Filtros, KPIs, Tabla)

---

### 2. Estado "Crítico" ✅

**Fecha:** 8 Nov 2025  
**Tiempo:** 10 minutos  
**Archivos:** 4 modificados

---

## 🔄 HISTORIAL DE CAMBIOS

### 8 Nov 2025 - 10:40 AM
- ✅ Creado documento de mejoras pendientes
- ✅ Agregado KPI "En Riesgo" como prioridad alta
- ✅ Organizado por prioridad y fase
- ✅ Agregado resumen y recomendaciones

---

**Estado:** 📝 Documento activo  
**Próxima revisión:** Semanal  
**Responsable:** Equipo Técnico Sundeck
