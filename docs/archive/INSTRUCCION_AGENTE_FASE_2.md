# 🤖 INSTRUCCIÓN PARA EL AGENTE - FASE 2 FABRICACIÓN

**Fecha:** 14 Noviembre 2025  
**Prioridad:** ALTA  
**Duración estimada:** 2-3 horas  
**Estado del roadmap:** FASE 2 - ALERTAS DE FABRICACIÓN

---

## 🎯 OBJETIVO

Implementar **FASE 2: ALERTAS DE FABRICACIÓN** del roadmap de alertas inteligentes, siguiendo la arquitectura modular ya establecida en Fase 1 (Comercial).

---

## 📋 TAREAS A REALIZAR

### 1. CREAR SERVICIO DE ALERTAS DE FABRICACIÓN (45 min)

**Archivo:** `server/services/alertasFabricacionService.js`

**Implementar 3 categorías de alertas:**

#### A) Órdenes de Fabricación Retrasadas
```javascript
async obtenerOrdenesRetrasadas({ umbral = 3 } = {}) {
  // Detectar órdenes que exceden tiempo estimado por 3+ días
  // Prioridad: Crítica
  // Notificar: coordinador_fabricacion, asesor_comercial
  // Auto-actualizar estado: "fabricacion_retrasada"
}
```

#### B) Materiales Faltantes
```javascript
async obtenerMaterialesFaltantes() {
  // Detectar órdenes que no pueden iniciar por falta de materiales
  // Prioridad: Alta
  // Notificar: compras, coordinador_fabricacion
  // Crear tarea: "solicitar_materiales"
}
```

#### C) Control de Calidad Pendiente
```javascript
async obtenerCalidadPendiente({ umbral = 1 } = {}) {
  // Detectar productos terminados sin revisión de calidad (1+ día)
  // Prioridad: Importante
  // Notificar: control_calidad
  // Bloquear envío hasta aprobación
}
```

**Estructura del servicio:**
```javascript
class AlertasFabricacionService {
  async obtenerOrdenesRetrasadas({ umbral = 3 } = {}) { }
  async obtenerMaterialesFaltantes() { }
  async obtenerCalidadPendiente({ umbral = 1 } = {}) { }
  async obtenerTodasLasAlertas() { }
  
  formatearOrdenRetrasada(orden) { }
  formatearMaterialFaltante(orden) { }
  formatearCalidadPendiente(orden) { }
}

module.exports = new AlertasFabricacionService();
```

---

### 2. AGREGAR ENDPOINTS EN RUTAS (15 min)

**Archivo:** `server/routes/alertas.js`

**Agregar 4 endpoints nuevos:**

```javascript
// Alertas de fabricación
router.get('/inteligentes/fabricacion', async (req, res) => {
  // Obtener todas las alertas de fabricación
});

router.get('/inteligentes/fabricacion/retrasadas', async (req, res) => {
  // Solo órdenes retrasadas
});

router.get('/inteligentes/fabricacion/materiales', async (req, res) => {
  // Solo materiales faltantes
});

router.get('/inteligentes/fabricacion/calidad', async (req, res) => {
  // Solo control de calidad pendiente
});
```

---

### 3. CREAR PANEL DE ALERTAS EN FRONTEND (60 min)

**Archivo:** `client/src/modules/fabricacion/components/PanelAlertasFabricacion.jsx`

**Características:**
- Usar hook compartido: `useAlertasInteligentes`
- 3 secciones de alertas (Retrasadas, Materiales, Calidad)
- Badges de prioridad (Crítica, Alta, Importante)
- Contador de alertas por categoría
- Botones de acción rápida
- Diseño coherente con PanelAlertas.jsx de comercial

**Estructura:**
```jsx
import useAlertasInteligentes from '../../alertas/hooks/useAlertasInteligentes';

const PanelAlertasFabricacion = () => {
  const { data, loading, error } = useAlertasInteligentes({ 
    endpoint: '/alertas/inteligentes/fabricacion' 
  });
  
  // Separar alertas por categoría
  const retrasadas = data?.filter(a => a.tipo === 'fabricacion_retrasada');
  const materiales = data?.filter(a => a.tipo === 'materiales_faltantes');
  const calidad = data?.filter(a => a.tipo === 'calidad_pendiente');
  
  return (
    <Card>
      <CardHeader title="🏭 Alertas de Fabricación" />
      <CardContent>
        {/* 3 secciones de alertas */}
      </CardContent>
    </Card>
  );
};
```

