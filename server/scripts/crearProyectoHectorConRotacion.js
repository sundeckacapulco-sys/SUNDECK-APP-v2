const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');

async function crear() {
  await mongoose.connect('mongodb://localhost:27017/sundeck');
  
  // Eliminar proyecto existente si existe
  await Proyecto.deleteOne({ _id: '690e69251346d61cfcd5178d' });
  
  const proyecto = await Proyecto.create({
    _id: '690e69251346d61cfcd5178d',
    numero: '2025-ARQ-HECTOR-003',
    cliente: {
      nombre: 'Arq. Hector Huerta',
      telefono: '7441234567',
      email: 'hector@example.com'
    },
    direccion: {
      calle: 'Calle Principal',
      colonia: 'Centro',
      ciudad: 'Acapulco',
      estado: 'Guerrero',
      codigoPostal: '39000'
    },
    piezas: [
      // Sala Comedor - Screen Soft White (ROTADAS)
      {
        ubicacion: 'Sala Comedor',
        ancho: 3.28,
        alto: 2.56,
        producto: 'screen_5',
        modelo: 'Soft  white',
        motorizado: true,
        rotada: true  // ✅ ROTADA
      },
      {
        ubicacion: 'Sala Comedor',
        ancho: 3.38,
        alto: 2.56,
        producto: 'screen_5',
        modelo: 'Soft  white',
        motorizado: true,
        rotada: true  // ✅ ROTADA
      },
      // Rec Principal - Blackout Montreal White
      {
        ubicacion: 'Rec Principal',
        ancho: 4.28,
        alto: 2.80,
        producto: 'blackout',
        modelo: 'Montreal white',
        motorizado: true,
        rotada: true  // ✅ ROTADA
      },
      {
        ubicacion: 'Rec Principal',
        ancho: 1.32,
        alto: 2.80,
        producto: 'blackout',
        modelo: 'Montreal white',
        motorizado: false,
        rotada: false  // ❌ NO ROTADA
      },
      // Rec 2 - Blackout Montreal White
      {
        ubicacion: 'Rec 2',
        ancho: 1.99,
        alto: 1.58,
        producto: 'blackout',
        modelo: 'Montreal White',
        motorizado: true,
        rotada: false  // ❌ NO ROTADA (alto pequeño)
      },
      {
        ubicacion: 'Rec 2',
        ancho: 3.00,
        alto: 1.58,
        producto: 'blackout',
        modelo: 'Montreal White',
        motorizado: true,
        rotada: false  // ❌ NO ROTADA (alto pequeño)
      }
    ],
    total: 45000,
    anticipo: 22500,
    estado: 'produccion'
  });
  
  console.log('✅ Proyecto creado:', proyecto._id);
  console.log('   Número:', proyecto.numero);
  console.log('   Piezas:', proyecto.piezas.length);
  console.log('\n📋 Detalle de piezas:');
  
  proyecto.piezas.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.ubicacion} - ${p.modelo}`);
    console.log(`   ${p.ancho}m × ${p.alto}m`);
    console.log(`   Rotada: ${p.rotada ? '✅ SÍ' : '❌ NO'}`);
  });
  
  await mongoose.disconnect();
  process.exit(0);
}

crear();
