const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');
const logger = require('../config/logger');

async function fixCotizaciones() {
  try {
    logger.info('Iniciando corrección de cotizaciones', {
      script: 'fixCotizaciones'
    });
    
    // Obtener todas las cotizaciones, usando .lean() para mayor rendimiento en lecturas masivas
    const cotizaciones = await Cotizacion.find({}, {
      _id: 1,
      numero: 1,
      productos: 1,
      descuento: 1,
      costoInstalacion: 1,
      incluirIVA: 1,
      formaPago: 1,
      subtotal: 1, // Mantener para loguear el valor anterior
      iva: 1,      // Mantener para loguear el valor anterior
      total: 1     // Mantener para loguear el valor anterior
    }).lean(); 

    logger.info('Cotizaciones obtenidas para corrección', {
      script: 'fixCotizaciones',
      totalCotizaciones: cotizaciones.length
    });

    for (const rawCotizacion of cotizaciones) {
      const cotizacion = { ...rawCotizacion }; // Crear una copia mutable ya que .lean() devuelve objetos JS planos

      logger.info('Procesando cotización para recalcular totales', {
        script: 'fixCotizaciones',
        cotizacionId: cotizacion._id,
        numeroCotizacion: cotizacion.numero,
        productosRegistrados: cotizacion.productos?.length || 0
      });
      
      let subtotalCorregido = 0;
      
      // Recalcular subtotales de productos
      if (cotizacion.productos && cotizacion.productos.length > 0) {
        cotizacion.productos = cotizacion.productos.map((producto, index) => {
          const precio = producto.precioUnitario || 0;
          const cantidad = producto.cantidad || 1;
          const unidadMedida = producto.unidadMedida;
          
          let subtotalProducto = 0;
          
          const area = producto.medidas?.area || 0;

          if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
            subtotalProducto = precio * cantidad;
          } else {
            subtotalProducto = area * precio * cantidad;
          }
          
          logger.info('Producto recalculado en cotización', {
            script: 'fixCotizaciones',
            cotizacionId: cotizacion._id,
            numeroCotizacion: cotizacion.numero,
            indiceProducto: index + 1,
            nombreProducto: producto.nombreProducto || producto.nombre || 'Sin nombre',
            subtotalAnterior: producto.subtotal || 0,
            subtotalNuevo: subtotalProducto,
            area,
            precioUnitario: precio,
            cantidad,
            unidadMedida
          });
          
          subtotalCorregido += subtotalProducto;
          return { ...producto, subtotal: subtotalProducto }; 
        });
      }
      
      // Calcular totales corregidos
      let descuentoPorcentajeMonto = 0;
      if (cotizacion.descuento?.porcentaje) {
        // Aplicar el porcentaje de descuento al subtotal corregido
        descuentoPorcentajeMonto = subtotalCorregido * (cotizacion.descuento.porcentaje / 100);
      }
      const descuentoMontoTotal = (cotizacion.descuento?.monto || 0) + descuentoPorcentajeMonto;
      
      const subtotalConDescuento = subtotalCorregido - descuentoMontoTotal;
      const subtotalConInstalacion = subtotalConDescuento + (cotizacion.costoInstalacion || 0);
      
      const incluirIVA = cotizacion.incluirIVA !== false; // Por defecto a true si no está definido
      const iva = incluirIVA ? subtotalConInstalacion * 0.16 : 0;
      const totalCorregido = subtotalConInstalacion + iva;
      
      logger.info('Totales recalculados para cotización', {
        script: 'fixCotizaciones',
        cotizacionId: cotizacion._id,
        numeroCotizacion: cotizacion.numero,
        subtotalAnterior: rawCotizacion.subtotal || 0,
        subtotalCorregido,
        ivaCalculado: iva,
        ivaIncluido: incluirIVA,
        totalAnterior: rawCotizacion.total || 0,
        totalCorregido,
        descuentoAplicado: descuentoMontoTotal,
        costoInstalacion: cotizacion.costoInstalacion || 0
      });
      
      // Recalcular anticipo y saldo
      let formaPagoUpdate = {};
      if (cotizacion.formaPago?.anticipo?.porcentaje) {
        formaPagoUpdate['formaPago.anticipo.monto'] = totalCorregido * (cotizacion.formaPago.anticipo.porcentaje / 100);
      }
      if (cotizacion.formaPago?.saldo?.porcentaje) {
        formaPagoUpdate['formaPago.saldo.monto'] = totalCorregido * (cotizacion.formaPago.saldo.porcentaje / 100);
      }
      
      // Guardar sin ejecutar middlewares (para evitar recálculos)
      await Cotizacion.updateOne(
        { _id: cotizacion._id },
        {
          $set: {
            productos: cotizacion.productos, 
            subtotal: subtotalCorregido,
            iva: iva,
            total: totalCorregido,
            incluirIVA: incluirIVA,
            ...formaPagoUpdate 
          }
        }
      );
      
      logger.info('Cotización actualizada tras correcciones', {
        script: 'fixCotizaciones',
        cotizacionId: cotizacion._id,
        numeroCotizacion: cotizacion.numero,
        subtotalCorregido,
        totalCorregido
      });
    }

    logger.info('Corrección de cotizaciones finalizada', {
      script: 'fixCotizaciones',
      cotizacionesProcesadas: cotizaciones.length
    });

  } catch (error) {
    logger.error('Error corrigiendo cotizaciones', {
      script: 'fixCotizaciones',
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

module.exports = fixCotizaciones;
