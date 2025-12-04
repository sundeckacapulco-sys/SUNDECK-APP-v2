const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const Proyecto = require('../../models/Proyecto');
  
  // Buscar proyectos que aparecen en Dashboard de Fabricación
  const proyectos = await Proyecto.find({
    $or: [
      { estado: 'fabricacion' },
      { 'fabricacion.estado': { $in: ['pendiente', 'en_proceso', 'recepcion_material'] } }
    ]
  }).select('numero _id cliente.nombre estado fabricacion.estado levantamiento.partidas medidas').lean();
  
  console.log('=== Proyectos en Dashboard Fabricación ===');
  proyectos.forEach(p => {
    console.log(`ID: ${p._id}`);
    console.log(`  Número: ${p.numero}`);
    console.log(`  Cliente: ${p.cliente?.nombre}`);
    console.log(`  Estado: ${p.estado} | Fab: ${p.fabricacion?.estado}`);
    console.log(`  Partidas: ${p.levantamiento?.partidas?.length || 0} | Medidas: ${p.medidas?.length || 0}`);
    console.log('---');
  });
  
  // Buscar específicamente el ID problemático
  const prob = await Proyecto.findById('692f6bf1b59372b68163babb').select('numero cliente.nombre').lean();
  if (prob) {
    console.log('\n=== Proyecto ID 692f6bf1b59372b68163babb ===');
    console.log('Número:', prob.numero);
    console.log('Cliente:', prob.cliente?.nombre);
  }
  
  mongoose.disconnect();
});
