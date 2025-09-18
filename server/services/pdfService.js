const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;

// Variable para carga lazy de puppeteer
let puppeteerLib;

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    try {
      // Carga lazy de puppeteer con manejo de errores
      puppeteerLib ??= require('puppeteer');
    } catch (error) {
      throw new Error('Puppeteer no está disponible. Para generar PDFs, instala puppeteer: npm install puppeteer');
    }

    if (!this.browser) {
      this.browser = await puppeteerLib.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
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
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

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
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
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
              border-bottom: 3px solid #D4AF37;
              padding-bottom: 20px;
            }
            
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #D4AF37;
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
              background-color: #D4AF37;
              color: white;
              font-weight: bold;
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
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
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
                🏠 SUNDECK
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
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">Tiempo de fabricación:</span> {{tiempoFabricacion}} días
                  </div>
                  <div class="info-item">
                    <span class="info-label">Tiempo de instalación:</span> {{tiempoInstalacion}} días
                  </div>
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
                  <div class="total-item">
                    <span>IVA (16%):</span>
                    <span>{{iva}}</span>
                  </div>
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
              <p><strong>¡Gracias por confiar en Sundeck!</strong></p>
              <p>Esta cotización es válida por 30 días a partir de la fecha de emisión.</p>
              <p>Para cualquier duda o aclaración, no dudes en contactarnos.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Preparar datos para el template
      const templateData = {
        ...cotizacion.toObject(),
        fecha: this.formatDate(cotizacion.fecha),
        validoHasta: this.formatDate(cotizacion.validoHasta),
        subtotal: this.formatCurrency(cotizacion.subtotal),
        iva: this.formatCurrency(cotizacion.iva),
        total: this.formatCurrency(cotizacion.total),
        costoInstalacion: cotizacion.costoInstalacion ? this.formatCurrency(cotizacion.costoInstalacion) : null,
        productos: cotizacion.productos.map(producto => ({
          ...producto.toObject(),
          precioUnitario: this.formatCurrency(producto.precioUnitario),
          subtotal: this.formatCurrency(producto.subtotal),
          medidas: {
            ...producto.medidas,
            area: producto.medidas.area?.toFixed(2)
          }
        })),
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

      // Compilar template
      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      // Generar PDF
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      });

      await page.close();
      return pdf;

    } catch (error) {
      console.error('Error generando PDF de cotización:', error);
      throw new Error('No se pudo generar el PDF de la cotización');
    }
  }

  async generarLevantamientoPDF(etapa, piezas, totalM2, precioGeneral) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Recibo de Visita - Medición</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Arial', sans-serif; 
              line-height: 1.4; 
              color: #333; 
              background: #fff;
              padding: 20px;
            }
            
            .recibo-container {
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
              border: 2px solid #D4AF37;
              border-radius: 10px;
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
              color: white;
              padding: 25px;
              text-align: center;
            }
            
            .logo {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .subtitulo {
              font-size: 16px;
              opacity: 0.9;
            }
            
            .info-cliente {
              background: #f8f9fa;
              padding: 20px;
              border-bottom: 1px solid #dee2e6;
            }
            
            .cliente-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            
            .fecha-recibo {
              text-align: right;
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            
            .contenido {
              padding: 25px;
            }
            
            .partida {
              background: #fff;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              margin-bottom: 20px;
              overflow: hidden;
            }
            
            .partida-header {
              background: #f8f9fa;
              padding: 15px;
              border-bottom: 1px solid #e9ecef;
              font-weight: bold;
              color: #495057;
            }
            
            .partida-body {
              padding: 20px;
            }
            
            .medidas-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .campo {
              margin-bottom: 8px;
            }
            
            .campo-label {
              font-weight: bold;
              color: #495057;
              font-size: 14px;
            }
            
            .campo-valor {
              color: #212529;
              font-size: 15px;
            }
            
            .incluidos {
              background: #e8f4fd;
              border: 1px solid #bee5eb;
              border-radius: 6px;
              padding: 15px;
              margin-top: 15px;
            }
            
            .incluidos-titulo {
              font-weight: bold;
              color: #0c5460;
              margin-bottom: 10px;
              font-size: 14px;
            }
            
            .incluido-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 5px 0;
              border-bottom: 1px solid #bee5eb;
            }
            
            .incluido-item:last-child {
              border-bottom: none;
            }
            
            .precio-unitario {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 12px;
              margin-top: 15px;
              text-align: center;
            }
            
            .precio-unitario .monto {
              font-size: 18px;
              font-weight: bold;
              color: #856404;
            }
            
            .resumen-final {
              background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
              border: 2px solid #D4AF37;
              border-radius: 10px;
              padding: 25px;
              margin-top: 30px;
              text-align: center;
            }
            
            .resumen-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .resumen-item {
              text-align: center;
            }
            
            .resumen-numero {
              font-size: 24px;
              font-weight: bold;
              color: #D4AF37;
              display: block;
            }
            
            .resumen-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            
            .total-final {
              font-size: 28px;
              font-weight: bold;
              color: #D4AF37;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #D4AF37;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              border-top: 1px solid #dee2e6;
              font-size: 12px;
              color: #666;
            }
            
            .nota-importante {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 15px;
              margin: 20px 0;
              font-size: 14px;
              color: #856404;
            }
            
            @media print {
              body { margin: 0; padding: 10px; }
              .recibo-container { border: 1px solid #ccc; }
            }
          </style>
        </head>
        <body>
          <div class="recibo-container">
            <!-- Header -->
            <div class="header">
              <div class="logo">🏠 SUNDECK</div>
              <div class="subtitulo">Recibo de Visita - Medición de Productos</div>
            </div>

            <!-- Información del Cliente -->
            <div class="info-cliente">
              <div class="fecha-recibo">
                Fecha de visita: {{fecha}}
              </div>
              <div class="cliente-grid">
                <div>
                  <div class="campo">
                    <span class="campo-label">Cliente:</span><br>
                    <span class="campo-valor">{{prospecto.nombre}}</span>
                  </div>
                  <div class="campo">
                    <span class="campo-label">Teléfono:</span><br>
                    <span class="campo-valor">{{prospecto.telefono}}</span>
                  </div>
                </div>
                <div>
                  {{#if prospecto.email}}
                  <div class="campo">
                    <span class="campo-label">Email:</span><br>
                    <span class="campo-valor">{{prospecto.email}}</span>
                  </div>
                  {{/if}}
                  {{#if prospecto.direccion}}
                  <div class="campo">
                    <span class="campo-label">Dirección:</span><br>
                    <span class="campo-valor">{{prospecto.direccion}}</span>
                  </div>
                  {{/if}}
                </div>
              </div>
            </div>

            <!-- Contenido Principal -->
            <div class="contenido">
              <h3 style="color: #D4AF37; margin-bottom: 20px; text-align: center;">
                📋 Productos Medidos y Cotizados
              </h3>

              {{#each piezas}}
              <div class="partida">
                <div class="partida-header">
                  📍 {{ubicacion}} - {{productoLabel}}{{#unless productoLabel}}{{producto}}{{/unless}}
                </div>
                <div class="partida-body">
                  <div class="medidas-grid">
                    <div>
                      <div class="campo">
                        <span class="campo-label">Dimensiones:</span><br>
                        <span class="campo-valor">{{ancho}} × {{alto}} {{../unidadMedida}}</span>
                      </div>
                      <div class="campo">
                        <span class="campo-label">Área:</span><br>
                        <span class="campo-valor">{{area}} m²</span>
                      </div>
                    </div>
                    <div>
                      <div class="campo">
                        <span class="campo-label">Color/Acabado:</span><br>
                        <span class="campo-valor">{{color}}</span>
                      </div>
                      <div class="campo">
                        <span class="campo-label">Precio por m²:</span><br>
                        <span class="campo-valor">{{precioM2}}</span>
                      </div>
                    </div>
                  </div>

                  {{#if (or esProductoToldo motorizado)}}
                  <div class="incluidos">
                    <div class="incluidos-titulo">📦 Incluye en el precio:</div>
                    {{#if esProductoToldo}}
                    <div class="incluido-item">
                      <span>🏗️ Kit de Toldo ({{kitModelo}})</span>
                      <span>{{kitPrecio}}</span>
                    </div>
                    {{/if}}
                    {{#if motorizado}}
                    <div class="incluido-item">
                      <span>⚡ Motor ({{motorModelo}})</span>
                      <span>{{motorPrecio}}</span>
                    </div>
                    <div class="incluido-item">
                      <span>🎛️ Control ({{controlModelo}})</span>
                      <span>{{controlPrecio}}</span>
                    </div>
                    {{/if}}
                  </div>
                  {{/if}}

                  <div class="precio-unitario">
                    <div>💰 <strong>Precio total de esta partida:</strong></div>
                    <div class="monto">{{subtotal}}</div>
                  </div>

                  {{#if observaciones}}
                  <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 14px;">
                    <strong>📝 Observaciones:</strong> {{observaciones}}
                  </div>
                  {{/if}}
                </div>
              </div>
              {{/each}}

              <!-- Resumen Final -->
              <div class="resumen-final">
                <h3 style="color: #D4AF37; margin-bottom: 20px;">
                  📊 Resumen de la Visita
                </h3>
                
                <div class="resumen-grid">
                  <div class="resumen-item">
                    <span class="resumen-numero">{{totalPiezas}}</span>
                    <div class="resumen-label">Partidas medidas</div>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-numero">{{totalM2}}</span>
                    <div class="resumen-label">Metros cuadrados</div>
                  </div>
                  <div class="resumen-item">
                    <span class="resumen-numero">{{precioEstimado}}</span>
                    <div class="resumen-label">Precio promedio/m²</div>
                  </div>
                </div>

                <div class="total-final">
                  💰 TOTAL ESTIMADO: {{totalAproximado}}
                </div>
              </div>

              <div class="nota-importante">
                <strong>📋 Importante:</strong> Este recibo confirma la visita realizada y las medidas tomadas. 
                El precio mostrado es una cotización preliminar. La cotización final será enviada por separado 
                con términos y condiciones completos.
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p><strong>🏠 SUNDECK - Especialistas en Ventanas y Puertas</strong></p>
              <p>Acapulco, Guerrero • Tel: (744) 123-4567 • info@sundeckacapulco.com</p>
              <p>Gracias por confiar en nosotros para su proyecto</p>
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

      const templateData = {
        fecha: this.formatDate(new Date()),
        prospecto: etapa.prospecto || { nombre: 'Cliente', telefono: '' },
        precioGeneral: this.formatCurrency(precioGeneral),
        unidadMedida: etapa.unidadMedida || 'm',
        totalPiezas: totalPiezasReales,
        totalM2: totalAreaReal.toFixed(2),
        precioEstimado: this.formatCurrency(precioGeneral),
        totalAproximado: this.formatCurrency(totalGeneralReal),
        piezas: piezasExpandidas
      };

      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      });

      await page.close();
      return pdf;

    } catch (error) {
      console.error('Error generando PDF de levantamiento:', error);
      throw new Error('No se pudo generar el PDF del levantamiento');
    }
  }
}

module.exports = new PDFService();
