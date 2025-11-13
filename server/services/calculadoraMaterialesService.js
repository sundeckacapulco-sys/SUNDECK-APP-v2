const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');
const logger = require('../config/logger');

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
      
      logger.info('Calculando materiales para pieza', {
        servicio: 'calculadoraMaterialesService',
        producto,
        sistema,
        ancho: pieza.ancho,
        alto: pieza.alto
      });
      
      // Buscar configuración aplicable
      const config = await this.obtenerConfiguracion(producto, sistema);
      
      if (!config) {
        logger.warn('No se encontró configuración, usando cálculo por defecto', {
          servicio: 'calculadoraMaterialesService',
          producto,
          sistema
        });
        return this.calcularPorDefecto(pieza);
      }
      
      // Calcular cada material según su fórmula
      const materiales = [];
      
      for (const materialConfig of config.materiales) {
        if (!materialConfig.activo) continue;
        
        // Evaluar condición si existe
        if (materialConfig.condicion) {
          const cumpleCondicion = this.evaluarCondicion(materialConfig.condicion, pieza);
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
        const cantidad = this.evaluarFormula(materialConfig.formula, pieza);
        
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
      return this.calcularPorDefecto(pieza);
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
      // Variables disponibles para las fórmulas
      const { ancho, alto, area, motorizado } = pieza;
      
      // Funciones auxiliares
      const Math = global.Math;
      
      // Evaluar fórmula de forma segura
      const resultado = eval(formula);
      
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
      // Variables disponibles
      const { ancho, alto, area, motorizado, galeria, sistema } = pieza;
      
      // Evaluar condición
      const resultado = eval(condicion);
      
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
  static calcularPorDefecto(pieza) {
    const materiales = [];
    const { ancho, alto, area, motorizado, galeria } = pieza;
    
    // Tela
    const areaTela = area * 1.1; // 10% merma
    materiales.push({
      tipo: 'Tela',
      descripcion: 'Tela estándar',
      cantidad: Number(areaTela.toFixed(2)),
      unidad: 'm²',
      observaciones: 'Incluye 10% de merma',
      precioUnitario: 0
    });
    
    // Tubo
    const largoTubo = ancho + 0.10;
    const diametro = ancho <= 1.5 ? 38 : ancho <= 2.5 ? 43 : 50;
    materiales.push({
      tipo: 'Tubo',
      descripcion: `Tubo ${diametro}mm`,
      cantidad: Number(largoTubo.toFixed(2)),
      unidad: 'ml',
      observaciones: `Diámetro ${diametro}mm`,
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
            formula: 'ancho + 0.10',
            observaciones: 'Diámetro según ancho',
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
}

module.exports = CalculadoraMaterialesService;
