/**
 * PDF Lista de Pedido V3.1 - Algoritmo Oficial
 * Implementa el cálculo exacto según documento:
 * "calculo de telas, para orden de pedido, solo orden de pedido.md"
 * 
 * ESTRUCTURA:
 * - HOJA 1: Material Consolidado (imprimible)
 * - HOJA 2: Despiece por Pieza (técnico)
 * - HOJA 3: Almacén + Garantías
 */

const PDFDocument = require('pdfkit');
const logger = require('../config/logger');

class PDFListaPedidoV3Service {
  
  /**
   * Genera PDF de Lista de Pedido V3.1
   * @param {object} datosOrden - Datos de la orden de producción
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDF(datosOrden) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });
        
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // FASE 1-3: Calcular despiece inteligente con stock
        const despiece = this.calcularDespieceInteligente(datosOrden);
        
        // HOJA 1: Material Consolidado (IMPRIMIBLE)
        this.generarHoja1MaterialConsolidado(doc, datosOrden, despiece);
        
        // HOJA 2: Despiece por Pieza (TÉCNICO)
        doc.addPage();
        this.generarHoja2Despiece(doc, datosOrden, despiece);
        
        // HOJA 3: Almacén + Garantías
        doc.addPage();
        this.generarHoja3AlmacenGarantias(doc, datosOrden, despiece);
        
        doc.end();
        
        logger.info('PDF Lista de Pedido V3.1 generado', {
          servicio: 'pdfListaPedidoV3Service',
          proyecto: datosOrden.proyecto.numero,
          totalPiezas: datosOrden.totalPiezas
        });
        
      } catch (error) {
        logger.error('Error generando PDF Lista de Pedido V3.1', {
          servicio: 'pdfListaPedidoV3Service',
          error: error.message,
          stack: error.stack
        });
        reject(error);
      }
    });
  }
  
  /**
   * FASE 1-3: Calcular despiece inteligente con selección de rollo óptimo
   * @param {object} datosOrden - Datos de la orden
   * @returns {object} Despiece completo con stock
   */
  static calcularDespieceInteligente(datosOrden) {
    const ROLLOS_DISPONIBLES = [2.00, 2.50, 3.00]; // Anchos disponibles
    const ROLLO_COMPLETO_ML = 30; // ML por rollo completo
    const UMBRAL_ROLLO = 22; // Si faltante >= 22ml, pedir rollo completo
    
    // Simular stock inicial de almacén (TODO: integrar con BD)
    const stockAlmacen = {
      '2.00': { ml: 8, usado: 0 },
      '2.50': { ml: 0, usado: 0 },
      '3.00': { ml: 12, usado: 0 }
    };
    
    const piezasDespiece = [];
    const telasConsolidado = new Map(); // Agrupar por tipo+color+ancho
    
    // FASE 1: Procesar cada pieza
    datosOrden.piezas.forEach((pieza, index) => {
      const tela = pieza.materiales?.find(m => m.tipo === 'Tela' || m.tipo === 'Tela Sheer');
      if (!tela) return;
      
      // Determinar si va rotada
      const rotada = pieza.rotada || false;
      const anchoFinal = rotada ? pieza.alto : pieza.ancho;
      const altoFinal = rotada ? pieza.ancho : pieza.alto;
      
      // FASE 2: Seleccionar rollo óptimo
      const mlConsumidos = rotada ? altoFinal : anchoFinal;
      
      // Buscar rollo que sirva (ancho >= anchoFinal)
      let rolloSeleccionado = null;
      let stockUsado = false;
      
      for (const anchoRollo of ROLLOS_DISPONIBLES) {
        if (anchoRollo >= anchoFinal) {
          const key = anchoRollo.toFixed(2);
          if (stockAlmacen[key] && stockAlmacen[key].ml >= mlConsumidos) {
            // Usar stock disponible
            rolloSeleccionado = anchoRollo;
            stockUsado = true;
            stockAlmacen[key].ml -= mlConsumidos;
            stockAlmacen[key].usado += mlConsumidos;
            break;
          } else if (!rolloSeleccionado) {
            // Guardar como opción (se pedirá después)
            rolloSeleccionado = anchoRollo;
          }
        }
      }
      
      // Si no hay rollo que sirva, usar el más grande
      if (!rolloSeleccionado) {
        rolloSeleccionado = ROLLOS_DISPONIBLES[ROLLOS_DISPONIBLES.length - 1];
      }
      
      const sobranteRollo = stockUsado 
        ? stockAlmacen[rolloSeleccionado.toFixed(2)].ml 
        : 0;
      
      // Registrar pieza en despiece
      piezasDespiece.push({
        numero: index + 1,
        ubicacion: pieza.ubicacion,
        sistema: pieza.sistema || 'Roller Shade',
        telaNombre: tela.descripcion,
        telaModelo: pieza.modelo || '',
        telaColor: pieza.color || '',
        rotada,
        anchoFinal: anchoFinal.toFixed(2),
        altoFinal: altoFinal.toFixed(2),
        mlConsumidos: mlConsumidos.toFixed(2),
        rolloUsado: rolloSeleccionado.toFixed(2),
        stockUsado,
        sobranteRollo: sobranteRollo.toFixed(2)
      });
      
      // FASE 3: Consolidar por tipo de tela
      const claveTela = `${tela.descripcion}|${pieza.modelo}|${pieza.color}|${rolloSeleccionado}`;
      
      if (!telasConsolidado.has(claveTela)) {
        telasConsolidado.set(claveTela, {
          tipo: this.detectarTipoTela(tela.descripcion),
          nombre: tela.descripcion,
          modelo: pieza.modelo || '',
          color: pieza.color || '',
          anchoRollo: rolloSeleccionado,
          mlTotales: 0,
          rotada: rotada,
          piezas: 0
        });
      }
      
      const consolidado = telasConsolidado.get(claveTela);
      consolidado.mlTotales += mlConsumidos;
      consolidado.piezas += 1;
    });
    
    // Calcular faltante y pedido para cada tela
    const telasArray = Array.from(telasConsolidado.values()).map(tela => {
      const stockTotal = stockAlmacen[tela.anchoRollo.toFixed(2)]?.usado || 0;
      const faltante = Math.max(0, tela.mlTotales - stockTotal);
      
      let tipoPedido = 'ninguno';
      let cantidadPedir = 0;
      
      if (faltante > 0) {
        if (faltante < UMBRAL_ROLLO) {
          tipoPedido = 'metros';
          cantidadPedir = faltante;
        } else {
          tipoPedido = 'rollo';
          cantidadPedir = ROLLO_COMPLETO_ML;
        }
      }
      
      return {
        ...tela,
        mlTotales: tela.mlTotales.toFixed(2),
        stockUsado: stockTotal.toFixed(2),
        faltante: faltante.toFixed(2),
        tipoPedido,
        cantidadPedir: cantidadPedir.toFixed(2)
      };
    });
    
    // Ordenar por tipo (Screen, Blackout, Sheer)
    telasArray.sort((a, b) => {
      const orden = { 'Screen': 1, 'Blackout': 2, 'Sheer': 3 };
      return (orden[a.tipo] || 99) - (orden[b.tipo] || 99);
    });
    
    return {
      piezas: piezasDespiece,
      telas: telasArray,
      stockAlmacen
    };
  }
  
