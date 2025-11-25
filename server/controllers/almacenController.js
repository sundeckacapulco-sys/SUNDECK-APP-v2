const Almacen = require('../models/Almacen');
const MovimientoAlmacen = require('../models/MovimientoAlmacen');
const SobranteMaterial = require('../models/SobranteMaterial');
const CalculadoraMaterialesService = require('../services/calculadoraMaterialesService');
const logger = require('../config/logger');

// ...

// Simular consumo (Prueba Rápida)
exports.simularConsumo = async (req, res) => {
  try {
    const datosPieza = req.body;
    
    const resultado = await CalculadoraMaterialesService.simularConsumo(datosPieza);
    
    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    logger.error('Error simulando consumo', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error simulando consumo',
      error: error.message
    });
  }
};

// Obtener todos los materiales del inventario
exports.obtenerInventario = async (req, res) => {
  try {
    const { tipo, bajoStock, sinStock, busqueda } = req.query;
    
    let query = { activo: true };
    
    // Filtros
    if (tipo) query.tipo = tipo;
    if (bajoStock === 'true') {
      query.$expr = { $lte: ['$cantidad', '$puntoReorden'] };
    }
    if (sinStock === 'true') {
      query.cantidad = 0;
    }
    if (busqueda) {
      query.$or = [
        { codigo: new RegExp(busqueda, 'i') },
        { descripcion: new RegExp(busqueda, 'i') }
      ];
    }
    
    const materiales = await Almacen.find(query)
      .sort({ tipo: 1, descripcion: 1 });
    
    logger.info('Inventario consultado', {
      controller: 'almacenController',
      totalMateriales: materiales.length,
      filtros: { tipo, bajoStock, sinStock }
    });
    
    res.json({
      success: true,
      data: materiales,
      total: materiales.length
    });
    
  } catch (error) {
    logger.error('Error obteniendo inventario', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo inventario',
      error: error.message
    });
  }
};

// Obtener sobrantes
exports.obtenerSobrantes = async (req, res) => {
  try {
    const { tipo, estado } = req.query;
    
    let query = {};
    if (tipo) query.tipo = tipo;
    query.estado = estado || 'disponible';

    const sobrantes = await SobranteMaterial.find(query)
      .sort({ longitud: 1 }); // Menor a mayor longitud (para optimizar uso)
    
    res.json({
      success: true,
      data: sobrantes,
      total: sobrantes.length
    });
    
  } catch (error) {
    logger.error('Error obteniendo sobrantes', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo sobrantes',
      error: error.message
    });
  }
};

// Obtener material por ID
exports.obtenerMaterialPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const material = await Almacen.findById(id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: material
    });
    
  } catch (error) {
    logger.error('Error obteniendo material', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo material',
      error: error.message
    });
  }
};

// Obtener material por código
exports.obtenerMaterialPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const material = await Almacen.buscarPorCodigo(codigo);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: material
    });
    
  } catch (error) {
    logger.error('Error obteniendo material por código', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo material',
      error: error.message
    });
  }
};

// Crear nuevo material en inventario
exports.crearMaterial = async (req, res) => {
  try {
    const materialData = req.body;
    materialData.creadoPor = req.user?._id;
    
    const material = new Almacen(materialData);
    await material.save();
    
    logger.info('Material creado en inventario', {
      controller: 'almacenController',
      materialId: material._id,
      codigo: material.codigo
    });
    
    res.status(201).json({
      success: true,
      message: 'Material creado exitosamente',
      data: material
    });
    
  } catch (error) {
    logger.error('Error creando material', {
      controller: 'almacenController',
      error: error.message
    });

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El código del material ya existe',
        error: 'DuplicateKey'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creando material',
      error: error.message
    });
  }
};

// Actualizar material
exports.actualizarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.actualizadoPor = req.user?._id;
    
    const material = await Almacen.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    logger.info('Material actualizado', {
      controller: 'almacenController',
      materialId: material._id,
      codigo: material.codigo
    });
    
    res.json({
      success: true,
      message: 'Material actualizado exitosamente',
      data: material
    });
    
  } catch (error) {
    logger.error('Error actualizando material', {
      controller: 'almacenController',
      error: error.message
    });

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El código del material ya existe',
        error: 'DuplicateKey'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error actualizando material',
      error: error.message
    });
  }
};

// Eliminar material (soft delete)
exports.eliminarMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    
    const material = await Almacen.findByIdAndUpdate(
      id,
      { activo: false, actualizadoPor: req.user?._id },
      { new: true }
    );
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    logger.info('Material eliminado', {
      controller: 'almacenController',
      materialId: material._id,
      codigo: material.codigo
    });
    
    res.json({
      success: true,
      message: 'Material eliminado exitosamente'
    });
    
  } catch (error) {
    logger.error('Error eliminando material', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error eliminando material',
      error: error.message
    });
  }
};

