// Variable para carga lazy de ExcelJS
let ExcelJSLib;

class ExcelService {
  constructor() {
    this.workbook = null;
    // Definición de controles multicanal
    this.modelosControles = [
      { label: "Control Monocanal (1 cortina)", value: "monocanal", canales: 1, esMulticanal: false },
      { label: "Control 4 Canales", value: "multicanal_4", canales: 4, esMulticanal: true },
      { label: "Control 5 Canales", value: "multicanal_5", canales: 5, esMulticanal: true },
      { label: "Control 15 Canales", value: "multicanal_15", canales: 15, esMulticanal: true },
      { label: "Control Multicanal Genérico", value: "multicanal", canales: 4, esMulticanal: true },
      { label: "Otro (especificar)", value: "otro_manual", canales: 1, esMulticanal: false }
    ];
  }

  // Función para calcular precio de control considerando multicanal
  calcularPrecioControlReal(pieza, todasLasPiezas) {
    if (!pieza.motorizado || !pieza.controlPrecio) return 0;
    
    // Usar la nueva lógica simplificada
    if (pieza.esControlMulticanal) {
      // Control multicanal: solo cobrar una vez por partida
      return Number(pieza.controlPrecio) || 0;
    } else {
      // Control individual: cobrar por cada motor/pieza
      const numMotores = pieza.numMotores || (pieza.medidas ? pieza.medidas.length : (pieza.cantidad || 1));
      return (Number(pieza.controlPrecio) || 0) * numMotores;
    }
  }

