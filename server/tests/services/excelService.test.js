jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const excelService = require('../../services/excelService');

describe('ExcelService helper utilities', () => {
  describe('calcularPrecioControlReal', () => {
    test('regresa 0 cuando la pieza no es motorizada o no tiene precio de control', () => {
      const pieza = { motorizado: false, controlPrecio: null };
      const resultado = excelService.calcularPrecioControlReal(pieza, []);

      expect(resultado).toBe(0);
    });

    test('cobra una sola vez cuando el control es multicanal', () => {
      const pieza = {
        motorizado: true,
        esControlMulticanal: true,
        controlPrecio: 800
      };

      const resultado = excelService.calcularPrecioControlReal(pieza, []);

      expect(resultado).toBe(800);
    });

    test('usa la cantidad de medidas como respaldo para calcular el total de controles individuales', () => {
      const pieza = {
        motorizado: true,
        esControlMulticanal: false,
        controlPrecio: 250,
        medidas: [{}, {}, {}]
      };

      const resultado = excelService.calcularPrecioControlReal(pieza, []);

      expect(resultado).toBe(750);
    });
  });

  describe('formatters', () => {
    test('formatCurrency utiliza la configuración local de MXN', () => {
      const valor = excelService.formatCurrency(1234);
      expect(valor).toContain('$');
      expect(valor).toMatch(/1,234\.00|1\,234\.00/);
    });

    test('formatDate devuelve una cadena legible en español', () => {
      const fecha = new Date('2025-01-15T12:30:00Z');
      const resultado = excelService.formatDate(fecha);

      expect(resultado).toEqual(expect.stringContaining('2025'));
      expect(resultado).toEqual(expect.stringContaining('enero'));
    });
  });
});
