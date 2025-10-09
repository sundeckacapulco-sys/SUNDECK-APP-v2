const mongoose = require('mongoose');
const Cotizacion = require('../models/Cotizacion');

async function fixCotizaciones() {
  try {
    console.log('🔧 Iniciando corrección de cotizaciones...');
    
    // Obtener todas las cotizaciones, usando .lean() para mayor rendimiento en lecturas masivas
    const cotizaciones = await Cotizacion.find({}, {
      _id: 1,
      numero: 1,
      productos: 1,
      descuento: 1,
      costoInstalacion: 1,
      incluirIVA: 1,
      formaPago: 1,
      subtotal: 1, // Mantener para loguear el valor anterior
      iva: 1,      // Mantener para loguear el valor anterior
      total: 1     // Mantener para loguear el valor anterior
    }).lean(); 

    console.log(`📋 Encontradas ${cotizaciones.length} cotizaciones`);
    
    for (const rawCotizacion of cotizaciones) { 
      const cotizacion = { ...rawCotizacion }; // Crear una copia mutable ya que .lean() devuelve objetos JS planos

      console.log(`\n🔍 Procesando cotización ${cotizacion.numero || cotizacion._id}...`); 
      
      let subtotalCorregido = 0;
      
      // Recalcular subtotales de productos
      if (cotizacion.productos && cotizacion.productos.length > 0) {
        cotizacion.productos = cotizacion.productos.map((producto, index) => {
          const precio = producto.precioUnitario || 0;
          const cantidad = producto.cantidad || 1;
          const unidadMedida = producto.unidadMedida;
          
          let subtotalProducto = 0;
          
          const area = producto.medidas?.area || 0;

          if (['pieza', 'par', 'juego', 'kit'].includes(unidadMedida)) {
            subtotalProducto = precio * cantidad;
          } else {
            subtotalProducto = area * precio * cantidad;
          }
          
          console.log(`  📦 Producto ${index + 1}: ${producto.nombreProducto || producto.nombre || 'Sin nombre'}`); 
          console.log(`     Antes: $${producto.subtotal?.toFixed(2) || '0.00'}`);
          console.log(`     Ahora: $${subtotalProducto.toFixed(2)} (área: ${area.toFixed(2)}m², precio: $${precio.toFixed(2)}, cantidad: ${cantidad})`);
          
          subtotalCorregido += subtotalProducto;
          return { ...producto, subtotal: subtotalProducto }; 
        });
      }
      
      // Calcular totales corregidos
      let descuentoPorcentajeMonto = 0;
      if (cotizacion.descuento?.porcentaje) {
        // Aplicar el porcentaje de descuento al subtotal corregido
        descuentoPorcentajeMonto = subtotalCorregido * (cotizacion.descuento.porcentaje / 100);
      }
      const descuentoMontoTotal = (cotizacion.descuento?.monto || 0) + descuentoPorcentajeMonto;
      
      const subtotalConDescuento = subtotalCorregido - descuentoMontoTotal;
      const subtotalConInstalacion = subtotalConDescuento + (cotizacion.costoInstalacion || 0);
      
      const incluirIVA = cotizacion.incluirIVA !== false; // Por defecto a true si no está definido
      const iva = incluirIVA ? subtotalConInstalacion * 0.16 : 0;
      const totalCorregido = subtotalConInstalacion + iva;
      
      console.log(`  💰 Totales:`);
      console.log(`     Subtotal anterior: $${rawCotizacion.subtotal?.toFixed(2) || '0.00'}`); 
      console.log(`     Subtotal corregido: $${subtotalCorregido.toFixed(2)}`);
      console.log(`     IVA: $${iva.toFixed(2)} (incluir: ${incluirIVA})`);
      console.log(`     Total anterior: $${rawCotizacion.total?.toFixed(2) || '0.00'}`); 
      console.log(`     Total corregido: $${totalCorregido.toFixed(2)}`);
      
      // Recalcular anticipo y saldo
      let formaPagoUpdate = {};
      if (cotizacion.formaPago?.anticipo?.porcentaje) {
        formaPagoUpdate['formaPago.anticipo.monto'] = totalCorregido * (cotizacion.formaPago.anticipo.porcentaje / 100);
      }
      if (cotizacion.formaPago?.saldo?.porcentaje) {
        formaPagoUpdate['formaPago.saldo.monto'] = totalCorregido * (cotizacion.formaPago.saldo.porcentaje / 100);
      }
      
      // Guardar sin ejecutar middlewares (para evitar recálculos)
      await Cotizacion.updateOne(
        { _id: cotizacion._id },
        {
          $set: {
            productos: cotizacion.productos, 
            subtotal: subtotalCorregido,
            iva: iva,
            total: totalCorregido,
            incluirIVA: incluirIVA,
            ...formaPagoUpdate 
          }
        }
      );
      
      console.log(`  ✅ Cotización ${cotizacion.numero || cotizacion._id} actualizada`);
    }
    
    console.log('\n🎉 ¡Todas las cotizaciones han sido corregidas!');
    
  } catch (error) {
    console.error('❌ Error corrigiendo cotizaciones:', error);
    throw error; 
  }
}

module.exports = fixCotizaciones;
