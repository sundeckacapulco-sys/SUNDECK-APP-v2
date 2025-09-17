const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm')
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    
    // Modelo Usuario
    const Usuario = mongoose.model('Usuario', new mongoose.Schema({
      nombre: String,
      apellido: String,
      email: { type: String, unique: true },
      password: String,
      rol: { type: String, default: 'admin' },
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
    }, { timestamps: true }));

    // Eliminar admin existente
    await Usuario.deleteOne({ email: 'admin@sundeck.com' });
    
    // Crear nuevo admin
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
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
