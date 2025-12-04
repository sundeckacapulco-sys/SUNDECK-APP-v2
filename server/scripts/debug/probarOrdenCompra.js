const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const OrdenProduccionService = require('../../services/ordenProduccionService');
  const PDFOrdenCompraProveedorService = require('../../services/pdfOrdenCompraProveedorService');
  const Almacen = require('../../models/Almacen');
  
  const proyectoId = '690e69251346d61cfcd5178d'; // Hector Huerta
  
  try {
    // Verificar qué hay en almacén
    console.log('0. Verificando almacén...');
    const stockTelas = await Almacen.find({ tipo: 'Tela' }).lean();
    console.log('   Telas en almacén:', stockTelas.length);
    stockTelas.forEach(t => console.log('   -', t.descripcion, '| Cant:', t.cantidad, t.unidad));
    
    console.log('\n1. Obteniendo datos de orden...');
    const datosOrden = await OrdenProduccionService.obtenerDatosOrdenProduccion(proyectoId);
    console.log('   Piezas:', datosOrden.piezas?.length);
    console.log('   Cliente:', datosOrden.cliente?.nombre);
    console.log('   Tubos:', datosOrden.listaPedido?.tubos?.length || 0);
    console.log('   Telas:', datosOrden.listaPedido?.telas?.length || 0);
    console.log('\n   Detalle telas requeridas:');
    datosOrden.listaPedido?.telas?.forEach(t => {
      console.log('   -', t.modelo, t.color);
      console.log('     Requerimiento:', t.requerimientoTotal, 'ml');
      console.log('     Stock:', t.stockAlmacen, 'ml | Faltante:', t.faltante, 'ml');
      console.log('     Tipo pedido:', t.tipoPedido, '| Ancho:', t.anchoRollo, 'm');
    });
    
    console.log('\n2. Generando PDF Orden de Compra...');
    const pdfBuffer = await PDFOrdenCompraProveedorService.generarPDF(datosOrden);
    
    console.log('   Buffer length:', pdfBuffer?.length);
    
    if (pdfBuffer && pdfBuffer.length > 0) {
      const outputPath = path.join(__dirname, 'test-orden-compra-proveedor.pdf');
      fs.writeFileSync(outputPath, pdfBuffer);
      console.log('\n3. PDF guardado en:', outputPath);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  mongoose.disconnect();
});
