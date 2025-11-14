const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const logger = require('../config/logger');

/**
 * Servicio para generar etiquetas de producción con QR
 */
class EtiquetasProduccionService {
  
  /**
   * Generar datos de etiqueta para una pieza
   * @param {object} pieza - Datos de la pieza
   * @param {object} proyecto - Datos del proyecto
   * @returns {object} Datos de la etiqueta
   */
  static generarDatosEtiqueta(pieza, proyecto) {
    const etiqueta = {
      // Identificación
      id: `${proyecto.numero}-${pieza.numero}`,
      proyecto: {
        numero: proyecto.numero,
        cliente: proyecto.cliente?.nombre || 'Sin nombre',
        fecha: new Date().toLocaleDateString('es-MX')
      },
      
      // Información de la pieza
      pieza: {
        numero: pieza.numero,
        ubicacion: pieza.ubicacion || `Pieza ${pieza.numero}`,
        sistema: pieza.sistema || 'No especificado',
        control: pieza.control || 'No especificado'
      },
      
      // Medidas
      medidas: {
        ancho: pieza.ancho,
        alto: pieza.alto,
        area: pieza.area || (pieza.ancho * pieza.alto)
      },
      
      // Especificaciones técnicas
      especificaciones: {
        motorizado: pieza.motorizado ? 'Sí' : 'No',
        galeria: pieza.galeria || 'Sin galería',
        color: pieza.color || 'No especificado',
        tela: pieza.telaMarca || 'No especificado'
      },
      
      // Materiales (si están disponibles)
      materiales: pieza.materiales || [],
      
      // Metadata
      generado: new Date().toISOString(),
      version: '1.0'
    };
    
    return etiqueta;
  }
  
  /**
   * Generar código QR para una etiqueta
   * @param {object} datosEtiqueta - Datos de la etiqueta
   * @returns {Promise<string>} Data URL del QR
   */
  static async generarQR(datosEtiqueta) {
    try {
      // Crear URL con datos comprimidos
      const url = `https://sundeck.app/produccion/${datosEtiqueta.id}`;
      
      // Generar QR como data URL
      const qrDataURL = await QRCode.toDataURL(url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 200,
        margin: 1
      });
      
      return qrDataURL;
      
    } catch (error) {
      logger.error('Error generando QR', {
        servicio: 'etiquetasProduccionService',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Generar PDF con etiquetas de producción
   * @param {Array} piezas - Array de piezas
   * @param {object} proyecto - Datos del proyecto
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDFEtiquetas(piezas, proyecto) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 20, bottom: 20, left: 20, right: 20 }
        });
        
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        // Título del documento
        doc.fontSize(16).font('Helvetica-Bold')
           .text('ETIQUETAS DE PRODUCCIÓN', { align: 'center' });
        doc.moveDown(0.5);
        
        doc.fontSize(10).font('Helvetica')
           .text(`Proyecto: ${proyecto.numero} - ${proyecto.cliente?.nombre || 'Sin nombre'}`, { align: 'center' });
        doc.moveDown(1);
        
        // Generar etiquetas (2 por página)
        let etiquetasPorPagina = 0;
        const ETIQUETAS_POR_PAGINA = 2;
        
        for (let i = 0; i < piezas.length; i++) {
          const pieza = piezas[i];
          
          // Nueva página si es necesario
          if (etiquetasPorPagina >= ETIQUETAS_POR_PAGINA && i < piezas.length) {
            doc.addPage();
            etiquetasPorPagina = 0;
          }
          
          // Generar datos de etiqueta
          const datosEtiqueta = this.generarDatosEtiqueta(pieza, proyecto);
          const qrDataURL = await this.generarQR(datosEtiqueta);
          
          // Posición Y de la etiqueta
          const yPos = etiquetasPorPagina === 0 ? 100 : 450;
          
          // Dibujar borde de etiqueta
          doc.rect(40, yPos - 20, 520, 280)
             .stroke();
          
          // QR Code (izquierda)
          const qrBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');
          doc.image(qrBuffer, 60, yPos, { width: 150, height: 150 });
          
          // Información (derecha)
          const infoX = 230;
          let currentY = yPos;
          
          // Encabezado
          doc.fontSize(14).font('Helvetica-Bold')
             .text(`PIEZA #${pieza.numero}`, infoX, currentY);
          currentY += 25;
          
          // ID de etiqueta
          doc.fontSize(9).font('Helvetica')
             .text(`ID: ${datosEtiqueta.id}`, infoX, currentY);
          currentY += 15;
          
          // Ubicación
          doc.fontSize(11).font('Helvetica-Bold')
             .text(pieza.ubicacion || `Pieza ${pieza.numero}`, infoX, currentY);
          currentY += 20;
          
          // Medidas
          doc.fontSize(10).font('Helvetica-Bold')
             .text('MEDIDAS:', infoX, currentY);
          currentY += 15;
          
          doc.fontSize(9).font('Helvetica')
             .text(`Ancho: ${pieza.ancho}m  |  Alto: ${pieza.alto}m  |  Área: ${(pieza.ancho * pieza.alto).toFixed(2)}m²`, 
                    infoX, currentY);
          currentY += 20;
          
          // Sistema y Control
          doc.fontSize(10).font('Helvetica-Bold')
             .text('SISTEMA:', infoX, currentY);
          currentY += 15;
          
          doc.fontSize(9).font('Helvetica')
             .text(`${pieza.sistema || 'No especificado'}`, infoX, currentY);
          currentY += 12;
          
          doc.text(`Control: ${pieza.control || 'No especificado'}`, infoX, currentY);
          currentY += 20;
          
          // Especificaciones
          doc.fontSize(10).font('Helvetica-Bold')
             .text('ESPECIFICACIONES:', infoX, currentY);
          currentY += 15;
          
          doc.fontSize(9).font('Helvetica')
             .text(`Motorizado: ${pieza.motorizado ? 'SÍ' : 'NO'}`, infoX, currentY);
          currentY += 12;
          
          doc.text(`Galería: ${pieza.galeria || 'Sin galería'}`, infoX, currentY);
          currentY += 12;
          
          doc.text(`Color: ${pieza.color || 'No especificado'}`, infoX, currentY);
          
          // Instrucciones de escaneo (abajo del QR)
          doc.fontSize(8).font('Helvetica')
             .text('Escanea el QR para ver', 60, yPos + 160, { width: 150, align: 'center' });
          doc.text('detalles completos', 60, yPos + 172, { width: 150, align: 'center' });
          
          // Línea divisoria si no es la última
          if (etiquetasPorPagina === 0 && i < piezas.length - 1) {
            doc.moveTo(40, yPos + 260)
               .lineTo(560, yPos + 260)
               .dash(5, { space: 5 })
               .stroke()
               .undash();
          }
          
          etiquetasPorPagina++;
        }
        
