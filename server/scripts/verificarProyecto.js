const mongoose = require('mongoose');
require('dotenv').config();
const Proyecto = require('../models/Proyecto');

async function verificar() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
  const p = await Proyecto.findById('68f8f89aca4798f5414480fe');
  
  console.log('=== VERIFICACIÓN DEL PROYECTO ===');
  console.log('Total proyecto:', p.total);
  console.log('Subtotal proyecto:', p.subtotal);
  console.log('\nLevantamiento totales:', p.levantamiento?.totales);
  
  if (p.levantamiento?.partidas?.[0]?.piezas?.[0]) {
    console.log('\nPrimera pieza:');
    console.log('  precioM2:', p.levantamiento.partidas[0].piezas[0].precioM2);
    console.log('  totales:', p.levantamiento.partidas[0].piezas[0].totales);
  }
  
  process.exit(0);
}

verificar();
