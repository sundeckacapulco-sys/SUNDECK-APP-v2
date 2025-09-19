const mongoose = require('mongoose');
const Producto = require('./server/models/Producto');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const productosSundeck = [
  // === PERSIANAS ENROLLABLES ===
  {
    nombre: 'Persiana Enrollable Screen 1%',
    codigo: 'PER-SCR-001',
    descripcion: 'Persiana enrollable screen 1% apertura, máxima privacidad',
    categoria: 'ventana',
    subcategoria: 'enrollable',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: 850,
    configuracionUnidad: {
      requiereMedidas: true,
      calculoPorArea: true,
      minimoVenta: 0.5,
      incremento: 0.1
    },
    coloresDisponibles: ['Blanco', 'Gris', 'Beige', 'Negro'],
    tiempoFabricacion: { base: 5, porM2Adicional: 0.5 },
    reglas: [{ condicion: 'alto > 2.5', accion: 'requiere_refuerzo_R24', costoAdicional: 200, tiempoAdicional: 1 }],
    activo: true, disponible: true,
    tags: ['persiana', 'screen', '1%', 'enrollable', 'privacidad']
  },
  {
    nombre: 'Persiana Enrollable Screen 3%',
    codigo: 'PER-SCR-003',
    descripcion: 'Persiana enrollable screen 3% apertura, balance perfecto luz/privacidad',
    categoria: 'ventana',
    subcategoria: 'enrollable',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: 750,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: true, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Blanco', 'Gris', 'Beige', 'Café'],
    tiempoFabricacion: { base: 5, porM2Adicional: 0.5 },
    reglas: [{ condicion: 'alto > 2.5', accion: 'requiere_refuerzo_R24', costoAdicional: 200, tiempoAdicional: 1 }],
    activo: true, disponible: true,
    tags: ['persiana', 'screen', '3%', 'enrollable', 'popular']
  },
  {
    nombre: 'Persiana Enrollable Screen 5%',
    codigo: 'PER-SCR-005',
    descripcion: 'Persiana enrollable screen 5% apertura, máxima entrada de luz',
    categoria: 'ventana',
    subcategoria: 'enrollable',
    material: 'aluminio',
    unidadMedida: 'm2',
    precioBase: 680,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: true, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Blanco', 'Gris', 'Beige'],
    tiempoFabricacion: { base: 5, porM2Adicional: 0.5 },
    reglas: [{ condicion: 'alto > 2.5', accion: 'requiere_refuerzo_R24', costoAdicional: 200, tiempoAdicional: 1 }],
    activo: true, disponible: true,
    tags: ['persiana', 'screen', '5%', 'enrollable', 'luminosa']
  },

  // === CORTINAS BLACKOUT ===
  {
    nombre: 'Cortina Blackout Premium',
    codigo: 'COR-BLK-001',
    descripcion: 'Cortina blackout premium que bloquea 100% la luz exterior',
    categoria: 'ventana',
    subcategoria: 'blackout',
    material: 'tela',
    unidadMedida: 'm2',
    precioBase: 950,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: true, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Negro', 'Gris Oscuro', 'Azul Marino', 'Café Oscuro'],
    tiempoFabricacion: { base: 7, porM2Adicional: 0.5 },
    activo: true, disponible: true,
    tags: ['cortina', 'blackout', 'premium', '100%', 'recamara']
  },
  {
    nombre: 'Cortina Blackout Económica',
    codigo: 'COR-BLK-002',
    descripcion: 'Cortina blackout económica, excelente relación calidad-precio',
    categoria: 'ventana',
    subcategoria: 'blackout',
    material: 'tela',
    unidadMedida: 'm2',
    precioBase: 650,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: true, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Negro', 'Gris', 'Beige'],
    tiempoFabricacion: { base: 5, porM2Adicional: 0.5 },
    activo: true, disponible: true,
    tags: ['cortina', 'blackout', 'economica', 'basica']
  },

  // === MOTORES ESPECÍFICOS ===
  {
    nombre: 'Motor Somfy RTS 20Nm',
    codigo: 'MOT-SOM-020',
    descripcion: 'Motor tubular Somfy RTS 20Nm con control remoto incluido',
    categoria: 'motor',
    subcategoria: 'somfy',
    material: 'aluminio',
    unidadMedida: 'pieza',
    precioBase: 3200,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco'],
    tiempoFabricacion: { base: 3, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['motor', 'somfy', 'rts', '20nm', 'premium']
  },
  {
    nombre: 'Motor Genérico 30Nm',
    codigo: 'MOT-GEN-030',
    descripcion: 'Motor tubular genérico 30Nm, excelente calidad-precio',
    categoria: 'motor',
    subcategoria: 'generico',
    material: 'aluminio',
    unidadMedida: 'pieza',
    precioBase: 2800,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Gris'],
    tiempoFabricacion: { base: 2, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['motor', 'generico', '30nm', 'economico']
  },

  // === CONTROLES Y AUTOMATIZACIÓN ===
  {
    nombre: 'Control Remoto Somfy Telis 1',
    codigo: 'CTL-SOM-001',
    descripcion: 'Control remoto Somfy Telis 1 canal, original',
    categoria: 'control',
    subcategoria: 'somfy',
    material: 'plastico',
    unidadMedida: 'pieza',
    precioBase: 650,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Negro'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['control', 'somfy', 'telis', '1canal', 'original']
  },
  {
    nombre: 'Control Remoto Genérico 433MHz',
    codigo: 'CTL-GEN-433',
    descripcion: 'Control remoto genérico 433MHz, compatible con mayoría de motores',
    categoria: 'control',
    subcategoria: 'generico',
    material: 'plastico',
    unidadMedida: 'pieza',
    precioBase: 280,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Negro'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['control', 'generico', '433mhz', 'compatible']
  },

  // === GALERÍAS Y RIELES ===
  {
    nombre: 'Galería Aluminio Sencilla',
    codigo: 'GAL-ALU-001',
    descripcion: 'Galería de aluminio sencilla para cortinas tradicionales',
    categoria: 'galeria',
    subcategoria: 'sencilla',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 120,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: false, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Aluminio Natural', 'Blanco', 'Negro'],
    tiempoFabricacion: { base: 2, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['galeria', 'aluminio', 'sencilla', 'cortina']
  },
  {
    nombre: 'Galería Aluminio Doble',
    codigo: 'GAL-ALU-002',
    descripcion: 'Galería de aluminio doble para cortina + blackout',
    categoria: 'galeria',
    subcategoria: 'doble',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 180,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: false, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Aluminio Natural', 'Blanco', 'Negro'],
    tiempoFabricacion: { base: 3, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['galeria', 'aluminio', 'doble', 'cortina', 'blackout']
  },

  // === CANALETAS Y GUÍAS ===
  {
    nombre: 'Canaleta Lateral Enrollable',
    codigo: 'CAN-LAT-001',
    descripcion: 'Canaleta lateral con felpa para persiana enrollable',
    categoria: 'canaleta',
    subcategoria: 'lateral',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 85,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: false, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Blanco', 'Gris', 'Negro', 'Bronce'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['canaleta', 'lateral', 'felpa', 'enrollable']
  },
  {
    nombre: 'Canaleta Superior Cajón',
    codigo: 'CAN-SUP-001',
    descripcion: 'Canaleta superior tipo cajón para persiana enrollable',
    categoria: 'canaleta',
    subcategoria: 'superior',
    material: 'aluminio',
    unidadMedida: 'ml',
    precioBase: 95,
    configuracionUnidad: { requiereMedidas: true, calculoPorArea: false, minimoVenta: 0.5, incremento: 0.1 },
    coloresDisponibles: ['Blanco', 'Gris', 'Negro'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['canaleta', 'superior', 'cajon', 'enrollable']
  },

  // === HERRAJES Y ACCESORIOS ===
  {
    nombre: 'Soporte Galería Pared',
    codigo: 'HER-SOP-001',
    descripcion: 'Soporte de pared para galería, incluye tornillos',
    categoria: 'herraje',
    subcategoria: 'soporte',
    material: 'acero',
    unidadMedida: 'par',
    precioBase: 45,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Negro', 'Cromado'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['herraje', 'soporte', 'pared', 'galeria']
  },
  {
    nombre: 'Soporte Galería Techo',
    codigo: 'HER-SOP-002',
    descripcion: 'Soporte de techo para galería, incluye tornillos',
    categoria: 'herraje',
    subcategoria: 'soporte',
    material: 'acero',
    unidadMedida: 'par',
    precioBase: 55,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Negro', 'Cromado'],
    tiempoFabricacion: { base: 1, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['herraje', 'soporte', 'techo', 'galeria']
  },

  // === KITS COMPLETOS ===
  {
    nombre: 'Kit Persiana Screen Completo',
    codigo: 'KIT-SCR-001',
    descripcion: 'Kit completo persiana screen: tela, motor, controles, instalación',
    categoria: 'kit',
    subcategoria: 'persiana',
    material: 'mixto',
    unidadMedida: 'kit',
    precioBase: 4500,
    configuracionUnidad: { requiereMedidas: false, calculoPorArea: false, minimoVenta: 1, incremento: 1 },
    coloresDisponibles: ['Blanco', 'Gris', 'Beige'],
    tiempoFabricacion: { base: 7, porM2Adicional: 0 },
    activo: true, disponible: true,
    tags: ['kit', 'persiana', 'screen', 'completo', 'motor']
  }
];

async function seedProductosSundeck() {
  try {
    console.log('🏢 Iniciando seed de productos SUNDECK...\n');

    // Agregar productos sin eliminar los existentes
    const productosCreados = await Producto.insertMany(productosSundeck);
    console.log(`✅ ${productosCreados.length} productos SUNDECK agregados exitosamente\n`);

    // Mostrar resumen
    const resumen = {};
    productosCreados.forEach(producto => {
      if (!resumen[producto.categoria]) {
        resumen[producto.categoria] = 0;
      }
      resumen[producto.categoria]++;
    });

    console.log('📊 Productos SUNDECK agregados por categoría:');
    Object.entries(resumen).forEach(([categoria, cantidad]) => {
      console.log(`   ${categoria}: ${cantidad} productos`);
    });

    console.log('\n💰 Productos por rango de precio:');
    const rangos = {
      'Económicos ($0-$500)': 0,
      'Medios ($500-$1,500)': 0,
      'Premium ($1,500-$5,000)': 0,
      'Luxury ($5,000+)': 0
    };

    productosCreados.forEach(producto => {
      const precio = producto.precioBase;
      if (precio <= 500) rangos['Económicos ($0-$500)']++;
      else if (precio <= 1500) rangos['Medios ($500-$1,500)']++;
      else if (precio <= 5000) rangos['Premium ($1,500-$5,000)']++;
      else rangos['Luxury ($5,000+)']++;
    });

    Object.entries(rangos).forEach(([rango, cantidad]) => {
      console.log(`   ${rango}: ${cantidad} productos`);
    });

    console.log('\n🎯 Productos más populares agregados:');
    console.log('   • Persiana Screen 3% - $750/m² (más vendida)');
    console.log('   • Motor Genérico 30Nm - $2,800/pieza');
    console.log('   • Galería Aluminio Doble - $180/m.l.');
    console.log('   • Kit Persiana Completo - $4,500/kit');

    console.log('\n🎉 ¡Catálogo SUNDECK listo para usar!');

  } catch (error) {
    console.error('❌ Error agregando productos SUNDECK:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar seed
seedProductosSundeck();
