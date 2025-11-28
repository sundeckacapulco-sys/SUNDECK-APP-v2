/**
 * Servicio para gestión de sobrantes de materiales
 * 
 * Reglas de negocio:
 * - Solo se almacenan: Tubos, Contrapesos (plano y redondo)
 * - Longitud máxima para almacenar: 60cm (0.60m)
 * - Cuando hay 10+ sobrantes del mismo tipo, avisar para decidir si desechar
 * - Telas básicas también se pueden almacenar como sobrantes
 */

const SobranteMaterial = require('../models/SobranteMaterial');
const Almacen = require('../models/Almacen');
const logger = require('../config/logger');

// Configuración de reglas de sobrantes
const REGLAS_SOBRANTES = {
  // Tipos de materiales que se pueden almacenar como sobrantes
  tiposPermitidos: ['Tubo', 'Contrapeso', 'Tela'],
  
  // Longitud mínima útil (en metros) - menos de esto se desecha
  // 60cm es el mínimo útil para reutilizar
  longitudMinima: 0.60,
  
  // Sin longitud máxima - los rollos pueden llegar de diferentes tamaños
  // El encargado de taller registra lo que llega al almacén
  longitudMaxima: null,
  
  // Cantidad máxima antes de avisar para revisión
  cantidadMaximaAnteAviso: 10,
  
  // Subtipos de contrapeso permitidos
  subtiposContrapeso: ['plano', 'redondo']
};

class SobrantesService {
  
  /**
   * Registra un sobrante después de un corte de producción
   * @param {object} datos - Datos del sobrante
   * @returns {object} Resultado del registro
   */
  static async registrarSobrante(datos) {
    const { tipo, codigo, descripcion, longitud, diametro, color, subtipo, proyectoId, ordenProduccion, usuarioId } = datos;
    
    try {
      // Validar tipo permitido
      if (!REGLAS_SOBRANTES.tiposPermitidos.includes(tipo)) {
        logger.info('Sobrante no almacenable - tipo no permitido', {
          servicio: 'sobrantesService',
          tipo,
          tiposPermitidos: REGLAS_SOBRANTES.tiposPermitidos
        });
        return { 
          almacenado: false, 
          razon: `Tipo "${tipo}" no se almacena como sobrante`,
          accion: 'desechar'
        };
      }
      
      // Validar subtipo de contrapeso
      if (tipo === 'Contrapeso' && subtipo && !REGLAS_SOBRANTES.subtiposContrapeso.includes(subtipo.toLowerCase())) {
        return {
          almacenado: false,
          razon: `Subtipo de contrapeso "${subtipo}" no permitido`,
          accion: 'desechar'
        };
      }
      
      // Validar longitud mínima (60cm)
      if (longitud < REGLAS_SOBRANTES.longitudMinima) {
        logger.info('Sobrante muy pequeño - desechar', {
          servicio: 'sobrantesService',
          tipo,
          longitud,
          minimoRequerido: REGLAS_SOBRANTES.longitudMinima
        });
        return {
          almacenado: false,
          razon: `Longitud ${(longitud * 100).toFixed(0)}cm menor al mínimo útil (${(REGLAS_SOBRANTES.longitudMinima * 100).toFixed(0)}cm)`,
          accion: 'desechar'
        };
      }
      
      // No hay límite máximo - el encargado de taller registra lo que llega
      // Los rollos pueden venir de diferentes tamaños (no siempre 30ml)
      
      // Verificar cantidad actual de sobrantes similares
      const filtroSimilar = { tipo, estado: 'disponible' };
      if (diametro) filtroSimilar.diametro = diametro;
      if (subtipo) filtroSimilar['metadata.subtipo'] = subtipo;
      
      const cantidadActual = await SobranteMaterial.countDocuments(filtroSimilar);
      
      let alerta = null;
      if (cantidadActual >= REGLAS_SOBRANTES.cantidadMaximaAnteAviso) {
        alerta = {
          tipo: 'revision_requerida',
          mensaje: `Ya hay ${cantidadActual} sobrantes de ${tipo}${diametro ? ` ${diametro}` : ''}. Revisar si desechar algunos.`,
          cantidadActual,
          limite: REGLAS_SOBRANTES.cantidadMaximaAnteAviso
        };
        
        logger.warn('Alerta: Muchos sobrantes acumulados', {
          servicio: 'sobrantesService',
          tipo,
          diametro,
          cantidadActual,
          limite: REGLAS_SOBRANTES.cantidadMaximaAnteAviso
        });
      }
      
      // Generar etiqueta única
      const etiqueta = SobranteMaterial.generarEtiqueta(tipo, codigo);
      
      // Crear el sobrante
      const sobrante = new SobranteMaterial({
        tipo,
        codigo: codigo || this.generarCodigoSobrante(tipo, diametro, subtipo),
        descripcion: descripcion || this.generarDescripcion(tipo, longitud, diametro, subtipo),
        longitud,
        unidad: 'ml',
        diametro,
        color,
        estado: 'disponible',
        etiqueta,
        origenProyecto: proyectoId,
        origenOrdenProduccion: ordenProduccion,
        creadoPor: usuarioId,
        condicion: 'excelente',
        observaciones: subtipo ? `Subtipo: ${subtipo}` : null
      });
      
      await sobrante.save();
      
      logger.info('Sobrante registrado exitosamente', {
        servicio: 'sobrantesService',
        sobranteId: sobrante._id,
        tipo,
        longitud,
        etiqueta
      });
      
      return {
        almacenado: true,
        sobrante: sobrante.toObject(),
        etiqueta,
        alerta
      };
      
    } catch (error) {
      logger.error('Error registrando sobrante', {
        servicio: 'sobrantesService',
        error: error.message,
        datos
      });
      throw error;
    }
  }
  
