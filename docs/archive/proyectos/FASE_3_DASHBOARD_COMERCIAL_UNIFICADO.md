# 📊 FASE 3 — DASHBOARD COMERCIAL UNIFICADO

**Proyecto:** SUNDECK CRM  
**Responsable:** David Rojas  
**Fecha inicio:** 7 Noviembre 2025  
**Estado:** 🚀 EN DESARROLLO

---

## 🎯 OBJETIVO

Crear el **Dashboard Comercial Unificado** que permita visualizar y gestionar tanto **prospectos** como **proyectos activos** desde una sola interfaz, con filtros dinámicos y KPIs en tiempo real.

---

## 🏗️ ARQUITECTURA

### Sistema Unificado

```
┌─────────────────────────────────────────────────────┐
│          DASHBOARD COMERCIAL UNIFICADO              │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   FILTROS    │  │     KPIs     │  │  ACCIONES│ │
│  │              │  │              │  │          │ │
│  │ • Tipo       │  │ • Total      │  │ • Crear  │ │
│  │ • Asesor     │  │ • Prospectos │  │ • Editar │ │
│  │ • Estado     │  │ • Proyectos  │  │ • Ver    │ │
│  │ • Fecha      │  │ • Conversión │  │ • Export │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │          TABLA UNIFICADA                      │ │
│  │                                               │ │
│  │  ID | Cliente | Tipo | Estado | Asesor | $  │ │
│  │  ─────────────────────────────────────────── │ │
│  │  001 | Juan P. | 🔵 Prospecto | Nuevo | AB │ │
│  │  002 | María G.| 🟢 Proyecto  | Activo| CD │ │
│  │  003 | Pedro L.| 🔵 Prospecto | Cita  | AB │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 📋 COMPONENTES A DESARROLLAR

### 1. **DashboardComercial.jsx** (Componente Principal)

**Ubicación:** `client/src/modules/proyectos/DashboardComercial.jsx`

**Funcionalidades:**
- ✅ Vista unificada de prospectos y proyectos
- ✅ Filtros dinámicos por tipo, asesor, estado
- ✅ KPIs en tiempo real
- ✅ Tabla con paginación
- ✅ Acciones rápidas (crear, editar, ver)

**Estados:**
```javascript
const [registros, setRegistros] = useState([]);
const [filtros, setFiltros] = useState({
  tipo: 'todos', // 'todos', 'prospecto', 'proyecto'
  asesor: '',
  estadoComercial: '',
  fechaDesde: null,
  fechaHasta: null
});
const [kpis, setKpis] = useState({
  total: 0,
  prospectos: 0,
  proyectos: 0,
  tasaConversion: 0
});
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);
const [limit] = useState(20);
```

---

### 2. **FiltrosComerciales.jsx** (Componente de Filtros)

**Ubicación:** `client/src/modules/proyectos/components/FiltrosComerciales.jsx`

**Campos:**
- **Tipo:** Todos | Prospectos | Proyectos
- **Asesor Comercial:** Dropdown con lista de asesores
- **Estado Comercial:** Dropdown dinámico según tipo
- **Rango de Fechas:** DatePicker de inicio y fin
- **Búsqueda:** Input de texto libre

**Diseño:**
```jsx
<Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
  <FormControl sx={{ minWidth: 150 }}>
    <InputLabel>Tipo</InputLabel>
    <Select value={filtros.tipo} onChange={handleTipoChange}>
      <MenuItem value="todos">Todos</MenuItem>
      <MenuItem value="prospecto">🔵 Prospectos</MenuItem>
      <MenuItem value="proyecto">🟢 Proyectos</MenuItem>
    </Select>
  </FormControl>
  
  <FormControl sx={{ minWidth: 200 }}>
    <InputLabel>Asesor</InputLabel>
    <Select value={filtros.asesor} onChange={handleAsesorChange}>
      <MenuItem value="">Todos</MenuItem>
      {asesores.map(a => (
        <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>
      ))}
    </Select>
  </FormControl>
  
  {/* ... más filtros */}
