# 📊 MEJORA: KPI "EN RIESGO" - PROYECTOS CRÍTICOS

**Fecha de solicitud:** 8 Noviembre 2025  
**Prioridad:** Media-Alta  
**Fase sugerida:** Fase 2 (Automatización) o mejora inmediata  
**Estado:** ⏳ PENDIENTE DE IMPLEMENTACIÓN

---

## 🎯 OBJETIVO

Agregar un KPI específico llamado **"En Riesgo"** que muestre la cantidad de proyectos en estado **"Crítico"**.

---

## 📋 REQUISITOS

### KPI Actual: "En Seguimiento"

**Ubicación:** `client/src/modules/proyectos/components/KPIsComerciales.jsx`

**Actualmente muestra:**
- Prospectos en estados: `nuevo`, `contactado`, `en_seguimiento`, `cita_agendada`, `cotizado`

### KPI Nuevo: "En Riesgo"

**Debe mostrar:**
- Proyectos en estado: `critico`
- Color: Rojo (#d32f2f)
- Icono: 🚨 o ⚠️
- Posición: Después de "En Seguimiento"

---

## 🎨 DISEÑO PROPUESTO

### Card del KPI

```jsx
<Card sx={{ bgcolor: '#ffebee' }}>  {/* Fondo rojo claro */}
  <CardContent>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WarningIcon sx={{ color: '#d32f2f', fontSize: 40 }} />
      <Box>
        <Typography variant="h4" color="#d32f2f">
          {kpis.enRiesgo || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          En Riesgo
        </Typography>
      </Box>
    </Box>
  </CardContent>
</Card>
```

### Cálculo del KPI

```javascript
// En el endpoint GET /api/proyectos/kpis/comerciales
const enRiesgo = await Proyecto.countDocuments({
  tipo: 'proyecto',
  estadoComercial: 'critico'
});

// Agregar al objeto de respuesta
resumen: {
  totalProspectos,
  totalProyectos,
  tasaConversion,
  valorTotal,
  promedioProyecto,
  enSeguimiento,
  enRiesgo  // ⭐ NUEVO
}
```

---

## 🔧 ARCHIVOS A MODIFICAR

### 1. Backend: `server/controllers/proyectoController.js`

**Función:** `getKPIsComerciales`

**Cambios:**
```javascript
// Agregar después del cálculo de enSeguimiento
const enRiesgo = await Proyecto.countDocuments({
  tipo: 'proyecto',
  estadoComercial: 'critico'
});

// Agregar al resumen
resumen: {
  totalProspectos,
  totalProyectos,
  tasaConversion: parseFloat(tasaConversion),
  valorTotal,
  promedioProyecto,
  enSeguimiento,
  enRiesgo  // ⭐ NUEVO
}
```

---

### 2. Frontend: `client/src/modules/proyectos/components/KPIsComerciales.jsx`

**Cambios:**

**A) Importar icono:**
```javascript
import WarningIcon from '@mui/icons-material/Warning';
// o
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
```

**B) Agregar card del KPI:**
```jsx
{/* KPI 6: En Riesgo */}
<Grid item xs={12} sm={6} md={2}>
  <Card 
    elevation={2}
    sx={{ 
      bgcolor: '#ffebee',
      '&:hover': { 
        elevation: 4,
        transform: 'translateY(-2px)',
        transition: 'all 0.3s'
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: '#d32f2f', fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            {kpis.resumen?.enRiesgo || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En Riesgo
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
</Grid>
```

---

## 📊 LAYOUT PROPUESTO

### Distribución de KPIs (6 cards)

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ 🔵 Total    │ 🟢 Total    │ 📈 Tasa     │ 💰 Valor    │ 👀 En       │ 🚨 En       │
│ Prospectos  │ Proyectos   │ Conversión  │ Total       │ Seguimiento │ Riesgo      │
│    2        │    1        │   33.33%    │  $12,296    │     3       │     1       │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**Grid responsive:**
- Desktop (md): 2 columnas cada uno (6 cards en 1 fila)
- Tablet (sm): 6 columnas cada uno (2 cards por fila)
- Mobile (xs): 12 columnas cada uno (1 card por fila)

---

## 🎯 FUNCIONALIDAD ADICIONAL

### Click en el KPI "En Riesgo"

