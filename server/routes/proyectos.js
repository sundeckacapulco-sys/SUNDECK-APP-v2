const express = require('express');
const { auth, verificarPermiso } = require('../middleware/auth');
const { 
  validarTransicionEstado, 
  registrarCambioEstado,
  obtenerTransicionesValidas
} = require('../middleware/transicionesEstado');
const upload = require('../middleware/uploadFotos');
const {
  crearProyecto,
  obtenerProyectos,
  obtenerProyectoPorId,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  crearDesdeProspecto,
  obtenerDatosExportacion,
  generarEtiquetasProduccion,
  calcularTiempoInstalacion,
  optimizarRutaDiaria,
  sincronizarProyecto,
  obtenerEstadisticasProyecto,
  guardarLevantamiento,
  crearCotizacionDesdeProyecto,
  generarPDFProyecto,
  generarExcelLevantamiento,
  subirFotosLevantamiento,
  convertirProspectoAProyecto,
  obtenerKPIsComerciales,
  generarListaPedidoV2
} = require('../controllers/proyectoController');

const {
  generarPedidoDesdeProyecto,
  obtenerPedidosProyecto
} = require('../controllers/pedidoController');

const router = express.Router();

// Rutas públicas (requieren autenticación básica)

// GET /api/proyectos - Obtener todos los proyectos con filtros y paginación
router.get('/',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerProyectos
);

// GET /api/proyectos/kpis/comerciales - Obtener KPIs comerciales
router.get('/kpis/comerciales',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerKPIsComerciales
);

router.get('/ruta-diaria/:fecha',
  auth,
  verificarPermiso('proyectos', 'leer'),
  optimizarRutaDiaria
);

// GET /api/proyectos/:id - Obtener proyecto específico por ID
router.get('/:id',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerProyectoPorId
);

// POST /api/proyectos - Crear nuevo proyecto
router.post('/',
  auth,
  verificarPermiso('proyectos', 'crear'),
  crearProyecto
);

router.post('/:id/etiquetas-produccion',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarEtiquetasProduccion
);

router.post('/:id/calcular-tiempo-instalacion',
  auth,
  verificarPermiso('proyectos', 'leer'),
  calcularTiempoInstalacion
);

// POST /api/proyectos/:id/convertir - Convertir prospecto a proyecto
router.post('/:id/convertir',
  auth,
  verificarPermiso('proyectos', 'editar'),
  convertirProspectoAProyecto
);

// ===== RUTAS DE PEDIDO =====

// POST /api/proyectos/:id/generar-pedido - Generar pedido desde proyecto
router.post('/:id/generar-pedido',
  auth,
  verificarPermiso('proyectos', 'editar'),
  generarPedidoDesdeProyecto
);

// GET /api/proyectos/:id/pedidos - Obtener pedidos del proyecto
router.get('/:id/pedidos',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerPedidosProyecto
);

// PUT /api/proyectos/:id - Actualizar proyecto existente
router.put('/:id', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  actualizarProyecto
);

// PATCH /api/proyectos/:id/estado - Cambiar estado del proyecto
router.patch('/:id/estado', 
  auth, 
  verificarPermiso('proyectos', 'editar'),
  validarTransicionEstado,
  registrarCambioEstado,
  cambiarEstado
);

// DELETE /api/proyectos/:id - Eliminar proyecto (soft delete)
router.delete('/:id', 
  auth, 
  verificarPermiso('proyectos', 'eliminar'), 
  eliminarProyecto
);

// Rutas especiales

// POST /api/proyectos/desde-prospecto/:prospectoId - Crear proyecto desde prospecto
router.post('/desde-prospecto/:prospectoId', 
  auth, 
  verificarPermiso('proyectos', 'crear'), 
  crearDesdeProspecto
);

// GET /api/proyectos/:id/exportacion - Obtener datos formateados para exportación
router.get('/:id/exportacion', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerDatosExportacion
);

// POST /api/proyectos/:id/sincronizar - Sincronizar proyecto manualmente
router.post('/:id/sincronizar', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  sincronizarProyecto
);

