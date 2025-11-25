const mongoose = require('mongoose');
const Almacen = require('../models/Almacen');

const CATALOGO_BASE = [
  // TELAS (Rollos)
  { codigo: 'TEL-SCR5-W', tipo: 'Tela', descripcion: 'Tela Screen 5% - White', unidad: 'ml', stockMinimo: 30 },
  { codigo: 'TEL-SCR5-B', tipo: 'Tela', descripcion: 'Tela Screen 5% - Beige', unidad: 'ml', stockMinimo: 30 },
  { codigo: 'TEL-BLK-W', tipo: 'Tela', descripcion: 'Tela Blackout - White', unidad: 'ml', stockMinimo: 30 },
  { codigo: 'TEL-BLK-G', tipo: 'Tela', descripcion: 'Tela Blackout - Grey', unidad: 'ml', stockMinimo: 30 },
  
  // TUBOS (Barras)
  { codigo: 'TUB-38', tipo: 'Tubo', descripcion: 'Tubo de Aluminio 38mm', unidad: 'ml', stockMinimo: 20, especificaciones: { diametro: '38mm', longitud: 5.8 } },
  { codigo: 'TUB-43', tipo: 'Tubo', descripcion: 'Tubo de Aluminio 43mm', unidad: 'ml', stockMinimo: 20, especificaciones: { diametro: '43mm', longitud: 5.8 } },
  { codigo: 'TUB-70', tipo: 'Tubo', descripcion: 'Tubo de Aluminio 70mm', unidad: 'ml', stockMinimo: 10, especificaciones: { diametro: '70mm', longitud: 5.8 } },
  
  // CONTRAPESOS
  { codigo: 'CON-PLA-W', tipo: 'Contrapeso', descripcion: 'Contrapeso Plano - White', unidad: 'ml', stockMinimo: 20 },
  { codigo: 'CON-OVA-W', tipo: 'Contrapeso', descripcion: 'Contrapeso Ovalado - White', unidad: 'ml', stockMinimo: 20 },
  
  // MECANISMOS
  { codigo: 'MEC-38', tipo: 'Mecanismo', descripcion: 'Mecanismo Manual 38mm (Clutch + End Cap)', unidad: 'juego', stockMinimo: 10 },
  { codigo: 'MEC-43', tipo: 'Mecanismo', descripcion: 'Mecanismo Manual 43mm (Clutch + End Cap)', unidad: 'juego', stockMinimo: 10 },
  
  // MOTORES
  { codigo: 'MOT-TUB-1', tipo: 'Motor', descripcion: 'Motor Tubular Estándar', unidad: 'pza', stockMinimo: 5 },
  
  // ACCESORIOS
  { codigo: 'ACC-CAD-W', tipo: 'Accesorios', descripcion: 'Cadena Plástica - White', unidad: 'ml', stockMinimo: 100 },
  { codigo: 'ACC-SOP-38', tipo: 'Soportes', descripcion: 'Juego Soportes 38mm', unidad: 'juego', stockMinimo: 20 },
  { codigo: 'ACC-SOP-43', tipo: 'Soportes', descripcion: 'Juego Soportes 43mm', unidad: 'juego', stockMinimo: 20 },
  { codigo: 'ACC-TAP-CON', tipo: 'Tapas', descripcion: 'Juego Tapas Contrapeso', unidad: 'juego', stockMinimo: 50 }
];

async function seedInventoryZero() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sundeck-crm');
    console.log('🔌 Conectado a MongoDB');

    console.log('🌱 Sembrando catálogo base con cantidad 0...');
    
    for (const item of CATALOGO_BASE) {
      await Almacen.findOneAndUpdate(
        { codigo: item.codigo },
        { 
          $set: {
            ...item,
            cantidad: 0,
            reservado: 0,
            activo: true,
            ubicacion: { almacen: 'Almacén General' }
          }
        },
        { upsert: true, new: true }
      );
    }

    console.log(`✅ Catálogo restaurado: ${CATALOGO_BASE.length} items creados/reseteados en 0.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado');
  }
}

seedInventoryZero();
