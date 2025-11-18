/**
 * Servicio de PDF Lista de Pedido V2.0
 * Genera PDF compacto (máximo 2 páginas) para compras
 */

const PDFDocument = require('pdfkit');
const logger = require('../config/logger');

class PDFListaPedidoV2Service {

  /**
   * Generar PDF de Lista de Pedido V2.0
   * @param {Object} datosProyecto - Datos del proyecto
   * @param {Object} listaOptimizada - Lista optimizada con inventario
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDF(datosProyecto, listaOptimizada) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER',
          margins: { top: 40, bottom: 40, left: 40, right: 40 }
        });
        
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // PÁGINA 1: PEDIDO A PROVEEDOR
        this.generarPaginaPedido(doc, datosProyecto, listaOptimizada);
        
        // PÁGINA 2: ALMACÉN + GARANTÍAS
        doc.addPage();
        this.generarPaginaAlmacenGarantias(doc, listaOptimizada);
        
        doc.end();

        logger.info('PDF Lista de Pedido V2 generado', {
          servicio: 'pdfListaPedidoV2Service',
          proyecto: datosProyecto.proyecto.numero
        });

      } catch (error) {
        logger.error('Error generando PDF Lista de Pedido V2', {
          servicio: 'pdfListaPedidoV2Service',
          error: error.message
        });
        reject(error);
      }
    });
  }

  /**
   * PÁGINA 1: PEDIDO A PROVEEDOR
   */
  static generarPaginaPedido(doc, datos, listaOpt) {
    const { proyecto, cliente } = datos;
    const { pedirProveedor, resumen } = listaOpt;

    // ENCABEZADO
    doc.fontSize(18).font('Helvetica-Bold')
       .text('LISTA DE PEDIDO A PROVEEDOR', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
       .text(`Orden: ${proyecto.numero}`, { align: 'center' });
    
    doc.moveDown(0.8);

    // DATOS DEL PROYECTO
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('PROYECTO:', 40, doc.y);
    doc.fontSize(8).font('Helvetica');
    doc.text(`${cliente.nombre} | ${proyecto.numero} | ${new Date().toLocaleDateString('es-MX')}`, 40, doc.y);
    
    doc.moveDown(0.5);
    
    // CHECKLIST DE VERIFICACIÓN ANTES DE PEDIR
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#FF6600');
    doc.text('VERIFICAR ANTES DE PEDIR:', 40, doc.y);
    doc.fillColor('#000');
    doc.fontSize(7).font('Helvetica');
    doc.text('   [ ] Stock en almacen revisado', 45, doc.y);
    doc.text('   [ ] Cantidades confirmadas', 45, doc.y);
    doc.text('   [ ] Modelos y colores verificados', 45, doc.y);
    
    doc.moveDown(0.8);

    // SECCIÓN 1: TELAS
    if (pedirProveedor.telas.length > 0) {
      this.dibujarSeccion(doc, 'TELAS');
      
      pedirProveedor.telas.forEach((tela, idx) => {
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`${idx + 1}. ${tela.descripcion}`, 45, doc.y);
        
        doc.fontSize(7).font('Helvetica');
        doc.text(`   Requerimiento: ${tela.requerimiento} ml`, 50, doc.y);
        doc.text(`   Stock almacen: ${tela.stockAlmacen} ml`, 50, doc.y);
        
        // Mostrar si se pide por ml o rollo completo
        if (tela.pedirRollo) {
          doc.text(`   >> PEDIR: ${tela.rollosAPedir} rollo(s) de ${tela.metrosRollo} ml`, 50, doc.y);
          doc.fontSize(6).fillColor('#666');
          doc.text(`   Sobrante estimado: ${tela.sobranteEstimado} ml`, 50, doc.y);
          doc.fillColor('#000');
        } else {
          doc.text(`   >> PEDIR: ${tela.metrosAPedir} ml (compra por metro)`, 50, doc.y);
        }
        
        // Mostrar observaciones de cortes si existen
        if (tela.detallesPiezas && tela.detallesPiezas.length > 0) {
          doc.fontSize(7).font('Helvetica-Bold').fillColor('#0066CC');
          doc.text(`   OBSERVACIONES DE CORTES:`, 50, doc.y);
          doc.fillColor('#000');
          
          tela.detallesPiezas.forEach(pieza => {
            doc.fontSize(6).font('Helvetica');
            doc.text(`      - ${pieza.ubicacion}: ${pieza.ancho}m x ${pieza.alto}m = ${pieza.metrosLineales}ml`, 55, doc.y);
            
            if (pieza.sobranteLienzo) {
              doc.fillColor('#006400');
              doc.text(`        Sobrante de lienzo: ${pieza.sobranteLienzo.ancho}m x ${pieza.sobranteLienzo.largo}ml (guardar)`, 60, doc.y);
              doc.fillColor('#000');
            }
          });
        }
        
        doc.moveDown(0.5);
      });
    }

    // SECCIÓN 2: CINTA
    if (pedirProveedor.cinta.length > 0) {
      this.dibujarSeccion(doc, 'CINTA DOBLE CARA');
      
      pedirProveedor.cinta.forEach((cinta) => {
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`${cinta.descripcion}`, 45, doc.y);
        
        doc.fontSize(7).font('Helvetica');
        doc.text(`   Requerimiento: ${cinta.requerimiento} ml`, 50, doc.y);
        doc.text(`   Stock almacen: ${cinta.stockAlmacen} ml`, 50, doc.y);
        doc.text(`   >> PEDIR: ${cinta.rollosAPedir} rollo(s) de ${cinta.metrosRollo} ml`, 50, doc.y);
        doc.fontSize(6).fillColor('#666');
        doc.text(`   Sobrante estimado: ${cinta.sobranteEstimado} ml`, 50, doc.y);
        doc.fillColor('#000');
        
        doc.moveDown(0.5);
      });
    }

