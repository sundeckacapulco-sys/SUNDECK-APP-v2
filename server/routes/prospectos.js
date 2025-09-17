const express = require('express');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los prospectos con filtros y paginación
router.get('/', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      etapa,
      vendedor,
      fuente,
      prioridad,
      busqueda,
      fechaDesde,
      fechaHasta
    } = req.query;

    // Construir filtros
    const filtros = { activo: true };
    
    if (etapa) filtros.etapa = etapa;
    if (vendedor) filtros.vendedorAsignado = vendedor;
    if (fuente) filtros.fuente = fuente;
    if (prioridad) filtros.prioridad = prioridad;
    
    if (fechaDesde || fechaHasta) {
      filtros.createdAt = {};
      if (fechaDesde) filtros.createdAt.$gte = new Date(fechaDesde);
      if (fechaHasta) filtros.createdAt.$lte = new Date(fechaHasta);
    }

    // Búsqueda por texto
    if (busqueda) {
      filtros.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { telefono: { $regex: busqueda, $options: 'i' } },
        { email: { $regex: busqueda, $options: 'i' } },
        { producto: { $regex: busqueda, $options: 'i' } }
      ];
    }

    // Si no es admin, solo ver sus prospectos asignados
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedorAsignado = req.usuario._id;
    }

    const opciones = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: 'vendedorAsignado', select: 'nombre apellido' }
      ]
    };

    const prospectos = await Prospecto.paginate(filtros, opciones);

    res.json(prospectos);
  } catch (error) {
    console.error('Error obteniendo prospectos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener prospecto por ID
router.get('/:id', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id)
      .populate('vendedorAsignado', 'nombre apellido email telefono')
      .populate('notas.usuario', 'nombre apellido');

    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Verificar permisos de acceso
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && 
        prospecto.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a este prospecto' });
    }

    res.json(prospecto);
  } catch (error) {
    console.error('Error obteniendo prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear nuevo prospecto
router.post('/', auth, verificarPermiso('prospectos', 'crear'), async (req, res) => {
  try {
    const {
      nombre,
      telefono,
      email,
      direccion,
      producto,
      tipoProducto,
      descripcionNecesidad,
      presupuestoEstimado,
      fechaCita,
      horaCita,
      fuente,
      referidoPor,
      prioridad,
      comoSeEntero,
      motivoCompra
    } = req.body;

    const nuevoProspecto = new Prospecto({
      nombre,
      telefono,
      email,
      direccion,
      producto,
      tipoProducto,
      descripcionNecesidad,
      presupuestoEstimado,
      fechaCita,
      horaCita,
      fuente,
      referidoPor,
      prioridad: prioridad || 'media',
      comoSeEntero,
      motivoCompra,
      vendedorAsignado: req.usuario._id,
      fechaProximoSeguimiento: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
    });

    await nuevoProspecto.save();
    await nuevoProspecto.populate('vendedorAsignado', 'nombre apellido');

    res.status(201).json({
      message: 'Prospecto creado exitosamente',
      prospecto: nuevoProspecto
    });
  } catch (error) {
    console.error('Error creando prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar prospecto
router.put('/:id', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id);
    
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Verificar permisos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && 
        prospecto.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a este prospecto' });
    }

    const camposPermitidos = [
      'nombre', 'telefono', 'email', 'direccion', 'producto', 'tipoProducto',
      'descripcionNecesidad', 'presupuestoEstimado', 'fechaCita', 'horaCita',
      'estadoCita', 'etapa', 'prioridad', 'fechaProximoSeguimiento', 'calificacion',
      'comoSeEntero', 'competencia', 'motivoCompra'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        prospecto[campo] = req.body[campo];
      }
    });

    // Actualizar fecha de último contacto si cambió la etapa
    if (req.body.etapa && req.body.etapa !== prospecto.etapa) {
      prospecto.fechaUltimoContacto = new Date();
    }

    await prospecto.save();
    await prospecto.populate('vendedorAsignado', 'nombre apellido');

    res.json({
      message: 'Prospecto actualizado exitosamente',
      prospecto
    });
  } catch (error) {
    console.error('Error actualizando prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar nota al prospecto
router.post('/:id/notas', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const { contenido, tipo } = req.body;
    
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    prospecto.notas.push({
      usuario: req.usuario._id,
      contenido,
      tipo: tipo || 'nota'
    });

    prospecto.fechaUltimoContacto = new Date();
    await prospecto.save();
    await prospecto.populate('notas.usuario', 'nombre apellido');

    res.json({
      message: 'Nota agregada exitosamente',
      nota: prospecto.notas[prospecto.notas.length - 1]
    });
  } catch (error) {
    console.error('Error agregando nota:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Cambiar etapa del prospecto
router.put('/:id/etapa', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const { etapa, motivo } = req.body;
    
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    const etapaAnterior = prospecto.etapa;
    prospecto.etapa = etapa;
    prospecto.fechaUltimoContacto = new Date();

    // Agregar nota automática del cambio de etapa
    prospecto.notas.push({
      usuario: req.usuario._id,
      contenido: `Cambio de etapa: ${etapaAnterior} → ${etapa}${motivo ? `. Motivo: ${motivo}` : ''}`,
      tipo: 'nota'
    });

    await prospecto.save();

    res.json({
      message: 'Etapa actualizada exitosamente',
      prospecto
    });
  } catch (error) {
    console.error('Error cambiando etapa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Asignar vendedor
router.put('/:id/asignar', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const { vendedorId } = req.body;
    
    // Solo admin y gerente pueden reasignar
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      return res.status(403).json({ message: 'No tienes permisos para asignar prospectos' });
    }

    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    prospecto.vendedorAsignado = vendedorId;
    prospecto.notas.push({
      usuario: req.usuario._id,
      contenido: `Prospecto reasignado`,
      tipo: 'nota'
    });

    await prospecto.save();
    await prospecto.populate('vendedorAsignado', 'nombre apellido');

    res.json({
      message: 'Prospecto asignado exitosamente',
      prospecto
    });
  } catch (error) {
    console.error('Error asignando prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener prospectos que necesitan seguimiento
router.get('/seguimiento/pendientes', auth, async (req, res) => {
  try {
    const filtros = {
      activo: true,
      fechaProximoSeguimiento: { $lte: new Date() },
      etapa: { $nin: ['entregado', 'postventa', 'perdido'] }
    };

    // Si no es admin, solo sus prospectos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedorAsignado = req.usuario._id;
    }

    const prospectos = await Prospecto.find(filtros)
      .populate('vendedorAsignado', 'nombre apellido')
      .sort({ fechaProximoSeguimiento: 1 })
      .limit(50);

    res.json(prospectos);
  } catch (error) {
    console.error('Error obteniendo seguimientos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar prospecto (soft delete)
router.delete('/:id', auth, verificarPermiso('prospectos', 'eliminar'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    prospecto.activo = false;
    await prospecto.save();

    res.json({ message: 'Prospecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
