# 🚀 CONTINUAR AQUÍ - Próxima Sesión

**Última actualización:** 31 Octubre 2025  
**Estado:** Fase 0 ✅ COMPLETADA | Fase 1 🔄 EN PROGRESO (40%)

---

## ✅ FASE 0 COMPLETADA (100%)

- ✅ 419/419 console.log migrados
- ✅ 15/15 pruebas pasando
- ✅ Logger Winston operativo
- ✅ Sistema de métricas capturando automáticamente

---

## 🚀 FASE 1: ESTADO ACTUAL (40%)

### ✅ COMPLETADO HOY (31 Oct 2025)

**1. Modelo `Proyecto.js` Unificado** ⭐
- ✅ Agregados 5 secciones principales:
  - `cronograma` - Fechas unificadas del ciclo de vida
  - `fabricacion` - Con etiquetas de producción y QR
  - `instalacion` - Con rutas optimizadas
  - `pagos` - Estructurados con comprobantes
  - `notas` - Historial completo
- ✅ Archivo: `server/models/Proyecto.js` (502 → 1,241 líneas)

**2. Métodos Inteligentes Implementados** ⭐
- ✅ `generarEtiquetasProduccion()` - Etiquetas para empaques con QR
- ✅ `calcularTiempoInstalacion()` - Algoritmo inteligente de tiempos
- ✅ `generarRecomendacionesInstalacion()` - Sugerencias personalizadas
- ✅ `optimizarRutaDiaria()` - Optimización de rutas (Nearest Neighbor)

**3. Documentación Completa** ⭐
- ✅ `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md`
- ✅ `docschecklists/IMPLEMENTACION_COMPLETADA.md`
- ✅ `docschecklists/FASE_1_UNIFICACION_MODELOS.md`
- ✅ `docschecklists/ANALISIS_FABRICACION_ACTUAL.md`

---

## 📋 PRÓXIMA SESIÓN: Día 1 - Crear Endpoints

### Tareas Pendientes

#### 1. Instalar Dependencia
```bash
npm install qrcode
```

#### 2. Crear Endpoint: Etiquetas de Producción
```javascript
// POST /api/proyectos/:id/etiquetas-produccion
// Archivo: server/controllers/proyectoController.js

exports.generarEtiquetasProduccion = async (req, res) => {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const etiquetas = proyecto.generarEtiquetasProduccion();
    
    // Generar QR codes
    const QRCode = require('qrcode');
    for (let etiqueta of etiquetas) {
      etiqueta.codigoQR = await QRCode.toDataURL(etiqueta.codigoQR);
    }
    
    res.json(etiquetas);
  } catch (error) {
    logger.error('Error generando etiquetas', { error: error.message });
    res.status(500).json({ message: 'Error generando etiquetas' });
  }
};
```

#### 3. Crear Endpoint: Calcular Tiempo de Instalación
```javascript
// POST /api/proyectos/:id/calcular-tiempo-instalacion
// Archivo: server/controllers/proyectoController.js

exports.calcularTiempoInstalacion = async (req, res) => {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    const calculo = proyecto.calcularTiempoInstalacion();
    res.json(calculo);
  } catch (error) {
    logger.error('Error calculando tiempo', { error: error.message });
    res.status(500).json({ message: 'Error calculando tiempo' });
  }
};
```

#### 4. Crear Endpoint: Optimizar Ruta Diaria
```javascript
// GET /api/proyectos/ruta-diaria/:fecha
// Archivo: server/controllers/proyectoController.js

exports.optimizarRutaDiaria = async (req, res) => {
  try {
    const fecha = new Date(req.params.fecha);
    const rutaOptimizada = await Proyecto.optimizarRutaDiaria(fecha);
    res.json(rutaOptimizada);
  } catch (error) {
    logger.error('Error optimizando ruta', { error: error.message });
    res.status(500).json({ message: 'Error optimizando ruta' });
  }
};
```

#### 5. Agregar Rutas
```javascript
// Archivo: server/routes/proyectos.js
// Agregar estas líneas

router.post('/:id/etiquetas-produccion', auth, proyectoController.generarEtiquetasProduccion);
router.post('/:id/calcular-tiempo-instalacion', auth, proyectoController.calcularTiempoInstalacion);
router.get('/ruta-diaria/:fecha', auth, proyectoController.optimizarRutaDiaria);
```

---

## 📅 PLAN DE 5 DÍAS

### ✅ Día 0 (HOY - COMPLETADO)
- ✅ Actualizar modelo `Proyecto.js`
- ✅ Implementar métodos inteligentes
- ✅ Documentar requisitos y cambios

### ⏳ Día 1 (PRÓXIMA SESIÓN)
- [ ] Instalar `qrcode` package
- [ ] Crear 3 endpoints en `proyectoController.js`
- [ ] Agregar rutas en `routes/proyectos.js`
- [ ] Probar endpoints con Postman/Thunder Client

### ⏳ Día 2
- [ ] Actualizar `FabricacionService` para usar `Proyecto.fabricacion`
- [ ] Actualizar `instalacionesInteligentesService` para usar `Proyecto.instalacion`
- [ ] Actualizar rutas de fabricación e instalación

### ⏳ Día 3
- [ ] Crear script `migrarProyectoPedidoAProyecto.js`
- [ ] Ejecutar migración en entorno de prueba
- [ ] Validar integridad de datos

### ⏳ Día 4
- [ ] Renombrar `Fabricacion.js` → `Fabricacion.legacy.js`
- [ ] Renombrar `ProyectoPedido.js` → `ProyectoPedido.legacy.js`
- [ ] Actualizar imports en archivos afectados

### ⏳ Día 5
- [ ] Verificar KPIs comerciales intactos
- [ ] Pruebas de integración completas
- [ ] Actualizar documentación final

---

## 🔍 VERIFICACIÓN RÁPIDA

```bash
# Verificar que el modelo se cargó correctamente
node -e "const P = require('./server/models/Proyecto'); console.log('Métodos:', Object.keys(P.schema.methods))"

# Debe mostrar:
# generarEtiquetasProduccion
# calcularTiempoInstalacion
# generarRecomendacionesInstalacion
# (y otros métodos existentes)
```

---

## 📚 DOCUMENTOS DE REFERENCIA

### Para Implementar Endpoints
- `docschecklists/REQUISITOS_PRODUCCION_INSTALACION.md` - Especificaciones completas
- `docschecklists/IMPLEMENTACION_COMPLETADA.md` - Métodos implementados
- `server/models/Proyecto.js` (líneas 884-1235) - Código de los métodos

### Para Migración
- `docschecklists/FASE_1_UNIFICACION_MODELOS.md` - Plan de unificación
- `server/scripts/migrarAProyectos.js` - Script de referencia

### Para Validación
- `AGENTS.md` - Estándares y verificaciones
- `docschecklists/ROADMAP_TASKS.md` - Roadmap completo

---

## ⚠️ IMPORTANTE: KPIs Comerciales

**NO ALTERAR estos campos:**
- `total`, `anticipo`, `saldo_pendiente`
- `monto_estimado`, `subtotal`, `iva`
- `cliente.*`, `estado`, `fecha_*`

Estos campos son la base de los reportes comerciales y deben mantenerse intactos.

---

**Responsable:** Equipo Desarrollo CRM Sundeck  
**Próxima acción:** Crear 3 endpoints para etiquetas, tiempos y rutas  
**Duración estimada:** 2-3 horas  
**Progreso Fase 1:** 40% completado