        // Pie de página en última página
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).font('Helvetica')
             .text(
               `Generado: ${new Date().toLocaleString('es-MX')} | Página ${i + 1} de ${pageCount}`,
               40,
               doc.page.height - 30,
               { align: 'center', width: doc.page.width - 80 }
             );
        }
        
        doc.end();
        
        logger.info('PDF de etiquetas generado', {
          servicio: 'etiquetasProduccionService',
          proyecto: proyecto.numero,
          totalPiezas: piezas.length
        });
        
      } catch (error) {
        logger.error('Error generando PDF de etiquetas', {
          servicio: 'etiquetasProduccionService',
          error: error.message,
          stack: error.stack
        });
        reject(error);
      }
    });
  }
  
  /**
   * Generar etiquetas individuales (una por página)
   * @param {Array} piezas - Array de piezas
   * @param {object} proyecto - Datos del proyecto
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarEtiquetasIndividuales(piezas, proyecto) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: [4 * 72, 6 * 72], // 4x6 pulgadas (tamaño etiqueta estándar)
          margins: { top: 20, bottom: 20, left: 20, right: 20 }
        });
        
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        
        for (let i = 0; i < piezas.length; i++) {
          if (i > 0) doc.addPage();
          
          const pieza = piezas[i];
          const datosEtiqueta = this.generarDatosEtiqueta(pieza, proyecto);
          const qrDataURL = await this.generarQR(datosEtiqueta);
          
          // QR Code centrado arriba
          const qrBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');
          doc.image(qrBuffer, 62, 30, { width: 160, height: 160 });
          
          // Información debajo del QR
          let y = 210;
          
          doc.fontSize(12).font('Helvetica-Bold')
             .text(`PIEZA #${pieza.numero}`, 20, y, { align: 'center', width: 248 });
          y += 25;
          
          doc.fontSize(10).font('Helvetica')
             .text(pieza.ubicacion || `Pieza ${pieza.numero}`, 20, y, { align: 'center', width: 248 });
          y += 25;
          
          doc.fontSize(11).font('Helvetica-Bold')
             .text(`${pieza.ancho}m × ${pieza.alto}m`, 20, y, { align: 'center', width: 248 });
          y += 25;
          
          doc.fontSize(9).font('Helvetica')
             .text(`${pieza.sistema || 'Sistema no especificado'}`, 20, y, { align: 'center', width: 248 });
          y += 20;
          
          doc.fontSize(8).font('Helvetica')
             .text(`Proyecto: ${proyecto.numero}`, 20, y, { align: 'center', width: 248 });
          y += 12;
          
          doc.text(`Cliente: ${proyecto.cliente?.nombre || 'Sin nombre'}`, 20, y, { align: 'center', width: 248 });
        }
        
        doc.end();
        
        logger.info('Etiquetas individuales generadas', {
          servicio: 'etiquetasProduccionService',
          proyecto: proyecto.numero,
          totalPiezas: piezas.length
        });
        
      } catch (error) {
        logger.error('Error generando etiquetas individuales', {
          servicio: 'etiquetasProduccionService',
          error: error.message
        });
        reject(error);
      }
    });
  }
}

module.exports = EtiquetasProduccionService;
