/**
 * Script para crear un usuario de prueba
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String, unique: true },
  password: String,
  rol: String,
  activo: Boolean
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

async function crearUsuario() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    console.log('✅ Conectado a MongoDB\n');

    // Verificar si ya existe
    const existente = await Usuario.findOne({ email: 'admin@sundeck.com' });
    if (existente) {
      console.log('⚠️  El usuario admin@sundeck.com ya existe');
      console.log('   Email: admin@sundeck.com');
      console.log('   Password: admin123\n');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const usuario = new Usuario({
      nombre: 'Admin',
      apellido: 'Sundeck',
      email: 'admin@sundeck.com',
      password: hashedPassword,
      rol: 'admin',
      activo: true
    });

    await usuario.save();

    console.log('✅ Usuario creado exitosamente\n');
    console.log('📧 Email: admin@sundeck.com');
    console.log('🔑 Password: admin123');
    console.log('\n💡 Usa estas credenciales para iniciar sesión en http://localhost:3000\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

crearUsuario();
