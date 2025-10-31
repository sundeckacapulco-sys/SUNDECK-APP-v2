# 📋 PLAN DE TRABAJO DETALLADO — Sundeck CRM

**Versión:** 1.0  
**Fecha inicio:** 1 de Noviembre, 2025  
**Duración:** 12 meses (52 semanas)  
**Responsable:** David Rojas  
**Basado en:** `ROADMAPMASTER.md` v1.1 | `PLAN_ACCION_INMEDIATO.md`

---

## 🎯 Objetivo

Ejecutar el roadmap de 12 meses con **pruebas y auditorías** en cada tarea para garantizar calidad, trazabilidad y cumplimiento de objetivos.

**Metodología:** Sprints de 2 semanas con auditorías al cierre de cada fase.

---

## 📅 CRONOGRAMA GENERAL

```
┌────────────────────────────────────────────────────────────────┐
│  SEMANAS 1-8:   FASE 0 (Observabilidad)                        │
│  SEMANAS 9-24:  FASE 1 (Desacoplo y Confiabilidad)             │
│  SEMANAS 25-40: FASE 2 (Orquestación y Automatización)         │
│  SEMANAS 41-52: FASE 3 (Escalamiento y API-Ready)              │
└────────────────────────────────────────────────────────────────┘
```

---

## 🚀 FASE 0: BASELINE Y OBSERVABILIDAD (Semanas 1-8)

### Sprint 1-2: Logger Estructurado (Semanas 1-4)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **1.1** Implementar Winston Logger | 3 | 3 unitarias | Logger funcional con rotación |
| **1.2** Reemplazar console.log | 4 | 5 integración | 0 console.log en críticos |
| **1.3** Documentar uso | 1 | - | `docs/logger_usage.md` |

**Auditoría Sprint 1-2:**
```bash
# Verificar implementación
grep -r "console.log" server/controllers/ server/routes/
ls -la logs/
npm test -- logger

# Métricas esperadas
- Archivos con logger: ≥10
- Logs generados: ≥100/día
- Rotación funcionando: ✅
```

---

### Sprint 3-4: Métricas Baseline (Semanas 5-8)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **2.1** Modelo Metric | 2 | 3 unitarias | Modelo con índices |
| **2.2** Middleware métricas | 3 | 3 integración | 5 rutas instrumentadas |
| **2.3** API de métricas | 3 | 3 API | 3 endpoints funcionales |
| **2.4** Documentar baseline | 2 | - | `docs/metrics_baseline.md` actualizado |

**Auditoría Sprint 3-4:**
```bash
# Verificar métricas
curl http://localhost:5001/api/metrics/summary
mongo --eval "db.metrics.count()"
npm test -- metrics

# Métricas esperadas
- Latencia promedio: <1500ms
- Endpoints lentos: <5
- Tasa errores: <5%
- Cobertura logging: ≥70%
```

---

### 📊 AUDITORÍA FASE 0 (Fin Semana 8)

**Checklist:**
- [ ] Logger estructurado: 100%
- [ ] Métricas baseline: 100%
- [ ] Pruebas: 17/17 pasando
- [ ] Cobertura código: ≥60%
- [ ] Documentación: Completa

**Resultado:** ✅ APROBADA / ⚠️ CON OBSERVACIONES / ❌ NO APROBADA

---

## 🧱 FASE 1: DESACOPLO Y CONFIABILIDAD (Semanas 9-24)

### Sprint 5-7: Unificar Dominio Pedidos (Semanas 9-15)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **3.1** Análisis dependencias | 3 | - | Documento análisis completo |
| **3.2** Script migración | 4 | 5 migración | Script con rollback |
| **3.3** Ejecutar migración | 2 | - | 100% datos migrados |
| **3.4** Actualizar rutas | 5 | 8 integración | API unificada |
| **3.5** Actualizar frontend | 4 | 6 E2E | UI funcionando |
| **3.6** Deprecar modelos | 2 | - | Modelos antiguos removidos |

