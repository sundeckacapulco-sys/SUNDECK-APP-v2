const mongoose = require('mongoose');
const ProyectoPedido = require('../models/ProyectoPedido');
const Prospecto = require('../models/Prospecto');
const Cotizacion = require('../models/Cotizacion');
const logger = require('../config/logger');

async function crearDatos() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sundeck-crm';
    await mongoose.connect(mongoUri);
    logger.info('Conexión a MongoDB establecida para crear datos simples', {
      script: 'crearDatosSimple',
      mongoUri: process.env.MONGODB_URI ? 'env:MONGODB_URI' : mongoUri
    });

    // Crear prospecto
    const prospecto = new Prospecto({
      nombre: 'Cliente Fabricación Test',
      telefono: '5512345678',
      email: 'test@fabricacion.com',
      producto: 'Persianas',
      estado: 'activo'
    });
    await prospecto.save();
    logger.info('Prospecto de prueba creado', {
      script: 'crearDatosSimple',
      prospectoId: prospecto._id.toString(),
      nombre: prospecto.nombre
    });

    // Crear cotización
    const cotizacion = new Cotizacion({
      prospecto: prospecto._id,
      numero: 'COT-TEST-001',
      productos: [{
        nombre: 'Persiana Test',
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
    logger.info('Cotización de prueba creada', {
      script: 'crearDatosSimple',
      cotizacionId: cotizacion._id.toString(),
      numero: cotizacion.numero,
      prospectoId: prospecto._id.toString()
    });

    // Crear proyecto en fabricación
    const proyecto = new ProyectoPedido({
      prospecto: prospecto._id,
      cotizacion: cotizacion._id,
      creado_por: prospecto._id,
      numero: 'PROY-FAB-001',
      cliente: {
        nombre: 'Cliente Fabricación Test',
        telefono: '5512345678',
        email: 'test@fabricacion.com'
      },
      estado: 'en_fabricacion',
      productos: [{
        nombre: 'Persiana Enrollable Test',
        ubicacion: 'Sala',
        medidas: { ancho: 1.5, alto: 2.0, area: 3.0 },
        cantidad: 1,
        precioUnitario: 2500,
        subtotal: 2500
      }],
      cronograma: {
        fechaPedido: new Date(),
        fechaInicioFabricacion: new Date()
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
          nombre: 'Tela Screen',
          cantidad: 3.5,
          unidad: 'm2',
          disponible: true,
          costo: 150
        }],
        procesos: [{
          nombre: 'Corte de tela',
          descripcion: 'Cortar según medidas',
          orden: 1,
          tiempoEstimado: 2,
          estado: 'completado'
        }],
        costos: {
          materiales: 150,
          manoObra: 200,
          total: 350
        }
      }
    });

    await proyecto.save();
    logger.info('Proyecto de prueba creado para fabricación', {
      script: 'crearDatosSimple',
      proyectoId: proyecto._id.toString(),
      numero: proyecto.numero,
      estado: proyecto.estado
    });
    logger.info('Datos de fabricación de prueba generados', {
      script: 'crearDatosSimple',
      prospectoId: prospecto._id.toString(),
      cotizacionId: cotizacion._id.toString()
    });

  } catch (error) {
    logger.error('Error creando datos simples de fabricación', {
      script: 'crearDatosSimple',
      error: error.message,
      stack: error.stack
    });
  } finally {
    await mongoose.disconnect();
    logger.info('Conexión a MongoDB cerrada tras crear datos simples', {
      script: 'crearDatosSimple'
    });
  }
}

crearDatos();
