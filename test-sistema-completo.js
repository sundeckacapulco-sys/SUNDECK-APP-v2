/**
 * SCRIPT DE PRUEBAS COMPLETAS DEL SISTEMA
 * 
 * Prueba el flujo completo: Levantamiento → Cotización → Pedido → Producción → Instalación
 * Con validaciones técnicas (candados) en cada etapa
 */

const axios = require('axios');
const fs = require('fs');

// Configuración
const BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
  email: 'admin@sundeck.com',
  password: 'password'
};

let authToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  details: []
};

// Función para logging con colores
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Verde
    error: '\x1b[31m',   // Rojo
    warning: '\x1b[33m', // Amarillo
    reset: '\x1b[0m'
  };
  
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

// Función para hacer peticiones HTTP
async function makeRequest(method, endpoint, data = null, expectError = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    
    if (!expectError) {
      testResults.passed++;
      log(`✅ ${method.toUpperCase()} ${endpoint} - SUCCESS`, 'success');
    }
    
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (expectError) {
      testResults.passed++;
      log(`✅ ${method.toUpperCase()} ${endpoint} - EXPECTED ERROR: ${error.response?.data?.message}`, 'success');
      return { success: false, error: error.response?.data, status: error.response?.status };
    } else {
      testResults.failed++;
      const errorMsg = `❌ ${method.toUpperCase()} ${endpoint} - ERROR: ${error.response?.data?.message || error.message}`;
      log(errorMsg, 'error');
      testResults.errors.push(errorMsg);
      return { success: false, error: error.response?.data || error.message, status: error.response?.status };
    }
  }
}

// 1. Autenticación
async function testAuth() {
  log('🔐 Iniciando autenticación...', 'info');
  
  const result = await makeRequest('post', '/auth/login', TEST_USER);
  if (result.success && result.data.token) {
    authToken = result.data.token;
    log('✅ Autenticación exitosa', 'success');
    return true;
  } else {
    log('❌ Error en autenticación', 'error');
    return false;
  }
}

// 2. Crear prospecto de prueba
async function createTestProspecto() {
  log('👤 Creando prospecto de prueba...', 'info');
  
  const prospectoData = {
    nombre: 'Cliente Prueba Sistema',
    telefono: '5551234567',
    email: 'cliente.prueba@test.com',
    direccion: {
      calle: 'Calle Prueba 123',
      colonia: 'Colonia Test',
      ciudad: 'Ciudad Test',
      codigoPostal: '12345'
    },
    producto: 'Persianas Screen 3%', // Campo requerido corregido
    tipoProducto: 'toma_medidas',
    descripcionNecesidad: 'Prospecto creado para pruebas del sistema completo'
  };

  const result = await makeRequest('post', '/prospectos', prospectoData);
  if (result.success) {
    log(`✅ Prospecto creado: ${result.data.prospecto._id}`, 'success');
    return result.data.prospecto;
  }
  return null;
}

