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

async function testMulticanal() {
  try {
    // Crear prospecto
    const prospectoResponse = await axios.post(`${BASE_URL}/prospectos`, {
      nombre: 'Cliente Multicanal Debug',
      telefono: '5551234567',
      producto: 'Persianas Screen 5%'
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Prospecto creado:', prospectoResponse.data.prospecto._id);

    // Crear etapa con control multicanal
    const etapaData = {
      prospectoId: prospectoResponse.data.prospecto._id,
      nombreEtapa: 'Test Multicanal Debug',
      comentarios: 'Debug control multicanal',
      piezas: [{
        ubicacion: 'Sala Debug',
        cantidad: 3,
        medidas: [
          {
            ancho: 1.25,
            alto: 3.2,
            area: 4.0,
            producto: 'screen_5',
            productoLabel: 'Persianas Screen 5%',
            color: 'Blanco',
            precioM2: 850,
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'techo',
            eliminacion: 'no',
            risoAlto: 'si',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Screen 5%',
            baseTabla: '15'
          },
          {
            ancho: 1.25,
            alto: 3.2,
            area: 4.0,
            producto: 'screen_5',
            productoLabel: 'Persianas Screen 5%',
            color: 'Blanco',
            precioM2: 850,
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'techo',
            eliminacion: 'no',
            risoAlto: 'si',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Screen 5%',
            baseTabla: '15'
          },
          {
            ancho: 1.25,
            alto: 3.2,
            area: 4.0,
            producto: 'screen_5',
            productoLabel: 'Persianas Screen 5%',
            color: 'Blanco',
            precioM2: 850,
            tipoControl: 'motorizado',
            orientacion: 'centro',
            tipoInstalacion: 'techo',
            eliminacion: 'no',
            risoAlto: 'si',
            risoBajo: 'no',
            sistema: 'estandar',
            telaMarca: 'Screen 5%',
            baseTabla: '15'
          }
        ],
        motorizado: true,
        motorModelo: 'somfy_35nm',
        motorPrecio: 9500,
        controlModelo: 'multicanal_4',
        controlPrecio: 1800,
        observaciones: 'Debug multicanal'
      }]
    };

    console.log('📋 Creando etapa con datos:', JSON.stringify(etapaData, null, 2));

    const etapaResponse = await axios.post(`${BASE_URL}/etapas`, etapaData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Etapa creada exitosamente');

    // Crear cotización
    const cotizacionData = {
      prospecto: prospectoResponse.data.prospecto._id,
      productos: etapaResponse.data.etapa.piezas,
      origen: 'levantamiento',
      comentarios: 'Debug multicanal',
      incluyeInstalacion: true,
      costoInstalacion: 3000,
      descuento: { aplica: true, tipo: 'fijo', valor: 5000 },
      requiereFactura: true
    };

    console.log('💰 Creando cotización con datos:', JSON.stringify(cotizacionData, null, 2));

    const cotizacionResponse = await axios.post(`${BASE_URL}/cotizaciones`, cotizacionData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Cotización creada:', cotizacionResponse.data);

    // Probar Excel
    const excelResponse = await axios.get(`${BASE_URL}/cotizaciones/${cotizacionResponse.data.cotizacion._id}/excel`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('✅ Excel generado exitosamente');

  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error completo:', error.response?.data);
  }
}

login().then(testMulticanal);
