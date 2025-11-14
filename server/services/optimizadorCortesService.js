const logger = require('../config/logger');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const SobranteMaterial = require('../models/SobranteMaterial');

/**
 * Servicio para optimizar cortes de materiales y seleccionar componentes
 * LEE CONFIGURACIONES DE LA BASE DE DATOS (100% configurable)
 * 
 * v2.0: Sistema completamente dinámico sin reglas hardcodeadas
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
   * Selecciona el tipo de tubo según reglas de BD
   * @param {object} configuracion - Configuración del sistema
   * @param {object} variables - Variables de la pieza (ancho, alto, motorizado, etc.)
   * @returns {object} Información del tubo
   */
  static seleccionarTubo(configuracion, variables) {
    const reglasTubos = configuracion.reglasSeleccion?.tubos || [];
    
    // Buscar la primera regla que cumpla la condición
    for (const regla of reglasTubos) {
      try {
        if (regla.condicion) {
          const condicionFn = new Function(
            ...Object.keys(variables),
            `return ${regla.condicion}`
          );
          const cumple = condicionFn(...Object.values(variables));
          
          if (cumple) {
            return {
              diametro: regla.diametro,
              descripcion: regla.descripcion,
              codigo: regla.codigo
            };
          }
        }
      } catch (error) {
        logger.error('Error evaluando regla de tubo', {
          regla: regla.condicion,
          error: error.message
        });
      }
    }
    
    // Fallback si no hay reglas o ninguna cumple
    return {
      diametro: '50mm',
      descripcion: 'Tubo 50mm (por defecto)',
      codigo: 'T50'
    };
  }
  
  /**
   * Selecciona el tipo de mecanismo según reglas de BD
   * @param {object} configuracion - Configuración del sistema
   * @param {object} variables - Variables de la pieza
   * @returns {object} Información del mecanismo
   */
  static seleccionarMecanismo(configuracion, variables) {
    const reglasMecanismos = configuracion.reglasSeleccion?.mecanismos || [];
    
    // Buscar la primera regla que cumpla la condición
    for (const regla of reglasMecanismos) {
      try {
        if (regla.condicion) {
          const condicionFn = new Function(
            ...Object.keys(variables),
            `return ${regla.condicion}`
          );
          const cumple = condicionFn(...Object.values(variables));
          
          if (cumple) {
            return {
              tipo: regla.tipo,
              descripcion: regla.descripcion,
              codigo: regla.codigo,
              incluye: regla.incluye || [],
              esMotor: regla.tipo === 'Motor',
              obligatorio: regla.condicion.includes('> 3') // Detectar si es obligatorio
            };
          }
        }
      } catch (error) {
        logger.error('Error evaluando regla de mecanismo', {
          regla: regla.condicion,
          error: error.message
        });
      }
    }
    
    // Fallback
    return {
      tipo: 'Mecanismo',
      descripcion: 'Mecanismo estándar',
      codigo: 'MEC-STD',
      incluye: [],
      esMotor: false,
      obligatorio: false
    };
  }
  
  /**
   * Calcula cuántos cortes salen de un tubo estándar
   * @param {number} anchoCorte - Ancho del corte en metros
   * @param {number} longitudEstandar - Longitud estándar del tubo
   * @returns {object} Información de optimización
   */
  static calcularCortesOptimos(anchoCorte, longitudEstandar = 5.80) {
    const longitudNecesaria = anchoCorte + this.MARGEN_CORTE;
    const cortesCompletos = Math.floor(longitudEstandar / longitudNecesaria);
    const desperdicioMetros = longitudEstandar - (cortesCompletos * longitudNecesaria);
    const desperdicioPorc = (desperdicioMetros / longitudEstandar) * 100;
    
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
   * Optimiza cortes USANDO SOBRANTES DEL ALMACÉN primero
   * @param {Array} cortes - Array de longitudes a cortar
   * @param {string} tipoMaterial - Tipo de material (Tubo, Contrapeso, etc.)
   * @param {string} codigo - Código del material (T38, T50, etc.)
   * @param {number} longitudBarra - Longitud de la barra estándar
   * @returns {Promise<object>} Plan de cortes optimizado con sobrantes
   */
  static async optimizarCortesConSobrantes(cortes, tipoMaterial, codigo, longitudBarra = 5.80) {
    // PASO 1: Buscar sobrantes disponibles en almacén
    const sobrantesDisponibles = await SobranteMaterial.buscarDisponibles(
      tipoMaterial,
      0.50, // Mínimo 50cm para considerar
      { codigo }
    );

    logger.info('Sobrantes encontrados en almacén', {
      servicio: 'optimizadorCortesService',
      tipoMaterial,
      codigo,
      sobrantesEncontrados: sobrantesDisponibles.length,
      longitudesTotales: sobrantesDisponibles.reduce((sum, s) => sum + s.longitud, 0)
    });

    // PASO 2: Ordenar cortes de mayor a menor
    const cortesOrdenados = [...cortes].sort((a, b) => b - a);
    const barras = [];
    const sobrantesUsados = [];
    const cortesRestantes = [...cortesOrdenados];

    // PASO 3: Intentar usar sobrantes primero
    for (const sobrante of sobrantesDisponibles) {
      if (cortesRestantes.length === 0) break;

      const cortesEnSobrante = [];
      let espacioUsado = 0;

      // Intentar meter cortes en este sobrante
      for (let i = cortesRestantes.length - 1; i >= 0; i--) {
        const corte = cortesRestantes[i];
        const espacioDisponible = sobrante.longitud - espacioUsado;

        if (espacioDisponible >= corte + this.MARGEN_CORTE) {
          cortesEnSobrante.push(corte);
          espacioUsado += corte + this.MARGEN_CORTE;
          cortesRestantes.splice(i, 1);
        }
      }

      // Si se usó el sobrante, agregarlo al plan
      if (cortesEnSobrante.length > 0) {
        const sobranteRestante = sobrante.longitud - espacioUsado;

        barras.push({
          numero: barras.length + 1,
          tipo: 'sobrante',
          sobranteId: sobrante._id,
          etiqueta: sobrante.etiqueta,
          longitudOriginal: sobrante.longitud,
          cortes: cortesEnSobrante,
          usado: espacioUsado,
          sobrante: sobranteRestante,
          eficiencia: Number(((espacioUsado / sobrante.longitud) * 100).toFixed(2)),
          desperdicio: Number(((sobranteRestante / sobrante.longitud) * 100).toFixed(2)),
          observaciones: `Reutilizado de almacén (${sobrante.ubicacionAlmacen})`
        });

        sobrantesUsados.push({
          id: sobrante._id,
          etiqueta: sobrante.etiqueta,
          longitudOriginal: sobrante.longitud,
          usado: espacioUsado,
          sobranteNuevo: sobranteRestante
        });
      }
    }

    // PASO 4: Optimizar cortes restantes con barras nuevas
    if (cortesRestantes.length > 0) {
      const optimizacionNueva = this.optimizarCortes(cortesRestantes, longitudBarra);
      
      // Agregar barras nuevas al plan
      optimizacionNueva.barras.forEach(barra => {
        barras.push({
          ...barra,
          numero: barras.length + 1,
          tipo: 'nueva',
          observaciones: 'Material nuevo'
        });
      });
    }

    // PASO 5: Calcular estadísticas totales
    const totalUsado = barras.reduce((sum, b) => sum + b.usado, 0);
    const totalSobrante = barras.reduce((sum, b) => sum + b.sobrante, 0);
    const barrasNuevas = barras.filter(b => b.tipo === 'nueva').length;
    const sobrantesReutilizados = barras.filter(b => b.tipo === 'sobrante').length;
    
    const longitudTotalNecesaria = barrasNuevas * longitudBarra + 
                                   sobrantesUsados.reduce((sum, s) => sum + s.longitudOriginal, 0);
    const eficienciaGlobal = (totalUsado / longitudTotalNecesaria) * 100;

    const resultado = {
      barras,
      sobrantesUsados,
      resumen: {
        totalBarras: barras.length,
        barrasNuevas,
        sobrantesReutilizados,
        totalCortes: cortes.length,
        cortesEnSobrantes: cortes.length - cortesRestantes.length,
        cortesEnBarrasNuevas: cortesRestantes.length,
        longitudTotal: longitudTotalNecesaria,
        totalUsado: Number(totalUsado.toFixed(2)),
        totalSobrante: Number(totalSobrante.toFixed(2)),
        eficienciaGlobal: Number(eficienciaGlobal.toFixed(2)),
        desperdicioGlobal: Number((100 - eficienciaGlobal).toFixed(2)),
        ahorroMaterial: sobrantesUsados.reduce((sum, s) => sum + s.usado, 0)
      }
    };

    logger.info('Optimización con sobrantes completada', {
      servicio: 'optimizadorCortesService',
      tipoMaterial,
      codigo,
      sobrantesUsados: sobrantesReutilizados,
      barrasNuevas,
      ahorroMaterial: resultado.resumen.ahorroMaterial,
      eficiencia: resultado.resumen.eficienciaGlobal
    });

    return resultado;
  }

  /**
   * Optimiza cortes para minimizar desperdicios (Bin Packing Problem)
   * Agrupa cortinas inteligentemente en barras de 5.80m
   * SIN usar sobrantes (método base)
   * @param {Array} cortes - Array de longitudes a cortar
   * @param {number} longitudBarra - Longitud de la barra estándar
   * @returns {object} Plan de cortes optimizado
   */
  static optimizarCortes(cortes, longitudBarra = 5.80) {
    // Ordenar cortes de mayor a menor (First Fit Decreasing)
    const cortesOrdenados = [...cortes].sort((a, b) => b - a);
    const barras = [];
    
    cortesOrdenados.forEach(corte => {
      // Buscar una barra donde quepa el corte
      let colocado = false;
      
      for (const barra of barras) {
        const espacioDisponible = longitudBarra - barra.usado;
        
        if (espacioDisponible >= corte + this.MARGEN_CORTE) {
          barra.cortes.push(corte);
          barra.usado += corte + this.MARGEN_CORTE;
          colocado = true;
          break;
        }
      }
      
      // Si no cabe en ninguna barra, crear una nueva
      if (!colocado) {
        barras.push({
          numero: barras.length + 1,
          cortes: [corte],
          usado: corte + this.MARGEN_CORTE,
          sobrante: longitudBarra - (corte + this.MARGEN_CORTE),
          eficiencia: 0
        });
      }
    });
    
    // Calcular eficiencia de cada barra
    barras.forEach(barra => {
      barra.sobrante = Number((longitudBarra - barra.usado).toFixed(3));
      barra.eficiencia = Number(((barra.usado / longitudBarra) * 100).toFixed(2));
      barra.desperdicio = Number(((barra.sobrante / longitudBarra) * 100).toFixed(2));
    });
    
    // Calcular estadísticas totales
    const totalUsado = barras.reduce((sum, b) => sum + b.usado, 0);
    const totalSobrante = barras.reduce((sum, b) => sum + b.sobrante, 0);
    const eficienciaGlobal = (totalUsado / (barras.length * longitudBarra)) * 100;
    
    return {
      barras,
      resumen: {
        totalBarras: barras.length,
        totalCortes: cortes.length,
        longitudTotal: barras.length * longitudBarra,
        totalUsado: Number(totalUsado.toFixed(2)),
        totalSobrante: Number(totalSobrante.toFixed(2)),
        eficienciaGlobal: Number(eficienciaGlobal.toFixed(2)),
        desperdicioGlobal: Number((100 - eficienciaGlobal).toFixed(2))
      }
    };
  }

  /**
   * Calcula tubos necesarios para múltiples piezas CON OPTIMIZACIÓN
   * @param {Array} piezas - Array de objetos con {ancho, cantidad}
   * @returns {object} Resumen de tubos necesarios optimizado
   */
  static calcularTubosParaProduccion(piezas) {
    const resumenPorTipo = {};
    let totalTubos = 0;
    
    // Agrupar piezas por tipo de tubo
    const piezasPorTipo = {};
    
    piezas.forEach(pieza => {
      const tubo = this.seleccionarTubo(pieza.ancho);
      
      if (!piezasPorTipo[tubo.codigo]) {
        piezasPorTipo[tubo.codigo] = {
          tubo,
          cortes: []
        };
      }
      
      // Agregar el corte (con margen de corte ya incluido)
      const cantidad = pieza.cantidad || 1;
      for (let i = 0; i < cantidad; i++) {
        piezasPorTipo[tubo.codigo].cortes.push(pieza.ancho);
      }
    });
    
    // Optimizar cortes para cada tipo de tubo
    Object.keys(piezasPorTipo).forEach(codigo => {
      const { tubo, cortes } = piezasPorTipo[codigo];
      const optimizacion = this.optimizarCortes(cortes, this.LONGITUD_TUBO_ESTANDAR);
      
      resumenPorTipo[codigo] = {
        tubo,
        optimizacion,
        totalCortes: cortes.length,
        tubosNecesarios: optimizacion.resumen.totalBarras,
        eficiencia: optimizacion.resumen.eficienciaGlobal,
        desperdicio: optimizacion.resumen.desperdicioGlobal
      };
      
      totalTubos += optimizacion.resumen.totalBarras;
    });
    
    return {
      resumenPorTipo,
      totalTubos,
      longitudTuboEstandar: this.LONGITUD_TUBO_ESTANDAR
    };
  }
  
  /**
   * Calcula todos los materiales para una pieza usando configuración de BD
   * v2.0: 100% dinámico desde base de datos
   * @param {object} pieza - Datos de la pieza
   * @returns {Promise<Array>} Lista de materiales calculados
   */
  static async calcularMaterialesPieza(pieza) {
    const { ancho, alto, motorizado = false, sistema = 'Roller Shade', producto } = pieza;
    
    try {
      // PASO 1: Buscar configuración en BD
      const query = { sistema, activo: true };
      if (producto) query.producto = producto;
      
      const configuracion = await ConfiguracionMateriales.findOne(query).lean();
      
      if (!configuracion) {
        logger.warn('No se encontró configuración para el sistema', { sistema, producto });
        return [];
      }
      
      // PASO 2: Preparar variables para evaluación
      const variables = {
        ancho,
        alto,
        area: ancho * alto,
        motorizado,
        esManual: !motorizado,
        galeria: pieza.galeria || 'sin_galeria',
        color: pieza.color || '',
        Math,
        Number
      };
      
      // PASO 3: Seleccionar componentes según reglas
      const tubo = this.seleccionarTubo(configuracion, variables);
      const mecanismo = this.seleccionarMecanismo(configuracion, variables);
      
      // PASO 4: Calcular optimización de cortes
      const longitudEstandar = configuracion.optimizacion?.longitudEstandar || 5.80;
      const optimizacion = this.calcularCortesOptimos(ancho, longitudEstandar);
      
      // PASO 5: Calcular materiales usando el modelo
      const materiales = configuracion.calcularTodosMateriales(variables);
      
      // PASO 6: Enriquecer con información de selección y optimización
      const materialesEnriquecidos = materiales.map(material => {
        const materialEnriquecido = { ...material };
        
        // Enriquecer tubos
        if (material.tipo === 'Tubo') {
          materialEnriquecido.descripcion = `${tubo.descripcion}`;
          materialEnriquecido.codigo = tubo.codigo;
          materialEnriquecido.diametro = tubo.diametro;
          materialEnriquecido.observaciones = `${optimizacion.cortesCompletos} cortes por tubo. Desperdicio: ${optimizacion.desperdicioPorc}%`;
          materialEnriquecido.metadata = {
            ...optimizacion,
            diametro: tubo.diametro
          };
        }
        
        // Enriquecer mecanismos
        if (material.tipo === 'Mecanismo' || material.tipo === 'Motor') {
          materialEnriquecido.descripcion = mecanismo.descripcion;
          materialEnriquecido.codigo = mecanismo.codigo;
          materialEnriquecido.incluye = mecanismo.incluye;
          if (mecanismo.obligatorio) {
            materialEnriquecido.observaciones = '⚠️ OBLIGATORIO';
          }
          materialEnriquecido.metadata = {
            esMotor: mecanismo.esMotor,
            obligatorio: mecanismo.obligatorio
          };
        }
        
        return materialEnriquecido;
      });
      
      logger.info('Materiales calculados desde BD', {
        servicio: 'optimizadorCortesService',
        sistema,
        producto,
        ancho,
        alto,
        motorizado,
        tubo: tubo.codigo,
        mecanismo: mecanismo.codigo,
        totalMateriales: materialesEnriquecidos.length
      });
      
      return materialesEnriquecidos;
      
    } catch (error) {
      logger.error('Error calculando materiales', {
        servicio: 'optimizadorCortesService',
        error: error.message,
        stack: error.stack,
        pieza
      });
      throw error;
    }
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
   * Registrar sobrantes generados en la producción
   * @param {object} planCortes - Plan de cortes optimizado
   * @param {string} tipoMaterial - Tipo de material
   * @param {string} codigo - Código del material
   * @param {string} proyectoId - ID del proyecto origen
   * @param {string} ordenProduccion - Número de orden
   * @returns {Promise<Array>} Sobrantes registrados
   */
  static async registrarSobrantes(planCortes, tipoMaterial, codigo, proyectoId, ordenProduccion) {
    const sobrantesRegistrados = [];
    const MINIMO_REUTILIZABLE = 1.00; // 1 metro mínimo para guardar

    try {
      // Procesar cada barra del plan
      for (const barra of planCortes.barras) {
        // Solo registrar sobrantes > 1.00m
        if (barra.sobrante >= MINIMO_REUTILIZABLE) {
          const etiqueta = SobranteMaterial.generarEtiqueta(tipoMaterial, codigo);
          
          const sobrante = new SobranteMaterial({
            tipo: tipoMaterial,
            descripcion: barra.tipo === 'sobrante' 
              ? `Sobrante reutilizado (${barra.etiqueta})` 
              : `Sobrante de producción`,
            codigo,
            longitud: barra.sobrante,
            unidad: 'ml',
            diametro: barra.diametro,
            estado: 'disponible',
            ubicacionAlmacen: 'Almacén General',
            etiqueta,
            origenProyecto: proyectoId,
            origenOrdenProduccion: ordenProduccion,
            condicion: 'excelente',
            observaciones: `Generado en orden ${ordenProduccion}. Barra ${barra.numero}: ${barra.cortes.join('m + ')}m`
          });

          await sobrante.save();
          sobrantesRegistrados.push(sobrante);

          logger.info('Sobrante registrado', {
            servicio: 'optimizadorCortesService',
            etiqueta,
            longitud: barra.sobrante,
            tipo: tipoMaterial,
            codigo
          });
        }
      }

      // Marcar sobrantes usados como "usado"
      if (planCortes.sobrantesUsados) {
        for (const sobranteUsado of planCortes.sobrantesUsados) {
          await SobranteMaterial.findByIdAndUpdate(
            sobranteUsado.id,
            {
              estado: 'usado',
              'usadoEn.proyecto': proyectoId,
              'usadoEn.fecha': new Date(),
              'usadoEn.observaciones': `Usado en orden ${ordenProduccion}`
            }
          );

          logger.info('Sobrante marcado como usado', {
            servicio: 'optimizadorCortesService',
            sobranteId: sobranteUsado.id,
            etiqueta: sobranteUsado.etiqueta
          });
        }
      }

      logger.info('Sobrantes registrados exitosamente', {
        servicio: 'optimizadorCortesService',
        totalRegistrados: sobrantesRegistrados.length,
        totalUsados: planCortes.sobrantesUsados?.length || 0
      });

      return sobrantesRegistrados;

    } catch (error) {
      logger.error('Error registrando sobrantes', {
        servicio: 'optimizadorCortesService',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
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
