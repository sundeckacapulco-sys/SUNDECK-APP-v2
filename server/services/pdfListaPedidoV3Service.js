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
   * HOJA 1: Lista de Pedido Consolidada (SOLO TOTALES)
   */
  static generarHoja1MaterialConsolidado(doc, datos, despiece) {
    const lp = datos.listaPedido;
    
    // Encabezado
    doc.fontSize(18).font('Helvetica-Bold')
       .text('LISTA DE PEDIDO A PROVEEDOR', { align: 'center' });
    
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica')
       .text(`Proyecto: ${datos.proyecto.numero}`, { align: 'center' });
    doc.fontSize(10)
       .text(`Cliente: ${datos.cliente.nombre}`, { align: 'center' });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
    
    doc.moveDown(0.8);
    
    // Línea separadora
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.5);
    
    // ========== TELAS (Consolidadas por modelo+color+ancho) ==========
    if (lp?.telas?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('TELAS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      // Consolidar telas por modelo + color + anchoRollo (ignorar mayúsculas)
      const telasConsolidadas = {};
      lp.telas.forEach(t => {
        const modelo = (t.modelo || '').trim().toLowerCase();
        const color = (t.color || '').trim().toLowerCase();
        const anchoRollo = t.anchoRollo || 3.00;
        const key = `${modelo}|${color}|${anchoRollo}`;
        
        if (!telasConsolidadas[key]) {
          telasConsolidadas[key] = {
            modelo: (t.modelo || '').trim(),
            color: (t.color || '').trim(),
            anchoRollo,
            mlTotal: 0
          };
        }
        telasConsolidadas[key].mlTotal += parseFloat(t.requerimientoTotal || t.mlTotales || 0);
      });
      
      // Mostrar telas consolidadas con total
      Object.values(telasConsolidadas).forEach(t => {
        const nombre = `${t.modelo} ${t.color}`.trim() || 'Sin especificar';
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${nombre} (Rollo ${t.anchoRollo}m): ${t.mlTotal.toFixed(2)} ml`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== TUBOS ==========
    if (lp?.tubos?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('TUBOS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.tubos.forEach(t => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${t.descripcion}: ${t.barrasNecesarias} barras`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== CONTRAPESOS ==========
    if (lp?.contrapesos?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('CONTRAPESOS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.contrapesos.forEach(c => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${c.descripcion}: ${c.barrasNecesarias} barras`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== CADENAS ==========
    if (lp?.cadenas?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('CADENAS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.cadenas.forEach(c => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${c.descripcion}: ${c.metrosLineales} ml`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== MOTORES Y CONTROLES ==========
    // Contar piezas motorizadas
    const piezasMotorizadas = datos.piezas?.filter(p => p.motorizado)?.length || 0;
    
    if (piezasMotorizadas > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('MOTORES Y CONTROLES', 50, doc.y);
      doc.fillColor('#000').moveDown(0.3);
      
      // Motores requeridos
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`MOTORES REQUERIDOS: ${piezasMotorizadas} piezas motorizadas`, 60, doc.y);
      doc.moveDown(0.2);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('>> PEDIR: _____ motores (especificar modelo)', 70, doc.y);
      doc.moveDown(0.4);
      
      // Controles
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('CONTROLES:', 60, doc.y);
      doc.moveDown(0.2);
      
      doc.fontSize(10).font('Helvetica');
      doc.text('Tipo de control: _______________________________', 70, doc.y);
      doc.text('Cantidad: _____', 70, doc.y);
      doc.text('Observaciones: _______________________________', 70, doc.y);
      doc.moveDown(0.5);
    }
    
    // Mecanismos manuales (si hay)
    const mecanismosManuales = lp?.mecanismos?.filter(m => !m.descripcion?.toLowerCase().includes('motor')) || [];
    if (mecanismosManuales.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('MECANISMOS MANUALES', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      mecanismosManuales.forEach(m => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${m.descripcion}: ${m.cantidad} ${m.unidad}`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== SOPORTES Y TAPAS ==========
    if (lp?.soportes?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('SOPORTES Y TAPAS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.soportes.forEach(s => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${s.descripcion}: ${s.cantidad} ${s.unidad}`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== ACCESORIOS ==========
    if (lp?.accesorios?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('ACCESORIOS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.accesorios.forEach(a => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${a.descripcion}: ${a.cantidad} ${a.unidad}`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // ========== GALERÍAS ==========
    if (lp?.galerias?.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
      doc.text('GALERÍAS', 50, doc.y);
      doc.fillColor('#000').moveDown(0.2);
      
      lp.galerias.forEach(g => {
        doc.fontSize(10).font('Helvetica');
        doc.text(`• ${g.descripcion}: ${g.barrasNecesarias} barras`, 60, doc.y);
      });
      doc.moveDown(0.5);
    }
    
    // Línea separadora final
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
    doc.moveDown(0.3);
    
    // Resumen
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Total de piezas: ${datos.totalPiezas || lp?.resumen?.totalPiezas || 0}`, 50, doc.y);
    doc.text(`Total de items: ${lp?.resumen?.totalItems || 0}`, 50, doc.y);
  }
  
  /**
   * HOJA 2: Materiales Consolidados (Tabla)
   */
  static generarHoja2Despiece(doc, datos, despiece) {
    const lp = datos.listaPedido;
    
    doc.fontSize(16).font('Helvetica-Bold')
       .text('MATERIALES CONSOLIDADOS', { align: 'center' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Proyecto: ${datos.proyecto.numero}`, { align: 'center' });
    
    doc.moveDown(1);
    
    // ========== TABLA DE MATERIALES ==========
    const tableTop = doc.y;
    const col1 = 50;   // Material
    const col2 = 350;  // Cantidad
    const col3 = 450;  // Unidad
    const rowHeight = 20;
    
    // Encabezado de tabla
    doc.rect(col1, tableTop, 510, rowHeight).fill('#0066CC');
    doc.fillColor('#FFF').fontSize(10).font('Helvetica-Bold');
    doc.text('Material', col1 + 5, tableTop + 5);
    doc.text('Cantidad', col2 + 5, tableTop + 5);
    doc.text('Unidad', col3 + 5, tableTop + 5);
    doc.fillColor('#000');
    
    let currentY = tableTop + rowHeight;
    let rowIndex = 0;
    
    // Función para agregar fila
    const addRow = (material, cantidad, unidad) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      
      // Truncar descripción larga a 50 caracteres
      const materialTruncado = material.length > 50 ? material.substring(0, 47) + '...' : material;
      
      // Alternar color de fondo
      if (rowIndex % 2 === 0) {
        doc.rect(col1, currentY, 510, rowHeight).fill('#F5F5F5');
      }
      
      doc.fillColor('#000').fontSize(9).font('Helvetica');
      doc.text(materialTruncado, col1 + 5, currentY + 5, { width: 290, height: 15, ellipsis: true });
      doc.text(String(cantidad), col2 + 5, currentY + 5);
      doc.text(unidad, col3 + 5, currentY + 5);
      
      currentY += rowHeight;
      rowIndex++;
    };
    
    // Agregar telas consolidadas
    if (lp?.telas?.length > 0) {
      const telasConsolidadas = {};
      lp.telas.forEach(t => {
        const key = `${(t.modelo || '').toLowerCase()}|${(t.color || '').toLowerCase()}|${t.anchoRollo || 3.00}`;
        if (!telasConsolidadas[key]) {
          telasConsolidadas[key] = { modelo: t.modelo, color: t.color, anchoRollo: t.anchoRollo || 3.00, ml: 0 };
        }
        telasConsolidadas[key].ml += parseFloat(t.requerimientoTotal || t.mlTotales || 0);
      });
      Object.values(telasConsolidadas).forEach(t => {
        addRow(`Tela ${t.modelo} ${t.color} (Rollo ${t.anchoRollo}m)`.trim(), t.ml.toFixed(2), 'ml');
      });
    }
    
    // Agregar tubos
    lp?.tubos?.forEach(t => addRow(t.descripcion, t.barrasNecesarias, 'barras'));
    
    // Agregar contrapesos
    lp?.contrapesos?.forEach(c => addRow(c.descripcion, c.barrasNecesarias, 'barras'));
    
    // Agregar cadenas
    lp?.cadenas?.forEach(c => addRow(c.descripcion, c.metrosLineales, 'ml'));
    
    // Agregar mecanismos
    lp?.mecanismos?.forEach(m => addRow(m.descripcion, m.cantidad, m.unidad));
    
    // Agregar soportes
    lp?.soportes?.forEach(s => addRow(s.descripcion, s.cantidad, s.unidad));
    
    // Agregar accesorios
    lp?.accesorios?.forEach(a => addRow(a.descripcion, a.cantidad, a.unidad));
    
    // Agregar galerías
    lp?.galerias?.forEach(g => addRow(g.descripcion, g.barrasNecesarias, 'barras'));
    
    // Borde de tabla
    doc.rect(col1, tableTop, 510, currentY - tableTop).stroke();
    
    // ========== OBSERVACIONES PARA ALMACÉN ==========
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#0066CC');
    doc.text('OBSERVACIONES PARA ALMACÉN', col1, doc.y);
    doc.fillColor('#000').moveDown(0.5);
    
    // Campos para llenar
    const fieldY = doc.y;
    doc.fontSize(9).font('Helvetica');
    
    doc.text('Recibido por:', col1, fieldY);
    doc.moveTo(col1 + 70, fieldY + 12).lineTo(300, fieldY + 12).stroke();
    
    doc.text('Fecha recepción:', col1, fieldY + 25);
    doc.moveTo(col1 + 90, fieldY + 37).lineTo(300, fieldY + 37).stroke();
    
    doc.text('Verificado material:', col1, fieldY + 50);
    doc.moveTo(col1 + 100, fieldY + 62).lineTo(300, fieldY + 62).stroke();
    
    doc.text('Faltantes:', col1, fieldY + 75);
    doc.moveTo(col1 + 60, fieldY + 87).lineTo(560, fieldY + 87).stroke();
    
    doc.text('Observaciones:', col1, fieldY + 100);
    doc.moveTo(col1 + 80, fieldY + 112).lineTo(560, fieldY + 112).stroke();
  }
  
  /**
   * HOJA 3: Checklist de Recepción de Material
   */
  static generarHoja3AlmacenGarantias(doc, datos, despiece) {
    doc.fontSize(16).font('Helvetica-Bold')
       .text('CHECKLIST DE RECEPCIÓN DE MATERIAL', { align: 'center' });
    
    doc.fontSize(10).font('Helvetica')
       .text(`Proyecto: ${datos.proyecto.numero} | Cliente: ${datos.cliente.nombre}`, { align: 'center' });
    
    doc.moveDown(1.5);
    
    // ========== CHECKLIST ==========
    const checkItems = [
      'Verificar cantidad de rollos de tela',
      'Revisar color y modelo de cada tela',
      'Contar barras de tubo (medida correcta)',
      'Verificar contrapesos (planos/ovalados)',
      'Contar mecanismos/motores',
      'Verificar soportes y tapas',
      'Revisar accesorios (cadenas, fijaciones)',
      'Confirmar galerías si aplica',
      'Sin daños visibles en material',
      'Etiquetas legibles'
    ];
    
    const col1 = 50;
    let currentY = doc.y;
    
    doc.fontSize(10).font('Helvetica');
    checkItems.forEach(item => {
      doc.rect(col1, currentY, 14, 14).stroke();
      doc.text(item, col1 + 25, currentY + 2);
      currentY += 25;
    });
    
    // ========== FIRMAS ==========
    doc.moveDown(3);
    currentY = doc.y + 20;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('FIRMAS DE RECEPCIÓN', col1, currentY);
    currentY += 30;
    
    doc.fontSize(9).font('Helvetica');
    
    // Firma Almacén
    doc.text('Recibió (Almacén):', col1, currentY);
    doc.moveTo(col1 + 100, currentY + 30).lineTo(250, currentY + 30).stroke();
    doc.text('Nombre y firma', col1 + 120, currentY + 35);
    
    // Firma Proveedor
    doc.text('Entregó (Proveedor):', 320, currentY);
    doc.moveTo(420, currentY + 30).lineTo(560, currentY + 30).stroke();
    doc.text('Nombre y firma', 450, currentY + 35);
    
    currentY += 70;
    
    // Fecha
    doc.text('Fecha de recepción:', col1, currentY);
    doc.moveTo(col1 + 110, currentY + 12).lineTo(250, currentY + 12).stroke();
    
    doc.text('Hora:', 320, currentY);
    doc.moveTo(360, currentY + 12).lineTo(450, currentY + 12).stroke();
    
    // ========== NOTAS ==========
    doc.moveDown(4);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('NOTAS / FALTANTES:', col1, doc.y);
    doc.moveDown(0.5);
    
    // Líneas para notas
    for (let i = 0; i < 4; i++) {
      doc.moveTo(col1, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(1.2);
    }
    
    // Footer
    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').fillColor('#666');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, { align: 'center' });
    doc.fillColor('#000');
  }
}

module.exports = PDFListaPedidoV3Service;
