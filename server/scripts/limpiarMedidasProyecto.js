const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');

async function limpiarMedidas() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
  const p = await Proyecto.findById('68f8f89aca4798f5414480fe');
  
  console.log('=== LIMPIANDO MEDIDAS ===');
  console.log('Medidas antes:', p.medidas?.length || 0);
  
  // Limpiar precios de todas las medidas
  if (p.medidas && Array.isArray(p.medidas)) {
    p.medidas.forEach(medida => {
      // Si tiene piezas (formato nuevo)
      if (medida.piezas && Array.isArray(medida.piezas)) {
        medida.piezas.forEach(pieza => {
          pieza.precioM2 = 0;
          pieza.precioTotal = 0;
          pieza.areaTotal = pieza.areaTotal || 0; // Mantener área
          
          if (pieza.totales) {
            pieza.totales.subtotal = 0;
            pieza.totales.costoMotorizacion = 0;
            pieza.totales.costoInstalacion = 0;
          }
        });
      }
      
      // Si es formato viejo
      if (medida.precioM2) medida.precioM2 = 0;
      if (medida.precioTotal) medida.precioTotal = 0;
    });
  }
  
  await p.save();
  
  console.log('✅ Medidas limpiadas');
  console.log('Medidas después:', p.medidas?.length || 0);
  
  process.exit(0);
}

limpiarMedidas();
