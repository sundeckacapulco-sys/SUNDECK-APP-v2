/**
 * Script para actualizar fecha de creación de cotizaciones
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function actualizar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');
    
    const db = mongoose.connection.db;
    const cotizaciones = db.collection('cotizacions');
    
    // Actualizar cotización COT-2025-0007
    const result = await cotizaciones.updateOne(
      { numero: 'COT-2025-0007' },
      { 
        $set: { 
          createdAt: new Date('2025-11-07'),
          updatedAt: new Date('2025-11-07')
        } 
      }
    );
    
    console.log('✅ Cotización actualizada:', result.modifiedCount);
    
    // Verificar
    const cot = await cotizaciones.findOne({ numero: 'COT-2025-0007' });
    console.log('Fecha createdAt:', cot.createdAt);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

actualizar();
