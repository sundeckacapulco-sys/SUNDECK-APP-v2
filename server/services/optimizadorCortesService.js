const logger = require('../config/logger');
const CalculadoraMaterialesService = require('./calculadoraMaterialesService');

/**
 * Servicio para optimizar cortes de materiales y seleccionar componentes
 * según las reglas de negocio de Sundeck
 * 
 * HÍBRIDO: Combina lógica de negocio automática con configuración flexible de BD
 */
class OptimizadorCortesService {
  
  /**
   * Longitud estándar de tubos en metros
   */
  static LONGITUD_TUBO_ESTANDAR = 5.80;
  
  /**
   * Margen de corte por pieza (en metros)
   */
  static MARGEN_CORTE = 0.10;
  
  /**
   * Selecciona el tipo de tubo según el ancho
   * @param {number} ancho - Ancho en metros
   * @returns {object} Información del tubo
   */
  static seleccionarTubo(ancho) {
    if (ancho <= 2.50) {
      return {
        diametro: '38mm',
        descripcion: 'Tubo 38mm (hasta 2.50m)',
        codigo: 'T38'
      };
    } else if (ancho > 2.50 && ancho <= 3.00) {
      return {
        diametro: '50mm',
        descripcion: 'Tubo 50mm (2.50m - 3.00m)',
        codigo: 'T50'
      };
    } else if (ancho > 3.00 && ancho <= 4.00) {
      return {
        diametro: '65mm',
        descripcion: 'Tubo 65mm/70mm (3.00m - 4.00m)',
        codigo: 'T65'
      };
    } else {
      return {
        diametro: '79mm',
        descripcion: 'Tubo 79mm (mayor a 4.00m)',
        codigo: 'T79'
      };
    }
  }
  
  /**
   * Selecciona el tipo de mecanismo según el ancho
   * @param {number} ancho - Ancho en metros
   * @param {boolean} motorizado - Si es motorizado
   * @returns {object} Información del mecanismo
   */
  static seleccionarMecanismo(ancho, motorizado = false) {
    // Si es mayor a 3m, debe ser motorizado obligatoriamente
    if (ancho > 3.00) {
      return {
        tipo: 'Motor',
        descripcion: 'Motor tubular (obligatorio para anchos > 3.00m)',
        codigo: 'MOTOR',
        esMotor: true,
        obligatorio: true
      };
    }
    
    // Si el usuario lo pidió motorizado
    if (motorizado) {
      return {
        tipo: 'Motor',
        descripcion: 'Motor tubular',
        codigo: 'MOTOR',
        esMotor: true,
        obligatorio: false
      };
    }
    
    // Mecanismos manuales según ancho
    if (ancho <= 2.50) {
      return {
        tipo: 'Mecanismo',
        descripcion: 'Mecanismo SL-16 (hasta 2.50m)',
        codigo: 'SL-16',
        esMotor: false,
        obligatorio: false
      };
    } else {
      return {
        tipo: 'Mecanismo',
        descripcion: 'Mecanismo R-24 (2.50m - 3.00m)',
        codigo: 'R-24',
        esMotor: false,
        obligatorio: false
      };
    }
  }
  
  /**
   * Calcula cuántos cortes salen de un tubo estándar
   * @param {number} anchoCorte - Ancho del corte en metros
   * @returns {object} Información de optimización
   */
  static calcularCortesOptimos(anchoCorte) {
    const longitudNecesaria = anchoCorte + this.MARGEN_CORTE;
    const cortesCompletos = Math.floor(this.LONGITUD_TUBO_ESTANDAR / longitudNecesaria);
    const desperdicioMetros = this.LONGITUD_TUBO_ESTANDAR - (cortesCompletos * longitudNecesaria);
    const desperdicioPorc = (desperdicioMetros / this.LONGITUD_TUBO_ESTANDAR) * 100;
    
    return {
      cortesCompletos,
      longitudNecesaria,
      desperdicioMetros: Number(desperdicioMetros.toFixed(3)),
      desperdicioPorc: Number(desperdicioPorc.toFixed(2)),
      tubosNecesarios: 1 / cortesCompletos, // Fracción de tubo por pieza
      eficiencia: Number((100 - desperdicioPorc).toFixed(2))
    };
  }
  
  /**
   * Calcula tubos necesarios para múltiples piezas
   * @param {Array} piezas - Array de objetos con {ancho, cantidad}
   * @returns {object} Resumen de tubos necesarios
   */
  static calcularTubosParaProduccion(piezas) {
    const resumenPorTipo = {};
    let totalTubos = 0;
    
    piezas.forEach(pieza => {
      const tubo = this.seleccionarTubo(pieza.ancho);
      const optimizacion = this.calcularCortesOptimos(pieza.ancho);
      const cantidad = pieza.cantidad || 1;
      
      if (!resumenPorTipo[tubo.codigo]) {
        resumenPorTipo[tubo.codigo] = {
          tubo,
          piezas: [],
          totalCortes: 0,
          tubosNecesarios: 0
        };
      }
      
      resumenPorTipo[tubo.codigo].piezas.push({
        ancho: pieza.ancho,
        cantidad,
        cortesCompletos: optimizacion.cortesCompletos,
        desperdicioPorc: optimizacion.desperdicioPorc
      });
      
      resumenPorTipo[tubo.codigo].totalCortes += cantidad;
      resumenPorTipo[tubo.codigo].tubosNecesarios += optimizacion.tubosNecesarios * cantidad;
    });
    
    // Redondear tubos hacia arriba
    Object.keys(resumenPorTipo).forEach(codigo => {
      resumenPorTipo[codigo].tubosNecesarios = Math.ceil(resumenPorTipo[codigo].tubosNecesarios);
      totalTubos += resumenPorTipo[codigo].tubosNecesarios;
    });
    
    return {
      resumenPorTipo,
      totalTubos,
      longitudTuboEstandar: this.LONGITUD_TUBO_ESTANDAR
    };
  }
  
