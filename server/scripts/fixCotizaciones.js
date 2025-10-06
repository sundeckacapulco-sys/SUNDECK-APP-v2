const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');

// Función que no conecta a la base de datos (asume que ya está conectada)
// Se usa cuando se llama desde la API

async function fixCotizaciones() {
  try {
    console.log('🔧 Iniciando corrección de cotizaciones...');
    
    // Obtener todas las cotizaciones
    const cotizaciones = await Cotizacion.find({}).populate('prospecto');
    console.log(`📋 Encontradas ${cotizaciones.length} cotizaciones`);
    
    for (const cotizacion of cotizaciones) {
      console.log(`\n🔍 Procesando cotización ${cotizacion.numero}...`);
      
      let subtotalCorregido = 0;
      
      // Recalcular subtotales de productos
      if (cotizacion.productos && cotizacion.productos.length > 0) {
        cotizacion.productos.forEach((producto, index) => {
          const precio = producto.precioUnitario || 0;
          const cantidad = producto.cantidad || 1;
          const unidadMedida = producto.unidadMedida;
          
          let subtotalProducto = 0;
          
          if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
            // Productos por pieza: precio × cantidad
            subtotalProducto = precio * cantidad;
          } else {
            // Productos por área o lineales: área × precio × cantidad
            const area = producto.medidas?.area || 0;
            subtotalProducto = area * precio * cantidad;
          }
          
          console.log(`  📦 Producto ${index + 1}: ${producto.nombre}`);
          console.log(`     Antes: $${producto.subtotal || 0}`);
          console.log(`     Ahora: $${subtotalProducto} (área: ${producto.medidas?.area || 0}m², precio: $${precio}, cantidad: ${cantidad})`);
          
          // Actualizar subtotal del producto
          producto.subtotal = subtotalProducto;
          subtotalCorregido += subtotalProducto;
        });
      }
      
      // Calcular totales corregidos
      const descuentoMonto = (cotizacion.descuento?.monto || 0) + 
                            (cotizacion.subtotal * (cotizacion.descuento?.porcentaje || 0) / 100);
      
      const subtotalConDescuento = subtotalCorregido - descuentoMonto;
      const subtotalConInstalacion = subtotalConDescuento + (cotizacion.costoInstalacion || 0);
      
      // Determinar si incluye IVA (si no está definido, asumir que sí)
      const incluirIVA = cotizacion.incluirIVA !== false;
      const iva = incluirIVA ? subtotalConInstalacion * 0.16 : 0;
      const totalCorregido = subtotalConInstalacion + iva;
      
      console.log(`  💰 Totales:`);
      console.log(`     Subtotal anterior: $${cotizacion.subtotal || 0}`);
      console.log(`     Subtotal corregido: $${subtotalCorregido}`);
      console.log(`     IVA: $${iva} (incluir: ${incluirIVA})`);
      console.log(`     Total anterior: $${cotizacion.total || 0}`);
      console.log(`     Total corregido: $${totalCorregido}`);
      
      // Actualizar cotización
      cotizacion.subtotal = subtotalCorregido;
      cotizacion.iva = iva;
      cotizacion.total = totalCorregido;
      cotizacion.incluirIVA = incluirIVA;
      
      // Recalcular anticipo y saldo
      if (cotizacion.formaPago?.anticipo?.porcentaje) {
        cotizacion.formaPago.anticipo.monto = totalCorregido * (cotizacion.formaPago.anticipo.porcentaje / 100);
      }
      if (cotizacion.formaPago?.saldo?.porcentaje) {
        cotizacion.formaPago.saldo.monto = totalCorregido * (cotizacion.formaPago.saldo.porcentaje / 100);
      }
      
      // Guardar sin ejecutar middlewares (para evitar recálculos)
      await Cotizacion.updateOne(
        { _id: cotizacion._id },
        {
          $set: {
            productos: cotizacion.productos,
            subtotal: cotizacion.subtotal,
            iva: cotizacion.iva,
            total: cotizacion.total,
            incluirIVA: cotizacion.incluirIVA,
            'formaPago.anticipo.monto': cotizacion.formaPago?.anticipo?.monto,
            'formaPago.saldo.monto': cotizacion.formaPago?.saldo?.monto
          }
        }
      );
      
      console.log(`  ✅ Cotización ${cotizacion.numero} actualizada`);
    }
    
    console.log('\n🎉 ¡Todas las cotizaciones han sido corregidas!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo cotizaciones:', error);
    throw error; // Re-lanzar el error para que la API lo maneje
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixCotizaciones();
}

module.exports = fixCotizaciones;
