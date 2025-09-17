const express = require('express');
const mongoose = require('mongoose');
const { auth, verificarPermiso } = require('../middleware/auth');
const Etapa = require('../models/Etapa');
const Prospecto = require('../models/Prospecto');
const pdfService = require('../services/pdfService');

const router = express.Router();

router.post('/', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const {
      prospectoId,
      nombreEtapa,
      fecha,
      hora,
      piezas = [],
      comentarios,
      unidadMedida = 'm'
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
            ancho: Number.isFinite(ancho) ? ancho : undefined,
            alto: Number.isFinite(alto) ? alto : undefined,
            producto: pieza.producto || '',
            color: pieza.color || '',
            control: pieza.control === 'motorizado' ? 'motorizado' : 'manual',
            observaciones: pieza.observaciones || '',
            fotoUrl: pieza.fotoUrl || pieza.foto || ''
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Levantamiento-${prospecto.nombre.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdf);

  } catch (error) {
    console.error('Error generando PDF de levantamiento:', error);
    res.status(500).json({ message: 'Error generando PDF del levantamiento' });
  }
});

module.exports = router;
