const mongoose = require('mongoose');
require('dotenv').config();

// Importar el modelo Usuario real
const Usuario = require('./server/models/Usuario');

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe el admin
    const adminExistente = await Usuario.findOne({ email: 'admin@sundeck.com' });
    
    if (adminExistente) {
      console.log('⚠️ Usuario admin ya existe, eliminándolo para recrear...');
      await Usuario.deleteOne({ email: 'admin@sundeck.com' });
    }

    // Crear usuario admin con la nueva estructura de permisos
    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sundeck',
      email: 'admin@sundeck.com',
      password: 'password', // El hook pre('save') se encargará del cifrado
      rol: 'admin',
      activo: true,
      permisos: [
        { modulo: 'prospectos', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'cotizaciones', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'pedidos', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'fabricacion', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'instalaciones', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'postventa', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'reportes', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'usuarios', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'configuracion', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] }
      ]
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