  /**
   * Calcula todos los materiales para una pieza según reglas de negocio
   * HÍBRIDO: Usa lógica de negocio para tubo/mecanismo + configuración BD para resto
   * @param {object} pieza - Datos de la pieza
   * @returns {Promise<Array>} Lista de materiales calculados
   */
  static async calcularMaterialesPieza(pieza) {
    const { ancho, alto, motorizado = false } = pieza;
    
    // PASO 1: Aplicar lógica de negocio para selección automática
    const tubo = this.seleccionarTubo(ancho);
    const mecanismo = this.seleccionarMecanismo(ancho, motorizado);
    const optimizacion = this.calcularCortesOptimos(ancho);
    
    // PASO 2: Enriquecer pieza con información de negocio
    const piezaEnriquecida = {
      ...pieza,
      // Agregar metadata de selección automática
      _tuboSeleccionado: tubo,
      _mecanismoSeleccionado: mecanismo,
      _optimizacion: optimizacion,
      // Forzar motorizado si es obligatorio
      motorizado: mecanismo.obligatorio ? true : motorizado
    };
    
    // PASO 3: Obtener materiales desde configuración de BD
    let materialesBase = await CalculadoraMaterialesService.calcularMaterialesPieza(piezaEnriquecida);
    
    // PASO 4: Enriquecer materiales con metadata de optimización
    const materialesEnriquecidos = materialesBase.map(material => {
      // Si es tubo, agregar información de optimización
      if (material.tipo === 'Tubo') {
        return {
          ...material,
          descripcion: `${material.descripcion} - ${tubo.descripcion}`,
          codigo: tubo.codigo,
          observaciones: `${material.observaciones || ''}\n${optimizacion.cortesCompletos} cortes por tubo de 5.80m. Desperdicio: ${optimizacion.desperdicioPorc}%. Eficiencia: ${optimizacion.eficiencia}%`.trim(),
          metadata: {
            ...(material.metadata || {}),
            diametro: tubo.diametro,
            cortesCompletos: optimizacion.cortesCompletos,
            desperdicioPorc: optimizacion.desperdicioPorc,
            tubosNecesarios: optimizacion.tubosNecesarios,
            eficiencia: optimizacion.eficiencia
          }
        };
      }
      
      // Si es mecanismo o motor, agregar información de selección
      if (material.tipo === 'Mecanismo' || material.tipo === 'Motor') {
        return {
          ...material,
          descripcion: `${mecanismo.descripcion}`,
          codigo: mecanismo.codigo,
          observaciones: mecanismo.obligatorio 
            ? '⚠️ OBLIGATORIO por ancho > 3.00m' 
            : material.observaciones || '',
          metadata: {
            ...(material.metadata || {}),
            esMotor: mecanismo.esMotor,
            obligatorio: mecanismo.obligatorio,
            codigoMecanismo: mecanismo.codigo
          }
        };
      }
      
      return material;
    });
    
    logger.info('Materiales calculados con optimización híbrida', {
      servicio: 'optimizadorCortesService',
      ancho,
      alto,
      motorizado: piezaEnriquecida.motorizado,
      tubo: tubo.codigo,
      mecanismo: mecanismo.codigo,
      cortesOptimos: optimizacion.cortesCompletos,
      desperdicio: optimizacion.desperdicioPorc,
      totalMateriales: materialesEnriquecidos.length
    });
    
    return materialesEnriquecidos;
  }
  
  /**
   * Genera reporte de optimización para producción
   * @param {Array} piezas - Array de piezas del proyecto
   * @returns {Promise<object>} Reporte completo
   */
  static async generarReporteOptimizacion(piezas) {
    const materialesPorPieza = await Promise.all(
      piezas.map(async pieza => ({
        pieza,
        materiales: await this.calcularMaterialesPieza(pieza)
      }))
    );
    
    const resumenTubos = this.calcularTubosParaProduccion(
      piezas.map(p => ({ ancho: p.ancho, cantidad: 1 }))
    );
    
    return {
      materialesPorPieza,
      resumenTubos,
      recomendaciones: this.generarRecomendaciones(piezas)
    };
  }
  
  /**
   * Genera recomendaciones de producción
   * @param {Array} piezas - Array de piezas
   * @returns {Array} Lista de recomendaciones
   */
  static generarRecomendaciones(piezas) {
    const recomendaciones = [];
    
    // Verificar si hay piezas que requieren motorización obligatoria
    const requierenMotor = piezas.filter(p => p.ancho > 3.00);
    if (requierenMotor.length > 0) {
      recomendaciones.push({
        tipo: 'OBLIGATORIO',
        mensaje: `${requierenMotor.length} pieza(s) requieren motorización obligatoria (ancho > 3.00m)`,
        piezas: requierenMotor.map(p => `${p.ancho}m`)
      });
    }
    
    // Verificar eficiencia de cortes
    piezas.forEach(pieza => {
      const opt = this.calcularCortesOptimos(pieza.ancho);
      if (opt.desperdicioPorc > 50) {
        recomendaciones.push({
          tipo: 'ADVERTENCIA',
          mensaje: `Ancho ${pieza.ancho}m tiene ${opt.desperdicioPorc}% de desperdicio. Considerar ajustar medida.`,
          sugerencia: `Optimizar a ${(this.LONGITUD_TUBO_ESTANDAR / Math.floor(this.LONGITUD_TUBO_ESTANDAR / pieza.ancho) - this.MARGEN_CORTE).toFixed(2)}m`
        });
      }
    });
    
    return recomendaciones;
  }
}

module.exports = OptimizadorCortesService;
