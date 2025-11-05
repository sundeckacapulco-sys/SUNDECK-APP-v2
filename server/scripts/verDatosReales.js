/**
 * Ver datos reales de los pedidos migrados
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/sundeck-crm';

async function verDatos() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    const pedidos = await db.collection('pedidos').find({}).toArray();
    
    console.log(`\n📊 Total pedidos: ${pedidos.length}\n`);
    
    pedidos.forEach((p, index) => {
      console.log(`\n=== PEDIDO ${index + 1} ===`);
      console.log(JSON.stringify(p, null, 2));
    });
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verDatos();
