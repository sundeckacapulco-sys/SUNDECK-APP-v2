# 📚 PLAN DE REORGANIZACIÓN DE DOCUMENTACIÓN

**Fecha:** 18 Noviembre 2025  
**Problema:** 56+ archivos .md dispersos, difícil navegación  
**Solución:** Estructura organizada por categorías

---

## 📊 ANÁLISIS ACTUAL

### Documentos en Raíz (13 archivos)
```
✅ Mantener:
- README.md (principal)
- CONTINUAR_AQUI.md (sesión actual)
- AGENTS.md (instrucciones agentes)
- SETUP.md
- CHANGELOG.md

❌ Mover a /docs:
- ANALISIS_KPIS_PROSPECTOS.md → docs/03-MODULOS/
- CHECKLIST_AUDITORIA.md → docs/05-AUDITORIAS/
- EJECUTAR_PRUEBAS_PDF.md → docs/06-GUIAS/
- EMPEZAR_AUDITORIA_AQUI.md → docs/05-AUDITORIAS/
- KPIS_SISTEMA.md → docs/03-MODULOS/
- LIMPIEZA_COMPLETADA.md → docs/07-LEGACY/
- RESUMEN_AUDITORIA.md → docs/05-AUDITORIAS/
- TROUBLESHOOTING.md → docs/00-INICIO/
```

### Documentos en /docs (43 archivos)
```
Categorizar en subcarpetas:

📁 00-INICIO/ (3 docs)
- SETUP.md (mover desde raíz)
- TROUBLESHOOTING.md (mover desde raíz)
- ARQUITECTURA_LEVANTAMIENTOS.md

📁 01-ROADMAPS/ (4 docs)
- ROADMAP_MASTER.md (desde docschecklists/)
- ROADMAP_TASKS.md (desde docschecklists/)
- ESTADO_RUTA_MAESTRA.md
- ALERTAS_INTELIGENTES_ROADMAP.md

📁 02-FASES/ (4 docs)
- FASE_0_BASELINE.md (crear resumen)
- FASE_1_UNIFICACION.md (crear resumen)
- FASE_2_AUTOMATIZACION.md (crear resumen)
- FASE_3_ESCALAMIENTO.md (crear resumen)

📁 03-MODULOS/ (8 docs)
- PROSPECTOS.md (consolidar)
- PROYECTOS.md (consolidar)
- COTIZACIONES.md (consolidar)
- FABRICACION.md (consolidar)
- INSTALACIONES.md (consolidar)
- KPIS.md (consolidar)
- PAGOS.md (consolidar)
- ALMACEN.md (crear)

📁 04-IMPLEMENTACIONES/ (15 docs)
- SISTEMA_PAGOS_COMPROBANTES.md
- CALCULADORA_MATERIALES.md
- ORDEN_PRODUCCION_IMPLEMENTACION.md
- VISOR_PDF_COTIZACIONES.md
- ALERTAS_FABRICACION_IMPLEMENTACION.md
- FLUJO_PAGO_FABRICACION.md
- MODAL_REGISTRO_PAGOS.md
- PLAN_HIBRIDO_CALCULADORA.md
- REGLAS_CALCULADORA_v1.2.md
- PLANTILLA_SHEER_ELEGANCE.md
- PLANTILLA_TOLDOS.md
- SISTEMA_SUPERVISION_TIEMPO_REAL.md
- INSTRUCCIONES_REFACTOR_COTIZACIONES.md
- MIGRACION_MEDIDAS_A_LEVANTAMIENTO.md
- QUICK_FIX_LEVANTAMIENTOS.md

📁 05-AUDITORIAS/ (7 docs)
- AUDITORIA_FABRICACION_NOV_13.md
- AUDITORIA_SESION_7NOV.md
- AUDITORIA_SESION_14_NOV_2025.md (desde docschecklists/)
- RESUMEN_AUDITORIA.md (desde raíz)
- CHECKLIST_AUDITORIA.md (desde raíz)
- EMPEZAR_AUDITORIA_AQUI.md (desde raíz)
- ALINEACION_ROADMAP_NOV_13.md

📁 06-GUIAS/ (11 docs)
- GUIA_PATH_HELPER.md
- GUIA_LEVANTAMIENTOS.md (consolidar)
- GUIA_MIGRACION.md (consolidar)
- GUIA_CONTINUACION_TRABAJO.md (desde docschecklists/)
- INSTRUCCIONES_DEBUG_PDF.md
- EJECUTAR_PRUEBAS_PDF.md (desde raíz)
- SCRIPTS_PRUEBA_PDFS.md
- TROUBLESHOOTING_LEVANTAMIENTOS.md
- MEJORAS_PENDIENTES.md
- MEJORA_KPI_EN_RIESGO.md
- CHANGELOG_LEVANTAMIENTOS_2025-11-07.md

📁 07-LEGACY/ (6 docs)
- MODELOS_LEGACY.md (desde docschecklists/)
- ANALISIS_CONSOLIDACION_LEGACY.md
- LIMPIEZA_COMPLETADA.md (desde raíz)
- PROBLEMA_PDF_REGENERACION.md
- SOLUCION_PDF_REGENERACION.md
- RESUMEN_IMPLEMENTACION_DEBUG_PDF.md

📁 08-ARCHIVADOS/ (docs obsoletos)
- ESTADO_CRITICO.md
- INSTRUCCION_AGENTE_FASE_2.md
- ANALISIS_FLUJO_COTIZACION_PROYECTO.md (si ya implementado)
```

