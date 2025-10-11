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

  async generarLevantamientoExcel(prospecto, piezas, precioGeneral, totalM2, unidadMedida = 'm') {
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

      // Configurar anchos de columnas
      worksheet.columns = [
        { key: 'ubicacion', width: 15 },
        { key: 'producto', width: 25 },
        { key: 'ancho', width: 10 },
        { key: 'alto', width: 10 },
        { key: 'area', width: 12 },
        { key: 'color', width: 15 },
        { key: 'precioM2', width: 15 },
        { key: 'subtotalBase', width: 15 },
        { key: 'kitToldo', width: 20 },
        { key: 'precioKit', width: 12 },
        { key: 'motor', width: 20 },
        { key: 'precioMotor', width: 12 },
        { key: 'control', width: 15 },
        { key: 'precioControl', width: 12 },
        { key: 'subtotalTotal', width: 15 },
        { key: 'observaciones', width: 25 },
        { key: 'fotos', width: 8 },
        { key: 'video', width: 8 }
      ];

      // Título principal
      worksheet.mergeCells('A1:R1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '🏠 SUNDECK - Levantamiento de Medidas Completo';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFD4AF37' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };

      // Información del cliente
      worksheet.mergeCells('A3:R3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `Cliente: ${prospecto.nombre || 'N/A'} | Teléfono: ${prospecto.telefono || 'N/A'} | Fecha: ${this.formatDate(new Date())}`;
      infoCell.font = { size: 12, bold: true };
      infoCell.alignment = { horizontal: 'center' };

      // Información de precios
      worksheet.mergeCells('A4:R4');
      const precioCell = worksheet.getCell('A4');
      precioCell.value = `Precio General: ${this.formatCurrency(precioGeneral)}/m² | Unidad: ${unidadMedida} | Total: ${totalM2.toFixed(2)} m²`;
      precioCell.font = { size: 11 };
      precioCell.alignment = { horizontal: 'center' };

      // Encabezados de la tabla
      const headerRow = worksheet.getRow(6);
      const headers = [
        'Ubicación',
        'Producto',
        `Ancho (${unidadMedida})`,
        `Alto (${unidadMedida})`,
        'Área (m²)',
        'Color/Acabado',
        'Precio/m²',
        'Subtotal Base',
        'Kit de Toldo',
        'Precio Kit',
        'Motor',
        'Precio Motor',
        'Control',
        'Precio Control',
        'Subtotal Total',
        'Observaciones',
        'Fotos',
        'Video'
      ];

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
            const numMotores = pieza.numMotores || pieza.medidas.length;
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio && esPrimeraMedida) ? Number(pieza.motorPrecio) * numMotores : 0;
            const controlPrecio = esPrimeraMedida ? this.calcularPrecioControlReal(pieza, piezas) : 0;
            
            const subtotalTotal = subtotalBase + kitPrecio + motorPrecio + controlPrecio;
            
            totalGeneral += subtotalTotal;
            totalPiezasReales += 1;
            totalAreaReal += area;

            // Datos de la fila
            const ubicacionDisplay = pieza.medidas.length > 1 ? 
              `${pieza.ubicacion || ''} (${medidaIndex + 1}/${pieza.medidas.length})` : 
              (pieza.ubicacion || '');
            
            row.getCell(1).value = ubicacionDisplay;
            row.getCell(2).value = medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto || '';
            row.getCell(3).value = ancho;
            row.getCell(4).value = alto;
            row.getCell(5).value = area.toFixed(2);
            row.getCell(6).value = medida.color || pieza.color || '';
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
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) * numMotores : 0;
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
}

module.exports = new ExcelService();
