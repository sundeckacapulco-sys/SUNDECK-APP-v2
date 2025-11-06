# 🏢 Sundeck CRM - Sistema Completo

**Versión**: 3.1 | **Fecha**: 31 Oct 2025 | **Estado**: ⚙️ 70% FUNCIONAL (Base sólida con brechas críticas)

**Alineado con**: `ROADMAP_MASTER.md` v1.1 | **Auditoría**: `docs/auditoria_tecnica.md`

---

## 🚀 INICIO RÁPIDO

```bash
npm install
cp .env.example .env
npm run dev
```

**Acceso**: http://localhost:3000 (Frontend) | http://localhost:5001 (Backend)

---

## 📊 ESTADO DE MÓDULOS (Auditoría Oct 2025)

| Módulo | Estado | Cobertura | Observaciones |
|--------|--------|-----------|---------------|
| **Prospectos** | ✅ | 95% | API completa, hooks documentados |
| **Proyectos** | ✅ | 90% | CRUD completo, sincronización operativa |
| **Levantamientos** | ✅ | 85% | 13 campos técnicos por pieza |
| **Cotizaciones** | ✅ | 90% | En vivo + Directas + PDF/Excel |
| **Instalaciones** | ✅ | 85% | API completa, módulo UI independiente |
| **KPIs** | ✅ | 80% | Dashboard, conversión, pérdidas |
| **PDF/Excel** | ✅ | 90% | Exportación unificada |
| **Pedidos** | ⚠️ | 50% | **CRÍTICO**: Duplicidad `Pedido` vs `ProyectoPedido` |
| **Fabricación** | ⚠️ | 30% | **BLOQUEANTE**: Sin imports, no funcional |
| **IA/Automatización** | ⚠️ | 10% | **CRÍTICO**: Endpoints simulados, sin modelos reales |
| **Observabilidad** | ❌ | 0% | **CRÍTICO**: Sin logger estructurado ni métricas reales |

**Resumen**: 7 módulos funcionales ✅ | 3 módulos parciales ⚠️ | 1 elemento crítico pendiente ❌

---

## 📏 SISTEMA DE LEVANTAMIENTOS

### Modal Selector Inteligente

Al hacer clic en "📏 Agregar Medidas":

**📋 Sin Precios** → `AgregarMedidaPartidasModal.jsx`
- Solo información técnica
- 13 campos por pieza
- Sin cálculos de precios

**💰 Con Precios** → `AgregarMedidasProyectoModal.jsx`
- Información técnica + precios
- Motorización completa
- Instalación especial
- Cálculos automáticos

### 13 Campos Técnicos por Pieza

1. Ancho (m)
2. Alto (m)
3. Galería (Sí/No)
4. Base/Tabla (7cm, 15cm, 18cm)
5. Control (Izquierdo/Derecho)
6. Caída (Normal, Hacia el frente, Caída)
7. Tipo de Instalación (Muro, Techo, Empotrado, Piso a Techo)
8. Tipo de Fijación (Concreto, Tablaroca, Aluminio, Madera)
9. Modo de Operación (Manual, Motorizado, Micro)
10. Sistema (Roller, Zebra, Panel, Romana, Vertical, Madera)
11. Detalle Técnico (Traslape, Corte, Sin traslape, etc.)
12. Traslape (No aplica, 5cm, 10cm, 15cm, 20cm, Otro)
13. Tela/Marca

---

## 💰 COTIZACIÓN EN VIVO

### Estructura Jerárquica (3 Niveles)

**NIVEL 1: Especificaciones Generales** (siempre visible)
- Cantidad, Área Total, Color, Modelo, Precio/m²

**NIVEL 2: Medidas Individuales** (acordeón)
- Acordeón principal + sub-acordeones por pieza
- 13 campos técnicos + precio individual

**NIVEL 3: Complementos** (acordeones)
- ⚡ **Motorización**: Motor, Control, Cálculos automáticos
- 🔧 **Instalación Especial**: 3 tipos de cobro (Fijo, Por Pieza, Base+Pieza)
- 📝 **Observaciones**: Notas generales

### Cálculos Automáticos

```
Productos: Área × Precio × Cantidad
+ Motorización: (Motores × Precio) + (Controles × Precio)
+ Instalación: Según tipo de cobro
= Subtotal
- Descuento (% o Fijo)
= Subtotal con Descuento
+ IVA 16% (si aplica)
= TOTAL FINAL
```

---

## 🔧 INSTALACIONES CON IA

### Sugerencias Automáticas

- **Cuadrilla Óptima**: Por especialidades requeridas
- **Tiempo Estimado**: Basado en datos históricos
- **Herramientas**: Detección automática
- **Mejor Fecha**: Análisis de múltiples factores
- **Complejidad**: Puntuación 0-100