  /**
   * Detectar tipo de tela (Screen/Blackout/Sheer)
   */
  static detectarTipoTela(descripcion) {
    const desc = descripcion.toLowerCase();
    if (desc.includes('screen')) return 'Screen';
    if (desc.includes('blackout')) return 'Blackout';
    if (desc.includes('sheer')) return 'Sheer';
    return 'Tela';
  }
  
  /**
   * HOJA 1: Material Consolidado (IMPRIMIBLE)
   */
  static generarHoja1MaterialConsolidado(doc, datos, despiece) {
    // Encabezado
    doc.fontSize(16).font('Helvetica-Bold')
       .text('LISTA DE PEDIDO - MATERIAL CONSOLIDADO', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica')
       .text(`Proyecto: ${datos.proyecto.numero} | Cliente: ${datos.cliente.nombre}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // TELAS agrupadas por tipo
    let tipoActual = null;
    
    despiece.telas.forEach((tela, index) => {
      // Título de sección por tipo
      if (tela.tipo !== tipoActual) {
        tipoActual = tela.tipo;
        
        if (index > 0) doc.moveDown(0.8);
        
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
        doc.text(`${tela.tipo.toUpperCase()}`, 50, doc.y);
        doc.fillColor('#000');
        doc.moveDown(0.3);
      }
      
      // Información de la tela
      doc.fontSize(10).font('Helvetica-Bold');
      const titulo = `${tela.modelo} ${tela.color} - ${tela.anchoRollo}m`.trim();
      doc.text(titulo, 60, doc.y);
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`Cantidad total: ${tela.mlTotales} ml${tela.rotada ? ' (rotada)' : ''}`, 70, doc.y);
      doc.text(`Usado en: ${tela.piezas} pieza${tela.piezas > 1 ? 's' : ''}`, 70, doc.y);
      
      // Información de pedido
      if (tela.tipoPedido === 'metros') {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FF6600');
        doc.text(`>> PEDIR: ${tela.cantidadPedir} ml (compra por metro)`, 70, doc.y);
        doc.fillColor('#000');
      } else if (tela.tipoPedido === 'rollo') {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#FF6600');
        doc.text(`>> PEDIR: 1 rollo de 30 ml`, 70, doc.y);
        doc.fillColor('#000');
      } else {
        doc.fontSize(9).font('Helvetica').fillColor('#006400');
        doc.text(`✓ Stock suficiente`, 70, doc.y);
        doc.fillColor('#000');
      }
      
      doc.moveDown(0.5);
    });
    
    // TUBOS
    if (datos.listaPedido?.tubos && datos.listaPedido.tubos.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('TUBOS', 50, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.3);
      
      datos.listaPedido.tubos.forEach(tubo => {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${tubo.codigo} - ${tubo.descripcion}`, 60, doc.y);
        
        doc.fontSize(9).font('Helvetica');
        doc.text(`>> PEDIR: ${tubo.barrasNecesarias} barras x 5.80m | Total: ${tubo.metrosLineales}ml`, 70, doc.y);
        doc.moveDown(0.5);
      });
    }
    
    // MOTORES Y CONTROLES
    const motores = datos.listaPedido?.mecanismos?.filter(m => m.esMotor) || [];
    if (motores.length > 0) {
      doc.moveDown(0.8);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('MOTORES Y CONTROLES', 50, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.3);
      
      doc.fontSize(9).font('Helvetica');
      doc.text(`MOTORES REQUERIDOS: ${motores.length}`, 60, doc.y);
      doc.text(`>> Modelos a pedir:`, 60, doc.y);
      
      motores.forEach((motor, i) => {
        doc.text(`${i + 1}) ${motor.descripcion} - Cantidad: ${motor.cantidad}`, 70, doc.y);
      });
      
      doc.moveDown(0.5);
      doc.text(`CONTROLES:`, 60, doc.y);
      doc.text(`Tipo: ____________ Cantidad: ____`, 70, doc.y);
      doc.text(`Observaciones: _________________________`, 70, doc.y);
    }
  }
  
  /**
   * HOJA 2: Despiece por Pieza (TÉCNICO)
   */
  static generarHoja2Despiece(doc, datos, despiece) {
    doc.fontSize(14).font('Helvetica-Bold')
       .text('DESPIECE POR PIEZA (TÉCNICO)', { align: 'center' });
    
    doc.moveDown(1);
    
    despiece.piezas.forEach((pieza, index) => {
      if (doc.y > 650) {
        doc.addPage();
        doc.y = 50;
      }
      
      // Título de pieza
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text(`PIEZA ${pieza.numero} – ${pieza.ubicacion}`, 50, doc.y);
      doc.fillColor('#000');
      
      doc.moveDown(0.3);
      
      // Información de la pieza
      doc.fontSize(9).font('Helvetica');
      doc.text(`Sistema: ${pieza.sistema}`, 60, doc.y);
      doc.text(`Tela: ${pieza.telaModelo} ${pieza.telaColor}`.trim(), 60, doc.y);
      doc.text(`Rotada: ${pieza.rotada ? 'Sí' : 'No'}`, 60, doc.y);
      doc.text(`Ancho final: ${pieza.anchoFinal} m`, 60, doc.y);
      doc.text(`Alto final: ${pieza.altoFinal} m`, 60, doc.y);
      
      doc.moveDown(0.3);
      
      // Análisis del rollo
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`Análisis del rollo:`, 60, doc.y);
      
      doc.fontSize(8).font('Helvetica');
      doc.text(`- Rollo usado: ${pieza.rolloUsado} m`, 70, doc.y);
      doc.text(`- ML consumidos: ${pieza.mlConsumidos} ml`, 70, doc.y);
      
      if (pieza.stockUsado) {
        doc.fillColor('#006400');
        doc.text(`- Tomado de almacén`, 70, doc.y);
        doc.text(`- Sobrante del rollo: ${pieza.sobranteRollo} ml`, 70, doc.y);
        doc.fillColor('#000');
      } else {
        doc.fillColor('#FF6600');
        doc.text(`- Se pedirá nuevo rollo`, 70, doc.y);
        doc.fillColor('#000');
      }
      
      doc.moveDown(0.8);
      
      // Línea separadora
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });
  }
  
  /**
   * HOJA 3: Almacén + Garantías
   */
  static generarHoja3AlmacenGarantias(doc, datos, despiece) {
    doc.fontSize(14).font('Helvetica-Bold')
       .text('ALMACÉN Y GARANTÍAS', { align: 'center' });
    
    doc.moveDown(1);
    
    // Material a tomar de almacén
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('MATERIAL A TOMAR DE ALMACÉN', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica');
    
    // Telas del almacén
    Object.entries(despiece.stockAlmacen).forEach(([ancho, info]) => {
      if (info.usado > 0) {
        doc.text(`- Tela rollo ${ancho}m: usar ${info.usado.toFixed(2)} ml`, 60, doc.y);
        doc.text(`  Stock restante: ${info.ml.toFixed(2)} ml`, 70, doc.y);
      }
    });
    
    doc.moveDown(1);
    
    // GARANTÍAS (mantener formato actual)
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('GARANTÍAS Y CHECKLIST', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica');
    doc.text('□ Verificar medidas antes de cortar', 60, doc.y);
    doc.text('□ Revisar color y modelo de tela', 60, doc.y);
    doc.text('□ Confirmar rotación de piezas', 60, doc.y);
    doc.text('□ Verificar stock de almacén', 60, doc.y);
    doc.text('□ Etiquetar piezas correctamente', 60, doc.y);
    
    doc.moveDown(1);
    
    doc.fontSize(8).font('Helvetica').fillColor('#666');
    doc.text('Garantía: 1 año en materiales y mano de obra', 60, doc.y);
    doc.text('Fecha de emisión: ' + new Date().toLocaleDateString('es-MX'), 60, doc.y);
    doc.fillColor('#000');
  }
}

module.exports = PDFListaPedidoV3Service;