**Auditoría Sprint 5-7:**
```bash
# Verificar unificación
mongo --eval "db.pedidos.count()" # Debe ser 0
mongo --eval "db.proyectos.find({'pedido': {$exists: true}}).count()"
npm test -- pedidos

# Métricas esperadas
- Modelo único: ✅
- Datos migrados: 100%
- Rutas actualizadas: 100%
- Tests pasando: ≥15/15
```

---

### Sprint 8-10: Corregir Fabricación (Semanas 16-21)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **4.1** Agregar imports faltantes | 1 | 2 unitarias | Módulo sin errores |
| **4.2** Validaciones y logging | 2 | 4 integración | Validaciones completas |
| **4.3** Conectar con Pedidos | 3 | 5 integración | Flujo Pedido→Fabricación |
| **4.4** Dashboard fabricación | 4 | 3 E2E | UI funcional |
| **4.5** Documentar flujo | 2 | - | `docs/fabricacion_flow.md` |

**Auditoría Sprint 8-10:**
```bash
# Verificar fabricación
curl -X POST http://localhost:5001/api/fabricacion \
  -H "Content-Type: application/json" \
  -d '{"pedidoId": "..."}'
npm test -- fabricacion

# Métricas esperadas
- Imports correctos: ✅
- Órdenes creadas: ≥10
- Tests pasando: ≥14/14
```

---

### Sprint 11-12: Pruebas Unitarias (Semanas 22-24)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **5.1** Tests controladores | 5 | 20 unitarias | Cobertura ≥70% |
| **5.2** Tests servicios | 3 | 15 unitarias | Cobertura ≥70% |
| **5.3** Tests integración | 4 | 10 integración | Flujos completos |
| **5.4** CI/CD pipeline | 3 | - | GitHub Actions funcional |

**Auditoría Sprint 11-12:**
```bash
# Verificar tests
npm test -- --coverage
cat coverage/lcov-report/index.html

# Métricas esperadas
- Cobertura total: ≥70%
- Tests unitarios: ≥35
- Tests integración: ≥10
- CI/CD: ✅ Funcionando
```

---

### 📊 AUDITORÍA FASE 1 (Fin Semana 24)

**Checklist:**
- [ ] Pedidos unificados: 100%
- [ ] Fabricación funcional: 100%
- [ ] Pruebas unitarias: ≥45 pasando
- [ ] Cobertura código: ≥70%
- [ ] CI/CD: Operativo

**Resultado:** ✅ APROBADA / ⚠️ CON OBSERVACIONES / ❌ NO APROBADA

---

## 🤖 FASE 2: ORQUESTACIÓN Y AUTOMATIZACIÓN (Semanas 25-40)

### Sprint 13-15: IA Funcional (Semanas 25-31)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **6.1** Servicio IA heurística | 4 | 8 unitarias | Reglas funcionando |
| **6.2** Validación partidas | 3 | 5 integración | Precisión ≥80% |
| **6.3** Sugerencias productos | 3 | 4 integración | Precisión ≥85% |
| **6.4** Tracking precisión | 2 | 3 unitarias | Métricas guardadas |
| **6.5** API IA | 3 | 5 API | Endpoints funcionales |

**Auditoría Sprint 13-15:**
```bash
# Verificar IA
curl http://localhost:5001/api/ai/validar-partida
curl http://localhost:5001/api/ai/sugerir-producto
npm test -- ai

# Métricas esperadas
- Precisión validación: ≥80%
- Precisión sugerencias: ≥85%
- Tests pasando: ≥25/25
```

---

### Sprint 16-18: Motor de Reglas (Semanas 32-37)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **7.1** EventBus local | 3 | 4 unitarias | Eventos registrados |
| **7.2** Motor reglas DSL | 5 | 8 integración | Reglas ejecutándose |
| **7.3** Automatización flujo | 4 | 6 E2E | Aprobado→Pedido→Fab |
| **7.4** Panel operativo | 4 | 4 E2E | Dashboard funcional |

**Auditoría Sprint 16-18:**
```bash
# Verificar automatización
curl http://localhost:5001/api/eventos
npm test -- motor-reglas

# Métricas esperadas
- Pedidos automatizados: ≥90%
- Latencia eventos: <5s
- Tests pasando: ≥22/22
```

