const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Variable para carga lazy de puppeteer
let puppeteerLib;

class PDFFabricacionService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    try {
      if (!puppeteerLib) {
        puppeteerLib = require('puppeteer');
      }
      
      if (!this.browser) {
        this.browser = await puppeteerLib.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
      }
      
      return this.browser;
    } catch (error) {
      logger.error('Error inicializando browser para PDF de fabricación', {
        servicio: 'pdfFabricacionService',
        accion: 'initBrowser',
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  formatDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // Generar PDF de orden de fabricación (SIN PRECIOS)
  async generarOrdenFabricacionPDF(ordenFabricacion) {
    try {
      logger.info('Iniciando generación de PDF de orden de fabricación', {
        servicio: 'pdfFabricacionService',
        accion: 'generarOrdenFabricacionPDF',
        numero: ordenFabricacion?.numero,
        productos: ordenFabricacion?.productos?.length || 0
      });

      const browser = await this.initBrowser();
      const page = await browser.newPage();
      
      await page.setViewport({ 
        width: 1200, 
        height: 1600, 
        deviceScaleFactor: 2 
      });

      // Cargar logo existente como base64
      let logoBase64 = '';
      try {
        const logoPath = path.join(__dirname, '../public/images/logo-sundeck.png');
        const logoBuffer = await fs.readFile(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
      } catch (logoError) {
        logger.warn('No se pudo cargar el logo SUNDECK para el PDF de fabricación', {
          servicio: 'pdfFabricacionService',
          accion: 'generarOrdenFabricacionPDF',
          numero: ordenFabricacion?.numero,
          error: logoError.message,
          stack: logoError.stack
        });
      }

      // Template HTML para orden de fabricación
      const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Orden de Fabricación {{numero}} - SUNDECK</title>
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
            
            /* ===== HEADER FABRICACIÓN ===== */
            .header {
              background: linear-gradient(135deg, var(--sundeck-verde) 0%, #059669 100%);
              color: var(--sundeck-blanco);
              padding: 25px 30px;
              margin: -20px -20px 30px -20px;
              border-radius: 0 0 12px 12px;
              border-bottom: 3px solid var(--sundeck-verde);
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
            
            .header-info {
              text-align: right;
              font-size: 11px;
              color: var(--sundeck-verde-suave);
              line-height: 1.4;
            }
            
            .header-info strong {
              color: var(--sundeck-blanco);
              font-size: 13px;
              display: block;
              margin-bottom: 5px;
            }
            
            /* ===== INFORMACIÓN DE ORDEN ===== */
            .orden-info {
              background: var(--sundeck-verde-suave);
              border: 2px solid var(--sundeck-verde);
              padding: 40px 30px 25px 30px;
              border-radius: 10px;
              margin: 0 20px 30px 20px;
              position: relative;
            }
            
            .orden-info h2 {
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
              color: var(--sundeck-verde);
              font-weight: 500;
              font-size: 12px;
            }
            
            /* ===== INFORMACIÓN DEL CLIENTE ===== */
            .cliente-info {
              background: var(--sundeck-gris-muy-claro);
              border: 1px solid var(--sundeck-gris-claro);
              border-radius: 8px;
              padding: 20px 25px;
              margin: 0 20px 30px 20px;
            }
            
            .cliente-info h3 {
              color: var(--sundeck-verde);
              margin-bottom: 18px;
              font-size: 16px;
              font-weight: 700;
              border-bottom: 3px solid var(--sundeck-verde);
              padding-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .cliente-info h3::before {
              content: '🏠';
              font-size: 18px;
            }
            
            /* ===== TABLA DE PRODUCTOS FABRICACIÓN ===== */
            .productos-section {
              margin: 0 20px 30px 20px;
            }
            
            .productos-section h3 {
              color: var(--sundeck-verde);
              margin-bottom: 20px;
              font-size: 18px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .productos-section h3::before {
              content: '🔧';
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
              background: var(--sundeck-verde);
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
            
            .productos-table tr:last-child td:first-child {
              border-bottom-left-radius: 8px;
            }
            
            .productos-table tr:last-child td:last-child {
              border-bottom-right-radius: 8px;
            }
            
            /* ===== ESPECIFICACIONES TÉCNICAS ===== */
            .producto-detalle {
              padding: 8px 0;
            }
            
            .producto-titulo {
              font-size: 14px;
              color: var(--sundeck-verde);
              margin-bottom: 8px;
              display: block;
              font-weight: 600;
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
              color: var(--sundeck-gris-oscuro);
              display: inline-block;
              min-width: 100px;
            }
            
            .spec-valor {
              color: var(--sundeck-verde);
              margin-left: 5px;
              font-weight: 500;
            }
            
            .badge-r24 {
              background: var(--sundeck-rojo);
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-weight: bold;
              font-size: 9px;
            }
            
            .badge-motorizado {
              background: var(--sundeck-azul-principal);
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-weight: bold;
              font-size: 9px;
            }
            
            /* ===== INSTRUCCIONES DE FABRICACIÓN ===== */
            .instrucciones-section {
              background: var(--sundeck-gris-muy-claro);
              border: 1px solid var(--sundeck-gris-claro);
              border-radius: 8px;
              padding: 20px 25px;
              margin: 0 20px 30px 20px;
            }
            
            .instrucciones-section h3 {
              color: var(--sundeck-verde);
              margin-bottom: 18px;
              font-size: 16px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .instrucciones-section h3::before {
              content: '📋';
              font-size: 18px;
            }
            
            .instruccion-item {
              margin-bottom: 15px;
              padding: 12px;
              background: var(--sundeck-blanco);
              border-radius: 6px;
              border-left: 4px solid var(--sundeck-verde);
            }
            
            .instruccion-numero {
              font-weight: 700;
              color: var(--sundeck-verde);
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .instruccion-descripcion {
              color: var(--sundeck-gris-oscuro);
              margin-bottom: 8px;
            }
            
            .instruccion-detalles {
              font-size: 10px;
              color: var(--sundeck-gris-medio);
            }
            
            /* ===== FOOTER ===== */
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid var(--sundeck-verde);
              font-size: 12px;
              color: var(--sundeck-gris-medio);
            }
            
            .footer strong {
              color: var(--sundeck-verde);
              display: block;
              margin-bottom: 5px;
            }
            
            /* ===== ESTILOS DE IMPRESIÓN ===== */
            @media print {
              body { margin: 0; }
              .header { margin: 0 0 20px 0; }
              .productos-table { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header Fabricación -->
            <div class="header">
              <div class="logo">
                {{#if logoBase64}}
                <div class="logo-container">
                  <img src="{{logoBase64}}" alt="SUNDECK Logo" />
                </div>
                {{/if}}
              </div>
              <div class="header-info">
                <strong>ÁREA DE FABRICACIÓN</strong>
                Documento técnico sin información comercial<br>
                📍 Acapulco, Guerrero<br>
                📞 Tel: (744) 123-4567
              </div>
            </div>

            <!-- Información de la Orden -->
            <div class="orden-info">
              <h2>{{numero}}</h2>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">📅 Fecha creación:</span>
                    <span class="info-value">{{fechaCreacion}}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">⏰ Inicio estimado:</span>
                    <span class="info-value">{{fechaInicioEstimada}}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">🎯 Estado:</span>
                    <span class="info-value">{{estado}}</span>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">📋 Pedido origen:</span>
                    <span class="info-value">{{pedidoNumero}}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">🏁 Fin estimado:</span>
                    <span class="info-value">{{fechaFinEstimada}}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">⚡ Prioridad:</span>
                    <span class="info-value">{{prioridad}}</span>
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
                    <span class="info-label">📝 Nombre:</span> {{cliente.nombre}}
                  </div>
                  <div class="info-item">
                    <span class="info-label">📞 Teléfono:</span> {{cliente.telefono}}
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">📍 Dirección:</span> {{cliente.direccion}}
                  </div>
                </div>
              </div>
            </div>

            <!-- Productos a Fabricar -->
            <div class="productos-section">
              <h3>Productos a Fabricar</h3>
              <table class="productos-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Medidas</th>
                    <th>Área (m²)</th>
                    <th>Cant.</th>
                    <th>Especificaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each productos}}
                  <tr>
                    <td>
                      <div class="producto-detalle">
                        <span class="producto-titulo">{{nombre}}</span>
                        {{#if requiereR24}}
                        <span class="badge-r24">R24</span>
                        {{/if}}
                        {{#if motorizado}}
                        <span class="badge-motorizado">MOTORIZADO</span>
                        {{/if}}
                        
                        <div class="especificaciones-tecnicas">
                          {{#if color}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">🎨 COLOR:</span>
                            <span class="spec-valor">{{color}}</span>
                          </div>
                          {{/if}}
                          
                          {{#if material}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">🧱 MATERIAL:</span>
                            <span class="spec-valor">{{material}}</span>
                          </div>
                          {{/if}}
                          
                          {{#if esToldo}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">☂️ TIPO TOLDO:</span>
                            <span class="spec-valor">{{tipoToldo}}</span>
                          </div>
                          {{#if kitModelo}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">🔧 KIT:</span>
                            <span class="spec-valor">{{kitModelo}}</span>
                          </div>
                          {{/if}}
                          {{/if}}
                          
                          {{#if motorizado}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">⚙️ MOTOR:</span>
                            <span class="spec-valor">{{motorModelo}}</span>
                          </div>
                          {{#if controlModelo}}
                          <div class="spec-grupo">
                            <span class="spec-categoria">🎮 CONTROL:</span>
                            <span class="spec-valor">{{controlModelo}}</span>
                          </div>
                          {{/if}}
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
                    <td>{{cantidad}}</td>
                    <td>
                      {{#if estadoFabricacion}}
                      <strong>Estado:</strong> {{estadoFabricacion}}<br>
                      {{/if}}
                      {{#if tiempoEstimado}}
                      <strong>Tiempo:</strong> {{tiempoEstimado}} días<br>
                      {{/if}}
                    </td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
            </div>

            <!-- Instrucciones Generales -->
            <div class="instrucciones-section">
              <h3>Instrucciones de Fabricación</h3>
              
              <div class="instruccion-item">
                <div class="instruccion-numero">1. VERIFICACIÓN INICIAL</div>
                <div class="instruccion-descripcion">
                  Revisar todas las medidas y especificaciones antes de iniciar el corte de materiales.
                </div>
                <div class="instruccion-detalles">
                  ⚠️ Cualquier duda consultar con supervisor antes de proceder
                </div>
              </div>
              
              <div class="instruccion-item">
                <div class="instruccion-numero">2. PREPARACIÓN DE MATERIALES</div>
                <div class="instruccion-descripcion">
                  Alistar todos los materiales según especificaciones técnicas de cada producto.
                </div>
                <div class="instruccion-detalles">
                  🔧 Verificar disponibilidad de herrajes y accesorios especiales
                </div>
              </div>
              
              <div class="instruccion-item">
                <div class="instruccion-numero">3. CONTROL DE CALIDAD</div>
                <div class="instruccion-descripcion">
                  Cada producto debe pasar por control de calidad antes de marcarse como terminado.
                </div>
                <div class="instruccion-detalles">
                  ✅ Revisar medidas, funcionamiento y acabados
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer">
              <strong>SUNDECK - ÁREA DE FABRICACIÓN</strong>
              Este documento contiene únicamente información técnica para fabricación.<br>
              No incluye precios ni información comercial.
            </div>
          </div>
        </body>
        </html>
      `;

      const templateData = {
        ...(typeof ordenFabricacion?.toObject === 'function' ? ordenFabricacion.toObject() : ordenFabricacion),
        fechaCreacion: this.formatDate(ordenFabricacion.fechaCreacion),
        fechaInicioEstimada: this.formatDate(ordenFabricacion.fechaInicioEstimada),
        fechaFinEstimada: this.formatDate(ordenFabricacion.fechaFinEstimada),
        logoBase64: logoBase64,
        pedidoNumero: ordenFabricacion.pedido?.numero || 'N/A',
        productos: ordenFabricacion.productos?.map(producto => ({
          ...producto,
          // Asegurar que no se incluyan precios
          precioUnitario: undefined,
          subtotal: undefined,
          precio: undefined,
          costo: undefined
        })) || []
      };

      const template = handlebars.compile(htmlTemplate);
      const html = template(templateData);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      await page.close();

      logger.info('Orden de fabricación generada exitosamente', {
        servicio: 'pdfFabricacionService',
        accion: 'generarOrdenFabricacionPDF',
        numero: ordenFabricacion?.numero,
        size: pdf.length
      });

      return pdf;

    } catch (error) {
      logger.error('Error generando orden de fabricación en PDF', {
        servicio: 'pdfFabricacionService',
        accion: 'generarOrdenFabricacionPDF',
        numero: ordenFabricacion?.numero,
        error: error.message,
        stack: error.stack
      });
      throw new Error('No se pudo generar el PDF de fabricación');
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new PDFFabricacionService();
