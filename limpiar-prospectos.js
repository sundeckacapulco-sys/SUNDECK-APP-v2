const mongoose = require('mongoose');
const Prospecto = require('./server/models/Prospecto');
const Etapa = require('./server/models/Etapa');
const Cotizacion = require('./server/models/Cotizacion');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function limpiarProspectos() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    // Borrar todas las etapas
    const etapasEliminadas = await Etapa.deleteMany({});
    console.log(`✅ Eliminadas ${etapasEliminadas.deletedCount} etapas`);
    
    // Borrar todas las cotizaciones
    const cotizacionesEliminadas = await Cotizacion.deleteMany({});
    console.log(`✅ Eliminadas ${cotizacionesEliminadas.deletedCount} cotizaciones`);
    
    // Borrar todos los prospectos
    const prospectosEliminados = await Prospecto.deleteMany({});
    console.log(`✅ Eliminados ${prospectosEliminados.deletedCount} prospectos`);
    
    console.log('🎉 Base de datos limpia. Lista para pruebas.');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    mongoose.connection.close();
  }
}

limpiarProspectos();
