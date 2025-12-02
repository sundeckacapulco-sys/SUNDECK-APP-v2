const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

const logsDir = path.join(__dirname, '../../logs');
const combinedLogPath = path.join(logsDir, 'combined-test.log');
const errorLogPath = path.join(logsDir, 'error-test.log');

// Función de sondeo robusta para esperar logs
async function waitForLog(filePath, predicate, timeout = 2000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const entries = content.trim().split(/\r?\n/).filter(Boolean).map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const found = entries.find(predicate);
      if (found) {
        return found;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 50)); // Espera corta entre reintentos
  }
  throw new Error(`Timeout: La entrada de log esperada no se encontró en ${path.basename(filePath)} después de ${timeout}ms`);
}


describe('Logger Estructurado - Winston (Modo Test Definitivo)', () => {

  beforeEach(() => {
    // Truncar archivos para mantener el file descriptor. Es más fiable.
    if (fs.existsSync(combinedLogPath)) fs.writeFileSync(combinedLogPath, '');
    if (fs.existsSync(errorLogPath)) fs.writeFileSync(errorLogPath, '');
  });

  test('Logger escribe correctamente en el archivo combinado', async () => {
    const testId = `write-${Date.now()}`;
    logger.info('Mensaje de escritura', { testId });

    const entry = await waitForLog(combinedLogPath, e => e.testId === testId);

    expect(entry).toBeDefined();
    expect(entry.message).toBe('Mensaje de escritura');
  });

  test('Niveles de log se filtran a los archivos correctos', async () => {
    const errorId = `err-filter-${Date.now()}`;
    const infoId = `info-filter-${Date.now()}`;

    logger.error('Error para filtrar', { testId: errorId });
    logger.info('Info para filtrar', { testId: infoId });

    // Esperar a que el error aparezca en AMBOS archivos
    const combinedError = await waitForLog(combinedLogPath, e => e.testId === errorId);
    const errorFileError = await waitForLog(errorLogPath, e => e.testId === errorId);

    // Esperar a que la info aparezca en el archivo combinado
    const combinedInfo = await waitForLog(combinedLogPath, e => e.testId === infoId);

    expect(combinedError).toBeDefined();
    expect(errorFileError).toBeDefined();
    expect(combinedInfo).toBeDefined();

    // Verificar que la info NO está en el archivo de error
    const errorFileContent = fs.readFileSync(errorLogPath, 'utf8');
    expect(errorFileContent.includes(infoId)).toBe(false);
  });

  test('Métodos de conveniencia funcionan como se espera', async () => {
    const reqId = `req-${Date.now()}`;
    const errId = `err-conv-${Date.now()}`;
    const perfId = `perf-${Date.now()}`;

    const mockReq = { method: 'GET', originalUrl: '/api/test', ip: '127.0.0.1' };
    logger.logRequest(mockReq, 'Request de conveniencia', { testId: reqId });

    const mockError = new Error('Error de conveniencia');
    logger.logError(mockError, { testId: errId });

    logger.logPerformance('Perf de conveniencia', 300, { testId: perfId });

    // Validar cada entrada con el sondeo
    const reqEntry = await waitForLog(combinedLogPath, e => e.testId === reqId);
    expect(reqEntry.method).toBe('GET');

    const errEntry = await waitForLog(errorLogPath, e => e.testId === errId);
    expect(errEntry.stack).toBeDefined();

    const perfEntry = await waitForLog(combinedLogPath, e => e.testId === perfId);
    expect(perfEntry.duration).toBe('300ms');
  });
});