// POST /api/proyectos/:id/sincronizar-estado - Sincronizar estado basado en el progreso real
router.post('/:id/sincronizar-estado',
  auth,
  verificarPermiso('proyectos', 'editar'),
  async (req, res) => {
    try {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findById(req.params.id)
        .populate('cotizaciones')
        .populate('pagos');
      
      if (!proyecto) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      const estadoAnterior = proyecto.estadoComercial;
      let estadoNuevo = estadoAnterior;
      let cambios = [];

      // Flujo: Levantamiento → Cotización → Activo → Fabricación → Instalación → Completado
      
      // 1. Si tiene cotizaciones → mínimo 'cotizado'
      if (proyecto.cotizaciones && proyecto.cotizaciones.length > 0) {
        const estadosProspecto = ['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa'];
        if (estadosProspecto.includes(proyecto.estadoComercial)) {
          estadoNuevo = 'cotizado';
          cambios.push('Tiene cotizaciones → cotizado');
        }
      }

      // 2. Si tiene anticipo pagado → 'activo'
      if (proyecto.pagos?.anticipo?.pagado) {
        if (['cotizado', ...['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa']].includes(proyecto.estadoComercial)) {
          estadoNuevo = 'activo';
          cambios.push('Anticipo pagado → activo');
        }
      }

      // Aplicar cambio si es necesario
      if (estadoNuevo !== estadoAnterior) {
        proyecto.estadoComercial = estadoNuevo;
        await proyecto.save();
        
        return res.json({
          success: true,
          message: `Estado sincronizado: ${estadoAnterior} → ${estadoNuevo}`,
          estadoAnterior,
          estadoNuevo,
          cambios
        });
      }

      res.json({
        success: true,
        message: 'Estado ya está sincronizado correctamente',
        estadoActual: proyecto.estadoComercial
      });

    } catch (error) {
      console.error('Error sincronizando estado:', error);
      res.status(500).json({ message: 'Error al sincronizar estado' });
    }
  }
);

// GET /api/proyectos/:id/estadisticas - Obtener estadísticas del proyecto
router.get('/:id/estadisticas',
  auth,
  verificarPermiso('proyectos', 'leer'),
  obtenerEstadisticasProyecto
);

// FASE 5: GET /api/proyectos/:id/generar-pdf
router.get('/:id/generar-pdf',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarPDFProyecto
);

// GET /api/proyectos/:id/generar-excel - Generar Excel de levantamiento
router.get('/:id/generar-excel',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarExcelLevantamiento
);

// FASE 4: PATCH /api/proyectos/:id/levantamiento - Guardar levantamiento técnico
router.patch('/:id/levantamiento', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  guardarLevantamiento
);

// FASE 4: POST /api/proyectos/:id/cotizaciones - Crear cotización desde proyecto
router.post('/:id/cotizaciones', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  crearCotizacionDesdeProyecto
);

// POST /api/proyectos/:id/fabricacion/iniciar - Iniciar fabricación
router.post('/:id/fabricacion/iniciar', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.iniciarFabricacion(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error iniciando fabricación:', error);
      res.status(500).json({ message: 'Error iniciando fabricación', error: error.message });
    }
  }
);

// PUT /api/proyectos/:id/fabricacion/proceso/:procesoId - Actualizar proceso
router.put('/:id/fabricacion/proceso/:procesoId', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.actualizarProgreso(req.params.id, {
        procesoId: req.params.procesoId,
        ...req.body
      });
      res.json(resultado);
    } catch (error) {
      console.error('Error actualizando proceso:', error);
      res.status(500).json({ message: 'Error actualizando proceso', error: error.message });
    }
  }
);

// POST /api/proyectos/:id/fabricacion/control-calidad - Control de calidad
router.post('/:id/fabricacion/control-calidad', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.realizarControlCalidad(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error en control de calidad:', error);
      res.status(500).json({ message: 'Error en control de calidad', error: error.message });
    }
  }
);

