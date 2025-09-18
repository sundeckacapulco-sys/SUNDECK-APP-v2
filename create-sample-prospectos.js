const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar modelos
const Prospecto = require('./server/models/Prospecto');
const Usuario = require('./server/models/Usuario');

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Prospectos de ejemplo
const prospectosEjemplo = [
  {
    nombre: 'María González Rodríguez',
    telefono: '55-1234-5678',
    email: 'maria.gonzalez@email.com',
    direccion: {
      calle: 'Av. Insurgentes Sur 1234',
      colonia: 'Del Valle',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '03100'
    },
    etapa: 'contactado',
    prioridad: 'alta',
    fuente: 'Facebook',
    tipoProducto: 'ventana',
    productoVariante: 'Persianas Screen 3%',
    descripcionNecesidad: 'Necesita persianas para sala y comedor, busca algo que filtre la luz pero permita visibilidad',
    presupuestoEstimado: 15000,
    fechaCita: new Date('2025-09-20T10:00:00Z'),
    horaCita: '10:00',
    estadoCita: 'confirmada',
    observaciones: 'Cliente muy interesado, tiene prisa por la instalación'
  },
  {
    nombre: 'Carlos Mendoza López',
    telefono: '55-9876-5432',
    email: 'carlos.mendoza@gmail.com',
    direccion: {
      calle: 'Calle Reforma 567',
      colonia: 'Polanco',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '11560'
    },
    etapa: 'cita_agendada',
    prioridad: 'media',
    fuente: 'Referido',
    tipoProducto: 'puerta',
    productoVariante: 'Toldos Retráctiles',
    descripcionNecesidad: 'Toldo para terraza grande, necesita protección solar y lluvia',
    presupuestoEstimado: 25000,
    fechaCita: new Date('2025-09-18T14:30:00Z'),
    horaCita: '14:30',
    estadoCita: 'confirmada',
    observaciones: 'Terraza de 40m², cliente con buen presupuesto'
  },
  {
    nombre: 'Ana Patricia Ruiz',
    telefono: '55-5555-1111',
    email: 'ana.ruiz@hotmail.com',
    direccion: {
      calle: 'Privada de los Cedros 89',
      colonia: 'Las Lomas',
      ciudad: 'Naucalpan',
      estado: 'Estado de México',
      codigoPostal: '53950'
    },
    etapa: 'cotizacion',
    prioridad: 'alta',
    fuente: 'Google Ads',
    tipoProducto: 'ventana',
    productoVariante: 'Persianas Blackout',
    descripcionNecesidad: 'Persianas blackout para recámaras, necesita oscuridad total',
    presupuestoEstimado: 18000,
    fechaCita: new Date('2025-09-19T16:00:00Z'),
    horaCita: '16:00',
    estadoCita: 'completada',
    observaciones: 'Ya se hizo levantamiento, pendiente cotización'
  },
  {
    nombre: 'Roberto Silva Martínez',
    telefono: '55-7777-8888',
    email: 'roberto.silva@empresa.com',
    direccion: {
      calle: 'Blvd. Manuel Ávila Camacho 1500',
      colonia: 'Lomas de Chapultepec',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '11000'
    },
    etapa: 'pedido',
    prioridad: 'urgente',
    fuente: 'WhatsApp',
    tipoProducto: 'otro',
    productoVariante: 'Sistemas Antihuracán',
    descripcionNecesidad: 'Sistema antihuracán para oficinas, necesita instalación rápida',
    presupuestoEstimado: 45000,
    fechaCita: new Date('2025-09-17T09:00:00Z'),
    horaCita: '09:00',
    estadoCita: 'completada',
    observaciones: 'Cliente corporativo, pedido urgente por temporada de huracanes'
  },
  {
    nombre: 'Lucía Fernández Torres',
    telefono: '55-3333-4444',
    email: 'lucia.fernandez@yahoo.com',
    direccion: {
      calle: 'Calle Durango 234',
      colonia: 'Roma Norte',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '06700'
    },
    etapa: 'nuevo',
    prioridad: 'baja',
    fuente: 'Instagram',
    tipoProducto: 'ventana',
    productoVariante: 'Cortinas Motorizadas',
    descripcionNecesidad: 'Cortinas motorizadas para departamento moderno',
    presupuestoEstimado: 22000,
    observaciones: 'Prospecto nuevo, aún evaluando opciones'
  },
  {
    nombre: 'Jorge Ramírez Castillo',
    telefono: '55-6666-7777',
    email: 'jorge.ramirez@outlook.com',
    direccion: {
      calle: 'Av. Universidad 890',
      colonia: 'Copilco',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '04360'
    },
    etapa: 'fabricacion',
    prioridad: 'media',
    fuente: 'Referido',
    tipoProducto: 'domo',
    productoVariante: 'Pérgolas y Sombras',
    descripcionNecesidad: 'Pérgola para jardín trasero con sistema de sombra',
    presupuestoEstimado: 35000,
    fechaCita: new Date('2025-09-15T11:00:00Z'),
    horaCita: '11:00',
    estadoCita: 'completada',
    observaciones: 'En proceso de fabricación, entrega estimada en 2 semanas'
  },
  {
    nombre: 'Patricia Morales Vega',
    telefono: '55-2222-3333',
    email: 'patricia.morales@gmail.com',
    direccion: {
      calle: 'Calle Ámsterdam 456',
      colonia: 'Condesa',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '06100'
    },
    etapa: 'instalacion',
    prioridad: 'alta',
    fuente: 'Facebook',
    tipoProducto: 'ventana',
    productoVariante: 'Persianas Duo / Sheer Elegance',
    descripcionNecesidad: 'Persianas elegantes para sala de estar y comedor',
    presupuestoEstimado: 28000,
    fechaCita: new Date('2025-09-21T13:00:00Z'),
    horaCita: '13:00',
    estadoCita: 'confirmada',
    observaciones: 'Instalación programada para la próxima semana'
  },
  {
    nombre: 'Eduardo Herrera Sánchez',
    telefono: '55-8888-9999',
    email: 'eduardo.herrera@empresa.mx',
    direccion: {
      calle: 'Paseo de la Reforma 2000',
      colonia: 'Lomas de Bezares',
      ciudad: 'Ciudad de México',
      estado: 'CDMX',
      codigoPostal: '11910'
    },
    etapa: 'entregado',
    prioridad: 'media',
    fuente: 'Google Ads',
    tipoProducto: 'ventana',
    productoVariante: 'Toldos Verticales (Screen, Soltis, etc.)',
    descripcionNecesidad: 'Toldos verticales para oficina ejecutiva',
    presupuestoEstimado: 32000,
    fechaCita: new Date('2025-09-10T15:30:00Z'),
    horaCita: '15:30',
    estadoCita: 'completada',
    observaciones: 'Proyecto completado exitosamente, cliente muy satisfecho'
  }
];

