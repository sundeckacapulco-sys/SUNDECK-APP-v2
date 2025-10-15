/**
 * SCRIPT DE DEBUG PARA PEDIDOS
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@sundeck.com',
      password: 'password'
    });
    authToken = response.data.token;
    console.log('✅ Login exitoso');
    return true;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data);
    return false;
  }
}

async function testPedidoSimple() {
  try {
    // Crear prospecto simple
    const prospectoResponse = await axios.post(`${BASE_URL}/prospectos`, {
      nombre: 'Cliente Debug',
      telefono: '5551234567',
      producto: 'Persianas Test'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const prospectoId = prospectoResponse.data.prospecto._id;
    console.log('✅ Prospecto creado:', prospectoId);

    // Crear pedido con datos mínimos pero completos técnicamente
    const pedidoData = {
      prospectoId,
      piezas: [{
        ubicacion: 'Sala Test',
        cantidad: 1,
        medidas: [{
          ancho: 2.0,
          alto: 2.5,
          area: 5.0,
          producto: 'screen_3',
          productoLabel: 'Screen 3%',
          color: 'Blanco',
          precioM2: 750,
          // Campos técnicos COMPLETOS
          tipoControl: 'manual',
          orientacion: 'izq',
          tipoInstalacion: 'pared',
          eliminacion: 'no',
          risoAlto: 'no',
          risoBajo: 'no',
          sistema: 'estandar',
          telaMarca: 'Screen 3%',
          baseTabla: '15'
        }],
        // Información del producto
        producto: 'screen_3',
        productoLabel: 'Screen 3%',
        color: 'Blanco',
        precioM2: 750,
        observaciones: 'Producto de prueba',
        motorizado: false,
        esToldo: false
      }],
      facturacion: {
        requiereFactura: false
      },
      entrega: {
        tipo: 'normal'
      },
      terminos: {
        incluir: true
      },
      comentarios: 'Pedido de prueba debug'
    };

    console.log('📦 Creando pedido con datos:', JSON.stringify(pedidoData, null, 2));

    const pedidoResponse = await axios.post(`${BASE_URL}/pedidos/desde-etapa`, pedidoData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Pedido creado exitosamente:', pedidoResponse.data);

  } catch (error) {
    console.error('❌ Error creando pedido:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error completo:', error.response?.data);
    
    if (error.response?.data?.validacion) {
      console.error('Validación técnica:', JSON.stringify(error.response.data.validacion, null, 2));
    }
  }
}

async function main() {
  const loginSuccess = await login();
  if (loginSuccess) {
    await testPedidoSimple();
  }
}

main().catch(console.error);
