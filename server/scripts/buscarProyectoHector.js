const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');

async function buscar() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  const pedidos = await Pedido.find({ numero: /HECTOR/i }).select('_id numero cliente piezas').limit(5);
  
  console.log(`\n📋 Pedidos encontrados: ${pedidos.length}\n`);
  
  pedidos.forEach(p => {
    console.log(`ID: ${p._id}`);
    console.log(`Número: ${p.numero}`);
    console.log(`Cliente: ${p.cliente}`);
    console.log(`Piezas: ${p.piezas?.length || 0}`);
    console.log('---');
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

buscar();
