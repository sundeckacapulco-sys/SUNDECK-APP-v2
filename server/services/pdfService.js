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
          <title>Levantamiento de Medidas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #D4AF37; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .pieza { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
            .pieza h4 { color: #D4AF37; margin-bottom: 10px; }
            .resumen { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; }
            .total { font-size: 18px; font-weight: bold; color: #D4AF37; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🏠 SUNDECK - Levantamiento de Medidas</div>
            <p>Fecha: {{fecha}}</p>
          </div>

          <div class="info-grid">
            <div>
              <strong>Cliente:</strong> {{prospecto.nombre}}<br>
              <strong>Teléfono:</strong> {{prospecto.telefono}}
            </div>
            <div>
              <strong>Precio General:</strong> {{precioGeneral}}/m²<br>
              <strong>Unidad:</strong> {{unidadMedida}}
            </div>
          </div>

          <h3>Piezas Medidas</h3>
          {{#each piezas}}
          <div class="pieza">
            <h4>📍 {{ubicacion}} {{#if etapa}}<span style="color: #666; font-size: 14px;">({{etapa}})</span>{{/if}}</h4>
            <div class="info-grid">
              <div>
                <strong>Dimensiones:</strong> {{ancho}} × {{alto}} {{../unidadMedida}}<br>
                <strong>Área:</strong> {{area}} m²<br>
                {{#if precioM2}}
                <strong>Precio m²:</strong> {{precioM2}}/m²<br>
                {{/if}}
                {{#if subtotalBase}}
                <strong>Subtotal base:</strong> {{subtotalBase}}<br>
                {{/if}}
              </div>
              <div>
                <strong>Producto:</strong> {{productoLabel}}{{#unless productoLabel}}{{producto}}{{/unless}}<br>
                <strong>Color/Acabado:</strong> {{color}}<br>
                {{#if fotoUrls.length}}
                <strong>Fotos:</strong> {{fotoUrls.length}} archivo{{#if (gt fotoUrls.length 1)}}s{{/if}}<br>
                {{/if}}
                {{#if videoUrl}}
                <strong>Video:</strong> Disponible<br>
                {{/if}}
              </div>
            </div>
            
            {{#if esProductoToldo}}
            <div style="margin-top: 10px; padding: 8px; background: #e3f2fd; border-left: 4px solid #2196f3;">
              <strong>🏗️ Kit de Toldo:</strong> {{kitModelo}}
              {{#if kitPrecio}} → {{kitPrecio}}{{/if}}
            </div>
            {{/if}}
            
            {{#if motorizado}}
            <div style="margin-top: 10px; padding: 8px; background: #f3e5f5; border-left: 4px solid #9c27b0;">
              <strong>⚡ Motorización:</strong><br>
              • Motor: {{motorModelo}}{{#if motorPrecio}} → {{motorPrecio}}{{/if}}<br>
              • Control: {{controlModelo}}{{#if controlPrecio}} → {{controlPrecio}}{{/if}}
            </div>
            {{/if}}
            
            {{#if subtotal}}
            <div style="margin-top: 10px; padding: 8px; background: #e8f5e8; border-left: 4px solid #4caf50; text-align: right;">
              <strong>💰 Total Pieza: {{subtotal}}</strong>
            </div>
            {{/if}}
            {{#if observaciones}}
            <p><strong>Observaciones:</strong> {{observaciones}}</p>
            {{/if}}
            {{#if fechaEtapa}}
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              <strong>Registrado:</strong> {{formatDate fechaEtapa}}
            </p>
            {{/if}}
          </div>
          {{/each}}

          <div class="resumen">
            <h3>Resumen del Levantamiento</h3>
            <div class="info-grid">
              <div>
                <strong>Total de piezas:</strong> {{totalPiezas}}<br>
                <strong>Área total:</strong> {{totalM2}} m²
              </div>
              <div>
                <strong>Precio estimado:</strong> {{precioEstimado}}<br>
                <div class="total">Total aproximado: {{totalAproximado}}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // Registrar helpers de Handlebars
      handlebars.registerHelper('gt', function(a, b) {
        return a > b;
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
