/**
 * Servicio para generar PDF de Orden de Producción
 * Incluye lista de pedido completa para proveedor
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const logger = require('../config/logger');

class PDFOrdenProduccionService {
  
  /**
   * Generar PDF de orden de TALLER completa (con especificaciones técnicas)
   * @param {object} datosOrden - Datos de la orden
   * @param {object} listaPedido - Lista de pedido para proveedor
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDF(datosOrden, listaPedido) {
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
        
        // PÁGINA 1: ORDEN DE FABRICACIÓN
        this.generarPaginaOrden(doc, datosOrden);
        
        // PÁGINA 2: ETIQUETAS DE PRODUCCIÓN (para imprimir y recortar)
        doc.addPage();
        this.generarPaginaEtiquetas(doc, datosOrden);
        
        // PÁGINA 3+: DETALLE POR PIEZA (con materiales simplificados)
        doc.addPage();
        this.generarPaginaDetallePiezas(doc, datosOrden);
        
        doc.end();
        
        logger.info('PDF de orden generado', {
          servicio: 'pdfOrdenProduccionService',
          proyecto: datosOrden.proyecto?.numero,
          totalPiezas: datosOrden.totalPiezas
        });
        
      } catch (error) {
        logger.error('Error generando PDF', {
          servicio: 'pdfOrdenProduccionService',
          error: error.message
        });
        reject(error);
      }
    });
  }
  
  /**
   * PÁGINA 2: Etiquetas de Producción (para imprimir y recortar)
   */
  static generarPaginaEtiquetas(doc, datos) {
    const { proyecto, piezas } = datos;
    
    // Título
    doc.fontSize(16).font('Helvetica-Bold')
       .text('ETIQUETAS DE PRODUCCIÓN', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica')
       .text(`Orden: ${proyecto.numero}`, { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(8).font('Helvetica').fillColor('#666')
       .text('Imprimir esta página y recortar cada etiqueta | Pegar en cada paquete', { align: 'center' });
    doc.fillColor('#000');
    
    doc.moveDown(1);
    
    // Configuración de etiquetas (2 por fila)
    const etiquetaWidth = 250;
    const etiquetaHeight = 120;
    const marginX = 50;
    const marginY = doc.y;
    const spacingX = 20;
    const spacingY = 15;
    
    piezas.forEach((pieza, index) => {
      const col = index % 2; // 0 o 1
      const row = Math.floor(index / 2);
      
      const x = marginX + (col * (etiquetaWidth + spacingX));
      const y = marginY + (row * (etiquetaHeight + spacingY));
      
      // Si no cabe en la página, crear nueva
      if (y + etiquetaHeight > 700) {
        doc.addPage();
        doc.y = 50;
        return; // Saltar esta iteración, se dibujará en la siguiente página
      }
      
      // Dibujar borde de etiqueta con línea punteada para recortar
      doc.save();
      doc.dash(3, { space: 3 });
      doc.rect(x, y, etiquetaWidth, etiquetaHeight).stroke();
      doc.undash();
      doc.restore();
      
      // Contenido de la etiqueta
      let currentY = y + 8;
      
      // Encabezado
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`ORDEN: ${proyecto.numero}`, x + 10, currentY);
      currentY += 14;
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text(`PIEZA ${pieza.numero} de ${piezas.length}`, x + 10, currentY);
      doc.fillColor('#000');
      currentY += 12;
      
      // Información de la pieza
      doc.fontSize(7).font('Helvetica');
      doc.text(`Ubicación: ${pieza.ubicacion}`, x + 10, currentY);
      currentY += 10;
      doc.text(`Producto: ${pieza.producto || 'N/A'} ${pieza.color || ''}`, x + 10, currentY);
      currentY += 10;
      doc.text(`Dimensiones: ${pieza.ancho}m × ${pieza.alto}m`, x + 10, currentY);
      currentY += 10;
      doc.text(`Tipo: ${pieza.motorizado ? 'Motorizado' : 'Manual'}${pieza.galeria ? ' + Galería' : ''}`, x + 10, currentY);
      currentY += 10;
      
      // Notas especiales - Detectar rotación automáticamente
      const anchoMaximoTela = 3.0; // Ancho máximo de tela disponible
      const debeRotarse = pieza.ancho > anchoMaximoTela && pieza.alto <= anchoMaximoTela;
      const estaRotada = pieza.rotada || debeRotarse;
      
      if (estaRotada) {
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#CC0000');
        doc.text('⚠ TELA ROTADA', x + 10, currentY);
        doc.fillColor('#000');
        currentY += 10;
      }
      
      // QR Code placeholder (esquina superior derecha)
      const qrSize = 60;
      const qrX = x + etiquetaWidth - qrSize - 10;
      const qrY = y + 10;
      doc.rect(qrX, qrY, qrSize, qrSize).stroke();
      doc.fontSize(6).fillColor('#999');
      doc.text('QR', qrX + 20, qrY + 25, { width: 20, align: 'center' });
      doc.text(`#${pieza.numero}`, qrX + 10, qrY + 35, { width: 40, align: 'center' });
      doc.fillColor('#000');
      
      // Líneas para firmas (parte inferior)
      currentY = y + etiquetaHeight - 20;
      doc.fontSize(6).font('Helvetica');
      doc.text('Fabricado: _________', x + 10, currentY);
      doc.text('Fecha: _______', x + 150, currentY);
    });
  }
  
  /**
   * PÁGINA 1: Orden de Fabricación
   */
  static generarPaginaOrden(doc, datos) {
    const { proyecto, cliente, piezas, cronograma } = datos;
    
    // Header
    doc.fontSize(20).font('Helvetica-Bold')
       .text('ORDEN DE FABRICACIÓN - TALLER', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
       .text(`Orden: ${proyecto.numero}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // Información del Proyecto
    this.dibujarSeccion(doc, 'INFORMACIÓN DEL PROYECTO');
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 50, doc.y);
    doc.text(`Estado: ${proyecto.estado}`, 300, doc.y - 12);
    doc.moveDown(0.5);
    doc.text(`Prioridad: ${proyecto.prioridad || 'Normal'}`, 50, doc.y);
    
    doc.moveDown(1);
    
    // Información del Cliente
    this.dibujarSeccion(doc, 'CLIENTE');
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(cliente.nombre, 50, doc.y);
    doc.font('Helvetica');
    doc.moveDown(0.3);
    doc.text(`Tel: ${cliente.telefono}`);
    doc.text(`Dirección: ${cliente.direccion}`);
    
    doc.moveDown(1);
    
    // Cronograma
    if (cronograma?.fechaInicioFabricacion) {
      this.dibujarSeccion(doc, 'CRONOGRAMA');
      
      doc.fontSize(10).font('Helvetica');
      doc.text(`Inicio: ${new Date(cronograma.fechaInicioFabricacion).toLocaleDateString('es-MX')}`);
      if (cronograma.fechaFinEstimada) {
        doc.text(`Entrega estimada: ${new Date(cronograma.fechaFinEstimada).toLocaleDateString('es-MX')}`);
      }
      if (cronograma.diasEstimados) {
        doc.text(`Días estimados: ${cronograma.diasEstimados}`);
      }
      
      doc.moveDown(1);
    }
    
    // Resumen de Piezas con Especificaciones
    this.dibujarSeccion(doc, `PIEZAS A FABRICAR - ${piezas.length} TOTAL`);
    
    // Piezas con detalles técnicos
    doc.font('Helvetica').fontSize(7);
    piezas.forEach((pieza, index) => {
      if (doc.y > 680) {
        doc.addPage();
        doc.y = 50;
      }
      
      const y = doc.y;
      
      // Línea 1: Número, ubicación y sistema
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`${pieza.numero}. ${pieza.ubicacion}`, 50, y);
      doc.fontSize(8).font('Helvetica');
      doc.text(`${pieza.sistema}`, 300, y);
      
      doc.moveDown(0.3);
      
      // Línea 2: Medidas y especificaciones técnicas
      doc.fontSize(7).font('Helvetica');
      const specs = [
        `${pieza.ancho}×${pieza.alto}m`,
        pieza.motorizado ? 'Motorizado' : 'Manual',
        pieza.control ? `Control: ${pieza.control}` : null,
        pieza.caida ? `Caída: ${pieza.caida}` : null,
        pieza.tipoInstalacion ? `Inst: ${pieza.tipoInstalacion}` : null,
        pieza.tipoFijacion ? `Fij: ${pieza.tipoFijacion}` : null,
        pieza.color ? `Color: ${pieza.color}` : null,
        pieza.galeriaCompartida ? `[GAL-${pieza.grupoGaleria || 'A'}]` : null,
        pieza.sistemaSkyline ? '[SKYLINE]' : null,
        pieza.motorCompartido ? `[MOTOR-${pieza.grupoMotor || 'M1'}]` : null
      ].filter(Boolean).join(' | ');
      
      doc.text(specs, 60, doc.y);
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);
    });
    
    // Footer
    doc.fontSize(8).font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
  }
  
  /**
   * PÁGINA 2: Lista de Pedido para Proveedor
   */
  static generarPaginaListaPedido(doc, datos, listaPedido) {
    doc.fontSize(16).font('Helvetica-Bold')
       .text('LISTA DE PEDIDO PARA PROVEEDOR', { align: 'center' });
    
    doc.moveDown(0.8);
    
    // DATOS DEL PEDIDO
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('DATOS DEL PEDIDO', 50, doc.y);
    doc.moveDown(0.3);
    
    doc.fontSize(8).font('Helvetica');
    const datosY = doc.y;
    
    // Columna izquierda
    doc.text(`Proyecto: ${datos.proyecto.numero}`, 60, datosY);
    doc.text(`Cliente: ${datos.cliente.nombre}`, 60, datosY + 12);
    doc.text(`Número Pedido Interno: ${datos.proyecto.numero}`, 60, datosY + 24);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, 60, datosY + 36);
    
    // Columna derecha
    doc.text('Fecha requerida: _______________', 320, datosY);
    doc.text('Lugar de entrega: _______________', 320, datosY + 12);
    doc.text('Persona que recibirá: _______________', 320, datosY + 24);
    doc.text('Teléfono: _______________', 320, datosY + 36);
    
    doc.moveDown(4);
    
    // TUBOS
    if (listaPedido.tubos && listaPedido.tubos.length > 0) {
      this.dibujarSeccion(doc, 'TUBOS');
      
      listaPedido.tubos.forEach(tubo => {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`${tubo.codigo} - ${tubo.descripcion}`, 50, doc.y);
        
        doc.fontSize(8).font('Helvetica');
        doc.text(`   >> PEDIR: ${tubo.barrasNecesarias} barras x ${tubo.longitudBarra}m | Total: ${tubo.metrosLineales}ml`, 60, doc.y);
        
        // Información de desperdicio y origen
        doc.fontSize(7).font('Helvetica').fillColor('#666');
        const desperdicio = (tubo.desperdicio || 0).toFixed(1);
        const origen = tubo.enAlmacen ? '✓ Disponible en almacén' : '⚠ PEDIR A PROVEEDOR';
        doc.text(`   Desperdicio: ${desperdicio}% | ${origen}`, 60, doc.y);
        doc.fillColor('#000');
        
        doc.moveDown(0.8);
      });
    }
    
    // TELAS - FORMATO SIMPLIFICADO
    if (listaPedido.telas && listaPedido.telas.length > 0) {
      this.dibujarSeccion(doc, 'TELAS');
      
      listaPedido.telas.forEach((tela, index) => {
        // Título de la tela con modelo y color
        doc.fontSize(9).font('Helvetica-Bold');
        const titulo = `${index + 1}. ${tela.modelo || ''} ${tela.color || ''} - ${tela.anchoRollo}m`.trim();
        doc.text(titulo, 50, doc.y);
        
        doc.moveDown(0.2);
        
        // Información de compra según tipo de pedido
        if (tela.tipoPedido === 'ninguno') {
          // No pedir nada
          doc.fontSize(8).font('Helvetica').fillColor('#006400');
          doc.text(`   ✓ Stock suficiente en almacén (${tela.stockAlmacen} ml)`, 60, doc.y);
          doc.fillColor('#000');
          
        } else if (tela.tipoPedido === 'metros') {
          // Compra por metros lineales
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FF6600');
          doc.text(`   >> PEDIR: ${tela.cantidadPedir} ml (compra por metro)`, 60, doc.y);
          doc.fillColor('#000');
          
          doc.fontSize(7).font('Helvetica').fillColor('#666');
          doc.text(`   Ancho: ${tela.anchoRollo}m | Requerimiento: ${tela.requerimientoTotal} ml`, 60, doc.y);
          doc.fillColor('#000');
          
        } else if (tela.tipoPedido === 'rollo') {
          // Compra rollo completo
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#FF6600');
          doc.text(`   >> PEDIR: 1 rollo de 30 ml`, 60, doc.y);
          doc.fillColor('#000');
          
          doc.fontSize(7).font('Helvetica').fillColor('#666');
          doc.text(`   Ancho: ${tela.anchoRollo}m | Sobrante estimado: ${tela.sobranteEstimado} ml`, 60, doc.y);
          doc.fillColor('#000');
        }
        
        doc.moveDown(0.8);
      });
    }
    
    // MECANISMOS (solo manuales)
    const mecanismosManuales = listaPedido.mecanismos?.filter(m => !m.esMotor && m.descripcion.toLowerCase().includes('mecanismo')) || [];
    if (mecanismosManuales.length > 0) {
      this.dibujarSeccion(doc, 'MECANISMOS MANUALES');
      
      mecanismosManuales.forEach(mec => {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`${mec.codigo || 'N/A'} - ${mec.descripcion}`, 50, doc.y);
        
        doc.fontSize(8).font('Helvetica');
        doc.text(`   >> PEDIR: ${mec.cantidad} ${mec.unidad}${mec.observaciones ? ' | ' + mec.observaciones : ''}`, 60, doc.y);
        
        doc.moveDown(0.5);
      });
    }
    
    // MOTORES Y CONTROLES (sección especial)
    const motores = listaPedido.mecanismos?.filter(m => m.esMotor || m.descripcion.toLowerCase().includes('motor')) || [];
    const piezasMotorizadas = datos.piezas.filter(p => p.motorizado).length;
    
    if (piezasMotorizadas > 0) {
      this.dibujarSeccion(doc, 'MOTORES Y CONTROLES');
      
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`MOTORES REQUERIDOS: ${piezasMotorizadas} piezas motorizadas`, 50, doc.y);
      doc.moveDown(0.5);
      
      if (motores.length > 0) {
        motores.forEach(motor => {
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text(`${motor.codigo || 'MOTOR'} - ${motor.descripcion}`, 60, doc.y);
          
          doc.fontSize(8).font('Helvetica');
          doc.text(`   >> PEDIR: ${motor.cantidad} ${motor.unidad}`, 70, doc.y);
          
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(8).font('Helvetica');
        doc.text('   >> PEDIR: _____ motores (especificar modelo)', 60, doc.y);
        doc.moveDown(0.5);
      }
      
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('CONTROLES:', 50, doc.y);
      doc.moveDown(0.3);
      
      doc.fontSize(8).font('Helvetica');
      doc.text('   Tipo de control: _________________________', 60, doc.y);
      doc.moveDown(0.4);
      doc.text('   Cantidad: _____', 60, doc.y);
      doc.moveDown(0.4);
      doc.text('   Observaciones: _________________________', 60, doc.y);
      doc.moveDown(0.8);
    }
    
    // CONTRAPESOS (Perfiles de 5.80m)
    if (listaPedido.contrapesos && listaPedido.contrapesos.length > 0) {
      this.dibujarSeccion(doc, 'CONTRAPESOS');
      
      listaPedido.contrapesos.forEach(contra => {
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text(`${contra.codigo || 'CONTRAPESO'} - ${contra.descripcion}`, 50, doc.y);
        
        doc.fontSize(8).font('Helvetica');
        doc.text(`   >> PEDIR: ${contra.barrasNecesarias} barras x ${contra.longitudBarra}m | Total: ${contra.metrosLineales}ml`, 60, doc.y);
        
        // Información de desperdicio y origen
        doc.fontSize(7).font('Helvetica').fillColor('#666');
        const desperdicio = (contra.desperdicio || 0);
        const origen = contra.enAlmacen ? '✓ Disponible en almacén' : '⚠ PEDIR A PROVEEDOR';
        doc.text(`   Desperdicio: ${desperdicio}% | ${origen}`, 60, doc.y);
        doc.fillColor('#000');
        
        doc.moveDown(0.8);
      });
    }
    
    // ACCESORIOS
    if (listaPedido.accesorios && listaPedido.accesorios.length > 0) {
      this.dibujarSeccion(doc, 'ACCESORIOS');
      
      doc.fontSize(8).font('Helvetica');
      listaPedido.accesorios.forEach(acc => {
        doc.text(`   - ${acc.descripcion}: ${acc.cantidad} ${acc.unidad}`, 60, doc.y);
        doc.moveDown(0.3);
      });
    }
    
    // TODOS LOS MATERIALES CONSOLIDADOS
    if (datos.materialesConsolidados && datos.materialesConsolidados.length > 0) {
      doc.moveDown(0.5);
      this.dibujarSeccion(doc, 'LISTA COMPLETA DE MATERIALES');
      
      doc.fontSize(8).font('Helvetica');
      datos.materialesConsolidados.forEach(material => {
        const cantidad = Number(material.cantidad).toFixed(2);
        doc.text(`   - ${material.descripcion}: ${cantidad} ${material.unidad}`, 60, doc.y);
        doc.moveDown(0.3);
      });
    }
    
    // RESUMEN FINAL
    doc.moveDown(1);
    doc.rect(50, doc.y, 500, 50).stroke();
    
    const boxY = doc.y + 8;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('RESUMEN DE PEDIDO', 60, boxY);
    
    doc.fontSize(9).font('Helvetica');
    doc.text(`Barras: ${listaPedido.resumen?.totalBarras || 0} | Rollos: ${listaPedido.resumen?.totalRollos || 0} | Items: ${listaPedido.resumen?.totalItems || 0}`, 60, boxY + 18);
    
    // Footer
    doc.fontSize(8).font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
  }
  
  /**
   * PÁGINA 3: Detalle de Fabricación por Pieza (COMPLETO)
   */
  static generarPaginaDetallePiezas(doc, datos) {
    doc.fontSize(14).font('Helvetica-Bold')
       .text('DETALLE DE FABRICACIÓN POR PIEZA', { align: 'center' });
    
    doc.moveDown(0.8);
    
    datos.piezas.forEach((pieza, index) => {
      if (doc.y > 620) {
        doc.addPage();
        doc.y = 50;
      }
      
      // Encabezado de pieza con número grande
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(`PIEZA #${pieza.numero}`, 50, doc.y);
      doc.fontSize(10).font('Helvetica');
      doc.text(`${pieza.ubicacion}`, 150, doc.y - 12);
      
      doc.moveDown(0.5);
      
      // Medidas destacadas
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`Medidas: ${pieza.ancho} × ${pieza.alto}m | Área: ${(pieza.ancho * pieza.alto).toFixed(2)}m²`, 60, doc.y);
      
      doc.moveDown(0.5);
      
      // ESPECIFICACIONES TÉCNICAS COMPLETAS (13 campos)
      doc.fontSize(8).font('Helvetica-Bold');
      doc.text('ESPECIFICACIONES TÉCNICAS:', 60, doc.y);
      doc.moveDown(0.3);
      
      doc.fontSize(7).font('Helvetica');
      const especificaciones = [
        `Sistema: ${pieza.sistema || 'N/A'}`,
        `Control: ${pieza.control || 'N/A'}`,
        `Caída: ${pieza.caida || 'N/A'}`,
        `Tipo: ${pieza.motorizado ? 'Motorizado' : 'Manual'}`,
        `Tela: ${pieza.telaMarca || 'N/A'}`,
        `Modelo: ${pieza.modeloCodigo || 'N/A'}`,
        `Color: ${pieza.color || 'N/A'}`,
        `Instalación: ${pieza.tipoInstalacion || 'N/A'}`,
        `Fijación: ${pieza.tipoFijacion || 'N/A'}`,
        `Galería: ${pieza.galeria || 'No'}`,
        `Base/Tabla: ${pieza.baseTabla || 'N/A'}`,
        `Modo Operación: ${pieza.modoOperacion || 'N/A'}`,
        `Traslape: ${pieza.traslape || 'N/A'}`
      ];
      
      // Agregar información de galería compartida si aplica
      if (pieza.galeriaCompartida) {
        especificaciones.push(`>> GALERIA COMPARTIDA - Grupo ${pieza.grupoGaleria || 'A'}`);
      }
      
      // Agregar información de sistema Skyline si aplica
      if (pieza.sistemaSkyline) {
        especificaciones.push(`>> SISTEMA SKYLINE`);
      }
      
      // Agregar información de motor compartido si aplica
      if (pieza.motorCompartido) {
        especificaciones.push(`>> MOTOR COMPARTIDO - Grupo ${pieza.grupoMotor || 'M1'} (${pieza.piezasPorMotor} piezas)`);
      }
      
      // Mostrar en 2 columnas
      for (let i = 0; i < especificaciones.length; i += 2) {
        doc.text(especificaciones[i], 70, doc.y);
        if (especificaciones[i + 1]) {
          doc.text(especificaciones[i + 1], 320, doc.y - 10);
        }
        doc.moveDown(0.4);
      }
      
      doc.moveDown(0.3);
      
      // MATERIALES (BOM) - Lista simplificada
      if (pieza.materiales && pieza.materiales.length > 0) {
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('MATERIALES NECESARIOS:', 60, doc.y);
        doc.moveDown(0.3);
        
        doc.fontSize(7).font('Helvetica');
        pieza.materiales.forEach(material => {
          const cantidad = Number(material.cantidad).toFixed(2);
          doc.text(`• ${material.descripcion}`, 70, doc.y);
          doc.text(`${cantidad} ${material.unidad}`, 450, doc.y - 10, { align: 'right' });
          doc.moveDown(0.3);
        });
      }
      
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });
    
    // CHECKLIST DE EMPAQUE (nueva página)
    doc.addPage();
    doc.fontSize(14).font('Helvetica-Bold')
       .text('CHECKLIST DE EMPAQUE Y CONTROL DE CALIDAD', { align: 'center' });
    
    doc.moveDown(1);
    
    const checklist = [
      'Todas las piezas están correctamente etiquetadas',
      'Medidas verificadas y dentro de tolerancia',
      'Mecanismos probados y funcionando correctamente',
      'Acabados y color según especificación',
      'Embalaje protector aplicado',
      'Accesorios completos incluidos',
      'Documentación de instalación incluida',
      'Control de calidad aprobado'
    ];
    
    doc.fontSize(9).font('Helvetica');
    checklist.forEach(item => {
      doc.rect(60, doc.y, 12, 12).stroke();
      doc.text(item, 80, doc.y + 2);
      doc.moveDown(0.8);
    });
    
    doc.moveDown(2);
    
    // ELABORADO POR
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Elaborado por:', 60, doc.y);
    doc.moveDown(0.5);
    
    doc.fontSize(9).font('Helvetica');
    const firmaY = doc.y;
    doc.moveTo(150, firmaY).lineTo(400, firmaY).stroke();
    doc.fontSize(7).fillColor('#666');
    doc.text('Nombre completo', 150, firmaY + 5, { width: 250, align: 'center' });
    doc.fillColor('#000');
    
    // Footer
    doc.fontSize(8).font('Helvetica')
       .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
  }
  
  /**
   * Generar PDF de LISTA DE PEDIDO para proveedor (solo materiales, sin especificaciones técnicas)
   * @param {object} datosOrden - Datos de la orden
   * @param {object} listaPedido - Lista de pedido para proveedor
   * @returns {Promise<Buffer>} Buffer del PDF
   */
  static async generarPDFListaPedido(datosOrden, listaPedido) {
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
        
        // PÁGINA 1: Lista de Pedido
        this.generarPaginaListaPedido(doc, datosOrden, listaPedido);
        
        // PÁGINA 2: Detalle de Materiales por Pieza (para verificar cálculos)
        doc.addPage();
        
        doc.fontSize(14).font('Helvetica-Bold')
           .text('DETALLE DE MATERIALES POR PIEZA', { align: 'center' });
        
        doc.moveDown(0.3);
        doc.fontSize(7).font('Helvetica')
           .text('(Verificar cálculos y rotación de tela)', { align: 'center' });
        
        doc.moveDown(1);
        
        // Detalle por cada pieza
        datosOrden.piezas.forEach((pieza, index) => {
          if (doc.y > 650) {
            doc.addPage();
            doc.y = 50;
          }
          
          // Encabezado de pieza
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text(`${pieza.numero}. ${pieza.ubicacion}`, 50, doc.y);
          doc.fontSize(8).font('Helvetica');
          const rotadaIndicador = pieza.rotada ? ' | ↻ ROTADA' : '';
          doc.text(`${pieza.ancho}×${pieza.alto}m | ${pieza.producto || 'N/A'} | ${pieza.motorizado ? 'Motorizado' : 'Manual'}${rotadaIndicador}`, 250, doc.y - 9);
          
          doc.moveDown(0.4);
          
          // Materiales de esta pieza
          if (pieza.materiales && pieza.materiales.length > 0) {
            doc.fontSize(7).font('Helvetica');
            
            pieza.materiales.forEach(material => {
              const cantidad = Number(material.cantidad).toFixed(2);
              const descripcion = material.descripcion || material.tipo;
              
              doc.text(`   • ${material.tipo}: ${descripcion}`, 60, doc.y);
              doc.text(`${cantidad} ${material.unidad}`, 450, doc.y - 10, { align: 'right' });
              
              // Mostrar observaciones si hay (ej: rotada, galería, etc.)
              if (material.observaciones) {
                doc.fontSize(6).fillColor('#666');
                doc.text(`     ${material.observaciones}`, 65, doc.y);
                doc.fillColor('#000');
                doc.fontSize(7);
              }
              
              doc.moveDown(0.3);
            });
          } else {
            doc.fontSize(7).font('Helvetica').fillColor('#999');
            doc.text('   (Sin materiales calculados)', 60, doc.y);
            doc.fillColor('#000');
            doc.moveDown(0.3);
          }
          
          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.4);
        });
        
        doc.moveDown(0.5);
        doc.fontSize(6).font('Helvetica')
           .text('✔ Verificar que las telas rotadas usen el ancho correcto | Verificar galerías y accesorios especiales', 50, doc.y);
        
        // PÁGINA 3: Materiales Consolidados
        doc.addPage();
        
        doc.fontSize(14).font('Helvetica-Bold')
           .text('MATERIALES CONSOLIDADOS', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica')
           .text(`Total de piezas: ${datosOrden.totalPiezas}`, { align: 'center' });
        
        doc.moveDown(1);
        
        if (datosOrden.materialesConsolidados && datosOrden.materialesConsolidados.length > 0) {
          doc.fontSize(8).font('Helvetica');
          
          datosOrden.materialesConsolidados.forEach(material => {
            const cantidad = Number(material.cantidad).toFixed(2);
            doc.text(`- ${material.descripcion}`, 60, doc.y);
            doc.text(`${cantidad} ${material.unidad}`, 450, doc.y - 10, { align: 'right' });
            doc.moveDown(0.4);
          });
        }
        
        // SECCIÓN DE OBSERVACIONES PARA GARANTÍAS
        doc.moveDown(2);
        
        doc.fontSize(10).font('Helvetica-Bold')
           .text('OBSERVACIONES PARA GARANTÍAS', 50, doc.y);
        
        doc.moveDown(0.5);
        
        // Cuadros para llenar información
        const observacionesY = doc.y;
        
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Proveedor de Telas:', 60, observacionesY);
        doc.font('Helvetica');
        doc.moveTo(180, observacionesY + 12).lineTo(550, observacionesY + 12).stroke();
        
        doc.font('Helvetica-Bold');
        doc.text('Factura/Remisión:', 60, observacionesY + 25);
        doc.font('Helvetica');
        doc.moveTo(180, observacionesY + 37).lineTo(550, observacionesY + 37).stroke();
        
        doc.moveDown(3);
        
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Proveedor de Motores:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(180, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        
        doc.moveDown(1.2);
        
        doc.font('Helvetica-Bold');
        doc.text('Factura/Remisión:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(180, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        
        doc.moveDown(3);
        
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Proveedor de Accesorios:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(180, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        
        doc.moveDown(1.2);
        
        doc.font('Helvetica-Bold');
        doc.text('Factura/Remisión:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(180, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        
        doc.moveDown(3);
        
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('Notas Adicionales:', 60, doc.y);
        doc.font('Helvetica');
        doc.rect(60, doc.y + 5, 490, 40).stroke();
        
        // CHECKLIST DE RECEPCIÓN
        doc.addPage();
        
        doc.fontSize(12).font('Helvetica-Bold')
           .text('CHECKLIST DE RECEPCIÓN DE MATERIAL', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica')
           .text('Verificar al momento de recibir el material', { align: 'center' });
        
        doc.moveDown(1.5);
        
        const checklistRecepcion = [
          'Telas completas (rollos / ML exactos)',
          'Tubos completos (barras sin daño)',
          'Motores completos y funcionando',
          'Mecanismos completos (clutch + soportes)',
          'Accesorios completos',
          'Colores correctos',
          'Colecciones correctas',
          'Sin daños de transporte',
          'Factura / Remisión incluida'
        ];
        
        doc.fontSize(9).font('Helvetica');
        checklistRecepcion.forEach(item => {
          doc.rect(60, doc.y, 14, 14).stroke();
          doc.text(item, 85, doc.y + 3);
          doc.moveDown(0.9);
        });
        
        doc.moveDown(2);
        
        // Campos para llenar
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('Nombre de quien recibe:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(220, doc.y + 12).lineTo(550, doc.y + 12).stroke();
        
        doc.moveDown(1.5);
        
        doc.font('Helvetica-Bold');
        doc.text('Fecha y hora:', 60, doc.y);
        doc.font('Helvetica');
        doc.moveTo(150, doc.y + 12).lineTo(350, doc.y + 12).stroke();
        
        doc.moveDown(1.5);
        
        doc.font('Helvetica-Bold');
        doc.text('Condiciones al recibir:', 60, doc.y);
        doc.font('Helvetica');
        doc.rect(60, doc.y + 10, 490, 80).stroke();
        
        // Footer
        doc.fontSize(7).font('Helvetica')
           .text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
        
        doc.end();
        
        logger.info('PDF de lista de pedido generado', {
          servicio: 'pdfOrdenProduccionService',
          proyecto: datosOrden.proyecto?.numero,
          tipo: 'lista-pedido'
        });
        
      } catch (error) {
        logger.error('Error generando PDF de lista de pedido', {
          servicio: 'pdfOrdenProduccionService',
          error: error.message
        });
        reject(error);
      }
    });
  }

  /**
   * Dibujar etiqueta de producción con QR code
   */
  static dibujarEtiquetaProduccion(doc, pieza, proyecto) {
    // Verificar si hay espacio suficiente, si no, nueva página
    if (doc.y > 550) {
      doc.addPage();
      doc.y = 50;
    }

    // Título de la etiqueta
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('📋 ETIQUETA DE PRODUCCIÓN', 60, doc.y);
    doc.fillColor('#000');
    doc.moveDown(0.3);

    // Dibujar borde de la etiqueta
    const boxX = 60;
    const boxY = doc.y;
    const boxWidth = 480;
    const boxHeight = 100;

    doc.rect(boxX, boxY, boxWidth, boxHeight).stroke();

    // Contenido de la etiqueta (lado izquierdo)
    let currentY = boxY + 10;
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text(`ORDEN: ${proyecto.numero}`, boxX + 10, currentY);
    currentY += 14;

    doc.fontSize(7).font('Helvetica');
    doc.text(`PIEZA: ${pieza.numero} de ${proyecto.totalPiezas || 'N/A'}`, boxX + 10, currentY);
    currentY += 11;
    doc.text(`UBICACIÓN: ${pieza.ubicacion}`, boxX + 10, currentY);
    currentY += 11;
    doc.text(`PRODUCTO: ${pieza.producto || 'N/A'} ${pieza.color || ''}`, boxX + 10, currentY);
    currentY += 11;
    doc.text(`DIMENSIONES: ${pieza.ancho}m × ${pieza.alto}m`, boxX + 10, currentY);
    currentY += 11;
    doc.text(`TIPO: ${pieza.motorizado ? 'Motorizado' : 'Manual'}${pieza.galeria ? ' con galería' : ''}`, boxX + 10, currentY);

    // Placeholder para QR code (lado derecho)
    // Dibujar un cuadro para el QR
    doc.rect(boxX + boxWidth - 90, boxY + 10, 80, 80).stroke();
    doc.fontSize(6).fillColor('#999');
    doc.text('QR CODE', boxX + boxWidth - 65, boxY + 35, { width: 50, align: 'center' });
    doc.text(`${proyecto.numero}`, boxX + boxWidth - 65, boxY + 45, { width: 50, align: 'center' });
    doc.text(`Pieza ${pieza.numero}`, boxX + boxWidth - 65, boxY + 55, { width: 50, align: 'center' });
    doc.fillColor('#000');

    // Líneas para firmas (parte inferior de la etiqueta)
    currentY = boxY + boxHeight - 18;
    doc.fontSize(6).font('Helvetica');
    doc.text('FABRICADO: _______________', boxX + 10, currentY);
    doc.text('REVISADO: _______________', boxX + 180, currentY);
    doc.text('FECHA: __________', boxX + 350, currentY);

    doc.y = boxY + boxHeight + 5;
  }

  /**
   * Dibujar sección con título
   */
  static dibujarSeccion(doc, titulo) {
    doc.fontSize(11).font('Helvetica-Bold')
       .fillColor('#333333')
       .text(titulo, 50, doc.y);

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000000');
  }
}

module.exports = PDFOrdenProduccionService;