---

### 4. CREAR CRON JOB (30 min)

**Archivo:** `server/jobs/alertasFabricacion.js`

**Configuración:**
- Ejecutar cada 4 horas: `'0 */4 * * *'`
- Detectar alertas automáticamente
- Enviar notificaciones si es necesario
- Logging estructurado

```javascript
const cron = require('node-cron');
const alertasFabricacion = require('../services/alertasFabricacionService');
const logger = require('../config/logger');

// Ejecutar cada 4 horas
cron.schedule('0 */4 * * *', async () => {
  logger.info('Iniciando detección de alertas de fabricación');
  
  try {
    const alertas = await alertasFabricacion.obtenerTodasLasAlertas();
    
    logger.info('Alertas de fabricación detectadas', {
      total: alertas.length,
      retrasadas: alertas.filter(a => a.tipo === 'fabricacion_retrasada').length,
      materiales: alertas.filter(a => a.tipo === 'materiales_faltantes').length,
      calidad: alertas.filter(a => a.tipo === 'calidad_pendiente').length
    });
    
    // TODO: Enviar notificaciones
    
  } catch (error) {
    logger.error('Error en detección de alertas de fabricación', { error });
  }
});

module.exports = cron;
```

---

### 5. INTEGRAR EN FabricacionTab (15 min)

**Archivo:** `client/src/modules/proyectos/components/FabricacionTab.jsx`

**Agregar:**
- Importar `PanelAlertasFabricacion`
- Mostrar panel en la parte superior del tab
- Contador de alertas en badge

```jsx
import PanelAlertasFabricacion from '../../fabricacion/components/PanelAlertasFabricacion';

const FabricacionTab = ({ proyecto }) => {
  return (
    <Box>
      {/* Panel de alertas */}
      <PanelAlertasFabricacion proyectoId={proyecto._id} />
      
      {/* Resto del contenido de fabricación */}
      {/* ... */}
    </Box>
  );
};
```

---

### 6. ACTUALIZAR VISTA UNIFICADA DE ALERTAS (15 min)

**Archivo:** `client/src/modules/alertas/AlertasView.jsx`

**Agregar:**
- Tab de "Fabricación"
- Integrar alertas de fabricación en vista unificada
- Filtros por tipo de alerta

```jsx
<Tabs>
  <Tab label="Comercial" />
  <Tab label="Fabricación" /> {/* NUEVO */}
  <Tab label="Todas" />
</Tabs>
```

---

### 7. DOCUMENTACIÓN (15 min)

**Archivo:** `docs/ALERTAS_FABRICACION_IMPLEMENTACION.md`

**Contenido:**
- Descripción de las 3 categorías
- Endpoints disponibles
- Ejemplos de uso
- Configuración de umbrales
- Troubleshooting

---

## 📊 CRITERIOS DE ÉXITO

### Backend
- ✅ Servicio `alertasFabricacionService.js` creado
- ✅ 4 endpoints funcionando en `/api/alertas/inteligentes/fabricacion`
- ✅ Cron job programado y ejecutándose
- ✅ Logging estructurado implementado

### Frontend
- ✅ Panel `PanelAlertasFabricacion.jsx` funcional
- ✅ Integrado en `FabricacionTab.jsx`
- ✅ Alertas visibles en vista unificada
- ✅ Diseño coherente con Fase 1

### Funcionalidad
- ✅ Detecta órdenes retrasadas (3+ días)
- ✅ Detecta materiales faltantes
- ✅ Detecta control de calidad pendiente (1+ día)
- ✅ Actualiza estados automáticamente
- ✅ Muestra alertas en tiempo real

---

## 🔧 CONFIGURACIÓN REQUERIDA

### Variables de entorno (si aplica)
```env
ALERTAS_FABRICACION_UMBRAL_RETRASO=3
ALERTAS_FABRICACION_UMBRAL_CALIDAD=1
ALERTAS_FABRICACION_CRON='0 */4 * * *'
```

