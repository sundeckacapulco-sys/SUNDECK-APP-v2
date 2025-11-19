const mongoose = require('mongoose');

async function buscar() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  console.log('\n🔍 BUSCANDO PROYECTO HECTOR EN TODAS LAS COLECCIONES\n');
  console.log('='.repeat(70));
  
  // Buscar en todas las colecciones
  const collections = await mongoose.connection.db.listCollections().toArray();
  
  for (const coll of collections) {
    const collName = coll.name;
    
    try {
      const docs = await mongoose.connection.db.collection(collName).find({
        $or: [
          { numero: /HECTOR/i },
          { 'cliente.nombre': /HECTOR/i },
          { cliente: /HECTOR/i }
        ]
      }).limit(5).toArray();
      
      if (docs.length > 0) {
        console.log(`\n✅ Encontrado en: ${collName}`);
        docs.forEach(doc => {
          console.log(`   ID: ${doc._id}`);
          console.log(`   Número: ${doc.numero || 'N/A'}`);
          console.log(`   Cliente: ${doc.cliente?.nombre || doc.cliente || 'N/A'}`);
          console.log(`   Piezas: ${doc.piezas?.length || 0}`);
          
          if (doc.piezas && doc.piezas.length > 0) {
            console.log(`\n   📋 Primeras 3 piezas:`);
            doc.piezas.slice(0, 3).forEach((p, i) => {
              console.log(`      ${i + 1}. ${p.ubicacion || 'Sin ubicación'}: ${p.ancho}m × ${p.alto}m`);
              console.log(`         Rotada: ${p.rotada ? '✅ SÍ' : '❌ NO'}`);
            });
          }
          console.log('   ---');
        });
      }
    } catch (err) {
      // Ignorar errores de colecciones del sistema
    }
  }
  
  console.log('\n' + '='.repeat(70));
  await mongoose.disconnect();
  process.exit(0);
}

buscar();
