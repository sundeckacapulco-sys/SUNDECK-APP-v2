const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Definir esquema simple
    const userSchema = new mongoose.Schema({
      nombre: String,
      apellido: String,
      email: String,
      password: String,
      rol: String,
      activo: Boolean,
      permisos: [{
        modulo: String,
        acciones: [String]
      }]
    }, { timestamps: true });

    const Usuario = mongoose.model('Usuario', userSchema);

    // Eliminar admin existente
    await Usuario.deleteMany({ email: 'admin@sundeck.com' });
    console.log('🗑️ Admin anterior eliminado');

    // Crear password hash
    const hashedPassword = await bcrypt.hash('password', 12);

    // Crear nuevo admin
    const admin = new Usuario({
      nombre: 'Admin',
      apellido: 'Sundeck',
      email: 'admin@sundeck.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true,
      permisos: [
        { modulo: 'prospectos', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
        { modulo: 'cotizaciones', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
        { modulo: 'pedidos', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] },
        { modulo: 'usuarios', acciones: ['crear', 'leer', 'actualizar', 'eliminar'] }
      ]
    });

    await admin.save();
    console.log('✅ Usuario admin creado exitosamente');
    console.log('📧 Email: admin@sundeck.com');
    console.log('🔑 Password: password');

    // Verificar que se creó
    const verificar = await Usuario.findOne({ email: 'admin@sundeck.com' });
    console.log('🔍 Verificación:', verificar ? 'Usuario encontrado' : 'Usuario NO encontrado');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
