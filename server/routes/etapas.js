const express = require('express');
const mongoose = require('mongoose');
const { auth, verificarPermiso } = require('../middleware/auth');
const Etapa = require('../models/Etapa');
const Prospecto = require('../models/Prospecto');
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
            cantidad: pieza.cantidad ? Number(pieza.cantidad) : 1, // ✅ CAMPO AGREGADO
            ancho: Number.isFinite(ancho) ? ancho : undefined,
            alto: Number.isFinite(alto) ? alto : undefined,
            producto: pieza.producto || '',
            productoLabel: pieza.productoLabel || '',
            color: pieza.color || '',
            precioM2: pieza.precioM2 ? Number(pieza.precioM2) : undefined,
            observaciones: pieza.observaciones || '',
            fotoUrls: Array.isArray(pieza.fotoUrls) ? pieza.fotoUrls : (pieza.fotoUrl ? [pieza.fotoUrl] : []),
            videoUrl: pieza.videoUrl || '',
            medidas: Array.isArray(pieza.medidas) ? pieza.medidas : [] // ✅ CAMPO AGREGADO
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

    res.status(201).json({
      message: 'Etapa agregada exitosamente',
      etapa
    });
  } catch (error) {
    console.error('Error creando etapa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Manejar preflight para PDF
router.options('/levantamiento-pdf', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Generar PDF de levantamiento de medidas
router.post('/levantamiento-pdf', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const {
      prospectoId,
      piezas = [],
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm'
    } = req.body;

    if (!prospectoId || !mongoose.Types.ObjectId.isValid(prospectoId)) {
      return res.status(400).json({ message: 'prospectoId inválido' });
    }

    const prospecto = await Prospecto.findById(prospectoId);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

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

    const pdf = await pdfService.generarLevantamientoPDF(etapaTemp, piezas, totalM2, precioGeneral);

    // Crear nombre de archivo consistente basado en contenido
    const nombreCliente = (prospecto.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    
    // Generar hash basado en el contenido del prospecto (consistente para el mismo prospecto)
    const crypto = require('crypto');
    const contenidoHash = crypto.createHash('md5')
      .update(`${prospectoId}-${prospecto.nombre}-${prospecto.telefono}`)
      .digest('hex')
      .substring(0, 8); // Usar solo los primeros 8 caracteres
    
    // Fecha de creación del prospecto o fecha actual si no existe
    const fechaBase = prospecto.creadoEn ? new Date(prospecto.creadoEn) : new Date();
    const fechaFormateada = fechaBase.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const nombreArchivo = `Levantamiento-${nombreCliente}-${fechaFormateada}-${contenidoHash}.pdf`;

    // Headers CORS específicos para descarga
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error generando PDF de levantamiento:', error);
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
      message: 'Error generando PDF de levantamiento',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Generar Excel de levantamiento de medidas
router.post('/levantamiento-excel', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const {
      prospectoId,
      piezas = [],
      precioGeneral = 750,
      totalM2 = 0,
      unidadMedida = 'm'
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
      unidadMedida
    );

    // Crear nombre de archivo consistente basado en contenido para Excel
    const nombreCliente = (prospecto.nombre || 'Cliente').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-') || 'Cliente';
    
    // Generar hash basado en el contenido del prospecto (consistente para el mismo prospecto)
    const crypto = require('crypto');
    const contenidoHash = crypto.createHash('md5')
      .update(`${prospectoId}-${prospecto.nombre}-${prospecto.telefono}`)
      .digest('hex')
      .substring(0, 8); // Usar solo los primeros 8 caracteres
    
    // Fecha de creación del prospecto o fecha actual si no existe
    const fechaBase = prospecto.creadoEn ? new Date(prospecto.creadoEn) : new Date();
    const fechaFormateada = fechaBase.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const nombreArchivoExcel = `Levantamiento-${nombreCliente}-${fechaFormateada}-${contenidoHash}.xlsx`;

    // Configurar headers para descarga
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
