/**
 * Probar que los KPIs funcionan correctamente después de la migración
 */

const mongoose = require('mongoose');
const Pedido = require('../models/Pedido');

const MONGODB_URI = 'mongodb://localhost:27017/sundeck-crm';

async function probarKPIs() {
  try {
    console.log('🔄 Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    
    // 1. Contar pedidos
    console.log('📊 PRUEBA 1: Contar Pedidos');
    const totalPedidos = await Pedido.countDocuments();
    console.log(`   ✅ Total pedidos: ${totalPedidos}`);
    
    // 2. Calcular monto total
    console.log('\n💰 PRUEBA 2: Calcular Monto Total');
    const montoTotal = await Pedido.aggregate([
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const total = montoTotal[0]?.total || 0;
    console.log(`   ✅ Monto total: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    // 3. Ver estructura real de un pedido
    console.log('\n🔍 PRUEBA 3: Ver Estructura Real');
    const pedidoEjemplo = await Pedido.findOne().lean();
    if (pedidoEjemplo) {
      console.log('   Campos disponibles:', Object.keys(pedidoEjemplo).join(', '));
    }
    
    // 4. Listar todos los pedidos
    console.log('\n📋 PRUEBA 4: Listar Pedidos Migrados');
    const pedidos = await Pedido.find().lean();
    pedidos.forEach((p, index) => {
      console.log(`\n   Pedido ${index + 1}:`);
      console.log(`   - ID: ${p._id}`);
      console.log(`   - Número: ${p.numero || 'N/A'}`);
      console.log(`   - Total: $${(p.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - Subtotal: $${(p.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - IVA: $${(p.iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - Anticipo %: ${p.anticipoPorcentaje || 0}%`);
      console.log(`   - Anticipo $: $${(p.anticipoMonto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - Saldo: $${(p.saldoMonto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - Fuente: ${p.fuenteDatos || 'N/A'}`);
      console.log(`   - Productos: ${p.productos?.length || 0}`);
    });
    
    // 5. Verificar métodos del modelo
    console.log('\n🔧 PRUEBA 5: Verificar Métodos del Modelo');
    const primerPedido = await Pedido.findOne();
    if (primerPedido) {
      console.log(`   ✅ Pedido encontrado: ${primerPedido.numero || primerPedido._id}`);
      
      // Probar método calcularMontos
      if (typeof primerPedido.calcularMontos === 'function') {
        console.log('   ✅ Método calcularMontos() existe');
      } else {
        console.log('   ⚠️  Método calcularMontos() NO existe');
      }
      
      // Probar método validarPagos
      if (typeof primerPedido.validarPagos === 'function') {
        console.log('   ✅ Método validarPagos() existe');
      } else {
        console.log('   ⚠️  Método validarPagos() NO existe');
      }
      
      // Probar método generarNumero
      if (typeof Pedido.generarNumero === 'function') {
        console.log('   ✅ Método estático generarNumero() existe');
      } else {
        console.log('   ⚠️  Método estático generarNumero() NO existe');
      }
    }
    
    // 6. Calcular KPIs simulados
    console.log('\n📈 PRUEBA 6: Calcular KPIs Simulados');
    
    const kpis = await Pedido.aggregate([
      {
        $group: {
          _id: null,
          totalPedidos: { $sum: 1 },
          montoTotal: { $sum: '$total' },
          subtotalTotal: { $sum: '$subtotal' },
          ivaTotal: { $sum: '$iva' },
          anticipoTotal: { $sum: '$anticipoMonto' },
          saldoTotal: { $sum: '$saldoMonto' },
          promedioTicket: { $avg: '$total' }
        }
      }
    ]);
    
    if (kpis.length > 0) {
      const k = kpis[0];
      console.log(`   ✅ Total Pedidos: ${k.totalPedidos}`);
      console.log(`   ✅ Subtotal: $${(k.subtotalTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ IVA: $${(k.ivaTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Monto Total: $${(k.montoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Anticipo Total: $${(k.anticipoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Saldo Total: $${(k.saldoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Ticket Promedio: $${(k.promedioTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      
      // Validar que los montos cuadran
      const calculado = (k.subtotalTotal || 0) + (k.ivaTotal || 0);
      const diferencia = Math.abs(calculado - (k.montoTotal || 0));
      
      if (diferencia < 0.01) {
        console.log(`\n   ✅ VALIDACIÓN: Subtotal + IVA = Total (diferencia: $${diferencia.toFixed(2)})`);
      } else {
        console.log(`\n   ⚠️  ADVERTENCIA: Subtotal + IVA ≠ Total (diferencia: $${diferencia.toFixed(2)})`);
      }
      
      const anticipoCalculado = (k.anticipoTotal || 0) + (k.saldoTotal || 0);
      const diferenciaAnticipo = Math.abs(anticipoCalculado - (k.montoTotal || 0));
      
      if (diferenciaAnticipo < 0.01) {
        console.log(`   ✅ VALIDACIÓN: Anticipo + Saldo = Total (diferencia: $${diferenciaAnticipo.toFixed(2)})`);
      } else {
        console.log(`   ⚠️  ADVERTENCIA: Anticipo + Saldo ≠ Total (diferencia: $${diferenciaAnticipo.toFixed(2)})`);
      }
    }
    
    // 7. Comparar con legacy
    console.log('\n🔄 PRUEBA 7: Comparar con Legacy');
    const ProyectoPedido = mongoose.model('ProyectoPedido');
    const legacyCount = await ProyectoPedido.countDocuments();
    const modernoCount = await Pedido.countDocuments();
    
    console.log(`   Legacy: ${legacyCount} registros`);
    console.log(`   Moderno: ${modernoCount} registros`);
    
    if (legacyCount === modernoCount) {
      console.log(`   ✅ VALIDACIÓN: Misma cantidad de registros`);
    } else {
      console.log(`   ⚠️  ADVERTENCIA: Diferente cantidad (diferencia: ${Math.abs(legacyCount - modernoCount)})`);
    }
    
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en pruebas:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

probarKPIs();
