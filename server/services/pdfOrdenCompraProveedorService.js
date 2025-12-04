/**
 * PDF Orden de Compra para Proveedor - V4.0
 * Formato profesional con todas las mejoras:
 * - Título "ORDEN DE COMPRA" con número
 * - Datos del proveedor
 * - Tabla de materiales con precios
 * - Resumen financiero
 * - Términos y condiciones
 * - Firmas profesionales
 */

const PDFDocument = require('pdfkit');
const logger = require('../config/logger');
const Almacen = require('../models/Almacen');
const SobranteMaterial = require('../models/SobranteMaterial');

class PDFOrdenCompraProveedorService {
  
  /**
   * Genera PDF de Orden de Compra para Proveedor
   * @param {object} datosOrden - Datos de la orden de producción
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDF(datosOrden) {
    // Primero consultar almacén y sobrantes
    const inventario = await this.consultarInventario(datosOrden);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'LETTER',
          margins: { top: 40, bottom: 40, left: 50, right: 50 }
        });
        
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        
        // Calcular despiece para materiales CON inventario
        const despiece = this.calcularDespiece(datosOrden, inventario);
        
        // PÁGINA 1: ORDEN DE COMPRA
        this.generarPaginaOrdenCompra(doc, datosOrden, despiece);
        
        // PÁGINA 2 (OPCIONAL): ANEXO - DETALLE POR PIEZA
        if (datosOrden.piezas && datosOrden.piezas.length > 0) {
          doc.addPage();
          this.generarPaginaAnexoDetalle(doc, datosOrden, despiece);
        }
        
        doc.end();
        
        logger.info('PDF Orden de Compra Proveedor generado', {
          servicio: 'pdfOrdenCompraProveedorService',
          proyecto: datosOrden.proyecto?.numero,
          totalItems: despiece.totalItems,
          itemsEnAlmacen: despiece.itemsEnAlmacen,
          itemsAComprar: despiece.itemsAComprar
        });
        
      } catch (error) {
        logger.error('Error generando PDF Orden de Compra', {
          servicio: 'pdfOrdenCompraProveedorService',
          error: error.message,
          stack: error.stack
        });
        reject(error);
      }
    });
  }
  
  /**
   * Consultar inventario de almacén y sobrantes
   */
  static async consultarInventario(datosOrden) {
    try {
      // Obtener todo el stock de almacén
      const stockAlmacen = await Almacen.find({ cantidad: { $gt: 0 } }).lean();
      
      // Obtener sobrantes disponibles
      const sobrantes = await SobranteMaterial.find({ estado: 'disponible' }).lean();
      
      // Organizar por tipo
      const inventario = {
        tubos: stockAlmacen.filter(s => s.tipo === 'Tubo'),
        telas: stockAlmacen.filter(s => s.tipo === 'Tela'),
        contrapesos: stockAlmacen.filter(s => s.tipo === 'Contrapeso'),
        mecanismos: stockAlmacen.filter(s => s.tipo === 'Mecanismo'),
        motores: stockAlmacen.filter(s => s.tipo === 'Motor'),
        sobrantes: {
          tubos: sobrantes.filter(s => s.tipo === 'Tubo'),
          telas: sobrantes.filter(s => s.tipo === 'Tela'),
          contrapesos: sobrantes.filter(s => s.tipo === 'Contrapeso')
        }
      };
      
      logger.info('Inventario consultado', {
        servicio: 'pdfOrdenCompraProveedorService',
        tubosEnStock: inventario.tubos.length,
        telasEnStock: inventario.telas.length,
        sobrantesTubos: inventario.sobrantes.tubos.length
      });
      
      return inventario;
    } catch (error) {
      logger.warn('Error consultando inventario, continuando sin stock', {
        error: error.message
      });
      return { tubos: [], telas: [], contrapesos: [], mecanismos: [], motores: [], sobrantes: { tubos: [], telas: [], contrapesos: [] } };
    }
  }
  