// 3. Crear levantamiento técnico COMPLETO
async function createLevantamientoCompleto(prospectoId) {
  log('📋 Creando levantamiento técnico completo...', 'info');
  
  const levantamientoData = {
    prospectoId,
    nombreEtapa: 'Visita Inicial / Medición',
    comentarios: 'Levantamiento técnico completo con toda la información',
    piezas: [
      {
        ubicacion: 'Recámara Principal',
        cantidad: 2,
        medidas: [
          {
            ancho: 2.5,
            alto: 3.0,
            area: 7.5,
            producto: 'blackout',
            productoLabel: 'Persianas Blackout',
            color: 'Negro',
            precioM2: 900,
            // Campos técnicos COMPLETOS
            tipoControl: 'motorizado',
            orientacion: 'izq',
            tipoInstalacion: 'techo',
            eliminacion: 'si',
            risoAlto: 'si',
            risoBajo: 'no',
            sistema: 'dia_noche',
            telaMarca: 'Blackout Premium',
            baseTabla: '15'
          },
          {
            ancho: 2.0,
            alto: 2.8,
            area: 5.6,
            producto: 'screen_3',
            productoLabel: 'Persianas Screen 3%',
            color: 'Blanco',
            precioM2: 750,
            // Campos técnicos COMPLETOS
            tipoControl: 'manual',
            orientacion: 'der',
            tipoInstalacion: 'pared',
            eliminacion: 'no',
            risoAlto: 'no',
            risoBajo: 'si',
            sistema: 'estandar',
            telaMarca: 'Screen 3% Premium',
            baseTabla: '18'
          }
        ],
        // Información de motorización
        motorizado: true,
        motorModelo: 'somfy_35nm',
        motorModeloManual: '',
        motorPrecio: 5000,
        controlModelo: 'multicanal_5',
        controlModeloManual: '',
        controlPrecio: 1500,
        // Información general
        observaciones: 'Requiere instalación especial por altura',
        fotoUrls: []
      },
      {
        ubicacion: 'Sala-Comedor',
        cantidad: 3,
        medidas: [
          {
            ancho: 3.0,
            alto: 2.5,
            area: 7.5,
            producto: 'toldo_vertical',
            productoLabel: 'Toldo Vertical',
            color: 'Gris',
            precioM2: 800,
            // Campos técnicos COMPLETOS
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'exterior',
            eliminacion: 'no',
            risoAlto: 'no',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Soltis 92',
            baseTabla: '20'
          },
          {
            ancho: 2.8,
            alto: 2.5,
            area: 7.0,
            producto: 'toldo_vertical',
            productoLabel: 'Toldo Vertical',
            color: 'Gris',
            precioM2: 800,
            // Campos técnicos COMPLETOS
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'exterior',
            eliminacion: 'no',
            risoAlto: 'no',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Soltis 92',
            baseTabla: '20'
          },
          {
            ancho: 3.2,
            alto: 2.5,
            area: 8.0,
            producto: 'toldo_vertical',
            productoLabel: 'Toldo Vertical',
            color: 'Gris',
            precioM2: 800,
            // Campos técnicos COMPLETOS
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'exterior',
            eliminacion: 'no',
            risoAlto: 'no',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Soltis 92',
            baseTabla: '20'
          }
        ],
        // Información de toldo
        esToldo: true,
        tipoToldo: 'caida_vertical',
        kitModelo: 'padova',
        kitModeloManual: '',
        kitPrecio: 8500,
        // Información de motorización
        motorizado: true,
        motorModelo: 'somfy_25nm',
        motorModeloManual: '',
        motorPrecio: 4500,
        controlModelo: 'multicanal_4',
        controlModeloManual: '',
        controlPrecio: 1200,
        observaciones: 'Toldo para terraza con viento fuerte'
      }
    ]
  };

  const result = await makeRequest('post', '/etapas', levantamientoData);
  if (result.success) {
    log('✅ Levantamiento técnico completo creado', 'success');
    return result.data;
  }
  return null;
}

