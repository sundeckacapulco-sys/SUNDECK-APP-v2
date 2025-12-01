/**
 * AUDITORÍA: Dependencias de Prospecto Legacy
 * Fecha: 6 Noviembre 2025
 */

const fs = require('fs');
const path = require('path');

const resultados = {
  archivos: [],
  totalReferencias: 0,
  porTipo: {
    models: [],
    routes: [],
    controllers: [],
    middleware: [],
    otros: []
  }
};

function buscarEnArchivo(rutaArchivo, contenido) {
  const lineas = contenido.split('\n');
  const referencias = [];
  
  lineas.forEach((linea, index) => {
    if (linea.toLowerCase().includes('prospecto') && 
        !linea.includes('// ') && 
        !linea.includes('* ')) {
      referencias.push({
        linea: index + 1,
        contenido: linea.trim()
      });
    }
  });
  
  return referencias;
}

function escanearDirectorio(directorio) {
  const archivos = fs.readdirSync(directorio);
  
  archivos.forEach(archivo => {
    const rutaCompleta = path.join(directorio, archivo);
    const stats = fs.statSync(rutaCompleta);
    
    if (stats.isDirectory() && !archivo.includes('node_modules') && !archivo.includes('.git')) {
      escanearDirectorio(rutaCompleta);
    } else if (stats.isFile() && archivo.endsWith('.js')) {
      const contenido = fs.readFileSync(rutaCompleta, 'utf8');
      const referencias = buscarEnArchivo(rutaCompleta, contenido);
      
      if (referencias.length > 0) {
        const info = {
          archivo: rutaCompleta.replace(process.cwd(), ''),
          referencias: referencias.length,
          detalles: referencias
        };
        
        resultados.archivos.push(info);
        resultados.totalReferencias += referencias.length;
        
        // Clasificar por tipo
        if (rutaCompleta.includes('models')) {
          resultados.porTipo.models.push(info);
        } else if (rutaCompleta.includes('routes')) {
          resultados.porTipo.routes.push(info);
        } else if (rutaCompleta.includes('controllers')) {
          resultados.porTipo.controllers.push(info);
        } else if (rutaCompleta.includes('middleware')) {
          resultados.porTipo.middleware.push(info);
        } else {
          resultados.porTipo.otros.push(info);
        }
      }
    }
  });
}

console.log('🔍 Escaneando directorio server...\n');
escanearDirectorio(path.join(process.cwd(), 'server'));

console.log('📊 RESULTADOS DE AUDITORÍA\n');
console.log(`Total de archivos con referencias: ${resultados.archivos.length}`);
console.log(`Total de referencias encontradas: ${resultados.totalReferencias}\n`);

console.log('📁 POR CATEGORÍA:\n');
console.log(`Models: ${resultados.porTipo.models.length} archivos`);
console.log(`Routes: ${resultados.porTipo.routes.length} archivos`);
console.log(`Controllers: ${resultados.porTipo.controllers.length} archivos`);
console.log(`Middleware: ${resultados.porTipo.middleware.length} archivos`);
console.log(`Otros: ${resultados.porTipo.otros.length} archivos\n`);

// Generar reporte markdown
let markdown = `# 📊 AUDITORÍA DE DEPENDENCIAS — PROSPECTO LEGACY

**Fecha:** ${new Date().toLocaleString('es-MX')}  
**Total de archivos:** ${resultados.archivos.length}  
**Total de referencias:** ${resultados.totalReferencias}

---

## 📁 RESUMEN POR CATEGORÍA

| Categoría | Archivos | Referencias |
|-----------|----------|-------------|
| Models | ${resultados.porTipo.models.length} | ${resultados.porTipo.models.reduce((sum, a) => sum + a.referencias, 0)} |
| Routes | ${resultados.porTipo.routes.length} | ${resultados.porTipo.routes.reduce((sum, a) => sum + a.referencias, 0)} |
| Controllers | ${resultados.porTipo.controllers.length} | ${resultados.porTipo.controllers.reduce((sum, a) => sum + a.referencias, 0)} |
| Middleware | ${resultados.porTipo.middleware.length} | ${resultados.porTipo.middleware.reduce((sum, a) => sum + a.referencias, 0)} |
| Otros | ${resultados.porTipo.otros.length} | ${resultados.porTipo.otros.reduce((sum, a) => sum + a.referencias, 0)} |

---

## 🔴 ARCHIVOS CRÍTICOS (MODELS)

`;

resultados.porTipo.models.forEach(archivo => {
  markdown += `### ${archivo.archivo}\n`;
  markdown += `**Referencias:** ${archivo.referencias}\n\n`;
  markdown += `\`\`\`javascript\n`;
  archivo.detalles.slice(0, 5).forEach(ref => {
    markdown += `// Línea ${ref.linea}\n${ref.contenido}\n\n`;
  });
  markdown += `\`\`\`\n\n`;
});

markdown += `## 🟡 ARCHIVOS DE RUTAS (ROUTES)

`;

resultados.porTipo.routes.forEach(archivo => {
  markdown += `### ${archivo.archivo}\n`;
  markdown += `**Referencias:** ${archivo.referencias}\n\n`;
});

markdown += `## 🟢 ARCHIVOS DE MIDDLEWARE

`;

resultados.porTipo.middleware.forEach(archivo => {
  markdown += `### ${archivo.archivo}\n`;
  markdown += `**Referencias:** ${archivo.referencias}\n\n`;
});

markdown += `## 📋 OTROS ARCHIVOS

`;

resultados.porTipo.otros.forEach(archivo => {
  markdown += `- ${archivo.archivo} (${archivo.referencias} referencias)\n`;
});

markdown += `\n---

## ✅ PRÓXIMOS PASOS

1. Revisar archivos críticos en Models
2. Desactivar rutas en Routes
3. Eliminar middleware ProyectoSyncMiddleware
4. Actualizar referencias en otros archivos
5. Ejecutar tests de regresión

---

**Generado automáticamente por:** auditoria_dependencias_prospecto.js  
**Fecha:** ${new Date().toISOString()}
`;

// Guardar reporte
const reportePath = path.join(process.cwd(), 'docs', 'proyectos', 'auditorias', 'dependencias_prospecto_legacy.md');
fs.writeFileSync(reportePath, markdown);

console.log(`✅ Reporte generado: ${reportePath}\n`);

// Guardar JSON para procesamiento
const jsonPath = path.join(process.cwd(), 'docs', 'proyectos', 'auditorias', 'dependencias_prospecto_legacy.json');
fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2));

console.log(`✅ Datos JSON guardados: ${jsonPath}\n`);