  /**
   * Usar directamente los datos de listaPedido que ya vienen calculados
   * por ordenProduccionService (igual que pdfOrdenFabricacionService)
   */
  static calcularDespiece(datosOrden, inventario = {}) {
    const materialesAComprar = [];
    let itemNum = 1;
    
    const listaPedido = datosOrden.listaPedido || {};
    
    // TUBOS - Ya vienen con barrasNecesarias calculadas
    if (listaPedido.tubos) {
      listaPedido.tubos.forEach(tubo => {
        materialesAComprar.push({
          numero: itemNum++,
          categoria: 'TUBOS',
          descripcion: tubo.descripcion || `Tubo Ø${tubo.diametro || '50mm'}`,
          especificaciones: `${tubo.barrasNecesarias} barras de 5.80m`,
          cantidad: tubo.barrasNecesarias || 1,
          unidad: 'barras',
          precio: ''
        });
      });
    }
    
    // TELAS - Ya vienen con requerimientoTotal y anchoRollo
    if (listaPedido.telas) {
      listaPedido.telas.forEach(tela => {
        const modelo = tela.modelo || tela.descripcion || 'Tela';
        const color = tela.color || '';
        const faltante = parseFloat(tela.faltante) || parseFloat(tela.requerimientoTotal) || 0;
        
        if (faltante > 0) {
          materialesAComprar.push({
            numero: itemNum++,
            categoria: 'TELAS',
            descripcion: `${modelo} ${color}`.trim(),
            especificaciones: `Ancho ${tela.anchoRollo || 2.50}m`,
            cantidad: faltante.toFixed(2),
            unidad: 'ml',
            precio: ''
          });
        }
      });
    }
    
    // CONTRAPESOS - Ya vienen con barrasNecesarias
    if (listaPedido.contrapesos) {
      listaPedido.contrapesos.forEach(cp => {
        materialesAComprar.push({
          numero: itemNum++,
          categoria: 'CONTRAPESOS',
          descripcion: cp.descripcion || 'Contrapeso aluminio',
          especificaciones: `${cp.barrasNecesarias} barras de 5.80m`,
          cantidad: cp.barrasNecesarias || 1,
          unidad: 'barras',
          precio: ''
        });
      });
    }
    
    // MECANISMOS - Ya vienen con cantidad y tipo
    if (listaPedido.mecanismos) {
      listaPedido.mecanismos.forEach(mec => {
        materialesAComprar.push({
          numero: itemNum++,
          categoria: mec.esMotor ? 'MOTORES' : 'MECANISMOS',
          descripcion: mec.descripcion || (mec.esMotor ? 'Motor tubular' : 'Mecanismo cadena'),
          especificaciones: '',
          cantidad: mec.cantidad || 1,
          unidad: 'pzas',
          precio: ''
        });
      });
    }
    
    // ACCESORIOS - Ya vienen con descripción y cantidad
    if (listaPedido.accesorios) {
      listaPedido.accesorios.forEach(acc => {
        // Truncar descripción si es muy larga
        let desc = acc.descripcion || 'Accesorio';
        if (desc.length > 45) {
          desc = desc.substring(0, 42) + '...';
        }
        
        materialesAComprar.push({
          numero: itemNum++,
          categoria: 'ACCESORIOS',
          descripcion: desc,
          especificaciones: '',
          cantidad: acc.cantidad || 1,
          unidad: 'pzas',
          precio: ''
        });
      });
    }
    
    return {
      materiales: materialesAComprar,
      materialesEnAlmacen: [],
      totalItems: materialesAComprar.length,
      itemsEnAlmacen: 0,
      itemsAComprar: materialesAComprar.length
    };
  }
  
  /**
   * PÁGINA 1: ORDEN DE COMPRA
   */
  static generarPaginaOrdenCompra(doc, datos, despiece) {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    
    // ===== ENCABEZADO =====
    this.dibujarEncabezado(doc, datos, pageWidth);
    
    // ===== DATOS DEL PROVEEDOR =====
    this.dibujarSeccionProveedor(doc, pageWidth);
    
    // ===== DATOS DEL PEDIDO =====
    this.dibujarSeccionPedido(doc, datos, pageWidth);
    
    // ===== TABLA DE MATERIALES =====
    this.dibujarTablaMateriales(doc, despiece, pageWidth);
    
    // ===== RESUMEN FINANCIERO =====
    this.dibujarResumenFinanciero(doc, despiece, pageWidth);
    
    // ===== TÉRMINOS Y CONDICIONES =====
    this.dibujarTerminosCondiciones(doc, pageWidth);
    
    // ===== FIRMAS =====
    this.dibujarFirmas(doc, pageWidth);
  }
  
