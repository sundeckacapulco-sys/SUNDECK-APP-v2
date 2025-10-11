const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;
const companyConfig = require('../config/company');

// Variable para carga lazy de puppeteer
let puppeteerLib;

class PDFService {
  constructor() {
    this.browser = null;
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
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
          <title>Cotización {{numero}}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 15px 20px 20px 20px;
              padding: 0;
              line-height: 1.4;
              color: #333;
              font-size: 12px;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              text-rendering: optimizeLegibility;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #1E40AF;
              padding-bottom: 20px;
            }
            
            .logo {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .logo img {
              height: 60px;
              width: auto;
            }
            
            .logo-text {
              font-size: 28px;
              font-weight: bold;
              color: #1E40AF;
            }
            
            .company-info {
              text-align: right;
              font-size: 12px;
              color: #666;
            }
            
            .cotizacion-info {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            
            .cotizacion-info h2 {
              color: #D4AF37;
              margin-bottom: 15px;
              font-size: 24px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .info-item {
              margin-bottom: 10px;
            }
            
            .info-label {
              font-weight: bold;
              color: #555;
            }
            
            .cliente-info {
              margin-bottom: 30px;
            }
            
            .cliente-info h3 {
              color: #333;
              margin-bottom: 15px;
              border-bottom: 2px solid #D4AF37;
              padding-bottom: 5px;
            }
            
            .productos-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .productos-table th,
            .productos-table td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            
            .productos-table th {
              background-color: #1E40AF;
              color: white;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
              text-transform: uppercase;
            }
            
            .productos-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .totales {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            
            .totales-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .total-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            
            .total-final {
              border-top: 2px solid #D4AF37;
              padding-top: 10px;
              font-weight: bold;
              font-size: 18px;
              color: #D4AF37;
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
            
            @media print {
              body { margin: 0; }
              .container { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">
                <div class="logo-text">
                  🏠 SUNDECK
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                  PERSIANAS Y DECORACIONES
                </div>
              </div>
              <div class="company-info">
                <strong>Sundeck Acapulco</strong><br>
                Especialistas en Ventanas y Puertas<br>
                Acapulco, Guerrero<br>
                Tel: (744) 123-4567<br>
                info@sundeckacapulco.com
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
                    <strong>{{nombre}}</strong><br>
                    <small>{{descripcion}}</small><br>
                    <small>Material: {{material}} | Color: {{color}}</small>
                    {{#if requiereR24}}
                    <span class="badge">R24</span>
                    {{/if}}
                    {{#if kitModelo}}
                    <div><small>Kit: {{kitModelo}}{{#if kitPrecio}} – {{kitPrecio}}{{/if}}</small></div>
                    {{/if}}
                    {{#if motorizado}}
                    <div>
                      <small>Motorizado{{#if motorModelo}} • Motor: {{motorModelo}}{{#if motorPrecio}} ({{motorPrecio}}){{/if}}{{/if}}{{#if controlModelo}} • Control: {{controlModelo}}{{#if controlPrecio}} ({{controlPrecio}}){{/if}}{{/if}}</small>
                    </div>
                    {{/if}}
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

            <!-- Condiciones y Garantías -->
            {{#if garantia}}
            <div class="condiciones">
              <h3>Garantías</h3>
              <div class="condiciones-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">Fabricación:</span> {{garantia.fabricacion}} meses
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Instalación:</span> {{garantia.instalacion}} meses
                  </div>
                </div>
              </div>
              {{#if garantia.descripcion}}
              <p><small>{{garantia.descripcion}}</small></p>
              {{/if}}
            </div>
            {{/if}}

            <!-- Footer -->
            <div class="footer">
              <p><strong>🏠 Sundeck Persianas y Decoraciones – Instalación y Decoración de Persianas, Toldos y Cortinas a Medida</strong></p>
              <p>Acapulco: Almirante Damian Churruca 5 Local 3 Fracc. Costa Azul</p>
              <p>Teléfonos: <a href="tel:7444334126">744-433-4126</a> • WhatsApp: <a href="https://wa.me/527444522540">744-452-2540</a></p>
              <p>Web: <a href="https://www.sundeckcortinasypersianas.com/" target="_blank">www.sundeckcortinasypersianas.com</a></p>
              <p>Instagram: <a href="https://www.instagram.com/sundeck_oficial/" target="_blank">@sundeck_oficial</a></p>
              
              <p><em>Esta cotización es válida hasta la fecha indicada. Para cualquier duda, no dudes en contactarnos.</em></p>
              
              <div class="condiciones-instalacion">
                <p><strong>📋 Condiciones de Instalación:</strong> La instalación está sujeta a que el área se encuentre en condiciones óptimas y libres para el trabajo. La cotización incluye únicamente los productos y servicios especificados; cualquier modificación adicional (volados, adaptaciones, refuerzos, cortes o ajustes especiales) no está contemplada y generará un costo extra.</p>
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

      const templateData = {
        ...cotizacion.toObject(),
        fecha: this.formatDate(cotizacion.fecha),
        validoHasta: this.formatDate(cotizacion.validoHasta),
        subtotal: this.formatCurrency(cotizacion.subtotal),
        iva: this.formatCurrency(cotizacion.iva),
        total: this.formatCurrency(cotizacion.total),
        incluirIVA: cotizacion.incluirIVA !== false, // Por defecto true si no está definido
        costoInstalacion: cotizacion.costoInstalacion ? this.formatCurrency(cotizacion.costoInstalacion) : null,
        origenLabel: origenLabels[cotizacion.origen] || origenLabels.normal,
        productos: cotizacion.productos.map(producto => {
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
            ...cotizacion.formaPago.anticipo,
            monto: this.formatCurrency(cotizacion.formaPago.anticipo?.monto)
          },
          saldo: {
            ...cotizacion.formaPago.saldo,
            monto: this.formatCurrency(cotizacion.formaPago.saldo?.monto)
          }
        } : null,
        descuento: cotizacion.descuento?.monto ? {
          ...cotizacion.descuento,
          monto: this.formatCurrency(cotizacion.descuento.monto)
        } : null
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
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) : 0;
            const controlPrecio = (pieza.motorizado && pieza.controlPrecio) ? Number(pieza.controlPrecio) : 0;
            
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
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) * cantidad : 0;
          const controlPrecio = (pieza.motorizado && pieza.controlPrecio) ? Number(pieza.controlPrecio) : 0;
          
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
        totalFinal: this.formatCurrency(totalFinalNumero)
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
            const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) : 0;
            const controlPrecio = (pieza.motorizado && pieza.controlPrecio) ? Number(pieza.controlPrecio) : 0;
            
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
          const motorPrecio = (pieza.motorizado && pieza.motorPrecio) ? Number(pieza.motorPrecio) * cantidad : 0;
          const controlPrecio = (pieza.motorizado && pieza.controlPrecio) ? Number(pieza.controlPrecio) : 0;
          
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