</Box>
```

---

### 3. **KPIsComerciales.jsx** (Componente de KPIs)

**Ubicación:** `client/src/modules/proyectos/components/KPIsComerciales.jsx`

**Métricas:**
```javascript
const kpis = {
  total: 150,           // Total de registros
  prospectos: 85,       // Prospectos activos
  proyectos: 65,        // Proyectos activos
  tasaConversion: 43,   // % de conversión
  valorTotal: 2500000,  // Valor total en pesos
  promedioTicket: 38461 // Ticket promedio
};
```

**Diseño:**
```jsx
<Grid container spacing={2} sx={{ mb: 3 }}>
  <Grid item xs={12} sm={6} md={2}>
    <Card>
      <CardContent>
        <Typography variant="h4">{kpis.total}</Typography>
        <Typography variant="caption">Total Registros</Typography>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} sm={6} md={2}>
    <Card sx={{ bgcolor: '#e3f2fd' }}>
      <CardContent>
        <Typography variant="h4" color="primary">
          {kpis.prospectos}
        </Typography>
        <Typography variant="caption">🔵 Prospectos</Typography>
      </CardContent>
    </Card>
  </Grid>
  
  <Grid item xs={12} sm={6} md={2}>
    <Card sx={{ bgcolor: '#e8f5e9' }}>
      <CardContent>
        <Typography variant="h4" color="success.main">
          {kpis.proyectos}
        </Typography>
        <Typography variant="caption">🟢 Proyectos</Typography>
      </CardContent>
    </Card>
  </Grid>
  
  {/* ... más KPIs */}