  /**
   * Dibujar encabezado con título y número de orden
   */
  static dibujarEncabezado(doc, datos, pageWidth) {
    const numeroOrden = `OC-${datos.proyecto?.numero || 'N/A'}`;
    const fecha = new Date().toLocaleDateString('es-MX', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    // Título principal
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('ORDEN DE COMPRA', { align: 'center' });
    
    doc.moveDown(0.3);
    
    // Número de orden y fecha
    doc.fontSize(11).font('Helvetica').fillColor('#000');
    doc.text(`Orden #: ${numeroOrden}`, { align: 'center' });
    doc.text(`Fecha de emisión: ${fecha}`, { align: 'center' });
    
    // Línea decorativa
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor('#D4AF37').lineWidth(2).stroke();
    doc.moveDown(0.8);
  }
  
  /**
   * Sección de datos del proveedor
   */
  static dibujarSeccionProveedor(doc, pageWidth) {
    const startY = doc.y;
    const boxWidth = pageWidth;
    
    // Título de sección
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('DATOS DEL PROVEEDOR', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.3);
    
    // Campos para llenar
    doc.fontSize(9).font('Helvetica');
    const campos = [
      'Nombre/Razón Social: _________________________________________________',
      'Contacto: _________________________ Teléfono: _________________________',
      'Email: _________________________________ RFC: _________________________'
    ];
    
    campos.forEach(campo => {
      doc.text(campo, 50, doc.y);
      doc.moveDown(0.4);
    });
    
    doc.moveDown(0.5);
  }
  
  /**
   * Sección de datos del pedido
   */
  static dibujarSeccionPedido(doc, datos, pageWidth) {
    // Título de sección
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('DATOS DEL PEDIDO', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.3);
    
    doc.fontSize(9).font('Helvetica');
    
    // Datos del proyecto
    doc.text(`Proyecto: ${datos.proyecto?.numero || 'N/A'}`, 50, doc.y);
    doc.text(`Cliente: ${datos.cliente?.nombre || 'N/A'}`, 300, doc.y - 11);
    doc.moveDown(0.4);
    
    doc.text(`Fecha requerida: _______________________`, 50, doc.y);
    doc.text(`Prioridad: ${datos.proyecto?.prioridad || 'Normal'}`, 300, doc.y - 11);
    doc.moveDown(0.4);
    
    doc.text(`Lugar de entrega: Taller Sundeck`, 50, doc.y);
    doc.text(`Recibe: _______________________`, 300, doc.y - 11);
    
    doc.moveDown(0.8);
  }
  
  /**
   * Tabla de materiales solicitados
   */
  static dibujarTablaMateriales(doc, despiece, pageWidth) {
    const startX = 50;
    
    // ===== SECCIÓN: DISPONIBLE EN ALMACÉN =====
    if (despiece.materialesEnAlmacen && despiece.materialesEnAlmacen.length > 0) {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#006400');
      doc.text('✓ DISPONIBLE EN ALMACÉN', startX, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.3);
      
      doc.fontSize(8).font('Helvetica');
      despiece.materialesEnAlmacen.forEach(mat => {
        const texto = `• ${mat.descripcion}: ${mat.enStock} ${mat.unidad}`;
        const extra = mat.sobrantes ? ` ${mat.sobrantes}` : '';
        doc.text(`${texto}${extra} - ${mat.ubicacion}`, startX + 10, doc.y);
      });
      
      doc.moveDown(0.8);
    }
    
    // ===== SECCIÓN: MATERIALES A COMPRAR =====
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('MATERIALES A COMPRAR', startX, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.5);
    
    // Encabezados de tabla
    const colWidths = [30, 200, 60, 60, 70];
    const headers = ['#', 'DESCRIPCIÓN', 'CANT.', 'UNIDAD', 'PRECIO'];
    let currentY = doc.y;
    
    // Fondo del encabezado
    doc.rect(startX, currentY - 3, pageWidth, 18).fill('#1E40AF');
    
    // Texto del encabezado
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFF');
    let xPos = startX + 5;
    headers.forEach((header, i) => {
      doc.text(header, xPos, currentY, { width: colWidths[i] - 10, align: i === 0 ? 'center' : 'left' });
      xPos += colWidths[i];
    });
    
    currentY += 18;
    doc.fillColor('#000');
    
    // Filas de materiales
    let categoriaActual = '';
    
    despiece.materiales.forEach((mat, index) => {
      // Separador de categoría
      if (mat.categoria !== categoriaActual) {
        // Verificar espacio para categoría
        if (currentY > 650) {
          doc.addPage();
          currentY = 50;
        }
        categoriaActual = mat.categoria;
        doc.rect(startX, currentY, pageWidth, 16).fill('#E8E8E8');
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
        doc.text(categoriaActual, startX + 5, currentY + 4);
        currentY += 20;
        doc.fillColor('#000');
      }
      
      // Calcular altura de fila basada en longitud del texto
      const descLength = (mat.descripcion || '').length;
      const specLength = (mat.especificaciones || '').length;
      let rowHeight = 20; // Base mínima
      
      // Aumentar altura si descripción es larga (más de 40 caracteres)
      if (descLength > 40) rowHeight += 12;
      if (descLength > 80) rowHeight += 12;
      
      // Aumentar si especificaciones son largas
      if (specLength > 30) rowHeight += 10;
      
      // Verificar si necesitamos nueva página
      if (currentY + rowHeight > 650) {
        doc.addPage();
        currentY = 50;
      }
      
      // Línea alternada
      if (index % 2 === 0) {
        doc.rect(startX, currentY, pageWidth, rowHeight).fill('#F8F8F8');
      }
      
      doc.fontSize(8).font('Helvetica').fillColor('#000');
      xPos = startX + 3;
      
      // Número
      doc.text(mat.numero.toString(), xPos, currentY + 4, { width: colWidths[0] - 5, align: 'center' });
      xPos += colWidths[0];
      
      // Descripción (con wrap automático)
      const descY = currentY + 3;
      doc.font('Helvetica-Bold').fontSize(8);
      doc.text(mat.descripcion || '', xPos, descY, { 
        width: colWidths[1] - 10,
        lineGap: 1
      });
      
      // Especificaciones debajo si hay espacio
      if (mat.especificaciones && rowHeight >= 30) {
        doc.font('Helvetica').fontSize(7).fillColor('#666');
        const specY = descLength > 40 ? descY + 20 : descY + 11;
        doc.text(mat.especificaciones, xPos, specY, { width: colWidths[1] - 10 });
        doc.fillColor('#000');
      }
      xPos += colWidths[1];
      
      // Cantidad
      doc.font('Helvetica-Bold').fontSize(9).text(mat.cantidad.toString(), xPos, currentY + 4, { width: colWidths[2] - 10, align: 'center' });
      xPos += colWidths[2];
      
      // Unidad
      doc.font('Helvetica').fontSize(8).text(mat.unidad, xPos, currentY + 4, { width: colWidths[3] - 10 });
      xPos += colWidths[3];
      
      // Precio (campo para llenar)
      doc.text('$_________', xPos, currentY + 4, { width: colWidths[4] - 10 });
      
      currentY += rowHeight + 2;
    });
    
    // Línea final de tabla
    doc.moveTo(startX, currentY).lineTo(startX + pageWidth, currentY).strokeColor('#CCC').lineWidth(1).stroke();
    
    doc.y = currentY + 10;
  }
  
  /**
   * Resumen financiero
   */
  static dibujarResumenFinanciero(doc, despiece, pageWidth) {
    const boxX = 350;
    const boxWidth = 160;
    const startY = doc.y;
    
    // Caja de resumen
    doc.rect(boxX, startY, boxWidth, 70).stroke();
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('RESUMEN', boxX + 10, startY + 8);
    doc.fillColor('#000');
    
    doc.fontSize(8).font('Helvetica');
    doc.text(`Total de items: ${despiece.totalItems}`, boxX + 10, startY + 22);
    
    doc.moveDown(0.3);
    doc.text('Subtotal:     $_____________', boxX + 10, startY + 34);
    doc.text('IVA (16%):    $_____________', boxX + 10, startY + 46);
    
    doc.font('Helvetica-Bold');
    doc.text('TOTAL:        $_____________', boxX + 10, startY + 58);
    
    doc.y = startY + 80;
  }
  
  /**
   * Términos y condiciones
   */
  static dibujarTerminosCondiciones(doc, pageWidth) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('TÉRMINOS Y CONDICIONES', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.3);
    
    doc.fontSize(8).font('Helvetica');
    doc.text('Forma de pago: _______________________________________________________', 50, doc.y);
    doc.moveDown(0.3);
    doc.text('Tiempo de entrega: ___________________________________________________', 50, doc.y);
    doc.moveDown(0.3);
    doc.text('Garantía: ____________________________________________________________', 50, doc.y);
    doc.moveDown(0.3);
    doc.text('Observaciones: _______________________________________________________', 50, doc.y);
    doc.moveDown(0.2);
    doc.text('________________________________________________________________________', 50, doc.y);
    
    doc.moveDown(0.8);
  }
  