// Función para crear prospectos
const crearProspectos = async () => {
  try {
    // Buscar un usuario admin para asignar como creador
    const adminUser = await Usuario.findOne({ rol: 'admin' });
    if (!adminUser) {
      console.log('❌ No se encontró usuario admin. Ejecuta primero create-admin-quick.js');
      return;
    }

    console.log('🔄 Creando prospectos de ejemplo...');

    // Limpiar prospectos existentes (opcional)
    await Prospecto.deleteMany({});
    console.log('🗑️ Prospectos anteriores eliminados');

    // Agregar campos adicionales a cada prospecto
    const prospectosConMetadata = prospectosEjemplo.map(prospecto => ({
      ...prospecto,
      creadoPor: adminUser._id,
      fechaCreacion: new Date(),
      fechaUltimoContacto: new Date(),
      activo: true
    }));

    // Insertar prospectos
    const prospectosCreados = await Prospecto.insertMany(prospectosConMetadata);

    console.log(`✅ ${prospectosCreados.length} prospectos creados exitosamente:`);
    
    prospectosCreados.forEach((prospecto, index) => {
      console.log(`   ${index + 1}. ${prospecto.nombre} - ${prospecto.etapa} (${prospecto.prioridad})`);
    });

    console.log('\n📊 Resumen por etapa:');
    const resumenEtapas = {};
    prospectosCreados.forEach(p => {
      resumenEtapas[p.etapa] = (resumenEtapas[p.etapa] || 0) + 1;
    });
    
    Object.entries(resumenEtapas).forEach(([etapa, count]) => {
      console.log(`   - ${etapa}: ${count} prospecto${count > 1 ? 's' : ''}`);
    });

    console.log('\n🎯 Prospectos listos para probar:');
    console.log('   • Levantamiento de medidas con fotos');
    console.log('   • Generación de PDFs y Excel');
    console.log('   • Timeline de etapas');
    console.log('   • Cotizaciones automáticas');
    console.log('   • Kanban board completo');

  } catch (error) {
    console.error('❌ Error creando prospectos:', error);
  }
};

// Ejecutar script
const main = async () => {
  await connectDB();
  await crearProspectos();
  
  console.log('\n✨ ¡Prospectos de ejemplo creados exitosamente!');
  console.log('   Puedes acceder al sistema en: http://localhost:3000');
  console.log('   Usuario: admin@sundeck.com');
  console.log('   Contraseña: password');
  
  process.exit(0);
};

// Manejar errores
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  process.exit(1);
});

// Ejecutar
main();
