/**
 * Script para extraer texto de todos los PDFs de Documentos Sundeck
 * Genera archivos .txt para que el agente IA pueda leerlos
 */

const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

const PDF_DIR = path.join(__dirname, '../../docs/Documentos Sundeck');
const TXT_DIR = path.join(PDF_DIR, 'TXT');

// Crear directorio TXT si no existe
if (!fs.existsSync(TXT_DIR)) {
  fs.mkdirSync(TXT_DIR, { recursive: true });
}

function extraerTextoPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', errData => {
      reject(new Error(errData.parserError));
    });
    
    pdfParser.on('pdfParser_dataReady', pdfData => {
      try {
        // Extraer texto de todas las páginas
        let texto = '';
        
        if (pdfData.Pages) {
          for (const page of pdfData.Pages) {
            if (page.Texts) {
              for (const textItem of page.Texts) {
                if (textItem.R) {
                  for (const r of textItem.R) {
                    if (r.T) {
                      try {
                        texto += decodeURIComponent(r.T) + ' ';
                      } catch (e) {
                        // Si falla el decode, usar el texto tal cual
                        texto += r.T + ' ';
                      }
                    }
                  }
                }
              }
            }
            texto += '\n\n';
          }
        }
        
        resolve(texto);
      } catch (error) {
        reject(error);
      }
    });
    
    pdfParser.loadPDF(pdfPath);
  });
}

function limpiarTexto(texto) {
  if (!texto) return '';
  
  // Detectar si el texto tiene espacios entre cada letra (problema común de PDFs)
  // Patrón: "H o l a" en lugar de "Hola"
  const tieneEspaciosEntreLetras = /^[A-Za-zÀ-ÿ] [A-Za-zÀ-ÿ] [A-Za-zÀ-ÿ]/.test(texto.trim());
  
  let textoLimpio = texto;
  
  if (tieneEspaciosEntreLetras) {
    // Remover espacios entre letras individuales
    // Buscar patrones de "letra espacio letra espacio letra"
    textoLimpio = texto
      // Unir letras separadas por espacios simples
      .replace(/([A-Za-zÀ-ÿ]) (?=[A-Za-zÀ-ÿ] |[A-Za-zÀ-ÿ]$)/g, '$1')
      // Limpiar espacios múltiples que quedan
      .replace(/  +/g, ' ');
  }
  
  return textoLimpio
    // Normalizar saltos de línea
    .replace(/\r\n/g, '\n')
    // Eliminar múltiples espacios
    .replace(/[ \t]+/g, ' ')
    // Eliminar líneas vacías múltiples
    .replace(/\n{3,}/g, '\n\n')
    // Eliminar espacios al inicio/final de líneas
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim();
}

async function procesarTodosLosPDFs() {
  console.log('🚀 Iniciando extracción de PDFs...\n');
  
  const archivos = fs.readdirSync(PDF_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'));
  
  console.log(`📁 Encontrados ${archivos.length} PDFs\n`);
  
  const resultados = [];
  
  for (const archivo of archivos) {
    const pdfPath = path.join(PDF_DIR, archivo);
    const txtName = archivo.replace('.pdf', '.txt');
    const txtPath = path.join(TXT_DIR, txtName);
    
    console.log(`📄 Procesando: ${archivo}`);
    
    const texto = await extraerTextoPDF(pdfPath);
    
    if (texto) {
      const textoLimpio = limpiarTexto(texto);
      fs.writeFileSync(txtPath, textoLimpio, 'utf8');
      
      const stats = {
        archivo,
        caracteres: textoLimpio.length,
        palabras: textoLimpio.split(/\s+/).length,
        lineas: textoLimpio.split('\n').length
      };
      
      resultados.push(stats);
      console.log(`   ✅ ${stats.palabras} palabras, ${stats.lineas} líneas`);
    } else {
      console.log(`   ❌ Error al procesar`);
    }
  }
  
  // Generar resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE EXTRACCIÓN');
  console.log('='.repeat(50));
  
  let totalPalabras = 0;
  let totalCaracteres = 0;
  
  for (const r of resultados) {
    totalPalabras += r.palabras;
    totalCaracteres += r.caracteres;
  }
  
  console.log(`\n✅ PDFs procesados: ${resultados.length}/${archivos.length}`);
  console.log(`📝 Total palabras: ${totalPalabras.toLocaleString()}`);
  console.log(`📏 Total caracteres: ${totalCaracteres.toLocaleString()}`);
  console.log(`📁 Archivos guardados en: ${TXT_DIR}`);
  
  // Generar archivo consolidado para el agente
  console.log('\n🤖 Generando archivo consolidado para el agente...');
  
  const consolidado = generarArchivoConsolidado(resultados);
  const consolidadoPath = path.join(PDF_DIR, 'CONOCIMIENTO_AGENTE.md');
  fs.writeFileSync(consolidadoPath, consolidado, 'utf8');
  
  console.log(`✅ Archivo consolidado: CONOCIMIENTO_AGENTE.md`);
  console.log('\n🎉 ¡Extracción completada!');
  
  return resultados;
}

function generarArchivoConsolidado(resultados) {
  let contenido = `# 🧠 BASE DE CONOCIMIENTO - AGENTE_IA_SUNDECK
**Generado automáticamente:** ${new Date().toLocaleDateString('es-MX')}
**Total documentos:** ${resultados.length}

---

Este archivo contiene el texto extraído de todos los documentos oficiales de Sundeck.
El agente debe usar esta información como fuente de verdad.

---

`;

  // Categorizar documentos
  const categorias = {
    'VENTAS Y COMERCIAL': [
      '2 Manual procedimiento ventas.txt',
      'Capacitación de ventas.txt',
      'Guia de Preguntas Spin.txt',
      'Métodos y técnicas de venta.txt',
      'Ejemplos de Guiones_.txt',
      'Guion de Cobranza.txt'
    ],
    'PROMOTORÍA': [
      'Manual Promotoria de ventas.txt'
    ],
    'INSTALACIONES': [
      'Protocolo de comunicación Instalaciones.txt',
      'Puntos Clave para una instalación_.txt',
      'Área de instalaciones_.txt',
      'Manual para tomar medidas.txt'
    ],
    'ESTRATEGIA Y DIRECCIÓN': [
      '1 Plan de desarrollo de mercado_.txt',
      'Plan estratégico Anual.txt',
      'Entrenamiento Liderazgo Ventas.txt',
      'Estrategia Redes Sociales.txt'
    ]
  };

  for (const [categoria, archivos] of Object.entries(categorias)) {
    contenido += `\n# ${categoria}\n\n`;
    
    for (const archivo of archivos) {
      const txtPath = path.join(TXT_DIR, archivo);
      
      if (fs.existsSync(txtPath)) {
        const texto = fs.readFileSync(txtPath, 'utf8');
        const nombreDoc = archivo.replace('.txt', '');
        
        contenido += `## 📄 ${nombreDoc}\n\n`;
        contenido += texto;
        contenido += '\n\n---\n\n';
      }
    }
  }

  return contenido;
}

// Ejecutar
procesarTodosLosPDFs().catch(console.error);
