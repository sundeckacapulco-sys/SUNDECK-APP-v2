# 🔍 FASE 3: Auditoría y Documentación del Sistema

**Última actualización:** 4 Noviembre 2025 - 18:12  
**Estado:** Fase 3 EN PROGRESO (0%)  
**Objetivo:** Revisar y documentar el estado actual sin modificar código ni datos

---

## 🎯 OBJETIVO PRINCIPAL

**Generar una radiografía técnica completa del CRM** para:
- Saber qué está funcionando bien
- Identificar duplicidades o riesgos
- Detectar oportunidades de optimización
- **SIN alterar flujo comercial, pedidos ni KPIs**

---

## 📋 TAREAS DETALLADAS

### Tarea 1: Auditoría de Modelos 📊

**Objetivo:** Documentar estructura y relaciones de modelos principales

#### Modelos a Revisar:
1. **Proyecto** (`server/models/Proyecto.js`)
   - Campos principales
   - Relaciones con otros modelos
   - Métodos disponibles
   - Estado: ✅ Activo / ⚙️ Parcial / ❌ Inactivo

2. **Pedido** (`server/models/Pedido.js`)
   - Campos principales
   - Relación con Proyecto
   - Flujo de estados
   - Duplicidades con ProyectoPedido

3. **ProyectoPedido.legacy** (`server/models/ProyectoPedido.legacy.js`)
   - Estado de deprecación
   - Uso actual en el código
   - Plan de migración

4. **Cotización** (`server/models/Cotizacion.js`)
   - Campos principales
   - Relación con Proyecto/Pedido
   - Flujo de conversión

5. **Instalación** (`server/models/Instalacion.js`)
   - Campos principales
   - Relación con Proyecto
   - Flujo de programación

6. **Otros modelos relevantes:**
   - Prospecto
   - OrdenFabricacion
   - Usuario
   - KPI

#### Análisis Requerido:
```markdown
Para cada modelo documentar:
- ✅ Estado (Activo/Parcial/Inactivo)
- 📊 Campos principales y tipos
- 🔗 Relaciones (populate, refs)
- ⚙️ Métodos y hooks
- ⚠️ Campos duplicados entre modelos
- 💡 Observaciones y riesgos
```

#### Comandos Útiles:
```bash
# Listar todos los modelos
ls server/models/*.js

# Ver estructura de un modelo
code server/models/Proyecto.js

# Buscar referencias a un modelo
rg "require.*Proyecto" server --type js
rg "Proyecto\.find" server --type js
```

---

### Tarea 2: Auditoría de Controllers y Routes 🛣️

**Objetivo:** Mapear todos los endpoints y su estado funcional

#### Controllers a Revisar:
1. **proyectoController.js**
   - Endpoints disponibles
   - Validaciones
   - Manejo de errores
   - Estado funcional

2. **cotizacionController.js**
   - Endpoints disponibles
   - Integración con servicios
   - Estado funcional

3. **pedidoController.js** / **proyectoPedidoController.js**
   - Identificar duplicidad
   - Endpoints activos
   - Estado funcional

4. **fabricacionController.js**
   - Endpoints disponibles (ya refactorizado)
   - Estado funcional

5. **exportacionController.js**
   - Funcionalidades de exportación
   - Estado funcional

#### Routes a Revisar:
```bash
# Listar todas las rutas
ls server/routes/*.js

# Ver estructura de rutas
code server/routes/proyectos.js
code server/routes/cotizaciones.js
code server/routes/pedidos.js
code server/routes/instalaciones.js
code server/routes/fabricacion.js
```

#### Análisis Requerido:
```markdown
Para cada endpoint documentar:
- Método HTTP (GET/POST/PUT/PATCH/DELETE)
- Ruta completa
- Middleware aplicado (auth, permisos)
- Controller/handler
- ✅ Funcional / ⚙️ Parcial / ❌ No funcional / ❓ Sin probar
- Validaciones presentes
- Manejo de errores
- Tests disponibles
```

#### Comandos Útiles:
```bash
# Buscar definiciones de rutas
rg "router\.(get|post|put|patch|delete)" server/routes --type js

# Buscar endpoints específicos
rg "'/api/" server/routes --type js

# Ver middleware de autenticación
rg "auth.*verificarPermiso" server/routes --type js
```

---

### Tarea 3: Auditoría de Servicios 🔧

**Objetivo:** Documentar servicios y su integración

#### Servicios a Revisar:

**1. Servicios de Datos:**
- `fabricacionService.js` - ✅ Actualizado en Fase 2
- `instalacionesInteligentesService.js` - ✅ Actualizado en Fase 1
- `cotizacionMappingService.js`
- `validacionTecnicaService.js`

**2. Servicios de Exportación:**
- `pdfService.js` - ✅ Tests en Fase 2
- `excelService.js` - ✅ Tests en Fase 2

**3. Servicios de IA:**
- `openaiService.js`
- `claudeService.js`
- `geminiService.js`