### Documentos en /docschecklists (7 archivos)
```
❌ DEPRECAR carpeta completa, mover contenido:

→ docs/01-ROADMAPS/
- ROADMAPMASTER.md
- ROADMAP_TASKS.md
- ESTADO_ACTUAL.md

→ docs/06-GUIAS/
- GUIA_CONTINUACION_TRABAJO.md

→ docs/07-LEGACY/
- MODELOS_LEGACY.md

→ docs/03-MODULOS/
- REQUISITOS_PRODUCCION_INSTALACION.md

→ docs/05-AUDITORIAS/auditorias/
- (mover todos los archivos de auditorias/)
```

---

## 🎯 ESTRUCTURA FINAL PROPUESTA

```
📁 SUNDECK-APP-v2/
│
├── 📄 README.md ⭐ (principal)
├── 📄 CONTINUAR_AQUI.md ⭐ (sesión actual)
├── 📄 AGENTS.md ⭐ (instrucciones agentes)
├── 📄 SETUP.md ⭐ (setup rápido)
├── 📄 CHANGELOG.md ⭐ (historial cambios)
│
├── 📁 docs/
│   │
│   ├── 📁 00-INICIO/ (Primeros pasos)
│   │   ├── SETUP_DETALLADO.md
│   │   ├── TROUBLESHOOTING.md
│   │   └── ARQUITECTURA.md
│   │
│   ├── 📁 01-ROADMAPS/ (Planificación)
│   │   ├── README.md (índice)
│   │   ├── ROADMAP_MASTER.md ⭐
│   │   ├── ROADMAP_TASKS.md
│   │   ├── ESTADO_RUTA_MAESTRA.md
│   │   └── ALERTAS_INTELIGENTES_ROADMAP.md
│   │
│   ├── 📁 02-FASES/ (Desarrollo por fases)
│   │   ├── README.md (índice)
│   │   ├── FASE_0_BASELINE.md
│   │   ├── FASE_1_UNIFICACION.md
│   │   ├── FASE_2_AUTOMATIZACION.md
│   │   └── FASE_3_ESCALAMIENTO.md
│   │
│   ├── 📁 03-MODULOS/ (Documentación por módulo)
│   │   ├── README.md (índice)
│   │   ├── PROSPECTOS.md
│   │   ├── PROYECTOS.md
│   │   ├── COTIZACIONES.md
│   │   ├── FABRICACION.md
│   │   ├── INSTALACIONES.md
│   │   ├── KPIS.md
│   │   ├── PAGOS.md
│   │   └── ALMACEN.md
│   │
│   ├── 📁 04-IMPLEMENTACIONES/ (Features específicas)
│   │   ├── README.md (índice)
│   │   ├── SISTEMA_PAGOS.md
│   │   ├── CALCULADORA_MATERIALES.md
│   │   ├── ORDEN_PRODUCCION.md
│   │   ├── VISOR_PDF.md
│   │   ├── ALERTAS_INTELIGENTES.md
│   │   ├── FLUJO_PAGO_FABRICACION.md
│   │   ├── MODAL_REGISTRO_PAGOS.md
│   │   ├── CALCULADORA_v1.2/
│   │   │   ├── PLAN_HIBRIDO.md
│   │   │   ├── REGLAS.md
│   │   │   ├── PLANTILLA_SHEER_ELEGANCE.md
│   │   │   └── PLANTILLA_TOLDOS.md
│   │   └── LEVANTAMIENTOS/
│   │       ├── ARQUITECTURA.md
│   │       ├── MIGRACION.md
│   │       └── QUICK_FIX.md
│   │
│   ├── 📁 05-AUDITORIAS/ (Auditorías y revisiones)
│   │   ├── README.md (índice)
│   │   ├── CHECKLIST.md
│   │   ├── RESUMEN_GENERAL.md
│   │   ├── 2025-11-07/
│   │   │   └── AUDITORIA_SESION.md
│   │   ├── 2025-11-13/
│   │   │   ├── AUDITORIA_FABRICACION.md
│   │   │   └── ALINEACION_ROADMAP.md
│   │   └── 2025-11-14/
│   │       └── AUDITORIA_SESION.md
│   │
│   ├── 📁 06-GUIAS/ (Guías de uso)
│   │   ├── README.md (índice)
│   │   ├── GUIA_PATH_HELPER.md
│   │   ├── GUIA_LEVANTAMIENTOS.md
│   │   ├── GUIA_MIGRACION.md
│   │   ├── GUIA_CONTINUACION_TRABAJO.md
│   │   ├── GUIA_DEBUG_PDF.md
│   │   ├── GUIA_PRUEBAS_PDF.md
│   │   ├── TROUBLESHOOTING_LEVANTAMIENTOS.md
│   │   └── MEJORAS_PENDIENTES.md
│   │
│   ├── 📁 07-LEGACY/ (Código y docs legacy)
│   │   ├── README.md (índice)
│   │   ├── MODELOS_LEGACY.md
│   │   ├── ANALISIS_CONSOLIDACION.md
│   │   ├── LIMPIEZA_COMPLETADA.md
│   │   └── PROBLEMAS_RESUELTOS/
│   │       ├── PDF_REGENERACION.md
│   │       └── SOLUCION_PDF.md
│   │
│   └── 📁 08-ARCHIVADOS/ (Docs obsoletos)
│       └── README.md (por qué están archivados)
│
├── 📁 docschecklists/ ❌ ELIMINAR
│   └── (mover todo a docs/)
│
└── 📁 server/
    └── 📁 docs/ (Documentación técnica API)
        ├── API.md
        ├── ENDPOINTS.md
        └── SCHEMAS.md
```

