/**
 * =====================================================================================
 * ATENCIÓN: Este servicio ha sido desactivado por completo.
 * El modelo `ProyectoPedido.legacy` del que dependía fue eliminado del sistema.
 * Todas las funciones han sido reemplazadas por stubs para evitar errores de servidor.
 * =====================================================================================
 */
const logger = require('../config/logger');

const serviceName = 'SyncLegacyService';

class SyncLegacyService {

  logWarning(functionName) {
    logger.warn(`Intento de acceso a servicio legacy deshabilitado: ${serviceName}.${functionName}`);
  }

  /**
   * [DESACTIVADO] Migra un ProyectoPedido.legacy a Pedido moderno
   */
  async migrarProyectoPedidoAPedido(legacyId) {
    this.logWarning('migrarProyectoPedidoAPedido');
    // Lanza un error para que cualquier proceso que dependa de esto falle explícitamente.
    throw new Error(`[${serviceName}] La función migrarProyectoPedidoAPedido está desactivada. El modelo legacy no existe.`);
  }

  /**
   * [DESACTIVADO] Actualizar pedido existente desde legacy
   */
  async actualizarPedidoDesdeLegacy(pedido, legacy) {
    this.logWarning('actualizarPedidoDesdeLegacy');
    // Devuelve el pedido original sin hacer cambios.
    return pedido;
  }

  /**
   * [DESACTIVADO] Mapear estados legacy a estados modernos
   */
  mapearEstado(estadoLegacy) {
    this.logWarning('mapearEstado');
    // Devuelve un estado por defecto seguro.
    return 'confirmado';
  }

  /**
   * [DESACTIVADO] Migrar todos los ProyectoPedido legacy
   */
  async migrarTodos(limite = 100) {
    this.logWarning('migrarTodos');
    // Devuelve un reporte de que no se procesó nada.
    return {
      total: 0,
      procesados: 0,
      exitosos: 0,
      actualizados: 0,
      errores: 0,
      erroresDetalle: []
    };
  }

  /**
   * [DESACTIVADO] Validar integridad post-migración
   */
  async validarMigracion() {
    this.logWarning('validarMigracion');
    // Devuelve un reporte de validación vacío y exitoso.
    return {
      fecha: new Date(),
      totales: { legacy: 0, moderno: 0, diferencia: 0 },
      montos: { legacy: 0, moderno: 0, diferencia: 0 },
      estados: { legacy: [], moderno: [] },
      discrepancias: [],
      estado: 'EXITOSO' // Reporta éxito porque no hay nada que comparar.
    };
  }

  /**
   * [DESACTIVADO] Generar reporte detallado de migración
   */
  async generarReporte() {
    this.logWarning('generarReporte');
    return `# 📊 Reporte de Migración Desactivado\n\nEl servicio de migración legacy ha sido desactivado.`;
  }
}

module.exports = new SyncLegacyService();
