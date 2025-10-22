const express = require('express');
const mongoose = require('mongoose');
const { auth, verificarPermiso } = require('../middleware/auth');
const Etapa = require('../models/Etapa');
const Prospecto = require('../models/Prospecto');
const ProyectoSyncMiddleware = require('../middleware/proyectoSync');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');

const router = express.Router();

// Obtener etapas de un prospecto
router.get('/', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const { prospectoId } = req.query;

    if (!prospectoId || !mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({ message: 'prospectoId inválido o requerido' });
    }

    // Verificar que el prospecto existe
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Obtener etapas ordenadas por fecha de creación (más reciente primero)
    const etapas = await Etapa.find({ prospectoId })
      .sort({ creadoEn: -1 })
      .populate('creadoPor', 'nombre email')
      .lean();

    res.json({
      etapas,
      total: etapas.length
    });

  } catch (error) {
    console.error('Error obteniendo etapas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const {
      prospectoId,
      nombreEtapa,
      fecha,
      hora,
      piezas = [],
      comentarios,
      unidadMedida = 'm',
      precioGeneral,
      totalM2
    } = req.body;

    if (!prospectoId || !mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({ message: 'prospectoId inválido' });
    }

    if (!nombreEtapa) {
      return res.status(400).json({ message: 'El nombre de la etapa es obligatorio' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    const piezasNormalizadas = Array.isArray(piezas)
      ? piezas
        .map((pieza) => {
          if (!pieza) return null;

          const ancho = pieza.ancho !== undefined && pieza.ancho !== null && pieza.ancho !== ''
            ? Number(pieza.ancho)
            : undefined;
          const alto = pieza.alto !== undefined && pieza.alto !== null && pieza.alto !== ''
            ? Number(pieza.alto)
            : undefined;

          return {
            ubicacion: pieza.ubicacion || '',
            cantidad: pieza.cantidad ? Number(pieza.cantidad) : 1,
            ancho: Number.isFinite(ancho) ? ancho : undefined,
            alto: Number.isFinite(alto) ? alto : undefined,
            producto: pieza.producto || '',
            productoLabel: pieza.productoLabel || '',
            color: pieza.color || '',
            precioM2: pieza.precioM2 ? Number(pieza.precioM2) : undefined,
            observaciones: pieza.observaciones || '',
            fotoUrls: Array.isArray(pieza.fotoUrls) ? pieza.fotoUrls : (pieza.fotoUrl ? [pieza.fotoUrl] : []),
            videoUrl: pieza.videoUrl || '',
            medidas: Array.isArray(pieza.medidas) ? pieza.medidas : [],
            // CAMPOS TÉCNICOS CRÍTICOS QUE FALTABAN
            sistema: Array.isArray(pieza.sistema) ? pieza.sistema : [],
            sistemaEspecial: Array.isArray(pieza.sistemaEspecial) ? pieza.sistemaEspecial : [],
            tipoControl: pieza.tipoControl || '',
            galeria: pieza.galeria || '',
            baseTabla: pieza.baseTabla || '',
            orientacion: pieza.orientacion || '',
            tipoInstalacion: pieza.tipoInstalacion || '',
            eliminacion: pieza.eliminacion || '',
            risoAlto: pieza.risoAlto || '',
            risoBajo: pieza.risoBajo || '',
            telaMarca: pieza.telaMarca || '',
            // CAMPOS DE TOLDOS Y MOTORIZACIÓN
            esToldo: Boolean(pieza.esToldo),
            tipoToldo: pieza.tipoToldo || '',
            kitModelo: pieza.kitModelo || '',
            kitModeloManual: pieza.kitModeloManual || '',
            kitPrecio: pieza.kitPrecio ? Number(pieza.kitPrecio) : 0,
            motorizado: Boolean(pieza.motorizado),
            motorModelo: pieza.motorModelo || '',
            motorModeloManual: pieza.motorModeloManual || '',
            motorPrecio: pieza.motorPrecio ? Number(pieza.motorPrecio) : 0,
            controlModelo: pieza.controlModelo || '',
            controlModeloManual: pieza.controlModeloManual || '',
            controlPrecio: pieza.controlPrecio ? Number(pieza.controlPrecio) : 0
          };
        })
        .filter(Boolean)
      : [];

    const etapa = new Etapa({
      prospectoId,
      nombreEtapa,
      fecha: fecha ? new Date(fecha) : undefined,
      hora,
      unidadMedida: unidadMedida === 'cm' ? 'cm' : 'm',
      piezas: piezasNormalizadas,
      comentarios,
      precioGeneral: precioGeneral ? Number(precioGeneral) : undefined,
      totalM2: totalM2 ? Number(totalM2) : undefined,
      creadoPor: req.usuario._id
    });

    await etapa.save();

    prospecto.fechaUltimoContacto = new Date();
    await prospecto.save();

    // 🔄 SINCRONIZACIÓN AUTOMÁTICA: Sincronizar medidas al Proyecto
    try {
      const Proyecto = require('../models/Proyecto');
      const proyecto = await Proyecto.findOne({ prospecto_original: prospectoId });
      
      if (proyecto) {
        await ProyectoSyncMiddleware.sincronizarMedidasDesdeEtapas(proyecto._id, prospectoId);
        console.log(`✅ Medidas sincronizadas al proyecto ${proyecto._id} desde etapa`);
      }
    } catch (syncError) {
      console.error('⚠️ Error sincronizando medidas:', syncError);
      // No interrumpir el flujo principal
    }

    res.status(201).json({
      message: 'Etapa agregada exitosamente',
      etapa
    });
  } catch (error) {
    console.error('Error creando etapa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Manejar preflight para PDF (CORS ya maneja esto globalmente)
router.options('/levantamiento-pdf', (req, res) => {
  res.sendStatus(200);
});

// Middleware de autenticación simplificado para GET con token en URL
const authSimple = (req, res, next) => {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-jwt-secret-por-defecto');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Generar PDF de levantamiento de medidas (GET y POST)
router.get('/levantamiento-pdf', authSimple, async (req, res) => {
  console.log('🎯 Iniciando generación de PDF de levantamiento (GET)...');
  
  try {
    const {
      prospectoId,
      piezas: piezasString = '[]',
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm'
    } = req.query;
    
    const piezas = JSON.parse(piezasString);
    console.log('📋 Datos recibidos:', { prospectoId, piezasCount: piezas?.length || 0 });
    
    await generarPDFLevantamiento(req, res, { prospectoId, piezas, precioGeneral: Number(precioGeneral), totalM2: Number(totalM2), unidadMedida });
  } catch (error) {
    console.error('Error en GET PDF:', error);
    res.status(500).json({ message: 'Error generando PDF', error: error.message });
  }
});

// Endpoint GET alternativo para evitar interceptación de IDM
router.get('/pdf-viewer/:prospectoId', authSimple, async (req, res) => {
  console.log('🎯 PDF Viewer - Evitando interceptación IDM...');
  
  try {
    const { prospectoId } = req.params;
    const {
      piezas: piezasString = '[]',
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm'
    } = req.query;
    
    const piezas = JSON.parse(piezasString);
    console.log('📋 PDF Viewer - Datos recibidos:', { prospectoId, piezasCount: piezas?.length || 0 });
    
    // Agregar headers específicos para evitar interceptación
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="cotizacion.pdf"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    await generarPDFLevantamiento(req, res, { prospectoId, piezas, precioGeneral: Number(precioGeneral), totalM2: Number(totalM2), unidadMedida });
  } catch (error) {
    console.error('Error en PDF Viewer:', error);
    res.status(500).json({ message: 'Error generando PDF', error: error.message });
  }
});

// Endpoint de prueba para PDF (sin permisos para debugging)
router.post('/levantamiento-pdf-test', auth, async (req, res) => {
  console.log('🧪 TEST: Iniciando generación de PDF de levantamiento...');
  console.log('📋 TEST: Datos recibidos:', { 
    prospectoId: req.body.prospectoId, 
    piezasCount: req.body.piezas?.length || 0,
    usuario: req.usuario?.nombre || 'Usuario desconocido'
  });
  
  try {
    const {
      prospectoId,
      piezas = [],
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm'
    } = req.body;
    
    console.log('🔍 TEST: Procesando datos...', { prospectoId, piezasCount: piezas.length });
    
    await generarPDFLevantamiento(req, res, { prospectoId, piezas, precioGeneral, totalM2, unidadMedida });
  } catch (error) {
    console.error('❌ TEST: Error en PDF:', error);
    res.status(500).json({ message: 'Error generando PDF (TEST)', error: error.message });
  }
});

// Generar PDF de levantamiento de medidas (POST - mantener compatibilidad)
router.post('/levantamiento-pdf', (req, res, next) => {
  // Si viene token en el body (formulario HTML), agregarlo al header
  if (req.body.authorization && !req.headers.authorization) {
    req.headers.authorization = req.body.authorization;
    delete req.body.authorization; // Remover del body para no interferir
  }
  next();
}, auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  console.log('🎯 Iniciando generación de PDF de levantamiento (POST)...');
  console.log('📋 Datos recibidos:', { 
    prospectoId: req.body.prospectoId, 
    piezasCount: req.body.piezas?.length || 0,
    soloGenerarPDF: req.body.soloGenerarPDF,
    guardarPDF: req.body.guardarPDF,
    url: req.originalUrl
  });
  
  try {
    const {
      prospectoId,
      piezas: piezasRaw = [],
      precioGeneral = 750,
      totalM2 = 0,
      subtotalProductos = 0,
      unidadMedida = 'm',
      instalacion: instalacionRaw,
      descuento: descuentoRaw,
      facturacion: facturacionRaw,
      metodoPago: metodoPagoRaw,
      totalFinal = 0
    } = req.body;
    
    // Parsear datos que vienen como string (formulario HTML)
    const piezas = typeof piezasRaw === 'string' ? JSON.parse(piezasRaw) : piezasRaw;
    const instalacion = typeof instalacionRaw === 'string' ? JSON.parse(instalacionRaw) : instalacionRaw;
    const descuento = typeof descuentoRaw === 'string' ? JSON.parse(descuentoRaw) : descuentoRaw;
    const facturacion = typeof facturacionRaw === 'string' ? JSON.parse(facturacionRaw) : facturacionRaw;
    const metodoPago = typeof metodoPagoRaw === 'string' ? JSON.parse(metodoPagoRaw) : metodoPagoRaw;
    
    await generarPDFLevantamiento(req, res, { 
      prospectoId, 
      piezas, 
      precioGeneral, 
      totalM2, 
      subtotalProductos,
      unidadMedida,
      instalacion,
      descuento,
      facturacion,
      metodoPago,
      totalFinal
    });
  } catch (error) {
    console.error('Error en POST PDF:', error);
    res.status(500).json({ message: 'Error generando PDF', error: error.message });
  }
});

// Función común para generar PDF
async function generarPDFLevantamiento(req, res, { prospectoId, piezas, precioGeneral, totalM2, subtotalProductos, unidadMedida, instalacion, descuento, facturacion, metodoPago, totalFinal }) {
  try {
    // Headers para evitar interceptación de IDM
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('🔍 Validando prospectoId...', { prospectoId, isValid: mongoose.Types.ObjectId.isValid(prospectoId) });

    if (!prospectoId || !mongoose.Types.ObjectId.isValid(prospectoId)) {
      console.error('❌ ProspectoId inválido:', prospectoId);
      return res.status(400).json({ message: 'prospectoId inválido' });
    }

    console.log('🔍 Buscando prospecto en base de datos...');
    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      console.error('❌ Prospecto no encontrado:', prospectoId);
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    console.log('✅ Prospecto encontrado:', { nombre: prospecto.nombre, telefono: prospecto.telefono });

    // Crear objeto etapa temporal para el PDF
    const etapaTemp = {
      prospecto: {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        email: prospecto.email,
        direccion: prospecto.direccion
      },
      unidadMedida,
      piezas
    };

    console.log('🔍 Generando PDF con pdfService...', { 
      piezasCount: piezas.length, 
      totalM2, 
      precioGeneral: precioGeneral,
      precioGeneralType: typeof precioGeneral,
      precioGeneralNumber: Number(precioGeneral),
      unidadMedida 
    });

    const pdf = await pdfService.generarLevantamientoPDF(etapaTemp, piezas, totalM2, Number(precioGeneral) || 750, {
      subtotalProductos,
      instalacion,
      descuento,
      facturacion,
      metodoPago,
      totalFinal
    });
    console.log('✅ PDF generado exitosamente, tamaño:', pdf.length, 'bytes');

    // Crear nombre de archivo único pero más corto
    const nombreCliente = (prospecto.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    
    // Generar ID único más corto (últimos 6 dígitos del timestamp + hora)
    const ahora = new Date();
    const fechaFormateada = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaCorta = ahora.toTimeString().substr(0, 5).replace(':', ''); // HHMM
    const idCorto = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    const nombreArchivo = `Levantamiento-${nombreCliente}-${fechaFormateada}-${horaCorta}-${idCorto}.pdf`;

    console.log('📄 PDF generado exitosamente');
    console.log('📁 Nombre de archivo:', nombreArchivo);
    console.log('📊 Tamaño del PDF:', pdf.length, 'bytes');

    // Headers para descarga (CORS ya maneja Access-Control-Allow-Origin)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(pdf);
    
    console.log('✅ PDF enviado al cliente');
  } catch (error) {
    console.error('❌ Error en generarPDFLevantamiento:', {
      message: error.message,
      stack: error.stack,
      prospectoId,
      piezasCount: piezas?.length || 0
    });
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error interno generando PDF', 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

// Manejar preflight para Excel (CORS ya maneja esto globalmente)
router.options('/levantamiento-excel', (req, res) => {
  res.sendStatus(200);
});

// Generar Excel de levantamiento de medidas
router.post('/levantamiento-excel', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const {
      prospectoId,
      piezas = [],
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm',
      tipoVisita = 'levantamiento' // Nuevo: tipo de visita para determinar si incluir precios
    } = req.body;

    if (!prospectoId || !mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({ message: 'prospectoId inválido' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Generar Excel
    const excelBuffer = await excelService.generarLevantamientoExcel(
      {
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        email: prospecto.email,
        direccion: prospecto.direccion
      },
      piezas,
      precioGeneral,
      totalM2,
      unidadMedida,
      tipoVisita // Pasar tipo de visita al servicio
    );

    // Crear nombre de archivo único pero más corto para Excel
    const nombreCliente = (prospecto.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    
    // Generar ID único más corto
    const ahora = new Date();
    const fechaFormateada = ahora.toISOString().split('T')[0]; // YYYY-MM-DD
    const horaCorta = ahora.toTimeString().substr(0, 5).replace(':', ''); // HHMM
    const idCorto = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    const nombreArchivoExcel = `Levantamiento-${nombreCliente}-${fechaFormateada}-${horaCorta}-${idCorto}.xlsx`;

    // Headers para descarga de Excel (CORS ya maneja Access-Control-Allow-Origin)
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivoExcel}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('Error generando Excel de levantamiento:', error);
    
    // Verificar si es un error de dependencia faltante
    if (error.message.includes('ExcelJS no está disponible')) {
      return res.status(503).json({ 
        message: 'Servicio de generación de Excel no disponible',
        error: error.message,
        suggestion: 'Contacta al administrador para instalar las dependencias necesarias'
      });
    }
    
    res.status(500).json({ 
      message: 'Error generando Excel del levantamiento',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

module.exports = router;
