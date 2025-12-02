const Pedido = require('../models/Pedido');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const { construirProductosDesdePartidas } = require('../utils/cotizacionMapper');

/**
 * Servicio para sincronizar y enriquecer pedidos legacy con datos del nuevo modelo Proyecto.
 */
class SyncLegacyService {
  constructor() {
    this.stats = {
      pedidosAnalizados: 0,
      pedidosEnriquecidos: 0,
      pedidosSinProyecto: 0,
      pedidosSinLevantamiento: 0,
      errores: 0,
      totalAntes: 0,
      totalDespues: 0
    };
  }

  /**
   * Verifica si un producto de un pedido es considerado "legacy" o incompleto.
   * Un producto es legacy si no tiene la metadata `partidaOriginal`.
   * @param {Object} producto - El producto del pedido a verificar.
   * @returns {boolean} - True si el producto es legacy.
   */
  _esProductoLegacy(producto) {
    return !producto.partidaOriginal || typeof producto.partidaOriginal.index === 'undefined';
  }

  /**
   * Ejecuta el proceso de sincronización y enriquecimiento.
   * @param {number} [limit=0] - Límite de pedidos a procesar (0 para todos).
   */
  async ejecutar(limit = 0) {
    logger.info('Inicio del proceso de sincronización de pedidos legacy', { service: 'SyncLegacyService', limit });

    const query = Pedido.find().sort({ fechaPedido: -1 });
    if (limit > 0) {
      query.limit(limit);
    }

    const pedidos = await query;
    this.stats.totalAntes = pedidos.reduce((sum, p) => sum + p.montoTotal, 0);

    for (const pedido of pedidos) {
      this.stats.pedidosAnalizados++;
      try {
        await this._procesarPedido(pedido);
      } catch (error) {
        this.stats.errores++;
        logger.error(`Error procesando el pedido ${pedido.numero}`, {
          service: 'SyncLegacyService',
          pedidoId: pedido._id,
          error: error.message,
          stack: error.stack
        });
      }
    }

    this.stats.totalDespues = (await Pedido.find(query.getQuery())).reduce((sum, p) => sum + p.montoTotal, 0);
    this.imprimirEstadisticas();
    return this.stats;
  }

  /**
   * Procesa un pedido individual para enriquecerlo si es necesario.
   * @param {Object} pedido - El documento del pedido de Mongoose.
   */
  async _procesarPedido(pedido) {
    // Verificar si al menos un producto es legacy
    const necesitaEnriquecimiento = pedido.productos.some(p => this._esProductoLegacy(p));

    if (!necesitaEnriquecimiento) {
      logger.info(`El pedido ${pedido.numero} ya está actualizado. Omitiendo.`, { service: 'SyncLegacyService', pedidoId: pedido._id });
      return;
    }

    // Buscar el proyecto asociado a través de la cotización
    const proyecto = await Proyecto.findOne({ cotizaciones: pedido.cotizacion });

    if (!proyecto) {
      this.stats.pedidosSinProyecto++;
      logger.warn(`No se encontró un proyecto para el pedido ${pedido.numero}. Omitiendo.`, { service: 'SyncLegacyService', pedidoId: pedido._id, cotizacionId: pedido.cotizacion });
      return;
    }

    // Verificar que el proyecto tenga un levantamiento con partidas
    if (!proyecto.levantamiento || !proyecto.levantamiento.partidas || proyecto.levantamiento.partidas.length === 0) {
      this.stats.pedidosSinLevantamiento++;
      logger.warn(`El proyecto asociado al pedido ${pedido.numero} no tiene un levantamiento válido. Omitiendo.`, { service: 'SyncLegacyService', pedidoId: pedido._id, proyectoId: proyecto._id });
      return;
    }

    // Construir los productos enriquecidos
    const productosEnriquecidos = construirProductosDesdePartidas(proyecto.levantamiento.partidas);

    if (productosEnriquecidos.length === 0) {
      logger.warn(`La construcción de productos para el pedido ${pedido.numero} resultó en un array vacío. Omitiendo actualización.`, { service: 'SyncLegacyService', pedidoId: pedido._id });
      return;
    }

    // Actualizar el pedido
    pedido.productos = productosEnriquecidos;
    // Recalcular el total basado en los nuevos productos
    const subtotal = productosEnriquecidos.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    const iva = subtotal * 0.16; // Asumimos IVA estándar
    pedido.montoTotal = subtotal + iva;
    
    // Marcar el pedido como migrado/actualizado
    pedido.fuenteDatos = 'proyecto-levantamiento';

    await pedido.save();

    this.stats.pedidosEnriquecidos++;
    logger.info(`Pedido ${pedido.numero} enriquecido y actualizado exitosamente.`, { service: 'SyncLegacyService', pedidoId: pedido._id, productos: productosEnriquecidos.length });
  }

  /**
   * Imprime las estadísticas finales del proceso.
   */
  imprimirEstadisticas() {
    logger.info('--------------------------------------------------', { service: 'SyncLegacyService' });
    logger.info('       Estadísticas de Sincronización Legacy', { service: 'SyncLegacyService' });
    logger.info('--------------------------------------------------', { service: 'SyncLegacyService' });
    logger.info(`Pedidos analizados:          ${this.stats.pedidosAnalizados}`, { service: 'SyncLegacyService' });
    logger.info(`Pedidos enriquecidos:        ${this.stats.pedidosEnriquecidos}`, { service: 'SyncLegacyService' });
    logger.info(`Pedidos sin proyecto:        ${this.stats.pedidosSinProyecto}`, { service: 'SyncLegacyService' });
    logger.info(`Pedidos sin levantamiento:   ${this.stats.pedidosSinLevantamiento}`, { service: 'SyncLegacyService' });
    logger.info(`Errores:                     ${this.stats.errores}`, { service: 'SyncLegacyService' });
    logger.info(`Monto total ANTES:           $${this.stats.totalAntes.toFixed(2)}`, { service: 'SyncLegacyService' });
    logger.info(`Monto total DESPUÉS:         $${this.stats.totalDespues.toFixed(2)}`, { service: 'SyncLegacyService' });
    logger.info(`Diferencia:                  $${(this.stats.totalDespues - this.stats.totalAntes).toFixed(2)}`, { service: 'SyncLegacyService' });
    logger.info('--------------------------------------------------', { service: 'SyncLegacyService' });

    if (this.stats.totalAntes.toFixed(2) !== this.stats.totalDespues.toFixed(2)) {
        logger.warn('¡DISCREPANCIA EN LOS TOTALES! Revisar logs.', { service: 'SyncLegacyService' });
    } else {
        logger.info('✅ Los totales antes y después coinciden.', { service: 'SyncLegacyService' });
    }
  }
}

module.exports = SyncLegacyService;
