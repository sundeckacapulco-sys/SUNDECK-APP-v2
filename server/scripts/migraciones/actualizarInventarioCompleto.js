/**
 * Script para actualizar inventario con códigos correctos del sistema
 * Ejecutar: node server/scripts/actualizarInventarioCompleto.js
 */

const mongoose = require('mongoose');
const Almacen = require('../models/Almacen');
require('dotenv').config();

async function actualizarInventario() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🔄 ACTUALIZANDO INVENTARIO COMPLETO\n');
    console.log('='.repeat(60));
    
    // Borrar inventario anterior
    console.log('\n🗑️  Eliminando inventario anterior...');
    await Almacen.deleteMany({});
    console.log('✅ Inventario anterior eliminado\n');
    
    // Crear inventario completo con códigos correctos
    const inventario = [
      // TUBOS MANUALES
      {
        codigo: 'T38-M',
        descripcion: 'Tubo 38mm Manual',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 50,
        stockMinimo: 10,
        puntoReorden: 20,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '1' },
        costos: { precioCompra: 150, precioVenta: 250 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      {
        codigo: 'T50-M',
        descripcion: 'Tubo 50mm Manual',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 30,
        stockMinimo: 8,
        puntoReorden: 15,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '1' },
        costos: { precioCompra: 180, precioVenta: 300 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      
      // TUBOS MOTORIZADOS
      {
        codigo: 'T35',
        descripcion: 'Tubo 35mm Motorizado',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 20,
        stockMinimo: 5,
        puntoReorden: 10,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '2' },
        costos: { precioCompra: 200, precioVenta: 350 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      {
        codigo: 'T50',
        descripcion: 'Tubo 50mm Motorizado',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 25,
        stockMinimo: 5,
        puntoReorden: 12,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '2' },
        costos: { precioCompra: 220, precioVenta: 380 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      {
        codigo: 'T70',
        descripcion: 'Tubo 70mm Motorizado',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 15,
        stockMinimo: 3,
        puntoReorden: 8,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '2' },
        costos: { precioCompra: 280, precioVenta: 480 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      {
        codigo: 'T79',
        descripcion: 'Tubo 79mm Motorizado',
        tipo: 'Tubo',
        unidad: 'barra',
        cantidad: 10,
        stockMinimo: 2,
        puntoReorden: 5,
        ubicacion: { almacen: 'Principal', pasillo: 'A', estante: '2' },
        costos: { precioCompra: 350, precioVenta: 600 },
        proveedor: 'Proveedor Tubos SA',
        longitudEstandar: 5.80
      },
      
      // TELAS
      {
        codigo: 'TELA',
        descripcion: 'Tela Blackout Premium',
        tipo: 'Tela',
        unidad: 'ml',
        cantidad: 500,
        stockMinimo: 100,
        puntoReorden: 200,
        ubicacion: { almacen: 'Principal', pasillo: 'B', estante: '1' },
        costos: { precioCompra: 80, precioVenta: 150 },
        proveedor: 'Textiles SA',
        anchosDisponibles: [2.00, 2.50, 3.00]
      },
      {
        codigo: 'TELA-SCREEN',
        descripcion: 'Tela Screen 5%',
        tipo: 'Tela',
        unidad: 'ml',
        cantidad: 400,
        stockMinimo: 80,
        puntoReorden: 150,
        ubicacion: { almacen: 'Principal', pasillo: 'B', estante: '2' },
        costos: { precioCompra: 90, precioVenta: 170 },
        proveedor: 'Textiles SA',
        anchosDisponibles: [2.50, 3.00]
      },
      
      // MECANISMOS
      {
        codigo: 'SL-16',
        descripcion: 'Kit SL-16 (Clutch + Soportes)',
        tipo: 'Mecanismo',
        unidad: 'kit',
        cantidad: 40,
        stockMinimo: 10,
        puntoReorden: 20,
        ubicacion: { almacen: 'Principal', pasillo: 'C', estante: '1' },
        costos: { precioCompra: 250, precioVenta: 450 },
        proveedor: 'Mecanismos SA'
      },
      {
        codigo: 'R-24',
        descripcion: 'Kit R-24 (Clutch + Soportes)',
        tipo: 'Mecanismo',
        unidad: 'kit',
        cantidad: 30,
        stockMinimo: 8,
        puntoReorden: 15,
        ubicacion: { almacen: 'Principal', pasillo: 'C', estante: '1' },
        costos: { precioCompra: 300, precioVenta: 550 },
        proveedor: 'Mecanismos SA'
      },
      {
        codigo: 'MOTOR',
        descripcion: 'Motor Tubular + Soportes',
        tipo: 'Motor',
        unidad: 'pza',
        cantidad: 20,
        stockMinimo: 5,
        puntoReorden: 10,
        ubicacion: { almacen: 'Principal', pasillo: 'C', estante: '2' },
        costos: { precioCompra: 1200, precioVenta: 2000 },
        proveedor: 'Motores SA'
      },
      
      // CADENAS
      {
        codigo: 'CADENA',
        descripcion: 'Cadena de control',
        tipo: 'Accesorios',
        unidad: 'ml',
        cantidad: 200,
        stockMinimo: 50,
        puntoReorden: 100,
        ubicacion: { almacen: 'Principal', pasillo: 'D', estante: '1' },
        costos: { precioCompra: 15, precioVenta: 30 },
        proveedor: 'Accesorios SA'
      },
      
      // ACCESORIOS
      {
        codigo: 'ACCESORIOS',
        descripcion: 'Accesorios varios (conectores, topes)',
        tipo: 'Accesorios',
        unidad: 'pza',
        cantidad: 500,
        stockMinimo: 100,
        puntoReorden: 200,
        ubicacion: { almacen: 'Principal', pasillo: 'D', estante: '2' },
        costos: { precioCompra: 5, precioVenta: 15 },
        proveedor: 'Accesorios SA'
      },
      
      // CONTRAPESOS
      {
        codigo: 'CONTRAPESO',
        descripcion: 'Contrapeso ovalado',
        tipo: 'Contrapeso',
        unidad: 'barra',
        cantidad: 60,
        stockMinimo: 15,
        puntoReorden: 30,
        ubicacion: { almacen: 'Principal', pasillo: 'E', estante: '1' },
        costos: { precioCompra: 120, precioVenta: 220 },
        proveedor: 'Contrapesos SA',
        longitudEstandar: 5.80
      },
      
      // TAPAS
      {
        codigo: 'TAPAS',
        descripcion: 'Tapas laterales',
        tipo: 'Accesorios',
        unidad: 'pza',
        cantidad: 400,
        stockMinimo: 80,
        puntoReorden: 150,
        ubicacion: { almacen: 'Principal', pasillo: 'D', estante: '3' },
        costos: { precioCompra: 8, precioVenta: 20 },
        proveedor: 'Accesorios SA'
      },
      
      // CINTA
      {
        codigo: 'CINTA',
        descripcion: 'Cinta adhesiva doble cara',
        tipo: 'Accesorios',
        unidad: 'ml',
        cantidad: 300,
        stockMinimo: 60,
        puntoReorden: 120,
        ubicacion: { almacen: 'Principal', pasillo: 'D', estante: '4' },
        costos: { precioCompra: 10, precioVenta: 25 },
        proveedor: 'Accesorios SA'
      },
      
      // INSERTOS
      {
        codigo: 'INSERTOS',
        descripcion: 'Insertos de contrapeso',
        tipo: 'Accesorios',
        unidad: 'ml',
        cantidad: 250,
        stockMinimo: 50,
        puntoReorden: 100,
        ubicacion: { almacen: 'Principal', pasillo: 'E', estante: '2' },
        costos: { precioCompra: 12, precioVenta: 28 },
        proveedor: 'Accesorios SA'
      },
      
      // GALERÍA
      {
        codigo: 'GALERÍA',
        descripcion: 'Madera para galería',
        tipo: 'Accesorios',
        unidad: 'pza',
        cantidad: 50,
        stockMinimo: 10,
        puntoReorden: 20,
        ubicacion: { almacen: 'Principal', pasillo: 'F', estante: '1' },
        costos: { precioCompra: 180, precioVenta: 350 },
        proveedor: 'Maderas SA',
        longitudEstandar: 2.40
      }
    ];
    
    console.log('📦 Cargando inventario...\n');
    
    let valorTotal = 0;
    for (const item of inventario) {
      const material = new Almacen(item);
      await material.save();
      
      const valor = item.cantidad * item.costos.precioCompra;
      valorTotal += valor;
      
      console.log(`   ✅ ${item.codigo} - ${item.descripcion}`);
      console.log(`      Stock: ${item.cantidad} ${item.unidad}`);
      console.log(`      Valor: $${valor.toLocaleString()}`);
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log('✅ INVENTARIO ACTUALIZADO CORRECTAMENTE\n');
    console.log(`📊 Total de materiales: ${inventario.length}`);
    console.log(`💰 Valor total: $${valorTotal.toLocaleString()} MXN\n`);
    
    // Resumen por tipo
    const porTipo = {};
    inventario.forEach(item => {
      porTipo[item.tipo] = (porTipo[item.tipo] || 0) + 1;
    });
    
    console.log('📋 Materiales por tipo:');
    Object.entries(porTipo).forEach(([tipo, cantidad]) => {
      console.log(`   - ${tipo}: ${cantidad} items`);
    });
    
    console.log('\n🎉 Sistema listo para procesar órdenes de producción\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

actualizarInventario();
