/**
 * Script para probar la generación de orden de producción
 * Ejecutar: node server/scripts/probarOrdenProduccion.js
 */

const mongoose = require('mongoose');
const OrdenProduccionService = require('../services/ordenProduccionService');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
require('dotenv').config();

async function probarOrdenProduccion() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🧪 PROBANDO ORDEN DE PRODUCCIÓN\n');
    console.log('='.repeat(60));
    
    // Buscar el proyecto de prueba
    console.log('\n📋 Buscando proyecto de prueba...');
    const proyecto = await Proyecto.findOne().sort({ createdAt: -1 });
    
    if (!proyecto) {
      console.log('❌ No hay proyectos en la base de datos');
      console.log('   Ejecuta: node server/scripts/crearProyectoPrueba.js');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Proyecto encontrado: ${proyecto.numero || proyecto._id}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre || 'Sin nombre'}`);
    console.log(`   Piezas: ${proyecto.productos?.length || 0}`);
    
    // Generar orden de producción con almacén
    console.log('\n🏭 Generando orden de producción...');
    console.log('-'.repeat(60));
    
    const resultado = await OrdenProduccionService.procesarOrdenConAlmacen(
      proyecto._id,
      new mongoose.Types.ObjectId() // Usuario ficticio
    );
    
    // Mostrar resultado
    console.log('\n📊 RESULTADO DE LA ORDEN\n');
    
    if (!resultado.success) {
      console.log('❌ ORDEN FALLIDA - Stock insuficiente\n');
      
      if (resultado.etapas?.verificacion?.faltantes) {
        console.log('Materiales faltantes:');
        resultado.etapas.verificacion.faltantes.forEach(f => {
          console.log(`   - ${f.codigo}: Necesario ${f.necesario}, Disponible ${f.disponible}, Falta ${f.faltante}`);
        });
      }
      
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('✅ ORDEN GENERADA EXITOSAMENTE\n');
    
    // Resumen de etapas
    console.log('📋 ETAPAS COMPLETADAS:');
    console.log(`   ✅ Verificación: ${resultado.etapas?.verificacion?.disponible ? 'OK' : 'FALLO'}`);
    console.log(`   ✅ Reserva: ${resultado.etapas?.reserva?.total || 0} materiales`);
    console.log(`   ✅ Optimización: ${resultado.etapas?.optimizacion?.resumen?.eficienciaGlobal || 0}% eficiencia`);
    console.log(`   ✅ Salidas: ${resultado.etapas?.salidas?.total || 0} registros`);
    console.log(`   ✅ Sobrantes: ${resultado.etapas?.sobrantes?.total || 0} generados\n`);
    
    // Materiales usados
    if (resultado.materiales && resultado.materiales.length > 0) {
      console.log('📦 MATERIALES USADOS:');
      resultado.materiales.forEach(m => {
        console.log(`   - ${m.codigo}: ${m.cantidad} ${m.unidad} (${m.tipo})`);
      });
      console.log('');
    }
    
    // Sobrantes generados
    if (resultado.sobrantes && resultado.sobrantes.length > 0) {
      console.log('♻️  SOBRANTES GENERADOS:');
      resultado.sobrantes.forEach(s => {
        console.log(`   - ${s.etiqueta}: ${s.longitud}m (${s.codigo})`);
      });
      console.log('');
    }
    
    // ⭐ LISTA DE PEDIDO
    if (resultado.listaPedido) {
      console.log('='.repeat(60));
      console.log('🛒 LISTA DE PEDIDO PARA PROVEEDOR/ALMACÉN');
      console.log('='.repeat(60));
      console.log('');
      
      // Tubos
      if (resultado.listaPedido.tubos && resultado.listaPedido.tubos.length > 0) {
        console.log('📏 TUBOS:');
        resultado.listaPedido.tubos.forEach(tubo => {
          console.log(`   - ${tubo.descripcion}`);
          console.log(`     Código: ${tubo.codigo}`);
          console.log(`     Diámetro: ${tubo.diametro}`);
          console.log(`     Metros lineales: ${tubo.metrosLineales} ml`);
          console.log(`     Barras necesarias: ${tubo.barrasNecesarias} x ${tubo.longitudBarra}m`);
          console.log(`     Cortes óptimos: ${tubo.cortesOptimos} por barra`);
          console.log(`     Desperdicio: ${tubo.desperdicio}%`);
          console.log('');
        });
      }
      
      // Telas
      if (resultado.listaPedido.telas && resultado.listaPedido.telas.length > 0) {
        console.log('🎨 TELAS:');
        resultado.listaPedido.telas.forEach(tela => {
          console.log(`   - ${tela.descripcion}`);
          console.log(`     Código: ${tela.codigo}`);
          console.log(`     Metros lineales: ${tela.metrosLineales} ml`);
          console.log(`     Ancho rollo: ${tela.anchoRollo}m`);
          console.log(`     Rollos necesarios: ${tela.rollosNecesarios}`);
          console.log(`     Puede rotar: ${tela.puedeRotar ? 'Sí' : 'No'}`);
          console.log('');
        });
      }
      
      // Mecanismos
      if (resultado.listaPedido.mecanismos && resultado.listaPedido.mecanismos.length > 0) {
        console.log('⚙️  MECANISMOS Y MOTORES:');
        resultado.listaPedido.mecanismos.forEach(mec => {
          console.log(`   - ${mec.descripcion}`);
          console.log(`     Código: ${mec.codigo}`);
          console.log(`     Cantidad: ${mec.cantidad} ${mec.unidad}`);
          console.log(`     Tipo: ${mec.esMotor ? 'Motor' : 'Mecanismo manual'}`);
          if (mec.observaciones) {
            console.log(`     Obs: ${mec.observaciones}`);
          }
          console.log('');
        });
      }
      
      // Contrapesos
      if (resultado.listaPedido.contrapesos && resultado.listaPedido.contrapesos.length > 0) {
        console.log('⚖️  CONTRAPESOS:');
        resultado.listaPedido.contrapesos.forEach(contra => {
          console.log(`   - ${contra.descripcion}`);
          console.log(`     Código: ${contra.codigo}`);
          console.log(`     Metros lineales: ${contra.metrosLineales} ml`);
          console.log(`     Barras necesarias: ${contra.barrasNecesarias} x ${contra.longitudBarra}m`);
          console.log('');
        });
      }
      
      // Accesorios
      if (resultado.listaPedido.accesorios && resultado.listaPedido.accesorios.length > 0) {
        console.log('🔧 ACCESORIOS:');
        resultado.listaPedido.accesorios.forEach(acc => {
          console.log(`   - ${acc.descripcion}: ${acc.cantidad} ${acc.unidad}`);
        });
        console.log('');
      }
      
      // Resumen
      console.log('='.repeat(60));
      console.log('📊 RESUMEN DE PEDIDO:');
      console.log(`   Total de items: ${resultado.listaPedido.resumen?.totalItems || 0}`);
      console.log(`   Total de barras: ${resultado.listaPedido.resumen?.totalBarras || 0}`);
      console.log(`   Total de rollos: ${resultado.listaPedido.resumen?.totalRollos || 0}`);
      console.log('='.repeat(60));
    } else {
      console.log('\n⚠️  No se generó lista de pedido');
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

probarOrdenProduccion();
