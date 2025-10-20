const Pedido = require('../models/Pedido');
const mongoose = require('mongoose');

class NotificacionesComercialesService {
  
  constructor() {
    this.tiposNotificacion = {
      PAGO_VENCIDO: {
        prioridad: 'critica',
        icono: '🔴',
        color: '#EF4444',
        template: 'Pago vencido hace {dias} días - Pedido {numero}'
      },
      ANTICIPO_PENDIENTE: {
        prioridad: 'importante',
        icono: '🟡',
        color: '#F59E0B',
        template: 'Anticipo pendiente - Pedido {numero} - Cliente: {cliente}'
      },
      ENTREGA_ATRASADA: {
        prioridad: 'critica',
        icono: '🔴',
        color: '#EF4444',
        template: 'Entrega atrasada {dias} días - Pedido {numero}'
      },
      LISTO_FABRICACION: {
        prioridad: 'importante',
        icono: '🟢',
        color: '#10B981',
        template: 'Pedido {numero} listo para enviar a fabricación'
      },
      SEGUIMIENTO_COMERCIAL: {
        prioridad: 'normal',
        icono: '🔵',
        color: '#3B82F6',
        template: 'Seguimiento comercial pendiente - Cliente: {cliente}'
      },
      INSTALACION_PROGRAMADA: {
        prioridad: 'normal',
        icono: '🏠',
        color: '#8B5CF6',
        template: 'Instalación programada para {fecha} - Pedido {numero}'
      },
      PEDIDO_COMPLETADO: {
        prioridad: 'informativa',
        icono: '🎉',
        color: '#059669',
        template: 'Pedido {numero} completado exitosamente'
      }
    };
  }

