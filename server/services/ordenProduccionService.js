const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const CalculadoraMaterialesService = require('./calculadoraMaterialesService');
const OptimizadorCortesService = require('./optimizadorCortesService');
const AlmacenProduccionService = require('./almacenProduccionService');

/**
 * Servicio para generar Orden de Producción
 * Calcula materiales (BOM) y prepara datos para PDF
 */
class OrdenProduccionService {
  
  /**
   * Procesar orden de producción con integración de almacén
   * @param {string} proyectoId - ID del proyecto
   * @param {string} usuarioId - ID del usuario
   * @param {object} opciones - Opciones de procesamiento
   * @returns {Promise<object>} Resultado del procesamiento
   */
  static async procesarOrdenConAlmacen(proyectoId, usuarioId, opciones = {}) {
    try {
      const proyecto = await Proyecto.findById(proyectoId).lean();
      
      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }
      
      // Obtener piezas
      const piezas = this.obtenerPiezasConDetallesTecnicos(proyecto);
      
      // Procesar con almacén
      const resultado = await AlmacenProduccionService.procesarOrdenProduccion({
        proyectoId,
        ordenProduccion: proyecto.numero || `OP-${proyectoId.toString().slice(-6)}`,
        piezas,
        usuarioId
      });
      
      logger.info('Orden procesada con almacén', {
        servicio: 'ordenProduccionService',
        proyectoId,
        success: resultado.success,
        materialesUsados: resultado.materiales?.length || 0,
        sobrantesGenerados: resultado.sobrantes?.length || 0
      });
      
      return resultado;
      
    } catch (error) {
      logger.error('Error procesando orden con almacén', {
        servicio: 'ordenProduccionService',
        proyectoId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Obtener datos completos para Orden de Producción
   */
  static async obtenerDatosOrdenProduccion(proyectoId) {
    try {
      const proyecto = await Proyecto.findById(proyectoId).lean();

      if (!proyecto) {
        throw new Error('Proyecto no encontrado');
      }

      logger.info('Generando orden de producción', {
        servicio: 'ordenProduccionService',
        accion: 'obtenerDatosOrdenProduccion',
        proyectoId: proyectoId.toString()
      });

      // Obtener piezas normalizadas con todos los campos técnicos
      const piezas = this.obtenerPiezasConDetallesTecnicos(proyecto);

      // Calcular BOM (Bill of Materials) por pieza usando optimizador inteligente
      const piezasConBOM = [];
      for (const pieza of piezas) {
        // Usar optimizador de cortes que incluye lógica de negocio + configuración BD
        const materiales = await OptimizadorCortesService.calcularMaterialesPieza(pieza);
        piezasConBOM.push({
          ...pieza,
          materiales
        });
      }
      
      // Generar reporte de optimización de tubos
      const reporteOptimizacion = await OptimizadorCortesService.generarReporteOptimizacion(piezas);

      // Calcular materiales totales
      const materialesConsolidados = this.consolidarMaterialesTotales(piezasConBOM);

      // Preparar datos para el PDF
      const datosOrden = {
        // Información del proyecto
        proyecto: {
          numero: proyecto.numero,
          fecha: proyecto.createdAt,
          estado: proyecto.estado,
          prioridad: proyecto.fabricacion?.prioridad || 'normal'
        },

        // Información del cliente (SIN PRECIOS)
        cliente: {
          nombre: proyecto.cliente?.nombre || 'Sin nombre',
          telefono: proyecto.cliente?.telefono || 'Sin teléfono',
          direccion: proyecto.cliente?.direccion || 'Sin dirección',
          referencias: proyecto.cliente?.referencias || ''
        },

        // Piezas con detalles técnicos completos
        piezas: piezasConBOM,
        totalPiezas: piezasConBOM.length,

        // Materiales consolidados
        materialesConsolidados,

        // Lista de pedido para proveedor/almacén
        listaPedido: this.generarListaPedido(piezasConBOM, reporteOptimizacion),

        // Cronograma
        cronograma: {
          fechaInicioFabricacion: proyecto.cronograma?.fechaInicioFabricacion,
          fechaFinEstimada: proyecto.cronograma?.fechaFinFabricacionEstimada,
          diasEstimados: this.calcularDiasEstimados(
            proyecto.cronograma?.fechaInicioFabricacion,
            proyecto.cronograma?.fechaFinFabricacionEstimada
          )
        },

        // Observaciones generales
        observaciones: proyecto.observaciones || '',
        observacionesFabricacion: proyecto.fabricacion?.observaciones || '',

        // Checklist de empaque
        checklistEmpaque: this.generarChecklistEmpaque(piezasConBOM),

        // Optimización de cortes y tubos
        optimizacion: {
          resumenTubos: reporteOptimizacion.resumenTubos,
          recomendaciones: reporteOptimizacion.recomendaciones
        },

        // Fotos del proyecto
        fotos: proyecto.fotos || [],

        // Metadata
        generadoEn: new Date(),
        generadoPor: 'Sistema'
      };

      return datosOrden;
    } catch (error) {
      logger.error('Error obteniendo datos de orden de producción', {
        servicio: 'ordenProduccionService',
        accion: 'obtenerDatosOrdenProduccion',
        proyectoId: proyectoId?.toString(),
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Obtener piezas con los 13 campos técnicos completos
   */
  static obtenerPiezasConDetallesTecnicos(proyecto) {
    const piezas = [];

    // Priorizar productos del proyecto
    if (Array.isArray(proyecto.productos) && proyecto.productos.length > 0) {
      proyecto.productos.forEach((producto, index) => {
        const medidas = Array.isArray(producto.medidas) 
          ? producto.medidas[0] 
          : producto.medidas || {};

        piezas.push({
          numero: index + 1,
          ubicacion: producto.ubicacion || medidas.producto || `Pieza ${index + 1}`,
          
          // 13 CAMPOS TÉCNICOS
          sistema: producto.sistema || medidas.sistema || 'No especificado',
          control: producto.control || medidas.control || 'No especificado',
          tipoInstalacion: producto.tipoInstalacion || medidas.tipoInstalacion || 'No especificado',
          tipoFijacion: producto.tipoFijacion || medidas.tipoFijacion || 'No especificado',
          caida: producto.caida || medidas.caida || 'No especificado',
          galeria: producto.galeria || medidas.galeria || 'No especificado',
          telaMarca: producto.telaMarca || medidas.telaMarca || 'No especificado',
          baseTabla: producto.baseTabla || medidas.baseTabla || 'No especificado',
          modoOperacion: producto.modoOperacion || medidas.modoOperacion || 'Manual',
          detalleTecnico: producto.detalleTecnico || medidas.detalleTecnico || '',
          traslape: producto.traslape || medidas.traslape || 'No aplica',
          modeloCodigo: producto.modeloCodigo || medidas.modeloCodigo || '',
          observacionesTecnicas: producto.observacionesTecnicas || medidas.observacionesTecnicas || '',

          // Medidas
          ancho: Number(producto.ancho || medidas.ancho || 0),
          alto: Number(producto.alto || medidas.alto || 0),
          area: Number(producto.area || medidas.area || 0),

          // Adicionales
          motorizado: Boolean(producto.motorizado || medidas.modoOperacion === 'motorizado'),
          color: producto.color || medidas.color || 'No especificado',
          cantidad: producto.cantidad || 1
        });
      });
    }

    // Si no hay productos, usar levantamiento
    if (piezas.length === 0 && proyecto.levantamiento?.partidas) {
      let numeroPieza = 1;
      
      proyecto.levantamiento.partidas.forEach(partida => {
        // Buscar en 'piezas' primero, luego en 'medidas' (compatibilidad)
        const items = partida.piezas || partida.medidas || [];
        
        if (Array.isArray(items) && items.length > 0) {
          items.forEach(pieza => {
            piezas.push({
              numero: numeroPieza++,
              ubicacion: partida.ubicacion || pieza.producto || `Pieza ${numeroPieza}`,
              
              // 13 CAMPOS TÉCNICOS
              sistema: pieza.sistema || partida.sistema || 'Enrollable',
              control: pieza.control || 'No especificado',
              tipoInstalacion: pieza.instalacion || pieza.tipoInstalacion || 'Techo',
              tipoFijacion: pieza.fijacion || pieza.tipoFijacion || 'Tablaroca',
              caida: pieza.caida || 'Normal',
              galeria: pieza.galeria || 'Sin galería',
              telaMarca: pieza.telaMarca || 'Shades',
              baseTabla: pieza.baseTabla || '7cm',
              modoOperacion: pieza.operacion || pieza.modoOperacion || 'Manual',
              detalleTecnico: pieza.detalle || pieza.detalleTecnico || '',
              traslape: pieza.traslape || 'No aplica',
              modeloCodigo: pieza.modeloCodigo || partida.modelo || partida.producto || '',
              observacionesTecnicas: pieza.observacionesTecnicas || '',
              
              // Producto/Tela
              producto: partida.producto || 'No especificado',
              modelo: partida.modelo || pieza.modeloCodigo || 'No especificado',

              // Medidas
              ancho: Number(pieza.ancho || 0),
              alto: Number(pieza.alto || 0),
              area: Number(pieza.m2 || pieza.area || 0),

              // Adicionales
              motorizado: pieza.operacion === 'motorizado' || pieza.modoOperacion === 'motorizado',
              color: pieza.color || partida.color || 'No especificado',
              cantidad: 1
            });
          });
        }
      });
    }

    return piezas;
  }

  /**
   * Calcular materiales necesarios por pieza (BOM)
   */
  static calcularMaterialesPorPieza(pieza) {
    const materiales = [];
    const { ancho, alto, area, sistema, motorizado, telaMarca } = pieza;

    // 1. TELA
    if (telaMarca && telaMarca !== 'No especificado') {
      const areaTela = area * 1.1; // 10% de merma
      materiales.push({
        tipo: 'Tela',
        descripcion: telaMarca,
        cantidad: areaTela.toFixed(2),
        unidad: 'm²',
        observaciones: 'Incluye 10% de merma'
      });
    }

    // 2. TUBO
    const diametroTubo = this.calcularDiametroTubo(ancho, sistema);
    const largoTubo = ancho + 0.1; // 10cm adicional
    materiales.push({
      tipo: 'Tubo',
      descripcion: `Tubo ${diametroTubo}mm`,
      cantidad: largoTubo.toFixed(2),
      unidad: 'ml',
      observaciones: `Diámetro ${diametroTubo}mm`
    });

    // 3. SOPORTES
    const cantidadSoportes = this.calcularCantidadSoportes(ancho);
    materiales.push({
      tipo: 'Soportes',
      descripcion: 'Soporte universal',
      cantidad: cantidadSoportes,
      unidad: 'pza',
      observaciones: cantidadSoportes > 2 ? 'Incluye soportes centrales' : 'Izquierdo y derecho'
    });

    // 4. MECANISMO
    if (!motorizado) {
      materiales.push({
        tipo: 'Mecanismo',
        descripcion: 'Mecanismo cadena',
        cantidad: 1,
        unidad: 'kit',
        observaciones: 'Manual'
      });
    }

    // 5. MOTOR (si aplica)
    if (motorizado) {
      materiales.push({
        tipo: 'Motor',
        descripcion: 'Motor tubular',
        cantidad: 1,
        unidad: 'pza',
        observaciones: 'Incluye control remoto'
      });
    }

    // 6. GALERÍA/BASE
    if (pieza.galeria && pieza.galeria !== 'Sin galería') {
      materiales.push({
        tipo: 'Galería',
        descripcion: pieza.galeria,
        cantidad: ancho.toFixed(2),
        unidad: 'ml',
        observaciones: ''
      });
    }

    // 7. HERRAJES Y TORNILLERÍA
    const cantidadHerrajes = this.calcularHerrajes(pieza.tipoFijacion, cantidadSoportes);
    materiales.push({
      tipo: 'Herrajes',
      descripcion: `Kit de fijación para ${pieza.tipoFijacion}`,
      cantidad: cantidadHerrajes,
      unidad: 'kit',
      observaciones: `Incluye taquetes y tornillos`
    });

    return materiales;
  }

  /**
   * Consolidar materiales totales del proyecto
   */
  static consolidarMaterialesTotales(piezasConBOM) {
    const consolidado = {};

    piezasConBOM.forEach(pieza => {
      pieza.materiales.forEach(material => {
        const key = `${material.tipo}-${material.descripcion}`;
        
        if (!consolidado[key]) {
          consolidado[key] = {
            tipo: material.tipo,
            descripcion: material.descripcion,
            cantidad: 0,
            unidad: material.unidad,
            observaciones: material.observaciones
          };
        }

        consolidado[key].cantidad += Number(material.cantidad);
      });
    });

    // Convertir a array y ordenar por tipo
    return Object.values(consolidado)
      .map(m => ({
        ...m,
        cantidad: m.cantidad.toFixed(2)
      }))
      .sort((a, b) => {
        const orden = { 'Tela': 1, 'Tubo': 2, 'Soportes': 3, 'Mecanismo': 4, 'Motor': 5, 'Galería': 6, 'Herrajes': 7 };
        return (orden[a.tipo] || 99) - (orden[b.tipo] || 99);
      });
  }

  /**
   * Generar checklist de empaque
   */
  static generarChecklistEmpaque(piezas) {
    const checklist = [
      { item: 'Verificar medidas de todas las piezas', completado: false },
      { item: 'Control de calidad visual', completado: false },
      { item: 'Prueba de funcionamiento de mecanismos', completado: false },
      { item: 'Verificar motorización (si aplica)', completado: false },
      { item: 'Empacar con protección adecuada', completado: false },
      { item: 'Etiquetar cada pieza con ubicación', completado: false },
      { item: 'Incluir herrajes y accesorios', completado: false },
      { item: 'Verificar lista de materiales completa', completado: false },
      { item: 'Agregar instrucciones de instalación', completado: false },
      { item: 'Revisión final antes de envío', completado: false }
    ];

    // Agregar items específicos si hay motorizados
    const hayMotorizados = piezas.some(p => p.motorizado);
    if (hayMotorizados) {
      checklist.splice(3, 0, {
        item: 'Verificar baterías de controles remotos',
        completado: false
      });
    }

    return checklist;
  }

  /**
   * HELPERS DE CÁLCULO
   */

  static calcularDiametroTubo(ancho, sistema) {
    // Lógica de diámetro según ancho y sistema
    if (ancho <= 1.5) return 38;
    if (ancho <= 2.5) return 43;
    return 50;
  }

  static calcularCantidadSoportes(ancho) {
    // 2 soportes base + 1 cada 1.5m adicionales
    if (ancho <= 1.5) return 2;
    if (ancho <= 3.0) return 3;
    return 4;
  }

  static calcularHerrajes(tipoFijacion, cantidadSoportes) {
    // 1 kit por cada soporte
    return cantidadSoportes;
  }

  static calcularDiasEstimados(fechaInicio, fechaFin) {
    if (!fechaInicio || !fechaFin) return null;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diff = fin - inicio;
    
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Generar lista de pedido para proveedor/almacén
   * Consolida materiales y calcula barras/rollos necesarios
   */
  static generarListaPedido(piezasConBOM, reporteOptimizacion) {
    const listaPedido = {
      tubos: [],
      telas: [],
      mecanismos: [],
      contrapesos: [],
      accesorios: [],
      resumen: {
        totalItems: 0,
        totalBarras: 0,
        totalRollos: 0
      }
    };

    // Consolidar materiales por tipo
    const materialesAgrupados = {};
    
    piezasConBOM.forEach(pieza => {
      pieza.materiales.forEach(material => {
        const key = `${material.tipo}-${material.codigo || material.descripcion}`;
        
        if (!materialesAgrupados[key]) {
          materialesAgrupados[key] = {
            tipo: material.tipo,
            descripcion: material.descripcion,
            codigo: material.codigo,
            unidad: material.unidad,
            cantidad: 0,
            metadata: material.metadata || {}
          };
        }
        
        materialesAgrupados[key].cantidad += Number(material.cantidad);
      });
    });

    // Procesar tubos con información de optimización
    Object.values(materialesAgrupados).forEach(material => {
      if (material.tipo === 'Tubo') {
        const longitudEstandar = 5.80;
        const barrasNecesarias = Math.ceil(material.cantidad / longitudEstandar);
        const cortesOptimos = material.metadata?.cortesCompletos || Math.floor(longitudEstandar / (material.cantidad / piezasConBOM.length));
        
        listaPedido.tubos.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          diametro: material.metadata?.diametro || 'N/A',
          metrosLineales: material.cantidad.toFixed(2),
          barrasNecesarias,
          longitudBarra: longitudEstandar,
          cortesOptimos,
          desperdicio: material.metadata?.desperdicioPorc || 0,
          observaciones: `${barrasNecesarias} barras de ${longitudEstandar}m para ${piezasConBOM.length} cortes`
        });
        
        listaPedido.resumen.totalBarras += barrasNecesarias;
      }
      
      // Procesar telas
      else if (material.tipo === 'Tela') {
        const anchosRollo = material.metadata?.anchosRollo || [2.50, 3.00];
        const anchoRecomendado = anchosRollo[anchosRollo.length - 1] || 3.00;
        const rollosNecesarios = Math.ceil(material.cantidad / 50); // Asumiendo rollos de 50m
        
        listaPedido.telas.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          metrosLineales: material.cantidad.toFixed(2),
          anchoRollo: anchoRecomendado,
          rollosNecesarios,
          puedeRotar: material.metadata?.puedeRotar || false,
          observaciones: `${rollosNecesarios} rollo(s) de ${anchoRecomendado}m de ancho`
        });
        
        listaPedido.resumen.totalRollos += rollosNecesarios;
      }
      
      // Procesar mecanismos y motores
      else if (material.tipo === 'Mecanismo' || material.tipo === 'Motor') {
        listaPedido.mecanismos.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          cantidad: Math.ceil(material.cantidad),
          unidad: material.unidad,
          esMotor: material.metadata?.esMotor || false,
          incluye: material.metadata?.incluye || [],
          observaciones: material.metadata?.obligatorio ? '⚠️ OBLIGATORIO' : ''
        });
      }
      
      // Procesar contrapesos
      else if (material.tipo === 'Contrapeso') {
        const longitudEstandar = 5.80;
        const barrasNecesarias = Math.ceil(material.cantidad / longitudEstandar);
        
        listaPedido.contrapesos.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          metrosLineales: material.cantidad.toFixed(2),
          barrasNecesarias,
          longitudBarra: longitudEstandar,
          observaciones: `${barrasNecesarias} barras de ${longitudEstandar}m`
        });
        
        listaPedido.resumen.totalBarras += barrasNecesarias;
      }
      
      // Procesar accesorios
      else {
        listaPedido.accesorios.push({
          tipo: material.tipo,
          descripcion: material.descripcion,
          codigo: material.codigo,
          cantidad: material.unidad === 'ml' ? material.cantidad.toFixed(2) : Math.ceil(material.cantidad),
          unidad: material.unidad,
          observaciones: ''
        });
      }
    });

    // Calcular total de items
    listaPedido.resumen.totalItems = 
      listaPedido.tubos.length +
      listaPedido.telas.length +
      listaPedido.mecanismos.length +
      listaPedido.contrapesos.length +
      listaPedido.accesorios.length;

    // Agregar información de optimización de tubos si está disponible
    if (reporteOptimizacion?.resumenTubos) {
      listaPedido.optimizacionTubos = {
        totalTubos: reporteOptimizacion.resumenTubos.totalTubos,
        longitudEstandar: reporteOptimizacion.resumenTubos.longitudTuboEstandar,
        resumenPorTipo: reporteOptimizacion.resumenTubos.resumenPorTipo
      };
    }

    logger.info('Lista de pedido generada', {
      servicio: 'ordenProduccionService',
      totalItems: listaPedido.resumen.totalItems,
      totalBarras: listaPedido.resumen.totalBarras,
      totalRollos: listaPedido.resumen.totalRollos
    });

    return listaPedido;
  }
}

module.exports = OrdenProduccionService;