// 4. Crear levantamiento técnico INCOMPLETO (para probar candados)
async function createLevantamientoIncompleto(prospectoId) {
  log('⚠️ Creando levantamiento técnico INCOMPLETO (para probar candados)...', 'warning');
  
  const levantamientoIncompleto = {
    prospectoId,
    nombreEtapa: 'Visita Inicial / Medición',
    comentarios: 'Levantamiento incompleto para probar candados',
    piezas: [
      {
        ubicacion: 'Cocina',
        cantidad: 1,
        medidas: [
          {
            ancho: 1.5,
            alto: 2.0,
            area: 3.0,
            producto: 'screen_5',
            productoLabel: 'Persianas Screen 5%',
            color: 'Beige',
            precioM2: 700,
            // CAMPOS TÉCNICOS FALTANTES (para probar candados)
            tipoControl: '', // ❌ FALTANTE
            orientacion: 'izq',
            tipoInstalacion: '', // ❌ FALTANTE
            eliminacion: 'no',
            risoAlto: '',  // ❌ FALTANTE
            risoBajo: '',  // ❌ FALTANTE
            sistema: '',   // ❌ FALTANTE
            telaMarca: '',
            baseTabla: ''
          }
        ],
        // Motorización incompleta
        motorizado: true,
        motorModelo: '', // ❌ FALTANTE
        motorPrecio: '', // ❌ FALTANTE
        controlModelo: '', // ❌ FALTANTE
        controlPrecio: '', // ❌ FALTANTE
        observaciones: 'Producto con información técnica incompleta'
      }
    ]
  };

  const result = await makeRequest('post', '/etapas', levantamientoIncompleto);
  if (result.success) {
    log('✅ Levantamiento incompleto creado (para pruebas)', 'success');
    return result.data;
  }
  return null;
}

// 5. Probar creación de cotización desde levantamiento completo
async function testCotizacionDesdeCompleto(prospectoId, piezasCompletas) {
  log('💰 Probando cotización desde levantamiento COMPLETO...', 'info');
  
  const cotizacionData = {
    prospecto: prospectoId,
    productos: piezasCompletas,
    origen: 'levantamiento',
    precioGeneralM2: 750,
    comentarios: 'Cotización generada desde levantamiento técnico completo'
  };

  const result = await makeRequest('post', '/cotizaciones', cotizacionData);
  if (result.success) {
    log('✅ Cotización creada desde levantamiento completo', 'success');
    testResults.details.push({
      test: 'Cotización desde completo',
      result: 'PASS',
      validacion: result.data.validacionTecnica
    });
    return result.data.cotizacion;
  }
  return null;
}

// 6. Probar creación de pedido desde levantamiento completo
async function testPedidoDesdeCompleto(prospectoId, piezasCompletas) {
  log('📦 Probando pedido desde levantamiento COMPLETO...', 'info');
  
  const pedidoData = {
    prospectoId,
    piezas: piezasCompletas,
    facturacion: {
      requiereFactura: true
    },
    entrega: {
      tipo: 'normal'
    },
    terminos: {
      incluir: true
    },
    comentarios: 'Pedido generado desde levantamiento técnico completo'
  };

  const result = await makeRequest('post', '/pedidos/desde-etapa', pedidoData);
  if (result.success) {
    log('✅ Pedido creado desde levantamiento completo', 'success');
    testResults.details.push({
      test: 'Pedido desde completo',
      result: 'PASS',
      validacion: result.data.validacionTecnica || 'No disponible'
    });
    return result.data.pedido;
  }
  return null;
}

// 7. Probar CANDADO: Intentar crear pedido desde levantamiento incompleto
async function testCandadoPedido(prospectoId, piezasIncompletas) {
  log('🔒 Probando CANDADO: Pedido desde levantamiento INCOMPLETO...', 'warning');
  
  const pedidoData = {
    prospectoId,
    piezas: piezasIncompletas,
    facturacion: { requiereFactura: false },
    comentarios: 'Intento de pedido con información incompleta'
  };

  const result = await makeRequest('post', '/pedidos/desde-etapa', pedidoData, true); // Esperamos error
  if (!result.success && result.status === 400) {
    log('✅ CANDADO FUNCIONANDO: Pedido bloqueado por información incompleta', 'success');
    testResults.details.push({
      test: 'Candado pedido incompleto',
      result: 'PASS - BLOQUEADO CORRECTAMENTE',
      error: result.error.message,
      validacion: result.error.validacion
    });
    return true;
  } else {
    log('❌ CANDADO FALLÓ: Pedido debería haber sido bloqueado', 'error');
    testResults.details.push({
      test: 'Candado pedido incompleto',
      result: 'FAIL - NO BLOQUEÓ',
      data: result.data
    });
    return false;
  }
}

