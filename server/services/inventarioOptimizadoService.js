/**
 * Servicio de Inventario Optimizado V2.0
 * Gestiona stock real y optimiza pedidos a proveedores
 */

const logger = require('../config/logger');
const SobranteMaterial = require('../models/SobranteMaterial');

class InventarioOptimizadoService {
  
  /**
   * Constantes de unidades de compra
   */
  static UNIDADES_COMPRA = {
    TELA_ROLLO: 30, // metros lineales por rollo
    TELA_UMBRAL_ROLLO: 22, // umbral para pedir rollo completo (ml)
    CINTA_ROLLO: 50, // metros lineales por rollo
    TUBO_BARRA: 5.80, // metros por barra
    CONTRAPESO_BARRA: 5.80 // metros por barra
  };

  /**
   * Optimizar pedido de telas con gestión de inventario
   * @param {Array} telas - Array de telas del proyecto
   * @returns {Object} { pedirProveedor: [], tomarAlmacen: [], nuevoStock: [] }
   */
  static async optimizarTelas(telas) {
    const resultado = {
      pedirProveedor: [],
      tomarAlmacen: [],
      nuevoStock: []
    };

    for (const tela of telas) {
      const key = `${tela.modelo}-${tela.color}-${tela.anchoRollo}m`;
      const consumoTotal = parseFloat(tela.metrosLineales);
      
      // Crear descripción completa con tipo de producto
      const descripcionCompleta = tela.tipoProducto 
        ? `${tela.tipoProducto} - ${tela.modelo} ${tela.color} - ${tela.anchoRollo}m`
        : `${tela.modelo} ${tela.color} - ${tela.anchoRollo}m`;

      // Buscar stock en almacén
      const stockAlmacen = await SobranteMaterial.findOne({
        tipo: 'Tela',
        descripcion: { $regex: new RegExp(tela.modelo, 'i') },
        'metadata.ancho': tela.anchoRollo,
        cantidadDisponible: { $gt: 0 }
      });

      const stockDisponible = stockAlmacen ? parseFloat(stockAlmacen.cantidadDisponible) : 0;
      
      // Calcular cuánto tomar de almacén
      const tomarDeAlmacen = Math.min(stockDisponible, consumoTotal);
      const faltante = consumoTotal - tomarDeAlmacen;

      // Si hay stock, registrar lo que se toma
      if (tomarDeAlmacen > 0) {
        resultado.tomarAlmacen.push({
          tipo: 'Tela',
          descripcion: descripcionCompleta,
          cantidad: tomarDeAlmacen.toFixed(2),
          unidad: 'ml',
          stockAntes: stockDisponible.toFixed(2),
          stockDespues: (stockDisponible - tomarDeAlmacen).toFixed(2)
        });
      }

      // Si falta material, decidir si pedir por ml o rollo completo
      if (faltante > 0) {
        // REGLA: Solo pedir rollo completo si faltante >= 22ml
        const pedirRolloCompleto = faltante >= this.UNIDADES_COMPRA.TELA_UMBRAL_ROLLO;
        
        if (pedirRolloCompleto) {
          // Pedir rollo completo
          const rollosNecesarios = Math.ceil(faltante / this.UNIDADES_COMPRA.TELA_ROLLO);
          const metrosTotalesRollos = rollosNecesarios * this.UNIDADES_COMPRA.TELA_ROLLO;
          const sobranteNuevo = metrosTotalesRollos - faltante;

          resultado.pedirProveedor.push({
            tipo: 'Tela',
            descripcion: descripcionCompleta,
            requerimiento: consumoTotal.toFixed(2),
            stockAlmacen: stockDisponible.toFixed(2),
            faltante: faltante.toFixed(2),
            pedirRollo: true,
            rollosAPedir: rollosNecesarios,
            metrosRollo: this.UNIDADES_COMPRA.TELA_ROLLO,
            metrosAPedir: metrosTotalesRollos.toFixed(2),
            sobranteEstimado: sobranteNuevo.toFixed(2),
            detallesPiezas: tela.detallesPiezas || [],
            unidad: 'ml'
          });

          // Registrar nuevo stock estimado
          resultado.nuevoStock.push({
            tipo: 'Tela',
            descripcion: descripcionCompleta,
            cantidadNueva: sobranteNuevo.toFixed(2),
            unidad: 'ml'
          });
        } else {
          // Pedir por metros lineales exactos
          resultado.pedirProveedor.push({
            tipo: 'Tela',
            descripcion: descripcionCompleta,
            requerimiento: consumoTotal.toFixed(2),
            stockAlmacen: stockDisponible.toFixed(2),
            faltante: faltante.toFixed(2),
            pedirRollo: false,
            metrosAPedir: faltante.toFixed(2),
            sobranteEstimado: '0.00',
            detallesPiezas: tela.detallesPiezas || [],
            unidad: 'ml'
          });
          
          // No hay sobrante si se pide por ml exactos
        }
      }
    }

    return resultado;
  }

