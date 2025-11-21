/**
 * Script para verificar que el servidor esté corriendo y respondiendo
 */

const http = require('http');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function verificarPuerto(puerto) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: puerto,
      path: '/api/proyectos',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          activo: true,
          status: res.statusCode,
          puerto: puerto
        });
      });
    });

    req.on('error', () => {
      resolve({ activo: false, puerto: puerto });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ activo: false, puerto: puerto });
    });

    req.end();
  });
}

async function verificar() {
  log('\n🔍 VERIFICANDO SERVIDOR BACKEND\n', 'cyan');
  
  const puertos = [3001, 5000, 8000, 3000, 4000];
  
  log('Probando puertos comunes...', 'yellow');
  
  for (const puerto of puertos) {
    const resultado = await verificarPuerto(puerto);
    
    if (resultado.activo) {
      log(`✅ Puerto ${puerto}: ACTIVO (Status: ${resultado.status})`, 'green');
    } else {
      log(`❌ Puerto ${puerto}: INACTIVO`, 'red');
    }
  }
  
  log('\n📝 INSTRUCCIONES:', 'cyan');
  log('Si ningún puerto está activo, inicia el servidor:', 'yellow');
  log('   cd server', 'reset');
  log('   node index.js', 'reset');
  log('\nO desde la raíz:', 'yellow');
  log('   npm run dev', 'reset');
  
  log('\n💡 VERIFICAR FRONTEND:', 'cyan');
  log('El frontend debe estar configurado para conectarse al backend.', 'yellow');
  log('Revisar archivo: client/src/config/api.js o similar\n', 'reset');
}

verificar();