// 8. Probar creación de fabricación desde pedido
async function testFabricacionDesdePedido(pedidoId) {
  log('🏭 Probando fabricación desde pedido...', 'info');
  
  const fabricacionData = {
    fechaInicioDeseada: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Mañana
    prioridad: 'alta',
    observacionesFabricacion: 'Orden de fabricación de prueba'
  };

  const result = await makeRequest('post', `/fabricacion/desde-pedido/${pedidoId}`, fabricacionData);
  if (result.success) {
    log('✅ Orden de fabricación creada', 'success');
    return result.data.orden;
  }
  return null;
}

// 9. Completar fabricación (simular)
async function completarFabricacion(fabricacionId) {
  log('✅ Completando fabricación (simulación)...', 'info');
  
  const updateData = {
    estado: 'completada',
    observaciones: 'Fabricación completada - Prueba automática',
    fechaCompletado: new Date().toISOString()
  };

  const result = await makeRequest('patch', `/fabricacion/${fabricacionId}/estado`, updateData);
  if (result.success) {
    log('✅ Fabricación marcada como completada', 'success');
    return result.data.orden;
  }
  return null;
}

// 10. Probar CANDADO: Intentar crear instalación desde fabricación con datos incompletos
async function testCandadoInstalacion(fabricacionId) {
  log('🔒 Probando CANDADO: Instalación desde fabricación...', 'warning');
  
  const instalacionData = {
    fechaProgramada: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Pasado mañana
    instaladores: [],
    observaciones: 'Intento de instalación con datos técnicos'
  };

  const result = await makeRequest('post', `/instalaciones/desde-fabricacion/${fabricacionId}`, instalacionData);
  if (result.success) {
    log('✅ Instalación programada exitosamente', 'success');
    testResults.details.push({
      test: 'Instalación desde producción completa',
      result: 'PASS',
      validacion: result.data.validacionTecnica
    });
    return result.data.instalacion;
  } else if (result.status === 400 && result.error.message.includes('CANDADO')) {
    log('✅ CANDADO FUNCIONANDO: Instalación bloqueada por información incompleta', 'success');
    testResults.details.push({
      test: 'Candado instalación incompleta',
      result: 'PASS - BLOQUEADO CORRECTAMENTE',
      error: result.error.message
    });
    return false;
  } else {
    log('❌ Error inesperado en instalación', 'error');
    return null;
  }
}

// 11. Generar orden de instalación técnica
async function testOrdenInstalacion(instalacionId) {
  if (!instalacionId) {
    log('⚠️ No hay instalación para generar orden técnica', 'warning');
    return null;
  }
  
  log('📄 Generando orden de instalación técnica...', 'info');
  
  const result = await makeRequest('get', `/instalaciones/${instalacionId}/orden-tecnica`);
  if (result.success) {
    log('✅ Orden de instalación técnica generada', 'success');
    
    // Verificar que contiene información técnica completa
    const orden = result.data.ordenTecnica;
    const tieneInfoCompleta = orden.productosInstalacion.every(producto => 
      producto.especificacionesInstalacion.tipoControl &&
      producto.especificacionesInstalacion.orientacion &&
      producto.especificacionesInstalacion.tipoInstalacion
    );
    
    if (tieneInfoCompleta) {
      log('✅ Orden técnica contiene información completa', 'success');
      testResults.details.push({
        test: 'Orden instalación técnica',
        result: 'PASS - INFO COMPLETA',
        productos: orden.productosInstalacion.length,
        herramientas: orden.herramientasNecesarias.length
      });
    } else {
      log('⚠️ Orden técnica con información incompleta', 'warning');
      testResults.details.push({
        test: 'Orden instalación técnica',
        result: 'PARTIAL - INFO INCOMPLETA'
      });
    }
    
    return result.data;
  }
  return null;
}

