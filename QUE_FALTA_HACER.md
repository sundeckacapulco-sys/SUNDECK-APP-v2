# 📋 ¿QUÉ NOS FALTA HACER?

**Actualizado:** 5 Noviembre 2025  
**Basado en:** ROADMAP_TASKS.md y ROADMAP_MASTER.md

---

## ✅ LO QUE YA TENEMOS (Fases 0 y 1 Completadas)

### Fase 0: Baseline y Observabilidad ✅
- Logger estructurado (419/419 console.log migrados)
- Sistema de métricas operativo
- 32/32 tests pasando
- Observabilidad al 100%

### Fase 1: Desacoplo y Confiabilidad ✅
- Modelo Proyecto.js unificado
- Migración legacy exitosa (3/3 registros, $12,296 validados)
- Módulo Fabricación corregido
- Referencias entre colecciones implementadas
- Hooks unificados

---

## 🎯 LO QUE NOS FALTA (Priorizado)

### 🔴 PRIORIDAD ALTA - Fase 2 (Próximos 4-8 meses)

#### 1. **Event Bus Service Local** ⏱️ 2-3 semanas
**¿Qué es?** Sistema de eventos interno para comunicación entre módulos.

**Tareas:**
- [ ] Crear `server/services/eventBusService.js`
- [ ] Implementar registro de eventos en MongoDB
- [ ] Crear listeners para eventos críticos
- [ ] Documentar eventos disponibles

**Beneficio:** Desacoplar módulos y permitir automatización.

---

#### 2. **Motor de Reglas Declarativas** ⏱️ 3-4 semanas
**¿Qué es?** Sistema para automatizar transiciones de estado.

**Tareas:**
- [ ] Diseñar DSL (Domain Specific Language) para reglas
- [ ] Crear `server/services/rulesEngine.js`
- [ ] Implementar reglas para flujo Aprobado → Pedido → Fabricación
- [ ] Crear interfaz para gestionar reglas

**Beneficio:** Automatizar 90% del flujo operativo.

**Ejemplo de regla:**
```javascript
{
  evento: 'cotizacion.aprobada',
  condicion: 'anticipo.pagado === true',
  accion: 'crear.pedido',
  automatico: true
}
```

---

#### 3. **Panel Operativo en Tiempo Real** ⏱️ 2-3 semanas
**¿Qué es?** Dashboard para monitorear flujo operativo.

**Tareas:**
- [ ] Crear componente `DashboardOperativo.jsx`
- [ ] Implementar WebSocket o polling cada 5s
- [ ] Mostrar estado de pedidos en tiempo real
- [ ] Alertas visuales para eventos críticos

**Beneficio:** Visibilidad completa del flujo operativo.

---

#### 4. **IA Operativa Real** ⏱️ 4-6 semanas
**¿Qué es?** Reemplazar endpoints simulados con IA funcional.

**Tareas:**
- [ ] Implementar validación inteligente de partidas
- [ ] Sistema de recomendaciones basado en histórico
- [ ] Predicción de tiempos de fabricación
- [ ] Análisis de patrones de clientes

**Beneficio:** Precisión ≥80% en recomendaciones.

**Nota:** Usar modelos locales (sin costos externos).

---

### 🟡 PRIORIDAD MEDIA - Completar Fase 1

#### 5. **CI/CD con GitHub Actions** ⏱️ 1 semana
**Tareas:**
- [ ] Crear `.github/workflows/ci.yml`
- [ ] Configurar lint automático
- [ ] Ejecutar tests en cada push
- [ ] Notificaciones de build

---

#### 6. **Ampliar Cobertura de Tests** ⏱️ 2-3 semanas
**Actual:** 32/32 tests (40% cobertura)  
**Meta:** ≥80% cobertura

**Tareas:**
- [ ] Tests para controllers de Instalaciones
- [ ] Tests para services de Cotizaciones
- [ ] Tests para middleware de autenticación
- [ ] Tests de integración end-to-end

---

#### 7. **Actualizar Dependencias Críticas** ⏱️ 1 semana
**Tareas:**
- [ ] Mongoose 7.8.7 → 8.x
- [ ] React 18.x → última versión
- [ ] Material-UI → última versión
- [ ] Probar en rama `dev` primero

---

### 🟢 PRIORIDAD BAJA - Fase 3 (8-12 meses)

#### 8. **Separar Servicios por Dominio**
**Tareas:**
- [ ] Crear `/services/pedidos/`
- [ ] Crear `/services/fabricacion/`
- [ ] Crear `/services/instalaciones/`
- [ ] Documentar contratos OpenAPI

---