**Comportamiento sugerido:**
Al hacer click en el card "En Riesgo", aplicar filtro automático:
- Tipo: Proyecto
- Estado: Crítico

**Implementación:**
```jsx
<Card 
  onClick={() => handleFiltrarCriticos()}
  sx={{ 
    cursor: 'pointer',
    '&:hover': { 
      bgcolor: '#ffcdd2',
      transform: 'scale(1.02)'
    }
  }}
>
  {/* Contenido del card */}
</Card>

// Función handler
const handleFiltrarCriticos = () => {
  onFiltrosChange({
    tipo: 'proyecto',
    estadoComercial: 'critico'
  });
};
```

---

## 📈 MÉTRICAS ADICIONALES (Futuro)

### Información detallada del KPI "En Riesgo"

**Tooltip al pasar el mouse:**
```
🚨 Proyectos en Riesgo: 3

Por causa:
• Tela defectuosa: 1
• Medida incorrecta: 1
• Retraso fabricación: 1

Tiempo promedio en crítico: 2.5 días
```

**Implementación (Fase 3):**
```javascript
// Backend: Agregar análisis detallado
const criticosDetalle = await Proyecto.aggregate([
  { $match: { estadoComercial: 'critico' } },
  {
    $group: {
      _id: '$motivoCritico',  // Campo a agregar en el modelo
      count: { $sum: 1 }
    }
  }
]);

// Frontend: Tooltip con información
<Tooltip title={
  <Box>
    <Typography variant="body2">🚨 Proyectos en Riesgo: {enRiesgo}</Typography>
    <Divider sx={{ my: 1 }} />
    {criticosDetalle.map(d => (
      <Typography key={d._id} variant="caption">
        • {d._id}: {d.count}
      </Typography>
    ))}
  </Box>
}>
  <Card>...</Card>
</Tooltip>
```

---

## 🔔 ALERTAS ASOCIADAS (Fase 2)

### Cuando hay proyectos en riesgo

**Alerta visual:**
- Badge rojo parpadeante en el KPI
- Notificación en el dashboard
- Sonido de alerta (opcional)

**Alerta por email/WhatsApp:**
- Enviar al coordinador cuando enRiesgo > 0
- Resumen diario de proyectos críticos
- Escalamiento si enRiesgo > 3

---

## 📋 PLAN DE IMPLEMENTACIÓN

### Opción 1: Implementación Inmediata (30 minutos)

**Pasos:**
1. Modificar `proyectoController.js` - Agregar cálculo de enRiesgo (5 min)
2. Modificar `KPIsComerciales.jsx` - Agregar card del KPI (15 min)
3. Probar en dashboard (5 min)
4. Documentar (5 min)

**Ventajas:**
- ✅ Visibilidad inmediata de proyectos críticos
- ✅ Mejora la gestión de riesgos
- ✅ Implementación simple

---

### Opción 2: Implementación en Fase 2 (Con alertas)

**Pasos:**
1. Implementar KPI básico (30 min)
2. Agregar alertas automáticas (2 horas)
3. Agregar análisis detallado (1 hora)
4. Implementar tooltips informativos (30 min)

**Ventajas:**
- ✅ Implementación completa con alertas
- ✅ Análisis detallado de causas
- ✅ Automatización de seguimiento

---

## 🎯 RECOMENDACIÓN

### ⭐ Implementación Inmediata (Opción 1)

**Razones:**
1. ✅ **Impacto inmediato** - Visibilidad de proyectos críticos
2. ✅ **Implementación rápida** - Solo 30 minutos
3. ✅ **Baja complejidad** - Cambios simples
4. ✅ **Alto valor** - Mejora gestión de riesgos
5. ✅ **Base para Fase 2** - Facilita alertas futuras

**Después agregar en Fase 2:**
- Alertas automáticas
- Análisis de causas
- Tooltips informativos
- Click para filtrar

---

## 📊 MOCKUP VISUAL

