/**
 * Script para actualizar el campo requiere_factura en proyectos con anticipo
 * Ejecutar: node server/scripts/actualizarRequiereFactura.js
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck');

const Proyecto = require('../models/Proyecto');

async function actualizar() {
  try {
    // Buscar proyectos con anticipo pagado
    const proyectos = await Proyecto.find({
      'pagos.anticipo.pagado': true
    });

    console.log(`\n📊 Proyectos con anticipo: ${proyectos.length}\n`);

    for (const proyecto of proyectos) {
      console.log(`\nProyecto: ${proyecto.numero || proyecto._id}`);
      console.log(`Requiere factura actual: ${proyecto.requiere_factura}`);
      console.log(`Correo cliente: ${proyecto.cliente?.correo || 'No definido'}`);
      
      // Si tiene correo del cliente, probablemente requiere factura
      if (proyecto.cliente?.correo && !proyecto.requiere_factura) {
        proyecto.requiere_factura = true;
        await proyecto.save();
        console.log('✅ Actualizado a: requiere_factura = true');
      }
    }

    console.log('\n✅ Proceso completado\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

actualizar();