// POST /api/proyectos/:id/fabricacion/empaque - Completar empaque
router.post('/:id/fabricacion/empaque', 
  auth, 
  verificarPermiso('proyectos', 'editar'), 
  async (req, res) => {
    try {
      const FabricacionService = require('../services/fabricacionService');
      const resultado = await FabricacionService.completarEmpaque(req.params.id, req.body);
      res.json(resultado);
    } catch (error) {
      console.error('Error completando empaque:', error);
      res.status(500).json({ message: 'Error completando empaque', error: error.message });
    }
  }
);

// GET /api/proyectos/transiciones/:estado - Obtener transiciones válidas para un estado
router.get('/transiciones/:estado', 
  auth, 
  verificarPermiso('proyectos', 'leer'), 
  obtenerTransicionesValidas
);

// POST /api/proyectos/levantamiento/fotos - Subir fotos del levantamiento
router.post('/levantamiento/fotos',
  auth,
  verificarPermiso('proyectos', 'crear'),
  upload.array('fotos', 10), // Máximo 10 fotos a la vez
  subirFotosLevantamiento
);

// GET /api/proyectos/:id/lista-pedido-v2 - Generar Lista de Pedido V2.0 optimizada
router.get('/:id/lista-pedido-v2',
  auth,
  verificarPermiso('proyectos', 'leer'),
  generarListaPedidoV2
);

// ============================================
// RUTAS DE FABRICACIÓN - CONTROL DE ESTADO
// ============================================

// PATCH /api/proyectos/:id/fabricacion/estado - Cambiar estado de fabricación
router.patch('/:id/fabricacion/estado',
  auth,
  verificarPermiso('proyectos', 'editar'),
  async (req, res) => {
    try {
      const { estado } = req.body;
      const Proyecto = require('../models/Proyecto');
      const logger = require('../config/logger');
      
      const estadosValidos = ['recepcion_material', 'pendiente', 'en_proceso', 'situacion_critica', 'terminado'];
      
      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
        });
      }
      
      const proyecto = await Proyecto.findById(req.params.id);
      
      if (!proyecto) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }
      
      const estadoAnterior = proyecto.fabricacion?.estado || 'pendiente';
      
      // Actualizar estado de fabricación
      if (!proyecto.fabricacion) {
        proyecto.fabricacion = {};
      }
      
      proyecto.fabricacion.estado = estado;
      proyecto.fabricacion.fechaUltimaActualizacion = new Date();
      
      // Si es terminado, actualizar también el estado comercial
      if (estado === 'terminado') {
        proyecto.estadoComercial = 'en_instalacion';
        proyecto.fabricacion.fechaFinFabricacion = new Date();
      }
      
      // Si es situación crítica, registrar
      if (estado === 'situacion_critica') {
        proyecto.fabricacion.alertaCritica = true;
        proyecto.fabricacion.fechaAlertaCritica = new Date();
      }
      
      await proyecto.save();
      
      logger.info('🏭 Estado de fabricación actualizado', {
        proyectoId: req.params.id,
        numero: proyecto.numero,
        estadoAnterior,
        estadoNuevo: estado,
        usuario: req.usuario?.nombre
      });
      
      res.json({
        success: true,
        message: `Estado actualizado a: ${estado}`,
        data: {
          estadoAnterior,
          estadoNuevo: estado,
          fabricacion: proyecto.fabricacion
        }
      });
      
    } catch (error) {
      console.error('Error cambiando estado de fabricación:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado de fabricación',
        error: error.message
      });
    }
  }
);

