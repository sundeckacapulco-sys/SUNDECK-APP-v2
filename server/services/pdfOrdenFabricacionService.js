/**
 * Servicio para generar PDF de Orden de Producción
 * Incluye lista de pedido completa para proveedor y OPTIMIZACION DE CORTES
 * v2.0
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const logger = require('../config/logger');
const OptimizadorCortesService = require('./optimizadorCortesService');

class PDFOrdenProduccionService {
  
  /**
   * Generar PDF de orden de TALLER completa (con especificaciones técnicas y optimización)
   * @param {object} datosOrden - Datos de la orden
   * @param {object} listaPedido - Lista de pedido para proveedor
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDF(datosOrden, listaPedido) {
    // Primero, calculamos los datos de optimización de forma asíncrona
    const datosOptimizacion = await this.prepararDatosOptimizacion(datosOrden);
    
    // Unimos los datos originales con los de optimización
    const datosCompletos = {
      ...datosOrden,
      ...datosOptimizacion
    };

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
        
        // PÁGINA 1: ORDEN DE FABRICACIÓN (ahora con datos de optimización)
        this.generarPaginaOrden(doc, datosCompletos);
        
        // PÁGINA 2: ETIQUETAS DE PRODUCCIÓN
        doc.addPage();
        this.generarPaginaEtiquetas(doc, datosCompletos);
        
        // PÁGINA 3+: DETALLE POR PIEZA
        doc.addPage();
        this.generarPaginaDetallePiezas(doc, datosCompletos);
        
        doc.end();
        
        logger.info('PDF de orden con optimización generado', {
          servicio: 'pdfOrdenProduccionService',
          proyecto: datosCompletos.proyecto?.numero,
          totalPiezas: datosCompletos.totalPiezas
        });
        
      } catch (error) {
        logger.error('Error generando PDF con optimización', {
          servicio: 'pdfOrdenProduccionService',
          error: error.message
        });
        reject(error);
      }
    });
  }

  /**
   * Prepara los datos de optimización antes de generar el PDF.
   * @param {object} datosOrden - Los datos originales de la orden.
   * @returns {Promise<object>} Un objeto con los planes de optimización.
   */
  static async prepararDatosOptimizacion(datosOrden) {
    const { piezas } = datosOrden;
    if (!piezas || piezas.length === 0) {
      return { optimizacionTubos: null, resumenTelas: [] };
    }

    try {
      // 1. Optimización de Tubos
      const cortesTubos = piezas.map(p => p.ancho);
      const optimizacionTubos = await OptimizadorCortesService.optimizarCortesConSobrantes(cortesTubos, 'Tubo', 'T38');

      // 2. Resumen de Telas
      const telasMap = new Map();
      piezas.forEach(p => {
        const key = `${p.telaMarca || 'Tela Genérica'}-${p.color || 'Sin Color'}`;
        const area = (p.ancho * p.alto);
        if (telasMap.has(key)) {
          telasMap.set(key, { ...telasMap.get(key), areaTotal: telasMap.get(key).areaTotal + area, piezas: telasMap.get(key).piezas + 1 });
        } else {
          telasMap.set(key, { descripcion: key, areaTotal: area, piezas: 1 });
        }
      });
      const resumenTelas = Array.from(telasMap.values());

      return { optimizacionTubos, resumenTelas };

    } catch (error) {
      logger.error('Error preparando datos de optimización para PDF', {
        servicio: 'pdfOrdenProduccionService',
        error: error.message,
        stack: error.stack
      });
      return { optimizacionTubos: null, resumenTelas: [] };
    }
  }
  
  /**
   * Dibuja la sección de optimización de cortes.
   */
  static dibujarSeccionOptimizacionCortes(doc, datos) {
    const { optimizacionTubos, resumenTelas } = datos;

    if (doc.y > 550) {
      doc.addPage();
      doc.y = 50;
    }
    
    this.dibujarSeccion(doc, 'PLAN DE OPTIMIZACIÓN DE CORTES');
    doc.fontSize(7).font('Helvetica').fillColor('#666').text('Este plan minimiza el desperdicio utilizando sobrantes de almacén.', 50, doc.y);
    doc.moveDown(1);

    if (optimizacionTubos && optimizacionTubos.barras.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').text('Tubos:', 50, doc.y);
      doc.moveDown(0.5);
      
      doc.fontSize(8).font('Helvetica');
      optimizacionTubos.barras.forEach(barra => {
        let origen = 'Barra Nueva';
        if (barra.tipo === 'sobrante') {
          origen = `Sobrante ID: ${barra.etiqueta || barra.sobranteId.toString().slice(-6)}`;
        }
        
        const cortesStr = barra.cortes.map(c => `${c}m`).join(' + ');
        const eficiencia = barra.eficiencia ? ` | Eficiencia: ${barra.eficiencia}%` : '';

        doc.text(`• ${origen}: Cortar [${cortesStr}]. Sobrante: ${barra.sobrante.toFixed(2)}m${eficiencia}`, 60, doc.y, { width: 480 });
        doc.moveDown(0.4);
      });

      doc.moveDown(0.5);
      const resumen = optimizacionTubos.resumen;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#333');
      doc.text(`Resumen Tubos: ${resumen.barrasNuevas} barras nuevas | ${resumen.sobrantesReutilizados} sobrantes reutilizados | Eficiencia Global: ${resumen.eficienciaGlobal}%`, 60, doc.y);
      doc.fillColor('#000');
      doc.moveDown(1);
    }

    if (resumenTelas && resumenTelas.length > 0) {
      doc.fontSize(9).font('Helvetica-Bold').text('Telas (Resumen):', 50, doc.y);
      doc.moveDown(0.5);
      
      doc.fontSize(8).font('Helvetica');
      resumenTelas.forEach(tela => {
        doc.text(`• ${tela.descripcion}: ${tela.areaTotal.toFixed(2)} m² (para ${tela.piezas} piezas)`, 60, doc.y);
        doc.moveDown(0.4);
      });
    }
  }

  /**
   * PÁGINA 1: Orden de Fabricación
   */
  static generarPaginaOrden(doc, datos) {
    const { proyecto, cliente, piezas, cronograma } = datos;
    
    doc.fontSize(20).font('Helvetica-Bold').text('ORDEN DE FABRICACIÓN - TALLER', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Orden: ${proyecto.numero}`, { align: 'center' });
    doc.moveDown(1);
    
    this.dibujarSeccion(doc, 'INFORMACIÓN DEL PROYECTO');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 50, doc.y);
    doc.text(`Estado: ${proyecto.estado}`, 300, doc.y - 12);
    doc.moveDown(0.5);
    doc.text(`Prioridad: ${proyecto.prioridad || 'Normal'}`, 50, doc.y);
    doc.moveDown(1);

    this.dibujarSeccion(doc, 'CLIENTE');
    doc.fontSize(10).font('Helvetica-Bold').text(cliente.nombre, 50, doc.y);
    doc.font('Helvetica');
    doc.moveDown(0.3);
    doc.text(`Tel: ${cliente.telefono}`);
    doc.text(`Dirección: ${cliente.direccion}`);
    doc.moveDown(1);

    if (cronograma?.fechaInicioFabricacion) {
      this.dibujarSeccion(doc, 'CRONOGRAMA');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Inicio: ${new Date(cronograma.fechaInicioFabricacion).toLocaleDateString('es-MX')}`);
      if (cronograma.fechaFinEstimada) {
        doc.text(`Entrega estimada: ${new Date(cronograma.fechaFinEstimada).toLocaleDateString('es-MX')}`);
      }
      doc.moveDown(1);
    }
    
    this.dibujarSeccion(doc, `PIEZAS A FABRICAR - ${piezas.length} TOTAL`);
    doc.font('Helvetica').fontSize(7);
    piezas.forEach((pieza, index) => {
      if (doc.y > 680) {
        doc.addPage();
        doc.y = 50;
      }
      const y = doc.y;
      doc.fontSize(9).font('Helvetica-Bold').text(`${pieza.numero}. ${pieza.ubicacion}`, 50, y);
      doc.fontSize(8).font('Helvetica').text(`${pieza.sistema}`, 300, y);
      doc.moveDown(0.3);
      doc.fontSize(7).font('Helvetica');
      const specs = [`${pieza.ancho}×${pieza.alto}m`, pieza.motorizado ? 'Motorizado' : 'Manual', pieza.control ? `Control: ${pieza.control}` : null, pieza.color ? `Color: ${pieza.color}` : null, pieza.galeriaCompartida ? `[GAL-${pieza.grupoGaleria || 'A'}]` : null, pieza.sistemaSkyline ? '[SKYLINE]' : null, pieza.motorCompartido ? `[MOTOR-${pieza.grupoMotor || 'M1'}]` : null].filter(Boolean).join(' | ');
      doc.text(specs, 60, doc.y);
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
    });
    
    doc.moveDown(1);
    this.dibujarSeccionOptimizacionCortes(doc, datos);
    
    doc.fontSize(8).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
  }

  // ... (el resto de los métodos se mantienen igual)
  
  static generarPaginaEtiquetas(doc, datos) {
    const { proyecto, piezas } = datos;
    doc.fontSize(16).font('Helvetica-Bold').text('ETIQUETAS DE PRODUCCIÓN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`Orden: ${proyecto.numero}`, { align: 'center' });
    doc.moveDown(1);
    const etiquetaWidth = 250, etiquetaHeight = 120, marginX = 50, marginY = doc.y, spacingX = 20, spacingY = 15;
    
    piezas.forEach((pieza, index) => {
      const col = index % 2, row = Math.floor(index / 2);
      const x = marginX + (col * (etiquetaWidth + spacingX)), y = marginY + (row * (etiquetaHeight + spacingY));
      if (y + etiquetaHeight > 700) { doc.addPage(); doc.y = 50; return; }
      doc.save().dash(3, { space: 3 }).rect(x, y, etiquetaWidth, etiquetaHeight).stroke().undash().restore();
      let currentY = y + 8;
      doc.fontSize(9).font('Helvetica-Bold').text(`ORDEN: ${proyecto.numero}`, x + 10, currentY); currentY += 14;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC').text(`PIEZA ${pieza.numero} de ${piezas.length}`, x + 10, currentY).fillColor('#000'); currentY += 12;
      doc.fontSize(7).font('Helvetica');
      doc.text(`Ubicación: ${pieza.ubicacion}`, x + 10, currentY); currentY += 10;
      doc.text(`Producto: ${pieza.producto || 'N/A'} ${pieza.color || ''}`, x + 10, currentY); currentY += 10;
      doc.text(`Dimensiones: ${pieza.ancho}m × ${pieza.alto}m`, x + 10, currentY);
      const qrSize = 60, qrX = x + etiquetaWidth - qrSize - 10, qrY = y + 10;
      doc.rect(qrX, qrY, qrSize, qrSize).stroke();
      doc.fontSize(6).fillColor('#999').text('QR', qrX + 25, qrY + 25).fillColor('#000');
    });
  }

  static generarPaginaDetallePiezas(doc, datos) {
    doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE FABRICACIÓN POR PIEZA', { align: 'center' });
    doc.moveDown(0.8);
    datos.piezas.forEach((pieza, index) => {
      if (doc.y > 620) { doc.addPage(); doc.y = 50; }
      doc.fontSize(12).font('Helvetica-Bold').text(`PIEZA #${pieza.numero}`, 50, doc.y);
      doc.fontSize(10).font('Helvetica').text(`${pieza.ubicacion}`, 150, doc.y - 12);
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica-Bold').text(`Medidas: ${pieza.ancho} × ${pieza.alto}m`, 60, doc.y);
      doc.moveDown(0.5);
      // ... (resto de la lógica de detalle)
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });
  }
  
  static dibujarSeccion(doc, titulo) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text(titulo, 50, doc.y);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000000');
  }
}

module.exports = PDFOrdenProduccionService;