// Registrar entrada de material
exports.registrarEntrada = async (req, res) => {
  try {
    const { materialId, cantidad, motivo, descripcion, costo, proveedor, referencias } = req.body;
    
    const movimiento = await MovimientoAlmacen.registrarEntrada({
      materialId,
      cantidad,
      motivo: motivo || 'compra',
      descripcion,
      usuarioId: req.user?._id,
      costo,
      proveedor,
      referencias
    });
    
    logger.info('Entrada registrada', {
      controller: 'almacenController',
      movimientoId: movimiento._id,
      materialId,
      cantidad
    });
    
    res.status(201).json({
      success: true,
      message: 'Entrada registrada exitosamente',
      data: movimiento
    });
    
  } catch (error) {
    logger.error('Error registrando entrada', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error registrando entrada',
      error: error.message
    });
  }
};

// Registrar salida de material
exports.registrarSalida = async (req, res) => {
  try {
    const { materialId, cantidad, motivo, descripcion, referencias } = req.body;
    
    const movimiento = await MovimientoAlmacen.registrarSalida({
      materialId,
      cantidad,
      motivo: motivo || 'produccion',
      descripcion,
      usuarioId: req.user?._id,
      referencias
    });
    
    logger.info('Salida registrada', {
      controller: 'almacenController',
      movimientoId: movimiento._id,
      materialId,
      cantidad
    });
    
    res.status(201).json({
      success: true,
      message: 'Salida registrada exitosamente',
      data: movimiento
    });
    
  } catch (error) {
    logger.error('Error registrando salida', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// Ajustar inventario
exports.ajustarInventario = async (req, res) => {
  try {
    const { materialId, nuevaCantidad, motivo, descripcion } = req.body;
    
    const movimiento = await MovimientoAlmacen.registrarAjuste({
      materialId,
      nuevaCantidad,
      motivo: motivo || 'ajuste_inventario',
      descripcion,
      usuarioId: req.user?._id
    });
    
    logger.info('Ajuste de inventario registrado', {
      controller: 'almacenController',
      movimientoId: movimiento._id,
      materialId,
      nuevaCantidad
    });
    
    res.status(201).json({
      success: true,
      message: 'Ajuste registrado exitosamente',
      data: movimiento
    });
    
  } catch (error) {
    logger.error('Error ajustando inventario', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error ajustando inventario',
      error: error.message
    });
  }
};

// Reservar stock
exports.reservarStock = async (req, res) => {
  try {
    const { materialId, cantidad } = req.body;
    
    const material = await Almacen.findById(materialId);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    await material.reservarStock(cantidad);
    
    logger.info('Stock reservado', {
      controller: 'almacenController',
      materialId,
      cantidad,
      reservadoTotal: material.reservado
    });
    
    res.json({
      success: true,
      message: 'Stock reservado exitosamente',
      data: material
    });
    
  } catch (error) {
    logger.error('Error reservando stock', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// Liberar reserva
exports.liberarReserva = async (req, res) => {
  try {
    const { materialId, cantidad } = req.body;
    
    const material = await Almacen.findById(materialId);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material no encontrado'
      });
    }
    
    await material.liberarReserva(cantidad);
    
    logger.info('Reserva liberada', {
      controller: 'almacenController',
      materialId,
      cantidad,
      reservadoTotal: material.reservado
    });
    
    res.json({
      success: true,
      message: 'Reserva liberada exitosamente',
      data: material
    });
    
  } catch (error) {
    logger.error('Error liberando reserva', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error liberando reserva',
      error: error.message
    });
  }
};

// Obtener historial de movimientos
exports.obtenerHistorial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { limite = 50 } = req.query;
    
    const movimientos = await MovimientoAlmacen.obtenerHistorial(materialId, parseInt(limite));
    
    res.json({
      success: true,
      data: movimientos,
      total: movimientos.length
    });
    
  } catch (error) {
    logger.error('Error obteniendo historial', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial',
      error: error.message
    });
  }
};

// Reporte de movimientos
exports.reporteMovimientos = async (req, res) => {
  try {
    const filtros = req.query;
    
    const movimientos = await MovimientoAlmacen.reporteMovimientos(filtros);
    
    res.json({
      success: true,
      data: movimientos,
      total: movimientos.length
    });
    
  } catch (error) {
    logger.error('Error generando reporte', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error generando reporte',
      error: error.message
    });
  }
};

// Materiales bajo stock
exports.materialesBajoStock = async (req, res) => {
  try {
    const materiales = await Almacen.materialesBajoStock();
    
    res.json({
      success: true,
      data: materiales,
      total: materiales.length
    });
    
  } catch (error) {
    logger.error('Error obteniendo materiales bajo stock', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error obteniendo materiales bajo stock',
      error: error.message
    });
  }
};

// Valor total del inventario
exports.valorInventario = async (req, res) => {
  try {
    const valorTotal = await Almacen.valorTotalInventario();
    
    res.json({
      success: true,
      data: {
        valorTotal,
        moneda: 'MXN'
      }
    });
    
  } catch (error) {
    logger.error('Error calculando valor de inventario', {
      controller: 'almacenController',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error calculando valor de inventario',
      error: error.message
    });
  }
};
