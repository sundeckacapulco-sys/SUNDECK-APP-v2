const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
require('dotenv').config();

async function ver() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const id = '690e69251346d61cfcd5178d';
  const proyecto = await Proyecto.findById(id);
  
  if (!proyecto) {
    console.log(`❌ Proyecto ${id} NO encontrado en colección Proyecto`);
    
    // Buscar en todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const coll of collections) {
      try {
        const doc = await mongoose.connection.db.collection(coll.name).findOne({
          _id: new mongoose.Types.ObjectId(id)
        });
        if (doc) {
          console.log(`\n✅ ENCONTRADO EN COLECCIÓN: ${coll.name}\n`);
          console.log(JSON.stringify(doc, null, 2));
          break;
        }
      } catch (err) {}
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
  
  console.log('\n✅ PROYECTO ENCONTRADO\n');
  console.log('='.repeat(70));
  console.log(`ID: ${proyecto._id}`);
  console.log(`Número: ${proyecto.numero}`);
  console.log(`Cliente: ${proyecto.cliente?.nombre || 'N/A'}`);
  console.log(`Total piezas: ${proyecto.piezas?.length || 0}`);
  console.log('\n📋 PIEZAS CON ROTACIÓN:\n');
  
  proyecto.piezas.forEach((p, i) => {
    console.log(`${i + 1}. ${p.ubicacion || 'Sin ubicación'} - ${p.modelo || p.producto}`);
    console.log(`   Dimensiones: ${p.ancho}m × ${p.alto}m`);
    console.log(`   Producto: ${p.producto}`);
    console.log(`   Rotada: ${p.rotada !== undefined ? (p.rotada ? '✅ SÍ' : '❌ NO') : '⚠️  UNDEFINED'}`);
    console.log(`   Motorizado: ${p.motorizado ? 'SÍ' : 'NO'}`);
    console.log('');
  });
  
  console.log('='.repeat(70));
  
  await mongoose.disconnect();
  process.exit(0);
}

ver();
