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
        
        // PÁGINA FINAL (OBLIGATORIA): CHECKLIST DE ENTREGA PARA INSTALACIÓN
        doc.addPage();
        this.generarPaginaChecklistInstalador(doc, datosCompletos);
        
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
    // Si ya viene pre-calculado (v2.0), usarlo y adaptarlo
    if (datosOrden.optimizacion) {
      const optimizacionTubos = datosOrden.optimizacion.resumenTubos?.resumenPorTipo 
        ? Object.values(datosOrden.optimizacion.resumenTubos.resumenPorTipo).map(t => ({
             titulo: `${t.tubo.descripcion} (${t.tubo.codigo})`,
             datos: t.optimizacion
          })) 
        : [];
        
      const resumenTelas = datosOrden.optimizacion.resumenTelas || {};
      
      // Calcular madera y escuadras aunque venga pre-calculado
      const piezasConGaleria = (datosOrden.piezas || [])
        .filter(p => p.galeria || p.conGaleria || p.llevaGaleria)
        .map(p => ({
          numero: p.numero,
          ubicacion: p.ubicacion,
          ancho: p.ancho
        }));
      
      let optimizacionMadera = null;
      let calculoEscuadras = null;
      if (piezasConGaleria.length > 0) {
        optimizacionMadera = OptimizadorCortesService.optimizarCortesMadera(piezasConGaleria, []);
        calculoEscuadras = OptimizadorCortesService.calcularEscuadrasMultiple(piezasConGaleria);
      }
      
      return { optimizacionTubos, resumenTelas, optimizacionMadera, calculoEscuadras };
    }

    const { piezas } = datosOrden;
    if (!piezas || piezas.length === 0) {
      return { optimizacionTubos: null, resumenTelas: [] };
    }

    try {
      // 1. Optimización de Tubos (Fallback Legacy)
      const gruposTubos = {};
      piezas.forEach(p => {
        // Buscar el material "Tubo" en el BOM de la pieza
        const tuboMaterial = p.materiales?.find(m => m.tipo === 'Tubo');
        
        if (tuboMaterial) {
          const codigo = tuboMaterial.codigo || 'T-GENERICO';
          const descripcion = tuboMaterial.descripcion || 'Tubo Genérico';
          
          if (!gruposTubos[codigo]) {
            gruposTubos[codigo] = {
              codigo,
              descripcion,
              cortes: []
            };
          }
          gruposTubos[codigo].cortes.push(p.ancho);
        }
      });

      const optimizacionTubos = [];
      for (const key in gruposTubos) {
        const grupo = gruposTubos[key];
        const resultado = await OptimizadorCortesService.optimizarCortesConSobrantes(
          grupo.cortes, 
          'Tubo', 
          grupo.codigo
        );
        
        optimizacionTubos.push({
          titulo: grupo.descripcion || grupo.codigo,
          datos: resultado
        });
      }

      // 2. Resumen de Telas (Fallback Legacy)
      const telasMap = new Map();
      piezas.forEach(p => {
        const key = `${p.telaMarca || 'Tela Genérica'}-${p.color || 'Sin Color'}`;
        const area = (p.ancho * p.alto);
        if (telasMap.has(key)) {
          telasMap.set(key, { descripcion: key, areaTotal: telasMap.get(key).areaTotal + area, piezas: telasMap.get(key).piezas + 1 });
        } else {
          telasMap.set(key, { descripcion: key, areaTotal: area, piezas: 1 });
        }
      });
      const resumenTelas = Array.from(telasMap.values());

      // 3. Optimización de Madera (Galerías)
      const piezasConGaleria = piezas
        .filter(p => p.galeria || p.conGaleria || p.llevaGaleria)
        .map(p => ({
          numero: p.numero,
          ubicacion: p.ubicacion,
          ancho: p.ancho
        }));
      
      let optimizacionMadera = null;
      if (piezasConGaleria.length > 0) {
        optimizacionMadera = OptimizadorCortesService.optimizarCortesMadera(piezasConGaleria, []);
      }

      return { optimizacionTubos, resumenTelas, optimizacionMadera };

    } catch (error) {
      logger.error('Error preparando datos de optimización para PDF', {
        servicio: 'pdfOrdenProduccionService',
        error: error.message,
        stack: error.stack
      });
      return { optimizacionTubos: null, resumenTelas: [], optimizacionMadera: null };
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

    if (optimizacionTubos && optimizacionTubos.length > 0) {
      
      optimizacionTubos.forEach(grupo => {
        // Verificar espacio para el grupo
        if (doc.y > 650) { doc.addPage(); doc.y = 50; }

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(`• ${grupo.titulo || 'Grupo de Tubos'}:`, 50, doc.y);
        doc.moveDown(0.3);
        
        const optimizacion = grupo.datos;
        
        if (optimizacion.barras && optimizacion.barras.length > 0) {
          doc.fontSize(8).font('Helvetica');
          optimizacion.barras.forEach(barra => {
            let origen = 'Barra Nueva';
            if (barra.tipo === 'sobrante') {
              origen = `Sobrante ID: ${barra.etiqueta || barra.sobranteId?.toString().slice(-6) || 'N/A'}`;
            }
            
            const cortesStr = barra.cortes.map(c => `${c}m`).join(' + ');
            const eficiencia = barra.eficiencia ? ` | Eficiencia: ${barra.eficiencia}%` : '';

            doc.text(`   - ${origen}: Cortar [${cortesStr}]. Sobrante: ${barra.sobrante.toFixed(2)}m${eficiencia}`, 60, doc.y, { width: 480 });
            doc.moveDown(0.2);
          });

          doc.moveDown(0.2);
          const resumen = optimizacion.resumen;
          doc.fontSize(7).font('Helvetica-Oblique').fillColor('#444');
          doc.text(`     Resumen: ${resumen.barrasNuevas} nuevas | ${resumen.sobrantesReutilizados} reutilizados | Efic: ${resumen.eficienciaGlobal}%`, 60, doc.y);
          doc.fillColor('#000');
          doc.moveDown(0.8);
        } else {
          doc.fontSize(8).font('Helvetica-Oblique').text('   No se requieren cortes para este material.', 60, doc.y);
          doc.moveDown(0.8);
        }
      });
    } else {
      doc.fontSize(8).font('Helvetica-Oblique').text('No hay tubos para optimizar.', 50, doc.y);
      doc.moveDown(1);
    }

    // OPTIMIZACIÓN DE TELAS (Grupos A, B, C...)
    if (resumenTelas) {
      const telasArray = Array.isArray(resumenTelas) ? resumenTelas : Object.values(resumenTelas);
      
      if (telasArray.length > 0) {
        if (doc.y > 600) { doc.addPage(); doc.y = 50; }
        
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('OPTIMIZACIÓN DE TELAS (GRUPOS DE CORTE)', 50, doc.y);
        doc.moveDown(0.5);
        
        telasArray.forEach(tela => {
          // Verificar si tiene optimización avanzada (Grupos)
          if (tela.optimizacion && tela.optimizacion.grupos) {
             if (doc.y > 650) { doc.addPage(); doc.y = 50; }
             
             const rolloInfo = tela.anchoRollo ? `(Rollo ${tela.anchoRollo}m)` : '';
             doc.fontSize(9).font('Helvetica-Bold').fillColor('#000').text(`• ${tela.descripcion || tela.codigo} ${rolloInfo}:`, 50, doc.y);
             doc.moveDown(0.3);
             
             // COLUMN LAYOUT LOGIC
             let startY = doc.y;
             let currentX = 60; // Left column X
             let currentColumn = 0; // 0 = Left, 1 = Right
             const rightColX = 320;
             const pageBottom = 700;
             let leftColBottom = startY;
             let rightColBottom = startY;

             tela.optimizacion.grupos.forEach(grupo => {
                // Estimate group height (Header + Items)
                const itemHeight = 10; // Approx
                const groupHeight = 20 + (grupo.piezas.length * itemHeight);

                // Check if fits in current column
                if (doc.y + groupHeight > pageBottom) {
                    if (currentColumn === 0) {
                        // Switch to Right Column
                        currentColumn = 1;
                        currentX = rightColX;
                        doc.y = startY;
                    } else {
                        // New Page (Reset to Left)
                        doc.addPage();
                        doc.y = 50;
                        startY = 50;
                        currentColumn = 0;
                        currentX = 60;
                        leftColBottom = 50;
                        rightColBottom = 50;
                    }
                }

                // Encabezado del Grupo (A, B...)
                const tituloGrupo = `GRUPO ${grupo.letra} – Corte único vertical: ${grupo.longitudCorte.toFixed(2)} ml`;
                doc.fontSize(8).font('Helvetica-Bold').fillColor('#333').text(tituloGrupo, currentX, doc.y);
                
                // Detalles del grupo con sobrante
                const sobranteInfo = grupo.sobranteAncho >= 0.30 
                  ? ` >> Sobrante: ${grupo.sobranteAncho.toFixed(2)}m (almacén)`
                  : '';
                doc.fontSize(7).font('Helvetica').fillColor('#555').text(`   Lienzos incluidos (Ancho acumulado: ${grupo.anchoAcumulado.toFixed(2)}m):${sobranteInfo}`, currentX, doc.y);
                
                grupo.piezas.forEach(p => {
                   const ubicacion = p.ubicacion ? `(${p.ubicacion})` : '';
                   
                   // CORRECCIÓN: Siempre mostrar dimensiones originales (Ancho x Alto) del levantamiento
                   // Si la pieza fue rotada, el optimizador puede haber intercambiado ancho/alto.
                   // Debemos buscar las originales o inferirlas.
                   let displayAncho = p.ancho;
                   let displayAlto = p.alto;

                   if (p.anchoOriginal && p.altoOriginal) {
                       displayAncho = p.anchoOriginal;
                       displayAlto = p.altoOriginal;
                   } 
                   
                   // CORRECCIÓN V4: Formato explícito para taller
                   // Mostrar cuánto CORTAR (Largo) y las medidas originales de referencia.
                   // Esto elimina la confusión de si Ancho es Alto o viceversa.
                   
                   const largoCorte = p.alto; // En el optimizador, 'alto' es la dimensión longitudinal (corte)
                   const anchoOcupado = p.ancho; // En el optimizador, 'ancho' es lo que ocupa en el rollo
                   
                   const medidasOriginales = `${(p.anchoOriginal || 0).toFixed(2)}m(A) x ${(p.altoOriginal || 0).toFixed(2)}m(H)`;
                   const infoRotacion = p.rotada ? ' [ROTADA ↻]' : '';
                   
                   // Formato: CORTAR: X.XXm | (Ref: Ancho x Alto)
                   doc.text(`   - CORTAR: ${largoCorte.toFixed(2)}m | Ref: ${medidasOriginales}${infoRotacion} ${ubicacion}`, currentX + 10, doc.y);
                });
                
                // Mostrar observaciones si hay diferencias de altura
                if (grupo.requiereRecorte && grupo.observaciones && grupo.observaciones.length > 0) {
                  doc.fontSize(7).font('Helvetica-Bold').fillColor('#CC6600');
                  grupo.observaciones.forEach(obs => {
                    doc.text(`      ⚠ ${obs.ubicacion}: ${obs.mensaje}`, currentX + 10, doc.y);
                  });
                  doc.fillColor('#000').font('Helvetica');
                }
                
                doc.moveDown(0.4);
                
                // Track bottom of columns
                if (currentColumn === 0) leftColBottom = doc.y;
                else rightColBottom = doc.y;
             });
             
             // Print Total in Right Column
             // ... (código existente de total) ...
             doc.y = rightColBottom > startY ? rightColBottom : (leftColBottom > startY ? leftColBottom : startY); 
             doc.y = rightColBottom + 10;
             doc.fontSize(8).font('Helvetica-Bold').fillColor('#000').text(`   Total Metros Lineales: ${tela.totalMetros} ml`, rightColX, doc.y);
             doc.moveDown(0.8);
             rightColBottom = doc.y;

             // Prepare Y for next fabric
             doc.y = Math.max(leftColBottom, rightColBottom) + 10;

          } else {
             // Fallback
             doc.fontSize(8).font('Helvetica').text(`• ${tela.descripcion || tela.codigo}: ${tela.areaTotal?.toFixed(2) || 0} m² (para ${tela.piezas} piezas)`, 60, doc.y);
             doc.moveDown(0.4);
          }
        });
      }
    }

    // 3. OPTIMIZACIÓN DE MADERA (GALERÍAS)
    const { optimizacionMadera } = datos;
    if (optimizacionMadera && optimizacionMadera.planCortes && optimizacionMadera.planCortes.length > 0) {
      if (doc.y > 550) { doc.addPage(); doc.y = 50; }
      
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('OPTIMIZACION DE MADERA (GALERIAS)', 50, doc.y);
      doc.moveDown(0.3);
      doc.fontSize(7).font('Helvetica').fillColor('#666').text(`Tabla estandar: ${optimizacionMadera.configuracion.longitudTabla}m | Sobrante minimo util: ${optimizacionMadera.configuracion.sobranteMinimoUtil}m`, 50, doc.y);
      doc.fillColor('#000');
      doc.moveDown(0.5);
      
      // Resumen rápido
      const resMadera = optimizacionMadera.resumen;
      doc.fontSize(8).font('Helvetica-Bold').text(`Resumen: ${resMadera.tablasNuevasRequeridas} tabla(s) nueva(s) | ${resMadera.piezasConUnion} union(es) | Sobrantes utiles: ${resMadera.totalSobrantesUtiles.toFixed(2)}m`, 60, doc.y);
      doc.moveDown(0.5);
      
      // Detalle por pieza
      doc.fontSize(8).font('Helvetica');
      optimizacionMadera.planCortes.forEach(corte => {
        if (doc.y > 700) { doc.addPage(); doc.y = 50; }
        
        const unionTag = corte.esUnion ? ' [UNION]' : '';
        const fuentesStr = corte.fuentes.map(f => {
          if (f.tipo === 'sobrante') return `Sobrante ${f.longitud.toFixed(2)}m`;
          return `Tabla nueva`;
        }).join(' + ');
        
        let sobranteInfo = '';
        if (corte.sobrante) {
          const longRedondeada = Math.round(corte.sobrante.longitud * 100) / 100;
          sobranteInfo = corte.sobrante.util 
            ? ` >> Sobrante util: ${longRedondeada.toFixed(2)}m`
            : ` >> Desperdicio: ${longRedondeada.toFixed(2)}m`;
        }
        
        doc.text(`   - Pieza #${corte.pieza} (${corte.ubicacion}): ${corte.anchoRequerido.toFixed(2)}m${unionTag} << ${fuentesStr}${sobranteInfo}`, 60, doc.y);
        doc.moveDown(0.3);
      });
      
      doc.moveDown(0.5);
    }

    // 4. RECOMENDACIONES DE OPTIMIZACIÓN
    const recomendaciones = datos.recomendaciones || [];
    if (recomendaciones.length > 0) {
       if (doc.y > 650) { doc.addPage(); doc.y = 50; }
       doc.moveDown(1);
       this.dibujarSeccion(doc, 'SUGERENCIAS INTELIGENTES');
       
       recomendaciones.forEach(rec => {
          const color = rec.tipo === 'OBLIGATORIO' ? '#CC0000' : '#FF6600';
          doc.fontSize(8).font('Helvetica-Bold').fillColor(color).text(`[${rec.tipo}]`, 60, doc.y, { continued: true });
          doc.font('Helvetica').fillColor('#000').text(` ${rec.mensaje}`);
          if (rec.sugerencia) {
             doc.fontSize(7).font('Helvetica-Oblique').fillColor('#555').text(`   💡 Sugerencia: ${rec.sugerencia}`, 70, doc.y);
          }
          doc.moveDown(0.5);
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
      const specs = [
        `${pieza.ancho}×${pieza.alto}m`, 
        pieza.motorizado ? 'Motorizado' : 'Manual', 
        pieza.control ? `Control: ${pieza.control}` : null, 
        pieza.tipoMando ? `Mando: ${pieza.tipoMando}` : null, 
        pieza.producto ? `Producto: ${pieza.producto}` : null, // Producto
        pieza.modelo ? `Modelo: ${pieza.modelo}` : (pieza.modeloCodigo ? `Modelo: ${pieza.modeloCodigo}` : null), // Modelo
        pieza.tipoContrapeso ? `CP: ${pieza.tipoContrapeso}` : null, 
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
    
    doc.moveDown(1);
    this.dibujarSeccionOptimizacionCortes(doc, datos);
    
    doc.fontSize(8).font('Helvetica').text(`Generado: ${new Date().toLocaleString('es-MX')}`, 50, 720, { align: 'center' });
  }

  // ... (el resto de los métodos se mantienen igual)
  
  static generarPaginaEtiquetas(doc, datos) {
    const { proyecto, piezas } = datos;
    doc.fontSize(16).font('Helvetica-Bold').text('ETIQUETAS DE PRODUCCIÓN', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`Orden: ${proyecto.numero} | Cortar por línea punteada`, { align: 'center' });
    doc.moveDown(1);
    
    // Formato horizontal: 250x80 puntos - 2 por fila
    const etiquetaWidth = 250;
    const etiquetaHeight = 80;
    const marginX = 50;
    let marginY = doc.y;
    const spacingX = 12;
    const spacingY = 10;
    const colIzqWidth = 55; // Ancho columna izquierda (número grande)
    
    piezas.forEach((pieza, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2) % 4; // 4 filas por página
      
      // Nueva página si es necesario
      if (index > 0 && index % 8 === 0) {
        doc.addPage();
        marginY = 80;
      }
      
      const x = marginX + (col * (etiquetaWidth + spacingX));
      const y = marginY + (row * (etiquetaHeight + spacingY));
      
      // Borde punteado para cortar
      doc.save()
        .dash(3, { space: 3 })
        .rect(x, y, etiquetaWidth, etiquetaHeight)
        .stroke()
        .undash()
        .restore();
      
      // Línea divisoria vertical entre columnas
      doc.save()
        .moveTo(x + colIzqWidth, y + 5)
        .lineTo(x + colIzqWidth, y + etiquetaHeight - 5)
        .stroke()
        .restore();
      
      // === COLUMNA IZQUIERDA: Número grande + ubicación ===
      const colIzqX = x + 5;
      
      // Número de partida MUY GRANDE
      doc.fontSize(28)
        .font('Helvetica-Bold')
        .text(String(pieza.numero), colIzqX, y + 8, { width: colIzqWidth - 10, align: 'center' });
      
      // "de X" pequeño
      doc.fontSize(8)
        .font('Helvetica')
        .text(`de ${piezas.length}`, colIzqX, y + 38, { width: colIzqWidth - 10, align: 'center' });
      
      // Ubicación abreviada
      const ubicacionAbrev = this.abreviarUbicacion(pieza.ubicacion || '');
      doc.fontSize(7)
        .font('Helvetica-Bold')
        .text(ubicacionAbrev, colIzqX, y + 50, { width: colIzqWidth - 10, align: 'center' });
      
      // === COLUMNA DERECHA: Medidas + detalles ===
      const colDerX = x + colIzqWidth + 8;
      const colDerWidth = etiquetaWidth - colIzqWidth - 15;
      let lineY = y + 6;
      
      // MEDIDAS EN NEGRITA GRANDE
      const medidas = `${pieza.ancho || 0} × ${pieza.alto || 0}m`;
      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(medidas, colDerX, lineY, { width: colDerWidth });
      lineY += 14;
      
      // Tela/Color
      const tela = pieza.telaMarca || pieza.tela || pieza.color || '';
      doc.fontSize(8)
        .font('Helvetica')
        .text(tela, colDerX, lineY, { width: colDerWidth });
      lineY += 10;
      
      // Cliente
      doc.fontSize(7)
        .text(proyecto.cliente?.nombre || '', colDerX, lineY, { width: colDerWidth });
      lineY += 9;
      
      // Control (motorizado con lado, o cadena con lado)
      let control = '';
      const lado = pieza.ladoCadena || pieza.ladoControl || pieza.ladoMotor || pieza.tipoControl || '';
      const ladoAbrev = lado.toLowerCase().includes('izq') ? 'IZQ' : 
                       lado.toLowerCase().includes('der') ? 'DER' : 
                       lado ? lado.toUpperCase() : '';
      
      if (pieza.motorizado) {
        // Motorizado siempre indica lado del motor para conexiones
        control = ladoAbrev ? `MOTOR ${ladoAbrev}` : 'MOTORIZADO';
      } else {
        // Cadena con lado
        control = ladoAbrev ? `CADENA ${ladoAbrev}` : '';
      }
      
      // Galería y Tabla
      const tieneGaleria = pieza.galeria || pieza.conGaleria || pieza.llevaGaleria;
      const tieneTabla = tieneGaleria || pieza.tabla || pieza.conTabla || pieza.llevaTabla;
      
      let extras = [];
      if (tieneGaleria) {
        extras.push('GALERIA');
        // Calcular escuadras para esta pieza
        const escuadras = OptimizadorCortesService.calcularEscuadras(pieza.ancho || 0);
        extras.push(`${escuadras.total} ESC`);
      }
      if (tieneTabla && !tieneGaleria) extras.push('TABLA');
      
      const instalacion = `${pieza.tipoInstalacion || ''} ${pieza.tipoFijacion || ''}`.trim();
      
      // Línea de control + instalación
      doc.fontSize(7)
        .text(`${control}  |  ${instalacion}`, colDerX, lineY, { width: colDerWidth });
      lineY += 9;
      
      // Línea de extras (galería/tabla) si hay
      if (extras.length > 0) {
        doc.fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#CC0000')
          .text(extras.join(' + '), colDerX, lineY, { width: colDerWidth })
          .fillColor('#000')
          .font('Helvetica');
        lineY += 9;
      }
      
      // Observaciones (si hay espacio y hay texto)
      const obs = pieza.observacionesTecnicas || pieza.observaciones || '';
      if (obs && lineY < y + etiquetaHeight - 10) {
        doc.fontSize(6)
          .fillColor('#666')
          .text(obs.substring(0, 40), colDerX, lineY, { width: colDerWidth })
          .fillColor('#000');
      }
      
      // Número de orden pequeño en esquina inferior derecha
      doc.fontSize(5)
        .fillColor('#999')
        .text(proyecto.numero, x + etiquetaWidth - 60, y + etiquetaHeight - 10, { width: 55, align: 'right' })
        .fillColor('#000');
    });
  }
  
  // Helper para abreviar ubicaciones
  static abreviarUbicacion(ubicacion) {
    if (!ubicacion) return '';
    
    const abreviaturas = {
      'recamara': 'REC', 'recámara': 'REC',
      'habitacion': 'HAB', 'habitación': 'HAB',
      'principal': 'PPAL', 'secundaria': 'SEC',
      'sala': 'SALA', 'comedor': 'COM',
      'cocina': 'COC', 'baño': 'BAÑO',
      'estudio': 'EST', 'oficina': 'OFIC',
      'terraza': 'TERR', 'balcon': 'BALC',
      'ventana': 'VENT', 'puerta': 'PTA',
      'izquierda': 'IZQ', 'derecha': 'DER'
    };
    
    let resultado = ubicacion.toUpperCase();
    Object.entries(abreviaturas).forEach(([palabra, abrev]) => {
      resultado = resultado.replace(new RegExp(palabra, 'gi'), abrev);
    });
    
    return resultado.length > 10 ? resultado.substring(0, 10) : resultado;
  }

  static generarPaginaDetallePiezas(doc, datos) {
    const { proyecto, piezas } = datos;
    
    doc.fontSize(14).font('Helvetica-Bold').text('DETALLE DE FABRICACIÓN POR PIEZA', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').text(`Orden: ${proyecto.numero}`, { align: 'center' });
    doc.moveDown(0.8);
    
    const marginLeft = 50;
    
    // === LISTADO DE PIEZAS (compacto) ===
    piezas.forEach((pieza, index) => {
      // Verificar si necesita nueva página
      if (doc.y > 620) { 
        doc.addPage(); 
        doc.y = 50;
      }
      
      const startY = doc.y;
      const col2X = 300;
      
      // Encabezado de pieza
      doc.rect(marginLeft, startY, 500, 18).fill('#f0f0f0');
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold')
        .text(`#${pieza.numero}`, marginLeft + 5, startY + 4);
      doc.fontSize(9).font('Helvetica')
        .text(`${pieza.ubicacion || ''}`, marginLeft + 35, startY + 5);
      doc.fontSize(10).font('Helvetica-Bold')
        .text(`${pieza.ancho} × ${pieza.alto}m`, col2X + 120, startY + 4);
      
      let y = startY + 22;
      
      // Especificaciones en una línea compacta
      const tieneGaleria = pieza.galeria || pieza.conGaleria || pieza.llevaGaleria;
      const producto = pieza.producto || pieza.sistema || 'Enrollable';
      const tela = `${pieza.tela || ''} ${pieza.color || ''}`.trim() || '-';
      
      // Lado de control (IZQ/DER)
      const lado = pieza.ladoCadena || pieza.ladoControl || pieza.ladoMotor || '';
      const ladoAbrev = lado.toLowerCase().includes('izq') ? 'IZQ' : 
                       lado.toLowerCase().includes('der') ? 'DER' : '';
      const control = pieza.motorizado ? `MOTOR ${ladoAbrev}`.trim() : `Manual ${ladoAbrev}`.trim();
      
      doc.fontSize(8).font('Helvetica');
      doc.text(`${producto}  |  Tela: ${tela}  |  Control: ${control}  |  Galería: ${tieneGaleria ? 'SÍ' : 'NO'}  |  Inst: ${pieza.tipoInstalacion || '-'}`, marginLeft, y);
      
      y += 12;
      doc.moveTo(marginLeft, y).lineTo(550, y).stroke();
      doc.y = y + 5;
    });
    
    // === ESPACIO ÚNICO PARA ANOTACIONES DEL ARMADOR (al final) ===
    doc.moveDown(1);
    
    // Si queda poco espacio, agregar nueva página
    if (doc.y > 500) {
      doc.addPage();
      doc.y = 50;
    }
    
    let y = doc.y;
    
    doc.fontSize(11).font('Helvetica-Bold').text('ANOTACIONES DEL ARMADOR', marginLeft, y);
    doc.fontSize(8).font('Helvetica').fillColor('#666').text('(Cálculos de corte, observaciones de fabricación)', marginLeft, y + 14);
    doc.fillColor('#000');
    y += 35;
    
    // Líneas para escribir (sin cuadro, espacio libre)
    doc.strokeColor('#ccc');
    for (let i = 0; i < 8; i++) {
      doc.moveTo(marginLeft, y + (i * 22)).lineTo(marginLeft + 500, y + (i * 22)).stroke();
    }
    doc.strokeColor('#000');
    
    doc.y = y + 180;
  }
  
  static dibujarSeccion(doc, titulo) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text(titulo, 50, doc.y);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fillColor('#000000');
  }
  
  /**
   * PÁGINA FINAL OBLIGATORIA: Checklist de Entrega para Instalación
   * Checklist superficial para confirmar que el instalador recibe todos los elementos
   * NO incluye materiales internos de fabricación (insertos, cinta doble cara, etc.)
   */
  static generarPaginaChecklistInstalador(doc, datos) {
    const { proyecto, piezas } = datos;
    
    // Título principal
    doc.fontSize(18).font('Helvetica-Bold').text('CHECKLIST DE ENTREGA PARA INSTALACIÓN', { align: 'center' });
    doc.moveDown(0.5);
    
    // Subtítulo con número de orden
    doc.fontSize(11).font('Helvetica').text(`Orden: ${proyecto.numero}`, { align: 'center' });
    doc.moveDown(1.5);
    
    // Calcular datos para el checklist
    const totalPersianas = piezas.length;
    const piezasConGaleria = piezas.filter(p => p.galeria || p.conGaleria || p.llevaGaleria);
    const tieneGalerias = piezasConGaleria.length > 0;
    const tieneMotores = piezas.some(p => p.motorizado);
    const cantidadMotores = piezas.filter(p => p.motorizado).length;
    const cantidadManuales = piezas.filter(p => !p.motorizado).length;
    
    // Calcular total de escuadras
    let totalEscuadras = 0;
    if (tieneGalerias) {
      piezasConGaleria.forEach(p => {
        const esc = OptimizadorCortesService.calcularEscuadras(p.ancho || 0);
        totalEscuadras += esc.total;
      });
    }
    
    // Configuración de checkbox
    const checkboxSize = 14;
    const marginLeft = 60;
    const textOffset = 25;
    let y = doc.y;
    
    // Función para dibujar checkbox
    const dibujarCheckbox = (yPos, texto, nota = '') => {
      // Cuadro del checkbox
      doc.rect(marginLeft, yPos, checkboxSize, checkboxSize).stroke();
      
      // Texto principal
      doc.fontSize(11).font('Helvetica').text(texto, marginLeft + textOffset, yPos + 2);
      
      // Nota adicional si existe
      if (nota) {
        doc.fontSize(9).fillColor('#666').text(nota, marginLeft + textOffset, yPos + 16).fillColor('#000');
        return 35; // Altura con nota
      }
      return 25; // Altura sin nota
    };
    
    // Lista de items del checklist
    const items = [
      { 
        texto: `Todas las persianas del proyecto incluidas`, 
        nota: `(Total: ${totalPersianas} persianas)` 
      },
      { 
        texto: `Galerías incluidas`, 
        nota: tieneGalerias ? `(Total: ${piezasConGaleria.length} galería(s))` : '(No aplica en este proyecto)' 
      },
      { 
        texto: `Escuadras para galerías`, 
        nota: tieneGalerias ? `(Total: ${totalEscuadras} escuadras)` : '(No aplica en este proyecto)' 
      },
      { 
        texto: `Soportes completos`, 
        nota: '(Cantidad correcta por persiana)' 
      },
      { 
        texto: `Mecanismos correctos`, 
        nota: `(${cantidadManuales > 0 ? cantidadManuales + ' manual(es)' : ''}${cantidadManuales > 0 && cantidadMotores > 0 ? ' / ' : ''}${cantidadMotores > 0 ? cantidadMotores + ' motorizado(s)' : ''})` 
      },
      { 
        texto: `Motores incluidos`, 
        nota: tieneMotores ? `(Total: ${cantidadMotores} motor(es))` : '(No aplica en este proyecto)' 
      },
      { 
        texto: `Controles incluidos`, 
        nota: tieneMotores ? '(Monocanal o multicanal según especificación)' : '(No aplica - proyecto manual)' 
      },
      { 
        texto: `Tapas laterales`, 
        nota: '(Persiana y/o galería según corresponda)' 
      },
      { 
        texto: `Tornillería y taquetes completos`, 
        nota: '' 
      },
      { 
        texto: `Etiquetas colocadas en cada persiana`, 
        nota: '' 
      },
      { 
        texto: `Empaque correcto y en buen estado`, 
        nota: '' 
      }
    ];
    
    // Dibujar cada item
    items.forEach(item => {
      const altura = dibujarCheckbox(y, item.texto, item.nota);
      y += altura;
    });
    
    // Espaciado antes de observaciones
    y += 30;
    
    // OBSERVACIONES DEL INSTALADOR
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVACIONES DEL INSTALADOR', marginLeft, y);
    y += 20;
    
    // Líneas para escribir (4 líneas)
    for (let i = 0; i < 4; i++) {
      doc.moveTo(marginLeft, y).lineTo(550, y).stroke();
      y += 25;
    }
    
    y += 20;
    
    // OBSERVACIONES DEL TALLER
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVACIONES DEL TALLER', marginLeft, y);
    y += 20;
    
    // Líneas para escribir (4 líneas)
    for (let i = 0; i < 4; i++) {
      doc.moveTo(marginLeft, y).lineTo(550, y).stroke();
      y += 25;
    }
    
    // Pie de página
    doc.fontSize(8).fillColor('#999').text(
      'Este checklist confirma la entrega de elementos visibles para instalación. No incluye materiales internos de fabricación.',
      marginLeft, 
      700,
      { width: 490, align: 'center' }
    ).fillColor('#000');
  }
}

module.exports = PDFOrdenProduccionService;
