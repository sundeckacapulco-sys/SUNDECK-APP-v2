/**
 * Script para probar el sistema completo de producción
 * Ejecutar: node server/scripts/probarSistemaCompleto.js
 */

const mongoose = require('mongoose');
const Almacen = require('../models/Almacen');
const SobranteMaterial = require('../models/SobranteMaterial');
const Proyecto = require('../models/Proyecto');
const AlmacenProduccionService = require('../services/almacenProduccionService');
const logger = require('../config/logger');
require('dotenv').config();

async function probarSistema() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🧪 INICIANDO PRUEBAS DEL SISTEMA\n');
    console.log('='.repeat(60));
    
    // PRUEBA 1: Verificar Inventario
    console.log('\n📦 PRUEBA 1: Verificar Inventario');
    console.log('-'.repeat(60));
    
    const inventario = await Almacen.find({ activo: true });
    console.log(`✅ Total de materiales: ${inventario.length}`);
    
    console.log('\nInventario por tipo:');
    const porTipo = {};
    inventario.forEach(m => {
      porTipo[m.tipo] = (porTipo[m.tipo] || 0) + 1;
    });
    Object.entries(porTipo).forEach(([tipo, cantidad]) => {
      console.log(`   - ${tipo}: ${cantidad} items`);
    });
    
    // PRUEBA 2: Verificar Sobrantes
    console.log('\n♻️  PRUEBA 2: Verificar Sobrantes Disponibles');
    console.log('-'.repeat(60));
    
    const sobrantes = await SobranteMaterial.find({ estado: 'disponible' });
    console.log(`✅ Total de sobrantes: ${sobrantes.length}`);
    
    if (sobrantes.length > 0) {
      console.log('\nSobrantes disponibles:');
      sobrantes.forEach(s => {
        console.log(`   - ${s.etiqueta}: ${s.longitud}m (${s.codigo})`);
      });
    }
    
    // PRUEBA 3: Buscar un proyecto para probar
    console.log('\n🏗️  PRUEBA 3: Buscar Proyecto de Prueba');
    console.log('-'.repeat(60));
    
    const proyecto = await Proyecto.findOne().sort({ createdAt: -1 });
    
    if (!proyecto) {
      console.log('⚠️  No hay proyectos en la base de datos');
      console.log('   Crea un proyecto primero para probar la orden de producción');
      await finalizarPruebas();
      return;
    }
    
    console.log(`✅ Proyecto encontrado: ${proyecto.numero || proyecto._id}`);
    console.log(`   Cliente: ${proyecto.cliente?.nombre || 'Sin nombre'}`);
    
    // Contar piezas
    let totalPiezas = 0;
    if (proyecto.productos) totalPiezas += proyecto.productos.length;
    if (proyecto.cortinas) totalPiezas += proyecto.cortinas.length;
    if (proyecto.toldos) totalPiezas += proyecto.toldos.length;
    
    console.log(`   Total de piezas: ${totalPiezas}`);
    
    if (totalPiezas === 0) {
      console.log('⚠️  El proyecto no tiene piezas');
      await finalizarPruebas();
      return;
    }
    
    // PRUEBA 4: Verificar Disponibilidad de Materiales
    console.log('\n🔍 PRUEBA 4: Verificar Disponibilidad de Materiales');
    console.log('-'.repeat(60));
    
    // Crear piezas de ejemplo para prueba
    const piezasPrueba = [
      {
        numero: 1,
        ubicacion: 'Sala',
        sistema: 'Roller Shade',
        ancho: 2.40,
        alto: 2.00,
        motorizado: false
      },
      {
        numero: 2,
        ubicacion: 'Recámara',
        sistema: 'Roller Shade',
        ancho: 1.80,
        alto: 2.10,
        motorizado: false
      }
    ];
    
    console.log('Piezas de prueba:');
    piezasPrueba.forEach(p => {
      console.log(`   - Pieza ${p.numero}: ${p.ancho}m × ${p.alto}m (${p.ubicacion})`);
    });
    
    // Calcular materiales necesarios
    const materialesNecesarios = [
      { codigo: 'T38-5.80', tipo: 'Tubo', cantidad: 2 },
      { codigo: 'BLACKOUT-3.00', tipo: 'Tela', cantidad: 10 },
      { codigo: 'SL-16', tipo: 'Mecanismo', cantidad: 2 }
    ];
    
    console.log('\nMateriales necesarios:');
    materialesNecesarios.forEach(m => {
      console.log(`   - ${m.codigo}: ${m.cantidad} unidades`);
    });
    
    const disponibilidad = await AlmacenProduccionService.verificarDisponibilidad(materialesNecesarios);
    
    if (disponibilidad.disponible) {
      console.log('\n✅ HAY STOCK SUFICIENTE');
      console.log(`   Materiales disponibles: ${disponibilidad.materiales.length}`);
      
      if (disponibilidad.advertencias.length > 0) {
        console.log('\n⚠️  Advertencias:');
        disponibilidad.advertencias.forEach(adv => {
          console.log(`   - ${adv.codigo}: ${adv.mensaje}`);
        });
      }
    } else {
      console.log('\n❌ STOCK INSUFICIENTE');
      console.log(`   Materiales faltantes: ${disponibilidad.faltantes.length}`);
      disponibilidad.faltantes.forEach(f => {
        console.log(`   - ${f.codigo}: Necesario ${f.necesario}, Disponible ${f.disponible}, Falta ${f.faltante}`);
      });
    }
    
    // PRUEBA 5: Materiales Bajo Stock
    console.log('\n⚠️  PRUEBA 5: Materiales Bajo Stock');
    console.log('-'.repeat(60));
    
    const bajoStock = await Almacen.materialesBajoStock();
    
    if (bajoStock.length > 0) {
      console.log(`⚠️  ${bajoStock.length} material(es) bajo punto de reorden:`);
      bajoStock.forEach(m => {
        console.log(`   - ${m.codigo}: ${m.cantidad} ${m.unidad} (Reorden: ${m.puntoReorden})`);
      });
    } else {
      console.log('✅ Todos los materiales tienen stock adecuado');
    }
    
    // PRUEBA 6: Valor del Inventario
    console.log('\n💰 PRUEBA 6: Valor Total del Inventario');
    console.log('-'.repeat(60));
    
    const valorTotal = await Almacen.valorTotalInventario();
    console.log(`✅ Valor total: $${valorTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`);
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('='.repeat(60));
    console.log(`✅ Inventario: ${inventario.length} materiales`);
    console.log(`✅ Sobrantes: ${sobrantes.length} disponibles`);
    console.log(`✅ Proyectos: ${proyecto ? '1 encontrado' : 'Ninguno'}`);
    console.log(`✅ Disponibilidad: ${disponibilidad.disponible ? 'Stock suficiente' : 'Stock insuficiente'}`);
    console.log(`✅ Alertas: ${bajoStock.length} materiales bajo stock`);
    console.log(`✅ Valor: $${valorTotal.toLocaleString('es-MX')} MXN`);
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS\n');
    
    await finalizarPruebas();
    
  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function finalizarPruebas() {
  await mongoose.connection.close();
  console.log('✅ Conexión cerrada\n');
  process.exit(0);
}

// Ejecutar
probarSistema();