#### 9. **Gateway Local**
**Tareas:**
- [ ] Crear `gateway.config.js`
- [ ] Simular API Gateway
- [ ] Documentar rutas

---

#### 10. **App Móvil Base**
**Tareas:**
- [ ] Inicializar proyecto React Native/Expo
- [ ] Conectar a backend local
- [ ] Pantallas básicas (Login, Dashboard)
- [ ] Sincronización offline

---

#### 11. **Plantillas ETL para KPIs**
**Tareas:**
- [ ] Crear `/scripts/etl/`
- [ ] Plantillas para extracción de datos
- [ ] Preparar migración a Data Warehouse

---

## 📊 RESUMEN POR FASE

### Fase 2 (Próxima - 4-8 meses):
| Tarea | Prioridad | Tiempo | Estado |
|-------|-----------|--------|--------|
| Event Bus Service | 🔴 Alta | 2-3 sem | ❌ |
| Motor de Reglas | 🔴 Alta | 3-4 sem | ❌ |
| Panel Operativo | 🔴 Alta | 2-3 sem | ❌ |
| IA Operativa | 🔴 Alta | 4-6 sem | ❌ |
| CI/CD | 🟡 Media | 1 sem | ⚙️ |
| Ampliar Tests | 🟡 Media | 2-3 sem | ⚙️ |

**Total Fase 2:** ~4-6 meses

---

### Fase 3 (8-12 meses):
| Tarea | Prioridad | Tiempo | Estado |
|-------|-----------|--------|--------|
| Separar Servicios | 🟢 Baja | 3-4 sem | ❌ |
| Gateway Local | 🟢 Baja | 1-2 sem | ❌ |
| App Móvil | 🟢 Baja | 2-3 meses | ❌ |
| Plantillas ETL | 🟢 Baja | 2-3 sem | ❌ |

**Total Fase 3:** ~4-6 meses

---

## 🎯 PLAN DE ACCIÓN INMEDIATO (Próximos 3 meses)

### Mes 1: Event Bus + Motor de Reglas
**Semanas 1-2:** Event Bus Service
- Diseño de arquitectura
- Implementación básica
- Tests unitarios

**Semanas 3-4:** Motor de Reglas
- Diseño de DSL
- Implementación core
- Reglas básicas (Aprobado → Pedido)

---

### Mes 2: Panel Operativo + IA
**Semanas 5-6:** Panel Operativo
- Diseño de interfaz
- Implementación con WebSocket
- Integración con Event Bus

**Semanas 7-8:** IA Operativa (Fase 1)
- Validación inteligente de partidas
- Sistema de recomendaciones básico

---

### Mes 3: Completar y Consolidar
**Semanas 9-10:** CI/CD + Tests
- Configurar GitHub Actions
- Ampliar cobertura de tests

**Semanas 11-12:** Refinamiento
- Optimizaciones
- Documentación
- Preparar Fase 3

---

## 📈 MÉTRICAS DE PROGRESO

### Estado Actual (Post Fase 1):
- ✅ Observabilidad: 100%
- ✅ Estabilidad: 99%+
- ⚙️ Calidad (Tests): 40%
- ⚙️ Automatización: 30%
- ❌ IA: 0%
- ❌ App Móvil: 0%

### Meta Fase 2:
- ✅ Observabilidad: 100%
- ✅ Estabilidad: 99%+
- ✅ Calidad (Tests): 80%
- ✅ Automatización: 90%
- ✅ IA: 80%
- ❌ App Móvil: 0%

### Meta Fase 3:
- ✅ Observabilidad: 100%
- ✅ Estabilidad: 99%+
- ✅ Calidad (Tests): 90%
- ✅ Automatización: 95%
- ✅ IA: 85%
- ✅ App Móvil: 60%

---

## 💡 RECOMENDACIONES

### Para Empezar Fase 2:
1. **Leer documentación de Event-Driven Architecture**
2. **Diseñar arquitectura de eventos** (diagrama de flujo)
3. **Definir eventos críticos** del sistema
4. **Crear prototipo de Event Bus** (1 semana)

### Recursos Necesarios:
- **Tiempo:** 4-6 meses (Fase 2)
- **Equipo:** 1-2 desarrolladores
- **Infraestructura:** Sin costos adicionales (todo local)

---

## 🚀 PRÓXIMO PASO INMEDIATO

**Acción:** Iniciar diseño de Event Bus Service

**Tareas de esta semana:**
1. Leer sobre Event-Driven Architecture
2. Diseñar diagrama de eventos del sistema
3. Listar eventos críticos (cotizacion.aprobada, pedido.creado, etc.)
4. Crear estructura básica de `eventBusService.js`

---

**¿Quieres que empiece con el diseño del Event Bus Service?** 🎯
