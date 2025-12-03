const mongoose = require('mongoose');

async function verificarDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sundeck';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Aumentar el tiempo de espera
    });
    console.log('Conectado a MongoDB');

    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const { databases } = await admin.listDatabases();

    console.log('Bases de datos disponibles:');
    databases.forEach(db => console.log(`- ${db.name}`));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error al conectar o verificar la base de datos:', error.message);
    process.exit(1);
  }
}

verificarDB();
