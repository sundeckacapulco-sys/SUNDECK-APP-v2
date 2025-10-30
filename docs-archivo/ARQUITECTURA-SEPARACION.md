# SEPARACIÓN DE RESPONSABILIDADES: PROYECTOS vs INSTALACIONES

## 🏗️ PROBLEMA IDENTIFICADO

Actualmente **Proyectos** e **Instalaciones** están mezclados, cuando deben ser módulos independientes con funciones específicas.

## ✅ ARQUITECTURA CORRECTA

### 📋 MÓDULO PROYECTOS (Gestión General)

**Responsabilidad:** Coordinación y seguimiento general del proyecto completo

**Funciones:**
- Gestión del flujo completo: `levantamiento → cotización → aprobado → fabricación → instalación → completado`
- Coordinación entre etapas
- Documentación general (PDF/Excel)
- Seguimiento financiero
- Comunicación con cliente
- Asignación de responsables

**Estados que maneja:**
```javascript
estados: ['levantamiento', 'cotización', 'aprobado', 'fabricación', 'instalación', 'completado']
```

**Vista principal:** `/proyectos`
- Lista de todos los proyectos
- Filtros por estado general
- Acciones de coordinación
- Cambios de estado del proyecto

### 🔧 MÓDULO INSTALACIONES (Área Específica)

**Responsabilidad:** Gestión operativa de instalaciones únicamente

**Funciones:**
- Programación de instalaciones
- Asignación de equipos técnicos
- Control de calidad en sitio
- Evidencias fotográficas
- Checklist técnico
- Conformidad del cliente
- Reportes de instalación

**Estados que maneja:**
```javascript
estados: ['programada', 'en_proceso', 'pausada', 'completada', 'cancelada']
```

**Vista principal:** `/instalaciones`
- Lista de instalaciones programadas/en proceso
- Calendario de instalaciones
- Asignación de cuadrillas
- Evidencias y reportes

## 🔄 RELACIÓN ENTRE MÓDULOS

```
PROYECTO (General)                    INSTALACIÓN (Específica)
├── Estado: "instalación"       ──→   ├── Estado: "programada"
├── Coordinador asignado              ├── Cuadrilla asignada
├── Cliente contactado                ├── Fecha programada
└── Documentos listos                 └── Checklist técnico

Cuando instalación → "completada"
Proyecto → "completado"
```

## 📁 ESTRUCTURA DE ARCHIVOS PROPUESTA

```
client/src/
├── modules/
│   ├── proyectos/                    # Gestión general
│   │   ├── ProyectosList.jsx
│   │   ├── ProyectoDetail.jsx
│   │   ├── ProyectoForm.jsx
│   │   └── services/proyectosApi.js
│   │
│   └── instalaciones/                # Área específica (NUEVO)
│       ├── InstalacionesList.jsx
│       ├── InstalacionDetail.jsx
│       ├── CalendarioInstalaciones.jsx
│       ├── EvidenciasModal.jsx
│       └── services/instalacionesApi.js
│
└── components/
    └── Dashboards/
        ├── DashboardProyectos.jsx    # Overview general
        └── DashboardInstalaciones.jsx # Overview técnico
```

## 🛠️ IMPLEMENTACIÓN NECESARIA

### 1. Crear módulo independiente de instalaciones
- [ ] `client/src/modules/instalaciones/`
- [ ] Componentes específicos para gestión técnica
- [ ] API separada para operaciones de instalación

### 2. Separar rutas en App.js
```javascript
// ANTES (INCORRECTO)
<Route path="/instalaciones" element={<Navigate to="/proyectos" replace />} />

// DESPUÉS (CORRECTO)
<Route path="/instalaciones" element={<InstalacionesList />} />
<Route path="/instalaciones/:id" element={<InstalacionDetail />} />
```

### 3. Funcionalidades específicas de instalaciones
- [ ] Calendario de programación
- [ ] Asignación de cuadrillas
- [ ] Checklist técnico
- [ ] Captura de evidencias
- [ ] Reportes de conformidad

### 4. Sincronización entre módulos
- [ ] Cuando proyecto → "instalación": crear registro en instalaciones
- [ ] Cuando instalación → "completada": actualizar proyecto → "completado"

## 🎯 BENEFICIOS DE LA SEPARACIÓN

**Para Coordinadores (Proyectos):**
- Vista general del flujo completo
- Seguimiento de estados y tiempos
- Comunicación con clientes
- Reportes financieros

**Para Técnicos (Instalaciones):**
- Vista operativa específica
- Herramientas técnicas especializadas
- Evidencias y calidad
- Programación de cuadrillas

**Para la Empresa:**
- Roles claramente definidos
- Métricas específicas por área
- Mejor control de calidad
- Procesos optimizados

## ⚡ SIGUIENTE PASO

Crear el módulo `client/src/modules/instalaciones/` con la estructura modular similar a proyectos pero enfocado en la gestión técnica específica.