**4. Servicios de Infraestructura:**
- `logger` (config/logger.js) - ✅ Implementado en Fase 0
- Conexión MongoDB
- Middleware de métricas

#### Análisis Requerido:
```markdown
Para cada servicio documentar:
- ✅ Estado (Activo/Parcial/Inactivo)
- 🎯 Propósito principal
- 📥 Dependencias externas
- 🔗 Integración con otros módulos
- ⚙️ Métodos principales
- ✅ Tests disponibles
- ⚠️ Riesgos o problemas
- 💡 Sugerencias de optimización
```

#### Flujo Completo a Documentar:
```
Levantamiento → Cotización → Pedido → Fabricación → Instalación
     ↓              ↓           ↓           ↓            ↓
  [Modelo]      [Modelo]    [Modelo]    [Modelo]    [Modelo]
     ↓              ↓           ↓           ↓            ↓
[Controller]  [Controller][Controller][Controller][Controller]
     ↓              ↓           ↓           ↓            ↓
 [Service]     [Service]   [Service]   [Service]   [Service]
     ↓              ↓           ↓           ↓            ↓
   [PDF]         [PDF]       [PDF]       [PDF]       [PDF]
  [Excel]       [Excel]     [Excel]     [Excel]     [Excel]
```

#### Comandos Útiles:
```bash
# Listar todos los servicios
ls server/services/*.js

# Ver dependencias de un service
rg "require" server/services/fabricacionService.js

# Buscar uso de servicios
rg "FabricacionService" server --type js
```

---

### Tarea 4: Documento de Auditoría 📄

**Objetivo:** Crear documento consolidado con hallazgos

#### Estructura del Documento:

```markdown
# 🔍 Auditoría del Sistema CRM Sundeck

**Fecha:** 4 Noviembre 2025
**Versión:** 1.0
**Responsable:** [Nombre del Agente]

---

## 📊 RESUMEN EJECUTIVO

### Estado General
- Módulos activos: X
- Módulos parciales: Y
- Módulos inactivos: Z
- Riesgos críticos: N
- Oportunidades de optimización: M

### Hallazgos Principales
1. [Hallazgo 1]
2. [Hallazgo 2]
3. [Hallazgo 3]

---

## 🗂️ AUDITORÍA DE MODELOS

### Proyecto ✅
**Estado:** Activo
**Ubicación:** `server/models/Proyecto.js`
**Líneas:** 1,241

**Campos Principales:**
- numero: String
- cliente: ObjectId → Prospecto
- productos: Array
- cronograma: Object
- fabricacion: Object
- instalacion: Object
- pagos: Object
- notas: Array

**Relaciones:**
- → Prospecto (cliente)
- → Cotizacion (cotizacion)
- → Usuario (creadoPor)

**Métodos:**
- generarEtiquetasProduccion()
- calcularTiempoInstalacion()
- generarRecomendacionesInstalacion()
- optimizarRutaDiaria() [static]

**Observaciones:**
- ✅ Modelo bien estructurado
- ✅ Métodos inteligentes implementados
- ⚠️ [Cualquier observación]

**Riesgos:** Ninguno detectado

---

### Pedido ⚙️
**Estado:** Parcial (duplicidad con ProyectoPedido)
**Ubicación:** `server/models/Pedido.js`

[Continuar con análisis similar...]

---

### ProyectoPedido.legacy ❌
**Estado:** Deprecado
**Ubicación:** `server/models/ProyectoPedido.legacy.js`

**Observaciones:**
- ✅ Correctamente marcado como legacy
- ⚠️ Aún en uso en X archivos
- 💡 Migración pendiente

---

## 🛣️ AUDITORÍA DE ENDPOINTS

### Proyectos

#### GET /api/proyectos ✅
**Estado:** Funcional
**Controller:** proyectoController.obtenerProyectos
**Auth:** ✅ Requerida
**Permisos:** proyectos:leer
**Tests:** ❌ No disponibles
**Observaciones:** Funciona correctamente

#### POST /api/proyectos ✅
**Estado:** Funcional
[Continuar...]

---

## 🔧 AUDITORÍA DE SERVICIOS

### FabricacionService ✅
**Estado:** Activo y actualizado
**Ubicación:** `server/services/fabricacionService.js`
**Tests:** ✅ 5/5 pasando

**Métodos:**
- obtenerColaFabricacion()
- obtenerMetricas()
- [etc...]

**Dependencias:**
- Proyecto (modelo)
- CotizacionMappingService
- Logger

**Observaciones:**
- ✅ Refactorizado en Fase 2
- ✅ Bien integrado
- ✅ Tests completos

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### Levantamiento → Cotización
**Estado:** ✅ Funcional
**Modelos:** Prospecto → Cotizacion
**Controllers:** cotizacionController
**Services:** cotizacionMappingService
**Observaciones:** [...]

### Cotización → Pedido
**Estado:** ⚙️ Parcial (duplicidad)
[Continuar...]

---

## ⚠️ RIESGOS IDENTIFICADOS

### Críticos 🔴
1. **[Riesgo 1]**
   - Descripción
   - Impacto
   - Recomendación

### Medios 🟡
[...]

### Bajos 🟢
[...]

---

## 💡 SUGERENCIAS DE OPTIMIZACIÓN

### Inmediatas (sin alterar datos)
1. **[Sugerencia 1]**
   - Descripción
   - Beneficio
   - Esfuerzo estimado

### Corto Plazo
[...]

### Largo Plazo
[...]

---

## 📊 MÉTRICAS DEL SISTEMA

### Código
- Modelos: X
- Controllers: Y
- Routes: Z
- Services: W
- Tests: 32/32 ✅

### Cobertura
- Controllers con tests: X%
- Services con tests: Y%
- Routes con tests: Z%

---

## ✅ CONCLUSIONES

### Fortalezas
1. [...]
2. [...]

### Áreas de Mejora
1. [...]
2. [...]

### Próximos Pasos Recomendados
1. [...]
2. [...]

---

**Fin del Documento**
```

