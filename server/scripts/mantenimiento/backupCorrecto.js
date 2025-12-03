/**
 * Backup de sundeck antes de migración
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '../../backup_pre_migracion');
// Conexión directa a la base de datos de desarrollo. No más dependencia de archivos temporales.
const MONGODB_URI = 'mongodb://localhost:27017/sundeck-crm';

async function crearBackup() {
  try {
    console.log(`🔄 Conectando a MongoDB en ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    
    console.log('📁 Creando directorio de backup...');
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Encontradas ${collections.length} colecciones\n`);
    
    let totalDocs = 0;
    let backupSize = 0;
    
    for (const collInfo of collections) {
      const collName = collInfo.name;
      
      const collection = db.collection(collName);
      const docs = await collection.find({}).toArray();
      
      if (docs.length > 0) {
        const backupFile = path.join(BACKUP_DIR, `${collName}.json`);
        const content = JSON.stringify(docs, null, 2);
        await fs.writeFile(backupFile, content);
        
        backupSize += Buffer.byteLength(content);
        console.log(`✅ ${collName}: ${docs.length} documentos`);
        totalDocs += docs.length;
      }
    }
    
    // Guardar metadata
    const metadata = {
      fecha: new Date().toISOString(),
      database: 'sundeck-crm',
      colecciones: collections.length,
      documentos: totalDocs,
      tamanoBytes: backupSize,
      tamanoMB: (backupSize / 1024 / 1024).toFixed(2)
    };
    
    await fs.writeFile(
      path.join(BACKUP_DIR, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    console.log('\n✅ Backup completado exitosamente');
    console.log(`📊 Total: ${collections.length} colecciones, ${totalDocs} documentos`);
    console.log(`💾 Tamaño: ${metadata.tamanoMB} MB`);
    console.log(`📁 Ubicación: ${BACKUP_DIR}`);
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creando backup:', error.message);
    if (error.name === 'MongoNetworkError') {
      console.error('   👉 Causa: No se pudo conectar a la base de datos.');
      console.error(`   👉 Verifica que MongoDB esté corriendo y accesible en ${MONGODB_URI}`);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

crearBackup();
