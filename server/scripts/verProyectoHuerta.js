const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const p = await mongoose.connection.db.collection('proyectos').findOne({ 
    numero: '2025-ARQ-HECTOR-003' 
  });
  
  console.log('=== PROYECTO HECTOR HUERTA ===');
  console.log('ID:', p._id);
  console.log('Número:', p.numero);
  console.log('Estado:', p.estado);
  console.log('\n=== PAGOS ===');
  console.log('Monto Total:', p.pagos?.montoTotal);
  console.log('\nAnticipo:');
  console.log('  - Monto:', p.pagos?.anticipo?.monto);
  console.log('  - Pagado:', p.pagos?.anticipo?.pagado);
  console.log('  - Fecha:', p.pagos?.anticipo?.fechaPago);
  console.log('  - Método:', p.pagos?.anticipo?.metodoPago);
  console.log('\nSaldo:');
  console.log('  - Monto:', p.pagos?.saldo?.monto);
  console.log('  - Pagado:', p.pagos?.saldo?.pagado);
  console.log('  - Fecha:', p.pagos?.saldo?.fechaPago);
  console.log('  - Método:', p.pagos?.saldo?.metodoPago);
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
