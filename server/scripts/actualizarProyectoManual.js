/**
 * Script para actualizar manualmente el proyecto con datos de facturación
 * Ejecutar: node server/scripts/actualizarProyectoManual.js
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');

const Proyecto = require('../models/Proyecto');

async function actualizar() {
  try {
    // Buscar el proyecto con anticipo pagado
    const proyecto = await Proyecto.findOne({
      'pagos.anticipo.pagado': true
    });

    if (!proyecto) {
      console.log('❌ No se encontró el proyecto');
      return;
    }

    console.log(`\n📋 Proyecto encontrado: ${proyecto.numero || proyecto._id}`);
    console.log(`Cliente: ${proyecto.cliente?.nombre}`);
    
    // Actualizar datos de facturación
    proyecto.requiere_factura = true;
    
    // Si no tiene correo, agregarlo
    if (!proyecto.cliente.correo) {
      // Aquí puedes poner el correo real del cliente
      proyecto.cliente.correo = 'cliente@ejemplo.com'; // CAMBIAR POR EL CORREO REAL
    }
    
    await proyecto.save();
    
    console.log('\n✅ Proyecto actualizado:');
    console.log(`Requiere factura: ${proyecto.requiere_factura}`);
    console.log(`Correo cliente: ${proyecto.cliente.correo}`);
    console.log(`Tiempo de entrega: ${proyecto.tiempo_entrega?.dias_estimados} días`);
    console.log(`Fecha estimada: ${proyecto.tiempo_entrega?.fecha_estimada?.toISOString().split('T')[0]}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

actualizar();
