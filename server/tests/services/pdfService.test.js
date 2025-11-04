jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const pdfService = require('../../services/pdfService');

describe('PDFService helper utilities', () => {
  describe('calcularPrecioControlReal', () => {
    test('devuelve el precio completo cuando la pieza usa control multicanal', () => {
      const piezas = [
        {
          esControlMulticanal: true,
          controlPrecio: 1200,
          motorizado: true
        }
      ];

      const resultado = pdfService.calcularPrecioControlReal(piezas[0], piezas);

      expect(resultado).toBe(1200);
    });

    test('multiplica el precio del control por el número de motores para controles individuales', () => {
      const pieza = {
        esControlMulticanal: false,
        controlPrecio: 450,
        motorizado: true,
        numMotores: 3
      };

      const resultado = pdfService.calcularPrecioControlReal(pieza, []);

      expect(resultado).toBe(1350);
    });
  });

  describe('calcularTiempoInstalacionInteligente', () => {
    test('cuando la cotización no tiene productos devuelve el mínimo de un día', () => {
      const resultado = pdfService.calcularTiempoInstalacionInteligente({ productos: [] });

      expect(resultado).toBe(1);
    });

    test('considera los factores de complejidad para toldos motorizados exteriores', () => {
      const cotizacionCompleja = {
        _id: 'cotizacion123',
        productos: [
          {
            nombre: 'Toldo retráctil premium',
            esToldo: true,
            motorizado: true,
            cantidad: 1,
            requiereObraElectrica: true,
            controlModelo: 'control multicanal premium',
            medidas: [
              {
                ancho: 5,
                alto: 5,
                tipoInstalacion: 'exterior',
                sistema: 'premium'
              }
            ]
          }
        ]
      };

      const resultado = pdfService.calcularTiempoInstalacionInteligente(cotizacionCompleja);

      expect(resultado).toBeGreaterThanOrEqual(5);
      expect(resultado).toBeLessThanOrEqual(10);
      expect(resultado).toBe(9);
    });
  });
});
