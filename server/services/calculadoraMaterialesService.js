const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');

// Constantes para reglas de telas Enrollables
const ROLLO_BASE_ENROLLABLE = 2.5; // m
const ROLLO_FALLBACK_ENROLLABLE = 3.0; // m
const LONGITUD_ROLLO_ESTANDAR = 30; // ml
const EXTRA_SIN_GALERIA = 0.25; // m
const EXTRA_CON_GALERIA = 0.50; // m
const ROTACION_MAX_SIN_TERMOSELLO = 2.8; // m
const ROTACION_MAX_CON_TERMOSELLO = 3.5; // m

/**
 * Servicio de Calculadora de Materiales Inteligente
 * Calcula materiales basándose en configuraciones dinámicas
 */
class CalculadoraMaterialesService {
  
  /**
   * Calcular materiales para una pieza usando configuración
   */
  static async calcularMaterialesPieza(pieza, opciones = {}) {
    try {
      const { producto, sistema } = pieza;
      const piezaBase = {
        ...pieza,
        area: pieza.area ?? ((Number(pieza.ancho) || 0) * (Number(pieza.alto) || 0))
      };
      const piezaContexto = this.esSistemaEnrollables(sistema, producto)
        ? this.aplicarReglasTelaEnrollables(piezaBase)
        : piezaBase;
      
      logger.info('Calculando materiales para pieza', {
        servicio: 'calculadoraMaterialesService',
        producto,
        sistema,
        ancho: piezaContexto.ancho,
        alto: piezaContexto.alto,
        rolloSeleccionado: piezaContexto.rolloSeleccionado,
        rotada: piezaContexto.rotada
      });
      
      // Buscar configuración aplicable
      const config = await this.obtenerConfiguracion(producto, sistema);
      
      if (!config) {
        logger.warn('No se encontró configuración, usando cálculo por defecto', {
          servicio: 'calculadoraMaterialesService',
          producto,
          sistema
        });
        return this.calcularPorDefecto(piezaContexto);
      }
      
      // Calcular cada material según su fórmula
      const materiales = [];
      
      for (const materialConfig of config.materiales) {
        if (!materialConfig.activo) continue;
        
        // Evaluar condición si existe
        if (materialConfig.condicion) {
          const cumpleCondicion = this.evaluarCondicion(materialConfig.condicion, piezaContexto);
          if (!cumpleCondicion) {
            logger.debug('Material no aplica por condición', {
              servicio: 'calculadoraMaterialesService',
              material: materialConfig.tipo,
              condicion: materialConfig.condicion
            });
            continue;
          }
        }
        
        // Calcular cantidad usando fórmula
        const cantidad = this.evaluarFormula(materialConfig.formula, piezaContexto);
        
        materiales.push({
          tipo: materialConfig.tipo,
          descripcion: materialConfig.descripcion,
          cantidad: Number(cantidad.toFixed(2)),
          unidad: materialConfig.unidad,
          observaciones: materialConfig.observaciones || '',
          precioUnitario: materialConfig.precioUnitario || 0
        });
      }
      
      logger.info('Materiales calculados exitosamente', {
        servicio: 'calculadoraMaterialesService',
        totalMateriales: materiales.length
      });
      
      return materiales;
      
    } catch (error) {
      logger.error('Error calculando materiales', {
        servicio: 'calculadoraMaterialesService',
        error: error.message,
        stack: error.stack
      });
      
      // Fallback a cálculo por defecto
      return this.calcularPorDefecto(piezaContexto);
    }
  }
  