// GET /api/proyectos/:id/materiales-calculados - Obtener materiales calculados para el proyecto
router.get('/:id/materiales-calculados',
  auth,
  verificarPermiso('proyectos', 'leer'),
  async (req, res) => {
    try {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findById(req.params.id);
      
      if (!proyecto) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }
      
      // Calcular materiales basados en el levantamiento
      const materiales = [];
      const partidas = proyecto.levantamiento?.partidas || [];
      
      partidas.forEach((partida, index) => {
        // Calcular área total de la partida
        let areaTotal = 0;
        if (partida.medidas && partida.medidas.length > 0) {
          areaTotal = partida.medidas.reduce((sum, m) => sum + (m.area || (m.ancho * m.alto) || 0), 0);
        }
        
        // Agregar material principal (tela)
        materiales.push({
          tipo: 'tela',
          descripcion: `${partida.producto || 'Producto'} - ${partida.color || 'Sin color'}`,
          ubicacion: partida.ubicacion,
          cantidad: areaTotal,
          unidad: 'm²',
          partida: index + 1
        });
        
        // Agregar componentes según el tipo de producto
        if (partida.producto?.toLowerCase().includes('persiana')) {
          materiales.push({
            tipo: 'componente',
            descripcion: 'Tubo de aluminio',
            ubicacion: partida.ubicacion,
            cantidad: partida.medidas?.length || 1,
            unidad: 'pza',
            partida: index + 1
          });
          
          materiales.push({
            tipo: 'componente',
            descripcion: 'Mecanismo de control',
            ubicacion: partida.ubicacion,
            cantidad: partida.medidas?.length || 1,
            unidad: 'pza',
            partida: index + 1
          });
        }
        
        // Si es motorizado
        if (partida.motorizado) {
          materiales.push({
            tipo: 'motor',
            descripcion: `Motor ${partida.motorModelo || 'estándar'}`,
            ubicacion: partida.ubicacion,
            cantidad: partida.numMotores || 1,
            unidad: 'pza',
            partida: index + 1
          });
        }
      });
      
      res.json({
        success: true,
        materiales,
        resumen: {
          totalPartidas: partidas.length,
          totalMateriales: materiales.length
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo materiales:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener materiales calculados',
        error: error.message
      });
    }
  }
);

// POST /api/proyectos/:id/salida-materiales - Registrar salida de materiales del almacén
router.post('/:id/salida-materiales',
  auth,
  verificarPermiso('proyectos', 'editar'),
  async (req, res) => {
    try {
      const { materiales, fecha, tipo } = req.body;
      const Proyecto = require('../models/Proyecto');
      const Almacen = require('../models/Almacen');
      const logger = require('../config/logger');
      
      const proyecto = await Proyecto.findById(req.params.id);
      
      if (!proyecto) {
        return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
      }
      
      // Registrar la salida en el proyecto
      if (!proyecto.fabricacion) {
        proyecto.fabricacion = {};
      }
      
      if (!proyecto.fabricacion.salidaMateriales) {
        proyecto.fabricacion.salidaMateriales = [];
      }
      
      const salidaRegistro = {
        fecha: fecha || new Date(),
        materiales: materiales,
        usuario: req.usuario?.nombre || 'Sistema',
        tipo: tipo || 'salida_fabricacion'
      };
      
      proyecto.fabricacion.salidaMateriales.push(salidaRegistro);
      proyecto.fabricacion.materialesRecibidos = true;
      proyecto.fabricacion.fechaRecepcionMateriales = new Date();
      
      await proyecto.save();
      
      // Intentar descontar del almacén (si existe el modelo)
      try {
        for (const material of materiales) {
          if (material.tipo === 'componente' || material.tipo === 'motor') {
            // Buscar en almacén y descontar
            const itemAlmacen = await Almacen.findOne({
              $or: [
                { nombre: { $regex: material.descripcion, $options: 'i' } },
                { codigo: { $regex: material.descripcion, $options: 'i' } }
              ]
            });
            
            if (itemAlmacen && itemAlmacen.cantidad >= material.cantidad) {
              itemAlmacen.cantidad -= material.cantidad;
              await itemAlmacen.save();
            }
          }
        }
      } catch (almacenError) {
        logger.warn('No se pudo descontar del almacén', { error: almacenError.message });
      }
      
      logger.info('📦 Salida de materiales registrada', {
        proyectoId: req.params.id,
        numero: proyecto.numero,
        totalMateriales: materiales.length,
        usuario: req.usuario?.nombre
      });
      
      res.json({
        success: true,
        message: 'Salida de materiales registrada exitosamente',
        data: {
          salida: salidaRegistro,
          proyecto: {
            numero: proyecto.numero,
            fabricacion: proyecto.fabricacion
          }
        }
      });
      
    } catch (error) {
      console.error('Error registrando salida de materiales:', error);
      res.status(500).json({
        success: false,
        message: 'Error al registrar salida de materiales',
        error: error.message
      });
    }
  }
);

module.exports = router;
