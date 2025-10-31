# 📚 ÍNDICE MAESTRO - Sundeck CRM

**Versión**: 1.0  
**Fecha**: 31 de Octubre, 2025  
**Propósito**: Navegación centralizada de toda la documentación del proyecto

---

## 🎯 DOCUMENTOS PRINCIPALES

### 1️⃣ README_MASTER.md
**Propósito**: Visión general del sistema, módulos implementados y guía de uso  
**Audiencia**: Todo el equipo, nuevos desarrolladores  
**Contenido clave**:
- Estado actual de módulos (70% funcional)
- Sistema de levantamientos (13 campos técnicos)
- Cotización en vivo (3 niveles jerárquicos)
- Instalaciones con IA
- Stack tecnológico

**📍 Ubicación**: `/README_MASTER.md`

---

### 2️⃣ ROADMAPMASTER.md
**Propósito**: Plan estratégico de 12 meses (Nov 2025 → Oct 2026)  
**Audiencia**: Dirección, equipo técnico  
**Contenido clave**:
- 4 fases secuenciales (F0-F3)
- Objetivos y entregables por fase
- KPIs globales y metas
- Extensión SaaS Path (4 niveles)
- Estrategia "Preparado, no desplegado"

**📍 Ubicación**: `/docschecklists/ROADMAPMASTER.md`

---

### 3️⃣ ROADMAP_TASKS.md
**Propósito**: Checklist operativo con tareas específicas y estados  
**Audiencia**: Equipo de desarrollo  
**Contenido clave**:
- Resumen ejecutivo de auditoría
- Tareas por fase con estados (✅/⚙️/❌)
- Bloqueantes críticos identificados
- Seguimiento global de KPIs
- Prioridades inmediatas

**📍 Ubicación**: `/docschecklists/ROADMAP_TASKS.md`

---

### 4️⃣ auditoria_tecnica.md
**Propósito**: Análisis técnico completo del estado actual del CRM  
**Audiencia**: Equipo técnico, arquitectos  
**Contenido clave**:
- Módulos activos y funcionales (7 módulos)
- Módulos parcialmente implementados (3 módulos)
- Módulos pendientes (2 elementos)
- Riesgos detectados
- Recomendaciones inmediatas

**📍 Ubicación**: `/docs/auditoria_tecnica.md`

---

### 5️⃣ PLAN_ACCION_INMEDIATO.md
**Propósito**: Plan detallado para resolver los 5 bloqueantes críticos  
**Audiencia**: Equipo de desarrollo  
**Contenido clave**:
- 5 bloqueantes con soluciones paso a paso
- Código de ejemplo para cada corrección
- Cronograma de 3 semanas
- Criterios de éxito
- Entregables específicos

**📍 Ubicación**: `/docschecklists/PLAN_ACCION_INMEDIATO.md`

---

### 6️⃣ ESTADO_ACTUAL.md
**Propósito**: Snapshot detallado del estado actual del CRM con métricas visuales  
**Audiencia**: Todo el equipo, dirección  
**Contenido clave**:
- Progreso por fase con barras visuales
- Módulos por estado (funcionales/parciales/pendientes)
- KPIs globales con gaps
- Ruta crítica visualizada
- Cronograma de 12 meses
- Dependencias entre fases

**📍 Ubicación**: `/docschecklists/ESTADO_ACTUAL.md`

---

### 7️⃣ PLAN_TRABAJO_DETALLADO.md
**Propósito**: Plan de ejecución con pruebas y auditorías por sprint  
**Audiencia**: Equipo de desarrollo, QA, project managers  
**Contenido clave**:
- 26 sprints de 2 semanas (52 semanas totales)
- Tareas con días estimados y pruebas requeridas
- Plantillas de auditoría por sprint y por fase
- Criterios de aceptación específicos
- Plantillas de pruebas (unitarias, integración, E2E)
- Métricas de seguimiento por fase

**📍 Ubicación**: `/docschecklists/PLAN_TRABAJO_DETALLADO.md`

---

## 📁 DOCUMENTOS DE ARQUITECTURA

