const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function verifyUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    const Usuario = mongoose.model('Usuario', new mongoose.Schema({
      nombre: String,
      apellido: String,
      email: String,
      password: String,
      rol: String,
      activo: Boolean
    }, { timestamps: true }));

    const admin = await Usuario.findOne({ email: 'admin@sundeck.com' });
    
    if (!admin) {
      console.log('❌ Usuario admin NO encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:');
    console.log('📧 Email:', admin.email);
    console.log('👤 Nombre:', admin.nombre, admin.apellido);
    console.log('🔑 Rol:', admin.rol);
    console.log('✅ Activo:', admin.activo);

    // Probar password
    const passwordTest = await bcrypt.compare('password', admin.password);
    console.log('🔐 Password válido:', passwordTest ? 'SÍ' : 'NO');

    if (!passwordTest) {
      console.log('🔧 Actualizando password...');
      const newHash = await bcrypt.hash('password', 12);
      await Usuario.updateOne(
        { email: 'admin@sundeck.com' },
        { password: newHash }
      );
      console.log('✅ Password actualizado');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUser();
