const express = require('express');
const Cotizacion = require('../models/Cotizacion');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');
const cotizacionController = require('../controllers/cotizacionController');
const logger = require('../config/logger');

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
    logger.logError(error, { context: 'obtenerCotizaciones', query: req.query, userId: req.usuario?.id });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Generar cotización desde visita inicial
router.post('/desde-visita', auth, verificarPermiso('cotizaciones', 'crear'), async (req, res) => {
  try {
    logger.info('Endpoint desde-visita iniciado', { bodyKeys: Object.keys(req.body), userId: req.usuario?.id });
    
    const {
      prospectoId,
      piezas,
      precioGeneral,
      totalM2,
      unidadMedida,
      comentarios,
      instalacionEspecial,
      origen,
      tipoVisitaInicial
    } = req.body;

    logger.debug('Datos extraídos desde-visita', { prospectoId, piezasCount: Array.isArray(piezas) ? piezas.length : 0, precioGeneral, totalM2, unidadMedida, origen });

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      logger.warn('Prospecto no encontrado', { prospectoId });
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    logger.debug('Prospecto encontrado', { prospectoId, nombre: prospecto.nombre });

    if (!Array.isArray(piezas) || piezas.length === 0) {
      return res.status(400).json({ message: 'Debes proporcionar al menos una partida para generar la cotización.' });
    }

    const unidadEsCm = unidadMedida === 'cm';
    const piezasNormalizadas = piezas
      .map((pieza, index) => {
        if (!pieza) {
          logger.warn('Pieza inválida omitida', { index });
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
              logger.warn('Medida inválida omitida', { piezaIndex: index, medidaIndex });
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
          logger.warn('Pieza sin medidas válidas omitida', { index });
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
          productoLabel: medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto || 'Producto personalizado',
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
          productoLabel: pieza.kitModelo || pieza.kitModeloManual || 'Kit para toldo',
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
        // Usar la nueva lógica de motores: numMotores o por defecto 1
        const numMotores = pieza.numMotores || 1;
        const subtotalMotores = motorPrecio * numMotores;

        productos.push({
          nombre: pieza.motorModelo || pieza.motorModeloManual || 'Motor para toldo',
          productoLabel: pieza.motorModelo || pieza.motorModeloManual || 'Motor para toldo',
          descripcion: `Motorización para ${pieza.ubicacion} (${numMotores} motor${numMotores > 1 ? 'es' : ''} para ${cantidadPiezas} pieza${cantidadPiezas > 1 ? 's' : ''})`,
          categoria: 'motor',
          material: 'Accesorio',
          color: 'N/A',
          medidas: { ancho: 0, alto: 0, area: 0 },
          cantidad: numMotores,
          precioUnitario: motorPrecio,
          subtotal: Number(subtotalMotores.toFixed(2)),
          requiereR24: false,
          tiempoFabricacion: 12
        });
      }

      const controlPrecio = Number(pieza.controlPrecio) || 0;
      if (pieza.motorizado && controlPrecio > 0) {
        // Usar la nueva lógica de controles multicanal
        const numMotores = pieza.numMotores || 1;
        const cantidadControles = pieza.esControlMulticanal ? 1 : numMotores;
        const subtotalControles = controlPrecio * cantidadControles;
        const tipoControl = pieza.esControlMulticanal ? 'multicanal' : 'individual';

        productos.push({
          nombre: pieza.controlModelo || pieza.controlModeloManual || 'Control remoto',
          productoLabel: pieza.controlModelo || pieza.controlModeloManual || 'Control remoto',
          descripcion: `Control ${tipoControl} para ${pieza.ubicacion} (${cantidadControles} control${cantidadControles > 1 ? 'es' : ''} para ${cantidadPiezas} pieza${cantidadPiezas > 1 ? 's' : ''})`,
          categoria: 'control',
          material: 'Accesorio',
          color: 'N/A',
          medidas: { ancho: 0, alto: 0, area: 0 },
          cantidad: cantidadControles,
          precioUnitario: controlPrecio,
          subtotal: Number(subtotalControles.toFixed(2)),
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

    // === CÁLCULO COMPLEJO DE TIEMPO DE INSTALACIÓN ===
    logger.debug('Iniciando cálculo de tiempo de instalación');
    
    let tiempoBaseDias = 0;
    let factoresComplejidad = {
      andamios: 0,
      obraElectrica: 0,
      alturaExtrema: 0,
      motorizacionCompleja: 0,
      diversidadProductos: 0,
      areaGrande: 0,
      instalacionExterior: 0,
      sistemasPremium: 0
    };
    
    let tiposProductos = new Set();
    let productosMotorizados = 0;
    let productosExterior = 0;
    let requiereAndamios = false;
    let requiereObraElectrica = false;
    
    // Analizar productos originales del request
    if (req.body.productos && Array.isArray(req.body.productos)) {
      req.body.productos.forEach(pieza => {
        const medidas = pieza.medidas || [];
        const medidasArray = Array.isArray(medidas) ? medidas : [medidas];
        
        medidasArray.forEach(medida => {
          if (!medida || typeof medida !== 'object') return;
          
          const ancho = parseFloat(medida.ancho) || 0;
          const alto = parseFloat(medida.alto) || 0;
          const area = parseFloat(medida.area) || (ancho * alto);
          const esMotorizado = Boolean(pieza.motorizado);
          const esToldo = Boolean(pieza.esToldo);
          const productoNombre = (medida.producto || '').toLowerCase();
          const tipoInstalacion = medida.tipoInstalacion || 'interior';
          const sistema = medida.sistema || 'estandar';
          
          tiposProductos.add(productoNombre);
          
          // === CÁLCULO BASE POR TIPO DE PRODUCTO ===
          if (esToldo || productoNombre.includes('toldo')) {
            // TOLDOS: Más complejos
            if (area > 20) {
              tiempoBaseDias += 2.5; // Toldos grandes
            } else if (area > 10) {
              tiempoBaseDias += 1.5; // Toldos medianos
            } else {
              tiempoBaseDias += 1.0; // Toldos pequeños
            }
            
            if (esMotorizado) {
              tiempoBaseDias += 0.5;
              productosMotorizados++;
            }
            
          } else if (productoNombre.includes('blackout') && esMotorizado) {
            // BLACKOUT MOTORIZADO
            tiempoBaseDias += 0.4 * (pieza.cantidad || 1);
            productosMotorizados++;
            
          } else if (productoNombre.includes('screen') || productoNombre.includes('persiana')) {
            // PERSIANAS SCREEN
            if (esMotorizado) {
              tiempoBaseDias += 0.3 * (pieza.cantidad || 1);
              productosMotorizados++;
            } else {
              tiempoBaseDias += 0.15 * (pieza.cantidad || 1);
            }
            
          } else if (productoNombre.includes('cortina')) {
            // CORTINAS TRADICIONALES
            tiempoBaseDias += 0.2 * (pieza.cantidad || 1);
            
          } else {
            // PRODUCTOS GENÉRICOS
            tiempoBaseDias += esMotorizado ? 0.4 : 0.2;
            if (esMotorizado) productosMotorizados++;
          }
          
          // === FACTORES DE COMPLEJIDAD ===
          
          // Altura extrema (andamios)
          if (alto > 4.0) {
            requiereAndamios = true;
            factoresComplejidad.andamios = Math.max(factoresComplejidad.andamios, 2);
            if (alto > 6.0) factoresComplejidad.alturaExtrema = 1;
          } else if (alto > 3.0) {
            factoresComplejidad.andamios = Math.max(factoresComplejidad.andamios, 1);
          }
          
          // Instalación exterior
          if (tipoInstalacion === 'exterior') {
            productosExterior++;
            factoresComplejidad.instalacionExterior = Math.max(factoresComplejidad.instalacionExterior, 0.5);
          }
          
          // Sistemas premium
          if (sistema === 'premium') {
            factoresComplejidad.sistemasPremium += 0.3;
          }
        });
        
        // Obra eléctrica
        if (pieza.requiereObraElectrica || pieza.costoObraElectrica > 0) {
          requiereObraElectrica = true;
          factoresComplejidad.obraElectrica = 1.5;
        }
        
        // Motorización compleja
        if (pieza.controlModelo && pieza.controlModelo.includes('multicanal')) {
          factoresComplejidad.motorizacionCompleja += 0.5;
        }
      });
    }
    
    // === FACTORES ADICIONALES ===
    
    // Diversidad de productos
    const numTiposProductos = tiposProductos.size;
    if (numTiposProductos >= 4) {
      factoresComplejidad.diversidadProductos = 1.5;
    } else if (numTiposProductos >= 3) {
      factoresComplejidad.diversidadProductos = 1.0;
    } else if (numTiposProductos >= 2) {
      factoresComplejidad.diversidadProductos = 0.5;
    }
    
    // Área grande del proyecto
    if (totalArea > 50) {
      factoresComplejidad.areaGrande = 1.5;
    } else if (totalArea > 30) {
      factoresComplejidad.areaGrande = 1.0;
    } else if (totalArea > 20) {
      factoresComplejidad.areaGrande = 0.5;
    }
    
    // === CÁLCULO FINAL ===
    const complejidadTotal = Object.values(factoresComplejidad).reduce((sum, factor) => sum + factor, 0);
    let tiempoInstalacionEstimado = Math.ceil(tiempoBaseDias + complejidadTotal);
    tiempoInstalacionEstimado = Math.max(1, Math.min(10, tiempoInstalacionEstimado));

    logger.debug('Análisis de instalación completado', { areaTotal: totalArea.toFixed(1), numTiposProductos, productosMotorizados, tiempoInstalacionEstimado, tiempoFabricacionEstimado, costoInstalacion });
    const subtotalProductos = productos.reduce((sum, prod) => sum + (prod.subtotal || 0), 0);
    const totalFinal = subtotalProductos + costoInstalacion;
    
    logger.debug('Totales calculados', { subtotalProductos, costoInstalacion, totalFinal });
    
    // Debug: Mostrar productos individuales
    logger.debug('Productos creados', { productosCount: productos.length, totalProductos: subtotalProductos });

    // Generar número de cotización manualmente como respaldo
    logger.debug('Generando número de cotización');
    let numeroCotizacion;
    try {
      const year = new Date().getFullYear();
      const count = await Cotizacion.countDocuments({
        createdAt: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });
      numeroCotizacion = `COT-${year}-${String(count + 1).padStart(4, '0')}`;
      logger.debug('Número de cotización generado', { numeroCotizacion });
    } catch (error) {
      logger.warn('Error generando número, usando timestamp', { error: error.message });
      const timestamp = Date.now().toString().slice(-6);
      numeroCotizacion = `COT-${new Date().getFullYear()}-${timestamp}`;
      logger.debug('Número con timestamp', { numeroCotizacion });
    }

    // Convertir piezas a productos de cotización
    logger.debug('Creando nueva cotización', { numeroCotizacion, prospectoId });
    const nuevaCotizacion = new Cotizacion({
      prospecto: prospectoId,
      numero: numeroCotizacion, // Asignar número manualmente
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      origen: origen || 'levantamiento', // Usar el origen enviado desde el frontend
      mediciones,
      productos,
      subtotal: subtotalProductos,
      total: totalFinal,
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

    logger.debug('Guardando cotización');
    await nuevaCotizacion.save();
    logger.info('Cotización creada exitosamente', { cotizacionId: nuevaCotizacion._id, numeroCotizacion, total: nuevaCotizacion.total });
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
    logger.logError(error, { context: 'generarCotizacionDesdeVisita', prospectoId: req.body.prospectoId, userId: req.usuario?.id });
    
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
    logger.debug('Obteniendo cotización por ID', { cotizacionId: req.params.id, userId: req.usuario?.id });
    
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido email')
      .populate('notas.usuario', 'nombre apellido');

    if (!cotizacion) {
      logger.warn('Cotización no encontrada', { cotizacionId: req.params.id });
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    logger.debug('Cotización encontrada', { numero: cotizacion.numero, prospecto: cotizacion.prospecto?.nombre, productosCount: cotizacion.productos?.length || 0, total: cotizacion.total });

    const cotizacionNormalizada = cotizacion.toObject({ virtuals: true });

    cotizacionNormalizada.productos = (cotizacionNormalizada.productos || []).map((producto) => {
      const cantidad = producto.cantidad || 1;
      const ancho = Number(producto.medidas?.ancho ?? producto.ancho) || 0;
      const alto = Number(producto.medidas?.alto ?? producto.alto) || 0;
      const area = Number(producto.medidas?.area ?? producto.area) || (ancho * alto);
      const precioUnitario = Number(producto.precioUnitario ?? producto.precioM2 ?? 0);
      const subtotal = Number(producto.subtotal ?? (precioUnitario * area * cantidad));
      const nombre = producto.nombre
        || producto.nombreProducto
        || producto.productoLabel
        || producto.producto
        || 'Producto personalizado';
      const descripcion = producto.descripcion
        || producto.observaciones
        || (producto.ubicacion ? `Ubicación: ${producto.ubicacion}` : '');

      return {
        ...producto,
        nombre,
        descripcion,
        productoLabel: producto.productoLabel || producto.nombreProducto || nombre,
        medidas: {
          ancho,
          alto,
          area
        },
        precioUnitario,
        subtotal
      };
    });

    res.json(cotizacionNormalizada);
  } catch (error) {
    logger.logError(error, { context: 'obtenerCotizacionPorId', cotizacionId: req.params.id, userId: req.usuario?.id });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar cotización
router.put('/:id', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    logger.info('Actualizando cotización', { cotizacionId: req.params.id, campos: Object.keys(req.body), userId: req.usuario?.id });
    
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }
    
    logger.debug('Cotización antes de actualizar', { total: cotizacion.total, iva: cotizacion.iva, incluirIVA: cotizacion.incluirIVA });

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
      'costoInstalacion', 'garantia', 'estado', 'subtotal', 'iva', 'total', 'incluirIVA',
      'pdfPath', 'pdfGeneradoEn' // Preservar ruta del PDF guardado
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        logger.debug('Actualizando campo', { campo, valor: req.body[campo] });
        cotizacion[campo] = req.body[campo];
      }
    });

    logger.debug('Cotización después de actualizar', { total: cotizacion.total, iva: cotizacion.iva, incluirIVA: cotizacion.incluirIVA });

    await cotizacion.save();
    
    logger.info('Cotización actualizada exitosamente', { cotizacionId: req.params.id, total: cotizacion.total, iva: cotizacion.iva });

    res.json({
      message: 'Cotización actualizada exitosamente',
      cotizacion
    });
  } catch (error) {
    logger.logError(error, { context: 'actualizarCotizacion', cotizacionId: req.params.id, userId: req.usuario?.id });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Archivar cotización
router.put('/:id/archivar', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    const { id } = req.params;
    logger.info('Archivando cotización', { cotizacionId: id, userId: req.usuario?.id });

    const cotizacion = await Cotizacion.findById(id);

    if (!cotizacion) {
      logger.warn('Cotización no encontrada para archivar', { cotizacionId: id });
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }
    logger.debug('Cotización encontrada para archivar', { cotizacionId: cotizacion._id });

    // Modificación: Asegurar que cotizacion.elaboradaPor existe antes de llamar a toString()
    const isOwner = cotizacion.elaboradaPor && cotizacion.elaboradaPor.toString() === req.usuario._id.toString();
    logger.debug('Verificando permisos de archivado', { isAdmin: req.usuario.rol === 'admin' || req.usuario.rol === 'gerente', isOwner });

    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && !isOwner) {
      logger.warn('Acceso denegado para archivar', { cotizacionId: id, userId: req.usuario._id });
      return res.status(403).json({ message: 'No tienes acceso para archivar esta cotización' });
    }
    logger.debug('Permiso de archivado concedido');

    cotizacion.archivada = true;
    cotizacion.fechaArchivado = new Date();
    cotizacion.archivadaPor = req.usuario._id;
    logger.debug('Campos de archivado establecidos');

    await cotizacion.save();
    logger.info('Cotización archivada exitosamente', { cotizacionId: id });

    res.json({
      message: 'Cotización archivada exitosamente',
      cotizacion
    });
  } catch (error) {
    logger.logError(error, { context: 'archivarCotizacion', cotizacionId: req.params.id, userId: req.usuario?.id });
    res.status(500).json({ 
      message: 'Error interno del servidor al archivar cotización',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    logger.logError(error, { context: 'desarchivarCotizacion', cotizacionId: req.params.id, userId: req.usuario?.id });
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
    logger.logError(error, { context: 'enviarCotizacion', cotizacionId: req.params.id, userId: req.usuario?.id });
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

    // Si la cotización está asociada a un proyecto, actualizar el proyecto
    if (cotizacion.proyecto) {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findById(cotizacion.proyecto);
      
      if (proyecto) {
        logger.debug('Proyecto antes de limpiar', { proyectoId: proyecto._id, subtotal: proyecto.subtotal, total: proyecto.total, cotizaciones: proyecto.cotizaciones.length });
        
        // Remover la cotización del array de cotizaciones
        proyecto.cotizaciones = proyecto.cotizaciones.filter(
          cotId => cotId.toString() !== req.params.id
        );
        
        // Limpiar SIEMPRE los totales cuando se elimina una cotización
        proyecto.cotizacionActual = null;
        proyecto.subtotal = 0;
        proyecto.iva = 0;
        proyecto.total = 0;
        proyecto.anticipo = 0;
        proyecto.saldo_pendiente = 0;
        
        // Limpiar precios de proyecto.medidas (formato viejo)
        if (proyecto.medidas && Array.isArray(proyecto.medidas)) {
          proyecto.medidas.forEach(medida => {
            if (medida.piezas && Array.isArray(medida.piezas)) {
              medida.piezas.forEach(pieza => {
                pieza.precioM2 = 0;
                pieza.precioTotal = 0;
                if (pieza.totales) {
                  pieza.totales.subtotal = 0;
                  pieza.totales.costoMotorizacion = 0;
                  pieza.totales.costoInstalacion = 0;
                }
              });
            }
            if (medida.precioM2) medida.precioM2 = 0;
            if (medida.precioTotal) medida.precioTotal = 0;
          });
        }
        
        // Limpiar los precios del levantamiento pero mantener las medidas físicas
        if (proyecto.levantamiento) {
          // Limpiar totales
          if (proyecto.levantamiento.totales) {
            proyecto.levantamiento.totales = {
              m2: proyecto.levantamiento.totales.m2 || 0, // Mantener m2
              subtotal: 0,
              descuento: 0,
              iva: 0,
              total: 0
            };
          }
          
          // Limpiar precios de las partidas pero mantener las medidas
          if (proyecto.levantamiento.partidas && Array.isArray(proyecto.levantamiento.partidas)) {
            proyecto.levantamiento.partidas.forEach(partida => {
              // Limpiar totales de la partida
              if (partida.totales) {
                partida.totales.subtotal = 0;
                partida.totales.costoMotorizacion = 0;
                partida.totales.costoInstalacion = 0;
              }
              
              // Limpiar precios de cada pieza pero mantener dimensiones
              if (partida.piezas && Array.isArray(partida.piezas)) {
                partida.piezas.forEach(pieza => {
                  pieza.precioM2 = 0;
                  if (pieza.totales) {
                    pieza.totales.subtotal = 0;
                    pieza.totales.costoMotorizacion = 0;
                    pieza.totales.costoInstalacion = 0;
                  }
                });
              }
              
              // Limpiar motorización
              if (partida.motorizacion) {
                partida.motorizacion.precioMotor = 0;
                partida.motorizacion.precioControl = 0;
              }
              
              // Limpiar instalación especial
              if (partida.instalacionEspecial) {
                partida.instalacionEspecial.precioBase = 0;
                partida.instalacionEspecial.precioPorPieza = 0;
              }
            });
          }
        }
        
        // Si no hay más cotizaciones, volver a estado levantamiento
        if (proyecto.cotizaciones.length === 0 && proyecto.estado === 'cotizacion') {
          proyecto.estado = 'levantamiento';
        }
        
        await proyecto.save();
        
        logger.info('Proyecto limpiado después de eliminar cotización', { proyectoId: proyecto._id, subtotal: proyecto.subtotal, total: proyecto.total, cotizaciones: proyecto.cotizaciones.length, estado: proyecto.estado });
      }
    }

    await cotizacion.deleteOne();

    res.json({ message: 'Cotización eliminada exitosamente' });
  } catch (error) {
    logger.logError(error, { context: 'eliminarCotizacion', cotizacionId: req.params.id, userId: req.usuario?.id });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Aprobar cotización (convertir a pedido)
router.put('/:id/aprobar', auth, verificarPermiso('cotizaciones', 'actualizar'), cotizacionController.aprobarCotizacion);

// Importar pathHelper para construcción correcta de rutas
const { getAbsolutePath, getUploadPath, getRelativePath, fileExists } = require('../utils/pathHelper');

// Generar PDF de cotización
router.get('/:id/pdf', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    // Headers CORS y anti-interceptación
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
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

    // ===== LOGS ESTRUCTURADOS PARA DEBUG =====
    logger.info('=== INICIO ENDPOINT PDF ===', {
      cotizacionId: req.params.id,
      numero: cotizacion.numero,
      timestamp: new Date().toISOString()
    });

    logger.info('Estado de pdfPath en BD', {
      cotizacionId: req.params.id,
      tienePdfPath: !!cotizacion.pdfPath,
      pdfPath: cotizacion.pdfPath,
      tipoPdfPath: typeof cotizacion.pdfPath,
      longitudPdfPath: cotizacion.pdfPath?.length,
      pdfGeneradoEn: cotizacion.pdfGeneradoEn,
      valorBooleano: !!cotizacion.pdfPath
    });

    // Si existe un PDF guardado, servirlo directamente
    if (cotizacion.pdfPath) {
      logger.info('✅ RAMA: Leer PDF guardado', {
        cotizacionId: req.params.id,
        pdfPath: cotizacion.pdfPath
      });
      const fs = require('fs').promises;
      
      // Usar pathHelper para construcción correcta de ruta
      const pdfPath = getAbsolutePath(cotizacion.pdfPath);
      
      logger.info('Intentando leer archivo del disco', {
        cotizacionId: req.params.id,
        rutaRelativa: cotizacion.pdfPath,
        rutaAbsoluta: pdfPath
      });
      
      try {
        // Verificar si el archivo existe antes de leer
        await fs.access(pdfPath);
        logger.info('✅ Archivo existe en disco', {
          cotizacionId: req.params.id,
          pdfPath: pdfPath
        });
        
        const pdfBuffer = await fs.readFile(pdfPath);
        logger.info('✅ PDF leído exitosamente del disco', {
          cotizacionId: req.params.id,
          pdfPath: cotizacion.pdfPath,
          pdfGeneradoEn: cotizacion.pdfGeneradoEn,
          tamañoBytes: pdfBuffer.length
        });
        
        // Headers simples - dejar que el navegador maneje el PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        
        logger.info('=== FIN ENDPOINT PDF (archivo guardado) ===', {
          cotizacionId: req.params.id,
          resultado: 'exitoso'
        });
        
        return res.send(pdfBuffer);
      } catch (readError) {
        logger.error('❌ ERROR al leer PDF guardado', {
          cotizacionId: req.params.id,
          pdfPath: cotizacion.pdfPath,
          rutaAbsoluta: pdfPath,
          error: readError.message,
          errorCode: readError.code,
          errorStack: readError.stack
        });
        // Si no se puede leer, continuar con la generación
      }
    } else {
      logger.warn('❌ RAMA: Generar PDF nuevo (pdfPath vacío o null)', {
        cotizacionId: req.params.id,
        pdfPath: cotizacion.pdfPath,
        tipoPdfPath: typeof cotizacion.pdfPath
      });
    }

    // Si no hay PDF guardado o no se pudo leer, generar uno nuevo Y GUARDARLO
    logger.info('🔄 Iniciando generación de PDF nuevo', {
      cotizacionId: req.params.id,
      numero: cotizacion.numero,
      razon: cotizacion.pdfPath ? 'error_lectura' : 'sin_pdfPath'
    });
    
    const pdf = await pdfService.generarCotizacionPDF(cotizacion);
    
    logger.info('✅ PDF generado exitosamente', {
      cotizacionId: req.params.id,
      tamañoBytes: pdf.length
    });

    // Guardar el PDF generado para no tener que regenerarlo
    // SOLO si no existe un pdfPath previo (para no sobrescribir)
    const fs = require('fs').promises;
    
    // Usar pathHelper para construcción correcta de rutas
    const { ensureUploadDirectory } = require('../utils/pathHelper');
    await ensureUploadDirectory('cotizaciones');
    
    // Nombre de archivo simple
    const nombreArchivo = `${cotizacion.numero}-${Date.now()}.pdf`;
    const rutaCompleta = getUploadPath('cotizaciones', nombreArchivo);
    const rutaRelativa = getRelativePath('cotizaciones', nombreArchivo);
    
    logger.info('💾 Guardando PDF en disco', {
      cotizacionId: req.params.id,
      nombreArchivo: nombreArchivo,
      rutaCompleta: rutaCompleta
    });
    
    // Guardar PDF en disco
    await fs.writeFile(rutaCompleta, pdf);
    
    logger.info('✅ PDF guardado en disco', {
      cotizacionId: req.params.id,
      rutaCompleta: rutaCompleta
    });
    
    // Actualizar cotización con la ruta del PDF SOLO si no tenía una antes
    // Esto evita sobrescribir el PDF original si se regenera por error
    if (!cotizacion.pdfPath) {
      logger.info('📝 Actualizando pdfPath en BD (primera vez)', {
        cotizacionId: req.params.id,
        pdfPathNuevo: rutaRelativa
      });
      
      cotizacion.pdfPath = rutaRelativa;
      cotizacion.pdfGeneradoEn = new Date();
      await cotizacion.save();
      
      logger.info('✅ PDF generado y guardado (primera vez)', {
        cotizacionId: req.params.id,
        pdfPath: cotizacion.pdfPath,
        pdfGeneradoEn: cotizacion.pdfGeneradoEn
      });
    } else {
      logger.warn('⚠️ PDF regenerado pero NO se actualizó pdfPath (ya existía)', {
        cotizacionId: req.params.id,
        pdfPathExistente: cotizacion.pdfPath,
        pdfNuevoGenerado: nombreArchivo,
        nota: 'Esto NO debería pasar - investigar por qué se regeneró'
      });
    }

    // Headers simples - dejar que el navegador maneje el PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdf.length);
    
    logger.info('=== FIN ENDPOINT PDF (PDF nuevo generado) ===', {
      cotizacionId: req.params.id,
      resultado: 'exitoso'
    });
    
    res.send(pdf);

  } catch (error) {
    logger.logError(error, { context: 'generarPDFCotizacion', cotizacionId: req.params.id });
    
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

// Endpoint de debug para diagnosticar problema de regeneración de PDFs
router.get('/:id/debug-pdf', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
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

    const fs = require('fs').promises;
    const path = require('path');
    
    // Información detallada del pdfPath
    const debugInfo = {
      cotizacion: {
        id: cotizacion._id,
        numero: cotizacion.numero,
        createdAt: cotizacion.createdAt,
        updatedAt: cotizacion.updatedAt
      },
      pdfPath: {
        valor: cotizacion.pdfPath,
        tipo: typeof cotizacion.pdfPath,
        esNull: cotizacion.pdfPath === null,
        esUndefined: cotizacion.pdfPath === undefined,
        esStringVacio: cotizacion.pdfPath === '',
        longitud: cotizacion.pdfPath?.length,
        valorBooleano: !!cotizacion.pdfPath,
        pdfGeneradoEn: cotizacion.pdfGeneradoEn
      },
      archivo: {
        rutaRelativa: cotizacion.pdfPath,
        rutaAbsoluta: null,
        existe: false,
        tamaño: null,
        error: null
      }
    };

    // Verificar si el archivo existe en disco
    if (cotizacion.pdfPath) {
      try {
        const pdfPath = path.join(__dirname, '../..', cotizacion.pdfPath);
        debugInfo.archivo.rutaAbsoluta = pdfPath;
        
        const stats = await fs.stat(pdfPath);
        debugInfo.archivo.existe = true;
        debugInfo.archivo.tamaño = stats.size;
        debugInfo.archivo.fechaModificacion = stats.mtime;
      } catch (fileError) {
        debugInfo.archivo.error = {
          mensaje: fileError.message,
          codigo: fileError.code
        };
      }
    }

    // Información del modelo
    debugInfo.modelo = {
      campos: Object.keys(cotizacion.toObject()),
      tienePdfPath: cotizacion.schema.paths.hasOwnProperty('pdfPath'),
      tipoCampoPdfPath: cotizacion.schema.paths.pdfPath?.instance
    };

    logger.info('🔍 Debug PDF solicitado', {
      cotizacionId: req.params.id,
      usuario: req.usuario.nombre,
      debugInfo: debugInfo
    });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      debug: debugInfo
    });

  } catch (error) {
    logger.error('Error en endpoint debug-pdf', {
      cotizacionId: req.params.id,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Error en debug',
      error: error.message
    });
  }
});

// Generar Excel de cotización
router.get('/:id/excel', auth, verificarPermiso('cotizaciones', 'leer'), async (req, res) => {
  try {
    const cotizacion = await Cotizacion.findById(req.params.id)
      .populate('prospecto')
      .populate('elaboradaPor', 'nombre apellido');

    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }

    // Verificar permisos
    const acceso = verificarAccesoCotizacion(cotizacion, req.usuario);
    if (!acceso.permitido) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    const excel = await excelService.generarCotizacionExcel(cotizacion);

    // Crear nombre de archivo único
    const nombreCliente = (cotizacion.prospecto?.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    const numeroCorto = cotizacion.numero ? cotizacion.numero.replace('COT-', '').replace(/\D/g, '').slice(-4) : 'XXXX';
    
    const ahora = new Date();
    const fechaFormateada = ahora.toISOString().substr(0, 10).replace(/-/g, '');
    const horaCorta = ahora.toTimeString().substr(0, 5).replace(':', '');
    const idCorto = Date.now().toString().slice(-6);
    
    const nombreArchivo = `Cotizacion-${numeroCorto}-${nombreCliente}-${fechaFormateada}-${horaCorta}-${idCorto}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(excel);

  } catch (error) {
    logger.logError(error, { context: 'generarExcelCotizacion', cotizacionId: req.params.id });
    res.status(500).json({ 
      message: 'Error generando Excel de cotización',
      error: error.message
    });
  }
});

// Recalcular totales de cotización existente (herramienta de mantenimiento)
router.put('/:id/recalcular', auth, verificarPermiso('cotizaciones', 'actualizar'), async (req, res) => {
  try {
    
    const cotizacion = await Cotizacion.findById(req.params.id);
    
    if (!cotizacion) {
      return res.status(404).json({ message: 'Cotización no encontrada' });
    }
    
    logger.debug('Cotización antes del recálculo', { total: cotizacion.total, subtotal: cotizacion.subtotal, iva: cotizacion.iva, productosCount: cotizacion.productos?.length || 0 });

    // Verificar permisos
    const acceso = verificarAccesoCotizacion(cotizacion, req.usuario);
    if (!acceso.permitido) {
      return res.status(403).json({ message: 'No tienes acceso a esta cotización' });
    }

    // Recalcular subtotales de productos
    let subtotalProductos = 0;
    
    cotizacion.productos.forEach((producto, index) => {
      const cantidad = producto.cantidad || 1;
      const ancho = Number(producto.medidas?.ancho ?? producto.ancho) || 0;
      const alto = Number(producto.medidas?.alto ?? producto.alto) || 0;
      const area = Number(producto.medidas?.area ?? producto.area) || (ancho * alto);
      const precioUnitario = Number(producto.precioUnitario ?? producto.precioM2) || 0;
      
      let subtotalProducto = 0;
      
      // Calcular según el tipo de producto
      if (['pieza', 'par', 'juego', 'kit', 'motor', 'control'].includes(producto.categoria)) {
        // Productos por pieza: precio × cantidad
        subtotalProducto = precioUnitario * cantidad;
      } else {
        // Productos por área: área × precio × cantidad
        subtotalProducto = area * precioUnitario * cantidad;
      }
      
      // Actualizar el subtotal del producto
      producto.subtotal = Number(subtotalProducto.toFixed(2));
      subtotalProductos += producto.subtotal;
      
      logger.debug('Producto recalculado', { index: index + 1, nombre: producto.nombre, area, precioUnitario, cantidad, subtotal: producto.subtotal });
    });

    // Calcular instalación
    const costoInstalacion = cotizacion.instalacion?.incluye ? (cotizacion.instalacion.costo || 0) : 0;
    
    // Calcular descuento
    let montoDescuento = 0;
    if (cotizacion.descuento?.aplica) {
      const baseParaDescuento = subtotalProductos + costoInstalacion;
      if (cotizacion.descuento.tipo === 'porcentaje') {
        montoDescuento = (baseParaDescuento * (cotizacion.descuento.valor || 0)) / 100;
      } else if (cotizacion.descuento.tipo === 'monto') {
        montoDescuento = cotizacion.descuento.valor || 0;
      }
      cotizacion.descuento.monto = Number(montoDescuento.toFixed(2));
    }
    
    // Calcular IVA
    const subtotalConInstalacion = subtotalProductos + costoInstalacion;
    const subtotalTrasDescuento = Math.max(subtotalConInstalacion - montoDescuento, 0);
    
    let ivaCalculado = 0;
    if (cotizacion.facturacion?.requiere) {
      // IVA se calcula sobre el subtotal DESPUÉS del descuento (correcto fiscalmente)
      ivaCalculado = Number((subtotalTrasDescuento * 0.16).toFixed(2));
    }
    
    // Calcular total final
    const totalFinal = Number((subtotalTrasDescuento + ivaCalculado).toFixed(2));
    
    // Actualizar los campos de la cotización
    cotizacion.subtotal = Number(subtotalProductos.toFixed(2));
    cotizacion.iva = ivaCalculado;
    cotizacion.total = totalFinal;
    
    logger.debug('Cotización después del recálculo', { subtotal: cotizacion.subtotal, instalacion: costoInstalacion, descuento: montoDescuento, iva: cotizacion.iva, total: cotizacion.total });

    await cotizacion.save();
    
    logger.info('Totales recalculados exitosamente', { cotizacionId: req.params.id, total: cotizacion.total });

    res.json({
      message: 'Totales recalculados exitosamente',
      cotizacion: {
        _id: cotizacion._id,
        numero: cotizacion.numero,
        subtotal: cotizacion.subtotal,
        iva: cotizacion.iva,
        total: cotizacion.total,
        productos: cotizacion.productos.map(p => ({
          nombre: p.nombre,
          subtotal: p.subtotal
        }))
      }
    });
  } catch (error) {
    logger.logError(error, { context: 'recalcularTotales', cotizacionId: req.params.id, userId: req.usuario?.id });
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
