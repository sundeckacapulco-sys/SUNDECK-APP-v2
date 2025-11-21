/**
 * Controlador de Pagos
 * Manejo de anticipos, saldos y comprobantes de pago
 */

const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { getUploadPath, getRelativePath, ensureUploadDirectory } = require('../utils/pathHelper');
const fs = require('fs').promises;

/**
 * Registrar pago de anticipo
 * POST /api/proyectos/:id/pagos/anticipo
 */
const registrarAnticipo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monto,
      porcentaje,
      fechaPago,
      metodoPago,
      referencia,
      comprobante // Base64 o URL
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Validar monto
    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del anticipo debe ser mayor a 0'
      });
    }

    // Inicializar estructura de pagos si no existe
    if (!proyecto.pagos) {
      proyecto.pagos = {};
    }
    if (!proyecto.pagos.anticipo) {
      proyecto.pagos.anticipo = {};
    }

    // Registrar anticipo
    proyecto.pagos.anticipo = {
      monto: parseFloat(monto),
      porcentaje: porcentaje || 60,
      fechaPago: fechaPago || new Date(),
      metodoPago: metodoPago || 'transferencia',
      referencia: referencia || '',
      comprobante: comprobante || '',
      pagado: true
    };

    // Actualizar saldo pendiente
    const totalProyecto = proyecto.pagos.montoTotal || 0;
    if (!proyecto.pagos.saldo) {
      proyecto.pagos.saldo = {};
    }
    proyecto.pagos.saldo.monto = totalProyecto - parseFloat(monto);

    // Actualizar información de facturación si se proporciona
    if (req.body.requiereFactura !== undefined) {
      proyecto.requiere_factura = req.body.requiereFactura;
    }
    if (req.body.correoCliente) {
      if (!proyecto.cliente) proyecto.cliente = {};
      proyecto.cliente.correo = req.body.correoCliente;
    }
    if (req.body.constanciaFiscal) {
      proyecto.constancia_fiscal = req.body.constanciaFiscal;
    }
    if (req.body.metodoPago) {
      proyecto.metodo_pago_anticipo = req.body.metodoPago;
    }

    // 📅 Calcular tiempo de entrega si no está definido
    if (!proyecto.tiempo_entrega || !proyecto.tiempo_entrega.dias_estimados) {
      // Determinar tipo de entrega (normal, exprés o personalizado)
      const tipoEntrega = req.body.tipoEntrega || proyecto.tiempo_entrega?.tipo || 'normal';
      
      // Días hábiles según tipo
      let diasHabiles;
      
      if (tipoEntrega === 'personalizado') {
        // Usar valores personalizados del frontend
        const cantidad = parseInt(req.body.tiempoEntregaCantidad) || 1;
        const unidad = req.body.tiempoEntregaUnidad || 'dias';
        
        // Convertir a días hábiles
        if (unidad === 'horas') {
          // Convertir horas a días (8 horas = 1 día hábil)
          diasHabiles = Math.ceil(cantidad / 8);
        } else {
          diasHabiles = cantidad;
        }
        
        logger.info('📅 Entrega personalizada configurada', {
          proyectoId: id,
          cantidad: cantidad,
          unidad: unidad,
          diasHabilesCalculados: diasHabiles
        });
      } else {
        // Usar valores predeterminados
        diasHabiles = tipoEntrega === 'expres' ? 7 : 15;
      }
      
      // Función para calcular fecha sumando solo días hábiles (L-V)
      function calcularFechaHabil(fechaInicio, diasHabiles) {
        const fecha = new Date(fechaInicio);
        let diasAgregados = 0;
        
        while (diasAgregados < diasHabiles) {
          fecha.setDate(fecha.getDate() + 1);
          const diaSemana = fecha.getDay();
          
          // Si no es sábado (6) ni domingo (0), contar como día hábil
          if (diaSemana !== 0 && diaSemana !== 6) {
            diasAgregados++;
          }
        }
        
        return fecha;
      }
      
      // Calcular fecha estimada (solo días hábiles)
      const fechaEstimada = calcularFechaHabil(new Date(), diasHabiles);
      
      // Actualizar en el proyecto
      if (!proyecto.tiempo_entrega) {
        proyecto.tiempo_entrega = {};
      }
      proyecto.tiempo_entrega.tipo = tipoEntrega;
      proyecto.tiempo_entrega.dias_estimados = diasHabiles;
      proyecto.tiempo_entrega.fecha_estimada = fechaEstimada;
      
      // Guardar información personalizada si aplica
      if (tipoEntrega === 'personalizado') {
        proyecto.tiempo_entrega.personalizado = {
          cantidad: parseInt(req.body.tiempoEntregaCantidad),
          unidad: req.body.tiempoEntregaUnidad
        };
      }
      
      logger.info('📅 Tiempo de entrega calculado automáticamente', {
        proyectoId: id,
        tipo: tipoEntrega,
        diasHabiles: diasHabiles,
        fechaEstimada: fechaEstimada.toISOString().split('T')[0],
        personalizado: tipoEntrega === 'personalizado' ? proyecto.tiempo_entrega.personalizado : null
      });
    }

    // Actualizar estado comercial: anticipo recibido = proyecto activo
    // Solo actualizar si está en estado de prospecto o cotizado
    const estadosProspecto = ['nuevo', 'contactado', 'en_seguimiento', 'en seguimiento', 'cita_agendada', 'cita agendada', 'sin_respuesta', 'sin respuesta', 'en_pausa', 'en pausa', 'cotizado'];
    
    if (estadosProspecto.includes(proyecto.estadoComercial)) {
      const estadoAnterior = proyecto.estadoComercial;
      proyecto.estadoComercial = 'activo'; // Anticipo pagado = proyecto activo
      
      logger.info('✅ Estado comercial actualizado: Anticipo recibido → Proyecto ACTIVO', {
        proyectoId: id,
        estadoAnterior: estadoAnterior,
        estadoNuevo: 'activo',
        flujo: 'Levantamiento → Cotización → ACTIVO → Fabricación → Instalación → Completado'
      });
    }

    // Guardar cambios
    await proyecto.save();

    logger.info('Anticipo registrado exitosamente', {
      proyectoId: id,
      monto: monto,
      metodoPago: metodoPago,
      usuario: req.usuario?.nombre
    });

    // 🚨 ALERTA: Anticipo recibido → Listo para fabricación
    try {
      const Notificacion = require('../models/Notificacion');
      
      // Crear notificación para el equipo de fabricación
      await Notificacion.create({
        tipo: 'anticipo_recibido',
        prioridad: 'alta',
        titulo: '💰 Anticipo Recibido - Listo para Fabricación',
        mensaje: `El proyecto ${proyecto.numero || proyecto._id} ha recibido el anticipo de ${formatearMoneda(monto)}. Revisar información y proceder a fabricación.`,
        destinatarios: ['fabricacion', 'admin'],
        proyecto: proyecto._id,
        datos: {
          proyectoId: proyecto._id,
          proyectoNumero: proyecto.numero,
          clienteNombre: proyecto.cliente?.nombre,
          montoAnticipo: monto,
          metodoPago: metodoPago,
          requiereFactura: proyecto.requiere_factura,
          fechaPago: fechaPago
        },
        leida: false,
        activa: true
      });

      logger.info('🔔 Alerta de fabricación creada', {
        proyectoId: id,
        tipo: 'anticipo_recibido'
      });

      // Cambiar estado del proyecto a "fabricacion" si está en "aprobado"
      if (proyecto.estado === 'aprobado') {
        proyecto.estado = 'fabricacion';
        proyecto.estadoComercial = 'en_fabricacion';
        await proyecto.save();
        
        logger.info('📊 Estado del proyecto actualizado a fabricación', {
          proyectoId: id,
          estadoAnterior: 'aprobado',
          estadoNuevo: 'fabricacion'
        });
      }
    } catch (notifError) {
      // No fallar el registro del pago si falla la notificación
      logger.error('Error creando notificación de fabricación', {
        proyectoId: id,
        error: notifError.message
      });
    }

    // Helper para formatear moneda
    function formatearMoneda(cantidad) {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(cantidad || 0);
    }

    res.json({
      success: true,
      message: 'Anticipo registrado exitosamente. Se ha notificado al equipo de fabricación.',
      data: {
        anticipo: proyecto.pagos.anticipo,
        saldo: proyecto.pagos.saldo,
        estadoProyecto: proyecto.estado,
        alertaCreada: true
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'registrarAnticipo',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al registrar anticipo',
      error: error.message
    });
  }
};

