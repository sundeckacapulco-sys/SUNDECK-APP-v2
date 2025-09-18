const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error:', err));

// Schema simple para Prospecto
const ProspectoSchema = new mongoose.Schema({
  nombre: String,
  telefono: String,
  email: String,
  direccion: {
    calle: String,
    colonia: String,
    ciudad: String,
    estado: String,
    codigoPostal: String
  },
  etapa: String,
  prioridad: String,
  fuente: String,
  tipoProducto: String,
  productoVariante: String,
  descripcionNecesidad: String,
  presupuestoEstimado: Number,
  fechaCita: Date,
  horaCita: String,
  estadoCita: String,
  observaciones: String,
  fechaCreacion: { type: Date, default: Date.now },
  fechaUltimoContacto: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true }
});

const Prospecto = mongoose.model('Prospecto', ProspectoSchema);

// Prospectos de ejemplo
const prospectos = [
  {
    nombre: 'María González',
    telefono: '55-1234-5678',
    email: 'maria@email.com',
    direccion: {
      calle: 'Av. Insurgentes Sur 1234',
      colonia: 'Del Valle',
      ciudad: 'CDMX',
      codigoPostal: '03100'
    },
    etapa: 'contactado',
    prioridad: 'alta',
    fuente: 'Facebook',
    tipoProducto: 'ventana',
    productoVariante: 'Persianas Screen 3%',
    descripcionNecesidad: 'Persianas para sala y comedor',
    presupuestoEstimado: 15000,
    observaciones: 'Cliente interesado'
  },
  {
    nombre: 'Carlos Mendoza',
    telefono: '55-9876-5432',
    email: 'carlos@gmail.com',
    direccion: {
      calle: 'Calle Reforma 567',
      colonia: 'Polanco',
      ciudad: 'CDMX',
      codigoPostal: '11560'
    },
    etapa: 'cita_agendada',
    prioridad: 'media',
    fuente: 'Referido',
    tipoProducto: 'puerta',
    productoVariante: 'Toldos Retráctiles',
    descripcionNecesidad: 'Toldo para terraza',
    presupuestoEstimado: 25000,
    fechaCita: new Date('2025-09-20T14:30:00Z'),
    horaCita: '14:30',
    estadoCita: 'confirmada',
    observaciones: 'Terraza grande'
  },
  {
    nombre: 'Ana Ruiz',
    telefono: '55-5555-1111',
    email: 'ana@hotmail.com',
    direccion: {
      calle: 'Privada de los Cedros 89',
      colonia: 'Las Lomas',
      ciudad: 'Naucalpan',
      codigoPostal: '53950'
    },
    etapa: 'cotizacion',
    prioridad: 'alta',
    fuente: 'Google Ads',
    tipoProducto: 'ventana',
    productoVariante: 'Persianas Blackout',
    descripcionNecesidad: 'Blackout para recámaras',
    presupuestoEstimado: 18000,
    observaciones: 'Pendiente cotización'
  },
  {
    nombre: 'Roberto Silva',
    telefono: '55-7777-8888',
    email: 'roberto@empresa.com',
    direccion: {
      calle: 'Blvd. Ávila Camacho 1500',
      colonia: 'Lomas de Chapultepec',
      ciudad: 'CDMX',
      codigoPostal: '11000'
    },
    etapa: 'pedido',
    prioridad: 'urgente',
    fuente: 'WhatsApp',
    tipoProducto: 'otro',
    productoVariante: 'Sistemas Antihuracán',
    descripcionNecesidad: 'Sistema antihuracán oficinas',
    presupuestoEstimado: 45000,
    observaciones: 'Cliente corporativo urgente'
  },
  {
    nombre: 'Lucía Fernández',
    telefono: '55-3333-4444',
    email: 'lucia@yahoo.com',
    direccion: {
      calle: 'Calle Durango 234',
      colonia: 'Roma Norte',
      ciudad: 'CDMX',
      codigoPostal: '06700'
    },
    etapa: 'nuevo',
    prioridad: 'baja',
    fuente: 'Instagram',
    tipoProducto: 'ventana',
    productoVariante: 'Cortinas Motorizadas',
    descripcionNecesidad: 'Cortinas motorizadas departamento',
    presupuestoEstimado: 22000,
    observaciones: 'Evaluando opciones'
  }
];

// Crear prospectos
setTimeout(async () => {
  try {
    await Prospecto.deleteMany({});
    console.log('🗑️ Limpiando prospectos anteriores...');
    
    const created = await Prospecto.insertMany(prospectos);
    console.log(`✅ ${created.length} prospectos creados:`);
    
    created.forEach((p, i) => {
      console.log(`   ${i+1}. ${p.nombre} - ${p.etapa}`);
    });
    
    console.log('\n🎯 Prospectos listos para probar el sistema!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}, 2000);