---

## 📋 CHECKLIST DE EJECUCIÓN

### Preparación
- [ ] Leer `AGENTS.md` - Contexto completo
- [ ] Leer `RESUMEN_SESION_04_NOV_2025.md` - Estado actual
- [ ] Verificar que tests pasen: `npm test -- --runInBand`

### Tarea 1: Modelos
- [ ] Listar todos los modelos
- [ ] Analizar Proyecto.js
- [ ] Analizar Pedido.js
- [ ] Analizar ProyectoPedido.legacy.js
- [ ] Analizar Cotizacion.js
- [ ] Analizar Instalacion.js
- [ ] Documentar relaciones
- [ ] Identificar duplicidades

### Tarea 2: Controllers y Routes
- [ ] Listar todos los controllers
- [ ] Listar todas las routes
- [ ] Mapear endpoints por módulo
- [ ] Verificar estado funcional
- [ ] Identificar duplicidades
- [ ] Documentar middleware

### Tarea 3: Servicios
- [ ] Listar todos los services
- [ ] Analizar servicios de datos
- [ ] Analizar servicios de exportación
- [ ] Analizar servicios de IA
- [ ] Documentar flujo completo
- [ ] Identificar integraciones

### Tarea 4: Documento
- [ ] Crear carpeta `/docs` si no existe
- [ ] Crear `auditoria_sistema_actual.md`
- [ ] Completar sección de modelos
- [ ] Completar sección de endpoints
- [ ] Completar sección de servicios
- [ ] Completar flujo completo
- [ ] Documentar riesgos
- [ ] Agregar sugerencias
- [ ] Revisar y validar documento

---

## 🔍 COMANDOS ÚTILES

### Exploración
```bash
# Listar modelos
ls server/models/*.js

# Listar controllers
ls server/controllers/*.js

# Listar routes
ls server/routes/*.js

# Listar services
ls server/services/*.js

# Contar líneas de código
(Get-ChildItem -Recurse -Include *.js server/models | Measure-Object -Property Length -Sum).Sum
```

### Búsqueda
```bash
# Buscar uso de un modelo
rg "require.*Proyecto[^P]" server --type js

# Buscar endpoints
rg "router\.(get|post)" server/routes --type js

# Buscar populate
rg "\.populate\(" server --type js

# Buscar validaciones
rg "\.validate\(|validator\." server --type js
```

### Análisis
```bash
# Ver dependencias de un archivo
rg "^const.*require" server/models/Proyecto.js

# Contar métodos en un modelo
rg "^\s+(async\s+)?[a-zA-Z]+\s*\(" server/models/Proyecto.js

# Ver middleware en routes
rg "auth|verificarPermiso" server/routes --type js
```

---

## ⚠️ IMPORTANTE

### Reglas Estrictas
- ❌ NO modificar código
- ❌ NO modificar base de datos
- ❌ NO ejecutar scripts de migración
- ❌ NO alterar flujo comercial
- ✅ SOLO leer y documentar
- ✅ SOLO analizar y observar

### Enfoque
- Ser exhaustivo pero conciso
- Documentar hechos, no suposiciones
- Clasificar claramente: ✅ ⚙️ ❌
- Priorizar hallazgos críticos
- Sugerir optimizaciones seguras

---

## 📚 ARCHIVOS DE REFERENCIA

### Documentación Existente
- `AGENTS.md` - Estado del proyecto
- `docschecklists/MODELOS_LEGACY.md` - Modelos deprecados
- `docschecklists/FASE_1_UNIFICACION_MODELOS.md` - Unificación
- `RESUMEN_SESION_*.md` - Historial de sesiones

### Código Clave
- `server/models/Proyecto.js` - Modelo unificado
- `server/controllers/fabricacionController.js` - Controller refactorizado
- `server/services/fabricacionService.js` - Service actualizado
- `server/tests/` - Tests disponibles

---

**Responsable:** Próximo Agente  
**Duración estimada:** 1-2 días  
**Complejidad:** Media  
**Riesgo:** Ninguno (solo lectura)

**¡Listo para auditar el sistema!** 🔍📊