```
┌────────────────────────────────────────────────────────────────────────┐
│  📊 KPIs Comerciales                                                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🔵  2    │ │ 🟢  1    │ │ 📈 33%   │ │ 💰 $12K  │ │ 👀  3    │   │
│  │Prospectos│ │Proyectos │ │Conversión│ │  Valor   │ │Seguimiento│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                                        │
│  ┌──────────┐                                                         │
│  │ 🚨  1    │  ⬅️ NUEVO KPI                                          │
│  │En Riesgo │                                                         │
│  └──────────┘                                                         │
│   (Fondo rojo claro)                                                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 CASOS DE USO

### Escenario 1: Sin proyectos críticos

```
🚨 En Riesgo: 0
Color: Verde claro
Mensaje: "¡Todo bajo control!"
```

### Escenario 2: 1-2 proyectos críticos

```
🚨 En Riesgo: 2
Color: Amarillo
Mensaje: "Atención requerida"
```

### Escenario 3: 3+ proyectos críticos

```
🚨 En Riesgo: 5
Color: Rojo intenso
Mensaje: "¡ALERTA! Revisar urgente"
Badge parpadeante
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Agregar cálculo de `enRiesgo` en `getKPIsComerciales`
- [ ] Incluir `enRiesgo` en respuesta del endpoint
- [ ] Probar endpoint con Postman/curl
- [ ] Verificar que devuelve el valor correcto

### Frontend
- [ ] Importar icono de Material-UI
- [ ] Agregar Grid item para el nuevo KPI
- [ ] Crear Card con estilo rojo
- [ ] Mostrar valor de `kpis.resumen.enRiesgo`
- [ ] Ajustar responsive (xs, sm, md)
- [ ] Probar en diferentes tamaños de pantalla

### Testing
- [ ] Crear proyecto de prueba
- [ ] Cambiar estado a "Crítico"
- [ ] Verificar que KPI se actualiza
- [ ] Verificar que el contador es correcto
- [ ] Probar con múltiples proyectos críticos

### Documentación
- [ ] Actualizar `FASE_3_COMPLETADA.md`
- [ ] Actualizar `ESTADO_CRITICO.md`
- [ ] Agregar screenshots del nuevo KPI
- [ ] Documentar en `CHANGELOG.md`

---

## 🚀 CÓDIGO LISTO PARA IMPLEMENTAR

### Backend (proyectoController.js)

```javascript
// Agregar después de calcular enSeguimiento
const enRiesgo = await Proyecto.countDocuments({
  tipo: 'proyecto',
  estadoComercial: 'critico'
});

// En el objeto resumen
resumen: {
  totalProspectos,
  totalProyectos,
  tasaConversion: parseFloat(tasaConversion),
  valorTotal,
  promedioProyecto,
  enSeguimiento,
  enRiesgo  // ⭐ NUEVO
}
```

### Frontend (KPIsComerciales.jsx)

```jsx
// Importar icono
import WarningIcon from '@mui/icons-material/Warning';

// Agregar después del KPI "En Seguimiento"
<Grid item xs={12} sm={6} md={2}>
  <Card 
    elevation={2}
    sx={{ 
      bgcolor: '#ffebee',
      '&:hover': { 
        elevation: 4,
        transform: 'translateY(-2px)',
        transition: 'all 0.3s'
      }
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon sx={{ color: '#d32f2f', fontSize: 40 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
            {kpis.resumen?.enRiesgo || 0}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En Riesgo
          </Typography>
        </Box>
      </Box>
    </CardContent>
  </Card>
</Grid>
```

---

## 📅 TIMELINE

### Implementación Inmediata
- **Día 1:** Implementar KPI básico (30 min)
- **Día 1:** Probar y documentar (15 min)
- **Total:** 45 minutos

### Implementación Completa (Fase 2)
- **Día 1:** KPI básico (30 min)
- **Día 2:** Alertas automáticas (2 horas)
- **Día 3:** Análisis detallado (1 hora)
- **Día 3:** Tooltips y click (30 min)
- **Total:** 4 horas

---

## 🎯 PRÓXIMOS PASOS

**Decisión requerida:**

1. **Implementar ahora** (30 min) - Recomendado ⭐
2. **Incluir en Fase 2** (4 horas completas)
3. **Posponer para después**

**Si decides implementar ahora, te daré las instrucciones paso a paso.**

---

**Estado:** ⏳ PENDIENTE DE APROBACIÓN  
**Prioridad:** Media-Alta  
**Impacto:** Alto  
**Complejidad:** Baja  
**Tiempo:** 30-45 minutos

**Fecha de creación:** 8 Noviembre 2025  
**Última actualización:** 10:40 AM
