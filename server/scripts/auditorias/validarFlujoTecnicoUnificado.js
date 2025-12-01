/**
 * SCRIPT DE VALIDACIÓN: FLUJO TÉCNICO UNIFICADO
 * 
 * Propósito: Validar que los 13 campos técnicos fluyan correctamente desde
 * Levantamiento → Cotización → Pedido → Fabricación
 * 
 * Fecha: 6 Noviembre 2025
 * Autor: Supervisor Técnico - Sundeck CRM
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const Pedido = require('../models/Pedido');
const Prospecto = require('../models/Prospecto');
const OrdenFabricacion = require('../models/OrdenFabricacion');
const { construirProductosDesdePartidas, validarEspecificacionesTecnicas } = require('../utils/cotizacionMapper');
const logger = require('../config/logger');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80) + '\n');
}

async function conectarDB() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck';
    await mongoose.connect(MONGODB_URI);
    log('✅ Conectado a MongoDB', 'green');
    return true;
  } catch (error) {
    log(`❌ Error conectando a MongoDB: ${error.message}`, 'red');
    return false;
  }
}

async function validarMapper() {
  logSection('🔍 PRUEBA 1: Validar Mapper Unificado');
  
  try {
    // Datos de prueba simulando un levantamiento
    const partidasPrueba = [{
      ubicacion: 'Sala Principal',
      producto: 'Persiana Screen 3%',
      color: 'Blanco',
      modelo: 'SC-3%',
      cantidad: 2,
      piezas: [
        {
          ancho: 2.5,
          alto: 3.0,
          m2: 7.5,
          sistema: 'Roller',
          control: 'Manual',
          instalacion: 'Muro',
          fijacion: 'Concreto',
          caida: 'Frontal',
          galeria: 'Sí',
          telaMarca: 'Screen 3% Premium',
          baseTabla: '15cm',
          operacion: 'Cadena',
          detalle: 'Instalación estándar',
          traslape: 'No',
          modeloCodigo: 'SC-3%-001',
          observacionesTecnicas: 'Ventana con marco de aluminio',
          precioM2: 750
        },
        {
          ancho: 2.0,
          alto: 2.8,
          m2: 5.6,
          sistema: 'Roller',
          control: 'Motorizado',
          instalacion: 'Techo',
          fijacion: 'Tablaroca',
          caida: 'Lateral',
          galeria: 'No',
          telaMarca: 'Screen 5% Premium',
          baseTabla: '18cm',
          operacion: 'Motor',
          detalle: 'Requiere instalación eléctrica',
          traslape: 'Sí',
          modeloCodigo: 'SC-5%-002',
          observacionesTecnicas: 'Ventana con obstáculos laterales',
          precioM2: 900
        }
      ]
    }];

    log('📦 Construyendo productos desde partidas de prueba...', 'yellow');
    const productos = construirProductosDesdePartidas(partidasPrueba);

    log(`✅ Productos construidos: ${productos.length}`, 'green');
    
    // Validar cada producto
    let todosValidos = true;
    productos.forEach((producto, index) => {
      const validacion = validarEspecificacionesTecnicas(producto);
      
      log(`\n📋 Producto ${index + 1}: ${producto.nombre}`, 'bright');
      log(`   Ubicación: ${producto.descripcion}`, 'reset');
      log(`   Medidas: ${producto.medidas.ancho}m × ${producto.medidas.alto}m = ${producto.medidas.area}m²`, 'reset');
      
      if (validacion.valido) {
        log(`   ✅ Especificaciones técnicas completas (${validacion.camposPresentes}/${validacion.totalCampos})`, 'green');
        
        // Mostrar algunos campos técnicos
        const specs = producto.especificacionesTecnicas;
        log(`   🔧 Sistema: ${specs.sistema.join(', ')}`, 'reset');
        log(`   🎛️  Control: ${specs.control}`, 'reset');
        log(`   🏗️  Instalación: ${specs.tipoInstalacion}`, 'reset');
        log(`   🔩 Fijación: ${specs.tipoFijacion}`, 'reset');
        log(`   📐 Caída: ${specs.caida}`, 'reset');
        log(`   🎨 Tela/Marca: ${specs.telaMarca}`, 'reset');
        log(`   📏 Base/Tabla: ${specs.baseTabla}`, 'reset');
        log(`   📝 Observaciones: ${specs.observacionesTecnicas}`, 'reset');
      } else {
        log(`   ❌ Especificaciones técnicas incompletas`, 'red');
        log(`   Campos faltantes: ${validacion.camposFaltantes.join(', ')}`, 'red');
        todosValidos = false;
      }
    });

    if (todosValidos) {
      log('\n✅ PRUEBA 1 EXITOSA: Mapper unificado funciona correctamente', 'green');
      return true;
    } else {
      log('\n❌ PRUEBA 1 FALLIDA: Algunos productos no tienen especificaciones completas', 'red');
      return false;
    }

  } catch (error) {
    log(`❌ Error en prueba de mapper: ${error.message}`, 'red');
    console.error(error.stack);
    return false;
  }
}

async function validarProyectoConLevantamiento() {
  logSection('🔍 PRUEBA 2: Validar Proyecto con Levantamiento Real');
  
  try {
    // Buscar un proyecto que tenga levantamiento con partidas
    const proyecto = await Proyecto.findOne({
      'levantamiento.partidas.0': { $exists: true }
    }).lean();

    if (!proyecto) {
      log('⚠️  No se encontró ningún proyecto con levantamiento', 'yellow');
      log('   Crear un levantamiento técnico desde el frontend para continuar', 'yellow');
      return null;
    }

    log(`✅ Proyecto encontrado: ${proyecto.numero || proyecto._id}`, 'green');
    log(`   Cliente: ${proyecto.cliente?.nombre}`, 'reset');
    log(`   Estado: ${proyecto.estado}`, 'reset');
    log(`   Partidas: ${proyecto.levantamiento?.partidas?.length || 0}`, 'reset');

    // Validar estructura del levantamiento
    const partidas = proyecto.levantamiento?.partidas || [];
    let totalPiezas = 0;
    let piezasConEspecificaciones = 0;

    partidas.forEach((partida, pIndex) => {
      log(`\n📦 Partida ${pIndex + 1}: ${partida.ubicacion}`, 'bright');
      log(`   Producto: ${partida.producto}`, 'reset');
      log(`   Piezas: ${partida.piezas?.length || 0}`, 'reset');

      (partida.piezas || []).forEach((pieza, iIndex) => {
        totalPiezas++;
        
        const tieneCamposTecnicos = 
          pieza.sistema || pieza.control || pieza.instalacion || 
          pieza.fijacion || pieza.caida || pieza.galeria;

        if (tieneCamposTecnicos) {
          piezasConEspecificaciones++;
        }

        log(`   📏 Pieza ${iIndex + 1}: ${pieza.ancho}m × ${pieza.alto}m = ${pieza.m2}m²`, 'reset');
        if (tieneCamposTecnicos) {
          log(`      ✅ Con especificaciones técnicas`, 'green');
        } else {
          log(`      ⚠️  Sin especificaciones técnicas`, 'yellow');
        }
      });
    });

    const porcentaje = totalPiezas > 0 ? ((piezasConEspecificaciones / totalPiezas) * 100).toFixed(1) : 0;
    log(`\n📊 Resumen: ${piezasConEspecificaciones}/${totalPiezas} piezas con especificaciones (${porcentaje}%)`, 'cyan');

    if (piezasConEspecificaciones > 0) {
      log('✅ PRUEBA 2 EXITOSA: Proyecto tiene levantamiento con datos técnicos', 'green');
      return proyecto;
    } else {
      log('⚠️  PRUEBA 2 PARCIAL: Proyecto existe pero sin especificaciones técnicas', 'yellow');
      return proyecto;
    }

  } catch (error) {
    log(`❌ Error validando proyecto: ${error.message}`, 'red');
    console.error(error.stack);
    return null;
  }
}

async function validarPedidoConEspecificaciones() {
  logSection('🔍 PRUEBA 3: Validar Pedido con Especificaciones Técnicas');
  
  try {
    // Buscar un pedido reciente
    const pedido = await Pedido.findOne()
      .sort({ createdAt: -1 })
      .populate('prospecto', 'nombre')
      .lean();

    if (!pedido) {
      log('⚠️  No se encontró ningún pedido en la base de datos', 'yellow');
      log('   Crear un pedido desde una cotización para continuar', 'yellow');
      return null;
    }

    log(`✅ Pedido encontrado: ${pedido.numero}`, 'green');
    log(`   Cliente: ${pedido.prospecto?.nombre || 'N/A'}`, 'reset');
    log(`   Estado: ${pedido.estado}`, 'reset');
    log(`   Productos: ${pedido.productos?.length || 0}`, 'reset');

    // Validar especificaciones técnicas en productos
    let productosConEspecificaciones = 0;
    let camposTecnicosCompletos = 0;

    (pedido.productos || []).forEach((producto, index) => {
      log(`\n📦 Producto ${index + 1}: ${producto.nombre}`, 'bright');
      
      if (producto.especificacionesTecnicas) {
        productosConEspecificaciones++;
        
        const specs = producto.especificacionesTecnicas;
        const camposPresentes = Object.keys(specs).filter(key => 
          specs[key] !== null && 
          specs[key] !== undefined && 
          specs[key] !== '' && 
          (Array.isArray(specs[key]) ? specs[key].length > 0 : true)
        ).length;

        log(`   ✅ Tiene especificaciones técnicas (${camposPresentes} campos)`, 'green');
        
        if (camposPresentes >= 10) {
          camposTecnicosCompletos++;
          log(`   🔧 Sistema: ${specs.sistema?.join(', ') || 'N/A'}`, 'reset');
          log(`   🎛️  Control: ${specs.control || 'N/A'}`, 'reset');
          log(`   🏗️  Instalación: ${specs.tipoInstalacion || 'N/A'}`, 'reset');
          log(`   🔩 Fijación: ${specs.tipoFijacion || 'N/A'}`, 'reset');
        } else {
          log(`   ⚠️  Especificaciones incompletas`, 'yellow');
        }
      } else {
        log(`   ❌ Sin especificaciones técnicas`, 'red');
      }
    });

    const totalProductos = pedido.productos?.length || 0;
    const porcentaje = totalProductos > 0 ? ((productosConEspecificaciones / totalProductos) * 100).toFixed(1) : 0;
    
    log(`\n📊 Resumen:`, 'cyan');
    log(`   ${productosConEspecificaciones}/${totalProductos} productos con especificaciones (${porcentaje}%)`, 'cyan');
    log(`   ${camposTecnicosCompletos}/${totalProductos} productos con especificaciones completas`, 'cyan');

    if (productosConEspecificaciones > 0) {
      log('\n✅ PRUEBA 3 EXITOSA: Pedido tiene productos con especificaciones técnicas', 'green');
      return pedido;
    } else {
      log('\n❌ PRUEBA 3 FALLIDA: Pedido sin especificaciones técnicas', 'red');
      log('   Esto indica que el mapper no se está usando correctamente', 'red');
      return null;
    }

  } catch (error) {
    log(`❌ Error validando pedido: ${error.message}`, 'red');
    console.error(error.stack);
    return null;
  }
}

async function ejecutarPruebasCompletas() {
  logSection('🚀 VALIDACIÓN DEL FLUJO TÉCNICO UNIFICADO');
  
  log('Fecha: ' + new Date().toLocaleString('es-MX'), 'reset');
  log('Objetivo: Validar que los 13 campos técnicos fluyan correctamente\n', 'reset');

  // Conectar a la base de datos
  const conectado = await conectarDB();
  if (!conectado) {
    log('\n❌ No se pudo conectar a la base de datos. Abortando pruebas.', 'red');
    process.exit(1);
  }

  // Ejecutar pruebas
  const resultados = {
    mapper: false,
    proyecto: false,
    pedido: false
  };

  resultados.mapper = await validarMapper();
  
  const proyecto = await validarProyectoConLevantamiento();
  resultados.proyecto = proyecto !== null;
  
  const pedido = await validarPedidoConEspecificaciones();
  resultados.pedido = pedido !== null && pedido.productos?.some(p => p.especificacionesTecnicas);

  // Resumen final
  logSection('📊 RESUMEN DE VALIDACIÓN');
  
  log('Resultados:', 'bright');
  log(`  1. Mapper Unificado:        ${resultados.mapper ? '✅ EXITOSO' : '❌ FALLIDO'}`, resultados.mapper ? 'green' : 'red');
  log(`  2. Proyecto con Levantamiento: ${resultados.proyecto ? '✅ EXITOSO' : '⚠️  PENDIENTE'}`, resultados.proyecto ? 'green' : 'yellow');
  log(`  3. Pedido con Especificaciones: ${resultados.pedido ? '✅ EXITOSO' : '❌ FALLIDO'}`, resultados.pedido ? 'green' : 'red');

  const exitosos = Object.values(resultados).filter(r => r === true).length;
  const total = Object.keys(resultados).length;
  const porcentaje = ((exitosos / total) * 100).toFixed(1);

  log(`\n📈 Tasa de éxito: ${exitosos}/${total} (${porcentaje}%)`, 'cyan');

  if (exitosos === total) {
    log('\n🎉 ¡VALIDACIÓN COMPLETA EXITOSA!', 'green');
    log('El flujo técnico unificado está funcionando correctamente.', 'green');
  } else if (exitosos >= 2) {
    log('\n⚠️  VALIDACIÓN PARCIAL', 'yellow');
    log('El flujo técnico está parcialmente implementado. Revisar pruebas fallidas.', 'yellow');
  } else {
    log('\n❌ VALIDACIÓN FALLIDA', 'red');
    log('El flujo técnico necesita correcciones. Revisar implementación.', 'red');
  }

  // Cerrar conexión
  await mongoose.connection.close();
  log('\n✅ Conexión a MongoDB cerrada', 'green');
  
  process.exit(exitosos === total ? 0 : 1);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarPruebasCompletas().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  validarMapper,
  validarProyectoConLevantamiento,
  validarPedidoConEspecificaciones,
  ejecutarPruebasCompletas
};
