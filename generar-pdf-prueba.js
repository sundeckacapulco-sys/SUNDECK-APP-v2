// Script para generar PDF de prueba con el nuevo diseño
const pdfService = require('./server/services/pdfService');
const fs = require('fs').promises;

// Datos de prueba para cotización
const cotizacionPrueba = {
  _id: 'test-001',
  numero: 'COT-2025-0001',
  fecha: new Date(),
  validoHasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  origen: 'directa',
  subtotal: 15750.00,
  iva: 2520.00,
  total: 18270.00,
  incluirIVA: true,
  tiempoFabricacion: 15,
  prospecto: {
    _id: 'test-prospecto',
    nombre: 'María González Pérez',
    telefono: '744-123-4567',
    email: 'maria.gonzalez@email.com',
    direccion: 'Av. Costera Miguel Alemán 123, Acapulco, Guerrero'
  },
  productos: [
    {
      _id: 'prod-001',
      nombre: 'Persianas Screen 3%',
      cantidad: 3,
      precioUnitario: 1875.00,
      subtotal: 5625.00,
      medidas: {
        ancho: 2.5,
        alto: 3.0,
        area: 7.5
      },
      color: 'Blanco',
      esToldo: false,
      motorizado: false,
      observaciones: 'Instalación en ventanas principales de sala'
    },
    {
      _id: 'prod-002', 
      nombre: 'Toldo Vertical Motorizado',
      cantidad: 2,
      precioUnitario: 5062.50,
      subtotal: 10125.00,
      medidas: {
        ancho: 3.0,
        alto: 4.0,
        area: 12.0
      },
      color: 'Gris Oxford',
      esToldo: true,
      tipoToldo: 'caida_vertical',
      kitModelo: 'Contempo Premium',
      kitPrecio: 2500.00,
      motorizado: true,
      motorModelo: 'Somfy 35Nm',
      motorPrecio: 3500.00,
      controlModelo: 'Control 4 Canales',
      controlPrecio: 1499.99,
      requiereR24: true,
      observaciones: 'Resistencia anti-huracán R24 incluida'
    }
  ],
  formaPago: {
    anticipo: {
      porcentaje: 60,
      monto: 10962.00,
      condiciones: 'Al confirmar pedido'
    },
    saldo: {
      porcentaje: 40,
      monto: 7308.00,
      condiciones: 'Contra instalación finalizada'
    }
  },
  descuento: {
    aplica: true,
    tipo: 'porcentaje',
    valor: 5,
    monto: 787.50
  },
  elaboradaPor: {
    nombre: 'Carlos',
    apellido: 'Mendoza'
  }
};

async function generarPDFPrueba() {
  console.log('🎨 Generando PDF de prueba con nuevo diseño SUNDECK...\n');
  
  try {
    const startTime = Date.now();
    
    // Generar PDF
    const pdfBuffer = await pdfService.generarCotizacionPDF(cotizacionPrueba);
    
    const endTime = Date.now();
    const tiempo = endTime - startTime;
    
    // Guardar PDF
    const nombreArchivo = `PDF-SUNDECK-NUEVO-DISEÑO-${Date.now()}.pdf`;
    await fs.writeFile(nombreArchivo, pdfBuffer);
    
    console.log('✅ PDF generado exitosamente!');
    console.log(`📁 Archivo: ${nombreArchivo}`);
    console.log(`⏱️  Tiempo: ${tiempo}ms`);
    console.log(`📦 Tamaño: ${Math.round(pdfBuffer.length / 1024)} KB`);
    console.log('\n🎉 ¡Listo para revisar el nuevo diseño!');
    
  } catch (error) {
    console.error('❌ Error generando PDF:', error.message);
  }
}

// Ejecutar
generarPDFPrueba();
