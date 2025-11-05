/**
 * Servicio de Sincronización Legacy → Moderno
 * 
 * Migra datos de ProyectoPedido.legacy a Pedido moderno
 * preservando toda la funcionalidad y datos históricos.
 * 
 * @since 4 Nov 2025
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');

// Importar modelos
const Pedido = require('../models/Pedido');
const ProyectoPedido = require('../models/ProyectoPedido.legacy');

class SyncLegacyService {
  
  /**
   * Migrar un ProyectoPedido.legacy a Pedido moderno
   * @param {String} legacyId - ID del ProyectoPedido legacy
   * @returns {Object} Pedido migrado
   */
  async migrarProyectoPedidoAPedido(legacyId) {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    const Pedido = mongoose.model('Pedido');
    
    try {
      const legacy = await ProyectoPedido.findById(legacyId);
      if (!legacy) {
        throw new Error(`ProyectoPedido ${legacyId} no encontrado`);
      }
      
      // Verificar si ya existe
      const existente = await Pedido.findOne({ 
        numero: legacy.numero 
      });
      
      if (existente) {
        logger.warn('Pedido ya migrado, actualizando', {
          legacyId,
          pedidoId: existente._id,
          numero: legacy.numero
        });
        
        // Actualizar datos si es necesario
        return await this.actualizarPedidoDesdeLegacy(existente, legacy);
      }
      
      // Crear nuevo pedido con datos legacy
      const pedido = new Pedido({
        cotizacion: legacy.cotizacion,
        prospecto: legacy.prospecto,
        numero: legacy.numero,
        fechaPedido: legacy.cronograma?.fechaPedido || legacy.createdAt,
        
        // Montos
        montoTotal: legacy.pagos?.montoTotal || 0,
        anticipo: {
          monto: legacy.pagos?.anticipo?.monto || 0,
          porcentaje: legacy.pagos?.anticipo?.porcentaje || 50,
          fechaPago: legacy.pagos?.anticipo?.fechaPago,
          metodoPago: legacy.pagos?.anticipo?.metodoPago || 'transferencia',
          referencia: legacy.pagos?.anticipo?.referencia,
          comprobante: legacy.pagos?.anticipo?.comprobante,
          pagado: legacy.pagos?.anticipo?.pagado || false
        },
        saldo: {
          monto: legacy.pagos?.saldo?.monto || 0,
          porcentaje: legacy.pagos?.saldo?.porcentaje || 50,
          fechaVencimiento: legacy.pagos?.saldo?.fechaVencimiento,
          fechaPago: legacy.pagos?.saldo?.fechaPago,
          metodoPago: legacy.pagos?.saldo?.metodoPago,
          referencia: legacy.pagos?.saldo?.referencia,
          comprobante: legacy.pagos?.saldo?.comprobante,
          pagado: legacy.pagos?.saldo?.pagado || false
        },
        
        // Estado y fechas
        estado: this.mapearEstado(legacy.estado),
        fechaInicioFabricacion: legacy.cronograma?.fechaInicioFabricacion,
        fechaFinFabricacion: legacy.cronograma?.fechaFinFabricacionReal,
        fechaInstalacion: legacy.cronograma?.fechaInstalacionReal,
        fechaEntrega: legacy.cronograma?.fechaEntrega,
        
        // Productos
        productos: (legacy.productos || []).map(p => ({
          nombre: p.nombre,
          descripcion: p.descripcion,
          categoria: p.categoria,
          material: p.material,
          color: p.color,
          cristal: p.cristal,
          herrajes: p.herrajes,
          medidas: p.medidas,
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario,
          subtotal: p.subtotal,
          requiereR24: p.requiereR24,
          tiempoFabricacion: p.tiempoFabricacion,
          estadoFabricacion: p.estadoFabricacion || 'pendiente'
        })),
        
        // Dirección de entrega
        direccionEntrega: legacy.entrega?.direccion || legacy.cliente?.direccion || {},
        
        // Contacto de entrega
        contactoEntrega: legacy.entrega?.contacto || {
          nombre: legacy.cliente?.nombre,
          telefono: legacy.cliente?.telefono
        },
        
        // Notas (PRESERVAR - migrar con nuevo formato)
        notas: (legacy.notas || []).map(n => ({
          contenido: n.contenido,
          usuario: n.usuario,
          etapa: n.etapa || 'general',
          tipo: n.tipo || 'info',
          fecha: n.fecha || n.createdAt || new Date()
        })),
        
        // Archivos
        archivos: (legacy.archivos || []).map(a => ({
          tipo: a.tipo || 'otro',
          nombre: a.nombre,
          url: a.url,
          fechaSubida: a.fechaSubida || a.createdAt || new Date()
        })),
        
        // Responsables
        vendedor: legacy.responsables?.vendedor,
        fabricante: legacy.responsables?.fabricante,
        instalador: legacy.responsables?.instalador,
        
        // Cancelación (si aplica)
        cancelacion: legacy.estado === 'cancelado' ? {
          fecha: legacy.updatedAt,
          motivo: legacy.motivoCancelacion || 'No especificado',
          responsable: legacy.actualizado_por
        } : undefined,
        
        // Metadata - preservar fechas originales
        createdAt: legacy.createdAt,
        updatedAt: legacy.updatedAt
      });
      
      await pedido.save();
      
      logger.info('ProyectoPedido migrado a Pedido', {
        legacyId: legacy._id,
        pedidoId: pedido._id,
        numero: pedido.numero,
        montoTotal: pedido.montoTotal,
        productos: pedido.productos.length,
        notas: pedido.notas.length
      });
      
      return pedido;
      
    } catch (error) {
      logger.error('Error migrando ProyectoPedido', {
        legacyId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Actualizar pedido existente desde legacy
   * @param {Object} pedido - Pedido existente
   * @param {Object} legacy - ProyectoPedido legacy
   * @returns {Object} Pedido actualizado
   */
  async actualizarPedidoDesdeLegacy(pedido, legacy) {
    // Solo actualizar si legacy tiene datos más recientes
    if (legacy.updatedAt > pedido.updatedAt) {
      pedido.montoTotal = legacy.pagos?.montoTotal || pedido.montoTotal;
      pedido.estado = this.mapearEstado(legacy.estado);
      
      // Actualizar fechas si están más completas en legacy
      if (legacy.cronograma?.fechaFinFabricacionReal && !pedido.fechaFinFabricacion) {
        pedido.fechaFinFabricacion = legacy.cronograma.fechaFinFabricacionReal;
      }
      if (legacy.cronograma?.fechaInstalacionReal && !pedido.fechaInstalacion) {
        pedido.fechaInstalacion = legacy.cronograma.fechaInstalacionReal;
      }
      if (legacy.cronograma?.fechaEntrega && !pedido.fechaEntrega) {
        pedido.fechaEntrega = legacy.cronograma.fechaEntrega;
      }
      
      await pedido.save();
      
      logger.info('Pedido actualizado desde legacy', {
        pedidoId: pedido._id,
        numero: pedido.numero
      });
    }
    
    return pedido;
  }
  
  /**
   * Mapear estados legacy a estados modernos
   * @param {String} estadoLegacy - Estado del modelo legacy
   * @returns {String} Estado mapeado
   */
  mapearEstado(estadoLegacy) {
    const mapa = {
      'cotizado': 'confirmado',
      'confirmado': 'confirmado',
      'en_fabricacion': 'en_fabricacion',
      'fabricado': 'fabricado',
      'en_instalacion': 'en_instalacion',
      'completado': 'entregado',
      'instalado': 'instalado',
      'entregado': 'entregado',
      'cancelado': 'cancelado'
    };
    
    return mapa[estadoLegacy] || 'confirmado';
  }
  
  /**
   * Migrar todos los ProyectoPedido legacy
   * @param {Number} limite - Límite de registros a migrar (default: 100)
   * @returns {Object} Estadísticas de migración
   */
  async migrarTodos(limite = 100) {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    
    try {
      const total = await ProyectoPedido.countDocuments();
      logger.info('Iniciando migración masiva', { 
        total, 
        limite,
        script: 'syncLegacyService.migrarTodos'
      });
      
      let procesados = 0;
      let exitosos = 0;
      let actualizados = 0;
      let errores = 0;
      const erroresDetalle = [];
      
      const cursor = ProyectoPedido.find().limit(limite).cursor();
      
      for (let legacy = await cursor.next(); legacy != null; legacy = await cursor.next()) {
        try {
          const resultado = await this.migrarProyectoPedidoAPedido(legacy._id);
          
          if (resultado.isNew === false) {
            actualizados++;
          } else {
            exitosos++;
          }
          
        } catch (error) {
          logger.error('Error migrando ProyectoPedido individual', {
            legacyId: legacy._id,
            numero: legacy.numero,
            error: error.message
          });
          errores++;
          erroresDetalle.push({
            legacyId: legacy._id,
            numero: legacy.numero,
            error: error.message
          });
        }
        procesados++;
        
        // Log de progreso cada 10 registros
        if (procesados % 10 === 0) {
          logger.info('Progreso de migración', {
            procesados,
            exitosos,
            actualizados,
            errores,
            porcentaje: Math.round((procesados / Math.min(total, limite)) * 100)
          });
        }
      }
      
      const resultado = {
        total,
        procesados,
        exitosos,
        actualizados,
        errores,
        erroresDetalle: erroresDetalle.length > 0 ? erroresDetalle : undefined
      };
      
      logger.info('Migración masiva completada', resultado);
      
      return resultado;
      
    } catch (error) {
      logger.error('Error en migración masiva', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Validar integridad post-migración
   * @returns {Object} Reporte de validación
   */
  async validarMigracion() {
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    const Pedido = mongoose.model('Pedido');
    
    try {
      logger.info('Iniciando validación de migración', {
        script: 'syncLegacyService.validarMigracion'
      });
      
      const totalLegacy = await ProyectoPedido.countDocuments();
      const totalModerno = await Pedido.countDocuments();
      
      const discrepancias = [];
      
      // Verificar montos totales
      const legacyMontos = await ProyectoPedido.aggregate([
        { $group: { _id: null, total: { $sum: '$pagos.montoTotal' } } }
      ]);
      
      const modernoMontos = await Pedido.aggregate([
        { $group: { _id: null, total: { $sum: '$montoTotal' } } }
      ]);
      
      const montoLegacy = legacyMontos[0]?.total || 0;
      const montoModerno = modernoMontos[0]?.total || 0;
      const diferenciaMonto = Math.abs(montoLegacy - montoModerno);
      
      if (diferenciaMonto > 0.01) {
        discrepancias.push({
          tipo: 'monto_total',
          legacy: montoLegacy,
          moderno: montoModerno,
          diferencia: diferenciaMonto,
          porcentaje: montoLegacy > 0 ? (diferenciaMonto / montoLegacy) * 100 : 0
        });
      }
      
      // Verificar conteo por estado
      const estadosLegacy = await ProyectoPedido.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } }
      ]);
      
      const estadosModerno = await Pedido.aggregate([
        { $group: { _id: '$estado', count: { $sum: 1 } } }
      ]);
      
      // Verificar números duplicados
      const numerosDuplicados = await Pedido.aggregate([
        { $group: { _id: '$numero', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      
      if (numerosDuplicados.length > 0) {
        discrepancias.push({
          tipo: 'numeros_duplicados',
          cantidad: numerosDuplicados.length,
          numeros: numerosDuplicados.map(n => n._id)
        });
      }
      
      // Verificar pedidos sin cotización
      const sinCotizacion = await Pedido.countDocuments({ cotizacion: null });
      if (sinCotizacion > 0) {
        discrepancias.push({
          tipo: 'sin_cotizacion',
          cantidad: sinCotizacion
        });
      }
      
      const resultado = {
        fecha: new Date(),
        totales: {
          legacy: totalLegacy,
          moderno: totalModerno,
          diferencia: totalLegacy - totalModerno
        },
        montos: {
          legacy: montoLegacy,
          moderno: montoModerno,
          diferencia: diferenciaMonto
        },
        estados: {
          legacy: estadosLegacy,
          moderno: estadosModerno
        },
        discrepancias: discrepancias.length > 0 ? discrepancias : [],
        estado: discrepancias.length === 0 ? 'EXITOSO' : 'CON_DISCREPANCIAS'
      };
      
      logger.info('Validación de migración completada', {
        estado: resultado.estado,
        totalLegacy,
        totalModerno,
        montoLegacy,
        montoModerno,
        discrepancias: discrepancias.length
      });
      
      return resultado;
      
    } catch (error) {
      logger.error('Error en validación de migración', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Generar reporte detallado de migración
   * @returns {String} Reporte en formato markdown
   */
  async generarReporte() {
    const validacion = await this.validarMigracion();
    
    let reporte = `# 📊 Reporte de Migración Legacy → Moderno\n\n`;
    reporte += `**Fecha:** ${validacion.fecha.toLocaleString('es-MX')}\n`;
    reporte += `**Estado:** ${validacion.estado === 'EXITOSO' ? '✅ EXITOSO' : '⚠️ CON DISCREPANCIAS'}\n\n`;
    reporte += `---\n\n`;
    
    reporte += `## Totales\n\n`;
    reporte += `| Fuente | Cantidad |\n`;
    reporte += `|--------|----------|\n`;
    reporte += `| **Legacy (ProyectoPedido)** | ${validacion.totales.legacy} |\n`;
    reporte += `| **Moderno (Pedido)** | ${validacion.totales.moderno} |\n`;
    reporte += `| **Diferencia** | ${validacion.totales.diferencia} |\n\n`;
    
    reporte += `## Montos\n\n`;
    reporte += `| Fuente | Monto Total |\n`;
    reporte += `|--------|-------------|\n`;
    reporte += `| **Legacy** | $${validacion.montos.legacy.toLocaleString('es-MX', {minimumFractionDigits: 2})} |\n`;
    reporte += `| **Moderno** | $${validacion.montos.moderno.toLocaleString('es-MX', {minimumFractionDigits: 2})} |\n`;
    reporte += `| **Diferencia** | $${validacion.montos.diferencia.toLocaleString('es-MX', {minimumFractionDigits: 2})} |\n\n`;
    
    if (validacion.discrepancias.length > 0) {
      reporte += `## ⚠️ Discrepancias Detectadas\n\n`;
      validacion.discrepancias.forEach((d, i) => {
        reporte += `### ${i + 1}. ${d.tipo.replace(/_/g, ' ').toUpperCase()}\n\n`;
        reporte += `\`\`\`json\n${JSON.stringify(d, null, 2)}\n\`\`\`\n\n`;
      });
    } else {
      reporte += `## ✅ Sin Discrepancias\n\n`;
      reporte += `La migración se completó exitosamente sin discrepancias detectadas.\n\n`;
    }
    
    reporte += `---\n\n`;
    reporte += `**Generado por:** syncLegacyService\n`;
    reporte += `**Versión:** 1.0\n`;
    
    return reporte;
  }
}

module.exports = new SyncLegacyService();
