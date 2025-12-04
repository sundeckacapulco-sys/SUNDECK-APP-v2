const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  // Buscar proyecto de Hector Huerta
  const proyecto = await mongoose.connection.db.collection('proyectos').findOne({ 
    'cliente.nombre': /hector/i 
  });
  
  if (!proyecto) {
    console.log('Proyecto no encontrado');
    process.exit(1);
  }
  
  console.log('Proyecto encontrado:', proyecto.numero);
  console.log('Cliente:', proyecto.cliente.nombre);
  console.log('Anticipo actual:', proyecto.pagos?.anticipo);
  console.log('Saldo actual:', proyecto.pagos?.saldo);
  
  // Calcular saldo correcto
  // Total: $65,423 - Anticipo: $39,253.68 = Saldo: $26,169.32
  const montoTotal = 65423;
  const anticipoPagado = proyecto.pagos?.anticipo?.monto || 39253.68;
  const saldoCorrecto = montoTotal - anticipoPagado;
  
  console.log('\n--- Corrección ---');
  console.log('Monto Total:', montoTotal);
  console.log('Anticipo pagado:', anticipoPagado);
  console.log('Saldo correcto:', saldoCorrecto);
  
  // Actualizar
  const result = await mongoose.connection.db.collection('proyectos').updateOne(
    { _id: proyecto._id },
    { 
      $set: { 
        'pagos.saldo.monto': saldoCorrecto,
        'pagos.montoTotal': montoTotal
      } 
    }
  );
  
  console.log('\nActualizado:', result.modifiedCount, 'documento(s)');
  
  // Verificar
  const verificar = await mongoose.connection.db.collection('proyectos').findOne({ _id: proyecto._id });
  console.log('Nuevo saldo:', verificar.pagos?.saldo);
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
