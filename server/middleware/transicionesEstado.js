/**
 * Middleware para validar transiciones de estado en proyectos
 * Asegura que los cambios de estado sigan el flujo correcto
 */

const logger = require('../config/logger');

// Definir el flujo de estados válidos
const FLUJO_ESTADOS = {
  'levantamiento': ['cotizacion', 'cancelado'],
  'cotizacion': ['aprobado', 'levantamiento', 'cancelado'],
  'aprobado': ['fabricacion', 'cotizacion', 'cancelado'],
  'fabricacion': ['instalacion', 'aprobado', 'cancelado'],
  'instalacion': ['completado', 'fabricacion', 'cancelado'],
  'completado': [], // Estado final
  'cancelado': ['levantamiento'] // Puede reactivarse
};

// Estados que requieren validaciones especiales
const VALIDACIONES_ESPECIALES = {
  'aprobado': {
    requiere: ['cotizacion_existente'],
    mensaje: 'Debe existir al menos una cotización para aprobar el proyecto'
  },
  'fabricacion': {
    requiere: ['pedido_existente'],
    mensaje: 'Debe existir al menos un pedido confirmado para iniciar fabricación'
  },
  'instalacion': {
    requiere: ['orden_fabricacion_completada'],
    mensaje: 'Debe completarse la fabricación antes de programar instalación'
  },
  'completado': {
    requiere: ['instalacion_completada'],
    mensaje: 'Debe completarse la instalación antes de marcar como completado'
  }
};

/**
 * Middleware para validar transiciones de estado
 */
const validarTransicionEstado = async (req, res, next) => {
  try {
    const { nuevo_estado } = req.body;
    const { id } = req.params;

    if (!nuevo_estado) {
      return res.status(400).json({
        success: false,
        message: 'El nuevo estado es requerido'
      });
    }

    // Obtener el proyecto actual
    const Proyecto = require('../models/Proyecto');
    const proyecto = await Proyecto.findById(id)
      .populate(['cotizaciones', 'pedidos', 'ordenes_fabricacion', 'instalaciones']);

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const estadoActual = proyecto.estado;

    // Validar que la transición sea válida
    const transicionesValidas = FLUJO_ESTADOS[estadoActual] || [];
    
    if (!transicionesValidas.includes(nuevo_estado)) {
      return res.status(400).json({
        success: false,
        message: `Transición inválida: no se puede cambiar de "${estadoActual}" a "${nuevo_estado}"`,
        transiciones_validas: transicionesValidas,
        estado_actual: estadoActual
      });
    }

    // Validaciones especiales según el nuevo estado
    if (VALIDACIONES_ESPECIALES[nuevo_estado]) {
      const validacion = VALIDACIONES_ESPECIALES[nuevo_estado];
      const esValido = await validarRequisitosEspeciales(proyecto, validacion.requiere);
      
      if (!esValido) {
        return res.status(400).json({
          success: false,
          message: validacion.mensaje,
          requisitos: validacion.requiere,
          estado_solicitado: nuevo_estado
        });
      }
    }

    // Si llegamos aquí, la transición es válida
    req.transicion = {
      estadoAnterior: estadoActual,
      nuevoEstado: nuevo_estado,
      esValida: true
    };

    next();

  } catch (error) {
    logger.error('Error validando transición de estado', {
      middleware: 'transicionesEstado',
      accion: 'validarTransicion',
      proyectoId: req.params?.id,
      nuevoEstado: req.body?.nuevo_estado,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error interno validando transición',
      error: error.message
    });
  }
};

/**
 * Validar requisitos especiales para ciertos estados
 */
