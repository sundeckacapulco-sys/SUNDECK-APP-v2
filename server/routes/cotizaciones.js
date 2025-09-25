const express = require('express');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');
const pdfService = require('../services/pdfService');

const router = express.Router();

// Obtener cotizaciones con filtros
router.get('/', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      prospecto,
      fechaDesde,
      fechaHasta
    } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (prospecto) filtros.prospecto = prospecto;
    
    if (fechaDesde || fechaHasta) {
      filtros.createdAt = {};
      if (fechaDesde) filtros.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.createdAt.$lte = new Date(fechaHasta);
    }

    // Filtrar por usuario si no es admin/gerente
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.elaboradaPor = req.usuario._id;
    }

    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'prospecto', select: 'nombre telefono email' },
        { path: 'elaboradaPor', select: 'nombre apellido' }
      ]
    };

    const cotizaciones = await Cotizacion.paginate(filtros, opciones);
    res.json(cotizaciones);
  } catch (error) {
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Generar cotización desde visita inicial
router.post('/desde-visita', auth, verificarPermiso('cotizaciones', 'crear'), async (req, res) => {
  try {
    const {
      prospectoId,
      piezas,
      precioGeneral,
      totalM2,
      unidadMedida,
      comentarios
    } = req.body;

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Convertir piezas a productos de cotización
    const productos = piezas.map(pieza => {
      const area = (pieza.ancho || 0) * (pieza.alto || 0);
      const areaM2 = unidadMedida === 'cm' ? area / 10000 : area;
      const precioUnitario = pieza.precioM2 || precioGeneral || 750;
      
      return {
        nombre: pieza.productoLabel || pieza.producto || 'Producto personalizado',
        descripcion: `Ubicación: ${pieza.ubicacion}${pieza.observaciones ? ` - ${pieza.observaciones}` : ''}`,
        categoria: 'ventana',
        material: 'Aluminio',
        color: pieza.color || 'Natural',
        medidas: {
          ancho: pieza.ancho || 0,
          alto: pieza.alto || 0,
          area: areaM2
        },
        cantidad: 1,
        precioUnitario: precioUnitario,
        subtotal: areaM2 * precioUnitario,
        requiereR24: (pieza.ancho > 2.5 || pieza.alto > 2.5),
        tiempoFabricacion: (pieza.ancho > 2.5 || pieza.alto > 2.5) ? 15 : 10
      };
    });

    // Crear mediciones desde las piezas
    const mediciones = piezas.map(pieza => ({
      ambiente: pieza.ubicacion,
      ancho: pieza.ancho || 0,
      alto: pieza.alto || 0,
      area: unidadMedida === 'cm' ? ((pieza.ancho || 0) * (pieza.alto || 0)) / 10000 : (pieza.ancho || 0) * (pieza.alto || 0),
      cantidad: 1,
      notas: pieza.observaciones || '',
      fotos: (pieza.fotoUrls && pieza.fotoUrls.length > 0) ? 
        pieza.fotoUrls.map((url, index) => ({
          url: url,
          descripcion: `Foto ${index + 1} de ${pieza.ubicacion}`,
          fechaToma: new Date()
        })) : []
    }));

    const nuevaCotizacion = new Cotizacion({
      prospecto: prospectoId,
      // El número se genera automáticamente por el middleware del modelo
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      mediciones,
      productos,
      formaPago: {
        anticipo: { porcentaje: 50 },
        saldo: { porcentaje: 50, condiciones: 'contra entrega' }
      },
      tiempoFabricacion: Math.max(...productos.map(p => p.tiempoFabricacion)),
      tiempoInstalacion: Math.ceil(totalM2 / 10) || 1, // 1 día por cada 10m²
      requiereInstalacion: true,
      costoInstalacion: Math.round(totalM2 * 150), // $150 por m²
      garantia: {
        fabricacion: 12,
        instalacion: 6,
        descripcion: 'Garantía completa en fabricación e instalación'
      },
      elaboradaPor: req.usuario._id
    });

    await nuevaCotizacion.save();
    await nuevaCotizacion.populate([
      { path: 'prospecto', select: 'nombre telefono email' },
      { path: 'elaboradaPor', select: 'nombre apellido' }
    ]);

    // Actualizar etapa del prospecto a cotización
    prospecto.etapa = 'cotizacion';
    
    // Asegurar que el prospecto tenga un producto (requerido por el modelo)
    if (!prospecto.producto || prospecto.producto.trim() === '') {
      prospecto.producto = productos[0]?.nombre || 'Producto personalizado';
    }
    
    await prospecto.save();

    res.status(201).json({
      message: 'Cotización generada exitosamente desde visita inicial',
      cotizacion: nuevaCotizacion
    });
  } catch (error) {
    console.error('Error generando cotización desde visita:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nueva cotización
router.post('/', auth, verificarPermiso('cotizaciones', 'crear'), async (req, res) => {
  try {
    console.log('=== CREAR COTIZACIÓN ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    console.log('Usuario:', req.usuario._id);
    
    const {
      prospectoId,
      validoHasta,
      mediciones,
      productos,
      descuento,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion,
      costoInstalacion,
      garantia
    } = req.body;
    
    console.log('ProspectoId recibido:', prospectoId);
    console.log('Productos recibidos:', productos?.length || 0);

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    
    console.log('Prospecto encontrado:', prospecto.nombre);

    const nuevaCotizacion = new Cotizacion({
      prospecto: prospecto._id,
      validoHasta,
      mediciones,
      productos,
      descuento,
      formaPago,
      tiempoFabricacion,
      tiempoInstalacion,
      requiereInstalacion,
      costoInstalacion,
      garantia,
      elaboradaPor: req.usuario._id
    });

    console.log('Intentando guardar cotización...');
    await nuevaCotizacion.save();
    console.log('Cotización guardada exitosamente');
    
    await nuevaCotizacion.populate([
      { path: 'prospecto', select: 'nombre telefono email' },
      { path: 'elaboradaPor', select: 'nombre apellido' }
    ]);
    console.log('Cotización poblada exitosamente');

    // Actualizar etapa del prospecto
    prospecto.etapa = 'cotizacion';
    await prospecto.save();
    console.log('Prospecto actualizado exitosamente');

    res.status(201).json({
      message: 'Cotización creada exitosamente',
      cotizacion: nuevaCotizacion
    });
  } catch (error) {
    console.error('Error creando cotización:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Si es un error de validación de Mongoose
    if (error.name === 'ValidationError') {
      console.error('Errores de validación:', error.errors);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors: error.errors,
        details: Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`)
      });
    }
    
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obtener cotización por ID
router.get('/:id', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido email')
      .populate('notas.usuario', 'nombre apellido');

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    res.json(cotizacion);
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar cotización
router.put('/:id', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Solo el creador o admin/gerente pueden modificar
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && 
        cotizacion.elaboradaPor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    const camposPermitidos = [
      'validoHasta', 'mediciones', 'productos', 'descuento', 'formaPago',
      'tiempoFabricacion', 'tiempoInstalacion', 'requiereInstalacion',
      'costoInstalacion', 'garantia', 'estado'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        cotizacion[campo] = req.body[campo];
      }
    });

    await cotizacion.save();

    res.json({
      message: 'Cotización actualizada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error actualizando cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Enviar cotización al cliente
router.put('/:id/enviar', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    cotizacion.estado = 'enviada';
    cotizacion.fechaEnvio = new Date();
    
    // Agregar nota
    cotizacion.notas.push({
      usuario: req.usuario._id,
      contenido: 'Cotización enviada al cliente'
    });

    await cotizacion.save();

    res.json({
      message: 'Cotización enviada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error enviando cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Aprobar cotización (convertir a pedido)
router.put('/:id/aprobar', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    cotizacion.estado = 'aprobada';
    cotizacion.fechaRespuesta = new Date();
    
    await cotizacion.save();

    // Actualizar etapa del prospecto
    await Prospecto.findByIdAndUpdate(cotizacion.prospecto, {
      etapa: 'pedido'
    });

    res.json({
      message: 'Cotización aprobada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error aprobando cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Generar PDF de cotización
router.get('/:id/pdf', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido');

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Verificar permisos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && 
        cotizacion.elaboradaPor._id.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    const pdf = await pdfService.generarCotizacionPDF(cotizacion);

    // Crear nombre de archivo único pero más corto para cotización
    const nombreCliente = (cotizacion.prospecto?.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    const numeroCorto = cotizacion.numero || 'SIN-NUM';
    
    // Generar ID único más corto
    const ahora = new Date();
    const fechaFormateada = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaCorta = ahora.toTimeString().substr(0, 5).replace(':', ''); // HHMM
    const idCorto = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    const nombreArchivo = `Cotizacion-${numeroCorto}-${nombreCliente}-${fechaFormateada}-${horaCorta}-${idCorto}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error generando PDF:', error);
    console.error('Stack trace:', error.stack);
    
    // Verificar si es un error de dependencia faltante
    if (error.message.includes('Puppeteer no está disponible')) {
      return res.status(503).json({ 
        message: 'Servicio de generación de PDF no disponible',
        error: error.message,
        solucion: 'Instala Puppeteer: npm install puppeteer'
      });
    }
    
    res.status(500).json({ 
      message: 'Error generando PDF de cotización',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
