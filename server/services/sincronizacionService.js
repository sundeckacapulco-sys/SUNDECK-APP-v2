const Proyecto = require('../models/Proyecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const Instalacion = require('../models/Instalacion');
const mongoose = require('mongoose');

class SincronizacionService {
  
  /**
   * Ejecuta triggers automáticos cuando cambia el estado de un proyecto
   */
  async ejecutarTriggersEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId) {
    try {
      console.log(`🔄 Ejecutando triggers: ${estadoAnterior} → ${nuevoEstado} para proyecto ${proyecto._id}`);

      // Trigger: levantamiento → cotizacion
      if (estadoAnterior === 'levantamiento' && nuevoEstado === 'cotizacion') {
        await this.triggerCrearCotizacion(proyecto, usuarioId);
      }

      // Trigger: cotizacion → aprobado
      if (estadoAnterior === 'cotizacion' && nuevoEstado === 'aprobado') {
        await this.triggerAprobarCotizacion(proyecto, usuarioId);
      }

      // Trigger: aprobado → fabricacion
      if (estadoAnterior === 'aprobado' && nuevoEstado === 'fabricacion') {
        await this.triggerCrearOrdenFabricacion(proyecto, usuarioId);
      }

      // Trigger: fabricacion → instalacion
      if (estadoAnterior === 'fabricacion' && nuevoEstado === 'instalacion') {
        await this.triggerProgramarInstalacion(proyecto, usuarioId);
      }

      // Trigger: instalacion → completado
      if (estadoAnterior === 'instalacion' && nuevoEstado === 'completado') {
        await this.triggerCompletarProyecto(proyecto, usuarioId);
      }

      // Crear notificaciones automáticas
      const notificacionesService = require('./notificacionesService');
      await notificacionesService.crearNotificacionesEstado(proyecto, estadoAnterior, nuevoEstado, usuarioId);

      console.log(`✅ Triggers ejecutados exitosamente para proyecto ${proyecto._id}`);

    } catch (error) {
      console.error('❌ Error ejecutando triggers:', error);
      throw error;
    }
  }

  /**
   * Trigger: Crear cotización automáticamente
   */
  async triggerCrearCotizacion(proyecto, usuarioId) {
    try {
      console.log(`📋 Creando cotización automática para proyecto ${proyecto._id}`);

      // Verificar si ya existe una cotización para este proyecto
      const cotizacionExistente = await Cotizacion.findOne({ 
        proyectoId: proyecto._id 
      });

      if (cotizacionExistente) {
        console.log(`⚠️ Ya existe cotización ${cotizacionExistente.numero} para proyecto ${proyecto._id}`);
        return cotizacionExistente;
      }

      // Generar número de cotización
      const ultimaCotizacion = await Cotizacion.findOne()
        .sort({ numero: -1 })
        .select('numero');
      
      const siguienteNumero = ultimaCotizacion ? 
        parseInt(ultimaCotizacion.numero.split('-')[2]) + 1 : 1;
      
      const numero = `COT-${new Date().getFullYear()}-${siguienteNumero.toString().padStart(4, '0')}`;

      // Crear productos desde las medidas del proyecto
      const productos = this.convertirMedidasAProductos(proyecto.medidas);

      // Crear la cotización
      const nuevaCotizacion = new Cotizacion({
        numero,
        proyectoId: proyecto._id,
        cliente: {
          nombre: proyecto.cliente.nombre,
          telefono: proyecto.cliente.telefono,
          email: proyecto.cliente.correo,
          direccion: proyecto.cliente.direccion
        },
        productos,
        subtotal: proyecto.subtotal || 0,
        iva: proyecto.iva || 0,
        total: proyecto.total || 0,
        estado: 'borrador',
        validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        creadoPor: usuarioId,
        observaciones: `Cotización generada automáticamente desde proyecto ${proyecto._id}`
      });

      await nuevaCotizacion.save();

      // Actualizar proyecto con referencia a la cotización
      await Proyecto.findByIdAndUpdate(proyecto._id, {
        $push: { cotizaciones: nuevaCotizacion._id }
      });

      console.log(`✅ Cotización ${numero} creada automáticamente`);
      return nuevaCotizacion;

    } catch (error) {
      console.error('❌ Error creando cotización automática:', error);
      throw error;
    }
  }

  /**
   * Trigger: Aprobar cotización y crear pedido
   */
  async triggerAprobarCotizacion(proyecto, usuarioId) {
    try {
      console.log(`✅ Aprobando cotización para proyecto ${proyecto._id}`);

      // Buscar la cotización del proyecto
      const cotizacion = await Cotizacion.findOne({ 
        proyectoId: proyecto._id 
      });

      if (cotizacion) {
        // Actualizar estado de la cotización
        cotizacion.estado = 'aprobada';
        cotizacion.fechaAprobacion = new Date();
        await cotizacion.save();

        // Crear pedido automáticamente
        await this.crearPedidoAutomatico(proyecto, cotizacion, usuarioId);
      }

    } catch (error) {
      console.error('❌ Error aprobando cotización:', error);
      throw error;
    }
  }

  /**
   * Trigger: Crear orden de fabricación
   */
  async triggerCrearOrdenFabricacion(proyecto, usuarioId) {
    try {
      console.log(`🏭 Creando orden de fabricación para proyecto ${proyecto._id}`);

      // Verificar si ya existe una orden
      const ordenExistente = await OrdenFabricacion.findOne({ 
        proyectoId: proyecto._id 
      });

      if (ordenExistente) {
        console.log(`⚠️ Ya existe orden ${ordenExistente.numero} para proyecto ${proyecto._id}`);
        return ordenExistente;
      }

      // Generar número de orden
      const ultimaOrden = await OrdenFabricacion.findOne()
        .sort({ numero: -1 })
        .select('numero');
      
      const siguienteNumero = ultimaOrden ? 
        parseInt(ultimaOrden.numero.split('-')[2]) + 1 : 1;
      
      const numero = `OF-${new Date().getFullYear()}-${siguienteNumero.toString().padStart(4, '0')}`;

      // Crear la orden de fabricación
      const nuevaOrden = new OrdenFabricacion({
        numero,
        proyectoId: proyecto._id,
        cliente: proyecto.cliente.nombre,
        productos: this.convertirMedidasAProductosFabricacion(proyecto.medidas),
        estado: 'pendiente',
        fechaCreacion: new Date(),
        fechaRequerida: this.calcularFechaRequerida(proyecto),
        observaciones: `Orden generada automáticamente desde proyecto ${proyecto._id}`,
        creadoPor: usuarioId
      });

      await nuevaOrden.save();

      // Actualizar proyecto con referencia a la orden
      await Proyecto.findByIdAndUpdate(proyecto._id, {
        $push: { ordenes_fabricacion: nuevaOrden._id }
      });

      console.log(`✅ Orden de fabricación ${numero} creada automáticamente`);
      return nuevaOrden;

    } catch (error) {
      console.error('❌ Error creando orden de fabricación:', error);
      throw error;
    }
  }

  /**
   * Trigger: Programar instalación
   */
  async triggerProgramarInstalacion(proyecto, usuarioId) {
    try {
      console.log(`🔧 Programando instalación para proyecto ${proyecto._id}`);

      // Verificar si ya existe una instalación
      const instalacionExistente = await Instalacion.findOne({ 
        proyectoId: proyecto._id 
      });

      if (instalacionExistente) {
        console.log(`⚠️ Ya existe instalación para proyecto ${proyecto._id}`);
        return instalacionExistente;
      }

      // Generar número de instalación
      const ultimaInstalacion = await Instalacion.findOne()
        .sort({ numero: -1 })
        .select('numero');
      
      const siguienteNumero = ultimaInstalacion ? 
        parseInt(ultimaInstalacion.numero.split('-')[2]) + 1 : 1;
      
      const numero = `INS-${new Date().getFullYear()}-${siguienteNumero.toString().padStart(4, '0')}`;

      // Calcular fecha de instalación (7 días después de fabricación)
      const fechaProgramada = new Date();
      fechaProgramada.setDate(fechaProgramada.getDate() + 7);

      // Crear la instalación
      const nuevaInstalacion = new Instalacion({
        numero,
        proyectoId: proyecto._id,
        cliente: {
          nombre: proyecto.cliente.nombre,
          telefono: proyecto.cliente.telefono,
          direccion: proyecto.cliente.direccion
        },
        fechaProgramada,
        estado: 'programada',
        observaciones: `Instalación programada automáticamente desde proyecto ${proyecto._id}`,
        creadoPor: usuarioId
      });

      await nuevaInstalacion.save();

      // Actualizar proyecto con referencia a la instalación
      await Proyecto.findByIdAndUpdate(proyecto._id, {
        $push: { instalaciones: nuevaInstalacion._id }
      });

      console.log(`✅ Instalación ${numero} programada automáticamente`);
      return nuevaInstalacion;

    } catch (error) {
      console.error('❌ Error programando instalación:', error);
      throw error;
    }
  }

  /**
   * Trigger: Completar proyecto
   */
  async triggerCompletarProyecto(proyecto, usuarioId) {
    try {
      console.log(`🎉 Completando proyecto ${proyecto._id}`);

      // Actualizar fechas de finalización
      await Proyecto.findByIdAndUpdate(proyecto._id, {
        fecha_completado: new Date(),
        actualizado_por: usuarioId
      });

      // Aquí se pueden agregar más acciones:
      // - Enviar encuesta de satisfacción
      // - Crear recordatorio de postventa
      // - Generar reporte de proyecto completado
      // - Notificar al equipo comercial

      console.log(`✅ Proyecto ${proyecto._id} completado exitosamente`);

    } catch (error) {
      console.error('❌ Error completando proyecto:', error);
      throw error;
    }
  }

  /**
   * Crear pedido automático desde cotización aprobada
   */
  async crearPedidoAutomatico(proyecto, cotizacion, usuarioId) {
    try {
      // Verificar si ya existe un pedido
      const pedidoExistente = await Pedido.findOne({ 
        proyectoId: proyecto._id 
      });

      if (pedidoExistente) {
        console.log(`⚠️ Ya existe pedido para proyecto ${proyecto._id}`);
        return pedidoExistente;
      }

      // Generar número de pedido
      const ultimoPedido = await Pedido.findOne()
        .sort({ numero: -1 })
        .select('numero');
      
      const siguienteNumero = ultimoPedido ? 
        parseInt(ultimoPedido.numero.split('-')[2]) + 1 : 1;
      
      const numero = `PED-${new Date().getFullYear()}-${siguienteNumero.toString().padStart(4, '0')}`;

      // Crear el pedido
      const nuevoPedido = new Pedido({
        numero,
        proyectoId: proyecto._id,
        cotizacionId: cotizacion._id,
        cliente: proyecto.cliente,
        productos: cotizacion.productos,
        subtotal: cotizacion.subtotal,
        iva: cotizacion.iva,
        total: cotizacion.total,
        anticipo: Math.round(cotizacion.total * 0.6 * 100) / 100,
        saldo: Math.round(cotizacion.total * 0.4 * 100) / 100,
        estado: 'confirmado',
        fechaCreacion: new Date(),
        creadoPor: usuarioId,
        observaciones: `Pedido generado automáticamente desde cotización ${cotizacion.numero}`
      });

      await nuevoPedido.save();

      // Actualizar proyecto con referencia al pedido
      await Proyecto.findByIdAndUpdate(proyecto._id, {
        $push: { pedidos: nuevoPedido._id }
      });

      console.log(`✅ Pedido ${numero} creado automáticamente`);
      return nuevoPedido;

    } catch (error) {
      console.error('❌ Error creando pedido automático:', error);
      throw error;
    }
  }

  // Funciones auxiliares

  convertirMedidasAProductos(medidas) {
    return medidas.map((medida, index) => ({
      nombre: medida.producto || 'Producto',
      descripcion: `${medida.ubicacion} - ${medida.ancho}x${medida.alto}m`,
      cantidad: medida.cantidad || 1,
      medidas: {
        ancho: medida.ancho,
        alto: medida.alto,
        area: (medida.ancho || 0) * (medida.alto || 0) * (medida.cantidad || 1)
      },
      precioUnitario: 0, // Se calculará después
      subtotal: 0
    }));
  }

  convertirMedidasAProductosFabricacion(medidas) {
    return medidas.map((medida, index) => ({
      item: index + 1,
      ubicacion: medida.ubicacion || '',
      producto: medida.producto || '',
      ancho: medida.ancho || 0,
      alto: medida.alto || 0,
      cantidad: medida.cantidad || 1,
      color: medida.color || '',
      observaciones: medida.observaciones || '',
      // Campos técnicos para fabricación
      tipoControl: medida.tipoControl || '',
      orientacion: medida.orientacion || '',
      tipoInstalacion: medida.tipoInstalacion || '',
      sistema: medida.sistema || '',
      telaMarca: medida.telaMarca || '',
      motorizado: medida.motorizado || false,
      esToldo: medida.esToldo || false
    }));
  }

  calcularFechaRequerida(proyecto) {
    const fechaBase = new Date();
    let diasFabricacion = 15; // Por defecto

    // Ajustar días según tipo de productos
    if (proyecto.medidas && proyecto.medidas.length > 0) {
      const tieneMotorizados = proyecto.medidas.some(m => m.motorizado);
      const tieneToldos = proyecto.medidas.some(m => m.esToldo);
      
      if (tieneMotorizados) diasFabricacion += 5;
      if (tieneToldos) diasFabricacion += 3;
      if (proyecto.medidas.length > 10) diasFabricacion += 5;
    }

    fechaBase.setDate(fechaBase.getDate() + diasFabricacion);
    return fechaBase;
  }

  /**
   * Sincronizar proyecto existente con sus referencias
   */
  async sincronizarProyecto(proyectoId) {
    try {
      const proyecto = await Proyecto.findById(proyectoId)
        .populate(['cotizaciones', 'pedidos', 'ordenes_fabricacion', 'instalaciones']);

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      // Sincronizar estados basado en las referencias existentes
      let nuevoEstado = proyecto.estado;

      if (proyecto.instalaciones && proyecto.instalaciones.length > 0) {
        const instalacionCompletada = proyecto.instalaciones.some(i => i.estado === 'completada');
        if (instalacionCompletada) nuevoEstado = 'completado';
        else nuevoEstado = 'instalacion';
      } else if (proyecto.ordenes_fabricacion && proyecto.ordenes_fabricacion.length > 0) {
        nuevoEstado = 'fabricacion';
      } else if (proyecto.pedidos && proyecto.pedidos.length > 0) {
        nuevoEstado = 'aprobado';
      } else if (proyecto.cotizaciones && proyecto.cotizaciones.length > 0) {
        nuevoEstado = 'cotizacion';
      }

      if (nuevoEstado !== proyecto.estado) {
        await Proyecto.findByIdAndUpdate(proyectoId, { estado: nuevoEstado });
        console.log(`🔄 Proyecto ${proyectoId} sincronizado: ${proyecto.estado} → ${nuevoEstado}`);
      }

      return nuevoEstado;

    } catch (error) {
      console.error('❌ Error sincronizando proyecto:', error);
      throw error;
    }
  }
}

module.exports = new SincronizacionService();