  async initExcelJS() {
    try {
      // Carga lazy de ExcelJS con manejo de errores
      ExcelJSLib ??= require('exceljs');
      return ExcelJSLib;
    } catch (error) {
      throw new Error('ExcelJS no está disponible. Para generar archivos Excel, instala exceljs: npm install exceljs');
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async generarLevantamientoExcel(prospecto, piezas, precioGeneral, totalM2, unidadMedida = 'm', tipoVisita = 'levantamiento') {
    try {
      const ExcelJS = await this.initExcelJS();
      this.workbook = new ExcelJS.Workbook();
      
      // Metadatos del archivo
      this.workbook.creator = 'Sundeck CRM';
      this.workbook.lastModifiedBy = 'Sundeck CRM';
      this.workbook.created = new Date();
      this.workbook.modified = new Date();

      // Crear hoja de trabajo
      const worksheet = this.workbook.addWorksheet('Levantamiento de Medidas', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait',
          margins: {
            left: 0.7, right: 0.7,
            top: 0.75, bottom: 0.75,
            header: 0.3, footer: 0.3
          }
        }
      });

      // Configurar anchos de columnas según tipo de visita
      const columnasBasicas = [
        { key: 'ubicacion', width: 15 },
        { key: 'producto', width: 25 },
        { key: 'ancho', width: 10 },
        { key: 'alto', width: 10 },
        { key: 'area', width: 12 },
        { key: 'color', width: 15 }
      ];
      
      const columnasPrecio = [
        { key: 'precioM2', width: 15 },
        { key: 'subtotalBase', width: 15 },
        { key: 'kitToldo', width: 20 },
        { key: 'precioKit', width: 12 },
        { key: 'motor', width: 20 },
        { key: 'precioMotor', width: 12 },
        { key: 'control', width: 15 },
        { key: 'precioControl', width: 12 },
        { key: 'subtotalTotal', width: 15 }
      ];
      
      const columnasEspecificaciones = [
        { key: 'galeria', width: 15 },
        { key: 'concreto', width: 15 },
        { key: 'madera', width: 15 },
        { key: 'traslape', width: 12 }
      ];
      
      const columnasFinales = [
        { key: 'observaciones', width: 25 },
        { key: 'fotos', width: 8 },
        { key: 'video', width: 8 }
      ];
      
      // Configurar columnas según tipo de visita
      const todasLasColumnas = tipoVisita === 'cotizacion' 
        ? [...columnasBasicas, ...columnasPrecio, ...columnasFinales]
        : [...columnasBasicas, ...columnasEspecificaciones, ...columnasFinales];
        
      worksheet.columns = todasLasColumnas;

      // Título principal - ajustar merge según columnas
      const ultimaColumna = tipoVisita === 'cotizacion' ? 'R' : 'M'; // R para cotización, M para levantamiento con especificaciones
      worksheet.mergeCells(`A1:${ultimaColumna}1`);
      const titleCell = worksheet.getCell('A1');
      const tituloTexto = tipoVisita === 'cotizacion' 
        ? '🏠 SUNDECK - Cotización Completa'
        : '🏠 SUNDECK - Levantamiento Técnico';
      titleCell.value = tituloTexto;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFD4AF37' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };

      // Información del cliente
      worksheet.mergeCells(`A3:${ultimaColumna}3`);
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `Cliente: ${prospecto.nombre || 'N/A'} | Teléfono: ${prospecto.telefono || 'N/A'} | Fecha: ${this.formatDate(new Date())}`;
      infoCell.font = { size: 12, bold: true };
      infoCell.alignment = { horizontal: 'center' };

      // Información de precios - solo para cotización
      if (tipoVisita === 'cotizacion') {
        worksheet.mergeCells(`A4:${ultimaColumna}4`);
        const precioCell = worksheet.getCell('A4');
        precioCell.value = `Precio General: ${this.formatCurrency(precioGeneral)}/m² | Unidad: ${unidadMedida} | Total: ${totalM2.toFixed(2)} m²`;
        precioCell.font = { size: 11 };
      } else {
        // Para levantamiento técnico, mostrar solo información técnica
        worksheet.mergeCells(`A4:${ultimaColumna}4`);
        const infoTecnicaCell = worksheet.getCell('A4');
        infoTecnicaCell.value = `Levantamiento Técnico | Unidad: ${unidadMedida} | Total: ${totalM2.toFixed(2)} m²`;
        infoTecnicaCell.font = { size: 11 };
      }

      // Encabezados de la tabla - condicionales según tipo de visita
      const headerRow = worksheet.getRow(6);
      const headersBasicos = [
        'Ubicación',
        'Producto',
        `Ancho (${unidadMedida})`,
        `Alto (${unidadMedida})`,
        'Área (m²)',
        'Color/Acabado'
      ];
      
      const headersPrecio = [
        'Precio/m²',
        'Subtotal Base',
        'Kit de Toldo',
        'Precio Kit',
        'Motor',
        'Precio Motor',
        'Control',
        'Precio Control',
        'Subtotal Total'
      ];
      
      const headersEspecificaciones = [
        'Sistema',
        'Sistema Especial',
        'Galería',
        'Base Tabla'
      ];
      
      const headersFinales = [
        'Observaciones',
        'Fotos',
        'Video'
      ];
      
      const headers = tipoVisita === 'cotizacion'
        ? [...headersBasicos, ...headersPrecio, ...headersFinales]
        : [...headersBasicos, ...headersEspecificaciones, ...headersFinales];

      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1);
        cell.value = header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD4AF37' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Datos de las piezas
      let currentRow = 7;
      let totalGeneral = 0;
      let totalPiezasReales = 0;
      let totalAreaReal = 0;

      piezas.forEach((pieza, piezaIndex) => {
        // Detectar si la pieza tiene medidas individuales o formato anterior
        if (pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0) {
          // Formato nuevo: iterar cada medida individual
          pieza.medidas.forEach((medida, medidaIndex) => {
            const row = worksheet.getRow(currentRow);
            const ancho = Number(medida.ancho) || 0;
            const alto = Number(medida.alto) || 0;
            const area = ancho * alto;
            const precio = Number(medida.precioM2) || Number(pieza.precioM2) || precioGeneral;
            const subtotalBase = area * precio;
            
            // Información de toldos y motorización
            const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
            const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) : 0;
            // Motor: solo cobrar en la primera medida de cada partida
            const esPrimeraMedida = medidaIndex === 0;
            const numMotores = pieza.numMotores || 1;
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio && esPrimeraMedida)
              ? Number(pieza.motorPrecio) * numMotores
              : 0;
            const controlPrecio = esPrimeraMedida ? this.calcularPrecioControlReal(pieza, piezas) : 0;
            
            const subtotalTotal = subtotalBase + kitPrecio + motorPrecio + controlPrecio;
            
            totalGeneral += subtotalTotal;
            totalPiezasReales += 1;
            totalAreaReal += area;

            // Datos de la fila
            const ubicacionDisplay = pieza.medidas.length > 1 ? 
              `${pieza.ubicacion || ''} (${medidaIndex + 1}/${pieza.medidas.length})` : 
              (pieza.ubicacion || '');
            
            // Datos básicos (siempre)
            row.getCell(1).value = ubicacionDisplay;
            row.getCell(2).value = medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto || '';
            row.getCell(3).value = ancho;
            row.getCell(4).value = alto;
            row.getCell(5).value = area.toFixed(2);
            row.getCell(6).value = medida.color || pieza.color || '';
            
            let colIndex = 7;
            
            if (tipoVisita === 'cotizacion') {
              // Columnas de precio para cotización
              row.getCell(colIndex++).value = this.formatCurrency(precio);
              row.getCell(colIndex++).value = this.formatCurrency(subtotalBase);
              
              // Información de kit de toldo
              row.getCell(colIndex++).value = esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : '-';
              row.getCell(colIndex++).value = kitPrecio > 0 ? this.formatCurrency(kitPrecio) : '-';
              
              // Información de motorización
              row.getCell(colIndex++).value = pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : '-';
              row.getCell(colIndex++).value = motorPrecio > 0 ? this.formatCurrency(motorPrecio) : '-';
              row.getCell(colIndex++).value = pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : '-';
              row.getCell(colIndex++).value = controlPrecio > 0 ? this.formatCurrency(controlPrecio) : '-';
              
              // Subtotal total
              row.getCell(colIndex++).value = this.formatCurrency(subtotalTotal);
            } else {
              // Columnas de especificaciones técnicas para levantamiento
              const sistemas = medida.sistema ? (Array.isArray(medida.sistema) ? medida.sistema.join(', ') : medida.sistema) : '-';
              const sistemasEspeciales = medida.sistemaEspecial ? (Array.isArray(medida.sistemaEspecial) ? medida.sistemaEspecial.join(', ') : medida.sistemaEspecial) : '-';
              const galeria = medida.galeria || pieza.galeria || '-';
              const baseTabla = medida.baseTabla || pieza.baseTabla || '-';
              
              row.getCell(colIndex++).value = sistemas;
              row.getCell(colIndex++).value = sistemasEspeciales;
              row.getCell(colIndex++).value = galeria;
              row.getCell(colIndex++).value = baseTabla;
            }
            
            // Columnas finales (siempre)
            row.getCell(colIndex++).value = pieza.observaciones || '';
            row.getCell(colIndex++).value = (pieza.fotoUrls && pieza.fotoUrls.length) ? pieza.fotoUrls.length : 0;
            row.getCell(colIndex++).value = pieza.videoUrl ? 'Sí' : 'No';

            // Formato de números
            row.getCell(3).numFmt = '0.00';
            row.getCell(4).numFmt = '0.00';
            row.getCell(5).numFmt = '0.00';

            // Bordes para todas las celdas
            const totalColumnas = tipoVisita === 'cotizacion' ? 18 : 13; // Ajustar según tipo
            for (let col = 1; col <= totalColumnas; col++) {
              const cell = row.getCell(col);
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
              };
              
              // Alternar colores de fila
              if (currentRow % 2 === 0) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF8F9FA' }
                };
              }
            }

            currentRow++;
          });
        } else {
          // Formato anterior: usar campos planos
          const row = worksheet.getRow(currentRow);
          const ancho = Number(pieza.ancho) || 0;
          const alto = Number(pieza.alto) || 0;
          const cantidad = Number(pieza.cantidad) || 1;
          const area = ancho * alto * cantidad;
          const precio = Number(pieza.precioM2) || precioGeneral;
          const subtotalBase = area * precio;
          
          // Información de toldos y motorización
          const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
          const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) * cantidad : 0;
          const numMotores = pieza.numMotores || cantidad;
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio)
            ? Number(pieza.motorPrecio) * numMotores
            : 0;
          const controlPrecio = this.calcularPrecioControlReal(pieza, piezas);
          
          const subtotalTotal = subtotalBase + kitPrecio + motorPrecio + controlPrecio;
          
          totalGeneral += subtotalTotal;
          totalPiezasReales += cantidad;
          totalAreaReal += area;

          // Datos de la fila
          const ubicacionDisplay = cantidad > 1 ? 
            `${pieza.ubicacion || ''} (${cantidad} piezas)` : 
            (pieza.ubicacion || '');
            
          row.getCell(1).value = ubicacionDisplay;
          row.getCell(2).value = pieza.productoLabel || pieza.producto || '';
          row.getCell(3).value = ancho;
          row.getCell(4).value = alto;
          row.getCell(5).value = area.toFixed(2);
          row.getCell(6).value = pieza.color || '';
          row.getCell(7).value = this.formatCurrency(precio);
          row.getCell(8).value = this.formatCurrency(subtotalBase);
          
          // Información de kit de toldo
          row.getCell(9).value = esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : '-';
          row.getCell(10).value = kitPrecio > 0 ? this.formatCurrency(kitPrecio) : '-';
          
          // Información de motorización
          row.getCell(11).value = pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : '-';
          row.getCell(12).value = motorPrecio > 0 ? this.formatCurrency(motorPrecio) : '-';
          row.getCell(13).value = pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : '-';
          row.getCell(14).value = controlPrecio > 0 ? this.formatCurrency(controlPrecio) : '-';
          
          // Subtotal total
          row.getCell(15).value = this.formatCurrency(subtotalTotal);
          row.getCell(16).value = pieza.observaciones || '';
          row.getCell(17).value = (pieza.fotoUrls && pieza.fotoUrls.length) ? pieza.fotoUrls.length : 0;
          row.getCell(18).value = pieza.videoUrl ? 'Sí' : 'No';

          // Formato de números
          row.getCell(3).numFmt = '0.00';
          row.getCell(4).numFmt = '0.00';
          row.getCell(5).numFmt = '0.00';

          // Bordes para todas las celdas
          for (let col = 1; col <= 18; col++) {
            const cell = row.getCell(col);
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Alternar colores de fila
            if (piezaIndex % 2 === 1) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8F9FA' }
              };
            }
          }

          currentRow++;
        }
      });

      // Fila de totales
      const totalRow = worksheet.getRow(currentRow + 1);
      totalRow.getCell(1).value = 'TOTALES';
      totalRow.getCell(1).font = { bold: true };
      totalRow.getCell(4).value = 'Piezas:';
      totalRow.getCell(4).font = { bold: true };
      totalRow.getCell(5).value = totalPiezasReales;
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(6).value = 'Total m²:';
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = totalAreaReal.toFixed(2);
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(14).value = 'TOTAL FINAL:';
      totalRow.getCell(14).font = { bold: true };
      totalRow.getCell(15).value = this.formatCurrency(totalGeneral);
      totalRow.getCell(15).font = { bold: true, color: { argb: 'FFD4AF37' } };

      // Bordes para la fila de totales
      for (let col = 1; col <= 18; col++) {
        const cell = totalRow.getCell(col);
        cell.border = {
          top: { style: 'thick' },
          left: { style: 'thin' },
          bottom: { style: 'thick' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE4B5' }
        };
      }

      // Ajustar altura de filas
      worksheet.getRow(1).height = 25;
      worksheet.getRow(6).height = 20;

      // Generar buffer del archivo
      const buffer = await this.workbook.xlsx.writeBuffer();
      return buffer;

    } catch (error) {
      console.error('Error generando Excel:', error);
      throw new Error('Error generando archivo Excel');
    }
  }

  // Generar Excel de cotización
  async generarCotizacionExcel(cotizacion) {
    try {
      // Cargar ExcelJS si no está cargado
      if (!ExcelJSLib) {
        ExcelJSLib = require('exceljs');
      }

      const workbook = new ExcelJSLib.Workbook();
      const worksheet = workbook.addWorksheet('Cotización');

      // Configurar columnas
      worksheet.columns = [
        { header: 'Ubicación', key: 'ubicacion', width: 20 },
        { header: 'Producto', key: 'producto', width: 25 },
        { header: 'Medidas', key: 'medidas', width: 15 },
        { header: 'Área (m²)', key: 'area', width: 12 },
        { header: 'Precio/m²', key: 'precioM2', width: 12 },
        { header: 'Subtotal', key: 'subtotal', width: 12 },
        { header: 'Motor', key: 'motor', width: 15 },
        { header: 'Control', key: 'control', width: 15 },
        { header: 'Total', key: 'total', width: 12 }
      ];

      // Agregar información de la cotización
      worksheet.addRow(['COTIZACIÓN', cotizacion.numero]);
      worksheet.addRow(['Cliente', cotizacion.prospecto?.nombre || '']);
      worksheet.addRow(['Fecha', new Date(cotizacion.fecha).toLocaleDateString()]);
      worksheet.addRow([]);

      // Agregar productos
      let totalGeneral = 0;
      
      cotizacion.productos.forEach((producto, index) => {
        if (producto.medidas && Array.isArray(producto.medidas)) {
          producto.medidas.forEach((medida, medidaIndex) => {
            const area = medida.ancho * medida.alto;
            const subtotalM2 = area * (medida.precioM2 || 0);
            
            // Calcular precios de motor y control
            const precioMotor = producto.motorizado ? (producto.motorPrecio || 0) : 0;
            const precioControl = this.calcularPrecioControlReal(producto, cotizacion.productos);
            
            const totalPieza = subtotalM2 + precioMotor + (medidaIndex === 0 ? precioControl : 0);
            totalGeneral += totalPieza;

            worksheet.addRow({
              ubicacion: medidaIndex === 0 ? producto.ubicacion : '',
              producto: medida.productoLabel || medida.producto,
              medidas: `${medida.ancho} × ${medida.alto}`,
              area: area.toFixed(2),
              precioM2: `$${(medida.precioM2 || 0).toLocaleString()}`,
              subtotal: `$${subtotalM2.toLocaleString()}`,
              motor: precioMotor > 0 ? `$${precioMotor.toLocaleString()}` : '',
              control: medidaIndex === 0 && precioControl > 0 ? `$${precioControl.toLocaleString()}` : 
                      medidaIndex > 0 && precioControl > 0 ? 'Incluido' : '',
              total: `$${totalPieza.toLocaleString()}`
            });
          });
        }
      });

      // Agregar totales
      worksheet.addRow([]);
      worksheet.addRow(['', '', '', '', '', '', '', 'TOTAL:', `$${totalGeneral.toLocaleString()}`]);
      
      if (cotizacion.instalacion?.incluye) {
        worksheet.addRow(['', '', '', '', '', '', '', 'Instalación:', `$${(cotizacion.instalacion.costo || 0).toLocaleString()}`]);
      }
      
      if (cotizacion.descuento?.aplica) {
        worksheet.addRow(['', '', '', '', '', '', '', 'Descuento:', `-$${(cotizacion.descuento.valor || 0).toLocaleString()}`]);
      }
      
      if (cotizacion.facturacion?.requiere) {
        worksheet.addRow(['', '', '', '', '', '', '', 'IVA:', `$${(cotizacion.iva || 0).toLocaleString()}`]);
      }
      
      worksheet.addRow(['', '', '', '', '', '', '', 'TOTAL FINAL:', `$${(cotizacion.total || 0).toLocaleString()}`]);

      // Generar buffer
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;

    } catch (error) {
      console.error('Error generando Excel de cotización:', error);
      throw new Error('Error generando Excel de cotización: ' + error.message);
    }
  }
}

module.exports = new ExcelService();
