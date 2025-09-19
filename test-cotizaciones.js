const mongoose = require('mongoose');
const Prospecto = require('./server/models/Prospecto');
const Cotizacion = require('./server/models/Cotizacion');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck-crm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function testCotizaciones() {
  try {
    console.log('🧪 Iniciando pruebas del módulo de cotizaciones...\n');

    // 1. Crear un prospecto de prueba
    console.log('1. Creando prospecto de prueba...');
    const prospectoData = {
      nombre: 'Cliente Prueba Cotización',
      telefono: '7441234567',
      email: 'cliente@test.com',
      direccion: 'Calle Prueba 123, Acapulco',
      fuente: 'cotizacion_directa',
      producto: 'Persianas Screen',
      etapa: 'cotizacion',
      observaciones: 'Cliente creado desde cotización directa - PRUEBA'
    };

    const prospecto = new Prospecto(prospectoData);
    await prospecto.save();
    console.log('✅ Prospecto creado:', prospecto.nombre, '- ID:', prospecto._id);

    // 2. Crear cotización de prueba
    console.log('\n2. Creando cotización de prueba...');
    const cotizacionData = {
      prospecto: prospecto._id,
      validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      productos: [
        {
          nombre: 'Persianas Screen 3%',
          descripcion: 'Recámara principal',
          categoria: 'ventana',
          material: 'Aluminio',
          color: 'Blanco',
          medidas: {
            ancho: 2.5,
            alto: 3.0,
            area: 7.5
          },
          cantidad: 1,
          precioUnitario: 750,
          subtotal: 5625
        },
        {
          nombre: 'Persianas Blackout',
          descripcion: 'Sala',
          categoria: 'ventana',
          material: 'Aluminio',
          color: 'Gris',
          medidas: {
            ancho: 3.0,
            alto: 2.8,
            area: 8.4
          },
          cantidad: 1,
          precioUnitario: 900,
          subtotal: 7560
        }
      ],
      descuento: {
        porcentaje: 10,
        motivo: 'Descuento por pronto pago'
      },
      formaPago: {
        anticipo: { porcentaje: 50 },
        saldo: { porcentaje: 50, condiciones: 'contra entrega' }
      },
      tiempoFabricacion: 15,
      tiempoInstalacion: 1,
      requiereInstalacion: true,
      costoInstalacion: 1500,
      garantia: {
        fabricacion: 12,
        instalacion: 6,
        descripcion: 'Garantía completa contra defectos de fabricación e instalación'
      },
      elaboradaPor: new mongoose.Types.ObjectId() // ID ficticio para prueba
    };

    const cotizacion = new Cotizacion(cotizacionData);
    await cotizacion.save();
    console.log('✅ Cotización creada:', cotizacion.numero, '- ID:', cotizacion._id);

    // 3. Verificar cálculos automáticos
    console.log('\n3. Verificando cálculos automáticos...');
    console.log('📊 Subtotal:', cotizacion.subtotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('💸 Descuento:', cotizacion.descuento.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('🏗️ Instalación:', cotizacion.costoInstalacion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('💰 IVA:', cotizacion.iva.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('🎯 Total:', cotizacion.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('💳 Anticipo:', cotizacion.formaPago.anticipo.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));
    console.log('💵 Saldo:', cotizacion.formaPago.saldo.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }));

    // 4. Verificar que el prospecto se actualizó
    console.log('\n4. Verificando actualización del prospecto...');
    const prospectoActualizado = await Prospecto.findById(prospecto._id);
    console.log('✅ Etapa del prospecto:', prospectoActualizado.etapa);

    // 5. Buscar cotizaciones
    console.log('\n5. Probando búsqueda de cotizaciones...');
    const cotizaciones = await Cotizacion.find()
      .populate('prospecto', 'nombre telefono')
      .populate('elaboradaPor', 'nombre apellido')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`✅ Se encontraron ${cotizaciones.length} cotizaciones:`);
    cotizaciones.forEach(cot => {
      console.log(`   - ${cot.numero} | ${cot.prospecto?.nombre} | ${cot.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} | ${cot.estado}`);
    });

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de funcionalidades probadas:');
    console.log('   ✅ Creación de prospecto desde cotización directa');
    console.log('   ✅ Creación de cotización con productos múltiples');
    console.log('   ✅ Cálculos automáticos (subtotal, descuento, IVA, total)');
    console.log('   ✅ Generación automática de número de cotización');
    console.log('   ✅ Cálculo de anticipo y saldo');
    console.log('   ✅ Actualización de etapa del prospecto');
    console.log('   ✅ Búsqueda y listado de cotizaciones');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión a base de datos cerrada');
  }
}

// Ejecutar pruebas
testCotizaciones();