  /**
   * Registra múltiples sobrantes de una orden de producción
   * @param {Array} sobrantes - Array de datos de sobrantes
   * @param {string} proyectoId - ID del proyecto origen
   * @param {string} ordenProduccion - Número de orden
   * @param {string} usuarioId - ID del usuario
   * @returns {object} Resumen del registro
   */
  static async registrarSobrantesOrden(sobrantes, proyectoId, ordenProduccion, usuarioId) {
    const resultados = {
      almacenados: [],
      desechados: [],
      paraInventario: [],
      alertas: []
    };
    
    for (const sobrante of sobrantes) {
      const resultado = await this.registrarSobrante({
        ...sobrante,
        proyectoId,
        ordenProduccion,
        usuarioId
      });
      
      if (resultado.almacenado) {
        resultados.almacenados.push(resultado.sobrante);
        if (resultado.alerta) {
          resultados.alertas.push(resultado.alerta);
        }
      } else if (resultado.accion === 'agregar_inventario') {
        resultados.paraInventario.push({ ...sobrante, razon: resultado.razon });
      } else {
        resultados.desechados.push({ ...sobrante, razon: resultado.razon });
      }
    }
    
    logger.info('Sobrantes de orden procesados', {
      servicio: 'sobrantesService',
      ordenProduccion,
      almacenados: resultados.almacenados.length,
      desechados: resultados.desechados.length,
      paraInventario: resultados.paraInventario.length,
      alertas: resultados.alertas.length
    });
    
    return resultados;
  }
  
  /**
   * Busca sobrantes disponibles para reutilizar
   * @param {string} tipo - Tipo de material
   * @param {number} longitudNecesaria - Longitud mínima requerida
   * @param {object} filtros - Filtros adicionales (diametro, color, etc.)
   * @returns {Array} Sobrantes disponibles ordenados por mejor ajuste
   */
  static async buscarSobrantesDisponibles(tipo, longitudNecesaria, filtros = {}) {
    const query = {
      tipo,
      estado: 'disponible',
      longitud: { $gte: longitudNecesaria }
    };
    
    if (filtros.diametro) query.diametro = filtros.diametro;
    if (filtros.color) query.color = filtros.color;
    if (filtros.codigo) query.codigo = filtros.codigo;
    
    const sobrantes = await SobranteMaterial.find(query)
      .sort({ longitud: 1 }) // Primero los más pequeños que cumplan
      .lean();
    
    // Calcular desperdicio potencial para cada sobrante
    return sobrantes.map(s => ({
      ...s,
      desperdicioSiSeUsa: Number((s.longitud - longitudNecesaria).toFixed(3)),
      eficiencia: Number(((longitudNecesaria / s.longitud) * 100).toFixed(1))
    }));
  }
  
  /**
   * Usa un sobrante para una pieza
   * @param {string} sobranteId - ID del sobrante
   * @param {number} longitudUsada - Longitud que se usará
   * @param {string} proyectoId - Proyecto donde se usa
   * @param {string} usuarioId - Usuario que realiza la operación
   * @returns {object} Resultado de la operación
   */
  static async usarSobrante(sobranteId, longitudUsada, proyectoId, usuarioId) {
    const sobrante = await SobranteMaterial.findById(sobranteId);
    
    if (!sobrante) {
      throw new Error('Sobrante no encontrado');
    }
    
    if (sobrante.estado !== 'disponible') {
      throw new Error(`Sobrante no disponible. Estado actual: ${sobrante.estado}`);
    }
    
    if (sobrante.longitud < longitudUsada) {
      throw new Error(`Longitud insuficiente. Disponible: ${sobrante.longitud}m, Requerido: ${longitudUsada}m`);
    }
    
    const sobranteRestante = sobrante.longitud - longitudUsada;
    
    // Marcar como usado
    await sobrante.marcarComoUsado(proyectoId, `Usado ${longitudUsada}m`);
    
    // Si queda sobrante útil, crear nuevo registro
    let nuevoSobrante = null;
    if (sobranteRestante >= REGLAS_SOBRANTES.longitudMinima) {
      const resultadoNuevo = await this.registrarSobrante({
        tipo: sobrante.tipo,
        codigo: sobrante.codigo,
        descripcion: sobrante.descripcion,
        longitud: sobranteRestante,
        diametro: sobrante.diametro,
        color: sobrante.color,
        proyectoId,
        usuarioId
      });
      
      if (resultadoNuevo.almacenado) {
        nuevoSobrante = resultadoNuevo.sobrante;
      }
    }
    
    logger.info('Sobrante utilizado', {
      servicio: 'sobrantesService',
      sobranteId,
      longitudUsada,
      sobranteRestante,
      nuevoSobranteCreado: !!nuevoSobrante
    });
    
    return {
      sobranteUsado: sobrante.toObject(),
      longitudUsada,
      sobranteRestante,
      nuevoSobrante
    };
  }
  
