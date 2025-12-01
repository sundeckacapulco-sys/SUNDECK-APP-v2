/**
 * Rutas API para gestión de sobrantes de materiales
 */

const express = require('express');
const router = express.Router();
const SobrantesService = require('../services/sobrantesService');
const SobranteMaterial = require('../models/SobranteMaterial');
const { auth, verificarPermiso } = require('../middleware/auth');
const logger = require('../config/logger');

// GET /api/sobrantes - Listar sobrantes disponibles
router.get('/',
  auth,
  verificarPermiso('almacen', 'leer'),
  async (req, res) => {
    try {
      const { tipo, estado = 'disponible', diametro, longitudMin } = req.query;
      
      const filtro = { estado };
      if (tipo) filtro.tipo = tipo;
      if (diametro) filtro.diametro = diametro;
      if (longitudMin) filtro.longitud = { $gte: parseFloat(longitudMin) };
      
      const sobrantes = await SobranteMaterial.find(filtro)
        .sort({ tipo: 1, longitud: -1 })
        .populate('origenProyecto', 'numero cliente.nombre')
        .lean();
      
      res.json({
        success: true,
        data: sobrantes,
        total: sobrantes.length
      });
    } catch (error) {
      logger.error('Error listando sobrantes', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/sobrantes/resumen - Obtener resumen de sobrantes
router.get('/resumen',
  auth,
  verificarPermiso('almacen', 'leer'),
  async (req, res) => {
    try {
      const resumen = await SobrantesService.obtenerResumen();
      
      res.json({
        success: true,
        data: resumen
      });
    } catch (error) {
      logger.error('Error obteniendo resumen de sobrantes', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/sobrantes/reglas - Obtener reglas de sobrantes
router.get('/reglas',
  auth,
  async (req, res) => {
    try {
      const reglas = SobrantesService.obtenerReglas();
      res.json({ success: true, data: reglas });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/sobrantes/buscar - Buscar sobrantes para reutilizar
router.get('/buscar',
  auth,
  verificarPermiso('almacen', 'leer'),
  async (req, res) => {
    try {
      const { tipo, longitudNecesaria, diametro, color, codigo } = req.query;
      
      if (!tipo || !longitudNecesaria) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere tipo y longitudNecesaria'
        });
      }
      
      const sobrantes = await SobrantesService.buscarSobrantesDisponibles(
        tipo,
        parseFloat(longitudNecesaria),
        { diametro, color, codigo }
      );
      
      res.json({
        success: true,
        data: sobrantes,
        total: sobrantes.length,
        mejorOpcion: sobrantes[0] || null
      });
    } catch (error) {
      logger.error('Error buscando sobrantes', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/sobrantes - Registrar un sobrante
router.post('/',
  auth,
  verificarPermiso('almacen', 'crear'),
  async (req, res) => {
    try {
      const resultado = await SobrantesService.registrarSobrante({
        ...req.body,
        usuarioId: req.usuario?.id
      });
      
      res.status(201).json({
        success: true,
        data: resultado
      });
    } catch (error) {
      logger.error('Error registrando sobrante', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/sobrantes/orden - Registrar sobrantes de una orden de producción
router.post('/orden',
  auth,
  verificarPermiso('almacen', 'crear'),
  async (req, res) => {
    try {
      const { sobrantes, proyectoId, ordenProduccion } = req.body;
      
      if (!sobrantes || !Array.isArray(sobrantes)) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de sobrantes'
        });
      }
      
      const resultado = await SobrantesService.registrarSobrantesOrden(
        sobrantes,
        proyectoId,
        ordenProduccion,
        req.usuario?.id
      );
      
      res.status(201).json({
        success: true,
        data: resultado,
        resumen: {
          almacenados: resultado.almacenados.length,
          desechados: resultado.desechados.length,
          paraInventario: resultado.paraInventario.length,
          alertas: resultado.alertas.length
        }
      });
    } catch (error) {
      logger.error('Error registrando sobrantes de orden', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/sobrantes/:id/usar - Usar un sobrante
router.post('/:id/usar',
  auth,
  verificarPermiso('almacen', 'actualizar'),
  async (req, res) => {
    try {
      const { longitudUsada, proyectoId } = req.body;
      
      if (!longitudUsada) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere longitudUsada'
        });
      }
      
      const resultado = await SobrantesService.usarSobrante(
        req.params.id,
        parseFloat(longitudUsada),
        proyectoId,
        req.usuario?.id
      );
      
      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      logger.error('Error usando sobrante', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// POST /api/sobrantes/descartar - Descartar múltiples sobrantes
router.post('/descartar',
  auth,
  verificarPermiso('almacen', 'eliminar'),
  async (req, res) => {
    try {
      const { sobranteIds, motivo } = req.body;
      
      if (!sobranteIds || !Array.isArray(sobranteIds) || sobranteIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de sobranteIds'
        });
      }
      
      const resultado = await SobrantesService.descartarSobrantes(
        sobranteIds,
        motivo || 'Sin motivo especificado',
        req.usuario?.id
      );
      
      res.json({
        success: true,
        data: resultado
      });
    } catch (error) {
      logger.error('Error descartando sobrantes', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// PUT /api/sobrantes/:id - Actualizar sobrante
router.put('/:id',
  auth,
  verificarPermiso('almacen', 'actualizar'),
  async (req, res) => {
    try {
      const sobrante = await SobranteMaterial.findByIdAndUpdate(
        req.params.id,
        { ...req.body, actualizadoPor: req.usuario?.id },
        { new: true, runValidators: true }
      );
      
      if (!sobrante) {
        return res.status(404).json({
          success: false,
          message: 'Sobrante no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: sobrante
      });
    } catch (error) {
      logger.error('Error actualizando sobrante', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/sobrantes/:id - Eliminar sobrante (solo si está descartado)
router.delete('/:id',
  auth,
  verificarPermiso('almacen', 'eliminar'),
  async (req, res) => {
    try {
      const sobrante = await SobranteMaterial.findById(req.params.id);
      
      if (!sobrante) {
        return res.status(404).json({
          success: false,
          message: 'Sobrante no encontrado'
        });
      }
      
      if (sobrante.estado !== 'descartado') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden eliminar sobrantes descartados. Primero descarte el sobrante.'
        });
      }
      
      await sobrante.deleteOne();
      
      res.json({
        success: true,
        message: 'Sobrante eliminado'
      });
    } catch (error) {
      logger.error('Error eliminando sobrante', { error: error.message });
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