/**
 * Registrar pago de saldo
 * POST /api/proyectos/:id/pagos/saldo
 */
const registrarSaldo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      monto,
      fechaPago,
      metodoPago,
      referencia,
      comprobante
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Validar monto
    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del saldo debe ser mayor a 0'
      });
    }

    // Inicializar estructura de pagos si no existe
    if (!proyecto.pagos) {
      proyecto.pagos = {};
    }
    if (!proyecto.pagos.saldo) {
      proyecto.pagos.saldo = {};
    }

    // Registrar saldo
    proyecto.pagos.saldo = {
      ...proyecto.pagos.saldo,
      monto: parseFloat(monto),
      fechaPago: fechaPago || new Date(),
      metodoPago: metodoPago || 'transferencia',
      referencia: referencia || '',
      comprobante: comprobante || '',
      pagado: true
    };

    // Guardar cambios
    await proyecto.save();

    logger.info('Saldo registrado exitosamente', {
      proyectoId: id,
      monto: monto,
      metodoPago: metodoPago,
      usuario: req.usuario?.nombre
    });

    res.json({
      success: true,
      message: 'Saldo registrado exitosamente',
      data: {
        saldo: proyecto.pagos.saldo
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'registrarSaldo',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al registrar saldo',
      error: error.message
    });
  }
};