  // Obtener todas las notificaciones activas
  async obtenerNotificacionesActivas(usuarioId = null, limite = 20) {
    try {
      console.log('🔔 Obteniendo notificaciones comerciales activas');

      const notificaciones = await Promise.all([
        this.verificarPagosVencidos(),
        this.verificarAnticiposPendientes(),
        this.verificarEntregasAtrasadas(),
        this.verificarPedidosListosFabricacion(),
        this.verificarSeguimientosComerciales(),
        this.verificarInstalacionesProgramadas()
      ]);

      // Aplanar y ordenar por prioridad
      const todasNotificaciones = notificaciones
        .flat()
        .sort((a, b) => this.compararPrioridad(a.prioridad, b.prioridad))
        .slice(0, limite);

      console.log(`✅ ${todasNotificaciones.length} notificaciones activas encontradas`);

      return {
        notificaciones: todasNotificaciones,
        resumen: this.generarResumenNotificaciones(todasNotificaciones),
        fechaActualizacion: new Date()
      };

    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error);
      throw new Error('Error al obtener notificaciones comerciales');
    }
  }

  // Verificar pagos vencidos
  async verificarPagosVencidos() {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7); // 7 días de gracia

    const pedidos = await Pedido.find({
      $or: [
        {
          'anticipo.pagado': false,
          'anticipo.fechaPago': { $lt: fechaLimite }
        },
        {
          'saldo.pagado': false,
          'saldo.fechaVencimiento': { $lt: new Date() }
        }
      ],
      estado: { $ne: 'cancelado' }
    }).populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido');

    return pedidos.map(pedido => {
      const diasVencido = this.calcularDiasVencido(pedido);
      const tipoPago = !pedido.anticipo.pagado ? 'anticipo' : 'saldo';
      
      return {
        id: `pago_vencido_${pedido._id}`,
        tipo: 'PAGO_VENCIDO',
        prioridad: 'critica',
        titulo: `Pago ${tipoPago} vencido`,
        mensaje: this.formatearMensaje('PAGO_VENCIDO', {
          dias: diasVencido,
          numero: pedido.numero
        }),
        pedidoId: pedido._id,
        pedidoNumero: pedido.numero,
        cliente: pedido.prospecto?.nombre || 'Cliente',
        vendedor: pedido.vendedor,
        fechaCreacion: new Date(),
        datos: {
          diasVencido,
          tipoPago,
          monto: tipoPago === 'anticipo' ? pedido.anticipo.monto : pedido.saldo.monto
        },
        acciones: [
          { tipo: 'contactar_cliente', label: 'Contactar Cliente' },
          { tipo: 'ver_pedido', label: 'Ver Pedido' },
          { tipo: 'registrar_pago', label: 'Registrar Pago' }
        ]
      };
    });
  }

  // Verificar anticipos pendientes
  async verificarAnticiposPendientes() {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 3); // 3 días desde creación

    const pedidos = await Pedido.find({
      'anticipo.pagado': false,
      fechaPedido: { $lt: fechaLimite },
      estado: { $in: ['confirmado', 'pendiente_anticipo'] }
    }).populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido');

    return pedidos.map(pedido => ({
      id: `anticipo_pendiente_${pedido._id}`,
      tipo: 'ANTICIPO_PENDIENTE',
      prioridad: 'importante',
      titulo: 'Anticipo pendiente',
      mensaje: this.formatearMensaje('ANTICIPO_PENDIENTE', {
        numero: pedido.numero,
        cliente: pedido.prospecto?.nombre || 'Cliente'
      }),
      pedidoId: pedido._id,
      pedidoNumero: pedido.numero,
      cliente: pedido.prospecto?.nombre || 'Cliente',
      vendedor: pedido.vendedor,
      fechaCreacion: new Date(),
      datos: {
        diasPendiente: this.calcularDiasPendiente(pedido.fechaPedido),
        montoAnticipo: pedido.anticipo.monto
      },
      acciones: [
        { tipo: 'contactar_cliente', label: 'Contactar Cliente' },
        { tipo: 'enviar_recordatorio', label: 'Enviar Recordatorio' },
        { tipo: 'ver_pedido', label: 'Ver Pedido' }
      ]
    }));
  }

  // Verificar entregas atrasadas
  async verificarEntregasAtrasadas() {
    const hoy = new Date();

    const pedidos = await Pedido.find({
      fechaEntrega: { $lt: hoy },
      estado: { $in: ['fabricado', 'en_instalacion'] }
    }).populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido');

    return pedidos.map(pedido => {
      const diasAtraso = this.calcularDiasAtraso(pedido.fechaEntrega);
      
      return {
        id: `entrega_atrasada_${pedido._id}`,
        tipo: 'ENTREGA_ATRASADA',
        prioridad: 'critica',
        titulo: 'Entrega atrasada',
        mensaje: this.formatearMensaje('ENTREGA_ATRASADA', {
          dias: diasAtraso,
          numero: pedido.numero
        }),
        pedidoId: pedido._id,
        pedidoNumero: pedido.numero,
        cliente: pedido.prospecto?.nombre || 'Cliente',
        vendedor: pedido.vendedor,
        fechaCreacion: new Date(),
        datos: {
          diasAtraso,
          fechaEntregaOriginal: pedido.fechaEntrega
        },
        acciones: [
          { tipo: 'reprogramar_entrega', label: 'Reprogramar Entrega' },
          { tipo: 'contactar_cliente', label: 'Contactar Cliente' },
          { tipo: 'ver_pedido', label: 'Ver Pedido' }
        ]
      };
    });
  }

  // Verificar pedidos listos para fabricación
  async verificarPedidosListosFabricacion() {
    const pedidos = await Pedido.find({
      estado: 'confirmado',
      'anticipo.pagado': true
    }).populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido');

    return pedidos.map(pedido => ({
      id: `listo_fabricacion_${pedido._id}`,
      tipo: 'LISTO_FABRICACION',
      prioridad: 'importante',
      titulo: 'Listo para fabricación',
      mensaje: this.formatearMensaje('LISTO_FABRICACION', {
        numero: pedido.numero
      }),
      pedidoId: pedido._id,
      pedidoNumero: pedido.numero,
      cliente: pedido.prospecto?.nombre || 'Cliente',
      vendedor: pedido.vendedor,
      fechaCreacion: new Date(),
      datos: {
        diasDesdeConfirmacion: this.calcularDiasPendiente(pedido.fechaPedido)
      },
      acciones: [
        { tipo: 'enviar_fabricacion', label: 'Enviar a Fabricación' },
        { tipo: 'ver_pedido', label: 'Ver Pedido' }
      ]
    }));
  }

  // Verificar seguimientos comerciales pendientes
  async verificarSeguimientosComerciales() {
    // TODO: Implementar cuando tengamos sistema de seguimientos
    return [];
  }

  // Verificar instalaciones programadas para hoy/mañana
  async verificarInstalacionesProgramadas() {
    const hoy = new Date();
    const mañana = new Date();
    mañana.setDate(mañana.getDate() + 1);

    const pedidos = await Pedido.find({
      fechaInstalacion: { 
        $gte: hoy, 
        $lte: mañana 
      },
      estado: { $in: ['fabricado', 'en_instalacion'] }
    }).populate('prospecto', 'nombre telefono')
      .populate('vendedor', 'nombre apellido')
      .populate('instalador', 'nombre apellido');

    return pedidos.map(pedido => ({
      id: `instalacion_programada_${pedido._id}`,
      tipo: 'INSTALACION_PROGRAMADA',
      prioridad: 'normal',
      titulo: 'Instalación programada',
      mensaje: this.formatearMensaje('INSTALACION_PROGRAMADA', {
        fecha: pedido.fechaInstalacion.toLocaleDateString('es-MX'),
        numero: pedido.numero
      }),
      pedidoId: pedido._id,
      pedidoNumero: pedido.numero,
      cliente: pedido.prospecto?.nombre || 'Cliente',
      vendedor: pedido.vendedor,
      instalador: pedido.instalador,
      fechaCreacion: new Date(),
      datos: {
        fechaInstalacion: pedido.fechaInstalacion,
        esHoy: pedido.fechaInstalacion.toDateString() === hoy.toDateString()
      },
      acciones: [
        { tipo: 'confirmar_instalacion', label: 'Confirmar Instalación' },
        { tipo: 'contactar_cliente', label: 'Contactar Cliente' },
        { tipo: 'ver_pedido', label: 'Ver Pedido' }
      ]
    }));
  }

  // Formatear mensaje usando template
  formatearMensaje(tipo, datos) {
    const config = this.tiposNotificacion[tipo];
    if (!config) return 'Notificación';

    let mensaje = config.template;
    Object.keys(datos).forEach(key => {
      mensaje = mensaje.replace(`{${key}}`, datos[key]);
    });

    return mensaje;
  }

  // Calcular días vencido
  calcularDiasVencido(pedido) {
    const hoy = new Date();
    let fechaVencimiento;

    if (!pedido.anticipo.pagado && pedido.anticipo.fechaPago) {
      fechaVencimiento = pedido.anticipo.fechaPago;
    } else if (!pedido.saldo.pagado && pedido.saldo.fechaVencimiento) {
      fechaVencimiento = pedido.saldo.fechaVencimiento;
    } else {
      return 0;
    }

    const diferencia = hoy - fechaVencimiento;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Calcular días pendiente
  calcularDiasPendiente(fecha) {
    const hoy = new Date();
    const diferencia = hoy - fecha;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Calcular días de atraso
  calcularDiasAtraso(fechaEntrega) {
    const hoy = new Date();
    const diferencia = hoy - fechaEntrega;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  // Comparar prioridad para ordenamiento
  compararPrioridad(a, b) {
    const orden = { 'critica': 0, 'importante': 1, 'normal': 2, 'informativa': 3 };
    return orden[a] - orden[b];
  }

  // Generar resumen de notificaciones
  generarResumenNotificaciones(notificaciones) {
    const resumen = {
      total: notificaciones.length,
      criticas: 0,
      importantes: 0,
      normales: 0,
      informativas: 0,
      porTipo: {}
    };

    notificaciones.forEach(notif => {
      // Contar por prioridad
      switch(notif.prioridad) {
        case 'critica': resumen.criticas++; break;
        case 'importante': resumen.importantes++; break;
        case 'normal': resumen.normales++; break;
        case 'informativa': resumen.informativas++; break;
      }

      // Contar por tipo
      resumen.porTipo[notif.tipo] = (resumen.porTipo[notif.tipo] || 0) + 1;
    });

    return resumen;
  }

  // Marcar notificación como leída
  async marcarComoLeida(notificacionId, usuarioId) {
    // TODO: Implementar sistema de notificaciones leídas en BD
    console.log(`📖 Notificación ${notificacionId} marcada como leída por usuario ${usuarioId}`);
    return true;
  }

  // Obtener configuración de notificaciones del usuario
  async obtenerConfiguracion(usuarioId) {
    // TODO: Implementar configuración personalizada
    return {
      email: true,
      push: true,
      frecuencia: 'tiempo_real',
      tipos: Object.keys(this.tiposNotificacion)
    };
  }
}

module.exports = new NotificacionesComercialesService();