---

### Sprint 19-20: APM y Tracing (Semanas 38-40)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **8.1** APM ligero | 3 | 3 integración | Métricas avanzadas |
| **8.2** Tracing endpoints | 3 | 4 integración | Trazas completas |
| **8.3** Alertas automáticas | 2 | 2 unitarias | Alertas funcionando |

**Auditoría Sprint 19-20:**
```bash
# Verificar APM
curl http://localhost:5001/api/apm/traces
npm test -- apm

# Métricas esperadas
- Tracing: ≥85% endpoints
- Alertas: Funcionando
- Tests pasando: ≥9/9
```

---

### 📊 AUDITORÍA FASE 2 (Fin Semana 40)

**Checklist:**
- [ ] IA funcional: Precisión ≥80%
- [ ] Motor reglas: Operativo
- [ ] Automatización: ≥90%
- [ ] APM: Funcionando
- [ ] Tests: ≥56 pasando

**Resultado:** ✅ APROBADA / ⚠️ CON OBSERVACIONES / ❌ NO APROBADA

---

## 🚀 FASE 3: ESCALAMIENTO Y API-READY (Semanas 41-52)

### Sprint 21-23: Separación de Servicios (Semanas 41-47)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **9.1** Separar servicios | 6 | 10 integración | 3 servicios independientes |
| **9.2** Contratos OpenAPI | 4 | - | Documentación completa |
| **9.3** Gateway local | 4 | 5 integración | Gateway funcional |

**Auditoría Sprint 21-23:**
```bash
# Verificar servicios
ls -la server/services/pedidos/
ls -la server/services/fabricacion/
ls -la server/services/instalaciones/
npm test -- services

# Métricas esperadas
- Servicios separados: 3
- Contratos documentados: ✅
- Tests pasando: ≥15/15
```

---

### Sprint 24-26: App Móvil Base (Semanas 48-52)

| Tarea | Días | Pruebas | Criterios Éxito |
|-------|------|---------|-----------------|
| **10.1** Setup React Native | 2 | - | Proyecto inicializado |
| **10.2** Pantallas básicas | 6 | 8 E2E | 5 pantallas funcionales |
| **10.3** Conexión API | 4 | 6 integración | CRUD completo |
| **10.4** Build y deploy | 2 | - | APK generado |

**Auditoría Sprint 24-26:**
```bash
# Verificar app móvil
cd mobile && npm test
npx react-native run-android

# Métricas esperadas
- Pantallas: ≥5
- Conexión API: ✅
- Tests pasando: ≥14/14
```

---

### 📊 AUDITORÍA FASE 3 (Fin Semana 52)

**Checklist:**
- [ ] Servicios separados: 3/3
- [ ] Contratos OpenAPI: Completos
- [ ] Gateway local: Funcional
- [ ] App móvil: Base operativa
- [ ] Tests: ≥29 pasando

**Resultado:** ✅ APROBADA / ⚠️ CON OBSERVACIONES / ❌ NO APROBADA

---

## 📊 MÉTRICAS GLOBALES DE SEGUIMIENTO

### KPIs por Fase

| KPI | Fase 0 | Fase 1 | Fase 2 | Fase 3 | Meta Final |
|-----|--------|--------|--------|--------|------------|
| **Cobertura Tests** | 60% | 70% | 75% | 80% | ≥80% |
| **Observabilidad** | 70% | 75% | 85% | 90% | ≥85% |
| **Automatización** | 20% | 40% | 90% | 95% | ≥90% |
| **Latencia API** | <1.5s | <1.3s | <1.2s | <1.0s | <1.5s |
| **Uptime** | 95% | 97% | 98% | 99% | ≥99% |

---

## 🔄 PROCESO DE AUDITORÍA

### Auditoría por Sprint (Cada 2 semanas)