  /**
   * Optimizar pedido de cinta doble cara
   * @param {Number} consumoTotal - Metros lineales totales de cinta
   * @returns {Object} { pedirProveedor: [], tomarAlmacen: [], nuevoStock: [] }
   */
  static async optimizarCinta(consumoTotal) {
    const resultado = {
      pedirProveedor: [],
      tomarAlmacen: [],
      nuevoStock: []
    };

    // Buscar stock de cinta en almacén
    const stockAlmacen = await SobranteMaterial.findOne({
      tipo: 'Cinta',
      cantidadDisponible: { $gt: 0 }
    });

    const stockDisponible = stockAlmacen ? parseFloat(stockAlmacen.cantidadDisponible) : 0;
    
    // Calcular cuánto tomar de almacén
    const tomarDeAlmacen = Math.min(stockDisponible, consumoTotal);
    const faltante = consumoTotal - tomarDeAlmacen;

    // Si hay stock, registrar lo que se toma
    if (tomarDeAlmacen > 0) {
      resultado.tomarAlmacen.push({
        tipo: 'Cinta',
        descripcion: 'Cinta adhesiva doble cara',
        cantidad: tomarDeAlmacen.toFixed(2),
        unidad: 'ml',
        stockAntes: stockDisponible.toFixed(2),
        stockDespues: (stockDisponible - tomarDeAlmacen).toFixed(2)
      });
    }

    // Si falta material, calcular rollos a pedir
    if (faltante > 0) {
      const rollosNecesarios = Math.ceil(faltante / this.UNIDADES_COMPRA.CINTA_ROLLO);
      const metrosTotalesRollos = rollosNecesarios * this.UNIDADES_COMPRA.CINTA_ROLLO;
      const sobranteNuevo = metrosTotalesRollos - faltante;

      resultado.pedirProveedor.push({
        tipo: 'Cinta',
        descripcion: 'Cinta adhesiva doble cara',
        requerimiento: consumoTotal.toFixed(2),
        stockAlmacen: stockDisponible.toFixed(2),
        faltante: faltante.toFixed(2),
        rollosAPedir: rollosNecesarios,
        metrosRollo: this.UNIDADES_COMPRA.CINTA_ROLLO,
        sobranteEstimado: sobranteNuevo.toFixed(2),
        unidad: 'ml'
      });

      // Registrar nuevo stock estimado
      resultado.nuevoStock.push({
        tipo: 'Cinta',
        descripcion: 'Cinta adhesiva doble cara',
        cantidadNueva: sobranteNuevo.toFixed(2),
        unidad: 'ml'
      });
    }

    return resultado;
  }

  /**
   * Optimizar pedido de tubos/contrapesos
   * @param {Array} items - Array de tubos o contrapesos
   * @param {String} tipo - 'Tubo' o 'Contrapeso'
   * @returns {Object} { pedirProveedor: [], tomarAlmacen: [], nuevoStock: [] }
   */
  static async optimizarBarras(items, tipo) {
    const resultado = {
      pedirProveedor: [],
      tomarAlmacen: [],
      nuevoStock: []
    };

    const longitudBarra = tipo === 'Tubo' 
      ? this.UNIDADES_COMPRA.TUBO_BARRA 
      : this.UNIDADES_COMPRA.CONTRAPESO_BARRA;

    for (const item of items) {
      const consumoTotal = parseFloat(item.metrosLineales);

      // Buscar stock en almacén
      const stockAlmacen = await SobranteMaterial.findOne({
        tipo: tipo,
        descripcion: { $regex: new RegExp(item.descripcion, 'i') },
        cantidadDisponible: { $gt: 0 }
      });

      const stockDisponible = stockAlmacen ? parseFloat(stockAlmacen.cantidadDisponible) : 0;
      
      // Calcular cuánto tomar de almacén
      const tomarDeAlmacen = Math.min(stockDisponible, consumoTotal);
      const faltante = consumoTotal - tomarDeAlmacen;

      // Si hay stock, registrar lo que se toma
      if (tomarDeAlmacen > 0) {
        resultado.tomarAlmacen.push({
          tipo: tipo,
          descripcion: item.descripcion,
          cantidad: tomarDeAlmacen.toFixed(2),
          unidad: 'ml',
          stockAntes: stockDisponible.toFixed(2),
          stockDespues: (stockDisponible - tomarDeAlmacen).toFixed(2)
        });
      }

      // Si falta material, calcular barras a pedir
      if (faltante > 0) {
        const barrasNecesarias = Math.ceil(faltante / longitudBarra);
        const metrosTotalesBarras = barrasNecesarias * longitudBarra;
        const sobranteNuevo = metrosTotalesBarras - faltante;

        resultado.pedirProveedor.push({
          tipo: tipo,
          descripcion: item.descripcion,
          requerimiento: consumoTotal.toFixed(2),
          stockAlmacen: stockDisponible.toFixed(2),
          faltante: faltante.toFixed(2),
          barrasAPedir: barrasNecesarias,
          longitudBarra: longitudBarra,
          sobranteEstimado: sobranteNuevo.toFixed(2),
          unidad: 'ml'
        });

        // Registrar nuevo stock estimado
        resultado.nuevoStock.push({
          tipo: tipo,
          descripcion: item.descripcion,
          cantidadNueva: sobranteNuevo.toFixed(2),
          unidad: 'ml'
        });
      }
    }

    return resultado;
  }

