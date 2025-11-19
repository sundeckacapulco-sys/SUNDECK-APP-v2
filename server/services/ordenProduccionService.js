const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
const CalculadoraMaterialesService = require('./calculadoraMaterialesService');
const OptimizadorCortesService = require('./optimizadorCortesService');
const AlmacenProduccionService = require('./almacenProduccionService');
const InventarioOptimizadoService = require('./inventarioOptimizadoService');

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
      
      // Generar lista de pedido para proveedor
      const piezasConBOM = [];
      for (const pieza of piezas) {
        const materiales = await OptimizadorCortesService.calcularMaterialesPieza(pieza);
        piezasConBOM.push({ ...pieza, materiales });
      }
      const reporteOptimizacion = await OptimizadorCortesService.generarReporteOptimizacion(piezas);
      const listaPedido = this.generarListaPedido(piezasConBOM, reporteOptimizacion);
      
      // Retornar resultado completo
      const resultadoCompleto = {
        ...resultado,
        listaPedido // LISTA DE PEDIDO PARA PROVEEDOR
      };
      
      logger.info('Orden procesada con almacén', {
        servicio: 'ordenProduccionService',
        proyectoId,
        success: resultadoCompleto.success,
        materialesUsados: resultadoCompleto.materiales?.length || 0,
        sobrantesGenerados: resultadoCompleto.sobrantes?.length || 0
      });
      
      return resultadoCompleto;
      
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

        // Mapear sistema
        let sistema = producto.sistema || medidas.sistema;
        
        if (!sistema || sistema === 'Enrollable' || sistema === 'No especificado') {
          const nombreProducto = (producto.nombre || producto.descripcion || '').toLowerCase();
          const telaMarca = (producto.telaMarca || '').toLowerCase();
          
          if (nombreProducto.includes('sheer') || telaMarca.includes('sheer')) {
            sistema = 'Sheer Elegance';
          } else if (nombreProducto.includes('toldo') || nombreProducto.includes('contempo')) {
            sistema = 'Toldos Contempo';
          } else {
            sistema = 'Roller Shade'; // Default
          }
        }

        piezas.push({
          numero: index + 1,
          ubicacion: producto.ubicacion || medidas.producto || `Pieza ${index + 1}`,
          
          // 13 CAMPOS TÉCNICOS
          sistema: sistema,
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
          rotada: Boolean(producto.rotada || medidas.rotada || medidas.detalleTecnico === 'rotada'),
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
            // Mapear sistema desde producto/modelo
            let sistema = pieza.sistema || partida.sistema;
            
            if (!sistema || sistema === 'Enrollable' || sistema === 'No especificado') {
              const producto = (partida.producto || pieza.producto || '').toLowerCase();
              const modelo = (partida.modelo || pieza.modelo || '').toLowerCase();
              
              if (producto.includes('sheer') || modelo.includes('sheer')) {
                sistema = 'Sheer Elegance';
              } else if (producto.includes('toldo') || modelo.includes('toldo') || modelo.includes('contempo')) {
                sistema = 'Toldos Contempo';
              } else {
                sistema = 'Roller Shade'; // Default para enrollables
              }
            }
            
            piezas.push({
              numero: numeroPieza++,
              ubicacion: partida.ubicacion || pieza.producto || `Pieza ${numeroPieza}`,
              
              // 13 CAMPOS TÉCNICOS
              sistema: sistema,
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
              rotada: Boolean(pieza.rotada || pieza.detalle === 'rotada' || pieza.detalleTecnico === 'rotada'),
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
        // Para telas, incluir modelo y color en la clave para separarlas
        let key;
        if (material.tipo === 'Tela' || material.tipo === 'Tela Sheer') {
          const modelo = pieza.modelo || pieza.modeloCodigo || pieza.producto || '';
          const color = pieza.color || '';
          key = `${material.tipo}-${material.descripcion}-${modelo}-${color}`;
        } else {
          key = `${material.tipo}-${material.descripcion}`;
        }
        
        
        if (!materialesAgrupados[key]) {
          materialesAgrupados[key] = {
            tipo: material.tipo,
            descripcion: material.descripcion,
            codigo: material.codigo,
            unidad: material.unidad,
            cantidad: 0,
            metadata: material.metadata || {},
            // Para telas, guardar modelo y color
            modelo: (material.tipo === 'Tela' || material.tipo === 'Tela Sheer') ? (pieza.modelo || pieza.modeloCodigo || pieza.producto || '') : undefined,
            color: (material.tipo === 'Tela' || material.tipo === 'Tela Sheer') ? (pieza.color || '') : undefined,
            // Guardar anchos de piezas para calcular ancho de rollo correcto
            anchosPiezas: []
          };
        }
        
        // Para telas, guardar ancho de cada pieza (considerando rotación)
        if (material.tipo === 'Tela' || material.tipo === 'Tela Sheer') {
          const anchoEfectivo = pieza.rotada ? pieza.alto : pieza.ancho;
          materialesAgrupados[key].anchosPiezas.push(anchoEfectivo);
        }
        
        // Sumar normalmente
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
          enAlmacen: false, // Por defecto se debe pedir
          observaciones: `${barrasNecesarias} barras de ${longitudEstandar}m para ${piezasConBOM.length} cortes`
        });
        
        listaPedido.resumen.totalBarras += barrasNecesarias;
      }
      
      // Procesar telas
      else if (material.tipo === 'Tela' || material.tipo === 'Tela Sheer') {
        const anchosRollo = material.metadata?.anchosRollo || [2.50, 3.00];
        
        // Usar modelo y color ya guardados en el material
        const modelo = material.modelo || '';
        const color = material.color || '';
        
        // Obtener tipo de producto de las piezas que usan esta tela
        const piezaConTela = piezasConBOM.find(p => 
          p.materiales?.some(m => 
            (m.tipo === 'Tela' || m.tipo === 'Tela Sheer') &&
            m.descripcion === material.descripcion
          )
        );
        const tipoProducto = piezaConTela?.producto || '';
        
        // Analizar anchos de piezas para sugerencia inteligente
        const anchosPiezas = material.anchosPiezas || [0];
        const anchoMaxPieza = Math.max(...anchosPiezas);
        const anchoMinPieza = Math.min(...anchosPiezas);
        
        // Encontrar el ancho de rollo más pequeño que cubra el ancho máximo
        const anchoRecomendado = anchosRollo.find(a => a >= anchoMaxPieza) || anchosRollo[anchosRollo.length - 1];
        
        // Obtener piezas que usan esta tela
        const piezasConEstaTela = piezasConBOM.filter(p => {
          return p.materiales?.some(m => 
            (m.tipo === 'Tela' || m.tipo === 'Tela Sheer') &&
            m.descripcion === material.descripcion
          );
        });
        
        // Análisis detallado de piezas con información completa y sobrantes de lienzo
        const detallesPiezas = piezasConEstaTela.map(p => {
          // Las dimensiones originales NO cambian cuando se rota
          // Solo cambia el cálculo de metros lineales
          const anchoOriginal = p.ancho;
          const altoOriginal = p.alto;
          
          // Buscar la cantidad de tela que ya calculó la calculadora para esta pieza
          const materialTela = p.materiales?.find(m => 
            (m.tipo === 'Tela' || m.tipo === 'Tela Sheer') &&
            m.descripcion === material.descripcion
          );
          const metrosLineales = materialTela ? materialTela.cantidad : (altoOriginal + 0.05);
          
          // Calcular sobrante de lienzo si el ancho es menor al ancho del rollo
          let sobranteLienzo = null;
          if (anchoOriginal < anchoRecomendado) {
            const anchoSobrante = anchoRecomendado - anchoOriginal;
            sobranteLienzo = {
              ancho: anchoSobrante.toFixed(2),
              largo: metrosLineales.toFixed(2),
              metros: (anchoSobrante * metrosLineales).toFixed(2)
            };
          }
          
          return {
            numero: p.numero,
            ubicacion: p.ubicacion,
            ancho: anchoOriginal,
            alto: altoOriginal,
            metrosLineales: metrosLineales.toFixed(2),
            producto: p.producto,
            modelo: p.modelo || modelo,
            color: p.color || color,
            rotada: p.rotada || false,
            sobranteLienzo
          };
        });
        
        // Contar piezas por rango de ancho
        const piezasPequenas = anchosPiezas.filter(a => a <= 2.50);
        const piezasGrandes = anchosPiezas.filter(a => a > 2.50);
        
        const rollosNecesarios = Math.ceil(material.cantidad / 50); // Asumiendo rollos de 50m
        
        // Crear string de anchos disponibles
        const anchosDisponibles = anchosRollo.map(a => `${a}m`).join(' o ');
        
        // Crear sugerencias inteligentes de corte
        let sugerencias = [];
        
        // Sugerencia 1: Si todas las piezas pequeñas caben en 2.50m
        if (piezasPequenas.length > 0 && piezasGrandes.length === 0) {
          sugerencias.push(`Todas las ${piezasPequenas.length} pieza(s) caben en lienzo de 2.50m`);
          sugerencias.push(`Revisar si hay lienzo de 2.50m en stock del taller`);
        }
        
        // Sugerencia 2: Si hay mezcla de piezas pequeñas y grandes
        else if (piezasPequenas.length > 0 && piezasGrandes.length > 0) {
          sugerencias.push(`OPCION 1: Pedir 1 rollo de 3.0m para todas las piezas`);
          sugerencias.push(`OPCION 2: Usar lienzo de 2.50m del taller para ${piezasPequenas.length} pieza(s) pequena(s)`);
          
          // Calcular si las piezas pequeñas se pueden combinar en un solo lienzo
          const sumaPequenas = piezasPequenas.reduce((sum, a) => sum + a, 0);
          if (sumaPequenas <= 2.50) {
            const ubicaciones = piezasConEstaTela
              .filter(p => {
                const anchoEfectivo = p.rotada ? p.alto : p.ancho;
                return anchoEfectivo <= 2.50;
              })
              .map(p => p.ubicacion)
              .join(', ');
            sugerencias.push(`>> Las piezas pequenas (${ubicaciones}) se pueden cortar de un mismo lienzo de 2.50m`);
          }
        }
        
        // Sugerencia 3: Si todas son grandes
        else if (piezasGrandes.length > 0) {
          sugerencias.push(`Requiere rollo de 3.0m (piezas grandes)`);
        }
        
        // Crear observaciones sin emojis
        let observaciones = `${rollosNecesarios} rollo(s) de ${anchoRecomendado}m de ancho`;
        if (sugerencias.length > 0) {
          observaciones += ` | SUGERENCIAS: ${sugerencias.join(' | ')}`;
        }
        
        listaPedido.telas.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          metrosLineales: material.cantidad.toFixed(2),
          anchoRollo: anchoRecomendado,
          anchosDisponibles,
          rollosNecesarios,
          modelo,
          color,
          tipoProducto, // Screen, Blackout, etc.
          anchosPiezas, // Array de anchos de piezas para análisis en PDF
          detallesPiezas, // Información completa de cada pieza (ubicación, ancho, modelo, color)
          piezasPequenas: piezasPequenas.length,
          piezasGrandes: piezasGrandes.length,
          enAlmacen: false, // Por defecto se debe pedir
          puedeRotar: material.metadata?.puedeRotar || false,
          observaciones,
          sugerencias // Array de sugerencias para mostrar en PDF
        });
        
        listaPedido.resumen.totalRollos += rollosNecesarios;
      }
      
      // Procesar contrapesos (perfiles de 5.80m)
      else if (material.tipo === 'Contrapeso') {
        const longitudEstandar = 5.80;
        const barrasNecesarias = Math.ceil(material.cantidad / longitudEstandar);
        const desperdicio = (barrasNecesarias * longitudEstandar) - material.cantidad;
        
        listaPedido.contrapesos.push({
          descripcion: material.descripcion,
          codigo: material.codigo,
          metrosLineales: material.cantidad.toFixed(2),
          barrasNecesarias,
          longitudBarra: longitudEstandar,
          desperdicio: ((desperdicio / material.cantidad) * 100).toFixed(1),
          enAlmacen: false,
          observaciones: `${barrasNecesarias} barras de ${longitudEstandar}m (${desperdicio.toFixed(2)}ml desperdicio)`
        });
        
        listaPedido.resumen.totalBarras += barrasNecesarias;
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

  /**
   * Generar lista de pedido V2.0 optimizada con gestión de inventario
   * @param {string} proyectoId - ID del proyecto
   * @returns {Promise<Object>} Lista optimizada con secciones separadas
   */
  static async generarListaPedidoV2(proyectoId) {
    try {
      logger.info('Generando lista de pedido V2.0 optimizada', {
        servicio: 'ordenProduccionService',
        accion: 'generarListaPedidoV2',
        proyectoId
      });

      // 1. Obtener datos de la orden de producción
      const datosOrden = await this.obtenerDatosOrdenProduccion(proyectoId);
      
      // 2. Generar lista de pedido tradicional
      const listaPedido = await this.generarListaPedido(datosOrden.piezas);
      
      // 3. Optimizar con gestión de inventario
      const listaOptimizada = await InventarioOptimizadoService.generarListaOptimizada(listaPedido);
      
      logger.info('Lista de pedido V2.0 generada', {
        servicio: 'ordenProduccionService',
        itemsPedir: listaOptimizada.resumen.totalItemsPedir,
        itemsAlmacen: listaOptimizada.resumen.totalItemsAlmacen
      });

      return {
        datosOrden,
        listaPedido,
        listaOptimizada
      };

    } catch (error) {
      logger.error('Error generando lista de pedido V2.0', {
        servicio: 'ordenProduccionService',
        accion: 'generarListaPedidoV2',
        proyectoId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = OrdenProduccionService;
