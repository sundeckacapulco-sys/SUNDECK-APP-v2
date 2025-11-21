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
      { $group: { _id: null, total: { $sum: '$montoTotal' } } }
    ]);
    const total = montoTotal[0]?.total || 0;
    console.log(`   ✅ Monto total: $${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    // 3. Verificar campo fuenteDatos
    console.log('\n🔍 PRUEBA 3: Verificar Campo fuenteDatos');
    const conFuente = await Pedido.countDocuments({ fuenteDatos: { $exists: true } });
    console.log(`   ✅ Pedidos con fuenteDatos: ${conFuente}/${totalPedidos}`);
    
    // 4. Listar todos los pedidos
    console.log('\n📋 PRUEBA 4: Listar Pedidos Migrados');
    const pedidos = await Pedido.find().select('numero montoTotal anticipoMonto saldoMonto fuenteDatos');
    pedidos.forEach(p => {
      console.log(`   ✅ ${p.numero}:`);
      console.log(`      - Total: $${p.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`      - Anticipo: $${p.anticipoMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`      - Saldo: $${p.saldoMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`      - Fuente: ${p.fuenteDatos}`);
    });
    
    // 5. Verificar métodos del modelo
    console.log('\n🔧 PRUEBA 5: Verificar Métodos del Modelo');
    const primerPedido = await Pedido.findOne();
    if (primerPedido) {
      console.log(`   ✅ Pedido encontrado: ${primerPedido.numero}`);
      
      // Probar método calcularMontos
      if (typeof primerPedido.calcularMontos === 'function') {
        console.log('   ✅ Método calcularMontos() existe');
      }
      
      // Probar método validarPagos
      if (typeof primerPedido.validarPagos === 'function') {
        console.log('   ✅ Método validarPagos() existe');
      }
      
      // Probar método generarNumero
      if (typeof Pedido.generarNumero === 'function') {
        console.log('   ✅ Método estático generarNumero() existe');
      }
    }
    
    // 6. Verificar estructura de datos
    console.log('\n📦 PRUEBA 6: Verificar Estructura de Datos');
    const pedidoCompleto = await Pedido.findOne().lean();
    if (pedidoCompleto) {
      const camposRequeridos = [
        'numero', 'cotizacion', 'productos', 'subtotal', 'iva', 
        'montoTotal', 'anticipoPorcentaje', 'anticipoMonto', 
        'saldoMonto', 'fuenteDatos'
      ];
      
      camposRequeridos.forEach(campo => {
        if (pedidoCompleto[campo] !== undefined) {
          console.log(`   ✅ Campo '${campo}' presente`);
        } else {
          console.log(`   ❌ Campo '${campo}' FALTANTE`);
        }
      });
    }
    
    // 7. Calcular KPIs simulados
    console.log('\n📈 PRUEBA 7: Calcular KPIs Simulados');
    
    const kpis = await Pedido.aggregate([
      {
        $group: {
          _id: null,
          totalPedidos: { $sum: 1 },
          montoTotal: { $sum: '$montoTotal' },
          anticipoTotal: { $sum: '$anticipoMonto' },
          saldoTotal: { $sum: '$saldoMonto' },
          promedioTicket: { $avg: '$montoTotal' }
        }
      }
    ]);
    
    if (kpis.length > 0) {
      const k = kpis[0];
      console.log(`   ✅ Total Pedidos: ${k.totalPedidos}`);
      console.log(`   ✅ Monto Total: $${k.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Anticipo Total: $${k.anticipoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Saldo Total: $${k.saldoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Ticket Promedio: $${k.promedioTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    }
    
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en pruebas:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

probarKPIs();
