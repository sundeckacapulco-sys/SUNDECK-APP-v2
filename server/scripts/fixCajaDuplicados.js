const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const Caja = require('../models/Caja');
  
  // Buscar caja abierta
  const caja = await Caja.findOne({ estado: 'abierta' });
  
  if (!caja) {
    console.log('No hay caja abierta');
    process.exit(0);
  }
  
  console.log('Caja encontrada:', caja.numero);
  console.log('Movimientos antes:', caja.movimientos.length);
  
  // Eliminar el último movimiento (duplicado)
  if (caja.movimientos.length > 1) {
    caja.movimientos.pop();
    console.log('Movimientos después:', caja.movimientos.length);
  }
  
  // Recalcular totales
  caja.recalcularTotales();
  console.log('Totales recalculados:', caja.totales);
  
  await caja.save();
  console.log('Caja guardada');
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
