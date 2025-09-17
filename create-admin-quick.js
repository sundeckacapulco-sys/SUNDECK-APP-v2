const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Usar el modelo Usuario existente
    const Usuario = require('./server/models/Usuario');

    // Eliminar admin existente
    await Usuario.deleteOne({ email: 'admin@sundeck.com' });
    
    // Crear nuevo admin (el modelo se encarga del hasheo automáticamente)
    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sundeck',
      email: 'admin@sundeck.com',
      password: 'password', // Texto plano - el hook pre('save') lo hasheará
      rol: 'admin',
      activo: true,
      permisos: [
        { modulo: 'prospectos', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'cotizaciones', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'pedidos', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'fabricacion', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'instalaciones', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'postventa', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'usuarios', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'reportes', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] },
        { modulo: 'configuracion', acciones: ['crear', 'leer', 'actualizar', 'eliminar', 'exportar'] }
      ]
    });

    await admin.save();
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@sundeck.com');
    console.log('🔑 Password: password');
    
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
