/**
 * Backup Manual de MongoDB usando Node.js
 * Alternativa cuando mongodump no está disponible
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck';
const BACKUP_DIR = path.join(__dirname, '../../backup_pre_migracion');

async function crearBackup() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log('📁 Creando directorio de backup...');
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Encontradas ${collections.length} colecciones`);
    
    let totalDocs = 0;
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      console.log(`\n📦 Respaldando colección: ${collName}`);
      
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      
      const backupFile = path.join(BACKUP_DIR, `${collName}.json`);
      await fs.writeFile(backupFile, JSON.stringify(docs, null, 2));
      
      console.log(`   ✅ ${docs.length} documentos guardados en ${collName}.json`);
      totalDocs += docs.length;
    }
    
    // Guardar metadata
    const metadata = {
      fecha: new Date().toISOString(),
      colecciones: collections.length,
      documentos: totalDocs,
      database: 'sundeck'
    };
    
    await fs.writeFile(
      path.join(BACKUP_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('\n✅ Backup completado exitosamente');
    console.log(`📊 Total: ${collections.length} colecciones, ${totalDocs} documentos`);
    console.log(`📁 Ubicación: ${BACKUP_DIR}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    process.exit(1);
  }
}

crearBackup();
