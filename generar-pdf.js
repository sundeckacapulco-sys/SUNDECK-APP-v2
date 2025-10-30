const axios = require('axios');
const fs = require('fs');

async function generarPDF() {
  try {
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@sundeck.com',
      password: 'password'
    });
    
    const token = loginRes.data.token;
    
    const proyectosRes = await axios.get('http://localhost:5001/api/proyectos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const proyecto = proyectosRes.data.data.docs[0];
    
    console.log('📄 Generando PDF...');
    const pdfRes = await axios.get(
      `http://localhost:5001/api/proyectos/${proyecto._id}/generar-pdf`,
      {
        params: { 
          tipo: 'cotizacion', 
          documentoId: proyecto.cotizacionActual?.cotizacion 
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }
    );
    
    const timestamp = Date.now();
    const filename = `./Cotizacion-FINAL-${timestamp}.pdf`;
    fs.writeFileSync(filename, pdfRes.data);
    
    console.log('✅ PDF generado!');
    console.log('   Tamaño:', (pdfRes.data.length / 1024).toFixed(2), 'KB');
    console.log('   Archivo:', filename);
    
    require('child_process').exec(`start "" "${filename}"`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generarPDF();
