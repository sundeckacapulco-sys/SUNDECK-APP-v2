const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/Cotizacion');
const mongoose = require('mongoose');

class MetricasComercialesService {
  
  // Obtener métricas del dashboard principal
  async obtenerMetricasDashboard(fechaInicio = null, fechaFin = null) {
    try {
      const hoy = new Date();
      const inicioMes = fechaInicio || new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = fechaFin || new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      
      // Mes anterior para comparación
      const inicioMesAnterior = new Date(inicioMes.getFullYear(), inicioMes.getMonth() - 1, 1);
      const finMesAnterior = new Date(inicioMes.getFullYear(), inicioMes.getMonth(), 0);

      console.log('📊 Calculando métricas comerciales', {
        periodo: `${inicioMes.toISOString().split('T')[0]} - ${finMes.toISOString().split('T')[0]}`
      });

      // Ejecutar todas las consultas en paralelo
      const [
        ventasActuales,
        ventasAnteriores,
        pedidosActuales,
        pedidosAnteriores,
        metricasTiempo,
        metricasConversion,
        metricasCobranza,
        pedidosRecientes
      ] = await Promise.all([
        this.calcularVentas(inicioMes, finMes),
        this.calcularVentas(inicioMesAnterior, finMesAnterior),
        this.calcularPedidos(inicioMes, finMes),
        this.calcularPedidos(inicioMesAnterior, finMesAnterior),
        this.calcularTiemposPromedio(inicioMes, finMes),
        this.calcularTasasConversion(inicioMes, finMes),
        this.calcularMetricasCobranza(),
        this.obtenerPedidosRecientes(5)
      ]);

      return {
        ventas: {
          actual: ventasActuales.total,
          anterior: ventasAnteriores.total,
          crecimiento: this.calcularCrecimiento(ventasActuales.total, ventasAnteriores.total),
          meta: 140000, // TODO: Obtener de configuración
          progreso: (ventasActuales.total / 140000) * 100
        },
        pedidos: {
          total: pedidosActuales.total,
          nuevos: pedidosActuales.nuevos,
          enProceso: pedidosActuales.enProceso,
          completados: pedidosActuales.completados,
          crecimiento: this.calcularCrecimiento(pedidosActuales.total, pedidosAnteriores.total)
        },
        tiempos: metricasTiempo,
        conversion: metricasConversion,
        cobranza: metricasCobranza,
        pedidosRecientes: pedidosRecientes,
        fechaActualizacion: new Date()
      };

    } catch (error) {
      console.error('❌ Error calculando métricas comerciales:', error);
      throw new Error('Error al obtener métricas del dashboard');
    }
  }

