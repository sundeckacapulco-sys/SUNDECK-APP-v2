/**
 * Script para probar orden de producción con proyecto de Huerta
 * Ejecutar: node server/scripts/probarOrdenHuerta.js
 */

const mongoose = require('mongoose');
const OrdenProduccionService = require('../services/ordenProduccionService');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
require('dotenv').config();

async function probarOrdenHuerta() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🧪 PROBANDO ORDEN DE PRODUCCIÓN - PROYECTO HUERTA\n');
    console.log('='.repeat(60));
    
    // Buscar proyecto de Huerta
    console.log('\n📋 Buscando proyecto de Huerta...');
    const proyecto = await Proyecto.findOne({ 
      'cliente.nombre': /Huerta/i 
    });
    
    if (!proyecto) {
      console.log('❌ No se encontró proyecto de Huerta');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Proyecto encontrado: ${proyecto.numero || proyecto._id}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre || 'Sin nombre'}`);
    
    // Verificar piezas
    const piezas = OrdenProduccionService.obtenerPiezasConDetallesTecnicos(proyecto);
    console.log(`   Piezas detectadas: ${piezas.length}\n`);
    
    if (piezas.length === 0) {
      console.log('❌ No se detectaron piezas en el proyecto');
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('📦 PIEZAS DETECTADAS:');
    console.log('-'.repeat(60));
    piezas.forEach(p => {
      console.log(`   ${p.numero}. ${p.ubicacion}`);
      console.log(`      Sistema: ${p.sistema}`);
      console.log(`      Medidas: ${p.ancho}m × ${p.alto}m`);
      console.log(`      Motorizado: ${p.motorizado ? 'Sí' : 'No'}`);
      console.log('');
    });
    
    // Generar orden de producción
    console.log('🏭 Generando orden de producción...');
    console.log('-'.repeat(60));
    
    const resultado = await OrdenProduccionService.procesarOrdenConAlmacen(
      proyecto._id,
      new mongoose.Types.ObjectId()
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
    
    // Etapas
    console.log('📋 ETAPAS:');
    console.log(`   ✅ Verificación: ${resultado.etapas?.verificacion?.disponible ? 'OK' : 'FALLO'}`);
    console.log(`   ✅ Reserva: ${resultado.etapas?.reserva?.total || 0} materiales`);
    console.log(`   ✅ Optimización: ${resultado.etapas?.optimizacion?.resumen?.eficienciaGlobal || 0}% eficiencia`);
    console.log(`   ✅ Salidas: ${resultado.etapas?.salidas?.total || 0} registros`);
    console.log(`   ✅ Sobrantes: ${resultado.etapas?.sobrantes?.total || 0} generados\n`);
    
    // ⭐ LISTA DE PEDIDO
    if (resultado.listaPedido) {
      console.log('='.repeat(60));
      console.log('🛒 LISTA DE PEDIDO PARA PROVEEDOR');
      console.log('='.repeat(60));
      console.log('');
      
      // Tubos
      if (resultado.listaPedido.tubos && resultado.listaPedido.tubos.length > 0) {
        console.log('📏 TUBOS:');
        resultado.listaPedido.tubos.forEach(tubo => {
          console.log(`   ${tubo.descripcion}`);
          console.log(`   └─ Barras: ${tubo.barrasNecesarias} x ${tubo.longitudBarra}m`);
          console.log(`   └─ Metros: ${tubo.metrosLineales} ml`);
          console.log(`   └─ Desperdicio: ${tubo.desperdicio}%\n`);
        });
      }
      
      // Telas
      if (resultado.listaPedido.telas && resultado.listaPedido.telas.length > 0) {
        console.log('🎨 TELAS:');
        resultado.listaPedido.telas.forEach(tela => {
          console.log(`   ${tela.descripcion}`);
          console.log(`   └─ Rollos: ${tela.rollosNecesarios} x ${tela.anchoRollo}m`);
          console.log(`   └─ Metros: ${tela.metrosLineales} ml\n`);
        });
      }
      
      // Mecanismos
      if (resultado.listaPedido.mecanismos && resultado.listaPedido.mecanismos.length > 0) {
        console.log('⚙️  MECANISMOS:');
        resultado.listaPedido.mecanismos.forEach(mec => {
          console.log(`   ${mec.descripcion}: ${mec.cantidad} ${mec.unidad}`);
        });
        console.log('');
      }
      
      // Resumen
      console.log('='.repeat(60));
      console.log('📊 RESUMEN:');
      console.log(`   Barras totales: ${resultado.listaPedido.resumen?.totalBarras || 0}`);
      console.log(`   Rollos totales: ${resultado.listaPedido.resumen?.totalRollos || 0}`);
      console.log(`   Items totales: ${resultado.listaPedido.resumen?.totalItems || 0}`);
      console.log('='.repeat(60));
    }
    
    console.log('\n🎉 PRUEBA COMPLETADA\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
}

probarOrdenHuerta();
