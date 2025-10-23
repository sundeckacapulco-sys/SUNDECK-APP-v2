const mongoose = require('mongoose');
const ProyectoPedido = require('../models/ProyectoPedido');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');

async function crearProyectosPrueba() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Crear prospecto de prueba
    const prospecto = new Prospecto({
      nombre: 'Cliente Prueba Fabricación',
      telefono: '5512345678',
      email: 'fabricacion@prueba.com',
      direccion: {
        calle: 'Calle Fabricación 123',
        colonia: 'Industrial',
        ciudad: 'Ciudad de México'
      },
      estado: 'activo'
    });
    await prospecto.save();
    console.log('✅ Prospecto creado');

    // Crear cotización de prueba
    const cotizacion = new Cotizacion({
      prospecto: prospecto._id,
      numero: 'COT-2025-PRUEBA',
      productos: [{
        nombre: 'Persiana Enrollable',
        medidas: { ancho: 1.5, alto: 2.0, area: 3.0 },
        cantidad: 1,
        precioUnitario: 2500,
        subtotal: 2500
      }],
      subtotal: 2500,
      iva: 400,
      total: 2900,
      estado: 'aprobada'
    });
    await cotizacion.save();
    console.log('✅ Cotización creada');

    // Crear proyecto de prueba
    const proyectoData = {
        prospecto: prospecto._id,
        cotizacion: cotizacion._id,
        numero: 'PROY-2025-0001',
        creado_por: prospecto._id, // Usar el prospecto como creador por simplicidad
        cliente: {
          nombre: 'Cliente Prueba 1',
          telefono: '5512345678',
          email: 'cliente1@prueba.com',
          direccion: {
            calle: 'Calle Prueba 123',
            colonia: 'Colonia Centro',
            ciudad: 'Ciudad de México'
          }
        },
        estado: 'en_fabricacion',
        productos: [{
          nombre: 'Persiana Enrollable',
          descripcion: 'Persiana enrollable screen 5%',
          ubicacion: 'Sala principal',
          medidas: { ancho: 1.5, alto: 2.0, area: 3.0 },
          cantidad: 1,
          precioUnitario: 2500,
          subtotal: 2500
        }],
        cronograma: {
          fechaPedido: new Date(),
          fechaInicioFabricacion: new Date(),
          fechaFinFabricacionEstimada: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        },
        pagos: {
          montoTotal: 2900,
          subtotal: 2500,
          iva: 400
        },
        fabricacion: {
          estado: 'en_proceso',
          prioridad: 'alta',
          progreso: 50,
          materiales: [
            { nombre: 'Tela Screen 5%', cantidad: 3.5, unidad: 'm2', disponible: true, costo: 150 },
            { nombre: 'Perfil Aluminio', cantidad: 7, unidad: 'ml', disponible: true, costo: 80 }
          ],
          procesos: [
            {
              nombre: 'Corte de tela',
              descripcion: 'Cortar tela según medidas',
              orden: 1,
              tiempoEstimado: 2,
              estado: 'completado',
              fechaInicio: new Date(Date.now() - 24 * 60 * 60 * 1000),
              fechaFin: new Date()
            },
            {
              nombre: 'Armado',
              descripcion: 'Armar persiana',
              orden: 2,
              tiempoEstimado: 3,
              estado: 'en_proceso',
              fechaInicio: new Date()
            }
          ],
          costos: {
            materiales: 230,
            manoObra: 200,
            overhead: 70,
            total: 500
          }
        }
      },
      {
        numero: 'PROY-2025-0002',
        cliente: {
          nombre: 'Cliente Prueba 2',
          telefono: '5512345679',
          email: 'cliente2@prueba.com'
        },
        estado: 'confirmado',
        productos: [{
          nombre: 'Toldo Retráctil',
          descripcion: 'Toldo retráctil 3x2m',
          ubicacion: 'Terraza',
          medidas: { ancho: 3.0, alto: 2.0, area: 6.0 },
          cantidad: 1,
          precioUnitario: 4500,
          subtotal: 4500
        }],
        cronograma: {
          fechaPedido: new Date()
        },
        pagos: {
          montoTotal: 5220,
          subtotal: 4500,
          iva: 720
        }
      },
      {
        numero: 'PROY-2025-0003',
        cliente: {
          nombre: 'Cliente Prueba 3',
          telefono: '5512345680',
          email: 'cliente3@prueba.com'
        },
        estado: 'fabricado',
        productos: [{
          nombre: 'Cortina Roller',
          descripcion: 'Cortina roller blackout',
          ubicacion: 'Recámara principal',
          medidas: { ancho: 1.8, alto: 1.5, area: 2.7 },
          cantidad: 2,
          precioUnitario: 1800,
          subtotal: 3600
        }],
        cronograma: {
          fechaPedido: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          fechaInicioFabricacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          fechaFinFabricacionEstimada: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          fechaFinFabricacionReal: new Date()
        },
        pagos: {
          montoTotal: 4176,
          subtotal: 3600,
          iva: 576
        },
        fabricacion: {
          estado: 'terminado',
          prioridad: 'media',
          progreso: 100,
          controlCalidad: {
            realizado: true,
            fechaRevision: new Date(),
            resultado: 'aprobado',
            observaciones: 'Producto aprobado para entrega'
          },
          costos: {
            materiales: 400,
            manoObra: 300,
            overhead: 100,
            total: 800
          }
        }
      }
    ];

    // Insertar proyectos
    for (const proyectoData of proyectos) {
      const proyecto = new ProyectoPedido(proyectoData);
      await proyecto.save();
      console.log(`✅ Proyecto ${proyecto.numero} creado - Estado: ${proyecto.estado}`);
    }

    console.log('\n🎉 ¡3 proyectos de prueba creados exitosamente!');
    console.log('📊 Estados:');
    console.log('   - 1 en fabricación (en_proceso)');
    console.log('   - 1 confirmado (listo para fabricar)');
    console.log('   - 1 fabricado (terminado)');
    console.log('\n✅ Ahora deberías ver datos en el dashboard!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

crearProyectosPrueba();
