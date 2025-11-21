const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const Pedido = require('../models/Pedido');
const Cotizacion = require('../models/Cotizacion');

async function verificarDatos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');

    // Contar documentos
    const totalProyectos = await Proyecto.countDocuments();
    const totalPedidos = await Pedido.countDocuments();
    const totalCotizaciones = await Cotizacion.countDocuments();

    console.log('📊 RESUMEN DE BASE DE DATOS:');
    console.log(`   Proyectos: ${totalProyectos}`);
    console.log(`   Cotizaciones: ${totalCotizaciones}`);
    console.log(`   Pedidos: ${totalPedidos}\n`);

    // Proyectos con levantamiento
    const proyectosConLevantamiento = await Proyecto.countDocuments({
      'levantamiento.partidas.0': { $exists: true }
    });
    console.log(`   Proyectos con levantamiento: ${proyectosConLevantamiento}\n`);

    // Listar algunos proyectos
    if (totalProyectos > 0) {
      console.log('📋 PROYECTOS RECIENTES:');
      const proyectos = await Proyecto.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('numero cliente.nombre estado levantamiento')
        .lean();

      proyectos.forEach((p, i) => {
        const partidas = p.levantamiento?.partidas?.length || 0;
        console.log(`   ${i + 1}. ${p.numero || p._id}`);
        console.log(`      Cliente: ${p.cliente?.nombre || 'Sin nombre'}`);
        console.log(`      Estado: ${p.estado}`);
        console.log(`      Partidas: ${partidas}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verificarDatos();