---

## 🔄 PROCESO DE REORGANIZACIÓN

### Fase 1: Crear Estructura (15 min)
```bash
# Crear carpetas
mkdir docs/00-INICIO
mkdir docs/01-ROADMAPS
mkdir docs/02-FASES
mkdir docs/03-MODULOS
mkdir docs/04-IMPLEMENTACIONES
mkdir docs/05-AUDITORIAS
mkdir docs/06-GUIAS
mkdir docs/07-LEGACY
mkdir docs/08-ARCHIVADOS

# Crear README.md en cada carpeta
```

### Fase 2: Mover Archivos (30 min)
```bash
# Ejemplo de comandos
mv ANALISIS_KPIS_PROSPECTOS.md docs/03-MODULOS/
mv CHECKLIST_AUDITORIA.md docs/05-AUDITORIAS/
# ... etc
```

### Fase 3: Crear Índices (30 min)
- Crear README.md en cada subcarpeta
- Listar documentos con descripción breve
- Agregar enlaces entre documentos relacionados

### Fase 4: Actualizar Referencias (30 min)
- Buscar enlaces rotos en documentos
- Actualizar rutas en CONTINUAR_AQUI.md
- Actualizar rutas en AGENTS.md

### Fase 5: Deprecar docschecklists/ (15 min)
- Mover todo el contenido
- Crear archivo DEPRECATED.md explicando
- Eliminar carpeta vacía

---

## 📋 CHECKLIST DE EJECUCIÓN

### Preparación
- [ ] Hacer backup de carpeta docs/
- [ ] Hacer commit de estado actual
- [ ] Crear rama `reorganizacion-docs`

### Ejecución
- [ ] Crear estructura de carpetas
- [ ] Crear README.md en cada carpeta
- [ ] Mover archivos de raíz a docs/
- [ ] Mover archivos dentro de docs/
- [ ] Mover archivos de docschecklists/
- [ ] Actualizar referencias en documentos
- [ ] Actualizar CONTINUAR_AQUI.md
- [ ] Actualizar AGENTS.md

### Validación
- [ ] Verificar que no hay enlaces rotos
- [ ] Verificar que todos los docs están categorizados
- [ ] Verificar que README.md de cada carpeta está completo
- [ ] Hacer commit final
- [ ] Merge a main

---

## 🎯 BENEFICIOS ESPERADOS

**Antes:**
- ❌ 56 archivos dispersos
- ❌ Difícil encontrar información
- ❌ Documentos duplicados
- ❌ Sin estructura clara

**Después:**
- ✅ Estructura organizada por categorías
- ✅ Fácil navegación con índices
- ✅ Documentos consolidados
- ✅ Jerarquía clara y lógica

---

## ⏱️ TIEMPO ESTIMADO

- **Preparación:** 15 min
- **Ejecución:** 2 horas
- **Validación:** 30 min
- **TOTAL:** ~3 horas

---

## 🚦 DECISIÓN

**¿Ejecutar reorganización ahora?**

**Pros:**
- Mejora navegación inmediatamente
- Facilita trabajo futuro
- Elimina confusión

**Contras:**
- Toma 3 horas
- Puede romper enlaces temporalmente
- Requiere actualizar referencias

**Recomendación:** Hacerlo en sesión dedicada, no mezclado con desarrollo de features.

---

**Última actualización:** 18 Nov 2025, 9:40 AM
