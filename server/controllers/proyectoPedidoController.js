const mongoose = require('mongoose');

// =====================================================================================
// ATENCIÓN: Este controlador ha sido desactivado por completo.
// El modelo `ProyectoPedido.legacy` del que dependía fue eliminado del sistema.
// Todas las funciones han sido reemplazadas por stubs para evitar errores de servidor.
// =====================================================================================

const disabledError = (res, functionName) => {
  console.warn(`Intento de acceso a controlador legacy deshabilitado: ${functionName}`);
  return res.status(501).json({
    success: false,
    message: 'Esta funcionalidad ha sido desactivada y está pendiente de migración.',
    code: 'LEGACY_DISABLED'
  });
};

const notFoundError = (res, functionName) => {
    console.warn(`Intento de acceso a controlador legacy deshabilitado: ${functionName}`);
    return res.status(404).json({
      success: false,
      message: 'Recurso no encontrado (funcionalidad legacy desactivada)',
      code: 'LEGACY_NOT_FOUND'
    });
  };

exports.crearDesdeCotzacion = async (req, res) => disabledError(res, 'crearDesdeCotzacion');

exports.obtenerProyectos = async (req, res) => {
    console.warn('Intento de acceso a controlador legacy deshabilitado: obtenerProyectos');
    // Devuelve una estructura de paginación vacía para no romper UIs
    return res.json({
        success: true,
        data: {
            docs: [],
            totalDocs: 0,
            limit: req.query.limit || 20,
            totalPages: 0,
            page: req.query.page || 1,
            pagingCounter: 0,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
        }
    });
};

exports.obtenerProyectoPorId = async (req, res) => notFoundError(res, 'obtenerProyectoPorId');

exports.cambiarEstado = async (req, res) => disabledError(res, 'cambiarEstado');

exports.agregarNota = async (req, res) => disabledError(res, 'agregarNota');

exports.registrarPago = async (req, res) => disabledError(res, 'registrarPago');

exports.asignarResponsable = async (req, res) => disabledError(res, 'asignarResponsable');

exports.obtenerEstadisticas = async (req, res) => {
    console.warn('Intento de acceso a controlador legacy deshabilitado: obtenerEstadisticas');
    // Devuelve estadísticas vacías
    return res.json({
        success: true,
        data: {
            porEstado: [],
            retrasados: 0,
            sinPagar: 0
        }
    });
};

exports.actualizarProducto = async (req, res) => disabledError(res, 'actualizarProducto');

module.exports = exports;
