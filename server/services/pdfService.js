const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;
const companyConfig = require('../config/company');

// Variable para carga lazy de puppeteer
let puppeteerLib;

class PDFService {
  constructor() {
    this.browser = null;
    // Definición de controles multicanal
    this.modelosControles = [
      { label: "Control Monocanal (1 cortina)", value: "monocanal", canales: 1, esMulticanal: false },
      { label: "Control 4 Canales", value: "multicanal_4", canales: 4, esMulticanal: true },
      { label: "Control 5 Canales", value: "multicanal_5", canales: 5, esMulticanal: true },
      { label: "Control 15 Canales", value: "multicanal_15", canales: 15, esMulticanal: true },
      { label: "Control Multicanal Genérico", value: "multicanal", canales: 4, esMulticanal: true },
      { label: "Otro (especificar)", value: "otro_manual", canales: 1, esMulticanal: false }
    ];
  }

  // Función para calcular precio de control considerando multicanal
  calcularPrecioControlReal(pieza, todasLasPiezas) {
    if (!pieza.motorizado || !pieza.controlPrecio) return 0;
    
    // Usar la nueva lógica simplificada
    if (pieza.esControlMulticanal) {
      // Control multicanal: solo cobrar una vez por partida
      return Number(pieza.controlPrecio) || 0;
    } else {
      // Control individual: cobrar por cada motor/pieza
      const numMotores = pieza.numMotores || 1;
      return (Number(pieza.controlPrecio) || 0) * numMotores;
    }
  }

