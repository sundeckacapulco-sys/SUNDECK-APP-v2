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
    // Buscar reglas de tubos en reglasSeleccion.tubos (estructura correcta)
    const reglasTubos = configuracion.reglasSeleccion?.tubos || [];
    
    // Buscar el primer tubo que cumpla la condición
    for (const tubo of reglasTubos) {
      try {
        if (tubo.condicion) {
          const condicionFn = new Function(
            ...Object.keys(variables),
            `return ${tubo.condicion}`
          );
          const cumple = condicionFn(...Object.values(variables));
          
          if (cumple) {
            return {
              diametro: tubo.diametro || '50mm',
              descripcion: tubo.descripcion,
              codigo: tubo.codigo || 'T50'
            };
          }
        }
      } catch (error) {
        logger.error('Error evaluando condición de tubo', {
          tubo: tubo.descripcion,
          condicion: tubo.condicion,
          error: error.message
        });
      }
    }
    
    // Fallback si no hay tubos o ninguno cumple
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
   * Optimiza cortes de tela agrupando por ancho y altura (Grupos A, B, C...)
   * REGLA OFICIAL: Misma tela + Mismo ancho rollo + Misma altura (±2cm)
   * @param {Array} piezas - Array de objetos {ancho, alto}
   * @param {number} anchoRollo - Ancho del rollo de tela (ej. 2.50)
   * @param {number} margenAlto - Margen adicional al alto para el corte (default 0)
   * @returns {object} Plan de cortes de tela
   */
  static optimizarCortesTela(piezas, anchoRollo, margenAlto = 0) {
    // 1. Ordenar por alto descendente (para agrupar eficientemente)
    const piezasOrdenadas = [...piezas].sort((a, b) => b.alto - a.alto);
    
    const grupos = [];
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // Para nombrar grupos
    
    // Tolerancia máxima de diferencia de altura para agrupar (50cm)
    // Si la diferencia es mayor, no vale la pena desperdiciar tela
    const TOLERANCIA_ALTURA_MAX = 0.50;

    piezasOrdenadas.forEach(pieza => {
      let asignado = false;
      let mejorGrupo = null;
      let menorDesperdicio = Infinity;
      
      // 2. Buscar el mejor grupo donde quepa
      for (const grupo of grupos) {
        // Regla 1: Cabe en el ancho del rollo
        const cabeAncho = (grupo.anchoAcumulado + pieza.ancho) <= anchoRollo;
        
        if (!cabeAncho) continue;
        
        // Regla 2: Diferencia de altura aceptable
        const diferenciaAltura = grupo.alto - pieza.alto; // grupo.alto siempre >= pieza.alto por el orden
        const alturaAceptable = diferenciaAltura <= TOLERANCIA_ALTURA_MAX;
        
        if (!alturaAceptable) continue;
        
        // Elegir el grupo con menor desperdicio de altura
        if (diferenciaAltura < menorDesperdicio) {
          menorDesperdicio = diferenciaAltura;
          mejorGrupo = grupo;
        }
      }
      
      if (mejorGrupo) {
        mejorGrupo.piezas.push(pieza);
        mejorGrupo.anchoAcumulado += pieza.ancho;
        asignado = true;
      }

      // 3. Si no cabe en ninguno, crear nuevo grupo
      if (!asignado) {
        grupos.push({
          letra: '', // Se asigna al final
          anchoRollo,
          alto: pieza.alto, // Altura base del grupo (la más alta)
          longitudCorte: pieza.alto + margenAlto, // Altura + Hem/Margen
          piezas: [pieza],
          anchoAcumulado: pieza.ancho
        });
      }
    });

    // Asignar letras secuenciales, calcular sobrantes y generar observaciones
    const SOBRANTE_MINIMO_UTIL = 0.30; // 30cm mínimo para considerar útil
    let sobrantesUtiles = [];
    
    grupos.forEach((g, index) => {
      const letraBase = letras[index % letras.length];
      const sufijo = Math.floor(index / letras.length) > 0 ? Math.floor(index / letras.length) : '';
      g.letra = letraBase + sufijo;
      
      // Calcular sobrante de ancho del rollo
      g.sobranteAncho = Number((g.anchoRollo - g.anchoAcumulado).toFixed(2));
      
      // Si el sobrante es útil, registrarlo para almacén
      if (g.sobranteAncho >= SOBRANTE_MINIMO_UTIL) {
        sobrantesUtiles.push({
          grupo: g.letra,
          ancho: g.sobranteAncho,
          alto: g.longitudCorte,
          anchoRollo: g.anchoRollo
        });
      }
      
      // Generar observaciones para el taller si hay diferencias de altura
      g.observaciones = [];
      if (g.piezas.length > 1) {
        const alturaCorte = g.alto;
        g.piezas.forEach(p => {
          const diferencia = alturaCorte - p.alto;
          if (diferencia > 0.02) { // Más de 2cm de diferencia
            const difCm = Math.round(diferencia * 100);
            g.observaciones.push({
              ubicacion: p.ubicacion,
              mensaje: `Recortar ${difCm}cm (alto real: ${p.alto.toFixed(2)}m)`
            });
          }
        });
      }
      
      // Flag para indicar si requiere atención especial
      g.requiereRecorte = g.observaciones.length > 0;
    });

    // Calcular totales
    const totalMetrosLineales = grupos.reduce((sum, g) => sum + g.longitudCorte, 0);
    
    return {
      grupos,
      totalMetrosLineales: Number(totalMetrosLineales.toFixed(2)),
      totalGrupos: grupos.length,
      sobrantesUtiles
    };
  }

  /**
   * Calcula telas necesarias para producción agrupando por tipo y ancho de rollo
   * @param {Array} piezasConTela - Array de piezas con metadata de tela
   * @returns {object} Resumen de telas optimizado
   */
  static calcularTelasParaProduccion(piezasConTela) {
    const resumenPorTela = {};
    
    // Agrupar piezas por código de tela Y ancho de rollo
    // Clave: "CODIGO|ANCHO"
    const piezasPorGrupo = {};
    
    piezasConTela.forEach(pieza => {
      if (!pieza.tela) return; 

      const codigoTela = pieza.tela.codigo || 'GENERICO';
      const esRotada = pieza.rotada === true;
      
      // Obtener anchos disponibles (default [2.50, 3.00] para soportar rotación)
      const anchosDisponibles = pieza.tela.anchosRollo && pieza.tela.anchosRollo.length > 0 
        ? pieza.tela.anchosRollo 
        : [2.50, 3.00];
      
      // Para piezas rotadas, el requerimiento de ancho de rollo es el ALTO original + margen de enrolle
      // El margen de enrolle es 0.25m (la tela debe enrollar en el tubo)
      // Para piezas normales, es el ANCHO (sin margen adicional porque el ancho no enrolla)
      const MARGEN_ENROLLE = 0.25;
      const anchoRequerido = esRotada 
        ? (pieza.altoOriginal || pieza.alto) + MARGEN_ENROLLE  // Alto + margen para enrolle
        : pieza.ancho;
      
      // Seleccionar el mejor ancho de rollo para esta pieza
      // 1. Buscar el menor ancho que sea suficiente para la pieza
      let anchoRollo = anchosDisponibles.sort((a,b) => a-b).find(w => w >= anchoRequerido);
      
      // 2. Si la pieza es más ancha que el rollo más grande, usar el más grande
      if (!anchoRollo) {
        anchoRollo = anchosDisponibles[anchosDisponibles.length - 1];
      }
      const key = `${codigoTela}|${anchoRollo}|${esRotada ? 'ROTADA' : 'NORMAL'}`;
      
      if (!piezasPorGrupo[key]) {
        piezasPorGrupo[key] = {
            descripcion: pieza.tela.descripcion,
            codigoTela,
            anchoRollo,
            esRotada,
            piezas: []
        };
      }
      
      const cantidad = pieza.cantidad || 1;
      for (let i = 0; i < cantidad; i++) {
        piezasPorGrupo[key].piezas.push({
            ancho: pieza.ancho,
            alto: pieza.alto,
            ubicacion: pieza.ubicacion,
            // Preservar datos originales para el reporte
            anchoOriginal: pieza.anchoOriginal,
            altoOriginal: pieza.altoOriginal,
            rotada: pieza.rotada,
            modelo: pieza.modelo,
            color: pieza.color
        });
      }
    });
    
    // Optimizar cada grupo
    Object.keys(piezasPorGrupo).forEach(key => {
        const data = piezasPorGrupo[key];
        const optimizacion = this.optimizarCortesTela(data.piezas, data.anchoRollo);
        
        // Estructura del resultado por grupo único
        // Agregar prefijo "Rotada" a la descripción si aplica
        const descripcionFinal = data.esRotada 
          ? `Rotada sin termosello [${data.descripcion}]`
          : data.descripcion;
        
        resumenPorTela[key] = {
            descripcion: descripcionFinal,
            codigo: data.codigoTela,
            anchoRollo: data.anchoRollo,
            esRotada: data.esRotada,
            optimizacion,
            totalMetros: optimizacion.totalMetrosLineales
        };
    });
    
    return resumenPorTela;
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
   * @param {Array} piezas - Array de objetos con {ancho, cantidad, motorizado, etc.}
   * @param {object} configuracion - Configuración del sistema con materiales
   * @returns {object} Resumen de tubos necesarios optimizado
   */
  static calcularTubosParaProduccion(piezas, configuracion = null) {
    const resumenPorTipo = {};
    let totalTubos = 0;
    
    // Agrupar piezas por tipo de tubo
    const piezasPorTipo = {};
    
    piezas.forEach(pieza => {
      // Construir variables para evaluación de condiciones
      const variables = {
        ancho: pieza.ancho,
        alto: pieza.alto || 2.0,
        motorizado: pieza.motorizado || false,
        esManual: !pieza.motorizado,
        area: pieza.ancho * (pieza.alto || 2.0)
      };
      
      const tubo = configuracion 
        ? this.seleccionarTubo(configuracion, variables)
        : { diametro: '50mm', descripcion: 'Tubo 50mm (por defecto)', codigo: 'T50' };
      
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
   * Calcula todos los materiales para una pieza usando configuración de BD (v2.0)
   * @param {object} pieza - Datos de la pieza
   * @returns {Promise<Array>} Lista de materiales calculados
   */
  static async calcularMaterialesPieza(pieza) {
    let { ancho, alto, motorizado = false, sistema = 'Roller Shade', galeria, rotada = false, color = '', modeloControl, tipoMando, ladoControl } = pieza;
    
    try {
      // 0. AUTO-ROTACIÓN INTELIGENTE (Pre-procesamiento)
      // Si es Roller o Toldo, y el ancho > 3.00m pero alto <= 2.80m, ROTAR AUTOMÁTICAMENTE.
      // Esto cambia el estado "rotada" que se usará en las reglas de BD.
      if (sistema !== 'Sheer Elegance' && !rotada) {
         if (ancho > 3.00 && alto <= 2.80) {
             rotada = true;
             // logger.info(`Pieza auto-rotada por dimensiones: ${ancho}x${alto}`);
         }
      }

      // 1. CARGAR CONFIGURACIÓN DE BD
      const configuracion = await ConfiguracionMateriales.findOne({ sistema }).lean();
      
      if (!configuracion) {
        logger.warn(`No se encontró configuración para sistema: ${sistema}.`, { ancho, alto });
        return [];
      }
      
      // Determinar tipo de contrapeso
      const tipoContrapeso = rotada || (galeria && galeria !== 'sin_galeria') ? 'plano' : 'ovalado';
      
      const variables = {
        ancho,
        alto,
        area: ancho * alto,
        motorizado,
        esManual: !motorizado,
        rotada,
        galeria,
        color,
        modeloControl,
        tipoMando, // Monocanal, Multicanal...
        ladoControl, // Izquierda, Derecha...
        tipoContrapeso, // plano u ovalado
        sistema,
        Math,
        Number
      };
      
      // 2. SELECCIÓN DE TUBO Y MECANISMO
      const tubo = this.seleccionarTubo(configuracion, variables);
      const mecanismo = this.seleccionarMecanismo(configuracion, variables);
      
      // 3. EVALUAR MATERIALES
      const materiales = [];
      
      const evalWithContext = (expression) => {
        // Contexto seguro para evaluación
        return Function('"use strict"; const {ancho, alto, area, motorizado, esManual, rotada, galeria, sistema, color, modeloControl, tipoMando, ladoControl, tipoContrapeso, Math, Number} = this; return (' + expression + ')').call(variables);
      };

      if (configuracion.materiales && Array.isArray(configuracion.materiales)) {
         configuracion.materiales.forEach(matConfig => {
             // Verificar condición
             if (matConfig.condicion) {
                 try {
                     const cumple = evalWithContext(matConfig.condicion);
                     if (!cumple) return;
                 } catch (e) {
                     logger.warn(`Error evaluando condición material ${matConfig.tipo}: ${e.message}`);
                     return;
                 }
             }

             // Calcular cantidad
             let cantidad = 0;
             try {
                 let formula = matConfig.formula;
                 // Soporte para fórmula rotada específica si existiera en el esquema futuro
                 if (rotada && matConfig.formulaRotada) {
                     formula = matConfig.formulaRotada;
                 }
                 cantidad = evalWithContext(formula);
             } catch (e) {
                 logger.error(`Error evaluando fórmula material ${matConfig.tipo}: ${e.message}`);
             }

             // Personalizar descripción y código para telas según producto/modelo específico de la pieza
             let descripcion = matConfig.descripcion;
             let codigo = matConfig.codigo || matConfig.tipo.toUpperCase();

             if ((matConfig.tipo === 'Tela' || matConfig.tipo === 'Tela Sheer')) {
                 // Construir identificador único: Producto + Modelo + Color
                 const producto = pieza.producto && pieza.producto !== 'No especificado' ? pieza.producto : '';
                 const modelo = pieza.modelo && pieza.modelo !== 'No especificado' ? pieza.modelo : (pieza.modeloCodigo || '');
                 const color = pieza.color && pieza.color !== 'No especificado' ? pieza.color : '';
                 
                 // Crear variante descriptiva: "Producto Modelo (Color)"
                 let variante = [producto, modelo].filter(Boolean).join(' ').trim();
                 if (color) variante = variante ? `${variante} (${color})` : color;
                 
                 if (variante) {
                    descripcion = `${descripcion} [${variante}]`;
                    // Código único para agrupar: TELA-PRODUCTO-MODELO
                    const codigoVariante = [producto, modelo].filter(Boolean).join('-').substring(0,15).replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
                    if (codigoVariante) codigo = `${codigo}-${codigoVariante}`;
                 }
             }

             // Agregar material
             const material = {
                 tipo: matConfig.tipo,
                 codigo: codigo,
                 descripcion: descripcion,
                 cantidad: Number(cantidad) || 0,
                 unidad: matConfig.unidad,
                 observaciones: matConfig.observaciones,
                 rotada: rotada && (matConfig.tipo === 'Tela' || matConfig.tipo === 'Tela Sheer'),
                 anchosRollo: matConfig.anchosRollo
             };

             // Enriquecer con selección de Tubo
             if (material.tipo === 'Tubo' && tubo) {
                 material.codigo = tubo.codigo || material.codigo;
                 material.descripcion = tubo.descripcion || material.descripcion;
                 material.diametro = tubo.diametro;
             }
             
             // Enriquecer con selección de Mecanismo
             if ((material.tipo === 'Mecanismo' || material.tipo === 'Motor') && mecanismo) {
                 // Solo sobrescribir si es genérico o coincide el tipo
                 if (material.tipo === 'Motor' && mecanismo.esMotor) {
                     material.codigo = mecanismo.codigo;
                     material.descripcion = mecanismo.descripcion;
                 } else if (material.tipo === 'Mecanismo' && !mecanismo.esMotor) {
                     material.codigo = mecanismo.codigo;
                     material.descripcion = mecanismo.descripcion;
                 }
             }

             materiales.push(material);
         });
      }

      return materiales;

    } catch (error) {
      logger.error('Error calculando materiales (Dinámico)', {
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
    
    // EXTRAER PIEZAS DE TELA PARA OPTIMIZACIÓN
    const piezasParaTela = [];
    materialesPorPieza.forEach(mp => {
      // Filtrar solo materiales tipo Tela
      const telas = mp.materiales.filter(m => m.tipo === 'Tela' || m.tipo === 'Tela Sheer');
      
      telas.forEach(tela => {
        // Usar la información calculada en calcularMaterialesPieza
        // La 'cantidad' calculada YA incluye los márgenes correctos (0.25, 0.50, 0.03, etc.)
        const altoParaCorte = tela.cantidad;
        const esRotada = tela.rotada === true;
        
        // Definir ancho efectivo para agrupación (lo que ocupa en el rollo)
        let anchoEfectivo;
        
        if (esRotada) {
           // Si se rotó, el ancho en el rollo es el ALTO original de la pieza
           anchoEfectivo = mp.pieza.alto;
        } else {
           // Si no, es el ANCHO original
           anchoEfectivo = mp.pieza.ancho;
        }

        piezasParaTela.push({
           ancho: anchoEfectivo,
           alto: altoParaCorte, // Alto = Largo de corte calculado
           cantidad: 1, 
           ubicacion: mp.pieza.ubicacion,
           rotada: esRotada,
           anchoOriginal: mp.pieza.ancho,
           altoOriginal: mp.pieza.alto,
           margenAplicado: 0, // Ya incluido en 'alto'
           tela: {
             codigo: tela.codigo,
             descripcion: tela.descripcion,
             anchosRollo: tela.anchosRollo
           }
        });
      });
    });

    const resumenTelas = this.calcularTelasParaProduccion(piezasParaTela);
    
    // Cargar configuración para selección de tubos
    const sistema = piezas[0]?.sistema || 'Roller Shade';
    const configuracion = await ConfiguracionMateriales.findOne({ sistema }).lean();
    
    const resumenTubos = this.calcularTubosParaProduccion(
      piezas.map(p => ({ 
        ancho: p.ancho, 
        alto: p.alto,
        motorizado: p.motorizado || false,
        cantidad: 1 
      })),
      configuracion
    );
    
    return {
      materialesPorPieza,
      resumenTelas,
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
  
  /**
   * Extrae sobrantes de un resultado de optimización para registro en almacén
   * Solo extrae sobrantes >= 60cm (0.60m) que son útiles para reutilizar
   * @param {object} optimizacion - Resultado de optimizarCortes()
   * @param {object} infoMaterial - Info del material (tipo, codigo, diametro, etc.)
   * @returns {Array} Lista de sobrantes para registrar
   */
  static extraerSobrantesDeOptimizacion(optimizacion, infoMaterial) {
    const LONGITUD_MINIMA_SOBRANTE = 0.60; // 60cm mínimo útil para almacenar
    // Sin límite máximo - el encargado de taller decide
    
    const sobrantes = [];
    
    if (!optimizacion?.barras) return sobrantes;
    
    optimizacion.barras.forEach((barra, index) => {
      // Solo considerar sobrantes >= 60cm (útiles para reutilizar)
      if (barra.sobrante >= LONGITUD_MINIMA_SOBRANTE) {
        sobrantes.push({
          tipo: infoMaterial.tipo || 'Tubo',
          codigo: infoMaterial.codigo,
          descripcion: `Sobrante ${infoMaterial.descripcion || infoMaterial.tipo} - ${(barra.sobrante * 100).toFixed(0)}cm`,
          longitud: Number(barra.sobrante.toFixed(3)),
          diametro: infoMaterial.diametro,
          color: infoMaterial.color,
          subtipo: infoMaterial.subtipo,
          barraOrigen: index + 1,
          eficienciaBarra: barra.eficiencia
        });
      }
    });
    
    return sobrantes;
  }
  
  /**
   * Genera reporte completo de optimización incluyendo sobrantes para almacén
   * @param {Array} piezas - Piezas a optimizar
   * @returns {Promise<object>} Reporte con sobrantes identificados
   */
  static async generarReporteConSobrantes(piezas) {
    const reporte = await this.generarReporteOptimizacion(piezas);
    
    // Extraer sobrantes de tubos
    const sobrantesParaAlmacen = [];
    
    if (reporte.resumenTubos?.resumenPorTipo) {
      Object.entries(reporte.resumenTubos.resumenPorTipo).forEach(([codigo, datos]) => {
        const sobrantesTubo = this.extraerSobrantesDeOptimizacion(
          datos.optimizacion,
          {
            tipo: 'Tubo',
            codigo: codigo,
            descripcion: datos.tubo.descripcion,
            diametro: datos.tubo.diametro
          }
        );
        sobrantesParaAlmacen.push(...sobrantesTubo);
      });
    }
    
    // Agregar sobrantes al reporte
    reporte.sobrantesParaAlmacen = {
      items: sobrantesParaAlmacen,
      total: sobrantesParaAlmacen.length,
      longitudTotal: sobrantesParaAlmacen.reduce((sum, s) => sum + s.longitud, 0)
    };
    
    return reporte;
  }
  
  // ============================================================
  // CÁLCULO DE ESCUADRAS (GALERÍA)
  // ============================================================
  
  /**
   * Distancia de escuadras laterales desde el borde (metros)
   */
  static ESCUADRA_DISTANCIA_BORDE = 0.15;
  
  /**
   * Separación máxima entre escuadras intermedias (metros)
   */
  static ESCUADRA_SEPARACION_MAXIMA = 1.25;
  
  /**
   * Calcula la cantidad de escuadras necesarias para una galería
   * Reglas:
   * - 2 escuadras fijas en los costados (a 15cm del borde)
   * - Escuadras intermedias cada 1.25m máximo
   * 
   * @param {number} anchoGaleria - Ancho de la galería en metros
   * @returns {object} { total, laterales, intermedias, posiciones }
   */
  static calcularEscuadras(anchoGaleria) {
    const BORDE = this.ESCUADRA_DISTANCIA_BORDE;
    const MAX_SEP = this.ESCUADRA_SEPARACION_MAXIMA;
    
    // Siempre 2 escuadras laterales
    const laterales = 2;
    
    // Espacio interior (restando los 15cm de cada lado)
    const espacioInterior = anchoGaleria - (BORDE * 2);
    
    // Escuadras intermedias necesarias
    const intermedias = espacioInterior > MAX_SEP 
      ? Math.floor(espacioInterior / MAX_SEP)
      : 0;
    
    const total = laterales + intermedias;
    
    // Calcular posiciones para referencia
    const posiciones = [BORDE]; // Primera a 15cm
    if (intermedias > 0) {
      const separacionReal = espacioInterior / (intermedias + 1);
      for (let i = 1; i <= intermedias; i++) {
        posiciones.push(BORDE + (separacionReal * i));
      }
    }
    posiciones.push(anchoGaleria - BORDE); // Última a 15cm del final
    
    return {
      total,
      laterales,
      intermedias,
      espacioInterior: Math.round(espacioInterior * 100) / 100,
      posiciones: posiciones.map(p => Math.round(p * 100) / 100)
    };
  }
  
  /**
   * Calcula escuadras para múltiples piezas con galería
   * @param {Array} piezasConGaleria - [{numero, ubicacion, ancho}]
   * @returns {object} Resumen y detalle por pieza
   */
  static calcularEscuadrasMultiple(piezasConGaleria) {
    const detalle = piezasConGaleria.map(pieza => ({
      pieza: pieza.numero,
      ubicacion: pieza.ubicacion,
      ancho: pieza.ancho,
      ...this.calcularEscuadras(pieza.ancho)
    }));
    
    const totalEscuadras = detalle.reduce((sum, d) => sum + d.total, 0);
    
    return {
      totalEscuadras,
      totalPiezas: piezasConGaleria.length,
      detalle
    };
  }
  
  // ============================================================
  // OPTIMIZACIÓN DE MADERA (GALERÍA)
  // ============================================================
  
  /**
   * Longitud estándar de tabla de madera para galería (metros)
   */
  static LONGITUD_TABLA_ESTANDAR = 2.40;
  
  /**
   * Sobrante mínimo útil de madera (metros) - menor es desperdicio
   */
  static SOBRANTE_MINIMO_UTIL_MADERA = 0.45;
  
  /**
   * Optimiza cortes de madera para galerías
   * Reglas:
   * - Tabla estándar: 2.40m
   * - Sobrante útil mínimo: 0.45m (menor es desperdicio)
   * - Si ancho > 2.40m: se unen tablas
   * - Prioriza usar sobrantes del almacén antes de tablas nuevas
   * 
   * @param {Array} piezasConGaleria - Piezas que llevan galería [{ancho, ubicacion, numero}]
   * @param {Array} sobrantesDisponibles - Sobrantes de madera en almacén [{longitud, id}]
   * @returns {object} Plan de cortes optimizado
   */
  static optimizarCortesMadera(piezasConGaleria, sobrantesDisponibles = []) {
    const TABLA = this.LONGITUD_TABLA_ESTANDAR;
    const MINIMO_UTIL = this.SOBRANTE_MINIMO_UTIL_MADERA;
    
    // Ordenar piezas por número para mostrar en orden lógico
    const piezasOrdenadas = [...piezasConGaleria].sort((a, b) => a.numero - b.numero);
    
    // Clonar sobrantes disponibles para ir marcando los usados
    let sobrantesLibres = sobrantesDisponibles
      .filter(s => s.longitud >= MINIMO_UTIL)
      .map(s => ({ ...s, usado: false }))
      .sort((a, b) => a.longitud - b.longitud); // Menor a mayor para usar primero los más pequeños
    
    const planCortes = [];
    const tablasNuevasRequeridas = [];
    const sobrantesGenerados = [];
    const sobrantesUsados = [];
    let tablasNuevasCount = 0;
    
    for (const pieza of piezasOrdenadas) {
      const anchoRequerido = pieza.ancho;
      const corte = {
        pieza: pieza.numero,
        ubicacion: pieza.ubicacion,
        anchoRequerido,
        fuentes: [],
        sobrante: null,
        esUnion: false
      };
      
      // CASO 1: Ancho <= 2.40m - Una sola tabla o sobrante
      if (anchoRequerido <= TABLA) {
        // Buscar sobrante que sirva
        const sobranteUtil = sobrantesLibres.find(s => 
          !s.usado && s.longitud >= anchoRequerido
        );
        
        if (sobranteUtil) {
          // Usar sobrante existente
          sobranteUtil.usado = true;
          sobrantesUsados.push({
            id: sobranteUtil.id,
            longitud: sobranteUtil.longitud,
            usadoPara: anchoRequerido
          });
          
          corte.fuentes.push({
            tipo: 'sobrante',
            id: sobranteUtil.id,
            longitud: sobranteUtil.longitud,
            corte: anchoRequerido
          });
          
          const restante = sobranteUtil.longitud - anchoRequerido;
          if (restante >= MINIMO_UTIL) {
            corte.sobrante = { longitud: restante, util: true };
            sobrantesGenerados.push({ longitud: restante, origen: `Pieza #${pieza.numero}` });
          } else if (restante > 0) {
            corte.sobrante = { longitud: restante, util: false, desperdicio: true };
          }
        } else {
          // Usar tabla nueva
          tablasNuevasCount++;
          tablasNuevasRequeridas.push({
            numero: tablasNuevasCount,
            usadaPara: `Pieza #${pieza.numero}`,
            corte: anchoRequerido
          });
          
          corte.fuentes.push({
            tipo: 'tabla_nueva',
            numero: tablasNuevasCount,
            longitud: TABLA,
            corte: anchoRequerido
          });
          
          const restante = TABLA - anchoRequerido;
          if (restante >= MINIMO_UTIL) {
            corte.sobrante = { longitud: restante, util: true };
            sobrantesGenerados.push({ longitud: restante, origen: `Pieza #${pieza.numero}` });
            // Agregar a sobrantes libres para siguiente pieza
            sobrantesLibres.push({ longitud: restante, usado: false, id: `nuevo_${tablasNuevasCount}` });
            sobrantesLibres.sort((a, b) => a.longitud - b.longitud);
          } else if (restante > 0) {
            corte.sobrante = { longitud: restante, util: false, desperdicio: true };
          }
        }
      }
      // CASO 2: Ancho > 2.40m - Unión de tablas
      else {
        corte.esUnion = true;
        let restantePorCubrir = anchoRequerido;
        
        // Primero intentar con sobrantes grandes
        const sobrantesGrandes = sobrantesLibres
          .filter(s => !s.usado && s.longitud >= 1.00)
          .sort((a, b) => b.longitud - a.longitud);
        
        for (const sobrante of sobrantesGrandes) {
          if (restantePorCubrir <= 0) break;
          if (sobrante.usado) continue;
          
          const usarLongitud = Math.min(sobrante.longitud, restantePorCubrir);
          sobrante.usado = true;
          sobrantesUsados.push({
            id: sobrante.id,
            longitud: sobrante.longitud,
            usadoPara: usarLongitud
          });
          
          corte.fuentes.push({
            tipo: 'sobrante',
            id: sobrante.id,
            longitud: sobrante.longitud,
            corte: usarLongitud
          });
          
          restantePorCubrir -= usarLongitud;
          
          // Si queda sobrante útil
          const restanteSobrante = sobrante.longitud - usarLongitud;
          if (restanteSobrante >= MINIMO_UTIL) {
            sobrantesGenerados.push({ longitud: restanteSobrante, origen: `Pieza #${pieza.numero} (unión)` });
            sobrantesLibres.push({ longitud: restanteSobrante, usado: false, id: `resto_${sobrante.id}` });
          }
        }
        
        // Completar con tablas nuevas si falta
        while (restantePorCubrir > 0) {
          tablasNuevasCount++;
          const usarDeTabla = Math.min(TABLA, restantePorCubrir);
          
          tablasNuevasRequeridas.push({
            numero: tablasNuevasCount,
            usadaPara: `Pieza #${pieza.numero} (unión)`,
            corte: usarDeTabla
          });
          
          corte.fuentes.push({
            tipo: 'tabla_nueva',
            numero: tablasNuevasCount,
            longitud: TABLA,
            corte: usarDeTabla
          });
          
          restantePorCubrir -= usarDeTabla;
          
          // Sobrante de esta tabla (la última en la unión)
          const restanteTabla = TABLA - usarDeTabla;
          if (restanteTabla >= MINIMO_UTIL) {
            corte.sobrante = { longitud: restanteTabla, util: true };
            sobrantesGenerados.push({ longitud: restanteTabla, origen: `Pieza #${pieza.numero} (unión)` });
            sobrantesLibres.push({ longitud: restanteTabla, usado: false, id: `nuevo_${tablasNuevasCount}` });
            sobrantesLibres.sort((a, b) => a.longitud - b.longitud);
          } else if (restanteTabla > 0) {
            corte.sobrante = { longitud: restanteTabla, util: false, desperdicio: true };
          }
        }
      }
      
      planCortes.push(corte);
    }
    
    // Calcular totales
    const totalDesperdicio = planCortes.reduce((sum, c) => {
      if (c.sobrante && c.sobrante.desperdicio) {
        return sum + c.sobrante.longitud;
      }
      return sum;
    }, 0);
    
    const totalSobrantesUtiles = sobrantesGenerados.reduce((sum, s) => sum + s.longitud, 0);
    
    return {
      planCortes,
      resumen: {
        totalPiezas: piezasConGaleria.length,
        piezasConUnion: planCortes.filter(c => c.esUnion).length,
        tablasNuevasRequeridas: tablasNuevasCount,
        sobrantesUsadosDelAlmacen: sobrantesUsados.length,
        sobrantesGeneradosParaAlmacen: sobrantesGenerados.length,
        totalSobrantesUtiles: Math.round(totalSobrantesUtiles * 100) / 100,
        totalDesperdicio: Math.round(totalDesperdicio * 100) / 100
      },
      tablasNuevas: tablasNuevasRequeridas,
      sobrantesUsados,
      sobrantesGenerados,
      configuracion: {
        longitudTabla: TABLA,
        sobranteMinimoUtil: MINIMO_UTIL
      }
    };
  }
  
  /**
   * Calcula corte de madera para una sola pieza (sin optimización grupal)
   * Útil para cotizaciones rápidas
   * 
   * @param {number} anchoRequerido - Ancho de la galería en metros
   * @returns {object} Información del corte
   */
  static calcularCorteMaderaSingle(anchoRequerido) {
    const TABLA = this.LONGITUD_TABLA_ESTANDAR;
    const MINIMO_UTIL = this.SOBRANTE_MINIMO_UTIL_MADERA;
    
    if (anchoRequerido <= TABLA) {
      const sobrante = TABLA - anchoRequerido;
      return {
        tablasRequeridas: 1,
        esUnion: false,
        sobrante: {
          longitud: Math.round(sobrante * 100) / 100,
          util: sobrante >= MINIMO_UTIL
        },
        descripcion: sobrante >= MINIMO_UTIL 
          ? `1 tabla (sobrante útil: ${(sobrante * 100).toFixed(0)}cm)`
          : `1 tabla (desperdicio: ${(sobrante * 100).toFixed(0)}cm)`
      };
    } else {
      // Unión de tablas
      const tablasNecesarias = Math.ceil(anchoRequerido / TABLA);
      const totalMadera = tablasNecesarias * TABLA;
      const sobrante = totalMadera - anchoRequerido;
      
      return {
        tablasRequeridas: tablasNecesarias,
        esUnion: true,
        cortes: this._calcularCortesUnion(anchoRequerido, TABLA),
        sobrante: {
          longitud: Math.round(sobrante * 100) / 100,
          util: sobrante >= MINIMO_UTIL
        },
        descripcion: `${tablasNecesarias} tablas unidas (sobrante: ${(sobrante * 100).toFixed(0)}cm)`
      };
    }
  }
  
  /**
   * Helper: Calcula cómo dividir los cortes en una unión
   */
  static _calcularCortesUnion(anchoTotal, longitudTabla) {
    const cortes = [];
    let restante = anchoTotal;
    let tablaNum = 1;
    
    while (restante > 0) {
      const corte = Math.min(longitudTabla, restante);
      cortes.push({
        tabla: tablaNum,
        corte: Math.round(corte * 100) / 100,
        completa: corte === longitudTabla
      });
      restante -= corte;
      tablaNum++;
    }
    
    return cortes;
  }
}

module.exports = OptimizadorCortesService;