  /**
   * Generar lista de pedido optimizada completa
   * @param {Object} listaPedido - Lista de pedido del proyecto
   * @returns {Object} Lista optimizada con secciones separadas
   */
  static async generarListaOptimizada(listaPedido) {
    try {
      logger.info('Generando lista de pedido optimizada', {
        servicio: 'inventarioOptimizadoService',
        totalTelas: listaPedido.telas?.length || 0,
        totalTubos: listaPedido.tubos?.length || 0
      });

      const resultado = {
        pedirProveedor: {
          telas: [],
          tubos: [],
          contrapesos: [],
          cinta: [],
          mecanismos: [],
          motores: [],
          accesorios: []
        },
        tomarAlmacen: {
          telas: [],
          tubos: [],
          contrapesos: [],
          cinta: [],
          otros: []
        },
        nuevoStock: [],
        resumen: {
          totalItemsPedir: 0,
          totalItemsAlmacen: 0,
          piezasMotorizadas: 0
        }
      };

      // 1. OPTIMIZAR TELAS
      if (listaPedido.telas && listaPedido.telas.length > 0) {
        const telasOpt = await this.optimizarTelas(listaPedido.telas);
        resultado.pedirProveedor.telas = telasOpt.pedirProveedor;
        resultado.tomarAlmacen.telas = telasOpt.tomarAlmacen;
        resultado.nuevoStock.push(...telasOpt.nuevoStock);
      }

      // 2. OPTIMIZAR CINTA
      const consumoCintaTotal = listaPedido.accesorios
        ?.filter(a => a.tipo === 'Cinta')
        .reduce((sum, a) => sum + parseFloat(a.cantidad || 0), 0) || 0;
      
      if (consumoCintaTotal > 0) {
        const cintaOpt = await this.optimizarCinta(consumoCintaTotal);
        resultado.pedirProveedor.cinta = cintaOpt.pedirProveedor;
        resultado.tomarAlmacen.cinta = cintaOpt.tomarAlmacen;
        resultado.nuevoStock.push(...cintaOpt.nuevoStock);
      }

      // 3. OPTIMIZAR TUBOS
      if (listaPedido.tubos && listaPedido.tubos.length > 0) {
        const tubosOpt = await this.optimizarBarras(listaPedido.tubos, 'Tubo');
        resultado.pedirProveedor.tubos = tubosOpt.pedirProveedor;
        resultado.tomarAlmacen.tubos = tubosOpt.tomarAlmacen;
        resultado.nuevoStock.push(...tubosOpt.nuevoStock);
      }

      // 4. OPTIMIZAR CONTRAPESOS
      if (listaPedido.contrapesos && listaPedido.contrapesos.length > 0) {
        const contrapesosOpt = await this.optimizarBarras(listaPedido.contrapesos, 'Contrapeso');
        resultado.pedirProveedor.contrapesos = contrapesosOpt.pedirProveedor;
        resultado.tomarAlmacen.contrapesos = contrapesosOpt.tomarAlmacen;
        resultado.nuevoStock.push(...contrapesosOpt.nuevoStock);
      }

      // 5. MECANISMOS Y MOTORES (sin optimización de stock por ahora)
      resultado.pedirProveedor.mecanismos = listaPedido.mecanismos || [];
      resultado.pedirProveedor.motores = listaPedido.motores || [];
      resultado.pedirProveedor.accesorios = listaPedido.accesorios?.filter(a => a.tipo !== 'Cinta') || [];

      // 6. CALCULAR RESUMEN
      resultado.resumen.totalItemsPedir = 
        resultado.pedirProveedor.telas.length +
        resultado.pedirProveedor.tubos.length +
        resultado.pedirProveedor.contrapesos.length +
        resultado.pedirProveedor.cinta.length +
        resultado.pedirProveedor.mecanismos.length +
        resultado.pedirProveedor.motores.length +
        resultado.pedirProveedor.accesorios.length;

      resultado.resumen.totalItemsAlmacen = 
        resultado.tomarAlmacen.telas.length +
        resultado.tomarAlmacen.tubos.length +
        resultado.tomarAlmacen.contrapesos.length +
        resultado.tomarAlmacen.cinta.length;

      resultado.resumen.piezasMotorizadas = listaPedido.resumen?.piezasMotorizadas || 0;

      logger.info('Lista optimizada generada', {
        servicio: 'inventarioOptimizadoService',
        itemsPedir: resultado.resumen.totalItemsPedir,
        itemsAlmacen: resultado.resumen.totalItemsAlmacen
      });

      return resultado;

    } catch (error) {
      logger.error('Error generando lista optimizada', {
        servicio: 'inventarioOptimizadoService',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

module.exports = InventarioOptimizadoService;
