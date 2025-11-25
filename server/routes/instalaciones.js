const express = require('express');
const Instalacion = require('../models/Instalacion');
// const Fabricacion = require('../models/Fabricacion.legacy');
const Pedido = require('../models/Pedido');
const { auth, verificarPermiso } = require('../middleware/auth');
const ValidacionTecnicaService = require('../services/validacionTecnicaService');
const InstalacionesInteligentesService = require('../services/instalacionesInteligentesService');
const logger = require('../config/logger');

// Función para generar número de instalación
async function generarNumeroInstalacion() {
  const año = new Date().getFullYear();
  const mes = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Buscar el último número del mes
  const ultimaInstalacion = await Instalacion.findOne({
    numero: { $regex: `^INS-${año}-${mes}-` }
  }).sort({ numero: -1 });
  
  let siguienteNumero = 1;
  if (ultimaInstalacion) {
    const numeroActual = parseInt(ultimaInstalacion.numero.split('-')[3]);
    siguienteNumero = numeroActual + 1;
  }
  
  return `INS-${año}-${mes}-${String(siguienteNumero).padStart(4, '0')}`;
}

const router = express.Router();

// Endpoint de prueba (temporal)
router.get('/test', (req, res) => {
  res.json({
    message: 'Endpoint de instalaciones funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// POST /api/instalaciones/sugerencias - Obtener sugerencias inteligentes para un proyecto
router.post('/sugerencias', auth, verificarPermiso('instalaciones', 'leer'), async (req, res) => {
  const { proyectoId } = req.body;

  if (!proyectoId) {
    return res.status(400).json({ message: 'El proyectoId es requerido para generar sugerencias' });
  }

  try {
    logger.info('Generando sugerencias inteligentes de instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'generarSugerenciasInstalacion',
      proyectoId,
      usuarioId: req.usuario?._id || null
    });

    const sugerencias = await InstalacionesInteligentesService.generarSugerenciasInstalacion(proyectoId);
    res.json(sugerencias);
  } catch (error) {
    logger.error('Error generando sugerencias inteligentes de instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'generarSugerenciasInstalacion',
      proyectoId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error generando sugerencias de instalación', error: error.message });
  }
});

// Obtener instalaciones
router.get('/', auth, verificarPermiso('instalaciones', 'leer'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtros = {};
    if (estado) filtros.estado = estado;

    const instalaciones = await Instalacion.find(filtros)
      .populate('pedido')
      // .populate('fabricacion') // Comentado temporalmente por ausencia de modelo legacy
      .populate('instaladores.usuario', 'nombre apellido')
      .sort({ fechaProgramada: 1 });

    res.json(instalaciones);
  } catch (error) {
    logger.error('Error obteniendo instalaciones', {
      ruta: 'instalacionesRoutes',
      accion: 'listarInstalaciones',
      filtros: req.query,
      usuarioId: req.usuario?._id || null,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Programar nueva instalación directamente
router.post('/', auth, verificarPermiso('instalaciones', 'crear'), async (req, res) => {
  try {
    logger.info('Programando nueva instalación manualmente', {
      ruta: 'instalacionesRoutes',
      accion: 'programarInstalacion',
      usuarioId: req.user?.id || req.usuario?._id || null
    });

    logger.debug('Payload recibido para programación de instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'programarInstalacion',
      body: req.body,
      usuarioId: req.user?.id || req.usuario?._id || null
    });

    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado'
      });
    }
    
    const {
      proyectoId,
      fechaProgramada,
      tipoInstalacion,
      prioridad,
      tiempoEstimado,
      instaladores,
      responsable,
      herramientasEspeciales,
      materialesAdicionales,
      observaciones,
      configuracion
    } = req.body;

    // Validar datos requeridos
    if (!proyectoId || !fechaProgramada) {
      return res.status(400).json({ 
        message: 'Proyecto y fecha programada son requeridos' 
      });
    }

    // Generar número de instalación
    const numeroInstalacion = await generarNumeroInstalacion();

    // Crear nueva instalación
    const nuevaInstalacion = new Instalacion({
      numero: numeroInstalacion,
      proyectoId: proyectoId,
      fechaProgramada: new Date(fechaProgramada),
      estado: 'programada',
      
      // Configuración de la instalación
      tipoInstalacion: tipoInstalacion || 'estandar',
      prioridad: prioridad || 'media',
      tiempoEstimado: tiempoEstimado || 4,
      
      // Equipo de instalación
      instaladores: (instaladores || []).map(instaladorId => ({
        usuario: instaladorId,
        rol: instaladorId === responsable ? 'responsable' : 'instalador',
        presente: false
      })),
      
      // Herramientas y materiales
      herramientasEspeciales: herramientasEspeciales || [],
      materialesAdicionales: materialesAdicionales || '',
      observaciones: observaciones || '',
      
      // Configuración adicional
      configuracion: {
        notificarCliente: configuracion?.notificarCliente || false,
        confirmarFecha: configuracion?.confirmarFecha || false
      },

      // Metadatos
      creadoPor: req.user.id,
      fechaCreacion: new Date()
    });

    const instalacionGuardada = await nuevaInstalacion.save();
    
    // Poblar datos para respuesta
    const instalacionCompleta = await Instalacion.findById(instalacionGuardada._id)
      .populate('instaladores.usuario', 'nombre apellido')
      .populate('creadoPor', 'nombre apellido');

    logger.info('Instalación programada exitosamente', {
      ruta: 'instalacionesRoutes',
      accion: 'programarInstalacion',
      instalacionId: instalacionCompleta._id,
      numeroInstalacion: instalacionCompleta.numero,
      usuarioId: req.user?.id || req.usuario?._id || null
    });

    res.status(201).json({
      message: 'Instalación programada exitosamente',
      instalacion: instalacionCompleta
    });

  } catch (error) {
    logger.error('Error programando instalación manual', {
      ruta: 'instalacionesRoutes',
      accion: 'programarInstalacion',
      usuarioId: req.user?.id || req.usuario?._id || null,
      bodyKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error interno del servidor al programar instalación',
      error: error.message
    });
  }
});

/*
// Crear instalación desde fabricación completada
// ESTA RUTA ESTÁ DESACTIVADA PORQUE DEPENDE DEL MODELO `Fabricacion.legacy`
router.post('/desde-fabricacion/:fabricacionId', auth, verificarPermiso('instalaciones', 'crear'), async (req, res) => {
  try {
    logger.info('Creando instalación desde fabricación', {
      ruta: 'instalacionesRoutes',
      accion: 'crearDesdeFabricacion',
      usuarioId: req.usuario?._id || null,
      fabricacionId: req.params.fabricacionId
    });
    const { fabricacionId } = req.params;
    const {
      fechaProgramada,
      instaladores = [],
      observaciones = ''
    } = req.body;

    // Verificar que la fabricación existe y está completada
    const fabricacion = await Fabricacion.findById(fabricacionId)
      .populate('pedido')
      .populate('prospecto', 'nombre telefono direccion');
    
    if (!fabricacion) {
      return res.status(404).json({ message: 'Orden de fabricación no encontrada' });
    }

    if (fabricacion.estado !== 'completada') {
      return res.status(400).json({ 
        message: 'Solo se pueden programar instalaciones de fabricaciones completadas' 
      });
    }

    // Verificar si ya existe una instalación para esta fabricación
    const instalacionExistente = await Instalacion.findOne({ fabricacion: fabricacionId });
    if (instalacionExistente) {
      return res.status(400).json({ 
        message: 'Ya existe una instalación programada para esta fabricación' 
      });
    }

    // 🔒 VALIDACIÓN TÉCNICA CRÍTICA: Verificar información completa para instalación
    logger.info('Validando información técnica antes de programar instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'crearDesdeFabricacion',
      usuarioId: req.usuario?._id || null,
      fabricacionId
    });
    const validacionTecnica = ValidacionTecnicaService.validarAvanceEtapa(fabricacion.productos, 'instalacion');
    
    if (!validacionTecnica.puedeAvanzar) {
      logger.warn('Instalación bloqueada por información técnica incompleta', {
        ruta: 'instalacionesRoutes',
        accion: 'crearDesdeFabricacion',
        usuarioId: req.usuario?._id || null,
        fabricacionId,
        requisitosFaltantes: validacionTecnica.detalleProductos.filter(p => !p.valido)
      });
      return res.status(400).json({
        message: '🔒 CANDADO ACTIVADO: No se puede programar la instalación',
        error: validacionTecnica.mensajeCandado,
        validacion: validacionTecnica,
        requisitosFaltantes: validacionTecnica.detalleProductos.filter(p => !p.valido),
        solucion: 'Complete la información técnica faltante en el levantamiento original'
      });
    }

    logger.info('Validación técnica aprobada para instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'crearDesdeFabricacion',
      usuarioId: req.usuario?._id || null,
      fabricacionId
    });

    // Generar orden de instalación completa
    const ordenInstalacion = ValidacionTecnicaService.generarOrdenInstalacion(fabricacion.productos, {
      cliente: {
        nombre: fabricacion.prospecto.nombre,
        telefono: fabricacion.prospecto.telefono,
        direccion: fabricacion.prospecto.direccion
      },
      fabricacion: {
        numero: fabricacion.numero,
        fechaCompletado: fabricacion.fechaCompletado
      }
    });

    // Crear instalación con información técnica completa
    const nuevaInstalacion = new Instalacion({
      numero: await generarNumeroInstalacion(),
      pedido: fabricacion.pedido._id,
      fabricacion: fabricacion._id,
      fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : new Date(),
      estado: 'programada',
      
      // Información del cliente
      cliente: {
        nombre: fabricacion.prospecto.nombre,
        telefono: fabricacion.prospecto.telefono
      },
      
      // Dirección de instalación
      direccion: fabricacion.prospecto.direccion || {},
      
      // Productos con información técnica completa para instalación
      productos: ordenInstalacion.productosInstalacion.map(producto => ({
        ubicacion: producto.ubicacion,
        descripcion: producto.descripcion,
        
        // Medidas detalladas
        medidas: producto.medidas,
        
        // Especificaciones técnicas críticas para instalación
        especificacionesTecnicas: {
          ...producto.especificacionesInstalacion,
          // Información adicional para instaladores
          herramientasEspeciales: producto.observacionesInstalacion.filter(obs => 
            obs.includes('Requiere') || obs.includes('especial')
          ),
          tiempoEstimado: Math.ceil(producto.medidas.reduce((total, medida) => 
            total + (medida.area * 0.5), 1
          )) // 0.5 horas por m²
        },
        
        // Información de motorización detallada
        motorizacion: producto.motorizacion,
        
        // Información de toldo detallada
        toldo: producto.toldo,
        
        // Estado de instalación
        estado: 'pendiente',
        
        // Observaciones específicas para instaladores
        observacionesInstalacion: producto.observacionesInstalacion
      })),
      
      // Equipo de instalación
      instaladores: instaladores.map(instalador => ({
        usuario: instalador.usuarioId,
        rol: instalador.rol || 'instalador',
        presente: false
      })),
      
      // Checklist generado automáticamente basado en productos
      checklist: generarChecklistInstalacion(ordenInstalacion.productosInstalacion),
      
      // Herramientas necesarias
      herramientasNecesarias: ordenInstalacion.herramientasNecesarias,
      
      // Tiempo estimado
      tiempos: {
        estimado: ordenInstalacion.tiempoEstimado.horas,
        descripcion: ordenInstalacion.tiempoEstimado.descripcion
      },
      
      // Observaciones
      observaciones: observaciones,
      
      // Información técnica completa preservada
      informacionTecnicaCompleta: ordenInstalacion
    });

    const instalacionGuardada = await nuevaInstalacion.save();
    
    // Actualizar estado de fabricación
    fabricacion.estado = 'instalacion_programada';
    await fabricacion.save();
    
    // Actualizar estado de pedido
    await Pedido.findByIdAndUpdate(fabricacion.pedido._id, {
      estado: 'listo_instalacion'
    });

    // Poblar datos para respuesta
    const instalacionCompleta = await Instalacion.findById(instalacionGuardada._id)
      .populate('pedido', 'numero total')
      .populate('fabricacion', 'numero')
      .populate('instaladores.usuario', 'nombre apellido');

    logger.info('Instalación programada exitosamente desde fabricación', {
      ruta: 'instalacionesRoutes',
      accion: 'crearDesdeFabricacion',
      usuarioId: req.usuario?._id || null,
      instalacionId: instalacionCompleta._id,
      numeroInstalacion: instalacionCompleta.numero,
      fabricacionId
    });

    res.status(201).json({
      message: 'Instalación programada exitosamente con información técnica completa',
      instalacion: instalacionCompleta,
      ordenTecnica: ordenInstalacion,
      validacionTecnica: validacionTecnica
    });

  } catch (error) {
    logger.error('Error programando instalación desde fabricación', {
      ruta: 'instalacionesRoutes',
      accion: 'crearDesdeFabricacion',
      usuarioId: req.usuario?._id || null,
      fabricacionId: req.params.fabricacionId,
      bodyKeys: Object.keys(req.body || {}),
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      message: 'Error interno del servidor al programar instalación',
      error: error.message
    });
  }
});
*/

// Generar orden de instalación técnica completa
router.get('/:id/orden-tecnica', auth, verificarPermiso('instalaciones', 'leer'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const instalacion = await Instalacion.findById(id)
      .populate('pedido');
      // .populate('fabricacion'); // Comentado temporalmente

    if (!instalacion) {
      return res.status(404).json({ message: 'Instalación no encontrada' });
    }

    // Generar orden técnica completa usando el método del modelo
    const ordenTecnica = instalacion.generarOrdenInstalacion();
    
    res.json({
      instalacion: {
        numero: instalacion.numero,
        fechaProgramada: instalacion.fechaProgramada,
        estado: instalacion.estado
      },
      ordenTecnica
    });

  } catch (error) {
    logger.error('Error generando orden técnica de instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'generarOrdenTecnica',
      usuarioId: req.usuario?._id || null,
      instalacionId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    if (error.message.includes('No se puede generar')) {
      return res.status(400).json({
        message: error.message,
        solucion: 'Verifique que la información técnica esté completa en el levantamiento original'
      });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Funciones auxiliares
function generarChecklistInstalacion(productos) {
  const checklist = [];
  
  // Items básicos para todos los productos
  checklist.push(
    { item: 'Verificar medidas en sitio', completado: false, obligatorio: true },
    { item: 'Confirmar ubicación de instalación', completado: false, obligatorio: true },
    { item: 'Verificar herramientas necesarias', completado: false, obligatorio: true }
  );
  
  // Items específicos por tipo de producto
  productos.forEach((producto, index) => {
    const base = `Producto ${index + 1} (${producto.ubicacion})`;
    
    checklist.push(
      { item: `${base}: Verificar medidas`, completado: false, obligatorio: true },
      { item: `${base}: Instalar soporte`, completado: false, obligatorio: true },
      { item: `${base}: Montar producto`, completado: false, obligatorio: true },
      { item: `${base}: Probar funcionamiento`, completado: false, obligatorio: true }
    );
    
    // Items específicos para motorizados
    if (producto.motorizacion) {
      checklist.push(
        { item: `${base}: Conexión eléctrica motor`, completado: false, obligatorio: true },
        { item: `${base}: Programar control`, completado: false, obligatorio: true },
        { item: `${base}: Probar motor y control`, completado: false, obligatorio: true }
      );
    }
    
    // Items específicos para toldos
    if (producto.toldo) {
      checklist.push(
        { item: `${base}: Instalar kit toldo`, completado: false, obligatorio: true },
        { item: `${base}: Tensionar correctamente`, completado: false, obligatorio: true },
        { item: `${base}: Verificar resistencia viento`, completado: false, obligatorio: false }
      );
    }
  });
  
  // Items finales
  checklist.push(
    { item: 'Limpieza del área de trabajo', completado: false, obligatorio: true },
    { item: 'Entrega de controles al cliente', completado: false, obligatorio: true },
    { item: 'Explicación de uso al cliente', completado: false, obligatorio: true },
    { item: 'Firma de conformidad cliente', completado: false, obligatorio: true }
  );
  
  return checklist;
}

async function generarNumeroInstalacion() {
  try {
    const year = new Date().getFullYear();
    const count = await Instalacion.countDocuments({
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1)
      }
    });
    return `INS-${year}-${String(count + 1).padStart(4, '0')}`;
  } catch (error) {
    logger.error('Error generando número de instalación', {
      ruta: 'instalacionesRoutes',
      accion: 'generarNumeroInstalacion',
      error: error.message,
      stack: error.stack
    });
    return `INS-${new Date().getFullYear()}-${Date.now()}`;
  }
}

module.exports = router;
