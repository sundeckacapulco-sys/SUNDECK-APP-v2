const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Prospecto = require('../models/Prospecto');
const { auth, verificarPermiso } = require('../middleware/auth');

const router = express.Router();

// Configurar multer para subida de archivos de evidencias
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/evidencias');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `evidencia-${uniqueSuffix}${extension}`);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes, PDF y documentos de Word.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

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
      fechaHasta,
      archivado = 'false'
    } = req.query;

    // Construir filtros
    const filtros = { 
      activo: true,
      enPapelera: { $ne: true } // Excluir los que están en papelera
    };
    
    // Filtro de archivados
    if (archivado === 'true') {
      filtros.archivado = true;
    } else {
      filtros.archivado = { $ne: true }; // No archivados (incluyendo null/undefined)
    }
    
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
      .populate('notas.usuario', 'nombre apellido')
      .populate('etapas.usuario', 'nombre apellido');

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

// Listar comentarios (notas con posible categoría)
router.get('/:id/comentarios', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id)
      .populate('notas.usuario', 'nombre apellido');
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    // Ordenar por fecha descendente
    const comentarios = (prospecto.notas || []).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    res.json(comentarios);
  } catch (error) {
    console.error('Error listando comentarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar comentario
router.post('/:id/comentarios', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const { contenido, categoria, archivos } = req.body;

    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    let archivosNota = [];

    if (archivos) {
      if (Array.isArray(archivos)) {
        archivosNota = archivos;
      } else if (typeof archivos === 'string') {
        try {
          const parsed = JSON.parse(archivos);
          if (Array.isArray(parsed)) {
            archivosNota = parsed;
          }
        } catch (parseError) {
          console.warn('No se pudieron parsear los archivos del comentario:', parseError);
        }
      }
    }

    prospecto.notas.push({
      usuario: req.usuario._id,
      contenido,
      tipo: 'nota',
      categoria: categoria || 'General',
      archivos: archivosNota
    });

    prospecto.fechaUltimoContacto = new Date();
    await prospecto.save();
    await prospecto.populate('notas.usuario', 'nombre apellido');

    res.status(201).json({
      message: 'Comentario agregado exitosamente',
      comentario: prospecto.notas[prospecto.notas.length - 1]
    });
  } catch (error) {
    console.error('Error agregando comentario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Listar etapas (timeline)
router.get('/:id/etapas', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id)
      .populate('etapas.usuario', 'nombre apellido');
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }
    const etapas = (prospecto.etapas || []).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora));
    res.json(etapas);
  } catch (error) {
    console.error('Error listando etapas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar etapa
router.post('/:id/etapas', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const { nombre, fechaHora, observaciones, archivos } = req.body;

    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    const etapa = {
      nombre,
      fechaHora: fechaHora ? new Date(fechaHora) : new Date(),
      observaciones,
      archivos: Array.isArray(archivos) ? archivos : [],
      usuario: req.usuario._id
    };

    prospecto.etapas.push(etapa);
    await prospecto.save();
    await prospecto.populate('etapas.usuario', 'nombre apellido');

    res.status(201).json({
      message: 'Etapa agregada exitosamente',
      etapa: prospecto.etapas[prospecto.etapas.length - 1]
    });
  } catch (error) {
    console.error('Error agregando etapa:', error);
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
router.put('/:id', auth, verificarPermiso('prospectos', 'actualizar'), upload.array('evidencias', 10), async (req, res) => {
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
      'comoSeEntero', 'competencia', 'motivoCompra', 'archivado', 'fechaArchivado', 
      'motivoArchivado', 'enPapelera', 'fechaEliminacion', 'eliminadoPor', 'motivoReagendamiento'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        prospecto[campo] = req.body[campo];
      }
    });

    // Limpiar campos relacionados cuando se desarchivar
    if (req.body.archivado === false) {
      prospecto.fechaArchivado = null;
      prospecto.motivoArchivado = undefined; // Usar undefined para eliminar el campo
    }

    // Manejar archivos de evidencias del reagendamiento
    if (req.files && req.files.length > 0) {
      const evidencias = req.files.map(file => ({
        nombre: file.originalname,
        url: `/uploads/evidencias/${file.filename}`,
        tipo: file.mimetype,
        fechaSubida: new Date()
      }));
      
      // Agregar nuevas evidencias a las existentes
      if (!prospecto.evidenciasReagendamiento) {
        prospecto.evidenciasReagendamiento = [];
      }
      prospecto.evidenciasReagendamiento.push(...evidencias);
    }
    
    // Actualizar fecha de último contacto si cambió la etapa
    if (req.body.etapa && req.body.etapa !== prospecto.etapa) {
      prospecto.fechaUltimoContacto = new Date();
    }
    
    // Si se está reagendando, actualizar fecha de último contacto
    if (req.body.estadoCita === 'reagendada' && req.body.motivoReagendamiento) {
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

// Mover a papelera
router.put('/:id/papelera', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    console.log('Intentando mover a papelera:', req.params.id); // Debug
    console.log('Usuario:', req.usuario.nombre, req.usuario.rol); // Debug
    
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      console.log('Prospecto no encontrado'); // Debug
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    console.log('Prospecto encontrado:', prospecto.nombre); // Debug
    
    prospecto.enPapelera = true;
    prospecto.fechaEliminacion = new Date();
    prospecto.eliminadoPor = req.usuario._id;
    await prospecto.save();

    console.log('Prospecto movido a papelera exitosamente'); // Debug
    res.json({ message: 'Prospecto movido a papelera exitosamente' });
  } catch (error) {
    console.error('Error moviendo a papelera:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// Restaurar de papelera
router.put('/:id/restaurar', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    prospecto.enPapelera = false;
    prospecto.fechaEliminacion = null;
    prospecto.eliminadoPor = null;
    await prospecto.save();

    res.json({ message: 'Prospecto restaurado exitosamente' });
  } catch (error) {
    console.error('Error restaurando prospecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener prospectos en papelera
router.get('/papelera/listar', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const filtros = { 
      activo: true,
      enPapelera: true 
    };

    // Si no es admin, solo ver sus prospectos eliminados
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.eliminadoPor = req.usuario._id;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      populate: [
        { path: 'vendedorAsignado', select: 'nombre apellido' },
        { path: 'eliminadoPor', select: 'nombre apellido' }
      ],
      sort: { fechaEliminacion: -1 }
    };

    const result = await Prospecto.paginate(filtros, options);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo papelera:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar permanentemente
router.delete('/:id/permanente', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Verificar permisos de acceso al prospecto
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente' && 
        prospecto.vendedorAsignado?.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'No tienes acceso a este prospecto' });
    }

    // Solo permitir eliminar si está en papelera
    if (!prospecto.enPapelera) {
      return res.status(400).json({ message: 'El prospecto debe estar en papelera para eliminarlo permanentemente' });
    }

    await Prospecto.findByIdAndDelete(req.params.id);

    res.json({ message: 'Prospecto eliminado permanentemente' });
  } catch (error) {
    console.error('Error eliminando permanentemente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar directamente (sin papelera) - Solo para admins
router.delete('/:id/forzar', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const prospecto = await Prospecto.findById(req.params.id);
    if (!prospecto) {
      return res.status(404).json({ message: 'Prospecto no encontrado' });
    }

    // Solo admins pueden forzar eliminación
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ message: 'Solo los administradores pueden eliminar directamente' });
    }

    await Prospecto.findByIdAndDelete(req.params.id);

    res.json({ message: 'Prospecto eliminado permanentemente (forzado)' });
  } catch (error) {
    console.error('Error eliminando forzadamente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Vaciar papelera (eliminar todos los prospectos en papelera)
router.delete('/papelera/vaciar', auth, verificarPermiso('prospectos', 'actualizar'), async (req, res) => {
  try {
    const filtros = { 
      activo: true,
      enPapelera: true 
    };

    // Si no es admin, solo eliminar sus prospectos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.eliminadoPor = req.usuario._id;
    }

    const result = await Prospecto.deleteMany(filtros);

    res.json({ 
      message: `${result.deletedCount} prospectos eliminados permanentemente`,
      eliminados: result.deletedCount
    });
  } catch (error) {
    console.error('Error vaciando papelera:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
