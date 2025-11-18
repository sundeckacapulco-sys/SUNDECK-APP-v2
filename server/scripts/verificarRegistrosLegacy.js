/**
 * Script para verificar qué son los 3 registros legacy detectados
 */

const mongoose = require('mongoose');
const logger = require('../config/logger');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/sundeck')
  .then(() => logger.info('Conectado a MongoDB'))
  .catch(err => {
    logger.error('Error conectando a MongoDB', { error: err.message });
    process.exit(1);
  });

async function verificarRegistrosLegacy() {
  try {
    const ProyectoPedido = require('../models/ProyectoPedido.legacy');
    const Pedido = require('../models/Pedido');
    const Proyecto = require('../models/Proyecto');
    const Prospecto = require('../models/Prospecto');
    
    // Calcular fecha de hace 30 días (mismo período que usa el KPI)
    const fechaFin = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);
    
    console.log('\n=== VERIFICANDO REGISTROS LEGACY ===');
    console.log(`Período: ${fechaInicio.toLocaleDateString()} - ${fechaFin.toLocaleDateString()}\n`);
    
    // 1. Verificar ProyectoPedido.legacy (colección: proyectopedidos)
    const proyectoPedidoLegacy = await ProyectoPedido.find({
      createdAt: { $gte: fechaInicio }
    }).select('numero cliente.nombre producto total estado createdAt').lean();
    
    // 1b. Verificar TODOS los ProyectoPedido (sin filtro de fecha)
    const todosProyectoPedido = await ProyectoPedido.find({})
      .select('numero cliente.nombre producto total estado createdAt')
      .lean();
    
    // 2. Verificar Pedidos con fuenteDatos: 'legacy'
    const pedidosLegacy = await Pedido.find({
      fechaPedido: { $gte: fechaInicio },
      fuenteDatos: 'legacy'
    }).select('numero cliente total estado fechaPedido fuenteDatos').lean();
    
    // 3. Verificar Proyectos con fuenteDatos: 'legacy'
    const proyectosLegacy = await Proyecto.find({
      createdAt: { $gte: fechaInicio },
      fuenteDatos: 'legacy'
    }).select('numero cliente.nombre productos total estado createdAt fuenteDatos').lean();
    
    // 4. Verificar PROSPECTOS con fuenteDatos: 'legacy' ⭐
    const prospectosLegacy = await Prospecto.find({
      createdAt: { $gte: fechaInicio },
      fuenteDatos: 'legacy'
    }).select('nombre telefono producto etapa createdAt fuenteDatos').lean();
    
    console.log('📊 RESUMEN DE REGISTROS LEGACY:\n');
    console.log(`   ProyectoPedido (últimos 30 días): ${proyectoPedidoLegacy.length}`);
    console.log(`   ProyectoPedido (TODOS históricos): ${todosProyectoPedido.length} ⭐⭐`);
    console.log(`   Pedido (fuenteDatos: legacy): ${pedidosLegacy.length}`);
    console.log(`   Proyecto (fuenteDatos: legacy): ${proyectosLegacy.length}`);
    console.log(`   Prospecto (fuenteDatos: legacy): ${prospectosLegacy.length}`);
    console.log(`   TOTAL (30 días): ${proyectoPedidoLegacy.length + pedidosLegacy.length + proyectosLegacy.length + prospectosLegacy.length}\n`);
    
    // Mostrar detalles de cada tipo
    if (pedidosLegacy.length > 0) {
      console.log('\n=== PEDIDOS LEGACY ===\n');
      pedidosLegacy.forEach((ped, index) => {
        console.log(`${index + 1}. ${ped.numero || 'SIN-NUMERO'}`);
        console.log(`   Cliente: ${ped.cliente || 'Sin nombre'}`);
        console.log(`   Total: $${ped.total || 0}`);
        console.log(`   Estado: ${ped.estado || 'Sin estado'}`);
        console.log(`   Fecha: ${ped.fechaPedido || 'Sin fecha'}`);
        console.log(`   Fuente: ${ped.fuenteDatos}`);
        console.log('');
      });
    }
    
    if (proyectosLegacy.length > 0) {
      console.log('\n=== PROYECTOS LEGACY ===\n');
      proyectosLegacy.forEach((proy, index) => {
        console.log(`${index + 1}. ${proy.numero || 'SIN-NUMERO'}`);
        console.log(`   Cliente: ${proy.cliente?.nombre || 'Sin nombre'}`);
        console.log(`   Productos: ${proy.productos?.length || 0}`);
        console.log(`   Total: $${proy.total || 0}`);
        console.log(`   Estado: ${proy.estado || 'Sin estado'}`);
        console.log(`   Fecha: ${proy.createdAt || 'Sin fecha'}`);
        console.log(`   Fuente: ${proy.fuenteDatos}`);
        console.log('');
      });
    }
    
    if (prospectosLegacy.length > 0) {
      console.log('\n=== PROSPECTOS LEGACY ⭐ ===\n');
      prospectosLegacy.forEach((pros, index) => {
        console.log(`${index + 1}. ${pros.nombre || 'SIN-NOMBRE'}`);
        console.log(`   Teléfono: ${pros.telefono || 'Sin teléfono'}`);
        console.log(`   Producto: ${pros.producto || 'Sin producto'}`);
        console.log(`   Etapa: ${pros.etapa || 'Sin etapa'}`);
        console.log(`   Fecha: ${pros.createdAt || 'Sin fecha'}`);
        console.log(`   Fuente: ${pros.fuenteDatos}`);
        console.log('');
      });
    }
    
    // Mostrar TODOS los ProyectoPedido históricos
    if (todosProyectoPedido.length > 0) {
      console.log('\n=== TODOS LOS ProyectoPedido (HISTÓRICOS) ⭐⭐ ===\n');
      todosProyectoPedido.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.numero || 'SIN-NUMERO'}`);
        console.log(`   Cliente: ${reg.cliente?.nombre || 'Sin nombre'}`);
        console.log(`   Producto: ${reg.producto || 'Sin producto'}`);
        console.log(`   Total: $${reg.total || 0}`);
        console.log(`   Estado: ${reg.estado || 'Sin estado'}`);
        console.log(`   Creado: ${reg.createdAt || 'Sin fecha'}`);
        console.log('');
      });
      
      console.log('\n📋 RECOMENDACIÓN:');
      console.log('Estos registros están en la colección ProyectoPedido (modelo legacy)');
      console.log('Deberían migrarse al modelo unificado Proyecto.js');
      console.log('Ejecutar: node server/scripts/migrarProyectoPedidoAProyecto.js');
    } else {
      console.log('\n✅ No hay registros en ProyectoPedido (colección legacy)');
    }
    
  } catch (error) {
    logger.error('Error verificando registros legacy', { 
      error: error.message,
      stack: error.stack 
    });
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

verificarRegistrosLegacy();
