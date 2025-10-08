const express = require('express');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const cotizacionController = require('../controllers/cotizacionController');

const router = express.Router();

const verificarAccesoCotizacion = (cotizacion, usuario) => {
  if (!cotizacion || !usuario) {
    return { permitido: false };
  }

  if (usuario.rol === 'admin' || usuario.rol === 'gerente') {
    return { permitido: true };
  }

  if (!cotizacion.elaboradaPor) {
    return { permitido: true, asignarPropietario: true };
  }

  return {
    permitido: cotizacion.elaboradaPor.toString() === usuario._id.toString()
  };
};

// Obtener cotizaciones con filtros
router.get('/', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      estado,
      prospecto,
      fechaDesde,
      fechaHasta,
      archivada
    } = req.query;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (prospecto) filtros.prospecto = prospecto;

    if (archivada === 'true') {
      filtros.archivada = true;
    } else if (archivada === 'false') {
      filtros.archivada = { $ne: true };
    }

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
    console.log('🔍 === ENDPOINT DESDE-VISITA ===');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));
    
    const {
      prospectoId,
      piezas,
      precioGeneral,
      totalM2,
      unidadMedida,
      comentarios,
      instalacionEspecial
    } = req.body;

    console.log('📋 Datos extraídos:');
    console.log('- ProspectoId:', prospectoId);
    console.log('- Piezas count:', Array.isArray(piezas) ? piezas.length : 'No es array');
    console.log('- Precio general:', precioGeneral);
    console.log('- Total M2:', totalM2);
    console.log('- Unidad medida:', unidadMedida);
    console.log('- Comentarios length:', comentarios?.length || 0);
    console.log('- Instalación especial:', instalacionEspecial);

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      console.error('❌ Prospecto no encontrado:', prospectoId);
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    console.log('✅ Prospecto encontrado:', prospecto.nombre);

    if (!Array.isArray(piezas) || piezas.length === 0) {
      return res.status(400).json({ message: 'Debes proporcionar al menos una partida para generar la cotización.' });
    }

    const unidadEsCm = unidadMedida === 'cm';
    const piezasNormalizadas = piezas
      .map((pieza, index) => {
        if (!pieza) {
          console.warn(`⚠️ Pieza inválida en índice ${index}, se omitirá en la cotización.`);
          return null;
        }

        const medidasOrigen = Array.isArray(pieza.medidas) && pieza.medidas.length > 0
          ? pieza.medidas
          : [{
            ancho: pieza.ancho,
            alto: pieza.alto,
            producto: pieza.producto,
            productoLabel: pieza.productoLabel,
            color: pieza.color,
            precioM2: pieza.precioM2
          }];

        const medidasNormalizadas = medidasOrigen
          .map((medida, medidaIndex) => {
            if (!medida) {
              console.warn(`⚠️ Medida inválida en pieza ${index}, posición ${medidaIndex}.`);
              return null;
            }

            const anchoRaw = Number(medida.ancho ?? pieza.ancho ?? 0) || 0;
            const altoRaw = Number(medida.alto ?? pieza.alto ?? 0) || 0;

            if (anchoRaw <= 0 || altoRaw <= 0) {
              return null;
            }

            const ancho = unidadEsCm ? anchoRaw / 100 : anchoRaw;
            const alto = unidadEsCm ? altoRaw / 100 : altoRaw;
            const area = ancho * alto;

            return {
              ancho,
              alto,
              area,
              producto: medida.producto || pieza.producto,
              productoLabel: medida.productoLabel || pieza.productoLabel,
              color: medida.color || pieza.color,
              precioM2: medida.precioM2 ?? pieza.precioM2
            };
          })
          .filter(Boolean);

        if (medidasNormalizadas.length === 0) {
          console.warn(`⚠️ Pieza ${index} no tiene medidas válidas y será omitida.`);
          return null;
        }

        return {
          ...pieza,
          medidas: medidasNormalizadas
        };
      })
      .filter(Boolean);

    if (piezasNormalizadas.length === 0) {
      return res.status(400).json({ message: 'No se encontraron partidas con medidas válidas para generar la cotización.' });
    }

    const productos = [];
    const mediciones = [];

    piezasNormalizadas.forEach((pieza) => {
      const precioBase = Number(pieza.precioM2) || Number(precioGeneral) || 750;
      const cantidadPiezas = pieza.medidas.length;

      pieza.medidas.forEach((medida, medidaIndex) => {
        const precioUnitario = Number(medida.precioM2) || precioBase;
        const subtotal = Number((medida.area * precioUnitario).toFixed(2));
        const requiereRefuerzo = medida.ancho > 2.5 || medida.alto > 2.5;

        productos.push({
          nombre: medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto || 'Producto personalizado',
          descripcion: `Ubicación: ${pieza.ubicacion}${pieza.observaciones ? ` - ${pieza.observaciones}` : ''}${cantidadPiezas > 1 ? ` (pieza ${medidaIndex + 1} de ${cantidadPiezas})` : ''}`,
          categoria: pieza.esToldo ? 'toldo' : 'ventana',
          material: pieza.material || 'Aluminio',
          color: medida.color || 'Natural',
          medidas: {
            ancho: Number(medida.ancho.toFixed(3)),
            alto: Number(medida.alto.toFixed(3)),
            area: Number(medida.area.toFixed(3))
          },
          cantidad: 1,
          precioUnitario,
          subtotal,
          requiereR24: requiereRefuerzo,
          tiempoFabricacion: requiereRefuerzo ? 15 : 10
        });

        mediciones.push({
          ambiente: pieza.ubicacion,
          ancho: Number(medida.ancho.toFixed(3)),
          alto: Number(medida.alto.toFixed(3)),
          area: Number(medida.area.toFixed(3)),
          cantidad: 1,
          notas: pieza.observaciones || '',
          fotos: Array.isArray(pieza.fotoUrls) && pieza.fotoUrls.length > 0
            ? pieza.fotoUrls.map((url, indexFoto) => ({
              url,
              descripcion: `Foto ${indexFoto + 1} de ${pieza.ubicacion}`,
              fechaToma: new Date()
            }))
            : []
        });
      });

      const kitPrecio = Number(pieza.kitPrecio) || 0;
      if (pieza.esToldo && kitPrecio > 0) {
        productos.push({
          nombre: pieza.kitModelo || pieza.kitModeloManual || 'Kit para toldo',
          descripcion: `Accesorios para instalación en ${pieza.ubicacion}`,
          categoria: 'kit',
          material: 'Accesorio',
          color: pieza.color || 'Natural',
          medidas: { ancho: 0, alto: 0, area: 0 },
          cantidad: cantidadPiezas,
          precioUnitario: kitPrecio,
          subtotal: Number((kitPrecio * cantidadPiezas).toFixed(2)),
          requiereR24: false,
          tiempoFabricacion: 7
        });
      }

      const motorPrecio = Number(pieza.motorPrecio) || 0;
      if (pieza.motorizado && motorPrecio > 0) {
        productos.push({
          nombre: pieza.motorModelo || pieza.motorModeloManual || 'Motor para toldo',
          descripcion: `Motorización para ${pieza.ubicacion}`,
          categoria: 'motor',
          material: 'Accesorio',
          color: 'N/A',
          medidas: { ancho: 0, alto: 0, area: 0 },
          cantidad: cantidadPiezas,
          precioUnitario: motorPrecio,
          subtotal: Number((motorPrecio * cantidadPiezas).toFixed(2)),
          requiereR24: false,
          tiempoFabricacion: 12
        });
      }

      const controlPrecio = Number(pieza.controlPrecio) || 0;
      if (pieza.motorizado && controlPrecio > 0) {
        productos.push({
          nombre: pieza.controlModelo || pieza.controlModeloManual || 'Control remoto',
          descripcion: `Control para ${pieza.ubicacion}`,
          categoria: 'control',
          material: 'Accesorio',
          color: 'N/A',
          medidas: { ancho: 0, alto: 0, area: 0 },
          cantidad: 1,
          precioUnitario: controlPrecio,
          subtotal: Number(controlPrecio.toFixed(2)),
          requiereR24: false,
          tiempoFabricacion: 7
        });
      }
    });

    if (productos.length === 0) {
      return res.status(400).json({ message: 'No fue posible generar productos válidos para la cotización.' });
    }

    const totalAreaMedida = piezasNormalizadas.reduce((suma, pieza) => {
      return suma + pieza.medidas.reduce((subtotal, medida) => subtotal + (Number(medida.area) || 0), 0);
    }, 0);

    const totalAreaInput = Number(totalM2);
    const totalAreaCalculado = Number(totalAreaMedida.toFixed(3));
    const totalArea = totalAreaInput > 0 ? totalAreaInput : (totalAreaCalculado > 0 ? totalAreaCalculado : 0);

    const requiereInstalacion = instalacionEspecial?.activa ? instalacionEspecial.precio > 0 : true;
    const costoInstalacion = instalacionEspecial?.activa
      ? Number(instalacionEspecial.precio) || 0
      : Math.round(totalArea * 150);

    const tiempoFabricacionEstimado = productos.reduce((max, prod) => {
      return Math.max(max, prod.tiempoFabricacion || 0);
    }, 10);

    const tiempoInstalacionEstimado = Math.max(1, Math.ceil((totalArea || 1) / 10));

    console.log('📊 Datos calculados para cotización:');
    console.log('- Productos count:', productos.length);
    console.log('- Mediciones count:', mediciones.length);
    console.log('- Total área:', totalArea);
    console.log('- Tiempo fabricación:', tiempoFabricacionEstimado);
    console.log('- Tiempo instalación:', tiempoInstalacionEstimado);
    console.log('- Requiere instalación:', requiereInstalacion);
    console.log('- Costo instalación:', costoInstalacion);
    console.log('- Subtotal productos:', productos.reduce((sum, prod) => sum + (prod.subtotal || 0), 0));

    // Convertir piezas a productos de cotización
    console.log('🔨 Creando nueva cotización...');
    const nuevaCotizacion = new Cotizacion({
      prospecto: prospectoId,
      // El número se genera automáticamente por el middleware del modelo
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      mediciones,
      productos,
      subtotal: productos.reduce((sum, prod) => sum + (prod.subtotal || 0), 0),
      formaPago: {
        anticipo: { porcentaje: 50 },
        saldo: { porcentaje: 50, condiciones: 'contra entrega' }
      },
      tiempoFabricacion: tiempoFabricacionEstimado,
      tiempoInstalacion: tiempoInstalacionEstimado,
      requiereInstalacion,
      costoInstalacion,
      garantia: {
        fabricacion: 12,
        instalacion: 6,
        descripcion: 'Garantía completa en fabricación e instalación'
      },
      notas: comentarios ? [{ contenido: comentarios, usuario: req.usuario._id }] : [],
      elaboradaPor: req.usuario._id
    });

    console.log('✅ Cotización creada en memoria, guardando...');
    await nuevaCotizacion.save();
    console.log('✅ Cotización guardada exitosamente');
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
    console.error('❌ Error generando cotización desde visita:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Enviar información detallada del error para debugging
    res.status(500).json({ 
      message: 'Error interno del servidor al generar cotización',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Crear nueva cotización
router.post('/', auth, verificarPermiso('cotizaciones', 'crear'), cotizacionController.crearCotizacion);

// Obtener cotización por ID
router.get('/:id', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    console.log('=== OBTENER COTIZACIÓN ===');
    console.log('ID solicitado:', req.params.id);
    
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido email')
      .populate('notas.usuario', 'nombre apellido');

    if (!cotizacion) {
      console.log('Cotización no encontrada con ID:', req.params.id);
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    console.log('Cotización encontrada:');
    console.log('- Número:', cotizacion.numero);
    console.log('- Prospecto:', cotizacion.prospecto?.nombre);
    console.log('- Productos:', cotizacion.productos?.length || 0);
    console.log('- Total:', cotizacion.total);
    
    res.json(cotizacion);
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar cotización
router.put('/:id', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    console.log('=== ACTUALIZAR COTIZACIÓN ===');
    console.log('ID:', req.params.id);
    console.log('Body completo:', JSON.stringify(req.body, null, 2));
    
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }
    
    console.log('Cotización antes de actualizar:');
    console.log('- Total actual:', cotizacion.total);
    console.log('- IVA actual:', cotizacion.iva);
    console.log('- IncluirIVA actual:', cotizacion.incluirIVA);

    // Solo el creador o admin/gerente pueden modificar
    const acceso = verificarAccesoCotizacion(cotizacion, req.usuario);
    if (!acceso.permitido) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    if (acceso.asignarPropietario) {
      cotizacion.elaboradaPor = req.usuario._id;
    }

    const camposPermitidos = [
      'validoHasta', 'mediciones', 'productos', 'descuento', 'formaPago',
      'tiempoFabricacion', 'tiempoInstalacion', 'requiereInstalacion',
      'costoInstalacion', 'garantia', 'estado', 'subtotal', 'iva', 'total', 'incluirIVA'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        console.log(`Actualizando ${campo}:`, req.body[campo]);
        cotizacion[campo] = req.body[campo];
      }
    });

    console.log('Cotización después de actualizar campos:');
    console.log('- Total nuevo:', cotizacion.total);
    console.log('- IVA nuevo:', cotizacion.iva);
    console.log('- IncluirIVA nuevo:', cotizacion.incluirIVA);

    await cotizacion.save();
    
    console.log('Cotización guardada exitosamente');
    console.log('- Total final:', cotizacion.total);
    console.log('- IVA final:', cotizacion.iva);
    console.log('- IncluirIVA final:', cotizacion.incluirIVA);

    res.json({
      message: 'Cotización actualizada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error actualizando cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Archivar cotización
router.put('/:id/archivar', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Modificación: Asegurar que cotizacion.elaboradaPor existe antes de llamar a toString()
    const isOwner = cotizacion.elaboradaPor && cotizacion.elaboradaPor.toString() === req.usuario._id.toString();

    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && !isOwner) {
      return res.status(403).json({ message: 'No tienes acceso para archivar esta cotización' });
    }

    cotizacion.archivada = true;
    cotizacion.fechaArchivado = new Date();
    cotizacion.archivadaPor = req.usuario._id;

    await cotizacion.save();

    res.json({
      message: 'Cotización archivada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error archivando cotización:', error);
    res.status(500).json({ message: 'Error interno del servidor al archivar cotización' }); // Mensaje de error más específico
  }
});

// Desarchivar cotización
router.put('/:id/desarchivar', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' &&
        cotizacion.elaboradaPor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    cotizacion.archivada = false;
    cotizacion.fechaArchivado = undefined;
    cotizacion.archivadaPor = undefined;

    await cotizacion.save();

    res.json({
      message: 'Cotización desarchivada exitosamente',
      cotizacion
    });
  } catch (error) {
    console.error('Error desarchivando cotización:', error);
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

// Eliminar cotización
router.delete('/:id', auth, verificarPermiso('cotizaciones', 'eliminar'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id);

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' &&
        cotizacion.elaboradaPor.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    await cotizacion.deleteOne();

    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cotización:', error);
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
