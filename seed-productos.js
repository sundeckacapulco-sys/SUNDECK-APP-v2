const mongoose = require('mongoose');
const Producto = require('./server/models/Producto');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const productosEjemplo = [
  // MOTORES
  {
    nombre: 'Motor Tubular 20Nm',
    codigo: 'MOTOR-001',
    descripcion: 'Motor tubular para persianas enrollables hasta 20Nm de torque',
    categoria: 'motor',
    subcategoria: 'tubular',
    material: 'aluminio',
    unidadMedida: 'pieza',
    precioBase: 2500,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Gris'],
    tiempoFabricacion: {
      base: 3,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['motor', 'tubular', '20nm', 'enrollable']
  },
  {
    nombre: 'Motor Tubular 40Nm',
    codigo: 'MOTOR-002',
    descripcion: 'Motor tubular para persianas enrollables hasta 40Nm de torque',
    categoria: 'motor',
    subcategoria: 'tubular',
    material: 'aluminio',
    unidadMedida: 'pieza',
    precioBase: 3200,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Gris'],
    tiempoFabricacion: {
      base: 3,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['motor', 'tubular', '40nm', 'enrollable']
  },

  // CONTROLES
  {
    nombre: 'Control Remoto 1 Canal',
    codigo: 'CTRL-001',
    descripcion: 'Control remoto de 1 canal para motor tubular',
    categoria: 'control',
    subcategoria: 'remoto',
    material: 'plastico',
    unidadMedida: 'pieza',
    precioBase: 450,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Negro'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['control', 'remoto', '1canal', 'motor']
  },
  {
    nombre: 'Control Remoto 5 Canales',
    codigo: 'CTRL-002',
    descripcion: 'Control remoto de 5 canales para múltiples motores',
    categoria: 'control',
    subcategoria: 'remoto',
    material: 'plastico',
    unidadMedida: 'pieza',
    precioBase: 850,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Negro'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['control', 'remoto', '5canales', 'motor']
  },

  // KITS
  {
    nombre: 'Kit Toldo Retráctil 3x2m',
    codigo: 'KIT-001',
    descripcion: 'Kit completo para toldo retráctil de 3x2 metros, incluye estructura, lona y herrajes',
    categoria: 'kit',
    subcategoria: 'toldo',
    material: 'aluminio',
    unidadMedida: 'kit',
    precioBase: 8500,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Beige', 'Verde', 'Azul', 'Rojo'],
    tiempoFabricacion: {
      base: 7,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['kit', 'toldo', 'retractil', '3x2', 'completo']
  },
  {
    nombre: 'Kit Toldo Retráctil 4x3m',
    codigo: 'KIT-002',
    descripcion: 'Kit completo para toldo retráctil de 4x3 metros, incluye estructura, lona y herrajes',
    categoria: 'kit',
    subcategoria: 'toldo',
    material: 'aluminio',
    unidadMedida: 'kit',
    precioBase: 12500,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Beige', 'Verde', 'Azul', 'Rojo'],
    tiempoFabricacion: {
      base: 10,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['kit', 'toldo', 'retractil', '4x3', 'completo']
  },

  // GALERÍAS (Metro lineal)
  {
    nombre: 'Galería Aluminio Natural',
    codigo: 'GAL-001',
    descripcion: 'Galería de aluminio natural para cortinas y persianas',
    categoria: 'galeria',
    subcategoria: 'aluminio',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 180,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: false,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Aluminio Natural', 'Blanco', 'Negro', 'Bronce'],
    tiempoFabricacion: {
      base: 2,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['galeria', 'aluminio', 'cortina', 'persiana']
  },
  {
    nombre: 'Galería Doble Aluminio',
    codigo: 'GAL-002',
    descripcion: 'Galería doble de aluminio para cortinas con doble función',
    categoria: 'galeria',
    subcategoria: 'doble',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 280,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: false,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Aluminio Natural', 'Blanco', 'Negro'],
    tiempoFabricacion: {
      base: 3,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['galeria', 'doble', 'aluminio', 'cortina']
  },

  // CANALETAS (Metro lineal)
  {
    nombre: 'Canaleta Lateral con Felpa Blanco',
    codigo: 'CAN-001',
    descripcion: 'Canaleta lateral con felpa para enrollable, color blanco',
    categoria: 'canaleta',
    subcategoria: 'lateral',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 120,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: false,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Blanco', 'Gris', 'Negro', 'Bronce'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['canaleta', 'lateral', 'felpa', 'enrollable']
  },
  {
    nombre: 'Canaleta Superior Enrollable',
    codigo: 'CAN-002',
    descripcion: 'Canaleta superior para persiana enrollable',
    categoria: 'canaleta',
    subcategoria: 'superior',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 95,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: false,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Blanco', 'Gris', 'Negro'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['canaleta', 'superior', 'enrollable']
  },

  // HERRAJES
  {
    nombre: 'Soporte de Pared Reforzado',
    codigo: 'HER-001',
    descripcion: 'Soporte de pared reforzado para galerías pesadas',
    categoria: 'herraje',
    subcategoria: 'soporte',
    material: 'acero',
    unidadMedida: 'par',
    precioBase: 85,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Negro', 'Cromado'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['herraje', 'soporte', 'pared', 'reforzado']
  },
  {
    nombre: 'Juego de Poleas para Cortina',
    codigo: 'HER-002',
    descripcion: 'Juego completo de poleas para sistema de cortina tradicional',
    categoria: 'herraje',
    subcategoria: 'polea',
    material: 'plastico',
    unidadMedida: 'juego',
    precioBase: 65,
    configuracionUnidad: {
      requiereMedidas: false,
      calculoPorArea: false,
      minimoVenta: 1,
      incremento: 1
    },
    coloresDisponibles: ['Blanco', 'Gris'],
    tiempoFabricacion: {
      base: 1,
      porM2Adicional: 0
    },
    activo: true,
    disponible: true,
    tags: ['herraje', 'polea', 'cortina', 'juego']
  },

  // PRODUCTOS TRADICIONALES (m²)
  {
    nombre: 'Persiana Screen 3% Blanco',
    codigo: 'PER-001',
    descripcion: 'Persiana enrollable screen 3% apertura, color blanco',
    categoria: 'ventana',
    subcategoria: 'enrollable',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: 750,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: true,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Blanco', 'Gris', 'Beige'],
    tiempoFabricacion: {
      base: 5,
      porM2Adicional: 0.5
    },
    reglas: [{
      condicion: 'alto > 2.5',
      accion: 'requiere_refuerzo_R24',
      costoAdicional: 200,
      tiempoAdicional: 1
    }],
    activo: true,
    disponible: true,
    tags: ['persiana', 'screen', '3%', 'enrollable']
  },
  {
    nombre: 'Cortina Blackout Premium',
    codigo: 'COR-001',
    descripcion: 'Cortina blackout premium que bloquea 100% la luz',
    categoria: 'ventana',
    subcategoria: 'blackout',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: 950,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: true,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Negro', 'Gris Oscuro', 'Azul Marino'],
    tiempoFabricacion: {
      base: 7,
      porM2Adicional: 0.5
    },
    activo: true,
    disponible: true,
    tags: ['cortina', 'blackout', 'premium', '100%']
  }
];

async function seedProductos() {
  try {
    console.log('🌱 Iniciando seed de productos...\n');

    // Limpiar productos existentes
    await Producto.deleteMany({});
    console.log('🗑️ Productos existentes eliminados');

    // Insertar productos de ejemplo
    const productosCreados = await Producto.insertMany(productosEjemplo);
    console.log(`✅ ${productosCreados.length} productos creados exitosamente\n`);

    // Mostrar resumen por categoría
    const resumen = {};
    productosCreados.forEach(producto => {
      if (!resumen[producto.categoria]) {
        resumen[producto.categoria] = 0;
      }
      resumen[producto.categoria]++;
    });

    console.log('📊 Resumen por categoría:');
    Object.entries(resumen).forEach(([categoria, cantidad]) => {
      console.log(`   ${categoria}: ${cantidad} productos`);
    });

    console.log('\n🎯 Productos por unidad de medida:');
    const porUnidad = {};
    productosCreados.forEach(producto => {
      if (!porUnidad[producto.unidadMedida]) {
        porUnidad[producto.unidadMedida] = 0;
      }
      porUnidad[producto.unidadMedida]++;
    });

    Object.entries(porUnidad).forEach(([unidad, cantidad]) => {
      const etiquetas = {
        'm2': 'm² (Metro cuadrado)',
        'ml': 'm.l. (Metro lineal)',
        'pieza': 'Pieza',
        'par': 'Par',
        'juego': 'Juego',
        'kit': 'Kit'
      };
      console.log(`   ${etiquetas[unidad] || unidad}: ${cantidad} productos`);
    });

    console.log('\n💰 Rango de precios:');
    const precios = productosCreados.map(p => p.precioBase).sort((a, b) => a - b);
    console.log(`   Mínimo: $${precios[0].toLocaleString()}`);
    console.log(`   Máximo: $${precios[precios.length - 1].toLocaleString()}`);
    console.log(`   Promedio: $${Math.round(precios.reduce((a, b) => a + b, 0) / precios.length).toLocaleString()}`);

    console.log('\n🎉 ¡Seed de productos completado exitosamente!');
    console.log('\n📋 Ejemplos de uso:');
    console.log('   • Motores: Se venden por pieza, no requieren medidas');
    console.log('   • Controles: Se venden por pieza, precio fijo');
    console.log('   • Kits de toldo: Se venden por kit completo');
    console.log('   • Galerías: Se venden por metro lineal');
    console.log('   • Canaletas: Se venden por metro lineal');
    console.log('   • Herrajes: Se venden por par o juego');
    console.log('   • Persianas/Cortinas: Se venden por m², requieren medidas');

  } catch (error) {
    console.error('❌ Error en seed de productos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar seed
seedProductos();
