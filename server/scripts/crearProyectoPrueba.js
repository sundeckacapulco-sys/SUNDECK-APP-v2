/**
 * Script para crear un proyecto de prueba completo
 * Ejecutar: node server/scripts/crearProyectoPrueba.js
 */

const mongoose = require('mongoose');
const Proyecto = require('../models/Proyecto');
const logger = require('../config/logger');
require('dotenv').config();

async function crearProyectoPrueba() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('\n🏗️  CREANDO PROYECTO DE PRUEBA\n');
    
    const proyectoPrueba = new Proyecto({
      numero: `PRUEBA-${Date.now()}`,
      estado: 'aprobado',
      
      cliente: {
        nombre: 'Cliente Prueba Sistema',
        telefono: '6441234567',
        direccion: {
          calle: 'Calle Prueba #123',
          colonia: 'Centro',
          ciudad: 'Acapulco',
          estado: 'Guerrero',
          codigoPostal: '39300'
        },
        email: 'prueba@sundeck.com'
      },
      
      creado_por: new mongoose.Types.ObjectId(), // Usuario ficticio
      
      productos: [
        {
          numero: 1,
          ubicacion: 'Sala Principal',
          sistema: 'Roller Shade',
          control: 'Derecha',
          ancho: 2.40,
          alto: 2.00,
          motorizado: false,
          galeria: 'Sin galería',
          color: 'Ivory',
          telaMarca: 'Blackout Premium',
          precioUnitario: 2500,
          cantidad: 1,
          subtotal: 2500
        },
        {
          numero: 2,
          ubicacion: 'Recámara Principal',
          sistema: 'Roller Shade',
          control: 'Izquierda',
          ancho: 1.80,
          alto: 2.10,
          motorizado: false,
          galeria: 'Sin galería',
          color: 'Chocolate',
          telaMarca: 'Blackout Premium',
          precioUnitario: 2200,
          cantidad: 1,
          subtotal: 2200
        },
        {
          numero: 3,
          ubicacion: 'Recámara 2',
          sistema: 'Roller Shade',
          control: 'Derecha',
          ancho: 1.50,
          alto: 1.80,
          motorizado: false,
          galeria: 'Sin galería',
          color: 'Gris',
          telaMarca: 'Blackout Premium',
          precioUnitario: 1800,
          cantidad: 1,
          subtotal: 1800
        },
        {
          numero: 4,
          ubicacion: 'Terraza',
          sistema: 'Toldos Contempo',
          control: 'Manual',
          ancho: 3.50,
          alto: 2.50,
          motorizado: false,
          galeria: 'N/A',
          color: 'Blanco',
          telaMarca: 'Screen 5%',
          precioUnitario: 4500,
          cantidad: 1,
          subtotal: 4500
        },
        {
          numero: 5,
          ubicacion: 'Comedor',
          sistema: 'Sheer Elegance',
          control: 'Derecha',
          ancho: 2.20,
          alto: 2.30,
          motorizado: false,
          galeria: 'Sin galería',
          color: 'Beige',
          telaMarca: 'Sheer Elegance',
          precioUnitario: 3200,
          cantidad: 1,
          subtotal: 3200
        }
      ],
      
      total: 14200,
      anticipo: 7100,
      saldo: 7100,
      
      fabricacion: {
        estado: 'pendiente',
        prioridad: 'alta',
        observaciones: 'Proyecto de prueba para validar sistema completo'
      },
      
      cronograma: {
        fechaInicioFabricacion: new Date(),
        fechaFinFabricacionEstimada: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
      },
      
      observaciones: 'Proyecto creado automáticamente para pruebas del sistema de producción'
    });
    
    await proyectoPrueba.save();
    
    console.log('✅ Proyecto de prueba creado exitosamente\n');
    console.log('Detalles:');
    console.log(`   Número: ${proyectoPrueba.numero}`);
    console.log(`   ID: ${proyectoPrueba._id}`);
    console.log(`   Cliente: ${proyectoPrueba.cliente.nombre}`);
    console.log(`   Total de piezas: ${proyectoPrueba.productos.length}`);
    console.log(`   Total: $${proyectoPrueba.total.toLocaleString()}`);
    
    console.log('\nPiezas:');
    proyectoPrueba.productos.forEach(p => {
      console.log(`   ${p.numero}. ${p.ubicacion} - ${p.sistema} (${p.ancho}m × ${p.alto}m)`);
    });
    
    console.log('\n📋 Puedes usar este proyecto para:');
    console.log(`   - Generar orden de producción: POST /api/fabricacion/orden-produccion/${proyectoPrueba._id}`);
    console.log(`   - Generar etiquetas: GET /api/etiquetas/proyecto/${proyectoPrueba._id}`);
    console.log(`   - Ver en frontend: http://localhost:3000/proyectos/${proyectoPrueba._id}`);
    
    console.log('\n');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearProyectoPrueba();