  async initBrowser() {
    try {
      // Intentar con puppeteer primero
      if (!puppeteerLib) {
        try {
          puppeteerLib = require('puppeteer');
        } catch (e) {
          // Si puppeteer no está disponible, intentar con html-pdf-node
          try {
            const htmlPdf = require('html-pdf-node');
            return { htmlPdf, isAlternative: true };
          } catch (e2) {
            throw new Error('Ni puppeteer ni html-pdf-node están disponibles. Instala una de estas dependencias: npm install puppeteer o npm install html-pdf-node');
          }
        }
      }
      
      const browser = await puppeteerLib.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--force-color-profile=srgb',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      
      return { browser, isAlternative: false };
    } catch (error) {
      // Fallback a html-pdf-node si puppeteer falla
      try {
        const htmlPdf = require('html-pdf-node');
        return { htmlPdf, isAlternative: true };
      } catch (e) {
        throw new Error('Error inicializando generador de PDF. Instala puppeteer o html-pdf-node: npm install puppeteer');
      }
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  }

  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Calcular tiempo de instalación inteligente COMPLEJO
  calcularTiempoInstalacionInteligente(cotizacion) {
    console.log('🤖 Iniciando cálculo COMPLEJO de tiempo de instalación...');
    
    let tiempoBaseDias = 0;
    let factoresComplejidad = {
      andamios: 0,
      obraElectrica: 0,
      alturaExtrema: 0,
      motorizacionCompleja: 0,
      diversidadProductos: 0,
      areaGrande: 0,
      instalacionExterior: 0,
      sistemasPremium: 0
    };
    
    let areaTotal = 0;
    let tiposProductos = new Set();
    let productosMotorizados = 0;
    let productosExterior = 0;
    let requiereAndamios = false;
    let requiereObraElectrica = false;
    
    if (cotizacion.productos && Array.isArray(cotizacion.productos)) {
      cotizacion.productos.forEach(producto => {
        const medidas = producto.medidas || producto.medidasIndividuales || [];
        const medidasArray = Array.isArray(medidas) ? medidas : [medidas];
        
        medidasArray.forEach(medida => {
          if (!medida || typeof medida !== 'object') return;
          
          const ancho = parseFloat(medida.ancho) || 0;
          const alto = parseFloat(medida.alto) || 0;
          const area = parseFloat(medida.area) || (ancho * alto);
          const esMotorizado = Boolean(producto.motorizado);
          const esToldo = Boolean(producto.esToldo);
          const productoNombre = (medida.producto || producto.nombre || '').toLowerCase();
          const tipoInstalacion = medida.tipoInstalacion || 'interior';
          const sistema = medida.sistema || 'estandar';
          
          areaTotal += area;
          tiposProductos.add(productoNombre);
          
          // === CÁLCULO BASE POR TIPO DE PRODUCTO ===
          if (esToldo || productoNombre.includes('toldo')) {
            // TOLDOS: Más complejos, especialmente motorizados
            if (area > 20) {
              tiempoBaseDias += 2.5; // Toldos grandes
            } else if (area > 10) {
              tiempoBaseDias += 1.5; // Toldos medianos
            } else {
              tiempoBaseDias += 1.0; // Toldos pequeños
            }
            
            if (esMotorizado) {
              tiempoBaseDias += 0.5; // Complejidad motorización
              productosMotorizados++;
            }
            
          } else if (productoNombre.includes('blackout') && esMotorizado) {
            // BLACKOUT MOTORIZADO: Precisión alta
            tiempoBaseDias += 0.4 * (producto.cantidad || 1);
            productosMotorizados++;
            
          } else if (productoNombre.includes('screen') || productoNombre.includes('persiana')) {
            // PERSIANAS SCREEN: Según motorización
            if (esMotorizado) {
              tiempoBaseDias += 0.3 * (producto.cantidad || 1);
              productosMotorizados++;
            } else {
              tiempoBaseDias += 0.15 * (producto.cantidad || 1);
            }
            
          } else if (productoNombre.includes('cortina')) {
            // CORTINAS TRADICIONALES: Más rápidas
            tiempoBaseDias += 0.2 * (producto.cantidad || 1);
            
          } else {
            // PRODUCTOS GENÉRICOS
            tiempoBaseDias += esMotorizado ? 0.4 : 0.2;
            if (esMotorizado) productosMotorizados++;
          }
          
          // === FACTORES DE COMPLEJIDAD ===
          
          // Altura extrema (andamios)
          if (alto > 4.0) {
            requiereAndamios = true;
            factoresComplejidad.andamios = Math.max(factoresComplejidad.andamios, 2);
            if (alto > 6.0) factoresComplejidad.alturaExtrema = 1;
          } else if (alto > 3.0) {
            factoresComplejidad.andamios = Math.max(factoresComplejidad.andamios, 1);
          }
          
          // Instalación exterior
          if (tipoInstalacion === 'exterior') {
            productosExterior++;
            factoresComplejidad.instalacionExterior = Math.max(factoresComplejidad.instalacionExterior, 0.5);
          }
          
          // Sistemas premium
          if (sistema === 'premium') {
            factoresComplejidad.sistemasPremium += 0.3;
          }
        });
        
        // Obra eléctrica (detectar por propiedades del producto)
        if (producto.requiereObraElectrica || producto.costoObraElectrica > 0) {
          requiereObraElectrica = true;
          factoresComplejidad.obraElectrica = 1.5;
        }
        
        // Motorización compleja (controles multicanal)
        if (producto.controlModelo && producto.controlModelo.includes('multicanal')) {
          factoresComplejidad.motorizacionCompleja += 0.5;
        }
      });
    }
    
    // === FACTORES ADICIONALES ===
    
    // Diversidad de productos (más tipos = más complejidad)
    const numTiposProductos = tiposProductos.size;
    if (numTiposProductos >= 4) {
      factoresComplejidad.diversidadProductos = 1.5;
    } else if (numTiposProductos >= 3) {
      factoresComplejidad.diversidadProductos = 1.0;
    } else if (numTiposProductos >= 2) {
      factoresComplejidad.diversidadProductos = 0.5;
    }
    
    // Área grande del proyecto
    if (areaTotal > 50) {
      factoresComplejidad.areaGrande = 1.5;
    } else if (areaTotal > 30) {
      factoresComplejidad.areaGrande = 1.0;
    } else if (areaTotal > 20) {
      factoresComplejidad.areaGrande = 0.5;
    }
    
    // === CÁLCULO FINAL ===
    
    // Sumar todos los factores de complejidad
    const complejidadTotal = Object.values(factoresComplejidad).reduce((sum, factor) => sum + factor, 0);
    
    // Tiempo final = tiempo base + factores de complejidad
    let tiempoFinal = Math.ceil(tiempoBaseDias + complejidadTotal);
    
    // Mínimo 1 día, máximo 10 días para proyectos residenciales
    tiempoFinal = Math.max(1, Math.min(10, tiempoFinal));
    
    // === LOG DETALLADO ===
    console.log('📊 ANÁLISIS COMPLEJO DE INSTALACIÓN:');
    console.log(`- Área total: ${areaTotal.toFixed(1)}m²`);
    console.log(`- Tipos de productos: ${numTiposProductos} (${Array.from(tiposProductos).join(', ')})`);
    console.log(`- Productos motorizados: ${productosMotorizados}`);
    console.log(`- Productos exterior: ${productosExterior}`);
    console.log(`- Requiere andamios: ${requiereAndamios}`);
    console.log(`- Requiere obra eléctrica: ${requiereObraElectrica}`);
    console.log(`- Tiempo base: ${tiempoBaseDias.toFixed(1)} días`);
    console.log('- Factores complejidad:', factoresComplejidad);
    console.log(`- Complejidad total: +${complejidadTotal.toFixed(1)} días`);
    console.log(`🎯 TIEMPO FINAL: ${tiempoFinal} días`);
    
    return tiempoFinal;
  }

  async generarCotizacionPDF(cotizacion) {
    const cotizacionId =
      typeof cotizacion?.toObject === 'function'
        ? cotizacion?._id?.toString?.()
        : cotizacion?._id || cotizacion?.id;

    try {
      console.log('🧾 [PDF] Iniciando generación de cotización', {
        cotizacionId,
        numero: cotizacion?.numero,
        productos: cotizacion?.productos?.length || 0,
        incluirIVA: cotizacion?.incluirIVA,
        total: cotizacion?.total,
        prospecto: {
          id: cotizacion?.prospecto?._id || cotizacion?.prospecto?.id,
          nombre: cotizacion?.prospecto?.nombre
        }
      });

      const browserInitResult = await this.initBrowser();
      const isAlternative = Boolean(browserInitResult?.isAlternative);
      const browser = browserInitResult?.browser || browserInitResult;

      console.log('🧾 [PDF] Motor de render inicializado', {
        cotizacionId,
        isAlternative,
        hasNewPageMethod: typeof browser?.newPage === 'function'
      });

      if (!browser || typeof browser.newPage !== 'function') {
        console.error('❌ [PDF] Motor de render inválido para generar cotización', {
          cotizacionId,
          isAlternative,
          availableKeys: browser ? Object.keys(browser) : null
        });
        throw new Error('Motor de generación de PDF no disponible para cotizaciones');
      }

      const page = await browser.newPage();
      
      // Configurar página para mejor calidad de texto
      await page.setViewport({ 
        width: 1200, 
        height: 1600, 
        deviceScaleFactor: 2 // Mejora la resolución del texto
      });

      // Template HTML para la cotización
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cotización {{numero}} - SUNDECK</title>
          <style>
            /* ===== VARIABLES CSS SUNDECK ===== */
            :root {
              --sundeck-azul-principal: #1E40AF;
              --sundeck-azul-claro: #3B82F6;
              --sundeck-azul-suave: #DBEAFE;
              --sundeck-dorado: #D4AF37;
              --sundeck-dorado-claro: #F59E0B;
              --sundeck-dorado-suave: #FEF3C7;
              --sundeck-gris-oscuro: #374151;
              --sundeck-gris-medio: #6B7280;
              --sundeck-gris-claro: #F3F4F6;
              --sundeck-gris-muy-claro: #F9FAFB;
              --sundeck-blanco: #FFFFFF;
              --sundeck-verde: #10B981;
              --sundeck-verde-suave: #D1FAE5;
              --sundeck-rojo: #EF4444;
              --sundeck-rojo-suave: #FEE2E2;
              --sundeck-amarillo: #F59E0B;
              --sundeck-amarillo-suave: #FEF3C7;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              line-height: 1.5;
              color: var(--sundeck-gris-oscuro);
              font-size: 12px;
              background: var(--sundeck-blanco);
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 0;
              background: var(--sundeck-blanco);
            }
            
            /* ===== HEADER MODERNIZADO ===== */
            .header {
              background: linear-gradient(135deg, var(--sundeck-azul-principal) 0%, var(--sundeck-azul-claro) 100%);
              color: var(--sundeck-blanco);
              padding: 25px 30px;
              margin: -20px -20px 30px -20px;
              border-radius: 0 0 12px 12px;
              border-bottom: 3px solid var(--sundeck-azul-principal);
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .logo {
              display: flex;
              align-items: center;
            }
            
            .logo-container {
              background: var(--sundeck-blanco);
              padding: 10px 20px;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .logo img {
              height: 60px;
              width: auto;
            }
            
            .company-info {
              text-align: right;
              font-size: 11px;
              color: var(--sundeck-azul-suave);
              line-height: 1.4;
            }
            
            .company-info strong {
              color: var(--sundeck-blanco);
              font-size: 13px;
              display: block;
              margin-bottom: 5px;
            }
            
            /* ===== INFORMACIÓN DE COTIZACIÓN MODERNIZADA ===== */
            .cotizacion-info {
              background: var(--sundeck-dorado-suave);
              border: 2px solid var(--sundeck-dorado);
              padding: 40px 30px 25px 30px;
              border-radius: 10px;
              margin: 0 20px 30px 20px;
              position: relative;
            }
            
            
            .cotizacion-info h2 {
              position: absolute;
              top: 15px;
              right: 20px;
              color: var(--sundeck-gris-oscuro);
              margin: 0;
              font-size: 14px;
              text-align: right;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-weight: 600;
              z-index: 2;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              position: relative;
              z-index: 1;
            }
            
            .info-item {
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .info-label {
              font-weight: 600;
              color: var(--sundeck-gris-oscuro);
              min-width: 120px;
              font-size: 11px;
            }
            
            .info-value {
              color: var(--sundeck-azul-principal);
              font-weight: 500;
              font-size: 12px;
            }
            
            /* ===== INFORMACIÓN DEL CLIENTE MODERNIZADA ===== */
            .cliente-info {
              background: var(--sundeck-gris-muy-claro);
              border: 1px solid var(--sundeck-gris-claro);
              border-radius: 8px;
              padding: 20px 25px;
              margin: 0 20px 30px 20px;
            }
            
            .cliente-info h3 {
              color: var(--sundeck-azul-principal);
              margin-bottom: 18px;
              font-size: 16px;
              font-weight: 700;
              border-bottom: 3px solid var(--sundeck-dorado);
              padding-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .cliente-info h3::before {
              content: '👤';
              font-size: 18px;
            }
            
            /* ===== TABLA DE PRODUCTOS MODERNIZADA ===== */
            .productos-section {
              margin: 0 20px 30px 20px;
            }
            
            .productos-section h3 {
              color: var(--sundeck-azul-principal);
              margin-bottom: 20px;
              font-size: 18px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .productos-section h3::before {
              content: '📦';
              font-size: 20px;
            }
            
            .productos-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              margin-bottom: 30px;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid var(--sundeck-gris-claro);
              page-break-inside: auto;
            }
            
            .productos-table th,
            .productos-table td {
              padding: 15px 12px;
              text-align: left;
              border: none;
              border-bottom: 1px solid var(--sundeck-gris-claro);
            }
            
            .productos-table th {
              background: var(--sundeck-azul-principal);
              color: var(--sundeck-blanco);
              font-weight: 700;
              text-align: center;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .productos-table th:first-child {
              border-top-left-radius: 8px;
            }
            
            .productos-table th:last-child {
              border-top-right-radius: 8px;
            }
            
            .productos-table tr:nth-child(even) {
              background-color: var(--sundeck-gris-muy-claro);
            }
            
            .productos-table tr:hover {
              background-color: var(--sundeck-azul-suave);
            }
            
            .productos-table tr:last-child td:first-child {
              border-bottom-left-radius: 8px;
            }
            
            .productos-table tr:last-child td:last-child {
              border-bottom-right-radius: 8px;
            }
            
            /* ===== SECCIÓN DE TOTALES MODERNIZADA ===== */
            .totales {
              background: var(--sundeck-gris-muy-claro);
              border: 2px solid var(--sundeck-dorado);
              padding: 25px 30px;
              border-radius: 10px;
              margin: 0 20px 30px 20px;
              position: relative;
            }
            
            .totales::before {
              content: '💰';
              position: absolute;
              top: -15px;
              left: 25px;
              background: var(--sundeck-dorado);
              color: var(--sundeck-blanco);
              width: 30px;
              height: 30px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              border: 2px solid var(--sundeck-blanco);
            }
            
            .totales h3 {
              color: var(--sundeck-dorado);
              margin-bottom: 20px;
              font-size: 18px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .totales-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
            }
            
            .total-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding: 8px 12px;
              background: var(--sundeck-blanco);
              border-radius: 6px;
              border-left: 4px solid var(--sundeck-azul-claro);
              border: 1px solid var(--sundeck-gris-claro);
            }
            
            .total-item span:first-child {
              font-weight: 600;
              color: var(--sundeck-gris-oscuro);
              font-size: 11px;
            }
            
            .total-item span:last-child {
              font-weight: 700;
              color: var(--sundeck-azul-principal);
              font-size: 12px;
            }
            
            .total-final {
              border: 3px solid var(--sundeck-dorado);
              border-left: 6px solid var(--sundeck-dorado);
              background: var(--sundeck-dorado-suave);
              padding: 15px 20px;
              margin-top: 15px;
              font-weight: 800;
              font-size: 16px;
              color: var(--sundeck-dorado);
              text-transform: uppercase;
              letter-spacing: 1px;
              border-radius: 6px;
            }
            
            .total-final span:last-child {
              font-size: 18px;
              color: var(--sundeck-dorado);
            }
            
            .condiciones {
              margin-bottom: 30px;
            }
            
            .condiciones h3 {
              color: #333;
              margin-bottom: 15px;
            }
            
            .condiciones-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #2563eb;
              font-size: 12px;
              color: #666;
            }
            
            .footer a {
              color: #2563eb;
              text-decoration: none;
              font-weight: 500;
            }
            
            .footer a:hover {
              text-decoration: underline;
            }
            
            .condiciones-instalacion {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              padding: 10px;
              margin: 15px 0;
              font-size: 8px;
              line-height: 1.3;
              color: #495057;
            }
            
            .condiciones-instalacion p {
              margin: 0;
            }
            
            .badge {
              display: inline-block;
              padding: 4px 8px;
              background: #ff9800;
              color: white;
              border-radius: 4px;
              font-size: 10px;
              margin-left: 5px;
            }
            
            /* ESTILOS PARA ESPECIFICACIONES TÉCNICAS */
            .producto-detalle {
              padding: 8px 0;
            }
            
            .producto-titulo {
              font-size: 14px;
              color: #1E40AF;
              margin-bottom: 8px;
              display: block;
            }
            
            .especificaciones-tecnicas {
              margin-top: 6px;
            }
            
            .spec-grupo {
              display: block;
              margin-bottom: 4px;
              font-size: 10px;
              line-height: 1.3;
            }
            
            .spec-categoria {
              font-weight: bold;
              color: #555;
              display: inline-block;
              min-width: 100px;
            }
            
            .spec-valor {
              color: #333;
              margin-left: 5px;
            }
            
            .badge-r24 {
              background: #dc3545;
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-weight: bold;
            }
            
            /* ESTILOS PARA TÉRMINOS COMERCIALES */
            .terminos-comerciales {
              background: #f8f9fa;
              border: 2px solid #1E40AF;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
              page-break-inside: avoid; /* Evitar cortes dentro de la sección */
              break-inside: avoid; /* Para navegadores modernos */
              /* Removido page-break-before: always para cotizaciones cortas */
            }
            
            /* CLASE ESPECIAL PARA COTIZACIONES LARGAS */
            .terminos-comerciales.nueva-pagina {
              page-break-before: always; /* Solo para cotizaciones largas */
            }
            
            .terminos-comerciales h3 {
              color: #1E40AF;
              text-align: center;
              margin-bottom: 20px;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .terminos-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .termino-seccion h4 {
              color: #D4AF37;
              margin-bottom: 10px;
              font-size: 12px;
              border-bottom: 1px solid #D4AF37;
              padding-bottom: 5px;
            }
            
            .termino-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
            }
            
            .termino-label {
              font-weight: bold;
              color: #555;
            }
            
            .termino-valor {
              color: #333;
              text-align: right;
              flex: 1;
              margin-left: 10px;
            }
            
            .garantias-seccion h4 {
              color: #28a745;
              margin-bottom: 10px;
              font-size: 12px;
            }
            
            .garantia-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 15px;
            }
            
            .garantia-item {
              text-align: center;
              padding: 8px;
              background: white;
              border-radius: 4px;
              border: 1px solid #28a745;
            }
            
            .garantia-tipo {
              display: block;
              font-size: 10px;
              color: #555;
              margin-bottom: 4px;
            }
            
            .garantia-tiempo {
              display: block;
              font-weight: bold;
              color: #28a745;
              font-size: 12px;
            }
            
            /* ESTILOS PARA SERVICIO GRATIS */
            .servicio-gratis {
              margin: 15px 0;
              padding: 10px;
              background: #d4edda;
              border: 2px solid #28a745;
              border-radius: 6px;
              text-align: center;
            }
            
            .servicio-gratis h4 {
              color: #155724;
              margin-bottom: 8px;
              font-size: 12px;
            }
            
            .servicio-item {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
            
            .servicio-icono {
              font-size: 16px;
            }
            
            .servicio-texto {
              color: #155724;
              font-size: 11px;
              font-weight: bold;
            }
            
            /* ESTILOS PARA MANTENIMIENTO */
            .mantenimiento-seccion {
              margin-top: 15px;
              padding: 10px;
              background: #fff3cd;
              border: 1px solid #ffc107;
              border-radius: 6px;
            }
            
            .mantenimiento-seccion h4 {
              color: #856404;
              margin-bottom: 10px;
              font-size: 12px;
              text-align: center;
            }
            
            .mantenimiento-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            
            .mantenimiento-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 6px;
              background: white;
              border-radius: 4px;
              border-left: 3px solid #ffc107;
            }
            
            .mant-tipo {
              font-size: 10px;
              color: #555;
              font-weight: bold;
            }
            
            .mant-frecuencia {
              font-size: 10px;
              color: #856404;
              font-weight: bold;
            }
            
            /* ESTILOS PARA CLÁUSULAS LEGALES */
            .clausulas-legales {
              background: #fff3cd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
              page-break-inside: avoid; /* Evitar cortes dentro de las cláusulas */
              break-inside: avoid; /* Para navegadores modernos */
            }
            
            .clausulas-legales h4 {
              color: #856404;
              text-align: center;
              margin-bottom: 15px;
              font-size: 14px;
              text-transform: uppercase;
            }
            
            .clausula-importante {
              background: #f8d7da;
              border: 2px solid #dc3545;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 10px;
            }
            
            .clausula-importante p {
              margin: 0;
              color: #721c24;
              font-weight: bold;
              text-align: center;
            }
            
            .clausula-item {
              margin-bottom: 8px;
              padding: 8px;
              background: white;
              border-radius: 4px;
              border-left: 4px solid #ffc107;
            }
            
            .clausula-item p {
              margin: 0;
              font-size: 10px;
              line-height: 1.4;
              color: #333;
            }
            
            /* REGLAS DE CONTROL DE PÁGINAS */
            .totales {
              page-break-inside: avoid; /* Evitar cortes en totales */
              break-inside: avoid;
            }
            
            .garantias-seccion {
              page-break-inside: avoid; /* Evitar cortes en garantías */
              break-inside: avoid;
            }
            
            .servicio-gratis {
              page-break-inside: avoid; /* Evitar cortes en servicio gratis */
              break-inside: avoid;
            }
            
            .mantenimiento-seccion {
              page-break-inside: avoid; /* Evitar cortes en mantenimiento */
              break-inside: avoid;
            }
            
            /* Evitar huérfanas y viudas */
            h3, h4 {
              page-break-after: avoid;
              break-after: avoid;
            }
            
            .productos-table tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            @media print {
              body { 
                margin: 0; 
                orphans: 3; /* Mínimo 3 líneas al final de página */
                widows: 3; /* Mínimo 3 líneas al inicio de página */
              }
              .container { 
                padding: 10px; 
              }
              
              /* Forzar términos comerciales en nueva página */
              .terminos-comerciales {
                page-break-before: always !important;
                page-break-inside: avoid !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header Modernizado -->
            <div class="header">
              <div class="logo">
                {{#if logoBase64}}
                <div class="logo-container">
                  <img src="{{logoBase64}}" alt="SUNDECK Logo" />
                </div>
                {{/if}}
              </div>
              <div class="company-info">
                <strong>Sundeck Acapulco</strong>
                Gracias por confiar en nosotros. Sundeck: tu espacio, nuestro compromiso.<br>
                📍 Acapulco, Guerrero<br>
                📞 Tel: (744) 123-4567<br>
                📧 sac@sundeckcyp.com
              </div>
            </div>

            <!-- Información de la Cotización -->
            <div class="cotizacion-info">
              <h2>Cotización {{numero}}</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">Fecha:</span> {{fecha}}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Válida hasta:</span> {{validoHasta}}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Origen:</span> {{origenLabel}}
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Tiempo de fabricación:</span> {{tiempoFabricacion}} días
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tiempo de instalación:</span> {{tiempoInstalacion}} días
                  </div>
                  {{#if elaboradaPor.nombre}}
                  <div class="info-item">
                    <span class="info-label">Elaborada por:</span> {{elaboradaPor.nombre}} {{elaboradaPor.apellido}}
                  </div>
                  {{/if}}
                </div>
              </div>
            </div>

            <!-- Información del Cliente -->
            <div class="cliente-info">
              <h3>Información del Cliente</h3>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">Nombre:</span> {{prospecto.nombre}}
                  </div>
                  <div class="info-item">
                    <span class="info-label">Teléfono:</span> {{prospecto.telefono}}
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Email:</span> {{prospecto.email}}
                  </div>
                  {{#if prospecto.direccion}}
                  <div class="info-item">
                    <span class="info-label">Dirección:</span> {{prospecto.direccion}}
                  </div>
                  {{/if}}
                </div>
              </div>
            </div>

            <!-- Productos Cotizados -->
            <div class="productos-section">
              <h3>Productos Cotizados</h3>
              <table class="productos-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Medidas</th>
                  <th>Área (m²)</th>
                  <th>Precio Unit.</th>
                  <th>Cant.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {{#each productos}}
                <tr>
                  <td>
                    <div class="producto-detalle">
                      <strong class="producto-titulo">{{nombre}}</strong>
                      
                      <!-- ESPECIFICACIONES TÉCNICAS DETALLADAS -->
                      <div class="especificaciones-tecnicas">
                        {{#if esToldo}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">🏠 SISTEMA TOLDO:</span>
                          <span class="spec-valor">{{tipoToldo}} - {{kitModelo}}</span>
                        </div>
                        {{/if}}
                        
                        <div class="spec-grupo">
                          <span class="spec-categoria">🎨 TELA:</span>
                          <span class="spec-valor">{{medidas.telaMarca}} - Color {{color}}</span>
                        </div>
                        
                        {{#if motorizado}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">⚡ MOTORIZACIÓN:</span>
                          <span class="spec-valor">{{motorModelo}} + Control {{controlModelo}}</span>
                        </div>
                        {{else}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">🔧 ACCIONAMIENTO:</span>
                          <span class="spec-valor">Manual con cadena</span>
                        </div>
                        {{/if}}
                        
                        {{#if medidas.tipoInstalacion}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">📍 INSTALACIÓN:</span>
                          <span class="spec-valor">{{medidas.tipoInstalacion}} - {{medidas.sistema}}</span>
                        </div>
                        {{/if}}
                        
                        {{#if requiereR24}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">🌪️ RESISTENCIA:</span>
                          <span class="spec-valor badge-r24">R24 Anti-Huracán</span>
                        </div>
                        {{/if}}
                        
                        {{#if observaciones}}
                        <div class="spec-grupo">
                          <span class="spec-categoria">📝 OBSERVACIONES:</span>
                          <span class="spec-valor">{{observaciones}}</span>
                        </div>
                        {{/if}}
                      </div>
                    </div>
                  </td>
                  <td>{{medidas.ancho}}m × {{medidas.alto}}m</td>
                  <td>{{medidas.area}}</td>
                  <td>{{precioUnitario}}</td>
                  <td>{{cantidad}}</td>
                  <td>{{subtotal}}</td>
                </tr>
                {{/each}}
              </tbody>
            </table>
            </div>

            <!-- Totales -->
            <div class="totales">
              <div class="totales-grid">
                <div>
                  <h3>Resumen de Costos</h3>
                  <div class="total-item">
                    <span>Subtotal:</span>
                    <span>{{subtotal}}</span>
                  </div>
                  {{#if descuento.monto}}
                  <div class="total-item">
                    <span>Descuento ({{descuento.porcentaje}}%):</span>
                    <span>-{{descuento.monto}}</span>
                  </div>
                  {{/if}}
                  {{#if incluirIVA}}
                  <div class="total-item">
                    <span>IVA (16%):</span>
                    <span>{{iva}}</span>
                  </div>
                  {{else}}
                  <div class="total-item" style="color: #dc3545;">
                    <span>IVA (16%):</span>
                    <span>No incluido</span>
                  </div>
                  {{/if}}
                  {{#if costoInstalacion}}
                  <div class="total-item">
                    <span>Instalación:</span>
                    <span>{{costoInstalacion}}</span>
                  </div>
                  {{/if}}
                  <div class="total-item total-final">
                    <span>TOTAL:</span>
                    <span>{{total}}</span>
                  </div>
                </div>
                
                {{#if formaPago}}
                <div>
                  <h3>Forma de Pago</h3>
                  <div class="total-item">
                    <span>Anticipo ({{formaPago.anticipo.porcentaje}}%):</span>
                    <span>{{formaPago.anticipo.monto}}</span>
                  </div>
                  <div class="total-item">
                    <span>Saldo ({{formaPago.saldo.porcentaje}}%):</span>
                    <span>{{formaPago.saldo.monto}}</span>
                  </div>
                  <small>{{formaPago.saldo.condiciones}}</small>
                </div>
                {{/if}}
              </div>
            </div>

            <!-- TÉRMINOS COMERCIALES OBLIGATORIOS -->
            <div class="terminos-comerciales {{#if cotizacionLarga}}nueva-pagina{{/if}}">
              <h3>📋 TÉRMINOS COMERCIALES</h3>
              
              <div class="terminos-grid">
                <div class="termino-seccion">
                  <h4>💰 CONDICIONES DE PAGO</h4>
                  {{#if formaPago}}
                  <div class="termino-item">
                    <span class="termino-label">Anticipo:</span> 
                    <span class="termino-valor">{{formaPago.anticipo.porcentaje}}% ({{formaPago.anticipo.monto}}) {{formaPago.anticipo.condiciones}}</span>
                  </div>
                  <div class="termino-item">
                    <span class="termino-label">Saldo:</span> 
                    <span class="termino-valor">{{formaPago.saldo.porcentaje}}% ({{formaPago.saldo.monto}}) {{formaPago.saldo.condiciones}}</span>
                  </div>
                  {{else}}
                  <div class="termino-item">
                    <span class="termino-label">Anticipo:</span> 
                    <span class="termino-valor">60% al confirmar pedido</span>
                  </div>
                  <div class="termino-item">
                    <span class="termino-label">Saldo:</span> 
                    <span class="termino-valor">40% contra instalación finalizada</span>
                  </div>
                  {{/if}}
                </div>
                
                <div class="termino-seccion">
                  <h4>⏰ PLAZOS DE ENTREGA</h4>
                  <div class="termino-item">
                    <span class="termino-label">Fabricación:</span> 
                    <span class="termino-valor">{{tiempoFabricacion}} días hábiles</span>
                  </div>
                  <div class="termino-item">
                    <span class="termino-label">Instalación:</span> 
                    <span class="termino-valor">{{tiempoInstalacion}} días</span>
                  </div>
                  <div class="termino-item">
                    <span class="termino-label">Vigencia:</span> 
                    <span class="termino-valor">Válida hasta {{validoHasta}}</span>
                  </div>
                </div>
              </div>
              
              <div class="garantias-seccion">
                <h4>🛡️ GARANTÍAS SUNDECK</h4>
                <div class="garantia-grid">
                  <div class="garantia-item">
                    <span class="garantia-tipo">Motores:</span>
                    <span class="garantia-tiempo">5 años</span>
                  </div>
                  <div class="garantia-item">
                    <span class="garantia-tipo">Telas:</span>
                    <span class="garantia-tiempo">3 años</span>
                  </div>
                  <div class="garantia-item">
                    <span class="garantia-tipo">Instalación:</span>
                    <span class="garantia-tiempo">1 año</span>
                  </div>
                </div>
                
                <div class="servicio-gratis">
                  <h4>🔧 SERVICIO INCLUIDO</h4>
                  <div class="servicio-item">
                    <span class="servicio-icono">🎁</span>
                    <span class="servicio-texto"><strong>1 AÑO DE SERVICIO GRATIS</strong> incluido</span>
                  </div>
                </div>
                
                <div class="mantenimiento-seccion">
                  <h4>📅 MANTENIMIENTO RECOMENDADO</h4>
                  <div class="mantenimiento-grid">
                    <div class="mantenimiento-item">
                      <span class="mant-tipo">🪟 Cortinas y Persianas:</span>
                      <span class="mant-frecuencia">Cada año</span>
                    </div>
                    <div class="mantenimiento-item">
                      <span class="mant-tipo">🏠 Toldos:</span>
                      <span class="mant-frecuencia">Cada 8 meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>🏠 Sundeck Persianas y Decoraciones – Gracias por confiar en nosotros. Sundeck: tu espacio, nuestro compromiso.</strong></p>
              <p>Acapulco: Almirante Damian Churruca 5 Local 3 Fracc. Costa Azul</p>
              <p>Teléfonos: <a href="tel:7444334126">744-433-4126</a> • WhatsApp: <a href="https://wa.me/527444522540">744-452-2540</a></p>
              <p>Web: <a href="https://www.sundeckcortinasypersianas.com/" target="_blank">www.sundeckcortinasypersianas.com</a> • Email: <a href="mailto:sac@sundeckcyp.com">sac@sundeckcyp.com</a></p>
              <p>Instagram: <a href="https://www.instagram.com/sundeck_oficial/" target="_blank">@sundeck_oficial</a></p>
              
              <p><em>Esta cotización es válida hasta la fecha indicada. Para cualquier duda, no dudes en contactarnos.</em></p>
              
              <!-- CLÁUSULAS LEGALES OBLIGATORIAS -->
              <div class="clausulas-legales">
                <h4>📋 CONDICIONES GENERALES</h4>
                
                <div class="clausula-importante">
                  <p><strong>⚠️ PRODUCTOS A LA MEDIDA:</strong> Por ser productos hechos a la medida, <strong>NO SE ACEPTAN CAMBIOS NI CANCELACIONES</strong> una vez realizado el anticipo.</p>
                </div>
                
                <div class="clausula-item">
                  <p><strong>🛡️ GARANTÍA SUNDECK:</strong> 5 años en motores / 3 años en telas / 1 año en instalación + 1 año de servicio gratis incluido.</p>
                </div>
                
                <div class="clausula-item">
                  <p><strong>📋 INSTALACIÓN:</strong> La instalación está sujeta a que el área se encuentre en condiciones óptimas y libres para el trabajo. Cualquier modificación adicional (volados, adaptaciones, refuerzos, cortes o ajustes especiales) no está contemplada y generará un costo extra.</p>
                </div>
                
                <div class="clausula-item">
                  <p><strong>⏰ VIGENCIA:</strong> Esta cotización es válida hasta la fecha indicada. Los precios están sujetos a cambios sin previo aviso.</p>
                </div>
                
                <div class="clausula-item">
                  <p><strong>📐 MEDIDAS:</strong> Las medidas finales serán verificadas antes de la fabricación. Cualquier discrepancia deberá ser reportada inmediatamente.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Preparar datos para el template
      const origenLabels = {
        levantamiento: '📋 Levantamiento Técnico',
        cotizacion_vivo: '💰 Cotización en Vivo',
        directa: '🎯 Cotización Directa',
        normal: '📝 Cotización Normal'
      };

      const productos = Array.isArray(cotizacion?.productos)
        ? cotizacion.productos
        : [];

      // Detectar si es una cotización MUY larga (criterios más estrictos)
      const areaTotal = productos.reduce((total, prod) => {
        const area = prod.medidas?.area || prod.area || 0;
        return total + (parseFloat(area) || 0);
      }, 0);
      
      // Contar líneas de productos (cada producto puede tener múltiples medidas)
      const lineasProductos = productos.reduce((total, prod) => {
        const medidas = prod.medidas || prod.medidasIndividuales || [];
        const numMedidas = Array.isArray(medidas) ? medidas.length : 1;
        return total + Math.max(1, numMedidas);
      }, 0);
      
      // Solo forzar nueva página si es REALMENTE larga
      const esLarga = (productos.length > 5) || // Más de 5 productos diferentes
                     (areaTotal > 60) || // Más de 60m² total
                     (lineasProductos > 8) || // Más de 8 líneas en la tabla
                     (cotizacion.observaciones && cotizacion.observaciones.length > 800); // Observaciones muy largas

      // Cargar logo existente como base64
      let logoBase64 = '';
      try {
        const logoPath = path.join(__dirname, '../public/images/logo-sundeck.png');
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        console.log('✅ Logo SUNDECK cargado correctamente');
      } catch (logoError) {
        console.log('⚠️ No se pudo cargar el logo SUNDECK:', logoError.message);
      }

      const templateData = {
        ...(typeof cotizacion?.toObject === 'function' ? cotizacion.toObject() : cotizacion),
        fecha: this.formatDate(cotizacion.fecha),
        validoHasta: this.formatDate(cotizacion.validoHasta),
        subtotal: this.formatCurrency(cotizacion.subtotal),
        iva: this.formatCurrency(cotizacion.iva),
        total: this.formatCurrency(cotizacion.total),
        incluirIVA: cotizacion.incluirIVA !== false, // Por defecto true si no está definido
        costoInstalacion: cotizacion.costoInstalacion ? this.formatCurrency(cotizacion.costoInstalacion) : null,
        origenLabel: origenLabels[cotizacion.origen] || origenLabels.normal,
        cotizacionLarga: esLarga, // Nueva propiedad para controlar saltos de página
        logoBase64: logoBase64, // Logo SUNDECK existente
        productos: productos.map(producto => {
          const productoData = typeof producto.toObject === 'function' ? producto.toObject() : producto;
          const medidas = productoData.medidas || {};

          return {
            ...productoData,
            precioUnitario: this.formatCurrency(productoData.precioUnitario ?? productoData.precioM2),
            subtotal: this.formatCurrency(productoData.subtotal),
            medidas: {
              ...medidas,
              area: typeof medidas.area === 'number' ? medidas.area.toFixed(2) : medidas.area
            },
            esToldo: Boolean(productoData.esToldo),
            kitModelo: productoData.kitModeloManual || productoData.kitModelo || null,
            kitPrecio: productoData.kitPrecio !== undefined && productoData.kitPrecio !== null
              ? this.formatCurrency(productoData.kitPrecio)
              : null,
            motorizado: Boolean(productoData.motorizado),
            motorModelo: productoData.motorizado
              ? (productoData.motorModeloManual || productoData.motorModelo || null)
              : null,
            motorPrecio: productoData.motorizado && productoData.motorPrecio !== undefined && productoData.motorPrecio !== null
              ? this.formatCurrency(productoData.motorPrecio)
              : null,
            controlModelo: productoData.motorizado
              ? (productoData.controlModeloManual || productoData.controlModelo || null)
              : null,
            controlPrecio: productoData.motorizado && productoData.controlPrecio !== undefined && productoData.controlPrecio !== null
              ? this.formatCurrency(productoData.controlPrecio)
              : null
          };
        }),
        formaPago: cotizacion.formaPago ? {
          ...cotizacion.formaPago,
          anticipo: {
            ...(cotizacion.formaPago.anticipo || {}),
            monto: this.formatCurrency(
              typeof cotizacion.formaPago.anticipo === 'object'
                ? cotizacion.formaPago.anticipo?.monto
                : cotizacion.formaPago.anticipo
            )
          },
          saldo: {
            ...(cotizacion.formaPago.saldo || {}),
            monto: this.formatCurrency(
              typeof cotizacion.formaPago.saldo === 'object'
                ? cotizacion.formaPago.saldo?.monto
                : cotizacion.formaPago.saldo
            )
          }
        } : null,
        descuento: cotizacion.descuento?.monto ? {
          ...cotizacion.descuento,
          monto: this.formatCurrency(cotizacion.descuento.monto)
        } : null,
        // Mapear instalación para el template
        instalacion: cotizacion.instalacion ? {
          cobra: cotizacion.instalacion.incluye || false,
          tipo: cotizacion.instalacion.tipo || 'fijo',
          precio: cotizacion.instalacion.costo || 0,
          precioFormateado: this.formatCurrency(cotizacion.instalacion.costo || 0)
        } : {
          cobra: false,
          tipo: '',
          precio: 0,
          precioFormateado: this.formatCurrency(0)
        },
        // Datos para el resumen financiero
        resumenCostos: {
          subtotalProductos: this.formatCurrency(cotizacion.subtotal || 0),
          instalacion: cotizacion.instalacion?.incluye ? this.formatCurrency(cotizacion.instalacion.costo || 0) : null,
          subtotalConInstalacion: this.formatCurrency((cotizacion.subtotal || 0) + (cotizacion.instalacion?.incluye ? (cotizacion.instalacion.costo || 0) : 0)),
          descuentoAplica: Boolean(cotizacion.descuento?.aplica),
          descuentoMonto: cotizacion.descuento?.monto ? this.formatCurrency(cotizacion.descuento.monto) : this.formatCurrency(0),
          subtotalConDescuento: this.formatCurrency(((cotizacion.subtotal || 0) + (cotizacion.instalacion?.incluye ? (cotizacion.instalacion.costo || 0) : 0)) - (cotizacion.descuento?.monto || 0)),
          requiereFactura: Boolean(cotizacion.facturacion?.requiere),
          iva: this.formatCurrency(cotizacion.iva || 0),
          totalConIVA: this.formatCurrency(cotizacion.total || 0),
          totalFinal: this.formatCurrency(cotizacion.total || 0)
        },
        // Mapear tiempos de fabricación e instalación
        tiempoFabricacion: cotizacion.tiempoFabricacion || 15,
        tiempoInstalacion: this.calcularTiempoInstalacionInteligente(cotizacion)
      };

      console.log('🧾 [PDF] Datos preparados para renderizar cotización', {
        cotizacionId,
        productos: templateData.productos?.length || 0,
        incluyeIVA: templateData.incluirIVA,
        subtotal: templateData.subtotal,
        total: templateData.total
      });

      // Compilar template
      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      // Generar PDF
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Esperar a que las fuentes se carguen completamente
      await page.evaluateHandle('document.fonts.ready');
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        // Configuraciones para mejor calidad de texto
        scale: 1,
        quality: 100
      });

      await page.close();

      console.log('✅ [PDF] Cotización generada correctamente', {
        cotizacionId,
        numero: cotizacion?.numero,
        pdfSize: pdf?.length
      });

      return pdf;

    } catch (error) {
      console.error('❌ [PDF] Error generando PDF de cotización', {
        cotizacionId,
        numero: cotizacion?.numero,
        message: error?.message,
        stack: error?.stack
      });
      throw new Error('No se pudo generar el PDF de la cotización');
    }
  }

  async generarLevantamientoPDF(etapa, piezas, totalM2, precioGeneral, datosAdicionales = {}) {
    try {
      console.log('🎨 Iniciando generación de PDF en pdfService...', {
        piezasCount: piezas?.length || 0,
        totalM2,
        precioGeneral,
        prospectoNombre: etapa?.prospecto?.nombre
      });

      // Cargar logo como base64
      let logoBase64 = '';
      try {
        const logoPath = path.join(__dirname, '../public/images/logo-sundeck.png');
        const logoStats = await fs.stat(logoPath);
        
        // Verificar que el archivo no sea demasiado grande (máximo 2MB)
        if (logoStats.size > 2 * 1024 * 1024) {
          console.log('⚠️ Logo muy grande (>2MB), usando fallback');
        } else {
          const logoBuffer = await fs.readFile(logoPath);
          logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          console.log(`✅ Logo cargado correctamente (${Math.round(logoStats.size / 1024)} KB)`);
        }
      } catch (logoError) {
        console.log('⚠️ No se pudo cargar el logo, usando fallback:', logoError.message);
      }

      const browserResult = await this.initBrowser();
      
      // Si es alternativa (html-pdf-node)
      if (browserResult.isAlternative) {
        return await this.generarPDFConHtmlPdfNode(browserResult.htmlPdf, etapa, piezas, totalM2, precioGeneral, datosAdicionales);
      }
      
      // Si es puppeteer
      const browser = browserResult.browser;
      const page = await browser.newPage();
      
      // Configurar página para mejor calidad de texto
      await page.setViewport({ 
        width: 1200, 
        height: 1600, 
        deviceScaleFactor: 2 // Mejora la resolución del texto
      });

      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Levantamiento de Medidas</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.3; 
              color: #333; 
              background: #fff;
              font-size: 12px;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            /* CABECERA PROFESIONAL */
            .header {
              display: table;
              width: 100%;
              margin-bottom: 8px;
              padding-bottom: 6px;
              min-height: 80px;
            }
            
            .header-content {
              display: table;
              width: 100%;
              margin-bottom: 8px;
            }
            
            .header-left {
              display: table-cell;
              vertical-align: middle;
              width: 50%;
              padding-right: 15px;
              padding-top: 0;
            }
            
            .header-right {
              display: table-cell;
              vertical-align: middle;
              width: 50%;
              text-align: right;
              padding-top: 0;
            }
            
            .logo-container {
              display: block;
              margin-left: 0;
            }
            
            .company-logo {
              height: 112px;
              width: auto;
              max-width: 280px;
              margin-bottom: 0;
              object-fit: contain;
              display: block;
            }
            
            .logo-fallback {
              font-size: 36px;
              font-weight: bold;
              color: #0F172A;
              margin-bottom: 0;
            }
            
            .header-title {
              font-size: 18px;
              font-weight: bold;
              color: #0F172A;
              margin-bottom: 6px;
              line-height: 1.2;
            }
            
            .header-date {
              font-size: 12px;
              color: #334155;
              font-weight: 500;
            }
            
            .slogan {
              font-size: 11px;
              color: #6B7280;
              font-style: italic;
              font-weight: 400;
              line-height: 1.4;
              margin-top: 5px;
              margin-left: 0;
              max-width: 420px;
            }
            
            .header-divider {
              width: 100%;
              height: 1.5px;
              background: #0F172A;
              margin: 8px 0 12px 0;
            }
            
            /* TABLA DE CLIENTE Y VISITA */
            .info-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 11px;
            }
            
            .info-table td {
              padding: 6px 8px;
              border: 1px solid #ddd;
              vertical-align: top;
            }
            
            .info-table .label {
              background: #f8f9fa;
              font-weight: bold;
              width: 25%;
            }
            
            .total-destacado {
              background: #fff3cd !important;
              color: #856404;
              font-size: 12px;
            }
            
            /* PARTIDAS COMPACTAS */
            .partida {
              border: 1px solid #ddd;
              margin-bottom: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .partida-header {
              background: #f8f9fa;
              padding: 6px 10px;
              font-weight: bold;
              font-size: 11px;
              border-bottom: 1px solid #ddd;
            }
            
            .partida-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            
            .partida-table td {
              padding: 4px 6px;
              border-bottom: 1px solid #eee;
              vertical-align: top;
            }

            .extras-container {
              margin-top: 8px;
              padding: 8px 12px;
              background: #f9fafb;
              border-left: 3px solid #1E40AF;
              border-radius: 6px;
              font-size: 9.5px;
            }

            .extras-title {
              font-weight: 600;
              color: #1E40AF;
              margin-bottom: 4px;
              display: block;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }

            .extras-list {
              list-style: none;
              padding-left: 0;
              margin: 0;
            }

            .extras-list li + li {
              margin-top: 2px;
            }

            .partida-table .field-label {
              font-weight: bold;
              width: 20%;
              background: #fafafa;
            }
            
            .partida-table .field-value {
              width: 30%;
            }
            
            .observaciones {
              background: #f0f0f0;
              padding: 6px;
              margin-top: 4px;
              font-size: 9px;
              font-style: italic;
              color: #666;
            }
            
            /* DIRECCIÓN COMO TEXTO NORMAL */
            .direccion-texto {
              font-size: 11px;
              line-height: 1.4;
            }
            
            .direccion-texto a {
              color: #1E40AF;
              text-decoration: none;
              font-weight: 500;
            }
            
            .direccion-texto a:hover {
              text-decoration: underline;
            }
            
            /* RESUMEN COMPACTO */
            .resumen-financiero {
              margin: 15px 0;
              padding: 12px;
              background: #f8f9fa;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
            }

            .resumen-financiero h3 {
              margin-bottom: 10px;
              font-size: 13px;
              color: #0F172A;
            }

            .resumen-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }

            .resumen-table td {
              padding: 6px 10px;
              border: 1px solid #ddd;
            }

            .resumen-table td.label-cell {
              background: #f9fafb;
              font-weight: 600;
              text-align: left;
            }

            .resumen-table td.value-cell {
              text-align: right;
              font-weight: 600;
            }

            .resumen-table .total-cell {
              background: #fff3cd;
              font-weight: bold;
              font-size: 13px;
            }

            .metodo-pago-resumen {
              margin-top: 10px;
              font-size: 10px;
              color: #334155;
            }

            .metodo-pago-resumen strong {
              color: #0F172A;
            }
            
            /* PIE DE PÁGINA LIMPIO */
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #ddd;
              font-size: 8px;
              text-align: center;
              color: #666;
            }
            
            .footer-logo {
              font-size: 10px;
              font-weight: bold;
              color: #1E40AF;
              margin-bottom: 5px;
            }
            
            .condiciones {
              background: #f8f9fa;
              border: 1px solid #ddd;
              padding: 10px;
              margin: 10px 0;
              font-size: 10px;
              line-height: 1.3;
              border-radius: 4px;
            }
            
            /* EVITAR CORTES DE PÁGINA */
            .no-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            @page {
              margin: 15mm;
              size: A4;
            }
            
            @media print {
              body { margin: 0; }
              .partida { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- CABECERA PROFESIONAL -->
          <div class="header">
            <div class="header-content">
              <div class="header-left">
                <div class="logo-container">
                  {{#if logoBase64}}
                    <img src="{{logoBase64}}" alt="{{company.assets.logoAlt}}" class="company-logo">
                  {{else}}
                    <div class="logo-fallback">🏠 {{company.name}}</div>
                  {{/if}}
                </div>
              </div>
              <div class="header-right">
                <div class="header-title">LEVANTAMIENTO DE MEDIDAS</div>
                <div class="header-date">Fecha: {{fecha}}</div>
              </div>
            </div>
            
            <!-- SLOGAN DEBAJO -->
            <div class="slogan">En Sundeck nos especializamos en las más selectas marcas y a los mejores precios</div>
          </div>
          
          <!-- LÍNEA DIVISORIA ELEGANTE -->
          <div class="header-divider"></div>

          <!-- TABLA DE CLIENTE Y VISITA -->
          <table class="info-table">
            <tr>
              <td class="label">Cliente:</td>
              <td>{{prospecto.nombre}}</td>
              <td class="label">Total m²:</td>
              <td class="total-destacado"><strong>{{totalM2}} m²</strong></td>
            </tr>
            <tr>
              <td class="label">Teléfono:</td>
              <td>{{prospecto.telefono}}</td>
              <td class="label">Total Estimado:</td>
              <td class="total-destacado"><strong>{{totalEstimado}}</strong></td>
            </tr>
            <tr>
              <td class="label">Email:</td>
              <td colspan="3">{{#if prospecto.email}}{{prospecto.email}}{{else}}-{{/if}}</td>
            </tr>
            {{#if prospecto.direccion}}
            <tr>
              <td class="label">Dirección:</td>
              <td colspan="3" class="direccion-texto">
                {{#if prospecto.direccion.calle}}
                  {{prospecto.direccion.calle}}, {{prospecto.direccion.colonia}}, {{prospecto.direccion.ciudad}}, CP {{prospecto.direccion.codigoPostal}}
                  {{#if prospecto.direccion.referencias}}<br><em>Ref: {{prospecto.direccion.referencias}}</em>{{/if}}
                  {{#if prospecto.direccion.linkMapa}}<br><a href="{{prospecto.direccion.linkMapa}}" target="_blank" style="color: #1E40AF; text-decoration: none;">📍 Ver en Google Maps</a>{{/if}}
                {{else}}
                  {{formatDireccion prospecto.direccion}}
                {{/if}}
              </td>
            </tr>
            {{/if}}
          </table>

          <!-- PARTIDAS COMPACTAS -->
          <h3 style="color: #D4AF37; margin: 15px 0 10px 0; font-size: 14px;">📋 Productos Medidos</h3>

          {{#each piezas}}
          <div class="partida no-break">
            <div class="partida-header">
              {{ubicacion}} - {{productoLabel}}{{#unless productoLabel}}{{producto}}{{/unless}}
            </div>
            <table class="partida-table">
              <tr>
                <td class="field-label">Ubicación:</td>
                <td class="field-value">{{ubicacion}}</td>
                <td class="field-label">Dimensiones:</td>
                <td class="field-value">{{ancho}} × {{alto}} {{../unidadMedida}}</td>
              </tr>
              <tr>
                <td class="field-label">Área:</td>
                <td class="field-value"><strong>{{area}} m²</strong></td>
                <td class="field-label">Color/Acabado:</td>
                <td class="field-value">{{color}}</td>
              </tr>
              <tr>
                <td class="field-label">Precio/m²:</td>
                <td class="field-value">{{precioM2}}</td>
                <td class="field-label">Total:</td>
                <td class="field-value"><strong>{{subtotal}}</strong></td>
              </tr>
            </table>
            {{#if observaciones}}
            <div class="observaciones">
              📝 Observaciones: {{observaciones}}
            </div>
            {{/if}}

            {{#if (or esProductoToldo motorizado)}}
            <div class="extras-container">
              <span class="extras-title">Incluye</span>
              <ul class="extras-list">
                {{#if esProductoToldo}}
                  <li><strong>Kit:</strong> {{kitModelo}}{{#if kitPrecio}} — {{kitPrecio}}{{/if}}</li>
                {{/if}}
                {{#if motorizado}}
                  {{#if motorModelo}}
                    <li><strong>Motor:</strong> {{motorModelo}}{{#if motorPrecio}} — {{motorPrecio}}{{/if}}</li>
                  {{/if}}
                  {{#if controlModelo}}
                    <li><strong>Control:</strong> {{controlModelo}}{{#if controlPrecio}} — {{controlPrecio}}{{/if}}</li>
                  {{/if}}
                {{/if}}
              </ul>
            </div>
            {{/if}}
          </div>
          {{/each}}

          <!-- RESUMEN COMPACTO -->
          <div style="text-align: center; margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 6px;">
            <strong style="color: #D4AF37; font-size: 12px;">📊 Resumen: {{piezas.length}} partidas medidas • Precio por m² de tela: {{precioGeneral}}</strong>
          </div>

          <!-- RESUMEN FINANCIERO -->
          <div class="resumen-financiero no-break">
            <h3>Resumen financiero</h3>
            <table class="resumen-table">
              <tr>
                <td class="label-cell">Subtotal de productos</td>
                <td class="value-cell">{{resumenCostos.subtotalProductos}}</td>
              </tr>
              {{#if instalacion.cobra}}
              <tr>
                <td class="label-cell">Instalación{{#if instalacion.tipo}} ({{instalacion.tipo}}){{/if}}</td>
                <td class="value-cell">{{instalacion.precioFormateado}}</td>
              </tr>
              {{/if}}
              <tr>
                <td class="label-cell">Subtotal con instalación</td>
                <td class="value-cell">{{resumenCostos.subtotalConInstalacion}}</td>
              </tr>
              {{#if descuento.aplica}}
              <tr>
                <td class="label-cell">{{descuento.etiqueta}}</td>
                <td class="value-cell" style="color: #dc3545;">-{{descuento.monto}}</td>
              </tr>
              <tr>
                <td class="label-cell">Subtotal con descuento</td>
                <td class="value-cell">{{resumenCostos.subtotalConDescuento}}</td>
              </tr>
              {{/if}}
              {{#if resumenCostos.requiereFactura}}
              <tr>
                <td class="label-cell">IVA (16%)</td>
                <td class="value-cell">{{resumenCostos.iva}}</td>
              </tr>
              <tr>
                <td class="label-cell total-cell">Total con IVA</td>
                <td class="value-cell total-cell">{{resumenCostos.totalConIVA}}</td>
              </tr>
              {{else}}
              <tr>
                <td class="label-cell">IVA</td>
                <td class="value-cell">No incluido (sin factura)</td>
              </tr>
              <tr>
                <td class="label-cell total-cell">Total estimado</td>
                <td class="value-cell total-cell">{{resumenCostos.totalFinal}}</td>
              </tr>
              {{/if}}
            </table>

            <div class="metodo-pago-resumen">
              <strong>Propuesta de pago:</strong>
              Anticipo ({{metodoPago.porcentajeAnticipo}}%): {{metodoPago.anticipo}} •
              Saldo ({{metodoPago.porcentajeSaldo}}%): {{metodoPago.saldo}}
              {{#if metodoPago.metodoPagoAnticipo}}
                <br>Forma de pago sugerida: {{metodoPago.metodoPagoAnticipo}}
              {{/if}}
            </div>
          </div>

          <!-- SUGERENCIAS INTELIGENTES -->
          <div class="sugerencias-section no-break" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-bottom: 10px; font-size: 14px;">🤖 Sugerencias Inteligentes Detectadas</h3>
            {{#if sugerencias}}
              <ul style="margin: 0; padding-left: 20px;">
                {{#each sugerencias}}
                <li style="margin-bottom: 5px;">{{this}}</li>
                {{/each}}
              </ul>
            {{else}}
              <p style="margin: 0; color: #666; font-style: italic;">No se detectaron sugerencias automáticas para esta cotización.</p>
            {{/if}}
          </div>

          <!-- ANÁLISIS GENERAL -->
          <div class="analisis-section no-break" style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-bottom: 10px; font-size: 14px;">📊 Análisis General de la Etapa</h3>
            {{#if analisisGeneral}}
              <div style="margin: 0;">
                <p><strong>Complejidad del proyecto:</strong> {{analisisGeneral.complejidad}}</p>
                <p><strong>Tiempo estimado:</strong> {{analisisGeneral.tiempoEstimado}}</p>
                <p><strong>Recomendaciones:</strong> {{analisisGeneral.recomendaciones}}</p>
              </div>
            {{else}}
              <p style="margin: 0; color: #666; font-style: italic;">Análisis automático en desarrollo.</p>
            {{/if}}
          </div>

          <!-- PIE DE PÁGINA LIMPIO -->
          <div class="footer">
            <div class="footer-logo">🏠 {{company.fullName}}</div>
            <div>{{company.address.street}} {{company.address.neighborhood}}, {{company.address.city}}</div>
            <div>Tel: <a href="tel:{{company.contact.phone}}">{{company.contact.phone}}</a> • WhatsApp: <a href="{{company.contact.whatsappLink}}">{{company.contact.whatsapp}}</a></div>
            <div>Web: <a href="{{company.social.website}}" target="_blank">{{company.social.website}}</a> • Instagram: <a href="{{company.social.instagram}}" target="_blank">{{company.social.instagramHandle}}</a></div>
            
            <div class="condiciones">
              <strong>📋 Condiciones de Instalación:</strong> {{company.legal.installationConditions}}
            </div>
          </div>
        </body>
        </html>
      `;

      // Registrar helpers de Handlebars
      handlebars.registerHelper('gt', function(a, b) {
        return a > b;
      });

      handlebars.registerHelper('or', function(a, b) {
        return a || b;
      });

      handlebars.registerHelper('formatDate', function(date) {
        return new Date(date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      });

      handlebars.registerHelper('formatDireccion', function(direccion) {
        if (!direccion) return '';
        
        // Si es un string, devolverlo tal como está
        if (typeof direccion === 'string') {
          return direccion;
        }
        
        // Si es un objeto, formatear correctamente
        if (typeof direccion === 'object') {
          let resultado = '';
          
          if (direccion.calle) {
            resultado += direccion.calle;
            if (direccion.colonia) resultado += ', ' + direccion.colonia;
            if (direccion.ciudad) resultado += ', ' + direccion.ciudad;
            if (direccion.codigoPostal) resultado += ', CP ' + direccion.codigoPostal;
            
            if (direccion.referencias) {
              resultado += '\nRef: ' + direccion.referencias;
            }
          }
          
          return resultado;
        }
        
        return '';
      });

      // Calcular totales reales basados en medidas individuales
      let totalPiezasReales = 0;
      let totalAreaReal = 0;
      let totalGeneralReal = 0;
      const piezasExpandidas = [];

      piezas.forEach((pieza) => {
        if (pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0) {
          // Formato nuevo: procesar cada medida individual
          pieza.medidas.forEach((medida, medidaIndex) => {
            const ancho = Number(medida.ancho) || 0;
            const alto = Number(medida.alto) || 0;
            const area = ancho * alto;
            const precio = Number(medida.precioM2) || Number(pieza.precioM2) || precioGeneral;
            const subtotal = area * precio;
            
            totalPiezasReales += 1;
            totalAreaReal += area;
            totalGeneralReal += subtotal;

            // Información de toldos y motorización
            const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
            const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) : 0;
            // Motor: solo cobrar en la primera medida de cada partida
            const esPrimeraMedida = medidaIndex === 0;
            const numMotores = pieza.numMotores || 1;
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio && esPrimeraMedida) ? Number(pieza.motorPrecio) * numMotores : 0;
            const controlPrecio = esPrimeraMedida ? this.calcularPrecioControlReal(pieza, piezas) : 0;
            
            const subtotalCompleto = subtotal + kitPrecio + motorPrecio + controlPrecio;
            totalGeneralReal = totalGeneralReal - subtotal + subtotalCompleto; // Ajustar el total

            piezasExpandidas.push({
              ...pieza,
              ubicacion: pieza.medidas.length > 1 ? 
                `${pieza.ubicacion || ''} (${medidaIndex + 1}/${pieza.medidas.length})` : 
                (pieza.ubicacion || ''),
              ancho: ancho,
              alto: alto,
              area: area.toFixed(2),
              precioM2: this.formatCurrency(precio),
              subtotalBase: this.formatCurrency(subtotal),
              // Información de toldos
              esProductoToldo: esProductoToldo,
              kitModelo: esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : null,
              kitPrecio: kitPrecio > 0 ? this.formatCurrency(kitPrecio) : null,
              // Información de motorización
              motorizado: pieza.motorizado,
              motorModelo: pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : null,
              motorPrecio: motorPrecio > 0 ? this.formatCurrency(motorPrecio) : null,
              controlModelo: pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : null,
              controlPrecio: controlPrecio > 0 ? this.formatCurrency(controlPrecio) : null,
              // Subtotal completo
              subtotal: this.formatCurrency(subtotalCompleto),
              productoLabel: medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto,
              color: medida.color || pieza.color || '',
              fotoUrls: pieza.fotoUrls || [],
              videoUrl: pieza.videoUrl
            });
          });
        } else {
          // Formato anterior: usar campos planos
          const ancho = Number(pieza.ancho) || 0;
          const alto = Number(pieza.alto) || 0;
          const cantidad = Number(pieza.cantidad) || 1;
          const area = ancho * alto * cantidad;
          const precio = Number(pieza.precioM2) || precioGeneral;
          const subtotal = area * precio;
          
          totalPiezasReales += cantidad;
          totalAreaReal += area;
          totalGeneralReal += subtotal;

          // Información de toldos y motorización
          const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
          const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) * cantidad : 0;
          const numMotores = pieza.numMotores || cantidad;
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) * numMotores : 0;
          const controlPrecio = this.calcularPrecioControlReal(pieza, piezas);
          
          const subtotalCompleto = subtotal + kitPrecio + motorPrecio + controlPrecio;
          totalGeneralReal = totalGeneralReal - subtotal + subtotalCompleto; // Ajustar el total

          piezasExpandidas.push({
            ...pieza,
            ubicacion: cantidad > 1 ? 
              `${pieza.ubicacion || ''} (${cantidad} piezas)` : 
              (pieza.ubicacion || ''),
            ancho: ancho,
            alto: alto,
            area: area.toFixed(2),
            precioM2: this.formatCurrency(precio),
            subtotalBase: this.formatCurrency(subtotal),
            // Información de toldos
            esProductoToldo: esProductoToldo,
            kitModelo: esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : null,
            kitPrecio: kitPrecio > 0 ? this.formatCurrency(kitPrecio) : null,
            // Información de motorización
            motorizado: pieza.motorizado,
            motorModelo: pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : null,
            motorPrecio: motorPrecio > 0 ? this.formatCurrency(motorPrecio) : null,
            controlModelo: pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : null,
            controlPrecio: controlPrecio > 0 ? this.formatCurrency(controlPrecio) : null,
            // Subtotal completo
            subtotal: this.formatCurrency(subtotalCompleto),
            productoLabel: pieza.productoLabel || pieza.producto,
            fotoUrls: pieza.fotoUrls || [],
            videoUrl: pieza.videoUrl
          });
        }
      });

      const subtotalProductosNumero = Number(datosAdicionales.subtotalProductos ?? totalGeneralReal) || 0;
      const instalacionCobra = datosAdicionales.instalacion?.cobra === true;
      const instalacionPrecioNumero = instalacionCobra ? Number(datosAdicionales.instalacion?.precio) || 0 : 0;
      const subtotalConInstalacion = subtotalProductosNumero + instalacionPrecioNumero;

      const descuentoAplica = datosAdicionales.descuento?.aplica === true;
      const descuentoMontoNumero = descuentoAplica ? Number(datosAdicionales.descuento?.monto) || 0 : 0;
      const subtotalConDescuento = subtotalConInstalacion - descuentoMontoNumero;

      const requiereFactura = datosAdicionales.facturacion?.requiereFactura === true;
      const ivaNumero = requiereFactura ? Number(datosAdicionales.facturacion?.iva) || (subtotalConDescuento * 0.16) : 0;

      const totalFinalNumero = datosAdicionales.totalFinal ? Number(datosAdicionales.totalFinal) : (requiereFactura ? subtotalConDescuento + ivaNumero : subtotalConDescuento);

      const anticipoNumero = datosAdicionales.metodoPago?.anticipo !== undefined
        ? Number(datosAdicionales.metodoPago.anticipo) || 0
        : Math.round(totalFinalNumero * 0.6 * 100) / 100;
      const saldoNumero = datosAdicionales.metodoPago?.saldo !== undefined
        ? Number(datosAdicionales.metodoPago.saldo) || 0
        : Math.max(totalFinalNumero - anticipoNumero, 0);

      const templateData = {
        fecha: this.formatDate(new Date()),
        prospecto: etapa.prospecto || { nombre: 'Cliente', telefono: '' },
        precioGeneral: this.formatCurrency(precioGeneral),
        unidadMedida: etapa.unidadMedida || 'm',
        totalPiezas: totalPiezasReales,
        totalM2: totalAreaReal.toFixed(2),
        precioEstimado: this.formatCurrency(precioGeneral),
        totalAproximado: this.formatCurrency(totalGeneralReal),
        totalEstimado: this.formatCurrency(totalFinalNumero),
        piezas: piezasExpandidas,
        company: companyConfig, // Datos dinámicos de la empresa
        logoBase64: logoBase64, // Logo en base64
        // Datos adicionales de facturación
        resumenCostos: {
          subtotalProductos: this.formatCurrency(subtotalProductosNumero),
          instalacion: instalacionCobra ? this.formatCurrency(instalacionPrecioNumero) : null,
          subtotalConInstalacion: this.formatCurrency(subtotalConInstalacion),
          descuentoAplica,
          descuentoMonto: this.formatCurrency(descuentoMontoNumero),
          subtotalConDescuento: this.formatCurrency(subtotalConDescuento),
          requiereFactura,
          iva: this.formatCurrency(ivaNumero),
          totalConIVA: this.formatCurrency(subtotalConDescuento + ivaNumero),
          totalFinal: this.formatCurrency(totalFinalNumero)
        },
        instalacion: {
          cobra: instalacionCobra,
          tipo: datosAdicionales.instalacion?.tipo || '',
          precio: instalacionPrecioNumero,
          precioFormateado: this.formatCurrency(instalacionPrecioNumero)
        },
        descuento: {
          aplica: descuentoAplica,
          tipo: datosAdicionales.descuento?.tipo || 'porcentaje',
          valor: Number(datosAdicionales.descuento?.valor) || 0,
          monto: this.formatCurrency(descuentoMontoNumero),
          etiqueta: descuentoAplica
            ? (datosAdicionales.descuento?.tipo === 'monto'
              ? 'Descuento (monto fijo)'
              : `Descuento (${Number(datosAdicionales.descuento?.valor) || 0}%)`)
            : 'Descuento'
        },
        facturacion: {
          requiereFactura,
          iva: this.formatCurrency(ivaNumero),
          totalConIVA: this.formatCurrency(requiereFactura ? subtotalConDescuento + ivaNumero : subtotalConDescuento)
        },
        metodoPago: {
          anticipo: this.formatCurrency(anticipoNumero),
          saldo: this.formatCurrency(saldoNumero),
          porcentajeAnticipo: datosAdicionales.metodoPago?.porcentajeAnticipo || 60,
          porcentajeSaldo: datosAdicionales.metodoPago?.porcentajeSaldo || 40,
          metodoPagoAnticipo: datosAdicionales.metodoPago?.metodoPagoAnticipo || ''
        },
        totalFinal: this.formatCurrency(totalFinalNumero),
        // Sugerencias inteligentes basadas en análisis de productos
        sugerencias: (() => {
          const sugerencias = [];
          let requiereAndamios = false;
          let tieneToldos = false;
          let tieneMotorizados = false;
          
          // Analizar todas las piezas
          piezasExpandidas.forEach(pieza => {
            const producto = (pieza.producto || '').toLowerCase();
            const alto = parseFloat(pieza.alto) || 0;
            
            if (alto > 4) requiereAndamios = true;
            if (producto.includes('toldo')) tieneToldos = true;
            if (pieza.motorizado) tieneMotorizados = true;
          });
          
          // Generar sugerencias específicas
          if (requiereAndamios) {
            sugerencias.push("⚠️ Instalación requiere andamios por altura superior a 4m");
            sugerencias.push("Considerar acceso vehicular para equipo de andamios");
          }
          
          if (tieneToldos) {
            sugerencias.push("Verificar estructura de soporte para toldos antes de instalación");
            sugerencias.push("Instalación de toldos requiere condiciones climáticas favorables");
          }
          
          if (tieneMotorizados) {
            sugerencias.push("Verificar disponibilidad de toma eléctrica cercana para motores");
            sugerencias.push("Programar configuración de controles después de instalación");
          }
          
          // Sugerencias generales
          sugerencias.push("Se recomienda instalación en horario matutino para mejor iluminación");
          sugerencias.push("Verificar medidas finales antes de la fabricación");
          
          return sugerencias;
        })(),
        // Análisis general con cálculo inteligente de tiempos
        analisisGeneral: (() => {
          let tiempoTotal = 0;
          let requiereAndamios = false;
          
          piezasExpandidas.forEach(pieza => {
            const producto = (pieza.producto || '').toLowerCase();
            const esMotorizado = pieza.motorizado;
            const ancho = parseFloat(pieza.ancho) || 0;
            const alto = parseFloat(pieza.alto) || 0;
            
            // Detectar andamios
            if (alto > 4) requiereAndamios = true;
            
            // Calcular tiempo por tipo
            if (producto.includes('toldo')) {
              tiempoTotal += 90; // 1.5h por toldo
            } else if (esMotorizado) {
              tiempoTotal += 30; // 30min por cortina motorizada
            } else {
              let tiempoPieza = 17.5; // 17.5min base para persiana manual
              if (ancho > 3) tiempoPieza += 10;
              if (alto > 2.5) tiempoPieza += 5;
              tiempoTotal += tiempoPieza;
            }
          });
          
          if (requiereAndamios) tiempoTotal += 50;
          
          const horas = Math.floor(tiempoTotal / 60);
          const minutos = Math.round(tiempoTotal % 60);
          const tiempoFormateado = horas > 0 ? `${horas}h ${minutos > 0 ? minutos + 'min' : ''}` : `${minutos}min`;
          
          return {
            complejidad: requiereAndamios ? "Alta" : totalPiezasReales > 5 ? "Media" : "Baja",
            tiempoEstimado: tiempoFormateado,
            recomendaciones: requiereAndamios 
              ? "Instalación requiere andamios por altura superior a 4m" 
              : "Proyecto con condiciones estándar de instalación"
          };
        })()
      };

      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Esperar a que las fuentes se carguen completamente
      await page.evaluateHandle('document.fonts.ready');
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }, // Márgenes optimizados
        // Configuraciones para mejor calidad de texto
        scale: 1,
        quality: 100
      });

      await page.close();
      await browser.close();
      
      console.log('✅ PDF generado exitosamente en pdfService', {
        size: pdf.length,
        type: 'puppeteer'
      });
      
      return pdf;

    } catch (error) {
      console.error('Error generando PDF de levantamiento:', error);
      throw new Error('No se pudo generar el PDF del levantamiento');
    }
  }

  // Función alternativa usando html-pdf-node
  async generarPDFConHtmlPdfNode(htmlPdf, etapa, piezas, totalM2, precioGeneral, datosAdicionales = {}) {
    try {
      // Procesar datos igual que en la función principal
      let totalPiezasReales = 0;
      let totalAreaReal = 0;
      let totalGeneralReal = 0;
      const piezasExpandidas = [];

      piezas.forEach((pieza) => {
        if (pieza.medidas && Array.isArray(pieza.medidas) && pieza.medidas.length > 0) {
          pieza.medidas.forEach((medida, medidaIndex) => {
            const ancho = Number(medida.ancho) || 0;
            const alto = Number(medida.alto) || 0;
            const area = ancho * alto;
            const precio = Number(medida.precioM2) || Number(pieza.precioM2) || precioGeneral;
            const subtotal = area * precio;
            
            totalPiezasReales += 1;
            totalAreaReal += area;
            totalGeneralReal += subtotal;

            const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
            const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) : 0;
            // Motor: solo cobrar en la primera medida de cada partida
            const esPrimeraMedida = medidaIndex === 0;
            const numMotores = pieza.numMotores || 1;
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio && esPrimeraMedida) ? Number(pieza.motorPrecio) * numMotores : 0;
            const controlPrecio = esPrimeraMedida ? this.calcularPrecioControlReal(pieza, piezas) : 0;
            
            const subtotalCompleto = subtotal + kitPrecio + motorPrecio + controlPrecio;
            totalGeneralReal = totalGeneralReal - subtotal + subtotalCompleto;

            piezasExpandidas.push({
              ...pieza,
              ubicacion: pieza.medidas.length > 1 ? 
                `${pieza.ubicacion || ''} (${medidaIndex + 1}/${pieza.medidas.length})` : 
                (pieza.ubicacion || ''),
              ancho: ancho,
              alto: alto,
              area: area.toFixed(2),
              precioM2: this.formatCurrency(precio),
              subtotalBase: this.formatCurrency(subtotal),
              esProductoToldo: esProductoToldo,
              kitModelo: esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : null,
              kitPrecio: kitPrecio > 0 ? this.formatCurrency(kitPrecio) : null,
              motorizado: pieza.motorizado,
              motorModelo: pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : null,
              motorPrecio: motorPrecio > 0 ? this.formatCurrency(motorPrecio) : null,
              controlModelo: pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : null,
              controlPrecio: controlPrecio > 0 ? this.formatCurrency(controlPrecio) : null,
              subtotal: this.formatCurrency(subtotalCompleto),
              productoLabel: medida.productoLabel || medida.producto || pieza.productoLabel || pieza.producto,
              color: medida.color || pieza.color || '',
              fotoUrls: pieza.fotoUrls || [],
              videoUrl: pieza.videoUrl
            });
          });
        } else {
          // Formato anterior
          const ancho = Number(pieza.ancho) || 0;
          const alto = Number(pieza.alto) || 0;
          const cantidad = Number(pieza.cantidad) || 1;
          const area = ancho * alto * cantidad;
          const precio = Number(pieza.precioM2) || precioGeneral;
          const subtotal = area * precio;
          
          totalPiezasReales += cantidad;
          totalAreaReal += area;
          totalGeneralReal += subtotal;

          const esProductoToldo = pieza.esToldo || (pieza.producto && pieza.producto.toLowerCase().includes('toldo'));
          const kitPrecio = (esProductoToldo && pieza.kitPrecio) ? Number(pieza.kitPrecio) * cantidad : 0;
          const numMotores = pieza.numMotores || cantidad;
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) * numMotores : 0;
          const controlPrecio = this.calcularPrecioControlReal(pieza, piezas);
          
          const subtotalCompleto = subtotal + kitPrecio + motorPrecio + controlPrecio;
          totalGeneralReal = totalGeneralReal - subtotal + subtotalCompleto;

          piezasExpandidas.push({
            ...pieza,
            ubicacion: cantidad > 1 ? 
              `${pieza.ubicacion || ''} (${cantidad} piezas)` : 
              (pieza.ubicacion || ''),
            ancho: ancho,
            alto: alto,
            area: area.toFixed(2),
            precioM2: this.formatCurrency(precio),
            subtotalBase: this.formatCurrency(subtotal),
            esProductoToldo: esProductoToldo,
            kitModelo: esProductoToldo ? (pieza.kitModeloManual || pieza.kitModelo || 'Kit incluido') : null,
            kitPrecio: kitPrecio > 0 ? this.formatCurrency(kitPrecio) : null,
            motorizado: pieza.motorizado,
            motorModelo: pieza.motorizado ? (pieza.motorModeloManual || pieza.motorModelo || 'Motor incluido') : null,
            motorPrecio: motorPrecio > 0 ? this.formatCurrency(motorPrecio) : null,
            controlModelo: pieza.motorizado ? (pieza.controlModeloManual || pieza.controlModelo || 'Control incluido') : null,
            controlPrecio: controlPrecio > 0 ? this.formatCurrency(controlPrecio) : null,
            subtotal: this.formatCurrency(subtotalCompleto),
            productoLabel: pieza.productoLabel || pieza.producto,
            fotoUrls: pieza.fotoUrls || [],
            videoUrl: pieza.videoUrl
          });
        }
      });

      const subtotalProductosNumero = Number(datosAdicionales.subtotalProductos ?? totalGeneralReal) || 0;
      const instalacionCobra = datosAdicionales.instalacion?.cobra === true;
      const instalacionPrecioNumero = instalacionCobra ? Number(datosAdicionales.instalacion?.precio) || 0 : 0;
      const subtotalConInstalacion = subtotalProductosNumero + instalacionPrecioNumero;

      const descuentoAplica = datosAdicionales.descuento?.aplica === true;
      const descuentoMontoNumero = descuentoAplica ? Number(datosAdicionales.descuento?.monto) || 0 : 0;
      const subtotalConDescuento = subtotalConInstalacion - descuentoMontoNumero;

      const requiereFactura = datosAdicionales.facturacion?.requiereFactura === true;
      const ivaNumero = requiereFactura ? Number(datosAdicionales.facturacion?.iva) || (subtotalConDescuento * 0.16) : 0;

      const totalFinalNumero = datosAdicionales.totalFinal ? Number(datosAdicionales.totalFinal) : (requiereFactura ? subtotalConDescuento + ivaNumero : subtotalConDescuento);

      const anticipoNumero = datosAdicionales.metodoPago?.anticipo !== undefined
        ? Number(datosAdicionales.metodoPago.anticipo) || 0
        : Math.round(totalFinalNumero * 0.6 * 100) / 100;
      const saldoNumero = datosAdicionales.metodoPago?.saldo !== undefined
        ? Number(datosAdicionales.metodoPago.saldo) || 0
        : Math.max(totalFinalNumero - anticipoNumero, 0);

      const templateData = {
        fecha: this.formatDate(new Date()),
        prospecto: etapa.prospecto || { nombre: 'Cliente', telefono: '' },
        precioGeneral: this.formatCurrency(precioGeneral),
        unidadMedida: etapa.unidadMedida || 'm',
        piezas: piezasExpandidas,
        totalPiezas: totalPiezasReales,
        totalM2: totalAreaReal.toFixed(2),
        precioEstimado: this.formatCurrency(precioGeneral),
        totalAproximado: this.formatCurrency(totalGeneralReal),
        totalEstimado: this.formatCurrency(totalFinalNumero),
        resumenCostos: {
          subtotalProductos: this.formatCurrency(subtotalProductosNumero),
          instalacion: instalacionCobra ? this.formatCurrency(instalacionPrecioNumero) : null,
          subtotalConInstalacion: this.formatCurrency(subtotalConInstalacion),
          descuentoAplica,
          descuentoMonto: this.formatCurrency(descuentoMontoNumero),
          subtotalConDescuento: this.formatCurrency(subtotalConDescuento),
          requiereFactura,
          iva: this.formatCurrency(ivaNumero),
          totalConIVA: this.formatCurrency(subtotalConDescuento + ivaNumero),
          totalFinal: this.formatCurrency(totalFinalNumero)
        },
        instalacion: {
          cobra: instalacionCobra,
          tipo: datosAdicionales.instalacion?.tipo || '',
          precio: instalacionPrecioNumero,
          precioFormateado: this.formatCurrency(instalacionPrecioNumero)
        },
        descuento: {
          aplica: descuentoAplica,
          tipo: datosAdicionales.descuento?.tipo || 'porcentaje',
          valor: Number(datosAdicionales.descuento?.valor) || 0,
          monto: this.formatCurrency(descuentoMontoNumero),
          etiqueta: descuentoAplica
            ? (datosAdicionales.descuento?.tipo === 'monto'
              ? 'Descuento (monto fijo)'
              : `Descuento (${Number(datosAdicionales.descuento?.valor) || 0}%)`)
            : 'Descuento'
        },
        facturacion: {
          requiereFactura,
          iva: this.formatCurrency(ivaNumero),
          totalConIVA: this.formatCurrency(requiereFactura ? subtotalConDescuento + ivaNumero : subtotalConDescuento)
        },
        metodoPago: {
          anticipo: this.formatCurrency(anticipoNumero),
          saldo: this.formatCurrency(saldoNumero),
          porcentajeAnticipo: datosAdicionales.metodoPago?.porcentajeAnticipo || 60,
          porcentajeSaldo: datosAdicionales.metodoPago?.porcentajeSaldo || 40,
          metodoPagoAnticipo: datosAdicionales.metodoPago?.metodoPagoAnticipo || ''
        },
        totalFinal: this.formatCurrency(totalFinalNumero)
      };

      // Registrar helpers de Handlebars
      handlebars.registerHelper('gt', function(a, b) {
        return a > b;
      });

      handlebars.registerHelper('or', function(a, b) {
        return a || b;
      });

      handlebars.registerHelper('formatDate', function(date) {
        return new Date(date).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      });

      // Usar el mismo template HTML
      const htmlTemplate = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Recibo de Visita - Medición</title><style>* { margin: 0; padding: 0; box-sizing: border-box; }body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; background: #fff; padding: 20px; }.recibo-container { max-width: 800px; margin: 0 auto; background: #fff; border: 2px solid #D4AF37; border-radius: 10px; overflow: hidden; }.header { background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%); color: white; padding: 25px; text-align: center; }.logo { font-size: 28px; font-weight: bold; margin-bottom: 5px; }.subtitulo { font-size: 16px; opacity: 0.9; }.info-cliente { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #dee2e6; }.cliente-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }.fecha-recibo { text-align: right; font-size: 14px; color: #666; margin-bottom: 10px; }.contenido { padding: 25px; }.partida { background: #fff; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px; overflow: hidden; }.partida-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #e9ecef; font-weight: bold; color: #495057; }.partida-body { padding: 20px; }.medidas-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }.campo { margin-bottom: 8px; }.campo-label { font-weight: bold; color: #495057; font-size: 14px; }.campo-valor { color: #212529; font-size: 15px; }.incluidos { background: #e8f4fd; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin-top: 15px; }.incluidos-titulo { font-weight: bold; color: #0c5460; margin-bottom: 10px; font-size: 14px; }.incluido-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #bee5eb; }.incluido-item:last-child { border-bottom: none; }.precio-unitario { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-top: 15px; text-align: center; }.precio-unitario .monto { font-size: 18px; font-weight: bold; color: #856404; }.resumen-final { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border: 2px solid #D4AF37; border-radius: 10px; padding: 25px; margin-top: 30px; text-align: center; }.resumen-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }.resumen-item { text-align: center; }.resumen-numero { font-size: 24px; font-weight: bold; color: #D4AF37; display: block; }.resumen-label { font-size: 14px; color: #666; margin-top: 5px; }.total-final { font-size: 28px; font-weight: bold; color: #D4AF37; margin-top: 15px; padding-top: 15px; border-top: 2px solid #D4AF37; }.footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; font-size: 12px; color: #666; }.nota-importante { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0; font-size: 14px; color: #856404; }@media print { body { margin: 0; padding: 10px; }.recibo-container { border: 1px solid #ccc; }}</style></head><body><div class="recibo-container"><div class="header"><div class="logo">🏠 SUNDECK</div><div class="subtitulo">Recibo de Visita - Medición de Productos</div></div><div class="info-cliente"><div class="fecha-recibo">Fecha de visita: {{fecha}}</div><div class="cliente-grid"><div><div class="campo"><span class="campo-label">Cliente:</span><br><span class="campo-valor">{{prospecto.nombre}}</span></div><div class="campo"><span class="campo-label">Teléfono:</span><br><span class="campo-valor">{{prospecto.telefono}}</span></div></div><div>{{#if prospecto.email}}<div class="campo"><span class="campo-label">Email:</span><br><span class="campo-valor">{{prospecto.email}}</span></div>{{/if}}{{#if prospecto.direccion}}<div class="campo"><span class="campo-label">Dirección:</span><br><span class="campo-valor">{{prospecto.direccion}}</span></div>{{/if}}</div></div></div><div class="contenido"><h3 style="color: #D4AF37; margin-bottom: 20px; text-align: center;">📋 Productos Medidos y Cotizados</h3>{{#each piezas}}<div class="partida"><div class="partida-header">📍 {{ubicacion}} - {{productoLabel}}{{#unless productoLabel}}{{producto}}{{/unless}}</div><div class="partida-body"><div class="medidas-grid"><div><div class="campo"><span class="campo-label">Dimensiones:</span><br><span class="campo-valor">{{ancho}} × {{alto}} {{../unidadMedida}}</span></div><div class="campo"><span class="campo-label">Área:</span><br><span class="campo-valor">{{area}} m²</span></div></div><div><div class="campo"><span class="campo-label">Color/Acabado:</span><br><span class="campo-valor">{{color}}</span></div><div class="campo"><span class="campo-label">Precio por m²:</span><br><span class="campo-valor">{{precioM2}}</span></div></div></div>{{#if (or esProductoToldo motorizado)}}<div class="incluidos"><div class="incluidos-titulo">📦 Incluye en el precio:</div>{{#if esProductoToldo}}<div class="incluido-item"><span>🏗️ Kit de Toldo ({{kitModelo}})</span><span>{{kitPrecio}}</span></div>{{/if}}{{#if motorizado}}<div class="incluido-item"><span>⚡ Motor ({{motorModelo}})</span><span>{{motorPrecio}}</span></div><div class="incluido-item"><span>🎛️ Control ({{controlModelo}})</span><span>{{controlPrecio}}</span></div>{{/if}}</div>{{/if}}<div class="precio-unitario"><div>💰 <strong>Precio total de esta partida:</strong></div><div class="monto">{{subtotal}}</div></div>{{#if observaciones}}<div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 14px;"><strong>📝 Observaciones:</strong> {{observaciones}}</div>{{/if}}</div></div>{{/each}}<div class="resumen-final"><h3 style="color: #D4AF37; margin-bottom: 20px;">📊 Resumen de la Visita</h3><div class="resumen-grid"><div class="resumen-item"><span class="resumen-numero">{{totalPiezas}}</span><div class="resumen-label">Partidas medidas</div></div><div class="resumen-item"><span class="resumen-numero">{{totalM2}}</span><div class="resumen-label">Metros cuadrados</div></div><div class="resumen-item"><span class="resumen-numero">{{precioEstimado}}</span><div class="resumen-label">Precio promedio/m²</div></div></div><div class="total-final">💰 TOTAL ESTIMADO: {{totalAproximado}}</div></div><div class="nota-importante"><strong>📋 Importante:</strong> Este recibo confirma la visita realizada y las medidas tomadas. El precio mostrado es una cotización preliminar. La cotización final será enviada por separado con términos y condiciones completos.</div></div><div class="footer"><p><strong>🏠 SUNDECK - Especialistas en Ventanas y Puertas</strong></p><p>Acapulco, Guerrero • Tel: (744) 123-4567 • info@sundeckacapulco.com</p><p>Gracias por confiar en nosotros para su proyecto</p></div></div></body></html>`;

      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      const options = { 
        format: 'A4',
        border: {
          top: "20px",
          right: "20px", 
          bottom: "20px",
          left: "20px"
        }
      };

      const file = { content: html };
      const pdf = await htmlPdf.generatePdf(file, options);
      
      console.log('✅ PDF generado exitosamente en pdfService', {
        size: pdf.length,
        type: 'html-pdf-node'
      });
      
      return pdf;

    } catch (error) {
      console.error('Error generando PDF con html-pdf-node:', error);
      throw new Error('No se pudo generar el PDF del levantamiento');
    }
  }
}

module.exports = new PDFService();
