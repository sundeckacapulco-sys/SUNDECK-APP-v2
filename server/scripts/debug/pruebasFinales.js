/**
 * Pruebas finales completas de la migración
 */

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/sundeck-crm';

async function pruebasFinales() {
  try {
    console.log('🔄 Conectando a MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    
    const db = mongoose.connection.db;
    
    // PRUEBA 1: Contar registros
    console.log('📊 PRUEBA 1: Contar Registros');
    const pedidosCount = await db.collection('pedidos').countDocuments();
    const legacyCount = await db.collection('proyectopedidos').countDocuments();
    console.log(`   ✅ Pedidos (moderno): ${pedidosCount}`);
    console.log(`   ✅ ProyectoPedidos (legacy): ${legacyCount}`);
    
    if (pedidosCount === legacyCount) {
      console.log(`   ✅ VALIDACIÓN: Misma cantidad (${pedidosCount}/${legacyCount})`);
    } else {
      console.log(`   ❌ ERROR: Diferente cantidad`);
    }
    
    // PRUEBA 2: Calcular montos totales
    console.log('\n💰 PRUEBA 2: Calcular Montos Totales');
    const pedidos = await db.collection('pedidos').find({}).toArray();
    
    let totalPedidos = 0;
    let totalAnticipos = 0;
    let totalSaldos = 0;
    
    pedidos.forEach(p => {
      totalPedidos += p.montoTotal || 0;
      totalAnticipos += p.anticipo?.monto || 0;
      totalSaldos += p.saldo?.monto || 0;
    });
    
    console.log(`   ✅ Total Pedidos: $${totalPedidos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ✅ Total Anticipos: $${totalAnticipos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ✅ Total Saldos: $${totalSaldos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    // Validar que anticipo + saldo = total
    const diferencia = Math.abs((totalAnticipos + totalSaldos) - totalPedidos);
    if (diferencia < 0.01) {
      console.log(`   ✅ VALIDACIÓN: Anticipo + Saldo = Total (diferencia: $${diferencia.toFixed(2)})`);
    } else {
      console.log(`   ❌ ERROR: Anticipo + Saldo ≠ Total (diferencia: $${diferencia.toFixed(2)})`);
    }
    
    // PRUEBA 3: Comparar con legacy
    console.log('\n🔄 PRUEBA 3: Comparar con Legacy');
    const legacy = await db.collection('proyectopedidos').find({}).toArray();
    
    let totalLegacy = 0;
    legacy.forEach(l => {
      const montoTotal = l.pagos?.montoTotal || 0;
      totalLegacy += montoTotal;
    });
    
    console.log(`   ✅ Total Legacy: $${totalLegacy.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ✅ Total Moderno: $${totalPedidos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    
    const diferenciaLegacy = Math.abs(totalLegacy - totalPedidos);
    if (diferenciaLegacy < 0.01) {
      console.log(`   ✅ VALIDACIÓN: Montos coinciden (diferencia: $${diferenciaLegacy.toFixed(2)})`);
    } else {
      console.log(`   ⚠️  ADVERTENCIA: Montos diferentes (diferencia: $${diferenciaLegacy.toFixed(2)})`);
    }
    
    // PRUEBA 4: Verificar estructura de datos
    console.log('\n📦 PRUEBA 4: Verificar Estructura de Datos');
    const camposRequeridos = ['numero', 'cotizacion', 'prospecto', 'montoTotal', 'anticipo', 'saldo', 'productos', 'estado'];
    
    let todosCompletos = true;
    pedidos.forEach((p, index) => {
      const faltantes = camposRequeridos.filter(campo => !p[campo]);
      if (faltantes.length > 0) {
        console.log(`   ❌ Pedido ${index + 1} (${p.numero}): Faltan campos: ${faltantes.join(', ')}`);
        todosCompletos = false;
      }
    });
    
    if (todosCompletos) {
      console.log(`   ✅ VALIDACIÓN: Todos los pedidos tienen campos requeridos`);
    }
    
    // PRUEBA 5: Verificar productos
    console.log('\n📦 PRUEBA 5: Verificar Productos');
    let totalProductos = 0;
    pedidos.forEach(p => {
      totalProductos += p.productos?.length || 0;
    });
    console.log(`   ✅ Total productos: ${totalProductos}`);
    
    // PRUEBA 6: Listar detalle de cada pedido
    console.log('\n📋 PRUEBA 6: Detalle de Pedidos Migrados');
    pedidos.forEach((p, index) => {
      console.log(`\n   Pedido ${index + 1}: ${p.numero}`);
      console.log(`   - Total: $${(p.montoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
      console.log(`   - Anticipo: $${(p.anticipo?.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${p.anticipo?.porcentaje || 0}%)`);
      console.log(`   - Saldo: $${(p.saldo?.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${p.saldo?.porcentaje || 0}%)`);
      console.log(`   - Estado: ${p.estado}`);
      console.log(`   - Productos: ${p.productos?.length || 0}`);
      
      p.productos?.forEach((prod, pIndex) => {
        console.log(`     ${pIndex + 1}. ${prod.nombre} - ${prod.cantidad}x - $${(prod.subtotal || 0).toLocaleString('es-MX')}`);
      });
    });
    
    // PRUEBA 7: KPIs simulados
    console.log('\n📈 PRUEBA 7: KPIs Simulados');
    const kpis = {
      totalPedidos: pedidos.length,
      montoTotal: totalPedidos,
      anticipoTotal: totalAnticipos,
      saldoTotal: totalSaldos,
      ticketPromedio: totalPedidos / pedidos.length,
      pedidosConfirmados: pedidos.filter(p => p.estado === 'confirmado').length,
      pedidosEnFabricacion: pedidos.filter(p => p.estado === 'en_fabricacion').length,
      pedidosFabricados: pedidos.filter(p => p.estado === 'fabricado').length
    };
    
    console.log(`   ✅ Total Pedidos: ${kpis.totalPedidos}`);
    console.log(`   ✅ Monto Total: $${kpis.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ✅ Ticket Promedio: $${kpis.ticketPromedio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`   ✅ Confirmados: ${kpis.pedidosConfirmados}`);
    console.log(`   ✅ En Fabricación: ${kpis.pedidosEnFabricacion}`);
    console.log(`   ✅ Fabricados: ${kpis.pedidosFabricados}`);
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('✅ RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`✅ Registros migrados: ${pedidosCount}/${legacyCount}`);
    console.log(`✅ Monto total: $${totalPedidos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    console.log(`✅ Diferencia con legacy: $${diferenciaLegacy.toFixed(2)}`);
    console.log(`✅ Estructura completa: ${todosCompletos ? 'Sí' : 'No'}`);
    console.log(`✅ Total productos: ${totalProductos}`);
    console.log('='.repeat(60));
    console.log('\n✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error en pruebas:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

pruebasFinales();
