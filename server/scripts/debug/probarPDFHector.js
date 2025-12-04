const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const OrdenProduccionService = require('../../services/ordenProduccionService');
  const PDFOrdenFabricacionService = require('../../services/pdfOrdenFabricacionService');
  
  const proyectoId = '690e69251346d61cfcd5178d'; // Hector Huerta
  
  try {
    console.log('1. Obteniendo datos de orden...');
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    console.log('   Piezas:', datosOrden.piezas?.length);
    console.log('   Cliente:', datosOrden.cliente?.nombre);
    
    console.log('\n2. Generando PDF...');
    const pdfBuffer = await PDFOrdenFabricacionService.generarPDF(
      datosOrden,
      datosOrden.listaPedido
    );
    
    console.log('   Buffer type:', typeof pdfBuffer);
    console.log('   Buffer length:', pdfBuffer?.length);
    console.log('   Es Buffer:', Buffer.isBuffer(pdfBuffer));
    
    if (pdfBuffer && pdfBuffer.length > 0) {
      // Verificar que empiece con %PDF
      const header = pdfBuffer.slice(0, 10).toString();
      console.log('   Header:', header);
      
      // Guardar para verificar
      const outputPath = path.join(__dirname, 'test-orden-hector.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log('\n3. PDF guardado en:', outputPath);
    } else {
      console.log('   ERROR: Buffer vacío o nulo');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  mongoose.disconnect();
});
