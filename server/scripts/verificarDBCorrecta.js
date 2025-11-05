/**
 * Verificar estado de la base de datos sundeck-crm
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/sundeck-crm';

async function verificarDB() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    console.log(`📍 URI: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conexión exitosa\n');
    
    const db = mongoose.connection.db;
    
    // Listar colecciones
    console.log('📦 Colecciones en "sundeck-crm":');
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('   ⚠️  No hay colecciones en esta base de datos');
    } else {
      let totalDocs = 0;
      for (const coll of collections) {
        const collection = db.collection(coll.name);
        const count = await collection.countDocuments();
        console.log(`   - ${coll.name}: ${count} documentos`);
        totalDocs += count;
      }
      console.log(`\n📊 Total: ${collections.length} colecciones, ${totalDocs} documentos`);
    }
    
    // Buscar colecciones legacy específicas
    console.log('\n🔍 Buscando colecciones legacy:');
    const proyectoPedidos = await db.collection('proyectopedidos').countDocuments().catch(() => 0);
    const pedidos = await db.collection('pedidos').countDocuments().catch(() => 0);
    
    console.log(`   - proyectopedidos (legacy): ${proyectoPedidos} documentos`);
    console.log(`   - pedidos (moderno): ${pedidos} documentos`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarDB();