  /**
   * Obtener configuración aplicable
   */
  static async obtenerConfiguracion(producto, sistema) {
    try {
      // Buscar configuración específica
      let config = await ConfiguracionMateriales.findOne({
        producto: producto,
        sistema: sistema,
        activo: true
      }).lean();
      
      if (config) return config;
      
      // Buscar configuración solo por sistema
      config = await ConfiguracionMateriales.findOne({
        producto: { $exists: false },
        sistema: sistema,
        activo: true
      }).lean();
      
      if (config) return config;
      
      // Buscar configuración genérica
      config = await ConfiguracionMateriales.findOne({
        nombre: 'Configuración Genérica',
        activo: true
      }).lean();
      
      return config;
      
    } catch (error) {
      logger.error('Error obteniendo configuración', {
        servicio: 'calculadoraMaterialesService',
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Evaluar fórmula de cálculo
   */
  static evaluarFormula(formula, pieza) {
    try {
      const contexto = this.crearContextoEval(pieza);
      const fn = new Function(
        ...Object.keys(contexto),
        `return (${formula});`
      );
      const resultado = fn(...Object.values(contexto));
      
      return Number(resultado) || 0;
      
    } catch (error) {
      logger.error('Error evaluando fórmula', {
        servicio: 'calculadoraMaterialesService',
        formula,
        error: error.message
      });
      return 0;
    }
  }
  
  /**
   * Evaluar condición
   */
  static evaluarCondicion(condicion, pieza) {
    try {
      const contexto = this.crearContextoEval(pieza);
      const fn = new Function(
        ...Object.keys(contexto),
        `return (${condicion});`
      );
      const resultado = fn(...Object.values(contexto));
      
      return Boolean(resultado);
      
    } catch (error) {
      logger.error('Error evaluando condición', {
        servicio: 'calculadoraMaterialesService',
        condicion,
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Cálculo por defecto (fallback)
   */
  static calcularPorDefecto(pieza = {}) {
    const materiales = [];
    const piezaContexto = this.esSistemaEnrollables(pieza.sistema, pieza.producto)
      ? this.aplicarReglasTelaEnrollables({
          ...pieza,
          area: pieza.area ?? ((Number(pieza.ancho) || 0) * (Number(pieza.alto) || 0))
        })
      : {
          ...pieza,
          area: pieza.area ?? ((Number(pieza.ancho) || 0) * (Number(pieza.alto) || 0))
        };
    const { ancho, alto, area, motorizado, galeria, sistema } = piezaContexto;
    const esEnrollables = this.esSistemaEnrollables(sistema, piezaContexto.producto);
    
    // Tela
    if (esEnrollables) {
      const mlTela = Number(piezaContexto.mlTela || 0);
      materiales.push({
        tipo: 'Tela',
        descripcion: `Tela enrollable (rollo ${piezaContexto.rolloSeleccionado || ROLLO_BASE_ENROLLABLE}m)`,
        cantidad: Number(mlTela.toFixed(2)),
        unidad: 'ml',
        observaciones: `Alto efectivo ${Number(piezaContexto.altoEfectivo || 0).toFixed(2)}m. ${piezaContexto.requiereTermosello ? 'Requiere termosello.' : 'Sin termosello.'}`,
        precioUnitario: 0
      });
    } else {
      const areaTela = area * 1.1; // 10% merma
      materiales.push({
        tipo: 'Tela',
        descripcion: 'Tela estándar',
        cantidad: Number(areaTela.toFixed(2)),
        unidad: 'm²',
        observaciones: 'Incluye 10% de merma',
        precioUnitario: 0
      });
    }
    
    // Tubo (barra 5.80m, corte = ancho - 0.03m)
    const largoCorteTubo = Math.max(ancho - 0.03, 0);
    const diametro = ancho <= 1.5 ? 38 : ancho <= 2.5 ? 43 : 50;
    materiales.push({
      tipo: 'Tubo',
      descripcion: `Tubo ${diametro}mm (barra 5.80m)`,
      cantidad: Number(largoCorteTubo.toFixed(2)),
      unidad: 'ml',
      observaciones: 'Corte = ancho - 0.03m (barra base 5.80m)',
      precioUnitario: 0
    });

    // Contrapeso (mismo corte que el tubo)
    materiales.push({
      tipo: 'Contrapeso',
      descripcion: 'Contrapeso aluminio (barra 5.80m)',
      cantidad: Number(largoCorteTubo.toFixed(2)),
      unidad: 'ml',
      observaciones: 'Corte = ancho - 0.03m (barra base 5.80m)',
      precioUnitario: 0
    });
    
    // Soportes
    const cantidadSoportes = ancho <= 1.5 ? 2 : ancho <= 3.0 ? 3 : 4;
    materiales.push({
      tipo: 'Soportes',
      descripcion: 'Soporte universal',
      cantidad: cantidadSoportes,
      unidad: 'pza',
      observaciones: cantidadSoportes > 2 ? 'Incluye soportes centrales' : 'Izquierdo y derecho',
      precioUnitario: 0
    });
    
    // Mecanismo o Motor
    if (motorizado) {
      materiales.push({
        tipo: 'Motor',
        descripcion: 'Motor tubular',
        cantidad: 1,
        unidad: 'pza',
        observaciones: 'Incluye control remoto',
        precioUnitario: 0
      });
    } else {
      materiales.push({
        tipo: 'Mecanismo',
        descripcion: 'Mecanismo cadena',
        cantidad: 1,
        unidad: 'kit',
        observaciones: 'Manual',
        precioUnitario: 0
      });
    }
    
    // Galería
    if (galeria && galeria !== 'sin_galeria') {
      materiales.push({
        tipo: 'Galería',
        descripcion: galeria,
        cantidad: Number(ancho.toFixed(2)),
        unidad: 'ml',
        observaciones: '',
        precioUnitario: 0
      });
    }
    
    // Herrajes
    materiales.push({
      tipo: 'Herrajes',
      descripcion: `Kit de fijación`,
      cantidad: cantidadSoportes,
      unidad: 'kit',
      observaciones: 'Incluye taquetes y tornillos',
      precioUnitario: 0
    });
    
    return materiales;
  }
  
  /**
   * Crear configuración inicial
   */
  static async crearConfiguracionInicial() {
    try {
      // Verificar si ya existe
      const existe = await ConfiguracionMateriales.findOne({ nombre: 'Configuración Genérica' });
      if (existe) {
        logger.info('Configuración inicial ya existe');
        return existe;
      }
      
      const config = new ConfiguracionMateriales({
        nombre: 'Configuración Genérica',
        sistema: 'Enrollable',
        materiales: [
          {
            tipo: 'Tela',
            descripcion: 'Tela estándar',
            unidad: 'm²',
            formula: 'area * 1.1',
            observaciones: 'Incluye 10% de merma',
            activo: true
          },
          {
            tipo: 'Tubo',
            descripcion: 'Tubo según ancho',
            unidad: 'ml',
            formula: 'Math.max(ancho - 0.03, 0)',
            observaciones: 'Corte = ancho - 0.03m (barra 5.80m)',
            activo: true
          },
          {
            tipo: 'Contrapeso',
            descripcion: 'Contrapeso aluminio',
            unidad: 'ml',
            formula: 'Math.max(ancho - 0.03, 0)',
            observaciones: 'Corte = ancho - 0.03m (barra 5.80m)',
            activo: true
          },
          {
            tipo: 'Soportes',
            descripcion: 'Soporte universal',
            unidad: 'pza',
            formula: 'ancho <= 1.5 ? 2 : ancho <= 3.0 ? 3 : 4',
            observaciones: 'Cantidad según ancho',
            activo: true
          },
          {
            tipo: 'Motor',
            descripcion: 'Motor tubular',
            unidad: 'pza',
            formula: '1',
            condicion: 'motorizado === true',
            observaciones: 'Solo si es motorizado',
            activo: true
          },
          {
            tipo: 'Mecanismo',
            descripcion: 'Mecanismo cadena',
            unidad: 'kit',
            formula: '1',
            condicion: 'motorizado !== true',
            observaciones: 'Solo si es manual',
            activo: true
          },
          {
            tipo: 'Herrajes',
            descripcion: 'Kit de fijación',
            unidad: 'kit',
            formula: 'ancho <= 1.5 ? 2 : ancho <= 3.0 ? 3 : 4',
            observaciones: 'Incluye taquetes y tornillos',
            activo: true
          }
        ],
        activo: true
      });
      
      await config.save();
      
      logger.info('Configuración inicial creada', {
        servicio: 'calculadoraMaterialesService',
        configId: config._id
      });
      
      return config;
      
    } catch (error) {
      logger.error('Error creando configuración inicial', {
        servicio: 'calculadoraMaterialesService',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Determina si la pieza pertenece al sistema de enrollables
   */
  static esSistemaEnrollables(sistema = '', producto = '') {
    const text = `${sistema} ${producto}`.toLowerCase();
    return text.includes('enrollable') || text.includes('roller');
  }

  /**
   * Prepara variables especializadas para cálculo de tela en enrollables
   */
  static aplicarReglasTelaEnrollables(pieza = {}) {
    const anchoTerminado = Number(pieza.ancho) || 0;
    const altoTerminado = Number(pieza.alto) || 0;
    const area = pieza.area ?? (anchoTerminado * altoTerminado);
    const galeriaActiva = Boolean(pieza.galeria && pieza.galeria !== 'sin_galeria');
    const extraTela = galeriaActiva ? EXTRA_CON_GALERIA : EXTRA_SIN_GALERIA;

    const rotacionForzada = pieza.rotadaForzada === true;
    const rotacionMarcada = pieza.rotada === true || pieza.detalle === 'rotada' || pieza.detalleTecnico === 'rotada';
    const rotacionBloqueada = pieza.rotada === false;
    const rotacionNecesaria = anchoTerminado > ROLLO_FALLBACK_ENROLLABLE;
    const alturaPermiteRotacion = altoTerminado <= ROTACION_MAX_CON_TERMOSELLO;

    let rotacionPermitida = alturaPermiteRotacion;
    if (!alturaPermiteRotacion && (rotacionMarcada || rotacionForzada || rotacionNecesaria)) {
      logger.warn('Rotación no permitida por altura', {
        servicio: 'calculadoraMaterialesService',
        ancho: anchoTerminado,
        alto: altoTerminado
      });
    }

    let rotadaCalculada = false;
    if (rotacionForzada) {
      rotadaCalculada = true;
    } else if (rotacionMarcada && rotacionPermitida) {
      rotadaCalculada = true;
    } else if (!rotacionMarcada && !rotacionBloqueada && rotacionNecesaria && rotacionPermitida) {
      rotadaCalculada = true;
    }

    const requiereTermosello = rotadaCalculada && altoTerminado > ROTACION_MAX_SIN_TERMOSELLO;
    const anchoUtil = rotadaCalculada ? altoTerminado : anchoTerminado;

    let rolloSeleccionado = Number(pieza.anchoTela) || null;
    let rolloEsManual = Boolean(rolloSeleccionado);
    if (!rolloSeleccionado || rolloSeleccionado <= 0) {
      rolloSeleccionado = anchoUtil <= ROLLO_BASE_ENROLLABLE ? ROLLO_BASE_ENROLLABLE : ROLLO_FALLBACK_ENROLLABLE;
      rolloEsManual = false;
    }

    const cumpleRollo = anchoUtil <= rolloSeleccionado + 1e-6;
    if (!cumpleRollo) {
      logger.warn('Ancho supera ancho de rollo seleccionado', {
        servicio: 'calculadoraMaterialesService',
        anchoUtil,
        rolloSeleccionado
      });
    }

    const altoEfectivo = (rotadaCalculada ? anchoTerminado : altoTerminado) + extraTela;
    const mlTela = Math.max(altoEfectivo, 0);
    const fraccionRollo = rolloSeleccionado ? mlTela / LONGITUD_ROLLO_ESTANDAR : 0;

    return {
      ...pieza,
      area,
      galeriaActiva,
      extraTela,
      rotada: rotadaCalculada,
      rotadaOriginal: pieza.rotada,
      rotacionForzada,
      rotacionNecesaria,
      rotacionPermitida,
      requiereTermosello,
      rolloSeleccionado,
      rolloEsManual,
      rolloDisponible: cumpleRollo,
      anchoUtil,
      altoEfectivo,
      mlTela,
      fraccionRollo,
      rollosConsumidos: fraccionRollo,
      LONGITUD_ROLLO_ESTANDAR
    };
  }

  /**
   * Crea contexto seguro para evaluar fórmulas/condiciones
   */
  static crearContextoEval(pieza = {}) {
    const ancho = Number(pieza.ancho) || 0;
    const alto = Number(pieza.alto) || 0;
    const area = pieza.area ?? (ancho * alto);
    return {
      Math: global.Math,
      Number: global.Number,
      ancho,
      alto,
      area,
      motorizado: Boolean(pieza.motorizado),
      galeria: pieza.galeria,
      sistema: pieza.sistema,
      producto: pieza.producto,
      rotada: Boolean(pieza.rotada),
      rotacionForzada: Boolean(pieza.rotacionForzada),
      rotacionPermitida: Boolean(pieza.rotacionPermitida),
      rotacionNecesaria: Boolean(pieza.rotacionNecesaria),
      requiereTermosello: Boolean(pieza.requiereTermosello),
      rolloSeleccionado: Number(pieza.rolloSeleccionado) || ROLLO_BASE_ENROLLABLE,
      rolloEsManual: Boolean(pieza.rolloEsManual),
      rolloDisponible: pieza.rolloDisponible !== undefined ? Boolean(pieza.rolloDisponible) : true,
      anchoUtil: Number(pieza.anchoUtil || ancho),
      altoEfectivo: Number(pieza.altoEfectivo || alto),
      mlTela: Number(pieza.mlTela || alto),
      fraccionRollo: Number(pieza.fraccionRollo || 0),
      rollosConsumidos: Number(pieza.rollosConsumidos || 0),
      extraTela: Number(pieza.extraTela || 0),
      galeriaActiva: Boolean(pieza.galeriaActiva),
      LONGITUD_ROLLO_ESTANDAR
    };
  }
}

module.exports = CalculadoraMaterialesService;
