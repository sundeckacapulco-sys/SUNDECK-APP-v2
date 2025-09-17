const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modelo de Usuario
const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { 
    type: String, 
    enum: ['admin', 'gerente', 'vendedor', 'coordinador'], 
    default: 'vendedor' 
  },
  activo: { type: Boolean, default: true },
  permisos: {
    prospectos: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    cotizaciones: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    pedidos: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    fabricacion: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    instalaciones: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    postventa: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    usuarios: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean },
    reportes: { leer: Boolean, crear: Boolean, actualizar: Boolean, eliminar: Boolean }
  }
}, {
  timestamps: true
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe el admin
    const adminExistente = await Usuario.findOne({ email: 'admin@sundeck.com' });
    
    if (adminExistente) {
      console.log('✅ Usuario admin ya existe');
      process.exit(0);
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('password', 12);
    
    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sundeck',
      email: 'admin@sundeck.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      permisos: {
        prospectos: { leer: true, crear: true, actualizar: true, eliminar: true },
        cotizaciones: { leer: true, crear: true, actualizar: true, eliminar: true },
        pedidos: { leer: true, crear: true, actualizar: true, eliminar: true },
        fabricacion: { leer: true, crear: true, actualizar: true, eliminar: true },
        instalaciones: { leer: true, crear: true, actualizar: true, eliminar: true },
        postventa: { leer: true, crear: true, actualizar: true, eliminar: true },
        usuarios: { leer: true, crear: true, actualizar: true, eliminar: true },
        reportes: { leer: true, crear: true, actualizar: true, eliminar: true }
      }
    });

    await admin.save();
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@sundeck.com');
    console.log('🔑 Password: password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando admin:', error);
    process.exit(1);
  }
}

createAdmin();