### Campos del modelo Proyecto (verificar existencia)
```javascript
{
  fabricacion: {
    estado: String,
    fecha_inicio: Date,
    fecha_estimada: Date,
    fecha_completado: Date,
    materiales_faltantes: [String],
    control_calidad: {
      realizado: Boolean,
      fecha: Date,
      aprobado: Boolean
    }
  }
}
```

---

## 📁 ARCHIVOS A CREAR/MODIFICAR

### Crear (5 archivos nuevos)
1. `server/services/alertasFabricacionService.js`
2. `server/jobs/alertasFabricacion.js`
3. `client/src/modules/fabricacion/components/PanelAlertasFabricacion.jsx`
4. `docs/ALERTAS_FABRICACION_IMPLEMENTACION.md`
5. `server/tests/services/alertasFabricacionService.test.js` (opcional)

### Modificar (3 archivos existentes)
1. `server/routes/alertas.js` - Agregar endpoints
2. `client/src/modules/proyectos/components/FabricacionTab.jsx` - Integrar panel
3. `client/src/modules/alertas/AlertasView.jsx` - Agregar tab

---

## 🎯 PRIORIZACIÓN

**CRÍTICO (hacer primero):**
1. Servicio de alertas
2. Endpoints básicos
3. Panel frontend

**IMPORTANTE (hacer después):**
4. Cron job
5. Integración en tabs
6. Vista unificada

**OPCIONAL (si hay tiempo):**
7. Tests unitarios
8. Notificaciones por email
9. Configuración avanzada

---

## 📝 NOTAS IMPORTANTES

1. **Reutilizar arquitectura de Fase 1:**
   - Usar mismo patrón de servicio
   - Usar mismo hook `useAlertasInteligentes`
   - Mantener consistencia en diseño

2. **Logging estructurado:**
   - Usar `logger.info`, `logger.warn`, `logger.error`
   - Incluir contexto relevante
   - No usar `console.log`

3. **Manejo de errores:**
   - Try-catch en todos los métodos async
   - Respuestas HTTP apropiadas
   - Mensajes de error claros

4. **Performance:**
   - Queries optimizadas con índices
   - Limitar resultados si es necesario
   - Caché si aplica

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Servicio `alertasFabricacionService.js` creado
- [ ] Método `obtenerOrdenesRetrasadas()` implementado
- [ ] Método `obtenerMaterialesFaltantes()` implementado
- [ ] Método `obtenerCalidadPendiente()` implementado
- [ ] Endpoints agregados en `alertas.js`
- [ ] Panel `PanelAlertasFabricacion.jsx` creado
- [ ] Panel integrado en `FabricacionTab.jsx`
- [ ] Tab agregado en `AlertasView.jsx`
- [ ] Cron job `alertasFabricacion.js` creado
- [ ] Cron job registrado en `server/index.js`
- [ ] Documentación creada
- [ ] Probado con datos reales
- [ ] Logging verificado
- [ ] Sin errores en consola

---

## 🚀 COMANDOS ÚTILES

### Desarrollo
```bash
# Iniciar servidor backend
npm run dev

# Iniciar frontend
cd client && npm start

# Ver logs en tiempo real
tail -f logs/combined.log
```

### Testing
```bash
# Probar endpoint de alertas
curl http://localhost:5001/api/alertas/inteligentes/fabricacion

# Ejecutar cron job manualmente (en Node REPL)
node
> const job = require('./server/jobs/alertasFabricacion');
```

### Debugging
```bash
# Ver alertas detectadas
node -e "const service = require('./server/services/alertasFabricacionService'); service.obtenerTodasLasAlertas().then(console.log);"
```

---

## 📞 CONTACTO

**Si tienes dudas:**
- Revisar implementación de Fase 1 (Comercial)
- Consultar `docs/ALERTAS_INTELIGENTES_ROADMAP.md`
- Verificar arquitectura en `server/services/alertasInteligentesService.js`

---

**Estado:** ⏳ PENDIENTE  
**Asignado a:** Agente IA  
**Prioridad:** ALTA  
**Duración estimada:** 2-3 horas  
**Fecha límite:** 14 Noviembre 2025

---

**¡ADELANTE! Implementa la Fase 2 de Alertas de Fabricación siguiendo esta guía.**
