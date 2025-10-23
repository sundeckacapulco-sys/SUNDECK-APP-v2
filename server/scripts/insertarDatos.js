const mongoose = require('mongoose');

async function insertarDatos() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('✅ Conectado a MongoDB');

    // Insertar directamente sin validaciones
    const db = mongoose.connection.db;
    
    // Crear un ObjectId para referencias
    const objectId = new mongoose.Types.ObjectId();
    
    // Insertar proyecto directamente
    await db.collection('proyectopedidos').insertOne({
      _id: new mongoose.Types.ObjectId(),
      prospecto: objectId,
      cotizacion: objectId,
      creado_por: objectId,
      numero: 'PROY-FAB-001',
      cliente: {
        nombre: 'Cliente Test Fabricación',
        telefono: '5512345678',
        email: 'test@fabricacion.com'
      },
      estado: 'en_fabricacion',
      productos: [{
        nombre: 'Persiana Enrollable Test',
        ubicacion: 'Sala Principal',
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
        progreso: 60,
        materiales: [{
          nombre: 'Tela Screen 5%',
          cantidad: 3.5,
          unidad: 'm2',
          disponible: true,
          costo: 150
        }, {
          nombre: 'Perfil Aluminio',
          cantidad: 7,
          unidad: 'ml',
          disponible: true,
          costo: 80
        }],
        procesos: [{
          nombre: 'Corte de tela',
          descripcion: 'Cortar tela según medidas exactas',
          orden: 1,
          tiempoEstimado: 2,
          tiempoReal: 1.5,
          estado: 'completado',
          fechaInicio: new Date(Date.now() - 24 * 60 * 60 * 1000),
          fechaFin: new Date(Date.now() - 12 * 60 * 60 * 1000)
        }, {
          nombre: 'Armado de mecanismo',
          descripcion: 'Ensamblar mecanismo de cadena',
          orden: 2,
          tiempoEstimado: 3,
          estado: 'en_proceso',
          fechaInicio: new Date()
        }, {
          nombre: 'Ensamble final',
          descripcion: 'Ensamblar persiana completa',
          orden: 3,
          tiempoEstimado: 2,
          estado: 'pendiente'
        }],
        costos: {
          materiales: 230,
          manoObra: 200,
          overhead: 70,
          total: 500
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insertar segundo proyecto confirmado
    await db.collection('proyectopedidos').insertOne({
      _id: new mongoose.Types.ObjectId(),
      prospecto: new mongoose.Types.ObjectId(),
      cotizacion: new mongoose.Types.ObjectId(),
      creado_por: new mongoose.Types.ObjectId(),
      numero: 'PROY-FAB-002',
      cliente: {
        nombre: 'Cliente Test 2',
        telefono: '5512345679',
        email: 'test2@fabricacion.com'
      },
      estado: 'confirmado',
      productos: [{
        nombre: 'Toldo Retráctil',
        ubicacion: 'Terraza',
        medidas: { ancho: 3.0, alto: 2.5, area: 7.5 },
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insertar tercer proyecto fabricado
    await db.collection('proyectopedidos').insertOne({
      _id: new mongoose.Types.ObjectId(),
      prospecto: new mongoose.Types.ObjectId(),
      cotizacion: new mongoose.Types.ObjectId(),
      creado_por: new mongoose.Types.ObjectId(),
      numero: 'PROY-FAB-003',
      cliente: {
        nombre: 'Cliente Test 3',
        telefono: '5512345680',
        email: 'test3@fabricacion.com'
      },
      estado: 'fabricado',
      productos: [{
        nombre: 'Cortina Roller',
        ubicacion: 'Recámara',
        medidas: { ancho: 1.8, alto: 1.5, area: 2.7 },
        cantidad: 2,
        precioUnitario: 1800,
        subtotal: 3600
      }],
      cronograma: {
        fechaPedido: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        fechaInicioFabricacion: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
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
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('✅ Proyectos insertados:');
    console.log('   - PROY-FAB-001: en_fabricacion (en_proceso)');
    console.log('   - PROY-FAB-002: confirmado (listo para fabricar)');
    console.log('   - PROY-FAB-003: fabricado (terminado)');
    console.log('\n🎉 ¡Datos creados! Recarga /fabricacion para verlos');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

insertarDatos();