### Niveles de Confianza

- Tiempo: 60-95%
- Cuadrilla: 15-95%
- Herramientas: 85%
- Fecha: 75%

---

## 📁 ESTRUCTURA CLAVE

```
SUNDECK-APP-v2/
├── client/src/
│   ├── modules/proyectos/components/
│   │   ├── AgregarMedidasProyectoModal.jsx    ← MODAL PRINCIPAL (con precios)
│   │   ├── AgregarMedidaPartidasModal.jsx     ← MODAL SIN PRECIOS
│   │   └── LevantamientoTab.jsx               ← INTEGRACIÓN
│   └── components/Prospectos/hooks/
│       └── usePiezasManager.js                 ← LÓGICA DE PIEZAS
├── server/
│   ├── models/
│   │   ├── Proyecto.js                         ← NÚCLEO CENTRAL
│   │   ├── Cotizacion.js
│   │   └── Instalacion.js
│   ├── controllers/
│   │   ├── proyectoController.js
│   │   └── instalacionController.js
│   └── services/
│       ├── exportNormalizer.js                 ← UNIFICADOR PDF/EXCEL
│       ├── instalacionesInteligentesService.js ← IA
│       └── kpisInstalacionesService.js
└── Documentación/
    ├── README_MASTER.md                        ← ESTE ARCHIVO
    ├── PRUEBAS_EJECUTAR_AHORA.md
    └── PENDIENTES_COTIZACION_EN_VIVO.md
```

---

## 🎯 ROADMAP DE 12 MESES (Alineado con ROADMAP_MASTER.md)

### ⚙️ FASE 0: Baseline y Observabilidad (0-1 mes) - 30%
**Objetivo**: Inventariar dependencias, definir métricas base y habilitar trazabilidad mínima.

**Estado actual**:
- ✅ Inventario completo de dependencias documentado
- ❌ **CRÍTICO**: Logger estructurado pendiente (solo `console.log`)
- ❌ **BLOQUEANTE**: Carpeta `/logs/` no existe
- ⚙️ KPIs baseline con valores simulados (sin instrumentación real)

**Próximos pasos**: Ver `docschecklists/PLAN_ACCION_INMEDIATO.md`

---

### 🧱 FASE 1: Desacoplo y Confiabilidad (1-4 meses) - 25%
**Objetivo**: Reducir complejidad del modelo `Proyecto` y unificar validaciones front/back.

**Estado actual**:
- ⚙️ Subdocumentos parcialmente extraídos (levantamientos, cotizaciones)
- ✅ Hooks unificados (`usePiezasManager`)
- ❌ **CRÍTICO**: Duplicidad `Pedido` vs `ProyectoPedido` sin resolver
- ❌ **BLOQUEANTE**: Módulo Fabricación sin imports
- ❌ 0% cobertura de pruebas unitarias

**Bloqueantes**: Unificar dominio de pedidos, corregir fabricación

---

### 🤖 FASE 2: Orquestación y Automatización (4-8 meses) - 5%
**Objetivo**: Automatizar flujo "Aprobado → Pedido → Fabricación" mediante reglas declarativas.

**Estado actual**:
- ❌ EventBus local no implementado
- ❌ Motor de reglas pendiente
- ❌ **CRÍTICO**: IA simulada (endpoints con textos estáticos)
- ❌ Panel operativo no iniciado

**Dependencias**: Requiere completar Fase 0 (logger) y Fase 1 (unificar pedidos)

---

### 🚀 FASE 3: Escalamiento y API-Ready (8-12 meses) - 0%
**Objetivo**: Arquitectura modular y multicanal sin costos de infraestructura externa.

**Estado actual**:
- ❌ Servicios no separados
- ❌ Contratos OpenAPI/GraphQL no documentados
- ❌ Gateway local no configurado
- ❌ App móvil no iniciada

**Dependencias**: Requiere completar Fases 0, 1 y 2

---

### 💼 EXTENSIÓN SaaS PATH
**Nivel 1 - Personal**: ✅ CRM interno funcional (versión actual)  
**Nivel 2 - Multiusuario**: ⚙️ Separación por `tenantId` en proceso  
**Nivel 3 - Membresías**: ❌ Gestión manual de accesos pendiente  
**Nivel 4 - SaaS completo**: ❌ Multi-tenant + Billing futuro

---

## 🔌 API ENDPOINTS PRINCIPALES