async function validarRequisitosEspeciales(proyecto, requisitos) {
  for (const requisito of requisitos) {
    switch (requisito) {
      case 'cotizacion_existente':
        if (!proyecto.cotizaciones || proyecto.cotizaciones.length === 0) {
          return false;
        }
        break;

      case 'pedido_existente':
        if (!proyecto.pedidos || proyecto.pedidos.length === 0) {
          return false;
        }
        // Verificar que al menos un pedido esté confirmado
        const pedidoConfirmado = proyecto.pedidos.some(p => 
          p.estado === 'confirmado' || p.estado === 'pagado'
        );
        if (!pedidoConfirmado) {
          return false;
        }
        break;

      case 'orden_fabricacion_completada':
        if (!proyecto.ordenes_fabricacion || proyecto.ordenes_fabricacion.length === 0) {
          return false;
        }
        // Verificar que al menos una orden esté completada
        const ordenCompletada = proyecto.ordenes_fabricacion.some(o => 
          o.estado === 'completada' || o.estado === 'lista'
        );
        if (!ordenCompletada) {
          return false;
        }
        break;

      case 'instalacion_completada':
        if (!proyecto.instalaciones || proyecto.instalaciones.length === 0) {
          return false;
        }
        // Verificar que al menos una instalación esté completada
        const instalacionCompletada = proyecto.instalaciones.some(i => 
          i.estado === 'completada'
        );
        if (!instalacionCompletada) {
          return false;
        }
        break;

      default:
        logger.warn('Requisito desconocido al validar transición de estado', {
          middleware: 'transicionesEstado',
          accion: 'validarRequisitoEspecial',
          requisito,
          proyectoId: proyecto._id
        });
        return false;
    }
  }

  return true;
}

/**
 * Middleware para registrar cambios de estado (auditoría)
 */
const registrarCambioEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { observaciones } = req.body;
    const usuario = req.usuario;
    const transicion = req.transicion;

    if (!transicion) {
      return next();
    }

    // Registrar el cambio en logs (se puede expandir para guardar en BD)
    logger.info('Cambio de estado registrado', {
      middleware: 'transicionesEstado',
      accion: 'registrarCambioEstado',
      proyectoId: id,
      usuario: usuario?.nombre || usuario?.email,
      estadoAnterior: transicion.estadoAnterior,
      nuevoEstado: transicion.nuevoEstado,
      observaciones: observaciones || 'Sin observaciones',
      timestamp: new Date().toISOString()
    });

    // Aquí se puede agregar lógica para guardar en una tabla de auditoría
    // await RegistroAuditoria.create({ ... });

    next();

  } catch (error) {
    logger.error('Error registrando cambio de estado en auditoría', {
      middleware: 'transicionesEstado',
      accion: 'registrarCambioEstado',
      proyectoId: req.params?.id,
      error: error.message,
      stack: error.stack
    });
    // No interrumpir el flujo por errores de auditoría
    next();
  }
};

/**
 * Obtener información sobre transiciones válidas para un estado
 */
const obtenerTransicionesValidas = (req, res) => {
  try {
    const { estado } = req.params;

    if (!FLUJO_ESTADOS[estado]) {
      return res.status(400).json({
        success: false,
        message: `Estado "${estado}" no es válido`,
        estados_validos: Object.keys(FLUJO_ESTADOS)
      });
    }

    const transicionesValidas = FLUJO_ESTADOS[estado];
    const validacionesEspeciales = {};

    // Agregar información sobre validaciones especiales
    transicionesValidas.forEach(estado => {
      if (VALIDACIONES_ESPECIALES[estado]) {
        validacionesEspeciales[estado] = VALIDACIONES_ESPECIALES[estado];
      }
    });

    res.json({
      success: true,
      data: {
        estado_actual: estado,
        transiciones_validas: transicionesValidas,
        validaciones_especiales: validacionesEspeciales,
        flujo_completo: FLUJO_ESTADOS
      }
    });

  } catch (error) {
    logger.error('Error obteniendo transiciones válidas', {
      middleware: 'transicionesEstado',
      accion: 'obtenerTransicionesValidas',
      estadoSolicitado: req.params?.estado,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  validarTransicionEstado,
  registrarCambioEstado,
  obtenerTransicionesValidas,
  FLUJO_ESTADOS,
  VALIDACIONES_ESPECIALES
};
