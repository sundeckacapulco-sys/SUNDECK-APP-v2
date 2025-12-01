/**
 * SCRIPT: CREAR DATOS DE PRUEBA PARA FLUJO TÉCNICO UNIFICADO
 * 
 * Propósito: Generar un proyecto completo con levantamiento técnico,
 * cotización y pedido para validar el flujo de los 13 campos técnicos.
 * 
 * Fecha: 6 Noviembre 2025
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const Cotizacion = require('../models/Cotizacion');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const { construirProductosDesdePartidas } = require('../utils/cotizacionMapper');
const logger = require('../config/logger');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function crearProspectoPrueba() {
  log('\n📋 Creando prospecto de prueba...', 'yellow');
  
  const prospecto = new Prospecto({
    nombre: 'Juan Pérez García',
    telefono: '7441234567',
    email: 'juan.perez@example.com',
    direccion: {
      calle: 'Av. Costera Miguel Alemán',
      numero: '123',
      colonia: 'Magallanes',
      ciudad: 'Acapulco',
      estado: 'Guerrero',
      codigoPostal: '39670'
    },
    producto: 'Persianas',
    origen: 'referencia',
    estado: 'activo'
  });

  await prospecto.save();
  log(`✅ Prospecto creado: ${prospecto.nombre} (${prospecto._id})`, 'green');
  
  return prospecto;
}

async function crearProyectoConLevantamiento(prospecto) {
  log('\n🏗️ Creando proyecto con levantamiento técnico...', 'yellow');
  
  // Usuario genérico para pruebas
  const usuarioGenerico = new mongoose.Types.ObjectId();
  
  const proyecto = new Proyecto({
    numero: 'PROY-TEST-001',
    cliente: {
      nombre: prospecto.nombre,
      telefono: prospecto.telefono,
      email: prospecto.email,
      direccion: prospecto.direccion
    },
    prospecto: prospecto._id,
    estado: 'levantamiento',
    creado_por: usuarioGenerico,
    actualizado_por: usuarioGenerico,
    
    // ⭐ LEVANTAMIENTO CON 13 CAMPOS TÉCNICOS COMPLETOS
    levantamiento: {
      partidas: [
        {
          ubicacion: 'Sala Principal',
          producto: 'Persiana Screen 3%',
          color: 'Blanco',
          modelo: 'SC-3%-WH',
          cantidad: 2,
          piezas: [
            {
              ancho: 2.5,
              alto: 3.0,
              m2: 7.5,
              // 13 CAMPOS TÉCNICOS
              sistema: 'Roller',
              control: 'Manual',
              instalacion: 'Muro',
              fijacion: 'Concreto',
              caida: 'Frontal',
              galeria: 'Sí',
              telaMarca: 'Screen 3% Premium',
              baseTabla: '15cm',
              operacion: 'Cadena',
              detalle: 'Instalación estándar en muro de concreto',
              traslape: 'No',
              modeloCodigo: 'SC-3%-WH-001',
              color: 'Blanco',
              observacionesTecnicas: 'Ventana con marco de aluminio, requiere soportes reforzados',
              precioM2: 750
            },
            {
              ancho: 2.0,
              alto: 2.8,
              m2: 5.6,
              // 13 CAMPOS TÉCNICOS
              sistema: 'Roller',
              control: 'Motorizado',
              instalacion: 'Techo',
              fijacion: 'Tablaroca',
              caida: 'Lateral',
              galeria: 'No',
              telaMarca: 'Screen 5% Premium',
              baseTabla: '18cm',
              operacion: 'Motor',
              detalle: 'Requiere instalación eléctrica y canalización',
              traslape: 'Sí',
              modeloCodigo: 'SC-5%-WH-002',
              color: 'Blanco',
              observacionesTecnicas: 'Ventana con obstáculos laterales, motor Somfy RTS',
              precioM2: 900
            }
          ],
          motorizacion: {
            activa: true,
            modeloMotor: 'Somfy Sonesse 30 RTS',
            cantidadMotores: 1,
            precioMotor: 3500,
            modeloControl: 'Control Remoto RTS',
            tipoControl: 'individual',
            precioControl: 800
          },
          totales: {
            subtotal: 10925,
            motorMotor: 3500,
            costoControl: 800,
            total: 15225
          },
          fotos: []
        },
        {
          ubicacion: 'Recámara Principal',
          producto: 'Persiana Blackout',
          color: 'Gris',
          modelo: 'BLK-GR',
          cantidad: 1,
          piezas: [
            {
              ancho: 3.0,
              alto: 2.5,
              m2: 7.5,
              // 13 CAMPOS TÉCNICOS
              sistema: 'Roller',
              control: 'Manual',
              instalacion: 'Muro',
              fijacion: 'Concreto',
              caida: 'Frontal',
              galeria: 'Sí',
              telaMarca: 'Blackout Premium',
              baseTabla: '15cm',
              operacion: 'Cadena',
              detalle: 'Instalación estándar',
              traslape: 'No',
              modeloCodigo: 'BLK-GR-001',
              color: 'Gris',
              observacionesTecnicas: 'Requiere oscurecimiento total, tela doble cara',
              precioM2: 850
            }
          ],
          totales: {
            subtotal: 6375,
            total: 6375
          },
          fotos: []
        }
      ],
      fechaLevantamiento: new Date(),
      tecnicoResponsable: 'Carlos Martínez',
      observaciones: 'Levantamiento completo con especificaciones técnicas detalladas'
    }
  });

  await proyecto.save();
  log(`✅ Proyecto creado: ${proyecto.numero} (${proyecto._id})`, 'green');
  log(`   Partidas: ${proyecto.levantamiento.partidas.length}`, 'cyan');
  log(`   Total piezas: ${proyecto.levantamiento.partidas.reduce((sum, p) => sum + p.piezas.length, 0)}`, 'cyan');
  
  return proyecto;
}

async function crearCotizacion(proyecto, prospecto) {
  log('\n💰 Creando cotización desde levantamiento...', 'yellow');
  
  // Usuario genérico para pruebas
  const usuarioGenerico = new mongoose.Types.ObjectId();
  
  // Construir productos usando el mapper
  const productos = construirProductosDesdePartidas(proyecto.levantamiento.partidas);
  
  const cotizacion = new Cotizacion({
    numero: 'COT-TEST-001',
    prospecto: prospecto._id,
    proyecto: proyecto._id,
    productos: productos,
    subtotal: 21600,
    iva: 3456,
    total: 25056,
    estado: 'aprobada',
    vigencia: 15,
    elaboradaPor: usuarioGenerico,
    formaPago: {
      anticipo: {
        porcentaje: 60,
        monto: 15033.60,
        metodoPago: 'transferencia'
      },
      saldo: {
        porcentaje: 40,
        monto: 10022.40,
        metodoPago: 'efectivo'
      }
    },
    observaciones: 'Cotización generada desde levantamiento técnico completo'
  });

  await cotizacion.save();
  log(`✅ Cotización creada: ${cotizacion.numero} (${cotizacion._id})`, 'green');
  log(`   Productos: ${cotizacion.productos.length}`, 'cyan');
  log(`   Total: $${cotizacion.total.toLocaleString('es-MX')}`, 'cyan');
  
  // Actualizar proyecto con cotización
  proyecto.cotizacionActual = {
    cotizacion: cotizacion._id,
    estado: 'aprobada',
    fechaAprobacion: new Date()
  };
  proyecto.estado = 'cotizacion';
  await proyecto.save();
  
  return cotizacion;
}

async function crearPedido(cotizacion, proyecto, prospecto) {
  log('\n📦 Creando pedido con especificaciones técnicas...', 'yellow');
  
  // Construir productos usando el mapper (igual que en pedidoController)
  const productos = construirProductosDesdePartidas(proyecto.levantamiento.partidas, cotizacion);
  
  const pedido = new Pedido({
    numero: 'PED-TEST-001',
    cotizacion: cotizacion._id,
    prospecto: prospecto._id,
    montoTotal: cotizacion.total,
    
    anticipo: {
      monto: 15033.60,
      porcentaje: 60,
      fechaPago: new Date(),
      metodoPago: 'transferencia',
      referencia: 'TRANS-001',
      comprobante: '',
      pagado: true
    },
    
    saldo: {
      monto: 10022.40,
      porcentaje: 40,
      fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      pagado: false
    },
    
    // ⭐ PRODUCTOS CON ESPECIFICACIONES TÉCNICAS COMPLETAS
    productos: productos,
    
    direccionEntrega: prospecto.direccion,
    contactoEntrega: {
      nombre: prospecto.nombre,
      telefono: prospecto.telefono,
      horarioPreferido: '9:00 AM - 6:00 PM'
    },
    
    fechaInicioFabricacion: new Date(),
    fechaFinFabricacion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    fechaInstalacion: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    fechaEntrega: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
    
    estado: 'confirmado'
  });

  await pedido.save();
  log(`✅ Pedido creado: ${pedido.numero} (${pedido._id})`, 'green');
  log(`   Productos: ${pedido.productos.length}`, 'cyan');
  log(`   Con especificaciones técnicas: ${pedido.productos.filter(p => p.especificacionesTecnicas).length}`, 'cyan');
  
  return pedido;
}

async function validarEspecificacionesTecnicas(pedido) {
  log('\n🔍 Validando especificaciones técnicas en pedido...', 'yellow');
  
  let todosCompletos = true;
  
  pedido.productos.forEach((producto, index) => {
    const specs = producto.especificacionesTecnicas;
    
    if (!specs) {
      log(`   ❌ Producto ${index + 1}: Sin especificaciones técnicas`, 'red');
      todosCompletos = false;
      return;
    }
    
    const camposPresentes = Object.keys(specs).filter(key => 
      specs[key] !== null && 
      specs[key] !== undefined && 
      specs[key] !== '' &&
      (Array.isArray(specs[key]) ? specs[key].length > 0 : true)
    ).length;
    
    log(`   ✅ Producto ${index + 1}: ${producto.nombre}`, 'green');
    log(`      Campos técnicos: ${camposPresentes}/13`, 'cyan');
    log(`      Sistema: ${specs.sistema?.join(', ') || 'N/A'}`, 'cyan');
    log(`      Control: ${specs.control || 'N/A'}`, 'cyan');
    log(`      Instalación: ${specs.tipoInstalacion || 'N/A'}`, 'cyan');
    log(`      Fijación: ${specs.tipoFijacion || 'N/A'}`, 'cyan');
  });
  
  return todosCompletos;
}

async function ejecutar() {
  try {
    log('\n🚀 CREANDO DATOS DE PRUEBA PARA FLUJO TÉCNICO UNIFICADO', 'cyan');
    log('='.repeat(80), 'cyan');
    
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/sundeck');
    log('\n✅ Conectado a MongoDB', 'green');
    
    // Limpiar datos de prueba anteriores
    log('\n🧹 Limpiando datos de prueba anteriores...', 'yellow');
    await Prospecto.deleteMany({ nombre: 'Juan Pérez García' });
    await Proyecto.deleteMany({ numero: /^PROY-TEST/ });
    await Cotizacion.deleteMany({ numero: /^COT-TEST/ });
    await Pedido.deleteMany({ numero: /^PED-TEST/ });
    log('✅ Datos anteriores eliminados', 'green');
    
    // Crear datos
    const prospecto = await crearProspectoPrueba();
    const proyecto = await crearProyectoConLevantamiento(prospecto);
    const cotizacion = await crearCotizacion(proyecto, prospecto);
    const pedido = await crearPedido(cotizacion, proyecto, prospecto);
    
    // Validar
    const valido = await validarEspecificacionesTecnicas(pedido);
    
    // Resumen final
    log('\n' + '='.repeat(80), 'cyan');
    log('📊 RESUMEN DE DATOS CREADOS', 'cyan');
    log('='.repeat(80), 'cyan');
    log(`\n✅ Prospecto: ${prospecto.nombre} (${prospecto._id})`, 'green');
    log(`✅ Proyecto: ${proyecto.numero} (${proyecto._id})`, 'green');
    log(`✅ Cotización: ${cotizacion.numero} (${cotizacion._id})`, 'green');
    log(`✅ Pedido: ${pedido.numero} (${pedido._id})`, 'green');
    
    log('\n📈 VALIDACIÓN:', 'cyan');
    if (valido) {
      log('✅ Todos los productos tienen especificaciones técnicas completas', 'green');
    } else {
      log('⚠️  Algunos productos no tienen especificaciones completas', 'yellow');
    }
    
    log('\n🔍 COMANDOS DE VERIFICACIÓN:', 'cyan');
    log('\n1. Verificar pedido en MongoDB:', 'yellow');
    log(`   db.pedidos.findOne({ _id: ObjectId("${pedido._id}") }, { "productos.especificacionesTecnicas": 1 })`, 'reset');
    
    log('\n2. Ejecutar script de validación:', 'yellow');
    log('   node server/scripts/validarFlujoTecnicoUnificado.js', 'reset');
    
    log('\n✅ Datos de prueba creados exitosamente\n', 'green');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar
if (require.main === module) {
  ejecutar();
}

module.exports = { ejecutar };