```
# Proyectos
PATCH  /api/proyectos/:id/levantamiento     # Guardar levantamiento
POST   /api/proyectos/:id/cotizaciones      # Guardar cotización
GET    /api/proyectos/:id/generar-pdf       # Generar PDF

# Instalaciones
POST   /api/instalaciones/sugerencias       # Sugerencias IA
GET    /api/kpis/instalaciones              # KPIs
```

---

## 📖 GUÍA RÁPIDA DE USO

### Levantamiento Técnico (Sin Precios)
```
1. Proyectos → Seleccionar → Levantamiento
2. "📏 Agregar Medidas" → "📋 Sin Precios"
3. Llenar especificaciones generales
4. Expandir "Medidas Individuales"
5. Llenar 13 campos por pieza
6. "Guardar Levantamiento"
```

### Cotización en Vivo (Con Precios)
```
1. Proyectos → Seleccionar → Levantamiento
2. "📏 Agregar Medidas" → "💰 Con Precios"
3. Llenar especificaciones + Precio General
4. Expandir "Medidas Individuales" + llenar
5. Si aplica: Expandir "⚡ Motorización"
6. Si aplica: Expandir "🔧 Instalación Especial"
7. Configurar descuentos y facturación
8. "Guardar Cotización" → "Ver PDF"
```

### Instalación con IA
```
1. Instalaciones → "Programar Instalación"
2. Seleccionar proyecto
3. IA genera sugerencias automáticas
4. "Aplicar Sugerencias" o ajustar manual
5. Guardar instalación
```

---

## 🐛 SOLUCIÓN RÁPIDA

**Puerto ocupado**: `netstat -ano | findstr :3000` → `taskkill /PID [PID] /F`  
**MongoDB error**: Verificar `mongod` corriendo y `.env` configurado  
**Módulos faltantes**: `rm -rf node_modules && npm install`  
**CORS error**: Verificar `server/index.js` permite `localhost:3000`

---

## 📊 STACK TECNOLÓGICO

**Frontend**: React 18 + Material-UI 5 + Axios  
**Backend**: Node.js + Express + MongoDB + Mongoose  
**Servicios**: Puppeteer (PDF) + ExcelJS + OpenAI (IA)  
**Auth**: JWT

---

## 🚨 BLOQUEANTES CRÍTICOS IDENTIFICADOS

**Ver plan de acción completo en**: `docschecklists/PLAN_ACCION_INMEDIATO.md`

1. **Logger Estructurado** (Fase 0) - Sin trazabilidad ni métricas reales
2. **Unificar Dominio Pedidos** (Fase 1) - Duplicidad `Pedido` vs `ProyectoPedido`
3. **Corregir Fabricación** (Fase 1) - Módulo sin imports, no funcional
4. **Métricas Baseline Reales** (Fase 0) - Solo valores simulados
5. **IA Funcional** (Fase 2) - Endpoints simulados sin modelos reales

**Tiempo estimado de resolución**: 2-3 semanas

---

## 📝 DOCUMENTOS RELACIONADOS

### Roadmap y Planificación
- `docschecklists/ROADMAPMASTER.md` - Roadmap maestro de 12 meses
- `docschecklists/ROADMAP_TASKS.md` - Checklist operativo con estados
- `docschecklists/PLAN_ACCION_INMEDIATO.md` - Plan para resolver bloqueantes

### Auditoría y Arquitectura
- `docs/auditoria_tecnica.md` - Auditoría completa Oct 2025
- `docs/architecture_map.md` - Mapa de arquitectura del sistema
- `docs/metrics_baseline.md` - Métricas baseline (valores simulados)

### Funcionalidades Específicas
- `PRUEBAS_EJECUTAR_AHORA.md` - Plan de pruebas detallado
- `PENDIENTES_COTIZACION_EN_VIVO.md` - Funcionalidades pendientes
- `RESUMEN_SESION_FASE_4_Y_5.md` - Resumen de implementación

---

## 📊 KPIs GLOBALES (Metas vs Actual)

| Categoría | Meta | Actual | Gap |
|-----------|------|--------|-----|
| **Estabilidad** | ≥99% | ~95% | -4% |
| **Rendimiento** | <1.5s | ? | Sin métricas |
| **Calidad (Tests)** | ≥80% | 0% | -80% 🔴 |
| **Automatización** | ≥90% | ~20% | -70% 🔴 |
| **Observabilidad** | ≥85% | 0% | -85% 🔴 |
| **IA Precisión** | ≥80% | 0% | -80% 🔴 |

---

**Desarrollado por**: Equipo Sundeck + Cascade AI  
**Responsable funcional**: David Rojas - Dirección General Sundeck  
**Responsable técnico**: Equipo Desarrollo CRM Sundeck  
**Última actualización**: 31 de Octubre, 2025