  /**
   * Obtiene resumen de sobrantes por tipo
   * @returns {object} Resumen agrupado
   */
  static async obtenerResumen() {
    const resumen = await SobranteMaterial.aggregate([
      { $match: { estado: 'disponible' } },
      {
        $group: {
          _id: { tipo: '$tipo', diametro: '$diametro' },
          cantidad: { $sum: 1 },
          longitudTotal: { $sum: '$longitud' },
          longitudPromedio: { $avg: '$longitud' },
          longitudMinima: { $min: '$longitud' },
          longitudMaxima: { $max: '$longitud' }
        }
      },
      { $sort: { '_id.tipo': 1, '_id.diametro': 1 } }
    ]);
    
    // Identificar grupos que necesitan revisión
    const alertas = resumen
      .filter(r => r.cantidad >= REGLAS_SOBRANTES.cantidadMaximaAnteAviso)
      .map(r => ({
        tipo: r._id.tipo,
        diametro: r._id.diametro,
        cantidad: r.cantidad,
        mensaje: `Revisar ${r.cantidad} sobrantes de ${r._id.tipo}${r._id.diametro ? ` ${r._id.diametro}` : ''}`
      }));
    
    return {
      resumenPorTipo: resumen.map(r => ({
        tipo: r._id.tipo,
        diametro: r._id.diametro || 'N/A',
        cantidad: r.cantidad,
        longitudTotal: Number(r.longitudTotal.toFixed(2)),
        longitudPromedio: Number(r.longitudPromedio.toFixed(2)),
        rango: `${r.longitudMinima.toFixed(2)}m - ${r.longitudMaxima.toFixed(2)}m`
      })),
      totalSobrantes: resumen.reduce((sum, r) => sum + r.cantidad, 0),
      alertas
    };
  }
  
  /**
   * Descarta sobrantes (marca como descartados)
   * @param {Array} sobranteIds - IDs de sobrantes a descartar
   * @param {string} motivo - Motivo del descarte
   * @param {string} usuarioId - Usuario que realiza la operación
   * @returns {object} Resultado
   */
  static async descartarSobrantes(sobranteIds, motivo, usuarioId) {
    const resultado = await SobranteMaterial.updateMany(
      { _id: { $in: sobranteIds }, estado: 'disponible' },
      { 
        $set: { 
          estado: 'descartado',
          observaciones: `Descartado: ${motivo}`,
          actualizadoPor: usuarioId
        }
      }
    );
    
    logger.info('Sobrantes descartados', {
      servicio: 'sobrantesService',
      cantidad: resultado.modifiedCount,
      motivo,
      usuarioId
    });
    
    return {
      descartados: resultado.modifiedCount,
      motivo
    };
  }
  
  /**
   * Genera código para sobrante
   */
  static generarCodigoSobrante(tipo, diametro, subtipo) {
    const prefijos = {
      'Tubo': 'TUB',
      'Contrapeso': 'CP',
      'Tela': 'TEL'
    };
    
    let codigo = prefijos[tipo] || tipo.substring(0, 3).toUpperCase();
    
    if (diametro) {
      const numDiametro = diametro.replace(/[^0-9]/g, '');
      codigo += `-${numDiametro}`;
    }
    
    if (subtipo) {
      codigo += `-${subtipo.substring(0, 3).toUpperCase()}`;
    }
    
    return codigo;
  }
  
  /**
   * Genera descripción para sobrante
   */
  static generarDescripcion(tipo, longitud, diametro, subtipo) {
    let desc = `Sobrante ${tipo}`;
    
    if (diametro) desc += ` ${diametro}`;
    if (subtipo) desc += ` ${subtipo}`;
    desc += ` - ${(longitud * 100).toFixed(0)}cm`;
    
    return desc;
  }
  
  /**
   * Obtiene configuración de reglas
   */
  static obtenerReglas() {
    return { ...REGLAS_SOBRANTES };
  }
}

module.exports = SobrantesService;