  // Calcular ventas del período
  async calcularVentas(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
          estado: { $ne: 'cancelado' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$montoTotal' },
          cantidad: { $sum: 1 },
          promedio: { $avg: '$montoTotal' }
        }
      }
    ];

    const resultado = await Pedido.aggregate(pipeline);
    return resultado[0] || { total: 0, cantidad: 0, promedio: 0 };
  }

  // Calcular estadísticas de pedidos
  async calcularPedidos(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaPedido: { $gte: fechaInicio, $lte: fechaFin }
        }
      },
      {
        $group: {
          _id: '$estado',
          cantidad: { $sum: 1 }
        }
      }
    ];

    const resultados = await Pedido.aggregate(pipeline);
    
    const estadisticas = {
      total: 0,
      nuevos: 0,
      enProceso: 0,
      completados: 0,
      cancelados: 0
    };

    resultados.forEach(item => {
      estadisticas.total += item.cantidad;
      
      switch(item._id) {
        case 'confirmado':
        case 'pendiente_anticipo':
          estadisticas.nuevos += item.cantidad;
          break;
        case 'en_fabricacion':
        case 'fabricado':
        case 'en_instalacion':
          estadisticas.enProceso += item.cantidad;
          break;
        case 'entregado':
        case 'completado':
          estadisticas.completados += item.cantidad;
          break;
        case 'cancelado':
          estadisticas.cancelados += item.cantidad;
          break;
      }
    });

    return estadisticas;
  }

  // Calcular tiempos promedio
  async calcularTiemposPromedio(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
          estado: { $in: ['entregado', 'completado'] }
        }
      },
      {
        $lookup: {
          from: 'cotizacions',
          localField: 'cotizacion',
          foreignField: '_id',
          as: 'cotizacionData'
        }
      },
      {
        $unwind: '$cotizacionData'
      },
      {
        $project: {
          diasCotizacionAPedido: {
            $divide: [
              { $subtract: ['$fechaPedido', '$cotizacionData.createdAt'] },
              1000 * 60 * 60 * 24
            ]
          },
          diasPedidoAEntrega: {
            $divide: [
              { $subtract: ['$fechaEntrega', '$fechaPedido'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          promedioCotizacionAPedido: { $avg: '$diasCotizacionAPedido' },
          promedioPedidoAEntrega: { $avg: '$diasPedidoAEntrega' },
          promedioCicloCompleto: { 
            $avg: { 
              $add: ['$diasCotizacionAPedido', '$diasPedidoAEntrega'] 
            }
          }
        }
      }
    ];

    const resultado = await Pedido.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      cotizacionAPedido: Math.round((datos.promedioCotizacionAPedido || 0) * 10) / 10,
      pedidoAEntrega: Math.round((datos.promedioPedidoAEntrega || 0) * 10) / 10,
      cicloCompleto: Math.round((datos.promedioCicloCompleto || 0) * 10) / 10
    };
  }

  // Calcular tasas de conversión
  async calcularTasasConversion(fechaInicio, fechaFin) {
    const [cotizaciones, pedidos] = await Promise.all([
      Cotizacion.countDocuments({
        createdAt: { $gte: fechaInicio, $lte: fechaFin }
      }),
      Pedido.countDocuments({
        fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
        estado: { $ne: 'cancelado' }
      })
    ]);

    const pedidosCompletados = await Pedido.countDocuments({
      fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
      estado: { $in: ['entregado', 'completado'] }
    });

    return {
      cotizacionAPedido: cotizaciones > 0 ? Math.round((pedidos / cotizaciones) * 100 * 10) / 10 : 0,
      pedidoAVenta: pedidos > 0 ? Math.round((pedidosCompletados / pedidos) * 100 * 10) / 10 : 0
    };
  }

  // Calcular métricas de cobranza
  async calcularMetricasCobranza() {
    const pipeline = [
      {
        $match: {
          estado: { $ne: 'cancelado' }
        }
      },
      {
        $group: {
          _id: null,
          anticiposPendientes: {
            $sum: {
              $cond: [
                { $eq: ['$anticipo.pagado', false] },
                '$anticipo.monto',
                0
              ]
            }
          },
          saldosPendientes: {
            $sum: {
              $cond: [
                { $eq: ['$saldo.pagado', false] },
                '$saldo.monto',
                0
              ]
            }
          },
          totalPedidos: { $sum: 1 },
          pedidosPagados: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$anticipo.pagado', true] },
                    { $eq: ['$saldo.pagado', true] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const resultado = await Pedido.aggregate(pipeline);
    const datos = resultado[0] || {};

    return {
      anticiposPendientes: datos.anticiposPendientes || 0,
      saldosPendientes: datos.saldosPendientes || 0,
      pagosPuntuales: datos.totalPedidos > 0 ? 
        Math.round((datos.pedidosPagados / datos.totalPedidos) * 100 * 10) / 10 : 0
    };
  }

  // Obtener pedidos recientes
  async obtenerPedidosRecientes(limite = 5) {
    return await Pedido.find({})
      .populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido')
      .sort({ createdAt: -1 })
      .limit(limite)
      .select('numero montoTotal estado fechaPedido prospecto vendedor');
  }

  // Obtener métricas por vendedor
  async obtenerMetricasPorVendedor(fechaInicio, fechaFin) {
    const pipeline = [
      {
        $match: {
          fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
          estado: { $ne: 'cancelado' },
          vendedor: { $exists: true }
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'vendedor',
          foreignField: '_id',
          as: 'vendedorData'
        }
      },
      {
        $unwind: '$vendedorData'
      },
      {
        $group: {
          _id: '$vendedor',
          nombre: { $first: '$vendedorData.nombre' },
          apellido: { $first: '$vendedorData.apellido' },
          ventasMes: { $sum: '$montoTotal' },
          pedidos: { $sum: 1 },
          promedioVenta: { $avg: '$montoTotal' }
        }
      },
      {
        $sort: { ventasMes: -1 }
      }
    ];

    const resultados = await Pedido.aggregate(pipeline);
    
    // Agregar metas y comisiones (TODO: obtener de configuración)
    return resultados.map(vendedor => ({
      ...vendedor,
      meta: 50000, // TODO: obtener meta real del vendedor
      progreso: (vendedor.ventasMes / 50000) * 100,
      comisiones: vendedor.ventasMes * 0.05 // 5% de comisión
    }));
  }

  // Calcular crecimiento porcentual
  calcularCrecimiento(actual, anterior) {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100 * 10) / 10;
  }

  // Obtener datos para gráfico de ventas mensuales
  async obtenerDatosGraficoVentas(meses = 6) {
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    const pipeline = [
      {
        $match: {
          fechaPedido: { $gte: fechaInicio, $lte: fechaFin },
          estado: { $ne: 'cancelado' }
        }
      },
      {
        $group: {
          _id: {
            año: { $year: '$fechaPedido' },
            mes: { $month: '$fechaPedido' }
          },
          ventas: { $sum: '$montoTotal' },
          pedidos: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.año': 1, '_id.mes': 1 }
      }
    ];

    const resultados = await Pedido.aggregate(pipeline);
    
    return resultados.map(item => ({
      mes: `${item._id.año}-${String(item._id.mes).padStart(2, '0')}`,
      ventas: item.ventas,
      pedidos: item.pedidos
    }));
  }
}

module.exports = new MetricasComercialesService();