/**
 * Subir comprobante de pago
 * POST /api/proyectos/:id/pagos/comprobante
 */
const subirComprobante = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipoPago, archivo } = req.body; // tipoPago: 'anticipo' | 'saldo'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    if (!tipoPago || !['anticipo', 'saldo'].includes(tipoPago)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pago inválido. Debe ser "anticipo" o "saldo"'
      });
    }

    if (!archivo) {
      return res.status(400).json({
        success: false,
        message: 'Archivo de comprobante requerido'
      });
    }

    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Asegurar que el directorio existe
    await ensureUploadDirectory('comprobantes');

    // Generar nombre de archivo
    const timestamp = Date.now();
    const extension = archivo.includes('pdf') ? 'pdf' : 'jpg';
    const nombreArchivo = `comprobante-${proyecto.numero || id}-${tipoPago}-${timestamp}.${extension}`;

    // Guardar archivo (si es base64, convertir)
    let rutaComprobante;
    if (archivo.startsWith('data:')) {
      // Es base64
      const base64Data = archivo.replace(/^data:.*,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const rutaCompleta = getUploadPath('comprobantes', nombreArchivo);
      await fs.writeFile(rutaCompleta, buffer);
      
      rutaComprobante = getRelativePath('comprobantes', nombreArchivo);
    } else {
      // Es URL
      rutaComprobante = archivo;
    }

    // Actualizar proyecto
    if (!proyecto.pagos) {
      proyecto.pagos = {};
    }
    if (!proyecto.pagos[tipoPago]) {
      proyecto.pagos[tipoPago] = {};
    }

    proyecto.pagos[tipoPago].comprobante = rutaComprobante;
    await proyecto.save();

    logger.info('Comprobante de pago subido', {
      proyectoId: id,
      tipoPago: tipoPago,
      comprobante: rutaComprobante,
      usuario: req.usuario?.nombre
    });

    res.json({
      success: true,
      message: 'Comprobante subido exitosamente',
      data: {
        comprobante: rutaComprobante
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'subirComprobante',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al subir comprobante',
      error: error.message
    });
  }
};

/**
 * Obtener historial de pagos
 * GET /api/proyectos/:id/pagos
 */
const obtenerPagos = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de proyecto inválido'
      });
    }

    const proyecto = await Proyecto.findById(id).select('pagos numero cliente');
    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const pagos = proyecto.pagos || {};

    res.json({
      success: true,
      data: {
        proyecto: {
          numero: proyecto.numero,
          cliente: proyecto.cliente?.nombre
        },
        pagos: {
          montoTotal: pagos.montoTotal || 0,
          anticipo: pagos.anticipo || {},
          saldo: pagos.saldo || {},
          pagosAdicionales: pagos.pagosAdicionales || []
        }
      }
    });

  } catch (error) {
    logger.logError(error, {
      context: 'obtenerPagos',
      proyectoId: req.params.id,
      userId: req.usuario?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error al obtener pagos',
      error: error.message
    });
  }
};

module.exports = {
  registrarAnticipo,
  registrarSaldo,
  subirComprobante,
  obtenerPagos
};
