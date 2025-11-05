/**
 * Verificar estado de la base de datos
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck';

async function verificarDB() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    console.log(`📍 URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa\n');
    
    const db = mongoose.connection.db;
    
    // Listar todas las bases de datos
    const admin = db.admin();
    const dbs = await admin.listDatabases();
    
    console.log('📊 Bases de datos disponibles:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Listar colecciones en sundeck
    console.log('\n📦 Colecciones en "sundeck":');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   ⚠️  No hay colecciones en esta base de datos');
    } else {
      for (const coll of collections) {
        const collection = db.collection(coll.name);
        const count = await collection.countDocuments();
        console.log(`   - ${coll.name}: ${count} documentos`);
      }
    }
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarDB();
