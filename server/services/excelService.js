// Variable para carga lazy de ExcelJS
let ExcelJSLib;

class ExcelService {
  constructor() {
    this.workbook = null;
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
        { key: 'subtotal', width: 15 },
        { key: 'observaciones', width: 30 },
        { key: 'fotos', width: 10 },
        { key: 'video', width: 10 }
      ];

      // Título principal
      worksheet.mergeCells('A1:K1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = '🏠 SUNDECK - Levantamiento de Medidas';
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFD4AF37' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F172A' }
      };

      // Información del cliente
      worksheet.mergeCells('A3:K3');
      const infoCell = worksheet.getCell('A3');
      infoCell.value = `Cliente: ${prospecto.nombre || 'N/A'} | Teléfono: ${prospecto.telefono || 'N/A'} | Fecha: ${this.formatDate(new Date())}`;
      infoCell.font = { size: 12, bold: true };
      infoCell.alignment = { horizontal: 'center' };

      // Información de precios
      worksheet.mergeCells('A4:K4');
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
        'Subtotal',
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

      piezas.forEach((pieza, index) => {
        const row = worksheet.getRow(currentRow);
        const area = (pieza.ancho || 0) * (pieza.alto || 0);
        const precio = pieza.precioM2 || precioGeneral;
        const subtotal = area * precio;
        totalGeneral += subtotal;

        // Datos de la fila
        row.getCell(1).value = pieza.ubicacion || '';
        row.getCell(2).value = pieza.productoLabel || pieza.producto || '';
        row.getCell(3).value = pieza.ancho || 0;
        row.getCell(4).value = pieza.alto || 0;
        row.getCell(5).value = area.toFixed(2);
        row.getCell(6).value = pieza.color || '';
        row.getCell(7).value = this.formatCurrency(precio);
        row.getCell(8).value = this.formatCurrency(subtotal);
        row.getCell(9).value = pieza.observaciones || '';
        row.getCell(10).value = (pieza.fotoUrls && pieza.fotoUrls.length) ? pieza.fotoUrls.length : 0;
        row.getCell(11).value = pieza.videoUrl ? 'Sí' : 'No';

        // Formato de números
        row.getCell(3).numFmt = '0.00';
        row.getCell(4).numFmt = '0.00';
        row.getCell(5).numFmt = '0.00';

        // Bordes para todas las celdas
        for (let col = 1; col <= 11; col++) {
          const cell = row.getCell(col);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Alternar colores de fila
          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8F9FA' }
            };
          }
        }

        currentRow++;
      });

      // Fila de totales
      const totalRow = worksheet.getRow(currentRow + 1);
      totalRow.getCell(1).value = 'TOTALES';
      totalRow.getCell(1).font = { bold: true };
      totalRow.getCell(4).value = 'Piezas:';
      totalRow.getCell(4).font = { bold: true };
      totalRow.getCell(5).value = piezas.length;
      totalRow.getCell(5).font = { bold: true };
      totalRow.getCell(6).value = 'Total m²:';
      totalRow.getCell(6).font = { bold: true };
      totalRow.getCell(7).value = totalM2.toFixed(2);
      totalRow.getCell(7).font = { bold: true };
      totalRow.getCell(8).value = this.formatCurrency(totalGeneral);
      totalRow.getCell(8).font = { bold: true, color: { argb: 'FFD4AF37' } };

      // Bordes para la fila de totales
      for (let col = 1; col <= 11; col++) {
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
