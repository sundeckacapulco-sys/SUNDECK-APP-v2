/**
 * AUDITORÍA: Verificar colecciones activas en MongoDB
 * Fecha: 6 Noviembre 2025
 */

const mongoose = require('mongoose');

async function auditarColecciones() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Listar todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 COLECCIONES ACTIVAS:\n');
    
    const collectionNames = collections.map(c => c.name);
    collectionNames.forEach(name => {
      console.log(`   - ${name}`);
    });

    // 2. Contar documentos en colecciones clave
    console.log('\n📈 CONTEO DE DOCUMENTOS:\n');
    
    const coleccionesClave = ['prospectos', 'proyectos', 'cotizacions', 'pedidos', 'ordenfabricacions'];
    
    for (const coleccion of coleccionesClave) {
      if (collectionNames.includes(coleccion)) {
        const count = await mongoose.connection.db.collection(coleccion).countDocuments();
        console.log(`   ${coleccion.padEnd(20)} → ${count} documentos`);
      } else {
        console.log(`   ${coleccion.padEnd(20)} → ❌ NO EXISTE`);
      }
    }

    // 3. Verificar fecha del último documento en cada colección
    console.log('\n📅 ÚLTIMO REGISTRO POR COLECCIÓN:\n');
    
    for (const coleccion of coleccionesClave) {
      if (collectionNames.includes(coleccion)) {
        const ultimo = await mongoose.connection.db.collection(coleccion)
          .find()
          .sort({ _id: -1 })
          .limit(1)
          .toArray();
        
        if (ultimo.length > 0) {
          const fecha = ultimo[0]._id.getTimestamp();
          console.log(`   ${coleccion.padEnd(20)} → ${fecha.toLocaleString('es-MX')}`);
        } else {
          console.log(`   ${coleccion.padEnd(20)} → (vacía)`);
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Auditoría completada\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

auditarColecciones();
