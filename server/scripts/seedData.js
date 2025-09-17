const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Prospecto = require('../models/Prospecto');
const Plantilla = require('../models/Plantilla');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Clear existing data
    await Usuario.deleteMany({});
    await Producto.deleteMany({});
    await Prospecto.deleteMany({});
    await Plantilla.deleteMany({});
    console.log('🗑️ Datos anteriores eliminados');

    // Create admin user
    const adminUser = new Usuario({
      nombre: 'Administrador',
      apellido: 'Sistema',
      email: 'admin@sundeck.com',
      password: 'password',
      rol: 'admin',
      telefono: '555-0001',
      permisos: [
        {
          modulo: 'prospectos',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'cotizaciones',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'pedidos',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'fabricacion',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'instalaciones',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'postventa',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        },
        {
          modulo: 'reportes',
          acciones: ['leer', 'exportar']
        },
        {
          modulo: 'usuarios',
          acciones: ['crear', 'leer', 'actualizar', 'eliminar']
        }
      ]
    });
    await adminUser.save();

    // Create sample users
    const vendedor1 = new Usuario({
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'carlos@sundeck.com',
      password: 'password123',
      rol: 'vendedor',
      telefono: '555-0002',
      permisos: [
        {
          modulo: 'prospectos',
          acciones: ['crear', 'leer', 'actualizar']
        },
        {
          modulo: 'cotizaciones',
          acciones: ['crear', 'leer', 'actualizar']
        }
      ]
    });
    await vendedor1.save();

    const vendedor2 = new Usuario({
      nombre: 'Ana',
      apellido: 'García',
      email: 'ana@sundeck.com',
      password: 'password123',
      rol: 'vendedor',
      telefono: '555-0003',
      permisos: [
        {
          modulo: 'prospectos',
          acciones: ['crear', 'leer', 'actualizar']
        },
        {
          modulo: 'cotizaciones',
          acciones: ['crear', 'leer', 'actualizar']
        }
      ]
    });
    await vendedor2.save();

    console.log('👥 Usuarios creados');

    // Create sample products
    const productos = [
      {
        nombre: 'Ventana Corrediza Aluminio',
        codigo: 'VCA-001',
        descripcion: 'Ventana corrediza de aluminio con cristal claro de 6mm',
        categoria: 'ventana',
        material: 'aluminio',
        coloresDisponibles: ['blanco', 'negro', 'café', 'natural'],
        tiposCristal: ['claro', 'bronce', 'azul', 'reflectivo'],
        herrajesDisponibles: ['estándar', 'premium'],
        precioBase: 1200,
        unidadMedida: 'm2',
        costoMaterial: 800,
        costoManoObra: 200,
        margenGanancia: 25,
        dimensiones: {
          anchoMinimo: 0.6,
          anchoMaximo: 3.0,
          altoMinimo: 0.6,
          altoMaximo: 2.8
        },
        tiempoFabricacion: {
          base: 10,
          porM2Adicional: 2
        },
        reglas: [
          {
            condicion: 'alto > 2.5',
            accion: 'requiere_refuerzo_R24',
            costoAdicional: 200,
            tiempoAdicional: 2
          }
        ],
        garantia: {
          fabricacion: 12,
          instalacion: 6
        },
        requiereInstalacion: true,
        popularidad: 85,
        vecesVendido: 150
      },
      {
        nombre: 'Puerta Abatible Aluminio',
        codigo: 'PAA-001',
        descripcion: 'Puerta abatible de aluminio con cristal templado',
        categoria: 'puerta',
        material: 'aluminio',
        coloresDisponibles: ['blanco', 'negro', 'café'],
        tiposCristal: ['templado', 'laminado'],
        herrajesDisponibles: ['cerradura estándar', 'cerradura premium', 'manija europea'],
        precioBase: 2500,
        unidadMedida: 'pieza',
        costoMaterial: 1800,
        costoManoObra: 400,
        margenGanancia: 15,
        dimensiones: {
          anchoMinimo: 0.8,
          anchoMaximo: 1.2,
          altoMinimo: 2.0,
          altoMaximo: 2.4
        },
        tiempoFabricacion: {
          base: 15,
          porM2Adicional: 0
        },
        garantia: {
          fabricacion: 12,
          instalacion: 6
        },
        requiereInstalacion: true,
        popularidad: 70,
        vecesVendido: 89
      },
      {
        nombre: 'Cancel de Baño Templado',
        codigo: 'CBT-001',
        descripcion: 'Cancel de baño en cristal templado con perfiles de aluminio',
        categoria: 'cancel',
        material: 'aluminio',
        coloresDisponibles: ['natural', 'blanco'],
        tiposCristal: ['templado claro', 'templado esmerilado'],
        herrajesDisponibles: ['bisagras estándar', 'bisagras premium'],
        precioBase: 1800,
        unidadMedida: 'm2',
        costoMaterial: 1200,
        costoManoObra: 300,
        margenGanancia: 20,
        dimensiones: {
          anchoMinimo: 0.8,
          anchoMaximo: 2.0,
          altoMinimo: 1.8,
          altoMaximo: 2.2
        },
        tiempoFabricacion: {
          base: 12,
          porM2Adicional: 1
        },
        garantia: {
          fabricacion: 12,
          instalacion: 6
        },
        requiereInstalacion: true,
        popularidad: 60,
        vecesVendido: 45
      },
      {
        nombre: 'Domo Acrílico',
        codigo: 'DA-001',
        descripcion: 'Domo acrílico transparente para iluminación natural',
        categoria: 'domo',
        material: 'acero',
        coloresDisponibles: ['natural'],
        tiposCristal: ['acrílico transparente', 'acrílico translúcido'],
        precioBase: 3500,
        unidadMedida: 'pieza',
        costoMaterial: 2500,
        costoManoObra: 600,
        margenGanancia: 12,
        dimensiones: {
          anchoMinimo: 1.0,
          anchoMaximo: 3.0,
          altoMinimo: 1.0,
          altoMaximo: 3.0
        },
        tiempoFabricacion: {
          base: 20,
          porM2Adicional: 3
        },
        garantia: {
          fabricacion: 24,
          instalacion: 12
        },
        requiereInstalacion: true,
        popularidad: 40,
        vecesVendido: 25
      }
    ];

    await Producto.insertMany(productos);
    console.log('🏗️ Productos creados');

    // Create sample prospects
    const prospectos = [
      {
        nombre: 'Juan Pérez',
        telefono: '555-1001',
        email: 'juan.perez@email.com',
        direccion: {
          calle: 'Av. Principal 123',
          colonia: 'Centro',
          ciudad: 'Acapulco',
          codigoPostal: '39300',
          referencias: 'Casa azul, portón blanco'
        },
        producto: 'Ventanas para sala y comedor',
        tipoProducto: 'ventana',
        descripcionNecesidad: 'Necesita cambiar 4 ventanas de la sala y comedor por ventanas de aluminio',
        presupuestoEstimado: 15000,
        fechaCita: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // En 2 días
        horaCita: '10:00',
        etapa: 'cita_agendada',
        fuente: 'facebook',
        prioridad: 'alta',
        vendedorAsignado: vendedor1._id,
        fechaProximoSeguimiento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        calificacion: {
          interes: 4,
          presupuesto: 4,
          urgencia: 3,
          autoridad: 5
        },
        motivoCompra: 'Renovación de la casa'
      },
      {
        nombre: 'María González',
        telefono: '555-1002',
        email: 'maria.gonzalez@email.com',
        direccion: {
          calle: 'Calle Flores 456',
          colonia: 'Las Flores',
          ciudad: 'Acapulco',
          codigoPostal: '39350'
        },
        producto: 'Cancel de baño',
        tipoProducto: 'cancel',
        descripcionNecesidad: 'Cancel para baño principal, cristal esmerilado',
        presupuestoEstimado: 8000,
        etapa: 'contactado',
        fuente: 'referido',
        referidoPor: 'Juan Pérez',
        prioridad: 'media',
        vendedorAsignado: vendedor2._id,
        fechaProximoSeguimiento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        calificacion: {
          interes: 3,
          presupuesto: 3,
          urgencia: 2,
          autoridad: 4
        }
      },
      {
        nombre: 'Roberto Silva',
        telefono: '555-1003',
        direccion: {
          calle: 'Av. Costera 789',
          colonia: 'Zona Dorada',
          ciudad: 'Acapulco',
          codigoPostal: '39390'
        },
        producto: 'Puerta principal',
        tipoProducto: 'puerta',
        descripcionNecesidad: 'Puerta de entrada principal con cristal templado',
        presupuestoEstimado: 12000,
        etapa: 'nuevo',
        fuente: 'web',
        prioridad: 'media',
        vendedorAsignado: vendedor1._id,
        fechaProximoSeguimiento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        motivoCompra: 'Seguridad y estética'
      },
      {
        nombre: 'Ana Martínez',
        telefono: '555-1004',
        email: 'ana.martinez@email.com',
        direccion: {
          calle: 'Calle Palmeras 321',
          colonia: 'Palmeras',
          ciudad: 'Acapulco',
          codigoPostal: '39370'
        },
        producto: 'Domo para cocina',
        tipoProducto: 'domo',
        descripcionNecesidad: 'Domo acrílico para iluminación natural en cocina',
        presupuestoEstimado: 5000,
        etapa: 'cotizacion',
        fuente: 'instagram',
        prioridad: 'baja',
        vendedorAsignado: vendedor2._id,
        fechaProximoSeguimiento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        calificacion: {
          interes: 3,
          presupuesto: 2,
          urgencia: 1,
          autoridad: 3
        }
      },
      {
        nombre: 'Luis Hernández',
        telefono: '555-1005',
        direccion: {
          calle: 'Av. Universidad 654',
          colonia: 'Universidad',
          ciudad: 'Acapulco',
          codigoPostal: '39340'
        },
        producto: 'Ventanas completas casa',
        tipoProducto: 'ventana',
        descripcionNecesidad: 'Cambio completo de ventanas de casa de 2 pisos',
        presupuestoEstimado: 45000,
        etapa: 'pedido',
        fuente: 'referido',
        prioridad: 'urgente',
        vendedorAsignado: vendedor1._id,
        fechaProximoSeguimiento: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        calificacion: {
          interes: 5,
          presupuesto: 5,
          urgencia: 4,
          autoridad: 5
        },
        motivoCompra: 'Construcción nueva'
      }
    ];

    await Prospecto.insertMany(prospectos);
    console.log('👥 Prospectos de ejemplo creados');

    // Create sample WhatsApp templates
    const plantillas = [
      {
        nombre: 'Saludo Inicial',
        descripcion: 'Mensaje de primer contacto con nuevos prospectos',
        texto: 'Hola {nombre}, gracias por contactarnos. Vi que estás interesado en {producto}. Me gustaría agendar una cita para conocer mejor tus necesidades. ¿Cuándo te vendría bien que te visitemos?',
        categoria: 'whatsapp',
        creador: adminUser._id,
        variables: [
          { nombre: 'nombre', descripcion: 'Nombre del prospecto' },
          { nombre: 'producto', descripcion: 'Producto de interés' }
        ]
      },
      {
        nombre: 'Seguimiento Post-Cita',
        descripcion: 'Mensaje después de visita o cita',
        texto: 'Hola {nombre}, fue un placer conocerte y platicar sobre {producto}. Como acordamos, te envío la cotización. ¿Tienes alguna pregunta al respecto?',
        categoria: 'whatsapp',
        creador: adminUser._id,
        variables: [
          { nombre: 'nombre', descripcion: 'Nombre del prospecto' },
          { nombre: 'producto', descripcion: 'Producto cotizado' }
        ]
      },
      {
        nombre: 'Confirmación de Pedido',
        descripcion: 'Confirmar pedido y proceso de fabricación',
        texto: '¡Excelente {nombre}! Ya tenemos tu pedido de {producto} en proceso. Te estaré informando sobre el avance. Tiempo estimado: 15 días. ¡Gracias por confiar en Sundeck! 🏗️',
        categoria: 'whatsapp',
        creador: adminUser._id,
        variables: [
          { nombre: 'nombre', descripcion: 'Nombre del cliente' },
          { nombre: 'producto', descripcion: 'Producto pedido' }
        ]
      },
      {
        nombre: 'Recordatorio de Cita',
        descripcion: 'Recordar cita programada',
        texto: 'Hola {nombre}, te recuerdo nuestra cita para mañana {fecha} a las {hora} para revisar {producto}. ¿Confirmas que nos vemos? 📅',
        categoria: 'whatsapp',
        creador: adminUser._id,
        variables: [
          { nombre: 'nombre', descripcion: 'Nombre del prospecto' },
          { nombre: 'fecha', descripcion: 'Fecha de la cita' },
          { nombre: 'hora', descripcion: 'Hora de la cita' },
          { nombre: 'producto', descripcion: 'Producto a revisar' }
        ]
      },
      {
        nombre: 'Promoción Especial',
        descripcion: 'Mensaje promocional con descuento',
        texto: '🎉 ¡{nombre}, tenemos una promoción especial! 15% de descuento en {producto} válido hasta fin de mes. ¿Te interesa que preparemos tu cotización con el descuento?',
        categoria: 'whatsapp',
        creador: adminUser._id,
        variables: [
          { nombre: 'nombre', descripcion: 'Nombre del prospecto' },
          { nombre: 'producto', descripcion: 'Producto en promoción' }
        ]
      }
    ];

    await Plantilla.insertMany(plantillas);
    console.log('📝 Plantillas de WhatsApp creadas');

    console.log('\n🎉 Datos de ejemplo creados exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('Email: admin@sundeck.com');
    console.log('Password: password');
    console.log('\n🔗 Accede al sistema en: http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando datos de ejemplo:', error);
    process.exit(1);
  }
};

seedData();
