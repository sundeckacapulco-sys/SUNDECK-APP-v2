/**
 * Controlador de Pagos
 * Manejo de anticipos, saldos y comprobantes de pago
 */

const Proyecto = require('../models/Proyecto');
const Caja = require('../models/Caja');
const logger = require('../config/logger');
const mongoose = require('mongoose');
const { getUploadPath, getRelativePath, ensureUploadDirectory } = require('../utils/pathHelper');
const fs = require('fs').promises;

/**
 * Helper: Registrar movimiento en caja automáticamente
 * Solo registra si hay caja abierta y el método de pago es efectivo
 */
const registrarEnCaja = async (datos, usuarioId) => {
  try {
    const caja = await Caja.obtenerCajaAbierta();
    
    if (!caja) {
      logger.info('No hay caja abierta, movimiento no registrado en caja', {
        proyectoId: datos.proyectoId,
        monto: datos.monto
      });
      return { registrado: false, motivo: 'No hay caja abierta' };
    }

    // Crear movimiento
    const movimiento = {
      tipo: 'ingreso',
      categoria: datos.tipoPago === 'anticipo' ? 'anticipo_proyecto' : 'saldo_proyecto',
      concepto: `${datos.tipoPago === 'anticipo' ? 'Anticipo' : 'Saldo'} - Proyecto ${datos.proyectoNumero || datos.proyectoId}`,
      monto: parseFloat(datos.monto),
      metodoPago: datos.metodoPago || 'efectivo',
      referencia: datos.referencia || '',
      proyecto: datos.proyectoId,
      tipoPago: datos.tipoPago,
      comprobante: datos.comprobante || '',
      cliente: {
        nombre: datos.clienteNombre || '',
        telefono: datos.clienteTelefono || ''
      },
      hora: new Date(),
      usuario: usuarioId,
      notas: datos.notas || '',
      estado: 'activo'
    };

    await caja.agregarMovimiento(movimiento);

    logger.info('💰 Pago registrado automáticamente en caja', {
      cajaNumero: caja.numero,
      proyectoId: datos.proyectoId,
      tipoPago: datos.tipoPago,
      monto: datos.monto,
      metodoPago: datos.metodoPago
    });

    return { 
      registrado: true, 
      cajaNumero: caja.numero,
      movimientoId: caja.movimientos[caja.movimientos.length - 1]._id
    };

  } catch (error) {
    logger.error('Error registrando en caja', {
      error: error.message,
      proyectoId: datos.proyectoId
    });
    return { registrado: false, motivo: error.message };
  }
};

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
    // Buscar el monto total del proyecto desde múltiples fuentes
    let totalProyecto = proyecto.pagos?.montoTotal || 0;
    
    // Si no hay montoTotal en pagos, buscar en cotización o calcular desde anticipo
    if (!totalProyecto || totalProyecto === 0) {
      // Intentar obtener de la cotización activa
      if (proyecto.cotizaciones && proyecto.cotizaciones.length > 0) {
        const cotizacionActiva = proyecto.cotizaciones.find(c => c.estado === 'aprobada') 
          || proyecto.cotizaciones[proyecto.cotizaciones.length - 1];
        totalProyecto = cotizacionActiva?.total || cotizacionActiva?.totales?.total || 0;
      }
      
      // Si aún no hay total, calcular desde el anticipo (asumiendo 60%)
      if (!totalProyecto || totalProyecto === 0) {
        const porcentajeAnticipo = porcentaje || 60;
        totalProyecto = parseFloat(monto) / (porcentajeAnticipo / 100);
        
        logger.warn('Monto total calculado desde anticipo', {
          proyectoId: id,
          anticipo: monto,
          porcentaje: porcentajeAnticipo,
          totalCalculado: totalProyecto
        });
      }
      
      // Guardar el monto total calculado
      proyecto.pagos.montoTotal = totalProyecto;
    }
    
    if (!proyecto.pagos.saldo) {
      proyecto.pagos.saldo = {};
    }
    
    // Calcular saldo correctamente: Total - Anticipo
    const saldoPendiente = totalProyecto - parseFloat(monto);
    proyecto.pagos.saldo.monto = saldoPendiente > 0 ? saldoPendiente : 0;
    
    logger.info('Saldo calculado', {
      proyectoId: id,
      totalProyecto: totalProyecto,
      anticipo: monto,
      saldoPendiente: proyecto.pagos.saldo.monto
    });

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

    // 💰 REGISTRAR EN CAJA (si hay caja abierta)
    let resultadoCaja = { registrado: false };
    try {
      resultadoCaja = await registrarEnCaja({
        proyectoId: id,
        proyectoNumero: proyecto.numero,
        monto: monto,
        metodoPago: metodoPago,
        tipoPago: 'anticipo',
        referencia: referencia,
        comprobante: comprobante,
        clienteNombre: proyecto.cliente?.nombre,
        clienteTelefono: proyecto.cliente?.telefono,
        notas: `Anticipo ${porcentaje || 60}% del proyecto`
      }, req.usuario._id);
    } catch (cajaError) {
      logger.warn('No se pudo registrar en caja (no crítico)', {
        proyectoId: id,
        error: cajaError.message
      });
    }

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

      // 🔄 CAMBIAR ESTADO A FABRICACIÓN cuando se recibe anticipo
      // Estados válidos para pasar a fabricación (cualquier estado previo excepto completado/cancelado)
      const estadosValidosParaFabricacion = [
        'aprobado', 'cotizacion', 'levantamiento', 'activo', 'pausado',
        'nuevo', 'contactado', 'en_seguimiento', 'cita_agendada', 'cotizado'
      ];
      
      const estadoActual = proyecto.estado || proyecto.estadoComercial;
      
      if (estadosValidosParaFabricacion.includes(estadoActual) || 
          estadosValidosParaFabricacion.includes(proyecto.estadoComercial)) {
        
        const estadoAnterior = proyecto.estado;
        const estadoComercialAnterior = proyecto.estadoComercial;
        
        // Actualizar ambos campos de estado
        proyecto.estado = 'fabricacion';
        proyecto.estadoComercial = 'en_fabricacion';
        proyecto.tipo = 'proyecto'; // Asegurar que es proyecto (no prospecto)
        
        await proyecto.save();
        
        logger.info('🏭 FLUJO AUTOMÁTICO: Anticipo recibido → Estado actualizado a FABRICACIÓN', {
          proyectoId: id,
          estadoAnterior: estadoAnterior,
          estadoComercialAnterior: estadoComercialAnterior,
          estadoNuevo: 'fabricacion',
          estadoComercialNuevo: 'en_fabricacion',
          montoAnticipo: monto,
          flujo: 'Anticipo → Fabricación → Instalación → Completado'
        });
      } else {
        logger.warn('⚠️ Estado no válido para transición a fabricación', {
          proyectoId: id,
          estadoActual: estadoActual,
          estadoComercial: proyecto.estadoComercial,
          estadosPermitidos: estadosValidosParaFabricacion
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
        alertaCreada: true,
        caja: resultadoCaja
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

    // 💰 REGISTRAR EN CAJA (si hay caja abierta)
    let resultadoCaja = { registrado: false };
    try {
      resultadoCaja = await registrarEnCaja({
        proyectoId: id,
        proyectoNumero: proyecto.numero,
        monto: monto,
        metodoPago: metodoPago,
        tipoPago: 'saldo',
        referencia: referencia,
        comprobante: comprobante,
        clienteNombre: proyecto.cliente?.nombre,
        clienteTelefono: proyecto.cliente?.telefono,
        notas: 'Saldo final del proyecto'
      }, req.usuario._id);
    } catch (cajaError) {
      logger.warn('No se pudo registrar saldo en caja (no crítico)', {
        proyectoId: id,
        error: cajaError.message
      });
    }

    // Verificar si el proyecto está completamente pagado
    const completamentePagado = proyecto.pagos?.anticipo?.pagado && proyecto.pagos?.saldo?.pagado;
    
    if (completamentePagado) {
      logger.info('✅ Proyecto completamente pagado', {
        proyectoId: id,
        numero: proyecto.numero,
        montoTotal: (proyecto.pagos?.anticipo?.monto || 0) + (proyecto.pagos?.saldo?.monto || 0)
      });
    }

    res.json({
      success: true,
      message: 'Saldo registrado exitosamente',
      data: {
        saldo: proyecto.pagos.saldo,
        completamentePagado: completamentePagado,
        caja: resultadoCaja
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