    // SECCIÓN 3: TUBOS
    if (pedirProveedor.tubos.length > 0) {
      this.dibujarSeccion(doc, 'TUBOS');
      
      pedirProveedor.tubos.forEach((tubo, idx) => {
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`${idx + 1}. ${tubo.descripcion}`, 45, doc.y);
        
        doc.fontSize(7).font('Helvetica');
        doc.text(`   Requerimiento: ${tubo.requerimiento} ml`, 50, doc.y);
        doc.text(`   >> PEDIR: ${tubo.barrasAPedir} barra(s) de ${tubo.longitudBarra}m`, 50, doc.y);
        
        doc.moveDown(0.5);
      });
    }

    // SECCIÓN 4: CONTRAPESOS
    if (pedirProveedor.contrapesos.length > 0) {
      this.dibujarSeccion(doc, 'CONTRAPESOS');
      
      pedirProveedor.contrapesos.forEach((cp, idx) => {
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text(`${idx + 1}. ${cp.descripcion}`, 45, doc.y);
        
        doc.fontSize(7).font('Helvetica');
        doc.text(`   Requerimiento: ${cp.requerimiento} ml`, 50, doc.y);
        doc.text(`   >> PEDIR: ${cp.barrasAPedir} barra(s) de ${cp.longitudBarra}m`, 50, doc.y);
        
        doc.moveDown(0.5);
      });
    }

    // SECCIÓN 5: MOTORES Y CONTROLES
    if (resumen.piezasMotorizadas > 0) {
      this.dibujarSeccion(doc, 'MOTORES Y CONTROLES');
      
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text(`MOTORES REQUERIDOS: ${resumen.piezasMotorizadas} piezas motorizadas`, 45, doc.y);
      
      doc.fontSize(7).font('Helvetica');
      doc.text(`   >> PEDIR: _______ motores (especificar modelo)`, 50, doc.y);
      doc.moveDown(0.3);
      doc.text(`   Modelo: ___________________________________`, 50, doc.y);
      
      doc.moveDown(0.5);
      
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text(`CONTROLES RF:`, 45, doc.y);
      doc.fontSize(7).font('Helvetica');
      doc.text(`   Tipo de control: _____________________________`, 50, doc.y);
      doc.text(`   Cantidad: _______`, 50, doc.y);
      doc.text(`   Observaciones: _______________________________`, 50, doc.y);
      
      doc.moveDown(0.5);
    }

    // SECCIÓN 6: ACCESORIOS
    if (pedirProveedor.accesorios.length > 0) {
      this.dibujarSeccion(doc, 'ACCESORIOS');
      
      pedirProveedor.accesorios.slice(0, 5).forEach((acc, idx) => {
        doc.fontSize(7).font('Helvetica');
        doc.text(`   ${idx + 1}. ${acc.descripcion}: ${acc.cantidad} ${acc.unidad}`, 50, doc.y);
      });
      
      doc.moveDown(0.5);
    }

    // FOOTER
    doc.fontSize(7).font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 40, 720, { align: 'center' });
  }

  /**
   * PÁGINA 2: ALMACÉN + GARANTÍAS
   */
  static generarPaginaAlmacenGarantias(doc, listaOpt) {
    const { tomarAlmacen, nuevoStock } = listaOpt;

    // TÍTULO
    doc.fontSize(16).font('Helvetica-Bold')
       .text('MATERIALES DE ALMACEN + GARANTIAS', { align: 'center' });
    
    doc.moveDown(1);

    // SECCIÓN 1: TOMAR DE ALMACÉN
    this.dibujarSeccion(doc, 'TOMAR DE ALMACEN');
    
    let hayMateriales = false;

    if (tomarAlmacen.telas.length > 0) {
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('TELAS:', 45, doc.y);
      
      tomarAlmacen.telas.forEach((tela) => {
        doc.fontSize(7).font('Helvetica');
        doc.text(`   ${tela.descripcion}: ${tela.cantidad} ml`, 50, doc.y);
        doc.fontSize(6).fillColor('#666');
        doc.text(`   (Stock antes: ${tela.stockAntes} ml | despues: ${tela.stockDespues} ml)`, 55, doc.y);
        doc.fillColor('#000');
      });
      
      doc.moveDown(0.5);
      hayMateriales = true;
    }

    if (tomarAlmacen.cinta.length > 0) {
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('CINTA:', 45, doc.y);
      
      tomarAlmacen.cinta.forEach((cinta) => {
        doc.fontSize(7).font('Helvetica');
        doc.text(`   ${cinta.descripcion}: ${cinta.cantidad} ml`, 50, doc.y);
        doc.fontSize(6).fillColor('#666');
        doc.text(`   (Stock antes: ${cinta.stockAntes} ml | despues: ${cinta.stockDespues} ml)`, 55, doc.y);
        doc.fillColor('#000');
      });
      
      doc.moveDown(0.5);
      hayMateriales = true;
    }

    if (tomarAlmacen.tubos.length > 0) {
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('TUBOS:', 45, doc.y);
      
      tomarAlmacen.tubos.forEach((tubo) => {
        doc.fontSize(7).font('Helvetica');
        doc.text(`   ${tubo.descripcion}: ${tubo.cantidad} ml`, 50, doc.y);
      });
      
      doc.moveDown(0.5);
      hayMateriales = true;
    }

    if (!hayMateriales) {
      doc.fontSize(8).font('Helvetica').fillColor('#999');
      doc.text('No hay materiales disponibles en almacen', 45, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.5);
    }

    // SECCIÓN 2: NUEVO STOCK ESTIMADO
    if (nuevoStock.length > 0) {
      this.dibujarSeccion(doc, 'NUEVO STOCK ESTIMADO (DESPUES DEL PROYECTO)');
      
      nuevoStock.forEach((item) => {
        doc.fontSize(7).font('Helvetica');
        doc.text(`   ${item.tipo}: ${item.descripcion} - ${item.cantidadNueva} ${item.unidad}`, 50, doc.y);
      });
      
      doc.moveDown(1);
    }

    // SECCIÓN 3: CHECKLIST DE RECEPCIÓN
    this.dibujarSeccion(doc, 'CHECKLIST DE RECEPCION');
    
    doc.fontSize(7).font('Helvetica');
    doc.text('Al recibir los materiales, verificar:', 45, doc.y);
    doc.moveDown(0.3);
    
    const checksRecepcion = [
      'Cantidad de rollos/barras coincide con pedido',
      'Metros lineales correctos (si aplica)',
      'Modelo y color de telas correcto',
      'Diametro de tubos correcto',
      'Sin danos visibles en empaques',
      'Facturas y remisiones completas'
    ];
    
    checksRecepcion.forEach(check => {
      doc.fontSize(7).font('Helvetica');
      doc.text(`   [ ] ${check}`, 50, doc.y);
    });
    
    doc.moveDown(0.5);
    doc.fontSize(7).font('Helvetica');
    doc.text('Recibido por: ___________________  Fecha: __________', 45, doc.y);
    doc.moveDown(1);
    
    // SECCIÓN 4: OBSERVACIONES PARA GARANTÍAS
    this.dibujarSeccion(doc, 'OBSERVACIONES PARA GARANTIAS');
    
    doc.fontSize(8).font('Helvetica');
    doc.text('Proveedor de Telas: ___________________________________', 45, doc.y);
    doc.text('Factura/Remision: _____________________________________', 45, doc.y);
    doc.moveDown(0.5);
    
    doc.text('Proveedor de Motores: _________________________________', 45, doc.y);
    doc.text('Factura/Remision: _____________________________________', 45, doc.y);
    doc.moveDown(0.5);
    
    doc.text('Proveedor de Accesorios: ______________________________', 45, doc.y);
    doc.text('Factura/Remision: _____________________________________', 45, doc.y);
    doc.moveDown(0.8);
    
    doc.text('Notas Adicionales:', 45, doc.y);
    doc.text('_______________________________________________________', 45, doc.y);
    doc.text('_______________________________________________________', 45, doc.y);
    doc.text('_______________________________________________________', 45, doc.y);

    // FOOTER
    doc.fontSize(7).font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 40, 720, { align: 'center' });
  }

  /**
   * Dibujar sección con línea
   */
  static dibujarSeccion(doc, titulo) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text(titulo, 40, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.3);
  }
}

module.exports = PDFListaPedidoV2Service;
