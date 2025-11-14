const Almacen = require('../models/Almacen');
const MovimientoAlmacen = require('../models/MovimientoAlmacen');
const SobranteMaterial = require('../models/SobranteMaterial');
const OptimizadorCortesService = require('./optimizadorCortesService');
const logger = require('../config/logger');

/**
 * Servicio de integración entre Almacén y Producción
 * Gestiona el flujo completo desde consulta de stock hasta registro de sobrantes
 */
class AlmacenProduccionService {
  
  /**
   * Verificar disponibilidad de materiales para una orden de producción
   * @param {Array} materialesNecesarios - Lista de materiales con cantidad
   * @returns {Promise<object>} Resultado de disponibilidad
   */
  static async verificarDisponibilidad(materialesNecesarios) {
    const resultado = {
      disponible: true,
      materiales: [],
      faltantes: [],
      advertencias: []
    };
    
    try {
      for (const item of materialesNecesarios) {
        const { codigo, cantidad, tipo } = item;
        
        // Buscar material en almacén
        const material = await Almacen.buscarPorCodigo(codigo);
        
        if (!material) {
          resultado.disponible = false;
          resultado.faltantes.push({
            codigo,
            tipo,
            cantidad,
            motivo: 'Material no existe en almacén'
          });
          continue;
        }
        
        const disponible = material.cantidad - material.reservado;
        
        if (disponible < cantidad) {
          resultado.disponible = false;
          resultado.faltantes.push({
            codigo,
            tipo,
            descripcion: material.descripcion,
            necesario: cantidad,
            disponible,
            faltante: cantidad - disponible
          });
        } else {
          resultado.materiales.push({
            materialId: material._id,
            codigo,
            descripcion: material.descripcion,
            cantidad,
            disponible,
            suficiente: true
          });
          
          // Advertencia si está cerca del punto de reorden
          if (disponible - cantidad <= material.puntoReorden) {
            resultado.advertencias.push({
              codigo,
              mensaje: `Stock quedará bajo punto de reorden (${material.puntoReorden})`
            });
          }
        }
      }
      
      logger.info('Disponibilidad verificada', {
        servicio: 'almacenProduccionService',
        disponible: resultado.disponible,
        totalMateriales: materialesNecesarios.length,
        faltantes: resultado.faltantes.length
      });
      
      return resultado;
      
    } catch (error) {
      logger.error('Error verificando disponibilidad', {
        servicio: 'almacenProduccionService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Reservar materiales para una orden de producción
   * @param {string} proyectoId - ID del proyecto
   * @param {string} ordenProduccion - Número de orden
   * @param {Array} materiales - Lista de materiales a reservar
   * @returns {Promise<Array>} Materiales reservados
   */
  static async reservarMateriales(proyectoId, ordenProduccion, materiales) {
    const reservas = [];
    
    try {
      for (const item of materiales) {
        const { materialId, cantidad } = item;
        
        const material = await Almacen.findById(materialId);
        
        if (!material) {
          throw new Error(`Material ${materialId} no encontrado`);
        }
        
        await material.reservarStock(cantidad);
        
        reservas.push({
          materialId: material._id,
          codigo: material.codigo,
          descripcion: material.descripcion,
          cantidad,
          reservado: material.reservado
        });
        
        logger.info('Material reservado', {
          servicio: 'almacenProduccionService',
          proyectoId,
          ordenProduccion,
          materialId: material._id,
          codigo: material.codigo,
          cantidad
        });
      }
      
      return reservas;
      
    } catch (error) {
      // Rollback: liberar reservas ya hechas
      for (const reserva of reservas) {
        try {
          const material = await Almacen.findById(reserva.materialId);
          await material.liberarReserva(reserva.cantidad);
        } catch (rollbackError) {
          logger.error('Error en rollback de reserva', {
            servicio: 'almacenProduccionService',
            materialId: reserva.materialId,
            error: rollbackError.message
          });
        }
      }
      
      logger.error('Error reservando materiales', {
        servicio: 'almacenProduccionService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Registrar salida de materiales por producción
   * @param {string} proyectoId - ID del proyecto
   * @param {string} ordenProduccion - Número de orden
   * @param {Array} materiales - Lista de materiales usados
   * @param {string} usuarioId - ID del usuario
   * @returns {Promise<Array>} Movimientos registrados
   */
  static async registrarSalidaProduccion(proyectoId, ordenProduccion, materiales, usuarioId) {
    const movimientos = [];
    
    try {
      for (const item of materiales) {
        const { materialId, cantidad, observaciones } = item;
        
        const movimiento = await MovimientoAlmacen.registrarSalida({
          materialId,
          cantidad,
          motivo: 'produccion',
          descripcion: `Usado en Orden de Producción ${ordenProduccion}`,
          usuarioId,
          referencias: {
            proyecto: proyectoId,
            ordenProduccion
          }
        });
        
        movimientos.push(movimiento);
        
        logger.info('Salida registrada', {
          servicio: 'almacenProduccionService',
          proyectoId,
          ordenProduccion,
          movimientoId: movimiento._id,
          cantidad
        });
      }
      
      return movimientos;
      
    } catch (error) {
      logger.error('Error registrando salidas', {
        servicio: 'almacenProduccionService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Liberar reservas de materiales
   * @param {Array} materiales - Lista de materiales a liberar
   * @returns {Promise<void>}
   */
  static async liberarReservas(materiales) {
    try {
      for (const item of materiales) {
        const { materialId, cantidad } = item;
        
        const material = await Almacen.findById(materialId);
        
        if (material) {
          await material.liberarReserva(cantidad);
          
          logger.info('Reserva liberada', {
            servicio: 'almacenProduccionService',
            materialId: material._id,
            codigo: material.codigo,
            cantidad
          });
        }
      }
    } catch (error) {
      logger.error('Error liberando reservas', {
        servicio: 'almacenProduccionService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Proceso completo de producción con almacén
   * @param {object} datos - Datos de la orden de producción
   * @returns {Promise<object>} Resultado del proceso
   */
  static async procesarOrdenProduccion(datos) {
    const {
      proyectoId,
      ordenProduccion,
      piezas,
      usuarioId
    } = datos;
    
    const resultado = {
      success: false,
      etapas: {
        verificacion: null,
        reserva: null,
        optimizacion: null,
        salidas: null,
        sobrantes: null
      },
      materiales: [],
      sobrantes: [],
      errores: []
    };
    
    try {
      // ETAPA 1: Calcular materiales necesarios
      logger.info('Iniciando proceso de producción', {
        servicio: 'almacenProduccionService',
        proyectoId,
        ordenProduccion,
        totalPiezas: piezas.length
      });
      
      const materialesNecesarios = await this.calcularMaterialesNecesarios(piezas);
      
      // ETAPA 2: Verificar disponibilidad
      const verificacion = await this.verificarDisponibilidad(materialesNecesarios);
      resultado.etapas.verificacion = verificacion;
      
      if (!verificacion.disponible) {
        resultado.errores.push('Stock insuficiente');
        resultado.etapas.verificacion.faltantes = verificacion.faltantes;
        return resultado;
      }
      
      // ETAPA 3: Reservar materiales
      const reservas = await this.reservarMateriales(
        proyectoId,
        ordenProduccion,
        verificacion.materiales
      );
      resultado.etapas.reserva = { reservas, total: reservas.length };
      
      // ETAPA 4: Optimizar cortes (con sobrantes)
      const optimizacion = await this.optimizarCortesConAlmacen(piezas);
      resultado.etapas.optimizacion = optimizacion;
      
      // ETAPA 5: Registrar salidas
      const salidas = await this.registrarSalidaProduccion(
        proyectoId,
        ordenProduccion,
        materialesNecesarios,
        usuarioId
      );
      resultado.etapas.salidas = { movimientos: salidas, total: salidas.length };
      
      // ETAPA 6: Registrar sobrantes
      const sobrantes = await this.registrarSobrantesProduccion(
        optimizacion,
        proyectoId,
        ordenProduccion
      );
      resultado.etapas.sobrantes = { sobrantes, total: sobrantes.length };
      resultado.sobrantes = sobrantes;
      
      // ETAPA 7: Liberar reservas
      await this.liberarReservas(verificacion.materiales);
      
      resultado.success = true;
      resultado.materiales = materialesNecesarios;
      
      logger.info('Proceso de producción completado', {
        servicio: 'almacenProduccionService',
        proyectoId,
        ordenProduccion,
        materialesUsados: materialesNecesarios.length,
        sobrantesGenerados: sobrantes.length
      });
      
      return resultado;
      
    } catch (error) {
      logger.error('Error en proceso de producción', {
        servicio: 'almacenProduccionService',
        proyectoId,
        ordenProduccion,
        error: error.message,
        stack: error.stack
      });
      
      // Intentar liberar reservas en caso de error
      if (resultado.etapas.reserva?.reservas) {
        await this.liberarReservas(resultado.etapas.reserva.reservas);
      }
      
      throw error;
    }
  }
  
  /**
   * Calcular materiales necesarios desde las piezas
   * @param {Array} piezas - Piezas del proyecto
   * @returns {Promise<Array>} Materiales necesarios
   */
  static async calcularMaterialesNecesarios(piezas) {
    const materialesAgrupados = {};
    
    for (const pieza of piezas) {
      const materiales = await OptimizadorCortesService.calcularMaterialesPieza(pieza);
      
      materiales.forEach(material => {
        const key = material.codigo || material.descripcion;
        
        if (!materialesAgrupados[key]) {
          materialesAgrupados[key] = {
            codigo: material.codigo,
            tipo: material.tipo,
            descripcion: material.descripcion,
            cantidad: 0,
            unidad: material.unidad
          };
        }
        
        materialesAgrupados[key].cantidad += Number(material.cantidad);
      });
    }
    
    return Object.values(materialesAgrupados);
  }
  
  /**
   * Optimizar cortes usando almacén (sobrantes + material nuevo)
   * @param {Array} piezas - Piezas a producir
   * @returns {Promise<object>} Plan de optimización
   */
  static async optimizarCortesConAlmacen(piezas) {
    const optimizacionPorTipo = {};
    
    // Agrupar piezas por tipo de material
    const piezasPorTipo = {};
    
    for (const pieza of piezas) {
      const tubo = OptimizadorCortesService.seleccionarTubo(
        { ancho: pieza.ancho },
        { ancho: pieza.ancho, esManual: !pieza.motorizado }
      );
      
      if (!piezasPorTipo[tubo.codigo]) {
        piezasPorTipo[tubo.codigo] = {
          tubo,
          cortes: []
        };
      }
      
      piezasPorTipo[tubo.codigo].cortes.push(pieza.ancho);
    }
    
    // Optimizar cada tipo
    for (const [codigo, data] of Object.entries(piezasPorTipo)) {
      optimizacionPorTipo[codigo] = await OptimizadorCortesService.optimizarCortesConSobrantes(
        data.cortes,
        'Tubo',
        codigo
      );
    }
    
    return optimizacionPorTipo;
  }
  
  /**
   * Registrar sobrantes generados en producción
   * @param {object} optimizacion - Plan de optimización
   * @param {string} proyectoId - ID del proyecto
   * @param {string} ordenProduccion - Número de orden
   * @returns {Promise<Array>} Sobrantes registrados
   */
  static async registrarSobrantesProduccion(optimizacion, proyectoId, ordenProduccion) {
    const sobrantesRegistrados = [];
    
    for (const [codigo, plan] of Object.entries(optimizacion)) {
      const sobrantes = await OptimizadorCortesService.registrarSobrantes(
        plan,
        'Tubo',
        codigo,
        proyectoId,
        ordenProduccion
      );
      
      sobrantesRegistrados.push(...sobrantes);
    }
    
    return sobrantesRegistrados;
  }
  
  /**
   * FUTURO: Sincronizar con catálogo de productos
   * @param {string} productoId - ID del producto en catálogo
   * @param {Array} materiales - Materiales usados
   * @returns {Promise<void>}
   */
  static async sincronizarConCatalogo(productoId, materiales) {
    // TODO: Implementar cuando se tenga el módulo de catálogo
    logger.info('Sincronización con catálogo pendiente', {
      servicio: 'almacenProduccionService',
      productoId,
      materiales: materiales.length
    });
    
    // Aquí se actualizará el costo real del producto
    // basado en los materiales usados
  }
}

module.exports = AlmacenProduccionService;
