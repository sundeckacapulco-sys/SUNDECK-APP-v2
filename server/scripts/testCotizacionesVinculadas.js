const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const Cotizacion = require('../models/Cotizacion');

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB\n');

    const proyectos = await Proyecto.find().limit(5).select('_id cliente.nombre');
    const proyectoIds = proyectos.map(p => p._id);
    
    console.log('=== PROYECTOS ===');
    proyectos.forEach(p => console.log('- ID:', p._id.toString(), '| Cliente:', p.cliente?.nombre));
    
    console.log('\n=== BUSCANDO COTIZACIONES ===');
    const cotizaciones = await Cotizacion.find({
      $or: [
        { proyectoId: { $in: proyectoIds } },
        { proyecto: { $in: proyectoIds } }
      ]
    }).select('proyectoId proyecto total subtotal iva numero');
    
    console.log('Cotizaciones encontradas:', cotizaciones.length);
    cotizaciones.forEach(c => {
      const proyectoId = (c.proyectoId || c.proyecto)?.toString();
      console.log('- Num:', c.numero, '| ProyectoId:', proyectoId, '| Total:', c.total);
    });
    
    console.log('\n=== TOTALES POR PROYECTO ===');
    const totalesPorProyecto = {};
    cotizaciones.forEach(cot => {
      const proyectoId = (cot.proyectoId || cot.proyecto)?.toString();
      if (!totalesPorProyecto[proyectoId]) {
        totalesPorProyecto[proyectoId] = {
          total: 0,
          numCotizaciones: 0
        };
      }
      totalesPorProyecto[proyectoId].total += cot.total || 0;
      totalesPorProyecto[proyectoId].numCotizaciones += 1;
    });
    
    proyectos.forEach(p => {
      const id = p._id.toString();
      const totales = totalesPorProyecto[id] || { total: 0, numCotizaciones: 0 };
      console.log(`${p.cliente?.nombre}: $${totales.total.toFixed(2)} (${totales.numCotizaciones} cotizaciones)`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