  /**
   * Sección de firmas
   */
  static dibujarFirmas(doc, pageWidth) {
    const startY = doc.y;
    const colWidth = pageWidth / 2 - 20;
    
    // Verificar espacio
    if (startY > 650) {
      doc.addPage();
      doc.y = 50;
    }
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('AUTORIZACIÓN', 50, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.8);
    
    const firmaY = doc.y;
    
    // Firma izquierda - Solicitante
    doc.fontSize(8).font('Helvetica');
    doc.text('Solicitado por:', 50, firmaY);
    doc.moveDown(1.5);
    doc.text('_________________________________', 50, doc.y);
    doc.text('Nombre: _________________________', 50, doc.y + 12);
    doc.text('Puesto: Compras / Producción', 50, doc.y + 24);
    doc.text('Fecha: __________________________', 50, doc.y + 36);
    
    // Firma derecha - Proveedor
    doc.text('Aceptado por (Proveedor):', 300, firmaY);
    doc.text('_________________________________', 300, firmaY + 35);
    doc.text('Nombre: _________________________', 300, firmaY + 47);
    doc.text('Empresa: ________________________', 300, firmaY + 59);
    doc.text('Fecha: __________________________', 300, firmaY + 71);
    
    // Pie de página
    doc.y = doc.page.height - 60;
    doc.fontSize(7).fillColor('#999');
    doc.text('Documento generado por Sundeck CRM | Este documento es válido como orden de compra una vez firmado', 50, doc.y, { align: 'center', width: pageWidth });
  }
  
