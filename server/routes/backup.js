const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth, verificarPermiso } = require('../middleware/auth');

// Importar todos los modelos
const Prospecto = require('../models/Prospecto');
const Usuario = require('../models/Usuario');
const PlantillaWhatsApp = require('../models/PlantillaWhatsApp');
// Agregar otros modelos según sea necesario

const router = express.Router();

// Exportar todos los datos del sistema
router.get('/export/complete', auth, verificarPermiso('admin', 'leer'), async (req, res) => {
  try {
    console.log('Iniciando exportación completa de datos...');
    
    // Obtener todos los datos de cada colección
    const [
      prospectos,
      usuarios,
      plantillasWhatsApp
      // Agregar otras colecciones según sea necesario
    ] = await Promise.all([
      Prospecto.find({}).lean(),
      Usuario.find({}).select('-password').lean(), // Excluir passwords por seguridad
      PlantillaWhatsApp.find({}).lean()
      // Agregar otras consultas según sea necesario
    ]);

    // Crear estructura de backup
    const backupData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        exportedBy: req.usuario._id,
        exportedByName: `${req.usuario.nombre} ${req.usuario.apellido}`,
        totalRecords: {
          prospectos: prospectos.length,
          usuarios: usuarios.length,
          plantillasWhatsApp: plantillasWhatsApp.length
        }
      },
      data: {
        prospectos,
        usuarios,
        plantillasWhatsApp
        // Agregar otras colecciones según sea necesario
      }
    };

    console.log('Exportación completada:', backupData.metadata.totalRecords);

    // Configurar headers para descarga
    const fileName = `sundeck_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json(backupData);

  } catch (error) {
    console.error('Error en exportación completa:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Exportar solo prospectos (más específico)
router.get('/export/prospectos', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    console.log('Iniciando exportación de prospectos...');
    
    const { incluirArchivados = 'false', incluirPapelera = 'false' } = req.query;
    
    // Construir filtros
    let filtros = { activo: true };
    
    if (incluirArchivados === 'false') {
      filtros.archivado = { $ne: true };
    }
    
    if (incluirPapelera === 'false') {
      filtros.enPapelera = { $ne: true };
    }

    // Si no es admin, solo sus prospectos
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedorAsignado = req.usuario._id;
    }

    const prospectos = await Prospecto.find(filtros)
      .populate('vendedorAsignado', 'nombre apellido email')
      .lean();

    const backupData = {
      metadata: {
        exportDate: new Date().toISOString(),
        exportType: 'prospectos_only',
        filters: {
          incluirArchivados: incluirArchivados === 'true',
          incluirPapelera: incluirPapelera === 'true'
        },
        exportedBy: req.usuario._id,
        exportedByName: `${req.usuario.nombre} ${req.usuario.apellido}`,
        totalRecords: prospectos.length
      },
      data: {
        prospectos
      }
    };

    console.log(`Exportados ${prospectos.length} prospectos`);

    const fileName = `prospectos_backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json(backupData);

  } catch (error) {
    console.error('Error en exportación de prospectos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Exportar en formato Excel para análisis
router.get('/export/excel', auth, verificarPermiso('prospectos', 'leer'), async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    
    console.log('Iniciando exportación Excel...');
    
    // Obtener prospectos
    let filtros = { activo: true, enPapelera: { $ne: true } };
    
    if (req.usuario.rol !== 'admin' && req.usuario.rol !== 'gerente') {
      filtros.vendedorAsignado = req.usuario._id;
    }

    const prospectos = await Prospecto.find(filtros)
      .populate('vendedorAsignado', 'nombre apellido')
      .lean();

    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    
    // Hoja 1: Prospectos principales
    const worksheetMain = workbook.addWorksheet('Prospectos');
    
    // Headers principales
    worksheetMain.columns = [
      { header: 'ID', key: 'id', width: 25 },
      { header: 'Nombre', key: 'nombre', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Producto', key: 'producto', width: 25 },
      { header: 'Etapa', key: 'etapa', width: 15 },
      { header: 'Prioridad', key: 'prioridad', width: 12 },
      { header: 'Fuente', key: 'fuente', width: 15 },
      { header: 'Vendedor', key: 'vendedor', width: 25 },
      { header: 'Ciudad', key: 'ciudad', width: 20 },
      { header: 'Fecha Creación', key: 'fechaCreacion', width: 18 },
      { header: 'Último Contacto', key: 'ultimoContacto', width: 18 },
      { header: 'Archivado', key: 'archivado', width: 10 },
      { header: 'Observaciones', key: 'observaciones', width: 50 }
    ];

    // Agregar datos
    prospectos.forEach(prospecto => {
      worksheetMain.addRow({
        id: prospecto._id.toString(),
        nombre: prospecto.nombre,
        telefono: prospecto.telefono,
        email: prospecto.email || '',
        producto: prospecto.producto,
        etapa: prospecto.etapa,
        prioridad: prospecto.prioridad,
        fuente: prospecto.fuente,
        vendedor: prospecto.vendedorAsignado ? 
          `${prospecto.vendedorAsignado.nombre} ${prospecto.vendedorAsignado.apellido}` : '',
        ciudad: prospecto.direccion?.ciudad || '',
        fechaCreacion: prospecto.createdAt,
        ultimoContacto: prospecto.fechaUltimoContacto || '',
        archivado: prospecto.archivado ? 'Sí' : 'No',
        observaciones: prospecto.descripcionNecesidad || ''
      });
    });

    // Hoja 2: Estadísticas
    const worksheetStats = workbook.addWorksheet('Estadísticas');
    
    // Calcular estadísticas
    const stats = {
      total: prospectos.length,
      porEtapa: {},
      porFuente: {},
      porVendedor: {},
      archivados: prospectos.filter(p => p.archivado).length
    };

    prospectos.forEach(p => {
      stats.porEtapa[p.etapa] = (stats.porEtapa[p.etapa] || 0) + 1;
      stats.porFuente[p.fuente] = (stats.porFuente[p.fuente] || 0) + 1;
      
      const vendedor = p.vendedorAsignado ? 
        `${p.vendedorAsignado.nombre} ${p.vendedorAsignado.apellido}` : 'Sin asignar';
      stats.porVendedor[vendedor] = (stats.porVendedor[vendedor] || 0) + 1;
    });

    // Agregar estadísticas
    worksheetStats.addRow(['ESTADÍSTICAS GENERALES']);
    worksheetStats.addRow(['Total Prospectos', stats.total]);
    worksheetStats.addRow(['Archivados', stats.archivados]);
    worksheetStats.addRow([]);
    
    worksheetStats.addRow(['POR ETAPA']);
    Object.entries(stats.porEtapa).forEach(([etapa, count]) => {
      worksheetStats.addRow([etapa, count]);
    });
    
    worksheetStats.addRow([]);
    worksheetStats.addRow(['POR FUENTE']);
    Object.entries(stats.porFuente).forEach(([fuente, count]) => {
      worksheetStats.addRow([fuente, count]);
    });

    // Configurar respuesta
    const fileName = `sundeck_prospectos_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error en exportación Excel:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Importar datos (para restauración)
router.post('/import', auth, verificarPermiso('admin', 'crear'), async (req, res) => {
  try {
    const { backupData, options = {} } = req.body;
    
    if (!backupData || !backupData.data) {
      return res.status(400).json({ message: 'Datos de backup inválidos' });
    }

    console.log('Iniciando importación de datos...');
    
    const results = {
      imported: {},
      errors: [],
      skipped: {}
    };

    // Importar prospectos
    if (backupData.data.prospectos && options.importProspectos !== false) {
      try {
        const prospectos = backupData.data.prospectos;
        let importedCount = 0;
        let skippedCount = 0;

        for (const prospectoData of prospectos) {
          try {
            // Verificar si ya existe (por teléfono)
            const existente = await Prospecto.findOne({ telefono: prospectoData.telefono });
            
            if (existente && !options.overwriteExisting) {
              skippedCount++;
              continue;
            }

            if (existente && options.overwriteExisting) {
              await Prospecto.findByIdAndUpdate(existente._id, prospectoData);
            } else {
              // Crear nuevo
              delete prospectoData._id; // Dejar que MongoDB genere nuevo ID
              await Prospecto.create(prospectoData);
            }
            
            importedCount++;
          } catch (error) {
            results.errors.push(`Error importando prospecto ${prospectoData.nombre}: ${error.message}`);
          }
        }

        results.imported.prospectos = importedCount;
        results.skipped.prospectos = skippedCount;
      } catch (error) {
        results.errors.push(`Error general importando prospectos: ${error.message}`);
      }
    }

    // Importar plantillas WhatsApp
    if (backupData.data.plantillasWhatsApp && options.importPlantillas !== false) {
      try {
        const plantillas = backupData.data.plantillasWhatsApp;
        let importedCount = 0;

        for (const plantillaData of plantillas) {
          try {
            delete plantillaData._id;
            await PlantillaWhatsApp.create(plantillaData);
            importedCount++;
          } catch (error) {
            results.errors.push(`Error importando plantilla ${plantillaData.nombre}: ${error.message}`);
          }
        }

        results.imported.plantillasWhatsApp = importedCount;
      } catch (error) {
        results.errors.push(`Error general importando plantillas: ${error.message}`);
      }
    }

    console.log('Importación completada:', results);

    res.json({
      message: 'Importación completada',
      results,
      importedBy: req.usuario._id,
      importDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en importación:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

// Obtener información del sistema para backup
router.get('/system-info', auth, verificarPermiso('admin', 'leer'), async (req, res) => {
  try {
    const [
      totalProspectos,
      prospectosActivos,
      prospectosArchivados,
      prospectosPapelera,
      totalUsuarios,
      totalPlantillas
    ] = await Promise.all([
      Prospecto.countDocuments({}),
      Prospecto.countDocuments({ activo: true, archivado: { $ne: true }, enPapelera: { $ne: true } }),
      Prospecto.countDocuments({ archivado: true }),
      Prospecto.countDocuments({ enPapelera: true }),
      Usuario.countDocuments({}),
      PlantillaWhatsApp.countDocuments({})
    ]);

    const systemInfo = {
      database: {
        prospectos: {
          total: totalProspectos,
          activos: prospectosActivos,
          archivados: prospectosArchivados,
          enPapelera: prospectosPapelera
        },
        usuarios: totalUsuarios,
        plantillasWhatsApp: totalPlantillas
      },
      server: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      },
      lastBackupCheck: new Date().toISOString()
    };

    res.json(systemInfo);

  } catch (error) {
    console.error('Error obteniendo información del sistema:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
});

module.exports = router;