### architecture_map.md
**Propósito**: Mapa completo de la arquitectura del sistema  
**Contenido**: Modelos, controladores, servicios, hooks, componentes  
**📍 Ubicación**: `/docs/architecture_map.md`

### metrics_baseline.md
**Propósito**: Definición de métricas baseline del sistema  
**Estado**: ⚠️ Valores simulados, requiere instrumentación real  
**📍 Ubicación**: `/docs/metrics_baseline.md`

---

## 📋 DOCUMENTOS DE FUNCIONALIDADES

### PRUEBAS_EJECUTAR_AHORA.md
**Propósito**: Plan de pruebas detallado para validar funcionalidades  
**📍 Ubicación**: `/PRUEBAS_EJECUTAR_AHORA.md`

### PENDIENTES_COTIZACION_EN_VIVO.md
**Propósito**: Funcionalidades pendientes del módulo de cotización  
**📍 Ubicación**: `/PENDIENTES_COTIZACION_EN_VIVO.md`

### RESUMEN_SESION_FASE_4_Y_5.md
**Propósito**: Resumen de implementación de fases 4 y 5  
**📍 Ubicación**: `/RESUMEN_SESION_FASE_4_Y_5.md`

---

## 🗺️ FLUJO DE LECTURA RECOMENDADO

### Para Nuevos Desarrolladores
```
1. README_MASTER.md              (Visión general)
2. ESTADO_ACTUAL.md              (Estado con métricas visuales)
3. docs/architecture_map.md      (Arquitectura)
4. ROADMAPMASTER.md              (Plan estratégico)
5. ROADMAP_TASKS.md              (Tareas actuales)
```

### Para Dirección/Gerencia
```
1. README_MASTER.md              (Estado general)
2. ESTADO_ACTUAL.md              (Métricas y progreso visual)
3. docs/auditoria_tecnica.md     (Análisis técnico)
4. ROADMAPMASTER.md              (Plan de 12 meses)
5. PLAN_ACCION_INMEDIATO.md      (Próximos pasos)
```

### Para Equipo de Desarrollo
```
1. PLAN_TRABAJO_DETALLADO.md     (Plan de ejecución con pruebas)
2. ROADMAP_TASKS.md              (Tareas pendientes)
3. PLAN_ACCION_INMEDIATO.md      (Bloqueantes críticos)
4. ESTADO_ACTUAL.md              (Progreso por fase)
5. docs/auditoria_tecnica.md     (Brechas técnicas)
6. docs/architecture_map.md      (Arquitectura)
```

### Para Resolver Bloqueantes
```
1. ESTADO_ACTUAL.md              (Identificar estado actual)
2. docs/auditoria_tecnica.md     (Identificar problemas)
3. PLAN_ACCION_INMEDIATO.md      (Soluciones paso a paso)
4. ROADMAP_TASKS.md              (Marcar progreso)
```

---

## 🎯 DOCUMENTOS POR FASE DEL ROADMAP

### FASE 0: Baseline y Observabilidad
- `PLAN_ACCION_INMEDIATO.md` → Bloqueante #1 (Logger) y #4 (Métricas)
- `docs/metrics_baseline.md` → Definición de métricas
- `ROADMAP_TASKS.md` → Tareas específicas Fase 0

### FASE 1: Desacoplo y Confiabilidad
- `PLAN_ACCION_INMEDIATO.md` → Bloqueante #2 (Pedidos) y #3 (Fabricación)
- `docs/auditoria_tecnica.md` → Duplicidad de modelos
- `ROADMAP_TASKS.md` → Tareas específicas Fase 1

### FASE 2: Orquestación y Automatización
- `PLAN_ACCION_INMEDIATO.md` → Bloqueante #5 (IA Funcional)
- `ROADMAPMASTER.md` → Objetivos de automatización
- `ROADMAP_TASKS.md` → Tareas específicas Fase 2

### FASE 3: Escalamiento y API-Ready
- `ROADMAPMASTER.md` → Arquitectura modular
- `ROADMAP_TASKS.md` → Tareas específicas Fase 3

---

## 📊 ESTADO ACTUAL DEL PROYECTO