</Grid>
```

---

### 4. **TablaComercial.jsx** (Componente de Tabla)

**Ubicación:** `client/src/modules/proyectos/components/TablaComercial.jsx`

**Columnas:**
- **Tipo:** Badge visual (🔵 Prospecto | 🟢 Proyecto)
- **Cliente:** Nombre + teléfono
- **Estado:** Badge de estado comercial
- **Asesor:** Nombre del asesor asignado
- **Monto:** Valor estimado/real
- **Fecha:** Fecha de creación
- **Acciones:** Ver | Editar | Convertir (si es prospecto)

**Diseño:**
```jsx
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Tipo</TableCell>
        <TableCell>Cliente</TableCell>
        <TableCell>Estado</TableCell>
        <TableCell>Asesor</TableCell>
        <TableCell align="right">Monto</TableCell>
        <TableCell>Fecha</TableCell>
        <TableCell align="center">Acciones</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {registros.map(registro => (
        <TableRow key={registro._id} hover>
          <TableCell>
            <Chip 
              label={registro.tipo === 'prospecto' ? '🔵 Prospecto' : '🟢 Proyecto'}
              color={registro.tipo === 'prospecto' ? 'primary' : 'success'}
              size="small"
            />
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              {registro.cliente?.nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {registro.cliente?.telefono}
            </Typography>
          </TableCell>
          {/* ... más columnas */}
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### Endpoint Principal

**GET `/api/proyectos`** con filtros extendidos:

```javascript
// Parámetros de consulta
{
  page: 1,
  limit: 20,
  tipo: 'prospecto' | 'proyecto' | 'todos',
  asesorComercial: 'userId',
  estadoComercial: 'nuevo' | 'contactado' | 'cotizado' | ...,
  fechaDesde: '2025-01-01',
  fechaHasta: '2025-12-31',
  busqueda: 'texto libre'
}

// Respuesta
{
  success: true,
  data: {
    registros: [...],
    total: 150,
    page: 1,
    pages: 8,
    kpis: {
      total: 150,
      prospectos: 85,
      proyectos: 65,
      tasaConversion: 43,
      valorTotal: 2500000
    }
  }
}
```

### Endpoint de KPIs

**GET `/api/proyectos/kpis/comerciales`**

```javascript
// Respuesta
{
  success: true,
  data: {
    total: 150,
    prospectos: 85,
    proyectos: 65,
    tasaConversion: 43,
    valorTotal: 2500000,
    promedioTicket: 38461,
    porAsesor: [
      { asesor: 'Abigail', prospectos: 45, proyectos: 30 },
      { asesor: 'Carlos', prospectos: 40, proyectos: 35 }
    ],
    porEstado: {
      nuevo: 25,
      contactado: 30,
      cotizado: 20,
      activo: 40,
      completado: 35
    }
  }
}
```

---

## 🎨 DISEÑO Y UX

### Paleta de Colores

```javascript
const colores = {
  prospecto: {
    primary: '#2196f3',    // Azul
    light: '#e3f2fd',
    dark: '#1976d2'
  },
  proyecto: {
    primary: '#4caf50',    // Verde
    light: '#e8f5e9',
    dark: '#388e3c'
  },
  neutral: {
    gray: '#9e9e9e',
    lightGray: '#f5f5f5'
  }
};
```

### Estados Comerciales

**Prospectos:**
- 🆕 Nuevo
- 📞 Contactado
- 📅 Cita Agendada
- 💰 Cotizado
- ⏸️ En Pausa
- ❌ Perdido

**Proyectos:**
- ✅ Activo
- 🏗️ En Fabricación
- 🚚 En Instalación
- ✔️ Completado
- ⏸️ Pausado

---

## 📊 FUNCIONALIDADES AVANZADAS

### 1. Conversión de Prospecto a Proyecto

**Botón:** "Convertir a Proyecto"  
**Acción:**
```javascript
const convertirAProyecto = async (prospectoId) => {
  try {
    const res = await axiosConfig.post(`/proyectos/${prospectoId}/convertir`);
    
    // Actualizar lista
    cargarRegistros();
    
    // Notificación
    toast.success('Prospecto convertido a proyecto exitosamente');
  } catch (error) {
    toast.error('Error al convertir prospecto');
  }
};
```

### 2. Exportación de Datos

**Formatos:** Excel | PDF | CSV

**Botón:** "Exportar"  
**Opciones:**
- Exportar filtrados
- Exportar todos
- Exportar seleccionados

### 3. Acciones Masivas

**Checkbox de selección múltiple**  
**Acciones:**
- Asignar asesor
- Cambiar estado
- Eliminar
- Exportar

---

## 🔄 FLUJO DE TRABAJO

### Crear Nuevo Prospecto

```
Dashboard → Botón "Nuevo Prospecto" → Modal/Formulario → Guardar → Actualizar Lista
```

### Convertir a Proyecto

```
Dashboard → Seleccionar Prospecto → "Convertir" → Confirmación → Actualizar Lista
```

### Ver Detalles

```
Dashboard → Click en Registro → Vista Detallada (ProyectoDetail.jsx)
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 3.1: Componentes Base
- [ ] Crear `DashboardComercial.jsx`
- [ ] Crear `FiltrosComerciales.jsx`
- [ ] Crear `KPIsComerciales.jsx`
- [ ] Crear `TablaComercial.jsx`

### Fase 3.2: Lógica de Negocio
- [ ] Implementar filtros dinámicos
- [ ] Implementar paginación
- [ ] Implementar búsqueda
- [ ] Implementar ordenamiento

### Fase 3.3: Integración Backend
- [ ] Actualizar endpoint `/api/proyectos` con filtros
- [ ] Crear endpoint `/api/proyectos/kpis/comerciales`
- [ ] Crear endpoint `/api/proyectos/:id/convertir`
- [ ] Implementar cálculo de KPIs

### Fase 3.4: Funcionalidades Avanzadas
- [ ] Implementar conversión prospecto → proyecto
- [ ] Implementar exportación de datos
- [ ] Implementar acciones masivas
- [ ] Implementar notificaciones

### Fase 3.5: Testing y Optimización
- [ ] Pruebas de filtros
- [ ] Pruebas de paginación
- [ ] Pruebas de conversión
- [ ] Optimización de rendimiento

---

## 📝 NOTAS TÉCNICAS

### Optimización de Consultas

```javascript
// Usar índices en MongoDB
db.proyectos.createIndex({ tipo: 1, estadoComercial: 1, asesorComercial: 1 });
db.proyectos.createIndex({ createdAt: -1 });
db.proyectos.createIndex({ 'cliente.nombre': 'text', 'cliente.telefono': 'text' });
```

### Caché de KPIs

```javascript
// Cachear KPIs por 5 minutos
const cacheKPIs = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const obtenerKPIs = async (filtros) => {
  const cacheKey = JSON.stringify(filtros);
  const cached = cacheKPIs.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const kpis = await calcularKPIs(filtros);
  cacheKPIs.set(cacheKey, { data: kpis, timestamp: Date.now() });
  
  return kpis;
};
```

---

## 🚀 PRÓXIMOS PASOS

1. **Implementar componentes base** (Fase 3.1)
2. **Integrar con backend** (Fase 3.2)
3. **Agregar funcionalidades avanzadas** (Fase 3.3)
4. **Testing y optimización** (Fase 3.4)

---

**Estado:** 🚀 Listo para comenzar desarrollo  
**Prioridad:** ALTA  
**Fecha estimada de completación:** 10 Noviembre 2025