```markdown
## AUDITORÍA SPRINT #__

**Fecha:** __________
**Sprint:** Semanas __ - __
**Auditor:** __________

### Tareas Completadas
- [ ] Tarea 1: _____ (✅/⚠️/❌)
- [ ] Tarea 2: _____ (✅/⚠️/❌)
- [ ] Tarea 3: _____ (✅/⚠️/❌)

### Pruebas
- Unitarias: ____ / ____ pasando
- Integración: ____ / ____ pasando
- E2E: ____ / ____ pasando

### Métricas
- Cobertura código: ____%
- Performance: _____ms
- Errores: _____

### Bloqueantes
1. __________
2. __________

### Decisión
- [ ] ✅ Continuar
- [ ] ⚠️ Continuar con observaciones
- [ ] ❌ Detener y corregir

**Firma:** __________
```

---

### Auditoría por Fase (Cada 2-4 meses)

```markdown
## AUDITORÍA FASE __

**Fecha:** __________
**Fase:** __________
**Auditor:** __________

### Objetivos Cumplidos
- [ ] Objetivo 1: _____ (✅/⚠️/❌)
- [ ] Objetivo 2: _____ (✅/⚠️/❌)
- [ ] Objetivo 3: _____ (✅/⚠️/❌)

### KPIs Alcanzados
| KPI | Meta | Actual | Estado |
|-----|------|--------|--------|
| Tests | __% | __% | ✅/❌ |
| Observabilidad | __% | __% | ✅/❌ |
| Automatización | __% | __% | ✅/❌ |

### Entregables
- [ ] Código: _____
- [ ] Pruebas: _____
- [ ] Documentación: _____

### Lecciones Aprendidas
1. __________
2. __________

### Recomendaciones
1. __________
2. __________

### Decisión Final
- [ ] ✅ FASE APROBADA
- [ ] ⚠️ APROBADA CON OBSERVACIONES
- [ ] ❌ FASE NO APROBADA

**Firma Auditor:** __________
**Firma Responsable:** __________
```

---

## 📝 PLANTILLAS DE PRUEBAS

### Prueba Unitaria
```javascript
// tests/unit/[modulo].test.js
describe('[Módulo] - Pruebas Unitarias', () => {
  test('Debe [comportamiento esperado]', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = funcion(input);
    
    // Assert
    expect(result).toBe(...);
  });
});
```

### Prueba de Integración
```javascript
// tests/integration/[flujo].test.js
describe('[Flujo] - Pruebas de Integración', () => {
  beforeEach(async () => {
    // Setup
  });

  test('Debe completar flujo [nombre]', async () => {
    // Ejecutar flujo completo
    const res = await request(app).post('/api/...');
    
    // Verificar resultado
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('...');
  });
});
```

### Prueba E2E
```javascript
// tests/e2e/[escenario].test.js
describe('[Escenario] - Pruebas E2E', () => {
  test('Usuario puede [acción]', async () => {
    // Simular interacción completa
    await page.goto('http://localhost:3000');
    await page.click('#btn-...');
    await page.waitForSelector('#resultado');
    
    // Verificar UI
    const texto = await page.textContent('#resultado');
    expect(texto).toContain('...');
  });
});
```

---

## 📚 DOCUMENTACIÓN REQUERIDA

### Por Sprint
- [ ] Notas de sprint (`docs/sprints/sprint-XX.md`)
- [ ] Changelog (`CHANGELOG.md`)
- [ ] README actualizado

### Por Fase
- [ ] Documento de arquitectura actualizado
- [ ] Guía de usuario actualizada
- [ ] Documentación API (Swagger/Postman)
- [ ] Informe de auditoría

---

## 🎯 CRITERIOS DE ÉXITO FINALES

**Al completar las 52 semanas:**

✅ **Observabilidad:** Logger estructurado + Métricas + APM (≥85%)  
✅ **Calidad:** Cobertura de tests ≥80%  
✅ **Automatización:** Flujo A→P→F automatizado (≥90%)  
✅ **Rendimiento:** Latencia API <1.5s  
✅ **Estabilidad:** Uptime ≥99%  
✅ **Escalabilidad:** 3 servicios desacoplados  
✅ **Móvil:** App base funcional  
✅ **Documentación:** 100% completa  

---

**Responsable funcional:** David Rojas  
**Responsable técnico:** Equipo Desarrollo CRM Sundeck  
**Última actualización:** 31 de Octubre, 2025
