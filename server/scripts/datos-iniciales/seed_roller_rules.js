const mongoose = require('mongoose');
const ConfiguracionMateriales = require('../models/ConfiguracionMateriales');

async function seedRollerRules() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('Conectado a MongoDB');

    const materiales = [
      // 1. TELAS
      {
        tipo: 'Tela',
        descripcion: 'Tela - Sin Galería',
        formula: 'alto + 0.25',
        unidad: 'ml',
        condicion: '!galeriaActiva && !rotada',
        observaciones: 'Tela estándar sin galería',
        activo: true
      },
      {
        tipo: 'Tela',
        descripcion: 'Tela - Con Galería',
        formula: 'alto + 0.50',
        unidad: 'ml',
        condicion: 'galeriaActiva && !rotada',
        observaciones: 'Tela con galería (requiere más altura)',
        activo: true
      },
      {
        tipo: 'Tela',
        descripcion: 'Tela - Rotada Sin Galería',
        formula: 'ancho + 0.25',
        unidad: 'ml',
        condicion: 'rotada && !galeriaActiva',
        observaciones: 'Tela rotada sin galería',
        activo: true
      },
      {
        tipo: 'Tela',
        descripcion: 'Tela - Rotada Con Galería',
        formula: 'ancho + 0.50',
        unidad: 'ml',
        condicion: 'rotada && galeriaActiva',
        observaciones: 'Tela rotada con galería',
        activo: true
      },

      // 2. TUBOS
      {
        tipo: 'Tubo',
        descripcion: 'Tubo enrollable',
        formula: 'ancho - 0.03',
        unidad: 'ml', // User said 'm', system uses 'ml' for length
        condicion: 'true', // Aplica siempre para Roller (manual o motorizado)
        observaciones: 'Corte de tubo estándar',
        activo: true
      },

      // 3. CONTRAPESO
      {
        tipo: 'Contrapeso',
        descripcion: 'Contrapeso (ovalado o plano)',
        formula: 'ancho - 0.03',
        unidad: 'ml',
        condicion: 'true',
        observaciones: 'Contrapeso estándar',
        activo: true
      },

      // 4. ACCESORIOS
      {
        tipo: 'Cadena',
        descripcion: 'Cadena sin fin',
        formula: '(alto * 2) - 0.40', // Usually chain loop is (height * 2) - something? User said "alto - 0.40". Assuming Linear Meters of chain loop or drop? 
        // User said "Fórmula: alto - 0.40". If unit is 'm', maybe it's the drop length? 
        // I will stick to user formula EXACTLY: "alto - 0.40".
        unidad: 'ml', // 'm' in user request
        condicion: '!motorizado', // "tipoOperacion == 'manual'"
        observaciones: 'Solo para manuales',
        activo: true
      },
      {
        tipo: 'Tapas',
        descripcion: 'Tapas de tubo',
        formula: '1',
        unidad: 'juego',
        condicion: 'true',
        observaciones: 'Par de tapas',
        activo: true
      },
      {
        tipo: 'Tapas',
        descripcion: 'Tapas contrapeso',
        formula: '1',
        unidad: 'juego',
        condicion: 'true',
        observaciones: 'Par de tapas',
        activo: true
      }
    ];

    // Actualizar o Crear configuración "Roller Shade"
    await ConfiguracionMateriales.findOneAndUpdate(
      { sistema: 'Roller Shade' },
      {
        $set: {
          nombre: 'Configuración Oficial Roller Shade',
          producto: 'Enrollable',
          materiales: materiales,
          // Metadata de rotación y rollos (se usa en CalculadoraMaterialesService logic, pero lo guardamos aquí como referencia si es posible)
          // El schema tiene anchosRollo y alturaMaxRotacion
          anchosRollo: [2.50, 3.00], 
          alturaMaxRotacion: 2.80, // Base rule
          permiteTermosello: true,
          activo: true
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Reglas de materiales para Roller Shade actualizadas correctamente.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado');
  }
}

seedRollerRules();
