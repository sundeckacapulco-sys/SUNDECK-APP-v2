# 📋 INSTRUCCIÓN — INTEGRACIÓN DE FORMULARIOS COMERCIALES

**Fecha:** 6 Noviembre 2025  
**Fase:** 1 de 6 — Sincronización de Interfaz  
**Responsable:** Agente Codex  

---

## 🎯 OBJETIVO

Actualizar la interfaz de usuario para reflejar la nueva estructura unificada del modelo `Proyecto.js`:

1. Crear y gestionar prospectos desde el CRM
2. Convertir prospectos a proyectos sin pérdida de datos
3. Visualizar trazabilidad comercial completa
4. Filtrar y buscar por campos comerciales

---

## 📂 COMPONENTES A CREAR

### Frontend (React)

```
client/src/
├── modules/prospectos/
│   ├── FormularioProspecto.jsx 🆕
│   └── DetalleProspecto.jsx 🆕
├── components/comercial/
│   ├── SelectorAsesor.jsx 🆕
│   ├── SelectorFuente.jsx 🆕
│   ├── SelectorEstadoComercial.jsx 🆕
│   ├── HistorialEstados.jsx 🆕
│   └── NotasSeguimiento.jsx 🆕
└── components/shared/
    └── FiltrosComerciales.jsx 🆕
```

---

## 🔧 COMPONENTES PRINCIPALES

### 1. FormularioProspecto.jsx

**Campos obligatorios:**
- Cliente: nombre, teléfono
- Origen comercial: fuente
- Asesor comercial
- Primera nota de seguimiento

**Funcionalidad:**
- POST `/api/proyectos` con `tipo: "prospecto"`
- Validación de campos
- Feedback visual de éxito/error

### 2. SelectorAsesor.jsx

**Funcionalidad:**
- GET `/api/usuarios?rol=asesor`
- Dropdown con lista de asesores
- Valor por defecto: usuario logueado

### 3. HistorialEstados.jsx

**Funcionalidad:**
- Visualizar `proyecto.historialEstados[]`
- Timeline vertical con fechas
- Mostrar usuario que realizó el cambio

### 4. NotasSeguimiento.jsx

**Funcionalidad:**
- Listar `proyecto.seguimiento[]`
- Agregar nueva nota: POST `/api/prospectos/:id/agregar-nota`
- Tipos: nota, llamada, whatsapp, email, visita

### 5. FiltrosComerciales.jsx

**Filtros disponibles:**
- Tipo (prospecto/proyecto)
- Asesor comercial
- Fuente de origen
- Estado comercial

**Funcionalidad:**
- Construir query params
- GET `/api/proyectos?tipo=prospecto&asesor=...`

---

## 📊 FLUJO DE USUARIO

### Crear Prospecto

```
1. Usuario abre "Nuevo Prospecto"
2. Completa formulario (cliente + comercial + nota)
3. Submit → POST /api/proyectos
4. Sistema crea con tipo="prospecto"
5. historialEstados registra estado inicial
6. Redirección a detalle del prospecto
```

### Agregar Nota de Seguimiento

```
1. Usuario abre detalle de prospecto
2. Escribe nota en componente NotasSeguimiento
3. Submit → POST /api/prospectos/:id/agregar-nota
4. Sistema actualiza seguimiento[]
5. Sistema actualiza ultimaNota
6. Nota visible inmediatamente
```

### Filtrar Dashboard

```
1. Usuario selecciona filtros
2. FiltrosComerciales construye query
3. GET /api/proyectos?tipo=prospecto&asesor=...
4. Lista se actualiza automáticamente
5. Contador de resultados visible
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Frontend
- [ ] Crear FormularioProspecto.jsx
- [ ] Crear SelectorAsesor.jsx
- [ ] Crear SelectorFuente.jsx
- [ ] Crear SelectorEstadoComercial.jsx
- [ ] Crear HistorialEstados.jsx
- [ ] Crear NotasSeguimiento.jsx
- [ ] Crear FiltrosComerciales.jsx
- [ ] Actualizar ListaProyectos.jsx
- [ ] Actualizar DetalleProyecto.jsx
- [ ] Integrar en rutas principales

### Backend (Completado)
- [x] Modelo Proyecto.js actualizado
- [x] Endpoints de prospectos activos
- [x] Middleware historialEstados operativo

---

## 🎯 RESULTADO ESPERADO

1. ✅ Formulario unificado para prospectos
2. ✅ Dashboard con filtros comerciales
3. ✅ Visualización de historial de estados
4. ✅ Gestión de notas de seguimiento
5. ✅ Interfaz sincronizada con backend

---

**Duración estimada:** 5 días  
**Prioridad:** Alta  
**Estado:** Pendiente de implementación
