const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/sundeck-crm').then(async () => {
  const Caja = require('../models/Caja');
  
  // Verificar si hay caja abierta
  let caja = await Caja.findOne({ estado: 'abierta' });
  
  if (!caja) {
    console.log('Creando nueva caja...');
    caja = new Caja({
      fecha: new Date(),
      apertura: {
        hora: new Date(),
        fondoInicial: 0,
        usuario: new mongoose.Types.ObjectId('68cc13722bf86c5ed8fd211a'), // Admin
        observaciones: 'Caja abierta para registrar pago Huerta'
      },
      estado: 'abierta'
    });
    await caja.save();
    console.log('Caja creada:', caja.numero);
  } else {
    console.log('Caja existente:', caja.numero);
  }
  
  // Registrar el pago de Huerta
  const movimiento = {
    tipo: 'ingreso',
    categoria: 'saldo_proyecto',
    concepto: 'Saldo - 2025-ARQ-HECTOR-003 - Arq. Hector Huerta',
    monto: 26169.32,
    metodoPago: 'transferencia',
    referencia: '',
    proyecto: new mongoose.Types.ObjectId('690e69251346d61cfcd5178d'),
    tipoPago: 'saldo',
    cliente: {
      nombre: 'Arq. Hector Huerta',
      telefono: '7441002514'
    },
    hora: new Date(),
    usuario: new mongoose.Types.ObjectId('68cc13722bf86c5ed8fd211a'),
    estado: 'activo'
  };
  
  await caja.agregarMovimiento(movimiento);
  
  console.log('\n=== MOVIMIENTO REGISTRADO ===');
  console.log('Caja:', caja.numero);
  console.log('Monto:', movimiento.monto);
  console.log('Totales:', caja.totales);
  
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