// Función principal de pruebas
async function runAllTests() {
  log('🚀 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA', 'info');
  log('=' .repeat(60), 'info');
  
  try {
    // 1. Autenticación
    const authSuccess = await testAuth();
    if (!authSuccess) {
      log('❌ No se puede continuar sin autenticación', 'error');
      return;
    }

    // 2. Crear prospectos de prueba
    const prospecto1 = await createTestProspecto();
    const prospecto2 = await createTestProspecto();
    
    if (!prospecto1 || !prospecto2) {
      log('❌ No se pudieron crear prospectos de prueba', 'error');
      return;
    }

    // 3. Crear levantamientos
    const levantamientoCompleto = await createLevantamientoCompleto(prospecto1._id);
    const levantamientoIncompleto = await createLevantamientoIncompleto(prospecto2._id);

    if (!levantamientoCompleto || !levantamientoIncompleto) {
      log('❌ No se pudieron crear levantamientos de prueba', 'error');
      return;
    }

    // Extraer piezas para pruebas
    const piezasCompletas = levantamientoCompleto.etapa?.piezas || [];
    const piezasIncompletas = levantamientoIncompleto.etapa?.piezas || [];

    // 4. Probar cotización desde levantamiento completo
    const cotizacion = await testCotizacionDesdeCompleto(prospecto1._id, piezasCompletas);

    // 5. Probar pedido desde levantamiento completo
    const pedido = await testPedidoDesdeCompleto(prospecto1._id, piezasCompletas);

    // 6. Probar CANDADO: Pedido desde incompleto
    await testCandadoPedido(prospecto2._id, piezasIncompletas);

    // 7. Continuar flujo con pedido exitoso
    if (pedido) {
      // Crear fabricación
      const fabricacion = await testFabricacionDesdePedido(pedido._id);
      
      if (fabricacion) {
        // Completar fabricación
        const fabricacionCompleta = await completarFabricacion(fabricacion._id);
        
        if (fabricacionCompleta) {
          // Probar instalación
          const instalacion = await testCandadoInstalacion(fabricacion._id);
          
          // Generar orden técnica si la instalación fue exitosa
          if (instalacion && instalacion._id) {
            await testOrdenInstalacion(instalacion._id);
          }
        }
      }
    }

    // Generar reporte final
    generateFinalReport();

  } catch (error) {
    log(`❌ Error crítico en las pruebas: ${error.message}`, 'error');
    testResults.errors.push(`Error crítico: ${error.message}`);
  }
}

// Generar reporte final
function generateFinalReport() {
  log('=' .repeat(60), 'info');
  log('📊 REPORTE FINAL DE PRUEBAS', 'info');
  log('=' .repeat(60), 'info');
  
  log(`✅ Pruebas exitosas: ${testResults.passed}`, 'success');
  log(`❌ Pruebas fallidas: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`📊 Total de pruebas: ${testResults.passed + testResults.failed}`, 'info');
  
  if (testResults.errors.length > 0) {
    log('\n🚨 ERRORES ENCONTRADOS:', 'error');
    testResults.errors.forEach(error => log(`  - ${error}`, 'error'));
  }
  
  if (testResults.details.length > 0) {
    log('\n📋 DETALLES DE PRUEBAS:', 'info');
    testResults.details.forEach(detail => {
      const status = detail.result.includes('PASS') ? 'success' : 'warning';
      log(`  ✓ ${detail.test}: ${detail.result}`, status);
    });
  }
  
  // Guardar reporte en archivo
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: testResults.passed,
      failed: testResults.failed,
      total: testResults.passed + testResults.failed
    },
    errors: testResults.errors,
    details: testResults.details
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(reportData, null, 2));
  log('\n💾 Reporte guardado en: test-results.json', 'info');
  
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  log(`\n🎯 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
}

// Ejecutar pruebas
if (require.main === module) {
  runAllTests().catch(error => {
    log(`❌ Error fatal: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runAllTests };
