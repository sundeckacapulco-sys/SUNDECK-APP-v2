const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';
let authToken = '';

async function login() {
  const response = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'admin@sundeck.com',
    password: 'password'
  });
  authToken = response.data.token;
  console.log('✅ Login exitoso');
}

async function testFabricacion() {
  try {
    // Crear prospecto
    const prospectoResponse = await axios.post(`${BASE_URL}/prospectos`, {
      nombre: 'Cliente Fabricación',
      telefono: '5551234567',
      producto: 'Test Fabricación'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    // Crear pedido
    const pedidoResponse = await axios.post(`${BASE_URL}/pedidos/desde-etapa`, {
      prospectoId: prospectoResponse.data.prospecto._id,
      piezas: [{
        ubicacion: 'Test',
        cantidad: 1,
        medidas: [{
          ancho: 2.0,
          alto: 2.5,
          area: 5.0,
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
        motorizado: false,
        esToldo: false
      }],
      facturacion: { requiereFactura: false }
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const pedidoId = pedidoResponse.data.pedido._id;
    console.log('✅ Pedido creado:', pedidoId);

    // Intentar crear fabricación
    const fabricacionResponse = await axios.post(`${BASE_URL}/fabricacion/desde-pedido/${pedidoId}`, {
      fechaInicioDeseada: new Date().toISOString(),
      prioridad: 'media'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Fabricación creada:', fabricacionResponse.data);

  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
  }
}

login().then(testFabricacion);