```
┌─────────────────────────────────────────────────────────────┐
│  SUNDECK CRM - RESUMEN EJECUTIVO                            │
│  ═══════════════════════════════════════════════════════════│
│                                                              │
│  Versión: 3.1                                               │
│  Estado: 70% Funcional (Base sólida con brechas críticas)   │
│  Fase actual: Transición F0 → F1                            │
│                                                              │
│  ✅ Módulos funcionales: 7/10                               │
│  ⚠️  Módulos parciales: 3/10                                │
│  ❌ Elementos críticos pendientes: 1                        │
│                                                              │
│  🚨 Bloqueantes críticos: 5                                 │
│  ⏱️  Tiempo estimado de resolución: 2-3 semanas             │
│                                                              │
│  Próximo hito: Completar Fase 0 (Observabilidad)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 CICLO DE ACTUALIZACIÓN

### Documentos que se actualizan frecuentemente
- `ROADMAP_TASKS.md` - Actualizar estados de tareas semanalmente
- `PLAN_ACCION_INMEDIATO.md` - Actualizar al resolver bloqueantes

### Documentos que se actualizan mensualmente
- `README_MASTER.md` - Al completar módulos importantes
- `docs/auditoria_tecnica.md` - Auditorías mensuales

### Documentos que se actualizan trimestralmente
- `ROADMAPMASTER.md` - Revisión trimestral de arquitectura
- `docs/architecture_map.md` - Cambios arquitectónicos mayores

---

## 🔗 RELACIONES ENTRE DOCUMENTOS

```
README_MASTER.md
    ├── Referencia → ROADMAPMASTER.md (Plan estratégico)
    ├── Referencia → auditoria_tecnica.md (Estado actual)
    ├── Referencia → ESTADO_ACTUAL.md (Métricas visuales)
    └── Referencia → PLAN_ACCION_INMEDIATO.md (Próximos pasos)

ROADMAPMASTER.md
    ├── Implementado en → ROADMAP_TASKS.md (Tareas)
    ├── Visualizado en → ESTADO_ACTUAL.md (Progreso)
    ├── Validado por → auditoria_tecnica.md (Auditoría)
    └── Ejecutado por → PLAN_ACCION_INMEDIATO.md (Acciones)

auditoria_tecnica.md
    ├── Genera → PLAN_ACCION_INMEDIATO.md (Soluciones)
    ├── Genera → ESTADO_ACTUAL.md (Métricas)
    ├── Actualiza → ROADMAP_TASKS.md (Estados)
    └── Informa → README_MASTER.md (Estado general)

PLAN_ACCION_INMEDIATO.md
    ├── Basado en → auditoria_tecnica.md (Problemas)
    ├── Alineado con → ROADMAPMASTER.md (Estrategia)
    ├── Visualizado en → ESTADO_ACTUAL.md (Progreso)
    └── Ejecuta → ROADMAP_TASKS.md (Tareas específicas)

ESTADO_ACTUAL.md
    ├── Basado en → auditoria_tecnica.md (Datos)
    ├── Refleja → ROADMAP_TASKS.md (Estados)
    ├── Visualiza → ROADMAPMASTER.md (Fases)
    └── Referencia → PLAN_ACCION_INMEDIATO.md (Soluciones)
```

---

## 🎓 GLOSARIO DE TÉRMINOS

**F0, F1, F2, F3**: Fases del roadmap (0-3)  
**Bloqueante**: Tarea que impide avanzar en otras áreas  
**Crítico**: Alta prioridad, impacto significativo  
**Baseline**: Línea base de métricas para comparación  
**Desacoplo**: Separación de componentes para reducir dependencias  
**Observabilidad**: Capacidad de monitorear y depurar el sistema  
**SaaS Path**: Ruta de evolución hacia producto vendible  

---

## 📞 CONTACTO Y RESPONSABLES

**Responsable funcional**: David Rojas - Dirección General Sundeck  
**Responsable técnico**: Equipo Desarrollo CRM Sundeck  
**Soporte**: Cascade AI

---

> 💡 **Este índice es el punto de entrada a toda la documentación del Sundeck CRM.**  
> Mantenerlo actualizado es crítico para la navegación eficiente del proyecto.

**Última actualización**: 31 de Octubre, 2025
