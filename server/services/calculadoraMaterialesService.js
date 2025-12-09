const Almacen = require('../models/Almacen');
const SobranteMaterial = require('../models/SobranteMaterial');
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
   * Simular Consumo (Prueba Rápida)
   * @param {object} datosPieza - Datos de la pieza a simular
   * @returns {Promise<object>} Resultado de la simulación
   */
  static async simularConsumo(datosPieza) {
    try {
      // 1. Calcular materiales teóricos
      const materiales = await this.calcularMaterialesPieza(datosPieza);
      const tela = materiales.find(m => m.tipo === 'Tela');
      
      if (!tela) {
        throw new Error('No se pudo calcular la tela para esta pieza');
      }

      const anchoRollo = datosPieza.anchoRollo || 2.50; // Default 2.50 si no se especifica
      const consumoML = tela.cantidad;
      const anchoPieza = Number(datosPieza.ancho);
      const altoPieza = Number(datosPieza.alto);
      
      // 2. Verificar Stock y Sobrantes
      const resultado = {
        pieza: {
          ancho: anchoPieza,
          alto: altoPieza,
          descripcion: datosPieza.descripcion || 'Pieza simulada'
        },
        consumo: {
          ml: consumoML,
          rolloBase: anchoRollo,
          descripcion: tela.descripcion
        },
        stock: {
          disponible: false,
          mensaje: 'No hay stock suficiente',
          origen: 'Ninguno'
        },
        desperdicio: {
          ml: 0,
          porcentaje: 0,
          mensaje: ''
        },
        recomendacion: {
          aplicarDescuento: false,
          porcentaje: 0,
          mensaje: ''
        }
      };

      // Buscar sobrantes compatibles
      // Buscar un sobrante que cubra el consumo requerido (con un pequeño margen de 0.05m)
      const sobrante = await SobranteMaterial.findOne({
        tipo: 'Tela',
        longitud: { $gte: consumoML },
        estado: 'disponible'
        // Aquí se podría filtrar por código/color si viniera en los datos
      }).sort({ longitud: 1 }); // El más pequeño que sirva

      if (sobrante) {
        const desperdicioSobrante = sobrante.longitud - consumoML;
        resultado.stock = {
          disponible: true,
          mensaje: `Usar sobrante ID: ${sobrante.etiqueta || sobrante._id}`,
          origen: 'Sobrante',
          detalle: sobrante
        };
        resultado.desperdicio = {
          ml: desperdicioSobrante,
          porcentaje: (desperdicioSobrante / sobrante.longitud) * 100,
          mensaje: `Sobrante original: ${sobrante.longitud}m. Nuevo sobrante: ${desperdicioSobrante.toFixed(2)}m`
        };
        
        // Lógica de Descuento por Sobrante
        if (desperdicioSobrante < 0.5) { // Menos de 50cm de desperdicio del sobrante
          resultado.recomendacion = {
            aplicarDescuento: true,
            porcentaje: 10,
            mensaje: 'Recomendación Comercial: Esta pieza aprovecha un sobrante casi exacto. Conviene ofrecer un 10% de descuento.'
          };
        } else {
           resultado.recomendacion = {
            aplicarDescuento: true,
            porcentaje: 5,
            mensaje: 'Recomendación Comercial: Se utiliza material de sobrantes. Posible descuento del 5%.'
          };
        }

      } else {
        // Verificar en Rollos Nuevos (Almacén)
        // Buscar rollos de tela que coincidan (simulado por ahora genérico "Tela")
        const stockNuevo = await Almacen.findOne({ 
          tipo: 'Tela', 
          cantidad: { $gte: consumoML } 
        });

        if (stockNuevo) {
           resultado.stock = {
            disponible: true,
            mensaje: 'Disponible en rollos nuevos',
            origen: 'Almacén',
            detalle: { descripcion: stockNuevo.descripcion, cantidad: stockNuevo.cantidad }
          };
          
          // Desperdicio sobre el ANCHO del rollo (no ML)
          // Si el ancho del rollo es 2.50 y la pieza usa 1.20, sobra 1.30 de ancho x Largo
          const desperdicioAncho = Math.max(anchoRollo - anchoPieza, 0);
          const areaDesperdicio = desperdicioAncho * consumoML;
          const areaTotalConsumida = anchoRollo * consumoML;
          const porcentajeDesperdicio = (areaDesperdicio / areaTotalConsumida) * 100;

          resultado.desperdicio = {
             ml: 0, // En ML se consume lo que se pide
             porcentaje: porcentajeDesperdicio,
             mensaje: `Se utiliza ancho ${anchoPieza}m de rollo ${anchoRollo}m. Desperdicio lateral: ${desperdicioAncho.toFixed(2)}m (${porcentajeDesperdicio.toFixed(1)}%)`
          };

          if (porcentajeDesperdicio < 5) {
             resultado.recomendacion = {
              aplicarDescuento: true,
              porcentaje: 5,
              mensaje: 'Recomendación Comercial: Aprovechamiento de ancho casi total. Posible descuento 5%.'
            };
          }
        }
      }

      return resultado;

    } catch (error) {
      logger.error('Error en simulación de consumo', { error: error.message });
      throw error;
    }
  }
  
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
   * Cálculo por defecto (fallback) - 10 COMPONENTES ENROLLABLE TECNOSHADES
   * 1. Tapas para soporte | 2. Soporte | 3. Mecanismo | 4. Tubo
   * 5. Conector cadena | 6. Tope cadena | 7. Cadena HD | 8. Tela
   * 9. Base Pocket | 10. Contrapeso Base Pocket
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
    
    // Corte estándar para tubo, base pocket y contrapeso
    const largoCorteTubo = Math.max(ancho - 0.03, 0);
    // Diámetro de tubo según ancho
    const diametro = ancho <= 1.5 ? 38 : ancho <= 2.5 ? 43 : 50;
    // Cantidad de soportes según ancho
    const cantidadSoportes = ancho <= 1.5 ? 2 : ancho <= 3.0 ? 3 : 4;
    
    // ===== 10 COMPONENTES ENROLLABLE TECNOSHADES =====
    
    // 1. TAPAS PARA SOPORTE (2 pzas: izquierda y derecha)
    materiales.push({
      tipo: 'Tapas',
      descripcion: 'Tapas para soporte',
      cantidad: 2,
      unidad: 'pza',
      observaciones: 'Izquierda y derecha',
      precioUnitario: 0
    });
    
    // 2. SOPORTES (2 pzas mínimo, más si ancho > 1.5m)
    materiales.push({
      tipo: 'Soportes',
      descripcion: `Soporte ${diametro}mm`,
      cantidad: cantidadSoportes,
      unidad: 'pza',
      observaciones: cantidadSoportes > 2 ? 'Incluye soportes centrales' : 'Izquierdo y derecho',
      precioUnitario: 0
    });
    
    // 3. MECANISMO o MOTOR
    let descripcionMecanismo = 'Mecanismo cadena';
    let debeMotorizar = false;
    let noFabricar = false;
    let descripcionMotor = 'Motor tubular'; // Default

    const esDuoline = ['Sheer', 'Zebra', 'Duo', 'Duoline'].some(t => piezaContexto.producto?.includes(t));

    // Lógica de selección de mecanismo TecnoShades (Solo Manual)
    if (!motorizado) {
        if (ancho <= 1.2 && alto <= 1.5) {
          descripcionMecanismo = 'Mecanismo SL-10';
        } else if (ancho <= 2.0 && alto <= 3.0) {
          descripcionMecanismo = 'Mecanismo SL-16';
        } else if (ancho <= 2.5 && alto <= 3.5) {
          if (ancho > 2.2 && alto > 3.0) debeMotorizar = true;
          else descripcionMecanismo = 'Mecanismo SL-20';
        } else if (ancho <= 2.9 && alto <= 5.0) {
           if (ancho > 2.5 || alto > 4.0) debeMotorizar = true;
           else descripcionMecanismo = 'Mecanismo R-24';
        } else {
          if (ancho > 4.5 || alto > 6.0) noFabricar = true;
          else debeMotorizar = true;
        }
        
        if ((ancho * alto) > 7.5) debeMotorizar = true;
    }

    // Lógica de Selección de MOTOR
    if (motorizado || debeMotorizar) {
        if (esDuoline) {
            // --- TABLA MOTORES DUOLINE ---
            // Verde Claro (Pequeño): 25MM BATTERY 1.1Nm
            if (ancho <= 1.8 && alto <= 1.8) {
                descripcionMotor = 'Motor RF 25MM BATTERY SYSTEM 1.1Nm';
            }
            // Verde Oscuro (Medio): 35MM SG 1L BATTERY 3Nm (Prioridad sobre amarillo en zonas bajas)
            else if (ancho <= 2.5 && alto <= 2.8) {
                descripcionMotor = 'Motor RF 35MM SG 1L BATTERY SYSTEM (3Nm)';
            }
            // Amarillo (Grande/Alto): 35MM 1L SG WIFI 6Nm
            else if (ancho <= 3.8 && alto <= 3.5) {
                descripcionMotor = 'Motor RF 35MM 1L SG WIFI (6Nm)';
            }
            // Blanco (Muy Grande): 35MM 1L T. ELECTRONICO 10Nm
            else {
                descripcionMotor = 'Motor RF 35MM 1L T. ELECTRONICO (10Nm)';
            }
        } else {
            // --- TABLA MOTORES ENROLLABLES ---
            // Verde Claro: 25MM BATTERY 1.1Nm
            if (ancho <= 2.0 && alto <= 2.0) {
                descripcionMotor = 'Motor RF 25MM BATTERY SYSTEM 1.1Nm';
            }
            // Naranja: 35MM SG 1L BATTERY 3Nm
            else if (ancho <= 2.5 && alto <= 3.3) {
                descripcionMotor = 'Motor RF 35MM SG 1L BATTERY SYSTEM (3Nm)';
            }
            // Amarillo: 35MM 1L SG WIFI 6Nm
            else if (ancho <= 3.5 && alto <= 3.8) {
                descripcionMotor = 'Motor RF 35MM 1L SG WIFI (6Nm)';
            }
            // Verde Oscuro: 35MM 1L T. ELECTRONICO 10Nm (Zona central)
            else if (ancho <= 4.0 && alto <= 4.0) {
                descripcionMotor = 'Motor RF 35MM 1L T. ELECTRONICO (10Nm)';
            }
            // Azul (Muy Grande): 45MM 1L SG SILENCIOSO / ALAMBRICO
            else if (ancho <= 6.0 && alto <= 5.0) {
                descripcionMotor = 'Motor RF 45MM 1L SG SILENCIOSO TE (10Nm)';
            }
            // Gris (Gigante): 45MM 50N
            else {
                 descripcionMotor = 'Motor 45MM 50N';
            }
        }
    }

    if (motorizado || debeMotorizar) {
      materiales.push({
        tipo: 'Motor',
        descripcion: descripcionMotor,
        cantidad: 1,
        unidad: 'pza',
        observaciones: debeMotorizar ? '⚠️ RECOMENDADO MOTORIZAR POR DIMENSIONES' : 'Incluye control remoto',
        precioUnitario: 0,
        metadata: { esDuoline }
      });
    } else if (noFabricar) {
      materiales.push({
        tipo: 'Mecanismo',
        descripcion: 'NO FABRICAR',
        cantidad: 1,
        unidad: 'pza',
        observaciones: '⛔ DIMENSIONES FUERA DE RANGO',
        precioUnitario: 0
      });
    } else {
      materiales.push({
        tipo: 'Mecanismo',
        descripcion: descripcionMecanismo,
        cantidad: 1,
        unidad: 'pza',
        observaciones: 'Incluye clutch',
        precioUnitario: 0
      });
      
      // 5. CONECTOR CADENA (solo manual)
      materiales.push({
        tipo: 'Conector Cadena',
        descripcion: 'Conector de cadena',
        cantidad: 1,
        unidad: 'pza',
        observaciones: '',
        precioUnitario: 0
      });
      
      // 6. TOPE CADENA (solo manual)
      materiales.push({
        tipo: 'Tope Cadena',
        descripcion: 'Tope de cadena',
        cantidad: 1,
        unidad: 'pza',
        observaciones: '',
        precioUnitario: 0
      });
      
      // 7. CADENA HD
      // Fórmula: (Alto - Alto/3) × 2
      // Si es doble altura (especificado en levantamiento), se duplica
      const esDobleAltura = piezaContexto.dobleAltura || piezaContexto.detalleTecnico?.includes('doble altura');
      const altoEfectivoCadena = alto - (alto / 3); // Quitar 1/3 del alto
      let largoCadena = altoEfectivoCadena * 2;
      
      if (esDobleAltura) {
        largoCadena = largoCadena * 2; // Duplicar si es doble altura
      }
      
      materiales.push({
        tipo: 'Cadena',
        descripcion: esDobleAltura ? 'Cadena HD (Doble Altura)' : 'Cadena HD',
        cantidad: Number(largoCadena.toFixed(2)),
        unidad: 'ml',
        observaciones: `(${alto.toFixed(2)} - ${(alto/3).toFixed(2)}) × 2${esDobleAltura ? ' × 2 (doble altura)' : ''} = ${largoCadena.toFixed(2)}m`,
        precioUnitario: 0
      });
    }
    
    // 4. TUBO (barra 5.80m, corte = ancho - 0.03m)
    // Selección de Tubo según Tabla de Especificaciones TecnoLine
    let descripcionTubo = 'Tubo 1 1/2" Delgado (38mm)';
    let diametroTubo = 38;
    let noFabricarTubo = false;

    if (ancho <= 2.0 && alto <= 2.5) {
      descripcionTubo = 'Tubo 1 1/2" Delgado (38mm)';
      diametroTubo = 38;
    } else if ((ancho <= 2.5 && alto <= 3.0) || (ancho <= 2.0 && alto <= 4.1)) {
      descripcionTubo = 'Tubo 1 1/2" Reforzado (38mm)';
      diametroTubo = 38;
    } else if ((ancho <= 3.1 && alto <= 3.0) || (ancho <= 2.9 && alto <= 5.0) || (ancho <= 2.0 && alto <= 5.0)) {
      descripcionTubo = 'Tubo 2" (50mm)';
      diametroTubo = 50;
    } else if (ancho <= 4.0 && alto <= 4.2) {
      descripcionTubo = 'Tubo 2 1/2" (70mm)';
      diametroTubo = 70;
    } else if ((ancho <= 5.0 && alto <= 4.2) || (ancho <= 4.5 && alto <= 5.0)) { // Zona amarilla incluida
      descripcionTubo = 'Tubo 3" (80mm)';
      diametroTubo = 80;
    } else {
      descripcionTubo = 'NO FABRICAR (Tubo fuera de rango)';
      noFabricarTubo = true;
    }
    
    // Si la altura es mayor a 6m, requiere autorización (zona beige)
    if (alto > 6.0 && !noFabricarTubo) {
      descripcionTubo += ' ⚠️ REQUIERE AUTORIZACIÓN (Alto > 6m)';
    }

    if (!noFabricarTubo) {
      materiales.push({
        tipo: 'Tubo',
        descripcion: `${descripcionTubo} (barra 5.80m)`,
        cantidad: Number(largoCorteTubo.toFixed(2)),
        unidad: 'ml',
        observaciones: `Corte = ${largoCorteTubo.toFixed(2)}m (ancho - 0.03m)`,
        precioUnitario: 0,
        metadata: { diametro: diametroTubo, longitudBarra: 5.80 }
      });
    } else {
      materiales.push({
        tipo: 'Tubo',
        descripcion: 'NO FABRICAR',
        cantidad: 0,
        unidad: 'ml',
        observaciones: '⛔ DIMENSIONES DE TUBO FUERA DE RANGO',
        precioUnitario: 0
      });
    }
    
    // 8. TELA
    if (esEnrollables) {
      const mlTela = Number(piezaContexto.mlTela || alto + 0.25);
      materiales.push({
        tipo: 'Tela',
        descripcion: `Tela enrollable (rollo ${piezaContexto.rolloSeleccionado || ROLLO_BASE_ENROLLABLE}m)`,
        cantidad: Number(mlTela.toFixed(2)),
        unidad: 'ml',
        observaciones: `Alto efectivo ${Number(piezaContexto.altoEfectivo || alto).toFixed(2)}m. ${piezaContexto.requiereTermosello ? 'Requiere termosello.' : 'Sin termosello.'}`,
        precioUnitario: 0,
        metadata: { 
          anchoRollo: piezaContexto.rolloSeleccionado || ROLLO_BASE_ENROLLABLE,
          rotada: piezaContexto.rotada || false
        }
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
    
    // 9. CONTRAPESO (Plano o Ovalado según condiciones)
    // - Rotada → Plano
    // - Con galería → Plano
    // - Cliente solicita → Plano (viene en pieza.tipoContrapeso)
    // - Default → Ovalado
    const usarContrapesoPlano = piezaContexto.rotada || 
                                 (galeria && galeria !== 'sin_galeria' && galeria !== 'Sin galería') ||
                                 piezaContexto.tipoContrapeso === 'plano';
    const tipoContrapeso = usarContrapesoPlano ? 'Plano' : 'Ovalado';
    
    materiales.push({
      tipo: 'Contrapeso',
      descripcion: `Contrapeso ${tipoContrapeso} (barra 5.80m)`,
      cantidad: Number(largoCorteTubo.toFixed(2)),
      unidad: 'ml',
      observaciones: `Corte = ${largoCorteTubo.toFixed(2)}m | ${usarContrapesoPlano ? (piezaContexto.rotada ? 'Rotada' : 'Con galería') : 'Estándar'}`,
      precioUnitario: 0,
      metadata: { longitudBarra: 5.80, tipoContrapeso }
    });
    
    // ===== COMPONENTES ADICIONALES (OPCIONALES) =====
    
    // GALERÍA (si aplica)
    if (galeria && galeria !== 'sin_galeria' && galeria !== 'Sin galería') {
      materiales.push({
        tipo: 'Galería',
        descripcion: `Galería ${galeria}`,
        cantidad: Number(ancho.toFixed(2)),
        unidad: 'ml',
        observaciones: 'Corte = ancho',
        precioUnitario: 0
      });
    }
    
    // HERRAJES / KIT DE FIJACIÓN
    materiales.push({
      tipo: 'Herrajes',
      descripcion: 'Kit de fijación',
      cantidad: cantidadSoportes,
      unidad: 'kit',
      observaciones: 'Taquetes y tornillos por soporte',
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

    // REGLA DE METROS LINEALES:
    // - Normal: ML = Alto + extraTela (0.25 sin galería, 0.50 con galería)
    // - Rotada: ML = Ancho (SIN extra, porque ya no enrolla en esa dirección)
    const altoEfectivo = rotadaCalculada 
      ? anchoTerminado  // Rotada: solo el ancho, sin extra
      : (altoTerminado + extraTela);  // Normal: alto + extra
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
      ...pieza,
      Math: global.Math,
      Number: global.Number,
      ancho,
      alto,
      area,
      motorizado: Boolean(pieza.motorizado),
      galeria: pieza.galeria,
      sistema: pieza.sistema,
      producto: pieza.producto,
      tipoContrapeso: pieza.tipoContrapeso || null, // Evitar ReferenceError en pruebas
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
