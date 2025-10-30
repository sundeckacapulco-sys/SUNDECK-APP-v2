const axios = require('axios');
const fs = require('fs');

async function generarExcel() {
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
    
    console.log('📊 Generando Excel de levantamiento...');
    const excelRes = await axios.get(
      `http://localhost:5001/api/proyectos/${proyecto._id}/generar-excel`,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }
    );
    
    const timestamp = Date.now();
    const filename = `./Levantamiento-${timestamp}.xlsx`;
    fs.writeFileSync(filename, excelRes.data);
    
    console.log('✅ Excel generado!');
    console.log('   Tamaño:', (excelRes.data.length / 1024).toFixed(2), 'KB');
    console.log('   Archivo:', filename);
    
    require('child_process').exec(`start "" "${filename}"`);
    
  } catch (error) {
    if (error.response?.data) {
      const errorText = Buffer.from(error.response.data).toString('utf8');
      console.error('❌ Error:', errorText);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

generarExcel();