  /**
   * PÁGINA 2: ANEXO - DETALLE POR PIEZA
   */
  static generarPaginaAnexoDetalle(doc, datos, despiece) {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let currentY = 50;
    
    // Título
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1E40AF');
    doc.text('ANEXO - DETALLE POR PIEZA', 50, currentY, { align: 'center', width: pageWidth });
    doc.fillColor('#000');
    currentY += 25;
    
    doc.fontSize(9).font('Helvetica').fillColor('#666');
    doc.text('(Información técnica de referencia - Solo si el proveedor lo requiere)', 50, currentY, { align: 'center', width: pageWidth });
    doc.fillColor('#000');
    currentY += 30;
    
    // Listar piezas
    datos.piezas.forEach((pieza, index) => {
      // Verificar espacio (cada pieza necesita ~60px)
      if (currentY > 680) {
        doc.addPage();
        currentY = 50;
      }
      
      // Número y ubicación
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E40AF');
      doc.text(`${index + 1}. ${pieza.ubicacion || 'Pieza ' + (index + 1)}`, 50, currentY);
      doc.fillColor('#000');
      currentY += 14;
      
      // Detalles
      doc.fontSize(8).font('Helvetica');
      doc.text(`Sistema: ${pieza.sistema || 'Roller Shade'} | Medidas: ${pieza.ancho}m x ${pieza.alto}m`, 60, currentY);
      currentY += 12;
      
      if (pieza.telaMarca || pieza.color) {
        doc.text(`Tela: ${pieza.telaMarca || ''} ${pieza.color || ''}`.trim(), 60, currentY);
        currentY += 12;
      }
      
      if (pieza.motorizado) {
        doc.text(`Motorizado: Sí`, 60, currentY);
        currentY += 12;
      }
      
      currentY += 5;
      
      // Línea separadora
      doc.moveTo(50, currentY).lineTo(50 + pageWidth, currentY).strokeColor('#EEE').lineWidth(0.5).stroke();
      currentY += 10;
    });
  }
}

module.exports = PDFOrdenCompraProveedorService;
