const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs').promises;
const path = require('path');

async function startDb() {
  try {
    console.log('Iniciando MongoMemoryServer...');
    // Solución definitiva para UnknownLinuxDistro: especificar una versión de binario
    const mongod = await MongoMemoryServer.create({
      binary: {
        version: '6.0.4' // Esto evita la detección automática de la distro
      }
    });

    const uri = mongod.getUri();
    const uri_file_path = path.join('/tmp', 'temp_db_uri.txt');

    console.log('MongoMemoryServer funcionando en:', uri);

    await fs.writeFile(uri_file_path, uri);
    console.log(`URI guardada en ${uri_file_path}`);

    // Mantener el script en ejecución para que la DB no muera
    setInterval(() => {}, 1 << 30);
    console.log('DB en memoria activa. Este proceso se puede dejar corriendo.');

  } catch (error) {
    console.error("Error al iniciar MongoMemoryServer:", error);
    process.exit(1);
  }
}

startDb();
