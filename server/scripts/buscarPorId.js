const mongoose = require('mongoose');

async function buscar() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  const id = '690e69251346d61cfcd5178d';
  
  console.log(`\n🔍 BUSCANDO ID: ${id}\n`);
  console.log('='.repeat(70));
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const coll of collections) {
    const collName = coll.name;
    
    try {
      const doc = await mongoose.connection.db.collection(collName).findOne({
        _id: new mongoose.Types.ObjectId(id)
      });
      
      if (doc) {
        console.log(`\n✅ ENCONTRADO EN: ${collName}`);
        console.log(`   ID: ${doc._id}`);
        console.log(`   Número: ${doc.numero || 'N/A'}`);
        console.log(`   Cliente: ${JSON.stringify(doc.cliente || 'N/A')}`);
        console.log(`   Total piezas: ${doc.piezas?.length || 0}`);
        
        if (doc.piezas && doc.piezas.length > 0) {
          console.log(`\n   📋 TODAS LAS PIEZAS:\n`);
          doc.piezas.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.ubicacion || 'Sin ubicación'} - ${p.modelo || p.producto}`);
            console.log(`      Dimensiones: ${p.ancho}m × ${p.alto}m`);
            console.log(`      Producto: ${p.producto}`);
            console.log(`      Rotada: ${p.rotada !== undefined ? (p.rotada ? '✅ SÍ' : '❌ NO') : '⚠️  UNDEFINED'}`);
            console.log(`      Motorizado: ${p.motorizado ? 'SÍ' : 'NO'}`);
            console.log('');
          });
        }
        break;
      }
    } catch (err) {
      // Ignorar errores
    }
  }
  
  console.log('='.repeat(70));
  await mongoose.disconnect();
  process.exit(0);
}

buscar();
